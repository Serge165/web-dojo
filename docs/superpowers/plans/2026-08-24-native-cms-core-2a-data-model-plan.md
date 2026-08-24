# Native CMS Core — Part 2a: Data Model, Persistence & Collection Data Panel

> **RETIRED — do not execute.** The generic Template/Layout/Collection design this plan implements was shelved in favor of finishing the already-real "Zenero" content stack (`backend/models/zenero.py` + `ZeneroDashboardPanel.jsx`). See `docs/superpowers/specs/2026-08-24-cms-template-layout-collections-design.md`'s Status section. Kept for reference only.


> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the `collections`/`layouts`/`templates` data model to a Web Dojo project, persist it end-to-end (frontend state → backend → database → back), and ship a working "Collection data" authoring panel so a user can create a Collection (Blog Post/Portfolio Project/Custom), add items, and edit their field values — with zero effect on any existing project (purely additive).

**Architecture:** Three new arrays (`project.collections`, `project.layouts`, `project.templates`) sit alongside the existing `project.pages` array, following the exact same "loose `List[Any]`, `extra=\"ignore\"`" persistence pattern the backend already uses for `pages`/`template`. A new pure-logic module (`src/lib/collections.js`) owns id/slug generation and the base-type default field sets, with zero DOM/React dependency so it's trivially unit-testable. A new `CollectionDataPanel` component (modeled directly on the existing `EcommerceOrdersPanel`/`FormBuilderModal` panel pattern) is the only new UI in this part — it's a pure data-management surface, not part of the visual canvas.

**Tech Stack:** React (existing Builder.jsx state model), FastAPI + Pydantic (existing `server.py` Project models), Jest + `@testing-library/react` (existing test conventions), pytest + `requests` (existing backend integration test conventions).

**Spec:** `docs/superpowers/specs/2026-08-24-cms-template-layout-collections-design.md`

## Global Constraints

- `project.pages[]` must never be modified by this work — it stays exactly as it is today (spec: "Data Model," "additive only").
- Field types are exactly six: `text`, `richtext`, `image`, `date`, `number`, `toggle` (spec: "Terminology"). No others, no relations/references (spec: "Explicitly Out of Scope").
- `blog_post` fields: `title(text), date(date), author(text), excerpt(richtext), body(richtext), cover_image(image), tags(text)`. `portfolio_project` fields: `title(text), category(text), cover_image(image), description(richtext), client(text), date(date)`. Exact keys, exact order (spec: "Data Model").
- Slug generation and collision handling must follow the existing convention already used elsewhere in this codebase: lowercase, non-alphanumeric runs collapsed to a single `-`, leading/trailing `-` trimmed (`Builder.jsx`'s `addPageFromLayout`/`generatePagesFromOutline`), and collisions get a numeric `-2`, `-3`, ... suffix (`exportHtml.js`'s `safePageFilename`).
- Follow the existing dark-theme Tailwind class conventions exactly (`bg-[#15130E]`, `border-[#332D22]`, `text-[#F1EDE2]`, `text-[#A79C87]`, `text-[#948C79]`, accent `#C9A227`/`#AD8B21`) and add a `data-testid` to every interactive element, matching every existing panel in `src/components/builder/`.

---

## Task 1: `src/lib/collections.js` — pure data-model helpers

**Files:**
- Create: `src/lib/collections.js`
- Test: `src/lib/collections.test.js`

**Interfaces:**
- Produces: `uid(prefix: string): string`, `slugify(name: string): string`, `uniqueSlug(candidate: string, existingSlugs: Set<string>): string`, `BASE_TYPE_FIELDS: { blog_post: Field[], portfolio_project: Field[], custom: [] }` where `Field = { key: string, label: string, type: "text"|"richtext"|"image"|"date"|"number"|"toggle" }`, `FIELD_TYPES: string[]`, `createCollection(name: string, baseType?: string): Collection`, `createCollectionItem(collection: Collection, title?: string): Item`, `createLayout(name: string, kind?: "static"|"collection_list"|"collection_detail", opts?: { templateId?, collectionId?, slug?, slugPattern? }): Layout`, `createTemplate(name: string, opts?: { collectionId?, layoutIds? }): Template`. These exact names/shapes are consumed by Task 5 (`CollectionDataPanel`) and by Part 2b's Bind panel and Layout/Template CRUD tasks.

