import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

/**
 * TemplateApplyModal — lets the user choose how to apply a selected template:
 *   "Wrap" (merge styles into current project, keep existing blocks)
 *   "New"  (create a fresh project from the template, discarding current work)
 *
 * Props:
 *   template  — the template object being applied (has .name, .data)
 *   onWrap    — callback with (template) when user picks "wrap"
 *   onNew     — callback with (template) when user picks "new"
 *   onCancel  — callback with no arguments when user cancels
 */
export const TemplateApplyModal = ({ template, onWrap, onNew, onCancel }) => {
  if (!template) return null;

  return (
    <Dialog open={!!template} onOpenChange={(open) => { if (!open) onCancel(); }}>
      <DialogContent className="bg-[#1C1A15] border border-[#332D22] text-[#F1EDE2] max-w-md" data-testid="template-apply-modal">
        <div className="p-4 space-y-4">
          <h2 className="text-sm font-semibold text-[#F1EDE2]">
            Apply Template: {template.name}
          </h2>
          <p className="text-[11px] text-[#948C79]">
            How would you like to apply this template?
          </p>

          <div className="space-y-2">
            {/* Wrap option */}
            <button
              onClick={() => onWrap(template)}
              className="w-full text-left p-3 rounded border border-[#332D22] bg-[#242019] hover:bg-[#332D22] transition-colors"
              data-testid="template-apply-wrap"
            >
              <div className="text-xs font-medium text-[#F1EDE2]">Wrap to Current Project</div>
              <div className="text-[10px] text-[#948C79] mt-1">
                Keep your existing blocks, apply template styles and CSS variables
              </div>
            </button>

            {/* New project option */}
            <button
              onClick={() => onNew(template)}
              className="w-full text-left p-3 rounded border border-[#332D22] bg-[#242019] hover:bg-[#332D22] transition-colors"
              data-testid="template-apply-new"
            >
              <div className="text-xs font-medium text-[#F1EDE2]">Create New Project</div>
              <div className="text-[10px] text-[#948C79] mt-1">
                Start fresh from this template (current project will be discarded)
              </div>
            </button>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={onCancel}
              className="text-xs px-3 py-1.5 rounded bg-[#AD8B21] hover:bg-[#C9A227] text-[#F1EDE2]"
              data-testid="template-apply-cancel"
            >
              Cancel
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateApplyModal;