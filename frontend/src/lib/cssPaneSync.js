// Parses CSS-pane text (the semantic tag-N rules stripInlineStyles
// produces, see exportHtml.js) back into per-element style-attribute
// updates, so a live edit in the CSS pane can be written back onto the
// right element and, for elements with multiple style="..." attributes,
// the right *occurrence* within that element's HTML.
//
// Unlike the old .el-<id> scheme, a semantic class (.section-1, .h2-3, …)
// doesn't encode which element or occurrence it belongs to — it's a tag
// name plus a counter scoped across the WHOLE document. So recovering the
// mapping means regenerating the exact same assignment stripInlineStyles
// would produce for the CURRENT elements array (via its classMap) and
// looking each parsed class up in that — hence this needs `elements`,
// where the old id-encoded scheme didn't.
import { stripInlineStyles } from "./stripInlineStyles.js";

const RULE_RE = /\.([a-zA-Z][\w-]*)\s*\{([^}]*)\}/g;

// Returns a Map: elementId -> Array of declaration strings ordered by
// occurrence index (index 0 = root style, 1 = first nested style, ...).
// A class the current classMap doesn't recognize (e.g. the user hand-typed
// a brand-new selector, or the elements array changed shape since the
// pane text was generated) is skipped rather than guessed at.
export const parseCssPane = (css, elements) => {
  const { classMap } = stripInlineStyles(elements || []);
  const byId = new Map();
  let m;
  RULE_RE.lastIndex = 0;
  while ((m = RULE_RE.exec(css))) {
    const [, cls, declarations] = m;
    const target = classMap.get(cls);
    if (!target) continue;
    const { elementId, occurrence } = target;
    if (!byId.has(elementId)) byId.set(elementId, []);
    byId.get(elementId)[occurrence] = declarations.trim();
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
  const byId = parseCssPane(css, elements);
  return elements.map((el) => {
    const decls = byId.get(el.id);
    if (!decls) return el;
    return { ...el, html: applyCssPaneToElement(el.html, decls) };
  });
};
