import React, { useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { buildAstroExport } from "@/lib/exporters/astro";
import { buildNextjsExport } from "@/lib/exporters/nextjs";
import { X, Download, Check } from "lucide-react";
import { toast } from "sonner";

// Phase 9C: framework export modal — generates an Astro or Next.js project
// zip from the current project (delegating the canonical HTML/CSS build to
// buildMultiPageExport, so framework exports always match the plain HTML
// export's DOM and cascade).
const zipAndDownload = async (files, projectName, label) => {
  try {
    const zip = new JSZip();
    Object.entries(files).forEach(([name, content]) => zip.file(name, content));
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `${(projectName || "site").replace(/\s+/g, "-").toLowerCase()}-${label}.zip`);
    toast.success(`${label} project downloaded — run "npm install && npm run build" inside`);
  } catch (e) {
    toast.error(`${label} export failed: ${e?.message || e}`);
  }
};

const ExportCard = ({ title, blurb, files, onDownload }) => (
  <div className="border border-[#332D22] rounded-lg p-3 bg-[#15130E] space-y-2" data-testid={`export-card-${title.toLowerCase()}`}>
    <div className="flex items-center justify-between">
      <span className="text-sm text-[#F1EDE2] font-medium">{title}</span>
      <button
        onClick={onDownload}
        className="text-xs px-3 py-1.5 rounded bg-[#AD8B21] hover:bg-[#C9A227] text-[#F1EDE2] flex items-center gap-1.5"
        data-testid={`export-${title.toLowerCase()}-btn`}
      ><Download size={13} /> .zip</button>
    </div>
    <p className="text-[11px] text-[#948C79] leading-relaxed">{blurb}</p>
    <div className="flex flex-wrap gap-1">
      {Object.keys(files).slice(0, 8).map((f) => (
        <span key={f} className="text-[10px] px-1.5 py-0.5 rounded bg-[#242019] border border-[#332D22] text-[#E4DECE] flex items-center gap-1">
          <Check size={9} className="text-[#C9A227]" />{f}
        </span>
      ))}
      {Object.keys(files).length > 8 && (
        <span className="text-[10px] px-1.5 py-0.5 text-[#948C79]">+{Object.keys(files).length - 8} more</span>
      )}
    </div>
  </div>
);

export const ExporterModal = ({ open, onClose, project }) => {
  const [previews, setPreviews] = useState(null);
  if (!open) return null;
  const name = project?.name || "site";

  const generate = () => {
    try {
      const astro = buildAstroExport(project);
      const next = buildNextjsExport(project);
      setPreviews({ astro, next });
      return { astro, next };
    } catch (e) {
      toast.error(`Export generation failed: ${e?.message || e}`);
      return null;
    }
  };

  const built = previews || generate();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose} data-testid="exporter-modal">
      <div className="bg-[#1A1712] border border-[#332D22] rounded-xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base text-[#F1EDE2] font-medium">Framework export</h2>
            <p className="text-[11px] text-[#948C79]">Same DOM and cascade as the HTML zip, as a runnable framework project.</p>
          </div>
          <button onClick={onClose} className="text-[#948C79] hover:text-[#F1EDE2]" data-testid="exporter-close"><X size={18} /></button>
        </div>

        {built && (
          <>
            <ExportCard
              title="Astro"
              blurb="Static-first, zero client JS by default. npm run build → ./dist, FTP-ready."
              files={built.astro.files}
              onDownload={() => zipAndDownload(built.astro.files, name, "astro")}
            />
            <ExportCard
              title="Next.js"
              blurb="App Router with static export. npm run build → ./out, FTP-ready."
              files={built.next.files}
              onDownload={() => zipAndDownload(built.next.files, name, "nextjs")}
            />
          </>
        )}
      </div>
    </div>
  );
};
