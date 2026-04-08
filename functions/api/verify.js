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

function parseCookie(cookieHeader = "") {
  const out = {};
  for (const part of cookieHeader.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (!k) continue;
    out[k] = v.join("=");
  }
  return out;
}

function getClientIp(request) {
  const forwarded = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "";
  return String(forwarded).split(",")[0].trim() || "unknown";
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

async function readSession(token, env) {
  if (!token) return null;
  const raw = await env.AUTH_KV.get(`session:${token}`, { type: "json" });
  return raw || null;
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

  const loginId = String(body.loginId || "").trim();
  const code = String(body.code || "").trim();

  if (!loginId || !code) {
    return json({ ok: false, error: "Kod doğrulama bilgileri eksik" }, 400);
  }

  const raw = await env.AUTH_KV.get(`login:${loginId}`);
  if (!raw) {
    return json({ ok: false, error: "Kod süresi dolmuş veya kayıt bulunamadı" }, 401);
  }

  const data = JSON.parse(raw);
  const attempts = Number(data.attempts || 0);
  if (attempts >= 5) {
    await env.AUTH_KV.delete(`login:${loginId}`);
    return json({ ok: false, error: "Çok fazla hatalı kod denendi. Yeniden giriş yapın." }, 429);
  }

  const incomingHash = await sha256(code);
  if (data.codeHash !== incomingHash) {
    const nextAttempts = attempts + 1;
    await env.AUTH_KV.put(
      `login:${loginId}`,
      JSON.stringify({ ...data, attempts: nextAttempts, lastFailedAt: Date.now(), lastFailedIp: getClientIp(request) }),
      { expirationTtl: 300 }
    );

    if (nextAttempts >= 5) {
      await env.AUTH_KV.delete(`login:${loginId}`);
      return json({ ok: false, error: "Çok fazla hatalı kod denendi. Yeniden giriş yapın." }, 429);
    }

    return json({ ok: false, error: "Kod hatalı" }, 401);
  }

  const sessionToken = crypto.randomUUID();

  await env.AUTH_KV.put(
    `session:${sessionToken}`,
    JSON.stringify({
      username: env.ADMIN_USERNAME,
      email: env.ADMIN_EMAIL,
      createdAt: Date.now(),
      clientIp: getClientIp(request)
    }),
    { expirationTtl: 60 * 60 * 24 * 7 }
  );

  await env.AUTH_KV.delete(`login:${loginId}`);

  const cookie = [
    `vera_session=${sessionToken}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
    "Max-Age=604800"
  ].join("; ");

  return json({ ok: true, message: "Doğrulama başarılı" }, 200, { "Set-Cookie": cookie });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const cookies = parseCookie(request.headers.get("cookie") || "");
  const token = cookies.vera_session;
  const session = await readSession(token, env);

  if (!session) {
    return json({ ok: false, authenticated: false }, 401);
  }

  return json({ ok: true, authenticated: true });
}
