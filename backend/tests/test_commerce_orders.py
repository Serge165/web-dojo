import asyncio
import atexit
import hashlib
import json
import os
import stat
import tempfile
import time
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

# Matches test_security_fixes.py / test_audit_fixes.py: a default so `import
# server` below doesn't crash on a missing MONGO_URL if this module happens
# to be the first to import it in a given pytest-xdist worker.
os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "webdojo_test")
# The webhook route just needs this non-empty to pass its "is Stripe
# configured" guard — signature verification itself is mocked per-test.
os.environ.setdefault("STRIPE_WEBHOOK_SECRET", "whsec_test_dummy")

import httpx
import pytest
import stripe as stripe_sdk
from starlette.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock, patch

import server
from sqlite_compat import SqliteClient, SqliteCursor

# server.db is whatever backend happened to be live when `server` was first
# imported in this pytest-xdist worker (pytest.ini pins -n 2 --dist loadscope,
# so another test module — possibly on Mongo — may have imported it first,
# making env-var-before-import unreliable). Overwrite it directly with a
# fresh temp-file SQLite client (matches tests/test_sqlite_compat.py's
# pattern; a literal ":memory:" path opens a fresh, empty DB on every
# connection in sqlite_compat.py and would make writes invisible to reads),
# so project-touching tests below get real persistence regardless of import
# order.
_fd, _sqlite_path = tempfile.mkstemp(suffix=".db")
os.close(_fd)
atexit.register(lambda: os.path.exists(_sqlite_path) and os.unlink(_sqlite_path))
server.db = SqliteClient(_sqlite_path)["webdojo_test"]

# Same import-order problem as server.db above, but unlike server.db (every
# test file wants a working DB, so a permanent overwrite is harmless), other
# modules have the OPPOSITE requirement here: test_security_fixes.py's
# TestStripeNotConfigured class specifically needs STRIPE_SECRET_KEY empty to
# exercise its "unconfigured" 503 path. A bare permanent assignment would
# leak across files sharing an xdist worker and break that class. Scope the
# override to just this module's test run instead, restoring the original
# value afterward.
@pytest.fixture(scope="module", autouse=True)
def _stripe_configured_for_this_module():
    original = server.STRIPE_SECRET_KEY
    server.STRIPE_SECRET_KEY = "sk_test_dummy"
    yield
    server.STRIPE_SECRET_KEY = original


@pytest.fixture(scope="module")
def client():
    return TestClient(server.app)


@pytest.fixture()
def project_id(client):
    r = client.post("/api/projects", json={"name": "Test Project"})
    return r.json()["id"]


class _SyncCollection:
    """Wraps a sqlite_compat collection so its async methods (find_one,
    count_documents, ...) can be called synchronously from a plain (non-async)
    test function, matching how the `db` fixture is used across this file."""

    def __init__(self, collection):
        self._collection = collection

    def __getattr__(self, name):
        attr = getattr(self._collection, name)
        if asyncio.iscoroutinefunction(attr):
            return lambda *a, **kw: asyncio.run(attr(*a, **kw))
        return attr


@pytest.fixture()
def db():
    class _SyncDb:
        def __getattr__(self, name):
            return _SyncCollection(getattr(server.db, name))

    return _SyncDb()


class TestPasswordHashing:
    def test_verify_password_accepts_the_correct_password(self):
        stored = server._hash_password("correct horse battery staple")
        assert server._verify_password("correct horse battery staple", stored) is True

    def test_verify_password_rejects_the_wrong_password(self):
        stored = server._hash_password("correct horse battery staple")
        assert server._verify_password("wrong password", stored) is False

    def test_same_password_hashes_differently_each_time(self):
        # random salt per call — equal plaintexts must not produce equal hashes
        a = server._hash_password("same password")
        b = server._hash_password("same password")
        assert a != b


class TestDashboardToken:
    def test_a_freshly_issued_token_verifies_for_its_own_project(self):
        token = server._issue_dashboard_token("proj-123")
        assert server._verify_dashboard_token(token, "proj-123") is True

    def test_a_token_bound_to_a_password_hash_verifies_against_that_hash(self):
        stored = server._hash_password("hunter22")
        token = server._issue_dashboard_token("proj-123", stored)
        assert server._verify_dashboard_token(token, "proj-123", stored) is True

    def test_a_token_stops_verifying_once_the_password_hash_changes(self):
        # I6: rotating the password revokes every outstanding token.
        old_hash = server._hash_password("hunter22")
        token = server._issue_dashboard_token("proj-123", old_hash)
        new_hash = server._hash_password("hunter22")  # same plaintext, new salt
        assert server._verify_dashboard_token(token, "proj-123", new_hash) is False

    def test_the_signing_secret_is_not_a_hardcoded_string(self, tmp_path, monkeypatch):
        # C2: with no env var configured, the secret must be randomly generated
        # and persisted 0o600 — never derived from a constant in the source.
        monkeypatch.delenv("WEBDOJO_SECRET_KEY", raising=False)
        key_path = tmp_path / "dashboard_key_a"
        monkeypatch.setattr(server, "_DASHBOARD_KEY_PATH", key_path)
        first = server._dashboard_token_secret()

        assert key_path.exists()
        assert stat.S_IMODE(key_path.stat().st_mode) == 0o600
        # Stable across calls once persisted (otherwise no token would verify)...
        assert server._dashboard_token_secret() == first
        # ...but a fresh install derives a different secret, so a token forged
        # against one deployment's key is worthless against another's.
        other_path = tmp_path / "dashboard_key_b"
        monkeypatch.setattr(server, "_DASHBOARD_KEY_PATH", other_path)
        assert server._dashboard_token_secret() != first
        # And nothing derives from the old "webdojo-dev-secret" literal.
        legacy = hashlib.sha256(b"webdojo-dev-secret" + b":dashboard-token").digest()
        assert first != legacy

    def test_a_token_does_not_verify_for_a_different_project(self):
        token = server._issue_dashboard_token("proj-123")
        assert server._verify_dashboard_token(token, "proj-456") is False

    def test_an_expired_token_does_not_verify(self):
        token = server._issue_dashboard_token("proj-123", ttl_seconds=1)
        with patch("server.time.time", return_value=time.time() + 2):
            assert server._verify_dashboard_token(token, "proj-123") is False

    def test_a_tampered_token_does_not_verify(self):
        token = server._issue_dashboard_token("proj-123")
        tampered = token[:-4] + "abcd"
        assert server._verify_dashboard_token(tampered, "proj-123") is False


class TestDashboardSetPasswordAndUnlock:
    def test_set_password_then_unlock_with_correct_password_returns_a_token(self, client, project_id):
        r = client.post(f"/api/dashboard/{project_id}/set-password", json={"password": "hunter22"})
        assert r.status_code == 200
        r = client.post(f"/api/dashboard/{project_id}/unlock", json={"password": "hunter22"})
        assert r.status_code == 200
        assert "token" in r.json()

    def test_unlock_with_wrong_password_is_rejected(self, client, project_id):
        client.post(f"/api/dashboard/{project_id}/set-password", json={"password": "hunter22"})
        r = client.post(f"/api/dashboard/{project_id}/unlock", json={"password": "nope"})
        assert r.status_code == 401

    def test_unlock_before_any_password_is_set_is_rejected(self, client, project_id):
        r = client.post(f"/api/dashboard/{project_id}/unlock", json={"password": "anything"})
        assert r.status_code == 401

    def test_project_get_response_never_includes_the_password_hash_or_paypal_secret(self, client, project_id):
        client.post(f"/api/dashboard/{project_id}/set-password", json={"password": "hunter22"})
        r = client.get(f"/api/projects/{project_id}")
        body = r.json()
        assert "dashboard_password_hash" not in body
        assert "paypal_secret_enc" not in body


