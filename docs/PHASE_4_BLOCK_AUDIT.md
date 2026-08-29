# Phase 4 — Block Menu Audit & CSS-Class Map

> **For:** Reviewer / Phase 4a implementer (DeepSeek V3-Flash handoff #3).
> **Date:** 2026-08-26
> **Scope:** Path B (Hybrid) — audit only, no code changes. Establishes the
> semantic class-naming scheme that `stripInlineStyles` will emit at export
> time so the exported `globals.css` carries stable, themeable,
> Avalon-GEMS-compatible class names instead of today's `.section-N` /
> `.h2-N` numbering.
> **Path A (rewriting every block template to ship with `class="..."`) is
> explicitly deferred to Phase 4b.** This audit is the contract both phases
> share.

---

## 1. Methodology

The handoff (#3) refers to a "BlockMenu.jsx" — **that file does not exist.**
The block menu is `frontend/src/components/builder/LeftSidebar.jsx` (Library
tab). It imports `CATEGORIES` from `@/lib/blocks.js`, which is the merge of
`CORE_CATEGORIES` (defined in `blocks.js`) and `EXTRA_CATEGORIES`
(defined in `blocksExtra.js`) via `mergeCategories()`. Block *templates* are
also referenced by `pageLayouts.js`, but those are full-page compositions for
the "Add page" picker — not sidebar blocks — so they are listed separately in
§6 and excluded from the class-naming scheme (each page layout is a one-off
composite, not a reusable block).

This audit:

1. Enumerates every block in the merged `CATEGORIES` (what the sidebar
   actually renders).
2. Proposes a stable, semantic CSS class name per block:
   `block-<categoryId>-<slug>`.
3. Cross-checks against the handoff's 12 named sections.
4. Reports the gap: today's `stripInlineStyles.js` emits `.section-1`,
   `.h2-1`, … numbered by tag-encounter order, page-local, non-semantic —
   zero of the 91 blocks have a stable class today.

Source data was extracted by parsing `blocks.js` + `blocksExtra.js` directly
(the generator script is `/tmp/audit_blocks.mjs`), not by importing the
module (the module's ESM import path requires a bundler).

---

## 2. Real CATEGORIES inventory

`mergeCategories` concatenates `blocks` arrays for duplicate category ids.
`navbars` is the only category that appears in both source files (2 blocks
in `blocks.js` + 5 in `blocksExtra.js` = 7 after merge). Every other
category lives in exactly one source file.

| Category id | Label | # blocks | Source |
|---|---|---:|---|
| `components` | Components | 13 | blocks.js |
| `timelines` | Timelines | 5 | blocks.js |
| `navbars` | Navbars | 7 | blocks.js + blocksExtra.js |
| `heroes` | Heroes | 2 | blocks.js |
| `sections` | Sections | 2 | blocks.js |
| `containers` | Containers | 3 | blocks.js |
| `text` | Text | 5 | blocks.js |
| `toolbox` | Toolbox | 6 | blocks.js |
| `headers` | Headers | 5 | blocksExtra.js |
| `footers` | Footers | 7 | blocksExtra.js |
| `video` | Video BG | 3 | blocksExtra.js |
| `pricing` | Pricing | 1 | blocksExtra.js |
| `team` | Team | 1 | blocksExtra.js |
| `faq` | FAQ | 1 | blocksExtra.js |
| `newsletter` | Newsletter | 1 | blocksExtra.js |
| `portfolio` | Portfolio | 1 | blocksExtra.js |
| `layout` | Layout | 1 | blocksExtra.js |
| `services` | Services | 1 | blocksExtra.js |
| `contact` | Contact | 1 | blocksExtra.js |
| `testimonials` | Testimonials | 1 | blocksExtra.js |
| `esports` | Esports | 6 | blocksExtra.js |
| `creator` | Creator | 1 | blocksExtra.js |
| `parallax` | Parallax | 5 | blocksExtra.js |
| `social` | Social | 1 | blocksExtra.js |
| `comments` | Comments | 1 | blocksExtra.js |
| `zenero` | Zenero Content | 10 | blocksExtra.js |

**Totals: 26 unique categories, 91 blocks.**
---

## 3. Class-naming scheme

**Rule:** `block-<categoryId>-<slug>` where:

- `<categoryId>` is the merged `CATEGORIES` entry's `id` (e.g. `navbars`,
  `heroes`, `zenero`).
- `<slug>` is the block's `id` with a leading category-related prefix
  stripped **if** one exists, else the full block id. The prefix table is
  fixed and lives in `stripInlineStyles.js` (Task 1) so the slug is
  deterministic:

  | categoryId | strip prefix |
  |---|---|
  | `components` | `cmp-` |
  | `timelines` | `cmp-timeline-` |
  | `navbars` | `nav-` |
  | `headers` | `hdr-` |
  | `footers` | `ft-` |
  | `video` | `video-` |
  | `heroes` | `hero-` |
  | `sections` | `section-` |
  | `containers` | `container-` |
  | `text` | `text-` |
  | `toolbox` | `tb-` |
  | `pricing` | `pricing-` |
  | `team` | `team-` |
  | `faq` | `faq-` |
  | `newsletter` | `newsletter-` |
  | `portfolio` | `portfolio-` |
  | `layout` | `layout-` |
  | `services` | `services-` |
  | `contact` | `contact-` |
  | `testimonials` | `testimonial-` |
  | `esports` | `esports-` |
  | `creator` | `creator-` |
  | `retro` | `retro-` |
  | `parallax` | `parallax-` |
  | `social` | `social-` |
  | `comments` | `comments-` |
  | `zenero` | _(none — zenero block ids have no common prefix)_ |

**Examples:**
- `cmp-gallery-grid` (category `components`) → `block-components-gallery-grid`
- `nav-mega` (category `navbars`) → `block-navbars-mega`
- `hero-centered` (category `heroes`) → `block-heroes-centered`
- `updates-block` (category `zenero`, no prefix) → `block-zenero-updates-block`

**Why this scheme:**
- **Stable.** The class is a pure function of `(categoryId, blockId)`,
  both immutable in the block library. Re-inserting the same block, or
  re-exporting the same project, yields the same class.
- **Semantic.** The class name reads as "the gallery-grid block from the
  components category" — usable by Avalon GEMS as a targeting selector.
- **Collision-free across pages.** The export's existing `prefix` param
  (e.g. `about-`) still applies, so a class on page A becomes
  `about-block-heroes-centered` vs page B's `index-block-heroes-centered`
  when needed. (Task 1 will decide whether the prefix is still required
  given the class is already semantic — see Task 1 plan §risk #1.)
- **No per-occurrence numbering.** A block with three `style="..."`
  attributes today produces three classes (`.section-1`, `.div-2`,
  `.h2-3`); the new scheme collapses them into one
  `.block-heroes-centered` rule with all three declarations merged. This
  is what makes Avalon GEMS overrides actually win (one rule to override,
  not three).


---

## 4. Cross-check vs handoff's 12 sections

The handoff (#3, Part 4 Task 2) names 12 globals.css sections: `headers,
nav, heroes, galleries, portfolio, testimonials, video, esports, zenero,
updates, neon, variants`. Reconciling against the real `CATEGORIES`:

| Handoff section | Real category(ies) | Status |
|---|---|---|
| headers | `headers` (5) | ✅ match |
| nav | `navbars` (7) | ✅ match (handoff says "nav", code says "navbars") |
| heroes | `heroes` (2) + `parallax` (5) | ⚠ handoff misses parallax heroes |
| galleries | `components` (gallery subset, 6) | ⚠ handoff invents a "galleries" category that doesn't exist; galleries live under `components` |
| portfolio | `portfolio` (1) | ✅ match |
| testimonials | `testimonials` (1) + `components` (`cmp-testimonial`) | ⚠ handoff misses the legacy `cmp-testimonial` block |
| video | `video` (3) | ✅ match |
| esports | `esports` (6) + `zenero` (3 esports-live blocks) | ⚠ handoff misses the live esports blocks under zenero |
| zenero | `zenero` (10) | ✅ match (handoff folds "updates" into zenero — see next row) |
| updates | _(part of `zenero`)_ | ❌ handoff lists "updates" as a section; in code it's the `updates-block` block inside `zenero` |
| neon | — | ❌ does not exist in the codebase (no neon category, no neon blocks) |
| variants | — | ❌ does not exist; "variants" in this codebase is a per-block instance concept (`lib/variants.js`), not a CSS section |

**Real categories the handoff misses entirely:** `components` (non-gallery),
`timelines`, `sections`, `containers`, `text`, `toolbox`, `pricing`,
`team`, `faq`, `newsletter`, `layout`, `services`, `contact`, `creator`,
`social`, `comments`, `retro`.

**Conclusion:** The handoff's 12-section list was written against a
different (or aspirational) block taxonomy. Phase 4a will generate the
`globals.css` "Blocks:" subsections from the **real 26 categories**, not
the handoff's 12. Each category becomes one labeled subsection; the
handoff's `neon` and `variants` sections are dropped, and `updates` is
folded into `zenero` (matching the code).

---

## 5. Gap report — current state vs target

**Today (`stripInlineStyles.js`, line 60–70):**
```js
const cls = `${prefix}${tag}-${tagCounters[tag]}`;
// → ".section-1", ".h2-1", ".div-3", …  numbered by tag-encounter order
```

- Class names are **page-local** (the counter resets per export call) and
  **non-semantic** (`.section-1` says nothing about what the block is).
- One class is emitted **per `style="..."` occurrence**, so a single hero
  block with three styled children produces three unrelated classes —
  Avalon GEMS cannot target "the hero block" with one rule.
- `classMap` (the inverse map, `cls → { elementId, occurrence }`) is
  consumed by exactly one production file, `cssPaneSync.js` (the live
  CSS pane's reconciliation). That is the only caller that needs to be
  updated when the scheme changes (Task 1 risk #1).

**Target (after Task 1):**
- Every block from the library gets one stable semantic class:
  `block-<categoryId>-<slug>`.
- All of that element's `style="..."` declarations collapse into one
  rule under that class.
- User-authored / imported markup (no block id) falls back to today's
  `.section-N` behavior so existing imports and hand-written HTML keep
  working.

**Coverage today:** 0 / 91 blocks have a stable semantic class.
---

## 6. Out of scope (but inventoried for completeness)

### `pageLayouts.js` — full-page layouts (not blocks)

`PAGE_LAYOUTS` exports 44 named page layouts (e.g. `home-modern`,
`about-editorial`, `shop-cart`, `industry-gym`) composed from ~30 reusable
section builders (`nav`, `heroCenter`, `features`, `stats`, `about`,
`values`, `servicesGrid`, `gallery`, `masonry`, `blogList`, `team`,
`testimonials`, `pricing`, `faq`, `contact`, `ctaBand`, `footer`,
`productGrid`, `productDetail`, `cart`, `cartRuntime`, `specs`,
`listenOn`, `changelog`, `simpleList`). These are **not** sidebar blocks
and are not part of `CATEGORIES`. Under Path B they keep their current
inline-styled HTML and get the same `.section-N` fallback treatment on
export. A future phase may give the section builders their own class
names (`block-layout-nav`, `block-layout-hero-centered`, …) but that is
not in scope for 4a.

### `cdnComponents.js`, `starterStyles.js`, `zeneroWidgets.js`

Auxiliary template sources. `cdnComponents.js` is a separate "CDN" tab
catalog; `starterStyles.js` seeds starter-template CSS; `zeneroWidgets.js`
holds the dashboard widget definitions. None feed `CATEGORIES`. No class
scheme proposed for them in 4a.

---

## 7. Per-block class map (full)

### Components (`components`) — 13 blocks
| block id | label | proposed class |
|---|---|---|
| `cmp-gallery-grid` | Gallery · 3-col Grid | `block-components-gallery-grid` |
| `cmp-gallery-masonry` | Gallery · Masonry | `block-components-gallery-masonry` |
| `cmp-gallery-carousel` | Gallery · Scroll Carousel | `block-components-gallery-carousel` |
| `cmp-gallery-hover` | Gallery · Hover Zoom | `block-components-gallery-hover` |
| `cmp-gallery-polaroid` | Gallery · Polaroid Stack | `block-components-gallery-polaroid` |
| `cmp-gallery-lightbox` | Gallery · Featured + Thumbs | `block-components-gallery-lightbox` |
| `cmp-header-lrg` | Large Header | `block-components-header-lrg` |
| `cmp-nav-glass` | Glass Navbar | `block-components-nav-glass` |
| `cmp-anim-hero` | Animated Hero | `block-components-anim-hero` |
| `cmp-anim-marquee` | Animated Marquee | `block-components-anim-marquee` |
| `cmp-testimonial` | Testimonial | `block-components-testimonial` |
| `cmp-pricing-3` | Pricing (3-col) | `block-components-pricing-3` |
| `cmp-footer` | Footer | `block-components-footer` |

### Timelines (`timelines`) — 5 blocks
| block id | label | proposed class |
|---|---|---|
| `cmp-timeline-vert` | Vertical Timeline | `block-timelines-vert` |
| `cmp-timeline-alt` | Alternating Timeline | `block-timelines-alt` |
| `cmp-timeline-hori` | Horizontal Timeline | `block-timelines-hori` |
| `cmp-timeline-cards` | Card Timeline | `block-timelines-cards` |
| `cmp-timeline-steps` | Numbered Steps | `block-timelines-steps` |

### Navbars (`navbars`) — 7 blocks
| block id | label | proposed class |
|---|---|---|
| `nav-simple` | Simple Navbar | `block-navbars-simple` |
| `nav-dark` | Dark Navbar | `block-navbars-dark` |
| `nav-centered-logo` | Centered Logo Nav | `block-navbars-centered-logo` |
| `nav-mega` | Mega-menu Nav | `block-navbars-mega` |
| `nav-ecommerce` | E-commerce Nav + Search | `block-navbars-ecommerce` |
| `nav-transparent` | Transparent Overlay Nav | `block-navbars-transparent` |
| `nav-app-tabs` | App Pill-tabs Nav | `block-navbars-app-tabs` |

### Heroes (`heroes`) — 2 blocks
| block id | label | proposed class |
|---|---|---|
| `hero-centered` | Centered Hero | `block-heroes-centered` |
| `hero-split` | Split Hero | `block-heroes-split` |

### Sections (`sections`) — 2 blocks
| block id | label | proposed class |
|---|---|---|
| `section-feature` | Feature Grid | `block-sections-feature` |
| `section-cta` | CTA Banner | `block-sections-cta` |

### Containers (`containers`) — 3 blocks
| block id | label | proposed class |
|---|---|---|
| `container-basic` | Container | `block-containers-basic` |
| `container-2col` | 2 Columns | `block-containers-2col` |
| `container-3col` | 3 Columns | `block-containers-3col` |

### Text (`text`) — 5 blocks
| block id | label | proposed class |
|---|---|---|
| `text-h1` | Heading 1 | `block-text-h1` |
| `text-h2` | Heading 2 | `block-text-h2` |
| `text-p` | Paragraph | `block-text-p` |
| `text-input` | Text Input | `block-text-input` |
| `text-area` | Textarea | `block-text-area` |

### Toolbox (`toolbox`) — 6 blocks
| block id | label | proposed class |
|---|---|---|
| `tb-button` | Button | `block-toolbox-button` |
| `tb-image` | Image | `block-toolbox-image` |
| `tb-divider` | Divider | `block-toolbox-divider` |
| `tb-spacer` | Spacer | `block-toolbox-spacer` |
| `tb-avatar` | Avatar | `block-toolbox-avatar` |
| `tb-badge` | Badge | `block-toolbox-badge` |

### Headers (`headers`) — 5 blocks
| block id | label | proposed class |
|---|---|---|
| `hdr-announcement` | Announcement + Header | `block-headers-announcement` |
| `hdr-dropdown` | Header + Dropdown | `block-headers-dropdown` |
| `hdr-minimal-serif` | Minimal Serif Header | `block-headers-minimal-serif` |
| `hdr-dark-cta` | Dark Header + CTA | `block-headers-dark-cta` |
| `hdr-search-actions` | Header + Search + Icons | `block-headers-search-actions` |

### Footers (`footers`) — 7 blocks
| block id | label | proposed class |
|---|---|---|
| `ft-minimal` | Minimal Footer | `block-footers-minimal` |
| `ft-newsletter` | Newsletter Footer | `block-footers-newsletter` |
| `ft-social-dark` | Social Footer | `block-footers-social-dark` |
| `ft-columns-light` | 4-column Light Footer | `block-footers-columns-light` |
| `ft-contact` | Contact Footer | `block-footers-contact` |
| `ft-app-download` | App Download Footer | `block-footers-app-download` |
| `ft-mega-multicol` | Mega 5-column Footer | `block-footers-mega-multicol` |

### Video BG (`video`) — 3 blocks
| block id | label | proposed class |
|---|---|---|
| `video-hero` | Hero · Video Background | `block-video-hero` |
| `video-section` | Section · Video + Text | `block-video-section` |
| `video-banner` | Video Banner Strip | `block-video-banner` |

### Pricing (`pricing`) — 1 block
| block id | label | proposed class |
|---|---|---|
| `pricing-toggle` | Pricing · Monthly/Yearly Toggle | `block-pricing-toggle` |

### Team (`team`) — 1 block
| block id | label | proposed class |
|---|---|---|
| `team-cards` | Team · Member Cards | `block-team-cards` |

### FAQ (`faq`) — 1 block
| block id | label | proposed class |
|---|---|---|
| `faq-accordion` | FAQ · Accordion | `block-faq-accordion` |

### Newsletter (`newsletter`) — 1 block
| block id | label | proposed class |
|---|---|---|
| `newsletter-signup` | Newsletter · Signup + Validation | `block-newsletter-signup` |

### Portfolio (`portfolio`) — 1 block
| block id | label | proposed class |
|---|---|---|
| `portfolio-filter` | Portfolio · Filterable Gallery | `block-portfolio-filter` |

### Layout (`layout`) — 1 block
| block id | label | proposed class |
|---|---|---|
| `layout-bento` | Bento Grid | `block-layout-bento` |

### Services (`services`) — 1 block
| block id | label | proposed class |
|---|---|---|
| `services-icons` | Services · Icon Grid | `block-services-icons` |

### Contact (`contact`) — 1 block
| block id | label | proposed class |
|---|---|---|
| `contact-recaptcha` | Contact Form · reCAPTCHA | `block-contact-recaptcha` |

### Testimonials (`testimonials`) — 1 block
| block id | label | proposed class |
|---|---|---|
| `testimonial-carousel` | Testimonial · Carousel | `block-testimonials-carousel` |

### Esports (`esports`) — 6 blocks
| block id | label | proposed class |
|---|---|---|
| `esports-roster` | Esports · Team Roster | `block-esports-roster` |
| `esports-bracket` | Esports · Tournament Bracket | `block-esports-bracket` |
| `esports-schedule` | Esports · Stream Schedule | `block-esports-schedule` |
| `esports-stats` | Esports · Player Stat Cards | `block-esports-stats` |
| `esports-leaderboard` | Esports · Leaderboard | `block-esports-leaderboard` |
| `esports-org-hub` | Esports · Organization Hub | `block-esports-org-hub` |

### Creator (`creator`) — 1 block
| block id | label | proposed class |
|---|---|---|
| `creator-membership` | Creator · Subscription Tiers | `block-creator-membership` |

### Parallax (`parallax`) — 5 blocks
| block id | label | proposed class |
|---|---|---|
| `parallax-hero-fullbleed` | Parallax Hero · Full Bleed | `block-parallax-hero-fullbleed` |
| `parallax-hero-split` | Parallax Hero · Split Content | `block-parallax-hero-split` |
| `parallax-section-quote` | Parallax Section · Big Quote | `block-parallax-section-quote` |
| `parallax-section-stats` | Parallax Section · Stats Band | `block-parallax-section-stats` |
| `parallax-section-cta` | Parallax Section · CTA Banner | `block-parallax-section-cta` |

### Social (`social`) — 1 block
| block id | label | proposed class |
|---|---|---|
| `social-wall-columns` | Social Media Wall (Multi-Column) | `block-social-wall-columns` |

### Comments (`comments`) — 1 block
| block id | label | proposed class |
|---|---|---|
| `comments-section` | Comment Thread | `block-comments-section` |

### Zenero Content (`zenero`) — 10 blocks
| block id | label | proposed class |
|---|---|---|
| `updates-block` | Latest Updates | `block-zenero-updates-block` |
| `gallery-block` | Gallery Grid | `block-zenero-gallery-block` |
| `latest-from-blog` | Latest from Blog | `block-zenero-latest-from-blog` |
| `portfolio-timeline` | Portfolio Timeline | `block-zenero-portfolio-timeline` |
| `testimonials-from-comments` | Testimonials from Comments | `block-zenero-testimonials-from-comments` |
| `timeline-block` | Timeline | `block-zenero-timeline-block` |
| `bento-block` | Features Bento | `block-zenero-bento-block` |
| `esports-roster-live` | Esports · Roster (live) | `block-zenero-esports-roster-live` |
| `esports-fixtures-live` | Esports · Fixtures (live) | `block-zenero-esports-fixtures-live` |
| `esports-org-stats-live` | Esports · Org Stats (live) | `block-zenero-esports-org-stats-live` |

---

## 8. Recommendations for Phase 4a (Path B)

1. **Adopt the §3 class-naming scheme verbatim** in `stripInlineStyles.js`
   (Task 1). The prefix-strip table in §3 is the single source of truth;
   both the frontend `stripInlineStyles.js` and the backend
   `server.py::_strip_inline_styles` mirror it.
2. **Generate the globals.css "Blocks:" subsections from the real 26
   categories** (Task 2), not the handoff's 12. Drop `neon` and `variants`;
   fold `updates` into `zenero`.
3. **`pageLayouts.js` stays out of scope** for 4a. Its 44 page layouts
   keep the `.section-N` fallback; a future phase may class the ~30
   section builders.
4. **Block id propagation check** (Task 1 prerequisite): confirm that
   when `LeftSidebar.onAddBlock` inserts a block, the resulting element
   carries the block's library `id` in its `element.id` field (so the
   Task 1 resolver `elId → blockClass` can look it up). The audit did
   not verify this; Task 1's first implementation step is to confirm it
   (the resolver gracefully no-ops if the id is absent, falling back to
   `.section-N`, so this is a correctness check, not a blocker).
5. **Multi-page prefix decision**: today `buildMultiPageExport` passes
   `prefix = "<slug>-"` to `stripInlineStyles` so two pages' `.nav-1`
   don't collide. With semantic class names the collision risk is
   smaller (`.block-navbars-mega` is the same on every page by design —
   that's the point of sharing `globals.css`). Task 1 should keep the
   `prefix` arg for the fallback path but **drop it for the semantic
   path** so the same block on two pages shares one rule in
   `globals.css`. Confirm during Task 1 that this doesn't break
   per-page color overrides (`responsiveOverrides.js` keys off element
   id, not class name, so it should be unaffected).

