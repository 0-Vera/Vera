
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

function normalizeBool(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
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

function normalizeAction(action = {}, fallbackLink = "#") {
  const type = [
    "none",
    "url",
    "page",
    "anchor",
    "email",
    "phone",
    "whatsapp",
    "download"
  ].includes(action?.type)
    ? action.type
    : "url";

  return {
    type,
    url: normalizeLink(action?.url, normalizeLink(fallbackLink, "#")),
    pageId: normalizeText(action?.pageId),
    anchor: normalizeText(action?.anchor),
    email: normalizeText(action?.email),
    phone: normalizeText(action?.phone),
    whatsapp: normalizeText(action?.whatsapp),
    downloadUrl: normalizeLink(action?.downloadUrl, ""),
    newTab: normalizeBool(action?.newTab, false)
  };
}

function defaultAction(url = "#") {
  return {
    type: "url",
    url,
    pageId: "",
    anchor: "",
    email: "",
    phone: "",
    whatsapp: "",
    downloadUrl: "",
    newTab: false
  };
}

function defaultFooterColumns() {
  return [
    {
      id: crypto.randomUUID(),
      title: "Kurumsal",
      text: "",
      links: [
        { id: crypto.randomUUID(), text: "Ana Sayfa", action: defaultAction("/") }
      ]
    },
    {
      id: crypto.randomUUID(),
      title: "İletişim",
      text: "",
      links: []
    }
  ];
}

function defaultSocialLinks() {
  return [
    { id: crypto.randomUUID(), label: "Instagram", action: defaultAction("https://instagram.com") },
    { id: crypto.randomUUID(), label: "LinkedIn", action: defaultAction("https://linkedin.com") }
  ];
}

function defaultSettings() {
  return {
    siteName: "Vera",
    logoText: "Vera",
    logoLink: "/",
    contactEmail: "",
    contactPhone: "",
    contactAddress: "",
    footerText: "© Vera",
    showHeader: true,
    showFooter: true,
    showTopCta: true,
    topCtaText: "İletişim",
    topCtaLink: "/iletisim",
    topCtaStyle: "primary",
    topCtaAction: defaultAction("/iletisim"),
    menuItems: [
      {
        id: crypto.randomUUID(),
        text: "Ana Sayfa",
        targetType: "link",
        link: "/",
        pageId: "",
        action: defaultAction("/")
      },
      {
        id: crypto.randomUUID(),
        text: "Admin",
        targetType: "link",
        link: "/admin",
        pageId: "",
        action: defaultAction("/admin")
      }
    ],
    header: {
      sticky: true,
      transparent: false,
      showContactBar: false,
      contactBarText: "",
      ctaStyle: "primary"
    },
    footer: {
      showContactInfo: true,
      bottomText: "© Vera",
      columns: defaultFooterColumns(),
      socialLinks: defaultSocialLinks()
    },
    theme: {
      bodyBg: "#f8fafc",
      bodyText: "#0f172a",
      borderColor: "#e2e8f0",
      primaryColor: "#2563eb",
      secondaryColor: "#0f172a",
      surfaceColor: "#ffffff",
      mutedText: "#64748b",
      headerBg: "#ffffff",
      footerBg: "#ffffff",
      containerWidth: 1200,
      fontFamily: "Arial, sans-serif",
      radius: 18,
      buttonRadius: 12
    },
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
      const action = normalizeAction(item?.action, item?.link);
      const targetType = action.type === "page" ? "page" : (item?.targetType === "page" ? "page" : "link");
      const rawPageId = normalizeText(action.pageId || item?.pageId);
      const page = rawPageId ? pages.find((entry) => entry.id === rawPageId) : null;

      if (!text) return null;

      if (targetType === "page" && page) {
        const pageLink = resolvePageLink(page);
        return {
          id,
          text,
          targetType: "page",
          pageId: page.id,
          link: pageLink,
          action: {
            ...action,
            type: "page",
            pageId: page.id,
            url: pageLink,
            anchor: "",
            email: "",
            phone: "",
            whatsapp: "",
            downloadUrl: ""
          }
        };
      }

      return {
        id,
        text,
        targetType: "link",
        pageId: "",
        link: normalizeLink(item?.link || action.url, "#"),
        action
      };
    })
    .filter(Boolean);

  return out.length ? out : fallback;
}

function normalizeFooterLink(item = {}, pages = []) {
  const text = normalizeText(item?.text);
  if (!text) return null;
  const action = normalizeAction(item?.action, item?.link);
  if (action.type === "page" && action.pageId) {
    const page = pages.find((entry) => entry.id === action.pageId);
    if (page) {
      const link = resolvePageLink(page);
      return {
        id: normalizeText(item?.id, crypto.randomUUID()),
        text,
        action: { ...action, url: link }
      };
    }
  }
  return {
    id: normalizeText(item?.id, crypto.randomUUID()),
    text,
    action
  };
}

