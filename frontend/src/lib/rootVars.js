// Insert or update one CSS custom property inside a dedicated :root block
// in a page's head_html — kept in its own <style data-forge-vars> tag,
// separate from ThemeGenerator's <style data-forge-theme> block, so
// switching the site theme doesn't wipe out per-element color picks (and
// vice versa: picking a per-element color doesn't touch the theme block).
const MARKER = /<style data-forge-vars>[\s\S]*?<\/style>\n?/;
const DECL_RE = /(--[\w-]+)\s*:\s*([^;]+);/g;

export const upsertRootVar = (headHtml, name, value) => {
  const h = headHtml || "";
  const existing = h.match(MARKER);
  const decls = new Map();
  if (existing) {
    const body = existing[0];
    let m;
    DECL_RE.lastIndex = 0;
    while ((m = DECL_RE.exec(body))) decls.set(m[1], m[2].trim());
  }
  decls.set(name, value);
  const block = `<style data-forge-vars>\n:root {\n${[...decls].map(([k, v]) => `  ${k}: ${v};`).join("\n")}\n}\n</style>\n`;
  return existing ? h.replace(MARKER, block) : h + (h ? "\n" : "") + block;
};

// Drop every declaration this module created for one element (its bg/text
// vars) — called when the element itself is deleted, so they don't linger
// in headHtml forever as dead CSS.
export const removeRootVarsForElement = (headHtml, elementId) => {
  const h = headHtml || "";
  const existing = h.match(MARKER);
  if (!existing) return h;
  const prefix = `--fc-${elementId}-`;
  const decls = new Map();
  let m;
  DECL_RE.lastIndex = 0;
  while ((m = DECL_RE.exec(existing[0]))) if (!m[1].startsWith(prefix)) decls.set(m[1], m[2].trim());
  // Also eats one optional leading newline — upsertRootVar joins onto prior
  // content with a separating "\n" before the block, so a plain MARKER
  // strip alone (which only covers a trailing \n) leaves that separator
  // dangling once the block is removed for good.
  if (decls.size === 0) return h.replace(new RegExp(`\\n?${MARKER.source}`), "");
  const block = `<style data-forge-vars>\n:root {\n${[...decls].map(([k, v]) => `  ${k}: ${v};`).join("\n")}\n}\n</style>\n`;
  return h.replace(MARKER, block);
};
