# Graphify Trace: Submissions Scoping Fix

Source: `graphify-out/graph.json`, node `concept_submissions_scoping_fix`
(from `docs/superpowers/specs/2026-08-17-audit-fix-round-2-design.md`)

## Why this node matters

It's the highest-betweenness bridge node in the whole graph (0.332) — one
security-audit fix that touches three otherwise-unrelated communities.

## The fix

`/api/submissions` GET/DELETE accepted an empty filter and silently matched
*everything* — any client could pull or wipe every submission across every
project. Fix: require a non-empty `project_id` or `form_name`, else `400`.

## The three edges

| Direction | Target | Community | Relation |
|---|---|---|---|
| → | `list_submissions()` | Commerce & Template CRUD | `rationale_for` |
| → | `SubmissionsModal()` | Builder Modals & Panels | `rationale_for` |
| → | `clear_submissions()` | URL Import & SSRF Guards | `rationale_for` |

## What each edge means

- **`list_submissions()`** — the backend query-scoping fix itself.
- **`SubmissionsModal()`** — the real teeth of it. The frontend Inbox called
  `GET /api/submissions` with no filter at all (a legitimate cross-project
  view). Fixing the backend forced a frontend behavior change: Inbox now
  scopes to the currently-open project (`project_id`, already available in
  `Builder.jsx`) instead of showing everything. Called out in the design doc
  as "an explicit, discussed trade-off, not an oversight."
- **`clear_submissions()`** — the bulk-DELETE half. `grep` confirmed the
  frontend never calls bulk DELETE at all, so this half was a pure safety
  fix with zero UI impact.

## Takeaway

One audit-fix concept simultaneously forced a change in backend query logic,
frontend UI scoping behavior, and closed an unused-but-dangerous bulk-delete
endpoint — three different code communities, one root cause.
