import React, { useState } from "react";
import { Layers as LayersIcon } from "lucide-react";

// Every CSS mix-blend / background-blend mode + a colour-overlay (duotone) builder.
const BLEND_MODES = [
  "normal", "multiply", "screen", "overlay", "darken", "lighten",
  "color-dodge", "color-burn", "hard-light", "soft-light", "difference",
  "exclusion", "hue", "saturation", "color", "luminosity", "plus-lighter", "plus-darker",
];

const SAMPLE = "https://images.unsplash.com/photo-1502691876148-a84978e59af8?w=600&q=70";

export const BlendPanel = ({ selected, onPatch, onReplaceHtml }) => {
  const [mix, setMix] = useState("normal");
  const [bgMix, setBgMix] = useState("normal");
  const [overlayColor, setOverlayColor] = useState("#4f46e5");
  const [overlayMode, setOverlayMode] = useState("multiply");

  const applyMix = (m) => { setMix(m); if (selected) onPatch({ "mix-blend-mode": m }); };
  const applyBg = (m) => { setBgMix(m); if (selected) onPatch({ "background-blend-mode": m }); };
  const toggleIsolate = (on) => selected && onPatch({ isolation: on ? "isolate" : "auto" });

  const addOverlay = () => {
    if (!selected) return;
    onReplaceHtml(`<div style="position:relative;overflow:hidden;">${selected.html}<div style="position:absolute;inset:0;background:${overlayColor};mix-blend-mode:${overlayMode};pointer-events:none;"></div></div>`);
  };

  const ModeGrid = ({ value, onPick, testPrefix }) => (
    <div className="grid grid-cols-3 gap-1">
      {BLEND_MODES.map((m) => (
        <button
          key={m}
          onClick={() => onPick(m)}
          className={`text-[10px] py-1.5 rounded border truncate ${value === m ? "bg-fuchsia-600 border-fuchsia-500 text-white" : "border-[#2B2B2B] text-gray-400 hover:text-gray-200"}`}
          title={m}
          data-testid={`${testPrefix}-${m}`}
        >{m}</button>
      ))}
    </div>
  );

  return (
    <div className="space-y-4" data-testid="blend-panel">
      {/* Live sample */}
      <div className="rounded-lg overflow-hidden border border-[#2B2B2B]" style={{ background: "linear-gradient(135deg,#ec4899,#f59e0b)" }}>
        <div style={{ height: 120, backgroundImage: `url(${SAMPLE})`, backgroundSize: "cover", backgroundPosition: "center", mixBlendMode: mix }} />
      </div>
      <p className="text-[10px] text-gray-500 -mt-2">Preview of <span className="text-gray-300 font-mono">mix-blend-mode: {mix}</span></p>

      {!selected && <div className="text-[11px] text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded p-2">Select an element on the canvas to apply blend modes.</div>}

      <div>
        <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1.5">mix-blend-mode</div>
        <ModeGrid value={mix} onPick={applyMix} testPrefix="mix" />
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1.5">background-blend-mode</div>
        <ModeGrid value={bgMix} onPick={applyBg} testPrefix="bgmix" />
      </div>

      <label className="flex items-center gap-2 text-xs text-gray-300">
        <input type="checkbox" onChange={(e) => toggleIsolate(e.target.checked)} disabled={!selected} data-testid="blend-isolate" /> Isolate (new stacking context)
      </label>

      {/* Colour overlay builder */}
      <div className="pt-3 border-t border-[#2B2B2B] space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-gray-500 flex items-center gap-1.5"><LayersIcon size={12} /> Colour overlay (duotone)</div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Colour</label>
            <input type="color" value={overlayColor} onChange={(e) => setOverlayColor(e.target.value)} className="w-full h-8 rounded bg-[#0D0D0D] border border-[#2B2B2B]" data-testid="blend-overlay-color" />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 block mb-1">Blend</label>
            <select value={overlayMode} onChange={(e) => setOverlayMode(e.target.value)} className="w-full bg-[#0D0D0D] border border-[#2B2B2B] rounded px-1.5 py-1.5 text-[11px] text-white outline-none focus:border-fuchsia-500" data-testid="blend-overlay-mode">
              {BLEND_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <button onClick={addOverlay} disabled={!selected} className="w-full text-xs py-1.5 rounded bg-fuchsia-600 hover:bg-fuchsia-500 text-white disabled:opacity-40" data-testid="blend-apply-overlay">Wrap with colour overlay</button>
        <p className="text-[10px] text-gray-500">Wraps the selected element with a coloured layer using your blend mode — great for image tints and duotones.</p>
      </div>
    </div>
  );
};
