// Pure, dependency-free — deliberately has no imports (not even from
// escapeHtml.js/responsiveCss.js/variants.js) so it can be imported by
// cssPaneSync.js and by Node-run tests without dragging in exportHtml.js's
// jszip/file-saver imports, which are CommonJS packages that don't resolve
// under plain Node ESM (only under webpack's bundler, which the browser
// build uses). exportHtml.js re-exports stripInlineStyles from here so
// its existing public import path (`@/lib/exportHtml`) is unaffected.
//
// Phase 4a (Path B): when an element's root tag carries the
// data-wd-cat="<catId>" / data-wd-block="<blockId>" pair that
// variants.js::stampVariant stamps onto every library block at insert
// time, we emit SEMANTIC class names — block-<catId>-<slug> (slug = the
// block id with a category prefix stripped, see BLOCK_PREFIX_BY_CAT) —
// instead of the tag+counter fallback (.section-1, .h2-1, …). The
// semantic scheme is per-occurrence (block-<catId>-<slug>-<occ>, 1-based
// within the element) so cssPaneSync's per-occurrence write-back still
// maps each class to one style="..." occurrence, PLUS a shared
// unprefixed marker class (block-<catId>-<slug>) on every occurrence so
// an external override layer (Avalon GEMS) can target the whole block
// with one rule. Elements without the data-wd-* pair (user-authored /
// imported markup) fall back to today's .<tag>-<n> behavior,
// byte-identical. Mirrors backend/server.py::_strip_inline_styles —
// keep both in sync, including BLOCK_PREFIX_BY_CAT and readBlockMeta.
// See docs/PHASE_4_BLOCK_AUDIT.md §3 for the full scheme + per-block map.

// Per-category prefix to strip from a block id to get its slug. The
// semantic class name is block-<categoryId>-<slug>. Single source of
// truth — the backend mirror duplicates this table verbatim.
const BLOCK_PREFIX_BY_CAT = {
  components: "cmp-",
  timelines: "cmp-timeline-",
  navbars: "nav-",
  headers: "hdr-",
  footers: "ft-",
  video: "video-",
  heroes: "hero-",
  sections: "section-",
  containers: "container-",
  text: "text-",
  toolbox: "tb-",
  pricing: "pricing-",
  team: "team-",
  faq: "faq-",
  newsletter: "newsletter-",
  portfolio: "portfolio-",
  layout: "layout-",
  services: "services-",
  contact: "contact-",
  testimonials: "testimonial-",
  esports: "esports-",
  creator: "creator-",
  retro: "retro-",
  parallax: "parallax-",
  social: "social-",
  comments: "comments-",
  zenero: "",
};

// Reads the data-wd-cat / data-wd-block pair variants.js::stampVariant
// stamps onto a block's root tag. Returns {catId, blockId} or null.
// Inlined here (rather than imported from variants.js) to keep this
// module import-free and to mirror the backend's standalone copy.
const readBlockMeta = (html) => {
  if (!html) return null;
  const cat = html.match(/data-wd-cat="([^"]*)"/);
  const block = html.match(/data-wd-block="([^"]*)"/);
  return cat && block ? { catId: cat[1], blockId: block[1] } : null;
};

// block-<catId>-<slug>; slug = blockId with the category's prefix
// stripped (if the block id starts with it), else the full blockId.
// Unknown catIds still work — slug is just the full blockId.
const blockClassName = (catId, blockId) => {
  const p = BLOCK_PREFIX_BY_CAT[catId];
  const slug = p && blockId.startsWith(p) ? blockId.slice(p.length) : blockId;
  return `block-${catId}-${slug}`;
};

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

// Phase 6: <script>…</script> segments pass through `fn` untouched. Block
// payloads (form widgets, embedded players, analytics snippets) legitimately
// carry `style="…"`, `undefined` and `null` inside JS string literals —
// those are code, not markup, and rewriting them corrupts the widget.
// Mirrored in backend/server.py::_strip_inline_styles — keep both in sync.
const SCRIPT_SEG_RE = /<script\b[^>]*>[\s\S]*?<\/script\s*>/gi;
export const protectScriptPayloads = (html, fn) => {
  let out = "";
  let last = 0;
  for (const m of (html || "").matchAll(SCRIPT_SEG_RE)) {
    out += fn(html.slice(last, m.index)) + m[0];
    last = m.index + m[0].length;
  }
  return out + fn(html.slice(last));
};

