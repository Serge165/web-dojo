import React, { useState } from "react";
import { ColorPicker } from "./ColorPicker";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { PATTERN_PRESETS, PATTERN_PRESET_CATEGORIES } from "@/lib/patternPresets";

export const PatternPanel = ({ onApply }) => {
  const [presetId, setPresetId] = useState(PATTERN_PRESETS[0].id);
  const [c1, setC1] = useState("#2563eb");
  const [c2, setC2] = useState("#f8fafc");
  const [size, setSize] = useState(PATTERN_PRESETS[0].defaultSize);
  const [editing, setEditing] = useState("c1");

  const preset = PATTERN_PRESETS.find((p) => p.id === presetId) || PATTERN_PRESETS[0];
  const css = preset.build({ c1, c2, size });

  const selectPreset = (id) => {
    const p = PATTERN_PRESETS.find((x) => x.id === id);
    if (!p) return;
    setPresetId(id);
    setSize(p.defaultSize);
  };

  const copy = () => {
    navigator.clipboard.writeText(css);
    toast.success("Pattern CSS copied");
  };

  return (
    <div className="space-y-3" data-testid="pattern-panel">
      <div
        className="w-full h-20 rounded-md border border-[#332D22]"
        style={{ background: css }}
        data-testid="pattern-preview"
      />

      <select
        value={presetId}
        onChange={(e) => selectPreset(e.target.value)}
        className="w-full bg-[#242019] border border-[#332D22] rounded-md px-2 py-1.5 text-xs text-[#F1EDE2] outline-none focus:border-[#C9A227]"
        data-testid="pattern-preset-select"
      >
        {PATTERN_PRESET_CATEGORIES.map((cat) => (
          <optgroup key={cat} label={cat}>
            {PATTERN_PRESETS.filter((p) => p.category === cat).map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </optgroup>
        ))}
      </select>

      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] uppercase tracking-wider text-[#948C79]">Tile size</span>
          <span className="text-[11px] font-mono text-[#A79C87]">{size}px</span>
        </div>
        <input
          type="range"
          min={Math.max(8, Math.round(preset.defaultSize * 0.3))}
          max={Math.round(preset.defaultSize * 2.5)}
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
          className="w-full"
          data-testid="pattern-size-input"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setEditing("c1")}
          className={`flex items-center gap-2 p-1.5 rounded-md border ${editing === "c1" ? "border-[#C9A227]" : "border-[#332D22]"} bg-[#15130E]`}
          data-testid="pattern-edit-c1"
        >
          <div className="w-5 h-5 rounded border border-[#332D22]" style={{ background: c1 }} />
          <span className="text-[11px] font-mono text-[#A79C87]">Pattern</span>
        </button>
        <button
          onClick={() => setEditing("c2")}
          className={`flex items-center gap-2 p-1.5 rounded-md border ${editing === "c2" ? "border-[#C9A227]" : "border-[#332D22]"} bg-[#15130E]`}
          data-testid="pattern-edit-c2"
        >
          <div className="w-5 h-5 rounded border border-[#332D22]" style={{ background: c2 }} />
          <span className="text-[11px] font-mono text-[#A79C87]">Base</span>
        </button>
      </div>

      <div className="pt-2 border-t border-[#332D22]">
        <div className="text-[10px] uppercase tracking-wider text-[#948C79] mb-1">Editing {editing === "c1" ? "pattern" : "base"} color</div>
        <ColorPicker
          value={editing === "c1" ? c1 : c2}
          alpha={1}
          onChange={({ hex }) => (editing === "c1" ? setC1(hex.slice(0, 7)) : setC2(hex.slice(0, 7)))}
        />
      </div>

      <div className="pt-3 border-t border-[#332D22] space-y-2">
        <div className="bg-[#15130E] border border-[#332D22] rounded-md p-2 text-[11px] font-mono text-[#E4DECE] break-all max-h-24 overflow-y-auto" data-testid="pattern-css">
          {css}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={copy}
            className="text-xs py-1.5 rounded-md bg-[#242019] hover:bg-[#332D22] text-[#F1EDE2] border border-[#332D22] flex items-center justify-center gap-1"
            data-testid="pattern-copy-btn"
          >
            <Copy size={12} /> Copy CSS
          </button>
          <button
            onClick={() => onApply && onApply(css)}
            className="text-xs py-1.5 rounded-md bg-[#AD8B21] hover:bg-[#C9A227] text-[#F1EDE2]"
            data-testid="pattern-apply-btn"
          >Apply to selection</button>
        </div>
      </div>
    </div>
  );
};
