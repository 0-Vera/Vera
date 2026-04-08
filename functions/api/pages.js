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

function uid() {
  return crypto.randomUUID();
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

function normalizeCode(code = {}) {
  return {
    html: String(code.html || ""),
    css: String(code.css || ""),
    js: String(code.js || "")
  };
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

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function normalizeGridStartSpan(start, span) {
  let safeSpan = clampNumber(span, 1, 12, 12);
  let safeStart = clampNumber(start, 1, 12, 1);

  if (safeStart + safeSpan - 1 > 12) {
    safeStart = Math.max(1, 12 - safeSpan + 1);
  }

  return { start: safeStart, span: safeSpan };
}

function normalizePageOptions(options = {}) {
  return {
    showHeader: normalizeBool(options.showHeader, true),
    showFooter: normalizeBool(options.showFooter, true),
    customBodyClass: normalizeText(options.customBodyClass),
    contentWidth: clampNumber(options.contentWidth, 480, 2400, 1200),
    pagePaddingX: clampNumber(options.pagePaddingX, 0, 120, 24),
    sectionGap: clampNumber(options.sectionGap, 0, 120, 18),
    gridColumns: clampNumber(options.gridColumns, 1, 12, 12)
  };
}

function normalizeBlock(block = {}, blockIndex = 0) {
  const desktop = normalizeGridStartSpan(block?.colStartDesktop, block?.colSpanDesktop);
  const tablet = normalizeGridStartSpan(block?.colStartTablet, block?.colSpanTablet);
  const mobile = normalizeGridStartSpan(block?.colStartMobile, block?.colSpanMobile);

  const normalized = {
    ...block,
    id: normalizeText(block?.id, uid()),
    order: Number.isFinite(Number(block?.order)) ? Number(block.order) : blockIndex,
    visible: normalizeBool(block?.visible, true),
    background: normalizeText(block?.background, "#ffffff"),
    color: normalizeText(block?.color, "#0f172a"),
    padding: clampNumber(block?.padding, 0, 240, 24),
    radius: clampNumber(block?.radius, 0, 80, 18),
    align: ["left", "center", "right"].includes(block?.align) ? block.align : "left",
    maxWidth: clampNumber(block?.maxWidth, 30, 100, 100),
    cssClass: normalizeText(block?.cssClass),
    htmlId: normalizeText(block?.htmlId),
    layoutMode: block?.layoutMode === "free" ? "free" : "grid",
    fullWidth: normalizeBool(block?.fullWidth, false),
    surface: normalizeBool(block?.surface, true),

    colStartDesktop: desktop.start,
    colSpanDesktop: desktop.span,
    colStartTablet: tablet.start,
    colSpanTablet: tablet.span,
    colStartMobile: mobile.start,
    colSpanMobile: mobile.span,

    rowStartDesktop: clampNumber(block?.rowStartDesktop, 1, 500, 1),
    rowSpan: clampNumber(block?.rowSpan, 1, 12, 1),
    minHeight: clampNumber(block?.minHeight, 0, 2000, 0),
    contentWidthMode: block?.contentWidthMode === "boxed" ? "boxed" : "full",
    innerMaxWidth: clampNumber(block?.innerMaxWidth, 20, 100, 100),

    tableHeaders: normalizeText(block?.tableHeaders),
    tableRows: normalizeText(block?.tableRows),
    action: normalizeAction(block?.action, block?.link),
    primaryAction: normalizeAction(block?.primaryAction, block?.primaryLink),
    secondaryAction: normalizeAction(block?.secondaryAction, block?.secondaryLink)
  };

  if (normalized.type === "button") {
    normalized.link = normalizeLink(block?.link, "#");
    normalized.style = ["primary", "secondary"].includes(block?.style) ? block.style : "primary";
    normalized.text = normalizeText(block?.text, "Buton");
  }

  if (normalized.type === "hero") {
    normalized.title = normalizeText(block?.title, "Başlık");
    normalized.text = normalizeText(block?.text, "Açıklama");
    normalized.primaryText = normalizeText(block?.primaryText);
    normalized.primaryLink = normalizeLink(block?.primaryLink, "#");
    normalized.secondaryText = normalizeText(block?.secondaryText);
    normalized.secondaryLink = normalizeLink(block?.secondaryLink, "");
  }

  if (normalized.type === "image") {
    normalized.src = normalizeText(block?.src);
    normalized.alt = normalizeText(block?.alt);
    normalized.width = normalizeText(block?.width, "100%");
    normalized.link = normalizeLink(block?.link, "");
  }

  if (normalized.type === "html") {
    normalized.html = String(block?.html || "");
  }

  if (normalized.type === "spacer") {
    normalized.height = clampNumber(block?.height, 0, 400, 32);
    normalized.surface = false;
  }

  if (normalized.fullWidth) {
    normalized.colStartDesktop = 1;
    normalized.colSpanDesktop = 12;
    normalized.colStartTablet = 1;
    normalized.colSpanTablet = 12;
    normalized.colStartMobile = 1;
    normalized.colSpanMobile = 12;
  }

  return normalized;
}

function normalizePage(page = {}, index = 0) {
  const title = normalizeText(page.title, `Yeni Sayfa ${index + 1}`);
  return {
    id: normalizeText(page.id, uid()),
    title,
    slug: slugify(page.slug || title, `sayfa-${index + 1}`),
    status: ["draft", "published"].includes(page.status) ? page.status : "draft",
    isHome: normalizeBool(page.isHome, false),
    metaTitle: normalizeText(page.metaTitle, title),
    metaDescription: normalizeText(page.metaDescription),
    editorMode: ["blocks", "code"].includes(page.editorMode) ? page.editorMode : "blocks",
    pageOptions: normalizePageOptions(page.pageOptions || {}),
    blocks: Array.isArray(page.blocks) ? page.blocks.map((block, blockIndex) => normalizeBlock(block, blockIndex)) : [],
    overrides: {
      html: String(page.overrides?.html || ""),
      css: String(page.overrides?.css || ""),
      js: String(page.overrides?.js || "")
    },
    code: normalizeCode(page.code || {}),
    createdAt: normalizeText(page.createdAt, new Date().toISOString()),
    updatedAt: new Date().toISOString()
  };
}

function ensureSingleHome(pages = []) {
  let homeFound = false;
  const next = pages.map((page) => {
    if (page.isHome && !homeFound) {
      homeFound = true;
      return page;
    }
    return { ...page, isHome: false };
  });

  if (!homeFound && next.length) {
    next[0] = { ...next[0], isHome: true };
  }

  return next;
}

function defaultPages() {
  return ensureSingleHome([
    normalizePage({
      title: "Ana Sayfa",
      slug: "",
      status: "published",
      isHome: true,
      editorMode: "blocks",
      metaTitle: "Vera",
      metaDescription: "Hoş geldiniz.",
      pageOptions: {
        showHeader: true,
        showFooter: true,
        customBodyClass: "",
        contentWidth: 1200,
        pagePaddingX: 24,
        sectionGap: 18,
        gridColumns: 12
      },
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
          primaryAction: { type: "url", url: "/admin", pageId: "", anchor: "", email: "", phone: "", whatsapp: "", downloadUrl: "", newTab: false },
          secondaryText: "Giriş",
          secondaryLink: "/login",
          secondaryAction: { type: "url", url: "/login", pageId: "", anchor: "", email: "", phone: "", whatsapp: "", downloadUrl: "", newTab: false },
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
          colStartDesktop: 1,
          colSpanDesktop: 12,
          colStartTablet: 1,
          colSpanTablet: 12,
          colStartMobile: 1,
          colSpanMobile: 12,
          rowSpan: 1,
          minHeight: 0,
          contentWidthMode: "full",
          innerMaxWidth: 100,
          surface: true,
rowStartDesktop: 1,
tableHeaders: "",
tableRows: "",
        }
      ]
    }, 0)
  ]);
}

