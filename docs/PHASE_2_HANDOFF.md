# Web Dojo Phase 2 — Handoff Document

> **For:** The next AI model or developer picking up this codebase.
> **Date:** 2026-08-26
> **Authoring model:** DeepSeek V4 Pro
>
> Explains what existed before Phase 2, what was added, and how it was implemented.

---

## 1. Before State

### `NewProjectWizard.jsx` (Phase 1)

A three-step onboarding modal built with Radix Dialog (shadcn/ui):

- **Step 1:** 2-column grid of template cards. Click selects the template and resets
  name + SEO to that template's homepage defaults. No version info, no changelog.
- **Step 2:** Single-column form: project name + 7 SEO fields (title, description,
  keywords, canonical, OG type, schema type, OG image URL). No validation, no preview.
- **Step 3:** Read-only review showing template name, project name, and SEO summary.
- **Footer:** Back/Cancel + Next/Create → `onCreate({ tpl, name, seo })`.

### `starterTemplates.json`

57 template objects with keys:
```
id, name, description, thumbnail, is_starter, aesthetic, data, created_at
```
No version, changelog, or deprecation metadata.

### Existing utility libs (unused in wizard)

- **`seoScore.js`** — `computeSeoChecks({ seo, elements })` → `{ checks[], score }`
  (0–100 weighted score). `scoreColor(score)` → Tailwind color class.
- **`seoFieldChecks.js`** — `truncateForSerp()`, `truncateDescriptionForSerp()`,
  `titleCountColor()`, `descriptionCountColor()`.

### Test file

6 tests: open on step 1, SEO auto-fill, stepper, back/cancel, template switch, closed
state. Radix Dialog mocked to a pass-through.

---

## 2. What Changed

| File | Before | After | Delta |
|------|:------:|:-----:|:-----:|
| `NewProjectWizard.jsx` | 138 lines | 491 lines | +353 |
| `NewProjectWizard.test.jsx` | 98 lines | 191 lines | +93 |
| `starterTemplates.json` | 8,306 lines | ~9,800 lines | +~1,500 |

### Architecture

- **No new files.** Three new internal sub-components added inside `NewProjectWizard.jsx`:
  `TemplateVersionBadge`, `SEOValidator`, `SearchResultPreview`.
- **No new dependencies.** All imports use existing packages (shadcn/ui, lucide-react,
  existing `@/lib/*` utils).
- **Public API unchanged:** `export const NewProjectWizard = ({ open, onClose, onCreate })`.
- Step 2 layout changed from single column to **2-column grid** (left: form + validation;
  right: SERP preview + template info).
- All tests pass: 27 suites, 209 tests, 0 failures. Build succeeds.

---

## 3. Feature #1: Template Versioning

### What it does

Each template card in step 1 now shows:
- **Version badge** (e.g. `v2.1.0`) — green (≤7 days old), amber (>90 days), gray (default).
- **Last updated** — "Updated today" / "Updated 3d ago" for recent; full date for older.
- **Deprecation warning** — red alert if `deprecationWarning` is truthy.
- **Changelog toggle** — click to expand/collapse version history entries.

Step 3 review also shows version badge next to the template name.

### How it was done

**Data:** Python script added `version`, `lastUpdated`, `changelog`, `deprecationWarning`
to all 57 template objects in `starterTemplates.json`. 2 templates (MySpace Throwback,
GeoCities) marked deprecated. All 57 have changelog arrays.

**`TemplateVersionBadge` component (lines 64–130):**

```javascript
const TemplateVersionBadge = ({ template }) => {
  const [showChangelog, setShowChangelog] = useState(false);
  const ageDays = daysAgo(template.lastUpdated);
  const isRecent = ageDays <= 7;
  const isStale = ageDays > 90;
  // Renders: Badge (version) + date text + optional deprecation Alert + changelog button
};
```

