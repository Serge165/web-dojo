// Web Dojo editor themes (Winamp / 90s-aesthetic skinnable UI).
// These skin the BUILDER INTERFACE only — user sites are untouched.
// A theme maps to CSS custom properties (--wd-*) applied on
// documentElement by applyTheme(); see ThemeGallery for the picker.

const t = (name, description, colors, extra = {}) => ({
  name,
  description,
  colors,
  typography: {
    fontFamily: "'Trebuchet MS', 'Segoe UI', sans-serif",
    ...(extra.typography || {}),
  },
  effects: { glassEffect: false, beveledEdges: false, gradients: false, glow: false, ...(extra.effects || {}) },
});

export const defaultTheme = t("Default", "The classic Web Dojo look", {
  primary: "#C9A227", secondary: "#332D22", accent: "#F1EDE2",
  background: "#14120E", surface: "#242019", text: "#F1EDE2",
  textSecondary: "#A79C87", border: "#332D22",
});

export const winampModern = t("Winamp Modern", "Sleek modern take on Winamp", {
  primary: "#ff6600", secondary: "#333333", accent: "#00ffcc",
  background: "#1a1a1a", surface: "#2a2a2a", text: "#ffffff",
  textSecondary: "#cccccc", border: "#444444",
}, { effects: { gradients: true } });

export const winampClassic = t("Winamp Classic", "Golden-age 90s media player", {
  primary: "#00ff00", secondary: "#1e1c30", accent: "#ffbf00",
  background: "#17161f", surface: "#292840", text: "#d7ffe0",
  textSecondary: "#7d93a8", border: "#3b5a6b",
}, { effects: { beveledEdges: true } });

export const acidTrip = t("Acid Trip", "Lurid neons and psychedelia", {
  primary: "#ff00ff", secondary: "#00ffff", accent: "#ffff00",
  background: "#1a0033", surface: "#330066", text: "#ffff00",
  textSecondary: "#ff00ff", border: "#00ffff",
}, { effects: { glassEffect: true, beveledEdges: true, gradients: true, glow: true } });

export const vaporwave = t("Vaporwave", "Pastel retro-future dreamscape", {
  primary: "#ff006e", secondary: "#8338ec", accent: "#3a86ff",
  background: "#1b1030", surface: "#2d1b4e", text: "#ffd6e8",
  textSecondary: "#b892ff", border: "#ff77aa",
}, { effects: { glassEffect: true, gradients: true } });

export const darkVoid = t("Dark Void", "Deep space black with cyan", {
  primary: "#00e5ff", secondary: "#101418", accent: "#7c4dff",
  background: "#05070a", surface: "#0e1218", text: "#e6f7ff",
  textSecondary: "#7a93a8", border: "#1c2733",
});

export const matrixGreen = t("Matrix Green", "Green terminal hacker aesthetic", {
  primary: "#00ff41", secondary: "#001100", accent: "#00ff41",
  background: "#000000", surface: "#0a0f0a", text: "#00ff41",
  textSecondary: "#00b32d", border: "#00ff41",
}, {
  typography: { fontFamily: "'Courier New', monospace" },
  effects: { glow: true },
});

export const glitchSynthwave = t("Glitch Synthwave", "Neon grids and VHS static", {
  primary: "#ff2bd6", secondary: "#12081f", accent: "#05d9e8",
  background: "#0d0221", surface: "#1a0b38", text: "#f7f7ff",
  textSecondary: "#9b8cff", border: "#ff2bd6",
}, { effects: { gradients: true, glow: true } });
