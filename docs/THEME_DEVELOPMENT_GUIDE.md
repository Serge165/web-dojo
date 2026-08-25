# Web Dojo Theme Development Guide

Web Dojo's editor skins are CSS-custom-property themes that repaint the
**entire** builder interface — left & right sidebars, the inspector, menu bar,
top/status bars, canvas chrome, modals and dropdowns — not just the top bar.

This guide explains the theme data model, how full-UI coverage works, and how
to author, validate, export and import your own themes.

---

## 1. How themes skin the whole UI

Three files work together:

| File | Role |
|------|------|
| `frontend/src/themes/chrome.js` | Defines the **chrome tokens** and derives them from a theme's base colors |
| `frontend/src/themes/index.js` | `applyTheme()` writes `--wd-*` custom properties onto `<html>` |
| `frontend/src/themes/skinning.css` | Remaps every hardcoded Dark-palette class (`bg-[#1C1A15]`, `text-[#F1EDE2]`, …) to `--wd-*` so all chrome repaints |

The builder chrome is historically styled with a fixed Tailwind palette. Rather
than rewrite all of it, `skinning.css` maps each of those classes to a CSS
variable via attribute selectors (e.g. `[class~="bg-[#242019]"]` →
`var(--wd-surface)`). Because the file is imported last it wins ties, so every
panel, tab, modal and menu inherits the active theme.

### The token set

| Token | Purpose | Historical default |
|-------|---------|--------------------|
| `--wd-primary` | Primary / accent buttons & highlights | `#C9A227` |
| `--wd-secondary` | Branded secondary bar | `#332D22` |
| `--wd-background` | Deepest app background | `#14120E` |
| `--wd-surface` | Raised surfaces / hover fills | `#242019` |
| `--wd-panel` | Sidebar & menu-bar fills | `#1C1A15` |
| `--wd-well` | App shell bg, inputs, code wells | `#15130E` |
| `--wd-text / -dim / -secondary / -muted / -faint` | Text scale | `#F1EDE2 / #E4DECE / #A79C87 / #948C79 / #6B6353` |
| `--wd-border` | Hairlines & borders | `#332D22` |
| `--wd-gold / -gold-border` | Publish / gold accents | `#E8C34A / #4A3F1E` |
| `--wd-primary-surface` | Hover tint near primary fills | `#2A2416` |

The first seven (`primary…border`) are **required** on every theme. The rest
are **chrome tokens**: optional, because `chrome.js` derives them from the base
colors when a theme does not pin them.

---

## 2. Theme data model

A theme is a plain object:

```js
{
  name: "My Theme",
  description: "Short blurb",
  colors: {
    primary: "#ff6600", secondary: "#333333", accent: "#00ffcc",
    background: "#1a1a1a", surface: "#2a2a2a", text: "#ffffff",
    textSecondary: "#cccccc", border: "#444444",
    // optional chrome overrides:
    panel: "#202020", well: "#111111", textMuted: "#999999",
  },
  typography: { fontFamily: "'Trebuchet MS', 'Segoe UI', sans-serif" },
  effects: { glassEffect: false, beveledEdges: false, gradients: false, glow: false },
  category: "Custom", // set automatically on import
}
```

- **Required:** `name`, `description`, `colors` with all 8 base keys.
- **Optional:** `effects.*` flags (turn on Glow / Glass / Beveled / Gradient),
  `typography.fontFamily`, and chrome-token color overrides.

---

## 3. Authoring a theme

1. Copy any entry from `frontend/src/themes/builtinThemes.js` as a template.
2. Fill the 8 base colors. Keep `text` vs `background` / `textSecondary`
   contrast readable (see the validation guide, step 4).
3. Add chrome overrides only where the derived defaults need correcting (e.g.
   very light themes where `panel`/`well` should stay near-white).
4. Validate it with the automation described below.
5. Register it: for bundled themes add it to `themes/index.js`; for a
   one-off, import via the Gallery's **Import…** button.

---

## 4. Bundled theme groups

| Group | Source file | Category |
|-------|-------------|----------|
| Winamp / 90s | `builtinThemes.js` | `"Winamp & 90s"` |
| Community | `community-themes.js` | `"Community"` |
| Aesthetic (27) | `aestheticThemes.js` | `"Aesthetic"` |
| Imported | runtime `registerTheme` | `"Custom"` |

The Gallery (`View → 🎨 Themes…`) groups cards by these categories and filters
live on click. Imported themes persist in localStorage so your choice survives
reloads.

---

## 5. Validation

```bash
cd frontend
CI=true npx craco test --watchAll=false src/themes/themeValidation.test.js
```

Or import validation programmatically:

```js
import { validateTheme } from "@/themes/themeValidation";
const issues = validateTheme(myTheme);   // [] if valid
```

`importTheme()` in `frontend/src/themes/index.js` refuses malformed palettes.
See `docs/THEME_VALIDATION_CHECKLIST.md` for the 5-step checklist and how to
run it on every bundled theme.

---

## 6. Export / Import (API)

```js
import { exportTheme, importTheme, serializeTheme } from "@/themes";

exportTheme("aesthetic-cyberpunk");              // downloads webdojo-theme-<key>.json
const key = importTheme(jsonText);               // validates + registers, returns key
const json = serializeTheme({ defaultTheme: themes.defaultTheme });
```

Imported themes appear under **Custom** and are persisted so re-selecting them
after a reload works.
