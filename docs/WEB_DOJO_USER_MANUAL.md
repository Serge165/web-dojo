# Web Dojo — User Manual

*A complete guide to every panel, menu, and tool in the Web Dojo visual website builder.*

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Getting Started](#2-getting-started)
3. [Interface Overview](#3-interface-overview)
4. [The Canvas — Selecting, Editing, and Moving Things](#4-the-canvas--selecting-editing-and-moving-things)
5. [View Modes](#5-view-modes)
6. [Top Bar Reference](#6-top-bar-reference)
7. [Menu Bar Reference](#7-menu-bar-reference)
8. [Pages Bar](#8-pages-bar)
9. [Left Sidebar — Insertion & Content](#9-left-sidebar--insertion--content)
10. [Right Sidebar — The Inspector](#10-right-sidebar--the-inspector)
11. [Layout Building (Grid & Flexbox)](#11-layout-building-grid--flexbox)
12. [Styling & Design Tools](#12-styling--design-tools)
13. [Text Effects & Animation](#13-text-effects--animation)
14. [Structured Block Editors](#14-structured-block-editors)
15. [Media — Images, Video & Audio](#15-media--images-video--audio)
16. [Forms](#16-forms)
17. [Commerce / Store](#17-commerce--store)
18. [Social & Community Widgets](#18-social--community-widgets)
19. [SEO & Analytics](#19-seo--analytics)
20. [Code Mode, Files & Snippets](#20-code-mode-files--snippets)
21. [Templates & Multi-Page Sites](#21-templates--multi-page-sites)
22. [Import, Export & Publish](#22-import-export--publish)
23. [Editor Themes (Skinning the Builder)](#23-editor-themes-skinning-the-builder)
24. [Command Palette & Keyboard Shortcuts](#24-command-palette--keyboard-shortcuts)
25. [Security, Privacy & Access Model](#25-security-privacy--access-model)
26. [Known Limitations](#26-known-limitations)
27. [Troubleshooting & FAQ](#27-troubleshooting--faq)
28. [Quick Reference Appendix](#28-quick-reference-appendix)

---

## 1. Introduction

### What Web Dojo is

Web Dojo is a **visual, drag-and-drop website builder** with a full code-editing escape hatch built in. It sits closer to Webflow or Elementor than to Wix or Squarespace: you can build an entire site by dragging blocks and clicking controls, but at any point you can drop into a real Monaco code editor (the same engine that powers VS Code) and edit the raw HTML, CSS, and JavaScript directly — nothing is walled off.

It's a single-page application: one page (`Builder.jsx`) hosts the whole editor, and everything you build lives inside a **project**, identified by a unique project ID.

### Who it's for

Anyone who wants to go from idea to a real, exportable, deployable website without starting from a blank code file — but who doesn't want a tool that fights them the moment they need something a drag-and-drop builder wasn't designed for. Because Code Mode is a first-class citizen (not a bolted-on "advanced" mode), it works equally well for:

- Someone building a landing page who has never written HTML.
- A developer who wants to sketch visually, then finish by hand-editing code.
- Someone who wants a working shopping cart, contact form, or FTP-deployed site without standing up a backend of their own.

### What makes it different

- **No ceiling.** Every visual tool produces plain HTML/CSS/JS you can inspect and hand-edit in Code Mode. There's no proprietary format locking your content in.
- **Real, working features, not mockups.** The e-commerce cart, Stripe/PayPal payment buttons, contact forms, and FTP publishing all actually work against a backend — this isn't a static prototyping tool.
- **No accounts.** There's no login, no user database. A project is just a URL. Keep reading — this has real implications for how you should think about privacy (see [§25](#25-security-privacy--access-model)).

---

## 2. Getting Started

### Opening the builder

Web Dojo opens directly into the builder — there's no dashboard or project list screen. If you're starting fresh, you'll get a blank project; if you're returning to one, open it via the **Open** button in the Top Bar (see [§6](#6-top-bar-reference)).

### Your first few minutes

1. **Take the tour.** The first time you open Web Dojo, a 6-step guided tour runs automatically (see [§2.1](#21-the-guided-tour)). You can skip it anytime with `Esc` and restart it later from the Help menu or the **?** button in the Top Bar.
2. **Name your project.** Click the project-name field in the Top Bar and type a name — this isn't just cosmetic, it's how you'll recognize the project later.
3. **Add your first block.** Open the **Library** tab in the Left Sidebar, search or browse for a block (a Hero section is a good start), and drag it onto the empty canvas — or double-click it to insert at the end.
4. **Style it.** Click any element on the canvas to select it, then use the **Right Sidebar** tabs to change its color, spacing, font, and more.
5. **Save.** `Cmd/Ctrl+S`, or the **Save** button in the Top Bar. Watch the save-status indicator next to it confirm the save succeeded.
6. **Preview and export.** Switch to **Preview** mode ([§5](#5-view-modes)) to see exactly what a visitor would see, then use **Export** in the Top Bar to download a real HTML file.

### 2.1 The guided tour

The onboarding tour is a spotlight-style walkthrough with six steps:

| Step | What it shows |
|---|---|
| 1. Welcome | Introduces the tour; tells you it can be skipped anytime with `Esc`. |
| 2. Library | Points at the Library tab — drag or double-click blocks in; search filters the whole library. |
| 3. Layout | Points at the Layout tab — build Grid/Flex containers, insert new or wrap a selection. |
| 4. Code Mode | Points at the Code mode button — a full Monaco editor with Emmet support; anything you put in the page `<head>` ships in every export. |
| 5. Share | Points at the Share button — one click copies a live preview link. |
| 6. Save | Points at the Save button — explains that saving is cloud-based and the project reopens via **Open**. |

It ends with a "You're ready" message. Restart it anytime from **Help → Getting Started Tour** (Menu Bar), the **?** icon (Top Bar), or the Command Palette.

---

## 3. Interface Overview

Web Dojo's chrome is arranged top-to-bottom in fixed horizontal bands, with a three-column working area in the middle:

```
┌─────────────────────────────────────────────────────────────┐
│  TOP BAR — logo, project name, undo/redo, viewport, import/  │
│  export, share, publish, utility icons, save, open, help     │
├─────────────────────────────────────────────────────────────┤
│  MENU BAR — File · Edit · Find · View · Help                 │
├─────────────────────────────────────────────────────────────┤
│  PAGES BAR — page tabs, + Page, SEO, Template                │
├─────────────────────────────────────────────────────────────┤
│  MODE TOGGLE — Design · Code · Split View · Outline · Preview│
├───────────────┬─────────────────────────────┬───────────────┤
│               │                               │               │
│  LEFT         │                               │  RIGHT        │
│  SIDEBAR      │        CANVAS                │  SIDEBAR      │
│  (Insert)     │      (your page)              │  (Inspector)  │
│               │                               │               │
├───────────────┴─────────────────────────────┴───────────────┤
│  STATUS BAR — page name, block count, mode, viewport, zoom    │
└─────────────────────────────────────────────────────────────┘
```

- **Left Sidebar** and **Right Sidebar** can each be collapsed to a thin edge strip (chevron button, or Command Palette → View) to give the canvas more room.
- Both sidebars **disappear entirely** in Preview and Outline modes — only the center pane is shown.
- The **Mode toggle bar** deliberately spans the full width outside the sidebar row, so switching modes doesn't shift its position when a sidebar is collapsed.

### Panel map by column

| Region | Purpose | Full reference |
|---|---|---|
| Top Bar | Global actions: save/open/undo/import/export/share/publish | [§6](#6-top-bar-reference) |
| Menu Bar | Classic File/Edit/Find/View/Help dropdown menus | [§7](#7-menu-bar-reference) |
| Pages Bar | Multi-page navigation and per-page status | [§8](#8-pages-bar) |
| Left Sidebar | Everything you drag **onto** the page | [§9](#9-left-sidebar--insertion--content) |
| Canvas | The live, editable page itself | [§4](#4-the-canvas--selecting-editing-and-moving-things) |
| Right Sidebar | Style/property controls for whatever's selected | [§10](#10-right-sidebar--the-inspector) |
| Status Bar | Read-only at-a-glance state | below |

**Status Bar** fields (left to right): current page name, total block count, active mode, active viewport, zoom percentage, save status (Saving… / Saved / Unsaved changes / Save failed). It has no interactive controls — it's purely informational.

---

## 4. The Canvas — Selecting, Editing, and Moving Things

The canvas is the heart of Design mode. Unlike many builders, it renders your page as **real DOM elements** — not inside an iframe — which is what makes drag-and-drop, inline editing, and right-click menus work directly on your actual content.

### Selecting an element

Click any element to select it. Its outline highlights, and:
- The **Right Sidebar** immediately shows that element's ID at the top and switches its controls to apply to it.
- If it's a "smart" structured block (gallery, navbar, timeline, or bento grid), the **Left Sidebar** auto-switches to its **Edit** tab, showing a form-based editor for that block's content (see [§14](#14-structured-block-editors)).

### Editing text inline

Double-click (or the hover toolbar's Edit-text icon) on text to start editing it in place. While editing, a floating **Inline Toolbar** appears above the text with:

- Bold, Italic, Underline
- Heading 1, Heading 2, Paragraph (convert the selected text's tag)
- Insert link (prompts for a URL)
- Clear formatting

### Moving, duplicating, and deleting

Hover over any block to reveal a small toolbar with:

- **Edit text inline**
- **Save as component** — stores the block in your personal **Saved** library ([§9.8](#98-saved))
- **Move up / Move down**
- **Duplicate**
- **Delete**

The same actions are available via **right-click → context menu**, and via keyboard shortcuts once something is selected (see [§24](#24-command-palette--keyboard-shortcuts)).

### Drag and drop

Drop zones appear between and around existing blocks as you drag something from the Left Sidebar (or drag an existing block to reorder it). Release over a drop zone to place it there.

### Responsive preview while editing

The **viewport toggle** in the Top Bar (Desktop / Tablet / Mobile) resizes the canvas to simulate that device width while you work — this is also what the **Responsive** tab in the Right Sidebar uses to know which breakpoint you're editing ([§10.7](#107-responsive)). A separate **zoom** control (Status Bar / scroll controls) scales the canvas visually without changing the simulated device width.

---

## 5. View Modes

The mode toggle bar switches the center pane between five modes:

| Mode | What you get | When to use it |
|---|---|---|
| **Design** | The drag-and-drop Canvas — the default WYSIWYG surface. | Everyday visual editing. |
| **Code** | A full Monaco editor (the VS Code engine) on the page's raw HTML/CSS/JS, with Emmet abbreviation expansion and a custom dark theme. `Ctrl+S` saves. | Hand-editing markup, pasting in code, fixing something the visual tools can't reach. |
| **Split View** | The Code editor and a live preview side by side. | Editing code while watching the result update live. |
| **Outline** | A slide/outline-based page-planning surface — sketch your site's structure as a reorderable list of slides, then generate real pages from it in one step. | Planning a multi-page site's structure before building it. |
| **Preview** | A full live-preview iframe, sandboxed (`allow-forms allow-scripts`, deliberately **not** `allow-same-origin`, for isolation), rendered at your selected viewport width. | Seeing exactly what a visitor will see, with sidebars out of the way. |

### Outline mode in detail

Outline mode is a separate planning surface, not a sidebar tab. Its controls:

- **+ Slide** — add a new outline slide.
- **Import** — a flyout to choose a `.md`/`.json` file, or paste `# Heading`-style Markdown directly, then **Import**.
- **Export JSON** — save the outline itself (it is *not* saved with the project otherwise — it's ephemeral).
- **Generate Pages** — turns the current outline into real pages in your project.
- Per slide: a drag handle to reorder, a title input, a delete button, and a body textarea for notes/intro copy.

---

## 6. Top Bar Reference

Left to right:

| Control | What it does |
|---|---|
| **Logo / "Web Dojo" wordmark** | Branding only. |
| **Project name field** | Inline-editable text input (placeholder: "Untitled project"). |
| **Undo** | `Cmd/Ctrl+Z`. Disabled when there's no history. |
| **Redo** | `Cmd/Ctrl+Shift+Z` or `Ctrl+Y`. Disabled when there's nothing to redo. |
| **Viewport toggle** | Desktop / Tablet / Mobile icon buttons — drives both the canvas width and the Preview-mode iframe width. |
| **Import** | Opens a flyout: **Choose .html file…** (file picker) or paste raw HTML into a textarea, then **Scan & Import** — parses the HTML and imports its sections into the current page. |
| **Export** | Opens a dropdown: **Standalone .html (inline CSS)** (one self-contained file), **HTML + CSS (.zip)** (a separate `globals.css` extracted from inline styles), or **More: JSON, Figma, Webflow, URL…** (opens the full Import/Export modal, [§22](#22-import-export--publish)). Both HTML export options first run an SEO check — if your page has SEO issues, you'll see a warning before the export proceeds. |
| **Share** | Copies a shareable live-preview URL to your clipboard. |
| **Publish** | Opens the Publish modal to push your exported site to your own FTP/FTPS/SFTP host ([§22.3](#223-publish-ftpftpssftp)). |
| **Find** (icon) | Opens Find & Replace (`Cmd/Ctrl+F`). |
| **Assets** (palette icon) | Opens the Design Tokens / Assets Library — a global list of every color/font/spacing value in use, with rename-everywhere support ([§15.2](#152-assets-library)). |
| **Analytics** (icon) | Opens the Analytics modal — tracking-snippet config plus Web Dojo's own preview/publish view counters ([§19.2](#192-analytics-modal)). |
| **Templates** (icon) | Opens the Project Templates modal ([§21.1](#211-project-templates)). |
| **Submissions** (inbox icon) | Opens the form-submissions inbox ([§16.3](#163-submissions-inbox)). |
| **Store / Dashboard** (icon) | Opens the password-gated e-commerce dashboard ([§17.3](#173-e-commerce-dashboard)). |
| **Save status indicator** | Live text + icon: "Saving…", "Saved", "Unsaved changes", or "Save failed". |
| **Save** | Also `Cmd/Ctrl+S`. |
| **Open** | Opens the load-project dialog. |
| **Help (?)** | Restarts the onboarding tour. |

---

## 7. Menu Bar Reference

A classic desktop-app-style dropdown menu strip sitting just below the Top Bar. Every item calls the exact same underlying action as its Top Bar/Command Palette equivalent — there's no separate logic to keep in sync, so behavior is consistent no matter which path you use.

| Menu | Items |
|---|---|
| **File** | New · Open… · Save (`Ctrl+S`) · — · Export standalone .html · Export HTML + CSS (.zip) |
| **Edit** | Undo (`Ctrl+Z`) · Redo (`Ctrl+Y`) · — · Cut (`Ctrl+X`, needs a selection) · Copy (`Ctrl+C`, needs a selection) · Paste (`Ctrl+V`) |
| **Find** | Search Blocks · Find & Replace… (`Ctrl+F`) |
| **View** | Command Palette… (`Ctrl+K`) · 🎨 Themes… · — · Zoom In · Zoom Out · Reset Zoom (shows current %) |
| **Help** | Getting Started Tour |

---

## 8. Pages Bar

Sits between the Top Bar/Menu Bar stack and the mode toggle. Manages multiple pages within one project.

- **Page tabs** — one per page. Click to switch. Double-click a tab's name to rename it inline.
- **Status dot / dropdown** — each tab has a colored dot (hidden until hover) showing workflow status: **Draft**, **Review**, or **Published**. Click it to change status.
- **Delete button** — per tab, hidden until hover. Disabled/hidden when only one page remains — you can't delete the last page in a project.
- **+ Page** — opens the Add Page modal ([§21.2](#212-add-page)).
- **SEO** — opens the SEO panel for the *active* page ([§19.1](#191-seo-panel)).
- **Template** — opens the site-wide header/footer Template Editor ([§21.3](#213-template-editor)).

---

## 9. Left Sidebar — Insertion & Content

Everything you drag or insert onto the canvas originates here. Eight tabs: **Edit · Library · Layout · Forms · Shop · Files · Snips · Saved** (Saved shows a count badge when it's non-empty).

### 9.1 Edit

Contextual — only useful when a structured block (gallery, navbar, timeline, or bento) is selected on the canvas. Shows the matching form editor for that block type; otherwise shows a hint to select such a block. The sidebar switches to this tab automatically the moment you select an editable block. Full details in [§14](#14-structured-block-editors).

### 9.2 Library

The main block-drop library — this is where most of your building happens.

- **Search box** — filters blocks by label across every category at once.
- **11 super-groups**, each expandable/collapsible: Navigation, Hero, Parallax, Content, Features, Forms, Media, Layouts, Esports, Creator, and Moldy Oldies — containing roughly 28 categories and 120+ individual block templates in total. Drag a block onto the canvas, or double-click to insert it at the end of the page.
- **Cards tool** — a numeric "Count" input (1–6) plus an "Insert card row" button, for generating a card grid on demand instead of hunting for a preset with the exact right column count.
- **From your CDNs** — appears automatically once your page's `<head>` references a component-library CDN (added via the CDN tab, [§10.16](#1016-cdn)); offers matching pre-built components for that library.
- **Social buttons** — "Open social builder" launches the share-bar/profile-link builder ([§18.1](#181-social-share--follow-bars)).
- **Live stream / community** — "Add Twitch / YouTube / Discord embed" buttons, opening the Stream Embed modal ([§18.3](#183-livestream--community-embeds)) — these are real embeds and need no API keys.
- **Fonts** — a web-safe font dropdown, a Google Font name input with an Add button, and a list of fonts currently loaded on the page.

### 9.3 Layout

Embeds the full **Layout Builder** for constructing Grid or Flexbox containers with real, live controls. See [§11](#11-layout-building-grid--flexbox) for the complete reference.

### 9.4 Forms

Embeds the Forms tab — quick-insert form presets or launch the full Form Builder. See [§16](#16-forms).

### 9.5 Shop

Embeds the Commerce tab — everything for adding a working cart, checkout, and payment buttons. See [§17](#17-commerce--store).

### 9.6 Files

Embeds the **File Tree** — a lightweight, multi-file project file manager (not just a single page):

- **Upload folder** button
- **New file** button (prompts for a filename including extension)
- **New folder** button
- Per-folder (hover-revealed): new-file, new-folder, delete
- Per-file: double-click to rename (prompt), a drag-to-canvas / "insert" link for `.html` files, and a delete button
- **Drag-and-drop a folder from your OS** directly onto the panel — this imports its files and subfolders; images are routed into a shared `imgs/` folder, with an overwrite-confirmation prompt if there's a name clash.

Double-clicking any non-image file opens it in the **File Editor modal** — a full Monaco editor (language auto-detected from the file extension), with `Ctrl+S` to save.

### 9.7 Snips

Embeds the **Snippets** tab — a cross-project reusable code-fragment library:

- New-snippet form: name, language dropdown, content textarea, a **Capture selection** button (pulls the HTML of whatever's currently selected on the canvas), and a Save button.
- A saved-snippet list — drag or double-click to insert, with a delete button per item.

### 9.8 Saved

A grid of components *you've* saved from the canvas (via the "Save as component" icon on any block's hover toolbar). Drag or double-click to reuse anywhere; hover to reveal a delete (trash) icon.

---

## 10. Right Sidebar — The Inspector

The style/property editor for whatever is currently selected on the canvas. The top strip always shows the selected element's ID (or "no selection"). Seventeen tabs plus a permanently docked Layers panel: **Color · Tokens · Gradient · Pattern · SVG BG · Style · Responsive · Variants · Shape · BG · Blend · Divider · Motion · Text FX · Theme · CDN · Page**.

### 10.1 Color

A full color picker plus **Apply background** and **Apply text color** buttons (both disabled until something is selected).

### 10.2 Tokens

The **Token Selector** — a lightweight design-token (CSS custom property) manager:

- **Applied to this block** — a read-only chip list of tokens already used on the selection.
- **All tokens** — every token you've created, each row showing its swatch, name, value, and usage count, with **BG** / **Text** apply buttons (disabled without a selection).
- **New token** row — color swatch, name input, and a submit button that creates a new `--fc-*` CSS custom property under `:root`.

### 10.3 Gradient

The **Gradient Mixer** — build and apply multi-stop linear or radial gradients:

- Live gradient preview
- Preset dropdown, organized into six categories (~23 presets total — see [§28.2](#282-gradient-presets))
- Type dropdown: Linear or Radial
- Angle number input (linear only)
- Per-stop rows: position, color swatch, delete (minimum of 2 stops enforced)
- **+ Add stop**
- Embedded color picker for the stop currently being edited
- CSS output box with a **Copy CSS** button
- **Apply to selection**

### 10.4 Pattern

The **Pattern Panel** — CSS-generated repeating background patterns (~13 presets across Stripes, Dots, Grid, and Geometric categories — see [§28.3](#283-pattern-presets)). Same shape as Gradient: live preview, preset dropdown, a tile-size slider, pattern/base color swap with an embedded color picker, CSS output, Copy CSS, and Apply to selection.

### 10.5 SVG BG

The **SVG Background panel** — decorative SVG-based background presets, with the same interaction pattern as Pattern (its own separate preset library, shape/base color swap, size slider, Copy CSS, Apply to selection).

### 10.6 Style

The **Style Inspector** — general box-model and typography controls:

- Padding, margin, border-radius, font-size, and opacity sliders
- Text-align buttons: Left / Center / Right / Justify
- Font-weight buttons: Normal / Bold / Black

Below these, it embeds **Contextual Editors** — a sub-editor that changes automatically based on what kind of element is selected:

| Detected element | Extra controls |
|---|---|
| Button | Label text, background color, text color, padding-Y, padding-X, radius, font-size, border |
| Image | Source URL, alt text, object-fit, width, height, radius |
| Flex container | Direction, wrap, justify, align, gap, padding |
| Grid container | Template-columns, template-rows, col/row gap, padding, justify-items, align-items |
| Card / generic | Background color, padding, radius, border, box-shadow preset |

### 10.7 Responsive

Only meaningfully active when the viewport toggle is set to **Tablet** or **Mobile**. Lets you add breakpoint-specific overrides on top of the base (desktop) style:

- Padding, margin, and font-size sliders — each with a per-property **Reset** button once you've overridden it
- A **Hide on this breakpoint** checkbox

### 10.8 Variants

Shows sibling blocks from the same block-library category as the selected element (e.g. other Hero layouts, if a Hero is selected). Click one to swap the current element's markup for that variant while keeping its position in the page — a quick "try a different version of this" tool.

### 10.9 Shape

The most comprehensive of the styling panels — border, radius, and shadow, with a curated preset gallery:

- **Preset gallery** — one-click presets: Glass card, Frosted dark, Neumorphic, Neu inset, Soft card, Elevated, Pill, Neon, Squircle glow, Aurora glow, Ticket, Sticker, Inset well — plus any custom presets you've saved (with delete).
- Preset-name input + **Save current** button, to add your own.
- Live checkerboard preview.
- **Border** — width, style dropdown, color.
- **Corner radius** — a link-all toggle for one slider, or four independent TL/TR/BR/BL number inputs.
- **Corner shape** — Round / Squircle / Bevel / Scoop / Square / Notch (CSS `corner-shape`).
- **Box shadow** — on/off toggle, presets (None/Soft/Medium/Large/Glow/Inner), manual X/Y/Blur/Spread + color, and an Inset checkbox.
- **Apply to selection** and **Clear** buttons.

### 10.10 BG

Background media for the selected element (image/video) — the element-level counterpart to the page-level audio player in the BG panel; see [§15.1](#151-background-media-panel).

### 10.11 Blend

CSS blend-mode experimentation:

- Live blend-mode preview swatch
- **mix-blend-mode** grid (18 CSS blend modes)
- **background-blend-mode** grid (same 18 modes)
- **Isolate** checkbox (creates a new stacking context)
- **Colour overlay builder** — color swatch, blend-mode dropdown, and a "Wrap with colour overlay" button, for building duotone-style effects

### 10.12 Divider

SVG section-divider generator (shapedivider-style):

- Live 2-section preview with the divider between them
- Shape grid — 15 SVG shapes: Wave, Waves, Curve, Curve alt, Tilt, Triangle, Arrow, Book, Split, Zigzag, Peaks, Mountains, Clouds, Steps, Drip
- Color, height slider, Flip X / Flip Y
- Snap placement — Above / Below / Page end (disabled unless a section is selected)
- Auto-match-fill — **Selected** (match the selected section's background) or **Far side** (match the section on the other side of the snap point)
- **Insert divider**

### 10.13 Motion

The **Animation Generator** — see [§13.2](#132-animation-generator).

### 10.14 Text FX

The **Text Effects Panel** — see [§13.1](#131-text-effects-panel).

### 10.15 Theme

The **Theme Generator** — applies a whole-page color and typography theme (injected as CSS in the page `<head>`), to one page or all of them:

- **Aesthetics tab** — a list of preset themes, each with a hover-preview mini mock page; click to apply immediately.
- **Custom tab** — color pickers for Primary / Accent / Text / Background / Muted / Border, a Google Font family input, a generated-CSS preview, **Copy CSS**, and **Apply theme**.
- **Apply to all pages** checkbox.

> **Don't confuse this with the *editor* theme** ([§23](#23-editor-themes-skinning-the-builder)) — this one styles your **site's content**; that one only skins Web Dojo's own interface.

### 10.16 CDN

The **CDN panel** — one-click add/remove of third-party `<script>`/`<link>` libraries into your page's `<head>`:

- Library search input, category tabs
- Per-library row: name, optional note, a toggle add/remove button, and a copy-snippet-example button once active

Adding a CDN here unlocks matching component tools in the Library tab's "From your CDNs" section ([§9.2](#92-library)).

### 10.17 Page

The canvas/page background — a color swatch plus a hex or gradient-string input, applied to the exported `<body>` background.

### Docked Layers panel

Always visible below the tabs (collapsible, capped at 42% height) — a Photoshop/GIMP-style layer stack:

- **Effects filter** toggle — show only elements carrying text/hover FX
- **Check all: Effected / All** — quick multi-select buttons
- Per-layer checkbox for multi-select; once ≥1 is checked, a batch bar appears: **Paste to N** (apply a copied Text FX style to all checked layers), **Animate N** (apply the current Motion-tab animation to all checked layers), Clear selection
- Per-layer row: visibility toggle (eye icon), FX badges (click to jump to that element), name/label, an editable z-index number, Move up, Move down, Delete

---

## 11. Layout Building (Grid & Flexbox)

The Layout Builder (Left Sidebar → Layout tab) is a Dreamweaver-style visual container builder. It doesn't just style an existing element — it inserts a new container or wraps your current selection with one, based on real CSS you control.

**Mode toggle:** Grid or Flexbox. **Action toggle:** Insert new or Wrap selection.

### Grid mode
- Presets: 12-column, Holy grail, Dashboard, 3×3
- Per-column and per-row track editor — value + unit (`fr`, `px`, `%`, `rem`, `em`, `auto`, `minmax`, `min-content`, `max-content`), add/remove tracks
- Column-gap slider, row-gap slider, padding slider
- `justify-items` and `align-items` dropdowns
- Live iframe preview
- **Copy CSS** and **Insert/Wrap** buttons

### Flex mode
- Direction: row / row-reverse / column / column-reverse
- Wrap: nowrap / wrap / wrap-reverse
- `justify-content` and `align-items` dropdowns
- Gap slider, padding slider
- Item-count slider (Insert mode only)
- Live preview, **Copy CSS**, **Insert/Wrap**

---

## 12. Styling & Design Tools

This section pulls together the standalone design utilities that aren't tied to one Right Sidebar tab.

### 12.1 Color Picker

The universal color-selection control reused throughout the app (Right Sidebar's Color tab, and embedded inside Gradient/Pattern/SVG BG/Shape editors). A saturation/lightness square, hue slider, alpha slider, hex text input, R/G/B number inputs, H/S/L number inputs, and a live swatch.

### 12.2 Design tokens vs. Assets Library

Web Dojo has *two* related but distinct tools:
- **Tokens tab** ([§10.2](#102-tokens)) — deliberately *create and name* reusable CSS variables going forward.
- **Assets Library** ([§15.2](#152-assets-library)) — audits values *already* used ad hoc in the project and lets you rename/replace them everywhere at once.

Use Tokens when you're building with reuse in mind; use the Assets Library to clean up after the fact.

---

## 13. Text Effects & Animation

### 13.1 Text Effects Panel

The single largest panel in Web Dojo — a full text-effects studio (Right Sidebar → Text FX tab):

- **FX-intensity slider** — scales the strength of all applied effects at once
- **Fill & stroke** — 14 static presets: Sunset, Ocean, Candy, Gold, Hollow, Stroke, Neon, Fire, Chrome, Retro 3D, Long shadow, Soft glow, Stripes, Dots, Checkerboard
- **Animated** — 6 presets: Shimmer, Rainbow, Pulse glow, Flicker, Float, Wobble
- **Hover** — 6 presets: Color pop, Underline, Glow, Lift, Skew, Spread — plus a "Remove hover from element" button
- **Custom** section:
  - Outline — color, thickness, Apply
  - Directional shadow — angle, distance, blur, color, Apply
  - 3D tilt — depth, Apply
  - Reflection — distance, opacity, Apply
- **Copy style / Paste style** buttons — carry a text-FX style from one element to another
- **Style Library** — Export/Import JSON, category filter, collapsible category groups, click-to-apply chips (with delete), and a name + category + Save form for your own presets
- **Clear text FX** button

### 13.2 Animation Generator

Right Sidebar → Motion tab. Builds CSS `@keyframes` animations (or their GSAP/Framer Motion equivalents):

- **Animation Library dropdown** — CSS / GSAP / Framer Motion; the generated code changes to match
- Preset grid, grouped by category (24 presets total across Entrance, Emphasis, Exit, and On Scroll — see [§28.1](#281-animation-presets))
- Duration slider, Delay slider, Easing dropdown (linear, ease variants, named cubic-béziers)
- Iteration buttons: 1 / 2 / 3 / ∞
- Live preview box, generated code output
- **Copy CSS** and **Apply to selection**

---

## 14. Structured Block Editors

Some blocks aren't just styled HTML — they carry real structured content (a list of images, a list of nav links, etc.). For these, Web Dojo gives you a form-based editor instead of forcing you to hand-edit markup. Select one of these blocks and the Left Sidebar automatically switches to its **Edit** tab.

### Gallery editor
Per-image caption input, move up/down, remove; **Upload images** and **Add placeholder image** buttons; a layout **Style** dropdown (Grid auto-fit, Grid 2/3/4-col, Masonry, Carousel).

### Navbar editor
A **Navbar-style dropdown** with 10 variants: Horizontal Top, Centered, Sticky, Split, Vertical Left, Vertical Right, Mega Menu, Minimalist, Pill, Underline. Plus: a brand-text input and a nested nav-item tree editor (label, link input, a "pick page or URL" button that opens a page-picker modal, add-submenu-item, remove, add-top-level-item).

### Timeline editor
Per-entry date/title/description inputs, move up/down, remove, and an **Add entry** button.

### Bento editor
Per-item background-color swatch, title, description, move up/down, remove, and an **Add item** button.

---

## 15. Media — Images, Video & Audio

### 15.1 Background Media Panel

Right Sidebar → BG tab. Two distinct things live here:

- **Background music (page-level)** — MP3/audio vs. MIDI type toggle, URL input, corner-position dropdown, accent-color swatch, a button-label input (MP3 mode) or a note that MIDI has its own player, Loop checkbox, Autoplay checkbox (MP3 only), **Add to page** button. This adds a real floating audio player to the *exported* site.
- **Background image / video (element-level)** — requires an element to be selected. Image: URL, size/position/repeat dropdowns, Apply/Clear. Video: URL, a "Wrap with looping video" button.

### 15.2 Assets Library

Opened from the Top Bar's palette icon. A global audit tool for every distinct color/font/spacing value currently used in the project:

- **Colors / Fonts / Spacing** tab switch, each listing every value in use with a usage count
- Click any entry to rename it — this finds and replaces that value **everywhere it's used in the project**
- **Done** to close

This is intentionally separate from the Tokens tool ([§10.2](#102-tokens)): Tokens is for deliberately naming reusable values going forward; the Assets Library is for cleaning up values that already exist ad hoc.

---

## 16. Forms

### 16.1 Forms tab (Left Sidebar)
A quick-insert list of pre-built form presets (drag or double-click, field count shown per preset) plus an **Open form builder** button for the full designer.

### 16.2 Form Builder (full-screen modal)

- **Form settings** — name/inbox label, Action URL (with helper text), Method (GET/POST), Layout (stacked/inline), Theme (light/dark/brand), accent color, submit-button text, success-message text
- **Fields list** — reorderable rows (type badge, label, move up/down, delete)
- **Add field** buttons for 12+ field types
- **Selected-field editor** — name attribute, label, placeholder, rows (textarea), value (hidden fields), accept (file fields), an options list for select/radio fields (add/remove), a Required checkbox
- Live iframe preview
- **Save to library** and **Insert onto canvas** buttons

By default, submitted forms post to Web Dojo's own built-in submissions inbox — but the Action URL can point anywhere, including third-party services like Formspree or Basin.

### 16.3 Submissions inbox

Opened from the Top Bar's inbox icon. Reads real submissions captured from your published or previewed forms:

- **CSV** export button
- Sidebar list of form groups (All, plus one per form name, each with a count)
- Refresh button
- Per-submission card: form badge, timestamp, every field/value pair, a delete button, and a "view source page" link

---

## 17. Commerce / Store

### 17.1 Shop tab (Left Sidebar → CommerceTab)

Everything needed to add a working shopping cart, checkout, product buttons, and order-confirmation email to a static exported site:

- **Add payment button** — opens the Payment Button modal ([§17.2](#172-payment-button-modal))
- **Make this shop checkout-ready** button
- **Shopping cart section** — currency dropdown, accent color, PayPal Client ID input, PayPal Secret (password field), **Save PayPal credentials**, **Add cart + checkout to page**
- **Order-emails / SMTP section** — host, port, from-address, username, password, **Save SMTP settings**
- **Add-to-cart button generator** — product name, price, image URL, **Insert add-to-cart button**
- A list of store-specific blocks (drag or double-click to insert)

### 17.2 Payment Button modal

For a single working "buy now" button:

- Provider toggle: Stripe or PayPal
- Product name, price, currency, button-label
- **Stripe**: "Generate Stripe payment link" creates a real payment link (with a copyable/openable URL and a test-card hint)
- **PayPal**: a Client ID input, with a link to the PayPal developer dashboard
- Live iframe preview, **Insert onto canvas**

### 17.3 E-commerce dashboard

Opened from the Top Bar's Store icon. **Password-gated** — this is the one part of Web Dojo with real access control (see [§25](#25-security-privacy--access-model)). Once unlocked, four tabs:

| Tab | Contents |
|---|---|
| **Orders** | CSV export; a table with a per-row fulfillment-status dropdown (Processing / Shipped / Delivered) |
| **Customers** | CSV export; a table of email, name, order count, lifetime value, and last-order date |
| **Analytics** | Revenue trend line chart, fulfillment funnel counts, new-vs-returning customer breakdown, top-products table |
| **Insights** | Alert cards for things like stale products or revenue drops — or an "all clear" state when there's nothing to flag |

### 17.4 Funnel Analytics

A password-gated variant of the dashboard focused on marketing-funnel performance: a Control / Variant A / Variant B tab switch, a funnel-stage bar chart (Entry / Checkpoint A / Checkpoint B / Conversion, shown as % of entry), drop-off stat cards, a Conversion Rate stat, an Average Time to Conversion stat, and a recent-events list. This pairs with the **Landing Page** starter template, which ships with `data-funnel-checkpoint` attributes and an embedded tracking script that reports entry/checkpoint/conversion events automatically — add that template and funnel tracking works with no extra setup.

---

## 18. Social & Community Widgets

### 18.1 Social share / follow bars

Opened via "Open social builder" in the Library tab. Builds a static share bar or a "follow us" profile-link bar:

- Mode toggle: Share-this-page or Link-to-profiles
- Platform checkboxes (vary by mode)
- Per-platform inputs — profile URLs (follow mode) or share URL + share text (share mode)
- Shape, style, and hover-animation dropdowns; layout (row/column); align; size slider; gap slider; "Show labels" checkbox; mono-style icon/background color pickers (when style = mono)
- Live iframe preview with a light/dark toggle, **Insert onto canvas**

### 18.2 Social Connect (dashboard)

For pulling **real** live social feeds into a published site — separate from the static share/follow builder above. Per-platform (Facebook, Instagram, X, TikTok, LinkedIn, YouTube) token and secondary-ID input fields; Cancel / **Save Keys**. This is a dashboard-context, token-gated tool.

### 18.3 Livestream & community embeds

Real embeds requiring no API keys:

- **Twitch** — channel-name input
- **YouTube** — a Channel-vs-specific-video mode toggle, with an ID or video-ID input
- **Discord** — server-ID input

Live preview, **Insert onto canvas**. Note: because these need no API credentials, they intentionally don't fake extras like a live/offline badge or forum threads — those would require real API access this feature doesn't have.

> ⚠️ **Important:** the **Portfolio** and **Social Wall** blocks in the block Library are static demo content with hardcoded example posts/cards — they are *not* connected to any real Instagram/social account. See [§26](#26-known-limitations).

---

## 19. SEO & Analytics

### 19.1 SEO panel

Opened per-page via the Pages Bar's SEO icon.

- A **score badge** — click to reveal a pass/warn/fail checklist
- "Start from a template" dropdown, which pre-fills fields with bracketed placeholders
- Content-based suggestion cards ("Use as title" / "Use as description")
- Fields: Title (with character counter), Description (character counter, textarea), Keywords, Canonical URL, Favicon URL, OG Type dropdown, OG Title, OG Description, OG Image URL, Twitter Card, and a structured-data schema-type dropdown
- Live search-result-snippet preview
- **Done**

This is also what powers the export-time SEO warning (see [§6](#6-top-bar-reference), Export). *Note: depending on your build, this panel's scoring engine may still be in active development — verify it's fully wired before relying on it.*

### 19.2 Analytics modal

Opened from the Top Bar's Analytics icon. Two tabs:

- **Overview** — preview-views stat, publishes stat, a views-by-day bar chart, and a recent-events list (Web Dojo's own built-in counters)
- **Tracking** — per-provider ID input fields for third-party analytics (e.g. Google Analytics), injected as `<head>` snippets, with an "Apply to all pages" button

---

## 20. Code Mode, Files & Snippets

### 20.1 Code / Split View modes

See [§5](#5-view-modes) for the full mode reference. Code mode is a complete Monaco editor with Emmet abbreviation expansion across HTML/CSS/JS/TS and a custom dark theme; `Ctrl+S` saves.

### 20.2 File Tree & File Editor

See [§9.6](#96-files). Double-clicking a non-image file opens the **File Editor modal** — the same Monaco editor, bound to that file's content, with `Ctrl+S` to save. This is what lets files created in the tree actually be edited (previously they could only be filled via drag/upload).

### 20.3 Snippets

See [§9.7](#97-snips) — a cross-project reusable code-fragment library, with a "Capture selection" button that pulls the currently selected canvas element's HTML directly into a new snippet.

---

## 21. Templates & Multi-Page Sites

### 21.1 Project Templates

Opened from the Top Bar's Templates icon:

- Search + aesthetic filter pills
- **Starter gallery** — built-in aesthetic templates as preview cards; clicking one opens a full-screen preview with a Desktop/Tablet/Mobile toggle and a "Use this template" button
- **Your templates** — your own saved templates, with delete and "Use template" buttons; an "Import a template" toggle lets you paste HTML or fetch a URL, preview it, and save it as a new template
- **Save current project as template** — name, description, Save

### 21.2 Add Page

Opened from the Pages Bar's + Page button — a WordPress-style page picker:

- Search input, category filter pills
- "Start with a blank page" button
- Categorized layout list — click to preview, with a live iframe preview of the selected layout
- "Add this page" button

There are roughly 14 pre-composed starter layouts (Home, About, Services, Blog, Portfolio, Contact, FAQ, Pricing, Team, Testimonials, Coming soon, 404, Shop, and industry-specific ones) — each a ready-made nav + content + CTA + footer composition, not a blank shell.

### 21.3 Template Editor

Opened from the Pages Bar's Template button — defines a site-wide wrapper applied across *every* page:

- "Wrap every page with this template" checkbox
- Header HTML code editor
- Footer HTML code editor
- **Done**

---

## 22. Import, Export & Publish

### 22.1 Quick export (Top Bar)

The Top Bar's Export button gives you the two most common formats directly: **Standalone .html** (everything inlined into one file) and **HTML + CSS (.zip)** (a separate `globals.css`). Both run an SEO check first.

### 22.2 Full Import/Export modal

Opened via Top Bar → Export → "More…". Two tabs:

- **Export & Send** — Standalone HTML, Clean HTML+CSS zip, Web Dojo project `.json`, a "Copy full HTML" button, and a **Send to a design/hosting tool** list:
  - **Figma** — copies HTML formatted for the HTML.to.design plugin
  - **Webflow** — downloads a zip for a code-embed block
  - **Framer** — copies HTML for a Framer Embed
  - **WordPress** — downloads a standalone `.html` for a Custom HTML block
  - **Netlify Drop** — downloads a deployable zip
- **Import** — a URL input + Fetch button (scrape an external page), a paste-HTML textarea + "Scan & Import", an "Import .html file" button, and an "Import .json project" button

### 22.3 Publish (FTP/FTPS/SFTP)

Opened via the Top Bar's Publish button — deploys your exported site directly to your own host, no separate download-then-upload step required:

- A **saved-profiles list** (click to load, delete per row)
- Protocol buttons: FTP / FTPS (TLS) / SFTP
- Host, Port, Username, Password, Remote path, HTML filename, CSS filename
- "Also upload a site.zip archive" checkbox
- "Save these settings as a preset" toggle → preset name, "Save password (encrypted)" checkbox, Save/Cancel
- A success/error result banner
- **Close** / **Publish now**

Saved passwords are encrypted server-side (Fernet encryption) before storage — not stored in plaintext.

### 22.4 Find & Replace

Opened via `Ctrl+F` or Menu Bar → Find → Find & Replace:

- Find input, Replace-with input
- Scope buttons: Current page / All pages / Head + template / Project files
- Regex checkbox, Case-sensitive checkbox
- Live match count
- **Close** / **Replace all**

---

## 23. Editor Themes (Skinning the Builder)

> **This is not the same as the Theme tool in the Right Sidebar** ([§10.15](#1015-theme)). That one styles the content of *your* site. This one re-skins Web Dojo's *own interface* and has zero effect on anything you export or publish.

Opened via Menu Bar → View → "🎨 Themes…" — a full-screen gallery of Winamp/90s-aesthetic skins for the builder chrome itself:

- Grid of theme cards (name, description, color swatches, effect badges like Glow / Glass / Beveled / Gradient)
- Click a card to apply instantly; the active theme shows a checkmark
- Close (✕)

**Built-in themes:** Default, Winamp Modern, Winamp Classic, Acid Trip, Vaporwave, Dark Void, Matrix Green, Glitch Synthwave.
**Community themes:** Dracula, Nord, Gruvbox Dark, Solarized Light, Synthwave 80s, Windows 95, Cyberpunk Noir, Terminal Amber.

Your choice is saved in your browser's local storage and persists across sessions on that browser/device.

---

## 24. Command Palette & Keyboard Shortcuts

### 24.1 Command Palette

Open with `Cmd/Ctrl+K` (or Menu Bar → View → Command Palette). A universal, fuzzy-searchable command launcher — it doesn't own separate logic, it just dispatches the same actions available everywhere else:

- **File** — New project · Open project… · Save · Export standalone .html · Export HTML+CSS (.zip) · Copy shareable preview URL · Publish…
- **Edit** — Undo · Redo · Cut selection · Copy selection · Paste
- **Find** — Search block library · Find & Replace…
- **View** — Switch to Design/Code/Split View/Outline/Preview · Viewport: Desktop/Tablet/Mobile · Zoom in/out/reset · Show/Hide library panel · Show/Hide inspector panel
- **Panels** — Design tokens · Analytics · Project templates · Form submissions inbox · E-commerce dashboard
- **Help** — Getting Started Tour

### 24.2 Global keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Cmd/Ctrl+Z` | Undo |
| `Cmd/Ctrl+Shift+Z` or `Cmd/Ctrl+Y` | Redo |
| `Cmd/Ctrl+S` | Save |
| `Cmd/Ctrl+F` | Open Find & Replace |
| `Cmd/Ctrl+K` | Toggle Command Palette |
| `Cmd/Ctrl+C` | Copy selected block |
| `Cmd/Ctrl+X` | Cut selected block |
| `Cmd/Ctrl+V` | Paste block |
| `Delete` / `Backspace` | Delete selected block |

Block-level shortcuts (copy/cut/paste/delete) only fire when no text field is focused, so ordinary browser copy/paste inside the project-name field, inline text editing, or any other input still works normally — the shortcuts never hijack it.

---

## 25. Security, Privacy & Access Model

Read this section before sharing any project link.

- **There are no user accounts.** Web Dojo has no login and no per-user database. A project is identified purely by its project ID (embedded in its URL).
- **Anyone with a project's URL can open and edit it.** There's no per-project password on the editor itself. Treat your project links the way you'd treat an unlisted (not private) document link.
- **Only the e-commerce dashboard is genuinely access-controlled.** It's protected by a per-project dashboard password and a server-side token (`X-Dashboard-Token`) — this is the one surface with real gating.
- **Submissions and site-visit Analytics are *not* password-gated** — anyone who has your project ID can view them. Don't treat those links as secret.
- **Saved credentials** (PayPal secret, SMTP password, FTP/SFTP passwords) are encrypted server-side before storage, not stored in plaintext — but they're still only as safe as who has access to your project link.

**In short: a Web Dojo project link functions like a semi-private, unlisted URL — not a secured, authenticated resource.** Don't rely on it to keep anything truly confidential.

---

## 26. Known Limitations

Be aware of these so you don't build around a false assumption:

- **Portfolio and Social Wall blocks are static demo content.** They use hardcoded example cards/posts (Portfolio uses CSS-only `:has()` filtering; Social Wall has fake posts) — neither connects to a real account or live feed. If you want a live social feed, use the **Social Connect** tool ([§18.2](#182-social-connect-dashboard)) instead.
- **There is no Blog/Update block category.** If you need a blog, you'll be composing it from generic content blocks rather than a dedicated blog system.
- **The SEO scoring system may lag the rest of the app.** Depending on your build, treat its checklist as a helpful guide rather than a guaranteed-complete audit — verify manually for anything critical.
- **Livestream embeds don't fake status.** The Twitch/YouTube/Discord embeds show the real embed only — no synthetic "live now" badge or forum thread, since faking those would require API access the feature doesn't have.
- **`BlockEditMenu.jsx` and `BlockEditMenu_real.jsx` both exist in the codebase** — if you're troubleshooting an Edit-tab quirk, be aware there are two implementations in play at different points in the project's history.

---

## 27. Troubleshooting & FAQ

**My changes aren't saving.**
Check the save-status indicator next to the Save button in the Top Bar. "Save failed" means your last save attempt didn't go through — try `Cmd/Ctrl+S` again, and check your connection. Unsaved changes are not automatically retried in the background.

**Undo/Redo buttons are greyed out.**
That's expected at the start/end of your history — there's nothing further to undo or redo.

**I can't delete a page.**
Web Dojo won't let you delete the last remaining page in a project. Add a second page first if you want to remove the original.

**My export looks different from the canvas.**
Preview mode ([§5](#5-view-modes)) renders exactly what gets exported, in a sandboxed iframe — use it to double-check before exporting, especially if you've been editing in Code mode.

**A block I dragged in isn't editable through a form — I just see raw HTML controls.**
Only four block types (gallery, navbar, timeline, bento) have a dedicated structured editor ([§14](#14-structured-block-editors)). Everything else is edited through the general Style/Contextual editors ([§10.6](#106-style)) or directly in Code mode.

**Someone else opened my project without me sharing a password.**
This is expected behavior, not a bug — see [§25](#25-security-privacy--access-model). Project links have no password by default; only the e-commerce dashboard does.

**The editor theme I picked isn't showing up in my exported site.**
Correct — editor themes ([§23](#23-editor-themes-skinning-the-builder)) only skin the builder's own interface. To theme your actual site's content, use the Theme tab in the Right Sidebar ([§10.15](#1015-theme)) instead.

**My Publish (FTP) attempt failed.**
Check the result banner in the Publish modal for the specific error, and double-check host/port/protocol match what your host provider expects (FTP vs. FTPS vs. SFTP use different default ports and handshake behavior).

---

## 28. Quick Reference Appendix

### 28.1 Animation presets (24 total)

| Category | Presets |
|---|---|
| Entrance | Fade In, Slide Up, Slide Down, Slide Left, Zoom In, Pop, Bounce In, Roll In, Flip In, Light Speed In |
| Emphasis | Spin, Float, Pulse, Shake, Wobble, Rubber Band, Heartbeat |
| Exit | Fade Out, Zoom Out, Slide Out Up, Fly Out Down |
| On Scroll | Fade In, Slide Up, Slide In Left, Zoom In (scroll-triggered) |

Target libraries: **CSS**, **GSAP**, **Framer Motion** — pick whichever your project already depends on, or plain CSS for zero dependencies.

### 28.2 Gradient presets (~23 total)

| Category | Presets |
|---|---|
| Vibrant | Sunset, Ocean, Candy, Fire, Cosmic Fusion, Tropical, Berry Punch, Citrus |
| Pastel | Cotton Candy, Peach Fuzz, Lavender Mist, Mint Cream, Baby Blue, Blush |
| Dark | Midnight, Obsidian, Deep Space, Noir Violet, Storm |
| Monochrome | Slate, Silver, Charcoal |
| Duotone | Purple, Teal, Crimson, Indigo |
| Radial | Spotlight, Warm Glow, Cool Glow |

### 28.3 Pattern presets (13 total)

| Category | Presets |
|---|---|
| Stripes | Diagonal, Horizontal, Vertical |
| Dots | Polka Dots, Large Dots, Confetti Dots, Concentric Circles |
| Grid | Grid Lines, Graph Paper, Cross-Hatch, Diamond Lattice |
| Geometric | Checkerboard, Chevron, Triangles |

### 28.4 Editor theme roster

**Built-in:** Default · Winamp Modern · Winamp Classic · Acid Trip · Vaporwave · Dark Void · Matrix Green · Glitch Synthwave
**Community:** Dracula · Nord · Gruvbox Dark · Solarized Light · Synthwave 80s · Windows 95 · Cyberpunk Noir · Terminal Amber

### 28.5 Keyboard shortcuts (all)

| Shortcut | Action |
|---|---|
| `Cmd/Ctrl+Z` | Undo |
| `Cmd/Ctrl+Shift+Z` / `Cmd/Ctrl+Y` | Redo |
| `Cmd/Ctrl+S` | Save |
| `Cmd/Ctrl+F` | Find & Replace |
| `Cmd/Ctrl+K` | Command Palette |
| `Cmd/Ctrl+C` | Copy selected block |
| `Cmd/Ctrl+X` | Cut selected block |
| `Cmd/Ctrl+V` | Paste block |
| `Delete`/`Backspace` | Delete selected block |
| `Esc` | Skip onboarding tour |

### 28.6 Full panel/modal index

| Name | Opened from |
|---|---|
| Library, Layout, Forms, Shop, Files, Snips, Saved, Edit tabs | Left Sidebar |
| Color, Tokens, Gradient, Pattern, SVG BG, Style, Responsive, Variants, Shape, BG, Blend, Divider, Motion, Text FX, Theme, CDN, Page tabs | Right Sidebar |
| Layers panel | Docked in Right Sidebar |
| Find & Replace | `Ctrl+F` / Menu Bar → Find |
| Command Palette | `Ctrl+K` / Menu Bar → View |
| Theme Gallery | Menu Bar → View → 🎨 Themes… |
| Assets Library | Top Bar palette icon |
| Analytics | Top Bar Analytics icon |
| Project Templates | Top Bar Templates icon |
| Submissions inbox | Top Bar inbox icon |
| E-commerce dashboard | Top Bar Store icon |
| Import/Export (full) | Top Bar → Export → More… |
| Publish | Top Bar → Publish |
| SEO panel | Pages Bar → SEO |
| Template Editor | Pages Bar → Template |
| Add Page | Pages Bar → + Page |
| Form Builder | Left Sidebar → Forms → Open form builder |
| Payment Button | Left Sidebar → Shop → Add payment button |
| Social Share/Follow builder | Left Sidebar → Library → Open social builder |
| Stream Embed | Left Sidebar → Library → Add Twitch/YouTube/Discord embed |
| File Editor | Double-click a file in Files tab |
| Onboarding Tour | First visit / Top Bar Help / Menu Bar → Help |

---

*This manual documents Web Dojo as of the current codebase. Some features (noted inline) may be under active development — when in doubt, verify against the live build.*
