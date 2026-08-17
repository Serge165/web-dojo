import React, { useState } from "react";
import { ArrowUp, ArrowDown, Eye, EyeOff, Trash2, Sparkles, MousePointerClick, Filter } from "lucide-react";

// Extract a short label from raw HTML: first tag name + inner text preview.
const labelFor = (html) => {
  const tag = (html.match(/<([a-zA-Z][a-zA-Z0-9]*)/) || [])[1] || "el";
  const text = (html.replace(/<[^>]+>/g, " ").trim() || "").slice(0, 26);
  return `${tag}${text ? " · " + text : ""}`;
};

// Detect Text FX / hover effects carried by an element so the row can flag them.
// Parse actual values (not just property names) so cleared placeholders
// (text-shadow:none, -webkit-text-stroke:0, background-clip:border-box,
// animation:none) do NOT keep the badge lit.
const styleVal = (html, prop) => {
  const m = html.match(new RegExp(`${prop}\\s*:\\s*([^;"']+)`, "i"));
  return m ? m[1].trim().toLowerCase() : null;
};
const fxOf = (html) => {
  const ts = styleVal(html, "text-shadow");
  const stroke = styleVal(html, "-webkit-text-stroke");
  const clip = styleVal(html, "background-clip");
  const anim = styleVal(html, "animation");
  return {
    text:
      (!!ts && ts !== "none") ||
      (!!stroke && parseFloat(stroke) > 0) ||
      clip === "text" ||
      (!!anim && anim.includes("wdtfx_")),
    hover: /wd-tfx-/.test(html),
  };
};

export const LayersPanel = ({ elements, selectedId, onSelect, onMove, onDelete, onToggleVisible, onSetZIndex, hideHeader }) => {
  // Rendered in reverse so the topmost item in the list == topmost on the page.
  const rev = [...elements].map((e, i) => ({ ...e, idx: i })).reverse();
  const [onlyFx, setOnlyFx] = useState(false);
  const list = onlyFx ? rev.filter((el) => { const f = fxOf(el.html); return f.text || f.hover; }) : rev;
  const fxCount = rev.filter((el) => { const f = fxOf(el.html); return f.text || f.hover; }).length;
  return (
    <div className="space-y-1.5" data-testid="layers-panel">
      {!hideHeader && (
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-gray-500">
          <span>Layers · {elements.length}</span>
          <span className="font-mono">z-index</span>
        </div>
      )}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-500">{onlyFx ? `${list.length} with effects` : `${elements.length} layers`}</span>
        <button
          onClick={() => setOnlyFx((v) => !v)}
          className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${onlyFx ? "bg-blue-600 border-blue-500 text-white" : "border-[#2B2B2B] text-gray-400 hover:text-gray-200"}`}
          data-testid="layers-filter-fx"
          title="Show only elements that carry a text/hover effect"
        ><Filter size={10} /> Effects{fxCount ? ` · ${fxCount}` : ""}</button>
      </div>
      <div className="space-y-1 max-h-[360px] overflow-y-auto pr-1">
        {rev.length === 0 && <div className="text-[11px] text-gray-500">No layers yet — drop a block on the canvas.</div>}
        {rev.length > 0 && list.length === 0 && <div className="text-[11px] text-gray-500" data-testid="layers-filter-empty">No elements carry an effect yet.</div>}
        {list.map((el) => {
          const hidden = /(^|;)\s*display\s*:\s*none/i.test(el.html);
          const fx = fxOf(el.html);
          return (
            <div
              key={el.id}
              className={`flex items-center gap-1 p-1.5 rounded border ${selectedId === el.id ? "border-blue-500 bg-[#111623]" : "border-[#2B2B2B] bg-[#0D0D0D]"}`}
              data-testid={`layer-row-${el.id}`}
            >
              <button
                onClick={() => onToggleVisible(el.id)}
                className="p-1 text-gray-400 hover:text-white"
                title="Toggle visibility"
                data-testid={`layer-vis-${el.id}`}
              >{hidden ? <EyeOff size={12} /> : <Eye size={12} />}</button>
              {(fx.text || fx.hover) && (
                <button
                  onClick={() => { onSelect(el.id); const n = document.querySelector(`[data-testid="canvas-el-${el.id}"]`); if (n) n.scrollIntoView({ behavior: "smooth", block: "center" }); }}
                  className="flex items-center gap-0.5 hover:brightness-150"
                  title="Jump to this element"
                  data-testid={`layer-fx-${el.id}`}
                >
                  {fx.text && <Sparkles size={11} className="text-indigo-400" />}
                  {fx.hover && <MousePointerClick size={11} className="text-cyan-400" />}
                </button>
              )}
              <button
                onClick={() => onSelect(el.id)}
                className="flex-1 text-left text-[11px] font-mono text-gray-200 truncate"
                data-testid={`layer-name-${el.id}`}
                title={el.id}
              >{labelFor(el.html)}</button>
              <input
                type="number"
                value={el.zIndex ?? 0}
                onChange={(e) => onSetZIndex(el.id, Number(e.target.value))}
                className="w-11 bg-transparent border border-[#2B2B2B] rounded px-1 py-0.5 text-[10px] font-mono text-white outline-none focus:border-blue-500"
                data-testid={`layer-z-${el.id}`}
                title="z-index"
              />
              <button onClick={() => onMove(el.id, -1)} className="p-1 text-gray-400 hover:text-white" title="Move up" data-testid={`layer-up-${el.id}`}><ArrowUp size={12} /></button>
              <button onClick={() => onMove(el.id, 1)} className="p-1 text-gray-400 hover:text-white" title="Move down" data-testid={`layer-down-${el.id}`}><ArrowDown size={12} /></button>
              <button onClick={() => onDelete(el.id)} className="p-1 text-gray-400 hover:text-red-400" title="Delete" data-testid={`layer-del-${el.id}`}><Trash2 size={12} /></button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
