# Second Audit-Fix Round Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all 10 numbered findings in `docs/superpowers/specs/2026-08-17-audit-findings.md` (5 high-severity security, 4 medium-severity security, 1 medium-severity correctness), consolidating the XSS-adjacent findings around one new shared HTML-escaping utility.

**Architecture:** No architectural changes. Backend fixes are isolated changes to `backend/server.py` verified by `TestClient`-based tests (no live MongoDB needed — mocked the same way round 1's final fix wave did for `/api/submissions`). Frontend fixes route unescaped free-text interpolation through a new `frontend/src/lib/escapeHtml.js`, verified with Node's built-in test runner (`node --test`, zero dependencies) for every plain `.js` module — this sandbox's Node (v22.23.1) can dynamically `import()` any plain ES-module `.js` file directly, which round 1 didn't discover. Files that are JSX components (React, cannot be parsed by plain Node) or that import a CommonJS package with no ESM named-export interop (`exportHtml.js` imports `file-saver`) are verified by manual code review instead, called out explicitly per-task.

**Tech Stack:** FastAPI, `starlette.testclient.TestClient`, pytest (backend); Node's built-in `node:test` + `node:assert/strict` (frontend, no new dependency).

**Spec:** `docs/superpowers/specs/2026-08-17-audit-fix-round-2-design.md`

## Global Constraints

- Scope is `backend/server.py`, `frontend/src/lib/**`, `frontend/src/components/builder/**`, `frontend/src/pages/Builder.jsx`. No new features, no dependency bumps, no auth system.
- This branch (`security-audit-fix-round-2`) stacks on `security-audit-fix` (round 1's PR branch) — `backend/tests/test_security_fixes.py`, `backend/tests/conftest.py`, and `backend/.venv/` already exist from round 1. Do not recreate them.
- The existing `backend/tests/backend_test.py` suite hits a **live** backend over HTTP and cannot run in this sandbox — do not run it as part of this plan's verification.
- Frontend dependencies are **not installed** in a fresh checkout of this worktree (`frontend/node_modules` doesn't exist by default). Task 5 installs `jszip` + `file-saver` via `npm install --no-audit --no-fund --no-save --legacy-peer-deps jszip file-saver` from `frontend/` — this pulls in the full `package.json` dependency tree (~1500 packages, ~35s, `--legacy-peer-deps` needed because `react-day-picker`/`date-fns` have an unrelated peer-version conflict) since npm can't install a subset without reconciling the whole lockfile-less tree. This only needs to happen once; later tasks reuse the same `frontend/node_modules` (already gitignored).
- The `GET /api/submissions` scoping fix (Task 1) is a deliberate behavior change to the Inbox feature (global → current-project-scoped), not an oversight — this was discussed and approved before this plan was written.

---

### Task 1: Scope `/api/submissions` GET/DELETE to a required filter (finding #1)

**Files:**
- Modify: `backend/server.py` (`list_submissions`, `clear_submissions`)
- Modify: `frontend/src/components/builder/SubmissionsModal.jsx`
- Modify: `frontend/src/pages/Builder.jsx` (one line, passes `projectId` prop)
- Test: `backend/tests/test_audit_fixes.py` (new file)

**Interfaces:**
- Produces: `GET /api/submissions` and `DELETE /api/submissions` now require a non-empty `project_id` or `form_name` query param, else `400`.
- Consumes: none from other tasks in this plan.

- [ ] **Step 1: Write the failing backend tests**

Create `backend/tests/test_audit_fixes.py`:

```python
"""Self-contained regression tests for the second audit-fix round.
Same TestClient pattern as test_security_fixes.py (round 1) — no live
MongoDB needed; endpoints that touch `db` get it mocked per-test."""
import os

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "webdojo_test")

import pytest
from starlette.testclient import TestClient

import server


@pytest.fixture(scope="module")
def client():
    return TestClient(server.app)


class TestSubmissionsScoping:
    def test_get_without_filter_400(self, client):
        r = client.get("/api/submissions")
        assert r.status_code == 400

    def test_get_with_project_id_200(self, client, monkeypatch):
        class FakeCursor:
            def sort(self, *a, **kw):
                return self

            async def to_list(self, *a, **kw):
                return []

        class FakeCollection:
            def find(self, *a, **kw):
                return FakeCursor()

        monkeypatch.setattr(server.db, "submissions", FakeCollection())
        r = client.get("/api/submissions", params={"project_id": "abc"})
        assert r.status_code == 200
        assert r.json() == []

    def test_get_with_form_name_200(self, client, monkeypatch):
        class FakeCursor:
            def sort(self, *a, **kw):
                return self

            async def to_list(self, *a, **kw):
                return []

        class FakeCollection:
            def find(self, *a, **kw):
                return FakeCursor()

        monkeypatch.setattr(server.db, "submissions", FakeCollection())
        r = client.get("/api/submissions", params={"form_name": "Contact"})
        assert r.status_code == 200

    def test_delete_bulk_without_filter_400(self, client):
        r = client.delete("/api/submissions")
        assert r.status_code == 400

    def test_delete_bulk_with_project_id_200(self, client, monkeypatch):
        class FakeResult:
            deleted_count = 0

        class FakeCollection:
            async def delete_many(self, *a, **kw):
                return FakeResult()

        monkeypatch.setattr(server.db, "submissions", FakeCollection())
        r = client.delete("/api/submissions", params={"project_id": "abc"})
        assert r.status_code == 200
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd backend && .venv/bin/pytest tests/test_audit_fixes.py -v -k TestSubmissionsScoping`
Expected: `test_get_without_filter_400` and `test_delete_bulk_without_filter_400` FAIL (currently return 200); the three `*_with_*` tests PASS already (pre-existing behavior, since a filter was always accepted, just not required).

- [ ] **Step 3: Fix `list_submissions` and `clear_submissions`**

Find in `backend/server.py`:

```python
@api_router.get("/submissions", response_model=List[Submission])
async def list_submissions(project_id: Optional[str] = None, form_name: Optional[str] = None):
    query: dict = {}
    if project_id:
        query["project_id"] = project_id
    if form_name:
        query["form_name"] = form_name
    cursor = db.submissions.find(query, {"_id": 0}).sort("created_at", -1)
    items = await cursor.to_list(1000)
    return [Submission(**_deserialize(it)) for it in items]
```

Replace with:

```python
@api_router.get("/submissions", response_model=List[Submission])
async def list_submissions(project_id: Optional[str] = None, form_name: Optional[str] = None):
    if not project_id and not form_name:
        raise HTTPException(status_code=400, detail="project_id or form_name is required")
    query: dict = {}
    if project_id:
        query["project_id"] = project_id
    if form_name:
        query["form_name"] = form_name
    cursor = db.submissions.find(query, {"_id": 0}).sort("created_at", -1)
    items = await cursor.to_list(1000)
    return [Submission(**_deserialize(it)) for it in items]
```

Find:

```python
@api_router.delete("/submissions")
async def clear_submissions(form_name: Optional[str] = None):
    query = {"form_name": form_name} if form_name else {}
    res = await db.submissions.delete_many(query)
    return {"ok": True, "deleted": res.deleted_count}
```

Replace with:

```python
@api_router.delete("/submissions")
async def clear_submissions(form_name: Optional[str] = None, project_id: Optional[str] = None):
    if not form_name and not project_id:
        raise HTTPException(status_code=400, detail="project_id or form_name is required")
    query: dict = {}
    if project_id:
        query["project_id"] = project_id
    if form_name:
        query["form_name"] = form_name
    res = await db.submissions.delete_many(query)
    return {"ok": True, "deleted": res.deleted_count}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && .venv/bin/pytest tests/test_audit_fixes.py -v -k TestSubmissionsScoping`
Expected: all 5 tests PASS.

- [ ] **Step 5: Scope the frontend Inbox to the current project**

In `frontend/src/components/builder/SubmissionsModal.jsx`, find:

```jsx
export const SubmissionsModal = ({ open, onClose }) => {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [group, setGroup] = useState("__all__");

  const load = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API}/submissions`);
      setSubs(r.data || []);
    } catch { toast.error("Failed to load submissions"); }
    setLoading(false);
  };

  useEffect(() => { if (open) { load(); setGroup("__all__"); } }, [open]);
