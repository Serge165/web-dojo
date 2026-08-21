import React, { useEffect, useRef, useState } from "react";
import { Trash2, ArrowUp, ArrowDown, Copy, Pencil, Save } from "lucide-react";
import { InlineToolbar } from "./InlineToolbar";
import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from "@/components/ui/context-menu";
import { RESPONSIVE_CSS_BODY } from "@/lib/responsiveCss.js";

const VIEWPORT_WIDTHS = { desktop: 1200, tablet: 820, mobile: 390 };

export const Canvas = ({
  elements, selectedId, onSelect, onDrop, onDelete, onMove, onDuplicate,
  onEditHtml, onSaveComponent, canvasBg, headHtml, viewport = "desktop", zoom = 100,
}) => {
  const dropRef = useRef(null);
  const [editingId, setEditingId] = useState(null);
  const editingRef = useRef(null);

  // RESPONSIVE_CSS is otherwise only injected at export/publish/Preview
  // time (exportHtml.js, server.py) — the live Design canvas never saw it,
  // so the tablet/mobile viewport toggle never actually collapsed grids or
  // stacked flex rows here even after the @container fix above. It's
  // project-independent, so this runs once and stays for the component's
  // lifetime rather than re-running per headHtml change.
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = RESPONSIVE_CSS_BODY;
    document.head.appendChild(style);
    return () => style.parentNode && style.parentNode.removeChild(style);
  }, []);

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
      {/* container-type: inline-size makes this div itself the
          containment context for @container rules injected via
          headHtml (see responsiveCss.js) — without it, the grid-collapse
          and flex-stack rules never fire in Design mode, since this
          isn't an iframe and @media only sees the real browser window,
          not this div's toggled width. */}
      <div className="mx-auto my-6 transition-all duration-200" style={{ width: `min(${w}px, 96%)`, zoom: `${zoom}%`, containerType: "inline-size" }}>
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
              <ContextMenu>
                <ContextMenuTrigger asChild>
                  <div
                    data-testid={`canvas-el-${el.id}`}
                    // Not data-forge-el-id: that attribute is now baked
                    // directly into el.html's own root tag (see
                    // Builder.jsx's addAttrToFirstTag/patchResponsiveStyle)
                    // so [data-forge-el-id="..."] selectors match the same
                    // element here, in Preview, and in real exports —
                    // putting it on this wrapper too would double-match
                    // it in the canvas alone.
                    className={`relative group ${selectedId === el.id ? "outline outline-2 outline-blue-500" : ""}`}
                    style={{ zIndex: el.zIndex || undefined, display: el.hidden ? "none" : undefined }}
                    onClick={(e) => { e.stopPropagation(); onSelect(el.id); }}
                    onContextMenu={() => onSelect(el.id)}
                  >
                    {editingId === el.id ? (
                      <div
                        ref={editingRef}
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => { onEditHtml(el.id, e.currentTarget.innerHTML); setEditingId(null); }}
                        dangerouslySetInnerHTML={{ __html: el.html }}
                        className="focus:outline-none"
                        data-testid={`inline-editor-${el.id}`}
                      />
                    ) : (
                      <div dangerouslySetInnerHTML={{ __html: el.html }} />
                    )}
                    <div className={`absolute top-1 right-1 transition-opacity flex gap-1 z-10 ${selectedId === el.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                      <IconBtn testId={`el-edit-${el.id}`} title="Edit text inline" onClick={(e) => { e.stopPropagation(); setEditingId(el.id); setTimeout(() => editingRef.current?.focus(), 0); }}><Pencil size={12} /></IconBtn>
                      <IconBtn testId={`el-save-${el.id}`} title="Save as component" onClick={(e) => { e.stopPropagation(); onSaveComponent && onSaveComponent(el); }}><Save size={12} /></IconBtn>
                      <IconBtn testId={`el-up-${el.id}`} title="Move up" onClick={(e) => { e.stopPropagation(); onMove(el.id, -1); }}><ArrowUp size={12} /></IconBtn>
                      <IconBtn testId={`el-down-${el.id}`} title="Move down" onClick={(e) => { e.stopPropagation(); onMove(el.id, 1); }}><ArrowDown size={12} /></IconBtn>
                      <IconBtn testId={`el-dup-${el.id}`} title="Duplicate" onClick={(e) => { e.stopPropagation(); onDuplicate(el.id); }}><Copy size={12} /></IconBtn>
                      <IconBtn testId={`el-del-${el.id}`} title="Delete" danger onClick={(e) => { e.stopPropagation(); onDelete(el.id); }}><Trash2 size={12} /></IconBtn>
                    </div>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent className="bg-[#141414] border-[#2B2B2B] text-gray-200" data-testid={`el-ctxmenu-${el.id}`}>
                  <ContextMenuItem className="text-xs focus:bg-[#1F1F1F] focus:text-white" data-testid={`ctx-edit-${el.id}`} onSelect={() => { setEditingId(el.id); setTimeout(() => editingRef.current?.focus(), 0); }}>Edit text inline</ContextMenuItem>
                  <ContextMenuItem className="text-xs focus:bg-[#1F1F1F] focus:text-white" data-testid={`ctx-save-${el.id}`} onSelect={() => onSaveComponent && onSaveComponent(el)}>Save as component</ContextMenuItem>
                  <ContextMenuSeparator className="bg-[#2B2B2B]" />
                  <ContextMenuItem className="text-xs focus:bg-[#1F1F1F] focus:text-white" data-testid={`ctx-up-${el.id}`} onSelect={() => onMove(el.id, -1)}>Move up</ContextMenuItem>
                  <ContextMenuItem className="text-xs focus:bg-[#1F1F1F] focus:text-white" data-testid={`ctx-down-${el.id}`} onSelect={() => onMove(el.id, 1)}>Move down</ContextMenuItem>
                  <ContextMenuItem className="text-xs focus:bg-[#1F1F1F] focus:text-white" data-testid={`ctx-dup-${el.id}`} onSelect={() => onDuplicate(el.id)}>Duplicate</ContextMenuItem>
                  <ContextMenuSeparator className="bg-[#2B2B2B]" />
                  <ContextMenuItem className="text-xs text-red-400 focus:bg-[#1F1F1F] focus:text-red-400" data-testid={`ctx-del-${el.id}`} onSelect={() => onDelete(el.id)}>Delete</ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            </React.Fragment>
          ))}
          <DropSlot onDrop={(e) => handleDrop(e, elements.length)} onDragOver={handleDragOver} index={elements.length} tail />
        </div>
      </div>
      {editingId && <InlineToolbar targetRef={editingRef} />}
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
