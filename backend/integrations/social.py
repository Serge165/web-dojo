"""Social media API integrations for the Social Wall block.

Fetches real posts/comments from Facebook, Instagram, X, TikTok, LinkedIn,
and YouTube. API tokens are stored encrypted in project settings (never in
exported HTML). All fetch functions are structured to be mock-friendly in
tests — they accept an optional `httpx_client` parameter so tests can inject
a mock client without hitting real platforms.

Rate limiting: exponential backoff + caching are implemented at the
endpoint layer (see _fetch_with_backoff below).
"""
import asyncio
import json
import time
from typing import List, Optional

import httpx

# Simple in-memory cache: {cache_key: (expires_at, data)}
_CACHE: dict = {}


def _cache_get(key: str) -> Optional[dict]:
    entry = _CACHE.get(key)
    if not entry:
        return None
    expires_at, data = entry
    if time.time() > expires_at:
        _CACHE.pop(key, None)
        return None
    return data


def _cache_set(key: str, data: dict, ttl_seconds: int = 300):
    _CACHE[key] = (time.time() + ttl_seconds, data)


async def _fetch_with_backoff(
    client: httpx.AsyncClient,
    url: str,
    headers: dict,
    params: dict,
    max_retries: int = 3,
) -> dict:
    """Fetch with exponential backoff on rate-limit (429) and server errors."""
    for attempt in range(max_retries):
        try:
            resp = await client.get(url, headers=headers, params=params, timeout=10.0)
            if resp.status_code == 429:
                # Rate limited — exponential backoff
                await asyncio.sleep(2 ** attempt)
                continue
            resp.raise_for_status()
            return resp.json()
        except (httpx.HTTPStatusError, httpx.TransportError) as e:
            if attempt == max_retries - 1:
                raise
            await asyncio.sleep(2 ** attempt)
    raise httpx.HTTPStatusError("Max retries exceeded", request=None, response=None)


def _normalize_post(platform: str, raw: dict) -> dict:
    """Normalize a platform-specific post into the Social Wall's uniform shape."""
    return {
        "platform": platform,
        "id": str(raw.get("id", "")),
        "author": raw.get("author", ""),
        "handle": raw.get("handle", ""),
        "avatar": raw.get("avatar", ""),
        "content": raw.get("content", ""),
        "timestamp": raw.get("timestamp", ""),
        "likes": raw.get("likes", 0),
        "comments": raw.get("comments", 0),
        "shares": raw.get("shares", 0),
        "image_url": raw.get("image_url", ""),
    }


async def fetch_facebook_feed(token: str, page_id: str, client: Optional[httpx.AsyncClient] = None) -> List[dict]:
    """Fetch recent posts from a Facebook Page via Graph API."""
    cache_key = f"facebook:{page_id}"
    cached = _cache_get(cache_key)
    if cached:
        return cached

    own_client = client is None
    if own_client:
        client = httpx.AsyncClient()
    try:
        data = await _fetch_with_backoff(
            client,
            f"https://graph.facebook.com/v19.0/{page_id}/posts",
            headers={},
            params={"access_token": token, "fields": "id,message,created_time,full_picture,from"},
        )
        posts = []
        for item in data.get("data", []):
            posts.append(_normalize_post("facebook", {
                "id": item.get("id", ""),
                "author": (item.get("from") or {}).get("name", ""),
                "handle": (item.get("from") or {}).get("id", ""),
                "content": item.get("message", ""),
                "timestamp": item.get("created_time", ""),
                "image_url": item.get("full_picture", ""),
            }))
        _cache_set(cache_key, posts)
        return posts
    finally:
        if own_client:
            await client.aclose()


async def fetch_instagram_feed(token: str, user_id: str, client: Optional[httpx.AsyncClient] = None) -> List[dict]:
    """Fetch recent media from an Instagram Business account via Graph API."""
    cache_key = f"instagram:{user_id}"
    cached = _cache_get(cache_key)
    if cached:
        return cached

    own_client = client is None
    if own_client:
        client = httpx.AsyncClient()
    try:
        data = await _fetch_with_backoff(
            client,
            f"https://graph.facebook.com/v19.0/{user_id}/media",
            headers={},
            params={"access_token": token, "fields": "id,caption,timestamp,media_url,permalink"},
        )
        posts = []
        for item in data.get("data", []):
            posts.append(_normalize_post("instagram", {
                "id": item.get("id", ""),
                "author": "",
                "handle": "",
                "content": item.get("caption", ""),
                "timestamp": item.get("timestamp", ""),
                "image_url": item.get("media_url", ""),
            }))
        _cache_set(cache_key, posts)
        return posts
    finally:
        if own_client:
            await client.aclose()


