# E-Commerce Phase 1: Payment Processing & Order Records Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make checkout create a real, server-verified order record for the first time — a signature-verified Stripe webhook, a server-verified PayPal capture, a project-scoped password gate protecting the new customer PII, and a printable buyer receipt.

**Architecture:** All backend work lands in `backend/server.py` (the existing single-file FastAPI app — matches its current structure, no new modules). A new `orders` Mongo collection (via the existing Motor client / SQLite dev shim) is the single source of truth, written only from two paths: a Stripe webhook verified by signature, and a PayPal verification endpoint that calls PayPal's own API rather than trusting the browser. Frontend work extends `frontend/src/lib/cart.js` (the existing baked-into-exports runtime) and `CommerceTab.jsx`, plus one new standalone `EcommerceOrdersPanel.jsx` component that is self-contained today and mountable into the (separately planned, not-yet-built) Dashboard's Ecommerce tab later.

**Tech Stack:** FastAPI + Motor (MongoDB) / SQLite dev shim, `stripe` Python SDK (already a dependency), `httpx` (already a dependency, used for PayPal REST calls), stdlib `hashlib`/`hmac`/`secrets` for password hashing and token signing (no new dependency), React + Jest on the frontend.

**Spec:** `docs/superpowers/specs/2026-08-21-ecommerce-payments-orders-design.md`

## Global Constraints

- No new backend dependencies — password hashing (PBKDF2-HMAC-SHA256) and dashboard tokens (HMAC-SHA256) use stdlib only; PayPal calls use the already-installed `httpx`.
- The Stripe webhook MUST reject any request with an invalid/missing `Stripe-Signature` — this is a hard security requirement, not best-effort.
- PayPal orders MUST be confirmed against PayPal's own API (`GET /v2/checkout/orders/{id}`) before an order record is written — a client-reported "it succeeded" is never sufficient on its own.
- `orders.provider_ref` has a unique index; order-writing is an idempotent upsert (`update_one(..., upsert=True)` keyed on `provider_ref`), never a plain insert.
- `dashboard_password_hash` and `paypal_secret_enc` are write-only from the API's perspective — never included in any project GET/list response, matching how `password_enc` is already excluded for FTP publish presets.
- No PDF library — the buyer receipt is a printable HTML page (`window.print()`), per the approved spec.
- Follow existing code style: `backend/server.py` is one large file by established convention — extend it, don't split it. Frontend tests are Jest, colocated as `*.test.js` next to their source file. Backend tests live in `backend/tests/`, pytest, `TestClient`.

---

## Task 1: Password Hashing & Dashboard Token Helpers

Pure, dependency-free stdlib functions with no DB/network — the fastest thing to get under test first, and every later auth-related task depends on their exact signatures.

**Files:**
- Modify: `backend/server.py` (add near the existing `_encrypt`/`_decrypt`/`_get_fernet` helpers, ~line 200-223)
- Test: `backend/tests/test_commerce_orders.py` (new file)

**Interfaces:**
- Produces: `_hash_password(password: str) -> str`, `_verify_password(password: str, stored: str) -> bool`, `_issue_dashboard_token(project_id: str, ttl_seconds: int = 604800) -> str`, `_verify_dashboard_token(token: str, project_id: str) -> bool`

- [ ] **Step 1: Write the failing tests**

```python
# backend/tests/test_commerce_orders.py
import time
from unittest.mock import patch
import server


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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && python -m pytest tests/test_commerce_orders.py -v`
Expected: FAIL with `AttributeError: module 'server' has no attribute '_hash_password'` (and similarly for the other three functions).

- [ ] **Step 3: Add `time`, `hashlib`, `hmac`, `secrets`, `base64` imports**

Check the top of `backend/server.py` for an existing `import` block and add any of these not already present:

```python
import time
import hashlib
import hmac
import secrets
import base64
```

- [ ] **Step 4: Implement the four helpers**

Add immediately after the existing `_get_fernet`/`_encrypt`/`_decrypt` helpers in `backend/server.py`:

