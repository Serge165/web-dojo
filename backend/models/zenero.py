"""Zenero Stack content management data models + CRUD endpoints.

Collections (each scoped by project_id):
  - updates:       {id, title, content, timestamp}
  - gallery_items: {id, image_url, alt_text, category}
  - blog_posts:    {id, title, content_html, excerpt, keywords, hashtags,
                    featured_image, published_at}
  - portfolio_items:{id, title, description, date, category, image_url, link, sort_order}
  - timeline_entries:{id, date, title, description, sort_order}
  - bento_tiles:    {id, icon, title, description, href, sort_order}

All write endpoints are gated by the same _require_dashboard_token pattern
as the e-commerce dashboard. Read endpoints are public (the live page's
semi-static blocks fetch them at runtime).
"""
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Any

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, Field, ConfigDict

zenero_router = APIRouter(prefix="/api")


# ---------- Pydantic models ----------

class UpdateItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content: str
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class UpdateCreate(BaseModel):
    title: str
    content: str


class UpdateUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None


class GalleryItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    image_url: str
    alt_text: str = ""
    category: str = "general"


class GalleryItemCreate(BaseModel):
    image_url: str
    alt_text: str = ""
    category: str = "general"


class GalleryItemUpdate(BaseModel):
    image_url: Optional[str] = None
    alt_text: Optional[str] = None
    category: Optional[str] = None


