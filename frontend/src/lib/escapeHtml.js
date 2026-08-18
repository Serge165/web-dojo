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

export const unescapeHtml = (value) =>
  String(value ?? "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");

// Safe to splice JSON.stringify(value) into a double-quoted HTML
// *attribute* (e.g. onclick="..."): HTML-attribute-escapes the JSON
// string's own quote characters so they can't prematurely close the
// surrounding attribute. The browser's HTML parser decodes &quot; back to
// " before handing the attribute value to the JS engine, so the string
// literal round-trips correctly as valid JS.
export const escJsAttr = (value) => escAttr(JSON.stringify(String(value ?? "")));

// Safe to splice JSON.stringify(value) into a literal <script>...</script>
// block's text content. HTML's script-content parsing rule is purely
// textual — it ends the block at the first literal "</script" substring
// it finds, regardless of JS string/quote context — so this escapes '<'
// as a JS unicode escape to guarantee that substring can never appear.
export const escJsScript = (value) => JSON.stringify(String(value ?? "")).replace(/</g, "\\u003C");
