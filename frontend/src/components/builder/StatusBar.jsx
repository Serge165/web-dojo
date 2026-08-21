import React from "react";
import { Loader2, Check, AlertCircle } from "lucide-react";

// Thin footer strip — always-visible at-a-glance state, complements
// TopBar's save indicator rather than replacing it (that one's tied to
// the Save button; this one's just ambient status).
export const StatusBar = ({ pageName, elementCount, mode, viewport, zoom, saveStatus }) => (
  <footer className="h-6 flex-none border-t border-[#2B2B2B] bg-[#141414] flex items-center justify-between px-3 text-[10px] text-gray-500 font-mono" data-testid="status-bar">
    <div className="flex items-center gap-3">
      <span data-testid="status-page-name">{pageName}</span>
      <span>{elementCount} block{elementCount === 1 ? "" : "s"}</span>
      <span className="uppercase">{mode}</span>
      <span className="uppercase">{viewport}</span>
    </div>
    <div className="flex items-center gap-3">
      <span data-testid="status-zoom">{zoom}%</span>
      {saveStatus === "saving" && <span className="flex items-center gap-1" data-testid="status-saving"><Loader2 size={10} className="animate-spin" /> Saving…</span>}
      {saveStatus === "saved" && <span className="flex items-center gap-1 text-emerald-500/80" data-testid="status-saved"><Check size={10} /> Saved</span>}
      {saveStatus === "unsaved" && <span data-testid="status-unsaved">Unsaved changes</span>}
      {saveStatus === "error" && <span className="flex items-center gap-1 text-red-400" data-testid="status-error"><AlertCircle size={10} /> Save failed</span>}
    </div>
  </footer>
);
