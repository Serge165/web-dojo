"""Generic user-defined content collections (Phase 9B).

Extends the Zenero stack: where zenero.py hardcodes nine typed collections
per project, this module lets a project define its OWN collections (name,
label, field schema) and fill them with items — the base for dashboard
field-binding and export-time template expansion.

Conventions mirror zenero.py exactly:
  - `db` and `_require_dashboard_token` are injected by server.py at import
    time (module-level indirection keeps the module importable standalone).
  - Writes are gated by the project dashboard token; reads are public so the
    live page's runtime blocks can fetch them.
  - Only equality-filtered find() calls — the SQLite compat shim constraint.
  - Two collections: `collection_defs` (schemas) and `collection_items`
    (rows; `data` holds the user-defined field values).

Export-time template tokens (see expand_collection_tokens):
  {%name.field%}   -> the NEWEST item's field value, or "" if none
  {%name.count%}   -> number of items in that collection
"""

import re
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, Field, ConfigDict

collections_router = APIRouter(prefix="/api")

db = None                        # server.py injects _LiveDbProxy()
_require_dashboard_token = None  # server.py injects

ALLOWED_FIELD_TYPES = {"text", "textarea", "number", "image", "url", "date", "boolean"}
_TOKEN_RE = re.compile(r"\{%\s*([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_]+)\s*%\}")


# ---------- Pydantic models ----------

class FieldDef(BaseModel):
    model_config = ConfigDict(extra="ignore")
    key: str
    label: str = ""
    type: str = "text"  # one of ALLOWED_FIELD_TYPES


