# Web Dojo Dashboard — Phase 1: Content CMS

## Status

Phase 1 of a 3-phase "Dashboard" effort. Scoped and approved for implementation.

- **Phase 1 (this spec)** — Blog/Updates/Bento/Timeline content management, homepage widgets, share-button posting. No third-party API keys required.
- **Phase 2 (separate spec, later)** — Live Twitch/Discord widget dashboard (streams, follower counts, server member counts) with client-side polling. Already scoped in conversation; not written up yet.
- **Phase 3 (separate spec, later)** — Google Analytics + social API bolt-in, scheduled weekly SMTP digest emails. Needs its own design pass (OAuth flow, backend scheduler, no existing email infra).

Each phase gets its own spec → plan → implementation cycle. This document covers Phase 1 only.

## Problem

The user is porting a Next.js site to Web Dojo. On the old site: the homepage showed an "Updates" card and a "Latest blog" card (newest 3 posts, rolling), blog posts were slug-routed Next.js pages, and a dashboard let them author posts with a rich-text editor. Bento-grid and Timeline blocks were also dashboard-editable. Publishing a post or update also pushed a shortened link to social media.

Web Dojo exports static HTML (no server-side routing), so this needs a different mechanism for "pages generated from data" than Next.js's file-based routing — while preserving the same authoring experience and homepage behavior.

## Goals

1. A "Dashboard" authoring UI (separate from the canvas), landing on an **Overview** tab, with **Blog, Updates, Bento, Timeline, and Ecommerce** as the other tabs (Ecommerce added per user request during Phase 1 review — see "Overview & Ecommerce Bolt-in" below).
2. Blog: rich-text post editor → each save writes one dated JSON entry. At export/publish time, each entry becomes its own static page (`blog/<slug>.html`) plus a regenerated `blog/index.html` listing every post.
3. Homepage widgets: an "Updates" card and a "Latest blog" card, each showing the 3 most recent entries, rolling automatically as new ones are added — draggable into the canvas like any other block, but their inner content is populated at build time from the dashboard data rather than hand-edited.
4. Bento and Timeline blocks (already exist as static blocks in `blocksExtra.js`/`blocks.js`) get a CMS-bound variant editable from the dashboard, using the same data-in/HTML-out build step as the blog/updates widgets. The existing static/hand-edited versions remain available unchanged.
5. A "Share" action on any saved Update or Blog post: takes the entry's heading text and its published URL, shortens the URL via TinyURL, and surfaces standard share-intent buttons (Twitter/X, Facebook, LinkedIn) pre-filled with heading + short link. No stored social API credentials, no auto-posting — the user clicks the icon, the platform's own share window opens, they post it themselves.
6. The existing e-commerce builder (`CommerceTab.jsx`) gets its own Ecommerce tab inside the Dashboard, and a status summary on the Overview tab.

## Non-goals (explicitly deferred)

- Any live third-party data widgets (Twitch, Discord, Instagram, Twitter feeds) — Phase 2.
- Real auto-posting via social platform APIs — deliberately not building OAuth app integrations for this; share-intent links only.
- Analytics integration and scheduled email reports — Phase 3.
- Multi-author / permissions on the dashboard — single site-owner editing, matching how the rest of the builder works today.

## Data Model

Reuses the project's existing `files` dict (a `filename → content` map that already exists on every project, already flows through the debounced autosave (`saveWatch` → `persist()` in `Builder.jsx`), and already ships through both export paths — client-side `exportHtml.js` and backend `_build_multi_page_bundle` in `server.py`, which currently uses it for generated JS/CSS files). No new persistence layer is needed; content data are just more entries in the same dict, under a reserved `data/` prefix so the existing asset-file entries in `files` are unambiguous:

- `data/blog/<YYYY-MM-DD>-<slug>.json` — one file per blog post:
  ```json
  { "id": "...", "slug": "my-post", "title": "My Post", "dateISO": "2026-08-21",
    "coverImage": null, "bodyHtml": "<p>...</p>", "excerpt": "First 200 chars..." }
  ```
