# CodePen-Style Code Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Web Dojo's Code mode from a read-only generated-output viewer into a CodePen-style editor with four live tabs (HTML, CSS, JS, Head) that write straight back into the project's `elements` array and a new `custom_js` field, plus a live preview pane.

**Architecture:** Two array-parity primitives do the heavy lifting: `stripInlineStyles` (rewritten to emit one *stable, id-based* CSS class per element instead of a scan-order counter) and two new pure reconciliation modules (`htmlPaneSync.js`, `cssPaneSync.js`) that turn edited pane text back into an `elements` array. `CodeView.jsx` wires these together behind a shared debounce, with an echo-suppression ref so a pane's own write-back doesn't stomp on what the user is still typing in another pane. `custom_js` is a new page-level field threaded through both backends' HTML-assembly functions exactly like `head_html` already is.

**Tech Stack:** React 19, Monaco (`@monaco-editor/react`, already locally bundled — see `CodeEditor.jsx`), `emmet-monaco-es` (already wired for html/css/js panes), FastAPI + Pydantic (backend), `node --test` for frontend pure-function tests, `pytest` for backend tests.

**Spec:** `docs/superpowers/specs/2026-08-18-codepen-editor-design.md`

## Global Constraints

- No new npm or pip dependencies. HTML parsing uses the browser's built-in `DOMParser` (browser-only, not unit-tested — see Task 5). CSS parsing is regex-based, matching this codebase's existing `stripInlineStyles` style.
- Debounce all live-sync writes and the preview refresh at **400ms**.
- The `<head>` editor's existing behavior (Emmet + language select) does not change — it becomes one of four tabs, unmodified otherwise.
- `custom_js` is injected as `<script>${custom_js}</script>` immediately before `</body>` in all four HTML-assembly functions: backend `_project_to_html`, `_build_project_bundle`; frontend `buildStandaloneHtml`, `buildCleanExport`. Empty/whitespace-only `custom_js` emits no `<script>` tag at all (no empty-tag noise on every published page).
- A literal `</script` inside raw `custom_js` source must be neutralized before splicing (backslash-escape the `/`) so it can't prematurely close the wrapping `<script>` tag — same technique on both backend and frontend, kept in the same file as the other shared escaping helpers (`frontend/src/lib/escapeHtml.js`) so it's not duplicated ad hoc.
- New CSS class-naming scheme (replaces the old `el-0`, `el-1`, … scan-order counter): an element's **root** `style="..."` attribute becomes `.el-<id>`; any additional `style="..."` attributes nested inside that same element's HTML (e.g. a hero block with several styled child `div`s) become `.el-<id>__1`, `.el-<id>__2`, … in encounter order. This is required so the live CSS pane can round-trip an edit back onto the correct element even after blocks are reordered, added, or removed — a scan-order counter breaks the moment the element order changes.
- This is a **bounded, mechanical rewrite of two existing pure functions** (`_strip_inline_styles` / `stripInlineStyles`) plus new pure modules — not a new inline-style architecture. Do not touch how elements store their styles (still inline `style="..."`, same as today).

---

### Task 1: Backend `custom_js` field — model, fallback, and HTML-assembly injection

**Files:**
- Modify: `backend/server.py:40-78` (`Project`, `ProjectCreate`, `ProjectUpdate` models), `backend/server.py:320-339` (`_active_page`), `backend/server.py:354-380` (`_project_to_html`), `backend/server.py:618-640` (`_build_project_bundle`)
- Create: `backend/tests/test_custom_js.py`

**Interfaces:**
- Produces: `Project.custom_js: str`, `ProjectCreate.custom_js: str`, `ProjectUpdate.custom_js: Optional[str]` (Pydantic fields, same pattern as `head_html`). `_active_page(doc)`'s legacy fallback dict gains a `"custom_js"` key. `_project_to_html(doc, page=None)` and `_build_project_bundle(doc, html_filename, css_filename)` both inject `custom_js` before `</body>` — no signature change to either function.

- [ ] **Step 1: Add `custom_js` to the three Pydantic models**

In `backend/server.py`, add `custom_js: str = ""` to `Project` (after `head_html: str = ""` at line 45), to `ProjectCreate` (after `head_html: str = ""` at line 60), and `custom_js: Optional[str] = None` to `ProjectUpdate` (after `head_html: Optional[str] = None` at line 72) — exactly mirroring how `head_html` is already declared on each of the three models.

- [ ] **Step 2: Add `custom_js` to `_active_page`'s legacy fallback**

In the fallback dict returned by `_active_page` (`backend/server.py:329-339`, used when a project has no `pages` array yet), add a `"custom_js"` key:

```python
    return {
        "id": "home",
        "name": doc.get("name") or "Home",
        "slug": "index",
        "status": "draft",
        "elements": doc.get("elements") or [],
        "head_html": doc.get("head_html") or "",
        "canvas_bg": doc.get("canvas_bg") or "#ffffff",
        "fonts": doc.get("fonts") or [],
        "custom_js": doc.get("custom_js") or "",
        "seo": {},
    }
```

- [ ] **Step 3: Write the failing tests**

Create `backend/tests/test_custom_js.py`:

```python
"""Regression tests for the custom_js page field: Pydantic default, and
injection into both HTML-assembly functions. Pure-function tests — no
TestClient, no db, same pattern as test_responsive_export.py."""
import os

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "webdojo_test")

import server


class TestCustomJsModel:
    def test_project_defaults_custom_js_to_empty_string(self):
        p = server.Project(name="Test")
        assert p.custom_js == ""

    def test_project_create_defaults_custom_js_to_empty_string(self):
        p = server.ProjectCreate(name="Test")
        assert p.custom_js == ""

    def test_project_update_custom_js_defaults_to_none(self):
        p = server.ProjectUpdate()
        assert p.custom_js is None


class TestCustomJsInjection:
    def test_project_to_html_injects_custom_js_before_body_close(self):
        doc = {"id": "p1", "name": "Test", "elements": [], "fonts": [], "pages": [], "custom_js": "console.log('hi');"}
        html = server._project_to_html(doc)
        assert "console.log('hi');" in html
        assert html.index("console.log") < html.index("</body>")

    def test_project_to_html_omits_script_tag_when_custom_js_empty(self):
        doc = {"id": "p2", "name": "Test", "elements": [], "fonts": [], "pages": []}
        html = server._project_to_html(doc)
        assert "<script></script>" not in html

    def test_project_to_html_prefers_page_custom_js_over_doc_level(self):
        page = {"id": "pg1", "elements": [], "fonts": [], "custom_js": "page level"}
        doc = {"id": "p3", "name": "Test", "pages": [page], "active_page_id": "pg1", "custom_js": "doc level"}
        html = server._project_to_html(doc)
        assert "page level" in html
        assert "doc level" not in html

    def test_project_to_html_escapes_embedded_script_close_tag(self):
        doc = {"id": "p4", "name": "Test", "elements": [], "fonts": [], "pages": [], "custom_js": "var x = '</script>';"}
        html = server._project_to_html(doc)
        assert "</script>';" not in html
        assert "<\\/script>';" in html

    def test_build_project_bundle_injects_custom_js_before_body_close(self):
        doc = {"id": "p5", "name": "Test", "elements": [], "fonts": [], "custom_js": "alert(1)"}
        html, _css = server._build_project_bundle(doc, "index.html", "styles.css")
        assert "alert(1)" in html
        assert html.index("alert(1)") < html.index("</body>")

    def test_build_project_bundle_omits_script_tag_when_custom_js_empty(self):
        doc = {"id": "p6", "name": "Test", "elements": [], "fonts": []}
        html, _css = server._build_project_bundle(doc, "index.html", "styles.css")
        assert "<script></script>" not in html
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `cd backend && source .venv/bin/activate && python -m pytest tests/test_custom_js.py -v`
Expected: FAIL — `Project`/`ProjectCreate`/`ProjectUpdate` have no `custom_js` field yet, and neither assembly function injects it.

- [ ] **Step 5: Add the `_esc_raw_script` helper**

Add this helper directly above `_project_to_html` in `backend/server.py` (near the other small string helpers, e.g. right after the `RESPONSIVE_CSS` constant at line 351):

```python
_SCRIPT_CLOSE_RE = re.compile(r'</script', re.IGNORECASE)


def _esc_raw_script(code: str) -> str:
    """Neutralize a literal '</script' inside raw JS source before splicing
    it into a <script> block. HTML's script-content parsing rule is purely
    textual — it ends the block at the first literal "</script" substring
    it finds, even inside a JS string, comment, or template literal — so
    this defuses that substring without changing what the code does (a
    backslash before "/" is a no-op escape in those contexts). Mirrored in
    frontend/src/lib/escapeHtml.js's escRawScript — keep both in sync."""
    return _SCRIPT_CLOSE_RE.sub(r'<\\/script', code or "")
