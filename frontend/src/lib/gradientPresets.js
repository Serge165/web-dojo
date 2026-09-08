// Curated gradient presets, in GradientMixer's own stop format, so picking
// one just loads it into the existing customizable editor (type/angle/
// stops) rather than freezing a fixed CSS string — the user keeps the
// full color-picker/stop-editor UI to tweak from there.
const s = (color, position, alpha = 1) => ({ color, alpha, position });

export const GRADIENT_PRESETS = [
  // Vibrant
  { id: "sunset", label: "Sunset", category: "Vibrant", type: "linear", angle: 135, stops: [s("#ff6b6b", 0), s("#f7b733", 50), s("#fc4a1a", 100)] },
  { id: "ocean", label: "Ocean", category: "Vibrant", type: "linear", angle: 135, stops: [s("#00c6ff", 0), s("#0072ff", 100)] },
  { id: "candy", label: "Candy", category: "Vibrant", type: "linear", angle: 120, stops: [s("#ff9a9e", 0), s("#fecfef", 50), s("#fecfef", 100)] },
  { id: "fire", label: "Fire", category: "Vibrant", type: "linear", angle: 180, stops: [s("#f83600", 0), s("#f9d423", 100)] },
  { id: "cosmic", label: "Cosmic Fusion", category: "Vibrant", type: "linear", angle: 135, stops: [s("#ff00cc", 0), s("#333399", 100)] },
  { id: "tropical", label: "Tropical", category: "Vibrant", type: "linear", angle: 90, stops: [s("#00c9ff", 0), s("#92fe9d", 100)] },
  { id: "berry", label: "Berry Punch", category: "Vibrant", type: "linear", angle: 135, stops: [s("#c31432", 0), s("#240b36", 100)] },
  { id: "citrus", label: "Citrus", category: "Vibrant", type: "linear", angle: 135, stops: [s("#f7ff00", 0), s("#db36a4", 100)] },
  // Pastel
  { id: "cotton-candy", label: "Cotton Candy", category: "Pastel", type: "linear", angle: 135, stops: [s("#a8edea", 0), s("#fed6e3", 100)] },
  { id: "peach", label: "Peach Fuzz", category: "Pastel", type: "linear", angle: 135, stops: [s("#ffecd2", 0), s("#fcb69f", 100)] },
  { id: "lavender", label: "Lavender Mist", category: "Pastel", type: "linear", angle: 135, stops: [s("#e0c3fc", 0), s("#8ec5fc", 100)] },
  { id: "mint", label: "Mint Cream", category: "Pastel", type: "linear", angle: 135, stops: [s("#d4fc79", 0), s("#96e6a1", 100)] },
  { id: "baby-blue", label: "Baby Blue", category: "Pastel", type: "linear", angle: 135, stops: [s("#a1c4fd", 0), s("#c2e9fb", 100)] },
  { id: "blush", label: "Blush", category: "Pastel", type: "linear", angle: 135, stops: [s("#ffdde1", 0), s("#ee9ca7", 100)] },
  // Dark
  { id: "midnight", label: "Midnight", category: "Dark", type: "linear", angle: 135, stops: [s("#0f2027", 0), s("#203a43", 50), s("#2c5364", 100)] },
  { id: "obsidian", label: "Obsidian", category: "Dark", type: "linear", angle: 135, stops: [s("#000000", 0), s("#434343", 100)] },
  { id: "deep-space", label: "Deep Space", category: "Dark", type: "radial", angle: 135, stops: [s("#1e130c", 0), s("#000000", 100)] },
  { id: "noir", label: "Noir Violet", category: "Dark", type: "linear", angle: 135, stops: [s("#0f0c29", 0), s("#302b63", 50), s("#24243e", 100)] },
  { id: "storm", label: "Storm", category: "Dark", type: "linear", angle: 180, stops: [s("#232526", 0), s("#414345", 100)] },
  // Monochrome
  { id: "slate", label: "Slate", category: "Monochrome", type: "linear", angle: 135, stops: [s("#bdc3c7", 0), s("#2c3e50", 100)] },
  { id: "silver", label: "Silver", category: "Monochrome", type: "linear", angle: 135, stops: [s("#e6e9f0", 0), s("#eef1f5", 100)] },
  { id: "charcoal", label: "Charcoal", category: "Monochrome", type: "linear", angle: 135, stops: [s("#3a3a3a", 0), s("#0d0d0d", 100)] },
  // Duotone
  { id: "duotone-purple", label: "Purple Duotone", category: "Duotone", type: "linear", angle: 135, stops: [s("#7f00ff", 0), s("#e100ff", 100)] },
  { id: "duotone-teal", label: "Teal Duotone", category: "Duotone", type: "linear", angle: 135, stops: [s("#11998e", 0), s("#38ef7d", 100)] },
  { id: "duotone-crimson", label: "Crimson Duotone", category: "Duotone", type: "linear", angle: 135, stops: [s("#eb3349", 0), s("#f45c43", 100)] },
  { id: "duotone-indigo", label: "Indigo Duotone", category: "Duotone", type: "linear", angle: 135, stops: [s("#4e54c8", 0), s("#8f94fb", 100)] },
  // Radial
  { id: "spotlight", label: "Spotlight", category: "Radial", type: "radial", angle: 0, stops: [s("#ffffff", 0), s("#c9d6ff", 100)] },
  { id: "glow-orange", label: "Warm Glow", category: "Radial", type: "radial", angle: 0, stops: [s("#ffb347", 0), s("#ff6961", 100)] },
  { id: "glow-blue", label: "Cool Glow", category: "Radial", type: "radial", angle: 0, stops: [s("#4facfe", 0), s("#00f2fe", 100)] },
  { id: "nebula", label: "Nebula", category: "Radial", type: "radial", angle: 0, stops: [s("#654ea3", 0), s("#1f1147", 100)] },
];

export const GRADIENT_PRESET_CATEGORIES = [...new Set(GRADIENT_PRESETS.map((p) => p.category))];
