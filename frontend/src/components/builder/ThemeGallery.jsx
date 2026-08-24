import React, { useEffect, useState } from "react";
import { themes, getSavedThemeName, saveTheme } from "@/themes";

// Theme gallery modal (View → 🎨 Themes…). Click any card to apply the
// editor skin instantly; choice persists via localStorage.
export const ThemeGallery = ({ isOpen, onClose }) => {
  const [selected, setSelected] = useState(getSavedThemeName);

  // Re-apply on mount so a reload restores the saved theme.
  useEffect(() => { saveTheme(selected); /* eslint-disable-line */ }, []);

  if (!isOpen) return null;
  const handleSelect = (key) => { setSelected(key); saveTheme(key); };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4" data-testid="theme-gallery-modal" role="dialog" aria-label="Web Dojo Themes">
      <div className="w-full max-w-3xl max-h-[80vh] overflow-y-auto rounded-lg border border-[#332D22] bg-[#1C1A15] p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[#F1EDE2]">Web Dojo Themes</h2>
          <button onClick={onClose} aria-label="Close theme gallery" data-testid="theme-gallery-close" className="text-[#A79C87] hover:text-[#F1EDE2] text-lg leading-none">✕</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Object.entries(themes).map(([key, th]) => (
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
                  boxShadow: th.effects.glow ? `inset 0 0 24px ${th.colors.accent}` : "none",
                }}
              >
                <div className="flex gap-1.5">
                  {[th.colors.primary, th.colors.secondary, th.colors.accent].map((c, i) => (
                    <span key={i} className="w-4 h-4 rounded-full border border-white/40" style={{ background: c }} />
                  ))}
                </div>
              </div>
              <div className="p-2 bg-[#242019]">
                <div className="text-xs font-semibold text-[#F1EDE2]">{th.name}</div>
                <div className="text-[10px] text-[#A79C87] mt-0.5">{th.description}</div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {th.effects.glow && <span className="text-[9px] px-1 rounded bg-[#14120E] text-[#D9BC55]">Glow</span>}
                  {th.effects.glassEffect && <span className="text-[9px] px-1 rounded bg-[#14120E] text-[#D9BC55]">Glass</span>}
                  {th.effects.beveledEdges && <span className="text-[9px] px-1 rounded bg-[#14120E] text-[#D9BC55]">Beveled</span>}
                  {th.effects.gradients && <span className="text-[9px] px-1 rounded bg-[#14120E] text-[#D9BC55]">Gradient</span>}
                </div>
              </div>
              {selected === key && (
                <div className="absolute top-2 right-2 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#C9A227] text-[#14120E]" data-testid={`theme-active-${key}`}>✓ Active</div>
              )}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-[#948C79] text-center mt-4">
          Click any theme to apply instantly — only the editor UI is skinned; your sites are unaffected.
        </p>
      </div>
    </div>
  );
};
