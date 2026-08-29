# Phase 2: Save/Save As Fix — Before & After

## Problem Summary

**Symptom:** User saves a project; on next load, recent page edits appear lost.

**Root Cause:** The `project` object (line 273, `Builder.jsx`) was built from React state
variables including `pages`. But `pages` is only synchronised with the active page's
edits during page-switch operations (`switchPage`, `newPage`, `addPageFromLayout`).
When a user edits a page and clicks Save without switching pages first, `pages` still
held the pre‑edit snapshot. The backend then stored a stale `pages` array alongside
current legacy top‑level fields (`elements`, `head_html` etc.). Since the loader
prefers `pages` over legacy fields, the user's latest edits were lost on reload.

**Additional gap:** There was no "Save As" functionality — no way to create a
copy of the current project under a new name.

---

## Files Changed

### 1. `frontend/src/pages/Builder.jsx`


**Before (lines 753‑769):**
```js
const persist = async (silent) => {
    setSaveStatus("saving");
    try {
      if (projectId) {
        await axios.put(`${API}/projects/${projectId}`, project);
      } else {
        const res = await axios.post(`${API}/projects`, project);
        setProjectId(res.data.id);
      }
      setSaveStatus("saved");
      if (!silent) toast.success("Project saved");
    } catch (e) {
      setSaveStatus("error");
      if (!silent) toast.error("Save failed");
      console.error(e);
    }
  };
```

⬇️ **After (lines 753‑787):**
```js
const persist = async (silent) => {
    setSaveStatus("saving");
    const mergedPages = pages.map((p) =>
      p.id === activePageId
        ? { ...p, elements, head_html: headHtml, canvas_bg: canvasBg, fonts, custom_js: customJs }
        : p
    );
    const savePayload = {
      id: projectId, name: projectName,
      elements, head_html: headHtml, canvas_bg: canvasBg, fonts, files, custom_js: customJs,
      seo: activePage?.seo || {},
      pages: mergedPages, active_page_id: activePageId, template, analytics,
    };
    try {
      if (projectId) {
        await axios.put(`${API}/projects/${projectId}`, savePayload);
      } else {
        const res = await axios.post(`${API}/projects`, savePayload);
        setProjectId(res.data.id);
      }
      setSaveStatus("saved");
      if (!silent) toast.success("Project saved");
    } catch (e) {
      setSaveStatus("error");
      if (!silent) toast.error(`Save failed${e.response ? ` (${e.response.status})` : ""}`);
      console.error("Save error:", e?.response?.data || e?.message || e);
    }
  };
```

**What changed:**
- `project` snapshotted via stale `pages` → mergedPages built fresh inside `persist`
- Better error logging shows HTTP status codes on failure
- Autosave (`persist(true)`) and manual Save (`persist(false)`) both benefit

---


#### 1b. New `saveAs()` function (lines 790‑818)

**Before:** No "Save As" existed.

**After:**
```js
const saveAs = async () => {
    const newName = prompt("Save a copy as…", projectName + " (copy)");
    if (!newName) return;
    clearTimeout(autosaveTimerRef.current);
    const mergedPages = pages.map((p) =>
      p.id === activePageId
        ? { ...p, elements, head_html: headHtml, canvas_bg: canvasBg, fonts, custom_js: customJs }
        : p
    );
    const savePayload = {
      id: null,  // forces POST → new project
      name: newName,
      elements, head_html: headHtml, canvas_bg: canvasBg, fonts, files, custom_js: customJs,
      seo: activePage?.seo || {},
      pages: mergedPages, active_page_id: activePageId, template, analytics,
    };
    setSaveStatus("saving");
    try {
      const res = await axios.post(`${API}/projects`, savePayload);
      setProjectId(res.data.id);
      setProjectName(newName);
      setSaveStatus("saved");
      toast.success(`Saved as "${newName}"`);
    } catch (e) {
      setSaveStatus("error");
      toast.error(`Save As failed${e.response ? ` (${e.response.status})` : ""}`);
      console.error("Save As error:", e?.response?.data || e?.message || e);
    }
  };
```

---

#### 1c. `ensureSaved()` and `share()` — same stale‑pages fix

Both functions used the stale `project` object. Now they build a payload
with merged pages, identical to the `persist()` fix above. The `ensureSaved`
function (used by the Publish modal) and the `share` function (copies a preview
URL after saving) both benefit from this correction.

---

#### 1d. Keyboard shortcut: `Ctrl+Shift+S` → Save As (lines 994‑999)

**Before:**
```js
if (meta && e.key.toLowerCase() === "s") { e.preventDefault(); save(); return; }
```

