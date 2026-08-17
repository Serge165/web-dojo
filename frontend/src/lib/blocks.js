// Prebuilt block templates. Each block returns a raw HTML string with inline
// styles so the exported output is portable/standalone.

const heroImg = "https://images.unsplash.com/photo-1488972685288-c3fd157d7c7a?crop=entropy&cs=srgb&fm=jpg&w=1600&q=80";
const avatarImg = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=entropy&cs=srgb&fm=jpg&w=400&q=80";

export const CATEGORIES = [
  {
    id: "components",
    label: "Components",
    blocks: [
      {
        id: "cmp-header-lrg",
        label: "Large Header",
        html: `<header style="padding:24px 32px;background:#ffffff;border-bottom:1px solid #e5e7eb;font-family:Manrope,sans-serif;">
  <div style="display:flex;align-items:center;justify-content:space-between;max-width:1120px;margin:0 auto;">
    <div style="display:flex;align-items:center;gap:12px;">
      <div style="width:32px;height:32px;background:#0f172a;border-radius:8px;"></div>
      <span style="font-size:20px;font-weight:700;color:#0f172a;">Brand</span>
    </div>
    <nav style="display:flex;gap:28px;font-size:14px;color:#334155;">
      <a href="#" style="color:inherit;text-decoration:none;">Products</a>
      <a href="#" style="color:inherit;text-decoration:none;">Solutions</a>
      <a href="#" style="color:inherit;text-decoration:none;">Docs</a>
      <a href="#" style="color:inherit;text-decoration:none;">Pricing</a>
    </nav>
    <div style="display:flex;gap:8px;">
      <button style="background:transparent;color:#0f172a;border:1px solid #e5e7eb;padding:8px 14px;border-radius:8px;font-size:13px;cursor:pointer;">Sign in</button>
      <button style="background:#0f172a;color:#fff;border:0;padding:8px 14px;border-radius:8px;font-size:13px;cursor:pointer;">Get started</button>
    </div>
  </div>
</header>`,
      },
      {
        id: "cmp-nav-glass",
        label: "Glass Navbar",
        html: `<nav style="position:sticky;top:0;padding:14px 28px;background:rgba(255,255,255,0.62);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid rgba(0,0,0,0.06);font-family:Manrope,sans-serif;display:flex;align-items:center;justify-content:space-between;z-index:10;">
  <div style="font-weight:700;color:#0f172a;">◤ Aurora</div>
  <div style="display:flex;gap:24px;font-size:14px;color:#0f172a;">
    <a href="#" style="color:inherit;text-decoration:none;">Home</a>
    <a href="#" style="color:inherit;text-decoration:none;">Work</a>
    <a href="#" style="color:inherit;text-decoration:none;">Contact</a>
  </div>
  <button style="background:#0f172a;color:#fff;border:0;padding:8px 16px;border-radius:999px;font-size:13px;cursor:pointer;">Join</button>
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
        html: `<section style="padding:32px 0;background:#0f172a;color:#fff;overflow:hidden;font-family:Manrope,sans-serif;">
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
        html: `<section style="padding:80px 32px;background:#fafafa;font-family:Manrope,sans-serif;">
  <div style="max-width:820px;margin:0 auto;text-align:center;">
    <div style="font-size:80px;color:#cbd5e1;line-height:1;margin-bottom:-24px;">“</div>
    <p style="font-size:26px;letter-spacing:-0.01em;line-height:1.35;color:#0f172a;margin:0 0 24px;">Forge changed the way our team ships marketing pages. We went from 2 weeks to 2 days.</p>
    <div style="display:flex;align-items:center;justify-content:center;gap:12px;">
      <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=entropy&cs=srgb&fm=jpg&w=200&q=80" style="width:44px;height:44px;border-radius:999px;object-fit:cover;" alt="" />
      <div style="text-align:left;"><div style="font-weight:600;color:#0f172a;font-size:14px;">Alex Rivera</div><div style="font-size:12px;color:#64748b;">Head of Design, Northwind</div></div>
    </div>
  </div>
</section>`,
      },
      {
        id: "cmp-pricing-3",
        label: "Pricing (3-col)",
        html: `<section style="padding:80px 32px;background:#ffffff;font-family:Manrope,sans-serif;">
  <div style="max-width:1120px;margin:0 auto;">
    <h2 style="font-size:36px;letter-spacing:-0.02em;margin:0 0 32px;color:#0f172a;text-align:center;">Simple pricing</h2>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;">
      <div style="padding:28px;border:1px solid #e5e7eb;border-radius:14px;background:#fff;">
        <div style="font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin-bottom:8px;">Free</div>
        <div style="font-size:44px;font-weight:700;color:#0f172a;margin-bottom:6px;">$0</div>
        <div style="font-size:13px;color:#64748b;margin-bottom:20px;">Forever</div>
        <button style="width:100%;background:#f1f5f9;color:#0f172a;border:0;padding:10px 14px;border-radius:10px;font-size:14px;cursor:pointer;">Start free</button>
      </div>
      <div style="padding:28px;border:2px solid #0f172a;border-radius:14px;background:#0f172a;color:#fff;transform:scale(1.02);">
        <div style="font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;margin-bottom:8px;">Pro</div>
        <div style="font-size:44px;font-weight:700;margin-bottom:6px;">$19</div>
        <div style="font-size:13px;color:#94a3b8;margin-bottom:20px;">per month</div>
        <button style="width:100%;background:#fff;color:#0f172a;border:0;padding:10px 14px;border-radius:10px;font-size:14px;cursor:pointer;font-weight:600;">Choose Pro</button>
      </div>
      <div style="padding:28px;border:1px solid #e5e7eb;border-radius:14px;background:#fff;">
        <div style="font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin-bottom:8px;">Team</div>
        <div style="font-size:44px;font-weight:700;color:#0f172a;margin-bottom:6px;">$49</div>
        <div style="font-size:13px;color:#64748b;margin-bottom:20px;">per user / month</div>
        <button style="width:100%;background:#f1f5f9;color:#0f172a;border:0;padding:10px 14px;border-radius:10px;font-size:14px;cursor:pointer;">Contact us</button>
      </div>
    </div>
  </div>
</section>`,
      },
      {
        id: "cmp-footer",
        label: "Footer",
        html: `<footer style="padding:56px 32px 32px;background:#0f172a;color:#cbd5e1;font-family:Manrope,sans-serif;">
  <div style="max-width:1120px;margin:0 auto;display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:32px;">
    <div>
      <div style="font-size:18px;font-weight:700;color:#fff;margin-bottom:8px;">◤ Forge</div>
      <p style="font-size:13px;color:#94a3b8;margin:0;max-width:280px;">Design and ship faster. Built for humans, powered by the web.</p>
    </div>
    <div><div style="font-weight:600;color:#fff;margin-bottom:8px;font-size:13px;">Product</div><ul style="list-style:none;padding:0;margin:0;font-size:13px;line-height:2;"><li>Features</li><li>Pricing</li><li>Changelog</li></ul></div>
    <div><div style="font-weight:600;color:#fff;margin-bottom:8px;font-size:13px;">Company</div><ul style="list-style:none;padding:0;margin:0;font-size:13px;line-height:2;"><li>About</li><li>Blog</li><li>Careers</li></ul></div>
    <div><div style="font-weight:600;color:#fff;margin-bottom:8px;font-size:13px;">Legal</div><ul style="list-style:none;padding:0;margin:0;font-size:13px;line-height:2;"><li>Terms</li><li>Privacy</li></ul></div>
  </div>
  <div style="border-top:1px solid #1e293b;margin-top:32px;padding-top:20px;text-align:center;font-size:12px;color:#64748b;">© 2026 Forge. All rights reserved.</div>
</footer>`,
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
        html: `<nav style="display:flex;align-items:center;justify-content:space-between;padding:18px 32px;border-bottom:1px solid #e5e7eb;background:#ffffff;font-family:Manrope,sans-serif;">
  <div style="font-weight:700;font-size:18px;color:#0f172a;">Brand</div>
  <div style="display:flex;gap:24px;font-size:14px;color:#334155;">
    <a href="#" style="color:inherit;text-decoration:none;">Home</a>
    <a href="#" style="color:inherit;text-decoration:none;">Features</a>
    <a href="#" style="color:inherit;text-decoration:none;">Pricing</a>
    <a href="#" style="color:inherit;text-decoration:none;">Contact</a>
  </div>
  <button style="background:#0f172a;color:#fff;border:0;padding:8px 16px;border-radius:6px;font-size:13px;cursor:pointer;">Sign up</button>
</nav>`,
      },
      {
        id: "nav-dark",
        label: "Dark Navbar",
        html: `<nav style="display:flex;align-items:center;justify-content:space-between;padding:16px 32px;background:#0b0b0b;color:#f3f4f6;font-family:Manrope,sans-serif;">
  <div style="font-weight:700;font-size:18px;letter-spacing:-0.02em;">◤ Studio</div>
  <div style="display:flex;gap:24px;font-size:14px;color:#9ca3af;">
    <a href="#" style="color:inherit;text-decoration:none;">Work</a>
    <a href="#" style="color:inherit;text-decoration:none;">About</a>
    <a href="#" style="color:inherit;text-decoration:none;">Journal</a>
  </div>
  <button style="background:#2563eb;color:#fff;border:0;padding:8px 16px;border-radius:6px;font-size:13px;cursor:pointer;">Contact</button>
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
        html: `<section style="padding:96px 32px;text-align:center;background:#fafafa;font-family:Manrope,sans-serif;">
  <div style="max-width:720px;margin:0 auto;">
    <div style="display:inline-block;padding:6px 12px;border:1px solid #e5e7eb;border-radius:999px;font-size:12px;color:#475569;margin-bottom:20px;">New · v1.0 released</div>
    <h1 style="font-size:56px;line-height:1.05;letter-spacing:-0.03em;margin:0 0 20px;color:#0f172a;">Build faster. Ship sharper.</h1>
    <p style="font-size:18px;color:#475569;margin:0 0 32px;">A studio-grade website builder that gets out of your way. Drag, drop, and export production HTML.</p>
    <div style="display:flex;gap:12px;justify-content:center;">
      <button style="background:#0f172a;color:#fff;border:0;padding:12px 22px;border-radius:8px;font-size:14px;cursor:pointer;">Get started</button>
      <button style="background:#fff;color:#0f172a;border:1px solid #e5e7eb;padding:12px 22px;border-radius:8px;font-size:14px;cursor:pointer;">Live demo</button>
    </div>
  </div>
</section>`,
      },
      {
        id: "hero-split",
        label: "Split Hero",
        html: `<section style="display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;padding:80px 32px;background:#ffffff;font-family:Manrope,sans-serif;">
  <div>
    <h1 style="font-size:48px;line-height:1.1;letter-spacing:-0.02em;margin:0 0 16px;color:#0f172a;">A canvas for the web.</h1>
    <p style="font-size:16px;color:#475569;margin:0 0 24px;">Design in the browser. Import any HTML. Export standalone files. No lock-in.</p>
    <button style="background:#2563eb;color:#fff;border:0;padding:12px 22px;border-radius:8px;font-size:14px;cursor:pointer;">Start building</button>
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
        html: `<section style="padding:80px 32px;background:#ffffff;font-family:Manrope,sans-serif;">
  <div style="max-width:1120px;margin:0 auto;">
    <h2 style="font-size:36px;letter-spacing:-0.02em;margin:0 0 40px;color:#0f172a;">Everything you need.</h2>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;">
      <div style="padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
        <div style="width:36px;height:36px;background:#0f172a;border-radius:8px;margin-bottom:12px;"></div>
        <h3 style="font-size:18px;margin:0 0 8px;color:#0f172a;">Drag & Drop</h3>
        <p style="font-size:14px;color:#64748b;margin:0;">Assemble pages visually with a snappy grid.</p>
      </div>
      <div style="padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
        <div style="width:36px;height:36px;background:#2563eb;border-radius:8px;margin-bottom:12px;"></div>
        <h3 style="font-size:18px;margin:0 0 8px;color:#0f172a;">Code Mode</h3>
        <p style="font-size:14px;color:#64748b;margin:0;">Drop into raw HTML whenever you need power.</p>
      </div>
      <div style="padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
        <div style="width:36px;height:36px;background:#10b981;border-radius:8px;margin-bottom:12px;"></div>
        <h3 style="font-size:18px;margin:0 0 8px;color:#0f172a;">Export</h3>
        <p style="font-size:14px;color:#64748b;margin:0;">One click, ready-to-host HTML & CSS.</p>
      </div>
    </div>
  </div>
</section>`,
      },
      {
        id: "section-cta",
        label: "CTA Banner",
        html: `<section style="padding:64px 32px;background:#0f172a;color:#fff;text-align:center;font-family:Manrope,sans-serif;">
  <h2 style="font-size:32px;letter-spacing:-0.02em;margin:0 0 12px;">Ready to ship?</h2>
  <p style="font-size:16px;color:#cbd5e1;margin:0 0 24px;">Export production HTML in a single click.</p>
  <button style="background:#fff;color:#0f172a;border:0;padding:12px 22px;border-radius:8px;font-size:14px;cursor:pointer;">Start now</button>
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
        html: `<div style="max-width:1120px;margin:0 auto;padding:32px;background:#ffffff;font-family:Manrope,sans-serif;">
  <p style="color:#334155;font-size:15px;">A responsive container. Drop content inside.</p>
</div>`,
      },
      {
        id: "container-2col",
        label: "2 Columns",
        html: `<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;padding:32px;background:#ffffff;font-family:Manrope,sans-serif;">
  <div style="padding:24px;background:#f8fafc;border-radius:8px;">Column A</div>
  <div style="padding:24px;background:#f8fafc;border-radius:8px;">Column B</div>
</div>`,
      },
      {
        id: "container-3col",
        label: "3 Columns",
        html: `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;padding:32px;background:#ffffff;font-family:Manrope,sans-serif;">
  <div style="padding:24px;background:#f8fafc;border-radius:8px;">A</div>
  <div style="padding:24px;background:#f8fafc;border-radius:8px;">B</div>
  <div style="padding:24px;background:#f8fafc;border-radius:8px;">C</div>
</div>`,
      },
    ],
  },
  {
    id: "text",
    label: "Text",
    blocks: [
      { id: "text-h1", label: "Heading 1", html: `<h1 style="font-family:Manrope,sans-serif;font-size:48px;letter-spacing:-0.02em;margin:24px 32px;color:#0f172a;">Heading 1</h1>` },
      { id: "text-h2", label: "Heading 2", html: `<h2 style="font-family:Manrope,sans-serif;font-size:32px;letter-spacing:-0.01em;margin:20px 32px;color:#0f172a;">Heading 2</h2>` },
      { id: "text-p", label: "Paragraph", html: `<p style="font-family:Manrope,sans-serif;font-size:16px;color:#475569;margin:12px 32px;max-width:700px;line-height:1.6;">A paragraph of body copy. Click to edit contents inline in Design mode.</p>` },
      { id: "text-input", label: "Text Input", html: `<div style="padding:16px 32px;font-family:Manrope,sans-serif;"><input type="text" placeholder="Type here…" style="width:100%;max-width:360px;padding:10px 12px;border:1px solid #e5e7eb;border-radius:8px;font-size:14px;" /></div>` },
      { id: "text-area", label: "Textarea", html: `<div style="padding:16px 32px;font-family:Manrope,sans-serif;"><textarea placeholder="Multi-line…" rows="4" style="width:100%;max-width:520px;padding:10px 12px;border:1px solid #e5e7eb;border-radius:8px;font-size:14px;font-family:inherit;"></textarea></div>` },
    ],
  },
  {
    id: "toolbox",
    label: "Toolbox",
    blocks: [
      { id: "tb-button", label: "Button", html: `<div style="padding:16px 32px;font-family:Manrope,sans-serif;"><button style="background:#0f172a;color:#fff;border:0;padding:10px 18px;border-radius:8px;font-size:14px;cursor:pointer;">Click me</button></div>` },
      { id: "tb-image", label: "Image", html: `<div style="padding:16px 32px;"><img src="${heroImg}" alt="" style="width:100%;max-width:640px;border-radius:8px;" /></div>` },
      { id: "tb-divider", label: "Divider", html: `<hr style="border:0;border-top:1px solid #e5e7eb;margin:24px 32px;" />` },
      { id: "tb-spacer", label: "Spacer", html: `<div style="height:48px;"></div>` },
      { id: "tb-avatar", label: "Avatar", html: `<div style="padding:16px 32px;"><img src="${avatarImg}" alt="" style="width:56px;height:56px;border-radius:999px;object-fit:cover;" /></div>` },
      { id: "tb-badge", label: "Badge", html: `<div style="padding:16px 32px;"><span style="display:inline-block;padding:4px 10px;background:#eff6ff;color:#2563eb;border-radius:999px;font-size:12px;font-family:Manrope,sans-serif;">New</span></div>` },
    ],
  },
];

export const cardTemplate = (count = 3) => {
  const card = `
    <div style="padding:20px;border:1px solid #e5e7eb;border-radius:12px;background:#fff;">
      <div style="width:44px;height:44px;background:#0f172a;border-radius:10px;margin-bottom:14px;"></div>
      <h3 style="margin:0 0 6px;font-size:18px;color:#0f172a;">Card title</h3>
      <p style="margin:0;font-size:14px;color:#64748b;">A short description of the card contents.</p>
    </div>`;
  return `<section style="padding:48px 32px;background:#ffffff;font-family:Manrope,sans-serif;">
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
