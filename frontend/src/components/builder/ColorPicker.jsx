import React, { useMemo } from "react";
import { hexToRgb, rgbToHex, rgbToHsl, hslToRgb, rgbaString, clamp } from "@/lib/color";

// Photoshop/Illustrator-style color picker (SV square + hue slider + alpha).
export const ColorPicker = ({ value = "#2563eb", alpha = 1, onChange }) => {
  const rgb = useMemo(() => hexToRgb(value), [value]);
  const hsl = useMemo(() => rgbToHsl(rgb), [rgb]);
  const hue = hsl.h;

  const emit = (hex, a) => onChange && onChange({ hex, alpha: a, rgba: rgbaString({ ...hexToRgb(hex), a }) });

  const updateFromHex = (v) => {
    const h = v.startsWith("#") ? v : `#${v}`;
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(h)) emit(h, alpha);
  };

  const updateFromRgb = (key, num) => {
    const next = { ...rgb, [key]: clamp(Number(num) || 0, 0, 255) };
    emit(rgbToHex(next), alpha);
  };

  const updateFromHsl = (key, num) => {
    const nextHsl = { ...hsl, [key]: Number(num) || 0 };
    const nextRgb = hslToRgb(nextHsl);
    emit(rgbToHex(nextRgb), alpha);
  };

  // SV square: saturation-x, lightness-y
  const handleSquareClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    const y = clamp((e.clientY - rect.top) / rect.height, 0, 1);
    const s = Math.round(x * 100);
    const l = Math.round((1 - y) * 100);
    const nextRgb = hslToRgb({ h: hue, s, l });
    emit(rgbToHex(nextRgb), alpha);
  };

  const svBg = `linear-gradient(to right, hsl(${hue},0%,50%), hsl(${hue},100%,50%))`;
  const svOverlay = "linear-gradient(to top, #000, transparent 50%, #fff)";

  return (
    <div className="space-y-3" data-testid="color-picker">
      <div
        role="button"
        tabIndex={0}
        onClick={handleSquareClick}
        className="relative w-full h-40 rounded-md border border-[#2B2B2B] cursor-crosshair"
        style={{ background: svBg }}
        data-testid="color-sv-square"
      >
        <div className="absolute inset-0 rounded-md" style={{ background: svOverlay }} />
        <div
          className="absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full border-2 border-white shadow"
          style={{ left: `${hsl.s}%`, top: `${100 - hsl.l}%`, background: value }}
        />
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">Hue</label>
        <input
          type="range"
          min={0}
          max={360}
          value={hue}
          onChange={(e) => {
            const nextRgb = hslToRgb({ h: Number(e.target.value), s: hsl.s || 80, l: hsl.l || 50 });
            emit(rgbToHex(nextRgb), alpha);
          }}
          className="w-full h-2 rounded appearance-none"
          style={{ background: "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)" }}
          data-testid="color-hue-slider"
        />
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">Alpha</label>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(alpha * 100)}
          onChange={(e) => emit(value, Number(e.target.value) / 100)}
          className="w-full h-2 rounded appearance-none bg-gradient-to-r from-transparent to-white"
          data-testid="color-alpha-slider"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">Hex</label>
          <input
            value={alpha < 1 ? rgbToHex({ ...rgb, a: alpha }) : value}
            onChange={(e) => updateFromHex(e.target.value)}
            className="w-full bg-[#0D0D0D] border border-[#2B2B2B] rounded-md px-2 py-1.5 text-xs font-mono text-white focus:border-blue-500 outline-none"
            data-testid="color-hex-input"
          />
        </div>
        <div className="flex items-end">
          <div className="w-full h-8 rounded-md border border-[#2B2B2B]" style={{ background: rgbaString({ ...rgb, a: alpha }) }} data-testid="color-swatch" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {["r", "g", "b"].map((k) => (
          <div key={k}>
            <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">{k.toUpperCase()}</label>
            <input
              type="number"
              min={0}
              max={255}
              value={rgb[k]}
              onChange={(e) => updateFromRgb(k, e.target.value)}
              className="w-full bg-[#0D0D0D] border border-[#2B2B2B] rounded-md px-2 py-1 text-xs font-mono text-white focus:border-blue-500 outline-none"
              data-testid={`color-${k}-input`}
            />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {["h", "s", "l"].map((k) => (
          <div key={k}>
            <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">{k.toUpperCase()}</label>
            <input
              type="number"
              min={0}
              max={k === "h" ? 360 : 100}
              value={hsl[k]}
              onChange={(e) => updateFromHsl(k, e.target.value)}
              className="w-full bg-[#0D0D0D] border border-[#2B2B2B] rounded-md px-2 py-1 text-xs font-mono text-white focus:border-blue-500 outline-none"
              data-testid={`color-${k}-input`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
