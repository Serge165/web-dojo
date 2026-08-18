import React, { useMemo, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Search, X, FilePlus, Plus, Sparkles } from "lucide-react";
import { PAGE_LAYOUTS, CATEGORY_ORDER, CATEGORY_META } from "@/lib/pageLayouts";
import { buildStandaloneHtml } from "@/lib/exportHtml";

// WordPress-style picker: pick a ready-made, editable page layout (or blank).
export const AddPageModal = ({ open, onClose, onAddBlank, onAddLayout }) => {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [selectedId, setSelectedId] = useState(PAGE_LAYOUTS[0].id);

  useEffect(() => { if (open) { setQ(""); setCat("all"); setSelectedId(PAGE_LAYOUTS[0].id); } }, [open]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return PAGE_LAYOUTS.filter((l) => {
      if (cat !== "all" && l.category !== cat) return false;
      if (!query) return true;
      return (`${l.label} ${l.category} ${l.description}`).toLowerCase().includes(query);
    });
  }, [q, cat]);

  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach((l) => { (map[l.category] = map[l.category] || []).push(l); });
    return CATEGORY_ORDER.filter((c) => map[c]).map((c) => ({ category: c, items: map[c] }));
  }, [filtered]);

  const selected = PAGE_LAYOUTS.find((l) => l.id === selectedId) || filtered[0] || PAGE_LAYOUTS[0];

  const previewHtml = useMemo(() => selected ? buildStandaloneHtml({
    name: selected.label,
    elements: selected.blocks.map((html) => ({ html })),
    canvas_bg: selected.canvasBg,
    fonts: selected.fonts,
    head_html: "",
  }) : "", [selected]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#141414] border border-[#2B2B2B] text-white max-w-6xl w-[94vw] max-h-[92vh] overflow-hidden p-0" data-testid="add-page-modal">
        <DialogHeader className="px-5 pt-4 pb-3 border-b border-[#2B2B2B]">
          <DialogTitle className="flex items-center gap-2 text-base"><Sparkles size={16} className="text-indigo-400" /> Add a page</DialogTitle>
          <DialogDescription className="sr-only">Choose a ready-made, editable page layout or start from a blank page.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-[320px_1fr] max-h-[calc(92vh-58px)]">
          {/* Left: browser */}
          <div className="border-r border-[#2B2B2B] flex flex-col overflow-hidden">
            <div className="p-3 space-y-2 border-b border-[#2B2B2B]">
              <div className="relative">
                <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search layouts…" className="w-full bg-[#0D0D0D] border border-[#2B2B2B] rounded pl-6 pr-6 py-1.5 text-xs text-white outline-none focus:border-indigo-500" data-testid="add-page-search" />
                {q && <button onClick={() => setQ("")} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"><X size={12} /></button>}
              </div>
              <div className="flex flex-wrap gap-1">
                {["all", ...CATEGORY_ORDER].map((c) => (
                  <button key={c} onClick={() => setCat(c)} className={`px-2 py-0.5 rounded-full text-[10px] border ${cat === c ? "bg-indigo-600 border-indigo-500 text-white" : "border-[#2B2B2B] text-gray-400 hover:text-gray-200"}`} data-testid={`add-page-cat-${c}`}>{c === "all" ? "All" : c}</button>
                ))}
              </div>
            </div>

            <button onClick={() => { onAddBlank(); onClose(); }} className="mx-3 mt-3 flex items-center gap-2 px-3 py-2.5 rounded-lg border border-dashed border-[#3a3a3a] text-gray-300 hover:border-indigo-500 hover:text-white text-xs" data-testid="add-blank-page">
              <FilePlus size={14} /> Start with a blank page
            </button>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {grouped.map((grp) => (
                <div key={grp.category}>
                  <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1.5 flex items-center gap-1.5">
                    <span style={{ background: CATEGORY_META[grp.category]?.color || "#6366f1", width: 6, height: 6, borderRadius: 999 }} />
                    {grp.category} <span className="text-gray-600">· {grp.items.length}</span>
                  </div>
                  <div className="space-y-1">
                    {grp.items.map((l) => (
                      <button key={l.id} onClick={() => setSelectedId(l.id)} className={`w-full text-left px-2.5 py-2 rounded-md text-xs border ${selectedId === l.id ? "bg-indigo-600/20 border-indigo-500/60 text-white" : "bg-[#1A1A1A] border-[#242424] text-gray-300 hover:border-indigo-500/40"}`} data-testid={`add-page-item-${l.id}`}>
                        <div className="font-medium truncate">{l.label}</div>
                        <div className="text-[10px] text-gray-500 truncate">{l.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {grouped.length === 0 && <div className="text-[11px] text-gray-500 text-center p-4">No layouts match "{q}"</div>}
            </div>
          </div>

          {/* Right: live preview */}
          <div className="flex flex-col overflow-hidden bg-[#0D0D0D]">
            <div className="px-4 py-2.5 border-b border-[#2B2B2B] flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-white">{selected?.label}</div>
                <div className="text-[11px] text-gray-500">{selected?.description}</div>
              </div>
              <button onClick={() => { onAddLayout(selected); onClose(); }} className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-medium" data-testid="add-page-confirm">
                <Plus size={13} /> Add this page
              </button>
            </div>
            <div className="flex-1 overflow-hidden bg-[#1a1a1a] p-3">
              <iframe
                key={selected?.id}
                title="layout-preview"
                srcDoc={previewHtml}
                className="w-full h-full bg-white rounded-md border border-[#2B2B2B]"
                sandbox="allow-scripts allow-forms"
                data-testid="add-page-preview-iframe"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
