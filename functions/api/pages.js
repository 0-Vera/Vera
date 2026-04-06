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

function normalizeColor(value, fallback) {
  const str = String(value || "").trim();
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(str) ? str : fallback;
}

function normalizeNumber(value, fallback, min, max) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

function normalizeMode(value) {
  return value === "code" ? "code" : "standard";
}

function normalizeSection(section = {}, index = 0) {
  return {
    id: String(section.id || `section-${Date.now()}-${index}`),
    type: ["content", "html", "hero"].includes(section.type) ? section.type : "content",
    title: String(section.title || "").trim(),
    content: String(section.content || ""),
    width: normalizeNumber(section.width, 100, 30, 100),
    background: normalizeColor(section.background, "#ffffff"),
    textColor: normalizeColor(section.textColor, "#0f172a"),
    padding: normalizeNumber(section.padding, 24, 0, 120),
    radius: normalizeNumber(section.radius, 18, 0, 50)
  };
}

function defaultSettings(input = {}) {
  return {
    pageBg: normalizeColor(input.pageBg, "#f8fafc"),
    contentBg: normalizeColor(input.contentBg, "#ffffff"),
    textColor: normalizeColor(input.textColor, "#0f172a"),
    mutedColor: normalizeColor(input.mutedColor, "#475569"),
    accentColor: normalizeColor(input.accentColor, "#2563eb"),
    buttonColor: normalizeColor(input.buttonColor, "#2563eb"),
    buttonTextColor: normalizeColor(input.buttonTextColor, "#ffffff"),
    maxWidth: normalizeNumber(input.maxWidth, 1280, 640, 2400),
    contentWidth: normalizeNumber(input.contentWidth, 100, 30, 100),
    fullWidth: !!input.fullWidth,
    textAlign: ["left", "center", "right"].includes(input.textAlign) ? input.textAlign : "left",
    borderRadius: normalizeNumber(input.borderRadius, 18, 0, 60),
    containerPadding: normalizeNumber(input.containerPadding, 24, 0, 120),
    sectionGap: normalizeNumber(input.sectionGap, 18, 0, 120),
    titleSize: normalizeNumber(input.titleSize, 40, 16, 120),
    bodySize: normalizeNumber(input.bodySize, 17, 12, 40)
  };
}

function normalizePage(body = {}, previous = {}) {
  const mode = normalizeMode(body.mode || previous.mode);
  const sectionsInput = Array.isArray(body.sections)
    ? body.sections
    : Array.isArray(previous.sections)
      ? previous.sections
      : [];

  return {
    title: String(body.title || previous.title || "").trim(),
    slug: String(body.slug || previous.slug || "").trim(),
    excerpt: String(body.excerpt || previous.excerpt || "").trim(),
    seoTitle: String(body.seoTitle || previous.seoTitle || "").trim(),
    seoDescription: String(body.seoDescription || previous.seoDescription || "").trim(),
    mode,
    content: String(body.content ?? previous.content ?? ""),
    html: String(body.html ?? previous.html ?? ""),
    css: String(body.css ?? previous.css ?? ""),
    js: String(body.js ?? previous.js ?? ""),
    sections: sectionsInput.map((section, index) => normalizeSection(section, index)),
    settings: defaultSettings(body.settings || previous.settings || {}),
    updatedAt: new Date().toISOString()
  };
}

export async function onRequest(context) {
  const { request, env } = context;
  const kv = env.AUTH_KV;
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");

  if (request.method === "GET") {
    const pages = (await kv.get("pages", { type: "json" })) || [];

    if (slug) {
      const page = pages.find((p) => p.slug === slug) || null;
      return json({ ok: true, page });
    }

    return json({
      ok: true,
      pages: pages.sort((a, b) => String(a.title || "").localeCompare(String(b.title || ""), "tr"))
    });
  }

  const authorized = await checkSession(request, env);
  if (!authorized) {
    return json({ ok: false, error: "Yetkisiz" }, 401);
  }

  if (request.method === "POST") {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: "Geçersiz istek" }, 400);
    }

    const pages = (await kv.get("pages", { type: "json" })) || [];
    const index = pages.findIndex((p) => p.slug === String(body.slug || "").trim());
    const previous = index >= 0 ? pages[index] : {};
    const cleanPage = normalizePage(body, previous);

    if (!cleanPage.title || !cleanPage.slug) {
      return json({ ok: false, error: "Başlık ve slug gereklidir." }, 400);
    }

    if (index >= 0) {
      pages[index] = {
        ...previous,
        ...cleanPage
      };
    } else {
      pages.push({
        ...cleanPage,
        createdAt: new Date().toISOString()
      });
    }

    await kv.put("pages", JSON.stringify(pages));
    return json({ ok: true, pages });
  }

  if (request.method === "DELETE") {
    if (!slug) {
      return json({ ok: false, error: "Silmek için slug gerekli." }, 400);
    }

    const pages = (await kv.get("pages", { type: "json" })) || [];
    const filtered = pages.filter((p) => p.slug !== slug);
    await kv.put("pages", JSON.stringify(filtered));

    const menus = (await kv.get("menu", { type: "json" })) || [];
    const cleanedMenus = menus
      .filter((m) => m.pageSlug !== slug)
      .map((m, index) => ({ ...m, order: index }));
    await kv.put("menu", JSON.stringify(cleanedMenus));

    return json({ ok: true, pages: filtered });
  }

  return json({ ok: false, error: "Geçersiz metod" }, 405);
}