```

Replace with:

```jsx
export const SubmissionsModal = ({ open, onClose, projectId }) => {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [group, setGroup] = useState("__all__");

  const load = async () => {
    if (!projectId) { setSubs([]); return; }
    setLoading(true);
    try {
      const r = await axios.get(`${API}/submissions`, { params: { project_id: projectId } });
      setSubs(r.data || []);
    } catch { toast.error("Failed to load submissions"); }
    setLoading(false);
  };

  useEffect(() => { if (open) { load(); setGroup("__all__"); } }, [open, projectId]);
```

Then find the empty-state block (a few lines further down):

```jsx
            {!loading && visible.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center py-16" data-testid="submissions-empty">
                <Inbox size={40} className="text-gray-700 mb-3" />
                <div className="text-sm text-gray-300 font-medium">No submissions yet</div>
                <div className="text-xs text-gray-500 mt-1 max-w-sm leading-relaxed">
                  Build a form (Forms tab → Open form builder) and insert it. When visitors submit it on your published or previewed site, entries land here.
                </div>
              </div>
            )}
```

Replace with:

```jsx
            {!loading && visible.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center py-16" data-testid="submissions-empty">
                <Inbox size={40} className="text-gray-700 mb-3" />
                <div className="text-sm text-gray-300 font-medium">{projectId ? "No submissions yet" : "Save this project first"}</div>
                <div className="text-xs text-gray-500 mt-1 max-w-sm leading-relaxed">
                  {projectId
                    ? "Build a form (Forms tab → Open form builder) and insert it. When visitors submit it on your published or previewed site, entries land here."
                    : "The inbox shows submissions for this project. Save it once, then submissions will appear here."}
                </div>
              </div>
            )}
```

- [ ] **Step 6: Pass `projectId` from Builder.jsx**

In `frontend/src/pages/Builder.jsx`, find:

```jsx
      <SubmissionsModal
        open={submissionsOpen}
        onClose={() => setSubmissionsOpen(false)}
      />
```

Replace with:

```jsx
      <SubmissionsModal
        open={submissionsOpen}
        onClose={() => setSubmissionsOpen(false)}
        projectId={projectId}
      />
```

- [ ] **Step 7: Manual verification (no automated test — JSX + React deps, cannot be imported by plain Node)**

Read the three edited blocks back and confirm: (a) `load()` returns early with `setSubs([])` when `projectId` is falsy, never calling `axios.get` with no `project_id` param; (b) the `useEffect` dependency array includes `projectId` so switching projects while the modal state persists would reload; (c) `Builder.jsx`'s `projectId` state (declared at `useState(null)` near the top of the component) is definitely in scope at the `<SubmissionsModal>` call site (it's used by sibling components on the surrounding lines already, per the file as it stood before this change).

- [ ] **Step 8: Commit**

```bash
git add backend/server.py backend/tests/test_audit_fixes.py frontend/src/components/builder/SubmissionsModal.jsx frontend/src/pages/Builder.jsx
git commit -m "Scope /api/submissions GET/DELETE to a required filter

Both endpoints previously matched everything when called with no filter.
GET now requires project_id or form_name; the Inbox UI is scoped to the
current project instead of a global cross-project view. DELETE (bulk
wipe) also now requires a filter — it was never called unscoped by the
frontend, so this is a pure safety fix with no UI change."
```

---

### Task 2: Fix zero-decimal (JPY) currency miscalculation (finding #2)

**Files:**
- Modify: `backend/server.py` (`_create_payment_link`, `_create_checkout_session`)
- Test: `backend/tests/test_audit_fixes.py`

**Interfaces:**
- Produces: `server._to_unit_amount(amount: float, currency: str) -> int`, used by both Stripe amount builders.
- Consumes: none from other tasks.

- [ ] **Step 1: Write the failing tests**

Add to `backend/tests/test_audit_fixes.py`:

```python
class TestZeroDecimalCurrency:
    def test_usd_multiplies_by_100(self):
        assert server._to_unit_amount(9.99, "usd") == 999

    def test_jpy_no_multiplication(self):
        assert server._to_unit_amount(500, "jpy") == 500

    def test_jpy_case_insensitive(self):
        assert server._to_unit_amount(500, "JPY") == 500

    def test_jpy_rounds_to_whole_yen(self):
        assert server._to_unit_amount(500.7, "jpy") == 501
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd backend && .venv/bin/pytest tests/test_audit_fixes.py -v -k TestZeroDecimalCurrency`
Expected: FAIL with `AttributeError: module 'server' has no attribute '_to_unit_amount'`.

- [ ] **Step 3: Add `_to_unit_amount` and use it in both builders**

Find in `backend/server.py`:

```python
def _create_payment_link(name: str, amount: float, currency: str, quantity: int) -> dict:
    price = stripe.Price.create(
        currency=(currency or "usd").lower(),
        unit_amount=int(round(round(amount, 2) * 100)),
        product_data={"name": name},
    )
```

Replace with:

```python
ZERO_DECIMAL_CURRENCIES = {"jpy"}  # Stripe treats these as smallest-unit-is-1; extend if `currencies` below grows to include more.


def _to_unit_amount(amount: float, currency: str) -> int:
    """Convert a decimal amount to Stripe's smallest-currency-unit integer,
    honoring zero-decimal currencies (e.g. JPY) which must be passed as-is,
    not multiplied by 100."""
    if (currency or "usd").lower() in ZERO_DECIMAL_CURRENCIES:
        return int(round(amount))
    return int(round(round(amount, 2) * 100))


def _create_payment_link(name: str, amount: float, currency: str, quantity: int) -> dict:
    price = stripe.Price.create(
        currency=(currency or "usd").lower(),
        unit_amount=_to_unit_amount(amount, currency),
        product_data={"name": name},
    )
