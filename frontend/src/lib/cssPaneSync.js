// Parses CSS-pane text (the .el-<id> / .el-<id>__n rules stripInlineStyles
// produces, see exportHtml.js) back into per-element style-attribute
// updates, so a live edit in the CSS pane can be written back onto the
// right element and, for elements with multiple style="..." attributes,
// the right *occurrence* within that element's HTML.
//
// Element ids always look like "el_" + 8 base36 chars (see uid() in
// Builder.jsx) and never contain a double underscore, so the "__N"
// occurrence suffix can't be confused with part of the id itself.
const RULE_RE = /\.el-(el_[0-9a-z]+)(?:__(\d+))?\s*\{([^}]*)\}/g;

// Returns a Map: elementId -> Array of declaration strings ordered by
// occurrence index (index 0 = root style, 1 = first nested style, ...).
export const parseCssPane = (css) => {
  const byId = new Map();
  let m;
  RULE_RE.lastIndex = 0;
  while ((m = RULE_RE.exec(css))) {
    const [, elId, occStr, declarations] = m;
    const occ = occStr ? Number(occStr) : 0;
    if (!byId.has(elId)) byId.set(elId, []);
    byId.get(elId)[occ] = declarations.trim();
  }
  return byId;
};

// Applies parsed per-element declarations back onto that element's HTML,
// replacing each style="..." attribute in encounter order (occurrence 0
// = root, 1 = first nested, ...). Occurrences the CSS pane didn't mention
// (undefined in the array — e.g. the user deleted that rule) are left
// untouched rather than blanked, so an incomplete/mid-edit CSS pane can't
// wipe out styling it didn't actually touch.
export const applyCssPaneToElement = (html, declarationsByOccurrence) => {
  if (!declarationsByOccurrence || declarationsByOccurrence.length === 0) return html;
  let n = 0;
  return html.replace(/style="([^"]*)"/g, (full) => {
    const decl = declarationsByOccurrence[n];
    n++;
    return decl === undefined ? full : `style="${decl}"`;
  });
};

// Reconciles a full CSS-pane edit back onto the elements array. Elements
// with no matching rules in the pane (e.g. the user deleted their whole
// rule block) are returned unchanged, not stripped of their style.
export const reconcileElementsFromCss = (elements, css) => {
  const byId = parseCssPane(css);
  return elements.map((el) => {
    const decls = byId.get(el.id);
    if (!decls) return el;
    return { ...el, html: applyCssPaneToElement(el.html, decls) };
  });
};
