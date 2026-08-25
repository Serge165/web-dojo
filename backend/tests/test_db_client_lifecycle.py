"""Regression tests for the process-global DB client lifecycle fix (Task:
"backend test suite fails when run all at once due to a worker inheritance
issue with Motor event loops").

server.py holds `client`/`db` as process-global singletons. Under pytest-xdist
(`-n 2 --dist loadscope`) several test modules share one worker process; a
context-managed TestClient runs the app lifespan, and shutdown closes that
shared client. Without recovery the NEXT module on the same worker would reuse
the closed, loop-bound client and fail ("Cannot use AsyncIOMotorClient after
close()").

These tests exercise the self-healing machinery directly (no live MongoDB):
  - `_ensure_live_client()` rebuilds the pair exactly when a prior shutdown
    flagged the client closed;
  - it leaves an untouched / explicitly-assigned client alone (so test files
    like test_commerce_orders.py's SQLite override are never clobbered);
  - the FastAPI shutdown handler closes + marks the shared client closed.
"""
import os

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "webdojo_test")

import server


class _FakeClient:
    instances = []

    def __init__(self):
        self.closed = False
        self.__class__.instances.append(self)

    def close(self):
        self.closed = True

    def __getitem__(self, name):
        return _FakeDb(name)


class _FakeDb:
    def __init__(self, name):
        self.name = name
        self.tags = set()

    def __str__(self):  # pragma: no cover - debugging aid
        return f"FakeDb({self.name})"


def _install_fakes(monkeypatch):
    _FakeClient.instances.clear()
    fake_client = _FakeClient()
    fake_db = _FakeDb("webdojo")
    # Match how the real suite overrides the singletons (e.g.
    # test_commerce_orders.py does `server.db = ...`): both globals must be
    # the fake objects so shutdown/ensure operate on them, not the real
    # imported Motor client.
    monkeypatch.setattr(server, "client", fake_client)
    monkeypatch.setattr(server, "db", fake_db)
    monkeypatch.setattr(server, "_build_client",
                        lambda: (_FakeClient(), _FakeDb("webdojo")))
    return _FakeClient


def test_build_client_returns_pair(monkeypatch):
    _install_fakes(monkeypatch)
    c, db = server._build_client()
    assert isinstance(c, _FakeClient)
    assert isinstance(db, _FakeDb)


def test_ensure_live_client_rebuilds_after_close(monkeypatch):
    import asyncio
    _install_fakes(monkeypatch)
    # Simulate module A's lifespan shutdown closing the shared singleton.
    asyncio.run(server.shutdown_db_client())
    first = server.client
    assert first.closed is True

    # Module B starts its own lifespan -> startup calls ensure_live_client().
    server._ensure_live_client()
    second = server.client
    assert second is not first
    assert second.closed is False
    assert server._db_client_is_closed is False


def test_ensure_live_client_is_noop_when_not_closed(monkeypatch):
    _install_fakes(monkeypatch)
    server._db_client_is_closed = False
    before = server.client
    server._ensure_live_client()
    assert server.client is before  # untouched client is preserved


def test_unclosed_and_explicitly_assigned_db_not_clobbered(monkeypatch):
    _install_fakes(monkeypatch)
    server._db_client_is_closed = False
    # A test file explicitly swaps the db (like test_commerce_orders.py).
    server.db = _FakeDb("explicit-sqlite")
    server._ensure_live_client()
    # ensure_live_client must not rebuild over an explicit, live assignment.
    assert server.db.name == "explicit-sqlite"


def test_shutdown_handler_closes_and_marks_closed(monkeypatch):
    import asyncio
    _install_fakes(monkeypatch)
    # Call the actual shutdown handler (declared async) to prove it closes.
    asyncio.run(server.shutdown_db_client())
    assert server.client.closed is True
    assert server._db_client_is_closed is True