import React, { useRef, useState } from "react";
import { Code2, MousePointer2, Download, Upload, Save, FolderOpen, ChevronDown, Undo2, Redo2, Monitor, Tablet, Smartphone, Link2, Server, HelpCircle } from "lucide-react";
import { scanHtml } from "@/lib/importHtml";
import { downloadStandalone, downloadZip } from "@/lib/exportHtml";
import { toast } from "sonner";

export const TopBar = ({
  mode, setMode,
  projectName, setProjectName,
  onImportSections,
  project,
  onSave,
  onOpenLoad,
  onUndo, onRedo, canUndo, canRedo,
  viewport, setViewport,
  onShare,
  onPublish,
  onStartTour,
}) => {
  const fileRef = useRef(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");

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
    <header className="h-14 flex-none border-b border-[#2B2B2B] bg-[#141414] flex items-center justify-between px-4 gap-3" data-testid="top-bar">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">◤</div>
          <span className="text-sm font-semibold tracking-tight text-white">Web Dojo</span>
        </div>
        <div className="h-6 w-px bg-[#2B2B2B]" />
        <input
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="bg-transparent text-sm text-gray-200 border border-transparent hover:border-[#2B2B2B] focus:border-blue-500 rounded px-2 py-1 outline-none w-52"
          data-testid="project-name-input"
          placeholder="Untitled project"
        />
        <div className="h-6 w-px bg-[#2B2B2B]" />
        <div className="flex items-center gap-0.5">
          <button onClick={onUndo} disabled={!canUndo} className="p-1.5 rounded hover:bg-[#1F1F1F] text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed" title="Undo (Cmd+Z)" data-testid="undo-btn"><Undo2 size={14} /></button>
          <button onClick={onRedo} disabled={!canRedo} className="p-1.5 rounded hover:bg-[#1F1F1F] text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed" title="Redo (Cmd+Shift+Z)" data-testid="redo-btn"><Redo2 size={14} /></button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center bg-[#0D0D0D] border border-[#2B2B2B] rounded-md p-0.5" data-testid="viewport-toggle">
          {[
            { id: "desktop", icon: Monitor },
            { id: "tablet", icon: Tablet },
            { id: "mobile", icon: Smartphone },
          ].map(({ id, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setViewport(id)}
              className={`p-1.5 rounded ${viewport === id ? "bg-[#1F1F1F] text-white" : "text-gray-400 hover:text-gray-200"}`}
              title={id}
              data-testid={`viewport-${id}`}
            ><Icon size={13} /></button>
          ))}
        </div>

        <div className="flex items-center bg-[#0D0D0D] border border-[#2B2B2B] rounded-md p-0.5" data-testid="mode-toggle">
          <button
            onClick={() => setMode("design")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded ${mode === "design" ? "bg-[#1F1F1F] text-white" : "text-gray-400 hover:text-gray-200"}`}
            data-testid="mode-design"
          ><MousePointer2 size={12} /> Design</button>
          <button
            onClick={() => setMode("code")}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded ${mode === "code" ? "bg-[#1F1F1F] text-white" : "text-gray-400 hover:text-gray-200"}`}
            data-testid="mode-code"
          ><Code2 size={12} /> Code</button>
        </div>
      </div>

      <div className="flex items-center gap-2 relative">
        <button
          onClick={() => setImportOpen((v) => !v)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-[#1F1F1F] hover:bg-[#2B2B2B] text-gray-200 border border-[#2B2B2B]"
          data-testid="import-btn"
        ><Upload size={12} /> Import</button>
        {importOpen && (
          <div className="absolute right-56 top-11 w-96 bg-[#141414] border border-[#2B2B2B] rounded-md p-3 z-50 shadow-2xl" data-testid="import-panel">
            <div className="text-[11px] uppercase tracking-wider text-gray-400 mb-2">Import HTML</div>
            <input ref={fileRef} type="file" accept=".html,.htm,text/html" onChange={handleFile} className="hidden" data-testid="import-file-input" />
            <button onClick={() => fileRef.current?.click()} className="w-full text-xs py-1.5 rounded bg-[#1F1F1F] border border-[#2B2B2B] text-gray-200 hover:bg-[#2B2B2B] mb-2" data-testid="import-file-btn">Choose .html file…</button>
            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">or paste HTML</div>
            <textarea rows={6} value={importText} onChange={(e) => setImportText(e.target.value)} placeholder="<html>…</html>" className="w-full bg-[#0D0D0D] border border-[#2B2B2B] rounded p-2 text-xs font-mono text-white outline-none focus:border-blue-500" data-testid="import-paste-textarea" />
            <div className="flex justify-end gap-2 mt-2">
              <button onClick={() => setImportOpen(false)} className="text-xs px-3 py-1 rounded bg-[#1F1F1F] text-gray-300 border border-[#2B2B2B]">Cancel</button>
              <button onClick={handlePasteImport} className="text-xs px-3 py-1 rounded bg-blue-600 text-white" data-testid="import-scan-btn">Scan & Import</button>
            </div>
          </div>
        )}

        <button
          onClick={() => setExportOpen((v) => !v)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-[#1F1F1F] hover:bg-[#2B2B2B] text-gray-200 border border-[#2B2B2B]"
          data-testid="export-btn"
        ><Download size={12} /> Export <ChevronDown size={12} /></button>
        {exportOpen && (
          <div className="absolute right-40 top-11 w-52 bg-[#141414] border border-[#2B2B2B] rounded-md p-1 z-50 shadow-2xl" data-testid="export-menu">
            <button onClick={() => { downloadStandalone(project); setExportOpen(false); }} className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-[#1F1F1F] text-gray-200" data-testid="export-standalone">Standalone .html (inline CSS)</button>
            <button onClick={() => { downloadZip(project); setExportOpen(false); }} className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-[#1F1F1F] text-gray-200" data-testid="export-zip">HTML + CSS (.zip)</button>
          </div>
        )}

        <button onClick={onShare} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-[#1F1F1F] hover:bg-[#2B2B2B] text-gray-200 border border-[#2B2B2B]" title="Copy shareable preview URL" data-testid="share-btn"><Link2 size={12} /> Share</button>
        <button onClick={onPublish} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-[#1F1F1F] hover:bg-[#2B2B2B] text-gray-200 border border-[#2B2B2B]" title="Upload via FTP / SFTP" data-testid="publish-btn"><Server size={12} /> Publish</button>
        <button onClick={onSave} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white" data-testid="save-btn"><Save size={12} /> Save</button>
        <button onClick={onOpenLoad} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-[#1F1F1F] hover:bg-[#2B2B2B] text-gray-200 border border-[#2B2B2B]" data-testid="load-btn"><FolderOpen size={12} /> Open</button>
        <button onClick={onStartTour} className="p-1.5 rounded-md hover:bg-[#1F1F1F] text-gray-300" title="Restart onboarding tour" data-testid="help-btn"><HelpCircle size={14} /></button>
      </div>
    </header>
  );
};
