import React, { useState } from "react";
import { Type, Sparkles, MousePointerClick, Eraser, Gauge } from "lucide-react";
import { toast } from "sonner";

const cssStr = (obj) => Object.entries(obj).map(([k, v]) => `${k}:${v}`).join(";");
const rp = (n) => Math.round(n);
const op = (n) => Math.min(1, n).toFixed(2);

// Gradient-clipped text fill helper (background-image so it doesn't wipe other bg).
const grad = (g) => ({
  "background-image": g,
  "-webkit-background-clip": "text",
  "background-clip": "text",
  "-webkit-text-fill-color": "transparent",
  color: "transparent",
});

// Static fill / stroke effects. `patchFn(i)` = intensity-aware (glow/shadow/stroke).
const STATIC_FX = [
  { id: "sunset", label: "Sunset", patch: grad("linear-gradient(90deg,#ff6b6b,#feca57,#ff9ff3)") },
  { id: "ocean", label: "Ocean", patch: grad("linear-gradient(90deg,#2E3192,#1BFFFF)") },
  { id: "candy", label: "Candy", patch: grad("linear-gradient(90deg,#f857a6,#ff5858)") },
  { id: "gold", label: "Gold", patch: grad("linear-gradient(90deg,#f7971e,#ffd200)") },
  { id: "hollow", label: "Hollow", patchFn: (i) => ({ "-webkit-text-stroke": `${(2 * i).toFixed(1)}px currentColor`, "-webkit-text-fill-color": "transparent", color: "transparent" }) },
  { id: "stroke", label: "Stroke", patchFn: (i) => ({ "-webkit-text-stroke": `${(1.5 * i).toFixed(1)}px #111827`, color: "#ffffff", "-webkit-text-fill-color": "#ffffff", "paint-order": "stroke fill" }) },
  { id: "neon", label: "Neon", patchFn: (i) => ({ color: "#ffffff", "-webkit-text-fill-color": "#ffffff", "text-shadow": `0 0 ${rp(4 * i)}px #0ff,0 0 ${rp(8 * i)}px #0ff,0 0 ${rp(18 * i)}px #0ff,0 0 ${rp(36 * i)}px #06f` }) },
  { id: "fire", label: "Fire", patchFn: (i) => ({ ...grad("linear-gradient(0deg,#ff2400,#ff8800 45%,#ffdd00)"), "text-shadow": `0 0 ${rp(14 * i)}px rgba(255,120,0,${op(0.55 * i)})` }) },
  { id: "chrome", label: "Chrome", patch: grad("linear-gradient(180deg,#f5f5f5,#9a9a9a 45%,#4a4a4a 55%,#dddddd)") },
  { id: "retro", label: "Retro 3D", patchFn: (i) => ({ color: "#ffd166", "-webkit-text-fill-color": "#ffd166", "text-shadow": `${rp(1 * i)}px ${rp(1 * i)}px 0 #ef476f,${rp(2 * i)}px ${rp(2 * i)}px 0 #ef476f,${rp(3 * i)}px ${rp(3 * i)}px 0 #06d6a0,${rp(4 * i)}px ${rp(4 * i)}px 0 #118ab2` }) },
  { id: "longshadow", label: "Long shadow", patchFn: (i) => { const steps = Math.max(2, rp(8 * i)); return { color: "#111827", "-webkit-text-fill-color": "#111827", "text-shadow": Array.from({ length: steps }, (_, k) => `${k + 1}px ${k + 1}px #cbd5e1`).join(",") }; } },
  { id: "glow", label: "Soft glow", patchFn: (i) => ({ color: "#a78bfa", "-webkit-text-fill-color": "#a78bfa", "text-shadow": `0 0 ${rp(22 * i)}px rgba(167,139,250,${op(0.9 * i)})` }) },
];

