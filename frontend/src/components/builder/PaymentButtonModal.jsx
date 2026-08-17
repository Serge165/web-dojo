import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreditCard, Loader2, ExternalLink, Copy } from "lucide-react";
import { stripeButtonHtml, paypalButtonHtml, CURRENCY_SYMBOL } from "@/lib/commerce";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const inputCls = "w-full bg-[#0D0D0D] border border-[#2B2B2B] rounded px-2.5 py-2 text-sm text-white outline-none focus:border-indigo-500";
const labelCls = "text-[10px] uppercase tracking-wider text-gray-500 block mb-1";

// Build a working "Buy" button for STATIC exported sites: Stripe Payment Link
// (generated server-side) or PayPal Smart Buttons (client-side SDK).
export const PaymentButtonModal = ({ open, onClose, onInsert }) => {
  const [provider, setProvider] = useState("stripe");
  const [cfg, setCfg] = useState({ stripe_enabled: false, currencies: ["usd"], mode: "test" });
  const [name, setName] = useState("Aurora Bottle");
  const [amount, setAmount] = useState("38.00");
  const [currency, setCurrency] = useState("usd");
  const [label, setLabel] = useState("Buy now");
  const [clientId, setClientId] = useState("");
  const [loading, setLoading] = useState(false);
  const [stripeLink, setStripeLink] = useState("");

  useEffect(() => {
    if (!open) return;
    setStripeLink("");
    axios.get(`${API}/commerce/config`).then((r) => setCfg(r.data)).catch(() => {});
  }, [open]);

  const sym = CURRENCY_SYMBOL[currency] || "$";
  const priceLabel = `${sym}${(Number(amount) || 0).toFixed(2)}`;

  const generateStripe = async () => {
    if (!name.trim() || !(Number(amount) > 0)) { toast.error("Enter a product name and a price above 0"); return; }
    setLoading(true);
    try {
      const r = await axios.post(`${API}/commerce/payment-link`, { name: name.trim(), amount: Number(amount), currency, quantity: 1 });
      setStripeLink(r.data.url);
      toast.success("Stripe payment link created");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Could not create Stripe link");
    } finally { setLoading(false); }
  };

  const stripeHtml = useMemo(() => stripeLink ? stripeButtonHtml({ label, url: stripeLink, price: priceLabel }) : "", [stripeLink, label, priceLabel]);
  const paypalHtml = useMemo(() => clientId.trim() ? paypalButtonHtml({ clientId: clientId.trim(), amount: Number(amount) || 0, currency: currency.toUpperCase(), label: name || "Item" }) : "", [clientId, amount, currency, name]);

  const previewHtml = provider === "stripe" ? stripeHtml : paypalHtml;

  const insert = () => {
    if (provider === "stripe" && !stripeHtml) { toast.error("Generate the Stripe link first"); return; }
    if (provider === "paypal" && !paypalHtml) { toast.error("Paste your PayPal Client ID first"); return; }
    onInsert(provider === "stripe" ? stripeHtml : paypalHtml);
    toast.success("Payment button inserted onto canvas");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#141414] border border-[#2B2B2B] text-white max-w-4xl w-[92vw] max-h-[90vh] overflow-hidden p-0" data-testid="payment-builder-modal">
        <DialogHeader className="px-5 pt-4 pb-3 border-b border-[#2B2B2B]">
          <DialogTitle className="flex items-center gap-2 text-base"><CreditCard size={16} className="text-emerald-400" /> Add a payment button</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-[1fr_1fr] max-h-[calc(90vh-58px)]">
          {/* Config */}
          <div className="border-r border-[#2B2B2B] overflow-y-auto p-5 space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setProvider("stripe")} className={`py-2.5 rounded-lg text-sm font-medium border ${provider === "stripe" ? "bg-indigo-600 border-indigo-500 text-white" : "border-[#2B2B2B] text-gray-300 hover:border-indigo-500/50"}`} data-testid="pay-provider-stripe">Stripe</button>
              <button onClick={() => setProvider("paypal")} className={`py-2.5 rounded-lg text-sm font-medium border ${provider === "paypal" ? "bg-[#0070ba] border-[#0070ba] text-white" : "border-[#2B2B2B] text-gray-300 hover:border-[#0070ba]/60"}`} data-testid="pay-provider-paypal">PayPal</button>
            </div>

            <div>
              <label className={labelCls}>Product / item name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} data-testid="pay-name" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Price</label>
                <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} data-testid="pay-amount" />
              </div>
              <div>
                <label className={labelCls}>Currency</label>
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputCls} data-testid="pay-currency">
                  {(cfg.currencies || ["usd"]).map((c) => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Button label</label>
              <input value={label} onChange={(e) => setLabel(e.target.value)} className={inputCls} data-testid="pay-label" />
            </div>

            {provider === "stripe" && (
              <div className="space-y-2 pt-1">
                <button onClick={generateStripe} disabled={loading} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium disabled:opacity-50" data-testid="pay-stripe-generate">
                  {loading ? <><Loader2 size={14} className="animate-spin" /> Creating link…</> : "Generate Stripe payment link"}
                </button>
                {stripeLink && (
                  <div className="text-[11px] bg-[#0D0D0D] border border-[#2B2B2B] rounded p-2 flex items-center gap-2" data-testid="pay-stripe-link">
                    <a href={stripeLink} target="_blank" rel="noopener" className="text-indigo-400 truncate flex-1">{stripeLink}</a>
                    <button onClick={() => { navigator.clipboard.writeText(stripeLink); toast.success("Link copied"); }} className="text-gray-400 hover:text-white"><Copy size={12} /></button>
                    <a href={stripeLink} target="_blank" rel="noopener" className="text-gray-400 hover:text-white"><ExternalLink size={12} /></a>
                  </div>
                )}
                <p className="text-[11px] text-gray-500">Test mode is active — use card <span className="font-mono text-gray-400">4242 4242 4242 4242</span> at checkout. Claim your account later to go live.</p>
              </div>
            )}

            {provider === "paypal" && (
              <div className="space-y-2 pt-1">
                <div>
                  <label className={labelCls}>PayPal Client ID</label>
                  <input value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="AeA1QI…  (or 'test' for a demo)" className={inputCls + " font-mono"} data-testid="pay-paypal-clientid" />
                </div>
                <p className="text-[11px] text-gray-500">Get your Client ID from <a href="https://developer.paypal.com/dashboard/applications" target="_blank" rel="noopener" className="text-[#0070ba] underline">developer.paypal.com</a>. Buttons render fully client-side, so they work on your published static site.</p>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="flex flex-col overflow-hidden bg-[#f5f5f5]">
            <div className="px-4 py-2 border-b border-[#2B2B2B] bg-[#141414] flex justify-between items-center">
              <div className="text-[11px] uppercase tracking-widest text-gray-400">Live preview</div>
              <button onClick={insert} className="text-xs px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium" data-testid="pay-insert">Insert onto canvas</button>
            </div>
            <iframe
              title="payment-preview"
              key={provider + previewHtml.length}
              srcDoc={`<!doctype html><html><head><meta charset="utf-8" /><style>body{margin:0;padding:36px;background:#f5f5f5;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:calc(100vh - 72px);} .empty{color:#94a3b8;font-size:13px;text-align:center;}</style></head><body>${previewHtml || '<div class="empty">Your button preview appears here.<br/>' + (provider === "stripe" ? "Generate a Stripe link to see it." : "Paste a PayPal Client ID to see it.") + '</div>'}</body></html>`}
              className="flex-1 w-full border-0"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              data-testid="payment-preview-iframe"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
