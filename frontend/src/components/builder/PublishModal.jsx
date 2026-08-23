import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Server, ShieldCheck, ShieldAlert, Trash2, KeyRound, Unlock, ChevronRight } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const inputCls = "w-full bg-[#15130E] border border-[#332D22] rounded px-2 py-1.5 text-xs text-[#F1EDE2] outline-none focus:border-[#C9A227]";
const monoCls = inputCls + " font-mono";

const EMPTY = {
  host: "",
  port: "",
  username: "",
  password: "",
  remote_path: "/public_html",
  protocol: "ftp",
  html_filename: "index.html",
  css_filename: "globals.css",
  include_zip: false,
};

// Modal that gathers FTP / FTPS / SFTP credentials, supports saving
// reusable presets (with optional encrypted-password storage), then
// POSTs to the backend to upload the generated site.
export const PublishModal = ({ open, onClose, projectId, projectName, onEnsureSaved }) => {
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [presets, setPresets] = useState([]);
  const [selectedPresetId, setSelectedPresetId] = useState("");
  const [savePreset, setSavePreset] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [savePassword, setSavePassword] = useState(true);

  const update = (patch) => setForm((f) => ({ ...f, ...patch }));

  useEffect(() => {
    if (open) refreshPresets();
  }, [open]);

  const refreshPresets = async () => {
    try {
      const r = await axios.get(`${API}/publish-presets`);
      setPresets(r.data || []);
    } catch (e) {
      // non-fatal
    }
  };

  const applyPreset = async (preset) => {
    setSelectedPresetId(preset.id);
    let password = "";
    if (preset.has_password) {
      try {
        const r = await axios.get(`${API}/publish-presets/${preset.id}/secret`);
        password = r.data.password || "";
      } catch {
        toast.error("Could not load saved password");
      }
    }
    setForm({
      host: preset.host || "",
      port: preset.port ? String(preset.port) : "",
      username: preset.username || "",
      password,
      remote_path: preset.remote_path || "/",
      protocol: preset.protocol || "ftp",
      html_filename: preset.html_filename || "index.html",
      css_filename: preset.css_filename || "globals.css",
      include_zip: !!preset.include_zip,
    });
    toast.success(`Loaded preset "${preset.name}"`);
  };

  const deletePreset = async (id, e) => {
    e.stopPropagation();
    try {
      await axios.delete(`${API}/publish-presets/${id}`);
      setPresets((p) => p.filter((x) => x.id !== id));
      if (selectedPresetId === id) setSelectedPresetId("");
      toast.success("Preset removed");
    } catch {
      toast.error("Delete failed");
    }
  };

  const saveCurrentAsPreset = async () => {
    if (!presetName.trim()) {
      toast.error("Give the preset a name");
      return;
    }
    if (!form.host || !form.username) {
      toast.error("Host and username are required to save a preset");
      return;
    }
    try {
      const payload = {
        name: presetName.trim(),
        host: form.host.trim(),
        username: form.username.trim(),
        password: form.password,
        save_password: savePassword && !!form.password,
        remote_path: form.remote_path.trim() || "/",
        protocol: form.protocol,
        html_filename: form.html_filename.trim() || "index.html",
        css_filename: form.css_filename.trim() || "globals.css",
        include_zip: form.include_zip,
      };
      if (form.port) payload.port = Number(form.port);
      await axios.post(`${API}/publish-presets`, payload);
      setSavePreset(false);
      setPresetName("");
      toast.success(`Preset "${payload.name}" saved`);
      refreshPresets();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Save failed");
    }
  };

  const publish = async () => {
    if (!form.host || !form.username || !form.password) {
      toast.error("Host, username and password are required");
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const id = await onEnsureSaved();
      if (!id) {
        toast.error("Save the project first, then try again");
        setBusy(false);
        return;
      }
      const payload = {
        host: form.host.trim(),
        username: form.username.trim(),
        password: form.password,
        remote_path: form.remote_path.trim() || "/",
        protocol: form.protocol,
        html_filename: form.html_filename.trim() || "index.html",
        css_filename: form.css_filename.trim() || "globals.css",
        include_zip: form.include_zip,
      };
      if (form.port) payload.port = Number(form.port);
      const res = await axios.post(`${API}/projects/${id}/publish`, payload);
      setResult(res.data);
      toast.success(`Published to ${form.host}${payload.remote_path}`);
    } catch (e) {
      const msg = e.response?.data?.detail || e.message || "Upload failed";
      toast.error(msg);
      setResult({ error: msg });
    } finally {
      setBusy(false);
    }
  };

  const isSecure = form.protocol !== "ftp";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#1C1A15] border border-[#332D22] text-[#F1EDE2] max-w-lg max-h-[90vh] overflow-y-auto" data-testid="publish-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Server size={16} /> Publish “{projectName}”</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          {presets.length > 0 && (
            <div className="rounded border border-[#332D22] bg-[#15130E] p-2" data-testid="publish-presets-list">
              <div className="text-[10px] uppercase tracking-wider text-[#948C79] mb-1.5 px-1">Saved profiles</div>
              <div className="space-y-1 max-h-[140px] overflow-y-auto">
                {presets.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => applyPreset(p)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer group ${selectedPresetId === p.id ? "bg-[#AD8B21]/25 border border-[#C9A227]/60" : "hover:bg-[#242019] border border-transparent"}`}
                    data-testid={`preset-row-${p.id}`}
                  >
                    {p.has_password ? <KeyRound size={12} className="text-emerald-400 shrink-0" /> : <Unlock size={12} className="text-[#948C79] shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-[#F1EDE2] truncate">{p.name}</div>
                      <div className="text-[10px] text-[#948C79] font-mono truncate">{p.protocol}://{p.username}@{p.host}{p.remote_path}</div>
                    </div>
                    <button
                      onClick={(e) => deletePreset(p.id, e)}
                      className="p-1 text-[#6B6353] hover:text-red-400 opacity-0 group-hover:opacity-100"
                      data-testid={`preset-del-${p.id}`}
                      title="Delete preset"
                    ><Trash2 size={11} /></button>
                    <ChevronRight size={12} className="text-[#6B6353] opacity-0 group-hover:opacity-100" />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-[11px] px-2 py-1.5 rounded border border-[#332D22] bg-[#15130E]">
            {isSecure ? <ShieldCheck size={12} className="text-emerald-400" /> : <ShieldAlert size={12} className="text-amber-400" />}
            <span className="text-[#A79C87]">Web Dojo encrypts saved passwords with Fernet on the server. Live upload creds are used once and not logged.</span>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-[#948C79] block mb-1">Protocol</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { v: "ftp", l: "FTP" },
                { v: "ftps", l: "FTPS (TLS)" },
                { v: "sftp", l: "SFTP" },
              ].map((p) => (
                <button
                  key={p.v}
                  onClick={() => update({ protocol: p.v })}
                  className={`text-[11px] py-1.5 rounded border ${form.protocol === p.v ? "border-[#C9A227] bg-[#2A2416] text-[#F1EDE2]" : "border-[#332D22] bg-[#242019] text-[#F1EDE2] hover:bg-[#332D22]"}`}
                  data-testid={`publish-protocol-${p.v}`}
                >{p.l}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-[1fr_100px] gap-2">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#948C79] block mb-1">Host</label>
              <input value={form.host} onChange={(e) => update({ host: e.target.value })} className={inputCls} placeholder="ftp.example.com" data-testid="publish-host" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#948C79] block mb-1">Port</label>
              <input value={form.port} onChange={(e) => update({ port: e.target.value })} className={monoCls} placeholder={form.protocol === "sftp" ? "22" : "21"} data-testid="publish-port" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#948C79] block mb-1">Username</label>
              <input value={form.username} onChange={(e) => update({ username: e.target.value })} className={inputCls} data-testid="publish-username" autoComplete="off" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#948C79] block mb-1">Password</label>
              <input type="password" value={form.password} onChange={(e) => update({ password: e.target.value })} className={inputCls} data-testid="publish-password" autoComplete="new-password" />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-[#948C79] block mb-1">Remote path</label>
            <input value={form.remote_path} onChange={(e) => update({ remote_path: e.target.value })} className={monoCls} placeholder="/public_html" data-testid="publish-path" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#948C79] block mb-1">HTML filename</label>
              <input value={form.html_filename} onChange={(e) => update({ html_filename: e.target.value })} className={monoCls} data-testid="publish-html-name" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#948C79] block mb-1">CSS filename</label>
              <input value={form.css_filename} onChange={(e) => update({ css_filename: e.target.value })} className={monoCls} data-testid="publish-css-name" />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-[#E4DECE]">
            <input type="checkbox" checked={form.include_zip} onChange={(e) => update({ include_zip: e.target.checked })} data-testid="publish-include-zip" />
            Also upload a <span className="font-mono">site.zip</span> archive
          </label>

          {/* Save-as-preset */}
          <div className="rounded border border-[#332D22] bg-[#15130E] p-2">
            {!savePreset ? (
              <button
                onClick={() => { setSavePreset(true); setPresetName(form.host || ""); }}
                className="w-full text-[11px] py-1.5 rounded bg-[#242019] hover:bg-[#332D22] text-[#F1EDE2] border border-[#332D22]"
                data-testid="preset-save-toggle"
              >+ Save these settings as a preset</button>
            ) : (
              <div className="space-y-2">
                <div className="text-[10px] uppercase tracking-wider text-[#948C79]">New preset</div>
                <input
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  className={inputCls}
                  placeholder="e.g. Production · ftp.example.com"
                  data-testid="preset-name"
                />
                <label className={`flex items-center gap-2 text-[11px] ${form.password ? "text-[#E4DECE]" : "text-[#6B6353]"}`}>
                  <input
                    type="checkbox"
                    checked={savePassword && !!form.password}
                    disabled={!form.password}
                    onChange={(e) => setSavePassword(e.target.checked)}
                    data-testid="preset-save-password"
                  />
                  Save password (encrypted) so it auto-fills next time
                  {!form.password && <span className="text-[10px] text-amber-500/80">— enter a password first</span>}
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={saveCurrentAsPreset}
                    className="flex-1 text-[11px] py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-[#F1EDE2]"
                    data-testid="preset-save-confirm"
                  >Save preset</button>
                  <button
                    onClick={() => { setSavePreset(false); setPresetName(""); }}
                    className="text-[11px] py-1.5 px-3 rounded bg-[#242019] hover:bg-[#332D22] text-[#F1EDE2] border border-[#332D22]"
                    data-testid="preset-save-cancel"
                  >Cancel</button>
                </div>
              </div>
            )}
          </div>

          {result && !result.error && (
            <div className="text-[11px] rounded border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 p-2" data-testid="publish-success">
              Uploaded {result.uploaded?.length || 0} file{result.uploaded?.length === 1 ? "" : "s"} to <span className="font-mono">{result.host}{result.path}</span>
            </div>
          )}
          {result?.error && (
            <div className="text-[11px] rounded border border-red-500/40 bg-red-500/10 text-red-300 p-2" data-testid="publish-error">{result.error}</div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="text-xs px-3 py-1.5 rounded bg-[#242019] hover:bg-[#332D22] text-[#F1EDE2] border border-[#332D22]" data-testid="publish-cancel">Close</button>
            <button
              onClick={publish}
              disabled={busy}
              className="text-xs px-3 py-1.5 rounded bg-[#AD8B21] hover:bg-[#C9A227] disabled:opacity-50 text-[#F1EDE2] flex items-center gap-1.5"
              data-testid="publish-submit"
            >
              {busy ? "Uploading…" : "Publish now"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
