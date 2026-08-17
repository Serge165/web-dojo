import React, { useMemo, useState } from "react";
import { CDN_LIBRARIES, CDN_CATEGORIES, isLibInHead, toggleLib } from "@/lib/cdns";
import { Check, Plus, Copy } from "lucide-react";
import { toast } from "sonner";

export const CDNPanel = ({ headHtml, onHeadHtmlChange }) => {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("css");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return CDN_LIBRARIES.filter((l) => l.category === cat && (!query || l.label.toLowerCase().includes(query)));
  }, [q, cat]);

  const doToggle = (lib) => {
    onHeadHtmlChange(toggleLib(headHtml || "", lib));
    toast.success(`${isLibInHead(headHtml, lib.id) ? "Removed" : "Added"} ${lib.label}`);
  };

  return (
    <div className="space-y-3" data-testid="cdn-panel">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search libraries…"
        className="w-full bg-[#0D0D0D] border border-[#2B2B2B] rounded px-2 py-1.5 text-xs text-white outline-none focus:border-blue-500"
        data-testid="cdn-search"
      />
      <div className="grid grid-cols-3 gap-1.5">
        {CDN_CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            className={`text-[11px] py-1.5 rounded border ${cat === c.id ? "border-blue-500 bg-[#111623] text-white" : "border-[#2B2B2B] bg-[#1F1F1F] text-gray-200 hover:bg-[#2B2B2B]"}`}
            data-testid={`cdn-cat-${c.id}`}
          >{c.label}</button>
        ))}
      </div>
      <div className="space-y-1.5 max-h-[520px] overflow-y-auto pr-1">
        {filtered.map((lib) => {
          const active = isLibInHead(headHtml || "", lib.id);
          return (
            <div
              key={lib.id}
              className={`p-2 rounded border ${active ? "border-emerald-500/60 bg-emerald-500/5" : "border-[#2B2B2B] bg-[#0D0D0D]"}`}
              data-testid={`cdn-row-${lib.id}`}
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={() => doToggle(lib)}
                  className={`w-5 h-5 rounded flex items-center justify-center border ${active ? "bg-emerald-500 border-emerald-500 text-white" : "border-[#2B2B2B] text-gray-400 hover:text-white"}`}
                  data-testid={`cdn-toggle-${lib.id}`}
                >{active ? <Check size={12} /> : <Plus size={12} />}</button>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white truncate">{lib.label}</div>
                  {lib.note && <div className="text-[10px] text-gray-500 truncate">{lib.note}</div>}
                </div>
                {lib.example && (
                  <button
                    onClick={() => { navigator.clipboard.writeText(lib.example); toast.success("Snippet copied"); }}
                    className="p-1 text-gray-400 hover:text-white"
                    title={`Copy example: ${lib.example}`}
                    data-testid={`cdn-copy-${lib.id}`}
                  ><Copy size={11} /></button>
                )}
              </div>
              {lib.example && active && (
                <div className="mt-1.5 pl-7 text-[10px] font-mono text-gray-400 truncate" title={lib.example}>{lib.example}</div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && <div className="text-[11px] text-gray-500 text-center py-4">No libraries match.</div>}
      </div>
    </div>
  );
};
