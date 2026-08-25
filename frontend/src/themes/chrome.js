// Chrome token resolution for Web Dojo's full-UI theming layer.
//
// The builder chrome is painted with a hardcoded "Dark" Tailwind palette
// (`#1C1A21` panels, `#242019` surfaces, `#15130E` wells, `#332D22` borders,
// `#F1EDE2` text, `#A79C87`/`#948C79` secondary & muted text, `#C9A227`
// primary, `#E4DECE` dim text). `skinning.css` remaps every one of those
// classes to a `--wd-*` CSS custom property, so a theme that fills these
// tokens repaints the ENTIRE interface — left/right sidebars, the inspector,
// menu bar, top/status bars, canvas chrome, modals and dropdowns — not just
// the top bar.
//
// Each `--wd-*` value comes from `theme.colors` first; when a theme does not
// pin a chrome token explicitly we derive it from the seven base colors it
// already defines (primary / secondary / accent / background / surface /
// text / textSecondary / border). The bundled "Default" theme pins every
// token to the historical hex values so the classic look is preserved
// byte-for-byte.

// Semantic chrome tokens, in the order they are applied (kebab-cased to
// --wd-{name} by applyTheme).
export const CHROME_TOKENS = [
  { key: "panel", def: "#1C1A21" }, // left/right sidebar + top/menu bar fill
  { key: "well", def: "#151310", input: true }, // app shell bg, code wells, inputs
  { key: "textDim", def: "#E4DECE" },
  { key: "textMuted", def: "#948C79" },
  { key: "textFaint", def: "#6B6353" },
  { key: "gold", def: "#E8C34A" }, // Publish badge, gold accents
  { key: "goldBorder", def: "#4A3F1E" },
  { key: "primarySurface", def: "#2A2416" }, // hover tint on primary-flavored fills
];

const pick = (c, key, ...fallbacks) => {
  for (const f of [c[key], ...fallbacks]) if (typeof f === "string" && f) return f;
  return undefined;
};

/**
 * Expand a theme's `colors` map into a complete token map for the whole UI.
 * Extra chrome tokens are only injected when they are not already present.
 * @param {{colors: Record<string,string>}} theme
 * @returns {Record<string,string>} complete color map (base + chrome tokens)
 */
export const resolveChrome = (theme) => {
  const c = { ...(theme?.colors || {}) };
  if (!theme) return c;
  c.panel = pick(c, "panel", c.surface, c.background, "#1C1A15");
  c.well = pick(c, "well", c.background, c.surface, "#15130E");
  c.textDim = pick(c, "textDim", c.text, c.textSecondary, "#E4DECE");
  c.textMuted = pick(c, "textMuted", c.textSecondary, c.text, "#948C79");
  c.textFaint = pick(c, "textFaint", c.textSecondary, c.text, "#6B6353");
  c.gold = pick(c, "gold", c.primary, c.accent, "#E8C34A");
  c.goldBorder = pick(c, "goldBorder", c.primary, c.border, "#4A3F1E");
  c.primarySurface = pick(c, "primarySurface", c.surface, c.background, "#2A2416");
  return c;
};

/** The canonical Chrome-terminal fallbacks used by the CSS `var()` layer. */
export const chromeDefaults = () =>
  Object.fromEntries(CHROME_TOKENS.map((t) => [t.key, t.def]));