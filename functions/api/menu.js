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

export async function onRequestGet(context) {
  const { env } = context;
  const raw = await env.AUTH_KV.get("menu");
  let menus = [];
  if (raw) {
    try {
      menus = JSON.parse(raw);
    } catch {}
  }
  return json({ ok: true, menus });
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

  let menus;
  if (Array.isArray(body.menus)) {
    menus = body.menus;
  } else if (body.title && body.slug) {
    const raw = await env.AUTH_KV.get("menu");
    menus = raw ? JSON.parse(raw) : [];
    const index = menus.findIndex((m) => m.slug === body.slug);
    if (index >= 0) {
      menus[index] = { ...menus[index], ...body };
    } else {
      menus.push({ title: body.title, slug: body.slug, content: body.content || "" });
    }
  } else {
    return json({ ok: false, error: "Geçersiz veri" }, 400);
  }

  await env.AUTH_KV.put("menu", JSON.stringify(menus));
  return json({ ok: true, menus });
}
