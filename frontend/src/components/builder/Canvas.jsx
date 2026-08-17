import React, { useEffect, useRef, useState } from "react";
import { Trash2, ArrowUp, ArrowDown, Copy, Pencil } from "lucide-react";

const VIEWPORT_WIDTHS = { desktop: 1200, tablet: 820, mobile: 390 };

export const Canvas = ({
  elements, selectedId, onSelect, onDrop, onDelete, onMove, onDuplicate,
  onEditHtml, canvasBg, headHtml, viewport = "desktop",
}) => {
  const dropRef = useRef(null);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (!headHtml) return;
    const container = document.createElement("div");
    container.innerHTML = headHtml;
    const nodes = Array.from(container.childNodes);
    nodes.forEach((n) => document.head.appendChild(n));
    return () => nodes.forEach((n) => n.parentNode && n.parentNode.removeChild(n));
  }, [headHtml]);

  const handleDragOver = (e) => {
    if (e.dataTransfer.types.includes("text/html-block")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    }
  };
  const handleDrop = (e, index) => {
    const html = e.dataTransfer.getData("text/html-block");
    if (!html) return;
    e.preventDefault();
    e.stopPropagation();
    onDrop(html, index);
  };

  const w = VIEWPORT_WIDTHS[viewport] || VIEWPORT_WIDTHS.desktop;

  return (
    <div className="flex-1 bg-[#050505] overflow-auto" data-testid="canvas-area">
      <div className="mx-auto my-6 transition-all duration-200" style={{ width: `min(${w}px, 96%)` }}>
        <div className="text-[10px] uppercase tracking-wider text-gray-500 px-1 pb-1 flex items-center justify-between">
          <span>Preview · {elements.length} block{elements.length === 1 ? "" : "s"} · {viewport}</span>
          <span className="font-mono">{w} × auto</span>
        </div>
        <div
          ref={dropRef}
          className="min-h-[600px] border border-[#2B2B2B] shadow-2xl"
          style={{ background: canvasBg }}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, elements.length)}
          data-testid="canvas-root"
        >
          {elements.length === 0 && (
            <div className="p-16 text-center text-sm">
              <div className="inline-block px-4 py-3 border border-dashed border-gray-300 rounded-md bg-white/40" style={{ color: "#334155" }}>
                Drag blocks here from the left library, or double-click any block.
              </div>
            </div>
          )}

          {elements.map((el, i) => (
            <React.Fragment key={el.id}>
              <DropSlot onDrop={(e) => handleDrop(e, i)} onDragOver={handleDragOver} index={i} />
              <div
                data-testid={`canvas-el-${el.id}`}
                data-forge-el-id={el.id}
                className={`relative group ${selectedId === el.id ? "outline outline-2 outline-blue-500" : ""}`}
                style={{ zIndex: el.zIndex || undefined, display: el.hidden ? "none" : undefined }}
                onClick={(e) => { e.stopPropagation(); onSelect(el.id); }}
              >
                {editingId === el.id ? (
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => { onEditHtml(el.id, e.currentTarget.innerHTML); setEditingId(null); }}
                    dangerouslySetInnerHTML={{ __html: el.html }}
                    className="focus:outline-none"
                  />
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: el.html }} />
                )}
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                  <IconBtn testId={`el-edit-${el.id}`} title="Edit text inline" onClick={(e) => { e.stopPropagation(); setEditingId(el.id); }}><Pencil size={12} /></IconBtn>
                  <IconBtn testId={`el-up-${el.id}`} title="Move up" onClick={(e) => { e.stopPropagation(); onMove(el.id, -1); }}><ArrowUp size={12} /></IconBtn>
                  <IconBtn testId={`el-down-${el.id}`} title="Move down" onClick={(e) => { e.stopPropagation(); onMove(el.id, 1); }}><ArrowDown size={12} /></IconBtn>
                  <IconBtn testId={`el-dup-${el.id}`} title="Duplicate" onClick={(e) => { e.stopPropagation(); onDuplicate(el.id); }}><Copy size={12} /></IconBtn>
                  <IconBtn testId={`el-del-${el.id}`} title="Delete" danger onClick={(e) => { e.stopPropagation(); onDelete(el.id); }}><Trash2 size={12} /></IconBtn>
                </div>
              </div>
            </React.Fragment>
          ))}
          <DropSlot onDrop={(e) => handleDrop(e, elements.length)} onDragOver={handleDragOver} index={elements.length} tail />
        </div>
      </div>
    </div>
  );
};

const IconBtn = ({ children, onClick, title, danger, testId }) => (
  <button
    onClick={onClick}
    title={title}
    data-testid={testId}
    className={`w-6 h-6 flex items-center justify-center rounded border border-[#2B2B2B] bg-[#141414]/95 text-gray-200 hover:${danger ? "text-red-400" : "text-white"} hover:bg-[#1F1F1F]`}
  >{children}</button>
);

const DropSlot = ({ onDrop, onDragOver, index, tail }) => {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onDragOver={(e) => { onDragOver(e); setHover(true); }}
      onDragLeave={() => setHover(false)}
      onDrop={(e) => { setHover(false); onDrop(e); }}
      className={`transition-all ${hover ? "h-8 bg-blue-500/20" : tail ? "h-4" : "h-1"}`}
      data-testid={`drop-slot-${index}`}
    />
  );
};
