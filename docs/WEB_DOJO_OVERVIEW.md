# Web Dojo — Project Overview

**Purpose of this document:** a standalone, self-contained reference to Web Dojo — what it is, why it exists, everything it currently does, how it's built, and (critically) an honest account of what is and isn't wired together. This is written so a reader — human or AI — with zero prior exposure to the project can pick it up and be productive without re-deriving context from the codebase. Where a described capability is aspirational, partially built, or disconnected from the rest of the app, that is stated explicitly rather than smoothed over — an inaccurate "this all works together" account is worse than useless to someone who then has to build on top of it.

Last verified against the codebase: 2026-08-23, branch `pre-tauri-fixes`.

---

## 1. What Web Dojo Is

Web Dojo is a **visual, drag-and-drop website builder with a full code-editing escape hatch** — closer in shape to Webflow or Elementor than to a form-driven site wizard like Wix. A user works on a **canvas**: they drag pre-built HTML "blocks" (heroes, pricing tables, FAQs, forms, e-commerce grids, and dozens of others) onto a page, rearrange and restyle them, and the result is a real HTML/CSS/JS document they can export, publish, or keep editing directly as code.

The whole application is a single-page React app (`frontend/src/App.js` has exactly one route, `/`, rendering `Builder.jsx`) — there is no marketing site, no login flow, no multi-page app shell. Everything — the canvas, the block library, the code editor, every settings panel and modal — lives inside `Builder.jsx` and the ~80 components under `frontend/src/components/builder/`.

**Identity model:** there are no user accounts anywhere in the codebase. Every project is identified purely by a `project_id` (UUID), created via `POST /api/projects`. Nothing associates a project with an authenticated owner. The only access-control concept in the entire app is a **per-project dashboard password gate** (see §6), which is unrelated to "who owns this project" — it only gates a specific admin panel.

## 2. Why It Exists

Web Dojo's value proposition is **visual speed with no code-access ceiling**. Tools like Webflow give you visual building but wall you off from the underlying markup; tools like raw code editors give you full control but no visual feedback loop. Web Dojo's Code Mode (a full Monaco editor with Emmet expansion, on-canvas HTML/CSS/JS) means a user is never trapped — they can drop a block visually, then reach into the code directly for anything the visual tools don't expose, without leaving the app or hitting an abstraction wall.

The e-commerce work (see §6) extends this from "site builder" toward "site builder that can also run a small storefront" — payments, order fulfillment, and merchant-facing reporting, without requiring a separate platform.

## 3. Architecture

### Frontend
- **React 19**, single route via `react-router-dom`, built with **craco** (not plain Create React App — this matters for how tests and dev builds are invoked; see §9).
- **Tailwind CSS**, on a custom warm-graphite/gold design token system (`frontend/src/index.css`) — this session's UI redesign moved the whole app off default shadcn dark-mode styling onto this token set: base ink `#15130E`, panel `#1C1A15`, raised/hover `#242019`, border `#332D22`, primary text `#F1EDE2`, muted text `#948C79`, gold accent `#C9A227`/`#D9BC55`. IBM Plex Sans + IBM Plex Mono for type.
- **Radix UI** primitives for accessible base components, **recharts 3.6.0** for the e-commerce analytics charts, **Monaco** (`@monaco-editor/react` + `emmet-monaco-es`) for Code Mode, **framer-motion** for animation, **react-hook-form** for form-heavy panels.
- Tests: **Jest + React Testing Library**, colocated as `*.test.jsx`.

### Backend
- **FastAPI**, almost entirely in one file: `backend/server.py` (2000+ lines — the codebase's convention is to extend this file rather than split it; every phase of e-commerce work this session followed that convention).
- **Motor** (async MongoDB driver) in production. For local dev and the in-progress desktop build, a **SQLite compatibility shim** (`backend/sqlite_compat.py`) stands in for Mongo behind the same `db.<collection>.find(...)`/`.insert_one(...)` interface. This shim is a hard constraint that shaped multiple e-commerce features: **its `find()` only supports flat equality matching** — no `$gte`, `$gt`, `$lt`, `$in`, or any range/comparison operator. Every feature that needs a date range or numeric threshold (all of e-commerce analytics and insights) has to fetch a broader equality-filtered set and do the real filtering in Python afterward. This is a deliberate, documented pattern (see the `# ponytail:` comment in `get_analytics`), not an oversight.
- No ORM, no migrations system — collections are just named Mongo/SQLite-shim collections referenced directly by string name (`db.orders`, `db.projects`, `db.submissions`, etc.).

### Canvas → Output Pipeline
A project's pages are stored as HTML directly (blocks are concatenated into stored page HTML as the user drops/edits them — there's no intermediate component-tree representation persisted server-side). Two consumers render that same stored HTML for two different purposes, with no separate "build step" transforming content between them:
- **Live preview / analytics-logged serving**: `GET /api/preview/{project_id}` on the backend renders the stored HTML directly. Every hit to this endpoint also writes a `preview_view` event into a generic `analytics` collection — this is a *separate* system from the e-commerce analytics endpoint described in §6, easy to confuse by name only.
- **Export**: `frontend/src/lib/exportHtml.js` (client-side, JSZip-based) turns the same stored HTML into a downloadable static site — it also extracts and dedupes every forge-managed `<style>` block scattered across blocks into one `globals.css`, so exported output isn't just a dump of inline styles.
- **Publish**: `PublishModal.jsx` + `POST /api/projects/{project_id}/publish` pushes the export target directly to a user's own FTP/FTPS/SFTP host, as an alternative to downloading a zip.

