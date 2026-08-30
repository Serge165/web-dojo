# Block Editor Refactor — Design

**Date:** 2026-08-30
**Status:** Approved by user, pending implementation plan

## Problem

`BlockEditMenu.jsx`'s `detectBlockKind(html)` classifies a selected block into
exactly one of `gallery | navbar | timeline | video | bento | image | hero |
cta | card | null`, and `BlockEditMenu` renders exactly one editor for
whichever kind it picked. This is wrong on two levels:

1. **Exclusive dispatch loses regions.** A block can carry a heading, a
   media/background, and structured content at once. Kind-detection picks
   one and hides the rest. Confirmed live bugs:
   - `parallax-hero-fullbleed` / `parallax-hero-split`
     (`frontend/src/lib/blocksExtra.js`) have zero `<img>` tags and no inline
     `background-image` — their background moved to the generated stylesheet
     during the Phase 4b class-based CSS conversion (`deb6bcc`). No kind
     branch catches this, so it falls through to `"hero"` →
     `GenericBlockEditor`, which has no concept of a background at all. The
     background is **not editable**, not just hard to find.
   - `video-hero` (`frontend/src/lib/blocksExtra.js`) has a `<video>` plus an
     `<h1>`/`<p>`/`<a>`. `detectBlockKind` picks `"video"` (checked before
     the hero fallback), which is not in `GENERIC_KINDS`, so the headline
     and CTA link become uneditable — the inverse failure, same root cause.