class TestSetPasswordTakeoverIsBlocked:
    """C1: project_id is published in plaintext in every exported site, so
    anyone can view-source it. It must not be sufficient to seize the gate."""

    def test_first_time_setup_needs_no_token(self, client, project_id):
        r = client.post(f"/api/dashboard/{project_id}/set-password", json={"password": "hunter22"})
        assert r.status_code == 200

    def test_overwriting_an_existing_password_without_a_token_is_rejected(self, client, project_id, db):
        client.post(f"/api/dashboard/{project_id}/set-password", json={"password": "hunter22"})
        before = db.projects.find_one({"id": project_id})["dashboard_password_hash"]

        r = client.post(f"/api/dashboard/{project_id}/set-password", json={"password": "attacker-pw"})
        assert r.status_code == 401

        # The original password still works and the attacker's does not.
        assert db.projects.find_one({"id": project_id})["dashboard_password_hash"] == before
        assert client.post(f"/api/dashboard/{project_id}/unlock", json={"password": "attacker-pw"}).status_code == 401
        assert client.post(f"/api/dashboard/{project_id}/unlock", json={"password": "hunter22"}).status_code == 200

    def test_overwriting_with_an_invalid_token_is_rejected(self, client, project_id):
        client.post(f"/api/dashboard/{project_id}/set-password", json={"password": "hunter22"})
        r = client.post(
            f"/api/dashboard/{project_id}/set-password",
            json={"password": "attacker-pw"},
            headers={"X-Dashboard-Token": server._issue_dashboard_token(project_id, "some-other-hash")},
        )
        assert r.status_code == 401

    def test_the_owner_can_rotate_the_password_with_a_valid_token(self, client, project_id):
        client.post(f"/api/dashboard/{project_id}/set-password", json={"password": "hunter22"})
        token = client.post(f"/api/dashboard/{project_id}/unlock", json={"password": "hunter22"}).json()["token"]
        r = client.post(
            f"/api/dashboard/{project_id}/set-password",
            json={"password": "rotated-pw"},
            headers={"X-Dashboard-Token": token},
        )
        assert r.status_code == 200
        assert client.post(f"/api/dashboard/{project_id}/unlock", json={"password": "rotated-pw"}).status_code == 200

    def test_project_update_cannot_set_the_password_hash(self, client, project_id, db):
        # The second takeover path: PUT /api/projects/{id} used to $set whatever
        # the payload carried, including a hand-crafted salt$digest.
        forged = server._hash_password("attacker-pw")
        r = client.put(f"/api/projects/{project_id}", json={"name": "Renamed", "dashboard_password_hash": forged})
        assert r.status_code == 200
        assert not db.projects.find_one({"id": project_id}).get("dashboard_password_hash")
        assert client.post(f"/api/dashboard/{project_id}/unlock", json={"password": "attacker-pw"}).status_code == 401

    def test_project_update_cannot_set_the_paypal_secret(self, client, project_id, db):
        r = client.put(f"/api/projects/{project_id}", json={"name": "Renamed", "paypal_secret_enc": "forged"})
        assert r.status_code == 200
        assert not db.projects.find_one({"id": project_id}).get("paypal_secret_enc")

    def test_project_create_cannot_set_the_password_hash(self, client, db):
        forged = server._hash_password("attacker-pw")
        pid = client.post("/api/projects", json={"name": "Seeded", "dashboard_password_hash": forged}).json()["id"]
        assert not db.projects.find_one({"id": pid}).get("dashboard_password_hash")

    def test_a_token_issued_before_a_password_change_stops_working(self, client, project_id):
        # I6, end to end through the real endpoints.
        client.post(f"/api/dashboard/{project_id}/set-password", json={"password": "hunter22"})
        old_token = client.post(f"/api/dashboard/{project_id}/unlock", json={"password": "hunter22"}).json()["token"]
        assert client.get(f"/api/dashboard/{project_id}/orders", headers={"X-Dashboard-Token": old_token}).status_code == 200

        client.post(
            f"/api/dashboard/{project_id}/set-password",
            json={"password": "rotated-pw"},
            headers={"X-Dashboard-Token": old_token},
        )
        r = client.get(f"/api/dashboard/{project_id}/orders", headers={"X-Dashboard-Token": old_token})
        assert r.status_code == 401


FAKE_SESSION_ID = "cs_test_abc123"


def _fake_stripe_event():
    return {
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "id": FAKE_SESSION_ID,
                "amount_total": 3800,
                "currency": "usd",
                "customer_details": {"email": "buyer@example.com", "name": "Ada Lovelace"},
                "metadata": {"project_id": "proj-123"},
            }
        },
    }


def _fake_line_items():
    item = MagicMock()
    item.description = "Aurora Bottle"
    item.quantity = 1
    item.amount_total = 3800
    item.currency = "usd"
    result = MagicMock()
    result.data = [item]
    return result


class TestStripeWebhook:
    def test_a_request_with_no_signature_header_is_rejected(self, client):
        r = client.post("/api/commerce/webhook", content=b"{}")
        assert r.status_code == 400

    def test_a_request_with_an_invalid_signature_is_rejected(self, client):
        with patch.object(stripe_sdk.Webhook, "construct_event", side_effect=stripe_sdk.error.SignatureVerificationError("bad sig", "sig")):
            r = client.post("/api/commerce/webhook", content=b"{}", headers={"Stripe-Signature": "bad"})
        assert r.status_code == 400

    def test_a_valid_completed_session_event_creates_an_order(self, client, db):
        with patch.object(stripe_sdk.Webhook, "construct_event", return_value=_fake_stripe_event()), \
             patch.object(stripe_sdk.checkout.Session, "list_line_items", return_value=_fake_line_items()):
            r = client.post("/api/commerce/webhook", content=b"{}", headers={"Stripe-Signature": "valid"})
        assert r.status_code == 200
        # The receipt endpoint deliberately returns a trimmed view (see I8), so
        # assert the full record against the stored document instead.
        order = db.orders.find_one({"provider_ref": FAKE_SESSION_ID})
        assert order["status"] == "completed"
        assert order["project_id"] == "proj-123"
        assert order["customer_email"] == "buyer@example.com"
        assert order["line_items"][0]["name"] == "Aurora Bottle"

    def test_the_same_event_delivered_twice_creates_only_one_order(self, client, db):
        with patch.object(stripe_sdk.Webhook, "construct_event", return_value=_fake_stripe_event()), \
             patch.object(stripe_sdk.checkout.Session, "list_line_items", return_value=_fake_line_items()):
            client.post("/api/commerce/webhook", content=b"{}", headers={"Stripe-Signature": "valid"})
            client.post("/api/commerce/webhook", content=b"{}", headers={"Stripe-Signature": "valid"})
        assert db.orders.count_documents({"provider_ref": FAKE_SESSION_ID}) == 1

    def test_a_duplicate_delivery_does_not_change_the_order_id(self, client, db):
        with patch.object(stripe_sdk.Webhook, "construct_event", return_value=_fake_stripe_event()), \
             patch.object(stripe_sdk.checkout.Session, "list_line_items", return_value=_fake_line_items()):
            client.post("/api/commerce/webhook", content=b"{}", headers={"Stripe-Signature": "valid"})
            first_id = db.orders.find_one({"provider_ref": FAKE_SESSION_ID})["id"]
            client.post("/api/commerce/webhook", content=b"{}", headers={"Stripe-Signature": "valid"})
            second_id = db.orders.find_one({"provider_ref": FAKE_SESSION_ID})["id"]
        assert first_id == second_id


