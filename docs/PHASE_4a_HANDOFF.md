# Web Dojo — Phase 4a Handoff (Block Architecture & CSS Organization, Path B)

## What this phase is

Phase 4 of the modernization plan, **Path B (export-time)**: the design canvas and
`BlockEditMenu` still author inline styles (unchanged editing experience), but every
artifact that leaves the builder — exported standalone HTML, the multi-page zip, and
the scaffolded file tree — ships **class-based CSS with zero inline `style` attributes
on block elements**, organized under labeled per-category sections in `globals.css`.

The full author-time refactor (Path A / "Phase 4b": class-based block templates,
BlockEditMenu rework, Avalon GEMS cascade in-canvas) is explicitly deferred.

Decision record: the handoff spec's numbered taxonomy (`.block.hero-1`) was **rejected**
in favor of semantic names (`block-heroes-centered`). Reasons: `header-3`/`hero-5`/
`neon`/`updates` in the spec don't exist among the real 91 blocks/26 categories; numbers
re-create the `.section-N` collision problem; the semantic name derives deterministically
from the immutable block id. See docs/PHASE_4_BLOCK_AUDIT.md.

---

## Tasks delivered

### Task 0 — Block menu audit → `docs/PHASE_4_BLOCK_AUDIT.md`
- Menu source is `LeftSidebar.jsx` Library tab driven by `CATEGORIES` (`blocks.js` +
  `blocksExtra.js`), not a `BlockMenu.jsx`.
- All 91 blocks mapped to `block-<catId>-<slug>`; gaps vs the 12-section handoff spec flagged.

### Task 1 — Semantic class naming at export time
- `frontend/src/lib/stripInlineStyles.js`: when an element carries the
  `data-wd-cat`/`data-wd-block` pair (stamped by `variants.js::stampVariant`), its inline
  styles are extracted into `block-<catId>-<slug>-<occ>` (one class per style occurrence;
  occurrences collapse per element for GEMS override) plus a shared marker
  `block-<catId>-<slug>`. Unknown/user markup keeps the legacy `.section-N` fallback.
- Backend mirror kept in sync: `backend/server.py::_strip_inline_styles`.
- Live CSS-pane write-back (`cssPaneSync.js`) maps each suffixed class back to its exact
  element + occurrence; bare marker rules are recognized but not guessed at.

### Task 2 — globals.css "Blocks:" organization
- `exportHtml.js::buildOrganizedStylesheet` accepts either a flat component-css string
  (backward compatible) or `{ categoryLabel, css }` buckets and emits
  `/* ===== Blocks: <Category Label> ===== */` sections from the real `CATEGORIES` labels.

### Task 3 — Fonts infrastructure
- New `frontend/src/lib/fonts.js`: `buildFontFaceRules`, `addFontToProject`,
  `googleFontCssVars` (+ tests in `fonts.test.js`).
- Uploaded font files ship into the export zip at `fonts/<name>`; Google Fonts path also
  emits `--font-<slug>` variables.
- Every scaffolded project now has a `fonts/` folder node.
- `LeftSidebar.jsx` accepts font-file uploads (`onAddFontFile`, wired from Builder).

### Task 4 — Standard HTML layout
- New `frontend/src/lib/standardLayout.js`: `STANDARD_LAYOUT_SECTIONS` skeleton
  (`site-header` / `site-nav` / `hero-section` / `site-main > content-section > container`
  / `site-footer`) + `STANDARD_LAYOUT_CSS` (`.container` max-width var + responsive padding,
  spaced `.content-section`, all customization via CSS vars).
- Opt-in only: a wizard template whose data carries no elements counts as blank canvas;
  `Builder.jsx::startFromWizard` seeds the skeleton as page 0's element and passes
  `{ standardLayout: true }` to `scaffoldProjectFiles`, which prepends the layout CSS to
  `css/globals.css`. The 57 themed starter templates keep their own structure.

### Task 5 — JS auto-linking
- New `frontend/src/lib/jsAutoLink.js`: `linkJsInHtml` / `unlinkJsInHtml` /
  `relinkJsInHtml` (+ `isJsFilePath`, `fileNameOf`). Idempotent; inserts before `</body>`
  or appends when there's no body shell; tolerates attribute order/quotes.
- `FileTree.jsx` fires `onJsChange({ type: create|rename|delete, name, oldName })` on any
  create/rename/delete touching `js/<file>.js` (including moves into/out of `js/`), with
  success toasts. `Builder.jsx::handleJsChange` syncs the active page's `head_html`.
- Only direct children of `js/` trigger it — nested folders, css/html/txt don't.

### Task 6 — Regression status
- Frontend jest: **30 suites / 249 tests pass** (includes new `stripInlineStyles.test.js`,
  `exportHtml.test.js`, `fonts.test.js`, `standardLayout.test.js`, `jsAutoLink.test.js`,
  updated `projectScaffold.test.js`).
- Node runner for `cssPaneSync.test.mjs`: **11 pass**.
- Backend pytest `tests/test_responsive_export.py`: **14 pass**.

---

## Files touched this phase

**New:** `frontend/src/lib/fonts.js`(+test), `frontend/src/lib/standardLayout.js`(+test),
`frontend/src/lib/jsAutoLink.js`(+test), `docs/PHASE_4_BLOCK_AUDIT.md`, this doc.

**Edited:** `frontend/src/lib/stripInlineStyles.js`(+test), `cssPaneSync.js`
(+node test), `exportHtml.js`(+test), `projectScaffold.js`(+test),
`frontend/src/components/builder/{FileTree,LeftSidebar}.jsx`,
`frontend/src/pages/Builder.jsx`, `backend/server.py`,
`backend/tests/test_responsive_export.py`, `TODO.md`.

---

## Picking up Phase 4b (Path A)

1. Rewrite block templates in `blocks.js`/`blocksExtra.js`/`pageLayouts.js` to emit
   `class="block block-<catId>-<slug>"` instead of inline styles. The class bodies are
   already determined by this phase's audit doc — port each block's current inline
   declarations into the generated globals.css section.
2. Rework `BlockEditMenu.jsx` to edit tokens/CSS vars (writes via `upsertRootVar`, which
   already exists) instead of mutating inline styles.
3. Extend `.block` universal base class rules (the marker classes are already emitted).
4. Add visual regression coverage (Playwright screenshots pre/post refactor) before
   deleting the inline-style generation logic.
