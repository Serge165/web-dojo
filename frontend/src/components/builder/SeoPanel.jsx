import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const FIELDS = [
  { key: "title", label: "Title", placeholder: "Page title", type: "text" },
  { key: "description", label: "Description", placeholder: "A short summary that appears in search results.", type: "textarea" },
  { key: "keywords", label: "Keywords", placeholder: "comma, separated, keywords", type: "text" },
  { key: "canonical", label: "Canonical URL", placeholder: "https://example.com/page", type: "text" },
  { key: "favicon", label: "Favicon URL", placeholder: "/favicon.ico", type: "text" },
  { key: "og_title", label: "OG Title", placeholder: "Same as title if empty", type: "text" },
  { key: "og_description", label: "OG Description", placeholder: "Same as description if empty", type: "textarea" },
  { key: "og_image", label: "OG Image URL", placeholder: "https://…/social-share.png", type: "text" },
  { key: "twitter_card", label: "Twitter Card", placeholder: "summary_large_image", type: "text" },
];

export const SeoPanel = ({ open, onClose, seo, onChange, pageName }) => {
  const s = seo || {};
  const update = (patch) => onChange({ ...s, ...patch });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#141414] border border-[#2B2B2B] text-white max-w-2xl max-h-[85vh] overflow-y-auto" data-testid="seo-panel">
        <DialogHeader><DialogTitle>SEO · {pageName || "Page"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">{f.label}</label>
              {f.type === "textarea" ? (
                <textarea
                  value={s[f.key] || ""}
                  onChange={(e) => update({ [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  rows={3}
                  className="w-full bg-[#0D0D0D] border border-[#2B2B2B] rounded px-2 py-1.5 text-xs text-white outline-none focus:border-blue-500 resize-y"
                  data-testid={`seo-${f.key}`}
                />
              ) : (
                <input
                  value={s[f.key] || ""}
                  onChange={(e) => update({ [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  className="w-full bg-[#0D0D0D] border border-[#2B2B2B] rounded px-2 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                  data-testid={`seo-${f.key}`}
                />
              )}
            </div>
          ))}
          <div className="pt-2 border-t border-[#2B2B2B]">
            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Live preview (search snippet)</div>
            <div className="rounded border border-[#2B2B2B] bg-[#0D0D0D] p-3">
              <div className="text-[13px] text-blue-400 truncate">{s.title || pageName || "Page title"}</div>
              <div className="text-[11px] text-emerald-500 font-mono truncate">{s.canonical || "https://example.com/"}</div>
              <div className="text-[12px] text-gray-400 line-clamp-2">{s.description || "A short summary that appears in search results."}</div>
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <button onClick={onClose} className="text-xs px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white" data-testid="seo-close">Done</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
