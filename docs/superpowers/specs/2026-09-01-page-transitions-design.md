# Web Dojo — Native Page Transitions

## Status

Approved for implementation. First of two sub-projects under the "Slides Editor →
pages/theme" request (2026-09-01); Slides Editor itself (slide-outline editor, PPT-throwback
UI, page generation) is sub-project 2 and gets its own spec once this one ships, since the
two are independently useful and don't depend on each other.

## Problem

The user wants named page-to-page transition effects (fade, push/slide, wipe, etc. —
PowerPoint/Movie Maker-style) on exported Web Dojo sites. An initial spec they supplied
(relayed via another AI) implemented this the SPA way: a `<main id="page-container">`
shell with two absolutely-positioned `.page` divs, JS `transitionTo()` swapping
`innerHTML` and toggling `-enter`/`-exit` classes, listening for `transitionend`/
`animationend`.

That doesn't fit Web Dojo: exported sites are real separate static HTML documents
(`index.html`, `about.html`, ...), not a single-page app. Adopting the SPA-shell doc as-is
would mean rewriting the exporter's navigation model. Instead, the CSS **cross-document
view transitions** at-rule (`@view-transition`) does the same job natively, with real
`<a href>` navigation, zero JS, and zero exporter changes — unsupporting browsers (current
Firefox/Safari) just navigate normally with no error and no fallback code required.

## Design

### `frontend/src/lib/transitions.js` (new, sibling to `themes.js`)

Exports `TRANSITIONS`, an array of 10 presets ported from the supplied doc's named effects
— `none`, `fade`, `push`, `wipe`, `cover`, `split`, `shape`, `bars`, `zoom`, `shatter`,
`pixelate` — one entry per effect (`none` excluded from the doc's list, added here as the
explicit "off" state). Each preset is `{ id, name, css }`, where `css` is the effect ported
to the native pseudo-element model:

- The doc's `.fade-exit`/`.fade-enter` (etc.) class pairs, driven by JS adding/removing
  classes on real DOM nodes, become `::view-transition-old(root)` (outgoing page) /
  `::view-transition-new(root)` (incoming page) selectors, driven by the browser
  automatically on real navigation — no class toggling, no JS.
- The doc's `@keyframes` blocks (splitOut, fadeIn, shapeReveal, barsWipe, zoomIn, shatter,
  pixelateOut, pixelateIn) port over largely unchanged, renamed with a `wd-` prefix to
  avoid collisting with any user CSS, and are always paired with an
  `@view-transition { navigation: auto; }` at-rule inside the same block (harmless if
  declared once, but included per-preset since only one preset's `<style>` block is present
  on a page at a time).
- `mask-image`/`filter`/`clip-path`/`transform`/`opacity` all apply cleanly to
  `::view-transition-old/new` pseudo-elements (they paint as regular generated boxes), so
  every one of the 10 effects — including the mask-based `bars` effect and the
  `filter: blur()`-based `pixelate` effect — ports without a fallback rewrite.
- Every preset's `css` is wrapped with a shared
  `@media (prefers-reduced-motion: reduce) { ::view-transition-group(*) { animation: none !important; } }`
  block (matches the doc's own accessibility requirement).

Also exports `transitionHeadHtml(t)`, mirroring `themeHeadHtml()`: wraps `t.css` in
`<style data-forge-transition="${t.id}">...</style>`.

### `TransitionsPanel.jsx` (new component)

Structural clone of `ThemeGenerator.jsx`: a preset list (name only — no color swatches,
these are motion not palette), an "Apply to all pages" checkbox (default checked, kept for
UI consistency with the theme picker even though transitions are inherently whole-site),
and an Apply button per preset calling `onApplyTransition({ headHtml: transitionHeadHtml(t), allPages })`.
No custom/hand-authored tab (unlike Theme's "Custom" tab) — YAGNI, the 10 presets cover the
request; add a custom-CSS escape hatch later only if asked.

### `RightSidebar.jsx`

Add `{ id: "transitions", label: "Transitions" }` to `TABS` (next to the existing `"theme"`
entry), render `<TransitionsPanel onApplyTransition={onApplyTransition} />` on that tab, add
`onApplyTransition` to the prop list. Because this tab lives in the top-level sidebar (not
nested in any per-block-type editor like `GalleryEditor`/`BentoEditor`/`NavbarEditor`), it's
available regardless of what block or content editor is open — satisfies "works in all the
editors."

### `Builder.jsx`

Add `applyTransition`, mirroring `applyTheme` (~line 619): strip any prior
`<style data-forge-transition=...>` block from `head_html` via regex (same approach as
`rethemeHead`'s `data-forge-theme` strip), append the new one, broadcast across
`project.pages[]` when `allPages` is true (always true from the UI, but the parameter stays
for symmetry with `applyTheme`'s signature and any future per-page override).

### Export

No changes. `head_html` already flows into each exported page's `<head>` — this is the same
mechanism `theme` already uses, so transitions work on export for free.

## Testing (two checkpoints, per explicit request)

1. **Before wiring** — unit test for `transitions.js`: for all 10 presets (+`none`),
   `transitionHeadHtml()` produces a `<style data-forge-transition>` block containing the
   `@view-transition` at-rule and the expected `::view-transition-old(root)`/
   `::view-transition-new(root)` selectors; syntactic validity spot-check (balanced
   braces/no truncated blocks) for each generated CSS string.
2. **After wiring** — test on `Builder.jsx`'s `applyTransition` (replaces rather than
   duplicates the style block on repeated calls; broadcasts to every page in
   `project.pages[]`) and on `RightSidebar`/`TransitionsPanel` (tab renders, preset buttons
   call `onApplyTransition` with the right preset's `headHtml`).

## Out of scope (this sub-project)

- Slides Editor itself (outline input, page generation, PPT-throwback UI) — sub-project 2.
- Per-element `view-transition-name` tagging for element-level continuity across pages
  (e.g. a shared header morphing instead of the whole page swapping) — not requested; the
  10 presets all animate the whole page (`root`) only.
- A custom/hand-authored transition tab — not requested; presets only.
