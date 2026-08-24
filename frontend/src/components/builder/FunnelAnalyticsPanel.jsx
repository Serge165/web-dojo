import React, { useState } from "react";

const API = process.env.REACT_APP_BACKEND_URL || "";

const inputCls = "w-full bg-[#15130E] border border-[#332D22] rounded px-3 py-2 text-sm text-[#F1EDE2] outline-none focus:border-[#C9A227]";
const labelCls = "text-[10px] uppercase tracking-wider text-[#948C79] block mb-1";
const btnPrimary = "text-xs py-1.5 px-3 rounded bg-[#AD8B21] hover:bg-[#C9A227] text-[#F1EDE2]";

export default function FunnelAnalyticsPanel({ projectId }) {
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(null);
  const [error, setError] = useState("");
  const [variant, setVariant] = useState("control");
  const [data, setData] = useState(null);
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
      await loadAnalytics(body.token, variant);
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async (tok, v) => {
    try {
      const res = await fetch(`${API}/api/analytics/funnels/${projectId}?variant=${encodeURIComponent(v)}`, {
        headers: { "X-Dashboard-Token": tok },
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.detail || "Couldn't load funnel analytics");
        return;
      }
      setData(body);
    } catch {
      setError("Couldn't load funnel analytics. Please try again.");
    }
  };

  const switchVariant = (v) => {
    setVariant(v);
    if (token) loadAnalytics(token, v);
  };

  if (!token) {
    return (
      <div className="p-6 bg-[#1C1A15] rounded-lg border border-[#332D22]" data-testid="funnel-analytics">
        <h2 className="text-lg font-semibold text-[#F1EDE2] mb-4">Funnel Analytics</h2>
        <div className="space-y-3 max-w-sm">
          <div>
            <label className={labelCls}>Dashboard password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
              placeholder="Enter dashboard password"
              data-testid="funnel-password"
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button onClick={unlock} className={btnPrimary} data-testid="funnel-unlock">
            {loading ? "Unlocking..." : "Unlock"}
          </button>
        </div>
      </div>
    );
  }

  const steps = [
    { key: "entry_count", label: "Entry", color: "#C9A227" },
    { key: "checkpoint_a_count", label: "Checkpoint A", color: "#8B7D3F" },
    { key: "checkpoint_b_count", label: "Checkpoint B", color: "#5A5230" },
    { key: "conversion_count", label: "Conversion", color: "#3D5A30" },
  ];

  return (
    <div className="p-6 bg-[#1C1A15] rounded-lg border border-[#332D22]" data-testid="funnel-analytics">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#F1EDE2]">Funnel Analytics</h2>
        <div className="flex gap-1">
          {["control", "variant_a", "variant_b"].map((v) => (
            <button
              key={v}
              onClick={() => switchVariant(v)}
              className={`text-xs px-3 py-1.5 rounded ${variant === v ? "bg-[#2A2416] text-[#C9A227] border border-[#C9A227]" : "text-[#948C79] hover:text-[#F1EDE2]"}`}
              data-testid={`funnel-variant-${v}`}
            >{v === "control" ? "Control" : v === "variant_a" ? "Variant A" : "Variant B"}</button>
          ))}
        </div>
      </div>

      {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

      {data && (
        <div className="space-y-4">
          {/* Funnel visualization */}
          <div className="space-y-2">
            {steps.map((s, i) => {
              const count = data[s.key] || 0;
              const max = data.entry_count || 1;
              const pct = Math.round((count / max) * 100);
              return (
                <div key={s.key} className="space-y-1" data-testid={`funnel-step-${s.key}`}>
                  <div className="flex justify-between text-xs text-[#948C79]">
                    <span>{s.label}</span>
                    <span>{count} ({pct}%)</span>
                  </div>
                  <div className="h-3 rounded bg-[#242019] overflow-hidden">
                    <div
                      className="h-full rounded transition-all"
                      style={{ width: `${pct}%`, backgroundColor: s.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Drop-off + conversion stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-[#332D22] rounded p-3" data-testid="funnel-dropoff-a">
              <div className="text-[10px] uppercase tracking-wider text-[#948C79]">Drop-off A</div>
              <div className="text-xl font-semibold text-[#F1EDE2]">{data.drop_off_a}</div>
            </div>
            <div className="border border-[#332D22] rounded p-3" data-testid="funnel-dropoff-b">
              <div className="text-[10px] uppercase tracking-wider text-[#948C79]">Drop-off B</div>
              <div className="text-xl font-semibold text-[#F1EDE2]">{data.drop_off_b}</div>
            </div>
            <div className="border border-[#332D22] rounded p-3" data-testid="funnel-conversion-rate">
              <div className="text-[10px] uppercase tracking-wider text-[#948C79]">Conversion Rate</div>
              <div className="text-xl font-semibold text-[#F1EDE2]">{data.conversion_rate}%</div>
            </div>
            <div className="border border-[#332D22] rounded p-3" data-testid="funnel-time-to-conversion">
              <div className="text-[10px] uppercase tracking-wider text-[#948C79]">Avg Time to Conversion</div>
              <div className="text-xl font-semibold text-[#F1EDE2]">
                {data.avg_time_to_conversion_seconds != null
                  ? `${Math.round(data.avg_time_to_conversion_seconds / 60)}m`
                  : "—"}
              </div>
            </div>
          </div>

          {/* Recent events */}
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#948C79] mb-2">Recent Events</div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {(data.events || []).slice(0, 20).map((e) => (
                <div key={e.id} className="flex justify-between text-xs text-[#948C79] border-b border-[#242019] py-1">
                  <span>{e.checkpoint}</span>
                  <span>{e.timestamp}</span>
                </div>
              ))}
              {(data.events || []).length === 0 && <p className="text-xs text-[#6B6455]">No events yet.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}