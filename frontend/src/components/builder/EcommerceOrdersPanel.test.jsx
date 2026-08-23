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
