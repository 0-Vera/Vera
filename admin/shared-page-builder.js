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
      contentWidthMode: block.contentWidthMode === "boxed" ? "boxed" : "full"
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
targetMirrorBlocksWrap: options.mirrorBlocksWrap || null,
targetPreviewWrap: options.previewWrap,
      onChange: typeof options.onChange === "function" ? options.onChange : () => {},
      dragIndex: null,
      selectedId: null
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
      renderPreview();
      renderBlocks();
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
      else return;

      const normalized = normalizeBlock(block, order);
      state.blocks.push(normalized);
      state.selectedId = normalized.id;
      render();
      emitChange();
    }

    function duplicateBlock(index) {
      const source = clone(state.blocks[index]);
      source.id = uid();
      const next = normalizeBlock(source, index + 1);
      state.blocks.splice(index + 1, 0, next);
      state.selectedId = next.id;
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

    function renderBlockFields(block) {
      if (block.type === "hero") {
        return `
          <label>Başlık</label>
          <input data-key="title" value="${escapeHtml(block.title)}">
          <label>Açıklama</label>
          <textarea data-key="text">${escapeHtml(block.text)}</textarea>
          <label>Birinci Buton Metni</label>
          <input data-key="primaryText" value="${escapeHtml(block.primaryText)}">
          <label>Birinci Buton Linki</label>
          <input data-key="primaryLink" value="${escapeHtml(block.primaryLink)}">
          <label>İkinci Buton Metni</label>
          <input data-key="secondaryText" value="${escapeHtml(block.secondaryText)}">
          <label>İkinci Buton Linki</label>
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
          <label>Buton Metni</label>
          <input data-key="text" value="${escapeHtml(block.text)}">
          <label>Link</label>
          <input data-key="link" value="${escapeHtml(block.link)}">
          <label>Stil</label>
          <select data-key="style">
            <option value="primary" ${block.style === "primary" ? "selected" : ""}>Primary</option>
            <option value="secondary" ${block.style === "secondary" ? "selected" : ""}>Secondary</option>
          </select>
        `;
      }

      if (block.type === "image") {
        return `
          <label>Görsel URL</label>
          <input data-key="src" value="${escapeHtml(block.src)}">
          <label>Alt Metin</label>
          <input data-key="alt" value="${escapeHtml(block.alt)}">
          <label>Genişlik</label>
          <input data-key="width" value="${escapeHtml(block.width)}">
          <label>Tıklama Linki</label>
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

    function styleFields(block) {
      return `
        <div class="builder-grid">
          <div>
            <label>Arka Plan</label>
            <input data-key="background" value="${escapeHtml(block.background)}">
          </div>
          <div>
            <label>Yazı Rengi</label>
            <input data-key="color" value="${escapeHtml(block.color)}">
          </div>
          <div>
            <label>Padding</label>
            <input data-key="padding" type="number" value="${Number(block.padding || 24)}">
          </div>
          <div>
            <label>Radius</label>
            <input data-key="radius" type="number" value="${Number(block.radius || 18)}">
          </div>
          <div>
            <label>Hizalama</label>
            <select data-key="align">
              <option value="left" ${block.align === "left" ? "selected" : ""}>Sol</option>
              <option value="center" ${block.align === "center" ? "selected" : ""}>Orta</option>
              <option value="right" ${block.align === "right" ? "selected" : ""}>Sağ</option>
            </select>
          </div>
          <div>
            <label>Maks. Genişlik (%)</label>
            <input data-key="maxWidth" type="number" min="30" max="100" value="${Number(block.maxWidth || 100)}">
          </div>
          <div>
            <label>CSS Class</label>
            <input data-key="cssClass" value="${escapeHtml(block.cssClass || "")}">
          </div>
          <div>
            <label>HTML ID</label>
            <input data-key="htmlId" value="${escapeHtml(block.htmlId || "")}">
          </div>
        </div>

        <div class="builder-grid" style="margin-top:12px">
          <div>
            <label>Tam Genişlik</label>
            <select data-key="fullWidth">
              <option value="false" ${!block.fullWidth ? "selected" : ""}>Hayır</option>
              <option value="true" ${block.fullWidth ? "selected" : ""}>Evet</option>
            </select>
          </div>
          <div>
            <label>Desktop Başlangıç</label>
            <input data-key="colStartDesktop" type="number" min="1" max="12" value="${Number(block.colStartDesktop || 1)}" ${block.fullWidth ? "disabled" : ""}>
          </div>
          <div>
            <label>Desktop Kolon</label>
            <input data-key="colSpanDesktop" type="number" min="1" max="12" value="${Number(block.colSpanDesktop || 12)}" ${block.fullWidth ? "disabled" : ""}>
          </div>
          <div>
            <label>Tablet Başlangıç</label>
            <input data-key="colStartTablet" type="number" min="1" max="12" value="${Number(block.colStartTablet || 1)}" ${block.fullWidth ? "disabled" : ""}>
          </div>
          <div>
            <label>Tablet Kolon</label>
            <input data-key="colSpanTablet" type="number" min="1" max="12" value="${Number(block.colSpanTablet || 12)}" ${block.fullWidth ? "disabled" : ""}>
          </div>
          <div>
            <label>Mobil Başlangıç</label>
            <input data-key="colStartMobile" type="number" min="1" max="12" value="${Number(block.colStartMobile || 1)}" ${block.fullWidth ? "disabled" : ""}>
          </div>
          <div>
            <label>Mobil Kolon</label>
            <input data-key="colSpanMobile" type="number" min="1" max="12" value="${Number(block.colSpanMobile || 12)}" ${block.fullWidth ? "disabled" : ""}>
          </div>
          <div>
            <label>Satır Yüksekliği</label>
            <input data-key="rowSpan" type="number" min="1" max="12" value="${Number(block.rowSpan || 1)}">
          </div>
          <div>
            <label>Min. Yükseklik (px)</label>
            <input data-key="minHeight" type="number" min="0" max="2000" value="${Number(block.minHeight || 0)}">
          </div>
          <div>
            <label>İç Genişlik</label>
            <select data-key="contentWidthMode">
              <option value="full" ${block.contentWidthMode === "full" ? "selected" : ""}>Tam</option>
              <option value="boxed" ${block.contentWidthMode === "boxed" ? "selected" : ""}>Kutulu</option>
            </select>
          </div>
          <div>
            <label>İç Maks. Genişlik (%)</label>
            <input data-key="innerMaxWidth" type="number" min="20" max="100" value="${Number(block.innerMaxWidth || 100)}">
          </div>
        </div>
      `;
    }

function renderBlocks() {
  const wraps = [state.targetBlocksWrap, state.targetMirrorBlocksWrap].filter(Boolean);

  wraps.forEach((wrap) => {
    wrap.innerHTML = "";

    if (!state.blocks.length) {
      wrap.innerHTML = "<p style='color:#64748b'>Henüz blok yok.</p>";
      return;
    }

    state.blocks.forEach((block, index) => {
      const selectedClass = block.id === state.selectedId ? " builder-item-selected" : "";
      const el = document.createElement("div");
      el.className = "builder-item" + selectedClass;
      el.setAttribute("draggable", "true");
      el.dataset.index = String(index);

      el.innerHTML = `
        <div class="builder-head">
          <div class="builder-title">${block.type.toUpperCase()} BLOĞU</div>
          <div class="builder-actions">
            <button class="mini-btn duplicate" type="button">Kopyala</button>
            <button class="mini-btn up" type="button">Yukarı</button>
            <button class="mini-btn down" type="button">Aşağı</button>
            <button class="mini-btn danger remove" type="button">Sil</button>
          </div>
        </div>

        <div style="margin-bottom:10px;color:#64748b;font-size:12px">Sürükleyip bırakarak blok sırasını değiştirebilirsin.</div>

        <label>Görünürlük</label>
        <select data-key="visible">
          <option value="true" ${block.visible !== false ? "selected" : ""}>Aktif</option>
          <option value="false" ${block.visible === false ? "selected" : ""}>Pasif</option>
        </select>

        ${renderBlockFields(block)}
        ${styleFields(block)}
      `;

      el.addEventListener("click", () => {
        setSelected(block.id);
      });

      el.addEventListener("dragstart", () => {
        state.dragIndex = index;
        el.style.opacity = "0.5";
      });

      el.addEventListener("dragend", () => {
        state.dragIndex = null;
        el.style.opacity = "";
        wraps.forEach((targetWrap) => {
          targetWrap.querySelectorAll(".builder-item").forEach((node) => {
            node.style.borderColor = "";
            node.style.boxShadow = "";
          });
        });
      });

      el.addEventListener("dragover", (event) => {
        event.preventDefault();
        el.style.borderColor = "#2563eb";
        el.style.boxShadow = "0 0 0 2px rgba(37,99,235,.08)";
      });

      el.addEventListener("dragleave", () => {
        el.style.borderColor = "";
        el.style.boxShadow = "";
      });

      el.addEventListener("drop", (event) => {
        event.preventDefault();
        el.style.borderColor = "";
        el.style.boxShadow = "";
        moveBlockToIndex(state.dragIndex, index);
      });

      el.querySelector(".duplicate").addEventListener("click", (e) => {
        e.stopPropagation();
        duplicateBlock(index);
      });

      el.querySelector(".up").addEventListener("click", (e) => {
        e.stopPropagation();
        moveBlock(index, -1);
      });

      el.querySelector(".down").addEventListener("click", (e) => {
        e.stopPropagation();
        moveBlock(index, 1);
      });

      el.querySelector(".remove").addEventListener("click", (e) => {
        e.stopPropagation();
        removeBlock(index);
      });

      el.querySelectorAll("[data-key]").forEach((field) => {
        const applyValue = () => {
          const key = field.getAttribute("data-key");
          let value = field.value;

          if (key === "visible" || key === "fullWidth") value = value === "true";

          if ([
            "padding",
            "radius",
            "maxWidth",
            "height",
            "colStartDesktop",
            "colSpanDesktop",
            "colStartTablet",
            "colSpanTablet",
            "colStartMobile",
            "colSpanMobile",
            "rowSpan",
            "minHeight",
            "innerMaxWidth"
          ].includes(key)) {
            value = Number(value || 0);
          }

          state.blocks[index][key] = value;
          state.blocks[index] = normalizeBlock(state.blocks[index], index);
          render();
          emitChange();
        };

        field.addEventListener("input", applyValue);
        field.addEventListener("change", applyValue);
      });

      wrap.appendChild(el);
    });
  });
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

      if (block.type === "image") {
        return block.src
          ? `<img src="${escapeHtml(block.src)}" alt="${escapeHtml(block.alt || "")}" style="max-width:${escapeHtml(block.width || "100%")};width:100%;border-radius:12px;">`
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

    function renderSelectedInspector() {
      const index = getSelectedIndex();
      if (index < 0) return `<p style="color:#64748b;margin:0">Bir blok seç.</p>`;

      const block = state.blocks[index];

      return `
        <div class="design-inspector-card">
          <div class="design-inspector-title">Seçili Blok: ${escapeHtml(block.type.toUpperCase())}</div>

          <div class="design-control-row">
            <button class="mini-btn" data-action="move-left" type="button">Sola Kaydır</button>
            <button class="mini-btn" data-action="move-right" type="button">Sağa Kaydır</button>
            <button class="mini-btn" data-action="shrink" type="button">Daralt</button>
            <button class="mini-btn" data-action="grow" type="button">Genişlet</button>
            <button class="mini-btn" data-action="row-less" type="button">Yüksekliği Azalt</button>
            <button class="mini-btn" data-action="row-more" type="button">Yüksekliği Artır</button>
            <button class="mini-btn" data-action="toggle-full" type="button">${block.fullWidth ? "Tam Genişlik Kapat" : "Tam Genişlik Aç"}</button>
          </div>

          <div class="builder-grid compact-grid" style="margin-top:12px">
            <div>
              <label>Desktop Başlangıç</label>
              <input id="design-colStartDesktop" type="number" min="1" max="12" value="${Number(block.colStartDesktop || 1)}" ${block.fullWidth ? "disabled" : ""}>
            </div>
            <div>
              <label>Desktop Kolon</label>
              <input id="design-colSpanDesktop" type="number" min="1" max="12" value="${Number(block.colSpanDesktop || 12)}" ${block.fullWidth ? "disabled" : ""}>
            </div>
            <div>
              <label>Satır Span</label>
              <input id="design-rowSpan" type="number" min="1" max="12" value="${Number(block.rowSpan || 1)}">
            </div>
            <div>
              <label>Tablet Başlangıç</label>
              <input id="design-colStartTablet" type="number" min="1" max="12" value="${Number(block.colStartTablet || 1)}" ${block.fullWidth ? "disabled" : ""}>
            </div>
            <div>
              <label>Tablet Kolon</label>
              <input id="design-colSpanTablet" type="number" min="1" max="12" value="${Number(block.colSpanTablet || 12)}" ${block.fullWidth ? "disabled" : ""}>
            </div>
            <div>
              <label>Mobil Başlangıç</label>
              <input id="design-colStartMobile" type="number" min="1" max="12" value="${Number(block.colStartMobile || 1)}" ${block.fullWidth ? "disabled" : ""}>
            </div>
            <div>
              <label>Mobil Kolon</label>
              <input id="design-colSpanMobile" type="number" min="1" max="12" value="${Number(block.colSpanMobile || 12)}" ${block.fullWidth ? "disabled" : ""}>
            </div>
            <div>
              <label>Min. Yükseklik</label>
              <input id="design-minHeight" type="number" min="0" max="2000" value="${Number(block.minHeight || 0)}">
            </div>
          </div>
        </div>
      `;
    }

    function attachInspectorEvents() {
      const preview = state.targetPreviewWrap;
      if (!preview) return;

      preview.querySelectorAll("[data-action]").forEach((btn) => {
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

      const index = getSelectedIndex();
      if (index < 0) return;

      const bind = (id, key, numeric = true) => {
        const input = preview.querySelector("#" + id);
        if (!input) return;
        const apply = () => {
          updateBlock(index, { [key]: numeric ? Number(input.value || 0) : input.value });
        };
        input.addEventListener("input", apply);
        input.addEventListener("change", apply);
      };

      bind("design-colStartDesktop", "colStartDesktop");
      bind("design-colSpanDesktop", "colSpanDesktop");
      bind("design-rowSpan", "rowSpan");
      bind("design-colStartTablet", "colStartTablet");
      bind("design-colSpanTablet", "colSpanTablet");
      bind("design-colStartMobile", "colStartMobile");
      bind("design-colSpanMobile", "colSpanMobile");
      bind("design-minHeight", "minHeight");
    }

    function renderPreview() {
      const wrap = state.targetPreviewWrap;
      if (!wrap) return;

      const selectedIndex = getSelectedIndex();
      const selected = selectedIndex >= 0 ? state.blocks[selectedIndex] : null;
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
  <div class="design-mode-shell">
    <div class="design-toolbar-note">
      Tasarım modu: Blok seç, grid üstünde taşı, genişlet, daralt.
    </div>

    <div class="compact-toolbar">
      <button class="mini-btn" data-action="move-left" type="button">Sola</button>
      <button class="mini-btn" data-action="move-right" type="button">Sağa</button>
      <button class="mini-btn" data-action="shrink" type="button">Daralt</button>
      <button class="mini-btn" data-action="grow" type="button">Genişlet</button>
      <button class="mini-btn" data-action="row-less" type="button">Yükseklik -</button>
      <button class="mini-btn" data-action="row-more" type="button">Yükseklik +</button>
      <button class="mini-btn" data-action="toggle-full" type="button">${selected?.fullWidth ? "Tam Genişlik Kapat" : "Tam Genişlik Aç"}</button>
    </div>

    <div
      class="design-canvas"
      style="
        display:grid;
        grid-template-columns:repeat(${totalCols}, minmax(0, 1fr));
        background:
          linear-gradient(to right, rgba(37,99,235,.08) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(37,99,235,.06) 1px, transparent 1px),
          ${state.theme.bodyBg || "#f8fafc"};
        background-size: calc(100% / ${totalCols}) 100%, 100% 48px, auto;
        color:${state.theme.bodyText || "#0f172a"};
        padding:${Number(state.pageLayout.pagePaddingX || 24)}px;
        gap:${Number(state.pageLayout.sectionGap || 18)}px;
        width:100%;
      "
    >
      ${itemsHtml || `<p style="color:#64748b;margin:0">Henüz blok yok.</p>`}
    </div>

    <div class="design-inspector">
      ${selected ? renderSelectedInspector() : `<p style="color:#64748b;margin:0">Bir blok seç.</p>`}
    </div>
  </div>
`;

      wrap.querySelectorAll(".design-item").forEach((node) => {
        node.addEventListener("click", () => {
          setSelected(node.getAttribute("data-id"));
        });
      });

      attachInspectorEvents();
    }

    function render() {
      reindexBlocks();
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
