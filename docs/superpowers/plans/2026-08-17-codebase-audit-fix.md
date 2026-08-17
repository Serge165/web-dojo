# Codebase Audit & Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the known security issues in `backend/server.py` (SSRF, CORS
misconfiguration, hardcoded Stripe fallback key, world-readable Fernet key
file) with self-contained regression tests, and run a broader parallel
audit of the rest of `backend/` and `frontend/src/` to surface anything
else worth fixing in a follow-up plan.

**Architecture:** No architectural changes. Each fix is a small, isolated
change to `backend/server.py` verified by a new `TestClient`-based test in
`backend/tests/test_security_fixes.py` (in-process ASGI test client — no
live MongoDB or running server required, unlike the existing
`backend_test.py` integration suite).

**Tech Stack:** FastAPI, `starlette.testclient.TestClient`, pytest, Python
stdlib (`socket`, `ipaddress`, `urllib.parse`).

## Global Constraints

- Scope is `backend/server.py`, `backend/starter_templates.py`,
  `backend/tests/`, `frontend/src/**`. No new features, no UI redesign, no
  speculative dependency bumps (spec: `docs/superpowers/specs/2026-08-17-codebase-audit-design.md`).
- Do not add an authentication system — this app is explicitly single-user,
  no-auth by design (`memory/PRD.md`: "Auth: none, single-user builder").
- This sandbox has no MongoDB, no Python packages installed, and no `yarn`.
  The existing `backend/tests/backend_test.py` suite hits a **live** backend
  over HTTP (`BASE_URL` env var) and therefore cannot run here — do not try
  to run it as part of this plan's verification steps. New tests must be
  self-contained (`TestClient`, no live DB).
- Frontend confirmed to send **no cookies/credentials** to the backend (no
  `withCredentials` anywhere in `frontend/src`) — CORS fix can safely turn
  off `allow_credentials`.
- Commit after each task, one focused commit per fix.

