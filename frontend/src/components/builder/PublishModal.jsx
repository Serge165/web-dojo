import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Server, ShieldCheck, ShieldAlert } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const inputCls = "w-full bg-[#0D0D0D] border border-[#2B2B2B] rounded px-2 py-1.5 text-xs text-white outline-none focus:border-blue-500";
const monoCls = inputCls + " font-mono";

// Modal that gathers FTP / FTPS / SFTP credentials, then POSTs to the
// backend to upload the generated site to the destination server.
export const PublishModal = ({ open, onClose, projectId, projectName, onEnsureSaved }) => {
  const [form, setForm] = useState({
    host: "",
    port: "",
    username: "",
    password: "",
    remote_path: "/public_html",
    protocol: "ftp",
    html_filename: "index.html",
    css_filename: "styles.css",
    include_zip: false,
  });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const update = (patch) => setForm((f) => ({ ...f, ...patch }));

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
        css_filename: form.css_filename.trim() || "styles.css",
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
      <DialogContent className="bg-[#141414] border border-[#2B2B2B] text-white max-w-lg" data-testid="publish-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Server size={16} /> Publish “{projectName}”</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2 text-[11px] px-2 py-1.5 rounded border border-[#2B2B2B] bg-[#0D0D0D]">
            {isSecure ? <ShieldCheck size={12} className="text-emerald-400" /> : <ShieldAlert size={12} className="text-amber-400" />}
            <span className="text-gray-400">Credentials are sent to the Web Dojo API and used once for this upload — nothing is stored.</span>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">Protocol</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { v: "ftp", l: "FTP" },
                { v: "ftps", l: "FTPS (TLS)" },
                { v: "sftp", l: "SFTP" },
              ].map((p) => (
                <button
                  key={p.v}
                  onClick={() => update({ protocol: p.v })}
                  className={`text-[11px] py-1.5 rounded border ${form.protocol === p.v ? "border-blue-500 bg-[#111623] text-white" : "border-[#2B2B2B] bg-[#1F1F1F] text-gray-200 hover:bg-[#2B2B2B]"}`}
                  data-testid={`publish-protocol-${p.v}`}
                >{p.l}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-[1fr_100px] gap-2">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">Host</label>
              <input value={form.host} onChange={(e) => update({ host: e.target.value })} className={inputCls} placeholder="ftp.example.com" data-testid="publish-host" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">Port</label>
              <input value={form.port} onChange={(e) => update({ port: e.target.value })} className={monoCls} placeholder={form.protocol === "sftp" ? "22" : "21"} data-testid="publish-port" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">Username</label>
              <input value={form.username} onChange={(e) => update({ username: e.target.value })} className={inputCls} data-testid="publish-username" autoComplete="off" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">Password</label>
              <input type="password" value={form.password} onChange={(e) => update({ password: e.target.value })} className={inputCls} data-testid="publish-password" autoComplete="new-password" />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">Remote path</label>
            <input value={form.remote_path} onChange={(e) => update({ remote_path: e.target.value })} className={monoCls} placeholder="/public_html" data-testid="publish-path" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">HTML filename</label>
              <input value={form.html_filename} onChange={(e) => update({ html_filename: e.target.value })} className={monoCls} data-testid="publish-html-name" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">CSS filename</label>
              <input value={form.css_filename} onChange={(e) => update({ css_filename: e.target.value })} className={monoCls} data-testid="publish-css-name" />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-gray-300">
            <input type="checkbox" checked={form.include_zip} onChange={(e) => update({ include_zip: e.target.checked })} data-testid="publish-include-zip" />
            Also upload a <span className="font-mono">site.zip</span> archive
          </label>

          {result && !result.error && (
            <div className="text-[11px] rounded border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 p-2" data-testid="publish-success">
              Uploaded {result.uploaded?.length || 0} file{result.uploaded?.length === 1 ? "" : "s"} to <span className="font-mono">{result.host}{result.path}</span>
            </div>
          )}
          {result?.error && (
            <div className="text-[11px] rounded border border-red-500/40 bg-red-500/10 text-red-300 p-2" data-testid="publish-error">{result.error}</div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="text-xs px-3 py-1.5 rounded bg-[#1F1F1F] hover:bg-[#2B2B2B] text-gray-200 border border-[#2B2B2B]" data-testid="publish-cancel">Close</button>
            <button
              onClick={publish}
              disabled={busy}
              className="text-xs px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white flex items-center gap-1.5"
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