- `formatDate(iso)` — formats to "Aug 15, 2026" via `toLocaleDateString("en-US", …)`.
- `daysAgo(iso)` — `Math.floor((Date.now() - new Date(iso)) / 86400000)`.
- Badge uses shadcn `Badge variant="outline"` with conditional Tailwind color classes.
- Changelog is a local `useState` toggle. `e.stopPropagation()` on click prevents
  template selection.
- Deprecation uses shadcn `Alert variant="destructive"` with `AlertTriangle` icon.

**Rendered separate from the clickable `<button>`** so changelog toggle works independently.

### Fallbacks

- Missing version → `"1.0.0"`. Missing lastUpdated → empty. `daysAgo(null)` → 0.

---

## 4. Feature #5: SEO Validation on Create

### What it does

In step 2, below the SEO form, a live validation panel shows:
- **Overall SEO score** (e.g. "45/100") color-coded via `scoreColor()`.
- **Character/entity counts** for title, description, keywords with ideal ranges.
- **7 checklist items** with ✓ pass / ⚠ warn / ✗ fail icons and detail text.

All update in real time as the user types.

### How it was done

**`SEOValidator` component (lines 132–185):**

```javascript
const SEOValidator = ({ seo }) => {
  const { checks, score } = useMemo(() => computeSeoChecks({ seo }), [seo]);
  // Computes: titleLen, descLen, keywordCount from seo strings
  // Colors: titleCountColor(), descriptionCountColor() from seoFieldChecks.js
  // Renders: score display + field counts + individual checks (weight > 0 only)
};
```

- `useMemo([seo])` avoids recomputing on unrelated renders (e.g. device toggle).
- Reuses `computeSeoChecks({ seo })` from `seoScore.js` — same function the export guard
  and main builder SEO panel use.
- Keywords count: `seo.keywords.split(",").map(k => k.trim()).filter(Boolean).length`.
- Only renders checks with `weight > 0` (skips template placeholders check).

### Edge cases

- Missing title → "No title set." displayed with ✗ in red.
- Empty keywords → 0 count, red, ideal: 3–7.
- Empty description → "No description set." with ✗ in red.
- Only `seo` passed (not `elements`), so image/content checks show "No images"/"0 words" —
  this is correct since template hasn't been scaffolded yet.

---

## 5. Feature #6: Mobile-First Preview Toggle

### What it does

In step 2, the right column shows:
- **Device toggle** — 📱 Mobile / 📱 Tablet / 💻 Desktop with indigo active highlight.
  Mobile selected by default.
- **Google SERP simulation** — white card with URL breadcrumb, blue title link (font-size
  adjusts per device), gray meta description snippet.
- **Template info card** — name, version, aesthetic tag.

### How it was done

**State:** `const [previewDevice, setPreviewDevice] = useState("mobile");`  
Reset to `"mobile"` on wizard open.

**`SearchResultPreview` component (lines 187–223):**

```javascript
const SearchResultPreview = ({ seo, device }) => {
  const title = seo.title || "Untitled";
  const description = seo.description || "";
  const url = seo.canonical || "www.yoursite.com";

  // Mobile: title caps at 55 chars, desc at 110 chars
  // Desktop: uses truncateForSerp / truncateDescriptionForSerp (60/160 chars)
  const titleDisplay = device === "mobile"
    ? truncateForSerp(title.length > 55 ? title.slice(0, 55) : title)
    : truncateForSerp(title);
  const descDisplay = device === "mobile"
    ? truncateDescriptionForSerp(description.length > 110 ? description.slice(0, 110) : description)
    : truncateDescriptionForSerp(description);

  return (
    <div className={`bg-white rounded p-3 ${device === "mobile" ? "max-w-[375px]" : "max-w-[600px]"}`}>
      <div className="text-[11px] text-[#202124]">{url} ›</div>
      <a style={{ fontSize: device === "mobile" ? "14px" : "18px" }} className="text-[#1a0dab]">{titleDisplay}</a>
      <p style={{ fontSize: device === "mobile" ? "12px" : "13px" }} className="text-[#4d5156]">
        {descDisplay || "No meta description set. Google will generate one."}
      </p>
    </div>
  );
};
```

