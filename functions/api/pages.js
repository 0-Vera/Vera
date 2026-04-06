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

export async function onRequest(context) {
  const { request, env } = context;
  const kv = env.AUTH_KV;
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");

  if (request.method === "GET") {
    const pages = (await kv.get("pages", { type: "json" })) || [];

    if (slug) {
      const page = pages.find((p) => p.slug === slug) || null;
      return json({ ok: true, page });
    }

    return json({ ok: true, pages });
  }

  const authorized = await checkSession(request, env);
  if (!authorized) {
    return json({ ok: false, error: "Yetkisiz" }, 401);
  }

  if (request.method === "POST") {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: "Geçersiz istek" }, 400);
    }

    const pages = (await kv.get("pages", { type: "json" })) || [];

    const cleanPage = {
      title: (body.title || "").trim(),
      slug: (body.slug || "").trim(),
      content: body.content || "",
      seoTitle: (body.seoTitle || "").trim(),
      seoDescription: (body.seoDescription || "").trim(),
      updatedAt: new Date().toISOString()
    };

    if (!cleanPage.title || !cleanPage.slug) {
      return json({ ok: false, error: "Başlık ve slug gereklidir." }, 400);
    }

    const index = pages.findIndex((p) => p.slug === cleanPage.slug);

    if (index >= 0) {
      pages[index] = {
        ...pages[index],
        ...cleanPage
      };
    } else {
      pages.push({
        ...cleanPage,
        createdAt: new Date().toISOString()
      });
    }

    await kv.put("pages", JSON.stringify(pages));
    return json({ ok: true, pages });
  }

  if (request.method === "DELETE") {
    if (!slug) {
      return json({ ok: false, error: "Silmek için slug gerekli." }, 400);
    }

    const pages = (await kv.get("pages", { type: "json" })) || [];
    const filtered = pages.filter((p) => p.slug !== slug);

    await kv.put("pages", JSON.stringify(filtered));

    return json({ ok: true, pages: filtered });
  }

  return json({ ok: false, error: "Geçersiz metod" }, 405);
}