```

Find:

```python
                "unit_amount": int(round(round(it.amount, 2) * 100)),
```

Replace with:

```python
                "unit_amount": _to_unit_amount(it.amount, it.currency),
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && .venv/bin/pytest tests/test_audit_fixes.py -v -k TestZeroDecimalCurrency`
Expected: all 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/server.py backend/tests/test_audit_fixes.py
git commit -m "Fix JPY (zero-decimal currency) x100 overcharge in Stripe amount builders"
```

---

### Task 3: Reject path traversal in publish filenames (finding #6)

**Files:**
- Modify: `backend/server.py` (`publish_project`)
- Test: `backend/tests/test_audit_fixes.py`

**Interfaces:**
- Consumes: none from other tasks.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Write the failing tests**

Add to `backend/tests/test_audit_fixes.py`:

```python
class TestPublishFilenameTraversal:
    def _mock_project(self, monkeypatch):
        class FakeCollection:
            async def find_one(self, *a, **kw):
                return {"id": "anyid", "name": "Test", "elements": [], "fonts": [], "head_html": "", "canvas_bg": "#fff"}

        monkeypatch.setattr(server.db, "projects", FakeCollection())

    def test_rejects_path_traversal_html_filename(self, client, monkeypatch):
        self._mock_project(monkeypatch)
        r = client.post("/api/projects/anyid/publish", json={
            "host": "example.com", "username": "u", "password": "p",
            "html_filename": "../../etc/passwd",
        })
        assert r.status_code == 400

    def test_rejects_backslash_css_filename(self, client, monkeypatch):
        self._mock_project(monkeypatch)
        r = client.post("/api/projects/anyid/publish", json={
            "host": "example.com", "username": "u", "password": "p",
            "css_filename": "..\\..\\windows\\win.ini",
        })
        assert r.status_code == 400

    def test_rejects_leading_dot_filename(self, client, monkeypatch):
        self._mock_project(monkeypatch)
        r = client.post("/api/projects/anyid/publish", json={
            "host": "example.com", "username": "u", "password": "p",
            "html_filename": ".htaccess",
        })
        assert r.status_code == 400

    def test_normal_filenames_pass_validation(self, client, monkeypatch):
        # Port 1 on loopback has nothing listening, so this fails fast with
        # a connection error once past filename validation — confirming it
        # got past the 400 check (a 502 upload failure, not 400). Same
        # pattern as the existing backend_test.py publish tests.
        self._mock_project(monkeypatch)
        r = client.post("/api/projects/anyid/publish", json={
            "host": "127.0.0.1", "port": 1, "username": "u", "password": "p",
            "html_filename": "index.html", "css_filename": "styles.css",
        })
        assert r.status_code != 400
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd backend && .venv/bin/pytest tests/test_audit_fixes.py -v -k TestPublishFilenameTraversal`
Expected: the three `test_rejects_*` tests FAIL (currently no validation, so they'd proceed to attempt an FTP connection to `example.com` and return 502, not 400); `test_normal_filenames_pass_validation` PASSES already.

- [ ] **Step 3: Add the validation**

Find in `backend/server.py`:

```python
    html_name = payload.html_filename or "index.html"
    css_name = payload.css_filename or "styles.css"
    index_html, styles_css = _build_project_bundle(doc, html_name, css_name)
```

Replace with:

```python
    html_name = payload.html_filename or "index.html"
    css_name = payload.css_filename or "styles.css"
    for fname in (html_name, css_name):
        if "/" in fname or "\\" in fname or fname.startswith("."):
            raise HTTPException(status_code=400, detail="Filenames must be a plain name with no path separators")
    index_html, styles_css = _build_project_bundle(doc, html_name, css_name)
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && .venv/bin/pytest tests/test_audit_fixes.py -v -k TestPublishFilenameTraversal`
Expected: all 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/server.py backend/tests/test_audit_fixes.py
git commit -m "Reject path traversal in publish filenames

html_filename/css_filename were used verbatim as FTP/SFTP upload
targets with no rejection of / \\ or a leading dot, allowing writes
outside the configured remote_path."
```

---

### Task 4: Enforce a body-size cap on `POST /api/submissions` (finding #7)

**Files:**
- Modify: `backend/server.py` (`_extract_submission`, `create_submission`)
- Test: `backend/tests/test_audit_fixes.py`

**Interfaces:**
- Produces: `server._cap_request_body(request, max_bytes) -> None` (raises `HTTPException(413, ...)`), `server._MAX_SUBMISSION_BYTES` (int constant).
- Consumes: none from other tasks.

- [ ] **Step 1: Write the failing tests**

Add to `backend/tests/test_audit_fixes.py`:

```python
class TestSubmissionBodySizeLimit:
    def test_oversized_submission_rejected(self, client):
        huge_value = "x" * 1_100_000
        r = client.post(
            "/api/submissions",
            json={"message": huge_value},
            headers={"Accept": "application/json"},
        )
        assert r.status_code == 413

    def test_normal_sized_submission_not_rejected(self, client, monkeypatch):
        class FakeCollection:
            async def insert_one(self, *a, **kw):
                return None

        monkeypatch.setattr(server.db, "submissions", FakeCollection())
        r = client.post(
            "/api/submissions",
            json={"name": "Jane", "message": "hello"},
            headers={"Accept": "application/json"},
        )
        assert r.status_code == 200
        assert r.json()["ok"] is True
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd backend && .venv/bin/pytest tests/test_audit_fixes.py -v -k TestSubmissionBodySizeLimit`
Expected: `test_oversized_submission_rejected` FAILS (currently 200, not 413); `test_normal_sized_submission_not_rejected` PASSES already.

- [ ] **Step 3: Add the capped body reader**

Find in `backend/server.py`:

```python
_RESERVED_SUB_KEYS = {"_wd_form", "_wd_form_id", "_wd_page", "_wd_title", "_wd_project"}


async def _extract_submission(request: Request) -> Submission:
    ctype = (request.headers.get("content-type") or "").lower()
```

Replace with:

```python
_RESERVED_SUB_KEYS = {"_wd_form", "_wd_form_id", "_wd_page", "_wd_title", "_wd_project"}

_MAX_SUBMISSION_BYTES = 1_000_000  # 1 MB — generous for a form submission, small enough to bound memory


async def _cap_request_body(request: Request, max_bytes: int) -> None:
    """Read the request body once, aborting as soon as it exceeds max_bytes
    (bounds memory even without a truthful Content-Length header), and
    cache it on the request so the later request.json()/request.form()
    calls reuse it instead of re-reading the now-exhausted ASGI stream —
    this is the same caching Starlette's own Request.body() does
    internally (see starlette/requests.py: stream() yields self._body
    directly when it's already set)."""
    content_length = request.headers.get("content-length")
    if content_length and content_length.isdigit() and int(content_length) > max_bytes:
        raise HTTPException(status_code=413, detail="Submission too large")
    chunks = []
    total = 0
    async for chunk in request.stream():
        total += len(chunk)
        if total > max_bytes:
            raise HTTPException(status_code=413, detail="Submission too large")
        chunks.append(chunk)
    request._body = b"".join(chunks)


async def _extract_submission(request: Request) -> Submission:
    await _cap_request_body(request, _MAX_SUBMISSION_BYTES)
    ctype = (request.headers.get("content-type") or "").lower()
```

- [ ] **Step 4: Stop the generic exception handler from swallowing the 413**

Find in `backend/server.py`:

```python
@api_router.post("/submissions")
async def create_submission(request: Request):
    try:
        sub = await _extract_submission(request)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read form data: {type(e).__name__}")
```

Replace with:

```python
@api_router.post("/submissions")
async def create_submission(request: Request):
    try:
        sub = await _extract_submission(request)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read form data: {type(e).__name__}")
```

(Without this, the bare `except Exception` above would catch the `HTTPException(413, ...)` raised inside `_extract_submission` and rewrap it as a generic `400`, losing the correct status code — the same pattern already used in `import_url` from round 1.)

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd backend && .venv/bin/pytest tests/test_audit_fixes.py -v -k TestSubmissionBodySizeLimit`
Expected: both tests PASS.

- [ ] **Step 6: Run the full backend test file (regression check for Tasks 1-4)**

Run: `cd backend && .venv/bin/pytest tests/test_audit_fixes.py -v`
Expected: all 15 tests pass (5 + 4 + 4 + 2).

- [ ] **Step 7: Commit**

```bash
git add backend/server.py backend/tests/test_audit_fixes.py
git commit -m "Enforce a 1MB body-size cap on POST /api/submissions

_extract_submission parsed the full request body with no ceiling; this
endpoint is reachable by anonymous internet visitors by design."
```

---

### Task 5: Create the shared escaping utility and migrate `exportHtml.js` + `forms.js` (findings #4, #9 partial)

**Files:**
- Create: `frontend/src/lib/escapeHtml.js`
- Create: `frontend/src/lib/__tests__/escapeHtml.test.mjs`
- Create: `frontend/src/lib/__tests__/forms.test.mjs`
- Modify: `frontend/src/lib/exportHtml.js`
- Modify: `frontend/src/lib/forms.js`

**Interfaces:**
- Produces: `escAttr(value) -> string` (HTML-attribute-safe: escapes `& < > " '`), `escText(value) -> string` (HTML-text-safe: escapes `& < >`) from `frontend/src/lib/escapeHtml.js`. Both accept `null`/`undefined` and return `""`. Every later frontend task imports one or both of these.

- [ ] **Step 1: Install the two npm packages `exportHtml.js` needs**

Run from the repo root: `cd frontend && npm install --no-audit --no-fund --no-save --legacy-peer-deps jszip file-saver`
Expected: completes in ~30-40s, `frontend/node_modules/` now exists (already gitignored — nothing to add to `.gitignore`).

- [ ] **Step 2: Write the failing test for the new utility**

Create `frontend/src/lib/__tests__/escapeHtml.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { escAttr, escText } from "../escapeHtml.js";

test("escAttr escapes & < > \" '", () => {
  assert.equal(
    escAttr(`<img src=x onerror=alert(1)>&"'`),
    "&lt;img src=x onerror=alert(1)&gt;&amp;&quot;&#39;"
  );
});

