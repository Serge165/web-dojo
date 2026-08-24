import React, { useState } from "react";

const inputCls = "w-full bg-[#15130E] border border-[#332D22] rounded px-3 py-2 text-sm text-[#F1EDE2] outline-none focus:border-[#C9A227]";
const labelCls = "text-[10px] uppercase tracking-wider text-[#948C79] block mb-1";
const btnPrimary = "text-xs py-1.5 px-3 rounded bg-[#AD8B21] hover:bg-[#C9A227] text-[#F1EDE2]";

// ---------- Navbar Customization ----------
export const NavbarCustomizationPanel = ({ html, onApply }) => {
  const [navItems, setNavItems] = useState([
    { label: "Home", href: "#" },
    { label: "About", href: "#" },
    { label: "Contact", href: "#" },
  ]);
  const [logo, setLogo] = useState("Brand");
  const [logoUrl, setLogoUrl] = useState("");
  const [align, setAlign] = useState("left");
  const [hamburger, setHamburger] = useState(true);
  const [btnColor, setBtnColor] = useState("#0f172a");
  const [btnSize, setBtnSize] = useState("md");
  const [btnRadius, setBtnRadius] = useState("8px");

  const addNavItem = () => setNavItems([...navItems, { label: "New Page", href: "#" }]);
  const updateNavItem = (i, field, value) => {
    const next = [...navItems];
    next[i][field] = value;
    setNavItems(next);
  };
  const removeNavItem = (i) => setNavItems(navItems.filter((_, idx) => idx !== i));

  const apply = () => {
    const links = navItems.map((n) => `<a href="${n.href}" style="color:inherit;text-decoration:none;">${n.label}</a>`).join("");
    const logoHtml = logoUrl
      ? `<img src="${logoUrl}" alt="${logo}" style="height:32px;" />`
      : `<span style="font-weight:800;font-size:20px;color:var(--fc-text, #0f172a);">${logo}</span>`;
    const justify = align === "center" ? "center" : align === "right" ? "flex-end" : "space-between";
    const btnSizePx = btnSize === "sm" ? "8px 16px" : btnSize === "lg" ? "14px 28px" : "10px 20px";
    const navHtml = `<nav style="font-family:Manrope,system-ui,sans-serif;background:var(--fc-bg, #fff);border-bottom:1px solid var(--fc-border, #ececec);padding:16px 32px;display:flex;align-items:center;justify-content:${justify};gap:20px;">
  ${logoHtml}
  <div style="display:flex;gap:22px;font-size:14px;color:var(--fc-muted, #334155);">${links}</div>
  <button style="background:${btnColor};color:#fff;border:0;padding:${btnSizePx};border-radius:${btnRadius};font-size:13px;cursor:pointer;">Get started</button>
</nav>`;
    onApply(navHtml);
  };

  return (
    <div className="space-y-3" data-testid="navbar-customization">
      <div>
        <label className={labelCls}>Logo Text</label>
        <input value={logo} onChange={(e) => setLogo(e.target.value)} className={inputCls} data-testid="navbar-logo" />
      </div>
      <div>
        <label className={labelCls}>Logo Image URL (optional)</label>
        <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} className={inputCls} data-testid="navbar-logo-url" />
      </div>
      <div>
        <label className={labelCls}>Menu Alignment</label>
        <select value={align} onChange={(e) => setAlign(e.target.value)} className={inputCls} data-testid="navbar-align">
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </div>
      <div>
        <label className={labelCls}>Nav Items</label>
        <div className="space-y-2">
          {navItems.map((item, i) => (
            <div key={i} className="flex gap-2">
              <input value={item.label} onChange={(e) => updateNavItem(i, "label", e.target.value)} className={inputCls} placeholder="Label" data-testid={`navbar-item-label-${i}`} />
              <input value={item.href} onChange={(e) => updateNavItem(i, "href", e.target.value)} className={inputCls} placeholder="/page" data-testid={`navbar-item-href-${i}`} />
              <button onClick={() => removeNavItem(i)} className="text-xs px-2 bg-[#3A1D1D] text-[#F1EDE2] rounded">×</button>
            </div>
          ))}
          <button onClick={addNavItem} className="text-xs text-[#C9A227]">+ Add item</button>
        </div>
      </div>
      <div>
        <label className={labelCls}>Button Color</label>
        <input type="color" value={btnColor} onChange={(e) => setBtnColor(e.target.value)} className="w-full h-8" data-testid="navbar-btn-color" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>Button Size</label>
          <select value={btnSize} onChange={(e) => setBtnSize(e.target.value)} className={inputCls} data-testid="navbar-btn-size">
            <option value="sm">Small</option>
            <option value="md">Medium</option>
            <option value="lg">Large</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Button Radius</label>
          <input value={btnRadius} onChange={(e) => setBtnRadius(e.target.value)} className={inputCls} data-testid="navbar-btn-radius" />
        </div>
      </div>
      <button onClick={apply} className={btnPrimary} data-testid="navbar-apply">Apply Changes</button>
    </div>
  );
};