**After:**
```js
if (meta && e.key.toLowerCase() === "s" && e.shiftKey) { e.preventDefault(); saveAs(); return; }
if (meta && e.key.toLowerCase() === "s") { e.preventDefault(); save(); return; }
```

Placed **before** the plain `s` handler so Ctrl+Shift+S is matched first.

---

#### 1e. Command palette: `save-as` entry (line 1026)

**Before:** Only `{ id: "save", … onRun: save }` existed.
**After:** `{ id: "save-as", label: "Save As…", shortcut: "Ctrl+Shift+S", icon: Save, onRun: saveAs }`

---

#### 1f. TopBar & MenuBar prop wiring (lines 1087, 1101)

**Before:** `onSave={save}` only.
**After:** `onSave={save} onSaveAs={saveAs}` on both components.

---


### 2. `frontend/src/components/builder/TopBar.jsx`

#### 2a. Imports & state

- Added `useEffect` to React import (line 1)
- Added `onSaveAs` prop (line 12)
- Added `saveDropdownOpen` state + `saveDropdownRef` (lines 27‑28)
- Added `useEffect` for outside‑click / Escape to close the dropdown (lines 30‑40)

#### 2b. Split Save button with dropdown

**Before (line 158):**
```jsx
<button onClick={onSave} ... data-testid="save-btn"><Save size={12} /> Save</button>
```

**After (lines 158‑168):**
```jsx
<div className="relative inline-flex rounded-md" ref={saveDropdownRef}>
  <button onClick={onSave} className="...rounded-l-md..." data-testid="save-btn">
    <Save size={12} /> Save
  </button>
  <button onClick={() => setSaveDropdownOpen(!saveDropdownOpen)}
          className="...rounded-r-md..." data-testid="save-dropdown-btn">
    <ChevronDown size={12} />
  </button>
  {saveDropdownOpen && (
    <div className="absolute top-9 right-0 ...">
      <button onClick={() => { setSaveDropdownOpen(false); onSaveAs && onSaveAs(); }}
              data-testid="save-as-btn">
        <Save size={12} /> Save As…
      </button>
    </div>
  )}
</div>
```

---

### 3. `frontend/src/components/builder/MenuBar.jsx`

#### 3a. Props (line 9)
**Before:** `onNew, onOpen, onSave,`
**After:** `onNew, onOpen, onSave, onSaveAs,`

#### 3b. File menu (lines 35‑36)
**Before:**
```js
{ label: "Save", shortcut: "Ctrl+S", onClick: onSave },
```
**After:**
```js
{ label: "Save", shortcut: "Ctrl+S", onClick: onSave },
{ label: "Save As…", shortcut: "Ctrl+Shift+S", onClick: onSaveAs },
```

---

## Verification Checklist

- [x] `Ctrl+S` saves now merge active page into payload
- [x] `Ctrl+Shift+S` opens prompt → new project created → name/ID updated in state
- [x] TopBar Save ▼ dropdown shows "Save As…"
- [x] MenuBar File → Save As… works
- [x] Command palette (Ctrl+K) shows "Save As… Ctrl+Shift+S"
- [x] `share()` (copy preview URL) sends merged pages
- [x] `ensureSaved()` (publish) sends merged pages
- [x] Error toasts now include HTTP status codes for easier debugging
- [x] Autosave timer continues to work; `project` stale-closure issue eliminated

---

## How to Test (manual)

1. Start the backend: `cd backend && source .venv/bin/activate && python server.py`
2. Start the frontend: `cd frontend && npm start`
3. Create a new project, add a block
4. **Save** (Ctrl+S or green button) — see "Project saved" toast
5. Add more blocks, save again, **reload** → all blocks should be present
6. **Save As** (Ctrl+Shift+S, or Save ▼ dropdown, or MenuBar File → Save As…)
   → prompt → enter new name → new project created → working in copy
7. **Share** button → URL in clipboard → opening it shows current project state
8. **Publish** button → saves merged state before publishing

---

## Production Readiness

| Aspect | Status |
|--------|--------|
| Page-merge logic correct | ✅ Active page always reflected in saved pages |
| Backward compat | ✅ Legacy elements/head_html still included |
| Autosave unaffected | ✅ Timer still debounces on saveWatch |
| Error handling | ✅ HTTP status in toast + structured console.error |
| UI/UX | ✅ Save As accessible from 3 surfaces (button, menu bar, shortcut) |
| No new dependencies | ✅ All code is vanilla React + existing axios |
| No breaking API changes | ✅ Payload shape identical; backend unchanged |

#### 1a. `persist()` — merge active page into `pages` before saving