async function readPages(env) {
  const raw = await env.AUTH_KV.get("site:pages", { type: "json" });
  const incoming = Array.isArray(raw?.pages) ? raw.pages : null;
  if (!incoming) return defaultPages();
  return ensureSingleHome(incoming.map((page, index) => normalizePage(page, index)));
}

async function savePages(env, pages) {
  const safePages = ensureSingleHome(pages.map((page, index) => normalizePage(page, index)));
  await env.AUTH_KV.put("site:pages", JSON.stringify({ pages: safePages }));
  return safePages;
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const slug = url.searchParams.get("slug");
  const pages = await readPages(env);
  const authorized = await checkSession(request, env);

  if (id) {
    if (!authorized) return json({ ok: false, error: "Yetkisiz" }, 401);
    const page = pages.find((item) => item.id === id);
    if (!page) return json({ ok: false, error: "Sayfa bulunamadı" }, 404);
    return json({ ok: true, page });
  }

  if (slug !== null) {
    const normalizedSlug = slugify(slug, "");
    const page = normalizedSlug
      ? pages.find((item) => item.slug === normalizedSlug && item.status === "published")
      : pages.find((item) => item.isHome && item.status === "published");

    if (!page) return json({ ok: false, error: "Sayfa bulunamadı" }, 404);
    return json({ ok: true, page });
  }

  if (!authorized) return json({ ok: false, error: "Yetkisiz" }, 401);
  return json({ ok: true, pages });
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

  const action = normalizeText(body.action, "save");
  const pages = await readPages(env);

  if (action === "delete") {
    const id = normalizeText(body.id);
    const filtered = pages.filter((item) => item.id !== id);
    const saved = await savePages(env, filtered);
    return json({ ok: true, pages: saved });
  }

  const page = normalizePage(body.page || {}, 0);
  const duplicate = pages.find((item) => item.slug === page.slug && item.id !== page.id);
  if (duplicate && page.slug !== "") {
    return json({ ok: false, error: "Bu slug zaten kullanılıyor" }, 409);
  }

  const existingIndex = pages.findIndex((item) => item.id === page.id);
  let nextPages;

  if (existingIndex >= 0) {
    nextPages = [...pages];
    nextPages[existingIndex] = {
      ...nextPages[existingIndex],
      ...page,
      createdAt: nextPages[existingIndex].createdAt,
      updatedAt: new Date().toISOString()
    };
  } else {
    nextPages = [...pages, page];
  }

  const saved = await savePages(env, nextPages);
  return json({ ok: true, pages: saved, page: saved.find((item) => item.id === page.id) || null });
}
