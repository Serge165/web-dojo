from fastapi import FastAPI, APIRouter, HTTPException, Request, Response
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
import ipaddress
import socket
from urllib.parse import urlsplit, urljoin


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

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
    canvas_bg: str = "#ffffff"
    fonts: List[str] = Field(default_factory=list)
    files: List[Any] = Field(default_factory=list)
    # Multi-page + template system
    pages: List[Any] = Field(default_factory=list)
    active_page_id: Optional[str] = None
    template: Optional[Any] = None  # { header_html, footer_html, use_template }
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ProjectCreate(BaseModel):
    name: str
    elements: List[Any] = []
    head_html: str = ""
    canvas_bg: str = "#ffffff"
    fonts: List[str] = []
    files: List[Any] = []
    pages: List[Any] = []
    active_page_id: Optional[str] = None
    template: Optional[Any] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    elements: Optional[List[Any]] = None
    head_html: Optional[str] = None
    canvas_bg: Optional[str] = None
    fonts: Optional[List[str]] = None
    files: Optional[List[Any]] = None
    pages: Optional[List[Any]] = None
    active_page_id: Optional[str] = None
    template: Optional[Any] = None


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
    css_filename: str = "styles.css"
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
    css_filename: str = "styles.css"
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
    css_filename: str = "styles.css"
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
    doc = await db.projects.find_one({"id": project_id}, {"_id": 0})
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
    doc = await db.projects.find_one({"id": project_id}, {"_id": 0})
    doc = _deserialize(doc)
    return Project(**doc)


@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str):
    res = await db.projects.delete_one({"id": project_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"ok": True}


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
    if not seo:
        return ""
    parts = []
    def esc(v: str) -> str:
        return str(v).replace('"', "&quot;").replace("<", "&lt;")
    if seo.get("description"): parts.append(f'<meta name="description" content="{esc(seo["description"])}" />')
    if seo.get("keywords"): parts.append(f'<meta name="keywords" content="{esc(seo["keywords"])}" />')
    if seo.get("canonical"): parts.append(f'<link rel="canonical" href="{esc(seo["canonical"])}" />')
    if seo.get("favicon"): parts.append(f'<link rel="icon" href="{esc(seo["favicon"])}" />')
    if seo.get("og_title"): parts.append(f'<meta property="og:title" content="{esc(seo["og_title"])}" />')
    if seo.get("og_description"): parts.append(f'<meta property="og:description" content="{esc(seo["og_description"])}" />')
    if seo.get("og_image"): parts.append(f'<meta property="og:image" content="{esc(seo["og_image"])}" />')
    if seo.get("twitter_card"): parts.append(f'<meta name="twitter:card" content="{esc(seo["twitter_card"])}" />')
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
        "seo": {},
    }


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
    seo = p.get("seo") or {}
    seo_head = _seo_head(seo)
    title = seo.get("title") or p.get("name") or doc.get("name") or "Untitled"
    return (
        "<!doctype html>\n<html lang=\"en\">\n<head>\n"
        "<meta charset=\"utf-8\" />\n"
        "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n"
        f"<title>{title}</title>\n"
        f"{fonts_link}\n{seo_head}\n{head_extra}\n"
        f"<style>body{{margin:0;background:{canvas_bg};}}</style>\n"
        "</head>\n<body>\n"
        f"{body}\n"
        "</body>\n</html>"
    )


@api_router.get("/preview/{project_id}", response_class=HTMLResponse)
async def preview_project(project_id: str, page_id: Optional[str] = None):
    doc = await db.projects.find_one({"id": project_id}, {"_id": 0})
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
    css_filename: str = "styles.css"


def _strip_inline_styles(body_html: str):
    """Extract inline style attributes into deduplicated CSS classes.
    Returns (html_with_classes, css_string)."""
    rules = []
    counter = {"n": 0}

    def repl(match):
        i = counter["n"]
        counter["n"] += 1
        cls = f"el-{i}"
        rules.append(f".{cls} {{ {match.group(1)} }}")
        return f'class="{cls}"'

    transformed = re.sub(r'style="([^"]*)"', repl, body_html)
    return transformed, "\n".join(rules)


