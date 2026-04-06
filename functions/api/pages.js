export async function onRequest(context) {
  const { request, env } = context;
  const kv = env.AUTH_KV;
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");

  if (request.method === "GET") {
    const pages = (await kv.get("pages", { type: "json" })) || [];

    if (slug) {
      const page = pages.find((p) => p.slug === slug);
      return new Response(JSON.stringify({ ok: true, page: page || null }), {
        headers: { "content-type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, pages }), {
      headers: { "content-type": "application/json" },
    });
  }

  if (request.method === "POST") {
    const body = await request.json();
    const pages = (await kv.get("pages", { type: "json" })) || [];

    const cleanPage = {
      title: (body.title || "").trim(),
      slug: (body.slug || "").trim(),
      content: body.content || "",
      seoTitle: (body.seoTitle || "").trim(),
      seoDescription: (body.seoDescription || "").trim(),
      updatedAt: new Date().toISOString(),
    };

    if (!cleanPage.title || !cleanPage.slug) {
      return new Response(
        JSON.stringify({ ok: false, error: "Başlık ve slug gereklidir." }),
        {
          status: 400,
          headers: { "content-type": "application/json" },
        }
      );
    }

    const existingIndex = pages.findIndex((p) => p.slug === cleanPage.slug);

    if (existingIndex >= 0) {
      pages[existingIndex] = {
        ...pages[existingIndex],
        ...cleanPage,
      };
    } else {
      pages.push({
        ...cleanPage,
        createdAt: new Date().toISOString(),
      });
    }

    await kv.put("pages", JSON.stringify(pages));

    return new Response(JSON.stringify({ ok: true, pages }), {
      headers: { "content-type": "application/json" },
    });
  }

  if (request.method === "DELETE") {
    if (!slug) {
      return new Response(
        JSON.stringify({ ok: false, error: "Silmek için slug gerekli." }),
        {
          status: 400,
          headers: { "content-type": "application/json" },
        }
      );
    }

    const pages = (await kv.get("pages", { type: "json" })) || [];
    const filtered = pages.filter((p) => p.slug !== slug);

    await kv.put("pages", JSON.stringify(filtered));

    return new Response(JSON.stringify({ ok: true, pages: filtered }), {
      headers: { "content-type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: false, error: "Geçersiz istek." }), {
    status: 405,
    headers: { "content-type": "application/json" },
  });
}
