# Second Audit-Fix Round — Design

## Purpose
`docs/superpowers/specs/2026-08-17-audit-findings.md` (produced by the first
audit round's parallel backend/frontend review) lists 10 concrete findings —
5 high-severity security, 4 medium-severity security, 1 medium-severity
correctness bug — plus two quality notes. This round fixes all 10 numbered
findings. This branch (`security-audit-fix-round-2`) stacks on top of
`security-audit-fix` (the first round's PR, #1 on GitHub, open at the time
of writing) so it can reuse the existing `backend/tests/test_security_fixes.py`
harness and venv rather than rebuilding them.

## Scope
- `backend/server.py`
- `frontend/src/lib/**`, `frontend/src/components/builder/**`,
  `frontend/src/pages/Builder.jsx`
- Out of scope: the two quality notes (duplicated add-class-to-tag logic is
  explicitly deferred per this round's brainstorming; the third quality
  note, "no eval/injection issues found in starter_templates.py", isn't
  something to fix). No new features, no dependency bumps, no auth system.

## Fixes

### Backend

**#1 — `/api/submissions` unscoped GET/DELETE.** Both `list_submissions`
and `clear_submissions` currently accept an empty filter and silently
match everything. Fix: require a non-empty `project_id` or `form_name`,
else `400`. This is a real behavior change, not just a security patch —
the frontend's Inbox (`SubmissionsModal.jsx`) currently calls
`GET /api/submissions` with no filter at all (a legitimate
cross-project view), and there's no auth model to distinguish that from
a stranger's identical call. Confirmed via `grep` that the frontend never
calls the bulk `DELETE /api/submissions` at all (only
`DELETE /api/submissions/{id}`), so that half is a pure safety fix with
zero UI impact. The GET half requires a frontend change: the Inbox
becomes scoped to the currently-open project (`project_id` already
available in `Builder.jsx`) instead of a global cross-project view — this
was an explicit, discussed trade-off, not an oversight.

**#2 — JPY×100 in Stripe amount builders.** `_create_payment_link` and
`_create_checkout_session` both unconditionally do
`int(round(round(amount, 2) * 100))`. Stripe treats a documented set of
currencies (JPY among them) as zero-decimal — `unit_amount` must be passed
as-is. Fix: a `ZERO_DECIMAL_CURRENCIES` set; both builders skip the ×100
when the currency is in it.

**#6 — FTP/SFTP path traversal via publish filenames.** `html_filename`/
`css_filename` are free text used verbatim as the remote upload target.
Fix: validate both are a plain basename (reject anything containing `/`,
`\`, or starting with `.`) before they reach `_ftp_upload`/`_sftp_upload`,
returning `400` on rejection.

**#7 — No body-size limit on `/api/submissions`.** `_extract_submission`
parses the full request body with no ceiling. Fix: reject (413) requests
whose `Content-Length` exceeds a fixed cap (1 MB — generous for a form
submission, small enough to bound memory) before parsing; a request with
no `Content-Length` header is read up to the same cap and rejected if it's
exceeded (Starlette buffers to memory either way, so a stream-based cap on
the raw body read is what actually bounds it, not just trusting the
header).

### Frontend

**Shared escaping utility (#3, #4, #5, #9 + the duplication quality
note).** New `frontend/src/lib/escapeHtml.js` exporting `escAttr(value)`
(HTML-attribute-safe: escapes `& < > " '`) and `escText(value)`
(HTML-text-safe: escapes `& < >`). Replaces the three existing duplicate
implementations (`forms.js`'s `escape`, `exportHtml.js`'s `escAttr`,
`cart.js`'s inline runtime `esc()`) and gets applied at every currently-
unescaped site the findings doc names:
- `ContextualEditors.jsx`'s `setAttr`/`setInnerText` (#3) — combined with
  #10 in the same change (see below).
- `exportHtml.js`'s `pageTitle` (#4) and `buildFontLinks` (#9).
- `commerce.js`'s `stripeButtonHtml`/`paypalButtonHtml` and `cart.js`'s
  `buildAddToCartButton` (#5).
- `social.js`'s follow-mode `href` (#9).
- `BackgroundMediaPanel.jsx`'s `buildMusicHtml`/`applyVideo` (#9).

**#10 — `setAttr`/`setInnerText` corrupt output on `String.replace`
special patterns.** Same two functions as #3. Fix: pass a replacer
*function* (`() => value`) instead of the raw string as `replace`'s second
argument, so `$&`/`$'`/`` $` ``/`$1` in user input are never interpreted
as replacement-pattern syntax. Combined into the same change as the
escaping fix since it's the same two functions and the same call sites.

**#8 — iframe sandbox defeats itself.** All 4 `srcDoc` iframes
(`Builder.jsx:639`, `PaymentButtonModal.jsx:134`, `SocialShareModal.jsx:170`,
`AddPageModal.jsx:106`) combine `allow-scripts` with `allow-same-origin`,
which gives injected content the app's real origin instead of an opaque
one. Confirmed by reading each iframe's surrounding code that none needs
same-origin access (all four are pure preview renders — no
localStorage/DOM access back into the parent). Fix: drop
`allow-same-origin` from all four; also update the misleading comment at
`Builder.jsx:628-629` ("no cross-origin risk" — the actual risk this
sandbox setting controls is the iframe reaching back into the parent, not
cross-origin framing).

## Testing
- Backend: new `backend/tests/test_audit_fixes.py`, same `TestClient`
  pattern as round 1 (no live MongoDB needed — none of these four fixes'
  tests require a real db call; where a fixed endpoint does touch `db`
  (#1's `list_submissions`/`clear_submissions`), mock the collection the
  same way round 1's final-review fix wave did).
- Frontend: no JS test runner is set up/runnable in this sandbox (round 1
  found the same gap — CRA's `craco test` scaffold exists but nothing
  exercises it here). Frontend fixes are verified by direct code
  review/reasoning in the implementation plan rather than an automated
  suite; this is a testing gap to state explicitly, not paper over.

## Non-goals / judgment calls carried over from round 1
- No authentication system. The GET-side fix for #1 works around the
  no-auth constraint by narrowing scope to "the current project," not by
  adding auth.
- No dependency version bumps.
- The two deferred quality notes (duplicated add-class-to-tag logic;
  the "these are fine" backend note) are not part of this round.
