import React, { useState } from "react";
import { ColorPicker } from "./ColorPicker";
import { TokenSelector } from "./TokenSelector";
import { GradientMixer } from "./GradientMixer";
import { PatternPanel } from "./PatternPanel";
import { SvgBackgroundPanel } from "./SvgBackgroundPanel";
import { StyleInspector } from "./StyleInspector";
import { ResponsivePanel } from "./ResponsivePanel";
import { VariantPanel } from "./VariantPanel";
import { LayersPanel } from "./LayersPanel";
import { ShapePanel } from "./ShapePanel";
import { DividerPanel } from "./DividerPanel";
import { TextEffectsPanel } from "./TextEffectsPanel";
import { BackgroundMediaPanel } from "./BackgroundMediaPanel";
import { BlendPanel } from "./BlendPanel";
import { AnimationGenerator } from "./AnimationGenerator";
import { ThemeGenerator } from "./ThemeGenerator";
import { CDNPanel } from "./CDNPanel";
import { Layers as LayersIcon, ChevronDown, ChevronRight } from "lucide-react";

const TABS = [
  { id: "color", label: "Color" },
  { id: "tokens", label: "Tokens" },
  { id: "gradient", label: "Gradient" },
  { id: "pattern", label: "Pattern" },
  { id: "svgbg", label: "SVG BG" },
  { id: "style", label: "Style" },
  { id: "responsive", label: "Responsive" },
  { id: "variants", label: "Variants" },
  { id: "shape", label: "Shape" },
  { id: "bg", label: "BG" },
  { id: "blend", label: "Blend" },
  { id: "divider", label: "Divider" },
  { id: "anim", label: "Motion" },
  { id: "textfx", label: "Text FX" },
  { id: "theme", label: "Theme" },
  { id: "cdn", label: "CDN" },
  { id: "page", label: "Page" },
];

