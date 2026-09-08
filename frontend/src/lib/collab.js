// Collaboration runtime (Phase 9A) — dependency-free slice: presence.
//
// The spec's full Yjs/CRDT sync needs the pycrdt-websocket server (see the
// Phase 9 handoff); this module ships the transport-agnostic half that is
// useful TODAY and survives the CRDT upgrade unchanged:
//   - project JWTs (login/register/logout) via the existing builder_auth
//     endpoints, persisted to localStorage
//   - presence beacons (who has this project open, color + name) over the
//     existing REST API — 15s heartbeat, 40s expiry, no websocket needed
//
// When pycrdt lands, the auth helpers stay; presence moves onto the
// y-websocket awareness channel and this file's REST beacon is retired.
import axios from "axios";

const API = process.env.REACT_APP_BACKEND_URL || "";
const TOKEN_KEY = "wd_collab_jwt";
const USER_KEY = "wd_collab_user";
const COLORS = ["#C9A227", "#4E9A51", "#B5533C", "#4A7FA5", "#8E5BA6", "#C9743B"];

const authHeaders = () => {
  const t = localStorage.getItem(TOKEN_KEY);
  return t ? { Authorization: `Bearer ${t}` } : {};
};

export const getStoredUser = () => {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || "null"); } catch { return null; }
};

export const login = async (email, password) => {
  const res = await axios.post(`${API}/api/auth/login`, { email, password });
  localStorage.setItem(TOKEN_KEY, res.data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
  return res.data;
};

export const register = async (email, password) => {
  const res = await axios.post(`${API}/api/auth/register`, { email, password });
  if (res.data.token) {
    localStorage.setItem(TOKEN_KEY, res.data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
  }
  return res.data;
};

export const logout = async () => {
  try { await axios.post(`${API}/api/auth/logout`, {}, { headers: authHeaders() }); } catch { /* best-effort */ }
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const authedHeaders = authHeaders;

// ---------- Presence (REST heartbeat) ----------

const presenceColor = (id) => COLORS[Math.abs(hash(id || "")) % COLORS.length];

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

// Announce this user as viewing the project and return the other live
// collaborators. Backend: GET/POST /api/projects/{id}/presence in
// backend/models/presence.py.
export async function heartbeat(projectId, user) {
  if (!projectId || !user) return [];
  try {
    const res = await axios.post(
      `${API}/api/projects/${projectId}/presence`,
      { name: user.email.split("@")[0], color: presenceColor(user.id || user.email) },
      { headers: authHeaders() }
    );
    return res.data?.peers || [];
  } catch {
    return []; // presence is best-effort — never block editing on it
  }
}

// Start a 15s presence loop; returns stop().
export function startPresenceLoop(projectId, user, onPeers) {
  let stopped = false;
  let timer = null;
  const tick = async () => {
    if (stopped) return;
    const peers = await heartbeat(projectId, user);
    if (!stopped && onPeers) onPeers(peers);
    if (!stopped) timer = setTimeout(tick, 15000);
  };
  tick();
  return () => { stopped = true; clearTimeout(timer); };
}
