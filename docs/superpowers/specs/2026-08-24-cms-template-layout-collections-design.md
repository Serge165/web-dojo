# Web Dojo — Templates, Layouts & Collections (a native mini-CMS)

## Status

**RETIRED.** The premise this spec was written under — "nothing about blog/CMS content
is functional right now" — was wrong, based on an incomplete grep that missed a separate
router module. `backend/models/zenero.py` (wired into `server.py` via
`app.include_router(zenero_router)`) is a complete, real, working live-CRUD backend for
exactly this ground (updates/gallery/blog/portfolio), and `ZeneroDashboardPanel.jsx` is a
matching, complete authoring UI — both uncommitted, in-progress work already representing
weeks of the project owner's own effort, just not yet mounted into the app's navigation.
Building a second, generic, static-export CMS on top would compete with that finished
work rather than complete it. Superseded by: finishing the wiring of the existing Zenero
stack (mounting `ZeneroDashboardPanel`/`SocialConnectModal`, adding Timeline/Bento as two
more Zenero content types, wiring the `social-wall` block to the already-real
`/social-feed` endpoint) — a bounded change against existing code, tracked in
conversation rather than a new spec file.

**Kept:** Implementation Order item 1 (asset path rewriting —
`docs/superpowers/plans/2026-08-24-asset-path-rewriting-plan.md`) is unrelated to the CMS
question and still valid; it stands on its own regardless of this retirement.

The four `blocksExtra.js` widget blocks this doc originally called "dead" (`updates`,
`gallery`, `blog`/`latest-blog`, `portfolio`) are **not dead** — their `fetch(...)` calls
hit real `zenero_router` endpoints. They stay. Everything below this point describes the
retired generic-Collection design and is kept only for historical reference.

## Problem

Web Dojo has no concept of "a system of related pages driven by structured content." A
user importing or building a blog has to hand-author every post page individually, with
no shared layout enforcement and no way for an index/archive page to stay in sync as
posts are added. The same is true for portfolios, and any other repeating-content site
structure.

## Terminology

- **Collection** — a named, structured set of content items (e.g. "Blog Posts"). Has a
  schema: a `base_type` (`blog_post` | `portfolio_project` | `custom`) that supplies a
  sensible default field set, plus any number of user-added extra fields. Field types:
  `text`, `richtext`, `image`, `date`, `number`, `toggle`. No relations/references
  between collections (explicitly out of scope — see below).
- **Collection Item** — one row of data in a Collection (one blog post, one project).
  Always has an auto-generated, editable, unique-within-collection `slug`.
- **Layout** — a page design. Two kinds:
  - *Static* — authored once, rendered once. Functionally identical to today's
    `project.pages[]` entries.
  - *Collection-bound* — contains a **Collection List** element bound to one Collection,
    in `list` mode (repeats a card sub-tree once per item — the Archive/index page) or
    `detail` mode (renders once per item using that item's field values — the Single
    Post page).
- **Template** — a named group of Layouts plus (optionally) the Collection they share,
  e.g. "Blog" = {Home, Archive, Single Post} + Collection "Blog Posts".
- **Page** — for a static Layout, the one manual instance (unchanged from today). For a
  collection-bound Layout, pages are **virtual** — generated at export/preview time, one
  per Collection Item (`detail`) or one page containing all items (`list`). They are
  never stored in `project.pages[]`.

## Data Model

Additive only — `project.pages[]` is untouched, so every existing project keeps working
with zero migration.

```js
project.collections = [{
  id, name,                    // "Blog Posts"
  base_type: "blog_post" | "portfolio_project" | "custom",
  fields: [{ key: "title", label: "Title", type: "text" }, ...],
  items: [{ id, slug, values: { title: "...", body: "...", cover_image: "imgs/foo.jpg" } }],
}]

project.layouts = [{
  id, name, template_id: null | "tpl_xxx",
  kind: "static" | "collection_list" | "collection_detail",
  collection_id: null | "coll_xxx",
  elements, head_html, canvas_bg, fonts, custom_js, seo,   // same shape as a page today
  slug: "blog",                          // static & collection_list
  slug_pattern: "blog/{slug}",           // collection_detail only
}]

project.templates = [{
  id, name,                    // "Blog"
  collection_id: null | "coll_xxx",
  layout_ids: ["home_layout_id", "archive_layout_id", "post_layout_id"],
}]
```

Default field sets:
- `blog_post`: title(text), date(date), author(text), excerpt(richtext), body(richtext),
  cover_image(image), tags(text — comma-separated, not a structured array; see scope cuts)
