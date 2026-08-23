import React, { useState, useEffect } from "react";
import { ArrowUp, ArrowDown, Eye, EyeOff, Trash2, Sparkles, MousePointerClick, Filter, ClipboardPaste, CheckSquare, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { getFxClip, subscribeFxClip } from "@/lib/fxClipboard";
import { getAnimClip, subscribeAnimClip } from "@/lib/animClipboard";

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

export const LayersPanel = ({ elements, selectedId, onSelect, onMove, onDelete, onToggleVisible, onSetZIndex, onApplyStyleToIds, onApplyAnimationToIds, hideHeader }) => {
  // Rendered in reverse so the topmost item in the list == topmost on the page.
  const rev = [...elements].map((e, i) => ({ ...e, idx: i })).reverse();
  const [onlyFx, setOnlyFx] = useState(false);
  const [checked, setChecked] = useState(new Set());
  const [clipReady, setClipReady] = useState(!!getFxClip());
  useEffect(() => subscribeFxClip((v) => setClipReady(!!v)), []);
  const [animClipReady, setAnimClipReady] = useState(!!getAnimClip());
  useEffect(() => subscribeAnimClip((v) => setAnimClipReady(!!v)), []);
  const toggleCheck = (id) => setChecked((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const pasteMany = () => {
    const ids = [...checked].filter((id) => elements.some((e) => e.id === id));
    if (!ids.length || !onApplyStyleToIds) return;
    onApplyStyleToIds(ids, getFxClip());
    toast.success(`Style pasted onto ${ids.length} element${ids.length === 1 ? "" : "s"}`);
  };
  const applyAnimMany = () => {
    const ids = [...checked].filter((id) => elements.some((e) => e.id === id));
    if (!ids.length || !onApplyAnimationToIds) return;
    const clip = getAnimClip();
    onApplyAnimationToIds(ids, clip);
    toast.success(`${clip.preset.label} applied to ${ids.length} element${ids.length === 1 ? "" : "s"}`);
  };
  const selectAll = () => setChecked(new Set(elements.map((e) => e.id)));
  const selectEffected = () => setChecked(new Set(elements.filter((e) => { const f = fxOf(e.html); return f.text || f.hover; }).map((e) => e.id)));
  const list = onlyFx ? rev.filter((el) => { const f = fxOf(el.html); return f.text || f.hover; }) : rev;
  const fxCount = rev.filter((el) => { const f = fxOf(el.html); return f.text || f.hover; }).length;
  return (
    <div className="space-y-1.5" data-testid="layers-panel">
      {!hideHeader && (
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-[#948C79]">
          <span>Layers · {elements.length}</span>
          <span className="font-mono">z-index</span>
        </div>
      )}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-[#948C79]">{onlyFx ? `${list.length} with effects` : `${elements.length} layers`}</span>
        <button
          onClick={() => setOnlyFx((v) => !v)}
          className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${onlyFx ? "bg-[#AD8B21] border-[#C9A227] text-[#F1EDE2]" : "border-[#332D22] text-[#A79C87] hover:text-[#F1EDE2]"}`}
          data-testid="layers-filter-fx"
          title="Show only elements that carry a text/hover effect"
        ><Filter size={10} /> Effects{fxCount ? ` · ${fxCount}` : ""}</button>
      </div>
      {elements.length > 0 && (
        <div className="flex items-center gap-1.5" data-testid="layers-select-bar">
          <span className="text-[10px] text-[#948C79] flex items-center gap-1"><CheckSquare size={10} /> Check all:</span>
          <button
            onClick={selectEffected}
            disabled={fxCount === 0}
            className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border border-[#332D22] text-[#E4DECE] hover:text-[#F1EDE2] hover:border-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
            data-testid="layers-select-effected"
            title="Check every layer that carries a text/hover effect"
          ><Sparkles size={10} className="text-indigo-400" /> Effected{fxCount ? ` · ${fxCount}` : ""}</button>
          <button
            onClick={selectAll}
            className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border border-[#332D22] text-[#E4DECE] hover:text-[#F1EDE2] hover:border-[#C9A227]"
            data-testid="layers-select-all"
            title="Check every layer"
          >All · {elements.length}</button>
        </div>
      )}
      {checked.size > 0 && (
        <div className="flex items-center gap-2 p-1.5 rounded bg-[#AD8B21]/15 border border-[#C9A227]/40" data-testid="layers-batch-bar">
          <span className="text-[10px] text-blue-200">{checked.size} selected</span>
          <button
            onClick={pasteMany}
            disabled={!clipReady}
            className="ml-auto flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-[#AD8B21] hover:bg-[#C9A227] text-[#F1EDE2] disabled:opacity-40 disabled:cursor-not-allowed"
            data-testid="layers-paste-many"
            title={clipReady ? "Paste the copied style onto all checked layers" : "Copy a style first (Text FX tab → Copy style)"}
          ><ClipboardPaste size={11} /> Paste to {checked.size}</button>
          <button
            onClick={applyAnimMany}
            disabled={!animClipReady}
            className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-[#F1EDE2] disabled:opacity-40 disabled:cursor-not-allowed"
            data-testid="layers-anim-many"
            title={animClipReady ? "Apply the Motion tab's current animation to all checked layers" : "Dial in an animation first (Motion tab)"}
          ><Wand2 size={11} /> Animate {checked.size}</button>
          <button onClick={() => setChecked(new Set())} className="text-[10px] px-2 py-1 rounded border border-[#332D22] text-[#E4DECE] hover:text-[#F1EDE2]" data-testid="layers-clear-select">Clear</button>
        </div>
      )}
      <div className="space-y-1 max-h-[360px] overflow-y-auto pr-1">
        {rev.length === 0 && <div className="text-[11px] text-[#948C79]">No layers yet — drop a block on the canvas.</div>}
        {rev.length > 0 && list.length === 0 && <div className="text-[11px] text-[#948C79]" data-testid="layers-filter-empty">No elements carry an effect yet.</div>}
        {list.map((el) => {
          const hidden = /(^|;)\s*display\s*:\s*none/i.test(el.html);
          const fx = fxOf(el.html);
          return (
            <div
              key={el.id}
              className={`flex items-center gap-1 p-1.5 rounded border ${selectedId === el.id ? "border-[#C9A227] bg-[#2A2416]" : "border-[#332D22] bg-[#15130E]"}`}
              data-testid={`layer-row-${el.id}`}
            >
              <input
                type="checkbox"
                checked={checked.has(el.id)}
                onChange={() => toggleCheck(el.id)}
                className="accent-[#C9A227] w-3 h-3 flex-none"
                data-testid={`layer-check-${el.id}`}
                title="Select for batch paste"
              />
              <button
                onClick={() => onToggleVisible(el.id)}
                className="p-1 text-[#A79C87] hover:text-[#F1EDE2]"
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
                className="flex-1 text-left text-[11px] font-mono text-[#F1EDE2] truncate"
                data-testid={`layer-name-${el.id}`}
                title={el.id}
              >{labelFor(el.html)}</button>
              <input
                type="number"
                value={el.zIndex ?? 0}
                onChange={(e) => onSetZIndex(el.id, Number(e.target.value))}
                className="w-11 bg-transparent border border-[#332D22] rounded px-1 py-0.5 text-[10px] font-mono text-[#F1EDE2] outline-none focus:border-[#C9A227]"
                data-testid={`layer-z-${el.id}`}
                title="z-index"
              />
              {/* This list is rendered in reverse (top of stack first, see
                  `rev` above) — onMove's delta is an ARRAY index step, so
                  "up" in this reversed list means +1 (later in the array,
                  higher in the stack), the opposite of Canvas's own arrows
                  which move +1/-1 against the unreversed document order. */}
              <button onClick={() => onMove(el.id, 1)} className="p-1 text-[#A79C87] hover:text-[#F1EDE2]" title="Move up" data-testid={`layer-up-${el.id}`}><ArrowUp size={12} /></button>
              <button onClick={() => onMove(el.id, -1)} className="p-1 text-[#A79C87] hover:text-[#F1EDE2]" title="Move down" data-testid={`layer-down-${el.id}`}><ArrowDown size={12} /></button>
              <button onClick={() => onDelete(el.id)} className="p-1 text-[#A79C87] hover:text-red-400" title="Delete" data-testid={`layer-del-${el.id}`}><Trash2 size={12} /></button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
