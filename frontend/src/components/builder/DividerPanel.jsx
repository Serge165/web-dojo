import React, { useState } from "react";
import { FlipHorizontal, FlipVertical, Plus, ArrowUpToLine, ArrowDownToLine, ChevronsDown } from "lucide-react";
import { toast } from "sonner";

// SVG section dividers (shapedivider-style) rendered on a 0 0 1200 120 viewBox
// with preserveAspectRatio="none" so they stretch edge-to-edge.
const DIVIDERS = [
  { id: "wave", label: "Wave", paths: [{ d: "M0,60 C150,120 350,0 600,60 C850,120 1050,0 1200,60 L1200,120 L0,120 Z" }] },
  { id: "waves", label: "Waves", paths: [
    { d: "M0,40 C200,100 400,-10 600,40 C800,100 1000,-10 1200,40 L1200,120 L0,120 Z", opacity: 0.4 },
    { d: "M0,70 C200,120 400,20 600,70 C800,120 1000,20 1200,70 L1200,120 L0,120 Z" },
  ] },
  { id: "curve", label: "Curve", paths: [{ d: "M0,0 Q600,120 1200,0 L1200,120 L0,120 Z" }] },
  { id: "curve-asym", label: "Curve alt", paths: [{ d: "M0,0 Q300,120 1200,20 L1200,120 L0,120 Z" }] },
  { id: "tilt", label: "Tilt", paths: [{ d: "M0,120 L1200,0 L1200,120 Z" }] },
  { id: "triangle", label: "Triangle", paths: [{ d: "M0,0 L600,120 L1200,0 L1200,120 L0,120 Z" }] },
  { id: "arrow", label: "Arrow", paths: [{ d: "M0,0 L560,0 L600,70 L640,0 L1200,0 L1200,120 L0,120 Z" }] },
  { id: "book", label: "Book", paths: [{ d: "M0,0 C300,120 900,120 1200,0 L1200,120 L0,120 Z" }] },
  { id: "split", label: "Split", paths: [{ d: "M0,0 L588,0 L588,120 L612,120 L612,0 L1200,0 L1200,120 L0,120 Z" }] },
  { id: "zigzag", label: "Zigzag", paths: [{ d: "M0,60 L100,20 L200,60 L300,20 L400,60 L500,20 L600,60 L700,20 L800,60 L900,20 L1000,60 L1100,20 L1200,60 L1200,120 L0,120 Z" }] },
];

const buildSvg = (shape, color, height, flipX, flipY, fill100) => {
  const t = [flipX ? "scaleX(-1)" : "", flipY ? "scaleY(-1)" : ""].filter(Boolean).join(" ");
  const inner = shape.paths.map((p) => `<path d="${p.d}" fill="${color}"${p.opacity != null ? ` fill-opacity="${p.opacity}"` : ""}></path>`).join("");
  const hStyle = fill100 ? "height:100%" : `height:${height}px`;
  return `<svg viewBox="0 0 1200 120" preserveAspectRatio="none" style="display:block;width:100%;${hStyle};${t ? `transform:${t};` : ""}">${inner}</svg>`;
};

