"""Phase 1 regression tests: builder auth (JWT), project ownership,
collaborator roles, legacy claim, and the dashboard-gate integration."""
import os
import uuid

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "webdojo_test")

import pytest
from starlette.testclient import TestClient

import server
from models import builder_auth


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


class TestAuthEndpoints:
    def test_register_login_roundtrip(self, client):
        u = _register(client)
        assert u["user_id"] and u["token"].count(".") == 2  # header.payload.sig
        r = client.post("/api/auth/login", json={"email": u["email"], "password": "password123"})
        assert r.status_code == 200
        assert r.json()["user_id"] == u["user_id"]

    def test_login_lists_owned_projects(self, client):
        u = _register(client)
        pid = _new_project(client, u, "mine")
        r = client.post("/api/auth/login", json={"email": u["email"], "password": "password123"})
        assert any(p["id"] == pid for p in r.json()["projects"])

    def test_duplicate_email_409(self, client):
        u = _register(client)
        r = client.post("/api/auth/register", json={"email": u["email"], "password": "password123"})
        assert r.status_code == 409

    def test_wrong_password_401_no_oracle(self, client):
        u = _register(client)
        r = client.post("/api/auth/login", json={"email": u["email"], "password": "wrong-pass-1"})
        assert r.status_code == 401
        # Unknown email gives the identical error — no account-existence oracle.
        r2 = client.post("/api/auth/login", json={"email": "nobody@test.dev", "password": "wrong-pass-1"})
        assert r2.status_code == 401
        assert r.json()["detail"] == r2.json()["detail"]

    def test_short_password_rejected(self, client):
        r = client.post("/api/auth/register", json={"email": f"x{uuid.uuid4().hex[:6]}@t.dev", "password": "short"})
        assert r.status_code == 400

    def test_invalid_email_rejected(self, client):
        r = client.post("/api/auth/register", json={"email": "not-an-email", "password": "password123"})
        assert r.status_code == 400

    def test_tampered_jwt_rejected(self, client):
        u = _register(client)
        header, payload, sig = u["token"].split(".")
        tampered = f"{header}.{payload}.{sig[:-4]}AAAA"
        r = client.get("/api/projects", headers={"Authorization": f"Bearer {tampered}"})
        assert r.status_code == 401

    def test_expired_jwt_rejected(self, client):
        u = _register(client)
        expired = builder_auth.issue_jwt(u["user_id"], ttl_seconds=-10)
        r = client.get("/api/projects", headers={"Authorization": f"Bearer {expired}"})
        assert r.status_code == 401

    def test_garbage_token_and_missing_header(self, client):
        assert client.get("/api/projects").status_code == 401
        assert client.get("/api/projects", headers={"Authorization": "Bearer junk"}).status_code == 401


class TestProjectOwnership:
    def test_create_requires_auth_and_sets_owner(self, client):
        u = _register(client)
        assert client.post("/api/projects", json={"name": "X"}).status_code == 401
        pid = _new_project(client, u)
        doc = client.get(f"/api/projects/{pid}").json()
        assert doc["owner_id"] == u["user_id"]

    def test_listing_scoped_to_owner(self, client):
        alice = _register(client)
        bob = _register(client)
        _new_project(client, alice, "alice-only")
        names = [p["name"] for p in client.get("/api/projects", headers=bob["headers"]).json()]
        assert "alice-only" not in names
        names_alice = [p["name"] for p in client.get("/api/projects", headers=alice["headers"]).json()]
        assert "alice-only" in names_alice

    def test_edit_other_users_project_403(self, client):
        owner = _register(client)
        intruder = _register(client)
        pid = _new_project(client, owner)
        r = client.put(f"/api/projects/{pid}", json={"name": "hijacked"}, headers=intruder["headers"])
        assert r.status_code == 403
        # And without any auth at all → 401
        assert client.put(f"/api/projects/{pid}", json={"name": "x"}).status_code == 401

    def test_delete_other_users_project_403_owner_can(self, client):
        owner = _register(client)
        intruder = _register(client)
        pid = _new_project(client, owner)
        assert client.delete(f"/api/projects/{pid}", headers=intruder["headers"]).status_code == 403
        assert client.delete(f"/api/projects/{pid}", headers=owner["headers"]).status_code == 200


class TestLegacyClaim:
    def test_claim_on_owned_project_403_for_others_noop_for_owner(self, client):
        u1 = _register(client)
        u2 = _register(client)
        pid = _new_project(client, u1)
        r = client.post(f"/api/projects/{pid}/claim", headers=u2["headers"])
        assert r.status_code == 403  # already owned by u1
        r = client.post(f"/api/projects/{pid}/claim", headers=u1["headers"])
        assert r.status_code == 200 and r.json()["owner_id"] == u1["user_id"]

    def test_legacy_unowned_insert_then_first_claim_wins(self, client):
        import asyncio
        u1 = _register(client)
        u2 = _register(client)
        legacy_id = f"legacy-{uuid.uuid4().hex[:8]}"

        async def _insert():
            await server.db.projects.insert_one({"id": legacy_id, "name": "legacy", "elements": []})

        # The TestClient's event loop is per-request; run the insert on a fresh
        # loop against the same process-global sqlite shim (safe — shim opens
        # a new connection per call).
        asyncio.run(_insert())
        # Both users can see/edit the unowned project (documented legacy rule)…
        assert any(p["id"] == legacy_id for p in client.get("/api/projects", headers=u1["headers"]).json())
        # …but only the first claim wins.
        assert client.post(f"/api/projects/{legacy_id}/claim", headers=u1["headers"]).status_code == 200
        assert client.post(f"/api/projects/{legacy_id}/claim", headers=u2["headers"]).status_code == 403