## 4. The Block Library

Blocks are defined in `frontend/src/lib/blocks.js` (the original set) and `frontend/src/lib/blocksExtra.js` (15 more added this session — pricing, team, FAQ, esports, and others). **Every block is a static, inline-styled HTML string** the user drops onto the canvas and then hand-edits visually or in Code Mode. Blocks do not take props, do not bind to any data model, and (with the narrow exception of Forms, below) do not call the backend. `LeftSidebar.jsx` groups them for the block-picker UI under: Navigation, Hero, Parallax, Content (components, text, toolbox, containers, testimonials, FAQ, comments), Features (sections, services, pricing, team), Forms, Media (video, portfolio), Layouts, Esports, Creator (creator, social).

Two categories worth calling out specifically because they're easy to assume are more dynamic than they are:

- **Portfolio** (`blocksExtra.js`, id `portfolio-filter`) — a filterable project gallery. The category filtering is done entirely in CSS (`:has()` selectors), zero JavaScript, zero backend call. It ships with hardcoded example project cards that a user replaces by hand.
- **Social Wall** (`blocksExtra.js`, id `social-wall-columns`) — a multi-column "social feed" layout with hardcoded example posts (fake usernames, fake like/comment counts). It does not integrate with any real social platform's API and has no backend of its own. It is a static mockup, not a live feed.

There is **no Blog or Update/News block category at all** — "Blog" appears in the codebase only as a literal `<li>Blog</li>` inside static footer navigation link lists in a few blocks. There is no blog post data model, no blog-post backend endpoint, and no blog block to drop onto a canvas.

## 5. Code Mode, Export/Import, Templates, and Other Builder Tools

- **Code Mode** (`CodeEditor.jsx`, `CodeView.jsx`): a full Monaco editor pane for direct HTML/CSS/JS editing, with Emmet abbreviation expansion (`emmet-monaco-es`, registered separately per language so JS/TS gets JSX-flavored Emmet and HTML gets HTML-flavored Emmet), a custom `forge-dark` Monaco theme matching the app's own token colors, and Ctrl+S wired to the same save path as the visual canvas.
- **Import**: `frontend/src/lib/importHtml.js` scrapes an external URL via `POST /api/import/url` and wraps the imported CSS with markers so it flows through the same `globals.css` dedup pipeline as native blocks.
- **Templates**: `ProjectTemplatesModal.jsx` + `GET/POST/DELETE /api/templates` — save a project as a reusable starting point, or start a new project from one.
- **Starter templates**: `backend/starter_templates.py` ships **57 multi-page starter projects** selected from `ProjectTemplatesModal.jsx`. These supersede the older single-page starter concept entirely — every starter is a full `_tpl()` dict whose `data.pages` array is loaded straight into a new project via `Builder.jsx`'s `loadFromTemplate()` (synchronous, no network round-trip). The collection breaks down as: 27 aesthetic mood-board sites (frutiger-aero, dark-academia, vaporwave, …), 11 modern business starters (SaaS, agency, shop, portfolio, restaurant, …), 6 retro-nostalgia throwbacks (MySpace, GeoCities, forum, Xanga, LiveJournal, Win95), a plain blog, dreamcore, and **14 esports team sites** (6 pages each: home/roster/matches/news/shop/about) generated from one shared section factory recolored per palette. A validation suite (`tests/test_template_validate.py`) enforces syntax, page/slug integrity, internal-link resolution, tag balance, and index reachability across all of them.
- **Static esports pages vs. live dashboards:** the esports starters' rosters, fixtures, standings, and shop grids are **static demo HTML** — editing them means editing blocks by hand, exactly like any other template. They are *not* wired to any backend data model. The live, backend-backed surfaces remain the separate owner-facing dashboards (e-commerce orders/analytics/insights via the token-gated endpoints in §6, form submissions inbox, site-visit analytics) layered alongside the site.
- **Saved components/snippets**: `GET/POST/DELETE /api/components` and `/api/snippets` — reusable pieces below the level of a full template.
- **SEO panel**: `SeoPanel.jsx` plus a scoring/suggestion system (`seoScore.js`, `seoFieldChecks.js`, `seoContentSuggest.js`, `seoTemplates.js`, `seoExportGuard.js`) — evaluates a page's SEO hygiene and suggests fixes. (As of this document's writing, this system exists in the working tree as uncommitted backlog work from earlier in this session — see the repo's git status before assuming it's shipped on `main`.)
- **Onboarding**: `OnboardingTour.jsx` — a 7-step spotlight tour of the builder's main surfaces, shown once per browser (localStorage-gated) or re-triggerable from the Help menu.
- **File tree / multi-page**: `FileTree.jsx`, `PagesBar.jsx`, `AddPageModal.jsx` — a project can have multiple pages, navigable via a tab bar.
- **Sharing**: `SocialShareModal.jsx` generates a shareable live-preview link (backed by the same `/api/preview/{project_id}` endpoint from §3).
- **Design tooling**: `GradientMixer.jsx`, `PatternPanel.jsx`, `SvgBackgroundPanel.jsx`, `ThemeGenerator.jsx`, `TokenSelector.jsx`, `AnimationGenerator.jsx`, `VariantPanel.jsx`, `ResponsivePanel.jsx` — visual editors for gradients, background patterns/SVGs, color themes, design tokens, CSS animations, component variants, and responsive breakpoint behavior, all operating on the same canvas HTML.

