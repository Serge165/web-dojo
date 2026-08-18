# Responsive Export — Design

## Purpose
Web Dojo exports/publishes static sites with zero responsive-design
mechanism. Confirmed via `grep`: no `@media` queries in
`frontend/src/lib/blocks.js`, `blocksExtra.js`, or `pageLayouts.js`, and no
responsive Tailwind prefixes in any block-generating file. Blocks are built
entirely with inline styles (`style="display:flex;..."`,
`grid-template-columns:repeat(3,1fr)`, etc.), which cannot respond to
viewport width — grids and multi-column flex rows stay at full column
count on a phone. This is a gap in the block library, not a regression:
the mechanism never existed.

Scope, confirmed with the project owner: **exported/published sites** need
to be responsive. The builder app's own editor UI is explicitly out of
scope.

## Approach
A single shared responsive CSS block, injected into every page the app
ever emits, handling two cases:

```css
@media (max-width: 768px) {
  [style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
  [data-wd-stack] { flex-direction: column !important; }
}
```

**Grids** get a blanket rule — no per-block work needed. Collapsing any
multi-column grid to one column on mobile is correct in the overwhelming
majority of real layouts (pricing tables, feature/team/image grids,
footer link columns), regardless of the original column count or `fr`
ratios, so a universal override is safe.

**Flex rows** need judgment, not a blanket rule — many `display:flex`
usages are small inline UI groups (icon+label pairs, button rows) that
should stay row at any width, not just page-section-level multi-column
layouts. A new `data-wd-stack` HTML attribute marks exactly the wrapper
elements that should stack on mobile; everything else is left alone. This
requires a one-by-one pass over the `display:flex` occurrences in the
three block-generating files, applying this test: mark it if the flex
wrapper is a section-level layout container (a direct structural child of
a `<section>`/page wrapper, not nested inside a button/badge/icon+label
group) **and** has 2+ children that are each substantial content blocks
(headings, paragraphs, images, cards) rather than small inline atoms.

## File structure
- New `frontend/src/lib/responsiveCss.js` exporting a single
  `RESPONSIVE_CSS` string constant (the CSS above, as a JS template
  string) — the frontend's single source of truth.
- A matching Python string constant in `backend/server.py` (the backend
  assembles HTML independently and has no import path into
  frontend/src/lib — this mirrors the existing pattern where
  `_build_google_fonts_link` duplicates logic already present on the
  frontend, rather than introducing a new frontend/backend coupling).
- Both get spliced into the same four HTML-assembly points already
  established by the recent Inbox-scoping fix: `_project_to_html` and
  `_build_project_bundle` in `backend/server.py`; `buildStandaloneHtml`
  and `buildCleanExport` in `frontend/src/lib/exportHtml.js`.
- `data-wd-stack` attribute additions land directly in the relevant block
  template strings in `blocks.js`, `blocksExtra.js`, and `pageLayouts.js`
  — no new files, no structural change to how blocks are authored.

## Non-goals
- The builder app's own editor UI (sidebars, canvas, toolbars) — explicit
  scope decision, not attempted here.
- Tablet-specific intermediate breakpoints — v1 is binary: full desktop
  layout above 768px, collapsed/stacked layout at or below it.
- Per-block bespoke tuning (rejected alternative approaches B/C — bespoke
  media queries per block, or a full class-based layout-system refactor).
  Both are real options for a future pass if the blanket/opt-in approach
  proves insufficient, but neither is in scope now.
- The `starter_templates.py` backend file and any block-generating code
  outside the three named files (`cdnComponents.js`, `commerce.js`,
  `cart.js`, `forms.js`, `social.js` — these generate narrower, mostly
  single-column widgets, not page-section grids/flex-rows; out of scope
  unless investigation surfaces a real case).

## Testing
- Backend: pure-function tests on `_project_to_html`/`_build_project_bundle`
  confirming the responsive `<style>` block appears in generated output —
  same pattern as the existing `TestProjectIdInjection` tests.
- Frontend: `node --test` on the new `responsiveCss.js` module, plus
  tests confirming `buildStandaloneHtml`/`buildCleanExport` include it in
  their output.
- No automated test can confirm actual mobile rendering (no browser in
  this sandbox). Manual verification happens via the app's own
  mobile-viewport preview toggle (390px width) after implementation —
  the project owner confirms visually.
