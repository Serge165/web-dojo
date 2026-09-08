# Block Editor Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `BlockEditMenu.jsx`'s exclusive kind-based editor dispatch with composable region-based editing (heading / media-background / structured-content / generic-text regions, any combination at once), backed by a new `--block-bg-image` CSS custom-property override hook and canonical shape/heading marker classes added to the 117 real block templates — fixing the two confirmed live bugs (`parallax-hero-fullbleed`/`parallax-hero-split` have no editable background at all; `video-hero` loses its heading/CTA editor once video kind is picked).

**Architecture:** Two new standalone scripts do one-time, idempotent, mechanical migrations (`wrap-block-bg-vars.mjs` on the generated CSS text, `migrate-block-regions.mjs` on the template source text), reusing the existing regex-heuristic detectors already proven against these exact 117 templates rather than inventing new classification logic. `BlockEditMenu.jsx` gains a `detectBlockShape()` structural detector and per-region detectors that read the new markers first and fall back to today's content-sniffing for any block instance that predates the migration (already-saved user projects). The old exclusive `detectBlockKind`/`KIND_LABELS`/`GENERIC_KINDS` dispatch is retired once every region it covered has an equivalent region detector — no detection logic is lost, it's decomposed.

**Tech Stack:** React (BlockEditMenu.jsx), Jest + React Testing Library (frontend tests), Node.js (migration/build scripts, using the built-in `node:test` runner for script unit tests), Python + pytest (backend CSS parity tests).

**Spec:** `frontend/docs/superpowers/specs/2026-08-30-block-editor-refactor-design.md`

## Global Constraints

- Legacy compatibility is non-negotiable: any block HTML that predates this migration (already embedded in existing saved user projects) must keep working through the existing content-based heuristics. Never remove a `detectBlockKind`-era regex without an equivalent fallback path.
- `phase4b-classify-blocks.mjs` must **never** be re-run — it is a one-shot tool that wipes generated CSS to empty if run against already-converted source (see spec §5). Do not touch it in this plan.
- The migration scripts must be **additive only**: add class attributes / CSS custom properties to existing elements/declarations. Never insert new DOM elements, never delete existing classes, never change selector nesting depth in the generated CSS.
- Any block the migration heuristics can't confidently classify must be **skipped and reported**, not guessed at — mirrors the precedent already established and trusted in this codebase (`phase4b-classify-blocks.mjs`'s own COLLISIONS report).
- Every task must leave `npm test` (frontend) and `pytest` (backend, from `backend/`) green before moving to the next task.
- All 15 gemstone / Avalon GEMS theming, `CodeView.jsx`'s HTML tab, `oxygeneblocks.md`, and the rest of the 2026-08 backlog (gallery modernization, sidebar facelift, landing-page/Zenero wiring, dynamic content blocks, forms) are out of scope — do not touch those files.

---

## File Structure

**New files:**
- `frontend/scripts/wrap-block-bg-vars.mjs` — idempotent CSS post-processor; wraps `background-image` `url(...)` terms in `var(--block-bg-image, url(...))` directly in the already-generated CSS text of `blockStyles.generated.js` and `block_styles_generated.py`.
- `frontend/scripts/wrap-block-bg-vars.test.mjs` — unit tests for the pure transform function (Node's built-in test runner, matching this repo's existing ESM-test precedent).
- `frontend/scripts/migrate-block-regions.mjs` — one-time, idempotent mechanical migration: adds a `block-heading` marker class to each block's first heading element (if any), and `container block {blockType} {variant}` marker classes to each block's structured-content holder (gallery image grid / timeline list / bento tile grid, if any), patching `blocks.js`/`blocksExtra.js` in place. Skips and reports any block it can't confidently classify.
- `frontend/scripts/migrate-block-regions.test.mjs` — unit tests for the pure transform functions against fixture HTML strings.

**Modified files:**
- `frontend/src/lib/blockStyles.generated.js` — patched by `wrap-block-bg-vars.mjs` (Task 2).
- `backend/block_styles_generated.py` — patched by `wrap-block-bg-vars.mjs` (Task 2).
- `frontend/src/lib/blocks.js`, `frontend/src/lib/blocksExtra.js` — patched by `migrate-block-regions.mjs` (Task 5).
- `frontend/src/components/builder/BlockEditMenu.jsx` — add `detectBlockShape`, region detectors, `HeadingRegionEditor`, unified media editor, composable root render; retire `detectBlockKind`'s dispatch role (its regex bodies get redistributed into region detectors, not deleted).
- `frontend/src/components/builder/BlockEditMenu.test.jsx` — new region-detector tests, composable-rendering tests, regression tests for `parallax-hero-fullbleed`/`parallax-hero-split`/`video-hero`.

---

### Task 1: `wrap-block-bg-vars.mjs` — pure transform

**Files:**
- Create: `frontend/scripts/wrap-block-bg-vars.mjs`
- Test: `frontend/scripts/wrap-block-bg-vars.test.mjs`

**Interfaces:**
- Produces: `export function wrapBackgroundImageVars(cssText: string): string` — consumed by Task 2's CLI run and reused nowhere else.

- [ ] **Step 1: Write the failing test**

```js
// frontend/scripts/wrap-block-bg-vars.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { wrapBackgroundImageVars } from "./wrap-block-bg-vars.mjs";

test("wraps a simple background-image url() in var(--block-bg-image, ...)", () => {
  const input = ".foo { background-image:url(https://x.test/a.jpg); }";
  const out = wrapBackgroundImageVars(input);
  assert.equal(out, ".foo { background-image:var(--block-bg-image, url(https://x.test/a.jpg)); }");
});

test("preserves a scrim gradient layer ahead of the url()", () => {
  const input = ".block-parallax-hero-fullbleed-1 { min-height:100vh;background-image:linear-gradient(rgba(10,15,20,.55),rgba(10,15,20,.55)),url(https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1600&q=70);background-attachment:fixed; }";
  const out = wrapBackgroundImageVars(input);
  assert.equal(
    out,
    ".block-parallax-hero-fullbleed-1 { min-height:100vh;background-image:linear-gradient(rgba(10,15,20,.55),rgba(10,15,20,.55)),var(--block-bg-image, url(https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1600&q=70));background-attachment:fixed; }",
  );
});

test("is idempotent — running twice does not double-wrap", () => {
  const input = ".foo { background-image:url(https://x.test/a.jpg); }";
  const once = wrapBackgroundImageVars(input);
  const twice = wrapBackgroundImageVars(once);
  assert.equal(once, twice);
});

test("leaves declarations with no background-image untouched", () => {
  const input = ".foo { color:red;padding:8px; }";
  assert.equal(wrapBackgroundImageVars(input), input);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test frontend/scripts/wrap-block-bg-vars.test.mjs`
