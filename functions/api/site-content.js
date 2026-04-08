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

function uid() {
  return crypto.randomUUID();
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

function normalizeTheme(theme = {}) {
  return {
    bodyBg: normalizeColor(theme.bodyBg, "#f8fafc"),
    bodyText: normalizeColor(theme.bodyText, "#0f172a"),
    borderColor: normalizeColor(theme.borderColor, "#e2e8f0"),
    primaryColor: normalizeColor(theme.primaryColor, "#2563eb"),
    containerWidth: normalizeNumber(theme.containerWidth, 1200, 640, 2400)
  };
}

function baseStyle(block = {}, index = 0, type = "text") {
  return {
    id: String(block.id || uid()),
    order: Number.isFinite(Number(block.order)) ? Number(block.order) : index,
    type,
    visible: block.visible !== false,
    background: normalizeText(block.background, "#ffffff"),
    color: normalizeText(block.color, "#0f172a"),
    padding: normalizeNumber(block.padding, 24, 0, 240),
    radius: normalizeNumber(block.radius, 18, 0, 80),
    align: ["left", "center", "right"].includes(block.align) ? block.align : "left",
    maxWidth: normalizeNumber(block.maxWidth, 100, 30, 100),
    cssClass: normalizeText(block.cssClass),
    htmlId: normalizeText(block.htmlId),
    layoutMode: block.layoutMode === "free" ? "free" : "grid",
    fullWidth: normalizeBool(block.fullWidth, false),
    surface: normalizeBool(block.surface, true),
    colStartDesktop: normalizeNumber(block.colStartDesktop, 1, 1, 12),
    colSpanDesktop: normalizeNumber(block.colSpanDesktop, 12, 1, 12),
    colStartTablet: normalizeNumber(block.colStartTablet, 1, 1, 12),
    colSpanTablet: normalizeNumber(block.colSpanTablet, 12, 1, 12),
    colStartMobile: normalizeNumber(block.colStartMobile, 1, 1, 12),
    colSpanMobile: normalizeNumber(block.colSpanMobile, 12, 1, 12),
    rowStartDesktop: normalizeNumber(block.rowStartDesktop, 1, 1, 500),
    rowSpan: normalizeNumber(block.rowSpan, 1, 1, 12),
    minHeight: normalizeNumber(block.minHeight, 0, 0, 2000),
    contentWidthMode: block.contentWidthMode === "boxed" ? "boxed" : "full",
    innerMaxWidth: normalizeNumber(block.innerMaxWidth, 100, 20, 100),
    tableHeaders: normalizeText(block.tableHeaders),
    tableRows: normalizeText(block.tableRows)
  };
}

function normalizeBlock(block = {}, index = 0) {
  const type = String(block.type || "text").trim();

  if (type === "hero") {
    return {
      ...baseStyle(block, index, "hero"),
      title: normalizeText(block.title, "Başlık"),
      text: normalizeText(block.text, "Açıklama"),
      primaryText: normalizeText(block.primaryText),
      primaryLink: normalizeText(block.primaryLink),
      secondaryText: normalizeText(block.secondaryText),
      secondaryLink: normalizeText(block.secondaryLink)
    };
  }

  if (type === "image") {
    return {
      ...baseStyle(block, index, "image"),
      src: normalizeText(block.src),
      alt: normalizeText(block.alt),
      width: normalizeText(block.width, "100%"),
      link: normalizeText(block.link)
    };
  }

  if (type === "button") {
    return {
      ...baseStyle(block, index, "button"),
      text: normalizeText(block.text, "Buton"),
      link: normalizeText(block.link, "#"),
      style: ["primary", "secondary"].includes(block.style) ? block.style : "primary"
    };
  }

  if (type === "html") {
    return {
      ...baseStyle(block, index, "html"),
      html: String(block.html || "")
    };
  }

  if (type === "spacer") {
    return {
      ...baseStyle(block, index, "spacer"),
      height: normalizeNumber(block.height, 32, 0, 400),
      background: "transparent"
    };
  }

  if (type === "table") {
    return {
      ...baseStyle(block, index, "table"),
      tableHeaders: normalizeText(block.tableHeaders, "Sütun 1,Sütun 2"),
      tableRows: normalizeText(block.tableRows, "Değer 1|Değer 2")
    };
  }

  return {
    ...baseStyle(block, index, "text"),
    title: normalizeText(block.title),
    text: normalizeText(block.text, "Metin")
  };
}

function normalizeOverrides(overrides = {}) {
  return {
    html: String(overrides.html || ""),
    css: String(overrides.css || ""),
    js: String(overrides.js || "")
  };
}

function normalizePageOptions(options = {}) {
  return {
    showHeader: normalizeBool(options.showHeader, true),
    showFooter: normalizeBool(options.showFooter, true),
    customBodyClass: normalizeText(options.customBodyClass),
    contentWidth: normalizeNumber(options.contentWidth, 1200, 480, 2400),
    pagePaddingX: normalizeNumber(options.pagePaddingX, 24, 0, 120),
    sectionGap: normalizeNumber(options.sectionGap, 18, 0, 120),
    gridColumns: normalizeNumber(options.gridColumns, 12, 1, 12)
  };
}

function normalizePayload(body = {}) {
  const blocks = Array.isArray(body.blocks) ? body.blocks : [];

  return {
    pageTitle: normalizeText(body.pageTitle, "Vera"),
    metaDescription: normalizeText(body.metaDescription, "Hoş geldiniz."),
    theme: normalizeTheme(body.theme || {}),
    overrides: normalizeOverrides(body.overrides || {}),
    pageOptions: normalizePageOptions(body.pageOptions || {}),
    blocks: blocks.map((block, index) => normalizeBlock(block, index)).sort((a, b) => a.order - b.order)
  };
}

function defaultPayload() {
  return {
    pageTitle: "Vera",
    metaDescription: "Hoş geldiniz.",
    theme: normalizeTheme({}),
    overrides: normalizeOverrides({}),
    pageOptions: normalizePageOptions({}),
    blocks: [
      {
        id: uid(),
        order: 0,
        type: "hero",
        visible: true,
        title: "Vera",
        text: "Hoş geldiniz.",
        primaryText: "Admin",
        primaryLink: "/admin",
        secondaryText: "Giriş",
        secondaryLink: "/login",
        background: "#ffffff",
        color: "#0f172a",
        padding: 32,
        radius: 20,
        align: "center",
        maxWidth: 100,
        cssClass: "",
        htmlId: "",
        layoutMode: "grid",
        fullWidth: true,
        surface: true,
        colStartDesktop: 1,
        colSpanDesktop: 12,
        colStartTablet: 1,
        colSpanTablet: 12,
        colStartMobile: 1,
        colSpanMobile: 12,
        rowStartDesktop: 1,
        rowSpan: 1,
        minHeight: 0,
        contentWidthMode: "full",
        innerMaxWidth: 100,
        tableHeaders: "",
        tableRows: ""
      }
    ]
  };
}

function normalizePagesHome(page = null, legacy = null) {
  if (!page) {
    return legacy ? normalizePayload(legacy) : defaultPayload();
  }

  const legacyTheme = legacy?.theme || {};
  const pageTheme = page?.theme || {};

  return {
    pageTitle: normalizeText(page.metaTitle || page.title, legacy?.pageTitle || "Vera"),
    metaDescription: normalizeText(page.metaDescription, legacy?.metaDescription || "Hoş geldiniz."),
    theme: normalizeTheme({ ...legacyTheme, ...pageTheme }),
    overrides: normalizeOverrides(page.overrides || legacy?.overrides || {}),
    pageOptions: normalizePageOptions(page.pageOptions || legacy?.pageOptions || {}),
    blocks: Array.isArray(page.blocks)
      ? page.blocks.map((block, index) => normalizeBlock(block, index)).sort((a, b) => a.order - b.order)
      : normalizePayload(legacy || {}).blocks
  };
}

async function readPages(env) {
  const raw = await env.AUTH_KV.get("site:pages", { type: "json" });
  return Array.isArray(raw?.pages) ? raw.pages : [];
}

export async function onRequestGet(context) {
  const { env } = context;
  const legacy = await env.AUTH_KV.get("site:content", { type: "json" });
  const pages = await readPages(env);
  const homePage = pages.find((page) => page?.isHome);
  const content = normalizePagesHome(homePage, legacy);
  return json({ ok: true, content });
}

export async function onRequestPost(context) {
  const { request, env } = context;

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

  const data = normalizePayload(body);
  await env.AUTH_KV.put("site:content", JSON.stringify(data));

  return json({ ok: true, content: data });
}
