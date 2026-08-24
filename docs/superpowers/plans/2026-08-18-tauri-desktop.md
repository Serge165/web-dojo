# Tauri Desktop Packaging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a working, locally-built, locally-tested Linux desktop package (`.AppImage`) for Web Dojo, with a SQLite-backed backend requiring no external database, plus a CI workflow for Windows/Mac builds.

**Architecture:** Tauri 2.x wraps the built React app; the FastAPI backend runs as a PyInstaller-bundled sidecar talking to a new SQLite compatibility shim (additive — the web deployment keeps using MongoDB unchanged).

**Tech Stack:** Tauri 2.x, Rust/Cargo, PyInstaller, `aiosqlite`, existing FastAPI/React stack.

**Spec:** docs/superpowers/specs/2026-08-18-tauri-desktop-design.md

## Global Constraints

- `DB_BACKEND=sqlite` env var gates the new code path; unset (web deployment) behavior is byte-for-byte unchanged.
- Shim covers exactly: `find_one`, `find`+`.sort()`+`.limit()`+`.to_list()`/async-iter, `insert_one`, `update_one($set only)`, `delete_one`, `delete_many`, `count_documents`, and one special-cased `.aggregate()` shape (raises `NotImplementedError` for any other pipeline).
- Storage: one SQLite table per collection, `id TEXT PRIMARY KEY, doc TEXT` (JSON blob). Serialize with `json.dumps(doc, default=str)` (handles `datetime` and anything else without per-field logic); deserialize with plain `json.loads` (returns ISO strings for datetime fields — Pydantic response models auto-coerce those, same as string-dated Mongo docs already flowing through `_serialize` today).
- Sidecar listens on `127.0.0.1:8787` only.
- No changes to `backend/server.py`'s CORS code — the sidecar launcher sets `CORS_ORIGINS` at process spawn instead.

---

### Task 1: SQLite compatibility shim + backend activation + tests

**Files:**
- Create: `backend/sqlite_compat.py`
- Modify: `backend/server.py:29-32` (client/db init), `backend/requirements.txt` (add `aiosqlite`)
- Create: `backend/tests/test_sqlite_compat.py`

**Interfaces:**
- Produces: `SqliteClient(path)` where `client[db_name]` returns a `SqliteDatabase`, and `db["collection"]`/`db.collection` (via `__getattr__`) returns a `SqliteCollection` with async methods `find_one`, `find`, `insert_one`, `update_one`, `delete_one`, `delete_many`, `count_documents`, `aggregate`.

- [ ] **Step 1: Add `aiosqlite` to requirements**

Append to `backend/requirements.txt`: `aiosqlite==0.22.1`

Install into the venv: `cd backend && source .venv/bin/activate && pip install aiosqlite==0.22.1`

- [ ] **Step 2: Write `backend/sqlite_compat.py`**

