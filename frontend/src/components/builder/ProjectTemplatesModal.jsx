import React, { useEffect, useState } from "react";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Two-mode modal: save the current project as a starter template, or start a
// new project from an existing template.
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
    } catch { toast.error("Delete failed"); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#141414] border border-[#2B2B2B] text-white max-w-2xl max-h-[85vh] overflow-y-auto" data-testid="templates-modal">
        <DialogHeader><DialogTitle>Project templates</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="p-3 rounded border border-[#2B2B2B] bg-[#0D0D0D] space-y-2">
            <div className="text-[10px] uppercase tracking-wider text-gray-500">Save current project as template</div>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Template name" className="w-full bg-[#0D0D0D] border border-[#2B2B2B] rounded px-2 py-1.5 text-xs text-white outline-none focus:border-blue-500" data-testid="tpl-name" />
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" className="w-full bg-[#0D0D0D] border border-[#2B2B2B] rounded px-2 py-1.5 text-xs text-white outline-none focus:border-blue-500" data-testid="tpl-desc" />
            <button onClick={saveTemplate} disabled={busy} className="w-full text-xs py-1.5 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white" data-testid="tpl-save">
              {busy ? "Saving…" : "Save as template"}
            </button>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Start a new project from…</div>
            {templates.length === 0 && <div className="text-[11px] text-gray-500 py-4 text-center">No templates yet.</div>}
            <div className="grid grid-cols-2 gap-2">
              {templates.map((t) => (
                <div key={t.id} className="p-3 rounded border border-[#2B2B2B] bg-[#0D0D0D] hover:border-blue-500/60" data-testid={`tpl-row-${t.id}`}>
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{t.name}</div>
                      <div className="text-[11px] text-gray-500 line-clamp-2">{t.description || "—"}</div>
                    </div>
                    <button onClick={() => removeTemplate(t.id)} className="p-1 text-gray-500 hover:text-red-400" data-testid={`tpl-del-${t.id}`}><Trash2 size={12} /></button>
                  </div>
                  <button
                    onClick={() => { onLoadTemplate(t); onClose(); }}
                    className="mt-2 w-full text-xs py-1 rounded bg-[#1F1F1F] hover:bg-[#2B2B2B] text-gray-200 border border-[#2B2B2B]"
                    data-testid={`tpl-use-${t.id}`}
                  >Use template</button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={onClose} className="text-xs px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white">Close</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
