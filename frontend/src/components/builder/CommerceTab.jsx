import React, { useState } from "react";
import { toast } from "sonner";
import { CreditCard, ShoppingBag, ShoppingCart, Plus } from "lucide-react";
import { COMMERCE_BLOCKS } from "@/lib/commerce";
import { buildAddToCartButton } from "@/lib/cart";
import { useHoverPreview } from "./HoverPreview";

const inputCls = "w-full bg-[#15130E] border border-[#332D22] rounded px-2 py-1.5 text-xs text-[#F1EDE2] outline-none focus:border-emerald-500";
const labelCls = "text-[10px] uppercase tracking-wider text-[#948C79] block mb-1";

// "Shop" tab: payment button builder, a working cart system, and store blocks.
export const CommerceTab = ({ onAddBlock, onOpenPaymentBuilder, onWireCatalog, onAddCart, onSavePaypalSecret, onSaveSmtpConfig }) => {
  const [cur, setCur] = useState("usd");
  const [accent, setAccent] = useState("#4f46e5");
  const [paypal, setPaypal] = useState("");
  const [paypalSecret, setPaypalSecret] = useState("");
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUsername, setSmtpUsername] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [smtpFromAddress, setSmtpFromAddress] = useState("");
  const [pName, setPName] = useState("Aurora Bottle");
  const [pPrice, setPPrice] = useState("38");
  const [pImg, setPImg] = useState("");

  const onDragStart = (e, html) => { e.dataTransfer.setData("text/html-block", html); e.dataTransfer.effectAllowed = "copy"; };
  const { previewProps, previewNode } = useHoverPreview();

  const savePaypal = () => {
    if (!paypal || !paypalSecret) { toast.error("Enter both Client ID and Secret"); return; }
    onSavePaypalSecret(paypal, paypalSecret);
    setPaypalSecret("");
  };

  const saveSmtp = () => {
    if (!smtpHost || !smtpPort || !smtpUsername || !smtpPassword || !smtpFromAddress) { toast.error("Fill in all SMTP fields"); return; }
    onSaveSmtpConfig(smtpHost, Number(smtpPort), smtpUsername, smtpPassword, smtpFromAddress);
    setSmtpPassword("");
  };

  const addCart = () => onAddCart({ accent, currency: cur, paypalClientId: paypal.trim() });
  const addBtn = () => {
    if (!pName.trim() || !(Number(pPrice) > 0)) { toast.error("Enter a product name and price"); return; }
    onAddBlock(buildAddToCartButton({ id: "p-" + pName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"), name: pName.trim(), amount: Number(pPrice), currency: cur, image: pImg.trim(), accent }));
    toast.success("Add-to-cart button inserted");
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden" data-testid="commerce-tab">
    <div className="flex-1 overflow-y-auto p-3 space-y-4">
      <div>
        <button onClick={onOpenPaymentBuilder} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-[#F1EDE2] text-sm font-medium" data-testid="open-payment-builder">
          <CreditCard size={15} /> Add payment button
        </button>
        <p className="text-[11px] text-[#948C79] mt-2 leading-relaxed">One-click <b className="text-[#E4DECE]">Stripe</b> or <b className="text-[#E4DECE]">PayPal</b> buy button — works on your published static site.</p>
        <button onClick={onWireCatalog} className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#242019] border border-emerald-500/40 hover:bg-[#332D22] text-emerald-300 text-xs font-medium" data-testid="wire-catalog-btn"><ShoppingCart size={14} /> Make this shop checkout-ready</button>
      </div>

      {/* Working cart */}
      <div className="border-t border-[#332D22] pt-3 space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-[#948C79] flex items-center gap-1.5"><ShoppingCart size={12} /> Shopping cart</div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>Currency</label>
            <select value={cur} onChange={(e) => setCur(e.target.value)} className={inputCls} data-testid="cart-currency">{["usd", "eur", "gbp", "cad", "aud", "inr", "jpy"].map((c) => <option key={c} value={c}>{c.toUpperCase()}</option>)}</select>
          </div>
          <div>
            <label className={labelCls}>Accent</label>
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-full h-[30px] rounded bg-[#15130E] border border-[#332D22]" data-testid="cart-accent" />
          </div>
        </div>
        <div>
          <label className={labelCls}>PayPal Client ID <span className="normal-case text-[#6B6353]">(optional)</span></label>
          <input value={paypal} onChange={(e) => setPaypal(e.target.value)} placeholder="adds a PayPal option in the cart" className={inputCls + " font-mono"} data-testid="cart-paypal" />
        </div>
        <div>
          <label className={labelCls}>PayPal Secret <span className="normal-case text-[#6B6353]">(optional)</span></label>
          <input type="password" value={paypalSecret} onChange={(e) => setPaypalSecret(e.target.value)} placeholder="secret key for server-side verification" className={inputCls + " font-mono"} data-testid="cart-paypal-secret" />
        </div>
        <button onClick={savePaypal} className="w-full text-xs py-2 rounded bg-[#242019] border border-[#332D22] hover:bg-[#332D22] text-[#F1EDE2] font-medium" data-testid="save-paypal-btn">Save PayPal credentials</button>
        <button onClick={addCart} className="w-full text-xs py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-[#F1EDE2] font-medium" data-testid="add-cart-btn">Add cart + checkout to page</button>
        <p className="text-[10px] text-[#948C79] leading-relaxed">Adds a floating cart + slide-out drawer. Checkout hands off to real Stripe (or PayPal) checkout.</p>
      </div>

      {/* SMTP settings for transactional order email */}
      <div className="border-t border-[#332D22] pt-3 space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-[#948C79]">Order emails (SMTP)</div>
        <input value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} placeholder="SMTP host" className={inputCls + " font-mono"} data-testid="smtp-host" />
        <div className="grid grid-cols-2 gap-2">
          <input value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} placeholder="Port" className={inputCls} data-testid="smtp-port" />
          <input value={smtpFromAddress} onChange={(e) => setSmtpFromAddress(e.target.value)} placeholder="From address" className={inputCls} data-testid="smtp-from" />
        </div>
        <input value={smtpUsername} onChange={(e) => setSmtpUsername(e.target.value)} placeholder="Username" className={inputCls + " font-mono"} data-testid="smtp-username" />
        <input type="password" value={smtpPassword} onChange={(e) => setSmtpPassword(e.target.value)} placeholder="Password" className={inputCls + " font-mono"} data-testid="smtp-password" />
        <button onClick={saveSmtp} className="w-full text-xs py-2 rounded bg-[#242019] border border-[#332D22] hover:bg-[#332D22] text-[#F1EDE2] font-medium" data-testid="save-smtp-btn">Save SMTP settings</button>
        <p className="text-[10px] text-[#948C79] leading-relaxed">Sends an automatic order-confirmation email, plus shipped/delivered emails when you update an order's status in the dashboard.</p>
      </div>

      {/* Add-to-cart button generator */}
      <div className="border-t border-[#332D22] pt-3 space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-[#948C79]">Add-to-cart button</div>
        <input value={pName} onChange={(e) => setPName(e.target.value)} placeholder="Product name" className={inputCls} data-testid="atc-name" />
        <div className="grid grid-cols-2 gap-2">
          <input type="number" min="0" step="0.01" value={pPrice} onChange={(e) => setPPrice(e.target.value)} placeholder="Price" className={inputCls} data-testid="atc-price" />
          <input value={pImg} onChange={(e) => setPImg(e.target.value)} placeholder="Image URL" className={inputCls + " font-mono"} data-testid="atc-img" />
        </div>
        <button onClick={addBtn} className="w-full text-xs py-2 rounded bg-[#242019] border border-[#332D22] hover:bg-[#332D22] text-[#F1EDE2] font-medium" data-testid="add-atc-btn"><Plus size={11} className="inline -mt-0.5 mr-1" />Insert add-to-cart button</button>
        <p className="text-[10px] text-[#948C79] leading-relaxed">Pair these with the cart above. Add the cart once per page.</p>
      </div>

      {/* Store blocks */}
      <div className="border-t border-[#332D22] pt-3">
        <div className="text-[10px] uppercase tracking-wider text-[#948C79] mb-2 flex items-center gap-1.5"><ShoppingBag size={12} /> Store blocks</div>
        <div className="space-y-1.5">
          {COMMERCE_BLOCKS.map((b) => (
            <div key={b.id} draggable onDragStart={(e) => onDragStart(e, b.html)} onDoubleClick={() => onAddBlock(b.html)} {...previewProps(b.html)} className="rounded bg-[#242019] border border-[#332D22] p-2 flex items-center gap-2 cursor-grab hover:border-emerald-500/60 hover:bg-[#332D22] transition-colors" data-testid={`commerce-block-${b.id}`} title="Drag to canvas or double-click to insert">
              <div className="w-1 h-4 bg-emerald-500/60 rounded-full" />
              <span className="text-xs text-[#F1EDE2] flex-1 truncate">{b.label}</span>
              <Plus size={12} className="text-[#948C79]" />
            </div>
          ))}
        </div>
        <p className="text-[11px] text-[#948C79] mt-3 leading-relaxed">Want full shop pages? Open <b className="text-[#E4DECE]">+ Page → Shop</b> for catalog, product & working-cart layouts.</p>
      </div>
    </div>
      {previewNode}
    </div>
  );
};