```python
"""Narrow, drop-in-compatible SQLite shim for the subset of Motor's async
MongoDB API this codebase actually uses (see backend/server.py's ~35 call
sites) — not a general MongoDB emulator. Used only when DB_BACKEND=sqlite
(the desktop/Tauri build); the web deployment keeps using real MongoDB via
motor.motor_asyncio.AsyncIOMotorClient, unchanged.

Storage: one table per collection, `id TEXT PRIMARY KEY, doc TEXT` (a JSON
blob of the full document) — mirrors MongoDB's schemaless document model
instead of per-collection SQL schemas. Queries load matching rows and
filter/sort/limit in Python rather than translating to SQL WHERE clauses:
dataset sizes for a single-user desktop app are tiny, and this codebase
never uses complex filters ($or/$in/$gt etc. — confirmed absent by grep),
so a full Mongo-query-to-SQL compiler would be solving a problem that
doesn't exist here.
"""
import json
from collections import Counter

import aiosqlite


def _matches(doc: dict, filt: dict) -> bool:
    for k, v in (filt or {}).items():
        if doc.get(k) != v:
            return False
    return True


def _project(doc: dict, projection: dict | None) -> dict:
    if not projection:
        return doc
    include_keys = [k for k, v in projection.items() if k != "_id" and v]
    if include_keys:
        return {k: doc[k] for k in include_keys if k in doc}
    exclude_keys = {k for k, v in projection.items() if not v}
    return {k: v for k, v in doc.items() if k not in exclude_keys}


class SqliteCursor:
    def __init__(self, rows: list[dict]):
        self._rows = rows
        self._sort_field = None
        self._sort_dir = 1
        self._limit = None

    def sort(self, field: str, direction: int = 1):
        self._sort_field = field
        self._sort_dir = direction
        return self

    def limit(self, n: int):
        self._limit = n
        return self

    def _materialize(self) -> list[dict]:
        rows = self._rows
        if self._sort_field is not None:
            rows = sorted(rows, key=lambda d: d.get(self._sort_field), reverse=self._sort_dir < 0)
        if self._limit is not None:
            rows = rows[: self._limit]
        return rows

    async def to_list(self, length: int | None = None):
        rows = self._materialize()
        if length is not None:
            rows = rows[:length]
        return rows

    def __aiter__(self):
        self._iter_rows = iter(self._materialize())
        return self

    async def __anext__(self):
        try:
            return next(self._iter_rows)
        except StopIteration:
            raise StopAsyncIteration


class SqliteCollection:
    def __init__(self, db_path: str, name: str):
        self._db_path = db_path
        self._name = name

    async def _ensure_table(self, conn):
        await conn.execute(f'CREATE TABLE IF NOT EXISTS "{self._name}" (id TEXT PRIMARY KEY, doc TEXT NOT NULL)')

    async def _all_docs(self) -> list[dict]:
        async with aiosqlite.connect(self._db_path) as conn:
            await self._ensure_table(conn)
            rows = await conn.execute_fetchall(f'SELECT doc FROM "{self._name}"')
            return [json.loads(r[0]) for r in rows]

    async def find_one(self, filt: dict = None, projection: dict = None):
        for doc in await self._all_docs():
            if _matches(doc, filt or {}):
                return _project(doc, projection)
        return None

    def find(self, filt: dict = None, projection: dict = None) -> SqliteCursor:
        # Synchronous call returning a cursor object is Motor's own API
        # shape (the query itself doesn't run until iterated/awaited) —
        # this shim mimics that by pre-loading matches eagerly instead of
        # lazily, which is fine given the tiny dataset sizes involved.
        import asyncio
        docs = asyncio.get_event_loop().run_until_complete(self._all_docs()) if not asyncio.get_event_loop().is_running() else None
        raise NotImplementedError  # placeholder replaced in Step 2b below

    async def insert_one(self, doc: dict):
        async with aiosqlite.connect(self._db_path) as conn:
            await self._ensure_table(conn)
            await conn.execute(
                f'INSERT INTO "{self._name}" (id, doc) VALUES (?, ?)',
                (doc["id"], json.dumps(doc, default=str)),
            )
            await conn.commit()
        return doc

    async def update_one(self, filt: dict, update: dict):
        patch = update.get("$set", {})
        async with aiosqlite.connect(self._db_path) as conn:
            await self._ensure_table(conn)
            rows = await conn.execute_fetchall(f'SELECT id, doc FROM "{self._name}"')
            for row_id, raw in rows:
                doc = json.loads(raw)
                if _matches(doc, filt):
                    doc.update(patch)
                    await conn.execute(f'UPDATE "{self._name}" SET doc = ? WHERE id = ?', (json.dumps(doc, default=str), row_id))
                    await conn.commit()
                    return
        return

    async def delete_one(self, filt: dict):
        async with aiosqlite.connect(self._db_path) as conn:
            await self._ensure_table(conn)
            rows = await conn.execute_fetchall(f'SELECT id, doc FROM "{self._name}"')
            for row_id, raw in rows:
                if _matches(json.loads(raw), filt):
                    await conn.execute(f'DELETE FROM "{self._name}" WHERE id = ?', (row_id,))
                    await conn.commit()
                    return

    async def delete_many(self, filt: dict):
        async with aiosqlite.connect(self._db_path) as conn:
            await self._ensure_table(conn)
            rows = await conn.execute_fetchall(f'SELECT id, doc FROM "{self._name}"')
            ids = [row_id for row_id, raw in rows if _matches(json.loads(raw), filt)]
            for row_id in ids:
                await conn.execute(f'DELETE FROM "{self._name}" WHERE id = ?', (row_id,))
            await conn.commit()

    async def count_documents(self, filt: dict) -> int:
        return sum(1 for doc in await self._all_docs() if _matches(doc, filt))

    def aggregate(self, pipeline: list) -> SqliteCursor:
        # Special-cased to the ONE pipeline shape this codebase actually
        # runs (backend/server.py's project_analytics: day-grouped view
        # counts). Any other shape is a bug, not a feature to silently
        # get wrong — fail loudly.
        try:
            match_stage = pipeline[0]["$match"]
            project_stage = pipeline[1]["$project"]
            group_stage = pipeline[2]["$group"]
            sort_stage = pipeline[3]["$sort"]
            limit_n = pipeline[4]["$limit"]
            day_field, day_len = project_stage["day"]["$substr"][0], project_stage["day"]["$substr"][2]
            assert day_field.startswith("$")
            src_field = day_field[1:]
            group_key = group_stage["_id"]
            assert group_key.startswith("$")
        except (KeyError, IndexError, AssertionError):
            raise NotImplementedError("SqliteCollection.aggregate only supports the day-grouping analytics pipeline shape")

        async def _run():
            docs = [d for d in await self._all_docs() if _matches(d, match_stage)]
            counts = Counter(str(d.get(src_field, ""))[:day_len] for d in docs)
            rows = [{"_id": k, "count": v} for k, v in counts.items()]
            rows.sort(key=lambda r: r["_id"], reverse=sort_stage.get("_id", 1) < 0)
            return rows[:limit_n]

        cur = SqliteCursor([])
        cur._pending = _run()
        return cur


class SqliteDatabase:
    def __init__(self, path: str):
        self._path = path
        self._collections = {}

    def __getitem__(self, name: str) -> SqliteCollection:
        return self.__getattr__(name)

    def __getattr__(self, name: str) -> SqliteCollection:
        if name not in self._collections:
            self._collections[name] = SqliteCollection(self._path, name)
        return self._collections[name]


class SqliteClient:
    def __init__(self, path: str):
        self._path = path

    def __getitem__(self, db_name: str) -> SqliteDatabase:
        return SqliteDatabase(self._path)
```

