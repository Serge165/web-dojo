import { render, screen } from "@testing-library/react";
import {
  BlockEditMenu,
  detectBlockKind,
  splitSiblings,
  parseGalleryImages,
  setGalleryImages,
  setGalleryStyle,
  parseNavItems,
  setNavItems,
  readNavBrand,
  setNavBrand,
  parseNavbarTree,
  setNavbarItems,
  setNavbarVariant,
  NAVBAR_VARIANTS,
  pageHref,
  parseTimelineEntries,
  setTimelineEntries,
  parseBentoItems,
  setBentoItems,
  parseImageBlock,
  setImageBlockSrc,
  parseVideoBlock,
  setVideoBlockSrc,
  setVideoBlockPoster,
  parseEditableNodes,
  setEditableNode,
  detectBlockShape,
  detectRegions,
  setBlockBgImage,
} from "./BlockEditMenu";
import { themes, applyTheme, getSavedThemeName } from "@/themes";

const galleryHtml = `<section style="padding:64px 32px;">
  <div style="max-width:1120px;margin:0 auto;">
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
      <img src="https://x/1.jpg" style="width:100%;" alt="one" />
      <img src="https://x/2.jpg" style="width:100%;" alt="two" />
      <img src="https://x/3.jpg" style="width:100%;" alt="" />
    </div>
  </div>
</section>`;

const navHtml = `<nav style="display:flex;align-items:center;justify-content:space-between;padding:18px 32px;">
  <div style="font-weight:700;font-size:18px;">Brand</div>
  <div style="display:flex;gap:24px;font-size:14px;">
    <a href="#home" style="color:inherit;text-decoration:none;">Home</a>
    <a href="#about" style="color:inherit;text-decoration:none;">About</a>
  </div>
</nav>`;

const timelineHtml = `<section>
  <ol style="list-style:none;padding:0;border-left:2px solid #eee;">
    <li style="position:relative;padding:0 0 32px 24px;">
      <span style="position:absolute;left:-9px;"></span>
      <div style="font-size:12px;">2021</div>
      <div style="font-size:18px;">Founded</div>
      <p style="margin:0;">Started small.</p>
    </li>
    <li style="position:relative;padding:0 0 32px 24px;">
      <span style="position:absolute;left:-9px;"></span>
      <div style="font-size:12px;">2022</div>
      <div style="font-size:18px;">Launch</div>
      <p style="margin:0;">Shipped v1.</p>
    </li>
  </ol>
</section>`;

const heroImgHtml = `<section style="padding:80px 32px;">
  <h1>A canvas for the web.</h1>
  <button>Start building</button>
  <img src="https://x/hero.jpg" alt="hero" style="width:100%;" />
</section>`;

const heroBgHtml = `<section style="min-height:80vh;background-image:linear-gradient(rgba(0,0,0,0.4),rgba(0,0,0,0.4)),url(https://x/bg.jpg);background-size:cover;">
  <h1>Welcome</h1>
  <button>Get started</button>
</section>`;

const videoHeroHtml = `<section style="position:relative;">
  <video autoplay muted loop playsinline poster="https://x/poster.jpg" style="position:absolute;inset:0;"><source src="https://x/clip.mp4" type="video/mp4" /></video>
  <div style="position:relative;z-index:2;"><h1>Motion tells your story</h1></div>
</section>`;

describe("detectBlockKind", () => {
  test("detects each supported kind", () => {
    expect(detectBlockKind(galleryHtml)).toBe("gallery");
    expect(detectBlockKind(navHtml)).toBe("navbar");
    expect(detectBlockKind(timelineHtml)).toBe("timeline");
  });

  test("detects a hero block with a single <img> as image", () => {
    expect(detectBlockKind(heroImgHtml)).toBe("image");
  });

  test("detects a hero block with a CSS background-image as image", () => {
    expect(detectBlockKind(heroBgHtml)).toBe("image");
  });

  test("detects a hero block with a <video> as video", () => {
    expect(detectBlockKind(videoHeroHtml)).toBe("video");
  });

  test("returns null for unknown or empty html", () => {
    expect(detectBlockKind("")).toBeNull();
    expect(detectBlockKind("<p>hello</p>")).toBeNull();
  });
});

