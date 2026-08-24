# Native CMS Core — Part 2b: Layout/Template CRUD, Bind Panel & Collection-List Authoring

> **RETIRED — do not execute.** The generic Template/Layout/Collection design this plan implements was shelved in favor of finishing the already-real "Zenero" content stack (`backend/models/zenero.py` + `ZeneroDashboardPanel.jsx`). See `docs/superpowers/specs/2026-08-24-cms-template-layout-collections-design.md`'s Status section. Kept for reference only.


> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a user create Layouts and Templates, edit a Layout in the same canvas pages are edited in today, bind elements inside a collection-bound Layout to Collection fields, and mark a container as the repeat unit for a `collection_list` Layout — completing native authoring (this plan does not touch export/SSG, which is Phase 3, or import detection, which is Phase 5).

**Architecture:** Layout editing reuses the exact same "working buffer" (`elements`/`headHtml`/`canvasBg`/`fonts`/`customJs`) pages already edit in, gated by a new `activeLayoutId` (mutually exclusive with `activePageId`) — mirroring `switchPage`/`newPage`/`removePage`/`renamePage` exactly. Binding does **not** add live nested-DOM click-to-select to the Canvas (that doesn't exist anywhere in Web Dojo today — every existing "edit a sub-part of one block" feature, e.g. gallery images/nav items/timeline entries in `BlockEditMenu.jsx`, works by parsing the selected block's HTML string into a structured list and writing changes back into that string). The Bind panel follows that same established pattern instead of assuming click-to-select.