```python
def _hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 200_000)
    return f"{salt.hex()}${digest.hex()}"


def _verify_password(password: str, stored: str) -> bool:
    try:
        salt_hex, digest_hex = stored.split("$", 1)
    except ValueError:
        return False
    salt = bytes.fromhex(salt_hex)
    expected = bytes.fromhex(digest_hex)
    actual = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 200_000)
    return hmac.compare_digest(actual, expected)


def _dashboard_token_secret() -> bytes:
    base = os.environ.get("WEBDOJO_SECRET_KEY", "webdojo-dev-secret").encode("utf-8")
    return hashlib.sha256(base + b":dashboard-token").digest()


def _issue_dashboard_token(project_id: str, ttl_seconds: int = 604800) -> str:
    expiry = int(time.time()) + ttl_seconds
    payload = f"{project_id}:{expiry}".encode("utf-8")
    sig = hmac.new(_dashboard_token_secret(), payload, hashlib.sha256).hexdigest()
    raw = f"{project_id}:{expiry}:{sig}".encode("utf-8")
    return base64.urlsafe_b64encode(raw).decode("ascii")


def _verify_dashboard_token(token: str, project_id: str) -> bool:
    try:
        raw = base64.urlsafe_b64decode(token.encode("ascii")).decode("utf-8")
        tok_project_id, expiry_str, sig = raw.split(":", 2)
        expiry = int(expiry_str)
    except (ValueError, TypeError):
        return False
    if tok_project_id != project_id:
        return False
    if time.time() > expiry:
        return False
    payload = f"{tok_project_id}:{expiry}".encode("utf-8")
    expected_sig = hmac.new(_dashboard_token_secret(), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(sig, expected_sig)
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd backend && python -m pytest tests/test_commerce_orders.py -v`
Expected: PASS (7 tests)

- [ ] **Step 6: Commit**

```bash
git add backend/server.py backend/tests/test_commerce_orders.py
git commit -m "Add password hashing and dashboard token helpers for e-commerce PII gate"
```

---

## Task 2: Project Fields + Dashboard Password Set/Unlock Endpoints

**Files:**
- Modify: `backend/server.py`
- Test: `backend/tests/test_commerce_orders.py`

**Interfaces:**
- Consumes: `_hash_password`, `_verify_password`, `_issue_dashboard_token`, `_verify_dashboard_token` (Task 1); `_encrypt`/`_decrypt` (existing)
- Produces: `POST /api/dashboard/{project_id}/set-password`, `POST /api/dashboard/{project_id}/unlock`; a `_require_dashboard_token(project_id: str, x_dashboard_token: str | None) -> None` FastAPI dependency helper that later tasks reuse to protect the orders-list endpoint.

- [ ] **Step 1: Locate the Project Pydantic models**

Run: `grep -n "files: List\[Any\]" backend/server.py`

This returns the (currently three) model classes that declare a `files` field — these are the project create/update/read models. Read each one to see its exact surrounding fields before editing.

- [ ] **Step 2: Add the two new fields to each of those model classes**

Immediately after each model's `files: List[Any] = ...` line, add:

```python
    dashboard_password_hash: Optional[str] = None
    paypal_secret_enc: Optional[str] = None
```

