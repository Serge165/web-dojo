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
        html: `<nav style="font-family:${F};background:var(--fc-bg, #fff);border-bottom:1px solid var(--fc-border, #ececec);padding:18px 32px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;">
  <div style="display:flex;gap:22px;font-size:14px;color:var(--fc-muted, #334155);">
    <a href="#" style="color:inherit;text-decoration:none;">Shop</a><a href="#" style="color:inherit;text-decoration:none;">New</a><a href="#" style="color:inherit;text-decoration:none;">About</a>
  </div>
  <div style="text-align:center;font-weight:800;font-size:20px;letter-spacing:.04em;color:var(--fc-text, #0f172a);">MAISON</div>
  <div style="display:flex;gap:22px;justify-content:flex-end;font-size:14px;color:var(--fc-muted, #334155);">
    <a href="#" style="color:inherit;text-decoration:none;">Journal</a><a href="#" style="color:inherit;text-decoration:none;">Cart (0)</a>
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
        html: `<nav style="font-family:${F};background:var(--fc-bg, #fff);border-bottom:1px solid var(--fc-border, #ececec);padding:14px 28px;display:flex;align-items:center;gap:20px;">
  <div style="font-weight:800;font-size:19px;color:var(--fc-text, #0f172a);">STORE</div>
  <div style="flex:1;max-width:520px;display:flex;align-items:center;background:var(--fc-surface, #f4f5f7);border-radius:10px;padding:9px 14px;gap:8px;">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
    <input placeholder="Search products…" style="border:0;background:transparent;outline:none;font-size:14px;width:100%;color:var(--fc-text, #0f172a);" />
  </div>
  <div style="display:flex;gap:18px;align-items:center;color:var(--fc-muted, #334155);">
    <a href="#" style="color:inherit;text-decoration:none;font-size:14px;">Account</a>
    <a href="#" style="color:inherit;text-decoration:none;font-size:14px;position:relative;">Cart <span style="position:absolute;top:-8px;right:-14px;background:#ef4444;color:#fff;border-radius:999px;font-size:10px;padding:1px 6px;">3</span></a>
  </div>
</nav>`,
      },
      {
        id: "nav-transparent",
        label: "Transparent Overlay Nav",
        html: `<nav style="font-family:${F};position:absolute;top:0;left:0;right:0;z-index:20;padding:22px 32px;display:flex;align-items:center;justify-content:space-between;color:#fff;">
  <div style="font-weight:700;font-size:19px;letter-spacing:.02em;">AURORA</div>
  <div style="display:flex;gap:26px;font-size:14px;">
    <a href="#" style="color:#fff;text-decoration:none;opacity:.9;">Home</a><a href="#" style="color:#fff;text-decoration:none;opacity:.9;">Rooms</a><a href="#" style="color:#fff;text-decoration:none;opacity:.9;">Dining</a>
  </div>
  <button style="background:rgba(255,255,255,.16);backdrop-filter:blur(8px);color:#fff;border:1px solid rgba(255,255,255,.4);padding:9px 20px;border-radius:999px;font-size:13px;cursor:pointer;">Book now</button>
</nav>`,
      },
      {
        id: "nav-app-tabs",
        label: "App Pill-tabs Nav",
        html: `<nav style="font-family:${F};background:var(--fc-bg, #0b0b12);padding:14px 24px;display:flex;align-items:center;justify-content:space-between;">
  <div style="font-weight:700;color:var(--fc-text, #fff);font-size:17px;">◐ Flowly</div>
  <div style="display:flex;gap:4px;background:var(--fc-surface, #161622);border:1px solid var(--fc-border, #232335);border-radius:999px;padding:4px;">
    ${["Overview","Projects","Team","Settings"].map((t,i)=>`<a href="#" style="text-decoration:none;font-size:13px;padding:7px 16px;border-radius:999px;${i===0?"background:var(--fc-primary, #4f46e5);color:#fff;":"color:var(--fc-muted, #9ca3af);"}">${t}</a>`).join("")}
  </div>
  <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&q=80" style="width:32px;height:32px;border-radius:999px;object-fit:cover;" alt="" />
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
        html: `<div style="font-family:${F};">
  <div style="background:var(--fc-primary, #4f46e5);color:#fff;text-align:center;font-size:13px;padding:9px 16px;">✦ Free shipping on orders over $50 — <a href="#" style="color:#fff;text-decoration:underline;">Shop now</a></div>
  <header style="background:var(--fc-bg, #fff);border-bottom:1px solid var(--fc-border, #ececec);padding:18px 32px;display:flex;align-items:center;justify-content:space-between;">
    <div style="font-weight:800;font-size:20px;color:var(--fc-text, #0f172a);">Brand</div>
    <nav style="display:flex;gap:26px;font-size:14px;color:var(--fc-muted, #334155);"><a href="#" style="color:inherit;text-decoration:none;">Home</a><a href="#" style="color:inherit;text-decoration:none;">Shop</a><a href="#" style="color:inherit;text-decoration:none;">Blog</a></nav>
    <button style="background:var(--fc-primary, #0f172a);color:#fff;border:0;padding:9px 18px;border-radius:8px;font-size:13px;cursor:pointer;">Contact</button>
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
        html: `<header style="font-family:Georgia,'Times New Roman',serif;background:var(--fc-bg, #f7f3ec);padding:26px 32px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--fc-border, #e4dccc);">
  <div style="font-size:24px;font-style:italic;color:var(--fc-text, #1c1a17);">The Quarterly</div>
  <nav style="display:flex;gap:28px;font-size:15px;color:var(--fc-muted, #6b6459);">
    <a href="#" style="color:inherit;text-decoration:none;">Essays</a><a href="#" style="color:inherit;text-decoration:none;">Interviews</a><a href="#" style="color:inherit;text-decoration:none;">Archive</a><a href="#" style="color:inherit;text-decoration:none;">Subscribe</a>
  </nav>
</header>`,
      },
      {
        id: "hdr-dark-cta",
        label: "Dark Header + CTA",
        html: `<header style="font-family:${F};background:var(--fc-bg, #0a0a12);padding:18px 32px;display:flex;align-items:center;justify-content:space-between;">
  <div style="display:flex;align-items:center;gap:10px;"><div style="width:28px;height:28px;background:linear-gradient(135deg,#f43f5e,#fb923c);border-radius:8px;"></div><span style="color:var(--fc-text, #fff);font-weight:700;font-size:18px;">Ignite</span></div>
  <nav style="display:flex;gap:26px;font-size:14px;color:var(--fc-muted, #9ca3af);"><a href="#" style="color:inherit;text-decoration:none;">Product</a><a href="#" style="color:inherit;text-decoration:none;">Customers</a><a href="#" style="color:inherit;text-decoration:none;">Pricing</a></nav>
  <div style="display:flex;gap:10px;"><button style="background:transparent;color:#fff;border:1px solid var(--fc-border, #26263a);padding:9px 16px;border-radius:8px;font-size:13px;cursor:pointer;">Log in</button><button style="background:var(--fc-primary, #f43f5e);color:#fff;border:0;padding:9px 18px;border-radius:8px;font-size:13px;cursor:pointer;">Start free</button></div>