## 6. The E-Commerce System

This is the one part of Web Dojo with a real backend data model and a real merchant-facing admin surface, built across four phases this session. Full detail lives in the phase specs (`docs/superpowers/specs/2026-08-21-ecommerce-payments-orders-design.md`, `2026-08-23-ecommerce-customers-email-design.md`, `2026-08-23-ecommerce-analytics-design.md`, `2026-08-23-ecommerce-insights-design.md`) — this section is a summary, not a replacement for those.

**Phase 1 — Payments & Orders:** Stripe and PayPal checkout integration; every completed purchase becomes a document in the `orders` collection (`id, project_id, provider, provider_ref, status, amount_total, currency, customer_email, customer_name, shipping_address, line_items, created_at`). This phase also introduced the **dashboard password gate**: a project owner sets a dashboard password (`POST /api/dashboard/{project_id}/set-password`), and a visitor to the dashboard exchanges that password for a short-lived `X-Dashboard-Token` (`POST /api/dashboard/{project_id}/unlock`), which every other dashboard endpoint requires via `_require_dashboard_token()`.

**Phase 2 — Fulfillment & Customers:** orders gained a `fulfillment_status` field (`processing` → `shipped` → `delivered`, one-way transitions only, enforced server-side), each transition fires a transactional email via SMTP. A derived **customer view** (`GET /api/dashboard/{project_id}/customers`) aggregates the `orders` collection into per-customer rows (email, name, order count, lifetime value, last order date) — computed fresh on every request, not stored separately.

**Phase 3 — Analytics:** `GET /api/dashboard/{project_id}/analytics` — a read-only dashboard over a fixed trailing-30-day window: daily revenue/order-count trend, a fulfillment funnel (counts by status), a new-vs-returning customer breakdown (by revenue and count), and a top-10 products-by-revenue table. Plus client-side CSV export of the Orders and Customers tables.

**Phase 4 — Insights:** `GET /api/dashboard/{project_id}/insights` — four deterministic, threshold-based alerts computed over the same order data, with no machine learning involved: a product that sold in the prior 30 days but not the trailing 30 (`stale_products`), a >20% week-over-week revenue drop (`revenue_drop`), orders sitting in `processing`/`shipped` for more than 7 days (`stuck_fulfillment`), and a >15-percentage-point drop in returning-customer revenue share month over month (`returning_share_drop`). Fully stateless — nothing is dismissed, acknowledged, or persisted; every alert is recomputed on every dashboard load.

**Frontend:** all four phases surface through one component, `EcommerceOrdersPanel.jsx` — a password-unlock screen, then four tabs (Orders, Customers, Analytics, Insights) sharing the one unlocked token. It's reachable via a small wrapper, `EcommerceDashboardModal.jsx`, opened from a Store icon in `TopBar.jsx` and from the "E-commerce dashboard" entry in the command palette's Panels group — the same pattern `AnalyticsModal.jsx`/`SubmissionsModal.jsx` already use. (Earlier drafts of this document flagged this panel as built but unreachable; that gap was closed in commit `954f348`.)

## 7. The "Dashboard Stack" — What Actually Connects to What

This section exists because it's easy to assume, by analogy with platforms like Shopify or Squarespace, that dropping a "Dashboard" block onto a page would light up a coordinated system where Blog, Social Wall, Portfolio, and e-commerce all report into one admin surface and pull live data back onto the page. **That system does not exist in Web Dojo today.** Here is what actually exists, plainly:

| Piece | Has a backend data model? | Has a real dashboard/admin UI? | Wired into the live app? |
|---|---|---|---|
| E-commerce (orders/customers/analytics/insights) | Yes — `orders` collection, full CRUD/aggregation | Yes — `EcommerceOrdersPanel.jsx`, password-gated | **Yes** — via `EcommerceDashboardModal.jsx`, reachable from the TopBar and command palette |
| Forms → Submissions | Yes — `submissions` collection | Yes — `SubmissionsModal.jsx` | **Yes** — reachable from a Builder.jsx menu command |
| Site-visit analytics (`preview_view`/`publish` events) | Yes — generic `analytics` collection | Yes — `AnalyticsModal.jsx` | **Yes** — reachable, but ungated (no password/token — open by `project_id`) |
| Blog / Update | No | No | No — the block itself doesn't exist |
| Social Wall | No (static demo content only) | N/A | N/A — purely decorative HTML |
| Portfolio | No (static demo content only) | N/A | N/A — purely decorative HTML |