```

Confirm `re` is already imported at the top of `backend/server.py` (it is — used by `_strip_inline_styles` already).

- [ ] **Step 6: Inject `custom_js` in `_project_to_html`**

Replace the body of `_project_to_html` (`backend/server.py:354-380`):

```python
def _project_to_html(doc: dict, page: Optional[dict] = None) -> str:
    p = page or _active_page(doc)
    template = doc.get("template") or {}
    use_tpl = bool(template.get("use_template"))
    header = template.get("header_html", "") if use_tpl else ""
    footer = template.get("footer_html", "") if use_tpl else ""
    body_parts = [e.get("html", "") for e in (p.get("elements") or [])]
    body = "\n".join([header] + body_parts + [footer])
    fonts_link = _build_google_fonts_link(p.get("fonts") or doc.get("fonts") or [])
    head_extra = p.get("head_html") or doc.get("head_html") or ""
    canvas_bg = p.get("canvas_bg") or doc.get("canvas_bg") or "#ffffff"
    custom_js = p.get("custom_js") or doc.get("custom_js") or ""
    custom_js_tag = f"<script>{_esc_raw_script(custom_js)}</script>\n" if custom_js.strip() else ""
    seo = p.get("seo") or {}
    seo_head = _seo_head(seo)
    title = seo.get("title") or p.get("name") or doc.get("name") or "Untitled"
    return (
        "<!doctype html>\n<html lang=\"en\">\n<head>\n"
        "<meta charset=\"utf-8\" />\n"
        "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n"
        f"<title>{title}</title>\n"
        f"<script>window.__WD_PROJECT_ID={json.dumps(doc.get('id') or '')};</script>\n"
        f"{RESPONSIVE_CSS}\n"
        f"{fonts_link}\n{seo_head}\n{head_extra}\n"
        f"<style>body{{margin:0;background:{canvas_bg};}}</style>\n"
        "</head>\n<body>\n"
        f"{body}\n"
        f"{custom_js_tag}"
        "</body>\n</html>"
    )
```

- [ ] **Step 7: Inject `custom_js` in `_build_project_bundle`**

In `_build_project_bundle` (`backend/server.py:618-640`), add the `custom_js` lookup and tag construction, and splice the tag before `</body>`:

```python
def _build_project_bundle(doc: dict, html_filename: str, css_filename: str):
    """Return (index_html, styles_css) using the doc's data."""
    body = "\n".join([e.get("html", "") for e in (doc.get("elements") or [])])
    cleaned_body, css_body = _strip_inline_styles(body)
    fonts_link = _build_google_fonts_link(doc.get("fonts") or [])
    head_extra = doc.get("head_html") or ""
    canvas_bg = doc.get("canvas_bg") or "#ffffff"
    custom_js = doc.get("custom_js") or ""
    custom_js_tag = f"<script>{_esc_raw_script(custom_js)}</script>\n" if custom_js.strip() else ""
    name = doc.get("name") or "Untitled"
    styles = f"body{{margin:0;background:{canvas_bg};}}\n" + css_body
    html = (
        "<!doctype html>\n<html lang=\"en\">\n<head>\n"
        "<meta charset=\"utf-8\" />\n"
        "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n"
        f"<title>{name}</title>\n"
        f"<script>window.__WD_PROJECT_ID={json.dumps(doc.get('id') or '')};</script>\n"
        f"{RESPONSIVE_CSS}\n"
        f"{fonts_link}\n{head_extra}\n"
        f'<link rel="stylesheet" href="{css_filename}" />\n'
        "</head>\n<body>\n"
        f"{cleaned_body}\n"
        f"{custom_js_tag}"
        "</body>\n</html>"
    )
```

Leave the rest of the function (the part building the ZIP/return value below `html = (...)`) untouched — do not change `_strip_inline_styles`'s call signature here yet, that's Task 3.

- [ ] **Step 8: Run tests to verify they pass**

Run: `cd backend && source .venv/bin/activate && python -m pytest tests/test_custom_js.py tests/test_responsive_export.py -v`
Expected: all PASS (the responsive-export tests must still pass unchanged — this task doesn't touch `_strip_inline_styles`).

- [ ] **Step 9: Commit**

```bash
git add backend/server.py backend/tests/test_custom_js.py
git commit -m "Add custom_js page field with HTML-assembly injection (backend)"
```

---

### Task 2: Frontend `custom_js` field — `exportHtml.js` injection

**Files:**
- Modify: `frontend/src/lib/escapeHtml.js`, `frontend/src/lib/exportHtml.js:57-132` (`buildStandaloneHtml`, `buildCleanExport`)
- Modify: `frontend/src/lib/__tests__/exportHtml.test.mjs`

**Interfaces:**
- Consumes: none (independent of Task 1 — mirrors the same behavior on the frontend export path).
- Produces: `escRawScript(code)` in `frontend/src/lib/escapeHtml.js`. `buildStandaloneHtml(project)` and `buildCleanExport(project)` both read `project.custom_js` and inject it before `</body>` — no signature change.

- [ ] **Step 1: Write the failing tests**

Add to `frontend/src/lib/__tests__/exportHtml.test.mjs` (append after the existing tests):

```js
test("custom_js script-tag pattern is injected before </body> when non-empty", () => {
  const customJs = "console.log('hi');";
  const bodyTag = customJs.trim() ? `<script>${customJs}</script>\n` : "";
  const assembled = `<body>\n<div>content</div>\n${bodyTag}</body>`;
  assert.ok(assembled.includes("console.log('hi');"));
  assert.ok(assembled.indexOf("console.log") < assembled.indexOf("</body>"));
});

test("custom_js script-tag pattern is omitted when custom_js is empty", () => {
  const customJs = "";
  const bodyTag = customJs.trim() ? `<script>${customJs}</script>\n` : "";
  const assembled = `<body>\n<div>content</div>\n${bodyTag}</body>`;
  assert.ok(!assembled.includes("<script></script>"));
});

test("escRawScript neutralizes an embedded </script> so it can't close the wrapping tag", async () => {
  const { escRawScript } = await import("../escapeHtml.js");
  const raw = "var x = '</script>';";
  const escaped = escRawScript(raw);
  assert.ok(!escaped.includes("</script>"));
  assert.equal(escaped, "var x = '<\\/script>';");
});

