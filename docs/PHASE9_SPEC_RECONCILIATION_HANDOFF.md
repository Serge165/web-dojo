# Phase 9 Spec Reconciliation & Handoff

**Date:** 2026-09-02
**Purpose:** Reconcile two incoming Phase 9 spec documents against the actual codebase, record web research on how to implement the gaps, and hand off cleanly to the next session/agent.
**Source specs (read in full this session):**
1. `~/Downloads/web-dojo-phase-9-deepseek-spec.md` — "Phase 9: Collaborative Editing, Dynamic CMS, and Advanced Exports" (9A Collaboration, 9B Database Binding, 9C Export Flexibility, 9D Animation Timeline, 9E Local-First Sync)
2. `~/Downloads/deepseek-phase-9-build-spec.md` — "Full Implementation Spec for DeepSeek Flash" (pluggable exporter architecture, dashboard DB binding, Yjs integration, data-binding syntax `{%table.field%}`, animation data structure, Dexie local-first sync, educational branch config)

---

## 1. The single most important finding: the specs assume the wrong stack

Both specs were written assuming a **Next.js 15 + Node backend + Supabase (PostgreSQL) + Prisma** stack. The actual codebase is:

| Layer | Specs assume | Codebase actually is |
|---|---|---|
| Frontend | Next.js 15 App Router, TS strict | **React 19 + CRA via craco** (`frontend/`), plain JS (no TS), Tailwind + Radix, single route → `pages/Builder.jsx` (~80 components in `components/builder/`) |
| Backend | Node.js + Socket.io / Next API routes | **FastAPI (Python), one file** `backend/server.py` (3,255 lines) + `backend/models/*` module routers; convention is "extend server.py / add a models module, keep JS↔Python mirror pairs in sync" |
| Database | Supabase PostgreSQL + Prisma ORM | **MongoDB via motor**, with a Mongo-shaped **SQLite shim** (`backend/sqlite_compat.py`, `DB_BACKEND=sqlite`) for dev/desktop; equality-only `find()` is a standing constraint |
| Desktop | not considered | **Tauri 2.x** (`src-tauri/`), backend bundled as PyInstaller sidecar on `127.0.0.1:8787` |
| Realtime | y-websocket (Node) | **No WebSockets anywhere** |
| Auth | none existed in specs | **Builder-level JWT auth exists** (`backend/models/builder_auth.py`, stdlib HS256; `users` collection; `owner_id` + `collaborators[{email, role: viewer|editor|admin}]`; `/claim` endpoint; `require_project_access(need=editor/admin)` gates all project writes) — newer than `docs/WEB_DOJO_OVERVIEW.md` claims |

## 2. Reconciliation matrix (what the specs say vs. what exists)

### Phase 9A — Real-time collaboration
**Spec:** Yjs Y.Map/Y.Array per project, Node WebSocket server, Postgres CRDT-update persistence, awareness (cursors/presence), Y.UndoManager.

**Exists today:**
- ✅ Roles model: `share_project` / `remove_collaborator` endpoints with viewer/editor/admin roles (`server.py` ~line 536–560) — the *permission* half of collaboration is done.
- ✅ Project-level JWT auth (`builder_auth.py`) usable to authenticate socket upgrades.
- ✅ Multi-user safety at the DB level only (`update_project` is last-write-wins full-document `PUT`).
- ❌ No Yjs, no WebSockets, no awareness, no operational real-time sync. Autosave is a 2.5s-debounced full-project `PUT` (`Builder.jsx` lines ~203–232) — two concurrent editors will clobber each other.

**Adapted approach (research-backed):** use **pycrdt + pycrdt-websocket** (Python port of Yrs, MIT, actively maintained) mounted into the existing FastAPI app, instead of the spec's Node server. Rooms keyed by `project_id`; persistence store writes Yjs updates into a new `crdt_updates` Mongo/SQLite collection (same replay-on-load pattern the spec describes, just Mongo/SQLite instead of Supabase). Frontend adds `yjs` + `y-websocket` (client works against any compliant server). Auth: validate the builder JWT on the HTTP upgrade; y-websocket convention: close codes 4400–4499 = permanent, 4500–4599 = transient/retry. A migration bridge must map the current `{pages:[{elements:[...]}]}` project shape into Yjs structures (or run Yjs *alongside* the JSON doc as the realtime layer and reconcile on save — decision not yet made; see §6).

### Phase 9B — Database binding / Dynamic CMS
**Spec:** connect external Supabase, introspect schema, `dataBinding` on blocks, `{%post.title%}` template syntax, generated SQL/API routes, visual schema builder.

