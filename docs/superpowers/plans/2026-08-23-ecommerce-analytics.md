# E-Commerce Phase 3: Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give merchants a read-only analytics view over the last 30 days of their orders — revenue trend, fulfillment funnel, new-vs-returning customer breakdown, top products — plus CSV export of the existing Orders/Customers tables.

**Architecture:** All backend work extends `backend/server.py` (the existing single-file FastAPI app). One new endpoint, `GET /api/dashboard/{project_id}/analytics`, computes all four metric groups in a single pass over the project's completed orders, fetched once with the existing equality-only query (`sqlite_compat` has no `$gte`/date-range support, so the 30-day window is applied in Python after the fetch — the same "fetch then reduce" pattern Phase 2 already used for customer aggregation, just with the date filter also done in Python rather than at the query layer). No new collection, no new fields. Frontend work extends the existing `EcommerceOrdersPanel.jsx` with a third "Analytics" view (alongside Orders/Customers) rendered with `recharts` (already installed), plus client-side CSV export buttons on the Orders and Customers tabs.

**Tech Stack:** FastAPI + Motor (MongoDB) / SQLite dev shim (unchanged), Python stdlib only on the backend (no new dependency), `recharts@3.6.0` on the frontend (already installed, no new dependency), React + Jest.

**Spec:** `docs/superpowers/specs/2026-08-23-ecommerce-analytics-design.md`

## Global Constraints

