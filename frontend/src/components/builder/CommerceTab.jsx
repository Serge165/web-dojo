import React from "react";
import { CreditCard, ShoppingBag, Plus } from "lucide-react";
import { COMMERCE_BLOCKS } from "@/lib/commerce";

// "Shop" tab: payment button builder + draggable ecommerce block presets.
export const CommerceTab = ({ onAddBlock, onOpenPaymentBuilder }) => {
  const onDragStart = (e, html) => { e.dataTransfer.setData("text/html-block", html); e.dataTransfer.effectAllowed = "copy"; };

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-4" data-testid="commerce-tab">
      <div>
        <button
          onClick={onOpenPaymentBuilder}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-medium"
          data-testid="open-payment-builder"
        >
          <CreditCard size={15} /> Add payment button
        </button>
        <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
          Generate a working <b className="text-gray-300">Stripe</b> or <b className="text-gray-300">PayPal</b> button. It runs client-side, so it keeps working on your published static site.
        </p>
      </div>

      <div className="border-t border-[#2B2B2B] pt-3">
        <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5"><ShoppingBag size={12} /> Store blocks</div>
        <div className="space-y-1.5">
          {COMMERCE_BLOCKS.map((b) => (
            <div
              key={b.id}
              draggable
              onDragStart={(e) => onDragStart(e, b.html)}
              onDoubleClick={() => onAddBlock(b.html)}
              className="rounded bg-[#1F1F1F] border border-[#2B2B2B] p-2 flex items-center gap-2 cursor-grab hover:border-emerald-500/60 hover:bg-[#232323] transition-colors"
              data-testid={`commerce-block-${b.id}`}
              title="Drag to canvas or double-click to insert"
            >
              <div className="w-1 h-4 bg-emerald-500/60 rounded-full" />
              <span className="text-xs text-gray-200 flex-1 truncate">{b.label}</span>
              <Plus size={12} className="text-gray-500" />
            </div>
          ))}
        </div>
        <p className="text-[11px] text-gray-500 mt-3 leading-relaxed">
          Want full shop pages? Open <b className="text-gray-300">Add page → Shop</b> for catalog, product, cart and pricing layouts.
        </p>
      </div>
    </div>
  );
};
