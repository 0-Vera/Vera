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

function renderMenuItems(items) {
  if (!Array.isArray(items)) return "";
  return items
    .filter((item) => item && item.text)
    .map((item) => `<a href="${item.link || "#"}">${escapeHtml(item.text)}</a>`)
    .join("");
}

function blockWrapper(block, innerHtml) {
  const align = ["left", "center", "right"].includes(block.align) ? block.align : "left";
  const justify = align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start";
  const className = ["block-inner", block.cssClass || ""].filter(Boolean).join(" ");
  const htmlId = block.htmlId ? `id="${escapeHtml(block.htmlId)}"` : "";

  return `
    <section class="block-shell" style="justify-content:${justify}">
      <div
        ${htmlId}
        class="${className}"
        style="
          max-width:${Number(block.maxWidth || 100)}%;
          background:${block.background || "#ffffff"};
          color:${block.color || "#0f172a"};
          padding:${Number(block.padding || 24)}px;
          border-radius:${Number(block.radius || 18)}px;
          text-align:${align};
        "
      >
        ${innerHtml}
      </div>
    </section>
  `;
}

function renderBlock(block, primaryColor) {
  if (!block || block.visible === false) return "";

  if (block.type === "hero") {
    return blockWrapper(block, `
      <div class="hero">
        <h1>${escapeHtml(block.title)}</h1>
        <p>${escapeHtml(block.text)}</p>
        <div class="actions">
          ${block.primaryText ? `<a class="btn primary" href="${block.primaryLink || "#"}">${escapeHtml(block.primaryText)}</a>` : ""}
          ${block.secondaryText ? `<a class="btn" href="${block.secondaryLink || "#"}">${escapeHtml(block.secondaryText)}</a>` : ""}
        </div>
      </div>
    `);
  }

  if (block.type === "text") {
    return blockWrapper(block, `
      <div class="text-block">
        ${block.title ? `<h2>${escapeHtml(block.title)}</h2>` : ""}
        <p>${escapeHtml(block.text)}</p>
      </div>
    `);
  }

  if (block.type === "button") {
    return blockWrapper(block, `
      <div class="button-block ${block.align || "left"}">
        <a class="btn ${block.style === "primary" ? "primary" : ""}" href="${block.link || "#"}">${escapeHtml(block.text)}</a>
      </div>
    `);
  }

  if (block.type === "image") {
    const imageHtml = block.src
      ? `<img src="${block.src}" alt="${escapeHtml(block.alt || "")}" style="width:${block.width || "100%"};">`
      : `<p>Görsel URL girilmedi.</p>`;

    return blockWrapper(block, `
      <div class="image-block">
        ${block.link ? `<a href="${block.link}">${imageHtml}</a>` : imageHtml}
      </div>
    `);
  }

  if (block.type === "html") {
    return blockWrapper(block, `<div class="html-block">${block.html || ""}</div>`);
  }

  if (block.type === "spacer") {
    return `<div style="height:${Number(block.height || 32)}px"></div>`;
  }

  return "";
}

function renderPage({ siteSettings, page }) {
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

  const contentHtml = isCodeMode
    ? `${code.html || ""}`
    : blocks.map((block) => renderBlock(block, theme.primaryColor)).join("") + (overrides.html || "");

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(page.metaTitle || page.title || siteSettings.siteName || "Vera")}</title>
  <meta name="description" content="${escapeHtml(page.metaDescription || "")}" />
  <style>
    *{box-sizing:border-box}
    :root{
      --body-bg:${theme.bodyBg || "#f8fafc"};
      --body-text:${theme.bodyText || "#0f172a"};
      --border-color:${theme.borderColor || "#e2e8f0"};
      --primary-color:${theme.primaryColor || "#2563eb"};
      --container-width:${Number(theme.containerWidth || 1200)}px;
    }
    body{margin:0;font-family:Arial,sans-serif;background:var(--body-bg);color:var(--body-text)}
    a{color:inherit}.site-header{border-bottom:1px solid var(--border-color);background:#ffffff;position:sticky;top:0;z-index:30}
    .site-header-inner,.site-footer-inner,.wrap{max-width:var(--container-width);margin:0 auto;padding-left:24px;padding-right:24px}
    .site-header-inner{min-height:72px;display:flex;align-items:center;justify-content:space-between;gap:16px}
    .site-brand{text-decoration:none;font-size:24px;font-weight:800}.site-nav{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
    .site-nav a{text-decoration:none;color:#334155;font-weight:700;font-size:14px}.top-cta{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;border-radius:12px;padding:11px 16px;font-weight:700;background:var(--primary-color);color:#ffffff;border:1px solid var(--primary-color)}
    .wrap{padding-top:24px;padding-bottom:24px}.stack{display:flex;flex-direction:column;gap:18px;min-height:40vh}.block-shell{width:100%;display:flex}.block-inner{width:100%;border:1px solid var(--border-color);box-shadow:0 1px 2px rgba(15,23,42,.05)}
    .hero h1{margin:0 0 12px;font-size:38px}.hero p{margin:0 0 24px;line-height:1.7;font-size:16px}.actions{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
    a.btn{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;border-radius:12px;padding:12px 18px;font-weight:700;border:1px solid #cbd5e1;color:#0f172a;background:#ffffff;min-width:120px}
    a.btn.primary{background:var(--primary-color);color:#ffffff;border-color:var(--primary-color)}
    .text-block h2{margin:0 0 10px;font-size:24px}.text-block p{margin:0;line-height:1.8}.image-block img{max-width:100%;border-radius:12px;display:inline-block}
    .button-block{display:flex}.button-block.left{justify-content:flex-start}.button-block.center{justify-content:center}.button-block.right{justify-content:flex-end}.html-block{line-height:1.8}
    .site-footer{margin-top:28px;border-top:1px solid var(--border-color);background:#ffffff}.site-footer-inner{padding-top:18px;padding-bottom:18px;display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap}.footer-muted{color:#64748b;font-size:14px}
    @media(max-width:900px){.site-header-inner,.site-footer-inner{flex-direction:column;align-items:flex-start}.hero h1{font-size:30px}}
    ${overrides.css || ""}
    ${isCodeMode ? code.css || "" : ""}
  </style>
  ${siteSettings.custom?.headHtml || ""}
</head>
<body class="${escapeHtml(pageOptions.customBodyClass || "")}">
  ${siteSettings.custom?.beforeBodyHtml || ""}

  ${headerVisible ? `
  <header class="site-header">
    <div class="site-header-inner">
      <a class="site-brand" href="${siteSettings.logoLink || "/"}">${escapeHtml(siteSettings.logoText || siteSettings.siteName || "Vera")}</a>
      <nav class="site-nav">${renderMenuItems(siteSettings.menuItems || [])}</nav>
      ${siteSettings.showTopCta && siteSettings.topCtaText ? `<a class="top-cta" href="${siteSettings.topCtaLink || "#"}">${escapeHtml(siteSettings.topCtaText)}</a>` : ""}
    </div>
  </header>` : ""}

  <main class="wrap">
    <div class="stack">${contentHtml}</div>
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
      "content-type": "text/html; charset=utf-8"
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
    page = slug ? pages.find((item) => item.slug === slug && item.status === "published") : pages.find((item) => item.isHome && item.status === "published");
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
    return html(`<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>404</title><style>body{font-family:Arial,sans-serif;background:#f8fafc;color:#0f172a;padding:40px}a{color:#2563eb;text-decoration:none}</style></head><body><h1>Sayfa bulunamadı</h1><p>İstediğin sayfa mevcut değil.</p><p><a href="/">Ana sayfaya dön</a></p></body></html>`, 404);
  }

  return html(renderPage({ siteSettings, page }));
}
