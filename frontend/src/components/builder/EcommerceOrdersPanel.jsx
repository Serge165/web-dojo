import React, { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

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
  const [customers, setCustomers] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [insights, setInsights] = useState(null);
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
      if (!res.ok) {
        setError("Couldn't load customers. Please try again.");
        return;
      }
      setCustomers(body.customers || []);
    } catch {
      setError("Couldn't load customers. Please try again.");
    }
  };

  const showAnalytics = async () => {
    setView("analytics");
    try {
      const res = await fetch(`${API}/api/dashboard/${projectId}/analytics`, {
        headers: { "X-Dashboard-Token": token },
      });
      const body = await res.json();
      if (!res.ok) {
        setError("Couldn't load analytics. Please try again.");
        return;
      }
      setAnalytics(body);
    } catch {
      setError("Couldn't load analytics. Please try again.");
    }
  };

  const showInsights = async () => {
    setView("insights");
    try {
      const res = await fetch(`${API}/api/dashboard/${projectId}/insights`, {
        headers: { "X-Dashboard-Token": token },
      });
      const body = await res.json();
      if (!res.ok) {
        setError("Couldn't load insights. Please try again.");
        return;
      }
      setInsights(body.alerts || []);
    } catch {
      setError("Couldn't load insights. Please try again.");
    }
  };

  const toCsv = (rows, columns) => {
    const escape = (v) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = columns.map((c) => c.label).join(",");
    const body = rows.map((r) => columns.map((c) => escape(c.value(r))).join(",")).join("\n");
    return `${header}\n${body}`;
  };

  const downloadCsv = (filename, csv) => {
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const exportOrdersCsv = () => {
    const columns = [
      { label: "provider", value: (o) => o.provider },
      { label: "customer_email", value: (o) => o.customer_email },
      { label: "amount", value: (o) => (o.amount_total / 100).toFixed(2) },
      { label: "currency", value: (o) => (o.currency || "").toUpperCase() },
      { label: "fulfillment_status", value: (o) => o.fulfillment_status || "processing" },
      { label: "created_at", value: (o) => o.created_at },
    ];
    downloadCsv("orders.csv", toCsv(orders, columns));
  };

  const exportCustomersCsv = () => {
    const columns = [
      { label: "email", value: (c) => c.email },
      { label: "name", value: (c) => c.name },
      { label: "order_count", value: (c) => c.order_count },
      { label: "ltv", value: (c) => (c.ltv / 100).toFixed(2) },
      { label: "last_order_at", value: (c) => c.last_order_at },
    ];
    downloadCsv("customers.csv", toCsv(customers, columns));
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
        <button
          onClick={showAnalytics}
          className={`px-3 py-1.5 text-xs rounded ${view === "analytics" ? "bg-[#242019] text-[#F1EDE2]" : "text-[#A79C87] hover:text-[#F1EDE2]"}`}
        >Analytics</button>
        <button
          onClick={showInsights}
          className={`px-3 py-1.5 text-xs rounded ${view === "insights" ? "bg-[#242019] text-[#F1EDE2]" : "text-[#A79C87] hover:text-[#F1EDE2]"}`}
        >Insights</button>
      </div>
      {view === "orders" && (
        <div className="bg-[#1C1A15] border border-[#332D22] rounded-lg overflow-hidden">
          <button
            onClick={exportOrdersCsv}
            data-testid="export-orders-csv"
            className="text-xs px-3 py-1.5 rounded bg-[#242019] hover:bg-[#332D22] border border-[#332D22] text-[#F1EDE2] mb-3"
          >Export CSV</button>
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
      )}
      {view === "customers" && customers && (
        <div className="bg-[#1C1A15] border border-[#332D22] rounded-lg overflow-hidden">
          <button
            onClick={exportCustomersCsv}
            data-testid="export-customers-csv"
            className="text-xs px-3 py-1.5 rounded bg-[#242019] hover:bg-[#332D22] border border-[#332D22] text-[#F1EDE2] mb-3"
          >Export CSV</button>
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
      {view === "analytics" && analytics && (
        <div className="space-y-4">
          <div className="bg-[#1C1A15] border border-[#332D22] rounded-lg p-4">
            <div className="text-[10px] uppercase tracking-wider text-[#948C79] mb-3">Revenue · last 30 days</div>
            <div className="flex gap-6 mb-4">
              <div>
                <div className="text-2xl font-semibold text-[#F1EDE2]">
                  {(analytics.revenue_trend.reduce((s, d) => s + d.revenue, 0) / 100).toFixed(2)}
                </div>
                <div className="text-[10px] text-[#948C79]">Total revenue</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-[#F1EDE2]">
                  {analytics.revenue_trend.reduce((s, d) => s + d.order_count, 0)}
                </div>
                <div className="text-[10px] text-[#948C79]">Orders</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={analytics.revenue_trend}>
                <CartesianGrid stroke="#332D22" strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fill: "#948C79", fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
                <YAxis tick={{ fill: "#948C79", fontSize: 10 }} tickFormatter={(v) => (v / 100).toFixed(0)} />
                <Tooltip contentStyle={{ background: "#1C1A15", border: "1px solid #332D22", fontSize: 12 }} labelStyle={{ color: "#F1EDE2" }} formatter={(v) => (v / 100).toFixed(2)} />
                <Line type="monotone" dataKey="revenue" stroke="#C9A227" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[#1C1A15] border border-[#332D22] rounded-lg p-4">
            <div className="text-[10px] uppercase tracking-wider text-[#948C79] mb-3">Fulfillment funnel · last 30 days</div>
            <div className="grid grid-cols-3 gap-3">
              {FULFILLMENT_OPTIONS.map((stage) => (
                <div key={stage} data-testid={`funnel-${stage}`}>
                  <div className="text-xl font-semibold text-[#F1EDE2]">{analytics.fulfillment_funnel[stage]}</div>
                  <div className="text-[10px] uppercase tracking-wider text-[#948C79] capitalize">{stage}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#1C1A15] border border-[#332D22] rounded-lg p-4">
            <div className="text-[10px] uppercase tracking-wider text-[#948C79] mb-3">Customers · last 30 days</div>
            <div className="grid grid-cols-2 gap-3">
              <div data-testid="breakdown-new">
                <div className="text-xl font-semibold text-[#F1EDE2]">{analytics.customer_breakdown.new_customers}</div>
                <div className="text-[10px] uppercase tracking-wider text-[#948C79]">New · {(analytics.customer_breakdown.new_revenue / 100).toFixed(2)}</div>
              </div>
              <div data-testid="breakdown-returning">
                <div className="text-xl font-semibold text-[#F1EDE2]">{analytics.customer_breakdown.returning_customers}</div>
                <div className="text-[10px] uppercase tracking-wider text-[#948C79]">Returning · {(analytics.customer_breakdown.returning_revenue / 100).toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="bg-[#1C1A15] border border-[#332D22] rounded-lg p-4">
            <div className="text-[10px] uppercase tracking-wider text-[#948C79] mb-3">Top products · last 30 days</div>
            {analytics.top_products.length === 0 ? (
              <div className="text-[11px] text-[#948C79]">No product sales in this window yet.</div>
            ) : (
              <table className="w-full border-collapse">
                <tbody>
                  {analytics.top_products.map((p, i) => (
                    <tr key={p.name}>
                      <td className="text-[11px] text-[#948C79] py-1 pr-2 w-6">{i + 1}</td>
                      <td className="text-sm text-[#E4DECE] py-1">{p.name}</td>
                      <td className="text-sm text-[#948C79] py-1 text-right font-mono">{p.quantity}</td>
                      <td className="text-sm text-[#D9BC55] py-1 pl-3 text-right font-mono">{(p.revenue / 100).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
      {view === "insights" && insights && (
        <div className="space-y-3">
          {insights.length === 0 ? (
            <div className="bg-[#1C1A15] border border-[#332D22] rounded-lg p-4 text-sm text-[#948C79]" data-testid="insights-empty">
              All clear — no issues detected.
            </div>
          ) : (
            insights.map((alert) => (
              <div
                key={alert.id}
                data-testid={`insight-${alert.id}`}
                className={`bg-[#1C1A15] border border-[#332D22] border-l-4 rounded-lg p-4 ${alert.severity === "warning" ? "border-l-red-400" : "border-l-[#D9BC55]"}`}
              >
                <div className="text-sm font-semibold text-[#F1EDE2] mb-1">{alert.title}</div>
                <div className="text-xs text-[#E4DECE]">{alert.detail}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
