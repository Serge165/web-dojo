# Web Dojo E-Commerce — Phase 1: Payment Processing & Order Records

## Status

Phase 1 of a 4-phase e-commerce effort (payments → customer tracking/email → analytics → insights), each phase its own spec → plan → implementation cycle, since phases 2-4 all depend on the real order data this phase creates. This document covers Phase 1 only.

This phase directly fills a gap flagged in `2026-08-21-dashboard-content-cms-design.md`'s Overview tab: "real sales figures... need a Stripe webhook endpoint plus order storage." Once this ships, that Overview card can show real numbers instead of just connection status.

## Problem

Today, "checkout" in Web Dojo doesn't create any record of what happened. Confirmed by reading the current code:

- Stripe: `POST /api/commerce/checkout-session` (`server.py:1189`) creates a hosted Stripe Checkout Session and returns its URL. Nothing is ever written to the database — success or failure, Web Dojo never finds out.
- PayPal: entirely client-side. `cart.js` loads PayPal's own SDK in the browser and calls `actions.order.capture()`; on success it just clears the cart and shows an `alert()`. The backend is never involved, so there's nothing to fake and nothing to verify — but also nothing recorded.
- No `orders` collection exists. No webhook endpoint exists anywhere in the codebase.
- No authentication exists anywhere in the app — every `/api/*` endpoint is open to any caller.

Building customer tracking, analytics, or insights (Phases 2-4) is impossible without first having real, server-verified order records.

## Goals

