// Scaffolds a real static-site file tree for a Web Dojo project, aligned with
// exportHtml.js's buildMultiPageExport pipeline: it reuses that exporter to
// split the page(s) into <slug>.html + a generated globals.css (theme vars,
// base, component, responsive — exactly what the exporter would ship), then
// relocates globals.css into a css/ folder, adds a starter css/styles.css the
// author can write into, guarantees js/script.js and an empty imgs/ folder so
// the FileTree shows them before any upload.
//
// The returned shape is the Web Dojo FileTree file model
// ({ id, path, type: "file"|"folder", content, isImage? }) with "/"-separated
// paths, NOT the exporter's { filename: content } map.
import { buildMultiPageExport } from "./exportHtml.js";
import { STANDARD_LAYOUT_CSS } from "./standardLayout.js";

const uid = () => "scf_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

// Starter author stylesheet dropped into css/styles.css — a hand-off for the
// user to write their own layout/typography. Loaded AFTER css/globals.css
// (auto-generated from the project's theme picks), so anything here overrides
// it. Seeded with sensible defaults and the project name in a header comment.
const STARTER_STYLES = (name) => `/* ${name} — styles.css
   Author stylesheet. Loaded AFTER css/globals.css (auto-generated from your
   theme picks), so anything here overrides it. Add layout, typography and
   component rules here. */

:root {
  --max-width: 1140px;
  --gutter: 1rem;
  --radius: 12px;
}

main { max-width: var(--max-width); margin: 0 auto; padding: var(--gutter); }
img { max-width: 100%; height: auto; display: block; }
a { color: inherit; }
`;

// Starter script dropped into js/script.js when the project didn't already
// define one via a data-forge-js marker. Referenced by every scaffolded
// index.html.
const STARTER_SCRIPT = (name) => `// ${name} — script.js
// Referenced by index.html. Add interactivity here.
document.addEventListener("DOMContentLoaded", () => {
  // your code here
});
`;

export const scaffoldProjectFiles = (project, opts = {}) => {
  const p = project || {};
  const name = String(p.name || "Untitled").trim();
  const { files: exported } = buildMultiPageExport(p);
  // Phase 4a (Task 4): when a new blank project opts into the standard
  // layout, inject the site-layout CSS at the top of the generated
  // globals.css so .container/.content-section/.hero-section etc. exist for
  // the seeded skeleton HTML (see lib/standardLayout.js).
  let globalsCss = exported["globals.css"] || "";
  if (opts.standardLayout && STANDARD_LAYOUT_CSS) {
    globalsCss = `${STANDARD_LAYOUT_CSS}\n\n${globalsCss}`;
  }

  const out = [];
  // Relocate globals.css -> css/globals.css and add css/styles.css after it in
  // every .html entry the exporter produced (single- or multi-page).
  Object.keys(exported).forEach((k) => {
    if (!k.endsWith(".html")) return;
    const relocated = String(exported[k]).replace(
      '<link rel="stylesheet" href="globals.css" />',
      '<link rel="stylesheet" href="css/globals.css" />\n<link rel="stylesheet" href="css/styles.css" />'
    );
    out.push({ id: uid(), path: k, type: "file", content: relocated });
  });
  // Guard: if the exporter produced no html for some reason, still ship an
  // index.html so the tree is never empty.
  if (!out.some((f) => f.path.endsWith(".html"))) {
    out.unshift({ id: uid(), path: "index.html", type: "file", content: "" });
  }
  out.push({ id: uid(), path: "css/globals.css", type: "file", content: globalsCss });
  out.push({ id: uid(), path: "css/styles.css", type: "file", content: STARTER_STYLES(name) });

  // Forge-js markers extract into js/<name> by buildMultiPageExport. Carry
  // them over, and always guarantee a js/script.js hand-off file.
  const jsKeys = Object.keys(exported).filter((k) => k.startsWith("js/"));
  jsKeys.forEach((k) => out.push({ id: uid(), path: k, type: "file", content: exported[k] }));
  if (!jsKeys.includes("js/script.js")) {
    out.push({ id: uid(), path: "js/script.js", type: "file", content: STARTER_SCRIPT(name) });
  }

  // Empty asset folder so the tree shows imgs/ before any upload. FileTree
  // derives folders from file paths, but an explicit folder entry keeps an
  // empty one alive (same trick buildMultiPageExport uses with imgs/.keep,
  // only here it's a real folder node rather than a hidden placeholder file).
  out.push({ id: uid(), path: "imgs", type: "folder", content: "" });
  // Same for fonts/ (Phase 4a, Task 3): every new project starts with a
  // fonts folder ready for uploaded @font-face files.
  out.push({ id: uid(), path: "fonts", type: "folder", content: "" });

  return out;
};
