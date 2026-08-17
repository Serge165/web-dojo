import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CodeEditor } from "./CodeEditor";

// Site-wide template: a shared header + footer that wraps every page when
// enabled. Stored on the project as { header_html, footer_html, use_template }.
export const TemplateEditor = ({ open, onClose, template, onChange }) => {
  const t = template || { header_html: "", footer_html: "", use_template: false };
  const update = (patch) => onChange({ ...t, ...patch });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#141414] border border-[#2B2B2B] text-white max-w-3xl" data-testid="template-editor">
        <DialogHeader><DialogTitle>Site-wide template</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-xs text-gray-300">
            <input
              type="checkbox"
              checked={!!t.use_template}
              onChange={(e) => update({ use_template: e.target.checked })}
              data-testid="template-toggle"
            />
            Wrap every page with this template
          </label>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Header HTML</div>
            <div className="h-40 rounded border border-[#2B2B2B] overflow-hidden">
              <CodeEditor
                value={t.header_html || ""}
                onChange={(v) => update({ header_html: v })}
                language="html"
                testId="template-header"
              />
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Footer HTML</div>
            <div className="h-40 rounded border border-[#2B2B2B] overflow-hidden">
              <CodeEditor
                value={t.footer_html || ""}
                onChange={(v) => update({ footer_html: v })}
                language="html"
                testId="template-footer"
              />
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <button onClick={onClose} className="text-xs px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white" data-testid="template-close">Done</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