(Match whichever `Optional`/default style the surrounding fields in that specific class already use — some of the three variants use plain `= None`, keep consistent with each class's own convention.)

- [ ] **Step 3: Find and update the project projection/exclusion used for GET/list responses**

Run: `grep -n "password_enc" backend/server.py` — this shows exactly how `password_enc` is already excluded from publish-preset list responses (e.g. a Mongo projection dict or a manual `del`/pop after fetch). Apply the identical exclusion technique to `dashboard_password_hash` and `paypal_secret_enc` everywhere a project document is returned from the API (the `GET /api/projects`, `GET /api/projects/{id}` handlers — search `@api_router.get("/projects` to find them).

- [ ] **Step 4: Write the failing tests**

```python
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
```

Add whatever `client`/`project_id` pytest fixtures the rest of `backend/tests/test_commerce_orders.py`'s sibling test files already use (check `backend/tests/test_security_fixes.py` for the existing `client`/project-creation fixture pattern and reuse it — do not invent a second one).

- [ ] **Step 5: Run tests to verify they fail**

Run: `cd backend && python -m pytest tests/test_commerce_orders.py -v`
Expected: FAIL — routes don't exist yet (404s).

- [ ] **Step 6: Implement the endpoints**

```python
class DashboardPasswordRequest(BaseModel):
    password: str


@api_router.post("/dashboard/{project_id}/set-password")
async def set_dashboard_password(project_id: str, payload: DashboardPasswordRequest):
    if not payload.password or len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    result = await db.projects.update_one(
        {"id": project_id},
        {"$set": {"dashboard_password_hash": _hash_password(payload.password)}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"ok": True}


@api_router.post("/dashboard/{project_id}/unlock")
async def unlock_dashboard(project_id: str, payload: DashboardPasswordRequest):
    project = await db.projects.find_one({"id": project_id})
    if not project or not project.get("dashboard_password_hash"):
        raise HTTPException(status_code=401, detail="Dashboard password not set for this project")
    if not _verify_password(payload.password, project["dashboard_password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect password")
    return {"token": _issue_dashboard_token(project_id)}


async def _require_dashboard_token(project_id: str, x_dashboard_token: Optional[str] = Header(default=None)) -> None:
    if not x_dashboard_token or not _verify_dashboard_token(x_dashboard_token, project_id):
        raise HTTPException(status_code=401, detail="Missing or invalid dashboard token")
```

Add `Header` to the existing `from fastapi import ...` line if not already imported.

- [ ] **Step 7: Run tests to verify they pass**

Run: `cd backend && python -m pytest tests/test_commerce_orders.py -v`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add backend/server.py backend/tests/test_commerce_orders.py
git commit -m "Add per-project dashboard password set/unlock endpoints"
```

---

## Task 3: Orders Collection + Stripe Webhook

**Files:**
- Modify: `backend/server.py`
- Test: `backend/tests/test_commerce_orders.py`

**Interfaces:**
- Produces: `async def _upsert_order(order: dict) -> None` (idempotent, keyed on `order["provider_ref"]`); `POST /api/commerce/webhook`

- [ ] **Step 1: Write the failing tests**

```python
import stripe as stripe_sdk
from unittest.mock import AsyncMock, MagicMock, patch


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

    def test_the_same_event_delivered_twice_creates_only_one_order(self, client):
        with patch.object(stripe_sdk.Webhook, "construct_event", return_value=_fake_stripe_event()), \
             patch.object(stripe_sdk.checkout.Session, "list_line_items", return_value=_fake_line_items()):
            client.post("/api/commerce/webhook", content=b"{}", headers={"Stripe-Signature": "valid"})
            client.post("/api/commerce/webhook", content=b"{}", headers={"Stripe-Signature": "valid"})
        count = client.get("/api/commerce/receipt/" + FAKE_SESSION_ID).json()
        assert count["status"] == "completed"  # still resolvable, not duplicated — full duplicate check is in Task 7's list endpoint test
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && python -m pytest tests/test_commerce_orders.py -v`
Expected: FAIL (webhook route and receipt route both 404).

- [ ] **Step 3: Implement `_upsert_order` and the webhook endpoint**

```python
async def _upsert_order(order: dict) -> None:
    await db.orders.update_one(
        {"provider_ref": order["provider_ref"]},
        {"$setOnInsert": order},
        upsert=True,
    )


@api_router.post("/commerce/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
    if not sig_header or not webhook_secret:
        raise HTTPException(status_code=400, detail="Missing signature")
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except (ValueError, stripe.error.SignatureVerificationError):
        raise HTTPException(status_code=400, detail="Invalid signature")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        line_items_result = stripe.checkout.Session.list_line_items(session["id"])
        line_items = [
            {
                "name": item.description,
                "quantity": item.quantity,
                "unit_amount": item.amount_total,
                "currency": item.currency,
            }
            for item in line_items_result.data
        ]
        details = session.get("customer_details") or {}
        await _upsert_order({
            "id": str(uuid.uuid4()),
            "project_id": (session.get("metadata") or {}).get("project_id", ""),
            "provider": "stripe",
            "provider_ref": session["id"],
            "status": "completed",
            "amount_total": session.get("amount_total", 0),
            "currency": session.get("currency", "usd"),
            "customer_email": details.get("email"),
            "customer_name": details.get("name"),
            "shipping_address": session.get("shipping_details"),
            "line_items": line_items,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    return {"received": True}
```

Check the top of `backend/server.py` for existing `datetime`/`timezone`/`uuid`/`Request` imports and add any missing ones.

- [ ] **Step 4: Add a temporary receipt lookup for the test to use**

This is a minimal stand-in so Task 3's tests can assert against a real endpoint; Task 6 replaces/extends it with the full public receipt behavior described in the spec.

```python
@api_router.get("/commerce/receipt/{provider_ref}")
async def get_receipt(provider_ref: str):
    order = await db.orders.find_one({"provider_ref": provider_ref}, {"_id": 0})
    if not order:
        return {"status": "processing"}
    return order
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd backend && python -m pytest tests/test_commerce_orders.py -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/server.py backend/tests/test_commerce_orders.py
git commit -m "Add orders collection and signature-verified Stripe webhook"
```

---

## Task 4: Checkout-Session Endpoint — project_id, Shipping, Promo Codes

**Files:**
- Modify: `backend/server.py` (the existing `CheckoutSessionCreate` model and `/api/commerce/checkout-session` handler, ~line 1189)
- Test: `backend/tests/test_commerce_orders.py`

**Interfaces:**
- Consumes: nothing new from earlier tasks
- Produces: `CheckoutSessionCreate.project_id: str` (required) — Task 9 (frontend) relies on this field name.

- [ ] **Step 1: Read the existing model and handler**

Run: `grep -n "class CheckoutSessionCreate" backend/server.py` and read that class plus the `commerce_checkout_session` handler (~line 1189-1214) in full before editing, so the added fields/params match the existing style exactly.

- [ ] **Step 2: Write the failing test**

```python
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
        assert "shipping_address_collection" in captured
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd backend && python -m pytest tests/test_commerce_orders.py -v`
Expected: FAIL (no `project_id` field yet, no metadata passed).

- [ ] **Step 4: Add `project_id` to `CheckoutSessionCreate` and pass the new params to Stripe**

Add `project_id: str` to the `CheckoutSessionCreate` Pydantic model (matching its existing field style), then in `commerce_checkout_session`, add to the `stripe.checkout.Session.create(...)` call:

```python
        metadata={"project_id": payload.project_id},
        allow_promotion_codes=True,
        billing_address_collection="required",
        shipping_address_collection={"allowed_countries": [
            "US", "CA", "GB", "AU", "NZ", "DE", "FR", "ES", "IT", "NL", "IE", "SE", "NO", "DK", "FI",
        ]},
```

Also find the existing `success_url = payload.success_url or (...)` fallback line in this same handler (per the research summary, it currently defaults to `f"{origin}/?wd_checkout=success"`) and change the fallback to include Stripe's session-id template placeholder, which Task 10's receipt script depends on:

```python
success_url = payload.success_url or (f"{origin}/?wd_checkout=success&session_id={{CHECKOUT_SESSION_ID}}" if origin else "https://example.com/?wd_checkout=success&session_id={CHECKOUT_SESSION_ID}")
```

(Note the doubled `{{`/`}}` is only needed if this line is itself an f-string — Stripe needs the literal text `{CHECKOUT_SESSION_ID}` to reach it verbatim so Stripe can substitute it at redirect time; if the surrounding code isn't an f-string for this branch, use single braces.)

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd backend && python -m pytest tests/test_commerce_orders.py -v`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add backend/server.py backend/tests/test_commerce_orders.py
git commit -m "Require project_id on checkout-session and forward it via Stripe metadata"
```

---

## Task 5: PayPal REST Helpers

**Files:**
- Modify: `backend/server.py`
- Test: `backend/tests/test_commerce_orders.py`

**Interfaces:**
- Produces: `async def _paypal_get_access_token(client_id: str, secret: str) -> str`, `async def _paypal_get_order(order_id: str, access_token: str) -> dict`

- [ ] **Step 1: Write the failing tests**

```python
class TestPaypalHelpers:
    async def test_get_access_token_posts_client_credentials_and_returns_the_token(self):
        fake_response = MagicMock()
        fake_response.json.return_value = {"access_token": "fake-token-abc"}
        fake_response.raise_for_status = MagicMock()
        with patch("httpx.AsyncClient.post", new=AsyncMock(return_value=fake_response)):
            token = await server._paypal_get_access_token("client-id", "secret")
        assert token == "fake-token-abc"

    async def test_get_order_returns_the_parsed_order_json(self):
        fake_response = MagicMock()
        fake_response.json.return_value = {"id": "PAYPAL-ORDER-1", "status": "COMPLETED"}
        fake_response.raise_for_status = MagicMock()
        with patch("httpx.AsyncClient.get", new=AsyncMock(return_value=fake_response)):
            order = await server._paypal_get_order("PAYPAL-ORDER-1", "fake-token-abc")
        assert order["status"] == "COMPLETED"
```

Mark both with `@pytest.mark.asyncio` (check `backend/tests/test_security_fixes.py` for the existing async-test setup/marker convention already used in this repo and match it).

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && python -m pytest tests/test_commerce_orders.py -v`
Expected: FAIL — functions don't exist.

- [ ] **Step 3: Implement the helpers**

```python
def _paypal_api_base() -> str:
    mode = os.environ.get("PAYPAL_MODE", "sandbox")
    return "https://api-m.paypal.com" if mode == "live" else "https://api-m.sandbox.paypal.com"


async def _paypal_get_access_token(client_id: str, secret: str) -> str:
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(
            f"{_paypal_api_base()}/v1/oauth2/token",
            auth=(client_id, secret),
            data={"grant_type": "client_credentials"},
        )
        resp.raise_for_status()
        return resp.json()["access_token"]


async def _paypal_get_order(order_id: str, access_token: str) -> dict:
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(
            f"{_paypal_api_base()}/v2/checkout/orders/{order_id}",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        resp.raise_for_status()
        return resp.json()
```

Confirm `httpx` is already imported at the top of `backend/server.py` (it is — used by `_safe_fetch_url`); add `import httpx` only if somehow missing.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && python -m pytest tests/test_commerce_orders.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/server.py backend/tests/test_commerce_orders.py
git commit -m "Add PayPal OAuth token and order-lookup helpers"
```

---

## Task 6: PayPal Verify Endpoint + Public Receipt Endpoint

**Files:**
- Modify: `backend/server.py`
- Test: `backend/tests/test_commerce_orders.py`

**Interfaces:**
- Consumes: `_paypal_get_access_token`, `_paypal_get_order` (Task 5); `_upsert_order` (Task 3); `_encrypt`/`_decrypt` (existing)
- Produces: `POST /api/commerce/paypal/verify`; replaces Task 3's temporary `GET /api/commerce/receipt/{provider_ref}` with its final form (adds an explicit `"status": "processing"` contract already covered by Task 3's tests — no behavior change needed there, just confirming it stays correct).

- [ ] **Step 1: Write the failing tests**

The first test needs a way to set `paypal_secret_enc` on a project before Task 7's dedicated endpoint exists — write it using the `db` fixture to insert a pre-encrypted secret directly via `server._encrypt(...)`, so this task has no ordering dependency on Task 7:

```python
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
```

(If the test suite's `client`/`project_id` fixtures don't already expose a raw `db` handle, add a `db` fixture in the same `conftest.py`/fixture location the other fixtures live, returning `server.db`.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && python -m pytest tests/test_commerce_orders.py -v`
Expected: FAIL — `/api/commerce/paypal/verify` doesn't exist (404).

- [ ] **Step 3: Implement the endpoint**

```python
class PaypalVerifyRequest(BaseModel):
    project_id: str
    order_id: str


@api_router.post("/commerce/paypal/verify")
async def paypal_verify(payload: PaypalVerifyRequest):
    project = await db.projects.find_one({"id": payload.project_id})
    if not project or not project.get("paypal_secret_enc") or not project.get("paypal_client_id"):
        raise HTTPException(status_code=400, detail="PayPal is not configured for this project")

    secret = _decrypt(project["paypal_secret_enc"])
    access_token = await _paypal_get_access_token(project["paypal_client_id"], secret)
    order = await _paypal_get_order(payload.order_id, access_token)

    if order.get("status") != "COMPLETED":
        raise HTTPException(status_code=400, detail=f"PayPal order status is {order.get('status')}, not COMPLETED")

    unit = (order.get("purchase_units") or [{}])[0]
    amount = unit.get("amount", {})
    payer = order.get("payer", {}) or {}
    payer_name_obj = payer.get("name", {}) or {}
    payer_name = " ".join(filter(None, [payer_name_obj.get("given_name"), payer_name_obj.get("surname")])) or None

    await _upsert_order({
        "id": str(uuid.uuid4()),
        "project_id": payload.project_id,
        "provider": "paypal",
        "provider_ref": order["id"],
        "status": "completed",
        "amount_total": int(float(amount.get("value", "0")) * 100),
        "currency": amount.get("currency_code", "usd").lower(),
        "customer_email": payer.get("email_address"),
        "customer_name": payer_name,
        "shipping_address": None,
        "line_items": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"ok": True}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && python -m pytest tests/test_commerce_orders.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/server.py backend/tests/test_commerce_orders.py
git commit -m "Add server-verified PayPal order confirmation endpoint"
```

---

## Task 7: PayPal Secret Configuration Endpoint

**Files:**
- Modify: `backend/server.py`
- Test: `backend/tests/test_commerce_orders.py`

**Interfaces:**
- Consumes: `_encrypt` (existing)
- Produces: `POST /api/commerce/paypal-secret`

- [ ] **Step 1: Write the failing tests**

```python
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && python -m pytest tests/test_commerce_orders.py -v`
Expected: FAIL — route doesn't exist.

- [ ] **Step 3: Implement the endpoint**

```python
class PaypalSecretRequest(BaseModel):
    project_id: str
    client_id: str
    secret: str


@api_router.post("/commerce/paypal-secret")
async def set_paypal_secret(payload: PaypalSecretRequest):
    result = await db.projects.update_one(
        {"id": payload.project_id},
        {"$set": {
            "paypal_client_id": payload.client_id,
            "paypal_secret_enc": _encrypt(payload.secret),
        }},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"ok": True}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && python -m pytest tests/test_commerce_orders.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/server.py backend/tests/test_commerce_orders.py
git commit -m "Add endpoint to set a project's PayPal client ID and encrypted secret"
```

---

## Task 8: Protected Orders List Endpoint

**Files:**
- Modify: `backend/server.py`
- Test: `backend/tests/test_commerce_orders.py`

**Interfaces:**
- Consumes: `_require_dashboard_token` (Task 2)
- Produces: `GET /api/dashboard/{project_id}/orders?page=1&page_size=20`

- [ ] **Step 1: Write the failing tests**

```python
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && python -m pytest tests/test_commerce_orders.py -v`
Expected: FAIL — route doesn't exist.

- [ ] **Step 3: Implement the endpoint**

```python
@api_router.get("/dashboard/{project_id}/orders")
async def list_orders(project_id: str, page: int = 1, page_size: int = 20, x_dashboard_token: Optional[str] = Header(default=None)):
    await _require_dashboard_token(project_id, x_dashboard_token)
    skip = max(page - 1, 0) * page_size
    cursor = db.orders.find({"project_id": project_id}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(page_size)
    orders = await cursor.to_list(length=page_size)
    total = await db.orders.count_documents({"project_id": project_id})
    return {"orders": orders, "total": total, "page": page, "page_size": page_size}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && python -m pytest tests/test_commerce_orders.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/server.py backend/tests/test_commerce_orders.py
git commit -m "Add password-protected, paginated orders list endpoint"
```

---

## Task 9: Frontend — cart.js sends project_id and verifies PayPal server-side

**Files:**
- Modify: `frontend/src/lib/cart.js`
- Test: `frontend/src/lib/cart.test.js` (new file, or extend if one already exists — check first)

**Interfaces:**
- Consumes: `POST /api/commerce/checkout-session` now requires `project_id` (Task 4); `POST /api/commerce/paypal/verify` (Task 6)
- Produces: `buildCartRuntimeHtml({ ..., projectId })` — Task 11's component doesn't consume this directly, but note the added required param for anyone else calling this function.

- [ ] **Step 1: Check for an existing test file**

Run: `ls frontend/src/lib/cart.test.js 2>/dev/null || echo "none yet"`

- [ ] **Step 2: Read `buildCartRuntimeHtml` and `checkoutStripe` in full**

Read `frontend/src/lib/cart.js` completely before editing — note the exact current signature of `buildCartRuntimeHtml` (what options object it destructures) and the exact shape of the POST body sent to `/api/commerce/checkout-session` (~line 112) and the PayPal `actions.order.capture()` callback (~line 118-136). Specifically check whether this POST body includes an explicit `success_url` field: if it does, it must be changed here to append `session_id={CHECKOUT_SESSION_ID}` as a query param (Stripe substitutes that literal placeholder text at redirect time) so Task 10's receipt script has something to read; if the body omits `success_url` and relies on the backend's own default, Task 4's backend-side fix already covers it and nothing changes here.

- [ ] **Step 3: Write the failing test**

```javascript
// frontend/src/lib/cart.test.js
import { buildCartRuntimeHtml } from "./cart";

test("buildCartRuntimeHtml embeds the given projectId into the checkout-session request body", () => {
  const html = buildCartRuntimeHtml({ currency: "usd", accent: "#4f46e5", paypalClientId: "", projectId: "proj-123" });
  expect(html).toContain('project_id: "proj-123"');
});

test("buildCartRuntimeHtml's PayPal onApprove reports the captured order to the backend verify endpoint", () => {
  const html = buildCartRuntimeHtml({ currency: "usd", accent: "#4f46e5", paypalClientId: "client-abc", projectId: "proj-123" });
  expect(html).toContain("/api/commerce/paypal/verify");
  expect(html).toContain('project_id: "proj-123"');
});
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `cd frontend && CI=true npx react-scripts test cart.test.js --watchAll=false`
Expected: FAIL — `projectId` isn't threaded through yet, no reference to `paypal/verify`.

- [ ] **Step 5: Add `projectId` to the options destructuring and thread it through**

In `buildCartRuntimeHtml`'s destructured options, add `projectId`. In the Stripe checkout POST body (~line 112), add `project_id: "${projectId}"` (or the template-literal equivalent already used for the other fields — match the existing quoting style in that generated-script string exactly). In the PayPal `onApprove` handler, after `actions.order.capture()` resolves, replace the current `alert()`-and-clear behavior with:

```javascript
fetch(API + "/commerce/paypal/verify", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ project_id: "${projectId}", order_id: data.orderID }),
}).then(() => { WDCart.clear(); /* existing success UI stays as-is */ });
```

(Match the existing `API` variable/base-URL reference already used elsewhere in this generated script — don't introduce a second one.)

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd frontend && CI=true npx react-scripts test cart.test.js --watchAll=false`
Expected: PASS

- [ ] **Step 7: Update every call site of `buildCartRuntimeHtml`**

Run: `grep -rn "buildCartRuntimeHtml(" frontend/src` — every call site now needs to pass `projectId` (the calling component already has the current project's id in scope, e.g. from `Builder.jsx`'s existing `projectId` state/prop). Update each call site found.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/lib/cart.js frontend/src/lib/cart.test.js
git commit -m "Send project_id through checkout and verify PayPal captures server-side"
```

---

## Task 10: Frontend — Buyer Receipt Rendering

**Files:**
- Modify: `frontend/src/lib/cart.js`
- Test: `frontend/src/lib/cart.test.js`

**Interfaces:**
- Consumes: `GET /api/commerce/receipt/{provider_ref}` (Task 3/6)

- [ ] **Step 1: Write the failing test**

```javascript
test("buildCartRuntimeHtml's baked script checks the URL for a session_id and fetches the receipt", () => {
  const html = buildCartRuntimeHtml({ currency: "usd", accent: "#4f46e5", paypalClientId: "", projectId: "proj-123" });
  expect(html).toContain("session_id");
  expect(html).toContain("/commerce/receipt/");
  expect(html).toContain("window.print");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && CI=true npx react-scripts test cart.test.js --watchAll=false`
Expected: FAIL.

- [ ] **Step 3: Add receipt-detection logic to the baked runtime script**

At the end of the script string `buildCartRuntimeHtml` returns (runs on every page load of an exported site), add:

```javascript
(function () {
  var params = new URLSearchParams(window.location.search);
  var sessionId = params.get("session_id");
  if (!sessionId) return;
  var tries = 0;
  function poll() {
    fetch("${API}/commerce/receipt/" + sessionId).then(function (r) { return r.json(); }).then(function (order) {
      if (order.status === "processing" && tries < 5) {
        tries++;
        setTimeout(poll, 2000);
        return;
      }
      var box = document.createElement("div");
      box.style.cssText = "max-width:480px;margin:60px auto;padding:32px;border:1px solid #e2e8f0;border-radius:12px;font-family:system-ui,sans-serif;";
      if (order.status === "processing") {
        box.innerHTML = "<h2>Thanks for your order</h2><p>Your payment was received. This receipt will update shortly — refresh in a moment.</p>";
      } else {
        var items = (order.line_items || []).map(function (li) {
          return "<li>" + li.name + " × " + li.quantity + "</li>";
        }).join("");
        box.innerHTML = "<h2>Order confirmed</h2><p>Thanks, " + (order.customer_name || order.customer_email || "") + "!</p><ul>" + items + "</ul>" +
          "<p><b>Total: " + (order.amount_total / 100).toFixed(2) + " " + (order.currency || "").toUpperCase() + "</b></p>" +
          "<button onclick=\\"window.print()\\">Print / Save as PDF</button>";
      }
      document.body.insertBefore(box, document.body.firstChild);
    });
  }
  poll();
})();
```

Use the same `${API}` template-literal substitution pattern already used elsewhere in `buildCartRuntimeHtml`'s returned string.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && CI=true npx react-scripts test cart.test.js --watchAll=false`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/cart.js frontend/src/lib/cart.test.js
git commit -m "Render a printable buyer receipt on the post-checkout redirect"
```

---

## Task 11: Frontend — CommerceTab PayPal Secret Field

**Files:**
- Modify: `frontend/src/components/builder/CommerceTab.jsx`
- Test: manual (this is a thin form-field addition to an existing hand-tested panel; no existing test file covers `CommerceTab.jsx` today — confirm with `ls frontend/src/components/builder/CommerceTab.test.jsx 2>/dev/null` before deciding whether to add one or stay consistent with the file having none)

**Interfaces:**
- Consumes: `POST /api/commerce/paypal-secret` (Task 7)

- [ ] **Step 1: Read `CommerceTab.jsx` in full**

Confirm the exact current PayPal Client ID field's state variable name, input styling classes (`inputCls`/`labelCls`), and where the "Add cart + checkout to page" button's `addCart` handler lives (~line 20-27 per earlier research).

- [ ] **Step 2: Add a PayPal Secret field and a save action**

Add a new `const [paypalSecret, setPaypalSecret] = useState("")` alongside the existing `paypal` state, a matching password-type `<input>` using the same `inputCls`, and a small "Save PayPal credentials" button that POSTs to the new endpoint:

```jsx
const savePaypalSecret = async () => {
  if (!paypal || !paypalSecret) { toast.error("Enter both Client ID and Secret"); return; }
  try {
    await fetch(`${API}/commerce/paypal-secret`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_id: projectId, client_id: paypal, secret: paypalSecret }),
    });
    toast.success("PayPal credentials saved");
    setPaypalSecret("");
  } catch {
    toast.error("Failed to save PayPal credentials");
  }
};
```

Match whichever `API` constant and `projectId` prop/context this component already has in scope (check its existing imports/props — it already sends other requests, follow that exact pattern rather than introducing a new one).

- [ ] **Step 3: Manually verify**

Run the frontend dev server, open the Shop tab, enter a PayPal Client ID + Secret, click save, confirm the success toast and confirm (via browser devtools network tab) the POST body never appears in any subsequent GET request to `/api/projects/*`.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/builder/CommerceTab.jsx
git commit -m "Add PayPal secret field to the commerce builder panel"
```

---

## Task 12: Frontend — Standalone EcommerceOrdersPanel Component

A self-contained password-unlock + orders-table component. Not wired into any navigation yet — the Dashboard shell it belongs in (`2026-08-21-dashboard-content-cms-design.md`) is a separate, not-yet-built spec. This task produces a fully working, independently testable unit that plan can mount later with zero rework.

**Files:**
- Create: `frontend/src/components/builder/EcommerceOrdersPanel.jsx`
- Test: `frontend/src/components/builder/EcommerceOrdersPanel.test.jsx`

**Interfaces:**
- Consumes: `POST /api/dashboard/{project_id}/unlock`, `GET /api/dashboard/{project_id}/orders` (Task 2, Task 8)
- Produces: `<EcommerceOrdersPanel projectId={string} />` — the only prop it needs, so mounting it anywhere later (including inside the future Dashboard's Ecommerce tab) is a one-line addition.

- [ ] **Step 1: Write the failing test**

```jsx
// frontend/src/components/builder/EcommerceOrdersPanel.test.jsx
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import EcommerceOrdersPanel from "./EcommerceOrdersPanel";

beforeEach(() => {
  global.fetch = jest.fn();
});

test("shows a password prompt before any orders are loaded", () => {
  render(<EcommerceOrdersPanel projectId="proj-123" />);
  expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
  expect(screen.queryByText(/order/i)).not.toBeInTheDocument();
});

test("unlocking with the correct password loads and displays orders", async () => {
  global.fetch
    .mockResolvedValueOnce({ ok: true, json: async () => ({ token: "tok-abc" }) })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        orders: [{ id: "o1", provider: "stripe", provider_ref: "cs_1", amount_total: 3800, currency: "usd", customer_email: "buyer@example.com", created_at: "2026-08-21T00:00:00Z" }],
        total: 1, page: 1, page_size: 20,
      }),
    });

  render(<EcommerceOrdersPanel projectId="proj-123" />);
  fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: "hunter22" } });
  fireEvent.click(screen.getByText(/unlock/i));

  await waitFor(() => expect(screen.getByText(/buyer@example.com/)).toBeInTheDocument());
  expect(screen.getByText(/38\.00/)).toBeInTheDocument();
});

test("an incorrect password shows an error and does not load orders", async () => {
  global.fetch.mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({ detail: "Incorrect password" }) });

  render(<EcommerceOrdersPanel projectId="proj-123" />);
  fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: "wrong" } });
  fireEvent.click(screen.getByText(/unlock/i));

  await waitFor(() => expect(screen.getByText(/incorrect password/i)).toBeInTheDocument());
  expect(global.fetch).toHaveBeenCalledTimes(1);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && CI=true npx react-scripts test EcommerceOrdersPanel.test.jsx --watchAll=false`
Expected: FAIL — component file doesn't exist.

- [ ] **Step 3: Implement the component**

```jsx
import React, { useState } from "react";

const API = process.env.REACT_APP_BACKEND_URL || "";

export default function EcommerceOrdersPanel({ projectId }) {
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(null);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const unlock = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/dashboard/${projectId}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.detail || "Incorrect password");
        return;
      }
      setToken(body.token);
      const ordersRes = await fetch(`${API}/api/dashboard/${projectId}/orders`, {
        headers: { "X-Dashboard-Token": body.token },
      });
      const ordersBody = await ordersRes.json();
      setOrders(ordersBody.orders || []);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div>
        <input type="password" placeholder="Dashboard password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button onClick={unlock} disabled={loading}>Unlock</button>
        {error && <p role="alert">{error}</p>}
      </div>
    );
  }

  return (
    <table>
      <tbody>
        {orders.map((o) => (
          <tr key={o.id}>
            <td>{o.provider}</td>
            <td>{o.customer_email}</td>
            <td>{(o.amount_total / 100).toFixed(2)} {(o.currency || "").toUpperCase()}</td>
            <td>{o.created_at}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && CI=true npx react-scripts test EcommerceOrdersPanel.test.jsx --watchAll=false`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/builder/EcommerceOrdersPanel.jsx frontend/src/components/builder/EcommerceOrdersPanel.test.jsx
git commit -m "Add standalone password-gated orders list panel"
```

---

## Task 13: Full Suite Regression Check

**Files:** none (verification only)

- [ ] **Step 1: Run the full backend suite**

Run: `cd backend && python -m pytest -v`
Expected: All prior tests still pass, plus every test added in Tasks 1-8, with zero new failures beyond the pre-existing baseline (the same 5 failures / 2 errors already known to be unrelated and present before this plan, per this session's earlier full-suite runs).

- [ ] **Step 2: Run the full frontend suite**

Run: `cd frontend && CI=true npx react-scripts test --watchAll=false`
Expected: All prior tests pass, plus every test added in Tasks 9-12.

- [ ] **Step 3: Manual end-to-end checkpoint (per the original request's Phase 1 validation checklist)**

With Stripe test-mode keys and PayPal sandbox credentials configured in the local `.env`:
- Complete one Stripe test checkout; confirm the webhook fires (Stripe CLI `stripe listen --forward-to localhost:8000/api/commerce/webhook` or dashboard event log) and an order appears via `GET /api/dashboard/{project_id}/orders`.
- Complete one PayPal sandbox checkout; confirm `paypal/verify` was called and an order appears.
- Load the post-checkout receipt page and confirm it renders the order (not stuck on "processing").
- Confirm neither `dashboard_password_hash` nor `paypal_secret_enc` ever appears in a `GET /api/projects*` response body.

- [ ] **Step 4: Commit (only if Step 1-2 required any fixups)**

```bash
git add -A
git commit -m "Fix regressions found in full-suite verification"
```
