"""Self-contained regression tests for the second audit-fix round.
Same TestClient pattern as test_security_fixes.py (round 1) — no live
MongoDB needed; endpoints that touch `db` get it mocked per-test."""
import os

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "webdojo_test")

import pytest
from starlette.testclient import TestClient

import server


@pytest.fixture(scope="module")
def client():
    return TestClient(server.app)


class TestSubmissionsScoping:
    def test_get_without_filter_400(self, client):
        r = client.get("/api/submissions")
        assert r.status_code == 400

    def test_get_with_project_id_200(self, client, monkeypatch):
        class FakeCursor:
            def sort(self, *a, **kw):
                return self

            async def to_list(self, *a, **kw):
                return []

        class FakeCollection:
            def find(self, *a, **kw):
                return FakeCursor()

        monkeypatch.setattr(server.db, "submissions", FakeCollection())
        r = client.get("/api/submissions", params={"project_id": "abc"})
        assert r.status_code == 200
        assert r.json() == []

    def test_get_with_form_name_200(self, client, monkeypatch):
        class FakeCursor:
            def sort(self, *a, **kw):
                return self

            async def to_list(self, *a, **kw):
                return []

        class FakeCollection:
            def find(self, *a, **kw):
                return FakeCursor()

        monkeypatch.setattr(server.db, "submissions", FakeCollection())
        r = client.get("/api/submissions", params={"form_name": "Contact"})
        assert r.status_code == 200

    def test_delete_bulk_without_filter_400(self, client):
        r = client.delete("/api/submissions")
        assert r.status_code == 400

    def test_delete_bulk_with_project_id_200(self, client, monkeypatch):
        class FakeResult:
            deleted_count = 0

        class FakeCollection:
            async def delete_many(self, *a, **kw):
                return FakeResult()

        monkeypatch.setattr(server.db, "submissions", FakeCollection())
        r = client.delete("/api/submissions", params={"project_id": "abc"})
        assert r.status_code == 200
