import {
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

describe("detectBlockKind", () => {
  test("detects each supported kind", () => {
    expect(detectBlockKind(galleryHtml)).toBe("gallery");
    expect(detectBlockKind(navHtml)).toBe("navbar");
    expect(detectBlockKind(timelineHtml)).toBe("timeline");
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