// Animated effects — inject keyframes + inline animation. `keyframesFn(n,i)` = intensity-aware.
const ANIM_FX = [
  { id: "shimmer", label: "Shimmer", dur: "3s", timing: "linear",
    patch: { ...grad("linear-gradient(90deg,#c084fc,#22d3ee,#c084fc)"), "background-size": "200% auto" },
    keyframes: (n) => `@keyframes ${n}{0%{background-position:0% 50%}100%{background-position:200% 50%}}` },
  { id: "rainbow", label: "Rainbow", dur: "6s", timing: "linear",
    patch: { ...grad("linear-gradient(90deg,#ff0000,#ff8800,#ffee00,#00cc44,#0088ff,#8800ff,#ff0000)"), "background-size": "400% auto" },
    keyframes: (n) => `@keyframes ${n}{0%{background-position:0% 50%}100%{background-position:400% 50%}}` },
  { id: "pulse", label: "Pulse glow", dur: "1.8s", timing: "ease-in-out",
    patch: { color: "#f472b6", "-webkit-text-fill-color": "#f472b6" },
    keyframesFn: (n, i) => `@keyframes ${n}{0%,100%{text-shadow:0 0 ${rp(6 * i)}px rgba(244,114,182,0.6)}50%{text-shadow:0 0 ${rp(22 * i)}px rgba(244,114,182,1),0 0 ${rp(40 * i)}px rgba(244,114,182,0.7)}}` },
  { id: "flicker", label: "Flicker", dur: "2.4s", timing: "linear",
    patch: { color: "#ffffff", "-webkit-text-fill-color": "#ffffff" },
    keyframesFn: (n, i) => `@keyframes ${n}{0%,19%,21%,23%,80%,100%{opacity:1;text-shadow:0 0 ${rp(8 * i)}px #0ff,0 0 ${rp(18 * i)}px #0ff}20%,22%,60%{opacity:.55;text-shadow:none}}` },
  { id: "float", label: "Float", dur: "3s", timing: "ease-in-out",
    keyframes: (n) => `@keyframes ${n}{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}` },
  { id: "wobble", label: "Wobble", dur: "2s", timing: "ease-in-out",
    keyframes: (n) => `@keyframes ${n}{0%,100%{transform:rotate(0)}25%{transform:rotate(-3deg)}75%{transform:rotate(3deg)}}` },
];

// Hover effects — need a real CSS rule (scoped class + injected style block).
const HOVER_FX = [
  { id: "pop", label: "Color pop", hover: "color:#6366f1;-webkit-text-fill-color:#6366f1;" },
  { id: "underline", label: "Underline", base: "background-image:linear-gradient(currentColor,currentColor);background-position:0 100%;background-repeat:no-repeat;background-size:0% 2px;", transition: "background-size .3s ease", hover: "background-size:100% 2px;" },
  { id: "hglow", label: "Glow", hoverFn: (i) => `text-shadow:0 0 ${rp(14 * i)}px currentColor;` },
  { id: "lift", label: "Lift", transition: "transform .25s ease", hover: "transform:translateY(-4px);" },
  { id: "skew", label: "Skew", transition: "transform .25s ease", hover: "transform:skewX(-10deg);" },
  { id: "spread", label: "Spread", transition: "letter-spacing .25s ease", hover: "letter-spacing:.14em;" },
];

const addClassToRootTag = (html, cls) => {
  const m = html.match(/^\s*<([a-zA-Z][\w-]*)([^>]*)>/);
  if (!m) return html;
  const [full, tag, attrs] = m;
  const newAttrs = /class="/.test(attrs)
    ? attrs.replace(/class="([^"]*)"/, (mm, c) => `class="${c} ${cls}"`)
    : `${attrs} class="${cls}"`;
  return html.replace(full, `<${tag}${newAttrs}>`);
};

