# globals.css — Canonical Structure Reference

> **Purpose:** This document defines the canonical section structure of `globals.css`
> as produced by the export pipeline. Every exported site carries exactly one `globals.css`
> file, shared across all pages. The parser and code generators should produce stylesheets
> matching this structure.
>
> Produced by `frontend/src/lib/exportHtml.js::buildOrganizedStylesheet()` (frontend)
> and `backend/server.py::_build_organized_stylesheet()` (backend). Both emit identical
> section headers and ordering — keep them in sync.

---

## Section Order (Cascade Priority: Top to Bottom)

```css
/* ===== Theme Variables ===== */
/* ===== Base ===== */
/* ===== Blocks: <Category Label> ===== */  /* one per block category */
/* ===== Components ===== */                  /* generic / imported CSS */
/* ===== Animations ===== */
/* ===== Media Queries ===== */
/* ===== Reduced Motion ===== */              /* prefers-reduced-motion a11y */
```

---

## 1. Theme Variables

```css
/* ===== Theme Variables ===== */
:root {
  /* --fc-* tokens: generated from the Theme editor, merged across pages */
  --fc-primary: #2563eb;
  --fc-text: #0f172a;
  --fc-bg: #ffffff;
  --fc-muted: #64748b;
  --fc-border: #e2e8f0;
  --fc-surface: #f8fafc;
  --fc-accent: #f59e0b;

  /* --wd-* tokens: canvas background per page */
  --wd-canvas-bg: #ffffff;

  /* --font-* tokens: uploaded font families; @font-face rules in Base */
  --font-heading: "Fraunces", serif;
  --font-body: "Sora", sans-serif;

  /* Per-page canvas background overrides (multi-page export) */
  /* [data-wd-page="index"] { --wd-canvas-bg: #101418; } */
  /* [data-wd-page="about"] { --wd-canvas-bg: #ffffff; } */
}
```

**Where these come from:**
- `<style data-forge-theme="...">` blocks — `:root` declarations land here
- `<style data-forge-vars>` blocks — custom property declarations
- `<style data-forge-fonts>` blocks — `:root` declarations (the `--font-*` vars)
- Uploaded font `@font-face` rules and `:root` font-var declarations

---

## 2. Base

```css
/* ===== Base ===== */
body {
  margin: 0;
  background: var(--wd-canvas-bg, #ffffff);
}

/* @font-face rules from uploaded fonts go here */
@font-face {
  font-family: "Custom Font";
  src: url("fonts/custom-font.woff2") format("woff2");
  font-display: swap;
}

/* Other global base styles */
*, *::before, *::after {
  box-sizing: border-box;
}
```

**Where these come from:**
- Generated canvas-background rule (one shared `body { background: var(--wd-canvas-bg) }`)
- `[data-wd-page="slug"] { --wd-canvas-bg: <color>; }` overrides (one per page)
- `<style data-forge-theme>` non-`&colon;root` rules (font-family on body, etc.)
- `<style data-forge-fonts>` `@font-face` rules
- Any per-page canvas background CSS variables

---

## 3. Blocks: <Category> (one section per block category)

```css
/* ===== Blocks: Heroes ===== */
.block-heroes-centered-1 {
  padding: 64px;
  /* Extracted from style="padding:64px;" on the first occurrence */
}
.block-heroes-centered-2 {
  color: #111;
  /* Extracted from style="color:#111;" on the second occurrence */
}

/* ===== Blocks: Navbars ===== */
.index-block-navbars-simple-1 {
  padding: 8px;
  /* Page-prefixed in multi-page export */
}
.about-block-navbars-simple-1 {
  padding: 16px;
}
```

**Where these come from:**
- `stripInlineStyles()` extracts every `style="&hellip;"` attribute from block elements
- Each extraction becomes a `.block-<catId>-<slug>-<occ>` rule (semantic path)
- Unstamped/user-authored elements use `.&lt;tag&gt;-&lt;n&gt;` fallback
- In multi-page exports, rule classes are prefixed with the page slug (e.g. `.index-`)
- The unprefixed marker class (e.g. `.block-heroes-centered`) has NO CSS rule — it's
  an override hook for Avalon GEMS themes

**Category section labels are the real `CATEGORIES[i].label` values** (from
`frontend/src/lib/blocks.js`/`blocksExtra.js`, mirrored in `backend/server.py`'s
`_BLOCK_CATEGORY_LABELS`) — NOT a fixed hand-typed list. The list below (28 categories,
current as of the Phase 4b backend-parity fix) is a snapshot for reference; if a category's
`label` field ever changes, the exported section name changes with it automatically, no code
change needed anywhere else:

`Blocks: Components`, `Blocks: Timelines`, `Blocks: Navbars`, `Blocks: Headers`,
`Blocks: Footers`, `Blocks: Video BG`, `Blocks: Heroes`, `Blocks: Sections`,
`Blocks: Containers`, `Blocks: Text`, `Blocks: Toolbox`, `Blocks: Pricing`,
`Blocks: Team`, `Blocks: FAQ`, `Blocks: Newsletter`, `Blocks: Portfolio`,
`Blocks: Layout`, `Blocks: Services`, `Blocks: Contact`, `Blocks: Testimonials`,
`Blocks: Esports`, `Blocks: Creator`, `Blocks: Moldy Oldies` (category id `retro`),
`Blocks: Parallax`, `Blocks: Social`, `Blocks: Comments`, `Blocks: Zenero Content`
(category id `zenero`), `Blocks: Oxygene`