Expected: FAIL — `wrap-block-bg-vars.mjs` doesn't exist yet (module not found).

- [ ] **Step 3: Write minimal implementation**

```js
// frontend/scripts/wrap-block-bg-vars.mjs
#!/usr/bin/env node
// Idempotent post-processor: wraps every background-image url(...) term in
// var(--block-bg-image, ...) inside the already-generated block CSS text.
//
// Unlike phase4b-classify-blocks.mjs (a one-shot tool that extracts CSS
// from live inline styles that no longer exist in blocks.js/blocksExtra.js
// — running it again wipes the generated CSS to empty), this script
// transforms the CSS TEXT already sitting in blockStyles.generated.js /
// block_styles_generated.py directly, so it's safe to re-run.
//
// Scope: wraps the first (and in every current template, only) url() term
// found in each background-image declaration. A future template with
// MULTIPLE url() layers in one background-image would need a numbered
// variable per layer — not needed today, revisit if that appears.
//
// Run: node frontend/scripts/wrap-block-bg-vars.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

export function wrapBackgroundImageVars(cssText) {
  return cssText.replace(/background-image:([^;}]*)/g, (full, value) => {
    if (value.includes("var(--block-bg-image")) return full; // already wrapped
    const wrapped = value.replace(/url\(([^)]*)\)/g, (_m, inner) => `var(--block-bg-image, url(${inner}))`);
    return `background-image:${wrapped}`;
  });
}

function main() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const FRONTEND_ROOT = path.resolve(__dirname, "..");
  const files = [
    path.join(FRONTEND_ROOT, "src", "lib", "blockStyles.generated.js"),
    path.resolve(FRONTEND_ROOT, "..", "backend", "block_styles_generated.py"),
  ];
  for (const file of files) {
    const before = readFileSync(file, "utf8");
    const after = wrapBackgroundImageVars(before);
    if (after !== before) {
      writeFileSync(file, after);
      console.log(`wrapped background-image url() terms in ${file}`);
    } else {
      console.log(`no change needed in ${file}`);
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test frontend/scripts/wrap-block-bg-vars.test.mjs`
Expected: PASS, all 4 tests.

- [ ] **Step 5: Commit**

```bash
git add frontend/scripts/wrap-block-bg-vars.mjs frontend/scripts/wrap-block-bg-vars.test.mjs
git commit -m "feat: add idempotent --block-bg-image CSS var wrapper script"
```

---

### Task 2: Run the CSS var wrapper on the real generated files

**Files:**
- Modify: `frontend/src/lib/blockStyles.generated.js`
- Modify: `backend/block_styles_generated.py`

**Interfaces:**
- Consumes: `wrapBackgroundImageVars` from Task 1.

- [ ] **Step 1: Back up both generated files for a byte-diff sanity check**

```bash
cp frontend/src/lib/blockStyles.generated.js /tmp/blockStyles.generated.js.before
cp backend/block_styles_generated.py /tmp/block_styles_generated.py.before
```

- [ ] **Step 2: Run the script**

```bash
node frontend/scripts/wrap-block-bg-vars.mjs
```

Expected output: two "wrapped background-image url() terms in ..." lines.

- [ ] **Step 3: Verify only background-image lines changed**

```bash
diff /tmp/blockStyles.generated.js.before frontend/src/lib/blockStyles.generated.js | grep -c '^[<>]'
```

Expected: every changed line (both `<` and `>` sides) contains `background-image:` — spot check with:

```bash
diff /tmp/blockStyles.generated.js.before frontend/src/lib/blockStyles.generated.js | grep '^[<>]' | grep -vc 'background-image:'
```

Expected: `0`.

- [ ] **Step 4: Confirm the parallax-hero-fullbleed fixture specifically**

```bash
grep -o 'block-parallax-hero-fullbleed-1[^}]*}' frontend/src/lib/blockStyles.generated.js
```

Expected: contains `background-image:linear-gradient(rgba(10,15,20,.55),rgba(10,15,20,.55)),var(--block-bg-image, url(https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1600&q=70))` and still contains `background-attachment:fixed;background-size:cover;background-position:center` unchanged.

- [ ] **Step 5: Run existing test suites to confirm no regression**

Run: `cd frontend && npm test -- --watchAll=false`
Run: `cd backend && pytest tests/test_block_styles_generated.py -v`
Expected: both green — these tests assert class names and selector presence, not the literal `background-image` value, so they should be unaffected.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/lib/blockStyles.generated.js backend/block_styles_generated.py
git commit -m "fix: wrap block background-image url() terms in --block-bg-image var"
```

---

### Task 3: `detectBlockShape(html)` in BlockEditMenu.jsx

**Files:**
- Modify: `frontend/src/components/builder/BlockEditMenu.jsx` (add near existing `detectBlockKind`, around line 112)
- Test: `frontend/src/components/builder/BlockEditMenu.test.jsx`

**Interfaces:**
- Produces: `export const detectBlockShape = (html: string): "nav" | "container" | "section"` — consumed by Task 6's region detectors and Task 8's composable render.

- [ ] **Step 1: Write the failing test**

```jsx
// add to frontend/src/components/builder/BlockEditMenu.test.jsx
import { detectBlockShape } from "./BlockEditMenu";

