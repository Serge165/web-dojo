import React, { useState, useEffect, useRef } from "react";
import { Type, Sparkles, MousePointerClick, Eraser, Gauge, Copy, ClipboardPaste, Save, X, Library, Download, Upload, ChevronDown, ChevronRight, Folder, Filter, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { getFxClip, setFxClip, subscribeFxClip } from "@/lib/fxClipboard";
import { STARTER_STYLES } from "@/lib/starterStyles";

const cssStr = (obj) => Object.entries(obj).map(([k, v]) => `${k}:${v}`).join(";");
// A visible thumbnail for a saved style: drop text-clip props (which would make
// a text-less box invisible) and ensure a fill so radius/shadow read.
const libPreview = (style) => {
  const s = { ...style };
  delete s["-webkit-background-clip"];
  delete s["background-clip"];
  delete s["-webkit-text-fill-color"];
  if (!s.background && !s["background-image"]) s.background = "#818cf8";
  return cssStr(s).replace(/"/g, "");
};
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
  { id: "stripes", label: "Stripes", patch: { ...grad("repeating-linear-gradient(45deg,#0f172a,#0f172a 6px,#f59e0b 6px,#f59e0b 12px)") } },
  { id: "dots-pat", label: "Dots", patch: { ...grad("radial-gradient(#f59e0b 30%,#0f172a 31%)"), "background-size": "10px 10px" } },
  { id: "checker", label: "Checkerboard", patch: { ...grad("conic-gradient(#0f172a 90deg,#f59e0b 90deg 180deg,#0f172a 180deg 270deg,#f59e0b 270deg)"), "background-size": "16px 16px" } },
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

// ---- Copy/paste style helpers (clipboard lives in lib/fxClipboard) ----

const FX_PROPS = ["background-image", "background-size", "-webkit-background-clip", "background-clip", "-webkit-text-fill-color", "-webkit-text-stroke", "paint-order", "text-shadow", "animation", "color"];
// Shape styling also carried by Copy/Paste (border/radius/corner-shape/shadow/glass).
const SHAPE_PROPS = ["border", "border-radius", "corner-shape", "box-shadow", "backdrop-filter", "-webkit-backdrop-filter", "background"];
const COPY_PROPS = [...FX_PROPS, ...SHAPE_PROPS];
const NEUTRALS = {
  "-webkit-text-stroke": (v) => !(parseFloat(v) > 0),
  "text-shadow": (v) => v === "none",
  "background-image": (v) => v === "none",
  "animation": (v) => v === "none",
  "background-clip": (v) => v !== "text",
  "-webkit-background-clip": (v) => v !== "text",
  "color": (v) => v === "inherit" || v === "currentcolor",
  "-webkit-text-fill-color": (v) => v === "currentcolor",
  "background-size": (v) => v === "auto",
  "border": (v) => v === "none" || parseFloat(v) === 0,
  "border-radius": (v) => v === "0" || v === "0px",
  "corner-shape": (v) => v === "round",
  "box-shadow": (v) => v === "none",
  "backdrop-filter": (v) => v === "none",
  "-webkit-backdrop-filter": (v) => v === "none",
  "background": (v) => v === "none" || v === "transparent" || v === "initial" || /rgba\(0,\s*0,\s*0,\s*0\)/.test(v),
};
// Parse ONLY the root tag's own style attribute into a prop->value map, so
// copyFx doesn't pick up nested-element styles or substring matches
// (e.g. `color` inside `background-color`).
const rootStyleMap = (html) => {
  const map = {};
  const tag = html.match(/^\s*<[a-zA-Z][\w-]*[^>]*>/);
  if (tag) {
    const sm = tag[0].match(/\sstyle="([^"]*)"/i);
    if (sm) sm[1].split(";").forEach((d) => { const i = d.indexOf(":"); if (i > 0) map[d.slice(0, i).trim().toLowerCase()] = d.slice(i + 1).trim(); });
  }
  return map;
};
const isNeutral = (p, v) => (NEUTRALS[p] ? NEUTRALS[p](v.toLowerCase()) : false);

const mergeStyleIntoRootTag = (html, styleObj) => {
  const m = html.match(/^\s*<([a-zA-Z][\w-]*)([^>]*)>/);
  if (!m) return html;
  const [full, tag, attrs] = m;
  const existing = {};
  const sm = attrs.match(/style="([^"]*)"/);
  if (sm) sm[1].split(";").forEach((d) => { const i = d.indexOf(":"); if (i > 0) existing[d.slice(0, i).trim()] = d.slice(i + 1).trim(); });
  Object.assign(existing, styleObj);
  const styleStr = Object.entries(existing).filter(([k, v]) => k && v !== "").map(([k, v]) => `${k}:${v}`).join(";");
  const newAttrs = sm ? attrs.replace(/style="[^"]*"/, `style="${styleStr}"`) : `${attrs} style="${styleStr}"`;
  return html.replace(full, `<${tag}${newAttrs}>`);
};

