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
    def _mock_project(self, monkeypatch, project_id="abc"):
        """Mock server.db.projects so _require_dashboard_token can find the
        project and verify a token.  Returns the password hash so the test
        can mint a matching token with server._issue_dashboard_token."""
        pw_hash = server._hash_password("test-pw-12345")
        pw_hash = pw_hash  # 6+ chars, satisfies the 6-char minimum guard

        class _FakeProjects:
            async def find_one(self, filt, projection=None):
                if filt.get("id") == project_id:
                    return {"id": project_id, "dashboard_password_hash": pw_hash}
                return None

        monkeypatch.setattr(server.db, "projects", _FakeProjects())
        return pw_hash

    def test_get_without_filter_400(self, client):
        r = client.get("/api/submissions")
        assert r.status_code == 400

    def test_get_without_token_401(self, client, monkeypatch):
        self._mock_project(monkeypatch)
        r = client.get("/api/submissions", params={"project_id": "abc"})
        assert r.status_code == 401

    def test_get_with_invalid_token_401(self, client, monkeypatch):
        self._mock_project(monkeypatch)
        r = client.get("/api/submissions", params={"project_id": "abc"}, headers={"X-Dashboard-Token": "garbage"})
        assert r.status_code == 401

    def test_get_with_project_id_200(self, client, monkeypatch):
        pw_hash = self._mock_project(monkeypatch, "abc")
        token = server._issue_dashboard_token("abc", pw_hash)

        class FakeCursor:
            def sort(self, *a, **kw):
                return self
            async def to_list(self, *a, **kw):
                return []

        class FakeCollection:
            def find(self, *a, **kw):
                return FakeCursor()

        monkeypatch.setattr(server.db, "submissions", FakeCollection())
        r = client.get("/api/submissions", params={"project_id": "abc"}, headers={"X-Dashboard-Token": token})
        assert r.status_code == 200
        assert r.json() == []

    def test_get_with_form_name_and_project_id_200(self, client, monkeypatch):
        """form_name is now a secondary filter — project_id is required and
        must be token-authenticated first, as in test_get_with_project_id_200."""
        pw_hash = self._mock_project(monkeypatch, "abc")
        token = server._issue_dashboard_token("abc", pw_hash)

        class FakeCursor:
            def sort(self, *a, **kw):
                return self
            async def to_list(self, *a, **kw):
                return []

        class FakeCollection:
            def find(self, *a, **kw):
                return FakeCursor()

        monkeypatch.setattr(server.db, "submissions", FakeCollection())
        r = client.get(
            "/api/submissions",
            params={"project_id": "abc", "form_name": "Contact"},
            headers={"X-Dashboard-Token": token},
        )
        assert r.status_code == 200

    def test_delete_bulk_without_filter_400(self, client):
        r = client.delete("/api/submissions")
        assert r.status_code == 400

    def test_delete_bulk_without_token_401(self, client, monkeypatch):
        self._mock_project(monkeypatch, "abc")
        r = client.delete("/api/submissions", params={"project_id": "abc"})
        assert r.status_code == 401

    def test_delete_bulk_with_project_id_200(self, client, monkeypatch):
        pw_hash = self._mock_project(monkeypatch, "abc")
        token = server._issue_dashboard_token("abc", pw_hash)

        class FakeResult:
            deleted_count = 0

        class FakeCollection:
            async def delete_many(self, *a, **kw):
                return FakeResult()

        monkeypatch.setattr(server.db, "submissions", FakeCollection())
        r = client.delete("/api/submissions", params={"project_id": "abc"}, headers={"X-Dashboard-Token": token})
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

    def test_oversized_multipart_submission_rejected(self, client):
        huge_value = "x" * 1_100_000
        r = client.post(
            "/api/submissions",
            files={"message": (None, huge_value)},
            headers={"Accept": "application/json"},
        )
        assert r.status_code == 413

    def test_normal_multipart_submission_not_rejected(self, client, monkeypatch):
        class FakeCollection:
            async def insert_one(self, *a, **kw):
                return None

        monkeypatch.setattr(server.db, "submissions", FakeCollection())
        r = client.post(
            "/api/submissions",
            files={"name": (None, "Jane"), "message": (None, "hello")},
            headers={"Accept": "application/json"},
        )
        assert r.status_code == 200
        assert r.json()["ok"] is True


class TestClientLogs:
    """Builder-telemetry endpoint: the frontend diagnostics layer batches
    client-side errors/API timings here."""

    def test_post_and_list_roundtrip(self, client):
        r = client.post("/api/client-logs", json={"events": [
            {"kind": "error", "message": "boom", "stack": "Error: boom\n at x"},
            {"kind": "api_ok", "url": "/api/projects", "status": 200, "ms": 42},
        ]})
        assert r.status_code == 200
        assert r.json()["stored"] == 2
        items = client.get("/api/client-logs").json()
        assert len(items) == 2
        kinds = {i["kind"] for i in items}
        assert {"error", "api_ok"} <= kinds

    def test_rejects_missing_events(self, client):
        assert client.post("/api/client-logs", json={}).status_code == 400
        assert client.post("/api/client-logs", json={"events": []}).status_code == 400
        assert client.post("/api/client-logs", json={"events": "nope"}).status_code == 400

    def test_non_dict_events_skipped_and_batch_capped(self, client, monkeypatch):
        monkeypatch.setattr(server, "_MAX_CLIENT_LOG_BATCH", 3)
        events = [{"kind": f"e{i}"} for i in range(10)] + ["junk", 42, None]
        r = client.post("/api/client-logs", json={"events": events})
        assert r.status_code == 200
        assert r.json()["stored"] == 3  # capped before junk entries are even considered

    def test_oversized_stack_truncated(self, client, monkeypatch):
        monkeypatch.setattr(server, "_MAX_CLIENT_LOG_EVENT_BYTES", 50)
        r = client.post("/api/client-logs", json={"events": [
            {"kind": "error", "message": "x" * 500},
        ]})
        assert r.status_code == 200
        item = client.get("/api/client-logs").json()[0]
        assert len(item["message"]) == 50


class TestProjectIdInjection:
    def test_project_to_html_injects_project_id(self):
        doc = {"id": "proj-123", "name": "Test", "elements": [], "fonts": [], "pages": []}
        html = server._project_to_html(doc)
        # Phase 5: the id still reaches window.__WD_PROJECT_ID, but via a
        # body-top bootstrap reading <body data-wd-project> — never from a
        # <script> tag inside <head>.
        assert '<body data-wd-project="proj-123">' in html
        assert (
            "<script>window.__WD_PROJECT_ID=window.__WD_PROJECT_ID||"
            "document.body.getAttribute('data-wd-project')||'';</script>"
        ) in html
        assert html.index("window.__WD_PROJECT_ID") > html.index("</head>")

    def test_build_project_bundle_injects_project_id(self):
        doc = {"id": "proj-456", "name": "Test", "elements": [], "fonts": []}
        html, _css = server._build_project_bundle(doc, "index.html", "styles.css")
        assert '<body data-wd-project="proj-456"' in html
        # The bootstrap script must sit after </head> — head is boilerplate.
        assert html.index("window.__WD_PROJECT_ID") > html.index("</head>")
