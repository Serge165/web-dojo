// Prebuilt block templates. Each block returns a raw HTML string with inline
// styles so the exported output is portable/standalone.

const heroImg = "https://images.unsplash.com/photo-1488972685288-c3fd157d7c7a?crop=entropy&cs=srgb&fm=jpg&w=1600&q=80";
const avatarImg = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=entropy&cs=srgb&fm=jpg&w=400&q=80";
const g1 = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=70";
const g2 = "https://images.unsplash.com/photo-1520975916090-3105956dac38?w=800&q=70";
const g3 = "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=70";
const g4 = "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=800&q=70";
const g5 = "https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?w=800&q=70";
const g6 = "https://images.unsplash.com/photo-1441829266145-6d4bfbf99bd8?w=800&q=70";

import { EXTRA_CATEGORIES } from "./blocksExtra";

const CORE_CATEGORIES = [
  {
    id: "components",
    label: "Components",
    blocks: [
      {
        id: "cmp-gallery-grid",
        label: "Gallery · 3-col Grid",
        html: `<section style="padding:64px 32px;background:var(--fc-bg, #ffffff);font-family:Manrope,sans-serif;">
  <div style="max-width:1120px;margin:0 auto;">
    <h2 style="font-size:32px;letter-spacing:-0.02em;margin:0 0 24px;color:var(--fc-text, #0f172a);">Gallery</h2>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
      <img src="${g1}" style="width:100%;height:220px;object-fit:cover;border-radius:12px;" alt="" />
      <img src="${g2}" style="width:100%;height:220px;object-fit:cover;border-radius:12px;" alt="" />
      <img src="${g3}" style="width:100%;height:220px;object-fit:cover;border-radius:12px;" alt="" />
      <img src="${g4}" style="width:100%;height:220px;object-fit:cover;border-radius:12px;" alt="" />
      <img src="${g5}" style="width:100%;height:220px;object-fit:cover;border-radius:12px;" alt="" />
      <img src="${g6}" style="width:100%;height:220px;object-fit:cover;border-radius:12px;" alt="" />
    </div>
  </div>
</section>`,
      },
      {
        id: "cmp-gallery-masonry",
        label: "Gallery · Masonry",
        html: `<section style="padding:64px 32px;background:var(--fc-bg, #0f172a);font-family:Manrope,sans-serif;">
  <div style="max-width:1120px;margin:0 auto;">
    <h2 style="font-size:32px;letter-spacing:-0.02em;margin:0 0 24px;color:var(--fc-text, #ffffff);">Curated</h2>
    <div style="column-count:3;column-gap:12px;">
      <img src="${g1}" style="width:100%;margin-bottom:12px;border-radius:12px;display:block;" alt="" />
      <img src="${g3}" style="width:100%;margin-bottom:12px;border-radius:12px;display:block;" alt="" />
      <img src="${g5}" style="width:100%;margin-bottom:12px;border-radius:12px;display:block;" alt="" />
      <img src="${g2}" style="width:100%;margin-bottom:12px;border-radius:12px;display:block;" alt="" />
      <img src="${g4}" style="width:100%;margin-bottom:12px;border-radius:12px;display:block;" alt="" />
      <img src="${g6}" style="width:100%;margin-bottom:12px;border-radius:12px;display:block;" alt="" />
    </div>
  </div>
</section>`,
      },
      {
        id: "cmp-gallery-carousel",
        label: "Gallery · Scroll Carousel",
        html: `<section style="padding:56px 0;background:var(--fc-bg, #fafafa);font-family:Manrope,sans-serif;">
  <div style="max-width:1120px;margin:0 auto 20px;padding:0 32px;">
    <h2 style="font-size:32px;letter-spacing:-0.02em;margin:0;color:var(--fc-text, #0f172a);">Featured</h2>
  </div>
  <div style="display:flex;gap:14px;overflow-x:auto;padding:0 32px 20px;scroll-snap-type:x mandatory;">
    ${[g1,g2,g3,g4,g5,g6].map(u=>`<img src="${u}" style="height:320px;min-width:420px;object-fit:cover;border-radius:16px;scroll-snap-align:start;" alt="" />`).join("")}
  </div>
</section>`,
      },
      {
        id: "cmp-gallery-hover",
        label: "Gallery · Hover Zoom",
        html: `<section style="padding:64px 32px;background:var(--fc-bg, #ffffff);font-family:Manrope,sans-serif;">
  <div style="max-width:1120px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">
    ${[g1,g2,g3,g4,g5,g6,g1,g2].map(u=>`<div style="overflow:hidden;border-radius:10px;aspect-ratio:1/1;"><img src="${u}" style="width:100%;height:100%;object-fit:cover;transition:transform 400ms cubic-bezier(.22,1,.36,1);" onmouseover="this.style.transform='scale(1.08)'" onmouseout="this.style.transform='scale(1)'" alt="" /></div>`).join("")}
  </div>
</section>`,
      },
      {
        id: "cmp-gallery-polaroid",
        label: "Gallery · Polaroid Stack",
        html: `<section style="padding:80px 32px;background:var(--fc-bg, #f5efe6);font-family:Manrope,sans-serif;">
  <div style="max-width:1120px;margin:0 auto;display:flex;flex-wrap:wrap;justify-content:center;gap:28px;">
    ${[[g1,-6],[g2,4],[g3,-3],[g4,6],[g5,-4],[g6,3]].map(([u,r])=>`<figure style="background:var(--fc-surface, #fff);padding:12px 12px 28px;box-shadow:0 12px 30px rgba(0,0,0,.12);transform:rotate(${r}deg);"><img src="${u}" style="display:block;width:240px;height:200px;object-fit:cover;" alt="" /><figcaption style="text-align:center;font-family:'Courier New',monospace;font-size:12px;margin-top:8px;color:var(--fc-muted, #333);">memory</figcaption></figure>`).join("")}
  </div>
</section>`,
      },
      {
        id: "cmp-gallery-lightbox",
        label: "Gallery · Featured + Thumbs",
        html: `<section style="padding:64px 32px;background:var(--fc-bg, #ffffff);font-family:Manrope,sans-serif;">
  <div style="max-width:1120px;margin:0 auto;display:grid;grid-template-columns:2fr 1fr;gap:12px;grid-auto-rows:220px;">
    <img src="${g1}" style="grid-row:span 2;width:100%;height:100%;object-fit:cover;border-radius:14px;" alt="" />
    <img src="${g2}" style="width:100%;height:100%;object-fit:cover;border-radius:14px;" alt="" />
    <img src="${g3}" style="width:100%;height:100%;object-fit:cover;border-radius:14px;" alt="" />
  </div>
</section>`,
      },
      {
        id: "cmp-header-lrg",
        label: "Large Header",
        html: `<header style="padding:24px 32px;background:var(--fc-bg, #ffffff);border-bottom:1px solid var(--fc-border, #e5e7eb);font-family:Manrope,sans-serif;">
  <div style="display:flex;align-items:center;justify-content:space-between;max-width:1120px;margin:0 auto;">
    <div style="display:flex;align-items:center;gap:12px;">
      <div style="width:32px;height:32px;background:#0f172a;border-radius:8px;"></div>
      <span style="font-size:20px;font-weight:700;color:var(--fc-text, #0f172a);">Brand</span>
    </div>
    <nav style="display:flex;gap:28px;font-size:14px;color:var(--fc-muted, #334155);">
      <a href="#" style="color:inherit;text-decoration:none;">Products</a>
      <a href="#" style="color:inherit;text-decoration:none;">Solutions</a>
      <a href="#" style="color:inherit;text-decoration:none;">Docs</a>
      <a href="#" style="color:inherit;text-decoration:none;">Pricing</a>
    </nav>
    <div style="display:flex;gap:8px;">
      <button style="background:transparent;color:var(--fc-text, #0f172a);border:1px solid var(--fc-border, #e5e7eb);padding:8px 14px;border-radius:8px;font-size:13px;cursor:pointer;">Sign in</button>
      <button style="background:var(--fc-primary, #0f172a);color:#fff;border:0;padding:8px 14px;border-radius:8px;font-size:13px;cursor:pointer;">Get started</button>
    </div>
  </div>
</header>`,
      },
      {
        id: "cmp-nav-glass",
        label: "Glass Navbar",
        html: `<nav style="position:sticky;top:0;padding:14px 28px;background:rgba(255,255,255,0.62);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid rgba(0,0,0,0.06);font-family:Manrope,sans-serif;display:flex;align-items:center;justify-content:space-between;z-index:10;">
  <div style="font-weight:700;color:var(--fc-text, #0f172a);">◤ Aurora</div>
  <div style="display:flex;gap:24px;font-size:14px;color:var(--fc-text, #0f172a);">
    <a href="#" style="color:inherit;text-decoration:none;">Home</a>
    <a href="#" style="color:inherit;text-decoration:none;">Work</a>
    <a href="#" style="color:inherit;text-decoration:none;">Contact</a>
  </div>
  <button style="background:var(--fc-primary, #0f172a);color:#fff;border:0;padding:8px 16px;border-radius:999px;font-size:13px;cursor:pointer;">Join</button>
</nav>`,
      },
      {
        id: "cmp-anim-hero",
        label: "Animated Hero",
        html: `<section style="padding:120px 32px;background:linear-gradient(135deg,#0ea5e9 0%,#8b5cf6 100%);color:#fff;text-align:center;font-family:Manrope,sans-serif;overflow:hidden;position:relative;">
  <h1 style="font-size:60px;letter-spacing:-0.03em;line-height:1.05;margin:0 0 16px;animation:forge-slide-up 700ms cubic-bezier(.22,1,.36,1) both;">Design in motion.</h1>
  <p style="font-size:18px;max-width:640px;margin:0 auto 28px;color:rgba(255,255,255,0.85);animation:forge-slide-up 900ms cubic-bezier(.22,1,.36,1) both;animation-delay:120ms;">A studio-grade website builder with real-time animations, themes and export.</p>
  <button style="background:#fff;color:#0f172a;border:0;padding:14px 26px;border-radius:999px;font-size:15px;cursor:pointer;font-weight:600;animation:forge-pop 900ms cubic-bezier(.22,1,.36,1) both;animation-delay:220ms;">Start creating</button>
  <style>@keyframes forge-slide-up{0%{opacity:0;transform:translateY(28px)}100%{opacity:1;transform:translateY(0)}}@keyframes forge-pop{0%{opacity:0;transform:scale(.6)}60%{transform:scale(1.06)}100%{opacity:1;transform:scale(1)}}</style>
</section>`,
      },
      {
        id: "cmp-anim-marquee",
        label: "Animated Marquee",
        html: `<section style="padding:32px 0;background:var(--fc-bg, #0f172a);color:var(--fc-text, #fff);overflow:hidden;font-family:Manrope,sans-serif;">
  <div style="display:flex;gap:48px;white-space:nowrap;animation:forge-marquee 22s linear infinite;font-size:28px;letter-spacing:-0.02em;">
    <span>◆ Design</span><span>◆ Build</span><span>◆ Ship</span><span>◆ Repeat</span>
    <span>◆ Design</span><span>◆ Build</span><span>◆ Ship</span><span>◆ Repeat</span>
  </div>
  <style>@keyframes forge-marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}</style>
</section>`,
      },
      {
        id: "cmp-testimonial",
        label: "Testimonial",
        html: `<section style="padding:80px 32px;background:var(--fc-bg, #fafafa);font-family:Manrope,sans-serif;">
  <div style="max-width:820px;margin:0 auto;text-align:center;">
    <div style="font-size:80px;color:var(--fc-muted, #cbd5e1);line-height:1;margin-bottom:-24px;">“</div>
    <p style="font-size:26px;letter-spacing:-0.01em;line-height:1.35;color:var(--fc-text, #0f172a);margin:0 0 24px;">Web Dojo changed the way our team ships marketing pages. We went from 2 weeks to 2 days.</p>
    <div style="display:flex;align-items:center;justify-content:center;gap:12px;">
      <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=entropy&cs=srgb&fm=jpg&w=200&q=80" style="width:44px;height:44px;border-radius:999px;object-fit:cover;" alt="" />
      <div style="text-align:left;"><div style="font-weight:600;color:var(--fc-text, #0f172a);font-size:14px;">Alex Rivera</div><div style="font-size:12px;color:var(--fc-muted, #64748b);">Head of Design, Northwind</div></div>
    </div>
  </div>
</section>`,
      },
      {
        id: "cmp-pricing-3",
        label: "Pricing (3-col)",
        html: `<section style="padding:80px 32px;background:var(--fc-bg, #ffffff);font-family:Manrope,sans-serif;">
  <div style="max-width:1120px;margin:0 auto;">
    <h2 style="font-size:36px;letter-spacing:-0.02em;margin:0 0 32px;color:var(--fc-text, #0f172a);text-align:center;">Simple pricing</h2>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;">
      <div style="padding:28px;border:1px solid var(--fc-border, #e5e7eb);border-radius:14px;background:var(--fc-surface, #fff);">
        <div style="font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:var(--fc-muted, #64748b);margin-bottom:8px;">Free</div>
        <div style="font-size:44px;font-weight:700;color:var(--fc-text, #0f172a);margin-bottom:6px;">$0</div>
        <div style="font-size:13px;color:var(--fc-muted, #64748b);margin-bottom:20px;">Forever</div>
        <button style="width:100%;background:var(--fc-surface, #f1f5f9);color:var(--fc-text, #0f172a);border:0;padding:10px 14px;border-radius:10px;font-size:14px;cursor:pointer;">Start free</button>
      </div>
      <div style="padding:28px;border:2px solid #0f172a;border-radius:14px;background:#0f172a;color:#fff;transform:scale(1.02);">
        <div style="font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;margin-bottom:8px;">Pro</div>
        <div style="font-size:44px;font-weight:700;margin-bottom:6px;">$19</div>
        <div style="font-size:13px;color:#94a3b8;margin-bottom:20px;">per month</div>
        <button style="width:100%;background:#fff;color:#0f172a;border:0;padding:10px 14px;border-radius:10px;font-size:14px;cursor:pointer;font-weight:600;">Choose Pro</button>
      </div>
      <div style="padding:28px;border:1px solid var(--fc-border, #e5e7eb);border-radius:14px;background:var(--fc-surface, #fff);">
        <div style="font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:var(--fc-muted, #64748b);margin-bottom:8px;">Team</div>
        <div style="font-size:44px;font-weight:700;color:var(--fc-text, #0f172a);margin-bottom:6px;">$49</div>
        <div style="font-size:13px;color:var(--fc-muted, #64748b);margin-bottom:20px;">per user / month</div>
        <button style="width:100%;background:var(--fc-surface, #f1f5f9);color:var(--fc-text, #0f172a);border:0;padding:10px 14px;border-radius:10px;font-size:14px;cursor:pointer;">Contact us</button>
      </div>
    </div>
  </div>
</section>`,
      },
      {
        id: "cmp-footer",
        label: "Footer",
        html: `<footer style="padding:56px 32px 32px;background:var(--fc-bg, #0f172a);color:var(--fc-muted, #cbd5e1);font-family:Manrope,sans-serif;">
  <div style="max-width:1120px;margin:0 auto;display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:32px;">
    <div>
      <div style="font-size:18px;font-weight:700;color:var(--fc-text, #fff);margin-bottom:8px;">◤ Web Dojo</div>
      <p style="font-size:13px;color:var(--fc-muted, #94a3b8);margin:0;max-width:280px;">Design and ship faster. Built for humans, powered by the web.</p>
    </div>
    <div><div style="font-weight:600;color:var(--fc-text, #fff);margin-bottom:8px;font-size:13px;">Product</div><ul style="list-style:none;padding:0;margin:0;font-size:13px;line-height:2;"><li>Features</li><li>Pricing</li><li>Changelog</li></ul></div>
    <div><div style="font-weight:600;color:var(--fc-text, #fff);margin-bottom:8px;font-size:13px;">Company</div><ul style="list-style:none;padding:0;margin:0;font-size:13px;line-height:2;"><li>About</li><li>Blog</li><li>Careers</li></ul></div>
    <div><div style="font-weight:600;color:var(--fc-text, #fff);margin-bottom:8px;font-size:13px;">Legal</div><ul style="list-style:none;padding:0;margin:0;font-size:13px;line-height:2;"><li>Terms</li><li>Privacy</li></ul></div>
  </div>
  <div style="border-top:1px solid var(--fc-border, #1e293b);margin-top:32px;padding-top:20px;text-align:center;font-size:12px;color:var(--fc-muted, #64748b);">© 2026 Web Dojo. All rights reserved.</div>
</footer>`,
      },
    ],
  },
  {
    id: "timelines",
    label: "Timelines",
    blocks: [
      {
        id: "cmp-timeline-vert",
        label: "Vertical Timeline",
        html: `<section style="padding:80px 32px;background:var(--fc-bg, #ffffff);font-family:Manrope,sans-serif;">
  <div style="max-width:720px;margin:0 auto;">
    <h2 style="font-size:32px;letter-spacing:-0.02em;margin:0 0 32px;color:var(--fc-text, #0f172a);">Our journey</h2>
    <ol style="list-style:none;padding:0;margin:0;border-left:2px solid var(--fc-border, #e5e7eb);">
      ${[
        ["2021","Founded","Started in a small studio with three founders and a shared laptop."],
        ["2022","Product launch","Shipped v1 to 400 early users during a two-week beta."],
        ["2023","Series A","Raised $8M to expand the team and reach new markets."],
        ["2024","Global reach","Opened offices in Berlin and Singapore, hit 50k users."],
        ["Today","Still shipping","10 products, 120 teammates, one mission."],
      ].map(([year,title,desc])=>`<li style="position:relative;padding:0 0 32px 24px;">
        <span style="position:absolute;left:-9px;top:4px;width:16px;height:16px;border-radius:999px;background:var(--fc-primary, #2563eb);border:3px solid var(--fc-bg, #ffffff);box-shadow:0 0 0 2px var(--fc-primary, #2563eb);"></span>
        <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--fc-muted, #64748b);margin-bottom:4px;">${year}</div>
        <div style="font-size:18px;font-weight:600;color:var(--fc-text, #0f172a);margin-bottom:4px;">${title}</div>
        <p style="margin:0;font-size:14px;color:var(--fc-muted, #475569);line-height:1.55;">${desc}</p>
      </li>`).join("")}
    </ol>
  </div>
</section>`,
      },
      {
        id: "cmp-timeline-alt",
        label: "Alternating Timeline",
        html: `<section style="padding:80px 32px;background:var(--fc-bg, #fafafa);font-family:Manrope,sans-serif;">
  <div style="max-width:900px;margin:0 auto;position:relative;">
    <h2 style="font-size:32px;letter-spacing:-0.02em;margin:0 0 32px;color:var(--fc-text, #0f172a);text-align:center;">Milestones</h2>
    <div style="position:absolute;left:50%;top:120px;bottom:0;width:2px;background:var(--fc-border, #e2e8f0);transform:translateX(-50%);"></div>
    ${[
      ["Q1","Concept sprint","Whiteboarding sessions and 12 prototypes.",true],
      ["Q2","Closed beta","Invited 200 makers to shape the product.",false],
      ["Q3","Public launch","Grew to 15k signups in the first month.",true],
      ["Q4","Team scale","Doubled the design and eng teams.",false],
    ].map(([tag,title,desc,left])=>`
      <div style="display:grid;grid-template-columns:1fr 24px 1fr;align-items:flex-start;gap:16px;margin-bottom:36px;">
        <div style="text-align:${left?"right":"left"};grid-column:${left?"1":"3"};padding:${left?"0 24px 0 0":"0 0 0 24px"};">
          <div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--fc-primary, #2563eb);margin-bottom:6px;">${tag}</div>
          <div style="font-size:18px;font-weight:600;color:var(--fc-text, #0f172a);margin-bottom:4px;">${title}</div>
          <p style="margin:0;font-size:14px;color:var(--fc-muted, #64748b);line-height:1.55;">${desc}</p>
        </div>
        <div style="grid-column:2;display:flex;justify-content:center;padding-top:6px;">
          <span style="width:14px;height:14px;border-radius:999px;background:var(--fc-primary, #2563eb);box-shadow:0 0 0 4px var(--fc-bg, #ffffff), 0 0 0 6px var(--fc-primary, #2563eb);"></span>
        </div>
      </div>`).join("")}
  </div>
</section>`,
      },
      {
        id: "cmp-timeline-hori",
        label: "Horizontal Timeline",
        html: `<section style="padding:80px 32px;background:var(--fc-bg, #0f172a);color:var(--fc-text, #ffffff);font-family:Manrope,sans-serif;">
  <div style="max-width:1120px;margin:0 auto;">
    <h2 style="font-size:32px;letter-spacing:-0.02em;margin:0 0 40px;color:var(--fc-text, #ffffff);">Roadmap 2026</h2>
    <div style="position:relative;padding-top:24px;">
      <div style="position:absolute;left:0;right:0;top:36px;height:2px;background:var(--fc-border, #1e293b);"></div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:24px;position:relative;">
        ${[
          ["Q1","Foundations","Refactor + design system"],
          ["Q2","AI Studio","Prompt-to-page module"],
          ["Q3","Team spaces","Multi-user + comments"],
          ["Q4","Marketplace","Sell templates on-platform"],
        ].map(([q,t,d],i,arr)=>`<div style="text-align:center;">
          <span style="display:inline-block;width:16px;height:16px;border-radius:999px;background:${i===0?"var(--fc-accent, #22d3ee)":"var(--fc-border, #334155)"};border:3px solid var(--fc-bg, #0f172a);box-shadow:0 0 0 2px ${i===0?"var(--fc-accent, #22d3ee)":"var(--fc-border, #334155)"};margin-bottom:24px;"></span>
          <div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--fc-muted, #94a3b8);margin-bottom:4px;">${q}</div>
          <div style="font-size:16px;font-weight:600;color:var(--fc-text, #ffffff);margin-bottom:4px;">${t}</div>
          <p style="margin:0;font-size:13px;color:var(--fc-muted, #94a3b8);line-height:1.5;">${d}</p>
        </div>`).join("")}
      </div>
    </div>
  </div>
</section>`,
      },
      {
        id: "cmp-timeline-cards",
        label: "Card Timeline",
        html: `<section style="padding:80px 32px;background:var(--fc-bg, #ffffff);font-family:Manrope,sans-serif;">
  <div style="max-width:920px;margin:0 auto;">
    <h2 style="font-size:32px;letter-spacing:-0.02em;margin:0 0 32px;color:var(--fc-text, #0f172a);">Release history</h2>
    <div style="display:flex;flex-direction:column;gap:16px;">
      ${[
        ["v3.0","Feb 2026","Contextual editors, timeline blocks, and CDN library."],
        ["v2.4","Jan 2026","Component marketplace + file tree with drag-drop imports."],
        ["v2.0","Nov 2025","Grid & Flexbox layout builders, aesthetic themes."],
        ["v1.0","Aug 2025","First public release with WYSIWYG editor and code mode."],
      ].map(([ver,date,note])=>`<article style="display:grid;grid-template-columns:120px 12px 1fr;align-items:start;gap:20px;padding:20px;border:1px solid var(--fc-border, #e5e7eb);border-radius:14px;background:var(--fc-surface, #ffffff);">
        <div>
          <div style="font-size:18px;font-weight:700;color:var(--fc-text, #0f172a);">${ver}</div>
          <div style="font-size:12px;color:var(--fc-muted, #64748b);">${date}</div>
        </div>
        <div style="width:2px;height:100%;background:var(--fc-border, #e5e7eb);position:relative;">
          <span style="position:absolute;left:-4px;top:6px;width:10px;height:10px;border-radius:999px;background:var(--fc-primary, #2563eb);"></span>
        </div>
        <p style="margin:0;font-size:14px;color:var(--fc-muted, #334155);line-height:1.6;">${note}</p>
      </article>`).join("")}
    </div>
  </div>
</section>`,
      },
      {
        id: "cmp-timeline-steps",
        label: "Numbered Steps",
        html: `<section style="padding:80px 32px;background:var(--fc-bg, #f5f0ea);font-family:Manrope,sans-serif;">
  <div style="max-width:960px;margin:0 auto;">
    <h2 style="font-size:32px;letter-spacing:-0.02em;margin:0 0 32px;color:var(--fc-text, #1e293b);">How it works</h2>
    <ol style="counter-reset:step;list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(4,1fr);gap:20px;">
      ${["Sign up","Design","Preview","Ship"].map((title,i)=>`<li style="counter-increment:step;position:relative;padding:24px;background:var(--fc-surface, #ffffff);border-radius:16px;border:1px solid var(--fc-border, #e7e2d8);">
        <span style="position:absolute;top:-14px;left:24px;display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:999px;background:var(--fc-primary, #1e293b);color:#ffffff;font-weight:700;font-size:14px;">${i+1}</span>
        <div style="font-size:16px;font-weight:600;color:var(--fc-text, #0f172a);margin:12px 0 4px;">${title}</div>
        <p style="margin:0;font-size:13px;color:var(--fc-muted, #64748b);line-height:1.55;">Short description of step ${i+1} — what happens and why it matters.</p>
      </li>`).join("")}
    </ol>
  </div>
</section>`,
      },
    ],
  },
  {
    id: "navbars",
    label: "Navbars",
    blocks: [
      {
        id: "nav-simple",
        label: "Simple Navbar",
        html: `<nav style="display:flex;align-items:center;justify-content:space-between;padding:18px 32px;border-bottom:1px solid var(--fc-border, #e5e7eb);background:var(--fc-bg, #ffffff);font-family:Manrope,sans-serif;">
  <div style="font-weight:700;font-size:18px;color:var(--fc-text, #0f172a);">Brand</div>
  <div style="display:flex;gap:24px;font-size:14px;color:var(--fc-muted, #334155);">
    <a href="#" style="color:inherit;text-decoration:none;">Home</a>
    <a href="#" style="color:inherit;text-decoration:none;">Features</a>
    <a href="#" style="color:inherit;text-decoration:none;">Pricing</a>
    <a href="#" style="color:inherit;text-decoration:none;">Contact</a>
  </div>
  <button style="background:var(--fc-primary, #0f172a);color:#fff;border:0;padding:8px 16px;border-radius:6px;font-size:13px;cursor:pointer;">Sign up</button>
</nav>`,
      },
      {
        id: "nav-dark",
        label: "Dark Navbar",
        html: `<nav style="display:flex;align-items:center;justify-content:space-between;padding:16px 32px;background:var(--fc-bg, #0b0b0b);color:var(--fc-text, #f3f4f6);font-family:Manrope,sans-serif;">
  <div style="font-weight:700;font-size:18px;letter-spacing:-0.02em;">◤ Studio</div>
  <div style="display:flex;gap:24px;font-size:14px;color:var(--fc-muted, #9ca3af);">
    <a href="#" style="color:inherit;text-decoration:none;">Work</a>
    <a href="#" style="color:inherit;text-decoration:none;">About</a>
    <a href="#" style="color:inherit;text-decoration:none;">Journal</a>
  </div>
  <button style="background:var(--fc-primary, #2563eb);color:#fff;border:0;padding:8px 16px;border-radius:6px;font-size:13px;cursor:pointer;">Contact</button>
</nav>`,
      },
    ],
  },
  {
    id: "heroes",
    label: "Heroes",
    blocks: [
      {
        id: "hero-centered",
        label: "Centered Hero",
        html: `<section style="padding:96px 32px;text-align:center;background:var(--fc-bg, #fafafa);font-family:Manrope,sans-serif;">
  <div style="max-width:720px;margin:0 auto;">
    <div style="display:inline-block;padding:6px 12px;border:1px solid var(--fc-border, #e5e7eb);border-radius:999px;font-size:12px;color:var(--fc-muted, #475569);margin-bottom:20px;">New · v1.0 released</div>
    <h1 style="font-size:56px;line-height:1.05;letter-spacing:-0.03em;margin:0 0 20px;color:var(--fc-text, #0f172a);">Build faster. Ship sharper.</h1>
    <p style="font-size:18px;color:var(--fc-muted, #475569);margin:0 0 32px;">A studio-grade website builder that gets out of your way. Drag, drop, and export production HTML.</p>
    <div style="display:flex;gap:12px;justify-content:center;">
      <button style="background:var(--fc-primary, #0f172a);color:#fff;border:0;padding:12px 22px;border-radius:8px;font-size:14px;cursor:pointer;">Get started</button>
      <button style="background:var(--fc-surface, #fff);color:var(--fc-text, #0f172a);border:1px solid var(--fc-border, #e5e7eb);padding:12px 22px;border-radius:8px;font-size:14px;cursor:pointer;">Live demo</button>
    </div>
  </div>
</section>`,
      },
      {
        id: "hero-split",
        label: "Split Hero",
        html: `<section style="display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;padding:80px 32px;background:var(--fc-bg, #ffffff);font-family:Manrope,sans-serif;">
  <div>
    <h1 style="font-size:48px;line-height:1.1;letter-spacing:-0.02em;margin:0 0 16px;color:var(--fc-text, #0f172a);">A canvas for the web.</h1>
    <p style="font-size:16px;color:var(--fc-muted, #475569);margin:0 0 24px;">Design in the browser. Import any HTML. Export standalone files. No lock-in.</p>
    <button style="background:var(--fc-primary, #2563eb);color:#fff;border:0;padding:12px 22px;border-radius:8px;font-size:14px;cursor:pointer;">Start building</button>
  </div>
  <img src="${heroImg}" alt="hero" style="width:100%;height:360px;object-fit:cover;border-radius:12px;" />
</section>`,
      },
    ],
  },
  {
    id: "sections",
    label: "Sections",
    blocks: [
      {
        id: "section-feature",
        label: "Feature Grid",
        html: `<section style="padding:80px 32px;background:var(--fc-bg, #ffffff);font-family:Manrope,sans-serif;">
  <div style="max-width:1120px;margin:0 auto;">
    <h2 style="font-size:36px;letter-spacing:-0.02em;margin:0 0 40px;color:var(--fc-text, #0f172a);">Everything you need.</h2>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;">
      <div style="padding:24px;border:1px solid var(--fc-border, #e5e7eb);border-radius:12px;">
        <div style="width:36px;height:36px;background:#0f172a;border-radius:8px;margin-bottom:12px;"></div>
        <h3 style="font-size:18px;margin:0 0 8px;color:var(--fc-text, #0f172a);">Drag & Drop</h3>
        <p style="font-size:14px;color:var(--fc-muted, #64748b);margin:0;">Assemble pages visually with a snappy grid.</p>
      </div>
      <div style="padding:24px;border:1px solid var(--fc-border, #e5e7eb);border-radius:12px;">
        <div style="width:36px;height:36px;background:#2563eb;border-radius:8px;margin-bottom:12px;"></div>
        <h3 style="font-size:18px;margin:0 0 8px;color:var(--fc-text, #0f172a);">Code Mode</h3>
        <p style="font-size:14px;color:var(--fc-muted, #64748b);margin:0;">Drop into raw HTML whenever you need power.</p>
      </div>
      <div style="padding:24px;border:1px solid var(--fc-border, #e5e7eb);border-radius:12px;">
        <div style="width:36px;height:36px;background:#10b981;border-radius:8px;margin-bottom:12px;"></div>
        <h3 style="font-size:18px;margin:0 0 8px;color:var(--fc-text, #0f172a);">Export</h3>
        <p style="font-size:14px;color:var(--fc-muted, #64748b);margin:0;">One click, ready-to-host HTML & CSS.</p>
      </div>
    </div>
  </div>
</section>`,
      },
      {
        id: "section-cta",
        label: "CTA Banner",
        html: `<section style="padding:64px 32px;background:var(--fc-bg, #0f172a);color:var(--fc-text, #fff);text-align:center;font-family:Manrope,sans-serif;">
  <h2 style="font-size:32px;letter-spacing:-0.02em;margin:0 0 12px;">Ready to ship?</h2>
  <p style="font-size:16px;color:var(--fc-muted, #cbd5e1);margin:0 0 24px;">Export production HTML in a single click.</p>
  <button style="background:var(--fc-surface, #fff);color:var(--fc-text, #0f172a);border:0;padding:12px 22px;border-radius:8px;font-size:14px;cursor:pointer;">Start now</button>
</section>`,
      },
    ],
  },
  {
    id: "containers",
    label: "Containers",
    blocks: [
      {
        id: "container-basic",
        label: "Container",
        html: `<div style="max-width:1120px;margin:0 auto;padding:32px;background:var(--fc-bg, #ffffff);font-family:Manrope,sans-serif;">
  <p style="color:var(--fc-muted, #334155);font-size:15px;">A responsive container. Drop content inside.</p>
</div>`,
      },
      {
        id: "container-2col",
        label: "2 Columns",
        html: `<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;padding:32px;background:var(--fc-bg, #ffffff);font-family:Manrope,sans-serif;">
  <div style="padding:24px;background:var(--fc-surface, #f8fafc);border-radius:8px;">Column A</div>
  <div style="padding:24px;background:var(--fc-surface, #f8fafc);border-radius:8px;">Column B</div>
</div>`,
      },
      {
        id: "container-3col",
        label: "3 Columns",
        html: `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;padding:32px;background:var(--fc-bg, #ffffff);font-family:Manrope,sans-serif;">
  <div style="padding:24px;background:var(--fc-surface, #f8fafc);border-radius:8px;">A</div>
  <div style="padding:24px;background:var(--fc-surface, #f8fafc);border-radius:8px;">B</div>
  <div style="padding:24px;background:var(--fc-surface, #f8fafc);border-radius:8px;">C</div>
</div>`,
      },
    ],
  },
  {
    id: "text",
    label: "Text",
    blocks: [
      { id: "text-h1", label: "Heading 1", html: `<h1 style="font-family:Manrope,sans-serif;font-size:48px;letter-spacing:-0.02em;margin:24px 32px;color:var(--fc-text, #0f172a);">Heading 1</h1>` },
      { id: "text-h2", label: "Heading 2", html: `<h2 style="font-family:Manrope,sans-serif;font-size:32px;letter-spacing:-0.01em;margin:20px 32px;color:var(--fc-text, #0f172a);">Heading 2</h2>` },
      { id: "text-p", label: "Paragraph", html: `<p style="font-family:Manrope,sans-serif;font-size:16px;color:var(--fc-muted, #475569);margin:12px 32px;max-width:700px;line-height:1.6;">A paragraph of body copy. Click to edit contents inline in Design mode.</p>` },
      { id: "text-input", label: "Text Input", html: `<div style="padding:16px 32px;font-family:Manrope,sans-serif;"><input type="text" placeholder="Type here…" style="width:100%;max-width:360px;padding:10px 12px;border:1px solid var(--fc-border, #e5e7eb);border-radius:8px;font-size:14px;" /></div>` },
      { id: "text-area", label: "Textarea", html: `<div style="padding:16px 32px;font-family:Manrope,sans-serif;"><textarea placeholder="Multi-line…" rows="4" style="width:100%;max-width:520px;padding:10px 12px;border:1px solid var(--fc-border, #e5e7eb);border-radius:8px;font-size:14px;font-family:inherit;"></textarea></div>` },
    ],
  },
  {
    id: "toolbox",
    label: "Toolbox",
    blocks: [
      { id: "tb-button", label: "Button", html: `<div style="padding:16px 32px;font-family:Manrope,sans-serif;"><button style="background:var(--fc-primary, #0f172a);color:#fff;border:0;padding:10px 18px;border-radius:8px;font-size:14px;cursor:pointer;">Click me</button></div>` },
      { id: "tb-image", label: "Image", html: `<div style="padding:16px 32px;"><img src="${heroImg}" alt="" style="width:100%;max-width:640px;border-radius:8px;" /></div>` },
      { id: "tb-divider", label: "Divider", html: `<hr style="border:0;border-top:1px solid var(--fc-border, #e5e7eb);margin:24px 32px;" />` },
      { id: "tb-spacer", label: "Spacer", html: `<div style="height:48px;"></div>` },
      { id: "tb-avatar", label: "Avatar", html: `<div style="padding:16px 32px;"><img src="${avatarImg}" alt="" style="width:56px;height:56px;border-radius:999px;object-fit:cover;" /></div>` },
      { id: "tb-badge", label: "Badge", html: `<div style="padding:16px 32px;"><span style="display:inline-block;padding:4px 10px;background:#eff6ff;color:var(--fc-accent, #2563eb);border-radius:999px;font-size:12px;font-family:Manrope,sans-serif;">New</span></div>` },
    ],
  },
];

const mergeCategories = (core, extra) => {
  const map = new Map(core.map((c) => [c.id, { ...c, blocks: [...c.blocks] }]));
  for (const c of extra) {
    if (map.has(c.id)) map.get(c.id).blocks.push(...c.blocks);
    else map.set(c.id, { ...c, blocks: [...c.blocks] });
  }
  return Array.from(map.values());
};

export const CATEGORIES = mergeCategories(CORE_CATEGORIES, EXTRA_CATEGORIES);

export const cardTemplate = (count = 3) => {
  const card = `
    <div style="padding:20px;border:1px solid var(--fc-border, #e5e7eb);border-radius:12px;background:var(--fc-surface, #fff);">
      <div style="width:44px;height:44px;background:var(--fc-primary, #0f172a);border-radius:10px;margin-bottom:14px;"></div>
      <h3 style="margin:0 0 6px;font-size:18px;color:var(--fc-text, #0f172a);">Card title</h3>
      <p style="margin:0;font-size:14px;color:var(--fc-muted, #64748b);">A short description of the card contents.</p>
    </div>`;
  return `<section style="padding:48px 32px;background:var(--fc-bg, #ffffff);font-family:Manrope,sans-serif;">
  <div style="display:grid;grid-template-columns:repeat(${count},1fr);gap:20px;max-width:1120px;margin:0 auto;">${card.repeat(count)}
  </div>
</section>`;
};

export const WEB_SAFE_FONTS = [
  "Manrope, sans-serif",
  "system-ui, sans-serif",
  "Arial, Helvetica, sans-serif",
  "Georgia, 'Times New Roman', serif",
  "'Courier New', monospace",
  "'Trebuchet MS', sans-serif",
  "Verdana, Geneva, sans-serif",
  "Tahoma, Geneva, sans-serif",
];
