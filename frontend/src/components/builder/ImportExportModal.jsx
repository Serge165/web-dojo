import React, { useRef, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { FileCode2, FileArchive, Braces, Copy, Link2, Upload, Download, Boxes } from "lucide-react";
import { downloadStandalone, downloadZip, downloadProjectJson, buildStandaloneHtml } from "@/lib/exportHtml";
import { scanHtml, inlineLocalStylesheets } from "@/lib/importHtml";
import { warnAboutSeoThenRun } from "@/lib/seoExportGuard";
import { ExporterModal } from "./ExporterModal";
import { featureEnabled } from "@/lib/featureFlags";

const Row = ({ icon: Icon, title, desc, action, label, testId, tone = "default" }) => (
  <button onClick={action} className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${tone === "accent" ? "border-indigo-500/40 bg-indigo-500/5 hover:bg-indigo-500/10" : "border-[#332D22] bg-[#1C1A15] hover:border-indigo-500/40"}`} data-testid={testId}>
    <Icon size={18} className="text-indigo-400 flex-none" />
    <div className="flex-1 min-w-0"><div className="text-sm text-[#F1EDE2] font-medium">{title}</div><div className="text-[11px] text-[#948C79] truncate">{desc}</div></div>
    {label && <span className="text-[10px] text-[#A79C87] border border-[#332D22] rounded px-2 py-0.5 flex-none">{label}</span>}
  </button>
);

const SEND_TARGETS = [
  { id: "figma", name: "Figma", desc: "Copy structured HTML for the free HTML.to.design plugin", act: "copy", note: "HTML copied — in Figma, run the HTML.to.design plugin and paste." },
  { id: "webflow", name: "Webflow", desc: "Export clean HTML+CSS — paste into a Webflow code embed", act: "zip", note: "Clean HTML+CSS zip downloaded — use it in a Webflow HTML embed / code import." },
  { id: "framer", name: "Framer", desc: "Copy HTML to paste into a Framer embed", act: "copy", note: "HTML copied — paste into a Framer Embed component." },
  { id: "wordpress", name: "WordPress", desc: "Download standalone .html for a Custom HTML block", act: "standalone", note: "HTML downloaded — paste its contents into a WordPress Custom HTML block." },
  { id: "netlify", name: "Netlify Drop", desc: "Download deployable zip to drag onto Netlify Drop", act: "zip", note: "Zip downloaded — drag it onto app.netlify.com/drop to deploy instantly." },
];

export const ImportExportModal = ({ open, onClose, project, onImportSections, onLoadProjectData, onImportUrl }) => {
  const [tab, setTab] = useState("export");
  const [pasteHtml, setPasteHtml] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [showExporters, setShowExporters] = useState(false);
  const [multiFileImport, setMultiFileImport] = useState(null); // { html: File, css: File[] }
  const fileRef = useRef(null);
  const jsonRef = useRef(null);
  const multiFileRef = useRef(null);

  const copyHtml = async () => { await navigator.clipboard.writeText(buildStandaloneHtml(project)); toast.success("Full HTML copied to clipboard"); };

  const sendTo = (t) => {
    warnAboutSeoThenRun(project, () => {
      if (t.act === "copy") { navigator.clipboard.writeText(buildStandaloneHtml(project)); }
      else if (t.act === "zip") { downloadZip(project); }
      else if (t.act === "standalone") { downloadStandalone(project); }
      toast.success(t.note);
    });
  };

  const doPaste = () => {
    if (!pasteHtml.trim()) { toast.error("Paste some HTML first"); return; }
    const { headHtml, sections } = scanHtml(pasteHtml);
    onImportSections({ headHtml, sections });
    toast.success(`Imported ${sections.length} section${sections.length === 1 ? "" : "s"}`);
    setPasteHtml(""); onClose();
  };

  const doUrl = async () => {
    if (!/^https?:\/\//.test(url.trim())) { toast.error("Enter a valid http(s) URL"); return; }
    setBusy(true);
    try {
      const n = await onImportUrl(url.trim());
      toast.success(`Imported ${n} section${n === 1 ? "" : "s"} from URL`);
      setUrl(""); onClose();
    } catch (e) {
      toast.error(e?.message || "Could not import from that URL");
    } finally { setBusy(false); }
  };

  const handleHtmlFile = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => { const { headHtml, sections } = scanHtml(String(r.result || "")); onImportSections({ headHtml, sections }); toast.success(`Imported ${sections.length} sections`); onClose(); };
    r.readAsText(f); e.target.value = "";
  };
  const handleJsonFile = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => { try { const data = JSON.parse(String(r.result || "{}")); onLoadProjectData(data); toast.success("Project imported"); onClose(); } catch { toast.error("That file isn't a valid Web Dojo project"); } };
    r.readAsText(f); e.target.value = "";
  };

  const handleMultiFileSelection = async (e) => {
    const files = Array.from(e.target.files || []);
    const htmlFiles = files.filter((f) => /\.html?$/i.test(f.name));
    const cssFiles = files.filter((f) => /\.css$/i.test(f.name));
    if (htmlFiles.length === 0) { toast.error("Select at least one .html file"); e.target.value = ""; return; }
    if (cssFiles.length === 0) { toast.error("Select at least one .css file to import together"); e.target.value = ""; return; }
    // For now, use first HTML file + all CSS files
    setMultiFileImport({ html: htmlFiles[0], css: cssFiles });
    e.target.value = "";
  };

  const doMultiFileImport = async () => {
    if (!multiFileImport) return;
    setBusy(true);
    try {
      const { html, css } = multiFileImport;
      const htmlText = await new Promise((resolve) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result || ""));
        r.readAsText(html);
      });
      const cssByName = {};
      for (const f of css) {
        const text = await new Promise((resolve) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result || ""));
          r.readAsText(f);
        });
        cssByName[f.name] = text;
      }
      const { headHtml, sections } = scanHtml(inlineLocalStylesheets(htmlText, cssByName));
      onImportSections({ headHtml, sections });
      toast.success(`Imported ${sections.length} section${sections.length === 1 ? "" : "s"} + CSS → globals.css`);
      setMultiFileImport(null);
      onClose();
    } catch (e) {
      toast.error("Failed to import files");
      console.error("Multi-file import error:", e);
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#1C1A15] border border-[#332D22] text-[#F1EDE2] max-w-2xl max-h-[90vh] overflow-hidden p-0" data-testid="transfer-modal">
        <DialogHeader className="px-5 pt-4 pb-3 border-b border-[#332D22]"><DialogTitle className="text-base">Import / Export</DialogTitle><DialogDescription className="sr-only">Export your site to HTML, CSS, JSON or design tools, or import from HTML, a URL, or a project file.</DialogDescription></DialogHeader>
        <div className="grid grid-cols-2 gap-1 p-2 border-b border-[#332D22]">
          <button onClick={() => setTab("export")} className={`py-2 rounded text-sm font-medium ${tab === "export" ? "bg-[#242019] text-[#F1EDE2]" : "text-[#A79C87]"}`} data-testid="transfer-tab-export">Export & Send</button>
          <button onClick={() => setTab("import")} className={`py-2 rounded text-sm font-medium ${tab === "import" ? "bg-[#242019] text-[#F1EDE2]" : "text-[#A79C87]"}`} data-testid="transfer-tab-import">Import</button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(90vh-130px)] space-y-2">
          {tab === "export" && (
            <>
              <Row icon={FileCode2} title="Standalone HTML" desc="One .html file with inline CSS" label=".html" action={() => warnAboutSeoThenRun(project, () => downloadStandalone(project))} testId="exp-standalone" />
              <Row icon={FileArchive} title="Clean HTML + CSS" desc="Separate index.html + globals.css" label=".zip" action={() => warnAboutSeoThenRun(project, () => downloadZip(project))} testId="exp-zip" />
              {featureEnabled("frameworkExports") && (
                <Row icon={Boxes} title="Framework project" desc="Runnable Astro or Next.js scaffold of this site" label=".zip" action={() => setShowExporters(true)} testId="exp-framework" />
              )}
              <Row icon={Braces} title="Web Dojo project" desc="Full editable project — re-import anytime" label=".json" action={() => downloadProjectJson(project)} testId="exp-json" />
              <Row icon={Copy} title="Copy full HTML" desc="Copy the page markup to your clipboard" action={copyHtml} testId="exp-copy" />
              <div className="text-[10px] uppercase tracking-wider text-[#948C79] pt-3 pb-1">Send to a design / hosting tool</div>
              {SEND_TARGETS.map((t) => (
                <Row key={t.id} icon={Download} title={t.name} desc={t.desc} action={() => sendTo(t)} testId={`send-${t.id}`} />
              ))}
              <p className="text-[10px] text-[#948C79] pt-1 leading-relaxed">Note: Figma & Webflow have no public API to push/pull full designs, so these use their supported paths — Figma's HTML-import plugin and Webflow's code embeds/exports.</p>
            </>
          )}

          {tab === "import" && (
            <>
              <div className="rounded-lg border border-[#332D22] bg-[#1C1A15] p-3">
                <div className="text-xs text-[#F1EDE2] font-medium mb-2 flex items-center gap-1.5"><Link2 size={14} className="text-indigo-400" /> Import from a live URL</div>
                <div className="flex gap-2">
                  <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" className="flex-1 bg-[#15130E] border border-[#332D22] rounded px-2 py-2 text-xs text-[#F1EDE2] outline-none focus:border-indigo-500 font-mono" data-testid="imp-url-input" />
                  <button onClick={doUrl} disabled={busy} className="text-xs px-4 rounded bg-indigo-600 hover:bg-indigo-500 text-[#F1EDE2] disabled:opacity-50" data-testid="imp-url-btn">{busy ? "Fetching…" : "Fetch"}</button>
                </div>
              </div>

              <div className="rounded-lg border border-[#332D22] bg-[#1C1A15] p-3">
                <div className="text-xs text-[#F1EDE2] font-medium mb-2">Paste HTML</div>
                <textarea rows={5} value={pasteHtml} onChange={(e) => setPasteHtml(e.target.value)} placeholder="<section>…</section>" className="w-full bg-[#15130E] border border-[#332D22] rounded p-2 text-xs font-mono text-[#F1EDE2] outline-none focus:border-indigo-500" data-testid="imp-paste-textarea" />
                <div className="flex justify-end mt-2"><button onClick={doPaste} className="text-xs px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-[#F1EDE2]" data-testid="imp-paste-btn">Scan & Import</button></div>
              </div>

              {multiFileImport ? (
                <div className="rounded-lg border border-indigo-500/40 bg-indigo-500/5 p-3">
                  <div className="text-xs text-[#F1EDE2] font-medium mb-2">Ready to import:</div>
                  <div className="text-[11px] text-[#A79C87] mb-3">
                    <div>HTML: {multiFileImport.html.name}</div>
                    <div>CSS files: {multiFileImport.css.map((f) => f.name).join(", ")}</div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setMultiFileImport(null)} className="flex-1 text-xs px-3 py-1.5 rounded bg-[#242019] hover:bg-[#332D22] text-[#F1EDE2] border border-[#332D22]" data-testid="imp-multi-cancel">Cancel</button>
                    <button onClick={doMultiFileImport} disabled={busy} className="flex-1 text-xs px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-[#F1EDE2] disabled:opacity-50" data-testid="imp-multi-confirm">{busy ? "Importing…" : "Confirm & Import"}</button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => fileRef.current?.click()} className="flex items-center justify-center gap-2 p-3 rounded-lg border border-[#332D22] bg-[#1C1A15] text-xs text-[#F1EDE2] hover:border-indigo-500/40" data-testid="imp-html-file-btn"><Upload size={14} /> Import .html file</button>
                  <button onClick={() => multiFileRef.current?.click()} className="flex items-center justify-center gap-2 p-3 rounded-lg border border-[#332D22] bg-[#1C1A15] text-xs text-[#F1EDE2] hover:border-indigo-500/40" data-testid="imp-multi-file-btn"><Upload size={14} /> HTML + CSS</button>
                  <button onClick={() => jsonRef.current?.click()} className="col-span-2 flex items-center justify-center gap-2 p-3 rounded-lg border border-[#332D22] bg-[#1C1A15] text-xs text-[#F1EDE2] hover:border-indigo-500/40" data-testid="imp-json-file-btn"><Braces size={14} /> Import .json project</button>
                </div>
              )}
              <input ref={fileRef} type="file" accept=".html,.htm,text/html" onChange={handleHtmlFile} className="hidden" />
              <input ref={multiFileRef} type="file" accept=".html,.htm,.css" multiple onChange={handleMultiFileSelection} className="hidden" />
              <input ref={jsonRef} type="file" accept=".json,application/json" onChange={handleJsonFile} className="hidden" />
            </>
          )}
        </div>
      </DialogContent>
      <ExporterModal open={showExporters} onClose={() => setShowExporters(false)} project={project} />
    </Dialog>
  );
};
