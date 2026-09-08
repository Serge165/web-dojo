# Starter Template Documentation

Audit & documentation scaffold for the `backend/starter_templates.py` bundle
(currently **57** templates: 27 aesthetic mood-boards + retro-nostalgia +
modern content-type, all multi-page).

QA status: every template passes `backend/tests/test_template_validate.py`
(steps 1–5: syntax, page/slugs, internal-link resolution, tag balance, and
index reachability). Run it after any template change:

```bash
cd backend && python3 -m pytest tests/test_template_validate.py -q
```

## 1. Current inventory (page structures)

### Aesthetic mood-boards — already expanded to 3 pages each
| Template | Business | Pages |
|----------|----------|-------|
| Frutiger Aero | tech startup | index, pricing, about |
| Dark Academia | literary journal | index, archive, about |
| Solar Punk | eco brand | index, manifesto, about |
| Cottagecore | bakery | index, menu, visit |
| Y2K | music streaming | index, about, guestbook |
| Vaporwave | record shop | index, shop, about |
| Cyberpunk | security tool | index, pricing, about |
| Brutalism | architecture firm | index, work, contact |
| Bauhaus | design studio | index, work, contact |
| Scandi Minimal | furniture brand | index, shop, about |
| Memphis | creative agency | index, portfolio, contact |
| Retro-Futurism | vintage tech blog | index, modules, crew |
| Bloomcore | florist | index, shop, visit |
| Neubrutalism | dev studio | index, work, contact |
| Corp Memphis | productivity SaaS | index, pricing, about |
| Kidcore | children's products | index, shop, contact |
| Blueprint | engineering firm | index, catalogue, contact |
| Editorial Warm | online magazine | index, essays, about |
| Diffused Worlds | wellness app | index, shop, about |
| Cassette Futurism | retro tech blog | index, catalogue, contact |
| Newspaper | news site | index, archive, subscribe |
| Barbiecore | fashion brand | index, shop, about |
| Win95 | retro computing | index, guestbook |
| Grunge Zine | music blog | index, issue, contact |
| Art Nouveau | artist portfolio | index, gallery, contact |
| Swiss | minimalist portfolio | index, work, contact |
| Goblincore | nature products | index, shop, contact |

### Retro-nostalgia — already expanded per the modernization spec
| Template | Pages | Spec requirement satisfied |
|----------|-------|----------------------------|
| MySpace Throwback | index, blog, **comments** | Blog + Comments/Guestbook |
| Geocities Homepage | index, **webring**, **links** | Webring + Links + hit counters |
| Forum Throwback | index, **board**, **thread** | Second board + thread view |
| Xanga Throwback | index, **archive**, subscriptions, about | Archive + Friends/subscriptions |
| LiveJournal Throwback | index, **archive**, **friends**, profile | Archive + Friends |
| Blog | index, **archive**, **post**, about | Archive + individual post |
| Win95 | index, **guestbook** | Guestbook (2 pages) |

### Modern content-type (10) + Esports (13 palettes × 6 pages)
Modern starters each expose index + 2 sub-pages; every Esports palette ships a
full 6-page site (index, roster, matches, news, shop, about).

## 2. Per-template documentation format

For each template, maintain a block covering:

1. **Design principles & aesthetic goals** — the vibe, palette, type system.
2. **Business type & target audience** — the implied customer.
3. **Page structure & navigation flow** — slugs + how `_simple_nav()`/nav links
   the pages.
4. **Customization guidelines** — where to change copy, colors, links.
5. **Code architecture notes** — helpers (`_simple_nav`, `_comments_section`,
   `_esports_pages`), fonts, `--fc-*` token usage, page assembly.

### Worked example — Frutiger Aero (`starter-frutiger-aero`)
- **Aesthetic:** glossy aqua/teal, back-of-a-Vista-box optimism.
- **Business:** tech startup; **audience:** early adopters of friendly software.
- **Structure:** `index.html` hero/features → `pricing.html` → `about.html`;
  nav via `_simple_nav()` and CTA.
- **Customize:** swap `[("Pricing", "pricing.html"), ("About", "about.html")]`
  and the copy strings in each `_page(...)` block.
- **Architecture:** `_tpl(..., html_blocks=[], pages=[...])`; every page shares
  the same `nav`/`footer` variables; fonts `["Fraunces","Space Grotesk"]`.
  Palette is fixed-hex in this starter (not re-themable via `--fc-*`) by design.

### Worked example — MySpace Throwback (`starter-myspace-throwback`)
- **Aesthetic:** infinite-profile-page chaos, autoplaying MIDI energy.
- **Business:** personal/profile site; **audience:** retro-web storytellers.
- **Structure:** `index.html` profile card → `blog.html` posts →
  `comments.html` via `_comments_section()` (guestbook).
- **Architecture:** comments reuse the shared JSON-seeded comments script so
  guestbook entries persist without bespoke backend.

## 3. Follow-up backlog (from the modernization spec)

Already-satisfied items are marked above. Remaining nice-to-haves:
- **Win95:** add a second faux-application window (currently 2 pages).
- **Forum Throwback:** a second board/category page (currently index/board/thread).
- **Geocities:** ensure hit-counter markup is visibly period-correct on all
  pages (webring + links pages exist).
- **Aesthetics:** consider surfacing the editor "Aesthetic" skins (now in
  `frontend/src/themes/aestheticThemes.js`) next to these starters.

## 4. Browser-testing note

Static steps 1–4 run in CI via pytest. The navigation/cross-page-click test and
visual regression belong in `frontend/playwright.config.js` (browser): click
each nav link, assert landed URL matches a real slug, and snapshot each page.
