// Theme validation helpers for Web Dojo's skinning system.
//
// Used by:
//   - src/themes/index.js importTheme()  -> reject malformed imported palettes
//   - src/themes/themeValidation.test.js -> CI check that every bundled theme
//     (Winamp/90s, Community, Aesthetic) passes the coverage + contrast rules
//   - docs/THEME_VALIDATION_CHECKLIST.md -> the 5-step checklist it encodes
//

// The 7 base colors every theme must define (the chrome tokens in
// src/themes/chrome.js auto-derive from these, so they don't need explicit
// values for a theme to be valid).
export const REQUIRED_COLORS = [
  "primary", "secondary", "accent",
  "background", "surface", "text", "textSecondary", "border",
];

// The skinning layer's remap table (hardcoded Dark-palette class -> var).
// Keeping it here lets tests assert that skinning.css covers every token and
// is the single source of truth for documentation/tooling.
export const SKINNING_MAP = {
  "bg-[#1C1A15]": "--wd-panel",
  "bg-[#242019]": "--wd-surface",
  "bg-[#15130E]": "--wd-well",
  "bg-[#332D22]": "--wd-border",
  "bg-[#14120E]": "--wd-background",
  "bg-[#2A2416]": "--wd-primary-surface",
  "bg-[#C9A227]": "--wd-primary",
  "bg-[#AD8B21]": "--wd-primary",
  "bg-[#D9BC55]": "--wd-primary",
  "text-[#F1EDE2]": "--wd-text",
  "text-[#E4DECE]": "--wd-text-dim",
  "text-[#A79C87]": "--wd-text-secondary",
  "text-[#948C79]": "--wd-text-muted",
  "text-[#6B6353]": "--wd-text-faint",
  "text-[#C9A227]": "--wd-gold",
  "text-[#D9BC55]": "--wd-gold",
  "text-[#E8C34A]": "--wd-gold",
  "border-[#332D22]": "--wd-border",
  "border-[#C9A227]": "--wd-primary",
  "border-[#242019]": "--wd-surface",
  "border-[#1C1A15]": "--wd-panel",
  "border-[#4A3F1E]": "--wd-gold-border",
};

// Every --wd-* token the skinning layer may reference, with its purpose.
export const WD_TOKENS = {
  "--wd-primary": "Primary / accent buttons & highlights",
  "--wd-secondary": "Branded secondary bar",
  "--wd-background": "Deepest app background",
  "--wd-surface": "Raised surfaces, hover fills",
  "--wd-panel": "Sidebar / menu-bar fills",
  "--wd-well": "App shell bg, inputs, code wells",
  "--wd-text": "Primary text",
  "--wd-text-dim": "Dim heading/strong text",
  "--wd-text-secondary": "Secondary text",
  "--wd-text-muted": "Muted / disabled text",
  "--wd-text-faint": "Faint captions",
  "--wd-border": "Hairlines & borders",
  "--wd-gold": "Publish badge / gold accents",
  "--wd-gold-border": "Gold-border accents",
  "--wd-primary-surface": "Hover tint near primary fills",
};

const hexRgb = (h) => {
  let s = (h || "").trim().replace(/^#/, "");
  if (s.length === 3) s = s.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(s)) return null;
  const n = parseInt(s, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const lum = (rgb) => {
  const [r, g, b] = rgb.map((v) => {
    v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
/** WCAG relative-luminance contrast ratio (1..21). */
export const contrastRatio = (a, b) => {
  const ra = hexRgb(a), rb = hexRgb(b);
  if (!ra || !rb) return null;
  const la = lum(ra), lb = lum(rb);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
};

/**
 * Validate a theme and return a list of { severity, token, message } issues.
 * severity "error" fails import; "warn" is informational (contrast, coverage).
 */
export const validateTheme = (theme) => {
  const c = theme?.colors || {};
  const issues = [];
  for (const key of REQUIRED_COLORS) {
    if (!c[key] || String(c[key]).trim() === "") {
      issues.push({ severity: "error", token: key, message: `Missing required color "${key}".` });
    } else if (String(c[key]).includes("#") && !hexRgb(c[key])) {
      issues.push({ severity: "error", token: key, message: `"${key}" is not a valid hex color (${c[key]}).` });
    }
  }
  const bg = c.background;
  const text = c.text;
  if (bg && text && hexRgb(bg) && hexRgb(text)) {
    const r = contrastRatio(bg, text);
    if (r != null && r < 2.5) {
      issues.push({ severity: "warn", token: "text/background", message: `Low contrast text vs background (ratio ${r.toFixed(2)}:1).`, ratio: r });
    }
  }
  if (bg && c.textSecondary && hexRgb(bg) && hexRgb(c.textSecondary)) {
    const r = contrastRatio(bg, c.textSecondary);
    if (r != null && r < 1.8) {
      issues.push({ severity: "warn", token: "textSecondary/background", message: `Low contrast secondary text (ratio ${r.toFixed(2)}:1).`, ratio: r });
    }
  }
  return issues;
};

/** The 5-step validation checklist this system encodes (mirrors docs). */
export const THEME_VALIDATION_CHECKLIST = [
  { step: 1, name: "Required colors present", detail: "All 8 base colors (primary…border) are defined and non-empty." },
  { step: 2, name: "Valid hex values", detail: "Any hex-looking color is a well-formed 3/6-digit hex." },
  { step: 3, name: "Chrome tokens derivable", detail: "panel/well/text-dim/muted/faint/gold resolve (explicit or derived)." },
  { step: 4, name: "Text contrast", detail: "text/secondary vs background meet readability thresholds (warn-only)." },
  { step: 5, name: "Skinning coverage", detail: "Every hardcoded Dark-palette class maps to a defined --wd-* token." },
];

/** Returns all --wd-* tokens a theme resolves, for coverage assertions. */
export const resolveTokensForTheme = (theme) => {
  const { resolveChrome } = require("./chrome");
  return Object.keys(resolveChrome(theme));
};
