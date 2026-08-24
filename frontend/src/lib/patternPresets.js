// CSS-only background patterns — no images, no external requests, so
// exported sites stay self-contained. Every preset is a `build({c1, c2,
// size})` function returning a single `background` shorthand value:
// c1 = pattern color, c2 = base/fill color, size = tile size in px.
// These are well-established pure-CSS gradient recipes (checkerboard,
// chevron, triangle-mosaic via conic-gradient, etc.), not novel math.
const stripes = (angleDeg) => ({ c1, c2, size }) =>
  `repeating-linear-gradient(${angleDeg}deg, ${c1} 0, ${c1} ${size / 2}px, ${c2} ${size / 2}px, ${c2} ${size}px)`;

export const PATTERN_PRESETS = [
  { id: "diagonal-stripes", label: "Diagonal Stripes", category: "Stripes", defaultSize: 24, build: stripes(45) },
  { id: "horizontal-stripes", label: "Horizontal Stripes", category: "Stripes", defaultSize: 24, build: stripes(0) },
  { id: "vertical-stripes", label: "Vertical Stripes", category: "Stripes", defaultSize: 24, build: stripes(90) },

  {
    id: "polka-dots", label: "Polka Dots", category: "Dots", defaultSize: 28,
    build: ({ c1, c2, size }) => `radial-gradient(circle, ${c1} ${size * 0.14}px, transparent ${size * 0.14}px) 0 0 / ${size}px ${size}px, ${c2}`,
  },
  {
    id: "large-dots", label: "Large Dots", category: "Dots", defaultSize: 48,
    build: ({ c1, c2, size }) => `radial-gradient(circle, ${c1} ${size * 0.22}px, transparent ${size * 0.22}px) 0 0 / ${size}px ${size}px, ${c2}`,
  },
  {
    id: "confetti-dots", label: "Confetti Dots", category: "Dots", defaultSize: 60,
    build: ({ c1, c2, size }) => [
      `radial-gradient(circle, ${c1} ${size * 0.05}px, transparent ${size * 0.05}px) ${size * 0.15}px ${size * 0.2}px / ${size}px ${size}px`,
      `radial-gradient(circle, ${c1} ${size * 0.07}px, transparent ${size * 0.07}px) ${size * 0.55}px ${size * 0.45}px / ${size}px ${size}px`,
      `radial-gradient(circle, ${c1} ${size * 0.04}px, transparent ${size * 0.04}px) ${size * 0.8}px ${size * 0.1}px / ${size}px ${size}px`,
      `radial-gradient(circle, ${c1} ${size * 0.06}px, transparent ${size * 0.06}px) ${size * 0.3}px ${size * 0.75}px / ${size}px ${size}px`,
      `radial-gradient(circle, ${c1} ${size * 0.045}px, transparent ${size * 0.045}px) ${size * 0.7}px ${size * 0.85}px / ${size}px ${size}px`,
      c2,
    ].join(", "),
  },
  {
    id: "concentric-circles", label: "Concentric Circles", category: "Dots", defaultSize: 20,
    build: ({ c1, c2, size }) => `repeating-radial-gradient(circle, ${c1} 0, ${c1} 1px, ${c2} 1px, ${c2} ${size}px)`,
  },

  {
    id: "grid", label: "Grid Lines", category: "Grid", defaultSize: 32,
    build: ({ c1, c2, size }) => [
      `linear-gradient(${c1} 1px, transparent 1px) 0 0 / ${size}px ${size}px`,
      `linear-gradient(90deg, ${c1} 1px, transparent 1px) 0 0 / ${size}px ${size}px`,
      c2,
    ].join(", "),
  },
  {
    id: "graph-paper", label: "Graph Paper", category: "Grid", defaultSize: 16,
    build: ({ c1, c2, size }) => [
      `linear-gradient(${c1} 1px, transparent 1px) 0 0 / ${size}px ${size}px`,
      `linear-gradient(90deg, ${c1} 1px, transparent 1px) 0 0 / ${size}px ${size}px`,
      `linear-gradient(${c1} 2px, transparent 2px) 0 0 / ${size * 5}px ${size * 5}px`,
      `linear-gradient(90deg, ${c1} 2px, transparent 2px) 0 0 / ${size * 5}px ${size * 5}px`,
      c2,
    ].join(", "),
  },
  {
    id: "cross-hatch", label: "Cross-Hatch", category: "Grid", defaultSize: 16,
    build: ({ c1, c2, size }) => [
      `repeating-linear-gradient(45deg, ${c1} 0, ${c1} 1px, transparent 1px, transparent ${size}px)`,
      `repeating-linear-gradient(135deg, ${c1} 0, ${c1} 1px, transparent 1px, transparent ${size}px)`,
      c2,
    ].join(", "),
  },
  {
    id: "diamond-lattice", label: "Diamond Lattice", category: "Grid", defaultSize: 40,
    build: ({ c1, c2, size }) => [
      `repeating-linear-gradient(45deg, transparent 0, transparent ${size * 0.4}px, ${c1} ${size * 0.4}px, ${c1} ${size * 0.5}px)`,
      `repeating-linear-gradient(-45deg, transparent 0, transparent ${size * 0.4}px, ${c1} ${size * 0.4}px, ${c1} ${size * 0.5}px)`,
      c2,
    ].join(", "),
  },

  {
    id: "checkerboard", label: "Checkerboard", category: "Geometric", defaultSize: 32,
    build: ({ c1, c2, size }) => [
      `linear-gradient(45deg, ${c1} 25%, transparent 25%) 0 0 / ${size}px ${size}px`,
      `linear-gradient(-45deg, ${c1} 25%, transparent 25%) 0 ${size / 2}px / ${size}px ${size}px`,
      `linear-gradient(45deg, transparent 75%, ${c1} 75%) ${size / 2}px -${size / 2}px / ${size}px ${size}px`,
      `linear-gradient(-45deg, transparent 75%, ${c1} 75%) -${size / 2}px 0 / ${size}px ${size}px`,
      c2,
    ].join(", "),
  },
  {
    id: "chevron", label: "Chevron", category: "Geometric", defaultSize: 48,
    build: ({ c1, c2, size }) => [
      `linear-gradient(135deg, ${c1} 25%, transparent 25%) 0 0 / ${size}px ${size / 2}px`,
      `linear-gradient(225deg, ${c1} 25%, transparent 25%) 0 0 / ${size}px ${size / 2}px`,
      `linear-gradient(315deg, ${c1} 25%, transparent 25%) ${size / 2}px 0 / ${size}px ${size / 2}px`,
      `linear-gradient(45deg, ${c1} 25%, ${c2} 25%) ${size / 2}px 0 / ${size}px ${size / 2}px`,
    ].join(", "),
  },
  {
    id: "triangles", label: "Triangles", category: "Geometric", defaultSize: 40,
    build: ({ c1, c2, size }) => `conic-gradient(from 45deg at 50% 50%, ${c1} 90deg, ${c2} 0 180deg, ${c1} 0 270deg, ${c2} 0) 0 0 / ${size}px ${size}px`,
  },
];

export const PATTERN_PRESET_CATEGORIES = [...new Set(PATTERN_PRESETS.map((p) => p.category))];
