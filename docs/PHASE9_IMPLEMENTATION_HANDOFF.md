# Phase 9 Implementation Handoff

**Date:** 2026-09-02
**Predecessor doc:** `docs/PHASE9_SPEC_RECONCILIATION_HANDOFF.md` (spec↔codebase reconciliation + web research).
**Goal:** implement the features from the two Phase 9 spec documents onto the ACTUAL stack (React 19 + craco / FastAPI + Mongo + SQLite-shim + Tauri) — not the specs' assumed Next.js/Node/Supabase stack. Reference §2 of the reconciliation doc for the per-phase rationale.

---

## 1. What was implemented

### 9E — Local-first sync (+ educational branch)
- **`frontend/src/lib/localdb.js` (new)** — zero-dependency IndexedDB layer: `saveSnapshot/getSnapshot/listSnapshots/deleteSnapshot` (full-project snapshots store) + `enqueue/pendingEntries/queueSize/removeQueued/flushQueue` (unsynced-save queue, auto-seq, oldest-first replay, re-entrancy guard). Header documents the Dexie drop-in swap path.
- **`frontend/src/lib/featureFlags.js` (new)** — `isEducational()` (25-student classroom mode, `REACT_APP_EDUCATIONAL_MODE` + `wd_edu_mode` localStorage override), `billingEnabled()`, and `featureEnabled(flag)` gates (`collab` off, `frameworkExports` on, `localFirst` on) satisfying TODO.md §12.6's "feature-flag all major changes".
- **`frontend/src/pages/Builder.jsx`** — `persist()` snapshots the exact save payload to IndexedDB BEFORE the network call; on failed network save of an existing project it enqueues the mutation; after every successful save it flushes the queue (silent on autosave, toasts on manual). A `window.online` effect flushes the queue the moment connectivity returns. `loadProject()` falls back to the local snapshot when the network fails.
- Backend educational flag: not wired yet (see §4).

### 9C — Framework exporters (Astro + Next.js)
- **`frontend/src/lib/exporters/astro.js`** — `buildAstroExport(project)` → `{ files, projectName, label }`. Astro 4 static: each page from `buildMultiPageExport` becomes `src/pages/<slug>.astro` (full HTML — Astro pages are HTML-superset), shared assets → `public/`, bare `<script>` tags marked `is:inline` so Astro leaves bootstrap/runtime snippets verbatim. Ships `package.json`, `astro.config.mjs`, `tsconfig.json`, `.gitignore`.
- **`frontend/src/lib/exporters/nextjs.js`** — `buildNextjsExport(project)` → `{ files, projectName, label }`. Next 15 App Router static export: `app/page.js` + `app/<slug>/page.js` route components rendering the page body via `dangerouslySetInnerHTML`, real `<meta>/<link>` tags as JSX (React 19 hoists them), `app/globals.css`, `next.config.mjs` with `output: "export"`, `package.json`, `jsconfig.json`, `.gitignore`.
- **`frontend/src/components/builder/ExporterModal.jsx` (new)** — Astro/Next picker with per-file preview chips; both exports generated from one click.
- **`frontend/src/components/builder/ImportExportModal.jsx`** — new "Framework project" row (flag-gated) → opens ExporterModal.
- **`backend/models/framework_export.py` (new)** — Python mirrors of the same transforms (`apply_astro_transform`, `apply_nextjs_transform`) for the FTP/SFTP publish path, keeping the repo's JS↔Python export-mirror convention.
- **`backend/server.py`** — `PublishRequest` gained `framework: Optional[str]` (astro|nextjs); the publish endpoint applies the transform after `_build_multi_page_bundle`.

