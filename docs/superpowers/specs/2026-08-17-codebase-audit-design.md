# Codebase Audit & Fix — Design

## Purpose
Web Dojo (React + FastAPI + MongoDB WYSIWYG website builder) has never had a
security/correctness pass. Before starting the Tauri desktop-packaging project
(which will expose this backend locally on end-user machines), find and fix
issues so the packaging work starts from a sound base.

## Scope
- `backend/server.py`, `backend/starter_templates.py`, `backend/tests/`
- `frontend/src/**` (~14k lines: `lib/`, `components/builder/`, `pages/`)
- Out of scope: new features, UI redesign, dependency major-version bumps
  (flagged if a version is actually broken, not upgraded speculatively).

## Already identified (from initial read of `server.py`)
- **SSRF**: `POST /api/import/url` fetches any user-supplied URL server-side
  with no allowlist/blocklist against internal/private addresses.
- **Unauthenticated secret exposure**: `GET /api/publish-presets/{id}/secret`
  returns any saved FTP/SFTP password in plaintext, no auth required.
- **Hardcoded Stripe fallback key**: `stripe.api_key = ... or "sk_test_emergent"`.
- **CORS misconfiguration**: `allow_origins='*'` with `allow_credentials=True`
  (browsers reject the combination; insecure default regardless).
- **Fernet key file** (`backend/.preset_key`) written with default file
  permissions (no `0600`).

## Method
1. Two parallel review agents (via `dispatching-parallel-agents`):
   - **Backend reviewer**: `backend/server.py`, `starter_templates.py`,
     `tests/` — security (auth, injection, SSRF, secrets, CORS), correctness,
     error handling.
   - **Frontend reviewer**: `frontend/src/lib/**`, `components/builder/**`,
     `pages/Builder.jsx` — correctness bugs, XSS (this app renders
     user-authored HTML/CSS extensively, so injection risk is real),
     dead/duplicated code, obvious performance issues.
   Each reports findings as `file:line — summary — why it matters`.
2. I synthesize both lists, dedupe against the "already identified" items
   above, and rank by severity (security > correctness > quality).
3. Present the ranked list to you before fixing anything.
4. Fix in priority order, committing in small logical batches (e.g. one
   commit per issue or tightly related group), running `pytest` for backend
   changes and a manual smoke check (`craco start`, exercise the changed
   flow) for frontend changes.

## Non-goals / explicit judgment calls
- This is a single-user local-first tool by design (see `memory/PRD.md`:
  "Auth: none, single-user builder"). I will **not** add authentication —
  but the publish-preset secret endpoint and SSRF issue still get fixed
  because they're exploitable by anything else running on the same machine
  or network, not just "another user of the app."
- No dependency version bumps unless a version is demonstrably broken.

## Testing
- Backend: existing `pytest` suite (`backend/tests/backend_test.py`) must
  stay green; add regression tests for security fixes (e.g. SSRF blocklist,
  CORS behavior) where practical.
- Frontend: no test suite currently exists beyond CRA's default `craco test`
  scaffold — verify fixes manually via the dev server for anything touching
  rendering/export paths.