test("escAttr handles null/undefined as empty string", () => {
  assert.equal(escAttr(null), "");
  assert.equal(escAttr(undefined), "");
});

test("escAttr preserves plain text unchanged", () => {
  assert.equal(escAttr("Aurora Bottle"), "Aurora Bottle");
});

test("escText escapes & < > but not quotes", () => {
  assert.equal(
    escText(`</title><script>alert(1)</script>`),
    "&lt;/title&gt;&lt;script&gt;alert(1)&lt;/script&gt;"
  );
  assert.equal(escText(`He said "hi"`), `He said "hi"`);
});
```

- [ ] **Step 3: Run to verify it fails**

Run: `node --test frontend/src/lib/__tests__/escapeHtml.test.mjs`
Expected: FAIL — `Cannot find module '.../escapeHtml.js'`.

- [ ] **Step 4: Create the utility**

Create `frontend/src/lib/escapeHtml.js`:

```js
// Single source of truth for HTML-escaping free-text values before they're
// spliced into generated HTML strings (exported/published sites, canvas
// blocks). Two functions because the safe escaping differs by context:
// an HTML attribute value also needs quotes escaped; a text node doesn't.

export const escAttr = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export const escText = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
```

- [ ] **Step 5: Run to verify it passes**

Run: `node --test frontend/src/lib/__tests__/escapeHtml.test.mjs`
Expected: all 4 tests PASS.

- [ ] **Step 6: Migrate `exportHtml.js`**

In `frontend/src/lib/exportHtml.js`, find:

```js
import JSZip from "jszip";
import { saveAs } from "file-saver";

const buildFontLinks = (fonts) => {
  if (!fonts || fonts.length === 0) return "";
  const families = fonts
    .map((f) => f.replace(/\s+/g, "+"))
    .join("&family=");
  return `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=${families}&display=swap" rel="stylesheet">`;
};

const escAttr = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
```

Replace with:

```js
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { escAttr, escText } from "./escapeHtml";

const buildFontLinks = (fonts) => {
  if (!fonts || fonts.length === 0) return "";
  const families = fonts
    .map((f) => f.replace(/\s+/g, "+"))
    .join("&family=");
  return `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=${escAttr(families)}&display=swap" rel="stylesheet">`;
};
```

Then find (it appears twice, in `buildStandaloneHtml` and `buildCleanExport`):

```js
<title>${pageTitle(project)}</title>
```

Replace **both occurrences** with:

```js
<title>${escText(pageTitle(project))}</title>
```

- [ ] **Step 7: Migrate `forms.js`**

`frontend/src/lib/forms.js` doesn't currently have any `import` lines — it starts with a two-line file comment. Find that exact opening:

```js
// Portable form-block generator: converts a form config into a
// standalone HTML block with inline styles that survives export/publish.

const uid = (p = "f") => `${p}-${Math.random().toString(36).slice(2, 8)}`;
```

Replace with (adding the import right after the file comment, before the first declaration):

```js
// Portable form-block generator: converts a form config into a
// standalone HTML block with inline styles that survives export/publish.

import { escAttr as escape } from "./escapeHtml";

const uid = (p = "f") => `${p}-${Math.random().toString(36).slice(2, 8)}`;
```

Then find the now-redundant local implementation, a few lines further down:

```js
const escape = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
```

Delete it entirely (all 7 lines, including the blank line before or after it — leave exactly one blank line between the surrounding statements, matching the file's existing spacing style). Every call site further down in the file that uses `escape(...)` is untouched — same name, same behavior, just sourced from the shared module now via the import alias.

- [ ] **Step 8: Write the forms.js migration regression test**

Create `frontend/src/lib/__tests__/forms.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { buildFormHtml, DEFAULT_FORM } from "../forms.js";