class TestCheckoutSessionProjectId:
    def test_checkout_session_without_project_id_is_rejected(self, client):
        r = client.post("/api/commerce/checkout-session", json={
            "items": [{"name": "Aurora Bottle", "amount": 3800, "currency": "usd", "quantity": 1}],
        })
        assert r.status_code == 422  # Pydantic validation error — project_id is required

    def test_checkout_session_passes_project_id_through_as_stripe_metadata(self, client, project_id):
        captured = {}

        def fake_create(**kwargs):
            captured.update(kwargs)
            result = MagicMock()
            result.url = "https://checkout.stripe.com/fake"
            result.id = "cs_test_xyz"
            return result

        with patch.object(stripe_sdk.checkout.Session, "create", side_effect=fake_create):
            r = client.post("/api/commerce/checkout-session", json={
                "items": [{"name": "Aurora Bottle", "amount": 3800, "currency": "usd", "quantity": 1}],
                "project_id": project_id,
            })
        assert r.status_code == 200
        assert captured["metadata"] == {"project_id": project_id}
        assert captured["allow_promotion_codes"] is True
        assert captured["billing_address_collection"] == "required"
        assert "shipping_address_collection" in captured

    @pytest.mark.parametrize("bad_project_id", ["null", "", "no-such-project"])
    def test_checkout_session_with_an_unknown_project_id_is_rejected(self, client, bad_project_id):
        # I3: a cart block added before the project's first save bakes the
        # literal string "null" (or "") into the exported site forever.
        with patch.object(stripe_sdk.checkout.Session, "create", side_effect=AssertionError("must not reach Stripe")):
            r = client.post("/api/commerce/checkout-session", json={
                "items": [{"name": "Aurora Bottle", "amount": 3800, "currency": "usd", "quantity": 1}],
                "project_id": bad_project_id,
            })
        assert r.status_code == 400
        assert "project_id" in r.json()["detail"]


class TestPaypalHelpers:
    @pytest.mark.asyncio
    async def test_get_access_token_posts_client_credentials_and_returns_the_token(self):
        fake_response = MagicMock()
        fake_response.json.return_value = {"access_token": "fake-token-abc"}
        fake_response.raise_for_status = MagicMock()
        mock_post = AsyncMock(return_value=fake_response)
        with patch("httpx.AsyncClient.post", new=mock_post):
            token = await server._paypal_get_access_token("client-id", "secret")
        assert token == "fake-token-abc"
        # Verify the request was formed correctly
        mock_post.assert_called_once()
        call_args = mock_post.call_args
        assert call_args[0][0] == "https://api-m.sandbox.paypal.com/v1/oauth2/token"
        assert call_args[1]["auth"] == ("client-id", "secret")
        assert call_args[1]["data"] == {"grant_type": "client_credentials"}

    @pytest.mark.asyncio
    async def test_get_order_returns_the_parsed_order_json(self):
        fake_response = MagicMock()
        fake_response.json.return_value = {"id": "PAYPAL-ORDER-1", "status": "COMPLETED"}
        fake_response.raise_for_status = MagicMock()
        mock_get = AsyncMock(return_value=fake_response)
        with patch("httpx.AsyncClient.get", new=mock_get):
            order = await server._paypal_get_order("PAYPAL-ORDER-1", "fake-token-abc")
        assert order["status"] == "COMPLETED"
        # Verify the request was formed correctly
        mock_get.assert_called_once()
        call_args = mock_get.call_args
        assert call_args[0][0] == "https://api-m.sandbox.paypal.com/v2/checkout/orders/PAYPAL-ORDER-1"
        assert call_args[1]["headers"] == {"Authorization": "Bearer fake-token-abc"}


class TestPaypalSecretEndpoint:
    def test_setting_the_secret_encrypts_it_at_rest(self, client, project_id, db):
        r = client.post("/api/commerce/paypal-secret", json={
            "project_id": project_id, "client_id": "client-abc", "secret": "plaintext-secret",
        })
        assert r.status_code == 200
        stored = db.projects.find_one({"id": project_id})
        assert stored["paypal_client_id"] == "client-abc"
        assert stored["paypal_secret_enc"] != "plaintext-secret"
        assert server._decrypt(stored["paypal_secret_enc"]) == "plaintext-secret"

    def test_project_get_response_never_includes_the_raw_or_encrypted_secret(self, client, project_id):
        client.post("/api/commerce/paypal-secret", json={
            "project_id": project_id, "client_id": "client-abc", "secret": "plaintext-secret",
        })
        body = client.get(f"/api/projects/{project_id}").json()
        assert "paypal_secret_enc" not in body
        assert "plaintext-secret" not in json.dumps(body)

    def test_replacing_existing_credentials_without_a_token_is_rejected(self, client, project_id, db):
        # C1 part 3: same root cause as set-password — project_id is public.
        client.post("/api/commerce/paypal-secret", json={
            "project_id": project_id, "client_id": "client-abc", "secret": "plaintext-secret",
        })
        r = client.post("/api/commerce/paypal-secret", json={
            "project_id": project_id, "client_id": "attacker-client", "secret": "attacker-secret",
        })
        assert r.status_code == 401
        stored = db.projects.find_one({"id": project_id})
        assert stored["paypal_client_id"] == "client-abc"
        assert server._decrypt(stored["paypal_secret_enc"]) == "plaintext-secret"

    def test_the_owner_can_replace_credentials_with_a_valid_token(self, client, project_id, db):
        client.post("/api/commerce/paypal-secret", json={
            "project_id": project_id, "client_id": "client-abc", "secret": "plaintext-secret",
        })
        client.post(f"/api/dashboard/{project_id}/set-password", json={"password": "hunter22"})
        token = client.post(f"/api/dashboard/{project_id}/unlock", json={"password": "hunter22"}).json()["token"]
        r = client.post(
            "/api/commerce/paypal-secret",
            json={"project_id": project_id, "client_id": "client-new", "secret": "rotated-secret"},
            headers={"X-Dashboard-Token": token},
        )
        assert r.status_code == 200
        assert server._decrypt(db.projects.find_one({"id": project_id})["paypal_secret_enc"]) == "rotated-secret"


