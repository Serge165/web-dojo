import React from "react";

// Landing pages are a fork of standard pages — they don't inherit the site's
// main navigation, use alternate typography scales, and include funnel-tracking
// checkpoints. This template provides the page structure with funnel tracking
// baked in via data attributes that the live page's funnel script reads.
export const LANDING_PAGE_TEMPLATE = {
  id: "landing-page",
  name: "Landing Page",
  slug: "landing",
  status: "draft",
  elements: [
    {
      id: "landing-hero",
      html: `<section data-funnel-checkpoint="entry" style="min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:32px;background:linear-gradient(135deg,#0f172a,#1e293b);font-family:Manrope,system-ui,sans-serif;">
  <div style="max-width:720px;">
    <div style="display:inline-block;padding:6px 14px;border:1px solid rgba(255,255,255,.35);border-radius:999px;font-size:12px;color:#fff;letter-spacing:.06em;text-transform:uppercase;margin-bottom:24px;">Limited time offer</div>
    <h1 style="font-size:64px;line-height:1.05;letter-spacing:-0.03em;margin:0 0 20px;color:#fff;">Your headline goes here</h1>
    <p style="font-size:18px;color:rgba(255,255,255,.85);margin:0 0 32px;">A compelling subheadline that drives action and explains the value proposition.</p>
    <div style="display:flex;gap:12px;justify-content:center;">
      <button data-funnel-checkpoint="checkpoint_a" style="background:#C9A227;color:#0f172a;border:0;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;">Get Started Free</button>
      <button style="background:transparent;color:#fff;border:1px solid rgba(255,255,255,.5);padding:14px 28px;border-radius:8px;font-size:15px;cursor:pointer;">Learn More</button>
    </div>
  </div>
</section>`,
    },
    {
      id: "landing-benefits",
      html: `<section data-funnel-checkpoint="checkpoint_b" style="padding:72px 32px;background:#ffffff;font-family:Manrope,system-ui,sans-serif;">
  <div style="max-width:1120px;margin:0 auto;">
    <h2 style="font-size:34px;letter-spacing:-0.02em;margin:0 0 32px;color:#0f172a;text-align:center;">Why choose us</h2>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;">
      <div style="padding:24px;border:1px solid #e2e8f0;border-radius:12px;">
        <div style="font-size:28px;margin-bottom:12px;">⚡</div>
        <div style="font-weight:700;font-size:16px;color:#0f172a;margin-bottom:8px;">Fast</div>
        <p style="margin:0;font-size:14px;line-height:1.6;color:#64748b;">Lightning-fast performance that keeps visitors engaged.</p>
      </div>
      <div style="padding:24px;border:1px solid #e2e8f0;border-radius:12px;">
        <div style="font-size:28px;margin-bottom:12px;">🛡️</div>
        <div style="font-weight:700;font-size:16px;color:#0f172a;margin-bottom:8px;">Secure</div>
        <p style="margin:0;font-size:14px;line-height:1.6;color:#64748b;">Enterprise-grade security built into every layer.</p>
      </div>
      <div style="padding:24px;border:1px solid #e2e8f0;border-radius:12px;">
        <div style="font-size:28px;margin-bottom:12px;">📈</div>
        <div style="font-weight:700;font-size:16px;color:#0f172a;margin-bottom:8px;">Scalable</div>
        <p style="margin:0;font-size:14px;line-height:1.6;color:#64748b;">Grows with you from first user to millions.</p>
      </div>
    </div>
  </div>
</section>`,
    },
    {
      id: "landing-form",
      html: `<section data-funnel-checkpoint="conversion" style="padding:72px 32px;background:#f8fafc;font-family:Manrope,system-ui,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:32px;">
    <h2 style="font-size:24px;margin:0 0 20px;color:#0f172a;text-align:center;">Get started today</h2>
    <form data-funnel-form>
      <label style="display:block;font-size:12px;color:#64748b;margin-bottom:6px;">Name</label>
      <input required style="width:100%;box-sizing:border-box;padding:11px 14px;border-radius:8px;border:1px solid #cbd5e1;margin-bottom:14px;font-size:14px;" />
      <label style="display:block;font-size:12px;color:#64748b;margin-bottom:6px;">Email</label>
      <input type="email" required style="width:100%;box-sizing:border-box;padding:11px 14px;border-radius:8px;border:1px solid #cbd5e1;margin-bottom:16px;font-size:14px;" />
      <button type="submit" style="width:100%;padding:13px;background:#C9A227;color:#0f172a;border:0;border-radius:10px;font-weight:600;cursor:pointer;font-size:14px;">Claim Your Spot</button>
    </form>
  </div>
</section>`,
    },
  ],
  head_html: `<script>
(function(){
  // Funnel tracking: fires events to the backend as visitors progress
  // through checkpoints. Uses the project_id baked into the page.
  var pid = window.__WD_PROJECT_ID || "";
  if (!pid) return;
  var visitorId = localStorage.getItem("wd_visitor_id") || ("v_" + Math.random().toString(36).slice(2, 10));
  localStorage.setItem("wd_visitor_id", visitorId);
  var variant = localStorage.getItem("wd_variant") || "control";
  function fire(checkpoint) {
    fetch("/api/funnels/" + pid + "/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkpoint: checkpoint, visitor_id: visitorId, variant: variant })
    }).catch(function(){});
  }
  // Fire entry on load
  fire("entry");
  // Fire checkpoint_a when the first CTA is clicked
  document.addEventListener("click", function(e) {
    var el = e.target.closest("[data-funnel-checkpoint]");
    if (el) fire(el.getAttribute("data-funnel-checkpoint"));
  });
  // Fire conversion on form submit
  document.addEventListener("submit", function(e) {
    if (e.target.hasAttribute("data-funnel-form")) fire("conversion");
  });
})();
</script>`,
};