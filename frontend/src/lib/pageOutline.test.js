import { nodesToOutline, buildOutlineFromPage } from "./pageOutline";

// ===== Pure grouping (nodesToOutline) =====

test("nodesToOutline nests paragraphs and bullets under the preceding heading", () => {
  const outline = nodesToOutline([
    { tag: "section", text: "", listItems: [] },
    { tag: "h2", text: "Features", listItems: [] },
    { tag: "p", text: "Everything in one place.", listItems: [] },
    { tag: "ul", text: "", listItems: ["Fast", "Composable", "Secure"] },
    { tag: "h3", text: "Pricing", listItems: [] },
    { tag: "p", text: "Free for 14 days.", listItems: [] },
  ]);
  expect(outline).toHaveLength(2);
  expect(outline[0]).toMatchObject({ type: "heading", level: 2, text: "Features" });
  expect(outline[0].children).toEqual([
    { type: "paragraph", text: "Everything in one place." },
    { type: "bullet", text: "Fast" },
    { type: "bullet", text: "Composable" },
    { type: "bullet", text: "Secure" },
  ]);
  expect(outline[1]).toMatchObject({ type: "heading", level: 3, text: "Pricing" });
  expect(outline[1].children).toEqual([{ type: "paragraph", text: "Free for 14 days." }]);
});

test("nodesToOutline keeps content before the first heading at the root (nothing silently dropped)", () => {
  const outline = nodesToOutline([
    { tag: "p", text: "Lede before any heading.", listItems: [] },
    { tag: "ul", text: "", listItems: ["Root bullet"] },
    { tag: "h1", text: "Title", listItems: [] },
  ]);
  expect(outline[0]).toEqual({ type: "paragraph", text: "Lede before any heading." });
  expect(outline[1]).toEqual({ type: "bullet", text: "Root bullet" });
  expect(outline[2]).toMatchObject({ type: "heading", level: 1, text: "Title", children: [] });
});

test("nodesToOutline labels non-text blocks (nav/gallery) as element nodes", () => {
  const outline = nodesToOutline([
    { tag: "nav", text: "Home Products", listItems: [] },
    { tag: "h1", text: "Gallery", listItems: [] },
    { tag: "div", text: "", listItems: [] },
  ]);
  expect(outline[0]).toMatchObject({ type: "element", tag: "nav" });
  expect(outline[1].children[0]).toMatchObject({ type: "element", tag: "div" });
});

test("nodesToOutline handles empty/null input", () => {
  expect(nodesToOutline([])).toEqual([]);
  expect(nodesToOutline(null)).toEqual([]);
});

// ===== DOMParser integration (jsdom) =====

test("buildOutlineFromPage parses real element HTML into a nested outline", () => {
  const elements = [
    { id: "e1", html: '<h1 style="font-size:48px;">Northwind</h1><p style="margin:12px;">Calm software for calm teams.</p>' },
    { id: "e2", html: '<section style="padding:64px;"><h2 style="font-size:32px;">Features</h2><ul><li>Fast</li><li>Composable</li></ul></section>' },
  ];
  const outline = buildOutlineFromPage(elements);
  expect(outline).toHaveLength(2);
  expect(outline[0]).toMatchObject({ type: "heading", level: 1, text: "Northwind" });
  expect(outline[0].children).toEqual([{ type: "paragraph", text: "Calm software for calm teams." }]);
    expect(outline[1].children.map((c) => c.type)).toEqual(["bullet", "bullet"]);
});

test("buildOutlineFromPage skips empty containers and returns [] for no content", () => {
  expect(buildOutlineFromPage([{ id: "e1", html: '<div style="height:10px;"></div>' }])).toEqual([]);
  expect(buildOutlineFromPage([])).toEqual([]);
  expect(buildOutlineFromPage(undefined)).toEqual([]);
});
