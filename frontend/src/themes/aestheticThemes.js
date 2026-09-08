// Web Dojo EDITOR SKINS for the 27 Aesthetic Mood-Board starters.
// Each entry follows the shape of src/themes/builtinThemes.js and, via the
// full chrome-token contract (src/themes/chrome.js + skinning.css), skins the
// ENTIRE editor UI — sidebars, inspector, menu/top/status bars, modals and
// dropdowns — not just the top bar. Chrome-only tokens are optional and
// auto-derive from the seven base colors when omitted.

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

export const aestheticThemes = {
  "aesthetic-frutiger-aero": t("Frutiger Aero", "Glossy, aqua, back-of-a-Windows-Vista-box optimism", {
    primary: "#4aa8e0", secondary: "#0d4b6e", accent: "#86e0ee",
    background: "#06283d", surface: "#0d3b55", text: "#e8faff",
    textSecondary: "#9fd4e8", border: "#16566f",
    well: "#05222f", panel: "#083247",
  }, { effects: { glassEffect: true, gradients: true }, typography: { fontFamily: "'Segoe UI', 'Trebuchet MS', sans-serif" } }),

  "aesthetic-dark-academia": t("Dark Academia", "Warm lamplight, espresso, dusty hardcovers", {
    primary: "#b0895a", secondary: "#3a2a1c", accent: "#d8c49a",
    background: "#1a1209", surface: "#292019", text: "#eee3c8",
    textSecondary: "#a89472", border: "#4a3826",
    well: "#140e07", panel: "#241a0f",
  }, { typography: { fontFamily: "'Georgia', 'Times New Roman', serif" } }),

  "aesthetic-solar-punk": t("Solar Punk", "Lived-in hope, sun, soil and circuits", {
    primary: "#7fb069", secondary: "#2f4d28", accent: "#e9d985",
    background: "#1e3a20", surface: "#2c4d2b", text: "#f4efd6",
    textSecondary: "#bfcd8f", border: "#3f5c33",
    panel: "#243f22", well: "#17301b",
  }, { typography: { fontFamily: "'Fraunces', Georgia, serif" } }),

  "aesthetic-cottagecore": t("Cottagecore", "Thrifted florals, warm scones, soft morning light", {
    primary: "#6a7a3a", secondary: "#4a2f22", accent: "#c07a4a",
    background: "#2c201a", surface: "#3a2c22", text: "#f4ecd8",
    textSecondary: "#c2a579", border: "#58442f",
    panel: "#33251c", well: "#241b14",
  }, { typography: { fontFamily: "'Fraunces', Georgia, serif" } }),

  "aesthetic-y2k": t("Y2K", "Chrome, bubblegum and starry sparkle", {
    primary: "#4a5cff", secondary: "#1a1a2e", accent: "#ff69b4",
    background: "#12122a", surface: "#1d1d40", text: "#f2e9ff",
    textSecondary: "#a8b4ff", border: "#4a3f8a",
    panel: "#181836", well: "#0e0e20",
  }, { effects: { gradients: true, glow: true }, typography: { fontFamily: "'VT323', 'Courier New', monospace" } }),

  "aesthetic-vaporwave": t("Vaporwave", "Sunset gradients, roman busts, mall music", {
    primary: "#ff5db1", secondary: "#2d1b4e", accent: "#3a86ff",
    background: "#1b1030", surface: "#2d1b4e", text: "#ffe6f2",
    textSecondary: "#b892ff", border: "#7a4fd0",
    well: "#140a26", panel: "#241648",
  }, { effects: { glassEffect: true, gradients: true, glow: true }, typography: { fontFamily: "'Bodoni Moda', Georgia, serif" } }),

  "aesthetic-cyberpunk": t("Cyberpunk", "Neon skylines, black terminals, moody rain", {
    primary: "#00e5ff", secondary: "#12081f", accent: "#ff2bd6",
    background: "#05010f", surface: "#0f0424", text: "#e6f2ff",
    textSecondary: "#7a86a8", border: "#231549",
    well: "#04000a", panel: "#0b0518",
  }, { effects: { gradients: true, glow: true }, typography: { fontFamily: "'Orbitron', 'Courier New', monospace" } }),
"aesthetic-brutalism": t("Brutalism", "Concrete, stark contrast, no apology", {
    primary: "#ff2ecc", secondary: "#111111", accent: "#fff200",
    background: "#0a0a0a", surface: "#161616", text: "#ffffff",
    textSecondary: "#cfcfcf", border: "#ffffff",
    well: "#000000", panel: "#1c1c1c",
  }, { effects: { beveledEdges: true }, typography: { fontFamily: "'Space Grotesk', 'Arial Black', sans-serif" } }),

  "aesthetic-bauhaus": t("Bauhaus", "Red, black and cream; form follows function", {
    primary: "#e63946", secondary: "#222222", accent: "#f4c542",
    background: "#151515", surface: "#221f1b", text: "#f2eede",
    textSecondary: "#b8ad8a", border: "#e63946",
    panel: "#201c16", well: "#100e0c",
  }, { typography: { fontFamily: "'Archivo Black', 'Arial', sans-serif" } }),

  "aesthetic-scandi-minimal": t("Scandi Minimal", "Quiet light, warm neutrals, intentional emptiness", {
    primary: "#2b2b2b", secondary: "#d8d2c4", accent: "#c9a86a",
    background: "#efece4", surface: "#ffffff", text: "#1c1c1c",
    textSecondary: "#6e6a5f", border: "#d8d2c4",
    well: "#e6e2d6", panel: "#f5f2ea",
  }, { typography: { fontFamily: "'Inter', 'Segoe UI', sans-serif" } }),

  "aesthetic-memphis": t("Memphis", "Slanted stripes, squiggles, 80s pop geometry", {
    primary: "#ff3b8b", secondary: "#0e3b66", accent: "#ffd23f",
    background: "#14141c", surface: "#23233a", text: "#fff6e8",
    textSecondary: "#d8c7ff", border: "#ff3b8b",
    panel: "#1d1d30", well: "#10101a",
  }, { typography: { fontFamily: "'Poppins', 'Trebuchet MS', sans-serif" } }),

  "aesthetic-retro-futurism": t("Retro-Futurism", "Brushed chrome, dials, 70s pulp imagined tomorrow", {
    primary: "#f0a038", secondary: "#3a2a18", accent: "#2a9d8f",
    background: "#171210", surface: "#261e17", text: "#f2e6d0",
    textSecondary: "#d3a878", border: "#8a5420",
    panel: "#211a13", well: "#110e0b",
  }, { typography: { fontFamily: "'Bebas Neue', 'Arial Narrow', sans-serif" } }),

  "aesthetic-bloomcore": t("Bloomcore", "Petals, pressed flowers and powder-pink morning", {
    primary: "#c14571", secondary: "#4a2233", accent: "#8fbf6a",
    background: "#2a1a24", surface: "#3a2530", text: "#fff5f7",
    textSecondary: "#e2a9c0", border: "#6d3a52",
    panel: "#33202b", well: "#1f1219",
  }, { typography: { fontFamily: "'Playfair Display', Georgia, serif" } }),
"aesthetic-neubrutalism": t("Neubrutalism", "Hard black outlines, flat over-confidence", {
    primary: "#ff5d8f", secondary: "#1c1c1c", accent: "#fff200",
    background: "#fef9d9", surface: "#ffffff", text: "#111111",
    textSecondary: "#444444", border: "#111111",
    well: "#e8e4c8", panel: "#fff6c8",
  }, { effects: { beveledEdges: true }, typography: { fontFamily: "'Space Grotesk', 'Arial Black', sans-serif" } }),

  "aesthetic-corp-memphis": t("Corp Memphis", "Friendly shapes on a tidy corporate grid", {
    primary: "#7a4de8", secondary: "#2b2442", accent: "#2ec4b6",
    background: "#171427", surface: "#221d38", text: "#f4f0ff",
    textSecondary: "#b9aef0", border: "#4a3a72",
    panel: "#1e1930", well: "#110f1e",
  }, { typography: { fontFamily: "'Nunito', 'Trebuchet MS', sans-serif" } }),

  "aesthetic-kidcore": t("Kidcore", "Crayons, stickers and Saturday-morning joy", {
    primary: "#ff5b3a", secondary: "#2f3e9b", accent: "#ffd23f",
    background: "#221d3a", surface: "#332b4d", text: "#fff8e1",
    textSecondary: "#e8d27a", border: "#ff5b3a",
    panel: "#2c2550", well: "#191537",
  }, { typography: { fontFamily: "'Comic Neue', 'Comic Sans MS', sans-serif" } }),

  "aesthetic-blueprint": t("Blueprint", "Cyan grid on navy, engineering that over-explains", {
    primary: "#6ab0d8", secondary: "#0a2540", accent: "#3d8bb8",
    background: "#0a2540", surface: "#0f3355", text: "#d7ecf7",
    textSecondary: "#7fb6d8", border: "#1d5a8a",
    panel: "#0d2d4a", well: "#071c33",
  }, { typography: { fontFamily: "'Roboto Mono', 'Courier New', monospace" } }),

  "aesthetic-editorial-warm": t("Editorial Warm", "Cream pages, custom serifs, considered calm", {
    primary: "#b07840", secondary: "#3a2c1e", accent: "#8a7052",
    background: "#2a221a", surface: "#372c20", text: "#f5efe4",
    textSecondary: "#c9b394", border: "#5a4a34",
    panel: "#322920", well: "#211a13",
  }, { typography: { fontFamily: "'Fraunces', Georgia, serif" } }),

  "aesthetic-diffused-worlds": t("Diffused Worlds", "Soft blur, dreamy pastels, atmospheric haze", {
    primary: "#9a7dd8", secondary: "#3b2f5e", accent: "#f0b7d0",
    background: "#1c1630", surface: "#2a2242", text: "#f8ebf5",
    textSecondary: "#d0b8e0", border: "#57408a",
    panel: "#251c3a", well: "#151026",
  }, { effects: { glassEffect: true }, typography: { fontFamily: "'Quicksand', 'Segoe UI', sans-serif" } }),

  "aesthetic-cassette-futurism": t("Cassette Futurism", "Tape decks, amber readouts, optimistic tech", {
    primary: "#e07a2a", secondary: "#3a2a1a", accent: "#dcb660",
    background: "#1a1410", surface: "#2a2018", text: "#f4ead2",
    textSecondary: "#d3a878", border: "#8a5c28",
    panel: "#241b14", well: "#110d0a",
  }, { typography: { fontFamily: "'Roboto Mono', 'Courier New', monospace" } }),
"aesthetic-newspaper": t("Newspaper", "Newsprint columns, bold headlines, denim ink", {
    primary: "#1a1a1a", secondary: "#c8b89a", accent: "#b0342a",
    background: "#efe7d6", surface: "#f7f1e2", text: "#161616",
    textSecondary: "#4a4a4a", border: "#c8b89a",
    well: "#e6dcc6", panel: "#f1ead8",
  }, { typography: { fontFamily: "'Playfair Display', 'Times New Roman', serif" } }),

  "aesthetic-barbiecore": t("Barbiecore", "Hot pink maximalism and unapologetic sheen", {
    primary: "#ff2ea8", secondary: "#8a1155", accent: "#ffd3e8",
    background: "#2a0d20", surface: "#401430", text: "#fff0f7",
    textSecondary: "#f7a8cc", border: "#b3346f",
    panel: "#381028", well: "#200818",
  }, { effects: { glassEffect: true, gradients: true }, typography: { fontFamily: "'Quicksand', 'Segoe UI', sans-serif" } }),

  "aesthetic-win95": t("Win95 Aesthetic", "Beveled gray desktop nostalgia", {
    primary: "#000080", secondary: "#c0c0c0", accent: "#008080",
    background: "#006868", surface: "#c0c0c0", text: "#111111",
    textSecondary: "#404040", border: "#808080",
    panel: "#c0c0c0", well: "#ffffff", textDim: "#1a1a1a",
    textMuted: "#404040", textFaint: "#606060", gold: "#000080",
    goldBorder: "#808080", primarySurface: "#dfe2e8",
  }, { effects: { beveledEdges: true }, typography: { fontFamily: "'Segoe UI', 'Trebuchet MS', sans-serif" } }),

  "aesthetic-grunge-zine": t("Grunge Zine", "Ripped pages, photocopier grit, urgent red", {
    primary: "#ee2a2a", secondary: "#2a2a2a", accent: "#c9a227",
    background: "#171412", surface: "#262219", text: "#f0ede4",
    textSecondary: "#bcae8e", border: "#5a5142",
    panel: "#201c15", well: "#100e0b",
  }, { typography: { fontFamily: "'Oswald', 'Arial Narrow', sans-serif" } }),

  "aesthetic-art-nouveau": t("Art Nouveau", "Botanical curls, gilded accents, organic symmetry", {
    primary: "#3a4a25", secondary: "#2a1e12", accent: "#c9a24a",
    background: "#1c150e", surface: "#2b2219", text: "#f4ecd8",
    textSecondary: "#cbb98a", border: "#5a4a2a",
    panel: "#261e14", well: "#150f09",
  }, { typography: { fontFamily: "'Cormorant Garamond', Georgia, serif" } }),

  "aesthetic-swiss": t("Swiss", "White space, red accent, razor typography", {
    primary: "#e5001a", secondary: "#1a1a1a", accent: "#e5001a",
    background: "#f1f1f1", surface: "#ffffff", text: "#111111",
    textSecondary: "#4a4a4a", border: "#d0d0d0",
    well: "#e6e6e6", panel: "#f7f7f7",
  }, { typography: { fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif" } }),

  "aesthetic-goblincore": t("Goblincore", "Moss, mushrooms and treasures healed from the forest floor", {
    primary: "#8fae4a", secondary: "#1a2412", accent: "#c8a848",
    background: "#151d0e", surface: "#223018", text: "#eef3d8",
    textSecondary: "#b4c77a", border: "#44602a",
    well: "#0f150a", panel: "#1b2610",
  }, { typography: { fontFamily: "'Georgia', 'Times New Roman', serif" } }),
};