async def fetch_x_feed(token: str, user_id: str, client: Optional[httpx.AsyncClient] = None) -> List[dict]:
    """Fetch recent tweets from an X (Twitter) user via API v2."""
    cache_key = f"x:{user_id}"
    cached = _cache_get(cache_key)
    if cached:
        return cached

    own_client = client is None
    if own_client:
        client = httpx.AsyncClient()
    try:
        data = await _fetch_with_backoff(
            client,
            f"https://api.twitter.com/2/users/{user_id}/tweets",
            headers={"Authorization": f"Bearer {token}"},
            params={"max_results": 20, "tweet.fields": "created_at,public_metrics,author_id"},
        )
        posts = []
        for item in data.get("data", []):
            metrics = item.get("public_metrics", {})
            posts.append(_normalize_post("x", {
                "id": item.get("id", ""),
                "author": "",
                "handle": "",
                "content": item.get("text", ""),
                "timestamp": item.get("created_at", ""),
                "likes": metrics.get("like_count", 0),
                "comments": metrics.get("reply_count", 0),
                "shares": metrics.get("retweet_count", 0),
            }))
        _cache_set(cache_key, posts)
        return posts
    finally:
        if own_client:
            await client.aclose()


async def fetch_tiktok_feed(token: str, user_id: str, client: Optional[httpx.AsyncClient] = None) -> List[dict]:
    """Fetch recent videos from a TikTok user via the TikTok Research API."""
    cache_key = f"tiktok:{user_id}"
    cached = _cache_get(cache_key)
    if cached:
        return cached

    own_client = client is None
    if own_client:
        client = httpx.AsyncClient()
    try:
        data = await _fetch_with_backoff(
            client,
            f"https://open.tiktokapis.com/v2/video/list/",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            params={},
        )
        posts = []
        for item in data.get("data", {}).get("videos", []):
            posts.append(_normalize_post("tiktok", {
                "id": item.get("id", ""),
                "author": item.get("author", {}).get("nickname", ""),
                "handle": item.get("author", {}).get("unique_id", ""),
                "content": item.get("title", ""),
                "timestamp": item.get("create_time", ""),
                "likes": item.get("stats", {}).get("like_count", 0),
                "comments": item.get("stats", {}).get("comment_count", 0),
                "shares": item.get("stats", {}).get("share_count", 0),
                "image_url": item.get("cover_image_url", ""),
            }))
        _cache_set(cache_key, posts)
        return posts
    finally:
        if own_client:
            await client.aclose()


async def fetch_linkedin_feed(token: str, company_id: str, client: Optional[httpx.AsyncClient] = None) -> List[dict]:
    """Fetch recent posts from a LinkedIn company page."""
    cache_key = f"linkedin:{company_id}"
    cached = _cache_get(cache_key)
    if cached:
        return cached

    own_client = client is None
    if own_client:
        client = httpx.AsyncClient()
    try:
        data = await _fetch_with_backoff(
            client,
            f"https://api.linkedin.com/v2/ugcPosts?q=authors&authors=List({company_id})",
            headers={"Authorization": f"Bearer {token}"},
            params={"count": 20},
        )
        posts = []
        for item in data.get("elements", []):
            content = (item.get("specificContent") or {}).get("com.linkedin.ugc.ShareContent", {})
            share = content.get("shareCommentary", {}).get("text", "")
            posts.append(_normalize_post("linkedin", {
                "id": item.get("id", ""),
                "author": "",
                "handle": "",
                "content": share,
                "timestamp": item.get("created", {}).get("time", ""),
            }))
        _cache_set(cache_key, posts)
        return posts
    finally:
        if own_client:
            await client.aclose()