The `find()` method above has a placeholder `NotImplementedError` — **replace it** with a version that returns a cursor pre-populated by actually running the async lookup. Since `find()` itself is not `async def` in Motor's real API (only iterating/awaiting the cursor is), and this shim's `_all_docs()` is async, restructure `SqliteCursor` to lazily run the filter on first use instead of eagerly in `find()`:

Replace the `find` method with:
```python
    def find(self, filt: dict = None, projection: dict = None) -> "SqliteCursor":
        cur = SqliteCursor([])
        cur._collection = self
        cur._filt = filt or {}
        cur._projection = projection
        return cur
```

And replace `SqliteCursor` entirely with this version that resolves its rows lazily (on first `to_list`/iteration) instead of taking a pre-built list:

```python
class SqliteCursor:
    def __init__(self, rows: list[dict] | None = None):
        self._rows = rows
        self._collection = None
        self._filt = None
        self._projection = None
        self._pending = None  # set directly by aggregate() with an already-built coroutine
        self._sort_field = None
        self._sort_dir = 1
        self._limit = None

    def sort(self, field: str, direction: int = 1):
        self._sort_field = field
        self._sort_dir = direction
        return self

    def limit(self, n: int):
        self._limit = n
        return self

    async def _resolve(self) -> list[dict]:
        if self._rows is not None:
            rows = self._rows
        elif self._pending is not None:
            rows = await self._pending
        else:
            rows = [d for d in await self._collection._all_docs() if _matches(d, self._filt)]
            rows = [_project(d, self._projection) for d in rows]
        if self._sort_field is not None:
            rows = sorted(rows, key=lambda d: d.get(self._sort_field), reverse=self._sort_dir < 0)
        if self._limit is not None:
            rows = rows[: self._limit]
        return rows

    async def to_list(self, length: int | None = None):
        rows = await self._resolve()
        return rows[:length] if length is not None else rows

    def __aiter__(self):
        self._iter_task = self._resolve()
        self._iter_rows = None
        return self

    async def __anext__(self):
        if self._iter_rows is None:
            self._iter_rows = iter(await self._iter_task)
        try:
            return next(self._iter_rows)
        except StopIteration:
            raise StopAsyncIteration
```