const FxChip = ({ testid, onClick, previewHtml, label, animated }) => (
  <button onClick={onClick} data-testid={testid} className="relative rounded border border-[#332D22] hover:border-[#C9A227] overflow-hidden group bg-[#15130E]" title={label}>
    <div className="h-9 flex items-center justify-center px-1" dangerouslySetInnerHTML={{ __html: previewHtml }} />
    <div className="text-[9px] text-[#A79C87] py-0.5 bg-[#1C1A15] group-hover:text-[#F1EDE2] truncate px-1 text-center">{label}</div>
    {animated && <span className="absolute top-0.5 right-0.5 text-[7px] px-1 rounded bg-[#AD8B21]/70 text-[#F1EDE2]">anim</span>}
  </button>
);

export const TextEffectsPanel = ({ selected, onPatch, onApplyAnimation, onReplaceHtml, headHtml, onHeadHtmlChange }) => {
  const [intensity, setIntensity] = useState(1);
  const [outlineColor, setOutlineColor] = useState("#f59e0b");
  const [outlineThickness, setOutlineThickness] = useState(2);
  const [shadowAngle, setShadowAngle] = useState(45);
  const [shadowDistance, setShadowDistance] = useState(6);
  const [shadowBlur, setShadowBlur] = useState(4);
  const [shadowColor, setShadowColor] = useState("#000000");
  const [tiltDepth, setTiltDepth] = useState(30);
  const [reflectDistance, setReflectDistance] = useState(4);
  const [reflectOpacity, setReflectOpacity] = useState(0.3);
  const [clip, setClip] = useState(getFxClip());
  useEffect(() => subscribeFxClip(setClip), []);
  const [library, setLibrary] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("webdojo_style_library") || "[]");
      if (!localStorage.getItem("webdojo_style_library_seeded")) {
        const ids = new Set(stored.map((e) => e.id));
        const merged = [...STARTER_STYLES.filter((s) => !ids.has(s.id)), ...stored];
        localStorage.setItem("webdojo_style_library", JSON.stringify(merged));
        localStorage.setItem("webdojo_style_library_seeded", "1");
        return merged;
      }
      return stored;
    } catch { return []; }
  });
  const [libName, setLibName] = useState("");
  const [libCategory, setLibCategory] = useState("");
  const [libFilter, setLibFilter] = useState("all");
  const [collapsed, setCollapsed] = useState(new Set());
  const fileRef = useRef(null);
  const toggleCollapsed = (cat) => setCollapsed((s) => { const n = new Set(s); n.has(cat) ? n.delete(cat) : n.add(cat); return n; });

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

  const applyOutline = () => {
    if (needSel()) return;
    onPatch({ "-webkit-text-stroke": `${outlineThickness}px ${outlineColor}`, color: "transparent", "-webkit-text-fill-color": "transparent", "paint-order": "stroke fill" });
    toast.success("Outline applied");
  };
  const applyDirectionalShadow = () => {
    if (needSel()) return;
    const rad = (shadowAngle * Math.PI) / 180;
    const x = Math.round(Math.cos(rad) * shadowDistance);
    const y = Math.round(Math.sin(rad) * shadowDistance);
    onPatch({ "text-shadow": `${x}px ${y}px ${shadowBlur}px ${shadowColor}` });
    toast.success("Shadow applied");
  };
  const applyTilt = () => {
    if (needSel()) return;
    onPatch({ transform: `perspective(500px) rotateX(${tiltDepth}deg)`, "transform-origin": "center bottom" });
    toast.success("3D tilt applied");
  };
  const applyReflection = () => {
    if (needSel()) return;
    onPatch({ "-webkit-box-reflect": `below ${reflectDistance}px linear-gradient(transparent, rgba(255,255,255,${reflectOpacity}))` });
    toast.success("Reflection applied");
  };

  const applyClipToSelected = (theClip) => {
    let head = headHtml || "";
    const classesToAdd = [];
    (theClip.hover || []).forEach(({ cls, tpl }) => {
      if (cls && head.includes(`data-wd-tfx="${cls}"`)) { classesToAdd.push(cls); return; }
      if (tpl) { const nc = `wd-tfx-${Math.random().toString(36).slice(2, 7)}`; head += `${head ? "\n" : ""}<style data-wd-tfx="${nc}">${tpl.split("__CLS__").join(nc)}</style>`; classesToAdd.push(nc); }
      else if (cls) classesToAdd.push(cls);
    });
    if (head !== (headHtml || "")) onHeadHtmlChange(head);
    let html = selected.html;
    if (theClip.style && Object.keys(theClip.style).length) html = mergeStyleIntoRootTag(html, theClip.style);
    classesToAdd.forEach((c) => { if (!new RegExp(`\\b${c}\\b`).test(html)) html = addClassToRootTag(html, c); });
    onReplaceHtml(html);
  };

  const copyFx = () => {
    if (needSel()) return;
    const map = rootStyleMap(selected.html);
    const style = {};
    COPY_PROPS.forEach((p) => { const v = map[p]; if (v && !isNeutral(p, v)) style[p] = v; });
    const classes = [...new Set([...selected.html.matchAll(/wd-tfx-[a-z0-9]+/g)].map((m) => m[0]))];
    const hover = classes.map((c) => {
      const m = (headHtml || "").match(new RegExp(`<style data-wd-tfx="${c}">([\\s\\S]*?)<\\/style>`));
      return { cls: c, tpl: m ? m[1].split(c).join("__CLS__") : null };
    });
    // `background` alone (a plain fill) is not enough to count as a copyable style.
    const meaningful = Object.keys(style).some((k) => k !== "background") || hover.length > 0;
    if (!meaningful) { toast.info("This element has no effect or shape style to copy"); return; }
    const data = { style, hover };
    setFxClip(data);
    setClip(data);
    toast.success("Style copied");
  };

  const pasteFx = () => {
    if (needSel()) return;
    if (!clip) { toast.info("Copy a style first"); return; }
    applyClipToSelected(clip);
    toast.success("Style pasted onto element");
  };

  const saveToLibrary = () => {
    if (!clip) { toast.info("Copy a style first, then save it to the library"); return; }
    const name = libName.trim() || `Style ${library.length + 1}`;
    const category = libCategory.trim() || "Uncategorized";
    const entry = { id: `lib-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, name, category, style: clip.style || {}, hover: clip.hover || [] };
    const next = [...library, entry];
    setLibrary(next);
    localStorage.setItem("webdojo_style_library", JSON.stringify(next));
    setLibName("");
    toast.success(`Saved "${name}" to ${category}`);
  };

  const applyLibrary = (entry) => {
    setFxClip(entry);
    setClip(entry);
    if (selected) { applyClipToSelected(entry); toast.success(`Applied "${entry.name}"`); }
    else toast.success(`"${entry.name}" copied — select elements and paste`);
  };

  const deleteLibrary = (id) => {
    const next = library.filter((e) => e.id !== id);
    setLibrary(next);
    localStorage.setItem("webdojo_style_library", JSON.stringify(next));
  };

  const exportLibrary = () => {
    if (!library.length) { toast.info("Your library is empty — save a style first"); return; }
    const blob = new Blob([JSON.stringify(library, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "webdojo-style-library.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast.success(`Exported ${library.length} style${library.length === 1 ? "" : "s"}`);
  };

  const importLibrary = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!Array.isArray(parsed)) throw new Error("not an array");
        const seen = new Set(library.map((x) => JSON.stringify({ n: x.name, c: x.category || "Uncategorized", s: x.style, h: x.hover })));
        const incoming = parsed
          .filter((x) => x && typeof x === "object" && x.style && typeof x.style === "object")
          .filter((x) => !seen.has(JSON.stringify({ n: x.name, c: x.category || "Uncategorized", s: x.style, h: x.hover })))
          .map((x, i) => ({ id: `lib-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`, name: String(x.name || "Imported style"), category: String(x.category || "Uncategorized"), style: x.style, hover: Array.isArray(x.hover) ? x.hover : [] }));
        if (!incoming.length) { toast.info("Nothing new to import"); return; }
        const next = [...library, ...incoming];
        setLibrary(next);
        localStorage.setItem("webdojo_style_library", JSON.stringify(next));
        toast.success(`Imported ${incoming.length} style${incoming.length === 1 ? "" : "s"}`);
      } catch { toast.error("That file isn't a valid Style Library export"); }
    };
    reader.readAsText(file);
  };

  const hasHover = !!selected && /wd-tfx-/.test(selected.html);
  const animPreviewCss = ANIM_FX.map((fx) => (fx.keyframesFn ? fx.keyframesFn(`wdtfxprev_${fx.id}`, intensity) : fx.keyframes(`wdtfxprev_${fx.id}`))).join("\n");
  const libCategories = [...new Set(library.map((e) => e.category || "Uncategorized"))].sort((a, b) => (a === "Uncategorized" ? 1 : b === "Uncategorized" ? -1 : a.localeCompare(b)));
  const libFiltered = libFilter === "all" ? library : library.filter((e) => (e.category || "Uncategorized") === libFilter);
  const libGroups = libCategories
    .map((cat) => ({ cat, items: libFiltered.filter((e) => (e.category || "Uncategorized") === cat) }))
    .filter((g) => g.items.length);

  return (
    <div className="space-y-4" data-testid="text-fx-panel">
      <style>{animPreviewCss}</style>
      {!selected && <div className="text-[11px] text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded p-2">Select a heading or text element on the canvas to apply effects.</div>}

      {/* Intensity */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-[#948C79] flex items-center gap-1.5"><Gauge size={12} /> FX intensity</span>
          <span className="text-xs font-mono text-[#E4DECE]">{Math.round(intensity * 100)}%</span>
        </div>
        <input type="range" min="25" max="250" value={Math.round(intensity * 100)} onChange={(e) => setIntensity(Number(e.target.value) / 100)} className="w-full" data-testid="textfx-intensity" />
        <p className="text-[10px] text-[#948C79]">Scales glow, shadow &amp; stroke strength before you apply.</p>
      </div>

      {/* Fill & stroke */}
      <div className="space-y-1.5 pt-3 border-t border-[#332D22]">
        <div className="text-[10px] uppercase tracking-wider text-[#948C79] flex items-center gap-1.5"><Type size={12} /> Fill &amp; stroke</div>
        <div className="grid grid-cols-3 gap-1.5">
          {STATIC_FX.map((fx) => (
            <FxChip key={fx.id} testid={`textfx-static-${fx.id}`} onClick={() => applyStatic(fx)} label={fx.label}
              previewHtml={`<span style="font-weight:800;font-size:18px;line-height:1;${cssStr(getPatch(fx))}">Ag</span>`} />
          ))}
        </div>
      </div>

      {/* Animated */}
      <div className="space-y-1.5 pt-3 border-t border-[#332D22]">
        <div className="text-[10px] uppercase tracking-wider text-[#948C79] flex items-center gap-1.5"><Sparkles size={12} /> Animated</div>
        <div className="grid grid-cols-3 gap-1.5">
          {ANIM_FX.map((fx) => (
            <FxChip key={fx.id} testid={`textfx-anim-${fx.id}`} onClick={() => applyAnim(fx)} label={fx.label} animated
              previewHtml={`<span style="display:inline-block;font-weight:800;font-size:18px;line-height:1;${cssStr(getPatch(fx) || { color: "#e5e7eb", "-webkit-text-fill-color": "#e5e7eb" })};animation:wdtfxprev_${fx.id} ${fx.dur} ${fx.timing} infinite">Ag</span>`} />
          ))}
        </div>
      </div>

      {/* Hover */}
      <div className="space-y-1.5 pt-3 border-t border-[#332D22]">
        <div className="text-[10px] uppercase tracking-wider text-[#948C79] flex items-center gap-1.5"><MousePointerClick size={12} /> Hover</div>
        <div className="grid grid-cols-3 gap-1.5">
          {HOVER_FX.map((fx) => (
            <FxChip key={fx.id} testid={`textfx-hover-${fx.id}`} onClick={() => applyHover(fx)} label={fx.label}
              previewHtml={`<span style="font-weight:800;font-size:18px;line-height:1;color:#e5e7eb">Ag</span>`} />
          ))}
        </div>
        <button onClick={stripHover} disabled={!hasHover} className="w-full flex items-center justify-center gap-1.5 text-[11px] py-1.5 rounded border border-[#332D22] text-[#E4DECE] hover:text-[#F1EDE2] hover:border-[#948C79] disabled:opacity-40 disabled:cursor-not-allowed mt-1" data-testid="textfx-hover-clear"><Eraser size={11} /> Remove hover from element</button>
        <p className="text-[10px] text-[#948C79]">Hover effects run on your published/previewed site. Preview them in the Preview tab.</p>
      </div>

      {/* Custom: outline color/thickness, directional shadow, 3D tilt, reflection */}
      <div className="space-y-2 pt-3 border-t border-[#332D22]">
        <div className="text-[10px] uppercase tracking-wider text-[#948C79] flex items-center gap-1.5"><SlidersHorizontal size={12} /> Custom</div>

        <div className="space-y-1.5 p-2 rounded border border-[#332D22]">
          <div className="text-[10px] text-[#A79C87]">Outline</div>
          <div className="flex items-center gap-2">
            <input type="color" value={outlineColor} onChange={(e) => setOutlineColor(e.target.value)} className="w-8 h-7 bg-transparent border border-[#332D22] rounded" data-testid="textfx-outline-color" />
            <input type="range" min={1} max={8} step={0.5} value={outlineThickness} onChange={(e) => setOutlineThickness(Number(e.target.value))} className="flex-1" data-testid="textfx-outline-thickness" />
            <span className="w-9 text-right text-[10px] font-mono text-[#E4DECE]">{outlineThickness}px</span>
            <button onClick={applyOutline} disabled={!selected} className="text-[10px] px-2 py-1 rounded bg-[#AD8B21] hover:bg-[#C9A227] text-[#F1EDE2] disabled:opacity-40 disabled:cursor-not-allowed" data-testid="textfx-outline-apply">Apply</button>
          </div>
        </div>

        <div className="space-y-1.5 p-2 rounded border border-[#332D22]">
          <div className="text-[10px] text-[#A79C87]">Directional shadow</div>
          <div className="grid grid-cols-3 gap-1.5">
            <div>
              <label className="text-[9px] text-[#948C79] block">Angle ({shadowAngle}°)</label>
              <input type="range" min={0} max={360} value={shadowAngle} onChange={(e) => setShadowAngle(Number(e.target.value))} className="w-full" data-testid="textfx-shadow-angle" />
            </div>
            <div>
              <label className="text-[9px] text-[#948C79] block">Distance ({shadowDistance})</label>
              <input type="range" min={0} max={30} value={shadowDistance} onChange={(e) => setShadowDistance(Number(e.target.value))} className="w-full" data-testid="textfx-shadow-distance" />
            </div>
            <div>
              <label className="text-[9px] text-[#948C79] block">Blur ({shadowBlur})</label>
              <input type="range" min={0} max={20} value={shadowBlur} onChange={(e) => setShadowBlur(Number(e.target.value))} className="w-full" data-testid="textfx-shadow-blur" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="color" value={shadowColor} onChange={(e) => setShadowColor(e.target.value)} className="w-8 h-7 bg-transparent border border-[#332D22] rounded" data-testid="textfx-shadow-color" />
            <button onClick={applyDirectionalShadow} disabled={!selected} className="flex-1 text-[10px] px-2 py-1 rounded bg-[#AD8B21] hover:bg-[#C9A227] text-[#F1EDE2] disabled:opacity-40 disabled:cursor-not-allowed" data-testid="textfx-shadow-apply">Apply</button>
          </div>
        </div>

        <div className="space-y-1.5 p-2 rounded border border-[#332D22]">
          <div className="text-[10px] text-[#A79C87]">3D tilt</div>
          <div className="flex items-center gap-2">
            <input type="range" min={-60} max={60} value={tiltDepth} onChange={(e) => setTiltDepth(Number(e.target.value))} className="flex-1" data-testid="textfx-tilt-depth" />
            <span className="w-9 text-right text-[10px] font-mono text-[#E4DECE]">{tiltDepth}°</span>
            <button onClick={applyTilt} disabled={!selected} className="text-[10px] px-2 py-1 rounded bg-[#AD8B21] hover:bg-[#C9A227] text-[#F1EDE2] disabled:opacity-40 disabled:cursor-not-allowed" data-testid="textfx-tilt-apply">Apply</button>
          </div>
        </div>

        <div className="space-y-1.5 p-2 rounded border border-[#332D22]">
          <div className="text-[10px] text-[#A79C87]">Reflection</div>
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label className="text-[9px] text-[#948C79] block">Distance ({reflectDistance})</label>
              <input type="range" min={0} max={20} value={reflectDistance} onChange={(e) => setReflectDistance(Number(e.target.value))} className="w-full" data-testid="textfx-reflect-distance" />
            </div>
            <div>
              <label className="text-[9px] text-[#948C79] block">Opacity ({reflectOpacity})</label>
              <input type="range" min={0} max={1} step={0.05} value={reflectOpacity} onChange={(e) => setReflectOpacity(Number(e.target.value))} className="w-full" data-testid="textfx-reflect-opacity" />
            </div>
          </div>
          <button onClick={applyReflection} disabled={!selected} className="w-full text-[10px] px-2 py-1 rounded bg-[#AD8B21] hover:bg-[#C9A227] text-[#F1EDE2] disabled:opacity-40 disabled:cursor-not-allowed" data-testid="textfx-reflect-apply">Apply</button>
        </div>
      </div>

      <div className="pt-3 border-t border-[#332D22] grid grid-cols-2 gap-2">
        <button onClick={copyFx} disabled={!selected} className="flex items-center justify-center gap-1.5 text-xs py-2 rounded bg-[#242019] hover:bg-[#332D22] border border-[#332D22] text-[#F1EDE2] disabled:opacity-40 disabled:cursor-not-allowed" data-testid="textfx-copy"><Copy size={12} /> Copy style</button>
        <button onClick={pasteFx} disabled={!selected || !clip} className="flex items-center justify-center gap-1.5 text-xs py-2 rounded bg-[#242019] hover:bg-[#332D22] border border-[#332D22] text-[#F1EDE2] disabled:opacity-40 disabled:cursor-not-allowed" data-testid="textfx-paste"><ClipboardPaste size={12} /> Paste style</button>
      </div>

      {/* Style library (persists across projects via localStorage) */}
      <div className="space-y-1.5 pt-3 border-t border-[#332D22]">
        <div className="flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-wider text-[#948C79] flex items-center gap-1.5"><Library size={12} /> Style library</div>
          <div className="flex items-center gap-1">
            <button onClick={exportLibrary} disabled={!library.length} className="p-1 rounded border border-[#332D22] text-[#A79C87] hover:text-[#F1EDE2] disabled:opacity-40 disabled:cursor-not-allowed" title="Export library as a file" data-testid="style-lib-export"><Download size={11} /></button>
            <button onClick={() => fileRef.current && fileRef.current.click()} className="p-1 rounded border border-[#332D22] text-[#A79C87] hover:text-[#F1EDE2]" title="Import a library file" data-testid="style-lib-import"><Upload size={11} /></button>
            <input ref={fileRef} type="file" accept="application/json,.json" onChange={importLibrary} className="hidden" data-testid="style-lib-import-input" />
          </div>
        </div>
        {library.length > 0 ? (
          <>
            {libCategories.length > 1 && (
              <div className="flex items-center gap-1.5">
                <Filter size={11} className="text-[#948C79] flex-none" />
                <select
                  value={libCategories.includes(libFilter) || libFilter === "all" ? libFilter : "all"}
                  onChange={(e) => setLibFilter(e.target.value)}
                  className="flex-1 bg-[#15130E] border border-[#332D22] rounded px-2 py-1 text-[10px] text-[#F1EDE2] outline-none focus:border-[#C9A227]"
                  data-testid="style-lib-filter"
                >
                  <option value="all">{`All categories · ${library.length}`}</option>
                  {libCategories.map((cat) => {
                    const count = library.filter((e) => (e.category || "Uncategorized") === cat).length;
                    return <option key={cat} value={cat}>{`${cat} · ${count}`}</option>;
                  })}
                </select>
              </div>
            )}
            <div className="space-y-2">
              {libGroups.map(({ cat, items }) => {
                const isOpen = !collapsed.has(cat);
                return (
                  <div key={cat} data-testid={`style-lib-group-${cat}`}>
                    <button
                      onClick={() => toggleCollapsed(cat)}
                      className="w-full flex items-center gap-1 text-[10px] text-[#A79C87] hover:text-[#F1EDE2] py-0.5"
                      data-testid={`style-lib-group-toggle-${cat}`}
                    >
                      {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      <Folder size={11} className="text-amber-400/70" />
                      <span className="uppercase tracking-wider">{cat}</span>
                      <span className="text-[#6B6353]">· {items.length}</span>
                    </button>
                    {isOpen && (
                      <div className="grid grid-cols-3 gap-1.5 mt-1">
                        {items.map((entry) => (
                          <div key={entry.id} role="button" tabIndex={0} onClick={() => applyLibrary(entry)} data-testid={`style-lib-${entry.id}`} className="relative rounded border border-[#332D22] hover:border-[#C9A227] overflow-hidden group cursor-pointer" title={`Apply ${entry.name}`}>
                            <div className="h-10 flex items-center justify-center" style={{ background: "linear-gradient(135deg,#eef2ff,#dbe2ef)" }}>
                              <div dangerouslySetInnerHTML={{ __html: `<div style="width:60%;height:56%;${libPreview(entry.style)}"></div>` }} />
                            </div>
                            <div className="text-[9px] text-[#A79C87] py-0.5 bg-[#1C1A15] group-hover:text-[#F1EDE2] truncate px-1 text-center">{entry.name}</div>
                            <button onClick={(e) => { e.stopPropagation(); deleteLibrary(entry.id); }} className="absolute top-0.5 right-0.5 w-4 h-4 flex items-center justify-center rounded bg-black/60 text-[#E4DECE] hover:text-red-400 opacity-70 hover:opacity-100" title="Delete" data-testid={`style-lib-delete-${entry.id}`}><X size={10} /></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <p className="text-[10px] text-[#948C79]">Copy a style, then save it here to reuse it across your projects.</p>
        )}
        <div className="space-y-1.5">
          <input value={libName} onChange={(e) => setLibName(e.target.value)} placeholder="Name this style…" className="w-full bg-[#15130E] border border-[#332D22] rounded px-2 py-1 text-[11px] text-[#F1EDE2] outline-none focus:border-[#C9A227]" data-testid="style-lib-name" />
          <div className="flex gap-1.5">
            <input value={libCategory} onChange={(e) => setLibCategory(e.target.value)} placeholder="Folder / category (optional)…" list="wd-lib-cats" className="flex-1 bg-[#15130E] border border-[#332D22] rounded px-2 py-1 text-[11px] text-[#F1EDE2] outline-none focus:border-[#C9A227]" data-testid="style-lib-category" />
            <datalist id="wd-lib-cats">{libCategories.map((c) => <option key={c} value={c} />)}</datalist>
            <button onClick={saveToLibrary} disabled={!clip} className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded bg-[#242019] hover:bg-[#332D22] border border-[#332D22] text-[#F1EDE2] disabled:opacity-40 disabled:cursor-not-allowed" data-testid="style-lib-save"><Save size={11} /> Save</button>
          </div>
        </div>
      </div>

      <button onClick={clearFx} disabled={!selected} className="w-full flex items-center justify-center gap-1.5 text-xs py-2 rounded bg-[#242019] hover:bg-[#332D22] border border-[#332D22] text-[#E4DECE] disabled:opacity-40 disabled:cursor-not-allowed" data-testid="textfx-clear"><Eraser size={12} /> Clear text FX</button>
    </div>
  );
};
