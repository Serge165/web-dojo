# Web Dojo E-Commerce — Phase 3: Analytics

## Status

Phase 3 of a 4-phase e-commerce effort (payments → customer tracking/email → analytics → insights). Phase 1 (`2026-08-21-ecommerce-payments-orders-design.md`) shipped the `orders` collection, Stripe/PayPal payment capture, and the dashboard password gate. Phase 2 (`2026-08-23-ecommerce-customers-email-design.md`) added `fulfillment_status`, transactional email, and derived customer aggregation (`GET /api/dashboard/{project_id}/customers`). This document covers Phase 3 only: a read-only analytics view over the order data those two phases already produce — no new data model, no new write paths.

## Problem

Once a merchant has orders and customers, they have no way to see the shape of their business at a glance: is revenue trending up, where are orders stuck in fulfillment, are they gaining new customers or living off repeat buyers, and what's actually selling. Today the only views are a flat paginated order list and a flat customer list — answering any of those questions means manually scanning both.

## Goals

1. A **revenue trend** view: daily order count and revenue for the last 30 days.
2. A **fulfillment funnel** snapshot: how many of the last 30 days' orders currently sit in `processing` / `shipped` / `delivered`.
3. A **customer breakdown**: new vs. returning customers (and the revenue each group produced) among the last 30 days' orders.
4. A **top products** view: best-selling line items by revenue over the last 30 days.
5. **CSV export** of the existing Orders and Customers tables, computed client-side from data already on screen.

## Non-goals (explicitly deferred)

- Selectable date ranges — fixed trailing 30 days only. A range picker is a fast follow if a merchant asks for it; it's pure UI/query-parameter work on top of this phase's aggregation, not a new capability.
- True fulfillment-funnel timing (e.g. "average days to ship") — Phase 2 never stored *when* `fulfillment_status` changed, only its current value. Computing time-in-stage would require a new event log, which is out of scope here.
- Server-side CSV generation / a download endpoint — the data is already fetched into the Orders/Customers tabs; converting it to CSV in the browser needs no new backend surface.
- Charts/metrics beyond what's listed in Goals (e.g. cohort retention curves, geographic breakdown) — Phase 4 (insights/recommendations) is where derived/predictive metrics belong; Phase 3 is descriptive only.
- Caching or materializing analytics results — same reasoning Phase 2 used for customer aggregation: realistic order volumes for a site-builder's shop stay small enough that recomputing on every dashboard load is cheap, and it guarantees the numbers never drift from the underlying orders.

## Known limitations carried forward (not fixed in this phase)

The fulfillment funnel is a snapshot of *current* state among recent orders, not a measure of how long orders spend in each stage — see the non-goal above. A merchant asking "why did shipping get slower this month" won't find that answer here.

Product names are grouped as literal strings (trimmed, case-sensitive). Two orders for "Aurora Bottle" and "aurora bottle" will show as two separate rows in Top Products — this mirrors how `buildAddToCartButton` and the cart system already treat product identity (by name, not a canonical product ID; there is no product catalog in this codebase to key against).

## Data Model

