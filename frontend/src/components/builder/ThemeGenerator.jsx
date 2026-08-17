import React, { useState } from "react";
import { THEMES, themeHeadHtml, buildCustomThemeHead } from "@/lib/themes";
import { Copy } from "lucide-react";
import { toast } from "sonner";

export const ThemeGenerator = ({ onApplyTheme }) => {
  const [tab, setTab] = useState("presets");
  const [custom, setCustom] = useState({
    primary: "#2563eb",
    accent: "#f59e0b",
    text: "#0f172a",
    bg: "#ffffff",
    muted: "#64748b",
    border: "#e5e7eb",
    font: "'Inter', ui-sans-serif, sans-serif",
    googleFont: "Inter",
  });

  const customCss = buildCustomThemeHead(custom);

  return (
    <div className="space-y-3" data-testid="theme-generator">
      <div className="flex bg-[#0D0D0D] border border-[#2B2B2B] rounded-md p-0.5 text-xs">
        <button
          onClick={() => setTab("presets")}
          className={`flex-1 py-1 rounded ${tab === "presets" ? "bg-[#1F1F1F] text-white" : "text-gray-400 hover:text-gray-200"}`}
          data-testid="theme-tab-presets"
        >Aesthetics</button>
        <button
          onClick={() => setTab("custom")}
          className={`flex-1 py-1 rounded ${tab === "custom" ? "bg-[#1F1F1F] text-white" : "text-gray-400 hover:text-gray-200"}`}
          data-testid="theme-tab-custom"
        >Custom</button>
      </div>

      {tab === "presets" && (
        <div className="grid grid-cols-1 gap-2">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => { onApplyTheme({ headHtml: themeHeadHtml(t), canvasBg: t.canvas_bg, googleFont: t.google_font }); toast.success(`Applied ${t.name}`); }}
              className="flex items-center gap-3 p-2 rounded border border-[#2B2B2B] bg-[#0D0D0D] hover:border-blue-500/60 text-left"
              data-testid={`theme-preset-${t.id}`}
            >
              <div className="flex -space-x-1">
                {t.swatch.map((c, i) => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-[#141414]" style={{ background: c }} />
                ))}
              </div>
              <div className="flex-1">
                <div className="text-xs text-white">{t.name}</div>
                <div className="text-[10px] text-gray-500 font-mono truncate">{t.google_font} · {t.font.split(",")[0].replace(/['"]/g, "")}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {tab === "custom" && (
        <div className="space-y-2" data-testid="theme-custom">
          {[
            { key: "primary", label: "Primary" },
            { key: "accent", label: "Accent" },
            { key: "text", label: "Text" },
            { key: "bg", label: "Background" },
            { key: "muted", label: "Muted" },
            { key: "border", label: "Border" },
          ].map((row) => (
            <div key={row.key} className="grid grid-cols-[80px_36px_1fr] gap-2 items-center">
              <label className="text-[10px] uppercase tracking-wider text-gray-500">{row.label}</label>
              <input
                type="color"
                value={custom[row.key]}
                onChange={(e) => setCustom((c) => ({ ...c, [row.key]: e.target.value }))}
                className="w-9 h-7 bg-transparent border border-[#2B2B2B] rounded"
                data-testid={`theme-custom-${row.key}`}
              />
              <input
                value={custom[row.key]}
                onChange={(e) => setCustom((c) => ({ ...c, [row.key]: e.target.value }))}
                className="bg-[#0D0D0D] border border-[#2B2B2B] rounded px-2 py-1 text-[11px] font-mono text-white outline-none focus:border-blue-500"
              />
            </div>
          ))}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">Google font family</label>
            <input
              value={custom.googleFont}
              onChange={(e) => setCustom((c) => ({ ...c, googleFont: e.target.value, font: `'${e.target.value}', ui-sans-serif, sans-serif` }))}
              className="w-full bg-[#0D0D0D] border border-[#2B2B2B] rounded px-2 py-1.5 text-xs text-white outline-none focus:border-blue-500"
              data-testid="theme-custom-font"
            />
          </div>
          <pre className="text-[10px] font-mono text-gray-300 whitespace-pre-wrap bg-[#0D0D0D] border border-[#2B2B2B] rounded p-2 max-h-40 overflow-auto" data-testid="theme-custom-css">{customCss}</pre>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { navigator.clipboard.writeText(customCss); toast.success("Theme CSS copied"); }}
              className="text-xs py-1.5 rounded bg-[#1F1F1F] hover:bg-[#2B2B2B] text-gray-200 border border-[#2B2B2B] flex items-center justify-center gap-1"
              data-testid="theme-custom-copy"
            ><Copy size={12} /> Copy CSS</button>
            <button
              onClick={() => { onApplyTheme({ headHtml: customCss, canvasBg: custom.bg, googleFont: custom.googleFont }); toast.success("Theme applied"); }}
              className="text-xs py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white"
              data-testid="theme-custom-apply"
            >Apply theme</button>
          </div>
        </div>
      )}
    </div>
  );
};