- No new dependencies, backend or frontend. `recharts` is already installed; CSV export uses native `Blob`/`<a download>`, no library.
- `sqlite_compat`'s `find()` only supports flat equality matching (confirmed by reading `backend/sqlite_compat.py`'s `_matches` — no `$gte`/`$gt`/`$lt`/`$in`). The analytics endpoint therefore fetches all of a project's completed orders with the same equality filter `list_customers` already uses (`{"project_id": project_id, "status": "completed"}`) and does every date-window comparison in Python.
- All aggregation is computed at request time from the `orders` collection — no materialized/cached analytics doc, no new collection. Matches Phase 2's reasoning: realistic order volumes for a site-builder's shop stay cheap to recompute on every load, and it guarantees the numbers never drift from the underlying orders.
- The window is always the trailing 30 calendar days (UTC), inclusive of today — `window_start = today - 29 days`, `window_end = today`. No selectable date range in this phase.
- Money stays integer cents everywhere in the backend response and in aggregation math (`amount_total`, `unit_amount`, all summed as plain integers — never floats). The frontend converts to decimal only for display and CSV output (`(cents / 100).toFixed(2)`), matching how `EcommerceOrdersPanel.jsx` already formats order amounts.
- The analytics endpoint is token-gated exactly like `/orders` and `/customers`: `await _require_dashboard_token(project_id, x_dashboard_token)` as the first line, same 401 on a missing/invalid token.
- Customer identity is the lowercased/trimmed `customer_email`, matching Phase 2's customer aggregation exactly. Product identity for Top Products is the literal, trimmed, **case-sensitive** `line_items[].name` — deliberately not normalized the way emails are, since there's no product catalog in this codebase to canonicalize against (matches the spec's explicit non-goal).
- Orders with no `customer_email` are excluded from the customer breakdown but still count toward revenue trend and the fulfillment funnel — same exclusion Phase 2 applies to customer aggregation.
- Follow existing code style: `backend/server.py` stays one large file — extend it, don't split it. Backend tests live in `backend/tests/test_commerce_orders.py`, pytest, reusing the existing `client`/`project_id`/`db` fixtures. **The SQLite-backed test DB is created once at module import and never reset between tests — every literal `id`/`provider_ref` used anywhere in the file must be unique.** This plan's tests use an `an-` (analytics) id prefix throughout; before writing a new test's literal ids, grep the file for the exact string you're about to use to confirm nothing else already claims it.
- Frontend tests are Jest + React Testing Library, colocated as `*.test.jsx`. New markup in `EcommerceOrdersPanel.jsx` uses the exact token colors already established this session: backgrounds `#15130E` (base) / `#1C1A15` (panel) / `#242019` (raised/hover), border `#332D22`, text `#F1EDE2` (primary) / `#E4DECE` (softer) / `#948C79` (muted), accent `#C9A227` / `#D9BC55` (light). No `gray-*`/`blue-*` Tailwind classes, no `#0D0D0D`-family hex.
- `recharts`' `ResponsiveContainer` measures real DOM layout, which jsdom (the Jest test environment) reports as zero-size — charts render but their internal SVG content doesn't reliably appear in the test DOM. Frontend tests for the revenue-trend chart assert on the summary numbers and fulfillment/customer/product tiles (plain divs/tables, not recharts internals), never on chart pixels or SVG paths.

---

## Task 1: Analytics Endpoint — Revenue Trend & Fulfillment Funnel

The foundation: the endpoint, the 30-day window helper, and the two metrics that only need the window-filtered order set (no cross-referencing against all-time history). Tasks 2 and 3 extend this same endpoint's response with `customer_breakdown` and `top_products`.

**Files:**
- Modify: `backend/server.py` (datetime import near line 18; new code inserted after `list_customers`, which ends at line 632)
- Test: `backend/tests/test_commerce_orders.py`

**Interfaces:**
- Produces:
  - `_analytics_window() -> tuple[str, str, list[str]]` — returns `(window_start, window_end, dates)` where `window_start`/`window_end` are `"YYYY-MM-DD"` strings 29 days apart and `dates` is the list of all 30 `"YYYY-MM-DD"` strings from `window_start` to `window_end` inclusive.
  - `_compute_revenue_trend(window_orders: list[dict], dates: list[str]) -> list[dict]` — one `{"date": ..., "order_count": ..., "revenue": ...}` entry per date in `dates`, in the same order.
  - `_compute_fulfillment_funnel(window_orders: list[dict]) -> dict` — always `{"processing": N, "shipped": N, "delivered": N}`.
  - `GET /api/dashboard/{project_id}/analytics` — returns `{"window": {"start", "end", "days"}, "revenue_trend": [...], "fulfillment_funnel": {...}}` (Tasks 2/3 add `customer_breakdown` and `top_products` to this same object).
- Consumes: `_require_dashboard_token`, `db.orders.find`/`.to_list` (existing, from `list_customers`'s usage at line 609-613).

- [ ] **Step 1: Write the failing tests**

Add to `backend/tests/test_commerce_orders.py`, after the `TestCustomersEndpoint` class (ends at line 999):

```python
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && pytest tests/test_commerce_orders.py::TestAnalyticsRevenueAndFunnel -v`
Expected: FAIL — `404 Not Found` (route doesn't exist yet) or `AttributeError`/`KeyError` on `body["revenue_trend"]`.

- [ ] **Step 3: Implement**

In `backend/server.py`, change the import at line 18:

```python
from datetime import datetime, timedelta, timezone
```

After `list_customers` (ends at line 632), add:

```python
def _analytics_window() -> tuple[str, str, list[str]]:
    end = datetime.now(timezone.utc).date()
    start = end - timedelta(days=29)
    dates = [(start + timedelta(days=i)).isoformat() for i in range(30)]
    return start.isoformat(), end.isoformat(), dates


def _compute_revenue_trend(window_orders: list, dates: list) -> list:
    buckets = {d: {"date": d, "order_count": 0, "revenue": 0} for d in dates}
    for o in window_orders:
        day = (o.get("created_at") or "")[:10]
        bucket = buckets.get(day)
        if bucket is None:
            continue
        bucket["order_count"] += 1
        bucket["revenue"] += o.get("amount_total", 0)
    return [buckets[d] for d in dates]


def _compute_fulfillment_funnel(window_orders: list) -> dict:
    funnel = {"processing": 0, "shipped": 0, "delivered": 0}
    for o in window_orders:
        status = o.get("fulfillment_status") or "processing"
        if status in funnel:
            funnel[status] += 1
    return funnel


@api_router.get("/dashboard/{project_id}/analytics")
async def get_analytics(project_id: str, x_dashboard_token: Optional[str] = Header(default=None)):
    await _require_dashboard_token(project_id, x_dashboard_token)
    window_start, window_end, dates = _analytics_window()

    cursor = db.orders.find({"project_id": project_id, "status": "completed"}, {"_id": 0})
    all_orders = await cursor.to_list(length=None)
    window_orders = [
        o for o in all_orders
        if window_start <= (o.get("created_at") or "")[:10] <= window_end
    ]

    return {
        "window": {"start": window_start, "end": window_end, "days": 30},
        "revenue_trend": _compute_revenue_trend(window_orders, dates),
        "fulfillment_funnel": _compute_fulfillment_funnel(window_orders),
    }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && pytest tests/test_commerce_orders.py::TestAnalyticsRevenueAndFunnel -v`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add backend/server.py backend/tests/test_commerce_orders.py
git commit -m "feat: add analytics endpoint with revenue trend and fulfillment funnel"
```

---

## Task 2: Customer Breakdown (New vs. Returning)

**Files:**
- Modify: `backend/server.py` (extends `get_analytics` and adds two helpers, right after the Task 1 functions)
- Test: `backend/tests/test_commerce_orders.py`

**Interfaces:**
- Consumes: `window_orders`, `all_orders`, `window_start` from `get_analytics` (Task 1).
- Produces:
  - `_customer_first_order_dates(all_orders: list) -> dict` — maps lowercased/trimmed `customer_email` to that customer's earliest `"YYYY-MM-DD"` order date across all their orders (any date, not window-limited).
  - `_compute_customer_breakdown(window_orders: list, first_order_dates: dict, window_start: str) -> dict` — returns `{"new_customers", "returning_customers", "new_revenue", "returning_revenue"}`.
  - `get_analytics`'s response gains a `"customer_breakdown"` key.

- [ ] **Step 1: Write the failing tests**

Add to `backend/tests/test_commerce_orders.py`, after `TestAnalyticsRevenueAndFunnel`:

```python
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && pytest tests/test_commerce_orders.py::TestAnalyticsCustomerBreakdown -v`
Expected: FAIL — `KeyError: 'customer_breakdown'`

- [ ] **Step 3: Implement**

In `backend/server.py`, after `_compute_fulfillment_funnel` (added in Task 1), add:

```python
def _customer_first_order_dates(all_orders: list) -> dict:
    first_dates: dict = {}
    for o in all_orders:
        email = (o.get("customer_email") or "").strip().lower()
        if not email:
            continue
        day = (o.get("created_at") or "")[:10]
        if email not in first_dates or day < first_dates[email]:
            first_dates[email] = day
    return first_dates


def _compute_customer_breakdown(window_orders: list, first_order_dates: dict, window_start: str) -> dict:
    new_customers = set()
    returning_customers = set()
    new_revenue = 0
    returning_revenue = 0
    for o in window_orders:
        email = (o.get("customer_email") or "").strip().lower()
        if not email:
            continue
        first_date = first_order_dates.get(email)
        if first_date is not None and first_date >= window_start:
            new_customers.add(email)
            new_revenue += o.get("amount_total", 0)
        else:
            returning_customers.add(email)
            returning_revenue += o.get("amount_total", 0)
    return {
        "new_customers": len(new_customers),
        "returning_customers": len(returning_customers),
        "new_revenue": new_revenue,
        "returning_revenue": returning_revenue,
    }
```

In `get_analytics`, after `window_orders = [...]`, add:

```python
    first_order_dates = _customer_first_order_dates(all_orders)
```

And add `"customer_breakdown"` to the returned dict:

```python
    return {
        "window": {"start": window_start, "end": window_end, "days": 30},
        "revenue_trend": _compute_revenue_trend(window_orders, dates),
        "fulfillment_funnel": _compute_fulfillment_funnel(window_orders),
        "customer_breakdown": _compute_customer_breakdown(window_orders, first_order_dates, window_start),
    }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && pytest tests/test_commerce_orders.py::TestAnalyticsCustomerBreakdown tests/test_commerce_orders.py::TestAnalyticsRevenueAndFunnel -v`
Expected: PASS (12 tests total)

- [ ] **Step 5: Commit**

```bash
git add backend/server.py backend/tests/test_commerce_orders.py
git commit -m "feat: add new-vs-returning customer breakdown to analytics endpoint"
```

---

## Task 3: Top Products

**Files:**
- Modify: `backend/server.py` (extends `get_analytics`, adds one helper)
- Test: `backend/tests/test_commerce_orders.py`

**Interfaces:**
- Consumes: `window_orders` from `get_analytics` (Task 1).
- Produces: `_compute_top_products(window_orders: list, limit: int = 10) -> list` — returns up to `limit` `{"name", "quantity", "revenue"}` entries, sorted by `revenue` descending. `get_analytics`'s response gains a `"top_products"` key.

- [ ] **Step 1: Write the failing tests**

Add to `backend/tests/test_commerce_orders.py`, after `TestAnalyticsCustomerBreakdown`:

```python
class TestAnalyticsTopProducts:
    def _unlocked_token(self, client, project_id):
        client.post(f"/api/dashboard/{project_id}/set-password", json={"password": "hunter22"})
        return client.post(f"/api/dashboard/{project_id}/unlock", json={"password": "hunter22"}).json()["token"]

    def _order_with_items(self, order_id, project_id, created_at, line_items):
        return {
            "id": order_id, "project_id": project_id, "provider": "stripe", "provider_ref": f"ref-{order_id}",
            "status": "completed", "amount_total": sum(i["quantity"] * i["unit_amount"] for i in line_items),
            "currency": "usd", "customer_email": "buyer@example.com", "customer_name": None,
            "shipping_address": None, "line_items": line_items, "fulfillment_status": "processing",
            "created_at": created_at,
        }

    def test_two_orders_for_the_same_product_sum_quantity_and_revenue(self, client, project_id, db):
        today_str = datetime.now(timezone.utc).date().isoformat()
        db.orders.insert_one(self._order_with_items(
            "an-tp-1", project_id, f"{today_str}T00:00:00Z",
            [{"name": "Aurora Bottle", "quantity": 2, "unit_amount": 3800, "currency": "usd"}],
        ))
        db.orders.insert_one(self._order_with_items(
            "an-tp-2", project_id, f"{today_str}T00:00:00Z",
            [{"name": "Aurora Bottle", "quantity": 1, "unit_amount": 3800, "currency": "usd"}],
        ))
        token = self._unlocked_token(client, project_id)
        body = client.get(f"/api/dashboard/{project_id}/analytics", headers={"X-Dashboard-Token": token}).json()
        assert len(body["top_products"]) == 1
        assert body["top_products"][0] == {"name": "Aurora Bottle", "quantity": 3, "revenue": 11400}

    def test_products_are_sorted_by_revenue_descending(self, client, project_id, db):
        today_str = datetime.now(timezone.utc).date().isoformat()
        db.orders.insert_one(self._order_with_items(
            "an-tp-sort-1", project_id, f"{today_str}T00:00:00Z",
            [{"name": "Cheap Sticker", "quantity": 10, "unit_amount": 100, "currency": "usd"}],
        ))
        db.orders.insert_one(self._order_with_items(
            "an-tp-sort-2", project_id, f"{today_str}T00:00:00Z",
            [{"name": "Expensive Vase", "quantity": 1, "unit_amount": 50000, "currency": "usd"}],
        ))
        token = self._unlocked_token(client, project_id)
        body = client.get(f"/api/dashboard/{project_id}/analytics", headers={"X-Dashboard-Token": token}).json()
        assert [p["name"] for p in body["top_products"]] == ["Expensive Vase", "Cheap Sticker"]

    def test_more_than_ten_products_only_returns_the_top_ten(self, client, project_id, db):
        today_str = datetime.now(timezone.utc).date().isoformat()
        items = [{"name": f"Product {i}", "quantity": 1, "unit_amount": (i + 1) * 100, "currency": "usd"} for i in range(11)]
        db.orders.insert_one(self._order_with_items("an-tp-many-1", project_id, f"{today_str}T00:00:00Z", items))
        token = self._unlocked_token(client, project_id)
        body = client.get(f"/api/dashboard/{project_id}/analytics", headers={"X-Dashboard-Token": token}).json()
        assert len(body["top_products"]) == 10
        assert body["top_products"][0]["name"] == "Product 10"

    def test_orders_outside_the_window_do_not_contribute_to_top_products(self, client, project_id, db):
        today = datetime.now(timezone.utc).date()
        old_str = (today - timedelta(days=40)).isoformat()
        db.orders.insert_one(self._order_with_items(
            "an-tp-old-1", project_id, f"{old_str}T00:00:00Z",
            [{"name": "Old Product", "quantity": 5, "unit_amount": 1000, "currency": "usd"}],
        ))
        token = self._unlocked_token(client, project_id)
        body = client.get(f"/api/dashboard/{project_id}/analytics", headers={"X-Dashboard-Token": token}).json()
        assert body["top_products"] == []
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && pytest tests/test_commerce_orders.py::TestAnalyticsTopProducts -v`
Expected: FAIL — `KeyError: 'top_products'`

- [ ] **Step 3: Implement**

In `backend/server.py`, after `_compute_customer_breakdown` (added in Task 2), add:

```python
def _compute_top_products(window_orders: list, limit: int = 10) -> list:
    grouped: dict = {}
    for o in window_orders:
        for item in (o.get("line_items") or []):
            name = (item.get("name") or "").strip()
            if not name:
                continue
            bucket = grouped.setdefault(name, {"name": name, "quantity": 0, "revenue": 0})
            qty = item.get("quantity", 0) or 0
            unit_amount = item.get("unit_amount", 0) or 0
            bucket["quantity"] += qty
            bucket["revenue"] += qty * unit_amount
    products = sorted(grouped.values(), key=lambda p: p["revenue"], reverse=True)
    return products[:limit]
```

Add `"top_products"` to `get_analytics`'s returned dict:

```python
    return {
        "window": {"start": window_start, "end": window_end, "days": 30},
        "revenue_trend": _compute_revenue_trend(window_orders, dates),
        "fulfillment_funnel": _compute_fulfillment_funnel(window_orders),
        "customer_breakdown": _compute_customer_breakdown(window_orders, first_order_dates, window_start),
        "top_products": _compute_top_products(window_orders),
    }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && pytest tests/test_commerce_orders.py -k Analytics -v`
Expected: PASS (16 tests total across all three Analytics test classes)

- [ ] **Step 5: Commit**

```bash
git add backend/server.py backend/tests/test_commerce_orders.py
git commit -m "feat: add top products to analytics endpoint"
```

---

## Task 4: Frontend — Analytics Tab (Revenue Chart + Fulfillment Funnel)

**Files:**
- Modify: `frontend/src/components/builder/EcommerceOrdersPanel.jsx`
- Test: `frontend/src/components/builder/EcommerceOrdersPanel.test.jsx`

**Interfaces:**
- Consumes: `GET /api/dashboard/{project_id}/analytics` (Tasks 1-3), response shape `{window, revenue_trend, fulfillment_funnel, customer_breakdown, top_products}`.
- Produces: a third `view` state value `"analytics"` (alongside the existing `"orders"`/`"customers"`), a `showAnalytics()` handler, and an `analytics` state variable that Task 5 extends with the customer-breakdown/top-products sections.

- [ ] **Step 1: Write the failing test**

Add to `frontend/src/components/builder/EcommerceOrdersPanel.test.jsx`:

```jsx
test("the Analytics tab loads and displays fulfillment funnel counts", async () => {
  global.fetch
    .mockResolvedValueOnce({ ok: true, json: async () => ({ token: "tok-abc" }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ orders: [], total: 0, page: 1, page_size: 20 }) })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        window: { start: "2026-07-25", end: "2026-08-23", days: 30 },
        revenue_trend: [{ date: "2026-08-23", order_count: 2, revenue: 5000 }],
        fulfillment_funnel: { processing: 3, shipped: 1, delivered: 2 },
        customer_breakdown: { new_customers: 0, returning_customers: 0, new_revenue: 0, returning_revenue: 0 },
        top_products: [],
      }),
    });

  render(<EcommerceOrdersPanel projectId="proj-123" />);
  fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: "hunter22" } });
  fireEvent.click(screen.getByText(/unlock/i));
  await waitFor(() => expect(screen.getByRole("button", { name: /analytics/i })).toBeInTheDocument());

  fireEvent.click(screen.getByRole("button", { name: /analytics/i }));

  await waitFor(() => expect(screen.getByTestId("funnel-shipped")).toHaveTextContent("1"));
  expect(screen.getByTestId("funnel-processing")).toHaveTextContent("3");
  expect(screen.getByTestId("funnel-delivered")).toHaveTextContent("2");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && CI=true npx craco test EcommerceOrdersPanel -t "Analytics tab" --watchAll=false`
Expected: FAIL — no "Analytics" button exists yet.

- [ ] **Step 3: Implement**

In `frontend/src/components/builder/EcommerceOrdersPanel.jsx`:

Add the import at the top:

```jsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
```

Add state alongside the existing `customers`/`view` state:

```jsx
const [analytics, setAnalytics] = useState(null);
```

Add a handler alongside `showCustomers`:

```jsx
const showAnalytics = async () => {
  setView("analytics");
  try {
    const res = await fetch(`${API}/api/dashboard/${projectId}/analytics`, {
      headers: { "X-Dashboard-Token": token },
    });
    const body = await res.json();
    setAnalytics(body);
  } catch {
    setError("Couldn't load analytics. Please try again.");
  }
};
```

Add a third tab button next to the existing Orders/Customers buttons:

```jsx
<button
  onClick={showAnalytics}
  className={`px-3 py-1.5 text-xs rounded ${view === "analytics" ? "bg-[#242019] text-[#F1EDE2]" : "text-[#A79C87] hover:text-[#F1EDE2]"}`}
