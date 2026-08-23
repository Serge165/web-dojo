"""Self-contained regression tests for the security fixes audit.

Unlike backend_test.py (which hits a live backend over HTTP and needs a
running MongoDB), these use FastAPI's in-process TestClient. They only
exercise routes that never touch `db`, so no real MongoDB is required.
"""
import os

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "webdojo_test")

import pytest
from starlette.testclient import TestClient
import stat
from cryptography.fernet import Fernet

import server


@pytest.fixture(scope="module")
def client():
    return TestClient(server.app)


def test_harness_smoke(client):
    r = client.get("/api/")
    assert r.status_code == 200
    assert r.json() == {"message": "WYSIWYG Builder API"}


class TestImportUrlSSRF:
    def test_blocks_loopback(self, client):
        r = client.post("/api/import/url", json={"url": "http://127.0.0.1/secret"})
        assert r.status_code == 400

    def test_blocks_localhost_hostname(self, client):
        r = client.post("/api/import/url", json={"url": "http://localhost/secret"})
        assert r.status_code == 400

    def test_blocks_link_local_metadata_ip(self, client):
        # Cloud metadata endpoint address (AWS/GCP/Azure convention).
        r = client.post("/api/import/url", json={"url": "http://169.254.169.254/latest/meta-data/"})
        assert r.status_code == 400

    def test_blocks_private_range(self, client):
        r = client.post("/api/import/url", json={"url": "http://10.0.0.5/"})
        assert r.status_code == 400

    def test_still_rejects_non_http_scheme(self, client):
        r = client.post("/api/import/url", json={"url": "notaurl"})
        assert r.status_code == 400

    def test_still_rejects_empty(self, client):
        r = client.post("/api/import/url", json={"url": ""})
        assert r.status_code == 400


class TestImportUrlRedirectRevalidation:
    def test_redirect_to_private_ip_is_blocked(self, client, monkeypatch):
        class FakeResponse:
            def __init__(self, status_code, headers=None, text=""):
                self.status_code = status_code
                self.headers = headers or {}
                self.text = text

        class FakeAsyncClient:
            def __init__(self, *a, **kw):
                pass

            async def __aenter__(self):
                return self

            async def __aexit__(self, *a):
                return False

            async def get(self, url, **kw):
                return FakeResponse(302, headers={"location": "http://127.0.0.1/internal"})

        monkeypatch.setattr(server.httpx, "AsyncClient", FakeAsyncClient)
        r = client.post("/api/import/url", json={"url": "https://example.com/redirect-me"})
        assert r.status_code == 400

    def test_relative_redirect_resolves_against_real_hostname(self, client, monkeypatch):
        captured_hosts = []

        class FakeResponse:
            def __init__(self, status_code, headers=None, text=""):
                self.status_code = status_code
                self.headers = headers or {}
                self.text = text

        call_count = {"n": 0}

        class FakeAsyncClient:
            def __init__(self, *a, **kw):
                pass

            async def __aenter__(self):
                return self

            async def __aexit__(self, *a):
                return False

            async def get(self, url, headers=None, **kw):
                captured_hosts.append(headers.get("Host") if headers else None)
                call_count["n"] += 1
                if call_count["n"] == 1:
                    # Relative redirect — must resolve against the real hostname.
                    return FakeResponse(302, headers={"location": "/next-page"})
                return FakeResponse(200, text="<html>ok</html>")

        monkeypatch.setattr(server.httpx, "AsyncClient", FakeAsyncClient)
        r = client.post("/api/import/url", json={"url": "https://example.com/start"})
        assert r.status_code == 200
        assert captured_hosts == ["example.com", "example.com"]


class TestImportUrlStylesheetInlining:
    def test_linked_stylesheet_is_fetched_and_inlined_as_a_forge_marked_style_block(self, client, monkeypatch):
        class FakeResponse:
            def __init__(self, status_code, headers=None, text=""):
                self.status_code = status_code
                self.headers = headers or {}
                self.text = text

        requested = []

        class FakeAsyncClient:
            def __init__(self, *a, **kw):
                pass

            async def __aenter__(self):
                return self

            async def __aexit__(self, *a):
                return False

            async def get(self, url, headers=None, **kw):
                requested.append(headers.get("Host") if headers else None)
                if len(requested) == 1:
                    return FakeResponse(200, text='<html><head><link rel="stylesheet" href="/styles.css"></head><body>hi</body></html>')
                return FakeResponse(200, text="body{color:red}")

        monkeypatch.setattr(server.httpx, "AsyncClient", FakeAsyncClient)
        r = client.post("/api/import/url", json={"url": "https://example.com/page"})
        assert r.status_code == 200
        html = r.json()["html"]
        assert '<style data-forge-imported-css>' in html
        assert "body{color:red}" in html
        # the stylesheet fetch went through the same SSRF-safe path (Host header set)
        assert requested == ["example.com", "example.com"]

    def test_a_page_with_no_stylesheets_is_returned_unchanged(self, client, monkeypatch):
        class FakeResponse:
            def __init__(self, status_code, headers=None, text=""):
                self.status_code = status_code
                self.headers = headers or {}
                self.text = text

        class FakeAsyncClient:
            def __init__(self, *a, **kw):
                pass

            async def __aenter__(self):
                return self

            async def __aexit__(self, *a):
                return False

            async def get(self, url, headers=None, **kw):
                return FakeResponse(200, text="<html><head></head><body>hi</body></html>")

        monkeypatch.setattr(server.httpx, "AsyncClient", FakeAsyncClient)
        r = client.post("/api/import/url", json={"url": "https://example.com/page"})
        assert r.status_code == 200
        assert "data-forge-imported-css" not in r.json()["html"]


