// Single source of truth for the responsive CSS injected into every page
// Web Dojo generates (preview, publish, standalone export, clean export).
// Grids collapse to one column below 768px unconditionally — safe for
// virtually any real layout regardless of original column count. Flex
// sections only stack if explicitly marked with data-wd-stack, since most
// display:flex usage in the block library is navbars, carousels, or
// compact rows that should NOT be forced to stack.
export const RESPONSIVE_CSS = `<style>@media (max-width: 768px) {
[style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
[data-wd-stack] { flex-direction: column !important; }
}</style>`;
