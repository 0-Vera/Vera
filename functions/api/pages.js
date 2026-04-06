import { getJsonKV, json, putJsonKV, requireAuth, safeSlug } from "../_lib.js";

async function getPageIndex(env) {
  return await getJsonKV(env, "cms:pages:index", []);
}

export async function onRequestGet({ request, env }) {
  if (!(await requireAuth(request, env))) {
    return json({ ok: false, error: "Yetkisiz" }, 401);
  }

  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");

  if (slug) {
    const normalized = safeSlug(slug);
    const page = await getJsonKV(env, `cms:page:${normalized}`, null);
    return json({ ok: true, page });
  }

  const slugs = await getPageIndex(env);
  const pages = await Promise.all(slugs.map((s) => getJsonKV(env, `cms:page:${s}`, null)));
  return json({ ok: true, pages: pages.filter(Boolean) });
}

export async function onRequestPost({ request, env }) {
  if (!(await requireAuth(request, env))) {
    return json({ ok: false, error: "Yetkisiz" }, 401);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Geçersiz JSON" }, 400);
  }

  const slug = safeSlug(body.slug || body.title);
  const page = {
    id: body.id || crypto.randomUUID(),
    slug,
    title: String(body.title || "Başlıksız Sayfa").slice(0, 140),
    status: body.status === "draft" ? "draft" : "published",
    layout: body.layout || "default",
    html: String(body.html || "<h2>Yeni sayfa</h2><p>İçeriği düzenleyin.</p>"),
    css: String(body.css || ""),
    js: String(body.js || ""),
    seoTitle: String(body.seoTitle || "").slice(0, 160),
    seoDescription: String(body.seoDescription || "").slice(0, 260),
    updatedAt: new Date().toISOString()
  };

  await putJsonKV(env, `cms:page:${slug}`, page);
  const index = await getPageIndex(env);
  if (!index.includes(slug)) {
    index.push(slug);
    await putJsonKV(env, "cms:pages:index", index);
  }

  return json({ ok: true, page });
}

export async function onRequestDelete({ request, env }) {
  if (!(await requireAuth(request, env))) {
    return json({ ok: false, error: "Yetkisiz" }, 401);
  }

  const url = new URL(request.url);
  const slug = safeSlug(url.searchParams.get("slug") || "");
  if (!slug) {
    return json({ ok: false, error: "Slug gerekli" }, 400);
  }

  await env.AUTH_KV.delete(`cms:page:${slug}`);
  const index = await getPageIndex(env);
  const next = index.filter((s) => s !== slug);
  await putJsonKV(env, "cms:pages:index", next);

  return json({ ok: true, slug });
}
