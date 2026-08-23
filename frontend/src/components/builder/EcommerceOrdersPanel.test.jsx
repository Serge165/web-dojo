import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import EcommerceOrdersPanel from "./EcommerceOrdersPanel";

beforeEach(() => {
  global.fetch = jest.fn();
});

test("shows a password prompt before any orders are loaded", () => {
  render(<EcommerceOrdersPanel projectId="proj-123" />);
  expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
  expect(screen.queryByText(/order/i)).not.toBeInTheDocument();
});

test("unlocking with the correct password loads and displays orders", async () => {
  global.fetch
    .mockResolvedValueOnce({ ok: true, json: async () => ({ token: "tok-abc" }) })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        orders: [{ id: "o1", provider: "stripe", provider_ref: "cs_1", amount_total: 3800, currency: "usd", customer_email: "buyer@example.com", created_at: "2026-08-21T00:00:00Z" }],
        total: 1, page: 1, page_size: 20,
      }),
    });

  render(<EcommerceOrdersPanel projectId="proj-123" />);
  fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: "hunter22" } });
  fireEvent.click(screen.getByText(/unlock/i));

  await waitFor(() => expect(screen.getByText(/buyer@example.com/)).toBeInTheDocument());
  expect(screen.getByText(/38\.00/)).toBeInTheDocument();
});

test("an incorrect password shows an error and does not load orders", async () => {
  global.fetch.mockResolvedValueOnce({ ok: false, status: 401, json: async () => ({ detail: "Incorrect password" }) });

  render(<EcommerceOrdersPanel projectId="proj-123" />);
  fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: "wrong" } });
  fireEvent.click(screen.getByText(/unlock/i));

  await waitFor(() => expect(screen.getByText(/incorrect password/i)).toBeInTheDocument());
  expect(global.fetch).toHaveBeenCalledTimes(1);
});

test("changing the fulfillment dropdown calls PATCH and updates the row", async () => {
  global.fetch
    .mockResolvedValueOnce({ ok: true, json: async () => ({ token: "tok-abc" }) })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        orders: [{ id: "o1", provider: "stripe", provider_ref: "cs_1", amount_total: 3800, currency: "usd", customer_email: "buyer@example.com", created_at: "2026-08-23T00:00:00Z", fulfillment_status: "processing" }],
        total: 1, page: 1, page_size: 20,
      }),
    })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ id: "o1", fulfillment_status: "shipped" }) });

  render(<EcommerceOrdersPanel projectId="proj-123" />);
  fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: "hunter22" } });
  fireEvent.click(screen.getByText(/unlock/i));
  await waitFor(() => expect(screen.getByLabelText(/fulfillment status/i)).toBeInTheDocument());

  fireEvent.change(screen.getByLabelText(/fulfillment status/i), { target: { value: "shipped" } });

  await waitFor(() => expect(screen.getByLabelText(/fulfillment status/i)).toHaveValue("shipped"));
  const patchCall = global.fetch.mock.calls[2];
  expect(patchCall[0]).toBe("/api/dashboard/proj-123/orders/o1/fulfillment");
  expect(patchCall[1].method).toBe("PATCH");
  expect(JSON.parse(patchCall[1].body)).toEqual({ fulfillment_status: "shipped" });
});

test("the Customers tab loads and displays customer LTV", async () => {
  global.fetch
    .mockResolvedValueOnce({ ok: true, json: async () => ({ token: "tok-abc" }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ orders: [], total: 0, page: 1, page_size: 20 }) })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        customers: [{ email: "buyer@example.com", name: "Ada Lovelace", order_count: 2, ltv: 5800, last_order_at: "2026-08-22T00:00:00Z" }],
        total: 1, page: 1, page_size: 20,
      }),
    });

  render(<EcommerceOrdersPanel projectId="proj-123" />);
  fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: "hunter22" } });
  fireEvent.click(screen.getByText(/unlock/i));
  await waitFor(() => expect(screen.getByRole("button", { name: /customers/i })).toBeInTheDocument());

  fireEvent.click(screen.getByRole("button", { name: /customers/i }));

  await waitFor(() => expect(screen.getByText(/58\.00/)).toBeInTheDocument());
  expect(screen.getByText(/ada lovelace/i)).toBeInTheDocument();
});

test("the Analytics tab loads and displays fulfillment funnel counts", async () => {
  global.fetch
    .mockResolvedValueOnce({ ok: true, json: async () => ({ token: "tok-abc" }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ orders: [], total: 0, page: 1, page_size: 20 }) })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        window: { start: "2026-07-25", end: "2026-08-23", days: 30 },
        revenue_trend: [{ date: "2026-08-23", order_count: 2, revenue: 5000 }],
        fulfillment_funnel: { processing: 3, shipped: 1, delivered: 2 },
        customer_breakdown: { new_customers: 0, returning_customers: 0, new_revenue: 0, returning_revenue: 0 },
        top_products: [],
      }),
    });

  render(<EcommerceOrdersPanel projectId="proj-123" />);
  fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: "hunter22" } });
  fireEvent.click(screen.getByText(/unlock/i));
  await waitFor(() => expect(screen.getByRole("button", { name: /analytics/i })).toBeInTheDocument());

  fireEvent.click(screen.getByRole("button", { name: /analytics/i }));

  await waitFor(() => expect(screen.getByTestId("funnel-shipped")).toHaveTextContent("1"));
  expect(screen.getByTestId("funnel-processing")).toHaveTextContent("3");
  expect(screen.getByTestId("funnel-delivered")).toHaveTextContent("2");
});

test("the Analytics tab displays customer breakdown and top products", async () => {
  global.fetch
    .mockResolvedValueOnce({ ok: true, json: async () => ({ token: "tok-abc" }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ orders: [], total: 0, page: 1, page_size: 20 }) })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        window: { start: "2026-07-25", end: "2026-08-23", days: 30 },
        revenue_trend: [{ date: "2026-08-23", order_count: 1, revenue: 3800 }],
        fulfillment_funnel: { processing: 1, shipped: 0, delivered: 0 },
        customer_breakdown: { new_customers: 5, returning_customers: 2, new_revenue: 19000, returning_revenue: 8000 },
        top_products: [{ name: "Aurora Bottle", quantity: 3, revenue: 11400 }],
      }),
    });

  render(<EcommerceOrdersPanel projectId="proj-123" />);
  fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: "hunter22" } });
  fireEvent.click(screen.getByText(/unlock/i));
  await waitFor(() => expect(screen.getByRole("button", { name: /analytics/i })).toBeInTheDocument());

  fireEvent.click(screen.getByRole("button", { name: /analytics/i }));

  await waitFor(() => expect(screen.getByTestId("breakdown-new")).toHaveTextContent("5"));
  expect(screen.getByTestId("breakdown-returning")).toHaveTextContent("2");
  expect(screen.getByText(/aurora bottle/i)).toBeInTheDocument();
  expect(screen.getByText(/114\.00/)).toBeInTheDocument();
});
