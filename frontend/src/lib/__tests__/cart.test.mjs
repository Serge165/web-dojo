import test from "node:test";
import assert from "node:assert/strict";
import { buildAddToCartButton } from "../cart.js";

test("buildAddToCartButton escapes name and image attributes", () => {
  const html = buildAddToCartButton({
    id: "p1",
    name: '"><script>alert(1)</script>',
    amount: 10,
    image: '" onerror="alert(1)',
  });
  assert.ok(!html.includes("<script>alert(1)</script>"), "no raw script tag");
  assert.ok(!html.includes('onerror="alert(1)"'), "image must not break out of attribute");
});
