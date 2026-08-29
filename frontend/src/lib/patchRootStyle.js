// Pure, import-free (mirrors stripInlineStyles.js/blockClassName.js's
// reasoning: kept dependency-free so it can be unit-tested without dragging
// in Builder.jsx's page-level imports — monaco-editor, axios, every builder
// panel component — none of which jsdom/jest can load).
//
// Phase 7 (block-CSS refactor follow-up): patches/removes a CSS declaration
// on a block's ROOT tag's inline style="…" attribute specifically, not
// "wherever the first style="..." happens to occur in the html string".
// Before Phase 4b, a block's root tag almost always carried its own
// style="...", so a whole-string scan reliably (if accidentally) landed on
// the root. Phase 4b converted ~112 blocks' root tags to author-time
// classes with no inline style, so a whole-string scan could instead match
// a styled descendant deeper in the block (recoloring the wrong element)
// or, worse, a literal `style="...")` substring inside a <script> payload's
// JS string literals (several blocks' widget scripts build markup strings
// containing that literal — see blocksExtra.js's comments.js/gallery.js/
// etc. widgets). This codebase has no sub-element selection within a block
// — "selected" is always the whole block — so the root tag is the only
// correct, deterministic target. Anchoring on `^\s*<tag ...>` (same pattern
// Builder.jsx's addClassToFirstTag/addAttrToFirstTag use) gets both
// properties at once: it's always the root, and it can never wander into a
// <script> payload's text content, since it only ever looks at the opening
// bracket of the very first tag in the string.
const rootTagMatch = (html) => (html || "").match(/^\s*<([a-zA-Z][\w-]*)([^>]*)>/);

// Merge a patch of CSS declarations into the block's root tag's style="…"
// attribute, creating one on the root tag if it has none.
export const patchFirstStyle = (html, patch) => {
  const m = rootTagMatch(html);
  if (!m) return html;
  const [full, tag, attrs] = m;
  const styleMatch = attrs.match(/style="([^"]*)"/);
  if (styleMatch) {
    const parts = styleMatch[1].split(";").map((s) => s.trim()).filter(Boolean);
    const map = {};
    parts.forEach((p) => { const i = p.indexOf(":"); if (i > 0) map[p.slice(0, i).trim()] = p.slice(i + 1).trim(); });
    Object.assign(map, patch);
    const newStyle = `style="${Object.entries(map).map(([k, v]) => `${k}: ${v}`).join("; ")}"`;
    const newAttrs = attrs.replace(/style="([^"]*)"/, newStyle);
    return html.replace(full, `<${tag}${newAttrs}>`);
  }
  const styleStr = Object.entries(patch).map(([k, v]) => `${k}: ${v}`).join("; ");
  return html.replace(full, `<${tag} style="${styleStr}"${attrs}>`);
};

// Removes one declaration from the root tag's style="…" attribute, if
// present. No-op (returns html unchanged) if the root tag has no style.
export const removeStyleProp = (html, prop) => {
  const m = rootTagMatch(html);
  if (!m) return html;
  const [full, tag, attrs] = m;
  const styleMatch = attrs.match(/style="([^"]*)"/);
  if (!styleMatch) return html;
  const kept = styleMatch[1].split(";").map((s) => s.trim()).filter(Boolean).filter((p) => p.split(":")[0].trim() !== prop);
  const newAttrs = attrs.replace(/style="([^"]*)"/, `style="${kept.join("; ")}"`);
  return html.replace(full, `<${tag}${newAttrs}>`);
};