export const DividerPanel = ({ onAddBlock, elements = [], selectedId }) => {
  const [shapeId, setShapeId] = useState("wave");
  const [color, setColor] = useState("#6366f1");
  const [height, setHeight] = useState(80);
  const [flipX, setFlipX] = useState(false);
  const [flipY, setFlipY] = useState(false);
  const [placement, setPlacement] = useState("end");
  const shape = DIVIDERS.find((d) => d.id === shapeId) || DIVIDERS[0];

  const selIndex = elements.findIndex((e) => e.id === selectedId);
  const hasSel = selIndex >= 0;

  const insert = () => {
    const svg = buildSvg(shape, color, height, flipX, flipY, false);
    const html = `<div style="width:100%;line-height:0;overflow:hidden;">${svg}</div>`;
    const eff = placement !== "end" && hasSel ? placement : "end";
    let atIndex;
    if (eff === "below") atIndex = selIndex + 1;
    else if (eff === "above") atIndex = selIndex;
    onAddBlock(html, atIndex);
    const where = eff === "below" ? "below the selected section" : eff === "above" ? "above the selected section" : "at the end of the page";
    toast.success(`Divider snapped ${where}`);
  };

  return (
    <div className="space-y-4" data-testid="divider-panel">
      {/* Preview: two mock sections with the divider between */}
      <div className="rounded-lg border border-[#2B2B2B] overflow-hidden" style={{ background: "#0d0d0d" }}>
        <div style={{ background: "#1b1b1b", height: 22 }} />
        <div dangerouslySetInnerHTML={{ __html: buildSvg(shape, color, Math.min(height, 90), flipX, flipY, false) }} />
        <div style={{ background: color, height: 22, opacity: 0.28 }} />
      </div>

      {/* Shape grid */}
      <div>
        <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1.5">Divider shape</div>
        <div className="grid grid-cols-2 gap-1.5">
          {DIVIDERS.map((d) => (
            <button
              key={d.id}
              onClick={() => setShapeId(d.id)}
              className={`rounded border overflow-hidden ${shapeId === d.id ? "border-blue-500 ring-1 ring-blue-500/40" : "border-[#2B2B2B] hover:border-gray-500"}`}
              data-testid={`divider-shape-${d.id}`}
              title={d.label}
            >
              <div className="h-8 bg-[#0D0D0D]" dangerouslySetInnerHTML={{ __html: buildSvg(d, "#64748b", 32, false, false, true) }} />
              <div className="text-[9px] text-gray-400 py-0.5 bg-[#141414]">{d.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">Color</label>
          <div className="flex gap-1.5">
            <input type="color" value={/^#[0-9a-f]{6}$/i.test(color) ? color : "#6366f1"} onChange={(e) => setColor(e.target.value)} className="w-9 h-8 rounded bg-[#0D0D0D] border border-[#2B2B2B]" data-testid="divider-color" />
            <input value={color} onChange={(e) => setColor(e.target.value)} className="flex-1 bg-[#0D0D0D] border border-[#2B2B2B] rounded px-2 text-xs font-mono text-white outline-none focus:border-blue-500" data-testid="divider-color-hex" />
          </div>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">Height</label>
          <div className="flex items-center gap-2">
            <input type="range" min="20" max="220" value={height} onChange={(e) => setHeight(Number(e.target.value))} className="flex-1" data-testid="divider-height" />
            <span className="text-xs font-mono text-gray-300 w-9 text-right">{height}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => setFlipX((v) => !v)} className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded border ${flipX ? "bg-blue-600 border-blue-500 text-white" : "border-[#2B2B2B] text-gray-300 hover:text-white"}`} data-testid="divider-flip-x"><FlipHorizontal size={13} /> Flip X</button>
        <button onClick={() => setFlipY((v) => !v)} className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded border ${flipY ? "bg-blue-600 border-blue-500 text-white" : "border-[#2B2B2B] text-gray-300 hover:text-white"}`} data-testid="divider-flip-y"><FlipVertical size={13} /> Flip Y</button>
      </div>

      {/* Snap placement */}
      <div className="pt-1">
        <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1.5">Snap placement</div>
        <div className="grid grid-cols-3 gap-1">
          {[
            { id: "above", label: "Above", icon: ArrowUpToLine },
            { id: "below", label: "Below", icon: ArrowDownToLine },
            { id: "end", label: "Page end", icon: ChevronsDown },
          ].map(({ id, label, icon: Icon }) => {
            const disabled = id !== "end" && !hasSel;
            const active = placement === id && !disabled;
            return (
              <button
                key={id}
                disabled={disabled}
                onClick={() => setPlacement(id)}
                className={`flex flex-col items-center gap-1 py-2 rounded border text-[10px] ${active ? "bg-blue-600 border-blue-500 text-white" : "border-[#2B2B2B] text-gray-400 hover:text-gray-200"} disabled:opacity-40 disabled:cursor-not-allowed`}
                data-testid={`divider-place-${id}`}
                title={disabled ? "Select a section first" : `Snap ${label}`}
              ><Icon size={13} /> {label}</button>
            );
          })}
        </div>
        {!hasSel && <p className="text-[10px] text-gray-500 mt-1">Select a section on the canvas to snap the divider flush above or below it.</p>}
      </div>

      <button onClick={insert} className="w-full flex items-center justify-center gap-1.5 text-xs py-2 rounded bg-blue-600 hover:bg-blue-500 text-white" data-testid="divider-insert"><Plus size={14} /> Insert divider</button>
      <p className="text-[10px] text-gray-500">Dividers render edge-to-edge with no gap. Set the fill color to match the neighbouring section, and use Flip Y to sit it at the top of a section.</p>
    </div>
  );
};
