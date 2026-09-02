// Local-first persistence layer (Phase 9E).
//
// Every save the builder makes is durably mirrored into IndexedDB BEFORE the
// network call, and the network save is also recorded in a replayable queue.
// If the backend is unreachable (offline, Tauri sidecar down, laptop asleep),
// the queue entry stays behind and is replayed automatically when the
// connection returns — so a dropped connection can no longer lose work.
//
// Dependency note: this is a deliberate ~1kb hand-rolled wrapper rather than
// Dexie. It covers exactly the three stores/operations we need, works in the
// Tauri webview, and keeps the dependency tree untouched. Dexie (MIT) remains
// a drop-in upgrade if live queries across tabs are ever needed — the public
// API below (saveSnapshot/getSnapshot/enqueue/flushQueue) is the contract to
// preserve.

const DB_NAME = "web-dojo-local";
const DB_VERSION = 1;
const PROJECTS = "projects"; // keyPath "id" — full save payloads, by project id
const QUEUE = "queue";       // keyPath "seq", autoIncrement — unsynced saves

export const localDbAvailable = typeof indexedDB !== "undefined";

let dbPromise = null;
const openDb = () => {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(PROJECTS)) db.createObjectStore(PROJECTS, { keyPath: "id" });
        if (!db.objectStoreNames.contains(QUEUE)) db.createObjectStore(QUEUE, { keyPath: "seq", autoIncrement: true });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
};

const request = (store, mode, run) => openDb().then(
  (db) => new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const out = run(tx.objectStore(store));
    tx.oncomplete = () => resolve(out && out.result !== undefined ? out.result : out);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  })
);

const reqVal = (r) => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });

// ---------- Project snapshots (instant durability) ----------

export async function saveSnapshot(doc) {
  if (!localDbAvailable || !doc) return false;
  try {
    await request(PROJECTS, "readwrite", (s) => s.put({ ...doc, _saved_at: new Date().toISOString() }));
    return true;
  } catch { return false; } // private-mode browsers etc. — never block saving on this
}

export async function getSnapshot(id) {
  if (!localDbAvailable || !id) return null;
  try { return await request(PROJECTS, "readonly", (s) => reqVal(s.get(id))); } catch { return null; }
}

export async function listSnapshots() {
  if (!localDbAvailable) return [];
  try { return (await request(PROJECTS, "readonly", (s) => reqVal(s.getAll()))) || []; } catch { return []; }
}

export async function deleteSnapshot(id) {
  if (!localDbAvailable || !id) return;
  try { await request(PROJECTS, "readwrite", (s) => s.delete(id)); } catch {}
}

// ---------- Unsynced-save queue (replayed on reconnect) ----------

// entry: { method: "put"|"post", url, payload }. Returns the auto seq (or null).
export async function enqueue(entry) {
  if (!localDbAvailable) return null;
  try {
    return await request(QUEUE, "readwrite", (s) => reqVal(s.add({ ...entry, ts: Date.now() })));
  } catch { return null; }
}

export async function pendingEntries() {
  if (!localDbAvailable) return [];
  try { return (await request(QUEUE, "readonly", (s) => reqVal(s.getAll()))) || []; } catch { return []; }
}

export async function queueSize() { return (await pendingEntries()).length; }

export async function removeQueued(seq) {
  if (!localDbAvailable || seq == null) return;
  try { await request(QUEUE, "readwrite", (s) => s.delete(seq)); } catch {}
}

let flushing = false;
// Replays queued saves oldest-first through `sender(entry)` until one fails;
// stops there so ordering is preserved for the rest on the next flush.
export async function flushQueue(sender) {
  if (!localDbAvailable || flushing || typeof sender !== "function") return 0;
  flushing = true;
  let sent = 0;
  try {
    for (const entry of await pendingEntries()) {
      try { await sender(entry); await removeQueued(entry.seq); sent++; }
      catch { break; }
    }
  } finally { flushing = false; }
  return sent;
}