**Device toggle buttons** use lucide-react `Smartphone`, `Tablet`, `Monitor` icons.
Active state: `bg-indigo-600/30 text-indigo-300 border-indigo-500/50`.

### Fallbacks

- No canonical → `"www.yoursite.com"`. No description → fallback text. No title → `"Untitled"`.

---

## 6. Test Coverage

16 tests total (6 original + 10 new):

| Test | Feature |
|------|---------|
| Template cards show version badges | #1 |
| Deprecated templates show a warning | #1 |
| Changelog button toggles version history | #1 |
| Step 3 review shows template version badge | #1 |
| Step 2 shows SEO validator with score | #5 |
| SEO score updates when fields change | #5 |
| SEO check for keywords reflects input | #5 |
| Step 2 shows device preview toggle buttons | #6 |
| Search result preview shows SEO title and description | #6 |
| Device toggle switches preview sizing | #6 |

Run: `cd frontend && CI=true npx craco test --watchAll=false --testPathPattern="NewProjectWizard"`

Full suite: 27 suites, 209 tests, 0 failures.

---

## 7. Key Functions Reference

```javascript
// Template helpers (in NewProjectWizard.jsx)
formatDate("2026-08-15")          // → "Aug 15, 2026"
daysAgo("2026-08-20")             // → 6 (relative to Aug 26)

// SEO validation (from seoScore.js)
const { checks, score } = computeSeoChecks({ seo });
// checks[] → [{ id, label, weight, status: "pass"|"warn"|"fail", detail }]
// score   → 0–100

// SERP truncation (from seoFieldChecks.js)
truncateForSerp("Very long title exceeding 60 chars...")  // → "…" at 57
truncateDescriptionForSerp("Long desc...")                 // → "…" at 157

// Color helpers
titleCountColor(55)               // → "text-emerald-500"
descriptionCountColor(140)        // → "text-amber-500"
scoreColor(85)                    // → "text-emerald-500"
```

---

## 8. Data Flow

```
Step 1: selectTpl(id)
  └─> setTplId → tpl (useMemo[STARTER_TEMPLATES, tplId])
  └─> setName(t.name)
  └─> setSeo(autoSeo(t, t.name))    // reads t.data.pages[0].seo

Step 2: updateSeo({ title: "..." })
  └─> setSeo(s => ({ ...s, ...patch }))
  └─> SEOValidator re-computes (useMemo[seo])
  └─> SearchResultPreview re-renders

Step 3: create()
  └─> onCreate({ tpl, name, seo })
  └─> onClose()
```

---

## 9. Known Gaps

### Not yet implemented (from Phase 2 spec)

| Feature | Status | What's needed |
|---------|--------|---------------|
| #2 Template Previews | Scaffold ready | Device toggle + right column exist. Need preview HTML files and iframe. |
| #3 Industry Starter Kits | Not started | Need industry metadata + filter UI in step 1. |
| #4 Component Suggestions | Not started | Needs component catalog infrastructure. |
| Backend endpoints | Not started | `/api/templates/{id}/versions`, upgrade endpoint, industry recommendations. |

### Version data quality

55 templates have curated version data. 2 retain defaults (v1.0.0, June 2026). In
production, version data would come from a backend API, not static JSON.

### SEO score in wizard

`computeSeoChecks` is called with `{ seo }` only (no `elements`), so image alt text and
content length checks always show "No images" / "0 words". This is correct — the template
hasn't been scaffolded yet. The score will improve after scaffolding when elements exist.

---

## 10. All Changed Files

| File | Action |
|------|--------|
| `frontend/src/components/builder/NewProjectWizard.jsx` | Rewritten — 3 new sub-components, 2-col step 2 |
| `frontend/src/components/builder/NewProjectWizard.test.jsx` | Expanded — 10 new tests |
| `frontend/src/data/starterTemplates.json` | Modified — versioning metadata on 57 templates |
| `docs/PHASE_2_HANDOFF.md` | Created — this document |
