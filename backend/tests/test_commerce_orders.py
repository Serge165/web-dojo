import asyncio
import atexit
import json
import os
import tempfile
import time
from unittest.mock import patch

# Matches test_security_fixes.py / test_audit_fixes.py: a default so `import
# server` below doesn't crash on a missing MONGO_URL if this module happens
# to be the first to import it in a given pytest-xdist worker.
os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "webdojo_test")
# The webhook route just needs this non-empty to pass its "is Stripe
# configured" guard — signature verification itself is mocked per-test.
os.environ.setdefault("STRIPE_WEBHOOK_SECRET", "whsec_test_dummy")

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

    def test_a_valid_completed_session_event_creates_an_order(self, client):
        with patch.object(stripe_sdk.Webhook, "construct_event", return_value=_fake_stripe_event()), \
             patch.object(stripe_sdk.checkout.Session, "list_line_items", return_value=_fake_line_items()):
            r = client.post("/api/commerce/webhook", content=b"{}", headers={"Stripe-Signature": "valid"})
        assert r.status_code == 200
        order = client.get(f"/api/commerce/receipt/{FAKE_SESSION_ID}").json()
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

    def test_a_duplicate_delivery_does_not_change_the_order_id(self, client):
        with patch.object(stripe_sdk.Webhook, "construct_event", return_value=_fake_stripe_event()), \
             patch.object(stripe_sdk.checkout.Session, "list_line_items", return_value=_fake_line_items()):
            client.post("/api/commerce/webhook", content=b"{}", headers={"Stripe-Signature": "valid"})
            first_id = client.get(f"/api/commerce/receipt/{FAKE_SESSION_ID}").json()["id"]
            client.post("/api/commerce/webhook", content=b"{}", headers={"Stripe-Signature": "valid"})
            second_id = client.get(f"/api/commerce/receipt/{FAKE_SESSION_ID}").json()["id"]
        assert first_id == second_id


class TestCheckoutSessionProjectId:
    def test_checkout_session_without_project_id_is_rejected(self, client):
        r = client.post("/api/commerce/checkout-session", json={
            "items": [{"name": "Aurora Bottle", "amount": 3800, "currency": "usd", "quantity": 1}],
        })
        assert r.status_code == 422  # Pydantic validation error — project_id is required

    def test_checkout_session_passes_project_id_through_as_stripe_metadata(self, client):
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
                "project_id": "proj-123",
            })
        assert r.status_code == 200
        assert captured["metadata"] == {"project_id": "proj-123"}
        assert captured["allow_promotion_codes"] is True
        assert captured["billing_address_collection"] == "required"
        assert "shipping_address_collection" in captured


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


class TestPaypalVerify:
    def test_an_order_that_is_not_completed_is_rejected(self, client):
        with patch.object(server, "_paypal_get_access_token", new=AsyncMock(return_value="tok")), \
             patch.object(server, "_paypal_get_order", new=AsyncMock(return_value={"id": "PP-1", "status": "CREATED"})):
            r = client.post("/api/commerce/paypal/verify", json={"project_id": "proj-123", "order_id": "PP-1"})
        assert r.status_code == 400

    def test_a_completed_paypal_order_creates_a_record(self, client, project_id, db):
        db.projects.update_one(
            {"id": project_id},
            {"$set": {"paypal_secret_enc": server._encrypt("shh-secret"), "paypal_client_id": "client-abc"}},
        )
        fake_order = {
            "id": "PP-COMPLETE-1",
            "status": "COMPLETED",
            "purchase_units": [{"amount": {"value": "38.00", "currency_code": "USD"}}],
            "payer": {"email_address": "buyer@example.com", "name": {"given_name": "Ada"}},
        }
        with patch.object(server, "_paypal_get_access_token", new=AsyncMock(return_value="tok")), \
             patch.object(server, "_paypal_get_order", new=AsyncMock(return_value=fake_order)):
            r = client.post("/api/commerce/paypal/verify", json={"project_id": project_id, "order_id": "PP-COMPLETE-1"})
        assert r.status_code == 200
        receipt = client.get("/api/commerce/receipt/PP-COMPLETE-1").json()
        assert receipt["status"] == "completed"
        assert receipt["provider"] == "paypal"
        assert receipt["customer_email"] == "buyer@example.com"
