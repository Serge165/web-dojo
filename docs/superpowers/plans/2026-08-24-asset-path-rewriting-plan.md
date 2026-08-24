# Local Image Path Rewriting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When HTML is imported into Web Dojo (paste, file upload, URL import, folder import), rewrite every local image reference (`<img src>`, `<source srcset>`, CSS `background-image:url(...)`) to point at `imgs/{basename}`, matching the folder where Web Dojo already physically stores every uploaded image (`FileTree.jsx`'s `importedPath` helper: `imgs/${file.name}`). Remote URLs and `data:` URIs are left untouched.

**Architecture:** One new pure string-transform function, `rewriteLocalImagePaths(html)`, added to `src/lib/importHtml.js` next to the `inlineLocalStylesheets` function already added there this session. Unlike `inlineLocalStylesheets` (which needs a sibling-CSS-content lookup to substitute in), this function needs no external context — it's a straight regex rewrite of the reference string itself, so it is called from exactly one place: the first line of `scanHtml(raw)`, before the string is DOM-parsed. That makes every existing and future `scanHtml` caller (`TopBar.jsx`, `ImportExportModal.jsx`, `ProjectTemplatesModal.jsx`, `Builder.jsx`'s `onImportFile`) get the rewrite for free with zero per-call-site changes — the root-cause fix, not four scattered patches.

**Tech Stack:** Plain JS regex string transforms (matches the existing style of `inlineLocalStylesheets` in the same file — no new dependencies).

**Spec:** `docs/superpowers/specs/2026-08-24-cms-template-layout-collections-design.md` (see "Asset Handling" section)

## Global Constraints

- Local = not `http://`, `https://`, protocol-relative `//`, or `data:`. Everything else (relative paths, absolute site-root paths like `/old/path.jpg`) is treated as local and rewritten.
- Target path is always `imgs/{basename}` — the same convention `FileTree.jsx` already uses for uploaded images. Any existing query string or hash on the source URL is dropped when computing the target filename (`photo.jpg?v=3` → `imgs/photo.jpg`).
- `data:` URIs must never be touched — matching them as "local" and running basename extraction on a base64 blob would corrupt the reference. This is a real correctness risk in the naive version of this regex; every task below tests for it explicitly.
- No changes to `FileTree.jsx` — it already stores uploaded images at `imgs/{filename}` correctly. This plan only rewrites *references* found inside imported HTML text, a separate concern.

---

### Task 1: `rewriteLocalImagePaths` function + unit tests

**Files:**
- Modify: `frontend/src/lib/importHtml.js` (add function, exported, placed after `inlineLocalStylesheets` and before `scanHtml`)
- Test: `frontend/src/lib/importHtml.test.js` (add test cases; existing file, existing pattern)

**Interfaces:**
- Produces: `export const rewriteLocalImagePaths = (html: string) => string` — pure function, no second argument, safe to call with `null`/`undefined`/empty string (returns it unchanged).

- [ ] **Step 1: Write the failing tests**

Add to `frontend/src/lib/importHtml.test.js` (append at the end of the file, alongside the existing `inlineLocalStylesheets` tests):

```js
test("rewriteLocalImagePaths rewrites a local <img src> to imgs/{basename}", () => {
  const raw = `<img src="assets/photo.jpg" alt="">`;
  expect(rewriteLocalImagePaths(raw)).toBe(`<img src="imgs/photo.jpg" alt="">`);
});

test("rewriteLocalImagePaths leaves remote <img src> untouched", () => {
  const raw = `<img src="https://cdn.example.com/photo.jpg">`;
  expect(rewriteLocalImagePaths(raw)).toBe(raw);
});

test("rewriteLocalImagePaths leaves protocol-relative <img src> untouched", () => {
  const raw = `<img src="//cdn.example.com/photo.jpg">`;
  expect(rewriteLocalImagePaths(raw)).toBe(raw);
});

test("rewriteLocalImagePaths never touches a data: URI", () => {
  const raw = `<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB">`;
  expect(rewriteLocalImagePaths(raw)).toBe(raw);
});

test("rewriteLocalImagePaths drops a query string when computing the target filename", () => {
  const raw = `<img src="assets/photo.jpg?v=3">`;
  expect(rewriteLocalImagePaths(raw)).toBe(`<img src="imgs/photo.jpg">`);
});

test("rewriteLocalImagePaths is idempotent on an already-rewritten path", () => {
  const raw = `<img src="imgs/photo.jpg">`;
  expect(rewriteLocalImagePaths(raw)).toBe(raw);
});