- [ ] **Step 1: Write the failing tests**

```js
// src/lib/collections.test.js
import {
  slugify, uniqueSlug, createCollection, createCollectionItem, createLayout, createTemplate,
} from "./collections";

test("slugify lowercases and dashes non-alphanumeric runs, trimming leading/trailing dashes", () => {
  expect(slugify("My First Post!")).toBe("my-first-post");
});

test("uniqueSlug returns the plain slug when it doesn't collide", () => {
  expect(uniqueSlug("Hello World", new Set())).toBe("hello-world");
});

test("uniqueSlug appends a numeric suffix on collision, skipping already-taken suffixes", () => {
  const existing = new Set(["hello-world", "hello-world-2"]);
  expect(uniqueSlug("Hello World", existing)).toBe("hello-world-3");
});

test("createCollection seeds the blog_post base type's default fields in order", () => {
  const coll = createCollection("Blog Posts", "blog_post");
  expect(coll.fields.map((f) => f.key)).toEqual(["title", "date", "author", "excerpt", "body", "cover_image", "tags"]);
  expect(coll.items).toEqual([]);
});

test("createCollection seeds the portfolio_project base type's default fields in order", () => {
  const coll = createCollection("Projects", "portfolio_project");
  expect(coll.fields.map((f) => f.key)).toEqual(["title", "category", "cover_image", "description", "client", "date"]);
});

test("createCollection with base_type 'custom' starts with no fields", () => {
  expect(createCollection("Whatever", "custom").fields).toEqual([]);
});

test("createCollectionItem fills a blank value per field and a unique slug from the title", () => {
  const coll = createCollection("Blog Posts", "blog_post");
  const item = createCollectionItem(coll, "My First Post");
  expect(item.slug).toBe("my-first-post");
  expect(item.values.title).toBe("My First Post");
  expect(item.values.date).toBe("");
  expect(item.values).toHaveProperty("cover_image", "");
});

test("createCollectionItem de-dupes slugs against existing items in the same collection", () => {
  const coll = createCollection("Blog Posts", "blog_post");
  coll.items.push(createCollectionItem(coll, "My First Post"));
  const second = createCollectionItem(coll, "My First Post");
  expect(second.slug).toBe("my-first-post-2");
});

test("createLayout defaults to kind 'static' with no collection binding", () => {
  const layout = createLayout("Home");
  expect(layout.kind).toBe("static");
  expect(layout.collection_id).toBeNull();
  expect(layout.slug).toBe("home");
});

test("createLayout for kind 'collection_detail' gets a slug_pattern derived from its name", () => {
  const layout = createLayout("Single Post", "collection_detail", { collectionId: "coll_1" });
  expect(layout.slug_pattern).toBe("single-post/{slug}");
});

test("createTemplate starts with an empty layout list and no collection unless given one", () => {
  const tpl = createTemplate("Blog");
  expect(tpl.layout_ids).toEqual([]);
  expect(tpl.collection_id).toBeNull();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `CI=true npx craco test --testPathPattern="lib/collections" --watchAll=false`
Expected: FAIL — `Cannot find module './collections'`

- [ ] **Step 3: Write the implementation**

```js
// src/lib/collections.js
// Pure helpers for the Template/Layout/Collection data model — no React,
// no DOM. See docs/superpowers/specs/2026-08-24-cms-template-layout-collections-design.md

export const uid = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

