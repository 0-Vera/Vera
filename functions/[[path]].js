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
    newTab: !!action?.newTab
  };
}

function resolveActionHref(action = {}, pages = [], fallbackLink = "#") {
  const safe = normalizeAction(action, fallbackLink);

  if (safe.type === "none") return "#";
  if (safe.type === "page") {
    const page = pages.find((entry) => entry.id === safe.pageId);
    if (!page) return normalizeLink(fallbackLink, "#");
    return page.isHome ? "/" : `/${String(page.slug || "").replace(/^\/+/, "")}`;
  }
  if (safe.type === "anchor") {
    const anchor = String(safe.anchor || "").replace(/^#+/, "");
    return anchor ? `#${anchor}` : "#";
  }
  if (safe.type === "email") {
    return safe.email ? `mailto:${safe.email}` : "#";
  }
  if (safe.type === "phone") {
    return safe.phone ? `tel:${safe.phone}` : "#";
  }
  if (safe.type === "whatsapp") {
    const raw = String(safe.whatsapp || "").replace(/[^\d]/g, "");
    return raw ? `https://wa.me/${raw}` : "#";
  }
  if (safe.type === "download") {
    return normalizeLink(safe.downloadUrl, "#");
  }
  return normalizeLink(safe.url, normalizeLink(fallbackLink, "#"));
}

function actionAttrs(action = {}, href = "#") {
  const safe = normalizeAction(action, href);
  if (safe.type === "none" || href === "#") return '';
  if (safe.newTab || isExternalLink(href) || safe.type === "download") {
    return ' target="_blank" rel="noopener noreferrer"';
  }
  return '';
}

function resolveMenuItems(items, pages = []) {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item) => item && item.text)
    .map((item) => {
      const action = normalizeAction(item.action, item.link);
      const link = resolveActionHref(action, pages, item.link);
      return {
        text: normalizeText(item.text),
        link,
        action
      };
    })
    .filter((item) => item.text);
}


