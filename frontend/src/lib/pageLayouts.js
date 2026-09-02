import { buildCartRuntimeHtml } from "./cart";
import { EXTRA_CATEGORIES } from "./blocksExtra";

// Pulls a Zenero live-content block's HTML straight from the block library so
// layouts here stay wired to the same dashboard-managed widget everyone else uses.
const zeneroBlockHtml = (id) => EXTRA_CATEGORIES.find((c) => c.id === "zenero").blocks.find((b) => b.id === id).html;

// Prebuilt, editable page layouts (WordPress-style) for the "Add page" picker.
// Every layout is a list of portable HTML blocks (inline styles) so it survives
// export/publish. Sections are composed from reusable builders + theme presets,
// which keeps many distinct-looking variations maintainable.

// ---- Images (verified relevant Unsplash/Pexels URLs) --------------------------
const u = (base, w = 1600) => `${base}${base.includes("?") ? "&" : "?"}w=${w}&q=80`;
const IMG = {
  land: u("https://images.unsplash.com/photo-1488972685288-c3fd157d7c7a"),
  land2: u("https://images.unsplash.com/photo-1470770841072-f978cf4d019e"),
  land3: u("https://images.unsplash.com/photo-1500530855697-b586d89ba3ee"),
  land4: u("https://images.unsplash.com/photo-1519681393784-d120267933ba"),
  land5: u("https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5"),
  land6: u("https://images.unsplash.com/photo-1441829266145-6d4bfbf99bd8"),
  land7: u("https://images.unsplash.com/photo-1520975916090-3105956dac38"),
  face: u("https://images.unsplash.com/photo-1494790108377-be9c29b29330", 600),
  face2: u("https://images.unsplash.com/photo-1500648767791-00dcc994a43e", 600),
  face3: u("https://images.unsplash.com/photo-1534528741775-53994a69daeb", 600),
  face4: u("https://images.unsplash.com/photo-1506794778202-cad84cf45f1d", 600),
  esports1: u("https://images.unsplash.com/photo-1548686304-5c3be888a00b"),
  esports2: u("https://images.unsplash.com/photo-1558008258-7ff8888b42b0"),
  esports3: u("https://images.unsplash.com/photo-1633545495735-25df17fb9f31"),
  band1: u("https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3"),
  band2: u("https://images.unsplash.com/photo-1565035010268-a3816f98589a"),
  band3: u("https://images.unsplash.com/photo-1506157786151-b8491531f063"),
  hotel1: u("https://images.unsplash.com/photo-1777170191230-3f357b815483"),
  hotel2: u("https://images.unsplash.com/photo-1719687384656-07e524f9797e"),
  hotel3: u("https://images.unsplash.com/photo-1742844552700-3926862c5311"),
  food1: u("https://images.unsplash.com/photo-1467003909585-2f8a72700288"),
  food2: u("https://images.unsplash.com/photo-1663530761401-15eefb544889"),
  food3: u("https://images.unsplash.com/photo-1581349485608-9469926a8e5e"),
  gym1: u("https://images.unsplash.com/photo-1534438327276-14e5300c3a48"),
  gym2: u("https://images.unsplash.com/photo-1571902943202-507ec2618e8f"),
  prod1: u("https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd", 900),
  prod2: u("https://images.unsplash.com/photo-1705242960929-8f2d111cf446", 900),
  prod3: u("https://images.unsplash.com/photo-1623824204241-f851d3bcfaf5", 900),
  prod4: u("https://images.unsplash.com/photo-1706509511714-2a1e0f74321e", 900),
  podcast1: u("https://images.unsplash.com/photo-1478737270239-2f02b77fc618"),
  podcast2: u("https://images.unsplash.com/photo-1589903308904-1010c2294adc"),
  wedding1: u("https://images.unsplash.com/photo-1596457221755-b96bc3a6df18"),
  wedding2: u("https://images.unsplash.com/photo-1591604466107-ec97de577aff"),
  house1: u("https://images.unsplash.com/photo-1613490493576-7fde63acd811"),
  house2: u("https://images.unsplash.com/photo-1670589953882-b94c9cb380f5"),
  clinic1: u("https://images.unsplash.com/photo-1638202993928-7267aad84c31"),
  clinic2: u("https://images.unsplash.com/photo-1659353888906-adb3e0041693"),
  conf1: u("https://images.unsplash.com/photo-1559223694-98ed5e272fef"),
  conf2: u("https://images.unsplash.com/photo-1560439513-74b037a25d84"),
  charity1: u("https://images.unsplash.com/photo-1593113598332-cd288d649433"),
  charity2: u("https://images.unsplash.com/photo-1628717341663-0007b0ee2597"),
  church1: u("https://images.unsplash.com/photo-1699830506478-af7b3f5e6cc9"),
  church2: u("https://images.unsplash.com/photo-1519491050282-cf00c82424b4"),
};

// ---- Theme presets ------------------------------------------------------------
const T = {
  modern: {
    bg: "#ffffff", surface: "#f8fafc", fg: "#0f172a", muted: "#64748b", border: "#e2e8f0",
    accent: "#4f46e5", accent2: "#0ea5e9", onAccent: "#ffffff",
    head: "'Poppins',system-ui,sans-serif", body: "'Inter',system-ui,sans-serif",
    radius: "16px", fonts: ["Poppins", "Inter"],
  },
  bold: {
    bg: "#0a0a12", surface: "#14141f", fg: "#f8fafc", muted: "#9ca3af", border: "#262636",
    accent: "#f43f5e", accent2: "#fb923c", onAccent: "#ffffff",
    head: "'Sora',system-ui,sans-serif", body: "'Inter',system-ui,sans-serif",
    radius: "18px", fonts: ["Sora", "Inter"],
  },
  editorial: {
    bg: "#f7f3ec", surface: "#fffdf8", fg: "#1c1a17", muted: "#6b6459", border: "#e4dccc",
    accent: "#b45309", accent2: "#166534", onAccent: "#fffdf8",
    head: "'Fraunces',Georgia,serif", body: "'Fraunces',Georgia,serif",
    radius: "6px", fonts: ["Fraunces"],
  },
  neon: {
    bg: "#05060f", surface: "#0d1022", fg: "#e6edf7", muted: "#7c85a3", border: "#1c2140",
    accent: "#22d3ee", accent2: "#a855f7", onAccent: "#05060f",
    head: "'Orbitron',system-ui,sans-serif", body: "'Rajdhani',system-ui,sans-serif",
    radius: "4px", fonts: ["Orbitron", "Rajdhani"],
  },
  elegant: {
    bg: "#12100e", surface: "#1c1913", fg: "#f4eee2", muted: "#b7ac97", border: "#332e24",
    accent: "#c9a24a", accent2: "#8a6d3b", onAccent: "#12100e",
    head: "'Cormorant Garamond',Georgia,serif", body: "'Jost',system-ui,sans-serif",
    radius: "2px", fonts: ["Cormorant Garamond", "Jost"],
  },
};

// ---- Section builders ---------------------------------------------------------
const icon = (t, path) =>
  `<span style="display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:12px;background:${t.accent}1a;color:${t.accent};"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${path}</svg></span>`;
const ICONS = {
  bolt: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
  star: '<path d="M12 2l3 7 7 .5-5.5 4.5 2 7L12 17l-6.5 4 2-7L2 9.5 9 9z"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
  layers: '<path d="M12 2 2 7l10 5 10-5z"/><path d="M2 12l10 5 10-5M2 17l10 5 10-5"/>',
  heart: '<path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 1 0-7.1 7.1L12 21l8.8-8.3a5 5 0 0 0 0-7.1z"/>',
  spark: '<path d="M12 3v6M12 15v6M3 12h6M15 12h6"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
};

const btn = (t, label, href = "#", solid = true) =>
  solid
    ? `<a href="${href}" style="display:inline-block;padding:14px 28px;background:${t.accent};color:${t.onAccent};text-decoration:none;border-radius:${t.radius};font-family:${t.body};font-weight:600;font-size:15px;letter-spacing:.01em;">${label}</a>`
    : `<a href="${href}" style="display:inline-block;padding:14px 28px;background:transparent;color:${t.fg};text-decoration:none;border-radius:${t.radius};border:1px solid ${t.border};font-family:${t.body};font-weight:600;font-size:15px;">${label}</a>`;

const nav = (t, brand, links = ["Home", "About", "Services", "Contact"]) =>
  `<header style="background:${t.bg};border-bottom:1px solid ${t.border};font-family:${t.body};">
  <nav style="max-width:1160px;margin:0 auto;padding:20px 32px;display:flex;align-items:center;justify-content:space-between;gap:24px;">
    <a href="#" style="font-family:${t.head};font-weight:700;font-size:22px;color:${t.fg};text-decoration:none;letter-spacing:-.01em;">${brand}</a>
    <div style="display:flex;align-items:center;gap:28px;">
      ${links.map((l) => `<a href="#" style="color:${t.muted};text-decoration:none;font-size:15px;">${l}</a>`).join("")}
      <a href="#" style="padding:10px 20px;background:${t.accent};color:${t.onAccent};border-radius:${t.radius};text-decoration:none;font-weight:600;font-size:14px;">Get started</a>
    </div>
  </nav>
</header>`;

const heroCenter = (t, { eyebrow, title, sub, primary = "Get started", secondary = "Learn more" }) =>
  `<section style="background:${t.bg};font-family:${t.body};padding:104px 32px 88px;text-align:center;">
  <div style="max-width:820px;margin:0 auto;">
    <div style="display:inline-block;padding:7px 16px;border-radius:999px;background:${t.accent}14;color:${t.accent};font-size:13px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;margin-bottom:26px;">${eyebrow}</div>
    <h1 style="font-family:${t.head};font-size:60px;line-height:1.05;letter-spacing:-.03em;color:${t.fg};margin:0 0 22px;font-weight:700;">${title}</h1>
    <p style="font-size:19px;line-height:1.6;color:${t.muted};max-width:600px;margin:0 auto 34px;">${sub}</p>
    <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap;">${btn(t, primary)}${btn(t, secondary, "#", false)}</div>
  </div>
</section>`;

const heroSplit = (t, { eyebrow, title, sub, img, primary = "Get started" }) =>
  `<section style="background:${t.bg};font-family:${t.body};padding:88px 32px;">
  <div style="max-width:1160px;margin:0 auto;display:grid;grid-template-columns:1.05fr 1fr;gap:56px;align-items:center;">
    <div>
      <div style="color:${t.accent};font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin-bottom:18px;">${eyebrow}</div>
      <h1 style="font-family:${t.head};font-size:52px;line-height:1.08;letter-spacing:-.03em;color:${t.fg};margin:0 0 20px;font-weight:700;">${title}</h1>
      <p style="font-size:18px;line-height:1.65;color:${t.muted};margin:0 0 30px;">${sub}</p>
      <div style="display:flex;gap:14px;flex-wrap:wrap;">${btn(t, primary)}${btn(t, "Talk to us", "#", false)}</div>
    </div>
    <img src="${img}" alt="" style="width:100%;height:440px;object-fit:cover;border-radius:${t.radius};" />
  </div>
</section>`;