export const stripInlineStyles = (elements, prefix = "") => {
  // Extract style attributes into deduplicated CSS classes, one class per
  // style="..." occurrence (mirrors backend/server.py's
  // _strip_inline_styles — keep both in sync, including BLOCK_PREFIX_BY_CAT
  // and readBlockMeta). Two paths:
  //  • Semantic path (Phase 4a): if the element's root tag carries the
  //    data-wd-cat/data-wd-block pair stamped by variants.js::stampVariant,
  //    every style occurrence in that element gets a class
  //    `${prefix}block-<catId>-<slug>-<occ>` (1-based occurrence within the
  //    element) plus a shared unprefixed marker `block-<catId>-<slug>`.
  //    The marker is the Avalon-GEMS override hook (one rule targets the
  //    whole block); the suffixed class is the cssPaneSync write-back key
  //    (one rule per occurrence, lossless round-trip). No marker rule is
  //    emitted — the override layer owns those.
  //  • Fallback path (no data-wd-* pair, e.g. user-authored/imported
  //    markup): classes named from the owning tag name plus a running
  //    counter scoped to the whole export (not per-element/per-parent):
  //    the first <section> anywhere becomes .section-1, the second
  //    .section-2, the first <h2> becomes .h2-1, etc., in document/
  //    encounter order. Byte-identical to pre-4a behavior.
  //
  // `prefix` (e.g. "about-") is for multi-page exports sharing one
  // stylesheet — each page's fallback classes would otherwise collide by
  // name (page A's ".nav-1" and page B's ".nav-1" are unrelated styles)
  // despite the counter being page-local either way; the semantic path
  // keeps the prefix on the suffixed class for the same reason (two pages'
  // navbars with different inline styles must stay distinct) while the
  // marker stays unprefixed so a cross-page GEMS override is one rule. A
  // rule that sets grid-template-columns also gets a companion responsive
  // override — RESPONSIVE_CSS's generic [style*="grid-template-columns"]
  // selector can't match here since the style attribute this function
  // removes is exactly what it targets.
  //
  // classMap (cls -> {elementId, occurrence}) is the inverse of that
  // assignment for the CURRENT elements array — cssPaneSync.js needs it
  // to map a semantic class back to "which element, which style="...""
  // occurrence within that element's own html". Only the suffixed
  // semantic classes and the fallback classes are keyed here; the
  // unprefixed marker is deliberately NOT keyed, so a hand-typed marker
  // rule in the CSS pane is skipped (recognized-but-unmapped) rather than
  // guessed at.
  //
  // componentRules and mediaRules are tracked separately (both tiers,
  // matching RESPONSIVE_CSS's tablet/mobile breakpoints) so callers that
  // route CSS into labeled globals.css sections (exportHtml.js's
  // buildMultiPageExport) can place each in the right one. `css` stays
  // the combined string — same shape as before this split — so existing
  // consumers (CodeView.jsx's live CSS pane, cssPaneSync.js's
  // reconciliation) are unaffected.
  const componentRules = [];
  const mediaRules = [];
  const tagCounters = {};
  const classMap = new Map();
  // Per-category CSS rules for the exporter's labeled "Blocks:" sections.
  // Keyed by the block's data-wd-cat id (library blocks) or "__generic__"
  // (user-authored/imported markup that fell back to tag+counter classes).
  const componentByCat = {};
  const bucketFor = (catId) => {
    if (!componentByCat[catId]) componentByCat[catId] = [];
    return componentByCat[catId];
  };
  const outParts = elements.map((el) => {
    const meta = readBlockMeta(el.html);
    const blockClass = meta ? blockClassName(meta.catId, meta.blockId) : null;
    let occurrence = 0;
    // Phase 6: script segments (form widgets, embedded players) carry
    // literal `style="…"` inside JS strings — code, not markup. They pass
    // through verbatim; only real markup gets substituted (see
    // protectScriptPayloads above / backend/server.py mirror).
    const html = protectScriptPayloads(el.html || "", (seg) =>
      seg.replace(/style="([^"]*)"/g, (_, styles, offset, string) => {
        const tag = tagNameAt(string, offset);
        if (blockClass) {
          // Semantic path: block-<catId>-<slug>-<occ> + shared unprefixed marker.
          occurrence += 1;
          const cls = `${prefix}${blockClass}-${occurrence}`;
          const marker = blockClass;
          componentRules.push(`.${cls} { ${styles} }`);
          bucketFor(meta.catId).push(`.${cls} { ${styles} }`);
          if (styles.includes("grid-template-columns")) {
            mediaRules.push(`@media (max-width: 1024px) { .${cls} { grid-template-columns: 1fr !important; } }`);
            mediaRules.push(`@media (max-width: 767px) { .${cls} { grid-template-columns: 1fr !important; } }`);
          }
          classMap.set(cls, { elementId: el.id, occurrence: occurrence - 1 });
          return `class="block ${cls} ${marker}"`;
        }
        // Fallback path: tag + running counter (byte-identical to pre-4a).
        tagCounters[tag] = (tagCounters[tag] || 0) + 1;
        const cls = `${prefix}${tag}-${tagCounters[tag]}`;
        componentRules.push(`.${cls} { ${styles} }`);
        bucketFor("__generic__").push(`.${cls} { ${styles} }`);
        if (styles.includes("grid-template-columns")) {
          mediaRules.push(`@media (max-width: 1024px) { .${cls} { grid-template-columns: 1fr !important; } }`);
          mediaRules.push(`@media (max-width: 767px) { .${cls} { grid-template-columns: 1fr !important; } }`);
        }
        classMap.set(cls, { elementId: el.id, occurrence: occurrence++ });
        return `class="${cls}"`;
      })
    );
    return html;
  });
  const componentCss = componentRules.join("\n");
  const mediaCss = mediaRules.join("\n");
  const componentCssByCat = {};
  Object.keys(componentByCat).forEach((k) => { componentCssByCat[k] = componentByCat[k].join("\n"); });
  return {
    html: outParts.join("\n"),
    css: [componentCss, mediaCss].filter(Boolean).join("\n"),
    componentCss,
    mediaCss,
    componentCssByCat,
    classMap,
  };
};
