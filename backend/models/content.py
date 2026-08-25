"""Phase 2 content data models: blog posts, social wall posts, portfolio
projects. Each collection is scoped by project_id.

Access model:
  - Blog/portfolio writes require builder auth (owner/editor/admin via the
    injected _require_project_access); deletes need admin rank.
  - Social-post writes are dashboard-token gated (the site owner curates the
    wall from the dashboard, per spec).
  - Public reads go through /api/preview/{project_id}/... and only ever
    expose published items.
"""
import re
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request, Query, Header
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List

content_router = APIRouter(prefix="/api")

# Injected by server.py at import time:
db = None
require_project_access = None   # builder_auth.require_project_access
_require_dashboard_token = None # server._require_dashboard_token


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", (text or "").lower()).strip("-")
    return slug[:80] or "post"


def _serialize(doc: dict) -> dict:
    doc.pop("_id", None)
    return doc


async def _unique_slug(collection, project_id: str, base: str, exclude_id: str = None) -> str:
    slug, n = base, 2
    while True:
        doc = await collection.find_one({"project_id": project_id, "slug": slug}, {"_id": 0, "id": 1})
        if not doc or doc.get("id") == exclude_id:
            return slug
        slug = f"{base}-{n}"
        n += 1


# ---------- Blog ----------

class PostCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    title: str
    content: str = ""
    excerpt: str = ""
    featured_image_url: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    draft: bool = True


class PostUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    title: Optional[str] = None
    content: Optional[str] = None
    excerpt: Optional[str] = None
    featured_image_url: Optional[str] = None
    tags: Optional[List[str]] = None
    draft: Optional[bool] = None
    slug: Optional[str] = None  # explicit slug override; collision-checked


@content_router.post("/projects/{project_id}/posts")
async def create_post(project_id: str, payload: PostCreate, request: Request):
    await require_project_access(project_id, request, need="editor")
    if not payload.title.strip():
        raise HTTPException(status_code=400, detail="Title is required")
    now = _now()
    doc = {
        "id": str(uuid.uuid4()),
        "project_id": project_id,
        "slug": await _unique_slug(db.posts, project_id, _slugify(payload.title)),
        "title": payload.title.strip(),
        "content": payload.content,
        "excerpt": payload.excerpt,
        "featured_image_url": payload.featured_image_url,
        "tags": [t.strip().lower() for t in payload.tags if t.strip()],
        "created_at": now,
        "updated_at": now,
        "published_at": None if payload.draft else now,
        "draft": bool(payload.draft),
    }
    await db.posts.insert_one(doc.copy())
    return _serialize(doc.copy())


