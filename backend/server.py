from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Header
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
from datetime import datetime, timezone
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


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

if os.environ.get("DB_BACKEND") == "sqlite":
    from sqlite_compat import SqliteClient
    client = SqliteClient(os.environ["SQLITE_PATH"])
    db = client[os.environ.get("DB_NAME", "webdojo")]
else:
    mongo_url = os.environ['MONGO_URL']
    client = AsyncIOMotorClient(mongo_url)
    db = client[os.environ['DB_NAME']]

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
    # Multi-page + template system
    pages: List[Any] = Field(default_factory=list)
    active_page_id: Optional[str] = None
    template: Optional[Any] = None  # { header_html, footer_html, use_template }
    analytics: Optional[Any] = None  # { ga4, fathom, plausible_domain, hotjar, fb_pixel }
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
    dashboard_password_hash: Optional[str] = None
    paypal_secret_enc: Optional[str] = None
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
    dashboard_password_hash: Optional[str] = None
    paypal_secret_enc: Optional[str] = None
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
    base = os.environ.get("WEBDOJO_SECRET_KEY", "webdojo-dev-secret").encode("utf-8")
    return hashlib.sha256(base + b":dashboard-token").digest()


def _issue_dashboard_token(project_id: str, ttl_seconds: int = 604800) -> str:
    expiry = int(time.time()) + ttl_seconds
    payload = f"{project_id}:{expiry}".encode("utf-8")
    sig = hmac.new(_dashboard_token_secret(), payload, hashlib.sha256).hexdigest()
    raw = f"{project_id}:{expiry}:{sig}".encode("utf-8")
    return base64.urlsafe_b64encode(raw).decode("ascii")


def _verify_dashboard_token(token: str, project_id: str) -> bool:
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
    payload = f"{tok_project_id}:{expiry}".encode("utf-8")
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


# ---------- Routes ----------

@api_router.get("/")
async def root():
    return {"message": "WYSIWYG Builder API"}


@api_router.post("/projects", response_model=Project)
async def create_project(payload: ProjectCreate):
    project = Project(**payload.model_dump())
    doc = project.model_dump()
    doc = _serialize(doc)
    await db.projects.insert_one(doc.copy())
    return project


@api_router.get("/projects", response_model=List[ProjectSummary])
async def list_projects():
    cursor = db.projects.find({}, {"_id": 0, "id": 1, "name": 1, "updated_at": 1}).sort("updated_at", -1)
    items = await cursor.to_list(500)
    result = []
    for it in items:
        it = _deserialize(it)
        result.append(ProjectSummary(**it))
    return result


