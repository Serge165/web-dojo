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

    def find(self, filt: dict = None, projection: dict = None) -> "SqliteCursor":
        cur = SqliteCursor()
        cur._collection = self
        cur._filt = filt or {}
        cur._projection = projection
        return cur

    async def insert_one(self, doc: dict):
        async with aiosqlite.connect(self._db_path) as conn:
            await self._ensure_table(conn)
            await conn.execute(
                f'INSERT INTO "{self._name}" (id, doc) VALUES (?, ?)',
                (doc["id"], json.dumps(doc, default=str)),
            )
            await conn.commit()
        return doc

    async def update_one(self, filt: dict, update: dict, upsert: bool = False):
        patch = update.get("$set", {})
        matched = 0
        async with aiosqlite.connect(self._db_path) as conn:
            await self._ensure_table(conn)
            rows = await conn.execute_fetchall(f'SELECT id, doc FROM "{self._name}"')
            for row_id, raw in rows:
                doc = json.loads(raw)
                if _matches(doc, filt):
                    matched = 1
                    doc.update(patch)
                    await conn.execute(f'UPDATE "{self._name}" SET doc = ? WHERE id = ?', (json.dumps(doc, default=str), row_id))
                    await conn.commit()
                    break
            if upsert and not matched:
                # No match: insert a new doc from the filter's equality
                # fields plus the $set patch, mirroring Mongo's upsert
                # behavior. The patch normally already carries every
                # field the filter matched on (e.g. update_one({"id": x},
                # {"$set": {"id": x, ...}}, upsert=True)), so this is
                # mostly patch-wins-on-conflict for the general case.
                new_doc = {**filt, **patch}
                if "id" not in new_doc:
                    raise ValueError("sqlite_compat upsert requires an 'id' field to key the new row")
                await conn.execute(
                    f'INSERT INTO "{self._name}" (id, doc) VALUES (?, ?)',
                    (new_doc["id"], json.dumps(new_doc, default=str)),
                )
                await conn.commit()
                matched = 1  # upsert counts as a match, mirroring Mongo
        # Mongo-shaped UpdateResult so callers can inspect matched_count /
        # modified_count regardless of which backend is live.
        class _UpdateResult:
            pass
        result = _UpdateResult()
        result.matched_count = matched
        result.modified_count = matched
        return result

    async def delete_one(self, filt: dict):
        deleted = 0
        async with aiosqlite.connect(self._db_path) as conn:
            await self._ensure_table(conn)
            rows = await conn.execute_fetchall(f'SELECT id, doc FROM "{self._name}"')
            for row_id, raw in rows:
                if _matches(json.loads(raw), filt):
                    await conn.execute(f'DELETE FROM "{self._name}" WHERE id = ?', (row_id,))
                    await conn.commit()
                    deleted = 1
                    break
        # Mongo-shaped result: callers rely on .deleted_count (Mongo returns
        # DeleteResult; bare None here used to crash them under this backend).
        class _DeleteResult:
            pass
        result = _DeleteResult()
        result.deleted_count = deleted
        return result

    async def delete_many(self, filt: dict):
        deleted = 0
        async with aiosqlite.connect(self._db_path) as conn:
            await self._ensure_table(conn)
            rows = await conn.execute_fetchall(f'SELECT id, doc FROM "{self._name}"')
            ids = [row_id for row_id, raw in rows if _matches(json.loads(raw), filt)]
            for row_id in ids:
                await conn.execute(f'DELETE FROM "{self._name}" WHERE id = ?', (row_id,))
            await conn.commit()
            deleted = len(ids)
        class _DeleteResult:
            pass
        result = _DeleteResult()
        result.deleted_count = deleted
        return result

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

        cur = SqliteCursor()
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

    def close(self):
        # Motor's AsyncIOMotorClient.close() tears down its connection
        # pool; this shim opens/closes a connection per call (see module
        # docstring), so there's nothing persistent to release here.
        # Only exists so server.py's shutdown handler can call it
        # unconditionally regardless of which client backend is active.
        pass
