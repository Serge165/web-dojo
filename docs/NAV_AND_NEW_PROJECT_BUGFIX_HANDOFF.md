# Web Dojo — Nav Consistency + "New Project" Modal: Handoff

**Status as of this write: both bugs fixed, tested, and verified. Bug 1 (nav
unification) plus the footer follow-up below are now committed** (nav/footer unify +
edit-propagation functions in `BlockEditMenu.jsx`, their tests, and their wiring in
`Builder.jsx`'s `addPageFromLayout`/`editHtml`). **Bug 2 (the "New project" modal fix)
is still NOT committed** — it's a one-line change described below, left uncommitted
because it's unrelated to the nav/footer work and wasn't part of that commit's scope.
Run `git status` before touching anything; the working tree still carries an entire
separate uncommitted feature (Exported-Site Login Dashboard — see
`docs/DASHBOARD_LOGIN_HANDOFF.md`, which is itself still uncommitted), plus the
`startFromWizard` "Option B" hand-picked-layouts wiring for nav/footer unify (that one
line is entangled with the larger, separate, uncommitted wizard rewrite and was left
out of the commit for that reason — see `startFromWizard` in `Builder.jsx` if picking
this back up). `Builder.jsx` in particular still has diffs from multiple efforts mixed
together. Do not blindly `git add -A && git commit` without reading the diff — split
into separate commits if that matters to the user.

If you are a different AI/session picking this up cold: **do not trust any claim in
this doc about code being "done" without opening the file and checking it yourself.**
Treat it as a pointer, not ground truth.

## Bug 1 — Navbar showed stale demo items and differed page to page

**Report:** in project `wdj-test-5-pwikl`, the navbar had leftover demo/placeholder
menu items mixed in with real page names, and different pages showed different navs.

**Root cause:** multi-page projects built from several donor layouts — the wizard's
"pick your own pages" mode, and repeated "Add Page from Layout" — each pulled in that
donor layout's own `<nav>` block untouched. Every donor's own demo items survived
forever, and every page showed whatever nav its own donor happened to have, never
reconciled against the other pages. The existing `syncNavForNewPage` helper only
*appended* links to other pages' navs when a page was added; it never rebuilt or
deduplicated anything, and `startFromWizard`'s multi-layout path had **no** nav
reconciliation at all.

**Fix:** added `unifyNavAcrossPages(pages)` to
`frontend/src/components/builder/BlockEditMenu.jsx` (uses existing `parseNavbarTree` /
`setNavbarItems` / `pageHref` helpers already in that file). It picks the first page's
nav as canonical markup, builds one item list from the actual page names/slugs, and
stamps that same nav onto every page that has one — replacing, not merging with,
whatever items were there. Wired into both call sites that create multi-page projects:
`addPageFromLayout` and `startFromWizard` (only for the "Option B" hand-picked-layouts
path — a single starter template's pages already share one coherent nav by
construction, so that path is untouched). The old `syncNavForNewPage` helper was
deleted (fully superseded).

**Verified:** new unit test in `BlockEditMenu.test.jsx` (TDD — confirmed it failed
before the function existed, passed after). Full frontend suite: 541/541 passing, 39
suites, zero regressions.

**Known limitation — not fixed:** this only affects newly created pages/projects going
forward. The user's already-broken `wdj-test-5-pwikl` project is not retroactively
repaired. A one-off migration script (load project → call `unifyNavAcrossPages` on its
pages → save) was offered to the user but not built — **do this if asked.**

### Follow-up (later session, same day) — footer was never covered, and edits re-diverged pages

`unifyNavAcrossPages` above only ran at page-creation time, and only for `<nav>`. Two
gaps remained, both closed in a later session that day:

1. **Footer had no unification at all**, at creation or otherwise — donor layouts'
   footers diverged across pages the same way navs used to. Fixed by
   `unifyFooterAcrossPages(pages)`, added next to `unifyNavAcrossPages` in the same file
   (`BlockEditMenu.jsx`). Same pattern, but stamps page 1's footer markup verbatim onto
   every other page's footer block — no per-page link derivation needed (footers don't
   carry per-page nav items the way navs do). Wired into the same two call sites as the
   nav fix: `addPageFromLayout` and `startFromWizard`.
2. **Editing the navbar or footer after creation re-diverged the pages.** Both
   unify functions only ran once, at creation. `Builder.jsx`'s `editHtml(id, html)` —
   the single path every block editor (including `NavbarEditor`) funnels edits through —
   only ever wrote into the currently-open page's own `elements` array, with no
   awareness of sibling pages. So even a freshly-unified project drifted apart again the
   moment someone edited the nav. Fixed by `propagateSharedBlockEdit(pages, activePageId,
   html)`, also in `BlockEditMenu.jsx`: when a saved edit's HTML is a `<nav>` or
   `<footer>`, it mirrors that HTML onto every other page's matching block.
   `editHtml()` now calls it on every edit.

