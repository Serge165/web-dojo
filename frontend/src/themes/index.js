// Theme loader + applier. Themes skin the editor UI via CSS custom
// properties (--wd-*) on <html>; persistence is localStorage-backed so the
// choice survives reloads (spec: "Refresh page → theme persists").
import * as builtIn from "./builtinThemes";
import * as community from "./community-themes";

export const themes = {
  defaultTheme: builtIn.defaultTheme,
  winampModern: builtIn.winampModern,
  winampClassic: builtIn.winampClassic,
  acidTrip: builtIn.acidTrip,
  vaporwave: builtIn.vaporwave,
  darkVoid: builtIn.darkVoid,
  matrixGreen: builtIn.matrixGreen,
  glitchSynthwave: builtIn.glitchSynthwave,
  dracula: community.dracula,
  nord: community.nord,
  gruvboxDark: community.gruvboxDark,
  solarizedLight: community.solarizedLight,
  synthwave80s: community.synthwave80s,
  windows95: community.windows95,
  cyberpunkNoir: community.cyberpunkNoir,
  terminalAmber: community.terminalAmber,
};

export const STORAGE_KEY = "webdojo-theme";

export const getSavedThemeName = () => {
  try { return localStorage.getItem(STORAGE_KEY) || "defaultTheme"; } catch { return "defaultTheme"; }
};

/** Apply a theme's colors/typography/effects as CSS variables + effect
 * classes on documentElement. Pure DOM side-effect, safe to call twice. */
export const applyTheme = (themeKey) => {
  const themeObj = themes[themeKey] || themes.defaultTheme;
  if (typeof document === "undefined") return themeObj;
  const root = document.documentElement;
  Object.entries(themeObj.colors).forEach(([key, value]) => {
    root.style.setProperty(`--wd-${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`, value);
  });
  root.style.setProperty("--wd-font-family", themeObj.typography.fontFamily);
  ["glassEffect", "beveledEdges", "gradients", "glow"].forEach((fx) => {
    root.classList.toggle(`theme-${fx.toLowerCase().replace("effect", "")}`, !!themeObj.effects[fx]);
  });
  root.setAttribute("data-wd-theme", themeKey);
  return themeObj;
};

export const saveTheme = (themeKey) => {
  applyTheme(themeKey);
  try { localStorage.setItem(STORAGE_KEY, themeKey); } catch { /* private mode */ }
};
