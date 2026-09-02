import JSZip from "jszip";
import { saveAs } from "file-saver";
import { escAttr, escText, escRawScript } from "./escapeHtml.js";
import { RESPONSIVE_CSS_BODY } from "./responsiveCss.js";
import { stripInlineStyles, protectScriptPayloads } from "./stripInlineStyles.js";
import { CATEGORIES } from "./blocks.js";
import { BLOCK_STYLES_BY_CATEGORY, BLOCK_STYLES_MEDIA_CSS, BLOCK_STYLES_CSS } from "./blockStyles.generated.js";
import { OXYGENE_CSS } from "./oxygeneStyles.js";
import { AVALON_GEMS_CSS } from "./avalonGemsStyles.js";

export { stripInlineStyles };

// Pulls the data-forge-* <style> blocks Web Dojo injects into a page's
// head_html (site theme, per-element color picks, per-element tablet/
// mobile overrides, per-element animation keyframes — see ThemeGenerator,
// rootVars.js, responsiveOverrides.js, and Builder.jsx's applyAnimation)
// out of head_html and buckets them by which globals.css section they
// belong in, so the multi-page export can assemble one clearly organized
// stylesheet instead of leaving each page's generated CSS scattered
// across per-page <head> tags. Whatever's left of head_html (CDN embeds,
// analytics snippets, user-authored <style>/<link> tags — anything not
// forge-managed) stays in `remainingHead` and is still injected per-page,
// since none of that is meant to be shared/deduplicated across pages.
const THEME_RE = /<style data-forge-theme(?:="[^"]*")?>([\s\S]*?)<\/style>\n?/g;
const VARS_RE = /<style data-forge-vars>([\s\S]*?)<\/style>\n?/g;
const RESPONSIVE_OVERRIDES_RE = /<style data-forge-responsive-overrides>([\s\S]*?)<\/style>\n?/g;
const ANIM_RE = /<style data-forge-anim="[^"]*">([\s\S]*?)<\/style>\n?/g;
// An uploaded font is carried as <style data-forge-fonts> containing one or
// more @font-face rules plus a :root block of --font-<slug> variables (see
// lib/fonts.js). Like the theme block, the :root is routed into theme vars
// and the @font-face (all non-:root rules) into Base, so both land in
// globals.css where they belong.
const FORGE_FONTS_RE = /<style data-forge-fonts>([\s\S]*?)<\/style>\n?/g;
// importHtml.js's scanHtml wraps every <style> rule an imported page
// carried (its own + whatever /import/url fetched from its <link
// rel="stylesheet"> tags) in this marker, so an import's real styling
// lands in globals.css's Components section — the same bucket
// stripInlineStyles' own per-block CSS goes into — instead of being
// stranded, unshared, in that one page's <head>.
const IMPORTED_CSS_RE = /<style data-forge-imported-css>([\s\S]*?)<\/style>\n?/g;
const ROOT_BLOCK_RE = /:root\s*{[^}]*}/;

export const extractForgeCss = (headHtml) => {
  let remaining = headHtml || "";
  const themeVars = [];
  const base = [];
  const mediaQueries = [];
  const animations = [];
  const importedCss = [];

  remaining = remaining.replace(THEME_RE, (_, body) => {
    const rootMatch = body.match(ROOT_BLOCK_RE);
    if (rootMatch) themeVars.push(rootMatch[0]);
    const rest = body.replace(ROOT_BLOCK_RE, "").trim();
    if (rest) base.push(rest);
    return "";
  });
  remaining = remaining.replace(VARS_RE, (_, body) => {
    if (body.trim()) themeVars.push(body.trim());
    return "";
  });
  remaining = remaining.replace(FORGE_FONTS_RE, (_, body) => {
    const rootMatch = body.match(ROOT_BLOCK_RE);
    if (rootMatch) themeVars.push(rootMatch[0]);
    const rest = body.replace(ROOT_BLOCK_RE, "").trim();
    if (rest) base.push(rest);
    return "";
  });
  remaining = remaining.replace(RESPONSIVE_OVERRIDES_RE, (_, body) => {
    if (body.trim()) mediaQueries.push(body.trim());
    return "";
  });
  remaining = remaining.replace(ANIM_RE, (_, body) => {
    if (body.trim()) animations.push(body.trim());
    return "";
  });
  remaining = remaining.replace(IMPORTED_CSS_RE, (_, body) => {
    if (body.trim()) importedCss.push(body.trim());
    return "";
  });

  return { remainingHead: remaining.trim(), themeVars, base, mediaQueries, animations, importedCss };
};

