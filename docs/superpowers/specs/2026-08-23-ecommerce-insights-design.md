# Web Dojo E-Commerce — Phase 4: Insights

## Status

Phase 4 (final) of a 4-phase e-commerce effort (payments → customer tracking/email → analytics → insights). Phase 1 (`2026-08-21-ecommerce-payments-orders-design.md`) shipped the `orders` collection, payment capture, and the dashboard password gate. Phase 2 (`2026-08-23-ecommerce-customers-email-design.md`) added `fulfillment_status` and derived customer aggregation. Phase 3 (`2026-08-23-ecommerce-analytics-design.md`) added a read-only analytics view (revenue trend, fulfillment funnel, customer breakdown, top products) over a trailing 30-day window. This document covers Phase 4 only: a set of deterministic, rule-based alerts computed over the same order data — no new data model, no ML, no new write paths.

## Problem

Phase 3 gives a merchant numbers, but numbers require them to notice a problem themselves — nothing tells them "this needs your attention." A merchant who doesn't open the Analytics tab daily won't notice a product went cold, revenue dropped week over week, orders are piling up unshipped, or repeat business is drying up until it's a real problem.

## Goals

1. **Stale products** — flag products that sold in the prior 30-day window but have zero sales in the trailing 30 days.
2. **Revenue trend drop** — flag when trailing 7-day revenue is down more than 20% from the prior 7-day revenue.
3. **Stuck fulfillment** — flag orders sitting in `processing`/`shipped` for more than 7 days.
4. **Returning-customer share drop** — flag when returning-customer revenue share is down more than 15 percentage points vs. the prior 30-day window.
5. A new **Insights** tab in the dashboard listing whatever alerts currently apply, with a clear "all clear" empty state.

## Non-goals (explicitly deferred)

- Any form of machine learning, forecasting, or statistical modeling — every rule here is a fixed threshold over a sum or count, matching this codebase's existing "descriptive, not predictive" analytics approach.
- Product bundling / co-purchase ("customers who bought X also bought Y") suggestions — a materially different aggregation (line-item co-occurrence) that would deserve its own phase if wanted later.
- Inventory/stockout signals — there is no stock-quantity concept anywhere in this codebase; adding one is out of scope for an insights layer.
- Dismissing, acknowledging, or persisting alert state — alerts are recomputed fresh on every tab open, same as Analytics. Nothing is written to the database by this phase.
- Configurable thresholds — the four thresholds above (20%, 7 days, 15 points, 30/60-day windows) are fixed constants, not per-project settings. A settings UI is a fast follow if a merchant asks for it.
- New alert rules beyond the four listed — e.g. cart abandonment (this codebase has no cart-abandonment tracking at all) is out of scope.

## Known limitations carried forward (not fixed in this phase)

Same product-identity caveat as Phase 3: `stale_products` groups by trimmed, case-sensitive product name, so "Aurora Bottle" and "aurora bottle" are treated as different products.

`revenue_drop` and `returning_share_drop` both need a full prior comparison window of data to be meaningful; a store younger than 14 days (for revenue) or 60 days (for returning-share) simply won't have enough history to trigger a false positive — the "prior window revenue must be > 0" / "must have return-customer data in both windows" guards described below exist for exactly this reason, not as a fix but as a deliberate no-alert-without-enough-data rule.

## Data Model

No new collection, no new fields, no new writes. Everything reads the existing `orders` collection (Phase 1's shape, extended by Phase 2 with `fulfillment_status`) and computes results at request time, same as Phase 3.

## Insights Endpoint

`GET /api/dashboard/{project_id}/insights` — token-gated with the same `X-Dashboard-Token` check as orders/customers/analytics (`_require_dashboard_token`, checked first). No pagination; response is bounded by construction (at most 4 alert objects, one per rule).

Fetch every `completed` order for `project_id` (equality-only `db.orders.find`, same "fetch then reduce in Python" pattern as Phase 2/3 — `sqlite_compat` has no aggregation pipeline or range operators). All four rules below compute from this one fetched set; "today" is UTC calendar date, consistent with Phase 3's windowing.

1. **`stale_products`** — Group completed orders' `line_items` by trimmed product `name` (same grouping key as Phase 3's top-products). Using the same 30-day trailing window Phase 3 defines (`window_start = today-29`, `window_end = today`, 30 calendar days inclusive), a product is "stale" if it appears in orders with `created_at` in `[today-59, today-30]` (the immediately preceding 30-day window) but appears in zero orders with `created_at` in `[today-29, today]` (the trailing 30-day window). If any products are stale, emit one alert:
   ```json
   { "id": "stale_products", "severity": "info", "title": "Products haven't sold recently",
     "detail": "3 products sold in the prior 30 days but haven't sold in the last 30.",
     "data": { "count": 3, "products": ["Aurora Bottle", "Forge Mug", "Dojo Tee"] } }
   ```
   `products` lists up to 5 names (alphabetical); `count` is the true total even if it exceeds 5. No alert if the stale set is empty.