const heroImage = (t, { title, sub, img, primary = "Explore" }) =>
  `<section style="position:relative;font-family:${t.body};min-height:78vh;display:flex;align-items:flex-end;background:url('${img}') center/cover;">
  <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.15),rgba(0,0,0,.82));"></div>
  <div style="position:relative;max-width:1160px;margin:0 auto;padding:0 32px 80px;color:#fff;">
    <h1 style="font-family:${t.head};font-size:66px;line-height:1;letter-spacing:-.03em;margin:0 0 18px;max-width:760px;">${title}</h1>
    <p style="font-size:19px;line-height:1.6;max-width:520px;color:rgba(255,255,255,.86);margin:0 0 28px;">${sub}</p>
    ${btn(t, primary)}
  </div>
</section>`;

const logos = (t) =>
  `<section style="background:${t.bg};font-family:${t.body};padding:36px 32px;border-bottom:1px solid ${t.border};">
  <div style="max-width:1000px;margin:0 auto;display:flex;flex-wrap:wrap;gap:40px;align-items:center;justify-content:center;opacity:.62;">
    ${["NORTHWIND", "ACME", "LUMEN", "VERTEX", "ORBIT"].map((n) => `<span style="font-family:${t.head};font-weight:700;font-size:19px;letter-spacing:.02em;color:${t.fg};">${n}</span>`).join("")}
  </div>
</section>`;

const features = (t, { title, sub, items }) =>
  `<section style="background:${t.surface};font-family:${t.body};padding:88px 32px;">
  <div style="max-width:1160px;margin:0 auto;">
    <div style="max-width:620px;margin:0 0 52px;">
      <h2 style="font-family:${t.head};font-size:38px;letter-spacing:-.02em;color:${t.fg};margin:0 0 14px;font-weight:700;">${title}</h2>
      <p style="font-size:17px;color:${t.muted};line-height:1.6;margin:0;">${sub}</p>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:22px;">
      ${items.map((it) => `<div style="background:${t.bg};border:1px solid ${t.border};border-radius:${t.radius};padding:28px;">
        ${icon(t, ICONS[it.icon] || ICONS.spark)}
        <h3 style="font-family:${t.head};font-size:19px;color:${t.fg};margin:18px 0 8px;font-weight:600;">${it.title}</h3>
        <p style="font-size:15px;color:${t.muted};line-height:1.6;margin:0;">${it.desc}</p>
      </div>`).join("")}
    </div>
  </div>
</section>`;

const stats = (t, items) =>
  `<section style="background:${t.accent};font-family:${t.body};padding:56px 32px;">
  <div style="max-width:1000px;margin:0 auto;display:grid;grid-template-columns:repeat(${items.length},1fr);gap:24px;text-align:center;">
    ${items.map((s) => `<div><div style="font-family:${t.head};font-size:46px;font-weight:800;color:${t.onAccent};line-height:1;">${s.k}</div><div style="color:${t.onAccent};opacity:.85;font-size:14px;margin-top:8px;letter-spacing:.02em;">${s.v}</div></div>`).join("")}
  </div>
</section>`;

const about = (t, { title, body, img }) =>
  `<section style="background:${t.bg};font-family:${t.body};padding:88px 32px;">
  <div style="max-width:1160px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center;">
    <img src="${img}" alt="" style="width:100%;height:420px;object-fit:cover;border-radius:${t.radius};" />
    <div>
      <h2 style="font-family:${t.head};font-size:40px;letter-spacing:-.02em;color:${t.fg};margin:0 0 20px;font-weight:700;">${title}</h2>
      ${body.map((p) => `<p style="font-size:17px;line-height:1.7;color:${t.muted};margin:0 0 16px;">${p}</p>`).join("")}
    </div>
  </div>
</section>`;

const values = (t) => features(t, {
  title: "What we stand for", sub: "The principles behind everything we ship.",
  items: [
    { icon: "heart", title: "People first", desc: "We build for humans, not metrics. Care shows in the details." },
    { icon: "shield", title: "Built to last", desc: "Durable decisions over quick wins. We sweat the foundations." },
    { icon: "spark", title: "Always curious", desc: "We question defaults and keep learning in the open." },
  ],
});

const servicesGrid = (t) =>
  `<section style="background:${t.surface};font-family:${t.body};padding:88px 32px;">
  <div style="max-width:1160px;margin:0 auto;">
    <h2 style="font-family:${t.head};font-size:38px;letter-spacing:-.02em;color:${t.fg};margin:0 0 40px;font-weight:700;">Services</h2>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:22px;">
      ${[
        ["chart", "Strategy & research", "We map the problem before touching a pixel — audits, interviews, and a plan you can act on."],
        ["layers", "Design systems", "Reusable components and tokens that keep every screen consistent as you scale."],
        ["bolt", "Rapid prototyping", "Clickable prototypes in days so you can test ideas before committing to code."],
        ["globe", "Launch & growth", "From release to iteration — analytics, A/B tests, and continuous improvement."],
      ].map(([ic, ti, de]) => `<div style="display:flex;gap:18px;background:${t.bg};border:1px solid ${t.border};border-radius:${t.radius};padding:26px;">
        ${icon(t, ICONS[ic])}
        <div><h3 style="font-family:${t.head};font-size:19px;color:${t.fg};margin:0 0 8px;font-weight:600;">${ti}</h3><p style="font-size:15px;color:${t.muted};line-height:1.6;margin:0;">${de}</p></div>
      </div>`).join("")}
    </div>
  </div>
</section>`;

const gallery = (t, imgs) =>
  `<section style="background:${t.bg};font-family:${t.body};padding:80px 32px;">
  <div style="max-width:1160px;margin:0 auto;">
    <h2 style="font-family:${t.head};font-size:38px;letter-spacing:-.02em;color:${t.fg};margin:0 0 28px;font-weight:700;">Selected work</h2>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;">
      ${imgs.map((s) => `<img src="${s}" alt="" style="width:100%;height:260px;object-fit:cover;border-radius:${t.radius};" />`).join("")}
    </div>
  </div>
</section>`;

const masonry = (t, imgs) =>
  `<section style="background:${t.bg};font-family:${t.body};padding:80px 32px;">
  <div style="max-width:1160px;margin:0 auto;column-count:3;column-gap:14px;">
    ${imgs.map((s, i) => `<img src="${s}" alt="" style="width:100%;margin:0 0 14px;border-radius:${t.radius};display:block;height:${i % 3 === 0 ? 320 : i % 3 === 1 ? 220 : 280}px;object-fit:cover;" />`).join("")}
  </div>
</section>`;

const blogList = (t) =>
  `<section style="background:${t.bg};font-family:${t.body};padding:88px 32px;">
  <div style="max-width:1080px;margin:0 auto;">
    <h1 style="font-family:${t.head};font-size:44px;letter-spacing:-.02em;color:${t.fg};margin:0 0 8px;font-weight:700;">The Journal</h1>
    <p style="font-size:17px;color:${t.muted};margin:0 0 42px;">Notes, essays, and the occasional deep dive.</p>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:26px;">
      ${[
        [IMG.land, "Product", "Designing for the first five minutes", "The onboarding sets the tone for the entire relationship. Here's how we think about it."],
        [IMG.land4, "Engineering", "Shipping less, but shipping it well", "Scope is a feature. A short story about the things we chose not to build."],
        [IMG.land3, "Culture", "Async by default", "How a small team stays aligned across four time zones without endless meetings."],
        [IMG.land7, "Design", "The quiet power of whitespace", "Why the best interfaces feel like they're barely there at all."],
      ].map(([im, cat, ti, ex]) => `<article style="border:1px solid ${t.border};border-radius:${t.radius};overflow:hidden;background:${t.surface};">
        <img src="${im}" alt="" style="width:100%;height:200px;object-fit:cover;" />
        <div style="padding:22px;">
          <span style="font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:${t.accent};">${cat}</span>
          <h3 style="font-family:${t.head};font-size:21px;color:${t.fg};margin:10px 0 8px;font-weight:600;line-height:1.25;">${ti}</h3>
          <p style="font-size:15px;color:${t.muted};line-height:1.6;margin:0 0 14px;">${ex}</p>
          <a href="#" style="color:${t.accent};font-weight:600;font-size:14px;text-decoration:none;">Read more →</a>
        </div>
      </article>`).join("")}
    </div>
  </div>
</section>`;

const team = (t) =>
  `<section style="background:${t.surface};font-family:${t.body};padding:88px 32px;">
  <div style="max-width:1160px;margin:0 auto;text-align:center;">
    <h2 style="font-family:${t.head};font-size:38px;letter-spacing:-.02em;color:${t.fg};margin:0 0 12px;font-weight:700;">Meet the team</h2>
    <p style="font-size:17px;color:${t.muted};margin:0 auto 48px;max-width:520px;">A small, senior crew who care about the craft.</p>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:24px;">
      ${[
        [IMG.face, "Ada Reyes", "Founder & CEO"],
        [IMG.face2, "Milo Grant", "Head of Design"],
        [IMG.face3, "Noor Idris", "Lead Engineer"],
        [IMG.face4, "Sana Okoye", "Product"],
      ].map(([im, nm, ro]) => `<div style="text-align:center;">
        <img src="${im}" alt="" style="width:112px;height:112px;border-radius:999px;object-fit:cover;margin:0 auto 16px;" />
        <div style="font-family:${t.head};font-size:17px;color:${t.fg};font-weight:600;">${nm}</div>
        <div style="font-size:14px;color:${t.muted};margin-top:4px;">${ro}</div>
      </div>`).join("")}
    </div>
  </div>
</section>`;