// ---------- Hero Customization ----------
export const HeroCustomizationPanel = ({ html, onApply }) => {
  const [headline, setHeadline] = useState("Your headline goes here");
  const [subheadline, setSubheadline] = useState("A compelling subheadline that drives action.");
  const [ctaText, setCtaText] = useState("Get Started");
  const [ctaLink, setCtaLink] = useState("#");
  const [bgType, setBgType] = useState("gradient");
  const [bgColor, setBgColor] = useState("#0f172a");
  const [bgImage, setBgImage] = useState("");
  const [overlay, setOverlay] = useState(0.5);
  const [textAlign, setTextAlign] = useState("center");
  const [contentPos, setContentPos] = useState("center");

  const apply = () => {
    const bg = bgType === "image" && bgImage
      ? `background-image:linear-gradient(rgba(0,0,0,${overlay}),rgba(0,0,0,${overlay})),url(${bgImage});background-size:cover;background-position:center;`
      : `background:${bgColor};`;
    const align = textAlign === "center" ? "center" : textAlign === "left" ? "left" : "right";
    const justify = contentPos === "center" ? "center" : contentPos === "left" ? "flex-start" : "flex-end";
    const heroHtml = `<section style="min-height:80vh;display:flex;align-items:center;justify-content:${justify};text-align:${align};padding:32px;${bg}font-family:Manrope,system-ui,sans-serif;">
  <div style="max-width:720px;">
    <h1 style="font-size:56px;line-height:1.05;letter-spacing:-0.03em;margin:0 0 20px;color:#fff;">${headline}</h1>
    <p style="font-size:18px;color:rgba(255,255,255,.85);margin:0 0 32px;">${subheadline}</p>
    <a href="${ctaLink}" style="display:inline-block;background:#C9A227;color:#0f172a;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:15px;font-weight:600;">${ctaText}</a>
  </div>
</section>`;
    onApply(heroHtml);
  };

  return (
    <div className="space-y-3" data-testid="hero-customization">
      <div>
        <label className={labelCls}>Headline</label>
        <input value={headline} onChange={(e) => setHeadline(e.target.value)} className={inputCls} data-testid="hero-headline" />
      </div>
      <div>
        <label className={labelCls}>Subheadline</label>
        <textarea value={subheadline} onChange={(e) => setSubheadline(e.target.value)} rows={2} className={inputCls} data-testid="hero-subheadline" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>CTA Text</label>
          <input value={ctaText} onChange={(e) => setCtaText(e.target.value)} className={inputCls} data-testid="hero-cta-text" />
        </div>
        <div>
          <label className={labelCls}>CTA Link</label>
          <input value={ctaLink} onChange={(e) => setCtaLink(e.target.value)} className={inputCls} data-testid="hero-cta-link" />
        </div>
      </div>
      <div>
        <label className={labelCls}>Background Type</label>
        <select value={bgType} onChange={(e) => setBgType(e.target.value)} className={inputCls} data-testid="hero-bg-type">
          <option value="gradient">Solid Color</option>
          <option value="image">Image</option>
        </select>
      </div>
      {bgType === "gradient" ? (
        <div>
          <label className={labelCls}>Background Color</label>
          <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-full h-8" data-testid="hero-bg-color" />
        </div>
      ) : (
        <>
          <div>
            <label className={labelCls}>Background Image URL</label>
            <input value={bgImage} onChange={(e) => setBgImage(e.target.value)} className={inputCls} data-testid="hero-bg-image" />
          </div>
          <div>
            <label className={labelCls}>Overlay Opacity ({overlay})</label>
            <input type="range" min={0} max={1} step={0.05} value={overlay} onChange={(e) => setOverlay(Number(e.target.value))} className="w-full" data-testid="hero-overlay" />
          </div>
        </>
      )}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>Text Alignment</label>
          <select value={textAlign} onChange={(e) => setTextAlign(e.target.value)} className={inputCls} data-testid="hero-text-align">
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Content Position</label>
          <select value={contentPos} onChange={(e) => setContentPos(e.target.value)} className={inputCls} data-testid="hero-content-pos">
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
      </div>
      <button onClick={apply} className={btnPrimary} data-testid="hero-apply">Apply Changes</button>
    </div>
  );
};

