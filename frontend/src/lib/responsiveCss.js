// Single source of truth for the responsive CSS injected into every page
// Web Dojo generates (preview, publish, standalone export, clean export).
// Grids collapse to one column below the tablet/mobile breakpoints
// unconditionally — safe for virtually any real layout regardless of
// original column count. Flex sections only stack if explicitly marked
// with data-wd-stack, since most display:flex usage in the block library
// is navbars, carousels, or compact rows that should NOT be forced to
// stack. Breakpoints match responsiveOverrides.js's tiers (tablet
// <=1024px, mobile <=767px) so the top-bar viewport toggle and the
// per-element responsive overrides agree on where "tablet" ends.
//
// Emitted as BOTH @media and @container rules with identical bodies.
// @media is what actually matters for real visitors and for Preview
// mode's iframe (each has its own real layout viewport). @container is
// what makes the Design-canvas viewport toggle (Canvas.jsx) work at all:
// the canvas renders elements straight into the app's own document via
// dangerouslySetInnerHTML, not an iframe, so its width comes from a
// plain div — @media evaluates against the real browser window, which
// stays desktop-width regardless of the toggle, so it would never fire.
// Canvas.jsx gives its canvas wrapper `container-type: inline-size`,
// making that div itself the containment context @container measures
// against. In every other context (exports, Preview iframe) there's no
// such containment ancestor, so the @container rules simply never match
// there — harmless.
//
// Mirrored in backend/server.py as RESPONSIVE_CSS — the two HTML-assembly
// paths (backend preview/publish, frontend export) don't share code, so
// this constant is intentionally duplicated. Keep both in sync if you
// change this.
const TIER_RULES = `[style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
[data-wd-stack] { flex-direction: column !important; }`;

// Raw body (no wrapping <style> tag) — used by the multi-page/ZIP export
// path, which consolidates every media query into globals.css's own
// Media Queries section instead of a separate <head> <style> tag.
export const RESPONSIVE_CSS_BODY = `@media (max-width: 1024px) {
${TIER_RULES}
}
@media (max-width: 767px) {
${TIER_RULES}
}
@container (max-width: 1024px) {
${TIER_RULES}
}
@container (max-width: 767px) {
${TIER_RULES}
}`;

export const RESPONSIVE_CSS = `<style>${RESPONSIVE_CSS_BODY}</style>`;
