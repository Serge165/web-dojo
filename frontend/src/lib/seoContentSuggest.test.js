import { suggestSeoFromContent } from "./seoContentSuggest";

test("pulls the first heading as title and first paragraph as description", () => {
  const elements = [
    { html: '<section><h1 style="color:red">  Handmade   Mugs  </h1><p>Small-batch pottery from Portland.</p></section>' },
  ];
  const { title, description } = suggestSeoFromContent(elements);
  expect(title).toBe("Handmade Mugs");
  expect(description).toBe("Small-batch pottery from Portland.");
});

test("falls back to h2 when no h1 is present", () => {
  const elements = [{ html: "<h2>About the studio</h2>" }];
  expect(suggestSeoFromContent(elements).title).toBe("About the studio");
});

test("returns empty strings when there's no heading or paragraph", () => {
  const elements = [{ html: "<div>just a div</div>" }];
  expect(suggestSeoFromContent(elements)).toEqual({ title: "", description: "" });
});

test("truncates an overly long paragraph to 160 chars", () => {
  const elements = [{ html: `<p>${"A".repeat(200)}</p>` }];
  expect(suggestSeoFromContent(elements).description.length).toBe(160);
});