And in `SqliteCollection.aggregate`, change `cur = SqliteCursor([]); cur._pending = _run(); return cur` to `cur = SqliteCursor(); cur._pending = _run(); return cur` (matching the new `rows=None` default).

- [ ] **Step 3: Wire activation into `backend/server.py`**

Replace lines 29-32:
```python
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
```
with:
```python
if os.environ.get("DB_BACKEND") == "sqlite":
    from sqlite_compat import SqliteClient
    client = SqliteClient(os.environ["SQLITE_PATH"])
    db = client[os.environ.get("DB_NAME", "webdojo")]
else:
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]
```

- [ ] **Step 4: Write tests**

Create `backend/tests/test_sqlite_compat.py`:
```python
"""Pure-function tests for the SQLite Motor-compat shim, against a
temp-file DB per test — no mocking, matches this codebase's existing
pytest style."""
import asyncio
import os
import tempfile

import pytest

from sqlite_compat import SqliteClient


@pytest.fixture
def db():
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    yield SqliteClient(path)["webdojo"]
    os.unlink(path)


@pytest.mark.asyncio
async def test_insert_and_find_one(db):
    await db.things.insert_one({"id": "a1", "name": "Alpha"})
    got = await db.things.find_one({"id": "a1"})
    assert got == {"id": "a1", "name": "Alpha"}


@pytest.mark.asyncio
async def test_find_one_no_match_returns_none(db):
    assert await db.things.find_one({"id": "missing"}) is None


@pytest.mark.asyncio
async def test_update_one_set(db):
    await db.things.insert_one({"id": "a1", "name": "Alpha", "count": 1})
    await db.things.update_one({"id": "a1"}, {"$set": {"count": 2}})
    got = await db.things.find_one({"id": "a1"})
    assert got["count"] == 2
    assert got["name"] == "Alpha"


@pytest.mark.asyncio
async def test_delete_one(db):
    await db.things.insert_one({"id": "a1", "name": "Alpha"})
    await db.things.delete_one({"id": "a1"})
    assert await db.things.find_one({"id": "a1"}) is None


@pytest.mark.asyncio
async def test_delete_many(db):
    await db.things.insert_one({"id": "a1", "grp": "x"})
    await db.things.insert_one({"id": "a2", "grp": "x"})
    await db.things.insert_one({"id": "a3", "grp": "y"})
    await db.things.delete_many({"grp": "x"})
    assert await db.things.count_documents({}) == 1


@pytest.mark.asyncio
async def test_count_documents(db):
    await db.things.insert_one({"id": "a1", "grp": "x"})
    await db.things.insert_one({"id": "a2", "grp": "x"})
    assert await db.things.count_documents({"grp": "x"}) == 2
    assert await db.things.count_documents({"grp": "y"}) == 0


@pytest.mark.asyncio
async def test_find_sort_limit_to_list(db):
    for i in range(5):
        await db.things.insert_one({"id": f"a{i}", "n": i})
    got = await db.things.find({}).sort("n", -1).limit(2).to_list()
    assert [d["n"] for d in got] == [4, 3]


@pytest.mark.asyncio
async def test_find_async_for(db):
    await db.things.insert_one({"id": "a1", "n": 1})
    await db.things.insert_one({"id": "a2", "n": 2})
    seen = []
    async for d in db.things.find({}).sort("n", 1):
        seen.append(d["n"])
    assert seen == [1, 2]


@pytest.mark.asyncio
async def test_projection_inclusion_mode(db):
    await db.things.insert_one({"id": "a1", "name": "Alpha", "secret": "shh"})
    got = await db.things.find_one({"id": "a1"}, {"_id": 0, "id": 1})
    assert got == {"id": "a1"}


@pytest.mark.asyncio
async def test_projection_exclusion_mode(db):
    await db.things.insert_one({"id": "a1", "name": "Alpha", "secret": "shh"})
    got = await db.things.find_one({"id": "a1"}, {"_id": 0, "secret": 0})
    assert got == {"id": "a1", "name": "Alpha"}


@pytest.mark.asyncio
async def test_datetime_roundtrip_via_default_str(db):
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    await db.things.insert_one({"id": "a1", "ts": now})
    got = await db.things.find_one({"id": "a1"})
    assert got["ts"] == str(now)


@pytest.mark.asyncio
async def test_aggregate_day_grouping(db):
    await db.analytics.insert_one({"id": "e1", "project_id": "p1", "event": "preview_view", "ts": "2026-08-01T10:00:00"})
    await db.analytics.insert_one({"id": "e2", "project_id": "p1", "event": "preview_view", "ts": "2026-08-01T11:00:00"})
    await db.analytics.insert_one({"id": "e3", "project_id": "p1", "event": "preview_view", "ts": "2026-08-02T10:00:00"})
    pipeline = [
        {"$match": {"project_id": "p1", "event": "preview_view"}},
        {"$project": {"day": {"$substr": ["$ts", 0, 10]}}},
        {"$group": {"_id": "$day", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
        {"$limit": 30},
    ]
    rows = [r async for r in db.analytics.aggregate(pipeline)]
    assert rows == [{"_id": "2026-08-01", "count": 2}, {"_id": "2026-08-02", "count": 1}]


@pytest.mark.asyncio
async def test_aggregate_unknown_shape_raises(db):
    with pytest.raises(NotImplementedError):
        list(db.analytics.aggregate([{"$match": {}}, {"$unwind": "$x"}]))
```

