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

### Session Jun 2026 (n) — Style Library export / import
- **Export / Import Style Library** (`TextEffectsPanel.jsx`): Export (`style-lib-export`) downloads the saved library as `webdojo-style-library.json`; Import (`style-lib-import` → hidden `style-lib-import-input`) reads a JSON file, validates it's an array of `{name,style,hover}` entries, dedupes against existing (by name+style+hover), assigns fresh unique ids, and merges + persists to localStorage. Invalid files show an error toast and leave the library intact. Lets teammates share style presets as files.
- Tested: iteration_26 frontend E2E — export download, import merge/dedupe/validate, persist-across-reload, and regression all pass, zero console errors.


### Session Jun 2026 (m) — Paste To Many + Style Library
- **Paste To Many** (`LayersPanel.jsx` + `Builder.applyStyleToIds` + `lib/fxClipboard.js`): each Layers row has a checkbox; checking rows shows a batch bar with "Paste to N" that applies the copied style (text FX + shape + hover, re-injecting hover rules as needed) to all checked elements at once. Clipboard is a shared session singleton so Copy (Text FX tab) and batch Paste (Layers) share state.
- **Style Library** (`TextEffectsPanel.jsx`): save the copied style as a named entry (persisted in `localStorage['webdojo_style_library']`) shown as clickable thumbnails; clicking applies to the selection and loads it to the clipboard (so it can then be pasted to many). Entries carry portable hover-rule templates (`__CLS__` token) so they work across projects. Delete per entry.
- Tested: iteration_25 frontend E2E — paste-to-many (static + hover), library save/apply/delete/persist, and regression all pass 100%, zero console errors. Hardening: unique library IDs + quote-safe preview.


### Session Jun 2026 (l) — Effect Filter + Copy Everything (shape styling)
- **Effect Filter** (`LayersPanel.jsx`): a toggle (`layers-filter-fx`, shows a live count) filters the Layers list to only elements carrying a text/hover effect; shows `layers-filter-empty` when none qualify.
- **Copy Everything** (`TextEffectsPanel.jsx`): Copy/Paste (relabelled "Copy style"/"Paste style") now also carries Shape styling — `border`, `border-radius`, `corner-shape`, `box-shadow`, `backdrop-filter`, and `background` — alongside text/hover FX, read from the element's root tag. A `meaningful` guard ignores plain-background-only elements so a bare block isn't "copyable".
- Tested: iteration_24 frontend E2E — filter, shape-carrying copy/paste, no-effect gate, and regression all pass 100%, zero console errors.


