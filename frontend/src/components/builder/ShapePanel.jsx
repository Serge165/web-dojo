import React, { useState } from "react";
import { Square, Sparkles, Eraser } from "lucide-react";

const inputCls = "w-full bg-[#0D0D0D] border border-[#2B2B2B] rounded px-2 py-1.5 text-xs text-white outline-none focus:border-blue-500";
const labelCls = "text-[10px] uppercase tracking-wider text-gray-500 block mb-1";

// CSS3 corner-shape keywords (Chrome/Edge 139+). Companion to border-radius —
// round(default) / squircle / bevel / scoop / square / notch.
const CORNER_SHAPES = [
  { id: "round", label: "Round" },
  { id: "squircle", label: "Squircle" },
  { id: "bevel", label: "Bevel" },
  { id: "scoop", label: "Scoop" },
  { id: "square", label: "Square" },
  { id: "notch", label: "Notch" },
];

const SHADOW_PRESETS = [
  { id: "none", label: "None", v: null },
  { id: "soft", label: "Soft", v: { x: 0, y: 2, blur: 8, spread: 0, color: "rgba(0,0,0,0.12)", inset: false } },
  { id: "medium", label: "Medium", v: { x: 0, y: 8, blur: 24, spread: -4, color: "rgba(0,0,0,0.18)", inset: false } },
  { id: "large", label: "Large", v: { x: 0, y: 24, blur: 48, spread: -12, color: "rgba(0,0,0,0.25)", inset: false } },
  { id: "glow", label: "Glow", v: { x: 0, y: 0, blur: 24, spread: 2, color: "rgba(59,130,246,0.55)", inset: false } },
  { id: "inner", label: "Inner", v: { x: 0, y: 2, blur: 10, spread: 0, color: "rgba(0,0,0,0.35)", inset: true } },
];

