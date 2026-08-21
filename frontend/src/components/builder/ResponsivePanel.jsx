import React from "react";
import { BREAKPOINTS } from "@/lib/responsiveOverrides";

// Deliberately reuses the top-bar viewport toggle (Desktop/Tablet/Mobile)
// as "which breakpoint am I editing" instead of a second picker — one
// switch, not two that can disagree.
const readBase = (html, prop) => {
  const m = html && html.match(/style="([^"]*)"/);
  if (!m) return "";
  for (const p of m[1].split(";").map((s) => s.trim())) {
    const i = p.indexOf(":");
    if (i > 0 && p.slice(0, i).trim() === prop) return p.slice(i + 1).trim();
  }
  return "";
};
const num = (v, fallback) => { const n = parseFloat(v); return Number.isFinite(n) ? n : fallback; };

const Row = ({ label, overridden, onReset, children, testId }) => (
  <div>
    <div className="flex items-center justify-between mb-1">
      <label className="text-[10px] uppercase tracking-wider text-gray-500">{label}</label>
      {overridden && (
        <button onClick={onReset} className="text-[10px] text-blue-400 hover:text-blue-300 normal-case" data-testid={testId}>Reset</button>
      )}
    </div>
    {children}
  </div>
);

const Slider = ({ min, max, value, onChange, unit, testId }) => (
  <div className="flex items-center gap-2">
    <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="flex-1 h-1.5" data-testid={testId} />
    <span className="w-12 text-right text-[11px] font-mono text-gray-300">{value}{unit}</span>
  </div>
);

const SLIDER_PROPS = [
  { key: "padding", label: "Padding", min: 0, max: 160, unit: "px", fallback: 24 },
  { key: "margin", label: "Margin", min: 0, max: 120, unit: "px", fallback: 0 },
  { key: "font-size", label: "Font size", min: 8, max: 96, unit: "px", fallback: 16 },
];

export const ResponsivePanel = ({ selected, viewport, onPatch, onReset }) => {
  if (viewport === "desktop") {
    return (
      <div className="text-[11px] text-gray-500 space-y-2" data-testid="responsive-panel-desktop-hint">
        <p>Desktop is the base style — edit it from the Style tab.</p>
        <p>Switch the viewport toggle (top bar) to Tablet or Mobile to add breakpoint-specific overrides here.</p>
      </div>
    );
  }
  const meta = BREAKPOINTS[viewport];
  if (!selected) {
    return <div className="text-[11px] text-gray-500">Select an element on the canvas to edit its {meta.label.toLowerCase()} style.</div>;
  }
  const overrides = selected.responsive?.[viewport] || {};
  const hidden = overrides.display === "none";
  return (
    <div className="space-y-4" data-testid="responsive-panel">
      <div className="text-[11px] text-gray-400">
        Editing <span className="text-white font-medium">{meta.label}</span> ({meta.range}) overrides for this element.
        Unset properties inherit from Desktop{viewport === "mobile" ? " (via Tablet, if set)" : ""}.
      </div>
      {SLIDER_PROPS.map(({ key, label, min, max, unit, fallback }) => {
        const overridden = key in overrides;
        const value = num(overridden ? overrides[key] : readBase(selected.html, key), fallback);
        return (
          <Row key={key} label={label} overridden={overridden} onReset={() => onReset(key)} testId={`responsive-reset-${key}`}>
            <Slider min={min} max={max} unit={unit} value={value} testId={`responsive-${key}`} onChange={(v) => onPatch({ [key]: `${v}${unit}` })} />
          </Row>
        );
      })}
      <Row label="Visibility" overridden={"display" in overrides} onReset={() => onReset("display")} testId="responsive-reset-display">
        <label className="flex items-center gap-2 text-[11px] text-gray-300">
          <input
            type="checkbox"
            checked={hidden}
            onChange={(e) => (e.target.checked ? onPatch({ display: "none" }) : onReset("display"))}
            data-testid="responsive-hide"
          />
          Hide on {meta.label.toLowerCase()}
        </label>
      </Row>
    </div>
  );
};
