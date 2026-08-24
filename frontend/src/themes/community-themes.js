// Community-harvested themes — palettes adapted from well-known public
// color schemes (Dracula, Nord, Gruvbox, Solarized, synthwave collections,
// retro OS skins). Same shape as builtinThemes.js entries.

import { defaultTheme } from "./builtinThemes";

const t = (name, description, colors, extra = {}) => ({
  name,
  description,
  colors,
  typography: { fontFamily: "'Trebuchet MS', 'Segoe UI', sans-serif", ...(extra.typography || {}) },
  effects: { glassEffect: false, beveledEdges: false, gradients: false, glow: false, ...(extra.effects || {}) },
});

export const dracula = t("Dracula", "Purple dark theme classic", {
  primary: "#bd93f9", secondary: "#44475a", accent: "#ff79c6",
  background: "#282a36", surface: "#343746", text: "#f8f8f2",
  textSecondary: "#6272a4", border: "#44475a",
}, { effects: { glow: true } });

export const nord = t("Nord Frost", "Cool arctic blues", {
  primary: "#88c0d0", secondary: "#3b4252", accent: "#a3be8c",
  background: "#2e3440", surface: "#3b4252", text: "#eceff4",
  textSecondary: "#d8dee9", border: "#4c566a",
});

export const gruvboxDark = t("Gruvbox Dark", "Retro warm earth tones", {
  primary: "#fabd2f", secondary: "#3c3836", accent: "#8ec07c",
  background: "#282828", surface: "#32302f", text: "#ebdbb2",
  textSecondary: "#a89984", border: "#504945",
});

export const solarizedLight = t("Solarized Light", "Calm paper-like light scheme", {
  primary: "#268bd2", secondary: "#eee8d5", accent: "#859900",
  background: "#fdf6e3", surface: "#eee8d5", text: "#586e75",
  textSecondary: "#93a1a1", border: "#dfd6c1",
});

export const synthwave80s = t("Synthwave 80s", "Sunset grids and chrome", {
  primary: "#f6019d", secondary: "#150324", accent: "#ffd319",
  background: "#0d0221", surface: "#241734", text: "#ffeaff",
  textSecondary: "#c46bff", border: "#ff71ce",
}, { effects: { gradients: true, glow: true } });

export const windows95 = t("Windows 95", "Beveled gray desktop nostalgia", {
  primary: "#000080", secondary: "#c0c0c0", accent: "#008080",
  background: "#008080", surface: "#c0c0c0", text: "#000000",
  textSecondary: "#404040", border: "#808080",
}, { effects: { beveledEdges: true }, typography: { fontFamily: "'MS Sans Serif', 'Segoe UI', sans-serif" } });

export const cyberpunkNoir = t("Cyberpunk Noir", "Rain-slick neon streets", {
  primary: "#fcee0a", secondary: "#101014", accent: "#00f0ff",
  background: "#0b0b10", surface: "#17171f", text: "#f7f7f7",
  textSecondary: "#8a8a99", border: "#fcee0a",
}, { effects: { glow: true, gradients: true } });

export const terminalAmber = t("Terminal Amber", "Warm phosphor CRT glow", {
  primary: "#ffb000", secondary: "#141210", accent: "#ffb000",
  background: "#0d0b08", surface: "#1a160f", text: "#ffc04d",
  textSecondary: "#b3813a", border: "#ffb000",
}, { typography: { fontFamily: "'Courier New', monospace" }, effects: { glow: true } });

export { defaultTheme };