**Exists today (much more than the specs assumed):**
- ✅ **Native content stack ("Zenero", `backend/models/zenero.py` + `ZeneroDashboardPanel.jsx`)**: 9 typed collections per project — updates, gallery_items, blog_posts, portfolio_items, timeline_entries, bento_tiles, roster_players, fixtures, org_stats — full CRUD; writes gated by `X-Dashboard-Token`, reads public for the live page.
- ✅ Blocks carry `data-forge-widget` markers (`lib/zeneroWidgets.js`); live preview of blog-posts/social-posts/portfolio via `_dynamic_inner` (`server.py` ~2740).
- ✅ Forms → `submissions` collection loop is real; e-commerce orders loop is real (Stripe/PayPal/webhooks/SMTP).
- ✅ Dashboard UI pattern established (password → token → panel tabs), per `docs/WEB_DOJO_OVERVIEW.md` §7.
- ❌ No *external* database connection (no Supabase BYO-DB, no introspection), no generic field-mapping UI, no `{%…%}` interpolation engine.
- ⚠️ **A generic Template/Layout/Collections CMS was already designed, planned (`docs/superpowers/plans/2026-08-24-native-cms-core-2a/2b` + `export-ssg`), then RETIRED in favor of finishing Zenero.** Do not resurrect it blindly; the markers it standardized (`data-forge-collection-list`, `data-forge-bind`, `data-forge-bind-href`) are the vocabulary any future generic binding should reuse.