- [ ] **Step 5: Check `pytest-asyncio` is available, install if not**

Run: `cd backend && source .venv/bin/activate && python -c "import pytest_asyncio" || pip install pytest-asyncio`

If installed fresh, add `pytest-asyncio` to `backend/requirements.txt` and check `backend/pytest.ini` has `asyncio_mode = auto` (add it under `[pytest]` if missing, so the `@pytest.mark.asyncio`-decorated tests run without extra per-test config).

- [ ] **Step 6: Run tests**

Run: `cd backend && source .venv/bin/activate && python -m pytest tests/test_sqlite_compat.py -v`
Expected: all PASS.

Then run the full backend suite to confirm the web-deployment (Mongo) path is untouched: `python -m pytest -q` — expect the same pass/error counts as before this task (58 passed, 2 pre-existing unrelated collection errors in `backend_test.py`).

- [ ] **Step 7: Commit**

```bash
git add backend/sqlite_compat.py backend/server.py backend/requirements.txt backend/tests/test_sqlite_compat.py backend/pytest.ini
git commit -m "Add SQLite Motor-compat shim for the desktop build (additive, DB_BACKEND=sqlite gated)"
```

---

### Task 2: Tauri scaffold + PyInstaller sidecar + frontend wiring

**Files:**
- Create: `src-tauri/` (Tauri project scaffold), `backend/pyinstaller_entry.py`, `backend/webdojo-backend.spec`
- Modify: `frontend/package.json` (new `build:tauri` script)

**Interfaces:**
- Consumes: Task 1's `DB_BACKEND=sqlite`/`SQLITE_PATH` env vars.
- Produces: a `tauri build`-able project at `src-tauri/`, a PyInstaller-built sidecar binary at `backend/dist/webdojo-backend`.

- [ ] **Step 1: Install the Tauri + Rust toolchain (system-level, requires sudo)**

Run, in order:
```bash
sudo dnf install -y rust cargo webkit2gtk4.1-devel openssl-devel curl wget file gtk3-devel libappindicator-gtk3-devel librsvg2-devel
```
(Package names are Fedora's; if any single package name has changed on the running Fedora version, `dnf search <partial-name>` to find the current name rather than skipping it — Tauri's Linux build genuinely needs webkit2gtk + gtk3 + librsvg dev headers.)

Verify: `rustc --version && cargo --version`

- [ ] **Step 2: Create the PyInstaller entrypoint**

Create `backend/pyinstaller_entry.py`:
```python
"""PyInstaller entrypoint for the desktop sidecar build. Runs the same
FastAPI app as the normal `uvicorn server:app` dev command, but as a
frozen, dependency-free executable — no system Python required on the
end user's machine."""
import os

import uvicorn

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8787"))
    uvicorn.run("server:app", host="127.0.0.1", port=port, log_level="info")
```

- [ ] **Step 3: Install PyInstaller and build the sidecar binary**

