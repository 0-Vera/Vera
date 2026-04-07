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

function normalizeNumber(value, fallback, min = 0, max = 9999) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function normalizeColor(value, fallback) {
  const v = String(value || "").trim();
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v) ? v : fallback;
}

function normalizeTheme(theme = {}) {
  return {
    bodyBg: normalizeColor(theme.bodyBg, "#f8fafc"),
    bodyText: normalizeColor(theme.bodyText, "#0f172a"),
    borderColor: normalizeColor(theme.borderColor, "#e2e8f0"),
    primaryColor: normalizeColor(theme.primaryColor, "#2563eb"),
    containerWidth: normalizeNumber(theme.containerWidth, 1200, 640, 1800)
  };
}

function baseStyle(block = {}, index = 0, type = "text") {
  return {
    id: String(block.id || uid()),
    order: Number.isFinite(Number(block.order)) ? Number(block.order) : index,
    type,
    visible: block.visible !== false,
    background: normalizeColor(block.background, "#ffffff"),
    color: normalizeColor(block.color, "#0f172a"),
    padding: normalizeNumber(block.padding, 24, 0, 120),
    radius: normalizeNumber(block.radius, 18, 0, 60),
    align: ["left", "center", "right"].includes(block.align) ? block.align : "left",
    maxWidth: normalizeNumber(block.maxWidth, 100, 30, 100)
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
      width: normalizeText(block.width, "100%")
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

function normalizePayload(body = {}) {
  const blocks = Array.isArray(body.blocks) ? body.blocks : [];
  return {
    pageTitle: normalizeText(body.pageTitle, "Vera"),
    metaDescription: normalizeText(body.metaDescription, "Hoş geldiniz."),
    theme: normalizeTheme(body.theme || {}),
    overrides: normalizeOverrides(body.overrides || {}),
    blocks: blocks
      .map((block, index) => normalizeBlock(block, index))
      .sort((a, b) => a.order - b.order)
  };
}

function defaultPayload() {
  return {
    pageTitle: "Vera",
    metaDescription: "Hoş geldiniz.",
    theme: normalizeTheme({}),
    overrides: normalizeOverrides({}),
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
        maxWidth: 100
      }
    ]
  };
}

export async function onRequestGet(context) {
  const { env } = context;
  const saved = await env.AUTH_KV.get("site:content", { type: "json" });
  const data = saved ? normalizePayload(saved) : defaultPayload();
  return json({ ok: true, content: data });
}

export async function onRequestPost(context) {
  const { request, env } = context;

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