export const RightSidebar = ({
  selected,
  onApplyBackground,
  onApplyColor,
  onPatchStyle,
  onReplaceHtml,
  onApplyAnimation,
  onApplyTheme,
  canvasBg,
  onCanvasBg,
  headHtml,
  onHeadHtmlChange,
  onAddBlock,
  elements,
  selectedId,
  onSelect,
  onMove,
  onDelete,
  onToggleVisible,
  onSetZIndex,
  onApplyStyleToIds,
  onApplyAnimationToIds,
  onApplyToken,
  onCreateToken,
  viewport,
  onPatchResponsive,
  onResetResponsive,
}) => {
  const [tab, setTab] = useState("color");
  const [layersOpen, setLayersOpen] = useState(true);
  const [lastColor, setLastColor] = useState({ hex: "#2563eb", alpha: 1, rgba: "rgba(37, 99, 235, 1)" });

  return (
    <aside className="w-80 flex-none border-l border-[#332D22] bg-[#1C1A15] flex flex-col overflow-hidden" data-testid="right-sidebar">
      <div className="px-3 py-2.5 border-b border-[#332D22] flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-wider text-[#948C79]">Inspector</div>
        <div className="text-[10px] font-mono text-[#948C79] truncate max-w-[160px]">
          {selected ? selected.id : "no selection"}
        </div>
      </div>

      <div className="grid grid-cols-4 border-b border-[#332D22] text-[11px]">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`py-2 ${tab === t.id ? "text-[#F1EDE2] bg-[#242019]" : "text-[#A79C87] hover:text-[#F1EDE2]"}`}
            data-testid={`insp-tab-${t.id}`}
          >{t.label}</button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {tab === "color" && (
          <div className="space-y-3">
            <ColorPicker
              value={lastColor.hex}
              alpha={lastColor.alpha}
              onChange={({ hex, alpha, rgba }) => setLastColor({ hex, alpha, rgba })}
            />
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#332D22]">
              <button
                disabled={!selected}
                onClick={() => onApplyBackground(lastColor.rgba)}
                className="text-xs py-1.5 rounded bg-[#AD8B21] hover:bg-[#C9A227] text-[#F1EDE2] disabled:opacity-40 disabled:cursor-not-allowed"
                data-testid="apply-bg-btn"
              >Apply background</button>
              <button
                disabled={!selected}
                onClick={() => onApplyColor(lastColor.rgba)}
                className="text-xs py-1.5 rounded bg-[#242019] hover:bg-[#332D22] text-[#F1EDE2] border border-[#332D22] disabled:opacity-40 disabled:cursor-not-allowed"
                data-testid="apply-color-btn"
              >Apply text color</button>
            </div>
            {!selected && <div className="text-[11px] text-[#948C79]">Select an element on the canvas to apply.</div>}
          </div>
        )}

        {tab === "tokens" && (
          <TokenSelector
            headHtml={headHtml}
            elements={elements}
            selected={selected}
            onApplyToken={onApplyToken}
            onCreateToken={onCreateToken}
          />
        )}

        {tab === "gradient" && (
          <GradientMixer onApply={(g) => selected && onApplyBackground(g)} />
        )}

        {tab === "pattern" && (
          <PatternPanel onApply={(g) => selected && onApplyBackground(g)} />
        )}

        {tab === "svgbg" && (
          <SvgBackgroundPanel onApply={(g) => selected && onApplyBackground(g)} />
        )}

        {tab === "style" && (
          <StyleInspector selected={selected} onPatch={onPatchStyle} onReplaceHtml={onReplaceHtml} />
        )}

        {tab === "responsive" && (
          <ResponsivePanel selected={selected} viewport={viewport} onPatch={onPatchResponsive} onReset={onResetResponsive} />
        )}

        {tab === "variants" && (
          <VariantPanel selected={selected} onReplaceHtml={onReplaceHtml} />
        )}

        {tab === "bg" && (
          <BackgroundMediaPanel selected={selected} onPatch={onPatchStyle} onReplaceHtml={onReplaceHtml} onAddBlock={onAddBlock} />
        )}

        {tab === "blend" && (
          <BlendPanel selected={selected} onPatch={onPatchStyle} onReplaceHtml={onReplaceHtml} />
        )}

        {tab === "shape" && (
          <ShapePanel selected={selected} onPatch={onPatchStyle} />
        )}

        {tab === "divider" && (
          <DividerPanel onAddBlock={onAddBlock} elements={elements} selectedId={selectedId} />
        )}

        {tab === "textfx" && (
          <TextEffectsPanel
            selected={selected}
            onPatch={onPatchStyle}
            onApplyAnimation={onApplyAnimation}
            onReplaceHtml={onReplaceHtml}
            headHtml={headHtml}
            onHeadHtmlChange={onHeadHtmlChange}
          />
        )}

        {tab === "anim" && (
          <AnimationGenerator selected={selected} onApplyAnimation={onApplyAnimation} />
        )}

        {tab === "cdn" && (
          <CDNPanel headHtml={headHtml} onHeadHtmlChange={onHeadHtmlChange} />
        )}

        {tab === "theme" && (
          <ThemeGenerator onApplyTheme={onApplyTheme} />
        )}

        {tab === "page" && (
          <div className="space-y-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[#948C79] block mb-1">Canvas background</label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={/^#[0-9a-f]{6}$/i.test(canvasBg || "") ? canvasBg : "#ffffff"}
                  onChange={(e) => onCanvasBg(e.target.value)}
                  className="w-10 h-8 bg-transparent border border-[#332D22] rounded"
                  data-testid="canvas-bg-color"
                />
                <input
                  value={canvasBg || "#ffffff"}
                  onChange={(e) => onCanvasBg(e.target.value)}
                  className="flex-1 bg-[#15130E] border border-[#332D22] rounded px-2 py-1.5 text-xs font-mono text-[#F1EDE2] outline-none focus:border-[#C9A227]"
                  data-testid="canvas-bg-input"
                />
              </div>
            </div>
            <p className="text-[11px] text-[#948C79]">Applies to the exported &lt;body&gt; background. You can also paste a CSS gradient string.</p>
          </div>
        )}
      </div>

      {/* Docked Layers palette (GIMP/Photoshop-style) — always available */}
      <div className="flex-none border-t border-[#332D22] flex flex-col" data-testid="layers-dock" style={{ maxHeight: "42%" }}>
        <button
          onClick={() => setLayersOpen((o) => !o)}
          className="flex items-center justify-between px-3 py-2 text-[10px] uppercase tracking-wider text-[#A79C87] hover:text-[#F1EDE2] flex-none"
          data-testid="layers-dock-toggle"
        >
          <span className="flex items-center gap-1.5"><LayersIcon size={12} /> Layers · {elements.length}</span>
          {layersOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>
        {layersOpen && (
          <div className="overflow-y-auto px-3 pb-3">
            <LayersPanel
              elements={elements}
              selectedId={selectedId}
              onSelect={onSelect}
              onMove={onMove}
              onDelete={onDelete}
              onToggleVisible={onToggleVisible}
              onSetZIndex={onSetZIndex}
              onApplyStyleToIds={onApplyStyleToIds}
              onApplyAnimationToIds={onApplyAnimationToIds}
              hideHeader
            />
          </div>
        )}
      </div>
    </aside>
  );
};
