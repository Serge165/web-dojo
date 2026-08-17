# Audit Findings — Backend + Frontend Parallel Review

**Date:** 2026-08-17

**What was reviewed:** Two independent review agents ran in parallel.

- **Backend agent:** `backend/server.py`, `backend/starter_templates.py`,
  `backend/tests/backend_test.py` — for security and correctness issues in
  the FastAPI + MongoDB (Motor) backend.
- **Frontend agent:** `frontend/src/lib/**`, `frontend/src/components/builder/**`,
  `frontend/src/pages/Builder.jsx` (~14k lines) — for correctness bugs and
  XSS risk in the WYSIWYG website builder, given that it renders
  user-authored HTML both in its own canvas and in exported/published
  static sites.

Both agents were explicitly told this is a single-user, no-auth-by-design
local-first website builder, so "missing authentication" is not a valid
finding on its own.

**What was excluded as already-fixed (Tasks 2–5, this branch):** SSRF in
`POST /api/import/url` (incl. DNS-rebinding/CGNAT bypass and relative-redirect
resolution), CORS wildcard-with-credentials, hardcoded Stripe fallback key,
and Fernet key file permissions — all in `backend/server.py`. All findings
below were checked against `git log` on this branch to confirm they are
distinct from those fixes. All file:line references were spot-verified by
reading the cited code directly in this worktree.

---

## High severity — security

### 1. `/api/submissions` GET and DELETE have no default scope — any visitor of any exported site can read or wipe all form submissions across every project
**`backend/server.py:1029`** (`list_submissions`) and **`backend/server.py:1049-1052`** (`clear_submissions`)

```python
@api_router.delete("/submissions")
async def clear_submissions(form_name: Optional[str] = None):
    query = {"form_name": form_name} if form_name else {}
    res = await db.submissions.delete_many(query)
```

Why it matters: `/api/submissions` is necessarily public — exported static
sites POST form data to it directly from any visitor's browser, so the API
base URL is embedded in the page source of every published site (not a
secret). With no `form_name`/`project_id` filter, `GET /api/submissions`
lets anyone who ever viewed page source of *one* exported site enumerate
every form submission (names, emails, messages) across *every* project the
owner has ever built. `DELETE /api/submissions` with no filter is worse: a
bare unauthenticated `curl -X DELETE .../api/submissions` permanently wipes
the entire submissions collection for every project. This is a scoping bug
(an empty filter silently means "match everything"), not a missing-auth
issue — the fix is to require a non-empty filter, or reject the unscoped
call with 400.
**Severity: high** — found by: backend

### 2. Zero-decimal currency (JPY) miscalculated — a listed, reachable checkout flow overcharges customers 100x
**`backend/server.py:769`** (`_create_payment_link`) and **`backend/server.py:828`** (`_create_checkout_session`)

```python
unit_amount=int(round(round(amount, 2) * 100)),           # line 769
"unit_amount": int(round(round(it.amount, 2) * 100)),      # line 828
```

Why it matters: both Stripe amount builders unconditionally multiply by
100 to get the smallest currency unit. `GET /api/commerce/config`
explicitly lists `"jpy"` as a supported currency (`currencies` array,
`backend/server.py:781`), but JPY is a zero-decimal currency in Stripe —
`unit_amount` must be passed as-is, not ×100. A site owner creating a JPY
payment link/checkout for ¥500 actually creates a Stripe charge for
¥50,000. This is real financial harm through the app's normal, advertised
checkout path, not a theoretical edge case.
**Severity: high** — found by: backend

### 3. Free-text style/content fields render raw into the canvas and exported sites — persistent XSS via ordinary form fields
**`frontend/src/components/builder/ContextualEditors.jsx:68-80`** (`setAttr` / `setInnerText`, used by every "Label"/"Alt text"/"Source URL" field in the Style Inspector, wired at `ContextualEditors.jsx:162,195,198`)

Why it matters: user-typed values (e.g. an image alt-text field) are
spliced into HTML with zero escaping, then rendered via
`dangerouslySetInnerHTML` in the canvas and baked verbatim into
exported/published static sites. Typing
`<img src=x onerror=alert(document.domain)>` into what looks like a plain
text field produces persistent XSS for every visitor of the exported site.
**Severity: high** — found by: frontend