class TestCORS:
    def test_disallowed_origin_gets_no_cors_header(self, client):
        r = client.get("/api/", headers={"Origin": "http://evil.example"})
        assert r.status_code == 200  # request still succeeds; browser enforces CORS client-side
        assert "access-control-allow-origin" not in {k.lower() for k in r.headers.keys()}

    def test_default_localhost_origin_is_allowed(self, client):
        r = client.get("/api/", headers={"Origin": "http://localhost:3000"})
        assert r.headers.get("access-control-allow-origin") == "http://localhost:3000"

    def test_credentials_not_allowed(self, client):
        r = client.get("/api/", headers={"Origin": "http://localhost:3000"})
        assert "access-control-allow-credentials" not in {k.lower() for k in r.headers.keys()}


class TestPublicCORSOverride:
    def test_submissions_options_allows_any_origin(self, client):
        r = client.options("/api/submissions", headers={
            "Origin": "https://some-random-published-site.example",
            "Access-Control-Request-Method": "POST",
        })
        assert r.headers.get("access-control-allow-origin") == "*"

    def test_checkout_session_options_allows_any_origin(self, client):
        r = client.options("/api/commerce/checkout-session", headers={
            "Origin": "https://another-published-site.example",
            "Access-Control-Request-Method": "POST",
        })
        assert r.headers.get("access-control-allow-origin") == "*"

    def test_checkout_session_post_response_carries_wildcard_origin(self, client):
        # Stripe isn't configured in this sandbox, so this 503s (per Task 4's
        # fix) before touching the db — but the CORS header must still be set.
        r = client.post("/api/commerce/checkout-session", json={
            "items": [{"name": "Test", "amount": 9.99, "currency": "usd", "quantity": 1}],
            "project_id": "proj-cors-test",
        }, headers={"Origin": "https://another-published-site.example"})
        assert r.status_code == 503
        assert r.headers.get("access-control-allow-origin") == "*"

    def test_other_endpoints_unaffected_by_public_override(self, client):
        r = client.get("/api/", headers={"Origin": "https://evil.example"})
        assert "access-control-allow-origin" not in {k.lower() for k in r.headers.keys()}

    def test_get_submissions_not_exposed_to_foreign_origin(self, client, monkeypatch):
        class FakeCursor:
            def sort(self, *a, **kw):
                return self

            async def to_list(self, *a, **kw):
                return []

        class FakeCollection:
            def find(self, *a, **kw):
                return FakeCursor()

        monkeypatch.setattr(server.db, "submissions", FakeCollection())
        # Round 2 (task 1) requires a project_id/form_name filter on this
        # endpoint; supply one so this test still reaches a 200 and keeps
        # verifying its actual concern — no CORS header leak to a foreign origin.
        r = client.get("/api/submissions", params={"project_id": "abc"}, headers={"Origin": "https://evil.example"})
        assert r.status_code == 200
        assert "access-control-allow-origin" not in {k.lower() for k in r.headers.keys()}


class TestStripeNotConfigured:
    def test_payment_link_503_when_unconfigured(self, client):
        r = client.post("/api/commerce/payment-link", json={
            "name": "Test Product", "amount": 9.99, "currency": "usd", "quantity": 1,
        })
        assert r.status_code == 503

    def test_checkout_session_503_when_unconfigured(self, client):
        r = client.post("/api/commerce/checkout-session", json={
            "items": [{"name": "Test Item", "amount": 9.99, "currency": "usd", "quantity": 1}],
            "project_id": "proj-unconfigured-test",
        })
        assert r.status_code == 503

    def test_config_reports_disabled(self, client):
        r = client.get("/api/commerce/config")
        assert r.status_code == 200
        body = r.json()
        assert body["stripe_enabled"] is False
        assert body["publishable_key"] == ""


class TestFernetKeyFilePermissions:
    def test_key_file_created_owner_only(self, tmp_path, monkeypatch):
        monkeypatch.delenv("WEBDOJO_SECRET_KEY", raising=False)
        key_path = tmp_path / "test.preset_key"
        monkeypatch.setattr(server, "_KEY_PATH", key_path)

        server._get_fernet()

        assert key_path.exists()
        mode = stat.S_IMODE(key_path.stat().st_mode)
        assert mode == 0o600

    def test_existing_key_file_permissions_repaired(self, tmp_path, monkeypatch):
        monkeypatch.delenv("WEBDOJO_SECRET_KEY", raising=False)
        key_path = tmp_path / "existing.preset_key"
        key_path.write_text(Fernet.generate_key().decode())
        os.chmod(key_path, 0o644)  # simulate a pre-fix, loosely-permissioned file
        monkeypatch.setattr(server, "_KEY_PATH", key_path)

        server._get_fernet()

        mode = stat.S_IMODE(key_path.stat().st_mode)
        assert mode == 0o600
