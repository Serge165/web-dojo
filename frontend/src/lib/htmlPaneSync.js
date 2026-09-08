// Reconciles the project's elements array against a fresh set of top-level
// nodes parsed from the HTML pane. Takes already-parsed nodes (plain
// {id, outerHTML} objects) rather than doing the parsing itself, so this
// stays pure and DOM-independent — actual parsing (via the browser's
// DOMParser) happens in CodeView.jsx and isn't unit-tested, since no DOM
// implementation is installed in this sandbox (see
// docs/superpowers/specs/2026-08-18-codepen-editor-design.md).
//
// Matching rules:
// - A parsed node whose id matches an existing element updates that
//   element's html in place, preserving any other fields already on it
//   (hidden, zIndex, ...).
// - A parsed node with no id, or an id that doesn't match any existing
//   element, becomes a new element with a fresh id from uidFn() — even if
//   the DOM happened to assign it an id attribute value, since that value
//   didn't come from this app's id space and could collide.
// - An existing element whose id doesn't appear in parsedNodes at all is
//   removed (the user deleted it from the HTML pane).
// - The returned array follows the ORDER of parsedNodes, so reordering
//   markup in the HTML pane reorders the canvas too.
export const reconcileElementsFromHtml = (currentElements, parsedNodes, uidFn) => {
  const byId = new Map(currentElements.map((el) => [el.id, el]));
  return parsedNodes.map((node) => {
    const existing = node.id && byId.has(node.id) ? byId.get(node.id) : null;
    if (existing) {
      return { ...existing, html: node.outerHTML };
    }
    return { id: uidFn(), html: node.outerHTML };
  });
};