// ---------- Video Hero Customization ----------
export const VideoHeroCustomizationPanel = ({ html, onApply }) => {
  const [videoUrl, setVideoUrl] = useState("https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4");
  const [autoplay, setAutoplay] = useState(true);
  const [muted, setMuted] = useState(true);
  const [fallbackImage, setFallbackImage] = useState("");

  const apply = () => {
    const autoplayAttr = autoplay ? "autoplay" : "";
    const mutedAttr = muted ? "muted" : "";
    const posterAttr = fallbackImage ? `poster="${fallbackImage}"` : "";
    const videoHtml = `<section style="position:relative;min-height:82vh;display:flex;align-items:center;justify-content:center;text-align:center;overflow:hidden;font-family:Manrope,system-ui,sans-serif;">
  <video ${autoplayAttr} ${mutedAttr} loop playsinline ${posterAttr} style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;"><source src="${videoUrl}" type="video/mp4" /></video>
  <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,.7));z-index:1;"></div>
  <div style="position:relative;z-index:2;color:#fff;max-width:720px;padding:32px;">
    <h1 style="font-size:60px;line-height:1.05;letter-spacing:-0.03em;margin:0 0 18px;">Motion tells your story</h1>
    <p style="font-size:19px;opacity:.9;margin:0 0 28px;">A cinematic hero with a looping background video.</p>
    <a href="#" style="display:inline-block;background:#fff;color:#0f172a;text-decoration:none;padding:14px 30px;border-radius:999px;font-weight:700;">Watch the film</a>
  </div>
</section>`;
    onApply(videoHtml);
  };

  return (
    <div className="space-y-3" data-testid="video-hero-customization">
      <div>
        <label className={labelCls}>Video URL</label>
        <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className={inputCls} data-testid="video-url" />
      </div>
      <div>
        <label className={labelCls}>Fallback Image URL</label>
        <input value={fallbackImage} onChange={(e) => setFallbackImage(e.target.value)} className={inputCls} data-testid="video-fallback" />
      </div>
      <div className="flex gap-4">
        <label className="flex items-center gap-2 text-xs text-[#F1EDE2]">
          <input type="checkbox" checked={autoplay} onChange={(e) => setAutoplay(e.target.checked)} data-testid="video-autoplay" />
          Autoplay
        </label>
        <label className="flex items-center gap-2 text-xs text-[#F1EDE2]">
          <input type="checkbox" checked={muted} onChange={(e) => setMuted(e.target.checked)} data-testid="video-muted" />
          Muted
        </label>
      </div>
      <button onClick={apply} className={btnPrimary} data-testid="video-apply">Apply Changes</button>
    </div>
  );
};

