import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sparkles, FilePlus2, LayoutTemplate, Wand2 } from "lucide-react";

// Three ways to start a new project: a blank canvas, fork a bundled starter
// template, or run the New File wizard (template + SEO + a real css/js/imgs
// file tree). Mirrors AddPageModal's card styling. The unsaved-changes guard
// is handled by the caller (Builder.newProject) before this opens, so every
// option here is a clean start.
export const NewProjectModal = ({ open, onClose, onBlank, onFromTemplate, onFromWizard }) => {
  const cards = [
    { key: "blank", title: "Blank project", desc: "Start on an empty canvas.", icon: FilePlus2, run: onBlank, testId: "new-project-blank" },
    { key: "template", title: "From template", desc: "Fork a bundled starter template.", icon: LayoutTemplate, run: onFromTemplate, testId: "new-project-template" },
    { key: "wizard", title: "New File wizard", desc: "Template + SEO + scaffolded css/ js/ imgs/ files.", icon: Wand2, run: onFromWizard, testId: "new-project-wizard" },
  ];
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#1C1A15] border border-[#332D22] text-[#F1EDE2] max-w-lg p-0" data-testid="new-project-modal">
        <DialogHeader className="px-5 pt-4 pb-3 border-b border-[#332D22]">
          <DialogTitle className="flex items-center gap-2 text-base"><Sparkles size={16} className="text-indigo-400" /> New project</DialogTitle>
          <DialogDescription className="sr-only">Choose how to start a new project.</DialogDescription>
        </DialogHeader>
        <div className="p-3 space-y-2">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.key}
                onClick={() => { c.run(); onClose(); }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg border border-[#332D22] bg-[#15130E] text-left hover:border-indigo-500 hover:bg-[#1C1A15] transition-colors"
                data-testid={c.testId}
              >
                <span className="shrink-0 text-indigo-400"><Icon size={18} /></span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-[#F1EDE2]">{c.title}</span>
                  <span className="block text-[11px] text-[#948C79] truncate">{c.desc}</span>
                </span>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};