describe("detectBlockShape", () => {
  it("detects nav shape", () => {
    expect(detectBlockShape('<nav class="block nav-simple-1"><a href="#">Home</a></nav>')).toBe("nav");
  });

  it("detects container shape from the content marker", () => {
    const html = '<section class="block"><div class="block"><h2>Gallery</h2><div class="container block gallery-grid 1"><img src="a.jpg"/></div></div></section>';
    expect(detectBlockShape(html)).toBe("container");
  });

  it("defaults to section shape when no markers are present", () => {
    expect(detectBlockShape('<section class="block hero-1"><h1>Hi</h1></section>')).toBe("section");
  });

  it("returns section shape for empty/null input rather than throwing", () => {
    expect(detectBlockShape("")).toBe("section");
    expect(detectBlockShape(null)).toBe("section");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- BlockEditMenu.test.jsx -t detectBlockShape`
Expected: FAIL — `detectBlockShape` is not exported.

- [ ] **Step 3: Write minimal implementation**

Add directly below the existing `detectBlockKind` function (after line 144):

```js
// --- structural shape detection (independent of kind) ----------------

// Purely structural — reads canonical markers added by
// migrate-block-regions.mjs. Absence of markers is not an error: it just
// means the block predates the migration or has no structured content, and
// "section" is a safe default (region detection in detectRegions() below
// works independently of shape).
export const detectBlockShape = (html) => {
  if (!html) return "section";
  if (/^\s*<nav\b/i.test(html)) return "nav";
  if (/class="[^"]*\bcontainer block\b[^"]*"/i.test(html)) return "container";
  return "section";
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- BlockEditMenu.test.jsx -t detectBlockShape`
Expected: PASS, all 4 cases.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/builder/BlockEditMenu.jsx frontend/src/components/builder/BlockEditMenu.test.jsx
git commit -m "feat: add detectBlockShape structural detector"
```

---

### Task 4: `migrate-block-regions.mjs` — pure transform functions

**Files:**
- Create: `frontend/scripts/migrate-block-regions.mjs`
- Test: `frontend/scripts/migrate-block-regions.test.mjs`

**Interfaces:**
- Produces: `export function markHeading(html: string): { html: string, changed: boolean }`, `export function markContentRegion(html: string, blockId: string): { html: string, changed: boolean, reason?: string }` — both consumed by Task 5's CLI run.

- [ ] **Step 1: Write the failing test**

```js
// frontend/scripts/migrate-block-regions.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { markHeading, markContentRegion } from "./migrate-block-regions.mjs";

test("markHeading adds block-heading to the first h1", () => {
  const input = '<section class="block hero-1 block-hero"><h1 class="block hero-2 block-hero">Hi</h1><p class="block hero-3 block-hero">Sub</p></section>';
  const { html, changed } = markHeading(input);
  assert.ok(changed);
  assert.match(html, /<h1 class="block hero-2 block-hero block-heading">Hi<\/h1>/);
});

test("markHeading adds block-heading to the first h2 when no h1 exists", () => {
  const input = '<section class="block"><h2 class="block x-1">Gallery</h2></section>';
  const { html, changed } = markHeading(input);
  assert.ok(changed);
  assert.match(html, /<h2 class="block x-1 block-heading">Gallery<\/h2>/);
});

test("markHeading is a no-op when no heading element exists", () => {
  const input = '<footer class="block ft-1"><p class="block ft-2">Copyright</p></footer>';
  const { html, changed } = markHeading(input);
  assert.equal(changed, false);
  assert.equal(html, input);
});

test("markHeading skips nav and footer blocks entirely", () => {
  const input = '<nav class="block nav-1"><h1 class="block nav-2">Should not be tagged</h1></nav>';
  const { html, changed } = markHeading(input);
  assert.equal(changed, false);
  assert.equal(html, input);
});

test("markHeading is idempotent", () => {
  const input = '<section class="block hero-1"><h1 class="block hero-2">Hi</h1></section>';
  const once = markHeading(input).html;
  const twice = markHeading(once).html;
  assert.equal(once, twice);
});

test("markContentRegion tags the image grid div for a gallery block", () => {
  const input = '<section class="block cmp-gallery-grid-1 block-cmp-gallery-grid"><div class="block cmp-gallery-grid-2 block-cmp-gallery-grid"><h2 class="block cmp-gallery-grid-3 block-cmp-gallery-grid">Gallery</h2><div class="block cmp-gallery-grid-4 block-cmp-gallery-grid"><img src="a.jpg" class="block cmp-gallery-grid-5 block-cmp-gallery-grid"/><img src="b.jpg" class="block cmp-gallery-grid-6 block-cmp-gallery-grid"/><img src="c.jpg" class="block cmp-gallery-grid-7 block-cmp-gallery-grid"/></div></div></section>';
  const { html, changed, reason } = markContentRegion(input, "cmp-gallery-grid");
  assert.ok(changed, reason);
  assert.match(html, /class="block cmp-gallery-grid-4 block-cmp-gallery-grid container block cmp-gallery-grid"/);
});

test("markContentRegion tags the <ol> for a timeline block", () => {
  const input = '<section class="block cmp-timeline-vert-1"><ol class="block cmp-timeline-vert-2"><li>One</li><li>Two</li></ol></section>';
  const { html, changed } = markContentRegion(input, "cmp-timeline-vert");
  assert.ok(changed);
  assert.match(html, /<ol class="block cmp-timeline-vert-2 container block cmp-timeline-vert">/);
});

test("markContentRegion reports and skips a block it can't confidently classify", () => {
  const input = '<section class="block hero-1"><h1 class="block hero-2">Hi</h1></section>';
  const { changed, reason } = markContentRegion(input, "hero-1");
  assert.equal(changed, false);
  assert.match(reason, /no gallery\/timeline\/bento content found/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test frontend/scripts/migrate-block-regions.test.mjs`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```js
// frontend/scripts/migrate-block-regions.mjs
#!/usr/bin/env node
// One-time, idempotent migration: adds a `block-heading` marker class to
// each block's first heading element (if any, and if the block isn't a
// nav/footer — every block gets an optional heading except those two, per
// the block spec), and `container block {blockType}` marker classes to
// each block's structured-content holder (gallery image grid / timeline
// list / bento tile grid), reusing the SAME content heuristics already
// proven against these 117 templates in BlockEditMenu.jsx's
// detectBlockKind. Purely additive — only adds class-attribute text to
// elements that already exist; never inserts new DOM nodes, never
// restructures nesting. See docs/superpowers/specs/
// 2026-08-30-block-editor-refactor-design.md §1.
//
// Blocks the heuristics can't confidently classify are left untouched and
// reported — mirrors phase4b-classify-blocks.mjs's own COLLISIONS report
// precedent rather than guessing.
//
// Run: node frontend/scripts/migrate-block-regions.mjs

// --- pure transforms (unit tested in migrate-block-regions.test.mjs) ---

const isNavOrFooter = (html) => /^\s*<nav\b/i.test(html) || /\bfooter\b/i.test((html.match(/^\s*<[a-z]+[^>]*class="([^"]*)"/i) || [])[1] || "");

export function markHeading(html) {
  if (!html || isNavOrFooter(html)) return { html, changed: false };
  const m = html.match(/<h1\b[^>]*class="([^"]*)"[^>]*>/i) || html.match(/<h2\b[^>]*class="([^"]*)"[^>]*>/i);
  if (!m) return { html, changed: false };
  if (/\bblock-heading\b/.test(m[1])) return { html, changed: false }; // idempotent
  const tag = m[0].toLowerCase().startsWith("<h1") ? "h1" : "h2";
  const re = new RegExp(`(<${tag}\\b[^>]*class=")([^"]*)("[^>]*>)`, "i");
  return { html: html.replace(re, (_m2, a, cls, c) => `${a}${cls} block-heading${c}`), changed: true };
}

// Finds the div whose direct children are 3+ <img> tags (gallery),
// returns null if not found — mirrors the existing gallery heuristic.
const findGalleryGridDiv = (html) => {
  const divs = html.match(/<div\b[^>]*class="[^"]*"[^>]*>/gi) || [];
  for (const openTag of divs) {
    const start = html.indexOf(openTag);
    const rest = html.slice(start + openTag.length);
    const closeIdx = rest.indexOf("</div>");
    if (closeIdx < 0) continue;
    const inner = rest.slice(0, closeIdx);
    const imgCount = (inner.match(/<img\b/gi) || []).length;
    if (imgCount >= 3 && !/<div\b/i.test(inner)) return openTag; // leaf div, 3+ images, no nested divs
  }
  return null;
};

export function markContentRegion(html, blockId) {
  if (!html) return { html, changed: false, reason: "empty html" };

  // Timeline: tag the <ol> itself.
  if (/<ol\b[^>]*class="([^"]*)"[^>]*>/i.test(html) && /<li[\s>]/i.test(html)) {
    if (/class="[^"]*\bcontainer block\b/i.test(html)) return { html, changed: false }; // idempotent
    const re = /(<ol\b[^>]*class=")([^"]*)("[^>]*>)/i;
    return {
      html: html.replace(re, (_m, a, cls, c) => `${a}${cls} container block ${blockId}${c}`),
      changed: true,
    };
  }

  // Gallery: tag the leaf div holding 3+ <img> tags.
  const galleryDiv = findGalleryGridDiv(html);
  if (galleryDiv) {
    if (/class="[^"]*\bcontainer block\b/i.test(html)) return { html, changed: false }; // idempotent
    const re = /(<div\b[^>]*class=")([^"]*)("[^>]*>)/i;
    const idx = html.indexOf(galleryDiv);
    const before = html.slice(0, idx);
    const rest = html.slice(idx);
    const patched = rest.replace(re, (_m, a, cls, c) => `${a}${cls} container block ${blockId}${c}`);
    return { html: before + patched, changed: true };
  }

  // Bento: tag the div whose direct children are 3+ divs each containing an <h3>.
  const bentoMatch = html.match(/<div\b[^>]*class="([^"]*)"[^>]*>((?:\s*<div\b[^>]*><h3[\s>][\s\S]*?<\/div>\s*){3,})<\/div>/i);
  if (bentoMatch) {
    if (/class="[^"]*\bcontainer block\b/i.test(html)) return { html, changed: false }; // idempotent
    const re = /(<div\b[^>]*class=")([^"]*)("[^>]*>)/i;
    const idx = html.indexOf(bentoMatch[0]);
    const before = html.slice(0, idx);
    const rest = html.slice(idx);
    const patched = rest.replace(re, (_m, a, cls, c) => `${a}${cls} container block ${blockId}${c}`);
    return { html: before + patched, changed: true };
  }

  return { html, changed: false, reason: `${blockId}: no gallery/timeline/bento content found` };
}

