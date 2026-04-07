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

function normalizeHex(value, fallback) {
  const v = String(value || "").trim();
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v) ? v : fallback;
}

function normalizeNumber(value, fallback, min = 0, max = 9999) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function normalizeBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function defaultSettings() {
  return {
    siteName: "Vera",
    siteTagline: "Kurumsal web yönetim paneli",
    logoText: "Vera",
    logoUrl: "/",
    showTopbar: true,
    showFooter: true,
    footerText: "© Vera. Tüm hakları saklıdır.",
    contactEmail: "",
    contactPhone: "",
    whatsapp: "",
    instagram: "",
    facebook: "",
    linkedin: "",
    youtube: "",
    theme: {
      bodyBg: "#f8fafc",
      bodyText: "#0f172a",
      borderColor: "#e2e8f0",
      primaryColor: "#2563eb",
      panelColor: "#ffffff",
      containerWidth: 1200
    },
    header: {
      sticky: false,
      height: 72,
      paddingX: 24,
      showLogo: true,
      showMenu: true,
      ctaText: "İletişim",
      ctaLink: "/iletisim"
    },
    footer: {
      columns: 3,
      showSocials: true,
      showContact: true,
      note: ""
    },
    custom: {
      headHtml: "",
      beforeBodyHtml: "",
      afterBodyHtml: ""
    }
  };
}

function normalizePayload(body = {}) {
  const base = defaultSettings();
  return {
    siteName: normalizeText(body.siteName, base.siteName),
    siteTagline: normalizeText(body.siteTagline, base.siteTagline),
    logoText: normalizeText(body.logoText, base.logoText),
    logoUrl: normalizeText(body.logoUrl, base.logoUrl),
    showTopbar: normalizeBoolean(body.showTopbar, base.showTopbar),
    showFooter: normalizeBoolean(body.showFooter, base.showFooter),
    footerText: normalizeText(body.footerText, base.footerText),
    contactEmail: normalizeText(body.contactEmail),
    contactPhone: normalizeText(body.contactPhone),
    whatsapp: normalizeText(body.whatsapp),
    instagram: normalizeText(body.instagram),
    facebook: normalizeText(body.facebook),
    linkedin: normalizeText(body.linkedin),
    youtube: normalizeText(body.youtube),
    theme: {
      bodyBg: normalizeHex(body.theme?.bodyBg, base.theme.bodyBg),
      bodyText: normalizeHex(body.theme?.bodyText, base.theme.bodyText),
      borderColor: normalizeHex(body.theme?.borderColor, base.theme.borderColor),
      primaryColor: normalizeHex(body.theme?.primaryColor, base.theme.primaryColor),
      panelColor: normalizeHex(body.theme?.panelColor, base.theme.panelColor),
      containerWidth: normalizeNumber(body.theme?.containerWidth, base.theme.containerWidth, 640, 1800)
    },
    header: {
      sticky: normalizeBoolean(body.header?.sticky, base.header.sticky),
      height: normalizeNumber(body.header?.height, base.header.height, 48, 140),
      paddingX: normalizeNumber(body.header?.paddingX, base.header.paddingX, 0, 80),
      showLogo: normalizeBoolean(body.header?.showLogo, base.header.showLogo),
      showMenu: normalizeBoolean(body.header?.showMenu, base.header.showMenu),
      ctaText: normalizeText(body.header?.ctaText, base.header.ctaText),
      ctaLink: normalizeText(body.header?.ctaLink, base.header.ctaLink)
    },
    footer: {
      columns: normalizeNumber(body.footer?.columns, base.footer.columns, 1, 6),
      showSocials: normalizeBoolean(body.footer?.showSocials, base.footer.showSocials),
      showContact: normalizeBoolean(body.footer?.showContact, base.footer.showContact),
      note: normalizeText(body.footer?.note)
    },
    custom: {
      headHtml: String(body.custom?.headHtml || ""),
      beforeBodyHtml: String(body.custom?.beforeBodyHtml || ""),
      afterBodyHtml: String(body.custom?.afterBodyHtml || "")
    }
  };
}

export async function onRequestGet({ env }) {
  const raw = await env.AUTH_KV.get("site:settings", { type: "json" });
  const settings = raw ? normalizePayload(raw) : defaultSettings();
  return json({ ok: true, settings });
}

export async function onRequestPost({ request, env }) {
  const authorized = await checkSession(request, env);
  if (!authorized) return json({ ok: false, error: "Yetkisiz" }, 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Geçersiz JSON" }, 400);
  }

  const settings = normalizePayload(body);
  await env.AUTH_KV.put("site:settings", JSON.stringify(settings));
  return json({ ok: true, settings });
}
