# E-Commerce Phase 2: Customer Tracking & Transactional Email Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the `orders` collection Phase 1 created into two customer-facing capabilities: a derived customer list (order count, LTV, last-order date) in the dashboard, and automatic transactional email (order confirmation, plus merchant-driven shipped/delivered emails) sent via each project's own SMTP credentials.

**Architecture:** All backend work extends `backend/server.py` (the existing single-file FastAPI app, following its established convention). No new collection — customers are computed by grouping the existing `orders` collection by `customer_email` at request time. Email is stdlib-only (`smtplib` + `email.message.EmailMessage`), dispatched via FastAPI's `BackgroundTasks` so a slow/unreachable SMTP server never delays a Stripe webhook response or a dashboard action; SMTP credentials are stored per-project, Fernet-encrypted, using the exact gating pattern Phase 1 already established for the PayPal Secret. Frontend work extends the existing `CommerceTab.jsx` (SMTP fields, mirroring its PayPal Secret fields) and `EcommerceOrdersPanel.jsx` (a fulfillment-status dropdown per order, plus a Customers view).

**Tech Stack:** FastAPI + Motor (MongoDB) / SQLite dev shim (unchanged from Phase 1), stdlib `smtplib`/`email.message.EmailMessage`/`html` (no new dependency), FastAPI `BackgroundTasks` (already part of the installed `fastapi` package), React + Jest on the frontend.

**Spec:** `docs/superpowers/specs/2026-08-23-ecommerce-customers-email-design.md`

## Global Constraints

- No new backend dependencies — `smtplib`, `email.message.EmailMessage`, and `html` are all stdlib; `BackgroundTasks` is already part of the installed `fastapi` package.
- SMTP failures (auth, connection, timeout, or any other exception) MUST NOT propagate — order recording and fulfillment updates succeed regardless of email deliverability. Every path from a caller into an actual `smtplib.SMTP(...)` call is wrapped in try/except.
- `smtp_config_enc` is write-only from the API's perspective — same `Field(default=None, exclude=True)` treatment `dashboard_password_hash`/`paypal_secret_enc` already get on the `Project` model, and the same `{"smtp_config_enc": 0}` exclusion in every raw-Mongo projection that already excludes those two fields.
- The confirmation email fires exactly once per genuinely new order — gated on `_upsert_order`'s insert-vs-skip return value (this phase changes its return type from `None` to `bool`), never on a second, independently-trackable field.
- Fulfillment transitions are forward-only: `processing → shipped → delivered`. A request for the current state, a backward move, or an invalid value returns 400 and sends no email.
- The customer list is derived from `orders` at request time (grouped in Python, matching the existing "no aggregation pipeline available in sqlite_compat" precedent) — no new collection, no materialized/incremented counters that could drift from the underlying orders.
- Follow existing code style: `backend/server.py` stays one large file — extend it, don't split it. Frontend tests are Jest + React Testing Library, colocated as `*.test.jsx` next to their source file. Backend tests live in `backend/tests/test_commerce_orders.py`, pytest, `TestClient`, reusing the existing `client`/`project_id`/`db` fixtures and the `_stripe_configured_for_this_module`-style pattern for any test that needs to scope a module-level override.

---

## Task 1: `_upsert_order` Reports Whether It Inserted + Orders Get a `fulfillment_status`

The smallest possible foundation: every later task in this plan (the confirmation email in Task 4, the fulfillment endpoint in Task 5) depends on these two exact changes, so they go first and alone.

**Files:**
- Modify: `backend/server.py` (`_upsert_order` at line 1416; its two call sites — `stripe_webhook` ~1458, `paypal_verify` ~1547)
- Test: `backend/tests/test_commerce_orders.py`

**Interfaces:**
- Produces: `async def _upsert_order(order: dict) -> bool` (was `-> None`; `True` = a new row was inserted, `False` = `provider_ref` already existed and nothing was written). Both existing call sites now construct their order dict with `"fulfillment_status": "processing"` included.

- [ ] **Step 1: Write the failing tests**

Add to `backend/tests/test_commerce_orders.py`, near the existing `TestStripeWebhook`/`TestPaypalVerify` classes:

```python
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
    async def test_a_duplicate_provider_ref_returns_false_and_does_not_touch_the_row(self, db):
        order = _minimal_order("upsert-dup-1")
        first = await server._upsert_order(order)
        second = await server._upsert_order({**order, "customer_email": "different@example.com"})
        assert first is True
        assert second is False
        assert db.orders.find_one({"provider_ref": "upsert-dup-1"})["customer_email"] == "a@example.com"


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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && python -m pytest tests/test_commerce_orders.py -v -k "UpsertOrderReturnsWhether or FulfillmentStatusOnCreation"`
Expected: FAIL — `_upsert_order` still returns `None`, and neither call site sets `fulfillment_status` yet.

- [ ] **Step 3: Change `_upsert_order`'s return type**

In `backend/server.py`, replace the existing function (~line 1416):

