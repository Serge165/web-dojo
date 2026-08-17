import React, { useState } from "react";
import { CATEGORIES, cardTemplate, WEB_SAFE_FONTS } from "@/lib/blocks";
import { ChevronDown, ChevronRight, Type, Plus } from "lucide-react";

export const LeftSidebar = ({ onAddBlock, onAddFont, fonts }) => {
  const [open, setOpen] = useState({ navbars: true, heroes: true, sections: true });
  const [cardCount, setCardCount] = useState(3);
  const [gFont, setGFont] = useState("Inter");

  const toggle = (k) => setOpen((s) => ({ ...s, [k]: !s[k] }));

  const onDragStart = (e, html) => {
    e.dataTransfer.setData("text/html-block", html);
    e.dataTransfer.effectAllowed = "copy";
  };

  return (
    <aside className="w-64 flex-none border-r border-[#2B2B2B] bg-[#141414] flex flex-col overflow-hidden" data-testid="left-sidebar">
      <div className="px-3 py-2.5 border-b border-[#2B2B2B]">
        <div className="text-[10px] uppercase tracking-wider text-gray-500">Library</div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {CATEGORIES.map((cat) => (
          <div key={cat.id} className="border-b border-[#2B2B2B]">
            <button
              onClick={() => toggle(cat.id)}
              className="w-full flex items-center justify-between px-3 py-2 text-[11px] uppercase tracking-wider text-gray-300 hover:bg-[#1F1F1F]"
              data-testid={`cat-toggle-${cat.id}`}
            >
              <span>{cat.label}</span>
              {open[cat.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            {open[cat.id] && (
              <div className="px-2 pb-2 space-y-1.5">
                {cat.blocks.map((b) => (
                  <div
                    key={b.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, b.html)}
                    onDoubleClick={() => onAddBlock(b.html)}
                    className="rounded bg-[#1F1F1F] border border-[#2B2B2B] p-2 flex items-center gap-2 cursor-grab hover:border-blue-500/60 hover:bg-[#232323] transition-colors"
                    data-testid={`block-${b.id}`}
                    title="Drag to canvas or double-click to insert"
                  >
                    <div className="w-1 h-4 bg-blue-500/60 rounded-full" />
                    <span className="text-xs text-gray-200">{b.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Cards with count */}
        <div className="border-b border-[#2B2B2B]">
          <div className="px-3 py-2 text-[11px] uppercase tracking-wider text-gray-300">Cards</div>
          <div className="px-3 pb-3 space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-[11px] text-gray-500">Count</label>
              <input
                type="number"
                min={1}
                max={6}
                value={cardCount}
                onChange={(e) => setCardCount(Math.min(6, Math.max(1, Number(e.target.value) || 1)))}
                className="w-16 bg-[#0D0D0D] border border-[#2B2B2B] rounded px-2 py-1 text-xs font-mono text-white outline-none focus:border-blue-500"
                data-testid="cards-count-input"
              />
            </div>
            <button
              onClick={() => onAddBlock(cardTemplate(cardCount))}
              className="w-full text-xs py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-1"
              data-testid="cards-insert-btn"
            >
              <Plus size={12} /> Insert card row
            </button>
          </div>
        </div>

        {/* Fonts */}
        <div className="border-b border-[#2B2B2B]">
          <div className="px-3 py-2 text-[11px] uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
            <Type size={12} /> Fonts
          </div>
          <div className="px-3 pb-3 space-y-2">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">Web-safe</label>
              <select
                onChange={(e) => onAddFont({ family: e.target.value, google: false })}
                className="w-full bg-[#0D0D0D] border border-[#2B2B2B] rounded px-2 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                defaultValue=""
                data-testid="font-websafe-select"
              >
                <option value="" disabled>Choose…</option>
                {WEB_SAFE_FONTS.map((f) => <option key={f} value={f}>{f.split(",")[0]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">Google Font</label>
              <div className="flex gap-1.5">
                <input
                  value={gFont}
                  onChange={(e) => setGFont(e.target.value)}
                  placeholder="e.g. Inter"
                  className="flex-1 bg-[#0D0D0D] border border-[#2B2B2B] rounded px-2 py-1.5 text-xs text-white outline-none focus:border-blue-500"
                  data-testid="font-google-input"
                />
                <button
                  onClick={() => gFont.trim() && onAddFont({ family: gFont.trim(), google: true })}
                  className="px-2 py-1 rounded bg-[#1F1F1F] border border-[#2B2B2B] text-xs text-gray-200 hover:bg-[#2B2B2B]"
                  data-testid="font-google-add-btn"
                >Add</button>
              </div>
            </div>
            {fonts.length > 0 && (
              <div className="pt-1">
                <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Loaded</div>
                <div className="flex flex-wrap gap-1">
                  {fonts.map((f) => (
                    <span key={f} className="text-[10px] px-1.5 py-0.5 rounded bg-[#1F1F1F] border border-[#2B2B2B] text-gray-300">{f}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
