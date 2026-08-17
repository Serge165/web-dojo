// Aesthetic theme presets. Each theme provides colors, a font stack, an
// optional Google font family, canvas background and CSS variables that get
// injected into the exported <head>.

export const THEMES = [
  {
    id: "cottage-core",
    name: "Cottage Core",
    canvas_bg: "#f4ecd8",
    google_font: "Fraunces",
    font: "'Fraunces', Georgia, serif",
    colors: {
      "--fc-bg": "#f4ecd8",
      "--fc-surface": "#ede0c4",
      "--fc-text": "#3b2f1f",
      "--fc-muted": "#7a6a4a",
      "--fc-primary": "#6a7a3a",
      "--fc-accent": "#c07a4a",
      "--fc-border": "#d2c39d",
    },
    swatch: ["#f4ecd8", "#6a7a3a", "#c07a4a", "#3b2f1f"],
  },
  {
    id: "grey-metal",
    name: "Grey Metal",
    canvas_bg: "#151517",
    google_font: "Rajdhani",
    font: "'Rajdhani', 'Impact', sans-serif",
    colors: {
      "--fc-bg": "#151517",
      "--fc-surface": "#1e1e22",
      "--fc-text": "#dcdcdc",
      "--fc-muted": "#8a8a8f",
      "--fc-primary": "#c0c0c8",
      "--fc-accent": "#ff2b2b",
      "--fc-border": "#2a2a2e",
    },
    swatch: ["#151517", "#c0c0c8", "#ff2b2b", "#dcdcdc"],
  },
  {
    id: "book-fair",
    name: "Book Fair",
    canvas_bg: "#fbf7ee",
    google_font: "Playfair Display",
    font: "'Playfair Display', 'Times New Roman', serif",
    colors: {
      "--fc-bg": "#fbf7ee",
      "--fc-surface": "#f2eadb",
      "--fc-text": "#2b1d14",
      "--fc-muted": "#7e6a55",
      "--fc-primary": "#8a2a1f",
      "--fc-accent": "#c9a35b",
      "--fc-border": "#e2d6ba",
    },
    swatch: ["#fbf7ee", "#8a2a1f", "#c9a35b", "#2b1d14"],
  },
  {
    id: "brutalism",
    name: "Brutalism",
    canvas_bg: "#fff200",
    google_font: "Space Grotesk",
    font: "'Space Grotesk', ui-sans-serif, sans-serif",
    colors: {
      "--fc-bg": "#fff200",
      "--fc-surface": "#ffffff",
      "--fc-text": "#000000",
      "--fc-muted": "#111111",
      "--fc-primary": "#000000",
      "--fc-accent": "#ff2ecc",
      "--fc-border": "#000000",
    },
    swatch: ["#fff200", "#000000", "#ff2ecc", "#ffffff"],
  },
  {
    id: "y2k",
    name: "Y2K Bubble",
    canvas_bg: "#e6f0ff",
    google_font: "VT323",
    font: "'VT323', 'Comic Sans MS', monospace",
    colors: {
      "--fc-bg": "#e6f0ff",
      "--fc-surface": "#c6d8ff",
      "--fc-text": "#12224a",
      "--fc-muted": "#5a6a99",
      "--fc-primary": "#4a5cff",
      "--fc-accent": "#ff69b4",
      "--fc-border": "#a2b6ea",
    },
    swatch: ["#e6f0ff", "#4a5cff", "#ff69b4", "#12224a"],
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    canvas_bg: "#05010f",
    google_font: "Orbitron",
    font: "'Orbitron', ui-monospace, monospace",
    colors: {
      "--fc-bg": "#05010f",
      "--fc-surface": "#0f0424",
      "--fc-text": "#e6f2ff",
      "--fc-muted": "#7a86a8",
      "--fc-primary": "#00ffe0",
      "--fc-accent": "#ff00a8",
      "--fc-border": "#231549",
    },
    swatch: ["#05010f", "#00ffe0", "#ff00a8", "#e6f2ff"],
  },
  {
    id: "memphis",
    name: "Memphis",
    canvas_bg: "#ffffff",
    google_font: "Poppins",
    font: "'Poppins', ui-sans-serif, sans-serif",
    colors: {
      "--fc-bg": "#ffffff",
      "--fc-surface": "#f3f3f3",
      "--fc-text": "#1a1a1a",
      "--fc-muted": "#555555",
      "--fc-primary": "#ff5d5d",
      "--fc-accent": "#3ac0ff",
      "--fc-border": "#1a1a1a",
    },
    swatch: ["#ffffff", "#ff5d5d", "#3ac0ff", "#ffd23f"],
  },
  {
    id: "glassmorphism",
    name: "Glassmorphism",
    canvas_bg: "linear-gradient(135deg,#7c3aed 0%,#2563eb 50%,#06b6d4 100%)",
    google_font: "Inter",
    font: "'Inter', ui-sans-serif, sans-serif",
    colors: {
      "--fc-bg": "rgba(255,255,255,0.08)",
      "--fc-surface": "rgba(255,255,255,0.14)",
      "--fc-text": "#ffffff",
      "--fc-muted": "rgba(255,255,255,0.7)",
      "--fc-primary": "#ffffff",
      "--fc-accent": "#c4b5fd",
      "--fc-border": "rgba(255,255,255,0.24)",
    },
    swatch: ["#7c3aed", "#2563eb", "#06b6d4", "#ffffff"],
  },
  {
    id: "scandi-min",
    name: "Scandi Minimal",
    canvas_bg: "#fafafa",
    google_font: "Manrope",
    font: "'Manrope', ui-sans-serif, sans-serif",
    colors: {
      "--fc-bg": "#fafafa",
      "--fc-surface": "#ffffff",
      "--fc-text": "#101010",
      "--fc-muted": "#7a7a7a",
      "--fc-primary": "#101010",
      "--fc-accent": "#3d5afe",
      "--fc-border": "#e6e6e6",
    },
    swatch: ["#fafafa", "#101010", "#3d5afe", "#7a7a7a"],
  },
];

export const themeHeadHtml = (theme) => {
  const linkTag = theme.google_font
    ? `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(theme.google_font)}:wght@300;400;500;600;700&display=swap" rel="stylesheet">`
    : "";
  const vars = Object.entries(theme.colors).map(([k, v]) => `  ${k}: ${v};`).join("\n");
  return `${linkTag}
<style data-forge-theme="${theme.id}">
:root {
${vars}
}
body { font-family: ${theme.font}; color: var(--fc-text); }
</style>`;
};

export const buildCustomThemeHead = ({ primary, accent, text, bg, muted, border, font, googleFont }) => {
  const link = googleFont
    ? `<link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(googleFont)}:wght@300;400;500;600;700&display=swap" rel="stylesheet">`
    : "";
  return `${link}
<style data-forge-theme="custom">
:root {
  --fc-primary: ${primary};
  --fc-accent: ${accent};
  --fc-text: ${text};
  --fc-bg: ${bg};
  --fc-muted: ${muted};
  --fc-border: ${border};
}
body { font-family: ${font}; color: var(--fc-text); background: var(--fc-bg); }
</style>`;
};