@api_router.get("/projects/{project_id}", response_model=Project)
async def get_project(project_id: str):
    doc = await db.projects.find_one(
        {"id": project_id},
        {"_id": 0, "dashboard_password_hash": 0, "paypal_secret_enc": 0},
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Project not found")
    doc = _deserialize(doc)
    return Project(**doc)


@api_router.put("/projects/{project_id}", response_model=Project)
async def update_project(project_id: str, payload: ProjectUpdate):
    existing = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found")

    updates = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()

    await db.projects.update_one({"id": project_id}, {"$set": updates})
    doc = await db.projects.find_one(
        {"id": project_id},
        {"_id": 0, "dashboard_password_hash": 0, "paypal_secret_enc": 0},
    )
    doc = _deserialize(doc)
    return Project(**doc)


@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str):
    res = await db.projects.delete_one({"id": project_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"ok": True}


class DashboardPasswordRequest(BaseModel):
    password: str


@api_router.post("/dashboard/{project_id}/set-password")
async def set_dashboard_password(project_id: str, payload: DashboardPasswordRequest):
    if not payload.password or len(payload.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    existing = await db.projects.find_one({"id": project_id}, {"_id": 0, "id": 1})
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found")
    await db.projects.update_one(
        {"id": project_id},
        {"$set": {"dashboard_password_hash": _hash_password(payload.password)}},
    )
    return {"ok": True}


@api_router.post("/dashboard/{project_id}/unlock")
async def unlock_dashboard(project_id: str, payload: DashboardPasswordRequest):
    project = await db.projects.find_one({"id": project_id})
    if not project or not project.get("dashboard_password_hash"):
        raise HTTPException(status_code=401, detail="Dashboard password not set for this project")
    if not _verify_password(payload.password, project["dashboard_password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect password")
    return {"token": _issue_dashboard_token(project_id)}


async def _require_dashboard_token(project_id: str, x_dashboard_token: Optional[str] = Header(default=None)) -> None:
    if not x_dashboard_token or not _verify_dashboard_token(x_dashboard_token, project_id):
        raise HTTPException(status_code=401, detail="Missing or invalid dashboard token")


@api_router.get("/dashboard/{project_id}/orders")
async def list_orders(project_id: str, page: int = 1, page_size: int = 20, x_dashboard_token: Optional[str] = Header(default=None)):
    await _require_dashboard_token(project_id, x_dashboard_token)
    skip = max(page - 1, 0) * page_size
    cursor = db.orders.find({"project_id": project_id}, {"_id": 0}).sort("created_at", -1)
    all_orders = await cursor.to_list(length=skip + page_size)
    orders = all_orders[skip:skip + page_size]
    total = await db.orders.count_documents({"project_id": project_id})
    return {"orders": orders, "total": total, "page": page, "page_size": page_size}


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
    body_parts = [e.get("html", "") for e in (p.get("elements") or [])]
    body = "\n".join([header] + body_parts + [footer])
    fonts_link = _build_google_fonts_link(p.get("fonts") or doc.get("fonts") or [])
    head_extra = p.get("head_html") or doc.get("head_html") or ""
    canvas_bg = p.get("canvas_bg") or doc.get("canvas_bg") or "#ffffff"
    custom_js = p.get("custom_js") or doc.get("custom_js") or ""
    custom_js_tag = f"<script>{_esc_raw_script(custom_js)}</script>\n" if custom_js.strip() else ""
    seo = p.get("seo") or {}
    seo_head = _seo_head(seo)
    title = seo.get("title") or p.get("name") or doc.get("name") or "Untitled"
    return (
        "<!doctype html>\n<html lang=\"en\">\n<head>\n"
        "<meta charset=\"utf-8\" />\n"
        "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n"
        f"<title>{title}</title>\n"
        f"<script>window.__WD_PROJECT_ID={json.dumps(doc.get('id') or '')};</script>\n"
        f"{RESPONSIVE_CSS}\n"
        f"{fonts_link}\n{seo_head}\n{head_extra}\n"
        f"<style>body{{margin:0;background:{canvas_bg};}}</style>\n"
        "</head>\n<body>\n"
        f"{body}\n"
        f"{custom_js_tag}"
        "</body>\n</html>"
    )


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
async def project_analytics(project_id: str):
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


def _strip_inline_styles(elements, prefix=""):
    """Extract inline style attributes into deduplicated CSS classes, one
    class per style="..." occurrence (mirrors frontend/src/lib/exportHtml.js's
    stripInlineStyles — keep both in sync). `prefix` (e.g. "about-") is only
    for multi-page exports sharing one stylesheet — each page's classes
    would otherwise collide by name despite the counter being page-local
    either way. Classes are named semantically
    from the owning tag name plus a running counter scoped to the whole
    export (not per-element/per-parent): the first <section> anywhere
    becomes .section-1, the second .section-2, the first <h2> becomes
    .h2-1, etc., in document/encounter order.
    Returns (html_with_classes, css_string)."""
    # component_rules and media_rules are tracked separately (both tiers,
    # matching RESPONSIVE_CSS's tablet/mobile breakpoints) so callers that
    # route CSS into labeled globals.css sections (_build_multi_page_bundle)
    # can place each in the right one.
    component_rules = []
    media_rules = []
    out_html_parts = []
    tag_counters = {}

    def repl(match):
        tag = _tag_name_at(match.string, match.start())
        tag_counters[tag] = tag_counters.get(tag, 0) + 1
        cls = f"{prefix}{tag}-{tag_counters[tag]}"
        declarations = match.group(1)
        component_rules.append(f".{cls} {{ {declarations} }}")
        if "grid-template-columns" in declarations:
            media_rules.append(f"@media (max-width: 1024px) {{ .{cls} {{ grid-template-columns: 1fr !important; }} }}")
            media_rules.append(f"@media (max-width: 767px) {{ .{cls} {{ grid-template-columns: 1fr !important; }} }}")
        return f'class="{cls}"'

    for el in elements:
        html = el.get("html", "")
        out_html_parts.append(re.sub(r'style="([^"]*)"', repl, html))

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


def _build_organized_stylesheet(theme_vars, base, component_css, animations, media_queries) -> str:
    """Assembles one clearly labeled globals.css. Section order: Theme
    Variables, Base, Components, Animations, Media Queries — matches the
    order a page actually applies them in. Mirrors frontend/src/lib/
    exportHtml.js's buildOrganizedStylesheet — keep both in sync."""
    sections = [
        ("Theme Variables", _merge_root_blocks(theme_vars)),
        ("Base", "\n".join(_dedupe(base))),
        ("Components", component_css or ""),
        ("Animations", "\n\n".join(_dedupe(animations))),
        ("Media Queries", "\n".join([RESPONSIVE_CSS_BODY, *_dedupe(media_queries)])),
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
    component_css_parts = []
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
        custom_js = page.get("custom_js") or ""
        custom_js_tag = f"<script>{_esc_raw_script(custom_js)}</script>\n" if custom_js.strip() else ""
        html = (
            "<!doctype html>\n<html lang=\"en\">\n<head>\n"
            "<meta charset=\"utf-8\" />\n"
            "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n"
            f"<title>{_esc_text(title)}</title>\n"
            f"<script>window.__WD_PROJECT_ID={json.dumps(doc.get('id') or '')};</script>\n"
            f"{_seo_head(seo)}\n{_build_json_ld(page.get('name') or doc.get('name'), seo)}\n"
            f"{fonts_link}\n{remaining_head}\n"
            f'<link rel="stylesheet" href="{css_filename}" />\n'
            f"<style>body{{margin:0;background:{canvas_bg};}}</style>\n"
            "</head>\n<body>\n"
            f"{body}\n"
            f"{custom_js_tag}"
            "</body>\n</html>"
        )
        files[filename] = html
        component_css_parts.append(component_css)
        component_css_parts.extend(forge["imported_css"])
        all_theme_vars.extend(forge["theme_vars"])
        all_base.extend(forge["base"])
        all_animations.extend(forge["animations"])
        all_media_queries.extend([r for r in media_css.split("\n") if r] + forge["media_queries"])

    files[css_filename] = _build_organized_stylesheet(
        all_theme_vars, all_base,
        "\n".join(p for p in component_css_parts if p),
        all_animations, all_media_queries,
    )
    for name, code in all_js_files.items():
        files[f"js/{name}"] = code
    return files


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
    css_name = payload.css_filename or "globals.css"
    if "/" in css_name or "\\" in css_name or css_name.startswith("."):
        raise HTTPException(status_code=400, detail="Filenames must be a plain name with no path separators")
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


async def _upsert_order(order: dict) -> None:
    # A duplicate/retried delivery must not touch the existing row's fields
    # (its "id", "created_at", etc. are freshly regenerated by the caller on
    # every invocation) — sqlite_compat's update_one only supports $set, not
    # Mongo's $setOnInsert, so skip the write outright once a row exists.
    if await db.orders.find_one({"provider_ref": order["provider_ref"]}):
        return
    await db.orders.update_one(
        {"provider_ref": order["provider_ref"]},
        {"$set": order},
        upsert=True,
    )


@api_router.post("/commerce/webhook")
async def stripe_webhook(request: Request):
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
        line_items_result = stripe.checkout.Session.list_line_items(session["id"])
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
        await _upsert_order({
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
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    return {"received": True}


class PaypalSecretRequest(BaseModel):
    project_id: str
    client_id: str
    secret: str


@api_router.post("/commerce/paypal-secret")
async def set_paypal_secret(payload: PaypalSecretRequest):
    existing = await db.projects.find_one({"id": payload.project_id}, {"_id": 0, "id": 1})
    if not existing:
        raise HTTPException(status_code=404, detail="Project not found")
    await db.projects.update_one(
        {"id": payload.project_id},
        {"$set": {
            "paypal_client_id": payload.client_id,
            "paypal_secret_enc": _encrypt(payload.secret),
        }},
    )
    return {"ok": True}


class PaypalVerifyRequest(BaseModel):
    project_id: str
    order_id: str


@api_router.post("/commerce/paypal/verify")
async def paypal_verify(payload: PaypalVerifyRequest):
    project = await db.projects.find_one({"id": payload.project_id})
    if not project or not project.get("paypal_secret_enc") or not project.get("paypal_client_id"):
        raise HTTPException(status_code=400, detail="PayPal is not configured for this project")

    secret = _decrypt(project["paypal_secret_enc"])
    access_token = await _paypal_get_access_token(project["paypal_client_id"], secret)
    order = await _paypal_get_order(payload.order_id, access_token)

    if order.get("status") != "COMPLETED":
        raise HTTPException(status_code=400, detail=f"PayPal order status is {order.get('status')}, not COMPLETED")

    unit = (order.get("purchase_units") or [{}])[0]
    amount = unit.get("amount", {})
    payer = order.get("payer", {}) or {}
    payer_name_obj = payer.get("name", {}) or {}
    payer_name = " ".join(filter(None, [payer_name_obj.get("given_name"), payer_name_obj.get("surname")])) or None

    await _upsert_order({
        "id": str(uuid.uuid4()),
        "project_id": payload.project_id,
        "provider": "paypal",
        "provider_ref": order["id"],
        "status": "completed",
        "amount_total": int(float(amount.get("value", "0")) * 100),
        "currency": amount.get("currency_code", "usd").lower(),
        "customer_email": payer.get("email_address"),
        "customer_name": payer_name,
        "shipping_address": None,
        "line_items": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"ok": True}


@api_router.get("/commerce/receipt/{provider_ref}")
async def get_receipt(provider_ref: str):
    order = await db.orders.find_one({"provider_ref": provider_ref}, {"_id": 0})
    if not order:
        return {"status": "processing"}
    return order


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


# ---------- Form Submissions Inbox ----------
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
async def list_submissions(project_id: Optional[str] = None, form_name: Optional[str] = None):
    if not project_id and not form_name:
        raise HTTPException(status_code=400, detail="project_id or form_name is required")
    query: dict = {}
    if project_id:
        query["project_id"] = project_id
    if form_name:
        query["form_name"] = form_name
    cursor = db.submissions.find(query, {"_id": 0}).sort("created_at", -1)
    items = await cursor.to_list(1000)
    return [Submission(**_deserialize(it)) for it in items]


@api_router.delete("/submissions/{submission_id}")
async def delete_submission(submission_id: str):
    res = await db.submissions.delete_one({"id": submission_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Submission not found")
    return {"ok": True}


@api_router.delete("/submissions")
async def clear_submissions(form_name: Optional[str] = None, project_id: Optional[str] = None):
    if not form_name and not project_id:
        raise HTTPException(status_code=400, detail="project_id or form_name is required")
    query: dict = {}
    if project_id:
        query["project_id"] = project_id
    if form_name:
        query["form_name"] = form_name
    res = await db.submissions.delete_many(query)
    return {"ok": True, "deleted": res.deleted_count}


app.include_router(api_router)

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

_PUBLIC_CORS_PATHS = {"/api/submissions", "/api/commerce/checkout-session"}


@app.middleware("http")
async def _public_cors_override(request: Request, call_next):
    """A handful of endpoints are, by design, called cross-origin from
    arbitrary published/exported-site domains (form submissions, cart
    checkout) rather than the builder's own frontend. The strict
    CORSMiddleware above restricts everything else to a fixed origin
    allowlist; this override widens exactly those two paths back open for
    POST/OPTIONS only (no credentials are ever involved for either, so a
    wildcard origin is safe here) without touching the strict default
    everything else gets — including GET/DELETE on /api/submissions,
    which return/erase stored form data and must stay origin-restricted.
    Registered after CORSMiddleware, so it wraps outermost and can run
    before CORSMiddleware sees the request (short-circuiting OPTIONS) and
    override its response headers afterward."""
    if request.url.path in _PUBLIC_CORS_PATHS and request.method in ("POST", "OPTIONS"):
        if request.method == "OPTIONS":
            return Response(
                status_code=200,
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Accept",
                },
            )
        response = await call_next(request)
        response.headers["Access-Control-Allow-Origin"] = "*"
        return response
    return await call_next(request)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


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
    client.close()
