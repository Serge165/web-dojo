# Theme Validation Checklist & Coverage Matrix

A theme is only "done" when it skins **every** part of the editor. This
checklist and the `--wd-*` coverage matrix are the acceptance bar. The
automated version lives in `frontend/src/themes/themeValidation.js` (and the
Jest suite `themeValidation.test.js`).

## The 5-step checklist

| # | Check | Requirement | Automated? |
|---|-------|-------------|-----------|
| 1 | **Required colors present** | All 8 base colors defined & non-empty (`primary…border`) | ✅ `validateTheme` |
| 2 | **Valid values** | Any hex-looking color is a well-formed 3/6-digit hex | ✅ `validateTheme` |
| 3 | **Chrome tokens derivable** | `panel/well/textDim/textMuted/textFaint/gold/goldBorder/primarySurface` resolve (explicit or derived by `chrome.js`) | ✅ `resolveChrome` |
| 4 | **Contrast** | text/secondary vs background readable (WCAG-warn thresholds) | ✅ `contrastRatio` |
| 5 | **Skinning coverage** | Every hardcoded Dark-palette class maps to a defined `--wd-*` token | ✅ `SKINNING_MAP` + test |

## Coverage matrix (what must repaint)

| Chrome area | Representative selectors | Backing token |
|-------------|--------------------------|---------------|
| App shell / body | `html, body`, `[class~="bg-[#15130E]"]` | `--wd-well` |
| Left sidebar (Library, Layout, Forms, Shop, Files, Snips, Saved, Edit) | `[class~="bg-[#1C1A15]"]` | `--wd-panel` |
| Right sidebar inspector + Layers dock | `[class~="bg-[#1C1A15]"]`, borders | `--wd-panel`, `--wd-border` |
| Menu / Top / Pages / Status bars | `[class~="bg-[#1C1A15]"]`, `text-[#F1EDE2]` | `--wd-panel`, `--wd-text` |
| Tabs & buttons (active/hover) | `[class~="bg-[#242019]"]`, `hover:bg-[#332D22]` | `--wd-surface`, `--wd-border` |
| Inputs & code wells | `[class~="bg-[#15130E]"]` | `--wd-well` |
| Primary buttons / focus rings | `[class~="bg-[#C9A227]"]`, `ring-[#C9A227]` | `--wd-primary` |
| Publish badge & gold accents | `[class~="text-[#E8C34A]"]`, `border-[#4A3F1E]` | `--wd-gold`, `--wd-gold-border` |
| Modals & dropdown panels | `[class~="bg-[#1C1A15]"]`, `border-[#332D22]` | `--wd-panel`, `--wd-border` |

## How to run coverage

```bash
cd frontend
CI=true npx craco test --watchAll=false src/themes/themeValidation.test.js
```

The suite asserts:
- all **27** aesthetic themes + the Winamp/90s & Community rosters pass step 1–2,
- every theme resolves the full chrome-token set (step 3),
- `SKINNING_MAP` classes all target documented `--wd-*` tokens (step 5).

## Notes

- **Excluded from theming:** social/brand fills (Twitch `#6441a5`, Discord
  `#5865F2`, PayPal `#0070ba`, error red `#ff0000`) are intentionally left
  untouched.
- The Default theme pins every token to the historical hex values so the
  classic look is preserved byte-for-byte (verified by a Jest assertion).