1. A Stripe webhook that verifies and records real payment completions.
2. A PayPal flow that's actually verified server-side instead of trusting the browser's word.
3. An `orders` collection, correctly attributed to the right project (Web Dojo is multi-tenant — one backend serves every user's published site).
4. A per-project password gate on order/customer data, since that data now contains real PII and there's no other access control in the app.
5. A buyer-facing receipt page (printable, doubles as the invoice) and shipping/billing address + coupon code support in checkout.

## Non-goals (explicitly deferred)

- Customer database, segmentation, LTV, retention — Phase 2.
- Automatic order/shipping/delivery emails — Phase 2 (this phase only shows an on-page confirmation).
- Analytics dashboard, charts, exports — Phase 3.
- Recommendations/insights engine — Phase 4.
- Custom Stripe Elements embedded card form — the existing hosted Checkout Session is already PCI-safe with less security surface to maintain; not rebuilding checkout UI for no functional gain.
- Per-project Stripe accounts (Stripe Connect) — flagged below as a known limitation, not fixed here.
- Multi-user roles/accounts — a single per-project password is the right amount of access control given nothing else in the app has user accounts either.

## Known limitation carried forward (not fixed in this phase)

`STRIPE_SECRET_KEY` is one global backend env var — every Web Dojo project currently shares the same Stripe account. This phase doesn't change that (making commerce genuinely multi-tenant is its own project, e.g. Stripe Connect). What this phase *does* fix: every order gets tagged with `project_id` so data is correctly attributed to the right site even though the money still flows through one shared account today.

## Data Model

New `orders` Mongo collection (via the existing Motor client; SQLite dev shim mirrors the same collection API):

```json
{
  "id": "uuid",
  "project_id": "the Web Dojo project this storefront belongs to",
  "provider": "stripe | paypal",
  "provider_ref": "stripe checkout session id, or paypal order id — unique index, dedup key",
  "status": "completed",
  "amount_total": 3800,
  "currency": "usd",
  "customer_email": "buyer@example.com",
  "customer_name": null,
  "shipping_address": null,
  "line_items": [{ "name": "Aurora Bottle", "quantity": 1, "unit_amount": 3800, "currency": "usd" }],
  "created_at": "2026-08-21T19:00:00Z"
}
```

A unique index on `provider_ref` makes order-creation idempotent — Stripe retries webhook delivery on its own for up to 3 days on non-2xx responses, so `update_one({provider_ref}, {$setOnInsert: {...}}, upsert=True)` handles retries for free without a custom queue.

Project doc gains one new optional field: `dashboard_password_hash` (PBKDF2-HMAC-SHA256 + random salt, via stdlib `hashlib` — no new dependency). First time a project owner opens order/PII data, they're prompted to set this password before anything is shown; there's no "open by default" option given this data is real customer PII.

## Stripe

1. `POST /api/commerce/checkout-session` gains a required `project_id` field, passed through to Stripe as `metadata: {project_id}` on session creation — this is how the webhook (an async, out-of-band callback) learns which project the payment belongs to. Also adds `shipping_address_collection` and `allow_promotion_codes: true` — both native Stripe Checkout options, no new integration work.
2. New `POST /api/commerce/webhook` endpoint. Verifies the `Stripe-Signature` header via `stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)` (new env var) and **rejects with 400 on any signature mismatch** — without this check, anyone could POST a fake "payment completed" event and generate free orders. On a verified `checkout.session.completed` event: fetch line items via `stripe.checkout.Session.list_line_items(session_id)`, upsert the order record (dedup on `provider_ref` = session id), return 200.
3. Success redirect includes Stripe's `{CHECKOUT_SESSION_ID}` template placeholder, so the buyer lands on a receipt page that knows which session to look up.

## PayPal

Today's flow (browser captures the payment, backend never involved) means Web Dojo currently has zero ability to confirm a PayPal payment actually happened — it just trusts the browser. Fixing this needs your PayPal **Secret**, not just the Client ID `CommerceTab` collects today:

1. After the browser's `actions.order.capture()` resolves, the client reports the PayPal order ID (plus `project_id`) to a new `POST /api/commerce/paypal/verify`.
2. The backend calls PayPal's Orders API (`GET /v2/checkout/orders/{id}`) with Web Dojo's own server-side PayPal credentials and confirms the order's status is genuinely `COMPLETED` and the amount matches what was expected, before writing an order record. A client-reported "it worked" is never trusted on its own.
3. `CommerceTab`'s PayPal field becomes two fields: Client ID (already there, used client-side to load the SDK) and Secret (new, server-side only, never sent to the browser — stored like the Stripe key, as a project-scoped credential; see below).

Per-project payment credentials (Stripe key stays global per the limitation above, but PayPal Secret is naturally project-scoped since `CommerceTab` already lets each project set its own PayPal Client ID) are stored Fernet-encrypted using the existing `_encrypt`/`_decrypt`/`_get_fernet` helpers already in `server.py` — same pattern as FTP publish-preset passwords, no new crypto.

## Dashboard Password Gate

Minimal, stdlib-only, no new dependency:

- `POST /api/dashboard/{project_id}/unlock` — checks the submitted password against `dashboard_password_hash` (PBKDF2), on success issues a signed, time-limited token: `hmac.new(secret, f"{project_id}:{expiry}", sha256)`, base64-encoded, no server-side session storage needed.
- Order/customer/analytics endpoints require `X-Dashboard-Token` header; backend re-verifies the HMAC signature, expiry, and that the token's `project_id` matches the requested project.
- This protects the **admin's** view of orders (`GET /api/dashboard/{project_id}/orders`, paginated). It does not protect the buyer's own receipt page — see below, that uses a different, unguessable-by-construction lookup instead of a password prompt aimed at buyers.

## Buyer Receipt (the "invoice")

- `GET /api/commerce/receipt/{provider_ref}` — public but unguessable (the Stripe session ID / PayPal order ID is already high-entropy), returns that one order's details. No admin password needed — this is the buyer looking up their own purchase, not an admin listing everyone's.
- If the webhook hasn't landed yet when the buyer's redirect arrives (normally a few seconds), the endpoint returns a `processing` status; the receipt page polls a few times before falling back to a "your payment was received, this will update shortly" message. No email is sent here — that's Phase 2.
- The receipt page itself is a styled, printable HTML page with a "Print / Save as PDF" button (`window.print()`) — this *is* the invoice. No backend PDF library needed.

## Testing

- Backend: webhook signature verification (valid/invalid/missing signature → 200/400/400); idempotency (same event delivered twice → one order record); PayPal verify endpoint (real `COMPLETED` status accepted, mismatched amount or non-`COMPLETED` status rejected, forged client claim without backend confirmation rejected); dashboard password hash/verify roundtrip; token issuance/expiry/wrong-project rejection.
- Frontend: `cart.js` sends `project_id` in checkout-session and PayPal-verify calls; receipt page polls correctly and renders a fixture order.
- Manual (per the checkpoint list in the original request): Stripe test-mode and PayPal sandbox checkouts end-to-end, confirming an order row appears, the receipt page renders, and no real charges occur.
