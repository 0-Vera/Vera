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
  const menus = (await env.AUTH_KV.get("menu", { type: "json" })) || [];
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

  let menus = (await env.AUTH_KV.get("menu", { type: "json" })) || [];

  if (Array.isArray(body.menus)) {
    menus = body.menus.map((item, index) => ({
      title: (item.title || "").trim(),
      slug: (item.slug || "").trim(),
      pageSlug: (item.pageSlug || "").trim(),
      order: typeof item.order === "number" ? item.order : index
    }));
  } else {
    const item = {
      title: (body.title || "").trim(),
      slug: (body.slug || "").trim(),
      pageSlug: (body.pageSlug || "").trim(),
      order: Number.isFinite(body.order) ? body.order : menus.length
    };

    if (!item.title || !item.slug || !item.pageSlug) {
      return json({ ok: false, error: "Başlık, slug ve sayfa seçimi gereklidir." }, 400);
    }

    const index = menus.findIndex((m) => m.slug === item.slug);

    if (index >= 0) {
      menus[index] = {
        ...menus[index],
        ...item
      };
    } else {
      menus.push(item);
    }
  }

  menus = menus
    .filter((m) => m.title && m.slug && m.pageSlug)
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((m, index) => ({ ...m, order: index }));

  await env.AUTH_KV.put("menu", JSON.stringify(menus));
  return json({ ok: true, menus });
}

export async function onRequestDelete(context) {
  const { request, env } = context;
  const authorized = await checkSession(request, env);
  if (!authorized) {
    return json({ ok: false, error: "Yetkisiz" }, 401);
  }

  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");

  if (!slug) {
    return json({ ok: false, error: "Silmek için slug gerekli." }, 400);
  }

  let menus = (await env.AUTH_KV.get("menu", { type: "json" })) || [];
  menus = menus.filter((m) => m.slug !== slug).map((m, index) => ({ ...m, order: index }));

  await env.AUTH_KV.put("menu", JSON.stringify(menus));
  return json({ ok: true, menus });
}
