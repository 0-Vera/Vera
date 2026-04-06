function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8" } });
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
function normalizeText(value = "") { return String(value || "").trim(); }
function normalizeType(value) { return value === "url" ? "url" : "page"; }
function normalizeTarget(value) { return value === "_blank" ? "_blank" : "_self"; }
function normalizeBoolean(value, fallback = true) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}
function normalizeNumber(value, fallback = 0, min = 0, max = 9999) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}
function normalizeMenu(item = {}, index = 0) {
  const type = normalizeType(item.type);
  return {
    title: normalizeText(item.title), slug: normalizeText(item.slug), type,
    pageSlug: type === "page" ? normalizeText(item.pageSlug) : "",
    url: type === "url" ? normalizeText(item.url) : "",
    target: normalizeTarget(item.target), parentSlug: normalizeText(item.parentSlug),
    visible: normalizeBoolean(item.visible, true), order: normalizeNumber(item.order, index, 0, 9999)
  };
}
function cleanMenus(items = []) {
  return items.map((item, index) => normalizeMenu(item, index)).filter((item) => {
    if (!item.title || !item.slug) return false;
    if (item.type === "page" && !item.pageSlug) return false;
    if (item.type === "url" && !item.url) return false;
    return true;
  }).sort((a, b) => (a.order || 0) - (b.order || 0)).map((item, index) => ({ ...item, order: index }));
}
export async function onRequestGet(context) {
  const menus = (await context.env.AUTH_KV.get("menu", { type: "json" })) || [];
  return json({ ok: true, menus: cleanMenus(menus) });
}
export async function onRequestPost(context) {
  const { request, env } = context;
  if (!await checkSession(request, env)) return json({ ok: false, error: "Yetkisiz" }, 401);
  let body; try { body = await request.json(); } catch { return json({ ok: false, error: "Geçersiz istek" }, 400); }
  let menus = (await env.AUTH_KV.get("menu", { type: "json" })) || [];
  const item = normalizeMenu(body, menus.length);
  const index = menus.findIndex((m) => m.slug === item.slug);
  if (index >= 0) menus[index] = { ...menus[index], ...item }; else menus.push(item);
  menus = cleanMenus(menus); await env.AUTH_KV.put("menu", JSON.stringify(menus));
  return json({ ok: true, menus });
}
export async function onRequestDelete(context) {
  const { request, env } = context;
  if (!await checkSession(request, env)) return json({ ok: false, error: "Yetkisiz" }, 401);
  const slug = normalizeText(new URL(request.url).searchParams.get("slug"));
  let menus = (await env.AUTH_KV.get("menu", { type: "json" })) || [];
  menus = cleanMenus(menus.filter((m) => m.slug !== slug).map((m) => m.parentSlug === slug ? { ...m, parentSlug: "" } : m));
  await env.AUTH_KV.put("menu", JSON.stringify(menus));
  return json({ ok: true, menus });
}