2. **`revenue_drop`** — Sum `amount_total` for orders with `created_at` in `[today-6, today]` (trailing 7 days, inclusive = 7 calendar days) → `current`. Sum for orders with `created_at` in `[today-13, today-7]` (prior 7 days) → `prior`. If `prior > 0` and `current < prior * 0.8`, emit:
   ```json
   { "id": "revenue_drop", "severity": "warning", "title": "Revenue is down",
     "detail": "Revenue this week is down 34% from last week.",
     "data": { "current_revenue": 15000, "prior_revenue": 22800, "percent_change": -34 } }
   ```
   `percent_change` is `round((current - prior) / prior * 100)`, an integer. No alert if `prior == 0` (nothing to compare against — see Known Limitations) or the drop doesn't clear the 20% threshold.

3. **`stuck_fulfillment`** — Among all completed orders, `fulfillment_status` (defaulting missing/legacy orders to `"processing"`, matching Phase 2/3) in `{"processing", "shipped"}` and `created_at` older than 7 days from today. If any match, emit:
   ```json
   { "id": "stuck_fulfillment", "severity": "warning", "title": "Orders stuck in fulfillment",
     "detail": "5 orders have been processing or shipped for more than 7 days.",
     "data": { "count": 5, "order_refs": ["ord_a1", "ord_b2", "ord_c3", "ord_d4", "ord_e5"] } }
   ```
   `order_refs` lists up to 5 order `id`s (oldest `created_at` first); `count` is the true total. No alert if none match.

4. **`returning_share_drop`** — Compute returning-customer revenue share for two windows using the same new-vs-returning classification Phase 3's `customer_breakdown` uses (customer's all-time earliest order date, from the full completed-order set, determines new vs. returning within a window): trailing 30 days (`[today-29, today]`) → `current_share`, and the prior 30 days (`[today-59, today-30]`) → `prior_share`, where `share = returning_revenue / (new_revenue + returning_revenue)` for that window. If both windows have `new_revenue + returning_revenue > 0` and `current_share` is more than 15 percentage points below `prior_share`, emit:
   ```json
   { "id": "returning_share_drop", "severity": "info", "title": "Repeat business is down",
     "detail": "Returning customers made up 22% of revenue this month, down from 41% last month.",
     "data": { "current_share": 22, "prior_share": 41 } }
   ```
   Shares are integers (`round(share * 100)`). No alert if either window has zero revenue (nothing to compare — see Known Limitations) or the drop doesn't clear 15 points.

**Response shape:**

```json
{ "alerts": [
  { "id": "revenue_drop", "severity": "warning", "title": "Revenue is down",
    "detail": "Revenue this week is down 34% from last week.",
    "data": { "current_revenue": 15000, "prior_revenue": 22800, "percent_change": -34 } }
] }
```

`alerts` is `[]` when nothing triggers — a valid, expected response, not an error.

## Dashboard UI

`EcommerceOrdersPanel.jsx` gains a fourth view alongside Orders/Customers/Analytics: **Insights**. Selecting it fetches `GET /api/dashboard/{project_id}/insights` (reusing the already-unlocked token, no second password prompt — same convention as Analytics/Customers) and, following the Phase 3 review finding, checks `res.ok` before touching the body and shows an inline error message on failure rather than crashing the render.

Each alert renders as a card: title, detail sentence, and a severity-colored left border/badge (`warning` vs `info` — reusing the token palette, not a new color system: `warning` uses the existing destructive/amber tone already present in the codebase's status badges, `info` uses the muted/gold accent). When `alerts` is empty, render a single "All clear — no issues detected" state instead of an empty list.

## Testing

- Backend: one positive and one negative test per rule (stale product present vs. absent; revenue drop above vs. below threshold, and the `prior == 0` no-alert case; stuck order present vs. all orders recent/delivered; returning-share drop above vs. below threshold, and the zero-revenue-window no-alert case), plus a combined test asserting multiple alerts can appear together and the empty-array shape when none apply, plus token-gating (missing/invalid `X-Dashboard-Token` → 401/403, matching existing endpoints). Every literal order `id`/`provider_ref` used must be unique file-wide, per this test file's existing SQLite-backed-fixture constraint (`test_commerce_orders.py` never resets its DB between tests).
- Frontend: Insights tab fetches and renders a fixture response with multiple alerts; renders the "all clear" state for an empty `alerts` array; shows an inline error on a non-ok fetch response (guards against a repeat of the Phase 3 `res.ok` regression).