test("rewriteLocalImagePaths rewrites each URL in a <source srcset>, preserving descriptors, and skips remote entries", () => {
  const raw = `<source srcset="small.jpg 480w, https://cdn.example.com/large.jpg 800w">`;
  expect(rewriteLocalImagePaths(raw)).toBe(`<source srcset="imgs/small.jpg 480w, https://cdn.example.com/large.jpg 800w">`);
});

test("rewriteLocalImagePaths rewrites a quoted CSS background-image url()", () => {
  const raw = `<div style="background-image:url('old/path/bg.png')"></div>`;
  expect(rewriteLocalImagePaths(raw)).toBe(`<div style="background-image:url('imgs/bg.png')"></div>`);
});

test("rewriteLocalImagePaths rewrites an unquoted CSS background-image url()", () => {
  const raw = `<div style="background-image:url(old/path/bg.png)"></div>`;
  expect(rewriteLocalImagePaths(raw)).toBe(`<div style="background-image:url(imgs/bg.png)"></div>`);
});

test("rewriteLocalImagePaths also rewrites background-image url() inside a <style> block", () => {
  const raw = `<style>.hero{background-image:url(images/hero.jpg)}</style>`;
  expect(rewriteLocalImagePaths(raw)).toBe(`<style>.hero{background-image:url(imgs/hero.jpg)}</style>`);
});

test("rewriteLocalImagePaths returns falsy/empty input unchanged", () => {
  expect(rewriteLocalImagePaths("")).toBe("");
  expect(rewriteLocalImagePaths(null)).toBe(null);
  expect(rewriteLocalImagePaths(undefined)).toBe(undefined);
});
```

Update the top import line of the same file:

```js
import { scanHtml, inlineLocalStylesheets, rewriteLocalImagePaths } from "./importHtml";
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `CI=true npx craco test --testPathPattern=importHtml --watchAll=false`
Expected: FAIL — `rewriteLocalImagePaths` is not exported from `./importHtml` yet (`TypeError: (0 , _importHtml.rewriteLocalImagePaths) is not a function` or similar).

- [ ] **Step 3: Write the implementation**

In `frontend/src/lib/importHtml.js`, add this block immediately after the existing `inlineLocalStylesheets` export and before `export const scanHtml`:

```js
// Imported HTML frequently references images by whatever path they lived
// at on the original site (or the original zip's folder layout). Every
// image Web Dojo itself stores — via FileTree.jsx's own upload/drop
// handling — lands in one shared imgs/ folder (imgs/${file.name}), so any
// local image reference inside imported markup is rewritten to match that
// convention. Remote URLs and data: URIs are left alone; data: URIs in
// particular must never be touched — running basename extraction on a
// base64 blob would corrupt the reference.
const isRemoteImageRef = (href) => /^([a-z][a-z0-9+.-]*:)?\/\//i.test(href) || /^data:/i.test(href);
const imgsBasenamePath = (href) => `imgs/${href.split("/").pop().split("?")[0].split("#")[0]}`;

const IMG_SRC_RE = /(<img\b[^>]*\bsrc=)(["'])([^"']+)\2/gi;
const SOURCE_SRCSET_RE = /(<source\b[^>]*\bsrcset=)(["'])([^"']+)\2/gi;
const BG_URL_RE = /(background-image\s*:\s*url\()(['"]?)([^'")]+)\2(\))/gi;

const rewriteSrcsetValue = (value) =>
  value
    .split(",")
    .map((part) => {
      const trimmed = part.trim();
      const spaceIdx = trimmed.search(/\s/);
      const url = spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx);
      const descriptor = spaceIdx === -1 ? "" : trimmed.slice(spaceIdx);
      if (!url || isRemoteImageRef(url)) return trimmed;
      return `${imgsBasenamePath(url)}${descriptor}`;
    })
    .join(", ");

export const rewriteLocalImagePaths = (html) => {
  if (!html) return html;
  let out = html.replace(IMG_SRC_RE, (match, pre, quote, href) =>
    !href || isRemoteImageRef(href) ? match : `${pre}${quote}${imgsBasenamePath(href)}${quote}`
  );
  out = out.replace(SOURCE_SRCSET_RE, (match, pre, quote, value) => `${pre}${quote}${rewriteSrcsetValue(value)}${quote}`);
  out = out.replace(BG_URL_RE, (match, pre, quote, href, close) =>
    !href || isRemoteImageRef(href) ? match : `${pre}${quote}${imgsBasenamePath(href)}${quote}${close}`
  );
  return out;
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `CI=true npx craco test --testPathPattern=importHtml --watchAll=false`
Expected: PASS — all `rewriteLocalImagePaths` tests plus every pre-existing test in the file (the `scanHtml`/`inlineLocalStylesheets` tests from earlier this session must still pass unmodified).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/importHtml.js frontend/src/lib/importHtml.test.js
git commit -m "feat: rewrite local image references to imgs/ during HTML import"
```

