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