- `data/updates/<YYYY-MM-DD>-<id>.json` — one file per update:
  ```json
  { "id": "...", "dateISO": "2026-08-21", "headingHtml": "<h3>...</h3>", "bodyHtml": "<p>...</p>" }
  ```
- `data/bento.json` — single file, array of tiles: `[{ "icon": "🚀", "title": "...", "description": "...", "href": null }, ...]`
- `data/timeline.json` — single file, array of entries: `[{ "date": "...", "title": "...", "description": "..." }, ...]` (same shape the existing static Timeline blocks already hardcode inline, so the CMS-bound variant renders identically)

A new project-level field, `site_domain` (plain string, e.g. `https://example.com`), is added alongside the existing per-page `seo.canonical` field — nothing in the project currently stores "where does this site actually live," and the Share flow needs a real URL to shorten. Surfaced as a one-time setting in the Dashboard panel, not on every page.

## Dashboard Authoring UI

A new entry point from `TopBar` (button, not another `LeftSidebar` tab — this is data CRUD, not block-dragging) opening a panel with six tabs, landing on Overview:

- **Overview** — landing tab; see "Overview & Ecommerce Bolt-in" below.
- **Blog** — list (title/date/status) + "New Post" form: title, slug (auto-slugified from title, editable), rich-text body. No rich-text dependency exists in the repo today; build a minimal `contentEditable`-based toolbar (bold/italic/headings/link/list) rather than adding a new library — matches the zero-dependency style the rest of the block library already uses.
- **Updates** — list + form: heading, body, and the Share action once saved.
- **Bento** — list of tiles with add/edit/remove/reorder (icon/emoji, title, description, optional link).
- **Timeline** — list of entries with add/edit/remove/reorder (date, title, description).
- **Ecommerce** — see "Overview & Ecommerce Bolt-in" below.

Saving in any tab writes/updates the corresponding `files["data/..."]` entry and marks the project unsaved, so it rides the existing autosave debounce — no new save-path code.

## Overview & Ecommerce Bolt-in

Added during Phase 1 review: the dashboard needs an Overview landing page, and the existing e-commerce builder needs to live inside the dashboard rather than only in `LeftSidebar`'s Shop tab.

- **Ecommerce tab**: relocates the existing `CommerceTab.jsx` (cart currency/accent-color config, PayPal field, "add cart + checkout to page", add-to-cart button generator) into the Dashboard as its own page. `CommerceTab` today is a pure block-insertion/configuration tool — there is no backend order or product persistence (`server.py` only creates Stripe Payment Links and one-off Checkout Sessions; nothing records what happens after checkout). The relocated tab keeps that same scope; this is a move/reuse of existing functionality, not new backend work.
- **Overview tab**: summary cards pulled from data that genuinely exists today — no fabricated numbers. Concretely: post count + latest post date (Blog), update count (Updates), tile/entry counts (Bento/Timeline), and an Ecommerce card showing Stripe connection status (`stripe_enabled` from the existing `/commerce/*` config), configured currency, and whether PayPal is set — each card links to its full tab.
- **Explicitly out of scope here**: real sales figures (orders placed, revenue, conversion) — Web Dojo doesn't record what happens after a Stripe checkout at all today. That needs a Stripe webhook endpoint plus order storage, which is new backend infrastructure in its own right and a natural fit alongside the Phase 3 analytics/email-digest work rather than something to bolt on silently here.

## Build-Time Rendering (mirrored in both export paths)

A new shared step, implemented once in `exportHtml.js` (client "Export ZIP") and mirrored in `server.py`'s `_build_multi_page_bundle` (backend "Publish"), consistent with how JS-extraction and imported-CSS are already mirrored between the two:

1. Read `data/blog/*.json` from `files`, sort by `dateISO` descending.
2. Render each into `blog/<slug>.html`, reusing the theme/fonts/`head_html` of whichever page hosts the `latest-blog` widget block (so generated posts inherit the site's look), wrapped in a simple content container with a "back to blog" link.
3. Render/overwrite `blog/index.html`: every post, title/date/excerpt, linking to its page.
4. Find every element carrying `data-forge-widget="latest-blog"` across all pages; replace its inner HTML with the 3 newest posts (title, date, excerpt, link).
5. Find every element carrying `data-forge-widget="updates-feed"`; replace its inner HTML with the 3 newest updates.
6. Find every element carrying `data-forge-widget="bento"` / `data-forge-widget="timeline"`; replace its inner HTML using a render function shaped like the existing static blocks' inline template (same markup, data-driven instead of hardcoded).

This step runs after existing marker processing (theme vars, responsive overrides, JS extraction, imported CSS) and only touches elements carrying the new `data-forge-widget` markers — it's additive, nothing existing changes behavior.

## New Blocks

Four new draggable blocks (new `"cms"` category in the block library, alongside existing categories like `"retro"`/`"comments"`): an Updates-feed card, a Latest-blog card, a CMS-bound Bento grid, and a CMS-bound Timeline. Each ships with sensible placeholder content so it renders reasonably in the canvas before any dashboard data exists, and carries its `data-forge-widget` marker for the build step to find.

## Share Flow

1. From the Blog or Updates tab, after saving an entry, a "Share" button appears.
2. Heading text is extracted (plain text from the entry's title/`headingHtml`).
3. The full URL is built from `site_domain` + the entry's path (`/blog/<slug>` or `/#updates-<id>`). If `site_domain` isn't set yet, the Share button prompts for it once (stored for future shares).
4. A new backend endpoint, `POST /dashboard/shorten`, calls TinyURL's public unauthenticated `api-create.php?url=...` through the existing SSRF-safe `_safe_fetch_url` helper (same pattern as `/import/url`) — routed through the backend because TinyURL's endpoint isn't guaranteed to send CORS headers for direct browser calls, and because reusing `_safe_fetch_url` gets SSRF protection for free.
5. Response (short link) + heading populate standard share-intent URLs, shown as icon buttons opening in a new tab:
   - Twitter/X: `https://twitter.com/intent/tweet?text=<heading>&url=<short>`
   - Facebook: `https://www.facebook.com/sharer/sharer.php?u=<short>`
   - LinkedIn: `https://www.linkedin.com/sharing/share-offsite/?url=<short>`

No credentials stored, no auto-posting — clicking an icon opens that platform's own compose window with the text pre-filled; the user posts it themselves.

## Testing

- Backend: `POST /dashboard/shorten` (success, TinyURL failure/timeout, SSRF-guard reuse verified same as `/import/url`'s existing tests); blog-page-generation given N JSON entries → correct `blog/<slug>.html` count, correct `blog/index.html` contents, correct newest-3 injection into `latest-blog`/`updates-feed` markers.
- Frontend: `exportHtml.js` test mirroring the above generation logic; Bento/Timeline render-function tests (JSON in → HTML matches the existing static blocks' markup shape); dashboard form save → correct `files["data/..."]` entry shape; Overview tab renders correct counts from a fixture set of `files["data/..."]` entries and reflects `stripe_enabled` correctly in both states.

## Assumptions made while writing this spec (flag if wrong)

- Generated blog post pages reuse the *hosting page's* theme/fonts/head rather than needing their own separate template — simplest option consistent with a single-author static site; no separate "blog post layout picker" in Phase 1.
- `site_domain` is a single value per project (one site, one domain) — matches how publishing/FTP already works elsewhere in the app.
- Rich text body storage is sanitized HTML (`bodyHtml`), not Markdown — matches how every other piece of content in Web Dojo is stored (raw HTML strings), so no new rendering pipeline is needed anywhere else that touches post content.