function normalizeFooterColumns(columns, pages = []) {
  const fallback = defaultFooterColumns();
  if (!Array.isArray(columns)) return fallback;

  const normalized = columns
    .map((col) => {
      const title = normalizeText(col?.title);
      const text = normalizeText(col?.text);
      const links = Array.isArray(col?.links)
        ? col.links.map((item) => normalizeFooterLink(item, pages)).filter(Boolean)
        : [];
      if (!title && !text && !links.length) return null;
      return {
        id: normalizeText(col?.id, crypto.randomUUID()),
        title,
        text,
        links
      };
    })
    .filter(Boolean);

  return normalized.length ? normalized : fallback;
}

function normalizeSocialLinks(items, pages = []) {
  const fallback = defaultSocialLinks();
  if (!Array.isArray(items)) return fallback;

  const normalized = items
    .map((item) => {
      const label = normalizeText(item?.label || item?.text);
      if (!label) return null;
      return {
        id: normalizeText(item?.id, crypto.randomUUID()),
        label,
        action: normalizeAction(item?.action, item?.url || item?.link || "#")
      };
    })
    .filter(Boolean);

  return normalized.length ? normalized : fallback;
}

function normalizeTheme(theme = {}) {
  const base = defaultSettings().theme;
  return {
    bodyBg: normalizeText(theme.bodyBg, base.bodyBg),
    bodyText: normalizeText(theme.bodyText, base.bodyText),
    borderColor: normalizeText(theme.borderColor, base.borderColor),
    primaryColor: normalizeText(theme.primaryColor, base.primaryColor),
    secondaryColor: normalizeText(theme.secondaryColor, base.secondaryColor),
    surfaceColor: normalizeText(theme.surfaceColor, base.surfaceColor),
    mutedText: normalizeText(theme.mutedText, base.mutedText),
    headerBg: normalizeText(theme.headerBg, base.headerBg),
    footerBg: normalizeText(theme.footerBg, base.footerBg),
    containerWidth: clampNumber(theme.containerWidth, 480, 2400, base.containerWidth),
    fontFamily: normalizeText(theme.fontFamily, base.fontFamily),
    radius: clampNumber(theme.radius, 0, 48, base.radius),
    buttonRadius: clampNumber(theme.buttonRadius, 0, 48, base.buttonRadius)
  };
}

function normalizePayload(body = {}, pages = []) {
  const base = defaultSettings();

  const footerBottomText = normalizeText(body?.footer?.bottomText || body?.footerText, base.footer.bottomText);
  const headerCtaStyle = ["primary", "secondary", "ghost"].includes(body?.header?.ctaStyle)
    ? body.header.ctaStyle
    : (["primary", "secondary", "ghost"].includes(body?.topCtaStyle) ? body.topCtaStyle : base.header.ctaStyle);

  return {
    siteName: normalizeText(body.siteName, base.siteName),
    logoText: normalizeText(body.logoText, base.logoText),
    logoLink: normalizeLink(body.logoLink, base.logoLink),
    contactEmail: normalizeText(body.contactEmail),
    contactPhone: normalizeText(body.contactPhone),
    contactAddress: normalizeText(body.contactAddress),
    footerText: footerBottomText,
    showHeader: normalizeBool(body.showHeader, base.showHeader),
    showFooter: normalizeBool(body.showFooter, base.showFooter),
    showTopCta: normalizeBool(body.showTopCta, base.showTopCta),
    topCtaText: normalizeText(body.topCtaText, base.topCtaText),
    topCtaLink: normalizeLink(body.topCtaLink, base.topCtaLink),
    topCtaStyle: headerCtaStyle,
    topCtaAction: normalizeAction(body.topCtaAction, body.topCtaLink || base.topCtaLink),
    menuItems: normalizeMenuItems(body.menuItems, pages),
    header: {
      sticky: normalizeBool(body?.header?.sticky, base.header.sticky),
      transparent: normalizeBool(body?.header?.transparent, base.header.transparent),
      showContactBar: normalizeBool(body?.header?.showContactBar, base.header.showContactBar),
      contactBarText: normalizeText(body?.header?.contactBarText),
      ctaStyle: headerCtaStyle
    },
    footer: {
      showContactInfo: normalizeBool(body?.footer?.showContactInfo, base.footer.showContactInfo),
      bottomText: footerBottomText,
      columns: normalizeFooterColumns(body?.footer?.columns, pages),
      socialLinks: normalizeSocialLinks(body?.footer?.socialLinks, pages)
    },
    theme: normalizeTheme(body.theme || {}),
    custom: {
      headHtml: String(body?.custom?.headHtml || ""),
      beforeBodyHtml: String(body?.custom?.beforeBodyHtml || ""),
      afterBodyHtml: String(body?.custom?.afterBodyHtml || "")
    }
  };
}

export async function onRequestGet({ env }) {
  const pages = await readPages(env);
  const raw = await env.AUTH_KV.get("site:settings", { type: "json" });
  const settings = raw ? normalizePayload(raw, pages) : defaultSettings();
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

  const pages = await readPages(env);
  const settings = normalizePayload(body, pages);

  await env.AUTH_KV.put("site:settings", JSON.stringify(settings));

  return json({ ok: true, settings });
}
