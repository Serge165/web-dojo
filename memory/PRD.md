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
- Left sidebar tabs: **Library / Layout / Files / Saved**.
- **Library search** filters across all component categories with a live count.
- **Layout tab** (Dreamweaver-style, modern CSS): Grid + Flexbox builders with
  presets (12-col, holy grail, dashboard, 3×3), track editor for columns/rows
  (value + unit: fr, px, %, rem, em, auto, minmax, min/max-content), col/row
  gaps, padding, justify/align controls, live iframe preview, CSS view + copy,
  and "Insert container" that drops the layout onto canvas.
- **Files**: tree view with new file/folder, folder upload, drag-drop
  folders/files from disk (`webkitGetAsEntry`), rename/delete, drag `.html`
  files onto canvas. Persisted with project.
- **Saved (Component Marketplace)**: save any canvas element via icon, stored
  globally in `/api/components`, appears in Saved tab with **scaled iframe
  thumbnails**, draggable back to canvas.
- **Inline Rich Text**: floating toolbar (Bold/Italic/Underline/H1/H2/P/
  Link/Clear) shows above any inline-edited element.
- **6 image gallery blocks** in Components (grid, masonry, scroll carousel,
  hover zoom, polaroid stack, featured+thumbs).
- **CDN Panel** on right sidebar (28 libraries — Tailwind, Bootstrap 5, Bulma,
  Foundation, Pure.css, Milligram, Alpine.js, HTMX, jQuery, GSAP, Anime.js,
  Three.js, Chart.js, D3, AOS, Swiper, Lottie, React 18, Vue 3, Preact, plus
  Font Awesome 6, Material Icons, Material Symbols, Bootstrap Icons, Lucide,
  Heroicons via Iconify, Phosphor, Tabler) with one-click toggle + copy
  snippets.
- **Code editor**: Monaco with Emmet on both panes; per-pane language selector
  covering 40+ Monaco built-in grammars (HTML, CSS, SCSS, LESS, JS, TS/JSX,
  JSON, XML, YAML, Markdown, MDX, Handlebars, Twig, Liquid, Pug, Razor,
  GraphQL, PHP, Python, Ruby, Go, Rust, Java, Kotlin, Swift, C#, C++, Dart,
  Elixir, Clojure, Scala, SQL, Shell, PowerShell, Dockerfile, Solidity, Lua,
  R, Perl, HCL/Terraform, Bicep).
- **BG + Layers** merged in one panel: bg image/video + z-index + visibility +
  reorder + delete.
- Backend CRUD for projects (create/list/get/update/delete) tested 100% pass.
- Public preview endpoint `GET /api/preview/{id}` returns rendered text/html.
- Builder shell (TopBar, LeftSidebar, Canvas, RightSidebar).
- Left sidebar library adds Components category (headers, glass navbar,
  animated hero, animated marquee, testimonial, pricing 3-col, footer),
  plus original navbars/heroes/sections/containers/text/toolbox and
  cards-with-count.
- Font manager: 8 web-safe + Google Fonts by name + shows @font-face guide in
  head editor.
- Photoshop-style color picker + gradient mixer with copy/apply.
- Design/Code mode toggle. Code view uses Monaco editor with Emmet expansion
  and syntax highlighting; separate `<head>` injection editor for framework
  CDNs and custom `@font-face`.
- HTML import (file or paste) with section scanning + modal picker.
- Export: standalone .html and .zip (html + styles.css).
- Save/Load projects via MongoDB. Shareable public preview URL via Share
  button (auto-saves + copies preview link).
- Multi-viewport preview toggle (desktop 1200 / tablet 820 / mobile 390).
- Undo / Redo (Cmd+Z, Cmd+Shift+Z) with 50-step history.
- Inline text edit on canvas via pencil icon on the element (contentEditable).
- Right sidebar tabs: Color, Gradient, Style, BG, Motion, Layers, Theme, Page.
- Style inspector sliders: padding, margin, border-radius, font-size, opacity,
  text alignment + font weight.
- Background media panel: bg image URL with size/position/repeat, and bg
  video URL that wraps element with a looping full-cover video.
- Layers panel with per-element visibility toggle, z-index editor,
  reorder up/down, delete.
- CSS animation generator with 9 presets (fade/slide/zoom/pop/spin/float/
  pulse), duration/delay/easing/iteration controls, live preview and
  Copy CSS / Apply to selection.
- CSS theme generator: 9 aesthetic presets (cottage-core, grey-metal,
  book-fair, brutalism, y2k, cyberpunk, memphis, glassmorphism, scandi-min)
  + a Custom builder with color rows and Google font selector.

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