---

### Task 2: Wire `rewriteLocalImagePaths` into `scanHtml`

**Files:**
- Modify: `frontend/src/lib/importHtml.js:` the top of `scanHtml`
- Test: `frontend/src/lib/importHtml.test.js` (add one integration test)

**Interfaces:**
- Consumes: `rewriteLocalImagePaths(html)` from Task 1.
- Produces: no new export — `scanHtml`'s existing signature and return shape (`{ headHtml, sections }`) are unchanged; only its internal behavior changes (image refs in the returned `headHtml`/`sections[].html` are now pre-rewritten).

- [ ] **Step 1: Write the failing test**

Append to `frontend/src/lib/importHtml.test.js`:

```js
test("scanHtml rewrites local image references in both head and body via rewriteLocalImagePaths", () => {
  const raw = `<html><head><style>.hero{background-image:url(images/hero.jpg)}</style></head><body><section><img src="photos/team.jpg" alt=""></section></body></html>`;
  const { headHtml, sections } = scanHtml(raw);
  expect(headHtml).toContain("url(imgs/hero.jpg)");
  expect(sections[0].html).toContain('src="imgs/team.jpg"');
});

test("scanHtml leaves remote image references untouched", () => {
  const raw = `<html><body><section><img src="https://cdn.example.com/team.jpg" alt=""></section></body></html>`;
  const { sections } = scanHtml(raw);
  expect(sections[0].html).toContain('src="https://cdn.example.com/team.jpg"');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `CI=true npx craco test --testPathPattern=importHtml --watchAll=false`
Expected: FAIL — `headHtml`/`sections[0].html` still contain the original `images/hero.jpg` / `photos/team.jpg` paths, since `scanHtml` doesn't call `rewriteLocalImagePaths` yet.

- [ ] **Step 3: Wire it in**

In `frontend/src/lib/importHtml.js`, change the start of `scanHtml`:

```js
export const scanHtml = (raw) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(raw, "text/html");
```

to:

```js
export const scanHtml = (raw) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(rewriteLocalImagePaths(raw), "text/html");
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `CI=true npx craco test --testPathPattern=importHtml --watchAll=false`
Expected: PASS — all tests in the file, including both new integration tests and every pre-existing `scanHtml` test (which don't reference images and so are unaffected).

Then run the full frontend suite to confirm no other test (e.g. anything exercising `TopBar.jsx`, `ImportExportModal.jsx`, or `ProjectTemplatesModal.jsx`'s use of `scanHtml`) regressed:

Run: `CI=true npx craco test --watchAll=false`
Expected: PASS — same total count as before this plan, plus the new tests from Task 1 and Task 2.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/importHtml.js frontend/src/lib/importHtml.test.js
git commit -m "feat: apply local image path rewriting inside scanHtml itself"
```

---

## Self-Review

**1. Spec coverage:** The spec's "Asset Handling" section requires rewriting local `<img src>`, `<source srcset>`, and inline `background-image:url(...)` references to `imgs/{basename}`, mirroring `FileTree.jsx`'s existing convention, applied "everywhere `scanHtml` is invoked for an import." Task 1 implements the rewrite with the exact three reference kinds named in the spec. Task 2 wires it into `scanHtml` itself (rather than at each of the four call sites individually), which covers every call site — `TopBar.jsx`, `ImportExportModal.jsx`, `ProjectTemplatesModal.jsx`, and `Builder.jsx`'s `onImportFile` — without touching any of those four files, since they all route through `scanHtml`. No spec requirement in this section is left uncovered.

**2. Placeholder scan:** No TBD/TODO; every step has real, complete code; no "similar to Task N" references.

**3. Type consistency:** `rewriteLocalImagePaths(html: string) => string` is the only new export, used identically in Task 1's unit tests and Task 2's internal wiring. `scanHtml`'s existing signature (`raw: string) => { headHtml, sections }`) is unchanged.

## Deviation from the original directive, flagged explicitly

The directive suggested checking whether each `scanHtml` call site has a `files[]`/sibling-asset context to rewrite against, the same shape `inlineLocalStylesheets` needed. That precedent doesn't apply here: `inlineLocalStylesheets` needs sibling CSS *content* to substitute in, so it could only be wired where sibling files were available (`Builder.jsx`'s `onImportFile`). `rewriteLocalImagePaths` needs no such lookup — it only rewrites the reference *string* itself, independent of whether that image was actually uploaded alongside. So instead of per-call-site wiring, this plan calls it once, inside `scanHtml`, which is strictly simpler and automatically covers every current and future caller.
