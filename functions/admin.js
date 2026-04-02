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

export async function onRequestPost(context) {
  const { request, env } = context;

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

  if (data.code !== code) {
    return json({ ok: false, error: "Kod hatalı" }, 401);
  }

  const sessionToken = crypto.randomUUID();

  await env.AUTH_KV.put(
    `session:${sessionToken}`,
    JSON.stringify({
      username: env.ADMIN_USERNAME,
      email: env.ADMIN_EMAIL,
      createdAt: Date.now()
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

  return json(
    { ok: true, message: "Doğrulama başarılı" },
    200,
    { "Set-Cookie": cookie }
  );
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const cookies = parseCookie(request.headers.get("cookie") || "");
  const token = cookies.vera_session;

  if (!token) {
    return json({ ok: false, authenticated: false }, 401);
  }

  const raw = await env.AUTH_KV.get(`session:${token}`);
  if (!raw) {
    return json({ ok: false, authenticated: false }, 401);
  }

  return json({ ok: true, authenticated: true });
}
