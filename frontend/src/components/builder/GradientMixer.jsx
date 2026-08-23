import React, { useState } from "react";
import { ColorPicker } from "./ColorPicker";
import { Copy } from "lucide-react";
import { toast } from "sonner";

const defaultStops = [
  { color: "#2563eb", alpha: 1, position: 0 },
  { color: "#0f172a", alpha: 1, position: 100 },
];

export const GradientMixer = ({ onApply }) => {
  const [stops, setStops] = useState(defaultStops);
  const [type, setType] = useState("linear");
  const [angle, setAngle] = useState(135);
  const [editing, setEditing] = useState(0);

  const cssStops = stops
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((s) => {
      const rgba = hexAlphaToRgba(s.color, s.alpha);
      return `${rgba} ${s.position}%`;
    })
    .join(", ");

  const gradient =
    type === "linear"
      ? `linear-gradient(${angle}deg, ${cssStops})`
      : `radial-gradient(circle, ${cssStops})`;

  const updateStop = (idx, patch) => {
    setStops((s) => s.map((v, i) => (i === idx ? { ...v, ...patch } : v)));
  };

  const addStop = () => {
    setStops((s) => [...s, { color: "#ffffff", alpha: 1, position: 50 }]);
    setEditing(stops.length);
  };

  const removeStop = (idx) => {
    if (stops.length <= 2) return;
    setStops((s) => s.filter((_, i) => i !== idx));
    setEditing(0);
  };

  const copy = () => {
    navigator.clipboard.writeText(gradient);
    toast.success("Gradient CSS copied");
  };

  return (
    <div className="space-y-3" data-testid="gradient-mixer">
      <div
        className="w-full h-20 rounded-md border border-[#332D22]"
        style={{ background: gradient }}
        data-testid="gradient-preview"
      />

      <div className="grid grid-cols-2 gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="bg-[#15130E] border border-[#332D22] rounded-md px-2 py-1.5 text-xs text-[#F1EDE2] outline-none focus:border-[#C9A227]"
          data-testid="gradient-type-select"
        >
          <option value="linear">Linear</option>
          <option value="radial">Radial</option>
        </select>
        {type === "linear" && (
          <input
            type="number"
            value={angle}
            min={0}
            max={360}
            onChange={(e) => setAngle(Number(e.target.value))}
            className="bg-[#15130E] border border-[#332D22] rounded-md px-2 py-1.5 text-xs font-mono text-[#F1EDE2] outline-none focus:border-[#C9A227]"
            data-testid="gradient-angle-input"
          />
        )}
      </div>

      <div className="space-y-1.5">
        {stops.map((s, i) => (
          <div
            key={i}
            className={`flex items-center gap-2 p-1.5 rounded-md border ${editing === i ? "border-[#C9A227]" : "border-[#332D22]"} bg-[#15130E] cursor-pointer`}
            onClick={() => setEditing(i)}
            data-testid={`gradient-stop-${i}`}
          >
            <div className="w-5 h-5 rounded border border-[#332D22]" style={{ background: hexAlphaToRgba(s.color, s.alpha) }} />
            <input
              type="number"
              min={0}
              max={100}
              value={s.position}
              onChange={(e) => updateStop(i, { position: Number(e.target.value) })}
              className="w-14 bg-transparent border border-[#332D22] rounded px-1 py-0.5 text-[11px] font-mono text-[#F1EDE2] outline-none focus:border-[#C9A227]"
              onClick={(e) => e.stopPropagation()}
            />
            <span className="text-[10px] text-[#948C79]">%</span>
            <span className="ml-auto text-[11px] font-mono text-[#A79C87]">{s.color}</span>
            {stops.length > 2 && (
              <button
                onClick={(e) => { e.stopPropagation(); removeStop(i); }}
                className="text-[11px] text-[#948C79] hover:text-red-400 px-1"
                data-testid={`gradient-remove-stop-${i}`}
              >×</button>
            )}
          </div>
        ))}
        <button
          onClick={addStop}
          className="w-full text-xs py-1.5 rounded-md border border-dashed border-[#332D22] text-[#A79C87] hover:text-[#F1EDE2] hover:border-[#948C79]"
          data-testid="gradient-add-stop"
        >+ Add stop</button>
      </div>

      <div className="pt-2 border-t border-[#332D22]">
        <div className="text-[10px] uppercase tracking-wider text-[#948C79] mb-1">Editing stop #{editing + 1}</div>
        <ColorPicker
          value={stops[editing].color}
          alpha={stops[editing].alpha}
          onChange={({ hex, alpha }) => updateStop(editing, { color: hex.slice(0, 7), alpha })}
        />
      </div>

      <div className="pt-3 border-t border-[#332D22] space-y-2">
        <div className="bg-[#15130E] border border-[#332D22] rounded-md p-2 text-[11px] font-mono text-[#E4DECE] break-all" data-testid="gradient-css">
          {gradient}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={copy}
            className="text-xs py-1.5 rounded-md bg-[#242019] hover:bg-[#332D22] text-[#F1EDE2] border border-[#332D22] flex items-center justify-center gap-1"
            data-testid="gradient-copy-btn"
          >
            <Copy size={12} /> Copy CSS
          </button>
          <button
            onClick={() => onApply && onApply(gradient)}
            className="text-xs py-1.5 rounded-md bg-[#AD8B21] hover:bg-[#C9A227] text-[#F1EDE2]"
            data-testid="gradient-apply-btn"
          >Apply to selection</button>
        </div>
      </div>
    </div>
  );
};

const hexAlphaToRgba = (hex, alpha) => {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
