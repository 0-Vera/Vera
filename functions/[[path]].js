function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function normalizeText(value, fallback = "") {
  const v = String(value || "").trim();
  return v || fallback;
}

function slugify(value, fallback = "") {
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

function normalizeImageSrc(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.startsWith("/")) return raw;
  if (raw.startsWith("./") || raw.startsWith("../")) return raw;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^data:image\//i.test(raw)) return raw;
  return "";
}

function isExternalLink(href) {
  return /^(https?:\/\/)/i.test(String(href || ""));
}

function resolveMenuItems(items) {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => item && item.text)
    .map((item) => ({
      text: normalizeText(item.text),
      link: normalizeLink(item.link, "#")
    }))
    .filter((item) => item.text);
}

function renderMenuItems(items, currentPath = "/") {
  return resolveMenuItems(items)
    .map((item) => {
      const normalizedCurrent = currentPath.replace(/\/+$/, "") || "/";
      const normalizedTarget = item.link.replace(/\/+$/, "") || "/";
      const activeClass =
        !isExternalLink(item.link) &&
        !/^mailto:|^tel:/i.test(item.link) &&
        normalizedCurrent === normalizedTarget
          ? "active"
          : "";

      const externalAttrs = isExternalLink(item.link)
        ? ` target="_blank" rel="noopener noreferrer"`
        : "";

      return `<a class="${activeClass}" href="${escapeHtml(item.link)}"${externalAttrs}>${escapeHtml(item.text)}</a>`;
    })
    .join("");
}

function blockWrapper(block, innerHtml, pageOptions = {}) {
  const align = ["left", "center", "right"].includes(block.align) ? block.align : "left";
  const justify = align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start";
  const className = ["block-inner", block.cssClass || ""].filter(Boolean).join(" ");
  const htmlId = block.htmlId ? `id="${escapeHtml(block.htmlId)}"` : "";

  const colSpanDesktop = block.fullWidth ? 12 : Number(block.colSpanDesktop || 12);
  const rowSpan = Number(block.rowSpan || 1);
  const minHeight = Number(block.minHeight || 0);
  const innerMaxWidth = Number(block.innerMaxWidth || 100);

  const innerStyle =
    block.contentWidthMode === "boxed"
      ? `max-width:${innerMaxWidth}%;margin:${align === "center" ? "0 auto" : align === "right" ? "0 0 0 auto" : "0"};`
      : "";

  return `
    <section
      class="block-shell"
      style="
        grid-column: span ${colSpanDesktop};
        grid-row: span ${rowSpan};
        justify-content:${justify};
      "
    >
      <div
        ${htmlId}
        class="${className}"
        style="
          width:100%;
          max-width:${Number(block.maxWidth || 100)}%;
          background:${block.background || "#ffffff"};
          color:${block.color || "#0f172a"};
          padding:${Number(block.padding || 24)}px;
          border-radius:${Number(block.radius || 18)}px;
          text-align:${align};
          min-height:${minHeight}px;
        "
      >
        <div style="${innerStyle}">
          ${innerHtml}
        </div>
      </div>
    </section>
  `;
}

