import React, { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Share2, Sun, Moon } from "lucide-react";
import { PLATFORMS, SHAPES, STYLES, HOVERS, buildSocialHtml } from "@/lib/social";

const labelCls = "text-[10px] uppercase tracking-wider text-gray-500 block mb-1";
const inputCls = "w-full bg-[#0D0D0D] border border-[#2B2B2B] rounded px-2 py-1.5 text-xs text-white outline-none focus:border-indigo-500";
const DEFAULT_SHARE = ["x", "facebook", "linkedin", "whatsapp", "email"];
const DEFAULT_FOLLOW = ["instagram", "x", "youtube", "tiktok", "linkedin"];

export const SocialShareModal = ({ open, onClose, onInsert }) => {
  const [mode, setMode] = useState("share");
  const [ids, setIds] = useState(DEFAULT_SHARE);
  const [urls, setUrls] = useState({});
  const [shape, setShape] = useState("circle");
  const [size, setSize] = useState(46);
  const [style, setStyle] = useState("brand");
  const [monoColor, setMonoColor] = useState("#0f172a");
  const [monoBg, setMonoBg] = useState("#f1f5f9");
  const [gap, setGap] = useState(12);
  const [layout, setLayout] = useState("row");
  const [align, setAlign] = useState("center");
  const [labels, setLabels] = useState(false);
  const [hover, setHover] = useState("lift");
  const [shareUrl, setShareUrl] = useState("");
  const [shareTitle, setShareTitle] = useState("");
  const [previewDark, setPreviewDark] = useState(false);

  useEffect(() => {
    if (open) { setMode("share"); setIds(DEFAULT_SHARE); }
  }, [open]);

  const available = useMemo(() => mode === "share" ? PLATFORMS.filter((p) => p.share) : PLATFORMS, [mode]);

  const switchMode = (m) => { setMode(m); setIds(m === "share" ? DEFAULT_SHARE : DEFAULT_FOLLOW); };
  const toggle = (pid) => setIds((s) => s.includes(pid) ? s.filter((x) => x !== pid) : [...s, pid]);

  const html = useMemo(() => buildSocialHtml({
    mode, items: ids.map((id) => ({ id, url: urls[id] })), shape, size: Number(size), style,
    monoColor, monoBg, gap: Number(gap), layout, align, labels, hover, shareUrl, shareTitle,
  }), [mode, ids, urls, shape, size, style, monoColor, monoBg, gap, layout, align, labels, hover, shareUrl, shareTitle]);

  const insert = () => {
    if (!ids.length) { toast.error("Pick at least one platform"); return; }
    onInsert(html);
    toast.success("Social buttons inserted onto canvas");
    onClose();
  };

  const bg = previewDark ? "#0b1220" : "#ffffff";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#141414] border border-[#2B2B2B] text-white max-w-5xl w-[94vw] max-h-[92vh] overflow-hidden p-0" data-testid="social-builder-modal">
        <DialogHeader className="px-5 pt-4 pb-3 border-b border-[#2B2B2B]">
          <DialogTitle className="flex items-center gap-2 text-base"><Share2 size={16} className="text-sky-400" /> Social buttons</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-[340px_1fr] max-h-[calc(92vh-58px)]">
          {/* Controls */}
          <div className="border-r border-[#2B2B2B] overflow-y-auto p-4 space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => switchMode("share")} className={`py-2 rounded text-xs font-medium border ${mode === "share" ? "bg-sky-600 border-sky-500 text-white" : "border-[#2B2B2B] text-gray-300"}`} data-testid="social-mode-share">Share this page</button>
              <button onClick={() => switchMode("follow")} className={`py-2 rounded text-xs font-medium border ${mode === "follow" ? "bg-sky-600 border-sky-500 text-white" : "border-[#2B2B2B] text-gray-300"}`} data-testid="social-mode-follow">Link to profiles</button>
            </div>

            <div>
              <label className={labelCls}>Platforms · {ids.length}</label>
              <div className="grid grid-cols-2 gap-1.5">
                {available.map((p) => (
                  <button key={p.id} onClick={() => toggle(p.id)} className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-[11px] border ${ids.includes(p.id) ? "bg-[#1F1F1F] border-sky-500/60 text-white" : "border-[#2B2B2B] text-gray-400 hover:text-gray-200"}`} data-testid={`social-plat-${p.id}`}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: p.color, flex: "none" }} />
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {mode === "follow" && (
              <div className="space-y-1.5" data-testid="social-follow-urls">
                <label className={labelCls}>Profile links</label>
                {ids.map((id) => {
                  const p = PLATFORMS.find((x) => x.id === id);
                  return (
                    <div key={id} className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-400 w-16 truncate">{p?.name}</span>
                      <input value={urls[id] || ""} onChange={(e) => setUrls((u) => ({ ...u, [id]: e.target.value }))} placeholder={p?.placeholder} className={inputCls + " flex-1 font-mono"} data-testid={`social-url-${id}`} />
                    </div>
                  );
                })}
              </div>
            )}

            {mode === "share" && (
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <label className={labelCls}>Share URL <span className="text-gray-600 normal-case">(blank = current page)</span></label>
                  <input value={shareUrl} onChange={(e) => setShareUrl(e.target.value)} placeholder="https://mysite.com/page" className={inputCls + " font-mono"} data-testid="social-share-url" />
                </div>
                <div>
                  <label className={labelCls}>Share text</label>
                  <input value={shareTitle} onChange={(e) => setShareTitle(e.target.value)} placeholder="Check this out!" className={inputCls} data-testid="social-share-title" />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#2B2B2B]">
              <div>
                <label className={labelCls}>Shape</label>
                <select value={shape} onChange={(e) => setShape(e.target.value)} className={inputCls} data-testid="social-shape">{SHAPES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
              </div>
              <div>
                <label className={labelCls}>Style</label>
                <select value={style} onChange={(e) => setStyle(e.target.value)} className={inputCls} data-testid="social-style">{STYLES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
              </div>
              <div>
                <label className={labelCls}>Hover animation</label>
                <select value={hover} onChange={(e) => setHover(e.target.value)} className={inputCls} data-testid="social-hover">{HOVERS.map((s) => <option key={s} value={s}>{s}</option>)}</select>
              </div>
              <div>
                <label className={labelCls}>Layout</label>
                <select value={layout} onChange={(e) => setLayout(e.target.value)} className={inputCls} data-testid="social-layout"><option value="row">row</option><option value="column">column</option></select>
              </div>
              <div>
                <label className={labelCls}>Align</label>
                <select value={align} onChange={(e) => setAlign(e.target.value)} className={inputCls} data-testid="social-align"><option value="left">left</option><option value="center">center</option><option value="right">right</option></select>
              </div>
              <div>
                <label className={labelCls}>Size · {size}px</label>
                <input type="range" min="34" max="72" value={size} onChange={(e) => setSize(e.target.value)} className="w-full" data-testid="social-size" />
              </div>
              <div>
                <label className={labelCls}>Gap · {gap}px</label>
                <input type="range" min="0" max="28" value={gap} onChange={(e) => setGap(e.target.value)} className="w-full" data-testid="social-gap" />
              </div>
              <label className="flex items-center gap-2 text-xs text-gray-300 self-end pb-1">
                <input type="checkbox" checked={labels} onChange={(e) => setLabels(e.target.checked)} data-testid="social-labels" /> Show labels
              </label>
              {style === "mono" && (
                <>
                  <div>
                    <label className={labelCls}>Icon color</label>
                    <input type="color" value={monoColor} onChange={(e) => setMonoColor(e.target.value)} className="w-full h-8 rounded bg-transparent border border-[#2B2B2B]" data-testid="social-mono-color" />
                  </div>
                  <div>
                    <label className={labelCls}>Button bg</label>
                    <input type="color" value={monoBg} onChange={(e) => setMonoBg(e.target.value)} className="w-full h-8 rounded bg-transparent border border-[#2B2B2B]" data-testid="social-mono-bg" />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Preview */}
          <div className="flex flex-col overflow-hidden">
            <div className="px-4 py-2 border-b border-[#2B2B2B] bg-[#141414] flex justify-between items-center">
              <div className="text-[11px] uppercase tracking-widest text-gray-400">Live preview</div>
              <div className="flex items-center gap-2">
                <button onClick={() => setPreviewDark((v) => !v)} className="text-gray-400 hover:text-white p-1" title="Toggle preview background" data-testid="social-preview-bg">{previewDark ? <Sun size={14} /> : <Moon size={14} />}</button>
                <button onClick={insert} className="text-xs px-3 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-medium" data-testid="social-insert">Insert onto canvas</button>
              </div>
            </div>
            <iframe
              title="social-preview"
              key={previewDark ? "d" : "l"}
              srcDoc={`<!doctype html><html><head><meta charset="utf-8" /><style>body{margin:0;padding:48px 24px;background:${bg};display:flex;align-items:center;justify-content:center;min-height:calc(100vh - 96px);}</style></head><body>${html}</body></html>`}
              className="flex-1 w-full border-0"
              sandbox="allow-scripts allow-same-origin"
              data-testid="social-preview-iframe"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
