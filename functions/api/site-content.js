function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8"
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

async function checkSession(request, env) {
  const cookies = parseCookie(request.headers.get("cookie") || "");
  const token = cookies.vera_session;
  if (!token) return false;

  const raw = await env.AUTH_KV.get(`session:${token}`);
  return !!raw;
}

function normalizePayload(body = {}) {
  return {
    siteTitle: String(body.siteTitle || "").trim() || "Vera",
    siteDescription: String(body.siteDescription || "").trim() || "Hoş geldiniz.",
    primaryButtonText: String(body.primaryButtonText || "").trim() || "Admin",
    primaryButtonLink: String(body.primaryButtonLink || "").trim() || "/admin",
    secondaryButtonText: String(body.secondaryButtonText || "").trim() || "Giriş",
    secondaryButtonLink: String(body.secondaryButtonLink || "").trim() || "/login"
  };
}

export async function onRequestGet(context) {
  const { env } = context;

  const saved = await env.AUTH_KV.get("site:content", { type: "json" });
  const data = normalizePayload(saved || {});

  return json({ ok: true, content: data });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const authorized = await checkSession(request, env);
  if (!authorized) {
    return json({ ok: false, error: "Yetkisiz" }, 401);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Geçersiz istek" }, 400);
  }

  const data = normalizePayload(body);
  await env.AUTH_KV.put("site:content", JSON.stringify(data));

  return json({ ok: true, content: data });
}