```python
async def _upsert_order(order: dict) -> bool:
    # A duplicate/retried delivery must not touch the existing row's fields
    # (its "id", "created_at", etc. are freshly regenerated by the caller on
    # every invocation) — sqlite_compat's update_one only supports $set, not
    # Mongo's $setOnInsert, so skip the write outright once a row exists.
    # The return value tells the caller whether this was a genuinely new
    # order — Phase 2's confirmation email fires only on True, so a Stripe
    # retry-delivery of the same event never sends a second email.
    if await db.orders.find_one({"provider_ref": order["provider_ref"]}):
        return False
    await db.orders.update_one(
        {"provider_ref": order["provider_ref"]},
        {"$set": order},
        upsert=True,
    )
    return True
```

- [ ] **Step 4: Add `fulfillment_status` to both call sites' order dicts**

In `stripe_webhook` (~line 1458), add the field to the dict literal passed to `_upsert_order`, immediately after `"line_items": line_items,`:

```python
            "line_items": line_items,
            "fulfillment_status": "processing",
            "created_at": datetime.now(timezone.utc).isoformat(),
```

In `paypal_verify` (~line 1547), same addition after `"line_items": [],`:

```python
        "line_items": [],
        "fulfillment_status": "processing",
        "created_at": datetime.now(timezone.utc).isoformat(),
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd backend && python -m pytest tests/test_commerce_orders.py -v`
Expected: PASS (all existing tests too — neither change alters any existing endpoint's status code or response shape).

- [ ] **Step 6: Commit**

```bash
git add backend/server.py backend/tests/test_commerce_orders.py
git commit -m "Make _upsert_order report whether it inserted; give orders a fulfillment_status"
```

---

## Task 2: SMTP Configuration Storage

Mirrors the existing `POST /api/commerce/paypal-secret` endpoint exactly — same project field pattern, same first-write-open/replace-needs-token gating.

**Files:**
- Modify: `backend/server.py` (`Project` model ~line 51-71; `get_project`/`update_project` projections ~line 380/402; add new endpoint near `set_paypal_secret` ~line 1481)
- Test: `backend/tests/test_commerce_orders.py`

**Interfaces:**
- Consumes: `_encrypt`/`_decrypt` (existing), `_verify_dashboard_token` (existing)
- Produces: `POST /api/commerce/smtp-config` — request body `{project_id, host, port, username, password, from_address}`. Stores `smtp_config_enc` on the project doc as `_encrypt(json.dumps({host, port, username, password, from_address}))`. Task 3's `_send_email` consumes this exact encrypted JSON shape.

- [ ] **Step 1: Add the `smtp_config_enc` field to the `Project` model**

In `backend/server.py`, immediately after the existing `paypal_secret_enc` line (~line 64):

```python
    dashboard_password_hash: Optional[str] = Field(default=None, exclude=True)
    paypal_secret_enc: Optional[str] = Field(default=None, exclude=True)
    smtp_config_enc: Optional[str] = Field(default=None, exclude=True)
```

Do **not** add it to `ProjectCreate` or `ProjectUpdate` — same reasoning as the existing comment above those two classes: settable only via its own gated endpoint.

- [ ] **Step 2: Add it to both raw-Mongo projections that already exclude the other two secrets**

`get_project` (~line 380-383) and `update_project` (~line 400-403) both have:

```python
        {"_id": 0, "dashboard_password_hash": 0, "paypal_secret_enc": 0},
```

Change both occurrences to:

```python
        {"_id": 0, "dashboard_password_hash": 0, "paypal_secret_enc": 0, "smtp_config_enc": 0},
```

- [ ] **Step 3: Write the failing tests**

```python
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
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `cd backend && python -m pytest tests/test_commerce_orders.py -v -k TestSmtpConfigEndpoint`
Expected: FAIL — route doesn't exist (404 instead of the expected status codes), and the `Project` model doesn't have the field yet.

- [ ] **Step 5: Implement the endpoint**

Add near `set_paypal_secret` in `backend/server.py` (~line 1509, right after it):

```python
class SmtpConfigRequest(BaseModel):
    project_id: str
    host: str
    port: int
    username: str
    password: str
    from_address: str


@api_router.post("/commerce/smtp-config")
async def set_smtp_config(
    payload: SmtpConfigRequest,
    x_dashboard_token: Optional[str] = Header(default=None),
):
    existing = await db.projects.find_one(
        {"id": payload.project_id},
        {"_id": 0, "id": 1, "smtp_config_enc": 1, "dashboard_password_hash": 1},
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found")
    # Same reasoning as set_paypal_secret: project_id is public, so first
    # write is open but replacing existing credentials needs a token.
    if existing.get("smtp_config_enc"):
        current_hash = existing.get("dashboard_password_hash") or ""
        if not (x_dashboard_token and _verify_dashboard_token(x_dashboard_token, payload.project_id, current_hash)):
            raise HTTPException(
                status_code=401,
                detail="SMTP settings are already set — unlock the dashboard to replace them",
            )
    config = {
        "host": payload.host,
        "port": payload.port,
        "username": payload.username,
        "password": payload.password,
        "from_address": payload.from_address,
    }
    await db.projects.update_one(
        {"id": payload.project_id},
        {"$set": {"smtp_config_enc": _encrypt(json.dumps(config))}},
    )
    return {"ok": True}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd backend && python -m pytest tests/test_commerce_orders.py -v`
Expected: PASS (all tests, including every pre-existing one — the new field is excluded from every response by the same mechanism as the other two secrets).

- [ ] **Step 7: Commit**

```bash
git add backend/server.py backend/tests/test_commerce_orders.py
git commit -m "Add gated per-project SMTP configuration endpoint"
```

---

## Task 3: `_send_email` Helper + Fixed HTML Templates

Pure/near-pure functions with no dependency on this plan's other endpoints — testable in isolation with `smtplib.SMTP` mocked out, never a real network connection.

**Files:**
- Modify: `backend/server.py` (add near the existing `_paypal_get_order` helper, ~line 348)
- Test: `backend/tests/test_commerce_orders.py`

**Interfaces:**
- Consumes: `_decrypt` (existing)
- Produces: `async def _send_email(project_id: str, to_addr: str, subject: str, html_body: str) -> None` (never raises); `_email_confirmation(project_name: str, order: dict) -> tuple[str, str]`, `_email_shipped(project_name: str, order: dict) -> tuple[str, str]`, `_email_delivered(project_name: str, order: dict) -> tuple[str, str]` (each returns `(subject, html_body)`). Task 4 and Task 5 call all four.

- [ ] **Step 1: Add the three new stdlib imports**

At the top of `backend/server.py`, alongside the existing `import` block:

```python
import smtplib
from email.message import EmailMessage
import html
```

- [ ] **Step 2: Write the failing tests**

```python
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
    async def test_sends_via_the_projects_saved_smtp_config(self, project_id, db):
        db.projects.update_one({"id": project_id}, {"$set": {"smtp_config_enc": server._encrypt(json.dumps({
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
    async def test_swallows_smtp_errors_without_raising(self, project_id, db):
        db.projects.update_one({"id": project_id}, {"$set": {"smtp_config_enc": server._encrypt(json.dumps({
            "host": "smtp.example.com", "port": 587, "username": "user@example.com",
            "password": "app-password", "from_address": "store@example.com",
        }))}})
        with patch("smtplib.SMTP", side_effect=OSError("connection refused")):
            await server._send_email(project_id, "buyer@example.com", "Subject", "<p>hi</p>")  # must not raise

    @pytest.mark.asyncio
    async def test_does_nothing_when_the_recipient_is_empty(self, project_id, db):
        db.projects.update_one({"id": project_id}, {"$set": {"smtp_config_enc": server._encrypt(json.dumps({
            "host": "smtp.example.com", "port": 587, "username": "u", "password": "p", "from_address": "f",
        }))}})
        with patch("smtplib.SMTP") as mock_smtp:
            await server._send_email(project_id, "", "Subject", "<p>hi</p>")
        mock_smtp.assert_not_called()
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd backend && python -m pytest tests/test_commerce_orders.py -v -k "EmailTemplates or SendEmail"`
Expected: FAIL — none of the four functions exist yet.

- [ ] **Step 4: Implement the email templates**

Add to `backend/server.py`, right after `_paypal_get_order` (~line 349):

```python
def _order_email_html(project_name: str, order: dict, heading: str, intro: str) -> str:
    items_html = "".join(
        f"<li>{html.escape(str(li.get('name', '')))} × {html.escape(str(li.get('quantity', 1)))}</li>"
        for li in (order.get("line_items") or [])
    )
    total = f"{(order.get('amount_total', 0) / 100):.2f} {(order.get('currency') or '').upper()}"
    greeting = html.escape(order.get("customer_name") or order.get("customer_email") or "there")
    shipping_html = ""
    shipping = order.get("shipping_address")
    if shipping:
        shipping_html = f"<p>Shipping to: {html.escape(json.dumps(shipping))}</p>"
    return f"""<html><body style="font-family:system-ui,sans-serif;color:#1a1a1a;max-width:480px;margin:0 auto;">
<h1 style="font-size:20px;">{html.escape(heading)}</h1>
<p>Hi {greeting},</p>
<p>{html.escape(intro)} Order from <b>{html.escape(project_name)}</b>.</p>
<ul>{items_html}</ul>
<p><b>Total: {html.escape(total)}</b></p>
{shipping_html}
</body></html>"""


def _email_confirmation(project_name: str, order: dict) -> tuple[str, str]:
    subject = f"Your order from {project_name} is confirmed"
    body = _order_email_html(project_name, order, "Order confirmed", "Thanks for your order! Here's what you bought.")
    return subject, body


def _email_shipped(project_name: str, order: dict) -> tuple[str, str]:
    subject = f"Your order from {project_name} has shipped"
    body = _order_email_html(project_name, order, "Your order has shipped", "Your order is on its way.")
    return subject, body


def _email_delivered(project_name: str, order: dict) -> tuple[str, str]:
    subject = f"Your order from {project_name} was delivered"
    body = _order_email_html(project_name, order, "Your order was delivered", "Your order has been delivered. We hope you enjoy it!")
    return subject, body
```

- [ ] **Step 5: Implement `_send_email`**

Add right after the three email-template functions:

```python
def _send_email_sync(config: dict, to_addr: str, subject: str, html_body: str) -> None:
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = config.get("from_address") or config.get("username")
    msg["To"] = to_addr
    msg.set_content("This email requires an HTML-capable client to view.")
    msg.add_alternative(html_body, subtype="html")
    with smtplib.SMTP(config["host"], int(config["port"]), timeout=10) as smtp:
        smtp.starttls()
        smtp.login(config["username"], config["password"])
        smtp.send_message(msg)


async def _send_email(project_id: str, to_addr: str, subject: str, html_body: str) -> None:
    """Never raises — deliverability must never break order recording or a
    dashboard action. A project with no smtp_config_enc saved is a silent
    no-op, matching the PayPal Secret's "opt-in, not required" posture."""
    if not to_addr:
        return
    project = await db.projects.find_one({"id": project_id}, {"_id": 0, "smtp_config_enc": 1})
    enc = (project or {}).get("smtp_config_enc")
    if not enc:
        return
    try:
        config = json.loads(_decrypt(enc))
    except Exception:
        logger.warning("Could not decrypt SMTP config for project %s", project_id)
        return
    try:
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, _send_email_sync, config, to_addr, subject, html_body)
    except Exception:
        logger.warning("Failed to send email to %s for project %s", to_addr, project_id, exc_info=True)
```

`logger` is the module-level `logging.getLogger(__name__)` already defined later in `backend/server.py` — Python resolves the name at call time, so its later position in the file doesn't matter.

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd backend && python -m pytest tests/test_commerce_orders.py -v`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/server.py backend/tests/test_commerce_orders.py
git commit -m "Add SMTP send helper and fixed order-confirmation/shipped/delivered email templates"
```

---

## Task 4: Wire the Confirmation Email Into Both Order-Creation Paths

**Files:**
- Modify: `backend/server.py` (`stripe_webhook` ~line 1430; `paypal_verify` ~line 1516-1561)
- Test: `backend/tests/test_commerce_orders.py`

**Interfaces:**
- Consumes: `_upsert_order` returning `bool` (Task 1), `_send_email`, `_email_confirmation` (Task 3)
- Produces: both endpoints gain a `background_tasks: BackgroundTasks` parameter; a confirmation email is scheduled exactly once per genuinely new, emailable order.

- [ ] **Step 1: Add `BackgroundTasks` to the fastapi import**

In `backend/server.py`, line 1 currently reads:

```python
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Header
```

Change to:

```python
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Header, BackgroundTasks
```

- [ ] **Step 2: Write the failing tests**

This test file's underlying SQLite store is created once at module import (see the top of `test_commerce_orders.py`) and is **never reset between tests** — every pre-existing test in this file deliberately uses a unique literal `id` per test function to avoid a primary-key collision (e.g. `TestOrdersListEndpoint`'s `"o1"`/`"o2"` vs. `"bounds-o0"`/`"bounds-o1"`/`"bounds-o2"`). Follow that same convention: never reuse `FAKE_SESSION_ID` or a literal project id across these tests.

```python
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
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd backend && python -m pytest tests/test_commerce_orders.py -v -k ConfirmationEmailFiresOnNewOrder`
Expected: FAIL — `_send_email` is never called (nothing schedules it yet).

- [ ] **Step 4: Wire the webhook**

In `stripe_webhook` (~line 1430), add the `background_tasks` parameter and, after the existing `await _upsert_order({...})` call, capture and act on its return value:

```python
@api_router.post("/commerce/webhook")
async def stripe_webhook(request: Request, background_tasks: BackgroundTasks):
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
        loop = asyncio.get_running_loop()
        line_items_result = await loop.run_in_executor(
            None, stripe.checkout.Session.list_line_items, session["id"]
        )
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
        order = {
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
            "fulfillment_status": "processing",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        is_new = await _upsert_order(order)
        if is_new and order["customer_email"]:
            project = await db.projects.find_one({"id": order["project_id"]}, {"_id": 0, "name": 1})
            project_name = (project or {}).get("name") or "Your store"
            subject, body = _email_confirmation(project_name, order)
            background_tasks.add_task(_send_email, order["project_id"], order["customer_email"], subject, body)
    return {"received": True}
```

- [ ] **Step 5: Wire PayPal verify**

In `paypal_verify` (~line 1516), add the `background_tasks` parameter, name the order dict (it's currently an inline literal — the PayPal API response is already bound to the name `order`, so name this one `order_record` to avoid a collision), and reuse the `project` variable this function already fetches at its top:

```python
@api_router.post("/commerce/paypal/verify")
async def paypal_verify(payload: PaypalVerifyRequest, background_tasks: BackgroundTasks):
    project = await db.projects.find_one({"id": payload.project_id})
    if not project:
        raise HTTPException(status_code=400, detail="Unknown project_id")
    if not project.get("paypal_secret_enc") or not project.get("paypal_client_id"):
        raise HTTPException(status_code=400, detail="PayPal is not configured for this project")

    secret = _decrypt(project["paypal_secret_enc"])
    try:
        access_token = await _paypal_get_access_token(project["paypal_client_id"], secret)
        order = await _paypal_get_order(payload.order_id, access_token)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Could not reach PayPal to verify this order: {type(e).__name__}")

    if order.get("status") != "COMPLETED":
        raise HTTPException(status_code=400, detail=f"PayPal order status is {order.get('status')}, not COMPLETED")

    unit = (order.get("purchase_units") or [{}])[0]
    amount = unit.get("amount", {})
    payer = order.get("payer", {}) or {}
    payer_name_obj = payer.get("name", {}) or {}
    payer_name = " ".join(filter(None, [payer_name_obj.get("given_name"), payer_name_obj.get("surname")])) or None
    try:
        amount_total = int(Decimal(str(amount.get("value") or "0")).scaleb(2))
    except InvalidOperation:
        raise HTTPException(status_code=502, detail="PayPal returned an unreadable amount")

    order_record = {
        "id": str(uuid.uuid4()),
        "project_id": payload.project_id,
        "provider": "paypal",
        "provider_ref": order["id"],
        "status": "completed",
        "amount_total": amount_total,
        "currency": amount.get("currency_code", "usd").lower(),
        "customer_email": payer.get("email_address"),
        "customer_name": payer_name,
        "shipping_address": None,
        "line_items": [],
        "fulfillment_status": "processing",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    is_new = await _upsert_order(order_record)
    if is_new and order_record["customer_email"]:
        project_name = (project or {}).get("name") or "Your store"
        subject, body = _email_confirmation(project_name, order_record)
        background_tasks.add_task(_send_email, payload.project_id, order_record["customer_email"], subject, body)
    return {"ok": True}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd backend && python -m pytest tests/test_commerce_orders.py -v`
Expected: PASS (all tests — the pre-existing `TestStripeWebhook`/`TestPaypalVerify` tests never mock `_send_email`, but their project IDs have no `smtp_config_enc` saved, so `_send_email`'s own no-op guard from Task 3 keeps them side-effect-free; confirm this with the full run, not just the new test classes).

- [ ] **Step 7: Commit**

```bash
git add backend/server.py backend/tests/test_commerce_orders.py
git commit -m "Send an automatic order-confirmation email on every genuinely new order"
```

---

## Task 5: Fulfillment Status Endpoint + Shipped/Delivered Emails

**Files:**
- Modify: `backend/server.py` (add near the orders list endpoint, ~line 481)
- Test: `backend/tests/test_commerce_orders.py`

**Interfaces:**
- Consumes: `_require_dashboard_token` (existing), `_send_email`, `_email_shipped`, `_email_delivered` (Task 3)
- Produces: `PATCH /api/dashboard/{project_id}/orders/{order_id}/fulfillment`

- [ ] **Step 1: Write the failing tests**

Every order `id` below is unique across the whole test file (same collision reason as Task 4's note above) — `_seed_order` takes `order_id` as a required positional argument rather than defaulting it, so each test must name its own.

```python
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && python -m pytest tests/test_commerce_orders.py -v -k FulfillmentStatusEndpoint`
Expected: FAIL — route doesn't exist (404 for the wrong reason — no route at all — on every case).

- [ ] **Step 3: Implement the endpoint**

Add to `backend/server.py`, right after `list_orders` (~line 481):

```python
class FulfillmentUpdateRequest(BaseModel):
    fulfillment_status: str


_FULFILLMENT_SEQUENCE = ["processing", "shipped", "delivered"]


@api_router.patch("/dashboard/{project_id}/orders/{order_id}/fulfillment")
async def update_order_fulfillment(
    project_id: str,
    order_id: str,
    payload: FulfillmentUpdateRequest,
    background_tasks: BackgroundTasks,
    x_dashboard_token: Optional[str] = Header(default=None),
):
    await _require_dashboard_token(project_id, x_dashboard_token)
    order = await db.orders.find_one({"id": order_id, "project_id": project_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    current = order.get("fulfillment_status", "processing")
    new_status = payload.fulfillment_status
    if new_status not in _FULFILLMENT_SEQUENCE:
        raise HTTPException(status_code=400, detail="Invalid fulfillment status")
    if _FULFILLMENT_SEQUENCE.index(new_status) != _FULFILLMENT_SEQUENCE.index(current) + 1:
        raise HTTPException(status_code=400, detail=f"Cannot move fulfillment status from {current} to {new_status}")

    await db.orders.update_one({"id": order_id, "project_id": project_id}, {"$set": {"fulfillment_status": new_status}})
    order["fulfillment_status"] = new_status

    to_addr = order.get("customer_email")
    if to_addr:
        project = await db.projects.find_one({"id": project_id}, {"_id": 0, "name": 1})
        project_name = (project or {}).get("name") or "Your store"
        template = _email_shipped if new_status == "shipped" else _email_delivered
        subject, body = template(project_name, order)
        background_tasks.add_task(_send_email, project_id, to_addr, subject, body)

    return order
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && python -m pytest tests/test_commerce_orders.py -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/server.py backend/tests/test_commerce_orders.py
git commit -m "Add merchant-driven fulfillment status transitions with shipped/delivered emails"
```

---

## Task 6: Customer Aggregation Endpoint

**Files:**
- Modify: `backend/server.py` (add near `list_orders`, ~line 481, after Task 5's endpoint)
- Test: `backend/tests/test_commerce_orders.py`

**Interfaces:**
- Consumes: `_require_dashboard_token` (existing)
- Produces: `GET /api/dashboard/{project_id}/customers?page=1&page_size=20` — response `{customers: [{email, name, order_count, ltv, last_order_at}], total, page, page_size}`, sorted by `ltv` descending.

- [ ] **Step 1: Write the failing tests**

```python
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && python -m pytest tests/test_commerce_orders.py -v -k TestCustomersEndpoint`
Expected: FAIL — route doesn't exist.

- [ ] **Step 3: Implement the endpoint**

Add to `backend/server.py`, right after Task 5's `update_order_fulfillment`:

```python
@api_router.get("/dashboard/{project_id}/customers")
async def list_customers(project_id: str, page: int = 1, page_size: int = 20, x_dashboard_token: Optional[str] = Header(default=None)):
    await _require_dashboard_token(project_id, x_dashboard_token)
    page = max(page, 1)
    page_size = min(max(page_size, 1), 100)

    cursor = db.orders.find(
        {"project_id": project_id, "status": "completed"},
        {"_id": 0, "customer_email": 1, "customer_name": 1, "amount_total": 1, "created_at": 1},
    )
    all_orders = await cursor.to_list(length=None)

    grouped: dict = {}
    for o in all_orders:
        email = (o.get("customer_email") or "").strip().lower()
        if not email:
            continue
        bucket = grouped.setdefault(email, {"email": email, "name": None, "order_count": 0, "ltv": 0, "last_order_at": None})
        bucket["order_count"] += 1
        bucket["ltv"] += o.get("amount_total", 0)
        created = o.get("created_at") or ""
        if bucket["last_order_at"] is None or created >= bucket["last_order_at"]:
            bucket["last_order_at"] = created
            if o.get("customer_name"):
                bucket["name"] = o["customer_name"]

    customers = sorted(grouped.values(), key=lambda c: c["ltv"], reverse=True)
    total = len(customers)
    skip = (page - 1) * page_size
    return {"customers": customers[skip:skip + page_size], "total": total, "page": page, "page_size": page_size}
```

(`bucket["name"]` is only overwritten alongside `last_order_at` — this keeps "most recent order's name" correct even if orders are returned out of chronological order by the underlying `find()`, rather than just taking whichever order happens to be processed last.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && python -m pytest tests/test_commerce_orders.py -v`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/server.py backend/tests/test_commerce_orders.py
git commit -m "Add derived per-project customer list endpoint (order count, LTV, last order)"
```

---

## Task 7: Frontend — CommerceTab SMTP Fields

**Files:**
- Modify: `frontend/src/components/builder/CommerceTab.jsx`, `frontend/src/pages/Builder.jsx`, `frontend/src/components/builder/LeftSidebar.jsx`
- Test: `frontend/src/components/builder/CommerceTab.test.jsx` (new file)

**Interfaces:**
- Consumes: `POST /api/commerce/smtp-config` (Task 2)
- Produces: `<CommerceTab onSaveSmtpConfig={(host, port, username, password, fromAddress) => void} ... />`

- [ ] **Step 1: Write the failing tests**

```jsx
// frontend/src/components/builder/CommerceTab.test.jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { CommerceTab } from "./CommerceTab";

jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

const noop = () => {};
const baseProps = { onAddBlock: noop, onOpenPaymentBuilder: noop, onWireCatalog: noop, onAddCart: noop, onSavePaypalSecret: noop };

test("filling in all SMTP fields and saving calls onSaveSmtpConfig with the entered values", () => {
  const onSaveSmtpConfig = jest.fn();
  render(<CommerceTab {...baseProps} onSaveSmtpConfig={onSaveSmtpConfig} />);

  fireEvent.change(screen.getByTestId("smtp-host"), { target: { value: "smtp.example.com" } });
  fireEvent.change(screen.getByTestId("smtp-port"), { target: { value: "587" } });
  fireEvent.change(screen.getByTestId("smtp-username"), { target: { value: "user@example.com" } });
  fireEvent.change(screen.getByTestId("smtp-password"), { target: { value: "app-password" } });
  fireEvent.change(screen.getByTestId("smtp-from"), { target: { value: "store@example.com" } });
  fireEvent.click(screen.getByTestId("save-smtp-btn"));

  expect(onSaveSmtpConfig).toHaveBeenCalledWith("smtp.example.com", 587, "user@example.com", "app-password", "store@example.com");
});

test("saving with a missing field does not call onSaveSmtpConfig", () => {
  const onSaveSmtpConfig = jest.fn();
  render(<CommerceTab {...baseProps} onSaveSmtpConfig={onSaveSmtpConfig} />);
  fireEvent.click(screen.getByTestId("save-smtp-btn"));
  expect(onSaveSmtpConfig).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && CI=true npx react-scripts test CommerceTab.test.jsx --watchAll=false`
Expected: FAIL — `smtp-host` etc. don't exist yet, `onSaveSmtpConfig` prop is unused.

- [ ] **Step 3: Add SMTP state and the save handler to `CommerceTab.jsx`**

Add `onSaveSmtpConfig` to the destructured props (~line 12):

```jsx
export const CommerceTab = ({ onAddBlock, onOpenPaymentBuilder, onWireCatalog, onAddCart, onSavePaypalSecret, onSaveSmtpConfig }) => {
```

Add state alongside the existing `paypal`/`paypalSecret` state (~line 15-16):

```jsx
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUsername, setSmtpUsername] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [smtpFromAddress, setSmtpFromAddress] = useState("");
```

Add the save handler alongside `savePaypal` (~line 24-28):

```jsx
  const saveSmtp = () => {
    if (!smtpHost || !smtpPort || !smtpUsername || !smtpPassword || !smtpFromAddress) { toast.error("Fill in all SMTP fields"); return; }
    onSaveSmtpConfig(smtpHost, Number(smtpPort), smtpUsername, smtpPassword, smtpFromAddress);
    setSmtpPassword("");
  };
```

- [ ] **Step 4: Add the SMTP fields group to the JSX**

Insert a new block right after the existing "Working cart" `</div>` (~line 72), before the "Add-to-cart button generator" comment:

```jsx
      {/* SMTP settings for transactional order email */}
      <div className="border-t border-[#2B2B2B] pt-3 space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-gray-500">Order emails (SMTP)</div>
        <input value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} placeholder="SMTP host" className={inputCls + " font-mono"} data-testid="smtp-host" />
        <div className="grid grid-cols-2 gap-2">
          <input value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} placeholder="Port" className={inputCls} data-testid="smtp-port" />
          <input value={smtpFromAddress} onChange={(e) => setSmtpFromAddress(e.target.value)} placeholder="From address" className={inputCls} data-testid="smtp-from" />
        </div>
        <input value={smtpUsername} onChange={(e) => setSmtpUsername(e.target.value)} placeholder="Username" className={inputCls + " font-mono"} data-testid="smtp-username" />
        <input type="password" value={smtpPassword} onChange={(e) => setSmtpPassword(e.target.value)} placeholder="Password" className={inputCls + " font-mono"} data-testid="smtp-password" />
        <button onClick={saveSmtp} className="w-full text-xs py-2 rounded bg-[#1F1F1F] border border-[#2B2B2B] hover:bg-[#2B2B2B] text-gray-100 font-medium" data-testid="save-smtp-btn">Save SMTP settings</button>
        <p className="text-[10px] text-gray-500 leading-relaxed">Sends an automatic order-confirmation email, plus shipped/delivered emails when you update an order's status in the dashboard.</p>
      </div>
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd frontend && CI=true npx react-scripts test CommerceTab.test.jsx --watchAll=false`
Expected: PASS.

- [ ] **Step 6: Wire the handler through `Builder.jsx` and `LeftSidebar.jsx`**

In `frontend/src/pages/Builder.jsx`, add a new handler right after the existing `savePaypalSecret` (~line 671):

```jsx
  const saveSmtpConfig = async (host, port, username, password, fromAddress) => {
    try {
      await axios.post(`${API}/commerce/smtp-config`, { project_id: projectId, host, port, username, password, from_address: fromAddress });
      toast.success("SMTP settings saved");
    } catch {
      toast.error("Failed to save SMTP settings");
    }
  };
```

Find the `<LeftSidebar ... onSavePaypalSecret={savePaypalSecret} ... />` usage (~line 1016) and add `onSaveSmtpConfig={saveSmtpConfig}` alongside it.

In `frontend/src/components/builder/LeftSidebar.jsx`, add `onSaveSmtpConfig` to the destructured props (~line 46, alongside `onSavePaypalSecret`) and pass it through to `<CommerceTab ... onSavePaypalSecret={onSavePaypalSecret} onSaveSmtpConfig={onSaveSmtpConfig} />` (~line 307).

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/builder/CommerceTab.jsx frontend/src/components/builder/CommerceTab.test.jsx frontend/src/pages/Builder.jsx frontend/src/components/builder/LeftSidebar.jsx
git commit -m "Add SMTP settings fields to the commerce builder panel"
```

---

## Task 8: Frontend — EcommerceOrdersPanel Fulfillment Dropdown + Customers Tab

**Files:**
- Modify: `frontend/src/components/builder/EcommerceOrdersPanel.jsx`
- Test: `frontend/src/components/builder/EcommerceOrdersPanel.test.jsx`

**Interfaces:**
- Consumes: `PATCH /api/dashboard/{project_id}/orders/{order_id}/fulfillment` (Task 5), `GET /api/dashboard/{project_id}/customers` (Task 6)

- [ ] **Step 1: Write the failing tests**

Add to the existing `frontend/src/components/builder/EcommerceOrdersPanel.test.jsx`:

```jsx
test("changing the fulfillment dropdown calls PATCH and updates the row", async () => {
  global.fetch
    .mockResolvedValueOnce({ ok: true, json: async () => ({ token: "tok-abc" }) })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        orders: [{ id: "o1", provider: "stripe", provider_ref: "cs_1", amount_total: 3800, currency: "usd", customer_email: "buyer@example.com", created_at: "2026-08-23T00:00:00Z", fulfillment_status: "processing" }],
        total: 1, page: 1, page_size: 20,
      }),
    })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ id: "o1", fulfillment_status: "shipped" }) });

  render(<EcommerceOrdersPanel projectId="proj-123" />);
  fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: "hunter22" } });
  fireEvent.click(screen.getByText(/unlock/i));
  await waitFor(() => expect(screen.getByLabelText(/fulfillment status/i)).toBeInTheDocument());

  fireEvent.change(screen.getByLabelText(/fulfillment status/i), { target: { value: "shipped" } });

  await waitFor(() => expect(screen.getByLabelText(/fulfillment status/i)).toHaveValue("shipped"));
  const patchCall = global.fetch.mock.calls[2];
  expect(patchCall[0]).toBe("/api/dashboard/proj-123/orders/o1/fulfillment");
  expect(patchCall[1].method).toBe("PATCH");
  expect(JSON.parse(patchCall[1].body)).toEqual({ fulfillment_status: "shipped" });
});

test("the Customers tab loads and displays customer LTV", async () => {
  global.fetch
    .mockResolvedValueOnce({ ok: true, json: async () => ({ token: "tok-abc" }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ orders: [], total: 0, page: 1, page_size: 20 }) })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        customers: [{ email: "buyer@example.com", name: "Ada Lovelace", order_count: 2, ltv: 5800, last_order_at: "2026-08-22T00:00:00Z" }],
        total: 1, page: 1, page_size: 20,
      }),
    });

  render(<EcommerceOrdersPanel projectId="proj-123" />);
  fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: "hunter22" } });
  fireEvent.click(screen.getByText(/unlock/i));
  await waitFor(() => expect(screen.getByRole("button", { name: /customers/i })).toBeInTheDocument());

  fireEvent.click(screen.getByRole("button", { name: /customers/i }));

  await waitFor(() => expect(screen.getByText(/58\.00/)).toBeInTheDocument());
  expect(screen.getByText(/ada lovelace/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && CI=true npx react-scripts test EcommerceOrdersPanel.test.jsx --watchAll=false`
Expected: FAIL — no fulfillment dropdown, no Customers button exist yet.

- [ ] **Step 3: Implement the additions**

Replace the full contents of `frontend/src/components/builder/EcommerceOrdersPanel.jsx`:

```jsx
import React, { useState } from "react";

const API = process.env.REACT_APP_BACKEND_URL || "";
const FULFILLMENT_OPTIONS = ["processing", "shipped", "delivered"];

export default function EcommerceOrdersPanel({ projectId }) {
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(null);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [view, setView] = useState("orders");
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
      try {
        const ordersRes = await fetch(`${API}/api/dashboard/${projectId}/orders`, {
          headers: { "X-Dashboard-Token": body.token },
        });
        const ordersBody = await ordersRes.json();
        setOrders(ordersBody.orders || []);
      } catch {
        setError("Unlocked, but your orders couldn't be loaded. Please try again.");
      }
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const showCustomers = async () => {
    setView("customers");
    try {
      const res = await fetch(`${API}/api/dashboard/${projectId}/customers`, {
        headers: { "X-Dashboard-Token": token },
      });
      const body = await res.json();
      setCustomers(body.customers || []);
    } catch {
      setError("Couldn't load customers. Please try again.");
    }
  };

  const updateFulfillment = async (order, nextStatus) => {
    try {
      const res = await fetch(`${API}/api/dashboard/${projectId}/orders/${order.id}/fulfillment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Dashboard-Token": token },
        body: JSON.stringify({ fulfillment_status: nextStatus }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.detail || "Couldn't update fulfillment status.");
        return;
      }
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, fulfillment_status: body.fulfillment_status } : o)));
    } catch {
      setError("Couldn't reach the server.");
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
    <>
      {error && <p role="alert">{error}</p>}
      <div>
        <button onClick={() => setView("orders")}>Orders</button>
        <button onClick={showCustomers}>Customers</button>
      </div>
      {view === "orders" ? (
        <table>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>{o.provider}</td>
                <td>{o.customer_email}</td>
                <td>{(o.amount_total / 100).toFixed(2)} {(o.currency || "").toUpperCase()}</td>
                <td>{o.created_at}</td>
                <td>
                  <select
                    aria-label="Fulfillment status"
                    value={o.fulfillment_status || "processing"}
                    disabled={(o.fulfillment_status || "processing") === "delivered"}
                    onChange={(e) => updateFulfillment(o, e.target.value)}
                  >
                    {FULFILLMENT_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <table>
          <tbody>
            {customers.map((c) => (
              <tr key={c.email}>
                <td>{c.email}</td>
                <td>{c.name}</td>
                <td>{c.order_count}</td>
                <td>{(c.ltv / 100).toFixed(2)}</td>
                <td>{c.last_order_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && CI=true npx react-scripts test EcommerceOrdersPanel.test.jsx --watchAll=false`
Expected: PASS (all tests, including the three pre-existing ones from Phase 1 — the password-gate and orders-loading behavior is unchanged).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/builder/EcommerceOrdersPanel.jsx frontend/src/components/builder/EcommerceOrdersPanel.test.jsx
git commit -m "Add fulfillment status dropdown and a derived Customers tab to the orders panel"
```

---

## Task 9: Full Suite Regression Check

**Files:** none (verification only)

- [ ] **Step 1: Run the full backend suite**

Run: `cd backend && python -m pytest -v`
Expected: All prior tests still pass, plus every test added in Tasks 1-6, with zero new failures beyond the pre-existing, already-documented baseline (the same handful of failures/errors known to be unrelated to e-commerce work, present before this plan).

- [ ] **Step 2: Run the full frontend suite**

Run: `cd frontend && CI=true npx react-scripts test --watchAll=false`
Expected: All prior tests pass, plus every test added in Tasks 7-8.

- [ ] **Step 3: Manual SMTP checkpoint (optional — requires real credentials)**

This plan's automated tests mock `smtplib.SMTP` throughout; nothing in Tasks 1-9 makes a real network connection. If real SMTP credentials are available: save them via the new "Order emails (SMTP)" fields in the Shop tab, complete a Stripe test-mode checkout, and confirm a real email arrives. This step is optional and does not block considering the plan complete — the automated coverage already verifies every code path up to the actual `smtplib` call.

- [ ] **Step 4: Commit (only if Steps 1-2 required any fixups)**

```bash
git add -A
git commit -m "Fix regressions found in full-suite verification"
```