test("buildFormHtml still escapes field labels after migrating to shared escapeHtml", () => {
  const config = DEFAULT_FORM();
  config.fields[0].label = "<script>alert(1)</script>";
  const html = buildFormHtml(config);
  assert.ok(!html.includes("<script>alert(1)</script>"), "raw script tag must not appear unescaped");
  assert.ok(html.includes("&lt;script&gt;alert(1)&lt;/script&gt;"), "label must be escaped");
});
```

- [ ] **Step 9: Run the forms.js test**

Run: `node --test frontend/src/lib/__tests__/forms.test.mjs`
Expected: PASS.

- [ ] **Step 10: Manually verify the `exportHtml.js` changes (no automated test — `import { saveAs } from "file-saver"` is a CommonJS package with no ESM named-export interop; plain Node's loader rejects it with `SyntaxError: Named export 'saveAs' not found`, confirmed by hand in this sandbox — this is a Node-loader-vs-bundler difference, not fixable without changing the source import style, which is out of scope)**

Read the edited `frontend/src/lib/exportHtml.js` and confirm by hand:
- `buildFontLinks`: a font name containing `"` (e.g. a family name someone typed as `Foo" onerror="`) would, pre-fix, land unescaped inside `href="https://fonts.googleapis.com/css2?family=${families}...`. Confirm the new `escAttr(families)` wraps the *entire* assembled string (after the space→`+` join) right at the point it's substituted into the template literal, so it can't be bypassed by choosing a font name that contains `&family=`.
- Both `<title>${escText(pageTitle(project))}</title>` occurrences (`buildStandaloneHtml` and `buildCleanExport`): confirm `pageTitle(project)` (which reads `project.seo.title` or falls back to `project.name`, both free text) is now wrapped in `escText`, and that a project named `</title><script>alert(1)</script>` would render as inert text, not break out of the `<title>` tag.

- [ ] **Step 11: Commit**

```bash
git add frontend/src/lib/escapeHtml.js frontend/src/lib/__tests__/escapeHtml.test.mjs frontend/src/lib/__tests__/forms.test.mjs frontend/src/lib/exportHtml.js frontend/src/lib/forms.js
git commit -m "Add shared escapeHtml utility; migrate exportHtml.js and forms.js

exportHtml.js's <title> (fed by the free-text project name) was the one
place its own escAttr wasn't used at all — stored XSS via project name.
forms.js's already-correct local escape() now sources from the shared
utility instead of a third independent implementation."
```

---

### Task 6: Migrate `commerce.js` + `cart.js` (finding #5)

**Files:**
- Modify: `frontend/src/lib/commerce.js`
- Modify: `frontend/src/lib/cart.js`
- Create: `frontend/src/lib/__tests__/commerce.test.mjs`
- Create: `frontend/src/lib/__tests__/cart.test.mjs`

**Interfaces:**
- Consumes: `escAttr`, `escText` from `frontend/src/lib/escapeHtml.js` (Task 5).

- [ ] **Step 1: Write the failing tests**

Create `frontend/src/lib/__tests__/commerce.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { stripeButtonHtml, paypalButtonHtml } from "../commerce.js";

test("stripeButtonHtml escapes label, url, and accent", () => {
  const html = stripeButtonHtml({
    label: '"><script>alert(1)</script>',
    url: 'https://example.com/"><script>alert(1)</script>',
    accent: '"onmouseover="alert(1)',
  });
  assert.ok(!html.includes("<script>alert(1)</script>"), "no raw script tag");
  assert.ok(!html.includes('onmouseover="alert(1)'), "accent must not break out of style attribute");
  assert.ok(html.includes("&quot;&gt;&lt;script&gt;"), "label must be escaped");
});

test("paypalButtonHtml escapes clientId in the script src attribute", () => {
  const html = paypalButtonHtml({
    clientId: '"><script>alert(1)</script>',
    amount: 10,
    currency: "USD",
    label: "Buy",
  });
  assert.ok(!html.includes('client-id="><script>alert(1)</script>'), "clientId must not break out of src attribute");
  assert.ok(html.includes("&quot;&gt;&lt;script&gt;"), "clientId must be escaped");
});
```

Create `frontend/src/lib/__tests__/cart.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { buildAddToCartButton } from "../cart.js";

test("buildAddToCartButton escapes name and image attributes", () => {
  const html = buildAddToCartButton({
    id: "p1",
    name: '"><script>alert(1)</script>',
    amount: 10,
    image: '" onerror="alert(1)',
  });
  assert.ok(!html.includes("<script>alert(1)</script>"), "no raw script tag");
  assert.ok(!html.includes('onerror="alert(1)"'), "image must not break out of attribute");
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `node --test frontend/src/lib/__tests__/commerce.test.mjs frontend/src/lib/__tests__/cart.test.mjs`
Expected: all 3 tests FAIL (raw `<script>`/`onmouseover`/`onerror` currently appear unescaped in the output).

- [ ] **Step 3: Migrate `commerce.js`**

In `frontend/src/lib/commerce.js`, find:

```js
const rid = () => "pay" + Math.random().toString(36).slice(2, 8);

export const CURRENCY_SYMBOL = { usd: "$", eur: "€", gbp: "£", cad: "C$", aud: "A$", inr: "₹", jpy: "¥" };

// Stripe: a styled anchor pointing at a hosted Payment Link URL (generated
// server-side). Works from any static page — clicking opens Stripe Checkout.
export const stripeButtonHtml = ({ label, url, price, accent = "#635bff", radius = "10px" }) =>
  `<div data-webdojo-pay="stripe" style="display:inline-block;font-family:system-ui,-apple-system,sans-serif;">
  <a href="${url}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:10px;padding:14px 26px;background:${accent};color:#fff;text-decoration:none;border-radius:${radius};font-weight:600;font-size:15px;box-shadow:0 4px 14px rgba(99,91,255,.35);">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 9.4c0-.6.5-.9 1.3-.9 1.2 0 2.7.4 3.9 1V5.8A10 10 0 0 0 14.8 5C11.8 5 9.8 6.5 9.8 9c0 4 5.4 3.3 5.4 5 0 .6-.6 1-1.5 1-1.3 0-3-.5-4.3-1.3v3.8c1.4.6 2.9.9 4.3.9 3 0 5.2-1.5 5.2-4 0-4.2-5.4-3.4-5.4-5z"/></svg>
    ${label}${price ? ` · ${price}` : ""}
  </a>
</div>`;
```

Replace with:

```js
import { escAttr, escText } from "./escapeHtml";

const rid = () => "pay" + Math.random().toString(36).slice(2, 8);

export const CURRENCY_SYMBOL = { usd: "$", eur: "€", gbp: "£", cad: "C$", aud: "A$", inr: "₹", jpy: "¥" };