**Adapted approach:** extend Zenero rather than adding Supabase/Prisma. Add custom user-defined collections (the retired 2a plan's data model is a good base), a field→widget binding UI, and an export-time expansion pass (`expandTemplatesToPages` idea from the retired SSG plan) plus a runtime-fetch mode for truly dynamic pages. The `{%table.field%}` syntax conflicts with nothing but should reuse `data-forge-*` markers to stay consistent with `stripInlineStyles`/`exportHtml` extraction patterns.

### Phase 9C — Export flexibility (React / Next.js / Astro)
**Spec:** pluggable exporter registry (`IExporter.generate(project) → files map`), React/Next/Astro exporters, ZIP download.

**Exists today:**
- ✅ HTML export is strong and is the model to preserve: `frontend/src/lib/exportHtml.js` (`buildMultiPageExport`, `buildStandaloneHtml`, `buildCleanExport`, `downloadZip` via JSZip) + a **line-for-line Python mirror** in `server.py` (`_build_multi_page_bundle`, `_extract_forge_css`, `_build_organized_stylesheet`, …) used by the FTP/SFTP publish path. Convention: **every exporter must exist in both JS and Python.**
- ✅ UI entry point: `ImportExportModal.jsx` (`downloadZip`, `downloadStandalone`, `downloadProjectJson`) — new formats plug in here as new rows.
- ✅ Export conventions already solved: globals.css bucketing (Theme Vars/Base/Blocks-by-category/Components/Animations/Media Queries), `safePageFilename` slug sanitizing, `stripInlineStyles` semantic classes, fonts/ imgs/ js/ scaffolding, SEO/JSON-LD.
- ❌ No React/Next.js/Astro exporters.
- ⚠️ Spec's React exporter template uses **CRA/react-scripts (deprecated)** and JS-in-JSON-string style — reject; generate Vite-based React or match the spec's own Next.js App Router template.

**Adapted approach:** keep the spec's registry idea but in plain JS under `frontend/src/lib/exporters/` (JS) with Python mirrors under `backend/` for the publish path. Astro is the easiest first target because `.astro` files are HTML-superset with `---` frontmatter — Web Dojo's static HTML maps almost 1:1 (islands only where blocks have `data-forge-*` scripts). Next.js second (App Router: `app/layout.tsx`, `app/page.tsx`, route handlers for Zenero data). React (Vite) third.

### Phase 9D — Animation timeline
**Spec:** per-block `animations[]` data (trigger scroll/hover/click/pageLoad, duration, delay, easing, keyframes, triggerOptions), visual timeline UI with draggable keyframes + live preview, export as `@keyframes` + IntersectionObserver JS.

**Exists today (partial):**
- ✅ `lib/animations.js` (410 lines): ~20 `ANIMATION_PRESETS` (entrance/emphasis/on-scroll categories) with percentage `frames`, `buildKeyframes`, `buildAnimationShorthand`, `buildOnScrollCss` + shared deduplicated `IntersectionObserver` bootstrap (better than the spec's per-block observer code), `buildAppliedAnimation` single entry point used by `Builder.jsx` applyAnimation/applyAnimationToIds with `data-forge-anim` style blocks and `data-forge-el-id` targeting.
- ✅ `AnimationGenerator.jsx` UI: preset picker by category, duration/delay/timing controls; `animClipboard.js` / `fxClipboard.js` copy/paste; `ANIMATION_LIBRARIES` already includes GSAP_PRESETS and FRAMER_PRESETS via CDN (`cdns.js`).
- ❌ No custom keyframe editing, no timeline scrub UI, no hover/click triggers (on-scroll + load only).

**Adapted approach:** the spec's data shape is close to what exists (`frames` ≈ `keyframes`). Extend `animations.js` with hover/click trigger variants (CSS `:hover` needs no JS; click needs a tiny shared bootstrap like the on-scroll one), add a timeline scrubber UI (model on GSAP Timeline's position/scrub concepts; **WAAPI `element.animate()`** is the zero-dependency way to scrub a live preview). Note: **GSAP 3.15.0 is already a frontend dependency** (spec said "no GSAP" — flag to Dreamwalker; currently only used for CDN-export presets, not core).

### Phase 9E — Local-first sync
**Spec:** Dexie/IndexedDB instant local save, background 5s sync of unsynced mutations, offline editing, auto-sync on reconnect.

**Exists today:**
- ✅ Debounced autosave (2.5s, silent) → backend `PUT /api/projects/{id}` (`Builder.jsx`). UI prefs in localStorage only.
- ❌ No IndexedDB persistence, no offline queue, no reconnect backoff — a dropped connection loses work after the toast.

**Adapted approach:** spec's Dexie pattern is sound and stack-compatible (Dexie is MIT, works in the Tauri webview; Dexie Cloud is commercial so **not** usable under the open-source constraint — hand-roll the REST queue exactly as the spec sketches). Order mutations (`create|update|delete` on elements/pages/head_html), `liveQuery` for reactive UI, replay to `PUT /api/projects/{id}` or a new batch endpoint; the SQLite shim's equality-only find means a backend `synced` flag query should filter client-side or use a dedicated mutations collection.

### Educational branch (spec 2 only)
No branch/feature-flag system exists today (TODO.md §12.6 lists "feature-flag all major changes" as a constraint, unimplemented). The spec's `educationalConfig` (25 students/classroom, no billing) would be a new build-time env + feature-flag module. Nothing in the codebase blocks it; nothing exists for it.

---

## 3. Explicit conflicts between the specs and the codebase

1. **Stack**: specs mandate Supabase+Prisma+Node; codebase is FastAPI+Mongo/SQLite. → Adapt, don't adopt.
2. **"Dashboard is static JSON"** (spec 1): false — e-commerce, submissions, Zenero dashboards are DB-backed and wired.
3. **"117 blocks"** (spec 1): correct — confirmed by `block_styles_generated.py` header ("117 author-time-classed library blocks") and `blocks.js`+`blocksExtra.js`.
4. **"No auth"** (both specs): outdated — `builder_auth.py` landed after `WEB_DOJO_OVERVIEW.md` was last verified (2026-08-23). Collaboration work must build on it, not around it.
5. **Spec's per-block IntersectionObserver JS** (9D): codebase already has a better shared/deduplicated bootstrap; reuse that pattern.
6. **Spec's `{%table.field%}` syntax**: new vocabulary; existing convention is `data-forge-*` marker attributes. Prefer markers.
7. **Spec's React exporter (CRA)**: CRA is deprecated even by the codebase's own standards (it uses craco); generate Vite instead.
8. **"No GSAP"** (spec 2): GSAP 3.15.0 is already in `frontend/package.json`. Decision needed from Dreamwalker: keep CSS-first export (recommended for the "no extraction" philosophy) with GSAP only as CDN preset option (status quo).
9. **`y-websocket` Node server** (both specs): replace with **pycrdt-websocket** mounted in FastAPI (same protocol, Python, one deployable).
10. **Dexie Cloud**: open-source constraint (spec 2) rules it out; hand-rolled queue is fine.

---

## 4. Web research performed (sources + takeaways)

- **pycrdt** (github.com/y-crdt/pycrdt) — Python CRDTs on Yrs (Rust), MIT, YDoc/YMap/YArray with subscriptions; active (500+ commits). Pairs with **pycrdt-websocket** (rooms, awareness, pluggable persistence stores, ASGI-mountable) → the correct Yjs server for this FastAPI codebase.
- **y-websocket** (github.com/yjs/y-websocket) — current stable documents yjs v13 client; client auto-reconnects with exponential backoff; `shouldReconnect` override; close-code convention 4400–4499 permanent / 4500–4599 transient; server is in-memory + persistence hooks; `@y/hub` for scale (not needed initially).
- **Dexie** (dexie.org) — v4, MIT core: `version().stores()`, `liveQuery`, `bulkUpdate`; Dexie Cloud is the paid sync addon → custom REST queue required (Tauri-compatible).
- **Astro** (docs.astro.build) — current major is ahead of spec's "4.0"; `.astro` = HTML + `---` frontmatter, islands architecture, HTML components supported → near-1:1 mapping from Web Dojo static HTML export.
- **GSAP Timeline** (gsap.com/docs) — position parameter, `seek()`/`tweenTo()` scrubbing → good UX model for the timeline UI; WAAPI is the dependency-free scrub engine for canvas preview.
- **Next.js App Router** — spec's own Next templates are roughly current (app/layout.tsx, app/page.tsx, route handlers); regenerate against Next 15+ at build time.

---

## 5. Recommended adapted implementation order

1. **9E Local-first (Dexie) first** — smallest, de-risks everything, pure frontend, no stack conflicts. `frontend/src/lib/localdb.js` + mutation queue + reconnect replay.
2. **9C Exporters (Astro → Next.js → React/Vite)** — registry under `frontend/src/lib/exporters/` + Python mirrors in `backend/` for publish; UI rows in `ImportExportModal.jsx`. Keep `buildMultiPageExport` untouched; use it as the HTML baseline each framework exporter wraps.
3. **9B Generic collections on Zenero** — custom collection types + field-binding panel + `data-forge-bind` markers (vocabulary from the retired plan) + export-time expansion pass (revive `expandTemplatesToPages` idea) + runtime-fetch mode for truly dynamic pages.
4. **9D Timeline** — extend `animations.js` (hover/click triggers first), then scrub UI on WAAPI; export reuses the existing shared bootstrap pattern.
5. **9A Collaboration last** — pycrdt-websocket in FastAPI + `yjs`/`y-websocket` client + shape-mapping decision (Yjs-as-source-of-truth vs. Yjs-as-sync-layer) + `crdt_updates` persistence + awareness; gate on the existing JWT/roles.

---

## 6. Where this session leaves off

**Done this session:**
- Both spec files read fully (twice: once before codebase exploration, once against findings).
- Codebase reconciled: stack verified (package.json, server.py, models/, sqlite_compat, Tauri); export pipeline read (`exportHtml.js` in full, server.py mirror grepped); auth model read (`builder_auth.py`); Zenero stack read (`zenero.py`, `zeneroWidgets.js`, `_dynamic_inner`); animations read (`animations.js` in full, `AnimationGenerator.jsx` grepped); save/autosave located (`Builder.jsx`); export UI located (`ImportExportModal.jsx`); retired CMS plans identified and read (`2026-08-24-native-cms-core-2a/2b`, `export-ssg` — both marked RETIRED).
- Web research completed (sources in §4).
- This handoff written.

**Not started (next session's queue):**
- No code written. No dependencies installed. Open decisions: (a) Yjs shape-mapping strategy for `pages/elements`, (b) whether generic collections revive retired-plan markers, (c) GSAP keep/drop, (d) exporter target versions (Astro current major vs. spec's 4.x).
- §5 order above is a recommendation, not an agreed plan — worth a `docs/superpowers/plans/2026-MM-DD-phase-9-*.md` plan file per task before implementation, following the repo's SDD convention.
- `docs/WEB_DOJO_OVERVIEW.md` §9 ("no builder-level authentication") is now stale and should be updated when auth work is documented.

**Key files to re-open first next session:**
- `frontend/src/lib/exportHtml.js`, `backend/server.py` (lines ~1568–1985 exporter mirror; ~536–600 share/auth; ~2740–2835 `_dynamic_inner`)
- `frontend/src/lib/animations.js`, `frontend/src/components/builder/AnimationGenerator.jsx`
- `frontend/src/pages/Builder.jsx` (autosave/persist, lines ~203–232, ~780–860)
- `backend/models/builder_auth.py`, `backend/models/zenero.py`
- `docs/superpowers/plans/2026-08-24-native-cms-core-2a-data-model-plan.md` (retired but vocabulary-rich)





**Consequence:** Supabase + Prisma + Node `y-websocket` are stack violations here. Every Phase 9 item must be re-planned onto FastAPI + Mongo/SQLite + the existing JS export pipeline. Details per phase below.

---