Every dashboard/admin surface in this table is now reachable from the live app. What's still missing is everything below the "Wired into the live app?" column implies — Blog and Social Wall/Portfolio still have no backend data model at all, so wiring in a UI entry point for them isn't meaningful yet (there is nothing behind it to open).

**The pattern that does exist, where it exists:** an owner-facing dashboard (modal or, for e-commerce, a not-yet-linked panel) reads/writes a backend collection scoped by `project_id`, independent of the page's own HTML. Nothing on this list causes the **live page itself** to fetch dynamic data at request time or render server-side from a data model — every page block, including e-commerce blocks like a product grid, is still static HTML that the merchant edits by hand; the dashboards are separate admin views layered *alongside* the static site, not templating engines *driving* it. The two exceptions worth noting for precision: Forms blocks point their `action` at Web Dojo's own submission endpoint (so that one loop — page → backend — is real and live), and the checkout flow behind e-commerce blocks does make a real API call at time of purchase. Everything else a visitor sees on a live page is exactly the HTML the builder saved, no different from a Portfolio or Social Wall block.

**Bottom line for anyone extending this:** if the goal is a true "drop a Dashboard block, and Blog/Social Wall/Portfolio/e-commerce all report into it and can pull live content back onto the page," that is new work, not a wiring fix — it would mean giving Blog/Social/Portfolio their own backend data models (none currently exist), deciding whether page rendering becomes dynamic (a real architecture change, since today's export/preview pipeline assumes static stored HTML — see §3), and then building the unified dashboard surface itself, most plausibly as a generalization of the token-gated pattern `_require_dashboard_token`/`EcommerceOrdersPanel.jsx` already established for e-commerce.

## 8. Desktop Packaging (Tauri)

A plan exists (`docs/superpowers/plans/2026-08-18-tauri-desktop.md`) to package Web Dojo as a Tauri 2.x desktop app: the built React frontend runs inside Tauri's webview, and the FastAPI backend runs as a bundled PyInstaller sidecar process on `127.0.0.1:8787`, talking to the SQLite compatibility shim (`backend/sqlite_compat.py`, `DB_BACKEND=sqlite`) instead of MongoDB. This is designed to be additive — the existing web deployment (Mongo-backed) is unaffected. This document does not assert the desktop build's current completion status; check the plan file and recent commits directly for that.

## 9. Known Inconsistencies Worth Flagging

- **~~Access control is inconsistent across dashboards.~~** *(Resolved.)* E-commerce endpoints require a password-derived `X-Dashboard-Token`, and form-submission listing/deletion (`GET/DELETE /api/submissions`) plus site-visit analytics (`GET /api/projects/{project_id}/analytics`) now require the same token via `_require_dashboard_token()` — previously they were reachable by anyone who knew a `project_id`. `POST /api/submissions` intentionally stays public: published/exported static sites post form data from arbitrary domains with no token available. The remaining gap is that there is still no builder-level authentication for editing projects themselves (next bullet).
- **No builder-level authentication exists at all.** Anyone with the URL can open and edit any project — the only password concept in the whole app is the narrow, per-feature dashboard gate described above, which doesn't protect the project itself, just a couple of its reporting surfaces.
- **The frontend build tool is `craco`, not plain `react-scripts`** — test/dev commands must go through `npx craco ...`, not `npx react-scripts ...` or bare `npm test` assumptions from a vanilla CRA project.
- **The SQLite dev/desktop shim's equality-only `find()`** is a standing constraint on every future feature that needs range queries (dates, numeric thresholds) — the established pattern is "fetch broad with equality, filter in Python," not "extend the shim with more Mongo operators." This has held across every e-commerce phase and is likely to keep holding for anything built on top of the SQLite backend.

## 10. Quick File Map

```
backend/
  server.py              # the whole backend API, single file
  sqlite_compat.py        # Mongo-shaped SQLite shim (equality-only find())
  tests/test_commerce_orders.py   # e-commerce backend test suite

frontend/src/
  App.js                  # single route -> Builder.jsx
  components/builder/
    Builder.jsx            # the entire app shell
    EcommerceOrdersPanel.jsx   # e-commerce dashboard (Orders/Customers/Analytics/Insights)
    EcommerceDashboardModal.jsx   # Dialog wrapper that mounts the panel above (see §6)
    SubmissionsModal.jsx   # forms inbox (mounted)
    AnalyticsModal.jsx     # site-visit analytics (mounted)
    CodeEditor.jsx / CodeView.jsx  # Code Mode
    LeftSidebar.jsx        # block-picker categories
    ...(~75 more panel/modal/tool components)
  lib/
    blocks.js / blocksExtra.js   # the static block library
    exportHtml.js / importHtml.js
    seo*.js                # SEO scoring system

docs/superpowers/specs/    # design docs for e-commerce Phases 1-4
docs/superpowers/plans/    # implementation plans (incl. Tauri desktop)
```
# Web Dojo — Project Overview

**Purpose of this document:** a standalone, self-contained reference to Web Dojo — what it is, why it exists, everything it currently does, how it's built, and (critically) an honest account of what is and isn't wired together. This is written so a reader — human or AI — with zero prior exposure to the project can pick it up and be productive without re-deriving context from the codebase. Where a described capability is aspirational, partially built, or disconnected from the rest of the app, that is stated explicitly rather than smoothed over — an inaccurate "this all works together" account is worse than useless to someone who then has to build on top of it.

Last verified against the codebase: 2026-08-23, branch `pre-tauri-fixes`.

---

## 1. What Web Dojo Is

Web Dojo is a **visual, drag-and-drop website builder with a full code-editing escape hatch** — closer in shape to Webflow or Elementor than to a form-driven site wizard like Wix. A user works on a **canvas**: they drag pre-built HTML "blocks" (heroes, pricing tables, FAQs, forms, e-commerce grids, and dozens of others) onto a page, rearrange and restyle them, and the result is a real HTML/CSS/JS document they can export, publish, or keep editing directly as code.

The whole application is a single-page React app (`frontend/src/App.js` has exactly one route, `/`, rendering `Builder.jsx`) — there is no marketing site, no login flow, no multi-page app shell. Everything — the canvas, the block library, the code editor, every settings panel and modal — lives inside `Builder.jsx` and the ~80 components under `frontend/src/components/builder/`.

**Identity model:** there are no user accounts anywhere in the codebase. Every project is identified purely by a `project_id` (UUID), created via `POST /api/projects`. Nothing associates a project with an authenticated owner. The only access-control concept in the entire app is a **per-project dashboard password gate** (see §6), which is unrelated to "who owns this project" — it only gates a specific admin panel.

## 2. Why It Exists

Web Dojo's value proposition is **visual speed with no code-access ceiling**. Tools like Webflow give you visual building but wall you off from the underlying markup; tools like raw code editors give you full control but no visual feedback loop. Web Dojo's Code Mode (a full Monaco editor with Emmet expansion, on-canvas HTML/CSS/JS) means a user is never trapped — they can drop a block visually, then reach into the code directly for anything the visual tools don't expose, without leaving the app or hitting an abstraction wall.

The e-commerce work (see §6) extends this from "site builder" toward "site builder that can also run a small storefront" — payments, order fulfillment, and merchant-facing reporting, without requiring a separate platform.

## 3. Architecture

### Frontend
- **React 19**, single route via `react-router-dom`, built with **craco** (not plain Create React App — this matters for how tests and dev builds are invoked; see §9).
- **Tailwind CSS**, on a custom warm-graphite/gold design token system (`frontend/src/index.css`) — this session's UI redesign moved the whole app off default shadcn dark-mode styling onto this token set: base ink `#15130E`, panel `#1C1A15`, raised/hover `#242019`, border `#332D22`, primary text `#F1EDE2`, muted text `#948C79`, gold accent `#C9A227`/`#D9BC55`. IBM Plex Sans + IBM Plex Mono for type.
- **Radix UI** primitives for accessible base components, **recharts 3.6.0** for the e-commerce analytics charts, **Monaco** (`@monaco-editor/react` + `emmet-monaco-es`) for Code Mode, **framer-motion** for animation, **react-hook-form** for form-heavy panels.
- Tests: **Jest + React Testing Library**, colocated as `*.test.jsx`.

### Backend
- **FastAPI**, almost entirely in one file: `backend/server.py` (2000+ lines — the codebase's convention is to extend this file rather than split it; every phase of e-commerce work this session followed that convention).
- **Motor** (async MongoDB driver) in production. For local dev and the in-progress desktop build, a **SQLite compatibility shim** (`backend/sqlite_compat.py`) stands in for Mongo behind the same `db.<collection>.find(...)`/`.insert_one(...)` interface. This shim is a hard constraint that shaped multiple e-commerce features: **its `find()` only supports flat equality matching** — no `$gte`, `$gt`, `$lt`, `$in`, or any range/comparison operator. Every feature that needs a date range or numeric threshold (all of e-commerce analytics and insights) has to fetch a broader equality-filtered set and do the real filtering in Python afterward. This is a deliberate, documented pattern (see the `# ponytail:` comment in `get_analytics`), not an oversight.
- No ORM, no migrations system — collections are just named Mongo/SQLite-shim collections referenced directly by string name (`db.orders`, `db.projects`, `db.submissions`, etc.).

### Canvas → Output Pipeline
A project's pages are stored as HTML directly (blocks are concatenated into stored page HTML as the user drops/edits them — there's no intermediate component-tree representation persisted server-side). Two consumers render that same stored HTML for two different purposes, with no separate "build step" transforming content between them:
- **Live preview / analytics-logged serving**: `GET /api/preview/{project_id}` on the backend renders the stored HTML directly. Every hit to this endpoint also writes a `preview_view` event into a generic `analytics` collection — this is a *separate* system from the e-commerce analytics endpoint described in §6, easy to confuse by name only.
- **Export**: `frontend/src/lib/exportHtml.js` (client-side, JSZip-based) turns the same stored HTML into a downloadable static site — it also extracts and dedupes every forge-managed `<style>` block scattered across blocks into one `globals.css`, so exported output isn't just a dump of inline styles.
- **Publish**: `PublishModal.jsx` + `POST /api/projects/{project_id}/publish` pushes the export target directly to a user's own FTP/FTPS/SFTP host, as an alternative to downloading a zip.

## 4. The Block Library

Blocks are defined in `frontend/src/lib/blocks.js` (the original set) and `frontend/src/lib/blocksExtra.js` (15 more added this session — pricing, team, FAQ, esports, and others). **Every block is a static, inline-styled HTML string** the user drops onto the canvas and then hand-edits visually or in Code Mode. Blocks do not take props, do not bind to any data model, and (with the narrow exception of Forms, below) do not call the backend. `LeftSidebar.jsx` groups them for the block-picker UI under: Navigation, Hero, Parallax, Content (components, text, toolbox, containers, testimonials, FAQ, comments), Features (sections, services, pricing, team), Forms, Media (video, portfolio), Layouts, Esports, Creator (creator, social).

Two categories worth calling out specifically because they're easy to assume are more dynamic than they are:

- **Portfolio** (`blocksExtra.js`, id `portfolio-filter`) — a filterable project gallery. The category filtering is done entirely in CSS (`:has()` selectors), zero JavaScript, zero backend call. It ships with hardcoded example project cards that a user replaces by hand.
- **Social Wall** (`blocksExtra.js`, id `social-wall-columns`) — a multi-column "social feed" layout with hardcoded example posts (fake usernames, fake like/comment counts). It does not integrate with any real social platform's API and has no backend of its own. It is a static mockup, not a live feed.

There is **no Blog or Update/News block category at all** — "Blog" appears in the codebase only as a literal `<li>Blog</li>` inside static footer navigation link lists in a few blocks. There is no blog post data model, no blog-post backend endpoint, and no blog block to drop onto a canvas.

## 5. Code Mode, Export/Import, Templates, and Other Builder Tools

- **Code Mode** (`CodeEditor.jsx`, `CodeView.jsx`): a full Monaco editor pane for direct HTML/CSS/JS editing, with Emmet abbreviation expansion (`emmet-monaco-es`, registered separately per language so JS/TS gets JSX-flavored Emmet and HTML gets HTML-flavored Emmet), a custom `forge-dark` Monaco theme matching the app's own token colors, and Ctrl+S wired to the same save path as the visual canvas.
- **Import**: `frontend/src/lib/importHtml.js` scrapes an external URL via `POST /api/import/url` and wraps the imported CSS with markers so it flows through the same `globals.css` dedup pipeline as native blocks.
- **Templates**: `ProjectTemplatesModal.jsx` + `GET/POST/DELETE /api/templates` — save a project as a reusable starting point, or start a new project from one.
- **Starter templates**: `backend/starter_templates.py` ships **57 multi-page starter projects** selected from `ProjectTemplatesModal.jsx`. These supersede the older single-page starter concept entirely — every starter is a full `_tpl()` dict whose `data.pages` array is loaded straight into a new project via `Builder.jsx`'s `loadFromTemplate()` (synchronous, no network round-trip). The collection breaks down as: 27 aesthetic mood-board sites (frutiger-aero, dark-academia, vaporwave, …), 11 modern business starters (SaaS, agency, shop, portfolio, restaurant, …), 6 retro-nostalgia throwbacks (MySpace, GeoCities, forum, Xanga, LiveJournal, Win95), a plain blog, dreamcore, and **14 esports team sites** (6 pages each: home/roster/matches/news/shop/about) generated from one shared section factory recolored per palette. A validation suite (`tests/test_template_validate.py`) enforces syntax, page/slug integrity, internal-link resolution, tag balance, and index reachability across all of them.
- **Static esports pages vs. live dashboards:** the esports starters' rosters, fixtures, standings, and shop grids are **static demo HTML** — editing them means editing blocks by hand, exactly like any other template. They are *not* wired to any backend data model. The live, backend-backed surfaces remain the separate owner-facing dashboards (e-commerce orders/analytics/insights via the token-gated endpoints in §6, form submissions inbox, site-visit analytics) layered alongside the site.
- **Saved components/snippets**: `GET/POST/DELETE /api/components` and `/api/snippets` — reusable pieces below the level of a full template.
- **SEO panel**: `SeoPanel.jsx` plus a scoring/suggestion system (`seoScore.js`, `seoFieldChecks.js`, `seoContentSuggest.js`, `seoTemplates.js`, `seoExportGuard.js`) — evaluates a page's SEO hygiene and suggests fixes. (As of this document's writing, this system exists in the working tree as uncommitted backlog work from earlier in this session — see the repo's git status before assuming it's shipped on `main`.)
- **Onboarding**: `OnboardingTour.jsx` — a 7-step spotlight tour of the builder's main surfaces, shown once per browser (localStorage-gated) or re-triggerable from the Help menu.
- **File tree / multi-page**: `FileTree.jsx`, `PagesBar.jsx`, `AddPageModal.jsx` — a project can have multiple pages, navigable via a tab bar.
- **Sharing**: `SocialShareModal.jsx` generates a shareable live-preview link (backed by the same `/api/preview/{project_id}` endpoint from §3).
- **Design tooling**: `GradientMixer.jsx`, `PatternPanel.jsx`, `SvgBackgroundPanel.jsx`, `ThemeGenerator.jsx`, `TokenSelector.jsx`, `AnimationGenerator.jsx`, `VariantPanel.jsx`, `ResponsivePanel.jsx` — visual editors for gradients, background patterns/SVGs, color themes, design tokens, CSS animations, component variants, and responsive breakpoint behavior, all operating on the same canvas HTML.

