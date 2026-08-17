// Payment button + ecommerce block builders. Output is portable HTML that runs
// fully client-side on exported/published static pages.

const rid = () => "pay" + Math.random().toString(36).slice(2, 8);

export const CURRENCY_SYMBOL = { usd: "$", eur: "€", gbp: "£", cad: "C$", aud: "A$", inr: "₹", jpy: "¥" };

// Stripe: a styled anchor pointing at a hosted Payment Link URL (generated
// server-side). Works from any static page — clicking opens Stripe Checkout.
export const stripeButtonHtml = ({ label, url, price, accent = "#635bff", radius = "10px" }) =>
  `<div data-webdojo-pay="stripe" style="display:inline-block;font-family:system-ui,-apple-system,sans-serif;">
  <a href="${url}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:10px;padding:14px 26px;background:${accent};color:#fff;text-decoration:none;border-radius:${radius};font-weight:600;font-size:15px;box-shadow:0 4px 14px rgba(99,91,255,.35);">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 9.4c0-.6.5-.9 1.3-.9 1.2 0 2.7.4 3.9 1V5.8A10 10 0 0 0 14.8 5C11.8 5 9.8 6.5 9.8 9c0 4 5.4 3.3 5.4 5 0 .6-.6 1-1.5 1-1.3 0-3-.5-4.3-1.3v3.8c1.4.6 2.9.9 4.3.9 3 0 5.2-1.5 5.2-4 0-4.2-5.4-3.4-5.4-5z"/></svg>
    ${label}${price ? ` · ${price}` : ""}
  </a>
</div>`;

// PayPal: Smart Buttons via the JS SDK. Fully client-side — user drops in their
// PayPal Client ID (sandbox or live). Renders real buttons that create an order.
export const paypalButtonHtml = ({ clientId, amount, currency = "USD", label = "Item" }) => {
  const id = rid();
  const cur = (currency || "USD").toUpperCase();
  return `<div data-webdojo-pay="paypal" style="max-width:340px;font-family:system-ui,-apple-system,sans-serif;">
  <div id="${id}"></div>
  <script src="https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${cur}"></script>
  <script>
    (function(){
      function render(){
        if(!window.paypal){setTimeout(render,300);return;}
        window.paypal.Buttons({
          style:{layout:'vertical',color:'gold',shape:'pill',label:'paypal'},
          createOrder:function(data,actions){
            return actions.order.create({purchase_units:[{amount:{value:'${Number(amount).toFixed(2)}',currency_code:'${cur}'},description:${JSON.stringify(label)}}]});
          },
          onApprove:function(data,actions){
            return actions.order.capture().then(function(details){
              alert('Payment complete — thank you, '+(details.payer&&details.payer.name?details.payer.name.given_name:'friend')+'!');
            });
          }
        }).render('#${id}');
      }
      render();
    })();
  </script>
</div>`;
};

// ---- Draggable ecommerce block presets (for the Shop sidebar tab) ------------
const g = (u) => `${u}?w=800&q=80`;
export const COMMERCE_BLOCKS = [
  {
    id: "cm-product-card",
    label: "Product card",
    html: `<div style="max-width:300px;font-family:system-ui,sans-serif;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;background:#fff;">
  <div style="aspect-ratio:1/1;background:#f1f5f9;overflow:hidden;"><img src="${g("https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd")}" alt="" style="width:100%;height:100%;object-fit:cover;" /></div>
  <div style="padding:18px;">
    <div style="font-weight:600;font-size:17px;color:#0f172a;">Aurora Bottle</div>
    <div style="color:#64748b;font-size:14px;margin:2px 0 14px;">Insulated · 750ml</div>
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <span style="font-size:20px;font-weight:800;color:#0f172a;">$38</span>
      <button type="button" data-wd-add data-wd-id="p-aurora" data-wd-name="Aurora Bottle" data-wd-price="38" data-wd-cur="usd" data-wd-img="${g("https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd")}" style="padding:9px 18px;background:#4f46e5;color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;">Add to cart</button>
    </div>
  </div>
</div>`,
  },
  {
    id: "cm-pricing-table",
    label: "Pricing table",
    html: `<section style="font-family:system-ui,sans-serif;padding:48px 24px;background:#f8fafc;">
  <div style="max-width:900px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:16px;">
    ${[["Basic", "$9", ["1 project", "Email support"]], ["Pro", "$29", ["Unlimited", "Priority support", "Analytics"]], ["Team", "$79", ["Everything", "5 seats", "SSO"]]].map(([n, p, f], i) => `<div style="background:${i === 1 ? "#4f46e5" : "#fff"};color:${i === 1 ? "#fff" : "#0f172a"};border:1px solid ${i === 1 ? "#4f46e5" : "#e2e8f0"};border-radius:16px;padding:26px;">
      <div style="font-weight:600;margin-bottom:8px;">${n}</div>
      <div style="font-size:36px;font-weight:800;margin-bottom:16px;">${p}<span style="font-size:14px;font-weight:400;opacity:.7;">/mo</span></div>
      <ul style="list-style:none;padding:0;margin:0 0 20px;font-size:14px;">${f.map((x) => `<li style="padding:5px 0;opacity:.85;">✓ ${x}</li>`).join("")}</ul>
      <a href="#" style="display:block;text-align:center;padding:11px;border-radius:10px;text-decoration:none;font-weight:600;background:${i === 1 ? "#fff" : "#4f46e5"};color:${i === 1 ? "#4f46e5" : "#fff"};">Choose</a>
    </div>`).join("")}
  </div>
</section>`,
  },
  {
    id: "cm-buy-strip",
    label: "Buy CTA strip",
    html: `<section style="font-family:system-ui,sans-serif;padding:40px 24px;background:#0f172a;color:#fff;text-align:center;border-radius:18px;max-width:720px;">
  <div style="font-size:26px;font-weight:800;margin-bottom:8px;">Aurora Bottle — $38</div>
  <p style="color:#94a3b8;margin:0 0 22px;">Free shipping over $50 · 30-day returns</p>
  <a href="#" style="display:inline-block;padding:14px 32px;background:#4f46e5;color:#fff;border-radius:12px;text-decoration:none;font-weight:700;">Buy now</a>
</section>`,
  },
];
