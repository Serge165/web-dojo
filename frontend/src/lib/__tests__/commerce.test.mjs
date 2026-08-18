import test from "node:test";
import assert from "node:assert/strict";
import { stripeButtonHtml, paypalButtonHtml } from "../commerce.js";

test("stripeButtonHtml escapes label, url, and accent", () => {
  const html = stripeButtonHtml({
    label: '"><script>alert(1)</script>',
    url: 'https://example.com/"><script>alert(1)</script>',
    accent: '"onmouseover="alert(1)',
  });
  assert.ok(!html.includes("<script>alert(1)</script>"), "no raw script tag");
  assert.ok(!html.includes('onmouseover="alert(1)'), "accent must not break out of style attribute");
  assert.ok(html.includes("&quot;&gt;&lt;script&gt;"), "label must be escaped");
});

test("paypalButtonHtml escapes clientId in the script src attribute", () => {
  const html = paypalButtonHtml({
    clientId: '"><script>alert(1)</script>',
    amount: 10,
    currency: "USD",
    label: "Buy",
  });
  assert.ok(!html.includes('client-id="><script>alert(1)</script>'), "clientId must not break out of src attribute");
  assert.ok(html.includes("&quot;&gt;&lt;script&gt;"), "clientId must be escaped");
});

test("paypalButtonHtml prevents </script> breakout via label", () => {
  const html = paypalButtonHtml({ clientId: "abc", amount: 10, currency: "USD", label: "</script><script>alert(1)</script>" });
  const scriptBlocks = html.match(/<script[^>]*>[\s\S]*?<\/script>/g) || [];
  // Only the two legitimate <script> tags (SDK src tag + the inline handler) should exist —
  // if the label broke out, there would be a third, attacker-injected one.
  assert.equal(scriptBlocks.length, 2);
});
