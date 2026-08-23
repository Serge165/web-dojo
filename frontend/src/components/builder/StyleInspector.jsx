import React from "react";
import { ContextualEditors } from "./ContextualEditors";

const readStyle = (html, prop) => {
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

const parseNumber = (v, fallback = 0) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : fallback;
};

const Row = ({ label, children }) => (
  <div>
    <label className="text-[10px] uppercase tracking-wider text-[#948C79] block mb-1">{label}</label>
    {children}
  </div>
);

const Slider = ({ min, max, step, value, onChange, testId, unit }) => (
  <div className="flex items-center gap-2">
    <input
      type="range"
      min={min} max={max} step={step ?? 1}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="flex-1 h-1.5"
      data-testid={testId}
    />
    <span className="w-12 text-right text-[11px] font-mono text-[#E4DECE]">{value}{unit}</span>
  </div>
);

export const StyleInspector = ({ selected, onPatch, onReplaceHtml }) => {
  if (!selected) {
    return <div className="text-[11px] text-[#948C79]">Select an element on the canvas to edit its style.</div>;
  }
  const html = selected.html;
  const padding = parseNumber(readStyle(html, "padding"), 24);
  const margin = parseNumber(readStyle(html, "margin"), 0);
  const radius = parseNumber(readStyle(html, "border-radius"), 0);
  const fontSize = parseNumber(readStyle(html, "font-size"), 16);
  const opacity = parseNumber(readStyle(html, "opacity"), 1);

  return (
    <div className="space-y-4" data-testid="style-inspector">
      <Row label={`Padding (${padding}px)`}>
        <Slider min={0} max={160} value={padding} unit="px" testId="style-padding" onChange={(v) => onPatch({ padding: `${v}px` })} />
      </Row>
      <Row label={`Margin (${margin}px)`}>
        <Slider min={0} max={120} value={margin} unit="px" testId="style-margin" onChange={(v) => onPatch({ margin: `${v}px` })} />
      </Row>
      <Row label={`Border radius (${radius}px)`}>
        <Slider min={0} max={80} value={radius} unit="px" testId="style-radius" onChange={(v) => onPatch({ "border-radius": `${v}px` })} />
      </Row>
      <Row label={`Font size (${fontSize}px)`}>
        <Slider min={8} max={96} value={fontSize} unit="px" testId="style-fontsize" onChange={(v) => onPatch({ "font-size": `${v}px` })} />
      </Row>
      <Row label={`Opacity (${Math.round(opacity * 100)}%)`}>
        <Slider min={0} max={100} value={Math.round(opacity * 100)} unit="%" testId="style-opacity" onChange={(v) => onPatch({ opacity: String(v / 100) })} />
      </Row>
      <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-[#332D22]">
        {[
          { label: "L", key: "text-align", value: "left" },
          { label: "C", key: "text-align", value: "center" },
          { label: "R", key: "text-align", value: "right" },
          { label: "J", key: "text-align", value: "justify" },
        ].map((b) => (
          <button
            key={b.label}
            onClick={() => onPatch({ [b.key]: b.value })}
            className="py-1.5 text-xs rounded bg-[#242019] hover:bg-[#332D22] border border-[#332D22] text-[#F1EDE2]"
            data-testid={`align-${b.value}`}
          >{b.label}</button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { label: "Normal", value: "400" },
          { label: "Bold", value: "600" },
          { label: "Black", value: "800" },
        ].map((b) => (
          <button
            key={b.value}
            onClick={() => onPatch({ "font-weight": b.value })}
            className="py-1.5 text-xs rounded bg-[#242019] hover:bg-[#332D22] border border-[#332D22] text-[#F1EDE2]"
            data-testid={`weight-${b.value}`}
          >{b.label}</button>
        ))}
      </div>

      <ContextualEditors selected={selected} onPatch={onPatch} onReplaceHtml={onReplaceHtml} />
    </div>
  );
};
