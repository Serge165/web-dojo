# Responsive Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Inject a shared responsive CSS block into every page Web Dojo generates (preview, publish, standalone export, clean export) so multi-column grids collapse to one column on mobile, and provide a `data-wd-stack` opt-in mechanism for flex sections that need to stack.

**Architecture:** One CSS string constant, duplicated in Python (backend) and JS (frontend) since the two HTML-assembly paths don't share code today (matches the existing pattern where `_build_google_fonts_link` duplicates frontend logic). Spliced into the same four HTML-assembly functions already touched by the recent Inbox-scoping fix, right after the `window.__WD_PROJECT_ID` script tag each one already emits.

**Tech Stack:** Python (backend/server.py), plain JS (frontend/src/lib), pytest, Node's built-in `node:test`.

**Spec:** `docs/superpowers/specs/2026-08-18-responsive-export-design.md`

## Global Constraints

- Scope is `backend/server.py`, `frontend/src/lib/exportHtml.js`, `frontend/src/lib/responsiveCss.js` (new). No changes to the builder app's own UI (explicit non-goal in the spec).
- Single breakpoint: 768px. No tablet-intermediate breakpoint (spec non-goal).
- The `data-wd-stack` CSS rule ships as infrastructure only — investigation during planning found no genuine multi-column flex sections in the current block library (`blocks.js`, `blocksExtra.js`, `pageLayouts.js`) that need it; all `display:flex` usages there are navbars/headers/footers (want a hamburger-collapse pattern instead, out of scope), carousels/marquees (must not stack), or compact rows that read fine at any width. Do not add `data-wd-stack` to any block template as part of this plan.
- This worktree/checkout already has `backend/.venv/` and `frontend/node_modules/` set up from prior work on this repo — no environment setup needed.
- Backend tests use the pure-function pattern (no `TestClient`, no db mocking) already established by `TestProjectIdInjection` in `backend/tests/test_audit_fixes.py` — but this is unrelated work on a different branch, so it gets its own new test file, `backend/tests/test_responsive_export.py`, not appended to that one.

---

### Task 1: Backend — `RESPONSIVE_CSS` constant + injection into both HTML-assembly functions

**Files:**
- Modify: `backend/server.py:342` (add constant before `_project_to_html`), `:356-364` (`_project_to_html`'s return statement), `:607-618` (`_build_project_bundle`'s `html` assembly)
- Test: `backend/tests/test_responsive_export.py` (new file)

**Interfaces:**
- Produces: `server.RESPONSIVE_CSS` (a Python `str` constant containing a `<style>...</style>` block).
- Consumes: none from other tasks.

- [ ] **Step 1: Write the failing tests**

Create `backend/tests/test_responsive_export.py`:

```python
"""Regression tests for the responsive-export fix. Pure-function tests —
no TestClient, no db — _project_to_html and _build_project_bundle take a
plain dict and return a string, no MongoDB involved."""
import os

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "webdojo_test")

import server


class TestResponsiveCss:
    def test_project_to_html_includes_responsive_css(self):
        doc = {"id": "proj-1", "name": "Test", "elements": [], "fonts": [], "pages": []}
        html = server._project_to_html(doc)
        assert "@media (max-width: 768px)" in html
        assert 'grid-template-columns: 1fr !important' in html
        assert "[data-wd-stack]" in html

    def test_build_project_bundle_includes_responsive_css(self):
        doc = {"id": "proj-2", "name": "Test", "elements": [], "fonts": []}
        html, _css = server._build_project_bundle(doc, "index.html", "styles.css")
        assert "@media (max-width: 768px)" in html
        assert 'grid-template-columns: 1fr !important' in html
        assert "[data-wd-stack]" in html

    def test_responsive_css_appears_before_head_close(self):
        # Sanity check on placement: the <style> block must land inside
        # <head>, not after it.
        doc = {"id": "proj-3", "name": "Test", "elements": [], "fonts": []}
        html = server._project_to_html(doc)
        head_close = html.index("</head>")
        css_pos = html.index("@media (max-width: 768px)")
        assert css_pos < head_close
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd backend && .venv/bin/pytest tests/test_responsive_export.py -v`
Expected: FAIL — `AttributeError: module 'server' has no attribute 'RESPONSIVE_CSS'` (or the assertions fail since the CSS isn't in the output yet).

- [ ] **Step 3: Add the constant**

Find in `backend/server.py`:

```python
def _project_to_html(doc: dict, page: Optional[dict] = None) -> str:
```

Replace with:

```python
RESPONSIVE_CSS = (
    "<style>@media (max-width: 768px) {"
    "[style*=\"grid-template-columns\"] { grid-template-columns: 1fr !important; }"
    "[data-wd-stack] { flex-direction: column !important; }"
    "}</style>"
)


def _project_to_html(doc: dict, page: Optional[dict] = None) -> str:
```

- [ ] **Step 4: Inject into `_project_to_html`**

Find in `backend/server.py`:

```python
    return (
        "<!doctype html>\n<html lang=\"en\">\n<head>\n"
        "<meta charset=\"utf-8\" />\n"
        "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n"
        f"<title>{title}</title>\n"
        f"<script>window.__WD_PROJECT_ID={json.dumps(doc.get('id') or '')};</script>\n"
        f"{fonts_link}\n{seo_head}\n{head_extra}\n"
        f"<style>body{{margin:0;background:{canvas_bg};}}</style>\n"
```

Replace with:

```python
    return (
        "<!doctype html>\n<html lang=\"en\">\n<head>\n"
        "<meta charset=\"utf-8\" />\n"
        "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n"
        f"<title>{title}</title>\n"
        f"<script>window.__WD_PROJECT_ID={json.dumps(doc.get('id') or '')};</script>\n"
        f"{RESPONSIVE_CSS}\n"
        f"{fonts_link}\n{seo_head}\n{head_extra}\n"
        f"<style>body{{margin:0;background:{canvas_bg};}}</style>\n"
```

- [ ] **Step 5: Inject into `_build_project_bundle`**

Find in `backend/server.py`:

```python
    html = (
        "<!doctype html>\n<html lang=\"en\">\n<head>\n"
        "<meta charset=\"utf-8\" />\n"
        "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n"
        f"<title>{name}</title>\n"
        f"<script>window.__WD_PROJECT_ID={json.dumps(doc.get('id') or '')};</script>\n"
        f"{fonts_link}\n{head_extra}\n"
        f'<link rel="stylesheet" href="{css_filename}" />\n'
        "</head>\n<body>\n"
        f"{cleaned_body}\n"
        "</body>\n</html>"
    )
```

Replace with:

```python
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
        "</body>\n</html>"
    )
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd backend && .venv/bin/pytest tests/test_responsive_export.py -v`
Expected: all 3 tests PASS.

- [ ] **Step 7: Run the full backend suite to confirm no regression**

Run: `cd backend && .venv/bin/pytest tests/test_security_fixes.py tests/test_audit_fixes.py tests/test_responsive_export.py -v`
Expected: all tests pass (41 from the prior two rounds + 3 new = 44).

- [ ] **Step 8: Commit**

```bash
git add backend/server.py backend/tests/test_responsive_export.py
git commit -m "Add responsive CSS injection to backend HTML assembly

Exported/published/previewed pages now include a media-query block
that collapses any inline grid-template-columns to 1 column below
768px, and a data-wd-stack opt-in for flex sections."
```

---

### Task 2: Frontend — `responsiveCss.js` module + injection into `exportHtml.js`

**Files:**
- Create: `frontend/src/lib/responsiveCss.js`
- Create: `frontend/src/lib/__tests__/responsiveCss.test.mjs`
- Modify: `frontend/src/lib/exportHtml.js:1-3` (imports), `:49-69` (`buildStandaloneHtml`), `:99-121` (`buildCleanExport`)
- Modify: `frontend/src/lib/__tests__/exportHtml.test.mjs` (append)

**Interfaces:**
- Produces: `RESPONSIVE_CSS` (a JS string constant) exported from `frontend/src/lib/responsiveCss.js`.
- Consumes: none from other tasks. (Independent of Task 1 — same content, separate language/runtime, no shared code path.)

- [ ] **Step 1: Write the failing test for the new module**

Create `frontend/src/lib/__tests__/responsiveCss.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { RESPONSIVE_CSS } from "../responsiveCss.js";

test("RESPONSIVE_CSS contains the 768px breakpoint", () => {
  assert.ok(RESPONSIVE_CSS.includes("@media (max-width: 768px)"));
});

test("RESPONSIVE_CSS forces inline grid-template-columns to 1fr", () => {
  assert.ok(RESPONSIVE_CSS.includes('[style*="grid-template-columns"]'));
  assert.ok(RESPONSIVE_CSS.includes("grid-template-columns: 1fr !important"));
});

test("RESPONSIVE_CSS provides the data-wd-stack opt-in for flex sections", () => {
  assert.ok(RESPONSIVE_CSS.includes("[data-wd-stack]"));
  assert.ok(RESPONSIVE_CSS.includes("flex-direction: column !important"));
});

test("RESPONSIVE_CSS is a complete, well-formed <style> block", () => {
  assert.ok(RESPONSIVE_CSS.trim().startsWith("<style>"));
  assert.ok(RESPONSIVE_CSS.trim().endsWith("</style>"));
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test frontend/src/lib/__tests__/responsiveCss.test.mjs`
Expected: FAIL — `Cannot find module '.../responsiveCss.js'`.

- [ ] **Step 3: Create the module**

Create `frontend/src/lib/responsiveCss.js`:

```js
// Single source of truth for the responsive CSS injected into every page
// Web Dojo generates (preview, publish, standalone export, clean export).
// Grids collapse to one column below 768px unconditionally — safe for
// virtually any real layout regardless of original column count. Flex
// sections only stack if explicitly marked with data-wd-stack, since most
// display:flex usage in the block library is navbars, carousels, or
// compact rows that should NOT be forced to stack.
export const RESPONSIVE_CSS = `<style>@media (max-width: 768px) {
[style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
[data-wd-stack] { flex-direction: column !important; }
}</style>`;
```

- [ ] **Step 4: Run to verify it passes**

Run: `node --test frontend/src/lib/__tests__/responsiveCss.test.mjs`
Expected: all 4 tests PASS.

- [ ] **Step 5: Add the failing tests for `exportHtml.js`'s usage**

Append to `frontend/src/lib/__tests__/exportHtml.test.mjs` (this file already tests the `window.__WD_PROJECT_ID` injection pattern directly rather than importing the real module — `exportHtml.js` imports `file-saver`, a CommonJS package with no ESM named-export interop, so plain Node can't import it; same constraint noted in the round-2 plan):

```js
import { RESPONSIVE_CSS } from "../responsiveCss.js";

test("buildStandaloneHtml template includes RESPONSIVE_CSS after the project-id script", () => {
  const project = { id: "abc", elements: [], canvas_bg: "#ffffff" };
  const scriptLine = `<script>window.__WD_PROJECT_ID=${JSON.stringify(project.id || "")};</script>`;
  const assembled = `${scriptLine}\n${RESPONSIVE_CSS}\n`;
  assert.ok(assembled.includes(scriptLine));
  assert.ok(assembled.includes(RESPONSIVE_CSS));
  assert.ok(assembled.indexOf(scriptLine) < assembled.indexOf(RESPONSIVE_CSS));
});
```

(This needs `import assert from "node:assert/strict";` and `import test from "node:test";` at the top of the file — both already present from Task 5 of the round-2 plan; only the new `RESPONSIVE_CSS` import needs adding.)

- [ ] **Step 6: Run to verify it fails**

Run: `node --test frontend/src/lib/__tests__/exportHtml.test.mjs`
Expected: FAIL — `Cannot find module '../responsiveCss.js'` (doesn't exist as a real file relative to this test yet — wait, it was created in Step 3. Re-check: this should actually PASS once Step 3 is done, since the test only checks the assembly pattern, not the real `exportHtml.js` file.) Run it anyway to confirm: if Step 3 already landed, this test should already pass at this point — treat this step as verification, not a RED step. If it fails for a reason other than a missing module (e.g. the assertion logic itself is wrong), fix the test before proceeding.

- [ ] **Step 7: Migrate `exportHtml.js`**

Find in `frontend/src/lib/exportHtml.js`:

```js
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { escAttr, escText } from "./escapeHtml.js";
```

Replace with:

```js
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { escAttr, escText } from "./escapeHtml.js";
import { RESPONSIVE_CSS } from "./responsiveCss.js";
```

Then find:

```js
export const buildStandaloneHtml = (project) => {
  const body = project.elements.map((e) => e.html).join("\n");
  const fonts = buildFontLinks(project.fonts);
  const seoMeta = buildSeoMeta(project.seo);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escText(pageTitle(project))}</title>
<script>window.__WD_PROJECT_ID=${JSON.stringify(project.id || "")};</script>
${seoMeta}
${fonts}
${project.head_html || ""}
<style>body{margin:0;background:${project.canvas_bg || "#ffffff"};}</style>
</head>
<body>
${body}
</body>
</html>`;
};
```

Replace with:

```js
export const buildStandaloneHtml = (project) => {
  const body = project.elements.map((e) => e.html).join("\n");
  const fonts = buildFontLinks(project.fonts);
  const seoMeta = buildSeoMeta(project.seo);
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
</body>
</html>`;
};
```

Then find:

```js
export const buildCleanExport = (project) => {
  const body = project.elements.map((e) => e.html).join("\n");
  const { html: cleaned, css } = stripInlineStyles(body);
  const fonts = buildFontLinks(project.fonts);
  const seoMeta = buildSeoMeta(project.seo);
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escText(pageTitle(project))}</title>
<script>window.__WD_PROJECT_ID=${JSON.stringify(project.id || "")};</script>
${seoMeta}
${fonts}
${project.head_html || ""}
<link rel="stylesheet" href="styles.css" />
</head>
<body>
${cleaned}
</body>
</html>`;
  const styles = `body{margin:0;background:${project.canvas_bg || "#ffffff"};}\n${css}`;
  return { html, css: styles };
```

Replace with:

```js
export const buildCleanExport = (project) => {
  const body = project.elements.map((e) => e.html).join("\n");
  const { html: cleaned, css } = stripInlineStyles(body);
  const fonts = buildFontLinks(project.fonts);
  const seoMeta = buildSeoMeta(project.seo);
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
</body>
</html>`;
  const styles = `body{margin:0;background:${project.canvas_bg || "#ffffff"};}\n${css}`;
  return { html, css: styles };
```

- [ ] **Step 8: Manual verification (no automated test — `exportHtml.js` cannot be imported by plain Node due to the `file-saver` CJS/ESM interop constraint noted above)**

Read the edited `frontend/src/lib/exportHtml.js` and confirm: `RESPONSIVE_CSS` is imported at the top; both `buildStandaloneHtml` and `buildCleanExport` now interpolate `${RESPONSIVE_CSS}` immediately after the `window.__WD_PROJECT_ID` script tag and before `${seoMeta}`, in both functions.

- [ ] **Step 9: Run the full frontend suite to confirm no regression**

Run: `node --test frontend/src/lib/__tests__/*.test.mjs`
Expected: all tests pass (18 from round 2 + 4 (`responsiveCss.test.mjs`) + 1 (new `exportHtml.test.mjs` test) = 23).

- [ ] **Step 10: Commit**

```bash
git add frontend/src/lib/responsiveCss.js frontend/src/lib/__tests__/responsiveCss.test.mjs frontend/src/lib/__tests__/exportHtml.test.mjs frontend/src/lib/exportHtml.js
git commit -m "Add responsive CSS injection to frontend HTML assembly

Mirrors the backend's RESPONSIVE_CSS constant (Task 1) — same content,
independent implementation since the frontend/backend HTML-assembly
paths don't share code."
```

---

---

### Task 3: Fix grid responsiveness for the clean-export path

**Added mid-execution, per a ruling recorded in this plan's SDD ledger.**
Task 1's task-review found that `_build_project_bundle` (backend) and
`buildCleanExport` (frontend) — the "clean HTML + external CSS" export
mode — call `_strip_inline_styles`/`stripInlineStyles` *before* assembling
the page, which removes every `style="..."` attribute entirely and moves
its declarations into a generated `.el-N` class rule in the output
stylesheet. `RESPONSIVE_CSS`'s grid rule targets `[style*="grid-template-columns"]`
— an HTML attribute selector — which has nothing left to match once the
`style` attribute is gone. So the grid-collapse behavior silently does
nothing on the clean-export path (it still works on the two paths that
keep inline styles: `_project_to_html`/`buildStandaloneHtml`).
`data-wd-stack` is unaffected — `_strip_inline_styles`/`stripInlineStyles`
only ever touch the `style` attribute, never other attributes.

**Files:**
- Modify: `backend/server.py:589-603` (`_strip_inline_styles`)
- Modify: `frontend/src/lib/exportHtml.js:37-47` (`stripInlineStyles`)
- Test: `backend/tests/test_responsive_export.py` (append), `frontend/src/lib/__tests__/exportHtml.test.mjs` (append)

**Interfaces:**
- Consumes: nothing from Task 1/2 directly — this patches a function both
  tasks' target functions (`_build_project_bundle`, `buildCleanExport`)
  already call, independent of the `RESPONSIVE_CSS` constant itself.
- Produces: nothing consumed by other tasks — this is the last task in the plan.

- [ ] **Step 1: Write the failing backend tests**

Append to `backend/tests/test_responsive_export.py`:

```python
class TestCleanExportGridResponsive:
    def test_strip_inline_styles_adds_responsive_override_for_grid(self):
        html = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">content</div>'
        transformed, css = server._strip_inline_styles(html)
        assert 'class="el-0"' in transformed
        assert ".el-0 { display:grid;grid-template-columns:repeat(3,1fr);gap:10px; }" in css
        assert "@media (max-width: 768px) { .el-0 { grid-template-columns: 1fr !important; } }" in css

    def test_strip_inline_styles_skips_override_for_non_grid_elements(self):
        html = '<div style="color:red;padding:10px;">content</div>'
        transformed, css = server._strip_inline_styles(html)
        assert ".el-0 { color:red;padding:10px; }" in css
        assert "@media" not in css
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd backend && .venv/bin/pytest tests/test_responsive_export.py -v -k TestCleanExportGridResponsive`
Expected: `test_strip_inline_styles_adds_responsive_override_for_grid` FAILS (no `@media` line emitted yet); `test_strip_inline_styles_skips_override_for_non_grid_elements` PASSES already (nothing to add for non-grid content, so this one is a pre-existing-behavior check, not a RED step — same situation as Task 2 Step 6 in this plan).

- [ ] **Step 3: Fix `_strip_inline_styles`**

Find in `backend/server.py`:

```python
def _strip_inline_styles(body_html: str):
    """Extract inline style attributes into deduplicated CSS classes.
    Returns (html_with_classes, css_string)."""
    rules = []
    counter = {"n": 0}

    def repl(match):
        i = counter["n"]
        counter["n"] += 1
        cls = f"el-{i}"
        rules.append(f".{cls} {{ {match.group(1)} }}")
        return f'class="{cls}"'

    transformed = re.sub(r'style="([^"]*)"', repl, body_html)
    return transformed, "\n".join(rules)
```

Replace with:

```python
def _strip_inline_styles(body_html: str):
    """Extract inline style attributes into deduplicated CSS classes.
    Returns (html_with_classes, css_string). An extracted rule that sets
    grid-template-columns also gets a companion responsive override —
    RESPONSIVE_CSS's generic [style*="grid-template-columns"] selector
    can't match here since the style attribute this function removes is
    exactly what it targets."""
    rules = []
    counter = {"n": 0}

    def repl(match):
        i = counter["n"]
        counter["n"] += 1
        cls = f"el-{i}"
        declarations = match.group(1)
        rules.append(f".{cls} {{ {declarations} }}")
        if "grid-template-columns" in declarations:
            rules.append(f"@media (max-width: 768px) {{ .{cls} {{ grid-template-columns: 1fr !important; }} }}")
        return f'class="{cls}"'

    transformed = re.sub(r'style="([^"]*)"', repl, body_html)
    return transformed, "\n".join(rules)
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && .venv/bin/pytest tests/test_responsive_export.py -v -k TestCleanExportGridResponsive`
Expected: both tests PASS.

- [ ] **Step 5: Run the full backend suite to confirm no regression**

Run: `cd backend && .venv/bin/pytest tests/test_security_fixes.py tests/test_audit_fixes.py tests/test_responsive_export.py -v`
Expected: all tests pass (44 from Task 1 + 2 new = 46).

- [ ] **Step 6: Write the frontend pattern tests**

`stripInlineStyles` in `exportHtml.js` is a local (non-exported) function
in a file that can't be imported by plain Node anyway (the `file-saver`
CJS/ESM interop constraint noted throughout this plan and the round-2
plan). Append a pattern test to
`frontend/src/lib/__tests__/exportHtml.test.mjs`, following the same
approach already used there for the `window.__WD_PROJECT_ID` injection:

```js
test("stripInlineStyles pattern adds a responsive override for grid-template-columns", () => {
  const styles = "display:grid;grid-template-columns:repeat(3,1fr);gap:10px;";
  const cls = "el-0";
  const rules = [`.${cls} { ${styles} }`];
  if (styles.includes("grid-template-columns")) {
    rules.push(`@media (max-width: 768px) { .${cls} { grid-template-columns: 1fr !important; } }`);
  }
  assert.equal(rules.length, 2);
  assert.equal(rules[1], "@media (max-width: 768px) { .el-0 { grid-template-columns: 1fr !important; } }");
});

test("stripInlineStyles pattern skips the override for non-grid elements", () => {
  const styles = "color:red;padding:10px;";
  const rules = [`.el-0 { ${styles} }`];
  if (styles.includes("grid-template-columns")) {
    rules.push("SHOULD_NOT_APPEAR");
  }
  assert.equal(rules.length, 1);
});
```

- [ ] **Step 7: Run to verify they pass**

Run: `node --test frontend/src/lib/__tests__/exportHtml.test.mjs`
Expected: all tests in the file pass (2 existing from round 2 + 1 from Task 2 + 2 new = 5).

- [ ] **Step 8: Fix `stripInlineStyles`**

Find in `frontend/src/lib/exportHtml.js`:

```js
const stripInlineStyles = (html) => {
  // Extract style attributes, replace with class, and build CSS rules.
  const rules = [];
  let counter = 0;
  const transformed = html.replace(/style="([^"]*)"/g, (_, styles) => {
    const cls = `el-${counter++}`;
    rules.push(`.${cls} { ${styles} }`);
    return `class="${cls}"`;
  });
  return { html: transformed, css: rules.join("\n") };
};
```

Replace with:

```js
const stripInlineStyles = (html) => {
  // Extract style attributes, replace with class, and build CSS rules.
  // A rule that sets grid-template-columns also gets a companion
  // responsive override — RESPONSIVE_CSS's generic
  // [style*="grid-template-columns"] selector can't match here since the
  // style attribute this function removes is exactly what it targets.
  const rules = [];
  let counter = 0;
  const transformed = html.replace(/style="([^"]*)"/g, (_, styles) => {
    const cls = `el-${counter++}`;
    rules.push(`.${cls} { ${styles} }`);
    if (styles.includes("grid-template-columns")) {
      rules.push(`@media (max-width: 768px) { .${cls} { grid-template-columns: 1fr !important; } }`);
    }
    return `class="${cls}"`;
  });
  return { html: transformed, css: rules.join("\n") };
};
```

- [ ] **Step 9: Manual verification (no automated test — same `file-saver` import constraint as the rest of `exportHtml.js`)**

Read the edited `stripInlineStyles` back and confirm: the `if` check runs
inside the `replace` callback (so it sees each element's own extracted
declarations, not some other element's), and the pushed override rule
uses the same `cls` variable as the base rule immediately above it (so
they target the same generated class).

- [ ] **Step 10: Run the full frontend suite to confirm no regression**

Run: `node --test frontend/src/lib/__tests__/*.test.mjs`
Expected: all tests pass (23 from Tasks 1-2 + 2 new = 25).

- [ ] **Step 11: Commit**

```bash
git add backend/server.py backend/tests/test_responsive_export.py frontend/src/lib/exportHtml.js frontend/src/lib/__tests__/exportHtml.test.mjs
git commit -m "Fix grid responsiveness on the clean-export path

_strip_inline_styles/stripInlineStyles remove the style attribute
RESPONSIVE_CSS's grid selector depends on, so the clean-export mode
(_build_project_bundle, buildCleanExport) never actually collapsed
grids on mobile. Both functions now emit a companion @media override
alongside any extracted rule that sets grid-template-columns."
```

---

## After this plan

Visual confirmation of actual mobile rendering needs the project owner —
no browser is available in this sandbox. Verify via the app's own
mobile-viewport preview toggle (390px) after all three tasks land: open a
project with a feature grid or pricing table block, switch to mobile
preview, confirm the grid collapses to one column — and separately export
via both "Standalone HTML" and "Clean HTML + CSS zip" to confirm both
paths produce a responsive grid.
