"""Per-project customer-account auth for exported static sites: signup/login/
me, project-scoped uniqueness, and cross-project token rejection."""
import os
import uuid

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "webdojo_test")

import pytest
from starlette.testclient import TestClient

import server
from models import site_auth


@pytest.fixture(scope="module")
def client():
    with TestClient(server.app) as c:
        yield c


def _new_project(client, name="P"):
    """Creates a real project via the API. Project creation requires a
    builder account (see test_builder_auth.py); site-auth customers are
    unrelated to that account and are scoped to the resulting project_id."""
    r = client.post("/api/auth/register",
                     json={"email": f"owner{uuid.uuid4().hex[:8]}@test.dev", "password": "password123"})
    assert r.status_code == 200, r.text
    headers = {"Authorization": f"Bearer {r.json()['token']}"}
    r = client.post("/api/projects", json={"name": name}, headers=headers)
    assert r.status_code == 200, r.text
    return r.json()["id"]


def _signup(client, pid, email=None, pw="password123"):
    email = email or f"c{uuid.uuid4().hex[:8]}@test.dev"
    r = client.post(f"/api/{pid}/site-auth/signup", json={"email": email, "password": pw})
    assert r.status_code == 200, r.text
    body = r.json()
    return {**body, "email": email, "headers": {"Authorization": f"Bearer {body['token']}"}}


class TestSiteSignupLogin:
    def test_signup_login_roundtrip(self, client):
        pid = _new_project(client)
        c = _signup(client, pid)
        assert c["token"].count(".") == 2
        r = client.post(f"/api/{pid}/site-auth/login", json={"email": c["email"], "password": "password123"})
        assert r.status_code == 200
        assert r.json()["email"] == c["email"]

    def test_me_returns_account(self, client):
        pid = _new_project(client)
        c = _signup(client, pid)
        r = client.get(f"/api/{pid}/site-auth/me", headers=c["headers"])
        assert r.status_code == 200
        assert r.json()["email"] == c["email"]
        assert "password_hash" not in r.json()

    def test_duplicate_email_same_project_409(self, client):
        pid = _new_project(client)
        c = _signup(client, pid)
        r = client.post(f"/api/{pid}/site-auth/signup", json={"email": c["email"], "password": "password123"})
        assert r.status_code == 409

    def test_same_email_different_projects_allowed(self, client):
        pid1 = _new_project(client)
        pid2 = _new_project(client)
        email = f"shared{uuid.uuid4().hex[:6]}@test.dev"
        r1 = client.post(f"/api/{pid1}/site-auth/signup", json={"email": email, "password": "password123"})
        r2 = client.post(f"/api/{pid2}/site-auth/signup", json={"email": email, "password": "password123"})
        assert r1.status_code == 200 and r2.status_code == 200

    def test_wrong_password_401_no_oracle(self, client):
        pid = _new_project(client)
        c = _signup(client, pid)
        r = client.post(f"/api/{pid}/site-auth/login", json={"email": c["email"], "password": "wrong-pass-1"})
        assert r.status_code == 401
        r2 = client.post(f"/api/{pid}/site-auth/login", json={"email": "nobody@test.dev", "password": "wrong-pass-1"})
        assert r2.status_code == 401
        assert r.json()["detail"] == r2.json()["detail"]

    def test_short_password_rejected(self, client):
        pid = _new_project(client)
        r = client.post(f"/api/{pid}/site-auth/signup",
                         json={"email": f"x{uuid.uuid4().hex[:6]}@t.dev", "password": "short"})
        assert r.status_code == 400

    def test_invalid_email_rejected(self, client):
        pid = _new_project(client)
        r = client.post(f"/api/{pid}/site-auth/signup", json={"email": "not-an-email", "password": "password123"})
        assert r.status_code == 400

    def test_garbage_token_and_missing_header(self, client):
        pid = _new_project(client)
        assert client.get(f"/api/{pid}/site-auth/me").status_code == 401
        assert client.get(f"/api/{pid}/site-auth/me",
                           headers={"Authorization": "Bearer junk"}).status_code == 401

    def test_tampered_jwt_rejected(self, client):
        pid = _new_project(client)
        c = _signup(client, pid)
        header, payload, sig = c["token"].split(".")
        tampered = f"{header}.{payload}.{sig[:-4]}AAAA"
        r = client.get(f"/api/{pid}/site-auth/me", headers={"Authorization": f"Bearer {tampered}"})
        assert r.status_code == 401

    def test_expired_jwt_rejected(self, client):
        pid = _new_project(client)
        c = _signup(client, pid)
        expired = site_auth.issue_site_jwt(c["customer_id"], pid, ttl_seconds=-10)
        r = client.get(f"/api/{pid}/site-auth/me", headers={"Authorization": f"Bearer {expired}"})
        assert r.status_code == 401


class TestSiteMyOrders:
    def _insert_order(self, project_id, email, amount=1500, ref=None):
        import asyncio
        asyncio.run(server.db.orders.insert_one({
            "id": ref or f"o-{uuid.uuid4().hex[:8]}", "project_id": project_id, "provider": "stripe",
            "provider_ref": ref or "cs_x", "status": "completed", "amount_total": amount, "currency": "usd",
            "customer_email": email, "customer_name": None, "shipping_address": None,
            "line_items": [{"name": "Widget", "quantity": 1}], "fulfillment_status": "processing",
            "created_at": "2026-08-21T00:00:00Z",
        }))

    def test_requires_a_bearer_token(self, client):
        pid = _new_project(client)
        assert client.get(f"/api/{pid}/site-auth/orders").status_code == 401

    def test_returns_only_that_customers_own_orders(self, client):
        pid = _new_project(client)
        c = _signup(client, pid)
        self._insert_order(pid, c["email"], amount=2500)
        self._insert_order(pid, "someone-else@test.dev", amount=9999)  # not this customer

        r = client.get(f"/api/{pid}/site-auth/orders", headers=c["headers"])
        assert r.status_code == 200
        orders = r.json()["orders"]
        assert len(orders) == 1
        assert orders[0]["amount_total"] == 2500
        assert "customer_email" not in orders[0]  # not this customer's business to see the raw filter key back

    def test_no_orders_yet_returns_an_empty_list_not_an_error(self, client):
        pid = _new_project(client)
        c = _signup(client, pid)
        r = client.get(f"/api/{pid}/site-auth/orders", headers=c["headers"])
        assert r.status_code == 200
        assert r.json()["orders"] == []


class TestCrossProjectIsolation:
    def test_token_from_one_project_rejected_on_another(self, client):
        pid1 = _new_project(client)
        pid2 = _new_project(client)
        c = _signup(client, pid1)
        # Valid token, but for pid1 — must not authenticate against pid2.
        r = client.get(f"/api/{pid2}/site-auth/me", headers=c["headers"])
        assert r.status_code == 401

    def test_login_scoped_to_project_even_with_shared_email(self, client):
        pid1 = _new_project(client)
        pid2 = _new_project(client)
        email = f"scoped{uuid.uuid4().hex[:6]}@test.dev"
        client.post(f"/api/{pid1}/site-auth/signup", json={"email": email, "password": "password123"})
        # Account only exists under pid1 — login against pid2 must fail.
        r = client.post(f"/api/{pid2}/site-auth/login", json={"email": email, "password": "password123"})
        assert r.status_code == 401