2. **No structural signal to detect from.** The 117 templates in `blocks.js`
   / `blocksExtra.js` use ad hoc per-template class names
   (`block-components-gallery-grid-1`, etc.) with no canonical marker for
   "this is a heading" or "this is a container-shaped block" — so
   `detectBlockKind` has to guess from content heuristics (image counts,
   inline style regexes), which is exactly what breaks when markup changes
   underneath it (as Phase 4b's CSS conversion just did).

## Source spec (user-provided, 2026-08-30)

Three block shapes:

- **Type A** — plain content blocks: `<section class="block {type}{variant}">`.
- **Type B** — galleries, timelines, bento boxes, social wall:
  `<section><div class="container-{blockType}">…</div><div class="container
  block {blockType} {variant}">…</div></section>`.
- **Type C** — navbars: `<nav class="block {navType}{variant}">`.

Clarified in discussion: **every block gets an optional heading region
except footer and navbar.** For Type B, the outer `container-{blockType}`
div *is* that heading slot (eyebrow + `<h1>`/`<h2>`, typically); the inner
`container block {blockType} {variant}` div is the actual content. For Type
A, the heading lives directly inside the section alongside the content — no
extra wrapper.

Verified against the real templates: of the 117 non-nav/non-footer blocks,
roughly half already carry a heading-ish element (`<h1>`/`<h2>`/an
eyebrow-style leading element) near the top; half don't. The convention is
real but was never made consistent — this refactor is the first time it
will be.

## Design

### 1. Migration strategy: additive, not structural rewrite

For Type B blocks, do **not** force the literal two-nested-div structure
where a single wrapper div already exists (most real templates currently
wrap heading + content together in one div). Instead, promote the existing
wrapper into the `container-{blockType}` heading role when it already
separates cleanly (e.g. the Zenero gallery block's eyebrow+`<h2>` div vs. its
grid div), and only add a second wrapper where content needs to be split out
from what's currently mixed with the heading.

Rationale: this avoids reopening the backend CSS generation pipeline
(`phase4b-classify-blocks.mjs` → `blockStyles.generated.js` /
`block_styles_generated.py`) at the *selector-depth* level — it already
caused two real regressions earlier this project (the Phase 4b CSS-gap fix
and the Code-view HTML/CSS desync fix). The generator is class-name-driven,
not depth-driven, so adding marker classes doesn't require selector changes;
adding a new nesting *level* might.

Every template gets:
- A `block-heading` marker class on its heading element(s), where a heading
  exists. Blocks with no heading-ish element are left alone — heading stays
  optional, never force-added.
- For Type B blocks specifically: the heading/content split described
  above, using `container-{blockType}` / `container block {blockType}
  {variant}` naming.
- Type A and Type C blocks keep their current flat / `<nav>` structure;
  only the `block-heading` marker is new for Type A.

### 2. Legacy compatibility (confirmed requirement)

The 117 templates are a **library** — dragging one onto a page embeds a
snapshot of its current HTML into the user's saved project. Renaming/adding
markers in the library does **not** retroactively touch blocks already
placed in existing saved projects. Therefore:

- `detectBlockKind`'s existing content-based heuristics are **not removed**.
  They remain the fallback path for any block instance that doesn't carry
  the new canonical markers (i.e. every block placed before this migration
  ships).
- The new `detectBlockShape` (below) is purely additive — its absence never
  breaks anything, it just means shape-specific editing isn't available for
  that instance.

### 3. Composable region-based editing (replaces exclusive kind dispatch)

Replace `BlockEditMenu`'s single-editor-per-kind dispatch
(`GENERIC_KINDS`/`KIND_LABELS`, the `kind === "x" && <XEditor/>` chain) with
**region detection**: a block can expose zero or more of the following
regions simultaneously, each rendered by its own editor slice, stacked in
one panel:

- **Heading region** — present if a `block-heading`-marked element (or,
  pre-migration, a bare `<h1>`/`<h2>` near the top) exists. New shared
  editor slice usable by every shape that has one (today this text is
  edited inconsistently — sometimes by `GenericBlockEditor`, sometimes not
  at all if another kind's editor claimed the block).
- **Media/background region** — present if the block has an `<img>`, a
  `<video>`, an inline `background-image`/`background: url(...)`, **or** is
  a hero/parallax-shaped block with none of the above (the Phase 4b
  regression case). For that last case, the editor offers "set a
  background" and writes a **new inline** `style="background-image:
  url(...)"` onto the block's outer element when the user picks one — inline
  style wins over the class rule in the cascade, so this doesn't require
  touching generated CSS.
- **Structured content region** — gallery image list, timeline entries,
  bento tiles, navbar items — same parsers/editors that exist today
  (`parseGalleryImages`/`parseTimelineEntries`/`parseBentoItems`/
  `parseNavbarTree`), just no longer gated behind an exclusive kind check.
- **Generic text region** — whatever's left (buttons, links, paragraphs not
  claimed by the above) via the existing `parseEditableNodes`/
  `setEditableNode` machinery.

`detectBlockKind` is retired as the dispatch mechanism (its content-sniffing
regexes get redistributed into the region detectors above, so no detection
logic is lost — it's decomposed rather than deleted) once all regions have
their own detector; `KIND_LABELS`/`GENERIC_KINDS` go away with it.

### 4. `detectBlockShape(html)` (new)

Structural, not content-based — reads canonical markers when present:
- `<nav\b` at the top → `"nav"`.
- A `container-{x}` / `container block` div pair → `"container"` (Type B).
- Otherwise → `"section"` (Type A; safe default, matches most blocks).

No fallback needed the way `detectBlockKind` needs one — absence of markers
just yields the default `"section"` shape, which never throws and never
blocks any region editor from working (shape informs the heading-editor's
container conventions; region detection above is independent of it).

### 5. Backend CSS regeneration

After template migration, re-run `phase4b-classify-blocks.mjs` to regenerate
`blockStyles.generated.js` / `block_styles_generated.py`, same pipeline
already exercised for the Phase 4b fix. No generator logic changes expected
(new class strings only, not new selector shapes) — verify with the existing
`test_block_styles_generated.py` / equivalent JS regression tests.

## Testing

- Unit tests for `detectBlockShape` against fixtures of all three shapes
  plus a "no markers" fallback case.
- Regression test: all 117 real templates parse into a shape without
  throwing.
- Unit tests per region detector (heading / media-background including the
  no-existing-image hero case / structured-content / generic) against real
  template fixtures, especially `parallax-hero-fullbleed` and `video-hero`
  as the two confirmed regression cases.
- Existing `BlockEditMenu.test.jsx` cases updated for composable rendering
  (a block can now show multiple editor slices at once) rather than
  exactly-one-editor assertions.
- Backend: existing `test_block_styles_generated.py` and CSS-wiring tests
  re-run after regeneration; no new backend logic expected.

## Out of scope (explicitly deferred)

- **Avalon GEMS color-theming system** (14 gemstone gradients, SCSS mixins,
  `theme.css` defs) — a separate visual-theming layer, not a block-shape
  concern. Tracked in `project_block_editor_gap` memory as related but
  distinct.
- **`CodeView.jsx`'s HTML tab** showing only joined block fragments instead
  of the full page-shell structure — originally flagged as blocked on "what
  is a block," which is now answered, but was not part of this design
  conversation and needs its own pass.
- **`oxygeneblocks.md`** (comment-widget rendering/script) — not yet read in
  full; unrelated to shape/region editing.
- Everything else in the 2026-08 backlog (gallery modernization, sidebar
  facelift, landing-page/Zenero wiring, dynamic content blocks, forms
  functionality) — queued separately, see `project_2026_08_backlog` memory.