class TestOrdersListEndpoint:
    def test_listing_without_a_token_is_rejected(self, client, project_id):
        r = client.get(f"/api/dashboard/{project_id}/orders")
        assert r.status_code == 401

    def test_listing_with_a_valid_token_returns_that_projects_orders_only(self, client, project_id, db):
        db.orders.insert_one({
            "id": "o1", "project_id": project_id, "provider": "stripe", "provider_ref": "cs_1",
            "status": "completed", "amount_total": 1000, "currency": "usd",
            "customer_email": "a@example.com", "customer_name": None, "shipping_address": None,
            "line_items": [], "created_at": "2026-08-21T00:00:00Z",
        })
        db.orders.insert_one({
            "id": "o2", "project_id": "some-other-project", "provider": "stripe", "provider_ref": "cs_2",
            "status": "completed", "amount_total": 2000, "currency": "usd",
            "customer_email": "b@example.com", "customer_name": None, "shipping_address": None,
            "line_items": [], "created_at": "2026-08-21T00:00:00Z",
        })
        client.post(f"/api/dashboard/{project_id}/set-password", json={"password": "hunter22"})
        token = client.post(f"/api/dashboard/{project_id}/unlock", json={"password": "hunter22"}).json()["token"]

        r = client.get(f"/api/dashboard/{project_id}/orders", headers={"X-Dashboard-Token": token})
        assert r.status_code == 200
        body = r.json()
        assert len(body["orders"]) == 1
        assert body["orders"][0]["provider_ref"] == "cs_1"

    def test_listing_bounds_the_fetch_to_skip_plus_page_size(self, client, project_id, db):
        for i in range(3):
            db.orders.insert_one({
                "id": f"bounds-o{i}", "project_id": project_id, "provider": "stripe", "provider_ref": f"bounds-cs-{i}",
                "status": "completed", "amount_total": 1000, "currency": "usd",
                "customer_email": "a@example.com", "customer_name": None, "shipping_address": None,
                "line_items": [], "created_at": f"2026-08-21T0{i}:00:00Z",
            })
        client.post(f"/api/dashboard/{project_id}/set-password", json={"password": "hunter22"})
        token = client.post(f"/api/dashboard/{project_id}/unlock", json={"password": "hunter22"}).json()["token"]

        original_to_list = SqliteCursor.to_list
        seen_lengths = []

        async def spying_to_list(self, length=None):
            seen_lengths.append(length)
            return await original_to_list(self, length)

        with patch.object(SqliteCursor, "to_list", spying_to_list):
            r = client.get(f"/api/dashboard/{project_id}/orders", headers={"X-Dashboard-Token": token}, params={"page_size": 2})
        assert r.status_code == 200
        body = r.json()
        assert len(body["orders"]) == 2
        assert body["total"] == 3
        # Bounded to skip+page_size (2), not an unbounded fetch of the whole collection.
        assert seen_lengths == [2]

    def _unlocked_token(self, client, project_id):
        client.post(f"/api/dashboard/{project_id}/set-password", json={"password": "hunter22"})
        return client.post(f"/api/dashboard/{project_id}/unlock", json={"password": "hunter22"}).json()["token"]

    @pytest.mark.parametrize("requested,clamped", [(100000, 100), (0, 1), (-5, 1)])
    def test_page_size_is_clamped_not_honored_literally(self, client, project_id, requested, clamped):
        # I7.
        token = self._unlocked_token(client, project_id)
        r = client.get(
            f"/api/dashboard/{project_id}/orders",
            headers={"X-Dashboard-Token": token},
            params={"page_size": requested},
        )
        assert r.status_code == 200
        assert r.json()["page_size"] == clamped

    @pytest.mark.parametrize("requested", [0, -1, -99999])
    def test_a_non_positive_page_cannot_produce_a_pathological_skip(self, client, project_id, requested):
        token = self._unlocked_token(client, project_id)
        r = client.get(
            f"/api/dashboard/{project_id}/orders",
            headers={"X-Dashboard-Token": token},
            params={"page": requested},
        )
        assert r.status_code == 200
        assert r.json()["page"] == 1


@pytest.fixture()
def paypal_project_id(client, project_id, db):
    db.projects.update_one(
        {"id": project_id},
        {"$set": {"paypal_secret_enc": server._encrypt("shh-secret"), "paypal_client_id": "client-abc"}},
    )
    return project_id


def _fake_paypal_order(order_id="PP-COMPLETE-1", value="38.00"):
    return {
        "id": order_id,
        "status": "COMPLETED",
        "purchase_units": [{"amount": {"value": value, "currency_code": "USD"}}],
        "payer": {"email_address": "buyer@example.com", "name": {"given_name": "Ada"}},
    }


class TestPaypalVerify:
    def test_an_order_that_is_not_completed_is_rejected(self, client, paypal_project_id):
        with patch.object(server, "_paypal_get_access_token", new=AsyncMock(return_value="tok")), \
             patch.object(server, "_paypal_get_order", new=AsyncMock(return_value={"id": "PP-1", "status": "CREATED"})):
            r = client.post("/api/commerce/paypal/verify", json={"project_id": paypal_project_id, "order_id": "PP-1"})
        assert r.status_code == 400
        assert "COMPLETED" in r.json()["detail"]

    @pytest.mark.parametrize("bad_project_id", ["null", "", "no-such-project"])
    def test_an_unknown_project_id_is_rejected(self, client, bad_project_id):
        # I3, PayPal side.
        with patch.object(server, "_paypal_get_access_token", new=AsyncMock(side_effect=AssertionError("must not reach PayPal"))):
            r = client.post("/api/commerce/paypal/verify", json={"project_id": bad_project_id, "order_id": "PP-1"})
        assert r.status_code == 400
        assert r.json()["detail"] == "Unknown project_id"

    def test_a_paypal_side_failure_returns_502_not_an_unhandled_500(self, client, paypal_project_id):
        # I10.
        with patch.object(server, "_paypal_get_access_token", new=AsyncMock(side_effect=httpx.ConnectError("boom"))):
            r = client.post("/api/commerce/paypal/verify", json={"project_id": paypal_project_id, "order_id": "PP-1"})
        assert r.status_code == 502
        assert "PayPal" in r.json()["detail"]

    def test_a_completed_paypal_order_creates_a_record(self, client, paypal_project_id, db):
        with patch.object(server, "_paypal_get_access_token", new=AsyncMock(return_value="tok")), \
             patch.object(server, "_paypal_get_order", new=AsyncMock(return_value=_fake_paypal_order())):
            r = client.post("/api/commerce/paypal/verify", json={"project_id": paypal_project_id, "order_id": "PP-COMPLETE-1"})
        assert r.status_code == 200
        order = db.orders.find_one({"provider_ref": "PP-COMPLETE-1"})
        assert order["status"] == "completed"
        assert order["provider"] == "paypal"
        assert order["customer_email"] == "buyer@example.com"

    @pytest.mark.parametrize("value,expected_cents", [
        ("8.20", 820),   # int(float("8.20") * 100) == 819 — the bug
        ("38.00", 3800),
        ("0.29", 29),
        ("1234.56", 123456),
    ])
    def test_decimal_amounts_convert_to_cents_without_losing_a_penny(self, client, paypal_project_id, db, value, expected_cents):
        # I2.
        ref = f"PP-MONEY-{value}"
        with patch.object(server, "_paypal_get_access_token", new=AsyncMock(return_value="tok")), \
             patch.object(server, "_paypal_get_order", new=AsyncMock(return_value=_fake_paypal_order(ref, value))):
            r = client.post("/api/commerce/paypal/verify", json={"project_id": paypal_project_id, "order_id": ref})
        assert r.status_code == 200
        assert db.orders.find_one({"provider_ref": ref})["amount_total"] == expected_cents


