import React, { useEffect, useState } from "react";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, UploadCloud } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const AnalyticsModal = ({ open, onClose, projectId, projectName }) => {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !projectId) return;
    setBusy(true);
    axios.get(`${API}/projects/${projectId}/analytics`).then((r) => setData(r.data)).catch(() => setData(null)).finally(() => setBusy(false));
  }, [open, projectId]);

  const max = Math.max(1, ...(data?.by_day || []).map((d) => d.count));

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#141414] border border-[#2B2B2B] text-white max-w-xl" data-testid="analytics-modal">
        <DialogHeader><DialogTitle>Analytics · {projectName}</DialogTitle></DialogHeader>
        {!projectId && <div className="text-xs text-gray-400">Save the project first to view analytics.</div>}
        {busy && <div className="text-xs text-gray-400">Loading…</div>}
        {data && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded border border-[#2B2B2B] bg-[#0D0D0D]">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-gray-500"><Eye size={12} /> Preview views</div>
                <div className="text-3xl font-semibold mt-1" data-testid="analytics-views">{data.total_views}</div>
              </div>
              <div className="p-3 rounded border border-[#2B2B2B] bg-[#0D0D0D]">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-gray-500"><UploadCloud size={12} /> Publishes</div>
                <div className="text-3xl font-semibold mt-1" data-testid="analytics-publishes">{data.total_publishes}</div>
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Views · last {data.by_day.length} day{data.by_day.length === 1 ? "" : "s"}</div>
              <div className="flex items-end gap-1 h-24 p-2 border border-[#2B2B2B] rounded bg-[#0D0D0D]" data-testid="analytics-chart">
                {(data.by_day.length ? data.by_day : [{ day: "—", count: 0 }]).map((d) => (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-1" title={`${d.day}: ${d.count}`}>
                    <div className="w-full bg-blue-500 rounded-sm" style={{ height: `${(d.count / max) * 100}%`, minHeight: 2 }} />
                    <div className="text-[9px] text-gray-500 font-mono">{d.day.slice(5)}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Recent events</div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {data.recent.length === 0 && <div className="text-[11px] text-gray-500">Nothing yet — share your preview URL to start collecting views.</div>}
                {data.recent.map((ev, i) => (
                  <div key={i} className="text-[11px] font-mono text-gray-300 flex gap-2 px-2 py-1 rounded bg-[#0D0D0D] border border-[#2B2B2B]">
                    <span className="text-gray-500 min-w-[100px]">{(ev.ts || "").slice(0, 16).replace("T", " ")}</span>
                    <span className={ev.event === "publish" ? "text-emerald-400" : "text-blue-400"}>{ev.event}</span>
                    {ev.host && <span className="truncate">→ {ev.host}{ev.path || ""}</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="flex justify-end pt-1">
          <button onClick={onClose} className="text-xs px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white" data-testid="analytics-close">Done</button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
