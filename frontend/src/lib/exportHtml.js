import JSZip from "jszip";
import { saveAs } from "file-saver";
import { escAttr, escText, escRawScript } from "./escapeHtml.js";
import { RESPONSIVE_CSS } from "./responsiveCss.js";

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

const stripInlineStyles = (html) => {
  // Extract style attributes, replace with class, and build CSS rules.
  // A rule that sets grid-template-columns also gets a companion
  // responsive override — RESPONSIVE_CSS's generic
  // [style*="grid-template-columns"] selector can't match here since the
  // style attribute this function removes is exactly what it targets.
  const rules = [];
  let counter = 0;
  const transformed = html.replace(/style="([^"]*)"/g, (_, styles) => {
    const cls = `el-${counter++}`;
    rules.push(`.${cls} { ${styles} }`);
    if (styles.includes("grid-template-columns")) {
      rules.push(`@media (max-width: 768px) { .${cls} { grid-template-columns: 1fr !important; } }`);
    }
    return `class="${cls}"`;
  });
  return { html: transformed, css: rules.join("\n") };
};

export const buildStandaloneHtml = (project) => {
  const body = project.elements.map((e) => e.html).join("\n");
  const fonts = buildFontLinks(project.fonts);
  const seoMeta = buildSeoMeta(project.seo);
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
  const body = project.elements.map((e) => e.html).join("\n");
  const { html: cleaned, css } = stripInlineStyles(body);
  const fonts = buildFontLinks(project.fonts);
  const seoMeta = buildSeoMeta(project.seo);
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
${fonts}
${project.head_html || ""}
<link rel="stylesheet" href="styles.css" />
</head>
<body>
${cleaned}
${customJsTag}</body>
</html>`;
  const styles = `body{margin:0;background:${project.canvas_bg || "#ffffff"};}\n${css}`;
  return { html, css: styles };
};

export const downloadZip = async (project) => {
  const { html, css } = buildCleanExport(project);
  const zip = new JSZip();
  zip.file("index.html", html);
  zip.file("styles.css", css);
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
