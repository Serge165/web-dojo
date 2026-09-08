import { escAttr, escText } from "./escapeHtml.js";

// Client-side shopping cart runtime for EXPORTED static sites.
// - Cart lives in localStorage; a floating button + slide-out drawer show it.
// - Stripe checkout hands off to Web Dojo's hosted backend (baked below), which
//   returns a hosted Stripe Checkout URL the static page redirects to.
// - PayPal checkout (optional) totals the cart client-side via the JS SDK.
// The whole thing is one self-contained block (scoped styles + inline script).

const BACKEND = process.env.REACT_APP_BACKEND_URL || "";

export const buildAddToCartButton = ({ id, name, amount, currency = "usd", image = "", label = "Add to cart", accent = "#4f46e5", radius = "10px" }) =>
  `<button type="button" data-wd-add data-wd-id="${escAttr(id || name)}" data-wd-name="${escAttr(name)}" data-wd-price="${Number(amount) || 0}" data-wd-cur="${currency}" data-wd-img="${escAttr(image)}" style="display:inline-flex;align-items:center;gap:8px;padding:12px 22px;border:none;border-radius:${radius};background:${accent};color:#fff;font-family:system-ui,sans-serif;font-size:14px;font-weight:600;cursor:pointer;">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
  ${escText(label)}
</button>`;

