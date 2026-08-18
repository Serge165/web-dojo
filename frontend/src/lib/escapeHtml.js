// Single source of truth for HTML-escaping free-text values before they're
// spliced into generated HTML strings (exported/published sites, canvas
// blocks). Two functions because the safe escaping differs by context:
// an HTML attribute value also needs quotes escaped; a text node doesn't.

export const escAttr = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const escText = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