// Stripe: a styled anchor pointing at a hosted Payment Link URL (generated
// server-side). Works from any static page — clicking opens Stripe Checkout.
export const stripeButtonHtml = ({ label, url, price, accent = "#635bff", radius = "10px" }) =>
  `<div data-webdojo-pay="stripe" style="display:inline-block;font-family:system-ui,-apple-system,sans-serif;">
  <a href="${escAttr(url)}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:10px;padding:14px 26px;background:${escAttr(accent)};color:#fff;text-decoration:none;border-radius:${radius};font-weight:600;font-size:15px;box-shadow:0 4px 14px rgba(99,91,255,.35);">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 9.4c0-.6.5-.9 1.3-.9 1.2 0 2.7.4 3.9 1V5.8A10 10 0 0 0 14.8 5C11.8 5 9.8 6.5 9.8 9c0 4 5.4 3.3 5.4 5 0 .6-.6 1-1.5 1-1.3 0-3-.5-4.3-1.3v3.8c1.4.6 2.9.9 4.3.9 3 0 5.2-1.5 5.2-4 0-4.2-5.4-3.4-5.4-5z"/></svg>
    ${escText(label)}${price ? ` · ${escText(price)}` : ""}
  </a>
</div>`;
```

Then find:

```js
  <script src="https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${cur}"></script>
```

Replace with:

```js
  <script src="https://www.paypal.com/sdk/js?client-id=${escAttr(clientId)}&currency=${cur}"></script>
```

- [ ] **Step 4: Migrate `cart.js`**

In `frontend/src/lib/cart.js`, find:

```js
const BACKEND = process.env.REACT_APP_BACKEND_URL || "";

export const buildAddToCartButton = ({ id, name, amount, currency = "usd", image = "", label = "Add to cart", accent = "#4f46e5", radius = "10px" }) =>
  `<button type="button" data-wd-add data-wd-id="${id || name}" data-wd-name="${name}" data-wd-price="${Number(amount) || 0}" data-wd-cur="${currency}" data-wd-img="${image}" style="display:inline-flex;align-items:center;gap:8px;padding:12px 22px;border:none;border-radius:${radius};background:${accent};color:#fff;font-family:system-ui,sans-serif;font-size:14px;font-weight:600;cursor:pointer;">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
  ${label}
</button>`;
```

Replace with:

```js
import { escAttr, escText } from "./escapeHtml";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "";

export const buildAddToCartButton = ({ id, name, amount, currency = "usd", image = "", label = "Add to cart", accent = "#4f46e5", radius = "10px" }) =>
  `<button type="button" data-wd-add data-wd-id="${escAttr(id || name)}" data-wd-name="${escAttr(name)}" data-wd-price="${Number(amount) || 0}" data-wd-cur="${currency}" data-wd-img="${escAttr(image)}" style="display:inline-flex;align-items:center;gap:8px;padding:12px 22px;border:none;border-radius:${radius};background:${accent};color:#fff;font-family:system-ui,sans-serif;font-size:14px;font-weight:600;cursor:pointer;">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
  ${escText(label)}
</button>`;
```

(`buildCartRuntimeHtml`'s own internal `esc()`, used inside the `<script>` block that runs in the visitor's browser, already escapes correctly per the audit finding — it is not touched by this task.)

- [ ] **Step 5: Run tests to verify they pass**

Run: `node --test frontend/src/lib/__tests__/commerce.test.mjs frontend/src/lib/__tests__/cart.test.mjs`
Expected: all 3 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/lib/commerce.js frontend/src/lib/cart.js frontend/src/lib/__tests__/commerce.test.mjs frontend/src/lib/__tests__/cart.test.mjs
git commit -m "Escape free-text fields in commerce.js and cart.js HTML builders

label/url/accent (stripeButtonHtml), clientId (paypalButtonHtml),
name/image (buildAddToCartButton) were spliced unescaped into HTML
attributes."
```

---

### Task 7: Migrate `social.js` follow-mode href (finding #9 partial)

**Files:**
- Modify: `frontend/src/lib/social.js`
- Create: `frontend/src/lib/__tests__/social.test.mjs`

**Interfaces:**
- Consumes: `escAttr` from `frontend/src/lib/escapeHtml.js` (Task 5).

- [ ] **Step 1: Write the failing test**

Create `frontend/src/lib/__tests__/social.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { buildSocialHtml } from "../social.js";

test("follow-mode href is escaped", () => {
  const html = buildSocialHtml({
    mode: "follow",
    items: [{ id: "instagram", url: '"><script>alert(1)</script>' }],
  });
  assert.ok(!html.includes("<script>alert(1)</script>"), "no raw script tag");
  assert.ok(html.includes("&quot;&gt;&lt;script&gt;"), "url must be escaped");
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test frontend/src/lib/__tests__/social.test.mjs`
Expected: FAIL (raw `<script>alert(1)</script>` currently appears in the output).

- [ ] **Step 3: Migrate `social.js`**

Find the top of `frontend/src/lib/social.js` (its first non-comment line) and add the import. The file currently starts:

```js
// Social buttons: share-this-page bar OR link-to-profiles, fully customizable.
// Output is a self-contained block (scoped <style> + inline SVG icons + a tiny
// script that points share links at the current page). Summer-2026 platform set.

const P = (id, name, color, share, placeholder, icon) => ({ id, name, color, share, placeholder, icon });
```

Add the import right after the comment block:

```js
// Social buttons: share-this-page bar OR link-to-profiles, fully customizable.
// Output is a self-contained block (scoped <style> + inline SVG icons + a tiny
// script that points share links at the current page). Summer-2026 platform set.

import { escAttr } from "./escapeHtml";

const P = (id, name, color, share, placeholder, icon) => ({ id, name, color, share, placeholder, icon });
```

Then find:

```js
    if (mode === "follow") {
      const href = (it.url || p.placeholder);
      return `<a class="${id}-i" style="--c:${p.color};" href="${href}" target="_blank" rel="noopener" aria-label="${p.name}">${svg(p.icon)}${label}</a>`;
    }
```

Replace with:

```js
    if (mode === "follow") {
      const href = (it.url || p.placeholder);
      return `<a class="${id}-i" style="--c:${p.color};" href="${escAttr(href)}" target="_blank" rel="noopener" aria-label="${p.name}">${svg(p.icon)}${label}</a>`;
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test frontend/src/lib/__tests__/social.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/social.js frontend/src/lib/__tests__/social.test.mjs
git commit -m "Escape follow-mode profile URL in social.js"
```

---

### Task 8: Migrate `BackgroundMediaPanel.jsx` (finding #9 partial)

**Files:**
- Modify: `frontend/src/components/builder/BackgroundMediaPanel.jsx`

**Interfaces:**
- Consumes: `escAttr`, `escText` from `frontend/src/lib/escapeHtml.js` (Task 5).

- [ ] **Step 1: Migrate `buildMusicHtml` and `applyVideo`**