describe("splitSiblings", () => {
  test("splits only depth-zero siblings", () => {
    const chunks = splitSiblings('<div><div>inner</div></div><div>two</div>', "div");
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toContain("inner");
  });
});

describe("gallery helpers", () => {
  test("parses image src + alt", () => {
    const imgs = parseGalleryImages(galleryHtml);
    expect(imgs).toHaveLength(3);
    expect(imgs[0]).toEqual({ src: "https://x/1.jpg", alt: "one" });
  });

  test("edits captions, removes and appends images", () => {
    const imgs = parseGalleryImages(galleryHtml);
    const edited = setGalleryImages(galleryHtml, [
      { ...imgs[0], alt: "caption!" },
      imgs[2],
      { src: "https://x/new.jpg", alt: "new" },
    ]);
    const out = parseGalleryImages(edited);
    expect(out).toHaveLength(3);
    expect(out[0].alt).toBe("caption!");
    expect(out[1].src).toBe("https://x/3.jpg");
    expect(out[2].src).toBe("https://x/new.jpg");
  });

  test("style switch patches the grid container", () => {
    const out = setGalleryStyle(galleryHtml, "masonry");
    expect(out).toContain("column-count:3");
  });
});

describe("image block helpers", () => {
  test("parses a single <img>-based hero", () => {
    expect(parseImageBlock(heroImgHtml)).toEqual({ type: "img", src: "https://x/hero.jpg", alt: "hero" });
  });

  test("parses a CSS background-image hero", () => {
    expect(parseImageBlock(heroBgHtml)).toEqual({ type: "bg", src: "https://x/bg.jpg", alt: "" });
  });

  test("returns null when no image is present", () => {
    expect(parseImageBlock("<section><h1>No photo here</h1></section>")).toBeNull();
  });

  test("replaces the <img> src, leaving the rest of the block intact", () => {
    const out = setImageBlockSrc(heroImgHtml, "https://x/new-hero.jpg");
    expect(parseImageBlock(out).src).toBe("https://x/new-hero.jpg");
    expect(out).toContain("Start building");
  });

  test("replaces the background-image url(), leaving the gradient overlay intact", () => {
    const out = setImageBlockSrc(heroBgHtml, "https://x/new-bg.jpg");
    expect(parseImageBlock(out).src).toBe("https://x/new-bg.jpg");
    expect(out).toContain("linear-gradient(rgba(0,0,0,0.4),rgba(0,0,0,0.4))");
  });
});

describe("video block helpers", () => {
  test("parses the <source> src and the poster", () => {
    expect(parseVideoBlock(videoHeroHtml)).toEqual({ src: "https://x/clip.mp4", poster: "https://x/poster.jpg" });
  });

  test("returns null when no video is present", () => {
    expect(parseVideoBlock("<section><h1>No clip here</h1></section>")).toBeNull();
  });

  test("replaces the <source> src and infers type from the extension, leaving the rest intact", () => {
    const out = setVideoBlockSrc(videoHeroHtml, "https://x/new-clip.webm");
    expect(parseVideoBlock(out).src).toBe("https://x/new-clip.webm");
    expect(out).toContain('type="video/webm"');
    expect(out).toContain("Motion tells your story");
  });

  test("an explicit mime type wins over the guessed one", () => {
    const out = setVideoBlockSrc(videoHeroHtml, "https://cdn.example/blob-id", "video/mp4");
    expect(out).toContain('type="video/mp4"');
  });

  test("replaces the poster, leaving the video src intact", () => {
    const out = setVideoBlockPoster(videoHeroHtml, "https://x/new-poster.jpg");
    expect(parseVideoBlock(out)).toEqual({ src: "https://x/clip.mp4", poster: "https://x/new-poster.jpg" });
  });

  test("adds a poster attribute when the block has none yet", () => {
    const noPoster = videoHeroHtml.replace(' poster="https://x/poster.jpg"', "");
    const out = setVideoBlockPoster(noPoster, "https://x/captured.jpg");
    expect(parseVideoBlock(out).poster).toBe("https://x/captured.jpg");
  });
});

