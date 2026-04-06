import { getJsonKV, json, putJsonKV, requireAuth } from "../_lib.js";

export async function onRequestGet({ request, env }) {
  if (!(await requireAuth(request, env))) {
    return json({ ok: false, error: "Yetkisiz" }, 401);
  }

  const assets = await getJsonKV(env, "cms:media:index", []);
  return json({ ok: true, assets });
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

  const assets = await getJsonKV(env, "cms:media:index", []);
  const item = {
    id: crypto.randomUUID(),
    fileName: String(body.fileName || "dosya"),
    url: String(body.url || ""),
    mimeType: String(body.mimeType || "application/octet-stream"),
    size: Number(body.size || 0),
    createdAt: new Date().toISOString()
  };
  assets.unshift(item);
  await putJsonKV(env, "cms:media:index", assets.slice(0, 300));
  return json({ ok: true, item });
}
