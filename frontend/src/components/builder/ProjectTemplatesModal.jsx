import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Trash2, Sparkles, Bookmark } from "lucide-react";

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
};

const StarterCard = ({ tpl, onUse }) => {
  const preview = AESTHETIC_PREVIEWS[tpl.aesthetic] || { bg: "#1F1F1F", fg: "#ffffff" };
  return (
    <button
      onClick={() => onUse(tpl)}
      className="text-left rounded-lg border border-[#2B2B2B] bg-[#0D0D0D] hover:border-blue-500/60 overflow-hidden transition-colors"
      data-testid={`tpl-use-${tpl.id}`}
    >
      <div
        className="h-24 flex items-end p-3"
        style={{ background: preview.bg, border: preview.border }}
      >
        <span
          style={{ color: preview.fg }}
          className="text-[11px] font-semibold uppercase tracking-widest opacity-90"
        >{tpl.aesthetic}</span>
      </div>
      <div className="p-3">
        <div className="flex items-center gap-1.5 text-sm text-white truncate">
          <Sparkles size={11} className="text-amber-400 shrink-0" />
          {tpl.name}
        </div>
        <div className="text-[11px] text-gray-500 line-clamp-2 mt-1">{tpl.description || "—"}</div>
      </div>
    </button>
  );
};

const UserTemplateRow = ({ tpl, onUse, onDelete }) => (
  <div className="p-3 rounded border border-[#2B2B2B] bg-[#0D0D0D] hover:border-blue-500/60" data-testid={`tpl-row-${tpl.id}`}>
    <div className="flex items-start gap-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-sm text-white truncate">
          <Bookmark size={11} className="text-blue-400 shrink-0" />
          {tpl.name}
        </div>
        <div className="text-[11px] text-gray-500 line-clamp-2">{tpl.description || "—"}</div>
      </div>
      <button onClick={() => onDelete(tpl.id)} className="p-1 text-gray-500 hover:text-red-400" data-testid={`tpl-del-${tpl.id}`}><Trash2 size={12} /></button>
    </div>
    <button
      onClick={() => onUse(tpl)}
      className="mt-2 w-full text-xs py-1 rounded bg-[#1F1F1F] hover:bg-[#2B2B2B] text-gray-200 border border-[#2B2B2B]"
      data-testid={`tpl-use-${tpl.id}`}
    >Use template</button>
  </div>
);

// Two-mode modal: save the current project as a starter template, or start a
// new project from an existing template (including 15 built-in aesthetics).
export const ProjectTemplatesModal = ({ open, onClose, currentProject, onLoadTemplate }) => {
  const [templates, setTemplates] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (open) refresh(); }, [open]);

  const refresh = async () => {
    try {
      const r = await axios.get(`${API}/templates`);
      setTemplates(r.data);
    } catch { toast.error("Failed to load templates"); }
  };

  const { starters, userTemplates } = useMemo(() => {
    const starters = templates.filter((t) => t.is_starter);
    const userTemplates = templates.filter((t) => !t.is_starter);
    return { starters, userTemplates };
  }, [templates]);

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
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#141414] border border-[#2B2B2B] text-white max-w-3xl max-h-[85vh] overflow-y-auto" data-testid="templates-modal">
        <DialogHeader><DialogTitle>Project templates</DialogTitle></DialogHeader>
        <div className="space-y-5">

          {/* Starter Gallery */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={13} className="text-amber-400" />
              <div className="text-[11px] uppercase tracking-widest text-gray-400">Starter gallery · aesthetics</div>
              <div className="text-[10px] text-gray-600">{starters.length} built-in</div>
            </div>
            <div className="grid grid-cols-3 gap-2" data-testid="starter-gallery">
              {starters.map((t) => (
                <StarterCard key={t.id} tpl={t} onUse={(tpl) => { onLoadTemplate(tpl); onClose(); }} />
              ))}
            </div>
          </div>

          {/* User templates */}
          <div>
            <div className="text-[11px] uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-2">
              <Bookmark size={13} className="text-blue-400" /> Your templates
            </div>
            {userTemplates.length === 0 && <div className="text-[11px] text-gray-500 py-4 text-center border border-dashed border-[#2B2B2B] rounded">No custom templates yet — save your current project below.</div>}
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
          <div className="p-3 rounded border border-[#2B2B2B] bg-[#0D0D0D] space-y-2">
            <div className="text-[10px] uppercase tracking-wider text-gray-500">Save current project as template</div>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Template name" className="w-full bg-[#0D0D0D] border border-[#2B2B2B] rounded px-2 py-1.5 text-xs text-white outline-none focus:border-blue-500" data-testid="tpl-name" />
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" className="w-full bg-[#0D0D0D] border border-[#2B2B2B] rounded px-2 py-1.5 text-xs text-white outline-none focus:border-blue-500" data-testid="tpl-desc" />
            <button onClick={saveTemplate} disabled={busy} className="w-full text-xs py-1.5 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white" data-testid="tpl-save">
              {busy ? "Saving…" : "Save as template"}
            </button>
          </div>

          <div className="flex justify-end">
            <button onClick={onClose} className="text-xs px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white" data-testid="tpl-close">Close</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
