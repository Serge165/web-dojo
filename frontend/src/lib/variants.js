// Stamps/reads a data-wd-cat / data-wd-block pair on an element's root
// tag so the Variants panel can look up sibling blocks from the same
// library category (blocks.js's CATEGORIES) — reuses the existing
// category grouping as the variant-family source instead of inventing a
// second taxonomy.
export const stampVariant = (html, catId, blockId) => {
  const m = html.match(/^\s*<([a-zA-Z][\w-]*)([^>]*)>/);
  if (!m) return html;
  const [full, tag, attrs] = m;
  return html.replace(full, `<${tag}${attrs} data-wd-cat="${catId}" data-wd-block="${blockId}">`);
};

export const readVariant = (html) => {
  if (!html) return null;
  const cat = html.match(/data-wd-cat="([^"]*)"/);
  const block = html.match(/data-wd-block="([^"]*)"/);
  return cat && block ? { catId: cat[1], blockId: block[1] } : null;
};