```bash
cd backend && source .venv/bin/activate && pip install pyinstaller
pyinstaller --name webdojo-backend --onefile --distpath dist --workpath build/pyinstaller pyinstaller_entry.py
```

Verify the binary exists and runs: `DB_BACKEND=sqlite SQLITE_PATH=/tmp/webdojo-smoke.db PORT=8787 ./dist/webdojo-backend & sleep 2 && curl -s http://127.0.0.1:8787/api/ ; kill %1`

Expected: a JSON response from the root API endpoint (check `backend/server.py`'s `@api_router.get("/")` handler for the exact expected shape — just confirm it's valid JSON, not an error), confirming the frozen binary actually boots and serves against the SQLite backend.

- [ ] **Step 4: Add the frontend's Tauri-specific build script**

In `frontend/package.json`'s `"scripts"` block, add:
```json
"build:tauri": "REACT_APP_BACKEND_URL=http://127.0.0.1:8787/api craco build"
```
(Keep the existing `"build": "craco build"` script unchanged — this is additive.)

- [ ] **Step 5: Scaffold the Tauri project**

```bash
cd /home/januszeal/Downloads/web-dojo-main
npm create tauri-app@latest -- --manual --template vanilla --identifier com.webdojo.app --name "Web Dojo" src-tauri --yes 2>&1 || true
```
If `npm create tauri-app` produces a different directory layout than expected (its exact scaffolding output can vary by version), the goal is a `src-tauri/` directory containing `Cargo.toml`, `tauri.conf.json`, and `src/main.rs` — adjust paths in the following steps to match whatever it actually produces, and note any deviation in your report.

- [ ] **Step 6: Configure `tauri.conf.json`**

