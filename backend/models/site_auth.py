"""Per-project customer accounts for exported static sites.

Unlike builder_auth (global Web Dojo builder users) or the dashboard-password
mechanism (one shared owner secret per project), these are real per-visitor
accounts on a *published* site: each project has its own pool of customers,
and a token minted for one project must never authenticate against another.
That's why, unlike builder_auth's JWT, the payload embeds project_id and
every verification checks it against the project_id in the URL.

HS256 JWTs, stdlib only — same shape as builder_auth. Secret derives from the
same persisted key file with a distinct label so tokens can't cross-replay
between this system, builder_auth, and the dashboard-password system.

Collection:
  site_customers: {id, project_id, email (lowercased, unique per project_id),
                    password_hash, created_at}

This module's router references `db` and helpers from server.py's namespace;
server.py injects them after import (same pattern as builder_auth/zenero).
"""
import base64
import hashlib
import hmac as _hmac
import json
import secrets
import time
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, ConfigDict

site_auth_router = APIRouter(prefix="/api")

# Injected by server.py at import time:
db = None
_hash_password = None      # server._hash_password
_verify_password = None    # server._verify_password
_DASHBOARD_KEY_PATH = None # pathlib.Path to the persisted secret key file


# ---------- JWT (HS256, stdlib) ----------

def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64url_decode(seg: str) -> bytes:
    pad = "=" * (-len(seg) % 4)
    return base64.urlsafe_b64decode(seg + pad)


SITE_AUTH_TTL_SECONDS = 30 * 24 * 3600  # 30 days — public-site visitor sessions


def _site_auth_secret() -> bytes:
    """Same key material as builder/dashboard tokens, different derivation label."""
    import os
    key = os.environ.get("WEBDOJO_SECRET_KEY")
    if not key and _DASHBOARD_KEY_PATH is not None and _DASHBOARD_KEY_PATH.exists():
        key = _DASHBOARD_KEY_PATH.read_text().strip()
    if not key:
        key = secrets.token_urlsafe(32)
        if _DASHBOARD_KEY_PATH is not None:
            try:
                _DASHBOARD_KEY_PATH.write_text(key)
                os.chmod(_DASHBOARD_KEY_PATH, 0o600)
            except Exception:
                pass
    return hashlib.sha256(key.encode("utf-8") + b":site-auth-v1").digest()


def issue_site_jwt(customer_id: str, project_id: str, ttl_seconds: int = SITE_AUTH_TTL_SECONDS) -> str:
    header = _b64url(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    payload = _b64url(json.dumps({
        "sub": customer_id,
        "pid": project_id,
        "iat": int(time.time()),
        "exp": int(time.time()) + ttl_seconds,
    }).encode())
    signing_input = f"{header}.{payload}".encode("ascii")
    sig = _b64url(_hmac.new(_site_auth_secret(), signing_input, hashlib.sha256).digest())
    return f"{header}.{payload}.{sig}"


def verify_site_jwt(token: str, project_id: str) -> object:
    """Returns the customer_id for a valid, unexpired token scoped to
    project_id; None otherwise. A token minted for a different project is
    rejected even if the signature is valid."""
    try:
        header_b64, payload_b64, sig_b64 = token.split(".")
        header = json.loads(_b64url_decode(header_b64))
        if header.get("alg") != "HS256":
            return None
        signing_input = f"{header_b64}.{payload_b64}".encode("ascii")
        expected = _hmac.new(_site_auth_secret(), signing_input, hashlib.sha256).digest()
        if not _hmac.compare_digest(expected, _b64url_decode(sig_b64)):
            return None
        payload = json.loads(_b64url_decode(payload_b64))
        if int(payload.get("exp", 0)) < time.time():
            return None
        if payload.get("pid") != project_id:
            return None
        return payload.get("sub") or None
    except Exception:
        return None


# ---------- Models ----------

class SiteAuthRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    email: str
    password: str


# ---------- Endpoints ----------

@site_auth_router.post("/{project_id}/site-auth/signup")
async def site_signup(project_id: str, payload: SiteAuthRequest):
    email = payload.email.strip().lower()
    if "@" not in email or len(email) > 254:
        raise HTTPException(status_code=400, detail="Enter a valid email address")
    if len(payload.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    existing = await db.site_customers.find_one(
        {"project_id": project_id, "email": email}, {"_id": 0, "id": 1}
    )
    if existing:
        raise HTTPException(status_code=409, detail="An account with that email already exists")
    import asyncio
    pw_hash = await asyncio.get_running_loop().run_in_executor(None, _hash_password, payload.password)
    customer = {
        "id": str(uuid.uuid4()),
        "project_id": project_id,
        "email": email,
        "password_hash": pw_hash,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.site_customers.insert_one(customer.copy())
    return {"token": issue_site_jwt(customer["id"], project_id), "customer_id": customer["id"], "email": email}


@site_auth_router.post("/{project_id}/site-auth/login")
async def site_login(project_id: str, payload: SiteAuthRequest):
    email = payload.email.strip().lower()
    customer = await db.site_customers.find_one(
        {"project_id": project_id, "email": email}, {"_id": 0}
    )
    if not customer or not _verify_password(payload.password, customer.get("password_hash") or ""):
        # Identical 401 either way — no account-existence oracle.
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    return {"token": issue_site_jwt(customer["id"], project_id), "customer_id": customer["id"], "email": email}


async def _require_site_customer(project_id: str, authorization: str) -> dict:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    customer_id = verify_site_jwt(authorization[len("Bearer "):].strip(), project_id)
    if not customer_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    customer = await db.site_customers.find_one(
        {"id": customer_id, "project_id": project_id}, {"_id": 0, "password_hash": 0}
    )
    if not customer:
        raise HTTPException(status_code=401, detail="Unknown account")
    return customer


@site_auth_router.get("/{project_id}/site-auth/me")
async def site_me(project_id: str, authorization: str = Header(default="")):
    return await _require_site_customer(project_id, authorization)


@site_auth_router.get("/{project_id}/site-auth/orders")
async def site_my_orders(project_id: str, authorization: str = Header(default="")):
    """A logged-in customer's own order history — replaces the bare "Welcome
    back" message in the dashboard-login widget's customer tab with real
    content. Orders are keyed by customer_email, not customer_id, so this
    matches list_customers' approach: fetch by project_id, normalize and
    filter email in Python (same reasoning as sqlite_compat's docstring —
    no query complex enough here to need a Mongo-side filter)."""
    customer = await _require_site_customer(project_id, authorization)
    email = customer["email"]
    all_orders = await db.orders.find(
        {"project_id": project_id},
        {"_id": 0, "id": 1, "amount_total": 1, "currency": 1, "status": 1,
         "fulfillment_status": 1, "line_items": 1, "created_at": 1, "customer_email": 1},
    ).to_list(length=None)
    orders = [
        {k: v for k, v in o.items() if k != "customer_email"}
        for o in all_orders
        if (o.get("customer_email") or "").strip().lower() == email
    ]
    orders.sort(key=lambda o: o.get("created_at") or "", reverse=True)
    return {"orders": orders[:20]}
