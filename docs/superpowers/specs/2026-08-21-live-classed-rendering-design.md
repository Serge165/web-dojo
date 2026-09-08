# Live Classed Rendering + Injected globals.css — Design

## Purpose
Web Dojo blocks are stored and rendered as self-contained inline-style
HTML (`elements[i].html`, e.g. `<section style="padding:64px 32px;...">`).
A prior pass (2026-08-21, "globals.css/token architecture") confirmed the
class-extraction machinery already exists (`stripInlineStyles.js`, exactly
the tag-name + running-counter naming scheme: `.nav-1`, `.nav-2`, `.h2-1`)
and is already wired into the ZIP export and the Code view's CSS tab. But
it's only ever computed on demand for those two surfaces — the live Design
canvas and the Code view's HTML tab still show 100% inline styles, which
reads as "the classes aren't actually generating" even though they are.

The project owner wants classes to be the thing you *see* everywhere you
look at the project — Design mode, the HTML tab, the CSS tab — not just an
export-time artifact, without paying for a full storage migration.

## Scope
Make the classed/CSS projection a *live* thing: computed from the current
`elements` on every relevant render, injected into the document as a real
stylesheet, and used to render the Design-mode canvas and the Code view's
HTML tab. The HTML tab stays editable — edits to the classed markup
reconcile back into `elements[i].html` (still inline-style) via a new sync
module alongside the existing HTML/CSS pane sync modules.

## Non-goals — explicitly confirmed with the project owner
- **No storage migration.** `elements[i].html` keeps its current shape
  (self-contained inline-style HTML). Undo/redo, `dupEl` (duplicate),
  drag-and-drop reordering, "Save as component", and the backend
  `Project`/page schema are all unchanged. The classed view is always
  *derived*, never the source of truth.
- **`buildStandaloneHtml` stays inline.** The single-file `.html` export
  and the live Preview-mode iframe (`srcDoc={buildStandaloneHtml(project)}`)
  keep using raw inline styles — that's the deliberate portable-single-file
  option, a different use case from the classed ZIP export
  (`buildCleanExport`, already classed, unchanged by this spec).
- **Saved components stay inline-style.** Matches the existing block-library
  convention (`blocks.js`/`blocksExtra.js` templates are inline-style too).
- **No per-page vs. project-wide stylesheet question to resolve.**
  `stripInlineStyles` already operates per current page's `elements`
  (matching how `head_html`/`canvas_bg`/`fonts` are already per-page) —
  this spec keeps that scope, computing fresh per page.

## Core mechanism: derive, don't migrate
`stripInlineStyles(elements)` already returns `{ html, css, classMap }`
where `html` is the whole-project classed markup joined into one string.
This spec adds a `perElement: Array<{id, html}>` field to that return value
(additive — existing callers using `.html`/`.css` are unaffected) so Canvas
can render each element's classed fragment individually while keeping its
per-element overlay controls (edit/duplicate/move/delete buttons) working
exactly as they do today.

Both Canvas and the Code view's HTML tab consume this via
`useMemo(() => stripInlineStyles(elements), [elements])`, recomputed
whenever `elements` changes. The `css` field gets injected into
`document.head` as a `<style data-forge-generated-classes>` tag, managed by
a `useEffect` that mirrors the existing `headHtml`-injection effect in
`Canvas.jsx` (same cleanup-on-unmount/re-inject-on-change pattern).

**Critical invariant:** inline text editing (`Canvas.jsx`'s `editingId`
state — pencil icon → `contentEditable` → blur calls `onEditHtml(id,
e.currentTarget.innerHTML)`) must keep rendering and reading from the raw
inline-style `el.html`, never the classed projection. If the
`contentEditable` div showed classed markup, blurring it would write
classed-without-styles back as the element's new source HTML, silently
destroying that block's styling. Every other Canvas render path (the
non-editing display of each block) switches to the classed projection;
this one path explicitly does not.

## Canvas rendering change
`Canvas.jsx` currently does, per element:
```jsx
<div dangerouslySetInnerHTML={{ __html: el.html }} />
```
This becomes (non-editing path only):
```jsx
<div dangerouslySetInnerHTML={{ __html: classedById.get(el.id) ?? el.html }} />
```
where `classedById` is a `Map` built from the memoized `perElement` array
each render. The `?? el.html` fallback covers the render right after a new
element is added, before the memo recomputes — should be effectively
instant (same render pass) but costs nothing to guard.

