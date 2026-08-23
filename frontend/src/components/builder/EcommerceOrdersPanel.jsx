import React, { useState } from "react";

const API = process.env.REACT_APP_BACKEND_URL || "";
const FULFILLMENT_OPTIONS = ["processing", "shipped", "delivered"];

const inputCls = "w-full bg-[#15130E] border border-[#332D22] rounded px-3 py-2 text-sm text-[#F1EDE2] outline-none focus:border-[#C9A227]";
const thCls = "text-left text-[10px] uppercase tracking-wider text-[#948C79] font-normal px-3 py-2 border-b border-[#332D22]";
const tdCls = "text-sm text-[#E4DECE] px-3 py-2.5 border-b border-[#242019]";

export default function EcommerceOrdersPanel({ projectId }) {
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(null);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [view, setView] = useState("orders");
  const [loading, setLoading] = useState(false);

  const unlock = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/dashboard/${projectId}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.detail || "Incorrect password");
        return;
      }
      setToken(body.token);
      try {
        const ordersRes = await fetch(`${API}/api/dashboard/${projectId}/orders`, {
          headers: { "X-Dashboard-Token": body.token },
        });
        const ordersBody = await ordersRes.json();
        setOrders(ordersBody.orders || []);
      } catch {
        setError("Unlocked, but your orders couldn't be loaded. Please try again.");
      }
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const showCustomers = async () => {
    setView("customers");
    try {
      const res = await fetch(`${API}/api/dashboard/${projectId}/customers`, {
        headers: { "X-Dashboard-Token": token },
      });
      const body = await res.json();
      setCustomers(body.customers || []);
    } catch {
      setError("Couldn't load customers. Please try again.");
    }
  };

  const updateFulfillment = async (order, nextStatus) => {
    try {
      const res = await fetch(`${API}/api/dashboard/${projectId}/orders/${order.id}/fulfillment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Dashboard-Token": token },
        body: JSON.stringify({ fulfillment_status: nextStatus }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.detail || "Couldn't update fulfillment status.");
        return;
      }
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, fulfillment_status: body.fulfillment_status } : o)));
    } catch {
      setError("Couldn't reach the server.");
    }
  };

  if (!token) {
    return (
      <div className="min-h-full flex items-center justify-center bg-[#15130E] dojo-grid p-6">
        <div className="w-full max-w-sm bg-[#1C1A15] border border-[#332D22] rounded-lg p-6 space-y-3">
          <div className="text-sm font-semibold text-[#F1EDE2]">Dashboard access</div>
          <input
            type="password"
            placeholder="Dashboard password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputCls}
          />
          <button
            onClick={unlock}
            disabled={loading}
            className="w-full text-sm py-2 rounded bg-[#C9A227] hover:bg-[#D9BC55] text-[#15130E] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >{loading ? "Unlocking…" : "Unlock"}</button>
          {error && <p role="alert" className="text-xs text-red-400">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#15130E] p-6">
      {error && <p role="alert" className="text-xs text-red-400 mb-3">{error}</p>}
      <div className="flex items-center gap-1 mb-4 bg-[#1C1A15] border border-[#332D22] rounded-md p-0.5 w-fit">
        <button
          onClick={() => setView("orders")}
          className={`px-3 py-1.5 text-xs rounded ${view === "orders" ? "bg-[#242019] text-[#F1EDE2]" : "text-[#A79C87] hover:text-[#F1EDE2]"}`}
        >Orders</button>
        <button
          onClick={showCustomers}
          className={`px-3 py-1.5 text-xs rounded ${view === "customers" ? "bg-[#242019] text-[#F1EDE2]" : "text-[#A79C87] hover:text-[#F1EDE2]"}`}
        >Customers</button>
      </div>
      {view === "orders" ? (
        <div className="bg-[#1C1A15] border border-[#332D22] rounded-lg overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={thCls}>Provider</th>
                <th className={thCls}>Customer</th>
                <th className={thCls}>Amount</th>
                <th className={thCls}>Date</th>
                <th className={thCls}>Fulfillment</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className={tdCls + " capitalize"}>{o.provider}</td>
                  <td className={tdCls}>{o.customer_email}</td>
                  <td className={tdCls + " font-mono"}>{(o.amount_total / 100).toFixed(2)} {(o.currency || "").toUpperCase()}</td>
                  <td className={tdCls + " text-[#948C79]"}>{o.created_at}</td>
                  <td className={tdCls}>
                    <select
                      aria-label="Fulfillment status"
                      value={o.fulfillment_status || "processing"}
                      disabled={(o.fulfillment_status || "processing") === "delivered"}
                      onChange={(e) => updateFulfillment(o, e.target.value)}
                      className="bg-[#15130E] border border-[#332D22] rounded px-2 py-1 text-xs text-[#F1EDE2] outline-none focus:border-[#C9A227] disabled:opacity-50 capitalize"
                    >
                      {FULFILLMENT_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-[#1C1A15] border border-[#332D22] rounded-lg overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={thCls}>Email</th>
                <th className={thCls}>Name</th>
                <th className={thCls}>Orders</th>
                <th className={thCls}>LTV</th>
                <th className={thCls}>Last order</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.email}>
                  <td className={tdCls}>{c.email}</td>
                  <td className={tdCls}>{c.name}</td>
                  <td className={tdCls + " font-mono"}>{c.order_count}</td>
                  <td className={tdCls + " font-mono text-[#D9BC55]"}>{(c.ltv / 100).toFixed(2)}</td>
                  <td className={tdCls + " text-[#948C79]"}>{c.last_order_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
