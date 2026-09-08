"""One-shot: dump backend/starter_templates.py STARTER_TEMPLATES to a JSON
file the frontend can import as an offline fallback when the backend is down.

Output shape per entry is identical to the backend's /api/templates response
(ProjectTemplate model), so the frontend's existing template consumers
(buildTemplatePreviewHtml, onLoadTemplate, aesthetic filters) consume it
unchanged.
"""
import json
import os
import sys
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from starter_templates import STARTER_TEMPLATES  # noqa: E402

# Pin created_at to a single stable instant so the bundle is deterministic and
# the frontend's stable sort (starters first, then -created_at) preserves the
# curated STARTER_TEMPLATES list order, matching a freshly seeded backend.
STAMP = "2026-01-01T00:00:00+00:00"
for t in STARTER_TEMPLATES:
    t["created_at"] = STAMP

out_path = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..", "frontend", "src", "data", "starterTemplates.json",
)
out_path = os.path.normpath(out_path)

with open(out_path, "w", encoding="utf-8") as f:
    json.dump(STARTER_TEMPLATES, f, ensure_ascii=False, indent=2)

print(f"Wrote {len(STARTER_TEMPLATES)} starters -> {out_path}")
ids = [t["id"] for t in STARTER_TEMPLATES]
print("ids:", ", ".join(ids))
