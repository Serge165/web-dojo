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
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ProjectCreate(BaseModel):
    name: str
    elements: List[Any] = []
    head_html: str = ""
    canvas_bg: str = "#ffffff"
    fonts: List[str] = []
    files: List[Any] = []


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    elements: Optional[List[Any]] = None
    head_html: Optional[str] = None
    canvas_bg: Optional[str] = None
    fonts: Optional[List[str]] = None
    files: Optional[List[Any]] = None


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


def _project_to_html(doc: dict) -> str:
    body = "\n".join([e.get("html", "") for e in (doc.get("elements") or [])])
    fonts_link = _build_google_fonts_link(doc.get("fonts") or [])
    head_extra = doc.get("head_html") or ""
    canvas_bg = doc.get("canvas_bg") or "#ffffff"
    name = doc.get("name") or "Untitled"
    return (
        "<!doctype html>\n<html lang=\"en\">\n<head>\n"
        "<meta charset=\"utf-8\" />\n"
        "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n"
        f"<title>{name}</title>\n"
        f"{fonts_link}\n{head_extra}\n"
        f"<style>body{{margin:0;background:{canvas_bg};}}</style>\n"
        "</head>\n<body>\n"
        f"{body}\n"
        "</body>\n</html>"
    )


@api_router.get("/preview/{project_id}", response_class=HTMLResponse)
async def preview_project(project_id: str):
    doc = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Project not found")
    return HTMLResponse(content=_project_to_html(doc))


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


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
