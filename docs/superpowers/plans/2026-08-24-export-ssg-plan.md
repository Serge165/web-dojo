# Export SSG (Templates/Layouts/Collections → Static Pages) Implementation Plan

> **RETIRED — do not execute.** The generic Template/Layout/Collection design this plan implements was shelved in favor of finishing the already-real "Zenero" content stack (`backend/models/zenero.py` + `ZeneroDashboardPanel.jsx`). See `docs/superpowers/specs/2026-08-24-cms-template-layout-collections-design.md`'s Status section. Kept for reference only.


> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `project.templates[]`/`layouts[]`/`collections[]` (added in Part 2a/2b) into real static pages at export time — both the client ZIP export and the backend Publish path — and preview a collection-bound Layout with real/placeholder data while editing it in the Design canvas.

**Architecture:** One shared pre-pass, `expandTemplatesToPages(project)`, turns collection-bound Layouts into plain page objects matching the exact shape `buildMultiPageExport` already consumes — so its bundling/globals.css logic doesn't change, only its input array grows. The same per-layout expansion logic is reused by the Design canvas for live preview (single source of truth, two callers). The backend gets a line-for-line Python mirror, `_expand_templates_to_pages`, following this codebase's existing convention of keeping a JS/Python pair in sync (see `extractForgeCss`/`_extract_forge_css`, `safePageFilename`/`_safe_page_filename`, etc.) — but unlike those existing pairs (which only ever extract/remove `<style>`/`<script>` blocks, never nest same-tag elements inside themselves), this one has to clone and mutate an arbitrary nested element tree, which plain regex cannot do safely (a naive `[\s\S]*?` matcher breaks the moment a repeat-unit card contains a nested `<div>` inside another `<div>`, which Web Dojo's own Container/2-Columns blocks do routinely). The backend has zero HTML-DOM-tree dependency today (100% regex, verified: no `bs4`/`lxml`/`html5lib` in `requirements.txt` or `server.py`'s imports) because every existing regex use case is "extract text between two same-named non-self-nesting marker tags" — a case regex handles correctly. This one isn't that case, so this plan adds `beautifulsoup4` (pure-Python-installable, no C build step, the standard tool for exactly this problem) rather than hand-rolling a tag-depth-counting parser that would still get whitespace/entity/self-closing-tag edge cases wrong.

