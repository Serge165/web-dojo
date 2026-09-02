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
        html: `<nav class="block block-navbars-centered-logo">
          <div class="utility-2">
          <a href="#" class="utility-3">Shop</a><a href="#" class="utility-4">New</a><a href="#" class="utility-5">About</a>
          </div>
          <div class="utility-6">MAISON</div>
          <div class="utility-7">
          <a href="#" class="utility-8">Journal</a><a href="#" class="utility-9">Cart (0)</a>
          </div>
        </nav>`,
      },
      {
        id: "nav-mega",
        label: "Mega-menu Nav",
        html: `<nav class="block block-navbars-mega">
          <div class="utility-2">Northwind</div>
          <div class="utility-3">
          <div class="wd-mega-item utility-4"><a href="#" class="utility-5">Products ▾</a>
          <div class="wd-mega-panel utility-6">
          <a href="#" class="utility-7"><div class="utility-8">Analytics</div><div class="utility-9">Understand your traffic</div></a><a href="#" class="utility-10"><div class="utility-11">Automations</div><div class="utility-12">Set it and forget it</div></a><a href="#" class="utility-13"><div class="utility-14">Inbox</div><div class="utility-15">One place for messages</div></a><a href="#" class="utility-16"><div class="utility-17">Reports</div><div class="utility-18">Beautiful dashboards</div></a>
          </div>
          </div>
          <a href="#" class="utility-19">Pricing</a><a href="#" class="utility-20">Docs</a>
          </div>
          <button class="utility-21">Get started</button>
          <style>.wd-mega .wd-mega-item:hover .wd-mega-panel{display:grid;}</style>
        </nav>`,
      },
      {
        id: "nav-ecommerce",
        label: "E-commerce Nav + Search",
        html: `<nav class="block block-navbars-ecommerce">
          <div class="utility-2">STORE</div>
          <div class="utility-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
          <input placeholder="Search products…" class="utility-4" />
          </div>
          <div class="utility-5">
          <a href="#" class="utility-6">Account</a>
          <a href="#" class="utility-7">Cart <span class="utility-8">3</span></a>
          </div>
        </nav>`,
      },
      {
        id: "nav-transparent",
        label: "Transparent Overlay Nav",
        html: `<nav class="block block-navbars-transparent">
          <div class="utility-2">AURORA</div>
          <div class="utility-3">
          <a href="#" class="utility-4">Home</a><a href="#" class="utility-5">Rooms</a><a href="#" class="utility-6">Dining</a>
          </div>
          <button class="utility-7">Book now</button>
        </nav>`,
      },
      {
        id: "nav-app-tabs",
        label: "App Pill-tabs Nav",
        html: `<nav class="block block-navbars-app-tabs">
          <div class="utility-2">◐ Flowly</div>
          <div class="utility-3">
          <a href="#" class="utility-4">Overview</a><a href="#" class="utility-5">Projects</a><a href="#" class="utility-6">Team</a><a href="#" class="utility-7">Settings</a>
          </div>
          <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80" class="utility-8" alt="" />
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
        html: `<section class="block block-headers-announcement">
  <div class="utility-2">✦ Free shipping on orders over $50 — <a href="#" class="utility-3">Shop now</a></div>
  <header class="utility-4">
    <div class="utility-5">Brand</div>
    <nav class="utility-6"><a href="#" class="utility-7">Home</a><a href="#" class="utility-8">Shop</a><a href="#" class="utility-9">Blog</a></nav>
    <button class="utility-10">Contact</button>
  </header>
</section>`,
      },
      {
        id: "hdr-dropdown",
        label: "Header + Dropdown",
        html: `<section class="block block-headers-dropdown">
          <div class="utility-2">Vertex</div>
          <nav class="utility-3">
          <div class="wd-hd-item utility-4"><a href="#" class="utility-5">Solutions ▾</a>
          <div class="wd-hd-menu utility-6">
          <a href="#" class="utility-7">For startups</a><a href="#" class="utility-8">For agencies</a><a href="#" class="utility-9">For enterprise</a>
          </div>
          </div>
          <a href="#" class="utility-10">Pricing</a><a href="#" class="utility-11">Company</a>
          </nav>
          <button class="utility-12">Sign up</button>
          <style>.wd-hd .wd-hd-item:hover .wd-hd-menu{display:block;}</style>
        </section>`,
      },
      {
        id: "hdr-minimal-serif",
        label: "Minimal Serif Header",
        html: `<section class="block block-headers-minimal-serif">
          <div class="utility-2">The Quarterly</div>
          <nav class="utility-3">
          <a href="#" class="utility-4">Essays</a><a href="#" class="utility-5">Interviews</a><a href="#" class="utility-6">Archive</a><a href="#" class="utility-7">Subscribe</a>
          </nav>
        </section>`,
      },
      {
        id: "hdr-dark-cta",
        label: "Dark Header + CTA",
        html: `<section class="block block-headers-dark-cta">
          <div class="utility-2"><div class="utility-3"></div><span class="utility-4">Ignite</span></div>
          <nav class="utility-5"><a href="#" class="utility-6">Product</a><a href="#" class="utility-7">Customers</a><a href="#" class="utility-8">Pricing</a></nav>
          <div class="utility-9"><button class="utility-10">Log in</button><button class="utility-11">Start free</button></div>
        </section>`,
      },
      {
        id: "hdr-search-actions",
        label: "Header + Search + Icons",
        html: `<section class="block block-headers-search-actions">
          <div class="utility-2">Docs</div>
          <nav class="utility-3"><a href="#" class="utility-4">Guides</a><a href="#" class="utility-5">API</a><a href="#" class="utility-6">Examples</a></nav>
          <div class="utility-7"></div>
          <div class="utility-8"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg><input placeholder="Search docs ⌘K" class="utility-9" /></div>
          <a href="#" class="utility-10">◔</a>
        </section>`,
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
        html: `<footer class="block block-footers-minimal">
          <div class="utility-2">© 2026 Brand — All rights reserved.</div>
          <div class="utility-3"><a href="#" class="utility-4">Privacy</a><a href="#" class="utility-5">Terms</a><a href="#" class="utility-6">Contact</a></div>
        </footer>`,
      },
      {
        id: "ft-newsletter",
        label: "Newsletter Footer",
        html: `<footer class="block block-footers-newsletter">
          <div class="utility-2">
          <div><h3 class="utility-3">Stay in the loop</h3><p class="utility-4">One thoughtful email a week. No spam.</p></div>
          <form class="utility-5"><input placeholder="you@example.com" class="utility-6" /><button class="utility-7">Subscribe</button></form>
          </div>
          <div class="utility-8">© 2026 Brand.</div>
        </footer>`,
      },
      {
        id: "ft-social-dark",
        label: "Social Footer",
        html: `<footer class="block block-footers-social-dark">
          <div class="utility-2">AURORA</div>
          <div class="utility-3">
          <a href="#" class="utility-4">Instagram</a><a href="#" class="utility-5">X</a><a href="#" class="utility-6">YouTube</a><a href="#" class="utility-7">TikTok</a>
          </div>
          <div class="utility-8">© 2026 Aurora Studio. Made with care.</div>
        </footer>`,
      },
      {
        id: "ft-columns-light",
        label: "4-column Light Footer",
        html: `<footer class="block block-footers-columns-light">
          <div class="utility-2">
          <div><div class="utility-3">Brand</div><p class="utility-4">Design and ship beautiful sites, fast.</p></div>
          <div><div class="utility-5">Product</div><a href="#" class="utility-6">Features</a><a href="#" class="utility-7">Pricing</a><a href="#" class="utility-8">Roadmap</a></div><div><div class="utility-9">Resources</div><a href="#" class="utility-10">Blog</a><a href="#" class="utility-11">Guides</a><a href="#" class="utility-12">Support</a></div><div><div class="utility-13">Company</div><a href="#" class="utility-14">About</a><a href="#" class="utility-15">Careers</a><a href="#" class="utility-16">Legal</a></div>
          </div>
        </footer>`,
      },
      {
        id: "ft-contact",
        label: "Contact Footer",
        html: `<footer class="block block-footers-contact">
          <div class="utility-2">
          <div><div class="utility-3">Get in touch</div><p class="utility-4">hello@example.com<br/>+1 (555) 019-2834<br/>24 Harbour St, Suite 400</p></div>
          <div><div class="utility-5">Hours</div><p class="utility-6">Mon–Fri · 9–6<br/>Sat · 10–4<br/>Sun · Closed</p></div>
          <div><div class="utility-7">Follow</div><p class="utility-8">Instagram<br/>LinkedIn<br/>YouTube</p></div>
          </div>
          <div class="utility-9">© 2026 Brand.</div>
        </footer>`,
      },
      {
        id: "ft-app-download",
        label: "App Download Footer",
        html: `<footer class="block block-footers-app-download">
          <h3 class="utility-2">Take it everywhere</h3>
          <p class="utility-3">Download the app for iOS and Android.</p>
          <div class="utility-4">
          <a href="#" class="utility-5">↧ App Store</a>
          <a href="#" class="utility-6">↧ Google Play</a>
          </div>
        </footer>`,
      },
      {
        id: "ft-mega-multicol",
        label: "Mega 5-column Footer",
        html: `<footer class="block block-footers-mega-multicol">
          <div class="utility-2">
          <div><div class="utility-3">Brand</div><p class="utility-4">Tools for teams who ship fast and design well.</p></div>
          <div><div class="utility-5">Product</div><a href="#" class="utility-6">Features</a><a href="#" class="utility-7">Integrations</a><a href="#" class="utility-8">Changelog</a></div><div><div class="utility-9">Solutions</div><a href="#" class="utility-10">Agencies</a><a href="#" class="utility-11">Startups</a><a href="#" class="utility-12">Enterprise</a></div><div><div class="utility-13">Resources</div><a href="#" class="utility-14">Blog</a><a href="#" class="utility-15">Guides</a><a href="#" class="utility-16">API Docs</a></div><div><div class="utility-17">Company</div><a href="#" class="utility-18">About</a><a href="#" class="utility-19">Careers</a><a href="#" class="utility-20">Press</a></div>
          </div>
          <div class="utility-21">
          <span>© 2026 Brand. All rights reserved.</span>
          <div class="utility-22"><a href="#" class="utility-23">Privacy</a><a href="#" class="utility-24">Terms</a><a href="#" class="utility-25">Cookies</a></div>
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
        html: `<section class="block block-video-hero">
          <video autoplay muted loop playsinline poster="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&q=70" class="utility-2"><source src="https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" type="video/mp4" /></video>
          <div class="utility-3"></div>
          <div class="utility-4">
          <h1 class="utility-5 block-heading">Motion tells your story</h1>
          <p class="utility-6">A cinematic hero with a looping background video. Muted, auto-playing, mobile-friendly.</p>
          <a href="#" class="utility-7">Watch the film</a>
          </div>
        </section>`,
      },
      {
        id: "video-section",
        label: "Section · Video + Text",
        html: `<section class="block block-video-section">
          <div class="utility-2">
          <div class="utility-3"><video autoplay muted loop playsinline poster="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&q=70" class="utility-4"><source src="https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" type="video/mp4" /></video></div>
          <div>
          <div class="utility-5">See it in action</div>
          <h2 class="utility-6 block-heading">Built to move</h2>
          <p class="utility-7">Pair looping product footage with crisp copy. The video autoplays muted and loops seamlessly on every device.</p>
          <a href="#" class="utility-8">Learn more</a>
          </div>
          </div>
        </section>`,
      },
      {
        id: "video-banner",
        label: "Video Banner Strip",
        html: `<section class="block block-video-banner">
          <video autoplay muted loop playsinline poster="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&q=70" class="utility-2"><source src="https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" type="video/mp4" /></video>
          <div class="utility-3"></div>
          <div class="utility-4">
          <h2 class="utility-5 block-heading">Adventure awaits</h2>
          <p class="utility-6">A compact full-bleed video banner for section breaks.</p>
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
        html: `<section class="block block-pricing-toggle">
          <div class="wd-pricing utility-2">
          <h2 class="utility-3 block-heading">Simple pricing</h2>
          <p class="utility-4">Switch between monthly and yearly billing.</p>
          <input type="checkbox" id="wd-pt" class="wd-pt-toggle utility-5" />
          <label for="wd-pt" class="utility-6">
          <span>Monthly</span>
          <span class="utility-7">
          <span class="wd-pt-dot utility-8"></span>
          </span>
          <span>Yearly <span class="utility-9">(save 20%)</span></span>
          </label>
          <div class="utility-10">
          <div class="utility-11">
          <div class="utility-12">Starter</div>
          <div class="utility-13"><span class="wd-price-m">$9</span><span class="wd-price-y">$86</span><span class="utility-14">/mo</span></div>
          <ul class="utility-15">
          <li>✓ Full feature access</li><li>✓ Priority support</li><li>✓ Unlimited projects</li>
          </ul>
          <a href="#" class="utility-16">Choose Starter</a>
          </div>
          <div class="utility-17">
          <div class="utility-18">Growth</div>
          <div class="utility-19"><span class="wd-price-m">$29</span><span class="wd-price-y">$278</span><span class="utility-20">/mo</span></div>
          <ul class="utility-21">
          <li>✓ Full feature access</li><li>✓ Priority support</li><li>✓ Unlimited projects</li>
          </ul>
          <a href="#" class="utility-22">Choose Growth</a>
          </div>
          <div class="utility-23">
          <div class="utility-24">Scale</div>
          <div class="utility-25"><span class="wd-price-m">$79</span><span class="wd-price-y">$758</span><span class="utility-26">/mo</span></div>
          <ul class="utility-27">
          <li>✓ Full feature access</li><li>✓ Priority support</li><li>✓ Unlimited projects</li>
          </ul>
          <a href="#" class="utility-28">Choose Scale</a>
          </div>
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
        html: `<section class="block block-team-cards">
          <div class="utility-2">
          <h2 class="utility-3 block-heading">Meet the team</h2>
          <div class="utility-4">
          <div class="utility-5">
          <img src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&q=75" class="utility-6" alt="Ava Chen" />
          <div class="utility-7">Ava Chen</div>
          <div class="utility-8">Product Lead</div>
          <div class="utility-9">
          <a href="#" class="utility-10" aria-label="LinkedIn"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 11-.02 5.001A2.5 2.5 0 014.98 3.5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-.98 1.83-2 3.76-2 4.02 0 4.76 2.5 4.76 5.76V21h-4v-5.85c0-1.4-.03-3.2-2-3.2-2 0-2.3 1.5-2.3 3.1V21H9z"/></svg></a>
          <a href="#" class="utility-11" aria-label="Twitter"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22 5.9c-.7.3-1.5.6-2.3.7.8-.5 1.5-1.3 1.8-2.3-.8.5-1.7.8-2.6 1a4.1 4.1 0 00-7 3.7A11.6 11.6 0 013 4.9a4.1 4.1 0 001.3 5.5c-.7 0-1.3-.2-1.9-.5v.1c0 2 1.4 3.6 3.3 4a4.1 4.1 0 01-1.9.1c.5 1.6 2.1 2.8 3.9 2.9A8.2 8.2 0 012 18.6a11.6 11.6 0 006.3 1.8c7.5 0 11.7-6.3 11.7-11.7v-.5c.8-.6 1.5-1.3 2-2.1z"/></svg></a>
          </div>
          </div>
          <div class="utility-12">
          <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=75" class="utility-13" alt="Marcus Reed" />
          <div class="utility-14">Marcus Reed</div>
          <div class="utility-15">Engineering</div>
          <div class="utility-16">
          <a href="#" class="utility-17" aria-label="LinkedIn"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 11-.02 5.001A2.5 2.5 0 014.98 3.5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-.98 1.83-2 3.76-2 4.02 0 4.76 2.5 4.76 5.76V21h-4v-5.85c0-1.4-.03-3.2-2-3.2-2 0-2.3 1.5-2.3 3.1V21H9z"/></svg></a>
          <a href="#" class="utility-18" aria-label="Twitter"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22 5.9c-.7.3-1.5.6-2.3.7.8-.5 1.5-1.3 1.8-2.3-.8.5-1.7.8-2.6 1a4.1 4.1 0 00-7 3.7A11.6 11.6 0 013 4.9a4.1 4.1 0 001.3 5.5c-.7 0-1.3-.2-1.9-.5v.1c0 2 1.4 3.6 3.3 4a4.1 4.1 0 01-1.9.1c.5 1.6 2.1 2.8 3.9 2.9A8.2 8.2 0 012 18.6a11.6 11.6 0 006.3 1.8c7.5 0 11.7-6.3 11.7-11.7v-.5c.8-.6 1.5-1.3 2-2.1z"/></svg></a>
          </div>
          </div>
          <div class="utility-19">
          <img src="https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&q=75" class="utility-20" alt="Priya Nair" />
          <div class="utility-21">Priya Nair</div>
          <div class="utility-22">Design</div>
          <div class="utility-23">
          <a href="#" class="utility-24" aria-label="LinkedIn"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 11-.02 5.001A2.5 2.5 0 014.98 3.5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-.98 1.83-2 3.76-2 4.02 0 4.76 2.5 4.76 5.76V21h-4v-5.85c0-1.4-.03-3.2-2-3.2-2 0-2.3 1.5-2.3 3.1V21H9z"/></svg></a>
          <a href="#" class="utility-25" aria-label="Twitter"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22 5.9c-.7.3-1.5.6-2.3.7.8-.5 1.5-1.3 1.8-2.3-.8.5-1.7.8-2.6 1a4.1 4.1 0 00-7 3.7A11.6 11.6 0 013 4.9a4.1 4.1 0 001.3 5.5c-.7 0-1.3-.2-1.9-.5v.1c0 2 1.4 3.6 3.3 4a4.1 4.1 0 01-1.9.1c.5 1.6 2.1 2.8 3.9 2.9A8.2 8.2 0 012 18.6a11.6 11.6 0 006.3 1.8c7.5 0 11.7-6.3 11.7-11.7v-.5c.8-.6 1.5-1.3 2-2.1z"/></svg></a>
          </div>
          </div>
          <div class="utility-26">
          <img src="https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=200&q=75" class="utility-27" alt="Tom Vidal" />
          <div class="utility-28">Tom Vidal</div>
          <div class="utility-29">Growth</div>
          <div class="utility-30">
          <a href="#" class="utility-31" aria-label="LinkedIn"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 11-.02 5.001A2.5 2.5 0 014.98 3.5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-.98 1.83-2 3.76-2 4.02 0 4.76 2.5 4.76 5.76V21h-4v-5.85c0-1.4-.03-3.2-2-3.2-2 0-2.3 1.5-2.3 3.1V21H9z"/></svg></a>
          <a href="#" class="utility-32" aria-label="Twitter"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22 5.9c-.7.3-1.5.6-2.3.7.8-.5 1.5-1.3 1.8-2.3-.8.5-1.7.8-2.6 1a4.1 4.1 0 00-7 3.7A11.6 11.6 0 013 4.9a4.1 4.1 0 001.3 5.5c-.7 0-1.3-.2-1.9-.5v.1c0 2 1.4 3.6 3.3 4a4.1 4.1 0 01-1.9.1c.5 1.6 2.1 2.8 3.9 2.9A8.2 8.2 0 012 18.6a11.6 11.6 0 006.3 1.8c7.5 0 11.7-6.3 11.7-11.7v-.5c.8-.6 1.5-1.3 2-2.1z"/></svg></a>
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
        html: `<section class="block block-faq-accordion">
          <div class="wd-faq utility-2">
          <h2 class="utility-3 block-heading">Frequently asked</h2>
          <details class="utility-4">
          <summary class="utility-5">
          Can I cancel anytime?
          <span class="wd-chev utility-6">⌄</span>
          </summary>
          <p class="utility-7">Yes, cancel from your account settings with no fees or lock-in period.</p>
          </details>
          <details class="utility-8">
          <summary class="utility-9">
          Do you offer a free trial?
          <span class="wd-chev utility-10">⌄</span>
          </summary>
          <p class="utility-11">Every plan starts with a 14-day free trial, no card required.</p>
          </details>
          <details class="utility-12">
          <summary class="utility-13">
          Is my data secure?
          <span class="wd-chev utility-14">⌄</span>
          </summary>
          <p class="utility-15">All data is encrypted in transit and at rest, with daily backups.</p>
          </details>
          <details class="utility-16">
          <summary class="utility-17">
          Can I change plans later?
          <span class="wd-chev utility-18">⌄</span>
          </summary>
          <p class="utility-19">Upgrade or downgrade anytime — billing prorates automatically.</p>
          </details>
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
        html: `<section class="block block-newsletter-signup">
          <form novalidate class="wd-nl utility-2">
          <h2 class="utility-3 block-heading">Join the newsletter</h2>
          <p class="utility-4">Product updates and design notes, twice a month.</p>
          <div class="utility-5">
          <input type="email" required placeholder="you@example.com" class="utility-6" />
          <button type="submit" class="utility-7">Subscribe</button>
          </div>
          <p class="wd-nl-err utility-8">Please enter a valid email address.</p>
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
        html: `<section class="block block-portfolio-filter">
          <div class="wd-portfolio utility-2">
          <h2 class="utility-3 block-heading">Selected work</h2>
          <div class="utility-4">
          <input type="radio" name="wd-pf" id="wd-pf-all" checked class="utility-5" /><label for="wd-pf-all" class="utility-6">all</label><input type="radio" name="wd-pf" id="wd-pf-branding"  class="utility-7" /><label for="wd-pf-branding" class="utility-8">branding</label><input type="radio" name="wd-pf" id="wd-pf-product"  class="utility-9" /><label for="wd-pf-product" class="utility-10">product</label><input type="radio" name="wd-pf" id="wd-pf-web"  class="utility-11" /><label for="wd-pf-web" class="utility-12">web</label>
          </div>
          <div class="utility-13">
          <div data-cat="branding" class="wd-pf-item utility-14"><img src="https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&q=70" class="utility-15" alt="" /></div><div data-cat="product" class="wd-pf-item utility-16"><img src="https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&q=70" class="utility-17" alt="" /></div><div data-cat="web" class="wd-pf-item utility-18"><img src="https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=800&q=70" class="utility-19" alt="" /></div><div data-cat="branding" class="wd-pf-item utility-20"><img src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=70" class="utility-21" alt="" /></div><div data-cat="product" class="wd-pf-item utility-22"><img src="https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800&q=70" class="utility-23" alt="" /></div><div data-cat="web" class="wd-pf-item utility-24"><img src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=70" class="utility-25" alt="" /></div>
          </div>
          <style>
          .wd-portfolio:has(#wd-pf-all:checked) label[for="wd-pf-all"]{background:var(--fc-primary, #0f172a);color:#fff;border-color:var(--fc-primary, #0f172a);}
          .wd-portfolio:has(#wd-pf-branding:checked) label[for="wd-pf-branding"]{background:var(--fc-primary, #0f172a);color:#fff;border-color:var(--fc-primary, #0f172a);}
          .wd-portfolio:has(#wd-pf-product:checked) label[for="wd-pf-product"]{background:var(--fc-primary, #0f172a);color:#fff;border-color:var(--fc-primary, #0f172a);}
          .wd-portfolio:has(#wd-pf-web:checked) label[for="wd-pf-web"]{background:var(--fc-primary, #0f172a);color:#fff;border-color:var(--fc-primary, #0f172a);}
          .wd-portfolio:has(#wd-pf-branding:checked) .wd-pf-item:not([data-cat="branding"]){display:none;}
          .wd-portfolio:has(#wd-pf-product:checked) .wd-pf-item:not([data-cat="product"]){display:none;}
          .wd-portfolio:has(#wd-pf-web:checked) .wd-pf-item:not([data-cat="web"]){display:none;}
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
        html: `<section class="block block-layout-bento">
          <div class="utility-2">
          <div class="utility-3"><div class="utility-4">Design system</div><div class="utility-5">Tokens, components, and docs in one place.</div></div>
          <div class="utility-6"><div class="utility-7">Ship faster</div></div>
          <div class="utility-8">Analytics</div>
          <div class="utility-9">Integrations</div>
          <div class="utility-10"><img src="https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&q=70" class="utility-11" alt="" /></div>
          <div class="utility-12">99.99% uptime</div>
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
        html: `<section class="block block-services-icons">
          <div class="utility-2">
          <h2 class="utility-3 block-heading">What we do</h2>
          <div class="utility-4">
          <div class="utility-5">
          <div class="utility-6">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z"/></svg>
          </div>
          <div class="utility-7">Strategy</div>
          <p class="utility-8">Positioning, research and roadmaps that align teams.</p>
          </div>
          <div class="utility-9">
          <div class="utility-10">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 4v6l4 2"/></svg>
          </div>
          <div class="utility-11">Design</div>
          <p class="utility-12">Interfaces and systems that feel effortless to use.</p>
          </div>
          <div class="utility-13">
          <div class="utility-14">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3L2 12l6 9M16 3l6 9-6 9"/></svg>
          </div>
          <div class="utility-15">Engineering</div>
          <p class="utility-16">Reliable, scalable builds shipped on schedule.</p>
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
        html: `<section class="block block-contact-recaptcha">
          <!-- reCAPTCHA: add <script src="https://www.google.com/recaptcha/api.js" async defer></script> to the page head and replace YOUR_SITE_KEY below -->
          <form class="utility-2">
          <h2 class="utility-3 block-heading">Get in touch</h2>
          <label class="utility-4">Name</label>
          <input required class="utility-5" />
          <label class="utility-6">Email</label>
          <input type="email" required class="utility-7" />
          <label class="utility-8">Message</label>
          <textarea required rows="4" class="utility-9"></textarea>
          <div data-sitekey="YOUR_SITE_KEY" class="g-recaptcha utility-10"></div>
          <button type="submit" class="utility-11">Send message</button>
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
        html: `<section class="block block-testimonials-carousel">
          <div class="utility-2">
          <h2 class="utility-3 block-heading">Loved by teams</h2>
          </div>
          <div class="utility-4">
          <div class="utility-5">
          <p class="utility-6">"This tool cut our build time in half."</p>
          <div class="utility-7">
          <img src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&q=75" class="utility-8" alt="" />
          <div><div class="utility-9">Jordan Lee</div><div class="utility-10">VP Design, Nova</div></div>
          </div>
          </div>
          <div class="utility-11">
          <p class="utility-12">"Support is fast and the product just works."</p>
          <div class="utility-13">
          <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=75" class="utility-14" alt="" />
          <div><div class="utility-15">Sam Okafor</div><div class="utility-16">Founder, Loop</div></div>
          </div>
          </div>
          <div class="utility-17">
          <p class="utility-18">"Our whole team switched in a week."</p>
          <div class="utility-19">
          <img src="https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&q=75" class="utility-20" alt="" />
          <div><div class="utility-21">Rae Kim</div><div class="utility-22">Head of Product, Fera</div></div>
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
        html: `<section class="block block-esports-roster">
          <div class="utility-2">
          <h2 class="utility-3 block-heading">Roster</h2>
          <p class="utility-4">Season 2026</p>
          <div class="utility-5">
          <div class="utility-6">
          <img src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&q=75" class="utility-7" alt="Viper" />
          <div class="utility-8"><div class="utility-9">Viper</div><div class="utility-10">IGL</div></div>
          </div>
          <div class="utility-11">
          <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=75" class="utility-12" alt="Ashen" />
          <div class="utility-13"><div class="utility-14">Ashen</div><div class="utility-15">Duelist</div></div>
          </div>
          <div class="utility-16">
          <img src="https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&q=75" class="utility-17" alt="Kudo" />
          <div class="utility-18"><div class="utility-19">Kudo</div><div class="utility-20">Support</div></div>
          </div>
          <div class="utility-21">
          <img src="https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=200&q=75" class="utility-22" alt="Frost" />
          <div class="utility-23"><div class="utility-24">Frost</div><div class="utility-25">Sentinel</div></div>
          </div>
          <div class="utility-26">
          <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=75" class="utility-27" alt="Ronin" />
          <div class="utility-28"><div class="utility-29">Ronin</div><div class="utility-30">Flex</div></div>
          </div>
          </div>
          </div>
        </section>`,
      },
      {
        id: "esports-bracket",
        label: "Esports · Tournament Bracket",
        html: `<section class="block block-esports-bracket">
          <div class="utility-2">
          <h2 class="utility-3 block-heading">Bracket</h2>
          <div class="utility-4">
          <div class="utility-5">
          <div class="utility-6">Quarterfinals</div>
          <div class="utility-7">
          <div class="utility-8">Alpha</div>
          <div class="utility-9">Ronin</div>
          </div>
          <div class="utility-10">
          <div class="utility-11">Nova</div>
          <div class="utility-12">Vertex</div>
          </div>
          <div class="utility-13">
          <div class="utility-14">Kaze</div>
          <div class="utility-15">Wraith</div>
          </div>
          <div class="utility-16">
          <div class="utility-17">Onyx</div>
          <div class="utility-18">Pulse</div>
          </div>
          </div>
          <div class="utility-19">
          <div class="utility-20">Semifinals</div>
          <div class="utility-21">
          <div class="utility-22">Alpha</div>
          <div class="utility-23">Vertex</div>
          </div>
          <div class="utility-24">
          <div class="utility-25">Kaze</div>
          <div class="utility-26">Onyx</div>
          </div>
          </div>
          <div class="utility-27">
          <div class="utility-28">Final</div>
          <div class="utility-29">
          <div class="utility-30">Alpha</div>
          <div class="utility-31">Kaze</div>
          </div>
          </div>
          </div>
          </div>
        </section>`,
      },
      {
        id: "esports-schedule",
        label: "Esports · Stream Schedule",
        html: `<section class="block block-esports-schedule">
          <div class="utility-2">
          <h2 class="utility-3 block-heading">Stream schedule</h2>
          <div class="utility-4">
          <div class="utility-5">
          <div class="utility-6">Mon</div>
          <div class="utility-7">7PM</div>
          <div class="utility-8">Ranked grind</div>
          </div>
          <div class="utility-9">
          <div class="utility-10">Tue</div>
          <div class="utility-11">Off</div>
          <div class="utility-12"></div>
          </div>
          <div class="utility-13">
          <div class="utility-14">Wed</div>
          <div class="utility-15">7PM</div>
          <div class="utility-16">Scrims</div>
          </div>
          <div class="utility-17">
          <div class="utility-18">Thu</div>
          <div class="utility-19">7PM</div>
          <div class="utility-20">Community night</div>
          </div>
          <div class="utility-21">
          <div class="utility-22">Fri</div>
          <div class="utility-23">8PM</div>
          <div class="utility-24">Tournament</div>
          </div>
          <div class="utility-25">
          <div class="utility-26">Sat</div>
          <div class="utility-27">2PM</div>
          <div class="utility-28">VOD review</div>
          </div>
          <div class="utility-29">
          <div class="utility-30">Sun</div>
          <div class="utility-31">Off</div>
          <div class="utility-32"></div>
          </div>
          </div>
          </div>
        </section>`,
      },
      {
        id: "esports-stats",
        label: "Esports · Player Stat Cards",
        html: `<section class="block block-esports-stats">
          <div class="utility-2">
          <h2 class="utility-3 block-heading">Player stats</h2>
          <div class="utility-4">
          <div class="utility-5">
          <div class="utility-6">Viper</div>
          <div class="utility-7"><span>K/D</span><span class="utility-8">1.34</span></div>
          <div class="utility-9"><span>Headshot %</span><span class="utility-10">78%</span></div>
          </div>
          <div class="utility-11">
          <div class="utility-12">Ashen</div>
          <div class="utility-13"><span>K/D</span><span class="utility-14">1.21</span></div>
          <div class="utility-15"><span>Headshot %</span><span class="utility-16">71%</span></div>
          </div>
          <div class="utility-17">
          <div class="utility-18">Kudo</div>
          <div class="utility-19"><span>K/D</span><span class="utility-20">0.98</span></div>
          <div class="utility-21"><span>Headshot %</span><span class="utility-22">65%</span></div>
          </div>
          <div class="utility-23">
          <div class="utility-24">Frost</div>
          <div class="utility-25"><span>K/D</span><span class="utility-26">1.08</span></div>
          <div class="utility-27"><span>Headshot %</span><span class="utility-28">69%</span></div>
          </div>
          </div>
          </div>
        </section>`,
      },
      {
        id: "esports-leaderboard",
        label: "Esports · Leaderboard",
        html: `<section class="block block-esports-leaderboard">
          <div class="utility-2">
          <h2 class="utility-3 block-heading">Leaderboard</h2>
          <div class="utility-4">
          <div class="utility-5">
          <div>#</div><div>Team</div><div>Wins</div><div>Points</div>
          </div>
          <div class="utility-6">
          <div class="utility-7">1</div>
          <div class="utility-8">Alpha Esports</div>
          <div class="utility-9">14</div>
          <div class="utility-10">842</div>
          </div>
          <div class="utility-11">
          <div class="utility-12">2</div>
          <div class="utility-13">Vertex GG</div>
          <div class="utility-14">12</div>
          <div class="utility-15">790</div>
          </div>
          <div class="utility-16">
          <div class="utility-17">3</div>
          <div class="utility-18">Kaze Nation</div>
          <div class="utility-19">11</div>
          <div class="utility-20">755</div>
          </div>
          <div class="utility-21">
          <div class="utility-22">4</div>
          <div class="utility-23">Onyx Squad</div>
          <div class="utility-24">9</div>
          <div class="utility-25">680</div>
          </div>
          <div class="utility-26">
          <div class="utility-27">5</div>
          <div class="utility-28">Pulse Collective</div>
          <div class="utility-29">8</div>
          <div class="utility-30">611</div>
          </div>
          </div>
          </div>
        </section>`,
      },
      {
        id: "esports-org-hub",
        label: "Esports · Organization Hub",
        html: `<section class="block block-esports-org-hub">
          <div class="utility-2">
          <div class="utility-3">
          <div>
          <h2 class="utility-4 block-heading">Alpha Esports</h2>
          <p class="utility-5">Competing across Valorant, CS2 and League — est. 2021. Follow the journey, catch the streams, join the community.</p>
          </div>
          <a href="#" class="utility-6">Join the community</a>
          </div>
          <div class="utility-7">
          <div class="utility-8">
          <div class="utility-9">2021</div>
          <div class="utility-10">Est.</div>
          </div>
          <div class="utility-11">
          <div class="utility-12">3 games</div>
          <div class="utility-13">Titles</div>
          </div>
          <div class="utility-14">
          <div class="utility-15">210K+</div>
          <div class="utility-16">Followers</div>
          </div>
          </div>
          <div class="utility-17">
          <div class="utility-18">Backed by</div>
          <div class="utility-19">
          <div class="utility-20">SPONSOR ONE</div><div class="utility-21">SPONSOR TWO</div><div class="utility-22">SPONSOR THREE</div><div class="utility-23">SPONSOR FOUR</div>
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
        html: `<section class="block block-creator-membership">
          <div class="utility-2">
          <h2 class="utility-3 block-heading">Support the channel</h2>
          <p class="utility-4">Pick a membership tier and unlock perks.</p>
          <div class="utility-5">
          <div class="utility-6">
          <div class="utility-7">Fan</div>
          <div class="utility-8">$5<span class="utility-9">/mo</span></div>
          <ul class="utility-10"><li>✓ Member badge</li><li>✓ Emotes</li><li>✓ Shoutouts</li></ul>
          <a href="#" class="utility-11">Join Fan</a>
          </div>
          <div class="utility-12">
          <div class="utility-13">Supporter</div>
          <div class="utility-14">$15<span class="utility-15">/mo</span></div>
          <ul class="utility-16"><li>✓ Everything in Fan</li><li>✓ Discord access</li><li>✓ Monthly Q&A</li></ul>
          <a href="#" class="utility-17">Join Supporter</a>
          </div>
          <div class="utility-18">
          <div class="utility-19">VIP</div>
          <div class="utility-20">$40<span class="utility-21">/mo</span></div>
          <ul class="utility-22"><li>✓ Everything in Supporter</li><li>✓ 1:1 game session</li><li>✓ Name in credits</li></ul>
          <a href="#" class="utility-23">Join VIP</a>
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
        html: `<section class="block block-retro-hitcounter" data-wd-hitcounter-root>
  <div class="utility-2">You are visitor number</div>
  <div class="utility-3" data-wd-hitcounter-digits>
    <span class="utility-4">0</span><span class="utility-5">0</span><span class="utility-6">0</span><span class="utility-7">0</span><span class="utility-8">0</span><span class="utility-9">0</span>
  </div>
  <div class="utility-10">counts visits to this page, stored in your browser — a modern stand-in for the server-side hit files 90s CGI counters used</div>
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
</section>`,
      },
      {
        id: "retro-guestbook",
        label: "Retro · Sign My Guestbook",
        html: `<section class="block block-retro-guestbook">
          <div class="utility-2">
          <h2 class="utility-3 block-heading">✦ Sign My Guestbook! ✦</h2>
          <p class="utility-4">Thanx for stopping by my page! Leave a message below ~*~</p>
          <form>
          <label class="utility-5">Your Name</label>
          <input class="utility-6" />
          <label class="utility-7">Message</label>
          <textarea rows="3" class="utility-8"></textarea>
          <button type="submit" class="utility-9">Sign It! →</button>
          </form>
          <div class="utility-10">
          <div class="utility-11">
          <span class="utility-12">xXsparkle_soulXx</span> <span class="utility-13">wrote:</span>
          <div class="utility-14">omg i love ur page!! the bg music is SO good 💜</div>
          </div>
          <div class="utility-15">
          <span class="utility-16">webmaster_99</span> <span class="utility-17">wrote:</span>
          <div class="utility-18">nice site, added you to my links page. webring pending approval.</div>
          </div>
          </div>
          </div>
        </section>`,
      },
      {
        id: "retro-webring",
        label: "Retro · Webring Navigator",
        html: `<section class="block block-retro-webring">
  <div class="utility-2">
    <a href="#" class="utility-3">← Prev Site</a>
    <div class="utility-4">
      <div class="utility-5">Member of the</div>
      <div class="utility-6">Indie Web Ring</div>
    </div>
    <a href="#" class="utility-7">🔀 Random</a>
    <a href="#" class="utility-8">Next Site →</a>
  </div>
</section>`,
      },
      {
        id: "retro-buttons88",
        label: "Retro · 88×31 Button Row",
        html: `<section class="block block-retro-buttons88">
  
  <div class="utility-2">BEST VIEWED
WITH EYES</div>
  <div class="utility-3">VALID
HTML5</div>
  <div class="utility-4">made with
CSS Grid</div>
  <div class="utility-5">100%
HUMAN MADE</div>
  <div class="utility-6">POWERED BY
COFFEE</div>
</section>`,
      },
      {
        id: "retro-top8",
        label: "Retro · Top 8 Friends",
        html: `<section class="block block-retro-top8">
          <div class="utility-2">
          <h2 class="utility-3 block-heading">Top Friends</h2>
          <p class="utility-4">view all →</p>
          <div class="utility-5">
          <a href="#" class="utility-6">
          <img src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&q=75" alt="Friend 1" class="utility-7" />
          <div class="utility-8">friend_1</div>
          </a>
          <a href="#" class="utility-9">
          <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=75" alt="Friend 2" class="utility-10" />
          <div class="utility-11">friend_2</div>
          </a>
          <a href="#" class="utility-12">
          <img src="https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&q=75" alt="Friend 3" class="utility-13" />
          <div class="utility-14">friend_3</div>
          </a>
          <a href="#" class="utility-15">
          <img src="https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=200&q=75" alt="Friend 4" class="utility-16" />
          <div class="utility-17">friend_4</div>
          </a>
          <a href="#" class="utility-18">
          <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=75" alt="Friend 5" class="utility-19" />
          <div class="utility-20">friend_5</div>
          </a>
          <a href="#" class="utility-21">
          <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=75" alt="Friend 6" class="utility-22" />
          <div class="utility-23">friend_6</div>
          </a>
          <a href="#" class="utility-24">
          <img src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&q=75" alt="Friend 7" class="utility-25" />
          <div class="utility-26">friend_7</div>
          </a>
          <a href="#" class="utility-27">
          <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=75" alt="Friend 8" class="utility-28" />
          <div class="utility-29">friend_8</div>
          </a>
          </div>
          </div>
        </section>`,
      },
      {
        id: "retro-eprops",
        label: "Retro · eProps & Blogroll",
        html: `<section class="block block-retro-eprops">
  <div class="utility-2">
    <div class="utility-3">Latest entry</div>
    <h3 class="utility-4">today was actually pretty good</h3>
    <p class="utility-5">nothing much happened but the weather was nice and I got bubble tea so 8/10 day tbh...</p>
    <div class="utility-6">
      <button class="utility-7">⭐ eProps (24)</button>
      <span class="utility-8">12 comments</span>
    </div>
  </div>
  <div>
    <div class="utility-9">My Blogrings</div>
    
    <div class="utility-10">◆ Poetry & Prose Ring</div>
    <div class="utility-11">◆ 2000s Nostalgia Crew</div>
    <div class="utility-12">◆ Bubble Tea Lovers</div>
    <div class="utility-13">◆ Late Night Thoughts</div>
  </div>
</section>`,
      },
      {
        id: "retro-construction",
        label: "Retro · Under Construction",
        html: `<section class="block block-retro-construction">
  <div class="utility-2">
    🚧 PAGE UNDER CONSTRUCTION 🚧<br />
    <span class="utility-3">check back soon — always more to add!</span>
  </div>
</section>`,
      },
      {
        id: "retro-divider",
        label: "Retro · Rainbow Glitter Divider",
        html: `<section class="block block-retro-divider">
  <div class="utility-2"></div>
  <div class="utility-3">✧･ﾟ: *✧･ﾟ:* thanks for visiting *:･ﾟ✧*:･ﾟ✧</div>
  <style>@keyframes wd-rainbow-shift{0%{background-position:0% 50%}100%{background-position:200% 50%}}</style>
</section>`,
      },
      {
        id: "retro-musicplayer",
        label: "Retro · Now Playing Bar",
        html: `<section class="block block-retro-musicplayer">
  <div class="utility-2">
    <div class="utility-3"></div>
    <div>
      <div class="utility-4">♪ now playing</div>
      <div class="utility-5">profile-anthem.mp3</div>
    </div>
    <audio controls class="utility-6"></audio>
  </div>
</section>`,
      },
      {
        // 1998–2001 Geocities/Angelfire era: pages advertised which browser
        // to view them in since rendering varied wildly. Refactored with
        // flex-wrap so the row reflows on narrow screens instead of
        // overflowing, the one thing the original fixed-width table version
        // never had to handle.
        id: "retro-browserbadges",
        label: "Retro · Browser Badges",
        html: `<section class="block block-retro-browserbadges">
  <div class="utility-2">Best viewed in<br/>Netscape Navigator 4.0</div>
  <div class="utility-3">Optimized for<br/>Internet Explorer 5+</div>
  <div class="utility-4">800×600<br/>resolution</div>
</section>`,
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
        html: `<section class="block block-retro-web2badge">
  <div class="utility-2">
    <div class="utility-3"></div>
    <span class="utility-4">myStartup</span>
    <span class="utility-5">beta</span>
  </div>
</section>`,
      },
      {
        // 2003–2007: AIM/LiveJournal-style "who's online" buddy list —
        // presence dots were the social proof of the era, before read
        // receipts and "last active" timestamps existed.
        id: "retro-buddyicons",
        label: "Retro · Buddy List",
        html: `<section class="block block-retro-buddyicons">
  <div class="utility-2">Buddy List — 6 online</div>
  <div class="utility-3">
    <div class="utility-4">
      <img src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&q=75" alt="" class="utility-5" />
      <span class="utility-6"></span>
    </div><div class="utility-7">
      <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=75" alt="" class="utility-8" />
      <span class="utility-9"></span>
    </div><div class="utility-10">
      <img src="https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&q=75" alt="" class="utility-11" />
      <span class="utility-12"></span>
    </div><div class="utility-13">
      <img src="https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=200&q=75" alt="" class="utility-14" />
      <span class="utility-15"></span>
    </div><div class="utility-16">
      <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=75" alt="" class="utility-17" />
      <span class="utility-18"></span>
    </div><div class="utility-19">
      <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=75" alt="" class="utility-20" />
      <span class="utility-21"></span>
    </div>
  </div>
</section>`,
      },
      {
        // 2003–2008: the Xanga/Neopets "shoutbox" — a lightweight public
        // comment strip bolted onto the sidebar, distinct from a full
        // guestbook (which this category already has) by being short,
        // rapid-fire, and displayed inline rather than on its own page.
        id: "retro-shoutbox",
        label: "Retro · Shout Box",
        html: `<section class="block block-retro-shoutbox">
  <div class="utility-2">💬 Shout Box</div>
  <div class="utility-3">
    <div class="utility-4"><b class="utility-5">xXcoolkidXx:</b> omg i love ur layout!!</div>
    <div class="utility-6"><b class="utility-7">sk8ergrl:</b> add me back ✨</div>
  </div>
  <div class="utility-8">
    <input placeholder="leave a shout..." class="utility-9" />
    <button class="utility-10">Post</button>
  </div>
</section>`,
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
        html: `<section class="block block-retro-sparkletrail" data-wd-sparkletrail-root>
  <div class="utility-2">✨ Move your mouse here for a sparkle trail ✨</div>
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
</section>`,
      },
      {
        // 1999–2003: the auto-playing MIDI background-music embed —
        // refactored into a native <audio controls> (no autoplay, so it
        // doesn't ambush visitors the way <bgsound>/embedded MIDI did)
        // styled to look like an old OS media-player chrome.
        id: "retro-midiplayer",
        label: "Retro · MIDI Player",
        html: `<section class="block block-retro-midiplayer">
  <div class="utility-2">
    <div class="utility-3"></div>
  </div>
  <div>
    <div class="utility-4">♫ background_theme.mid</div>
    <audio controls class="utility-5"></audio>
  </div>
</section>`,
      },
      {
        id: "retro-awaymessage",
        label: "Retro · AIM Away Message",
        html: `<section class="block block-retro-awaymessage">
  <div class="utility-2">
    <span>xXsk8rgrl02Xx — Away Message</span>
    <span class="utility-3">✕</span>
  </div>
  <div class="utility-4">
    <div class="utility-5"><strong>I'm away from my computer right now.</strong></div>
    <div class="utility-6">"in class, txt my cell &lt;3 back in an hour probably"</div>
    <div class="utility-7">Auto-response sent at 2:14 PM</div>
  </div>
</section>`,
      },
      {
        id: "retro-poll",
        label: "Retro · Poll Widget",
        html: `<section class="block block-retro-poll">
  <div class="utility-2">⭐ Poll of the Week ⭐</div>
  <div class="utility-3">What should the next site layout be?</div>
  
  <label class="utility-4">
    <input type="radio" name="wd-poll" checked />
    <span>Sparkly & pink</span>
  </label>
  <label class="utility-5">
    <input type="radio" name="wd-poll"  />
    <span>Dark & moody</span>
  </label>
  <label class="utility-6">
    <input type="radio" name="wd-poll"  />
    <span>Rainbow chaos</span>
  </label>
  <label class="utility-7">
    <input type="radio" name="wd-poll"  />
    <span>Keep this one</span>
  </label>
  <button class="utility-8">Vote!</button>
  <div class="utility-9">1,204 votes so far</div>
</section>`,
      },
      {
        id: "retro-petadopt",
        label: "Retro · Pet Adoption Badge",
        html: `<section class="block block-retro-petadopt">
  <div class="utility-2"></div>
  <div>
    <div class="utility-3">You adopted Sprinkle!</div>
    <div class="utility-4">Level 3 Cloud Puff · Fed 2 hrs ago</div>
    <a href="#" class="utility-5">Visit my pet →</a>
  </div>
</section>`,
      },
      {
        id: "retro-forumheader",
        label: "Retro · Forum Header",
        html: `<section class="block block-retro-forumheader">
          <div class="utility-2">
          <div class="utility-3">FieldworkForums.net</div>
          <div class="utility-4">the only forum you will ever need, established 2003</div>
          </div>
          <div class="utility-5">Forum Index &raquo; General Discussion &raquo; <strong>Thread Title Goes Here</strong></div>
        </section>`,
      },
      {
        id: "retro-forumpost",
        label: "Retro · Forum Post",
        html: `<section class="block block-retro-forumpost">
  <div class="utility-2">
    <div class="utility-3"></div>
    <div class="utility-4">forumveteran99</div>
    <div class="utility-5">Senior Member</div>
    <div class="utility-6">Joined: Mar 2004<br>Posts: 3,204</div>
  </div>
  <div class="utility-7">
    <div class="utility-8"><span>Posted: Today, 9:14 AM</span><span>Post #1 <a href="#" class="utility-9">Quote</a></span></div>
    <div class="utility-10">Type the post content here. Duplicate this block to build out a full thread.</div>
    <div class="utility-11">Signature line goes here</div>
  </div>
</section>`,
      },
      {
        id: "retro-forumreply",
        label: "Retro · Forum Reply Box",
        html: `<section class="block block-retro-forumreply" data-forge-comments>
          <div class="utility-2">
          <h3 class="utility-3">Comments (<span data-forge-comment-count>0</span>)</h3>
          <div data-forge-comment-list></div>
          <form data-forge-comment-form class="utility-4">
          <input name="name" placeholder="Your name" required class="utility-5">
          <textarea name="text" placeholder="Say something..." required rows="3" class="utility-6"></textarea>
          <button type="submit" class="utility-7">Post Comment</button>
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
        html: `<section class="block block-parallax-hero-fullbleed">
          <div class="utility-2">
          <div class="utility-3">Est. 2026</div>
          <h1 class="utility-4 block-heading">Where ambition meets altitude.</h1>
          <p class="utility-5">A full-bleed statement hero — the background stays fixed while your content scrolls over it.</p>
          <button class="utility-6">Explore</button>
          </div>
        </section>`,
      },
      {
        id: "parallax-hero-split",
        label: "Parallax Hero · Split Content",
        html: `<section class="block block-parallax-hero-split">
          <div class="utility-2">
          <h1 class="utility-3 block-heading">Grown, not manufactured.</h1>
          <p class="utility-4">Content sits in a legible band on the left; the parallax background carries the mood on the right.</p>
          <div class="utility-5">
          <button class="utility-6">Get started</button>
          <button class="utility-7">Learn more</button>
          </div>
          </div>
        </section>`,
      },
      {
        id: "parallax-section-quote",
        label: "Parallax Section · Big Quote",
        html: `<section class="block block-parallax-section-quote">
          <div class="utility-2">
          <div class="utility-3">"</div>
          <p class="utility-4">The best interfaces disappear — you stop noticing the tool and start noticing the work.</p>
          <div class="utility-5">
          <img src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200&q=75" alt="" class="utility-6" />
          <div class="utility-7">
          <div class="utility-8">Nadia Osei</div>
          <div class="utility-9">Creative Director, Tidewater</div>
          </div>
          </div>
          </div>
        </section>`,
      },
      {
        id: "parallax-section-stats",
        label: "Parallax Section · Stats Band",
        html: `<section class="block block-parallax-section-stats">
          <div class="utility-2">
          <div>
          <div class="utility-3">14k+</div>
          <div class="utility-4">Sites shipped</div>
          </div>
          <div>
          <div class="utility-5">99.9%</div>
          <div class="utility-6">Uptime</div>
          </div>
          <div>
          <div class="utility-7">38</div>
          <div class="utility-8">Countries</div>
          </div>
          <div>
          <div class="utility-9">4.9★</div>
          <div class="utility-10">Average rating</div>
          </div>
          </div>
        </section>`,
      },
      {
        id: "parallax-section-cta",
        label: "Parallax Section · CTA Banner",
        html: `<section class="block block-parallax-section-cta">
          <h2 class="utility-2 block-heading">Ready when the skyline is.</h2>
          <p class="utility-3">Start free — upgrade only once you're ready to publish.</p>
          <button class="utility-4">Start building free</button>
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
        html: `<section class="block block-social-wall-columns" data-forge-widget="social-wall" data-forge-project-id="" data-wd-cat="social" data-wd-block="social-wall">
          <div class="container-heading">
          <div class="utility-3">Live from social</div>
          <h2 class="utility-4 block-heading">What people are saying</h2>
          </div>
          <div class="social-wall">
          <div class="col-1">
          <div class="utility-7">
          <div class="utility-8">
          <span class="utility-9">𝕏</span>
          <span class="utility-10">Twitter / X</span>
          </div>
          <span data-forge-connect="twitter" class="utility-11">Not connected</span>
          </div>
          <div data-forge-cards class="utility-12">
          <div class="utility-13">
          <div class="utility-14">
          <span class="utility-15">Web Dojo</span>
          <span class="utility-16">2h</span>
          </div>
          <div class="utility-17">@webdojo_hq</div>
          <p class="utility-18">Just shipped dark mode across every export. Thanks for the 200+ bug reports that got us here 🙏</p>
          <div class="utility-19">💬 12   🔁 34   ♥ 156</div>
          </div>
          <div class="utility-20">
          <div class="utility-21">
          <span class="utility-22">Sam Reyes</span>
          <span class="utility-23">5h</span>
          </div>
          <div class="utility-24">@designer_sam</div>
          <p class="utility-25">Client sent over "make it pop" for the fourth time today. I have achieved zen.</p>
          <div class="utility-26">💬 8   🔁 3   ♥ 91</div>
          </div>
          <div class="utility-27">
          <div class="utility-28">
          <span class="utility-29">Kai Nakamura</span>
          <span class="utility-30">1d</span>
          </div>
          <div class="utility-31">@buildwithkai</div>
          <p class="utility-32">Hot take: the best websites still load in under a second. Fight me.</p>
          <div class="utility-33">💬 41   🔁 12   ♥ 203</div>
          </div>
          </div>
          </div>
          <div class="col-2">
          <div class="utility-35">
          <div class="utility-36">
          <span class="utility-37">📷</span>
          <span class="utility-38">Instagram</span>
          </div>
          <span data-forge-connect="instagram" class="utility-39">Not connected</span>
          </div>
          <div data-forge-cards class="utility-40">
          <div class="utility-41">
          <div class="utility-42">
          <span class="utility-43">studio.northlane</span>
          <span class="utility-44">3h</span>
          </div>
          <div class="utility-45">Studio Northlane</div>
          <p class="utility-46">Behind the scenes from today's shoot 🎬</p>
          <div class="utility-47">♥ 412   💬 18</div>
          </div>
          <div class="utility-48">
          <div class="utility-49">
          <span class="utility-50">mira.codes</span>
          <span class="utility-51">6h</span>
          </div>
          <div class="utility-52">Mira Chen</div>
          <p class="utility-53">New desk setup, finally organized after 6 months 📐</p>
          <div class="utility-54">♥ 289   💬 24</div>
          </div>
          <div class="utility-55">
          <div class="utility-56">
          <span class="utility-57">thefolio.club</span>
          <span class="utility-58">1d</span>
          </div>
          <div class="utility-59">The Folio Club</div>
          <p class="utility-60">Portfolio review night was a hit — thank you to everyone who came out.</p>
          <div class="utility-61">♥ 567   💬 41</div>
          </div>
          </div>
          </div>
          <div class="col-3">
          <div class="utility-63">
          <div class="utility-64">
          <span class="utility-65">f</span>
          <span class="utility-66">Facebook</span>
          </div>
          <span data-forge-connect="facebook" class="utility-67">Not connected</span>
          </div>
          <div data-forge-cards class="utility-68">
          <div class="utility-69">
          <div class="utility-70">
          <span class="utility-71">Riverside Coffee Co.</span>
          <span class="utility-72">4h</span>
          </div>
          <div class="utility-73">Riverside Coffee Co.</div>
          <p class="utility-74">We're extending our weekend hours starting this Saturday! Come say hi ☕</p>
          <div class="utility-75">♥ 89   💬 12   ↗ 6</div>
          </div>
          <div class="utility-76">
          <div class="utility-77">
          <span class="utility-78">Northgate Studio</span>
          <span class="utility-79">8h</span>
          </div>
          <div class="utility-80">Northgate Studio</div>
          <p class="utility-81">Our new client showcase is live on the site — link in comments.</p>
          <div class="utility-82">♥ 134   💬 22   ↗ 9</div>
          </div>
          <div class="utility-83">
          <div class="utility-84">
          <span class="utility-85">The Local Market</span>
          <span class="utility-86">2d</span>
          </div>
          <div class="utility-87">The Local Market</div>
          <p class="utility-88">Thank you for another incredible farmers market season 🌽</p>
          <div class="utility-89">♥ 210   💬 31   ↗ 14</div>
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
        html: `<section class="block block-comments-section" data-forge-comments>
          <div class="utility-2">
          <h3 class="utility-3">Comments (<span data-forge-comment-count>0</span>)</h3>
          <div data-forge-comment-list></div>
          <form data-forge-comment-form class="utility-4">
          <input name="name" placeholder="Your name" required class="utility-5">
          <textarea name="text" placeholder="Say something..." required rows="3" class="utility-6"></textarea>
          <button type="submit" class="utility-7">Post Comment</button>
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
        html: `<section class="block block-zenero-updates-block" data-forge-widget="updates" data-forge-project-id="">
          <div class="utility-2">
          <div class="utility-3">What's new</div>
          <h2 class="utility-4 block-heading">Latest Updates</h2>
          <div data-forge-updates-list class="utility-5">
          <div class="utility-6">
          <div class="utility-7">2 days ago</div>
          <div class="utility-8">Welcome to our new site</div>
          <div class="utility-9">We're excited to launch. Check back for regular updates.</div>
          </div>
          <div class="utility-10">
          <div class="utility-11">1 week ago</div>
          <div class="utility-12">New features coming soon</div>
          <div class="utility-13">We're working on something special. Stay tuned.</div>
          </div>
          <div class="utility-14">
          <div class="utility-15">2 weeks ago</div>
          <div class="utility-16">Community milestone</div>
          <div class="utility-17">Thank you to everyone who's been part of this journey.</div>
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
        html: `<section class="block block-zenero-gallery-block" data-forge-widget="gallery" data-forge-project-id="">
          <div class="utility-2">
          <div class="utility-3">Our work</div>
          <h2 class="utility-4 block-heading">Gallery</h2>
          <div data-forge-gallery-grid class="utility-5 container gallery-block">
          <img src="https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&q=70" alt="Gallery item" class="utility-6" /><img src="https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&q=70" alt="Gallery item" class="utility-7" /><img src="https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=800&q=70" alt="Gallery item" class="utility-8" /><img src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=70" alt="Gallery item" class="utility-9" /><img src="https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800&q=70" alt="Gallery item" class="utility-10" /><img src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=70" alt="Gallery item" class="utility-11" />
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
        html: `<section class="block block-zenero-latest-from-blog" data-forge-widget="latest-blog" data-forge-project-id="">
          <div class="utility-2">
          <div class="utility-3">From the blog</div>
          <h2 class="utility-4 block-heading">Latest from Blog</h2>
          <div data-forge-blog-titles class="utility-5">
          <button class="utility-6">Getting Started with Web Dojo</button>
          <button class="utility-7">Design Tips for Better Landing Pages</button>
          <button class="utility-8">Why Static Sites Still Win</button>
          </div>
          <div data-forge-blog-excerpt class="utility-9"></div>
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
        html: `<section class="block block-zenero-portfolio-timeline" data-forge-widget="portfolio" data-forge-project-id="">
          <div class="utility-2">
          <div class="utility-3">Selected work</div>
          <h2 class="utility-4 block-heading">Portfolio</h2>
          <div data-forge-portfolio-timeline class="utility-5">
          <div class="utility-6">
          <div class="utility-7"></div>
          <div class="utility-8">2024</div>
          <div class="utility-9">Project Alpha</div>
          <div class="utility-10">A flagship web experience.</div>
          </div>
          <div class="utility-11">
          <div class="utility-12"></div>
          <div class="utility-13">2023</div>
          <div class="utility-14">Project Beta</div>
          <div class="utility-15">A mobile-first redesign.</div>
          </div>
          <div class="utility-16">
          <div class="utility-17"></div>
          <div class="utility-18">2022</div>
          <div class="utility-19">Project Gamma</div>
          <div class="utility-20">An e-commerce buildout.</div>
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
        html: `<section class="block block-zenero-testimonials-from-comments" data-forge-widget="testimonials" data-forge-project-id="" data-forge-platform="facebook" data-forge-post-id="">
          <div class="utility-2">
          <div class="utility-3">What people say</div>
          <h2 class="utility-4 block-heading">Testimonials</h2>
          <div data-forge-testimonials-list class="utility-5">
          <div class="utility-6">
          <div class="utility-7">"This product changed how we work. Highly recommended."</div>
          <div class="utility-8">— Sarah M.</div>
          </div>
          <div class="utility-9">
          <div class="utility-10">"Incredible support and a beautiful product."</div>
          <div class="utility-11">— James K.</div>
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
        html: `<section class="block block-zenero-timeline-block" data-forge-widget="timeline" data-forge-project-id="">
          <div class="utility-2">
          <div class="utility-3">Our story</div>
          <h2 class="utility-4 block-heading">Timeline</h2>
          <div data-forge-timeline-list class="utility-5">
          <div class="utility-6">
          <div class="utility-7"></div>
          <div class="utility-8">2024</div>
          <div class="utility-9">Founded</div>
          <div class="utility-10">Started the company.</div>
          </div>
          <div class="utility-11">
          <div class="utility-12"></div>
          <div class="utility-13">2025</div>
          <div class="utility-14">Launched</div>
          <div class="utility-15">Shipped the first release.</div>
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
        html: `<section class="block block-zenero-bento-block" data-forge-widget="bento" data-forge-project-id="">
          <div class="utility-2">
          <div class="utility-3">Why us</div>
          <h2 class="utility-4 block-heading">Features</h2>
          <div data-forge-bento-grid class="utility-5">
          <div class="utility-6">
          <div class="utility-7">🚀</div>
          <div class="utility-8">Fast</div>
          <div class="utility-9">Loads in under a second.</div>
          </div>
          <div class="utility-10">
          <div class="utility-11">🔒</div>
          <div class="utility-12">Secure</div>
          <div class="utility-13">Built with best practices.</div>
          </div>
          <div class="utility-14">
          <div class="utility-15">🎨</div>
          <div class="utility-16">Beautiful</div>
          <div class="utility-17">Designed to stand out.</div>
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
        html: `<section class="block block-zenero-esports-roster-live" data-forge-widget="roster" data-forge-project-id="">
          <div class="utility-2">
          <h2 class="utility-3 block-heading">Roster</h2>
          <div data-forge-roster-grid class="utility-4">
          <div class="utility-5">
          <div class="utility-6">Add players in the Zenero dashboard</div>
          <div class="utility-7">No roster yet</div>
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
        html: `<section class="block block-zenero-esports-fixtures-live" data-forge-widget="fixtures" data-forge-project-id="">
          <div class="utility-2">
          <h2 class="utility-3 block-heading">Fixtures</h2>
          <div data-forge-fixtures-list class="utility-4">
          <div class="utility-5">Add fixtures in the Zenero dashboard.</div>
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
        html: `<section class="block block-zenero-esports-org-stats-live" data-forge-widget="org-stats" data-forge-project-id="">
          <div data-forge-org-stats-row class="utility-2">
          <div class="utility-3">Add stats in the Zenero dashboard.</div>
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
      {
        id: "dashboard-login",
        label: "Dashboard Login",
        html: `<section class="block block-zenero-dashboard-login" data-forge-widget="dashboard-login" data-forge-project-id="">
          <div class="utility-2">
          <div class="utility-3">Members area</div>
          <h2 class="utility-4 block-heading">Dashboard Login</h2>
          <div data-forge-dashboard-root class="utility-5">
          <div class="utility-6">
          <button data-forge-dashboard-tab="customer" class="utility-7">Customer Login</button>
          <button data-forge-dashboard-tab="owner" class="utility-8">Owner Login</button>
          </div>
          <div data-forge-dashboard-panel class="utility-9"></div>
          </div>
          </div>
          <script type="application/json" data-forge-dashboard-copy>{"ownerWelcome":"Welcome back — here's what's live on your site.","emptyText":"Nothing published yet. Add content from the Builder's Zenero dashboard.","sections":{"updates":"Updates","blog":"From the Blog","bento":"Highlights","timeline":"Timeline","social":"Social Wall"}}</script>
          <script data-forge-js="dashboard-login.js">(function(){
          function esc(s){var d=document.createElement("div");d.textContent=s==null?"":String(s);return d.innerHTML;}
          function initWidget(root){
          root.setAttribute("data-forge-dashboard-login-init","1");
          var pid=root.getAttribute("data-forge-project-id")||window.__WD_PROJECT_ID||"";
          if(!pid) return;
          var panel=root.querySelector("[data-forge-dashboard-panel]");
          var tabs=root.querySelectorAll("[data-forge-dashboard-tab]");
          if(!panel) return;
          var ownerKey="wd_owner_token_"+pid;
          var custKey="wd_customer_token_"+pid;
          var mode="customer";
          var fieldStyle="display:block;width:100%;padding:10px 12px;margin-bottom:10px;border:1px solid var(--fc-border, #e2e8f0);border-radius:6px;font-size:14px;box-sizing:border-box;";
          var btnStyle="width:100%;padding:10px;border:0;border-radius:6px;background:var(--fc-primary, #0f172a);color:#fff;font-size:14px;font-weight:600;cursor:pointer;";
          function setMode(m){
          mode=m;
          for(var i=0;i<tabs.length;i++){
          var t=tabs[i];
          t.style.opacity=t.getAttribute("data-forge-dashboard-tab")===m?"1":"0.55";
          }
          render();
          }
          function customerDashboard(email,token){
          panel.innerHTML='<div style="font-size:14px;color:var(--fc-text, #0f172a);margin-bottom:14px;">Welcome back, '+esc(email)+'.</div>'
          +'<div data-forge-cust-orders style="font-size:13px;color:var(--fc-muted, #94a3b8);">Loading your orders…</div>'
          +'<button data-forge-logout style="margin-top:16px;background:none;border:1px solid var(--fc-border, #e2e8f0);border-radius:6px;padding:8px 14px;font-size:13px;cursor:pointer;">Log out</button>';
          panel.querySelector("[data-forge-logout]").addEventListener("click",function(){
          try{localStorage.removeItem(custKey);}catch(e){}
          render();
          });
          var box=panel.querySelector("[data-forge-cust-orders]");
          fetch("/api/"+pid+"/site-auth/orders",{headers:{Authorization:"Bearer "+token}})
          .then(function(r){return r.ok?r.json():{orders:[]};})
          .then(function(data){
          var orders=data.orders||[];
          if(!orders.length){box.innerHTML='<p style="font-size:13px;color:var(--fc-muted, #94a3b8);">No orders yet.</p>';return;}
          box.innerHTML='<h4 style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--fc-muted, #64748b);margin:0 0 8px;">Your orders</h4>'
          +'<div style="display:flex;flex-direction:column;gap:8px;">'+orders.map(function(o){
          var amount=((o.amount_total||0)/100).toFixed(2);
          var items=(o.line_items||[]).map(function(li){return li.name+(li.quantity>1?" x"+li.quantity:"");}).join(", ");
          return '<div style="border:1px solid var(--fc-border, #e2e8f0);border-radius:8px;padding:10px 12px;">'
          +'<div style="font-size:13px;font-weight:600;color:var(--fc-text, #0f172a);">'+esc((o.currency||"usd").toUpperCase()+" "+amount)+'</div>'
          +'<div style="font-size:11px;color:var(--fc-muted, #94a3b8);margin:2px 0 4px;">'+esc((o.created_at||"").slice(0,10))+' · '+esc(o.fulfillment_status||o.status||"")+'</div>'
          +(items?'<div style="font-size:12px;color:var(--fc-text, #334155);">'+esc(items)+'</div>':'')
          +'</div>';
          }).join("")+'</div>';
          })
          .catch(function(){box.innerHTML='';});
          }
          function ownerForm(){
          panel.innerHTML='<form data-forge-owner-form>'
          +'<input data-forge-owner-pw type="password" placeholder="Dashboard password" required style="'+fieldStyle+'">'
          +'<button type="submit" style="'+btnStyle+'">Unlock owner dashboard</button>'
          +'<div data-forge-owner-error style="margin-top:8px;font-size:13px;color:#dc2626;"></div>'
          +'</form>';
          var form=panel.querySelector("[data-forge-owner-form]");
          form.addEventListener("submit",function(ev){
          ev.preventDefault();
          var pw=panel.querySelector("[data-forge-owner-pw]").value;
          var err=panel.querySelector("[data-forge-owner-error]");
          err.textContent="";
          fetch("/api/dashboard/"+pid+"/unlock",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password:pw})})
          .then(function(r){
          if(r.ok) return r.json().then(function(data){return{ok:true,data:data};});
          return r.json().catch(function(){return{};}).then(function(body){return{ok:false,status:r.status,detail:(body&&body.detail)||""};});
          })
          .then(function(res){
          if(res.ok){
          try{localStorage.setItem(ownerKey,res.data.token);}catch(e){}
          render();
          return;
          }
          if(res.status===401 && /not set/i.test(res.detail||"")){
          ownerSetupForm(pw);
          return;
          }
          err.textContent="Incorrect password.";
          })
          .catch(function(){err.textContent="Incorrect password.";});
          });
          }
          function ownerSetupForm(prefillPw){
          panel.innerHTML='<div style="font-size:13px;color:var(--fc-muted, #64748b);margin-bottom:10px;">No dashboard password has been set yet. Choose one now — this becomes the owner password for this site.</div>'
          +'<form data-forge-owner-setup-form>'
          +'<input data-forge-owner-setup-pw type="password" placeholder="Choose a dashboard password (6+ characters)" required minlength="6" value="'+esc(prefillPw||"")+'" style="'+fieldStyle+'">'
          +'<button type="submit" style="'+btnStyle+'">Set owner password</button>'
          +'<button type="button" data-forge-owner-setup-cancel style="width:100%;margin-top:8px;padding:8px;border:0;background:none;font-size:13px;color:var(--fc-muted, #64748b);cursor:pointer;text-decoration:underline;">Back</button>'
          +'<div data-forge-owner-setup-error style="margin-top:8px;font-size:13px;color:#dc2626;"></div>'
          +'</form>';
          panel.querySelector("[data-forge-owner-setup-cancel]").addEventListener("click",function(){ownerForm();});
          var form=panel.querySelector("[data-forge-owner-setup-form]");
          form.addEventListener("submit",function(ev){
          ev.preventDefault();
          var pw=panel.querySelector("[data-forge-owner-setup-pw]").value;
          var err=panel.querySelector("[data-forge-owner-setup-error]");
          err.textContent="";
          fetch("/api/dashboard/"+pid+"/set-password",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password:pw})})
          .then(function(r){if(!r.ok)throw new Error();return fetch("/api/dashboard/"+pid+"/unlock",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password:pw})});})
          .then(function(r){if(!r.ok)throw new Error();return r.json();})
          .then(function(data){
          try{localStorage.setItem(ownerKey,data.token);}catch(e){}
          render();
          })
          .catch(function(){err.textContent="Could not set the password — try again.";});
          });
          }
          function getCopy(){
          var el=root.querySelector("[data-forge-dashboard-copy]");
          var defaults={ownerWelcome:"Welcome back — here's what's live on your site.",emptyText:"Nothing published yet.",sections:{updates:"Updates",blog:"From the Blog",bento:"Highlights",timeline:"Timeline",social:"Social Wall"}};
          try{
          var parsed=JSON.parse(el?el.textContent:"{}");
          return {
          ownerWelcome: parsed.ownerWelcome || defaults.ownerWelcome,
          emptyText: parsed.emptyText || defaults.emptyText,
          sections: Object.assign({}, defaults.sections, parsed.sections || {}),
          };
          }catch(e){return defaults;}
          }
          function ownerDashboard(){
          var copy=getCopy();
          panel.innerHTML='<div style="font-size:14px;color:var(--fc-text, #0f172a);margin-bottom:14px;">'+esc(copy.ownerWelcome)+'</div>'
          +'<div data-forge-dash-sections></div>'
          +'<button data-forge-logout style="margin-top:16px;background:none;border:1px solid var(--fc-border, #e2e8f0);border-radius:6px;padding:8px 14px;font-size:13px;cursor:pointer;">Log out</button>';
          panel.querySelector("[data-forge-logout]").addEventListener("click",function(){
          try{localStorage.removeItem(ownerKey);}catch(e){}
          render();
          });
          var container=panel.querySelector("[data-forge-dash-sections]");
          function card(title,meta,body){
          return '<div style="border:1px solid var(--fc-border, #e2e8f0);border-radius:8px;padding:10px 12px;">'
          +'<div style="font-size:13px;font-weight:600;color:var(--fc-text, #0f172a);">'+esc(title)+'</div>'
          +(meta?'<div style="font-size:11px;color:var(--fc-muted, #94a3b8);margin:2px 0 4px;">'+esc(meta)+'</div>':'')
          +(body?'<div style="font-size:12px;color:var(--fc-text, #334155);">'+esc(body)+'</div>':'')
          +'</div>';
          }
          function section(key,items,renderItem){
          if(!items||!items.length) return;
          var box=document.createElement("div");
          box.style.cssText="margin-bottom:18px;";
          box.innerHTML='<h4 style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:var(--fc-muted, #64748b);margin:0 0 8px;">'+esc(copy.sections[key])+'</h4>'
          +'<div style="display:flex;flex-direction:column;gap:8px;">'+items.map(renderItem).join("")+'</div>';
          container.appendChild(box);
          }
          var getJson=function(path,fallback){
          return fetch("/api/"+pid+path).then(function(r){return r.ok?r.json():fallback;}).catch(function(){return fallback;});
          };
          Promise.all([
          getJson("/updates",{updates:[]}),
          getJson("/blog_posts",{blog_posts:[]}),
          getJson("/bento_tiles",{bento_tiles:[]}),
          getJson("/timeline_entries",{timeline_entries:[]}),
          getJson("/social-feed",{posts:[]}),
          ]).then(function(res){
          section("updates",(res[0].updates||[]).slice(0,5),function(u){return card(u.title,u.timestamp,u.content);});
          section("blog",(res[1].blog_posts||[]).slice(0,5),function(b){return card(b.title,"",b.excerpt);});
          section("bento",(res[2].bento_tiles||[]).slice(0,6),function(b){return card((b.icon?b.icon+" ":"")+b.title,"",b.description);});
          section("timeline",(res[3].timeline_entries||[]).slice(0,5),function(t){return card(t.title,t.date,t.description);});
          section("social",(res[4].posts||[]).slice(0,5),function(p){return card(p.author||p.platform,p.timestamp,p.content);});
          if(!container.children.length){
          container.innerHTML='<p style="font-size:13px;color:var(--fc-muted, #94a3b8);">'+esc(copy.emptyText)+'</p>';
          }
          });
          }
          function customerForm(signup){
          panel.innerHTML='<form data-forge-customer-form>'
          +'<input data-forge-customer-email type="email" placeholder="Email" required style="'+fieldStyle+'">'
          +'<input data-forge-customer-pw type="password" placeholder="Password" required style="'+fieldStyle+'">'
          +'<button type="submit" style="'+btnStyle+'">'+(signup?"Sign up":"Log in")+'</button>'
          +'<button type="button" data-forge-customer-toggle style="width:100%;margin-top:8px;padding:8px;border:0;background:none;font-size:13px;color:var(--fc-muted, #64748b);cursor:pointer;text-decoration:underline;">'+(signup?"Already have an account? Log in":"Need an account? Sign up")+'</button>'
          +'<div data-forge-customer-error style="margin-top:8px;font-size:13px;color:#dc2626;"></div>'
          +'</form>';
          var form=panel.querySelector("[data-forge-customer-form]");
          panel.querySelector("[data-forge-customer-toggle]").addEventListener("click",function(){customerForm(!signup);});
          form.addEventListener("submit",function(ev){
          ev.preventDefault();
          var email=panel.querySelector("[data-forge-customer-email]").value;
          var pw=panel.querySelector("[data-forge-customer-pw]").value;
          var err=panel.querySelector("[data-forge-customer-error]");
          err.textContent="";
          fetch("/api/"+pid+"/site-auth/"+(signup?"signup":"login"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:email,password:pw})})
          .then(function(r){if(!r.ok)throw new Error();return r.json();})
          .then(function(data){
          try{localStorage.setItem(custKey,data.token);}catch(e){}
          render();
          })
          .catch(function(){err.textContent=signup?"Could not sign up — check your details.":"Incorrect email or password.";});
          });
          }
          function render(){
          if(mode==="owner"){
          var ot=null;try{ot=localStorage.getItem(ownerKey);}catch(e){}
          if(ot) ownerDashboard(); else ownerForm();
          } else {
          var ct=null;try{ct=localStorage.getItem(custKey);}catch(e){}
          if(ct){
          fetch("/api/"+pid+"/site-auth/me",{headers:{Authorization:"Bearer "+ct}})
          .then(function(r){if(!r.ok)throw new Error();return r.json();})
          .then(function(data){customerDashboard(data.email,ct);})
          .catch(function(){try{localStorage.removeItem(custKey);}catch(e){}customerForm(false);});
          } else {
          customerForm(false);
          }
          }
          }
          for(var i=0;i<tabs.length;i++){
          (function(t){
          t.addEventListener("click",function(){setMode(t.getAttribute("data-forge-dashboard-tab"));});
          })(tabs[i]);
          }
          setMode("customer");
          }
          function init(){
          var roots=document.querySelectorAll("[data-forge-widget='dashboard-login']:not([data-forge-dashboard-login-init])");
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
        html: `<section class="block">
          <div class="block-oxygene-hero-inner">
          <h1 class="block-oxygene-hero-title block-heading">Oxygen.</h1>
          <h2 class="block-oxygene-hero-subtitle">Where design meets innovation</h2>
          <p class="block-oxygene-hero-description">Build luminous digital experiences with a design system crafted for clarity, scale, and soul.</p>
          <button class="block-oxygene-btn block-oxygene-btn-primary">Get Started</button>
          </div>
        </section>`,
      },
      {
        id: "oxy-features",
        label: "Oxygene · Features Grid",
        html: `<section class="block">
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
        html: `<section class="block">
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
        html: `<section class="block">
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
        html: `<section class="block">
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