// Pure, dependency-free — deliberately has no imports (not even from
// escapeHtml.js/responsiveCss.js) so it can be imported by cssPaneSync.js
// and by Node-run tests without dragging in exportHtml.js's jszip/
// file-saver imports, which are CommonJS packages that don't resolve
// under plain Node ESM (only under webpack's bundler, which the browser
// build uses). exportHtml.js re-exports stripInlineStyles from here so
// its existing public import path (`@/lib/exportHtml`) is unaffected.

// Given the full HTML string being scanned and the offset of a
// style="..." match within it, finds the tag name of the element that
// attribute belongs to by walking back to the nearest preceding
// (unclosed) "<". Attributes can appear on either side of style= in this
// codebase's block templates (e.g. `<img src="..." style="...">` or
// `<h2 data-aos="fade-up" style="...">`), so we can't assume a fixed
// position — but style values never contain a literal ">", so the last
// "<" before the match is always this tag's own opening bracket.
const tagNameAt = (str, offset) => {
  const ltIdx = str.lastIndexOf("<", offset);
  if (ltIdx === -1) return "el";
  const m = /^<([a-zA-Z][a-zA-Z0-9]*)/.exec(str.slice(ltIdx));
  return m ? m[1].toLowerCase() : "el";
};

export const stripInlineStyles = (elements, prefix = "") => {
  // Extract style attributes into deduplicated CSS classes, one class per
  // style="..." occurrence (mirrors backend/server.py's
  // _strip_inline_styles — keep both in sync). Classes are named
  // semantically from the owning tag name plus a running counter scoped
  // to the whole export (not per-element/per-parent): the first
  // <section> anywhere becomes .section-1, the second .section-2, the
  // first <h2> becomes .h2-1, etc., in document/encounter order. `prefix`
  // (e.g. "about-") is only for multi-page exports sharing one stylesheet
  // — each page's classes would otherwise collide by name (page A's
  // ".nav-1" and page B's ".nav-1" are unrelated styles) despite the
  // counter being page-local either way. A rule
  // that sets grid-template-columns also gets a companion responsive
  // override — RESPONSIVE_CSS's generic [style*="grid-template-columns"]
  // selector can't match here since the style attribute this function
  // removes is exactly what it targets.
  //
  // classMap (cls -> {elementId, occurrence}) is the inverse of that
  // assignment for the CURRENT elements array — cssPaneSync.js needs it
  // to map a semantic class back to "which element, which style="..."
  // occurrence within that element's own html" since the class name no
  // longer encodes the element id the way the old .el-<id> scheme did.
  const rules = [];
  const tagCounters = {};
  const classMap = new Map();
  const outParts = elements.map((el) => {
    let occurrence = 0;
    const html = (el.html || "").replace(/style="([^"]*)"/g, (_, styles, offset, string) => {
      const tag = tagNameAt(string, offset);
      tagCounters[tag] = (tagCounters[tag] || 0) + 1;
      const cls = `${prefix}${tag}-${tagCounters[tag]}`;
      rules.push(`.${cls} { ${styles} }`);
      if (styles.includes("grid-template-columns")) {
        rules.push(`@media (max-width: 768px) { .${cls} { grid-template-columns: 1fr !important; } }`);
      }
      classMap.set(cls, { elementId: el.id, occurrence: occurrence++ });
      return `class="${cls}"`;
    });
    return html;
  });
  return { html: outParts.join("\n"), css: rules.join("\n"), classMap };
};
