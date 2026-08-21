import { parseOutlineMarkdown, importOutlineJson } from "./outline";

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
