"""Tests for the esports Zenero content types (models/zenero.py): roster
players, fixtures, and org stats. Same TestClient-against-real-Mongo
pattern as test_zenero_timeline_bento.py."""
import os
import uuid

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "webdojo_test")

import pytest
from starlette.testclient import TestClient

import server


@pytest.fixture()
def project(client):
    r = client.post("/api/projects", json={"name": f"test-{uuid.uuid4().hex[:8]}"})
    assert r.status_code == 200
    project_id = r.json()["id"]
    r = client.post(f"/api/dashboard/{project_id}/set-password", json={"password": "correct-horse"})
    assert r.status_code == 200
    r = client.post(f"/api/dashboard/{project_id}/unlock", json={"password": "correct-horse"})
    assert r.status_code == 200
    token = r.json()["token"]
    return project_id, token


@pytest.fixture(scope="module")
def client():
    with TestClient(server.app) as c:
        yield c


class TestRosterPlayers:
    def test_create_list_update_delete(self, client, project):
        project_id, token = project
        headers = {"X-Dashboard-Token": token}

        r = client.post(f"/api/{project_id}/roster_players", json={"name": "Wraithe", "role": "IGL / Captain", "stat_value": "1.48"}, headers=headers)
        assert r.status_code == 200
        item = r.json()
        assert item["name"] == "Wraithe"
        assert item["stat_label"] == "K/D"
        assert item["sort_order"] == 0

        r = client.get(f"/api/{project_id}/roster_players")
        assert r.status_code == 200
        assert len(r.json()["roster_players"]) == 1

        r = client.put(f"/api/{project_id}/roster_players/{item['id']}", json={"stat_value": "1.55"}, headers=headers)
        assert r.status_code == 200
        assert r.json()["stat_value"] == "1.55"

        r = client.delete(f"/api/{project_id}/roster_players/{item['id']}", headers=headers)
        assert r.status_code == 200
        assert client.get(f"/api/{project_id}/roster_players").json()["roster_players"] == []

    def test_write_requires_dashboard_token(self, client, project):
        project_id, _ = project
        r = client.post(f"/api/{project_id}/roster_players", json={"name": "No token"})
        assert r.status_code == 401

    def test_reorder_persists_sort_order(self, client, project):
        project_id, token = project
        headers = {"X-Dashboard-Token": token}
        ids = []
        for name in ("A", "B", "C"):
            r = client.post(f"/api/{project_id}/roster_players", json={"name": name}, headers=headers)
            ids.append(r.json()["id"])

        reversed_ids = list(reversed(ids))
        r = client.post(f"/api/{project_id}/roster_players/reorder", json={"ordered_ids": reversed_ids}, headers=headers)
        assert r.status_code == 200

        listed = client.get(f"/api/{project_id}/roster_players").json()["roster_players"]
        assert [it["id"] for it in listed] == reversed_ids


class TestFixtures:
    def test_create_list_update_delete(self, client, project):
        project_id, token = project
        headers = {"X-Dashboard-Token": token}

        r = client.post(
            f"/api/{project_id}/fixtures",
            json={"opponent": "Rocket Fuel", "competition": "VCT Playoffs", "note": "BO3", "status": "upcoming"},
            headers=headers,
        )
        assert r.status_code == 200
        item = r.json()
        assert item["opponent"] == "Rocket Fuel"
        assert item["status"] == "upcoming"

        r = client.get(f"/api/{project_id}/fixtures")
        assert len(r.json()["fixtures"]) == 1

        r = client.put(f"/api/{project_id}/fixtures/{item['id']}", json={"status": "final", "team_score": "2", "opponent_score": "0"}, headers=headers)
        assert r.json()["status"] == "final"
        assert r.json()["team_score"] == "2"

        r = client.delete(f"/api/{project_id}/fixtures/{item['id']}", headers=headers)
        assert r.status_code == 200
        assert client.get(f"/api/{project_id}/fixtures").json()["fixtures"] == []

    def test_write_requires_dashboard_token(self, client, project):
        project_id, _ = project
        r = client.post(f"/api/{project_id}/fixtures", json={"opponent": "No token"})
        assert r.status_code == 401

    def test_default_status_is_upcoming(self, client, project):
        project_id, token = project
        r = client.post(f"/api/{project_id}/fixtures", json={"opponent": "Default status"}, headers={"X-Dashboard-Token": token})
        assert r.json()["status"] == "upcoming"

    def test_reorder_persists_sort_order(self, client, project):
        project_id, token = project
        headers = {"X-Dashboard-Token": token}
        ids = []
        for opp in ("A", "B", "C"):
            r = client.post(f"/api/{project_id}/fixtures", json={"opponent": opp}, headers=headers)
            ids.append(r.json()["id"])

        reversed_ids = list(reversed(ids))
        r = client.post(f"/api/{project_id}/fixtures/reorder", json={"ordered_ids": reversed_ids}, headers=headers)
        assert r.status_code == 200

        listed = client.get(f"/api/{project_id}/fixtures").json()["fixtures"]
        assert [it["id"] for it in listed] == reversed_ids


class TestOrgStats:
    def test_create_list_update_delete(self, client, project):
        project_id, token = project
        headers = {"X-Dashboard-Token": token}

        r = client.post(f"/api/{project_id}/org_stats", json={"label": "Global rank", "value": "#4"}, headers=headers)
        assert r.status_code == 200
        item = r.json()
        assert item["label"] == "Global rank"

        r = client.get(f"/api/{project_id}/org_stats")
        assert len(r.json()["org_stats"]) == 1

        r = client.put(f"/api/{project_id}/org_stats/{item['id']}", json={"value": "#3"}, headers=headers)
        assert r.json()["value"] == "#3"

        r = client.delete(f"/api/{project_id}/org_stats/{item['id']}", headers=headers)
        assert r.status_code == 200
        assert client.get(f"/api/{project_id}/org_stats").json()["org_stats"] == []

    def test_write_requires_dashboard_token(self, client, project):
        project_id, _ = project
        r = client.post(f"/api/{project_id}/org_stats", json={"label": "No token", "value": "x"})
        assert r.status_code == 401
