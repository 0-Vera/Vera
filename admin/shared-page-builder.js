window.VeraPageBuilder = (() => {
  function uid() {
    return "b-" + Math.random().toString(36).slice(2) + Date.now();
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function toNumber(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function clamp(value, min, max, fallback) {
    const n = toNumber(value, fallback);
    return Math.max(min, Math.min(max, n));
  }

  function baseBlock(type, order = 0) {
    return {
      id: uid(),
      order,
      type,
      visible: true,
      background: "#ffffff",
      color: "#0f172a",
      padding: 24,
      radius: 18,
      align: "left",
      maxWidth: 100,
      cssClass: "",
      htmlId: "",
      layoutMode: "grid",
      fullWidth: false,
      colStartDesktop: 1,
      colSpanDesktop: 12,
      colStartTablet: 1,
      colSpanTablet: 12,
      colStartMobile: 1,
      colSpanMobile: 12,
      rowSpan: 1,
      minHeight: 0,
      contentWidthMode: "full",
      innerMaxWidth: 100
    };
  }

  function newHero(order = 0) {
    return {
      ...baseBlock("hero", order),
      title: "Başlık",
      text: "Açıklama",
      primaryText: "Buton",
      primaryLink: "#",
      secondaryText: "",
      secondaryLink: "",
      align: "center",
      padding: 32,
      radius: 20,
      fullWidth: true
    };
  }

  function newText(order = 0) {
    return {
      ...baseBlock("text", order),
      title: "",
      text: "Metin",
      colStartDesktop: 1,
      colSpanDesktop: 6
    };
  }

  function newButton(order = 0) {
    return {
      ...baseBlock("button", order),
      text: "Buton",
      link: "#",
      actionType: "url",
      actionValue: "#",
      actionPageId: "",
      actionNewTab: false,
      style: "primary",
      colStartDesktop: 1,
      colSpanDesktop: 4
    };
  }

  function newImage(order = 0) {
    return {
      ...baseBlock("image", order),
      src: "",
      alt: "",
      width: "100%",
      link: "",
      align: "center",
      colStartDesktop: 7,
      colSpanDesktop: 6
    };
  }

  function newHtml(order = 0) {
    return {
      ...baseBlock("html", order),
      html: "<div>Özel HTML</div>",
      colStartDesktop: 1,
      colSpanDesktop: 12
    };
  }

  function newSpacer(order = 0) {
    return {
      ...baseBlock("spacer", order),
      height: 32,
      background: "transparent",
      padding: 0,
      radius: 0,
      fullWidth: true
    };
  }

  function newSection(order = 0) {
    return {
      ...baseBlock("section", order),
      title: "Bölüm Başlığı",
      text: "Bölüm açıklaması",
      fullWidth: true,
      padding: 28,
      radius: 22,
      contentWidthMode: "boxed",
      innerMaxWidth: 86
    };
  }

  function newFeatures(order = 0) {
    return {
      ...baseBlock("features", order),
      title: "Özellikler",
      text: "Öne çıkan maddeler",
      items: "Hızlı teslimat\nEsnek üretim\nKurumsal destek",
      colStartDesktop: 1,
      colSpanDesktop: 6
    };
  }

  function newCards(order = 0) {
    return {
      ...baseBlock("cards", order),
      title: "Kart Alanı",
      text: "Kart açıklaması",
      items: "Başlık 1|Açıklama 1\nBaşlık 2|Açıklama 2\nBaşlık 3|Açıklama 3",
      colStartDesktop: 1,
      colSpanDesktop: 12
    };
  }

  function newStats(order = 0) {
    return {
      ...baseBlock("stats", order),
      title: "İstatistikler",
      text: "Rakamlarla özet alanı",
      items: "1200+|Teslimat\n98%|Memnuniyet\n16 Yıl|Deneyim\n7/24|Destek",
      fullWidth: true,
      padding: 20,
      radius: 22
    };
  }

  function newFaq(order = 0) {
    return {
      ...baseBlock("faq", order),
      title: "Sık Sorulan Sorular",
      text: "Soru ve cevapları satır satır gir.",
      items: "Soru 1?|Cevap 1\nSoru 2?|Cevap 2",
      colStartDesktop: 1,
      colSpanDesktop: 12
    };
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeStartSpan(start, span, maxCols) {
    let safeSpan = clamp(span, 1, maxCols, maxCols);
    let safeStart = clamp(start, 1, maxCols, 1);

    if (safeStart + safeSpan - 1 > maxCols) {
      safeStart = Math.max(1, maxCols - safeSpan + 1);
    }

    return { start: safeStart, span: safeSpan };
  }

  function normalizeBlock(block = {}, index = 0) {
    const normalized = {
      ...baseBlock(block.type || "text", index),
      ...block,
      order: index,
      padding: clamp(block.padding, 0, 240, 24),
      radius: clamp(block.radius, 0, 80, 18),
      maxWidth: clamp(block.maxWidth, 30, 100, 100),
      rowSpan: clamp(block.rowSpan, 1, 12, 1),
      minHeight: clamp(block.minHeight, 0, 2000, 0),
      innerMaxWidth: clamp(block.innerMaxWidth, 20, 100, 100),
      fullWidth: !!block.fullWidth,
      visible: block.visible !== false,
      layoutMode: block.layoutMode === "free" ? "free" : "grid",
      contentWidthMode: block.contentWidthMode === "boxed" ? "boxed" : "full",
      items: String(block.items || ""),
      actionType: ["none","url","page","anchor","email","phone","whatsapp","download"].includes(block.actionType) ? block.actionType : "url",
      actionValue: String(block.actionValue || block.link || ""),
      actionPageId: String(block.actionPageId || ""),
      actionNewTab: !!block.actionNewTab
    };

    const desktop = normalizeStartSpan(block.colStartDesktop, block.colSpanDesktop, 12);
    const tablet = normalizeStartSpan(block.colStartTablet, block.colSpanTablet, 12);
    const mobile = normalizeStartSpan(block.colStartMobile, block.colSpanMobile, 12);

    normalized.colStartDesktop = desktop.start;
    normalized.colSpanDesktop = desktop.span;
    normalized.colStartTablet = tablet.start;
    normalized.colSpanTablet = tablet.span;
    normalized.colStartMobile = mobile.start;
    normalized.colSpanMobile = mobile.span;

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

  function createBuilder(options) {
    const state = {
      blocks: [],
      theme: options.theme || {
        bodyBg: "#f8fafc",
        bodyText: "#0f172a",
        borderColor: "#e2e8f0",
        primaryColor: "#2563eb",
        containerWidth: 1200
      },
      pageLayout: options.pageLayout || {
        contentWidth: 1200,
        pagePaddingX: 24,
        sectionGap: 18,
        gridColumns: 12
      },
      targetBlocksWrap: options.blocksWrap,
      targetPreviewWrap: options.previewWrap,
      targetInspectorWrap: options.inspectorWrap || null,
      targetToolbarWrap: options.toolbarWrap || null,
      onChange: typeof options.onChange === "function" ? options.onChange : () => {},
      dragIndex: null,
      selectedId: null,
      expandedIds: new Set()
    };

    function reindexBlocks() {
      state.blocks.forEach((block, index) => {
        block.order = index;
      });
    }

    function getSelectedIndex() {
      return state.blocks.findIndex((block) => block.id === state.selectedId);
    }

    function setSelected(id) {
      state.selectedId = id || null;
      render();
    }

    function setBlocks(blocks) {
      state.blocks = Array.isArray(blocks) ? blocks.map((b, i) => normalizeBlock(clone(b), i)) : [];
      reindexBlocks();
      if (!state.selectedId && state.blocks.length) state.selectedId = state.blocks[0].id;
      if (state.selectedId && !state.blocks.find((b) => b.id === state.selectedId)) {
        state.selectedId = state.blocks[0]?.id || null;
      }
      render();
    }

    function getBlocks() {
      reindexBlocks();
      return clone(state.blocks);
    }

    function setTheme(theme = {}) {
      state.theme = {
        bodyBg: theme.bodyBg || "#f8fafc",
        bodyText: theme.bodyText || "#0f172a",
        borderColor: theme.borderColor || "#e2e8f0",
        primaryColor: theme.primaryColor || "#2563eb",
        containerWidth: Number(theme.containerWidth || 1200)
      };
      renderPreview();
    }

    function setPageLayout(layout = {}) {
      state.pageLayout = {
        contentWidth: clamp(layout.contentWidth, 480, 2400, 1200),
        pagePaddingX: clamp(layout.pagePaddingX, 0, 120, 24),
        sectionGap: clamp(layout.sectionGap, 0, 120, 18),
        gridColumns: clamp(layout.gridColumns, 1, 12, 12)
      };
      renderPreview();
    }

    function emitChange() {
      state.onChange(getBlocks());
    }

    function addBlock(type) {
      const order = state.blocks.length;
      let block;
      if (type === "hero") block = newHero(order);
      else if (type === "text") block = newText(order);
      else if (type === "button") block = newButton(order);
      else if (type === "image") block = newImage(order);
      else if (type === "html") block = newHtml(order);
      else if (type === "spacer") block = newSpacer(order);
      else if (type === "section") block = newSection(order);
      else if (type === "features") block = newFeatures(order);
      else if (type === "cards") block = newCards(order);
      else if (type === "stats") block = newStats(order);
      else if (type === "faq") block = newFaq(order);
      else return;

      const normalized = normalizeBlock(block, order);
      state.blocks.push(normalized);
      state.selectedId = normalized.id;
      state.expandedIds.add(normalized.id);
      render();
      emitChange();
    }

    function duplicateBlock(index) {
      const source = clone(state.blocks[index]);
      source.id = uid();
      const next = normalizeBlock(source, index + 1);
      state.blocks.splice(index + 1, 0, next);
      state.selectedId = next.id;
      state.expandedIds.add(next.id);
      render();
      emitChange();
    }

    function moveBlock(index, direction) {
      const target = index + direction;
      if (target < 0 || target >= state.blocks.length) return;
      const temp = state.blocks[index];
      state.blocks[index] = state.blocks[target];
      state.blocks[target] = temp;
      render();
      emitChange();
    }

    function removeBlock(index) {
      const removingId = state.blocks[index]?.id;
      state.blocks.splice(index, 1);
      state.expandedIds.delete(removingId);
      if (state.selectedId === removingId) {
        state.selectedId = state.blocks[0]?.id || null;
      }
      render();
      emitChange();
    }

    function moveBlockToIndex(fromIndex, toIndex) {
      if (fromIndex === toIndex || fromIndex == null || toIndex == null) return;
      if (fromIndex < 0 || toIndex < 0) return;
      if (fromIndex >= state.blocks.length || toIndex >= state.blocks.length) return;

      const moved = state.blocks.splice(fromIndex, 1)[0];
      state.blocks.splice(toIndex, 0, moved);
      render();
      emitChange();
    }

    function updateBlock(index, patch = {}) {
      if (index < 0 || index >= state.blocks.length) return;
      state.blocks[index] = normalizeBlock({
        ...state.blocks[index],
        ...patch
      }, index);
      render();
      emitChange();
    }

    function nudgeSelectedHorizontal(direction) {
      const index = getSelectedIndex();
      if (index < 0) return;
      const block = state.blocks[index];
      if (block.fullWidth) return;
      updateBlock(index, { colStartDesktop: Number(block.colStartDesktop || 1) + direction });
    }

    function resizeSelectedHorizontal(direction) {
      const index = getSelectedIndex();
      if (index < 0) return;
      const block = state.blocks[index];
      if (block.fullWidth) return;
      updateBlock(index, { colSpanDesktop: Number(block.colSpanDesktop || 12) + direction });
    }

    function toggleSelectedFullWidth() {
      const index = getSelectedIndex();
      if (index < 0) return;
      const block = state.blocks[index];
      updateBlock(index, { fullWidth: !block.fullWidth });
    }

    function changeSelectedRowSpan(direction) {
      const index = getSelectedIndex();
      if (index < 0) return;
      const block = state.blocks[index];
      updateBlock(index, { rowSpan: Number(block.rowSpan || 1) + direction });
    }

    function toggleExpanded(id) {
      if (state.expandedIds.has(id)) state.expandedIds.delete(id);
      else state.expandedIds.add(id);
      renderBlocks();
    }


    function pageOptionsHtml(currentValue = "") {
      const pages = Array.isArray(window.VERA_PAGES_FOR_EDITOR) ? window.VERA_PAGES_FOR_EDITOR : [];
      return pages.map((page) => {
        const value = String(page.id || "");
        const label = page.isHome ? `${page.title || "Ana Sayfa"} (/)` : `${page.title || "Sayfa"} (/${page.slug || ""})`;
        return `<option value="${escapeHtml(value)}"${value === String(currentValue || "") ? " selected" : ""}>${escapeHtml(label)}</option>`;
      }).join("");
    }

    function renderActionEditor(block) {
      const currentType = block.actionType || "url";
      const currentValue = block.actionValue || block.link || "";
      const currentPageId = block.actionPageId || "";
      const showValue = currentType !== "none" && currentType !== "page";
      const valueLabelMap = {
        url: "URL",
        anchor: "Anchor",
        email: "E-posta",
        phone: "Telefon",
        whatsapp: "WhatsApp",
        download: "Dosya URL"
      };
      const valueLabel = valueLabelMap[currentType] || "Değer";
      return `
        <label>Eylem</label>
        <select data-key="actionType">
          <option value="url"${currentType === "url" ? " selected" : ""}>URL</option>
          <option value="page"${currentType === "page" ? " selected" : ""}>Sayfa</option>
          <option value="anchor"${currentType === "anchor" ? " selected" : ""}>Anchor</option>
          <option value="email"${currentType === "email" ? " selected" : ""}>E-posta</option>
          <option value="phone"${currentType === "phone" ? " selected" : ""}>Telefon</option>
          <option value="whatsapp"${currentType === "whatsapp" ? " selected" : ""}>WhatsApp</option>
          <option value="download"${currentType === "download" ? " selected" : ""}>Dosya</option>
          <option value="none"${currentType === "none" ? " selected" : ""}>Yok</option>
        </select>
        ${currentType === "page" ? `
          <label>Sayfa Seç</label>
          <select data-key="actionPageId">
            <option value="">Sayfa seç</option>
            ${pageOptionsHtml(currentPageId)}
          </select>
        ` : ""}
        ${showValue ? `
          <label>${valueLabel}</label>
          <input data-key="actionValue" value="${escapeHtml(currentValue)}">
        ` : ""}
        <label><input data-key="actionNewTab" data-bool="1" type="checkbox"${block.actionNewTab ? " checked" : ""}> Yeni sekme</label>
      `;
    }

    function renderBlockFields(block) {
      if (block.type === "hero") {
        return `
          <label>Başlık</label>
          <input data-key="title" value="${escapeHtml(block.title)}">
          <label>Açıklama</label>
          <textarea data-key="text">${escapeHtml(block.text)}</textarea>
          <label>1. Buton</label>
          <input data-key="primaryText" value="${escapeHtml(block.primaryText)}">
          <label>1. Link</label>
          <input data-key="primaryLink" value="${escapeHtml(block.primaryLink)}">
          <label>2. Buton</label>
          <input data-key="secondaryText" value="${escapeHtml(block.secondaryText)}">
          <label>2. Link</label>
          <input data-key="secondaryLink" value="${escapeHtml(block.secondaryLink)}">
        `;
      }

      if (block.type === "text") {
        return `
          <label>Başlık</label>
          <input data-key="title" value="${escapeHtml(block.title)}">
          <label>Metin</label>
          <textarea data-key="text">${escapeHtml(block.text)}</textarea>
        `;
      }

      if (block.type === "button") {
        return `
          <label>Buton</label>
          <input data-key="text" value="${escapeHtml(block.text)}">
          ${renderActionEditor(block)}
          <label>Stil</label>
          <select data-key="style">
            <option value="primary" ${block.style === "primary" ? "selected" : ""}>Primary</option>
            <option value="secondary" ${block.style === "secondary" ? "selected" : ""}>Secondary</option>
            <option value="ghost" ${block.style === "ghost" ? "selected" : ""}>Ghost</option>
          </select>
        `;
      }

      if (block.type === "section") {
        return `
          <h4>${escapeHtml(block.title)}</h4>
          <p>${escapeHtml(block.text)}</p>
        `;
      }

      if (block.type === "features") {
        return `
          <h4>${escapeHtml(block.title)}</h4>
          <p>${escapeHtml(block.text)}</p>
          <ul style="margin:12px 0 0;padding-left:18px;display:grid;gap:6px">
            ${String(block.items || "").split(/\r?\n/).filter(Boolean).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        `;
      }

      if (block.type === "cards") {
        return `
          <h4>${escapeHtml(block.title)}</h4>
          <p>${escapeHtml(block.text)}</p>
          <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:12px">
            ${String(block.items || "").split(/\r?\n/).filter(Boolean).map((line) => {
              const [title, ...rest] = String(line).split("|");
              return `<div style="border:1px solid ${state.theme.borderColor || "#cbd5e1"};border-radius:12px;padding:12px"><strong style="display:block;margin-bottom:6px">${escapeHtml(title || "")}</strong><span style="color:#64748b">${escapeHtml(rest.join("|") || "")}</span></div>`;
            }).join("")}
          </div>
        `;
      }

      if (block.type === "stats") {
        return `
          <label>Başlık</label>
          <input data-key="title" value="${escapeHtml(block.title || "")}">
          <label>Açıklama</label>
          <textarea data-key="text">${escapeHtml(block.text || "")}</textarea>
          <label>İstatistikler (Değer|Açıklama)</label>
          <textarea data-key="items">${escapeHtml(block.items || "")}</textarea>
        `;
      }

      if (block.type === "faq") {
        return `
          <label>Başlık</label>
          <input data-key="title" value="${escapeHtml(block.title || "")}">
          <label>Açıklama</label>
          <textarea data-key="text">${escapeHtml(block.text || "")}</textarea>
          <label>SSS (Soru|Cevap)</label>
          <textarea data-key="items">${escapeHtml(block.items || "")}</textarea>
        `;
      }

      if (block.type === "image") {
        return `
          <label>Görsel URL</label>
          <input data-key="src" value="${escapeHtml(block.src)}">
          <label>Alt</label>
          <input data-key="alt" value="${escapeHtml(block.alt)}">
          <label>Genişlik</label>
          <input data-key="width" value="${escapeHtml(block.width)}">
          <label>Link</label>
          <input data-key="link" value="${escapeHtml(block.link || "")}">
        `;
      }

      if (block.type === "html") {
        return `
          <label>HTML</label>
          <textarea data-key="html">${escapeHtml(block.html)}</textarea>
        `;
      }

      if (block.type === "spacer") {
        return `
          <label>Yükseklik</label>
          <input data-key="height" type="number" value="${Number(block.height || 32)}">
        `;
      }

      return "";
    }

    function renderCompactBlockCard(block, index) {
      const isSelected = block.id === state.selectedId;
      const isExpanded = state.expandedIds.has(block.id);

      return `
        <div class="compact-block-card${isSelected ? " compact-block-selected" : ""}" data-id="${escapeHtml(block.id)}">
          <div class="compact-block-head">
            <button class="compact-arrow" type="button" data-expand="${escapeHtml(block.id)}">${isExpanded ? "▾" : "▸"}</button>
            <button class="compact-title" type="button" data-select="${escapeHtml(block.id)}">${escapeHtml(block.type.toUpperCase())}</button>
            <div class="compact-actions">
              <button class="compact-mini" type="button" data-up="${index}">↑</button>
              <button class="compact-mini" type="button" data-down="${index}">↓</button>
              <button class="compact-mini" type="button" data-copy="${index}">⎘</button>
              <button class="compact-mini danger" type="button" data-remove="${index}">×</button>
            </div>
          </div>

          ${isExpanded ? `
            <div class="compact-block-body">
              <label>Aktif</label>
              <select data-index="${index}" data-key="visible">
                <option value="true" ${block.visible !== false ? "selected" : ""}>Evet</option>
                <option value="false" ${block.visible === false ? "selected" : ""}>Hayır</option>
              </select>
              ${renderBlockFields(block)}
            </div>
          ` : ""}
        </div>
      `;
    }

    function bindCompactCardEvents(wrap) {
      wrap.querySelectorAll("[data-select]").forEach((el) => {
        el.addEventListener("click", () => setSelected(el.getAttribute("data-select")));
      });

      wrap.querySelectorAll("[data-expand]").forEach((el) => {
        el.addEventListener("click", () => toggleExpanded(el.getAttribute("data-expand")));
      });

      wrap.querySelectorAll("[data-up]").forEach((el) => {
        el.addEventListener("click", () => moveBlock(Number(el.getAttribute("data-up")), -1));
      });

      wrap.querySelectorAll("[data-down]").forEach((el) => {
        el.addEventListener("click", () => moveBlock(Number(el.getAttribute("data-down")), 1));
      });

      wrap.querySelectorAll("[data-copy]").forEach((el) => {
        el.addEventListener("click", () => duplicateBlock(Number(el.getAttribute("data-copy"))));
      });

      wrap.querySelectorAll("[data-remove]").forEach((el) => {
        el.addEventListener("click", () => removeBlock(Number(el.getAttribute("data-remove"))));
      });

      wrap.querySelectorAll("[data-index][data-key]").forEach((field) => {
        const applyValue = () => {
          const index = Number(field.getAttribute("data-index"));
          const key = field.getAttribute("data-key");
          let value = field.value;
          if (key === "visible") value = value === "true";
          updateBlock(index, { [key]: value });
        };
        field.addEventListener("input", applyValue);
        field.addEventListener("change", applyValue);
      });
    }

    function renderBlocks() {
      const wrap = state.targetBlocksWrap;
      if (!wrap) return;

      wrap.innerHTML = "";

      if (!state.blocks.length) {
        wrap.innerHTML = "<p style='color:#64748b;margin:0'>Henüz blok yok.</p>";
        return;
      }

      wrap.innerHTML = state.blocks.map((block, index) => renderCompactBlockCard(block, index)).join("");
      bindCompactCardEvents(wrap);
    }

    function getPreviewCardHtml(block) {
      if (block.type === "hero") {
        return `
          <h4>${escapeHtml(block.title)}</h4>
          <p>${escapeHtml(block.text)}</p>
          <div class="builder-preview-actions" style="justify-content:${block.align === "center" ? "center" : block.align === "right" ? "flex-end" : "flex-start"}">
            ${block.primaryText ? `<span style="background:${state.theme.primaryColor};border-color:${state.theme.primaryColor};color:#fff;">${escapeHtml(block.primaryText)}</span>` : ""}
            ${block.secondaryText ? `<span>${escapeHtml(block.secondaryText)}</span>` : ""}
          </div>
        `;
      }

      if (block.type === "text") {
        return `
          ${block.title ? `<h4>${escapeHtml(block.title)}</h4>` : ""}
          <p>${escapeHtml(block.text)}</p>
        `;
      }

      if (block.type === "button") {
        return `
          <div class="builder-preview-actions" style="justify-content:${block.align === "center" ? "center" : block.align === "right" ? "flex-end" : "flex-start"}">
            <span style="${block.style === "primary" ? `background:${state.theme.primaryColor};border-color:${state.theme.primaryColor};color:#fff;` : ""}">${escapeHtml(block.text)}</span>
          </div>
        `;
      }

      if (block.type === "section") {
        return `
          <h4>${escapeHtml(block.title)}</h4>
          <p>${escapeHtml(block.text)}</p>
        `;
      }

      if (block.type === "features") {
        return `
          <h4>${escapeHtml(block.title)}</h4>
          <p>${escapeHtml(block.text)}</p>
          <ul style="margin:12px 0 0;padding-left:18px;display:grid;gap:6px">
            ${String(block.items || "").split(/\r?\n/).filter(Boolean).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
          </ul>
        `;
      }

      if (block.type === "cards") {
        return `
          <h4>${escapeHtml(block.title)}</h4>
          <p>${escapeHtml(block.text)}</p>
          <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:12px">
            ${String(block.items || "").split(/\r?\n/).filter(Boolean).map((line) => {
              const [title, ...rest] = String(line).split("|");
              return `<div style="border:1px solid ${state.theme.borderColor || "#cbd5e1"};border-radius:12px;padding:12px"><strong style="display:block;margin-bottom:6px">${escapeHtml(title || "")}</strong><span style="color:#64748b">${escapeHtml(rest.join("|") || "")}</span></div>`;
            }).join("")}
          </div>
        `;
      }

      if (block.type === "stats") {
        return `
          <label>Başlık</label>
          <input data-key="title" value="${escapeHtml(block.title || "")}">
          <label>Açıklama</label>
          <textarea data-key="text">${escapeHtml(block.text || "")}</textarea>
          <label>İstatistikler (Değer|Açıklama)</label>
          <textarea data-key="items">${escapeHtml(block.items || "")}</textarea>
        `;
      }

      if (block.type === "faq") {
        return `
          <label>Başlık</label>
          <input data-key="title" value="${escapeHtml(block.title || "")}">
          <label>Açıklama</label>
          <textarea data-key="text">${escapeHtml(block.text || "")}</textarea>
          <label>SSS (Soru|Cevap)</label>
          <textarea data-key="items">${escapeHtml(block.items || "")}</textarea>
        `;
      }

      if (block.type === "image") {
        return block.src
          ? `<img src="${escapeHtml(block.src)}" alt="${escapeHtml(block.alt || "")}" style="max-width:${escapeHtml(block.width || "100%")};width:100%;border-radius:10px;">`
          : `<p>Görsel URL girilmedi.</p>`;
      }

      if (block.type === "html") {
        return `<div>${block.html || ""}</div>`;
      }

      if (block.type === "spacer") {
        return `<div style="height:${Number(block.height || 32)}px"></div>`;
      }

      return "";
    }

    function renderToolbar() {
      const wrap = state.targetToolbarWrap;
      if (!wrap) return;

      wrap.innerHTML = `
        <div class="mini-toolbar-row">
          <button class="tiny-btn" data-action="move-left" type="button">←</button>
          <button class="tiny-btn" data-action="move-right" type="button">→</button>
          <button class="tiny-btn" data-action="shrink" type="button">－</button>
          <button class="tiny-btn" data-action="grow" type="button">＋</button>
          <button class="tiny-btn" data-action="row-less" type="button">▭－</button>
          <button class="tiny-btn" data-action="row-more" type="button">▭＋</button>
          <button class="tiny-btn" data-action="toggle-full" type="button">□</button>
        </div>
      `;

      wrap.querySelectorAll("[data-action]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const action = btn.getAttribute("data-action");
          if (action === "move-left") nudgeSelectedHorizontal(-1);
          if (action === "move-right") nudgeSelectedHorizontal(1);
          if (action === "shrink") resizeSelectedHorizontal(-1);
          if (action === "grow") resizeSelectedHorizontal(1);
          if (action === "row-less") changeSelectedRowSpan(-1);
          if (action === "row-more") changeSelectedRowSpan(1);
          if (action === "toggle-full") toggleSelectedFullWidth();
        });
      });
    }

    function renderInspector() {
      const wrap = state.targetInspectorWrap;
      if (!wrap) return;

      const index = getSelectedIndex();
      if (index < 0) {
        wrap.innerHTML = `<div class="mini-inspector-empty">Blok seç</div>`;
        return;
      }

      const block = state.blocks[index];

      wrap.innerHTML = `
        <div class="mini-inspector-card">
          <div class="mini-inspector-title">${escapeHtml(block.type.toUpperCase())}</div>
          <div class="mini-inspector-grid">
            <div>
              <label>D Baş.</label>
              <input id="mini-colStartDesktop" type="number" min="1" max="12" value="${Number(block.colStartDesktop || 1)}" ${block.fullWidth ? "disabled" : ""}>
            </div>
            <div>
              <label>D Kol.</label>
              <input id="mini-colSpanDesktop" type="number" min="1" max="12" value="${Number(block.colSpanDesktop || 12)}" ${block.fullWidth ? "disabled" : ""}>
            </div>
            <div>
              <label>Satır</label>
              <input id="mini-rowSpan" type="number" min="1" max="12" value="${Number(block.rowSpan || 1)}">
            </div>
            <div>
              <label>Min Y.</label>
              <input id="mini-minHeight" type="number" min="0" max="2000" value="${Number(block.minHeight || 0)}">
            </div>
          </div>
        </div>
      `;

      const bind = (id, key) => {
        const input = wrap.querySelector("#" + id);
        if (!input) return;
        const apply = () => updateBlock(index, { [key]: Number(input.value || 0) });
        input.addEventListener("input", apply);
        input.addEventListener("change", apply);
      };

      bind("mini-colStartDesktop", "colStartDesktop");
      bind("mini-colSpanDesktop", "colSpanDesktop");
      bind("mini-rowSpan", "rowSpan");
      bind("mini-minHeight", "minHeight");
    }

    function renderPreview() {
      const wrap = state.targetPreviewWrap;
      if (!wrap) return;

      const totalCols = Number(state.pageLayout.gridColumns || 12);

      const itemsHtml = state.blocks
        .filter((block) => block.visible !== false)
        .map((block) => {
          const selectedClass = block.id === state.selectedId ? " design-item-selected" : "";
          const style = block.fullWidth
            ? `grid-column:1 / span ${totalCols};grid-row:span ${Number(block.rowSpan || 1)};`
            : `grid-column:${Number(block.colStartDesktop || 1)} / span ${Number(block.colSpanDesktop || 12)};grid-row:span ${Number(block.rowSpan || 1)};`;

          const innerStyle =
            block.contentWidthMode === "boxed"
              ? `max-width:${Number(block.innerMaxWidth || 100)}%;margin:${block.align === "center" ? "0 auto" : block.align === "right" ? "0 0 0 auto" : "0"};`
              : "";

          return `
            <div class="design-item${selectedClass}" data-id="${escapeHtml(block.id)}" style="${style}">
              <div
                class="design-card ${block.cssClass || ""}"
                ${block.htmlId ? `id="${escapeHtml(block.htmlId)}"` : ""}
                style="
                  background:${block.background || "#ffffff"};
                  color:${block.color || "#0f172a"};
                  padding:${Number(block.padding || 24)}px;
                  border-radius:${Number(block.radius || 18)}px;
                  text-align:${block.align || "left"};
                  min-height:${Number(block.minHeight || 0)}px;
                  max-width:${Number(block.maxWidth || 100)}%;
                  margin:${block.align === "center" ? "0 auto" : block.align === "right" ? "0 0 0 auto" : "0"};
                  border-color:${state.theme.borderColor || "#cbd5e1"};
                "
              >
                <div style="${innerStyle}">
                  ${getPreviewCardHtml(block)}
                </div>
              </div>
            </div>
          `;
        })
        .join("");

      wrap.innerHTML = `
        <div
          class="design-canvas"
          style="
            display:grid;
            grid-template-columns:repeat(${totalCols}, minmax(0, 1fr));
            background:
              linear-gradient(to right, rgba(37,99,235,.08) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(37,99,235,.06) 1px, transparent 1px),
              ${state.theme.bodyBg || "#f8fafc"};
            background-size: calc(100% / ${totalCols}) 100%, 100% 44px, auto;
            color:${state.theme.bodyText || "#0f172a"};
            padding:${Number(state.pageLayout.pagePaddingX || 24)}px;
            gap:${Number(state.pageLayout.sectionGap || 18)}px;
            width:100%;
          "
        >
          ${itemsHtml || `<p style="color:#64748b;margin:0">Henüz blok yok.</p>`}
        </div>
      `;

      wrap.querySelectorAll(".design-item").forEach((node) => {
        node.addEventListener("click", () => {
          setSelected(node.getAttribute("data-id"));
        });
      });
    }

    function render() {
      reindexBlocks();
      renderToolbar();
      renderInspector();
      renderBlocks();
      renderPreview();
    }

    return {
      setBlocks,
      getBlocks,
      addBlock,
      setTheme,
      setPageLayout,
      render
    };
  }

  return { createBuilder };
})();