### 4. `exportHtml.js`'s `<title>` is the one place the file's own escaping helper isn't used — trivial stored XSS via project name
**`frontend/src/lib/exportHtml.js:36`** (`pageTitle`), emitted unescaped at **`:59`** and **`:109`**: `` <title>${pageTitle(project)}</title> ``

Why it matters: `exportHtml.js` already defines and uses `escAttr` for
every other meta field (description, keywords, canonical, OG tags — see
`exportHtml.js:15-33`), but `pageTitle`, driven by the free-text project
name field (`TopBar.jsx:58-59`), is emitted with no escaping at all.
Naming a project `</title><script>...</script>` breaks out of `<title>`
and executes in every exported/published page.
**Severity: high** — found by: frontend

### 5. Commerce block builders interpolate free-text fields unescaped into HTML attributes — stored XSS in payment/checkout and cart blocks
**`frontend/src/lib/commerce.js:10-16`** (`stripeButtonHtml`) and **`:20-46`** (`paypalButtonHtml`); **`frontend/src/lib/cart.js:10`** (`buildAddToCartButton`)

Why it matters: `label`, `url`, `accent`, `clientId` (commerce.js) and
`name`/`image` (cart.js) are spliced unescaped into `href`/`<script src>`/
`data-*` attributes. These are driven by ordinary free-text inputs
(`PaymentButtonModal.jsx:93,46-47`; `CommerceTab.jsx:27` — `pName.trim()`,
`pImg.trim()`). A `"` in a button label or product name breaks out of the
attribute and injects an event handler or script into the exported
checkout/storefront page. Notably, `cart.js`'s own *runtime* script escapes
correctly via an internal `esc()` — only the build-time HTML emitter
doesn't, suggesting an inconsistency rather than an intentional decision.
**Severity: high** — found by: frontend

---

## Medium severity — security

### 6. Unsanitized publish filenames allow path traversal via FTP/SFTP
**`backend/server.py:571-572`** (`PublishRequest.html_filename`/`.css_filename`), **`:698-701`** (used to build the files dict), **`:645`** (`_ftp_upload`'s `STOR {name}`), **`:677`** (`_sftp_upload`'s `sftp.open(name, "wb")`)

