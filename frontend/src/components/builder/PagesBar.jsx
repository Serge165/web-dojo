import React, { useState } from "react";
import { Plus, X, Circle, Eye } from "lucide-react";

const STATUS = [
  { id: "draft", label: "Draft", color: "#f59e0b" },
  { id: "review", label: "Review", color: "#8b5cf6" },
  { id: "published", label: "Published", color: "#10b981" },
];

// Horizontal strip of page tabs shown between the top bar and the workspace.
export const PagesBar = ({
  pages, activePageId, onSwitch, onAdd, onRemove, onRename, onSetStatus, onSetType, onOpenSeo, onOpenTemplate,
}) => {
  const [editingId, setEditingId] = useState(null);
  return (
  <div className="h-9 flex-none border-b border-[#332D22] bg-[#15130E] flex items-center px-2 gap-1 overflow-x-auto" data-testid="pages-bar">
    {pages.map((p) => {
      const active = p.id === activePageId;
      const status = STATUS.find((s) => s.id === (p.status || "draft")) || STATUS[0];
      const isEditing = editingId === p.id;
      return (
        <div
          key={p.id}
          onClick={() => { if (!isEditing) onSwitch(p.id); }}
          className={`flex-none flex items-center gap-1.5 px-2 py-1 rounded-t border-b-2 cursor-pointer text-xs group ${active ? "bg-[#1C1A15] border-[#C9A227] text-[#F1EDE2]" : "border-transparent text-[#A79C87] hover:text-[#F1EDE2] hover:bg-[#242019]"}`}
          data-testid={`page-tab-${p.id}`}
        >
          <span title={status.label} style={{ background: status.color, width: 7, height: 7, borderRadius: 999 }} />
          {/* Phase 5 (Issue #3): layouts are reusable templates — visually
              distinct from pages and switchable via the type select. */}
          {p.type === "layout" && (
            <span
              title="Layout template"
              className="text-[9px] leading-none px-1 py-0.5 rounded bg-indigo-600/30 text-indigo-300 uppercase select-none"
              data-testid={`page-layout-badge-${p.id}`}
            >L</span>
          )}
          {isEditing ? (
            <input
              autoFocus
              value={p.name}
              onFocus={(e) => e.target.select()}
              onChange={(e) => onRename(p.id, e.target.value)}
              onBlur={() => setEditingId(null)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") setEditingId(null); }}
              onClick={(e) => e.stopPropagation()}
              className="bg-transparent outline-none w-24 text-xs border-b border-[#C9A227]"
              data-testid={`page-name-${p.id}`}
            />
          ) : (
            <span
              onDoubleClick={(e) => { e.stopPropagation(); setEditingId(p.id); }}
              className="w-24 truncate select-none"
              title="Double-click to rename"
              data-testid={`page-name-${p.id}`}
            >{p.name}</span>
          )}
          <select
            value={p.status || "draft"}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onSetStatus(p.id, e.target.value)}
            className="bg-transparent text-[10px] text-[#A79C87] outline-none border-0 opacity-0 group-hover:opacity-100"
            data-testid={`page-status-${p.id}`}
            title="Workflow status"
          >
            {STATUS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <select
            value={p.type || "page"}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onSetType && onSetType(p.id, e.target.value)}
            className="bg-transparent text-[10px] text-[#A79C87] outline-none border-0 opacity-0 group-hover:opacity-100"
            data-testid={`page-type-${p.id}`}
            title="Page type — pages are unique content; layouts are reusable templates"
          >
            <option value="page">Page</option>
            <option value="layout">Layout</option>
          </select>
          {pages.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(p.id); }}
              className="opacity-0 group-hover:opacity-100 text-[#948C79] hover:text-red-400 p-0.5"
              title="Delete page"
              data-testid={`page-del-${p.id}`}
            ><X size={11} /></button>
          )}
        </div>
      );
    })}
    <button
      onClick={onAdd}
      className="flex-none flex items-center gap-1 px-2 py-1 rounded text-xs text-[#A79C87] hover:text-[#F1EDE2] hover:bg-[#242019]"
      title="New page"
      data-testid="page-add-btn"
    ><Plus size={11} /> Page</button>
    <div className="flex-1" />
    <button
      onClick={onOpenSeo}
      className="flex-none flex items-center gap-1 px-2 py-1 rounded text-xs text-[#A79C87] hover:text-[#F1EDE2] hover:bg-[#242019]"
      title="Page SEO / metadata"
      data-testid="page-seo-btn"
    ><Eye size={11} /> SEO</button>
    <button
      onClick={onOpenTemplate}
      className="flex-none flex items-center gap-1 px-2 py-1 rounded text-xs text-[#A79C87] hover:text-[#F1EDE2] hover:bg-[#242019]"
      title="Site-wide template (header/footer)"
      data-testid="template-btn"
    ><Circle size={11} /> Template</button>
  </div>
  );
};