// Merges however many `:root { --x: 1; }` block strings into one deduped
// block (later blocks' declarations win on name collision) — multiple
// pages sharing the same cascaded theme would otherwise repeat an
// identical :root block once per page.
const DECL_RE = /(--[\w-]+)\s*:\s*([^;]+);/g;
const mergeRootBlocks = (blocks) => {
  const decls = new Map();
  blocks.forEach((block) => {
    let m;
    DECL_RE.lastIndex = 0;
    while ((m = DECL_RE.exec(block))) decls.set(m[1], m[2].trim());
  });
  if (!decls.size) return "";
  return `:root {\n${[...decls].map(([k, v]) => `  ${k}: ${v};`).join("\n")}\n}`;
};

const dedupe = (arr) => [...new Set(arr.filter(Boolean))];

// Phase 4b Task 2: deduplicate repeated <link>/<meta> tags (e.g. the same
// Google Fonts preconnect/stylesheet link added once per page) by their
// exact serialized form, keeping first occurrence. Scripts/styles and any
// other head content are left untouched. Works on a single head string.
const HEAD_SELFCLOSE_RE = /<(link|meta)[^>]*>/gi;
export const deduplicateHeadTags = (headHtml) => {
  const seen = new Set();
  return (headHtml || "").replace(HEAD_SELFCLOSE_RE, (tag) => {
    const canonical = tag.trim();
    if (seen.has(canonical)) return "";
    seen.add(canonical);
    return tag;
  });
};

// Phase 4b Task 3: strip any leftover template placeholders / raw `undefined`
// / `null` tokens that would otherwise leak into the exported <head> (broken
// meta tags, "${{...}}" placeholders, `content="undefined"`). Applies to head
// markup only — body text and scripts are deliberately untouched.
export const sanitizeHeadVars = (headHtml) => {
  // Phase 6: <script> payloads (analytics embeds, JSON-LD, head widgets)
  // legitimately contain `undefined`/`null`/empty-string assignments —
  // code, not head-template leftovers. Script segments pass through
  // verbatim, honoring this function's "scripts are untouched" contract
  // (protectScriptPayloads lives in stripInlineStyles.js, mirrored in
  // backend/server.py).
  return protectScriptPayloads(headHtml || "", (seg) =>
    seg
      // Bare template placeholders someone left unresolved: ${...} or ${{...}}
      .replace(/\$\{\{(?:[^{}]|\{[^{}]*\})*\}\}/g, "")
      .replace(/\$\{[^{}]*\}/g, "")
      // Literal `undefined` / `null` tokens (as whole words) — e.g. inside
      // meta/link attribute values or bare text: content="undefined", >null<
      .replace(/\bundefined\b/gi, "")
      .replace(/\bnull\b/gi, "")
      // Collapse any "=  " left after the above, and drop empty quotes.
      .replace(/=\s*(""|'')/g, '=""')
      // Phase 5 (Issue #7): a <style> tag emptied by the cleanups above is
      // dead weight in the head — drop the whole tag, not just its contents.
      .replace(/<style(?:\s[^>]*)?>\s*<\/style>\n?/gi, ""));
};

// Pulls <script data-forge-js="name.js">...</script> blocks out of a page's
// head_html or element markup (e.g. a comment widget's behavior script) and
// replaces each with <script src="js/name.js"></script>, so the multi-page
// export writes one real file per name instead of repeating the same script
// inline on every page/element that uses it. First occurrence of a given
// filename wins — a shared widget script is expected to be byte-identical
// everywhere it's used, same assumption buildOrganizedStylesheet makes for
// deduped CSS. Existing blocks with plain inline `<script>` (no
// data-forge-js marker) are untouched — this is opt-in, not a retrofit.
const JS_FILE_RE = /<script data-forge-js="([^"]+)">([\s\S]*?)<\/script>\n?/g;
const extractForgeJs = (html) => {
  const files = {};
  const remaining = (html || "").replace(JS_FILE_RE, (_, filename, code) => {
    if (!(filename in files)) files[filename] = code.trim();
    return `<script src="js/${filename}"></script>`;
  });
  return { remaining, files };
};