**Note on the "unauthenticated secret exposure" item from the design doc**
(`GET /api/publish-presets/{id}/secret` returns plaintext FTP/SFTP
passwords with no auth): this plan does **not** give it its own fix task.
Adding per-request auth would contradict the explicit no-auth design
(`memory/PRD.md`), and every other endpoint in this API is equally
unauthenticated by the same design (e.g. `GET /api/projects/{id}` returns
full project data to anyone who can reach the port) — so this endpoint
isn't a special case, it's consistent with the app's existing trust model.
The concrete new risk it adds is a *browser-based* one (any website open in
the user's browser could call it via JS and exfiltrate a saved password),
and that's exactly what Task 3's CORS fix closes. The remaining risk —
anything else on the same machine/network reaching the port directly — gets
fully closed later by the Tauri desktop-packaging project, which will bind
this backend to loopback (`127.0.0.1`) only instead of a public interface.

---

### Task 1: Backend test harness (minimal venv + TestClient scaffold)

**Files:**
- Create: `backend/.venv/` (gitignored already via `.venv/` in `.gitignore`)
- Create: `backend/tests/test_security_fixes.py`

**Interfaces:**
- Produces: a working `python backend/.venv/bin/pytest` runnable against
  `backend/tests/test_security_fixes.py`, and a `client` pytest fixture
  (module-scoped `TestClient(server.app)`) that later tasks' tests import by
  adding new test functions to this same file.

- [ ] **Step 1: Create a venv and install the minimal package set**

`server.py` only needs these to import and run under `TestClient` (verified
by reading its `import` block — no need for the full 130-line
`requirements.txt`, which also references a private wheel URL for
`litellm` that isn't needed here):

```bash
cd /home/januszeal/Downloads/web-dojo-main/backend
python3 -m venv .venv
./.venv/bin/pip install --quiet \
  fastapi==0.110.1 "starlette==0.37.2" "httpx==0.28.1" \
  "motor==3.3.1" "pydantic==2.13.4" "python-dotenv==1.2.2" \
  "cryptography==50.0.0" "stripe==14.4.1" "python-multipart==0.0.32" \
  pytest requests
```

- [ ] **Step 2: Verify the install**

Run: `./.venv/bin/python -c "import fastapi, motor, pydantic, dotenv, cryptography, stripe, httpx; print('ok')"`
Expected: prints `ok` with no `ModuleNotFoundError`.

- [ ] **Step 3: Write the test harness file**

`server.py` reads `MONGO_URL` and `DB_NAME` from the environment at import
time (`os.environ['MONGO_URL']`) but never awaits a database call unless a
route handler actually needs one — the fixes in this plan touch only routes
that don't touch `db` (`import/url`, `commerce/*`, CORS on `/api/`), so a
dummy Mongo URL is enough; no real MongoDB connection is ever made.

```python
"""Self-contained regression tests for the security fixes audit.

Unlike backend_test.py (which hits a live backend over HTTP and needs a
running MongoDB), these use FastAPI's in-process TestClient. They only
exercise routes that never touch `db`, so no real MongoDB is required.
"""
import os

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "webdojo_test")

import pytest
from starlette.testclient import TestClient

import server


@pytest.fixture(scope="module")
def client():
    return TestClient(server.app)


def test_harness_smoke(client):
    r = client.get("/api/")
    assert r.status_code == 200
    assert r.json() == {"message": "WYSIWYG Builder API"}
```

- [ ] **Step 4: Run it to confirm the harness works**

Run: `./.venv/bin/pytest backend/tests/test_security_fixes.py -v` (run
from the repo root, or `cd backend && .venv/bin/pytest tests/test_security_fixes.py -v`)
Expected: `test_harness_smoke` PASSES.

- [ ] **Step 5: Commit**

```bash
git add backend/tests/test_security_fixes.py
git commit -m "Add self-contained TestClient harness for backend security-fix tests"
```

---

### Task 2: Fix SSRF in `POST /api/import/url`

**Files:**
- Modify: `backend/server.py:860-875` (the `UrlImport` model + `import_url` route)
- Modify: `backend/server.py:1-20` (imports)
- Test: `backend/tests/test_security_fixes.py`

**Interfaces:**
- Consumes: `client` fixture from Task 1.
- Produces: `server._resolve_is_public(hostname: str) -> bool` and
  `server._validate_import_url(url: str) -> None` (raises `HTTPException`
  on failure) — not consumed elsewhere in this plan, but named here in case
  a follow-up plan reuses them.

**Problem:** `import_url` fetches any user-supplied `http(s)://` URL
server-side with `follow_redirects=True` and no restriction on the target
address, so it can be used to reach loopback/private/link-local addresses
(e.g. cloud metadata endpoints, other services on the same machine) — a
classic SSRF. This gets worse once this backend runs as a local desktop
sidecar (Tauri project, next), where it's reachable from anything else on
the user's machine.

- [ ] **Step 1: Write the failing tests**

Add to `backend/tests/test_security_fixes.py`:

```python
class TestImportUrlSSRF:
    def test_blocks_loopback(self, client):
        r = client.post("/api/import/url", json={"url": "http://127.0.0.1/secret"})
        assert r.status_code == 400

    def test_blocks_localhost_hostname(self, client):
        r = client.post("/api/import/url", json={"url": "http://localhost/secret"})
        assert r.status_code == 400

    def test_blocks_link_local_metadata_ip(self, client):
        # Cloud metadata endpoint address (AWS/GCP/Azure convention).
        r = client.post("/api/import/url", json={"url": "http://169.254.169.254/latest/meta-data/"})
        assert r.status_code == 400

    def test_blocks_private_range(self, client):
        r = client.post("/api/import/url", json={"url": "http://10.0.0.5/"})
        assert r.status_code == 400

    def test_still_rejects_non_http_scheme(self, client):
        r = client.post("/api/import/url", json={"url": "notaurl"})
        assert r.status_code == 400

    def test_still_rejects_empty(self, client):
        r = client.post("/api/import/url", json={"url": ""})
        assert r.status_code == 400
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd backend && .venv/bin/pytest tests/test_security_fixes.py -v -k TestImportUrlSSRF`
Expected: `test_blocks_loopback`, `test_blocks_localhost_hostname`,
`test_blocks_link_local_metadata_ip`, `test_blocks_private_range` FAIL
(currently return 502, since the app tries to actually connect); the two
`test_still_rejects_*` PASS already (pre-existing behavior).

- [ ] **Step 3: Add the imports**

In `backend/server.py`, the top of the file currently reads:

```python
from fastapi import FastAPI, APIRouter, HTTPException, Request
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Any
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import io
import re
import logging
import asyncio
import ftplib
import ssl
from pathlib import Path
import uuid
from datetime import datetime, timezone
from cryptography.fernet import Fernet
import stripe
import httpx
```

Change the last three stdlib-adjacent lines to add the new imports:

```python
from cryptography.fernet import Fernet
import stripe
import httpx
import ipaddress
import socket
from urllib.parse import urlsplit, urljoin
```

- [ ] **Step 4: Replace the `import_url` route**

Find this block in `backend/server.py` (around line 860):

```python
class UrlImport(BaseModel):
    url: str


@api_router.post("/import/url")
async def import_url(payload: UrlImport):
    """Fetch a public page's HTML so the builder can import its sections."""
    url = (payload.url or "").strip()
    if not (url.startswith("http://") or url.startswith("https://")):
        raise HTTPException(status_code=400, detail="Enter a valid http(s) URL")
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=15.0, headers={"User-Agent": "Mozilla/5.0 (WebDojo importer)"}) as client:
            r = await client.get(url)
        return {"html": r.text[:2_000_000], "status": r.status_code}
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Could not fetch that URL ({type(e).__name__})")
```

Replace it with:

```python
class UrlImport(BaseModel):
    url: str


def _resolve_is_public(hostname: str) -> bool:
    """True only if every address `hostname` resolves to is public/routable."""
    try:
        infos = socket.getaddrinfo(hostname, None)
    except socket.gaierror:
        return False
    if not infos:
        return False
    for _family, _type, _proto, _canon, sockaddr in infos:
        try:
            ip = ipaddress.ip_address(sockaddr[0])
        except ValueError:
            return False
        if (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_reserved
            or ip.is_multicast
            or ip.is_unspecified
        ):
            return False
    return True


def _validate_import_url(url: str) -> None:
    """Raise HTTPException if `url` is not a safe, public http(s) URL."""
    parts = urlsplit(url)
    if parts.scheme not in ("http", "https") or not parts.hostname:
        raise HTTPException(status_code=400, detail="Enter a valid http(s) URL")
    if not _resolve_is_public(parts.hostname):
        raise HTTPException(status_code=400, detail="That URL points to a private or internal address")


@api_router.post("/import/url")
async def import_url(payload: UrlImport):
    """Fetch a public page's HTML so the builder can import its sections.

    Redirects are followed manually (not via httpx's follow_redirects) so
    each hop is re-validated against the same private/internal-address
    check — otherwise an attacker-controlled redirect could bypass the
    initial URL check and reach an internal address."""
    url = (payload.url or "").strip()
    _validate_import_url(url)
    try:
        current = url
        async with httpx.AsyncClient(follow_redirects=False, timeout=15.0, headers={"User-Agent": "Mozilla/5.0 (WebDojo importer)"}) as client:
            for _ in range(5):
                r = await client.get(current)
                if r.status_code in (301, 302, 303, 307, 308) and "location" in r.headers:
                    nxt = urljoin(current, r.headers["location"])
                    _validate_import_url(nxt)
                    current = nxt
                    continue
                return {"html": r.text[:2_000_000], "status": r.status_code}
        raise HTTPException(status_code=502, detail="Too many redirects")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Could not fetch that URL ({type(e).__name__})")
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd backend && .venv/bin/pytest tests/test_security_fixes.py -v -k TestImportUrlSSRF`
Expected: all 6 tests PASS.

- [ ] **Step 6: Run the full new test file to confirm no regression**

Run: `cd backend && .venv/bin/pytest tests/test_security_fixes.py -v`
Expected: all tests PASS (harness smoke test + SSRF tests).

- [ ] **Step 7: Commit**

```bash
git add backend/server.py backend/tests/test_security_fixes.py
git commit -m "Fix SSRF in POST /api/import/url

Validate the resolved IP of the URL (and every redirect hop) against
private/loopback/link-local/reserved ranges before fetching."
```

---

### Task 3: Fix CORS misconfiguration

**Files:**
- Modify: `backend/server.py:992-998`
- Test: `backend/tests/test_security_fixes.py`

**Interfaces:**
- Consumes: `client` fixture from Task 1.

**Problem:** `allow_origins=os.environ.get('CORS_ORIGINS', '*').split(',')`
defaults to `'*'` combined with `allow_credentials=True`. Browsers reject
that combination outright for credentialed requests, and — since the
frontend sends no credentials at all (verified: no `withCredentials`
anywhere in `frontend/src`) — `allow_credentials=True` was never needed.
Left as `'*'`, any website a user has open in their browser can call this
API from JS and read responses, including
`GET /api/publish-presets/{id}/secret` (plaintext saved passwords).

- [ ] **Step 1: Write the failing tests**

Add to `backend/tests/test_security_fixes.py`:

```python
class TestCORS:
    def test_disallowed_origin_gets_no_cors_header(self, client):
        r = client.get("/api/", headers={"Origin": "http://evil.example"})
        assert r.status_code == 200  # request still succeeds; browser enforces CORS client-side
        assert "access-control-allow-origin" not in {k.lower() for k in r.headers.keys()}

    def test_default_localhost_origin_is_allowed(self, client):
        r = client.get("/api/", headers={"Origin": "http://localhost:3000"})
        assert r.headers.get("access-control-allow-origin") == "http://localhost:3000"

    def test_credentials_not_allowed(self, client):
        r = client.get("/api/", headers={"Origin": "http://localhost:3000"})
        assert "access-control-allow-credentials" not in {k.lower() for k in r.headers.keys()}
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd backend && .venv/bin/pytest tests/test_security_fixes.py -v -k TestCORS`
Expected: `test_disallowed_origin_gets_no_cors_header` FAILS (currently `*`
reflects every origin); `test_credentials_not_allowed` FAILS (currently
`allow_credentials=True`).

- [ ] **Step 3: Replace the CORS middleware setup**

Find this in `backend/server.py` (around line 992):

```python
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Replace with:

```python
_cors_origins_env = os.environ.get('CORS_ORIGINS', '').strip()
if _cors_origins_env:
    _cors_origins = [o.strip() for o in _cors_origins_env.split(',') if o.strip()]
else:
    # No CORS_ORIGINS configured: default to local dev origins only, never
    # a wildcard. The frontend sends no cookies/credentials, so this app
    # never needs allow_credentials=True.
    _cors_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=False,
    allow_origins=_cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && .venv/bin/pytest tests/test_security_fixes.py -v -k TestCORS`
Expected: all 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/server.py backend/tests/test_security_fixes.py
git commit -m "Fix CORS: drop wildcard-with-credentials default

The frontend never sends credentials, so allow_credentials is now False
and the default origin allowlist is localhost-only instead of '*'."
```

---

### Task 4: Remove hardcoded Stripe fallback key

**Files:**
- Modify: `backend/server.py:750`, `:772-797`, `:807-857`
- Test: `backend/tests/test_security_fixes.py`

**Interfaces:**
- Consumes: `client` fixture from Task 1.
- Produces: module-level `server.STRIPE_SECRET_KEY` (`Optional[str]`),
  replacing the inline `stripe.api_key = ... or "sk_test_emergent"` fallback.

**Problem:** `stripe.api_key = os.environ.get("STRIPE_SECRET_KEY") or
"sk_test_emergent"` bakes a hardcoded placeholder key into the binary.
It's already a dead-end sandbox key today, but it's exactly the pattern
that leads to a real key being hardcoded down the line, and it silently
lets `commerce_config` report inconsistent state (`stripe_enabled` can be
`False` while `stripe.api_key` is still set to the fallback string).

- [ ] **Step 1: Write the failing tests**

Add to `backend/tests/test_security_fixes.py`. This relies on
`STRIPE_SECRET_KEY` being unset in the test environment (true by default —
Task 1's harness never sets it):

```python
class TestStripeNotConfigured:
    def test_payment_link_503_when_unconfigured(self, client):
        r = client.post("/api/commerce/payment-link", json={
            "name": "Test Product", "amount": 9.99, "currency": "usd", "quantity": 1,
        })
        assert r.status_code == 503

    def test_checkout_session_503_when_unconfigured(self, client):
        r = client.post("/api/commerce/checkout-session", json={
            "items": [{"name": "Test Item", "amount": 9.99, "currency": "usd", "quantity": 1}],
        })
        assert r.status_code == 503

    def test_config_reports_disabled(self, client):
        r = client.get("/api/commerce/config")
        assert r.status_code == 200
        body = r.json()
        assert body["stripe_enabled"] is False
        assert body["publishable_key"] == ""
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd backend && .venv/bin/pytest tests/test_security_fixes.py -v -k TestStripeNotConfigured`
Expected: `test_payment_link_503_when_unconfigured` and
`test_checkout_session_503_when_unconfigured` FAIL (currently attempt a
real Stripe call with the fake key and return 502, not 503);
`test_config_reports_disabled` PASSES already.

- [ ] **Step 3: Replace the hardcoded key assignment**

Find (around line 750):

```python
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY") or "sk_test_emergent"
```

Replace with:

```python
STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY")
if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY
```

- [ ] **Step 4: Guard the payment-link endpoint**

Find (around line 782):

```python
@api_router.post("/commerce/payment-link")
async def commerce_payment_link(payload: PaymentLinkCreate):
    if not payload.name.strip():
        raise HTTPException(status_code=400, detail="Product name is required")
```

Replace with:

```python
@api_router.post("/commerce/payment-link")
async def commerce_payment_link(payload: PaymentLinkCreate):
    if not STRIPE_SECRET_KEY:
        raise HTTPException(status_code=503, detail="Stripe is not configured on this server")
    if not payload.name.strip():
        raise HTTPException(status_code=400, detail="Product name is required")
```

- [ ] **Step 5: Guard the checkout-session endpoint**

Find (around line 834):

```python
@api_router.post("/commerce/checkout-session")
async def commerce_checkout_session(payload: CheckoutSessionCreate):
    """Cart hand-off for exported static sites: the published page POSTs its
    localStorage cart line items and gets a hosted Stripe Checkout URL back."""
    if not payload.items:
        raise HTTPException(status_code=400, detail="Cart is empty")
```

Replace with:

```python
@api_router.post("/commerce/checkout-session")
async def commerce_checkout_session(payload: CheckoutSessionCreate):
    """Cart hand-off for exported static sites: the published page POSTs its
    localStorage cart line items and gets a hosted Stripe Checkout URL back."""
    if not STRIPE_SECRET_KEY:
        raise HTTPException(status_code=503, detail="Stripe is not configured on this server")
    if not payload.items:
        raise HTTPException(status_code=400, detail="Cart is empty")
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd backend && .venv/bin/pytest tests/test_security_fixes.py -v -k TestStripeNotConfigured`
Expected: all 3 tests PASS.

- [ ] **Step 7: Commit**

```bash
git add backend/server.py backend/tests/test_security_fixes.py
git commit -m "Remove hardcoded Stripe fallback key

Commerce endpoints now return 503 when STRIPE_SECRET_KEY isn't set,
instead of silently using a fake placeholder key."
```

---

### Task 5: Fix Fernet key file permissions

**Files:**
- Modify: `backend/server.py:183-195`
- Test: `backend/tests/test_security_fixes.py`

**Interfaces:**
- Consumes: none (pure unit test, imports `server` module directly, no
  `client` fixture needed).

**Problem:** `_get_fernet()` writes a freshly generated encryption key to
`backend/.preset_key` with the process's default umask, which is typically
world/group-readable. This key decrypts every saved publish-preset
password. It should be `0600` (owner read/write only).

- [ ] **Step 1: Write the failing test**

Add to `backend/tests/test_security_fixes.py`:

```python
import stat


class TestFernetKeyFilePermissions:
    def test_key_file_created_owner_only(self, tmp_path, monkeypatch):
        monkeypatch.delenv("WEBDOJO_SECRET_KEY", raising=False)
        key_path = tmp_path / "test.preset_key"
        monkeypatch.setattr(server, "_KEY_PATH", key_path)

        server._get_fernet()

        assert key_path.exists()
        mode = stat.S_IMODE(key_path.stat().st_mode)
        assert mode == 0o600
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd backend && .venv/bin/pytest tests/test_security_fixes.py -v -k TestFernetKeyFilePermissions`
Expected: FAILS (`mode` reflects the default umask, e.g. `0o644`, not `0o600`).

- [ ] **Step 3: Fix `_get_fernet`**

Find (around line 183):

```python
def _get_fernet() -> Fernet:
    key = os.environ.get("WEBDOJO_SECRET_KEY")
    if not key and _KEY_PATH.exists():
        key = _KEY_PATH.read_text().strip()
    if not key:
        key = Fernet.generate_key().decode()
        try:
            _KEY_PATH.write_text(key)
        except Exception:
            pass
    return Fernet(key.encode() if isinstance(key, str) else key)
```

Replace with:

```python
def _get_fernet() -> Fernet:
    key = os.environ.get("WEBDOJO_SECRET_KEY")
    if not key and _KEY_PATH.exists():
        key = _KEY_PATH.read_text().strip()
    if not key:
        key = Fernet.generate_key().decode()
        try:
            _KEY_PATH.write_text(key)
            os.chmod(_KEY_PATH, 0o600)
        except Exception:
            pass
    return Fernet(key.encode() if isinstance(key, str) else key)
```

(`os.chmod` on a POSIX permission bit is a no-op-ish best-effort on Windows;
this file only runs on the FastAPI backend host, which is POSIX today. The
`try/except` already in place means a failure here degrades gracefully
rather than crashing preset creation.)

- [ ] **Step 4: Run tests to verify it passes**

Run: `cd backend && .venv/bin/pytest tests/test_security_fixes.py -v -k TestFernetKeyFilePermissions`
Expected: PASSES.

- [ ] **Step 5: Run the entire new test file (final regression check for this plan)**

Run: `cd backend && .venv/bin/pytest tests/test_security_fixes.py -v`
Expected: all tests across Tasks 1-5 PASS (harness smoke + 6 SSRF + 3 CORS
+ 3 Stripe + 1 Fernet permissions = 14 tests).

- [ ] **Step 6: Commit**

```bash
git add backend/server.py backend/tests/test_security_fixes.py
git commit -m "Restrict Fernet key file permissions to 0600"
```

---

### Task 6: Parallel audit of remaining backend + frontend code

**Files:**
- Create: `docs/superpowers/specs/2026-08-17-audit-findings.md`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: a ranked findings document that seeds a follow-up plan (out of
  scope for this plan — see "After this task" below).

This task's job is to find what Tasks 2-5 didn't already cover, not to fix
it. Fixing new findings happens in a separate follow-up plan (findings
of this size can't be pre-planned with concrete diffs before they're known
— see the "No Placeholders" rule in the writing-plans skill).

- [ ] **Step 1: Dispatch two parallel review agents**

Using the `Agent` tool, send both of the following in a single message (two
tool calls, no dependency between them) with `subagent_type: "general-purpose"`:

**Backend reviewer prompt:**
```
Review backend/server.py, backend/starter_templates.py, and
backend/tests/backend_test.py in /home/januszeal/Downloads/web-dojo-main
for security and correctness issues. This is a FastAPI + MongoDB (Motor)
backend for a single-user, no-auth website builder (see memory/PRD.md for
context) — don't flag "missing authentication" as an issue, that's an
intentional design choice. Already fixed and NOT to be re-reported: SSRF
in /api/import/url, CORS wildcard+credentials, hardcoded Stripe fallback
key, Fernet key file permissions (all in backend/server.py, check git log
for the exact fixes if you want to confirm before flagging something
similar). Look for: injection risks, path traversal (especially in the
FTP/SFTP publish code, _ftp_upload/_sftp_upload), unvalidated input,
resource exhaustion (unbounded request bodies, unbounded loops), error
handling that leaks internals, logic bugs. For each finding report:
file:line, one-sentence summary, why it matters (concrete exploit/failure
scenario), and a severity (high/medium/low). Report only things you are
confident are real issues — skip stylistic nitpicks and speculative
"could theoretically" items with no concrete scenario.
```

**Frontend reviewer prompt:**
```
Review frontend/src/lib/**, frontend/src/components/builder/**, and
frontend/src/pages/Builder.jsx in /home/januszeal/Downloads/web-dojo-main
(~14k lines total) for correctness bugs and XSS risk. Context: this is a
WYSIWYG website builder — it renders large amounts of user-authored HTML
(see frontend/src/lib/exportHtml.js, importHtml.js, and anywhere
dangerouslySetInnerHTML or similar raw-HTML injection appears) both in the
builder's own canvas and in exported/published static sites, so injection
there is a real risk to end users of exported sites, not just a
theoretical one. Also look for: obvious logic bugs, duplicated/dead code
worth flagging (not fixing), and any use of eval/Function/innerHTML with
unsanitized input. For each finding report: file:line, one-sentence
summary, why it matters (concrete failure/exploit scenario), and severity
(high/medium/low). Report only things you're confident are real — skip
stylistic nitpicks.
```

- [ ] **Step 2: Wait for both agents to complete, then synthesize**

Read both agents' reports. Deduplicate anything that overlaps with what
they were told is already fixed. Merge into one list ordered:
high-severity security first, then medium/low security, then correctness,
then quality/dead-code notes. For each item keep: `file:line — summary —
why it matters — severity — which agent found it (backend/frontend)`.

- [ ] **Step 3: Write the findings file**

Write `docs/superpowers/specs/2026-08-17-audit-findings.md` with a short
intro (date, what was reviewed, what was excluded as already-fixed) followed
by the ranked list from Step 2, and a closing note: "Next step: brainstorm
a follow-up plan for the high/medium items above before starting the Tauri
desktop-packaging project."

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/specs/2026-08-17-audit-findings.md
git commit -m "Add audit findings from backend/frontend parallel review"
```

---

## After this plan

Task 6 produces a findings document, not fixes. Once it lands, bring the
findings back for a quick triage conversation: anything high-severity gets
its own fix (same TDD pattern as Tasks 2-5); anything else gets logged or
explicitly deferred. Only after that should the Tauri desktop-packaging
project (SQLite swap + sidecar + cross-platform builds) get brainstormed —
per the earlier sequencing decision, audit/fix comes first.
