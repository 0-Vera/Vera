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

function normalizeText(value, fallback = "") {
  const v = String(value || "").trim();
  return v || fallback;
}

function normalizeNumber(value, fallback, min = 0, max = 9999) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function normalizeColor(value, fallback) {
  const v = String(value || "").trim();
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v) ? v : fallback;
}

function normalizeBool(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function defaultSettings() {
  return {
    siteName: "Vera",
    logoText: "Vera",
    logoLink: "/",
    contactEmail: "",
    contactPhone: "",
    footerText: "© Vera",
    showHeader: true,
    showFooter: true,
    showTopCta: true,
    topCtaText: "İletişim",
    topCtaLink: "/iletisim",
    menuItems: [
      { id: crypto.randomUUID(), text: "Ana Sayfa", link: "/" },
      { id: crypto.randomUUID(), text: "Admin", link: "/admin" }
    ]
  };
}

function normalizeMenuItems(items) {
  if (!Array.isArray(items)) return defaultSettings().menuItems;

  const out = items
    .map((item) => ({
      id: normalizeText(item?.id, crypto.randomUUID()),
      text: normalizeText(item?.text),
      link: normalizeText(item?.link, "#")
    }))
    .filter((item) => item.text);

  return out.length ? out : defaultSettings().menuItems;
}

function normalizePayload(body = {}) {
  const base = defaultSettings();
  return {
    siteName: normalizeText(body.siteName, base.siteName),
    logoText: normalizeText(body.logoText, base.logoText),
    logoLink: normalizeText(body.logoLink, base.logoLink),
    contactEmail: normalizeText(body.contactEmail),
    contactPhone: normalizeText(body.contactPhone),
    footerText: normalizeText(body.footerText, base.footerText),
    showHeader: normalizeBool(body.showHeader, base.showHeader),
    showFooter: normalizeBool(body.showFooter, base.showFooter),
    showTopCta: normalizeBool(body.showTopCta, base.showTopCta),
    topCtaText: normalizeText(body.topCtaText, base.topCtaText),
    topCtaLink: normalizeText(body.topCtaLink, base.topCtaLink),
    menuItems: normalizeMenuItems(body.menuItems)
  };
}

export async function onRequestGet({ env }) {
  const raw = await env.AUTH_KV.get("site:settings", { type: "json" });
  const settings = raw ? normalizePayload(raw) : defaultSettings();
  return json({ ok: true, settings });
}

export async function onRequestPost({ request, env }) {
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

  const settings = normalizePayload(body);
  await env.AUTH_KV.put("site:settings", JSON.stringify(settings));

  return json({ ok: true, settings });
}