- `portfolio_project`: title(text), category(text), cover_image(image),
  description(richtext), client(text), date(date)

## Authoring Markers (reuses the existing `data-forge-*` convention)

- `data-forge-collection-list="{collection_id}"` — the repeating container in a
  `collection_list` layout; its single child element is the repeat unit.
- `data-forge-bind="{field_key}"` — on any element inside a bound layout: for
  text/richtext, swaps innerHTML; for image, swaps `src` (on `<img>`) or
  `background-image` (on anything else); for date, swaps formatted text.
- `data-forge-bind-href="item"` — on a link/button inside a `collection_list` card:
  points its `href` at that item's detail page (only meaningful when the template also
  has a `collection_detail` layout).

## Canvas Authoring UX

- **Bind panel** — new tab in the existing `RightSidebar` (alongside Style/Responsive/
  Motion/etc.), visible only when the selected block sits inside a collection-bound
  layout. Rather than live click-to-select on nested DOM children (no such mechanism
  exists anywhere in this codebase today — confirmed against `RightSidebar.jsx`/
  `Canvas.jsx`/`Builder.jsx`, where `selected` is always one whole top-level canvas
  block, never a nested child), it follows the same pattern every existing "edit part of
  a block" feature already uses (`BlockEditMenu.jsx`'s gallery/nav/timeline editors:
  parse the block's HTML into a structured list, edit that list, write back into the
  string): the panel lists every detected bindable sub-element within the selected
  block, each with its own field dropdown, a live preview of the bound value from the
  first item (or a placeholder like "Sample Title" if the collection is empty), and
  Unbind.
- **Collection data panel** — new dedicated panel (same tier as `FormBuilderModal`/
  `EcommerceOrdersPanel`): pick a collection, spreadsheet-style item list, click a row to
  open a field-by-field edit form, Add/Delete item. This is a distinct data-management
  surface, not part of the visual canvas.
- **Building a `collection_list` layout**: user creates a new Layout, picks "Collection
  List," picks the collection, designs one card, selects its repeat container and marks
  it via a toolbar action ("Repeat this for each item"), then binds each child element
  via the Bind panel — same primitives as everything else. Auto-generating this layout
  from an imported sample is explicitly out of scope for v1 (see below); it's always
  built by hand, once, per template.

## Import → Template Detection ("Convert to Template")

Operates on files already sitting in the project's file tree (via the FileTree
folder-import path fixed earlier this session, which already runs `scanHtml` +
`inlineLocalStylesheets`).

1. User selects 2+ `.html` files in the tree they believe share a layout (e.g. three
   blog posts) and runs "Convert to Template."
2. Each file's body is parsed into a DOM tree. Trees are walked in lockstep: at each
   level, children are matched across all samples by a `(tagName, normalized className)`
   signature.
   - A position where **all** samples have a matching child with identical signature is
     "shared structure."
   - Within a shared position, if the **text content** or `src`/`href` attribute differs
     across samples, that node becomes a **field candidate**, keyed by its structural
     path (e.g. `body>section.hero>h1`).
   - A position present in some samples but not others is left alone — it's baked
     verbatim from the first ("primary") sample and excluded from field detection.
3. **Similarity gate**: `matched-node-pairs / primary-sample-total-nodes`. Below 0.4, abort
   with "these pages don't look similar enough to share a layout" rather than emitting a
   low-quality result.
4. **Field type/name heuristics** (all editable before confirming): `<img>` → Image;
   text matching a date-like pattern → Date; the single longest text candidate → Rich
   Text (assumed body); everything else → Text. Name guessed from heading level
   (h1→"Title", h2→"Subtitle") or class-name tokens (`class="excerpt"` → "Excerpt"),
   else "Field 1", "Field 2"...
5. Review modal: rename/retype/exclude each candidate field, name the Collection, pick
   `base_type` or Custom. On confirm: creates the Collection (items populated from each
   sample's diffed values — converting existing posts also imports their content, not
   just structure) and one `collection_detail` Layout (the primary sample's structure,
   with `data-forge-bind` inserted at each confirmed field position). The Archive
   (`collection_list`) layout is still built by hand afterward using the native tools
   above. Original files in the tree are left untouched (non-destructive) — nothing is
   auto-deleted.

## Asset Handling (image path rewriting)