>Analytics</button>
```

Add the Analytics view render block, alongside the existing `view === "orders"`/`view === "customers"` blocks:

```jsx
{view === "analytics" && analytics && (
  <div className="space-y-4">
    <div className="bg-[#1C1A15] border border-[#332D22] rounded-lg p-4">
      <div className="text-[10px] uppercase tracking-wider text-[#948C79] mb-3">Revenue · last 30 days</div>
      <div className="flex gap-6 mb-4">
        <div>
          <div className="text-2xl font-semibold text-[#F1EDE2]">
            {(analytics.revenue_trend.reduce((s, d) => s + d.revenue, 0) / 100).toFixed(2)}
          </div>
          <div className="text-[10px] text-[#948C79]">Total revenue</div>
        </div>
        <div>
          <div className="text-2xl font-semibold text-[#F1EDE2]">
            {analytics.revenue_trend.reduce((s, d) => s + d.order_count, 0)}
          </div>
          <div className="text-[10px] text-[#948C79]">Orders</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={analytics.revenue_trend}>
          <CartesianGrid stroke="#332D22" strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fill: "#948C79", fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
          <YAxis tick={{ fill: "#948C79", fontSize: 10 }} tickFormatter={(v) => (v / 100).toFixed(0)} />
          <Tooltip contentStyle={{ background: "#1C1A15", border: "1px solid #332D22", fontSize: 12 }} labelStyle={{ color: "#F1EDE2" }} formatter={(v) => (v / 100).toFixed(2)} />
          <Line type="monotone" dataKey="revenue" stroke="#C9A227" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>

    <div className="bg-[#1C1A15] border border-[#332D22] rounded-lg p-4">
      <div className="text-[10px] uppercase tracking-wider text-[#948C79] mb-3">Fulfillment funnel · last 30 days</div>
      <div className="grid grid-cols-3 gap-3">
        {["processing", "shipped", "delivered"].map((stage) => (
          <div key={stage} data-testid={`funnel-${stage}`}>
            <div className="text-xl font-semibold text-[#F1EDE2]">{analytics.fulfillment_funnel[stage]}</div>
            <div className="text-[10px] uppercase tracking-wider text-[#948C79] capitalize">{stage}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && CI=true npx craco test EcommerceOrdersPanel -t "Analytics tab" --watchAll=false`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/builder/EcommerceOrdersPanel.jsx frontend/src/components/builder/EcommerceOrdersPanel.test.jsx
git commit -m "feat: add Analytics tab with revenue trend chart and fulfillment funnel"
```

---

## Task 5: Frontend — Customer Breakdown & Top Products Sections

**Files:**
- Modify: `frontend/src/components/builder/EcommerceOrdersPanel.jsx`
- Test: `frontend/src/components/builder/EcommerceOrdersPanel.test.jsx`

**Interfaces:**
- Consumes: `analytics.customer_breakdown` and `analytics.top_products` (Tasks 2/3's response fields), the `analytics` state and Analytics view block from Task 4.

- [ ] **Step 1: Write the failing test**

Add to `frontend/src/components/builder/EcommerceOrdersPanel.test.jsx`:

```jsx
test("the Analytics tab displays customer breakdown and top products", async () => {
  global.fetch
    .mockResolvedValueOnce({ ok: true, json: async () => ({ token: "tok-abc" }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ orders: [], total: 0, page: 1, page_size: 20 }) })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        window: { start: "2026-07-25", end: "2026-08-23", days: 30 },
        revenue_trend: [{ date: "2026-08-23", order_count: 1, revenue: 3800 }],
        fulfillment_funnel: { processing: 1, shipped: 0, delivered: 0 },
        customer_breakdown: { new_customers: 5, returning_customers: 2, new_revenue: 19000, returning_revenue: 8000 },
        top_products: [{ name: "Aurora Bottle", quantity: 3, revenue: 11400 }],
      }),
    });

  render(<EcommerceOrdersPanel projectId="proj-123" />);
  fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: "hunter22" } });
  fireEvent.click(screen.getByText(/unlock/i));
  await waitFor(() => expect(screen.getByRole("button", { name: /analytics/i })).toBeInTheDocument());

  fireEvent.click(screen.getByRole("button", { name: /analytics/i }));

  await waitFor(() => expect(screen.getByTestId("breakdown-new")).toHaveTextContent("5"));
  expect(screen.getByTestId("breakdown-returning")).toHaveTextContent("2");
  expect(screen.getByText(/aurora bottle/i)).toBeInTheDocument();
  expect(screen.getByText(/114\.00/)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && CI=true npx craco test EcommerceOrdersPanel -t "customer breakdown and top products" --watchAll=false`
Expected: FAIL — no `breakdown-new`/`breakdown-returning` testids exist yet.

- [ ] **Step 3: Implement**

In `frontend/src/components/builder/EcommerceOrdersPanel.jsx`, inside the `view === "analytics"` block added in Task 4, after the fulfillment funnel `<div>` and before the block's closing `</div>`, add:

```jsx
    <div className="bg-[#1C1A15] border border-[#332D22] rounded-lg p-4">
      <div className="text-[10px] uppercase tracking-wider text-[#948C79] mb-3">Customers · last 30 days</div>
      <div className="grid grid-cols-2 gap-3">
        <div data-testid="breakdown-new">
          <div className="text-xl font-semibold text-[#F1EDE2]">{analytics.customer_breakdown.new_customers}</div>
          <div className="text-[10px] uppercase tracking-wider text-[#948C79]">New · {(analytics.customer_breakdown.new_revenue / 100).toFixed(2)}</div>
        </div>
        <div data-testid="breakdown-returning">
          <div className="text-xl font-semibold text-[#F1EDE2]">{analytics.customer_breakdown.returning_customers}</div>
          <div className="text-[10px] uppercase tracking-wider text-[#948C79]">Returning · {(analytics.customer_breakdown.returning_revenue / 100).toFixed(2)}</div>
        </div>
      </div>
    </div>

    <div className="bg-[#1C1A15] border border-[#332D22] rounded-lg p-4">
      <div className="text-[10px] uppercase tracking-wider text-[#948C79] mb-3">Top products · last 30 days</div>
      {analytics.top_products.length === 0 ? (
        <div className="text-[11px] text-[#948C79]">No product sales in this window yet.</div>
      ) : (
        <table className="w-full border-collapse">
          <tbody>
            {analytics.top_products.map((p, i) => (
              <tr key={p.name}>
                <td className="text-[11px] text-[#948C79] py-1 pr-2 w-6">{i + 1}</td>
                <td className="text-sm text-[#E4DECE] py-1">{p.name}</td>
                <td className="text-sm text-[#948C79] py-1 text-right font-mono">{p.quantity}</td>
                <td className="text-sm text-[#D9BC55] py-1 pl-3 text-right font-mono">{(p.revenue / 100).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && CI=true npx craco test EcommerceOrdersPanel --watchAll=false`
Expected: PASS (all EcommerceOrdersPanel tests, including Task 4's)

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/builder/EcommerceOrdersPanel.jsx frontend/src/components/builder/EcommerceOrdersPanel.test.jsx
git commit -m "feat: add customer breakdown and top products sections to Analytics tab"
```

---

## Task 6: Frontend — CSV Export on Orders & Customers Tabs

**Files:**
- Modify: `frontend/src/components/builder/EcommerceOrdersPanel.jsx`
- Test: `frontend/src/components/builder/EcommerceOrdersPanel.test.jsx`

**Interfaces:**
- Consumes: the existing `orders`/`customers` state (already fetched and rendered by the Orders/Customers tabs — no new fetch).
- Produces: `toCsv(rows, columns)`, `downloadCsv(filename, csv)`, `exportOrdersCsv()`, `exportCustomersCsv()` — all local to `EcommerceOrdersPanel.jsx`, plus two buttons (`data-testid="export-orders-csv"`, `data-testid="export-customers-csv"`).

- [ ] **Step 1: Write the failing tests**

Add to `frontend/src/components/builder/EcommerceOrdersPanel.test.jsx`:

```jsx
test("Export CSV on the Orders tab downloads a CSV with order rows", async () => {
  global.fetch
    .mockResolvedValueOnce({ ok: true, json: async () => ({ token: "tok-abc" }) })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        orders: [{ id: "o1", provider: "stripe", provider_ref: "cs_1", amount_total: 3800, currency: "usd", customer_email: "buyer@example.com", created_at: "2026-08-23T00:00:00Z", fulfillment_status: "shipped" }],
        total: 1, page: 1, page_size: 20,
      }),
    });

  const originalBlob = global.Blob;
  const blobSpy = jest.fn().mockImplementation((parts, opts) => new originalBlob(parts, opts));
  global.Blob = blobSpy;
  global.URL.createObjectURL = jest.fn(() => "blob:mock-url");
  global.URL.revokeObjectURL = jest.fn();
  const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

  render(<EcommerceOrdersPanel projectId="proj-123" />);
  fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: "hunter22" } });
  fireEvent.click(screen.getByText(/unlock/i));
  await waitFor(() => expect(screen.getByTestId("export-orders-csv")).toBeInTheDocument());

  fireEvent.click(screen.getByTestId("export-orders-csv"));

  expect(clickSpy).toHaveBeenCalled();
  const csvContent = blobSpy.mock.calls[0][0][0];
  expect(csvContent).toContain("buyer@example.com");
  expect(csvContent).toContain("38.00");
  expect(csvContent).toContain("shipped");

  global.Blob = originalBlob;
  clickSpy.mockRestore();
});

