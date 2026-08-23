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

test("buildCartRuntimeHtml's baked script checks the URL for a session_id and fetches the receipt", () => {
  const html = buildCartRuntimeHtml({ currency: "usd", accent: "#4f46e5", paypalClientId: "", projectId: "proj-123" });
  expect(html).toContain("session_id");
  expect(html).toContain("/commerce/receipt/");
  expect(html).toContain("window.print");
});
