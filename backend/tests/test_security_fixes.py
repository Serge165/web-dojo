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


class TestStripeNotConfigured:
    def test_payment_link_503_when_unconfigured(self, client):
        r = client.post("/api/commerce/payment-link", json={
            "name": "Test Product", "amount": 9.99, "currency": "usd", "quantity": 1,
        })
        assert r.status_code == 503

    def test_checkout_session_503_when_unconfigured(self, client):
        r = client.post("/api/commerce/checkout-session", json={
            "items": [{"name": "Test Item", "amount": 9.99, "currency": "usd", "quantity": 1}],
        })
        assert r.status_code == 503

    def test_config_reports_disabled(self, client):
        r = client.get("/api/commerce/config")
        assert r.status_code == 200
        body = r.json()
        assert body["stripe_enabled"] is False
        assert body["publishable_key"] == ""