const FxChip = ({ testid, onClick, previewHtml, label, animated }) => (
  <button onClick={onClick} data-testid={testid} className="relative rounded border border-[#2B2B2B] hover:border-blue-500 overflow-hidden group bg-[#0D0D0D]" title={label}>
    <div className="h-9 flex items-center justify-center px-1" dangerouslySetInnerHTML={{ __html: previewHtml }} />
    <div className="text-[9px] text-gray-400 py-0.5 bg-[#141414] group-hover:text-gray-200 truncate px-1 text-center">{label}</div>
    {animated && <span className="absolute top-0.5 right-0.5 text-[7px] px-1 rounded bg-blue-600/70 text-white">anim</span>}
  </button>
);

export const TextEffectsPanel = ({ selected, onPatch, onApplyAnimation, onReplaceHtml, headHtml, onHeadHtmlChange }) => {
  const [intensity, setIntensity] = useState(1);

  const needSel = () => { if (!selected) { toast.info("Select a text element (H1–H6, p, button…) first"); return true; } return false; };
  const getPatch = (fx) => (fx.patchFn ? fx.patchFn(intensity) : fx.patch);

  const applyStatic = (fx) => { if (needSel()) return; onPatch(getPatch(fx)); toast.success(fx.label); };

  const applyAnim = (fx) => {
    if (needSel()) return;
    const name = `wdtfx_${fx.id}_${Math.random().toString(36).slice(2, 6)}`;
    const patch = getPatch(fx);
    if (patch) onPatch(patch);
    const keyframes = fx.keyframesFn ? fx.keyframesFn(name, intensity) : fx.keyframes(name);
    onApplyAnimation({ keyframes, shorthand: `${name} ${fx.dur} ${fx.timing} infinite` });
    toast.success(fx.label);
  };

  const applyHover = (fx) => {
    if (needSel()) return;
    const cls = `wd-tfx-${Math.random().toString(36).slice(2, 7)}`;
    onReplaceHtml(addClassToRootTag(selected.html, cls));
    const hover = fx.hoverFn ? fx.hoverFn(intensity) : fx.hover;
    const rule = `<style data-wd-tfx="${cls}">.${cls}{${fx.base || ""}transition:${fx.transition || "all .25s ease"};}.${cls}:hover{${hover}}</style>`;
    onHeadHtmlChange((headHtml ? headHtml + "\n" : "") + rule);
    toast.success(`Hover: ${fx.label}`);
  };

  const stripHover = () => {
    if (needSel()) return;
    const uniq = [...new Set([...selected.html.matchAll(/wd-tfx-[a-z0-9]+/g)].map((m) => m[0]))];
    if (!uniq.length) { toast.info("This element has no hover effect to remove"); return; }
    let html = selected.html;
    uniq.forEach((c) => { html = html.split(c).join(""); });
    html = html.replace(/class="\s*([^"]*?)\s*"/g, (m, inner) => (inner.trim() ? `class="${inner.replace(/\s+/g, " ").trim()}"` : ""));
    onReplaceHtml(html);
    let head = headHtml || "";
    uniq.forEach((c) => { head = head.replace(new RegExp(`<style data-wd-tfx="${c}">[\\s\\S]*?<\\/style>\\n?`, "g"), ""); });
    onHeadHtmlChange(head);
    toast.success("Hover effect removed from element");
  };

  const clearFx = () => {
    if (needSel()) return;
    onPatch({
      "background-image": "none", "-webkit-background-clip": "border-box", "background-clip": "border-box",
      "-webkit-text-fill-color": "currentColor", "-webkit-text-stroke": "0", "text-shadow": "none",
      "background-size": "auto", animation: "none", "letter-spacing": "normal", transform: "none", color: "inherit",
    });
    toast.success("Text FX cleared");
  };

  const hasHover = !!selected && /wd-tfx-/.test(selected.html);
  const animPreviewCss = ANIM_FX.map((fx) => (fx.keyframesFn ? fx.keyframesFn(`wdtfxprev_${fx.id}`, intensity) : fx.keyframes(`wdtfxprev_${fx.id}`))).join("\n");

  return (
    <div className="space-y-4" data-testid="text-fx-panel">
      <style>{animPreviewCss}</style>
      {!selected && <div className="text-[11px] text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded p-2">Select a heading or text element on the canvas to apply effects.</div>}

      {/* Intensity */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-gray-500 flex items-center gap-1.5"><Gauge size={12} /> FX intensity</span>
          <span className="text-xs font-mono text-gray-300">{Math.round(intensity * 100)}%</span>
        </div>
        <input type="range" min="25" max="250" value={Math.round(intensity * 100)} onChange={(e) => setIntensity(Number(e.target.value) / 100)} className="w-full" data-testid="textfx-intensity" />
        <p className="text-[10px] text-gray-500">Scales glow, shadow &amp; stroke strength before you apply.</p>
      </div>

      {/* Fill & stroke */}
      <div className="space-y-1.5 pt-3 border-t border-[#2B2B2B]">
        <div className="text-[10px] uppercase tracking-wider text-gray-500 flex items-center gap-1.5"><Type size={12} /> Fill &amp; stroke</div>
        <div className="grid grid-cols-3 gap-1.5">
          {STATIC_FX.map((fx) => (
            <FxChip key={fx.id} testid={`textfx-static-${fx.id}`} onClick={() => applyStatic(fx)} label={fx.label}
              previewHtml={`<span style="font-weight:800;font-size:18px;line-height:1;${cssStr(getPatch(fx))}">Ag</span>`} />
          ))}
        </div>
      </div>

      {/* Animated */}
      <div className="space-y-1.5 pt-3 border-t border-[#2B2B2B]">
        <div className="text-[10px] uppercase tracking-wider text-gray-500 flex items-center gap-1.5"><Sparkles size={12} /> Animated</div>
        <div className="grid grid-cols-3 gap-1.5">
          {ANIM_FX.map((fx) => (
            <FxChip key={fx.id} testid={`textfx-anim-${fx.id}`} onClick={() => applyAnim(fx)} label={fx.label} animated
              previewHtml={`<span style="display:inline-block;font-weight:800;font-size:18px;line-height:1;${cssStr(getPatch(fx) || { color: "#e5e7eb", "-webkit-text-fill-color": "#e5e7eb" })};animation:wdtfxprev_${fx.id} ${fx.dur} ${fx.timing} infinite">Ag</span>`} />
          ))}
        </div>
      </div>

      {/* Hover */}
      <div className="space-y-1.5 pt-3 border-t border-[#2B2B2B]">
        <div className="text-[10px] uppercase tracking-wider text-gray-500 flex items-center gap-1.5"><MousePointerClick size={12} /> Hover</div>
        <div className="grid grid-cols-3 gap-1.5">
          {HOVER_FX.map((fx) => (
            <FxChip key={fx.id} testid={`textfx-hover-${fx.id}`} onClick={() => applyHover(fx)} label={fx.label}
              previewHtml={`<span style="font-weight:800;font-size:18px;line-height:1;color:#e5e7eb">Ag</span>`} />
          ))}
        </div>
        <button onClick={stripHover} disabled={!hasHover} className="w-full flex items-center justify-center gap-1.5 text-[11px] py-1.5 rounded border border-[#2B2B2B] text-gray-300 hover:text-white hover:border-gray-500 disabled:opacity-40 disabled:cursor-not-allowed mt-1" data-testid="textfx-hover-clear"><Eraser size={11} /> Remove hover from element</button>
        <p className="text-[10px] text-gray-500">Hover effects run on your published/previewed site. Preview them in the Preview tab.</p>
      </div>

      <button onClick={clearFx} disabled={!selected} className="w-full flex items-center justify-center gap-1.5 text-xs py-2 rounded bg-[#1F1F1F] hover:bg-[#2B2B2B] border border-[#2B2B2B] text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed" data-testid="textfx-clear"><Eraser size={12} /> Clear text FX</button>
    </div>
  );
};
