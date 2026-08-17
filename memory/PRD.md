# Web Dojo — WYSIWYG Website Builder

## Original Problem Statement
Build a WYSIWYG webapp that allows building websites either by drag-and-drop or
by coding, with the ability to import any existing web front/back-end framework
in the `<head>` portion. Left sidebar with tool categories: navbars, heroes,
sections, containers, cards (with count selector), toolbox of premade elements,
textbox/text-entry tools, font selection based on web-safe fonts with the
option to import Google Fonts or your own `@font-face`. Ability to import any
HTML file/webpage and have the program scan for sections it can turn into
drag-and-drop components. Right side has a Photoshop/Illustrator-style color
editor and a gradient mixer that converts colours into hexes/alphas and the
gradients into CSS gradients.

## User Choices
- Scope: Full editor with drag-drop + code editing + import + color/gradient tools
- Save: MongoDB backend + persistence
- Export: standalone HTML (inline CSS) + HTML+CSS `.zip`
- Auth: none, single-user builder
- AI: none in v1
- Publish presets (Feb 2026): saved profiles with optional encrypted password
- Starter templates (Feb 2026): seeded 15 aesthetic starters into MongoDB, shown in a dedicated Starter Gallery

## Architecture
- **Backend**: FastAPI + Motor + MongoDB. Models: `Project`, `SavedComponent`, `Snippet`, `ProjectTemplate` (now with `is_starter`, `aesthetic`), `PublishPreset` (encrypted password with Fernet). CRUD endpoints under `/api/*`.
- **Encryption**: `cryptography.fernet.Fernet`. Key from `WEBDOJO_SECRET_KEY` env var, else auto-generated `/app/backend/.preset_key`. Only encrypted ciphertext (`password_enc`) is ever persisted; API responses expose only `has_password`.
- **Frontend**: React + Tailwind + shadcn/ui. Dark IDE-style shell. Routes: single `/` → `Builder`.
- **Data model**: `pages: [{ id, name, slug, status, seo, elements: [{ id, html }], head_html, canvas_bg, fonts }]`, plus site-wide `template`, `files`, `head_html`.
- Blocks are portable HTML strings with inline styles so exports/publishes are standalone.

## Implemented (through Jun 2026)