test("Export CSV on the Customers tab downloads a CSV with customer rows", async () => {
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

  const originalBlob = global.Blob;
  const blobSpy = jest.fn().mockImplementation((parts, opts) => new originalBlob(parts, opts));
  global.Blob = blobSpy;
  global.URL.createObjectURL = jest.fn(() => "blob:mock-url");
  global.URL.revokeObjectURL = jest.fn();
  const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

  render(<EcommerceOrdersPanel projectId="proj-123" />);
  fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: "hunter22" } });
  fireEvent.click(screen.getByText(/unlock/i));
  await waitFor(() => expect(screen.getByRole("button", { name: /customers/i })).toBeInTheDocument());
  fireEvent.click(screen.getByRole("button", { name: /customers/i }));
  await waitFor(() => expect(screen.getByTestId("export-customers-csv")).toBeInTheDocument());

  fireEvent.click(screen.getByTestId("export-customers-csv"));

  expect(clickSpy).toHaveBeenCalled();
  const csvContent = blobSpy.mock.calls[0][0][0];
  expect(csvContent).toContain("ada lovelace");
  expect(csvContent).toContain("58.00");

  global.Blob = originalBlob;
  clickSpy.mockRestore();
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && CI=true npx craco test EcommerceOrdersPanel -t "Export CSV" --watchAll=false`
Expected: FAIL — no `export-orders-csv`/`export-customers-csv` testids exist yet.

- [ ] **Step 3: Implement**

In `frontend/src/components/builder/EcommerceOrdersPanel.jsx`, add these functions near the top of the component (alongside `unlock`/`showCustomers`/`updateFulfillment`):

```jsx
const toCsv = (rows, columns) => {
  const escape = (v) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.map((c) => c.label).join(",");
  const body = rows.map((r) => columns.map((c) => escape(c.value(r))).join(",")).join("\n");
  return `${header}\n${body}`;
};

