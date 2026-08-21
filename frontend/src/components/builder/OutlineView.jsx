import React, { useRef, useState } from "react";
import { Plus, Trash2, Upload, Download, Sparkles, GripVertical, X } from "lucide-react";
import { toast } from "sonner";
import { parseOutlineMarkdown, exportOutlineJson, importOutlineJson } from "@/lib/outline";

const uid = () => "slide_" + Math.random().toString(36).slice(2, 10);

// PowerPoint-like outline editor: a reorderable list of {title, body}
// slides that generate real pages via onGenerate. Ephemeral — not part of
// the saved project; Export/Import JSON is how an outline is kept.
export const OutlineView = ({ slides, onChange, onGenerate }) => {
  const [dragIndex, setDragIndex] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const fileRef = useRef(null);

  const addSlide = () => onChange([...slides, { id: uid(), title: `Slide ${slides.length + 1}`, body: "" }]);
  const removeSlide = (id) => onChange(slides.filter((s) => s.id !== id));
  const updateSlide = (id, patch) => onChange(slides.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const onDrop = (index) => {
    if (dragIndex === null || dragIndex === index) return;
    const next = [...slides];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(index, 0, moved);
    onChange(next);
    setDragIndex(null);
  };

  const applyImportedText = (text) => {
    const parsed = parseOutlineMarkdown(text);
    if (parsed.length === 0) { toast.error("No \"# Heading\" slides found in that text"); return; }
    onChange([...slides, ...parsed]);
    toast.success(`Imported ${parsed.length} slide${parsed.length === 1 ? "" : "s"}`);
    setImportOpen(false);
    setImportText("");
  };

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      if (f.name.toLowerCase().endsWith(".json")) {
        try { onChange([...slides, ...importOutlineJson(text)]); toast.success("Outline imported"); setImportOpen(false); }
        catch (err) { toast.error(`Invalid outline JSON: ${err.message}`); }
      } else {
        applyImportedText(text);
      }
    };
    reader.readAsText(f);
    e.target.value = "";
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0D0D0D]" data-testid="outline-view">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#2B2B2B] bg-[#141414]">
        <div className="text-xs text-gray-400 flex items-center gap-2">
          <Sparkles size={13} className="text-indigo-400" /> {slides.length} slide{slides.length === 1 ? "" : "s"} · each becomes a page
        </div>
        <div className="flex items-center gap-2 relative">
          <button onClick={addSlide} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-[#1F1F1F] hover:bg-[#2B2B2B] text-gray-200 border border-[#2B2B2B]" data-testid="outline-add-slide"><Plus size={12} /> Slide</button>
          <button onClick={() => setImportOpen((v) => !v)} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-[#1F1F1F] hover:bg-[#2B2B2B] text-gray-200 border border-[#2B2B2B]" data-testid="outline-import-btn"><Upload size={12} /> Import</button>
          <button onClick={() => exportOutlineJson(slides)} disabled={slides.length === 0} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-[#1F1F1F] hover:bg-[#2B2B2B] text-gray-200 border border-[#2B2B2B] disabled:opacity-30 disabled:cursor-not-allowed" data-testid="outline-export-btn"><Download size={12} /> Export JSON</button>
          <button onClick={() => onGenerate(slides)} disabled={slides.length === 0} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-30 disabled:cursor-not-allowed" data-testid="outline-generate-btn"><Sparkles size={12} /> Generate Pages</button>

          {importOpen && (
            <div className="absolute right-0 top-9 w-96 bg-[#141414] border border-[#2B2B2B] rounded-md p-3 z-50 shadow-2xl" data-testid="outline-import-panel">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[11px] uppercase tracking-wider text-gray-400">Import outline</div>
                <button onClick={() => setImportOpen(false)} className="text-gray-500 hover:text-white"><X size={13} /></button>
              </div>
              <input ref={fileRef} type="file" accept=".md,.markdown,.txt,.json" onChange={handleFile} className="hidden" data-testid="outline-import-file-input" />
              <button onClick={() => fileRef.current?.click()} className="w-full text-xs py-1.5 rounded bg-[#1F1F1F] border border-[#2B2B2B] text-gray-200 hover:bg-[#2B2B2B] mb-2" data-testid="outline-import-file-btn">Choose .md / .json file…</button>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">or paste markdown (# Heading per slide)</div>
              <textarea rows={6} value={importText} onChange={(e) => setImportText(e.target.value)} placeholder={"# Home\nIntro copy for the home page.\n\n# About"} className="w-full bg-[#0D0D0D] border border-[#2B2B2B] rounded p-2 text-xs font-mono text-white outline-none focus:border-indigo-500" data-testid="outline-import-paste-textarea" />
              <div className="flex justify-end mt-2">
                <button onClick={() => applyImportedText(importText)} className="text-xs px-3 py-1 rounded bg-indigo-600 text-white" data-testid="outline-import-scan-btn">Import</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {slides.length === 0 && (
          <div className="text-center text-sm text-gray-500 py-16">
            No slides yet. Add one, or import a markdown outline (one "# Heading" per page).
          </div>
        )}
        <div className="max-w-2xl mx-auto space-y-2">
          {slides.map((s, i) => (
            <div
              key={s.id}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(i)}
              className="bg-[#141414] border border-[#2B2B2B] rounded-md p-3 transition-all duration-200 hover:border-indigo-500/50"
              data-testid={`outline-slide-${s.id}`}
            >
              <div className="flex items-start gap-2">
                <div className="cursor-grab text-gray-600 pt-1.5" title="Drag to reorder"><GripVertical size={14} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-gray-600 w-5">{i + 1}</span>
                    <input
                      value={s.title}
                      onChange={(e) => updateSlide(s.id, { title: e.target.value })}
                      className="flex-1 bg-transparent text-sm font-semibold text-white outline-none border-b border-transparent focus:border-indigo-500 py-0.5"
                      data-testid={`outline-slide-title-${s.id}`}
                    />
                    <button onClick={() => removeSlide(s.id)} className="text-gray-500 hover:text-red-400 p-1" title="Delete slide" data-testid={`outline-slide-del-${s.id}`}><Trash2 size={13} /></button>
                  </div>
                  <textarea
                    value={s.body}
                    onChange={(e) => updateSlide(s.id, { body: e.target.value })}
                    placeholder="Notes / intro copy for this page…"
                    rows={2}
                    className="w-full mt-1.5 ml-7 bg-transparent text-xs text-gray-400 outline-none resize-none"
                    data-testid={`outline-slide-body-${s.id}`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
