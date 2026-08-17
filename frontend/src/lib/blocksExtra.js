// Extra block categories that merge into blocks.js CATEGORIES — a big 2026
// revamp of headers, navbars, footers and video-background tools.
const F = "Manrope,system-ui,sans-serif";
const VID = "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";
const VPOSTER = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&q=70";

export const EXTRA_CATEGORIES = [
  {
    id: "navbars",
    label: "Navbars",
    blocks: [
      {
        id: "nav-centered-logo",
        label: "Centered Logo Nav",
        html: `<nav style="font-family:${F};background:#fff;border-bottom:1px solid #ececec;padding:18px 32px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;">
  <div style="display:flex;gap:22px;font-size:14px;color:#334155;">
    <a href="#" style="color:inherit;text-decoration:none;">Shop</a><a href="#" style="color:inherit;text-decoration:none;">New</a><a href="#" style="color:inherit;text-decoration:none;">About</a>
  </div>
  <div style="text-align:center;font-weight:800;font-size:20px;letter-spacing:.04em;color:#0f172a;">MAISON</div>
  <div style="display:flex;gap:22px;justify-content:flex-end;font-size:14px;color:#334155;">
    <a href="#" style="color:inherit;text-decoration:none;">Journal</a><a href="#" style="color:inherit;text-decoration:none;">Cart (0)</a>
  </div>
</nav>`,
      },
      {
        id: "nav-mega",
        label: "Mega-menu Nav",
        html: `<nav class="wd-mega" style="font-family:${F};background:#fff;border-bottom:1px solid #ececec;padding:16px 32px;display:flex;align-items:center;justify-content:space-between;position:relative;">
  <div style="font-weight:700;font-size:18px;color:#0f172a;">Northwind</div>
  <div style="display:flex;gap:26px;font-size:14px;color:#334155;">
    <div class="wd-mega-item" style="position:relative;"><a href="#" style="color:inherit;text-decoration:none;">Products ▾</a>
      <div class="wd-mega-panel" style="position:absolute;top:32px;left:-20px;width:520px;background:#fff;border:1px solid #ececec;border-radius:14px;box-shadow:0 20px 50px rgba(0,0,0,.12);padding:20px;display:none;grid-template-columns:1fr 1fr;gap:14px;z-index:20;">
        ${[["Analytics","Understand your traffic"],["Automations","Set it and forget it"],["Inbox","One place for messages"],["Reports","Beautiful dashboards"]].map(([t,d])=>`<a href="#" style="text-decoration:none;color:#0f172a;padding:10px;border-radius:10px;display:block;"><div style="font-weight:600;font-size:14px;">${t}</div><div style="font-size:12px;color:#64748b;">${d}</div></a>`).join("")}
      </div>
    </div>
    <a href="#" style="color:inherit;text-decoration:none;">Pricing</a><a href="#" style="color:inherit;text-decoration:none;">Docs</a>
  </div>
  <button style="background:#0f172a;color:#fff;border:0;padding:9px 18px;border-radius:8px;font-size:13px;cursor:pointer;">Get started</button>
  <style>.wd-mega .wd-mega-item:hover .wd-mega-panel{display:grid;}</style>
</nav>`,
      },
      {
        id: "nav-ecommerce",
        label: "E-commerce Nav + Search",
        html: `<nav style="font-family:${F};background:#fff;border-bottom:1px solid #ececec;padding:14px 28px;display:flex;align-items:center;gap:20px;">
  <div style="font-weight:800;font-size:19px;color:#0f172a;">STORE</div>
  <div style="flex:1;max-width:520px;display:flex;align-items:center;background:#f4f5f7;border-radius:10px;padding:9px 14px;gap:8px;">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg>
    <input placeholder="Search products…" style="border:0;background:transparent;outline:none;font-size:14px;width:100%;color:#0f172a;" />
  </div>
  <div style="display:flex;gap:18px;align-items:center;color:#334155;">
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
        html: `<nav style="font-family:${F};background:#0b0b12;padding:14px 24px;display:flex;align-items:center;justify-content:space-between;">
  <div style="font-weight:700;color:#fff;font-size:17px;">◐ Flowly</div>
  <div style="display:flex;gap:4px;background:#161622;border:1px solid #232335;border-radius:999px;padding:4px;">
    ${["Overview","Projects","Team","Settings"].map((t,i)=>`<a href="#" style="text-decoration:none;font-size:13px;padding:7px 16px;border-radius:999px;${i===0?"background:#4f46e5;color:#fff;":"color:#9ca3af;"}">${t}</a>`).join("")}
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
  <div style="background:#4f46e5;color:#fff;text-align:center;font-size:13px;padding:9px 16px;">✦ Free shipping on orders over $50 — <a href="#" style="color:#fff;text-decoration:underline;">Shop now</a></div>
  <header style="background:#fff;border-bottom:1px solid #ececec;padding:18px 32px;display:flex;align-items:center;justify-content:space-between;">
    <div style="font-weight:800;font-size:20px;color:#0f172a;">Brand</div>
    <nav style="display:flex;gap:26px;font-size:14px;color:#334155;"><a href="#" style="color:inherit;text-decoration:none;">Home</a><a href="#" style="color:inherit;text-decoration:none;">Shop</a><a href="#" style="color:inherit;text-decoration:none;">Blog</a></nav>
    <button style="background:#0f172a;color:#fff;border:0;padding:9px 18px;border-radius:8px;font-size:13px;cursor:pointer;">Contact</button>
  </header>
</div>`,
      },
      {
        id: "hdr-dropdown",
        label: "Header + Dropdown",
        html: `<header class="wd-hd" style="font-family:${F};background:#fff;border-bottom:1px solid #ececec;padding:18px 32px;display:flex;align-items:center;justify-content:space-between;position:relative;">
  <div style="font-weight:700;font-size:19px;color:#0f172a;">Vertex</div>
  <nav style="display:flex;gap:26px;font-size:14px;color:#334155;">
    <div class="wd-hd-item" style="position:relative;"><a href="#" style="color:inherit;text-decoration:none;">Solutions ▾</a>
      <div class="wd-hd-menu" style="position:absolute;top:28px;left:0;background:#fff;border:1px solid #ececec;border-radius:12px;box-shadow:0 16px 40px rgba(0,0,0,.1);padding:8px;min-width:200px;display:none;z-index:20;">
        ${["For startups","For agencies","For enterprise"].map(t=>`<a href="#" style="display:block;padding:9px 12px;border-radius:8px;text-decoration:none;color:#0f172a;font-size:14px;">${t}</a>`).join("")}
      </div>
    </div>
    <a href="#" style="color:inherit;text-decoration:none;">Pricing</a><a href="#" style="color:inherit;text-decoration:none;">Company</a>
  </nav>
  <button style="background:#4f46e5;color:#fff;border:0;padding:9px 18px;border-radius:8px;font-size:13px;cursor:pointer;">Sign up</button>
  <style>.wd-hd .wd-hd-item:hover .wd-hd-menu{display:block;}</style>
</header>`,
      },
      {
        id: "hdr-minimal-serif",
        label: "Minimal Serif Header",
        html: `<header style="font-family:Georgia,'Times New Roman',serif;background:#f7f3ec;padding:26px 32px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #e4dccc;">
  <div style="font-size:24px;font-style:italic;color:#1c1a17;">The Quarterly</div>
  <nav style="display:flex;gap:28px;font-size:15px;color:#6b6459;">
    <a href="#" style="color:inherit;text-decoration:none;">Essays</a><a href="#" style="color:inherit;text-decoration:none;">Interviews</a><a href="#" style="color:inherit;text-decoration:none;">Archive</a><a href="#" style="color:inherit;text-decoration:none;">Subscribe</a>
  </nav>
</header>`,
      },
      {
        id: "hdr-dark-cta",
        label: "Dark Header + CTA",
        html: `<header style="font-family:${F};background:#0a0a12;padding:18px 32px;display:flex;align-items:center;justify-content:space-between;">
  <div style="display:flex;align-items:center;gap:10px;"><div style="width:28px;height:28px;background:linear-gradient(135deg,#f43f5e,#fb923c);border-radius:8px;"></div><span style="color:#fff;font-weight:700;font-size:18px;">Ignite</span></div>
  <nav style="display:flex;gap:26px;font-size:14px;color:#9ca3af;"><a href="#" style="color:inherit;text-decoration:none;">Product</a><a href="#" style="color:inherit;text-decoration:none;">Customers</a><a href="#" style="color:inherit;text-decoration:none;">Pricing</a></nav>
  <div style="display:flex;gap:10px;"><button style="background:transparent;color:#fff;border:1px solid #26263a;padding:9px 16px;border-radius:8px;font-size:13px;cursor:pointer;">Log in</button><button style="background:#f43f5e;color:#fff;border:0;padding:9px 18px;border-radius:8px;font-size:13px;cursor:pointer;">Start free</button></div>
</header>`,
      },
      {
        id: "hdr-search-actions",
        label: "Header + Search + Icons",
        html: `<header style="font-family:${F};background:#fff;border-bottom:1px solid #ececec;padding:14px 28px;display:flex;align-items:center;gap:20px;">
  <div style="font-weight:800;font-size:19px;color:#0f172a;">Docs</div>
  <nav style="display:flex;gap:22px;font-size:14px;color:#334155;"><a href="#" style="color:inherit;text-decoration:none;">Guides</a><a href="#" style="color:inherit;text-decoration:none;">API</a><a href="#" style="color:inherit;text-decoration:none;">Examples</a></nav>
  <div style="flex:1;"></div>
  <div style="display:flex;align-items:center;background:#f4f5f7;border-radius:8px;padding:8px 12px;gap:8px;min-width:220px;"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4"/></svg><input placeholder="Search docs ⌘K" style="border:0;background:transparent;outline:none;font-size:13px;width:100%;" /></div>
  <a href="#" style="color:#334155;">◔</a>
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
        html: `<footer style="font-family:${F};background:#fff;border-top:1px solid #ececec;padding:28px 32px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;">
  <div style="font-size:14px;color:#64748b;">© 2026 Brand — All rights reserved.</div>
  <div style="display:flex;gap:20px;font-size:14px;color:#64748b;"><a href="#" style="color:inherit;text-decoration:none;">Privacy</a><a href="#" style="color:inherit;text-decoration:none;">Terms</a><a href="#" style="color:inherit;text-decoration:none;">Contact</a></div>
</footer>`,
      },
      {
        id: "ft-newsletter",
        label: "Newsletter Footer",
        html: `<footer style="font-family:${F};background:#0f172a;color:#cbd5e1;padding:56px 32px;">
  <div style="max-width:900px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center;">
    <div><h3 style="color:#fff;font-size:24px;margin:0 0 8px;">Stay in the loop</h3><p style="margin:0;font-size:14px;color:#94a3b8;">One thoughtful email a week. No spam.</p></div>
    <form style="display:flex;gap:10px;"><input placeholder="you@example.com" style="flex:1;padding:13px 16px;border-radius:10px;border:1px solid #1e293b;background:#0b1220;color:#fff;font-size:14px;" /><button style="padding:13px 22px;background:#4f46e5;color:#fff;border:0;border-radius:10px;font-weight:600;cursor:pointer;">Subscribe</button></form>
  </div>
  <div style="max-width:900px;margin:28px auto 0;padding-top:20px;border-top:1px solid #1e293b;font-size:12px;color:#64748b;">© 2026 Brand.</div>
</footer>`,
      },
      {
        id: "ft-social-dark",
        label: "Social Footer",
        html: `<footer style="font-family:${F};background:#0a0a12;color:#9ca3af;padding:48px 32px;text-align:center;">
  <div style="font-weight:800;color:#fff;font-size:22px;letter-spacing:.04em;margin-bottom:16px;">AURORA</div>
  <div style="display:flex;gap:16px;justify-content:center;margin-bottom:22px;">
    ${["Instagram","X","YouTube","TikTok"].map(s=>`<a href="#" style="color:#9ca3af;text-decoration:none;font-size:13px;border:1px solid #26263a;padding:8px 16px;border-radius:999px;">${s}</a>`).join("")}
  </div>
  <div style="font-size:12px;color:#4b5563;">© 2026 Aurora Studio. Made with care.</div>
</footer>`,
      },
      {
        id: "ft-columns-light",
        label: "4-column Light Footer",
        html: `<footer style="font-family:${F};background:#f8fafc;border-top:1px solid #ececec;padding:56px 32px 36px;">
  <div style="max-width:1120px;margin:0 auto;display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:32px;">
    <div><div style="font-weight:800;font-size:20px;color:#0f172a;margin-bottom:10px;">Brand</div><p style="font-size:13px;color:#64748b;max-width:240px;margin:0;">Design and ship beautiful sites, fast.</p></div>
    ${[["Product",["Features","Pricing","Roadmap"]],["Resources",["Blog","Guides","Support"]],["Company",["About","Careers","Legal"]]].map(([h,ls])=>`<div><div style="font-weight:600;color:#0f172a;font-size:13px;margin-bottom:12px;">${h}</div>${ls.map(l=>`<a href="#" style="display:block;color:#64748b;text-decoration:none;font-size:13px;padding:4px 0;">${l}</a>`).join("")}</div>`).join("")}
  </div>
</footer>`,
      },
      {
        id: "ft-contact",
        label: "Contact Footer",
        html: `<footer style="font-family:${F};background:#111827;color:#d1d5db;padding:52px 32px;">
  <div style="max-width:1000px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr 1fr;gap:28px;">
    <div><div style="font-weight:700;color:#fff;font-size:18px;margin-bottom:10px;">Get in touch</div><p style="font-size:14px;margin:0;line-height:1.9;">hello@example.com<br/>+1 (555) 019-2834<br/>24 Harbour St, Suite 400</p></div>
    <div><div style="font-weight:600;color:#fff;font-size:13px;margin-bottom:12px;">Hours</div><p style="font-size:14px;margin:0;line-height:1.9;">Mon–Fri · 9–6<br/>Sat · 10–4<br/>Sun · Closed</p></div>
    <div><div style="font-weight:600;color:#fff;font-size:13px;margin-bottom:12px;">Follow</div><p style="font-size:14px;margin:0;line-height:1.9;">Instagram<br/>LinkedIn<br/>YouTube</p></div>
  </div>
  <div style="max-width:1000px;margin:28px auto 0;padding-top:18px;border-top:1px solid #1f2937;font-size:12px;color:#6b7280;">© 2026 Brand.</div>
</footer>`,
      },
      {
        id: "ft-app-download",
        label: "App Download Footer",
        html: `<footer style="font-family:${F};background:linear-gradient(135deg,#4f46e5,#0ea5e9);color:#fff;padding:52px 32px;text-align:center;">
  <h3 style="font-size:26px;margin:0 0 10px;">Take it everywhere</h3>
  <p style="margin:0 0 22px;opacity:.9;font-size:15px;">Download the app for iOS and Android.</p>
  <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
    <a href="#" style="background:#0f172a;color:#fff;text-decoration:none;padding:12px 22px;border-radius:12px;font-size:14px;">↧ App Store</a>
    <a href="#" style="background:#0f172a;color:#fff;text-decoration:none;padding:12px 22px;border-radius:12px;font-size:14px;">↧ Google Play</a>
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
        html: `<section style="font-family:${F};background:#0b0b12;color:#fff;padding:72px 32px;">
  <div style="max-width:1120px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;">
    <div style="position:relative;border-radius:18px;overflow:hidden;aspect-ratio:16/10;"><video autoplay muted loop playsinline poster="${VPOSTER}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;"><source src="${VID}" type="video/mp4" /></video></div>
    <div>
      <div style="color:#22d3ee;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin-bottom:14px;">See it in action</div>
      <h2 style="font-size:38px;letter-spacing:-.02em;margin:0 0 16px;">Built to move</h2>
      <p style="font-size:17px;line-height:1.7;color:#9ca3af;margin:0 0 24px;">Pair looping product footage with crisp copy. The video autoplays muted and loops seamlessly on every device.</p>
      <a href="#" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:13px 26px;border-radius:10px;font-weight:600;">Learn more</a>
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
];