// Mirrors the slug pattern Builder.jsx's addPageFromLayout/generatePagesFromOutline
// already use for page slugs, so Layout/Collection-item slugs read the same way.
export const slugify = (name) =>
  String(name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// Same numeric-suffix-on-collision convention exportHtml.js's safePageFilename uses.
export const uniqueSlug = (candidate, existingSlugs) => {
  const base = slugify(candidate) || "item";
  if (!existingSlugs.has(base)) return base;
  let n = 2;
  while (existingSlugs.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
};

export const BASE_TYPE_FIELDS = {
  blog_post: [
    { key: "title", label: "Title", type: "text" },
    { key: "date", label: "Date", type: "date" },
    { key: "author", label: "Author", type: "text" },
    { key: "excerpt", label: "Excerpt", type: "richtext" },
    { key: "body", label: "Body", type: "richtext" },
    { key: "cover_image", label: "Cover Image", type: "image" },
    { key: "tags", label: "Tags", type: "text" },
  ],
  portfolio_project: [
    { key: "title", label: "Title", type: "text" },
    { key: "category", label: "Category", type: "text" },
    { key: "cover_image", label: "Cover Image", type: "image" },
    { key: "description", label: "Description", type: "richtext" },
    { key: "client", label: "Client", type: "text" },
    { key: "date", label: "Date", type: "date" },
  ],
  custom: [],
};

export const FIELD_TYPES = ["text", "richtext", "image", "date", "number", "toggle"];

export const createCollection = (name, baseType = "custom") => ({
  id: uid("coll"),
  name,
  base_type: baseType,
  fields: (BASE_TYPE_FIELDS[baseType] || []).map((f) => ({ ...f })),
  items: [],
});

const blankValue = (type) => (type === "toggle" ? false : type === "number" ? 0 : "");

export const createCollectionItem = (collection, title = "Untitled") => {
  const existingSlugs = new Set((collection.items || []).map((it) => it.slug));
  const values = {};
  (collection.fields || []).forEach((f) => { values[f.key] = blankValue(f.type); });
  if ("title" in values) values.title = title;
  return { id: uid("item"), slug: uniqueSlug(title, existingSlugs), values };
};

export const createLayout = (name, kind = "static", opts = {}) => ({
  id: uid("lay"),
  name,
  template_id: opts.templateId ?? null,
  kind, // "static" | "collection_list" | "collection_detail"
  collection_id: opts.collectionId ?? null,
  elements: [],
  head_html: "",
  canvas_bg: "#ffffff",
  fonts: [],
  custom_js: "",
  seo: {},
  slug: opts.slug ?? slugify(name),
  slug_pattern: kind === "collection_detail" ? (opts.slugPattern ?? `${slugify(name)}/{slug}`) : undefined,
});

export const createTemplate = (name, opts = {}) => ({
  id: uid("tpl"),
  name,
  collection_id: opts.collectionId ?? null,
  layout_ids: opts.layoutIds ?? [],
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `CI=true npx craco test --testPathPattern="lib/collections" --watchAll=false`
Expected: PASS — 11 tests

- [ ] **Step 5: Commit**

```bash
git add src/lib/collections.js src/lib/collections.test.js
git commit -m "feat: add Template/Layout/Collection data-model helpers"
```

---

## Task 2: Backend persistence — `templates`/`layouts`/`collections` fields

**Files:**
- Modify: `backend/server.py:55-109` (the `Project`, `ProjectCreate`, `ProjectUpdate` Pydantic models)
- Test: `backend/tests/backend_test.py` (new class)

**Interfaces:**
- Consumes: nothing new — mirrors the existing `pages: List[Any]` field exactly.
- Produces: every `Project`/`ProjectCreate`/`ProjectUpdate` response/request now round-trips `templates`, `layouts`, `collections` as opaque JSON arrays, defaulting to `[]`. Task 3 relies on this to persist frontend state without any backend schema change.

Note for the implementer: there is an existing, unrelated `ProjectTemplate` Pydantic class (`server.py:152`, the starter-kit gallery snapshot) — do not confuse it with the new `templates` field on `Project`. They are unrelated concepts that happen to share the word "template"; no code changes needed to `ProjectTemplate` itself.

- [ ] **Step 1: Write the failing test**

```python
# backend/tests/backend_test.py — add as a new top-level class, anywhere
# after TestProjectsCRUD (uses the same module-scoped `client`/`created_ids`
# fixtures already defined at the top of this file).

class TestTemplateLayoutCollectionsPersistence:
    def test_round_trips_templates_layouts_collections(self, client, created_ids):
        payload = {
            "name": "TEST_it2_cms_proj",
            "elements": [],
            "collections": [{
                "id": "coll_1", "name": "Blog Posts", "base_type": "blog_post",
                "fields": [{"key": "title", "label": "Title", "type": "text"}],
                "items": [{"id": "item_1", "slug": "hello-world", "values": {"title": "Hello World"}}],
            }],
            "layouts": [{"id": "lay_1", "name": "Archive", "kind": "collection_list", "collection_id": "coll_1"}],
            "templates": [{"id": "tpl_1", "name": "Blog", "collection_id": "coll_1", "layout_ids": ["lay_1"]}],
        }
        r = client.post(f"{API}/projects", json=payload)
        assert r.status_code == 200
        d = r.json()
        created_ids.append(d["id"])
        assert d["collections"][0]["name"] == "Blog Posts"
        assert d["layouts"][0]["kind"] == "collection_list"
        assert d["templates"][0]["layout_ids"] == ["lay_1"]

        # verify it persisted, not just echoed
        g = client.get(f"{API}/projects/{d['id']}").json()
        assert g["collections"][0]["items"][0]["slug"] == "hello-world"
        assert g["layouts"][0]["name"] == "Archive"

    def test_new_project_defaults_to_empty_arrays(self, client, created_ids):
        r = client.post(f"{API}/projects", json={"name": "TEST_it2_cms_defaults", "elements": []})
        d = r.json()
        created_ids.append(d["id"])
        assert d["collections"] == []
        assert d["layouts"] == []
        assert d["templates"] == []
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && python -m pytest tests/backend_test.py -k TemplateLayoutCollections -v`
Expected: FAIL — `KeyError: 'collections'` (field not yet on the response model, so it's silently dropped by Pydantic's `extra="ignore"`)

- [ ] **Step 3: Write the implementation**

In `backend/server.py`, add three fields to each of the three models, immediately after their existing `template`/`analytics` fields:

```python
# In class Project (after line 74's `analytics: Optional[Any] = None`):
    templates: List[Any] = Field(default_factory=list)
    layouts: List[Any] = Field(default_factory=list)
    collections: List[Any] = Field(default_factory=list)
```

```python
# In class ProjectCreate (after line 94's `analytics: Optional[Any] = None`):
    templates: List[Any] = []
    layouts: List[Any] = []
    collections: List[Any] = []
```

```python
# In class ProjectUpdate (after line 109's `analytics: Optional[Any] = None`):
    templates: Optional[List[Any]] = None
    layouts: Optional[List[Any]] = None
    collections: Optional[List[Any]] = None
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && python -m pytest tests/backend_test.py -k TemplateLayoutCollections -v`
Expected: PASS — 2 tests

- [ ] **Step 5: Run the full backend suite to check for regressions**

Run: `cd backend && python -m pytest tests/backend_test.py -v`
Expected: PASS — no change to any prior test count/result

- [ ] **Step 6: Commit**

```bash
git add backend/server.py backend/tests/backend_test.py
git commit -m "feat: persist templates/layouts/collections on Project"
```

---

## Task 3: Wire `templates`/`layouts`/`collections` state into Builder.jsx

**Files:**
- Modify: `src/pages/Builder.jsx`

**Interfaces:**
- Consumes: nothing from Task 1 yet (this task is pure state plumbing; Task 5 is what actually calls `createCollection`/`createCollectionItem`).
- Produces: `collections` (state) and `setCollections` (setter) available to pass into `<LeftSidebar>` (Task 6). `templates`/`layouts` state exists and round-trips through save/load but has no UI consumer until Part 2b.

No unit test for this task: `Builder.jsx` has no existing test file (none of `elements`/`pages`/`template` state wiring is unit-tested today either — it's exercised via the backend round-trip test above and this plan's final manual verification step). This matches existing practice in this codebase.

- [ ] **Step 1: Add the three new state variables**

Modify `src/pages/Builder.jsx` — immediately after the existing `const [files, setFiles] = useState([]);` (around line 127):

```js
  const [files, setFiles] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [layouts, setLayouts] = useState([]);
  const [collections, setCollections] = useState([]);
```

- [ ] **Step 2: Include them in the autosave watcher**

Modify the `saveWatch` memo (around line 208-211):

```js
  const saveWatch = useMemo(
    () => ({ elements, canvasBg, headHtml, fonts, files, customJs, projectName, pages, template, analytics, templates, layouts, collections }),
    [elements, canvasBg, headHtml, fonts, files, customJs, projectName, pages, template, analytics, templates, layouts, collections]
  );
```

- [ ] **Step 3: Include them in the saved `project` object**

Modify the `project` object literal (around line 255-262) — add the three fields alongside the existing `pages, active_page_id: activePageId, template, analytics,` line:

```js
    pages, active_page_id: activePageId, template, analytics,
    templates, layouts, collections,
  };
```

- [ ] **Step 4: Restore them when loading a saved project**

Modify `loadProject` — immediately after `setTemplate(p.template || { header_html: "", footer_html: "", use_template: false });` (around line 796):

```js
      setTemplate(p.template || { header_html: "", footer_html: "", use_template: false });
      setTemplates(p.templates || []);
      setLayouts(p.layouts || []);
      setCollections(p.collections || []);
      setAnalytics(p.analytics || {});
```

- [ ] **Step 5: Restore them when starting a new project from a starter template**

Modify `loadFromTemplate` — immediately after `setTemplate(data.template || { header_html: "", footer_html: "", use_template: false });` (around line 822):

```js
    setTemplate(data.template || { header_html: "", footer_html: "", use_template: false });
    setTemplates(data.templates || []);
    setLayouts(data.layouts || []);
    setCollections(data.collections || []);
    setAnalytics(data.analytics || {});
```

Deliberately NOT touched: `onLoadProjectData` (the `.webdojo.json` file-import path, around line 701) does not restore `template` either today — this task keeps that existing (pre-existing, out-of-scope) gap consistent rather than fixing it as a drive-by. `FindReplaceModal` and `AssetsLibrary`'s bulk-mutation callbacks (around lines 1267-1301) are also left untouched — extending find/replace and asset-reference-rewriting to reach into `layouts[]`/`collections[].items[].values` is not in the spec and is explicitly deferred.

- [ ] **Step 6: Manually verify no regression**

Run: `CI=true npx craco test --watchAll=false` — full suite should still be 100% green (this task adds no new tests, so the count should be unchanged from before this task).

- [ ] **Step 7: Commit**

```bash
git add src/pages/Builder.jsx
git commit -m "feat: wire templates/layouts/collections state through Builder save/load"
```

---

## Task 4: `CollectionDataPanel` component

**Files:**
- Create: `src/components/builder/CollectionDataPanel.jsx`
- Test: `src/components/builder/CollectionDataPanel.test.jsx`

**Interfaces:**
- Consumes: `createCollection`, `createCollectionItem`, `uniqueSlug` from `src/lib/collections.js` (Task 1).
- Produces: `export const CollectionDataPanel = ({ collections, onCollectionsChange })` — a controlled component; `onCollectionsChange(nextCollectionsArray)` is called with the full next array on every mutation (create/delete collection, add/delete item, edit a field value, rename a slug). Task 6 wires this directly to Builder.jsx's `collections`/`setCollections` from Task 3.

- [ ] **Step 1: Write the failing tests**

```jsx
// src/components/builder/CollectionDataPanel.test.jsx
import { render, screen, fireEvent } from "@testing-library/react";
import { CollectionDataPanel } from "./CollectionDataPanel";
import { createCollection } from "@/lib/collections";

test("shows an empty state and lets you create a new collection", () => {
  const onChange = jest.fn();
  render(<CollectionDataPanel collections={[]} onCollectionsChange={onChange} />);
  expect(screen.getByText(/create a collection/i)).toBeInTheDocument();

  fireEvent.click(screen.getByTestId("new-collection-btn"));
  fireEvent.change(screen.getByTestId("new-collection-name"), { target: { value: "Blog Posts" } });
  fireEvent.click(screen.getByTestId("create-collection-btn"));

  expect(onChange).toHaveBeenCalledTimes(1);
  const created = onChange.mock.calls[0][0][0];
  expect(created.name).toBe("Blog Posts");
  expect(created.fields.map((f) => f.key)).toContain("title");
});

test("adding an item appends a blank item", () => {
  const coll = createCollection("Blog Posts", "blog_post");
  const onChange = jest.fn();
  render(<CollectionDataPanel collections={[coll]} onCollectionsChange={onChange} />);

  fireEvent.click(screen.getByTestId("add-item-btn"));
  expect(onChange).toHaveBeenCalledTimes(1);
  const nextCollections = onChange.mock.calls[0][0];
  expect(nextCollections[0].items).toHaveLength(1);
});

test("editing a field value patches only that item's value", () => {
  const coll = createCollection("Blog Posts", "blog_post");
  coll.items = [{ id: "item_1", slug: "hello", values: { title: "Hello", date: "", author: "", excerpt: "", body: "", cover_image: "", tags: "" } }];
  const onChange = jest.fn();
  render(<CollectionDataPanel collections={[coll]} onCollectionsChange={onChange} />);

  fireEvent.click(screen.getByTestId("item-row-item_1"));
  fireEvent.change(screen.getByTestId("item-field-title"), { target: { value: "Updated Title" } });

  const nextCollections = onChange.mock.calls[onChange.mock.calls.length - 1][0];
  expect(nextCollections[0].items[0].values.title).toBe("Updated Title");
  expect(nextCollections[0].items[0].values.author).toBe("");
});

test("deleting a collection removes it", () => {
  const coll = createCollection("Blog Posts", "blog_post");
  const onChange = jest.fn();
  render(<CollectionDataPanel collections={[coll]} onCollectionsChange={onChange} />);
  fireEvent.click(screen.getByTestId("delete-collection-btn"));
  expect(onChange).toHaveBeenCalledWith([]);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `CI=true npx craco test --testPathPattern="CollectionDataPanel" --watchAll=false`
Expected: FAIL — `Cannot find module './CollectionDataPanel'`

- [ ] **Step 3: Write the implementation**

```jsx
// src/components/builder/CollectionDataPanel.jsx
import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createCollection, createCollectionItem, uniqueSlug } from "@/lib/collections";

const BASE_TYPE_OPTIONS = [
  { id: "blog_post", label: "Blog Post" },
  { id: "portfolio_project", label: "Portfolio Project" },
  { id: "custom", label: "Custom" },
];

const inputCls = "w-full bg-[#15130E] border border-[#332D22] rounded px-2 py-1.5 text-xs text-[#F1EDE2] outline-none focus:border-[#C9A227]";

const FieldInput = ({ field, value, onChange }) => {
  const testid = `item-field-${field.key}`;
  if (field.type === "richtext") {
    return <textarea rows={4} value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} data-testid={testid} />;
  }
  if (field.type === "date") {
    return <input type="date" value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} data-testid={testid} />;
  }
  if (field.type === "number") {
    return <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className={inputCls} data-testid={testid} />;
  }
  if (field.type === "toggle") {
    return <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} data-testid={testid} />;
  }
  // "text" and "image" — image is a plain path/URL string in v1 (spec: Explicitly Out of Scope)
  return <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={field.type === "image" ? "imgs/photo.jpg" : ""} className={inputCls} data-testid={testid} />;
};

