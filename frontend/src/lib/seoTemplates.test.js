import { SEO_TEMPLATES } from "./seoTemplates";

test("every template has a unique id and the fields SeoPanel applies", () => {
  const ids = SEO_TEMPLATES.map((t) => t.id);
  expect(new Set(ids).size).toBe(ids.length);
  SEO_TEMPLATES.forEach((t) => {
    expect(t.label).toBeTruthy();
    expect(t.title).toContain("[");
    expect(t.description).toContain("[");
    expect(t.ogType).toBeTruthy();
    expect(t.schemaType).toBeTruthy();
  });
});
