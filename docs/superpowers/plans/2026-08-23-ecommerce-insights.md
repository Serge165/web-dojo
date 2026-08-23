# E-Commerce Phase 4: Insights Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give merchants deterministic, rule-based alerts over their existing order data — stale products, a weekly revenue drop, orders stuck in fulfillment, and a drop in returning-customer revenue share — surfaced in a new Insights tab.

**Architecture:** All backend work extends `backend/server.py` (the existing single-file FastAPI app) with one new endpoint, `GET /api/dashboard/{project_id}/insights`, which fetches the project's completed orders once (same equality-only query and "fetch then reduce in Python" pattern Phase 3's analytics endpoint already uses) and runs four independent rule functions over that one fetched set, each returning either an alert dict or `None`. No new collection, no new fields, no writes — fully stateless, recomputed on every call. Frontend work extends `EcommerceOrdersPanel.jsx` with a fourth "Insights" view (alongside Orders/Customers/Analytics) that fetches the endpoint and renders whatever alerts come back as cards, with an "all clear" empty state.

**Tech Stack:** FastAPI + Motor (MongoDB) / SQLite dev shim (unchanged), Python stdlib only on the backend (no new dependency), React + Jest on the frontend (no new dependency — no charting library needed for this phase).

**Spec:** `docs/superpowers/specs/2026-08-23-ecommerce-insights-design.md`

## Global Constraints