@content_router.get("/projects/{project_id}/posts")
async def list_posts(
    project_id: str,
    request: Request,
    sort: str = Query("created_at"),
    order: str = Query("desc", pattern="^(asc|desc)$"),
    tags: Optional[str] = None,
    published_only: bool = False,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """Listing endpoint. Unpublished posts are included ONLY when the caller
    presents builder auth (any collaborator rank) or the dashboard token;
    anonymous callers always get published-only output."""
    sees_drafts = False
    dash_token = request.headers.get("x-dashboard-token")
    if (request.headers.get("authorization") or "").startswith("Bearer "):
        try:
            await require_project_access(project_id, request, need="viewer")
            sees_drafts = True
        except HTTPException as e:
            if e.status_code not in (401, 403):
                raise
    if not sees_drafts and dash_token:
        await _require_dashboard_token(project_id, dash_token)
        sees_drafts = True
    want_published = published_only or not sees_drafts
    # Shim-compatible: equality fetch on project_id, filter/sort in Python.
    items: List[dict] = []
    async for it in db.posts.find({"project_id": project_id}, {"_id": 0}):
        if want_published and it.get("draft"):
            continue
        if tags:
            wanted = {t.strip().lower() for t in tags.split(",") if t.strip()}
            if not wanted <= set(it.get("tags") or []):
                continue
        items.append(_serialize(it))
    key = sort if sort in ("created_at", "updated_at", "published_at", "title") else "created_at"
    items.sort(key=lambda p: p.get(key) or "", reverse=(order == "desc"))
    return {"posts": items[offset:offset + limit], "total": len(items), "limit": limit, "offset": offset}


@content_router.get("/preview/{project_id}/posts/{slug}")
async def get_public_post(project_id: str, slug: str):
    """Public single-post fetch for live-site rendering. Drafts 404 here."""
    doc = await db.posts.find_one({"project_id": project_id, "slug": slug}, {"_id": 0})
    if not doc or doc.get("draft"):
        raise HTTPException(status_code=404, detail="Post not found")
    return _serialize(doc)


@content_router.put("/projects/{project_id}/posts/{post_id}")
async def update_post(project_id: str, post_id: str, payload: PostUpdate, request: Request):
    await require_project_access(project_id, request, need="editor")
    existing = await db.posts.find_one({"project_id": project_id, "id": post_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Post not found")
    updates = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    if "title" in updates:
        updates["title"] = updates["title"].strip() or existing["title"]
    if "slug" in updates:
        requested = _slugify(updates.pop("slug"))
        updates["slug"] = await _unique_slug(db.posts, project_id, requested, exclude_id=post_id)
    was_draft = existing.get("draft", True)
    if "draft" in updates:
        if was_draft and not updates["draft"]:
            updates["published_at"] = _now()
        elif updates["draft"]:
            updates["published_at"] = None
    updates["updated_at"] = _now()
    await db.posts.update_one({"project_id": project_id, "id": post_id}, {"$set": updates})
    doc = await db.posts.find_one({"project_id": project_id, "id": post_id}, {"_id": 0})
    return _serialize(doc)


@content_router.delete("/projects/{project_id}/posts/{post_id}")
async def delete_post(project_id: str, post_id: str, request: Request):
    await require_project_access(project_id, request, need="admin")
    res = await db.posts.delete_many({"project_id": project_id, "id": post_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"ok": True}


# ---------- Social Wall ----------

class SocialPostCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    content: str
    author_name: str = "Admin"
    author_image_url: Optional[str] = None


class SocialPostUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    content: Optional[str] = None
    author_name: Optional[str] = None
    author_image_url: Optional[str] = None


@content_router.post("/projects/{project_id}/social-posts")
async def create_social_post(project_id: str, payload: SocialPostCreate,
                             x_dashboard_token: Optional[str] = Header(default=None)):
    """Dashboard-token gated per spec — the site owner curates posts onto the
    live wall from the dashboard, on behalf of the page admin persona."""
    await _require_dashboard_token(project_id, x_dashboard_token)
    if not payload.content.strip():
        raise HTTPException(status_code=400, detail="Content is required")
    doc = {
        "id": str(uuid.uuid4()),
        "project_id": project_id,
        "content": payload.content.strip(),
        "author_name": payload.author_name.strip() or "Admin",
        "author_image_url": payload.author_image_url,
        "likes_count": 0,
        "comments_count": 0,
        "created_at": _now(),
    }
    await db.social_posts.insert_one(doc.copy())
    return _serialize(doc.copy())


@content_router.get("/preview/{project_id}/social-posts")
async def list_public_social_posts(
    project_id: str,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    items = []
    async for it in db.social_posts.find({"project_id": project_id}, {"_id": 0}):
        items.append(_serialize(it))
    items.sort(key=lambda p: p.get("created_at") or "", reverse=True)
    return {"posts": items[offset:offset + limit], "total": len(items), "limit": limit, "offset": offset}


@content_router.put("/projects/{project_id}/social-posts/{post_id}")
async def update_social_post(project_id: str, post_id: str, payload: SocialPostUpdate,
                             x_dashboard_token: Optional[str] = Header(default=None)):
    await _require_dashboard_token(project_id, x_dashboard_token)
    updates = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    if not updates:
        raise HTTPException(status_code=400, detail="Nothing to update")
    # Existence check first: the SQLite shim's update_one returns None, so
    # there is no matched_count to inspect afterwards (Mongo parity via the
    # established find-then-update pattern).
    existing = await db.social_posts.find_one({"project_id": project_id, "id": post_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Social post not found")
    await db.social_posts.update_one(
        {"project_id": project_id, "id": post_id}, {"$set": updates})
    doc = await db.social_posts.find_one({"project_id": project_id, "id": post_id}, {"_id": 0})
    return _serialize(doc)


@content_router.delete("/projects/{project_id}/social-posts/{post_id}")
async def delete_social_post(project_id: str, post_id: str,
                             x_dashboard_token: Optional[str] = Header(default=None)):
    await _require_dashboard_token(project_id, x_dashboard_token)
    res = await db.social_posts.delete_many({"project_id": project_id, "id": post_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Social post not found")
    return {"ok": True}


@content_router.post("/projects/{project_id}/social-posts/{post_id}/like")
async def like_social_post(project_id: str, post_id: str, request: Request):
    """Public like endpoint. Spam-guarded by visitor fingerprint (IP hashed
    with the project id as salt) — one like per fingerprint, toggled off on a
    repeat call. Only an irreversible digest is stored."""
    import hashlib
    existing = await db.social_posts.find_one(
        {"project_id": project_id, "id": post_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Social post not found")
    client_ip = (request.client.host if request.client else "unknown")
    salted = hashlib.sha256(f"{project_id}:{client_ip}".encode()).hexdigest()[:24]
    liked = set(existing.get("liked_by") or [])
    if salted in liked:
        liked.discard(salted)
        delta = -1
    else:
        liked.add(salted)
        delta = 1
    new_count = max(0, (existing.get("likes_count") or 0) + delta)
    await db.social_posts.update_one(
        {"project_id": project_id, "id": post_id},
        {"$set": {"likes_count": new_count, "liked_by": sorted(liked)}})
    return {"ok": True, "likes_count": new_count, "liked": delta > 0}


# ---------- Portfolio ----------

class PortfolioItemCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    title: str
    description: str = ""
    image_url: Optional[str] = None
    category: str = "uncategorized"
    demo_url: Optional[str] = None
    github_url: Optional[str] = None


class PortfolioItemUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    title: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    category: Optional[str] = None
    demo_url: Optional[str] = None
    github_url: Optional[str] = None


def _pf_doc(payload, project_id: str) -> dict:
    return {
        "id": str(uuid.uuid4()),
        "project_id": project_id,
        "slug": _slugify(payload.title),
        "title": payload.title.strip(),
        "description": payload.description,
        "image_url": payload.image_url,
        "category": (payload.category or "uncategorized").strip().lower(),
        "demo_url": payload.demo_url,
        "github_url": payload.github_url,
        "created_at": _now(),
    }


@content_router.post("/projects/{project_id}/portfolio-projects")
async def create_portfolio_item(project_id: str, payload: PortfolioItemCreate, request: Request):
    await require_project_access(project_id, request, need="editor")
    if not payload.title.strip():
        raise HTTPException(status_code=400, detail="Title is required")
    doc = _pf_doc(payload, project_id)
    await db.portfolio_projects.insert_one(doc.copy())
    return _serialize(doc.copy())


@content_router.get("/preview/{project_id}/portfolio-projects")
async def list_public_portfolio_items(
    project_id: str,
    category: Optional[str] = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """Public listing for live-site rendering — server-side category filtering
    (the spec explicitly wants filtering done here, not via CSS :has())."""
    items = []
    async for it in db.portfolio_projects.find({"project_id": project_id}, {"_id": 0}):
        if category and it.get("category") != category.strip().lower():
            continue
        items.append(_serialize(it))
    items.sort(key=lambda p: p.get("created_at") or "", reverse=True)
    return {"projects": items[offset:offset + limit], "total": len(items), "limit": limit, "offset": offset}


@content_router.put("/projects/{project_id}/portfolio-projects/{item_id}")
async def update_portfolio_item(project_id: str, item_id: str, payload: PortfolioItemUpdate, request: Request):
    await require_project_access(project_id, request, need="editor")
    updates = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    if "category" in updates:
        updates["category"] = updates["category"].strip().lower()
    if not updates:
        raise HTTPException(status_code=400, detail="Nothing to update")
    # find-then-update: the shim's update_one has no matched_count.
    existing = await db.portfolio_projects.find_one({"project_id": project_id, "id": item_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Portfolio item not found")
    await db.portfolio_projects.update_one(
        {"project_id": project_id, "id": item_id}, {"$set": updates})
    doc = await db.portfolio_projects.find_one({"project_id": project_id, "id": item_id}, {"_id": 0})
    return _serialize(doc)


@content_router.delete("/projects/{project_id}/portfolio-projects/{item_id}")
async def delete_portfolio_item(project_id: str, item_id: str, request: Request):
    await require_project_access(project_id, request, need="admin")
    res = await db.portfolio_projects.delete_many({"project_id": project_id, "id": item_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Portfolio item not found")
    return {"ok": True}