</header>`,
      },
      {
        id: "hdr-search-actions",
        label: "Header + Search + Icons",
        html: `<header style="font-family:${F};background:var(--fc-bg, #fff);border-bottom:1px solid var(--fc-border, #ececec);padding:14px 28px;display:flex;align-items:center;gap:20px;">
  <div style="font-weight:800;font-size:19px;color:var(--fc-text, #0f172a);">Docs</div>
  <nav style="display:flex;gap:22px;font-size:14px;color:var(--fc-muted, #334155);"><a href="#" style="color:inherit;text-decoration:none;">Guides</a><a href="#" style="color:inherit;text-decoration:none;">API</a><a href="#" style="color:inherit;text-decoration:none;">Examples</a></nav>
  <div style="flex:1;"></div>
  <div style="display:flex;align-items:center;background:var(--fc-surface, #f4f5f7);border-radius:8px;padding:8px 12px;gap:8px;min-width:220px;"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg><input placeholder="Search docs ⌘K" style="border:0;background:transparent;outline:none;font-size:13px;width:100%;" /></div>
  <a href="#" style="color:var(--fc-muted, #334155);">◔</a>
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
        html: `<footer style="font-family:${F};background:var(--fc-bg, #fff);border-top:1px solid var(--fc-border, #ececec);padding:28px 32px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;">
  <div style="font-size:14px;color:var(--fc-muted, #64748b);">© 2026 Brand — All rights reserved.</div>
  <div style="display:flex;gap:20px;font-size:14px;color:var(--fc-muted, #64748b);"><a href="#" style="color:inherit;text-decoration:none;">Privacy</a><a href="#" style="color:inherit;text-decoration:none;">Terms</a><a href="#" style="color:inherit;text-decoration:none;">Contact</a></div>
</footer>`,
      },
      {
        id: "ft-newsletter",
        label: "Newsletter Footer",
        html: `<footer style="font-family:${F};background:var(--fc-bg, #0f172a);color:var(--fc-muted, #cbd5e1);padding:56px 32px;">
  <div style="max-width:900px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center;">
    <div><h3 style="color:var(--fc-text, #fff);font-size:24px;margin:0 0 8px;">Stay in the loop</h3><p style="margin:0;font-size:14px;color:var(--fc-muted, #94a3b8);">One thoughtful email a week. No spam.</p></div>
    <form style="display:flex;gap:10px;"><input placeholder="you@example.com" style="flex:1;padding:13px 16px;border-radius:10px;border:1px solid var(--fc-border, #1e293b);background:var(--fc-surface, #0b1220);color:var(--fc-text, #fff);font-size:14px;" /><button style="padding:13px 22px;background:var(--fc-primary, #4f46e5);color:#fff;border:0;border-radius:10px;font-weight:600;cursor:pointer;">Subscribe</button></form>
  </div>
  <div style="max-width:900px;margin:28px auto 0;padding-top:20px;border-top:1px solid var(--fc-border, #1e293b);font-size:12px;color:var(--fc-muted, #64748b);">© 2026 Brand.</div>
</footer>`,
      },
      {
        id: "ft-social-dark",
        label: "Social Footer",
        html: `<footer style="font-family:${F};background:var(--fc-bg, #0a0a12);color:var(--fc-muted, #9ca3af);padding:48px 32px;text-align:center;">
  <div style="font-weight:800;color:var(--fc-text, #fff);font-size:22px;letter-spacing:.04em;margin-bottom:16px;">AURORA</div>
  <div style="display:flex;gap:16px;justify-content:center;margin-bottom:22px;">
    ${["Instagram","X","YouTube","TikTok"].map(s=>`<a href="#" style="color:var(--fc-muted, #9ca3af);text-decoration:none;font-size:13px;border:1px solid var(--fc-border, #26263a);padding:8px 16px;border-radius:999px;">${s}</a>`).join("")}
  </div>
  <div style="font-size:12px;color:var(--fc-muted, #4b5563);">© 2026 Aurora Studio. Made with care.</div>
</footer>`,
      },
      {
        id: "ft-columns-light",
        label: "4-column Light Footer",
        html: `<footer style="font-family:${F};background:var(--fc-bg, #f8fafc);border-top:1px solid var(--fc-border, #ececec);padding:56px 32px 36px;">
  <div style="max-width:1120px;margin:0 auto;display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:32px;">
    <div><div style="font-weight:800;font-size:20px;color:var(--fc-text, #0f172a);margin-bottom:10px;">Brand</div><p style="font-size:13px;color:var(--fc-muted, #64748b);max-width:240px;margin:0;">Design and ship beautiful sites, fast.</p></div>
    ${[["Product",["Features","Pricing","Roadmap"]],["Resources",["Blog","Guides","Support"]],["Company",["About","Careers","Legal"]]].map(([h,ls])=>`<div><div style="font-weight:600;color:var(--fc-text, #0f172a);font-size:13px;margin-bottom:12px;">${h}</div>${ls.map(l=>`<a href="#" style="display:block;color:var(--fc-muted, #64748b);text-decoration:none;font-size:13px;padding:4px 0;">${l}</a>`).join("")}</div>`).join("")}
  </div>
</footer>`,
      },
      {
        id: "ft-contact",
        label: "Contact Footer",
        html: `<footer style="font-family:${F};background:var(--fc-bg, #111827);color:var(--fc-muted, #d1d5db);padding:52px 32px;">
  <div style="max-width:1000px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr 1fr;gap:28px;">
    <div><div style="font-weight:700;color:var(--fc-text, #fff);font-size:18px;margin-bottom:10px;">Get in touch</div><p style="font-size:14px;margin:0;line-height:1.9;">hello@example.com<br/>+1 (555) 019-2834<br/>24 Harbour St, Suite 400</p></div>
    <div><div style="font-weight:600;color:var(--fc-text, #fff);font-size:13px;margin-bottom:12px;">Hours</div><p style="font-size:14px;margin:0;line-height:1.9;">Mon–Fri · 9–6<br/>Sat · 10–4<br/>Sun · Closed</p></div>
    <div><div style="font-weight:600;color:var(--fc-text, #fff);font-size:13px;margin-bottom:12px;">Follow</div><p style="font-size:14px;margin:0;line-height:1.9;">Instagram<br/>LinkedIn<br/>YouTube</p></div>
  </div>
  <div style="max-width:1000px;margin:28px auto 0;padding-top:18px;border-top:1px solid var(--fc-border, #1f2937);font-size:12px;color:var(--fc-muted, #6b7280);">© 2026 Brand.</div>
</footer>`,
      },
      {
        id: "ft-app-download",
        label: "App Download Footer",
        html: `<footer style="font-family:${F};background:linear-gradient(135deg,#4f46e5,#0ea5e9);color:#fff;padding:52px 32px;text-align:center;">
  <h3 style="font-size:26px;margin:0 0 10px;">Take it everywhere</h3>
  <p style="margin:0 0 22px;opacity:.9;font-size:15px;">Download the app for iOS and Android.</p>
  <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
    <a href="#" style="background:var(--fc-primary, #0f172a);color:#fff;text-decoration:none;padding:12px 22px;border-radius:12px;font-size:14px;">↧ App Store</a>
    <a href="#" style="background:var(--fc-primary, #0f172a);color:#fff;text-decoration:none;padding:12px 22px;border-radius:12px;font-size:14px;">↧ Google Play</a>
  </div>
</footer>`,
      },
      {
        id: "ft-mega-multicol",
        label: "Mega 5-column Footer",
        html: `<footer style="font-family:${F};background:var(--fc-bg, #0b0b12);color:var(--fc-muted, #9ca3af);padding:60px 32px 32px;">
  <div style="max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr 1.2fr;gap:28px;">
    <div><div style="font-weight:800;font-size:20px;color:var(--fc-text, #fff);margin-bottom:10px;">Brand</div><p style="font-size:13px;line-height:1.7;margin:0;max-width:220px;">Tools for teams who ship fast and design well.</p></div>
    ${[["Product",["Features","Integrations","Changelog"]],["Solutions",["Agencies","Startups","Enterprise"]],["Resources",["Blog","Guides","API Docs"]],["Company",["About","Careers","Press"]]].map(([h,ls])=>`<div><div style="font-weight:600;color:var(--fc-text, #fff);font-size:13px;margin-bottom:12px;">${h}</div>${ls.map(l=>`<a href="#" style="display:block;color:var(--fc-muted, #9ca3af);text-decoration:none;font-size:13px;padding:4px 0;">${l}</a>`).join("")}</div>`).join("")}
  </div>
  <div style="max-width:1200px;margin:32px auto 0;padding-top:20px;border-top:1px solid var(--fc-border, #26263a);display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;font-size:12px;color:var(--fc-muted, #6b7280);">
    <span>© 2026 Brand. All rights reserved.</span>
    <div style="display:flex;gap:16px;"><a href="#" style="color:inherit;text-decoration:none;">Privacy</a><a href="#" style="color:inherit;text-decoration:none;">Terms</a><a href="#" style="color:inherit;text-decoration:none;">Cookies</a></div>
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
        html: `<section style="position:relative;min-height:82vh;display:flex;align-items:center;justify-content:center;text-align:center;overflow:hidden;font-family:${F};">
  <video autoplay muted loop playsinline poster="${VPOSTER}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;"><source src="${VID}" type="video/mp4" /></video>
  <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,.7));z-index:1;"></div>
  <div style="position:relative;z-index:2;color:#fff;max-width:720px;padding:32px;">
    <h1 style="font-size:60px;line-height:1.05;letter-spacing:-.03em;margin:0 0 18px;">Motion tells your story</h1>
    <p style="font-size:19px;opacity:.9;margin:0 0 28px;">A cinematic hero with a looping background video. Muted, auto-playing, mobile-friendly.</p>
    <a href="#" style="display:inline-block;background:#fff;color:#0f172a;text-decoration:none;padding:14px 30px;border-radius:999px;font-weight:700;">Watch the film</a>
  </div>