class TestConfirmationEmailFiresOnNewOrder:
    def test_a_new_completed_stripe_order_triggers_one_confirmation_email(self, client, db):
        db.projects.insert_one({"id": "proj-conf-new", "name": "Aurora Shop"})
        event = _fake_stripe_event()
        event["data"]["object"]["id"] = "cs_conf_new_1"
        event["data"]["object"]["metadata"] = {"project_id": "proj-conf-new"}
        with patch.object(stripe_sdk.Webhook, "construct_event", return_value=event), \
             patch.object(stripe_sdk.checkout.Session, "list_line_items", return_value=_fake_line_items()), \
             patch.object(server, "_send_email", new=AsyncMock()) as mock_send:
            client.post("/api/commerce/webhook", content=b"{}", headers={"Stripe-Signature": "valid"})
        mock_send.assert_called_once()
        args = mock_send.call_args[0]
        assert args[0] == "proj-conf-new"
        assert args[1] == "buyer@example.com"
        assert "Aurora Shop" in args[2]  # subject

    def test_the_same_stripe_event_delivered_twice_sends_only_one_email(self, client, db):
        db.projects.insert_one({"id": "proj-conf-dup", "name": "Aurora Shop"})
        event = _fake_stripe_event()
        event["data"]["object"]["id"] = "cs_conf_dup_1"
        event["data"]["object"]["metadata"] = {"project_id": "proj-conf-dup"}
        with patch.object(stripe_sdk.Webhook, "construct_event", return_value=event), \
             patch.object(stripe_sdk.checkout.Session, "list_line_items", return_value=_fake_line_items()), \
             patch.object(server, "_send_email", new=AsyncMock()) as mock_send:
            client.post("/api/commerce/webhook", content=b"{}", headers={"Stripe-Signature": "valid"})
            client.post("/api/commerce/webhook", content=b"{}", headers={"Stripe-Signature": "valid"})
        assert mock_send.call_count == 1

    def test_a_new_completed_paypal_order_triggers_one_confirmation_email(self, client, paypal_project_id, db):
        db.projects.update_one({"id": paypal_project_id}, {"$set": {"name": "Aurora Shop"}})
        with patch.object(server, "_paypal_get_access_token", new=AsyncMock(return_value="tok")), \
             patch.object(server, "_paypal_get_order", new=AsyncMock(return_value=_fake_paypal_order("PP-EMAIL-CONF-1"))), \
             patch.object(server, "_send_email", new=AsyncMock()) as mock_send:
            client.post("/api/commerce/paypal/verify", json={"project_id": paypal_project_id, "order_id": "PP-EMAIL-CONF-1"})
        mock_send.assert_called_once()
        assert mock_send.call_args[0][1] == "buyer@example.com"


def _minimal_order(provider_ref, project_id="proj-upsert-test"):
    return {
        "id": str(provider_ref) + "-id",
        "project_id": project_id,
        "provider": "stripe",
        "provider_ref": provider_ref,
        "status": "completed",
        "amount_total": 1000,
        "currency": "usd",
        "customer_email": "a@example.com",
        "customer_name": None,
        "shipping_address": None,
        "line_items": [],
        "fulfillment_status": "processing",
        "created_at": "2026-08-23T00:00:00Z",
    }


class TestUpsertOrderReturnsWhetherItInserted:
    @pytest.mark.asyncio
    async def test_a_new_order_returns_true(self):
        result = await server._upsert_order(_minimal_order("upsert-new-1"))
        assert result is True

    @pytest.mark.asyncio
    async def test_a_duplicate_provider_ref_returns_false_and_does_not_touch_the_row(self):
        order = _minimal_order("upsert-dup-1")
        first = await server._upsert_order(order)
        second = await server._upsert_order({**order, "customer_email": "different@example.com"})
        assert first is True
        assert second is False
        stored = await server.db.orders.find_one({"provider_ref": "upsert-dup-1"})
        assert stored["customer_email"] == "a@example.com"


class TestOrdersGetAFulfillmentStatusOnCreation:
    def test_a_stripe_order_starts_as_processing(self, client, db):
        with patch.object(stripe_sdk.Webhook, "construct_event", return_value=_fake_stripe_event()), \
             patch.object(stripe_sdk.checkout.Session, "list_line_items", return_value=_fake_line_items()):
            client.post("/api/commerce/webhook", content=b"{}", headers={"Stripe-Signature": "valid"})
        assert db.orders.find_one({"provider_ref": FAKE_SESSION_ID})["fulfillment_status"] == "processing"

    def test_a_paypal_order_starts_as_processing(self, client, paypal_project_id, db):
        with patch.object(server, "_paypal_get_access_token", new=AsyncMock(return_value="tok")), \
             patch.object(server, "_paypal_get_order", new=AsyncMock(return_value=_fake_paypal_order("PP-FULFILL-1"))):
            client.post("/api/commerce/paypal/verify", json={"project_id": paypal_project_id, "order_id": "PP-FULFILL-1"})
        assert db.orders.find_one({"provider_ref": "PP-FULFILL-1"})["fulfillment_status"] == "processing"


class TestReceiptEndpointDoesNotLeakPII:
    """I8: provider_ref travels in the published site's URL query string,
    where the merchant's own analytics scripts routinely log it."""

    def test_the_receipt_omits_email_and_shipping_address(self, client, db):
        db.orders.insert_one({
            "id": "receipt-o1", "project_id": "p", "provider": "stripe", "provider_ref": "cs_receipt_1",
            "status": "completed", "amount_total": 1999, "currency": "usd",
            "customer_email": "buyer@example.com", "customer_name": "Ada Lovelace",
            "shipping_address": {"line1": "221B Baker Street"},
            "line_items": [{"name": "Aurora Bottle", "quantity": 1}],
            "created_at": "2026-08-21T00:00:00Z",
        })
        body = client.get("/api/commerce/receipt/cs_receipt_1").json()
        assert set(body) == {"status", "amount_total", "currency", "line_items", "customer_name"}
        assert "buyer@example.com" not in json.dumps(body)
        assert "221B Baker Street" not in json.dumps(body)
        # Still carries everything the rendered receipt needs.
        assert body["amount_total"] == 1999
        assert body["customer_name"] == "Ada Lovelace"
        assert body["line_items"][0]["name"] == "Aurora Bottle"

    def test_an_unknown_reference_reports_processing(self, client):
        assert client.get("/api/commerce/receipt/no-such-ref").json() == {"status": "processing"}


class TestOrdersIndex:
    def test_provider_ref_index_is_created_when_the_backend_supports_indexes(self):
        # I1. sqlite_compat's dev shim has no create_index, so the startup hook
        # must no-op there rather than crash the app on boot.
        assert not hasattr(server.db.orders, "create_index")
        asyncio.run(server.ensure_indexes())  # must not raise on the SQLite shim

        created = []

        class FakeOrders:
            async def create_index(self, key, unique=False):
                created.append((key, unique))

        class FakeDb:
            orders = FakeOrders()

        with patch.object(server, "db", FakeDb()):
            asyncio.run(server.ensure_indexes())
        assert created == [("provider_ref", True)]


class TestSmtpConfigEndpoint:
    def _payload(self, project_id, **overrides):
        body = {
            "project_id": project_id, "host": "smtp.example.com", "port": 587,
            "username": "user@example.com", "password": "app-password", "from_address": "store@example.com",
        }
        body.update(overrides)
        return body

    def test_setting_the_config_encrypts_it_at_rest(self, client, project_id, db):
        r = client.post("/api/commerce/smtp-config", json=self._payload(project_id))
        assert r.status_code == 200
        stored = db.projects.find_one({"id": project_id})
        assert stored["smtp_config_enc"] != "app-password"
        decrypted = json.loads(server._decrypt(stored["smtp_config_enc"]))
        assert decrypted["host"] == "smtp.example.com"
        assert decrypted["password"] == "app-password"

    def test_project_get_response_never_includes_the_smtp_config(self, client, project_id):
        client.post("/api/commerce/smtp-config", json=self._payload(project_id))
        body = client.get(f"/api/projects/{project_id}").json()
        assert "smtp_config_enc" not in body
        assert "app-password" not in json.dumps(body)

    def test_replacing_an_existing_config_without_a_token_is_rejected(self, client, project_id, db):
        client.post("/api/commerce/smtp-config", json=self._payload(project_id))
        r = client.post("/api/commerce/smtp-config", json=self._payload(project_id, host="smtp2.example.com"))
        assert r.status_code == 401
        assert json.loads(server._decrypt(db.projects.find_one({"id": project_id})["smtp_config_enc"]))["host"] == "smtp.example.com"

    def test_replacing_an_existing_config_with_a_valid_token_succeeds(self, client, project_id, db):
        client.post("/api/commerce/smtp-config", json=self._payload(project_id))
        client.post(f"/api/dashboard/{project_id}/set-password", json={"password": "hunter22"})
        token = client.post(f"/api/dashboard/{project_id}/unlock", json={"password": "hunter22"}).json()["token"]
        r = client.post(
            "/api/commerce/smtp-config",
            json=self._payload(project_id, host="smtp2.example.com"),
            headers={"X-Dashboard-Token": token},
        )
        assert r.status_code == 200
        assert json.loads(server._decrypt(db.projects.find_one({"id": project_id})["smtp_config_enc"]))["host"] == "smtp2.example.com"

    def test_an_unknown_project_id_is_rejected(self, client):
        r = client.post("/api/commerce/smtp-config", json=self._payload("no-such-project"))
        assert r.status_code == 404


