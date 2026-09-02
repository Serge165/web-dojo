from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Header, BackgroundTasks, UploadFile, File, Query
from fastapi.staticfiles import StaticFiles
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
import json
from datetime import datetime, timedelta, timezone
from decimal import Decimal, InvalidOperation
from cryptography.fernet import Fernet
import stripe
import httpx
import ipaddress
import socket
from urllib.parse import urlsplit, urljoin
import time
import hashlib
import hmac
import secrets
import base64
import smtplib
from email.message import EmailMessage
import html
# Phase 4b parity: static per-block CSS for the 117 author-time-classed
# library blocks (Python mirror of frontend/src/lib/blockStyles.generated.js
# — see block_styles_generated.py's header for how it's kept in sync).
from block_styles_generated import (
    BLOCK_STYLES_BY_CATEGORY,
    BLOCK_STYLES_MEDIA_CSS,
    BLOCK_STYLES_CSS,
)


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')


def _build_client():
    """Construct a fresh DB client + database handle for whichever backend is
    configured. Kept as a factory so the process-global client can be rebuilt
    when a prior event loop closed it (see _ensure_live_client)."""
    if os.environ.get("DB_BACKEND") == "sqlite":
        from sqlite_compat import SqliteClient
        client = SqliteClient(os.environ["SQLITE_PATH"])
    else:
        client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ.get('DB_NAME', 'webdojo')]
    return client, db


client, db = _build_client()

# The module-level `client`/`db` are process-global singletons. Motor clients
# bind to the event loop they are *first* used on. Under pytest-xdist
# (`pytest.ini` pins `-n 2 --dist loadscope`), several test modules share a
# single worker process. A context-managed TestClient (e.g. test_zenero_*.py)
# runs the app lifespan: startup binds + uses the shared client, then shutdown
# closes it. Without recovery, the NEXT module scheduled on that worker would
# reuse the same — now closed, loop-bound — client and fail with "Cannot use
# AsyncIOMotorClient after close()". This flag tracks exactly that state so
# the startup handler can hand every new module a clean client bound to its
# own loop, instead of inheriting the closed one.
_db_client_is_closed = False


def _ensure_live_client():
    """Return a usable (client, db), rebuilding the process-global pair when a
    prior shutdown closed it. Each test module that starts a FastAPI lifespan
    thus gets a fresh client bound to its OWN event loop — no inheritance from
    a previous module on the same worker. No-op for unclosed/untouched
    clients, so test files that swap `server.db` explicitly (e.g.
    test_commerce_orders.py's SQLite override) are never clobbered."""
    global client, db, _db_client_is_closed
    if _db_client_is_closed:
        client, db = _build_client()
        _db_client_is_closed = False
    return client, db

app = FastAPI()
api_router = APIRouter(prefix="/api")


# ---------- Models ----------

