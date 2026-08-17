// Scans element HTML strings for design tokens: hex colors, font families,
// and spacing values (px). Produces a summary with usage counts and a helper
// that rewrites a token everywhere it occurs.

const HEX_RE = /#[0-9a-fA-F]{3,8}\b/g;
const FONT_RE = /font-family\s*:\s*([^;"]+)/g;
const PADDING_RE = /(?:padding|margin|gap)\s*:\s*([^;"]+)/g;

const collectAll = (project) => {
  const strings = [];
  (project.pages || []).forEach((p) => {
    (p.elements || []).forEach((el) => el.html && strings.push(el.html));
    if (p.head_html) strings.push(p.head_html);
  });
  if (project.template?.header_html) strings.push(project.template.header_html);
  if (project.template?.footer_html) strings.push(project.template.footer_html);
  if (project.head_html) strings.push(project.head_html);
  return strings;
};

export const analyzeAssets = (project) => {
  const strings = collectAll(project);
  const colorCounts = new Map();
  const fontCounts = new Map();
  const spacingCounts = new Map();
  strings.forEach((s) => {
    (s.match(HEX_RE) || []).forEach((c) => colorCounts.set(c.toLowerCase(), (colorCounts.get(c.toLowerCase()) || 0) + 1));
    let m;
    FONT_RE.lastIndex = 0;
    while ((m = FONT_RE.exec(s))) {
      const f = m[1].trim().split(",")[0].replace(/['"]/g, "").trim();
      if (f) fontCounts.set(f, (fontCounts.get(f) || 0) + 1);
    }
    PADDING_RE.lastIndex = 0;
    while ((m = PADDING_RE.exec(s))) {
      const val = m[1].trim();
      // dedupe individual tokens (multi-value like `12px 24px`)
      val.split(/\s+/).forEach((v) => {
        if (/^\d+(?:\.\d+)?(?:px|rem|em|%)$/i.test(v)) spacingCounts.set(v, (spacingCounts.get(v) || 0) + 1);
      });
    }
  });
  const toArr = (m) => Array.from(m.entries()).map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count);
  return { colors: toArr(colorCounts), fonts: toArr(fontCounts), spacing: toArr(spacingCounts) };
};

// Replaces a token with a new value across every page element's html, head,
// and template fragments. Returns a mutated shallow project object.
export const replaceToken = (project, oldValue, newValue) => {
  const safe = oldValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(safe, "g");
  const rep = (s) => (typeof s === "string" ? s.replace(re, newValue) : s);
  const pages = (project.pages || []).map((p) => ({
    ...p,
    elements: (p.elements || []).map((el) => ({ ...el, html: rep(el.html) })),
    head_html: rep(p.head_html || ""),
  }));
  return {
    ...project,
    pages,
    head_html: rep(project.head_html || ""),
    template: project.template ? {
      ...project.template,
      header_html: rep(project.template.header_html || ""),
      footer_html: rep(project.template.footer_html || ""),
    } : project.template,
  };
};