class TestCollaborators:
    def _shared(self, client, role):
        owner = _register(client)
        collab_email = f"c{uuid.uuid4().hex[:6]}@test.dev"
        pid = _new_project(client, owner)
        r = client.post(f"/api/projects/{pid}/share",
                        json={"email": collab_email, "role": role}, headers=owner["headers"])
        assert r.status_code == 200, r.text
        collaborator = _register(client, collab_email)
        return owner, collaborator, pid

    def test_editor_can_edit_but_not_delete(self, client):
        owner, editor, pid = self._shared(client, "editor")
        r = client.put(f"/api/projects/{pid}", json={"canvas_bg": "#101010"}, headers=editor["headers"])
        assert r.status_code == 200
        assert client.get(f"/api/projects/{pid}").json()["canvas_bg"] == "#101010"
        assert client.delete(f"/api/projects/{pid}", headers=editor["headers"]).status_code == 403

    def test_viewer_cannot_edit(self, client):
        owner, viewer, pid = self._shared(client, "viewer")
        r = client.put(f"/api/projects/{pid}", json={"canvas_bg": "#111111"}, headers=viewer["headers"])
        assert r.status_code == 403

    def test_downgrade_editor_to_viewer_blocks_edits(self, client):
        owner, collab, pid = self._shared(client, "editor")
        assert client.put(f"/api/projects/{pid}", json={"canvas_bg": "#121212"}, headers=collab["headers"]).status_code == 200
        client.post(f"/api/projects/{pid}/share", json={"email": collab["email"], "role": "viewer"}, headers=owner["headers"])
        assert client.put(f"/api/projects/{pid}", json={"canvas_bg": "#131313"}, headers=collab["headers"]).status_code == 403

    def test_non_admin_cannot_manage_collaborators(self, client):
        owner, editor, pid = self._shared(client, "editor")
        outsider = _register(client)
        assert client.post(f"/api/projects/{pid}/share",
                           json={"email": "n1@test.dev", "role": "viewer"}, headers=editor["headers"]).status_code == 403
        assert client.post(f"/api/projects/{pid}/share",
                           json={"email": "n2@test.dev", "role": "admin"}, headers=outsider["headers"]).status_code == 403

    def test_remove_collaborator_revokes_access(self, client):
        owner, editor, pid = self._shared(client, "editor")
        assert client.delete(f"/api/projects/{pid}/collaborators/{editor['email']}", headers=owner["headers"]).status_code == 200
        assert client.put(f"/api/projects/{pid}", json={"canvas_bg": "#141414"}, headers=editor["headers"]).status_code == 403

    def test_invalid_role_rejected(self, client):
        owner = _register(client)
        pid = _new_project(client, owner)
        r = client.post(f"/api/projects/{pid}/share", json={"email": "e@t.dev", "role": "superuser"}, headers=owner["headers"])
        assert r.status_code == 400


class TestDashboardGateIntegration:
    def test_owner_can_rotate_dashboard_password_with_bearer(self, client):
        owner = _register(client)
        pid = _new_project(client, owner)
        client.post(f"/api/dashboard/{pid}/set-password", json={"password": "first-pass-1"})
        # Rotation without the old dashboard token but WITH builder auth → OK
        r = client.post(f"/api/dashboard/{pid}/set-password",
                        json={"password": "rotated-pw"}, headers=owner["headers"])
        assert r.status_code == 200, r.text
        r = client.post(f"/api/dashboard/{pid}/unlock", json={"password": "rotated-pw"})
        assert r.status_code == 200 and "token" in r.json()

    def test_anonymous_rotation_still_needs_current_token(self, client):
        owner = _register(client)
        pid = _new_project(client, owner)
        client.post(f"/api/dashboard/{pid}/set-password", json={"password": "hunter22"})
        r = client.post(f"/api/dashboard/{pid}/set-password", json={"password": "attacker-pw"})
        assert r.status_code == 401
        # Old password still works — nothing was rotated.
        assert client.post(f"/api/dashboard/{pid}/unlock", json={"password": "hunter22"}).status_code == 200

    def test_password_status_reflects_whether_a_password_is_set(self, client):
        owner = _register(client)
        pid = _new_project(client, owner)
        assert client.get(f"/api/dashboard/{pid}/password-status").json() == {"is_set": False}
        client.post(f"/api/dashboard/{pid}/set-password", json={"password": "first-pass-1"})
        assert client.get(f"/api/dashboard/{pid}/password-status").json() == {"is_set": True}