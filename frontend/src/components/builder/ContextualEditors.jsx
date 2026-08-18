import React from "react";
import { escAttr, escText, unescapeHtml } from "@/lib/escapeHtml";

// ============================================================
// Small string helpers that let us edit a raw HTML fragment via
// simple regex passes without pulling in a full parser. Every
// helper returns the new html string and never throws.
// ============================================================

// Read the value of a CSS declaration from the first inline `style="..."`.
export const readStyle = (html, prop) => {
  const m = html && html.match(/style="([^"]*)"/);
  if (!m) return "";
  const parts = m[1].split(";").map((s) => s.trim());
  for (const p of parts) {
    const [k, ...rest] = p.split(":");
    if (!k) continue;
    if (k.trim() === prop) return rest.join(":").trim();
  }
  return "";
};

// Read a CSS declaration from the style="…" of the first tag matching `tag`.
export const readTagStyle = (html, tag, prop) => {
  const re = new RegExp(`<${tag}[^>]*style="([^"]*)"`, "i");
  const m = html && html.match(re);
  if (!m) return "";
  const parts = m[1].split(";").map((s) => s.trim());
  for (const p of parts) {
    const [k, ...rest] = p.split(":");
    if (!k) continue;
    if (k.trim() === prop) return rest.join(":").trim();
  }
  return "";
};

// Merge a patch of CSS declarations into the first inline style="…" of the
// first tag matching `tag`. If that tag has no style yet, one is injected.
export const patchTagStyle = (html, tag, patch) => {
  const reWithStyle = new RegExp(`(<${tag}\\b[^>]*?)style="([^"]*)"`, "i");
  if (reWithStyle.test(html)) {
    return html.replace(reWithStyle, (_, prefix, styles) => {
      const parts = styles.split(";").map((s) => s.trim()).filter(Boolean);
      const map = {};
      parts.forEach((p) => { const i = p.indexOf(":"); if (i > 0) map[p.slice(0, i).trim()] = p.slice(i + 1).trim(); });
      Object.assign(map, patch);
      return `${prefix}style="${Object.entries(map).map(([k, v]) => `${k}: ${v}`).join("; ")}"`;
    });
  }
  const styleStr = Object.entries(patch).map(([k, v]) => `${k}: ${v}`).join("; ");
  const reNoStyle = new RegExp(`<(${tag})(\\s|>)`, "i");
  return html.replace(reNoStyle, `<$1 style="${styleStr}"$2`);
};

export const parseNum = (v, fallback = 0) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
};

// Read a specific HTML attribute value from the first tag that has it.
// Unescapes what setAttr escaped, so editing an already-set value (e.g. a
// URL containing &) round-trips instead of re-escaping on every keystroke.
export const readAttr = (html, attr) => {
  const re = new RegExp(`${attr}="([^"]*)"`);
  const m = html && html.match(re);
  return m ? unescapeHtml(m[1]) : "";
};

// Replace or add an attribute on the first tag of the fragment. If the
// attribute already exists anywhere, only the first occurrence changes.
// `value` is escaped, and passed to String.replace as a replacer
// FUNCTION (not a raw string) — a raw-string second argument to
// String.replace interprets sequences like $&, $', $1 as replacement
// patterns rather than literal text, silently corrupting output if the
// user's value happens to contain one.
export const setAttr = (html, attr, value) => {
  const safe = escAttr(value);
  const re = new RegExp(`(<[a-zA-Z][^>]*?\\s)${attr}="[^"]*"`);
  if (re.test(html)) return html.replace(re, (_match, prefix) => `${prefix}${attr}="${safe}"`);
  // Inject the attribute right after the opening tag name.
  return html.replace(/<([a-zA-Z][a-zA-Z0-9]*)/, (_match, tag) => `<${tag} ${attr}="${safe}"`);
};

