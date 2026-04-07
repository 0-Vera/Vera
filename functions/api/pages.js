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

function normalizePageOptions(options = {}) {
  return {
    showHeader: normalizeBool(options.showHeader, true),
    showFooter: normalizeBool(options.showFooter, true),
    customBodyClass: normalizeText(options.customBodyClass),
    contentWidth: Number.isFinite(Number(options.contentWidth)) ? Math.min(2400, Math.max(480, Number(options.contentWidth))) : 1200,
    pagePaddingX: Number.isFinite(Number(options.pagePaddingX)) ? Math.min(120, Math.max(0, Number(options.pagePaddingX))) : 24,
    sectionGap: Number.isFinite(Number(options.sectionGap)) ? Math.min(120, Math.max(0, Number(options.sectionGap))) : 18,
    gridColumns: Number.isFinite(Number(options.gridColumns)) ? Math.min(12, Math.max(1, Number(options.gridColumns))) : 12
  };
}

function normalizeBlock(block = {}, blockIndex = 0) {
  return {
    ...block,
    id: normalizeText(block?.id, uid()),
    order: Number.isFinite(Number(block?.order)) ? Number(block.order) : blockIndex,
    visible: normalizeBool(block?.visible, true),
    background: normalizeText(block?.background, "#ffffff"),
    color: normalizeText(block?.color, "#0f172a"),
    padding: Number.isFinite(Number(block?.padding)) ? Math.min(240, Math.max(0, Number(block.padding))) : 24,
    radius: Number.isFinite(Number(block?.radius)) ? Math.min(80, Math.max(0, Number(block.radius))) : 18,
    align: ["left", "center", "right"].includes(block?.align) ? block.align : "left",
    maxWidth: Number.isFinite(Number(block?.maxWidth)) ? Math.min(100, Math.max(30, Number(block.maxWidth))) : 100,
    cssClass: normalizeText(block?.cssClass),
    htmlId: normalizeText(block?.htmlId),
    layoutMode: block?.layoutMode === "free" ? "free" : "grid",
    colSpanDesktop: Number.isFinite(Number(block?.colSpanDesktop)) ? Math.min(12, Math.max(1, Number(block.colSpanDesktop))) : 12,
    colSpanTablet: Number.isFinite(Number(block?.colSpanTablet)) ? Math.min(12, Math.max(1, Number(block.colSpanTablet))) : 12,
    colSpanMobile: Number.isFinite(Number(block?.colSpanMobile)) ? Math.min(12, Math.max(1, Number(block.colSpanMobile))) : 12,
    rowSpan: Number.isFinite(Number(block?.rowSpan)) ? Math.min(12, Math.max(1, Number(block.rowSpan))) : 1,
    fullWidth: normalizeBool(block?.fullWidth, false),
    minHeight: Number.isFinite(Number(block?.minHeight)) ? Math.min(2000, Math.max(0, Number(block.minHeight))) : 0,
    contentWidthMode: block?.contentWidthMode === "boxed" ? "boxed" : "full",
    innerMaxWidth: Number.isFinite(Number(block?.innerMaxWidth)) ? Math.min(100, Math.max(20, Number(block.innerMaxWidth))) : 100
  };
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
          colSpanDesktop: 12,
          colSpanTablet: 12,
          colSpanMobile: 12,
          rowSpan: 1,
          fullWidth: true,
          minHeight: 0,
          contentWidthMode: "full",
          innerMaxWidth: 100
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

  if (id) {
    const page = pages.find((item) => item.id === id);
    if (!page) return json({ ok: false, error: "Sayfa bulunamadı" }, 404);
    return json({ ok: true, page });
  }

  if (slug !== null) {
    const normalizedSlug = slugify(slug, "");
    const page = normalizedSlug
      ? pages.find((item) => item.slug === normalizedSlug)
      : pages.find((item) => item.isHome);

    if (!page) return json({ ok: false, error: "Sayfa bulunamadı" }, 404);
    return json({ ok: true, page });
  }

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