// ---------- Bento Customization ----------
export const BentoCustomizationPanel = ({ html, onApply }) => {
  const [cards, setCards] = useState([
    { title: "Design system", desc: "Tokens, components, and docs in one place.", icon: "🎨" },
    { title: "Ship faster", desc: "Deploy in minutes, not days.", icon: "🚀" },
    { title: "Analytics", desc: "Understand your users.", icon: "📊" },
    { title: "Integrations", desc: "Connect your stack.", icon: "🔌" },
  ]);
  const [cols, setCols] = useState(4);

  const updateCard = (i, field, value) => {
    const next = [...cards];
    next[i][field] = value;
    setCards(next);
  };
  const addCard = () => setCards([...cards, { title: "New card", desc: "Description here.", icon: "✨" }]);
  const removeCard = (i) => setCards(cards.filter((_, idx) => idx !== i));
  const moveCard = (i, dir) => {
    const next = [...cards];
    const target = i + dir;
    if (target < 0 || target >= next.length) return;
    [next[i], next[target]] = [next[target], next[i]];
    setCards(next);
  };

  const apply = () => {
    const bentoHtml = `<section style="font-family:Manrope,system-ui,sans-serif;padding:72px 32px;background:var(--fc-bg, #0b0b12);">
  <div style="max-width:1120px;margin:0 auto;display:grid;grid-template-columns:repeat(${cols},1fr);gap:14px;">
    ${cards.map((c, i) => `
    <div style="grid-column:${i === 0 ? "span 2" : "span 1"};grid-row:${i === 0 ? "span 2" : "span 1"};border-radius:18px;padding:24px;background:var(--fc-surface, #161622);border:1px solid var(--fc-border, #232335);display:flex;flex-direction:column;justify-content:flex-end;">
      <div style="font-size:28px;margin-bottom:8px;">${c.icon}</div>
      <div style="color:var(--fc-text, #fff);font-weight:700;font-size:18px;margin-bottom:6px;">${c.title}</div>
      <div style="color:var(--fc-muted, #9ca3af);font-size:13px;">${c.desc}</div>
    </div>`).join("")}
  </div>
</section>`;
    onApply(bentoHtml);
  };

  return (
    <div className="space-y-3" data-testid="bento-customization">
      <div>
        <label className={labelCls}>Grid Columns</label>
        <select value={cols} onChange={(e) => setCols(Number(e.target.value))} className={inputCls} data-testid="bento-cols">
          {[2, 3, 4, 5].map((c) => <option key={c} value={c}>{c} columns</option>)}
        </select>
      </div>
      <div>
        <label className={labelCls}>Cards</label>
        <div className="space-y-2">
          {cards.map((card, i) => (
            <div key={i} className="border border-[#332D22] rounded p-2 space-y-1">
              <div className="flex gap-1">
                <input value={card.icon} onChange={(e) => updateCard(i, "icon", e.target.value)} className="w-10 bg-[#15130E] border border-[#332D22] rounded px-2 py-1 text-sm text-[#F1EDE2]" data-testid={`bento-card-icon-${i}`} />
                <input value={card.title} onChange={(e) => updateCard(i, "title", e.target.value)} className="flex-1 bg-[#15130E] border border-[#332D22] rounded px-2 py-1 text-sm text-[#F1EDE2]" data-testid={`bento-card-title-${i}`} />
                <button onClick={() => moveCard(i, -1)} className="text-xs px-1 text-[#948C79]">↑</button>
                <button onClick={() => moveCard(i, 1)} className="text-xs px-1 text-[#948C79]">↓</button>
                <button onClick={() => removeCard(i)} className="text-xs px-1 text-red-400">×</button>
              </div>
              <input value={card.desc} onChange={(e) => updateCard(i, "desc", e.target.value)} className="w-full bg-[#15130E] border border-[#332D22] rounded px-2 py-1 text-xs text-[#F1EDE2]" data-testid={`bento-card-desc-${i}`} />
            </div>
          ))}
          <button onClick={addCard} className="text-xs text-[#C9A227]">+ Add card</button>
        </div>
      </div>
      <button onClick={apply} className={btnPrimary} data-testid="bento-apply">Apply Changes</button>
    </div>
  );
};