const testimonials = (t) =>
  `<section style="background:${t.bg};font-family:${t.body};padding:88px 32px;">
  <div style="max-width:1160px;margin:0 auto;">
    <h2 style="font-family:${t.head};font-size:38px;letter-spacing:-.02em;color:${t.fg};margin:0 0 44px;font-weight:700;text-align:center;">Loved by teams everywhere</h2>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:22px;">
      ${[
        ["“It paid for itself in the first week. Genuinely the smoothest tool we've adopted.”", IMG.face2, "Milo Grant", "COO, Northwind"],
        ["“Setup took ten minutes and our whole team was onboard by lunch.”", IMG.face, "Ada Reyes", "Founder, Lumen"],
        ["“Support actually replies, and the product keeps getting better. Rare combo.”", IMG.face3, "Noor Idris", "CTO, Vertex"],
      ].map(([q, im, nm, ro]) => `<figure style="background:${t.surface};border:1px solid ${t.border};border-radius:${t.radius};padding:28px;margin:0;">
        <div style="color:${t.accent};font-size:22px;letter-spacing:2px;margin-bottom:10px;">★★★★★</div>
        <blockquote style="font-size:16px;line-height:1.65;color:${t.fg};margin:0 0 20px;">${q}</blockquote>
        <figcaption style="display:flex;align-items:center;gap:12px;"><img src="${im}" alt="" style="width:44px;height:44px;border-radius:999px;object-fit:cover;" /><div><div style="font-weight:600;color:${t.fg};font-size:14px;">${nm}</div><div style="color:${t.muted};font-size:13px;">${ro}</div></div></figcaption>
      </figure>`).join("")}
    </div>
  </div>
</section>`;

const pricing = (t) =>
  `<section style="background:${t.surface};font-family:${t.body};padding:88px 32px;">
  <div style="max-width:1080px;margin:0 auto;text-align:center;">
    <h2 style="font-family:${t.head};font-size:40px;letter-spacing:-.02em;color:${t.fg};margin:0 0 12px;font-weight:700;">Simple, honest pricing</h2>
    <p style="font-size:17px;color:${t.muted};margin:0 auto 48px;max-width:520px;">No hidden fees. Cancel anytime.</p>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:22px;text-align:left;">
      ${[
        ["Starter", "$9", "/mo", ["1 project", "Community support", "Basic analytics"], false],
        ["Pro", "$29", "/mo", ["Unlimited projects", "Priority support", "Advanced analytics", "Custom domains"], true],
        ["Team", "$79", "/mo", ["Everything in Pro", "5 seats included", "SSO & audit logs", "SLA"], false],
      ].map(([nm, pr, per, feats, hot]) => `<div style="background:${hot ? t.accent : t.bg};color:${hot ? t.onAccent : t.fg};border:1px solid ${hot ? t.accent : t.border};border-radius:${t.radius};padding:32px;position:relative;">
        ${hot ? `<span style="position:absolute;top:-12px;right:24px;background:${t.accent2};color:#fff;font-size:11px;font-weight:700;padding:5px 12px;border-radius:999px;letter-spacing:.05em;">POPULAR</span>` : ""}
        <div style="font-family:${t.head};font-size:16px;font-weight:600;margin-bottom:10px;">${nm}</div>
        <div style="display:flex;align-items:baseline;gap:4px;margin-bottom:20px;"><span style="font-family:${t.head};font-size:44px;font-weight:800;">${pr}</span><span style="opacity:.7;font-size:15px;">${per}</span></div>
        <ul style="list-style:none;padding:0;margin:0 0 24px;">${feats.map((f) => `<li style="padding:8px 0;font-size:15px;opacity:${hot ? ".95" : ".8"};display:flex;gap:10px;"><span>✓</span>${f}</li>`).join("")}</ul>
        <a href="#" style="display:block;text-align:center;padding:13px;border-radius:${t.radius};text-decoration:none;font-weight:600;background:${hot ? t.onAccent : t.accent};color:${hot ? t.accent : t.onAccent};">Choose ${nm}</a>
      </div>`).join("")}
    </div>
  </div>
</section>`;

const faq = (t) =>
  `<section style="background:${t.bg};font-family:${t.body};padding:88px 32px;">
  <div style="max-width:760px;margin:0 auto;">
    <h2 style="font-family:${t.head};font-size:40px;letter-spacing:-.02em;color:${t.fg};margin:0 0 40px;font-weight:700;text-align:center;">Frequently asked questions</h2>
    ${[
      ["Do I need a credit card to start?", "No. You can explore every core feature on the free tier with no card required."],
      ["Can I cancel anytime?", "Absolutely. Plans are month-to-month and you can downgrade or cancel from your dashboard."],
      ["Is my data secure?", "Data is encrypted in transit and at rest. We're SOC 2 Type II compliant."],
      ["Do you offer refunds?", "Yes — if you're not happy within 30 days, we'll refund you, no questions asked."],
    ].map(([q, a]) => `<details style="border:1px solid ${t.border};border-radius:${t.radius};padding:18px 22px;margin-bottom:12px;background:${t.surface};">
      <summary style="font-family:${t.head};font-weight:600;font-size:17px;color:${t.fg};cursor:pointer;list-style:none;">${q}</summary>
      <p style="font-size:15px;color:${t.muted};line-height:1.65;margin:12px 0 0;">${a}</p>
    </details>`).join("")}
  </div>
</section>`;

const contact = (t) =>
  `<section style="background:${t.surface};font-family:${t.body};padding:88px 32px;">
  <div style="max-width:1080px;margin:0 auto;display:grid;grid-template-columns:1fr 1.1fr;gap:56px;align-items:start;">
    <div>
      <h2 style="font-family:${t.head};font-size:40px;letter-spacing:-.02em;color:${t.fg};margin:0 0 16px;font-weight:700;">Let's talk</h2>
      <p style="font-size:17px;color:${t.muted};line-height:1.7;margin:0 0 28px;">Tell us about your project and we'll get back within one business day.</p>
      <div style="font-size:15px;color:${t.fg};line-height:2;">
        <div><strong>Email</strong> — hello@example.com</div>
        <div><strong>Phone</strong> — +1 (555) 019-2834</div>
        <div><strong>Studio</strong> — 24 Harbour St, Suite 400</div>
      </div>
    </div>
    <form action="https://formspree.io/f/your-id" method="POST" style="background:${t.bg};border:1px solid ${t.border};border-radius:${t.radius};padding:30px;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;">
        <div><label style="display:block;font-size:13px;font-weight:600;color:${t.fg};margin-bottom:6px;">Name</label><input name="name" required style="width:100%;box-sizing:border-box;padding:12px 14px;border:1px solid ${t.border};border-radius:${t.radius};font-size:15px;background:${t.surface};color:${t.fg};" /></div>
        <div><label style="display:block;font-size:13px;font-weight:600;color:${t.fg};margin-bottom:6px;">Email</label><input type="email" name="email" required style="width:100%;box-sizing:border-box;padding:12px 14px;border:1px solid ${t.border};border-radius:${t.radius};font-size:15px;background:${t.surface};color:${t.fg};" /></div>
      </div>
      <label style="display:block;font-size:13px;font-weight:600;color:${t.fg};margin-bottom:6px;">Message</label>
      <textarea name="message" rows="5" required style="width:100%;box-sizing:border-box;padding:12px 14px;border:1px solid ${t.border};border-radius:${t.radius};font-size:15px;background:${t.surface};color:${t.fg};resize:vertical;margin-bottom:16px;"></textarea>
      <button type="submit" style="width:100%;padding:14px;background:${t.accent};color:${t.onAccent};border:none;border-radius:${t.radius};font-weight:600;font-size:15px;cursor:pointer;">Send message</button>
    </form>
  </div>
</section>`;

const ctaBand = (t, { title, sub, label = "Get started" }) =>
  `<section style="background:${t.bg};font-family:${t.body};padding:80px 32px;">
  <div style="max-width:1000px;margin:0 auto;background:linear-gradient(135deg,${t.accent},${t.accent2});border-radius:calc(${t.radius} + 8px);padding:56px 40px;text-align:center;">
    <h2 style="font-family:${t.head};font-size:38px;letter-spacing:-.02em;color:${t.onAccent};margin:0 0 14px;font-weight:800;">${title}</h2>
    <p style="font-size:17px;color:${t.onAccent};opacity:.9;margin:0 auto 28px;max-width:520px;">${sub}</p>
    <a href="#" style="display:inline-block;padding:15px 34px;background:${t.onAccent};color:${t.accent};border-radius:${t.radius};text-decoration:none;font-weight:700;font-size:16px;">${label}</a>
  </div>
</section>`;

const footer = (t, brand) =>
  `<footer style="background:${t.bg};border-top:1px solid ${t.border};font-family:${t.body};padding:56px 32px 40px;">
  <div style="max-width:1160px;margin:0 auto;display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:40px;">
    <div>
      <div style="font-family:${t.head};font-weight:700;font-size:20px;color:${t.fg};margin-bottom:12px;">${brand}</div>
      <p style="font-size:14px;color:${t.muted};line-height:1.6;max-width:260px;margin:0;">Building thoughtful products since 2019.</p>
    </div>
    ${[["Product", ["Features", "Pricing", "Changelog"]], ["Company", ["About", "Careers", "Blog"]], ["Legal", ["Privacy", "Terms", "Cookies"]]].map(([h, ls]) => `<div><div style="font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:${t.fg};margin-bottom:14px;">${h}</div>${ls.map((l) => `<a href="#" style="display:block;color:${t.muted};text-decoration:none;font-size:14px;padding:5px 0;">${l}</a>`).join("")}</div>`).join("")}
  </div>
  <div style="max-width:1160px;margin:36px auto 0;padding-top:24px;border-top:1px solid ${t.border};font-size:13px;color:${t.muted};">© 2026 ${brand}. All rights reserved.</div>
</footer>`;

// ---- Ecommerce sections -------------------------------------------------------
const PRODUCTS = [
  ["p-aurora", IMG.prod1, "Aurora Bottle", 38],
  ["p-cedar", IMG.prod2, "Cedar Wash", 24],
  ["p-field", IMG.prod3, "Field Phone", 799],
  ["p-slate", IMG.prod4, "Slate Case", 45],
  ["p-member", IMG.prod1, "Member Kit", 120],
  ["p-refill", IMG.prod2, "Refill Duo", 40],
];