def _build_project_bundle(doc: dict, html_filename: str, css_filename: str):
    """Return (index_html, styles_css) using the doc's data."""
    body = "\n".join([e.get("html", "") for e in (doc.get("elements") or [])])
    cleaned_body, css_body = _strip_inline_styles(body)
    fonts_link = _build_google_fonts_link(doc.get("fonts") or [])
    head_extra = doc.get("head_html") or ""
    canvas_bg = doc.get("canvas_bg") or "#ffffff"
    name = doc.get("name") or "Untitled"
    styles = f"body{{margin:0;background:{canvas_bg};}}\n" + css_body
    html = (
        "<!doctype html>\n<html lang=\"en\">\n<head>\n"
        "<meta charset=\"utf-8\" />\n"
        "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n"
        f"<title>{name}</title>\n"
        f"{fonts_link}\n{head_extra}\n"
        f'<link rel="stylesheet" href="{css_filename}" />\n'
        "</head>\n<body>\n"
        f"{cleaned_body}\n"
        "</body>\n</html>"
    )
    return html, styles


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
    doc = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Project not found")

    protocol = (payload.protocol or "ftp").lower()
    if protocol not in {"ftp", "ftps", "sftp"}:
        raise HTTPException(status_code=400, detail="protocol must be one of: ftp, ftps, sftp")
    if not payload.host or not payload.username:
        raise HTTPException(status_code=400, detail="host and username are required")

    html_name = payload.html_filename or "index.html"
    css_name = payload.css_filename or "styles.css"
    for fname in (html_name, css_name):
        if "/" in fname or "\\" in fname or fname.startswith("."):
            raise HTTPException(status_code=400, detail="Filenames must be a plain name with no path separators")
    index_html, styles_css = _build_project_bundle(doc, html_name, css_name)
    files = {html_name: index_html, css_name: styles_css}

    if payload.include_zip:
        try:
            import zipfile
            buf = io.BytesIO()
            with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
                zf.writestr(html_name, index_html)
                zf.writestr(css_name, styles_css)
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
    origin_url: Optional[str] = None
    success_url: Optional[str] = None
    cancel_url: Optional[str] = None


def _create_checkout_session(items, success_url, cancel_url):
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
    success_url = payload.success_url or (f"{origin}/?wd_checkout=success" if origin else "https://example.com/?wd_checkout=success")
    cancel_url = payload.cancel_url or (f"{origin}/?wd_checkout=cancel" if origin else "https://example.com/?wd_checkout=cancel")
    try:
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, _create_checkout_session, payload.items, success_url, cancel_url)
    except Exception as e:
        detail = getattr(e, "user_message", None) or f"{type(e).__name__}: {e}"
        raise HTTPException(status_code=502, detail=f"Stripe checkout failed: {detail}")


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


@api_router.post("/import/url")
async def import_url(payload: UrlImport):
    """Fetch a public page's HTML so the builder can import its sections.

    Every hop (initial URL and each redirect) is resolved and validated by
    _validate_import_url, and the actual connection is pinned to that
    validated IP (Host header + SNI set to the original hostname so
    name-based routing and TLS still work) so the HTTP client's own,
    separate DNS resolution can never be swapped to a private address
    between our check and the real connection. current_url always carries
    the real hostname (never the pinned IP) so that relative redirect
    targets resolve against the correct base on every hop."""
    url = (payload.url or "").strip()
    try:
        current_url = url
        async with httpx.AsyncClient(follow_redirects=False, timeout=15.0, headers={"User-Agent": "Mozilla/5.0 (WebDojo importer)"}) as client:
            for _ in range(5):
                pinned_url, host = _validate_import_url(current_url)
                r = await client.get(
                    pinned_url,
                    headers={"Host": host},
                    extensions={"sni_hostname": host},
                )
                if r.status_code in (301, 302, 303, 307, 308) and "location" in r.headers:
                    current_url = urljoin(current_url, r.headers["location"])
                    continue
                return {"html": r.text[:2_000_000], "status": r.status_code}
        raise HTTPException(status_code=502, detail="Too many redirects")
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


async def _extract_submission(request: Request) -> Submission:
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
