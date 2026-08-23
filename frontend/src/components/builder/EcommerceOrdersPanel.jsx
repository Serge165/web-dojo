import React, { useState } from "react";

const API = process.env.REACT_APP_BACKEND_URL || "";

export default function EcommerceOrdersPanel({ projectId }) {
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(null);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState([]);
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
      const ordersRes = await fetch(`${API}/api/dashboard/${projectId}/orders`, {
        headers: { "X-Dashboard-Token": body.token },
      });
      const ordersBody = await ordersRes.json();
      setOrders(ordersBody.orders || []);
    } finally {
      setLoading(false);
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
    <table>
      <tbody>
        {orders.map((o) => (
          <tr key={o.id}>
            <td>{o.provider}</td>
            <td>{o.customer_email}</td>
            <td>{(o.amount_total / 100).toFixed(2)} {(o.currency || "").toUpperCase()}</td>
            <td>{o.created_at}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