const productGrid = (t) =>
  `<section style="background:${t.bg};font-family:${t.body};padding:72px 32px;">
  <div style="max-width:1160px;margin:0 auto;">
    <div style="display:flex;align-items:end;justify-content:space-between;margin-bottom:32px;flex-wrap:wrap;gap:16px;">
      <div><h1 style="font-family:${t.head};font-size:40px;letter-spacing:-.02em;color:${t.fg};margin:0 0 6px;font-weight:700;">Shop all</h1><p style="font-size:15px;color:${t.muted};margin:0;">${PRODUCTS.length} products</p></div>
      <div style="display:flex;gap:8px;">${["All", "New", "Best sellers", "Sale"].map((f, i) => `<span style="padding:8px 16px;border-radius:999px;font-size:13px;border:1px solid ${t.border};background:${i === 0 ? t.accent : "transparent"};color:${i === 0 ? t.onAccent : t.muted};">${f}</span>`).join("")}</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;">
      ${PRODUCTS.map(([pid, im, nm, pr]) => `<div style="background:${t.surface};border:1px solid ${t.border};border-radius:${t.radius};overflow:hidden;">
        <div style="aspect-ratio:1/1;background:#eef1f6;overflow:hidden;"><img src="${im}" alt="" style="width:100%;height:100%;object-fit:cover;" /></div>
        <div style="padding:18px;display:flex;align-items:center;justify-content:space-between;gap:10px;">
          <div><div style="font-family:${t.head};font-size:16px;color:${t.fg};font-weight:600;">${nm}</div><div style="font-size:15px;color:${t.muted};margin-top:2px;">$${pr}</div></div>
          <button type="button" data-wd-add data-wd-id="${pid}" data-wd-name="${nm}" data-wd-price="${pr}" data-wd-cur="usd" data-wd-img="${im}" style="padding:9px 16px;background:${t.accent};color:${t.onAccent};border:none;border-radius:${t.radius};cursor:pointer;font-size:13px;font-weight:600;">Add</button>
        </div>
      </div>`).join("")}
    </div>
  </div>
</section>`;

const productDetail = (t) =>
  `<section style="background:${t.bg};font-family:${t.body};padding:64px 32px;">
  <div style="max-width:1080px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:start;">
    <div>
      <div style="aspect-ratio:1/1;border-radius:${t.radius};overflow:hidden;background:#eef1f6;margin-bottom:12px;"><img src="${IMG.prod1}" alt="" style="width:100%;height:100%;object-fit:cover;" /></div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">${[IMG.prod2, IMG.prod3, IMG.prod4, IMG.prod1].map((im, i) => `<img src="${im}" alt="" style="width:100%;height:76px;object-fit:cover;border-radius:10px;border:2px solid ${i === 0 ? t.accent : t.border};" />`).join("")}</div>
    </div>
    <div>
      <div style="color:${t.accent};font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;margin-bottom:10px;">New arrival</div>
      <h1 style="font-family:${t.head};font-size:40px;letter-spacing:-.02em;color:${t.fg};margin:0 0 10px;font-weight:700;">Aurora Bottle</h1>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:22px;"><span style="font-family:${t.head};font-size:28px;font-weight:800;color:${t.fg};">$38</span><span style="color:${t.accent};font-size:16px;">★★★★★ <span style="color:${t.muted};font-size:14px;">(214)</span></span></div>
      <p style="font-size:16px;line-height:1.7;color:${t.muted};margin:0 0 22px;">Double-walled, vacuum-sealed, and endlessly refillable. Keeps drinks cold for 24 hours and hot for 12. Made from recycled steel.</p>
      <div style="margin-bottom:20px;"><div style="font-size:13px;font-weight:600;color:${t.fg};margin-bottom:8px;">Colour</div><div style="display:flex;gap:10px;">${["#0f172a", "#b45309", "#166534", "#e2e8f0"].map((c, i) => `<span style="width:32px;height:32px;border-radius:999px;background:${c};border:2px solid ${i === 0 ? t.accent : t.border};"></span>`).join("")}</div></div>
      <div style="display:flex;gap:12px;align-items:center;">
        <button type="button" data-wd-add data-wd-id="p-aurora" data-wd-name="Aurora Bottle" data-wd-price="38" data-wd-cur="usd" data-wd-img="${IMG.prod1}" style="flex:1;text-align:center;padding:15px;background:${t.accent};color:${t.onAccent};border:none;border-radius:${t.radius};cursor:pointer;font-weight:700;font-size:16px;">Add to cart · $38</button>
        <a href="#" style="padding:15px 22px;border:1px solid ${t.border};color:${t.fg};border-radius:${t.radius};text-decoration:none;font-weight:600;">♥</a>
      </div>
      <div style="margin-top:20px;font-size:13px;color:${t.muted};">Free shipping over $50 · 30-day returns</div>
    </div>
  </div>
</section>`;

const cart = (t) =>
  `<section style="background:${t.surface};font-family:${t.body};padding:64px 32px;min-height:70vh;">
  <div style="max-width:1000px;margin:0 auto;">
    <h1 style="font-family:${t.head};font-size:36px;letter-spacing:-.02em;color:${t.fg};margin:0 0 28px;font-weight:700;">Your cart</h1>
    <div style="display:grid;grid-template-columns:1.6fr 1fr;gap:28px;align-items:start;">
      <div style="background:${t.bg};border:1px solid ${t.border};border-radius:${t.radius};overflow:hidden;">
        ${[[IMG.prod1, "Aurora Bottle", "Slate · 1", "$38"], [IMG.prod2, "Cedar Wash", "500ml · 2", "$48"], [IMG.prod4, "Slate Case", "13\" · 1", "$45"]].map(([im, nm, va, pr], i) => `<div style="display:flex;gap:16px;align-items:center;padding:18px 20px;${i ? `border-top:1px solid ${t.border};` : ""}">
          <img src="${im}" alt="" style="width:64px;height:64px;object-fit:cover;border-radius:12px;" />
          <div style="flex:1;"><div style="font-family:${t.head};font-weight:600;color:${t.fg};">${nm}</div><div style="font-size:13px;color:${t.muted};margin-top:2px;">${va}</div></div>
          <div style="font-weight:600;color:${t.fg};">${pr}</div>
        </div>`).join("")}
      </div>
      <div style="background:${t.bg};border:1px solid ${t.border};border-radius:${t.radius};padding:24px;">
        <div style="font-family:${t.head};font-weight:700;font-size:18px;color:${t.fg};margin-bottom:16px;">Summary</div>
        ${[["Subtotal", "$131.00"], ["Shipping", "Free"], ["Tax", "$10.48"]].map(([k, v]) => `<div style="display:flex;justify-content:space-between;font-size:15px;color:${t.muted};padding:6px 0;">${k}<span style="color:${t.fg};">${v}</span></div>`).join("")}
        <div style="display:flex;justify-content:space-between;font-family:${t.head};font-weight:800;font-size:20px;color:${t.fg};padding:14px 0;border-top:1px solid ${t.border};margin-top:8px;">Total<span>$141.48</span></div>
        <a href="#" onclick="var b=document.getElementById('wdc-open');if(b){b.click();}return false;" style="display:block;text-align:center;padding:15px;background:${t.accent};color:${t.onAccent};border-radius:${t.radius};text-decoration:none;font-weight:700;margin-top:8px;">Checkout</a>
        <p style="font-size:12px;color:${t.muted};text-align:center;margin:12px 0 0;">Secure payment · Powered by Stripe</p>
      </div>
    </div>
  </div>
</section>`;

const cartRuntime = (accent = "#4f46e5") => buildCartRuntimeHtml({ accent, currency: "usd" });

const TClinic = { ...T.modern, accent: "#0d9488", accent2: "#14b8a6" };
const TCharity = { ...T.modern, accent: "#ea580c", accent2: "#f97316" };

// Generic ordered list — episodes, service times, schedules, tour dates.
const simpleList = (t, title, rows) =>
  `<section style="background:${t.bg};font-family:${t.body};padding:72px 32px;">
  <div style="max-width:820px;margin:0 auto;">
    <h2 style="font-family:${t.head};font-size:34px;color:${t.fg};margin:0 0 26px;letter-spacing:-.02em;font-weight:700;">${title}</h2>
    ${rows.map(([a, b, c]) => `<div style="display:flex;align-items:center;gap:20px;padding:16px 0;border-bottom:1px solid ${t.border};">
      <div style="font-family:${t.head};font-weight:700;color:${t.accent};min-width:120px;">${a}</div>
      <div style="flex:1;color:${t.fg};font-weight:600;">${b}</div>
      <div style="color:${t.muted};font-size:14px;">${c || ""}</div>
    </div>`).join("")}
  </div>
</section>`;

const specs = (t, items) =>
  `<section style="background:${t.surface};font-family:${t.body};padding:64px 32px;">
  <div style="max-width:1000px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:16px;">
    ${items.map(([l, v]) => `<div style="background:${t.bg};border:1px solid ${t.border};border-radius:${t.radius};padding:24px;text-align:center;">
      <div style="font-family:${t.head};font-size:30px;font-weight:800;color:${t.fg};">${v}</div>
      <div style="color:${t.muted};font-size:12px;margin-top:6px;text-transform:uppercase;letter-spacing:.06em;">${l}</div>
    </div>`).join("")}
  </div>
</section>`;

const listenOn = (t) =>
  `<section style="background:${t.surface};font-family:${t.body};padding:40px 32px;text-align:center;">
  <div style="color:${t.muted};font-size:13px;text-transform:uppercase;letter-spacing:.08em;margin-bottom:16px;">Listen on</div>
  <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
    ${["Spotify", "Apple Podcasts", "YouTube", "Overcast", "Pocket Casts"].map((n) => `<span style="padding:10px 20px;border:1px solid ${t.border};border-radius:999px;color:${t.fg};font-size:14px;">${n}</span>`).join("")}
  </div>
</section>`;

const changelog = (t) =>
  `<section style="background:${t.bg};font-family:${t.body};padding:72px 32px;">
  <div style="max-width:760px;margin:0 auto;">
    <h1 style="font-family:${t.head};font-size:42px;color:${t.fg};margin:0 0 8px;letter-spacing:-.02em;font-weight:700;">Changelog</h1>
    <p style="color:${t.muted};margin:0 0 40px;font-size:16px;">Every improvement we ship, in one place.</p>
    ${[["v3.4.0", "Jun 2026", ["New AI section generator", "Canvas rendering ~40% faster", "Fixed a handful of export edge cases"]], ["v3.3.0", "May 2026", ["Multi-page templates", "Dark mode for the editor", "Better keyboard shortcuts"]], ["v3.2.0", "Apr 2026", ["Form builder", "Publish presets", "28 new starters"]]].map(([v, d, notes]) => `<div style="display:grid;grid-template-columns:150px 1fr;gap:20px;padding:22px 0;border-top:1px solid ${t.border};">
      <div><span style="display:inline-block;background:${t.accent}1a;color:${t.accent};font-weight:700;font-size:13px;padding:4px 10px;border-radius:8px;">${v}</span><div style="color:${t.muted};font-size:12px;margin-top:8px;">${d}</div></div>
      <ul style="margin:0;padding-left:18px;color:${t.fg};font-size:15px;line-height:1.8;">${notes.map((n) => `<li>${n}</li>`).join("")}</ul>
    </div>`).join("")}
  </div>
</section>`;

