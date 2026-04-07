window.VeraPageBuilder = (() => {
          style="
            background:${block.background || "#ffffff"};
            color:${block.color || "#0f172a"};
            padding:${Number(block.padding || 24)}px;
            border-radius:${Number(block.radius || 18)}px;
            text-align:${block.align || "left"};
            max-width:${Number(block.maxWidth || 100)}%;
            margin:${block.align === "center" ? "0 auto" : block.align === "right" ? "0 0 0 auto" : "0"};
            border-color:${state.theme.borderColor || "#cbd5e1"};
          "
        >
          ${innerHtml}
        </div>
      `;
    }

    function renderPreview() {
      const wrap = state.targetPreviewWrap;
      if (!wrap) return;

      wrap.innerHTML = "";
      wrap.style.background = state.theme.bodyBg || "#f8fafc";
      wrap.style.color = state.theme.bodyText || "#0f172a";
      wrap.style.padding = "8px";
      wrap.style.borderRadius = "12px";

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
          html = `<div style="height:${Number(block.height || 32)}px"></div>`;
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
      render
    };
  }

  return { createBuilder };
})();
