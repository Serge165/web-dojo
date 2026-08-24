// Inline-SVG backgrounds, encoded as a data: URI directly in the CSS
// `background` value — no external image requests, no assets to bundle.
// Every preset is a `build({ c1, c2, size })` returning the full
// `background` shorthand (image + position/size/repeat baked in).
const svgUrl = (svg) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

export const SVG_BG_PRESETS = [
  {
    id: "blob-corner", label: "Blob Corner", category: "Organic", defaultSize: 500,
    build: ({ c1, c2, size }) => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="${c2}"/><path d="M154 21c22 18 34 49 30 79-4 30-24 58-51 71-27 13-61 11-84-7-23-18-34-52-28-83 6-31 29-56 59-66 30-10 52-12 74 6z" fill="${c1}"/></svg>`;
      return `${svgUrl(svg)} 100% 0% / ${size}px ${size}px no-repeat, ${c2}`;
    },
  },
  {
    id: "blob-cluster", label: "Blob Cluster", category: "Organic", defaultSize: 260,
    build: ({ c1, c2, size }) => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><circle cx="60" cy="50" r="38" fill="${c1}" opacity="0.85"/><circle cx="140" cy="90" r="50" fill="${c1}" opacity="0.6"/><circle cx="90" cy="150" r="30" fill="${c1}" opacity="0.75"/></svg>`;
      return `${svgUrl(svg)} 0 0 / ${size}px ${size}px, ${c2}`;
    },
  },
  {
    id: "wave-bottom", label: "Wave (Bottom)", category: "Organic", defaultSize: 100,
    build: ({ c1, c2, size }) => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 40" preserveAspectRatio="none"><path d="M0 20 Q50 0 100 20 T200 20 V40 H0 Z" fill="${c1}"/></svg>`;
      return `${svgUrl(svg)} bottom / 100% ${size}px no-repeat, ${c2}`;
    },
  },
  {
    id: "wave-top", label: "Wave (Top)", category: "Organic", defaultSize: 100,
    build: ({ c1, c2, size }) => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 40" preserveAspectRatio="none"><path d="M0 20 Q50 40 100 20 T200 20 V0 H0 Z" fill="${c1}"/></svg>`;
      return `${svgUrl(svg)} top / 100% ${size}px no-repeat, ${c2}`;
    },
  },
  {
    id: "double-wave", label: "Double Wave", category: "Organic", defaultSize: 120,
    build: ({ c1, c2, size }) => {
      const svg1 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 40" preserveAspectRatio="none"><path d="M0 22 Q50 4 100 22 T200 22 V40 H0 Z" fill="${c1}" opacity="0.55"/></svg>`;
      const svg2 = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 40" preserveAspectRatio="none"><path d="M0 26 Q50 10 100 26 T200 26 V40 H0 Z" fill="${c1}"/></svg>`;
      return `${svgUrl(svg1)} bottom / 100% ${size}px no-repeat, ${svgUrl(svg2)} bottom / 100% ${size * 0.8}px no-repeat, ${c2}`;
    },
  },
  {
    id: "arches", label: "Sunrise Arches", category: "Organic", defaultSize: 200,
    build: ({ c1, c2, size }) => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><path d="M0 100 A100 100 0 0 1 200 100 Z" fill="none" stroke="${c1}" stroke-width="10"/><path d="M25 100 A75 75 0 0 1 175 100 Z" fill="none" stroke="${c1}" stroke-width="10"/><path d="M50 100 A50 50 0 0 1 150 100 Z" fill="${c1}"/></svg>`;
      return `${svgUrl(svg)} bottom / ${size}px ${size / 2}px no-repeat, ${c2}`;
    },
  },

  {
    id: "topography", label: "Topography Lines", category: "Texture", defaultSize: 120,
    build: ({ c1, c2, size }) => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g fill="none" stroke="${c1}" stroke-width="1.5" opacity="0.6"><path d="M10 20 Q30 5 50 20 T90 20"/><path d="M5 40 Q30 20 55 40 T95 38"/><path d="M0 60 Q35 40 60 60 T100 58"/><path d="M8 82 Q32 65 58 82 T92 80"/></g></svg>`;
      return `${svgUrl(svg)} 0 0 / ${size}px ${size}px, ${c2}`;
    },
  },
  {
    id: "circuit", label: "Circuit Lines", category: "Texture", defaultSize: 100,
    build: ({ c1, c2, size }) => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g fill="none" stroke="${c1}" stroke-width="2" opacity="0.7"><path d="M10 10 H40 V40 H70 V70 H90"/><path d="M90 10 H60 V30"/><path d="M10 90 H30 V60"/></g><g fill="${c1}"><circle cx="10" cy="10" r="3"/><circle cx="70" cy="40" r="3"/><circle cx="90" cy="70" r="3"/><circle cx="30" cy="60" r="3"/></g></svg>`;
      return `${svgUrl(svg)} 0 0 / ${size}px ${size}px, ${c2}`;
    },
  },
  {
    id: "noise-grain", label: "Grain Texture", category: "Texture", defaultSize: 200,
    build: ({ c1, c2, size }) => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.35 0"/></filter><rect width="200" height="200" fill="${c2}"/><rect width="200" height="200" filter="url(#n)" fill="${c1}"/></svg>`;
      return `${svgUrl(svg)} 0 0 / ${size}px ${size}px`;
    },
  },
  {
    id: "scribble", label: "Scribble Lines", category: "Texture", defaultSize: 90,
    build: ({ c1, c2, size }) => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90 90"><g fill="none" stroke="${c1}" stroke-width="2" stroke-linecap="round" opacity="0.7"><path d="M10 15 Q20 5 30 15 T50 15"/><path d="M55 30 Q65 20 75 30 T85 35"/><path d="M8 55 Q18 45 28 55 T48 55"/><path d="M55 75 Q65 65 75 75 T90 78"/></g></svg>`;
      return `${svgUrl(svg)} 0 0 / ${size}px ${size}px, ${c2}`;
    },
  },
  {
    id: "star-field", label: "Star Field", category: "Texture", defaultSize: 140,
    build: ({ c1, c2, size }) => {
      const star = (x, y, s) => `<path d="M${x} ${y - s} L${x + s * 0.28} ${y - s * 0.28} L${x + s} ${y} L${x + s * 0.28} ${y + s * 0.28} L${x} ${y + s} L${x - s * 0.28} ${y + s * 0.28} L${x - s} ${y} L${x - s * 0.28} ${y - s * 0.28} Z" fill="${c1}"/>`;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 140">${star(20, 25, 6)}${star(70, 15, 4)}${star(115, 45, 5)}${star(40, 80, 5)}${star(100, 100, 7)}${star(20, 120, 4)}${star(125, 125, 4)}</svg>`;
      return `${svgUrl(svg)} 0 0 / ${size}px ${size}px, ${c2}`;
    },
  },

  {
    id: "low-poly-corner", label: "Low-Poly Corner", category: "Geometric", defaultSize: 400,
    build: ({ c1, c2, size }) => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="${c2}"/><polygon points="200,0 200,90 130,40" fill="${c1}" opacity="0.9"/><polygon points="200,0 130,40 150,0" fill="${c1}" opacity="0.6"/><polygon points="200,90 200,160 160,120" fill="${c1}" opacity="0.5"/><polygon points="130,40 200,90 160,120 100,70" fill="${c1}" opacity="0.35"/></svg>`;
      return `${svgUrl(svg)} 100% 0% / ${size}px ${size}px no-repeat, ${c2}`;
    },
  },
  {
    id: "dot-grid-svg", label: "Organic Dot Grid", category: "Geometric", defaultSize: 36,
    build: ({ c1, c2, size }) => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36"><circle cx="9" cy="9" r="2" fill="${c1}"/><circle cx="27" cy="27" r="2" fill="${c1}"/></svg>`;
      return `${svgUrl(svg)} 0 0 / ${size}px ${size}px, ${c2}`;
    },
  },
  {
    id: "plus-grid", label: "Plus Grid", category: "Geometric", defaultSize: 40,
    build: ({ c1, c2, size }) => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect x="17" y="9" width="6" height="22" fill="${c1}"/><rect x="9" y="17" width="22" height="6" fill="${c1}"/></svg>`;
      return `${svgUrl(svg)} 0 0 / ${size}px ${size}px, ${c2}`;
    },
  },
  {
    id: "bubbles", label: "Bubbles", category: "Geometric", defaultSize: 160,
    build: ({ c1, c2, size }) => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160"><g fill="${c1}"><circle cx="20" cy="30" r="14" opacity="0.5"/><circle cx="70" cy="15" r="8" opacity="0.7"/><circle cx="120" cy="50" r="20" opacity="0.4"/><circle cx="140" cy="120" r="12" opacity="0.6"/><circle cx="40" cy="110" r="18" opacity="0.5"/><circle cx="90" cy="90" r="6" opacity="0.8"/></g></svg>`;
      return `${svgUrl(svg)} 0 0 / ${size}px ${size}px, ${c2}`;
    },
  },
];

export const SVG_BG_PRESET_CATEGORIES = [...new Set(SVG_BG_PRESETS.map((p) => p.category))];
