import React, { useEffect, useMemo, useRef, useState } from "react";
import { themes, getSavedThemeName, saveTheme, exportTheme, importTheme } from "@/themes";
import { toast } from "sonner";

// Theme gallery modal (View → 🎨 Themes…). Click any card to apply the
// editor skin instantly; choice persists via localStorage. Themes skin the
// ENTIRE editor UI via the chrome-token layer (src/themes/skinning.css).

const CATEGORY_LABELS = {
  "Winamp & 90s": "Winamp / 90s",
  Community: "Community",
  Aesthetic: "Aesthetic",
  Custom: "Custom",
};

const CATEGORY_ORDER = ["Winamp & 90s", "Aesthetic", "Community", "Custom"];

export const ThemeGallery = ({ isOpen, onClose }) => {
  const [selected, setSelected] = useState(getSavedThemeName);
  const [filter, setFilter] = useState("All");
  const fileRef = useRef(null);

  // Re-apply on mount so a reload restores the saved theme.
  useEffect(() => { saveTheme(selected); /* eslint-disable-line */ }, []);

  const grouped = useMemo(() => {
    const cats = {};
    Object.entries(themes).forEach(([key, th]) => {
      const c = (th && th.category) || "Community";
      (cats[c] = cats[c] || []).push({ key, th });
    });
    return cats;
  }, []);

  if (!isOpen) return null;
  const handleSelect = (key) => { setSelected(key); saveTheme(key); toast.success(`${themes[key]?.name || key} applied`); };

  const handleImport = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const key = importTheme(await f.text());
      toast.success(`Imported “${themes[key]?.name || key}”`);
    } catch (err) {
      toast.error(err.message || "Import failed");
    }
    e.target.value = "";
  };

  const chips = ["All", ...CATEGORY_ORDER.filter((c) => (grouped[c] || []).length)];

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4" data-testid="theme-gallery-modal" role="dialog" aria-label="Web Dojo Themes">
      <div className="w-full max-w-3xl max-h-[80vh] overflow-y-auto rounded-lg border border-[#332D22] bg-[#1C1A15] p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[#F1EDE2]">Web Dojo Themes</h2>
          <button onClick={onClose} aria-label="Close theme gallery" data-testid="theme-gallery-close" className="text-[#A79C87] hover:text-[#F1EDE2] text-lg leading-none">✕</button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          {chips.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors ${filter === c ? "border-[#C9A227] bg-[#2A2416] text-[#F1EDE2]" : "border-[#332D22] bg-[#15130E] text-[#A79C87] hover:border-[#C9A227]/60"}`}
              data-testid={`theme-filter-${c.toLowerCase().replace(/\W+/g, "-")}`}
            >{c}</button>
          ))}
          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={() => exportTheme(selected)}
              className="text-[10px] px-2 py-1 rounded border border-[#332D22] bg-[#242019] text-[#E4DECE] hover:bg-[#332D22]"
              data-testid="theme-export"
            >Export current</button>
            <button
              onClick={() => fileRef.current?.click()}
              className="text-[10px] px-2 py-1 rounded border border-[#332D22] bg-[#242019] text-[#E4DECE] hover:bg-[#332D22]"
              data-testid="theme-import"
            >Import…</button>
            <input ref={fileRef} type="file" accept="application/json,.json" onChange={handleImport} className="hidden" data-testid="theme-import-input" />
          </div>
        </div>

        {CATEGORY_ORDER.filter((c) => filter === "All" || filter === c).map((cat) => {
          const items = grouped[cat] || [];
          if (!items.length) return null;
          return (
            <div key={cat} className="mb-4">
              <div className="text-[10px] uppercase tracking-widest text-[#948C79] mb-2">{CATEGORY_LABELS[cat] || cat}</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {items.map(({ key, th }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelect(key)}
                    className={`relative rounded-lg overflow-hidden border text-left transition-transform hover:-translate-y-0.5 ${selected === key ? "border-[#C9A227]" : "border-[#332D22] hover:border-[#C9A227]/50"}`}
                    data-testid={`theme-card-${key}`}
                  >
                    <div
                      className="h-20 flex items-end justify-center pb-2"
                      style={{
                        background: `linear-gradient(135deg, ${th.colors.primary}, ${th.colors.background})`,
                        boxShadow: th.effects && th.effects.glow ? `inset 0 0 24px ${th.colors.accent}` : "none",
                      }}
                    >
                      <div className="flex gap-1.5">
                        {[th.colors.primary, th.colors.secondary, th.colors.accent].map((cc, i) => (
                          <span key={i} className="w-4 h-4 rounded-full border border-white/40" style={{ background: cc }} />
                        ))}
                      </div>
                    </div>
                    <div className="p-2 bg-[#242019]">
                      <div className="text-xs font-semibold text-[#F1EDE2]">{th.name}</div>
                      <div className="text-[10px] text-[#A79C87] mt-0.5">{th.description}</div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {th.effects && th.effects.glow && <span className="text-[9px] px-1 rounded bg-[#14120E] text-[#D9BC55]">Glow</span>}
                        {th.effects && th.effects.glassEffect && <span className="text-[9px] px-1 rounded bg-[#14120E] text-[#D9BC55]">Glass</span>}
                        {th.effects && th.effects.beveledEdges && <span className="text-[9px] px-1 rounded bg-[#14120E] text-[#D9BC55]">Beveled</span>}
                        {th.effects && th.effects.gradients && <span className="text-[9px] px-1 rounded bg-[#14120E] text-[#D9BC55]">Gradient</span>}
                      </div>
                    </div>
                    {selected === key && (
                      <div className="absolute top-2 right-2 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#C9A227] text-[#14120E]" data-testid={`theme-active-${key}`}>✓ Active</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        <p className="text-[11px] text-[#948C79] text-center mt-4">
          Themes skin the entire editor UI — left/right sidebars, inspector, menus, status bar, modals and dropdowns. Your exported sites are unaffected.
        </p>
      </div>
    </div>
  );
};
