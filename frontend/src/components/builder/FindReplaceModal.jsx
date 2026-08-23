import React, { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const SCOPES = [
  { id: "current", label: "Current page" },
  { id: "all", label: "All pages" },
  { id: "head", label: "Head + template" },
  { id: "files", label: "Project files" },
];

const buildRegex = (find, regex, caseSensitive) => {
  if (!find) return null;
  const flags = "g" + (caseSensitive ? "" : "i");
  try {
    return new RegExp(regex ? find : find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), flags);
  } catch (e) {
    return null;
  }
};

// Bulk find/replace across pages, head_html, template header/footer, and file contents.
export const FindReplaceModal = ({
  open, onClose,
  pages, activePageId, onSetPages,
  headHtml, onSetHeadHtml,
  template, onSetTemplate,
  files, onSetFiles,
}) => {
  const [find, setFind] = useState("");
  const [repl, setRepl] = useState("");
  const [scope, setScope] = useState("all");
  const [regex, setRegex] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);

  const re = useMemo(() => buildRegex(find, regex, caseSensitive), [find, regex, caseSensitive]);

  const matches = useMemo(() => {
    if (!re) return 0;
    let count = 0;
    const scan = (s) => { if (typeof s === "string") { const m = s.match(re); count += m ? m.length : 0; } };
    if (scope === "current" || scope === "all") {
      pages.forEach((p) => {
        if (scope === "current" && p.id !== activePageId) return;
        (p.elements || []).forEach((el) => scan(el.html));
        scan(p.head_html);
      });
    }
    if (scope === "head") {
      scan(headHtml);
      scan(template?.header_html);
      scan(template?.footer_html);
    }
    if (scope === "files") {
      (files || []).forEach((f) => scan(f.content));
    }
    return count;
  }, [re, scope, pages, activePageId, headHtml, template, files]);

  const doReplace = () => {
    if (!re) { toast.error("Invalid pattern"); return; }
    let changed = 0;
    const rep = (s) => {
      if (typeof s !== "string") return s;
      const before = s;
      const after = s.replace(re, repl);
      if (after !== before) changed += (before.match(re) || []).length;
      return after;
    };

    if (scope === "current" || scope === "all") {
      const nextPages = pages.map((p) => {
        if (scope === "current" && p.id !== activePageId) return p;
        return {
          ...p,
          elements: (p.elements || []).map((el) => ({ ...el, html: rep(el.html) })),
          head_html: rep(p.head_html || ""),
        };
      });
      onSetPages(nextPages);
    }
    if (scope === "head") {
      onSetHeadHtml(rep(headHtml || ""));
      onSetTemplate({ ...template, header_html: rep(template?.header_html || ""), footer_html: rep(template?.footer_html || "") });
    }
    if (scope === "files") {
      onSetFiles((files || []).map((f) => ({ ...f, content: rep(f.content || "") })));
    }
    toast.success(`Replaced ${changed} occurrence${changed === 1 ? "" : "s"}`);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#1C1A15] border border-[#332D22] text-[#F1EDE2] max-w-xl" data-testid="find-replace-modal">
        <DialogHeader><DialogTitle>Find &amp; Replace</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#948C79] block mb-1">Find</label>
              <input value={find} onChange={(e) => setFind(e.target.value)} className="w-full bg-[#15130E] border border-[#332D22] rounded px-2 py-1.5 text-xs font-mono text-[#F1EDE2] outline-none focus:border-[#C9A227]" data-testid="fr-find" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#948C79] block mb-1">Replace with</label>
              <input value={repl} onChange={(e) => setRepl(e.target.value)} className="w-full bg-[#15130E] border border-[#332D22] rounded px-2 py-1.5 text-xs font-mono text-[#F1EDE2] outline-none focus:border-[#C9A227]" data-testid="fr-repl" />
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-[#948C79] block mb-1">Scope</label>
            <div className="grid grid-cols-4 gap-1.5">
              {SCOPES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setScope(s.id)}
                  className={`text-[11px] py-1.5 rounded border ${scope === s.id ? "border-[#C9A227] bg-[#2A2416] text-[#F1EDE2]" : "border-[#332D22] bg-[#242019] text-[#F1EDE2] hover:bg-[#332D22]"}`}
                  data-testid={`fr-scope-${s.id}`}
                >{s.label}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs text-[#E4DECE]"><input type="checkbox" checked={regex} onChange={(e) => setRegex(e.target.checked)} data-testid="fr-regex" />Regex</label>
            <label className="flex items-center gap-2 text-xs text-[#E4DECE]"><input type="checkbox" checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)} data-testid="fr-case" />Case sensitive</label>
            <div className="ml-auto text-[11px] text-[#A79C87]" data-testid="fr-matches">{matches} match{matches === 1 ? "" : "es"}</div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="text-xs px-3 py-1.5 rounded bg-[#242019] hover:bg-[#332D22] text-[#F1EDE2] border border-[#332D22]">Close</button>
            <button onClick={doReplace} className="text-xs px-3 py-1.5 rounded bg-[#AD8B21] hover:bg-[#C9A227] text-[#F1EDE2]" data-testid="fr-apply">Replace all</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
