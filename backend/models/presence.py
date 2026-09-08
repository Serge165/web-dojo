"""Collaboration presence (Phase 9A).

The dependency-free slice of the collaboration spec: who currently has a
project open. The full CRDT sync (Yjs over pycrdt-websocket) is planned
separately (see docs/PHASE9_SPEC_RECONCILIATION_HANDOFF.md); presence is
useful on its own and this endpoint shape survives that upgrade — the
frontend then moves beacons onto the websocket awareness channel.

Conventions mirror builder_auth.py: `db` and the auth helpers are injected
by server.py at import time. Heartbeats require a valid project JWT; peers
older than PRESENCE_TTL_SECONDS are pruned on read.
"""

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, ConfigDict

presence_router = APIRouter(prefix="/api")

db = None                     # server.py injects _LiveDbProxy()
_verify_jwt = None            # server.py injects builder_auth.verify_jwt

PRESENCE_TTL_SECONDS = 40     # beacon interval is 15s -> 2+ missed beats = gone


class PresencePing(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: str = ""
    color: str = "#C9A227"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _user_id_from(token: Optional[str]) -> Optional[str]:
    if not token or not token.startswith("Bearer "):
        return None
    try:
        return _verify_jwt(token[len("Bearer "):].strip())
    except Exception:
        return None


@presence_router.post("/projects/{project_id}/presence")
async def presence_ping(project_id: str, payload: PresencePing, authorization: Optional[str] = Header(default=None)):
    user_id = _user_id_from(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Missing or invalid bearer token")
    project = await db.projects.find_one({"id": project_id}, {"_id": 0, "owner_id": 1, "collaborators": 1})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    # Viewer+ (any collaborator or the owner) may announce presence.
    now = _now()
    await db.presence.update_one(
        {"project_id": project_id, "user_id": user_id},
        {"$set": {"id": f"{project_id}:{user_id}", "name": payload.name, "color": payload.color, "seen_at": now}},
        upsert=True,
    )
    # TTL prune (equality-friendly: fetch by project, filter in Python —
    # the SQLite shim has no range operators).
    cutoff = _cutoff_iso()
    cursor = db.presence.find({"project_id": project_id}, {"_id": 0})
    rows = await cursor.to_list(500)
    peers = []
    for row in rows:
        if row.get("user_id") == user_id:
            continue
        if (row.get("seen_at") or "") < cutoff:
            await db.presence.delete_one({"project_id": project_id, "user_id": row.get("user_id")})
            continue
        peers.append({"user_id": row.get("user_id"), "name": row.get("name"), "color": row.get("color")})
    return {"ok": True, "peers": peers}


def _cutoff_iso() -> str:
    from datetime import timedelta
    return (datetime.now(timezone.utc) - timedelta(seconds=PRESENCE_TTL_SECONDS)).isoformat()