export const CollectionDataPanel = ({ collections, onCollectionsChange }) => {
  const [selectedId, setSelectedId] = useState(collections[0]?.id || null);
  const [editingItemId, setEditingItemId] = useState(null);
  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newBaseType, setNewBaseType] = useState("blog_post");

  const collection = collections.find((c) => c.id === selectedId) || null;

  const patchCollection = (id, patch) =>
    onCollectionsChange(collections.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const addCollection = () => {
    if (!newName.trim()) return;
    const coll = createCollection(newName.trim(), newBaseType);
    onCollectionsChange([...collections, coll]);
    setSelectedId(coll.id);
    setNewName("");
    setNewOpen(false);
  };

  const removeCollection = (id) => {
    onCollectionsChange(collections.filter((c) => c.id !== id));
    if (selectedId === id) setSelectedId(collections.find((c) => c.id !== id)?.id || null);
  };

  const addItem = () => {
    if (!collection) return;
    const item = createCollectionItem(collection, "Untitled");
    patchCollection(collection.id, { items: [...collection.items, item] });
    setEditingItemId(item.id);
  };

  const removeItem = (itemId) => {
    if (!collection) return;
    patchCollection(collection.id, { items: collection.items.filter((it) => it.id !== itemId) });
    if (editingItemId === itemId) setEditingItemId(null);
  };

  const patchItemValue = (itemId, key, value) => {
    if (!collection) return;
    const items = collection.items.map((it) =>
      it.id === itemId ? { ...it, values: { ...it.values, [key]: value } } : it
    );
    patchCollection(collection.id, { items });
  };

  const renameItemSlug = (itemId, rawSlug) => {
    if (!collection) return;
    const existing = new Set(collection.items.filter((it) => it.id !== itemId).map((it) => it.slug));
    const slug = uniqueSlug(rawSlug, existing);
    patchCollection(collection.id, { items: collection.items.map((it) => (it.id === itemId ? { ...it, slug } : it)) });
  };

  const titleField = collection?.fields.find((f) => f.key === "title") || collection?.fields[0];
  const editingItem = editingItemId ? collection?.items.find((it) => it.id === editingItemId) : null;

  return (
    <div className="flex-1 overflow-y-auto p-2 space-y-3" data-testid="collection-data-panel">
      <div className="flex items-center gap-1.5">
        <select
          value={selectedId || ""}
          onChange={(e) => { setSelectedId(e.target.value); setEditingItemId(null); }}
          className="flex-1 bg-[#15130E] border border-[#332D22] rounded px-2 py-1.5 text-xs text-[#F1EDE2] outline-none focus:border-[#C9A227]"
          data-testid="collection-select"
        >
          {collections.length === 0 && <option value="">No collections yet</option>}
          {collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={() => setNewOpen((o) => !o)} className="p-1.5 text-[#A79C87] hover:text-[#F1EDE2]" title="New collection" data-testid="new-collection-btn"><Plus size={14} /></button>
        {collection && (
          <button onClick={() => removeCollection(collection.id)} className="p-1.5 text-[#A79C87] hover:text-red-400" title="Delete collection" data-testid="delete-collection-btn"><Trash2 size={14} /></button>
        )}
      </div>

      {newOpen && (
        <div className="p-2 rounded border border-[#332D22] bg-[#15130E] space-y-2">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Collection name (e.g. Blog Posts)" className="w-full bg-[#242019] border border-[#332D22] rounded px-2 py-1.5 text-xs text-[#F1EDE2] outline-none focus:border-[#C9A227]" data-testid="new-collection-name" />
          <select value={newBaseType} onChange={(e) => setNewBaseType(e.target.value)} className="w-full bg-[#242019] border border-[#332D22] rounded px-2 py-1.5 text-xs text-[#F1EDE2]" data-testid="new-collection-base-type">
            {BASE_TYPE_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
          <button onClick={addCollection} className="w-full text-xs py-1.5 rounded bg-[#AD8B21] hover:bg-[#C9A227] text-[#F1EDE2]" data-testid="create-collection-btn">Create</button>
        </div>
      )}

      {collection && (
        <>
          <button onClick={addItem} className="w-full flex items-center justify-center gap-1 text-xs py-1.5 rounded bg-[#242019] hover:bg-[#332D22] text-[#F1EDE2] border border-[#332D22]" data-testid="add-item-btn">
            <Plus size={12} /> Add item
          </button>
          <div className="space-y-1">
            {collection.items.map((it) => (
              <div key={it.id} className={`p-2 rounded border ${editingItemId === it.id ? "border-[#C9A227]" : "border-[#332D22]"} bg-[#15130E]`} data-testid={`item-row-${it.id}`}>
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setEditingItemId(editingItemId === it.id ? null : it.id)}>
                  <span className="text-xs text-[#F1EDE2] truncate">{titleField ? String(it.values[titleField.key] ?? it.slug) : it.slug}</span>
                  <button onClick={(e) => { e.stopPropagation(); removeItem(it.id); }} className="p-0.5 text-[#A79C87] hover:text-red-400" data-testid={`delete-item-${it.id}`}><Trash2 size={11} /></button>
                </div>
                {editingItemId === it.id && (
                  <div className="mt-2 space-y-2 pt-2 border-t border-[#332D22]">
                    <div>
                      <label className="text-[10px] uppercase tracking-wider text-[#948C79] block mb-1">Slug</label>
                      <input defaultValue={it.slug} onBlur={(e) => renameItemSlug(it.id, e.target.value)} className="w-full bg-[#242019] border border-[#332D22] rounded px-2 py-1.5 text-xs font-mono text-[#F1EDE2] outline-none focus:border-[#C9A227]" data-testid="item-slug-input" />
                    </div>
                    {collection.fields.map((f) => (
                      <div key={f.key}>
                        <label className="text-[10px] uppercase tracking-wider text-[#948C79] block mb-1">{f.label}</label>
                        <FieldInput field={f} value={it.values[f.key]} onChange={(v) => patchItemValue(it.id, f.key, v)} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {collection.items.length === 0 && <div className="text-[11px] text-[#948C79] text-center py-3">No items yet.</div>}
          </div>
        </>
      )}
      {!collection && collections.length === 0 && (
        <p className="text-[11px] text-[#948C79]">Create a collection to start adding structured content (blog posts, portfolio projects, etc.).</p>
      )}
    </div>
  );
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `CI=true npx craco test --testPathPattern="CollectionDataPanel" --watchAll=false`
Expected: PASS — 4 tests

- [ ] **Step 5: Commit**

```bash
git add src/components/builder/CollectionDataPanel.jsx src/components/builder/CollectionDataPanel.test.jsx
git commit -m "feat: add Collection data panel (create collections, add/edit items)"
```

---

## Task 5: Wire `CollectionDataPanel` into `LeftSidebar` as a new "Data" tab

**Files:**
- Modify: `src/components/builder/LeftSidebar.jsx`
- Modify: `src/pages/Builder.jsx`

**Interfaces:**
- Consumes: `CollectionDataPanel` (Task 4), `collections`/`setCollections` (Task 3).
- Produces: nothing new for later tasks — this is a leaf wiring task, verified manually (Step 4).

- [ ] **Step 1: Add the "Data" tab button and grid column**

Modify `src/components/builder/LeftSidebar.jsx` — the tab bar is a `grid-cols-8` grid at line 123 driving an inline array at lines 124-132. Change `grid-cols-8` to `grid-cols-9` and insert a new entry after `{ id: "files", label: "Files" }`:

```jsx
      <div className="grid grid-cols-9 border-b border-[#332D22] text-[10px]">
        {[
          { id: "edit", label: "Edit" },
          { id: "library", label: "Library" },
          { id: "layout", label: "Layout" },
          { id: "forms", label: "Forms" },
          { id: "shop", label: "Shop" },
          { id: "files", label: "Files" },
          { id: "data", label: "Data" },
          { id: "snippets", label: "Snips" },
          { id: "saved", label: `Saved${savedComponents.length ? ` · ${savedComponents.length}` : ""}` },
        ].map((t) => (
```

- [ ] **Step 2: Render the panel for the new tab**

Modify `src/components/builder/LeftSidebar.jsx` — add the import near the top (alongside the existing `import { FileTree } from "./FileTree";`):

```js
import { CollectionDataPanel } from "./CollectionDataPanel";
```

Add `collections, onCollectionsChange,` to the destructured props (alongside the existing `files, onFilesChange, onFileClick, onImportFile,`).

Insert a new conditional block immediately after the existing `{tab === "files" && (...)}` block:

```jsx
      {tab === "files" && (
        <FileTree files={files} onChange={onFilesChange} onFileClick={onFileClick} onInsertHtml={onImportFile} />
      )}

      {tab === "data" && (
        <CollectionDataPanel collections={collections} onCollectionsChange={onCollectionsChange} />
      )}
```

- [ ] **Step 3: Pass `collections`/`setCollections` down from Builder.jsx**

Modify `src/pages/Builder.jsx` — add `collections={collections} onCollectionsChange={setCollections}` to the `<LeftSidebar>` element, alongside the existing `files={files} onFilesChange={setFiles}`.

- [ ] **Step 4: Manually verify in the browser**

Run: `npm start` (or use the already-running dev server), open the app, click the "Data" tab in the left sidebar, create a collection, add an item, edit a field, reload the page, confirm the item and its field value are still there (persistence round-trip through Task 2/3).

Run the full frontend suite once more to confirm no regressions: `CI=true npx craco test --watchAll=false`
Expected: PASS — all prior tests plus this task's new ones (15 total new across Tasks 1 and 4)

- [ ] **Step 5: Commit**

```bash
git add src/components/builder/LeftSidebar.jsx src/pages/Builder.jsx
git commit -m "feat: add Data tab wiring Collection data panel into the left sidebar"
```

---

## Self-Review

**Spec coverage:**
- "Data Model" (Collection/Layout/Template shapes, default field sets) → Task 1.
- Persistence (additive, `pages[]` untouched) → Tasks 2, 3.
- "Collection data panel" from "Canvas Authoring UX" → Tasks 4, 5.
- Everything else in "Canvas Authoring UX" (Bind panel, `collection_list` authoring), "Navigation," "Reconciling the existing Template button," "Export," and "Import → Template Detection" is explicitly Part 2b / later phases, not this plan.

**Placeholder scan:** none — every step has real, complete code.

**Type consistency:** `Collection = { id, name, base_type, fields: Field[], items: Item[] }`, `Item = { id, slug, values: Record<string, any> }`, `Field = { key, label, type }` are used identically across Tasks 1, 3, 4, 5. `Layout`/`Template` shapes from Task 1 are unused by any other task in this plan (Part 2b consumes them) — confirmed intentional, not a gap.

## Execution

Plan complete and saved to `docs/superpowers/plans/2026-08-24-native-cms-core-2a-data-model-plan.md`.
