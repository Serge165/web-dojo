"""Tests for the Timeline and Bento Zenero content types (models/models/zenero.py).
Uses a real MongoDB (MONGO_URL/DB_NAME env vars, defaulting to a local test DB) via
TestClient against the in-process app, same pattern as test_assets.py."""
import os
import uuid

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "webdojo_test")

import pytest
from starlette.testclient import TestClient

import server


@pytest.fixture()
def project(client):
    """Creates a real project (via the API, so motor's event-loop binding is
    handled the same way the running app handles it) + dashboard password,
    returns (project_id, token)."""
    r = client.post("/api/auth/register", json={"email": f"z{uuid.uuid4().hex[:8]}@test.dev", "password": "password123"})
    assert r.status_code == 200
    headers = {"Authorization": f"Bearer {r.json()['token']}"}
    r = client.post("/api/projects", json={"name": f"test-{uuid.uuid4().hex[:8]}"}, headers=headers)
    assert r.status_code == 200
    project_id = r.json()["id"]
    r = client.post(f"/api/dashboard/{project_id}/set-password", json={"password": "correct-horse"})
    assert r.status_code == 200
    r = client.post(f"/api/dashboard/{project_id}/unlock", json={"password": "correct-horse"})
    assert r.status_code == 200, r.text
    token = r.json()["token"]
    return project_id, token


@pytest.fixture(scope="module")
def client():
    # Context-manager form keeps one event loop alive for every request
    # (motor's AsyncIOMotorClient binds to the loop of its first call and
    # errors on a later, already-closed one otherwise — test_assets.py's
    # plain `TestClient(app)` only ever makes one request per test, so it
    # never hit this). Module-scoped so the app's startup/shutdown lifespan
    # runs once for the whole file — server.py's `db`/motor client are
    # process-global singletons, and shutdown closes that global client, so
    # a fresh `with TestClient(...)` per test would poison it for every test
    # after the first in the same worker.
    with TestClient(server.app) as c:
        yield c


class TestTimelineEntries:
    def test_create_list_update_delete(self, client, project):
        project_id, token = project
        headers = {"X-Dashboard-Token": token}

        r = client.post(f"/api/{project_id}/timeline_entries", json={"date": "2020", "title": "Founded", "description": "Started the company"}, headers=headers)
        assert r.status_code == 200
        item = r.json()
        assert item["title"] == "Founded"
        assert item["sort_order"] == 0

        r = client.get(f"/api/{project_id}/timeline_entries")
        assert r.status_code == 200
        assert len(r.json()["timeline_entries"]) == 1

        r = client.put(f"/api/{project_id}/timeline_entries/{item['id']}", json={"title": "Founded the company"}, headers=headers)
        assert r.status_code == 200
        assert r.json()["title"] == "Founded the company"

        r = client.delete(f"/api/{project_id}/timeline_entries/{item['id']}", headers=headers)
        assert r.status_code == 200
        assert client.get(f"/api/{project_id}/timeline_entries").json()["timeline_entries"] == []

    def test_write_requires_dashboard_token(self, client, project):
        project_id, _ = project
        r = client.post(f"/api/{project_id}/timeline_entries", json={"title": "No token"})
        assert r.status_code == 401

    def test_reorder_persists_sort_order(self, client, project):
        project_id, token = project
        headers = {"X-Dashboard-Token": token}
        ids = []
        for title in ("A", "B", "C"):
            r = client.post(f"/api/{project_id}/timeline_entries", json={"title": title}, headers=headers)
            ids.append(r.json()["id"])

        reversed_ids = list(reversed(ids))
        r = client.post(f"/api/{project_id}/timeline_entries/reorder", json={"ordered_ids": reversed_ids}, headers=headers)
        assert r.status_code == 200

        listed = client.get(f"/api/{project_id}/timeline_entries").json()["timeline_entries"]
        assert [it["id"] for it in listed] == reversed_ids


class TestBentoTiles:
    def test_create_list_update_delete(self, client, project):
        project_id, token = project
        headers = {"X-Dashboard-Token": token}

        r = client.post(f"/api/{project_id}/bento_tiles", json={"icon": "🎯", "title": "Fast", "description": "Loads in under a second"}, headers=headers)
        assert r.status_code == 200
        item = r.json()
        assert item["icon"] == "🎯"

        r = client.get(f"/api/{project_id}/bento_tiles")
        assert len(r.json()["bento_tiles"]) == 1

        r = client.put(f"/api/{project_id}/bento_tiles/{item['id']}", json={"href": "/features"}, headers=headers)
        assert r.json()["href"] == "/features"

        r = client.delete(f"/api/{project_id}/bento_tiles/{item['id']}", headers=headers)
        assert r.status_code == 200
        assert client.get(f"/api/{project_id}/bento_tiles").json()["bento_tiles"] == []

    def test_default_icon_when_omitted(self, client, project):
        project_id, token = project
        r = client.post(f"/api/{project_id}/bento_tiles", json={"title": "No icon given"}, headers={"X-Dashboard-Token": token})
        assert r.json()["icon"] == "🚀"