Three of these read differently from their category `id` — `video`→"Video BG",
`retro`→"Moldy Oldies", `zenero`→"Zenero Content" — that's intentional, matching what
the Library sidebar shows the user, not a typo. An earlier version of this doc listed
`Blocks: Video`/`Blocks: Retro`/`Blocks: Zenero` (the id, title-cased) and omitted
`Oxygene` entirely — both wrong; corrected 2026-08-30.

---

## 4. Components

```css
/* ===== Components ===== */
/*
  Generic CSS that doesn't belong to a specific block category.
  Includes:
  - User-authored/imported CSS from <style data-forge-imported-css>
  - Legacy .<tag>-<n> fallback rules from unstamped elements
  - Any CSS that couldn't be bucketed into a "Blocks:" category
*/
.imported-rule {
  color: red;
}
```

---

## 5. Animations

```css
/* ===== Animations ===== */
@keyframes wd-fade-el1 {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes gem-pulse {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.1); }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes sparkle-sweep {
  0% { left: -100%; }
  100% { left: 100%; }
}

@keyframes bubble-pop {
  0% { width: 0; height: 0; opacity: 1; }
  100% { width: 40px; height: 40px; opacity: 0; }
}
```

**Where these come from:**
- `<style data-forge-anim="elId">` blocks from per-element animation keyframes
- Avalon GEMS theme animations (gem-pulse, shimmer, sparkle-sweep, bubble-pop)
- `@keyframes` rules are deduplicated across pages

---

## 6. Media Queries

```css
/* ===== Media Queries ===== */
/* Responsive baseline — always present */
@media (max-width: 1024px) {
  [data-wd-stack] {
    grid-template-columns: 1fr !important;
  }
  /* grid-template-columns overrides for tablet */
  .block-layout-bento-1 { grid-template-columns: 1fr !important; }
}

@media (max-width: 767px) {
  [data-wd-stack] {
    grid-template-columns: 1fr !important;
  }
  /* grid-template-columns overrides for mobile */
  .block-layout-bento-1 { grid-template-columns: 1fr !important; }
}

@container (max-width: 1024px) {
  [data-wd-stack] { grid-template-columns: 1fr !important; }
}

@container (max-width: 767px) {
  [data-wd-stack] { grid-template-columns: 1fr !important; }
}

/* Responsive overrides from <style data-forge-responsive-overrides> */
@media (max-width: 767px) {
  [data-forge-el-id="el1"] {
    display: none !important;
  }
}
```

**Where these come from:**
- `RESPONSIVE_CSS_BODY` baseline — two-tier (1024px tablet, 767px mobile) grid collapse
- `<style data-forge-responsive-overrides>` — per-element visibility/stacking rules
- `stripInlineStyles()` auto-generates grid-template-columns overrides for elements
  whose inline style contains `grid-template-columns`

---

## 7. Reduced Motion (A11y)

```css
/* ===== Reduced Motion ===== */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Always present.** Essential for accessibility — users with vestibular disorders
see a static site regardless of what animations the theme or blocks define.

---

## Full Example Output

```css
/* ===== Theme Variables ===== */
:root {
  --fc-primary: #2563eb;
  --fc-text: #0f172a;
  --fc-bg: #ffffff;
}

/* ===== Base ===== */
body {
  margin: 0;
  background: var(--wd-canvas-bg, #ffffff);
}
[data-wd-page="index"] { --wd-canvas-bg: #101418; }

/* ===== Blocks: Heroes ===== */
.block-heroes-centered-1 { padding: 64px; }
.block-heroes-centered-2 { color: #111; }

/* ===== Components ===== */
/* none */

/* ===== Animations ===== */
@keyframes wd-fade-el1 {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* ===== Media Queries ===== */
@media (max-width: 1024px) {
  [data-wd-stack] { grid-template-columns: 1fr !important; }
}
@media (max-width: 767px) {
  [data-wd-stack] { grid-template-columns: 1fr !important; }
}

/* ===== Reduced Motion ===== */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Key Constraints

1. **Section order is fixed** — every exported globals.css has exactly these sections
   in this order, even if empty (`/* none */`).
2. **Font `@font-face` rules go in Base**, not in Theme Variables. The `:root` font
   variable declarations from the same `<style data-forge-fonts>` block go in
   Theme Variables.
3. **Imported CSS** (from `<style data-forge-imported-css>`) lands in the Components
   section — never in a "Blocks:" category, never in Theme Variables or Base.
4. **`data-wd-page` canvas overrides** are CSS custom properties, not `<style>` tags.
   Each page gets `[data-wd-page="slug"] { --wd-canvas-bg: <color>; }` in Base.
5. **No duplicate `:root` blocks.** All `:root` declarations from all pages are merged
   into one deduplicated `:root` block. Later declarations win on name collision.
6. **`!important` in Media Queries is intentional** — the responsive grid collapse
   must override the per-occurrence class specificity.

---

*Last verified against: `frontend/src/lib/exportHtml.js::buildOrganizedStylesheet()` — Phase 7*