### Session Jun 2026 (k) — Jump To Effected + Copy/Paste Effect
- **Jump To Effected** (`LayersPanel.jsx`): the effect badge (`layer-fx-<id>`) is now a button — clicking it selects that element and smooth-scrolls it into view on the canvas.
- **Copy/Paste Effect** (`TextEffectsPanel.jsx`): "Copy effect" captures the selected element's Text FX (root-tag FX style props via `rootStyleMap`, scoped so nested/substring styles don't leak) plus any `wd-tfx-*` hover classes into a session clipboard; "Paste effect" applies both to another selected element in one `onReplaceHtml` (`mergeStyleIntoRootTag` + `addClassToRootTag`). Pasted hover works because the injected `<style data-wd-tfx>` is global by class. Copying an element with no effect is a no-op with a clear toast.
- Tested: iterations 22–23 — both features + regression pass, zero console errors. (copyFx needed a follow-up scope fix so composite blocks with inner styles don't falsely report an effect.)


### Session Jun 2026 (j) — Effect Badges + FX Intensity
- **Effect Badges** (`LayersPanel.jsx`): each layer row now shows a small marker when the element carries an effect — a Sparkles icon (indigo) for text FX and/or a MousePointerClick icon (cyan) for hover FX (`layer-fx-<id>`). Detection is value-aware (parses actual style values) so cleared placeholders (`text-shadow:none`, `-webkit-text-stroke:0`, `background-clip:border-box`, `animation:none`) correctly drop the badge.
- **FX Intensity** (`TextEffectsPanel.jsx`): a slider (25–250%, `textfx-intensity`) scales glow/shadow/stroke strength of Text FX before applying. Static, animated (keyframes) and hover effects all respect it; the chip previews (including animated keyframes) update live as the slider moves.
- Tested: iterations 19–21 — intensity scaling (~2x at 200%), badge appear/update/clear, and Text FX regressions all pass; zero console errors. (Badge-clear needed a follow-up fix: value parsing instead of lookahead regex, which backtracked.)


### Session Jun 2026 (i) — Text FX polish: live-animating previews + hover cleanup
- **FX Live Preview** (`TextEffectsPanel.jsx`): the Animated chips (shimmer/rainbow/pulse/flicker/float/wobble) now animate their little "Ag" previews live via fixed-name `@keyframes wdtfxprev_*` injected once into the panel, so the motion is visible before applying.
- **Per-Element Hover Cleanup**: a "Remove hover from element" button (`textfx-hover-clear`, enabled only when the selected element has hover FX) strips every `wd-tfx-*` class from the element root tag and removes the matching injected `<style data-wd-tfx>` blocks from headHtml — verified it clears multiple stacked hover effects cleanly.
- Tested: iteration_18 frontend E2E — both items + Text FX apply regression pass 100%, zero console errors.


### Session Jun 2026 (h) — Match Neighbor, Preset Thumbnails, Text FX tab
- **Match Neighbor** (`DividerPanel.jsx`): the auto-match area now has two buttons — "Selected" (matches the selected section) and "Far side" (matches the section on the other side of the snap direction: below-placement → next section, above-placement → previous section). Disabled at Page-end placement or when no far-side section exists.
- **Preset Thumbnails** (`ShapePanel.jsx`): saved custom presets now render a faithful thumbnail using their real patch values (border/radius/corner-shape/box-shadow) over a light backdrop, instead of the generic dark swatch.
- **Text FX tab** (new right-sidebar tab, `TextEffectsPanel.jsx`) — flamingtext-style heading/text effects applied to the selected element:
  - Fill & stroke (inline `onPatchStyle`): Sunset/Ocean/Candy/Gold gradient clips, Hollow/Stroke outline (`-webkit-text-stroke`), Neon, Fire, Chrome, Retro 3D, Long shadow, Soft glow.
  - Animated (injects `@keyframes` via `onApplyAnimation` + inline animation): Shimmer, Rainbow, Pulse glow, Flicker, Float, Wobble.
  - Hover (adds a scoped `wd-tfx-*` class to the root tag + injects a `<style>:hover` rule into headHtml): Color pop, Underline grow, Glow, Lift, Skew, Spread.
  - Clear text FX resets the relevant properties.
- Right sidebar now has 12 tabs in `grid-cols-4`.
- Tested: iteration_17 frontend E2E — all three features + regression pass 100%, zero console errors.


### Session Jun 2026 (g) — Divider auto-match color + save custom shape presets
- **Auto-Match Color** (`DividerPanel.jsx`): a "Match selected section color" button reads the selected section's rendered background via `getComputedStyle` (walks node + descendants for the first solid color), converts rgb→hex, and sets the divider fill in one tap. Disabled until a section is selected.
- **Save My Preset** (`ShapePanel.jsx`): a name input + "Save current" button captures the current border/radius/corner-shape/box-shadow as a named custom preset, persisted to `localStorage['webdojo_shape_presets']` and rendered alongside the 9 built-ins with a delete (X) control. Custom presets apply one-click like the built-ins and survive reload.
- Tested: iteration_16 frontend E2E — both features + regression pass 100%, no console errors.


### Session Jun 2026 (f) — Divider snapping + Shape presets
- **Divider snapping** (`DividerPanel.jsx`): a "Snap placement" control (Above / Below / Page end) inserts the SVG divider block at the correct index relative to the selected section (`onAddBlock(html, atIndex)` → `addBlock` splice). Above/Below disable until a section is selected. Blocks render edge-to-edge in export/preview so dividers sit flush.
- **Shape presets** (`ShapePanel.jsx`): a "One-click presets" row of 9 curated combined styles (Glass card, Frosted dark, Neumorphic, Neu inset, Soft card, Elevated, Pill, Neon, Squircle glow). Clicking applies the full style patch (background/backdrop-filter/border/radius/corner-shape/box-shadow) to the selected element instantly; toasts a prompt if nothing is selected.
- Tested: iteration_15 frontend E2E — both features + regression pass 100%, no console errors.


### Session Jun 2026 (e) — CSV export, Shape tab, Divider tab, docked Layers
- **CSV export** in the Submissions inbox: a CSV button in the modal header downloads the current form-group's entries as a spreadsheet (`SubmissionsModal.downloadCsv`).
- **Shape tab** (new right-sidebar tab, `ShapePanel.jsx`): border (width/style/color), corner radius (linked or per-corner), CSS3 `corner-shape` (round/squircle/bevel/scoop/square/notch), box-shadow builder (presets + custom x/y/blur/spread/color/inset), live preview + Apply/Clear to selection.
- **Divider tab** (new right-sidebar tab, `DividerPanel.jsx`): 10 SVG section-divider presets (wave, waves, curve, curve-alt, tilt, triangle, arrow, book, split, zigzag) with color, height, flip X/Y; inserts a full-width SVG block.
- **Layers moved out of the tabs** into a persistent, collapsible docked palette at the bottom of the right sidebar (GIMP/Photoshop-style), `data-testid='layers-dock'`. `LayersPanel` gained a `hideHeader` prop.
- Right sidebar TABS are now 11 items in `grid-cols-4`: color, gradient, style, shape, bg, blend, divider, anim, theme, cdn, page.
- Tested: iteration_14 frontend E2E — all 4 features + regression pass, no console errors.


### Session Jun 2026 (d) — Form Submissions Inbox + Mode-tab relocation (P0)
- **Form Submissions Inbox**: forms built in Web Dojo now post to a real backend so deployed/previewed demo sites capture real entries.
  - Backend (`server.py`): `Submission` model + `POST /api/submissions` (parses JSON and form/multipart, reserved `_wd_*` keys → metadata, rest → `data`; returns JSON `{ok,id}` when `Accept: application/json`, else an HTML thank-you page; empty → 400), `GET /api/submissions` (newest-first, `?project_id=` / `?form_name=` filters), `DELETE /api/submissions/{id}`, `DELETE /api/submissions?form_name=`.
  - Frontend (`forms.js`): `DEFAULT_FORM.action` defaults to `${REACT_APP_BACKEND_URL}/api/submissions`; `buildFormHtml()` injects hidden `_wd_form`/`_wd_form_id` inputs, a `data-success` attribute, and a small inline `<script>` that intercepts submit and POSTs FormData via fetch (`Accept: application/json`), replacing the form with an inline green success message (no navigation).
  - Viewer (`SubmissionsModal.jsx`): opened from a new **Inbox** toolbar icon (`submissions-btn`); left = form groups w/ counts, right = entries w/ fields, timestamp, page link, per-entry delete + refresh.
  - `FormBuilderModal.jsx`: new "Form name (inbox label)" field + helper note under Action URL.
  - Tested: backend 61/61 pytest (8 new), frontend E2E form→preview→submit→AJAX success→inbox round-trip verified.
- **Mode-tab relocation (P0)**: Design/Code/Preview toggle moved out of the crowded TopBar into a bar at the top of the center pane (`center-pane` → `mode-toggle`), so TopBar Undo/Redo are no longer obstructed. Viewport toggle stays in TopBar.


### Session Jun 2026 (c) — Toolset Revamp, Blend, CDN-aware tools, Import/Export hub
- **Left toolbox revamp** (`/app/frontend/src/lib/blocksExtra.js`, merged into `blocks.js` CATEGORIES): 5+ new **Navbars** (centered logo, mega-menu, e-commerce+search, transparent overlay, app pill-tabs), a new **Headers** category (announcement+header, dropdown, minimal serif, dark+CTA, search+icons), a new **Footers** category (minimal, newsletter, social, 4-column, contact, app-download), and a new **Video BG** category (video hero, video+text section, video banner).
- **Right sidebar**: **Blend** tab (`BlendPanel.jsx`) with every CSS `mix-blend-mode` + `background-blend-mode`, an isolate toggle, and a colour-overlay/duotone wrap builder; **Layers** promoted to its own tab (was nested in BG). Right sidebar is now 10 tabs (grid-cols-5).
- **CDN-aware tools** (`/app/frontend/src/lib/cdnComponents.js`): when a known CDN is present in `<head>` (Bootstrap 5, Tailwind, Bulma, Font Awesome, Bootstrap Icons, AOS, Swiper), the Library shows a **"From your CDNs"** section with matching ready-to-drop component blocks (data-driven via `isLibInHead`).
- **Clean HTML / CSS3 code panel (b1)**: CodeView now has an **HTML | CSS | Inline** toggle. HTML = clean markup referencing `styles.css`; CSS = auto-extracted stylesheet (via existing `stripInlineStyles`); Inline = single-file standalone. Non-destructive (blocks still authored with inline styles).
- **Import / Export hub** (`ImportExportModal.jsx`, opened from TopBar Export → "More: JSON, Figma, Webflow, URL…"): Export = Standalone HTML, clean HTML+CSS zip, **JSON project** (re-importable), Copy HTML; **Send to** Figma / Webflow / Framer / WordPress / Netlify (honest supported paths — see note). Import = paste HTML, **Import from URL** (backend `POST /api/import/url` via httpx), import JSON project. Figma/Webflow have no public push/pull API, so these use plugin/embed/export paths with explanatory tooltips.
- **Order confirmation**: new "Thank You / Order Received" Shop layout + the cart runtime shows a success banner and clears the cart on `?wd_checkout=success`.
- **Social auto-fill (Open Graph)**: `buildStandaloneHtml`/`buildCleanExport` now emit `og:*` + `twitter:*` + description/canonical/favicon meta from the page's SEO fields (falls back to page title), so shared links render with the right title/image.
- **Product Catalog Sync**: Shop tab "Make this shop checkout-ready" (`wireCatalog` in Builder) wires Add/Buy buttons to the live cart (adds `data-wd-add`) and drops in the cart runtime if missing. Store product-card block is now a real add-to-cart button.

### Session Jun 2026 (b) — More Layouts, Working Cart & Social Buttons
- **8 new niche layouts** in `pageLayouts.js` (Add Page picker, under the **Industry** category): Podcast, Church/Faith, Wedding, SaaS Changelog, Real Estate Listing, Medical/Clinic, Nonprofit/Charity, Event/Conference. Added reusable section builders (`simpleList`, `specs`, `listenOn`, `changelog`) and two derived themes (`TClinic` teal, `TCharity` orange).
- **Working shopping cart** (`/app/frontend/src/lib/cart.js`) for exported STATIC sites: `buildCartRuntimeHtml` renders a floating cart button + slide-out drawer, stores the cart in `localStorage`, shows live qty + totals, and checks out. `buildAddToCartButton` emits `data-wd-add` buttons the runtime hooks via event delegation. Checkout hands off to real Stripe Checkout via new backend `POST /api/commerce/checkout-session` (inline `price_data` line items → returns hosted `checkout.stripe.com` URL); optional **PayPal** checkout (client-side SDK, totals cart) when a Client ID is provided. Backend URL is baked into the block so it keeps working post-export. The Shop layouts (catalog, dark store, product detail, "Shop + Working Cart") now use real add-to-cart buttons + the runtime. Managed via the **Shop** tab (`CommerceTab.jsx`): cart config (currency/accent/PayPal), add-to-cart generator, and store blocks.
  - Hardening: `origin_url` is only sent when `location.origin` is valid (not the srcdoc `"null"`), and the backend coerces non-http(s) origins to a safe default so in-app Preview checkout returns 200 instead of a Stripe 502.
- **Social buttons tool** (`/app/frontend/src/lib/social.js` + `SocialShareModal.jsx`, opened from the Library toolbox → "Social buttons"). Two modes: **Share this page** (X, Facebook, LinkedIn, WhatsApp, Telegram, Reddit, Pinterest, Threads, Bluesky, Mastodon, Email) and **Link to profiles** (adds Instagram, YouTube, TikTok, Discord, Twitch, GitHub, Spotify — 18 total). Full customization: shape (circle/rounded/square/pill), size, style (brand/outline/mono/glass), colors, gap, layout (row/column), align, labels, and hover animations (lift/scale/rotate/fill/glow/underline). Output is a self-contained block: scoped `<style>` + inline brand SVGs + a tiny script that points share links at the current page.

### Session Jun 2026 (a) — Layouts, Ecommerce & Payments, Background Music
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
- **Iteration 12 (Jun 2026)**: Backend 53/53 pass (3 new `/api/import/url` tests: 200 for example.com, 400 for bad/empty). Frontend 100%: new Navbars/Headers/Footers/Video-BG library blocks insert; Layers standalone tab + Blend tab (mix-blend apply + colour-overlay wrap); CodeView HTML|CSS|Inline switch (CSS emits real rules, Inline emits og: meta); CDN toggle surfaces "From your CDNs" blocks; Import/Export hub export/send/paste/URL all work (paste/URL open the imported-sections chooser); wire-catalog-btn; Thank-You page. Radix a11y warning fixed (DialogDescription added to the 4 new dialogs).
- **Iteration 11 (Jun 2026)**: Backend 50/50 pass (6 new: `checkout-session` happy path returns real `checkout.stripe.com` URL + 4 validation 400s + payment-link >max). Frontend: all 8 new Industry layouts present with previews; 3 inserts created page tabs; Shop tab add-cart + add-to-cart insert blocks; social builder share+follow modes verified (inserted HTML contains `data-wds-share` / profile href); Preview-mode drawer opens, qty/total update. One issue found & fixed: in-Preview Stripe checkout 502 due to srcdoc `origin==="null"` → guarded in `cart.js` + `server.py` (curl-verified: bad/empty/valid origins all return valid checkout URLs).
- **Iteration 10 (Jun 2026)**: Backend 44/44 pass (5 commerce). Frontend 100%: AddPageModal, Shop tab, Stripe payment link, PayPal embed, background music MP3+MIDI, Preview mount. Forms regression intact.
- **Iteration 9 (Feb 17, 2026)**: Frontend green — Preview mode hides sidebars and mounts device-framed iframe (1280/820/390), Template Preview modal opens on starter click without loading the template until "Use this template" is clicked, viewport switch resizes the modal iframe, Cancel returns to gallery without side-effects, Use confirms and loads. Backend regression: 28 starters unchanged.
- **Iteration 8 (Feb 17, 2026)**: Backend 39/39 pass — 28 starters seeded correctly, encrypted preset passwords survive backend restart, all preset validation still works. Frontend: Forms tab renders 6 presets + Open builder button; FormBuilderModal opens with all data-testids present, add-field/select/edit/insert flow works, real `<form>` HTML lands on canvas. Templates modal search + 28 aesthetic chips filter correctly.
- **Iteration 7 (Feb 17, 2026)**: Backend 39/39 pass — Publish preset encrypt/decrypt round-trip, 400 validation, 404 on unknown, 15 starters present with correct aesthetic + is_starter, starter DELETE returns 403, user templates still deletable, idempotent seeding survives supervisor restart.
- **Prior iterations 1–6**: Backend + frontend broadly green.

## Backlog (P0/P1/P2)
- **P2**: Set `WEBDOJO_SECRET_KEY` env var in production so preset passwords remain decryptable across pod restarts.
- **P2**: AI section generator (Claude Sonnet via Emergent LLM key).
- **P2**: Preview thumbnails/screenshots for user templates (currently only starters have color chips).
- **P2**: Filter/tag templates by aesthetic in a search box.