This was prompted by a since-corrected uploaded doc (`SHARED_LAYOUT_COMPONENTS_FIX.md`)
that proposed an unrelated, fictional rewrite (a class-based `HTMLExporter.js` /
`framework_export.py` exporter pair that doesn't exist in this repo) — the real fix
above just extends the existing `unifyNavAcrossPages` pattern instead. There is also a
real, working, separate opt-in mechanism for shared layout
(`project.template.use_template` / `header_html` / `footer_html`, edited via
`TemplateEditor.jsx`, applied in `_build_multi_page_bundle` / `buildMultiPageExport`) —
it defaults off and nothing here changed that; making it the default instead of
per-page block copies would be a separate, larger design decision, not a bug fix.

**Verified:** 3 new unit tests in `BlockEditMenu.test.jsx` (unify-footer, and the new
propagate helper); full suite for that file 75/75 passing, `NewProjectWizard.test.jsx`
20/20 unaffected.

**Known limitation — still not fixed:** same as Bug 1 above — only affects pages/edits
going forward, not already-broken existing projects.

## Bug 2 — "New project" always showed an old modal that just restarts blank

**Report:** the intended three-choice "New project" picker (blank canvas / from
template / wizard) never appeared. Instead "the old modal from one of the first
iterations" showed up and always started a brand-new blank project with no way to pick
a template or run the wizard.

**Root cause:** confirmed by reading the actual click handlers, not guessed. Clicking
"New project" (`newProject()` in `Builder.jsx`) checks `saveStatus`. If there are no
unsaved changes (`"idle"`/`"saved"`) it opens the real three-card picker,
`NewProjectModal` (`frontend/src/components/builder/NewProjectModal.jsx` — this
component is correct and was never the problem). But if `saveStatus` is `"unsaved"` or
`"error"` — which is true almost the entire time someone is actively using the builder
— it instead opens a plain `AlertDialog` ("Discard unsaved changes?", `Builder.jsx`
~line 1580). That dialog's "Discard & start new" button called
`window.location.reload()` **directly**, never opening `NewProjectModal` at all. So the
three-choice picker was, in practice, unreachable — every session that had touched
anything just reloaded straight to a blank project. The plainer-styled `AlertDialog` is
almost certainly what read as "the old modal from one of the first iterations."

**Fix:** one-line change in `Builder.jsx` — "Discard & start new" now does
`setNewProjectConfirmOpen(false); setNewProjectOpen(true);` instead of reloading,
which correctly hands off to the real three-choice `NewProjectModal`. (The "Blank
project" card inside that modal still reloads the page — that's fine and intentional,
since by that point the user has already confirmed discarding unsaved work.)

**Verified:** no existing test covered this path (full suite still 541/541, unchanged).
Reproduced the bug and confirmed the fix live against the running dev server
(`localhost:3000`) with Playwright: loaded the builder in a state with `saveStatus ===
"error"` ("Save failed" shown in the toolbar), clicked File → New, confirmed the
"Discard unsaved changes?" dialog appeared, clicked "Discard & start new," and
confirmed the three-card "New project" dialog (Blank project / From template / New File
wizard) rendered — no page reload occurred.

## Paused / not started this session

- **Page Transitions** (native CSS `@view-transition` page-to-page animations,
  10 presets): design spec written, reviewed, and **already committed**
  (`docs/superpowers/specs/2026-09-01-page-transitions-design.md`, commit `95e7182`).
  **Zero implementation exists yet** — `frontend/src/lib/transitions.js`,
  `TransitionsPanel.jsx`, the `RightSidebar` "Transitions" tab, and `Builder.jsx`'s
  `applyTransition` handler are all still to be written. Read the spec in full before
  starting; it already answers most design questions (all 10 effects, testing
  checkpoints, out-of-scope items).
- **Slides Editor** (convert a slide outline into real pages + apply a theme,
  PowerPoint-throwback UI): not designed at all yet, deliberately deferred as
  sub-project 2 behind Page Transitions. No spec exists.

## Repo state snapshot (read `git status` yourself — this will go stale immediately)

At the time of writing, uncommitted changes span two unrelated efforts:
- This session's two bug fixes (above): `BlockEditMenu.jsx`, `BlockEditMenu.test.jsx`,
  part of `Builder.jsx`.
- An separate, already-complete "Exported-Site Login Dashboard" feature from earlier
  the same day: `backend/server.py`, `backend/models/site_auth.py` (new),
  `backend/tests/test_site_auth.py` (new), `frontend/src/lib/blocksExtra.js`,
  `NewProjectWizard.jsx` + its test, `ProjectTemplatesModal.jsx` + its test, part of
  `Builder.jsx`, `docs/WEB_DOJO_USER_MANUAL.md`. Full detail in
  `docs/DASHBOARD_LOGIN_HANDOFF.md` (also still uncommitted).

Nothing here has been pushed or committed except the Page Transitions spec doc. If
committing, consider separating "dashboard login feature" from "nav + new-project
bugfixes" into distinct commits since they're unrelated changes that happen to overlap
in `Builder.jsx`.