// Replace the inner text between the first matching open/close tag.
export const setInnerText = (html, tag, text) => {
  const safe = escText(text);
  const re = new RegExp(`(<${tag}[^>]*>)([\\s\\S]*?)(</${tag}>)`, "i");
  if (!re.test(html)) return html;
  return html.replace(re, (_match, open, _mid, close) => `${open}${safe}${close}`);
};

export const readInnerText = (html, tag) => {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m = html && html.match(re);
  if (!m) return "";
  return unescapeHtml(m[1].replace(/<[^>]+>/g, "").trim());
};

// Rough detection: what kind of element is the user editing?
// Also inspects primary child when the outer element is a thin wrapper (a
// common pattern for toolbox blocks like `<div style="padding…"><button…>`).
export const detectKind = (html) => {
  if (!html) return "generic";
  const trimmed = html.trim();
  const m = trimmed.match(/^<([a-zA-Z][a-zA-Z0-9]*)/);
  const tag = m ? m[1].toLowerCase() : "";
  const style = (html.match(/style="([^"]*)"/) || [])[1] || "";
  if (tag === "button") return "button";
  if (tag === "img") return "image";
  if (/display\s*:\s*grid/i.test(style)) return "grid";
  if (/display\s*:\s*flex/i.test(style)) return "flex";
  // Look one level deep: outer is a generic wrapper containing exactly one
  // notable child. Only match a single primary child to avoid misdetecting.
  const inner = trimmed.replace(/^<[^>]+>\s*/, "").replace(/\s*<\/[^>]+>\s*$/, "").trim();
  if (/^<button[\s>]/i.test(inner) && (inner.match(/<button[\s>]/gi) || []).length === 1) return "button";
  if (/^<img[\s>]/i.test(inner) && (inner.match(/<img[\s>]/gi) || []).length === 1) return "image";
  return "generic";
};


// ============================================================
// UI atoms shared by the editors
// ============================================================

const rowLabelCls = "text-[10px] uppercase tracking-wider text-gray-500 block mb-1";
const inputCls = "w-full bg-[#0D0D0D] border border-[#2B2B2B] rounded px-2 py-1.5 text-xs text-white outline-none focus:border-blue-500";
const selectCls = inputCls;
const monoCls = "w-full bg-[#0D0D0D] border border-[#2B2B2B] rounded px-2 py-1 text-xs font-mono text-white outline-none focus:border-blue-500";

const Slider = ({ value, min, max, step, unit = "", onChange, testId }) => (
  <div className="flex items-center gap-2">
    <input type="range" min={min} max={max} step={step ?? 1} value={value} onChange={(e) => onChange(Number(e.target.value))} className="flex-1" data-testid={`${testId}-slider`} />
    <span className="w-14 text-right text-[11px] font-mono text-gray-300">{value}{unit}</span>
  </div>
);

const Row = ({ label, children }) => (
  <div><label className={rowLabelCls}>{label}</label>{children}</div>
);