// Renders the Components region of globals.css. `categoryBuckets` are the
// per-category (data-wd-cat) block rules, each rendered as its own labeled
// "Blocks: <Category Label>" section in CATEGORIES order; `genericCss` is
// user-authored/imported CSS (and any unbucketed fallback-class rules), which
// always lands in a trailing plain "Components" section — preserving the
// pre-4a "Components" anchor that tests and callers rely on.
const buildComponentSections = (categoryBuckets, genericCss) => {
  const out = [];
  if (categoryBuckets && categoryBuckets.length) {
    out.push(...categoryBuckets.map(({ label, css }) => [`Blocks: ${label}`, css]));
  }
  out.push(["Components", genericCss || ""]);
  return out;
};

const buildOrganizedStylesheet = ({ themeVars, base, componentBuckets, genericComponentCss, animations, mediaQueries }) => {
  const sections = [
    ["Theme Variables", mergeRootBlocks(themeVars)],
    ["Base", dedupe(base).join("\n")],
    // Phase 4b Task 3 / Oxygene / Avalon Gems: same static, project-independent
    // stylesheets buildStandaloneHtml/buildCleanExport splice in — this
    // multi-page assembly has its own per-category BLOCK_STYLES_BY_CATEGORY
    // buckets below (buildComponentSections) but never included these flat
    // constants, so blocks using them (Oxygene) rendered unstyled in the
    // zip export even though the Design canvas and single-page export
    // (buildStandaloneHtml, buildCleanExport) already had them.
    ["Block Styles", BLOCK_STYLES_CSS],
    ["Oxygene", OXYGENE_CSS],
    ["Avalon Gems", AVALON_GEMS_CSS],
    ...buildComponentSections(componentBuckets, genericComponentCss),
    ["Animations", dedupe(animations).join("\n\n")],
    ["Media Queries", [RESPONSIVE_CSS_BODY, BLOCK_STYLES_MEDIA_CSS, ...dedupe(mediaQueries)].join("\n")],
    // A11y: users with a reduced-motion OS preference get a static site.
    ["Reduced Motion", "@media (prefers-reduced-motion: reduce) {\n  *, *::before, *::after {\n    animation-duration: 0.01ms !important;\n    animation-iteration-count: 1 !important;\n    transition-duration: 0.01ms !important;\n  }\n}"],
  ];
  return sections
    .map(([label, body]) => `/* ===== ${label} ===== */\n${body || "/* none */"}`)
    .join("\n\n");
};

const buildFontLinks = (fonts) => {
  if (!fonts || fonts.length === 0) return "";
  const families = fonts
    .map((f) => f.replace(/\s+/g, "+"))
    .join("&family=");
  return `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=${escAttr(families)}&display=swap" rel="stylesheet">`;
};

const buildSeoMeta = (seo) => {
  const s = seo || {};
  const out = [`<meta property="og:type" content="${escAttr(s.og_type || "website")}">`];
  if (s.description) out.push(`<meta name="description" content="${escAttr(s.description)}">`);
  if (s.keywords) out.push(`<meta name="keywords" content="${escAttr(s.keywords)}">`);
  if (s.canonical) out.push(`<link rel="canonical" href="${escAttr(s.canonical)}">`);
  if (s.favicon) out.push(`<link rel="icon" href="${escAttr(s.favicon)}">`);
  const ogTitle = s.og_title || s.title;
  const ogDesc = s.og_description || s.description;
  if (ogTitle) out.push(`<meta property="og:title" content="${escAttr(ogTitle)}">`);
  if (ogDesc) out.push(`<meta property="og:description" content="${escAttr(ogDesc)}">`);
  if (s.og_image) out.push(`<meta property="og:image" content="${escAttr(s.og_image)}">`);
  const card = s.twitter_card || (s.og_image ? "summary_large_image" : "summary");
  out.push(`<meta name="twitter:card" content="${escAttr(card)}">`);
  if (ogTitle) out.push(`<meta name="twitter:title" content="${escAttr(ogTitle)}">`);
  if (ogDesc) out.push(`<meta name="twitter:description" content="${escAttr(ogDesc)}">`);
  if (s.og_image) out.push(`<meta name="twitter:image" content="${escAttr(s.og_image)}">`);
  return out.join("\n");
};