### 9B — Generic collections (extends Zenero)
- **`backend/models/collections.py` (new)** — generic user-defined collections router: `collection_defs` (name/label/field schema; allowed types `text textarea number image url date boolean`) + `collection_items` (free-form `data` per schema). CRUD for defs and items, dashboard-token-gated writes, public reads, name-slug validation, duplicate-name 409, field-type validation, cascade deletes. Plus **`expand_collection_tokens(project_id, html)`** — export-time `{%name.field%}` / `{%name.count%}` expansion (`field` = newest item's value; unknown → ""; per-token cache).
- **`backend/server.py`** — router wired with the zenero-style `_LiveDbProxy`/`_require_dashboard_token` injection. Publish endpoint: `expand_collections` (default true) expands tokens on every `.html` file before uploading/zipping; failures degrade to empty strings, never block a publish.
- **`frontend/src/components/builder/ZeneroDashboardPanel.jsx`** — new **Collections** tab: field-driven collection creator (name/label/field builder), collection list with `{%name.field%}` token hints, schema-driven item form (textarea/number/boolean-aware), edit/delete items, delete collections.

### 9D — Animation triggers (hover/click) + groundwork
- **`frontend/src/lib/animations.js`** — `buildAppliedAnimation` now takes `trigger` (`load` default / `scroll` / `hover` / `click`) and returns a `trigger` field. Added `ANIMATION_TRIGGERS`, `buildHoverCss` (pure CSS `:hover`, zero JS), `buildClickCss` (`.wd-click-play` class scoped by `data-forge-el-id`), `CLICK_BOOTSTRAP_MARKER`, `buildClickBootstrapScript()` (deduped single script; remove class → reflow via `void offsetWidth` → re-add, replays on every click). Backward compatible — existing animation tests pass unchanged.
- **`frontend/src/components/builder/AnimationGenerator.jsx`** — "Trigger" control; on-scroll presets auto-default to scroll; passes `trigger` into both `setAnimClip` (batch) and `onApplyAnimation`.
- **`frontend/src/pages/Builder.jsx`** — `applyAnimationToHtml` branches per trigger, defensively strips stale `data-wd-onscroll` / `data-wd-onclick` / inline animation when switching triggers; `ensureClickBootstrap` appends the one shared click script; multi-select batch apply follows the same path.
- Timeline scrubber UI: not started (see §4).

### 9A — Real-time collaboration
---

## 2. Verification performed

| Check | Result |
|---|---|
| All 10 touched/new JS/JSX parse via project `@babel/parser` with JSX | ✅ (Builder.jsx, ZeneroDashboardPanel.jsx, both exporters, localdb, featureFlags, etc.) |
| `backend/server.py` + all models (`collections`, `framework_export`, `zenero`, `builder_auth`) parse via `ast.parse` | ✅ |
| `npx craco test src/lib/animations.test.js` — existing 6 `buildAppliedAnimation`/on-scroll tests | ✅ PASS (6/6) — 9D is backward compatible |
| SQLite shim compatibility (`sqlite_compat.py`) — `collection_defs`/`collection_items` | ✅ tables auto-create on first use; `$set`, `count_documents`, `delete_many` all supported (zenero.py already uses `$set` + `delete_many`) |
| Full production build | ⏳ `craco build` (NOT plain `react-scripts` — that fails to resolve `@/App`; craco supplies the webpack alias). Last observed: "Creating an optimized production build…". Verify `compiled successfully` in `/tmp/wd-build2.log` before closing out. |
| `npm install dexie` | ❌ earlier attempt failed with module-resolution error despite `npm ping` PONG — shipped zero-dep `localdb.js` instead (works, smaller, no risk); Dexie remains the documented optional upgrade |

**Critical environment gotcha:** canonical build is `npm run build` = **`craco build`**. Running `react-scripts build` directly fails with `Can't resolve '@/App'` because the `@/` alias is provided by craco, not react-scripts. Don't "fix" alias resolution — use craco.

---

## 3. Files changed / created

**New:**
- `frontend/src/lib/localdb.js`, `frontend/src/lib/featureFlags.js`
- `frontend/src/lib/exporters/astro.js`, `frontend/src/lib/exporters/nextjs.js`
- `frontend/src/components/builder/ExporterModal.jsx`
- `backend/models/collections.py`, `backend/models/framework_export.py`
- `docs/PHASE9_SPEC_RECONCILIATION_HANDOFF.md`, `docs/PHASE9_IMPLEMENTATION_HANDOFF.md` (this doc)

**Modified:**
- `frontend/src/pages/Builder.jsx` (9E snapshot/queue/reconnect/offline-load; 9D trigger branches + click bootstrap)
- `frontend/src/components/builder/AnimationGenerator.jsx` (trigger control)
- `frontend/src/components/builder/ImportExportModal.jsx` (framework row)
- `frontend/src/components/builder/ZeneroDashboardPanel.jsx` (Collections tab + loadAll collections fetch)
- `frontend/src/lib/animations.js` (hover/click builders, ANIMATION_TRIGGERS, click bootstrap)
- `backend/server.py` (`PublishRequest.framework`/`expand_collections`, publish hooks, collections router mount)

---

## 4. Deferred / next steps

1. **9A real-time collaboration (the big one)** — pycrdt + pycrdt-websocket in FastAPI (rooms per `project_id`, `crdt_updates` persistence collection, JWT upgrade auth + roles via `builder_auth.require_project_access`), `yjs` + `y-websocket` client, Yjs shape-mapping decision (Yjs-as-source-of-truth vs sync-layer over the JSON doc), awareness. See reconciliation §2/§4. Also gate behind `featureEnabled("collab")`.
2. **9B list/repeat binding** — `{%name.[]%}` or block-level repeat on `data-forge-collection-list` markers (retired-plan vocabulary); current `expand_collection_tokens` only does single-value + count.
3. **9D timeline scrubber UI** — custom keyframe editing + scrub preview via WAAPI `element.animate()`; GSAP already in package.json (3.15.0) is NOT used by core — decision on keep/drop still open.
4. **9E offline-boot restore** — `loadProject` fallback exists, but the project list (`openLoad`) and initial route still require network; a "Local copies" affordance in the load modal would complete offline editing.
5. **Educational mode backend** — `isEducational()` is frontend-only. Mirror as `EDUCATIONAL_MODE` env read in `server.py` (e.g. cap projects per user, hide billing) if the classroom branch is pursued.
6. **Docs update** — `WEB_DOJO_OVERVIEW.md` §7/§9 still describe the pre-auth, pre-collections state.

---

## 5. IMPORTANT — pre-existing uncommitted work in this tree (NOT mine)

`git status` shows many modified/untracked files that existed before this session and should be treated as someone else's in-progress work:

- Untracked: `frontend/src/lib/collab.js`, `backend/models/presence.py`, `backend/models/site_auth.py`, `backend/tests/test_site_auth.py`, `docs/DASHBOARD_LOGIN_HANDOFF.md`, `docs/NAV_AND_NEW_PROJECT_BUGFIX_HANDOFF.md`, `.claude-flow/`, `.claude/`, `.playwright-mcp/`.
- Modified: `docs/WEB_DOJO_USER_MANUAL.md`, `frontend/src/components/builder/BlockEditMenu.jsx`, `NewProjectWizard.jsx`, `ProjectTemplatesModal.jsx`, `frontend/src/lib/blocksExtra.js`, plus their test files.

Notably `collab.js` / `presence.py` suggest prior (possibly abandoned) collaboration scaffolding. **Check these before starting 9A** — builds, imports, or style conventions there may inform (or conflict with) the pycrdt approach. None of these files were touched by this session.

**My session's git footprint:** the modified/new files listed in §3 only.
- Not implemented this pass — deliberately ordered last per reconciliation §5/§6 (biggest, most invasive). pycrdt/pycrdt-websocket plan stands in reconciliation §2/§4. See §5 re: pre-existing untracked collab scaffolding.