const ColorRow = ({ label, value, onChange, testId }) => (
  <Row label={label}>
    <div className="flex items-center gap-2">
      <input type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"} onChange={(e) => onChange(e.target.value)} className="w-8 h-7 bg-transparent border border-[#2B2B2B] rounded" data-testid={`${testId}-color`} />
      <input value={value} onChange={(e) => onChange(e.target.value)} className={monoCls + " flex-1"} data-testid={`${testId}-text`} />
    </div>
  </Row>
);


// ============================================================
// Button editor
// ============================================================

const ButtonEditor = ({ html, onReplace }) => {
  const patch = (p) => onReplace(patchTagStyle(html, "button", p));
  const label = readInnerText(html, "button") || "Button";
  const bg = readTagStyle(html, "button", "background") || readTagStyle(html, "button", "background-color") || "#0f172a";
  const color = readTagStyle(html, "button", "color") || "#ffffff";
  const paddingRaw = readTagStyle(html, "button", "padding");
  const parts = paddingRaw ? paddingRaw.split(/\s+/) : [];
  const padY = parseNum(parts[0], 12);
  const padX = parseNum(parts[1] || parts[0], 22);
  const radius = parseNum(readTagStyle(html, "button", "border-radius"), 8);
  const fontSize = parseNum(readTagStyle(html, "button", "font-size"), 14);
  const border = readTagStyle(html, "button", "border") || "0";

  return (
    <div className="space-y-3 pt-3 border-t border-[#2B2B2B]" data-testid="button-editor">
      <div className="text-[10px] uppercase tracking-wider text-blue-400">Button</div>
      <Row label="Label">
        <input value={label} onChange={(e) => onReplace(setInnerText(html, "button", e.target.value))} className={inputCls} data-testid="btn-label" />
      </Row>
      <ColorRow label="Background" value={bg.startsWith("#") ? bg : "#0f172a"} onChange={(v) => patch({ background: v })} testId="btn-bg" />
      <ColorRow label="Text color" value={color.startsWith("#") ? color : "#ffffff"} onChange={(v) => patch({ color: v })} testId="btn-color" />
      <Row label={`Padding Y (${padY}px)`}><Slider value={padY} min={0} max={40} unit="px" testId="btn-pady" onChange={(v) => patch({ padding: `${v}px ${padX}px` })} /></Row>
      <Row label={`Padding X (${padX}px)`}><Slider value={padX} min={0} max={80} unit="px" testId="btn-padx" onChange={(v) => patch({ padding: `${padY}px ${v}px` })} /></Row>
      <Row label={`Radius (${radius}px)`}><Slider value={radius} min={0} max={40} unit="px" testId="btn-radius" onChange={(v) => patch({ "border-radius": `${v}px` })} /></Row>
      <Row label={`Font size (${fontSize}px)`}><Slider value={fontSize} min={10} max={32} unit="px" testId="btn-fontsize" onChange={(v) => patch({ "font-size": `${v}px` })} /></Row>
      <Row label="Border">
        <input value={border} onChange={(e) => patch({ border: e.target.value })} placeholder="1px solid #e5e7eb" className={monoCls} data-testid="btn-border" />
      </Row>
    </div>
  );
};


// ============================================================
// Image editor
// ============================================================

const ImageEditor = ({ html, onReplace }) => {
  const patch = (p) => onReplace(patchTagStyle(html, "img", p));
  const src = readAttr(html, "src");
  const alt = readAttr(html, "alt");
  const fit = readTagStyle(html, "img", "object-fit") || "cover";
  const radius = parseNum(readTagStyle(html, "img", "border-radius"), 0);
  const width = readTagStyle(html, "img", "width") || "100%";
  const height = readTagStyle(html, "img", "height") || "auto";

  return (
    <div className="space-y-3 pt-3 border-t border-[#2B2B2B]" data-testid="image-editor">
      <div className="text-[10px] uppercase tracking-wider text-blue-400">Image</div>
      <Row label="Source URL">
        <input value={src} onChange={(e) => onReplace(setAttr(html, "src", e.target.value))} className={monoCls} data-testid="img-src" placeholder="https://…/photo.jpg" />
      </Row>
      <Row label="Alt text">
        <input value={alt} onChange={(e) => onReplace(setAttr(html, "alt", e.target.value))} className={inputCls} data-testid="img-alt" />
      </Row>
      <Row label="Object fit">
        <select value={fit} onChange={(e) => patch({ "object-fit": e.target.value })} className={selectCls} data-testid="img-fit">
          {["cover","contain","fill","none","scale-down"].map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
      </Row>
      <div className="grid grid-cols-2 gap-2">
        <Row label="Width">
          <input value={width} onChange={(e) => patch({ width: e.target.value })} className={monoCls} data-testid="img-width" />
        </Row>
        <Row label="Height">
          <input value={height} onChange={(e) => patch({ height: e.target.value })} className={monoCls} data-testid="img-height" />
        </Row>
      </div>
      <Row label={`Radius (${radius}px)`}><Slider value={radius} min={0} max={80} unit="px" testId="img-radius" onChange={(v) => patch({ "border-radius": `${v}px` })} /></Row>
    </div>
  );
};


// ============================================================
// Flex container editor
// ============================================================

const FlexContainerEditor = ({ html, onPatch }) => {
  const direction = readStyle(html, "flex-direction") || "row";
  const wrap = readStyle(html, "flex-wrap") || "nowrap";
  const justify = readStyle(html, "justify-content") || "flex-start";
  const align = readStyle(html, "align-items") || "stretch";
  const gap = parseNum(readStyle(html, "gap"), 0);
  const padding = parseNum(readStyle(html, "padding"), 0);

  return (
    <div className="space-y-3 pt-3 border-t border-[#2B2B2B]" data-testid="flex-editor">
      <div className="text-[10px] uppercase tracking-wider text-blue-400">Flex container</div>
      <Row label="Direction">
        <select value={direction} onChange={(e) => onPatch({ "flex-direction": e.target.value })} className={selectCls} data-testid="flex-e-dir">
          {["row","row-reverse","column","column-reverse"].map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
      </Row>
      <Row label="Wrap">
        <select value={wrap} onChange={(e) => onPatch({ "flex-wrap": e.target.value })} className={selectCls} data-testid="flex-e-wrap">
          {["nowrap","wrap","wrap-reverse"].map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
      </Row>
      <Row label="Justify">
        <select value={justify} onChange={(e) => onPatch({ "justify-content": e.target.value })} className={selectCls} data-testid="flex-e-justify">
          {["flex-start","center","flex-end","space-between","space-around","space-evenly"].map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
      </Row>
      <Row label="Align">
        <select value={align} onChange={(e) => onPatch({ "align-items": e.target.value })} className={selectCls} data-testid="flex-e-align">
          {["stretch","flex-start","center","flex-end","baseline"].map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
      </Row>
      <Row label={`Gap (${gap}px)`}><Slider value={gap} min={0} max={80} unit="px" testId="flex-e-gap" onChange={(v) => onPatch({ gap: `${v}px` })} /></Row>
      <Row label={`Padding (${padding}px)`}><Slider value={padding} min={0} max={120} unit="px" testId="flex-e-padding" onChange={(v) => onPatch({ padding: `${v}px` })} /></Row>
    </div>
  );
};


// ============================================================
// Grid container editor
// ============================================================

const GridContainerEditor = ({ html, onPatch }) => {
  const cols = readStyle(html, "grid-template-columns") || "1fr 1fr 1fr";
  const rows = readStyle(html, "grid-template-rows") || "auto";
  const colGap = parseNum(readStyle(html, "column-gap") || readStyle(html, "gap"), 0);
  const rowGap = parseNum(readStyle(html, "row-gap") || readStyle(html, "gap"), 0);
  const padding = parseNum(readStyle(html, "padding"), 0);
  const justifyItems = readStyle(html, "justify-items") || "stretch";
  const alignItems = readStyle(html, "align-items") || "stretch";

  return (
    <div className="space-y-3 pt-3 border-t border-[#2B2B2B]" data-testid="grid-editor">
      <div className="text-[10px] uppercase tracking-wider text-blue-400">Grid container</div>
      <Row label="Template columns">
        <input value={cols} onChange={(e) => onPatch({ "grid-template-columns": e.target.value })} className={monoCls} data-testid="grid-e-cols" />
      </Row>
      <Row label="Template rows">
        <input value={rows} onChange={(e) => onPatch({ "grid-template-rows": e.target.value })} className={monoCls} data-testid="grid-e-rows" />
      </Row>
      <div className="grid grid-cols-2 gap-2">
        <Row label={`Col gap (${colGap}px)`}><Slider value={colGap} min={0} max={80} unit="px" testId="grid-e-col-gap" onChange={(v) => onPatch({ "column-gap": `${v}px` })} /></Row>
        <Row label={`Row gap (${rowGap}px)`}><Slider value={rowGap} min={0} max={80} unit="px" testId="grid-e-row-gap" onChange={(v) => onPatch({ "row-gap": `${v}px` })} /></Row>
      </div>
      <Row label={`Padding (${padding}px)`}><Slider value={padding} min={0} max={120} unit="px" testId="grid-e-padding" onChange={(v) => onPatch({ padding: `${v}px` })} /></Row>
      <div className="grid grid-cols-2 gap-2">
        <Row label="Justify items">
          <select value={justifyItems} onChange={(e) => onPatch({ "justify-items": e.target.value })} className={selectCls} data-testid="grid-e-justify-items">
            {["stretch","start","center","end"].map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </Row>
        <Row label="Align items">
          <select value={alignItems} onChange={(e) => onPatch({ "align-items": e.target.value })} className={selectCls} data-testid="grid-e-align-items">
            {["stretch","start","center","end"].map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </Row>
      </div>
    </div>
  );
};


// ============================================================
// Card / generic container editor (padding / radius / shadow / border)
// ============================================================

const CardEditor = ({ html, onPatch }) => {
  const padding = parseNum(readStyle(html, "padding"), 16);
  const radius = parseNum(readStyle(html, "border-radius"), 0);
  const border = readStyle(html, "border") || "0";
  const shadow = readStyle(html, "box-shadow") || "none";
  const bg = readStyle(html, "background") || readStyle(html, "background-color") || "#ffffff";

  return (
    <div className="space-y-3 pt-3 border-t border-[#2B2B2B]" data-testid="card-editor">
      <div className="text-[10px] uppercase tracking-wider text-blue-400">Container / card</div>
      <ColorRow label="Background" value={bg.startsWith("#") ? bg : "#ffffff"} onChange={(v) => onPatch({ background: v })} testId="card-bg" />
      <Row label={`Padding (${padding}px)`}><Slider value={padding} min={0} max={160} unit="px" testId="card-padding" onChange={(v) => onPatch({ padding: `${v}px` })} /></Row>
      <Row label={`Radius (${radius}px)`}><Slider value={radius} min={0} max={80} unit="px" testId="card-radius" onChange={(v) => onPatch({ "border-radius": `${v}px` })} /></Row>
      <Row label="Border">
        <input value={border} onChange={(e) => onPatch({ border: e.target.value })} placeholder="1px solid #e5e7eb" className={monoCls} data-testid="card-border" />
      </Row>
      <Row label="Shadow">
        <select
          value={shadow}
          onChange={(e) => onPatch({ "box-shadow": e.target.value })}
          className={selectCls}
          data-testid="card-shadow"
        >
          <option value="none">none</option>
          <option value="0 1px 2px rgba(0,0,0,0.06)">xs</option>
          <option value="0 4px 10px rgba(0,0,0,0.08)">sm</option>
          <option value="0 12px 24px rgba(0,0,0,0.12)">md</option>
          <option value="0 24px 48px rgba(0,0,0,0.18)">lg</option>
          <option value="0 40px 80px rgba(0,0,0,0.24)">xl</option>
        </select>
      </Row>
    </div>
  );
};


// ============================================================
// Root: picks editors to render based on the selected html.
// ============================================================

export const ContextualEditors = ({ selected, onPatch, onReplaceHtml }) => {
  if (!selected) return null;
  const kind = detectKind(selected.html);

  return (
    <div className="space-y-3">
      {kind === "button" && <ButtonEditor html={selected.html} onReplace={onReplaceHtml} />}
      {kind === "image" && <ImageEditor html={selected.html} onReplace={onReplaceHtml} />}
      {kind === "flex" && <FlexContainerEditor html={selected.html} onPatch={onPatch} />}
      {kind === "grid" && <GridContainerEditor html={selected.html} onPatch={onPatch} />}
      {kind === "generic" && <CardEditor html={selected.html} onPatch={onPatch} />}
    </div>
  );
};
