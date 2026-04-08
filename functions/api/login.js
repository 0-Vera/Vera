async function sha256(text) {
  const data = new TextEncoder().encode(String(text || ""));
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...extraHeaders
    }
  });
}

function randomCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getClientIp(request) {
  const forwarded = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "";
  return String(forwarded).split(",")[0].trim() || "unknown";
}

function makeRateLimitKey(scope, parts = []) {
  return ["rl", scope, ...parts.map((part) => String(part || "-").trim() || "-")].join(":");
}

async function hitRateLimit(env, key, maxAttempts, ttlSeconds) {
  const raw = await env.AUTH_KV.get(key, { type: "json" });
  const count = Number(raw?.count || 0) + 1;
  await env.AUTH_KV.put(key, JSON.stringify({ count, updatedAt: Date.now() }), { expirationTtl: ttlSeconds });
  return {
    count,
    limited: count > maxAttempts,
    remaining: Math.max(0, maxAttempts - count)
  };
}

async function clearRateLimit(env, key) {
  await env.AUTH_KV.delete(key);
}

function ensureSameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    const requestUrl = new URL(request.url);
    return origin === requestUrl.origin;
  } catch {
    return false;
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!ensureSameOrigin(request)) {
    return json({ ok: false, error: "Geçersiz istek kaynağı" }, 403);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Geçersiz istek" }, 400);
  }

  const username = String(body.username || "").trim();
  const password = String(body.password || "").trim();
  const clientIp = getClientIp(request);

  if (!username || !password) {
    return json({ ok: false, error: "Kullanıcı adı ve şifre gerekli" }, 400);
  }

  const credentialLimitKey = makeRateLimitKey("login", [clientIp, username.toLowerCase()]);
  const mailSendLimitKey = makeRateLimitKey("login-mail", [clientIp]);

  const credentialWindow = await env.AUTH_KV.get(credentialLimitKey, { type: "json" });
  if (Number(credentialWindow?.count || 0) >= 5) {
    return json({ ok: false, error: "Çok fazla deneme yapıldı. Birkaç dakika sonra tekrar deneyin." }, 429);
  }

  const usernameValid = username === env.ADMIN_USERNAME;
  const passwordHash = await sha256(password);
  const passwordValid = passwordHash === env.ADMIN_PASSWORD_HASH;

  if (!usernameValid || !passwordValid) {
    await hitRateLimit(env, credentialLimitKey, 5, 60 * 10);
    return json({ ok: false, error: "Giriş bilgileri hatalı" }, 401);
  }

  const mailWindow = await env.AUTH_KV.get(mailSendLimitKey, { type: "json" });
  if (Number(mailWindow?.count || 0) >= 5) {
    return json({ ok: false, error: "Çok sık kod gönderimi denendi. Birkaç dakika sonra tekrar deneyin." }, 429);
  }

  await clearRateLimit(env, credentialLimitKey);
  await hitRateLimit(env, mailSendLimitKey, 5, 60 * 10);

  const code = randomCode();
  const codeHash = await sha256(code);
  const loginId = crypto.randomUUID();

  await env.AUTH_KV.put(
    `login:${loginId}`,
    JSON.stringify({
      codeHash,
      email: env.ADMIN_EMAIL,
      username: env.ADMIN_USERNAME,
      verified: false,
      attempts: 0,
      createdAt: Date.now(),
      clientIp
    }),
    { expirationTtl: 300 }
  );

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: "Vera <onboarding@resend.dev>",
      to: env.ADMIN_EMAIL,
      subject: "Vera giriş doğrulama kodu",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6">
          <h2>Vera giriş doğrulama kodunuz</h2>
          <p style="font-size:32px;font-weight:bold;letter-spacing:4px">${code}</p>
          <p>Bu kod 5 dakika geçerlidir.</p>
        </div>
      `
    })
  });

  if (!resendResponse.ok) {
    const errorText = await resendResponse.text();
    await env.AUTH_KV.delete(`login:${loginId}`);
    return json({ ok: false, error: "Mail gönderilemedi", detail: errorText }, 500);
  }

  return json({
    ok: true,
    message: "Doğrulama kodu mail adresinize gönderildi.",
    loginId
  });
}