Whenever HTML is brought into a Layout or Collection Item — via the plain FileTree
"insert" path (already fixed) or via Convert-to-Template — any local (non-`http(s)://`)
`<img src>`, `<source srcset>`, or inline `background-image:url(...)` reference is
rewritten to `imgs/{basename}`, matching where `FileTree.jsx` already physically stores
uploaded image files (`imgs/${file.name}`, confirmed existing convention). New helper
`rewriteLocalImagePaths(html)` in `importHtml.js`, sibling to the just-added
`inlineLocalStylesheets`, applied everywhere `scanHtml` is invoked for an import. This
piece is small and self-contained enough to build and land first, independent of the
rest of this spec.

## Export (Static Site Generation)

Static layouts export exactly as today's pages do — unchanged code path. The only new
piece is a pre-pass, `expandTemplatesToPages(project)`, that turns
`templates[]`/`layouts[]`/`collections[]` into plain page objects matching the exact
shape `buildMultiPageExport` (client) and `_build_multi_page_bundle` (backend) already
consume — so neither of those functions' actual bundling/globals.css logic needs to
change, only their input array grows:

- `collection_list` layout → one page (e.g. slug `blog`), with its repeat container
  expanded into N literal card copies, one per item, each `data-forge-bind` element
  replaced by that item's value and each `data-forge-bind-href="item"` element pointed
  at the item's detail URL.
- `collection_detail` layout → N pages, one per item, slug = `slug_pattern` with
  `{slug}` substituted (default `{template-slug}/{slug}`), each a clone of the layout's
  elements with bound elements replaced.
- Empty collection → `collection_list` page renders its static chrome with zero cards;
  `collection_detail` contributes zero pages. No crash.

This same `expandTemplatesToPages` function is also called client-side by the Design
canvas to preview a collection-bound layout while editing it (single source of truth for
the expansion logic — one code path, two callers).

## Navigation

The existing page-switcher bar (top of the canvas, where "Home" and its Draft/Review/
Published status live today) gains Layouts as additional entries, grouped under their
Template's name when one exists, with standalone static pages listed below as today.
Selecting a `collection_detail` Layout there opens it in "editing the shared design"
mode (item #1's data, or placeholders if the collection is empty) — not a picker over
every generated page, since those are virtual and only materialize at export/preview
time.

## Reconciling the existing "Template" button

The existing TopBar/status-bar "Template" button controls an unrelated, existing feature
(`project.template = {header_html, footer_html, use_template}`, a shared header/footer
wrapper). To free up "Template" terminology for the new concept without touching its data
model, its button label is renamed to "Header/Footer." A new "Templates" entry point is
added alongside "Project templates" for managing the new system.

## Error Handling

- Deleting a Collection still referenced by a live Layout: warn, offer to unbind (bound
  elements fall back to placeholder text) rather than silently breaking export.
- Slug collisions within a collection: auto-suffix (`-2`, `-3`, ...), same pattern as
  `safePageFilename` already uses in `exportHtml.js`.

## Explicitly Out of Scope (v1)

- Cross-collection references/relations.
- Multi-value/array fields (image galleries as structured arrays; `tags` is plain
  comma-separated text).
- Pagination on the Archive layout (renders all items).
- Per-item draft/scheduled states (reuses the existing single project-wide Draft/Review/
  Published status only).
- Auto-generating the `collection_list` (Archive) layout from a detected sample — always
  hand-built.
- Nested/child collections.

## Testing

- Unit: field render/format helpers per type; slug generation + uniqueness; asset path
  rewriting (`rewriteLocalImagePaths`); the diff/field-detection algorithm against fixture
  HTML samples (similar-samples-in → expected field candidates out; dissimilar-samples-in
  → similarity-gate rejection); `expandTemplatesToPages` (templates/layouts/collections in
  → flat page list matching `buildMultiPageExport`'s expected shape out).
- Export snapshot: fixture project with a Blog template + 2 posts → zip contains
  `blog/index.html` and both post pages with correct interpolated content and rewritten
  `imgs/` paths.
- Component tests for the Bind panel and Collection data panel (existing
  `BlockEditMenu.test.jsx`-style pattern).
- Manual Playwright verification of the full authoring + export flow before calling any
  phase done, matching this session's earlier verification of the folder-import fix.

## Implementation Order

1. `rewriteLocalImagePaths` (small, independent — can land immediately).
2. Data model + Collection data panel + Bind panel (native authoring, no import).
3. `expandTemplatesToPages` + export wiring + Design-canvas preview.
4. Remove the four dead widget blocks from `blocksExtra.js`; update
   `2026-08-21-dashboard-content-cms-design.md`'s Status line to point here.
5. Convert-to-Template (diff-based import detection) — depends on 2 & 3 existing.