class BlogPost(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content_html: str = ""
    excerpt: str = ""
    keywords: str = ""
    hashtags: str = ""
    featured_image: str = ""
    published_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class BlogPostCreate(BaseModel):
    title: str
    content_html: str = ""
    excerpt: str = ""
    keywords: str = ""
    hashtags: str = ""
    featured_image: str = ""


class BlogPostUpdate(BaseModel):
    title: Optional[str] = None
    content_html: Optional[str] = None
    excerpt: Optional[str] = None
    keywords: Optional[str] = None
    hashtags: Optional[str] = None
    featured_image: Optional[str] = None


class PortfolioItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str = ""
    date: str = ""
    category: str = "general"
    image_url: str = ""
    link: str = ""
    sort_order: int = 0


class PortfolioItemCreate(BaseModel):
    title: str
    description: str = ""
    date: str = ""
    category: str = "general"
    image_url: str = ""
    link: str = ""
    sort_order: int = 0


class PortfolioItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    link: Optional[str] = None
    sort_order: Optional[int] = None


class TimelineEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    date: str = ""
    title: str
    description: str = ""
    sort_order: int = 0


class TimelineEntryCreate(BaseModel):
    date: str = ""
    title: str
    description: str = ""
    sort_order: int = 0


class TimelineEntryUpdate(BaseModel):
    date: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    sort_order: Optional[int] = None


class BentoTile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    icon: str = "🚀"
    title: str
    description: str = ""
    href: str = ""
    sort_order: int = 0


class BentoTileCreate(BaseModel):
    icon: str = "🚀"
    title: str
    description: str = ""
    href: str = ""
    sort_order: int = 0


class BentoTileUpdate(BaseModel):
    icon: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    href: Optional[str] = None
    sort_order: Optional[int] = None


# ---------- Helpers ----------

def _serialize(doc: dict) -> dict:
    doc.pop("_id", None)
    for k in ("updated_at", "created_at", "published_at", "timestamp"):
        if k in doc and hasattr(doc[k], "isoformat"):
            doc[k] = doc[k].isoformat()
    return doc


def _deserialize(doc: dict) -> dict:
    for k in ("updated_at", "created_at", "published_at", "timestamp"):
        if k in doc and isinstance(doc[k], str):
            try:
                doc[k] = datetime.fromisoformat(doc[k])
            except Exception:
                pass
    return doc


# ---------- Updates CRUD ----------

@zenero_router.get("/{project_id}/updates")
async def list_updates(project_id: str, limit: int = 50):
    """Public read — the live page's Updates block fetches this."""
    cursor = db.updates.find({"project_id": project_id}, {"_id": 0}).sort("timestamp", -1)
    items = await cursor.to_list(limit)
    return {"updates": [_serialize(it) for it in items]}


@zenero_router.post("/{project_id}/updates")
async def create_update(project_id: str, payload: UpdateCreate, x_dashboard_token: Optional[str] = Header(default=None)):
    await _require_dashboard_token(project_id, x_dashboard_token)
    item = UpdateItem(**payload.model_dump())
    doc = item.model_dump()
    # Set after model_dump: UpdateItem has extra="ignore", so passing
    # project_id as a constructor kwarg would be silently dropped.
    doc["project_id"] = project_id
    doc = _serialize(doc)
    await db.updates.insert_one(doc.copy())
    return item


@zenero_router.put("/{project_id}/updates/{item_id}")
async def update_update(project_id: str, item_id: str, payload: UpdateUpdate, x_dashboard_token: Optional[str] = Header(default=None)):
    await _require_dashboard_token(project_id, x_dashboard_token)
    existing = await db.updates.find_one({"id": item_id, "project_id": project_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Update not found")
    updates = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.updates.update_one({"id": item_id, "project_id": project_id}, {"$set": updates})
    doc = await db.updates.find_one({"id": item_id, "project_id": project_id}, {"_id": 0})
    return _deserialize(doc)


@zenero_router.delete("/{project_id}/updates/{item_id}")
async def delete_update(project_id: str, item_id: str, x_dashboard_token: Optional[str] = Header(default=None)):
    await _require_dashboard_token(project_id, x_dashboard_token)
    if not await db.updates.find_one({"id": item_id, "project_id": project_id}, {"_id": 0}):
        raise HTTPException(status_code=404, detail="Update not found")
    await db.updates.delete_one({"id": item_id, "project_id": project_id})
    return {"ok": True}


# ---------- Gallery CRUD ----------

@zenero_router.get("/{project_id}/gallery_items")
async def list_gallery_items(project_id: str, limit: int = 100):
    cursor = db.gallery_items.find({"project_id": project_id}, {"_id": 0}).sort("created_at", -1)
    items = await cursor.to_list(limit)
    return {"gallery_items": [_serialize(it) for it in items]}


@zenero_router.post("/{project_id}/gallery_items")
async def create_gallery_item(project_id: str, payload: GalleryItemCreate, x_dashboard_token: Optional[str] = Header(default=None)):
    await _require_dashboard_token(project_id, x_dashboard_token)
    item = GalleryItem(**payload.model_dump())
    doc = item.model_dump()
    doc["project_id"] = project_id  # extra="ignore": must not go through ctor
    doc = _serialize(doc)
    await db.gallery_items.insert_one(doc.copy())
    return item


@zenero_router.put("/{project_id}/gallery_items/{item_id}")
async def update_gallery_item(project_id: str, item_id: str, payload: GalleryItemUpdate, x_dashboard_token: Optional[str] = Header(default=None)):
    await _require_dashboard_token(project_id, x_dashboard_token)
    existing = await db.gallery_items.find_one({"id": item_id, "project_id": project_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Gallery item not found")
    updates = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.gallery_items.update_one({"id": item_id, "project_id": project_id}, {"$set": updates})
    doc = await db.gallery_items.find_one({"id": item_id, "project_id": project_id}, {"_id": 0})
    return _deserialize(doc)


@zenero_router.delete("/{project_id}/gallery_items/{item_id}")
async def delete_gallery_item(project_id: str, item_id: str, x_dashboard_token: Optional[str] = Header(default=None)):
    await _require_dashboard_token(project_id, x_dashboard_token)
    if not await db.gallery_items.find_one({"id": item_id, "project_id": project_id}, {"_id": 0}):
        raise HTTPException(status_code=404, detail="Gallery item not found")
    await db.gallery_items.delete_one({"id": item_id, "project_id": project_id})
    return {"ok": True}


# ---------- Blog CRUD ----------

@zenero_router.get("/{project_id}/blog_posts")
async def list_blog_posts(project_id: str, limit: int = 50):
    cursor = db.blog_posts.find({"project_id": project_id}, {"_id": 0}).sort("published_at", -1)
    items = await cursor.to_list(limit)
    return {"blog_posts": [_serialize(it) for it in items]}


@zenero_router.post("/{project_id}/blog_posts")
async def create_blog_post(project_id: str, payload: BlogPostCreate, x_dashboard_token: Optional[str] = Header(default=None)):
    await _require_dashboard_token(project_id, x_dashboard_token)
    # Auto-generate excerpt from content_html if not provided (first 150 chars)
    data = payload.model_dump()
    if not data.get("excerpt") and data.get("content_html"):
        import re
        text = re.sub(r"<[^>]+>", "", data["content_html"]).strip()
        data["excerpt"] = text[:150] + ("..." if len(text) > 150 else "")
    item = BlogPost(**data)
    doc = item.model_dump()
    doc["project_id"] = project_id  # extra="ignore": must not go through ctor
    doc = _serialize(doc)
    await db.blog_posts.insert_one(doc.copy())
    return item


@zenero_router.put("/{project_id}/blog_posts/{item_id}")
async def update_blog_post(project_id: str, item_id: str, payload: BlogPostUpdate, x_dashboard_token: Optional[str] = Header(default=None)):
    await _require_dashboard_token(project_id, x_dashboard_token)
    existing = await db.blog_posts.find_one({"id": item_id, "project_id": project_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Blog post not found")
    updates = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.blog_posts.update_one({"id": item_id, "project_id": project_id}, {"$set": updates})
    doc = await db.blog_posts.find_one({"id": item_id, "project_id": project_id}, {"_id": 0})
    return _deserialize(doc)


@zenero_router.delete("/{project_id}/blog_posts/{item_id}")
async def delete_blog_post(project_id: str, item_id: str, x_dashboard_token: Optional[str] = Header(default=None)):
    await _require_dashboard_token(project_id, x_dashboard_token)
    if not await db.blog_posts.find_one({"id": item_id, "project_id": project_id}, {"_id": 0}):
        raise HTTPException(status_code=404, detail="Blog post not found")
    await db.blog_posts.delete_one({"id": item_id, "project_id": project_id})
    return {"ok": True}


# ---------- Portfolio CRUD ----------

@zenero_router.get("/{project_id}/portfolio_items")
async def list_portfolio_items(project_id: str, limit: int = 100):
    """Public read — the live page's Portfolio block fetches this.
    Sorted by date (chronological) per the spec; the dashboard's
    drag-to-reorder updates sort_order which takes precedence."""
    cursor = db.portfolio_items.find({"project_id": project_id}, {"_id": 0})
    items = await cursor.to_list(limit)
    items = [_serialize(it) for it in items]
    items.sort(key=lambda it: (it.get("sort_order", 0), it.get("date", "")))
    return {"portfolio_items": items}


@zenero_router.post("/{project_id}/portfolio_items")
async def create_portfolio_item(project_id: str, payload: PortfolioItemCreate, x_dashboard_token: Optional[str] = Header(default=None)):
    await _require_dashboard_token(project_id, x_dashboard_token)
    item = PortfolioItem(**payload.model_dump())
    doc = item.model_dump()
    doc["project_id"] = project_id  # extra="ignore": must not go through ctor
    doc = _serialize(doc)
    await db.portfolio_items.insert_one(doc.copy())
    return item


@zenero_router.put("/{project_id}/portfolio_items/{item_id}")
async def update_portfolio_item(project_id: str, item_id: str, payload: PortfolioItemUpdate, x_dashboard_token: Optional[str] = Header(default=None)):
    await _require_dashboard_token(project_id, x_dashboard_token)
    existing = await db.portfolio_items.find_one({"id": item_id, "project_id": project_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Portfolio item not found")
    updates = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.portfolio_items.update_one({"id": item_id, "project_id": project_id}, {"$set": updates})
    doc = await db.portfolio_items.find_one({"id": item_id, "project_id": project_id}, {"_id": 0})
    return _deserialize(doc)


@zenero_router.delete("/{project_id}/portfolio_items/{item_id}")
async def delete_portfolio_item(project_id: str, item_id: str, x_dashboard_token: Optional[str] = Header(default=None)):
    await _require_dashboard_token(project_id, x_dashboard_token)
    if not await db.portfolio_items.find_one({"id": item_id, "project_id": project_id}, {"_id": 0}):
        raise HTTPException(status_code=404, detail="Portfolio item not found")
    await db.portfolio_items.delete_one({"id": item_id, "project_id": project_id})
    return {"ok": True}


# ---------- Timeline CRUD ----------

@zenero_router.get("/{project_id}/timeline_entries")
async def list_timeline_entries(project_id: str, limit: int = 100):
    """Public read — the live page's Timeline block fetches this."""
    cursor = db.timeline_entries.find({"project_id": project_id}, {"_id": 0})
    items = await cursor.to_list(limit)
    items = [_serialize(it) for it in items]
    items.sort(key=lambda it: (it.get("sort_order", 0), it.get("date", "")))
    return {"timeline_entries": items}


@zenero_router.post("/{project_id}/timeline_entries")
async def create_timeline_entry(project_id: str, payload: TimelineEntryCreate, x_dashboard_token: Optional[str] = Header(default=None)):
    await _require_dashboard_token(project_id, x_dashboard_token)
    item = TimelineEntry(**payload.model_dump())
    doc = item.model_dump()
    doc["project_id"] = project_id  # extra="ignore": must not go through ctor
    doc = _serialize(doc)
    await db.timeline_entries.insert_one(doc.copy())
    return item


@zenero_router.put("/{project_id}/timeline_entries/{item_id}")
async def update_timeline_entry(project_id: str, item_id: str, payload: TimelineEntryUpdate, x_dashboard_token: Optional[str] = Header(default=None)):
    await _require_dashboard_token(project_id, x_dashboard_token)
    existing = await db.timeline_entries.find_one({"id": item_id, "project_id": project_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Timeline entry not found")
    updates = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.timeline_entries.update_one({"id": item_id, "project_id": project_id}, {"$set": updates})
    doc = await db.timeline_entries.find_one({"id": item_id, "project_id": project_id}, {"_id": 0})
    return _deserialize(doc)


@zenero_router.delete("/{project_id}/timeline_entries/{item_id}")
async def delete_timeline_entry(project_id: str, item_id: str, x_dashboard_token: Optional[str] = Header(default=None)):
    await _require_dashboard_token(project_id, x_dashboard_token)
    if not await db.timeline_entries.find_one({"id": item_id, "project_id": project_id}, {"_id": 0}):
        raise HTTPException(status_code=404, detail="Timeline entry not found")
    await db.timeline_entries.delete_one({"id": item_id, "project_id": project_id})
    return {"ok": True}


# ---------- Bento CRUD ----------

@zenero_router.get("/{project_id}/bento_tiles")
async def list_bento_tiles(project_id: str, limit: int = 100):
    """Public read — the live page's Features Bento block fetches this."""
    cursor = db.bento_tiles.find({"project_id": project_id}, {"_id": 0})
    items = await cursor.to_list(limit)
    items = [_serialize(it) for it in items]
    items.sort(key=lambda it: (it.get("sort_order", 0), it.get("title", "")))
    return {"bento_tiles": items}


@zenero_router.post("/{project_id}/bento_tiles")
async def create_bento_tile(project_id: str, payload: BentoTileCreate, x_dashboard_token: Optional[str] = Header(default=None)):
    await _require_dashboard_token(project_id, x_dashboard_token)
    item = BentoTile(**payload.model_dump())
    doc = item.model_dump()
    doc["project_id"] = project_id  # extra="ignore": must not go through ctor
    doc = _serialize(doc)
    await db.bento_tiles.insert_one(doc.copy())
    return item


@zenero_router.put("/{project_id}/bento_tiles/{item_id}")
async def update_bento_tile(project_id: str, item_id: str, payload: BentoTileUpdate, x_dashboard_token: Optional[str] = Header(default=None)):
    await _require_dashboard_token(project_id, x_dashboard_token)
    existing = await db.bento_tiles.find_one({"id": item_id, "project_id": project_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Bento tile not found")
    updates = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.bento_tiles.update_one({"id": item_id, "project_id": project_id}, {"$set": updates})
    doc = await db.bento_tiles.find_one({"id": item_id, "project_id": project_id}, {"_id": 0})
    return _deserialize(doc)


@zenero_router.delete("/{project_id}/bento_tiles/{item_id}")
async def delete_bento_tile(project_id: str, item_id: str, x_dashboard_token: Optional[str] = Header(default=None)):
    await _require_dashboard_token(project_id, x_dashboard_token)
    if not await db.bento_tiles.find_one({"id": item_id, "project_id": project_id}, {"_id": 0}):
        raise HTTPException(status_code=404, detail="Bento tile not found")
    await db.bento_tiles.delete_one({"id": item_id, "project_id": project_id})
    return {"ok": True}


# ---------- Reorder (drag-to-reorder persistence) ----------

class ReorderRequest(BaseModel):
    ordered_ids: List[str]


@zenero_router.post("/{project_id}/portfolio_items/reorder")
async def reorder_portfolio_items(project_id: str, payload: ReorderRequest, x_dashboard_token: Optional[str] = Header(default=None)):
    await _require_dashboard_token(project_id, x_dashboard_token)
    for idx, item_id in enumerate(payload.ordered_ids):
        await db.portfolio_items.update_one(
            {"id": item_id, "project_id": project_id},
            {"$set": {"sort_order": idx}},
        )
    return {"ok": True}


@zenero_router.post("/{project_id}/timeline_entries/reorder")
async def reorder_timeline_entries(project_id: str, payload: ReorderRequest, x_dashboard_token: Optional[str] = Header(default=None)):
    await _require_dashboard_token(project_id, x_dashboard_token)
    for idx, item_id in enumerate(payload.ordered_ids):
        await db.timeline_entries.update_one(
            {"id": item_id, "project_id": project_id},
            {"$set": {"sort_order": idx}},
        )
    return {"ok": True}


@zenero_router.post("/{project_id}/bento_tiles/reorder")
async def reorder_bento_tiles(project_id: str, payload: ReorderRequest, x_dashboard_token: Optional[str] = Header(default=None)):
    await _require_dashboard_token(project_id, x_dashboard_token)
    for idx, item_id in enumerate(payload.ordered_ids):
        await db.bento_tiles.update_one(
            {"id": item_id, "project_id": project_id},
            {"$set": {"sort_order": idx}},
        )
    return {"ok": True}