# Web Dojo E-Commerce — Phase 2: Customer Tracking & Transactional Email

## Status

Phase 2 of a 4-phase e-commerce effort (payments → customer tracking/email → analytics → insights). Phase 1 (`2026-08-21-ecommerce-payments-orders-design.md`) shipped the `orders` collection, the Stripe webhook, server-verified PayPal capture, and the per-project dashboard password gate — all merged to `main`. This document covers Phase 2 only: everything it needs (real, server-verified order records with `customer_email`, `customer_name`, `amount_total`, `created_at`) already exists.

## Problem

Today, once an order lands in the `orders` collection, nothing further happens with it:

- There's no way to see "who are my customers" — only a flat, paginated list of individual orders (`GET /api/dashboard/{project_id}/orders`). Answering "how much has this buyer spent with me in total" means manually scanning that list.
- No email is ever sent. The buyer's only confirmation is the on-page receipt at the moment of checkout (Phase 1's `GET /api/commerce/receipt/{provider_ref}`) — if they close the tab, there is no other record mailed to them.
- Orders have no fulfillment concept at all. Phase 1's `status` field means *payment* status (`"completed"`); there's nothing tracking whether the merchant has shipped or delivered the physical goods.
- No SMTP or any other email-sending capability exists anywhere in the codebase (confirmed by grep — zero references to `smtplib`, `SMTP`, or any email-sending library beyond `email-validator`, which only validates address syntax).

## Goals

1. A **customers** view per project: every distinct buyer, with order count, lifetime value (LTV), and last-order date — derived from existing order data, no new collection.
2. Per-project SMTP configuration, stored the same way Phase 1 stores the PayPal Secret (Fernet-encrypted, gated behind the dashboard password after first write).
3. An automatic **order confirmation** email, sent once per genuinely new order (not on webhook/duplicate-delivery retries), the moment `_upsert_order` records it.
4. A merchant-driven **fulfillment status** on each order (`processing` → `shipped` → `delivered`), settable from the dashboard orders list, each transition firing its matching email.
5. Fixed, non-editable HTML templates for all three email types.

## Non-goals (explicitly deferred)

- Segmentation buckets (New/Repeat/At-risk/Lapsed) and cohort-style retention-rate math — this phase computes the raw signal (order count, LTV, recency) a later phase can bucket; it does not ship the bucketing itself.
- Per-project customizable email templates (subject/body/logo editor) — fixed templates only.
- Carrier/tracking-number integration — "shipped"/"delivered" are merchant-asserted states set by hand in the dashboard, not pulled from any shipping API.
- Third-party email API integration (SendGrid/Mailgun/SES) — SMTP only.
- A merchant-level account spanning multiple projects — customer records stay project-scoped, same as every other per-site concept in this app (orders, dashboard password, PayPal Secret).
- Analytics dashboard, charts, exports — Phase 3. Recommendations/insights — Phase 4.

## Known limitations carried forward (not fixed in this phase)

Fulfillment status is entirely merchant-asserted with no independent verification — a merchant can mark an order "delivered" the moment it's placed, and Web Dojo has no way to know otherwise. This matches the reality that no shipping-carrier integration exists; building one is a separate, much larger feature.

If a project has no SMTP configuration saved, order-confirmation and fulfillment emails are silently skipped (logged server-side, never surfaced as an error to the buyer or blocking the underlying action). Merchants who never open the SMTP fields simply get no emails — same "opt-in, not required" posture as Phase 1's PayPal Secret.

## Data Model

