"""Phase 9A regression tests: collaboration presence beacon (presence.py)."""
import os
import uuid
from datetime import datetime, timedelta, timezone

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "webdojo_test")

import pytest
from starlette.testclient import TestClient

import server


@pytest.fixture(scope="module")
def client():
    with TestClient(server.app) as c:
        yield c


def _register(client, email=None, pw="password123"):
    email = email or f"u{uuid.uuid4().hex[:8]}@test.dev"
    r = client.post("/api/auth/register", json={"email": email, "password": pw})
    assert r.status_code == 200, r.text
    body = r.json()
    return {**body, "email": email, "headers": {"Authorization": f"Bearer {body['token']}"}}


def _new_project(client, user, name="P"):
    r = client.post("/api/projects", json={"name": name}, headers=user["headers"])
    assert r.status_code == 200, r.text
    return r.json()["id"]


def test_ping_requires_auth(client):
    r = client.post("/api/projects/whatever/presence", json={"name": "A", "color": "#fff"})
    assert r.status_code == 401


def test_ping_unknown_project_404(client):
    u = _register(client)
    r = client.post("/api/projects/nope-does-not-exist/presence", json={"name": "A"}, headers=u["headers"])
    assert r.status_code == 404


def test_two_peers_see_each_other_not_themselves(client):
    owner = _register(client)
    pid = _new_project(client, owner)
    collab_email = f"c{uuid.uuid4().hex[:6]}@test.dev"
    assert client.post(f"/api/projects/{pid}/share", json={"email": collab_email, "role": "editor"}, headers=owner["headers"]).status_code == 200
    collaborator = _register(client, collab_email)

    r1 = client.post(f"/api/projects/{pid}/presence", json={"name": "Owner", "color": "#111111"}, headers=owner["headers"])
    assert r1.status_code == 200
    assert r1.json()["peers"] == []  # collaborator hasn't pinged yet

    r2 = client.post(f"/api/projects/{pid}/presence", json={"name": "Collab", "color": "#222222"}, headers=collaborator["headers"])
    peers = r2.json()["peers"]
    assert len(peers) == 1
    assert peers[0]["name"] == "Owner"
    assert peers[0]["color"] == "#111111"

    # And the owner now sees the collaborator, but not themselves.
    r3 = client.post(f"/api/projects/{pid}/presence", json={"name": "Owner", "color": "#111111"}, headers=owner["headers"])
    peers3 = r3.json()["peers"]
    assert len(peers3) == 1
    assert peers3[0]["name"] == "Collab"


def test_stale_peer_is_pruned_on_read(client):
    import asyncio
    owner = _register(client)
    pid = _new_project(client, owner)
    collab_email = f"c{uuid.uuid4().hex[:6]}@test.dev"
    client.post(f"/api/projects/{pid}/share", json={"email": collab_email, "role": "editor"}, headers=owner["headers"])
    collaborator = _register(client, collab_email)

    # Seed a stale beacon directly (older than PRESENCE_TTL_SECONDS=40) rather
    # than sleeping in the test.
    stale_iso = (datetime.now(timezone.utc) - timedelta(seconds=999)).isoformat()

    async def _seed():
        await server.db.presence.update_one(
            {"project_id": pid, "user_id": collaborator["user_id"]},
            {"$set": {"id": f"{pid}:{collaborator['user_id']}", "name": "Ghost", "color": "#000000", "seen_at": stale_iso}},
            upsert=True,
        )

    asyncio.run(_seed())

    r = client.post(f"/api/projects/{pid}/presence", json={"name": "Owner", "color": "#111111"}, headers=owner["headers"])
    assert r.json()["peers"] == []  # stale peer pruned, not returned

    async def _count():
        return await server.db.presence.count_documents({"project_id": pid, "user_id": collaborator["user_id"]})

    assert asyncio.run(_count()) == 0  # pruned from storage too
