import React, { useState } from "react";

const SIZE_OPTIONS = [
  { label: "cover", value: "cover" },
  { label: "contain", value: "contain" },
  { label: "100% 100%", value: "100% 100%" },
  { label: "auto", value: "auto" },
];

const POS_OPTIONS = ["center", "top", "bottom", "left", "right", "top left", "top right", "bottom left", "bottom right"];

export const BackgroundMediaPanel = ({ selected, onPatch, onReplaceHtml }) => {
  const [imgUrl, setImgUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [size, setSize] = useState("cover");
  const [position, setPosition] = useState("center");
  const [repeat, setRepeat] = useState("no-repeat");

  if (!selected) {
    return <div className="text-[11px] text-gray-500">Select an element on the canvas to apply background media.</div>;
  }

  const applyImage = () => {
    if (!imgUrl.trim()) return;
    onPatch({
      "background-image": `url('${imgUrl.trim()}')`,
      "background-size": size,
      "background-position": position,
      "background-repeat": repeat,
    });
  };

  const clearBg = () => onPatch({
    "background-image": "none",
    background: "transparent",
  });

  const applyVideo = () => {
    if (!videoUrl.trim()) return;
    // Wrap the current element's HTML with a positioned container that keeps a
    // full-cover looping video behind the original content.
    const inner = selected.html;
    const wrapped = `<div data-forge-video-bg style="position:relative;overflow:hidden;">
  <video autoplay muted loop playsinline style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;">
    <source src="${videoUrl.trim()}" />
  </video>
  <div style="position:relative;z-index:1;">${inner}</div>
</div>`;
    onReplaceHtml(wrapped);
  };

  return (
    <div className="space-y-4" data-testid="bg-media-panel">
      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-gray-500">Background image</div>
        <input
          value={imgUrl}
          onChange={(e) => setImgUrl(e.target.value)}
          placeholder="https://…/photo.jpg"
          className="w-full bg-[#0D0D0D] border border-[#2B2B2B] rounded px-2 py-1.5 text-xs font-mono text-white outline-none focus:border-blue-500"
          data-testid="bg-image-url"
        />
        <div className="grid grid-cols-3 gap-1.5">
          <select value={size} onChange={(e) => setSize(e.target.value)} className="bg-[#0D0D0D] border border-[#2B2B2B] rounded px-1.5 py-1 text-[11px] text-white outline-none focus:border-blue-500" data-testid="bg-image-size">
            {SIZE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={position} onChange={(e) => setPosition(e.target.value)} className="bg-[#0D0D0D] border border-[#2B2B2B] rounded px-1.5 py-1 text-[11px] text-white outline-none focus:border-blue-500" data-testid="bg-image-position">
            {POS_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={repeat} onChange={(e) => setRepeat(e.target.value)} className="bg-[#0D0D0D] border border-[#2B2B2B] rounded px-1.5 py-1 text-[11px] text-white outline-none focus:border-blue-500" data-testid="bg-image-repeat">
            {["no-repeat", "repeat", "repeat-x", "repeat-y"].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={applyImage} className="text-xs py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white" data-testid="apply-bg-image">Apply image</button>
          <button onClick={clearBg} className="text-xs py-1.5 rounded bg-[#1F1F1F] hover:bg-[#2B2B2B] text-gray-200 border border-[#2B2B2B]" data-testid="clear-bg">Clear</button>
        </div>
      </div>

      <div className="pt-3 border-t border-[#2B2B2B] space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-gray-500">Background video</div>
        <input
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="https://…/loop.mp4"
          className="w-full bg-[#0D0D0D] border border-[#2B2B2B] rounded px-2 py-1.5 text-xs font-mono text-white outline-none focus:border-blue-500"
          data-testid="bg-video-url"
        />
        <p className="text-[10px] text-gray-500">Wraps the selected element so the video plays behind its content.</p>
        <button onClick={applyVideo} className="w-full text-xs py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white" data-testid="apply-bg-video">Wrap with looping video</button>
      </div>
    </div>
  );
};
