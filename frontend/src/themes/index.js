// Theme loader + applier for Web Dojo's editor skinning system.
//
// Themes skin the ENTIRE editor UI via CSS custom properties (--wd-*) on
// <html>; persistence is localStorage-backed so the choice survives reloads.
// Full-UI coverage is achieved by:
//   - src/themes/chrome.js    -> derives chrome tokens (panel/well/text-dim/
//     muted/faint/gold/...) from each theme's base colors
//   - src/themes/skinning.css -> remaps the hardcoded Dark Tailwind palette
//     to --wd-* so every panel/modal/menu repaints
//
// Extra capabilities: registerTheme (runtime/custom), exportTheme /
// importTheme JSON export & import, and live preview via applyTheme().
import * as builtIn from "./builtinThemes";
import * as community from "./community-themes";
import { aestheticThemes } from "./aestheticThemes";
import { resolveChrome } from "./chrome";

const CATEGORY = {
  Winamp90s: "Winamp & 90s",
  Community: "Community",
  Aesthetic: "Aesthetic",
  Custom: "Custom",
};

const tag = (obj, category) =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, { ...v, category }]));

// Mutable registry keyed by theme key. Custom/imported themes register at
// runtime via registerTheme().
export const themes = {
  ...tag(builtIn, CATEGORY.Winamp90s),
  ...tag(community, CATEGORY.Community),
  ...tag(aestheticThemes, CATEGORY.Aesthetic),
};

export const themeCategories = CATEGORY;

export const STORAGE_KEY = "webdojo-theme";
const CUSTOM_STORAGE_KEY = "webdojo-custom-themes";

/** Register a theme (e.g. one imported from JSON) so it can be applied/shown. */
export const registerTheme = (themeKey, themeObj) => {
  themes[themeKey] = { ...themeObj, category: CATEGORY.Custom };
  return themes[themeKey];
};

const kebab = (key) => key.replace(/([A-Z])/g, "-$1").toLowerCase();

/** Apply a theme's colors/typography/effects as CSS variables + effect
 *  classes on documentElement. Pure DOM side-effect, safe to call twice. */
export const applyTheme = (themeKey) => {
  const themeObj = themes[themeKey] || themes.defaultTheme;
  if (typeof document === "undefined") return themeObj;
  const root = document.documentElement;
  Object.entries(resolveChrome(themeObj)).forEach(([key, value]) => {
    root.style.setProperty(`--wd-${kebab(key)}`, value);
  });
  root.style.setProperty("--wd-font-family", themeObj.typography?.fontFamily || "'Trebuchet MS', sans-serif");
  ["glassEffect", "beveledEdges", "gradients", "glow"].forEach((fx) => {
    root.classList.toggle(`theme-${fx.toLowerCase().replace("effect", "")}`, !!themeObj.effects?.[fx]);
  });
  root.setAttribute("data-wd-theme", themeKey);
  return themeObj;
};

export const saveTheme = (themeKey) => {
  applyTheme(themeKey);
  try { localStorage.setItem(STORAGE_KEY, themeKey); } catch { /* private mode */ }
};

export const getSavedThemeName = () => {
  try { return localStorage.getItem(STORAGE_KEY) || "defaultTheme"; } catch { return "defaultTheme"; }
};

/** Rehydrate previously imported custom themes at module load so a chosen
 *  custom skin survives reloads (persistence spec). */
const persistCustom = () => {
  try {
    const custom = Object.entries(themes)
      .filter(([, t]) => t && t.category === CATEGORY.Custom)
      .reduce((acc, [k, v]) => { acc[k] = { key: k, ...v }; return acc; }, {});
    localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(custom));
  } catch { /* private mode */ }
};
try {
  const raw = localStorage.getItem(CUSTOM_STORAGE_KEY);
  if (raw) {
    Object.entries(JSON.parse(raw)).forEach(([key, obj]) => {
      if (obj && typeof obj.colors === "object") themes[key] = { ...obj, category: CATEGORY.Custom };
    });
  }
} catch { /* ignore */ }

/* ---- Export / import (theme export/import for user-created themes) ---- */

const toPlain = ([key, theme]) => ({
  key,
  name: theme.name,
  description: theme.description,
  colors: theme.colors,
  typography: theme.typography,
  effects: theme.effects,
});

/** Serialize a selection of themes to pretty JSON text. */
export const serializeTheme = (subset) =>
  JSON.stringify(Object.entries(subset).map(toPlain), null, 2);

/** Export a single theme to a downloadable JSON blob. */
export const exportTheme = (themeKey) => {
  const t = themes[themeKey];
  if (!t) return null;
  if (typeof document !== "undefined") {
    const blob = new Blob([serializeTheme({ [themeKey]: t })], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `webdojo-theme-${themeKey}.json`; a.click();
    URL.revokeObjectURL(url);
  }
  return themeKey;
};

/** Parse + validate a theme JSON payload into a runtime theme object, or
 *  null when malformed. */
export const parseThemeJson = (json) => {
  try { return typeof json === "string" ? JSON.parse(json) : json; } catch { return null; }
};

/** Import a theme JSON payload — registers it and returns its key, or throws
 *  on invalid input. */
export const importTheme = (json) => {
  const entry = parseThemeJson(json);
  if (!entry || !entry.key || typeof entry.colors !== "object") {
    throw new Error("Invalid theme JSON: expected { key, name, colors, ... }.");
  }
  const { validateTheme } = require("./themeValidation");
  const issues = validateTheme({ colors: entry.colors });
  const errors = issues.filter((i) => i.severity === "error");
  if (errors.length) throw new Error(`Invalid theme palette: ${errors.map((i) => i.message).join("; ")}`);
  const key = entry.key;
  registerTheme(key, {
    name: entry.name || key,
    description: entry.description || "Imported theme",
    colors: entry.colors,
    typography: { fontFamily: "'Trebuchet MS', 'Segoe UI', sans-serif", ...(entry.typography || {}) },
    effects: { glassEffect: false, beveledEdges: false, gradients: false, glow: false, ...(entry.effects || {}) },
  });
  persistCustom();
  return key;
};