class TestEmailTemplates:
    def _order(self, **overrides):
        base = {
            "customer_name": "Ada Lovelace", "customer_email": "ada@example.com",
            "amount_total": 3800, "currency": "usd",
            "line_items": [{"name": "Aurora Bottle", "quantity": 1}],
            "shipping_address": None,
        }
        base.update(overrides)
        return base

    def test_confirmation_email_includes_order_details(self):
        subject, html_body = server._email_confirmation("Aurora Shop", self._order())
        assert "Aurora Shop" in subject
        assert "Ada Lovelace" in html_body
        assert "Aurora Bottle" in html_body
        assert "38.00 USD" in html_body

    def test_shipped_email_mentions_shipping_and_includes_the_address(self):
        subject, html_body = server._email_shipped("Aurora Shop", self._order(shipping_address={"line1": "221B Baker Street"}))
        assert "shipped" in subject.lower()
        assert "221B Baker Street" in html_body

    def test_delivered_email_confirms_delivery(self):
        subject, _ = server._email_delivered("Aurora Shop", self._order())
        assert "delivered" in subject.lower()

    def test_templates_escape_customer_supplied_text(self):
        # customer_name is buyer-controlled at checkout time; must not inject raw HTML.
        _, html_body = server._email_confirmation("Shop", self._order(customer_name="<script>alert(1)</script>"))
        assert "<script>" not in html_body


class TestSendEmail:
    @pytest.mark.asyncio
    async def test_does_nothing_when_the_project_has_no_smtp_config(self, project_id):
        with patch("smtplib.SMTP") as mock_smtp:
            await server._send_email(project_id, "buyer@example.com", "Subject", "<p>hi</p>")
        mock_smtp.assert_not_called()

    @pytest.mark.asyncio
    async def test_sends_via_the_projects_saved_smtp_config(self, project_id):
        await server.db.projects.update_one({"id": project_id}, {"$set": {"smtp_config_enc": server._encrypt(json.dumps({
            "host": "smtp.example.com", "port": 587, "username": "user@example.com",
            "password": "app-password", "from_address": "store@example.com",
        }))}})
        mock_conn = MagicMock()
        with patch("smtplib.SMTP") as mock_smtp:
            mock_smtp.return_value.__enter__.return_value = mock_conn
            await server._send_email(project_id, "buyer@example.com", "Order confirmed", "<p>Thanks!</p>")
        mock_smtp.assert_called_once_with("smtp.example.com", 587, timeout=10)
        mock_conn.starttls.assert_called_once()
        mock_conn.login.assert_called_once_with("user@example.com", "app-password")
        mock_conn.send_message.assert_called_once()
        sent_msg = mock_conn.send_message.call_args[0][0]
        assert sent_msg["To"] == "buyer@example.com"
        assert sent_msg["Subject"] == "Order confirmed"
        assert sent_msg["From"] == "store@example.com"

    @pytest.mark.asyncio
    async def test_swallows_smtp_errors_without_raising(self, project_id):
        await server.db.projects.update_one({"id": project_id}, {"$set": {"smtp_config_enc": server._encrypt(json.dumps({
            "host": "smtp.example.com", "port": 587, "username": "user@example.com",
            "password": "app-password", "from_address": "store@example.com",
        }))}})
        with patch("smtplib.SMTP", side_effect=OSError("connection refused")):
            await server._send_email(project_id, "buyer@example.com", "Subject", "<p>hi</p>")  # must not raise

    @pytest.mark.asyncio
    async def test_does_nothing_when_the_recipient_is_empty(self, project_id):
        await server.db.projects.update_one({"id": project_id}, {"$set": {"smtp_config_enc": server._encrypt(json.dumps({
            "host": "smtp.example.com", "port": 587, "username": "u", "password": "p", "from_address": "f",
        }))}})
        with patch("smtplib.SMTP") as mock_smtp:
            await server._send_email(project_id, "", "Subject", "<p>hi</p>")
        mock_smtp.assert_not_called()


class TestFulfillmentStatusEndpoint:
    def _seed_order(self, db, project_id, order_id, customer_email="buyer@example.com", fulfillment_status="processing"):
        db.orders.insert_one({
            "id": order_id, "project_id": project_id, "provider": "stripe", "provider_ref": f"ref-{order_id}",
            "status": "completed", "amount_total": 3800, "currency": "usd",
            "customer_email": customer_email, "customer_name": "Ada Lovelace",
            "shipping_address": {"line1": "221B Baker Street"},
            "line_items": [{"name": "Aurora Bottle", "quantity": 1}],
            "fulfillment_status": fulfillment_status,
            "created_at": "2026-08-23T00:00:00Z",
        })

    def _unlocked_token(self, client, project_id):
        client.post(f"/api/dashboard/{project_id}/set-password", json={"password": "hunter22"})
        return client.post(f"/api/dashboard/{project_id}/unlock", json={"password": "hunter22"}).json()["token"]

    def test_without_a_token_is_rejected(self, client, project_id, db):
        self._seed_order(db, project_id, "ord-no-token")
        r = client.patch(f"/api/dashboard/{project_id}/orders/ord-no-token/fulfillment", json={"fulfillment_status": "shipped"})
        assert r.status_code == 401

    def test_processing_to_shipped_updates_status_and_sends_one_email(self, client, project_id, db):
        self._seed_order(db, project_id, "ord-proc-ship")
        token = self._unlocked_token(client, project_id)
        with patch.object(server, "_send_email", new=AsyncMock()) as mock_send:
            r = client.patch(
                f"/api/dashboard/{project_id}/orders/ord-proc-ship/fulfillment",
                json={"fulfillment_status": "shipped"},
                headers={"X-Dashboard-Token": token},
            )
        assert r.status_code == 200
        assert r.json()["fulfillment_status"] == "shipped"
        assert db.orders.find_one({"id": "ord-proc-ship"})["fulfillment_status"] == "shipped"
        mock_send.assert_called_once()
        assert "shipped" in mock_send.call_args[0][2].lower()

    def test_shipped_to_delivered_sends_the_delivered_email(self, client, project_id, db):
        self._seed_order(db, project_id, "ord-ship-del", fulfillment_status="shipped")
        token = self._unlocked_token(client, project_id)
        with patch.object(server, "_send_email", new=AsyncMock()) as mock_send:
            r = client.patch(
                f"/api/dashboard/{project_id}/orders/ord-ship-del/fulfillment",
                json={"fulfillment_status": "delivered"},
                headers={"X-Dashboard-Token": token},
            )
        assert r.status_code == 200
        assert "delivered" in mock_send.call_args[0][2].lower()

    @pytest.mark.parametrize("current,requested", [("processing", "processing"), ("processing", "delivered"), ("delivered", "shipped")])
    def test_invalid_transitions_are_rejected_and_send_no_email(self, client, project_id, db, current, requested):
        order_id = f"ord-invalid-{current}-{requested}"
        self._seed_order(db, project_id, order_id, fulfillment_status=current)
        token = self._unlocked_token(client, project_id)
        with patch.object(server, "_send_email", new=AsyncMock()) as mock_send:
            r = client.patch(
                f"/api/dashboard/{project_id}/orders/{order_id}/fulfillment",
                json={"fulfillment_status": requested},
                headers={"X-Dashboard-Token": token},
            )
        assert r.status_code == 400
        mock_send.assert_not_called()

    def test_an_order_belonging_to_a_different_project_returns_404(self, client, project_id, db):
        self._seed_order(db, "some-other-project", "ord-foreign")
        token = self._unlocked_token(client, project_id)
        r = client.patch(
            f"/api/dashboard/{project_id}/orders/ord-foreign/fulfillment",
            json={"fulfillment_status": "shipped"},
            headers={"X-Dashboard-Token": token},
        )
        assert r.status_code == 404

    def test_an_order_with_no_customer_email_sends_no_email_but_still_updates(self, client, project_id, db):
        self._seed_order(db, project_id, "ord-no-email", customer_email=None)
        token = self._unlocked_token(client, project_id)
        with patch.object(server, "_send_email", new=AsyncMock()) as mock_send:
            r = client.patch(
                f"/api/dashboard/{project_id}/orders/ord-no-email/fulfillment",
                json={"fulfillment_status": "shipped"},
                headers={"X-Dashboard-Token": token},
            )
        assert r.status_code == 200
        mock_send.assert_not_called()