// --- CLI: patch blocks.js / blocksExtra.js in place ---------------------

async function main() {
  const { readFileSync, writeFileSync } = await import("node:fs");
  const { fileURLToPath } = await import("node:url");
  const path = await import("node:path");
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const LIB_DIR = path.join(__dirname, "..", "src", "lib");

  const { register } = await import("node:module");
  register("./phase4b-ext-loader.mjs", import.meta.url);
  const { CATEGORIES } = await import("../src/lib/blocks.js");
  const { EXTRA_CATEGORIES } = await import("../src/lib/blocksExtra.js");

  const skipped = [];
  let headingCount = 0;
  let contentCount = 0;

  for (const [file, cats] of [
    [path.join(LIB_DIR, "blocks.js"), CATEGORIES],
    [path.join(LIB_DIR, "blocksExtra.js"), EXTRA_CATEGORIES],
  ]) {
    let source = readFileSync(file, "utf8");
    for (const cat of cats) {
      for (const block of cat.blocks) {
        const afterHeading = markHeading(block.html);
        if (afterHeading.changed) headingCount += 1;
        const afterContent = markContentRegion(afterHeading.html, block.id);
        if (afterContent.changed) contentCount += 1;
        else if (afterContent.reason && /no gallery\/timeline\/bento/.test(afterContent.reason)) {
          // Not every block has structured content (heroes, CTAs, cards) —
          // only report ones whose id LOOKS like it should (gallery/
          // timeline/bento/social in the id or label) but didn't match.
          if (/gallery|timeline|bento|social/i.test(block.id + block.label)) skipped.push(afterContent.reason);
        }
        const finalHtml = afterContent.html;
        if (finalHtml !== block.html) {
          source = source.replace(block.html, () => finalHtml.replace(/\$/g, "$$$$"));
          block.html = finalHtml; // keep in-memory copy consistent if reused below
        }
      }
    }
    writeFileSync(file, source);
  }

  console.log(`Marked ${headingCount} headings, ${contentCount} content regions.`);
  if (skipped.length) {
    console.log(`\nSKIPPED (needs manual review):`);
    skipped.forEach((s) => console.log(`  - ${s}`));
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test frontend/scripts/migrate-block-regions.test.mjs`
Expected: PASS, all 8 cases.

- [ ] **Step 5: Commit**

```bash
git add frontend/scripts/migrate-block-regions.mjs frontend/scripts/migrate-block-regions.test.mjs
git commit -m "feat: add block-heading/content-region migration script"
```

---

### Task 5: Run the migration script on the real templates

**Files:**
- Modify: `frontend/src/lib/blocks.js`
- Modify: `frontend/src/lib/blocksExtra.js`

**Interfaces:**
- Consumes: `markHeading`, `markContentRegion` from Task 4.

- [ ] **Step 1: Back up both files**

```bash
cp frontend/src/lib/blocks.js /tmp/blocks.js.before
cp frontend/src/lib/blocksExtra.js /tmp/blocksExtra.js.before
```

- [ ] **Step 2: Run the script and read its report**

```bash
cd frontend && node scripts/migrate-block-regions.mjs
```

Read the "SKIPPED (needs manual review)" list if non-empty — each entry names a block whose id/label suggests gallery/timeline/bento/social content but didn't match the structural heuristics. For each skipped block, open it in `blocks.js`/`blocksExtra.js` and decide: (a) it's a false-positive naming (e.g. a "gallery" in prose text, not actual gallery markup) — no action needed, or (b) it has a real structural pattern the heuristics missed — note it for a follow-up task, do not hand-edit mid-migration.

- [ ] **Step 3: Verify no block lost content**

```bash
diff /tmp/blocks.js.before frontend/src/lib/blocks.js | grep '^[<>]' | grep -vc 'class="'
```

Expected: `0` — every changed line should only differ in a `class="..."` attribute value, never in text content or structure.

Repeat for `blocksExtra.js`.

- [ ] **Step 4: Verify a known Type B block by hand**

```bash
grep -A2 'id: "cmp-gallery-grid"' frontend/src/lib/blocks.js | head -5
```

Expected: the `<h2>` now carries `block-heading` and the image-grid `<div>` now carries `container block cmp-gallery-grid`.

- [ ] **Step 5: Run the full existing test suite**

Run: `npm test -- --watchAll=false`
Expected: all existing tests green — no test currently asserts exact class-attribute strings on these templates' render output in a way that would break from an appended class (confirm by reading any failure carefully; if a snapshot test fails purely because of the new class text, update that snapshot — do not weaken the assertion).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/lib/blocks.js frontend/src/lib/blocksExtra.js
git commit -m "fix: migrate 117 block templates to heading/content region markers"
```

---

### Task 6: Region detectors in BlockEditMenu.jsx

**Files:**
- Modify: `frontend/src/components/builder/BlockEditMenu.jsx`
- Test: `frontend/src/components/builder/BlockEditMenu.test.jsx`

**Interfaces:**
- Consumes: `detectBlockShape` (Task 3); existing `parseGalleryImages`, `parseTimelineEntries`, `parseBentoItems`, `parseNavbarTree`, `parseImageBlock`, `parseVideoBlock`, `parseEditableNodes` (all already in this file, unchanged).
- Produces: `export const detectRegions = (html: string) => { heading: boolean, media: "image" | "video" | "bg" | "bg-empty" | null, content: "gallery" | "timeline" | "bento" | "navbar" | null, generic: boolean }` — consumed by Task 8's composable root render.

- [ ] **Step 1: Write the failing test**

```jsx
// add to frontend/src/components/builder/BlockEditMenu.test.jsx
import { detectRegions } from "./BlockEditMenu";

describe("detectRegions", () => {
  it("parallax-hero-fullbleed: no img/video, but is a hero-shaped block — media region is bg-empty (editable, just unset)", () => {
    const html = '<section class="block block-parallax-hero-fullbleed-1 block-parallax-hero-fullbleed"><div class="block"><h1 class="block block-heading">Where ambition meets altitude.</h1><p class="block">Sub</p><button class="block">Explore</button></div></section>';
    const regions = detectRegions(html);
    expect(regions.heading).toBe(true);
    expect(regions.media).toBe("bg-empty");
    expect(regions.generic).toBe(true);
  });

  it("video-hero: has both a video region AND a heading/generic region (the confirmed regression)", () => {
    const html = '<section class="block block-video-hero-1"><video class="block" poster="p.jpg"><source src="v.mp4" type="video/mp4"/></video><div class="block"><h1 class="block block-heading">Motion tells your story</h1><p class="block">Sub</p><a class="block" href="#">Watch</a></div></section>';
    const regions = detectRegions(html);
    expect(regions.media).toBe("video");
    expect(regions.heading).toBe(true);
    expect(regions.generic).toBe(true);
  });

  it("gallery block: content region is gallery, no heading claims the image grid", () => {
    const html = '<section class="block"><div class="block"><h2 class="block block-heading">Gallery</h2><div class="container block cmp-gallery-grid"><img src="a.jpg"/><img src="b.jpg"/><img src="c.jpg"/></div></div></section>';
    const regions = detectRegions(html);
    expect(regions.content).toBe("gallery");
    expect(regions.heading).toBe(true);
  });

  it("navbar: no heading region (navs are excluded per spec)", () => {
    const html = '<nav class="block nav-simple-1"><a href="#">Home</a></nav>';
    const regions = detectRegions(html);
    expect(regions.heading).toBe(false);
    expect(regions.content).toBe("navbar");
  });

  it("legacy block with no migration markers still detects gallery via content heuristics", () => {
    const html = '<section class="block"><div class="block"><h2 class="block">Gallery</h2><div class="block" style="display:grid"><img src="a.jpg"/><img src="b.jpg"/><img src="c.jpg"/></div></div></section>';
    const regions = detectRegions(html);
    expect(regions.content).toBe("gallery");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- BlockEditMenu.test.jsx -t detectRegions`
Expected: FAIL — `detectRegions` is not exported.

- [ ] **Step 3: Write minimal implementation**

Add below `detectBlockShape` (after Task 3's addition):

```js
// --- composable region detection ---------------------------------------
//
// Replaces detectBlockKind's exclusive one-kind-wins dispatch. A block can
// have any combination of these regions; BlockEditMenu (Task 8) renders one
// editor slice per region present, instead of picking exactly one. This is
// what fixes the two confirmed regressions: parallax-hero-fullbleed (no img
// at all, but IS a hero — media region must still offer to set a
// background) and video-hero (has both video AND heading/CTA text, both
// must be editable at once).

const HERO_SHAPE_RE = /<section\b[^>]*>[\s\S]*<h1\b/i; // same heuristic detectBlockKind used for "hero"

export const detectHeadingRegion = (html) => {
  if (!html) return false;
  if (/^\s*<nav\b/i.test(html) || /\bfooter\b/i.test((html.match(/^\s*<[a-z]+[^>]*class="([^"]*)"/i) || [])[1] || "")) return false;
  return /\bblock-heading\b/.test(html) || /<h1\b/i.test(html) || /<h2\b/i.test(html);
};

export const detectMediaRegion = (html) => {
  if (!html) return null;
  if (/<video\b/i.test(html)) return "video";
  const imgCount = (html.match(/<img\b/gi) || []).length;
  // A gallery's images belong to the content region, not a single media
  // region — only treat a lone image (imgCount <= 2, below the gallery
  // threshold) as a media region.
  if (imgCount >= 1 && imgCount <= 2) return "image";
  if (/background(?:-image)?:\s*[^;"]*(?:url\(|var\(--block-bg-image)/i.test(html)) return "bg";
  if (imgCount === 0 && HERO_SHAPE_RE.test(html)) return "bg-empty"; // parallax-hero-fullbleed case
  return null;
};

export const detectContentRegion = (html) => {
  if (!html) return null;
  if (/^\s*<nav\b/i.test(html)) return "navbar";
  if (/data-forge-portfolio-timeline/i.test(html)) return "timeline";
  if (/<ol\b[\s\S]*<li[\s>]/i.test(html) && (/\bcontainer block\b/.test(html) || /(border-left:\s*2px|position:absolute;left:-\d+px)/i.test(html))) return "timeline";
  if (/data-forge-widget=["']gallery["']/i.test(html)) return "gallery";
  const imgCount = (html.match(/<img\b/gi) || []).length;
  if (imgCount >= 3) return "gallery";
  if (/\bcontainer block\b/.test(html) && /<h3[\s>]/i.test(html) && (html.match(/<h3\b/gi) || []).length >= 3) return "bento";
  if (/display:\s*grid/i.test(html) && /<h3[\s>]/i.test(html)) return "bento";
  return null;
};

export const detectRegions = (html) => ({
  heading: detectHeadingRegion(html),
  media: detectMediaRegion(html),
  content: detectContentRegion(html),
  generic: true, // the generic text-node editor is always offered as a catch-all for whatever the above didn't claim; Task 8 filters out nodes already owned by another region's editor
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- BlockEditMenu.test.jsx -t detectRegions`
Expected: PASS, all 5 cases. If `HERO_SHAPE_RE` or the image-count thresholds misclassify any existing fixture in the test file (e.g. the pre-existing `galleryHtml`/nav fixtures at the top of the test file), adjust the regex to match — do not change the test's expected values without confirming the mismatch is a genuine detector bug, not a wrong expectation.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/builder/BlockEditMenu.jsx frontend/src/components/builder/BlockEditMenu.test.jsx
git commit -m "feat: add composable region detectors (heading/media/content)"
```

---

### Task 7: Unified media editor with `--block-bg-image` write path

**Files:**
- Modify: `frontend/src/components/builder/BlockEditMenu.jsx` (replace `ImageBlockEditor`, extend background handling — around lines 844-905 and the `parseImageBlock`/`setImageBlockSrc` pair at lines 150-163)
- Test: `frontend/src/components/builder/BlockEditMenu.test.jsx`

**Interfaces:**
- Consumes: `detectMediaRegion` from Task 6.
- Produces: `export const setBlockBgImage = (html: string, src: string): string` (writes/updates the `--block-bg-image` inline custom property on the block's outer element); `MediaBlockEditor` React component replacing `ImageBlockEditor`/`VideoBlockEditor`'s split (both still exist and are still used internally, `MediaBlockEditor` just picks between them plus the new bg-only case).

- [ ] **Step 1: Write the failing test**

```jsx
// add to frontend/src/components/builder/BlockEditMenu.test.jsx
import { setBlockBgImage } from "./BlockEditMenu";

describe("setBlockBgImage", () => {
  it("adds a new --block-bg-image inline style to a block with no existing background", () => {
    const html = '<section class="block block-parallax-hero-fullbleed-1"><h1 class="block">Hi</h1></section>';
    const out = setBlockBgImage(html, "https://x.test/new.jpg");
    expect(out).toMatch(/<section class="block block-parallax-hero-fullbleed-1" style="--block-bg-image:url\(https:\/\/x\.test\/new\.jpg\)">/);
  });

  it("updates an existing --block-bg-image inline style in place", () => {
    const html = '<section class="block" style="--block-bg-image:url(old.jpg)"><h1 class="block">Hi</h1></section>';
    const out = setBlockBgImage(html, "new.jpg");
    expect(out).toContain('style="--block-bg-image:url(new.jpg)"');
    expect(out).not.toContain("old.jpg");
  });

  it("preserves other existing inline styles on the same element", () => {
    const html = '<section class="block" style="min-height:100vh"><h1 class="block">Hi</h1></section>';
    const out = setBlockBgImage(html, "new.jpg");
    expect(out).toContain("min-height:100vh");
    expect(out).toContain("--block-bg-image:url(new.jpg)");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- BlockEditMenu.test.jsx -t setBlockBgImage`
Expected: FAIL — not exported.

- [ ] **Step 3: Write minimal implementation**

Add near `setImageBlockSrc` (after line 163):

```js
// Writes a per-instance background-image override as a --block-bg-image
// inline custom property on the block's OUTER element — inline always wins
// over the class rule's var(--block-bg-image, <default>) fallback (see
// wrap-block-bg-vars.mjs / Task 1-2), so this never needs to touch
// generated CSS, and never clobbers other layers (gradients etc.) the
// class rule already composes around the variable.
export const setBlockBgImage = (html, src) => {
  const outerOpen = (html.match(/^\s*<[a-z][a-z0-9]*\b[^>]*>/i) || [])[0];
  if (!outerOpen) return html;
  const varDecl = `--block-bg-image:url(${escAttrLocal(src)})`;
  let newOpen;
  if (/\bstyle="/i.test(outerOpen)) {
    newOpen = outerOpen.replace(/style="([^"]*)"/i, (_m, existing) => {
      const withoutOldVar = existing.replace(/--block-bg-image:[^;"]*;?\s*/i, "").trim();
      const joined = withoutOldVar ? `${withoutOldVar};${varDecl}` : varDecl;
      return `style="${joined}"`;
    });
  } else {
    newOpen = outerOpen.replace(/>$/, ` style="${varDecl}">`);
  }
  return html.slice(0, html.indexOf(outerOpen)) + newOpen + html.slice(html.indexOf(outerOpen) + outerOpen.length);
};
```

Replace `ImageBlockEditor` (lines 844-905) with a version that also handles the `media === "bg-empty"` / `media === "bg"` cases — add this component right after the existing `ImageBlockEditor` definition (keep `ImageBlockEditor` itself unchanged, it's still used for the `image` case):

```jsx
const BackgroundBlockEditor = ({ html, onChange, projectId = null, blockId = null }) => {
  const fileRef = useRef(null);
  const [urlDraft, setUrlDraft] = useState("");
  const current = (html.match(/--block-bg-image:url\(([^)]*)\)/i) || [])[1] || "";

  const commit = (src) => onChange(setBlockBgImage(html, src));

  const onUpload = async (e) => {
    const file = (e.target.files || [])[0];
    e.target.value = "";
    if (!file) return;
    if (!projectId) {
      commit(await readAsDataURL(file));
      return;
    }
    try {
      const fd = new FormData();
      fd.append("file", file);
      const API = process.env.REACT_APP_BACKEND_URL || "";
      const res = await fetch(`${API}/api/projects/${projectId}/assets/upload?asset_type=image&asset_id=${encodeURIComponent(blockId || "1")}`, { method: "POST", body: fd });
      if (!res.ok) throw new Error(`upload failed (${res.status})`);
      const data = await res.json();
      if (!data.success) throw new Error(data.detail || "upload failed");
      commit(data.url);
    } catch {
      commit(await readAsDataURL(file));
    }
  };

  return (
    <div className="space-y-2" data-testid="block-edit-background">
      <div className="flex items-center gap-2">
        {current ? <img src={current} alt="" className="w-12 h-12 object-cover rounded flex-none border border-[#332D22]" /> : <div className="w-12 h-12 rounded flex-none border border-[#332D22] bg-[#242019]" />}
        <div className="flex-1 flex gap-1">
          <Btn onClick={() => fileRef.current?.click()} title="Upload background image" testId="bg-upload-btn"><Upload size={11} /> Upload</Btn>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onUpload} data-testid="bg-upload-input" />
        </div>
      </div>
      <div className="flex gap-1">
        <input
          value={urlDraft}
          onChange={(e) => setUrlDraft(e.target.value)}
          placeholder="Paste a background image URL"
          aria-label="Background image URL"
          className={inputCls}
          data-testid="bg-url-input"
        />
        <Btn onClick={() => { if (urlDraft.trim()) { commit(urlDraft.trim()); setUrlDraft(""); } }} title="Use URL" testId="bg-url-apply">Set</Btn>
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- BlockEditMenu.test.jsx -t setBlockBgImage`
Expected: PASS, all 3 cases.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/builder/BlockEditMenu.jsx frontend/src/components/builder/BlockEditMenu.test.jsx
git commit -m "feat: add --block-bg-image write path and BackgroundBlockEditor"
```

---

### Task 8: Composable root render — retire exclusive dispatch

**Files:**
- Modify: `frontend/src/components/builder/BlockEditMenu.jsx` (replace the `BlockEditMenu` root component and remove `KIND_LABELS`/`GENERIC_KINDS`, lines 1163-1186)
- Test: `frontend/src/components/builder/BlockEditMenu.test.jsx`

**Interfaces:**
- Consumes: `detectRegions` (Task 6), `BackgroundBlockEditor` (Task 7), existing `GalleryEditor`/`TimelineEditor`/`BentoEditor`/`NavbarEditor`/`ImageBlockEditor`/`VideoBlockEditor`/`GenericBlockEditor`.
- Produces: new `BlockEditMenu` render contract — renders 0-4 editor slices stacked, keyed by region, instead of exactly one.

- [ ] **Step 1: Write the failing test**

```jsx
// add to frontend/src/components/builder/BlockEditMenu.test.jsx
import { render, screen } from "@testing-library/react";
import { BlockEditMenu } from "./BlockEditMenu";

describe("BlockEditMenu composable rendering", () => {
  it("parallax-hero-fullbleed: shows a background editor even with zero <img> tags (regression)", () => {
    const html = '<section class="block block-parallax-hero-fullbleed-1"><h1 class="block block-heading">Where ambition meets altitude.</h1><p class="block">Sub</p></section>';
    render(<BlockEditMenu selectedHtml={html} onChange={() => {}} />);
    expect(screen.getByTestId("block-edit-background")).toBeInTheDocument();
  });

  it("video-hero: shows BOTH the video editor and the generic text editor at once (regression)", () => {
    const html = '<section class="block block-video-hero-1"><video class="block" poster="p.jpg"><source src="v.mp4" type="video/mp4"/></video><h1 class="block block-heading">Motion tells your story</h1><a class="block" href="#">Watch</a></section>';
    render(<BlockEditMenu selectedHtml={html} onChange={() => {}} />);
    expect(screen.getByTestId("block-edit-video")).toBeInTheDocument();
    expect(screen.getByTestId("block-edit-generic")).toBeInTheDocument();
  });

  it("gallery block: shows the gallery editor, not the generic editor, for the image grid", () => {
    const html = '<section class="block"><h2 class="block block-heading">Gallery</h2><div class="container block cmp-gallery-grid"><img src="a.jpg"/><img src="b.jpg"/><img src="c.jpg"/></div></section>';
    render(<BlockEditMenu selectedHtml={html} onChange={() => {}} />);
    expect(screen.getByTestId("block-edit-gallery")).toBeInTheDocument();
  });

  it("renders nothing when selectedHtml is empty", () => {
    const { container } = render(<BlockEditMenu selectedHtml="" onChange={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- BlockEditMenu.test.jsx -t "composable rendering"`
Expected: FAIL — current exclusive dispatch shows exactly one editor, missing the second region in the video-hero case, and shows no editor at all for the background case.

- [ ] **Step 3: Write minimal implementation**

Replace lines 1163-1186 (the `KIND_LABELS`/`GENERIC_KINDS`/root `BlockEditMenu` block) with:

```jsx
// ============================================================
// Root — renders one editor slice per region present on the block,
// instead of picking exactly one kind. See detectRegions() above.
// ============================================================

const CONTENT_LABELS = { gallery: "Gallery", navbar: "Navbar", timeline: "Timeline", bento: "Bento Box" };

export const BlockEditMenu = ({ selectedHtml, onChange, pages = [], projectId = null, blockId = null }) => {
  const regions = useMemo(() => detectRegions(selectedHtml), [selectedHtml]);
  if (!selectedHtml) return null;

  const contentEditor = {
    gallery: <GalleryEditor html={selectedHtml} onChange={onChange} projectId={projectId} blockId={blockId} />,
    navbar: <NavbarEditor html={selectedHtml} onChange={onChange} pages={pages} />,
    timeline: <TimelineEditor html={selectedHtml} onChange={onChange} />,
    bento: <BentoEditor html={selectedHtml} onChange={onChange} />,
  }[regions.content];

  const mediaEditor = {
    image: <ImageBlockEditor html={selectedHtml} onChange={onChange} projectId={projectId} blockId={blockId} />,
    video: <VideoBlockEditor html={selectedHtml} onChange={onChange} projectId={projectId} blockId={blockId} />,
    bg: <BackgroundBlockEditor html={selectedHtml} onChange={onChange} projectId={projectId} blockId={blockId} />,
    "bg-empty": <BackgroundBlockEditor html={selectedHtml} onChange={onChange} projectId={projectId} blockId={blockId} />,
  }[regions.media];

  // The generic text-node editor is suppressed only for navbar (fully
  // owned by NavbarEditor's own brand/items UI) — every other content kind
  // still needs it for text this block's dedicated editor doesn't cover
  // (e.g. a gallery block's own <h2> caption, a bento block's intro
  // paragraph).
  const showGeneric = regions.content !== "navbar";

  const label = CONTENT_LABELS[regions.content] || (regions.media === "video" ? "Video" : regions.media ? "Background" : "Block");

  return (
    <div className="space-y-3" data-testid={`block-edit-menu-${regions.content || regions.media || "generic"}`}>
      <div className="text-[11px] font-semibold text-[#D9BC55]">{label} — edit menu</div>
      {contentEditor}
      {mediaEditor}
      {showGeneric && <GenericBlockEditor html={selectedHtml} onChange={onChange} projectId={projectId} blockId={blockId} />}
    </div>
  );
};
```

Note: `detectBlockKind`, `KIND_LABELS`, `GENERIC_KINDS` are now unused by the root component. Leave `detectBlockKind` itself defined and exported (Global Constraints: legacy detection logic must not be deleted) but grep the file for any other internal caller before removing `KIND_LABELS`/`GENERIC_KINDS` — if none, delete those two constants only.

```bash
grep -n "KIND_LABELS\|GENERIC_KINDS" frontend/src/components/builder/BlockEditMenu.jsx
```

Expected after the edit: no matches outside the deleted block (confirming they're dead).

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- BlockEditMenu.test.jsx -t "composable rendering"`
Expected: PASS, all 4 cases.

- [ ] **Step 5: Run the FULL frontend test suite**

Run: `npm test -- --watchAll=false`
Expected: green. Pay particular attention to any pre-existing test asserting `block-edit-menu-hero` / `block-edit-menu-cta` / `block-edit-menu-card` testids (the old `menuKey` scheme) — update those to the new `data-testid` scheme (`block-edit-menu-{content-or-media-or-generic}`) rather than deleting the assertion.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/builder/BlockEditMenu.jsx frontend/src/components/builder/BlockEditMenu.test.jsx
git commit -m "feat: composable region-based BlockEditMenu rendering

Fixes parallax-hero-fullbleed/parallax-hero-split (background was
completely uneditable) and video-hero (heading/CTA became uneditable
once video kind was picked) by rendering every region a block has
instead of exactly one exclusive kind."
```

---

### Task 9: Backend + full-suite verification pass

**Files:**
- No new files; verification only.

- [ ] **Step 1: Run the full frontend suite one more time from a clean state**

```bash
cd frontend && npm test -- --watchAll=false
```

Expected: 100% green.

- [ ] **Step 2: Run the full backend suite**

```bash
cd backend && pytest -v
```

Expected: 100% green, including `tests/test_block_styles_generated.py`.

- [ ] **Step 3: Add a backend test asserting the var(--block-bg-image, ...) wrapping survives the export pipeline**

```python
# add to backend/tests/test_block_styles_generated.py

class TestBackgroundImageVarWrapping:
    def test_parallax_hero_fullbleed_background_uses_block_bg_image_var(self):
        css = BLOCK_STYLES_BY_CATEGORY["parallax"]
        assert "var(--block-bg-image, url(" in css
        # the scrim gradient layer must still be present alongside the var
        assert "linear-gradient(rgba(10,15,20,.55),rgba(10,15,20,.55))" in css
```

- [ ] **Step 4: Run the new test**

```bash
cd backend && pytest tests/test_block_styles_generated.py -v -k background_image_var
```

Expected: PASS.

- [ ] **Step 5: Manual smoke check — confirm the two regression blocks in the actual builder UI**

Start the dev server (`npm start` in `frontend/`, backend per its own run instructions), drag a `parallax-hero-fullbleed` block onto the canvas, select it, confirm the left sidebar now shows a background editor with an upload/URL control. Drag a `video-hero` block, select it, confirm both the video editor AND the heading/link text fields show simultaneously.

- [ ] **Step 6: Commit**

```bash
git add backend/tests/test_block_styles_generated.py
git commit -m "test: assert --block-bg-image var wrapping survives export pipeline"
```

---

## Self-Review Notes

- **Spec coverage:** §1 (migration, additive) → Tasks 4-5. §2 (legacy compatibility) → Global Constraints + Task 6's `detectContentRegion` content-heuristic fallback (tested explicitly in Task 6's "legacy block with no migration markers" case). §3 (composable regions + `--block-bg-image`) → Tasks 6-8. §4 (`detectBlockShape`) → Task 3. §5 (CSS var wrapping, corrected) → Tasks 1-2. Testing section → covered across Tasks 1, 3, 4, 6, 7, 8, 9.
- **Placeholder scan:** none found — every step has runnable code or an exact command.
- **Type/name consistency checked:** `detectBlockShape` (Task 3) → consumed by name in Task 6's comment and Task 8's region logic path; `detectRegions`'s return shape (`heading`/`media`/`content`/`generic`, Task 6) matches exactly how Task 8 destructures it; `setBlockBgImage` (Task 7) matches the name used in `BackgroundBlockEditor`'s `commit`.
- **Known residual risk, flagged rather than hidden:** Task 5's migration script uses heuristics reused from `detectBlockKind` — it will not achieve 100% automatic coverage across all 117 templates on the first run (some will be skipped and reported per Global Constraints). Task 5 Step 2 requires reading that report before proceeding; it is not a silent "run and move on" step.