No new collection. Two additions to the existing `orders` documents (Phase 1's shape, `2026-08-21-ecommerce-payments-orders-design.md` §Data Model):

```json
{
  "...": "...all Phase 1 fields unchanged...",
  "fulfillment_status": "processing"
}
```

- `fulfillment_status`: one of `"processing" | "shipped" | "delivered"`. Set to `"processing"` by both `_upsert_order` call sites (`stripe_webhook`, `commerce_paypal_verify`) when the order dict is first constructed. Only forward transitions are allowed (`processing → shipped → delivered`) — the fulfillment-update endpoint rejects a request that would move it backward.

Project doc gains one new optional field: `smtp_config_enc` — a Fernet-encrypted JSON blob (`{host, port, username, password, from_address}`), via the same `_encrypt`/`_decrypt`/`_get_fernet` helpers Phase 1 already uses for the PayPal Secret. Same first-write-open / replace-needs-token gating as `paypal_secret_enc`.

## Customer Aggregation

`GET /api/dashboard/{project_id}/customers` (token-gated, same `X-Dashboard-Token` check as Phase 1's orders endpoint), paginated (`page`, `page_size`, clamped `[1, 100]`, matching Phase 1's convention):

1. Fetch every order for `project_id` with `status: "completed"` and a non-empty `customer_email` (orders with no email — theoretically possible if a payment provider ever omits it — are excluded from customer aggregation but remain visible in the plain orders list).
2. Group in Python by `customer_email` (lowercased, trimmed — so `Buyer@Example.com` and `buyer@example.com` collapse to one customer; this is the dedup key). No Mongo aggregation pipeline — `sqlite_compat` doesn't implement one, and Phase 1 already established the "fetch then reduce in Python" pattern for this codebase's dev shim.
3. For each group compute: `email`, `name` (most recent order's `customer_name`), `order_count`, `ltv` (sum of `amount_total` across the group's orders — same currency-cents integer already stored, no new money math), `last_order_at` (max `created_at`).
4. Sort by `ltv` descending by default; page over the resulting list.

This runs at request time, not on a schedule — realistic order volumes for a site-builder's shop stay small enough that re-grouping on every dashboard load is cheap, and it guarantees the numbers can never drift from the underlying orders (the failure mode a materialized/incremented collection would risk).

## SMTP & Email Sending

1. `POST /api/commerce/smtp-config` (mirrors `POST /api/commerce/paypal-secret` exactly): body `{project_id, host, port, username, password, from_address}`. First write is open (same reasoning as Phase 1: the project doesn't have a password yet at initial setup time); once `smtp_config_enc` is already set, replacing it requires a valid `X-Dashboard-Token` for that project's current password hash. Stored Fernet-encrypted.
2. A `_send_email(project_id, to_addr, subject, html_body)` helper: loads and decrypts `smtp_config_enc` for the project; if absent, returns immediately (no-op, logged at debug level). Otherwise sends via stdlib `smtplib.SMTP(host, port)` + `starttls()` + `login()` + `send_message()`, wrapped in try/except — any failure (auth, connection, timeout) is caught, logged, and never re-raised. No new dependency; `smtplib` and `email.message.EmailMessage` are both stdlib.
3. Dispatched via FastAPI's `BackgroundTasks` (already a FastAPI export, no new dependency) so the caller — the Stripe webhook, the PayPal verify endpoint, or the fulfillment-update endpoint — returns its HTTP response immediately and the SMTP call happens after. A slow or unreachable SMTP server therefore never delays a Stripe webhook response (which Stripe expects promptly, on pain of retry-storms) or a dashboard action.
4. **Confirmation email** fires from `_upsert_order`'s two call sites (`stripe_webhook`, `commerce_paypal_verify`) only when `_upsert_order` reports it inserted a *new* row — today it silently returns `None` whether it inserted or skipped a duplicate; this phase changes its return type to `bool` (`True` = inserted, `False` = already existed) so both call sites can gate the background email on that value and never send a second confirmation for the same order on a Stripe retry-delivery.
5. **Fulfillment emails** fire from the new fulfillment-update endpoint (below), one per allowed transition (`processing → shipped` sends the "shipped" email, `shipped → delivered` sends the "delivered" email; the initial `processing` state on order creation sends no email of its own — that's what the confirmation email already covers).

## Fulfillment Status

`PATCH /api/dashboard/{project_id}/orders/{order_id}/fulfillment` (token-gated): body `{fulfillment_status: "shipped" | "delivered"}`.

- Loads the order, confirms it belongs to `project_id` (404 otherwise).
- Validates the transition is forward-only per the allowed sequence `processing → shipped → delivered`; a request for `"processing"`, a same-state request, or a backward request (e.g. `delivered → shipped`) returns 400.
- Updates `fulfillment_status`, schedules the matching email as a `BackgroundTask`, returns the updated order.

## Email Templates

Three fixed Python string templates (confirmation / shipped / delivered), each a small, self-contained HTML document — inline CSS only (email clients don't reliably load external stylesheets), no images, no external asset requests. Each is populated with: project name (from the `projects` collection, looked up by `project_id`), order's `line_items`, `amount_total`/`currency` (formatted the same way the existing receipt page formats money), and — for shipped/delivered — the buyer's `shipping_address` if present. No template editor; changing the copy means editing the template constant in `server.py`, same as any other fixed string in this codebase today.

## Dashboard UI

- `CommerceTab.jsx` gains an SMTP fields group (host, port, username, password, from address) directly below the existing PayPal Client ID / Secret fields, same input styling and a "Save SMTP settings" button calling the new endpoint — mirrors the existing `savePaypal()` handler exactly, just a different payload shape.
- `EcommerceOrdersPanel.jsx` gains:
  - A fulfillment-status dropdown on each order row (`processing`/`shipped`/`delivered`), disabled once at `delivered` (no further transition possible), calling the new `PATCH` endpoint on change.
  - A **Customers** tab alongside the existing orders view, listing rows from `GET /api/dashboard/{project_id}/customers`: email, name, order count, LTV (formatted as currency), last order date. Reuses the same password-unlock flow and token already wired up for the orders view — no second unlock prompt.

## Testing

- Backend: customer-aggregation correctness (two orders same email → one row with correct `order_count`/`ltv`/`last_order_at`; orders with different emails stay separate; an order with no `customer_email` is excluded from aggregation but still counted in the plain orders list); SMTP-config save/gate tests mirroring Phase 1's PayPal-secret tests (first write open, replace requires token, wrong token rejected); `_send_email` tests with `smtplib.SMTP` mocked (no real network connection) — asserts correct `to`/`subject`/body-contains-order-details, and that a raised exception from the mock is swallowed, not propagated; confirmation-email-fires-once test (simulate the same Stripe webhook event delivered twice — assert the mocked send is called exactly once); fulfillment-transition tests (valid forward transition succeeds and triggers the right templated email; backward/same-state/invalid-value transitions return 400 and send no email; wrong project's order returns 404).
- Frontend: `CommerceTab.jsx` SMTP fields render and call the new endpoint with the right payload; `EcommerceOrdersPanel.jsx` fulfillment dropdown calls `PATCH` with the selected value; Customers tab renders LTV/order-count/last-order-date correctly from a fixture API response.