class TestCustomersEndpoint:
    def _unlocked_token(self, client, project_id):
        client.post(f"/api/dashboard/{project_id}/set-password", json={"password": "hunter22"})
        return client.post(f"/api/dashboard/{project_id}/unlock", json={"password": "hunter22"}).json()["token"]

    def _order(self, order_id, project_id, email, amount, created_at, name=None):
        return {
            "id": order_id, "project_id": project_id, "provider": "stripe", "provider_ref": f"ref-{order_id}",
            "status": "completed", "amount_total": amount, "currency": "usd",
            "customer_email": email, "customer_name": name, "shipping_address": None,
            "line_items": [], "fulfillment_status": "processing", "created_at": created_at,
        }

    def test_without_a_token_is_rejected(self, client, project_id):
        r = client.get(f"/api/dashboard/{project_id}/customers")
        assert r.status_code == 401

    def test_two_orders_same_email_collapse_into_one_customer_with_summed_ltv(self, client, project_id, db):
        db.orders.insert_one(self._order("c-o1", project_id, "Buyer@Example.com", 1000, "2026-08-20T00:00:00Z", "Ada"))
        db.orders.insert_one(self._order("c-o2", project_id, "buyer@example.com", 2500, "2026-08-22T00:00:00Z", "Ada Lovelace"))
        token = self._unlocked_token(client, project_id)
        body = client.get(f"/api/dashboard/{project_id}/customers", headers={"X-Dashboard-Token": token}).json()
        assert len(body["customers"]) == 1
        c = body["customers"][0]
        assert c["email"] == "buyer@example.com"
        assert c["order_count"] == 2
        assert c["ltv"] == 3500
        assert c["name"] == "Ada Lovelace"
        assert c["last_order_at"] == "2026-08-22T00:00:00Z"

    def test_different_emails_stay_as_separate_customers(self, client, project_id, db):
        db.orders.insert_one(self._order("sep-o1", project_id, "a@example.com", 1000, "2026-08-21T00:00:00Z"))
        db.orders.insert_one(self._order("sep-o2", project_id, "b@example.com", 1000, "2026-08-21T00:00:00Z"))
        token = self._unlocked_token(client, project_id)
        body = client.get(f"/api/dashboard/{project_id}/customers", headers={"X-Dashboard-Token": token}).json()
        assert len(body["customers"]) == 2

    def test_an_order_with_no_customer_email_is_excluded_but_still_in_the_orders_list(self, client, project_id, db):
        db.orders.insert_one(self._order("no-email-o1", project_id, None, 1000, "2026-08-21T00:00:00Z"))
        token = self._unlocked_token(client, project_id)
        assert client.get(f"/api/dashboard/{project_id}/customers", headers={"X-Dashboard-Token": token}).json()["customers"] == []
        orders_body = client.get(f"/api/dashboard/{project_id}/orders", headers={"X-Dashboard-Token": token}).json()
        assert len(orders_body["orders"]) == 1

    def test_customers_from_other_projects_are_excluded(self, client, project_id, db):
        db.orders.insert_one(self._order("other-o1", "some-other-project", "x@example.com", 1000, "2026-08-21T00:00:00Z"))
        token = self._unlocked_token(client, project_id)
        assert client.get(f"/api/dashboard/{project_id}/customers", headers={"X-Dashboard-Token": token}).json()["customers"] == []

    def test_customers_are_sorted_by_ltv_descending_by_default(self, client, project_id, db):
        db.orders.insert_one(self._order("ltv-o1", project_id, "low@example.com", 500, "2026-08-21T00:00:00Z"))
        db.orders.insert_one(self._order("ltv-o2", project_id, "high@example.com", 5000, "2026-08-21T00:00:00Z"))
        token = self._unlocked_token(client, project_id)
        body = client.get(f"/api/dashboard/{project_id}/customers", headers={"X-Dashboard-Token": token}).json()
        assert [c["email"] for c in body["customers"]] == ["high@example.com", "low@example.com"]


