import { parseOutlineMarkdown, importOutlineJson, outlineFromHtml, buildOutlineFromElements, buildOutlineFromPage, buildOutlineFromPageHtml, buildOutlineSlidesFromPage, outlineToMarkdown, slideBodyOutline } from "./outline";

test("parseOutlineMarkdown splits on H1 headings", () => {
  const slides = parseOutlineMarkdown("# Home\nIntro copy.\n\n# About\nWho we are.");
  expect(slides).toHaveLength(2);
  expect(slides[0].title).toBe("Home");
  expect(slides[0].body).toBe("Intro copy.");
  expect(slides[1].title).toBe("About");
  expect(slides[1].body).toBe("Who we are.");
});

test("parseOutlineMarkdown returns no slides when there's no H1 heading", () => {
  expect(parseOutlineMarkdown("just some text\nno headings here")).toEqual([]);
});

test("parseOutlineMarkdown ignores H2+ as slide boundaries", () => {
  const slides = parseOutlineMarkdown("# Home\n## Subheading\nBody text.");
  expect(slides).toHaveLength(1);
  expect(slides[0].body).toBe("## Subheading\nBody text.");
});

test("importOutlineJson round-trips a valid array", () => {
  const input = JSON.stringify([{ id: "s1", title: "Home", body: "Hi" }]);
  expect(importOutlineJson(input)).toEqual([{ id: "s1", title: "Home", body: "Hi" }]);
});

test("importOutlineJson fills in defaults for missing fields", () => {
  const input = JSON.stringify([{}]);
  const [slide] = importOutlineJson(input);
  expect(slide.title).toBe("Untitled");
  expect(slide.body).toBe("");
  expect(typeof slide.id).toBe("string");
});

test("importOutlineJson throws on a non-array payload", () => {
  expect(() => importOutlineJson(JSON.stringify({ not: "an array" }))).toThrow();
});

// ===== Phase 6 Task 4: derive a hierarchical outline from a page's elements =====

test("buildOutlineFromPage nests paragraphs and bullets under the preceding heading", () => {
  const elements = [
    { id: "e1", html: '<section><h2>Services</h2><p>What we do best.</p><ul><li>Design</li><li>Build</li></ul></section>' },
    { id: "e2", html: '<h3>Pricing</h3><p>Simple plans.</p>' },
  ];
  expect(buildOutlineFromPage(elements)).toEqual([
    {
      type: "heading", level: 2, text: "Services",
      children: [
        { type: "paragraph", text: "What we do best." },
        { type: "bullet", text: "Design" },
        { type: "bullet", text: "Build" },
      ],
    },
    {
      type: "heading", level: 3, text: "Pricing",
      children: [{ type: "paragraph", text: "Simple plans." }],
    },
  ]);
});

test("buildOutlineFromPage strips nested tags and entities from extracted text", () => {
  const outline = buildOutlineFromPage([{ id: "e1", html: '<h2 style="color:red">Our <em>&amp;</em> Story</h2>' }]);
  expect(outline[0].text).toBe("Our & Story");
});

test("buildOutlineFromPage skips paragraphs/bullets that precede any heading", () => {
  const outline = buildOutlineFromPage([{ id: "e1", html: "<p>Orphan intro.</p><h1>Title</h1>" }]);
  expect(outline).toHaveLength(1);
  expect(outline[0].children).toEqual([]);
});

test("buildOutlineFromPage returns an empty outline when there's nothing to outline", () => {
  expect(buildOutlineFromPage([])).toEqual([]);
  expect(buildOutlineFromPage(undefined)).toEqual([]);
  expect(buildOutlineFromPage([{ id: "e1", html: "<div>just a div</div>" }])).toEqual([]);
});

test("outlineToMarkdown renders depth-aware heading hashes and dash bullets", () => {
  const md = outlineToMarkdown([
    { type: "heading", level: 1, text: "Home", children: [{ type: "paragraph", text: "Intro." }, { type: "bullet", text: "Point A" }] },
    { type: "heading", level: 4, text: "Deep", children: [] },
  ]);
  expect(md).toBe("## Home\nIntro.\n- Point A\n#### Deep");
});

test("an outline derived from a page round-trips through parseOutlineMarkdown", () => {
  const elements = [{ id: "e1", html: "<h1>Home</h1><p>Intro copy.</p><ul><li>Fast</li></ul>" }];
  // outlineToMarkdown keeps body headings at H2+ (the slide title owns the
  // single H1), so the round-trip parses a deck title + the outline markdown.
  const md = outlineToMarkdown(buildOutlineFromPage(elements));
  const slides = parseOutlineMarkdown(`# Deck\n${md}`);
  expect(slides).toHaveLength(1);
  expect(slides[0].title).toBe("Deck");
  expect(slides[0].body).toContain("Intro copy.");
  expect(slides[0].body).toContain("- Fast");
  expect(slides[0].outline).toEqual([
    { level: 2, text: "Home", children: [{ type: "bullet", text: "Fast" }] },
  ]);
});
// ===== Phase 6 Task 4: hierarchical outline (PowerPoint-style) =====