- No new dependencies, backend or frontend.
- `sqlite_compat`'s `find()` only supports flat equality matching (no `$gte`/`$gt`/`$lt`/`$in`). Every rule fetches from one pre-fetched `all_orders` list (`db.orders.find({"project_id": project_id, "status": "completed"}, {"_id": 0})`, fetched once in `get_insights`) and does all date-window comparisons in Python, exactly like the analytics endpoint.
- All computation happens at request time — no materialized/cached insights doc, no new collection, no dismiss/acknowledge state. Every alert is recomputed fresh on every call.
- Money stays integer cents everywhere in backend aggregation math — never floats. `revenue_drop`'s `percent_change` and `returning_share_drop`'s `current_share`/`prior_share` are the only non-cents numeric fields, and both are rounded integers (percent and percentage-points respectively), not decimals.
- The insights endpoint is token-gated exactly like `/orders`, `/customers`, and `/analytics`: `await _require_dashboard_token(project_id, x_dashboard_token)` as the first line, same 401 on a missing/invalid token.
- Window definitions (fixed constants, not configurable):
  - `stale_products`: trailing 30 days = `[today-29, today]` (matches Phase 3's `_analytics_window` exactly); prior 30 days = `[today-59, today-30]`, the 30 days immediately before that.
  - `revenue_drop`: current 7 days = `[today-6, today]`; prior 7 days = `[today-13, today-7]`. Threshold: current < prior × 0.8 (a drop of more than 20%), and only when prior > 0.
  - `stuck_fulfillment`: `fulfillment_status` in `{"processing", "shipped"}` (missing/legacy defaults to `"processing"`, matching Phase 2/3) and `created_at` date strictly before `today - 7 days` (i.e. more than 7 days old — an order dated exactly 7 days ago is not yet flagged).
  - `returning_share_drop`: current 30 days = `[today-29, today]`; prior 30 days = `[today-59, today-30]` (same windows as `stale_products`). Threshold: `prior_share - current_share > 15` percentage points, and only when both windows have `new_revenue + returning_revenue > 0`.
- New-vs-returning classification for `returning_share_drop` reuses the exact same logic as Phase 3's `_compute_customer_breakdown`: a customer's all-time earliest `created_at` (via the existing `_customer_first_order_dates(all_orders)` helper, already in `backend/server.py`) determines new vs. returning within a window — if their earliest-ever order falls inside the window being evaluated, they're new for that window; otherwise returning.
- Product identity for `stale_products` is the literal, trimmed, case-sensitive `line_items[].name` — same non-normalization as Phase 3's Top Products.
- Follow existing code style: `backend/server.py` stays one large file — extend it, don't split it. Backend tests live in `backend/tests/test_commerce_orders.py`, pytest, reusing the existing `client`/`project_id`/`db` fixtures. **The SQLite-backed test DB is created once at module import and never reset between tests — every literal `id`/`provider_ref` used anywhere in the file must be unique.** This plan's tests use an `ins-` (insights) id prefix throughout, confirmed collision-free against every existing prefix in the file (`an-`, `cs_`, `ord_`, etc.) before writing a single literal id.
- Frontend tests are Jest + React Testing Library, colocated as `*.test.jsx`. New markup in `EcommerceOrdersPanel.jsx` uses the exact token colors already established: backgrounds `#15130E` (base) / `#1C1A15` (panel) / `#242019` (raised/hover), border `#332D22`, text `#F1EDE2` (primary) / `#E4DECE` (softer) / `#948C79` (muted), accent `#C9A227` / `#D9BC55` (light). No `gray-*`/`blue-*` Tailwind classes, no `#0D0D0D`-family hex. Severity coloring reuses tones already present in this file rather than inventing a new palette: `warning` reuses `red-400` (already used for this file's `role="alert"` error text), `info` reuses `#D9BC55` (the existing light-gold accent).
- The new `showInsights()` handler must check `res.ok` before touching the response body **from the start** — Phase 3's `showAnalytics()`/`showCustomers()` originally shipped without this check and a missing check was the Critical bug caught in that phase's final review. Do not repeat it.

---

## Task 1: Insights Endpoint — Stale Products & Revenue Drop

The foundation: the endpoint and the two rules that only need the one fetched order set with no cross-referencing against customer history. Task 2 extends this same endpoint with the remaining two rules.

**Files:**
- Modify: `backend/server.py` (new code inserted after `get_analytics`, which ends at line 739)
- Test: `backend/tests/test_commerce_orders.py` (new class appended after `TestAnalyticsTopProducts`, which ends at line 1193)

**Interfaces:**
- Produces:
  - `_compute_stale_products(all_orders: list, today: date) -> Optional[dict]` — returns an alert dict (`{"id": "stale_products", "severity": "info", "title", "detail", "data": {"count", "products"}}`) or `None`.
  - `_compute_revenue_drop(all_orders: list, today: date) -> Optional[dict]` — returns an alert dict (`{"id": "revenue_drop", "severity": "warning", "title", "detail", "data": {"current_revenue", "prior_revenue", "percent_change"}}`) or `None`.
  - `GET /api/dashboard/{project_id}/insights` — returns `{"alerts": [...]}`. Task 2 extends the same endpoint's alert list with two more rules.
- Consumes: `_require_dashboard_token` (existing), `db.orders.find`/`.to_list` (existing, same pattern as `get_analytics`).

- [ ] **Step 1: Write the failing tests**

Add to `backend/tests/test_commerce_orders.py`, after `TestAnalyticsTopProducts` (ends at line 1193):

```python
class TestInsightsStaleProductsAndRevenueDrop:
    def _unlocked_token(self, client, project_id):
        client.post(f"/api/dashboard/{project_id}/set-password", json={"password": "hunter22"})
        return client.post(f"/api/dashboard/{project_id}/unlock", json={"password": "hunter22"}).json()["token"]

    def _order_with_items(self, order_id, project_id, created_at, line_items, amount=None, email="buyer@example.com"):
        return {
            "id": order_id, "project_id": project_id, "provider": "stripe", "provider_ref": f"ref-{order_id}",
            "status": "completed",
            "amount_total": amount if amount is not None else sum(i["quantity"] * i["unit_amount"] for i in line_items),
            "currency": "usd", "customer_email": email, "customer_name": None,
            "shipping_address": None, "line_items": line_items, "fulfillment_status": "processing",
            "created_at": created_at,
        }

    def test_without_a_token_is_rejected(self, client, project_id):
        r = client.get(f"/api/dashboard/{project_id}/insights")
        assert r.status_code == 401

    def test_a_product_with_no_sales_in_the_trailing_30_days_is_flagged_stale(self, client, project_id, db):
        today = datetime.now(timezone.utc).date()
        prior_day = (today - timedelta(days=45)).isoformat()
        db.orders.insert_one(self._order_with_items(
            "ins-stale-1", project_id, f"{prior_day}T00:00:00Z",
            [{"name": "Aurora Bottle", "quantity": 1, "unit_amount": 3800, "currency": "usd"}],
        ))
        token = self._unlocked_token(client, project_id)
        body = client.get(f"/api/dashboard/{project_id}/insights", headers={"X-Dashboard-Token": token}).json()
        alert = next(a for a in body["alerts"] if a["id"] == "stale_products")
        assert alert["severity"] == "info"
        assert alert["data"]["count"] == 1
        assert "Aurora Bottle" in alert["data"]["products"]

    def test_a_product_that_also_sold_in_the_trailing_30_days_is_not_flagged(self, client, project_id, db):
        today = datetime.now(timezone.utc).date()
        today_str = today.isoformat()
        prior_day = (today - timedelta(days=45)).isoformat()
        db.orders.insert_one(self._order_with_items(
            "ins-stale-2a", project_id, f"{prior_day}T00:00:00Z",
            [{"name": "Forge Mug", "quantity": 1, "unit_amount": 1800, "currency": "usd"}],
        ))
        db.orders.insert_one(self._order_with_items(
            "ins-stale-2b", project_id, f"{today_str}T00:00:00Z",
            [{"name": "Forge Mug", "quantity": 1, "unit_amount": 1800, "currency": "usd"}],
        ))
        token = self._unlocked_token(client, project_id)
        body = client.get(f"/api/dashboard/{project_id}/insights", headers={"X-Dashboard-Token": token}).json()
        assert not any(a["id"] == "stale_products" for a in body["alerts"])

    def test_revenue_down_more_than_20_percent_is_flagged(self, client, project_id, db):
        today = datetime.now(timezone.utc).date()
        current_day = today.isoformat()
        prior_day = (today - timedelta(days=10)).isoformat()
        db.orders.insert_one(self._order_with_items("ins-rev-cur-1", project_id, f"{current_day}T00:00:00Z", [], amount=1000))
        db.orders.insert_one(self._order_with_items("ins-rev-prior-1", project_id, f"{prior_day}T00:00:00Z", [], amount=2000))
        token = self._unlocked_token(client, project_id)
        body = client.get(f"/api/dashboard/{project_id}/insights", headers={"X-Dashboard-Token": token}).json()
        alert = next(a for a in body["alerts"] if a["id"] == "revenue_drop")
        assert alert["severity"] == "warning"
        assert alert["data"]["current_revenue"] == 1000
        assert alert["data"]["prior_revenue"] == 2000
        assert alert["data"]["percent_change"] == -50

    def test_revenue_drop_under_20_percent_is_not_flagged(self, client, project_id, db):
        today = datetime.now(timezone.utc).date()
        current_day = today.isoformat()
        prior_day = (today - timedelta(days=10)).isoformat()
        db.orders.insert_one(self._order_with_items("ins-rev-cur-2", project_id, f"{current_day}T00:00:00Z", [], amount=1900))
        db.orders.insert_one(self._order_with_items("ins-rev-prior-2", project_id, f"{prior_day}T00:00:00Z", [], amount=2000))
        token = self._unlocked_token(client, project_id)
        body = client.get(f"/api/dashboard/{project_id}/insights", headers={"X-Dashboard-Token": token}).json()
        assert not any(a["id"] == "revenue_drop" for a in body["alerts"])

    def test_no_prior_revenue_does_not_flag_a_drop(self, client, project_id, db):
        today_str = datetime.now(timezone.utc).date().isoformat()
        db.orders.insert_one(self._order_with_items("ins-rev-noprior-1", project_id, f"{today_str}T00:00:00Z", [], amount=1000))
        token = self._unlocked_token(client, project_id)
        body = client.get(f"/api/dashboard/{project_id}/insights", headers={"X-Dashboard-Token": token}).json()
        assert not any(a["id"] == "revenue_drop" for a in body["alerts"])
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && .venv/bin/python -m pytest tests/test_commerce_orders.py::TestInsightsStaleProductsAndRevenueDrop -v`
Expected: FAIL — `404 Not Found` (route doesn't exist yet).

- [ ] **Step 3: Implement**

In `backend/server.py`, after `get_analytics` (ends at line 739, right before `_build_google_fonts_link`), add:

```python
def _compute_stale_products(all_orders: list, today) -> Optional[dict]:
    trailing_start = (today - timedelta(days=29)).isoformat()
    trailing_end = today.isoformat()
    prior_start = (today - timedelta(days=59)).isoformat()
    prior_end = (today - timedelta(days=30)).isoformat()

    trailing_products = set()
    prior_products = set()
    for o in all_orders:
        day = (o.get("created_at") or "")[:10]
        for item in (o.get("line_items") or []):
            name = (item.get("name") or "").strip()
            if not name:
                continue
            if trailing_start <= day <= trailing_end:
                trailing_products.add(name)
            elif prior_start <= day <= prior_end:
                prior_products.add(name)

    stale = sorted(prior_products - trailing_products)
    if not stale:
        return None
    return {
        "id": "stale_products",
        "severity": "info",
        "title": "Products haven't sold recently",
        "detail": f"{len(stale)} product{'s' if len(stale) != 1 else ''} sold in the prior 30 days but haven't sold in the last 30.",
        "data": {"count": len(stale), "products": stale[:5]},
    }


def _compute_revenue_drop(all_orders: list, today) -> Optional[dict]:
    current_start = (today - timedelta(days=6)).isoformat()
    current_end = today.isoformat()
    prior_start = (today - timedelta(days=13)).isoformat()
    prior_end = (today - timedelta(days=7)).isoformat()

    current_revenue = 0
    prior_revenue = 0
    for o in all_orders:
        day = (o.get("created_at") or "")[:10]
        amount = o.get("amount_total", 0)
        if current_start <= day <= current_end:
            current_revenue += amount
        elif prior_start <= day <= prior_end:
            prior_revenue += amount

    if prior_revenue <= 0 or current_revenue >= prior_revenue * 0.8:
        return None

    percent_change = round((current_revenue - prior_revenue) / prior_revenue * 100)
    return {
        "id": "revenue_drop",
        "severity": "warning",
        "title": "Revenue is down",
        "detail": f"Revenue this week is down {abs(percent_change)}% from last week.",
        "data": {"current_revenue": current_revenue, "prior_revenue": prior_revenue, "percent_change": percent_change},
    }


@api_router.get("/dashboard/{project_id}/insights")
async def get_insights(project_id: str, x_dashboard_token: Optional[str] = Header(default=None)):
    await _require_dashboard_token(project_id, x_dashboard_token)
    today = datetime.now(timezone.utc).date()

    cursor = db.orders.find({"project_id": project_id, "status": "completed"}, {"_id": 0})
    all_orders = await cursor.to_list(length=None)

    alerts = []
    for alert in (_compute_stale_products(all_orders, today), _compute_revenue_drop(all_orders, today)):
        if alert is not None:
            alerts.append(alert)

    return {"alerts": alerts}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && .venv/bin/python -m pytest tests/test_commerce_orders.py::TestInsightsStaleProductsAndRevenueDrop -v`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add backend/server.py backend/tests/test_commerce_orders.py
git commit -m "feat: add insights endpoint with stale products and revenue drop alerts"
```

---

## Task 2: Insights Endpoint — Stuck Fulfillment & Returning-Share Drop

Completes the endpoint's four rules.

**Files:**
- Modify: `backend/server.py` (extends `get_insights`'s alert tuple, adds two helpers after Task 1's)
- Test: `backend/tests/test_commerce_orders.py`

**Interfaces:**
- Consumes: `_customer_first_order_dates(all_orders: list) -> dict` (existing, from Phase 3 — module-level in `backend/server.py`), `all_orders`/`today` from `get_insights` (Task 1).
- Produces:
  - `_compute_stuck_fulfillment(all_orders: list, today: date) -> Optional[dict]` — `{"id": "stuck_fulfillment", "severity": "warning", "title", "detail", "data": {"count", "order_refs"}}` or `None`.
  - `_compute_returning_share_drop(all_orders: list, first_order_dates: dict, today: date) -> Optional[dict]` — `{"id": "returning_share_drop", "severity": "info", "title", "detail", "data": {"current_share", "prior_share"}}` or `None`.
  - `get_insights`'s response now includes all four rules.

- [ ] **Step 1: Write the failing tests**

Add to `backend/tests/test_commerce_orders.py`, after `TestInsightsStaleProductsAndRevenueDrop`:

```python
class TestInsightsStuckFulfillmentAndReturningShareDrop:
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

    def _order_with_items(self, order_id, project_id, created_at, line_items, amount=None, email="buyer@example.com"):
        return {
            "id": order_id, "project_id": project_id, "provider": "stripe", "provider_ref": f"ref-{order_id}",
            "status": "completed",
            "amount_total": amount if amount is not None else sum(i["quantity"] * i["unit_amount"] for i in line_items),
            "currency": "usd", "customer_email": email, "customer_name": None,
            "shipping_address": None, "line_items": line_items, "fulfillment_status": "processing",
            "created_at": created_at,
        }

    def test_order_processing_for_more_than_7_days_is_flagged(self, client, project_id, db):
        today = datetime.now(timezone.utc).date()
        old_day = (today - timedelta(days=8)).isoformat()
        db.orders.insert_one(self._order("ins-stuck-1", project_id, 1000, f"{old_day}T00:00:00Z", fulfillment_status="processing"))
        token = self._unlocked_token(client, project_id)
        body = client.get(f"/api/dashboard/{project_id}/insights", headers={"X-Dashboard-Token": token}).json()
        alert = next(a for a in body["alerts"] if a["id"] == "stuck_fulfillment")
        assert alert["severity"] == "warning"
        assert alert["data"]["count"] == 1
        assert "ins-stuck-1" in alert["data"]["order_refs"]

    def test_order_processing_for_exactly_7_days_is_not_flagged(self, client, project_id, db):
        today = datetime.now(timezone.utc).date()
        edge_day = (today - timedelta(days=7)).isoformat()
        db.orders.insert_one(self._order("ins-stuck-notyet-1", project_id, 1000, f"{edge_day}T00:00:00Z", fulfillment_status="processing"))
        token = self._unlocked_token(client, project_id)
        body = client.get(f"/api/dashboard/{project_id}/insights", headers={"X-Dashboard-Token": token}).json()
        assert not any(a["id"] == "stuck_fulfillment" for a in body["alerts"])

    def test_delivered_order_is_never_flagged_regardless_of_age(self, client, project_id, db):
        today = datetime.now(timezone.utc).date()
        old_day = (today - timedelta(days=30)).isoformat()
        db.orders.insert_one(self._order("ins-stuck-delivered-1", project_id, 1000, f"{old_day}T00:00:00Z", fulfillment_status="delivered"))
        token = self._unlocked_token(client, project_id)
        body = client.get(f"/api/dashboard/{project_id}/insights", headers={"X-Dashboard-Token": token}).json()
        assert not any(a["id"] == "stuck_fulfillment" for a in body["alerts"])

    def test_returning_share_drop_flagged_when_share_falls_more_than_15_points(self, client, project_id, db):
        today = datetime.now(timezone.utc).date()
        old_day = (today - timedelta(days=90)).isoformat()
        prior_day = (today - timedelta(days=45)).isoformat()
        current_day = today.isoformat()
        db.orders.insert_one(self._order("ins-ret-oldorder-1", project_id, 500, f"{old_day}T00:00:00Z", email="returning@example.com"))
        db.orders.insert_one(self._order("ins-ret-priorwindow-1", project_id, 1000, f"{prior_day}T00:00:00Z", email="returning@example.com"))
        db.orders.insert_one(self._order("ins-ret-current-1", project_id, 1000, f"{current_day}T00:00:00Z", email="newcust@example.com"))
        token = self._unlocked_token(client, project_id)
        body = client.get(f"/api/dashboard/{project_id}/insights", headers={"X-Dashboard-Token": token}).json()
        alert = next(a for a in body["alerts"] if a["id"] == "returning_share_drop")
        assert alert["severity"] == "info"
        assert alert["data"]["current_share"] == 0
        assert alert["data"]["prior_share"] == 100

    def test_returning_share_drop_not_flagged_when_share_is_steady(self, client, project_id, db):
        today = datetime.now(timezone.utc).date()
        old_day = (today - timedelta(days=90)).isoformat()
        prior_day = (today - timedelta(days=45)).isoformat()
        current_day = today.isoformat()
        db.orders.insert_one(self._order("ins-ret-steady-old-1", project_id, 500, f"{old_day}T00:00:00Z", email="steady@example.com"))
        db.orders.insert_one(self._order("ins-ret-steady-prior-1", project_id, 1000, f"{prior_day}T00:00:00Z", email="steady@example.com"))
        db.orders.insert_one(self._order("ins-ret-steady-current-1", project_id, 1000, f"{current_day}T00:00:00Z", email="steady@example.com"))
        token = self._unlocked_token(client, project_id)
        body = client.get(f"/api/dashboard/{project_id}/insights", headers={"X-Dashboard-Token": token}).json()
        assert not any(a["id"] == "returning_share_drop" for a in body["alerts"])

    def test_returning_share_drop_not_flagged_when_a_window_has_no_revenue(self, client, project_id, db):
        today_str = datetime.now(timezone.utc).date().isoformat()
        db.orders.insert_one(self._order("ins-ret-onlycurrent-1", project_id, 500, f"{today_str}T00:00:00Z", email="onlycur@example.com"))
        token = self._unlocked_token(client, project_id)
        body = client.get(f"/api/dashboard/{project_id}/insights", headers={"X-Dashboard-Token": token}).json()
        assert not any(a["id"] == "returning_share_drop" for a in body["alerts"])

    def test_alerts_is_empty_when_nothing_triggers(self, client, project_id, db):
        token = self._unlocked_token(client, project_id)
        body = client.get(f"/api/dashboard/{project_id}/insights", headers={"X-Dashboard-Token": token}).json()
        assert body["alerts"] == []

    def test_multiple_alerts_can_appear_together(self, client, project_id, db):
        today = datetime.now(timezone.utc).date()
        stale_day = (today - timedelta(days=45)).isoformat()
        stuck_day = (today - timedelta(days=8)).isoformat()
        db.orders.insert_one(self._order_with_items(
            "ins-multi-stale-1", project_id, f"{stale_day}T00:00:00Z",
            [{"name": "Dojo Tee", "quantity": 1, "unit_amount": 2200, "currency": "usd"}],
            email="multi-stale@example.com",
        ))
        db.orders.insert_one(self._order("ins-multi-stuck-1", project_id, 1500, f"{stuck_day}T00:00:00Z", email="multi-stuck@example.com"))
        token = self._unlocked_token(client, project_id)
        body = client.get(f"/api/dashboard/{project_id}/insights", headers={"X-Dashboard-Token": token}).json()
        ids = {a["id"] for a in body["alerts"]}
        assert "stale_products" in ids
        assert "stuck_fulfillment" in ids
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && .venv/bin/python -m pytest tests/test_commerce_orders.py::TestInsightsStuckFulfillmentAndReturningShareDrop -v`
Expected: FAIL — `StopIteration` from the `next(...)` calls (rules not implemented yet), or wrong `alerts` contents.

- [ ] **Step 3: Implement**

In `backend/server.py`, after `_compute_revenue_drop` (added in Task 1) and before `get_insights`, add:

```python
def _compute_stuck_fulfillment(all_orders: list, today) -> Optional[dict]:
    threshold_date = (today - timedelta(days=7)).isoformat()
    stuck = []
    for o in all_orders:
        status = o.get("fulfillment_status") or "processing"
        if status not in ("processing", "shipped"):
            continue
        day = (o.get("created_at") or "")[:10]
        if day and day < threshold_date:
            stuck.append(o)
    if not stuck:
        return None
    stuck.sort(key=lambda o: o.get("created_at") or "")
    return {
        "id": "stuck_fulfillment",
        "severity": "warning",
        "title": "Orders stuck in fulfillment",
        "detail": f"{len(stuck)} order{'s' if len(stuck) != 1 else ''} have been processing or shipped for more than 7 days.",
        "data": {"count": len(stuck), "order_refs": [o["id"] for o in stuck[:5]]},
    }


def _compute_returning_share_drop(all_orders: list, first_order_dates: dict, today) -> Optional[dict]:
    current_start = (today - timedelta(days=29)).isoformat()
    current_end = today.isoformat()
    prior_start = (today - timedelta(days=59)).isoformat()
    prior_end = (today - timedelta(days=30)).isoformat()

    def share_for_window(start, end):
        new_revenue = 0
        returning_revenue = 0
        for o in all_orders:
            email = (o.get("customer_email") or "").strip().lower()
            if not email:
                continue
            day = (o.get("created_at") or "")[:10]
            if not (start <= day <= end):
                continue
            amount = o.get("amount_total", 0)
            first_date = first_order_dates.get(email)
            if first_date is not None and first_date >= start:
                new_revenue += amount
            else:
                returning_revenue += amount
        total = new_revenue + returning_revenue
        if total <= 0:
            return None
        return returning_revenue / total

    current_share = share_for_window(current_start, current_end)
    prior_share = share_for_window(prior_start, prior_end)
    if current_share is None or prior_share is None:
        return None

    current_pct = round(current_share * 100)
    prior_pct = round(prior_share * 100)
    if prior_pct - current_pct <= 15:
        return None

    return {
        "id": "returning_share_drop",
        "severity": "info",
        "title": "Repeat business is down",
        "detail": f"Returning customers made up {current_pct}% of revenue this month, down from {prior_pct}% last month.",
        "data": {"current_share": current_pct, "prior_share": prior_pct},
    }
```

Replace `get_insights`'s body (from Task 1) with:

```python
@api_router.get("/dashboard/{project_id}/insights")
async def get_insights(project_id: str, x_dashboard_token: Optional[str] = Header(default=None)):
    await _require_dashboard_token(project_id, x_dashboard_token)
    today = datetime.now(timezone.utc).date()

    cursor = db.orders.find({"project_id": project_id, "status": "completed"}, {"_id": 0})
    all_orders = await cursor.to_list(length=None)
    first_order_dates = _customer_first_order_dates(all_orders)

    alerts = []
    for alert in (
        _compute_stale_products(all_orders, today),
        _compute_revenue_drop(all_orders, today),
        _compute_stuck_fulfillment(all_orders, today),
        _compute_returning_share_drop(all_orders, first_order_dates, today),
    ):
        if alert is not None:
            alerts.append(alert)

    return {"alerts": alerts}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && .venv/bin/python -m pytest tests/test_commerce_orders.py -k Insights -v`
Expected: PASS (14 tests total across both Insights test classes)

- [ ] **Step 5: Commit**

```bash
git add backend/server.py backend/tests/test_commerce_orders.py
git commit -m "feat: add stuck fulfillment and returning-share-drop alerts to insights endpoint"
```

---

## Task 3: Frontend — Insights Tab

**Files:**
- Modify: `frontend/src/components/builder/EcommerceOrdersPanel.jsx`
- Test: `frontend/src/components/builder/EcommerceOrdersPanel.test.jsx`

**Interfaces:**
- Consumes: `GET /api/dashboard/{project_id}/insights` (Tasks 1-2), response shape `{alerts: [{id, severity, title, detail, data}]}`.
- Produces: a fourth `view` state value `"insights"` (alongside the existing `"orders"`/`"customers"`/`"analytics"`), a `showInsights()` handler, and an `insights` state variable holding the alerts array (or `null` before the tab is opened).

- [ ] **Step 1: Write the failing tests**

Add to `frontend/src/components/builder/EcommerceOrdersPanel.test.jsx`:

```jsx
test("the Insights tab loads and displays alert cards", async () => {
  global.fetch
    .mockResolvedValueOnce({ ok: true, json: async () => ({ token: "tok-abc" }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ orders: [], total: 0, page: 1, page_size: 20 }) })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        alerts: [
          { id: "revenue_drop", severity: "warning", title: "Revenue is down", detail: "Revenue this week is down 34% from last week.", data: {} },
          { id: "stale_products", severity: "info", title: "Products haven't sold recently", detail: "2 products sold in the prior 30 days but haven't sold in the last 30.", data: {} },
        ],
      }),
    });

  render(<EcommerceOrdersPanel projectId="proj-123" />);
  fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: "hunter22" } });
  fireEvent.click(screen.getByText(/unlock/i));
  await waitFor(() => expect(screen.getByRole("button", { name: /insights/i })).toBeInTheDocument());

  fireEvent.click(screen.getByRole("button", { name: /insights/i }));

  await waitFor(() => expect(screen.getByTestId("insight-revenue_drop")).toBeInTheDocument());
  expect(screen.getByText(/revenue is down/i)).toBeInTheDocument();
  expect(screen.getByTestId("insight-stale_products")).toBeInTheDocument();
});

