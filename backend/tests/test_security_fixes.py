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
