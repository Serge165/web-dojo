import React, { useState } from "react";

const API = process.env.REACT_APP_BACKEND_URL || "";
const FULFILLMENT_OPTIONS = ["processing", "shipped", "delivered"];

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
      <div>
        <input type="password" placeholder="Dashboard password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button onClick={unlock} disabled={loading}>Unlock</button>
        {error && <p role="alert">{error}</p>}
      </div>
    );
  }

  return (
    <>
      {error && <p role="alert">{error}</p>}
      <div>
        <button onClick={() => setView("orders")}>Orders</button>
        <button onClick={showCustomers}>Customers</button>
      </div>
      {view === "orders" ? (
        <table>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>{o.provider}</td>
                <td>{o.customer_email}</td>
                <td>{(o.amount_total / 100).toFixed(2)} {(o.currency || "").toUpperCase()}</td>
                <td>{o.created_at}</td>
                <td>
                  <select
                    aria-label="Fulfillment status"
                    value={o.fulfillment_status || "processing"}
                    disabled={(o.fulfillment_status || "processing") === "delivered"}
                    onChange={(e) => updateFulfillment(o, e.target.value)}
                  >
                    {FULFILLMENT_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <table>
          <tbody>
            {customers.map((c) => (
              <tr key={c.email}>
                <td>{c.email}</td>
                <td>{c.name}</td>
                <td>{c.order_count}</td>
                <td>{(c.ltv / 100).toFixed(2)}</td>
                <td>{c.last_order_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
