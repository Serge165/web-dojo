import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Trash2, Sparkles, Bookmark, Search, X, Eye, Monitor, Tablet, Smartphone } from "lucide-react";
import { buildTemplatePreviewHtml } from "@/lib/exportHtml";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Palette per aesthetic — small preview chip inside each starter card so
// users can eyeball the vibe without loading anything.
const AESTHETIC_PREVIEWS = {
  "frutiger-aero": { bg: "linear-gradient(135deg,#c8f0ff 0%,#7fd8ff 55%,#3a9bd6 100%)", fg: "#0b3d5f" },
  "dark-academia": { bg: "radial-gradient(circle at 20% 30%,#2a1f18 0%,#120b07 70%)", fg: "#e8d9b8" },
  "solar-punk": { bg: "linear-gradient(160deg,#f4efd6 0%,#c7e0a8 60%,#8fbf6a 100%)", fg: "#1f3a1a" },
  "cottagecore": { bg: "linear-gradient(180deg,#f7f0e2 0%,#efd9c0 100%)", fg: "#4a2f22" },
  "y2k": { bg: "linear-gradient(135deg,#ffd6f0 0%,#c8b4ff 50%,#a0e8ff 100%)", fg: "#3a1a4a" },
  "vaporwave": { bg: "linear-gradient(180deg,#0f0d3a 0%,#5a2d8a 40%,#ff5db1 75%,#ffb56b 100%)", fg: "#ffffff" },
  "cyberpunk": { bg: "radial-gradient(ellipse at 70% 20%,#2a0a3a 0%,#050510 60%)", fg: "#00e5ff" },
  "brutalism": { bg: "#ffffff", fg: "#000000", border: "3px solid #000000" },
  "bauhaus": { bg: "#f2eede", fg: "#e63946" },
  "scandi-minimal": { bg: "#faf8f4", fg: "#0a0a0a" },
  "memphis": { bg: "#fdf6e3", fg: "#ff3b8b" },
  "retro-futurism": { bg: "radial-gradient(circle at 80% 20%,#f0a038 0%,#c5551d 40%,#7a2b12 100%)", fg: "#f2e6d0" },
  "bloomcore": { bg: "linear-gradient(180deg,#fff5f7 0%,#ffe4ee 60%,#f8c9dc 100%)", fg: "#c14571" },
  "neubrutalism": { bg: "#fef9d9", fg: "#000000", border: "3px solid #000000" },
  "corp-memphis": { bg: "linear-gradient(135deg,#f4f0ff 0%,#dff5ec 100%)", fg: "#7a4de8" },
  "kidcore": { bg: "linear-gradient(135deg,#fff8e1 0%,#ffde3a 100%)", fg: "#ff5b3a" },
  "blueprint": { bg: "#0a2540", fg: "#6ab0d8" },
  "editorial-warm": { bg: "#f5efe4", fg: "#8a7052" },
  "diffused-worlds": { bg: "linear-gradient(160deg,#f8e6f2 0%,#eaddf4 50%,#c9d8f0 100%)", fg: "#5a4590" },
  "cassette-futurism": { bg: "linear-gradient(180deg,#d9c9a0 0%,#b8a578 100%)", fg: "#c05a10" },
  "newspaper": { bg: "#f4ede0", fg: "#1a1a1a" },
  "barbiecore": { bg: "linear-gradient(180deg,#ff9ec4 0%,#ff2ea8 100%)", fg: "#ffffff" },
  "win95": { bg: "#008080", fg: "#ffffff" },
  "grunge-zine": { bg: "#f0ede4", fg: "#ee2a2a" },
  "art-nouveau": { bg: "linear-gradient(135deg,#f4ecd8 0%,#e0d0a0 100%)", fg: "#3a4a25" },
  "swiss": { bg: "#f4f4f4", fg: "#e5001a" },
  "goblincore": { bg: "radial-gradient(circle at 30% 30%,#3a4a28 0%,#1a2412 70%)", fg: "#c8a848" },
  "dreamcore": { bg: "radial-gradient(ellipse at 30% 30%,#ffd6ec 0%,#f3e8ff 50%,#c9d8f8 100%)", fg: "#8a5aa8" },
};

