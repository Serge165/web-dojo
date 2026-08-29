import React, { useRef, useState } from "react";
import { Music, Upload } from "lucide-react";
import { toast } from "sonner";
import { escAttr, escText, escJsAttr } from "@/lib/escapeHtml";

const SIZE_OPTIONS = [
  { label: "cover", value: "cover" },
  { label: "contain", value: "contain" },
  { label: "100% 100%", value: "100% 100%" },
  { label: "auto", value: "auto" },
];

const POS_OPTIONS = ["center", "top", "bottom", "left", "right", "top left", "top right", "bottom left", "bottom right"];

const CORNERS = {
  "bottom-right": "bottom:18px;right:18px;",
  "bottom-left": "bottom:18px;left:18px;",
  "top-right": "top:18px;right:18px;",
  "top-left": "top:18px;left:18px;",
};

const MIDI_CDN = "https://cdn.jsdelivr.net/combine/npm/tone@14.7.58,npm/@magenta/music@1.23.1/es6/core.js,npm/focus-visible@5,npm/html-midi-player@1.5.0";

// Builds a self-contained background-music widget. Scripts execute in the live
// preview iframe and the exported static file (not in the design canvas).
const buildMusicHtml = ({ type, url, label, accent, corner, autoplay, loop }) => {
  const pos = CORNERS[corner] || CORNERS["bottom-right"];
  if (type === "midi") {
    return `<div data-webdojo-music="midi" style="position:fixed;${pos}z-index:99999;background:#0f0f16;padding:10px 12px;border-radius:14px;box-shadow:0 10px 30px rgba(0,0,0,.35);font-family:system-ui,-apple-system,sans-serif;">
  <script src="${MIDI_CDN}"></script>
  <midi-player src="${escAttr(url)}" sound-font ${loop ? "loop " : ""}style="width:260px;display:block;"></midi-player>
</div>`;
  }
  const aid = "wdm" + Math.random().toString(36).slice(2, 7);
  return `<div data-webdojo-music="audio" style="position:fixed;${pos}z-index:99999;font-family:system-ui,-apple-system,sans-serif;">
  <audio id="${aid}" src="${escAttr(url)}" ${loop ? "loop " : ""}${autoplay ? "autoplay " : ""}preload="auto"></audio>
  <button type="button" onclick="var a=document.getElementById('${aid}');var s=this.querySelector('span');if(a.paused){a.play();s.textContent='Pause';}else{a.pause();s.textContent=${escJsAttr(label)};}" style="display:inline-flex;align-items:center;gap:8px;padding:11px 18px;border:none;border-radius:999px;background:${escAttr(accent)};color:#fff;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 10px 30px rgba(0,0,0,.3);">
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg><span>${escText(label)}</span>
  </button>
</div>`;
};