describe("navbar helpers", () => {
  test("parses brand + items", () => {
    expect(readNavBrand(navHtml)).toBe("Brand");
    expect(parseNavItems(navHtml)).toEqual([
      { label: "Home", href: "#home" },
      { label: "About", href: "#about" },
    ]);
  });

  test("edits labels/hrefs, adds, removes", () => {
    const items = parseNavItems(navHtml);
    let next = [...items, { label: "Pricing", href: "/pricing" }];
    next[0] = { ...next[0], label: "Start" };
    next = next.filter((_, i) => i !== 1);
    const out = parseNavItems(setNavItems(navHtml, next));
    expect(out).toEqual([
      { label: "Start", href: "#home" },
      { label: "Pricing", href: "/pricing" },
    ]);
  });

  test("brand edit round-trips", () => {
    expect(readNavBrand(setNavBrand(navHtml, "New Co"))).toBe("New Co");
  });
});

describe("navbar tree + dropdowns (Phase 2A/2B)", () => {
  test("exposes all 10 variants", () => {
    expect(NAVBAR_VARIANTS).toHaveLength(10);
  });

  test("variant switcher stamps attribute, class and restyles the nav", () => {
    const out = setNavbarVariant(navHtml, "vertical-left");
    const navTag = out.match(/<nav\b[^>]*>/i)[0];
    expect(navTag).toContain('data-navbar-variant="vertical-left"');
    expect(navTag).toContain("navbar-1 vertical-left");
    expect(out).toMatch(/position:\s*fixed/);
    // round-trip: parser reads the variant back
    expect(parseNavbarTree(out).variant).toBe("vertical-left");
  });

  test("switching twice does not duplicate classes", () => {
    const once = setNavbarVariant(navHtml, "pill");
    const twice = setNavbarVariant(once, "underline");
    expect(twice.match(/class="[^"]*"/g).length).toBe(1);
    expect(twice).toContain("navbar-1 underline");
  });

  test("dropdown round-trips through serialization with nested children", () => {
    const items = [
      { label: "Services", href: "/services", children: [
        { label: "Web Design", href: "/services/web", children: [] },
        { label: "Branding", href: "/services/branding", children: [
          { label: "Logo", href: "/services/branding/logo", children: [] },
        ] },
      ] },
      { label: "Contact", href: "#contact", children: [] },
    ];
    const out = setNavbarItems(navHtml, items);
    expect(out).toContain('class="wd-dd"');
    expect(out).toContain("wd-dd-menu");
    const parsed = parseNavbarTree(out).items;
    expect(parsed).toHaveLength(2);
    expect(parsed[0].children).toHaveLength(2);
    expect(parsed[0].children[1].children[0].label).toBe("Logo");
    // plain items still parse flat
    expect(parsed[1]).toEqual({ label: "Contact", href: "#contact", children: [] });
  });

  test("pageHref builds export filenames from slugs", () => {
    expect(pageHref({ slug: "about" })).toBe("about.html");
    expect(pageHref({ slug: "index.html" })).toBe("index.html");
    expect(pageHref({})).toBe("index.html");
  });
});

describe("editor themes (Phase 3)", () => {
  test("ships 16 themes with required shape", () => {
    const keys = Object.keys(themes);
    expect(keys.length).toBeGreaterThanOrEqual(16);
    keys.forEach((k) => {
      const th = themes[k];
      expect(th.name).toBeTruthy();
      expect(th.colors.primary).toMatch(/^#/);
      expect(typeof th.effects.glow).toBe("boolean");
    });
  });

  test("applyTheme sets --wd-* variables on <html>", () => {
    applyTheme("matrixGreen");
    const style = document.documentElement.style;
    expect(style.getPropertyValue("--wd-primary")).toBe("#00ff41");
    expect(document.documentElement.classList.contains("theme-glow")).toBe(true);
    expect(document.documentElement.getAttribute("data-wd-theme")).toBe("matrixGreen");
    applyTheme("defaultTheme");
    expect(document.documentElement.classList.contains("theme-glow")).toBe(false);
  });

  test("unknown theme key falls back to default", () => {
    expect(applyTheme("does-not-exist").name).toBe("Default");
    expect(getSavedThemeName()).toBeTruthy();
  });
});

describe("timeline helpers", () => {
  test("parses entries", () => {
    expect(parseTimelineEntries(timelineHtml)).toMatchObject([
      { date: "2021", title: "Founded", description: "Started small." },
      { date: "2022", title: "Launch", description: "Shipped v1." },
    ]);
  });

  test("editing one entry preserves the untouched sibling's markup", () => {
    const entries = parseTimelineEntries(timelineHtml);
    const edited = entries.map((e, i) => i === 1 ? { ...e, title: "Big launch" } : e);
    const out = setTimelineEntries(timelineHtml, edited);
    // Untouched entry keeps its original li verbatim.
    expect(out).toContain('<div style="font-size:12px;">2021</div>');
    expect(out).toContain("Big launch");
    expect(parseTimelineEntries(out)[1].title).toBe("Big launch");
  });
});

describe("bento helpers", () => {
  const bentoHtml = `<section style="padding:72px;">
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;">
      <div style="background:#161622;"><h3>Title A</h3><p>Desc A</p></div>
      <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);"><h3>Title B</h3></div>
    </div>
  </section>`;

  test("parses tiles with h3/p content and bg", () => {
    const items = parseBentoItems(bentoHtml);
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({ title: "Title A", description: "Desc A", bg: "#161622" });
  });

  test("add/remove/reorder round-trips", () => {
    const items = parseBentoItems(bentoHtml);
    const next = [items[1], items[0], { title: "New", description: "", bg: "#222222" }];
    const out = parseBentoItems(setBentoItems(bentoHtml, next));
    expect(out).toHaveLength(3);
    expect(out[0].title).toBe("Title B");
    expect(out[2].title).toBe("New");
  });
});

describe("detectBlockKind (hero / cta / card)", () => {
  const heroTextHtml = `<section style="padding:80px 32px;">
  <h1>Build the web.</h1>
  <p>Drag blocks onto the canvas.</p>
  <button>Start</button>
</section>`;
  const ctaHtml = `<section style="padding:40px;">
  <h2>Ready to ship?</h2>
  <a href="#go" style="color:inherit;">Get started</a>
</section>`;
  const cardsHtml = `<section>
  <h3>Fast</h3><p>Quick edits.</p>
  <h3>Easy</h3><p>No code needed.</p>
</section>`;

  test("detects a text-only hero as hero", () => {
    expect(detectBlockKind(heroTextHtml)).toBe("hero");
  });
  test("detects a CTA band as cta", () => {
    expect(detectBlockKind(ctaHtml)).toBe("cta");
  });
  test("detects a multi-card features section as card", () => {
    expect(detectBlockKind(cardsHtml)).toBe("card");
  });
  test("still returns null for a bare paragraph and empty string", () => {
    expect(detectBlockKind("<p>hello</p>")).toBeNull();
    expect(detectBlockKind("")).toBeNull();
  });
  test("a grid of 2+ h3 still detects as bento, not card", () => {
    const bento = `<section><div style="display:grid;grid-template-columns:repeat(2,1fr);"><div><h3>A</h3></div><div><h3>B</h3></div></div></section>`;
    expect(detectBlockKind(bento)).toBe("bento");
  });
});

describe("generic editable-node helpers", () => {
  const hero = `<section><h1>Build the web.</h1><p>Drag blocks.</p><button>Start</button></section>`;
  const cta = `<section><h2>Ready?</h2><a href="#go">Get started</a></section>`;
  const imgBlock = `<section><h2>Hi</h2><img src="https://x/a.jpg" alt="a" /></section>`;

  test("parseEditableNodes collects text, button nodes in document order", () => {
    const nodes = parseEditableNodes(hero);
    expect(nodes).toHaveLength(3);
    expect(nodes[0]).toMatchObject({ kind: "text", tag: "h1", text: "Build the web." });
    expect(nodes[1]).toMatchObject({ kind: "text", tag: "p", text: "Drag blocks." });
    expect(nodes[2]).toMatchObject({ kind: "button", tag: "button", text: "Start" });
  });

  test("parseEditableNodes parses links with href + text", () => {
    const nodes = parseEditableNodes(cta);
    expect(nodes).toHaveLength(2);
    expect(nodes[1]).toMatchObject({ kind: "link", tag: "a", href: "#go", text: "Get started" });
  });

  test("parseEditableNodes parses images with src + alt", () => {
    const nodes = parseEditableNodes(imgBlock);
    expect(nodes).toHaveLength(2);
    expect(nodes[1]).toMatchObject({ kind: "image", tag: "img", src: "https://x/a.jpg", alt: "a" });
  });

  test("setEditableNode rewrites a heading's text by offset", () => {
    const out = setEditableNode(hero, 0, { text: "Build the web now." });
    expect(out).toContain("<h1>Build the web now.</h1>");
    expect(out).toContain("<p>Drag blocks.</p>");
  });

  test("setEditableNode rewrites a link's href, preserving text", () => {
    const out = setEditableNode(cta, 1, { href: "#start" });
    expect(out).toContain('href="#start"');
    expect(out).toContain(">Get started</a>");
  });

  test("setEditableNode rewrites a link's text, preserving href", () => {
    const out = setEditableNode(cta, 1, { text: "Go" });
    expect(out).toContain('href="#go"');
    expect(out).toContain(">Go</a>");
  });

  test("setEditableNode rewrites an image src, preserving alt", () => {
    const out = setEditableNode(imgBlock, 1, { src: "https://x/b.jpg" });
    expect(out).toContain('src="https://x/b.jpg"');
    expect(out).toContain('alt="a"');
  });

  test("setEditableNode is a no-op for an out-of-range id", () => {
    expect(setEditableNode(hero, 99, { text: "x" })).toBe(hero);
  });

  test("parseEditableNodes returns [] for empty input", () => {
    expect(parseEditableNodes("")).toEqual([]);
  });
});

describe("detectBlockShape", () => {
  it("detects nav shape", () => {
    expect(detectBlockShape('<nav class="block nav-simple-1"><a href="#">Home</a></nav>')).toBe("nav");
  });

  it("detects container shape from the content marker", () => {
    const html = '<section class="block"><div class="block"><h2>Gallery</h2><div class="container block gallery-grid 1"><img src="a.jpg"/></div></div></section>';
    expect(detectBlockShape(html)).toBe("container");
  });

  it("defaults to section shape when no markers are present", () => {
    expect(detectBlockShape('<section class="block hero-1"><h1>Hi</h1></section>')).toBe("section");
  });

  it("returns section shape for empty/null input rather than throwing", () => {
    expect(detectBlockShape("")).toBe("section");
    expect(detectBlockShape(null)).toBe("section");
  });
});

describe("detectRegions", () => {
  it("parallax-hero-fullbleed: no img/video, but is a hero-shaped block — media region is bg-empty (editable, just unset)", () => {
    const html = '<section class="block block-parallax-hero-fullbleed-1 block-parallax-hero-fullbleed"><div class="block"><h1 class="block block-heading">Where ambition meets altitude.</h1><p class="block">Sub</p><button class="block">Explore</button></div></section>';
    const regions = detectRegions(html);
    expect(regions.heading).toBe(true);
    expect(regions.media).toBe("bg-empty");
    expect(regions.generic).toBe(true);
  });

  it("video-hero: has both a video region AND a heading/generic region (the confirmed regression)", () => {
    const html = '<section class="block block-video-hero-1"><video class="block" poster="p.jpg"><source src="v.mp4" type="video/mp4"/></video><div class="block"><h1 class="block block-heading">Motion tells your story</h1><p class="block">Sub</p><a class="block" href="#">Watch</a></div></section>';
    const regions = detectRegions(html);
    expect(regions.media).toBe("video");
    expect(regions.heading).toBe(true);
    expect(regions.generic).toBe(true);
  });

  it("gallery block: content region is gallery, no heading claims the image grid", () => {
    const html = '<section class="block"><div class="block"><h2 class="block block-heading">Gallery</h2><div class="container block cmp-gallery-grid"><img src="a.jpg"/><img src="b.jpg"/><img src="c.jpg"/></div></div></section>';
    const regions = detectRegions(html);
    expect(regions.content).toBe("gallery");
    expect(regions.heading).toBe(true);
  });

  it("navbar: no heading region (navs are excluded per spec)", () => {
    const html = '<nav class="block nav-simple-1"><a href="#">Home</a></nav>';
    const regions = detectRegions(html);
    expect(regions.heading).toBe(false);
    expect(regions.content).toBe("navbar");
  });

  it("legacy block with no migration markers still detects gallery via content heuristics", () => {
    const html = '<section class="block"><div class="block"><h2 class="block">Gallery</h2><div class="block" style="display:grid"><img src="a.jpg"/><img src="b.jpg"/><img src="c.jpg"/></div></div></section>';
    const regions = detectRegions(html);
    expect(regions.content).toBe("gallery");
  });

  it("header wrapping a nav (not anchored at html start) still detects navbar", () => {
    const html = '<header class="block hdr-announcement-1"><div class="block">Free shipping today</div><nav class="block"><a href="#">Home</a><a href="#">Shop</a></nav></header>';
    const regions = detectRegions(html);
    expect(regions.content).toBe("navbar");
  });

  it("card grid with 3+ images each in its own card wrapper, no migration marker, is NOT classified as gallery", () => {
    const html = '<section class="block"><h2 class="block block-heading">Our Team</h2><div class="block"><div class="block"><img src="a.jpg"/><p class="block">Alice</p></div><div class="block"><img src="b.jpg"/><p class="block">Bob</p></div><div class="block"><img src="c.jpg"/><p class="block">Carol</p></div></div></section>';
    const regions = detectRegions(html);
    expect(regions.content).not.toBe("gallery");
  });
});

describe("setBlockBgImage", () => {
  it("adds a new --block-bg-image inline style to a block with no existing background", () => {
    const html = '<section class="block block-parallax-hero-fullbleed-1"><h1 class="block">Hi</h1></section>';
    const out = setBlockBgImage(html, "https://x.test/new.jpg");
    expect(out).toMatch(/<section class="block block-parallax-hero-fullbleed-1" style="--block-bg-image:url\(https:\/\/x\.test\/new\.jpg\)">/);
  });

  it("updates an existing --block-bg-image inline style in place", () => {
    const html = '<section class="block" style="--block-bg-image:url(old.jpg)"><h1 class="block">Hi</h1></section>';
    const out = setBlockBgImage(html, "new.jpg");
    expect(out).toContain('style="--block-bg-image:url(new.jpg)"');
    expect(out).not.toContain("old.jpg");
  });

  it("preserves other existing inline styles on the same element", () => {
    const html = '<section class="block" style="min-height:100vh"><h1 class="block">Hi</h1></section>';
    const out = setBlockBgImage(html, "new.jpg");
    expect(out).toContain("min-height:100vh");
    expect(out).toContain("--block-bg-image:url(new.jpg)");
  });

  it("does not accumulate semicolons across repeated edits of the same block", () => {
    const html = '<section class="block" style="min-height:100vh"><h1 class="block">Hi</h1></section>';
    const once = setBlockBgImage(html, "new.jpg");
    const twice = setBlockBgImage(once, "newer.jpg");
    expect(twice).toContain('style="min-height:100vh;--block-bg-image:url(newer.jpg)"');
    expect(twice).not.toMatch(/;;/);
  });
});

describe("BlockEditMenu composable rendering", () => {
  it("parallax-hero-fullbleed: shows a background editor even with zero <img> tags (regression)", () => {
    const html = '<section class="block block-parallax-hero-fullbleed-1"><h1 class="block block-heading">Where ambition meets altitude.</h1><p class="block">Sub</p></section>';
    render(<BlockEditMenu selectedHtml={html} onChange={() => {}} />);
    expect(screen.getByTestId("block-edit-background")).toBeInTheDocument();
  });

  it("video-hero: shows BOTH the video editor and the generic text editor at once (regression)", () => {
    const html = '<section class="block block-video-hero-1"><video class="block" poster="p.jpg"><source src="v.mp4" type="video/mp4"/></video><h1 class="block block-heading">Motion tells your story</h1><a class="block" href="#">Watch</a></section>';
    render(<BlockEditMenu selectedHtml={html} onChange={() => {}} />);
    expect(screen.getByTestId("block-edit-video")).toBeInTheDocument();
    expect(screen.getByTestId("block-edit-generic")).toBeInTheDocument();
  });

  it("gallery block: shows the gallery editor, not the generic editor, for the image grid", () => {
    const html = '<section class="block"><h2 class="block block-heading">Gallery</h2><div class="container block cmp-gallery-grid"><img src="a.jpg"/><img src="b.jpg"/><img src="c.jpg"/></div></section>';
    render(<BlockEditMenu selectedHtml={html} onChange={() => {}} />);
    expect(screen.getByTestId("block-edit-gallery")).toBeInTheDocument();
  });

  it("renders nothing when selectedHtml is empty", () => {
    const { container } = render(<BlockEditMenu selectedHtml="" onChange={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });
});