function splitLines(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseCardItems(value) {
  return splitLines(value).map((line) => {
    const [title, ...rest] = line.split("|");
    return {
      title: String(title || "").trim(),
      text: String(rest.join("|") || "").trim()
    };
  });
}

function parsePairItems(value) {
  return splitLines(value).map((line) => {
    const [title, ...rest] = line.split("|");
    return {
      title: String(title || "").trim(),
      text: String(rest.join("|") || "").trim()
    };
  });
}

function renderMenuItems(items, currentPath = "/", pages = []) {
  return resolveMenuItems(items, pages)
    .map((item) => {
      const normalizedCurrent = currentPath.replace(/\/+$/, "") || "/";
      const normalizedTarget = item.link.replace(/\/+$/, "") || "/";
      const activeClass =
        !isExternalLink(item.link) &&
        !/^mailto:|^tel:/i.test(item.link) &&
        normalizedCurrent === normalizedTarget
          ? "active"
          : "";

      const extraAttrs = actionAttrs(item.action, item.link);
      return `<a class="${activeClass}" href="${escapeHtml(item.link)}"${extraAttrs}>${escapeHtml(item.text)}</a>`;
    })
    .join("");
}

function blockWrapper(block, innerHtml, pageOptions = {}, renderMeta = {}) {
  const align = ["left", "center", "right"].includes(block.align) ? block.align : "left";
  const justify = align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start";
  const className = ["block-inner", block.cssClass || ""].filter(Boolean).join(" ");
  const htmlId = block.htmlId ? `id="${escapeHtml(block.htmlId)}"` : "";

  const totalCols = Math.max(1, Math.min(MAX_GRID_COLUMNS, Number(pageOptions.gridColumns || 12)));

  const desktopStart = block.fullWidth ? 1 : Number(block.colStartDesktop || 1);
  const desktopSpan = block.fullWidth ? totalCols : Number(block.colSpanDesktop || totalCols);

  const tabletStart = block.fullWidth ? 1 : Number(block.colStartTablet || 1);
  const tabletSpan = block.fullWidth ? totalCols : Number(block.colSpanTablet || totalCols);

  const mobileStart = block.fullWidth ? 1 : Number(block.colStartMobile || 1);
  const mobileSpan = block.fullWidth ? totalCols : Number(block.colSpanMobile || totalCols);

  const rowStart = Number(block.rowStartDesktop || 1);
  const rowSpan = Number(block.rowSpan || 1);
  const hasManualRow = block.layoutMode === "free" || rowStart > 1;
  const minHeight = Number(block.minHeight || 0);
  const innerMaxWidth = Number(block.innerMaxWidth || 100);

  const useSurface = block.surface !== false && block.type !== "spacer";

  const innerStyle =
    block.contentWidthMode === "boxed"
      ? `max-width:${innerMaxWidth}%;margin:${align === "center" ? "0 auto" : align === "right" ? "0 0 0 auto" : "0"};`
      : "";

  const designerAttrs =
    renderMeta.isDesigner
      ? ` data-block-id="${escapeHtml(block.id || "")}" data-block-type="${escapeHtml(block.type || "")}"`
      : "";

  return `
    <section
      class="block-shell"
      ${designerAttrs}
      style="
        --col-start-desktop:${desktopStart};
        --col-span-desktop:${desktopSpan};
        --col-start-tablet:${tabletStart};
        --col-span-tablet:${tabletSpan};
        --col-start-mobile:${mobileStart};
        --col-span-mobile:${mobileSpan};
        --row-start-desktop:${rowStart};
        --row-span:${rowSpan};
        grid-column: var(--col-start-desktop) / span var(--col-span-desktop);
        ${'${hasManualRow ? `grid-row: var(--row-start-desktop) / span var(--row-span);` : ""}'}
        justify-content:${justify};
      "
    >
      <div
        ${htmlId}
        class="${className}"
        style="
          width:100%;
          max-width:${Number(block.maxWidth || 100)}%;
          background:${useSurface ? (block.background || "#ffffff") : "transparent"};
          color:${block.color || "#0f172a"};
          padding:${useSurface ? Number(block.padding || 24) + "px" : "0"};
          border-radius:${useSurface ? Number(block.radius || 18) + "px" : "0"};
          text-align:${align};
          min-height:${minHeight}px;
          border:${useSurface ? "1px solid var(--border-color)" : "0"};
          box-shadow:${useSurface ? "0 1px 2px rgba(15,23,42,.05)" : "none"};
        "
      >
        <div style="${innerStyle}">
          ${innerHtml}
        </div>
      </div>
    </section>
  `;
}
function renderBlock(block, pageOptions = {}, renderMeta = {}) {
  if (!block || block.visible === false) return "";
  const pages = Array.isArray(renderMeta.pages) ? renderMeta.pages : [];

  if (block.type === "hero") {
    const primaryHref = resolveActionHref(block.primaryAction, pages, block.primaryLink || "#");
    const secondaryHref = resolveActionHref(block.secondaryAction, pages, block.secondaryLink || "#");
    return blockWrapper(block, `
      <div class="hero">
        <h1>${escapeHtml(block.title)}</h1>
        <p>${escapeHtml(block.text)}</p>
        <div class="actions">
          ${block.primaryText ? `<a class="btn primary" href="${escapeHtml(primaryHref)}"${actionAttrs(block.primaryAction, primaryHref)}>${escapeHtml(block.primaryText)}</a>` : ""}
          ${block.secondaryText ? `<a class="btn" href="${escapeHtml(secondaryHref)}"${actionAttrs(block.secondaryAction, secondaryHref)}>${escapeHtml(block.secondaryText)}</a>` : ""}
        </div>
      </div>
    `, pageOptions, renderMeta);
  }

  if (block.type === "section") {
    return blockWrapper(block, `
      <div class="section-intro">
        ${block.title ? `<h2>${escapeHtml(block.title)}</h2>` : ""}
        ${block.text ? `<p>${escapeHtml(block.text)}</p>` : ""}
      </div>
    `, pageOptions, renderMeta);
  }

  if (block.type === "features") {
    const items = splitLines(block.items);
    return blockWrapper(block, `
      <div class="feature-list">
        ${block.title ? `<h3>${escapeHtml(block.title)}</h3>` : ""}
        ${block.text ? `<p>${escapeHtml(block.text)}</p>` : ""}
        <ul>
          ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      </div>
    `, pageOptions, renderMeta);
  }

  if (block.type === "cards") {
    const cards = parseCardItems(block.items);
    return blockWrapper(block, `
      <div class="cards-block">
        ${block.title ? `<h3>${escapeHtml(block.title)}</h3>` : ""}
        ${block.text ? `<p class="cards-intro">${escapeHtml(block.text)}</p>` : ""}
        <div class="cards-grid">
          ${cards.map((card) => `
            <article class="info-card">
              ${card.title ? `<h4>${escapeHtml(card.title)}</h4>` : ""}
              ${card.text ? `<p>${escapeHtml(card.text)}</p>` : ""}
            </article>
          `).join("")}
        </div>
      </div>
    `, pageOptions, renderMeta);
  }

  if (block.type === "stats") {
    const items = parsePairItems(block.items);
    return blockWrapper(block, `
      <div class="stats-block">
        ${block.title ? `<h3>${escapeHtml(block.title)}</h3>` : ""}
        ${block.text ? `<p class="cards-intro">${escapeHtml(block.text)}</p>` : ""}
        <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px">
          ${items.map((item) => `
            <article class="info-card" style="text-align:center">
              ${item.title ? `<strong style="display:block;font-size:28px;line-height:1.1;margin-bottom:8px">${escapeHtml(item.title)}</strong>` : ""}
              ${item.text ? `<p>${escapeHtml(item.text)}</p>` : ""}
            </article>
          `).join("")}
        </div>
      </div>
    `, pageOptions, renderMeta);
  }

  if (block.type === "faq") {
    const items = parsePairItems(block.items);
    return blockWrapper(block, `
      <div class="faq-block">
        ${block.title ? `<h3>${escapeHtml(block.title)}</h3>` : ""}
        ${block.text ? `<p class="cards-intro">${escapeHtml(block.text)}</p>` : ""}
        <div style="display:grid;gap:12px">
          ${items.map((item) => `
            <article class="info-card">
              ${item.title ? `<h4>${escapeHtml(item.title)}</h4>` : ""}
              ${item.text ? `<p>${escapeHtml(item.text)}</p>` : ""}
            </article>
          `).join("")}
        </div>
      </div>
    `, pageOptions, renderMeta);
  }

  if (block.type === "text") {
    return blockWrapper(block, `
      <div class="text-block">
        ${block.title ? `<h2>${escapeHtml(block.title)}</h2>` : ""}
        <p>${escapeHtml(block.text)}</p>
      </div>
    `, pageOptions, renderMeta);
  }

  if (block.type === "button") {
    const href = resolveActionHref(block.action, pages, block.link || "#");
    return blockWrapper(block, `
      <div class="button-block ${block.align || "left"}">
        <a class="btn ${block.style === "primary" ? "primary" : ""}" href="${escapeHtml(href)}"${actionAttrs(block.action, href)}>${escapeHtml(block.text)}</a>
      </div>
    `, pageOptions, renderMeta);
  }

  if (block.type === "image") {
    const safeSrc = normalizeImageSrc(block.src);
    const safeLink = resolveActionHref(block.action, pages, block.link || "");
    const imageHtml = safeSrc
      ? `<img src="${escapeHtml(safeSrc)}" alt="${escapeHtml(block.alt || "")}" loading="lazy" decoding="async" style="max-width:${escapeHtml(block.width || "100%")};width:100%;height:auto;">`
      : `<p>Görsel URL girilmedi.</p>`;

    return blockWrapper(block, `
      <div class="image-block">
        ${safeLink && safeLink !== "#" ? `<a href="${escapeHtml(safeLink)}"${actionAttrs(block.action, safeLink)}>${imageHtml}</a>` : imageHtml}
      </div>
    `, pageOptions, renderMeta);
  }

  if (block.type === "table") {
    const headers = String(block.tableHeaders || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const rows = String(block.tableRows || "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.split("|").map((cell) => cell.trim()));

    const tableHead = headers.length
      ? `<thead><tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr></thead>`
      : "";

    const tableBody = rows.length
      ? `<tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody>`
      : `<tbody><tr><td>Tablo verisi yok.</td></tr></tbody>`;

    return blockWrapper(block, `
      <div class="table-block">
        <div class="table-wrap">
          <table>
            ${tableHead}
            ${tableBody}
          </table>
        </div>
      </div>
    `, pageOptions, renderMeta);
  }

  if (block.type === "html") {
    return blockWrapper(block, `<div class="html-block">${block.html || ""}</div>`, pageOptions, renderMeta);
  }

  if (block.type === "spacer") {
    const designerAttrs =
      renderMeta.isDesigner
        ? ` data-block-id="${escapeHtml(block.id || "")}" data-block-type="${escapeHtml(block.type || "")}"`
        : "";
    const rowStart = Number(block.rowStartDesktop || 1);
    const rowSpan = Number(block.rowSpan || 1);
    const manualRow = block.layoutMode === "free" || rowStart > 1;
    const totalCols = Math.max(1, Math.min(MAX_GRID_COLUMNS, Number(pageOptions.gridColumns || 12)));
    return `
      <div ${designerAttrs} style="grid-column:1 / span ${totalCols};grid-row:${Number(block.rowStartDesktop || 1)} / span ${Number(block.rowSpan || 1)};height:${Number(block.height || 32)}px"></div>
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
    .table-wrap{width:100%;overflow:auto}
.table-wrap table{width:100%;border-collapse:collapse;background:#fff}
.table-wrap th,.table-wrap td{border:1px solid var(--border-color);padding:10px 12px;text-align:left;font-size:14px}
.table-wrap th{background:#f8fafc;font-weight:700}

    .section-intro{display:grid;gap:10px}
    .section-intro h2,.section-intro h3,.feature-list h3,.cards-block h3{margin:0;font-size:clamp(22px,3vw,34px)}
    .section-intro p,.feature-list p,.cards-block p,.info-card p{margin:0;color:var(--muted-text);line-height:1.7}
    .feature-list ul{margin:16px 0 0;padding-left:18px;display:grid;gap:10px}
    .feature-list li{line-height:1.6}
    .cards-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:16px}
    .info-card{border:1px solid var(--border-color);border-radius:16px;padding:18px;background:rgba(255,255,255,.7)}
    .info-card h4{margin:0 0 8px;font-size:18px}
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

function renderDesignerBridge(page, currentPath) {
  const pageJson = JSON.stringify(page || {});
  const blocksJson = JSON.stringify(
    Array.isArray(page.blocks)
      ? page.blocks.map((block) => ({
          id: block.id || "",
          type: block.type || ""
        }))
      : []
  );

  return `
  <style>
    [data-block-id]{
      position:relative;
      transition:outline-color .12s ease, box-shadow .12s ease;
    }
    body.vera-designer-mode [data-block-id]{
      cursor:pointer;
    }
    body.vera-designer-mode [data-block-id]:hover{
      outline:1px dashed rgba(37,99,235,.55);
      outline-offset:2px;
    }
    body.vera-designer-mode [data-block-id].vera-selected-block{
      outline:2px solid #2563eb;
      outline-offset:2px;
      box-shadow:0 0 0 4px rgba(37,99,235,.10);
    }
  </style>
  <script>
    (function(){
      let CURRENT_PAGE = ${pageJson};
      let BLOCKS = ${blocksJson};

      const PAGE_INFO = {
        title: ${JSON.stringify(page.title || "")},
        slug: ${JSON.stringify(currentPath || "/")},
        isHome: ${JSON.stringify(!!page.isHome)}
      };

      function send(message){
        try{
          if(window.parent && window.parent !== window){
            window.parent.postMessage(message, "*");
          }
        }catch(e){}
      }

      function escapeHtml(value){
        return String(value || "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");
      }

      function normalizeLink(value, fallback = "#"){
        const raw = String(value || "").trim();
        if (!raw) return fallback;
        if (raw.startsWith("#")) return raw;
        if (raw.startsWith("/")) return raw;
        if (raw.startsWith("./") || raw.startsWith("../")) return raw;
        if (/^(https?:\\/\\/|mailto:|tel:)/i.test(raw)) return raw;
        return fallback;
      }

      function normalizeImageSrc(value){
        const raw = String(value || "").trim();
        if (!raw) return "";
        if (raw.startsWith("/")) return raw;
        if (raw.startsWith("./") || raw.startsWith("../")) return raw;
        if (/^https?:\\/\\//i.test(raw)) return raw;
        if (/^data:image\\//i.test(raw)) return raw;
        return "";
      }

      function getNodeById(id){
        return document.querySelector('[data-block-id="' + CSS.escape(String(id || "")) + '"]');
      }

      function highlight(id){
        document.querySelectorAll("[data-block-id]").forEach(function(node){
          node.classList.remove("vera-selected-block");
        });
        const node = getNodeById(id);
        if(node){
          node.classList.add("vera-selected-block");
          node.scrollIntoView({block:"nearest", inline:"nearest"});
        }
      }

      function collectRects(){
        return BLOCKS.map(function(block){
          const node = getNodeById(block.id);
          if(!node) return { id:block.id, type:block.type, rect:null };
          const r = node.getBoundingClientRect();
          return {
            id:block.id,
            type:block.type,
            rect:{
              x:r.x,
              y:r.y,
              width:r.width,
              height:r.height,
              top:r.top,
              left:r.left
            }
          };
        });
      }

      function blockWrapper(block, innerHtml){
        const align = ["left", "center", "right"].includes(block.align) ? block.align : "left";
        const justify = align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start";
        const className = ["block-inner", block.cssClass || ""].filter(Boolean).join(" ");
        const htmlId = block.htmlId ? 'id="' + escapeHtml(block.htmlId) + '"' : "";

        const totalCols = Math.max(1, Math.min(${MAX_GRID_COLUMNS}, Number(CURRENT_PAGE.pageOptions?.gridColumns || 12)));
        const desktopStart = block.fullWidth ? 1 : Number(block.colStartDesktop || 1);
        const desktopSpan = block.fullWidth ? totalCols : Number(block.colSpanDesktop || totalCols);

        const rowStart = Number(block.rowStartDesktop || 1);
        const rowSpan = Number(block.rowSpan || 1);
        const manualRow = block.layoutMode === 'free' || rowStart > 1;
        const minHeight = Number(block.minHeight || 0);
        const innerMaxWidth = Number(block.innerMaxWidth || 100);
        const useSurface = block.surface !== false && block.type !== "spacer";

        const innerStyle =
          block.contentWidthMode === "boxed"
            ? 'max-width:' + innerMaxWidth + '%;margin:' + (align === "center" ? "0 auto" : align === "right" ? "0 0 0 auto" : "0") + ';'
            : "";

        return \`
          <section
            class="block-shell"
            data-block-id="\${escapeHtml(block.id || "")}"
            data-block-type="\${escapeHtml(block.type || "")}"
            style="
              grid-column:\${desktopStart} / span \${desktopSpan};
              ${"${manualRow ? `grid-row:${rowStart} / span ${rowSpan};` : ``}"}
              justify-content:\${justify};
            "
          >
            <div
              \${htmlId}
              class="\${className}"
              style="
                width:100%;
                max-width:\${Number(block.maxWidth || 100)}%;
                background:\${useSurface ? (block.background || "#ffffff") : "transparent"};
                color:\${block.color || "#0f172a"};
                padding:\${useSurface ? Number(block.padding || 24) + "px" : "0"};
                border-radius:\${useSurface ? Number(block.radius || 18) + "px" : "0"};
                text-align:\${align};
                min-height:\${minHeight}px;
                border:\${useSurface ? "1px solid var(--border-color)" : "0"};
                box-shadow:\${useSurface ? "0 1px 2px rgba(15,23,42,.05)" : "none"};
              "
            >
              <div style="\${innerStyle}">
                \${innerHtml}
              </div>
            </div>
          </section>
        \`;
      }

      function renderBlock(block){
        if (!block || block.visible === false) return "";

        if (block.type === "hero") {
          return blockWrapper(block, \`
            <div class="hero">
              <h1>\${escapeHtml(block.title)}</h1>
              <p>\${escapeHtml(block.text)}</p>
              <div class="actions">
                \${block.primaryText ? '<a class="btn primary" href="' + escapeHtml(normalizeLink(block.primaryLink, "#")) + '">' + escapeHtml(block.primaryText) + '</a>' : ""}
                \${block.secondaryText ? '<a class="btn" href="' + escapeHtml(normalizeLink(block.secondaryLink, "#")) + '">' + escapeHtml(block.secondaryText) + '</a>' : ""}
              </div>
            </div>
          \`);
        }

        if (block.type === "section") {
          return blockWrapper(block, '<div class="section-intro">' +
            (block.title ? '<h2>' + escapeHtml(block.title) + '</h2>' : '') +
            (block.text ? '<p>' + escapeHtml(block.text) + '</p>' : '') +
          '</div>', pageOptions, renderMeta);
        }

        if (block.type === "features") {
          const items = splitLines(block.items);
          return blockWrapper(block, '<div class="feature-list">' +
            (block.title ? '<h3>' + escapeHtml(block.title) + '</h3>' : '') +
            (block.text ? '<p>' + escapeHtml(block.text) + '</p>' : '') +
            '<ul>' + items.map(function(item){ return '<li>' + escapeHtml(item) + '</li>'; }).join('') + '</ul>' +
          '</div>', pageOptions, renderMeta);
        }

        if (block.type === "cards") {
          const cards = parseCardItems(block.items);
          return blockWrapper(block, '<div class="cards-block">' +
            (block.title ? '<h3>' + escapeHtml(block.title) + '</h3>' : '') +
            (block.text ? '<p class="cards-intro">' + escapeHtml(block.text) + '</p>' : '') +
            '<div class="cards-grid">' + cards.map(function(card){
              return '<article class="info-card">' +
                (card.title ? '<h4>' + escapeHtml(card.title) + '</h4>' : '') +
                (card.text ? '<p>' + escapeHtml(card.text) + '</p>' : '') +
              '</article>';
            }).join('') + '</div>' +
          '</div>', pageOptions, renderMeta);
        }

        if (block.type === "text") {
          return blockWrapper(block, \`
            <div class="text-block">
              \${block.title ? '<h2>' + escapeHtml(block.title) + '</h2>' : ""}
              <p>\${escapeHtml(block.text)}</p>
            </div>
          \`);
        }

        if (block.type === "button") {
          return blockWrapper(block, \`
            <div class="button-block \${block.align || "left"}">
              <a class="btn \${block.style === "primary" ? "primary" : ""}" href="\${escapeHtml(normalizeLink(block.link, "#"))}">\${escapeHtml(block.text)}</a>
            </div>
          \`);
        }

        if (block.type === "image") {
          const safeSrc = normalizeImageSrc(block.src);
          const safeLink = normalizeLink(block.link, "");
          const imageHtml = safeSrc
            ? '<img src="' + escapeHtml(safeSrc) + '" alt="' + escapeHtml(block.alt || "") + '" loading="lazy" decoding="async" style="max-width:' + escapeHtml(block.width || "100%") + ';width:100%;height:auto;">'
            : '<p>Görsel URL girilmedi.</p>';

          return blockWrapper(block, \`
            <div class="image-block">
              \${safeLink ? '<a href="' + escapeHtml(safeLink) + '">' + imageHtml + '</a>' : imageHtml}
            </div>
          \`);
        }

        if (block.type === "table") {
          const headers = String(block.tableHeaders || "")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);

          const rows = String(block.tableRows || "")
            .split("\\n")
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => line.split("|").map((cell) => cell.trim()));

          const tableHead = headers.length
            ? '<thead><tr>' + headers.map((header) => '<th>' + escapeHtml(header) + '</th>').join("") + '</tr></thead>'
            : '';

          const tableBody = rows.length
            ? '<tbody>' + rows.map((row) => '<tr>' + row.map((cell) => '<td>' + escapeHtml(cell) + '</td>').join("") + '</tr>').join("") + '</tbody>'
            : '<tbody><tr><td>Tablo verisi yok.</td></tr></tbody>';

          return blockWrapper(block, \`
            <div class="table-block">
              <div class="table-wrap">
                <table>
                  \${tableHead}
                  \${tableBody}
                </table>
              </div>
            </div>
          \`);
        }

        if (block.type === "html") {
          return blockWrapper(block, '<div class="html-block">' + (block.html || "") + '</div>');
        }

        if (block.type === "spacer") {
                    const totalCols = Math.max(1, Math.min(${MAX_GRID_COLUMNS}, Number(CURRENT_PAGE.pageOptions?.gridColumns || 12)));
          return '<div data-block-id="' + escapeHtml(block.id || "") + '" data-block-type="' + escapeHtml(block.type || "") + '" style="grid-column:1 / span ' + totalCols + ';grid-row:' + Number(block.rowStartDesktop || 1) + ' / span ' + Number(block.rowSpan || 1) + ';height:' + Number(block.height || 32) + 'px"></div>';
        }

        return "";
      }

      function bindBlockClicks(){
        document.querySelectorAll("[data-block-id]").forEach(function(node){
          node.addEventListener("click", function(e){
            e.preventDefault();
            e.stopPropagation();
            const id = node.getAttribute("data-block-id");
            highlight(id);
            send({ type:"vera:blockSelected", blockId:id });
          }, true);
        });
      }

      function rerenderPage(){
        const content = document.getElementById("content");
        if(content){
          content.innerHTML = (Array.isArray(CURRENT_PAGE.blocks) ? CURRENT_PAGE.blocks : []).map(renderBlock).join("");
        }

        const wrap = document.querySelector(".wrap");
        if(wrap){
          wrap.style.maxWidth = Number(CURRENT_PAGE.pageOptions?.contentWidth || 1200) + "px";
          wrap.style.paddingLeft = Number(CURRENT_PAGE.pageOptions?.pagePaddingX || 24) + "px";
          wrap.style.paddingRight = Number(CURRENT_PAGE.pageOptions?.pagePaddingX || 24) + "px";
        }

        const stack = document.querySelector(".stack");
        if(stack){
          stack.style.gridTemplateColumns = 'repeat(' + Number(CURRENT_PAGE.pageOptions?.gridColumns || 12) + ', minmax(0,1fr))';
          stack.style.gap = Number(CURRENT_PAGE.pageOptions?.sectionGap || 18) + "px";
        }

        bindBlockClicks();
      }

      document.addEventListener("click", function(e){
        const node = e.target.closest("[data-block-id]");
        if(!node) return;
        e.preventDefault();
        e.stopPropagation();
        const id = node.getAttribute("data-block-id");
        highlight(id);
        send({ type:"vera:blockSelected", blockId:id });
      }, true);

      window.addEventListener("message", function(event){
        const data = event.data || {};
        if(data.type === "vera:selectBlock"){
          highlight(data.blockId);
        }
        if(data.type === "vera:requestSnapshot"){
          send({
            type:"vera:snapshot",
            blocks: collectRects(),
            page: PAGE_INFO,
            height: document.documentElement.scrollHeight
          });
        }
        if(data.type === "vera:updatePage" && data.page){
          CURRENT_PAGE = data.page;
          BLOCKS = Array.isArray(CURRENT_PAGE.blocks)
            ? CURRENT_PAGE.blocks.map(function(block){ return { id:block.id || "", type:block.type || "" }; })
            : [];
          rerenderPage();
          send({
            type:"vera:snapshot",
            blocks: collectRects(),
            page: PAGE_INFO,
            height: document.documentElement.scrollHeight
          });
        }
      });

      window.addEventListener("load", function(){
        document.body.classList.add("vera-designer-mode");
        bindBlockClicks();
        send({
          type:"vera:ready",
          blocks: BLOCKS,
          page: PAGE_INFO,
          height: document.documentElement.scrollHeight
        });
        setTimeout(function(){
          send({
            type:"vera:snapshot",
            blocks: collectRects(),
            page: PAGE_INFO,
            height: document.documentElement.scrollHeight
          });
        }, 120);
      });

      window.addEventListener("resize", function(){
        send({
          type:"vera:snapshot",
          blocks: collectRects(),
          page: PAGE_INFO,
          height: document.documentElement.scrollHeight
        });
      });
    })();
  </script>`;
}


function defaultSiteSettings() {
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
    showTopCta: false,
    topCtaText: "",
    topCtaLink: "#",
    topCtaStyle: "primary",
    topCtaAction: { type: "url", url: "#", pageId: "", anchor: "", email: "", phone: "", whatsapp: "", downloadUrl: "", newTab: false },
    menuItems: [],
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
      columns: [],
      socialLinks: []
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

function normalizeSiteSettings(raw = {}) {
  const base = defaultSiteSettings();
  const header = { ...base.header, ...(raw.header || {}) };
  const footer = { ...base.footer, ...(raw.footer || {}) };
  const theme = { ...base.theme, ...(raw.theme || {}) };
  const custom = { ...base.custom, ...(raw.custom || {}) };

  return {
    ...base,
    ...raw,
    contactAddress: normalizeText(raw.contactAddress),
    topCtaStyle: ["primary", "secondary", "ghost"].includes(raw.topCtaStyle) ? raw.topCtaStyle : header.ctaStyle,
    topCtaAction: normalizeAction(raw.topCtaAction, raw.topCtaLink || base.topCtaLink),
    header: {
      ...header,
      ctaStyle: ["primary", "secondary", "ghost"].includes(header.ctaStyle) ? header.ctaStyle : (["primary", "secondary", "ghost"].includes(raw.topCtaStyle) ? raw.topCtaStyle : base.header.ctaStyle)
    },
    footer: {
      ...footer,
      bottomText: normalizeText(footer.bottomText || raw.footerText, base.footer.bottomText),
      columns: Array.isArray(footer.columns) ? footer.columns : [],
      socialLinks: Array.isArray(footer.socialLinks) ? footer.socialLinks : []
    },
    theme,
    custom
  };
}

function ctaClassName(style = "primary") {
  if (style === "secondary") return "top-cta top-cta-secondary";
  if (style === "ghost") return "top-cta top-cta-ghost";
  return "top-cta";
}


function renderPage({ siteSettings, page, currentPath, isDesigner, pages = [] }) {
  const settings = normalizeSiteSettings(siteSettings);
  const theme = { ...settings.theme, ...(page.theme || {}) };

  const pageOptions = page.pageOptions || {};
  const headerVisible = settings.showHeader !== false && pageOptions.showHeader !== false;
  const footerVisible = settings.showFooter !== false && pageOptions.showFooter !== false;
  const blocks = Array.isArray(page.blocks) ? page.blocks : [];
  const overrides = page.overrides || {};
  const code = page.code || { html: "", css: "", js: "" };
  const isCodeMode = page.editorMode === "code";
  const canonicalUrl = currentPath ? currentPath : "/";
  const title = page.metaTitle || page.title || settings.siteName || "Vera";
  const description = page.metaDescription || "";
  const headerCtaStyle = settings.header?.ctaStyle || settings.topCtaStyle || "primary";

  const contentHtml = isCodeMode
    ? `${code.html || ""}`
    : blocks.map((block) => renderBlock(block, pageOptions, { isDesigner, pages })).join("") + (overrides.html || "");

  const topCtaHtml = settings.showTopCta && settings.topCtaText
    ? (() => {
        const ctaHref = resolveActionHref(settings.topCtaAction, pages, settings.topCtaLink || "#");
        return `<a class="${ctaClassName(headerCtaStyle)}" href="${escapeHtml(ctaHref)}"${actionAttrs(settings.topCtaAction, ctaHref)}>${escapeHtml(settings.topCtaText)}</a>`;
      })()
    : "";

  const footerColumnsHtml = Array.isArray(settings.footer?.columns) && settings.footer.columns.length
    ? `<div class="footer-columns">${
        settings.footer.columns.map((column) => {
          const links = Array.isArray(column.links) ? column.links : [];
          return `<section class="footer-column">
            ${column.title ? `<h3>${escapeHtml(column.title)}</h3>` : ""}
            ${column.text ? `<p>${escapeHtml(column.text)}</p>` : ""}
            ${links.length ? `<div class="footer-links">${
              links.map((link) => {
                const href = resolveActionHref(link.action, pages, link.action?.url || "#");
                return `<a href="${escapeHtml(href)}"${actionAttrs(link.action, href)}>${escapeHtml(link.text || "Link")}</a>`;
              }).join("")
            }</div>` : ""}
          </section>`;
        }).join("")
      }</div>`
    : "";

  const footerSocialHtml = Array.isArray(settings.footer?.socialLinks) && settings.footer.socialLinks.length
    ? `<div class="footer-social">${
        settings.footer.socialLinks.map((item) => {
          const href = resolveActionHref(item.action, pages, item.action?.url || "#");
          return `<a href="${escapeHtml(href)}"${actionAttrs(item.action, href)}>${escapeHtml(item.label || "Sosyal")}</a>`;
        }).join("")
      }</div>`
    : "";

  const footerContactHtml = settings.footer?.showContactInfo !== false
    ? [settings.contactEmail, settings.contactPhone, settings.contactAddress].filter(Boolean).join(" • ")
    : "";

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
  <meta name="robots" content="${isDesigner ? "noindex,nofollow" : "index,follow"}" />
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}" />
  <style>
    *{box-sizing:border-box}
    :root{
      --body-bg:${theme.bodyBg || "#f8fafc"};
      --body-text:${theme.bodyText || "#0f172a"};
      --border-color:${theme.borderColor || "#e2e8f0"};
      --primary-color:${theme.primaryColor || "#2563eb"};
      --secondary-color:${theme.secondaryColor || "#0f172a"};
      --surface-color:${theme.surfaceColor || "#ffffff"};
      --muted-text:${theme.mutedText || "#64748b"};
      --header-bg:${theme.headerBg || "#ffffff"};
      --footer-bg:${theme.footerBg || "#ffffff"};
      --container-width:${Number(theme.containerWidth || 1200)}px;
      --card-radius:${Number(theme.radius || 18)}px;
      --button-radius:${Number(theme.buttonRadius || 12)}px;
    }
    html{scroll-behavior:smooth}
    body{margin:0;font-family:${escapeHtml(theme.fontFamily || "Arial, sans-serif")};background:var(--body-bg);color:var(--body-text)}
    a{color:inherit}
    .skip-link{position:absolute;left:-9999px;top:12px;background:#fff;color:#0f172a;padding:10px 14px;border-radius:10px;border:1px solid var(--border-color);z-index:1000;text-decoration:none;font-weight:700}
    .skip-link:focus{left:12px}
    .contact-bar{background:var(--secondary-color);color:#fff;font-size:13px}
    .contact-bar-inner,.site-header-inner,.site-footer-inner{max-width:var(--container-width);margin:0 auto;padding-left:24px;padding-right:24px}
    .contact-bar-inner{min-height:36px;display:flex;align-items:center}
    .site-header{border-bottom:1px solid var(--border-color);background:${settings.header?.transparent ? "transparent" : "var(--header-bg)"};backdrop-filter:blur(10px);${settings.header?.sticky !== false ? "position:sticky;top:0;" : "position:relative;"}z-index:30}
    .site-header-inner{min-height:72px;display:flex;align-items:center;justify-content:space-between;gap:16px}
    .site-brand{text-decoration:none;font-size:24px;font-weight:800}
    .site-nav{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
    .site-nav a{text-decoration:none;color:#334155;font-weight:700;font-size:14px;padding:8px 10px;border-radius:10px;transition:background .18s ease,color .18s ease}
    .site-nav a:hover,.site-nav a.active{background:#eff6ff;color:#1d4ed8}
    .top-cta{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;border-radius:var(--button-radius);padding:11px 16px;font-weight:700;background:var(--primary-color);color:#ffffff;border:1px solid var(--primary-color);transition:transform .18s ease,box-shadow .18s ease}
    .top-cta:hover{transform:translateY(-1px);box-shadow:0 10px 22px rgba(37,99,235,.18)}
    .top-cta-secondary{background:var(--secondary-color);border-color:var(--secondary-color)}
    .top-cta-ghost{background:transparent;color:var(--body-text);border-color:var(--border-color);box-shadow:none}
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
      grid-auto-flow:dense;
      grid-auto-rows:minmax(24px, auto);
      align-items:start;
      min-height:40vh;
    }
    .block-shell{width:100%;display:flex;min-width:0}
    .block-inner{
      width:100%;
      min-width:0;
      border:1px solid var(--border-color);
      box-shadow:0 1px 2px rgba(15,23,42,.05);
      overflow-wrap:anywhere;
      border-radius:var(--card-radius);
      background:var(--surface-color);
    }
    .hero h1{margin:0 0 12px;font-size:38px;line-height:1.15}
    .hero p{margin:0 0 24px;line-height:1.7;font-size:16px}
    .actions{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
    a.btn{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;border-radius:var(--button-radius);padding:12px 18px;font-weight:700;border:1px solid #cbd5e1;color:#0f172a;background:#ffffff;min-width:120px;transition:transform .18s ease,box-shadow .18s ease}
    a.btn:hover{transform:translateY(-1px);box-shadow:0 8px 18px rgba(15,23,42,.08)}
    a.btn.primary{background:var(--primary-color);color:#ffffff;border-color:var(--primary-color)}
    .text-block h2{margin:0 0 10px;font-size:24px}
    .text-block p{margin:0;line-height:1.8;white-space:pre-line}
    .image-block img{max-width:100%;border-radius:12px;display:inline-block;height:auto}
    .button-block{display:flex}.button-block.left{justify-content:flex-start}.button-block.center{justify-content:center}.button-block.right{justify-content:flex-end}
    .html-block{line-height:1.8}
    .site-footer{margin-top:28px;border-top:1px solid var(--border-color);background:var(--footer-bg)}
    .site-footer-inner{padding-top:24px;padding-bottom:24px;display:grid;gap:18px}
    .footer-columns{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
    .footer-column h3{margin:0 0 10px;font-size:18px}
    .footer-column p{margin:0 0 10px;color:var(--muted-text);line-height:1.7;white-space:pre-line}
    .footer-links{display:grid;gap:8px}
    .footer-links a,.footer-social a{text-decoration:none;color:var(--muted-text);font-size:14px}
    .footer-links a:hover,.footer-social a:hover{color:var(--body-text)}
    .footer-bottom{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;flex-wrap:wrap;padding-top:8px;border-top:1px solid var(--border-color)}
    .footer-muted{color:var(--muted-text);font-size:14px;white-space:pre-line}
    .footer-social{display:flex;gap:12px;flex-wrap:wrap}
    @media(max-width:1024px){
      .block-shell{grid-column: var(--col-start-tablet) / span var(--col-span-tablet) !important}
    }
    @media(max-width:640px){
      .block-shell{grid-column: var(--col-start-mobile) / span var(--col-span-mobile) !important}
    }
    @media(max-width:900px){
      .site-header-inner{flex-direction:column;align-items:flex-start}
      .footer-columns{grid-template-columns:1fr}
      .hero h1{font-size:30px}
    }
    ${overrides.css || ""}
    ${isCodeMode ? code.css || "" : ""}
  </style>
  ${settings.custom?.headHtml || ""}
  ${isDesigner ? renderDesignerBridge(page, currentPath) : ""}
</head>
<body class="${escapeHtml(pageOptions.customBodyClass || "")}">
  <a class="skip-link" href="#content">İçeriğe geç</a>
  ${settings.custom?.beforeBodyHtml || ""}
  ${headerVisible ? `
    ${settings.header?.showContactBar && settings.header?.contactBarText ? `<div class="contact-bar"><div class="contact-bar-inner">${escapeHtml(settings.header.contactBarText)}</div></div>` : ""}
    <header class="site-header">
      <div class="site-header-inner">
        <a class="site-brand" href="${escapeHtml(normalizeLink(settings.logoLink || "/", "/"))}">${escapeHtml(settings.logoText || settings.siteName || "Vera")}</a>
        <nav class="site-nav" aria-label="Site menüsü">${renderMenuItems(settings.menuItems || [], currentPath, pages)}</nav>
        ${topCtaHtml}
      </div>
    </header>
  ` : ""}
  <main class="wrap">
    <div id="content" class="stack">${contentHtml}</div>
  </main>
  ${footerVisible ? `
    <footer class="site-footer">
      <div class="site-footer-inner">
        ${footerColumnsHtml}
        <div class="footer-bottom">
          <div class="footer-muted">${escapeHtml(settings.footer?.bottomText || settings.footerText || "")}</div>
          <div class="footer-muted">${escapeHtml(footerContactHtml)}</div>
          ${footerSocialHtml}
        </div>
      </div>
    </footer>
  ` : ""}
  ${settings.custom?.afterBodyHtml || ""}
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
  const normalizedPathname = pathname !== "/" ? pathname.replace(/\/+$/, "") : "/";
  const isDesigner = url.searchParams.get("vera_designer") === "1";

  if (
    normalizedPathname.startsWith("/api/") ||
    normalizedPathname.startsWith("/admin") ||
    normalizedPathname === "/login" ||
    normalizedPathname === "/login.html" ||
    normalizedPathname.startsWith("/functions/") ||
    pathname.includes(".")
  ) {
    return context.next();
  }

  const pagesRaw = await env.AUTH_KV.get("site:pages", { type: "json" });
  const settingsRaw = await env.AUTH_KV.get("site:settings", { type: "json" });
  const contentRaw = await env.AUTH_KV.get("site:content", { type: "json" });

  const pages = Array.isArray(pagesRaw?.pages) ? pagesRaw.pages : [];
  const siteSettings = normalizeSiteSettings(settingsRaw || {});

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
      pageOptions: contentRaw.pageOptions || {
        showHeader: true,
        showFooter: true,
        customBodyClass: "",
        contentWidth: 1200,
        pagePaddingX: 24,
        sectionGap: 18,
        gridColumns: 12
      },
      theme: contentRaw.theme || {},
      blocks: Array.isArray(contentRaw.blocks) ? contentRaw.blocks : [],
      overrides: contentRaw.overrides || { html: "", css: "", js: "" },
      code: { html: "", css: "", js: "" }
    };
  }

  if (!page) {
    return html(render404(), 404);
  }

  if (contentRaw?.theme && !page.theme) {
    page.theme = contentRaw.theme;
  }

  const canonicalPath = pathname || "/";
  return html(renderPage({ siteSettings, page, currentPath: canonicalPath, isDesigner, pages }));
}
