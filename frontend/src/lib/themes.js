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
  {
    id: "dark-academia",
    name: "Dark Academia",
    canvas_bg: "#241d1a",
    google_font: "Cormorant Garamond",
    font: "'Cormorant Garamond', Georgia, serif",
    colors: {
      "--fc-bg": "#241d1a",
      "--fc-surface": "#3b2f2f",
      "--fc-text": "#e8e0cf",
      "--fc-muted": "#a08a6a",
      "--fc-primary": "#b08d57",
      "--fc-accent": "#7d1f2b",
      "--fc-border": "#4a3b33",
    },
    swatch: ["#241d1a", "#b08d57", "#7d1f2b", "#e8e0cf"],
  },
  {
    id: "vaporwave",
    name: "Vaporwave",
    canvas_bg: "#1a0b2e",
    google_font: "Chakra Petch",
    font: "'Chakra Petch', ui-sans-serif, sans-serif",
    colors: {
      "--fc-bg": "#1a0b2e",
      "--fc-surface": "#2d1b4e",
      "--fc-text": "#f5e6ff",
      "--fc-muted": "#b39ddb",
      "--fc-primary": "#f96cff",
      "--fc-accent": "#65e8ff",
      "--fc-border": "#3a2a5a",
    },
    swatch: ["#1a0b2e", "#f96cff", "#65e8ff", "#8f8cf2"],
  },
  {
    id: "dopamine",
    name: "Dopamine Brights",
    canvas_bg: "#fff9f0",
    google_font: "Fredoka",
    font: "'Fredoka', ui-sans-serif, sans-serif",
    colors: {
      "--fc-bg": "#fff9f0",
      "--fc-surface": "#ffffff",
      "--fc-text": "#1a1a2e",
      "--fc-muted": "#6b6b7b",
      "--fc-primary": "#ff2e63",
      "--fc-accent": "#2d6cff",
      "--fc-border": "#f0e6d8",
    },
    swatch: ["#fff9f0", "#ff2e63", "#2d6cff", "#ffd23f"],
  },
  {
    id: "mocha-mousse",
    name: "Mocha Mousse",
    canvas_bg: "#f0ebe3",
    google_font: "Sora",
    font: "'Sora', ui-sans-serif, sans-serif",
    colors: {
      "--fc-bg": "#f0ebe3",
      "--fc-surface": "#ffffff",
      "--fc-text": "#3a2e28",
      "--fc-muted": "#8a7568",
      "--fc-primary": "#a47864",
      "--fc-accent": "#cb6042",
      "--fc-border": "#ddd0c4",
    },
    swatch: ["#f0ebe3", "#a47864", "#cb6042", "#3a2e28"],
  },
  {
    id: "digital-lavender",
    name: "Digital Lavender",
    canvas_bg: "#f5f3ff",
    google_font: "Quicksand",
    font: "'Quicksand', ui-sans-serif, sans-serif",
    colors: {
      "--fc-bg": "#f5f3ff",
      "--fc-surface": "#ffffff",
      "--fc-text": "#2e2a45",
      "--fc-muted": "#8b83a8",
      "--fc-primary": "#a78bfa",
      "--fc-accent": "#7c5cff",
      "--fc-border": "#e4defb",
    },
    swatch: ["#f5f3ff", "#a78bfa", "#7c5cff", "#2e2a45"],
  },
  {
    id: "neo-acid",
    name: "Neo Acid",
    canvas_bg: "#0a0a0a",
    google_font: "JetBrains Mono",
    font: "'JetBrains Mono', ui-monospace, monospace",
    colors: {
      "--fc-bg": "#0a0a0a",
      "--fc-surface": "#141414",
      "--fc-text": "#f5f5f5",
      "--fc-muted": "#8a8a8a",
      "--fc-primary": "#39ff14",
      "--fc-accent": "#ff4081",
      "--fc-border": "#262626",
    },
    swatch: ["#0a0a0a", "#39ff14", "#00f5d4", "#ff4081"],
  },
  {
    id: "solar-botanical",
    name: "Solar Botanical",
    canvas_bg: "#f2fbf4",
    google_font: "Comfortaa",
    font: "'Comfortaa', ui-sans-serif, sans-serif",
    colors: {
      "--fc-bg": "#f2fbf4",
      "--fc-surface": "#ffffff",
      "--fc-text": "#10241a",
      "--fc-muted": "#5a7a68",
      "--fc-primary": "#10b981",
      "--fc-accent": "#f97316",
      "--fc-border": "#cfeadd",
    },
    swatch: ["#f2fbf4", "#10b981", "#14b8c4", "#f97316"],
  },
  {
    id: "midnight-foxglove",
    name: "Midnight Foxglove",
    canvas_bg: "#0a0a0a",
    google_font: "Josefin Sans",
    font: "'Josefin Sans', ui-sans-serif, sans-serif",
    colors: {
      "--fc-bg": "#0a0a0a",
      "--fc-surface": "#2d1f3d",
      "--fc-text": "#e8e0ef",
      "--fc-muted": "#a89bb0",
      "--fc-primary": "#9b7bc9",
      "--fc-accent": "#6b5b7b",
      "--fc-border": "#3b2a4a",
    },
    swatch: ["#0a0a0a", "#6b5b7b", "#9b7bc9", "#a89bb0"],
  },
  {
    id: "terracotta-linen",
    name: "Terracotta Linen",
    canvas_bg: "#f5ecd7",
    google_font: "DM Sans",
    font: "'DM Sans', ui-sans-serif, sans-serif",
    colors: {
      "--fc-bg": "#f5ecd7",
      "--fc-surface": "#fdf8ee",
      "--fc-text": "#3a2b22",
      "--fc-muted": "#8a7358",
      "--fc-primary": "#cb6042",
      "--fc-accent": "#7d9b76",
      "--fc-border": "#e6d8bf",
    },
    swatch: ["#f5ecd7", "#cb6042", "#7d9b76", "#3a2b22"],
  },
  {
    id: "synthwave",
    name: "Synthwave",
    canvas_bg: "#12002e",
    google_font: "Oxanium",
    font: "'Oxanium', ui-sans-serif, sans-serif",
    colors: {
      "--fc-bg": "#12002e",
      "--fc-surface": "#1e0446",
      "--fc-text": "#ffe6ff",
      "--fc-muted": "#a98fd0",
      "--fc-primary": "#ff2e97",
      "--fc-accent": "#00e5ff",
      "--fc-border": "#3a1a6a",
    },
    swatch: ["#12002e", "#ff2e97", "#00e5ff", "#ff8a3d"],
  },
  {
    id: "peach-fuzz",
    name: "Peach Fuzz",
    canvas_bg: "#fff5ef",
    google_font: "Nunito",
    font: "'Nunito', ui-sans-serif, sans-serif",
    colors: {
      "--fc-bg": "#fff5ef",
      "--fc-surface": "#ffffff",
      "--fc-text": "#43302b",
      "--fc-muted": "#a5847a",
      "--fc-primary": "#f7935f",
      "--fc-accent": "#ff6f61",
      "--fc-border": "#ffe0d0",
    },
    swatch: ["#fff5ef", "#f7935f", "#ff6f61", "#43302b"],
  },
  {
    id: "sage-matcha",
    name: "Sage Matcha",
    canvas_bg: "#f3f6ef",
    google_font: "Mulish",
    font: "'Mulish', ui-sans-serif, sans-serif",
    colors: {
      "--fc-bg": "#f3f6ef",
      "--fc-surface": "#ffffff",
      "--fc-text": "#232b1f",
      "--fc-muted": "#6f7a64",
      "--fc-primary": "#7d9b76",
      "--fc-accent": "#4a7c59",
      "--fc-border": "#dde5d3",
    },
    swatch: ["#f3f6ef", "#7d9b76", "#4a7c59", "#232b1f"],
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