// currency + accent + optional paypalClientId configure the whole store.
export const buildCartRuntimeHtml = ({ accent = "#4f46e5", currency = "usd", paypalClientId = "", projectId = "" } = {}) => {
  const cfg = JSON.stringify({ api: BACKEND, accent, currency: (currency || "usd").toLowerCase(), paypal: paypalClientId || "" });
  return `<div data-webdojo-cart>
<style>
.wdc-btn{position:fixed;bottom:22px;right:22px;z-index:99998;width:56px;height:56px;border-radius:999px;background:${accent};color:#fff;border:none;cursor:pointer;box-shadow:0 10px 30px rgba(0,0,0,.28);display:flex;align-items:center;justify-content:center;transition:transform .18s ease;}
.wdc-btn:hover{transform:translateY(-3px) scale(1.05);}
.wdc-badge{position:absolute;top:-4px;right:-4px;min-width:20px;height:20px;padding:0 5px;border-radius:999px;background:#111;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;}
.wdc-overlay{position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.45);opacity:0;pointer-events:none;transition:opacity .25s ease;}
.wdc-overlay.open{opacity:1;pointer-events:auto;}
.wdc-panel{position:fixed;top:0;right:0;height:100%;width:380px;max-width:92vw;background:#fff;z-index:100000;transform:translateX(100%);transition:transform .3s cubic-bezier(.4,0,.2,1);display:flex;flex-direction:column;font-family:system-ui,-apple-system,sans-serif;box-shadow:-12px 0 40px rgba(0,0,0,.2);}
.wdc-panel.open{transform:translateX(0);}
.wdc-head{display:flex;align-items:center;justify-content:between;justify-content:space-between;padding:20px;border-bottom:1px solid #eef0f4;}
.wdc-title{font-size:18px;font-weight:700;color:#0f172a;}
.wdc-x{background:none;border:none;font-size:22px;cursor:pointer;color:#64748b;line-height:1;}
.wdc-items{flex:1;overflow-y:auto;padding:12px 20px;}
.wdc-empty{color:#94a3b8;text-align:center;padding:48px 0;font-size:14px;}
.wdc-row{display:flex;gap:12px;align-items:center;padding:14px 0;border-bottom:1px solid #f1f5f9;}
.wdc-row img{width:56px;height:56px;border-radius:10px;object-fit:cover;background:#f1f5f9;}
.wdc-nm{font-weight:600;color:#0f172a;font-size:14px;}
.wdc-pr{color:#64748b;font-size:13px;margin-top:2px;}
.wdc-qty{display:inline-flex;align-items:center;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-top:6px;}
.wdc-qty button{width:26px;height:26px;border:none;background:#f8fafc;cursor:pointer;font-size:15px;color:#0f172a;}
.wdc-qty span{min-width:28px;text-align:center;font-size:13px;font-weight:600;}
.wdc-rm{background:none;border:none;color:#94a3b8;cursor:pointer;font-size:12px;margin-left:auto;align-self:flex-start;}
.wdc-rm:hover{color:#ef4444;}
.wdc-foot{padding:20px;border-top:1px solid #eef0f4;}
.wdc-tot{display:flex;justify-content:space-between;font-size:17px;font-weight:800;color:#0f172a;margin-bottom:14px;}
.wdc-checkout{width:100%;padding:14px;border:none;border-radius:12px;background:${accent};color:#fff;font-size:15px;font-weight:700;cursor:pointer;transition:filter .15s ease;}
.wdc-checkout:hover{filter:brightness(1.08);}
.wdc-checkout:disabled{opacity:.55;cursor:not-allowed;}
.wdc-note{font-size:11px;color:#94a3b8;text-align:center;margin-top:10px;}
#wdc-paypal{margin-top:12px;}
</style>
<button class="wdc-btn" id="wdc-open" aria-label="Open cart">
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
  <span class="wdc-badge" id="wdc-count" style="display:none;">0</span>
</button>
<div class="wdc-overlay" id="wdc-overlay"></div>
<div class="wdc-panel" id="wdc-panel" role="dialog" aria-label="Shopping cart">
  <div class="wdc-head"><span class="wdc-title">Your cart</span><button class="wdc-x" id="wdc-close">&times;</button></div>
  <div class="wdc-items" id="wdc-items"></div>
  <div class="wdc-foot">
    <div class="wdc-tot"><span>Total</span><span id="wdc-total">$0.00</span></div>
    <button class="wdc-checkout" id="wdc-checkout">Checkout with Stripe</button>
    <div id="wdc-paypal"></div>
    <div class="wdc-note">Secure checkout · Test mode</div>
  </div>
</div>
<script>
(function(){
  if(window.__wdCartInit) return; window.__wdCartInit = true;
  var CFG = ${cfg};
  var KEY = "wd_cart_v1";
  var $ = function(id){ return document.getElementById(id); };
  function read(){ try{ return JSON.parse(localStorage.getItem(KEY)) || []; }catch(e){ return []; } }
  function write(c){ localStorage.setItem(KEY, JSON.stringify(c)); render(); }
  function esc(s){ return String(s==null?"":s).replace(/[&<>"']/g, function(m){ return {"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;","'":"&#39;"}[m]; }); }
  function money(n, cur){ try{ return new Intl.NumberFormat(undefined,{style:"currency",currency:(cur||CFG.currency).toUpperCase()}).format(n); }catch(e){ return "$"+(n).toFixed(2); } }
  function total(){ return read().reduce(function(s,x){ return s + (Number(x.price)||0)*(x.qty||1); },0); }
  function count(){ return read().reduce(function(s,x){ return s + (x.qty||1); },0); }
  window.WDCart = {
    add:function(it){ var c=read(); var ex=c.filter(function(x){return x.id===it.id;})[0]; if(ex){ ex.qty=(ex.qty||1)+(it.qty||1); } else { it.qty=it.qty||1; c.push(it); } write(c); openCart(); },
    remove:function(id){ write(read().filter(function(x){return x.id!==id;})); },
    setQty:function(id,q){ var c=read(); c.forEach(function(x){ if(x.id===id){ x.qty=Math.max(1,q); } }); write(c); },
    clear:function(){ write([]); },
    items:read, total:total
  };
  function openCart(){ $("wdc-overlay").classList.add("open"); $("wdc-panel").classList.add("open"); }
  function closeCart(){ $("wdc-overlay").classList.remove("open"); $("wdc-panel").classList.remove("open"); }
  function render(){
    var items = read(), box = $("wdc-items");
    if(!box) return;
    if(!items.length){ box.innerHTML = '<div class="wdc-empty">Your cart is empty.</div>'; }
    else {
      box.innerHTML = items.map(function(x){
        return '<div class="wdc-row">'+
          (x.image ? '<img src="'+esc(x.image)+'" alt="" />' : '<div style="width:56px;height:56px;border-radius:10px;background:#f1f5f9;"></div>')+
          '<div style="flex:1;"><div class="wdc-nm">'+esc(x.name)+'</div><div class="wdc-pr">'+money(x.price,x.currency)+'</div>'+
          '<div class="wdc-qty"><button data-dec="'+esc(x.id)+'">-</button><span>'+(x.qty||1)+'</span><button data-inc="'+esc(x.id)+'">+</button></div></div>'+
          '<button class="wdc-rm" data-rm="'+esc(x.id)+'">Remove</button></div>';
      }).join("");
    }
    $("wdc-total").textContent = money(total());
    var cEl = $("wdc-count");
    if(count()>0){ cEl.style.display="flex"; cEl.textContent=count(); } else { cEl.style.display="none"; }
    var co=$("wdc-checkout"); if(co){ co.disabled = items.length===0; }
    renderPaypal();
  }
  function checkoutStripe(){
    var items = read().map(function(x){ return {name:x.name, amount:Number(x.price)||0, currency:x.currency||CFG.currency, quantity:x.qty||1}; }).filter(function(i){ return i.amount>0; });
    if(!items.length) return;
    var origin=(location.origin&&location.origin!=="null")?(location.origin+location.pathname):"";
    var btn=$("wdc-checkout"); btn.disabled=true; btn.textContent="Redirecting…";
    fetch(CFG.api+"/api/commerce/checkout-session",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({items:items, origin_url:origin, project_id: "${projectId}"})})
      .then(function(r){ return r.json(); })
      .then(function(d){ if(d && d.url){ location.href=d.url; } else { alert((d&&d.detail)||"Could not start checkout"); btn.disabled=false; btn.textContent="Checkout with Stripe"; } })
      .catch(function(){ alert("Checkout failed — please try again."); btn.disabled=false; btn.textContent="Checkout with Stripe"; });
  }
  var ppLoaded=false;
  function renderPaypal(){
    if(!CFG.paypal) return;
    var host=$("wdc-paypal"); if(!host) return;
    if(!ppLoaded){
      ppLoaded=true;
      var s=document.createElement("script");
      s.src="https://www.paypal.com/sdk/js?client-id="+encodeURIComponent(CFG.paypal)+"&currency="+CFG.currency.toUpperCase();
      s.onload=drawPaypal; document.head.appendChild(s);
    } else { drawPaypal(); }
  }
  function drawPaypal(){
    var host=$("wdc-paypal"); if(!host || !window.paypal) return;
    host.innerHTML="";
    if(!read().length) return;
    window.paypal.Buttons({
      style:{layout:"horizontal",color:"gold",shape:"pill",height:40,tagline:false},
      createOrder:function(data,actions){ return actions.order.create({purchase_units:[{amount:{value:total().toFixed(2),currency_code:CFG.currency.toUpperCase()}}]}); },
      onApprove:function(data,actions){ return actions.order.capture().then(function(){ fetch(CFG.api+"/api/commerce/paypal/verify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({project_id: "${projectId}", order_id:data.orderID})}).then(function(){ WDCart.clear(); alert("Payment complete — thank you!"); }).catch(function(){ alert("Your payment went through, but we couldn't confirm it just now. Please contact us with your PayPal order ID: "+data.orderID); }); }); }
    }).render("#wdc-paypal");
  }
  document.addEventListener("click", function(e){
    var add=e.target.closest("[data-wd-add]");
    if(add){ e.preventDefault(); WDCart.add({id:add.getAttribute("data-wd-id")||add.getAttribute("data-wd-name"), name:add.getAttribute("data-wd-name"), price:parseFloat(add.getAttribute("data-wd-price"))||0, currency:add.getAttribute("data-wd-cur")||CFG.currency, image:add.getAttribute("data-wd-img")||""}); return; }
    if(e.target.id==="wdc-open"||e.target.closest("#wdc-open")){ openCart(); return; }
    if(e.target.id==="wdc-close"||e.target.id==="wdc-overlay"){ closeCart(); return; }
    if(e.target.id==="wdc-checkout"){ checkoutStripe(); return; }
    var inc=e.target.getAttribute&&e.target.getAttribute("data-inc"); if(inc){ var c=read(); c.forEach(function(x){ if(x.id===inc){x.qty=(x.qty||1)+1;} }); write(c); return; }
    var dec=e.target.getAttribute&&e.target.getAttribute("data-dec"); if(dec){ var c2=read(); c2.forEach(function(x){ if(x.id===dec){x.qty=Math.max(1,(x.qty||1)-1);} }); write(c2); return; }
    var rm=e.target.getAttribute&&e.target.getAttribute("data-rm"); if(rm){ WDCart.remove(rm); return; }
  });
  render();
  try{ if(/[?&]wd_checkout=success/.test(location.search)){ WDCart.clear(); var _t=document.createElement("div"); _t.setAttribute("data-wd-thanks",""); _t.style.cssText="position:fixed;top:20px;left:50%;transform:translateX(-50%);z-index:100001;background:#0f172a;color:#fff;padding:14px 22px;border-radius:12px;box-shadow:0 12px 30px rgba(0,0,0,.3);font-family:system-ui,sans-serif;font-size:14px;"; _t.textContent="\\u2713 Thank you! Your order is confirmed."; document.body.appendChild(_t); setTimeout(function(){_t.style.transition="opacity .5s";_t.style.opacity="0";setTimeout(function(){_t.remove();},600);},6000); } }catch(e){}
  (function () {
    var params = new URLSearchParams(window.location.search);
    var sessionId = params.get("session_id");
    if (!sessionId) return;
    // Strip the capability token out of the visible URL before the merchant's
    // own analytics scripts get a chance to log the full location.
    try { history.replaceState(null, "", window.location.pathname); } catch (e) {}
    var tries = 0;
    function showReceipt(html) {
      var box = document.createElement("div");
      box.style.cssText = "max-width:480px;margin:60px auto;padding:32px;border:1px solid #e2e8f0;border-radius:12px;font-family:system-ui,sans-serif;";
      box.innerHTML = html;
      document.body.insertBefore(box, document.body.firstChild);
    }
    function poll() {
      fetch(CFG.api + "/api/commerce/receipt/" + encodeURIComponent(sessionId)).then(function (r) { return r.json(); }).then(function (order) {
        if (order.status === "processing" && tries < 5) {
          tries++;
          setTimeout(poll, 2000);
          return;
        }
        if (order.status === "processing") {
          showReceipt("<h2>Thanks for your order</h2><p>Your payment was received. This receipt will update shortly — refresh in a moment.</p>");
        } else {
          var items = (order.line_items || []).map(function (li) {
            return "<li>" + li.name + " × " + li.quantity + "</li>";
          }).join("");
          showReceipt("<h2>Order confirmed</h2><p>Thanks, " + (order.customer_name || "") + "!</p><ul>" + items + "</ul>" +
            "<p><b>Total: " + (order.amount_total / 100).toFixed(2) + " " + (order.currency || "").toUpperCase() + "</b></p>" +
            "<button onclick=\\"window.print()\\">Print / Save as PDF</button>");
        }
      }).catch(function () {
        showReceipt("<h2>Thanks for your order</h2><p>Your payment went through, but we couldn't load your receipt right now. Please refresh, or check your email for confirmation.</p>");
      });
    }
    poll();
  })();
})();
</script>
</div>`;
};
