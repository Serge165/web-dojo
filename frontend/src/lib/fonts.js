// Local/uploaded font infrastructure for Web Dojo projects (Phase 4a, Task 3).
//
// Google fonts are handled separately (plain family-name strings in
// page.fonts -> a Google Fonts <link> via exportHtml.js's buildFontLinks).
// This module handles *uploaded* font files. To stay consistent with how the
// app already ships images (assets are stored/served as data URIs so exports
// are self-contained and work offline under file://), an uploaded font is
// carried as:
//
//   <style data-forge-fonts>
//     @font-face { font-family: 'X'; src: url('data:font/ttf;base64,...') format('truetype'); ... }
//     :root { --font-x: 'X', sans-serif; }
//   </style>
//
// appended to a page's head_html. exportHtml.js's extractForgeCss lifts this
// block out of head_html and routes the :root (--font-* vars) into the
// "Theme Variables" globals.css section and the @font-face rule into "Base",
// so users can then reference var(--font-<slug>) anywhere. This module is
// deliberately pure (no DOM/file-system I/O) so it's trivially testable and
// import-free beyond the standard libs.

// Maps a font filename extension OR a data-URI MIME subtype to the CSS
// font-format keyword used in @font-face.
export const getFontFormat = (fileOrDataUri) => {
  if (typeof fileOrDataUri === "string" && fileOrDataUri.startsWith("data:")) {
    const mime = fileOrDataUri.slice(5, fileOrDataUri.indexOf(";"));
    const sub = String(mime).split("/")[1] || "";
    const uriMap = {
      ttf: "truetype", otf: "opentype", woff: "woff", woff2: "woff2",
      "font-ttf": "truetype", "font-otf": "opentype", "font-woff": "woff", "font-woff2": "woff2",
    };
    return uriMap[sub] || "truetype";
  }
  const ext = String(fileOrDataUri || "").split(".").pop().toLowerCase();
  const extMap = { ttf: "truetype", otf: "opentype", woff: "woff", woff2: "woff2" };
  return extMap[ext] || "truetype";
};

// "My Weird Font" -> "my-weird-font" (CSS variable slug).
export const fontFamilySlug = (family) =>
  String(family || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "font";

// One @font-face rule. `file` may be a path like "fonts/X.ttf" or a data URI.
export const buildFontFace = ({ family, file, weight = 400, style = "normal" }) =>
  `@font-face {\n  font-family: '${family}';\n  src: url('${file}') format('${getFontFormat(file)}');\n  font-weight: ${weight};\n  font-style: ${style};\n}`;

// One CSS variable declaration exposing a font family on :root.
export const buildFontVar = (family) => {
  const slug = fontFamilySlug(family);
  return `  --font-${slug}: '${family}', sans-serif;`;
};

// Content of the <style data-forge-fonts> block for one or more local fonts:
// the @font-face rules followed by a :root block of --font-<slug> variables.
export const buildFontsStyleContent = (fonts) => {
  const faces = (fonts || []).map(buildFontFace).join("\n");
  const vars = (fonts || []).map((f) => buildFontVar(f.family)).join("\n");
  const root = fonts && fonts.length ? `:root {\n${vars}\n}` : "";
  return [faces, root].filter(Boolean).join("\n\n");
};

// The full <style data-forge-fonts>...</style> block to append to head_html.
export const buildFontsStyleBlock = (fonts) =>
  `<style data-forge-fonts>\n${buildFontsStyleContent(fonts)}\n</style>`;

// Convenience: derive a clean font-family display name from a file name.
export const fontFamilyFromFilename = (filename) =>
  String(filename || "").replace(/\.(ttf|otf|woff|woff2)$/i, "");
