import React, { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { X, Save, KeyRound } from "lucide-react";

const API = process.env.REACT_APP_BACKEND_URL || "";

const PLATFORMS = [
  { id: "facebook", label: "Facebook", fields: ["token", "page_id"] },
  { id: "instagram", label: "Instagram", fields: ["token", "user_id"] },
  { id: "x", label: "X (Twitter)", fields: ["token", "user_id"] },
  { id: "tiktok", label: "TikTok", fields: ["token", "user_id"] },
  { id: "linkedin", label: "LinkedIn", fields: ["token", "company_id"] },
  { id: "youtube", label: "YouTube", fields: ["token", "channel_id"] },
];

const inputCls = "w-full bg-[#15130E] border border-[#332D22] rounded px-3 py-2 text-sm text-[#F1EDE2] outline-none focus:border-[#C9A227]";
const labelCls = "text-[10px] uppercase tracking-wider text-[#948C79] block mb-1";
const btnPrimary = "text-xs py-1.5 px-3 rounded bg-[#AD8B21] hover:bg-[#C9A227] text-[#F1EDE2]";

export const SocialConnectModal = ({ open, onClose, projectId, token }) => {
  const [config, setConfig] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const setField = (platform, field, value) => {
    setConfig((prev) => ({
      ...prev,
      [platform]: { ...(prev[platform] || {}), [field]: value },
    }));
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/${projectId}/social-config`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Dashboard-Token": token,
        },
        body: JSON.stringify({ config }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => onClose(), 800);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#1C1A15] border-[#332D22] max-w-2xl" data-testid="social-connect-modal">
        <DialogTitle className="text-[#F1EDE2] flex items-center gap-2">
          <KeyRound size={16} className="text-[#C9A227]" />
          Connect Social Platforms
        </DialogTitle>
        <div className="space-y-4 mt-4">
          {PLATFORMS.map((p) => (
            <div key={p.id} className="border border-[#332D22] rounded p-3" data-testid={`social-platform-${p.id}`}>
              <div className="text-sm font-medium text-[#F1EDE2] mb-2">{p.label}</div>
              <div className="grid grid-cols-2 gap-2">
                {p.fields.map((f) => (
                  <div key={f}>
                    <label className={labelCls}>{f.replace(/_/g, " ")}</label>
                    <input
                      type={f === "token" ? "password" : "text"}
                      value={config[p.id]?.[f] || ""}
                      onChange={(e) => setField(p.id, f, e.target.value)}
                      className={inputCls}
                      placeholder={f === "token" ? "API token" : `Enter ${f.replace(/_/g, " ")}`}
                      data-testid={`social-${p.id}-${f}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="text-xs py-1.5 px-3 rounded bg-[#242019] hover:bg-[#332D22] text-[#F1EDE2] border border-[#332D22]">
              <X size={12} className="inline mr-1" />Cancel
            </button>
            <button onClick={save} className={btnPrimary} data-testid="social-save">
              <Save size={12} className="inline mr-1" />
              {saving ? "Saving..." : saved ? "Saved!" : "Save Keys"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};