test("buildOutlineFromPageHtml nests paragraphs and list items under the preceding heading", () => {
  const html = [
    "<section>",
    "<h2>Services</h2>",
    "<p>We build websites.</p>",
    "<ul><li>Design</li><li>Development</li></ul>",
    "<h3>Process</h3>",
    "<p>Four steps.</p>",
    "</section>",
  ].join("");
  const outline = buildOutlineFromPageHtml(html);
  expect(outline).toHaveLength(2);
  expect(outline[0]).toMatchObject({ level: 2, text: "Services" });
  expect(outline[0].children).toEqual([
    { type: "paragraph", text: "We build websites." },
    { type: "bullet", text: "Design" },
    { type: "bullet", text: "Development" },
  ]);
  expect(outline[1]).toMatchObject({ level: 3, text: "Process" });
  expect(outline[1].children).toEqual([{ type: "paragraph", text: "Four steps." }]);
});

test("buildOutlineFromPageHtml stops nesting at the next heading and records images by alt", () => {
  const html = "<h1>Title</h1><p>Intro.</p><img src=\"a.jpg\" alt=\"Hero shot\"><h2>Next</h2><p>More.</p>";
  const outline = buildOutlineFromPageHtml(html);
  expect(outline).toHaveLength(2);
  expect(outline[0].children).toEqual([
    { type: "paragraph", text: "Intro." },
    { type: "image", text: "Hero shot" },
  ]);
  expect(outline[1].children).toEqual([{ type: "paragraph", text: "More." }]);
});

test("buildOutlineFromPageHtml skips headings inside nav/footer (page chrome)", () => {
  const html = "<nav><h2>Menu</h2></nav><h1>Real content</h1><footer><h4>Links</h4></footer>";
  const outline = buildOutlineFromPageHtml(html);
  expect(outline).toHaveLength(1);
  expect(outline[0].text).toBe("Real content");
});

test("buildOutlineFromPageHtml returns [] without a DOM (node guard) and for empty input", () => {
  expect(buildOutlineFromPageHtml("")).toEqual([]);
  expect(buildOutlineFromPageHtml(undefined)).toEqual([]);
});

test("buildOutlineSlidesFromPage wraps the outline in one slide, or [] when nothing is outline-able", () => {
  const withContent = buildOutlineSlidesFromPage("<h2>Plans</h2><p>Three tiers.</p>", "Pricing");
  expect(withContent).toHaveLength(1);
  expect(withContent[0].title).toBe("Pricing");
  expect(withContent[0].outline[0].text).toBe("Plans");
  expect(typeof withContent[0].id).toBe("string");
  expect(buildOutlineSlidesFromPage("<p>no headings</p>", "X")).toEqual([]);
});

test("parseOutlineMarkdown derives the nested outline from each slide's markdown body", () => {
  const slides = parseOutlineMarkdown("# Home\n## What we do\n- Design\n- Build\nClosing line.");
  expect(slides).toHaveLength(1);
  expect(slides[0].outline).toEqual([
    { level: 2, text: "What we do", children: [{ type: "bullet", text: "Design" }, { type: "bullet", text: "Build" }] },
  ]);
});

// ===== Phase 6: page HTML -> nested outline =====

test("outlineFromHtml nests paragraphs and bullets under the most recent heading", () => {
  const html = "<section><h2>Services</h2><p>What we do.</p><ul><li>Design</li><li>Build</li></ul><h3>Pricing</h3><p>From $99.</p></section>";
  const nodes = outlineFromHtml(html);
  expect(nodes).toHaveLength(2);
  expect(nodes[0]).toMatchObject({ type: "heading", level: 2, text: "Services" });
  expect(nodes[0].children).toEqual([
    { type: "paragraph", text: "What we do." },
    { type: "bullet", text: "Design" },
    { type: "bullet", text: "Build" },
  ]);
  expect(nodes[1]).toMatchObject({ type: "heading", level: 3, text: "Pricing" });
  expect(nodes[1].children).toEqual([{ type: "paragraph", text: "From $99." }]);
});

test("outlineFromHtml keeps pre-heading content at the top level and ignores other tags", () => {
  const nodes = outlineFromHtml("<p>Intro line.</p><div>ignored wrapper</div><h1>Title</h1>");
  expect(nodes[0]).toEqual({ type: "paragraph", text: "Intro line." });
  expect(nodes[1]).toMatchObject({ type: "heading", level: 1, text: "Title" });
});

test("outlineFromHtml strips nested markup and decodes entities", () => {
  const nodes = outlineFromHtml('<h2><span class="x">A &amp; B</span></h2>');
  expect(nodes[0].text).toBe("A & B");
});

test("buildOutlineFromElements concatenates every element's outline in order", () => {
  const nodes = buildOutlineFromElements([
    { id: "a", html: "<h2>First</h2><p>copy</p>" },
    { id: "b", html: "<h2>Second</h2>" },
    { id: "c", html: "" },
  ]);
  expect(nodes.map((n) => n.text)).toEqual(["First", "Second"]);
});

test("outlineToMarkdown round-trips through slideBodyOutline with min level 2", () => {
  const nodes = [{ type: "heading", level: 1, text: "Top", children: [{ type: "bullet", text: "One" }, { type: "paragraph", text: "Two" }] }];
  const md = outlineToMarkdown(nodes);
  expect(md).toBe("## Top\n- One\nTwo");
  expect(slideBodyOutline(md)).toEqual([{ type: "heading", level: 2, text: "Top", children: [{ type: "bullet", text: "One" }, { type: "paragraph", text: "Two" }] }]);
});

test("slideBodyOutline treats plain lines as paragraphs and * as bullets too", () => {
  const nodes = slideBodyOutline("## H\n* star\n\nplain line");
  expect(nodes[0].children).toEqual([
    { type: "bullet", text: "star" },
    { type: "paragraph", text: "plain line" },
  ]);
});