function renderBlock(block, pageOptions = {}) {
  if (!block || block.visible === false) return "";

  if (block.type === "hero") {
    return blockWrapper(block, `
      <div class="hero">
        <h1>${escapeHtml(block.title)}</h1>
        <p>${escapeHtml(block.text)}</p>
        <div class="actions">
          ${block.primaryText ? `<a class="btn primary" href="${escapeHtml(normalizeLink(block.primaryLink, "#"))}">${escapeHtml(block.primaryText)}</a>` : ""}
          ${block.secondaryText ? `<a class="btn" href="${escapeHtml(normalizeLink(block.secondaryLink, "#"))}">${escapeHtml(block.secondaryText)}</a>` : ""}
        </div>
      </div>
    `, pageOptions);
  }

  if (block.type === "text") {
    return blockWrapper(block, `
      <div class="text-block">
        ${block.title ? `<h2>${escapeHtml(block.title)}</h2>` : ""}
        <p>${escapeHtml(block.text)}</p>
      </div>
    `, pageOptions);
  }

  if (block.type === "button") {
    return blockWrapper(block, `
      <div class="button-block ${block.align || "left"}">
        <a class="btn ${block.style === "primary" ? "primary" : ""}" href="${escapeHtml(normalizeLink(block.link, "#"))}">${escapeHtml(block.text)}</a>
      </div>
    `, pageOptions);
  }

  if (block.type === "image") {
    const safeSrc = normalizeImageSrc(block.src);
    const safeLink = normalizeLink(block.link, "");
    const imageHtml = safeSrc
      ? `<img src="${escapeHtml(safeSrc)}" alt="${escapeHtml(block.alt || "")}" loading="lazy" decoding="async" style="max-width:${escapeHtml(block.width || "100%")};width:100%;height:auto;">`
      : `<p>Görsel URL girilmedi.</p>`;

    return blockWrapper(block, `
      <div class="image-block">
        ${safeLink ? `<a href="${escapeHtml(safeLink)}">${imageHtml}</a>` : imageHtml}
      </div>
    `, pageOptions);
  }

  if (block.type === "html") {
    return blockWrapper(block, `<div class="html-block">${block.html || ""}</div>`, pageOptions);
  }

  if (block.type === "spacer") {
    return `
      <div style="grid-column:span 12;height:${Number(block.height || 32)}px"></div>
    `;
  }

  return "";
}

function render404() {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>404 - Sayfa bulunamadı</title>
  <meta name="robots" content="noindex,follow" />
  <style>
    *{box-sizing:border-box}
    body{
      margin:0;
      font-family:Arial,sans-serif;
      background:#f8fafc;
      color:#0f172a;
      min-height:100vh;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:24px;
    }
    .box{
      width:min(100%,720px);
      background:#fff;
      border:1px solid #e2e8f0;
      border-radius:24px;
      padding:32px;
      box-shadow:0 12px 30px rgba(15,23,42,.06);
    }
    h1{margin:0 0 12px;font-size:34px}
    p{margin:0 0 18px;line-height:1.7;color:#475569}
    a{
      display:inline-flex;
      align-items:center;
      justify-content:center;
      text-decoration:none;
      border-radius:12px;
      padding:12px 18px;
      font-weight:700;
      background:#2563eb;
      color:#fff;
    }
  </style>
</head>
<body>
  <section class="box">
    <h1>Sayfa bulunamadı</h1>
    <p>İstediğin sayfa mevcut değil ya da yayında değil.</p>
    <a href="/">Ana sayfaya dön</a>
  </section>
</body>
</html>`;
}

function renderPage({ siteSettings, page, currentPath }) {
  const theme = page.theme || {
    bodyBg: "#f8fafc",
    bodyText: "#0f172a",
    borderColor: "#e2e8f0",
    primaryColor: "#2563eb",
    containerWidth: 1200
  };

  const pageOptions = page.pageOptions || {};
  const headerVisible = siteSettings.showHeader !== false && pageOptions.showHeader !== false;
  const footerVisible = siteSettings.showFooter !== false && pageOptions.showFooter !== false;
  const blocks = Array.isArray(page.blocks) ? page.blocks : [];
  const overrides = page.overrides || {};
  const code = page.code || { html: "", css: "", js: "" };
  const isCodeMode = page.editorMode === "code";
  const canonicalUrl = currentPath ? currentPath : "/";
  const title = page.metaTitle || page.title || siteSettings.siteName || "Vera";
  const description = page.metaDescription || "";

  const contentHtml = isCodeMode
    ? `${code.html || ""}`
    : blocks.map((block) => renderBlock(block, pageOptions)).join("") + (overrides.html || "");

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="robots" content="index,follow" />
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
  <style>
    *{box-sizing:border-box}
    :root{
      --body-bg:${theme.bodyBg || "#f8fafc"};
      --body-text:${theme.bodyText || "#0f172a"};
      --border-color:${theme.borderColor || "#e2e8f0"};
      --primary-color:${theme.primaryColor || "#2563eb"};
      --container-width:${Number(theme.containerWidth || 1200)}px;
    }
    html{scroll-behavior:smooth}
    body{margin:0;font-family:Arial,sans-serif;background:var(--body-bg);color:var(--body-text)}
    a{color:inherit}
    .skip-link{position:absolute;left:-9999px;top:12px;background:#fff;color:#0f172a;padding:10px 14px;border-radius:10px;border:1px solid var(--border-color);z-index:1000;text-decoration:none;font-weight:700}
    .skip-link:focus{left:12px}
    .site-header{border-bottom:1px solid var(--border-color);background:rgba(255,255,255,.92);backdrop-filter:blur(10px);position:sticky;top:0;z-index:30}
    .site-header-inner,.site-footer-inner,.wrap{max-width:var(--container-width);margin:0 auto;padding-left:24px;padding-right:24px}
    .site-header-inner{min-height:72px;display:flex;align-items:center;justify-content:space-between;gap:16px}
    .site-brand{text-decoration:none;font-size:24px;font-weight:800}
    .site-nav{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
    .site-nav a{text-decoration:none;color:#334155;font-weight:700;font-size:14px;padding:8px 10px;border-radius:10px;transition:background .18s ease,color .18s ease}
    .site-nav a:hover,.site-nav a.active{background:#eff6ff;color:#1d4ed8}
    .top-cta{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;border-radius:12px;padding:11px 16px;font-weight:700;background:var(--primary-color);color:#ffffff;border:1px solid var(--primary-color);transition:transform .18s ease,box-shadow .18s ease}
    .top-cta:hover{transform:translateY(-1px);box-shadow:0 10px 22px rgba(37,99,235,.18)}
.wrap{
  max-width:${Number(pageOptions.contentWidth || theme.containerWidth || 1200)}px;
  margin:0 auto;
  padding-top:24px;
  padding-bottom:24px;
  padding-left:${Number(pageOptions.pagePaddingX || 24)}px;
  padding-right:${Number(pageOptions.pagePaddingX || 24)}px;
}

.stack{
  display:grid;
  grid-template-columns:repeat(${Number(pageOptions.gridColumns || 12)}, minmax(0,1fr));
  gap:${Number(pageOptions.sectionGap || 18)}px;
  min-height:40vh;
}

.block-shell{
  width:100%;
  display:flex;
  min-width:0;
}

.block-inner{
  width:100%;
  min-width:0;
  border:1px solid var(--border-color);
  box-shadow:0 1px 2px rgba(15,23,42,.05);
  overflow-wrap:anywhere;
}

@media(max-width:1024px){
  .stack{grid-template-columns:repeat(12,minmax(0,1fr))}
  .block-shell{grid-column:span 12 !important}
}

@media(max-width:640px){
  .stack{grid-template-columns:repeat(12,minmax(0,1fr))}
  .block-shell{grid-column:span 12 !important}
}
    .block-shell{width:100%;display:flex}
    .block-inner{width:100%;border:1px solid var(--border-color);box-shadow:0 1px 2px rgba(15,23,42,.05);overflow-wrap:anywhere}
    .hero h1{margin:0 0 12px;font-size:38px;line-height:1.15}
    .hero p{margin:0 0 24px;line-height:1.7;font-size:16px}
    .actions{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
    a.btn{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;border-radius:12px;padding:12px 18px;font-weight:700;border:1px solid #cbd5e1;color:#0f172a;background:#ffffff;min-width:120px;transition:transform .18s ease,box-shadow .18s ease}
    a.btn:hover{transform:translateY(-1px);box-shadow:0 8px 18px rgba(15,23,42,.08)}
    a.btn.primary{background:var(--primary-color);color:#ffffff;border-color:var(--primary-color)}
    .text-block h2{margin:0 0 10px;font-size:24px}
    .text-block p{margin:0;line-height:1.8;white-space:pre-line}
    .image-block img{max-width:100%;border-radius:12px;display:inline-block;height:auto}
    .button-block{display:flex}
    .button-block.left{justify-content:flex-start}
    .button-block.center{justify-content:center}
    .button-block.right{justify-content:flex-end}
    .html-block{line-height:1.8}
    .site-footer{margin-top:28px;border-top:1px solid var(--border-color);background:#ffffff}
    .site-footer-inner{padding-top:18px;padding-bottom:18px;display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap}
    .footer-muted{color:#64748b;font-size:14px}
    @media(max-width:900px){.site-header-inner,.site-footer-inner{flex-direction:column;align-items:flex-start}.hero h1{font-size:30px}}
    ${overrides.css || ""}
    ${isCodeMode ? code.css || "" : ""}
  </style>
  ${siteSettings.custom?.headHtml || ""}
</head>
<body class="${escapeHtml(pageOptions.customBodyClass || "")}">
  <a class="skip-link" href="#content">İçeriğe geç</a>

  ${siteSettings.custom?.beforeBodyHtml || ""}

  ${headerVisible ? `
  <header class="site-header">
    <div class="site-header-inner">
      <a class="site-brand" href="${escapeHtml(normalizeLink(siteSettings.logoLink || "/", "/"))}">${escapeHtml(siteSettings.logoText || siteSettings.siteName || "Vera")}</a>
      <nav class="site-nav" aria-label="Site menüsü">${renderMenuItems(siteSettings.menuItems || [], currentPath)}</nav>
      ${siteSettings.showTopCta && siteSettings.topCtaText ? `<a class="top-cta" href="${escapeHtml(normalizeLink(siteSettings.topCtaLink || "#", "#"))}"${isExternalLink(siteSettings.topCtaLink) ? ` target="_blank" rel="noopener noreferrer"` : ""}>${escapeHtml(siteSettings.topCtaText)}</a>` : ""}
    </div>
  </header>` : ""}

  <main class="wrap">
    <div id="content" class="stack">${contentHtml}</div>
  </main>

  ${footerVisible ? `
  <footer class="site-footer">
    <div class="site-footer-inner">
      <div class="footer-muted">${escapeHtml(siteSettings.footerText || "")}</div>
      <div class="footer-muted">${escapeHtml([siteSettings.contactEmail, siteSettings.contactPhone].filter(Boolean).join(" • "))}</div>
    </div>
  </footer>` : ""}

  ${siteSettings.custom?.afterBodyHtml || ""}

  <script>
    try {
      ${overrides.js || ""}
      ${isCodeMode ? code.js || "" : ""}
    } catch (err) {
      console.error(err);
    }
  </script>
</body>
</html>`;
}

function html(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "x-content-type-options": "nosniff",
      "referrer-policy": "strict-origin-when-cross-origin",
      "permissions-policy": "camera=(), microphone=(), geolocation=()"
    }
  });
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/admin") ||
    pathname === "/login" ||
    pathname === "/login.html" ||
    pathname.startsWith("/functions/") ||
    pathname.includes(".")
  ) {
    return context.next();
  }

  const pagesRaw = await env.AUTH_KV.get("site:pages", { type: "json" });
  const settingsRaw = await env.AUTH_KV.get("site:settings", { type: "json" });
  const contentRaw = await env.AUTH_KV.get("site:content", { type: "json" });

  const pages = Array.isArray(pagesRaw?.pages) ? pagesRaw.pages : [];
  const siteSettings = settingsRaw || {
    siteName: "Vera",
    logoText: "Vera",
    logoLink: "/",
    footerText: "© Vera",
    showHeader: true,
    showFooter: true,
    showTopCta: false,
    menuItems: []
  };

  const slug = pathname === "/" ? "" : slugify(pathname.replace(/^\/+|\/+$/g, ""), "");

  let page;
  if (pages.length) {
    page = slug
      ? pages.find((item) => item.slug === slug && item.status === "published")
      : pages.find((item) => item.isHome && item.status === "published");
  }

  if (!page && pathname === "/" && contentRaw) {
    page = {
      title: contentRaw.pageTitle || "Vera",
      metaTitle: contentRaw.pageTitle || "Vera",
      metaDescription: contentRaw.metaDescription || "",
      editorMode: "blocks",
      pageOptions: contentRaw.pageOptions || { showHeader: true, showFooter: true, customBodyClass: "" },
      theme: contentRaw.theme || {},
      blocks: Array.isArray(contentRaw.blocks) ? contentRaw.blocks : [],
      overrides: contentRaw.overrides || { html: "", css: "", js: "" },
      code: { html: "", css: "", js: "" }
    };
  }

  if (!page) {
    return html(render404(), 404);
  }

  const canonicalPath = pathname || "/";
  return html(renderPage({ siteSettings, page, currentPath: canonicalPath }));
}
