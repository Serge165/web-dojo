import JSZip from "jszip";
import { saveAs } from "file-saver";

const buildFontLinks = (fonts) => {
  if (!fonts || fonts.length === 0) return "";
  const families = fonts
    .map((f) => f.replace(/\s+/g, "+"))
    .join("&family=");
  return `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=${families}&display=swap" rel="stylesheet">`;
};

const stripInlineStyles = (html) => {
  // Extract style attributes, replace with class, and build CSS rules.
  const rules = [];
  let counter = 0;
  const transformed = html.replace(/style="([^"]*)"/g, (_, styles) => {
    const cls = `el-${counter++}`;
    rules.push(`.${cls} { ${styles} }`);
    return `class="${cls}"`;
  });
  return { html: transformed, css: rules.join("\n") };
};

export const buildStandaloneHtml = (project) => {
  const body = project.elements.map((e) => e.html).join("\n");
  const fonts = buildFontLinks(project.fonts);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${project.name || "Untitled"}</title>
${fonts}
${project.head_html || ""}
<style>body{margin:0;background:${project.canvas_bg || "#ffffff"};}</style>
</head>
<body>
${body}
</body>
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

export const downloadZip = async (project) => {
  const body = project.elements.map((e) => e.html).join("\n");
  const { html: cleaned, css } = stripInlineStyles(body);
  const fonts = buildFontLinks(project.fonts);
  const indexHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${project.name || "Untitled"}</title>
${fonts}
${project.head_html || ""}
<link rel="stylesheet" href="styles.css" />
</head>
<body>
${cleaned}
</body>
</html>`;
  const styles = `body{margin:0;background:${project.canvas_bg || "#ffffff"};}\n${css}`;

  const zip = new JSZip();
  zip.file("index.html", indexHtml);
  zip.file("styles.css", styles);
  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, `${(project.name || "site").replace(/\s+/g, "-").toLowerCase()}.zip`);
};
