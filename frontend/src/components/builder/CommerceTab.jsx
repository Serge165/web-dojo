import React, { useState } from "react";
import { toast } from "sonner";
import { CreditCard, ShoppingBag, ShoppingCart, Plus } from "lucide-react";
import { COMMERCE_BLOCKS } from "@/lib/commerce";
import { buildCartRuntimeHtml, buildAddToCartButton } from "@/lib/cart";

const inputCls = "w-full bg-[#0D0D0D] border border-[#2B2B2B] rounded px-2 py-1.5 text-xs text-white outline-none focus:border-emerald-500";
const labelCls = "text-[10px] uppercase tracking-wider text-gray-500 block mb-1";

// "Shop" tab: payment button builder, a working cart system, and store blocks.
export const CommerceTab = ({ onAddBlock, onOpenPaymentBuilder, onWireCatalog }) => {
  const [cur, setCur] = useState("usd");
  const [accent, setAccent] = useState("#4f46e5");
  const [paypal, setPaypal] = useState("");
  const [pName, setPName] = useState("Aurora Bottle");
  const [pPrice, setPPrice] = useState("38");
  const [pImg, setPImg] = useState("");

  const onDragStart = (e, html) => { e.dataTransfer.setData("text/html-block", html); e.dataTransfer.effectAllowed = "copy"; };

  const addCart = () => {
    onAddBlock(buildCartRuntimeHtml({ accent, currency: cur, paypalClientId: paypal.trim() }));
    toast.success("Cart + checkout added — a floating cart button now lives on this page");
  };
  const addBtn = () => {
    if (!pName.trim() || !(Number(pPrice) > 0)) { toast.error("Enter a product name and price"); return; }
    onAddBlock(buildAddToCartButton({ id: "p-" + pName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"), name: pName.trim(), amount: Number(pPrice), currency: cur, image: pImg.trim(), accent }));
    toast.success("Add-to-cart button inserted");
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-4" data-testid="commerce-tab">
      <div>
        <button onClick={onOpenPaymentBuilder} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-medium" data-testid="open-payment-builder">
          <CreditCard size={15} /> Add payment button
        </button>
        <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">One-click <b className="text-gray-300">Stripe</b> or <b className="text-gray-300">PayPal</b> buy button — works on your published static site.</p>
        <button onClick={onWireCatalog} className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#1F1F1F] border border-emerald-500/40 hover:bg-[#232323] text-emerald-300 text-xs font-medium" data-testid="wire-catalog-btn"><ShoppingCart size={14} /> Make this shop checkout-ready</button>
      </div>

      {/* Working cart */}
      <div className="border-t border-[#2B2B2B] pt-3 space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-gray-500 flex items-center gap-1.5"><ShoppingCart size={12} /> Shopping cart</div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>Currency</label>
            <select value={cur} onChange={(e) => setCur(e.target.value)} className={inputCls} data-testid="cart-currency">{["usd", "eur", "gbp", "cad", "aud", "inr", "jpy"].map((c) => <option key={c} value={c}>{c.toUpperCase()}</option>)}</select>
          </div>
          <div>
            <label className={labelCls}>Accent</label>
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-full h-[30px] rounded bg-[#0D0D0D] border border-[#2B2B2B]" data-testid="cart-accent" />
          </div>
        </div>
        <div>
          <label className={labelCls}>PayPal Client ID <span className="normal-case text-gray-600">(optional)</span></label>
          <input value={paypal} onChange={(e) => setPaypal(e.target.value)} placeholder="adds a PayPal option in the cart" className={inputCls + " font-mono"} data-testid="cart-paypal" />
        </div>
        <button onClick={addCart} className="w-full text-xs py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium" data-testid="add-cart-btn">Add cart + checkout to page</button>
        <p className="text-[10px] text-gray-500 leading-relaxed">Adds a floating cart + slide-out drawer. Checkout hands off to real Stripe (or PayPal) checkout.</p>
      </div>

      {/* Add-to-cart button generator */}
      <div className="border-t border-[#2B2B2B] pt-3 space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-gray-500">Add-to-cart button</div>
        <input value={pName} onChange={(e) => setPName(e.target.value)} placeholder="Product name" className={inputCls} data-testid="atc-name" />
        <div className="grid grid-cols-2 gap-2">
          <input type="number" min="0" step="0.01" value={pPrice} onChange={(e) => setPPrice(e.target.value)} placeholder="Price" className={inputCls} data-testid="atc-price" />
          <input value={pImg} onChange={(e) => setPImg(e.target.value)} placeholder="Image URL" className={inputCls + " font-mono"} data-testid="atc-img" />
        </div>
        <button onClick={addBtn} className="w-full text-xs py-2 rounded bg-[#1F1F1F] border border-[#2B2B2B] hover:bg-[#2B2B2B] text-gray-100 font-medium" data-testid="add-atc-btn"><Plus size={11} className="inline -mt-0.5 mr-1" />Insert add-to-cart button</button>
        <p className="text-[10px] text-gray-500 leading-relaxed">Pair these with the cart above. Add the cart once per page.</p>
      </div>

      {/* Store blocks */}
      <div className="border-t border-[#2B2B2B] pt-3">
        <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5"><ShoppingBag size={12} /> Store blocks</div>
        <div className="space-y-1.5">
          {COMMERCE_BLOCKS.map((b) => (
            <div key={b.id} draggable onDragStart={(e) => onDragStart(e, b.html)} onDoubleClick={() => onAddBlock(b.html)} className="rounded bg-[#1F1F1F] border border-[#2B2B2B] p-2 flex items-center gap-2 cursor-grab hover:border-emerald-500/60 hover:bg-[#232323] transition-colors" data-testid={`commerce-block-${b.id}`} title="Drag to canvas or double-click to insert">
              <div className="w-1 h-4 bg-emerald-500/60 rounded-full" />
              <span className="text-xs text-gray-200 flex-1 truncate">{b.label}</span>
              <Plus size={12} className="text-gray-500" />
            </div>
          ))}
        </div>
        <p className="text-[11px] text-gray-500 mt-3 leading-relaxed">Want full shop pages? Open <b className="text-gray-300">+ Page → Shop</b> for catalog, product & working-cart layouts.</p>
      </div>
    </div>
  );
};