test("escRawScript is case-insensitive and leaves ordinary code untouched", async () => {
  const { escRawScript } = await import("../escapeHtml.js");
  assert.equal(escRawScript("var x = 1 + 2;"), "var x = 1 + 2;");
  assert.ok(!escRawScript("'</SCRIPT>'").includes("</SCRIPT>"));
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && node --test src/lib/__tests__/exportHtml.test.mjs`
Expected: FAIL on the two `escRawScript` tests — `escapeHtml.js` doesn't export it yet. (The two script-tag pattern tests will pass immediately since they don't call app code — that's fine, they document the pattern the real functions must follow; Step 4 makes the real functions match it.)

- [ ] **Step 3: Add `escRawScript` to `escapeHtml.js`**

Add to `frontend/src/lib/escapeHtml.js` (after `escJsScript`):

```js
// Safe to splice raw (non-JSON-stringified) JS source into a literal
// <script>...</script> block — used for the project's custom_js field,
// which is executable code, not a string value (escJsScript above is for
// splicing a *string value* via JSON.stringify, which would just turn a
// whole JS program into an inert string literal). HTML's script-content
// parsing rule is purely textual — it ends the block at the first literal
// "</script" substring it finds, even inside a JS string, comment, or
// template literal — so this defuses that substring without changing
// what the code does (a backslash before "/" is a no-op escape in those
// contexts). Mirrored in backend/server.py's _esc_raw_script — keep both
// in sync.
export const escRawScript = (code) => String(code ?? "").replace(/<\/script/gi, "<\\/script");
```

- [ ] **Step 4: Inject `custom_js` in `buildStandaloneHtml` and `buildCleanExport`**

In `frontend/src/lib/exportHtml.js`, add the import and update both functions:

```js
import { escAttr, escText, escRawScript } from "./escapeHtml.js";
```

```js
export const buildStandaloneHtml = (project) => {
  const body = project.elements.map((e) => e.html).join("\n");
  const fonts = buildFontLinks(project.fonts);
  const seoMeta = buildSeoMeta(project.seo);
  const customJsTag = (project.custom_js || "").trim() ? `<script>${escRawScript(project.custom_js)}</script>\n` : "";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escText(pageTitle(project))}</title>
<script>window.__WD_PROJECT_ID=${JSON.stringify(project.id || "")};</script>
${RESPONSIVE_CSS}
${seoMeta}
${fonts}
${project.head_html || ""}
<style>body{margin:0;background:${project.canvas_bg || "#ffffff"};}</style>
</head>
<body>
${body}
${customJsTag}</body>
</html>`;
};
```

```js
export const buildCleanExport = (project) => {
  const body = project.elements.map((e) => e.html).join("\n");
  const { html: cleaned, css } = stripInlineStyles(body);
  const fonts = buildFontLinks(project.fonts);
  const seoMeta = buildSeoMeta(project.seo);
  const customJsTag = (project.custom_js || "").trim() ? `<script>${escRawScript(project.custom_js)}</script>\n` : "";
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escText(pageTitle(project))}</title>
<script>window.__WD_PROJECT_ID=${JSON.stringify(project.id || "")};</script>
${RESPONSIVE_CSS}
${seoMeta}
${fonts}
${project.head_html || ""}
<link rel="stylesheet" href="styles.css" />
</head>
<body>
${cleaned}
${customJsTag}</body>
</html>`;
  const styles = `body{margin:0;background:${project.canvas_bg || "#ffffff"};}\n${css}`;
  return { html, css: styles };
};
```

(Leave `stripInlineStyles`'s own body untouched here — that's Task 4. Its call site above stays as `stripInlineStyles(body)` for now; Task 4 changes both together.)

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd frontend && node --test src/lib/__tests__/exportHtml.test.mjs`
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/lib/escapeHtml.js frontend/src/lib/exportHtml.js frontend/src/lib/__tests__/exportHtml.test.mjs
git commit -m "Add custom_js page field with HTML-assembly injection (frontend)"
```

---

### Task 3: Backend id-stable `_strip_inline_styles` rewrite

**Files:**
- Modify: `backend/server.py:594-640` (`_strip_inline_styles`, `_build_project_bundle`)
- Modify: `backend/tests/test_responsive_export.py`

**Interfaces:**
- Consumes: nothing from Task 1/2.
- Produces: `_strip_inline_styles(elements: list) -> tuple[str, str]` — **signature change** from `_strip_inline_styles(body_html: str)`. Takes a list of `{"id": str, "html": str}` dicts (the same shape `doc.get("elements")` already is) instead of one joined HTML string, and returns `(joined_html_with_classes, css_string)` same as before. Root class is `el-<id>`; additional nested `style="..."` attributes within the same element are `el-<id>__1`, `el-<id>__2`, ….

- [ ] **Step 1: Update the two existing tests for the new signature**

In `backend/tests/test_responsive_export.py`, replace `TestCleanExportGridResponsive`:

```python
class TestCleanExportGridResponsive:
    def test_strip_inline_styles_adds_responsive_override_for_grid(self):
        elements = [{"id": "el_abc123", "html": '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">content</div>'}]
        transformed, css = server._strip_inline_styles(elements)
        assert 'class="el-el_abc123"' in transformed
        assert ".el-el_abc123 { display:grid;grid-template-columns:repeat(3,1fr);gap:10px; }" in css
        assert "@media (max-width: 768px) { .el-el_abc123 { grid-template-columns: 1fr !important; } }" in css

    def test_strip_inline_styles_skips_override_for_non_grid_elements(self):
        elements = [{"id": "el_xyz789", "html": '<div style="color:red;padding:10px;">content</div>'}]
        transformed, css = server._strip_inline_styles(elements)
        assert ".el-el_xyz789 { color:red;padding:10px; }" in css
        assert "@media" not in css
```

- [ ] **Step 2: Add new id-stability and nested-style tests**

Append to the same `TestCleanExportGridResponsive` class:

```python
    def test_strip_inline_styles_suffixes_nested_style_attrs(self):
        elements = [{"id": "el_1", "html": '<section style="padding:20px;"><h1 style="color:blue;">Hi</h1><p style="margin:0;">Body</p></section>'}]
        transformed, css = server._strip_inline_styles(elements)
        assert 'class="el-el_1"' in transformed
        assert 'class="el-el_1__1"' in transformed
        assert 'class="el-el_1__2"' in transformed
        assert ".el-el_1 { padding:20px; }" in css
        assert ".el-el_1__1 { color:blue; }" in css
        assert ".el-el_1__2 { margin:0; }" in css

    def test_strip_inline_styles_keeps_ids_stable_across_reordering(self):
        a = {"id": "el_a", "html": '<div style="color:red;">A</div>'}
        b = {"id": "el_b", "html": '<div style="color:blue;">B</div>'}
        html_ab, _css_ab = server._strip_inline_styles([a, b])
        html_ba, _css_ba = server._strip_inline_styles([b, a])
        assert 'class="el-el_a"' in html_ab and 'class="el-el_a"' in html_ba
        assert 'class="el-el_b"' in html_ab and 'class="el-el_b"' in html_ba

    def test_strip_inline_styles_handles_element_with_no_style_attr(self):
        elements = [{"id": "el_plain", "html": '<div>no style here</div>'}]
        transformed, css = server._strip_inline_styles(elements)
        assert transformed == '<div>no style here</div>'
        assert css == ""
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd backend && source .venv/bin/activate && python -m pytest tests/test_responsive_export.py -v`
Expected: FAIL — `_strip_inline_styles` still takes a raw HTML string, not a list, and still uses the `el-0`/`el-1` scan-order counter.

- [ ] **Step 4: Rewrite `_strip_inline_styles` and its call site**

Replace `_strip_inline_styles` (`backend/server.py:594-615`):

```python
def _strip_inline_styles(elements):
    """Extract inline style attributes into deduplicated CSS classes, one
    stable class per source element. An element's root style="..." becomes
    .el-<id>; any additional style="..." attributes nested inside that
    same element's HTML (e.g. a hero block with several styled child divs)
    become .el-<id>__1, .el-<id>__2, ... in encounter order. Stable,
    id-based naming (rather than a global sequential counter) lets the
    live CSS-pane editor round-trip an edit back onto the correct element
    even after blocks are reordered, added, or removed.
    Returns (html_with_classes, css_string)."""
    rules = []
    out_html_parts = []

    def make_repl(el_id):
        counter = {"n": 0}

        def repl(match):
            n = counter["n"]
            counter["n"] += 1
            cls = f"el-{el_id}" if n == 0 else f"el-{el_id}__{n}"
            declarations = match.group(1)
            rules.append(f".{cls} {{ {declarations} }}")
            if "grid-template-columns" in declarations:
                rules.append(f"@media (max-width: 768px) {{ .{cls} {{ grid-template-columns: 1fr !important; }} }}")
            return f'class="{cls}"'
        return repl

    for el in elements:
        el_id = el.get("id") or ""
        html = el.get("html", "")
        out_html_parts.append(re.sub(r'style="([^"]*)"', make_repl(el_id), html))

    return "\n".join(out_html_parts), "\n".join(rules)
```

Update the call site in `_build_project_bundle` — replace the first two lines of its body:

```python
def _build_project_bundle(doc: dict, html_filename: str, css_filename: str):
    """Return (index_html, styles_css) using the doc's data."""
    cleaned_body, css_body = _strip_inline_styles(doc.get("elements") or [])
```

(This removes the old `body = "\n".join(...)` local variable — `_strip_inline_styles` now does the per-element join internally. Everything below that line in `_build_project_bundle`, including the `custom_js` handling from Task 1, stays as-is.)

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd backend && source .venv/bin/activate && python -m pytest tests/test_responsive_export.py tests/test_custom_js.py -v`
Expected: all PASS.

- [ ] **Step 6: Run the full backend test suite**

Run: `cd backend && source .venv/bin/activate && python -m pytest -q`
Expected: all PASS (confirms nothing else in the backend depended on the old `el-0` counter naming or the old string-argument signature).

- [ ] **Step 7: Commit**

```bash
git add backend/server.py backend/tests/test_responsive_export.py
git commit -m "Make _strip_inline_styles emit stable id-based CSS classes (backend)"
```

---

### Task 4: Frontend id-stable `stripInlineStyles` rewrite + CSS-pane back-parser

**Files:**
- Modify: `frontend/src/lib/exportHtml.js:38-55, 108-110` (`stripInlineStyles`, `buildCleanExport`'s call site)
- Create: `frontend/src/lib/cssPaneSync.js`
- Create: `frontend/src/lib/__tests__/cssPaneSync.test.mjs`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: `export const stripInlineStyles = (elements) => ({ html, css })` (was module-private, took a string — now exported, takes an elements array, same id-based naming as Task 3's backend version). `parseCssPane(css) -> Map<elementId, string[]>`, `applyCssPaneToElement(html, declarationsByOccurrence) -> string`, `reconcileElementsFromCss(elements, css) -> elements` in `frontend/src/lib/cssPaneSync.js` — `reconcileElementsFromCss` is what `CodeView.jsx` (Task 7) calls on every CSS-pane edit.

- [ ] **Step 1: Rewrite and export `stripInlineStyles`**

In `frontend/src/lib/exportHtml.js`, replace the module-private `stripInlineStyles` (lines 38-55):

```js
export const stripInlineStyles = (elements) => {
  // Extract style attributes into deduplicated CSS classes, one stable
  // class per source element (mirrors backend/server.py's
  // _strip_inline_styles — keep both in sync). An element's root
  // style="..." becomes .el-<id>; any additional style="..." attributes
  // nested inside that same element's HTML become .el-<id>__1,
  // .el-<id>__2, ... in encounter order. A rule that sets
  // grid-template-columns also gets a companion responsive override —
  // RESPONSIVE_CSS's generic [style*="grid-template-columns"] selector
  // can't match here since the style attribute this function removes is
  // exactly what it targets.
  const rules = [];
  const outParts = elements.map((el) => {
    const elId = el.id || "";
    let n = 0;
    return (el.html || "").replace(/style="([^"]*)"/g, (_, styles) => {
      const cls = n === 0 ? `el-${elId}` : `el-${elId}__${n}`;
      n++;
      rules.push(`.${cls} { ${styles} }`);
      if (styles.includes("grid-template-columns")) {
        rules.push(`@media (max-width: 768px) { .${cls} { grid-template-columns: 1fr !important; } }`);
      }
      return `class="${cls}"`;
    });
  });
  return { html: outParts.join("\n"), css: rules.join("\n") };
};
```

Update `buildCleanExport`'s call site (was `stripInlineStyles(body)`, using the now-unused local `body` var):

```js
export const buildCleanExport = (project) => {
  const { html: cleaned, css } = stripInlineStyles(project.elements);
```

(Delete the old `const body = project.elements.map((e) => e.html).join("\n");` line directly above it in `buildCleanExport` — it's no longer used there. `buildStandaloneHtml`'s own separate `body` variable is untouched.)

- [ ] **Step 2: Write the failing tests for `stripInlineStyles`**

Add to `frontend/src/lib/__tests__/exportHtml.test.mjs`:

```js
test("stripInlineStyles emits a stable id-based root class", async () => {
  const { stripInlineStyles } = await import("../exportHtml.js");
  const elements = [{ id: "el_abc123", html: '<div style="color:red;">Hi</div>' }];
  const { html, css } = stripInlineStyles(elements);
  assert.ok(html.includes('class="el-el_abc123"'));
  assert.ok(css.includes(".el-el_abc123 { color:red; }"));
});

test("stripInlineStyles suffixes nested style attrs within the same element", async () => {
  const { stripInlineStyles } = await import("../exportHtml.js");
  const elements = [{ id: "el_1", html: '<section style="padding:20px;"><h1 style="color:blue;">Hi</h1></section>' }];
  const { html, css } = stripInlineStyles(elements);
  assert.ok(html.includes('class="el-el_1"'));
  assert.ok(html.includes('class="el-el_1__1"'));
  assert.ok(css.includes(".el-el_1 { padding:20px; }"));
  assert.ok(css.includes(".el-el_1__1 { color:blue; }"));
});

test("stripInlineStyles keeps ids stable across element reordering", async () => {
  const { stripInlineStyles } = await import("../exportHtml.js");
  const a = { id: "el_a", html: '<div style="color:red;">A</div>' };
  const b = { id: "el_b", html: '<div style="color:blue;">B</div>' };
  const ab = stripInlineStyles([a, b]);
  const ba = stripInlineStyles([b, a]);
  assert.ok(ab.html.includes('class="el-el_a"') && ba.html.includes('class="el-el_a"'));
  assert.ok(ab.html.includes('class="el-el_b"') && ba.html.includes('class="el-el_b"'));
});
```

**Note:** `exportHtml.js` imports `file-saver`, which can't be loaded by plain Node in this repo (established CJS/ESM interop gap — see the file header comment in `exportHtml.test.mjs`'s sibling tests). Before writing these three tests, confirm the gap still applies by running `node --test src/lib/__tests__/exportHtml.test.mjs` once — if the dynamic `import("../exportHtml.js")` throws a `file-saver`-related error, delete these three tests and instead add pure duplicated-logic pattern tests (same style as the existing `stripInlineStyles pattern adds…`/`…skips…` tests already in this file) asserting the same id-based behavior without importing the real module. Do not skip verifying this behavior — pick whichever of the two forms actually runs.

- [ ] **Step 3: Run the whole file to verify current state**

Run: `cd frontend && node --test src/lib/__tests__/exportHtml.test.mjs`
Expected: either the three new tests FAIL against the real (not-yet-rewritten) `stripInlineStyles` (if the dynamic import works), or — per the Step 2 note — you've already replaced them with pattern tests that pass trivially before the rewrite and will need re-verifying after.

- [ ] **Step 4: Create the CSS-pane back-parser**

Create `frontend/src/lib/cssPaneSync.js`:

```js
// Parses CSS-pane text (the .el-<id> / .el-<id>__n rules stripInlineStyles
// produces, see exportHtml.js) back into per-element style-attribute
// updates, so a live edit in the CSS pane can be written back onto the
// right element and, for elements with multiple style="..." attributes,
// the right *occurrence* within that element's HTML.
//
// Element ids always look like "el_" + 8 base36 chars (see uid() in
// Builder.jsx) and never contain a double underscore, so the "__N"
// occurrence suffix can't be confused with part of the id itself.
const RULE_RE = /\.el-(el_[0-9a-z]+)(?:__(\d+))?\s*\{([^}]*)\}/g;

// Returns a Map: elementId -> Array of declaration strings ordered by
// occurrence index (index 0 = root style, 1 = first nested style, ...).
export const parseCssPane = (css) => {
  const byId = new Map();
  let m;
  RULE_RE.lastIndex = 0;
  while ((m = RULE_RE.exec(css))) {
    const [, elId, occStr, declarations] = m;
    const occ = occStr ? Number(occStr) : 0;
    if (!byId.has(elId)) byId.set(elId, []);
    byId.get(elId)[occ] = declarations.trim();
  }
  return byId;
};

// Applies parsed per-element declarations back onto that element's HTML,
// replacing each style="..." attribute in encounter order (occurrence 0
// = root, 1 = first nested, ...). Occurrences the CSS pane didn't mention
// (undefined in the array — e.g. the user deleted that rule) are left
// untouched rather than blanked, so an incomplete/mid-edit CSS pane can't
// wipe out styling it didn't actually touch.
export const applyCssPaneToElement = (html, declarationsByOccurrence) => {
  if (!declarationsByOccurrence || declarationsByOccurrence.length === 0) return html;
  let n = 0;
  return html.replace(/style="([^"]*)"/g, (full) => {
    const decl = declarationsByOccurrence[n];
    n++;
    return decl === undefined ? full : `style="${decl}"`;
  });
};

// Reconciles a full CSS-pane edit back onto the elements array. Elements
// with no matching rules in the pane (e.g. the user deleted their whole
// rule block) are returned unchanged, not stripped of their style.
export const reconcileElementsFromCss = (elements, css) => {
  const byId = parseCssPane(css);
  return elements.map((el) => {
    const decls = byId.get(el.id);
    if (!decls) return el;
    return { ...el, html: applyCssPaneToElement(el.html, decls) };
  });
};
```

- [ ] **Step 5: Write tests for the CSS-pane back-parser**

Create `frontend/src/lib/__tests__/cssPaneSync.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { parseCssPane, applyCssPaneToElement, reconcileElementsFromCss } from "../cssPaneSync.js";

test("parseCssPane reads a single root rule", () => {
  const css = ".el-el_abc123 { color: red; padding: 4px; }";
  const parsed = parseCssPane(css);
  assert.deepEqual(parsed.get("el_abc123"), ["color: red; padding: 4px;"]);
});

test("parseCssPane reads a root rule plus nested-occurrence rules in order", () => {
  const css = `
.el-el_1 { padding: 20px; }
.el-el_1__1 { color: blue; }
.el-el_1__2 { margin: 0; }
`;
  const parsed = parseCssPane(css);
  assert.deepEqual(parsed.get("el_1"), ["padding: 20px;", "color: blue;", "margin: 0;"]);
});

test("parseCssPane handles multiple elements independently", () => {
  const css = ".el-el_a { color: red; }\n.el-el_b { color: blue; }";
  const parsed = parseCssPane(css);
  assert.deepEqual(parsed.get("el_a"), ["color: red;"]);
  assert.deepEqual(parsed.get("el_b"), ["color: blue;"]);
});

test("applyCssPaneToElement replaces the root style in place", () => {
  const html = '<div style="color:red;">Hi</div>';
  const out = applyCssPaneToElement(html, ["color: blue;"]);
  assert.equal(out, '<div style="color: blue;">Hi</div>');
});

test("applyCssPaneToElement replaces nested styles by occurrence order", () => {
  const html = '<section style="padding:20px;"><h1 style="color:red;">Hi</h1></section>';
  const out = applyCssPaneToElement(html, ["padding: 8px;", "color: green;"]);
  assert.equal(out, '<section style="padding: 8px;"><h1 style="color: green;">Hi</h1></section>');
});

test("applyCssPaneToElement leaves an occurrence untouched when the pane omitted it", () => {
  const html = '<section style="padding:20px;"><h1 style="color:red;">Hi</h1></section>';
  const declarations = [];
  declarations[1] = "color: green;"; // index 0 deliberately left undefined
  const out = applyCssPaneToElement(html, declarations);
  assert.equal(out, '<section style="padding:20px;"><h1 style="color: green;">Hi</h1></section>');
});

test("reconcileElementsFromCss updates only elements with matching rules", () => {
  const elements = [
    { id: "el_a", html: '<div style="color:red;">A</div>' },
    { id: "el_b", html: '<div style="color:blue;">B</div>' },
  ];
  const css = ".el-el_a { color: green; }";
  const next = reconcileElementsFromCss(elements, css);
  assert.equal(next[0].html, '<div style="color: green;">A</div>');
  assert.equal(next[1].html, '<div style="color:blue;">B</div>'); // unchanged, no rule for el_b
});
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd frontend && node --test src/lib/__tests__/exportHtml.test.mjs src/lib/__tests__/cssPaneSync.test.mjs`
Expected: all PASS.

- [ ] **Step 7: Run the full frontend pure-function suite**

Run: `cd frontend && node --test src/lib/__tests__/*.test.mjs`
Expected: all PASS (confirms the `buildCleanExport` call-site change didn't break anything else in the suite).

- [ ] **Step 8: Commit**

```bash
git add frontend/src/lib/exportHtml.js frontend/src/lib/cssPaneSync.js frontend/src/lib/__tests__/exportHtml.test.mjs frontend/src/lib/__tests__/cssPaneSync.test.mjs
git commit -m "Make stripInlineStyles emit stable id-based CSS classes + add CSS-pane back-parser (frontend)"
```

---

### Task 5: HTML-pane reconciliation pure function

**Files:**
- Create: `frontend/src/lib/htmlPaneSync.js`
- Create: `frontend/src/lib/__tests__/htmlPaneSync.test.mjs`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: `reconcileElementsFromHtml(currentElements, parsedNodes, uidFn) -> elements`, where `parsedNodes` is an array of `{ id: string|null, outerHTML: string }` already-parsed top-level nodes. **Actual HTML parsing** (via the browser's `DOMParser`) is NOT part of this module — it happens inline in `CodeView.jsx` (Task 7), which is browser-only and not unit-testable in this sandbox (no DOM implementation like jsdom is installed, and the Global Constraints forbid adding one). This module is the pure, DOM-independent half: given already-parsed `{id, outerHTML}` objects, decide what the new `elements` array should be.

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/lib/__tests__/htmlPaneSync.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { reconcileElementsFromHtml } from "../htmlPaneSync.js";

const fakeUid = (() => {
  let n = 0;
  return () => `el_new${n++}`;
})();

test("a parsed node whose id matches an existing element updates that element's html in place", () => {
  const current = [{ id: "el_a", html: '<div id="el_a" style="color:red;">old</div>' }];
  const parsed = [{ id: "el_a", outerHTML: '<div id="el_a" style="color:blue;">new</div>' }];
  const next = reconcileElementsFromHtml(current, parsed, fakeUid);
  assert.deepEqual(next, [{ id: "el_a", html: '<div id="el_a" style="color:blue;">new</div>' }]);
});

test("a parsed node with no id becomes a new element with a fresh id", () => {
  const current = [];
  const parsed = [{ id: null, outerHTML: "<p>brand new</p>" }];
  const next = reconcileElementsFromHtml(current, parsed, fakeUid);
  assert.equal(next.length, 1);
  assert.ok(next[0].id.startsWith("el_new"));
  assert.equal(next[0].html, "<p>brand new</p>");
});

test("a parsed node with an unrecognized id becomes a new element rather than matching nothing", () => {
  const current = [{ id: "el_a", html: '<div id="el_a">A</div>' }];
  const parsed = [
    { id: "el_a", outerHTML: '<div id="el_a">A</div>' },
    { id: "el_unknown", outerHTML: '<div id="el_unknown">B</div>' },
  ];
  const next = reconcileElementsFromHtml(current, parsed, fakeUid);
  assert.equal(next.length, 2);
  assert.equal(next[0].id, "el_a");
  assert.notEqual(next[1].id, "el_unknown"); // gets a fresh id, not the DOM id it happened to have
});

test("an existing element whose id no longer appears in parsedNodes is removed", () => {
  const current = [
    { id: "el_a", html: '<div id="el_a">A</div>' },
    { id: "el_b", html: '<div id="el_b">B</div>' },
  ];
  const parsed = [{ id: "el_a", outerHTML: '<div id="el_a">A</div>' }];
  const next = reconcileElementsFromHtml(current, parsed, fakeUid);
  assert.equal(next.length, 1);
  assert.equal(next[0].id, "el_a");
});

test("the returned array follows parsedNodes order, including a reorder", () => {
  const current = [
    { id: "el_a", html: '<div id="el_a">A</div>' },
    { id: "el_b", html: '<div id="el_b">B</div>' },
  ];
  const parsed = [
    { id: "el_b", outerHTML: '<div id="el_b">B</div>' },
    { id: "el_a", outerHTML: '<div id="el_a">A</div>' },
  ];
  const next = reconcileElementsFromHtml(current, parsed, fakeUid);
  assert.deepEqual(next.map((e) => e.id), ["el_b", "el_a"]);
});

test("preserves extra fields (hidden, zIndex) on an updated element instead of dropping them", () => {
  const current = [{ id: "el_a", html: '<div id="el_a">old</div>', hidden: true, zIndex: 3 }];
  const parsed = [{ id: "el_a", outerHTML: '<div id="el_a">new</div>' }];
  const next = reconcileElementsFromHtml(current, parsed, fakeUid);
  assert.deepEqual(next, [{ id: "el_a", html: '<div id="el_a">new</div>', hidden: true, zIndex: 3 }]);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && node --test src/lib/__tests__/htmlPaneSync.test.mjs`
Expected: FAIL with a module-not-found error — `htmlPaneSync.js` doesn't exist yet.

- [ ] **Step 3: Implement `reconcileElementsFromHtml`**

Create `frontend/src/lib/htmlPaneSync.js`:

```js
// Reconciles the project's elements array against a fresh set of top-level
// nodes parsed from the HTML pane. Takes already-parsed nodes (plain
// {id, outerHTML} objects) rather than doing the parsing itself, so this
// stays pure and DOM-independent — actual parsing (via the browser's
// DOMParser) happens in CodeView.jsx and isn't unit-tested, since no DOM
// implementation is installed in this sandbox (see
// docs/superpowers/specs/2026-08-18-codepen-editor-design.md).
//
// Matching rules:
// - A parsed node whose id matches an existing element updates that
//   element's html in place, preserving any other fields already on it
//   (hidden, zIndex, ...).
// - A parsed node with no id, or an id that doesn't match any existing
//   element, becomes a new element with a fresh id from uidFn() — even if
//   the DOM happened to assign it an id attribute value, since that value
//   didn't come from this app's id space and could collide.
// - An existing element whose id doesn't appear in parsedNodes at all is
//   removed (the user deleted it from the HTML pane).
// - The returned array follows the ORDER of parsedNodes, so reordering
//   markup in the HTML pane reorders the canvas too.
export const reconcileElementsFromHtml = (currentElements, parsedNodes, uidFn) => {
  const byId = new Map(currentElements.map((el) => [el.id, el]));
  return parsedNodes.map((node) => {
    const existing = node.id && byId.has(node.id) ? byId.get(node.id) : null;
    if (existing) {
      return { ...existing, html: node.outerHTML };
    }
    return { id: uidFn(), html: node.outerHTML };
  });
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && node --test src/lib/__tests__/htmlPaneSync.test.mjs`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/htmlPaneSync.js frontend/src/lib/__tests__/htmlPaneSync.test.mjs
git commit -m "Add pure HTML-pane reconciliation function for live code-editor sync"
```

---

### Task 6: `CodeEditor.jsx` — Ctrl+S keybinding

**Files:**
- Modify: `frontend/src/components/builder/CodeEditor.jsx`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: new optional `onSave` prop on `CodeEditor`. When provided, pressing Ctrl+S (or Cmd+S on Mac — `monaco.KeyMod.CtrlCmd` covers both) inside that editor instance calls it instead of triggering the browser's native save-page dialog.

- [ ] **Step 1: Add the `onSave` prop and wire the Monaco keybinding**

In `frontend/src/components/builder/CodeEditor.jsx`, add `onSave` to the destructured props and register the command in `handleMount`:

```jsx
export const CodeEditor = ({ value, onChange, language = "html", readOnly = false, height = "100%", testId, onSave }) => {
  const editorRef = useRef(null);

  const handleMount = (editor, monaco) => {
    editorRef.current = editor;
    if (onSave) {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, onSave);
    }
    if (!emmetRegistered) {
```

(The rest of `handleMount` — Emmet registration, theme setup — is unchanged; this just adds the new `if (onSave)` block right after `editorRef.current = editor;` and before the existing Emmet block.)

- [ ] **Step 2: Verify with a syntax check**

Run: `cd frontend && node -e "require('@babel/core').transformFileSync('src/components/builder/CodeEditor.jsx', { presets: ['@babel/preset-react'] }); console.log('OK')"`
Expected: `OK` (this file has no pure logic to unit-test — it's a thin Monaco wiring wrapper, verified by this parse check now and by the full production build in Task 7's verification step, consistent with how `CodeEditor.jsx`'s prior Emmet/Monaco-CDN changes in this same branch were verified).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/builder/CodeEditor.jsx
git commit -m "Add Ctrl+S keybinding support to CodeEditor"
```

---

### Task 7: `CodeView.jsx` redesign — four live-synced tabs + preview pane

**Files:**
- Modify: `frontend/src/components/builder/CodeView.jsx` (full rewrite)

**Interfaces:**
- Consumes: `stripInlineStyles` (Task 4, from `@/lib/exportHtml`), `reconcileElementsFromCss` (Task 4, from `@/lib/cssPaneSync`), `reconcileElementsFromHtml` (Task 5, from `@/lib/htmlPaneSync`), `onSave` prop on `CodeEditor` (Task 6), `buildStandaloneHtml` (existing, from `@/lib/exportHtml`).
- Produces: new `CodeView` prop interface — `{ project, elements, onElementsChange, headHtml, onHeadHtmlChange, customJs, onCustomJsChange, onSave }`. This **replaces** the old `{ project, headHtml, onHeadHtmlChange }` interface; Task 8 updates the one call site in `Builder.jsx` to match.

- [ ] **Step 1: Replace `CodeView.jsx` entirely**

```jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { CodeEditor } from "./CodeEditor";
import { buildStandaloneHtml, stripInlineStyles } from "@/lib/exportHtml";
import { reconcileElementsFromCss } from "@/lib/cssPaneSync";
import { reconcileElementsFromHtml } from "@/lib/htmlPaneSync";
import { MONACO_LANGUAGES } from "@/lib/monacoLanguages";

const SYNC_DEBOUNCE_MS = 400;

const uidForNewBlocks = () => "el_" + Math.random().toString(36).slice(2, 10);

// Browser-only HTML parsing (DOMParser) — deliberately not a pure/tested
// module, see htmlPaneSync.js's header comment for why. Produces the
// {id, outerHTML} shape reconcileElementsFromHtml expects.
const parseTopLevelNodes = (html) => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return Array.from(doc.body.children).map((el) => ({ id: el.id || null, outerHTML: el.outerHTML }));
};

const joinElementsHtml = (elements) => elements.map((e) => e.html).join("\n");

// Monaco-powered CodePen-style editor: four live-synced tabs (HTML, CSS,
// JS, Head) on the left, a live preview iframe on the right. Editing the
// HTML or CSS tab writes straight back into the project's elements array
// (debounced); editing JS edits the page's custom_js field; editing Head
// edits head_html exactly as it always has.
export const CodeView = ({ project, elements, onElementsChange, headHtml, onHeadHtmlChange, customJs, onCustomJsChange, onSave }) => {
  const [tab, setTab] = useState("html"); // html | css | js | head
  const [headLang, setHeadLang] = useState("html");

  const [htmlText, setHtmlText] = useState(() => joinElementsHtml(elements));
  const [cssText, setCssText] = useState(() => stripInlineStyles(elements).css);

  // Tracks the last `elements` value THIS component itself produced, so
  // the sync effect below can tell "an external change happened elsewhere
  // (Design-mode canvas edit, undo/redo, page switch) — regenerate the
  // pane text" apart from "this is our own debounced write echoing back
  // through props — don't regenerate, or we'd clobber in-progress typing
  // in the other pane."
  const lastAppliedElementsRef = useRef(elements);
  const htmlDebounceRef = useRef(null);
  const cssDebounceRef = useRef(null);

  useEffect(() => {
    if (elements === lastAppliedElementsRef.current) return;
    lastAppliedElementsRef.current = elements;
    setHtmlText(joinElementsHtml(elements));
    setCssText(stripInlineStyles(elements).css);
  }, [elements]);

  useEffect(() => () => {
    clearTimeout(htmlDebounceRef.current);
    clearTimeout(cssDebounceRef.current);
  }, []);

  const commitElements = (next) => {
    lastAppliedElementsRef.current = next;
    onElementsChange(next);
  };

  const onHtmlChange = (value) => {
    setHtmlText(value);
    clearTimeout(htmlDebounceRef.current);
    htmlDebounceRef.current = setTimeout(() => {
      commitElements(reconcileElementsFromHtml(elements, parseTopLevelNodes(value), uidForNewBlocks));
    }, SYNC_DEBOUNCE_MS);
  };

  const onCssChange = (value) => {
    setCssText(value);
    clearTimeout(cssDebounceRef.current);
    cssDebounceRef.current = setTimeout(() => {
      commitElements(reconcileElementsFromCss(elements, value));
    }, SYNC_DEBOUNCE_MS);
  };

  // Flushes any pending debounced pane edit immediately, so Ctrl+S can't
  // race a still-pending sync and save stale elements.
  const flushPending = () => {
    if (htmlDebounceRef.current) {
      clearTimeout(htmlDebounceRef.current);
      htmlDebounceRef.current = null;
      commitElements(reconcileElementsFromHtml(elements, parseTopLevelNodes(htmlText), uidForNewBlocks));
    }
    if (cssDebounceRef.current) {
      clearTimeout(cssDebounceRef.current);
      cssDebounceRef.current = null;
      commitElements(reconcileElementsFromCss(elements, cssText));
    }
  };
  const handleSave = () => { flushPending(); onSave && onSave(); };

  // Live preview, debounced on the same cycle regardless of which tab
  // changed (including Head/JS, which aren't behind the HTML/CSS
  // debounces above) so typing doesn't thrash an iframe reload.
  const [previewSrcDoc, setPreviewSrcDoc] = useState(() =>
    buildStandaloneHtml({ ...project, elements, head_html: headHtml, custom_js: customJs })
  );
  const previewDebounceRef = useRef(null);
  useEffect(() => {
    clearTimeout(previewDebounceRef.current);
    previewDebounceRef.current = setTimeout(() => {
      setPreviewSrcDoc(buildStandaloneHtml({ ...project, elements, head_html: headHtml, custom_js: customJs }));
    }, SYNC_DEBOUNCE_MS);
    return () => clearTimeout(previewDebounceRef.current);
  }, [project, elements, headHtml, customJs]);

  const Tab = ({ id, label }) => (
    <button
      onClick={() => setTab(id)}
      className={`px-2.5 py-1 rounded text-[11px] border ${tab === id ? "bg-blue-600 border-blue-500 text-white" : "border-[#2B2B2B] text-gray-400 hover:text-gray-200"}`}
      data-testid={`codeview-tab-${id}`}
    >{label}</button>
  );

  return (
    <div className="flex-1 bg-[#050505] overflow-hidden flex" data-testid="code-view">
      <div className="w-1/2 border-r border-[#2B2B2B] flex flex-col">
        <div className="px-3 py-2 border-b border-[#2B2B2B] flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Tab id="html" label="HTML" />
            <Tab id="css" label="CSS" />
            <Tab id="js" label="JS" />
            <Tab id="head" label="Head" />
          </div>
          {tab === "head" && <LangSelector value={headLang} onChange={setHeadLang} testId="head-lang" />}
        </div>
        <div className="flex-1 min-h-0">
          {tab === "html" && (
            <CodeEditor value={htmlText} onChange={onHtmlChange} language="html" onSave={handleSave} testId="code-html-editor" />
          )}
          {tab === "css" && (
            <CodeEditor value={cssText} onChange={onCssChange} language="css" onSave={handleSave} testId="code-css-editor" />
          )}
          {tab === "js" && (
            <CodeEditor value={customJs} onChange={onCustomJsChange} language="javascript" onSave={handleSave} testId="code-js-editor" />
          )}
          {tab === "head" && (
            <CodeEditor value={headHtml} onChange={onHeadHtmlChange} language={headLang} onSave={handleSave} testId="head-html-editor" />
          )}
        </div>
      </div>
      <div className="w-1/2 flex flex-col">
        <div className="px-3 py-2 border-b border-[#2B2B2B] text-[11px] uppercase tracking-wider text-gray-400">Preview</div>
        <div className="flex-1 min-h-0 bg-white">
          {/* allow-same-origin is intentionally NOT set here — same
              rationale as Builder.jsx's live-preview iframe: combined
              with allow-scripts it would give this srcDoc content the
              app's real origin instead of an opaque one, letting
              custom_js reach back into the builder's DOM/localStorage
              via window.parent. allow-scripts alone keeps the origin
              opaque. */}
          <iframe
            title="code-preview"
            srcDoc={previewSrcDoc}
            sandbox="allow-forms allow-scripts"
            style={{ width: "100%", height: "100%", border: 0 }}
            data-testid="code-preview-iframe"
          />
        </div>
      </div>
    </div>
  );
};

const LangSelector = ({ value, onChange, testId }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="bg-[#0D0D0D] border border-[#2B2B2B] rounded px-1.5 py-0.5 text-[10px] text-gray-200 outline-none focus:border-blue-500 normal-case tracking-normal"
    data-testid={testId}
  >
    {MONACO_LANGUAGES.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
  </select>
);
```

- [ ] **Step 2: Syntax-check the file**

Run: `cd frontend && node -e "require('@babel/core').transformFileSync('src/components/builder/CodeView.jsx', { presets: ['@babel/preset-react'] }); console.log('OK')"`
Expected: `OK`.

**Do not** run the frontend build yet — `Builder.jsx` still passes the *old* `CodeView` props (`project`, `headHtml`, `onHeadHtmlChange` only), so `elements`/`onElementsChange`/`customJs`/`onCustomJsChange`/`onSave` will all be `undefined` until Task 8 updates the call site. A build at this point would succeed (React doesn't fail on undefined props at compile time) but the component would be broken at runtime — that's expected and resolved by Task 8, not a sign of a mistake here.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/builder/CodeView.jsx
git commit -m "Redesign CodeView into four live-synced tabs (HTML/CSS/JS/Head) + preview pane"
```

---

### Task 8: `Builder.jsx` wiring — `custom_js` state + `CodeView` integration

**Files:**
- Modify: `frontend/src/pages/Builder.jsx`

**Interfaces:**
- Consumes: `CodeView`'s new prop interface (Task 7): `{ project, elements, onElementsChange, headHtml, onHeadHtmlChange, customJs, onCustomJsChange, onSave }`.
- Produces: nothing further downstream — this is the final integration task.

This task threads a new `customJs` state through every place `headHtml` already flows (same pattern, added alongside it), and updates the one `<CodeView>` call site to the new prop interface. Every numbered edit below is a small, exact change — apply all of them in this one pass since they're the same one-line pattern repeated at each of `headHtml`'s existing call sites (per this codebase's convention: `head_html` is mirrored at the top level for backward compatibility per the comment at line 151, and `custom_js` follows the identical pattern).

- [ ] **Step 1: Add `customJs` state**

At `frontend/src/pages/Builder.jsx:68`, right after `const [headHtml, setHeadHtml] = useState("");`:

```js
  const [customJs, setCustomJs] = useState("");
```

- [ ] **Step 2: Add `custom_js` to the initial `pages` default and every page-shape object literal**

At line 80 (initial `pages` state):

```js
  const [pages, setPages] = useState(() => [{ id: "home", name: "Home", slug: "index", status: "draft", seo: {}, elements: [], head_html: "", canvas_bg: "#ffffff", fonts: [], custom_js: "" }]);
```

In `newPage` (around line 175), add `custom_js: ""` to the pushed page object:

```js
      return [...persisted, { id, name, slug: name.toLowerCase().replace(/\s+/g, "-"), status: "draft", seo: {}, elements: [], head_html: "", canvas_bg: "#ffffff", fonts: [], custom_js: "" }];
```

In `addPageFromLayout` (around line 191), add `custom_js: ""` to its pushed page object:

```js
      return [...persisted, { id, name: layout.label, slug: layout.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""), status: "draft", seo: {}, elements: els, head_html: "", canvas_bg: bg, fonts: fnts, custom_js: "" }];
```

In `onLoadProjectData`'s fallback single-page default (around line 373):

```js
    const src = (data.pages && data.pages.length) ? data.pages : [{ id: uid(), name: "Home", slug: "index", status: "draft", seo: {}, elements: [], head_html: "", canvas_bg: "#ffffff", fonts: [], custom_js: "" }];
```

- [ ] **Step 3: Add `custom_js` to `doc` and undo/redo**

At line 105 (`doc` useMemo):

```js
  const doc = useMemo(() => ({ elements, canvasBg, headHtml, fonts, files, customJs }), [elements, canvasBg, headHtml, fonts, files, customJs]);
```

At line 127 (`undo`):

```js
    setElements(prev.elements); setCanvasBg(prev.canvasBg); setHeadHtml(prev.headHtml); setFonts(prev.fonts); setFiles(prev.files || []); setCustomJs(prev.customJs || "");
```

At line 136 (`redo`):

```js
    setElements(next.elements); setCanvasBg(next.canvasBg); setHeadHtml(next.headHtml); setFonts(next.fonts); setFiles(next.files || []); setCustomJs(next.customJs || "");
```

- [ ] **Step 4: Add `custom_js` to the active-page auto-sync effect**

At lines 142-144:

```js
  useEffect(() => {
    setPages((ps) => ps.map((p) => p.id === activePageId ? { ...p, elements, head_html: headHtml, canvas_bg: canvasBg, fonts, custom_js: customJs } : p));
  }, [elements, headHtml, canvasBg, fonts, customJs, activePageId]);
```

- [ ] **Step 5: Add `custom_js` to the `project` object**

At line 152 (inside the `project` object literal):

```js
    elements, head_html: headHtml, canvas_bg: canvasBg, fonts, files, custom_js: customJs,
```

- [ ] **Step 6: Add `custom_js` to `switchPage`, `newPage`, `addPageFromLayout`, `removePage`**

In `switchPage` (around lines 158-169), add `custom_js: customJs` to the persisted-page map and `setCustomJs(target.custom_js || "")` alongside the other setters:

```js
  const switchPage = (id) => {
    const target = pages.find((p) => p.id === id);
    if (!target || id === activePageId) return;
    setPages((ps) => ps.map((p) => p.id === activePageId ? { ...p, elements, head_html: headHtml, canvas_bg: canvasBg, fonts, custom_js: customJs } : p));
    setActivePageId(id);
    setElements(target.elements || []);
    setHeadHtml(target.head_html || "");
    setCanvasBg(target.canvas_bg || "#ffffff");
    setFonts(target.fonts || []);
    setCustomJs(target.custom_js || "");
    setSelectedId(null);
  };
```

In `newPage` (around lines 170-183), add `setCustomJs("")` alongside the other resets, and `custom_js: customJs` to its persisted-page map:

```js
  const newPage = () => {
    const id = uid();
    const name = `Page ${pages.length + 1}`;
    setPages((ps) => {
      const persisted = ps.map((p) => p.id === activePageId ? { ...p, elements, head_html: headHtml, canvas_bg: canvasBg, fonts, custom_js: customJs } : p);
      return [...persisted, { id, name, slug: name.toLowerCase().replace(/\s+/g, "-"), status: "draft", seo: {}, elements: [], head_html: "", canvas_bg: "#ffffff", fonts: [], custom_js: "" }];
    });
    setActivePageId(id);
    setElements([]);
    setHeadHtml("");
    setCanvasBg("#ffffff");
    setFonts([]);
    setCustomJs("");
    setSelectedId(null);
  };
```

In `addPageFromLayout` (around lines 184-200), add `setCustomJs("")` and `custom_js: customJs` to its persisted-page map:

```js
  const addPageFromLayout = (layout) => {
    const id = uid();
    const els = (layout.blocks || []).map((html) => ({ id: uid(), html }));
    const bg = layout.canvasBg || "#ffffff";
    const fnts = layout.fonts || [];
    setPages((ps) => {
      const persisted = ps.map((p) => p.id === activePageId ? { ...p, elements, head_html: headHtml, canvas_bg: canvasBg, fonts, custom_js: customJs } : p);
      return [...persisted, { id, name: layout.label, slug: layout.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""), status: "draft", seo: {}, elements: els, head_html: "", canvas_bg: bg, fonts: fnts, custom_js: "" }];
    });
    setActivePageId(id);
    setElements(els);
    setHeadHtml("");
    setCanvasBg(bg);
    setFonts(fnts);
    setCustomJs("");
    setSelectedId(null);
    toast.success(`Added "${layout.label}" page`);
  };
```

In `removePage` (around lines 201-214), add `setCustomJs(t.custom_js || "")` alongside its other setters:

```js
  const removePage = (id) => {
    if (pages.length <= 1) { toast.error("Keep at least one page"); return; }
    const next = pages.filter((p) => p.id !== id);
    setPages(next);
    if (activePageId === id) {
      const t = next[0];
      setActivePageId(t.id);
      setElements(t.elements || []);
      setHeadHtml(t.head_html || "");
      setCanvasBg(t.canvas_bg || "#ffffff");
      setFonts(t.fonts || []);
      setCustomJs(t.custom_js || "");
      setSelectedId(null);
    }
  };
```

- [ ] **Step 7: Add `custom_js` to `onLoadProjectData`, `loadProject`, `loadFromTemplate`**

In `onLoadProjectData` (around lines 369-384), add `setCustomJs(nextPages[0].custom_js || "")`:

```js
  const onLoadProjectData = (data) => {
    if (!data || !data._webdojo) { toast.error("That file isn't a Web Dojo project"); return; }
    setProjectId(null);
    setProjectName(data.name || "Imported project");
    const src = (data.pages && data.pages.length) ? data.pages : [{ id: uid(), name: "Home", slug: "index", status: "draft", seo: {}, elements: [], head_html: "", canvas_bg: "#ffffff", fonts: [], custom_js: "" }];
    const nextPages = src.map((pg) => ({ ...pg, id: uid() }));
    setPages(nextPages);
    setActivePageId(nextPages[0].id);
    setElements(nextPages[0].elements || []);
    setHeadHtml(nextPages[0].head_html || "");
    setCanvasBg(nextPages[0].canvas_bg || "#ffffff");
    setFonts(nextPages[0].fonts || []);
    setCustomJs(nextPages[0].custom_js || "");
    setFiles(data.files || []);
    setSelectedId(null); setPast([]); setFuture([]);
    toast.success("Project imported");
  };
```

In `loadProject` (around lines 413-456), add `custom_js: pg.custom_js || ""` to the page-hydration map in both the multi-page and legacy-single-page branches, and `setCustomJs(active.custom_js || "")` alongside the other setters:

```js
      if (p.pages && p.pages.length) {
        nextPages = p.pages.map((pg) => ({
          id: pg.id || uid(),
          name: pg.name || "Home",
          slug: pg.slug || "index",
          status: pg.status || "draft",
          seo: pg.seo || {},
          elements: (pg.elements || []).map((e) => ({ id: e.id || uid(), html: e.html, hidden: !!e.hidden, zIndex: e.zIndex || 0 })),
          head_html: pg.head_html || "",
          canvas_bg: pg.canvas_bg || "#ffffff",
          fonts: pg.fonts || [],
          custom_js: pg.custom_js || "",
        }));
        const found = nextPages.find((x) => x.id === p.active_page_id);
        activeId = found ? found.id : nextPages[0].id;
      } else {
        const homeId = uid();
        nextPages = [{
          id: homeId, name: p.name || "Home", slug: "index", status: "draft", seo: {},
          elements: (p.elements || []).map((e) => ({ id: e.id || uid(), html: e.html, hidden: !!e.hidden, zIndex: e.zIndex || 0 })),
          head_html: p.head_html || "", canvas_bg: p.canvas_bg || "#ffffff", fonts: p.fonts || [],
          custom_js: p.custom_js || "",
        }];
        activeId = homeId;
      }
      setPages(nextPages);
      setActivePageId(activeId);
      const active = nextPages.find((x) => x.id === activeId);
      setElements(active.elements || []);
      setHeadHtml(active.head_html || "");
      setCanvasBg(active.canvas_bg || "#ffffff");
      setFonts(active.fonts || []);
      setCustomJs(active.custom_js || "");
```

In `loadFromTemplate` (around lines 459-479), add `custom_js: data.custom_js || ""` to its fallback single-page default and `setCustomJs(nextPages[0].custom_js || "")`:

```js
  const loadFromTemplate = (tpl) => {
    const data = tpl.data || {};
    setProjectId(null);
    setProjectName(`${tpl.name} — copy`);
    const templatePages = (data.pages && data.pages.length) ? data.pages : [{
      id: uid(), name: "Home", slug: "index", status: "draft", seo: {},
      elements: data.elements || [], head_html: data.head_html || "",
      canvas_bg: data.canvas_bg || "#ffffff", fonts: data.fonts || [], custom_js: data.custom_js || "",
    }];
    const nextPages = templatePages.map((pg) => ({ ...pg, id: uid() }));
    setPages(nextPages);
    setActivePageId(nextPages[0].id);
    setElements(nextPages[0].elements || []);
    setHeadHtml(nextPages[0].head_html || "");
    setCanvasBg(nextPages[0].canvas_bg || "#ffffff");
    setFonts(nextPages[0].fonts || []);
    setCustomJs(nextPages[0].custom_js || "");
    setTemplate(data.template || { header_html: "", footer_html: "", use_template: false });
    setFiles(data.files || []);
    setSelectedId(null); setPast([]); setFuture([]);
    toast.success(`Started new project from “${tpl.name}”`);
  };
```

- [ ] **Step 8: Update the `<CodeView>` call site**

At line 618, replace:

```jsx
        {mode === "code" && (
          <CodeView project={project} headHtml={headHtml} onHeadHtmlChange={setHeadHtml} />
        )}
```

with:

```jsx
        {mode === "code" && (
          <CodeView
            project={project}
            elements={elements}
            onElementsChange={setElements}
            headHtml={headHtml}
            onHeadHtmlChange={setHeadHtml}
            customJs={customJs}
            onCustomJsChange={setCustomJs}
            onSave={save}
          />
        )}
```

- [ ] **Step 9: Syntax-check and run the production build**

Run: `cd frontend && node -e "require('@babel/core').transformFileSync('src/pages/Builder.jsx', { presets: ['@babel/preset-react'] }); console.log('OK')"`
Expected: `OK`.

Then run the full production build:
Run: `cd frontend && npm install ajv@8.17.1 --no-save --legacy-peer-deps --no-audit --no-fund && npx craco build`

(The `npm install ajv@8.17.1 --no-save` step works around a pre-existing, unrelated sandbox-only issue: this project pins dependency versions via Yarn's `resolutions` field, which npm doesn't understand, and without yarn installed in this sandbox `ajv-keywords` ends up pointed at a stray `ajv@6` — confirmed pre-existing on this branch before any of this plan's work by stashing changes and reproducing the identical failure. It does not affect the real `packageManager: yarn` install path the project actually ships with.)

Expected: `The build folder is ready to be deployed.` with no new ESLint errors in `CodeView.jsx`, `Builder.jsx`, or `CodeEditor.jsx` (an unrelated pre-existing warning in `SubmissionsModal.jsx`'s `react-hooks/exhaustive-deps` rule may still appear under `CI=true` — that's pre-existing and out of scope for this plan). Delete the `build/` directory afterward — it's a disposable local artifact, not something this plan commits.

- [ ] **Step 10: Run the full frontend pure-function suite one more time**

Run: `cd frontend && node --test src/lib/__tests__/*.test.mjs`
Expected: all PASS.

- [ ] **Step 11: Commit**

```bash
git add frontend/src/pages/Builder.jsx
git commit -m "Wire custom_js state and the redesigned CodeView into Builder.jsx"
```

---

## Manual verification (not automatable in this sandbox — no browser)

After all 8 tasks land, the project owner should verify in a real browser:
1. Code mode shows four tabs (HTML, CSS, JS, Head) plus a live preview pane.
2. Typing in the HTML tab updates the Design-mode canvas after ~400ms, and vice versa (edit on canvas, switch to Code mode, see HTML tab reflect it).
3. Typing in the CSS tab (e.g. changing a `.el-<id> { color: ... }` rule) updates the corresponding element's appearance in the preview pane and on the canvas.
4. Typing in the JS tab and adding e.g. `console.log("hi")` shows up in the preview iframe's devtools console.
5. Reordering blocks in the HTML pane reorders them on the canvas; deleting a block's markup from the HTML pane removes it from the canvas; adding new markup with no `id` attribute creates a new canvas block.
6. Ctrl+S / Cmd+S from any of the four tabs triggers the same save toast as the toolbar Save button.
7. Switching pages, undo/redo, and loading a saved project all carry `custom_js` correctly (type something in the JS tab, switch away and back, confirm it persisted).
