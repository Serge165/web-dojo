// Extra block categories that merge into blocks.js CATEGORIES — a big 2026
// revamp of headers, navbars, footers and video-background tools.
const F = "Manrope,system-ui,sans-serif";
const VID = "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
const VPOSTER = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&q=70";

const AVA = [
  "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&q=75",
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=75",
  "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&q=75",
  "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=200&q=75",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=75",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=75",
];
const PORT = [
  "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&q=70",
  "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&q=70",
  "https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=800&q=70",
  "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=70",
  "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800&q=70",
  "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=70",
];

// Comment thread: seed data lives as an inline <script type="application/
// json"> tag (not a fetched sibling .json file — that breaks under file://
// via CORS, which is how people often first open an exported .html before
// deploying it) and COMMENTS_JS renders it client-side, with a real (if
// non-persistent) "post a comment" form. COMMENTS_JS carries the
// data-forge-js="comments.js" marker so Web Dojo's export pipeline pulls
// it into a real js/comments.js file instead of repeating it inline on
// every page that uses it (see extractForgeJs in exportHtml.js / server.py
// _extract_forge_js — keep this script's *behavior* in sync with the
// hand-copied identical strings in backend/starter_templates.py's
// Xanga/LiveJournal starters, which can't import this JS module).
const COMMENTS_JS = `(function(){
function esc(s){var d=document.createElement("div");d.textContent=s==null?"":String(s);return d.innerHTML;}
function renderComment(c){
  return '<div style="display:flex;gap:12px;padding:14px 0;border-bottom:1px solid var(--fc-border, #e2e8f0);">'
    + (c.avatar ? '<img src="'+esc(c.avatar)+'" alt="" style="width:38px;height:38px;border-radius:999px;object-fit:cover;flex:none;">'
                : '<div style="width:38px;height:38px;border-radius:999px;background:var(--fc-primary, #6366f1);color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex:none;">'+esc((c.author||"?").slice(0,1).toUpperCase())+'</div>')
    + '<div style="flex:1;min-width:0;">'
    + '<div style="font-size:13px;"><strong style="color:var(--fc-text, #0f172a);">'+esc(c.author)+'</strong>'
    + (c.mood ? ' <span style="color:var(--fc-muted, #94a3b8);">('+esc(c.mood)+')</span>' : '')
    + ' <span style="color:var(--fc-muted, #94a3b8);">'+esc(c.date)+'</span></div>'
    + '<div style="font-size:14px;line-height:1.6;color:var(--fc-text, #334155);margin-top:4px;">'+esc(c.text)+'</div>'
    + '</div></div>';
}
function initWidget(root){
  root.setAttribute("data-forge-comments-init","1");
  var seedEl=root.querySelector("[data-forge-comments-seed]");
  var comments=[];
  try{comments=JSON.parse(seedEl?seedEl.textContent:"[]");}catch(e){comments=[];}
  var list=root.querySelector("[data-forge-comment-list]");
  var countEl=root.querySelector("[data-forge-comment-count]");
  function renderAll(){
    if(list) list.innerHTML=comments.map(renderComment).join("");
    if(countEl) countEl.textContent=String(comments.length);
  }
  renderAll();
  var form=root.querySelector("[data-forge-comment-form]");
  if(form){
    form.addEventListener("submit",function(e){
      e.preventDefault();
      var nameInput=form.querySelector('[name="name"]');
      var textInput=form.querySelector('[name="text"]');
      var name=(nameInput&&nameInput.value||"").trim();
      var text=(textInput&&textInput.value||"").trim();
      if(!name||!text) return;
      comments.push({id:Date.now(),author:name,date:"Just now",text:text});
      renderAll();
      form.reset();
    });
  }
}
function init(){
  var roots=document.querySelectorAll("[data-forge-comments]:not([data-forge-comments-init])");
  for(var i=0;i<roots.length;i++) initWidget(roots[i]);
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init); else init();
})();`;