## 6. The E-Commerce System

This is the one part of Web Dojo with a real backend data model and a real merchant-facing admin surface, built across four phases this session. Full detail lives in the phase specs (`docs/superpowers/specs/2026-08-21-ecommerce-payments-orders-design.md`, `2026-08-23-ecommerce-customers-email-design.md`, `2026-08-23-ecommerce-analytics-design.md`, `2026-08-23-ecommerce-insights-design.md`) — this section is a summary, not a replacement for those.

**Phase 1 — Payments & Orders:** Stripe and PayPal checkout integration; every completed purchase becomes a document in the `orders` collection (`id, project_id, provider, provider_ref, status, amount_total, currency, customer_email, customer_name, shipping_address, line_items, created_at`). This phase also introduced the **dashboard password gate**: a project owner sets a dashboard password (`POST /api/dashboard/{project_id}/set-password`), and a visitor to the dashboard exchanges that password for a short-lived `X-Dashboard-Token` (`POST /api/dashboard/{project_id}/unlock`), which every other dashboard endpoint requires via `_require_dashboard_token()`.

**Phase 2 — Fulfillment & Customers:** orders gained a `fulfillment_status` field (`processing` → `shipped` → `delivered`, one-way transitions only, enforced server-side), each transition fires a transactional email via SMTP. A derived **customer view** (`GET /api/dashboard/{project_id}/customers`) aggregates the `orders` collection into per-customer rows (email, name, order count, lifetime value, last order date) — computed fresh on every request, not stored separately.