class Project(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    elements: List[Any] = Field(default_factory=list)
    head_html: str = ""
    custom_js: str = ""
    canvas_bg: str = "#ffffff"
    fonts: List[str] = Field(default_factory=list)
    files: List[Any] = Field(default_factory=list)
    # Excluded from serialization so these never leak into any API response
    # that uses this model, regardless of which DB query populated them.
    dashboard_password_hash: Optional[str] = Field(default=None, exclude=True)
    paypal_secret_enc: Optional[str] = Field(default=None, exclude=True)
    smtp_config_enc: Optional[str] = Field(default=None, exclude=True)
    # Multi-page + template system
    pages: List[Any] = Field(default_factory=list)
    active_page_id: Optional[str] = None
    template: Optional[Any] = None  # { header_html, footer_html, use_template }
    analytics: Optional[Any] = None  # { ga4, fathom, plausible_domain, hotjar, fb_pixel }
    # Phase 1 ownership model. Legacy projects (pre-auth) have owner_id=None
    # and are editable by any authenticated user until claimed.
    owner_id: Optional[str] = None
    collaborators: List[Any] = Field(default_factory=list)  # [{email, role}]
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ProjectCreate(BaseModel):
    name: str
    elements: List[Any] = []
    head_html: str = ""
    custom_js: str = ""
    canvas_bg: str = "#ffffff"
    fonts: List[str] = []
    files: List[Any] = []
    # dashboard_password_hash / paypal_secret_enc are deliberately absent: they
    # are settable only via their own gated endpoints, never through a generic
    # project create/update, which would let anyone holding a project_id
    # overwrite the storefront's password gate.
    pages: List[Any] = []
    active_page_id: Optional[str] = None
    template: Optional[Any] = None
    analytics: Optional[Any] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    elements: Optional[List[Any]] = None
    head_html: Optional[str] = None
    custom_js: Optional[str] = None
    canvas_bg: Optional[str] = None
    fonts: Optional[List[str]] = None
    files: Optional[List[Any]] = None
    # See ProjectCreate — never settable through the generic project update.
    pages: Optional[List[Any]] = None
    active_page_id: Optional[str] = None
    template: Optional[Any] = None
    analytics: Optional[Any] = None


class ProjectSummary(BaseModel):
    id: str
    name: str
    updated_at: datetime


class SavedComponent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str = "custom"
    html: str
    thumbnail: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SavedComponentCreate(BaseModel):
    name: str
    category: str = "custom"
    html: str
    thumbnail: Optional[str] = None


class Snippet(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    language: str = "html"
    content: str
    tags: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class SnippetCreate(BaseModel):
    name: str
    language: str = "html"
    content: str
    tags: List[str] = []


class ProjectTemplate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str = ""
    thumbnail: Optional[str] = None
    aesthetic: Optional[str] = None
    is_starter: bool = False
    data: Any  # snapshot of the project (pages, template, fonts, etc.)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ProjectTemplateCreate(BaseModel):
    name: str
    description: str = ""
    thumbnail: Optional[str] = None
    aesthetic: Optional[str] = None
    data: Any


class PublishPresetPublic(BaseModel):
    id: str
    name: str
    host: str
    port: Optional[int] = None
    username: str
    remote_path: str = "/"
    protocol: str = "ftp"
    html_filename: str = "index.html"
    css_filename: str = "globals.css"
    include_zip: bool = False
    has_password: bool = False
    created_at: datetime


class PublishPreset(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    host: str
    port: Optional[int] = None
    username: str
    remote_path: str = "/"
    protocol: str = "ftp"
    html_filename: str = "index.html"
    css_filename: str = "globals.css"
    include_zip: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class PublishPresetCreate(BaseModel):
    name: str
    host: str
    port: Optional[int] = None
    username: str
    password: Optional[str] = ""
    save_password: bool = True
    remote_path: str = "/"
    protocol: str = "ftp"
    html_filename: str = "index.html"
    css_filename: str = "globals.css"
    include_zip: bool = False


# ---------- Encryption helpers for preset passwords ----------

_KEY_PATH = ROOT_DIR / ".preset_key"
_DASHBOARD_KEY_PATH = ROOT_DIR / ".dashboard_key"

def _get_fernet() -> Fernet:
    key = os.environ.get("WEBDOJO_SECRET_KEY")
    if not key and _KEY_PATH.exists():
        key = _KEY_PATH.read_text().strip()
        try:
            os.chmod(_KEY_PATH, 0o600)
        except Exception:
            pass
    if not key:
        key = Fernet.generate_key().decode()
        try:
            _KEY_PATH.write_text(key)
            os.chmod(_KEY_PATH, 0o600)
        except Exception:
            pass
    return Fernet(key.encode() if isinstance(key, str) else key)


def _encrypt(value: str) -> str:
    return _get_fernet().encrypt(value.encode()).decode()


def _decrypt(token: str) -> str:
    return _get_fernet().decrypt(token.encode()).decode()


def _hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 200_000)
    return f"{salt.hex()}${digest.hex()}"


def _verify_password(password: str, stored: str) -> bool:
    try:
        salt_hex, digest_hex = stored.split("$", 1)
        salt = bytes.fromhex(salt_hex)
        expected = bytes.fromhex(digest_hex)
    except ValueError:
        return False
    actual = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 200_000)
    return hmac.compare_digest(actual, expected)


def _dashboard_token_secret() -> bytes:
    """Signing key for dashboard tokens. Mirrors _get_fernet: env var first,
    else a random key persisted 0o600 to a key file. No hardcoded fallback —
    one would make every token forgeable from a string in a public repo."""
    key = os.environ.get("WEBDOJO_SECRET_KEY")
    if not key and _DASHBOARD_KEY_PATH.exists():
        key = _DASHBOARD_KEY_PATH.read_text().strip()
        try:
            os.chmod(_DASHBOARD_KEY_PATH, 0o600)
        except Exception:
            pass
    if not key:
        key = secrets.token_urlsafe(32)
        try:
            _DASHBOARD_KEY_PATH.write_text(key)
            os.chmod(_DASHBOARD_KEY_PATH, 0o600)
        except Exception:
            pass
    return hashlib.sha256(key.encode("utf-8") + b":dashboard-token").digest()


def _issue_dashboard_token(project_id: str, password_hash: str = "", ttl_seconds: int = 604800) -> str:
    expiry = int(time.time()) + ttl_seconds
    payload = f"{project_id}:{expiry}:{password_hash}".encode("utf-8")
    sig = hmac.new(_dashboard_token_secret(), payload, hashlib.sha256).hexdigest()
    raw = f"{project_id}:{expiry}:{sig}".encode("utf-8")
    return base64.urlsafe_b64encode(raw).decode("ascii")


def _verify_dashboard_token(token: str, project_id: str, password_hash: str = "") -> bool:
    """The project's *current* password hash is part of the signing input, so
    rotating the password invalidates every token issued under the old one —
    revocation without a session store."""
    try:
        raw = base64.urlsafe_b64decode(token.encode("ascii")).decode("utf-8")
        tok_project_id, expiry_str, sig = raw.split(":", 2)
        expiry = int(expiry_str)
    except (ValueError, TypeError):
        return False
    if tok_project_id != project_id:
        return False
    if time.time() > expiry:
        return False
    payload = f"{tok_project_id}:{expiry}:{password_hash}".encode("utf-8")
    expected_sig = hmac.new(_dashboard_token_secret(), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(sig, expected_sig)


def _serialize(doc: dict) -> dict:
    doc.pop("_id", None)
    for k in ("updated_at", "created_at"):
        if k in doc and isinstance(doc[k], datetime):
            doc[k] = doc[k].isoformat()
    return doc


def _deserialize(doc: dict) -> dict:
    for k in ("updated_at", "created_at"):
        if k in doc and isinstance(doc[k], str):
            try:
                doc[k] = datetime.fromisoformat(doc[k])
            except Exception:
                pass
    return doc


def _paypal_api_base() -> str:
    mode = os.environ.get("PAYPAL_MODE", "sandbox")
    return "https://api-m.paypal.com" if mode == "live" else "https://api-m.sandbox.paypal.com"


async def _paypal_get_access_token(client_id: str, secret: str) -> str:
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(
            f"{_paypal_api_base()}/v1/oauth2/token",
            auth=(client_id, secret),
            data={"grant_type": "client_credentials"},
        )
        resp.raise_for_status()
        return resp.json()["access_token"]


async def _paypal_get_order(order_id: str, access_token: str) -> dict:
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(
            f"{_paypal_api_base()}/v2/checkout/orders/{order_id}",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        resp.raise_for_status()
        return resp.json()


def _order_email_html(project_name: str, order: dict, heading: str, intro: str) -> str:
    items_html = "".join(
        f"<li>{html.escape(str(li.get('name', '')))} × {html.escape(str(li.get('quantity', 1)))}</li>"
        for li in (order.get("line_items") or [])
    )
    total = f"{(order.get('amount_total', 0) / 100):.2f} {(order.get('currency') or '').upper()}"
    greeting = html.escape(order.get("customer_name") or order.get("customer_email") or "there")
    shipping_html = ""
    shipping = order.get("shipping_address")
    if shipping:
        shipping_html = f"<p>Shipping to: {html.escape(json.dumps(shipping))}</p>"
    return f"""<html><body style="font-family:system-ui,sans-serif;color:#1a1a1a;max-width:480px;margin:0 auto;">
<h1 style="font-size:20px;">{html.escape(heading)}</h1>
<p>Hi {greeting},</p>
<p>{html.escape(intro)} Order from <b>{html.escape(project_name)}</b>.</p>
<ul>{items_html}</ul>
<p><b>Total: {html.escape(total)}</b></p>
{shipping_html}
</body></html>"""


def _email_confirmation(project_name: str, order: dict) -> tuple[str, str]:
    subject = f"Your order from {project_name} is confirmed"
    body = _order_email_html(project_name, order, "Order confirmed", "Thanks for your order! Here's what you bought.")
    return subject, body


def _email_shipped(project_name: str, order: dict) -> tuple[str, str]:
    subject = f"Your order from {project_name} has shipped"
    body = _order_email_html(project_name, order, "Your order has shipped", "Your order is on its way.")
    return subject, body


def _email_delivered(project_name: str, order: dict) -> tuple[str, str]:
    subject = f"Your order from {project_name} was delivered"
    body = _order_email_html(project_name, order, "Your order was delivered", "Your order has been delivered. We hope you enjoy it!")
    return subject, body


def _send_email_sync(config: dict, to_addr: str, subject: str, html_body: str) -> None:
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = config.get("from_address") or config.get("username")
    msg["To"] = to_addr
    msg.set_content("This email requires an HTML-capable client to view.")
    msg.add_alternative(html_body, subtype="html")
    with smtplib.SMTP(config["host"], int(config["port"]), timeout=10) as smtp:
        smtp.starttls()
        smtp.login(config["username"], config["password"])
        smtp.send_message(msg)


async def _send_email(project_id: str, to_addr: str, subject: str, html_body: str) -> None:
    """Never raises — deliverability must never break order recording or a
    dashboard action. A project with no smtp_config_enc saved is a silent
    no-op, matching the PayPal Secret's "opt-in, not required" posture."""
    if not to_addr:
        return
    project = await db.projects.find_one({"id": project_id}, {"_id": 0, "smtp_config_enc": 1})
    enc = (project or {}).get("smtp_config_enc")
    if not enc:
        return
    try:
        config = json.loads(_decrypt(enc))
    except Exception:
        logger.warning("Could not decrypt SMTP config for project %s", project_id)
        return
    try:
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, _send_email_sync, config, to_addr, subject, html_body)
    except Exception:
        logger.warning("Failed to send email to %s for project %s", to_addr, project_id, exc_info=True)


# ---------- Routes ----------

@api_router.get("/")
async def root():
    return {"message": "WYSIWYG Builder API"}


@api_router.post("/projects", response_model=Project)
async def create_project(payload: ProjectCreate, request: Request):
    """Creating a project requires a builder account: the JWT's user becomes
    the project's owner. Published-site flows never call this endpoint."""
    user = await _auth_mod.authenticate(request)
    project = Project(**payload.model_dump())
    doc = project.model_dump()
    doc["owner_id"] = user["id"]
    doc["collaborators"] = []
    doc = _serialize(doc)
    await db.projects.insert_one(doc.copy())
    return project


@api_router.get("/projects", response_model=List[ProjectSummary])
async def list_projects(request: Request):
    """Scoped listing: projects the caller owns, collaborates on, plus legacy
    unowned projects (visible to every authenticated user until claimed)."""
    user = await _auth_mod.authenticate(request)
    items = []
    async for it in db.projects.find({}, {"_id": 0, "id": 1, "name": 1, "updated_at": 1, "owner_id": 1, "collaborators": 1}):
        it = _deserialize(it)
        if it.get("owner_id") and it["owner_id"] != user["id"] \
                and not any(c.get("email") == user.get("email") for c in (it.get("collaborators") or [])):
            continue
        # Legacy hand-inserted docs may predate updated_at; default keeps
        # ProjectSummary's datetime validation happy.
        items.append({"id": it["id"], "name": it["name"],
                      "updated_at": it.get("updated_at") or "1970-01-01T00:00:00+00:00"})
    items.sort(key=lambda p: str(p.get("updated_at")), reverse=True)
    return [ProjectSummary(**p) for p in items[:500]]


@api_router.post("/projects/{project_id}/claim")
async def claim_project(project_id: str, request: Request):
    """Legacy ownership migration: the first authenticated user to claim an
    unowned project becomes its owner. No-op (200) if already owned by the
    caller; 403 if owned by someone else."""
    user = await _auth_mod.authenticate(request)
    # No field-limiting projection here: the shim's exclude-style projection
    # returns {} for docs lacking the requested field, which would read as
    # "not found" for every legacy project.
    existing = await db.projects.find_one({"id": project_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found")
    owner_id = existing.get("owner_id")
    if owner_id and owner_id != user["id"]:
        raise HTTPException(status_code=403, detail="Project already owned by another account")
    if not owner_id:
        await db.projects.update_one({"id": project_id}, {"$set": {"owner_id": user["id"], "collaborators": []}})
    return {"ok": True, "owner_id": owner_id or user["id"]}


class ShareRequest(BaseModel):
    email: str
    role: str  # viewer | editor | admin


@api_router.post("/projects/{project_id}/share")
async def share_project(project_id: str, payload: ShareRequest, request: Request):
    """Invite/update a collaborator (owner or admin only). Inviting an email
    that has no account yet is allowed — the role applies as soon as they
    register with that email."""
    ctx = await _auth_mod.require_project_access(project_id, request, need="admin")
    email = payload.email.strip().lower()
    if "@" not in email:
        raise HTTPException(status_code=400, detail="Enter a valid email address")
    if payload.role not in ("viewer", "editor", "admin"):
        raise HTTPException(status_code=400, detail="Role must be viewer, editor, or admin")
    if email == ctx["user"].get("email") and ctx["project"].get("owner_id"):
        raise HTTPException(status_code=400, detail="The owner's access cannot be changed")
    collaborators = [c for c in (ctx["project"].get("collaborators") or []) if c.get("email") != email]
    collaborators.append({"email": email, "role": payload.role})
    await db.projects.update_one({"id": project_id}, {"$set": {"collaborators": collaborators}})
    return {"ok": True, "collaborators": collaborators}


@api_router.delete("/projects/{project_id}/collaborators/{collaborator_email}")
async def remove_collaborator(project_id: str, collaborator_email: str, request: Request):
    ctx = await _auth_mod.require_project_access(project_id, request, need="admin")
    collaborators = [c for c in (ctx["project"].get("collaborators") or [])
                     if c.get("email") != collaborator_email.strip().lower()]
    await db.projects.update_one({"id": project_id}, {"$set": {"collaborators": collaborators}})
    return {"ok": True, "collaborators": collaborators}


@api_router.get("/projects/{project_id}", response_model=Project)
async def get_project(project_id: str):
    doc = await db.projects.find_one(
        {"id": project_id},
        {"_id": 0, "dashboard_password_hash": 0, "paypal_secret_enc": 0, "smtp_config_enc": 0},
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Project not found")
    doc = _deserialize(doc)
    return Project(**doc)


@api_router.put("/projects/{project_id}", response_model=Project)
async def update_project(project_id: str, payload: ProjectUpdate, request: Request):
    await _auth_mod.require_project_access(project_id, request, need="editor")
    existing = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found")

    updates = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()

    await db.projects.update_one({"id": project_id}, {"$set": updates})
    doc = await db.projects.find_one(
        {"id": project_id},
        {"_id": 0, "dashboard_password_hash": 0, "paypal_secret_enc": 0, "smtp_config_enc": 0},
    )
    doc = _deserialize(doc)
    return Project(**doc)


@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str, request: Request):
    await _auth_mod.require_project_access(project_id, request, need="admin")
    res = await db.projects.delete_one({"id": project_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"ok": True}


class DashboardPasswordRequest(BaseModel):
    password: str


@api_router.post("/dashboard/{project_id}/set-password")
async def set_dashboard_password(
    project_id: str,
    payload: DashboardPasswordRequest,
    request: Request,
    x_dashboard_token: Optional[str] = Header(default=None),
):
    """project_id is public — it is baked in plaintext into every exported
    site — so this endpoint cannot treat it as a secret. First-time setup is
    open (there is nothing to steal yet); once a password exists, changing it
    requires proving you already know the current one via a dashboard token."""
    if not payload.password or len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    existing = await db.projects.find_one({"id": project_id}, {"_id": 0, "id": 1, "dashboard_password_hash": 1})
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found")
    current_hash = existing.get("dashboard_password_hash")
    if current_hash and not (
        x_dashboard_token and _verify_dashboard_token(x_dashboard_token, project_id, current_hash)
    ):
        # Owner/admin override: a valid builder JWT with admin rank on this
        # project may rotate the dashboard password without knowing the old
        # one (Task 1.3). Anonymous callers still need the current token.
        try:
            await _auth_mod.require_project_access(project_id, request, need="admin")
        except HTTPException:
            raise HTTPException(
                status_code=401,
                detail="A dashboard password is already set — unlock with the current password to change it",
            )
    loop = asyncio.get_running_loop()
    new_hash = await loop.run_in_executor(None, _hash_password, payload.password)
    await db.projects.update_one(
        {"id": project_id},
        {"$set": {"dashboard_password_hash": new_hash}},
    )
    # Read-after-write confirmation: a 200 from this endpoint is the contract
    # that "the password IS set", so verify persistence and retry once before
    # surfacing an error (guards against transient visibility gaps in the
    # SQLite dev shim under parallel test load; no-op cost on Mongo).
    check = await db.projects.find_one({"id": project_id}, {"_id": 0, "dashboard_password_hash": 1})
    if not (check or {}).get("dashboard_password_hash"):
        await asyncio.sleep(0.05)
        await db.projects.update_one(
            {"id": project_id},
            {"$set": {"dashboard_password_hash": new_hash}},
        )
        check = await db.projects.find_one({"id": project_id}, {"_id": 0, "dashboard_password_hash": 1})
        if not (check or {}).get("dashboard_password_hash"):
            logger.error(f"dashboard password write did not persist for project {project_id}")
            raise HTTPException(status_code=500, detail="Could not save the dashboard password — try again")
    return {"ok": True}


@api_router.post("/dashboard/{project_id}/unlock")
async def unlock_dashboard(project_id: str, payload: DashboardPasswordRequest):
    project = await db.projects.find_one({"id": project_id})
    if not project or not project.get("dashboard_password_hash"):
        raise HTTPException(status_code=401, detail="Dashboard password not set for this project")
    stored = project["dashboard_password_hash"]
    loop = asyncio.get_running_loop()
    if not await loop.run_in_executor(None, _verify_password, payload.password, stored):
        raise HTTPException(status_code=401, detail="Incorrect password")
    return {"token": _issue_dashboard_token(project_id, stored)}


async def _require_dashboard_token(project_id: str, x_dashboard_token: Optional[str] = Header(default=None)) -> None:
    project = await db.projects.find_one({"id": project_id}, {"_id": 0, "dashboard_password_hash": 1})
    current_hash = (project or {}).get("dashboard_password_hash") or ""
    if not x_dashboard_token or not _verify_dashboard_token(x_dashboard_token, project_id, current_hash):
        raise HTTPException(status_code=401, detail="Missing or invalid dashboard token")


@api_router.get("/dashboard/{project_id}/orders")
async def list_orders(project_id: str, page: int = 1, page_size: int = 20, x_dashboard_token: Optional[str] = Header(default=None)):
    await _require_dashboard_token(project_id, x_dashboard_token)
    page = max(page, 1)
    page_size = min(max(page_size, 1), 100)
    skip = (page - 1) * page_size
    cursor = db.orders.find({"project_id": project_id}, {"_id": 0}).sort("created_at", -1)
    all_orders = await cursor.to_list(length=skip + page_size)
    orders = all_orders[skip:skip + page_size]
    total = await db.orders.count_documents({"project_id": project_id})
    return {"orders": orders, "total": total, "page": page, "page_size": page_size}


class FulfillmentUpdateRequest(BaseModel):
    fulfillment_status: str


_FULFILLMENT_SEQUENCE = ["processing", "shipped", "delivered"]


@api_router.patch("/dashboard/{project_id}/orders/{order_id}/fulfillment")
async def update_order_fulfillment(
    project_id: str,
    order_id: str,
    payload: FulfillmentUpdateRequest,
    background_tasks: BackgroundTasks,
    x_dashboard_token: Optional[str] = Header(default=None),
):
    await _require_dashboard_token(project_id, x_dashboard_token)
    order = await db.orders.find_one({"id": order_id, "project_id": project_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    current = order.get("fulfillment_status", "processing")
    new_status = payload.fulfillment_status
    if new_status not in _FULFILLMENT_SEQUENCE:
        raise HTTPException(status_code=400, detail="Invalid fulfillment status")
    if _FULFILLMENT_SEQUENCE.index(new_status) != _FULFILLMENT_SEQUENCE.index(current) + 1:
        raise HTTPException(status_code=400, detail=f"Cannot move fulfillment status from {current} to {new_status}")

    await db.orders.update_one({"id": order_id, "project_id": project_id}, {"$set": {"fulfillment_status": new_status}})
    order["fulfillment_status"] = new_status

    to_addr = order.get("customer_email")
    if to_addr:
        project = await db.projects.find_one({"id": project_id}, {"_id": 0, "name": 1})
        project_name = (project or {}).get("name") or "Your store"
        template = _email_shipped if new_status == "shipped" else _email_delivered
        subject, body = template(project_name, order)
        background_tasks.add_task(_send_email, project_id, to_addr, subject, body)

    return order


@api_router.get("/dashboard/{project_id}/customers")
async def list_customers(project_id: str, page: int = 1, page_size: int = 20, x_dashboard_token: Optional[str] = Header(default=None)):
    await _require_dashboard_token(project_id, x_dashboard_token)
    page = max(page, 1)
    page_size = min(max(page_size, 1), 100)

    cursor = db.orders.find(
        {"project_id": project_id, "status": "completed"},
        {"_id": 0, "customer_email": 1, "customer_name": 1, "amount_total": 1, "created_at": 1},
    )
    all_orders = await cursor.to_list(length=None)

    grouped: dict = {}
    for o in all_orders:
        email = (o.get("customer_email") or "").strip().lower()
        if not email:
            continue
        bucket = grouped.setdefault(email, {"email": email, "name": None, "order_count": 0, "ltv": 0, "last_order_at": None})
        bucket["order_count"] += 1
        bucket["ltv"] += o.get("amount_total", 0)
        created = o.get("created_at") or ""
        if bucket["last_order_at"] is None or created >= bucket["last_order_at"]:
            bucket["last_order_at"] = created
            if o.get("customer_name"):
                bucket["name"] = o["customer_name"]

    customers = sorted(grouped.values(), key=lambda c: c["ltv"], reverse=True)
    total = len(customers)
    skip = (page - 1) * page_size
    return {"customers": customers[skip:skip + page_size], "total": total, "page": page, "page_size": page_size}


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


@api_router.get("/dashboard/{project_id}/analytics")
async def get_analytics(project_id: str, x_dashboard_token: Optional[str] = Header(default=None)):
    await _require_dashboard_token(project_id, x_dashboard_token)
    window_start, window_end, dates = _analytics_window()

    # ponytail: single unprojected fetch over the project's full order history,
    # reduced in Python — matches list_customers' established pattern at these
    # order volumes. If a project's history grows large enough for this to
    # matter, split into a windowed+projected query plus a separate all-time
    # first-order-date query.
    cursor = db.orders.find({"project_id": project_id, "status": "completed"}, {"_id": 0})
    all_orders = await cursor.to_list(length=None)
    window_orders = [
        o for o in all_orders
        if window_start <= (o.get("created_at") or "")[:10] <= window_end
    ]
    first_order_dates = _customer_first_order_dates(all_orders)

    return {
        "window": {"start": window_start, "end": window_end, "days": 30},
        "revenue_trend": _compute_revenue_trend(window_orders, dates),
        "fulfillment_funnel": _compute_fulfillment_funnel(window_orders),
        "customer_breakdown": _compute_customer_breakdown(window_orders, first_order_dates, window_start),
        "top_products": _compute_top_products(window_orders),
    }


def _compute_stale_products(all_orders: list, today) -> Optional[dict]:
    trailing_start = (today - timedelta(days=29)).isoformat()
    trailing_end = today.isoformat()
    prior_start = (today - timedelta(days=59)).isoformat()
    prior_end = (today - timedelta(days=30)).isoformat()

    trailing_products = set()
    prior_products = set()
    for o in all_orders:
        day = (o.get("created_at") or "")[:10]
        for item in (o.get("line_items") or []):
            name = (item.get("name") or "").strip()
            if not name:
                continue
            if trailing_start <= day <= trailing_end:
                trailing_products.add(name)
            elif prior_start <= day <= prior_end:
                prior_products.add(name)

    stale = sorted(prior_products - trailing_products)
    if not stale:
        return None
    return {
        "id": "stale_products",
        "severity": "info",
        "title": "Products haven't sold recently",
        "detail": f"{len(stale)} product{'s' if len(stale) != 1 else ''} sold in the prior 30 days but haven't sold in the last 30.",
        "data": {"count": len(stale), "products": stale[:5]},
    }


def _compute_revenue_drop(all_orders: list, today) -> Optional[dict]:
    current_start = (today - timedelta(days=6)).isoformat()
    current_end = today.isoformat()
    prior_start = (today - timedelta(days=13)).isoformat()
    prior_end = (today - timedelta(days=7)).isoformat()

    current_revenue = 0
    prior_revenue = 0
    for o in all_orders:
        day = (o.get("created_at") or "")[:10]
        amount = o.get("amount_total", 0)
        if current_start <= day <= current_end:
            current_revenue += amount
        elif prior_start <= day <= prior_end:
            prior_revenue += amount

    if prior_revenue <= 0 or current_revenue >= prior_revenue * 0.8:
        return None

    percent_change = round((current_revenue - prior_revenue) / prior_revenue * 100)
    return {
        "id": "revenue_drop",
        "severity": "warning",
        "title": "Revenue is down",
        "detail": f"Revenue this week is down {abs(percent_change)}% from last week.",
        "data": {"current_revenue": current_revenue, "prior_revenue": prior_revenue, "percent_change": percent_change},
    }


def _compute_stuck_fulfillment(all_orders: list, today) -> Optional[dict]:
    threshold_date = (today - timedelta(days=7)).isoformat()
    stuck = []
    for o in all_orders:
        status = o.get("fulfillment_status") or "processing"
        if status not in ("processing", "shipped"):
            continue
        day = (o.get("created_at") or "")[:10]
        if day and day < threshold_date:
            stuck.append(o)
    if not stuck:
        return None
    stuck.sort(key=lambda o: o.get("created_at") or "")
    return {
        "id": "stuck_fulfillment",
        "severity": "warning",
        "title": "Orders stuck in fulfillment",
        "detail": f"{len(stuck)} order{'s' if len(stuck) != 1 else ''} have been processing or shipped for more than 7 days.",
        "data": {"count": len(stuck), "order_refs": [o["id"] for o in stuck[:5]]},
    }


def _compute_returning_share_drop(all_orders: list, first_order_dates: dict, today) -> Optional[dict]:
    current_start = (today - timedelta(days=29)).isoformat()
    current_end = today.isoformat()
    prior_start = (today - timedelta(days=59)).isoformat()
    prior_end = (today - timedelta(days=30)).isoformat()

    def share_for_window(start, end):
        new_revenue = 0
        returning_revenue = 0
        for o in all_orders:
            email = (o.get("customer_email") or "").strip().lower()
            if not email:
                continue
            day = (o.get("created_at") or "")[:10]
            if not (start <= day <= end):
                continue
            amount = o.get("amount_total", 0)
            first_date = first_order_dates.get(email)
            if first_date is not None and first_date >= start:
                new_revenue += amount
            else:
                returning_revenue += amount
        total = new_revenue + returning_revenue
        if total <= 0:
            return None
        return returning_revenue / total

    current_share = share_for_window(current_start, current_end)
    prior_share = share_for_window(prior_start, prior_end)
    if current_share is None or prior_share is None:
        return None

    current_pct = round(current_share * 100)
    prior_pct = round(prior_share * 100)
    if prior_pct - current_pct <= 15:
        return None

    return {
        "id": "returning_share_drop",
        "severity": "info",
        "title": "Repeat business is down",
        "detail": f"Returning customers made up {current_pct}% of revenue this month, down from {prior_pct}% last month.",
        "data": {"current_share": current_pct, "prior_share": prior_pct},
    }


@api_router.get("/dashboard/{project_id}/insights")
async def get_insights(project_id: str, x_dashboard_token: Optional[str] = Header(default=None)):
    await _require_dashboard_token(project_id, x_dashboard_token)
    today = datetime.now(timezone.utc).date()

    cursor = db.orders.find({"project_id": project_id, "status": "completed"}, {"_id": 0})
    all_orders = await cursor.to_list(length=None)
    first_order_dates = _customer_first_order_dates(all_orders)

    alerts = []
    for alert in (
        _compute_stale_products(all_orders, today),
        _compute_revenue_drop(all_orders, today),
        _compute_stuck_fulfillment(all_orders, today),
        _compute_returning_share_drop(all_orders, first_order_dates, today),
    ):
        if alert is not None:
            alerts.append(alert)

    return {"alerts": alerts}


def _build_google_fonts_link(fonts):
    if not fonts:
        return ""
    families = "&family=".join([f.replace(" ", "+") for f in fonts])
    return (
        '<link rel="preconnect" href="https://fonts.googleapis.com">'
        '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
        f'<link href="https://fonts.googleapis.com/css2?family={families}&display=swap" rel="stylesheet">'
    )


def _seo_head(seo: dict) -> str:
    """Mirrors frontend/src/lib/exportHtml.js's buildSeoMeta — same field
    set, same og:title/description fallback-to-title/description, same
    twitter:card default (summary_large_image when an og_image is set,
    else summary), same twitter:title/description/image fallbacks to the
    OG fields. These two builders drifted before; keep them in lockstep."""
    seo = seo or {}
    def esc(v: str) -> str:
        return str(v).replace('"', "&quot;").replace("<", "&lt;")
    parts = [f'<meta property="og:type" content="{esc(seo.get("og_type") or "website")}" />']
    if seo.get("description"): parts.append(f'<meta name="description" content="{esc(seo["description"])}" />')
    if seo.get("keywords"): parts.append(f'<meta name="keywords" content="{esc(seo["keywords"])}" />')
    if seo.get("canonical"): parts.append(f'<link rel="canonical" href="{esc(seo["canonical"])}" />')
    if seo.get("favicon"): parts.append(f'<link rel="icon" href="{esc(seo["favicon"])}" />')
    og_title = seo.get("og_title") or seo.get("title")
    og_desc = seo.get("og_description") or seo.get("description")
    if og_title: parts.append(f'<meta property="og:title" content="{esc(og_title)}" />')
    if og_desc: parts.append(f'<meta property="og:description" content="{esc(og_desc)}" />')
    if seo.get("og_image"): parts.append(f'<meta property="og:image" content="{esc(seo["og_image"])}" />')
    card = seo.get("twitter_card") or ("summary_large_image" if seo.get("og_image") else "summary")
    parts.append(f'<meta name="twitter:card" content="{esc(card)}" />')
    if og_title: parts.append(f'<meta name="twitter:title" content="{esc(og_title)}" />')
    if og_desc: parts.append(f'<meta name="twitter:description" content="{esc(og_desc)}" />')
    if seo.get("og_image"): parts.append(f'<meta name="twitter:image" content="{esc(seo["og_image"])}" />')
    return "\n".join(parts)


def _active_page(doc: dict) -> dict:
    """Return the currently active page data (falls back to legacy top-level fields)."""
    pages = doc.get("pages") or []
    if pages:
        active_id = doc.get("active_page_id")
        for p in pages:
            if p.get("id") == active_id:
                return p
        return pages[0]
    return {
        "id": "home",
        "name": doc.get("name") or "Home",
        "slug": "index",
        "status": "draft",
        "elements": doc.get("elements") or [],
        "head_html": doc.get("head_html") or "",
        "canvas_bg": doc.get("canvas_bg") or "#ffffff",
        "fonts": doc.get("fonts") or [],
        "custom_js": doc.get("custom_js") or "",
        "seo": {},
    }


# Mirrored in frontend/src/lib/responsiveCss.js as RESPONSIVE_CSS — the two
# HTML-assembly paths (backend preview/publish, frontend export) don't
# share code, so this constant is intentionally duplicated. Keep both in
# sync if you change this.
#
# Two tiers (tablet <=1024px, mobile <=767px) match responsiveOverrides.js.
# Emitted as both @media (real visitors) and @container (Design-canvas
# viewport toggle, which resizes a plain div rather than an iframe —
# see the frontend copy's comment for the full explanation) rules with
# identical bodies; @container rules are harmless no-ops wherever there's
# no containment ancestor, which is every context this backend copy renders.
_RESPONSIVE_TIER_RULES = (
    "[style*=\"grid-template-columns\"] { grid-template-columns: 1fr !important; } "
    "[data-wd-stack] { flex-direction: column !important; }"
)
RESPONSIVE_CSS_BODY = (
    f"@media (max-width: 1024px) {{{_RESPONSIVE_TIER_RULES}}}"
    f"@media (max-width: 767px) {{{_RESPONSIVE_TIER_RULES}}}"
    f"@container (max-width: 1024px) {{{_RESPONSIVE_TIER_RULES}}}"
    f"@container (max-width: 767px) {{{_RESPONSIVE_TIER_RULES}}}"
)
RESPONSIVE_CSS = f"<style>{RESPONSIVE_CSS_BODY}</style>"

_SCRIPT_CLOSE_RE = re.compile(r'</script', re.IGNORECASE)
# Phase 6: complete <script>…</script> segments, captured so re.split()
# keeps them as list items. Used by _strip_inline_styles to leave script
# payloads (form widgets, players) verbatim — mirrors frontend
# stripInlineStyles.js's SCRIPT_SEG_RE — keep both in sync.
_SCRIPT_SEG_RE = re.compile(r"(<script\b[^>]*>[\s\S]*?</script\s*>)", re.IGNORECASE)


def _esc_raw_script(code: str) -> str:
    """Neutralize a literal '</script' inside raw JS source before splicing
    it into a <script> block. HTML's script-content parsing rule is purely
    textual — it ends the block at the first literal "</script" substring
    it finds, even inside a JS string, comment, or template literal — so
    this defuses that substring without changing what the code does (a
    backslash before "/" is a no-op escape in those contexts). Mirrored in
    frontend/src/lib/escapeHtml.js's escRawScript — keep both in sync."""
    return _SCRIPT_CLOSE_RE.sub(r'<\\/script', code or "")


def _project_to_html(doc: dict, page: Optional[dict] = None) -> str:
    p = page or _active_page(doc)
    template = doc.get("template") or {}
    use_tpl = bool(template.get("use_template"))
    header = template.get("header_html", "") if use_tpl else ""
    footer = template.get("footer_html", "") if use_tpl else ""
    # Phase 5 (Issue #2): the preview/single-file path must strip inline
    # styles too — previously only the site/publish bundle did, which is
    # exactly the "some blocks clean, some still inline" mixed-path report.
    # The lifted declarations ride the consolidated style block below.
    body_html, component_css, strip_media = _strip_inline_styles(p.get("elements") or [])
    body = "\n".join([header, body_html, footer])
    fonts_link = _build_google_fonts_link(p.get("fonts") or doc.get("fonts") or [])
    head_extra = p.get("head_html") or doc.get("head_html") or ""
    # Phase 5 (Issue #7): route the Theme editor's <style data-forge-*>
    # blocks (theme vars, per-element picks, fonts, animations, responsive
    # overrides, imported CSS) out of the head into ONE consolidated style
    # block — the self-contained-preview equivalent of the site export's
    # globals.css sections. Whatever's left of head_html (CDN embeds,
    # analytics snippets, user-authored tags) stays in the head.
    forge = _extract_forge_css(head_extra)
    head_extra = forge["remaining_head"]
    theme_css = "\n".join(
        blk for blk in [*forge["theme_vars"], *forge["base"],
                        # Static per-block CSS for the 117 author-time-classed
                        # blocks, placed before `component_css` so anything
                        # _strip_inline_styles still extracts live (the few
                        # unconverted blocks, or one re-styled after insertion)
                        # cascades on top rather than getting shadowed by the
                        # base rule — same ordering exportHtml.js uses.
                        BLOCK_STYLES_CSS, component_css,
                        *forge["imported_css"], *forge["animations"],
                        *forge["media_queries"],
                        *[r for r in strip_media.split("\n") if r]] if blk
    )
    forge_style = f'<style data-forge-theme="preview">{theme_css}</style>\n' if theme_css.strip() else ""
    canvas_bg = p.get("canvas_bg") or doc.get("canvas_bg") or "#ffffff"
    custom_js = p.get("custom_js") or doc.get("custom_js") or ""
    custom_js_tag = f"<script>{_esc_raw_script(custom_js)}</script>\n" if custom_js.strip() else ""
    seo = p.get("seo") or {}
    seo_head = _seo_head(seo)
    title = seo.get("title") or p.get("name") or doc.get("name") or "Untitled"
    # Phase 5 (Issues #3/#7): <head> is boilerplate only — meta/title/
    # fonts/SEO/user content plus the responsive baseline. The project-id
    # bootstrap lives at the top of <body> (reading its data-wd-project
    # attribute) instead of a <script> tag in the head; the canvas
    # background stays the one tiny body rule a self-contained preview
    # needs (the site/publish export routes it into globals.css instead).
    project_id = json.dumps(doc.get('id') or '')
    return (
        "<!doctype html>\n<html lang=\"en\">\n<head>\n"
        "<meta charset=\"utf-8\" />\n"
        "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n"
        f"<title>{title}</title>\n"
        f"{RESPONSIVE_CSS}\n"
        f"{fonts_link}\n{seo_head}\n"
        f"{forge_style}{head_extra}\n"
        f"<style>body{{margin:0;background:{canvas_bg};}}</style>\n"
        "</head>\n"
        f"<body data-wd-project={project_id}>\n"
        "<script>window.__WD_PROJECT_ID=window.__WD_PROJECT_ID||document.body.getAttribute('data-wd-project')||'';</script>\n"
        f"{body}\n"
        f"{custom_js_tag}"
        "</body>\n</html>"
    )


# ---------- Asset uploads (Phase 2D) ----------
# Block edit menus (gallery/bento/timeline) upload images here so the
# exported site references clean relative URLs like
# /assets/projects/{pid}/imgs/gallery-{block}/my-image.jpg instead of
# huge data URIs. Files live on disk under ASSETS_ROOT (env-overridable
# for tests) and are served by the StaticFiles mount at the bottom.

ASSETS_ROOT = Path(os.environ.get("WEBDOJO_ASSETS_DIR", Path(__file__).parent / "assets"))

_ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
_ALLOWED_VIDEO_TYPES = {"video/mp4", "video/webm", "video/ogg"}
_MAX_ASSET_BYTES = 10 * 1024 * 1024  # 10 MB
_MAX_VIDEO_ASSET_BYTES = 50 * 1024 * 1024  # 50 MB — video files run bigger than images


def _slugify_filename(name: str, fallback_ext: str = ".jpg") -> str:
    """'My Holiday Photo.JPG' → 'my-holiday-photo.jpg' (filesystem-safe)."""
    base, ext = os.path.splitext(name or "")
    slug = re.sub(r"[^a-z0-9]+", "-", base.lower()).strip("-") or "image"
    safe_ext = re.sub(r"[^a-z0-9.]", "", (ext or fallback_ext).lower()) or fallback_ext
    return f"{slug}{safe_ext}"


@api_router.post("/projects/{project_id}/assets/upload")
async def upload_asset(
    project_id: str,
    file: UploadFile = File(...),
    asset_type: str = Query(..., pattern="^(gallery|bento|timeline|image|video)$"),
    asset_id: str = Query("1"),
):
    is_video = asset_type == "video"
    allowed_types = _ALLOWED_VIDEO_TYPES if is_video else _ALLOWED_IMAGE_TYPES
    max_bytes = _MAX_VIDEO_ASSET_BYTES if is_video else _MAX_ASSET_BYTES
    if (file.content_type or "") not in allowed_types:
        raise HTTPException(status_code=400, detail=f"Only {'video' if is_video else 'image'} files allowed")
    block_slug = re.sub(r"[^a-z0-9-]+", "-", (asset_id or "1").lower()).strip("-") or "1"
    rel_dir = f"projects/{project_id}/imgs/{asset_type}-{block_slug}"
    dest_dir = ASSETS_ROOT / rel_dir
    filename = _slugify_filename(file.filename, f".{(file.content_type or 'image/jpeg').split('/')[1]}")
    content = await file.read()
    if len(content) > max_bytes:
        raise HTTPException(status_code=413, detail=f"Asset too large (max {max_bytes // (1024 * 1024)} MB)")
    try:
        dest_dir.mkdir(parents=True, exist_ok=True)
        (dest_dir / filename).write_bytes(content)
    except OSError as e:
        raise HTTPException(status_code=500, detail=f"Could not store asset: {type(e).__name__}")
    url = f"/assets/{rel_dir}/{filename}"
    return {"success": True, "url": url, "filename": filename, "size": len(content)}


@api_router.get("/preview/{project_id}", response_class=HTMLResponse)
async def preview_project(project_id: str, page_id: Optional[str] = None):
    doc = await db.projects.find_one(
        {"id": project_id},
        {"_id": 0, "dashboard_password_hash": 0, "paypal_secret_enc": 0},
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Project not found")
    page = None
    if page_id and doc.get("pages"):
        for p in doc["pages"]:
            if p.get("id") == page_id:
                page = p
                break
    # Log a view for analytics.
    try:
        await db.analytics.insert_one({
            "project_id": project_id,
            "page_id": page_id or (page.get("id") if page else None),
            "event": "preview_view",
            "ts": datetime.now(timezone.utc).isoformat(),
        })
    except Exception:
        pass
    return HTMLResponse(content=_project_to_html(doc, page))


# ---------- Saved components ----------

@api_router.get("/components", response_model=List[SavedComponent])
async def list_components():
    cursor = db.components.find({}, {"_id": 0}).sort("created_at", -1)
    items = await cursor.to_list(500)
    result = []
    for it in items:
        it = _deserialize(it)
        result.append(SavedComponent(**it))
    return result


@api_router.post("/components", response_model=SavedComponent)
async def create_component(payload: SavedComponentCreate):
    comp = SavedComponent(**payload.model_dump())
    doc = comp.model_dump()
    doc = _serialize(doc)
    await db.components.insert_one(doc.copy())
    return comp


@api_router.delete("/components/{component_id}")
async def delete_component(component_id: str):
    res = await db.components.delete_one({"id": component_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Component not found")
    return {"ok": True}


# ---------- Snippets ----------

@api_router.get("/snippets", response_model=List[Snippet])
async def list_snippets():
    cursor = db.snippets.find({}, {"_id": 0}).sort("created_at", -1)
    items = await cursor.to_list(500)
    return [Snippet(**_deserialize(it)) for it in items]


@api_router.post("/snippets", response_model=Snippet)
async def create_snippet(payload: SnippetCreate):
    snip = Snippet(**payload.model_dump())
    doc = _serialize(snip.model_dump())
    await db.snippets.insert_one(doc.copy())
    return snip


@api_router.delete("/snippets/{snippet_id}")
async def delete_snippet(snippet_id: str):
    res = await db.snippets.delete_one({"id": snippet_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Snippet not found")
    return {"ok": True}


# ---------- Project templates ----------

@api_router.get("/templates", response_model=List[ProjectTemplate])
async def list_templates():
    cursor = db.templates.find({}, {"_id": 0}).sort("created_at", -1)
    items = await cursor.to_list(500)
    # Starters first, then user templates newest-first
    parsed = [ProjectTemplate(**_deserialize(it)) for it in items]
    parsed.sort(key=lambda t: (not t.is_starter, -(t.created_at.timestamp())))
    return parsed


@api_router.post("/templates", response_model=ProjectTemplate)
async def create_template(payload: ProjectTemplateCreate):
    tpl = ProjectTemplate(**payload.model_dump())
    doc = _serialize(tpl.model_dump())
    await db.templates.insert_one(doc.copy())
    return tpl


@api_router.delete("/templates/{template_id}")
async def delete_template(template_id: str):
    existing = await db.templates.find_one({"id": template_id}, {"_id": 0, "is_starter": 1})
    if not existing:
        raise HTTPException(status_code=404, detail="Template not found")
    if existing.get("is_starter"):
        raise HTTPException(status_code=403, detail="Starter templates cannot be deleted")
    await db.templates.delete_one({"id": template_id})
    return {"ok": True}


# ---------- Publish presets ----------

@api_router.get("/publish-presets", response_model=List[PublishPresetPublic])
async def list_publish_presets():
    items = []
    # Explicitly exclude the ciphertext from the projection as defense-in-depth
    # so future serializer changes cannot leak encrypted passwords.
    async for doc in db.publish_presets.find({}, {"_id": 0, "password_enc": 0}).sort("created_at", -1):
        deser = _deserialize(doc)
        # Re-derive has_password by looking up the raw doc once (cheap: same _id already located).
        raw = await db.publish_presets.find_one({"id": deser["id"]}, {"_id": 0, "password_enc": 1})
        deser["has_password"] = bool(raw and raw.get("password_enc"))
        items.append(PublishPresetPublic(**deser))
    return items


@api_router.post("/publish-presets", response_model=PublishPresetPublic)
async def create_publish_preset(payload: PublishPresetCreate):
    if not payload.name.strip() or not payload.host.strip() or not payload.username.strip():
        raise HTTPException(status_code=400, detail="name, host and username are required")
    preset = PublishPreset(**payload.model_dump(exclude={"password", "save_password"}))
    doc = _serialize(preset.model_dump())
    # Only store an encrypted blob when the user explicitly opted in AND provided a value.
    should_save_pw = payload.save_password and bool(payload.password)
    if should_save_pw:
        try:
            doc["password_enc"] = _encrypt(payload.password)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to encrypt password: {e}")
    await db.publish_presets.insert_one(doc.copy())
    return PublishPresetPublic(**{**preset.model_dump(), "has_password": should_save_pw})


@api_router.get("/publish-presets/{preset_id}/secret")
async def get_publish_preset_secret(preset_id: str):
    doc = await db.publish_presets.find_one({"id": preset_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Preset not found")
    enc = doc.get("password_enc")
    if not enc:
        return {"password": ""}
    try:
        return {"password": _decrypt(enc)}
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to decrypt password")


@api_router.delete("/publish-presets/{preset_id}")
async def delete_publish_preset(preset_id: str):
    res = await db.publish_presets.delete_one({"id": preset_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Preset not found")
    return {"ok": True}


# ---------- Analytics ----------

@api_router.get("/projects/{project_id}/analytics")
async def project_analytics(
    project_id: str,
    x_dashboard_token: Optional[str] = Header(default=None),
):
    """Site-visit analytics for a published project. Requires a dashboard
    token — the project_id is baked into the exported site's HTML, so it is
    NOT secret; the token gate prevents anyone who views-source from reading
    another project's analytics. (POST /submissions stays public so published
    sites can POST form data without a token.)"""
    await _require_dashboard_token(project_id, x_dashboard_token)
    exists = await db.projects.find_one({"id": project_id}, {"_id": 0, "id": 1})
    if not exists:
        raise HTTPException(status_code=404, detail="Project not found")
    total_views = await db.analytics.count_documents({"project_id": project_id, "event": "preview_view"})
    total_publishes = await db.analytics.count_documents({"project_id": project_id, "event": "publish"})
    recent = []
    async for ev in db.analytics.find({"project_id": project_id}, {"_id": 0}).sort("ts", -1).limit(50):
        recent.append(ev)
    # Views grouped by day (last 30)
    pipeline = [
        {"$match": {"project_id": project_id, "event": "preview_view"}},
        {"$project": {"day": {"$substr": ["$ts", 0, 10]}}},
        {"$group": {"_id": "$day", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}},
        {"$limit": 30},
    ]
    by_day = []
    async for row in db.analytics.aggregate(pipeline):
        by_day.append({"day": row["_id"], "count": row["count"]})
    return {
        "project_id": project_id,
        "total_views": total_views,
        "total_publishes": total_publishes,
        "recent": recent,
        "by_day": by_day,
    }


# ---------- Publish (FTP / FTPS / SFTP) ----------

class PublishRequest(BaseModel):
    host: str
    port: Optional[int] = None
    username: str
    password: str
    remote_path: str = "/"
    protocol: str = "ftp"  # ftp | ftps | sftp
    include_zip: bool = False
    html_filename: str = "index.html"
    css_filename: str = "globals.css"


def _tag_name_at(s, offset):
    """Given the full HTML string being scanned and the offset of a
    style="..." match within it, find the tag name of the element that
    attribute belongs to by walking back to the nearest preceding
    (unclosed) "<". Attributes can appear on either side of style= in the
    frontend's block templates (e.g. `<img src="..." style="...">` or
    `<h2 data-aos="fade-up" style="...">`), so we can't assume a fixed
    position — but style values never contain a literal ">", so the last
    "<" before the match is always this tag's own opening bracket."""
    lt_idx = s.rfind("<", 0, offset)
    if lt_idx == -1:
        return "el"
    m = re.match(r"[a-zA-Z][a-zA-Z0-9]*", s[lt_idx + 1:])
    return m.group(0).lower() if m else "el"

# Per-category prefix to strip from a block id to get its slug. The
# semantic class name is block-<categoryId>-<slug>. Mirrors the frontend's
# BLOCK_PREFIX_BY_CAT in stripInlineStyles.js verbatim — keep both in
# sync. See docs/PHASE_4_BLOCK_AUDIT.md §3.
_BLOCK_PREFIX_BY_CAT = {
    "components": "cmp-",
    "timelines": "cmp-timeline-",
    "navbars": "nav-",
    "headers": "hdr-",
    "footers": "ft-",
    "video": "video-",
    "heroes": "hero-",
    "sections": "section-",
    "containers": "container-",
    "text": "text-",
    "toolbox": "tb-",
    "pricing": "pricing-",
    "team": "team-",
    "faq": "faq-",
    "newsletter": "newsletter-",
    "portfolio": "portfolio-",
    "layout": "layout-",
    "services": "services-",
    "contact": "contact-",
    "testimonials": "testimonial-",
    "esports": "esports-",
    "creator": "creator-",
    "retro": "retro-",
    "parallax": "parallax-",
    "social": "social-",
    "comments": "comments-",
    "zenero": "",
}

# Category id -> display label, in the real block-library CATEGORIES order
# (frontend/src/lib/blocks.js's CATEGORIES + blocksExtra.js's
# EXTRA_CATEGORIES, merged) — used only for the globals.css "Blocks:
# <Label>" section headers/ordering (_build_organized_stylesheet /
# _build_multi_page_bundle), not for class naming. docs/PHASE_4a_HANDOFF.md
# "Picking up Phase 4b" notes the real count is 28 categories (this audit
# undercounted retro and missed oxygene) — CATEGORIES is the source of
# truth, not docs/GLOBALS_CSS_SPEC.md §3's older label list.
_BLOCK_CATEGORY_LABELS = {
    "components": "Components",
    "timelines": "Timelines",
    "navbars": "Navbars",
    "heroes": "Heroes",
    "sections": "Sections",
    "containers": "Containers",
    "text": "Text",
    "toolbox": "Toolbox",
    "headers": "Headers",
    "footers": "Footers",
    "video": "Video BG",
    "pricing": "Pricing",
    "team": "Team",
    "faq": "FAQ",
    "newsletter": "Newsletter",
    "portfolio": "Portfolio",
    "layout": "Layout",
    "services": "Services",
    "contact": "Contact",
    "testimonials": "Testimonials",
    "esports": "Esports",
    "creator": "Creator",
    "retro": "Moldy Oldies",
    "parallax": "Parallax",
    "social": "Social",
    "comments": "Comments",
    "zenero": "Zenero Content",
    "oxygene": "Oxygene",
}

# Extracts the category id out of a semantic-path CSS selector produced by
# _strip_inline_styles (".<prefix>block-<catId>-<slug>-<occ> { ... }") for
# _build_multi_page_bundle's per-category "Blocks:" bucketing — a post-hoc
# pass over the already-produced CSS text, not a change to the extraction/
# naming algorithm itself (which is untouched).
_CSS_RULE_CAT_RE = re.compile(r'\bblock-([a-z0-9]+)-')


def _bucket_css_by_category(component_css: str) -> dict:
    """Buckets already-extracted component CSS rules (one per line, as
    _strip_inline_styles emits them) by the block category their selector
    encodes. Rules with no block-<catId>- segment in their selector (the
    tag+counter fallback path — user-authored/imported markup) land under
    "__generic__". Mirrors what frontend/src/lib/stripInlineStyles.js's
    componentCssByCat computes inline during extraction; done here as a
    separate pass instead so _strip_inline_styles's own logic stays
    untouched."""
    buckets: dict = {}
    for line in component_css.split("\n"):
        if not line.strip():
            continue
        selector = line.split("{", 1)[0]
        m = _CSS_RULE_CAT_RE.search(selector)
        cat_id = m.group(1) if m else "__generic__"
        buckets.setdefault(cat_id, []).append(line)
    return {k: "\n".join(v) for k, v in buckets.items()}


_BLOCK_CAT_RE = re.compile(r'data-wd-cat="([^"]*)"')
_BLOCK_ID_RE = re.compile(r'data-wd-block="([^"]*)"')


def _read_block_meta(html):
    """Reads the data-wd-cat / data-wd-block pair the frontend's
    variants.js::stampVariant stamps onto a block's root tag. Returns
    {"catId": ..., "blockId": ...} or None. Mirrors stripInlineStyles.js's
    readBlockMeta."""
    if not html:
        return None
    cat = _BLOCK_CAT_RE.search(html)
    block = _BLOCK_ID_RE.search(html)
    if cat and block:
        return {"catId": cat.group(1), "blockId": block.group(1)}
    return None


def _block_class_name(cat_id, block_id):
    """block-<catId>-<slug>; slug = blockId with the category's prefix
    stripped (if the block id starts with it), else the full blockId.
    Unknown catIds still work — slug is just the full blockId. Mirrors
    stripInlineStyles.js's blockClassName."""
    p = _BLOCK_PREFIX_BY_CAT.get(cat_id)
    slug = block_id[len(p):] if (p and block_id.startswith(p)) else block_id
    return f"block-{cat_id}-{slug}"


def _strip_inline_styles(elements, prefix=""):
    """Extract inline style attributes into deduplicated CSS classes, one
    class per style="..." occurrence (mirrors frontend/src/lib/stripInlineStyles.js
    — keep both in sync, including _BLOCK_PREFIX_BY_CAT and _read_block_meta).
    Two paths:
      • Semantic path (Phase 4a): if the element's root tag carries the
        data-wd-cat/data-wd-block pair the frontend's variants.js::stampVariant
        stamps at insert time, every style occurrence gets a class
        f"{prefix}block-<catId>-<slug>-<occ>" (1-based occurrence within the
        element) plus a shared unprefixed marker "block-<catId>-<slug>" (the
        Avalon-GEMS override hook; no rule emitted for it).
      • Fallback path (no data-wd-* pair): tag + running counter scoped to
        the whole export — .section-1, .h2-1, etc. Byte-identical to pre-4a.
    `prefix` (e.g. "about-") prefixes the suffixed semantic class (and the
    fallback class) for multi-page exports sharing one stylesheet; the marker
    stays unprefixed so a cross-page override is one rule. A rule setting
    grid-template-columns also gets a companion responsive override.
    Returns (html_with_classes, component_css, media_css)."""
    # component_rules and media_rules are tracked separately (both tiers,
    # matching RESPONSIVE_CSS's tablet/mobile breakpoints) so callers that
    # route CSS into labeled globals.css sections (_build_multi_page_bundle)
    # can place each in the right one.
    component_rules = []
    media_rules = []
    out_html_parts = []
    tag_counters = {}
    block_class = None     # per-element, set in the loop (closure-read by repl)
    occurrence = 0          # per-element, reset in the loop (nonlocal in repl)

    def repl(match):
        nonlocal occurrence
        tag = _tag_name_at(match.string, match.start())
        declarations = match.group(1)
        if block_class:
            # Semantic path: block-<catId>-<slug>-<occ> + shared unprefixed marker.
            occurrence += 1
            cls = f"{prefix}{block_class}-{occurrence}"
            marker = block_class
            component_rules.append(f".{cls} {{ {declarations} }}")
            if "grid-template-columns" in declarations:
                media_rules.append(f"@media (max-width: 1024px) {{ .{cls} {{ grid-template-columns: 1fr !important; }} }}")
                media_rules.append(f"@media (max-width: 767px) {{ .{cls} {{ grid-template-columns: 1fr !important; }} }}")
            return f'class="block {cls} {marker}"'
        # Fallback path: tag + running counter (byte-identical to pre-4a).
        tag_counters[tag] = tag_counters.get(tag, 0) + 1
        cls = f"{prefix}{tag}-{tag_counters[tag]}"
        component_rules.append(f".{cls} {{ {declarations} }}")
        if "grid-template-columns" in declarations:
            media_rules.append(f"@media (max-width: 1024px) {{ .{cls} {{ grid-template-columns: 1fr !important; }} }}")
            media_rules.append(f"@media (max-width: 767px) {{ .{cls} {{ grid-template-columns: 1fr !important; }} }}")
        return f'class="{cls}"'

    for el in elements:
        html = el.get("html", "")
        meta = _read_block_meta(html)
        block_class = _block_class_name(meta["catId"], meta["blockId"]) if meta else None
        occurrence = 0
        # Phase 6: <script> payloads (form widgets, embedded players) carry
        # literal style="..." inside JS strings — code, not markup. Script
        # segments pass through verbatim; only real markup is substituted
        # (mirrors frontend stripInlineStyles.js's protectScriptPayloads —
        # keep both in sync).
        chunks = []
        for seg in _SCRIPT_SEG_RE.split(html):
            if seg[:7].lower() == "<script":
                chunks.append(seg)
            else:
                chunks.append(re.sub(r'style="([^"]*)"', repl, seg))
        out_html_parts.append("".join(chunks))

    return "\n".join(out_html_parts), "\n".join(component_rules), "\n".join(media_rules)


def _esc_text(v) -> str:
    """HTML-escape for a text node (e.g. <title>...</title>) — &, <, > only,
    mirrors frontend/src/lib/escapeHtml.js's escText."""
    return str(v or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


_IMG_RE = re.compile(r'<img(?![^>]*\bloading=)([^>]*)>', re.IGNORECASE)


def _inject_lazy_loading(html: str) -> str:
    """Skips the first <img> (likely the hero/LCP image — eager-loading
    that one is the actual best practice) and lazy-loads the rest. Mirrors
    frontend/src/lib/exportHtml.js's injectLazyLoading."""
    state = {"first": True}

    def repl(m):
        if state["first"]:
            state["first"] = False
            return m.group(0)
        return f'<img{m.group(1)} loading="lazy">'

    return _IMG_RE.sub(repl, html)


def _build_json_ld(name: str, seo: dict) -> str:
    """Minimal JSON-LD, mirrors frontend/src/lib/exportHtml.js's
    buildJsonLd — seo.title wins over the plain page/project name, same
    precedence as the <title> tag itself. Defaults @type to WebSite;
    seo.schema_type (set by a template or manual edit) overrides it."""
    data = {"@context": "https://schema.org", "@type": (seo or {}).get("schema_type") or "WebSite", "name": (seo or {}).get("title") or name or "Untitled"}
    if seo and seo.get("description"):
        data["description"] = seo["description"]
    if seo and seo.get("canonical"):
        data["url"] = seo["canonical"]
    raw = json.dumps(data)
    safe = _SCRIPT_CLOSE_RE.sub(r'<\\/script', raw)
    return f'<script type="application/ld+json">{safe}</script>'


def _safe_page_filename(slug: str, index: int, used: set) -> str:
    """Sanitizes a page slug into a safe filename and de-dupes against
    siblings — slugs are auto-generated once at page-creation time and
    never user-edited directly, but this is about to become a real
    filename on someone's FTP server or inside a zip, so it gets
    re-validated here regardless of how trustworthy the source looks.
    Mirrors frontend/src/lib/exportHtml.js's safePageFilename."""
    base = re.sub(r"^-+|-+$", "", re.sub(r"[^a-z0-9-]+", "-", (slug or "").lower()))
    if not base:
        base = "index" if index == 0 else f"page-{index + 1}"
    name = f"{base}.html"
    n = 2
    while name in used:
        name = f"{base}-{n}.html"
        n += 1
    used.add(name)
    return name


_THEME_RE = re.compile(r'<style data-forge-theme(?:="[^"]*")?>([\s\S]*?)</style>\n?')
_VARS_RE = re.compile(r'<style data-forge-vars>([\s\S]*?)</style>\n?')
_RESPONSIVE_OVERRIDES_RE = re.compile(r'<style data-forge-responsive-overrides>([\s\S]*?)</style>\n?')
_ANIM_RE = re.compile(r'<style data-forge-anim="[^"]*">([\s\S]*?)</style>\n?')
_IMPORTED_CSS_RE = re.compile(r'<style data-forge-imported-css>([\s\S]*?)</style>\n?')
_ROOT_BLOCK_RE = re.compile(r':root\s*{[^}]*}')
_DECL_RE = re.compile(r'(--[\w-]+)\s*:\s*([^;]+);')
_JS_FILE_RE = re.compile(r'<script data-forge-js="([^"]+)">([\s\S]*?)</script>\n?')


def _extract_forge_css(head_html: str) -> dict:
    """Pulls the data-forge-* <style> blocks out of a page's head_html and
    buckets them by which globals.css section they belong in. Mirrors
    frontend/src/lib/exportHtml.js's extractForgeCss — keep both in sync."""
    remaining = head_html or ""
    theme_vars, base, media_queries, animations, imported_css = [], [], [], [], []

    def theme_repl(m):
        body = m.group(1)
        root_match = _ROOT_BLOCK_RE.search(body)
        if root_match:
            theme_vars.append(root_match.group(0))
        rest = _ROOT_BLOCK_RE.sub("", body).strip()
        if rest:
            base.append(rest)
        return ""

    def collect_repl(bucket):
        def repl(m):
            body = m.group(1).strip()
            if body:
                bucket.append(body)
            return ""
        return repl

    remaining = _THEME_RE.sub(theme_repl, remaining)
    remaining = _VARS_RE.sub(collect_repl(theme_vars), remaining)
    remaining = _RESPONSIVE_OVERRIDES_RE.sub(collect_repl(media_queries), remaining)
    remaining = _ANIM_RE.sub(collect_repl(animations), remaining)
    remaining = _IMPORTED_CSS_RE.sub(collect_repl(imported_css), remaining)

    return {
        "remaining_head": remaining.strip(),
        "theme_vars": theme_vars,
        "base": base,
        "media_queries": media_queries,
        "imported_css": imported_css,
        "animations": animations,
    }


def _extract_forge_js(html: str) -> dict:
    """Pulls <script data-forge-js="name.js">...</script> blocks out of a
    page's head_html or element markup and replaces each with
    <script src="js/name.js"></script>, so the multi-page bundle writes one
    real file per name instead of repeating the script inline everywhere
    it's used. First occurrence of a given filename wins. Mirrors
    frontend/src/lib/exportHtml.js's extractForgeJs — keep both in sync."""
    files: dict = {}

    def repl(m):
        filename, code = m.group(1), m.group(2).strip()
        if filename not in files:
            files[filename] = code
        return f'<script src="js/{filename}"></script>'

    remaining = _JS_FILE_RE.sub(repl, html or "")
    return {"remaining": remaining, "files": files}


def _merge_root_blocks(blocks: list) -> str:
    """Merges however many `:root { --x: 1; }` block strings into one
    deduped block (later blocks' declarations win on name collision)."""
    decls = {}
    for block in blocks:
        for m in _DECL_RE.finditer(block):
            decls[m.group(1)] = m.group(2).strip()
    if not decls:
        return ""
    lines = "\n".join(f"  {k}: {v};" for k, v in decls.items())
    return f":root {{\n{lines}\n}}"


def _dedupe(items: list) -> list:
    seen = []
    for it in items:
        if it and it not in seen:
            seen.append(it)
    return seen


def _build_organized_stylesheet(theme_vars, base, component_buckets, generic_component_css, animations, media_queries) -> str:
    """Assembles one clearly labeled globals.css. Section order: Theme
    Variables, Base, Blocks: <Category> (one per bucket in
    component_buckets), Components (generic_component_css — imported/
    unbucketed CSS), Animations, Media Queries — matches
    docs/GLOBALS_CSS_SPEC.md §3 and frontend/src/lib/exportHtml.js's
    buildOrganizedStylesheet/buildComponentSections. `component_buckets` is
    a list of (label, css) pairs, already in category order. Keep both in
    sync."""
    component_sections = [(f"Blocks: {label}", css) for label, css in (component_buckets or [])]
    component_sections.append(("Components", generic_component_css or ""))
    sections = [
        ("Theme Variables", _merge_root_blocks(theme_vars)),
        ("Base", "\n".join(_dedupe(base))),
        *component_sections,
        ("Animations", "\n\n".join(_dedupe(animations))),
        ("Media Queries", "\n".join([RESPONSIVE_CSS_BODY, BLOCK_STYLES_MEDIA_CSS, *_dedupe(media_queries)])),
        # A11y: users with a reduced-motion OS preference get a static site.
        ("Reduced Motion",
         "@media (prefers-reduced-motion: reduce) {\n"
         "  *, *::before, *::after {\n"
         "    animation-duration: 0.01ms !important;\n"
         "    animation-iteration-count: 1 !important;\n"
         "    transition-duration: 0.01ms !important;\n"
         "  }\n}"),
    ]
    return "\n\n".join(f"/* ===== {label} ===== */\n{body or '/* none */'}" for label, body in sections)


def _build_multi_page_bundle(doc: dict, css_filename: str = "globals.css") -> dict:
    """Returns {filename: content} — one classed .html file per page
    sharing a single stylesheet, plus that stylesheet. Falls back to a
    single synthetic "index" page built from the legacy top-level project
    fields for projects saved before the multi-page model existed
    (doc["pages"] empty/missing). Mirrors frontend/src/lib/exportHtml.js's
    buildMultiPageExport — keep both in sync."""
    pages = doc.get("pages") or [{
        "id": doc.get("id"), "name": doc.get("name"), "slug": "index", "seo": doc.get("seo"),
        "elements": doc.get("elements"), "head_html": doc.get("head_html"), "canvas_bg": doc.get("canvas_bg"),
        "fonts": doc.get("fonts"), "custom_js": doc.get("custom_js"),
    }]
    template = doc.get("template") or {}
    use_tpl = bool(template.get("use_template"))
    header = template.get("header_html", "") if use_tpl else ""
    footer = template.get("footer_html", "") if use_tpl else ""

    files = {}
    used = set()
    all_component_by_cat: dict = {}  # catId -> [css chunk, ...], across pages
    generic_css_parts = []           # imported styles + unbucketed fallback rules
    all_theme_vars, all_base, all_animations, all_media_queries = [], [], [], []
    all_js_files: dict = {}

    for i, page in enumerate(pages):
        filename = _safe_page_filename(page.get("slug"), i, used)
        prefix = filename[:-5] + "-"  # strip ".html"
        elements_with_js_extracted = []
        for el in (page.get("elements") or []):
            js_result = _extract_forge_js(el.get("html") or "")
            for name, code in js_result["files"].items():
                if name not in all_js_files:
                    all_js_files[name] = code
            elements_with_js_extracted.append({**el, "html": js_result["remaining"]})
        cleaned_body, component_css, media_css = _strip_inline_styles(elements_with_js_extracted, prefix)
        body = "\n".join(p for p in [header, cleaned_body, footer] if p)
        body = _inject_lazy_loading(body)
        seo = page.get("seo") or {}
        title = seo.get("title") or page.get("name") or doc.get("name") or "Untitled"
        fonts_link = _build_google_fonts_link(page.get("fonts") or doc.get("fonts") or [])
        forge = _extract_forge_css(page.get("head_html") or "")
        head_js_result = _extract_forge_js(forge["remaining_head"])
        for name, code in head_js_result["files"].items():
            if name not in all_js_files:
                all_js_files[name] = code
        remaining_head = head_js_result["remaining"]
        canvas_bg = page.get("canvas_bg") or "#ffffff"
        # Phase 5 (Issues #3/#7): the page's type ("page" | "layout") rides
        # on <body data-wd-page-type>, and the canvas background becomes a
        # [data-wd-page] CSS variable routed into globals.css's Base section
        # — no per-page <style> tags in the exported head.
        page_type = "layout" if page.get("type") == "layout" else "page"
        all_base.append(f'[data-wd-page="{filename[:-5]}"] {{ --wd-canvas-bg: {canvas_bg}; }}')
        custom_js = page.get("custom_js") or ""
        custom_js_tag = f"<script>{_esc_raw_script(custom_js)}</script>\n" if custom_js.strip() else ""
        html = (
            "<!doctype html>\n<html lang=\"en\">\n<head>\n"
            "<meta charset=\"utf-8\" />\n"
            "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n"
            f"<title>{_esc_text(title)}</title>\n"
            f"{_seo_head(seo)}\n{_build_json_ld(page.get('name') or doc.get('name'), seo)}\n"
            f"{fonts_link}\n{remaining_head}\n"
            f'<link rel="stylesheet" href="{css_filename}" />\n'
            "</head>\n"
            f"<body data-wd-project={json.dumps(doc.get('id') or '')} "
            f"data-wd-page=\"{filename[:-5]}\" data-wd-page-type=\"{page_type}\">\n"
            "<script>window.__WD_PROJECT_ID=window.__WD_PROJECT_ID||document.body.getAttribute('data-wd-project')||'';</script>\n"
            f"{body}\n"
            f"{custom_js_tag}"
            "</body>\n</html>"
        )
        files[filename] = html
        # Bucket this page's per-category component CSS for the labeled
        # "Blocks:" globals.css sections; imported styles + the tag+counter
        # fallback rules flatten into the generic tail "Components" bucket.
        for cat_id, css in _bucket_css_by_category(component_css).items():
            if not css:
                continue
            if cat_id == "__generic__":
                generic_css_parts.append(css)
            else:
                all_component_by_cat.setdefault(cat_id, []).append(css)
        generic_css_parts.extend(forge["imported_css"])
        all_theme_vars.extend(forge["theme_vars"])
        all_base.extend(forge["base"])
        all_animations.extend(forge["animations"])
        all_media_queries.extend([r for r in media_css.split("\n") if r] + forge["media_queries"])

    # One shared rule paints every page's canvas from its [data-wd-page]
    # variable (Phase 5, Issue #7 — replaces the per-page <style> tags).
    all_base.append("body { margin: 0; background: var(--wd-canvas-bg, #ffffff); }")
    # Assemble labeled "Blocks: <Category>" sections in CATEGORIES order.
    # Each bucket's static generated CSS (blockStyles.generated.js's Python
    # mirror) comes first, with any export-time-extracted rules for that
    # category appended after it, so a live edit cascades on top of the
    # author-time default instead of being shadowed by it.
    component_buckets = []
    for cat_id, label in _BLOCK_CATEGORY_LABELS.items():
        generated = BLOCK_STYLES_BY_CATEGORY.get(cat_id, "")
        extracted = "\n".join(c for c in all_component_by_cat.get(cat_id, []) if c)
        css = "\n".join(p for p in [generated, extracted] if p)
        if css:
            component_buckets.append((label, css))
    generic_css = "\n".join(p for p in generic_css_parts if p)
    files[css_filename] = _build_organized_stylesheet(
        all_theme_vars, all_base,
        component_buckets, generic_css,
        all_animations, all_media_queries,
    )
    for name, code in all_js_files.items():
        files[f"js/{name}"] = code
    # Site folder scaffolding (mirrors frontend/src/lib/exportHtml.js):
    # js/, imgs/ and fonts/ at the site root, globals.css at root — no css/.
    files["imgs/.keep"] = ""
    files["fonts/.keep"] = ""
    return files


def _validate_publish_filename(name: str) -> str:
    """Reject filenames that could escape the upload directory: path
    separators (including Windows-style backslashes), '..' segments, or
    leading-dot names like '.htaccess'. Returns the name or raises 400."""
    if not name:
        return name
    if "/" in name or "\\" in name or name.startswith("."):
        raise HTTPException(status_code=400, detail="Filenames must be a plain name with no path separators")
    return name


def _build_project_bundle(doc: dict, html_filename: str = "index.html", css_filename: str = "globals.css") -> tuple:
    """Single-page bundle convenience wrapper around _build_multi_page_bundle.
    Returns (html, css) for the requested page filename. Kept as its own
    function so audit tests (and any future single-page export path) can
    assert on exactly what gets uploaded."""
    files = _build_multi_page_bundle(doc, css_filename)
    if html_filename in files:
        return files[html_filename], files[css_filename]
    html_name = next((k for k in files if k.endswith(".html")), None)
    if html_name is None:
        raise RuntimeError("bundle produced no HTML file")
    return files[html_name], files[css_filename]


def _ftp_upload(payload: PublishRequest, files: dict):
    """Blocking FTP/FTPS upload. Runs in a thread from the async endpoint."""
    port = payload.port or (21 if payload.protocol == "ftp" else 21)
    if payload.protocol == "ftps":
        ftp = ftplib.FTP_TLS(context=ssl.create_default_context())
    else:
        ftp = ftplib.FTP()
    ftp.connect(payload.host, port, timeout=30)
    ftp.login(payload.username, payload.password)
    if payload.protocol == "ftps":
        ftp.prot_p()
    remote = (payload.remote_path or "/").rstrip("/") or "/"
    if remote != "/":
        # Ensure remote path exists (best-effort).
        parts = [p for p in remote.split("/") if p]
        acc = ""
        for p in parts:
            acc = f"{acc}/{p}" if acc else f"/{p}"
            try:
                ftp.cwd(acc)
            except ftplib.error_perm:
                try:
                    ftp.mkd(acc)
                    ftp.cwd(acc)
                except ftplib.error_perm as e:
                    raise RuntimeError(f"Failed to create remote path {acc}: {e}")
        ftp.cwd(remote)
    uploaded = []
    for name, content in files.items():
        buf = io.BytesIO(content.encode("utf-8") if isinstance(content, str) else content)
        ftp.storbinary(f"STOR {name}", buf)
        uploaded.append(name)
    ftp.quit()
    return uploaded


def _sftp_upload(payload: PublishRequest, files: dict):
    """Blocking SFTP upload via paramiko."""
    import paramiko  # local import so ftp-only deployments still boot
    port = payload.port or 22
    transport = paramiko.Transport((payload.host, port))
    try:
        transport.connect(username=payload.username, password=payload.password)
        sftp = paramiko.SFTPClient.from_transport(transport)
        remote = (payload.remote_path or ".").rstrip("/") or "."
        # Ensure directory exists.
        if remote not in (".", "/"):
            parts = [p for p in remote.split("/") if p]
            acc = "" if remote.startswith("/") else "."
            for p in parts:
                acc = f"{acc}/{p}" if acc else f"/{p}" if remote.startswith("/") else p
                try:
                    sftp.stat(acc)
                except IOError:
                    sftp.mkdir(acc)
            try:
                sftp.chdir(remote)
            except IOError:
                pass
        uploaded = []
        for name, content in files.items():
            data = content.encode("utf-8") if isinstance(content, str) else content
            with sftp.open(name, "wb") as fp:
                fp.write(data)
            uploaded.append(name)
        sftp.close()
        return uploaded
    finally:
        transport.close()


@api_router.post("/projects/{project_id}/publish")
async def publish_project(project_id: str, payload: PublishRequest):
    doc = await db.projects.find_one(
        {"id": project_id},
        {"_id": 0, "dashboard_password_hash": 0, "paypal_secret_enc": 0},
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Project not found")

    protocol = (payload.protocol or "ftp").lower()
    if protocol not in {"ftp", "ftps", "sftp"}:
        raise HTTPException(status_code=400, detail="protocol must be one of: ftp, ftps, sftp")
    if not payload.host or not payload.username:
        raise HTTPException(status_code=400, detail="host and username are required")

    # html_filename is accepted for backward compat with previously-saved
    # publish presets but is no longer meaningful: each page now gets its
    # own filename from its slug (the home page's slug is "index" by
    # construction, so single-page projects still publish as index.html
    # exactly as before). Only css_filename remains a real choice — it's
    # the one shared stylesheet name across every page.
    css_name = _validate_publish_filename(payload.css_filename or "globals.css")
    # html_filename is validated too even though it's legacy/unused (see
    # below) — it's still accepted from previously-saved publish presets,
    # so a traversal value there must never reach the filesystem.
    _validate_publish_filename(payload.html_filename or "index.html")
    files = _build_multi_page_bundle(doc, css_name)

    if payload.include_zip:
        try:
            import zipfile
            buf = io.BytesIO()
            with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
                for fname, content in files.items():
                    zf.writestr(fname, content)
            files["site.zip"] = buf.getvalue()
        except Exception:
            pass

    try:
        loop = asyncio.get_running_loop()
        if protocol == "sftp":
            uploaded = await loop.run_in_executor(None, _sftp_upload, payload, files)
        else:
            uploaded = await loop.run_in_executor(None, _ftp_upload, payload, files)
    except (*ftplib.all_errors, OSError, RuntimeError) as e:
        raise HTTPException(status_code=502, detail=f"Upload failed: {e}")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Upload failed: {type(e).__name__}: {e}")

    # Log publish event for analytics.
    try:
        await db.analytics.insert_one({
            "project_id": project_id,
            "event": "publish",
            "protocol": protocol,
            "host": payload.host,
            "path": payload.remote_path,
            "files": uploaded,
            "ts": datetime.now(timezone.utc).isoformat(),
        })
    except Exception:
        pass

    return {
        "ok": True,
        "protocol": protocol,
        "host": payload.host,
        "path": payload.remote_path,
        "uploaded": uploaded,
    }


# ---------- Commerce: Stripe payment links for static/exported sites ----------
# Web Dojo users export STATIC HTML published over FTP (no server on the
# published site). Stripe Payment Links are hosted checkout URLs that work
# from any static page, so the builder generates a link server-side and drops
# a "Buy" button that points at it. Uses the claimable sandbox key.

STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY")
if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY


class PaymentLinkCreate(BaseModel):
    name: str
    amount: float
    currency: str = "usd"
    quantity: int = 1


ZERO_DECIMAL_CURRENCIES = {"jpy"}  # Stripe treats these as smallest-unit-is-1; extend if `currencies` below grows to include more.


def _to_unit_amount(amount: float, currency: str) -> int:
    """Convert a decimal amount to Stripe's smallest-currency-unit integer,
    honoring zero-decimal currencies (e.g. JPY) which must be passed as-is,
    not multiplied by 100."""
    if (currency or "usd").lower() in ZERO_DECIMAL_CURRENCIES:
        return int(round(amount))
    return int(round(round(amount, 2) * 100))


def _create_payment_link(name: str, amount: float, currency: str, quantity: int) -> dict:
    price = stripe.Price.create(
        currency=(currency or "usd").lower(),
        unit_amount=_to_unit_amount(amount, currency),
        product_data={"name": name},
    )
    link = stripe.PaymentLink.create(
        line_items=[{"price": price.id, "quantity": max(1, int(quantity or 1))}],
    )
    return {"url": link.url, "id": link.id, "price_id": price.id}


@api_router.get("/commerce/config")
async def commerce_config():
    return {
        "stripe_enabled": bool(os.environ.get("STRIPE_SECRET_KEY")),
        "publishable_key": os.environ.get("STRIPE_PUBLISHABLE_KEY", ""),
        "mode": os.environ.get("STRIPE_MODE", "test"),
        "currencies": ["usd", "eur", "gbp", "cad", "aud", "inr", "jpy"],
    }


@api_router.post("/commerce/payment-link")
async def commerce_payment_link(payload: PaymentLinkCreate):
    if not STRIPE_SECRET_KEY:
        raise HTTPException(status_code=503, detail="Stripe is not configured on this server")
    if not payload.name.strip():
        raise HTTPException(status_code=400, detail="Product name is required")
    if payload.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than zero")
    if payload.amount > 999999:
        raise HTTPException(status_code=400, detail="Amount is too large")
    try:
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(
            None, _create_payment_link, payload.name.strip(), payload.amount, payload.currency, payload.quantity
        )
    except Exception as e:
        detail = getattr(e, "user_message", None) or f"{type(e).__name__}: {e}"
        raise HTTPException(status_code=502, detail=f"Stripe payment link failed: {detail}")


class CheckoutItem(BaseModel):
    name: str
    amount: float
    currency: str = "usd"
    quantity: int = 1


class CheckoutSessionCreate(BaseModel):
    items: List[CheckoutItem]
    project_id: str
    origin_url: Optional[str] = None
    success_url: Optional[str] = None
    cancel_url: Optional[str] = None


def _create_checkout_session(items, success_url, cancel_url, project_id):
    line_items = []
    for it in items:
        line_items.append({
            "price_data": {
                "currency": (it.currency or "usd").lower(),
                "unit_amount": _to_unit_amount(it.amount, it.currency),
                "product_data": {"name": (it.name.strip()[:250] or "Item")},
            },
            "quantity": max(1, min(999, int(it.quantity or 1))),
        })
    session = stripe.checkout.Session.create(
        mode="payment",
        line_items=line_items,
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={"project_id": project_id},
        allow_promotion_codes=True,
        billing_address_collection="required",
        shipping_address_collection={"allowed_countries": [
            "US", "CA", "GB", "AU", "NZ", "DE", "FR", "ES", "IT", "NL", "IE", "SE", "NO", "DK", "FI",
        ]},
    )
    return {"url": session.url, "id": session.id}


@api_router.post("/commerce/checkout-session")
async def commerce_checkout_session(payload: CheckoutSessionCreate):
    """Cart hand-off for exported static sites: the published page POSTs its
    localStorage cart line items and gets a hosted Stripe Checkout URL back."""
    if not STRIPE_SECRET_KEY:
        raise HTTPException(status_code=503, detail="Stripe is not configured on this server")
    if not payload.items:
        raise HTTPException(status_code=400, detail="Cart is empty")
    for it in payload.items:
        if not it.name.strip():
            raise HTTPException(status_code=400, detail="Each item needs a name")
        if it.amount <= 0:
            raise HTTPException(status_code=400, detail="Item amount must be greater than zero")
        if it.amount > 999999:
            raise HTTPException(status_code=400, detail="Item amount is too large")
    # Exported sites bake project_id in at build time; one added before the
    # project's first save bakes in "null"/"" forever. Reject here — the one
    # point every caller converges on — so no unattributable order is created.
    if not await db.projects.find_one({"id": payload.project_id}, {"_id": 0, "id": 1}):
        raise HTTPException(status_code=400, detail="Unknown project_id")
    origin = (payload.origin_url or "").strip().rstrip("/")
    if not (origin.startswith("http://") or origin.startswith("https://")):
        origin = ""
    success_url = payload.success_url or (f"{origin}/?wd_checkout=success&session_id={{CHECKOUT_SESSION_ID}}" if origin else "https://example.com/?wd_checkout=success&session_id={CHECKOUT_SESSION_ID}")
    cancel_url = payload.cancel_url or (f"{origin}/?wd_checkout=cancel" if origin else "https://example.com/?wd_checkout=cancel")
    try:
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, _create_checkout_session, payload.items, success_url, cancel_url, payload.project_id)
    except Exception as e:
        detail = getattr(e, "user_message", None) or f"{type(e).__name__}: {e}"
        raise HTTPException(status_code=502, detail=f"Stripe checkout failed: {detail}")


async def _upsert_order(order: dict) -> bool:
    # A duplicate/retried delivery must not touch the existing row's fields
    # (its "id", "created_at", etc. are freshly regenerated by the caller on
    # every invocation) — sqlite_compat's update_one only supports $set, not
    # Mongo's $setOnInsert, so skip the write outright once a row exists.
    # The return value tells the caller whether this was a genuinely new
    # order — Phase 2's confirmation email fires only on True, so a Stripe
    # retry-delivery of the same event never sends a second email.
    if await db.orders.find_one({"provider_ref": order["provider_ref"]}):
        return False
    await db.orders.update_one(
        {"provider_ref": order["provider_ref"]},
        {"$set": order},
        upsert=True,
    )
    return True


@api_router.post("/commerce/webhook")
async def stripe_webhook(request: Request, background_tasks: BackgroundTasks):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
    if not sig_header or not webhook_secret:
        raise HTTPException(status_code=400, detail="Missing signature")
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except (ValueError, stripe.error.SignatureVerificationError):
        raise HTTPException(status_code=400, detail="Invalid signature")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        loop = asyncio.get_running_loop()
        line_items_result = await loop.run_in_executor(
            None, stripe.checkout.Session.list_line_items, session["id"]
        )
        line_items = [
            {
                "name": item.description,
                "quantity": item.quantity,
                "unit_amount": item.amount_total,
                "currency": item.currency,
            }
            for item in line_items_result.data
        ]
        details = session.get("customer_details") or {}
        order = {
            "id": str(uuid.uuid4()),
            "project_id": (session.get("metadata") or {}).get("project_id", ""),
            "provider": "stripe",
            "provider_ref": session["id"],
            "status": "completed",
            "amount_total": session.get("amount_total", 0),
            "currency": session.get("currency", "usd"),
            "customer_email": details.get("email"),
            "customer_name": details.get("name"),
            "shipping_address": session.get("shipping_details"),
            "line_items": line_items,
            "fulfillment_status": "processing",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        is_new = await _upsert_order(order)
        if is_new and order["customer_email"]:
            project = await db.projects.find_one({"id": order["project_id"]}, {"_id": 0, "name": 1})
            project_name = (project or {}).get("name") or "Your store"
            subject, body = _email_confirmation(project_name, order)
            background_tasks.add_task(_send_email, order["project_id"], order["customer_email"], subject, body)
    return {"received": True}


class PaypalSecretRequest(BaseModel):
    project_id: str
    client_id: str
    secret: str


@api_router.post("/commerce/paypal-secret")
async def set_paypal_secret(
    payload: PaypalSecretRequest,
    x_dashboard_token: Optional[str] = Header(default=None),
):
    existing = await db.projects.find_one(
        {"id": payload.project_id},
        {"_id": 0, "id": 1, "paypal_secret_enc": 1, "dashboard_password_hash": 1},
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found")
    # Same reasoning as set_dashboard_password: project_id is public, so
    # first write is open but replacing existing credentials needs a token.
    if existing.get("paypal_secret_enc"):
        current_hash = existing.get("dashboard_password_hash") or ""
        if not (x_dashboard_token and _verify_dashboard_token(x_dashboard_token, payload.project_id, current_hash)):
            raise HTTPException(
                status_code=401,
                detail="PayPal credentials are already set — unlock the dashboard to replace them",
            )
    await db.projects.update_one(
        {"id": payload.project_id},
        {"$set": {
            "paypal_client_id": payload.client_id,
            "paypal_secret_enc": _encrypt(payload.secret),
        }},
    )
    return {"ok": True}


class SmtpConfigRequest(BaseModel):
    project_id: str
    host: str
    port: int
    username: str
    password: str
    from_address: str


@api_router.post("/commerce/smtp-config")
async def set_smtp_config(
    payload: SmtpConfigRequest,
    x_dashboard_token: Optional[str] = Header(default=None),
):
    existing = await db.projects.find_one(
        {"id": payload.project_id},
        {"_id": 0, "id": 1, "smtp_config_enc": 1, "dashboard_password_hash": 1},
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found")
    # Same reasoning as set_paypal_secret: project_id is public, so first
    # write is open but replacing existing credentials needs a token.
    if existing.get("smtp_config_enc"):
        current_hash = existing.get("dashboard_password_hash") or ""
        if not (x_dashboard_token and _verify_dashboard_token(x_dashboard_token, payload.project_id, current_hash)):
            raise HTTPException(
                status_code=401,
                detail="SMTP settings are already set — unlock the dashboard to replace them",
            )
    config = {
        "host": payload.host,
        "port": payload.port,
        "username": payload.username,
        "password": payload.password,
        "from_address": payload.from_address,
    }
    await db.projects.update_one(
        {"id": payload.project_id},
        {"$set": {"smtp_config_enc": _encrypt(json.dumps(config))}},
    )
    return {"ok": True}


class PaypalVerifyRequest(BaseModel):
    project_id: str
    order_id: str


@api_router.post("/commerce/paypal/verify")
async def paypal_verify(payload: PaypalVerifyRequest, background_tasks: BackgroundTasks):
    project = await db.projects.find_one({"id": payload.project_id})
    if not project:
        raise HTTPException(status_code=400, detail="Unknown project_id")
    if not project.get("paypal_secret_enc") or not project.get("paypal_client_id"):
        raise HTTPException(status_code=400, detail="PayPal is not configured for this project")

    secret = _decrypt(project["paypal_secret_enc"])
    try:
        access_token = await _paypal_get_access_token(project["paypal_client_id"], secret)
        order = await _paypal_get_order(payload.order_id, access_token)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Could not reach PayPal to verify this order: {type(e).__name__}")

    if order.get("status") != "COMPLETED":
        raise HTTPException(status_code=400, detail=f"PayPal order status is {order.get('status')}, not COMPLETED")

    unit = (order.get("purchase_units") or [{}])[0]
    amount = unit.get("amount", {})
    payer = order.get("payer", {}) or {}
    payer_name_obj = payer.get("name", {}) or {}
    payer_name = " ".join(filter(None, [payer_name_obj.get("given_name"), payer_name_obj.get("surname")])) or None
    # Decimal, not int(float(v) * 100): int(float("8.20") * 100) is 819.
    try:
        amount_total = int(Decimal(str(amount.get("value") or "0")).scaleb(2))
    except InvalidOperation:
        raise HTTPException(status_code=502, detail="PayPal returned an unreadable amount")

    order_record = {
        "id": str(uuid.uuid4()),
        "project_id": payload.project_id,
        "provider": "paypal",
        "provider_ref": order["id"],
        "status": "completed",
        "amount_total": amount_total,
        "currency": amount.get("currency_code", "usd").lower(),
        "customer_email": payer.get("email_address"),
        "customer_name": payer_name,
        "shipping_address": None,
        "line_items": [],
        "fulfillment_status": "processing",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    is_new = await _upsert_order(order_record)
    if is_new and order_record["customer_email"]:
        project_name = (project or {}).get("name") or "Your store"
        subject, body = _email_confirmation(project_name, order_record)
        background_tasks.add_task(_send_email, payload.project_id, order_record["customer_email"], subject, body)
    return {"ok": True}


@api_router.get("/commerce/receipt/{provider_ref}")
async def get_receipt(provider_ref: str):
    """provider_ref arrives as a URL query param on the published site, where
    the merchant's own analytics scripts routinely log the full URL. Return
    only what the receipt actually renders — never the buyer's email or
    shipping address."""
    order = await db.orders.find_one({"provider_ref": provider_ref}, {"_id": 0})
    if not order:
        return {"status": "processing"}
    return {
        "status": order.get("status", "completed"),
        "amount_total": order.get("amount_total", 0),
        "currency": order.get("currency", ""),
        "line_items": order.get("line_items", []),
        "customer_name": order.get("customer_name"),
    }


class UrlImport(BaseModel):
    url: str


def _resolve_safe_ip(hostname: str) -> str:
    """Resolve hostname to a single public IP. Raises HTTPException if it
    cannot be resolved to a safe (public/routable) address. ip.is_global
    covers private/loopback/link-local/reserved/multicast/unspecified AND
    the CGNAT range (100.64.0.0/10), which those individual checks miss."""
    try:
        infos = socket.getaddrinfo(hostname, None)
    except socket.gaierror:
        raise HTTPException(status_code=400, detail="Could not resolve host")
    for _family, _type, _proto, _canon, sockaddr in infos:
        try:
            ip = ipaddress.ip_address(sockaddr[0])
        except ValueError:
            continue
        if ip.is_global:
            return str(ip)
    raise HTTPException(status_code=400, detail="That URL points to a private or internal address")


def _validate_import_url(url: str):
    """Validate `url` is a safe, public http(s) URL and pin its connection
    to the exact IP that was validated (rather than the hostname), so a
    later independent DNS lookup by the HTTP client can't be swapped to a
    private address between validation and connection (DNS rebinding).
    Returns (pinned_url, original_hostname)."""
    parts = urlsplit(url)
    if parts.scheme not in ("http", "https") or not parts.hostname:
        raise HTTPException(status_code=400, detail="Enter a valid http(s) URL")
    ip = _resolve_safe_ip(parts.hostname)
    host_part = f"[{ip}]" if ":" in ip else ip
    netloc = f"{host_part}:{parts.port}" if parts.port else host_part
    pinned_url = parts._replace(netloc=netloc).geturl()
    return pinned_url, parts.hostname


async def _safe_fetch_url(client: "httpx.AsyncClient", url: str, max_redirects: int = 5):
    """Fetch `url` through the same SSRF-safe path as the main page fetch
    below (every hop re-validated and IP-pinned via _validate_import_url).
    Returns (final_url, text, status). Shared by import_url (the page
    itself) and the stylesheet-inlining pass, so a <link rel="stylesheet">
    a page points at gets the identical protection as the page URL a user
    typed in — an attacker-controlled page couldn't otherwise use its own
    CSS links as an SSRF side door."""
    current_url = url
    for _ in range(max_redirects):
        pinned_url, host = _validate_import_url(current_url)
        r = await client.get(pinned_url, headers={"Host": host}, extensions={"sni_hostname": host})
        if r.status_code in (301, 302, 303, 307, 308) and "location" in r.headers:
            current_url = urljoin(current_url, r.headers["location"])
            continue
        return current_url, r.text, r.status_code
    raise HTTPException(status_code=502, detail="Too many redirects")


_STYLESHEET_LINK_RE = re.compile(
    r'<link\b[^>]*\brel=["\']stylesheet["\'][^>]*\bhref=["\']([^"\']+)["\'][^>]*>'
    r'|<link\b[^>]*\bhref=["\']([^"\']+)["\'][^>]*\brel=["\']stylesheet["\'][^>]*>',
    re.IGNORECASE,
)
_HEAD_CLOSE_RE = re.compile(r'</head>', re.IGNORECASE)


async def _inline_external_stylesheets(client: "httpx.AsyncClient", html: str, base_url: str, max_sheets: int = 8) -> str:
    """Best-effort: fetch every <link rel="stylesheet"> a page references
    (through the same SSRF-safe fetch as the page itself) and splice their
    CSS into <head> as inline <style data-forge-imported-css> blocks, so
    an imported template's real styling travels with it instead of
    silently depending on a live link the export won't control. A
    stylesheet that fails to fetch (CORS is a non-issue server-side, but
    the host can still be down/blocking) is skipped, not fatal — partial
    styling beats no import."""
    urls = []
    for m in _STYLESHEET_LINK_RE.finditer(html):
        href = m.group(1) or m.group(2)
        if href:
            urls.append(urljoin(base_url, href))
    urls = urls[:max_sheets]
    css_parts = []
    for sheet_url in urls:
        try:
            _, css_text, status = await _safe_fetch_url(client, sheet_url)
            if status == 200 and css_text.strip():
                css_parts.append(css_text)
        except Exception:
            continue
    if not css_parts:
        return html
    style_block = '<style data-forge-imported-css>\n' + "\n".join(css_parts) + '\n</style>'
    if _HEAD_CLOSE_RE.search(html):
        return _HEAD_CLOSE_RE.sub(style_block + '</head>', html, count=1)
    return style_block + html


@api_router.post("/import/url")
async def import_url(payload: UrlImport):
    """Fetch a public page's HTML so the builder can import its sections,
    plus its linked stylesheets (see _inline_external_stylesheets) so the
    imported markup keeps its real styling instead of relying on a link
    the export doesn't control.

    Every hop (initial URL and each redirect) is resolved and validated by
    _validate_import_url, and the actual connection is pinned to that
    validated IP (Host header + SNI set to the original hostname so
    name-based routing and TLS still work) so the HTTP client's own,
    separate DNS resolution can never be swapped to a private address
    between our check and the real connection."""
    url = (payload.url or "").strip()
    try:
        async with httpx.AsyncClient(follow_redirects=False, timeout=15.0, headers={"User-Agent": "Mozilla/5.0 (WebDojo importer)"}) as client:
            final_url, html, status = await _safe_fetch_url(client, url)
            html = html[:2_000_000]
            if status == 200:
                html = await _inline_external_stylesheets(client, html, final_url)
            return {"html": html, "status": status}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Could not fetch that URL ({type(e).__name__})")


# ---------- Client diagnostics log ----------
# The builder frontend's diagnostics layer (frontend/src/lib/diagnostics.js)
# batches client-side errors, API timings, and memory samples here. These are
# operational telemetry for the *builder app itself*, not site-visitor data:
# the poster is the developer/user's own browser session. Kept deliberately
# small — bounded batch size, capped per-event size, and old entries are
# trimmed on write so the collection can't grow without bound.

_MAX_CLIENT_LOG_BATCH = 100
_MAX_CLIENT_LOG_EVENT_BYTES = 8_000
_CLIENT_LOG_KEEP = 500


@api_router.post("/client-logs")
async def receive_client_logs(request: Request):
    try:
        await _cap_request_body(request, 256_000)  # 256 KB per flush, hard cap
        body = await request.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read log payload: {type(e).__name__}")
    events = body.get("events") if isinstance(body, dict) else None
    if not isinstance(events, list) or not events:
        raise HTTPException(status_code=400, detail="events must be a non-empty list")
    docs = []
    now = datetime.now(timezone.utc).isoformat()
    for ev in events[:_MAX_CLIENT_LOG_BATCH]:
        if not isinstance(ev, dict):
            continue
        doc = {"received_at": now}
        for k in ("kind", "ts", "seq", "message", "stack", "source", "url", "status", "ms", "slow"):
            v = ev.get(k)
            if isinstance(v, str) and len(v) > _MAX_CLIENT_LOG_EVENT_BYTES:
                v = v[:_MAX_CLIENT_LOG_EVENT_BYTES]
            if v is not None:
                doc[k] = v
        docs.append(doc)
    if not docs:
        return {"ok": True, "stored": 0}
    for i, doc in enumerate(docs):
        # The SQLite shim keys rows on doc["id"] — every stored document needs
        # one (server.py's other collections use uuid4 the same way).
        doc["id"] = str(uuid.uuid4())
        # Shim-compatible identity for trimming: an integer sequence assigned
        # at write time (the shim stores its own row id separately from the
        # document, so Mongo-style _id deletion isn't available).
        doc["n"] = i + 1
        await db.client_logs.insert_one(doc)
    # Trim oldest beyond the retention window. Rare (only past 500 entries);
    # done as equality deletions since the shim has no $in.
    total = await db.client_logs.count_documents({})
    if total > _CLIENT_LOG_KEEP:
        rows = await db.client_logs.find({}, {"_id": 0, "received_at": 1, "n": 1}).to_list(length=None)
        rows.sort(key=lambda r: (r.get("received_at", ""), r.get("n", 0)))
        excess = total - _CLIENT_LOG_KEEP
        for r in rows[:excess]:
            await db.client_logs.delete_many({"received_at": r.get("received_at"), "n": r.get("n")})
    return {"ok": True, "stored": len(docs)}


@api_router.get("/client-logs")
async def list_client_logs(limit: int = 50):
    """Most recent client diagnostics, newest first (bounded page)."""
    limit = min(max(limit, 1), 200)
    cursor = db.client_logs.find({}, {"_id": 0}).sort("received_at", -1).limit(limit)
    items = await cursor.to_list(limit)
    return [_deserialize(it) for it in items]


# ---------- Dynamic block bridge (Phase 3.2) ----------
# Smart blocks carry data-dynamic-type="blog-posts|social-posts|portfolio"
# plus optional data-dynamic-limit. Stored HTML keeps static placeholder
# markup; the PREVIEW endpoint hydrates those blocks with live data at
# request time. Export stays fully static by design: exported pages keep the
# stored placeholder markup, so exports remain portable snapshots (the
# trade-off is documented in WEB_DOJO_OVERVIEW.md §7 rather than shipping
# half-live hybrids).

_DYNAMIC_TYPES = ("blog-posts", "social-posts", "portfolio")
_DYNAMIC_OPEN_RE = re.compile(
    r"<(\w+)\b([^>]*?\bdata-dynamic-type=[\"']([\w-]+)[\"'][^>]*)>", re.IGNORECASE)


def _esc_html(text) -> str:
    return (text or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def _fmt_day(iso) -> str:
    return (iso or "")[:10]


_CARD = ("border:1px solid #e2e8f0;border-radius:12px;padding:18px;"
         "background:#ffffff;font-family:system-ui,sans-serif;margin-bottom:14px;")
_META = "font-size:12px;color:#64748b;margin:0 0 6px;"
_TITLE = "font-size:19px;font-weight:700;margin:0 0 8px;color:#0f172a;"
_BODY = "font-size:14px;line-height:1.6;color:#334155;margin:0;"
_EMPTY = '<p style="font-size:14px;color:#64748b;font-family:system-ui,sans-serif;">{}</p>'


async def _dynamic_inner(project_id: str, dtype: str, limit: int) -> str:
    """Live-rendered inner HTML for one dynamic block kind."""
    if dtype == "blog-posts":
        items = []
        async for it in db.posts.find({"project_id": project_id}, {"_id": 0}):
            if not it.get("draft"):
                items.append(it)
        items.sort(key=lambda p: p.get("published_at") or p.get("created_at") or "", reverse=True)
        cards = []
        for p in items[:limit]:
            excerpt = p.get("excerpt") or re.sub(r"<[^>]+>", " ", p.get("content") or "")[:180]
            tags = "".join(
                f'<span style="display:inline-block;background:#eef2ff;color:#4338ca;'
                f'border-radius:999px;padding:2px 10px;font-size:11px;margin-right:6px;">{_esc_html(t)}</span>'
                for t in (p.get("tags") or [])[:4])
            cards.append(
                f'<article style="{_CARD}">'
                f'<p style="{_META}">{_fmt_day(p.get("published_at") or p.get("created_at"))}</p>'
                f'<h3 style="{_TITLE}">{_esc_html(p.get("title"))}</h3>'
                f'<p style="{_BODY}">{_esc_html(excerpt.strip())}</p>'
                f'<div style="margin-top:10px;">{tags}</div></article>')
        return "".join(cards) or _EMPTY.format("No posts published yet.")

    if dtype == "social-posts":
        items = []
        async for it in db.social_posts.find({"project_id": project_id}, {"_id": 0}):
            items.append(it)
        items.sort(key=lambda p: p.get("created_at") or "", reverse=True)
        cards = []
        for p in items[:limit]:
            initial = _esc_html((p.get("author_name") or "?")[:1].upper())
            cards.append(
                f'<article style="{_CARD}">'
                f'<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">'
                f'<div style="width:34px;height:34px;border-radius:50%;background:#c7d2fe;'
                f'display:flex;align-items:center;justify-content:center;font-weight:700;color:#3730a3;">{initial}</div>'
                f'<div><div style="font-weight:600;font-size:14px;color:#0f172a;">{_esc_html(p.get("author_name"))}</div>'
                f'<div style="font-size:11px;color:#64748b;">{_fmt_day(p.get("created_at"))}</div></div></div>'
                f'<p style="{_BODY}">{_esc_html(p.get("content"))}</p>'
                f'<p style="{_META};margin-top:8px;">&#9825; {p.get("likes_count") or 0}</p></article>')
        return "".join(cards) or _EMPTY.format("The wall is empty for now.")

    if dtype == "portfolio":
        items = []
        async for it in db.portfolio_projects.find({"project_id": project_id}, {"_id": 0}):
            items.append(it)
        items.sort(key=lambda p: p.get("created_at") or "", reverse=True)
        cards = []
        for p in items[:limit]:
            demo = (f' <a href="{_esc_html(p["demo_url"])}" rel="noreferrer" '
                    f'style="color:#4338ca;">demo</a>') if p.get("demo_url") else ""
            repo = (f' &#183; <a href="{_esc_html(p["github_url"])}" rel="noreferrer" '
                    f'style="color:#4338ca;">code</a>') if p.get("github_url") else ""
            cards.append(
                f'<article style="{_CARD}">'
                f'<span style="display:inline-block;background:#dcfce7;color:#166534;'
                f'border-radius:999px;padding:2px 10px;font-size:11px;margin-bottom:8px;">{_esc_html(p.get("category"))}</span>'
                f'<h3 style="{_TITLE}">{_esc_html(p.get("title"))}</h3>'
                f'<p style="{_BODY}">{_esc_html(p.get("description"))}</p>'
                f'<p style="{_META};margin-top:8px;">{demo}{repo}</p></article>')
        return "".join(cards) or _EMPTY.format("No projects yet.")

    return ""
# Deployed/exported static sites POST their form data here so Web Dojo acts as a
# lightweight form backend. The generated form block sends multipart FormData via
# fetch (Accept: application/json) and shows an inline success message. Native
# no-JS POSTs get a friendly HTML thank-you page.

class Submission(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: Optional[str] = None
    form_id: Optional[str] = None
    form_name: str = "Untitled form"
    page_url: str = ""
    page_title: str = ""
    data: dict = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


_RESERVED_SUB_KEYS = {"_wd_form", "_wd_form_id", "_wd_page", "_wd_title", "_wd_project"}

_MAX_SUBMISSION_BYTES = 1_000_000  # 1 MB — generous for a form submission, small enough to bound memory


async def _cap_request_body(request: Request, max_bytes: int) -> None:
    """Read the request body once, aborting as soon as it exceeds max_bytes
    (bounds memory even without a truthful Content-Length header), and
    cache it on the request so the later request.json()/request.form()
    calls reuse it instead of re-reading the now-exhausted ASGI stream —
    this is the same caching Starlette's own Request.body() does
    internally (see starlette/requests.py: stream() yields self._body
    directly when it's already set)."""
    content_length = request.headers.get("content-length")
    if content_length and content_length.isdigit() and int(content_length) > max_bytes:
        raise HTTPException(status_code=413, detail="Submission too large")
    chunks = []
    total = 0
    async for chunk in request.stream():
        total += len(chunk)
        if total > max_bytes:
            raise HTTPException(status_code=413, detail="Submission too large")
        chunks.append(chunk)
    request._body = b"".join(chunks)


async def _extract_submission(request: Request) -> Submission:
    await _cap_request_body(request, _MAX_SUBMISSION_BYTES)
    ctype = (request.headers.get("content-type") or "").lower()
    meta: dict = {}
    data: dict = {}
    if "application/json" in ctype:
        body = await request.json()
        if not isinstance(body, dict):
            body = {}
        nested = body.get("data") if isinstance(body.get("data"), dict) else None
        for k, v in body.items():
            if k in _RESERVED_SUB_KEYS:
                meta[k] = v
            elif k != "data":
                data[k] = v
        if nested:
            data.update(nested)
    else:
        form = await request.form()
        for k in dict.fromkeys(form.keys()):
            parsed = []
            for v in form.getlist(k):
                filename = getattr(v, "filename", None)
                parsed.append(f"[file] {filename}" if filename else v)
            val = parsed[0] if len(parsed) == 1 else parsed
            if k in _RESERVED_SUB_KEYS:
                meta[k] = val
            else:
                data[k] = val
    return Submission(
        project_id=(meta.get("_wd_project") or None),
        form_id=(meta.get("_wd_form_id") or None),
        form_name=(str(meta.get("_wd_form") or "").strip() or "Untitled form"),
        page_url=str(meta.get("_wd_page") or ""),
        page_title=str(meta.get("_wd_title") or ""),
        data=data,
    )


_THANK_YOU_HTML = (
    "<!doctype html><html><head><meta charset='utf-8'><title>Thank you</title>"
    "<style>body{margin:0;font-family:system-ui,sans-serif;background:#0d0d0d;color:#f4f4f4;"
    "display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center;}"
    ".c{max-width:440px;padding:32px;}h1{font-size:22px;margin:0 0 8px;}a{color:#4f46e5;text-decoration:none;}</style>"
    "</head><body><div class='c'><h1>Thanks!</h1><p>Your submission was received.</p>"
    "<p><a href='javascript:history.back()'>&larr; Go back</a></p></div></body></html>"
)


@api_router.post("/submissions")
async def create_submission(request: Request):
    try:
        sub = await _extract_submission(request)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read form data: {type(e).__name__}")
    if not sub.data:
        raise HTTPException(status_code=400, detail="No form fields were submitted")
    doc = _serialize(sub.model_dump())
    await db.submissions.insert_one(doc.copy())
    accept = (request.headers.get("accept") or "").lower()
    if "application/json" in accept:
        return {"ok": True, "id": sub.id}
    return HTMLResponse(content=_THANK_YOU_HTML)


@api_router.get("/submissions", response_model=List[Submission])
async def list_submissions(
    project_id: Optional[str] = None,
    form_name: Optional[str] = None,
    x_dashboard_token: Optional[str] = Header(default=None),
):
    """List stored form submissions for a project. Requires a valid dashboard
    token for the project_id — without it, anyone who views-source the exported
    site (project_id is in plaintext) could enumerate another project's form
    data. form_name is an optional secondary filter within the project."""
    if not project_id:
        raise HTTPException(status_code=400, detail="project_id is required")
    await _require_dashboard_token(project_id, x_dashboard_token)
    query: dict = {"project_id": project_id}
    if form_name:
        query["form_name"] = form_name
    cursor = db.submissions.find(query, {"_id": 0}).sort("created_at", -1)
    items = await cursor.to_list(1000)
    return [Submission(**_deserialize(it)) for it in items]


@api_router.delete("/submissions/{submission_id}")
async def delete_submission(
    submission_id: str,
    x_dashboard_token: Optional[str] = Header(default=None),
):
    """Delete a single submission by ID. Requires a dashboard token for the
    submission's owning project — without it, anyone who guesses/enumerates a
    submission_id could delete another project's form data."""
    doc = await db.submissions.find_one({"id": submission_id}, {"_id": 0, "project_id": 1})
    if not doc:
        raise HTTPException(status_code=404, detail="Submission not found")
    project_id = doc.get("project_id") or ""
    if not project_id:
        raise HTTPException(status_code=400, detail="Submission has no project_id — cannot verify dashboard token")
    await _require_dashboard_token(project_id, x_dashboard_token)
    res = await db.submissions.delete_one({"id": submission_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Submission not found")
    return {"ok": True}


@api_router.delete("/submissions")
async def clear_submissions(
    form_name: Optional[str] = None,
    project_id: Optional[str] = None,
    x_dashboard_token: Optional[str] = Header(default=None),
):
    if not project_id:
        raise HTTPException(status_code=400, detail="project_id is required")
    await _require_dashboard_token(project_id, x_dashboard_token)
    query: dict = {"project_id": project_id}
    if form_name:
        query["form_name"] = form_name
    res = await db.submissions.delete_many(query)
    return {"ok": True, "deleted": res.deleted_count}


# Zenero Stack content management + funnel tracking routers. These modules
# reference `db` and `_require_dashboard_token` from this module's namespace;
# inject them so the route handlers resolve correctly.
class _LiveDbProxy:
    """Forwards every attribute access to the *current* process-global `db`.
    Modules that capture `db` at import time would otherwise hold a stale
    snapshot after _ensure_live_client() rebuilds it or a test module swaps
    server.db (test_commerce_orders.py's per-module SQLite backend)."""
    def __getattr__(self, name):
        return getattr(db, name)


from models.zenero import zenero_router
from models.funnels import funnel_router
import models.zenero as _zenero_mod
import models.funnels as _funnel_mod
_zenero_mod.db = _LiveDbProxy()
_zenero_mod._require_dashboard_token = _require_dashboard_token
_funnel_mod.db = _LiveDbProxy()
_funnel_mod._require_dashboard_token = _require_dashboard_token

# Phase 1 builder auth + Phase 2 content models. Same injection pattern:
# these modules see this file's live `db` singleton (which _ensure_live_client
# may replace) and the shared permission helpers.
from models import builder_auth as _auth_mod
from models.content import content_router as _content_router
_auth_mod.db = _LiveDbProxy()
_auth_mod._hash_password = _hash_password
_auth_mod._verify_password = _verify_password
_auth_mod._DASHBOARD_KEY_PATH = _DASHBOARD_KEY_PATH
import models.content as _content_mod
_content_mod.db = _LiveDbProxy()
_content_mod.require_project_access = _auth_mod.require_project_access
_content_mod._require_dashboard_token = _require_dashboard_token

# Per-project customer accounts for exported static sites (distinct from the
# global builder_auth users above and from the single-shared-secret dashboard
# password) — see models/site_auth.py docstring.
from models import site_auth as _site_auth_mod
_site_auth_mod.db = _LiveDbProxy()
_site_auth_mod._hash_password = _hash_password
_site_auth_mod._verify_password = _verify_password
_site_auth_mod._DASHBOARD_KEY_PATH = _DASHBOARD_KEY_PATH

app.include_router(api_router)

# Serve uploaded block assets (gallery/bento/timeline images) statically so
# the builder canvas and published previews can render them.
ASSETS_ROOT.mkdir(parents=True, exist_ok=True)
app.mount("/assets", StaticFiles(directory=str(ASSETS_ROOT)), name="assets")
app.include_router(zenero_router)
app.include_router(funnel_router)
app.include_router(_auth_mod.builder_auth_router)
app.include_router(_content_router)
app.include_router(_site_auth_mod.site_auth_router)


# ---------- Social Wall: config + live feed ----------

class SocialConfigRequest(BaseModel):
    config: dict  # {platform: {token, page_id, ...}}


@api_router.post("/{project_id}/social-config")
async def save_social_config_endpoint(
    project_id: str,
    payload: SocialConfigRequest,
    x_dashboard_token: Optional[str] = Header(default=None),
):
    """Store social API tokens encrypted in project settings (never in
    exported HTML). Gated by the dashboard token."""
    await _require_dashboard_token(project_id, x_dashboard_token)
    from integrations.social import save_social_config
    await save_social_config(project_id, payload.config)
    return {"ok": True}


@api_router.get("/{project_id}/social-feed")
async def get_social_feed(project_id: str, platform: Optional[str] = None):
    """Fetch live social feed for a project. Public — the live page's
    Social Wall block fetches this. If `platform` is provided, only that
    platform's posts are returned (filtering)."""
    from integrations.social import (
        load_social_config,
        fetch_facebook_feed,
        fetch_instagram_feed,
        fetch_x_feed,
        fetch_tiktok_feed,
        fetch_linkedin_feed,
        fetch_youtube_feed,
    )

    config = await load_social_config(project_id)
    if not config:
        return {"posts": [], "connected": []}

    platforms = [platform] if platform else list(config.keys())
    connected = [p for p in platforms if config.get(p, {}).get("token")]

    posts = []
    for p in platforms:
        creds = config.get(p, {})
        token = creds.get("token", "")
        if not token:
            continue
        try:
            if p == "facebook":
                posts.extend(await fetch_facebook_feed(token, creds.get("page_id", "")))
            elif p == "instagram":
                posts.extend(await fetch_instagram_feed(token, creds.get("user_id", "")))
            elif p == "x":
                posts.extend(await fetch_x_feed(token, creds.get("user_id", "")))
            elif p == "tiktok":
                posts.extend(await fetch_tiktok_feed(token, creds.get("user_id", "")))
            elif p == "linkedin":
                posts.extend(await fetch_linkedin_feed(token, creds.get("company_id", "")))
            elif p == "youtube":
                posts.extend(await fetch_youtube_feed(token, creds.get("channel_id", "")))
        except Exception:
            # A failed platform fetch shouldn't break the whole wall.
            continue

    posts.sort(key=lambda p: p.get("timestamp", ""), reverse=True)
    return {"posts": posts, "connected": connected}


@api_router.get("/{project_id}/social-testimonials")
async def get_social_testimonials(project_id: str, platform: str = "facebook", post_id: str = ""):
    """Fetch comments from a social platform to use as testimonials.
    Public — the Testimonials block fetches this."""
    from integrations.social import load_social_config, fetch_facebook_comments

    config = await load_social_config(project_id)
    creds = config.get(platform, {})
    token = creds.get("token", "")
    if not token or not post_id:
        return {"testimonials": []}

    try:
        if platform == "facebook":
            comments = await fetch_facebook_comments(token, post_id)
        else:
            comments = []
    except Exception:
        comments = []

    return {"testimonials": comments}

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

_PUBLIC_CORS_PATHS = {
    "/api/submissions",
    "/api/commerce/checkout-session",
    "/api/commerce/paypal/verify",
}
# Path-parametered, so exact-set membership can't match it; and it is a GET,
# unlike every entry above. Widened for GET only.
_PUBLIC_CORS_GET_PREFIX = "/api/commerce/receipt/"


@app.middleware("http")
async def _public_cors_override(request: Request, call_next):
    """A handful of endpoints are, by design, called cross-origin from
    arbitrary published/exported-site domains (form submissions, cart
    checkout, PayPal capture verification, receipt lookup) rather than the
    builder's own frontend. The strict CORSMiddleware above restricts
    everything else to a fixed origin allowlist; this override widens exactly
    those paths back open, and only for the method each one actually needs (no
    credentials are ever involved, so a wildcard origin is safe here), without
    touching the strict default everything else gets — including GET/DELETE on
    /api/submissions, which return/erase stored form data and must stay
    origin-restricted. Registered after CORSMiddleware, so it wraps outermost
    and can run before CORSMiddleware sees the request (short-circuiting
    OPTIONS) and override its response headers afterward."""
    path = request.url.path
    if path in _PUBLIC_CORS_PATHS:
        allowed = ("POST", "OPTIONS")
    elif path.startswith(_PUBLIC_CORS_GET_PREFIX):
        allowed = ("GET", "OPTIONS")
    else:
        return await call_next(request)
    if request.method not in allowed:
        return await call_next(request)
    if request.method == "OPTIONS":
        return Response(
            status_code=200,
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": ", ".join(allowed),
                "Access-Control-Allow-Headers": "Content-Type, Accept",
            },
        )
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    return response

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def ensure_indexes():
    """provider_ref is the idempotency key for orders. _upsert_order's
    read-then-write is TOCTOU-prone under concurrent webhook redelivery; this
    index is what actually enforces one-order-per-payment.

    sqlite_compat's dev shim has no create_index, so the SQLite path keeps only
    the read-then-write guard — a known, accepted gap, since concurrent
    redelivery is a production (i.e. Mongo) concern."""

    # Recover a clean DB client if a previous test module's lifespan shutdown
    # closed the process-global client (pytest-xdist shares one worker process
    # across several modules via --dist loadscope). Each new lifespan therefore
    # binds its OWN fresh client to ITS OWN event loop — no inheritance of a
    # closed, loop-bound Motor client from the previous module.
    _ensure_live_client()

    if not hasattr(db.orders, "create_index"):
        return
    try:
        await db.orders.create_index("provider_ref", unique=True)
    except Exception as e:
        logger.warning(f"orders provider_ref index creation failed: {e}")


@app.on_event("startup")
async def seed_starter_templates():
    """Idempotent upsert of curated starter templates on boot."""
    try:
        from starter_templates import STARTER_TEMPLATES
    except Exception as e:
        logger.warning(f"starter_templates import failed: {e}")
        return
    for tpl in STARTER_TEMPLATES:
        try:
            await db.templates.update_one(
                {"id": tpl["id"]},
                {"$set": tpl},
                upsert=True,
            )
        except Exception as e:
            logger.warning(f"Failed to seed starter {tpl.get('id')}: {e}")


@app.on_event("shutdown")
async def shutdown_db_client():
    global _db_client_is_closed
    try:
        client.close()
    except Exception:
        pass
    # Mark the process-global client closed so the NEXT module scheduled on
    # this xdist worker rebuilds a fresh client in its own loop instead of
    # reusing this closed, loop-bound one. Made explicit rather than inferred
    # so a test file that later swaps `server.db` (e.g. the SQLite override in
    # test_commerce_orders.py) stays authoritative.
    _db_client_is_closed = True
