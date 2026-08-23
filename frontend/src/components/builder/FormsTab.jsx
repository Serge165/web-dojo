import React from "react";
import { FormInput, Wrench } from "lucide-react";
import { FORM_PRESETS, buildFormHtml } from "@/lib/forms";
import { useHoverPreview } from "./HoverPreview";

// Sidebar tab surface for the form-builder tool. Users can drop a preset
// onto the canvas or open the full modal editor.
export const FormsTab = ({ onAddBlock, onOpenBuilder }) => {
  const onDragStart = (e, html) => {
    e.dataTransfer.setData("text/html-block", html);
    e.dataTransfer.effectAllowed = "copy";
  };
  const { previewProps, previewNode } = useHoverPreview();

  return (
    <div className="flex-1 flex flex-col overflow-hidden" data-testid="forms-tab">
    <div className="flex-1 overflow-y-auto p-2 space-y-3">
      <button
        onClick={onOpenBuilder}
        className="w-full py-2.5 rounded bg-[#AD8B21] hover:bg-[#C9A227] text-[#F1EDE2] text-xs flex items-center justify-center gap-2 font-medium"
        data-testid="open-form-builder"
      >
        <Wrench size={12} /> Open form builder
      </button>

      <div>
        <div className="text-[10px] uppercase tracking-widest text-[#948C79] px-1 mb-1.5">Presets</div>
        <div className="space-y-1.5">
          {FORM_PRESETS.map((p) => {
            const html = buildFormHtml(p.config());
            return (
              <div
                key={p.id}
                draggable
                onDragStart={(e) => onDragStart(e, html)}
                onDoubleClick={() => onAddBlock(html)}
                {...previewProps(html)}
                className="rounded bg-[#242019] border border-[#332D22] p-2 flex items-center gap-2 cursor-grab hover:border-[#C9A227]/60 hover:bg-[#332D22] transition-colors group"
                data-testid={`form-preset-${p.id}`}
                title="Drag to canvas or double-click to insert"
              >
                <FormInput size={12} className="text-[#D9BC55]/70 shrink-0" />
                <span className="text-xs text-[#F1EDE2] flex-1 truncate">{p.label}</span>
                <span className="text-[10px] text-[#948C79] font-mono">{p.config().fields.length}f</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-[11px] text-[#948C79] leading-relaxed px-1 pt-2 border-t border-[#332D22]">
        Presets are portable HTML — set the <span className="font-mono text-[#A79C87]">action</span> URL to your backend, Formspree, Basin, or any endpoint that accepts <span className="font-mono text-[#A79C87]">multipart/form-data</span>.
      </div>
    </div>
      {previewNode}
    </div>
  );
};
