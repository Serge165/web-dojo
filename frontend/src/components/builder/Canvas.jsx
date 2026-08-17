import React, { useEffect, useRef } from "react";
import { Trash2, ArrowUp, ArrowDown, Copy } from "lucide-react";

// Renders each element in its own wrapper. Clicking selects; drop between
// wrappers inserts. srcDoc is not used — we render live so events work.
export const Canvas = ({ elements, selectedId, onSelect, onDrop, onDelete, onMove, onDuplicate, canvasBg, headHtml }) => {
  const dropRef = useRef(null);

  useEffect(() => {
    // Inject head-html links (e.g. Google Fonts, framework CDNs) into the parent
    // document so canvas previews reflect them. Cleanup on change.
    if (!headHtml) return;
    const container = document.createElement("div");
    container.setAttribute("data-canvas-head", "true");
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

  return (
    <div className="flex-1 bg-[#050505] overflow-auto" data-testid="canvas-area">
      <div className="mx-auto my-6 shadow-2xl" style={{ width: "min(1200px, 92%)" }}>
        <div className="text-[10px] uppercase tracking-wider text-gray-500 px-1 pb-1 flex items-center justify-between">
          <span>Preview · {elements.length} block{elements.length === 1 ? "" : "s"}</span>
          <span className="font-mono">1200 × auto</span>
        </div>
        <div
          ref={dropRef}
          className="min-h-[600px] border border-[#2B2B2B]"
          style={{ background: canvasBg }}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, elements.length)}
          data-testid="canvas-root"
        >
          {elements.length === 0 && (
            <div className="p-16 text-center text-gray-400 text-sm">
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
                className={`relative group ${selectedId === el.id ? "ring-2 ring-blue-500" : ""}`}
                onClick={(e) => { e.stopPropagation(); onSelect(el.id); }}
              >
                <div className="relative" dangerouslySetInnerHTML={{ __html: el.html }} />
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
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
