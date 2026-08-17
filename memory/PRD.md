# Forge — WYSIWYG Website Builder

## Original Problem Statement
Build a WYSIWYG webapp that allows building websites either by drag-and-drop or
by coding, with the ability to import any existing web front/back-end framework
in the `<head>` portion. Left sidebar with tool categories: navbars, heroes,
sections, containers, cards (with count selector), toolbox of premade elements,
textbox/text-entry tools, font selection based on web-safe fonts with the
option to import Google Fonts or your own `@font-face`. Ability to import any
HTML file/webpage and have the program scan for sections it can turn into
drag-and-drop components. Right side has a Photoshop/Illustrator-style color
editor and a gradient mixer that converts colours into hexes/alphas and the
gradients into CSS gradients.

## User Choices (Feb 17, 2026)
- Scope: Full editor with drag-drop + code editing + import + color/gradient tools
- Save: MongoDB backend + persistence
- Export: standalone HTML (inline CSS) + HTML+CSS `.zip`
- Auth: none, single-user builder
- AI: none in v1

## Architecture
- Backend: FastAPI + Motor + MongoDB. Model `Project` (uuid `id`, `name`,
  `elements` list, `head_html`, `canvas_bg`, `fonts`, `updated_at`).
  CRUD endpoints under `/api/projects`.
- Frontend: React + Tailwind + shadcn/ui. Dark IDE-style shell (`Manrope` UI,
  `JetBrains Mono` code). Routes: single `/` -> `Builder`.
- Data model in-memory: `elements: Array<{ id, html }>`. Blocks are portable
  HTML strings with inline styles (so exports are standalone).
- Drag/drop uses HTML5 DataTransfer (`text/html-block`); double-click also
  inserts.
- Color picker: HSL SV square + hue/alpha sliders + HEX/RGB/HSL inputs.
- Gradient mixer: multi-stop linear/radial with copy CSS + apply to selection.
- Import: `DOMParser` scans `<header>/<nav>/<section>/<footer>/<article>` and
  presents them in a modal for one-click insertion.
- Export: `standalone.html` (inline CSS) or `.zip` (html + extracted CSS)
  using `jszip` + `file-saver`.

## Implemented (Feb 17, 2026)
- Backend CRUD for projects (create/list/get/update/delete) tested 100% pass.
- Builder shell (TopBar, LeftSidebar, Canvas, RightSidebar).
- Block library: 2 navbars, 2 heroes, 2 sections, 3 containers, 5 text tools,
  6 toolbox items, cards with count (1-6).
- Font manager: 8 web-safe + Google Fonts by name + shows @font-face guide in
  head editor.
- Photoshop-style color picker + gradient mixer with copy/apply.
- Design/Code mode toggle. Code view exposes `<head>` textarea for framework
  CDNs and custom `@font-face`.
- HTML import (file or paste) with section scanning + modal picker.
- Export: standalone .html and .zip (html + styles.css).
- Save/Load projects via MongoDB.

## Test Results (Iteration 1)
- Backend: 100% pass.
- Frontend: ~95%. Only LOW-priority test-script timing quirk on Open button
  right after Save/Export interactions (button is present, playwright timed
  out; not a functional bug).

## Backlog (P0/P1/P2)
- P1: Inline text editing on canvas (contentEditable for h1/h2/p blocks).
- P1: Per-element inspector (padding/margin/typography sliders).
- P2: Undo/Redo (history stack).
- P2: Multi-viewport preview (mobile/tablet toggle in top bar).
- P2: AI section generator (Claude Sonnet via Emergent LLM key).
- P2: Sharable public preview URL from a saved project.