> **Deviation from the spec, flagged for the spec's author:** `2026-08-24-cms-template-layout-collections-design.md`'s "Canvas Authoring UX" section says "Click any element inside it" for binding, which reads as live nested click-to-select. That doesn't exist in this codebase's selection model (`selected` is always one whole top-level canvas block, never a nested child — confirmed against `RightSidebar.jsx`, `Canvas.jsx`, and `Builder.jsx`'s `selected` memo). This plan implements binding as a structured list of detected bindable sub-nodes shown in the Bind panel instead, matching `BlockEditMenu.jsx`'s existing parse/set pattern. Recommend updating the spec's wording to match; the user-visible result (pick a field for each part of a card) is the same, only the mechanism differs.

**Tech Stack:** React (Builder.jsx state model), DOMParser (matching `BlockEditMenu.jsx`'s existing string-based sub-edit pattern), Jest + `@testing-library/react`.

**Spec:** `docs/superpowers/specs/2026-08-24-cms-template-layout-collections-design.md`
**Depends on:** `docs/superpowers/plans/2026-08-24-native-cms-core-2a-data-model-plan.md` (must be implemented first — this plan uses `collections` state and `createLayout`/`createTemplate` from Part 2a's Task 1/3).

## Global Constraints

- No live nested-DOM click-to-select is introduced — see the deviation note above.
- `data-forge-collection-list` / `data-forge-bind` / `data-forge-bind-href` are the exact marker names (spec: "Authoring Markers") — no other names.
- Follow the existing dark-theme Tailwind conventions and `data-testid` on every interactive element (see Part 2a's Global Constraints for the exact palette).
- Mirror existing page-CRUD function shapes exactly (`switchPage`/`newPage`/`removePage`/`renamePage` in `src/pages/Builder.jsx:265-356`) for the new layout-CRUD functions — same persist-current-buffer-before-switching behavior, same signatures.

---

## Task 1: Layout CRUD in Builder.jsx

**Files:**
- Modify: `src/pages/Builder.jsx`

**Interfaces:**
- Consumes: `createLayout` from `src/lib/collections.js` (Part 2a Task 1); `layouts`/`setLayouts` state (Part 2a Task 3).
- Produces: `activeLayoutId` (state, nullable), `activeLayout` (memo: `Layout | null`), `newLayout(name, kind, opts)`, `switchLayout(id)`, `removeLayout(id)`, `renameLayout(id, name)` — all consumed by Task 2 (Template CRUD needs `layouts`/`removeLayout` for cascade), Task 5 (RightSidebar needs `activeLayout`), Task 7 (PagesBar needs all of these).

No unit test for this task — same reasoning as Part 2a Task 3 (`Builder.jsx` has no existing test harness; this is manually verified in Step 6 and exercised indirectly by every later task's component tests).

- [ ] **Step 1: Add `activeLayoutId` state and the `activeLayout` memo**

Modify `src/pages/Builder.jsx` — immediately after the existing `const [activePageId, setActivePageId] = ...` declaration, add:

```js
  const [activeLayoutId, setActiveLayoutId] = useState(null);
```

Immediately after the existing `const activePage = useMemo(() => pages.find((p) => p.id === activePageId) || pages[0], [pages, activePageId]);` (around line 253), add:

```js
  const activeLayout = useMemo(() => layouts.find((l) => l.id === activeLayoutId) || null, [layouts, activeLayoutId]);
  const activeLayoutCollection = useMemo(
    () => (activeLayout && activeLayout.collection_id ? collections.find((c) => c.id === activeLayout.collection_id) || null : null),
    [activeLayout, collections]
  );
```

- [ ] **Step 2: Split the buffer-sync effect between pages and layouts**

Modify the existing "Keep the active page's snapshot in sync" effect (around line 249-251) to skip while a layout is active, and add a twin effect for layouts:

```js
  // Keep the active page's snapshot in sync with the editing state.
  useEffect(() => {
    if (activeLayoutId) return;
    setPages((ps) => ps.map((p) => p.id === activePageId ? { ...p, elements, head_html: headHtml, canvas_bg: canvasBg, fonts, custom_js: customJs } : p));
  }, [elements, headHtml, canvasBg, fonts, customJs, activePageId, activeLayoutId]);

  // Same, but for whichever Layout is currently being edited (mutually
  // exclusive with editing a Page — see switchLayout/switchPage).
  useEffect(() => {
    if (!activeLayoutId) return;
    setLayouts((ls) => ls.map((l) => l.id === activeLayoutId ? { ...l, elements, head_html: headHtml, canvas_bg: canvasBg, fonts, custom_js: customJs } : l));
  }, [elements, headHtml, canvasBg, fonts, customJs, activeLayoutId]);
```

- [ ] **Step 3: Add the CRUD functions**

Modify `src/pages/Builder.jsx` — add immediately after the existing `const setPageSeo = ...` line (around line 356):

```js
  // ------------- Layout ops (mirrors Page ops above) -------------
  const switchLayout = (id) => {
    const target = layouts.find((l) => l.id === id);
    if (!target || id === activeLayoutId) return;
    if (activeLayoutId) {
      setLayouts((ls) => ls.map((l) => l.id === activeLayoutId ? { ...l, elements, head_html: headHtml, canvas_bg: canvasBg, fonts, custom_js: customJs } : l));
    } else {
      setPages((ps) => ps.map((p) => p.id === activePageId ? { ...p, elements, head_html: headHtml, canvas_bg: canvasBg, fonts, custom_js: customJs } : p));
    }
    setActivePageId(null);
    setActiveLayoutId(id);
    setElements(target.elements || []);
    setHeadHtml(target.head_html || "");
    setCanvasBg(target.canvas_bg || "#ffffff");
    setFonts(target.fonts || []);
    setCustomJs(target.custom_js || "");
    setSelectedId(null);
  };
  const switchToPageFromLayout = (id) => {
    // Leaving layout-editing mode: persist the layout buffer, then reuse
    // the existing switchPage (it always persists-then-loads too).
    setLayouts((ls) => ls.map((l) => l.id === activeLayoutId ? { ...l, elements, head_html: headHtml, canvas_bg: canvasBg, fonts, custom_js: customJs } : l));
    setActiveLayoutId(null);
    switchPage(id);
  };
  const newLayout = (name, kind = "static", opts = {}) => {
    const layout = createLayout(name, kind, opts);
    setLayouts((ls) => [...ls, layout]);
    switchLayout(layout.id);
    toast.success(`Added "${name}" layout`);
    return layout;
  };
  const removeLayout = (id) => {
    setLayouts((ls) => ls.filter((l) => l.id !== id));
    // A deleted layout can't stay referenced by a Template.
    setTemplates((ts) => ts.map((t) => ({ ...t, layout_ids: t.layout_ids.filter((lid) => lid !== id) })));
    if (activeLayoutId === id) {
      setActiveLayoutId(null);
      setElements(activePage?.elements || []);
      setHeadHtml(activePage?.head_html || "");
      setCanvasBg(activePage?.canvas_bg || "#ffffff");
      setFonts(activePage?.fonts || []);
      setCustomJs(activePage?.custom_js || "");
    }
  };
  const renameLayout = (id, name) => setLayouts((ls) => ls.map((l) => l.id === id ? { ...l, name } : l));
```

Add the import at the top of the file, alongside the existing `import { scanHtml, inlineLocalStylesheets } from "@/lib/importHtml";`:

```js
import { createLayout, createTemplate } from "@/lib/collections";
```

(`createTemplate` is unused until Task 2 — importing both now avoids a second edit to this import line.)

- [ ] **Step 4: Persist `activeLayoutId` doesn't need to survive reload**

No change needed: `activeLayoutId` is intentionally left out of `saveWatch`/`project` — reopening a project always lands on a Page (`activePageId`), never mid-Layout-edit, matching how `activePageId` itself already isn't the thing that determines "am I editing" (only `pages`/`layouts` content is saved, not which one was open).

- [ ] **Step 5: Manually verify no regression**

Run: `CI=true npx craco test --watchAll=false` — should still be the same count as after Part 2a's last task (this task adds no new test file).

- [ ] **Step 6: Commit**

```bash
git add src/pages/Builder.jsx
git commit -m "feat: add Layout CRUD (create/switch/remove/rename) mirroring Page CRUD"
```

---

## Task 2: Template CRUD in Builder.jsx

**Files:**
- Modify: `src/pages/Builder.jsx`

**Interfaces:**
- Consumes: `createTemplate` (Task 1's import), `layouts`/`removeLayout` (Task 1).
- Produces: `newTemplate(name, opts)`, `renameTemplate(id, name)`, `removeTemplate(id)` (removing a Template does **not** delete its Layouts — it only un-groups them, since a Layout can exist standalone; the spec's "Template" is a grouping, not an owner).

- [ ] **Step 1: Add the CRUD functions**

Modify `src/pages/Builder.jsx` — immediately after Task 1's `renameLayout`:

```js
  // ------------- Template ops -------------
  const newTemplate = (name) => {
    const tpl = createTemplate(name);
    setTemplates((ts) => [...ts, tpl]);
    toast.success(`Added "${name}" template`);
    return tpl;
  };
  const renameTemplate = (id, name) => setTemplates((ts) => ts.map((t) => t.id === id ? { ...t, name } : t));
  const removeTemplate = (id) => {
    setTemplates((ts) => ts.filter((t) => t.id !== id));
    // Un-group, don't delete, the layouts that belonged to this template.
    setLayouts((ls) => ls.map((l) => l.template_id === id ? { ...l, template_id: null } : l));
  };
  const addLayoutToTemplate = (layoutId, templateId) => {
    setLayouts((ls) => ls.map((l) => l.id === layoutId ? { ...l, template_id: templateId } : l));
    setTemplates((ts) => ts.map((t) => t.id === templateId && !t.layout_ids.includes(layoutId) ? { ...t, layout_ids: [...t.layout_ids, layoutId] } : t));
  };
```

- [ ] **Step 2: Manually verify no regression**

Run: `CI=true npx craco test --watchAll=false`

- [ ] **Step 3: Commit**

```bash
git add src/pages/Builder.jsx
git commit -m "feat: add Template CRUD (create/rename/remove, un-groups on delete)"
```

---

## Task 3: `src/lib/collectionBinding.js` — detect and set bindings on a block's HTML

**Files:**
- Create: `src/lib/collectionBinding.js`
- Test: `src/lib/collectionBinding.test.js`

**Interfaces:**
- Produces: `parseBindableNodes(html: string): { path: number[], kind: "text"|"image", preview: string, boundField: string|null }[]`, `setBinding(html: string, path: number[], fieldKey: string|null): string`. Consumed by Task 4 (`BindPanel`).

- [ ] **Step 1: Write the failing tests**

```js
// src/lib/collectionBinding.test.js
import { parseBindableNodes, setBinding } from "./collectionBinding";

const cardHtml = `<div class="card"><img src="imgs/a.jpg"><h3>Post Title</h3><p>An excerpt goes here</p></div>`;

test("parseBindableNodes finds the image and each leaf text node, not the wrapping div", () => {
  const nodes = parseBindableNodes(cardHtml);
  expect(nodes).toHaveLength(3);
  expect(nodes[0]).toMatchObject({ kind: "image", preview: "imgs/a.jpg", boundField: null });
  expect(nodes[1]).toMatchObject({ kind: "text", preview: "Post Title", boundField: null });
  expect(nodes[2]).toMatchObject({ kind: "text", preview: "An excerpt goes here", boundField: null });
});

test("parseBindableNodes reports an already-bound node's field key", () => {
  const html = `<div class="card"><h3 data-forge-bind="title">Post Title</h3></div>`;
  const nodes = parseBindableNodes(html);
  expect(nodes[0].boundField).toBe("title");
});

test("setBinding writes data-forge-bind onto the node at the given path", () => {
  const nodes = parseBindableNodes(cardHtml);
  const out = setBinding(cardHtml, nodes[1].path, "title");
  expect(out).toContain('<h3 data-forge-bind="title">Post Title</h3>');
});

test("setBinding with a null field removes an existing binding", () => {
  const html = `<div class="card"><h3 data-forge-bind="title">Post Title</h3></div>`;
  const nodes = parseBindableNodes(html);
  const out = setBinding(html, nodes[0].path, null);
  expect(out).not.toContain("data-forge-bind");
});

test("parseBindableNodes truncates a long text preview to 60 chars", () => {
  const longText = "x".repeat(100);
  const nodes = parseBindableNodes(`<p>${longText}</p>`);
  expect(nodes[0].preview).toHaveLength(60);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `CI=true npx craco test --testPathPattern="collectionBinding" --watchAll=false`
Expected: FAIL — `Cannot find module './collectionBinding'`

- [ ] **Step 3: Write the implementation**

```js
// src/lib/collectionBinding.js
// Detects bindable leaf nodes (text or image) inside a canvas block's HTML
// and reads/writes the data-forge-bind marker on them. Web Dojo has no live
// nested-DOM click-to-select anywhere (every existing "edit a sub-part of
// one block" feature — gallery images, nav items, timeline entries in
// BlockEditMenu.jsx — parses the block's HTML string into a structured
// list and writes changes back into that string), so binding follows the
// same pattern rather than introducing a new selection model.

const pathOf = (node, root) => {
  const path = [];
  let cur = node;
  while (cur && cur !== root) {
    const parent = cur.parentElement;
    if (!parent) break;
    path.unshift(Array.from(parent.children).indexOf(cur));
    cur = parent;
  }
  return path;
};

const nodeAtPath = (root, path) => {
  let cur = root;
  for (const i of path) {
    cur = cur?.children?.[i];
    if (!cur) return null;
  }
  return cur;
};

export const parseBindableNodes = (html) => {
  const doc = new DOMParser().parseFromString(`<div id="__root">${html}</div>`, "text/html");
  const root = doc.getElementById("__root");
  const out = [];
  const walk = (el) => {
    Array.from(el.children).forEach((child) => {
      if (child.tagName === "IMG") {
        out.push({ path: pathOf(child, root), kind: "image", preview: child.getAttribute("src") || "", boundField: child.getAttribute("data-forge-bind") });
        return;
      }
      const ownText = Array.from(child.childNodes).filter((n) => n.nodeType === 3).map((n) => n.textContent).join("").trim();
      const hasElementChildren = child.children.length > 0;
      if (ownText && !hasElementChildren) {
        out.push({ path: pathOf(child, root), kind: "text", preview: ownText.slice(0, 60), boundField: child.getAttribute("data-forge-bind") });
      }
      walk(child);
    });
  };
  walk(root);
  return out;
};

export const setBinding = (html, path, fieldKey) => {
  const doc = new DOMParser().parseFromString(`<div id="__root">${html}</div>`, "text/html");
  const root = doc.getElementById("__root");
  const node = nodeAtPath(root, path);
  if (!node) return html;
  if (fieldKey) node.setAttribute("data-forge-bind", fieldKey);
  else node.removeAttribute("data-forge-bind");
  return root.innerHTML;
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `CI=true npx craco test --testPathPattern="collectionBinding" --watchAll=false`
Expected: PASS — 5 tests

- [ ] **Step 5: Commit**

```bash
git add src/lib/collectionBinding.js src/lib/collectionBinding.test.js
git commit -m "feat: add bindable-node detection and data-forge-bind read/write"
```

---

## Task 4: `BindPanel` component

**Files:**
- Create: `src/components/builder/BindPanel.jsx`
- Test: `src/components/builder/BindPanel.test.jsx`

**Interfaces:**
- Consumes: `parseBindableNodes`, `setBinding` (Task 3).
- Produces: `export const BindPanel = ({ selected, collection, onReplaceHtml })` where `selected` is the currently-selected canvas block (`{ id, html }` or `null`, same shape `RightSidebar` already receives) and `collection` is the active layout's bound Collection (`Collection | null`, from Task 1's `activeLayoutCollection`). Consumed by Task 5.

- [ ] **Step 1: Write the failing tests**

```jsx
// src/components/builder/BindPanel.test.jsx
import { render, screen, fireEvent } from "@testing-library/react";
import { BindPanel } from "./BindPanel";
import { createCollection, createCollectionItem } from "@/lib/collections";

test("prompts to select an element when nothing is selected", () => {
  render(<BindPanel selected={null} collection={null} onReplaceHtml={jest.fn()} />);
  expect(screen.getByText(/select an element/i)).toBeInTheDocument();
});

test("explains this page isn't collection-bound when there's no collection", () => {
  render(<BindPanel selected={{ id: "el_1", html: "<p>hi</p>" }} collection={null} onReplaceHtml={jest.fn()} />);
  expect(screen.getByText(/isn't part of a collection-bound layout/i)).toBeInTheDocument();
});

test("lists each bindable node in the selected block with a field dropdown", () => {
  const coll = createCollection("Blog Posts", "blog_post");
  render(
    <BindPanel
      selected={{ id: "el_1", html: `<div><img src="imgs/a.jpg"><h3>Post Title</h3></div>` }}
      collection={coll}
      onReplaceHtml={jest.fn()}
    />
  );
  expect(screen.getByTestId("bind-node-0")).toBeInTheDocument(); // image
  expect(screen.getByTestId("bind-node-1")).toBeInTheDocument(); // text
  // The image node's dropdown only offers image-typed fields.
  const imageSelect = screen.getByTestId("bind-select-0");
  expect(imageSelect.querySelectorAll("option").length).toBe(2); // "— not bound —" + cover_image
});

test("choosing a field calls onReplaceHtml with the field written onto that node", () => {
  const coll = createCollection("Blog Posts", "blog_post");
  const onReplaceHtml = jest.fn();
  render(
    <BindPanel
      selected={{ id: "el_1", html: `<div><h3>Post Title</h3></div>` }}
      collection={coll}
      onReplaceHtml={onReplaceHtml}
    />
  );
  fireEvent.change(screen.getByTestId("bind-select-0"), { target: { value: "title" } });
  expect(onReplaceHtml).toHaveBeenCalledWith(expect.stringContaining('data-forge-bind="title"'));
});

test("shows a live preview from the collection's first item once bound", () => {
  const coll = createCollection("Blog Posts", "blog_post");
  coll.items = [createCollectionItem(coll, "My First Post")];
  render(
    <BindPanel
      selected={{ id: "el_1", html: `<div><h3 data-forge-bind="title">Post Title</h3></div>` }}
      collection={coll}
      onReplaceHtml={jest.fn()}
    />
  );
  expect(screen.getByText(/My First Post/)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `CI=true npx craco test --testPathPattern="BindPanel" --watchAll=false`
Expected: FAIL — `Cannot find module './BindPanel'`

- [ ] **Step 3: Write the implementation**

```jsx
// src/components/builder/BindPanel.jsx
import React from "react";
import { parseBindableNodes, setBinding } from "@/lib/collectionBinding";

export const BindPanel = ({ selected, collection, onReplaceHtml }) => {
  if (!selected) {
    return <p className="text-[11px] text-[#948C79]">Select an element to bind it to a collection field.</p>;
  }
  if (!collection) {
    return <p className="text-[11px] text-[#948C79]">This page isn't part of a collection-bound layout.</p>;
  }

  const nodes = parseBindableNodes(selected.html);
  const sampleItem = collection.items[0] || null;

  return (
    <div className="space-y-2" data-testid="bind-panel">
      {nodes.length === 0 && <p className="text-[11px] text-[#948C79]">No bindable text or image found in this element.</p>}
      {nodes.map((n, i) => (
        <div key={i} className="p-2 rounded border border-[#332D22] bg-[#15130E]" data-testid={`bind-node-${i}`}>
          <div className="text-[11px] text-[#948C79] truncate mb-1">{n.kind === "image" ? "Image" : `“${n.preview}”`}</div>
          <select
            value={n.boundField || ""}
            onChange={(e) => onReplaceHtml(setBinding(selected.html, n.path, e.target.value || null))}
            className="w-full bg-[#242019] border border-[#332D22] rounded px-2 py-1.5 text-xs text-[#F1EDE2] outline-none focus:border-[#C9A227]"
            data-testid={`bind-select-${i}`}
          >
            <option value="">— not bound —</option>
            {collection.fields
              .filter((f) => (n.kind === "image" ? f.type === "image" : f.type !== "image"))
              .map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
          </select>
          {n.boundField && sampleItem && (
            <div className="text-[10px] text-[#D9BC55] mt-1 truncate">Preview: {String(sampleItem.values[n.boundField] ?? "")}</div>
          )}
        </div>
      ))}
    </div>
  );
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `CI=true npx craco test --testPathPattern="BindPanel" --watchAll=false`
Expected: PASS — 5 tests

- [ ] **Step 5: Commit**

```bash
git add src/components/builder/BindPanel.jsx src/components/builder/BindPanel.test.jsx
git commit -m "feat: add Bind panel (structured field-binding list, not click-to-select)"
```

---

## Task 5: Wire the "Bind" tab into RightSidebar

**Files:**
- Modify: `src/components/builder/RightSidebar.jsx`
- Modify: `src/pages/Builder.jsx`

**Interfaces:**
- Consumes: `BindPanel` (Task 4), `activeLayoutCollection` (Task 1).
- Produces: nothing new for later tasks — leaf wiring, verified manually.

- [ ] **Step 1: Add the conditional tab entry**

Modify `src/components/builder/RightSidebar.jsx` — the `TABS` constant (lines 21-39) is a plain array, not conditional per-render, but the Bind tab must only *appear* when there's an active collection. Change the component to build the tab list at render time instead of using the static `TABS` constant directly:

```js
const BASE_TABS = [
  { id: "color", label: "Color" },
  { id: "tokens", label: "Tokens" },
  { id: "gradient", label: "Gradient" },
  { id: "pattern", label: "Pattern" },
  { id: "svgbg", label: "SVG BG" },
  { id: "style", label: "Style" },
  { id: "responsive", label: "Responsive" },
  { id: "variants", label: "Variants" },
  { id: "shape", label: "Shape" },
  { id: "bg", label: "BG" },
  { id: "blend", label: "Blend" },
  { id: "divider", label: "Divider" },
  { id: "anim", label: "Motion" },
  { id: "textfx", label: "Text FX" },
  { id: "theme", label: "Theme" },
  { id: "cdn", label: "CDN" },
  { id: "page", label: "Page" },
];
```

(This replaces the existing `const TABS = [...]` — same array, just renamed so it can be composed below.)

- [ ] **Step 2: Add the `activeCollection` prop and compose the tab list**

Modify the `RightSidebar` component's props (line 41-68) to accept a new `activeCollection` prop (pass `null` when not editing a collection-bound layout). Immediately inside the component body, before the `return`:

```js
  const TABS = activeCollection ? [...BASE_TABS.slice(0, 1), { id: "bind", label: "Bind" }, ...BASE_TABS.slice(1)] : BASE_TABS;
```

(Inserts "Bind" right after "Color" — first tab after the always-present one — only when `activeCollection` is truthy.)

- [ ] **Step 3: Render the panel**

Add the import at the top: `import { BindPanel } from "./BindPanel";`

Add the conditional block, anywhere among the other `{tab === "..." && (...)}` blocks (e.g. right after the `{tab === "color" && (...)}` block):

```jsx
        {tab === "bind" && (
          <BindPanel selected={selected} collection={activeCollection} onReplaceHtml={onReplaceHtml} />
        )}
```

- [ ] **Step 4: Pass `activeCollection` down from Builder.jsx**

Modify `src/pages/Builder.jsx` — add `activeCollection={activeLayoutCollection}` to the `<RightSidebar>` element, alongside its other existing props.

- [ ] **Step 5: Manually verify in the browser**

Run the dev server, create a Layout via the flow from Task 7 (or temporarily call `newLayout("Test", "collection_detail", { collectionId: someCollection.id })` from the console for an early smoke test if Task 7 isn't done yet), select a block containing text, confirm the "Bind" tab appears and lets you assign a field, and confirm it does *not* appear while editing an ordinary Page.

Run: `CI=true npx craco test --watchAll=false`
Expected: PASS — all prior tests plus this task's (none added directly by this task; covered by Task 4's tests plus this manual check)

- [ ] **Step 6: Commit**

```bash
git add src/components/builder/RightSidebar.jsx src/pages/Builder.jsx
git commit -m "feat: show Bind tab in RightSidebar only for collection-bound layouts"
```

---

## Task 6: "Mark as repeat container" — `data-forge-collection-list` authoring

**Files:**
- Modify: `src/components/builder/Canvas.jsx`
- Modify: `src/pages/Builder.jsx`

**Interfaces:**
- Consumes: `activeLayout` (Task 1).
- Produces: nothing new for later tasks — this completes native `collection_list` authoring per the spec.

- [ ] **Step 1: Add a context-menu item, shown only while editing a `collection_list` Layout**

Modify `src/components/builder/Canvas.jsx` — add an `activeLayout` prop to the `Canvas` component's destructured props (alongside the existing `headHtml, viewport = "desktop", zoom = 100,`).

In the per-element `ContextMenuContent` block (around line 126-135), add a new item right after the existing `ctx-dup-${el.id}` ("Duplicate") item and before the `ContextMenuSeparator` that precedes "Delete":

```jsx
                  {activeLayout && activeLayout.kind === "collection_list" && (
                    <ContextMenuItem
                      className="text-xs focus:bg-[#242019] focus:text-[#F1EDE2]"
                      data-testid={`ctx-repeat-${el.id}`}
                      onSelect={() => {
                        const marked = /data-forge-collection-list=/.test(el.html)
                          ? el.html.replace(/\sdata-forge-collection-list="[^"]*"/, "")
                          : el.html.replace(/^(<[a-z0-9]+)/i, `$1 data-forge-collection-list="${activeLayout.collection_id}"`);
                        onEditHtml(el.id, marked);
                      }}
                    >
                      {/data-forge-collection-list=/.test(el.html) ? "Unmark as repeat container" : "Repeat this for each item"}
                    </ContextMenuItem>
                  )}
```

- [ ] **Step 2: Pass `activeLayout` down from Builder.jsx**

Modify `src/pages/Builder.jsx` — add `activeLayout={activeLayout}` to the `<Canvas>` element, alongside its other existing props.

- [ ] **Step 3: Manually verify in the browser**

Create a `collection_list` Layout (via Task 7's flow, or a one-off console call), add a block, right-click it, confirm "Repeat this for each item" appears and toggles to "Unmark as repeat container" after clicking, and confirm this menu item never appears while editing a Page or a `static`/`collection_detail` Layout.

- [ ] **Step 4: Commit**

```bash
git add src/components/builder/Canvas.jsx src/pages/Builder.jsx
git commit -m "feat: add repeat-container marking for collection_list layouts"
```

---

## Task 7: Layouts and Templates in the page-switcher bar

**Files:**
- Modify: `src/components/builder/PagesBar.jsx`
- Modify: `src/pages/Builder.jsx`

**Interfaces:**
- Consumes: `layouts`, `templates`, `activeLayoutId`, `switchLayout`, `switchToPageFromLayout`, `removeLayout`, `renameLayout`, `newLayout`, `newTemplate` (Tasks 1-2), `collections` (Part 2a).
- Produces: nothing for later tasks — this is the last authoring-UX task in this plan.

- [ ] **Step 1: Extend `PagesBar` to render Layout tabs, grouped by Template name**

Modify `src/components/builder/PagesBar.jsx` — add new props `layouts`, `templates`, `activeLayoutId`, `onSwitchLayout`, `onRemoveLayout`, `onRenameLayout`, `onAddLayout`, `onAddTemplate` to the destructured props list.

Insert, immediately after the closing `))}` of the existing `{pages.map((p) => { ... })}` block and before the existing "+ Page" button:

```jsx
    {layouts.map((l) => {
      const active = l.id === activeLayoutId;
      const tpl = l.template_id ? templates.find((t) => t.id === l.template_id) : null;
      const displayName = tpl ? `${tpl.name} / ${l.name}` : l.name;
      const isEditing = editingId === `layout-${l.id}`;
      return (
        <div
          key={l.id}
          onClick={() => { if (!isEditing) onSwitchLayout(l.id); }}
          className={`flex-none flex items-center gap-1.5 px-2 py-1 rounded-t border-b-2 cursor-pointer text-xs group ${active ? "bg-[#1C1A15] border-[#C9A227] text-[#F1EDE2]" : "border-transparent text-[#A79C87] hover:text-[#F1EDE2] hover:bg-[#242019]"}`}
          data-testid={`layout-tab-${l.id}`}
        >
          <span title={l.kind} style={{ background: l.kind === "static" ? "#64748b" : "#C9A227", width: 7, height: 7, borderRadius: 999 }} />
          {isEditing ? (
            <input
              autoFocus
              value={l.name}
              onFocus={(e) => e.target.select()}
              onChange={(e) => onRenameLayout(l.id, e.target.value)}
              onBlur={() => setEditingId(null)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") setEditingId(null); }}
              onClick={(e) => e.stopPropagation()}
              className="bg-transparent outline-none w-28 text-xs border-b border-[#C9A227]"
              data-testid={`layout-name-${l.id}`}
            />
          ) : (
            <span
              onDoubleClick={(e) => { e.stopPropagation(); setEditingId(`layout-${l.id}`); }}
              className="w-28 truncate select-none"
              title="Double-click to rename"
              data-testid={`layout-name-${l.id}`}
            >{displayName}</span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onRemoveLayout(l.id); }}
            className="opacity-0 group-hover:opacity-100 text-[#948C79] hover:text-red-400 p-0.5"
            title="Delete layout"
            data-testid={`layout-del-${l.id}`}
          ><X size={11} /></button>
        </div>
      );
    })}
    <button
      onClick={onAddLayout}
      className="flex-none flex items-center gap-1 px-2 py-1 rounded text-xs text-[#A79C87] hover:text-[#F1EDE2] hover:bg-[#242019]"
      title="New layout"
      data-testid="layout-add-btn"
    ><Plus size={11} /> Layout</button>
    <button
      onClick={onAddTemplate}
      className="flex-none flex items-center gap-1 px-2 py-1 rounded text-xs text-[#A79C87] hover:text-[#F1EDE2] hover:bg-[#242019]"
      title="New template (groups layouts + a collection)"
      data-testid="template-add-btn"
    ><Plus size={11} /> Template</button>
```

Note: `editingId` already exists as component state (`const [editingId, setEditingId] = useState(null);`) and is reused here with a `layout-` prefix to disambiguate from page ids — no new state needed. Also change the existing Page tabs' rename check from `editingId === p.id` to `editingId === p.id` (unchanged — page ids never collide with `layout-${id}` strings, so no page-side edit is required).

- [ ] **Step 2: Wire the new props from Builder.jsx, and add the two lightweight creation prompts**

Modify `src/pages/Builder.jsx` — add to the `<PagesBar>` element:

```jsx
      <PagesBar
        pages={pages}
        activePageId={activeLayoutId ? null : activePageId}
        onSwitch={activeLayoutId ? switchToPageFromLayout : switchPage}
        onAdd={() => setAddPageOpen(true)}
        onRemove={removePage}
        onRename={renamePage}
        onSetStatus={setPageStatus}
        onOpenSeo={() => setSeoOpen(true)}
        onOpenTemplate={() => setTemplateEditorOpen(true)}
        layouts={layouts}
        templates={templates}
        activeLayoutId={activeLayoutId}
        onSwitchLayout={switchLayout}
        onRemoveLayout={removeLayout}
        onRenameLayout={renameLayout}
        onAddLayout={() => {
          const name = prompt("New layout name (e.g. Home, Archive, Single Post)", "New Layout");
          if (name && name.trim()) newLayout(name.trim());
        }}
        onAddTemplate={() => {
          const name = prompt("New template name (e.g. Blog, Portfolio)", "New Template");
          if (name && name.trim()) newTemplate(name.trim());
        }}
      />
```

This matches the existing lightweight-`prompt()` naming convention already used elsewhere in this codebase (`FileTree.jsx`'s `addAtRoot`/`addUnder`) rather than introducing a new modal component just to collect a name. Picking a Layout's `kind`/`collection_id` (static vs. collection-bound) and a Template's `collection_id` remain settable afterward — deferred to whichever follow-up surfaces them (out of scope for this plan; `newLayout` already defaults to `kind: "static"`, and a user can promote a layout to collection-bound only via the Convert-to-Template flow in Phase 5, or via direct data manipulation until a dedicated control exists — flag this gap to the user rather than silently building a bigger form here).

- [ ] **Step 3: Manually verify in the browser**

Run the dev server: create a new Template ("Blog"), create a new Layout ("Archive"), confirm both appear in the bar, confirm clicking a Layout tab switches the canvas to editing it (elements clear/load correctly), confirm clicking back to a Page tab correctly restores the page's content, confirm deleting a Layout that belongs to a Template un-groups it without deleting the Template itself.

- [ ] **Step 4: Commit**

```bash
git add src/components/builder/PagesBar.jsx src/pages/Builder.jsx
git commit -m "feat: show Layouts (grouped by Template) in the page-switcher bar"
```

---

## Task 8: Rename the existing "Template" button to "Header/Footer"

**Files:**
- Modify: `src/components/builder/PagesBar.jsx`

**Interfaces:** none — purely a label change, per the spec's "Reconciling the existing Template button" section.

- [ ] **Step 1: Change the button's visible label**

Modify `src/components/builder/PagesBar.jsx` — the existing button (around what was line 83-88 before Task 7's edits):

```jsx
    <button
      onClick={onOpenTemplate}
      className="flex-none flex items-center gap-1 px-2 py-1 rounded text-xs text-[#A79C87] hover:text-[#F1EDE2] hover:bg-[#242019]"
      title="Site-wide header/footer wrapper"
      data-testid="template-btn"
    ><Circle size={11} /> Header/Footer</button>
```

(Only the visible text changes, from `Template` to `Header/Footer`; the `title` tooltip is tightened to match; `data-testid="template-btn"` and the `onOpenTemplate` handler are deliberately left unchanged — nothing else in the codebase references that testid, confirmed by grep, so renaming it would be pure churn.)

- [ ] **Step 2: Manually verify in the browser**

Confirm the button in the page-switcher bar now reads "Header/Footer" and still opens the same header/footer editor modal it did before.

- [ ] **Step 3: Commit**

```bash
git add src/components/builder/PagesBar.jsx
git commit -m "fix: rename Template button to Header/Footer to free up the term for the new CMS"
```

---

## Self-Review

**Spec coverage:**
- "Canvas Authoring UX" bullet 1 (Bind panel) → Tasks 3, 4, 5 (implemented via the flagged deviation — structured list, not click-to-select).
- "Canvas Authoring UX" bullet 3 (building a `collection_list` layout, repeat-container marking) → Task 6.
- Layout/Template creation prerequisite for all of the above → Tasks 1, 2.
- "Navigation" section → Task 7.
- "Reconciling the existing Template button" → Task 8.
- "Canvas Authoring UX" bullet 2 (Collection data panel) was Part 2a, not repeated here.
- Export/SSG (Phase 3) and Convert-to-Template (Phase 5) are explicitly not in this plan.

**Placeholder scan:** none — every step has complete code. The one deliberately deferred sub-feature (a UI for setting a Layout's `kind`/`collection_id` or a Template's `collection_id` after creation) is called out explicitly as a flagged gap in Task 7 Step 2, not silently dropped.

**Type consistency:** `activeLayoutCollection`/`activeLayout` (Task 1) flow unchanged into Task 5's `activeCollection` prop and Task 6's `activeLayout` prop. `BindPanel`'s `collection` prop type matches `Collection` from Part 2a exactly (same `fields`/`items` shape). `parseBindableNodes`'s `path: number[]` return type matches `setBinding`'s `path` parameter exactly (Task 3, self-consistent).

## Execution

Plan complete and saved to `docs/superpowers/plans/2026-08-24-native-cms-core-2b-authoring-plan.md`.
