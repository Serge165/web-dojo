// Shared X-Dashboard-Token management for the owner-facing dashboards
// (submissions inbox, site analytics, e-commerce panel). Mirrors the backend's
// `_require_dashboard_token` contract: exchange the project's dashboard
// password once for a short-lived token via POST /api/dashboard/{id}/unlock,
// then attach it as a header on every gated request. The token is cached in
// sessionStorage per project so the user isn't re-prompted for the password in
// every modal during a session; it dies with the tab.
import { useCallback, useState } from "react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const storageKey = (projectId) => `wd_dash_token_${projectId}`;

export const readStoredDashboardToken = (projectId) => {
  try { return sessionStorage.getItem(storageKey(projectId)); } catch { return null; }
};

export const useDashboardToken = (projectId) => {
  const [token, setToken] = useState(() => readStoredDashboardToken(projectId));
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState("");

  const unlock = useCallback(async (password) => {
    setError("");
    setUnlocking(true);
    try {
      const r = await axios.post(`${API}/dashboard/${projectId}/unlock`, { password });
      try { sessionStorage.setItem(storageKey(projectId), r.data.token); } catch { /* private mode */ }
      setToken(r.data.token);
      return r.data.token;
    } catch (e) {
      setError(e.response?.data?.detail || "Couldn't reach the server");
      return null;
    } finally {
      setUnlocking(false);
    }
  }, [projectId]);

  const signOut = useCallback(() => {
    try { sessionStorage.removeItem(storageKey(projectId)); } catch { /* noop */ }
    setToken(null);
  }, [projectId]);

  return { token, unlocking, error, unlock, signOut };
};

// Axios header helper — returns {} when no token is available so callers can
// spread it straight into an axios config.
export const dashHeaders = (token) => (token ? { "X-Dashboard-Token": token } : {});

export const DashboardUnlockGate = ({ title, description, error, unlocking, onUnlock }) => (
  <div className="flex flex-col items-center justify-center text-center py-14 px-6">
    <div className="text-sm text-[#E4DECE] font-medium mb-1">{title}</div>
    <div className="text-xs text-[#948C79] mb-4 max-w-sm leading-relaxed">{description}</div>
    <form
      onSubmit={(e) => { e.preventDefault(); onUnlock(new FormData(e.currentTarget).get("password")); }}
      className="flex gap-2 w-full max-w-xs"
    >
      <input
        type="password"
        name="password"
        placeholder="Dashboard password"
        autoFocus
        data-testid="dashboard-unlock-password"
        className="flex-1 bg-[#15130E] border border-[#332D22] rounded px-2.5 py-1.5 text-xs text-[#F1EDE2] outline-none focus:border-[#C9A227]"
      />
      <button
        type="submit"
        disabled={unlocking}
        data-testid="dashboard-unlock-submit"
        className="px-3 py-1.5 rounded bg-[#AD8B21] hover:bg-[#C9A227] disabled:opacity-50 text-[#F1EDE2] text-xs whitespace-nowrap"
      >
        {unlocking ? "Unlocking…" : "Unlock"}
      </button>
    </form>
    {error && <div className="text-xs text-red-400 mt-2" data-testid="dashboard-unlock-error">{error}</div>}
  </div>
);