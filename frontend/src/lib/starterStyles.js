// Day-one starter pack for the Style Library (Text FX tab). These ready-made
// styles are seeded once (guarded by localStorage 'webdojo_style_library_seeded')
// and pre-sorted into folders so the library isn't empty on first run. Each
// entry mirrors a saved library entry: { id, name, category, style, hover }.
// `style` is a plain CSS prop->value map applied via mergeStyleIntoRootTag;
// `hover` templates use the __CLS__ token so they work across projects.

const clip = (grad) => ({
  "background-image": grad,
  "-webkit-background-clip": "text",
  "background-clip": "text",
  "-webkit-text-fill-color": "transparent",
  color: "transparent",
});

export const STARTER_STYLES = [
  // ---- Headings (gradient / glow text FX) ----
  { id: "starter-head-sunset", name: "Sunset", category: "Headings", style: clip("linear-gradient(90deg,#ff6b6b,#feca57,#ff9ff3)"), hover: [] },
  { id: "starter-head-ocean", name: "Ocean", category: "Headings", style: clip("linear-gradient(90deg,#2E3192,#1BFFFF)"), hover: [] },
  { id: "starter-head-candy", name: "Candy", category: "Headings", style: clip("linear-gradient(90deg,#f857a6,#ff5858)"), hover: [] },
  { id: "starter-head-gold", name: "Gold foil", category: "Headings", style: clip("linear-gradient(90deg,#f7971e,#ffd200)"), hover: [] },
  { id: "starter-head-chrome", name: "Chrome", category: "Headings", style: clip("linear-gradient(180deg,#f5f5f5,#9a9a9a 45%,#4a4a4a 55%,#dddddd)"), hover: [] },
  { id: "starter-head-neon", name: "Neon glow", category: "Headings", style: { color: "#ffffff", "-webkit-text-fill-color": "#ffffff", "text-shadow": "0 0 4px #0ff,0 0 8px #0ff,0 0 18px #0ff,0 0 36px #06f" }, hover: [] },

  // ---- Buttons (shape + fill) ----
  { id: "starter-btn-gradpill", name: "Gradient pill", category: "Buttons", style: { background: "linear-gradient(135deg,#6366f1,#ec4899)", color: "#ffffff", "-webkit-text-fill-color": "#ffffff", "border-radius": "999px", padding: "12px 28px", "box-shadow": "0 8px 24px rgba(99,102,241,0.4)", border: "none", "font-weight": "600" }, hover: [] },
  { id: "starter-btn-glass", name: "Glass button", category: "Buttons", style: { background: "rgba(255,255,255,0.12)", "backdrop-filter": "blur(10px)", "-webkit-backdrop-filter": "blur(10px)", border: "1px solid rgba(255,255,255,0.25)", "border-radius": "14px", color: "#ffffff", "-webkit-text-fill-color": "#ffffff", padding: "12px 24px", "font-weight": "600" }, hover: [] },
  { id: "starter-btn-neonline", name: "Neon outline", category: "Buttons", style: { background: "transparent", border: "2px solid #22d3ee", color: "#22d3ee", "-webkit-text-fill-color": "#22d3ee", "border-radius": "12px", padding: "10px 22px", "box-shadow": "0 0 14px rgba(34,211,238,0.6)", "font-weight": "600" }, hover: [] },
  { id: "starter-btn-sunsetcta", name: "Sunset CTA", category: "Buttons", style: { background: "linear-gradient(135deg,#f857a6,#ff5858)", color: "#ffffff", "-webkit-text-fill-color": "#ffffff", "border-radius": "12px", padding: "12px 26px", "box-shadow": "0 10px 24px rgba(255,88,88,0.35)", border: "none", "font-weight": "600" }, hover: [] },
  { id: "starter-btn-sticker", name: "Sticker", category: "Buttons", style: { background: "#ffffff", color: "#111827", "-webkit-text-fill-color": "#111827", "border-radius": "12px", padding: "10px 22px", border: "3px solid #111827", "box-shadow": "4px 4px 0 #111827", "font-weight": "700" }, hover: [] },

  // ---- Cards (glass / shadow shapes) ----
  { id: "starter-card-glass", name: "Glass card", category: "Cards", style: { background: "rgba(255,255,255,0.10)", "backdrop-filter": "blur(12px)", "-webkit-backdrop-filter": "blur(12px)", border: "1px solid rgba(255,255,255,0.20)", "border-radius": "16px", "corner-shape": "round", "box-shadow": "0 8px 32px rgba(0,0,0,0.25)" }, hover: [] },
  { id: "starter-card-frosted", name: "Frosted dark", category: "Cards", style: { background: "rgba(17,17,17,0.55)", "backdrop-filter": "blur(16px) saturate(140%)", "-webkit-backdrop-filter": "blur(16px) saturate(140%)", border: "1px solid rgba(255,255,255,0.08)", "border-radius": "18px", "box-shadow": "0 12px 40px rgba(0,0,0,0.45)" }, hover: [] },
  { id: "starter-card-neu", name: "Neumorphic", category: "Cards", style: { background: "#e0e5ec", border: "none", "border-radius": "20px", "box-shadow": "8px 8px 18px #a3b1c6, -8px -8px 18px #ffffff" }, hover: [] },
  { id: "starter-card-soft", name: "Soft card", category: "Cards", style: { background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)", "border-radius": "14px", "box-shadow": "0 2px 10px rgba(0,0,0,0.08)" }, hover: [] },
  { id: "starter-card-aurora", name: "Aurora glow", category: "Cards", style: { "border-radius": "20px", border: "1px solid rgba(255,255,255,0.2)", "box-shadow": "0 0 40px rgba(168,85,247,0.5)" }, hover: [] },

  // ---- Badges (pill labels) ----
  { id: "starter-badge-indigo", name: "Indigo pill", category: "Badges", style: { background: "#eef2ff", color: "#4338ca", "-webkit-text-fill-color": "#4338ca", "border-radius": "999px", padding: "4px 12px", "font-weight": "600", "font-size": "12px" }, hover: [] },
  { id: "starter-badge-success", name: "Success", category: "Badges", style: { background: "#dcfce7", color: "#166534", "-webkit-text-fill-color": "#166534", "border-radius": "999px", padding: "4px 12px", "font-weight": "600", "font-size": "12px" }, hover: [] },
  { id: "starter-badge-dark", name: "Dark tag", category: "Badges", style: { background: "#111827", color: "#ffffff", "-webkit-text-fill-color": "#ffffff", "border-radius": "8px", padding: "4px 12px", "font-weight": "600", "font-size": "12px" }, hover: [] },
  { id: "starter-badge-warn", name: "Warning", category: "Badges", style: { background: "#fef3c7", color: "#92400e", "-webkit-text-fill-color": "#92400e", "border-radius": "999px", padding: "4px 12px", "font-weight": "600", "font-size": "12px" }, hover: [] },

  // ---- Fonts (type styles; safe stacks so no import needed) ----
  { id: "starter-font-serif", name: "Serif display", category: "Fonts", style: { "font-family": "Georgia, 'Times New Roman', serif", "font-weight": "700", "letter-spacing": "-0.02em" }, hover: [] },
  { id: "starter-font-mono", name: "Mono tech", category: "Fonts", style: { "font-family": "ui-monospace, 'SFMono-Regular', 'JetBrains Mono', Menlo, monospace", "letter-spacing": "0.02em" }, hover: [] },
  { id: "starter-font-caps", name: "Wide caps", category: "Fonts", style: { "text-transform": "uppercase", "letter-spacing": "0.22em", "font-weight": "600" }, hover: [] },
  { id: "starter-font-glow", name: "Soft glow", category: "Fonts", style: { color: "#a78bfa", "-webkit-text-fill-color": "#a78bfa", "text-shadow": "0 0 22px rgba(167,139,250,0.9)" }, hover: [] },
];
