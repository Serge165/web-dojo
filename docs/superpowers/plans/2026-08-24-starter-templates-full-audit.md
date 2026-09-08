# Starter templates — full audit, phase 2 (remaining 34)

**Status: DONE (2026-08-24).** All 34 templates below were converted from
single scrolling pages into real multi-page sites, following the same
`_starter_<name>()` function pattern phase 1 established (one function per
template, `_page()`-based, called from `STARTER_TEMPLATES`). The 7
retro-nostalgia templates got period-appropriate pages only (no modernizing,
per the guardrail below) — see each one's function in `starter_templates.py`
for exactly what was added.

Verified across all 57 templates (not just these 34): every template has
`len(pages) > 1`, every internal `href="*.html"` resolves to a real page in
that template, every element's HTML tags are open/close-balanced, no
duplicate template ids, and `active_page_id` matches the first page. Spot
double-checked live in the browser (start Mongo + backend + frontend, pick a
template from Project Templates, confirm nav renders and cross-page links
work) for one retro template (MySpace) in an earlier pass, and Goblincore
(aesthetic mood-board) in this pass.

Along the way, fixed one unrelated pre-existing bug blocking the whole
frontend build: a stray duplicate `};` at the end of
`frontend/src/themes/aestheticThemes.js` (uncommitted work from an earlier
session, unrelated to this plan) — `SyntaxError: Unexpected token` on line
208, one line deleted.

---

Original scope note below, retained for context on why phase 1 only touched
10 + 13 out of 57.

## Why phase 1 only touched 10 + 13, not all 57

The 10 SaaS/Agency/Shop/Portfolio/Restaurant/Service templates were not a
blind pick — they were already the most "modern" of the 57 going into this
work, because an *earlier* session had already refactored them specifically
to read as real, current sites rather than generic AI-template output (see
the per-template comments in `starter_templates.py`, e.g. "was a centered
hero over a 3-equal-card feature row (the single most reported AI-slop
template shape); rebuilt as..."). That is also why they share the
`var(--fc-*, fallback)` theme-token convention instead of fixed hex —
that pass introduced it, block-library-wide, so any color theme applied via
the Theme tab re-colors them live. Phase 1 built on top of that existing
refactor by adding real page structure; it didn't need to fix their base
visual design too.

The 27 aesthetic mood-boards and 7 retro-nostalgia templates below never
got that "modern internet" pass — they're still each a fixed-palette single
page from the original 15-then-later-expanded starter set. That's the real
gap phase 2 closes, and it's two different jobs bundled into one list: the
27 need the same kind of design-refresh-plus-multi-page work the 10 already
got, while the 7 retro ones need *only* the multi-page expansion (see "keep
them within their own context" below) since modernizing their visual design
would defeat the point of them.

## Scope

The 34 templates NOT touched in phase 1, out of `backend/starter_templates.py`'s
57-entry `STARTER_TEMPLATES` list:

**27 aesthetic mood-boards** — each a 2-3 block single page named after a
design movement, not modeled on a specific real business:
frutiger-aero, dark-academia, solar-punk, cottagecore, y2k, vaporwave,
cyberpunk, brutalism, bauhaus, scandi-minimal, memphis, retro-futurism,
bloomcore, neubrutalism, corp-memphis, kidcore, blueprint, editorial-warm,
diffused-worlds, cassette-futurism, newspaper, barbiecore, win95,
grunge-zine, art-nouveau, swiss, goblincore.

**4 retro blog-platform / dreamlike templates:**
blog, xanga-throwback, livejournal-throwback, dreamcore.

**3 retro-nostalgia platform throwbacks:**
myspace-throwback, geocities-homepage, forum-throwback.

## What to do, per group

**Aesthetic mood-boards (27):** each already implies an incidental business
type through its copy (Bloomcore → florist, Scandi Minimal → furniture
brand, Cottagecore → bakery, Vaporwave → record shop, Neubrutalism → dev
studio, Corp Memphis → productivity SaaS, Cyberpunk → security tool,
Bauhaus/Brutalism/Memphis → design studio, Dark Academia → literary journal,
Solar Punk → eco brand, etc.). Gauge each against a real modern site of that
same implied business type and expand into a proper multi-page site the same
way phase 1 did for SaaS/Agency/Shop/Portfolio/Restaurant/Service — add a
nav, and 2-3 real sub-pages (About, Shop/Work/Menu as appropriate, Contact),
written in that template's own established visual voice (fonts, palette,
tone). Follow the `_starter_<name>()` function pattern (one function per
template, `_page()`-based, called from the `STARTER_TEMPLATES` list) rather
than the old flat `_tpl(..., html_blocks=[...])` shape.

**Retro-nostalgia platforms (7: xanga, livejournal, myspace, geocities,
forum, win95, and blog) — keep them within their own context.** These are
deliberately anachronistic re-creations of specific historical web
platforms, not real businesses — expanding them should mean "what would a
real, period-accurate site of that kind have had," not modernizing them into
a 2026 marketing site. Concretely:

- **MySpace Throwback** already has a Top 8 + comments on one page; add a
  Blog page (period-accurate MySpace blog post list) and a Comments/Guestbook
  page, keeping the same dark-chrome/Arial aesthetic.
- **Geocities Homepage**: add a "Webring" page and a "Links" page (staple
  Geocities features), plus per-page hit counters if cheap to reuse.
- **Forum Throwback**: add a second board/category page and an individual
  thread-view page, not just the index.
- **Xanga / LiveJournal throwbacks**: add an Archive/past-entries page and a
  Friends/subscriptions page (both real features of those platforms).
- **Win95**: this one is a UI-chrome aesthetic piece more than a "site" —
  lowest priority; a second "page" only if there's an obvious in-genre one
  (e.g. a second faux-application window).
- **Blog** (the plain one, not the throwbacks): add an Archive and an
  individual-post page, generic-blog-appropriate.

Do not add pricing pages, contact forms, or SaaS-style CTAs to any of these
seven — that would break the bit.

## Mechanics already in place (nothing more to build here)

- `_simple_nav()` helper in `starter_templates.py` for the modern/`var(--fc-*)`
  templates — reuse it for the aesthetic mood-boards where their palette is
  already a fixed hex system (adapt the signature call, not the shape).
- PagesBar + Files-panel "Pages" section both read off the same `pages`
  state, so any template that ships `pages: [...]` (via `_page()`) gets
  simultaneous tab + file-tree population for free — no additional wiring
  needed per template.
- Import → "Use this template" already loads multi-page results the same
  way, so nothing else to change there either.

## Suggested execution

37 new pages is roughly the same order of magnitude as phase 1's ~23 new
pages + 13×2 esports pages, but spread across more (34) distinct visual
systems instead of reusing one shared palette function 13 times — expect it
to take longer per template on average than the esports pages did. Work
through one template at a time, verify with the same checks used in phase 1
before moving on:

1. `python3 -c "import ast; ast.parse(open('starter_templates.py').read())"`
   after every edit.
2. Load `starter_templates.py` and assert the new template's page count/slugs.
3. Internal-link check (every `href="*.html"` resolves to a real slug in
   that template).
4. Tag-balance check (open/close counts match per element).
5. Spot-check a handful live in the browser (start mongo + backend + frontend,
   pick the template from the Project Templates modal, confirm nav renders
   and cross-page links work).
