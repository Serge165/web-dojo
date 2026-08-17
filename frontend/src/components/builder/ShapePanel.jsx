import React, { useState } from "react";
import { Square, Sparkles, Eraser, Wand2, Save, X } from "lucide-react";
import { toast } from "sonner";

const inputCls = "w-full bg-[#0D0D0D] border border-[#2B2B2B] rounded px-2 py-1.5 text-xs text-white outline-none focus:border-blue-500";
const labelCls = "text-[10px] uppercase tracking-wider text-gray-500 block mb-1";

const cssStr = (obj) => Object.entries(obj).map(([k, v]) => `${k}:${v}`).join(";");

// One-click combined style presets applied to the selected element.
const PRESETS = [
  { id: "glass", label: "Glass card", bg: "linear-gradient(135deg,#6366f1,#ec4899)", patch: {
    background: "rgba(255,255,255,0.10)", "backdrop-filter": "blur(12px)", "-webkit-backdrop-filter": "blur(12px)",
    border: "1px solid rgba(255,255,255,0.20)", "border-radius": "16px", "corner-shape": "round", "box-shadow": "0 8px 32px rgba(0,0,0,0.25)",
  } },
  { id: "frosted", label: "Frosted dark", bg: "linear-gradient(135deg,#0ea5e9,#8b5cf6)", patch: {
    background: "rgba(17,17,17,0.55)", "backdrop-filter": "blur(16px) saturate(140%)", "-webkit-backdrop-filter": "blur(16px) saturate(140%)",
    border: "1px solid rgba(255,255,255,0.08)", "border-radius": "18px", "box-shadow": "0 12px 40px rgba(0,0,0,0.45)",
  } },
  { id: "neu", label: "Neumorphic", bg: "#e0e5ec", patch: {
    background: "#e0e5ec", border: "none", "border-radius": "20px", "box-shadow": "8px 8px 18px #a3b1c6, -8px -8px 18px #ffffff",
  } },
  { id: "neu-inset", label: "Neu inset", bg: "#e0e5ec", patch: {
    background: "#e0e5ec", border: "none", "border-radius": "20px", "box-shadow": "inset 6px 6px 12px #a3b1c6, inset -6px -6px 12px #ffffff",
  } },
  { id: "soft", label: "Soft card", bg: "#ffffff", patch: {
    background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)", "border-radius": "14px", "box-shadow": "0 2px 10px rgba(0,0,0,0.08)",
  } },
  { id: "elevated", label: "Elevated", bg: "#ffffff", patch: {
    "border-radius": "14px", "box-shadow": "0 24px 48px -12px rgba(0,0,0,0.28)",
  } },
  { id: "pill", label: "Pill", bg: "linear-gradient(135deg,#22d3ee,#6366f1)", patch: {
    "border-radius": "999px",
  } },
  { id: "neon", label: "Neon", bg: "#0b0b12", patch: {
    background: "#0b0b12", border: "2px solid #22d3ee", "border-radius": "12px", "box-shadow": "0 0 14px #22d3ee, inset 0 0 14px rgba(34,211,238,0.25)",
  } },
  { id: "squircle-glow", label: "Squircle glow", bg: "linear-gradient(135deg,#6366f1,#a855f7)", patch: {
    "border-radius": "28px", "corner-shape": "squircle", "box-shadow": "0 0 36px rgba(99,102,241,0.55)",
  } },
  { id: "aurora", label: "Aurora glow", bg: "linear-gradient(135deg,#22d3ee,#a855f7,#ec4899)", patch: {
    "border-radius": "20px", border: "1px solid rgba(255,255,255,0.2)", "box-shadow": "0 0 40px rgba(168,85,247,0.5)",
  } },
  { id: "ticket", label: "Ticket", bg: "#fef3c7", patch: {
    background: "#fef3c7", "border-radius": "16px", "corner-shape": "scoop", border: "2px dashed #d97706",
  } },
  { id: "sticker", label: "Sticker", bg: "#ffffff", patch: {
    background: "#ffffff", "border-radius": "14px", border: "3px solid #111827", "box-shadow": "4px 4px 0 #111827",
  } },
  { id: "inset-well", label: "Inset well", bg: "#e5e7eb", patch: {
    background: "#e5e7eb", "border-radius": "12px", "box-shadow": "inset 0 2px 8px rgba(0,0,0,0.25)",
  } },
];

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
  const [customPresets, setCustomPresets] = useState(() => {
    try { return JSON.parse(localStorage.getItem("webdojo_shape_presets") || "[]"); } catch { return []; }
  });
  const [presetName, setPresetName] = useState("");

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

  const applyPreset = (p) => {
    if (!selected) { toast.info("Select an element first, then tap a preset"); return; }
    onPatch(p.patch);
    toast.success(`Applied "${p.label}"`);
  };

  const saveCurrentPreset = () => {
    const label = presetName.trim() || `My preset ${customPresets.length + 1}`;
    const preset = {
      id: `custom-${Date.now()}`,
      label,
      custom: true,
      bg: "linear-gradient(135deg,#334155,#0f172a)",
      patch: { border: borderStr, "border-radius": radiusStr, "corner-shape": shape, "box-shadow": shadowStr },
    };
    const next = [...customPresets, preset];
    setCustomPresets(next);
    localStorage.setItem("webdojo_shape_presets", JSON.stringify(next));
    setPresetName("");
    toast.success(`Saved preset "${label}"`);
  };

  const deletePreset = (id) => {
    const next = customPresets.filter((p) => p.id !== id);
    setCustomPresets(next);
    localStorage.setItem("webdojo_shape_presets", JSON.stringify(next));
  };

  return (
    <div className="space-y-4" data-testid="shape-panel">
      {/* One-click presets */}
      <div className="space-y-1.5">
        <div className="text-[10px] uppercase tracking-wider text-gray-500 flex items-center gap-1.5"><Wand2 size={12} /> One-click presets</div>
        <div className="grid grid-cols-3 gap-1.5">
          {[...PRESETS, ...customPresets].map((p) => (
            <div key={p.id} role="button" tabIndex={0} onClick={() => applyPreset(p)} data-testid={`shape-preset-${p.id}`} className="relative rounded border border-[#2B2B2B] hover:border-blue-500 overflow-hidden group cursor-pointer" title={`Apply ${p.label}`}>
              <div className="h-11 flex items-center justify-center" style={{ background: p.custom ? "linear-gradient(135deg,#eef2ff,#dbe2ef)" : p.bg }}>
                <div dangerouslySetInnerHTML={{ __html: `<div style="width:60%;height:56%;${cssStr({ background: p.patch.background || (p.custom ? "#818cf8" : "#c7d2fe"), ...p.patch })}"></div>` }} />
              </div>
              <div className="text-[9px] text-gray-400 py-0.5 bg-[#141414] group-hover:text-gray-200 truncate px-1 text-center">{p.label}</div>
              {p.custom && (
                <button onClick={(e) => { e.stopPropagation(); deletePreset(p.id); }} className="absolute top-0.5 right-0.5 w-4 h-4 flex items-center justify-center rounded bg-black/60 text-gray-300 hover:text-red-400 opacity-70 hover:opacity-100" title="Delete preset" data-testid={`shape-preset-delete-${p.id}`}><X size={10} /></button>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-1.5">
          <input value={presetName} onChange={(e) => setPresetName(e.target.value)} placeholder="Name this style…" className="flex-1 bg-[#0D0D0D] border border-[#2B2B2B] rounded px-2 py-1 text-[11px] text-white outline-none focus:border-blue-500" data-testid="shape-preset-name" />
          <button onClick={saveCurrentPreset} className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded bg-[#1F1F1F] hover:bg-[#2B2B2B] border border-[#2B2B2B] text-gray-200" data-testid="shape-save-preset"><Save size={11} /> Save current</button>
        </div>
      </div>

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