const StarterCard = ({ tpl, onPreview }) => {
  const preview = AESTHETIC_PREVIEWS[tpl.aesthetic] || { bg: "#242019", fg: "#ffffff" };
  return (
    <button
      onClick={() => onPreview(tpl)}
      className="text-left rounded-lg border border-[#332D22] bg-[#15130E] hover:border-[#C9A227]/60 overflow-hidden transition-colors group relative"
      data-testid={`tpl-preview-${tpl.id}`}
    >
      <div
        className="h-24 flex items-end p-3 relative"
        style={{ background: preview.bg, border: preview.border }}
      >
        <span
          style={{ color: preview.fg }}
          className="text-[11px] font-semibold uppercase tracking-widest opacity-90"
        >{tpl.aesthetic}</span>
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[#F1EDE2] text-xs font-medium flex items-center gap-1.5"><Eye size={12} /> Preview</span>
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center gap-1.5 text-sm text-[#F1EDE2] truncate">
          <Sparkles size={11} className="text-amber-400 shrink-0" />
          {tpl.name}
        </div>
        <div className="text-[11px] text-[#948C79] line-clamp-2 mt-1">{tpl.description || "—"}</div>
      </div>
    </button>
  );
};

// Full-screen preview overlay. Renders the template into a sandboxed iframe
// with device presets and a "Use this template" CTA.
const TemplatePreviewModal = ({ tpl, onClose, onUse }) => {
  const [viewport, setViewport] = useState("desktop");
  const html = useMemo(() => (tpl ? buildTemplatePreviewHtml(tpl) : ""), [tpl]);
  if (!tpl) return null;
  const width = viewport === "mobile" ? 390 : viewport === "tablet" ? 820 : 1280;
  return (
    <Dialog open={!!tpl} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#1C1A15] border border-[#332D22] text-[#F1EDE2] max-w-[95vw] w-[95vw] max-h-[92vh] overflow-hidden p-0" data-testid="template-preview-modal">
        <DialogHeader className="px-5 pt-4 pb-3 border-b border-[#332D22]">
          <DialogTitle className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-base">
              <Sparkles size={14} className="text-amber-400" />
              {tpl.name}
              <span className="text-[10px] uppercase tracking-widest text-[#948C79] border border-[#332D22] rounded px-1.5 py-0.5">{tpl.aesthetic}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-[#15130E] border border-[#332D22] rounded-md p-0.5" data-testid="preview-viewport">
                {[{ id: "desktop", Icon: Monitor }, { id: "tablet", Icon: Tablet }, { id: "mobile", Icon: Smartphone }].map(({ id, Icon }) => (
                  <button
                    key={id}
                    onClick={() => setViewport(id)}
                    className={`p-1.5 rounded ${viewport === id ? "bg-[#242019] text-[#F1EDE2]" : "text-[#A79C87] hover:text-[#F1EDE2]"}`}
                    data-testid={`preview-${id}`}
                    title={id}
                  ><Icon size={12} /></button>
                ))}
              </div>
              <button
                onClick={onClose}
                className="text-xs px-3 py-1.5 rounded bg-[#242019] hover:bg-[#332D22] text-[#F1EDE2] border border-[#332D22]"
                data-testid="preview-cancel"
              >Close</button>
              <button
                onClick={() => onUse(tpl)}
                className="text-xs px-3 py-1.5 rounded bg-[#AD8B21] hover:bg-[#C9A227] text-[#F1EDE2] font-medium"
                data-testid="preview-use"
              >Use this template</button>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 bg-[#15130E] overflow-auto p-6 flex justify-center items-start" style={{ height: "calc(92vh - 68px)" }}>
          <iframe
            title="template-preview"
            srcDoc={html}
            className="bg-white shadow-2xl border border-[#332D22] transition-all"
            style={{ width: `${width}px`, minHeight: "600px", height: "100%" }}
            sandbox="allow-same-origin"
            data-testid="template-preview-iframe"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

const UserTemplateRow = ({ tpl, onUse, onDelete }) => (
  <div className="p-3 rounded border border-[#332D22] bg-[#15130E] hover:border-[#C9A227]/60" data-testid={`tpl-row-${tpl.id}`}>
    <div className="flex items-start gap-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-sm text-[#F1EDE2] truncate">
          <Bookmark size={11} className="text-[#D9BC55] shrink-0" />
          {tpl.name}
        </div>
        <div className="text-[11px] text-[#948C79] line-clamp-2">{tpl.description || "—"}</div>
      </div>
      <button onClick={() => onDelete(tpl.id)} className="p-1 text-[#948C79] hover:text-red-400" data-testid={`tpl-del-${tpl.id}`}><Trash2 size={12} /></button>
    </div>
    <button
      onClick={() => onUse(tpl)}
      className="mt-2 w-full text-xs py-1 rounded bg-[#242019] hover:bg-[#332D22] text-[#F1EDE2] border border-[#332D22]"
      data-testid={`tpl-use-${tpl.id}`}
    >Use template</button>
  </div>
);

// Two-mode modal: save the current project as a starter template, or start a
// new project from an existing template (including built-in aesthetics).
export const ProjectTemplatesModal = ({ open, onClose, currentProject, onLoadTemplate }) => {
  const [templates, setTemplates] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [aestheticFilter, setAestheticFilter] = useState("");
  const [previewTpl, setPreviewTpl] = useState(null);

  useEffect(() => { if (open) refresh(); }, [open]);

  const refresh = async () => {
    try {
      const r = await axios.get(`${API}/templates`);
      setTemplates(r.data);
    } catch { toast.error("Failed to load templates"); }
  };

  const { starters, userTemplates, aesthetics } = useMemo(() => {
    const q = query.trim().toLowerCase();
    const starters = templates.filter((t) => t.is_starter);
    const userTemplates = templates.filter((t) => !t.is_starter);
    const aesthetics = Array.from(new Set(starters.map((t) => t.aesthetic).filter(Boolean))).sort();
    const filterOne = (t) => {
      const hitAesthetic = !aestheticFilter || t.aesthetic === aestheticFilter;
      const hitQuery = !q || t.name.toLowerCase().includes(q) || (t.aesthetic || "").toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q);
      return hitAesthetic && hitQuery;
    };
    return {
      starters: starters.filter(filterOne),
      userTemplates: userTemplates.filter((t) => !q || t.name.toLowerCase().includes(q) || (t.description || "").toLowerCase().includes(q)),
      aesthetics,
    };
  }, [templates, query, aestheticFilter]);

  const saveTemplate = async () => {
    if (!name.trim()) { toast.error("Give the template a name"); return; }
    setBusy(true);
    try {
      await axios.post(`${API}/templates`, {
        name: name.trim(),
        description: description.trim(),
        data: currentProject,
      });
      setName(""); setDescription("");
      toast.success("Template saved");
      refresh();
    } catch { toast.error("Save failed"); } finally { setBusy(false); }
  };

  const removeTemplate = async (id) => {
    try {
      await axios.delete(`${API}/templates/${id}`);
      setTemplates((t) => t.filter((x) => x.id !== id));
      toast.success("Deleted");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Delete failed");
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#1C1A15] border border-[#332D22] text-[#F1EDE2] max-w-3xl max-h-[85vh] overflow-y-auto" data-testid="templates-modal">
        <DialogHeader><DialogTitle>Project templates</DialogTitle></DialogHeader>
        <div className="space-y-5">

          {/* Search + filter */}
          <div className="flex flex-col gap-2">
            <div className="relative">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#948C79]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, description or aesthetic…"
                className="w-full bg-[#15130E] border border-[#332D22] rounded pl-6 pr-6 py-1.5 text-xs text-[#F1EDE2] outline-none focus:border-[#C9A227]"
                data-testid="tpl-search"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#948C79] hover:text-[#F1EDE2]"
                  data-testid="tpl-search-clear"
                ><X size={12} /></button>
              )}
            </div>
            <div className="flex flex-wrap gap-1" data-testid="aesthetic-filter">
              <button
                onClick={() => setAestheticFilter("")}
                className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${aestheticFilter === "" ? "border-[#C9A227] bg-[#C9A227]/20 text-[#F1EDE2]" : "border-[#332D22] bg-[#15130E] text-[#A79C87] hover:border-[#C9A227]/60"}`}
                data-testid="aesthetic-all"
              >All · {templates.filter((t) => t.is_starter).length}</button>
              {aesthetics.map((a) => (
                <button
                  key={a}
                  onClick={() => setAestheticFilter(a === aestheticFilter ? "" : a)}
                  className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${aestheticFilter === a ? "border-amber-400 bg-amber-400/15 text-[#F1EDE2]" : "border-[#332D22] bg-[#15130E] text-[#A79C87] hover:border-amber-400/60"}`}
                  data-testid={`aesthetic-${a}`}
                >{a}</button>
              ))}
            </div>
          </div>

          {/* Starter Gallery */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={13} className="text-amber-400" />
              <div className="text-[11px] uppercase tracking-widest text-[#A79C87]">Starter gallery · aesthetics</div>
              <div className="text-[10px] text-[#6B6353]">{starters.length} showing</div>
            </div>
            <div className="grid grid-cols-3 gap-2" data-testid="starter-gallery">
              {starters.map((t) => (
                <StarterCard key={t.id} tpl={t} onPreview={(tpl) => setPreviewTpl(tpl)} />
              ))}
            </div>
            {starters.length === 0 && (
              <div className="text-[11px] text-[#948C79] py-6 text-center border border-dashed border-[#332D22] rounded">No aesthetics match your search.</div>
            )}
          </div>

          {/* User templates */}
          <div>
            <div className="text-[11px] uppercase tracking-widest text-[#A79C87] mb-2 flex items-center gap-2">
              <Bookmark size={13} className="text-[#D9BC55]" /> Your templates
            </div>
            {userTemplates.length === 0 && <div className="text-[11px] text-[#948C79] py-4 text-center border border-dashed border-[#332D22] rounded">No custom templates yet — save your current project below.</div>}
            {userTemplates.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {userTemplates.map((t) => (
                  <UserTemplateRow
                    key={t.id}
                    tpl={t}
                    onUse={(tpl) => { onLoadTemplate(tpl); onClose(); }}
                    onDelete={removeTemplate}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Save current project as template */}
          <div className="p-3 rounded border border-[#332D22] bg-[#15130E] space-y-2">
            <div className="text-[10px] uppercase tracking-wider text-[#948C79]">Save current project as template</div>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Template name" className="w-full bg-[#15130E] border border-[#332D22] rounded px-2 py-1.5 text-xs text-[#F1EDE2] outline-none focus:border-[#C9A227]" data-testid="tpl-name" />
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" className="w-full bg-[#15130E] border border-[#332D22] rounded px-2 py-1.5 text-xs text-[#F1EDE2] outline-none focus:border-[#C9A227]" data-testid="tpl-desc" />
            <button onClick={saveTemplate} disabled={busy} className="w-full text-xs py-1.5 rounded bg-[#AD8B21] hover:bg-[#C9A227] disabled:opacity-50 text-[#F1EDE2]" data-testid="tpl-save">
              {busy ? "Saving…" : "Save as template"}
            </button>
          </div>

          <div className="flex justify-end">
            <button onClick={onClose} className="text-xs px-3 py-1.5 rounded bg-[#AD8B21] hover:bg-[#C9A227] text-[#F1EDE2]" data-testid="tpl-close">Close</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <TemplatePreviewModal
      tpl={previewTpl}
      onClose={() => setPreviewTpl(null)}
      onUse={(tpl) => {
        setPreviewTpl(null);
        onLoadTemplate(tpl);
        onClose();
      }}
    />
    </>
  );
};
