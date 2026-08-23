import React, { useState } from "react";
import { Layers as LayersIcon } from "lucide-react";

// Every CSS mix-blend / background-blend mode + a colour-overlay (duotone) builder.
const BLEND_MODES = [
  "normal", "multiply", "screen", "overlay", "darken", "lighten",
  "color-dodge", "color-burn", "hard-light", "soft-light", "difference",
  "exclusion", "hue", "saturation", "color", "luminosity", "plus-lighter", "plus-darker",
];

const SAMPLE = "https://images.unsplash.com/photo-1502691876148-a84978e59af8?w=600&q=70";

// Matches a wrapper this exact panel previously produced, so re-applying
// the overlay (e.g. after tweaking the color) replaces it instead of
// nesting a second wrapper around the first — greedy [\s\S]* + the
// anchored $ correctly finds the LAST occurrence of the trailing overlay
// div even if the inner content itself contains similar-looking divs.
const OVERLAY_RE = /^<div style="position:relative;overflow:hidden;" data-wd-overlay="1">([\s\S]*)<div style="position:absolute;inset:0;background:[^;]*;mix-blend-mode:[^;]*;pointer-events:none;"><\/div><\/div>$/;

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
    // If already wrapped by this panel, unwrap back to the original inner
    // content first so re-applying replaces the overlay instead of
    // nesting a second one around the first (was: infinite nesting on
    // repeated clicks).
    const existing = selected.html.match(OVERLAY_RE);
    const inner = existing ? existing[1] : selected.html;
    onReplaceHtml(`<div style="position:relative;overflow:hidden;" data-wd-overlay="1">${inner}<div style="position:absolute;inset:0;background:${overlayColor};mix-blend-mode:${overlayMode};pointer-events:none;"></div></div>`);
  };

  const ModeGrid = ({ value, onPick, testPrefix }) => (
    <div className="grid grid-cols-3 gap-1">
      {BLEND_MODES.map((m) => (
        <button
          key={m}
          onClick={() => onPick(m)}
          className={`text-[10px] py-1.5 rounded border truncate ${value === m ? "bg-fuchsia-600 border-fuchsia-500 text-[#F1EDE2]" : "border-[#332D22] text-[#A79C87] hover:text-[#F1EDE2]"}`}
          title={m}
          data-testid={`${testPrefix}-${m}`}
        >{m}</button>
      ))}
    </div>
  );

  return (
    <div className="space-y-4" data-testid="blend-panel">
      {/* Live sample */}
      <div className="rounded-lg overflow-hidden border border-[#332D22]" style={{ background: "linear-gradient(135deg,#ec4899,#f59e0b)" }}>
        <div style={{ height: 120, backgroundImage: `url(${SAMPLE})`, backgroundSize: "cover", backgroundPosition: "center", mixBlendMode: mix }} />
      </div>
      <p className="text-[10px] text-[#948C79] -mt-2">Preview of <span className="text-[#E4DECE] font-mono">mix-blend-mode: {mix}</span></p>

      {!selected && <div className="text-[11px] text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded p-2">Select an element on the canvas to apply blend modes.</div>}

      <div>
        <div className="text-[10px] uppercase tracking-wider text-[#948C79] mb-1.5">mix-blend-mode</div>
        <ModeGrid value={mix} onPick={applyMix} testPrefix="mix" />
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-wider text-[#948C79] mb-1.5">background-blend-mode</div>
        <ModeGrid value={bgMix} onPick={applyBg} testPrefix="bgmix" />
      </div>

      <label className="flex items-center gap-2 text-xs text-[#E4DECE]">
        <input type="checkbox" onChange={(e) => toggleIsolate(e.target.checked)} disabled={!selected} data-testid="blend-isolate" /> Isolate (new stacking context)
      </label>

      {/* Colour overlay builder */}
      <div className="pt-3 border-t border-[#332D22] space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-[#948C79] flex items-center gap-1.5"><LayersIcon size={12} /> Colour overlay (duotone)</div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-[#948C79] block mb-1">Colour</label>
            <input type="color" value={overlayColor} onChange={(e) => setOverlayColor(e.target.value)} className="w-full h-8 rounded bg-[#15130E] border border-[#332D22]" data-testid="blend-overlay-color" />
          </div>
          <div>
            <label className="text-[10px] text-[#948C79] block mb-1">Blend</label>
            <select value={overlayMode} onChange={(e) => setOverlayMode(e.target.value)} className="w-full bg-[#15130E] border border-[#332D22] rounded px-1.5 py-1.5 text-[11px] text-[#F1EDE2] outline-none focus:border-fuchsia-500" data-testid="blend-overlay-mode">
              {BLEND_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <button onClick={addOverlay} disabled={!selected} className="w-full text-xs py-1.5 rounded bg-fuchsia-600 hover:bg-fuchsia-500 text-[#F1EDE2] disabled:opacity-40" data-testid="blend-apply-overlay">Wrap with colour overlay</button>
        <p className="text-[10px] text-[#948C79]">Wraps the selected element with a coloured layer using your blend mode — great for image tints and duotones.</p>
      </div>
    </div>
  );
};