// Builds a full comment-thread section: heading + count, comment list,
// a working (client-only) "post a comment" form, the JSON seed, and the
// shared behavior script. `styleOverrides` lets a template (e.g. a Xanga/
// LiveJournal throwback) restyle the wrapper/heading while reusing the
// exact same structure and script.
const buildCommentsSectionHtml = ({ seedComments, wrapStyle, headingStyle }) => `<section data-forge-comments style="${wrapStyle || `font-family:${F};padding:56px 32px;background:var(--fc-bg, #ffffff);`}">
  <div style="max-width:640px;margin:0 auto;">
    <h3 style="${headingStyle || "font-size:20px;margin:0 0 16px;color:var(--fc-text, #0f172a);"}">Comments (<span data-forge-comment-count>0</span>)</h3>
    <div data-forge-comment-list></div>
    <form data-forge-comment-form style="display:flex;flex-direction:column;gap:8px;margin-top:20px;">
      <input name="name" placeholder="Your name" required style="padding:10px 12px;border-radius:8px;border:1px solid var(--fc-border, #cbd5e1);font-size:14px;outline:none;">
      <textarea name="text" placeholder="Say something..." required rows="3" style="padding:10px 12px;border-radius:8px;border:1px solid var(--fc-border, #cbd5e1);font-size:14px;outline:none;resize:vertical;"></textarea>
      <button type="submit" style="align-self:flex-start;padding:10px 20px;background:var(--fc-primary, #0f172a);color:#fff;border:0;border-radius:8px;font-weight:600;cursor:pointer;font-size:14px;">Post Comment</button>
    </form>
    <script type="application/json" data-forge-comments-seed>${JSON.stringify(seedComments || [])}</script>
    <script data-forge-js="comments.js">${COMMENTS_JS}</script>
  </div>
</section>`;

// background-attachment:fixed is the actual parallax mechanism for every
// block below — it's the one native, zero-JS way to get a real depth
// effect (background stays put in the viewport while foreground content
// scrolls over it) that also renders correctly live in the Design canvas,
// unlike a scroll-linked JS/transform approach, which — like every other
// <script>-driven effect in this codebase — wouldn't execute in the
// canvas's dangerouslySetInnerHTML rendering at all. Known platform
// limitation: iOS Safari ignores background-attachment:fixed and treats
// it as `scroll` instead, so these degrade to an ordinary (non-parallax,
// still fully legible) background image there — not broken, just flat.
const PARALLAX_MOUNTAIN = "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1600&q=70";
const PARALLAX_CITY = "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1600&q=70";
const PARALLAX_OCEAN = "https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1600&q=70";
const PARALLAX_FOREST = "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1600&q=70";
const PARALLAX_DESERT = "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1600&q=70";

export const EXTRA_CATEGORIES = [
  {
    id: "navbars",
    label: "Navbars",
    blocks: [
      {
        id: "nav-centered-logo",
        label: "Centered Logo Nav",
        html: `<nav class="block block-navbars-centered-logo-1 block-navbars-centered-logo">
  <div class="block block-navbars-centered-logo-2 block-navbars-centered-logo">
    <a href="#" class="block block-navbars-centered-logo-3 block-navbars-centered-logo">Shop</a><a href="#" class="block block-navbars-centered-logo-4 block-navbars-centered-logo">New</a><a href="#" class="block block-navbars-centered-logo-5 block-navbars-centered-logo">About</a>
  </div>
  <div class="block block-navbars-centered-logo-6 block-navbars-centered-logo">MAISON</div>
  <div class="block block-navbars-centered-logo-7 block-navbars-centered-logo">
    <a href="#" class="block block-navbars-centered-logo-8 block-navbars-centered-logo">Journal</a><a href="#" class="block block-navbars-centered-logo-9 block-navbars-centered-logo">Cart (0)</a>
  </div>
</nav>`,
      },
      {
        id: "nav-mega",
        label: "Mega-menu Nav",
        html: `<nav class="wd-mega" style="font-family:${F};background:var(--fc-bg, #fff);border-bottom:1px solid var(--fc-border, #ececec);padding:16px 32px;display:flex;align-items:center;justify-content:space-between;position:relative;">
  <div style="font-weight:700;font-size:18px;color:var(--fc-text, #0f172a);">Northwind</div>
  <div style="display:flex;gap:26px;font-size:14px;color:var(--fc-muted, #334155);">
    <div class="wd-mega-item" style="position:relative;"><a href="#" style="color:inherit;text-decoration:none;">Products ▾</a>
      <div class="wd-mega-panel" style="position:absolute;top:32px;left:-20px;width:520px;background:var(--fc-surface, #fff);border:1px solid var(--fc-border, #ececec);border-radius:14px;box-shadow:0 20px 50px rgba(0,0,0,.12);padding:20px;display:none;grid-template-columns:1fr 1fr;gap:14px;z-index:20;">
        ${[["Analytics","Understand your traffic"],["Automations","Set it and forget it"],["Inbox","One place for messages"],["Reports","Beautiful dashboards"]].map(([t,d])=>`<a href="#" style="text-decoration:none;color:var(--fc-text, #0f172a);padding:10px;border-radius:10px;display:block;"><div style="font-weight:600;font-size:14px;">${t}</div><div style="font-size:12px;color:var(--fc-muted, #64748b);">${d}</div></a>`).join("")}
      </div>
    </div>
    <a href="#" style="color:inherit;text-decoration:none;">Pricing</a><a href="#" style="color:inherit;text-decoration:none;">Docs</a>
  </div>
  <button style="background:var(--fc-primary, #0f172a);color:#fff;border:0;padding:9px 18px;border-radius:8px;font-size:13px;cursor:pointer;">Get started</button>
  <style>.wd-mega .wd-mega-item:hover .wd-mega-panel{display:grid;}</style>
</nav>`,
      },
      {
        id: "nav-ecommerce",
        label: "E-commerce Nav + Search",
        html: `<nav class="block block-navbars-ecommerce-1 block-navbars-ecommerce">
  <div class="block block-navbars-ecommerce-2 block-navbars-ecommerce">STORE</div>
  <div class="block block-navbars-ecommerce-3 block-navbars-ecommerce">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
    <input placeholder="Search products…" class="block block-navbars-ecommerce-4 block-navbars-ecommerce" />
  </div>
  <div class="block block-navbars-ecommerce-5 block-navbars-ecommerce">
    <a href="#" class="block block-navbars-ecommerce-6 block-navbars-ecommerce">Account</a>
    <a href="#" class="block block-navbars-ecommerce-7 block-navbars-ecommerce">Cart <span class="block block-navbars-ecommerce-8 block-navbars-ecommerce">3</span></a>
  </div>
</nav>`,
      },
      {
        id: "nav-transparent",
        label: "Transparent Overlay Nav",
        html: `<nav class="block block-navbars-transparent-1 block-navbars-transparent">
  <div class="block block-navbars-transparent-2 block-navbars-transparent">AURORA</div>
  <div class="block block-navbars-transparent-3 block-navbars-transparent">
    <a href="#" class="block block-navbars-transparent-4 block-navbars-transparent">Home</a><a href="#" class="block block-navbars-transparent-5 block-navbars-transparent">Rooms</a><a href="#" class="block block-navbars-transparent-6 block-navbars-transparent">Dining</a>
  </div>
  <button class="block block-navbars-transparent-7 block-navbars-transparent">Book now</button>
</nav>`,
      },
      {
        id: "nav-app-tabs",
        label: "App Pill-tabs Nav",
        html: `<nav class="block block-navbars-app-tabs-1 block-navbars-app-tabs">
  <div class="block block-navbars-app-tabs-2 block-navbars-app-tabs">◐ Flowly</div>
  <div class="block block-navbars-app-tabs-3 block-navbars-app-tabs">
    <a href="#" class="block block-navbars-app-tabs-4 block-navbars-app-tabs">Overview</a><a href="#" class="block block-navbars-app-tabs-5 block-navbars-app-tabs">Projects</a><a href="#" class="block block-navbars-app-tabs-6 block-navbars-app-tabs">Team</a><a href="#" class="block block-navbars-app-tabs-7 block-navbars-app-tabs">Settings</a>
  </div>
  <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80" class="block block-navbars-app-tabs-8 block-navbars-app-tabs" alt="" />
</nav>`,
      },
    ],
  },
  {
    id: "headers",
    label: "Headers",
    blocks: [
      {
        id: "hdr-announcement",
        label: "Announcement + Header",
        html: `<div class="block block-headers-announcement-1 block-headers-announcement">
  <div class="block block-headers-announcement-2 block-headers-announcement">✦ Free shipping on orders over $50 — <a href="#" class="block block-headers-announcement-3 block-headers-announcement">Shop now</a></div>
  <header class="block block-headers-announcement-4 block-headers-announcement">
    <div class="block block-headers-announcement-5 block-headers-announcement">Brand</div>
    <nav class="block block-headers-announcement-6 block-headers-announcement"><a href="#" class="block block-headers-announcement-7 block-headers-announcement">Home</a><a href="#" class="block block-headers-announcement-8 block-headers-announcement">Shop</a><a href="#" class="block block-headers-announcement-9 block-headers-announcement">Blog</a></nav>
    <button class="block block-headers-announcement-10 block-headers-announcement">Contact</button>
  </header>
</div>`,
      },
      {
        id: "hdr-dropdown",
        label: "Header + Dropdown",
        html: `<header class="wd-hd" style="font-family:${F};background:var(--fc-bg, #fff);border-bottom:1px solid var(--fc-border, #ececec);padding:18px 32px;display:flex;align-items:center;justify-content:space-between;position:relative;">
  <div style="font-weight:700;font-size:19px;color:var(--fc-text, #0f172a);">Vertex</div>
  <nav style="display:flex;gap:26px;font-size:14px;color:var(--fc-muted, #334155);">
    <div class="wd-hd-item" style="position:relative;"><a href="#" style="color:inherit;text-decoration:none;">Solutions ▾</a>
      <div class="wd-hd-menu" style="position:absolute;top:28px;left:0;background:var(--fc-surface, #fff);border:1px solid var(--fc-border, #ececec);border-radius:12px;box-shadow:0 16px 40px rgba(0,0,0,.1);padding:8px;min-width:200px;display:none;z-index:20;">
        ${["For startups","For agencies","For enterprise"].map(t=>`<a href="#" style="display:block;padding:9px 12px;border-radius:8px;text-decoration:none;color:var(--fc-text, #0f172a);font-size:14px;">${t}</a>`).join("")}
      </div>
    </div>
    <a href="#" style="color:inherit;text-decoration:none;">Pricing</a><a href="#" style="color:inherit;text-decoration:none;">Company</a>
  </nav>
  <button style="background:var(--fc-primary, #4f46e5);color:#fff;border:0;padding:9px 18px;border-radius:8px;font-size:13px;cursor:pointer;">Sign up</button>
  <style>.wd-hd .wd-hd-item:hover .wd-hd-menu{display:block;}</style>
</header>`,
      },
      {
        id: "hdr-minimal-serif",
        label: "Minimal Serif Header",
        html: `<header class="block block-headers-minimal-serif-1 block-headers-minimal-serif">
  <div class="block block-headers-minimal-serif-2 block-headers-minimal-serif">The Quarterly</div>
  <nav class="block block-headers-minimal-serif-3 block-headers-minimal-serif">
    <a href="#" class="block block-headers-minimal-serif-4 block-headers-minimal-serif">Essays</a><a href="#" class="block block-headers-minimal-serif-5 block-headers-minimal-serif">Interviews</a><a href="#" class="block block-headers-minimal-serif-6 block-headers-minimal-serif">Archive</a><a href="#" class="block block-headers-minimal-serif-7 block-headers-minimal-serif">Subscribe</a>
  </nav>
</header>`,
      },
      {
        id: "hdr-dark-cta",
        label: "Dark Header + CTA",
        html: `<header class="block block-headers-dark-cta-1 block-headers-dark-cta">
  <div class="block block-headers-dark-cta-2 block-headers-dark-cta"><div class="block block-headers-dark-cta-3 block-headers-dark-cta"></div><span class="block block-headers-dark-cta-4 block-headers-dark-cta">Ignite</span></div>
  <nav class="block block-headers-dark-cta-5 block-headers-dark-cta"><a href="#" class="block block-headers-dark-cta-6 block-headers-dark-cta">Product</a><a href="#" class="block block-headers-dark-cta-7 block-headers-dark-cta">Customers</a><a href="#" class="block block-headers-dark-cta-8 block-headers-dark-cta">Pricing</a></nav>
  <div class="block block-headers-dark-cta-9 block-headers-dark-cta"><button class="block block-headers-dark-cta-10 block-headers-dark-cta">Log in</button><button class="block block-headers-dark-cta-11 block-headers-dark-cta">Start free</button></div>
</header>`,
      },
      {
        id: "hdr-search-actions",
        label: "Header + Search + Icons",
        html: `<header class="block block-headers-search-actions-1 block-headers-search-actions">
  <div class="block block-headers-search-actions-2 block-headers-search-actions">Docs</div>
  <nav class="block block-headers-search-actions-3 block-headers-search-actions"><a href="#" class="block block-headers-search-actions-4 block-headers-search-actions">Guides</a><a href="#" class="block block-headers-search-actions-5 block-headers-search-actions">API</a><a href="#" class="block block-headers-search-actions-6 block-headers-search-actions">Examples</a></nav>
  <div class="block block-headers-search-actions-7 block-headers-search-actions"></div>
  <div class="block block-headers-search-actions-8 block-headers-search-actions"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg><input placeholder="Search docs ⌘K" class="block block-headers-search-actions-9 block-headers-search-actions" /></div>
  <a href="#" class="block block-headers-search-actions-10 block-headers-search-actions">◔</a>
</header>`,
      },
    ],
  },
  {
    id: "footers",
    label: "Footers",
    blocks: [
      {
        id: "ft-minimal",
        label: "Minimal Footer",
        html: `<footer class="block block-footers-minimal-1 block-footers-minimal">
  <div class="block block-footers-minimal-2 block-footers-minimal">© 2026 Brand — All rights reserved.</div>
  <div class="block block-footers-minimal-3 block-footers-minimal"><a href="#" class="block block-footers-minimal-4 block-footers-minimal">Privacy</a><a href="#" class="block block-footers-minimal-5 block-footers-minimal">Terms</a><a href="#" class="block block-footers-minimal-6 block-footers-minimal">Contact</a></div>
</footer>`,
      },
      {
        id: "ft-newsletter",
        label: "Newsletter Footer",
        html: `<footer class="block block-footers-newsletter-1 block-footers-newsletter">
  <div class="block block-footers-newsletter-2 block-footers-newsletter">
    <div><h3 class="block block-footers-newsletter-3 block-footers-newsletter">Stay in the loop</h3><p class="block block-footers-newsletter-4 block-footers-newsletter">One thoughtful email a week. No spam.</p></div>
    <form class="block block-footers-newsletter-5 block-footers-newsletter"><input placeholder="you@example.com" class="block block-footers-newsletter-6 block-footers-newsletter" /><button class="block block-footers-newsletter-7 block-footers-newsletter">Subscribe</button></form>
  </div>
  <div class="block block-footers-newsletter-8 block-footers-newsletter">© 2026 Brand.</div>
</footer>`,
      },
      {
        id: "ft-social-dark",
        label: "Social Footer",
        html: `<footer class="block block-footers-social-dark-1 block-footers-social-dark">
  <div class="block block-footers-social-dark-2 block-footers-social-dark">AURORA</div>
  <div class="block block-footers-social-dark-3 block-footers-social-dark">
    <a href="#" class="block block-footers-social-dark-4 block-footers-social-dark">Instagram</a><a href="#" class="block block-footers-social-dark-5 block-footers-social-dark">X</a><a href="#" class="block block-footers-social-dark-6 block-footers-social-dark">YouTube</a><a href="#" class="block block-footers-social-dark-7 block-footers-social-dark">TikTok</a>
  </div>
  <div class="block block-footers-social-dark-8 block-footers-social-dark">© 2026 Aurora Studio. Made with care.</div>
</footer>`,
      },
      {
        id: "ft-columns-light",
        label: "4-column Light Footer",
        html: `<footer class="block block-footers-columns-light-1 block-footers-columns-light">
  <div class="block block-footers-columns-light-2 block-footers-columns-light">
    <div><div class="block block-footers-columns-light-3 block-footers-columns-light">Brand</div><p class="block block-footers-columns-light-4 block-footers-columns-light">Design and ship beautiful sites, fast.</p></div>
    <div><div class="block block-footers-columns-light-5 block-footers-columns-light">Product</div><a href="#" class="block block-footers-columns-light-6 block-footers-columns-light">Features</a><a href="#" class="block block-footers-columns-light-7 block-footers-columns-light">Pricing</a><a href="#" class="block block-footers-columns-light-8 block-footers-columns-light">Roadmap</a></div><div><div class="block block-footers-columns-light-9 block-footers-columns-light">Resources</div><a href="#" class="block block-footers-columns-light-10 block-footers-columns-light">Blog</a><a href="#" class="block block-footers-columns-light-11 block-footers-columns-light">Guides</a><a href="#" class="block block-footers-columns-light-12 block-footers-columns-light">Support</a></div><div><div class="block block-footers-columns-light-13 block-footers-columns-light">Company</div><a href="#" class="block block-footers-columns-light-14 block-footers-columns-light">About</a><a href="#" class="block block-footers-columns-light-15 block-footers-columns-light">Careers</a><a href="#" class="block block-footers-columns-light-16 block-footers-columns-light">Legal</a></div>
  </div>
</footer>`,
      },
      {
        id: "ft-contact",
        label: "Contact Footer",
        html: `<footer class="block block-footers-contact-1 block-footers-contact">
  <div class="block block-footers-contact-2 block-footers-contact">
    <div><div class="block block-footers-contact-3 block-footers-contact">Get in touch</div><p class="block block-footers-contact-4 block-footers-contact">hello@example.com<br/>+1 (555) 019-2834<br/>24 Harbour St, Suite 400</p></div>
    <div><div class="block block-footers-contact-5 block-footers-contact">Hours</div><p class="block block-footers-contact-6 block-footers-contact">Mon–Fri · 9–6<br/>Sat · 10–4<br/>Sun · Closed</p></div>
    <div><div class="block block-footers-contact-7 block-footers-contact">Follow</div><p class="block block-footers-contact-8 block-footers-contact">Instagram<br/>LinkedIn<br/>YouTube</p></div>
  </div>
  <div class="block block-footers-contact-9 block-footers-contact">© 2026 Brand.</div>
</footer>`,
      },
      {
        id: "ft-app-download",
        label: "App Download Footer",
        html: `<footer class="block block-footers-app-download-1 block-footers-app-download">
  <h3 class="block block-footers-app-download-2 block-footers-app-download">Take it everywhere</h3>
  <p class="block block-footers-app-download-3 block-footers-app-download">Download the app for iOS and Android.</p>
  <div class="block block-footers-app-download-4 block-footers-app-download">
    <a href="#" class="block block-footers-app-download-5 block-footers-app-download">↧ App Store</a>
    <a href="#" class="block block-footers-app-download-6 block-footers-app-download">↧ Google Play</a>
  </div>
</footer>`,
      },
      {
        id: "ft-mega-multicol",
        label: "Mega 5-column Footer",
        html: `<footer class="block block-footers-mega-multicol-1 block-footers-mega-multicol">
  <div class="block block-footers-mega-multicol-2 block-footers-mega-multicol">
    <div><div class="block block-footers-mega-multicol-3 block-footers-mega-multicol">Brand</div><p class="block block-footers-mega-multicol-4 block-footers-mega-multicol">Tools for teams who ship fast and design well.</p></div>
    <div><div class="block block-footers-mega-multicol-5 block-footers-mega-multicol">Product</div><a href="#" class="block block-footers-mega-multicol-6 block-footers-mega-multicol">Features</a><a href="#" class="block block-footers-mega-multicol-7 block-footers-mega-multicol">Integrations</a><a href="#" class="block block-footers-mega-multicol-8 block-footers-mega-multicol">Changelog</a></div><div><div class="block block-footers-mega-multicol-9 block-footers-mega-multicol">Solutions</div><a href="#" class="block block-footers-mega-multicol-10 block-footers-mega-multicol">Agencies</a><a href="#" class="block block-footers-mega-multicol-11 block-footers-mega-multicol">Startups</a><a href="#" class="block block-footers-mega-multicol-12 block-footers-mega-multicol">Enterprise</a></div><div><div class="block block-footers-mega-multicol-13 block-footers-mega-multicol">Resources</div><a href="#" class="block block-footers-mega-multicol-14 block-footers-mega-multicol">Blog</a><a href="#" class="block block-footers-mega-multicol-15 block-footers-mega-multicol">Guides</a><a href="#" class="block block-footers-mega-multicol-16 block-footers-mega-multicol">API Docs</a></div><div><div class="block block-footers-mega-multicol-17 block-footers-mega-multicol">Company</div><a href="#" class="block block-footers-mega-multicol-18 block-footers-mega-multicol">About</a><a href="#" class="block block-footers-mega-multicol-19 block-footers-mega-multicol">Careers</a><a href="#" class="block block-footers-mega-multicol-20 block-footers-mega-multicol">Press</a></div>
  </div>
  <div class="block block-footers-mega-multicol-21 block-footers-mega-multicol">
    <span>© 2026 Brand. All rights reserved.</span>
    <div class="block block-footers-mega-multicol-22 block-footers-mega-multicol"><a href="#" class="block block-footers-mega-multicol-23 block-footers-mega-multicol">Privacy</a><a href="#" class="block block-footers-mega-multicol-24 block-footers-mega-multicol">Terms</a><a href="#" class="block block-footers-mega-multicol-25 block-footers-mega-multicol">Cookies</a></div>
  </div>
</footer>`,
      },
    ],
  },
  {
    id: "video",
    label: "Video BG",
    blocks: [
      {
        id: "video-hero",
        label: "Hero · Video Background",
        html: `<section class="block block-video-hero-1 block-video-hero">
  <video autoplay muted loop playsinline poster="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&q=70" class="block block-video-hero-2 block-video-hero"><source src="https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" type="video/mp4" /></video>
  <div class="block block-video-hero-3 block-video-hero"></div>
  <div class="block block-video-hero-4 block-video-hero">
    <h1 class="block block-video-hero-5 block-video-hero">Motion tells your story</h1>
    <p class="block block-video-hero-6 block-video-hero">A cinematic hero with a looping background video. Muted, auto-playing, mobile-friendly.</p>
    <a href="#" class="block block-video-hero-7 block-video-hero">Watch the film</a>
  </div>
</section>`,
      },
      {
        id: "video-section",
        label: "Section · Video + Text",
        html: `<section class="block block-video-section-1 block-video-section">
  <div class="block block-video-section-2 block-video-section">
    <div class="block block-video-section-3 block-video-section"><video autoplay muted loop playsinline poster="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&q=70" class="block block-video-section-4 block-video-section"><source src="https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" type="video/mp4" /></video></div>
    <div>
      <div class="block block-video-section-5 block-video-section">See it in action</div>
      <h2 class="block block-video-section-6 block-video-section">Built to move</h2>
      <p class="block block-video-section-7 block-video-section">Pair looping product footage with crisp copy. The video autoplays muted and loops seamlessly on every device.</p>
      <a href="#" class="block block-video-section-8 block-video-section">Learn more</a>
    </div>
  </div>
</section>`,
      },
      {
        id: "video-banner",
        label: "Video Banner Strip",
        html: `<section class="block block-video-banner-1 block-video-banner">
  <video autoplay muted loop playsinline poster="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&q=70" class="block block-video-banner-2 block-video-banner"><source src="https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" type="video/mp4" /></video>
  <div class="block block-video-banner-3 block-video-banner"></div>
  <div class="block block-video-banner-4 block-video-banner">
    <h2 class="block block-video-banner-5 block-video-banner">Adventure awaits</h2>
    <p class="block block-video-banner-6 block-video-banner">A compact full-bleed video banner for section breaks.</p>
  </div>
</section>`,
      },
    ],
  },
  {
    id: "pricing",
    label: "Pricing",
    blocks: [
      {
        id: "pricing-toggle",
        label: "Pricing · Monthly/Yearly Toggle",
        html: `<section style="font-family:${F};padding:72px 32px;background:var(--fc-bg, #ffffff);">
  <div class="wd-pricing" style="max-width:1120px;margin:0 auto;text-align:center;">
    <h2 style="font-size:34px;letter-spacing:-.02em;margin:0 0 8px;color:var(--fc-text, #0f172a);">Simple pricing</h2>
    <p style="margin:0 0 28px;color:var(--fc-muted, #64748b);font-size:15px;">Switch between monthly and yearly billing.</p>
    <input type="checkbox" id="wd-pt" class="wd-pt-toggle" style="display:none;" />
    <label for="wd-pt" style="display:inline-flex;align-items:center;gap:10px;margin-bottom:36px;cursor:pointer;font-size:14px;color:var(--fc-muted, #64748b);">
      <span>Monthly</span>
      <span style="width:44px;height:24px;border-radius:999px;background:var(--fc-border, #e2e8f0);position:relative;display:inline-block;">
        <span class="wd-pt-dot" style="position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:999px;background:var(--fc-primary, #4f46e5);transition:transform .2s;"></span>
      </span>
      <span>Yearly <span style="color:#16a34a;font-weight:600;">(save 20%)</span></span>
    </label>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;text-align:left;">
      ${[["Starter","9","86"],["Growth","29","278"],["Scale","79","758"]].map(([n,m,y],i)=>`
      <div style="padding:28px;border-radius:16px;border:1px solid var(--fc-border, #e2e8f0);${i===1?"box-shadow:0 20px 50px rgba(0,0,0,.08);border-color:var(--fc-primary, #4f46e5);":""}background:var(--fc-surface, #fff);">
        <div style="font-weight:700;font-size:16px;color:var(--fc-text, #0f172a);margin-bottom:6px;">${n}</div>
        <div style="font-size:38px;font-weight:800;color:var(--fc-text, #0f172a);margin-bottom:4px;"><span class="wd-price-m">$${m}</span><span class="wd-price-y">$${y}</span><span style="font-size:14px;font-weight:500;color:var(--fc-muted, #64748b);">/mo</span></div>
        <ul style="list-style:none;padding:0;margin:18px 0 22px;font-size:13px;color:var(--fc-muted, #64748b);line-height:2;">
          <li>✓ Full feature access</li><li>✓ Priority support</li><li>✓ Unlimited projects</li>
        </ul>
        <a href="#" style="display:block;text-align:center;padding:11px;border-radius:10px;background:${i===1?"var(--fc-primary, #4f46e5)":"transparent"};color:${i===1?"#fff":"var(--fc-text, #0f172a)"};border:1px solid var(--fc-border, #e2e8f0);text-decoration:none;font-weight:600;font-size:14px;">Choose ${n}</a>
      </div>`).join("")}
    </div>
    <style>
      .wd-pricing .wd-price-y{display:none;}
      .wd-pricing .wd-pt-toggle:checked ~ label .wd-pt-dot{transform:translateX(20px);}
      .wd-pricing .wd-pt-toggle:checked ~ div .wd-price-m{display:none;}
      .wd-pricing .wd-pt-toggle:checked ~ div .wd-price-y{display:inline;}
    </style>
  </div>
</section>`,
      },
    ],
  },
  {
    id: "team",
    label: "Team",
    blocks: [
      {
        id: "team-cards",
        label: "Team · Member Cards",
        html: `<section class="block block-team-cards-1 block-team-cards">
  <div class="block block-team-cards-2 block-team-cards">
    <h2 class="block block-team-cards-3 block-team-cards">Meet the team</h2>
    <div class="block block-team-cards-4 block-team-cards">
      
      <div class="block block-team-cards-5 block-team-cards">
        <img src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&q=75" class="block block-team-cards-6 block-team-cards" alt="Ava Chen" />
        <div class="block block-team-cards-7 block-team-cards">Ava Chen</div>
        <div class="block block-team-cards-8 block-team-cards">Product Lead</div>
        <div class="block block-team-cards-9 block-team-cards">
          <a href="#" class="block block-team-cards-10 block-team-cards" aria-label="LinkedIn"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 11-.02 5.001A2.5 2.5 0 014.98 3.5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-.98 1.83-2 3.76-2 4.02 0 4.76 2.5 4.76 5.76V21h-4v-5.85c0-1.4-.03-3.2-2-3.2-2 0-2.3 1.5-2.3 3.1V21H9z"/></svg></a>
          <a href="#" class="block block-team-cards-11 block-team-cards" aria-label="Twitter"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22 5.9c-.7.3-1.5.6-2.3.7.8-.5 1.5-1.3 1.8-2.3-.8.5-1.7.8-2.6 1a4.1 4.1 0 00-7 3.7A11.6 11.6 0 013 4.9a4.1 4.1 0 001.3 5.5c-.7 0-1.3-.2-1.9-.5v.1c0 2 1.4 3.6 3.3 4a4.1 4.1 0 01-1.9.1c.5 1.6 2.1 2.8 3.9 2.9A8.2 8.2 0 012 18.6a11.6 11.6 0 006.3 1.8c7.5 0 11.7-6.3 11.7-11.7v-.5c.8-.6 1.5-1.3 2-2.1z"/></svg></a>
        </div>
      </div>
      <div class="block block-team-cards-12 block-team-cards">
        <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=75" class="block block-team-cards-13 block-team-cards" alt="Marcus Reed" />
        <div class="block block-team-cards-14 block-team-cards">Marcus Reed</div>
        <div class="block block-team-cards-15 block-team-cards">Engineering</div>
        <div class="block block-team-cards-16 block-team-cards">
          <a href="#" class="block block-team-cards-17 block-team-cards" aria-label="LinkedIn"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 11-.02 5.001A2.5 2.5 0 014.98 3.5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-.98 1.83-2 3.76-2 4.02 0 4.76 2.5 4.76 5.76V21h-4v-5.85c0-1.4-.03-3.2-2-3.2-2 0-2.3 1.5-2.3 3.1V21H9z"/></svg></a>
          <a href="#" class="block block-team-cards-18 block-team-cards" aria-label="Twitter"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22 5.9c-.7.3-1.5.6-2.3.7.8-.5 1.5-1.3 1.8-2.3-.8.5-1.7.8-2.6 1a4.1 4.1 0 00-7 3.7A11.6 11.6 0 013 4.9a4.1 4.1 0 001.3 5.5c-.7 0-1.3-.2-1.9-.5v.1c0 2 1.4 3.6 3.3 4a4.1 4.1 0 01-1.9.1c.5 1.6 2.1 2.8 3.9 2.9A8.2 8.2 0 012 18.6a11.6 11.6 0 006.3 1.8c7.5 0 11.7-6.3 11.7-11.7v-.5c.8-.6 1.5-1.3 2-2.1z"/></svg></a>
        </div>
      </div>
      <div class="block block-team-cards-19 block-team-cards">
        <img src="https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&q=75" class="block block-team-cards-20 block-team-cards" alt="Priya Nair" />
        <div class="block block-team-cards-21 block-team-cards">Priya Nair</div>
        <div class="block block-team-cards-22 block-team-cards">Design</div>
        <div class="block block-team-cards-23 block-team-cards">
          <a href="#" class="block block-team-cards-24 block-team-cards" aria-label="LinkedIn"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 11-.02 5.001A2.5 2.5 0 014.98 3.5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-.98 1.83-2 3.76-2 4.02 0 4.76 2.5 4.76 5.76V21h-4v-5.85c0-1.4-.03-3.2-2-3.2-2 0-2.3 1.5-2.3 3.1V21H9z"/></svg></a>
          <a href="#" class="block block-team-cards-25 block-team-cards" aria-label="Twitter"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22 5.9c-.7.3-1.5.6-2.3.7.8-.5 1.5-1.3 1.8-2.3-.8.5-1.7.8-2.6 1a4.1 4.1 0 00-7 3.7A11.6 11.6 0 013 4.9a4.1 4.1 0 001.3 5.5c-.7 0-1.3-.2-1.9-.5v.1c0 2 1.4 3.6 3.3 4a4.1 4.1 0 01-1.9.1c.5 1.6 2.1 2.8 3.9 2.9A8.2 8.2 0 012 18.6a11.6 11.6 0 006.3 1.8c7.5 0 11.7-6.3 11.7-11.7v-.5c.8-.6 1.5-1.3 2-2.1z"/></svg></a>
        </div>
      </div>
      <div class="block block-team-cards-26 block-team-cards">
        <img src="https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=200&q=75" class="block block-team-cards-27 block-team-cards" alt="Tom Vidal" />
        <div class="block block-team-cards-28 block-team-cards">Tom Vidal</div>
        <div class="block block-team-cards-29 block-team-cards">Growth</div>
        <div class="block block-team-cards-30 block-team-cards">
          <a href="#" class="block block-team-cards-31 block-team-cards" aria-label="LinkedIn"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 11-.02 5.001A2.5 2.5 0 014.98 3.5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-.98 1.83-2 3.76-2 4.02 0 4.76 2.5 4.76 5.76V21h-4v-5.85c0-1.4-.03-3.2-2-3.2-2 0-2.3 1.5-2.3 3.1V21H9z"/></svg></a>
          <a href="#" class="block block-team-cards-32 block-team-cards" aria-label="Twitter"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22 5.9c-.7.3-1.5.6-2.3.7.8-.5 1.5-1.3 1.8-2.3-.8.5-1.7.8-2.6 1a4.1 4.1 0 00-7 3.7A11.6 11.6 0 013 4.9a4.1 4.1 0 001.3 5.5c-.7 0-1.3-.2-1.9-.5v.1c0 2 1.4 3.6 3.3 4a4.1 4.1 0 01-1.9.1c.5 1.6 2.1 2.8 3.9 2.9A8.2 8.2 0 012 18.6a11.6 11.6 0 006.3 1.8c7.5 0 11.7-6.3 11.7-11.7v-.5c.8-.6 1.5-1.3 2-2.1z"/></svg></a>
        </div>
      </div>
    </div>
  </div>
</section>`,
      },
    ],
  },
  {
    id: "faq",
    label: "FAQ",
    blocks: [
      {
        id: "faq-accordion",
        label: "FAQ · Accordion",
        html: `<section style="font-family:${F};padding:72px 32px;background:var(--fc-bg, #ffffff);">
  <div class="wd-faq" style="max-width:760px;margin:0 auto;">
    <h2 style="font-size:34px;letter-spacing:-.02em;margin:0 0 28px;color:var(--fc-text, #0f172a);text-align:center;">Frequently asked</h2>
    ${[["Can I cancel anytime?","Yes, cancel from your account settings with no fees or lock-in period."],["Do you offer a free trial?","Every plan starts with a 14-day free trial, no card required."],["Is my data secure?","All data is encrypted in transit and at rest, with daily backups."],["Can I change plans later?","Upgrade or downgrade anytime — billing prorates automatically."]].map(([q,a])=>`
    <details style="border-bottom:1px solid var(--fc-border, #e2e8f0);padding:18px 0;">
      <summary style="cursor:pointer;list-style:none;display:flex;align-items:center;justify-content:space-between;font-weight:600;font-size:15px;color:var(--fc-text, #0f172a);">
        ${q}
        <span class="wd-chev" style="transition:transform .2s;color:var(--fc-muted, #94a3b8);">⌄</span>
      </summary>
      <p style="margin:12px 0 0;font-size:14px;line-height:1.7;color:var(--fc-muted, #64748b);">${a}</p>
    </details>`).join("")}
    <style>.wd-faq details[open] .wd-chev{transform:rotate(180deg);} .wd-faq summary::-webkit-details-marker{display:none;}</style>
  </div>
</section>`,
      },
    ],
  },
  {
    id: "newsletter",
    label: "Newsletter",
    blocks: [
      {
        id: "newsletter-signup",
        label: "Newsletter · Signup + Validation",
        html: `<section style="font-family:${F};padding:72px 32px;background:var(--fc-bg, #f8fafc);">
  <form class="wd-nl" novalidate style="max-width:480px;margin:0 auto;text-align:center;">
    <h2 style="font-size:28px;letter-spacing:-.02em;margin:0 0 8px;color:var(--fc-text, #0f172a);">Join the newsletter</h2>
    <p style="margin:0 0 24px;font-size:14px;color:var(--fc-muted, #64748b);">Product updates and design notes, twice a month.</p>
    <div style="display:flex;gap:8px;">
      <input type="email" required placeholder="you@example.com" style="flex:1;padding:13px 16px;border-radius:10px;border:1px solid var(--fc-border, #cbd5e1);font-size:14px;outline:none;" />
      <button type="submit" style="padding:13px 22px;background:var(--fc-primary, #0f172a);color:#fff;border:0;border-radius:10px;font-weight:600;cursor:pointer;">Subscribe</button>
    </div>
    <p class="wd-nl-err" style="display:none;color:#dc2626;font-size:12px;margin:8px 0 0;text-align:left;">Please enter a valid email address.</p>
    <style>
      .wd-nl:has(input:invalid:not(:placeholder-shown)) .wd-nl-err{display:block;}
      .wd-nl:has(input:invalid:not(:placeholder-shown)) input{border-color:#dc2626;}
    </style>
  </form>
</section>`,
      },
    ],
  },
  {
    id: "portfolio",
    label: "Portfolio",
    blocks: [
      {
        id: "portfolio-filter",
        label: "Portfolio · Filterable Gallery",
        html: `<section style="font-family:${F};padding:72px 32px;background:var(--fc-bg, #ffffff);">
  <div class="wd-portfolio" style="max-width:1120px;margin:0 auto;">
    <h2 style="font-size:34px;letter-spacing:-.02em;margin:0 0 20px;color:var(--fc-text, #0f172a);text-align:center;">Selected work</h2>
    <div style="display:flex;gap:8px;justify-content:center;margin-bottom:28px;flex-wrap:wrap;">
      ${["all","branding","product","web"].map((c,i)=>`<input type="radio" name="wd-pf" id="wd-pf-${c}" ${i===0?"checked":""} style="display:none;" /><label for="wd-pf-${c}" style="cursor:pointer;padding:8px 18px;border-radius:999px;border:1px solid var(--fc-border, #e2e8f0);font-size:13px;color:var(--fc-muted, #64748b);text-transform:capitalize;">${c}</label>`).join("")}
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;">
      ${[[PORT[0],"branding"],[PORT[1],"product"],[PORT[2],"web"],[PORT[3],"branding"],[PORT[4],"product"],[PORT[5],"web"]].map(([src,cat])=>`<div class="wd-pf-item" data-cat="${cat}" style="border-radius:12px;overflow:hidden;aspect-ratio:4/3;"><img src="${src}" style="width:100%;height:100%;object-fit:cover;" alt="" /></div>`).join("")}
    </div>
    <style>
      ${["all","branding","product","web"].map(c=>`.wd-portfolio:has(#wd-pf-${c}:checked) label[for="wd-pf-${c}"]{background:var(--fc-primary, #0f172a);color:#fff;border-color:var(--fc-primary, #0f172a);}`).join("\n      ")}
      ${["branding","product","web"].map(c=>`.wd-portfolio:has(#wd-pf-${c}:checked) .wd-pf-item:not([data-cat="${c}"]){display:none;}`).join("\n      ")}
    </style>
  </div>
</section>`,
      },
    ],
  },
  {
    id: "layout",
    label: "Layout",
    blocks: [
      {
        id: "layout-bento",
        label: "Bento Grid",
        html: `<section class="block block-layout-bento-1 block-layout-bento">
  <div class="block block-layout-bento-2 block-layout-bento">
    <div class="block block-layout-bento-3 block-layout-bento"><div class="block block-layout-bento-4 block-layout-bento">Design system</div><div class="block block-layout-bento-5 block-layout-bento">Tokens, components, and docs in one place.</div></div>
    <div class="block block-layout-bento-6 block-layout-bento"><div class="block block-layout-bento-7 block-layout-bento">Ship faster</div></div>
    <div class="block block-layout-bento-8 block-layout-bento">Analytics</div>
    <div class="block block-layout-bento-9 block-layout-bento">Integrations</div>
    <div class="block block-layout-bento-10 block-layout-bento"><img src="https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&q=70" class="block block-layout-bento-11 block-layout-bento" alt="" /></div>
    <div class="block block-layout-bento-12 block-layout-bento">99.99% uptime</div>
  </div>
</section>`,
      },
    ],
  },
  {
    id: "services",
    label: "Services",
    blocks: [
      {
        id: "services-icons",
        label: "Services · Icon Grid",
        html: `<section class="block block-services-icons-1 block-services-icons">
  <div class="block block-services-icons-2 block-services-icons">
    <h2 class="block block-services-icons-3 block-services-icons">What we do</h2>
    <div class="block block-services-icons-4 block-services-icons">
      
      <div class="block block-services-icons-5 block-services-icons">
        <div class="block block-services-icons-6 block-services-icons">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z"/></svg>
        </div>
        <div class="block block-services-icons-7 block-services-icons">Strategy</div>
        <p class="block block-services-icons-8 block-services-icons">Positioning, research and roadmaps that align teams.</p>
      </div>
      <div class="block block-services-icons-9 block-services-icons">
        <div class="block block-services-icons-10 block-services-icons">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 4v6l4 2"/></svg>
        </div>
        <div class="block block-services-icons-11 block-services-icons">Design</div>
        <p class="block block-services-icons-12 block-services-icons">Interfaces and systems that feel effortless to use.</p>
      </div>
      <div class="block block-services-icons-13 block-services-icons">
        <div class="block block-services-icons-14 block-services-icons">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3L2 12l6 9M16 3l6 9-6 9"/></svg>
        </div>
        <div class="block block-services-icons-15 block-services-icons">Engineering</div>
        <p class="block block-services-icons-16 block-services-icons">Reliable, scalable builds shipped on schedule.</p>
      </div>
    </div>
  </div>
</section>`,
      },
    ],
  },
  {
    id: "contact",
    label: "Contact",
    blocks: [
      {
        id: "contact-recaptcha",
        label: "Contact Form · reCAPTCHA",
        html: `<section style="font-family:${F};padding:72px 32px;background:var(--fc-bg, #f8fafc);">
  <!-- reCAPTCHA: add <script src="https://www.google.com/recaptcha/api.js" async defer></script> to the page head and replace YOUR_SITE_KEY below -->
  <form style="max-width:520px;margin:0 auto;background:var(--fc-surface, #fff);border:1px solid var(--fc-border, #e2e8f0);border-radius:16px;padding:32px;">
    <h2 style="font-size:24px;margin:0 0 20px;color:var(--fc-text, #0f172a);">Get in touch</h2>
    <label style="display:block;font-size:12px;color:var(--fc-muted, #64748b);margin-bottom:6px;">Name</label>
    <input required style="width:100%;box-sizing:border-box;padding:11px 14px;border-radius:8px;border:1px solid var(--fc-border, #cbd5e1);margin-bottom:14px;font-size:14px;" />
    <label style="display:block;font-size:12px;color:var(--fc-muted, #64748b);margin-bottom:6px;">Email</label>
    <input type="email" required style="width:100%;box-sizing:border-box;padding:11px 14px;border-radius:8px;border:1px solid var(--fc-border, #cbd5e1);margin-bottom:14px;font-size:14px;" />
    <label style="display:block;font-size:12px;color:var(--fc-muted, #64748b);margin-bottom:6px;">Message</label>
    <textarea required rows="4" style="width:100%;box-sizing:border-box;padding:11px 14px;border-radius:8px;border:1px solid var(--fc-border, #cbd5e1);margin-bottom:16px;font-size:14px;resize:vertical;"></textarea>
    <div class="g-recaptcha" data-sitekey="YOUR_SITE_KEY" style="margin-bottom:16px;"></div>
    <button type="submit" style="width:100%;padding:13px;background:var(--fc-primary, #0f172a);color:#fff;border:0;border-radius:10px;font-weight:600;cursor:pointer;font-size:14px;">Send message</button>
  </form>
</section>`,
      },
    ],
  },
  {
    id: "testimonials",
    label: "Testimonials",
    blocks: [
      {
        id: "testimonial-carousel",
        label: "Testimonial · Carousel",
        html: `<section class="block block-testimonials-carousel-1 block-testimonials-carousel">
  <div class="block block-testimonials-carousel-2 block-testimonials-carousel">
    <h2 class="block block-testimonials-carousel-3 block-testimonials-carousel">Loved by teams</h2>
  </div>
  <div class="block block-testimonials-carousel-4 block-testimonials-carousel">
    
    <div class="block block-testimonials-carousel-5 block-testimonials-carousel">
      <p class="block block-testimonials-carousel-6 block-testimonials-carousel">"This tool cut our build time in half."</p>
      <div class="block block-testimonials-carousel-7 block-testimonials-carousel">
        <img src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&q=75" class="block block-testimonials-carousel-8 block-testimonials-carousel" alt="" />
        <div><div class="block block-testimonials-carousel-9 block-testimonials-carousel">Jordan Lee</div><div class="block block-testimonials-carousel-10 block-testimonials-carousel">VP Design, Nova</div></div>
      </div>
    </div>
    <div class="block block-testimonials-carousel-11 block-testimonials-carousel">
      <p class="block block-testimonials-carousel-12 block-testimonials-carousel">"Support is fast and the product just works."</p>
      <div class="block block-testimonials-carousel-13 block-testimonials-carousel">
        <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=75" class="block block-testimonials-carousel-14 block-testimonials-carousel" alt="" />
        <div><div class="block block-testimonials-carousel-15 block-testimonials-carousel">Sam Okafor</div><div class="block block-testimonials-carousel-16 block-testimonials-carousel">Founder, Loop</div></div>
      </div>
    </div>
    <div class="block block-testimonials-carousel-17 block-testimonials-carousel">
      <p class="block block-testimonials-carousel-18 block-testimonials-carousel">"Our whole team switched in a week."</p>
      <div class="block block-testimonials-carousel-19 block-testimonials-carousel">
        <img src="https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&q=75" class="block block-testimonials-carousel-20 block-testimonials-carousel" alt="" />
        <div><div class="block block-testimonials-carousel-21 block-testimonials-carousel">Rae Kim</div><div class="block block-testimonials-carousel-22 block-testimonials-carousel">Head of Product, Fera</div></div>
      </div>
    </div>
  </div>
</section>`,
      },
    ],
  },
  {
    id: "esports",
    label: "Esports",
    blocks: [
      {
        id: "esports-roster",
        label: "Esports · Team Roster",
        html: `<section class="block block-esports-roster-1 block-esports-roster">
  <div class="block block-esports-roster-2 block-esports-roster">
    <h2 class="block block-esports-roster-3 block-esports-roster">Roster</h2>
    <p class="block block-esports-roster-4 block-esports-roster">Season 2026</p>
    <div class="block block-esports-roster-5 block-esports-roster">
      
      <div class="block block-esports-roster-6 block-esports-roster">
        <img src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&q=75" class="block block-esports-roster-7 block-esports-roster" alt="Viper" />
        <div class="block block-esports-roster-8 block-esports-roster"><div class="block block-esports-roster-9 block-esports-roster">Viper</div><div class="block block-esports-roster-10 block-esports-roster">IGL</div></div>
      </div>
      <div class="block block-esports-roster-11 block-esports-roster">
        <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=75" class="block block-esports-roster-12 block-esports-roster" alt="Ashen" />
        <div class="block block-esports-roster-13 block-esports-roster"><div class="block block-esports-roster-14 block-esports-roster">Ashen</div><div class="block block-esports-roster-15 block-esports-roster">Duelist</div></div>
      </div>
      <div class="block block-esports-roster-16 block-esports-roster">
        <img src="https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&q=75" class="block block-esports-roster-17 block-esports-roster" alt="Kudo" />
        <div class="block block-esports-roster-18 block-esports-roster"><div class="block block-esports-roster-19 block-esports-roster">Kudo</div><div class="block block-esports-roster-20 block-esports-roster">Support</div></div>
      </div>
      <div class="block block-esports-roster-21 block-esports-roster">
        <img src="https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=200&q=75" class="block block-esports-roster-22 block-esports-roster" alt="Frost" />
        <div class="block block-esports-roster-23 block-esports-roster"><div class="block block-esports-roster-24 block-esports-roster">Frost</div><div class="block block-esports-roster-25 block-esports-roster">Sentinel</div></div>
      </div>
      <div class="block block-esports-roster-26 block-esports-roster">
        <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=75" class="block block-esports-roster-27 block-esports-roster" alt="Ronin" />
        <div class="block block-esports-roster-28 block-esports-roster"><div class="block block-esports-roster-29 block-esports-roster">Ronin</div><div class="block block-esports-roster-30 block-esports-roster">Flex</div></div>
      </div>
    </div>
  </div>
</section>`,
      },
      {
        id: "esports-bracket",
        label: "Esports · Tournament Bracket",
        html: `<section class="block block-esports-bracket-1 block-esports-bracket">
  <div class="block block-esports-bracket-2 block-esports-bracket">
    <h2 class="block block-esports-bracket-3 block-esports-bracket">Bracket</h2>
    <div class="block block-esports-bracket-4 block-esports-bracket">
      
      <div class="block block-esports-bracket-5 block-esports-bracket">
        <div class="block block-esports-bracket-6 block-esports-bracket">Quarterfinals</div>
        
        <div class="block block-esports-bracket-7 block-esports-bracket">
          <div class="block block-esports-bracket-8 block-esports-bracket">Alpha</div>
          <div class="block block-esports-bracket-9 block-esports-bracket">Ronin</div>
        </div>
        <div class="block block-esports-bracket-10 block-esports-bracket">
          <div class="block block-esports-bracket-11 block-esports-bracket">Nova</div>
          <div class="block block-esports-bracket-12 block-esports-bracket">Vertex</div>
        </div>
        <div class="block block-esports-bracket-13 block-esports-bracket">
          <div class="block block-esports-bracket-14 block-esports-bracket">Kaze</div>
          <div class="block block-esports-bracket-15 block-esports-bracket">Wraith</div>
        </div>
        <div class="block block-esports-bracket-16 block-esports-bracket">
          <div class="block block-esports-bracket-17 block-esports-bracket">Onyx</div>
          <div class="block block-esports-bracket-18 block-esports-bracket">Pulse</div>
        </div>
      </div>
      <div class="block block-esports-bracket-19 block-esports-bracket">
        <div class="block block-esports-bracket-20 block-esports-bracket">Semifinals</div>
        
        <div class="block block-esports-bracket-21 block-esports-bracket">
          <div class="block block-esports-bracket-22 block-esports-bracket">Alpha</div>
          <div class="block block-esports-bracket-23 block-esports-bracket">Vertex</div>
        </div>
        <div class="block block-esports-bracket-24 block-esports-bracket">
          <div class="block block-esports-bracket-25 block-esports-bracket">Kaze</div>
          <div class="block block-esports-bracket-26 block-esports-bracket">Onyx</div>
        </div>
      </div>
      <div class="block block-esports-bracket-27 block-esports-bracket">
        <div class="block block-esports-bracket-28 block-esports-bracket">Final</div>
        
        <div class="block block-esports-bracket-29 block-esports-bracket">
          <div class="block block-esports-bracket-30 block-esports-bracket">Alpha</div>
          <div class="block block-esports-bracket-31 block-esports-bracket">Kaze</div>
        </div>
      </div>
    </div>
  </div>
</section>`,
      },
      {
        id: "esports-schedule",
        label: "Esports · Stream Schedule",
        html: `<section class="block block-esports-schedule-1 block-esports-schedule">
  <div class="block block-esports-schedule-2 block-esports-schedule">
    <h2 class="block block-esports-schedule-3 block-esports-schedule">Stream schedule</h2>
    <div class="block block-esports-schedule-4 block-esports-schedule">
      
      <div class="block block-esports-schedule-5 block-esports-schedule">
        <div class="block block-esports-schedule-6 block-esports-schedule">Mon</div>
        <div class="block block-esports-schedule-7 block-esports-schedule">7PM</div>
        <div class="block block-esports-schedule-8 block-esports-schedule">Ranked grind</div>
      </div>
      <div class="block block-esports-schedule-9 block-esports-schedule">
        <div class="block block-esports-schedule-10 block-esports-schedule">Tue</div>
        <div class="block block-esports-schedule-11 block-esports-schedule">Off</div>
        <div class="block block-esports-schedule-12 block-esports-schedule"></div>
      </div>
      <div class="block block-esports-schedule-13 block-esports-schedule">
        <div class="block block-esports-schedule-14 block-esports-schedule">Wed</div>
        <div class="block block-esports-schedule-15 block-esports-schedule">7PM</div>
        <div class="block block-esports-schedule-16 block-esports-schedule">Scrims</div>
      </div>
      <div class="block block-esports-schedule-17 block-esports-schedule">
        <div class="block block-esports-schedule-18 block-esports-schedule">Thu</div>
        <div class="block block-esports-schedule-19 block-esports-schedule">7PM</div>
        <div class="block block-esports-schedule-20 block-esports-schedule">Community night</div>
      </div>
      <div class="block block-esports-schedule-21 block-esports-schedule">
        <div class="block block-esports-schedule-22 block-esports-schedule">Fri</div>
        <div class="block block-esports-schedule-23 block-esports-schedule">8PM</div>
        <div class="block block-esports-schedule-24 block-esports-schedule">Tournament</div>
      </div>
      <div class="block block-esports-schedule-25 block-esports-schedule">
        <div class="block block-esports-schedule-26 block-esports-schedule">Sat</div>
        <div class="block block-esports-schedule-27 block-esports-schedule">2PM</div>
        <div class="block block-esports-schedule-28 block-esports-schedule">VOD review</div>
      </div>
      <div class="block block-esports-schedule-29 block-esports-schedule">
        <div class="block block-esports-schedule-30 block-esports-schedule">Sun</div>
        <div class="block block-esports-schedule-31 block-esports-schedule">Off</div>
        <div class="block block-esports-schedule-32 block-esports-schedule"></div>
      </div>
    </div>
  </div>
</section>`,
      },
      {
        id: "esports-stats",
        label: "Esports · Player Stat Cards",
        html: `<section class="block block-esports-stats-1 block-esports-stats">
  <div class="block block-esports-stats-2 block-esports-stats">
    <h2 class="block block-esports-stats-3 block-esports-stats">Player stats</h2>
    <div class="block block-esports-stats-4 block-esports-stats">
      
      <div class="block block-esports-stats-5 block-esports-stats">
        <div class="block block-esports-stats-6 block-esports-stats">Viper</div>
        <div class="block block-esports-stats-7 block-esports-stats"><span>K/D</span><span class="block block-esports-stats-8 block-esports-stats">1.34</span></div>
        <div class="block block-esports-stats-9 block-esports-stats"><span>Headshot %</span><span class="block block-esports-stats-10 block-esports-stats">78%</span></div>
      </div>
      <div class="block block-esports-stats-11 block-esports-stats">
        <div class="block block-esports-stats-12 block-esports-stats">Ashen</div>
        <div class="block block-esports-stats-13 block-esports-stats"><span>K/D</span><span class="block block-esports-stats-14 block-esports-stats">1.21</span></div>
        <div class="block block-esports-stats-15 block-esports-stats"><span>Headshot %</span><span class="block block-esports-stats-16 block-esports-stats">71%</span></div>
      </div>
      <div class="block block-esports-stats-17 block-esports-stats">
        <div class="block block-esports-stats-18 block-esports-stats">Kudo</div>
        <div class="block block-esports-stats-19 block-esports-stats"><span>K/D</span><span class="block block-esports-stats-20 block-esports-stats">0.98</span></div>
        <div class="block block-esports-stats-21 block-esports-stats"><span>Headshot %</span><span class="block block-esports-stats-22 block-esports-stats">65%</span></div>
      </div>
      <div class="block block-esports-stats-23 block-esports-stats">
        <div class="block block-esports-stats-24 block-esports-stats">Frost</div>
        <div class="block block-esports-stats-25 block-esports-stats"><span>K/D</span><span class="block block-esports-stats-26 block-esports-stats">1.08</span></div>
        <div class="block block-esports-stats-27 block-esports-stats"><span>Headshot %</span><span class="block block-esports-stats-28 block-esports-stats">69%</span></div>
      </div>
    </div>
  </div>
</section>`,
      },
      {
        id: "esports-leaderboard",
        label: "Esports · Leaderboard",
        html: `<section class="block block-esports-leaderboard-1 block-esports-leaderboard">
  <div class="block block-esports-leaderboard-2 block-esports-leaderboard">
    <h2 class="block block-esports-leaderboard-3 block-esports-leaderboard">Leaderboard</h2>
    <div class="block block-esports-leaderboard-4 block-esports-leaderboard">
      <div class="block block-esports-leaderboard-5 block-esports-leaderboard">
        <div>#</div><div>Team</div><div>Wins</div><div>Points</div>
      </div>
      
      <div class="block block-esports-leaderboard-6 block-esports-leaderboard">
        <div class="block block-esports-leaderboard-7 block-esports-leaderboard">1</div>
        <div class="block block-esports-leaderboard-8 block-esports-leaderboard">Alpha Esports</div>
        <div class="block block-esports-leaderboard-9 block-esports-leaderboard">14</div>
        <div class="block block-esports-leaderboard-10 block-esports-leaderboard">842</div>
      </div>
      <div class="block block-esports-leaderboard-11 block-esports-leaderboard">
        <div class="block block-esports-leaderboard-12 block-esports-leaderboard">2</div>
        <div class="block block-esports-leaderboard-13 block-esports-leaderboard">Vertex GG</div>
        <div class="block block-esports-leaderboard-14 block-esports-leaderboard">12</div>
        <div class="block block-esports-leaderboard-15 block-esports-leaderboard">790</div>
      </div>
      <div class="block block-esports-leaderboard-16 block-esports-leaderboard">
        <div class="block block-esports-leaderboard-17 block-esports-leaderboard">3</div>
        <div class="block block-esports-leaderboard-18 block-esports-leaderboard">Kaze Nation</div>
        <div class="block block-esports-leaderboard-19 block-esports-leaderboard">11</div>
        <div class="block block-esports-leaderboard-20 block-esports-leaderboard">755</div>
      </div>
      <div class="block block-esports-leaderboard-21 block-esports-leaderboard">
        <div class="block block-esports-leaderboard-22 block-esports-leaderboard">4</div>
        <div class="block block-esports-leaderboard-23 block-esports-leaderboard">Onyx Squad</div>
        <div class="block block-esports-leaderboard-24 block-esports-leaderboard">9</div>
        <div class="block block-esports-leaderboard-25 block-esports-leaderboard">680</div>
      </div>
      <div class="block block-esports-leaderboard-26 block-esports-leaderboard">
        <div class="block block-esports-leaderboard-27 block-esports-leaderboard">5</div>
        <div class="block block-esports-leaderboard-28 block-esports-leaderboard">Pulse Collective</div>
        <div class="block block-esports-leaderboard-29 block-esports-leaderboard">8</div>
        <div class="block block-esports-leaderboard-30 block-esports-leaderboard">611</div>
      </div>
    </div>
  </div>
</section>`,
      },
      {
        id: "esports-org-hub",
        label: "Esports · Organization Hub",
        html: `<section class="block block-esports-org-hub-1 block-esports-org-hub">
  <div class="block block-esports-org-hub-2 block-esports-org-hub">
    <div class="block block-esports-org-hub-3 block-esports-org-hub">
      <div>
        <h2 class="block block-esports-org-hub-4 block-esports-org-hub">Alpha Esports</h2>
        <p class="block block-esports-org-hub-5 block-esports-org-hub">Competing across Valorant, CS2 and League — est. 2021. Follow the journey, catch the streams, join the community.</p>
      </div>
      <a href="#" class="block block-esports-org-hub-6 block-esports-org-hub">Join the community</a>
    </div>
    <div class="block block-esports-org-hub-7 block-esports-org-hub">
      
      <div class="block block-esports-org-hub-8 block-esports-org-hub">
        <div class="block block-esports-org-hub-9 block-esports-org-hub">2021</div>
        <div class="block block-esports-org-hub-10 block-esports-org-hub">Est.</div>
      </div>
      <div class="block block-esports-org-hub-11 block-esports-org-hub">
        <div class="block block-esports-org-hub-12 block-esports-org-hub">3 games</div>
        <div class="block block-esports-org-hub-13 block-esports-org-hub">Titles</div>
      </div>
      <div class="block block-esports-org-hub-14 block-esports-org-hub">
        <div class="block block-esports-org-hub-15 block-esports-org-hub">210K+</div>
        <div class="block block-esports-org-hub-16 block-esports-org-hub">Followers</div>
      </div>
    </div>
    <div class="block block-esports-org-hub-17 block-esports-org-hub">
      <div class="block block-esports-org-hub-18 block-esports-org-hub">Backed by</div>
      <div class="block block-esports-org-hub-19 block-esports-org-hub">
        <div class="block block-esports-org-hub-20 block-esports-org-hub">SPONSOR ONE</div><div class="block block-esports-org-hub-21 block-esports-org-hub">SPONSOR TWO</div><div class="block block-esports-org-hub-22 block-esports-org-hub">SPONSOR THREE</div><div class="block block-esports-org-hub-23 block-esports-org-hub">SPONSOR FOUR</div>
      </div>
    </div>
  </div>
</section>`,
      },
    ],
  },
  {
    id: "creator",
    label: "Creator",
    blocks: [
      {
        id: "creator-membership",
        label: "Creator · Subscription Tiers",
        html: `<section class="block block-creator-membership-1 block-creator-membership">
  <div class="block block-creator-membership-2 block-creator-membership">
    <h2 class="block block-creator-membership-3 block-creator-membership">Support the channel</h2>
    <p class="block block-creator-membership-4 block-creator-membership">Pick a membership tier and unlock perks.</p>
    <div class="block block-creator-membership-5 block-creator-membership">
      
      <div class="block block-creator-membership-6 block-creator-membership">
        <div class="block block-creator-membership-7 block-creator-membership">Fan</div>
        <div class="block block-creator-membership-8 block-creator-membership">$5<span class="block block-creator-membership-9 block-creator-membership">/mo</span></div>
        <ul class="block block-creator-membership-10 block-creator-membership"><li>✓ Member badge</li><li>✓ Emotes</li><li>✓ Shoutouts</li></ul>
        <a href="#" class="block block-creator-membership-11 block-creator-membership">Join Fan</a>
      </div>
      <div class="block block-creator-membership-12 block-creator-membership">
        <div class="block block-creator-membership-13 block-creator-membership">Supporter</div>
        <div class="block block-creator-membership-14 block-creator-membership">$15<span class="block block-creator-membership-15 block-creator-membership">/mo</span></div>
        <ul class="block block-creator-membership-16 block-creator-membership"><li>✓ Everything in Fan</li><li>✓ Discord access</li><li>✓ Monthly Q&A</li></ul>
        <a href="#" class="block block-creator-membership-17 block-creator-membership">Join Supporter</a>
      </div>
      <div class="block block-creator-membership-18 block-creator-membership">
        <div class="block block-creator-membership-19 block-creator-membership">VIP</div>
        <div class="block block-creator-membership-20 block-creator-membership">$40<span class="block block-creator-membership-21 block-creator-membership">/mo</span></div>
        <ul class="block block-creator-membership-22 block-creator-membership"><li>✓ Everything in Supporter</li><li>✓ 1:1 game session</li><li>✓ Name in credits</li></ul>
        <a href="#" class="block block-creator-membership-23 block-creator-membership">Join VIP</a>
      </div>
    </div>
  </div>
</section>`,
      },
    ],
  },
  {
    // Y2K/Web 1.0 revival — real 90s-2000s site fixtures (Matt Wright's
    // Counter/Guestbook CGI scripts, 88x31 webring badges, MySpace's Top 8,
    // Xanga's eProps/blogrings), refactored to how you'd actually build them
    // today: no CGI/table layouts, <marquee> replaced with a CSS @keyframes
    // scroll, a real client-side (localStorage) hit counter instead of a
    // server-side hit file, no autoplay audio (native <audio controls>).
    id: "retro",
    label: "Moldy Oldies",
    blocks: [
      {
        id: "retro-hitcounter",
        label: "Retro · Hit Counter",
        html: `<div data-wd-hitcounter-root class="block block-retro-hitcounter-1 block-retro-hitcounter">
  <div class="block block-retro-hitcounter-2 block-retro-hitcounter">You are visitor number</div>
  <div class="block block-retro-hitcounter-3 block-retro-hitcounter" data-wd-hitcounter-digits>
    <span class="block block-retro-hitcounter-4 block-retro-hitcounter">0</span><span class="block block-retro-hitcounter-5 block-retro-hitcounter">0</span><span class="block block-retro-hitcounter-6 block-retro-hitcounter">0</span><span class="block block-retro-hitcounter-7 block-retro-hitcounter">0</span><span class="block block-retro-hitcounter-8 block-retro-hitcounter">0</span><span class="block block-retro-hitcounter-9 block-retro-hitcounter">0</span>
  </div>
  <div class="block block-retro-hitcounter-10 block-retro-hitcounter">counts visits to this page, stored in your browser — a modern stand-in for the server-side hit files 90s CGI counters used</div>
  <script>(function(){
    try {
      var root = document.currentScript.closest('[data-wd-hitcounter-root]');
      var counterEl = root && root.querySelector('[data-wd-hitcounter-digits]');
      if (!counterEl) return;
      // localStorage is a best-effort enhancement, not a requirement — it
      // throws in an opaque-origin sandbox (e.g. this builder's own
      // Preview tab, which intentionally omits allow-same-origin). Falls
      // back to a plausible one-off number so the counter still LOOKS
      // like it's counting instead of freezing at 000000, and the real
      // persistent-per-visit behavior works once actually published.
      var n;
      try {
        var key = 'wd_hitcounter_' + location.pathname;
        n = parseInt(localStorage.getItem(key) || '0', 10) + 1;
        localStorage.setItem(key, String(n));
      } catch (storageErr) {
        n = Math.floor(Math.random() * 9000) + 1000;
      }
      var digits = String(n).padStart(6, '0').split('');
      var spans = counterEl.querySelectorAll('span');
      digits.forEach(function(d, i) { if (spans[i]) spans[i].textContent = d; });
    } catch (e) {}
  })();</script>
</div>`,
      },
      {
        id: "retro-guestbook",
        label: "Retro · Sign My Guestbook",
        html: `<section class="block block-retro-guestbook-1 block-retro-guestbook">
  <div class="block block-retro-guestbook-2 block-retro-guestbook">
    <h2 class="block block-retro-guestbook-3 block-retro-guestbook">✦ Sign My Guestbook! ✦</h2>
    <p class="block block-retro-guestbook-4 block-retro-guestbook">Thanx for stopping by my page! Leave a message below ~*~</p>
    <form>
      <label class="block block-retro-guestbook-5 block-retro-guestbook">Your Name</label>
      <input class="block block-retro-guestbook-6 block-retro-guestbook" />
      <label class="block block-retro-guestbook-7 block-retro-guestbook">Message</label>
      <textarea rows="3" class="block block-retro-guestbook-8 block-retro-guestbook"></textarea>
      <button type="submit" class="block block-retro-guestbook-9 block-retro-guestbook">Sign It! →</button>
    </form>
    <div class="block block-retro-guestbook-10 block-retro-guestbook">
      
      <div class="block block-retro-guestbook-11 block-retro-guestbook">
        <span class="block block-retro-guestbook-12 block-retro-guestbook">xXsparkle_soulXx</span> <span class="block block-retro-guestbook-13 block-retro-guestbook">wrote:</span>
        <div class="block block-retro-guestbook-14 block-retro-guestbook">omg i love ur page!! the bg music is SO good 💜</div>
      </div>
      <div class="block block-retro-guestbook-15 block-retro-guestbook">
        <span class="block block-retro-guestbook-16 block-retro-guestbook">webmaster_99</span> <span class="block block-retro-guestbook-17 block-retro-guestbook">wrote:</span>
        <div class="block block-retro-guestbook-18 block-retro-guestbook">nice site, added you to my links page. webring pending approval.</div>
      </div>
    </div>
  </div>
</section>`,
      },
      {
        id: "retro-webring",
        label: "Retro · Webring Navigator",
        html: `<div class="block block-retro-webring-1 block-retro-webring">
  <div class="block block-retro-webring-2 block-retro-webring">
    <a href="#" class="block block-retro-webring-3 block-retro-webring">← Prev Site</a>
    <div class="block block-retro-webring-4 block-retro-webring">
      <div class="block block-retro-webring-5 block-retro-webring">Member of the</div>
      <div class="block block-retro-webring-6 block-retro-webring">Indie Web Ring</div>
    </div>
    <a href="#" class="block block-retro-webring-7 block-retro-webring">🔀 Random</a>
    <a href="#" class="block block-retro-webring-8 block-retro-webring">Next Site →</a>
  </div>
</div>`,
      },
      {
        id: "retro-buttons88",
        label: "Retro · 88×31 Button Row",
        html: `<div class="block block-retro-buttons88-1 block-retro-buttons88">
  
  <div class="block block-retro-buttons88-2 block-retro-buttons88">BEST VIEWED
WITH EYES</div>
  <div class="block block-retro-buttons88-3 block-retro-buttons88">VALID
HTML5</div>
  <div class="block block-retro-buttons88-4 block-retro-buttons88">made with
CSS Grid</div>
  <div class="block block-retro-buttons88-5 block-retro-buttons88">100%
HUMAN MADE</div>
  <div class="block block-retro-buttons88-6 block-retro-buttons88">POWERED BY
COFFEE</div>
</div>`,
      },
      {
        id: "retro-top8",
        label: "Retro · Top 8 Friends",
        html: `<section class="block block-retro-top8-1 block-retro-top8">
  <div class="block block-retro-top8-2 block-retro-top8">
    <h2 class="block block-retro-top8-3 block-retro-top8">Top Friends</h2>
    <p class="block block-retro-top8-4 block-retro-top8">view all →</p>
    <div class="block block-retro-top8-5 block-retro-top8">
      
      <a href="#" class="block block-retro-top8-6 block-retro-top8">
        <img src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&q=75" alt="Friend 1" class="block block-retro-top8-7 block-retro-top8" />
        <div class="block block-retro-top8-8 block-retro-top8">friend_1</div>
      </a>
      <a href="#" class="block block-retro-top8-9 block-retro-top8">
        <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=75" alt="Friend 2" class="block block-retro-top8-10 block-retro-top8" />
        <div class="block block-retro-top8-11 block-retro-top8">friend_2</div>
      </a>
      <a href="#" class="block block-retro-top8-12 block-retro-top8">
        <img src="https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&q=75" alt="Friend 3" class="block block-retro-top8-13 block-retro-top8" />
        <div class="block block-retro-top8-14 block-retro-top8">friend_3</div>
      </a>
      <a href="#" class="block block-retro-top8-15 block-retro-top8">
        <img src="https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=200&q=75" alt="Friend 4" class="block block-retro-top8-16 block-retro-top8" />
        <div class="block block-retro-top8-17 block-retro-top8">friend_4</div>
      </a>
      <a href="#" class="block block-retro-top8-18 block-retro-top8">
        <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=75" alt="Friend 5" class="block block-retro-top8-19 block-retro-top8" />
        <div class="block block-retro-top8-20 block-retro-top8">friend_5</div>
      </a>
      <a href="#" class="block block-retro-top8-21 block-retro-top8">
        <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=75" alt="Friend 6" class="block block-retro-top8-22 block-retro-top8" />
        <div class="block block-retro-top8-23 block-retro-top8">friend_6</div>
      </a>
      <a href="#" class="block block-retro-top8-24 block-retro-top8">
        <img src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&q=75" alt="Friend 7" class="block block-retro-top8-25 block-retro-top8" />
        <div class="block block-retro-top8-26 block-retro-top8">friend_7</div>
      </a>
      <a href="#" class="block block-retro-top8-27 block-retro-top8">
        <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=75" alt="Friend 8" class="block block-retro-top8-28 block-retro-top8" />
        <div class="block block-retro-top8-29 block-retro-top8">friend_8</div>
      </a>
    </div>
  </div>
</section>`,
      },
      {
        id: "retro-eprops",
        label: "Retro · eProps & Blogroll",
        html: `<div class="block block-retro-eprops-1 block-retro-eprops">
  <div class="block block-retro-eprops-2 block-retro-eprops">
    <div class="block block-retro-eprops-3 block-retro-eprops">Latest entry</div>
    <h3 class="block block-retro-eprops-4 block-retro-eprops">today was actually pretty good</h3>
    <p class="block block-retro-eprops-5 block-retro-eprops">nothing much happened but the weather was nice and I got bubble tea so 8/10 day tbh...</p>
    <div class="block block-retro-eprops-6 block-retro-eprops">
      <button class="block block-retro-eprops-7 block-retro-eprops">⭐ eProps (24)</button>
      <span class="block block-retro-eprops-8 block-retro-eprops">12 comments</span>
    </div>
  </div>
  <div>
    <div class="block block-retro-eprops-9 block-retro-eprops">My Blogrings</div>
    
    <div class="block block-retro-eprops-10 block-retro-eprops">◆ Poetry & Prose Ring</div>
    <div class="block block-retro-eprops-11 block-retro-eprops">◆ 2000s Nostalgia Crew</div>
    <div class="block block-retro-eprops-12 block-retro-eprops">◆ Bubble Tea Lovers</div>
    <div class="block block-retro-eprops-13 block-retro-eprops">◆ Late Night Thoughts</div>
  </div>
</div>`,
      },
      {
        id: "retro-construction",
        label: "Retro · Under Construction",
        html: `<div class="block block-retro-construction-1 block-retro-construction">
  <div class="block block-retro-construction-2 block-retro-construction">
    🚧 PAGE UNDER CONSTRUCTION 🚧<br />
    <span class="block block-retro-construction-3 block-retro-construction">check back soon — always more to add!</span>
  </div>
</div>`,
      },
      {
        id: "retro-divider",
        label: "Retro · Rainbow Glitter Divider",
        html: `<div class="block block-retro-divider-1 block-retro-divider">
  <div class="block block-retro-divider-2 block-retro-divider"></div>
  <div class="block block-retro-divider-3 block-retro-divider">✧･ﾟ: *✧･ﾟ:* thanks for visiting *:･ﾟ✧*:･ﾟ✧</div>
  <style>@keyframes wd-rainbow-shift{0%{background-position:0% 50%}100%{background-position:200% 50%}}</style>
</div>`,
      },
      {
        id: "retro-musicplayer",
        label: "Retro · Now Playing Bar",
        html: `<div class="block block-retro-musicplayer-1 block-retro-musicplayer">
  <div class="block block-retro-musicplayer-2 block-retro-musicplayer">
    <div class="block block-retro-musicplayer-3 block-retro-musicplayer"></div>
    <div>
      <div class="block block-retro-musicplayer-4 block-retro-musicplayer">♪ now playing</div>
      <div class="block block-retro-musicplayer-5 block-retro-musicplayer">profile-anthem.mp3</div>
    </div>
    <audio controls class="block block-retro-musicplayer-6 block-retro-musicplayer"></audio>
  </div>
</div>`,
      },
      {
        // 1998–2001 Geocities/Angelfire era: pages advertised which browser
        // to view them in since rendering varied wildly. Refactored with
        // flex-wrap so the row reflows on narrow screens instead of
        // overflowing, the one thing the original fixed-width table version
        // never had to handle.
        id: "retro-browserbadges",
        label: "Retro · Browser Badges",
        html: `<div class="block block-retro-browserbadges-1 block-retro-browserbadges">
  <div class="block block-retro-browserbadges-2 block-retro-browserbadges">Best viewed in<br/>Netscape Navigator 4.0</div>
  <div class="block block-retro-browserbadges-3 block-retro-browserbadges">Optimized for<br/>Internet Explorer 5+</div>
  <div class="block block-retro-browserbadges-4 block-retro-browserbadges">800×600<br/>resolution</div>
</div>`,
      },
      {
        // 2005–2010's defining startup aesthetic — the glossy, reflective
        // "Web 2.0" badge (think early Digg/del.icio.us/Skype-era logos).
        // The reflection is CSS gradient over a positioned div rather than
        // the period-original technique (a semi-transparent PNG overlay
        // image), so it recolors correctly with the badge instead of
        // needing a matching image asset per color.
        id: "retro-web2badge",
        label: "Retro · Web 2.0 Glossy Badge",
        html: `<div class="block block-retro-web2badge-1 block-retro-web2badge">
  <div class="block block-retro-web2badge-2 block-retro-web2badge">
    <div class="block block-retro-web2badge-3 block-retro-web2badge"></div>
    <span class="block block-retro-web2badge-4 block-retro-web2badge">myStartup</span>
    <span class="block block-retro-web2badge-5 block-retro-web2badge">beta</span>
  </div>
</div>`,
      },
      {
        // 2003–2007: AIM/LiveJournal-style "who's online" buddy list —
        // presence dots were the social proof of the era, before read
        // receipts and "last active" timestamps existed.
        id: "retro-buddyicons",
        label: "Retro · Buddy List",
        html: `<div class="block block-retro-buddyicons-1 block-retro-buddyicons">
  <div class="block block-retro-buddyicons-2 block-retro-buddyicons">Buddy List — 6 online</div>
  <div class="block block-retro-buddyicons-3 block-retro-buddyicons">
    <div class="block block-retro-buddyicons-4 block-retro-buddyicons">
      <img src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&q=75" alt="" class="block block-retro-buddyicons-5 block-retro-buddyicons" />
      <span class="block block-retro-buddyicons-6 block-retro-buddyicons"></span>
    </div><div class="block block-retro-buddyicons-7 block-retro-buddyicons">
      <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=75" alt="" class="block block-retro-buddyicons-8 block-retro-buddyicons" />
      <span class="block block-retro-buddyicons-9 block-retro-buddyicons"></span>
    </div><div class="block block-retro-buddyicons-10 block-retro-buddyicons">
      <img src="https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&q=75" alt="" class="block block-retro-buddyicons-11 block-retro-buddyicons" />
      <span class="block block-retro-buddyicons-12 block-retro-buddyicons"></span>
    </div><div class="block block-retro-buddyicons-13 block-retro-buddyicons">
      <img src="https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=200&q=75" alt="" class="block block-retro-buddyicons-14 block-retro-buddyicons" />
      <span class="block block-retro-buddyicons-15 block-retro-buddyicons"></span>
    </div><div class="block block-retro-buddyicons-16 block-retro-buddyicons">
      <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=75" alt="" class="block block-retro-buddyicons-17 block-retro-buddyicons" />
      <span class="block block-retro-buddyicons-18 block-retro-buddyicons"></span>
    </div><div class="block block-retro-buddyicons-19 block-retro-buddyicons">
      <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=75" alt="" class="block block-retro-buddyicons-20 block-retro-buddyicons" />
      <span class="block block-retro-buddyicons-21 block-retro-buddyicons"></span>
    </div>
  </div>
</div>`,
      },
      {
        // 2003–2008: the Xanga/Neopets "shoutbox" — a lightweight public
        // comment strip bolted onto the sidebar, distinct from a full
        // guestbook (which this category already has) by being short,
        // rapid-fire, and displayed inline rather than on its own page.
        id: "retro-shoutbox",
        label: "Retro · Shout Box",
        html: `<div class="block block-retro-shoutbox-1 block-retro-shoutbox">
  <div class="block block-retro-shoutbox-2 block-retro-shoutbox">💬 Shout Box</div>
  <div class="block block-retro-shoutbox-3 block-retro-shoutbox">
    <div class="block block-retro-shoutbox-4 block-retro-shoutbox"><b class="block block-retro-shoutbox-5 block-retro-shoutbox">xXcoolkidXx:</b> omg i love ur layout!!</div>
    <div class="block block-retro-shoutbox-6 block-retro-shoutbox"><b class="block block-retro-shoutbox-7 block-retro-shoutbox">sk8ergrl:</b> add me back ✨</div>
  </div>
  <div class="block block-retro-shoutbox-8 block-retro-shoutbox">
    <input placeholder="leave a shout..." class="block block-retro-shoutbox-9 block-retro-shoutbox" />
    <button class="block block-retro-shoutbox-10 block-retro-shoutbox">Post</button>
  </div>
</div>`,
      },
      {
        // 2000–2005: the DHTML mouse-sparkle-trail script every Neopets/
        // Xanga customizer copy-pasted from a snippet site. Refactored:
        // the original used document.onmousemove + setInterval leaking
        // spans forever; this scopes the listener to its own root
        // (matching the Hit Counter block's currentScript.closest
        // pattern) and removes each sparkle after its fade completes.
        id: "retro-sparkletrail",
        label: "Retro · Cursor Sparkle Trail",
        html: `<div data-wd-sparkletrail-root class="block block-retro-sparkletrail-1 block-retro-sparkletrail">
  <div class="block block-retro-sparkletrail-2 block-retro-sparkletrail">✨ Move your mouse here for a sparkle trail ✨</div>
  <script>(function(){
    var root = document.currentScript.closest('[data-wd-sparkletrail-root]');
    if (!root) return;
    var chars = ['✦','✧','⋆','✩'];
    root.addEventListener('mousemove', function(e){
      var r = root.getBoundingClientRect();
      var s = document.createElement('span');
      s.textContent = chars[Math.floor(Math.random() * chars.length)];
      s.style.cssText = 'position:absolute;left:' + (e.clientX - r.left) + 'px;top:' + (e.clientY - r.top) + 'px;color:#e0c8ff;font-size:14px;pointer-events:none;transition:opacity .6s,transform .6s;';
      root.appendChild(s);
      requestAnimationFrame(function(){ s.style.opacity = '0'; s.style.transform = 'translateY(-16px)'; });
      setTimeout(function(){ s.remove(); }, 650);
    });
  })();</script>
</div>`,
      },
      {
        // 1999–2003: the auto-playing MIDI background-music embed —
        // refactored into a native <audio controls> (no autoplay, so it
        // doesn't ambush visitors the way <bgsound>/embedded MIDI did)
        // styled to look like an old OS media-player chrome.
        id: "retro-midiplayer",
        label: "Retro · MIDI Player",
        html: `<div class="block block-retro-midiplayer-1 block-retro-midiplayer">
  <div class="block block-retro-midiplayer-2 block-retro-midiplayer">
    <div class="block block-retro-midiplayer-3 block-retro-midiplayer"></div>
  </div>
  <div>
    <div class="block block-retro-midiplayer-4 block-retro-midiplayer">♫ background_theme.mid</div>
    <audio controls class="block block-retro-midiplayer-5 block-retro-midiplayer"></audio>
  </div>
</div>`,
      },
      {
        id: "retro-awaymessage",
        label: "Retro · AIM Away Message",
        html: `<div class="block block-retro-awaymessage-1 block-retro-awaymessage">
  <div class="block block-retro-awaymessage-2 block-retro-awaymessage">
    <span>xXsk8rgrl02Xx — Away Message</span>
    <span class="block block-retro-awaymessage-3 block-retro-awaymessage">✕</span>
  </div>
  <div class="block block-retro-awaymessage-4 block-retro-awaymessage">
    <div class="block block-retro-awaymessage-5 block-retro-awaymessage"><strong>I'm away from my computer right now.</strong></div>
    <div class="block block-retro-awaymessage-6 block-retro-awaymessage">"in class, txt my cell &lt;3 back in an hour probably"</div>
    <div class="block block-retro-awaymessage-7 block-retro-awaymessage">Auto-response sent at 2:14 PM</div>
  </div>
</div>`,
      },
      {
        id: "retro-poll",
        label: "Retro · Poll Widget",
        html: `<div class="block block-retro-poll-1 block-retro-poll">
  <div class="block block-retro-poll-2 block-retro-poll">⭐ Poll of the Week ⭐</div>
  <div class="block block-retro-poll-3 block-retro-poll">What should the next site layout be?</div>
  
  <label class="block block-retro-poll-4 block-retro-poll">
    <input type="radio" name="wd-poll" checked />
    <span>Sparkly & pink</span>
  </label>
  <label class="block block-retro-poll-5 block-retro-poll">
    <input type="radio" name="wd-poll"  />
    <span>Dark & moody</span>
  </label>
  <label class="block block-retro-poll-6 block-retro-poll">
    <input type="radio" name="wd-poll"  />
    <span>Rainbow chaos</span>
  </label>
  <label class="block block-retro-poll-7 block-retro-poll">
    <input type="radio" name="wd-poll"  />
    <span>Keep this one</span>
  </label>
  <button class="block block-retro-poll-8 block-retro-poll">Vote!</button>
  <div class="block block-retro-poll-9 block-retro-poll">1,204 votes so far</div>
</div>`,
      },
      {
        id: "retro-petadopt",
        label: "Retro · Pet Adoption Badge",
        html: `<div class="block block-retro-petadopt-1 block-retro-petadopt">
  <div class="block block-retro-petadopt-2 block-retro-petadopt"></div>
  <div>
    <div class="block block-retro-petadopt-3 block-retro-petadopt">You adopted Sprinkle!</div>
    <div class="block block-retro-petadopt-4 block-retro-petadopt">Level 3 Cloud Puff · Fed 2 hrs ago</div>
    <a href="#" class="block block-retro-petadopt-5 block-retro-petadopt">Visit my pet →</a>
  </div>
</div>`,
      },
      {
        id: "retro-forumheader",
        label: "Retro · Forum Header",
        html: `<header class="block block-retro-forumheader-1 block-retro-forumheader">
  <div class="block block-retro-forumheader-2 block-retro-forumheader">
    <div class="block block-retro-forumheader-3 block-retro-forumheader">FieldworkForums.net</div>
    <div class="block block-retro-forumheader-4 block-retro-forumheader">the only forum you will ever need, established 2003</div>
  </div>
  <div class="block block-retro-forumheader-5 block-retro-forumheader">Forum Index &raquo; General Discussion &raquo; <strong>Thread Title Goes Here</strong></div>
</header>`,
      },
      {
        id: "retro-forumpost",
        label: "Retro · Forum Post",
        html: `<div class="block block-retro-forumpost-1 block-retro-forumpost">
  <div class="block block-retro-forumpost-2 block-retro-forumpost">
    <div class="block block-retro-forumpost-3 block-retro-forumpost"></div>
    <div class="block block-retro-forumpost-4 block-retro-forumpost">forumveteran99</div>
    <div class="block block-retro-forumpost-5 block-retro-forumpost">Senior Member</div>
    <div class="block block-retro-forumpost-6 block-retro-forumpost">Joined: Mar 2004<br>Posts: 3,204</div>
  </div>
  <div class="block block-retro-forumpost-7 block-retro-forumpost">
    <div class="block block-retro-forumpost-8 block-retro-forumpost"><span>Posted: Today, 9:14 AM</span><span>Post #1 <a href="#" class="block block-retro-forumpost-9 block-retro-forumpost">Quote</a></span></div>
    <div class="block block-retro-forumpost-10 block-retro-forumpost">Type the post content here. Duplicate this block to build out a full thread.</div>
    <div class="block block-retro-forumpost-11 block-retro-forumpost">Signature line goes here</div>
  </div>
</div>`,
      },
      {
        id: "retro-forumreply",
        label: "Retro · Forum Reply Box",
        html: `<section data-forge-comments class="block block-retro-forumreply-1 block-retro-forumreply">
  <div class="block block-retro-forumreply-2 block-retro-forumreply">
    <h3 class="block block-retro-forumreply-3 block-retro-forumreply">Comments (<span data-forge-comment-count>0</span>)</h3>
    <div data-forge-comment-list></div>
    <form data-forge-comment-form class="block block-retro-forumreply-4 block-retro-forumreply">
      <input name="name" placeholder="Your name" required class="block block-retro-forumreply-5 block-retro-forumreply">
      <textarea name="text" placeholder="Say something..." required rows="3" class="block block-retro-forumreply-6 block-retro-forumreply"></textarea>
      <button type="submit" class="block block-retro-forumreply-7 block-retro-forumreply">Post Comment</button>
    </form>
    <script type="application/json" data-forge-comments-seed>[]</script>
    <script data-forge-js="comments.js">(function(){
function esc(s){var d=document.createElement("div");d.textContent=s==null?"":String(s);return d.innerHTML;}
function renderComment(c){
  return '<div style="display:flex;gap:12px;padding:14px 0;border-bottom:1px solid var(--fc-border, #e2e8f0);">'
    + (c.avatar ? '<img src="'+esc(c.avatar)+'" alt="" style="width:38px;height:38px;border-radius:999px;object-fit:cover;flex:none;">'
                : '<div style="width:38px;height:38px;border-radius:999px;background:var(--fc-primary, #6366f1);color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex:none;">'+esc((c.author||"?").slice(0,1).toUpperCase())+'</div>')
    + '<div style="flex:1;min-width:0;">'
    + '<div style="font-size:13px;"><strong style="color:var(--fc-text, #0f172a);">'+esc(c.author)+'</strong>'
    + (c.mood ? ' <span style="color:var(--fc-muted, #94a3b8);">('+esc(c.mood)+')</span>' : '')
    + ' <span style="color:var(--fc-muted, #94a3b8);">'+esc(c.date)+'</span></div>'
    + '<div style="font-size:14px;line-height:1.6;color:var(--fc-text, #334155);margin-top:4px;">'+esc(c.text)+'</div>'
    + '</div></div>';
}
function initWidget(root){
  root.setAttribute("data-forge-comments-init","1");
  var seedEl=root.querySelector("[data-forge-comments-seed]");
  var comments=[];
  try{comments=JSON.parse(seedEl?seedEl.textContent:"[]");}catch(e){comments=[];}
  var list=root.querySelector("[data-forge-comment-list]");
  var countEl=root.querySelector("[data-forge-comment-count]");
  function renderAll(){
    if(list) list.innerHTML=comments.map(renderComment).join("");
    if(countEl) countEl.textContent=String(comments.length);
  }
  renderAll();
  var form=root.querySelector("[data-forge-comment-form]");
  if(form){
    form.addEventListener("submit",function(e){
      e.preventDefault();
      var nameInput=form.querySelector('[name="name"]');
      var textInput=form.querySelector('[name="text"]');
      var name=(nameInput&&nameInput.value||"").trim();
      var text=(textInput&&textInput.value||"").trim();
      if(!name||!text) return;
      comments.push({id:Date.now(),author:name,date:"Just now",text:text});
      renderAll();
      form.reset();
    });
  }
}
function init(){
  var roots=document.querySelectorAll("[data-forge-comments]:not([data-forge-comments-init])");
  for(var i=0;i<roots.length;i++) initWidget(roots[i]);
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init); else init();
})();</script>
  </div>
</section>`,
      },
    ],
  },
  {
    id: "parallax",
    label: "Parallax",
    blocks: [
      {
        id: "parallax-hero-fullbleed",
        label: "Parallax Hero · Full Bleed",
        html: `<section class="block block-parallax-hero-fullbleed-1 block-parallax-hero-fullbleed">
  <div class="block block-parallax-hero-fullbleed-2 block-parallax-hero-fullbleed">
    <div class="block block-parallax-hero-fullbleed-3 block-parallax-hero-fullbleed">Est. 2026</div>
    <h1 class="block block-parallax-hero-fullbleed-4 block-parallax-hero-fullbleed">Where ambition meets altitude.</h1>
    <p class="block block-parallax-hero-fullbleed-5 block-parallax-hero-fullbleed">A full-bleed statement hero — the background stays fixed while your content scrolls over it.</p>
    <button class="block block-parallax-hero-fullbleed-6 block-parallax-hero-fullbleed">Explore</button>
  </div>
</section>`,
      },
      {
        id: "parallax-hero-split",
        label: "Parallax Hero · Split Content",
        html: `<section class="block block-parallax-hero-split-1 block-parallax-hero-split">
  <div class="block block-parallax-hero-split-2 block-parallax-hero-split">
    <h1 class="block block-parallax-hero-split-3 block-parallax-hero-split">Grown, not manufactured.</h1>
    <p class="block block-parallax-hero-split-4 block-parallax-hero-split">Content sits in a legible band on the left; the parallax background carries the mood on the right.</p>
    <div class="block block-parallax-hero-split-5 block-parallax-hero-split">
      <button class="block block-parallax-hero-split-6 block-parallax-hero-split">Get started</button>
      <button class="block block-parallax-hero-split-7 block-parallax-hero-split">Learn more</button>
    </div>
  </div>
</section>`,
      },
      {
        id: "parallax-section-quote",
        label: "Parallax Section · Big Quote",
        html: `<section class="block block-parallax-section-quote-1 block-parallax-section-quote">
  <div class="block block-parallax-section-quote-2 block-parallax-section-quote">
    <div class="block block-parallax-section-quote-3 block-parallax-section-quote">"</div>
    <p class="block block-parallax-section-quote-4 block-parallax-section-quote">The best interfaces disappear — you stop noticing the tool and start noticing the work.</p>
    <div class="block block-parallax-section-quote-5 block-parallax-section-quote">
      <img src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&q=75" alt="" class="block block-parallax-section-quote-6 block-parallax-section-quote" />
      <div class="block block-parallax-section-quote-7 block-parallax-section-quote">
        <div class="block block-parallax-section-quote-8 block-parallax-section-quote">Nadia Osei</div>
        <div class="block block-parallax-section-quote-9 block-parallax-section-quote">Creative Director, Tidewater</div>
      </div>
    </div>
  </div>
</section>`,
      },
      {
        id: "parallax-section-stats",
        label: "Parallax Section · Stats Band",
        html: `<section class="block block-parallax-section-stats-1 block-parallax-section-stats">
  <div class="block block-parallax-section-stats-2 block-parallax-section-stats">
    <div>
      <div class="block block-parallax-section-stats-3 block-parallax-section-stats">14k+</div>
      <div class="block block-parallax-section-stats-4 block-parallax-section-stats">Sites shipped</div>
    </div>
    <div>
      <div class="block block-parallax-section-stats-5 block-parallax-section-stats">99.9%</div>
      <div class="block block-parallax-section-stats-6 block-parallax-section-stats">Uptime</div>
    </div>
    <div>
      <div class="block block-parallax-section-stats-7 block-parallax-section-stats">38</div>
      <div class="block block-parallax-section-stats-8 block-parallax-section-stats">Countries</div>
    </div>
    <div>
      <div class="block block-parallax-section-stats-9 block-parallax-section-stats">4.9★</div>
      <div class="block block-parallax-section-stats-10 block-parallax-section-stats">Average rating</div>
    </div>
  </div>
</section>`,
      },
      {
        id: "parallax-section-cta",
        label: "Parallax Section · CTA Banner",
        html: `<section class="block block-parallax-section-cta-1 block-parallax-section-cta">
  <h2 class="block block-parallax-section-cta-2 block-parallax-section-cta">Ready when the skyline is.</h2>
  <p class="block block-parallax-section-cta-3 block-parallax-section-cta">Start free — upgrade only once you're ready to publish.</p>
  <button class="block block-parallax-section-cta-4 block-parallax-section-cta">Start building free</button>
</section>`,
      },
    ],
  },
  {
    id: "social",
    label: "Social",
    blocks: [
      {
        id: "social-wall-columns",
        label: "Social Media Wall (Multi-Column)",
        html: `<section data-forge-widget="social-wall" data-forge-project-id="" class="block block-social-wall-columns-1 block-social-wall-columns">
  <div class="block block-social-wall-columns-2 block-social-wall-columns">
    <div class="block block-social-wall-columns-3 block-social-wall-columns">Live from social</div>
    <h2 class="block block-social-wall-columns-4 block-social-wall-columns">What people are saying</h2>
    <div class="block block-social-wall-columns-5 block-social-wall-columns">
      
      <div data-forge-widget="social-wall-column" data-platform="twitter" class="block block-social-wall-columns-6 block-social-wall-columns">
        <div class="block block-social-wall-columns-7 block-social-wall-columns">
          <div class="block block-social-wall-columns-8 block-social-wall-columns">
            <span class="block block-social-wall-columns-9 block-social-wall-columns">𝕏</span>
            <span class="block block-social-wall-columns-10 block-social-wall-columns">Twitter / X</span>
          </div>
          <span data-forge-connect="twitter" class="block block-social-wall-columns-11 block-social-wall-columns">Not connected</span>
        </div>
        <div data-forge-cards class="block block-social-wall-columns-12 block-social-wall-columns">
          
          <div class="block block-social-wall-columns-13 block-social-wall-columns">
            <div class="block block-social-wall-columns-14 block-social-wall-columns">
              <span class="block block-social-wall-columns-15 block-social-wall-columns">Web Dojo</span>
              <span class="block block-social-wall-columns-16 block-social-wall-columns">2h</span>
            </div>
            <div class="block block-social-wall-columns-17 block-social-wall-columns">@webdojo_hq</div>
            <p class="block block-social-wall-columns-18 block-social-wall-columns">Just shipped dark mode across every export. Thanks for the 200+ bug reports that got us here 🙏</p>
            <div class="block block-social-wall-columns-19 block-social-wall-columns">💬 12   🔁 34   ♥ 156</div>
          </div>
          <div class="block block-social-wall-columns-20 block-social-wall-columns">
            <div class="block block-social-wall-columns-21 block-social-wall-columns">
              <span class="block block-social-wall-columns-22 block-social-wall-columns">Sam Reyes</span>
              <span class="block block-social-wall-columns-23 block-social-wall-columns">5h</span>
            </div>
            <div class="block block-social-wall-columns-24 block-social-wall-columns">@designer_sam</div>
            <p class="block block-social-wall-columns-25 block-social-wall-columns">Client sent over "make it pop" for the fourth time today. I have achieved zen.</p>
            <div class="block block-social-wall-columns-26 block-social-wall-columns">💬 8   🔁 3   ♥ 91</div>
          </div>
          <div class="block block-social-wall-columns-27 block-social-wall-columns">
            <div class="block block-social-wall-columns-28 block-social-wall-columns">
              <span class="block block-social-wall-columns-29 block-social-wall-columns">Kai Nakamura</span>
              <span class="block block-social-wall-columns-30 block-social-wall-columns">1d</span>
            </div>
            <div class="block block-social-wall-columns-31 block-social-wall-columns">@buildwithkai</div>
            <p class="block block-social-wall-columns-32 block-social-wall-columns">Hot take: the best websites still load in under a second. Fight me.</p>
            <div class="block block-social-wall-columns-33 block-social-wall-columns">💬 41   🔁 12   ♥ 203</div>
          </div>
        </div>
      </div>
      <div data-forge-widget="social-wall-column" data-platform="instagram" class="block block-social-wall-columns-34 block-social-wall-columns">
        <div class="block block-social-wall-columns-35 block-social-wall-columns">
          <div class="block block-social-wall-columns-36 block-social-wall-columns">
            <span class="block block-social-wall-columns-37 block-social-wall-columns">📷</span>
            <span class="block block-social-wall-columns-38 block-social-wall-columns">Instagram</span>
          </div>
          <span data-forge-connect="instagram" class="block block-social-wall-columns-39 block-social-wall-columns">Not connected</span>
        </div>
        <div data-forge-cards class="block block-social-wall-columns-40 block-social-wall-columns">
          
          <div class="block block-social-wall-columns-41 block-social-wall-columns">
            <div class="block block-social-wall-columns-42 block-social-wall-columns">
              <span class="block block-social-wall-columns-43 block-social-wall-columns">studio.northlane</span>
              <span class="block block-social-wall-columns-44 block-social-wall-columns">3h</span>
            </div>
            <div class="block block-social-wall-columns-45 block-social-wall-columns">Studio Northlane</div>
            <p class="block block-social-wall-columns-46 block-social-wall-columns">Behind the scenes from today's shoot 🎬</p>
            <div class="block block-social-wall-columns-47 block-social-wall-columns">♥ 412   💬 18</div>
          </div>
          <div class="block block-social-wall-columns-48 block-social-wall-columns">
            <div class="block block-social-wall-columns-49 block-social-wall-columns">
              <span class="block block-social-wall-columns-50 block-social-wall-columns">mira.codes</span>
              <span class="block block-social-wall-columns-51 block-social-wall-columns">6h</span>
            </div>
            <div class="block block-social-wall-columns-52 block-social-wall-columns">Mira Chen</div>
            <p class="block block-social-wall-columns-53 block-social-wall-columns">New desk setup, finally organized after 6 months 📐</p>
            <div class="block block-social-wall-columns-54 block-social-wall-columns">♥ 289   💬 24</div>
          </div>
          <div class="block block-social-wall-columns-55 block-social-wall-columns">
            <div class="block block-social-wall-columns-56 block-social-wall-columns">
              <span class="block block-social-wall-columns-57 block-social-wall-columns">thefolio.club</span>
              <span class="block block-social-wall-columns-58 block-social-wall-columns">1d</span>
            </div>
            <div class="block block-social-wall-columns-59 block-social-wall-columns">The Folio Club</div>
            <p class="block block-social-wall-columns-60 block-social-wall-columns">Portfolio review night was a hit — thank you to everyone who came out.</p>
            <div class="block block-social-wall-columns-61 block-social-wall-columns">♥ 567   💬 41</div>
          </div>
        </div>
      </div>
      <div data-forge-widget="social-wall-column" data-platform="facebook" class="block block-social-wall-columns-62 block-social-wall-columns">
        <div class="block block-social-wall-columns-63 block-social-wall-columns">
          <div class="block block-social-wall-columns-64 block-social-wall-columns">
            <span class="block block-social-wall-columns-65 block-social-wall-columns">f</span>
            <span class="block block-social-wall-columns-66 block-social-wall-columns">Facebook</span>
          </div>
          <span data-forge-connect="facebook" class="block block-social-wall-columns-67 block-social-wall-columns">Not connected</span>
        </div>
        <div data-forge-cards class="block block-social-wall-columns-68 block-social-wall-columns">
          
          <div class="block block-social-wall-columns-69 block-social-wall-columns">
            <div class="block block-social-wall-columns-70 block-social-wall-columns">
              <span class="block block-social-wall-columns-71 block-social-wall-columns">Riverside Coffee Co.</span>
              <span class="block block-social-wall-columns-72 block-social-wall-columns">4h</span>
            </div>
            <div class="block block-social-wall-columns-73 block-social-wall-columns">Riverside Coffee Co.</div>
            <p class="block block-social-wall-columns-74 block-social-wall-columns">We're extending our weekend hours starting this Saturday! Come say hi ☕</p>
            <div class="block block-social-wall-columns-75 block-social-wall-columns">♥ 89   💬 12   ↗ 6</div>
          </div>
          <div class="block block-social-wall-columns-76 block-social-wall-columns">
            <div class="block block-social-wall-columns-77 block-social-wall-columns">
              <span class="block block-social-wall-columns-78 block-social-wall-columns">Northgate Studio</span>
              <span class="block block-social-wall-columns-79 block-social-wall-columns">8h</span>
            </div>
            <div class="block block-social-wall-columns-80 block-social-wall-columns">Northgate Studio</div>
            <p class="block block-social-wall-columns-81 block-social-wall-columns">Our new client showcase is live on the site — link in comments.</p>
            <div class="block block-social-wall-columns-82 block-social-wall-columns">♥ 134   💬 22   ↗ 9</div>
          </div>
          <div class="block block-social-wall-columns-83 block-social-wall-columns">
            <div class="block block-social-wall-columns-84 block-social-wall-columns">
              <span class="block block-social-wall-columns-85 block-social-wall-columns">The Local Market</span>
              <span class="block block-social-wall-columns-86 block-social-wall-columns">2d</span>
            </div>
            <div class="block block-social-wall-columns-87 block-social-wall-columns">The Local Market</div>
            <p class="block block-social-wall-columns-88 block-social-wall-columns">Thank you for another incredible farmers market season 🌽</p>
            <div class="block block-social-wall-columns-89 block-social-wall-columns">♥ 210   💬 31   ↗ 14</div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <script data-forge-js="social-wall.js">(function(){
function esc(s){var d=document.createElement("div");d.textContent=s==null?"":String(s);return d.innerHTML;}
function renderCard(post){
  return '<div style="border:1px solid var(--fc-border, #e2e8f0);border-radius:10px;padding:10px 12px;background:var(--fc-bg, #ffffff);">'
    + '<div style="display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-bottom:4px;">'
    + '<span style="font-size:13px;font-weight:600;color:var(--fc-text, #0f172a);">'+esc(post.author)+'</span>'
    + '<span style="font-size:11px;color:var(--fc-muted, #94a3b8);white-space:nowrap;">'+esc(post.timestamp)+'</span>'
    + '</div>'
    + '<div style="font-size:11px;color:var(--fc-muted, #64748b);margin-bottom:6px;">'+esc(post.handle)+'</div>'
    + '<p style="margin:0 0 8px;font-size:13px;line-height:1.45;color:var(--fc-text, #0f172a);">'+esc(post.content)+'</p>'
    + '<div style="font-size:11px;color:var(--fc-muted, #94a3b8);">💬 '+esc(post.comments)+'   🔁 '+esc(post.shares)+'   ♥ '+esc(post.likes)+'</div>'
    + '</div>';
}
function initWidget(root){
  root.setAttribute("data-forge-social-wall-init","1");
  var pid=root.getAttribute("data-forge-project-id")||window.__WD_PROJECT_ID||"";
  if(!pid) return;
  fetch("/api/"+pid+"/social-feed").then(function(r){return r.json();}).then(function(data){
    var posts=data.posts||[];
    var connected=data.connected||[];
    var columns=root.querySelectorAll("[data-forge-widget='social-wall-column']");
    columns.forEach(function(col){
      var platform=col.getAttribute("data-platform");
      var badge=col.querySelector("[data-forge-connect='"+platform+"']");
      if(badge && connected.indexOf(platform)!==-1){
        badge.textContent="Connected";
        badge.style.opacity="1";
      }
      var platformPosts=posts.filter(function(p){return p.platform===platform;});
      if(!platformPosts.length) return; // no live posts yet: leave the sample cards in place
      var cardsEl=col.querySelector("[data-forge-cards]");
      if(cardsEl) cardsEl.innerHTML=platformPosts.map(renderCard).join("");
    });
  }).catch(function(){});
}
function init(){
  var roots=document.querySelectorAll("[data-forge-widget='social-wall']:not([data-forge-social-wall-init])");
  for(var i=0;i<roots.length;i++) initWidget(roots[i]);
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init); else init();
})();</script>
</section>`,
      },
    ],
  },
  {
    id: "comments",
    label: "Comments",
    blocks: [
      {
        id: "comments-section",
        label: "Comment Thread",
        html: `<section data-forge-comments class="block block-comments-section-1 block-comments-section">
  <div class="block block-comments-section-2 block-comments-section">
    <h3 class="block block-comments-section-3 block-comments-section">Comments (<span data-forge-comment-count>0</span>)</h3>
    <div data-forge-comment-list></div>
    <form data-forge-comment-form class="block block-comments-section-4 block-comments-section">
      <input name="name" placeholder="Your name" required class="block block-comments-section-5 block-comments-section">
      <textarea name="text" placeholder="Say something..." required rows="3" class="block block-comments-section-6 block-comments-section"></textarea>
      <button type="submit" class="block block-comments-section-7 block-comments-section">Post Comment</button>
    </form>
    <script type="application/json" data-forge-comments-seed>[{"id":1,"author":"Priya K.","avatar":"https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&q=75","date":"2 days ago","text":"This is exactly what I needed to read today — thank you for writing it out so clearly."},{"id":2,"author":"Marcus D.","avatar":"https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=75","date":"1 day ago","text":"Solid points. I'd add that the second one is easy to overlook until it bites you."},{"id":3,"author":"Renee A.","avatar":"https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&q=75","date":"5 hours ago","text":"Bookmarking this. Coming back to it next time I forget why I did it this way."}]</script>
    <script data-forge-js="comments.js">(function(){
function esc(s){var d=document.createElement("div");d.textContent=s==null?"":String(s);return d.innerHTML;}
function renderComment(c){
  return '<div style="display:flex;gap:12px;padding:14px 0;border-bottom:1px solid var(--fc-border, #e2e8f0);">'
    + (c.avatar ? '<img src="'+esc(c.avatar)+'" alt="" style="width:38px;height:38px;border-radius:999px;object-fit:cover;flex:none;">'
                : '<div style="width:38px;height:38px;border-radius:999px;background:var(--fc-primary, #6366f1);color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex:none;">'+esc((c.author||"?").slice(0,1).toUpperCase())+'</div>')
    + '<div style="flex:1;min-width:0;">'
    + '<div style="font-size:13px;"><strong style="color:var(--fc-text, #0f172a);">'+esc(c.author)+'</strong>'
    + (c.mood ? ' <span style="color:var(--fc-muted, #94a3b8);">('+esc(c.mood)+')</span>' : '')
    + ' <span style="color:var(--fc-muted, #94a3b8);">'+esc(c.date)+'</span></div>'
    + '<div style="font-size:14px;line-height:1.6;color:var(--fc-text, #334155);margin-top:4px;">'+esc(c.text)+'</div>'
    + '</div></div>';
}
function initWidget(root){
  root.setAttribute("data-forge-comments-init","1");
  var seedEl=root.querySelector("[data-forge-comments-seed]");
  var comments=[];
  try{comments=JSON.parse(seedEl?seedEl.textContent:"[]");}catch(e){comments=[];}
  var list=root.querySelector("[data-forge-comment-list]");
  var countEl=root.querySelector("[data-forge-comment-count]");
  function renderAll(){
    if(list) list.innerHTML=comments.map(renderComment).join("");
    if(countEl) countEl.textContent=String(comments.length);
  }
  renderAll();
  var form=root.querySelector("[data-forge-comment-form]");
  if(form){
    form.addEventListener("submit",function(e){
      e.preventDefault();
      var nameInput=form.querySelector('[name="name"]');
      var textInput=form.querySelector('[name="text"]');
      var name=(nameInput&&nameInput.value||"").trim();
      var text=(textInput&&textInput.value||"").trim();
      if(!name||!text) return;
      comments.push({id:Date.now(),author:name,date:"Just now",text:text});
      renderAll();
      form.reset();
    });
  }
}
function init(){
  var roots=document.querySelectorAll("[data-forge-comments]:not([data-forge-comments-init])");
  for(var i=0;i<roots.length;i++) initWidget(roots[i]);
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init); else init();
})();</script>
  </div>
</section>`,
      },
    ],
  },
  {
    id: "zenero",
    label: "Zenero Content",
    blocks: [
      {
        id: "updates-block",
        label: "Latest Updates",
        html: `<section data-forge-widget="updates" data-forge-project-id="" class="block block-zenero-updates-block-1 block-zenero-updates-block">
  <div class="block block-zenero-updates-block-2 block-zenero-updates-block">
    <div class="block block-zenero-updates-block-3 block-zenero-updates-block">What's new</div>
    <h2 class="block block-zenero-updates-block-4 block-zenero-updates-block">Latest Updates</h2>
    <div data-forge-updates-list class="block block-zenero-updates-block-5 block-zenero-updates-block">
      <div class="block block-zenero-updates-block-6 block-zenero-updates-block">
        <div class="block block-zenero-updates-block-7 block-zenero-updates-block">2 days ago</div>
        <div class="block block-zenero-updates-block-8 block-zenero-updates-block">Welcome to our new site</div>
        <div class="block block-zenero-updates-block-9 block-zenero-updates-block">We're excited to launch. Check back for regular updates.</div>
      </div>
      <div class="block block-zenero-updates-block-10 block-zenero-updates-block">
        <div class="block block-zenero-updates-block-11 block-zenero-updates-block">1 week ago</div>
        <div class="block block-zenero-updates-block-12 block-zenero-updates-block">New features coming soon</div>
        <div class="block block-zenero-updates-block-13 block-zenero-updates-block">We're working on something special. Stay tuned.</div>
      </div>
      <div class="block block-zenero-updates-block-14 block-zenero-updates-block">
        <div class="block block-zenero-updates-block-15 block-zenero-updates-block">2 weeks ago</div>
        <div class="block block-zenero-updates-block-16 block-zenero-updates-block">Community milestone</div>
        <div class="block block-zenero-updates-block-17 block-zenero-updates-block">Thank you to everyone who's been part of this journey.</div>
      </div>
    </div>
  </div>
  <script data-forge-js="updates.js">(function(){
function esc(s){var d=document.createElement("div");d.textContent=s==null?"":String(s);return d.innerHTML;}
function initWidget(root){
  root.setAttribute("data-forge-updates-init","1");
  var pid=root.getAttribute("data-forge-project-id")||window.__WD_PROJECT_ID||"";
  if(!pid) return;
  var list=root.querySelector("[data-forge-updates-list]");
  if(!list) return;
  fetch("/api/"+pid+"/updates").then(function(r){return r.json();}).then(function(data){
    var items=(data.updates||[]).slice(0,3);
    if(!items.length) return;
    list.innerHTML=items.map(function(u){
      return '<div style="border:1px solid var(--fc-border, #e2e8f0);border-radius:12px;padding:16px;background:var(--fc-surface, #f8fafc);">'
        + '<div style="font-size:11px;color:var(--fc-muted, #94a3b8);margin-bottom:6px;">'+esc((u.timestamp||"").slice(0,10))+'</div>'
        + '<div style="font-size:15px;font-weight:600;color:var(--fc-text, #0f172a);margin-bottom:6px;">'+esc(u.title)+'</div>'
        + '<div style="font-size:13px;line-height:1.5;color:var(--fc-muted, #64748b);">'+esc(u.content)+'</div>'
        + '</div>';
    }).join("");
  }).catch(function(){});
}
function init(){
  var roots=document.querySelectorAll("[data-forge-widget='updates']:not([data-forge-updates-init])");
  for(var i=0;i<roots.length;i++) initWidget(roots[i]);
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init); else init();
})();</script>
</section>`,
      },
      {
        id: "gallery-block",
        label: "Gallery Grid",
        html: `<section data-forge-widget="gallery" data-forge-project-id="" class="block block-zenero-gallery-block-1 block-zenero-gallery-block">
  <div class="block block-zenero-gallery-block-2 block-zenero-gallery-block">
    <div class="block block-zenero-gallery-block-3 block-zenero-gallery-block">Our work</div>
    <h2 class="block block-zenero-gallery-block-4 block-zenero-gallery-block">Gallery</h2>
    <div data-forge-gallery-grid class="block block-zenero-gallery-block-5 block-zenero-gallery-block">
      <img src="https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&q=70" alt="Gallery item" class="block block-zenero-gallery-block-6 block-zenero-gallery-block" /><img src="https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&q=70" alt="Gallery item" class="block block-zenero-gallery-block-7 block-zenero-gallery-block" /><img src="https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=800&q=70" alt="Gallery item" class="block block-zenero-gallery-block-8 block-zenero-gallery-block" /><img src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=70" alt="Gallery item" class="block block-zenero-gallery-block-9 block-zenero-gallery-block" /><img src="https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800&q=70" alt="Gallery item" class="block block-zenero-gallery-block-10 block-zenero-gallery-block" /><img src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=70" alt="Gallery item" class="block block-zenero-gallery-block-11 block-zenero-gallery-block" />
    </div>
  </div>
  <script data-forge-js="gallery.js">(function(){
function esc(s){var d=document.createElement("div");d.textContent=s==null?"":String(s);return d.innerHTML;}
function initWidget(root){
  root.setAttribute("data-forge-gallery-init","1");
  var pid=root.getAttribute("data-forge-project-id")||window.__WD_PROJECT_ID||"";
  if(!pid) return;
  var grid=root.querySelector("[data-forge-gallery-grid]");
  if(!grid) return;
  fetch("/api/"+pid+"/gallery_items").then(function(r){return r.json();}).then(function(data){
    var items=data.gallery_items||[];
    if(!items.length) return;
    grid.innerHTML=items.map(function(g){
      return '<img src="'+esc(g.image_url)+'" alt="'+esc(g.alt_text||"")+'" style="width:100%;height:200px;object-fit:cover;border-radius:10px;" />';
    }).join("");
  }).catch(function(){});
}
function init(){
  var roots=document.querySelectorAll("[data-forge-widget='gallery']:not([data-forge-gallery-init])");
  for(var i=0;i<roots.length;i++) initWidget(roots[i]);
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init); else init();
})();</script>
</section>`,
      },
      {
        id: "latest-from-blog",
        label: "Latest from Blog",
        html: `<section data-forge-widget="latest-blog" data-forge-project-id="" class="block block-zenero-latest-from-blog-1 block-zenero-latest-from-blog">
  <div class="block block-zenero-latest-from-blog-2 block-zenero-latest-from-blog">
    <div class="block block-zenero-latest-from-blog-3 block-zenero-latest-from-blog">From the blog</div>
    <h2 class="block block-zenero-latest-from-blog-4 block-zenero-latest-from-blog">Latest from Blog</h2>
    <div data-forge-blog-titles class="block block-zenero-latest-from-blog-5 block-zenero-latest-from-blog">
      <button class="block block-zenero-latest-from-blog-6 block-zenero-latest-from-blog">Getting Started with Web Dojo</button>
      <button class="block block-zenero-latest-from-blog-7 block-zenero-latest-from-blog">Design Tips for Better Landing Pages</button>
      <button class="block block-zenero-latest-from-blog-8 block-zenero-latest-from-blog">Why Static Sites Still Win</button>
    </div>
    <div data-forge-blog-excerpt class="block block-zenero-latest-from-blog-9 block-zenero-latest-from-blog"></div>
  </div>
  <script data-forge-js="latest-blog.js">(function(){
function esc(s){var d=document.createElement("div");d.textContent=s==null?"":String(s);return d.innerHTML;}
// Rich-text pasted from Word/Docs/etc. into the Blog tab tends to carry
// inline style="..." (and sometimes whole <style> blocks) that fight the
// site's own theme. Strip both before ever injecting content_html — this
// runs on every render, so it fixes previously-pasted posts too, not just
// new ones.
function stripStyles(html){
  var d=document.createElement("div");
  d.innerHTML=html||"";
  var styled=d.querySelectorAll("[style]");
  for(var i=0;i<styled.length;i++) styled[i].removeAttribute("style");
  var styleTags=d.querySelectorAll("style");
  for(var j=0;j<styleTags.length;j++) styleTags[j].remove();
  return d.innerHTML;
}
function initWidget(root){
  root.setAttribute("data-forge-blog-init","1");
  var pid=root.getAttribute("data-forge-project-id")||window.__WD_PROJECT_ID||"";
  if(!pid) return;
  var titles=root.querySelector("[data-forge-blog-titles]");
  var excerpt=root.querySelector("[data-forge-blog-excerpt]");
  if(!titles) return;
  fetch("/api/"+pid+"/blog_posts").then(function(r){return r.json();}).then(function(data){
    var posts=(data.blog_posts||[]).slice(0,3);
    if(!posts.length) return;
    titles.innerHTML=posts.map(function(p){
      return '<button data-forge-blog-id="'+esc(p.id)+'" style="text-align:left;padding:12px 16px;border:1px solid var(--fc-border, #e2e8f0);border-radius:8px;background:var(--fc-surface, #f8fafc);font-size:14px;font-weight:500;color:var(--fc-text, #0f172a);cursor:pointer;width:100%;">'+esc(p.title)+'</button>';
    }).join("");
    titles.querySelectorAll("[data-forge-blog-id]").forEach(function(btn){
      btn.addEventListener("click",function(){
        var post=posts.find(function(p){return p.id===btn.getAttribute("data-forge-blog-id");});
        if(!post||!excerpt) return;
        excerpt.style.display="block";
        excerpt.innerHTML='<div style="font-size:14px;line-height:1.6;color:var(--fc-text, #334155);">'+esc(post.excerpt||"")+'</div>'
          + '<button data-forge-blog-read-full style="background:none;border:0;padding:0;display:inline-flex;align-items:center;gap:4px;margin-top:12px;font-size:13px;font-weight:600;color:var(--fc-primary, #0f172a);cursor:pointer;">Read Full Post <span aria-hidden="true">→</span></button>';
        var readFull=excerpt.querySelector("[data-forge-blog-read-full]");
        if(readFull) readFull.addEventListener("click",function(){
          excerpt.innerHTML='<div style="font-size:14px;line-height:1.6;color:var(--fc-text, #334155);">'+stripStyles(post.content_html)+'</div>';
        });
      });
    });
  }).catch(function(){});
}
function init(){
  var roots=document.querySelectorAll("[data-forge-widget='latest-blog']:not([data-forge-blog-init])");
  for(var i=0;i<roots.length;i++) initWidget(roots[i]);
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init); else init();
})();</script>
</section>`,
      },
      {
        id: "portfolio-timeline",
        label: "Portfolio Timeline",
        html: `<section data-forge-widget="portfolio" data-forge-project-id="" class="block block-zenero-portfolio-timeline-1 block-zenero-portfolio-timeline">
  <div class="block block-zenero-portfolio-timeline-2 block-zenero-portfolio-timeline">
    <div class="block block-zenero-portfolio-timeline-3 block-zenero-portfolio-timeline">Selected work</div>
    <h2 class="block block-zenero-portfolio-timeline-4 block-zenero-portfolio-timeline">Portfolio</h2>
    <div data-forge-portfolio-timeline class="block block-zenero-portfolio-timeline-5 block-zenero-portfolio-timeline">
      <div class="block block-zenero-portfolio-timeline-6 block-zenero-portfolio-timeline">
        <div class="block block-zenero-portfolio-timeline-7 block-zenero-portfolio-timeline"></div>
        <div class="block block-zenero-portfolio-timeline-8 block-zenero-portfolio-timeline">2024</div>
        <div class="block block-zenero-portfolio-timeline-9 block-zenero-portfolio-timeline">Project Alpha</div>
        <div class="block block-zenero-portfolio-timeline-10 block-zenero-portfolio-timeline">A flagship web experience.</div>
      </div>
      <div class="block block-zenero-portfolio-timeline-11 block-zenero-portfolio-timeline">
        <div class="block block-zenero-portfolio-timeline-12 block-zenero-portfolio-timeline"></div>
        <div class="block block-zenero-portfolio-timeline-13 block-zenero-portfolio-timeline">2023</div>
        <div class="block block-zenero-portfolio-timeline-14 block-zenero-portfolio-timeline">Project Beta</div>
        <div class="block block-zenero-portfolio-timeline-15 block-zenero-portfolio-timeline">A mobile-first redesign.</div>
      </div>
      <div class="block block-zenero-portfolio-timeline-16 block-zenero-portfolio-timeline">
        <div class="block block-zenero-portfolio-timeline-17 block-zenero-portfolio-timeline"></div>
        <div class="block block-zenero-portfolio-timeline-18 block-zenero-portfolio-timeline">2022</div>
        <div class="block block-zenero-portfolio-timeline-19 block-zenero-portfolio-timeline">Project Gamma</div>
        <div class="block block-zenero-portfolio-timeline-20 block-zenero-portfolio-timeline">An e-commerce buildout.</div>
      </div>
    </div>
  </div>
  <script data-forge-js="portfolio.js">(function(){
function esc(s){var d=document.createElement("div");d.textContent=s==null?"":String(s);return d.innerHTML;}
function initWidget(root){
  root.setAttribute("data-forge-portfolio-init","1");
  var pid=root.getAttribute("data-forge-project-id")||window.__WD_PROJECT_ID||"";
  if(!pid) return;
  var timeline=root.querySelector("[data-forge-portfolio-timeline]");
  if(!timeline) return;
  fetch("/api/"+pid+"/portfolio_items").then(function(r){return r.json();}).then(function(data){
    var items=data.portfolio_items||[];
    if(!items.length) return;
    timeline.innerHTML=items.map(function(p){
      return '<div style="position:relative;margin-bottom:24px;">'
        + '<div style="position:absolute;left:-29px;top:4px;width:12px;height:12px;border-radius:999px;background:var(--fc-primary, #0f172a);"></div>'
        + '<div style="font-size:12px;color:var(--fc-muted, #94a3b8);">'+esc(p.date||"")+'</div>'
        + '<div style="font-size:15px;font-weight:600;color:var(--fc-text, #0f172a);margin-top:2px;">'+esc(p.title)+'</div>'
        + '<div style="font-size:13px;color:var(--fc-muted, #64748b);margin-top:4px;">'+esc(p.description||"")+'</div>'
        + (p.link ? '<a href="'+esc(p.link)+'" style="display:inline-block;margin-top:8px;font-size:13px;font-weight:600;color:var(--fc-primary, #0f172a);text-decoration:none;">View project →</a>' : '')
        + '</div>';
    }).join("");
  }).catch(function(){});
}
function init(){
  var roots=document.querySelectorAll("[data-forge-widget='portfolio']:not([data-forge-portfolio-init])");
  for(var i=0;i<roots.length;i++) initWidget(roots[i]);
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init); else init();
})();</script>
</section>`,
      },
      {
        id: "testimonials-from-comments",
        label: "Testimonials from Comments",
        html: `<section data-forge-widget="testimonials" data-forge-project-id="" data-forge-platform="facebook" data-forge-post-id="" class="block block-zenero-testimonials-from-comments-1 block-zenero-testimonials-from-comments">
  <div class="block block-zenero-testimonials-from-comments-2 block-zenero-testimonials-from-comments">
    <div class="block block-zenero-testimonials-from-comments-3 block-zenero-testimonials-from-comments">What people say</div>
    <h2 class="block block-zenero-testimonials-from-comments-4 block-zenero-testimonials-from-comments">Testimonials</h2>
    <div data-forge-testimonials-list class="block block-zenero-testimonials-from-comments-5 block-zenero-testimonials-from-comments">
      <div class="block block-zenero-testimonials-from-comments-6 block-zenero-testimonials-from-comments">
        <div class="block block-zenero-testimonials-from-comments-7 block-zenero-testimonials-from-comments">"This product changed how we work. Highly recommended."</div>
        <div class="block block-zenero-testimonials-from-comments-8 block-zenero-testimonials-from-comments">— Sarah M.</div>
      </div>
      <div class="block block-zenero-testimonials-from-comments-9 block-zenero-testimonials-from-comments">
        <div class="block block-zenero-testimonials-from-comments-10 block-zenero-testimonials-from-comments">"Incredible support and a beautiful product."</div>
        <div class="block block-zenero-testimonials-from-comments-11 block-zenero-testimonials-from-comments">— James K.</div>
      </div>
    </div>
  </div>
  <script data-forge-js="testimonials.js">(function(){
function esc(s){var d=document.createElement("div");d.textContent=s==null?"":String(s);return d.innerHTML;}
function initWidget(root){
  root.setAttribute("data-forge-testimonials-init","1");
  var pid=root.getAttribute("data-forge-project-id")||window.__WD_PROJECT_ID||"";
  var platform=root.getAttribute("data-forge-platform")||"facebook";
  var postId=root.getAttribute("data-forge-post-id")||"";
  if(!pid||!postId) return;
  var list=root.querySelector("[data-forge-testimonials-list]");
  if(!list) return;
  fetch("/api/"+pid+"/social-testimonials?platform="+platform+"&post_id="+postId).then(function(r){return r.json();}).then(function(data){
    var items=data.testimonials||[];
    if(!items.length) return;
    list.innerHTML=items.map(function(t){
      return '<div style="border:1px solid var(--fc-border, #e2e8f0);border-radius:12px;padding:16px;background:var(--fc-surface, #f8fafc);">'
        + '<div style="font-size:13px;line-height:1.5;color:var(--fc-text, #334155);">"'+esc(t.text)+'"</div>'
        + '<div style="font-size:12px;font-weight:600;color:var(--fc-text, #0f172a);margin-top:8px;">— '+esc(t.author)+'</div>'
        + '</div>';
    }).join("");
  }).catch(function(){});
}
function init(){
  var roots=document.querySelectorAll("[data-forge-widget='testimonials']:not([data-forge-testimonials-init])");
  for(var i=0;i<roots.length;i++) initWidget(roots[i]);
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init); else init();
})();</script>
</section>`,
      },
      {
        id: "timeline-block",
        label: "Timeline",
        html: `<section data-forge-widget="timeline" data-forge-project-id="" class="block block-zenero-timeline-block-1 block-zenero-timeline-block">
  <div class="block block-zenero-timeline-block-2 block-zenero-timeline-block">
    <div class="block block-zenero-timeline-block-3 block-zenero-timeline-block">Our story</div>
    <h2 class="block block-zenero-timeline-block-4 block-zenero-timeline-block">Timeline</h2>
    <div data-forge-timeline-list class="block block-zenero-timeline-block-5 block-zenero-timeline-block">
      <div class="block block-zenero-timeline-block-6 block-zenero-timeline-block">
        <div class="block block-zenero-timeline-block-7 block-zenero-timeline-block"></div>
        <div class="block block-zenero-timeline-block-8 block-zenero-timeline-block">2024</div>
        <div class="block block-zenero-timeline-block-9 block-zenero-timeline-block">Founded</div>
        <div class="block block-zenero-timeline-block-10 block-zenero-timeline-block">Started the company.</div>
      </div>
      <div class="block block-zenero-timeline-block-11 block-zenero-timeline-block">
        <div class="block block-zenero-timeline-block-12 block-zenero-timeline-block"></div>
        <div class="block block-zenero-timeline-block-13 block-zenero-timeline-block">2025</div>
        <div class="block block-zenero-timeline-block-14 block-zenero-timeline-block">Launched</div>
        <div class="block block-zenero-timeline-block-15 block-zenero-timeline-block">Shipped the first release.</div>
      </div>
    </div>
  </div>
  <script data-forge-js="timeline.js">(function(){
function esc(s){var d=document.createElement("div");d.textContent=s==null?"":String(s);return d.innerHTML;}
function initWidget(root){
  root.setAttribute("data-forge-timeline-init","1");
  var pid=root.getAttribute("data-forge-project-id")||window.__WD_PROJECT_ID||"";
  if(!pid) return;
  var list=root.querySelector("[data-forge-timeline-list]");
  if(!list) return;
  fetch("/api/"+pid+"/timeline_entries").then(function(r){return r.json();}).then(function(data){
    var items=data.timeline_entries||[];
    if(!items.length) return;
    list.innerHTML=items.map(function(t){
      return '<div style="position:relative;margin-bottom:24px;">'
        + '<div style="position:absolute;left:-29px;top:4px;width:12px;height:12px;border-radius:999px;background:var(--fc-primary, #0f172a);"></div>'
        + '<div style="font-size:12px;color:var(--fc-muted, #94a3b8);">'+esc(t.date||"")+'</div>'
        + '<div style="font-size:15px;font-weight:600;color:var(--fc-text, #0f172a);margin-top:2px;">'+esc(t.title)+'</div>'
        + '<div style="font-size:13px;color:var(--fc-muted, #64748b);margin-top:4px;">'+esc(t.description||"")+'</div>'
        + '</div>';
    }).join("");
  }).catch(function(){});
}
function init(){
  var roots=document.querySelectorAll("[data-forge-widget='timeline']:not([data-forge-timeline-init])");
  for(var i=0;i<roots.length;i++) initWidget(roots[i]);
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init); else init();
})();</script>
</section>`,
      },
      {
        id: "bento-block",
        label: "Features Bento",
        html: `<section data-forge-widget="bento" data-forge-project-id="" class="block block-zenero-bento-block-1 block-zenero-bento-block">
  <div class="block block-zenero-bento-block-2 block-zenero-bento-block">
    <div class="block block-zenero-bento-block-3 block-zenero-bento-block">Why us</div>
    <h2 class="block block-zenero-bento-block-4 block-zenero-bento-block">Features</h2>
    <div data-forge-bento-grid class="block block-zenero-bento-block-5 block-zenero-bento-block">
      <div class="block block-zenero-bento-block-6 block-zenero-bento-block">
        <div class="block block-zenero-bento-block-7 block-zenero-bento-block">🚀</div>
        <div class="block block-zenero-bento-block-8 block-zenero-bento-block">Fast</div>
        <div class="block block-zenero-bento-block-9 block-zenero-bento-block">Loads in under a second.</div>
      </div>
      <div class="block block-zenero-bento-block-10 block-zenero-bento-block">
        <div class="block block-zenero-bento-block-11 block-zenero-bento-block">🔒</div>
        <div class="block block-zenero-bento-block-12 block-zenero-bento-block">Secure</div>
        <div class="block block-zenero-bento-block-13 block-zenero-bento-block">Built with best practices.</div>
      </div>
      <div class="block block-zenero-bento-block-14 block-zenero-bento-block">
        <div class="block block-zenero-bento-block-15 block-zenero-bento-block">🎨</div>
        <div class="block block-zenero-bento-block-16 block-zenero-bento-block">Beautiful</div>
        <div class="block block-zenero-bento-block-17 block-zenero-bento-block">Designed to stand out.</div>
      </div>
    </div>
  </div>
  <script data-forge-js="bento.js">(function(){
function esc(s){var d=document.createElement("div");d.textContent=s==null?"":String(s);return d.innerHTML;}
function initWidget(root){
  root.setAttribute("data-forge-bento-init","1");
  var pid=root.getAttribute("data-forge-project-id")||window.__WD_PROJECT_ID||"";
  if(!pid) return;
  var grid=root.querySelector("[data-forge-bento-grid]");
  if(!grid) return;
  fetch("/api/"+pid+"/bento_tiles").then(function(r){return r.json();}).then(function(data){
    var items=data.bento_tiles||[];
    if(!items.length) return;
    grid.innerHTML=items.map(function(b){
      var inner='<div style="font-size:24px;margin-bottom:10px;">'+esc(b.icon)+'</div>'
        + '<div style="font-size:15px;font-weight:600;color:var(--fc-text, #0f172a);margin-bottom:6px;">'+esc(b.title)+'</div>'
        + '<div style="font-size:13px;color:var(--fc-muted, #64748b);">'+esc(b.description||"")+'</div>';
      var style='border:1px solid var(--fc-border, #e2e8f0);border-radius:12px;padding:20px;background:var(--fc-surface, #f8fafc);display:block;text-decoration:none;';
      return b.href
        ? '<a href="'+esc(b.href)+'" style="'+style+'">'+inner+'</a>'
        : '<div style="'+style+'">'+inner+'</div>';
    }).join("");
  }).catch(function(){});
}
function init(){
  var roots=document.querySelectorAll("[data-forge-widget='bento']:not([data-forge-bento-init])");
  for(var i=0;i<roots.length;i++) initWidget(roots[i]);
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init); else init();
})();</script>
</section>`,
      },
      {
        id: "esports-roster-live",
        label: "Esports · Roster (live)",
        html: `<section data-forge-widget="roster" data-forge-project-id="" class="block block-zenero-esports-roster-live-1 block-zenero-esports-roster-live">
  <div class="block block-zenero-esports-roster-live-2 block-zenero-esports-roster-live">
    <h2 class="block block-zenero-esports-roster-live-3 block-zenero-esports-roster-live">Roster</h2>
    <div data-forge-roster-grid class="block block-zenero-esports-roster-live-4 block-zenero-esports-roster-live">
      <div class="block block-zenero-esports-roster-live-5 block-zenero-esports-roster-live">
        <div class="block block-zenero-esports-roster-live-6 block-zenero-esports-roster-live">Add players in the Zenero dashboard</div>
        <div class="block block-zenero-esports-roster-live-7 block-zenero-esports-roster-live">No roster yet</div>
      </div>
    </div>
  </div>
  <script data-forge-js="roster.js">(function(){
function esc(s){var d=document.createElement("div");d.textContent=s==null?"":String(s);return d.innerHTML;}
function initWidget(root){
  root.setAttribute("data-forge-roster-init","1");
  var pid=root.getAttribute("data-forge-project-id")||window.__WD_PROJECT_ID||"";
  if(!pid) return;
  var grid=root.querySelector("[data-forge-roster-grid]");
  if(!grid) return;
  fetch("/api/"+pid+"/roster_players").then(function(r){return r.json();}).then(function(data){
    var items=data.roster_players||[];
    if(!items.length) return;
    grid.innerHTML=items.map(function(p){
      return '<div style="background:var(--fc-surface, #101018);border:1px solid var(--fc-border, #22222e);border-radius:12px;padding:20px 14px;text-align:center;">'
        + '<div style="width:56px;height:56px;border-radius:999px;background:linear-gradient(135deg,var(--fc-accent, #22d3ee),var(--fc-surface, #101018));margin:0 auto 14px;"></div>'
        + '<div style="font-size:10px;font-weight:800;color:var(--fc-accent, #22d3ee);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">'+esc(p.role||"")+'</div>'
        + '<div style="font-weight:800;color:var(--fc-text, #fff);font-size:15px;margin-bottom:10px;">'+esc(p.name)+'</div>'
        + (p.stat_value ? '<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--fc-muted, #6b7280);border-top:1px solid var(--fc-border, #22222e);padding-top:8px;"><span>'+esc(p.stat_label||"")+'</span><span style="color:var(--fc-text, #fff);font-weight:700;">'+esc(p.stat_value)+'</span></div>' : '')
        + '</div>';
    }).join("");
  }).catch(function(){});
}
function init(){
  var roots=document.querySelectorAll("[data-forge-widget='roster']:not([data-forge-roster-init])");
  for(var i=0;i<roots.length;i++) initWidget(roots[i]);
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init); else init();
})();</script>
</section>`,
      },
      {
        id: "esports-fixtures-live",
        label: "Esports · Fixtures (live)",
        html: `<section data-forge-widget="fixtures" data-forge-project-id="" class="block block-zenero-esports-fixtures-live-1 block-zenero-esports-fixtures-live">
  <div class="block block-zenero-esports-fixtures-live-2 block-zenero-esports-fixtures-live">
    <h2 class="block block-zenero-esports-fixtures-live-3 block-zenero-esports-fixtures-live">Fixtures</h2>
    <div data-forge-fixtures-list class="block block-zenero-esports-fixtures-live-4 block-zenero-esports-fixtures-live">
      <div class="block block-zenero-esports-fixtures-live-5 block-zenero-esports-fixtures-live">Add fixtures in the Zenero dashboard.</div>
    </div>
  </div>
  <script data-forge-js="fixtures.js">(function(){
function esc(s){var d=document.createElement("div");d.textContent=s==null?"":String(s);return d.innerHTML;}
function initWidget(root){
  root.setAttribute("data-forge-fixtures-init","1");
  var pid=root.getAttribute("data-forge-project-id")||window.__WD_PROJECT_ID||"";
  if(!pid) return;
  var list=root.querySelector("[data-forge-fixtures-list]");
  if(!list) return;
  fetch("/api/"+pid+"/fixtures").then(function(r){return r.json();}).then(function(data){
    var items=data.fixtures||[];
    if(!items.length) return;
    list.innerHTML=items.map(function(f){
      var meta=f.status==="final"
        ? esc(f.competition||"")+' · Final'
        : esc(f.competition||"")+(f.note?' · '+esc(f.note):'')+(f.scheduled_at?' · '+esc(f.scheduled_at):'');
      var teams=f.status==="final"
        ? 'vs '+esc(f.opponent)+' <span style="color:var(--fc-accent, #22d3ee);">'+esc(f.team_score||"0")+'–'+esc(f.opponent_score||"0")+'</span>'
        : 'vs '+esc(f.opponent);
      return '<div style="background:var(--fc-surface, #101018);border:1px solid var(--fc-border, #22222e);border-radius:10px;padding:16px 22px;display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;">'
        + '<div style="font-weight:800;font-size:15px;color:var(--fc-text, #fff);">'+teams+'</div>'
        + '<div style="color:var(--fc-muted, #6b7280);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;">'+meta+'</div>'
        + '</div>';
    }).join("");
  }).catch(function(){});
}
function init(){
  var roots=document.querySelectorAll("[data-forge-widget='fixtures']:not([data-forge-fixtures-init])");
  for(var i=0;i<roots.length;i++) initWidget(roots[i]);
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init); else init();
})();</script>
</section>`,
      },
      {
        id: "esports-org-stats-live",
        label: "Esports · Org Stats (live)",
        html: `<section data-forge-widget="org-stats" data-forge-project-id="" class="block block-zenero-esports-org-stats-live-1 block-zenero-esports-org-stats-live">
  <div data-forge-org-stats-row class="block block-zenero-esports-org-stats-live-2 block-zenero-esports-org-stats-live">
    <div class="block block-zenero-esports-org-stats-live-3 block-zenero-esports-org-stats-live">Add stats in the Zenero dashboard.</div>
  </div>
  <script data-forge-js="org-stats.js">(function(){
function esc(s){var d=document.createElement("div");d.textContent=s==null?"":String(s);return d.innerHTML;}
function initWidget(root){
  root.setAttribute("data-forge-org-stats-init","1");
  var pid=root.getAttribute("data-forge-project-id")||window.__WD_PROJECT_ID||"";
  if(!pid) return;
  var row=root.querySelector("[data-forge-org-stats-row]");
  if(!row) return;
  fetch("/api/"+pid+"/org_stats").then(function(r){return r.json();}).then(function(data){
    var items=data.org_stats||[];
    if(!items.length) return;
    row.innerHTML=items.map(function(s){
      return '<div style="text-align:center;flex:1;min-width:120px;">'
        + '<div style="font-size:26px;font-weight:800;color:var(--fc-accent, #22d3ee);">'+esc(s.value)+'</div>'
        + '<div style="font-size:11px;color:var(--fc-muted, #6b7280);text-transform:uppercase;letter-spacing:.06em;margin-top:4px;">'+esc(s.label)+'</div>'
        + '</div>';
    }).join("");
  }).catch(function(){});
}
function init(){
  var roots=document.querySelectorAll("[data-forge-widget='org-stats']:not([data-forge-org-stats-init])");
  for(var i=0;i<roots.length;i++) initWidget(roots[i]);
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init); else init();
})();</script>
</section>`,
      },
    ],
  }, {
    id: "oxygene",
    label: "Oxygene",
    blocks: [
      {
        id: "oxy-hero",
        label: "Oxygene · Hero",
        html: `<section class="block oxygene block-oxygene-hero">
  <div class="block-oxygene-hero-inner">
    <h1 class="block-oxygene-hero-title">Oxygen.</h1>
    <h2 class="block-oxygene-hero-subtitle">Where design meets innovation</h2>
    <p class="block-oxygene-hero-description">Build luminous digital experiences with a design system crafted for clarity, scale, and soul.</p>
    <button class="block-oxygene-btn block-oxygene-btn-primary">Get Started</button>
  </div>
</section>`,
      },
      {
        id: "oxy-features",
        label: "Oxygene · Features Grid",
        html: `<section class="block oxygene block-oxygene-features">
  <div class="block-oxygene-features-header">
    <h3 class="block-oxygene-section-title">Luminous Features</h3>
    <p class="block-oxygene-section-description">Everything you need to build with confidence.</p>
  </div>
  <div class="block-oxygene-grid">
    <div class="block-oxygene-feature-card">
      <div class="block-oxygene-feature-icon"><i class="fas fa-palette"></i></div>
      <h4 class="block-oxygene-feature-title">Design System</h4>
      <p class="block-oxygene-feature-text">Comprehensive tokens, components, and patterns for cohesive design.</p>
    </div>
    <div class="block-oxygene-feature-card">
      <div class="block-oxygene-feature-icon"><i class="fas fa-code"></i></div>
      <h4 class="block-oxygene-feature-title">Clean Code</h4>
      <p class="block-oxygene-feature-text">Semantic HTML and organized CSS that scales with your project.</p>
    </div>
    <div class="block-oxygene-feature-card">
      <div class="block-oxygene-feature-icon"><i class="fas fa-bolt"></i></div>
      <h4 class="block-oxygene-feature-title">Performance</h4>
      <p class="block-oxygene-feature-text">Optimized for speed and accessibility across all devices.</p>
    </div>
    <div class="block-oxygene-feature-card">
      <div class="block-oxygene-feature-icon"><i class="fas fa-shield-alt"></i></div>
      <h4 class="block-oxygene-feature-title">Reliability</h4>
      <p class="block-oxygene-feature-text">Battle-tested patterns built for real-world projects.</p>
    </div>
  </div>
</section>`,
      },
      {
        id: "oxy-services",
        label: "Oxygene · Services Cards",
        html: `<section class="block oxygene block-oxygene-services">
  <h3 class="block-oxygene-section-title">Services</h3>
  <p class="block-oxygene-section-description">Comprehensive solutions designed for your digital needs.</p>
  <div class="block-oxygene-services-grid">
    <div class="block-oxygene-service-card">
      <div class="block-oxygene-service-accent"></div>
      <h3 class="block-oxygene-service-title">Design</h3>
      <div class="block-oxygene-service-icon"><i class="fas fa-palette"></i></div>
      <p class="block-oxygene-service-description">We craft visual experiences that balance beauty with purpose.</p>
      <button class="block-oxygene-btn block-oxygene-btn-secondary">Learn More</button>
    </div>
    <div class="block-oxygene-service-card">
      <div class="block-oxygene-service-accent"></div>
      <h3 class="block-oxygene-service-title">Development</h3>
      <div class="block-oxygene-service-icon"><i class="fas fa-code"></i></div>
      <p class="block-oxygene-service-description">Modern, maintainable code with clean architecture.</p>
      <button class="block-oxygene-btn block-oxygene-btn-secondary">Learn More</button>
    </div>
    <div class="block-oxygene-service-card">
      <div class="block-oxygene-service-accent"></div>
      <h3 class="block-oxygene-service-title">Strategy</h3>
      <div class="block-oxygene-service-icon"><i class="fas fa-chart-line"></i></div>
      <p class="block-oxygene-service-description">Data-driven direction that keeps your brand luminous.</p>
      <button class="block-oxygene-btn block-oxygene-btn-secondary">Learn More</button>
    </div>
  </div>
</section>`,
      },
      {
        id: "oxy-portfolio-timeline",
        label: "Oxygene · Stem & Leaf Timeline",
        html: `<section class="block oxygene block-oxygene-portfolio">
  <div class="block-oxygene-portfolio-header">
    <h3 class="block-oxygene-section-title">Portfolio</h3>
    <p class="block-oxygene-section-description">A timeline of projects, from foundation to finished work.</p>
  </div>
  <div class="block-oxygene-timeline" data-inject="portfolio-timeline">
    <div class="block-oxygene-year-label">2026</div>
    <div class="block-oxygene-timeline-items">
      <div class="block-oxygene-timeline-item">
        <div class="block-oxygene-timeline-dot"></div>
        <div class="block-oxygene-timeline-card">Web Dojo Platform — Full-stack redesign</div>
      </div>
      <div class="block-oxygene-timeline-item">
        <div class="block-oxygene-timeline-dot"></div>
        <div class="block-oxygene-timeline-card">Avalon GEMS — 14-gem design system</div>
      </div>
    </div>
  </div>
</section>`,
      },
      {
        id: "oxy-testimonials",
        label: "Oxygene · Testimonials Carousel",
        html: `<section class="block oxygene block-oxygene-testimonials">
  <h3 class="block-oxygene-section-title">What They Say</h3>
  <p class="block-oxygene-section-description">Stories from partners who trusted the everlight.</p>
  <div class="block-oxygene-carousel">
    <div class="block-oxygene-carousel-wrapper">
      <div class="block-oxygene-carousel-slides" id="carouselSlides">
        <div class="block-oxygene-testimonial-slide">
          <p class="block-oxygene-testimonial-quote">"Oxygen transformed how we present our work."</p>
          <div class="block-oxygene-testimonial-author">
            <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=75" alt="Avatar" class="block-oxygene-testimonial-avatar" />
            <div class="block-oxygene-author-info">
              <h5 class="block-oxygene-author-name">Sarah Chen</h5>
              <span class="block-oxygene-author-role">Design Lead, LUMEN</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="block-oxygene-carousel-controls">
      <button class="block-oxygene-carousel-btn block-oxygene-carousel-btn-prev" onclick="moveCarousel(-1)"><i class="fas fa-chevron-left"></i></button>
      <button class="block-oxygene-carousel-btn block-oxygene-carousel-btn-next" onclick="moveCarousel(1)"><i class="fas fa-chevron-right"></i></button>
    </div>
  </div>
</section>`,
      },
    ],
  },
];