async def fetch_youtube_feed(token: str, channel_id: str, client: Optional[httpx.AsyncClient] = None) -> List[dict]:
    """Fetch recent videos from a YouTube channel via the Data API v3."""
    cache_key = f"youtube:{channel_id}"
    cached = _cache_get(cache_key)
    if cached:
        return cached

    own_client = client is None
    if own_client:
        client = httpx.AsyncClient()
    try:
        data = await _fetch_with_backoff(
            client,
            "https://www.googleapis.com/youtube/v3/search",
            headers={},
            params={
                "part": "snippet",
                "channelId": channel_id,
                "maxResults": 20,
                "order": "date",
                "type": "video",
                "key": token,
            },
        )
        posts = []
        for item in data.get("items", []):
            snippet = item.get("snippet", {})
            posts.append(_normalize_post("youtube", {
                "id": item.get("id", {}).get("videoId", ""),
                "author": snippet.get("channelTitle", ""),
                "handle": snippet.get("channelId", ""),
                "content": snippet.get("title", ""),
                "timestamp": snippet.get("publishedAt", ""),
                "image_url": (snippet.get("thumbnails") or {}).get("high", {}).get("url", ""),
            }))
        _cache_set(cache_key, posts)
        return posts
    finally:
        if own_client:
            await client.aclose()


# ---------- Testimonials from comments ----------

async def fetch_facebook_comments(token: str, post_id: str, client: Optional[httpx.AsyncClient] = None) -> List[dict]:
    """Fetch comments from a Facebook post to use as testimonials."""
    cache_key = f"facebook-comments:{post_id}"
    cached = _cache_get(cache_key)
    if cached:
        return cached

    own_client = client is None
    if own_client:
        client = httpx.AsyncClient()
    try:
        data = await _fetch_with_backoff(
            client,
            f"https://graph.facebook.com/v19.0/{post_id}/comments",
            headers={},
            params={"access_token": token, "fields": "id,message,created_time,from"},
        )
        comments = []
        for item in data.get("data", []):
            from_data = item.get("from") or {}
            comments.append({
                "id": item.get("id", ""),
                "author": from_data.get("name", ""),
                "avatar": "",
                "text": item.get("message", ""),
                "timestamp": item.get("created_time", ""),
                "platform": "facebook",
            })
        _cache_set(cache_key, comments)
        return comments
    finally:
        if own_client:
            await client.aclose()


# ---------- Social config storage ----------

async def save_social_config(project_id: str, config: dict) -> None:
    """Store social API tokens encrypted in project settings."""
    from cryptography.fernet import Fernet
    import os
    from pathlib import Path

    ROOT_DIR = Path(__file__).parent.parent
    _KEY_PATH = ROOT_DIR / ".preset_key"

    key = os.environ.get("WEBDOJO_SECRET_KEY")
    if not key and _KEY_PATH.exists():
        key = _KEY_PATH.read_text().strip()
    if not key:
        key = Fernet.generate_key().decode()
        try:
            _KEY_PATH.write_text(key)
            os.chmod(_KEY_PATH, 0o600)
        except Exception:
            pass
    fernet = Fernet(key.encode() if isinstance(key, str) else key)

    encrypted = {}
    for platform, creds in config.items():
        encrypted[platform] = {
            k: (fernet.encrypt(str(v).encode()).decode() if v else "")
            for k, v in creds.items()
        }

    await db.projects.update_one(
        {"id": project_id},
        {"$set": {"social_config_enc": json.dumps(encrypted)}},
    )


async def load_social_config(project_id: str) -> dict:
    """Load and decrypt social API tokens from project settings."""
    from cryptography.fernet import Fernet
    import os
    from pathlib import Path

    ROOT_DIR = Path(__file__).parent.parent
    _KEY_PATH = ROOT_DIR / ".preset_key"

    key = os.environ.get("WEBDOJO_SECRET_KEY")
    if not key and _KEY_PATH.exists():
        key = _KEY_PATH.read_text().strip()
    if not key:
        return {}

    project = await db.projects.find_one({"id": project_id}, {"_id": 0, "social_config_enc": 1})
    enc = (project or {}).get("social_config_enc")
    if not enc:
        return {}

    try:
        fernet = Fernet(key.encode() if isinstance(key, str) else key)
        encrypted = json.loads(enc)
        return {
            platform: {
                k: (fernet.decrypt(v.encode()).decode() if v else "")
                for k, v in creds.items()
            }
            for platform, creds in encrypted.items()
        }
    except Exception:
        return {}