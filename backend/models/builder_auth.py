"""Builder-level authentication (Phase 1 of the gap-closure plan).

HS256 JWTs signed with stdlib only (base64url + hmac + json) — no third-party
JWT dependency. Secrets derive from the same persisted key file the dashboard
tokens use, but with a distinct derivation label so a dashboard token can
never be replayed as a builder token or vice versa.

Collections:
  users: {id, email (lowercased, unique), password_hash, created_at}

Projects gain: owner_id (uuid of the owning user) and collaborators
([{email, role}]) where role ∈ {viewer, editor, admin}.

Legacy migration rule (documented in WEB_DOJO_OVERVIEW.md §9): projects that
predate this system have no owner_id. Any *authenticated* user may edit them;
the first user to hit POST /api/projects/{id}/claim becomes the owner.

This module's router references `db` and helpers from server.py's namespace;
server.py injects them after import (same pattern as zenero/funnels).
"""
import base64
import hashlib
import hmac as _hmac
import json
import secrets
import time
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, ConfigDict

builder_auth_router = APIRouter(prefix="/api")

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


AUTH_TTL_SECONDS = 7 * 24 * 3600  # 7 days — builder sessions are long-lived


def _auth_secret() -> bytes:
    """Same key material as dashboard tokens, different derivation label."""
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
    return hashlib.sha256(key.encode("utf-8") + b":builder-auth-v1").digest()


def issue_jwt(user_id: str, ttl_seconds: int = AUTH_TTL_SECONDS) -> str:
    header = _b64url(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    payload = _b64url(json.dumps({
        "sub": user_id,
        "iat": int(time.time()),
        "exp": int(time.time()) + ttl_seconds,
    }).encode())
    signing_input = f"{header}.{payload}".encode("ascii")
    sig = _b64url(_hmac.new(_auth_secret(), signing_input, hashlib.sha256).digest())
    return f"{header}.{payload}.{sig}"


def verify_jwt(token: str) -> object:
    """Returns the user_id for a valid, unexpired token; None otherwise."""
    try:
        header_b64, payload_b64, sig_b64 = token.split(".")
        header = json.loads(_b64url_decode(header_b64))
        if header.get("alg") != "HS256":
            return None
        signing_input = f"{header_b64}.{payload_b64}".encode("ascii")
        expected = _hmac.new(_auth_secret(), signing_input, hashlib.sha256).digest()
        if not _hmac.compare_digest(expected, _b64url_decode(sig_b64)):
            return None
        payload = json.loads(_b64url_decode(payload_b64))
        if int(payload.get("exp", 0)) < time.time():
            return None
        return payload.get("sub") or None
    except Exception:
        return None


# ---------- Request auth / permission model ----------

_ROLE_RANK = {"viewer": 1, "editor": 2, "admin": 3, "owner": 4}


async def authenticate(request) -> dict:
    """Resolve the Authorization: Bearer header to a user document.
    Raises 401 when missing/invalid."""
    auth = request.headers.get("authorization") or ""
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    user_id = verify_jwt(auth[len("Bearer "):].strip())
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Unknown user")
    return user


async def require_project_access(project_id: str, request, need: str = "editor") -> dict:
    """Authenticate the caller and verify project-level permission.

    need: minimum role rank — 'editor' mutates content, 'admin' manages
    collaborators/deletes, 'owner' everything. Legacy projects (no owner_id)
    are editable by any authenticated user until claimed.
    Returns {user, project}."""
    user = await authenticate(request)
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if not project.get("owner_id"):
        return {"user": user, "project": project}
    if user["id"] == project["owner_id"]:
        return {"user": user, "project": project}
    collaborator = next(
        (c for c in (project.get("collaborators") or []) if c.get("email") == user.get("email")),
        None,
    )
    have = _ROLE_RANK.get((collaborator or {}).get("role", ""), 0)
    if have >= _ROLE_RANK[need]:
        return {"user": user, "project": project}
    raise HTTPException(status_code=403, detail="Insufficient project access")


# ---------- Models ----------

class AuthRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    email: str
    password: str


class ShareRequest(BaseModel):
    email: str
    role: str = "editor"  # viewer | editor | admin


# ---------- Endpoints ----------

@builder_auth_router.post("/auth/register")
async def register(payload: AuthRequest):
    email = payload.email.strip().lower()
    if "@" not in email or len(email) > 254:
        raise HTTPException(status_code=400, detail="Enter a valid email address")
    if len(payload.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    existing = await db.users.find_one({"email": email}, {"_id": 0, "id": 1})
    if existing:
        raise HTTPException(status_code=409, detail="An account with that email already exists")
    import asyncio
    pw_hash = await asyncio.get_running_loop().run_in_executor(None, _hash_password, payload.password)
    user = {"id": str(uuid.uuid4()), "email": email, "password_hash": pw_hash,
            "created_at": datetime.now(timezone.utc).isoformat()}
    await db.users.insert_one(user.copy())
    return {"token": issue_jwt(user["id"]), "user_id": user["id"], "email": email}


@builder_auth_router.post("/auth/login")
async def login(payload: AuthRequest):
    email = payload.email.strip().lower()
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user or not _verify_password(payload.password, user.get("password_hash") or ""):
        # Identical 401 either way — no account-existence oracle.
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    owned = []
    async for p in db.projects.find({"owner_id": user["id"]}, {"_id": 0, "id": 1, "name": 1, "updated_at": 1}):
        owned.append(p)
    # The SQLite shim is equality-only with no dotted-path support, so shared
    # projects are fetched broad and filtered in Python (established pattern).
    shared = []
    async for p in db.projects.find({}, {"_id": 0, "id": 1, "name": 1, "updated_at": 1, "collaborators": 1}):
        if any(c.get("email") == email for c in (p.get("collaborators") or [])):
            shared.append({k: v for k, v in p.items() if k != "collaborators"})
    return {"token": issue_jwt(user["id"]), "user_id": user["id"], "email": email,
            "projects": owned, "shared_projects": shared}


@builder_auth_router.post("/auth/logout")
async def logout():
    # JWTs are stateless; logout is client-side token deletion. Endpoint
    # exists so the UI has a real call to make and a future revocation list
    # has a hook point.
    return {"ok": True}