import React, { useState } from "react";
import { ColorPicker } from "./ColorPicker";
import { GradientMixer } from "./GradientMixer";

export const RightSidebar = ({ selected, onApplyBackground, onApplyColor, canvasBg, onCanvasBg }) => {
  const [tab, setTab] = useState("color");

  return (
    <aside className="w-80 flex-none border-l border-[#2B2B2B] bg-[#141414] flex flex-col overflow-hidden" data-testid="right-sidebar">
      <div className="px-3 py-2.5 border-b border-[#2B2B2B] flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-wider text-gray-500">Inspector</div>
        <div className="text-[10px] font-mono text-gray-500 truncate max-w-[160px]">
          {selected ? selected.id : "no selection"}
        </div>
      </div>

      <div className="flex border-b border-[#2B2B2B] text-xs">
        {[
          { id: "color", label: "Color" },
          { id: "gradient", label: "Gradient" },
          { id: "page", label: "Page" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 ${tab === t.id ? "text-white border-b-2 border-blue-500" : "text-gray-400 hover:text-gray-200"}`}
            data-testid={`insp-tab-${t.id}`}
          >{t.label}</button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {tab === "color" && (
          <div className="space-y-3">
            <ColorPicker
              value="#2563eb"
              alpha={1}
              onChange={({ hex, alpha, rgba }) => {
                // updates happen via the Apply buttons below to be predictable
                setLastColor({ hex, alpha, rgba });
              }}
            />
            <ColorActions
              onApplyBackground={onApplyBackground}
              onApplyColor={onApplyColor}
              disabled={!selected}
            />
            {!selected && <div className="text-[11px] text-gray-500">Select an element on the canvas to apply.</div>}
          </div>
        )}

        {tab === "gradient" && (
          <GradientMixer
            onApply={(gradient) => selected && onApplyBackground(gradient)}
          />
        )}

        {tab === "page" && (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">Canvas background</label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={canvasBg || "#ffffff"}
                  onChange={(e) => onCanvasBg(e.target.value)}
                  className="w-10 h-8 bg-transparent border border-[#2B2B2B] rounded"
                  data-testid="canvas-bg-color"
                />
                <input
                  value={canvasBg || "#ffffff"}
                  onChange={(e) => onCanvasBg(e.target.value)}
                  className="flex-1 bg-[#0D0D0D] border border-[#2B2B2B] rounded px-2 py-1.5 text-xs font-mono text-white outline-none focus:border-blue-500"
                  data-testid="canvas-bg-input"
                />
              </div>
            </div>
            <p className="text-[11px] text-gray-500">Applies to the exported &lt;body&gt; background.</p>
          </div>
        )}
      </div>
    </aside>
  );
};

// The last picked color is stored inside the tab so Apply-buttons can use it.
let _lastColor = { hex: "#2563eb", alpha: 1, rgba: "rgba(37, 99, 235, 1)" };
const setLastColor = (c) => { _lastColor = c; };

const ColorActions = ({ onApplyBackground, onApplyColor, disabled }) => (
  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#2B2B2B]">
    <button
      disabled={disabled}
      onClick={() => onApplyBackground(_lastColor.rgba)}
      className="text-xs py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 disabled:cursor-not-allowed"
      data-testid="apply-bg-btn"
    >Apply background</button>
    <button
      disabled={disabled}
      onClick={() => onApplyColor(_lastColor.rgba)}
      className="text-xs py-1.5 rounded bg-[#1F1F1F] hover:bg-[#2B2B2B] text-gray-200 border border-[#2B2B2B] disabled:opacity-40 disabled:cursor-not-allowed"
      data-testid="apply-color-btn"
    >Apply text color</button>
  </div>
);
