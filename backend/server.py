from fastapi import FastAPI, APIRouter, HTTPException
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
    if not key:
        key = Fernet.generate_key().decode()
        try:
            _KEY_PATH.write_text(key)
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


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

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
