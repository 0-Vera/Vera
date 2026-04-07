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

function slugify(value, fallback = "sayfa") {
  const raw = String(value || "").toLowerCase().trim();
  const map = {
    ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u"
  };
  const normalized = raw.replace(/[çğıöşü]/g, (m) => map[m] || m)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || fallback;
}

function normalizeBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function normalizePage(page = {}, index = 0) {
  return {
    id: normalizeText(page.id, uid()),
    title: normalizeText(page.title, `Yeni Sayfa ${index + 1}`),
    slug: slugify(page.slug || page.title || `sayfa-${index + 1}`),
    status: ["draft", "published"].includes(page.status) ? page.status : "draft",
    isHome: normalizeBoolean(page.isHome, false),
    metaTitle: normalizeText(page.metaTitle, normalizeText(page.title, `Yeni Sayfa ${index + 1}`)),
    metaDescription: normalizeText(page.metaDescription),
    layoutMode: ["blocks", "code"].includes(page.layoutMode) ? page.layoutMode : "blocks",
    blocks: Array.isArray(page.blocks) ? page.blocks : [],
    code: {
      html: String(page.code?.html || ""),
      css: String(page.code?.css || ""),
      js: String(page.code?.js || "")
    },
    createdAt: normalizeText(page.createdAt, new Date().toISOString()),
    updatedAt: new Date().toISOString()
  };
}

function ensureSingleHome(pages = []) {
  let found = false;
  return pages.map((page, index) => {
    if (page.isHome && !found) {
      found = true;
      return page;
    }
    return { ...page, isHome: false };
  }).map((page, index) => {
    if (!found && index === 0) return { ...page, isHome: true };
    return page;
  });
}

async function readPages(env) {
  const raw = await env.AUTH_KV.get("site:pages", { type: "json" });
  const pages = Array.isArray(raw?.pages) ? raw.pages : [];
  const normalized = pages.map((page, index) => normalizePage(page, index));
  return ensureSingleHome(normalized);
}

async function writePages(env, pages) {
  const safePages = ensureSingleHome(
    pages.map((page, index) => normalizePage(page, index))
  );
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

  if (slug) {
    const page = pages.find((item) => item.slug === slug);
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
    const nextPages = pages.filter((item) => item.id !== id);
    const saved = await writePages(env, nextPages);
    return json({ ok: true, pages: saved });
  }

  const incoming = normalizePage(body.page || {}, 0);

  const duplicate = pages.find((item) => item.slug === incoming.slug && item.id !== incoming.id);
  if (duplicate) {
    return json({ ok: false, error: "Bu slug zaten kullanılıyor" }, 409);
  }

  const existingIndex = pages.findIndex((item) => item.id === incoming.id);
  let nextPages;

  if (existingIndex >= 0) {
    nextPages = [...pages];
    nextPages[existingIndex] = {
      ...nextPages[existingIndex],
      ...incoming,
      createdAt: nextPages[existingIndex].createdAt || incoming.createdAt,
      updatedAt: new Date().toISOString()
    };
  } else {
    nextPages = [...pages, incoming];
  }

  const saved = await writePages(env, nextPages);
  return json({ ok: true, pages: saved, page: saved.find((item) => item.id === incoming.id) || null });
}
