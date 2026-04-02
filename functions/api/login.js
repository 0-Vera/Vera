async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  });
}

function randomCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Geçersiz istek" }, 400);
  }

  const username = String(body.username || "").trim();
  const password = String(body.password || "").trim();

  if (!username || !password) {
    return json({ ok: false, error: "Kullanıcı adı ve şifre gerekli" }, 400);
  }

  if (username !== env.ADMIN_USERNAME) {
    return json({ ok: false, error: "Giriş bilgileri hatalı" }, 401);
  }

  const passwordHash = await sha256(password);

  if (passwordHash !== env.ADMIN_PASSWORD_HASH) {
    return json({ ok: false, error: "Giriş bilgileri hatalı" }, 401);
  }

  const code = randomCode();
  const loginId = crypto.randomUUID();

  await env.AUTH_KV.put(
    `login:${loginId}`,
    JSON.stringify({
      code,
      email: env.ADMIN_EMAIL,
      verified: false,
      createdAt: Date.now()
    }),
    { expirationTtl: 300 }
  );

  return json({
    ok: true,
    message: "İlk doğrulama başarılı",
    loginId,
    debugCode: code
  });
}
