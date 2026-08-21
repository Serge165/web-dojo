import asyncio
import atexit
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
from unittest.mock import MagicMock, patch

import server
from sqlite_compat import SqliteClient

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