No new collection, no new fields. Everything in this phase reads the existing `orders` collection (Phase 1's shape, extended by Phase 2 with `fulfillment_status`) and computes results at request time.

## Analytics Endpoint

`GET /api/dashboard/{project_id}/analytics` — token-gated with the same `X-Dashboard-Token` check as the existing orders/customers endpoints (`_require_dashboard_token`). No pagination; the response is small and bounded by construction (30 daily buckets, 3 funnel stages, 2 customer groups, top 10 products).

**Window:** the last 30 days, UTC, inclusive of today. `window_start = today - 29 days`, `window_end = today` (30 calendar days total).

1. Fetch every order for `project_id` with `status: "completed"` and `created_at >= window_start` (the 30-day working set). Fetch a second, project-wide set of completed orders with only `customer_email` and `created_at` projected, used solely to determine each customer's all-time first order date (needed for new-vs-returning below) — this mirrors Phase 2's "fetch then reduce in Python" pattern since `sqlite_compat` has no aggregation pipeline.

2. **Revenue trend**: group the 30-day working set by UTC calendar date of `created_at`. For each of the 30 dates (including dates with zero orders), emit `{date, order_count, revenue}` (`revenue` = sum of `amount_total`, integer cents, same convention as Phase 2's LTV sum). Dates are ISO `YYYY-MM-DD`, sorted ascending, `window_start` first.

3. **Fulfillment funnel**: within the 30-day working set, count orders by `fulfillment_status` (defaulting missing/legacy orders to `"processing"`, matching Phase 2's default). Emit `{processing, shipped, delivered}` — always all three keys, `0` where empty.

4. **Customer breakdown**: from the project-wide order set, compute each customer's earliest `created_at` (lowercased/trimmed email, same dedup key Phase 2's customer aggregation uses). For every distinct customer appearing in the 30-day working set: if their all-time earliest order falls within the window, they're **new**; otherwise **returning**. Orders with no `customer_email` are excluded from this metric (same exclusion Phase 2 applies to customer aggregation) but remain counted in revenue trend and fulfillment funnel. Emit `{new_customers, returning_customers, new_revenue, returning_revenue}` — the two revenue figures are the sum of `amount_total` across each group's orders in the 30-day window.

5. **Top products**: from the 30-day working set, flatten every order's `line_items`, group by `name` (trimmed, case-sensitive — no fuzzy matching). For each group sum `quantity` and `quantity * unit_amount`. Sort by summed revenue descending, return the top 10 as `{name, quantity, revenue}`.

**Response shape:**

```json
{
  "window": { "start": "2026-07-25", "end": "2026-08-23", "days": 30 },
  "revenue_trend": [{ "date": "2026-07-25", "order_count": 3, "revenue": 11400 }],
  "fulfillment_funnel": { "processing": 5, "shipped": 3, "delivered": 12 },
  "customer_breakdown": { "new_customers": 8, "returning_customers": 4, "new_revenue": 30400, "returning_revenue": 22800 },
  "top_products": [{ "name": "Aurora Bottle", "quantity": 14, "revenue": 53200 }]
}
```

## CSV Export

A "Export CSV" button on the existing Orders tab and Customers tab in `EcommerceOrdersPanel.jsx`, next to each tab's table. Converts the already-fetched `orders`/`customers` state (the same data already rendered in the table — no extra fetch) into a CSV string client-side and triggers a download via a `Blob` + temporary `<a download>` element. This is the exact pattern `TextEffectsPanel.jsx`'s `exportLibrary` already uses for its JSON export — same technique, different MIME type and serialization, no new dependency.

- Orders CSV columns: `provider, customer_email, amount, currency, fulfillment_status, created_at`.
- Customers CSV columns: `email, name, order_count, ltv, last_order_at`.
- Money columns export as decimal (e.g. `38.00`), matching how the tables already display amounts — not raw integer cents.

## Dashboard UI

`EcommerceOrdersPanel.jsx` gains a third view alongside the existing Orders/Customers tabs: **Analytics**. Selecting it fetches `GET /api/dashboard/{project_id}/analytics` (reusing the already-unlocked token, no second password prompt — same convention Phase 2 established for the Customers tab) and renders four sections with `recharts` (already an installed dependency, no new package):

- Revenue trend: a `LineChart` (or `BarChart`) over the 30 daily buckets, with total revenue and total orders for the period shown as summary numbers above it.
- Fulfillment funnel: three stat tiles (Processing / Shipped / Delivered) with their counts — a simple horizontal bar per stage sized relative to the largest count, not a full chart library component, keeps this section lightweight.
- Customer breakdown: two stat tiles (New / Returning) with their counts and revenue.
- Top products: a simple ranked list (rank, name, units sold, revenue) — a table, not a chart; ranked lists read better as text than as a bar chart when there are only up to 10 rows.

The Export CSV buttons live on the Orders and Customers tabs (where the tabular data already is), not on the Analytics tab.

## Testing

- Backend: revenue-trend correctness (orders on the same day group into one bucket with summed revenue; a day with zero orders still appears with `order_count: 0`; orders outside the 30-day window are excluded); fulfillment-funnel counts (orders at each status count correctly; an order with no `fulfillment_status` defaults to `processing`); customer-breakdown classification (a customer whose only order is inside the window is `new`; a customer with an earlier order outside the window who orders again inside it is `returning`; a customer who ordered only outside the window doesn't appear at all; revenue splits sum correctly per group); top-products correctness (two orders for the same product name sum their quantities and revenue into one row; products are sorted by revenue descending; more than 10 distinct products only returns the top 10); token-gating (missing/invalid `X-Dashboard-Token` returns 401/403, matching the existing orders/customers endpoints exactly).
- Frontend: Analytics tab fetches and renders all four sections from a fixture API response; CSV export buttons on Orders/Customers tabs trigger a download with the expected column headers and row data (asserted via a mocked `Blob`/anchor-click, not a real file-system download).