### Session Jun 2026 — Layouts, Ecommerce & Payments, Background Music
- **Prebuilt Page Layouts (WordPress-style)** — the PagesBar "+ Page" now opens an `AddPageModal` picker (master–detail: searchable category list + live iframe preview) instead of only creating a blank page. ~34 editable layouts in `/app/frontend/src/lib/pageLayouts.js`, composed from reusable themed section builders. Categories: Home (3 variations), About (2), Services (2), Blog (2), Portfolio (3), Contact (2), FAQ (2), Pricing (2), Team, Testimonials, Coming soon (2), 404 (2), **Shop** (catalog, dark store, product detail, cart/checkout), and **Industry** (Esports, Band, Hotel, Restaurant, Gym, Photography, Agency, SaaS). Each layout carries its own `canvasBg` + Google `fonts`. "Start with a blank page" still available. Selecting a layout inserts its blocks as a new page tab (`addPageFromLayout` in Builder.jsx).
- **Ecommerce + Payments** — new **Shop** tab (7th) in LeftSidebar (`CommerceTab.jsx`) with draggable store blocks (product card, pricing table, buy CTA strip) and a **Payment Button builder** (`PaymentButtonModal.jsx`). Two providers, both work on exported STATIC sites:
  - **Stripe** — backend `POST /api/commerce/payment-link` creates a real Stripe **Payment Link** (`https://buy.stripe.com/…`) via the claimable **test sandbox** key; builder drops a styled anchor button pointing at it. `GET /api/commerce/config` reports enablement/currencies. Test card `4242 4242 4242 4242`.
  - **PayPal** — client-side Smart Buttons SDK embed; user pastes their own Client ID (from developer.paypal.com) per-site.
  - Stripe sandbox keys stored in `/app/backend/.env` (`STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_ACCOUNT_ID`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_MODE=test`). Amount guarded (>0, <=999999, rounded to 2dp).
- **Background Music (MP3 + MIDI)** — right sidebar **BG** tab (`BackgroundMediaPanel.jsx`) gains a page-level music section. MP3 → floating play/pause pill widget (colour, label, corner, loop, optional autoplay). MIDI → `html-midi-player` web component via CDN (`tone` + `@magenta/music` + `html-midi-player@1.5.0`). Inserted as a self-contained fixed-position block (scripts run in Preview + export, not in the design canvas).



### Session Feb 17, 2026 (part 3)
- **Template Preview Modal** — clicking a starter card now opens a full-screen preview (device viewport switcher desktop/tablet/mobile, sandboxed iframe rendering the template's first page). "Use this template" confirms and loads; "Close" returns to the gallery without loading.
- **Preview Mode** — TopBar mode toggle is now Design | Code | **Preview**. Preview hides both sidebars and renders the current project in a device-framed iframe using `buildStandaloneHtml`. Viewport switcher applies. Users can taste-test their site as a visitor would.

### Session Feb 17, 2026 (part 2)
- **Real Form Builder** — new `Forms` tab in the LeftSidebar. Contains 6 draggable presets (Contact, Newsletter, Login, Signup, Feedback, Event RSVP) plus an "Open form builder" button. `FormBuilderModal` opens a split-panel editor: left column has form settings (action URL, method, layout, theme light/dark/brand, accent colour, submit label, success helper), a fields list with reorder/delete and a 14-type add palette (text, email, password, tel, url, number, date, time, textarea, select, checkbox, radio, file, hidden), and a per-field editor (name, label, placeholder, required, options, rows, accept, value). Right column shows a live iframe preview that updates on every keystroke. Two actions: `Insert onto canvas` (adds the generated portable `<form>` block via `addBlock`) and `Save to library` (posts to `/api/components` with `category: "forms"`). Form HTML is fully inline-styled so it survives export/publish.
- **28 Aesthetic Starters** — added 13 more starter templates on top of the original 15: Kidcore Scrapbook, Blueprint, Editorial Warm, Diffused Worlds, Cassette Futurism, Newspaper Editorial, Barbiecore, Windows 95, Grunge Zine, Art Nouveau, Swiss Modernism, Goblincore, Dreamcore. Aesthetic slugs chosen after a 2026-trend web scrape (kidcore/scrapbook, diffused worlds, editorial warm confirmed as 2026 trends).
- **Template Filter** — `ProjectTemplatesModal` now has a search input and 29 filter chips ("All · 28" + one per aesthetic). Search matches template name, aesthetic slug, and description; chip filter narrows the gallery to a single aesthetic. Empty state renders when no matches.
- **Preset Prod Key** — `WEBDOJO_SECRET_KEY` set in `/app/backend/.env`. Encrypted preset passwords now survive backend restarts (verified: create preset → restart → GET /secret still returns original plaintext).

### Session Feb 17, 2026 (part 1)
- **Publish Presets** — encrypted (Fernet) FTP/FTPS/SFTP profile storage. `PublishModal` lists saved profiles, one-click applies (auto-fetches decrypted password when `has_password: true`), toggle to opt-in to saving the password. `/api/publish-presets` CRUD + `/{id}/secret` for decryption. Backend excludes `password_enc` from list projections as defense-in-depth.
- **Starter Aesthetic Gallery** — 15 curated single-page templates seeded on backend startup with fixed IDs (idempotent upsert): Frutiger Aero, Dark Academia, Solar Punk, Cottagecore, Y2K Chrome, Vaporwave, Cyberpunk, Web Brutalism, Bauhaus, Scandi Minimal, Memphis Group, Retro-Futurism, Bloomcore, Neubrutalism, Corp Memphis. Each includes hero + section + footer with matched fonts/palette. `ProjectTemplatesModal` renders a **Starter Gallery** with color-coded aesthetic chips, above the user's own templates. Starters are **not deletable** (`DELETE` returns 403).

### Prior sessions
- Left sidebar tabs: Library / Layout / Files / Saved / Snippets.
- Library search across all component categories.
- Layout tab (Grid + Flexbox builders with Insert/Wrap toggle).
- Files tree with folder upload, drag-drop, rename/delete.
- Saved Component Marketplace with scaled iframe thumbnails.
- Inline Rich Text floating toolbar.
- 6 image gallery blocks.
- CDN Panel (28 libraries).
- Monaco code editor + 40+ Monaco grammars.
- Contextual editors (Button/Image/Flex/Grid/Card).
- Timelines category (5 pure-CSS timelines).
- Publish (FTP/FTPS/SFTP) endpoint.
- Multi-page projects with workflow status pills.
- Site-wide template (header/footer).
- SEO per page.
- Snippets library.
- Find & Replace with regex + scopes.
- Design tokens library (colors/fonts/spacing scan).
- Analytics dashboard.
- Project templates CRUD.
- Multi-viewport preview (desktop/tablet/mobile).
- Undo / Redo with 50-step history.
- Inline text edit via pencil icon.
- Right sidebar tabs: Color, Gradient, Style, BG, Motion, Layers, Theme, Page.
- Photoshop-style color picker + gradient mixer.
- HTML import with section scanning.
- Export: standalone .html and .zip.
- MongoDB save/load + shareable public preview URL.
- Onboarding tour.
- CSS timelines tools + rename to "Web Dojo".

## Test Results
- **Iteration 10 (Jun 2026)**: Backend 44/44 pass (5 new commerce tests: config, payment-link happy path returns real buy.stripe.com link, 400 on empty name / zero / negative amount). Frontend 100%: AddPageModal opens + category chips + preview iframe + confirm inserts blocks & creates new page tab (home-modern, industry-esports, blank all create tabs); Shop tab + 3 store blocks + payment builder; Stripe generate returns real link and inserts button; PayPal embed inserted with client-id; background music MP3 + MIDI blocks added; Preview mode mounts. Forms regression intact. No blocking issues.
- **Iteration 9 (Feb 17, 2026)**: Frontend green — Preview mode hides sidebars and mounts device-framed iframe (1280/820/390), Template Preview modal opens on starter click without loading the template until "Use this template" is clicked, viewport switch resizes the modal iframe, Cancel returns to gallery without side-effects, Use confirms and loads. Backend regression: 28 starters unchanged.
- **Iteration 8 (Feb 17, 2026)**: Backend 39/39 pass — 28 starters seeded correctly, encrypted preset passwords survive backend restart, all preset validation still works. Frontend: Forms tab renders 6 presets + Open builder button; FormBuilderModal opens with all data-testids present, add-field/select/edit/insert flow works, real `<form>` HTML lands on canvas. Templates modal search + 28 aesthetic chips filter correctly.
- **Iteration 7 (Feb 17, 2026)**: Backend 39/39 pass — Publish preset encrypt/decrypt round-trip, 400 validation, 404 on unknown, 15 starters present with correct aesthetic + is_starter, starter DELETE returns 403, user templates still deletable, idempotent seeding survives supervisor restart.
- **Prior iterations 1–6**: Backend + frontend broadly green.

## Backlog (P0/P1/P2)
- **P2**: Set `WEBDOJO_SECRET_KEY` env var in production so preset passwords remain decryptable across pod restarts.
- **P2**: AI section generator (Claude Sonnet via Emergent LLM key).
- **P2**: Preview thumbnails/screenshots for user templates (currently only starters have color chips).
- **P2**: Filter/tag templates by aesthetic in a search box.
