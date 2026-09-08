import React from "react";
import { CATEGORIES } from "@/lib/blocks";
import { readVariant, stampVariant } from "@/lib/variants";

// Swaps the selected element's markup for a sibling from the same
// block-library category, preserving its position (el.id is untouched —
// only el.html changes) and its variant tag so it stays swappable.
export const VariantPanel = ({ selected, onReplaceHtml }) => {
  if (!selected) {
    return <div className="text-[11px] text-[#948C79]">Select an element on the canvas to see its variants.</div>;
  }
  const info = readVariant(selected.html);
  const cat = info && CATEGORIES.find((c) => c.id === info.catId);
  const siblings = cat ? cat.blocks.filter((b) => b.id !== info.blockId) : [];

  if (!info || !cat) {
    return (
      <div className="text-[11px] text-[#948C79] space-y-2" data-testid="variant-panel-none">
        <p>This element wasn't inserted from the block library, so it has no known variant family.</p>
        <p>Variants are available for blocks dragged in from the left sidebar (Navbars, Headers, Footers, Heroes, etc.).</p>
      </div>
    );
  }
  if (siblings.length === 0) {
    return <div className="text-[11px] text-[#948C79]">No other variants in "{cat.label}" yet.</div>;
  }
  return (
    <div className="space-y-2" data-testid="variant-panel">
      <div className="text-[11px] text-[#A79C87]">
        <span className="text-[#F1EDE2] font-medium">{cat.label}</span> — {siblings.length} other variant{siblings.length === 1 ? "" : "s"}.
        Swapping keeps this block's position; its current content/edits are replaced by the new variant's default.
      </div>
      <div className="space-y-1.5">
        {siblings.map((b) => (
          <button
            key={b.id}
            onClick={() => onReplaceHtml(stampVariant(b.html, cat.id, b.id))}
            className="w-full text-left text-xs px-2.5 py-2 rounded border border-[#332D22] bg-[#242019] hover:border-[#C9A227]/60 hover:bg-[#332D22] text-[#F1EDE2]"
            data-testid={`variant-swap-${b.id}`}
          >{b.label}</button>
        ))}
      </div>
    </div>
  );
};