const downloadCsv = (filename, csv) => {
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const exportOrdersCsv = () => {
  const columns = [
    { label: "provider", value: (o) => o.provider },
    { label: "customer_email", value: (o) => o.customer_email },
    { label: "amount", value: (o) => (o.amount_total / 100).toFixed(2) },
    { label: "currency", value: (o) => (o.currency || "").toUpperCase() },
    { label: "fulfillment_status", value: (o) => o.fulfillment_status || "processing" },
    { label: "created_at", value: (o) => o.created_at },
  ];
  downloadCsv("orders.csv", toCsv(orders, columns));
};

const exportCustomersCsv = () => {
  const columns = [
    { label: "email", value: (c) => c.email },
    { label: "name", value: (c) => c.name },
    { label: "order_count", value: (c) => c.order_count },
    { label: "ltv", value: (c) => (c.ltv / 100).toFixed(2) },
    { label: "last_order_at", value: (c) => c.last_order_at },
  ];
  downloadCsv("customers.csv", toCsv(customers, columns));
};
```

Add a button next to the Orders table (inside the `view === "orders"` block, above or beside the `<table>`):

```jsx
<button
  onClick={exportOrdersCsv}
  data-testid="export-orders-csv"
  className="text-xs px-3 py-1.5 rounded bg-[#242019] hover:bg-[#332D22] border border-[#332D22] text-[#F1EDE2] mb-3"
>Export CSV</button>
```

Add the equivalent button next to the Customers table (inside the `view === "customers"` block):

```jsx
<button
  onClick={exportCustomersCsv}
  data-testid="export-customers-csv"
  className="text-xs px-3 py-1.5 rounded bg-[#242019] hover:bg-[#332D22] border border-[#332D22] text-[#F1EDE2] mb-3"
>Export CSV</button>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && CI=true npx craco test EcommerceOrdersPanel --watchAll=false`
Expected: PASS (all EcommerceOrdersPanel tests)

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/builder/EcommerceOrdersPanel.jsx frontend/src/components/builder/EcommerceOrdersPanel.test.jsx
git commit -m "feat: add client-side CSV export to Orders and Customers tabs"
```

---

## Task 7: Full-Suite Regression Check

**Files:** none (verification only)

**Interfaces:** none — this task asserts the full test suites still pass after Tasks 1-6.

- [ ] **Step 1: Run the full backend suite**

Run: `cd backend && pytest -v`
Expected: all tests pass, including the 16 new Analytics tests from Tasks 1-3. Compare the failure count against the pre-Phase-3 baseline (capture it before Task 1 starts) — any new failure not present in that baseline is a regression this plan introduced and must be fixed before this task is marked complete.

- [ ] **Step 2: Run the full frontend suite**

Run: `cd frontend && CI=true npx craco test --watchAll=false`
Expected: all suites pass, including the 4 new EcommerceOrdersPanel tests from Tasks 4-6.

- [ ] **Step 3: Manual smoke check (optional, non-blocking)**

Start the dev server (`cd frontend && npm start` if not already running), unlock a project's dashboard, click through Orders → Customers → Analytics, and confirm the revenue chart renders, the funnel/breakdown tiles show non-crashing numbers, and both Export CSV buttons trigger a real file download in the browser. This is optional because automated coverage already verifies every code path up to the browser's native download API (Task 6) and up to `ResponsiveContainer`'s render boundary (Task 4) — the same reasoning Phase 2's plan used for its own optional manual SMTP checkpoint.

- [ ] **Step 4: Commit (if Step 1 or 2 required fixes)**

```bash
git add -A
git commit -m "fix: resolve regressions found in Phase 3 full-suite check"
```

If no fixes were needed, skip this step — there's nothing to commit.