export const BackgroundMediaPanel = ({ selected, onPatch, onReplaceHtml, onAddBlock }) => {
  const [imgUrl, setImgUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [size, setSize] = useState("cover");
  const [position, setPosition] = useState("center");
  const [repeat, setRepeat] = useState("no-repeat");

  // Phase 6 Task 6: solid fill + gradient backgrounds (element level).
  const [fillColor, setFillColor] = useState("#ffffff");
  const [gradientType, setGradientType] = useState("linear");
  const [gradFrom, setGradFrom] = useState("#5b7fdb");
  const [gradTo, setGradTo] = useState("#8b7fdb");
  const [gradAngle, setGradAngle] = useState(180);

  // Background music (page-level)
  const [musicType, setMusicType] = useState("mp3");
  const [musicUrl, setMusicUrl] = useState("");
  const [musicLabel, setMusicLabel] = useState("Play music");
  const [musicAccent, setMusicAccent] = useState("#4f46e5");
  const [musicCorner, setMusicCorner] = useState("bottom-right");
  const [musicLoop, setMusicLoop] = useState(true);
  const [musicAutoplay, setMusicAutoplay] = useState(false);

  const applyImage = () => {
    if (!imgUrl.trim() || !selected) return;
    onPatch({
      "background-image": `url('${imgUrl.trim()}')`,
      "background-size": size,
      "background-position": position,
      "background-repeat": repeat,
    });
  };
  const clearBg = () => selected && onPatch({ "background-image": "none", background: "transparent" });
  // Phase 6 Task 6: upload a local image as the background — same style
  // patch as applyImage, but the source is a self-contained data URL so it
  // survives export without any external hosting.
  const imgFileRef = useRef(null);
  const handleImgFile = (e) => {
    const f = e.target.files?.[0];
    if (!f || !selected) return;
    const reader = new FileReader();
    reader.onload = () => {
      onPatch({
        "background-image": `url('${String(reader.result)}')`,
        "background-size": size,
        "background-position": position,
        "background-repeat": repeat,
      });
      toast.success("Background image applied");
    };
    reader.readAsDataURL(f);
    e.target.value = "";
  };
  // Phase 6 Task 6: fill/gradient go through the same style patch as the
  // image background, so the canvas updates live AND the export hoists the
  // declarations into per-block class rules (stripInlineStyles).
  const applyFill = () => { if (selected) onPatch({ "background-image": "none", background: fillColor }); };
  const applyGradient = () => {
    if (!selected) return;
    const gradient = gradientType === "linear"
      ? `linear-gradient(${gradAngle}deg, ${gradFrom}, ${gradTo})`
      : `radial-gradient(circle, ${gradFrom}, ${gradTo})`;
    onPatch({ background: gradient });
  };
  const applyVideo = () => {
    if (!videoUrl.trim() || !selected) return;
    const inner = selected.html;
    const wrapped = `<div data-forge-video-bg style="position:relative;overflow:hidden;">
  <video autoplay muted loop playsinline style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;">
    <source src="${escAttr(videoUrl.trim())}" />
  </video>
  <div style="position:relative;z-index:1;">${inner}</div>
</div>`;
    onReplaceHtml(wrapped);
  };

  const addMusic = () => {
    if (!musicUrl.trim()) { toast.error("Paste a link to your audio file first"); return; }
    if (!onAddBlock) return;
    onAddBlock(buildMusicHtml({
      type: musicType, url: musicUrl.trim(), label: musicLabel || "Play music",
      accent: musicAccent, corner: musicCorner, autoplay: musicAutoplay, loop: musicLoop,
    }));
    toast.success("Background music added to this page");
  };

  const inputCls = "w-full bg-[#15130E] border border-[#332D22] rounded px-2 py-1.5 text-xs font-mono text-[#F1EDE2] outline-none focus:border-[#C9A227]";
  const selCls = "bg-[#15130E] border border-[#332D22] rounded px-1.5 py-1 text-[11px] text-[#F1EDE2] outline-none focus:border-[#C9A227]";

  return (
    <div className="space-y-4" data-testid="bg-media-panel">
      {/* Background music — page level */}
      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-[#948C79] flex items-center gap-1.5"><Music size={12} /> Background music</div>
        <div className="grid grid-cols-2 gap-1.5">
          <button onClick={() => setMusicType("mp3")} className={`py-1.5 rounded text-[11px] border ${musicType === "mp3" ? "bg-indigo-600 border-indigo-500 text-[#F1EDE2]" : "border-[#332D22] text-[#A79C87] hover:text-[#F1EDE2]"}`} data-testid="music-type-mp3">MP3 / audio</button>
          <button onClick={() => setMusicType("midi")} className={`py-1.5 rounded text-[11px] border ${musicType === "midi" ? "bg-indigo-600 border-indigo-500 text-[#F1EDE2]" : "border-[#332D22] text-[#A79C87] hover:text-[#F1EDE2]"}`} data-testid="music-type-midi">MIDI</button>
        </div>
        <input value={musicUrl} onChange={(e) => setMusicUrl(e.target.value)} placeholder={musicType === "midi" ? "https://…/song.mid" : "https://…/track.mp3"} className={inputCls} data-testid="music-url" />
        <div className="grid grid-cols-2 gap-1.5">
          <select value={musicCorner} onChange={(e) => setMusicCorner(e.target.value)} className={selCls} data-testid="music-corner">
            {Object.keys(CORNERS).map((c) => <option key={c} value={c}>{c.replace("-", " ")}</option>)}
          </select>
          {musicType === "mp3" ? (
            <div className="flex items-center gap-1.5">
              <input type="color" value={musicAccent} onChange={(e) => setMusicAccent(e.target.value)} className="w-8 h-7 rounded bg-transparent border border-[#332D22]" data-testid="music-accent" title="Button colour" />
              <input value={musicLabel} onChange={(e) => setMusicLabel(e.target.value)} className="flex-1 bg-[#15130E] border border-[#332D22] rounded px-2 py-1 text-[11px] text-[#F1EDE2] outline-none focus:border-[#C9A227]" data-testid="music-label" placeholder="Button text" />
            </div>
          ) : (
            <div className="text-[10px] text-[#948C79] flex items-center">Player has its own controls</div>
          )}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[#E4DECE]">
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={musicLoop} onChange={(e) => setMusicLoop(e.target.checked)} data-testid="music-loop" /> Loop</label>
          {musicType === "mp3" && (
            <label className="flex items-center gap-1.5"><input type="checkbox" checked={musicAutoplay} onChange={(e) => setMusicAutoplay(e.target.checked)} data-testid="music-autoplay" /> Autoplay</label>
          )}
        </div>
        <button onClick={addMusic} className="w-full text-xs py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-[#F1EDE2]" data-testid="add-music-btn">Add to page</button>
        <p className="text-[10px] text-[#948C79] leading-relaxed">Adds a floating player fixed to the page corner. {musicType === "mp3" ? "Most browsers block silent autoplay, so the play button is the reliable option." : "MIDI plays via a small web player loaded from a CDN — host the .mid file somewhere that allows cross-origin (CORS) access, e.g. your own domain or a public CDN."}</p>
      </div>

      {/* Background fill — element level (Phase 6 Task 6) */}
      <div className="pt-3 border-t border-[#332D22] space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-[#948C79]">Fill</div>
        {!selected && <div className="text-[11px] text-[#948C79]">Select an element to set a solid fill.</div>}
        <div className="flex items-center gap-2">
          <input type="color" value={fillColor} onChange={(e) => setFillColor(e.target.value)} disabled={!selected} className="w-8 h-7 rounded bg-transparent border border-[#332D22] disabled:opacity-40" data-testid="bg-fill-color" title="Fill colour" />
          <button onClick={applyFill} disabled={!selected} className="text-xs py-1.5 rounded bg-[#AD8B21] hover:bg-[#C9A227] text-[#F1EDE2] disabled:opacity-40" data-testid="apply-bg-fill">Apply fill</button>
          <button onClick={() => selected && onPatch({ background: "transparent" })} disabled={!selected} className="text-xs py-1.5 rounded bg-[#242019] hover:bg-[#332D22] text-[#F1EDE2] border border-[#332D22] disabled:opacity-40" data-testid="clear-bg-fill">Clear</button>
        </div>
      </div>

      {/* Background gradient — element level (Phase 6 Task 6) */}
      <div className="pt-3 border-t border-[#332D22] space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-[#948C79]">Gradient</div>
        {!selected && <div className="text-[11px] text-[#948C79]">Select an element to set a gradient.</div>}
        <div className="grid grid-cols-2 gap-1.5">
          <select value={gradientType} onChange={(e) => setGradientType(e.target.value)} disabled={!selected} className={selCls} data-testid="bg-gradient-type">
            <option value="linear">Linear</option>
            <option value="radial">Radial</option>
          </select>
          {gradientType === "linear" ? (
            <div className="flex items-center gap-1.5">
              <input type="range" min="0" max="360" value={gradAngle} onChange={(e) => setGradAngle(Number(e.target.value))} disabled={!selected} className="flex-1 accent-[#C9A227]" data-testid="bg-gradient-angle" title={`Angle: ${gradAngle}°`} />
              <span className="text-[10px] text-[#948C79] w-8 text-right">{gradAngle}°</span>
            </div>
          ) : (
            <div className="text-[10px] text-[#948C79] flex items-center">Radial: centre outward</div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input type="color" value={gradFrom} onChange={(e) => setGradFrom(e.target.value)} disabled={!selected} className="w-8 h-7 rounded bg-transparent border border-[#332D22] disabled:opacity-40" data-testid="bg-gradient-from" title="From colour" />
          <span className="text-[10px] text-[#948C79]">→</span>
          <input type="color" value={gradTo} onChange={(e) => setGradTo(e.target.value)} disabled={!selected} className="w-8 h-7 rounded bg-transparent border border-[#332D22] disabled:opacity-40" data-testid="bg-gradient-to" title="To colour" />
          <button onClick={applyGradient} disabled={!selected} className="ml-auto text-xs py-1.5 px-2 rounded bg-[#AD8B21] hover:bg-[#C9A227] text-[#F1EDE2] disabled:opacity-40" data-testid="apply-bg-gradient">Apply</button>
        </div>
      </div>

      {/* Background image — element level */}
      <div className="pt-3 border-t border-[#332D22] space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-[#948C79]">Background image</div>
        {!selected && <div className="text-[11px] text-[#948C79]">Select an element to apply an image or video background.</div>}
        <input value={imgUrl} onChange={(e) => setImgUrl(e.target.value)} placeholder="https://…/photo.jpg" className={inputCls} data-testid="bg-image-url" disabled={!selected} />
        <div className="grid grid-cols-3 gap-1.5">
          <select value={size} onChange={(e) => setSize(e.target.value)} className={selCls} data-testid="bg-image-size">
            {SIZE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={position} onChange={(e) => setPosition(e.target.value)} className={selCls} data-testid="bg-image-position">
            {POS_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={repeat} onChange={(e) => setRepeat(e.target.value)} className={selCls} data-testid="bg-image-repeat">
            {["no-repeat", "repeat", "repeat-x", "repeat-y"].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button onClick={applyImage} disabled={!selected} className="text-xs py-1.5 rounded bg-[#AD8B21] hover:bg-[#C9A227] text-[#F1EDE2] disabled:opacity-40" data-testid="apply-bg-image">Apply image</button>
          <button onClick={() => imgFileRef.current?.click()} disabled={!selected} className="text-xs py-1.5 rounded bg-[#242019] hover:bg-[#332D22] text-[#F1EDE2] border border-[#332D22] disabled:opacity-40 flex items-center justify-center gap-1" data-testid="upload-bg-image" title="Upload a local image (embedded as a data URL)">
            <Upload size={11} /> Upload…
          </button>
          <button onClick={clearBg} disabled={!selected} className="text-xs py-1.5 rounded bg-[#242019] hover:bg-[#332D22] text-[#F1EDE2] border border-[#332D22] disabled:opacity-40" data-testid="clear-bg">Clear</button>
        </div>
        <input ref={imgFileRef} type="file" accept="image/*" onChange={handleImgFile} className="hidden" data-testid="bg-image-file-input" />
      </div>

      {/* Background video — element level */}
      <div className="pt-3 border-t border-[#332D22] space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-[#948C79]">Background video</div>
        <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://…/loop.mp4" className={inputCls} data-testid="bg-video-url" disabled={!selected} />
        <p className="text-[10px] text-[#948C79]">Wraps the selected element so the video plays behind its content.</p>
        <button onClick={applyVideo} disabled={!selected} className="w-full text-xs py-1.5 rounded bg-[#AD8B21] hover:bg-[#C9A227] text-[#F1EDE2] disabled:opacity-40" data-testid="apply-bg-video">Wrap with looping video</button>
      </div>
    </div>
  );
};