export const ShapePanel = ({ selected, onPatch }) => {
  const [bw, setBw] = useState(2);
  const [bstyle, setBstyle] = useState("solid");
  const [bcolor, setBcolor] = useState("#3b82f6");
  const [linked, setLinked] = useState(true);
  const [r, setR] = useState(20);
  const [tl, setTl] = useState(20);
  const [tr, setTr] = useState(20);
  const [br, setBr] = useState(20);
  const [bl, setBl] = useState(20);
  const [shape, setShape] = useState("round");
  const [shadowOn, setShadowOn] = useState(true);
  const [sh, setSh] = useState({ x: 0, y: 8, blur: 24, spread: -4, color: "rgba(0,0,0,0.18)", inset: false });

  const radiusStr = linked ? `${r}px` : `${tl}px ${tr}px ${br}px ${bl}px`;
  const borderStr = bw > 0 && bstyle !== "none" ? `${bw}px ${bstyle} ${bcolor}` : "none";
  const shadowStr = shadowOn ? `${sh.inset ? "inset " : ""}${sh.x}px ${sh.y}px ${sh.blur}px ${sh.spread}px ${sh.color}` : "none";
  const cssString = `border:${borderStr};border-radius:${radiusStr};corner-shape:${shape};box-shadow:${shadowStr};`;

  const apply = () => {
    if (!selected) return;
    const maxR = linked ? r : Math.max(tl, tr, br, bl);
    onPatch({
      border: borderStr,
      "border-radius": shape !== "round" && maxR === 0 ? "24px" : radiusStr,
      "corner-shape": shape,
      "box-shadow": shadowStr,
    });
  };

  const clear = () => selected && onPatch({ border: "none", "border-radius": "0", "corner-shape": "round", "box-shadow": "none" });
  const setAllRadius = (v) => { setR(v); setTl(v); setTr(v); setBr(v); setBl(v); };

  return (
    <div className="space-y-4" data-testid="shape-panel">
      {/* Live preview over a checkerboard */}
      <div
        className="rounded-lg border border-[#2B2B2B] flex items-center justify-center h-[130px]"
        style={{
          backgroundImage: "linear-gradient(45deg,#181818 25%,transparent 25%),linear-gradient(-45deg,#181818 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#181818 75%),linear-gradient(-45deg,transparent 75%,#181818 75%)",
          backgroundSize: "16px 16px",
          backgroundPosition: "0 0,0 8px,8px -8px,-8px 0",
          backgroundColor: "#0d0d0d",
        }}
      >
        <div dangerouslySetInnerHTML={{ __html: `<div style="width:140px;height:82px;background:linear-gradient(135deg,#6366f1,#ec4899);${cssString}"></div>` }} />
      </div>

      {!selected && <div className="text-[11px] text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded p-2">Select an element on the canvas, then Apply.</div>}

      {/* Border */}
      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-gray-500 flex items-center gap-1.5"><Square size={12} /> Border</div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className={labelCls}>Width</label>
            <input type="number" min="0" max="24" value={bw} onChange={(e) => setBw(Number(e.target.value))} className={inputCls} data-testid="shape-border-width" />
          </div>
          <div>
            <label className={labelCls}>Style</label>
            <select value={bstyle} onChange={(e) => setBstyle(e.target.value)} className={inputCls} data-testid="shape-border-style">
              {["solid", "dashed", "dotted", "double", "none"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Color</label>
            <input type="color" value={bcolor} onChange={(e) => setBcolor(e.target.value)} className="w-full h-8 rounded bg-[#0D0D0D] border border-[#2B2B2B]" data-testid="shape-border-color" />
          </div>
        </div>
      </div>

      {/* Radius */}
      <div className="space-y-2 pt-3 border-t border-[#2B2B2B]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-gray-500">Corner radius</span>
          <label className="flex items-center gap-1.5 text-[10px] text-gray-400"><input type="checkbox" checked={linked} onChange={(e) => setLinked(e.target.checked)} data-testid="shape-radius-linked" /> Link all</label>
        </div>
        {linked ? (
          <div className="flex items-center gap-2">
            <input type="range" min="0" max="80" value={r} onChange={(e) => setAllRadius(Number(e.target.value))} className="flex-1" data-testid="shape-radius-all" />
            <span className="text-xs font-mono text-gray-300 w-10 text-right">{r}px</span>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-1.5">
            {[["TL", tl, setTl], ["TR", tr, setTr], ["BR", br, setBr], ["BL", bl, setBl]].map(([lab, val, set]) => (
              <div key={lab}>
                <label className="text-[9px] text-gray-500 block mb-0.5 text-center">{lab}</label>
                <input type="number" min="0" value={val} onChange={(e) => set(Number(e.target.value))} className={inputCls + " text-center px-1"} data-testid={`shape-radius-${lab.toLowerCase()}`} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Corner shape (CSS3) */}
      <div className="space-y-2 pt-3 border-t border-[#2B2B2B]">
        <div className="text-[10px] uppercase tracking-wider text-gray-500 flex items-center gap-1.5"><Sparkles size={12} /> Corner shape <span className="text-[9px] text-gray-600 normal-case tracking-normal">css3</span></div>
        <div className="grid grid-cols-3 gap-1">
          {CORNER_SHAPES.map((s) => (
            <button key={s.id} onClick={() => setShape(s.id)} className={`text-[10px] py-1.5 rounded border ${shape === s.id ? "bg-blue-600 border-blue-500 text-white" : "border-[#2B2B2B] text-gray-400 hover:text-gray-200"}`} data-testid={`shape-corner-${s.id}`}>{s.label}</button>
          ))}
        </div>
        <p className="text-[10px] text-gray-500">Needs a non-zero radius. Chrome/Edge 139+ render these; other browsers fall back to rounded corners.</p>
      </div>

      {/* Shadow */}
      <div className="space-y-2 pt-3 border-t border-[#2B2B2B]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-gray-500">Box shadow</span>
          <label className="flex items-center gap-1.5 text-[10px] text-gray-400"><input type="checkbox" checked={shadowOn} onChange={(e) => setShadowOn(e.target.checked)} data-testid="shape-shadow-on" /> On</label>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {SHADOW_PRESETS.map((p) => (
            <button key={p.id} onClick={() => { if (p.v) { setShadowOn(true); setSh(p.v); } else { setShadowOn(false); } }} className="text-[10px] py-1.5 rounded border border-[#2B2B2B] text-gray-400 hover:text-gray-200" data-testid={`shape-shadow-${p.id}`}>{p.label}</button>
          ))}
        </div>
        {shadowOn && (
          <>
            <div className="grid grid-cols-4 gap-1.5">
              {[["X", "x"], ["Y", "y"], ["Blur", "blur"], ["Spread", "spread"]].map(([lab, key]) => (
                <div key={key}>
                  <label className="text-[9px] text-gray-500 block mb-0.5 text-center">{lab}</label>
                  <input type="number" value={sh[key]} onChange={(e) => setSh((s) => ({ ...s, [key]: Number(e.target.value) }))} className={inputCls + " text-center px-1"} data-testid={`shape-shadow-${key}`} />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input type="color" value={/^#[0-9a-f]{6}$/i.test(sh.color) ? sh.color : "#000000"} onChange={(e) => setSh((s) => ({ ...s, color: e.target.value }))} className="w-10 h-8 rounded bg-[#0D0D0D] border border-[#2B2B2B]" data-testid="shape-shadow-color" />
              <input value={sh.color} onChange={(e) => setSh((s) => ({ ...s, color: e.target.value }))} className={inputCls + " font-mono"} data-testid="shape-shadow-color-hex" />
              <label className="flex items-center gap-1 text-[10px] text-gray-400 whitespace-nowrap"><input type="checkbox" checked={sh.inset} onChange={(e) => setSh((s) => ({ ...s, inset: e.target.checked }))} data-testid="shape-shadow-inset" /> Inset</label>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-[#2B2B2B]">
        <button onClick={apply} disabled={!selected} className="flex-1 text-xs py-2 rounded bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 disabled:cursor-not-allowed" data-testid="shape-apply">Apply to selection</button>
        <button onClick={clear} disabled={!selected} className="flex items-center gap-1.5 text-xs px-3 py-2 rounded bg-[#1F1F1F] hover:bg-[#2B2B2B] border border-[#2B2B2B] text-gray-300 disabled:opacity-40" data-testid="shape-clear"><Eraser size={12} /> Clear</button>
      </div>
    </div>
  );
};