class CollectionDef(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # url/token slug, e.g. "menu_items"
    label: str = ""
    fields: List[FieldDef] = Field(default_factory=list)


class CollectionDefCreate(BaseModel):
    name: str
    label: str = ""
    fields: List[FieldDef] = Field(default_factory=list)


class CollectionDefUpdate(BaseModel):
    label: Optional[str] = None
    fields: Optional[List[FieldDef]] = None


class CollectionItemCreate(BaseModel):
    data: Dict[str, object] = Field(default_factory=dict)
    sort_order: int = 0


class CollectionItemUpdate(BaseModel):
    data: Optional[Dict[str, object]] = None
    sort_order: Optional[int] = None

# ---------- Helpers ----------

def _serialize(doc: dict) -> dict:
    doc.pop("_id", None)
    for k in ("created_at", "updated_at"):
        if k in doc and hasattr(doc[k], "isoformat"):
            doc[k] = doc[k].isoformat()
    return doc


def _slug_ok(name: str) -> bool:
    return bool(re.fullmatch(r"[a-z][a-z0-9_-]{0,39}", name or ""))


async def _get_def(project_id: str, def_id: str) -> dict:
    doc = await db.collection_defs.find_one(
        {"id": def_id, "project_id": project_id}, {"_id": 0}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Collection not found")
    return doc


# ---------- Collection definition CRUD ----------

@collections_router.post("/{project_id}/collections")
async def create_collection(project_id: str, payload: CollectionDefCreate, x_dashboard_token: Optional[str] = Header(default=None)):
    await _require_dashboard_token(project_id, x_dashboard_token)
    if not _slug_ok(payload.name):
        raise HTTPException(status_code=400, detail="name must be a lowercase slug (a-z, 0-9, -, _) starting with a letter")
    if await db.collection_defs.find_one({"project_id": project_id, "name": payload.name}, {"_id": 0}):
        raise HTTPException(status_code=409, detail=f"Collection '{payload.name}' already exists")
    for f in payload.fields:
        if f.type not in ALLOWED_FIELD_TYPES:
            raise HTTPException(status_code=400, detail=f"field type must be one of: {', '.join(sorted(ALLOWED_FIELD_TYPES))}")
    doc = CollectionDef(**payload.model_dump()).model_dump()
    doc["project_id"] = project_id
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.collection_defs.insert_one(doc.copy())
    return _serialize(doc)


@collections_router.get("/{project_id}/collections")
async def list_collections(project_id: str):
    """Public read — builder UI and live-page runtime both need the schemas."""
    cursor = db.collection_defs.find({"project_id": project_id}, {"_id": 0})
    items = await cursor.to_list(200)
    return {"collections": [_serialize(it) for it in items]}


@collections_router.put("/{project_id}/collections/{def_id}")
async def update_collection(project_id: str, def_id: str, payload: CollectionDefUpdate, x_dashboard_token: Optional[str] = Header(default=None)):
    await _require_dashboard_token(project_id, x_dashboard_token)
    await _get_def(project_id, def_id)
    updates = payload.model_dump(exclude_none=True)
    if "fields" in updates:
        for f in updates["fields"]:
            if f.get("type") not in ALLOWED_FIELD_TYPES:
                raise HTTPException(status_code=400, detail=f"field type must be one of: {', '.join(sorted(ALLOWED_FIELD_TYPES))}")
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.collection_defs.update_one({"id": def_id, "project_id": project_id}, {"$set": updates})
    return _serialize(await db.collection_defs.find_one({"id": def_id, "project_id": project_id}, {"_id": 0}))


@collections_router.delete("/{project_id}/collections/{def_id}")
async def delete_collection(project_id: str, def_id: str, x_dashboard_token: Optional[str] = Header(default=None)):
    await _require_dashboard_token(project_id, x_dashboard_token)
    await _get_def(project_id, def_id)
    await db.collection_defs.delete_one({"id": def_id, "project_id": project_id})
    # Cascade: items are meaningless without their schema.
    await db.collection_items.delete_many({"collection_id": def_id, "project_id": project_id})
    return {"ok": True}

# ---------- Collection item CRUD ----------

@collections_router.get("/{project_id}/collections/{def_id}/items")
async def list_collection_items(project_id: str, def_id: str, limit: int = 100):
    """Public read — the live page's runtime blocks fetch these."""
    await _get_def(project_id, def_id)
    cursor = db.collection_items.find(
        {"collection_id": def_id, "project_id": project_id}, {"_id": 0}
    ).sort("created_at", -1)
    items = await cursor.to_list(limit)
    return {"items": [_serialize(it) for it in items]}


@collections_router.post("/{project_id}/collections/{def_id}/items")
async def create_collection_item(project_id: str, def_id: str, payload: CollectionItemCreate, x_dashboard_token: Optional[str] = Header(default=None)):
    await _require_dashboard_token(project_id, x_dashboard_token)
    await _get_def(project_id, def_id)
    doc = {
        "id": str(uuid.uuid4()),
        "collection_id": def_id,
        "project_id": project_id,
        "data": payload.data,
        "sort_order": payload.sort_order,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.collection_items.insert_one(doc.copy())
    return _serialize(doc)


@collections_router.put("/{project_id}/collections/{def_id}/items/{item_id}")
async def update_collection_item(project_id: str, def_id: str, item_id: str, payload: CollectionItemUpdate, x_dashboard_token: Optional[str] = Header(default=None)):
    await _require_dashboard_token(project_id, x_dashboard_token)
    await _get_def(project_id, def_id)
    existing = await db.collection_items.find_one(
        {"id": item_id, "collection_id": def_id, "project_id": project_id}, {"_id": 0}
    )
    if not existing:
        raise HTTPException(status_code=404, detail="Item not found")
    updates = payload.model_dump(exclude_none=True)
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.collection_items.update_one({"id": item_id, "project_id": project_id}, {"$set": updates})
    return _serialize(await db.collection_items.find_one({"id": item_id, "project_id": project_id}, {"_id": 0}))


@collections_router.delete("/{project_id}/collections/{def_id}/items/{item_id}")
async def delete_collection_item(project_id: str, def_id: str, item_id: str, x_dashboard_token: Optional[str] = Header(default=None)):
    await _require_dashboard_token(project_id, x_dashboard_token)
    await _get_def(project_id, def_id)
    if not await db.collection_items.find_one({"id": item_id, "collection_id": def_id, "project_id": project_id}, {"_id": 0}):
        raise HTTPException(status_code=404, detail="Item not found")
    await db.collection_items.delete_one({"id": item_id, "project_id": project_id})
    return {"ok": True}


# ---------- Export-time template expansion ----------

def _stringify(v) -> str:
    if v is None:
        return ""
    if isinstance(v, bool):
        return "true" if v else "false"
    return str(v)


async def expand_collection_tokens(project_id: str, html: str) -> str:
    """Replace {%name.field%} / {%name.count%} tokens in exported HTML.

    `field` resolves to the NEWEST item's value for that field (single-value
    binding, the pragmatic first slice of the spec's {%table.field%}
    syntax — list/repeat binding is deferred, see the Phase 9 handoff).
    Unknown collections/fields expand to "" rather than failing a publish.
    """
    if not html or "{%" not in html:
        return html
    cache: Dict[str, object] = {}

    async def resolve(name: str, key: str):
        ck = f"{name}.{key}"
        if ck in cache:
            return cache[ck]
        defs = await db.collection_defs.find_one(
            {"name": name, "project_id": project_id}, {"_id": 0}
        )
        if not defs:
            out = ""
        elif key == "count":
            out = _stringify(await db.collection_items.count_documents(
                {"collection_id": defs["id"], "project_id": project_id}
            ))
        else:
            item = await db.collection_items.find_one(
                {"collection_id": defs["id"], "project_id": project_id}, {"_id": 0}
            )
            out = _stringify((item or {}).get("data", {}).get(key, ""))
        cache[ck] = out
        return out

    out = html
    for m in list(_TOKEN_RE.finditer(html)):
        try:
            val = await resolve(m.group(1), m.group(2))
        except Exception:
            val = ""
        out = out.replace(m.group(0), val)
    return out

