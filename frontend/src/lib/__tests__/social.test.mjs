import test from "node:test";
import assert from "node:assert/strict";
import { buildSocialHtml } from "../social.js";

test("follow-mode href is escaped", () => {
  const html = buildSocialHtml({
    mode: "follow",
    items: [{ id: "instagram", url: '"><script>alert(1)</script>' }],
  });
  assert.ok(!html.includes("<script>alert(1)</script>"), "no raw script tag");
  assert.ok(html.includes("&quot;&gt;&lt;script&gt;"), "url must be escaped");
});
