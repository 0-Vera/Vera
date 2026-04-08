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

function ensureSameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    const requestUrl = new URL(request.url);
    return origin === requestUrl.origin;
  } catch {
    return false;
  }
}

function normalizeText(value, fallback = "") {
  const v = String(value || "").trim();
  return v || fallback;
}

function normalizeBool(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function slugify(value, fallback = "sayfa") {
  const map = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u" };
  const normalized = String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[çğıöşü]/g, (m) => map[m] || m)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || fallback;
}

function normalizeLink(value, fallback = "#") {
  const raw = String(value || "").trim();
  if (!raw) return fallback;
  if (raw.startsWith("#")) return raw;
  if (raw.startsWith("/")) return raw;
  if (raw.startsWith("./") || raw.startsWith("../")) return raw;
  if (/^(https?:\/\/|mailto:|tel:)/i.test(raw)) return raw;
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
      {
        id: crypto.randomUUID(),
        text: "Ana Sayfa",
        targetType: "link",
        link: "/",
        pageId: ""
      },
      {
        id: crypto.randomUUID(),
        text: "Admin",
        targetType: "link",
        link: "/admin",
        pageId: ""
      }
    ],
    custom: {
      headHtml: "",
      beforeBodyHtml: "",
      afterBodyHtml: ""
    }
  };
}

function normalizePage(page = {}, index = 0) {
  const title = normalizeText(page.title, `Yeni Sayfa ${index + 1}`);
  return {
    id: normalizeText(page.id, crypto.randomUUID()),
    title,
    slug: slugify(page.slug || title, `sayfa-${index + 1}`),
    status: ["draft", "published"].includes(page.status) ? page.status : "draft",
    isHome: normalizeBool(page.isHome, false)
  };
}

async function readPages(env) {
  const raw = await env.AUTH_KV.get("site:pages", { type: "json" });
  const incoming = Array.isArray(raw?.pages) ? raw.pages : [];
  return incoming.map((page, index) => normalizePage(page, index));
}

function resolvePageLink(page) {
  if (!page) return "#";
  if (page.isHome) return "/";
  const slug = String(page.slug || "").replace(/^\/+/, "");
  return slug ? `/${slug}` : "/";
}

function normalizeMenuItems(items, pages = []) {
  const fallback = defaultSettings().menuItems;

  if (!Array.isArray(items)) {
    return fallback;
  }

  const out = items
    .map((item) => {
      const id = normalizeText(item?.id, crypto.randomUUID());
      const text = normalizeText(item?.text);
      const targetType = item?.targetType === "page" ? "page" : "link";
      const rawPageId = normalizeText(item?.pageId);
      const page = rawPageId ? pages.find((entry) => entry.id === rawPageId) : null;

      if (!text) return null;

      if (targetType === "page") {
        if (!page) return null;

        return {
          id,
          text,
          targetType: "page",
          pageId: page.id,
          link: resolvePageLink(page)
        };
      }

      return {
        id,
        text,
        targetType: "link",
        pageId: "",
        link: normalizeLink(item?.link, "#")
      };
    })
    .filter(Boolean);

  return out.length ? out : fallback;
}

function normalizeCustom(custom = {}, fallback = {}) {
  return {
    headHtml: String(custom.headHtml ?? fallback.headHtml ?? ""),
    beforeBodyHtml: String(custom.beforeBodyHtml ?? fallback.beforeBodyHtml ?? ""),
    afterBodyHtml: String(custom.afterBodyHtml ?? fallback.afterBodyHtml ?? "")
  };
}

function normalizePayload(body = {}, pages = [], base = defaultSettings()) {
  return {
    siteName: normalizeText(body.siteName, base.siteName),
    logoText: normalizeText(body.logoText, base.logoText),
    logoLink: normalizeLink(body.logoLink, base.logoLink),
    contactEmail: normalizeText(body.contactEmail, base.contactEmail),
    contactPhone: normalizeText(body.contactPhone, base.contactPhone),
    footerText: normalizeText(body.footerText, base.footerText),
    showHeader: normalizeBool(body.showHeader, base.showHeader),
    showFooter: normalizeBool(body.showFooter, base.showFooter),
    showTopCta: normalizeBool(body.showTopCta, base.showTopCta),
    topCtaText: normalizeText(body.topCtaText, base.topCtaText),
    topCtaLink: normalizeLink(body.topCtaLink, base.topCtaLink),
    menuItems: normalizeMenuItems(body.menuItems, pages),
    custom: normalizeCustom(body.custom, base.custom)
  };
}

function toPublicSettings(settings = {}) {
  return {
    siteName: settings.siteName,
    logoText: settings.logoText,
    logoLink: settings.logoLink,
    contactEmail: settings.contactEmail,
    contactPhone: settings.contactPhone,
    footerText: settings.footerText,
    showHeader: settings.showHeader,
    showFooter: settings.showFooter,
    showTopCta: settings.showTopCta,
    topCtaText: settings.topCtaText,
    topCtaLink: settings.topCtaLink,
    menuItems: Array.isArray(settings.menuItems) ? settings.menuItems : [],
    custom: normalizeCustom(settings.custom)
  };
}

export async function onRequestGet({ request, env }) {
  const pages = await readPages(env);
  const defaults = defaultSettings();
  const raw = await env.AUTH_KV.get("site:settings", { type: "json" });
  const settings = raw ? normalizePayload(raw, pages, { ...defaults, ...raw, custom: normalizeCustom(raw.custom, defaults.custom) }) : defaults;
  const authorized = await checkSession(request, env);

  if (authorized) {
    return json({ ok: true, settings });
  }

  return json({ ok: true, settings: toPublicSettings(settings) });
}

export async function onRequestPost({ request, env }) {
  if (!ensureSameOrigin(request)) {
    return json({ ok: false, error: "Geçersiz istek kaynağı" }, 403);
  }

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

  const pages = await readPages(env);
  const defaults = defaultSettings();
  const existingRaw = await env.AUTH_KV.get("site:settings", { type: "json" });
  const existing = existingRaw
    ? normalizePayload(existingRaw, pages, { ...defaults, ...existingRaw, custom: normalizeCustom(existingRaw.custom, defaults.custom) })
    : defaults;

  const merged = {
    ...existing,
    ...body,
    custom: {
      ...existing.custom,
      ...(body.custom || {})
    }
  };

  const settings = normalizePayload(merged, pages, existing);
  await env.AUTH_KV.put("site:settings", JSON.stringify(settings));

  return json({ ok: true, settings });
}
