import JSZip from "jszip";
import { saveAs } from "file-saver";
import { escAttr, escText, escRawScript } from "./escapeHtml.js";
import { RESPONSIVE_CSS } from "./responsiveCss.js";
import { stripInlineStyles } from "./stripInlineStyles.js";

export { stripInlineStyles };

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
  const out = [`<meta property="og:type" content="website">`];
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

// Minimal WebSite JSON-LD — enough for search engines to associate the
// page with its name/description without inventing a full schema editor.
const buildJsonLd = (project) => {
  const seo = project.seo || {};
  const data = { "@context": "https://schema.org", "@type": "WebSite", name: seo.title || project.name || "Untitled" };
  if (seo.description) data.description = seo.description;
  if (seo.canonical) data.url = seo.canonical;
  return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
};

export const buildStandaloneHtml = (project) => {
  const body = injectLazyLoading(project.elements.map((e) => e.html).join("\n"));
  const fonts = buildFontLinks(project.fonts);
  const seoMeta = buildSeoMeta(project.seo);
  const jsonLd = buildJsonLd(project);
  const customJsTag = (project.custom_js || "").trim() ? `<script>${escRawScript(project.custom_js)}</script>\n` : "";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escText(pageTitle(project))}</title>
<script>window.__WD_PROJECT_ID=${JSON.stringify(project.id || "")};</script>
${RESPONSIVE_CSS}
${seoMeta}
${jsonLd}
${fonts}
${project.head_html || ""}
<style>body{margin:0;background:${project.canvas_bg || "#ffffff"};}</style>
</head>
<body>
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
  const { html: cleanedRaw, css } = stripInlineStyles(project.elements);
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
<script>window.__WD_PROJECT_ID=${JSON.stringify(project.id || "")};</script>
${RESPONSIVE_CSS}
${seoMeta}
${jsonLd}
${fonts}
${project.head_html || ""}
<link rel="stylesheet" href="globals.css" />
</head>
<body>
${cleaned}
${customJsTag}</body>
</html>`;
  const styles = `body{margin:0;background:${project.canvas_bg || "#ffffff"};}\n${css}`;
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
  const cssParts = [];

  pages.forEach((page, i) => {
    const filename = safePageFilename(page.slug, i, used);
    const prefix = `${filename.slice(0, -5)}-`; // strip ".html"
    const { html: cleanedRaw, css } = stripInlineStyles(page.elements || [], prefix);
    const cleaned = injectLazyLoading([header, cleanedRaw, footer].filter(Boolean).join("\n"));
    const seo = page.seo || {};
    const title = seo.title || page.name || project.name || "Untitled";
    const fonts = buildFontLinks((page.fonts && page.fonts.length) ? page.fonts : project.fonts);
    const customJs = page.custom_js || "";
    const customJsTag = customJs.trim() ? `<script>${escRawScript(customJs)}</script>\n` : "";
    files[filename] = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escText(title)}</title>
<script>window.__WD_PROJECT_ID=${JSON.stringify(project.id || "")};</script>
${RESPONSIVE_CSS}
${buildSeoMeta(seo)}
${buildJsonLd({ seo, name: page.name || project.name })}
${fonts}
${page.head_html || ""}
<link rel="stylesheet" href="globals.css" />
<style>body{margin:0;background:${page.canvas_bg || "#ffffff"};}</style>
</head>
<body>
${cleaned}
${customJsTag}</body>
</html>`;
    cssParts.push(css);
  });

  files["globals.css"] = cssParts.join("\n");
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