**Phase 3 — Analytics:** `GET /api/dashboard/{project_id}/analytics` — a read-only dashboard over a fixed trailing-30-day window: daily revenue/order-count trend, a fulfillment funnel (counts by status), a new-vs-returning customer breakdown (by revenue and count), and a top-10 products-by-revenue table. Plus client-side CSV export of the Orders and Customers tables.

**Phase 4 — Insights:** `GET /api/dashboard/{project_id}/insights` — four deterministic, threshold-based alerts computed over the same order data, with no machine learning involved: a product that sold in the prior 30 days but not the trailing 30 (`stale_products`), a >20% week-over-week revenue drop (`revenue_drop`), orders sitting in `processing`/`shipped` for more than 7 days (`stuck_fulfillment`), and a >15-percentage-point drop in returning-customer revenue share month over month (`returning_share_drop`). Fully stateless — nothing is dismissed, acknowledged, or persisted; every alert is recomputed on every dashboard load.

**Frontend:** all four phases surface through one component, `EcommerceOrdersPanel.jsx` — a password-unlock screen, then four tabs (Orders, Customers, Analytics, Insights) sharing the one unlocked token. It's reachable via a small wrapper, `EcommerceDashboardModal.jsx`, opened from a Store icon in `TopBar.jsx` and from the "E-commerce dashboard" entry in the command palette's Panels group — the same pattern `AnalyticsModal.jsx`/`SubmissionsModal.jsx` already use. (Earlier drafts of this document flagged this panel as built but unreachable; that gap was closed in commit `954f348`.)

