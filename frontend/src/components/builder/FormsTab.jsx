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
    <div className="flex-1 overflow-y-auto p-2 space-y-3" data-testid="forms-tab">
      <button
        onClick={onOpenBuilder}
        className="w-full py-2.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs flex items-center justify-center gap-2 font-medium"
        data-testid="open-form-builder"
      >
        <Wrench size={12} /> Open form builder
      </button>

      <div>
        <div className="text-[10px] uppercase tracking-widest text-gray-500 px-1 mb-1.5">Presets</div>
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
                className="rounded bg-[#1F1F1F] border border-[#2B2B2B] p-2 flex items-center gap-2 cursor-grab hover:border-blue-500/60 hover:bg-[#232323] transition-colors group"
                data-testid={`form-preset-${p.id}`}
                title="Drag to canvas or double-click to insert"
              >
                <FormInput size={12} className="text-blue-400/70 shrink-0" />
                <span className="text-xs text-gray-200 flex-1 truncate">{p.label}</span>
                <span className="text-[10px] text-gray-500 font-mono">{p.config().fields.length}f</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-[11px] text-gray-500 leading-relaxed px-1 pt-2 border-t border-[#2B2B2B]">
        Presets are portable HTML — set the <span className="font-mono text-gray-400">action</span> URL to your backend, Formspree, Basin, or any endpoint that accepts <span className="font-mono text-gray-400">multipart/form-data</span>.
      </div>
      {previewNode}
    </div>
  );
};
