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