</section>`,
      },
      {
        id: "video-section",
        label: "Section · Video + Text",
        html: `<section style="font-family:${F};background:var(--fc-bg, #0b0b12);color:var(--fc-text, #fff);padding:72px 32px;">
  <div style="max-width:1120px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;">
    <div style="position:relative;border-radius:18px;overflow:hidden;aspect-ratio:16/10;"><video autoplay muted loop playsinline poster="${VPOSTER}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;"><source src="${VID}" type="video/mp4" /></video></div>
    <div>
      <div style="color:var(--fc-accent, #22d3ee);font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin-bottom:14px;">See it in action</div>
      <h2 style="font-size:38px;letter-spacing:-.02em;margin:0 0 16px;">Built to move</h2>
      <p style="font-size:17px;line-height:1.7;color:var(--fc-muted, #9ca3af);margin:0 0 24px;">Pair looping product footage with crisp copy. The video autoplays muted and loops seamlessly on every device.</p>
      <a href="#" style="display:inline-block;background:var(--fc-primary, #4f46e5);color:#fff;text-decoration:none;padding:13px 26px;border-radius:10px;font-weight:600;">Learn more</a>
    </div>
  </div>
</section>`,
      },
      {
        id: "video-banner",
        label: "Video Banner Strip",
        html: `<section style="position:relative;height:280px;display:flex;align-items:center;overflow:hidden;font-family:${F};">
  <video autoplay muted loop playsinline poster="${VPOSTER}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;"><source src="${VID}" type="video/mp4" /></video>
  <div style="position:absolute;inset:0;background:rgba(15,23,42,.55);z-index:1;"></div>
  <div style="position:relative;z-index:2;max-width:1120px;margin:0 auto;padding:0 32px;color:#fff;">
    <h2 style="font-size:36px;letter-spacing:-.02em;margin:0 0 8px;">Adventure awaits</h2>
    <p style="margin:0;opacity:.9;font-size:16px;">A compact full-bleed video banner for section breaks.</p>
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
        html: `<section style="font-family:${F};padding:72px 32px;background:var(--fc-bg, #ffffff);">
  <div style="max-width:1120px;margin:0 auto;">
    <h2 style="font-size:34px;letter-spacing:-.02em;margin:0 0 32px;color:var(--fc-text, #0f172a);text-align:center;">Meet the team</h2>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:24px;">
      ${[["Ava Chen","Product Lead"],["Marcus Reed","Engineering"],["Priya Nair","Design"],["Tom Vidal","Growth"]].map(([n,r],i)=>`
      <div style="text-align:center;">
        <img src="${AVA[i]}" style="width:100px;height:100px;border-radius:999px;object-fit:cover;margin:0 auto 14px;" alt="${n}" />
        <div style="font-weight:700;font-size:15px;color:var(--fc-text, #0f172a);">${n}</div>
        <div style="font-size:13px;color:var(--fc-muted, #64748b);margin-bottom:10px;">${r}</div>
        <div style="display:flex;gap:10px;justify-content:center;">
          <a href="#" style="color:var(--fc-muted, #94a3b8);" aria-label="LinkedIn"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 11-.02 5.001A2.5 2.5 0 014.98 3.5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-.98 1.83-2 3.76-2 4.02 0 4.76 2.5 4.76 5.76V21h-4v-5.85c0-1.4-.03-3.2-2-3.2-2 0-2.3 1.5-2.3 3.1V21H9z"/></svg></a>
          <a href="#" style="color:var(--fc-muted, #94a3b8);" aria-label="Twitter"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22 5.9c-.7.3-1.5.6-2.3.7.8-.5 1.5-1.3 1.8-2.3-.8.5-1.7.8-2.6 1a4.1 4.1 0 00-7 3.7A11.6 11.6 0 013 4.9a4.1 4.1 0 001.3 5.5c-.7 0-1.3-.2-1.9-.5v.1c0 2 1.4 3.6 3.3 4a4.1 4.1 0 01-1.9.1c.5 1.6 2.1 2.8 3.9 2.9A8.2 8.2 0 012 18.6a11.6 11.6 0 006.3 1.8c7.5 0 11.7-6.3 11.7-11.7v-.5c.8-.6 1.5-1.3 2-2.1z"/></svg></a>
        </div>
      </div>`).join("")}
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
        html: `<section style="font-family:${F};padding:72px 32px;background:var(--fc-bg, #0b0b12);">
  <div style="max-width:1120px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:140px;gap:14px;">
    <div style="grid-column:span 2;grid-row:span 2;border-radius:18px;padding:24px;background:var(--fc-surface, #161622);border:1px solid var(--fc-border, #232335);display:flex;flex-direction:column;justify-content:flex-end;"><div style="color:var(--fc-text, #fff);font-weight:700;font-size:20px;margin-bottom:6px;">Design system</div><div style="color:var(--fc-muted, #9ca3af);font-size:13px;">Tokens, components, and docs in one place.</div></div>
    <div style="grid-column:span 2;border-radius:18px;padding:22px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;display:flex;flex-direction:column;justify-content:flex-end;"><div style="font-weight:700;font-size:17px;">Ship faster</div></div>
    <div style="border-radius:18px;padding:20px;background:var(--fc-surface, #161622);border:1px solid var(--fc-border, #232335);color:var(--fc-muted, #9ca3af);font-size:13px;display:flex;align-items:flex-end;">Analytics</div>
    <div style="border-radius:18px;padding:20px;background:var(--fc-surface, #161622);border:1px solid var(--fc-border, #232335);color:var(--fc-muted, #9ca3af);font-size:13px;display:flex;align-items:flex-end;">Integrations</div>
    <div style="grid-column:span 2;grid-row:span 2;border-radius:18px;overflow:hidden;"><img src="${PORT[0]}" style="width:100%;height:100%;object-fit:cover;" alt="" /></div>
    <div style="grid-column:span 2;border-radius:18px;padding:22px;background:var(--fc-surface, #161622);border:1px solid var(--fc-border, #232335);color:var(--fc-text, #fff);font-weight:700;font-size:16px;display:flex;align-items:flex-end;">99.99% uptime</div>
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
        html: `<section style="font-family:${F};padding:72px 32px;background:var(--fc-bg, #ffffff);">
  <div style="max-width:1120px;margin:0 auto;">
    <h2 style="font-size:34px;letter-spacing:-.02em;margin:0 0 32px;color:var(--fc-text, #0f172a);text-align:center;">What we do</h2>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;">
      ${[["Strategy","Positioning, research and roadmaps that align teams.","M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z"],["Design","Interfaces and systems that feel effortless to use.","M12 2a10 10 0 100 20 10 10 0 000-20zm0 4v6l4 2"],["Engineering","Reliable, scalable builds shipped on schedule.","M8 3L2 12l6 9M16 3l6 9-6 9"]].map(([t,d,p])=>`
      <div style="padding:6px;">
        <div style="width:48px;height:48px;border-radius:12px;background:var(--fc-primary, #0f172a);display:flex;align-items:center;justify-content:center;margin-bottom:16px;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${p}"/></svg>
        </div>
        <div style="font-weight:700;font-size:17px;color:var(--fc-text, #0f172a);margin-bottom:8px;">${t}</div>
        <p style="margin:0;font-size:14px;line-height:1.7;color:var(--fc-muted, #64748b);">${d}</p>
      </div>`).join("")}
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
        html: `<section style="font-family:${F};padding:64px 0;background:var(--fc-bg, #0f172a);">
  <div style="max-width:1120px;margin:0 auto 24px;padding:0 32px;">
    <h2 style="font-size:32px;letter-spacing:-.02em;margin:0;color:var(--fc-text, #fff);">Loved by teams</h2>
  </div>
  <div style="display:flex;gap:16px;overflow-x:auto;padding:0 32px 12px;scroll-snap-type:x mandatory;">
    ${[["This tool cut our build time in half.","Jordan Lee","VP Design, Nova"],["Support is fast and the product just works.","Sam Okafor","Founder, Loop"],["Our whole team switched in a week.","Rae Kim","Head of Product, Fera"]].map(([q,n,r],i)=>`
    <div style="scroll-snap-align:start;min-width:380px;background:var(--fc-surface, #1e293b);border-radius:16px;padding:28px;color:var(--fc-text, #e2e8f0);">
      <p style="font-size:16px;line-height:1.7;margin:0 0 20px;">"${q}"</p>
      <div style="display:flex;align-items:center;gap:10px;">
        <img src="${AVA[i]}" style="width:40px;height:40px;border-radius:999px;object-fit:cover;" alt="" />
        <div><div style="font-weight:600;font-size:14px;">${n}</div><div style="font-size:12px;color:var(--fc-muted, #94a3b8);">${r}</div></div>
      </div>
    </div>`).join("")}
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
        html: `<section style="font-family:${F};padding:64px 32px;background:var(--fc-bg, #05050a);">
  <div style="max-width:1120px;margin:0 auto;">
    <h2 style="font-size:32px;letter-spacing:-.02em;margin:0 0 4px;color:var(--fc-text, #fff);">Roster</h2>
    <p style="margin:0 0 28px;color:var(--fc-accent, #22d3ee);font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">Season 2026</p>
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:14px;">
      ${[["Viper","IGL",AVA[0]],["Ashen","Duelist",AVA[1]],["Kudo","Support",AVA[2]],["Frost","Sentinel",AVA[3]],["Ronin","Flex",AVA[4]]].map(([n,role,img])=>`
      <div style="background:var(--fc-surface, #101018);border:1px solid var(--fc-border, #22222e);border-radius:14px;overflow:hidden;text-align:center;">
        <img src="${img}" style="width:100%;height:140px;object-fit:cover;filter:grayscale(.2);" alt="${n}" />
        <div style="padding:12px;"><div style="font-weight:800;color:var(--fc-text, #fff);font-size:14px;letter-spacing:.02em;">${n}</div><div style="font-size:11px;color:var(--fc-accent, #22d3ee);text-transform:uppercase;letter-spacing:.06em;">${role}</div></div>
      </div>`).join("")}
    </div>
  </div>
</section>`,
      },
      {
        id: "esports-bracket",
        label: "Esports · Tournament Bracket",
        html: `<section style="font-family:${F};padding:64px 32px;background:var(--fc-bg, #05050a);overflow-x:auto;">
  <div style="max-width:1120px;margin:0 auto;">
    <h2 style="font-size:32px;letter-spacing:-.02em;margin:0 0 32px;color:var(--fc-text, #fff);">Bracket</h2>
    <div style="display:flex;gap:48px;min-width:680px;">
      ${[["Quarterfinals",[["Alpha","Ronin"],["Nova","Vertex"],["Kaze","Wraith"],["Onyx","Pulse"]]],["Semifinals",[["Alpha","Vertex"],["Kaze","Onyx"]]],["Final",[["Alpha","Kaze"]]]].map(([round,matches])=>`
      <div style="flex:1;display:flex;flex-direction:column;justify-content:space-around;gap:20px;">
        <div style="font-size:11px;color:var(--fc-muted, #6b7280);text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px;">${round}</div>
        ${matches.map(([a,b])=>`
        <div style="border:1px solid var(--fc-border, #22222e);border-radius:10px;overflow:hidden;">
          <div style="padding:9px 12px;font-size:13px;color:var(--fc-text, #e5e7eb);background:var(--fc-surface, #101018);border-bottom:1px solid var(--fc-border, #22222e);">${a}</div>
          <div style="padding:9px 12px;font-size:13px;color:var(--fc-muted, #6b7280);background:var(--fc-surface, #101018);">${b}</div>
        </div>`).join("")}
      </div>`).join("")}
    </div>
  </div>
</section>`,
      },
      {
        id: "esports-schedule",
        label: "Esports · Stream Schedule",
        html: `<section style="font-family:${F};padding:64px 32px;background:var(--fc-bg, #05050a);">
  <div style="max-width:1120px;margin:0 auto;">
    <h2 style="font-size:32px;letter-spacing:-.02em;margin:0 0 28px;color:var(--fc-text, #fff);">Stream schedule</h2>
    <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:10px;">
      ${[["Mon","7PM","Ranked grind"],["Tue","Off",""],["Wed","7PM","Scrims"],["Thu","7PM","Community night"],["Fri","8PM","Tournament"],["Sat","2PM","VOD review"],["Sun","Off",""]].map(([d,t,s])=>`
      <div style="background:var(--fc-surface, #101018);border:1px solid var(--fc-border, #22222e);border-radius:12px;padding:14px 10px;text-align:center;">
        <div style="font-size:11px;color:var(--fc-muted, #6b7280);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">${d}</div>
        <div style="font-weight:700;color:${t==="Off"?"var(--fc-muted, #4b5563)":"var(--fc-accent, #22d3ee)"};font-size:14px;margin-bottom:4px;">${t}</div>
        <div style="font-size:11px;color:var(--fc-muted, #6b7280);">${s}</div>
      </div>`).join("")}
    </div>
  </div>
</section>`,
      },
      {
        id: "esports-stats",
        label: "Esports · Player Stat Cards",
        html: `<section style="font-family:${F};padding:64px 32px;background:var(--fc-bg, #05050a);">
  <div style="max-width:1120px;margin:0 auto;">
    <h2 style="font-size:32px;letter-spacing:-.02em;margin:0 0 28px;color:var(--fc-text, #fff);">Player stats</h2>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;">
      ${[["Viper","1.34","78%"],["Ashen","1.21","71%"],["Kudo","0.98","65%"],["Frost","1.08","69%"]].map(([n,kd,hs])=>`
      <div style="background:var(--fc-surface, #101018);border:1px solid var(--fc-border, #22222e);border-radius:14px;padding:20px;">
        <div style="font-weight:800;color:var(--fc-text, #fff);font-size:15px;margin-bottom:14px;">${n}</div>
        <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--fc-muted, #6b7280);margin-bottom:6px;"><span>K/D</span><span style="color:var(--fc-accent, #22d3ee);font-weight:700;">${kd}</span></div>
        <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--fc-muted, #6b7280);"><span>Headshot %</span><span style="color:var(--fc-accent, #22d3ee);font-weight:700;">${hs}</span></div>
      </div>`).join("")}
    </div>
  </div>
</section>`,
      },
      {
        id: "esports-leaderboard",
        label: "Esports · Leaderboard",
        html: `<section style="font-family:${F};padding:64px 32px;background:var(--fc-bg, #05050a);">
  <div style="max-width:1120px;margin:0 auto;">
    <h2 style="font-size:32px;letter-spacing:-.02em;margin:0 0 28px;color:var(--fc-text, #fff);">Leaderboard</h2>
    <div style="border:1px solid var(--fc-border, #22222e);border-radius:14px;overflow:hidden;">
      <div style="display:grid;grid-template-columns:56px 1fr 100px 100px;padding:12px 16px;background:var(--fc-surface, #101018);font-size:11px;color:var(--fc-muted, #6b7280);text-transform:uppercase;letter-spacing:.06em;">
        <div>#</div><div>Team</div><div>Wins</div><div>Points</div>
      </div>
      ${[["1","Alpha Esports","14","842"],["2","Vertex GG","12","790"],["3","Kaze Nation","11","755"],["4","Onyx Squad","9","680"],["5","Pulse Collective","8","611"]].map(([r,team,w,pts],i)=>`
      <div style="display:grid;grid-template-columns:56px 1fr 100px 100px;padding:12px 16px;align-items:center;background:${i%2===0?"var(--fc-bg, #05050a)":"var(--fc-surface, #101018)"};border-top:1px solid var(--fc-border, #22222e);">
        <div style="font-weight:800;color:${i===0?"var(--fc-accent, #22d3ee)":"var(--fc-muted, #6b7280)"};">${r}</div>
        <div style="color:var(--fc-text, #e5e7eb);font-weight:600;font-size:14px;">${team}</div>
        <div style="color:var(--fc-muted, #6b7280);font-size:13px;">${w}</div>
        <div style="color:var(--fc-accent, #22d3ee);font-weight:700;font-size:13px;">${pts}</div>
      </div>`).join("")}
    </div>
  </div>
</section>`,
      },
      {
        id: "esports-org-hub",
        label: "Esports · Organization Hub",
        html: `<section style="font-family:${F};padding:64px 32px;background:var(--fc-bg, #05050a);">
  <div style="max-width:1120px;margin:0 auto;">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:24px;margin-bottom:36px;flex-wrap:wrap;">
      <div>
        <h2 style="font-size:36px;letter-spacing:-.02em;margin:0 0 6px;color:var(--fc-text, #fff);">Alpha Esports</h2>
        <p style="margin:0;color:var(--fc-muted, #6b7280);font-size:14px;max-width:520px;">Competing across Valorant, CS2 and League — est. 2021. Follow the journey, catch the streams, join the community.</p>
      </div>
      <a href="#" style="background:var(--fc-accent, #22d3ee);color:#05050a;font-weight:800;font-size:13px;padding:12px 22px;border-radius:999px;text-decoration:none;white-space:nowrap;">Join the community</a>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:36px;">
      ${[["Est.","2021"],["Titles","3 games"],["Followers","210K+"]].map(([l,v])=>`
      <div style="background:var(--fc-surface, #101018);border:1px solid var(--fc-border, #22222e);border-radius:12px;padding:18px;text-align:center;">
        <div style="font-size:22px;font-weight:800;color:var(--fc-accent, #22d3ee);">${v}</div>
        <div style="font-size:11px;color:var(--fc-muted, #6b7280);text-transform:uppercase;letter-spacing:.06em;margin-top:4px;">${l}</div>
      </div>`).join("")}
    </div>
    <div style="text-align:center;">
      <div style="font-size:11px;color:var(--fc-muted, #6b7280);text-transform:uppercase;letter-spacing:.08em;margin-bottom:14px;">Backed by</div>
      <div style="display:flex;justify-content:center;gap:32px;flex-wrap:wrap;opacity:.7;">
        ${["SPONSOR ONE","SPONSOR TWO","SPONSOR THREE","SPONSOR FOUR"].map((s)=>`<div style="font-weight:800;letter-spacing:.04em;color:var(--fc-muted, #6b7280);font-size:14px;">${s}</div>`).join("")}
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
        html: `<section style="font-family:${F};padding:72px 32px;background:var(--fc-bg, #ffffff);">
  <div style="max-width:1120px;margin:0 auto;">
    <h2 style="font-size:34px;letter-spacing:-.02em;margin:0 0 8px;color:var(--fc-text, #0f172a);text-align:center;">Support the channel</h2>
    <p style="margin:0 0 32px;color:var(--fc-muted, #64748b);font-size:15px;text-align:center;">Pick a membership tier and unlock perks.</p>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;">
      ${[["Fan","5",["Member badge","Emotes","Shoutouts"]],["Supporter","15",["Everything in Fan","Discord access","Monthly Q&A"]],["VIP","40",["Everything in Supporter","1:1 game session","Name in credits"]]].map(([n,p,feats],i)=>`
      <div style="padding:28px;border-radius:16px;border:1px solid var(--fc-border, #e2e8f0);${i===1?"border-color:var(--fc-primary, #7c3aed);box-shadow:0 20px 50px rgba(0,0,0,.08);":""}background:var(--fc-surface, #fff);">
        <div style="font-weight:700;font-size:16px;color:var(--fc-text, #0f172a);margin-bottom:6px;">${n}</div>
        <div style="font-size:32px;font-weight:800;color:var(--fc-text, #0f172a);margin-bottom:16px;">$${p}<span style="font-size:13px;font-weight:500;color:var(--fc-muted, #64748b);">/mo</span></div>
        <ul style="list-style:none;padding:0;margin:0 0 22px;font-size:13px;color:var(--fc-muted, #64748b);line-height:2;">${feats.map(f=>`<li>✓ ${f}</li>`).join("")}</ul>
        <a href="#" style="display:block;text-align:center;padding:11px;border-radius:10px;background:${i===1?"var(--fc-primary, #7c3aed)":"transparent"};color:${i===1?"#fff":"var(--fc-text, #0f172a)"};border:1px solid var(--fc-border, #e2e8f0);text-decoration:none;font-weight:600;font-size:14px;">Join ${n}</a>
      </div>`).join("")}
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
        html: `<div data-wd-hitcounter-root style="font-family:${F};display:flex;flex-direction:column;align-items:center;gap:6px;padding:18px;background:var(--fc-bg, #000010);">
  <div style="font-size:11px;letter-spacing:.06em;color:var(--fc-muted, #9ca3af);text-transform:uppercase;">You are visitor number</div>
  <div style="display:flex;gap:2px;background:#111;padding:6px 8px;border:2px inset #666;border-radius:2px;" data-wd-hitcounter-digits>
    ${Array.from({length: 6}).map(() => `<span style="display:inline-block;width:18px;text-align:center;font-family:'Courier New',monospace;font-weight:700;font-size:20px;color:#39ff14;text-shadow:0 0 6px #39ff14;background:#0a0a0a;">0</span>`).join("")}
  </div>
  <div style="font-size:10px;color:var(--fc-muted, #6b7280);">counts visits to this page, stored in your browser — a modern stand-in for the server-side hit files 90s CGI counters used</div>
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
        html: `<section style="font-family:${F};padding:56px 24px;background:var(--fc-bg, #1a0033);">
  <div style="max-width:560px;margin:0 auto;background:var(--fc-surface, #2d0052);border:3px double #ff00ff;border-radius:4px;padding:28px;">
    <h2 style="margin:0 0 4px;font-size:24px;color:#ffff00;text-shadow:2px 2px 0 #ff00ff;font-family:'Comic Sans MS',cursive;">✦ Sign My Guestbook! ✦</h2>
    <p style="margin:0 0 20px;font-size:12px;color:#00ffff;">Thanx for stopping by my page! Leave a message below ~*~</p>
    <form>
      <label style="display:block;font-size:11px;color:#fff;margin-bottom:4px;">Your Name</label>
      <input style="width:100%;box-sizing:border-box;padding:8px 10px;margin-bottom:12px;border:2px inset #999;background:#fff;font-family:${F};" />
      <label style="display:block;font-size:11px;color:#fff;margin-bottom:4px;">Message</label>
      <textarea rows="3" style="width:100%;box-sizing:border-box;padding:8px 10px;margin-bottom:14px;border:2px inset #999;background:#fff;font-family:${F};resize:vertical;"></textarea>
      <button type="submit" style="padding:9px 20px;background:linear-gradient(180deg,#ff66ff,#cc00cc);border:2px outset #ff99ff;border-radius:4px;color:#fff;font-weight:700;cursor:pointer;">Sign It! →</button>
    </form>
    <div style="margin-top:24px;border-top:1px dashed #ff00ff;padding-top:16px;">
      ${[["xXsparkle_soulXx","omg i love ur page!! the bg music is SO good 💜"],["webmaster_99","nice site, added you to my links page. webring pending approval."]].map(([name, msg]) => `
      <div style="margin-bottom:10px;font-size:12px;">
        <span style="color:#ffff00;font-weight:700;">${name}</span> <span style="color:#999;">wrote:</span>
        <div style="color:#eee;margin-top:2px;">${msg}</div>
      </div>`).join("")}
    </div>
  </div>
</section>`,
      },
      {
        id: "retro-webring",
        label: "Retro · Webring Navigator",
        html: `<div style="font-family:${F};display:flex;align-items:center;justify-content:center;gap:0;padding:16px;background:var(--fc-bg, #000033);">
  <div style="display:flex;align-items:center;border:1px solid #6699ff;border-radius:8px;overflow:hidden;background:var(--fc-surface, #001a4d);">
    <a href="#" style="padding:9px 16px;color:#99ccff;text-decoration:none;font-size:12px;font-weight:700;border-right:1px solid #335599;">← Prev Site</a>
    <div style="padding:9px 16px;text-align:center;">
      <div style="font-size:10px;color:#6699ff;text-transform:uppercase;letter-spacing:.06em;">Member of the</div>
      <div style="font-size:12px;color:#fff;font-weight:700;">Indie Web Ring</div>
    </div>
    <a href="#" style="padding:9px 16px;color:#99ccff;text-decoration:none;font-size:12px;font-weight:700;border-left:1px solid #335599;border-right:1px solid #335599;">🔀 Random</a>
    <a href="#" style="padding:9px 16px;color:#99ccff;text-decoration:none;font-size:12px;font-weight:700;">Next Site →</a>
  </div>
</div>`,
      },
      {
        id: "retro-buttons88",
        label: "Retro · 88×31 Button Row",
        html: `<div style="font-family:${F};display:flex;flex-wrap:wrap;gap:6px;justify-content:center;padding:20px;background:var(--fc-bg, #ffffff);">
  ${[["#ff6600","#ffffff","BEST VIEWED\\nWITH EYES"],["#003399","#ffffff","VALID\\nHTML5"],["#009933","#ffffff","made with\\nCSS Grid"],["#cc0066","#ffffff","100%\\nHUMAN MADE"],["#333333","#ffcc00","POWERED BY\\nCOFFEE"]].map(([bg,fg,label]) => `
  <div style="width:88px;height:31px;background:${bg};color:${fg};display:flex;align-items:center;justify-content:center;text-align:center;font-size:9px;font-weight:700;line-height:1.2;border:1px solid #000;font-family:'Courier New',monospace;white-space:pre-line;">${label.replace(/\\n/g,"\n")}</div>`).join("")}
</div>`,
      },
      {
        id: "retro-top8",
        label: "Retro · Top 8 Friends",
        html: `<section style="font-family:${F};padding:48px 24px;background:var(--fc-bg, #0d001a);">
  <div style="max-width:640px;margin:0 auto;">
    <h2 style="font-size:20px;color:#fff;margin:0 0 4px;">Top Friends</h2>
    <p style="font-size:11px;color:#a855f7;margin:0 0 18px;">view all →</p>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;">
      ${AVA.concat(AVA.slice(0,2)).slice(0,8).map((img,i) => `
      <a href="#" style="text-decoration:none;text-align:center;">
        <img src="${img}" alt="Friend ${i+1}" style="width:100%;aspect-ratio:1;object-fit:cover;border:2px solid #a855f7;border-radius:6px;" />
        <div style="font-size:10px;color:#e9d5ff;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">friend_${i+1}</div>
      </a>`).join("")}
    </div>
  </div>
</section>`,
      },
      {
        id: "retro-eprops",
        label: "Retro · eProps & Blogroll",
        html: `<div style="font-family:${F};display:grid;grid-template-columns:1fr 220px;gap:20px;padding:32px 24px;background:var(--fc-bg, #fff8f0);max-width:760px;margin:0 auto;">
  <div style="border:1px solid var(--fc-border, #e5c9a8);border-radius:8px;padding:20px;background:var(--fc-surface, #fff);">
    <div style="font-size:11px;color:var(--fc-muted, #92653f);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;">Latest entry</div>
    <h3 style="margin:0 0 8px;font-size:18px;color:var(--fc-text, #4a2c17);">today was actually pretty good</h3>
    <p style="margin:0 0 14px;font-size:13px;color:var(--fc-muted, #6b4a2f);line-height:1.6;">nothing much happened but the weather was nice and I got bubble tea so 8/10 day tbh...</p>
    <div style="display:flex;align-items:center;gap:8px;">
      <button style="display:flex;align-items:center;gap:5px;padding:6px 12px;background:#ff9933;color:#fff;border:0;border-radius:20px;font-size:12px;font-weight:700;cursor:pointer;">⭐ eProps (24)</button>
      <span style="font-size:11px;color:var(--fc-muted, #92653f);">12 comments</span>
    </div>
  </div>
  <div>
    <div style="font-size:11px;color:var(--fc-muted, #92653f);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px;">My Blogrings</div>
    ${["Poetry & Prose Ring","2000s Nostalgia Crew","Bubble Tea Lovers","Late Night Thoughts"].map(r => `
    <div style="font-size:12px;color:#cc6600;padding:5px 0;border-bottom:1px dotted var(--fc-border, #e5c9a8);">◆ ${r}</div>`).join("")}
  </div>
</div>`,
      },
      {
        id: "retro-construction",
        label: "Retro · Under Construction",
        html: `<div style="font-family:${F};padding:14px;background:repeating-linear-gradient(45deg,#ffcc00,#ffcc00 20px,#000 20px,#000 40px);">
  <div style="background:#000;color:#ffcc00;text-align:center;padding:12px 20px;font-weight:800;font-size:16px;letter-spacing:.05em;font-family:'Comic Sans MS',cursive;border:2px dashed #ffcc00;">
    🚧 PAGE UNDER CONSTRUCTION 🚧<br />
    <span style="font-size:11px;font-weight:400;color:#fff;">check back soon — always more to add!</span>
  </div>
</div>`,
      },
      {
        id: "retro-divider",
        label: "Retro · Rainbow Glitter Divider",
        html: `<div style="padding:20px 24px;background:var(--fc-bg, #ffffff);text-align:center;">
  <div style="height:6px;border-radius:3px;background:linear-gradient(90deg,#ff0000,#ff9900,#ffff00,#33ff00,#00ffff,#3300ff,#ff00ff,#ff0000);background-size:200% 100%;animation:wd-rainbow-shift 3s linear infinite;"></div>
  <div style="margin-top:6px;font-family:'Comic Sans MS',cursive;font-size:13px;font-weight:700;background:linear-gradient(90deg,#ff0000,#ff9900,#ffff00,#33ff00,#00ffff,#3300ff,#ff00ff);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;animation:wd-rainbow-shift 3s linear infinite;">✧･ﾟ: *✧･ﾟ:* thanks for visiting *:･ﾟ✧*:･ﾟ✧</div>
  <style>@keyframes wd-rainbow-shift{0%{background-position:0% 50%}100%{background-position:200% 50%}}</style>
</div>`,
      },
      {
        id: "retro-musicplayer",
        label: "Retro · Now Playing Bar",
        html: `<div style="font-family:${F};display:flex;justify-content:center;padding:20px;background:var(--fc-bg, #1a1a2e);">
  <div style="background:linear-gradient(180deg,#2a2a4a,#1a1a2e);border:2px solid #6666aa;border-radius:8px;padding:12px 16px;display:flex;align-items:center;gap:12px;box-shadow:0 0 20px rgba(102,102,170,.4);">
    <div style="width:38px;height:38px;border-radius:6px;background:linear-gradient(135deg,#ff6699,#6699ff);flex-shrink:0;"></div>
    <div>
      <div style="font-size:10px;color:#9999cc;text-transform:uppercase;letter-spacing:.06em;">♪ now playing</div>
      <div style="font-size:13px;color:#fff;font-weight:700;">profile-anthem.mp3</div>
    </div>
    <audio controls style="height:32px;"></audio>
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
        html: `<div style="font-family:${F};display:flex;flex-wrap:wrap;gap:8px;justify-content:center;padding:18px;background:var(--fc-bg, #c0c0c0);">
  <div style="background:#000080;color:#fff;font-family:'Courier New',monospace;font-size:11px;font-weight:700;text-align:center;padding:6px 12px;border:2px outset #6666cc;">Best viewed in<br/>Netscape Navigator 4.0</div>
  <div style="background:#000080;color:#fff;font-family:'Courier New',monospace;font-size:11px;font-weight:700;text-align:center;padding:6px 12px;border:2px outset #6666cc;">Optimized for<br/>Internet Explorer 5+</div>
  <div style="background:#000080;color:#fff;font-family:'Courier New',monospace;font-size:11px;font-weight:700;text-align:center;padding:6px 12px;border:2px outset #6666cc;">800×600<br/>resolution</div>
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
        html: `<div style="font-family:${F};display:flex;justify-content:center;padding:32px;background:var(--fc-bg, #eef2f7);">
  <div style="position:relative;display:inline-flex;align-items:center;gap:8px;padding:14px 28px;border-radius:14px;background:linear-gradient(180deg,#8ec5fc 0%,#2e6fd9 100%);box-shadow:0 4px 0 #1c4a99,0 8px 16px rgba(0,0,0,.25);overflow:hidden;">
    <div style="position:absolute;top:2px;left:6px;right:6px;height:45%;border-radius:12px 12px 50% 50% / 12px 12px 100% 100%;background:linear-gradient(180deg,rgba(255,255,255,.75),rgba(255,255,255,0));pointer-events:none;"></div>
    <span style="position:relative;font-size:20px;font-weight:800;color:#fff;text-shadow:0 1px 1px rgba(0,0,0,.35);letter-spacing:-0.02em;">myStartup</span>
    <span style="position:relative;font-size:10px;font-weight:700;color:#e0edff;background:rgba(255,255,255,.2);padding:2px 8px;border-radius:999px;text-transform:uppercase;letter-spacing:.06em;">beta</span>
  </div>
</div>`,
      },
      {
        // 2003–2007: AIM/LiveJournal-style "who's online" buddy list —
        // presence dots were the social proof of the era, before read
        // receipts and "last active" timestamps existed.
        id: "retro-buddyicons",
        label: "Retro · Buddy List",
        html: `<div style="font-family:${F};padding:18px;background:var(--fc-bg, #f0f4ff);">
  <div style="font-size:11px;font-weight:700;color:#4a5a8a;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;">Buddy List — ${AVA.length} online</div>
  <div style="display:flex;gap:8px;flex-wrap:wrap;">
    ${AVA.map((src) => `<div style="position:relative;">
      <img src="${src}" alt="" style="width:50px;height:50px;border-radius:4px;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.25);object-fit:cover;" />
      <span style="position:absolute;bottom:-2px;right:-2px;width:12px;height:12px;border-radius:50%;background:#4ade80;border:2px solid #fff;"></span>
    </div>`).join("")}
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
        html: `<div style="font-family:${F};max-width:420px;margin:0 auto;padding:18px;background:var(--fc-surface, #ffffff);border:2px solid #cbd5e1;border-radius:6px;">
  <div style="font-size:13px;font-weight:800;color:var(--fc-text, #1e293b);border-bottom:2px dashed #cbd5e1;padding-bottom:8px;margin-bottom:10px;">💬 Shout Box</div>
  <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:10px;">
    <div style="font-size:12px;background:#f1f5f9;padding:6px 8px;border-radius:4px;color:#1e293b;"><b style="color:#7c3aed;">xXcoolkidXx:</b> omg i love ur layout!!</div>
    <div style="font-size:12px;background:#f1f5f9;padding:6px 8px;border-radius:4px;color:#1e293b;"><b style="color:#0ea5e9;">sk8ergrl:</b> add me back ✨</div>
  </div>
  <div style="display:flex;gap:6px;">
    <input placeholder="leave a shout..." style="flex:1;font-size:12px;padding:8px;border:1px solid #cbd5e1;border-radius:4px;" />
    <button style="font-size:12px;font-weight:700;padding:8px 14px;border:0;border-radius:4px;background:#7c3aed;color:#fff;cursor:pointer;">Post</button>
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
        html: `<div data-wd-sparkletrail-root style="font-family:${F};position:relative;padding:48px 24px;text-align:center;background:var(--fc-bg, #0a0a1a);border-radius:8px;overflow:hidden;cursor:crosshair;">
  <div style="font-size:13px;color:#c9b8ff;">✨ Move your mouse here for a sparkle trail ✨</div>
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
        html: `<div style="font-family:${F};display:inline-flex;align-items:center;gap:10px;padding:10px 14px;background:linear-gradient(180deg,#e8e8e8,#c0c0c0);border:2px outset #ffffff;border-radius:4px;">
  <div style="width:28px;height:28px;flex-shrink:0;border-radius:50%;background:radial-gradient(circle at 35% 35%,#555,#000);display:flex;align-items:center;justify-content:center;">
    <div style="width:6px;height:6px;border-radius:50%;background:#888;"></div>
  </div>
  <div>
    <div style="font-size:10px;font-family:'Courier New',monospace;color:#333;">♫ background_theme.mid</div>
    <audio controls style="height:24px;width:180px;"></audio>
  </div>
</div>`,
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
        html: `<section style="min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:32px;background-image:linear-gradient(rgba(10,15,20,.55),rgba(10,15,20,.55)),url(${PARALLAX_MOUNTAIN});background-attachment:fixed;background-size:cover;background-position:center;font-family:${F};">
  <div style="max-width:720px;">
    <div style="display:inline-block;padding:6px 14px;border:1px solid rgba(255,255,255,.35);border-radius:999px;font-size:12px;color:#fff;letter-spacing:.06em;text-transform:uppercase;margin-bottom:24px;">Est. 2026</div>
    <h1 style="font-size:64px;line-height:1.05;letter-spacing:-0.03em;margin:0 0 20px;color:#fff;">Where ambition meets altitude.</h1>
    <p style="font-size:18px;color:rgba(255,255,255,.85);margin:0 0 32px;">A full-bleed statement hero — the background stays fixed while your content scrolls over it.</p>
    <button style="background:#fff;color:#0a0f14;border:0;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;">Explore</button>
  </div>
</section>`,
      },
      {
        id: "parallax-hero-split",
        label: "Parallax Hero · Split Content",
        html: `<section style="min-height:80vh;display:flex;align-items:center;padding:32px 64px;background-image:linear-gradient(90deg,rgba(8,12,10,.75) 0%,rgba(8,12,10,.25) 55%,rgba(8,12,10,0) 80%),url(${PARALLAX_FOREST});background-attachment:fixed;background-size:cover;background-position:center;font-family:${F};">
  <div style="max-width:480px;">
    <h1 style="font-size:48px;line-height:1.1;letter-spacing:-0.02em;margin:0 0 16px;color:#fff;">Grown, not manufactured.</h1>
    <p style="font-size:16px;color:rgba(255,255,255,.85);margin:0 0 24px;">Content sits in a legible band on the left; the parallax background carries the mood on the right.</p>
    <div style="display:flex;gap:12px;">
      <button style="background:#fff;color:#0a0f14;border:0;padding:12px 22px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">Get started</button>
      <button style="background:transparent;color:#fff;border:1px solid rgba(255,255,255,.5);padding:12px 22px;border-radius:8px;font-size:14px;cursor:pointer;">Learn more</button>
    </div>
  </div>
</section>`,
      },
      {
        id: "parallax-section-quote",
        label: "Parallax Section · Big Quote",
        html: `<section style="padding:140px 32px;text-align:center;background-image:linear-gradient(rgba(6,10,20,.6),rgba(6,10,20,.6)),url(${PARALLAX_OCEAN});background-attachment:fixed;background-size:cover;background-position:center;font-family:${F};">
  <div style="max-width:820px;margin:0 auto;">
    <div style="font-size:64px;line-height:1;color:rgba(255,255,255,.35);font-family:Georgia,serif;margin-bottom:8px;">"</div>
    <p style="font-size:34px;line-height:1.35;letter-spacing:-0.01em;color:#fff;margin:0 0 28px;font-weight:500;">The best interfaces disappear — you stop noticing the tool and start noticing the work.</p>
    <div style="display:flex;align-items:center;justify-content:center;gap:12px;">
      <img src="${AVA[0]}" alt="" style="width:44px;height:44px;border-radius:999px;object-fit:cover;border:2px solid rgba(255,255,255,.4);" />
      <div style="text-align:left;">
        <div style="font-size:14px;font-weight:600;color:#fff;">Nadia Osei</div>
        <div style="font-size:12px;color:rgba(255,255,255,.7);">Creative Director, Tidewater</div>
      </div>
    </div>
  </div>
</section>`,
      },
      {
        id: "parallax-section-stats",
        label: "Parallax Section · Stats Band",
        html: `<section style="padding:88px 32px;background-image:linear-gradient(rgba(15,10,5,.6),rgba(15,10,5,.6)),url(${PARALLAX_DESERT});background-attachment:fixed;background-size:cover;background-position:center;font-family:${F};">
  <div style="max-width:1000px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);gap:24px;text-align:center;">
    <div>
      <div style="font-size:44px;font-weight:700;color:#fff;">14k+</div>
      <div style="font-size:13px;color:rgba(255,255,255,.75);margin-top:6px;">Sites shipped</div>
    </div>
    <div>
      <div style="font-size:44px;font-weight:700;color:#fff;">99.9%</div>
      <div style="font-size:13px;color:rgba(255,255,255,.75);margin-top:6px;">Uptime</div>
    </div>
    <div>
      <div style="font-size:44px;font-weight:700;color:#fff;">38</div>
      <div style="font-size:13px;color:rgba(255,255,255,.75);margin-top:6px;">Countries</div>
    </div>
    <div>
      <div style="font-size:44px;font-weight:700;color:#fff;">4.9★</div>
      <div style="font-size:13px;color:rgba(255,255,255,.75);margin-top:6px;">Average rating</div>
    </div>
  </div>
</section>`,
      },
      {
        id: "parallax-section-cta",
        label: "Parallax Section · CTA Banner",
        html: `<section style="padding:96px 32px;text-align:center;background-image:linear-gradient(rgba(10,20,25,.65),rgba(10,20,25,.65)),url(${PARALLAX_CITY});background-attachment:fixed;background-size:cover;background-position:center;font-family:${F};">
  <h2 style="font-size:38px;letter-spacing:-0.02em;margin:0 0 12px;color:#fff;">Ready when the skyline is.</h2>
  <p style="font-size:16px;color:rgba(255,255,255,.85);margin:0 0 28px;">Start free — upgrade only once you're ready to publish.</p>
  <button style="background:#fff;color:#0a1419;border:0;padding:14px 30px;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer;">Start building free</button>
</section>`,
      },
    ],
  },
];
