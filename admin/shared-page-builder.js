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
      colSpanDesktop: 12,
      colSpanTablet: 12,
      colSpanMobile: 12,
      rowSpan: 1,
      fullWidth: false,
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
      text: "Metin"
    };
  }

  function newButton(order = 0) {
    return {
      ...baseBlock("button", order),
      text: "Buton",
      link: "#",
      style: "primary",
      colSpanDesktop: 6,
      colSpanTablet: 6,
      colSpanMobile: 12
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
      colSpanDesktop: 6,
      colSpanTablet: 6,
      colSpanMobile: 12
    };
  }

  function newHtml(order = 0) {
    return {
      ...baseBlock("html", order),
      html: "<div>Özel HTML</div>"
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

  function normalizeBlock(block = {}, index = 0) {
    return {
      ...baseBlock(block.type || "text", index),
      ...block,
      order: index,
      padding: clamp(block.padding, 0, 240, 24),
      radius: clamp(block.radius, 0, 80, 18),
      maxWidth: clamp(block.maxWidth, 30, 100, 100),
      colSpanDesktop: clamp(block.colSpanDesktop, 1, 12, 12),
      colSpanTablet: clamp(block.colSpanTablet, 1, 12, 12),
      colSpanMobile: clamp(block.colSpanMobile, 1, 12, 12),
      rowSpan: clamp(block.rowSpan, 1, 12, 1),
      minHeight: clamp(block.minHeight, 0, 2000, 0),
      innerMaxWidth: clamp(block.innerMaxWidth, 20, 100, 100),
      fullWidth: !!block.fullWidth,
      visible: block.visible !== false,
      layoutMode: block.layoutMode === "free" ? "free" : "grid",
      contentWidthMode: block.contentWidthMode === "boxed" ? "boxed" : "full"
    };
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
      onChange: typeof options.onChange === "function" ? options.onChange : () => {},
      dragIndex: null
    };

    function setBlocks(blocks) {
      state.blocks = Array.isArray(blocks) ? blocks.map((b, i) => normalizeBlock(clone(b), i)) : [];
      reindexBlocks();
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

    function reindexBlocks() {
      state.blocks.forEach((block, index) => {
        block.order = index;
      });
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

      state.blocks.push(block);
      render();
      emitChange();
    }

    function duplicateBlock(index) {
      const source = clone(state.blocks[index]);
      source.id = uid();
      state.blocks.splice(index + 1, 0, normalizeBlock(source, index + 1));
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
      state.blocks.splice(index, 1);
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
            <label>Yerleşim</label>
            <select data-key="layoutMode">
              <option value="grid" ${block.layoutMode === "grid" ? "selected" : ""}>Grid</option>
              <option value="free" ${block.layoutMode === "free" ? "selected" : ""}>Serbest</option>
            </select>
          </div>
          <div>
            <label>Tam Genişlik</label>
            <select data-key="fullWidth">
              <option value="false" ${!block.fullWidth ? "selected" : ""}>Hayır</option>
              <option value="true" ${block.fullWidth ? "selected" : ""}>Evet</option>
            </select>
          </div>
          <div>
            <label>Desktop Kolon</label>
            <input data-key="colSpanDesktop" type="number" min="1" max="12" value="${Number(block.colSpanDesktop || 12)}">
          </div>
          <div>
            <label>Tablet Kolon</label>
            <input data-key="colSpanTablet" type="number" min="1" max="12" value="${Number(block.colSpanTablet || 12)}">
          </div>
          <div>
            <label>Mobil Kolon</label>
            <input data-key="colSpanMobile" type="number" min="1" max="12" value="${Number(block.colSpanMobile || 12)}">
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
      const wrap = state.targetBlocksWrap;
      if (!wrap) return;

      wrap.innerHTML = "";

      if (!state.blocks.length) {
        wrap.innerHTML = "<p style='color:#64748b'>Henüz blok yok.</p>";
        return;
      }

      state.blocks.forEach((block, index) => {
        const el = document.createElement("div");
        el.className = "builder-item";
        el.setAttribute("draggable", "true");
        el.dataset.index = String(index);

        let fields = "";

        if (block.type === "hero") {
          fields = `
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
        } else if (block.type === "text") {
          fields = `
            <label>Başlık</label>
            <input data-key="title" value="${escapeHtml(block.title)}">
            <label>Metin</label>
            <textarea data-key="text">${escapeHtml(block.text)}</textarea>
          `;
        } else if (block.type === "button") {
          fields = `
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
        } else if (block.type === "image") {
          fields = `
            <label>Görsel URL</label>
            <input data-key="src" value="${escapeHtml(block.src)}">
            <label>Alt Metin</label>
            <input data-key="alt" value="${escapeHtml(block.alt)}">
            <label>Genişlik</label>
            <input data-key="width" value="${escapeHtml(block.width)}">
            <label>Tıklama Linki</label>
            <input data-key="link" value="${escapeHtml(block.link || "")}">
          `;
        } else if (block.type === "html") {
          fields = `
            <label>HTML</label>
            <textarea data-key="html">${escapeHtml(block.html)}</textarea>
          `;
        } else if (block.type === "spacer") {
          fields = `
            <label>Yükseklik</label>
            <input data-key="height" type="number" value="${Number(block.height || 32)}">
          `;
        }

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

          ${fields}
          ${styleFields(block)}
        `;

        el.addEventListener("dragstart", () => {
          state.dragIndex = index;
          el.style.opacity = "0.5";
        });

        el.addEventListener("dragend", () => {
          state.dragIndex = null;
          el.style.opacity = "";
          wrap.querySelectorAll(".builder-item").forEach((node) => {
            node.style.borderColor = "";
            node.style.boxShadow = "";
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

        el.querySelector(".duplicate").addEventListener("click", () => duplicateBlock(index));
        el.querySelector(".up").addEventListener("click", () => moveBlock(index, -1));
        el.querySelector(".down").addEventListener("click", () => moveBlock(index, 1));
        el.querySelector(".remove").addEventListener("click", () => removeBlock(index));

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
              "colSpanDesktop",
              "colSpanTablet",
              "colSpanMobile",
              "rowSpan",
              "minHeight",
              "innerMaxWidth"
            ].includes(key)) {
              value = Number(value || 0);
            }

            state.blocks[index][key] = value;
            state.blocks[index] = normalizeBlock(state.blocks[index], index);
            renderPreview();
            emitChange();
          };

          field.addEventListener("input", applyValue);
          field.addEventListener("change", applyValue);
        });

        wrap.appendChild(el);
      });
    }

    function getPreviewItemStyle(block) {
      const desktopCols = block.fullWidth ? 12 : Number(block.colSpanDesktop || 12);
      return `
        grid-column: span ${desktopCols};
        grid-row: span ${Number(block.rowSpan || 1)};
        min-height:${Number(block.minHeight || 0)}px;
      `;
    }

    function previewWrapper(block, innerHtml) {
      const innerStyle =
        block.contentWidthMode === "boxed"
          ? `max-width:${Number(block.innerMaxWidth || 100)}%;margin:${block.align === "center" ? "0 auto" : block.align === "right" ? "0 0 0 auto" : "0"};`
          : "";

      return `
        <div
          class="builder-preview-item"
          style="${getPreviewItemStyle(block)}"
        >
          <div
            class="builder-preview-card ${block.cssClass || ""}"
            ${block.htmlId ? `id="${escapeHtml(block.htmlId)}"` : ""}
            style="
              background:${block.background || "#ffffff"};
              color:${block.color || "#0f172a"};
              padding:${Number(block.padding || 24)}px;
              border-radius:${Number(block.radius || 18)}px;
              text-align:${block.align || "left"};
              max-width:${Number(block.maxWidth || 100)}%;
              min-height:${Number(block.minHeight || 0)}px;
              margin:${block.align === "center" ? "0 auto" : block.align === "right" ? "0 0 0 auto" : "0"};
              border-color:${state.theme.borderColor || "#cbd5e1"};
            "
          >
            <div style="${innerStyle}">
              ${innerHtml}
            </div>
          </div>
        </div>
      `;
    }

    function renderPreview() {
      const wrap = state.targetPreviewWrap;
      if (!wrap) return;

      wrap.innerHTML = "";
      wrap.style.background = state.theme.bodyBg || "#f8fafc";
      wrap.style.color = state.theme.bodyText || "#0f172a";
      wrap.style.padding = Number(state.pageLayout.pagePaddingX || 24) + "px";
      wrap.style.borderRadius = "12px";
      wrap.style.display = "grid";
      wrap.style.gridTemplateColumns = `repeat(${Number(state.pageLayout.gridColumns || 12)}, minmax(0, 1fr))`;
      wrap.style.gap = Number(state.pageLayout.sectionGap || 18) + "px";
      wrap.style.maxWidth = Number(state.pageLayout.contentWidth || state.theme.containerWidth || 1200) + "px";

      state.blocks.forEach((block) => {
        if (block.visible === false) return;

        let html = "";
        if (block.type === "hero") {
          html = previewWrapper(block, `
            <h4>${escapeHtml(block.title)}</h4>
            <p>${escapeHtml(block.text)}</p>
            <div class="builder-preview-actions" style="justify-content:${block.align === "center" ? "center" : block.align === "right" ? "flex-end" : "flex-start"}">
              ${block.primaryText ? `<span style="background:${state.theme.primaryColor};border-color:${state.theme.primaryColor};color:#fff;">${escapeHtml(block.primaryText)}</span>` : ""}
              ${block.secondaryText ? `<span>${escapeHtml(block.secondaryText)}</span>` : ""}
            </div>
          `);
        } else if (block.type === "text") {
          html = previewWrapper(block, `
            ${block.title ? `<h4>${escapeHtml(block.title)}</h4>` : ""}
            <p>${escapeHtml(block.text)}</p>
          `);
        } else if (block.type === "button") {
          html = previewWrapper(block, `
            <div class="builder-preview-actions" style="justify-content:${block.align === "center" ? "center" : block.align === "right" ? "flex-end" : "flex-start"}">
              <span style="${block.style === "primary" ? `background:${state.theme.primaryColor};border-color:${state.theme.primaryColor};color:#fff;` : ""}">${escapeHtml(block.text)}</span>
            </div>
          `);
        } else if (block.type === "image") {
          html = previewWrapper(block, `
            ${block.src ? `<img src="${block.src}" alt="${escapeHtml(block.alt || "")}" style="max-width:${block.width || "100%"};border-radius:12px;">` : `<p>Görsel URL girilmedi.</p>`}
          `);
        } else if (block.type === "html") {
          html = previewWrapper(block, `<div>${block.html || ""}</div>`);
        } else if (block.type === "spacer") {
          html = `<div style="grid-column:span 12;height:${Number(block.height || 32)}px"></div>`;
        }

        wrap.insertAdjacentHTML("beforeend", html);
      });
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
