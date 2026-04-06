import { getJsonKV, json, putJsonKV, requireAuth } from "../_lib.js";

async function getIndex(env) {
  return await getJsonKV(env, "cms:content:index", []);
}

export async function onRequestGet({ request, env }) {
  if (!(await requireAuth(request, env))) {
    return json({ ok: false, error: "Yetkisiz" }, 401);
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (id) {
    const entry = await getJsonKV(env, `cms:content:${id}`, null);
    return json({ ok: true, entry });
  }

  const ids = await getIndex(env);
  const entries = await Promise.all(ids.map((x) => getJsonKV(env, `cms:content:${x}`, null)));
  return json({ ok: true, entries: entries.filter(Boolean) });
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

  const id = body.id || crypto.randomUUID();
  const entry = {
    id,
    type: String(body.type || "yazi"),
    title: String(body.title || "Başlıksız İçerik"),
    body: String(body.body || ""),
    tags: Array.isArray(body.tags) ? body.tags.map((t) => String(t)) : [],
    featured: Boolean(body.featured),
    link: String(body.link || ""),
    updatedAt: new Date().toISOString()
  };

  await putJsonKV(env, `cms:content:${id}`, entry);
  const index = await getIndex(env);
  if (!index.includes(id)) {
    index.unshift(id);
    await putJsonKV(env, "cms:content:index", index.slice(0, 1000));
  }

  return json({ ok: true, entry });
}
