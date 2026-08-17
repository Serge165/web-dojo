import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Inbox, RefreshCw, Trash2, Mail, FileText, ExternalLink } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Lightweight form-backend inbox. Every form built in Web Dojo posts here, so
// deployed/previewed demo sites capture real submissions the user can read.
export const SubmissionsModal = ({ open, onClose }) => {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [group, setGroup] = useState("__all__");

  const load = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API}/submissions`);
      setSubs(r.data || []);
    } catch { toast.error("Failed to load submissions"); }
    setLoading(false);
  };

  useEffect(() => { if (open) { load(); setGroup("__all__"); } }, [open]);

  const groups = useMemo(() => {
    const m = new Map();
    subs.forEach((s) => {
      const k = s.form_name || "Untitled form";
      m.set(k, (m.get(k) || 0) + 1);
    });
    return Array.from(m.entries()).map(([name, count]) => ({ name, count }));
  }, [subs]);

  const visible = useMemo(
    () => (group === "__all__" ? subs : subs.filter((s) => (s.form_name || "Untitled form") === group)),
    [subs, group]
  );

  const del = async (id) => {
    try {
      await axios.delete(`${API}/submissions/${id}`);
      setSubs((s) => s.filter((x) => x.id !== id));
      toast.success("Submission deleted");
    } catch { toast.error("Delete failed"); }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#141414] border border-[#2B2B2B] text-white max-w-5xl w-[92vw] max-h-[86vh] overflow-hidden p-0" data-testid="submissions-modal">
        <DialogHeader className="px-5 pt-4 pb-3 border-b border-[#2B2B2B]">
          <DialogTitle className="flex items-center gap-2 text-base"><Inbox size={16} className="text-blue-400" /> Form submissions inbox</DialogTitle>
          <DialogDescription className="text-xs text-gray-500">Every form you build posts here automatically — deployed and previewed demo sites capture real entries.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-[220px_1fr] max-h-[calc(86vh-76px)]">
          {/* Form groups */}
          <div className="border-r border-[#2B2B2B] overflow-y-auto p-2 space-y-1">
            <div className="flex items-center justify-between px-1 pb-1">
              <span className="text-[10px] uppercase tracking-widest text-gray-500">Forms</span>
              <button onClick={load} className="p-1 rounded hover:bg-[#1F1F1F] text-gray-400" title="Refresh" data-testid="submissions-refresh">
                <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
            <button
              onClick={() => setGroup("__all__")}
              className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs ${group === "__all__" ? "bg-blue-600/20 border border-blue-500/60 text-white" : "text-gray-300 hover:bg-[#1F1F1F] border border-transparent"}`}
              data-testid="submission-group-all"
            >
              <span className="flex items-center gap-2"><Mail size={12} /> All</span>
              <span className="text-[10px] font-mono text-gray-500">{subs.length}</span>
            </button>
            {groups.map((g) => (
              <button
                key={g.name}
                onClick={() => setGroup(g.name)}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs ${group === g.name ? "bg-blue-600/20 border border-blue-500/60 text-white" : "text-gray-300 hover:bg-[#1F1F1F] border border-transparent"}`}
                data-testid={`submission-group-${g.name}`}
              >
                <span className="flex items-center gap-2 truncate"><FileText size={12} className="shrink-0" /> <span className="truncate">{g.name}</span></span>
                <span className="text-[10px] font-mono text-gray-500 shrink-0">{g.count}</span>
              </button>
            ))}
          </div>

          {/* Entries */}
          <div className="overflow-y-auto p-4 space-y-3">
            {!loading && visible.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center py-16" data-testid="submissions-empty">
                <Inbox size={40} className="text-gray-700 mb-3" />
                <div className="text-sm text-gray-300 font-medium">No submissions yet</div>
                <div className="text-xs text-gray-500 mt-1 max-w-sm leading-relaxed">
                  Build a form (Forms tab → Open form builder) and insert it. When visitors submit it on your published or previewed site, entries land here.
                </div>
              </div>
            )}
            {visible.map((s) => (
              <div key={s.id} className="rounded-lg border border-[#2B2B2B] bg-[#0D0D0D] p-3" data-testid={`submission-row-${s.id}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-1.5 py-0.5 rounded bg-blue-600/20 text-blue-300 border border-blue-500/30 text-[10px]">{s.form_name || "Untitled form"}</span>
                    <span className="text-gray-500 font-mono text-[10px]">{new Date(s.created_at).toLocaleString()}</span>
                  </div>
                  <button onClick={() => del(s.id)} className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-[#1F1F1F]" title="Delete" data-testid={`submission-delete-${s.id}`}><Trash2 size={13} /></button>
                </div>
                <div className="grid grid-cols-[120px_1fr] gap-x-3 gap-y-1 text-xs">
                  {Object.entries(s.data || {}).map(([k, v]) => (
                    <React.Fragment key={k}>
                      <div className="text-gray-500 font-mono truncate">{k}</div>
                      <div className="text-gray-200 break-words whitespace-pre-wrap">{Array.isArray(v) ? v.join(", ") : String(v)}</div>
                    </React.Fragment>
                  ))}
                </div>
                {s.page_url && (
                  <a href={s.page_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] text-gray-500 hover:text-blue-400 mt-2 font-mono">
                    <ExternalLink size={10} /> {s.page_title || s.page_url}
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
