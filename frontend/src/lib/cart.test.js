import { buildCartRuntimeHtml } from "./cart";

test("buildCartRuntimeHtml embeds the given projectId into the checkout-session request body", () => {
  const html = buildCartRuntimeHtml({ currency: "usd", accent: "#4f46e5", paypalClientId: "", projectId: "proj-123" });
  expect(html).toContain('project_id: "proj-123"');
});

test("buildCartRuntimeHtml's PayPal onApprove reports the captured order to the backend verify endpoint", () => {
  const html = buildCartRuntimeHtml({ currency: "usd", accent: "#4f46e5", paypalClientId: "client-abc", projectId: "proj-123" });
  expect(html).toContain("/api/commerce/paypal/verify");
  expect(html).toContain('project_id: "proj-123"');
});
