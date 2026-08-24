"""Funnel tracking data model + analytics endpoint.

Tracks visitor progression through a sequence of pages/forms:
  entry → checkpoint A → checkpoint B → conversion

Events are stored in the `funnel_events` collection, scoped by project_id
and variant (for A/B testing). The analytics endpoint aggregates them into
a funnel view: entry count, drop-off per checkpoint, conversion rate,
time-to-conversion.
"""
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, Field, ConfigDict

funnel_router = APIRouter(prefix="/api")


class FunnelEvent(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    variant: str = "control"
    checkpoint: str  # "entry", "checkpoint_a", "checkpoint_b", "conversion"
    visitor_id: str = ""
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    meta: dict = Field(default_factory=dict)


class FunnelEventCreate(BaseModel):
    variant: str = "control"
    checkpoint: str
    visitor_id: str = ""
    meta: dict = Field(default_factory=dict)


class FunnelAnalyticsResponse(BaseModel):
    project_id: str
    variant: str
    entry_count: int
    checkpoint_a_count: int
    checkpoint_b_count: int
    conversion_count: int
    drop_off_a: int
    drop_off_b: int
    conversion_rate: float
    avg_time_to_conversion_seconds: Optional[float] = None
    events: List[dict] = Field(default_factory=list)


@funnel_router.post("/funnels/{project_id}/event")
async def record_funnel_event(project_id: str, payload: FunnelEventCreate):
    """Public — the live page's funnel-tracking script fires this."""
    if payload.checkpoint not in ("entry", "checkpoint_a", "checkpoint_b", "conversion"):
        raise HTTPException(status_code=400, detail="Invalid checkpoint")
    event = FunnelEvent(
        project_id=project_id,
        variant=payload.variant,
        checkpoint=payload.checkpoint,
        visitor_id=payload.visitor_id,
        meta=payload.meta,
    )
    doc = event.model_dump()
    await db.funnel_events.insert_one(doc.copy())
    return event


@funnel_router.get("/analytics/funnels/{project_id}")
async def get_funnel_analytics(
    project_id: str,
    variant: str = "control",
    x_dashboard_token: Optional[str] = Header(default=None),
):
    """Dashboard-gated analytics. Aggregates funnel events for a project
    (optionally split by variant for A/B testing)."""
    await _require_dashboard_token(project_id, x_dashboard_token)

    # SQLite shim has equality-only find() — fetch broad, filter in Python.
    cursor = db.funnel_events.find({"project_id": project_id}, {"_id": 0})
    all_events = await cursor.to_list(length=None)
    events = [e for e in all_events if e.get("variant") == variant]

    entry_count = sum(1 for e in events if e.get("checkpoint") == "entry")
    checkpoint_a_count = sum(1 for e in events if e.get("checkpoint") == "checkpoint_a")
    checkpoint_b_count = sum(1 for e in events if e.get("checkpoint") == "checkpoint_b")
    conversion_count = sum(1 for e in events if e.get("checkpoint") == "conversion")

    drop_off_a = max(0, entry_count - checkpoint_a_count)
    drop_off_b = max(0, checkpoint_a_count - checkpoint_b_count)
    conversion_rate = (conversion_count / entry_count * 100) if entry_count else 0.0

    # Time-to-conversion: for each visitor, find first entry and first
    # conversion timestamps, compute the delta.
    from datetime import datetime as dt
    visitor_times = {}
    for e in events:
        vid = e.get("visitor_id") or ""
        if not vid:
            continue
        try:
            ts = dt.fromisoformat(e["timestamp"])
        except Exception:
            continue
        bucket = visitor_times.setdefault(vid, {"entry": None, "conversion": None})
        if e.get("checkpoint") == "entry" and (bucket["entry"] is None or ts < bucket["entry"]):
            bucket["entry"] = ts
        if e.get("checkpoint") == "conversion" and (bucket["conversion"] is None or ts > bucket["conversion"]):
            bucket["conversion"] = ts

    deltas = []
    for vid, times in visitor_times.items():
        if times["entry"] and times["conversion"]:
            deltas.append((times["conversion"] - times["entry"]).total_seconds())
    avg_time = (sum(deltas) / len(deltas)) if deltas else None

    return FunnelAnalyticsResponse(
        project_id=project_id,
        variant=variant,
        entry_count=entry_count,
        checkpoint_a_count=checkpoint_a_count,
        checkpoint_b_count=checkpoint_b_count,
        conversion_count=conversion_count,
        drop_off_a=drop_off_a,
        drop_off_b=drop_off_b,
        conversion_rate=round(conversion_rate, 2),
        avg_time_to_conversion_seconds=round(avg_time, 2) if avg_time is not None else None,
        events=events,
    )