This file is a JSX React component (imports `react`, `lucide-react`, `sonner`) — plain Node cannot parse it, so this task is implement + manual verification, no automated test (same constraint as `exportHtml.js` in Task 5, but here it's JSX syntax itself, not a CJS-interop issue).

In `frontend/src/components/builder/BackgroundMediaPanel.jsx`, find the top of the file:

```jsx
import React, { useState } from "react";
import { Music } from "lucide-react";
import { toast } from "sonner";
```

Replace with:

```jsx
import React, { useState } from "react";
import { Music } from "lucide-react";
import { toast } from "sonner";
import { escAttr, escText } from "@/lib/escapeHtml";
```

Then find:

```jsx
const buildMusicHtml = ({ type, url, label, accent, corner, autoplay, loop }) => {
  const pos = CORNERS[corner] || CORNERS["bottom-right"];
  if (type === "midi") {
    return `<div data-webdojo-music="midi" style="position:fixed;${pos}z-index:99999;background:#0f0f16;padding:10px 12px;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.35);font-family:system-ui,-apple-system,sans-serif;">
  <script src="${MIDI_CDN}"></script>
  <midi-player src="${url}" sound-font ${loop ? "loop " : ""}style="width:260px;display:block;"></midi-player>
</div>`;
  }
  const aid = "wdm" + Math.random().toString(36).slice(2, 7);
  return `<div data-webdojo-music="audio" style="position:fixed;${pos}z-index:99999;font-family:system-ui,-apple-system,sans-serif;">
  <audio id="${aid}" src="${url}" ${loop ? "loop " : ""}${autoplay ? "autoplay " : ""}preload="auto"></audio>
  <button type="button" onclick="var a=document.getElementById('${aid}');var s=this.querySelector('span');if(a.paused){a.play();s.textContent='Pause';}else{a.pause();s.textContent=${JSON.stringify(label)};}" style="display:inline-flex;align-items:center;gap:8px;padding:11px 18px;border:none;border-radius:999px;background:${accent};color:#fff;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 10px 30px rgba(0,0,0,.3);">
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg><span>${label}</span>
  </button>
</div>`;
};
```

Replace with:

```jsx
const buildMusicHtml = ({ type, url, label, accent, corner, autoplay, loop }) => {
  const pos = CORNERS[corner] || CORNERS["bottom-right"];
  if (type === "midi") {
    return `<div data-webdojo-music="midi" style="position:fixed;${pos}z-index:99999;background:#0f0f16;padding:10px 12px;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.35);font-family:system-ui,-apple-system,sans-serif;">
  <script src="${MIDI_CDN}"></script>
  <midi-player src="${escAttr(url)}" sound-font ${loop ? "loop " : ""}style="width:260px;display:block;"></midi-player>
</div>`;
  }
  const aid = "wdm" + Math.random().toString(36).slice(2, 7);
  return `<div data-webdojo-music="audio" style="position:fixed;${pos}z-index:99999;font-family:system-ui,-apple-system,sans-serif;">
  <audio id="${aid}" src="${escAttr(url)}" ${loop ? "loop " : ""}${autoplay ? "autoplay " : ""}preload="auto"></audio>
  <button type="button" onclick="var a=document.getElementById('${aid}');var s=this.querySelector('span');if(a.paused){a.play();s.textContent='Pause';}else{a.pause();s.textContent=${JSON.stringify(label)};}" style="display:inline-flex;align-items:center;gap:8px;padding:11px 18px;border:none;border-radius:999px;background:${escAttr(accent)};color:#fff;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 10px 30px rgba(0,0,0,.3);">
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg><span>${escText(label)}</span>
  </button>
</div>`;
};
```

(The `onclick="...${JSON.stringify(label)}..."` inline handler has a separate, pre-existing quoting issue — `JSON.stringify` always wraps in double quotes, which can prematurely close the double-quoted `onclick="..."` attribute for *any* label value, not just malicious ones. This is not one of the 10 audit findings and is out of scope for this plan; leave it untouched.)

Then find:

```jsx
    const wrapped = `<div data-forge-video-bg style="position:relative;overflow:hidden;">
  <video autoplay muted loop playsinline style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;">
    <source src="${videoUrl.trim()}" />
  </video>
  <div style="position:relative;z-index:1;">${inner}</div>
</div>`;
```

Replace with:

```jsx
    const wrapped = `<div data-forge-video-bg style="position:relative;overflow:hidden;">
  <video autoplay muted loop playsinline style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;">
    <source src="${escAttr(videoUrl.trim())}" />
  </video>
  <div style="position:relative;z-index:1;">${inner}</div>
</div>`;
```

- [ ] **Step 2: Manual verification (no automated test — JSX, cannot be imported by plain Node)**

Read the three edited spots and confirm: `escAttr(url)` wraps both `midi-player src` and `audio src`; `escAttr(accent)` wraps the `background:` CSS value inside the `onclick` button's `style` attribute; `escText(label)` wraps the `<span>` text node (not the `onclick` JSON.stringify usage, which is a separate pre-existing issue noted above and intentionally untouched); `escAttr(videoUrl.trim())` wraps the `<source src>`.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/builder/BackgroundMediaPanel.jsx
git commit -m "Escape free-text fields in BackgroundMediaPanel's generated HTML

url/accent/label (buildMusicHtml), videoUrl (applyVideo) were spliced
unescaped into HTML attributes and a text node."
```

---

### Task 9: Fix `ContextualEditors.jsx`'s `setAttr`/`setInnerText` (findings #3 + #10)

**Files:**
- Modify: `frontend/src/components/builder/ContextualEditors.jsx`

**Interfaces:**
- Consumes: `escAttr`, `escText` from `frontend/src/lib/escapeHtml.js` (Task 5).

- [ ] **Step 1: Migrate `setAttr` and `setInnerText`**

This file is JSX — implement + manual verification, no automated test (same constraint as Task 8).

In `frontend/src/components/builder/ContextualEditors.jsx`, find the top of the file:

```jsx
import React from "react";
```

Replace with:

```jsx
import React from "react";
import { escAttr, escText } from "@/lib/escapeHtml";
```

Then find:

```jsx
// Replace or add an attribute on the first tag of the fragment. If the
// attribute already exists anywhere, only the first occurrence changes.
export const setAttr = (html, attr, value) => {
  const re = new RegExp(`(<[a-zA-Z][^>]*?\\s)${attr}="[^"]*"`);
  if (re.test(html)) return html.replace(re, `$1${attr}="${value}"`);
  // Inject the attribute right after the opening tag name.
  return html.replace(/<([a-zA-Z][a-zA-Z0-9]*)/, `<$1 ${attr}="${value}"`);
};

// Replace the inner text between the first matching open/close tag.
export const setInnerText = (html, tag, text) => {
  const re = new RegExp(`(<${tag}[^>]*>)([\\s\\S]*?)(</${tag}>)`, "i");
  if (!re.test(html)) return html;
  return html.replace(re, `$1${text}$3`);
};
```

Replace with:

```jsx
// Replace or add an attribute on the first tag of the fragment. If the
// attribute already exists anywhere, only the first occurrence changes.
// `value` is escaped, and passed to String.replace as a replacer
// FUNCTION (not a raw string) — a raw-string second argument to
// String.replace interprets sequences like $&, $', $1 as replacement
// patterns rather than literal text, silently corrupting output if the
// user's value happens to contain one.
export const setAttr = (html, attr, value) => {
  const safe = escAttr(value);
  const re = new RegExp(`(<[a-zA-Z][^>]*?\\s)${attr}="[^"]*"`);
  if (re.test(html)) return html.replace(re, (_match, prefix) => `${prefix}${attr}="${safe}"`);
  // Inject the attribute right after the opening tag name.
  return html.replace(/<([a-zA-Z][a-zA-Z0-9]*)/, (_match, tag) => `<${tag} ${attr}="${safe}"`);
};

// Replace the inner text between the first matching open/close tag.
export const setInnerText = (html, tag, text) => {
  const safe = escText(text);
  const re = new RegExp(`(<${tag}[^>]*>)([\\s\\S]*?)(</${tag}>)`, "i");
  if (!re.test(html)) return html;
  return html.replace(re, (_match, open, _mid, close) => `${open}${safe}${close}`);
};
```

- [ ] **Step 2: Manual verification (no automated test — JSX, cannot be imported by plain Node)**

Read the two edited functions and confirm both changes independently:
- **Escaping (finding #3):** `value`/`text` are run through `escAttr`/`escText` before being spliced in, in every code path (both the "attribute exists" and "attribute doesn't exist yet" branches of `setAttr`).
- **Replacer-function fix (finding #10):** both `.replace(re, ...)` calls now pass a function, not a template string, as the second argument. Trace through a concrete example by hand: with the *old* code, `setInnerText("<p></p>", "p", "$'")` would call `"<p></p>".replace(/(<p[^>]*>)([\s\S]*?)(<\/p>)/i, "$1$'$3")` — here `$'` inside the replacement *string* is a special pattern meaning "everything after the match" (which is `""` in this case, but wouldn't be for a longer surrounding string), not the literal two characters `$` and `'` the user typed. With the *new* code, `text` (`"$'"`) is captured as a plain variable inside the arrow function and concatenated with template-literal `+`/backtick interpolation, which never re-parses it for `$`-patterns — so the literal value (after escaping) always lands verbatim.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/builder/ContextualEditors.jsx
git commit -m "Fix XSS and String.replace pattern corruption in setAttr/setInnerText