test("the Insights tab shows an all-clear state when there are no alerts", async () => {
  global.fetch
    .mockResolvedValueOnce({ ok: true, json: async () => ({ token: "tok-abc" }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ orders: [], total: 0, page: 1, page_size: 20 }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ alerts: [] }) });

  render(<EcommerceOrdersPanel projectId="proj-123" />);
  fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: "hunter22" } });
  fireEvent.click(screen.getByText(/unlock/i));
  await waitFor(() => expect(screen.getByRole("button", { name: /insights/i })).toBeInTheDocument());

  fireEvent.click(screen.getByRole("button", { name: /insights/i }));

  await waitFor(() => expect(screen.getByTestId("insights-empty")).toBeInTheDocument());
});

test("the Insights tab shows an error message when the fetch response is not ok", async () => {
  global.fetch
    .mockResolvedValueOnce({ ok: true, json: async () => ({ token: "tok-abc" }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ orders: [], total: 0, page: 1, page_size: 20 }) })
    .mockResolvedValueOnce({ ok: false, json: async () => ({ detail: "Server error" }) });

  render(<EcommerceOrdersPanel projectId="proj-123" />);
  fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: "hunter22" } });
  fireEvent.click(screen.getByText(/unlock/i));
  await waitFor(() => expect(screen.getByRole("button", { name: /insights/i })).toBeInTheDocument());

  fireEvent.click(screen.getByRole("button", { name: /insights/i }));

  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(/couldn't load insights/i));
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && CI=true npx craco test EcommerceOrdersPanel -t "Insights tab" --watchAll=false`
Expected: FAIL — no "Insights" button exists yet.

- [ ] **Step 3: Implement**

In `frontend/src/components/builder/EcommerceOrdersPanel.jsx`:

Add state alongside the existing `analytics`/`view` state:

```jsx
const [insights, setInsights] = useState(null);
```

Add a handler alongside `showAnalytics`:

```jsx
const showInsights = async () => {
  setView("insights");
  try {
    const res = await fetch(`${API}/api/dashboard/${projectId}/insights`, {
      headers: { "X-Dashboard-Token": token },
    });
    const body = await res.json();
    if (!res.ok) {
      setError("Couldn't load insights. Please try again.");
      return;
    }
    setInsights(body.alerts || []);
  } catch {
    setError("Couldn't load insights. Please try again.");
  }
};
```

Add a fourth tab button next to the existing Orders/Customers/Analytics buttons:

```jsx
<button
  onClick={showInsights}
  className={`px-3 py-1.5 text-xs rounded ${view === "insights" ? "bg-[#242019] text-[#F1EDE2]" : "text-[#A79C87] hover:text-[#F1EDE2]"}`}
>Insights</button>
```

Add the Insights view render block, alongside the existing `view === "orders"`/`"customers"`/`"analytics"` blocks:

```jsx
{view === "insights" && insights && (
  <div className="space-y-3">
    {insights.length === 0 ? (
      <div className="bg-[#1C1A15] border border-[#332D22] rounded-lg p-4 text-sm text-[#948C79]" data-testid="insights-empty">
        All clear — no issues detected.
      </div>
    ) : (
      insights.map((alert) => (
        <div
          key={alert.id}
          data-testid={`insight-${alert.id}`}
          className={`bg-[#1C1A15] border border-[#332D22] border-l-4 rounded-lg p-4 ${alert.severity === "warning" ? "border-l-red-400" : "border-l-[#D9BC55]"}`}
        >
          <div className="text-sm font-semibold text-[#F1EDE2] mb-1">{alert.title}</div>
          <div className="text-xs text-[#E4DECE]">{alert.detail}</div>
        </div>
      ))
    )}
  </div>
)}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && CI=true npx craco test EcommerceOrdersPanel --watchAll=false`
Expected: PASS (all EcommerceOrdersPanel tests)

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/builder/EcommerceOrdersPanel.jsx frontend/src/components/builder/EcommerceOrdersPanel.test.jsx
git commit -m "feat: add Insights tab with alert cards and all-clear empty state"
```

---

## Task 4: Full-Suite Regression Check

**Files:** none (verification only)

**Interfaces:** none — this task asserts the full test suites still pass after Tasks 1-3.

- [ ] **Step 1: Run the full backend suite**

Run: `cd backend && .venv/bin/python -m pytest -v`
Expected: all tests pass, including the 14 new Insights tests from Tasks 1-2. Compare the failure count against the pre-Phase-4 baseline (capture it before Task 1 starts) — any new failure not present in that baseline is a regression this plan introduced and must be fixed before this task is marked complete.

- [ ] **Step 2: Run the full frontend suite**

Run: `cd frontend && CI=true npx craco test --watchAll=false`
Expected: all suites pass, including the 3 new EcommerceOrdersPanel tests from Task 3.

- [ ] **Step 3: Manual smoke check (optional, non-blocking)**

Start the dev server (`cd frontend && npm start` if not already running), unlock a project's dashboard, click Insights, and confirm both the alert-card view (with some seeded stale/stuck/dropped data) and the "All clear" empty state render without crashing. This is optional because automated coverage already verifies every code path — the same reasoning Phase 3's plan used for its own optional manual checkpoint.

- [ ] **Step 4: Commit (if Step 1 or 2 required fixes)**

```bash
git add -A
git commit -m "fix: resolve regressions found in Phase 4 full-suite check"
```

If no fixes were needed, skip this step — there's nothing to commit.