The stylesheet injection effect lives in `Canvas.jsx` next to the existing
`headHtml` injection effect, injecting the memoized `css` value.

## HTML tab: stays editable, reconciled via classMap
The Code view's HTML tab (`CodeView.jsx`) currently shows
`joinElementsHtml(elements)` (raw inline) and syncs edits back via
`reconcileElementsFromHtml` (`htmlPaneSync.js`), which does simple
id-matching and takes each top-level node's `outerHTML` verbatim as the
new `el.html`. Taking classed markup verbatim would silently strip styling
the same way the contentEditable case above would.

New module `classedHtmlPaneSync.js`, used only by the HTML tab:

1. The HTML tab's displayed text becomes the classed `perElement` output
   (joined, with each root tag's `id` stamped on it exactly as
   `withRootId` already does today).
2. On a debounced edit, parse the new text with `DOMParser` (same
   forgiving-parse approach already used for the existing HTML pane sync)
   into top-level nodes.
3. For each parsed node matching an existing element by `id`: walk its
   class attributes, look each one up in the `classMap` **captured at the
   moment this text was generated** (i.e. the `classMap` from the same
   `stripInlineStyles` call that produced the pane's pre-edit content, not
   a fresh recomputation — classes are positional/regenerated each render,
   so reusing a stale-but-matching map is what keeps "this class" pointing
   at "this occurrence" during the edit). Each recognized class resolves to
   `{elementId, occurrence}`; look up that occurrence's original
   declaration block (from the CSS pane text at the same pre-edit moment)
   and splice it back in as a `style="..."` attribute on the corresponding
   tag, replacing the `class="..."` reference.
4. A class in the edited markup that isn't in the captured `classMap`
   (newly typed/pasted, not one of the auto-generated ones) passes through
   unstyled as a literal `class` attribute — identical to how pasting
   arbitrary external HTML into the current HTML tab already behaves.
5. A parsed node with no `id` match (new top-level element) is added via
   the same "new element, fresh `uid()`" path `reconcileElementsFromHtml`
   already uses, taking its markup as-is (any classes on it are literal,
   unstyled, same passthrough as point 4).
6. An existing element whose `id` no longer appears is removed — unchanged
   from today's `reconcileElementsFromHtml` behavior.

The result is written back as `el.html` in fully-inlined form, so nothing
downstream (Canvas's classed-projection recompute, undo/redo, export)
needs to know the edit ever went through a classed intermediate form.

The CSS tab's existing sync (`cssPaneSync.js`/`reconcileElementsFromCss`)
is unchanged — it already does the equivalent job for CSS-only edits and
already writes back to inline `el.html`.

## Risk area: blocks with embedded `<style>` tags
Several recently-added blocks (pricing toggle, FAQ accordion, portfolio
filter — 2026-08-20's block-library pass) embed their own scoped
`<style>...</style>` tag alongside `style="..."` attributes, for
`:has()`/`:checked`-driven CSS-only interactivity. `stripInlineStyles`'s
extraction regex targets the `style="..."` *attribute* pattern
specifically; a `<style>` *tag*'s contents don't match that pattern (CSS
rule bodies don't contain literal `style="`), so these should pass through
untouched by extraction — but this is exactly the kind of case to verify
directly rather than assume, since it wasn't part of `stripInlineStyles`'s
original test surface (built before those blocks existed).

## Testing plan
1. **Visual parity, many block types**: before/after screenshot comparison
   across a representative spread — plain blocks, the multi-style-attribute
   gallery blocks, and specifically the `:has()`-interactive blocks (verify
   their embedded `<style>` tags and the FAQ accordion/pricing
   toggle/portfolio filter's actual interactivity still work once rendered
   through the classed projection).
2. **Full edit-loop exercise**: insert a block → style it via the right
   sidebar (Color/Tokens/Gradient/Shape panels, all of which patch inline
   `el.html` and should flow through to the classed render on next
   recompute) → edit it via the HTML tab → edit it via the CSS tab → undo →
   redo → duplicate → delete → export (ZIP and standalone) — confirming
   each step's output is correct and nothing regresses.
3. **Inline text editing invariant check**: confirm double-clicking to
   edit text still shows/edits raw inline HTML, and that blurring out of
   it doesn't strip the block's styling.
