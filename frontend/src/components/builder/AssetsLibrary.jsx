import React, { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { analyzeAssets, replaceToken } from "@/lib/assetsAnalyzer";
import { toast } from "sonner";

export const AssetsLibrary = ({ open, onClose, project, onReplace }) => {
  const stats = useMemo(() => (open ? analyzeAssets(project) : { colors: [], fonts: [], spacing: [] }), [open, project]);
  const [tab, setTab] = useState("colors");

  const doRename = (oldVal, kind) => {
    const next = prompt(`Rename ${kind} “${oldVal}” to`, oldVal);
    if (!next || next === oldVal) return;
    onReplace(replaceToken(project, oldVal, next));
    toast.success(`Renamed ${kind} across project`);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#141414] border border-[#2B2B2B] text-white max-w-2xl max-h-[85vh] overflow-y-auto" data-testid="assets-library">
        <DialogHeader><DialogTitle>Design tokens</DialogTitle></DialogHeader>
        <div className="grid grid-cols-3 gap-1.5 mb-3">
          {["colors", "fonts", "spacing"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-xs py-1.5 rounded border capitalize ${tab === t ? "border-blue-500 bg-[#111623] text-white" : "border-[#2B2B2B] bg-[#1F1F1F] text-gray-200 hover:bg-[#2B2B2B]"}`}
              data-testid={`assets-tab-${t}`}
            >{t} · {stats[t].length}</button>
          ))}
        </div>

        {tab === "colors" && (
          <div className="grid grid-cols-4 gap-2" data-testid="assets-colors">
            {stats.colors.length === 0 && <div className="col-span-4 text-[11px] text-gray-500 py-4 text-center">No colors detected yet.</div>}
            {stats.colors.map((c) => (
              <button
                key={c.value}
                onClick={() => doRename(c.value, "color")}
                className="p-2 rounded border border-[#2B2B2B] bg-[#0D0D0D] hover:border-blue-500/60 text-left"
                data-testid={`asset-color-${c.value}`}
              >
                <div className="w-full h-10 rounded" style={{ background: c.value }} />
                <div className="text-[11px] font-mono text-gray-200 mt-1">{c.value}</div>
                <div className="text-[10px] text-gray-500">{c.count}×</div>
              </button>
            ))}
          </div>
        )}

        {tab === "fonts" && (
          <div className="space-y-1.5" data-testid="assets-fonts">
            {stats.fonts.length === 0 && <div className="text-[11px] text-gray-500 py-4 text-center">No fonts detected yet.</div>}
            {stats.fonts.map((f) => (
              <button
                key={f.value}
                onClick={() => doRename(f.value, "font")}
                className="w-full flex items-center gap-3 p-2 rounded border border-[#2B2B2B] bg-[#0D0D0D] hover:border-blue-500/60 text-left"
                data-testid={`asset-font-${f.value}`}
              >
                <div style={{ fontFamily: `'${f.value}', sans-serif`, fontSize: 20 }} className="text-white">Aa</div>
                <div className="flex-1">
                  <div className="text-xs text-white">{f.value}</div>
                  <div className="text-[10px] text-gray-500">{f.count}×</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {tab === "spacing" && (
          <div className="grid grid-cols-3 gap-2" data-testid="assets-spacing">
            {stats.spacing.length === 0 && <div className="col-span-3 text-[11px] text-gray-500 py-4 text-center">No spacing values detected yet.</div>}
            {stats.spacing.map((s) => (
              <button
                key={s.value}
                onClick={() => doRename(s.value, "spacing")}
                className="p-2 rounded border border-[#2B2B2B] bg-[#0D0D0D] hover:border-blue-500/60 text-left"
                data-testid={`asset-spacing-${s.value}`}
              >
                <div className="text-xs font-mono text-white">{s.value}</div>
                <div className="text-[10px] text-gray-500">{s.count}×</div>
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-3">
          <button onClick={onClose} className="text-xs px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white" data-testid="assets-close">Done</button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