// ---- Compose recipes ----------------------------------------------------------
const layout = (id, category, label, description, t, blocks) => ({
  id, category, label, description, canvasBg: t.bg, fonts: t.fonts, blocks,
});

const BRAND = "Northwind";

export const PAGE_LAYOUTS = [
  // ---------------- Home ----------------
  layout("home-modern", "Home", "Home · Modern SaaS", "Clean centered hero, feature grid, stats and CTA.", T.modern, [
    nav(T.modern, BRAND), heroCenter(T.modern, { eyebrow: "New in 2026", title: "The workspace your team will actually enjoy", sub: "Plan, build and ship in one calm place. No clutter, no lock-in — just momentum." }),
    logos(T.modern),
    features(T.modern, { title: "Everything in one place", sub: "Powerful on its own, unstoppable together.", items: [{ icon: "bolt", title: "Blazing fast", desc: "Sub-100ms interactions, everywhere. Speed you can feel." }, { icon: "layers", title: "Composable", desc: "Mix blocks and views to fit exactly how your team works." }, { icon: "shield", title: "Secure by default", desc: "SOC 2, SSO and granular permissions from day one." }] }),
    stats(T.modern, [{ k: "12k+", v: "Teams" }, { k: "99.9%", v: "Uptime" }, { k: "4.9★", v: "Avg rating" }, { k: "60+", v: "Integrations" }]),
    testimonials(T.modern), ctaBand(T.modern, { title: "Start building in minutes", sub: "Free for 14 days. No credit card required." }), footer(T.modern, BRAND),
  ]),
  layout("home-bold", "Home", "Home · Bold Dark", "High-contrast dark hero with image split and punchy CTA.", T.bold, [
    nav(T.bold, BRAND), heroSplit(T.bold, { eyebrow: "Studio", title: "We make brands impossible to ignore", sub: "Strategy, identity and motion for companies that refuse to blend in.", img: IMG.land4 }),
    features(T.bold, { title: "How we help", sub: "Full-stack creative, one accountable team.", items: [{ icon: "spark", title: "Brand identity", desc: "Names, logos and systems with a point of view." }, { icon: "chart", title: "Growth design", desc: "Landing pages and funnels that actually convert." }, { icon: "globe", title: "Motion & 3D", desc: "Scroll-driven stories and immersive product films." }] }),
    gallery(T.bold, [IMG.land, IMG.land3, IMG.land7, IMG.land5, IMG.land2, IMG.land6]),
    ctaBand(T.bold, { title: "Let's make something loud", sub: "Book a 20-minute intro call this week.", label: "Book a call" }), footer(T.bold, BRAND),
  ]),
  layout("home-editorial", "Home", "Home · Editorial", "Warm, typographic homepage for writers and studios.", T.editorial, [
    nav(T.editorial, "Fraunces & Co"), heroCenter(T.editorial, { eyebrow: "Est. 2019", title: "A slower, more considered internet", sub: "We write, design and publish things worth keeping. Take your time in here." }),
    about(T.editorial, { title: "Our story", body: ["We started at a kitchen table with a stubborn belief that the web could feel warmer.", "Seven years later that belief hasn't budged — it's just grown a few more chairs."], img: IMG.land5 }),
    blogList(T.editorial), footer(T.editorial, "Fraunces & Co"),
  ]),

  // ---------------- About ----------------
  layout("about-modern", "About", "About · Modern", "Story, values and a friendly team grid.", T.modern, [
    nav(T.modern, BRAND), heroCenter(T.modern, { eyebrow: "About us", title: "We're a small team with big opinions", sub: "Ten people, four time zones, one shared obsession with doing things properly." }),
    about(T.modern, { title: "Why we exist", body: ["Software should get out of your way. Too much of it doesn't.", "We build the calm, fast tools we always wished we had."], img: IMG.land7 }),
    values(T.modern), stats(T.modern, [{ k: "2019", v: "Founded" }, { k: "10", v: "Team" }, { k: "40+", v: "Countries" }, { k: "1", v: "Mission" }]),
    team(T.modern), footer(T.modern, BRAND),
  ]),
  layout("about-editorial", "About", "About · Editorial", "Long-form, warm about page for personal brands.", T.editorial, [
    nav(T.editorial, "Fraunces & Co"), heroCenter(T.editorial, { eyebrow: "Hello", title: "The people behind the words", sub: "A studio of writers, editors and designers who still love a good sentence." }),
    about(T.editorial, { title: "How it began", body: ["It began, as most good things do, with a disagreement about fonts.", "We've been arguing productively ever since — and publishing the results."], img: IMG.land3 }),
    team(T.editorial), footer(T.editorial, "Fraunces & Co"),
  ]),

  // ---------------- Services ----------------
  layout("services-modern", "Services", "Services · Modern", "Service cards, process steps and pricing.", T.modern, [
    nav(T.modern, BRAND), heroCenter(T.modern, { eyebrow: "Services", title: "Everything you need, under one roof", sub: "From first sketch to launch day and beyond — pick a package or build your own." }),
    servicesGrid(T.modern), pricing(T.modern), ctaBand(T.modern, { title: "Not sure where to start?", sub: "Book a free consult and we'll point you the right way." }), footer(T.modern, BRAND),
  ]),
  layout("services-bold", "Services", "Services · Agency", "Dark, confident services page for agencies.", T.bold, [
    nav(T.bold, BRAND), heroSplit(T.bold, { eyebrow: "What we do", title: "Full-service, no hand-offs", sub: "One team owns your project end to end. No finger-pointing, no lost context.", img: IMG.land2 }),
    servicesGrid(T.bold), testimonials(T.bold), footer(T.bold, BRAND),
  ]),

  // ---------------- Blog ----------------
  layout("blog-modern", "Blog", "Blog · Grid", "Two-column blog index with categories.", T.modern, [
    nav(T.modern, BRAND), blogList(T.modern), ctaBand(T.modern, { title: "Never miss a post", sub: "One thoughtful email a week. Unsubscribe anytime.", label: "Subscribe" }), footer(T.modern, BRAND),
  ]),
  layout("blog-editorial", "Blog", "Blog · Journal", "Warm, reading-first blog layout.", T.editorial, [
    nav(T.editorial, "Fraunces & Co"), blogList(T.editorial), footer(T.editorial, "Fraunces & Co"),
  ]),

  // ---------------- Portfolio ----------------
  layout("portfolio-bold", "Portfolio", "Portfolio · Dark Grid", "Bold gallery-forward portfolio.", T.bold, [
    nav(T.bold, "STUDIO —"), heroCenter(T.bold, { eyebrow: "Portfolio", title: "Selected work, 2019–2026", sub: "Brand, product and motion for clients who like to stand out." }),
    gallery(T.bold, [IMG.land, IMG.land4, IMG.land7, IMG.land5, IMG.land2, IMG.land6]), ctaBand(T.bold, { title: "Have a project in mind?", sub: "Tell us about it.", label: "Start a project" }), footer(T.bold, "STUDIO —"),
  ]),
  layout("portfolio-min", "Portfolio", "Portfolio · Masonry", "Minimal white masonry portfolio.", T.modern, [
    nav(T.modern, "A. Reyes"), heroCenter(T.modern, { eyebrow: "Photographer", title: "Light, quietly captured", sub: "Editorial and travel photography from wherever the good light is." }),
    masonry(T.modern, [IMG.land3, IMG.land5, IMG.land, IMG.land7, IMG.land2, IMG.land4, IMG.land6, IMG.hotel2, IMG.land3]), footer(T.modern, "A. Reyes"),
  ]),
  layout("portfolio-editorial", "Portfolio", "Portfolio · Editorial", "Case-study led, warm portfolio.", T.editorial, [
    nav(T.editorial, "Studio Fraunces"), heroSplit(T.editorial, { eyebrow: "Case studies", title: "Work we're proud to show", sub: "A handful of projects, each with a story worth telling.", img: IMG.land5 }),
    gallery(T.editorial, [IMG.land, IMG.land3, IMG.land7, IMG.land4, IMG.land2, IMG.land6]), footer(T.editorial, "Studio Fraunces"),
  ]),

  // ---------------- Contact ----------------
  layout("contact-modern", "Contact", "Contact · Modern", "Contact details plus a working form.", T.modern, [
    nav(T.modern, BRAND), heroCenter(T.modern, { eyebrow: "Contact", title: "We'd love to hear from you", sub: "Questions, ideas, or just saying hi — the inbox is open." }),
    contact(T.modern), footer(T.modern, BRAND),
  ]),
  layout("contact-bold", "Contact", "Contact · Dark", "High-contrast contact page.", T.bold, [
    nav(T.bold, BRAND), contact(T.bold), footer(T.bold, BRAND),
  ]),

  // ---------------- FAQ ----------------
  layout("faq-modern", "FAQ", "FAQ · Accordion", "Native accordion FAQ with CTA.", T.modern, [
    nav(T.modern, BRAND), faq(T.modern), ctaBand(T.modern, { title: "Still have questions?", sub: "Our team replies within a business day.", label: "Contact us" }), footer(T.modern, BRAND),
  ]),
  layout("faq-editorial", "FAQ", "FAQ · Editorial", "Warm, calm FAQ layout.", T.editorial, [
    nav(T.editorial, "Fraunces & Co"), faq(T.editorial), footer(T.editorial, "Fraunces & Co"),
  ]),

  // ---------------- Pricing ----------------
  layout("pricing-modern", "Pricing", "Pricing · 3 Tier", "Three-tier pricing with FAQ.", T.modern, [
    nav(T.modern, BRAND), pricing(T.modern), faq(T.modern), footer(T.modern, BRAND),
  ]),
  layout("pricing-bold", "Pricing", "Pricing · Dark", "Bold dark pricing page.", T.bold, [
    nav(T.bold, BRAND), heroCenter(T.bold, { eyebrow: "Pricing", title: "Pay for what you use", sub: "Transparent plans that scale with your team." }), pricing(T.bold), footer(T.bold, BRAND),
  ]),

  // ---------------- Team ----------------
  layout("team-modern", "Team", "Team · Grid", "Team directory with stats.", T.modern, [
    nav(T.modern, BRAND), heroCenter(T.modern, { eyebrow: "Our people", title: "Say hello to the team", sub: "Senior, kind and slightly obsessed with the details." }),
    team(T.modern), stats(T.modern, [{ k: "10", v: "Humans" }, { k: "4", v: "Time zones" }, { k: "72", v: "NPS" }, { k: "∞", v: "Coffee" }]), footer(T.modern, BRAND),
  ]),

  // ---------------- Testimonials ----------------
  layout("testimonials-modern", "Testimonials", "Testimonials · Wall", "Social-proof wall with CTA.", T.modern, [
    nav(T.modern, BRAND), heroCenter(T.modern, { eyebrow: "Wall of love", title: "Don't take our word for it", sub: "Thousands of teams trust us with their most important work." }),
    testimonials(T.modern), stats(T.modern, [{ k: "12k+", v: "Customers" }, { k: "4.9★", v: "Rating" }, { k: "98%", v: "Would recommend" }]), footer(T.modern, BRAND),
  ]),

  // ---------------- Coming soon / 404 ----------------
  layout("coming-bold", "Coming soon", "Coming Soon · Dark", "Launch teaser with email capture.", T.bold, [
    `<section style="min-height:100vh;background:${T.bold.bg};font-family:${T.bold.body};display:flex;align-items:center;justify-content:center;padding:32px;text-align:center;">
      <div style="max-width:560px;">
        <div style="color:${T.bold.accent};font-weight:700;letter-spacing:.16em;text-transform:uppercase;font-size:13px;margin-bottom:24px;">Launching soon</div>
        <h1 style="font-family:${T.bold.head};font-size:64px;line-height:1.02;letter-spacing:-.03em;color:${T.bold.fg};margin:0 0 20px;">Something good is on the way</h1>
        <p style="font-size:18px;color:${T.bold.muted};line-height:1.6;margin:0 0 32px;">Be the first to know when we open the doors. No spam, ever.</p>
        <form action="https://formspree.io/f/your-id" method="POST" style="display:flex;gap:10px;max-width:420px;margin:0 auto;">
          <input type="email" name="email" placeholder="you@example.com" required style="flex:1;padding:15px 18px;border-radius:${T.bold.radius};border:1px solid ${T.bold.border};background:${T.bold.surface};color:${T.bold.fg};font-size:15px;" />
          <button style="padding:15px 26px;background:${T.bold.accent};color:${T.bold.onAccent};border:none;border-radius:${T.bold.radius};font-weight:700;cursor:pointer;">Notify me</button>
        </form>
      </div>
    </section>`,
  ]),
  layout("coming-editorial", "Coming soon", "Coming Soon · Warm", "Elegant under-construction page.", T.editorial, [
    `<section style="min-height:100vh;background:${T.editorial.bg};font-family:${T.editorial.body};display:flex;align-items:center;justify-content:center;padding:32px;text-align:center;">
      <div style="max-width:560px;">
        <div style="color:${T.editorial.accent};font-style:italic;font-size:20px;margin-bottom:20px;">Under construction</div>
        <h1 style="font-family:${T.editorial.head};font-size:58px;line-height:1.05;color:${T.editorial.fg};margin:0 0 18px;font-weight:400;">We're tidying the place up</h1>
        <p style="font-size:18px;color:${T.editorial.muted};line-height:1.7;margin:0 0 30px;">Back very soon. In the meantime, leave your email and we'll wave when we're ready.</p>
        <form action="https://formspree.io/f/your-id" method="POST" style="display:flex;gap:10px;max-width:420px;margin:0 auto;">
          <input type="email" name="email" placeholder="you@example.com" required style="flex:1;padding:14px 18px;border-radius:${T.editorial.radius};border:1px solid ${T.editorial.border};background:${T.editorial.surface};color:${T.editorial.fg};font-size:15px;" />
          <button style="padding:14px 24px;background:${T.editorial.accent};color:${T.editorial.onAccent};border:none;border-radius:${T.editorial.radius};font-weight:600;cursor:pointer;">Keep me posted</button>
        </form>
      </div>
    </section>`,
  ]),
  layout("notfound-bold", "404", "404 · Dark", "Playful 404 error page.", T.bold, [
    `<section style="min-height:100vh;background:${T.bold.bg};font-family:${T.bold.body};display:flex;align-items:center;justify-content:center;padding:32px;text-align:center;">
      <div style="max-width:520px;">
        <div style="font-family:${T.bold.head};font-size:140px;font-weight:800;line-height:1;background:linear-gradient(135deg,${T.bold.accent},${T.bold.accent2});-webkit-background-clip:text;background-clip:text;color:transparent;">404</div>
        <h1 style="font-family:${T.bold.head};font-size:32px;color:${T.bold.fg};margin:8px 0 14px;">This page wandered off</h1>
        <p style="font-size:17px;color:${T.bold.muted};line-height:1.6;margin:0 0 28px;">The link may be broken or the page may have moved. Let's get you back.</p>
        <a href="/" style="display:inline-block;padding:14px 30px;background:${T.bold.accent};color:${T.bold.onAccent};border-radius:${T.bold.radius};text-decoration:none;font-weight:700;">Back to home</a>
      </div>
    </section>`,
  ]),
  layout("notfound-modern", "404", "404 · Minimal", "Clean minimal 404 page.", T.modern, [
    `<section style="min-height:100vh;background:${T.modern.bg};font-family:${T.modern.body};display:flex;align-items:center;justify-content:center;padding:32px;text-align:center;">
      <div style="max-width:520px;">
        <div style="font-family:${T.modern.head};font-size:120px;font-weight:800;color:${T.modern.accent};line-height:1;">404</div>
        <h1 style="font-family:${T.modern.head};font-size:30px;color:${T.modern.fg};margin:10px 0 12px;">Page not found</h1>
        <p style="font-size:16px;color:${T.modern.muted};line-height:1.6;margin:0 0 26px;">We couldn't find what you were looking for.</p>
        <a href="/" style="display:inline-block;padding:13px 28px;background:${T.modern.accent};color:${T.modern.onAccent};border-radius:${T.modern.radius};text-decoration:none;font-weight:600;">Go home</a>
      </div>
    </section>`,
  ]),

  // ---------------- Ecommerce ----------------
  layout("shop-catalog", "Shop", "Shop · Catalog Grid", "Working catalog — add to cart opens a live checkout drawer.", T.modern, [
    nav(T.modern, "MARKET", ["Shop", "New", "About", "Cart"]), productGrid(T.modern),
    ctaBand(T.modern, { title: "Free shipping over $50", sub: "Plus 30-day easy returns on everything.", label: "Shop now" }), footer(T.modern, "MARKET"), cartRuntime(T.modern.accent),
  ]),
  layout("shop-catalog-bold", "Shop", "Shop · Dark Store", "Bold dark storefront with a working cart.", T.bold, [
    nav(T.bold, "OBSIDIAN", ["Shop", "Drops", "Story", "Cart"]), heroCenter(T.bold, { eyebrow: "SS26 drop", title: "Gear that outlasts the hype", sub: "Small-batch essentials, built to be used hard." }), productGrid(T.bold), footer(T.bold, "OBSIDIAN"), cartRuntime(T.bold.accent),
  ]),
  layout("shop-product", "Shop", "Product Detail", "Single product page with a working add-to-cart.", T.modern, [
    nav(T.modern, "MARKET", ["Shop", "New", "About", "Cart"]), productDetail(T.modern),
    features(T.modern, { title: "Why you'll love it", sub: "Designed to be the last one you'll buy.", items: [{ icon: "shield", title: "Lifetime warranty", desc: "If it breaks, we replace it. Simple as that." }, { icon: "globe", title: "Carbon neutral", desc: "Every order offsets its own shipping footprint." }, { icon: "heart", title: "Loved by 10k+", desc: "Rated 4.9/5 across thousands of reviews." }] }), footer(T.modern, "MARKET"), cartRuntime(T.modern.accent),
  ]),
  layout("shop-cart", "Shop", "Shop + Working Cart", "Storefront wired to a live cart drawer + Stripe/PayPal checkout.", T.modern, [
    nav(T.modern, "MARKET", ["Shop", "New", "About", "Cart"]),
    heroCenter(T.modern, { eyebrow: "Live demo", title: "Add to cart, then check out for real", sub: "Items save in the cart drawer (bottom-right). Checkout hands off to Stripe or PayPal." }),
    productGrid(T.modern), cart(T.modern), footer(T.modern, "MARKET"), cartRuntime(T.modern.accent),
  ]),
  layout("shop-thankyou", "Shop", "Thank You / Order Received", "Post-checkout confirmation page (shows a success banner).", T.modern, [
    nav(T.modern, "MARKET", ["Shop", "New", "About", "Cart"]),
    `<section style="font-family:${T.modern.body};background:${T.modern.bg};padding:110px 32px;text-align:center;">
      <div style="max-width:560px;margin:0 auto;">
        <div style="width:76px;height:76px;border-radius:999px;background:#16a34a1a;color:#16a34a;display:flex;align-items:center;justify-content:center;margin:0 auto 24px;font-size:38px;">✓</div>
        <h1 style="font-family:${T.modern.head};font-size:42px;letter-spacing:-.02em;color:${T.modern.fg};margin:0 0 14px;font-weight:700;">Thank you for your order!</h1>
        <p style="font-size:17px;color:${T.modern.muted};line-height:1.6;margin:0 0 30px;">Your payment was successful and a confirmation email is on its way. Order <strong style="color:${T.modern.fg};">#WD-2026-1042</strong>.</p>
        <a href="/" style="display:inline-block;padding:14px 30px;background:${T.modern.accent};color:${T.modern.onAccent};border-radius:${T.modern.radius};text-decoration:none;font-weight:600;">Continue shopping</a>
      </div>
    </section>`,
    footer(T.modern, "MARKET"), cartRuntime(T.modern.accent),
  ]),

  // ---------------- Industries ----------------
  layout("industry-esports", "Industry", "Esports Org", "Neon competitive-gaming team homepage.", T.neon, [
    nav(T.neon, "APEX//GG", ["Roster", "Matches", "Shop", "Sponsors"]),
    heroImage(T.neon, { title: "WE PLAY TO WIN", sub: "Six titles. One roster. Zero fear. Follow the squad rewriting the leaderboard.", img: IMG.esports3, primary: "Watch live" }),
    stats(T.neon, [{ k: "27", v: "Trophies" }, { k: "#1", v: "Regional rank" }, { k: "2.4M", v: "Followers" }, { k: "6", v: "Divisions" }]),
    `<section style="background:${T.neon.surface};font-family:${T.neon.body};padding:80px 32px;">
      <div style="max-width:1160px;margin:0 auto;"><h2 style="font-family:${T.neon.head};font-size:34px;letter-spacing:.02em;color:${T.neon.fg};margin:0 0 32px;text-transform:uppercase;">The Roster</h2>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px;">
      ${[[IMG.esports1, "V1PER", "Duelist"], [IMG.esports2, "GHOST", "IGL"], [IMG.esports3, "NOVA", "Support"]].map(([im, nm, ro]) => `<div style="position:relative;border:1px solid ${T.neon.border};border-radius:${T.neon.radius};overflow:hidden;"><img src="${im}" alt="" style="width:100%;height:260px;object-fit:cover;filter:saturate(1.1);" /><div style="position:absolute;left:0;right:0;bottom:0;padding:16px;background:linear-gradient(0deg,rgba(5,6,15,.95),transparent);"><div style="font-family:${T.neon.head};font-size:22px;color:${T.neon.accent};">${nm}</div><div style="color:${T.neon.muted};font-size:13px;text-transform:uppercase;letter-spacing:.1em;">${ro}</div></div></div>`).join("")}
      </div></div>
    </section>`,
    ctaBand(T.neon, { title: "JOIN THE ARMY", sub: "Merch drops, match alerts and Discord access.", label: "Enlist now" }), footer(T.neon, "APEX//GG"),
  ]),
  layout("industry-band", "Industry", "Band / Musician", "Gritty tour-and-music landing page.", T.bold, [
    nav(T.bold, "THE STATIC", ["Music", "Tour", "Merch", "About"]),
    heroImage(T.bold, { title: "New album — 'NIGHT SIGNALS'", sub: "Out now everywhere. Catch us on the 24-city world tour this summer.", img: IMG.band2, primary: "Listen now" }),
    `<section style="background:${T.bold.surface};font-family:${T.bold.body};padding:72px 32px;">
      <div style="max-width:880px;margin:0 auto;"><h2 style="font-family:${T.bold.head};font-size:32px;color:${T.bold.fg};margin:0 0 26px;">Tour dates</h2>
      ${[["JUN 14", "Brooklyn, NY", "Warsaw"], ["JUN 18", "Chicago, IL", "Metro"], ["JUN 22", "Austin, TX", "Mohawk"], ["JUN 29", "Los Angeles, CA", "The Echo"]].map(([d, c, v]) => `<div style="display:flex;align-items:center;gap:20px;padding:16px 0;border-bottom:1px solid ${T.bold.border};"><div style="font-family:${T.bold.head};font-weight:800;color:${T.bold.accent};width:90px;">${d}</div><div style="flex:1;"><div style="color:${T.bold.fg};font-weight:600;">${c}</div><div style="color:${T.bold.muted};font-size:14px;">${v}</div></div><a href="#" style="padding:9px 20px;border:1px solid ${T.bold.accent};color:${T.bold.accent};border-radius:${T.bold.radius};text-decoration:none;font-size:13px;font-weight:700;">Tickets</a></div>`).join("")}
      </div>
    </section>`,
    gallery(T.bold, [IMG.band1, IMG.band3, IMG.band2, IMG.band1, IMG.band3, IMG.band2]),
    ctaBand(T.bold, { title: "Get the merch", sub: "Limited tour tees, vinyl and more.", label: "Shop merch" }), footer(T.bold, "THE STATIC"),
  ]),
  layout("industry-hotel", "Industry", "Hotel / Resort", "Elegant boutique-hotel homepage.", T.elegant, [
    nav(T.elegant, "MAISON RIVA", ["Rooms", "Dining", "Spa", "Book"]),
    heroImage(T.elegant, { title: "Stay a while", sub: "A quiet harbour-side retreat where every detail is considered and the coffee is always warm.", img: IMG.hotel1, primary: "Check availability" }),
    about(T.elegant, { title: "The Maison", body: ["Twenty-four rooms, one restaurant, and a garden that hums in the evenings.", "We built this place for slow mornings and long dinners."], img: IMG.hotel3 }),
    `<section style="background:${T.elegant.surface};font-family:${T.elegant.body};padding:80px 32px;">
      <div style="max-width:1160px;margin:0 auto;"><h2 style="font-family:${T.elegant.head};font-size:38px;color:${T.elegant.fg};margin:0 0 32px;">Rooms & suites</h2>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;">
      ${[[IMG.hotel1, "Harbour Room", "from $220"], [IMG.hotel2, "Garden Suite", "from $340"], [IMG.hotel3, "The Penthouse", "from $620"]].map(([im, nm, pr]) => `<div style="border:1px solid ${T.elegant.border};border-radius:${T.elegant.radius};overflow:hidden;background:${T.elegant.bg};"><img src="${im}" alt="" style="width:100%;height:230px;object-fit:cover;" /><div style="padding:20px;"><div style="font-family:${T.elegant.head};font-size:22px;color:${T.elegant.fg};">${nm}</div><div style="color:${T.elegant.accent};font-size:14px;letter-spacing:.08em;margin-top:6px;">${pr} / night</div></div></div>`).join("")}
      </div></div>
    </section>`,
    ctaBand(T.elegant, { title: "Reserve your stay", sub: "Best rates guaranteed when you book direct.", label: "Book now" }), footer(T.elegant, "MAISON RIVA"),
  ]),
  layout("industry-restaurant", "Industry", "Restaurant", "Warm restaurant homepage with menu.", T.editorial, [
    nav(T.editorial, "Olive & Ash", ["Menu", "Reservations", "About", "Contact"]),
    heroImage(T.editorial, { title: "Seasonal, local, unhurried", sub: "A neighbourhood kitchen serving what's good right now. Walk-ins welcome, regulars adored.", img: IMG.food1, primary: "Reserve a table" }),
    `<section style="background:${T.editorial.bg};font-family:${T.editorial.body};padding:80px 32px;">
      <div style="max-width:820px;margin:0 auto;"><h2 style="font-family:${T.editorial.head};font-size:38px;color:${T.editorial.fg};margin:0 0 30px;text-align:center;">This week's menu</h2>
      ${[["Burrata & heirloom tomato", "basil oil, sourdough", "16"], ["Hand-rolled cavatelli", "brown butter, sage, walnut", "24"], ["Charred sea bream", "fennel, blood orange, dill", "31"], ["Olive oil cake", "mascarpone, honey", "12"]].map(([n, d, p]) => `<div style="display:flex;align-items:baseline;gap:14px;padding:14px 0;border-bottom:1px dashed ${T.editorial.border};"><div style="flex:1;"><div style="font-family:${T.editorial.head};font-size:20px;color:${T.editorial.fg};">${n}</div><div style="color:${T.editorial.muted};font-style:italic;font-size:15px;">${d}</div></div><div style="font-family:${T.editorial.head};font-size:20px;color:${T.editorial.accent};">$${p}</div></div>`).join("")}
      </div>
    </section>`,
    gallery(T.editorial, [IMG.food2, IMG.food3, IMG.food1, IMG.food2, IMG.food3, IMG.food1]),
    footer(T.editorial, "Olive & Ash"),
  ]),
  layout("industry-gym", "Industry", "Gym / Fitness", "Energetic fitness studio homepage.", T.bold, [
    nav(T.bold, "IRONHOUSE", ["Classes", "Coaches", "Pricing", "Join"]),
    heroImage(T.bold, { title: "STRONGER EVERY DAY", sub: "Coaching, classes and community for people who show up. First session is on us.", img: IMG.gym2, primary: "Start free trial" }),
    features(T.bold, { title: "Train your way", sub: "Programmes for every level and goal.", items: [{ icon: "bolt", title: "Strength", desc: "Barbell fundamentals to advanced periodised programming." }, { icon: "heart", title: "Conditioning", desc: "High-intensity classes that leave you buzzing." }, { icon: "shield", title: "Mobility", desc: "Recover smarter and move better for the long haul." }] }),
    `<section style="background:${T.bold.surface};font-family:${T.bold.body};padding:72px 32px;"><div style="max-width:1000px;margin:0 auto;"><h2 style="font-family:${T.bold.head};font-size:32px;color:${T.bold.fg};margin:0 0 26px;">This week's schedule</h2><div style="display:grid;grid-template-columns:repeat(2,1fr);gap:14px;">${[["Mon 6:00", "Strength 101"], ["Tue 7:30", "HIIT Blast"], ["Wed 6:00", "Olympic Lifting"], ["Thu 18:00", "Mobility Flow"], ["Fri 6:00", "Full Body"], ["Sat 9:00", "Community WOD"]].map(([t, c]) => `<div style="display:flex;justify-content:space-between;padding:16px 20px;background:${T.bold.bg};border:1px solid ${T.bold.border};border-radius:${T.bold.radius};"><span style="color:${T.bold.fg};font-weight:600;">${c}</span><span style="color:${T.bold.accent};font-family:${T.bold.head};">${t}</span></div>`).join("")}</div></div></section>`,
    pricing(T.bold), footer(T.bold, "IRONHOUSE"),
  ]),
  layout("industry-photography", "Industry", "Photography", "Minimal photographer portfolio.", T.modern, [
    nav(T.modern, "STILLS", ["Work", "Prints", "About", "Contact"]),
    heroImage(T.modern, { title: "Stills that stay with you", sub: "Wedding, editorial and fine-art photography. Booking select projects for 2026.", img: IMG.land5, primary: "See the work" }),
    masonry(T.modern, [IMG.land3, IMG.land, IMG.land7, IMG.land4, IMG.land2, IMG.land6, IMG.hotel2, IMG.land5, IMG.land3]),
    contact(T.modern), footer(T.modern, "STILLS"),
  ]),
  layout("industry-agency", "Industry", "Creative Agency", "Confident agency homepage.", T.modern, [
    nav(T.modern, "NORTH&Co"),
    heroSplit(T.modern, { eyebrow: "Independent agency", title: "Ideas that move markets", sub: "Brand, digital and campaigns for ambitious companies. We're small on purpose and sharp by design.", img: IMG.land2 }),
    logos(T.modern), servicesGrid(T.modern), testimonials(T.modern), ctaBand(T.modern, { title: "Let's build your next chapter", sub: "Tell us where you want to go." }), footer(T.modern, "NORTH&Co"),
  ]),
  layout("industry-saas", "Industry", "SaaS Product", "Gradient SaaS product landing page.", T.modern, [
    nav(T.modern, "Flowly"),
    heroCenter(T.modern, { eyebrow: "Automate the busywork", title: "Your workflows, finally on autopilot", sub: "Connect your tools, set a trigger, and let Flowly handle the rest. No code required." }),
    logos(T.modern),
    features(T.modern, { title: "Built for busy teams", sub: "Everything you need to move faster.", items: [{ icon: "bolt", title: "500+ integrations", desc: "Connect the apps you already use in a couple of clicks." }, { icon: "chart", title: "Live dashboards", desc: "See exactly what's running and what needs attention." }, { icon: "shield", title: "Enterprise-ready", desc: "SSO, audit logs and role-based access out of the box." }] }),
    pricing(T.modern), ctaBand(T.modern, { title: "Try Flowly free for 14 days", sub: "No card required. Cancel anytime." }), footer(T.modern, "Flowly"),
  ]),

  // ---------------- Niche layouts ----------------
  layout("industry-podcast", "Industry", "Podcast", "Weekly-podcast landing with episodes + platforms.", T.bold, [
    nav(T.bold, "SIGNAL / NOISE", ["Episodes", "About", "Subscribe", "Contact"]),
    heroSplit(T.bold, { eyebrow: "Weekly podcast", title: "Big ideas, plainly spoken", sub: "Conversations with builders, thinkers and troublemakers. New episode every Thursday.", img: IMG.podcast1, primary: "Listen now" }),
    listenOn(T.bold),
    simpleList(T.bold, "Latest episodes", [["EP 48", "The art of shipping less", "52 min"], ["EP 47", "Designing for trust", "44 min"], ["EP 46", "How teams stay small", "39 min"], ["EP 45", "Taste, and how to build it", "61 min"]]),
    ctaBand(T.bold, { title: "Never miss an episode", sub: "Subscribe wherever you listen.", label: "Subscribe" }), footer(T.bold, "SIGNAL / NOISE"),
  ]),
  layout("industry-church", "Industry", "Church / Faith", "Warm, welcoming church homepage.", T.elegant, [
    nav(T.elegant, "Grace Chapel", ["Visit", "Sermons", "Events", "Give"]),
    heroImage(T.elegant, { title: "Come as you are", sub: "A welcoming community in the heart of the city. Join us this Sunday.", img: IMG.church2, primary: "Plan your visit" }),
    simpleList(T.elegant, "Service times", [["Sunday", "Morning worship", "9:00 & 11:00 AM"], ["Wednesday", "Bible study", "7:00 PM"], ["Friday", "Youth group", "6:30 PM"]]),
    about(T.elegant, { title: "Our mission", body: ["We exist to love God, love people, and serve our city with open hands.", "Whoever you are and wherever you've been, there's a seat for you here."], img: IMG.church1 }),
    ctaBand(T.elegant, { title: "Give generously", sub: "Support our community and outreach.", label: "Give online" }), footer(T.elegant, "Grace Chapel"),
  ]),
  layout("industry-wedding", "Industry", "Wedding", "Elegant wedding invite with schedule + RSVP.", T.editorial, [
    nav(T.editorial, "Ava & Liam", ["Story", "Schedule", "RSVP", "Travel"]),
    heroImage(T.editorial, { title: "Ava & Liam", sub: "are getting married — September 12, 2026 · Sonoma, California", img: IMG.wedding1, primary: "RSVP" }),
    about(T.editorial, { title: "Our story", body: ["We met in a tiny bookshop, argued about a novel, and never really stopped talking.", "Seven years later, we'd love for you to celebrate with us."], img: IMG.wedding2 }),
    simpleList(T.editorial, "The day", [["3:00 PM", "Ceremony", "The Garden"], ["5:00 PM", "Cocktails", "Vineyard Terrace"], ["7:00 PM", "Dinner & dancing", "The Barn"]]),
    gallery(T.editorial, [IMG.wedding1, IMG.wedding2, IMG.land5, IMG.land7, IMG.hotel3, IMG.land3]),
    contact(T.editorial), footer(T.editorial, "Ava & Liam"),
  ]),
  layout("saas-changelog", "Industry", "SaaS Changelog", "Product changelog / release-notes page.", T.modern, [
    nav(T.modern, "Flowly"), changelog(T.modern),
    ctaBand(T.modern, { title: "Want these updates by email?", sub: "One short digest a month.", label: "Subscribe" }), footer(T.modern, "Flowly"),
  ]),
  layout("industry-realestate", "Industry", "Real Estate Listing", "Single-property listing with gallery + specs.", T.modern, [
    nav(T.modern, "Harbor Realty", ["Buy", "Sell", "Agents", "Contact"]),
    heroImage(T.modern, { title: "Modern hillside villa", sub: "4 bed · 3 bath · 3,200 sqft · $1,850,000 · Sausalito, CA", img: IMG.house1, primary: "Book a viewing" }),
    gallery(T.modern, [IMG.house1, IMG.house2, IMG.hotel1, IMG.hotel2, IMG.land5, IMG.land7]),
    specs(T.modern, [["Bedrooms", "4"], ["Bathrooms", "3"], ["Area", "3,200 ft²"], ["Year built", "2022"], ["Garage", "2 cars"], ["Lot", "0.4 acre"]]),
    contact(T.modern), footer(T.modern, "Harbor Realty"),
  ]),
  layout("industry-clinic", "Industry", "Medical / Clinic", "Calm, trustworthy clinic homepage.", TClinic, [
    nav(TClinic, "Northside Clinic", ["Services", "Doctors", "Appointments", "Contact"]),
    heroSplit(TClinic, { eyebrow: "Trusted care", title: "Health care that puts you first", sub: "Same-day appointments, friendly doctors and modern facilities — close to home.", img: IMG.clinic2, primary: "Book appointment" }),
    features(TClinic, { title: "Our services", sub: "Comprehensive care for the whole family.", items: [{ icon: "heart", title: "Family medicine", desc: "Checkups, screenings and everyday care for all ages." }, { icon: "shield", title: "Diagnostics", desc: "On-site labs and imaging with fast, clear results." }, { icon: "spark", title: "Specialist care", desc: "A trusted network of specialists, coordinated for you." }] }),
    team(TClinic),
    ctaBand(TClinic, { title: "Book an appointment", sub: "Same-day and weekend slots available.", label: "Book now" }), footer(TClinic, "Northside Clinic"),
  ]),
  layout("industry-nonprofit", "Industry", "Nonprofit / Charity", "Mission-driven charity homepage with donate CTA.", TCharity, [
    nav(TCharity, "Open Hands", ["Mission", "Programs", "Donate", "Volunteer"]),
    heroImage(TCharity, { title: "Small acts, big change", sub: "We deliver food, shelter and hope to families who need it most.", img: IMG.charity2, primary: "Donate now" }),
    stats(TCharity, [{ k: "1.2M", v: "Meals served" }, { k: "48", v: "Communities" }, { k: "9k", v: "Volunteers" }, { k: "100%", v: "Goes to programs" }]),
    features(TCharity, { title: "Our programs", sub: "Where your support goes.", items: [{ icon: "heart", title: "Food relief", desc: "Weekly grocery boxes for families facing hardship." }, { icon: "shield", title: "Safe shelter", desc: "Emergency housing and a path back to stability." }, { icon: "spark", title: "Education", desc: "After-school programs and scholarships for kids." }] }),
    ctaBand(TCharity, { title: "Your gift changes lives", sub: "Every dollar goes straight to the people we serve.", label: "Donate" }), footer(TCharity, "Open Hands"),
  ]),
  layout("industry-conference", "Industry", "Event / Conference", "Conference landing with speakers, schedule + tickets.", T.bold, [
    nav(T.bold, "STACK 2026", ["Speakers", "Schedule", "Tickets", "Venue"]),
    heroImage(T.bold, { title: "STACK 2026", sub: "The conference for builders · Oct 14–16 · Austin, TX", img: IMG.conf1, primary: "Get tickets" }),
    team(T.bold),
    simpleList(T.bold, "Day one", [["9:00", "Keynote — The next decade of the web", "Main stage"], ["11:00", "Workshop — Design systems at scale", "Room A"], ["14:00", "Panel — Building in public", "Main stage"], ["16:30", "Fireside chat + Q&A", "Main stage"]]),
    pricing(T.bold), footer(T.bold, "STACK 2026"),
  ]),

  // ---------------- Landing ----------------
  // Funnel page: no site nav (a landing page is a fork of standard pages —
  // it doesn't inherit the site's main navigation), funnel-tracking
  // checkpoints baked in via data attributes, and a live Zenero content
  // block so the page shows real, dashboard-managed content instead of a
  // static placeholder.
  layout("landing-page", "Landing", "Landing Page", "High-conversion funnel page with tracked checkpoints and a live content block.", T.modern, [
    `<section data-funnel-checkpoint="entry" style="min-height:100vh;display:flex;align-items:center;justify-content:center;text-align:center;padding:32px;background:linear-gradient(135deg,#0f172a,#1e293b);font-family:Manrope,system-ui,sans-serif;">
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
    `<section data-funnel-checkpoint="checkpoint_b" style="padding:72px 32px;background:#ffffff;font-family:Manrope,system-ui,sans-serif;">
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
    zeneroBlockHtml("updates-block"),
    `<section data-funnel-checkpoint="conversion" style="padding:72px 32px;background:#f8fafc;font-family:Manrope,system-ui,sans-serif;">
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
  <script>(function(){
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
    fire("entry");
    document.addEventListener("click", function(e) {
      var el = e.target.closest("[data-funnel-checkpoint]");
      if (el) fire(el.getAttribute("data-funnel-checkpoint"));
    });
    document.addEventListener("submit", function(e) {
      if (e.target.hasAttribute("data-funnel-form")) fire("conversion");
    });
  })();</script>
</section>`,
  ]),

  // ---------------- Gallery ----------------
  // Items are managed live from the Zenero dashboard (ZeneroDashboardPanel's
  // Gallery tab) via the same dashboard-managed widget used elsewhere — no
  // rebuild/republish needed when the owner adds or removes photos.
  layout("gallery-live", "Gallery", "Gallery · Live", "Photo/work gallery whose items are managed from the Zenero dashboard.", T.modern, [
    nav(T.modern, BRAND),
    heroCenter(T.modern, { eyebrow: "Gallery", title: "Our work, always up to date", sub: "Add or remove photos from the dashboard — this page updates itself." }),
    zeneroBlockHtml("gallery-block"),
    footer(T.modern, BRAND),
  ]),
];

export const CATEGORY_ORDER = ["Home", "About", "Services", "Blog", "Portfolio", "Gallery", "Contact", "FAQ", "Pricing", "Team", "Testimonials", "Landing", "Coming soon", "404", "Shop", "Industry"];

export const CATEGORY_META = {
  Home: { color: "#4f46e5" }, About: { color: "#0ea5e9" }, Services: { color: "#0891b2" },
  Blog: { color: "#b45309" }, Portfolio: { color: "#7c3aed" }, Gallery: { color: "#ea580c" },
  Contact: { color: "#059669" },
  FAQ: { color: "#d97706" }, Pricing: { color: "#e11d48" }, Team: { color: "#2563eb" },
  Testimonials: { color: "#db2777" }, Landing: { color: "#0d9488" }, "Coming soon": { color: "#f43f5e" }, "404": { color: "#64748b" },
  Shop: { color: "#16a34a" }, Industry: { color: "#a855f7" },
};