Edit `src-tauri/tauri.conf.json` to set:
```json
{
  "productName": "Web Dojo",
  "identifier": "com.webdojo.app",
  "build": {
    "frontendDist": "../frontend/build",
    "beforeBuildCommand": "cd ../frontend && npm run build:tauri"
  },
  "bundle": {
    "active": true,
    "targets": ["appimage", "deb", "rpm"],
    "externalBin": ["../backend/dist/webdojo-backend"]
  },
  "app": {
    "windows": [{ "title": "Web Dojo", "width": 1400, "height": 900 }]
  }
}
```
Merge these keys into whatever the scaffold already generated rather than replacing the whole file — preserve any scaffold-generated `plugins`/`security` sections, and only add/override the keys shown above. Read the actual generated file first to know its exact current shape (Tauri 2's exact config schema varies by version) before editing.

- [ ] **Step 7: Add sidecar spawn/kill to the Rust shell**

Add the `tauri-plugin-shell` dependency (`cargo add tauri-plugin-shell` from `src-tauri/`), and in `src-tauri/src/main.rs` (or wherever the scaffold put the `tauri::Builder` setup), wire sidecar spawn-on-launch and kill-on-exit. The exact code depends on the scaffolded Tauri version's plugin API — consult `tauri-plugin-shell`'s current sidecar example (its own README/docs, fetched via its crates.io page or `cargo doc` if network access is available; if not, use its well-established pattern: `app.shell().sidecar("webdojo-backend")?.env("DB_BACKEND", "sqlite").env("SQLITE_PATH", <app-data-dir>/webdojo.db).env("CORS_ORIGINS", "http://tauri.localhost").spawn()?` inside the `.setup()` closure, storing the child process handle in Tauri's managed state so it can be explicitly killed in a `RunEvent::ExitRequested` handler).

Use Tauri's `app_data_dir()` path API (via `tauri::Manager::path()`) for the `SQLITE_PATH` value rather than a hardcoded path, so it resolves to the correct OS-appropriate directory automatically.

- [ ] **Step 8: Commit**

```bash
git add src-tauri backend/pyinstaller_entry.py frontend/package.json
git commit -m "Scaffold Tauri shell + PyInstaller sidecar wiring for desktop build"
```

(Do not commit `backend/dist/`, `backend/build/`, or `src-tauri/target/` — add these to `.gitignore` if not already covered by existing patterns; check first.)

---

### Task 3: Build the Linux package and smoke-test it

**Files:** none new — this task builds and manually verifies the output of Tasks 1-2.

- [ ] **Step 1: Run the full Tauri build**

```bash
cd /home/januszeal/Downloads/web-dojo-main/src-tauri && cargo tauri build
```
(Or `npx tauri build` from the repo root if the scaffold set it up as an npm script — use whichever the scaffold actually configured.)

Expected: a `.AppImage` (and `.deb`/`.rpm` if those targets succeeded) under `src-tauri/target/release/bundle/`.

- [ ] **Step 2: Launch the built package and smoke-test it**

Run the produced `.AppImage` directly (`chmod +x` it first if needed) or install the `.deb` and launch it. Verify, in order:
1. The app window opens and shows the Web Dojo builder UI (not a blank/error page).
2. Create a new project, add at least one block via drag-or-double-click.
3. Wait ~3s and confirm the autosave indicator (added earlier this session) shows "Saved", not stuck on "Saving…" or "Save failed".
4. Close and relaunch the app; confirm the project and its block are still there (proves the SQLite file actually persisted and was read back correctly).
5. Open Code mode, confirm the HTML/CSS/JS/Head tabs and live preview render.
6. Trigger an export (Standalone HTML or ZIP) and confirm it downloads/produces a file without error.

Report exactly which of these 6 checks passed/failed, with any error output (check `~/.local/share/com.webdojo.app/` or wherever the sidecar's stdout/stderr is captured — Tauri's shell plugin can pipe sidecar output to the app's own log; if not configured, note that as a gap rather than skip the check).

- [ ] **Step 3: If any check fails, fix and re-verify before proceeding**

This is the one place in this plan where "fix it yourself" is appropriate rather than a formal SDD fix-loop — this task IS the verification step, so iterate directly here (adjust `tauri.conf.json`, the sidecar spawn code, or the SQLite shim as needed) until all 6 checks pass. Record what was wrong and what you changed in your report.

- [ ] **Step 4: Commit any fixes made during this task**

```bash
git add -A
git commit -m "Fix issues found during Tauri desktop smoke test"
```
(Skip this commit if Step 1-2 passed clean with no fixes needed.)

---

### Task 4: GitHub Actions CI for Windows/Mac builds

**Files:**
- Create: `.github/workflows/tauri-build.yml`

- [ ] **Step 1: Write the workflow**

Create `.github/workflows/tauri-build.yml`:
```yaml
name: Tauri Desktop Build

on:
  push:
    tags: ["v*"]
  workflow_dispatch: {}

jobs:
  build:
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4

      - name: Install Linux system deps
        if: matrix.os == 'ubuntu-latest'
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf build-essential curl wget file

      - uses: actions-rs/toolchain@v1
        with:
          toolchain: stable

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Install backend deps and build sidecar
        run: |
          cd backend
          pip install -r requirements.txt pyinstaller
          pyinstaller --name webdojo-backend --onefile --distpath dist --workpath build/pyinstaller pyinstaller_entry.py

      - name: Install frontend deps
        run: cd frontend && npm install --legacy-peer-deps

      - uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          projectPath: src-tauri
          tagName: ${{ github.ref_name }}
          releaseName: "Web Dojo ${{ github.ref_name }}"
          releaseDraft: true
          prerelease: false
```

Note: `pyinstaller`'s output binary name differs by OS (`webdojo-backend.exe` on Windows) — `tauri.conf.json`'s `externalBin` path needs Tauri's target-triple suffix convention (e.g. `webdojo-backend-x86_64-pc-windows-msvc.exe`) to resolve per-platform at bundle time; if the Linux-only build from Task 2/3 didn't already need this (single-platform, no suffix required), add a small rename/copy step here per Tauri's sidecar-naming docs so the three platforms in this matrix each produce a correctly-named binary. Note this as a known gap in your report if you can't verify it without actually running the workflow (this plan already establishes CI can't be run/verified from this sandbox).

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/tauri-build.yml
git commit -m "Add GitHub Actions workflow for Windows/Mac Tauri builds"
```

---

## Manual follow-up (not doable from this sandbox)

Push this branch to GitHub and either push a `v*` tag or manually trigger the `Tauri Desktop Build` workflow (Actions tab → "Tauri Desktop Build" → "Run workflow") to produce and verify the Windows/Mac installers.
