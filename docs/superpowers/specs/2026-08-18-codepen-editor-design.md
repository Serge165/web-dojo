# CodePen-Style Code Editor — Design

## Purpose
Web Dojo's Code mode (`CodeView.jsx`) currently shows two panes: a
**read-only** generated view of the project's HTML/CSS/Inline output (left,
via `buildCleanExport`/`buildStandaloneHtml`), and an **editable** `<head>`
editor (right). There is no way to edit page body HTML/CSS through code —
typing in the left pane does nothing, since it's a one-way derived view,
not a source of truth. There is also no JS-editing concept anywhere in the
project data model. The project owner wants a CodePen-like experience:
edit HTML/CSS/JS directly, see a live preview, with the edits flowing back
into the same canvas the Design-mode WYSIWYG editor manipulates.

## Scope
Redesign Code mode into three live-synced panes — HTML, CSS, JS/Preview —
where editing HTML or CSS writes back into the project's `elements` array
in real time (debounced), and a live preview pane reflects the current
state. Add a new `custom_js` field to the page data model, editable as its
own Monaco tab, injected into the page's `<body>` at HTML-assembly time.

## Non-goals
- **Split View** (Design canvas + Code editor shown side-by-side
  simultaneously, as a new top-level mode alongside Design/Code/Preview)
  is a related but separate, already-queued item — not part of this spec.
  This spec only redesigns what happens *inside* Code mode.
- Monaco already provides syntax highlighting, line numbers, bracket
  matching, indent guides, code folding, and search/replace out of the
  box (confirmed in `CodeEditor.jsx` — these are Monaco defaults, not
  something this spec needs to build).
- No changes to the `<head>` editor's existing behavior (Emmet + language
  select) — it stays as-is, just moves to make room for the new panes.

## Data model change
Add `custom_js: string` to the `Page` shape (frontend `Builder.jsx`'s
`pages` state — sits alongside the existing `head_html`/`canvas_bg`/
`fonts`/`elements`/`seo` fields, same pattern) and to the backend
`Project`/page dict shape (`backend/server.py`'s `Project`/`ProjectCreate`/
`ProjectUpdate` Pydantic models — optional string, default `""`, matching
how `head_html` is already modeled).

`custom_js` is injected as `<script>${custom_js}</script>` immediately
before `</body>` in all four HTML-assembly functions already touched by
the responsive-export work: `_project_to_html`, `_build_project_bundle`
(backend), `buildStandaloneHtml`, `buildCleanExport` (frontend).

## HTML pane — live two-way sync
Every block already carries a stable id on both its array entry and its
root HTML tag (`{id: "el_1", html: "<section id=\"el_1\">..."}`, id
generated via the existing `uid()` helper in `Builder.jsx`:
`"el_" + Math.random().toString(36).slice(2, 10)`).

On a debounced HTML-pane edit:
1. Parse the full pane content with the browser's native `DOMParser`
   (`new DOMParser().parseFromString(html, "text/html")`, read
   `.body.children`) — no new dependency, and its forgiving parsing
   (auto-closes malformed/mid-typing tags) means an incomplete edit
   degrades gracefully instead of throwing.
2. For each top-level parsed node, read its root `id` attribute.
3. Build a new `elements` array: a parsed node whose `id` matches an
   existing element updates that element's `html` in place (preserving
   Layers-panel identity and selection); a node with no id or an
   unrecognized id becomes a new element (assigned a fresh `uid()`); an
   existing element whose id no longer appears in the parsed output is
   removed.
4. Replace `elements` state with the reconciled array through the same
   shared debounced update function the CSS pane uses (see below), so a
   fast HTML edit and a fast CSS edit can't race and clobber each other's
   version of the same element.

## CSS pane — live two-way sync, same id strategy
Today's `stripInlineStyles`/`_strip_inline_styles` (already touched by the
responsive-export work) numbers generated classes sequentially (`el-0`,
`el-1`, …) by scan order — not stable across edits or reorderings. Change
the generated class name to the element's own stable id (`el-${element.id}`)
so a CSS-pane edit can be parsed back deterministically: regex-match
`.el-<id> { <declarations> }` blocks (a format this app controls — no new
CSS-parser dependency needed, same approach `stripInlineStyles` already
uses in reverse) and write the matched declarations directly onto that
element's inline `style` attribute.

## Preview pane
Third pane, `srcDoc` regenerated from current project state via the
existing `buildStandaloneHtml`, debounced on the same cycle as the HTML/CSS
sync so it doesn't thrash on every keystroke.

## Race-condition guard
HTML-pane and CSS-pane edits both ultimately mutate the same `elements`
array through different means (markup vs. `style` attribute). Both paths
route through one shared debounced update function (not two independent
debounced effects) so a rapid edit in one pane can't be silently
overwritten by a stale reconciliation from the other still in flight.

## Editor mechanics
- Ctrl+S: wired to the existing `save()` function in `Builder.jsx`
  (`axios.put` to `/api/projects/{id}`) via a Monaco `addCommand` /
  `addAction` keybinding — no new save logic, just a new trigger for the
  existing one.
- Ctrl+/ (comment toggle), folding, search/replace: Monaco defaults,
  already functional, no work needed.

## Testing
- Backend: pure-function tests on the four assembly functions confirming
  `custom_js` is injected correctly (same pattern as the
  `TestProjectIdInjection`/`TestResponsiveCss` tests already in this
  codebase).
- Frontend: the HTML/CSS reconciliation logic (DOMParser-based matching,
  regex-based CSS extraction) is pure and framework-independent — testable
  directly with `node --test` regardless of the surrounding React
  component being JSX. The debounce/race-guard wiring itself, and the
  actual Monaco pane layout, live in JSX and can't be automated in this
  sandbox (no browser, `file-saver`'s CJS/ESM interop already blocks
  Node-importing `exportHtml.js` — this codebase's established pattern for
  that gap is manual code-reading verification, noted explicitly rather
  than silently skipped).
- No automated test can confirm actual debounce timing or visual
  rendering — the project owner verifies those in a browser after
  implementation.
