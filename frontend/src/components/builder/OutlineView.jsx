import React, { useRef, useState, useMemo } from "react";
import { Plus, Trash2, Upload, Download, Sparkles, GripVertical, X, ListTree } from "lucide-react";
import { toast } from "sonner";
import { parseOutlineMarkdown, exportOutlineJson, importOutlineJson, slideBodyOutline, buildOutlineFromPage, buildOutlineFromPageHtml, buildOutlineSlidesFromPage, outlineToMarkdown } from "@/lib/outline";

const uid = () => "slide_" + Math.random().toString(36).slice(2, 10);

// Phase 6 Task 4: renders a nested outline tree — {level, text, children}
// entries (buildOutlineFromPageHtml / a slide's derived outline) with their
// paragraph / bullet / image children. `compact` fits the outline pane.
const OutlineTree = ({ outline, compact = false }) => {
  const nodes = outline || [];
  if (nodes.length === 0) return null;
  return (
    <div className="space-y-0.5">
      {nodes.map((n, i) => (
        <div key={i}>
          <div
            className={`${compact ? "text-[11px]" : "text-xs"} font-semibold text-[#E4DECE] truncate`}
            style={{ paddingLeft: `${Math.max(0, (n.level || 1) - 1) * 12}px` }}
          >
            H{n.level || 1} · {n.text || "(untitled)"}
          </div>
          {(n.children || []).map((c, j) => (
            <div
              key={j}
              className={`${compact ? "text-[10px]" : "text-[11px]"} text-[#A79C87] truncate ${c.type === "bullet" ? "flex gap-1" : ""}`}
              style={{ paddingLeft: `${Math.max(0, (n.level || 1) - 1) * 12 + 12}px` }}
            >
              {c.type === "bullet" && <span aria-hidden="true">•</span>}
              <span className="truncate">{c.type === "image" ? `[image: ${c.text}]` : c.text}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

// PowerPoint-like outline editor: a reorderable list of {title, body}
// slides that generate real pages via onGenerate. Ephemeral — not part of
// the saved project; Export/Import JSON is how an outline is kept.
export const OutlineView = ({ slides, onChange, onGenerate, pageElements = null, pageName = "" }) => {
  const [dragIndex, setDragIndex] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const fileRef = useRef(null);

  const addSlide = () => onChange([...slides, { id: uid(), title: `Slide ${slides.length + 1}`, body: "" }]);
  const removeSlide = (id) => onChange(slides.filter((s) => s.id !== id));
  const updateSlide = (id, patch) => onChange(slides.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  // Phase 6 (Task 4): derive a hierarchical outline from the current page's
  // elements and append it as a slide (title = the page's name, body =
  // markdown of the outline, `outline` = the tree for the nested render).
  const outlineFromPage = () => {
    const items = buildOutlineFromPage(pageElements);
    if (items.length === 0) { toast.error("No headings or text found on the current page"); return; }
    onChange([...slides, { id: uid(), title: pageName || "Page outline", body: outlineToMarkdown(items), outline: items }]);
    toast.success("Outline built from the current page");
  };

  // Phase 6 Task 4: the live outline of the current page (headings with
  // their nested paragraphs/bullets/images) + the "fill slides" action.
  const pageHtml = useMemo(
    () => (pageElements || []).map((el) => (el && el.html) || "").join("\n"),
    [pageElements]
  );
  const liveOutline = useMemo(() => buildOutlineFromPageHtml(pageHtml), [pageHtml]);
  const fillFromPage = () => {
    const filled = buildOutlineSlidesFromPage(pageHtml, pageName || `Page ${slides.length + 1}`);
    if (filled.length === 0) { toast.error("No headings (h1–h6) found on the current page"); return; }
    onChange([...slides, ...filled]);
    toast.success("Filled 1 slide from the current page");
  };

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
    <div className="flex-1 flex flex-col overflow-hidden bg-[#15130E]" data-testid="outline-view">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#332D22] bg-[#1C1A15]">
        <div className="text-xs text-[#A79C87] flex items-center gap-2">
          <Sparkles size={13} className="text-indigo-400" /> {slides.length} slide{slides.length === 1 ? "" : "s"} · each becomes a page
        </div>
        <div className="flex items-center gap-2 relative">
          <button onClick={addSlide} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-[#242019] hover:bg-[#332D22] text-[#F1EDE2] border border-[#332D22]" data-testid="outline-add-slide"><Plus size={12} /> Slide</button>
          <button
            onClick={outlineFromPage}
            disabled={!pageElements || pageElements.length === 0}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-[#242019] hover:bg-[#332D22] text-[#F1EDE2] border border-[#332D22] disabled:opacity-30 disabled:cursor-not-allowed"
            data-testid="outline-from-page"
            title="Build a hierarchical outline from the current page's headings and text"
          ><ListTree size={12} /> From page</button>
          <button onClick={() => setImportOpen((v) => !v)} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-[#242019] hover:bg-[#332D22] text-[#F1EDE2] border border-[#332D22]" data-testid="outline-import-btn"><Upload size={12} /> Import</button>

          <button onClick={() => exportOutlineJson(slides)} disabled={slides.length === 0} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md bg-[#242019] hover:bg-[#332D22] text-[#F1EDE2] border border-[#332D22] disabled:opacity-30 disabled:cursor-not-allowed" data-testid="outline-export-btn"><Download size={12} /> Export JSON</button>
          <button onClick={() => onGenerate(slides)} disabled={slides.length === 0} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-[#F1EDE2] disabled:opacity-30 disabled:cursor-not-allowed" data-testid="outline-generate-btn"><Sparkles size={12} /> Generate Pages</button>

          {importOpen && (
            <div className="absolute right-0 top-9 w-96 bg-[#1C1A15] border border-[#332D22] rounded-md p-3 z-50 shadow-2xl" data-testid="outline-import-panel">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[11px] uppercase tracking-wider text-[#A79C87]">Import outline</div>
                <button onClick={() => setImportOpen(false)} className="text-[#948C79] hover:text-[#F1EDE2]"><X size={13} /></button>
              </div>
              <input ref={fileRef} type="file" accept=".md,.markdown,.txt,.json" onChange={handleFile} className="hidden" data-testid="outline-import-file-input" />
              <button onClick={() => fileRef.current?.click()} className="w-full text-xs py-1.5 rounded bg-[#242019] border border-[#332D22] text-[#F1EDE2] hover:bg-[#332D22] mb-2" data-testid="outline-import-file-btn">Choose .md / .json file…</button>
              <div className="text-[10px] uppercase tracking-wider text-[#948C79] mb-1">or paste markdown (# Heading per slide)</div>
              <textarea rows={6} value={importText} onChange={(e) => setImportText(e.target.value)} placeholder={"# Home\nIntro copy for the home page.\n\n# About"} className="w-full bg-[#15130E] border border-[#332D22] rounded p-2 text-xs font-mono text-[#F1EDE2] outline-none focus:border-indigo-500" data-testid="outline-import-paste-textarea" />
              <div className="flex justify-end mt-2">
                <button onClick={() => applyImportedText(importText)} className="text-xs px-3 py-1 rounded bg-indigo-600 text-[#F1EDE2]" data-testid="outline-import-scan-btn">Import</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {slides.length === 0 && (
          <div className="text-center text-sm text-[#948C79] py-16">
            No slides yet. Add one, or import a markdown outline (one "# Heading" per page).
          </div>
        )}

        {/* Phase 6 Task 4: live outline of the current page + one-click fill */}
        {pageElements && (
          <div className="max-w-2xl mx-auto mb-4 p-3 bg-[#1C1A15] border border-[#332D22] rounded-md" data-testid="outline-live-section">
            <div className="flex items-center justify-between mb-2 gap-2">
              <div className="text-[10px] uppercase tracking-wider text-[#948C79]">
                Live outline{pageName ? ` — ${pageName}` : ""}
              </div>
              <button
                onClick={fillFromPage}
                disabled={liveOutline.length === 0}
                className="text-[11px] px-2 py-1 rounded bg-[#242019] hover:bg-[#332D22] text-[#F1EDE2] border border-[#332D22] disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                data-testid="outline-fill-from-page"
              >
                Fill slides from this page
              </button>
            </div>
            {liveOutline.length === 0 ? (
              <div className="text-[11px] text-[#948C79]">
                No headings (h1–h6) on this page yet. Headings become outline entries; paragraphs, lists and images nest under them.
              </div>
            ) : (
              <div data-testid="outline-live-tree">
                <OutlineTree outline={liveOutline} compact />
              </div>
            )}
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
              className="bg-[#1C1A15] border border-[#332D22] rounded-md p-3 transition-all duration-200 hover:border-indigo-500/50"
              data-testid={`outline-slide-${s.id}`}
            >
              <div className="flex items-start gap-2">
                <div className="cursor-grab text-[#6B6353] pt-1.5" title="Drag to reorder"><GripVertical size={14} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-[#6B6353] w-5">{i + 1}</span>
                    <input
                      value={s.title}
                      onChange={(e) => updateSlide(s.id, { title: e.target.value })}
                      className="flex-1 bg-transparent text-sm font-semibold text-[#F1EDE2] outline-none border-b border-transparent focus:border-indigo-500 py-0.5"
                      data-testid={`outline-slide-title-${s.id}`}
                    />
                    <button onClick={() => removeSlide(s.id)} className="text-[#948C79] hover:text-red-400 p-1" title="Delete slide" data-testid={`outline-slide-del-${s.id}`}><Trash2 size={13} /></button>
                  </div>
                  {/* Phase 6 (Task 4): nested outline preview of the slide
                      body — headings indent their paragraphs/bullets, like
                      PowerPoint's outline pane. The textarea below still
                      edits the raw markdown. */}
                  {(() => {
                    const nodes = slideBodyOutline(s.body);
                    if (nodes.length === 0) return null;
                    return (
                      <div className="ml-7 mt-1.5 mb-1 space-y-0.5" data-testid={`outline-slide-bodytree-${s.id}`}>
                        {nodes.map((n, i) => (
                          <div key={i}>
                            <div
                              className={n.type === "heading" ? "text-[11px] font-semibold text-[#E4DECE] truncate" : "text-[10px] text-[#948C79] truncate"}
                              style={{ paddingLeft: n.type === "heading" ? `${Math.max(0, n.level - 2) * 10}px` : "16px" }}
                            >
                              {n.type === "heading" ? `${"#".repeat(n.level)} ` : n.type === "bullet" ? "• " : ""}{n.text}
                            </div>
                            {(n.children || []).map((c, j) => (
                              <div key={j} className="text-[10px] text-[#948C79] truncate" style={{ paddingLeft: `${Math.max(0, n.level - 2) * 10 + 24}px` }}>
                                {c.type === "bullet" ? "• " : ""}{c.text}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  <textarea
                    value={s.body}
                    onChange={(e) => updateSlide(s.id, { body: e.target.value })}
                    placeholder="Notes / intro copy for this page…"
                    rows={2}
                    className="w-full mt-1.5 ml-7 bg-transparent text-xs text-[#A79C87] outline-none resize-none"
                    data-testid={`outline-slide-body-${s.id}`}
                  />
                  {/* Phase 6 Task 4: nested content outline for this slide */}
                  {s.outline && s.outline.length > 0 && (
                    <div className="ml-7 mt-1.5 border-l border-[#332D22] pl-2.5" data-testid={`outline-slide-tree-${s.id}`}>
                      <OutlineTree outline={s.outline} compact />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
