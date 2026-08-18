# Tauri Desktop Packaging — Design

## Purpose
Package Web Dojo as a self-contained desktop application the user can
install and run without a browser, a separately-running backend, or a
separately-installed database — starting with a real, locally-buildable
and locally-testable Linux package, with Windows/Mac builds wired up via
CI for later.

## Scope
- A Tauri 2.x shell wrapping the existing React build as its webview.
- The existing FastAPI backend, packaged as a Tauri sidecar binary via
  PyInstaller (no system Python required on the end user's machine).
- A new SQLite-backed compatibility shim for the ~35 MongoDB call sites in
  `backend/server.py`, active only in the desktop build — the existing
  web-hosted deployment keeps using real MongoDB, unchanged.
- A working Linux package (`.AppImage`/`.deb`/`.rpm`) built and manually
  smoke-tested in this session.
- A GitHub Actions workflow that cross-builds Windows/Mac installers on
  push/dispatch — written and committed, but not runnable or verifiable
  from this sandbox (no Windows/Mac toolchain available here).

## Non-goals
- Rewriting the frontend's HTTP calls to use Tauri's IPC (`invoke`)
  instead of axios/HTTP — the sidecar backend still serves a normal HTTP
  API on `127.0.0.1`; the frontend's existing `REACT_APP_BACKEND_URL`
  pattern is reused with a desktop-specific value, not replaced.
- General-purpose MongoDB aggregation-pipeline support — the codebase has
  exactly one `.aggregate()` call (day-grouped analytics view counts);
  the shim special-cases that one pipeline shape rather than building a
  generic Mongo-query-to-SQL translator.
- Auto-updating, code signing, or app-store distribution — out of scope
  for this pass; can be added later once the base package works.
- BSD support — Tauri's Linux backend (webkit2gtk) may work there in
  theory but is unverified and unsupported by Tauri itself; not attempted.

## Backend: SQLite compatibility shim

### Why additive, not a replacement
`backend/server.py` currently does `client = AsyncIOMotorClient(mongo_url); db = client[db_name]`
at module scope, then every route handler calls `db.<collection>.<method>(...)`.
Grepping confirms the actual surface used is narrow: 28 simple
`find_one`/`insert_one`/`update_one`/`delete_one`/`delete_many`/`count_documents`
calls and 7 `find(...).sort(...).limit(...)` cursor calls across 7
collections (`projects`, `components`, `snippets`, `templates`,
`publish_presets`, `submissions`, `analytics`), plus exactly one
`.aggregate()` call. No `$or`/`$in`/`$gt`/`$lt`/`$exists`/`$regex` filters
anywhere — every filter is a simple exact-match dict, and the only update
operator used is `$set`.

This makes a narrow, drop-in-compatible shim tractable: mimic just the
Motor method signatures this codebase actually calls, so `server.py`'s
route handlers need zero changes to their query call sites — only the
module-level client/db initialization changes, gated by a `DB_BACKEND`
env var (`mongo` default, `sqlite` for the desktop build).

### Storage model
One SQLite table per collection: `id TEXT PRIMARY KEY, doc TEXT` (the full
document as a JSON blob), mirroring MongoDB's schemaless document model
instead of designing per-collection SQL schemas. Queries load matching
rows and filter/sort/limit in Python — not real SQL `WHERE` translation.
This is deliberately simple: dataset sizes for a single-user desktop app
are tiny (a handful of projects, at most low hundreds of analytics
events), so an O(n) Python scan per query is not a real performance
concern, and it avoids writing a general Mongo-filter-to-SQL compiler for
a codebase that never uses complex filters anyway.

### Shim surface (`backend/sqlite_compat.py`)
- `SqliteClient(path)` / `client[db_name]` → `SqliteDatabase` /
  `db["collection"]` → `SqliteCollection`, matching Motor's subscript
  access pattern so `db.projects.find_one(...)` keeps working unchanged.
- `find_one(filter, projection=None) -> dict | None`
- `find(filter, projection=None) -> SqliteCursor` supporting
  `.sort(field, direction)`, `.limit(n)`, `.to_list(n)`, and `async for`
  iteration (matching every actual call-site pattern found).
- `insert_one(doc)`, `update_one(filter, {"$set": patch})`,
  `delete_one(filter)`, `delete_many(filter)`, `count_documents(filter)`.
- `aggregate(pipeline)`: recognizes exactly the one pipeline shape used by
  `project_analytics`'s day-grouping query
  (`$match` → `$project` with `$substr` → `$group` with `$sum` → `$sort`
  → `$limit`) and executes it as a Python `Counter`-based day-grouping
  helper; raises `NotImplementedError` with a clear message for any other
  shape, so a future accidental new aggregate call fails loudly instead
  of silently returning wrong data.
- Projection semantics match Mongo's inclusion/exclusion rule: any
  non-`_id` key valued `1` puts the projection in inclusion mode (keep
  only those keys); otherwise it's exclusion mode (drop keys valued `0`).
  `_id` is always dropped either way (this app never stores a real `_id`
  field — every document already carries its own `id` field).

### Activation
```python
# near the top of backend/server.py, replacing the unconditional
# AsyncIOMotorClient construction
if os.environ.get("DB_BACKEND") == "sqlite":
    from sqlite_compat import SqliteClient
    client = SqliteClient(os.environ["SQLITE_PATH"])
else:
    client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get("DB_NAME", "webdojo")]
```
`SQLITE_PATH` is set by Tauri's sidecar launcher to an OS-appropriate
user-data directory (e.g. `~/.local/share/com.webdojo.app/webdojo.db` on
Linux). The web-hosted deployment never sets `DB_BACKEND`, so it takes the
existing `AsyncIOMotorClient` path unchanged.

## Backend: sidecar packaging
- PyInstaller bundles `backend/server.py`'s `uvicorn.run(...)` entrypoint
  plus all Python dependencies into one platform-specific executable —
  the end user's machine needs no Python installation.
- The sidecar listens on `127.0.0.1:8787` only (not exposed to the
  network) — a fixed port is fine for a single-instance desktop app.
- CORS needs no code changes: `backend/server.py` already reads a
  `CORS_ORIGINS` env var (added during this session's earlier security
  work) and defaults to dev-only origins when unset. Tauri's
  sidecar-launch code sets `CORS_ORIGINS=http://tauri.localhost` (Tauri's
  actual runtime webview origin, confirmed at implementation time) when
  spawning the process.

## Frontend
- New `build:tauri` npm script setting
  `REACT_APP_BACKEND_URL=http://127.0.0.1:8787/api` before running the
  existing `craco build` — the normal `npm run build`/`npm start` used for
  the web deployment is untouched.
- `tauri.conf.json`'s `build.frontendDist` points at the resulting
  `frontend/build/` directory.

## Tauri shell
- `src-tauri/` scaffolded via `npm create tauri-app` conventions (or
  manual `tauri init` against the existing frontend), targeting Tauri 2.x.
- Declares the PyInstaller binary as an `externalBin` sidecar; Rust
  startup code spawns it via `tauri-plugin-shell`'s sidecar API on app
  launch and terminates it on app exit (including on crash/force-quit,
  via Tauri's process-lifecycle hooks — no orphaned backend processes
  left running after the app closes).
- App identifier / product name: `com.webdojo.app` / "Web Dojo" (used for
  the user-data directory path above and installer metadata).

## Testing
- Backend: new `backend/tests/test_sqlite_compat.py` — pure-function
  tests against a temp-file SQLite DB, covering CRUD round-trips,
  projection inclusion/exclusion semantics, sort/limit, and the one
  special-cased aggregate query, matching this codebase's existing
  pytest style (temp DB per test, no mocking).
- `craco build` + `node --test` frontend suite unaffected (no frontend
  logic changes beyond the new build script and env var).
- Manual smoke test in this session: install the built `.AppImage`/`.deb`,
  launch it, create a project, add blocks, confirm autosave/manual save
  persist to the SQLite file, reload the app, confirm the project is
  still there, confirm publish/export still produce correct output.
- No automated test can exercise the actual Tauri shell/sidecar spawn
  (no windowing system to launch a real GUI app against in this sandbox
  in headless mode beyond what a manual launch + screenshot can verify) —
  the manual smoke test above is the verification for that layer.

## CI for Windows/Mac
`.github/workflows/tauri-build.yml` using `tauri-apps/tauri-action` with
an `os: [ubuntu-latest, windows-latest, macos-latest]` matrix, triggered
on a version tag push and via manual `workflow_dispatch`. Produces
platform installers as workflow artifacts (and, on a tagged push, as
GitHub Release assets). Written and committed in this session; requires
the repository to be pushed to GitHub and the workflow triggered there —
not runnable or verifiable from this sandbox.
