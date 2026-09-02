import React, { useEffect, useRef, useState } from "react";
import { Download, Upload, Save, FolderOpen, ChevronDown, Undo2, Redo2, Monitor, Tablet, Smartphone, Link2, Server, HelpCircle, Search, Palette, BarChart3, LayoutTemplate, Inbox, Store, Loader2, Check, AlertCircle, Megaphone } from "lucide-react";
import { scanHtml } from "@/lib/importHtml";
import { downloadStandalone, downloadZip } from "@/lib/exportHtml";
import { warnAboutSeoThenRun } from "@/lib/seoExportGuard";
import { toast } from "sonner";

export const TopBar = ({
  projectName, setProjectName,
  onImportSections,
  project,
  onSave, onSaveAs,
  saveStatus,
  onOpenLoad,
  onUndo, onRedo, canUndo, canRedo,
  viewport, setViewport,
  onShare,
  onPublish,
  onStartTour,
  onFind, onAssets, onAnalytics, onTemplates, onSubmissions, onDashboard, onZeneroDashboard,
  onOpenTransfer,
  peers,
}) => {
  const fileRef = useRef(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [saveDropdownOpen, setSaveDropdownOpen] = useState(false);
  const saveDropdownRef = useRef(null);

  // Close save-as dropdown on outside click.
  useEffect(() => {
    if (!saveDropdownOpen) return;
    const onDocDown = (e) => {
      if (saveDropdownRef.current && !saveDropdownRef.current.contains(e.target)) setSaveDropdownOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setSaveDropdownOpen(false); };
    document.addEventListener("mousedown", onDocDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDocDown); document.removeEventListener("keydown", onKey); };
  }, [saveDropdownOpen]);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const { headHtml, sections } = scanHtml(String(reader.result || ""));
      onImportSections({ headHtml, sections });
      toast.success(`Imported ${sections.length} section${sections.length === 1 ? "" : "s"}`);
      setImportOpen(false);
    };
    reader.readAsText(f);
    e.target.value = "";
  };

  const handlePasteImport = () => {
    if (!importText.trim()) return;
    const { headHtml, sections } = scanHtml(importText);
    onImportSections({ headHtml, sections });
    toast.success(`Imported ${sections.length} section${sections.length === 1 ? "" : "s"}`);
    setImportText("");
    setImportOpen(false);
  };

  return (
    <header className="h-14 flex-none border-b border-[#332D22] bg-[#1C1A15] flex items-center justify-between px-4 gap-3" data-testid="top-bar">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded bg-[#AD8B21] flex items-center justify-center text-[#F1EDE2] text-[10px] font-bold">◤</div>
          <span className="text-sm font-semibold tracking-tight text-[#F1EDE2]">Web Dojo</span>
        </div>
        <div className="h-6 w-px bg-[#332D22]" />
        <input
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="bg-transparent text-sm text-[#F1EDE2] border border-transparent hover:border-[#332D22] focus:border-[#C9A227] rounded px-2 py-1 outline-none w-52"
          data-testid="project-name-input"
          placeholder="Untitled project"
        />
        <div className="h-6 w-px bg-[#332D22]" />
        <div className="flex items-center gap-0.5">
          <button onClick={onUndo} disabled={!canUndo} className="p-1.5 rounded hover:bg-[#242019] text-[#E4DECE] disabled:opacity-30 disabled:cursor-not-allowed" title="Undo (Cmd+Z)" data-testid="undo-btn"><Undo2 size={14} /></button>
          <button onClick={onRedo} disabled={!canRedo} className="p-1.5 rounded hover:bg-[#242019] text-[#E4DECE] disabled:opacity-30 disabled:cursor-not-allowed" title="Redo (Cmd+Shift+Z)" data-testid="redo-btn"><Redo2 size={14} /></button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center bg-[#15130E] border border-[#332D22] rounded-md p-0.5" data-testid="viewport-toggle">
          {[
            { id: "desktop", icon: Monitor },
            { id: "tablet", icon: Tablet },
            { id: "mobile", icon: Smartphone },
          ].map(({ id, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setViewport(id)}
              className={`p-1.5 rounded ${viewport === id ? "bg-[#242019] text-[#F1EDE2]" : "text-[#A79C87] hover:text-[#F1EDE2]"}`}
              title={id}
              data-testid={`viewport-${id}`}
            ><Icon size={13} /></button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 relative">
        <button
          onClick={() => setImportOpen((v) => !v)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-[#242019] hover:bg-[#332D22] text-[#F1EDE2] border border-[#332D22]"
          data-testid="import-btn"
        ><Upload size={12} /> Import</button>
        {importOpen && (
          <div className="absolute right-56 top-11 w-96 bg-[#1C1A15] border border-[#332D22] rounded-md p-3 z-50 shadow-2xl" data-testid="import-panel">
            <div className="text-[11px] uppercase tracking-wider text-[#A79C87] mb-2">Import HTML</div>
            <input ref={fileRef} type="file" accept=".html,.htm,text/html" onChange={handleFile} className="hidden" data-testid="import-file-input" />
            <button onClick={() => fileRef.current?.click()} className="w-full text-xs py-1.5 rounded bg-[#242019] border border-[#332D22] text-[#F1EDE2] hover:bg-[#332D22] mb-2" data-testid="import-file-btn">Choose .html file…</button>
            <div className="text-[10px] uppercase tracking-wider text-[#948C79] mb-1">or paste HTML</div>
            <textarea rows={6} value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="<html>…</html>" className="w-full bg-[#15130E] border border-[#332D22] rounded p-2 text-xs font-mono text-[#F1EDE2] outline-none focus:border-[#C9A227]" data-testid="import-paste-textarea" />
            <div className="flex justify-end gap-2 mt-2">
              <button onClick={() => setImportOpen(false)} className="text-xs px-3 py-1 rounded bg-[#242019] text-[#E4DECE] border border-[#332D22]">Cancel</button>
              <button onClick={handlePasteImport} className="text-xs px-3 py-1 rounded bg-[#AD8B21] text-[#F1EDE2]" data-testid="import-scan-btn">Scan & Import</button>
            </div>
          </div>
        )}

        <button
          onClick={() => setExportOpen((v) => !v)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-[#242019] hover:bg-[#332D22] text-[#F1EDE2] border border-[#332D22]"
          data-testid="export-btn"
        ><Download size={12} /> Export <ChevronDown size={12} /></button>
        {exportOpen && (
          <div className="absolute right-40 top-11 w-52 bg-[#1C1A15] border border-[#332D22] rounded-md p-1 z-50 shadow-2xl" data-testid="export-menu">
            <button onClick={() => { warnAboutSeoThenRun(project, () => downloadStandalone(project)); setExportOpen(false); }} className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-[#242019] text-[#F1EDE2]" data-testid="export-standalone">Standalone .html (inline CSS)</button>
            <button onClick={() => { warnAboutSeoThenRun(project, () => downloadZip(project)); setExportOpen(false); }} className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-[#242019] text-[#F1EDE2]" data-testid="export-zip">HTML + CSS (.zip)</button>
            <div className="h-px bg-[#332D22] my-1" />
            <button onClick={() => { setExportOpen(false); onOpenTransfer && onOpenTransfer(); }} className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-[#242019] text-indigo-300" data-testid="export-more">More: JSON, Figma, Webflow, URL…</button>
          </div>
        )}

        {!!peers?.length && (
          <div className="flex items-center -space-x-1.5 mr-1" data-testid="presence-peers" title={peers.map((p) => p.name || "Anonymous").join(", ")}>
            {peers.slice(0, 5).map((p) => (
              <div
                key={p.user_id}
                className="w-6 h-6 rounded-full border-2 border-[#161310] flex items-center justify-center text-[10px] font-semibold text-[#161310]"
                style={{ background: p.color || "#C9A227" }}
              >
                {(p.name || "?").slice(0, 1).toUpperCase()}
              </div>
            ))}
          </div>
        )}
        <button onClick={onShare} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-[#242019] hover:bg-[#332D22] text-[#F1EDE2] border border-[#332D22]" title="Copy shareable preview URL" data-testid="share-btn"><Link2 size={12} /> Share</button>
        <button onClick={onPublish} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-transparent hover:bg-[#2A2416] text-[#E8C34A] border border-[#4A3F1E]" title="Upload via FTP / SFTP" data-testid="publish-btn"><Server size={12} /> Publish</button>
        <div className="h-6 w-px bg-[#332D22]" />
        <div className="flex items-center gap-0.5">
          <button onClick={onFind} className="p-1.5 rounded hover:bg-[#242019] text-[#A79C87] hover:text-[#F1EDE2]" title="Find & Replace (Cmd+F)" data-testid="find-btn"><Search size={14} /></button>
          <button onClick={onAssets} className="p-1.5 rounded hover:bg-[#242019] text-[#A79C87] hover:text-[#F1EDE2]" title="Design tokens (colors/fonts/spacing)" data-testid="assets-btn"><Palette size={14} /></button>
          <button onClick={onAnalytics} className="p-1.5 rounded hover:bg-[#242019] text-[#A79C87] hover:text-[#F1EDE2]" title="Analytics" data-testid="analytics-btn"><BarChart3 size={14} /></button>
          <button onClick={onTemplates} className="p-1.5 rounded hover:bg-[#242019] text-[#A79C87] hover:text-[#F1EDE2]" title="Project templates" data-testid="templates-btn"><LayoutTemplate size={14} /></button>
          <button onClick={onSubmissions} className="p-1.5 rounded hover:bg-[#242019] text-[#A79C87] hover:text-[#F1EDE2]" title="Form submissions inbox" data-testid="submissions-btn"><Inbox size={14} /></button>
          <button onClick={onDashboard} className="p-1.5 rounded hover:bg-[#242019] text-[#A79C87] hover:text-[#F1EDE2]" title="E-commerce dashboard (orders, customers, analytics, insights)" data-testid="dashboard-btn"><Store size={14} /></button>
          {onZeneroDashboard && (
            <button onClick={onZeneroDashboard} className="p-1.5 rounded hover:bg-[#242019] text-[#A79C87] hover:text-[#F1EDE2]" title="Zenero content dashboard (updates, blog, portfolio, gallery, social)" data-testid="zenero-dashboard-btn"><Megaphone size={14} /></button>
          )}
        </div>
        <div className="h-6 w-px bg-[#332D22]" />
        {saveStatus === "saving" && <span className="flex items-center gap-1 text-[11px] text-[#948C79]" data-testid="save-status-saving"><Loader2 size={12} className="animate-spin" /> Saving…</span>}
        {saveStatus === "saved" && <span className="flex items-center gap-1 text-[11px] text-emerald-500/80" data-testid="save-status-saved"><Check size={12} /> Saved</span>}
        {saveStatus === "unsaved" && <span className="text-[11px] text-[#948C79]" data-testid="save-status-unsaved">Unsaved changes</span>}
        {saveStatus === "error" && <span className="flex items-center gap-1 text-[11px] text-red-400" data-testid="save-status-error"><AlertCircle size={12} /> Save failed</span>}
        <div className="relative inline-flex rounded-md" ref={saveDropdownRef}>
          <button onClick={onSave} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-l-md bg-[#AD8B21] hover:bg-[#C9A227] text-[#F1EDE2]" data-testid="save-btn"><Save size={12} /> Save</button>
          <button onClick={() => setSaveDropdownOpen(!saveDropdownOpen)} className="flex items-center text-xs px-1.5 py-1.5 rounded-r-md bg-[#AD8B21] hover:bg-[#C9A227] text-[#F1EDE2] border-l border-[#C9A227]" data-testid="save-dropdown-btn"><ChevronDown size={12} /></button>
          {saveDropdownOpen && (
            <div className="absolute top-9 right-0 bg-[#1C1A15] border border-[#332D22] rounded-md py-1 z-50 shadow-2xl min-w-[130px]">
              <button onClick={() => { setSaveDropdownOpen(false); onSaveAs && onSaveAs(); }} className="w-full flex items-center gap-2 text-left text-xs px-3 py-1.5 text-[#F1EDE2] hover:bg-[#242019]" data-testid="save-as-btn">
                <Save size={12} /> Save As…
              </button>
            </div>
          )}
        </div>
        <button onClick={onOpenLoad} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-[#242019] hover:bg-[#332D22] text-[#F1EDE2] border border-[#332D22]" data-testid="load-btn"><FolderOpen size={12} /> Open</button>
        <button onClick={onStartTour} className="p-1.5 rounded-md hover:bg-[#242019] text-[#E4DECE]" title="Restart onboarding tour" data-testid="help-btn"><HelpCircle size={14} /></button>
      </div>
    </header>
  );
};
