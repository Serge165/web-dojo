import React, { useMemo, useState } from "react";
import { Rows, Columns, LayoutGrid, Plus, Trash2 } from "lucide-react";

// Dreamweaver-inspired grid & flex builder. Assembles a container element
// with the chosen layout and any number of child cells, then inserts the
// raw HTML onto the canvas via onAddBlock.

const trackStr = (tracks) =>
  tracks
    .map((t) => (t.unit === "auto" ? "auto" : `${t.value}${t.unit}`))
    .join(" ");

const cellHtml = (i, bg) =>
  `  <div style="min-height:80px;padding:16px;border-radius:8px;background:${bg};font-family:Manrope,sans-serif;font-size:13px;color:#1e293b;display:flex;align-items:center;justify-content:center;">Cell ${i + 1}</div>`;

// ============================== FLEX ==============================
const FlexBuilder = ({ onInsert, onWrap, hasSelection, actionMode }) => {
  const [direction, setDirection] = useState("row");
  const [wrap, setWrap] = useState("nowrap");
  const [justify, setJustify] = useState("flex-start");
  const [align, setAlign] = useState("stretch");
  const [gap, setGap] = useState(16);
  const [padding, setPadding] = useState(24);
  const [items, setItems] = useState(3);

  const container = `display:flex;flex-direction:${direction};flex-wrap:${wrap};justify-content:${justify};align-items:${align};gap:${gap}px;padding:${padding}px;background:#ffffff;`;

  const preview = `<div style="${container}">${Array.from({ length: items }).map((_, i) => cellHtml(i, "#f1f5f9")).join("")}</div>`;

  const isWrap = actionMode === "wrap";
  const canAct = isWrap ? hasSelection : true;
  const doAction = () => {
    if (isWrap) onWrap(container);
    else onInsert(preview);
  };

  return (
    <div className="space-y-3" data-testid="flex-builder">
      <Row label="Direction">
        <SegButtons value={direction} onChange={setDirection} testPrefix="flex-dir" options={[
          { v: "row", l: "row" },
          { v: "row-reverse", l: "row-rev" },
          { v: "column", l: "col" },
          { v: "column-reverse", l: "col-rev" },
        ]} />
      </Row>
      <Row label="Wrap">
        <SegButtons value={wrap} onChange={setWrap} testPrefix="flex-wrap" options={[
          { v: "nowrap", l: "nowrap" },
          { v: "wrap", l: "wrap" },
          { v: "wrap-reverse", l: "wrap-rev" },
        ]} />
      </Row>
      <Row label="Justify">
        <select value={justify} onChange={(e) => setJustify(e.target.value)} className={selectCls} data-testid="flex-justify">
          {["flex-start","center","flex-end","space-between","space-around","space-evenly"].map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
      </Row>
      <Row label="Align">
        <select value={align} onChange={(e) => setAlign(e.target.value)} className={selectCls} data-testid="flex-align">
          {["stretch","flex-start","center","flex-end","baseline"].map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
      </Row>
      <NumberRow label="Gap" value={gap} onChange={setGap} min={0} max={80} testId="flex-gap" unit="px" />
      <NumberRow label="Padding" value={padding} onChange={setPadding} min={0} max={120} testId="flex-padding" unit="px" />
      {!isWrap && <NumberRow label="Items" value={items} onChange={setItems} min={1} max={12} testId="flex-items" unit="" />}
      <PreviewBox html={preview} />
      <CopyRow css={`.flex-container { ${container.replace(/;/g, ";\n  ").trim()} }`} />
      <button
        onClick={doAction}
        disabled={!canAct}
        className="w-full text-xs py-1.5 rounded bg-blue-600 hover:bg-blue-500 disabled:bg-[#1F1F1F] disabled:text-gray-500 disabled:cursor-not-allowed text-white flex items-center justify-center gap-1"
        data-testid="flex-insert"
      >
        <Plus size={12} /> {isWrap ? "Wrap selection with flex" : "Insert flex container"}
      </button>
      {isWrap && !hasSelection && <div className="text-[10px] text-amber-400/80 text-center">Select an element on the canvas first.</div>}
    </div>
  );
};

// ============================== GRID ==============================
const GridBuilder = ({ onInsert, onWrap, hasSelection, actionMode }) => {
  const [cols, setCols] = useState([
    { value: 1, unit: "fr" }, { value: 1, unit: "fr" }, { value: 1, unit: "fr" },
  ]);
  const [rows, setRows] = useState([{ value: "auto", unit: "auto" }]);
  const [colGap, setColGap] = useState(16);
  const [rowGap, setRowGap] = useState(16);
  const [padding, setPadding] = useState(24);
  const [justifyItems, setJustifyItems] = useState("stretch");
  const [alignItems, setAlignItems] = useState("stretch");

  const cellCount = cols.length * rows.length;

  const style = `display:grid;grid-template-columns:${trackStr(cols)};grid-template-rows:${trackStr(rows)};column-gap:${colGap}px;row-gap:${rowGap}px;padding:${padding}px;justify-items:${justifyItems};align-items:${alignItems};background:#ffffff;`;

  const preview = `<div style="${style}">${Array.from({ length: cellCount }).map((_, i) => cellHtml(i, "#eef2ff")).join("")}</div>`;

  const updateTrack = (which, idx, patch) => {
    const setter = which === "cols" ? setCols : setRows;
    const arr = which === "cols" ? cols : rows;
    setter(arr.map((t, i) => i === idx ? { ...t, ...patch } : t));
  };
  const addTrack = (which) => (which === "cols" ? setCols([...cols, { value: 1, unit: "fr" }]) : setRows([...rows, { value: "auto", unit: "auto" }]));
  const removeTrack = (which, idx) => {
    if (which === "cols") setCols(cols.length > 1 ? cols.filter((_, i) => i !== idx) : cols);
    else setRows(rows.length > 1 ? rows.filter((_, i) => i !== idx) : rows);
  };

  const preset = (kind) => {
    if (kind === "12col") setCols(Array.from({ length: 12 }, () => ({ value: 1, unit: "fr" })));
    if (kind === "holy") { setCols([{ value: 240, unit: "px" }, { value: 1, unit: "fr" }, { value: 240, unit: "px" }]); setRows([{ value: "auto", unit: "auto" }]); }
    if (kind === "dashboard") { setCols([{ value: 260, unit: "px" }, { value: 1, unit: "fr" }]); setRows([{ value: 60, unit: "px" }, { value: 1, unit: "fr" }]); }
    if (kind === "3x3") { setCols([{ value: 1, unit: "fr" }, { value: 1, unit: "fr" }, { value: 1, unit: "fr" }]); setRows([{ value: 1, unit: "fr" }, { value: 1, unit: "fr" }, { value: 1, unit: "fr" }]); }
  };

  return (
    <div className="space-y-3" data-testid="grid-builder">
      <Row label="Presets">
        <div className="grid grid-cols-2 gap-1.5">
          <PresetBtn onClick={() => preset("12col")} testId="grid-preset-12col">12-col</PresetBtn>
          <PresetBtn onClick={() => preset("holy")} testId="grid-preset-holy">Holy grail</PresetBtn>
          <PresetBtn onClick={() => preset("dashboard")} testId="grid-preset-dashboard">Dashboard</PresetBtn>
          <PresetBtn onClick={() => preset("3x3")} testId="grid-preset-3x3">3 × 3</PresetBtn>
        </div>
      </Row>

      <TrackList title="Columns" tracks={cols} onUpdate={(i, p) => updateTrack("cols", i, p)} onAdd={() => addTrack("cols")} onRemove={(i) => removeTrack("cols", i)} testPrefix="grid-col" />
      <TrackList title="Rows" tracks={rows} onUpdate={(i, p) => updateTrack("rows", i, p)} onAdd={() => addTrack("rows")} onRemove={(i) => removeTrack("rows", i)} testPrefix="grid-row" />

      <div className="grid grid-cols-2 gap-2">
        <NumberRow label="Col gap" value={colGap} onChange={setColGap} min={0} max={80} testId="grid-col-gap" unit="px" />
        <NumberRow label="Row gap" value={rowGap} onChange={setRowGap} min={0} max={80} testId="grid-row-gap" unit="px" />
      </div>
      <NumberRow label="Padding" value={padding} onChange={setPadding} min={0} max={120} testId="grid-padding" unit="px" />

      <Row label="Justify items">
        <select value={justifyItems} onChange={(e) => setJustifyItems(e.target.value)} className={selectCls} data-testid="grid-justify-items">
          {["stretch","start","center","end"].map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
      </Row>
      <Row label="Align items">
        <select value={alignItems} onChange={(e) => setAlignItems(e.target.value)} className={selectCls} data-testid="grid-align-items">
          {["stretch","start","center","end"].map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
      </Row>

      <PreviewBox html={preview} />
      <CopyRow css={`.grid-container {\n  ${style.replace(/;/g, ";\n  ").trim()}\n}`} />
      {(() => {
        const isWrap = actionMode === "wrap";
        const canAct = isWrap ? hasSelection : true;
        const doAction = () => {
          if (isWrap) onWrap(style);
          else onInsert(preview);
        };
        return (
          <>
            <button
              onClick={doAction}
              disabled={!canAct}
              className="w-full text-xs py-1.5 rounded bg-blue-600 hover:bg-blue-500 disabled:bg-[#1F1F1F] disabled:text-gray-500 disabled:cursor-not-allowed text-white flex items-center justify-center gap-1"
              data-testid="grid-insert"
            >
              <Plus size={12} /> {isWrap ? "Wrap selection with grid" : "Insert grid container"}
            </button>
            {isWrap && !hasSelection && <div className="text-[10px] text-amber-400/80 text-center">Select an element on the canvas first.</div>}
          </>
        );
      })()}
    </div>
  );
};

// ============================== SHARED ==============================
const selectCls = "w-full bg-[#0D0D0D] border border-[#2B2B2B] rounded px-2 py-1.5 text-xs text-white outline-none focus:border-blue-500";

const Row = ({ label, children }) => (
  <div>
    <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">{label}</label>
    {children}
  </div>
);

const NumberRow = ({ label, value, onChange, min, max, testId, unit }) => (
  <Row label={`${label}${unit ? ` (${value}${unit})` : ""}`}>
    <div className="flex items-center gap-2">
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="flex-1" data-testid={`${testId}-slider`} />
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-14 bg-[#0D0D0D] border border-[#2B2B2B] rounded px-1.5 py-1 text-xs font-mono text-white outline-none focus:border-blue-500"
        data-testid={`${testId}-input`}
      />
    </div>
  </Row>
);

const SegButtons = ({ value, onChange, options, testPrefix }) => (
  <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
    {options.map((o) => (
      <button
        key={o.v}
        onClick={() => onChange(o.v)}
        className={`text-[10px] py-1 rounded border ${value === o.v ? "border-blue-500 bg-[#111623] text-white" : "border-[#2B2B2B] bg-[#1F1F1F] text-gray-300 hover:bg-[#2B2B2B]"}`}
        data-testid={`${testPrefix}-${o.v}`}
      >{o.l}</button>
    ))}
  </div>
);

const TrackList = ({ title, tracks, onUpdate, onAdd, onRemove, testPrefix }) => (
  <div>
    <div className="flex items-center justify-between mb-1">
      <label className="text-[10px] uppercase tracking-wider text-gray-500">{title} · {tracks.length}</label>
      <button onClick={onAdd} className="p-1 rounded hover:bg-[#1F1F1F] text-gray-400 hover:text-white" title={`Add ${title.toLowerCase()}`} data-testid={`${testPrefix}-add`}><Plus size={11} /></button>
    </div>
    <div className="space-y-1">
      {tracks.map((t, i) => (
        <div key={i} className="flex items-center gap-1.5" data-testid={`${testPrefix}-${i}`}>
          <input
            type="number"
            value={t.unit === "auto" ? "" : t.value}
            disabled={t.unit === "auto"}
            onChange={(e) => onUpdate(i, { value: Number(e.target.value) || 0 })}
            className="w-14 bg-[#0D0D0D] border border-[#2B2B2B] rounded px-1.5 py-1 text-[11px] font-mono text-white outline-none focus:border-blue-500 disabled:opacity-40"
            data-testid={`${testPrefix}-${i}-value`}
          />
          <select value={t.unit} onChange={(e) => onUpdate(i, { unit: e.target.value })} className="flex-1 bg-[#0D0D0D] border border-[#2B2B2B] rounded px-1 py-1 text-[11px] text-white outline-none focus:border-blue-500" data-testid={`${testPrefix}-${i}-unit`}>
            {["fr","px","%","rem","em","auto","minmax","min-content","max-content"].map((u) => <option key={u} value={u}>{u}</option>)}
          </select>
          <button onClick={() => onRemove(i)} className="p-1 rounded hover:bg-[#1F1F1F] text-gray-400 hover:text-red-400" title="Remove" data-testid={`${testPrefix}-${i}-remove`}><Trash2 size={11} /></button>
        </div>
      ))}
    </div>
  </div>
);

const PresetBtn = ({ children, onClick, testId }) => (
  <button onClick={onClick} className="text-[11px] py-1.5 rounded border border-[#2B2B2B] bg-[#1F1F1F] text-gray-200 hover:bg-[#2B2B2B]" data-testid={testId}>{children}</button>
);

const PreviewBox = ({ html }) => (
  <div>
    <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">Preview</label>
    <div className="rounded border border-[#2B2B2B] bg-white overflow-hidden" style={{ height: 140 }}>
      <iframe
        title="layout preview"
        sandbox=""
        srcDoc={`<!doctype html><html><head><style>html,body{margin:0;padding:0;background:#fff;}body{transform:scale(0.42);transform-origin:0 0;width:${100/0.42}%;}</style></head><body>${html}</body></html>`}
        style={{ border: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      />
    </div>
  </div>
);

const CopyRow = ({ css }) => {
  const [ok, setOk] = useState(false);
  const copy = () => { navigator.clipboard.writeText(css); setOk(true); setTimeout(() => setOk(false), 900); };
  return (
    <div>
      <label className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">CSS</label>
      <pre className="text-[10px] font-mono text-gray-300 whitespace-pre-wrap bg-[#0D0D0D] border border-[#2B2B2B] rounded p-2 max-h-24 overflow-auto">{css}</pre>
      <button onClick={copy} className="mt-1 w-full text-[11px] py-1 rounded bg-[#1F1F1F] hover:bg-[#2B2B2B] text-gray-200 border border-[#2B2B2B]">{ok ? "Copied ✓" : "Copy CSS"}</button>
    </div>
  );
};

// ============================== ROOT ==============================
export const LayoutBuilder = ({ onAddBlock, onWrapSelection, hasSelection }) => {
  const [mode, setMode] = useState("grid");
  const [actionMode, setActionMode] = useState("insert");
  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3" data-testid="layout-builder">
      <div className="grid grid-cols-2 gap-1.5">
        <button
          onClick={() => setMode("grid")}
          className={`text-xs py-1.5 rounded border flex items-center justify-center gap-1 ${mode === "grid" ? "border-blue-500 bg-[#111623] text-white" : "border-[#2B2B2B] bg-[#1F1F1F] text-gray-200 hover:bg-[#2B2B2B]"}`}
          data-testid="layout-mode-grid"
        ><LayoutGrid size={12} /> Grid</button>
        <button
          onClick={() => setMode("flex")}
          className={`text-xs py-1.5 rounded border flex items-center justify-center gap-1 ${mode === "flex" ? "border-blue-500 bg-[#111623] text-white" : "border-[#2B2B2B] bg-[#1F1F1F] text-gray-200 hover:bg-[#2B2B2B]"}`}
          data-testid="layout-mode-flex"
        ><Columns size={12} /> Flexbox</button>
      </div>
      <div className="flex bg-[#0D0D0D] border border-[#2B2B2B] rounded-md p-0.5 text-[11px]" data-testid="layout-action-toggle">
        <button
          onClick={() => setActionMode("insert")}
          className={`flex-1 py-1 rounded ${actionMode === "insert" ? "bg-[#1F1F1F] text-white" : "text-gray-400 hover:text-gray-200"}`}
          data-testid="layout-action-insert"
        >Insert new</button>
        <button
          onClick={() => setActionMode("wrap")}
          className={`flex-1 py-1 rounded ${actionMode === "wrap" ? "bg-[#1F1F1F] text-white" : "text-gray-400 hover:text-gray-200"}`}
          data-testid="layout-action-wrap"
        >Wrap selection</button>
      </div>
      {mode === "grid"
        ? <GridBuilder onInsert={onAddBlock} onWrap={onWrapSelection} hasSelection={hasSelection} actionMode={actionMode} />
        : <FlexBuilder onInsert={onAddBlock} onWrap={onWrapSelection} hasSelection={hasSelection} actionMode={actionMode} />}
    </div>
  );
};