const pageTitle = (project) => (project.seo && project.seo.title) || project.name || "Untitled";

// Skips the first <img> (likely the hero/LCP image — eager-loading that
// one is the actual best practice) and lazy-loads the rest.
const injectLazyLoading = (html) => {
  let first = true;
  return html.replace(/<img(?![^>]*\bloading=)([^>]*)>/gi, (match, attrs) => {
    if (first) { first = false; return match; }
    return `<img${attrs} loading="lazy">`;
  });
};

// Minimal JSON-LD — enough for search engines to associate the page with
// its name/description without inventing a full schema editor. Defaults
// to WebSite; a template (see seoTemplates.js) or manual edit can set
// seo.schema_type to Organization/Product/Article/LocalBusiness etc.
const buildJsonLd = (project) => {
  const seo = project.seo || {};
  const data = { "@context": "https://schema.org", "@type": seo.schema_type || "WebSite", name: seo.title || project.name || "Untitled" };
  if (seo.description) data.description = seo.description;
  if (seo.canonical) data.url = seo.canonical;
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
};

export const buildStandaloneHtml = (project) => {
  // Standalone export must NOT carry any inline style="…" on blocks. The
  // inline styles are hoisted into the labelled per-block CSS class rules
  // (block-<cat>-<slug>-<occ> + .block marker) and a corresponding <style>
  // block in the head, so responsive media queries / the design system can
  // actually override them — mirroring what buildCleanExport /
  // buildMultiPageExport / server.py do for the .zip + publish paths.
  //
  // Phase 5 (Issues #2/#7): the head is boilerplate only. The Theme
  // editor's <style data-forge-*> blocks (theme vars, per-element picks,
  // fonts, animations, responsive overrides, imported CSS) are routed OUT
  // of head_html (extractForgeCss) into this one consolidated <style> —
  // the single-file equivalent of the multi-page export's globals.css
  // sections — so the head carries no <style data-forge-vars> blobs and
  // the cascade order matches the site export exactly (Theme → Base →
  // Blocks → Imported → Animations → Media Queries).
  const { html: stripped, css } = stripInlineStyles(project.elements);
  const forge = extractForgeCss(project.head_html || "");
  const ownCss = [
    `:root { --wd-canvas-bg: ${project.canvas_bg || "#ffffff"}; }`,
    `body { margin: 0; background: var(--wd-canvas-bg); }`,
    ...forge.themeVars,
    ...forge.base,
    // Phase 4b Task 3: static per-block CSS for the 105 author-time-classed
    // blocks (blockStyles.generated.js) — placed before `css` so anything
    // stripInlineStyles still extracts (the 7 unconverted blocks, or a block
    // re-styled live after insertion) cascades on top rather than getting
    // shadowed by the base rule.
    BLOCK_STYLES_CSS,
    OXYGENE_CSS,
    AVALON_GEMS_CSS,
    css, // block-<cat>-<slug>-<occ> + .block rules lifted out of inline styles
    ...forge.importedCss,
    ...forge.animations,
    RESPONSIVE_CSS_BODY,
    ...forge.mediaQueries,
  ].filter(Boolean).join("\n");
  const body = injectLazyLoading(stripped);
  const fonts = buildFontLinks(project.fonts);
  const seoMeta = buildSeoMeta(project.seo);
  const jsonLd = buildJsonLd(project);
  const customJsTag = (project.custom_js || "").trim() ? `<script>${escRawScript(project.custom_js)}</script>\n` : "";
  // Phase 4b Tasks 2–3: clean the CDN/user head content of leftover
  // placeholders/`undefined`/`null` tokens, then drop duplicate <link>/<meta>
  // tags (same Google Fonts preconnect/stylesheet added once per page).
  const cleanedHead = deduplicateHeadTags(sanitizeHeadVars(`${fonts}\n${forge.remainingHead}`));
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escText(pageTitle(project))}</title>
${seoMeta}
${jsonLd}
${cleanedHead}
<style>${ownCss}</style>
</head>
<body data-wd-project="${escAttr(project.id || "")}">
<script>window.__WD_PROJECT_ID=window.__WD_PROJECT_ID||document.body.getAttribute("data-wd-project")||"";</script>
${body}
${customJsTag}</body>
</html>`;
};

// Flatten a stored template (with pages[]) into a project-shape that
// buildStandaloneHtml can consume — used by the Starter Preview modal.
// Note: starter templates never contain <script> tags, so the preview
// iframe intentionally uses `sandbox="allow-same-origin"` without
// `allow-scripts`. If future starters add script-driven animations,
// update TemplatePreviewModal's sandbox attribute accordingly.
export const buildTemplatePreviewHtml = (tpl) => {
  const data = tpl?.data || {};
  const page = (data.pages && data.pages[0]) || { elements: [], canvas_bg: "#ffffff", fonts: [] };
  const elements = page.elements || [];
  const canvas_bg = page.canvas_bg || data.canvas_bg || "#ffffff";
  const fonts = page.fonts || data.fonts || [];
  const head_html = (data.head_html || "") + (page.head_html || "");
  return buildStandaloneHtml({
    name: tpl.name,
    elements,
    canvas_bg,
    fonts,
    head_html,
  });
};

export const downloadStandalone = (project) => {
  const html = buildStandaloneHtml(project);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  saveAs(blob, `${(project.name || "site").replace(/\s+/g, "-").toLowerCase()}.html`);
};

export const buildCleanExport = (project) => {
  // Phase 5 (Issues #2/#7): the Theme editor's <style data-forge-*> blocks
  // are routed out of head_html into globals.css (the `css` return), and
  // the head's __WD_PROJECT_ID bootstrap script is gone (the id rides on
  // <body data-wd-project>) — the head must be boilerplate only.
  const { html: cleanedRaw, css } = stripInlineStyles(project.elements);
  const forge = extractForgeCss(project.head_html || "");
  const cleaned = injectLazyLoading(cleanedRaw);
  const fonts = buildFontLinks(project.fonts);
  const seoMeta = buildSeoMeta(project.seo);
  const jsonLd = buildJsonLd(project);
  const customJsTag = (project.custom_js || "").trim() ? `<script>${escRawScript(project.custom_js)}</script>\n` : "";
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escText(pageTitle(project))}</title>
${seoMeta}
${jsonLd}
${deduplicateHeadTags(sanitizeHeadVars(`${fonts}\n${forge.remainingHead}`))}
<link rel="stylesheet" href="globals.css" />
</head>
<body data-wd-project="${escAttr(project.id || "")}">
<script>window.__WD_PROJECT_ID=window.__WD_PROJECT_ID||document.body.getAttribute("data-wd-project")||"";</script>
${cleaned}
${customJsTag}</body>
</html>`;
  // globals.css sections in cascade order: canvas var → theme vars → base
  // → per-block component rules → imported CSS → animations → responsive
  // baseline + media queries (same ordering buildOrganizedStylesheet uses
  // for the multi-page export).
  const styles = [
    `:root { --wd-canvas-bg: ${project.canvas_bg || "#ffffff"}; }`,
    `body { margin: 0; background: var(--wd-canvas-bg); }`,
    ...forge.themeVars,
    ...forge.base,
    // Phase 4b Task 3: see buildStandaloneHtml's comment above BLOCK_STYLES_CSS.
    BLOCK_STYLES_CSS,
    OXYGENE_CSS,
    AVALON_GEMS_CSS,
    css,
    ...forge.importedCss,
    ...forge.animations,
    RESPONSIVE_CSS_BODY,
    ...forge.mediaQueries,
  ].filter(Boolean).join("\n");
  return { html, css: styles };
};

