import React, { useState } from "react";
import { THEMES, themeHeadHtml, buildCustomThemeHead } from "@/lib/themes";
import { Copy } from "lucide-react";
import { toast } from "sonner";

// Lazily inject a theme's Google font so the hover preview renders in the real
// typeface (only fires once per family, and only when a card is hovered).
const loadedFonts = new Set();
const ensureFont = (family) => {
  if (!family || loadedFonts.has(family)) return;
  loadedFonts.add(family);
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@400;600;800&display=swap`;
  document.head.appendChild(l);
};

const hexLum = (c) => {
  const m = /^#?([0-9a-f]{6})$/i.exec((c || "").trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
};
const onColor = (c) => { const l = hexLum(c); return l == null ? "#ffffff" : l > 0.6 ? "#111111" : "#ffffff"; };

// A tiny live mock landing page rendered in the theme's own palette + font.
const MiniThemePreview = ({ t }) => {
  const c = t.colors;
  const text = c["--fc-text"], muted = c["--fc-muted"], primary = c["--fc-primary"];
  const accent = c["--fc-accent"], surface = c["--fc-surface"], border = c["--fc-border"];
  const bar = (w, col, op = 1) => `<div style="width:${w};height:4px;border-radius:3px;background:${col};opacity:${op};margin-top:4px"></div>`;
  const card = (top) => `<div style="flex:1;background:${surface};border:1px solid ${border};border-radius:6px;padding:7px"><div style="width:60%;height:5px;border-radius:3px;background:${top}"></div>${bar("92%", muted, 0.5)}${bar("74%", muted, 0.5)}</div>`;
  const html = `
    <div style="background:${surface};border-bottom:1px solid ${border};display:flex;align-items:center;gap:7px;padding:8px 10px">
      <div style="width:10px;height:10px;border-radius:50%;background:${primary}"></div>
      <div style="font-size:9px;font-weight:700;color:${text}">Brand</div>
      <div style="margin-left:auto;display:flex;gap:9px;font-size:8px;color:${muted}"><span>Home</span><span>About</span></div>
    </div>
    <div style="padding:14px 12px">
      <div style="font-size:16px;font-weight:800;line-height:1.05;color:${text}">Make it yours.</div>
      <div style="font-size:8.5px;color:${muted};margin-top:5px;line-height:1.4">A quick taste of this aesthetic — its colours, type &amp; buttons.</div>
      <div style="display:flex;gap:6px;margin-top:10px">
        <div style="font-size:8px;font-weight:700;color:${onColor(primary)};background:${primary};border-radius:6px;padding:5px 11px">Get started</div>
        <div style="font-size:8px;font-weight:700;color:${accent};border:1px solid ${accent};border-radius:6px;padding:5px 11px">Learn more</div>
      </div>
    </div>
    <div style="padding:0 12px 12px;display:flex;gap:6px">${card(primary)}${card(accent)}</div>`;
  return (
    <div
      className="rounded-lg overflow-hidden shadow-2xl ring-1 ring-black/50"
      style={{ width: 264, background: t.canvas_bg, fontFamily: t.font }}
      data-testid={`theme-preview-${t.id}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export const ThemeGenerator = ({ onApplyTheme }) => {
  const [tab, setTab] = useState("presets");
  const [preview, setPreview] = useState(null);
  const [allPages, setAllPages] = useState(true);
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
      <div className="flex bg-[#15130E] border border-[#332D22] rounded-md p-0.5 text-xs">
        <button
          onClick={() => setTab("presets")}
          className={`flex-1 py-1 rounded ${tab === "presets" ? "bg-[#242019] text-[#F1EDE2]" : "text-[#A79C87] hover:text-[#F1EDE2]"}`}
          data-testid="theme-tab-presets"
        >Aesthetics</button>
        <button
          onClick={() => setTab("custom")}
          className={`flex-1 py-1 rounded ${tab === "custom" ? "bg-[#242019] text-[#F1EDE2]" : "text-[#A79C87] hover:text-[#F1EDE2]"}`}
          data-testid="theme-tab-custom"
        >Custom</button>
      </div>

      <label className="flex items-center gap-2 text-[11px] text-[#A79C87] select-none px-0.5" data-testid="theme-scope-toggle">
        <input
          type="checkbox"
          checked={allPages}
          onChange={(e) => setAllPages(e.target.checked)}
          className="accent-[#AD8B21] w-3.5 h-3.5"
        />
        Apply to all pages
      </label>

      {tab === "presets" && (
        <div className="grid grid-cols-1 gap-2">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => { onApplyTheme({ headHtml: themeHeadHtml(t), canvasBg: t.canvas_bg, googleFont: t.google_font, allPages }); toast.success(allPages ? `Applied ${t.name} to all pages` : `Applied ${t.name}`); }}
              onMouseEnter={(e) => {
                ensureFont(t.google_font);
                const r = e.currentTarget.getBoundingClientRect();
                const left = Math.max(8, r.left - 264 - 14);
                const top = Math.min(Math.max(8, r.top - 24), window.innerHeight - 236);
                setPreview({ t, top, left });
              }}
              onMouseLeave={() => setPreview(null)}
              className="flex items-center gap-3 p-2 rounded border border-[#332D22] bg-[#15130E] hover:border-[#C9A227]/60 text-left"
              data-testid={`theme-preset-${t.id}`}
            >
              <div className="flex -space-x-1">
                {t.swatch.map((c, i) => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-[#1C1A15]" style={{ background: c }} />
                ))}
              </div>
              <div className="flex-1">
                <div className="text-xs text-[#F1EDE2]">{t.name}</div>
                <div className="text-[10px] text-[#948C79] font-mono truncate">{t.google_font} · {t.font.split(",")[0].replace(/['"]/g, "")}</div>
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
              <label className="text-[10px] uppercase tracking-wider text-[#948C79]">{row.label}</label>
              <input
                type="color"
                value={custom[row.key]}
                onChange={(e) => setCustom((c) => ({ ...c, [row.key]: e.target.value }))}
                className="w-9 h-7 bg-transparent border border-[#332D22] rounded"
                data-testid={`theme-custom-${row.key}`}
              />
              <input
                value={custom[row.key]}
                onChange={(e) => setCustom((c) => ({ ...c, [row.key]: e.target.value }))}
                className="bg-[#15130E] border border-[#332D22] rounded px-2 py-1 text-[11px] font-mono text-[#F1EDE2] outline-none focus:border-[#C9A227]"
              />
            </div>
          ))}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-[#948C79] block mb-1">Google font family</label>
            <input
              value={custom.googleFont}
              onChange={(e) => setCustom((c) => ({ ...c, googleFont: e.target.value, font: `'${e.target.value}', ui-sans-serif, sans-serif` }))}
              className="w-full bg-[#15130E] border border-[#332D22] rounded px-2 py-1.5 text-xs text-[#F1EDE2] outline-none focus:border-[#C9A227]"
              data-testid="theme-custom-font"
            />
          </div>
          <pre className="text-[10px] font-mono text-[#E4DECE] whitespace-pre-wrap bg-[#15130E] border border-[#332D22] rounded p-2 max-h-40 overflow-auto" data-testid="theme-custom-css">{customCss}</pre>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { navigator.clipboard.writeText(customCss); toast.success("Theme CSS copied"); }}
              className="text-xs py-1.5 rounded bg-[#242019] hover:bg-[#332D22] text-[#F1EDE2] border border-[#332D22] flex items-center justify-center gap-1"
              data-testid="theme-custom-copy"
            ><Copy size={12} /> Copy CSS</button>
            <button
              onClick={() => { onApplyTheme({ headHtml: customCss, canvasBg: custom.bg, googleFont: custom.googleFont, allPages }); toast.success(allPages ? "Theme applied to all pages" : "Theme applied"); }}
              className="text-xs py-1.5 rounded bg-[#AD8B21] hover:bg-[#C9A227] text-[#F1EDE2]"
              data-testid="theme-custom-apply"
            >Apply theme</button>
          </div>
        </div>
      )}

      {preview && (
        <div className="fixed z-[9999] pointer-events-none" style={{ top: preview.top, left: preview.left }} data-testid="theme-hover-preview">
          <MiniThemePreview t={preview.t} />
        </div>
      )}
    </div>
  );
};