class TestAnalyticsRevenueAndFunnel:
    def _unlocked_token(self, client, project_id):
        client.post(f"/api/dashboard/{project_id}/set-password", json={"password": "hunter22"})
        return client.post(f"/api/dashboard/{project_id}/unlock", json={"password": "hunter22"}).json()["token"]

    def _order(self, order_id, project_id, amount, created_at, fulfillment_status="processing", email="buyer@example.com"):
        return {
            "id": order_id, "project_id": project_id, "provider": "stripe", "provider_ref": f"ref-{order_id}",
            "status": "completed", "amount_total": amount, "currency": "usd",
            "customer_email": email, "customer_name": None, "shipping_address": None,
            "line_items": [], "fulfillment_status": fulfillment_status, "created_at": created_at,
        }

    def test_without_a_token_is_rejected(self, client, project_id):
        r = client.get(f"/api/dashboard/{project_id}/analytics")
        assert r.status_code == 401

    def test_revenue_trend_has_30_days_and_groups_same_day_orders(self, client, project_id, db):
        today_str = datetime.now(timezone.utc).date().isoformat()
        db.orders.insert_one(self._order("an-rev-1", project_id, 1000, f"{today_str}T09:00:00Z"))
        db.orders.insert_one(self._order("an-rev-2", project_id, 2500, f"{today_str}T15:00:00Z"))
        token = self._unlocked_token(client, project_id)
        body = client.get(f"/api/dashboard/{project_id}/analytics", headers={"X-Dashboard-Token": token}).json()
        assert len(body["revenue_trend"]) == 30
        todays_bucket = next(d for d in body["revenue_trend"] if d["date"] == today_str)
        assert todays_bucket["order_count"] == 2
        assert todays_bucket["revenue"] == 3500

    def test_a_day_with_no_orders_still_appears_with_zero_count(self, client, project_id, db):
        token = self._unlocked_token(client, project_id)
        body = client.get(f"/api/dashboard/{project_id}/analytics", headers={"X-Dashboard-Token": token}).json()
        assert all(d["order_count"] == 0 for d in body["revenue_trend"])

    def test_orders_outside_the_30_day_window_are_excluded(self, client, project_id, db):
        today = datetime.now(timezone.utc).date()
        old_date = (today - timedelta(days=40)).isoformat()
        db.orders.insert_one(self._order("an-rev-old-1", project_id, 9999, f"{old_date}T00:00:00Z"))
        token = self._unlocked_token(client, project_id)
        body = client.get(f"/api/dashboard/{project_id}/analytics", headers={"X-Dashboard-Token": token}).json()
        assert sum(d["order_count"] for d in body["revenue_trend"]) == 0

    def test_fulfillment_funnel_counts_orders_by_status(self, client, project_id, db):
        today_str = datetime.now(timezone.utc).date().isoformat()
        db.orders.insert_one(self._order("an-fun-1", project_id, 1000, f"{today_str}T00:00:00Z", fulfillment_status="processing"))
        db.orders.insert_one(self._order("an-fun-2", project_id, 1000, f"{today_str}T00:00:00Z", fulfillment_status="shipped"))
        db.orders.insert_one(self._order("an-fun-3", project_id, 1000, f"{today_str}T00:00:00Z", fulfillment_status="delivered"))
        db.orders.insert_one(self._order("an-fun-4", project_id, 1000, f"{today_str}T00:00:00Z", fulfillment_status="delivered"))
        token = self._unlocked_token(client, project_id)
        body = client.get(f"/api/dashboard/{project_id}/analytics", headers={"X-Dashboard-Token": token}).json()
        assert body["fulfillment_funnel"] == {"processing": 1, "shipped": 1, "delivered": 2}

    def test_an_order_missing_fulfillment_status_defaults_to_processing(self, client, project_id, db):
        today_str = datetime.now(timezone.utc).date().isoformat()
        order = self._order("an-fun-legacy-1", project_id, 1000, f"{today_str}T00:00:00Z")
        del order["fulfillment_status"]
        db.orders.insert_one(order)
        token = self._unlocked_token(client, project_id)
        body = client.get(f"/api/dashboard/{project_id}/analytics", headers={"X-Dashboard-Token": token}).json()
        assert body["fulfillment_funnel"]["processing"] == 1

    def test_orders_from_other_projects_are_excluded(self, client, project_id, db):
        today_str = datetime.now(timezone.utc).date().isoformat()
        db.orders.insert_one(self._order("an-rev-other-1", "some-other-project", 9999, f"{today_str}T00:00:00Z"))
        token = self._unlocked_token(client, project_id)
        body = client.get(f"/api/dashboard/{project_id}/analytics", headers={"X-Dashboard-Token": token}).json()
        assert sum(d["order_count"] for d in body["revenue_trend"]) == 0


class TestAnalyticsCustomerBreakdown:
    def _unlocked_token(self, client, project_id):
        client.post(f"/api/dashboard/{project_id}/set-password", json={"password": "hunter22"})
        return client.post(f"/api/dashboard/{project_id}/unlock", json={"password": "hunter22"}).json()["token"]

    def _order(self, order_id, project_id, email, amount, created_at):
        return {
            "id": order_id, "project_id": project_id, "provider": "stripe", "provider_ref": f"ref-{order_id}",
            "status": "completed", "amount_total": amount, "currency": "usd",
            "customer_email": email, "customer_name": None, "shipping_address": None,
            "line_items": [], "fulfillment_status": "processing", "created_at": created_at,
        }

    def test_customer_whose_first_ever_order_is_in_the_window_is_new(self, client, project_id, db):
        today_str = datetime.now(timezone.utc).date().isoformat()
        db.orders.insert_one(self._order("an-cb-new-1", project_id, "new@example.com", 1000, f"{today_str}T00:00:00Z"))
        token = self._unlocked_token(client, project_id)
        body = client.get(f"/api/dashboard/{project_id}/analytics", headers={"X-Dashboard-Token": token}).json()
        assert body["customer_breakdown"]["new_customers"] == 1
        assert body["customer_breakdown"]["returning_customers"] == 0
        assert body["customer_breakdown"]["new_revenue"] == 1000

    def test_customer_with_an_order_before_the_window_who_orders_again_inside_it_is_returning(self, client, project_id, db):
        today = datetime.now(timezone.utc).date()
        today_str = today.isoformat()
        old_str = (today - timedelta(days=40)).isoformat()
        db.orders.insert_one(self._order("an-cb-ret-old-1", project_id, "returning@example.com", 500, f"{old_str}T00:00:00Z"))
        db.orders.insert_one(self._order("an-cb-ret-new-1", project_id, "returning@example.com", 1500, f"{today_str}T00:00:00Z"))
        token = self._unlocked_token(client, project_id)
        body = client.get(f"/api/dashboard/{project_id}/analytics", headers={"X-Dashboard-Token": token}).json()
        assert body["customer_breakdown"]["returning_customers"] == 1
        assert body["customer_breakdown"]["new_customers"] == 0
        assert body["customer_breakdown"]["returning_revenue"] == 1500

    def test_a_customer_who_only_ordered_before_the_window_does_not_appear_at_all(self, client, project_id, db):
        today = datetime.now(timezone.utc).date()
        old_str = (today - timedelta(days=40)).isoformat()
        db.orders.insert_one(self._order("an-cb-onlyold-1", project_id, "onlyold@example.com", 700, f"{old_str}T00:00:00Z"))
        token = self._unlocked_token(client, project_id)
        body = client.get(f"/api/dashboard/{project_id}/analytics", headers={"X-Dashboard-Token": token}).json()
        assert body["customer_breakdown"]["new_customers"] == 0
        assert body["customer_breakdown"]["returning_customers"] == 0

    def test_revenue_splits_sum_correctly_across_multiple_new_customers(self, client, project_id, db):
        today_str = datetime.now(timezone.utc).date().isoformat()
        db.orders.insert_one(self._order("an-cb-sum-1", project_id, "sumnew1@example.com", 1000, f"{today_str}T00:00:00Z"))
        db.orders.insert_one(self._order("an-cb-sum-2", project_id, "sumnew2@example.com", 2000, f"{today_str}T00:00:00Z"))
        token = self._unlocked_token(client, project_id)
        body = client.get(f"/api/dashboard/{project_id}/analytics", headers={"X-Dashboard-Token": token}).json()
        assert body["customer_breakdown"]["new_customers"] == 2
        assert body["customer_breakdown"]["new_revenue"] == 3000

    def test_orders_with_no_customer_email_are_excluded_from_breakdown(self, client, project_id, db):
        today_str = datetime.now(timezone.utc).date().isoformat()
        db.orders.insert_one(self._order("an-cb-noemail-1", project_id, None, 1000, f"{today_str}T00:00:00Z"))
        token = self._unlocked_token(client, project_id)
        body = client.get(f"/api/dashboard/{project_id}/analytics", headers={"X-Dashboard-Token": token}).json()
        assert body["customer_breakdown"]["new_customers"] == 0
        assert body["customer_breakdown"]["returning_customers"] == 0