// Sanitizes a page slug into a safe filename and de-dupes against
// siblings — slugs are auto-generated once at page-creation time and
// never user-edited directly, but this is about to become a real
// filename on someone's FTP server or inside a zip, so it gets
// re-validated here regardless of how trustworthy the source looks.
const safePageFilename = (slug, index, used) => {
  let base = String(slug || "").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
  if (!base) base = index === 0 ? "index" : `page-${index + 1}`;
  let name = `${base}.html`;
  let n = 2;
  while (used.has(name)) { name = `${base}-${n}.html`; n++; }
  used.add(name);
  return name;
};

// Multi-page clean export: one classed .html file per page, sharing a
// single globals.css. Classes are prefixed per-page (see
// stripInlineStyles's `prefix` param) so e.g. page A's first <nav> and
// page B's first <nav> don't collide under the same .nav-1 rule despite
// each page's tag counter starting fresh. Falls back to a single
// synthetic "index" page built from the legacy top-level project fields
// for projects saved before the multi-page model existed (project.pages
// empty/missing) — same shape buildCleanExport already assumed.
export const buildMultiPageExport = (project) => {
  const pages = (project.pages && project.pages.length) ? project.pages : [{
    id: project.id, name: project.name, slug: "index", seo: project.seo,
    elements: project.elements, head_html: project.head_html, canvas_bg: project.canvas_bg,
    fonts: project.fonts, custom_js: project.custom_js,
  }];
  const template = project.template || {};
  const useTpl = !!template.use_template;
  const header = useTpl ? (template.header_html || "") : "";
  const footer = useTpl ? (template.footer_html || "") : "";

  const files = {};
  const used = new Set();
  const allComponentByCat = new Map(); // catId -> array of per-rule CSS strings
  const genericCssParts = [];          // imported styles + any unbucketed fallback
  const allThemeVars = [];
  // Phase 5 (Issue #7): the canvas background is a CSS variable, not a
  // per-page <style> tag — each page's <body data-wd-page> carries its own
  // --wd-canvas-bg override and this shared rule paints every page's
  // background from it (routed into globals.css's Base section).
  const allBase = ["body { margin: 0; background: var(--wd-canvas-bg, #ffffff); }"];
  const allAnimations = [];
  const allMediaQueries = [];
  const allJsFiles = {};

  pages.forEach((page, i) => {
    const baseName = safePageFilename(page.slug, i, used);
    // Phase 5 (Issue #3): pages carry a type ("page" | "layout") — emitted
    // as data-wd-page-type on the body. Folders like /layouts/ are deferred
    // until the FTP/SFTP publish uploaders can create nested remote dirs.
    const pageType = page.type === "layout" ? "layout" : "page";
    const filename = baseName;
    const prefix = `${baseName.slice(0, -5)}-`; // strip ".html"
    // Per-page canvas background: a [data-wd-page] var override in Base.
    allBase.push(`[data-wd-page="${baseName.slice(0, -5)}"] { --wd-canvas-bg: ${page.canvas_bg || "#ffffff"}; }`);
    const elementsWithJsExtracted = (page.elements || []).map((el) => {
      const { remaining, files: jsFiles } = extractForgeJs(el.html);
      Object.entries(jsFiles).forEach(([name, code]) => { if (!(name in allJsFiles)) allJsFiles[name] = code; });
      return { ...el, html: remaining };
    });
    const { html: cleanedRaw, componentCssByCat, mediaCss } = stripInlineStyles(elementsWithJsExtracted, prefix);
    // Bucket each page's per-category component CSS for the labeled "Blocks:"
    // globals.css sections (data-wd-cat library blocks), keeping imported
    // styles to flatten into the generic tail bucket. Indices collide across
    // pages only via the page prefix, which stripInlineStyles already applied
    // to the suffixed classes — the bucket just holds the produced strings.
    Object.entries(componentCssByCat).forEach(([catId, css]) => {
      if (!catId || !css) return;
      if (catId === "__generic__") { genericCssParts.push(css); return; }
      if (!allComponentByCat.has(catId)) allComponentByCat.set(catId, []);
      allComponentByCat.get(catId).push(css);
    });
    const cleaned = injectLazyLoading([header, cleanedRaw, footer].filter(Boolean).join("\n"));
    const seo = page.seo || {};
    const title = seo.title || page.name || project.name || "Untitled";
    const fonts = buildFontLinks((page.fonts && page.fonts.length) ? page.fonts : project.fonts);
    const customJs = page.custom_js || "";
    const customJsTag = customJs.trim() ? `<script>${escRawScript(customJs)}</script>\n` : "";
    const { remainingHead: headBeforeJs, themeVars, base, mediaQueries, animations, importedCss } = extractForgeCss(page.head_html);
    // Fold this page's imported styles into the generic tail bucket (they are
    // user-authored/imported, not library-block rules, so they don't get a
    // "Blocks:" category section).
    genericCssParts.push(...importedCss);
    const { remaining: remainingHead, files: headJsFiles } = extractForgeJs(headBeforeJs);
    Object.entries(headJsFiles).forEach(([name, code]) => { if (!(name in allJsFiles)) allJsFiles[name] = code; });
    // Phase 5 (Issues #3/#7): head is boilerplate only — the project-id
    // bootstrap and the per-page canvas <style> moved out of <head> (the
    // id rides on <body data-wd-project>, the background on the
    // [data-wd-page] variable + the shared body rule in globals.css).
    files[filename] = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escText(title)}</title>
${buildSeoMeta(seo)}
${buildJsonLd({ seo, name: page.name || project.name })}
${deduplicateHeadTags(sanitizeHeadVars(`${fonts}\n${remainingHead}`))}
<link rel="stylesheet" href="globals.css" />
</head>
<body data-wd-project="${escAttr(project.id || "")}" data-wd-page="${escAttr(baseName.slice(0, -5))}" data-wd-page-type="${pageType}">
<script>window.__WD_PROJECT_ID=window.__WD_PROJECT_ID||document.body.getAttribute("data-wd-project")||"";</script>
${cleaned}
${customJsTag}</body>
</html>`;
    allThemeVars.push(...themeVars);
    allBase.push(...base);
    allAnimations.push(...animations);
    allMediaQueries.push(...mediaCss.split("\n").filter(Boolean), ...mediaQueries);
  });

  // Assemble labeled "Blocks: <Category>" sections in CATEGORIES order, then
  // a trailing plain "Components" section for everything unbucketed (the
  // generic __generic__ fallback classes and imported styles), so the
  // generated globals.css reads as one clear, well-organized taxonomy.
  const componentBuckets = [];
  CATEGORIES.forEach((c) => {
    const chunks = allComponentByCat.get(c.id);
    // Phase 4b Task 3: static generated CSS is the base for this category's
    // author-time-classed blocks; any export-time extraction (the 7 blocks
    // still using inline styles, or a block re-styled live after insertion)
    // is appended after it so it cascades on top instead of being shadowed.
    const generated = BLOCK_STYLES_BY_CATEGORY[c.id] || "";
    const extracted = (chunks && chunks.length) ? chunks.filter(Boolean).join("\n") : "";
    const css = [generated, extracted].filter(Boolean).join("\n");
    if (css) componentBuckets.push({ label: c.label, css });
  });
  const genericCss = genericCssParts.filter(Boolean).join("\n");

  files["globals.css"] = buildOrganizedStylesheet({
    themeVars: allThemeVars,
    base: allBase,
    componentBuckets,
    genericComponentCss: genericCss,
    animations: allAnimations,
    mediaQueries: allMediaQueries,
  });
  Object.entries(allJsFiles).forEach(([name, code]) => { files[`js/${name}`] = code; });
  // Site folder scaffolding: every exported site carries js/, imgs/ and
  // fonts/ directories at its root (globals.css stays at the root too —
  // there is deliberately no css/ folder). The .keep placeholders keep
  // the (otherwise empty) folders alive in zip exports.
  files["imgs/.keep"] = "";
  files["fonts/.keep"] = "";
  return { files };
};

export const downloadZip = async (project) => {
  const { files } = buildMultiPageExport(project);
  const zip = new JSZip();
  Object.entries(files).forEach(([name, content]) => zip.file(name, content));
  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, `${(project.name || "site").replace(/\s+/g, "-").toLowerCase()}.zip`);
};

export const downloadProjectJson = (project) => {
  const data = {
    _webdojo: true, version: 1, name: project.name,
    fonts: project.fonts, files: project.files,
    pages: project.pages, active_page_id: project.active_page_id,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
  saveAs(blob, `${(project.name || "project").replace(/\s+/g, "-").toLowerCase()}.webdojo.json`);
};
