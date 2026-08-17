import React from "react";
import { ArrowUp, ArrowDown, Eye, EyeOff, Trash2 } from "lucide-react";

// Extract a short label from raw HTML: first tag name + inner text preview.
const labelFor = (html) => {
  const tag = (html.match(/<([a-zA-Z][a-zA-Z0-9]*)/) || [])[1] || "el";
  const text = (html.replace(/<[^>]+>/g, " ").trim() || "").slice(0, 26);
  return `${tag}${text ? " · " + text : ""}`;
};

export const LayersPanel = ({ elements, selectedId, onSelect, onMove, onDelete, onToggleVisible, onSetZIndex }) => {
  // Rendered in reverse so the topmost item in the list == topmost on the page.
  const rev = [...elements].map((e, i) => ({ ...e, idx: i })).reverse();
  return (
    <div className="space-y-1.5" data-testid="layers-panel">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-gray-500">
        <span>Layers · {elements.length}</span>
        <span className="font-mono">z-index</span>
      </div>
      <div className="space-y-1 max-h-[360px] overflow-y-auto pr-1">
        {rev.length === 0 && <div className="text-[11px] text-gray-500">No layers yet — drop a block on the canvas.</div>}
        {rev.map((el) => {
          const hidden = /(^|;)\s*display\s*:\s*none/i.test(el.html);
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