## 7. The "Dashboard Stack" — What Actually Connects to What

This section exists because it's easy to assume, by analogy with platforms like Shopify or Squarespace, that dropping a "Dashboard" block onto a page would light up a coordinated system where Blog, Social Wall, Portfolio, and e-commerce all report into one admin surface and pull live data back onto the page. **That system does not exist in Web Dojo today.** Here is what actually exists, plainly:

| Piece | Has a backend data model? | Has a real dashboard/admin UI? | Wired into the live app? |
|---|---|---|---|
| E-commerce (orders/customers/analytics/insights) | Yes — `orders` collection, full CRUD/aggregation | Yes — `EcommerceOrdersPanel.jsx`, password-gated | **Yes** — via `EcommerceDashboardModal.jsx`, reachable from the TopBar and command palette |
| Forms → Submissions | Yes — `submissions` collection | Yes — `SubmissionsModal.jsx` | **Yes** — reachable from a Builder.jsx menu command |
| Site-visit analytics (`preview_view`/`publish` events) | Yes — generic `analytics` collection | Yes — `AnalyticsModal.jsx` | **Yes** — reachable, but ungated (no password/token — open by `project_id`) |
| Blog / Update | No | No | No — the block itself doesn't exist |
| Social Wall | No (static demo content only) | N/A | N/A — purely decorative HTML |
| Portfolio | No (static demo content only) | N/A | N/A — purely decorative HTML |