Why it matters: filenames are free text with no rejection of `/`, `..`, or
a leading slash before being used verbatim as the remote target name. A
value like `../../../public_html/other-site/index.html` (or an absolute
path) is passed straight to `STOR`/`sftp.open`, writing outside the
configured `remote_path` — e.g. overwriting a sibling site on shared
hosting, or, for SFTP (often broader filesystem access), writing outside
the web root entirely. Reachable not just by direct API misuse but via a
maliciously crafted imported project/publish preset with a poisoned
filename, triggered the next time the owner clicks Publish. (Confirmed
this is traversal only, not FTP command injection — `ftplib` already
rejects embedded CR/LF.) Fix direction: require filenames to be a plain
basename with no `/`, `\`, or leading `.`.
**Severity: medium** — found by: backend

### 7. No request-size limit on the intentionally-public `/api/submissions` endpoint — resource exhaustion
**`backend/server.py:964-999`** (`_extract_submission`) and **`:1013-1025`** (`create_submission`)

Why it matters: `_extract_submission` calls `await request.json()` /
`await request.form()` with no `Content-Length` ceiling or field/file caps
anywhere in the app. Since this endpoint is reachable by anonymous internet
visitors by design (see finding #1), an attacker can POST an arbitrarily
large body that gets fully buffered/parsed before any validation runs. The
codebase already applies this discipline elsewhere (`/api/import/url`
truncates responses to `r.text[:2_000_000]`, `server.py:935`) but not here.
Fix direction: enforce a body-size ceiling before parsing.
**Severity: medium** — found by: backend

### 8. iframe previews combine `allow-scripts` + `allow-same-origin`, defeating the sandbox for `srcDoc` content
**`frontend/src/pages/Builder.jsx:628-629,639`**, `PaymentButtonModal.jsx:134`, `SocialShareModal.jsx:170`, `AddPageModal.jsx:106`

Why it matters: combining these two sandbox flags on an `srcDoc` iframe
gives the iframe's content the app's real origin instead of an opaque one,
so any of the XSS injection points above (findings #3–#5) would execute
with `window.parent` DOM/localStorage access to the live builder app, not
just inside an inert preview. The code comment at `Builder.jsx:628-629`
("no cross-origin risk") reflects the wrong threat model — the risk is the
iframe reaching back into the parent, not cross-origin framing;
`allow-scripts` alone (opaque origin) would isolate it correctly. No
client-side auth/session token exists today to steal (no
cookie/token-based auth found), which caps immediate blast radius, but it
still lets injected preview content manipulate the live app DOM and call
backend endpoints as the app itself.
**Severity: medium** — found by: frontend

### 9. Other unescaped free-text-to-HTML interpolation sites (same root cause as #3–#5, lower usage/exposure)
- **`frontend/src/lib/social.js:69-70`** — in "follow" mode, a user-entered
  profile URL is inserted unescaped into `href="${href}"` (the "share" mode
  paths are safe — they only use built-in platform templates).
- **`frontend/src/components/builder/BackgroundMediaPanel.jsx:25-40`**
  (`buildMusicHtml`) and **`:68-78`** (`applyVideo`) — `label`,
  `url`/`videoUrl` interpolated unescaped, reachable via the panel's
  free-text Music/Video URL and button-label fields.
- **`frontend/src/lib/exportHtml.js:4-11`** (`buildFontLinks`), fed by a
  free-text Google Font name input (`LeftSidebar.jsx:208`) — spliced
  unescaped into a `<link href="...">` in the exported `<head>`.

Why it matters: same failure mode as findings #3–#5 (unescaped user text
into exported HTML attributes/text nodes) — grouped here as medium because
the fields are lower-traffic/less obviously attacker-steerable than the
canvas text fields or commerce blocks, but the fix is identical and should
be done together with #3–#5.
**Severity: medium** — found by: frontend

---

## Correctness bugs (non-security)

### 10. `setAttr`/`setInnerText` pass user text as a `String.replace` replacement pattern, corrupting output on special substrings
**`frontend/src/components/builder/ContextualEditors.jsx:70,79`**

Why it matters: both functions pass the value being inserted as the second
(replacement) argument to `String.prototype.replace()`, where sequences
like `$&`, `` $` ``, `$'`, `$1` are special replacement patterns, not
literal text. If a user's typed value contains one of these — e.g. setting
an image's Alt text to `$'` — the resulting HTML is silently corrupted by
splicing in unrelated parts of the surrounding string instead of the
literal text the user typed. Concrete, easily-triggered data-corruption
bug, independent of the XSS issue in the same functions (finding #3).
**Severity: medium (correctness)** — found by: frontend

---

## Quality / dead-code notes (not fixed, flagged for follow-up)

- **Duplicated "add class to first/root tag" logic:**
  `addClassToFirstTag` (`frontend/src/pages/Builder.jsx:50-58`) and
  `addClassToRootTag` (`frontend/src/components/builder/TextEffectsPanel.jsx:76-84`)
  are near-identical reimplementations maintained independently in two
  files. — found by: frontend
- **Three separate, non-shared HTML-escaping implementations:**
  `forms.js`'s `escape`, `exportHtml.js`'s `escAttr`, and `cart.js`'s inline
  runtime `esc()` all do the same thing but none is exported for reuse —
  very likely why `commerce.js`, `social.js`, `cart.js`'s build-time
  functions, and `BackgroundMediaPanel.jsx` never escape their interpolated
  input while `forms.js` does (see findings #3–#5, #9: consolidating into
  one shared, always-used escaping utility would fix all of them at once).
  — found by: frontend
- **`backend/starter_templates.py`:** reviewed and found clean — pure
  static curated HTML/CSS template data (28 templates, all IDs verified
  unique), no dynamic construction from user input, no issues.
  — found by: backend
- Nothing using `eval`/`new Function` was found anywhere in the reviewed
  frontend trees. No NoSQL-injection, FTP command-injection (CRLF is
  rejected by `ftplib` itself), or SEO-escaping issues were found in the
  reviewed backend code.

---

## Next step

Next step: brainstorm a follow-up plan for the high/medium items above
before starting the Tauri desktop-packaging project.
