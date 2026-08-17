import React, { useState } from "react";
import { ANIMATION_PRESETS, buildKeyframes, buildAnimationShorthand } from "@/lib/animations";
import { Copy } from "lucide-react";
import { toast } from "sonner";

const uid = () => "a" + Math.random().toString(36).slice(2, 8);

export const AnimationGenerator = ({ selected, onApplyAnimation }) => {
  const [preset, setPreset] = useState(ANIMATION_PRESETS[1]);
  const [duration, setDuration] = useState(0.7);
  const [delay, setDelay] = useState(0);
  const [timing, setTiming] = useState("cubic-bezier(0.22, 1, 0.36, 1)");
  const [iteration, setIteration] = useState("1");

  const name = `forge_${preset.id.replace(/-/g, "_")}`;
  const keyframes = buildKeyframes(name, preset.frames);
  const shorthand = buildAnimationShorthand({ name, duration, timing, delay, iteration });
  const css = `${keyframes}\n\n.forge-anim { animation: ${shorthand}; }`;

  const apply = () => {
    if (!selected) { toast.error("Select an element first"); return; }
    // Give each application a unique keyframes name so multiple animations
    // don't collide when re-applied with different params.
    const unique = `${name}_${uid()}`;
    const uniqueKF = buildKeyframes(unique, preset.frames);
    const uniqueShort = buildAnimationShorthand({ name: unique, duration, timing, delay, iteration });
    onApplyAnimation({ keyframes: uniqueKF, shorthand: uniqueShort });
    toast.success(`Applied ${preset.label}`);
  };

  return (
    <div className="space-y-3" data-testid="animation-generator">
      <div>
        <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">Preset</label>
        <div className="grid grid-cols-3 gap-1.5">
          {ANIMATION_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPreset(p)}
              className={`text-[11px] py-1.5 rounded border ${preset.id === p.id ? "border-blue-500 bg-[#111623] text-white" : "border-[#2B2B2B] bg-[#1F1F1F] text-gray-200 hover:bg-[#2B2B2B]"}`}
              data-testid={`anim-preset-${p.id}`}
            >{p.label}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">Duration ({duration}s)</label>
          <input type="range" min={0.1} max={5} step={0.1} value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full" data-testid="anim-duration" />
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">Delay ({delay}s)</label>
          <input type="range" min={0} max={4} step={0.1} value={delay} onChange={(e) => setDelay(Number(e.target.value))} className="w-full" data-testid="anim-delay" />
        </div>
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">Easing</label>
        <select value={timing} onChange={(e) => setTiming(e.target.value)} className="w-full bg-[#0D0D0D] border border-[#2B2B2B] rounded px-2 py-1.5 text-xs text-white outline-none focus:border-blue-500" data-testid="anim-easing">
          <option value="linear">linear</option>
          <option value="ease">ease</option>
          <option value="ease-in">ease-in</option>
          <option value="ease-out">ease-out</option>
          <option value="ease-in-out">ease-in-out</option>
          <option value="cubic-bezier(0.22, 1, 0.36, 1)">out-expo (0.22, 1, 0.36, 1)</option>
          <option value="cubic-bezier(0.68, -0.55, 0.27, 1.55)">back-out (spring)</option>
        </select>
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">Iteration</label>
        <div className="grid grid-cols-4 gap-1.5">
          {["1", "2", "3", "infinite"].map((v) => (
            <button
              key={v}
              onClick={() => setIteration(v)}
              className={`text-[11px] py-1.5 rounded border ${iteration === v ? "border-blue-500 bg-[#111623] text-white" : "border-[#2B2B2B] bg-[#1F1F1F] text-gray-200 hover:bg-[#2B2B2B]"}`}
              data-testid={`anim-iter-${v}`}
            >{v === "infinite" ? "∞" : v}</button>
          ))}
        </div>
      </div>

      <div className="pt-2 border-t border-[#2B2B2B] space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-gray-500">Preview</div>
        <div className="p-3 rounded border border-[#2B2B2B] bg-[#0D0D0D] flex items-center justify-center">
          <div
            key={`${preset.id}-${duration}-${delay}-${timing}-${iteration}`}
            className="w-14 h-14 rounded-lg bg-blue-500"
            style={{ animation: shorthand }}
            data-testid="anim-preview"
          />
        </div>
        <pre className="text-[10px] font-mono text-gray-300 whitespace-pre-wrap bg-[#0D0D0D] border border-[#2B2B2B] rounded p-2 max-h-40 overflow-auto" data-testid="anim-css">{css}</pre>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => { navigator.clipboard.writeText(css); toast.success("CSS copied"); }}
            className="text-xs py-1.5 rounded bg-[#1F1F1F] hover:bg-[#2B2B2B] text-gray-200 border border-[#2B2B2B] flex items-center justify-center gap-1"
            data-testid="anim-copy"
          ><Copy size={12} /> Copy CSS</button>
          <button
            onClick={apply}
            className="text-xs py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white"
            data-testid="anim-apply"
          >Apply to selection</button>
        </div>
      </div>
    </div>
  );
};