Every dashboard/admin surface in this table is now reachable from the live app. What's still missing is everything below the "Wired into the live app?" column implies — Blog and Social Wall/Portfolio still have no backend data model at all, so wiring in a UI entry point for them isn't meaningful yet (there is nothing behind it to open).

**The pattern that does exist, where it exists:** an owner-facing dashboard (modal or, for e-commerce, a not-yet-linked panel) reads/writes a backend collection scoped by `project_id`, independent of the page's own HTML. Nothing on this list causes the **live page itself** to fetch dynamic data at request time or render server-side from a data model — every page block, including e-commerce blocks like a product grid, is still static HTML that the merchant edits by hand; the dashboards are separate admin views layered *alongside* the static site, not templating engines *driving* it. The two exceptions worth noting for precision: Forms blocks point their `action` at Web Dojo's own submission endpoint (so that one loop — page → backend — is real and live), and the checkout flow behind e-commerce blocks does make a real API call at time of purchase. Everything else a visitor sees on a live page is exactly the HTML the builder saved, no different from a Portfolio or Social Wall block.

**Bottom line for anyone extending this:** if the goal is a true "drop a Dashboard block, and Blog/Social Wall/Portfolio/e-commerce all report into it and can pull live content back onto the page," that is new work, not a wiring fix — it would mean giving Blog/Social/Portfolio their own backend data models (none currently exist), deciding whether page rendering becomes dynamic (a real architecture change, since today's export/preview pipeline assumes static stored HTML — see §3), and then building the unified dashboard surface itself, most plausibly as a generalization of the token-gated pattern `_require_dashboard_token`/`EcommerceOrdersPanel.jsx` already established for e-commerce.

## 8. Desktop Packaging (Tauri)

A plan exists (`docs/superpowers/plans/2026-08-18-tauri-desktop.md`) to package Web Dojo as a Tauri 2.x desktop app: the built React frontend runs inside Tauri's webview, and the FastAPI backend runs as a bundled PyInstaller sidecar process on `127.0.0.1:8787`, talking to the SQLite compatibility shim (`backend/sqlite_compat.py`, `DB_BACKEND=sqlite`) instead of MongoDB. This is designed to be additive — the existing web deployment (Mongo-backed) is unaffected. This document does not assert the desktop build's current completion status; check the plan file and recent commits directly for that.

## 9. Known Inconsistencies Worth Flagging

- **~~Access control is inconsistent across dashboards.~~** *(Resolved.)* E-commerce endpoints require a password-derived `X-Dashboard-Token`, and form-submission listing/deletion (`GET/DELETE /api/submissions`) plus site-visit analytics (`GET /api/projects/{project_id}/analytics`) now require the same token via `_require_dashboard_token()` — previously they were reachable by anyone who knew a `project_id`. `POST /api/submissions` intentionally stays public: published/exported static sites post form data from arbitrary domains with no token available. The remaining gap is that there is still no builder-level authentication for editing projects themselves (next bullet).
- **No builder-level authentication exists at all.** Anyone with the URL can open and edit any project — the only password concept in the whole app is the narrow, per-feature dashboard gate described above, which doesn't protect the project itself, just a couple of its reporting surfaces.
- **The frontend build tool is `craco`, not plain `react-scripts`** — test/dev commands must go through `npx craco ...`, not `npx react-scripts ...` or bare `npm test` assumptions from a vanilla CRA project.
- **The SQLite dev/desktop shim's equality-only `find()`** is a standing constraint on every future feature that needs range queries (dates, numeric thresholds) — the established pattern is "fetch broad with equality, filter in Python," not "extend the shim with more Mongo operators." This has held across every e-commerce phase and is likely to keep holding for anything built on top of the SQLite backend.

## 10. Quick File Map

```
backend/
  server.py              # the whole backend API, single file
  sqlite_compat.py        # Mongo-shaped SQLite shim (equality-only find())
  tests/test_commerce_orders.py   # e-commerce backend test suite

frontend/src/
  App.js                  # single route -> Builder.jsx
  components/builder/
    Builder.jsx            # the entire app shell
    EcommerceOrdersPanel.jsx   # e-commerce dashboard (Orders/Customers/Analytics/Insights)
    EcommerceDashboardModal.jsx   # Dialog wrapper that mounts the panel above (see §6)
    SubmissionsModal.jsx   # forms inbox (mounted)
    AnalyticsModal.jsx     # site-visit analytics (mounted)
    CodeEditor.jsx / CodeView.jsx  # Code Mode
    LeftSidebar.jsx        # block-picker categories
    ...(~75 more panel/modal/tool components)
  lib/
    blocks.js / blocksExtra.js   # the static block library
    exportHtml.js / importHtml.js
    seo*.js                # SEO scoring system

docs/superpowers/specs/    # design docs for e-commerce Phases 1-4
docs/superpowers/plans/    # implementation plans (incl. Tauri desktop)
```