Both functions spliced user text into HTML unescaped (findings #3) and
passed it as a raw String.replace replacement string, where sequences
like \$&, \$', \$1 are special replacement-pattern syntax rather than
literal text (finding #10). Fixed by escaping the value and using a
replacer function instead of a replacement string."
```

---

### Task 10: Fix iframe sandbox self-defeat (finding #8)

**Files:**
- Modify: `frontend/src/pages/Builder.jsx`
- Modify: `frontend/src/components/builder/PaymentButtonModal.jsx`
- Modify: `frontend/src/components/builder/SocialShareModal.jsx`
- Modify: `frontend/src/components/builder/AddPageModal.jsx`

**Interfaces:**
- Consumes: none from other tasks in this plan (independent of the escaping work).

- [ ] **Step 1: Fix `Builder.jsx`'s live-preview iframe**

This is JSX — implement + manual verification, no automated test. All four edits in this task are one-line `sandbox` attribute changes plus (for `Builder.jsx`) a comment correction; verification is reading the resulting attribute value against the finding's reasoning below.

In `frontend/src/pages/Builder.jsx`, find:

```jsx
              {/* Sandbox intentionally allows scripts + same-origin because the content
                  is authored by the user and rendered via srcDoc (no cross-origin risk). */}
              <iframe
                title="live-preview"
                srcDoc={buildStandaloneHtml(project)}
                className="bg-white shadow-2xl border border-[#2B2B2B] transition-all"
                style={{
                  width: viewport === "mobile" ? "390px" : viewport === "tablet" ? "820px" : "1280px",
                  height: "100%",
                  minHeight: "600px",
                }}
                sandbox="allow-forms allow-same-origin allow-scripts"
                data-testid="preview-iframe"
              />
```

Replace with:

```jsx
              {/* allow-same-origin is intentionally NOT set: combined with
                  allow-scripts it would give this iframe's content (user-
                  authored, rendered via srcDoc) the app's real origin
                  instead of an opaque one — letting injected content reach
                  back into the live builder's DOM/localStorage via
                  window.parent. allow-scripts alone keeps the origin
                  opaque, which is what actually isolates it. */}
              <iframe
                title="live-preview"
                srcDoc={buildStandaloneHtml(project)}
                className="bg-white shadow-2xl border border-[#2B2B2B] transition-all"
                style={{
                  width: viewport === "mobile" ? "390px" : viewport === "tablet" ? "820px" : "1280px",
                  height: "100%",
                  minHeight: "600px",
                }}
                sandbox="allow-forms allow-scripts"
                data-testid="preview-iframe"
              />
```

- [ ] **Step 2: Fix `PaymentButtonModal.jsx`'s preview iframe**

Find:

```jsx
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
```

Replace with:

```jsx
              sandbox="allow-scripts allow-popups allow-forms"
```

- [ ] **Step 3: Fix `SocialShareModal.jsx`'s preview iframe**

Find:

```jsx
              sandbox="allow-scripts allow-same-origin"
```

Replace with:

```jsx
              sandbox="allow-scripts"
```

- [ ] **Step 4: Fix `AddPageModal.jsx`'s preview iframe**

Find:

```jsx
                sandbox="allow-same-origin allow-scripts allow-forms"
```

Replace with:

```jsx
                sandbox="allow-scripts allow-forms"
```

- [ ] **Step 5: Manual verification (no automated test — JSX, and a sandboxed iframe's origin-isolation behavior isn't observable from a Node script anyway)**

For each of the 4 files, confirm the `sandbox` attribute's value no longer contains `allow-same-origin`, and that every *other* flag that was present before (`allow-forms`, `allow-scripts`, `allow-popups`, as applicable per file) is still present — this task only removes `allow-same-origin`, it doesn't change what else these previews are allowed to do.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/Builder.jsx frontend/src/components/builder/PaymentButtonModal.jsx frontend/src/components/builder/SocialShareModal.jsx frontend/src/components/builder/AddPageModal.jsx
git commit -m "Drop allow-same-origin from srcDoc preview iframes

Combined with allow-scripts, allow-same-origin gave injected content in
these 4 preview iframes the app's real origin instead of an opaque one,
letting any of the XSS findings in this round reach back into the live
builder's DOM via window.parent. None of the four previews need
same-origin access — they're pure renders."
```

---

## After this plan

Run the full regression pass before opening a PR:
- Backend: `cd backend && .venv/bin/pytest tests/test_security_fixes.py tests/test_audit_fixes.py -v` — expect 15 (round 1) + 15 (this round) = 30 passing.
- Frontend: `node --test frontend/src/lib/__tests__/*.test.mjs` — expect 4 (escapeHtml) + 1 (forms) + 2 (commerce) + 1 (cart) + 1 (social) = 9 passing.
- The manually-verified JSX/exportHtml.js changes (Tasks 1, 5 step 10, 8, 9, 10) don't have automated coverage in this sandbox — flag this explicitly in the PR description as a known gap, same as round 1's PR did for `backend_test.py`.