**Tech Stack:** `DOMParser` (browser/jsdom, matching `collectionBinding.js`'s existing pattern) for the JS side; `beautifulsoup4` (new backend dependency) for the Python side.

**Spec:** `docs/superpowers/specs/2026-08-24-cms-template-layout-collections-design.md`
**Depends on:** `docs/superpowers/plans/2026-08-24-native-cms-core-2a-data-model-plan.md` and `2026-08-24-native-cms-core-2b-authoring-plan.md` (must be implemented first — this plan consumes `project.layouts`/`collections` and the `data-forge-collection-list`/`data-forge-bind`/`data-forge-bind-href` markers those plans establish).

## Global Constraints

- `data-forge-collection-list` / `data-forge-bind` / `data-forge-bind-href` are the exact marker names (spec: "Authoring Markers") — no other names.
- Static Layouts are untouched by this work — they export exactly as pages do today (spec: "Export").
- Empty collection → zero cards / zero pages, no crash (spec: "Export," explicit test case required).
- `buildMultiPageExport`'s and `_build_multi_page_bundle`'s own bundling/globals.css logic must not change — only their input `pages` array grows (spec: "Export").
- **Deviation from the spec, flagged for the spec's author:** the spec's default `slug_pattern` example (`"blog/{slug}"`) implies a real nested output file (`blog/my-post.html`), but `safePageFilename`/`_safe_page_filename` currently sanitize a slug by replacing every non-`[a-z0-9-]` character — including `/` — with `-`, which would flatten that to `blog-my-post.html`. This plan extends both functions to preserve exactly one level of `/` nesting (matching what the spec's own default pattern needs) rather than silently producing flat filenames or quietly changing the spec's default pattern to avoid the issue. Verified this is safe to extend: each function has exactly one call site (inside `buildMultiPageExport`/`_build_multi_page_bundle` itself), and the FTP/SFTP publish path already uploads nested-path filenames today for `imgs/.keep`, `fonts/.keep`, and `js/{name}.js` without any special-casing (`ftp.storbinary(f"STOR {name}", ...)` where `name` already contains `/`), so no publish-path changes are needed for this to work end-to-end.

---

## Task 1: `src/lib/expandTemplates.js` — client-side expansion + live-preview helper

**Files:**
- Create: `src/lib/expandTemplates.js`
- Test: `src/lib/expandTemplates.test.js`

**Interfaces:**
- Consumes: nothing new (works on plain `project.layouts`/`project.collections` data — the exact shapes `createLayout`/`createCollection`/`createCollectionItem` from Part 2a's `src/lib/collections.js` produce).
- Produces: `expandTemplatesToPages(project: { layouts, collections }): Page[]` (Task 2 merges this into `buildMultiPageExport`'s `pages` array); `previewLayoutElements(layout, collections): Element[]` (Task 4 calls this from `Canvas.jsx`). `Page` here is `{ id, name, slug, seo, head_html, canvas_bg, fonts, custom_js, elements }` — the exact shape every entry in `project.pages[]` already has.

- [ ] **Step 1: Write the failing tests**

```js
// src/lib/expandTemplates.test.js
import { expandTemplatesToPages, previewLayoutElements } from "./expandTemplates";

const collection = {
  id: "coll_1", name: "Blog Posts", base_type: "blog_post",
  fields: [
    { key: "title", label: "Title", type: "text" },
    { key: "cover_image", label: "Cover Image", type: "image" },
  ],
  items: [
    { id: "item_1", slug: "hello-world", values: { title: "Hello World", cover_image: "imgs/a.jpg" } },
    { id: "item_2", slug: "second-post", values: { title: "Second Post", cover_image: "imgs/b.jpg" } },
  ],
};

const detailLayout = {
  id: "lay_detail", name: "Single Post", kind: "collection_detail", collection_id: "coll_1",
  slug: "single-post", slug_pattern: "blog/{slug}",
  elements: [{ id: "el_1", html: `<h1 data-forge-bind="title">Post Title</h1>` }],
  head_html: "", canvas_bg: "#ffffff", fonts: [], custom_js: "", seo: {},
};

const listLayout = {
  id: "lay_list", name: "Archive", kind: "collection_list", collection_id: "coll_1",
  slug: "blog",
  elements: [
    { id: "el_header", html: `<h2>From the Blog</h2>` },
    { id: "el_card", html: `<div data-forge-collection-list="coll_1"><img data-forge-bind="cover_image" src=""><h3 data-forge-bind="title">Title</h3><a data-forge-bind-href="item" href="#">Read more</a></div>` },
  ],
  head_html: "", canvas_bg: "#ffffff", fonts: [], custom_js: "", seo: {},
};

test("collection_detail expands to one page per item, slug from slug_pattern, bound field substituted", () => {
  const pages = expandTemplatesToPages({ layouts: [detailLayout], collections: [collection] });
  expect(pages).toHaveLength(2);
  expect(pages[0].slug).toBe("blog/hello-world");
  expect(pages[0].elements[0].html).toContain(">Hello World<");
  expect(pages[1].slug).toBe("blog/second-post");
});

test("collection_list expands to one page with the repeat-unit card cloned once per item", () => {
  const pages = expandTemplatesToPages({ layouts: [listLayout], collections: [collection] });
  expect(pages).toHaveLength(1);
  expect(pages[0].slug).toBe("blog");
  // header + 2 cards, in original order
  expect(pages[0].elements).toHaveLength(3);
  expect(pages[0].elements[0].html).toContain("From the Blog");
  expect(pages[0].elements[1].html).toContain(">Hello World<");
  expect(pages[0].elements[1].html).toContain('src="imgs/a.jpg"');
  expect(pages[0].elements[2].html).toContain(">Second Post<");
});

test("data-forge-bind-href points each card at its item's detail page when a matching collection_detail layout exists", () => {
  const pages = expandTemplatesToPages({ layouts: [listLayout, detailLayout], collections: [collection] });
  const list = pages.find((p) => p.slug === "blog");
  expect(list.elements[1].html).toContain('href="blog/hello-world.html"');
  expect(list.elements[2].html).toContain('href="blog/second-post.html"');
});

test("empty collection produces zero cards for collection_list and zero pages for collection_detail, no crash", () => {
  const empty = { ...collection, items: [] };
  const pages = expandTemplatesToPages({ layouts: [listLayout, detailLayout], collections: [empty] });
  const list = pages.find((p) => p.slug === "blog");
  expect(list.elements).toHaveLength(1); // just the header, card template vanished
  expect(pages.filter((p) => p.slug !== "blog")).toHaveLength(0);
});

test("static layouts are ignored entirely", () => {
  const staticLayout = { id: "lay_home", name: "Home", kind: "static", elements: [{ id: "e", html: "<p>hi</p>" }] };
  const pages = expandTemplatesToPages({ layouts: [staticLayout], collections: [] });
  expect(pages).toHaveLength(0);
});

test("previewLayoutElements renders a collection_detail layout using the first item", () => {
  const els = previewLayoutElements(detailLayout, [collection]);
  expect(els[0].html).toContain(">Hello World<");
});

test("previewLayoutElements falls back to a labeled placeholder when the collection has no items yet", () => {
  const empty = { ...collection, items: [] };
  const els = previewLayoutElements(detailLayout, [empty]);
  expect(els[0].html).toContain("Sample Title");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `CI=true npx craco test --testPathPattern="expandTemplates" --watchAll=false`
Expected: FAIL — `Cannot find module './expandTemplates'`

- [ ] **Step 3: Write the implementation**

```js
// src/lib/expandTemplates.js
// Turns collection-bound Layouts into plain page objects matching the
// exact shape project.pages[] entries already have, so buildMultiPageExport
// (and, when editing, the Design canvas) can treat generated pages exactly
// like hand-authored ones. See docs/superpowers/specs/
// 2026-08-24-cms-template-layout-collections-design.md ("Export").
// Mirrored in backend/server.py's _expand_templates_to_pages — keep both in sync.

const findField = (collection, key) => (collection?.fields || []).find((f) => f.key === key);

const placeholderFor = (field) => {
  if (field.type === "image") return "";
  if (field.type === "date") return "";
  return `Sample ${field.label}`;
};

// Substitutes every data-forge-bind element's content/src with the given
// item's field value (or a labeled placeholder when item is null, e.g. for
// canvas preview of an empty collection), and points every
// data-forge-bind-href="item" element's href at detailUrl when given.
const applyBindingsToHtml = (html, item, collection, detailUrl) => {
  const doc = new DOMParser().parseFromString(`<div id="__root">${html}</div>`, "text/html");
  const root = doc.getElementById("__root");
  root.querySelectorAll("[data-forge-bind]").forEach((el) => {
    const key = el.getAttribute("data-forge-bind");
    const field = findField(collection, key);
    const value = item ? (item.values?.[key] ?? "") : (field ? placeholderFor(field) : "");
    if (field?.type === "image") {
      if (el.tagName === "IMG") el.setAttribute("src", value);
      else if (value) el.style.backgroundImage = `url(${value})`;
    } else if (field?.type === "date") {
      el.textContent = value ? new Date(value).toLocaleDateString() : (item ? "" : "Sample Date");
    } else {
      el.textContent = String(value ?? "");
    }
  });
  if (detailUrl) {
    root.querySelectorAll('[data-forge-bind-href="item"]').forEach((el) => el.setAttribute("href", detailUrl));
  }
  return root.innerHTML;
};

const detailUrlFor = (detailLayout, item) => {
  if (!detailLayout || !item) return null;
  const pattern = detailLayout.slug_pattern || `${detailLayout.slug}/{slug}`;
  return `${pattern.replace("{slug}", item.slug)}.html`;
};

const findDetailLayout = (layouts, collectionId) =>
  layouts.find((l) => l.kind === "collection_detail" && l.collection_id === collectionId) || null;

const findCardTemplate = (elements, collectionId) =>
  elements.find((el) => new RegExp(`data-forge-collection-list=["']${collectionId}["']`).test(el.html)) || null;

const pageFieldsFromLayout = (layout) => ({
  id: layout.id, name: layout.name, slug: layout.slug, seo: layout.seo,
  head_html: layout.head_html, canvas_bg: layout.canvas_bg, fonts: layout.fonts, custom_js: layout.custom_js,
});

// Expands one collection_list Layout's elements: the single element
// carrying data-forge-collection-list is replaced in place by one clone
// per collection item (0 clones for an empty collection); every other
// element passes through unchanged, in original order.
const expandListElements = (layout, collection, items, detailLayout) => {
  const cardTemplate = findCardTemplate(layout.elements, layout.collection_id);
  const out = [];
  layout.elements.forEach((el) => {
    if (el !== cardTemplate) { out.push(el); return; }
    items.forEach((item) => {
      out.push({
        id: `${layout.id}__card__${item.id}`,
        html: applyBindingsToHtml(cardTemplate.html, item, collection, detailUrlFor(detailLayout, item)),
      });
    });
  });
  return out;
};

export const expandTemplatesToPages = (project) => {
  const layouts = project.layouts || [];
  const collections = project.collections || [];
  const collById = new Map(collections.map((c) => [c.id, c]));
  const pages = [];

  layouts.forEach((layout) => {
    if (layout.kind === "static") return;
    const collection = layout.collection_id ? collById.get(layout.collection_id) : null;
    const items = collection ? collection.items : [];

    if (layout.kind === "collection_list") {
      const detailLayout = findDetailLayout(layouts, layout.collection_id);
      pages.push({ ...pageFieldsFromLayout(layout), elements: expandListElements(layout, collection, items, detailLayout) });
    } else if (layout.kind === "collection_detail") {
      items.forEach((item) => {
        pages.push({
          ...pageFieldsFromLayout(layout),
          id: `${layout.id}__${item.id}`,
          name: item.values?.title || item.slug,
          slug: (layout.slug_pattern || `${layout.slug}/{slug}`).replace("{slug}", item.slug),
          elements: layout.elements.map((el) => ({ ...el, html: applyBindingsToHtml(el.html, item, collection, null) })),
        });
      });
    }
  });

  return pages;
};

// Design-canvas live preview of one collection-bound Layout: uses the
// collection's first item if one exists, otherwise labeled placeholders —
// never a blank/broken-looking canvas. Returns just that layout's elements
// (not a full page list), for direct use as Canvas's `elements` prop.
export const previewLayoutElements = (layout, collections) => {
  if (!layout || layout.kind === "static") return layout?.elements || [];
  const collection = layout.collection_id ? collections.find((c) => c.id === layout.collection_id) : null;
  const items = collection ? collection.items : [];
  const previewItem = items[0] || null;

  if (layout.kind === "collection_list") {
    return expandListElements(layout, collection, previewItem ? [previewItem] : [null], null);
  }
  return layout.elements.map((el) => ({ ...el, html: applyBindingsToHtml(el.html, previewItem, collection, null) }));
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `CI=true npx craco test --testPathPattern="expandTemplates" --watchAll=false`
Expected: PASS — 7 tests

- [ ] **Step 5: Commit**

```bash
git add src/lib/expandTemplates.js src/lib/expandTemplates.test.js
git commit -m "feat: add expandTemplatesToPages (collection-bound layouts -> static pages)"
```

---

## Task 2: Wire client export — nested-slug support + merge generated pages

**Files:**
- Modify: `src/lib/exportHtml.js`
- Test: `src/lib/exportHtml.test.js`

**Interfaces:**
- Consumes: `expandTemplatesToPages` (Task 1).
- Produces: `buildMultiPageExport(project)` now also exports collection-bound Layouts. No signature change — `project.layouts`/`project.collections` are just read if present (default `[]`), so every existing caller/test with no such fields behaves identically.

- [ ] **Step 1: Write the failing tests**

```js
// Add to src/lib/exportHtml.test.js (existing file — see its current
// imports/setup; these tests follow the same buildMultiPageExport pattern
// already used there).
import { buildMultiPageExport } from "./exportHtml"; // already imported in this file today; shown for clarity

test("safePageFilename preserves one level of nested slug as a real subdirectory", () => {
  const project = {
    name: "Site", elements: [], fonts: [],
    layouts: [{
      id: "lay_1", name: "Single Post", kind: "collection_detail", collection_id: "coll_1",
      slug: "single-post", slug_pattern: "blog/{slug}",
      elements: [{ id: "e", html: "<h1 data-forge-bind=\"title\">t</h1>" }],
      head_html: "", canvas_bg: "#fff", fonts: [], custom_js: "", seo: {},
    }],
    collections: [{
      id: "coll_1", name: "Blog Posts", base_type: "blog_post",
      fields: [{ key: "title", label: "Title", type: "text" }],
      items: [{ id: "item_1", slug: "hello-world", values: { title: "Hello World" } }],
    }],
  };
  const { files } = buildMultiPageExport(project);
  expect(files["blog/hello-world.html"]).toBeDefined();
  expect(files["blog/hello-world.html"]).toContain("Hello World");
});

test("buildMultiPageExport with no templates/layouts/collections behaves exactly as before (regression guard)", () => {
  const project = { name: "Site", elements: [{ id: "e", html: "<p>hi</p>" }], fonts: [] };
  const { files } = buildMultiPageExport(project);
  expect(files["index.html"]).toContain("hi");
  expect(Object.keys(files)).not.toEqual(expect.arrayContaining([expect.stringMatching(/^blog\//)]));
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `CI=true npx craco test --testPathPattern="exportHtml" --watchAll=false`
Expected: FAIL — no file at `files["blog/hello-world.html"]` (slug gets flattened to `blog-hello-world.html` by the current `safePageFilename`, and generated pages aren't merged in at all yet)

- [ ] **Step 3: Write the implementation**

In `src/lib/exportHtml.js`, add the import alongside the existing local imports at the top of the file:

```js
import { expandTemplatesToPages } from "./expandTemplates.js";
```

Replace `safePageFilename` (currently a single-segment sanitizer) with a version that preserves exactly one `/`:

```js
// Sanitizes a page slug into a safe filename and de-dupes against
// siblings. Preserves exactly one level of "/" as a real subdirectory
// (needed for collection-bound layouts' default slug_pattern, e.g.
// "blog/{slug}") — each segment is sanitized independently; the numeric
// collision suffix is appended to the base segment only, so
// "blog/hello-world" colliding becomes "blog/hello-world-2", not a
// dir-level collision. Slugs are otherwise auto-generated, never
// user-typed raw file paths, but this becomes a real filename on someone's
// FTP server or inside a zip, so it's re-validated here regardless.
const sanitizeSegment = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
const safePageFilename = (slug, index, used) => {
  const raw = String(slug || "");
  const lastSlash = raw.lastIndexOf("/");
  const dir = lastSlash >= 0 ? sanitizeSegment(raw.slice(0, lastSlash)) : "";
  let base = sanitizeSegment(lastSlash >= 0 ? raw.slice(lastSlash + 1) : raw);
  if (!base) base = index === 0 ? "index" : `page-${index + 1}`;
  const make = (b) => (dir ? `${dir}/${b}.html` : `${b}.html`);
  let name = make(base);
  let n = 2;
  while (used.has(name)) { name = make(`${base}-${n}`); n++; }
  used.add(name);
  return name;
};
```

In `buildMultiPageExport`, merge generated pages in immediately after the existing fallback-page logic (the line reading `const pages = (project.pages && project.pages.length) ? project.pages : [{...}];`):

```js
  const pages = [
    ...((project.pages && project.pages.length) ? project.pages : [{
      id: project.id, name: project.name, slug: "index", seo: project.seo,
      elements: project.elements, head_html: project.head_html, canvas_bg: project.canvas_bg,
      fonts: project.fonts, custom_js: project.custom_js,
    }]),
    ...expandTemplatesToPages(project),
  ];
```

(Leave everything else in the function — the `pages.forEach(...)` loop, `buildOrganizedStylesheet` call, folder scaffolding — untouched; it already iterates whatever `pages` contains.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `CI=true npx craco test --testPathPattern="exportHtml" --watchAll=false`
Expected: PASS — all prior `exportHtml.test.js` tests plus these 2

- [ ] **Step 5: Run the full frontend suite to check for regressions**

Run: `CI=true npx craco test --watchAll=false`
Expected: PASS — no change to any prior test's result

- [ ] **Step 6: Commit**

```bash
git add src/lib/exportHtml.js src/lib/exportHtml.test.js
git commit -m "feat: export collection-bound layouts as real static pages (client ZIP)"
```

---

## Task 3: Backend mirror — `_expand_templates_to_pages` (BeautifulSoup) + nested-slug support

**Files:**
- Modify: `backend/requirements.txt`
- Modify: `backend/server.py`
- Test: `backend/tests/backend_test.py`

**Interfaces:**
- Consumes: nothing new from other tasks (backend-only; mirrors Task 1's JS logic).
- Produces: `_expand_templates_to_pages(doc: dict) -> list[dict]`, wired into `_build_multi_page_bundle` exactly like Task 2 wired `expandTemplatesToPages` into `buildMultiPageExport`.

- [ ] **Step 1: Add the new dependency**

Modify `backend/requirements.txt` — add, alphabetically near the other third-party deps:

```
beautifulsoup4==4.12.3
```

Run: `cd backend && pip install -r requirements.txt` to install it locally before continuing.

- [ ] **Step 2: Write the failing tests**

```python
# Add to backend/tests/backend_test.py, as methods on the
# TestTemplateLayoutCollectionsPersistence class Part 2a's Task 2 added
# (same file, same fixtures already in scope).

class TestExpandTemplatesToPages:
    def test_collection_detail_expands_to_one_page_per_item_with_nested_slug(self):
        from server import _expand_templates_to_pages
        doc = {
            "layouts": [{
                "id": "lay_1", "name": "Single Post", "kind": "collection_detail", "collection_id": "coll_1",
                "slug": "single-post", "slug_pattern": "blog/{slug}",
                "elements": [{"id": "e", "html": '<h1 data-forge-bind="title">t</h1>'}],
                "head_html": "", "canvas_bg": "#fff", "fonts": [], "custom_js": "", "seo": {},
            }],
            "collections": [{
                "id": "coll_1", "name": "Blog Posts", "base_type": "blog_post",
                "fields": [{"key": "title", "label": "Title", "type": "text"}],
                "items": [{"id": "item_1", "slug": "hello-world", "values": {"title": "Hello World"}}],
            }],
        }
        pages = _expand_templates_to_pages(doc)
        assert len(pages) == 1
        assert pages[0]["slug"] == "blog/hello-world"
        assert "Hello World" in pages[0]["elements"][0]["html"]

    def test_collection_list_clones_card_once_per_item_and_links_to_detail_page(self):
        from server import _expand_templates_to_pages
        doc = {
            "layouts": [
                {
                    "id": "lay_list", "name": "Archive", "kind": "collection_list", "collection_id": "coll_1",
                    "slug": "blog",
                    "elements": [{
                        "id": "el_card",
                        "html": '<div data-forge-collection-list="coll_1"><h3 data-forge-bind="title">T</h3>'
                                '<a data-forge-bind-href="item" href="#">More</a></div>',
                    }],
                    "head_html": "", "canvas_bg": "#fff", "fonts": [], "custom_js": "", "seo": {},
                },
                {
                    "id": "lay_detail", "name": "Single Post", "kind": "collection_detail", "collection_id": "coll_1",
                    "slug": "single-post", "slug_pattern": "blog/{slug}",
                    "elements": [{"id": "e", "html": '<h1 data-forge-bind="title">t</h1>'}],
                    "head_html": "", "canvas_bg": "#fff", "fonts": [], "custom_js": "", "seo": {},
                },
            ],
            "collections": [{
                "id": "coll_1", "name": "Blog Posts", "base_type": "blog_post",
                "fields": [{"key": "title", "label": "Title", "type": "text"}],
                "items": [{"id": "item_1", "slug": "hello-world", "values": {"title": "Hello World"}}],
            }],
        }
        pages = _expand_templates_to_pages(doc)
        archive = next(p for p in pages if p["slug"] == "blog")
        assert len(archive["elements"]) == 1
        assert "Hello World" in archive["elements"][0]["html"]
        assert 'href="blog/hello-world.html"' in archive["elements"][0]["html"]

    def test_empty_collection_produces_no_cards_and_no_detail_pages(self):
        from server import _expand_templates_to_pages
        doc = {
            "layouts": [{
                "id": "lay_1", "name": "Single Post", "kind": "collection_detail", "collection_id": "coll_1",
                "slug": "single-post", "slug_pattern": "blog/{slug}",
                "elements": [{"id": "e", "html": '<h1 data-forge-bind="title">t</h1>'}],
                "head_html": "", "canvas_bg": "#fff", "fonts": [], "custom_js": "", "seo": {},
            }],
            "collections": [{"id": "coll_1", "name": "Blog Posts", "base_type": "blog_post", "fields": [], "items": []}],
        }
        assert _expand_templates_to_pages(doc) == []

    def test_publish_bundle_includes_nested_generated_page(self, client, created_ids):
        # End-to-end: create a project with a collection-bound layout via the
        # API (same payload shape as
        # TestTemplateLayoutCollectionsPersistence.test_round_trips_templates_layouts_collections),
        # then verify _build_multi_page_bundle produces the nested file.
        from server import _build_multi_page_bundle
        payload = {
            "name": "TEST_it2_cms_export_proj", "elements": [],
            "collections": [{
                "id": "coll_1", "name": "Blog Posts", "base_type": "blog_post",
                "fields": [{"key": "title", "label": "Title", "type": "text"}],
                "items": [{"id": "item_1", "slug": "hello-world", "values": {"title": "Hello World"}}],
            }],
            "layouts": [{
                "id": "lay_1", "name": "Single Post", "kind": "collection_detail", "collection_id": "coll_1",
                "slug": "single-post", "slug_pattern": "blog/{slug}",
                "elements": [{"id": "e", "html": '<h1 data-forge-bind="title">t</h1>'}],
            }],
        }
        r = client.post(f"{API}/projects", json=payload)
        d = r.json()
        created_ids.append(d["id"])
        files = _build_multi_page_bundle(d)
        assert "blog/hello-world.html" in files
        assert "Hello World" in files["blog/hello-world.html"]
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd backend && python -m pytest tests/backend_test.py -k "ExpandTemplatesToPages" -v`
Expected: FAIL — `ImportError: cannot import name '_expand_templates_to_pages'`

- [ ] **Step 4: Write the implementation**

In `backend/server.py`, add near the top with the other imports:

```python
from bs4 import BeautifulSoup
```

Add, immediately after `_safe_page_filename` (which Step 5 below also modifies) and before `_extract_forge_css`:

```python
def _find_field(collection: dict, key: str):
    return next((f for f in (collection or {}).get("fields") or [] if f.get("key") == key), None)


def _bind_placeholder(field: dict) -> str:
    if field.get("type") in ("image", "date"):
        return ""
    return f"Sample {field.get('label', field.get('key'))}"


def _apply_bindings_to_html(html: str, item: Optional[dict], collection: Optional[dict], detail_url: Optional[str]) -> str:
    """Substitutes every data-forge-bind element's text/src with the given
    item's field value (placeholder text when item is None), and points
    every data-forge-bind-href="item" element's href at detail_url when
    given. Mirrors frontend/src/lib/expandTemplates.js's
    applyBindingsToHtml — keep both in sync."""
    soup = BeautifulSoup(html or "", "html.parser")
    for el in soup.select("[data-forge-bind]"):
        key = el.get("data-forge-bind")
        field = _find_field(collection, key)
        value = (item.get("values", {}).get(key, "") if item else (_bind_placeholder(field) if field else ""))
        if field and field.get("type") == "image":
            if el.name == "img":
                el["src"] = value
            elif value:
                existing_style = el.get("style", "")
                el["style"] = f"{existing_style};background-image:url({value})".lstrip(";")
        elif field and field.get("type") == "date":
            el.string = value if value else ("" if item else "Sample Date")
        else:
            el.string = str(value or "")
    if detail_url:
        for el in soup.select('[data-forge-bind-href="item"]'):
            el["href"] = detail_url
    return "".join(str(c) for c in soup.contents)


def _detail_url_for(detail_layout: Optional[dict], item: Optional[dict]) -> Optional[str]:
    if not detail_layout or not item:
        return None
    pattern = detail_layout.get("slug_pattern") or f"{detail_layout.get('slug')}/{{slug}}"
    return f"{pattern.replace('{slug}', item['slug'])}.html"


def _find_detail_layout(layouts: list, collection_id: str) -> Optional[dict]:
    return next((l for l in layouts if l.get("kind") == "collection_detail" and l.get("collection_id") == collection_id), None)


def _find_card_template(elements: list, collection_id: str):
    marker = f'data-forge-collection-list="{collection_id}"'
    return next((el for el in elements if marker in (el.get("html") or "")), None)


def _page_fields_from_layout(layout: dict) -> dict:
    return {
        "id": layout.get("id"), "name": layout.get("name"), "slug": layout.get("slug"), "seo": layout.get("seo"),
        "head_html": layout.get("head_html"), "canvas_bg": layout.get("canvas_bg"),
        "fonts": layout.get("fonts"), "custom_js": layout.get("custom_js"),
    }


def _expand_list_elements(layout: dict, collection: Optional[dict], items: list, detail_layout: Optional[dict]) -> list:
    card_template = _find_card_template(layout.get("elements") or [], layout.get("collection_id"))
    out = []
    for el in (layout.get("elements") or []):
        if el is not card_template:
            out.append(el)
            continue
        for item in items:
            out.append({
                "id": f"{layout['id']}__card__{item['id']}",
                "html": _apply_bindings_to_html(card_template.get("html"), item, collection, _detail_url_for(detail_layout, item)),
            })
    return out


def _expand_templates_to_pages(doc: dict) -> list:
    """Turns collection-bound Layouts into plain page dicts matching the
    exact shape doc["pages"] entries already have, so _build_multi_page_bundle
    doesn't need to change at all — only its input pages list grows. Mirrors
    frontend/src/lib/expandTemplates.js's expandTemplatesToPages — keep both
    in sync."""
    layouts = doc.get("layouts") or []
    collections = doc.get("collections") or []
    coll_by_id = {c["id"]: c for c in collections}
    pages = []

    for layout in layouts:
        if layout.get("kind") == "static":
            continue
        collection = coll_by_id.get(layout.get("collection_id")) if layout.get("collection_id") else None
        items = collection.get("items", []) if collection else []

        if layout.get("kind") == "collection_list":
            detail_layout = _find_detail_layout(layouts, layout.get("collection_id"))
            pages.append({**_page_fields_from_layout(layout), "elements": _expand_list_elements(layout, collection, items, detail_layout)})
        elif layout.get("kind") == "collection_detail":
            for item in items:
                pattern = layout.get("slug_pattern") or f"{layout.get('slug')}/{{slug}}"
                pages.append({
                    **_page_fields_from_layout(layout),
                    "id": f"{layout['id']}__{item['id']}",
                    "name": item.get("values", {}).get("title") or item.get("slug"),
                    "slug": pattern.replace("{slug}", item["slug"]),
                    "elements": [{**el, "html": _apply_bindings_to_html(el.get("html"), item, collection, None)} for el in (layout.get("elements") or [])],
                })
    return pages
```

- [ ] **Step 5: Extend `_safe_page_filename` for one level of nesting, and wire the expansion into `_build_multi_page_bundle`**

Replace `_safe_page_filename` (mirrors Task 2's JS change exactly):

```python
def _sanitize_segment(s: str) -> str:
    return re.sub(r"^-+|-+$", "", re.sub(r"[^a-z0-9-]+", "-", (s or "").lower()))


def _safe_page_filename(slug: str, index: int, used: set) -> str:
    """Sanitizes a page slug into a safe filename and de-dupes against
    siblings. Preserves exactly one level of "/" as a real subdirectory
    (needed for collection-bound layouts' default slug_pattern, e.g.
    "blog/{slug}") — each segment sanitized independently; the numeric
    collision suffix is appended to the base segment only. Mirrors
    frontend/src/lib/exportHtml.js's safePageFilename."""
    raw = slug or ""
    last_slash = raw.rfind("/")
    directory = _sanitize_segment(raw[:last_slash]) if last_slash >= 0 else ""
    base = _sanitize_segment(raw[last_slash + 1:] if last_slash >= 0 else raw)
    if not base:
        base = "index" if index == 0 else f"page-{index + 1}"

    def make(b):
        return f"{directory}/{b}.html" if directory else f"{b}.html"

    name = make(base)
    n = 2
    while name in used:
        name = make(f"{base}-{n}")
        n += 1
    used.add(name)
    return name
```

In `_build_multi_page_bundle`, change the `pages = doc.get("pages") or [...]` assignment to also append generated pages:

```python
    pages = (doc.get("pages") or [{
        "id": doc.get("id"), "name": doc.get("name"), "slug": "index", "seo": doc.get("seo"),
        "elements": doc.get("elements"), "head_html": doc.get("head_html"), "canvas_bg": doc.get("canvas_bg"),
        "fonts": doc.get("fonts"), "custom_js": doc.get("custom_js"),
    }]) + _expand_templates_to_pages(doc)
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd backend && python -m pytest tests/backend_test.py -k "ExpandTemplatesToPages" -v`
Expected: PASS — 4 tests

- [ ] **Step 7: Run the full backend suite to check for regressions**

Run: `cd backend && python -m pytest tests/backend_test.py -v`
Expected: PASS — no change to any prior test's result

- [ ] **Step 8: Commit**

```bash
git add backend/requirements.txt backend/server.py backend/tests/backend_test.py
git commit -m "feat: export collection-bound layouts as real static pages (backend Publish)"
```

---

## Task 4: Design-canvas live preview of a collection-bound Layout

**Files:**
- Modify: `src/components/builder/Canvas.jsx`
- Modify: `src/pages/Builder.jsx`

**Interfaces:**
- Consumes: `previewLayoutElements` (Task 1), `activeLayout`/`activeLayoutCollection`/`collections` (Part 2b Task 1, Part 2a Task 3).
- Produces: nothing for later tasks — this is the last task in the phase, verified manually.

No unit test for this task: `Canvas.jsx` has no existing test file (same precedent as Part 2b Task 6/7 for the same file) — verified manually in Step 3, and the underlying logic it calls (`previewLayoutElements`) is already fully covered by Task 1's tests.

- [ ] **Step 1: Compute preview elements in Builder.jsx and pass them to Canvas**

Modify `src/pages/Builder.jsx` — add the import alongside the existing `import { scanHtml, inlineLocalStylesheets } from "@/lib/importHtml";`:

```js
import { previewLayoutElements } from "@/lib/expandTemplates";
```

Add a memo immediately after Part 2b Task 1's `activeLayoutCollection` memo:

```js
  // While editing a collection-bound Layout, the canvas shows real content
  // from the collection's first item (or labeled placeholders if it's
  // empty) instead of the raw data-forge-bind markers — same expansion
  // logic export uses, so what you see while editing matches what
  // publishing actually produces.
  const canvasElements = useMemo(
    () => (activeLayout && activeLayout.kind !== "static" ? previewLayoutElements(activeLayout, collections) : elements),
    [activeLayout, collections, elements]
  );
```

- [ ] **Step 2: Pass `canvasElements` to `<Canvas>` instead of the raw editing buffer**

Modify `src/pages/Builder.jsx` — on the existing `<Canvas ... elements={elements} ... />` element, change the `elements` prop to `elements={canvasElements}`. Leave every other prop (`onDrop`, `onSelect`, `headHtml`, etc.) unchanged — this only swaps what's rendered, not the underlying editing state (`onDrop`/`onEditHtml`/etc. still mutate the real `elements` buffer via Part 2b Task 1's `activeLayoutId`-gated sync effect; the raw repeat-unit card with its `data-forge-bind` markers is still what's actually stored and edited, this prop only swaps what's *rendered*).

Note for the implementer: this means clicking/selecting a rendered card in `collection_list` preview mode selects the *expanded preview clone*, not the original repeat-unit element — editing tools (Bind panel, style panel) that need the original element's `id` won't resolve correctly against a `collection_list` layout's expanded cards. This is a known, explicitly out-of-scope limitation for this plan: binding a `collection_list` card's fields (via the Bind panel and the "Repeat this for each item" context-menu action from Part 2b Task 6) must be done by selecting the *unexpanded* card before it's cloned — which is already how Part 2b's flow works, since marking/binding happens on the single authored card, not on generated previews. Flag this to the user rather than silently building selection-remapping logic that isn't in the spec.

- [ ] **Step 3: Manually verify in the browser**

Run the dev server. Create a Collection with 1-2 items (Data tab), create a `collection_detail` Layout bound to it with a bound `<h1>`, switch to editing that Layout, confirm the canvas shows the real item's title instead of raw placeholder markup. Delete the item so the collection is empty, confirm the canvas now shows "Sample Title" instead of blank. Repeat for a `collection_list` Layout with a marked repeat-unit card: confirm the canvas shows one cloned card per item.

Run: `CI=true npx craco test --watchAll=false`
Expected: PASS — same count as after Task 3 (this task adds no new test file)

- [ ] **Step 4: Commit**

```bash
git add src/components/builder/Canvas.jsx src/pages/Builder.jsx
git commit -m "feat: preview collection-bound layouts with real/placeholder data in the Design canvas"
```

---

## Self-Review

**Spec coverage:**
- "Export (Static Site Generation)" — `collection_list`/`collection_detail` expansion, empty-collection edge case, shared expansion function reused by canvas preview → Tasks 1, 2, 3, 4.
- The spec's `slug_pattern: "blog/{slug}"` default example → required extending `safePageFilename`/`_safe_page_filename` (flagged as a spec-vs-current-code deviation in Global Constraints, not silently absorbed) → Tasks 2, 3.
- "Navigation" section's "editing a `collection_detail` Layout there opens it in 'editing the shared design' mode (item #1's data, or placeholders if empty)" → Task 4.
- Import → Template Detection (Phase 5) is explicitly not in this plan.

**Placeholder scan:** none — every step has complete, real code. The one deliberately deferred edge case (selecting an individual expanded card inside `collection_list` preview mode) is explicitly flagged in Task 4 Step 2, not silently dropped, and doesn't block any spec requirement (binding still works correctly on the unexpanded authored card, which is the actual authoring surface per Part 2b).

**Type consistency:** `Page = { id, name, slug, seo, head_html, canvas_bg, fonts, custom_js, elements }` (Task 1's `expandTemplatesToPages` return shape) matches `project.pages[]`'s existing entry shape exactly, confirmed against both `buildMultiPageExport`'s fallback-page literal (Task 2) and `_build_multi_page_bundle`'s (Task 3) — same field names, same nesting. `_apply_bindings_to_html`/`applyBindingsToHtml` and `_expand_templates_to_pages`/`expandTemplatesToPages` are named as a deliberate JS/Python pair, matching the codebase's existing `extractForgeCss`/`_extract_forge_css` naming convention (confirmed against `backend/server.py:1406` and `src/lib/exportHtml.js`'s existing extractForgeCss).

**Scope-check decision:** kept as one plan rather than splitting client/backend/preview into separate documents (unlike Part 2's 2a/2b split) — total surface is 4 tasks touching 2 new files, 2 existing files with single well-scoped edits each, and one existing test file per side; this is comparable in size to Part 2a alone (5 tasks) and each task has a single clear reviewable deliverable, so a split would add document-juggling overhead without a real benefit.

## Execution

Plan complete and saved to `docs/superpowers/plans/2026-08-24-export-ssg-plan.md`.
