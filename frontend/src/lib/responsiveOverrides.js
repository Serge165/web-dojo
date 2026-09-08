// Per-element, per-breakpoint style overrides. Desktop stays the base
// inline style (elements[i].html, unchanged) — tablet/mobile overrides
// live in a sibling elements[i].responsive = { tablet: {prop:val}, mobile: {prop:val} }
// field and get compiled into a dedicated <style> block injected into
// head_html, mirroring how rootVars.js manages its own :root block.
//
// Tablet's blocks are emitted before mobile's, so a property left unset
// at mobile still inherits tablet's override (both match at mobile
// widths; mobile only wins where it sets that same property) — the
// "desktop cascades to smaller breakpoints, with override" behavior falls
// out of plain CSS ordering, no extra inheritance logic needed.
//
// Each tier gets both an @media and an @container rule with the query
// text reused verbatim. @media matches for real visitors/Preview mode's
// iframe; @container is what makes these overrides preview correctly on
// the Design canvas, which renders into a plain div (given
// container-type: inline-size in Canvas.jsx) rather than an iframe, so
// @media alone would evaluate against the real browser window instead —
// see responsiveCss.js for the full explanation of this pattern.
const TIERS = [
  { key: "tablet", query: "(max-width: 1024px)" },
  { key: "mobile", query: "(max-width: 767px)" },
];
const AT_RULES = ["@media", "@container"];

export const BREAKPOINTS = {
  tablet: { label: "Tablet", range: "768–1024px" },
  mobile: { label: "Mobile", range: "320–767px" },
};

const STYLE_MARKER = "data-forge-responsive-overrides";

export const buildResponsiveOverridesCss = (elements) => {
  const blocks = TIERS.flatMap(({ key, query }) => {
    const rules = elements
      .filter((e) => e.responsive?.[key] && Object.keys(e.responsive[key]).length)
      .map((e) => {
        const decls = Object.entries(e.responsive[key])
          .filter(([, v]) => v !== "" && v != null)
          .map(([k, v]) => `${k}: ${v} !important;`)
          .join(" ");
        return decls ? `[data-forge-el-id="${e.id}"]{${decls}}` : "";
      })
      .filter(Boolean);
    if (!rules.length) return [];
    return AT_RULES.map((at) => `${at} ${query} {\n${rules.join("\n")}\n}`);
  }).filter(Boolean);
  return blocks.length ? `<style ${STYLE_MARKER}>\n${blocks.join("\n")}\n</style>` : "";
};

// Regenerates the whole responsive-overrides block from the current
// elements array and replaces it in head_html (removes it entirely once
// no element has any override left).
//
// The strip pattern also eats one OPTIONAL LEADING newline: insertion
// below joins onto prior content with a separating "\n" before the
// block, so a plain trailing-\n? strip alone would leave that leading
// separator dangling once the block itself is removed for good.
export const upsertResponsiveOverridesCss = (headHtml, elements) => {
  const stripped = (headHtml || "").replace(new RegExp(`\\n?<style ${STYLE_MARKER}>[\\s\\S]*?<\\/style>\\n?`), "");
  const css = buildResponsiveOverridesCss(elements);
  return css ? `${stripped}${stripped ? "\n" : ""}${css}` : stripped;
};
