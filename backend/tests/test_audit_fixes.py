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


class TestZeroDecimalCurrency:
    def test_usd_multiplies_by_100(self):
        assert server._to_unit_amount(9.99, "usd") == 999

    def test_jpy_no_multiplication(self):
        assert server._to_unit_amount(500, "jpy") == 500

    def test_jpy_case_insensitive(self):
        assert server._to_unit_amount(500, "JPY") == 500

    def test_jpy_rounds_to_whole_yen(self):
        assert server._to_unit_amount(500.7, "jpy") == 501


class TestPublishFilenameTraversal:
    def _mock_project(self, monkeypatch):
        class FakeCollection:
            async def find_one(self, *a, **kw):
                return {"id": "anyid", "name": "Test", "elements": [], "fonts": [], "head_html": "", "canvas_bg": "#fff"}

        monkeypatch.setattr(server.db, "projects", FakeCollection())

    def test_rejects_path_traversal_html_filename(self, client, monkeypatch):
        self._mock_project(monkeypatch)
        r = client.post("/api/projects/anyid/publish", json={
            "host": "example.com", "username": "u", "password": "p",
            "html_filename": "../../etc/passwd",
        })
        assert r.status_code == 400

    def test_rejects_backslash_css_filename(self, client, monkeypatch):
        self._mock_project(monkeypatch)
        r = client.post("/api/projects/anyid/publish", json={
            "host": "example.com", "username": "u", "password": "p",
            "css_filename": "..\\..\\windows\\win.ini",
        })
        assert r.status_code == 400

    def test_rejects_leading_dot_filename(self, client, monkeypatch):
        self._mock_project(monkeypatch)
        r = client.post("/api/projects/anyid/publish", json={
            "host": "example.com", "username": "u", "password": "p",
            "html_filename": ".htaccess",
        })
        assert r.status_code == 400

    def test_normal_filenames_pass_validation(self, client, monkeypatch):
        # Port 1 on loopback has nothing listening, so this fails fast with
        # a connection error once past filename validation — confirming it
        # got past the 400 check (a 502 upload failure, not 400). Same
        # pattern as the existing backend_test.py publish tests.
        self._mock_project(monkeypatch)
        r = client.post("/api/projects/anyid/publish", json={
            "host": "127.0.0.1", "port": 1, "username": "u", "password": "p",
            "html_filename": "index.html", "css_filename": "styles.css",
        })
        assert r.status_code != 400


class TestSubmissionBodySizeLimit:
    def test_oversized_submission_rejected(self, client):
        huge_value = "x" * 1_100_000
        r = client.post(
            "/api/submissions",
            json={"message": huge_value},
            headers={"Accept": "application/json"},
        )
        assert r.status_code == 413

    def test_normal_sized_submission_not_rejected(self, client, monkeypatch):
        class FakeCollection:
            async def insert_one(self, *a, **kw):
                return None

        monkeypatch.setattr(server.db, "submissions", FakeCollection())
        r = client.post(
            "/api/submissions",
            json={"name": "Jane", "message": "hello"},
            headers={"Accept": "application/json"},
        )
        assert r.status_code == 200
        assert r.json()["ok"] is True
