import React, { useState } from "react";
import { Plus, X, Circle, Eye } from "lucide-react";

const STATUS = [
  { id: "draft", label: "Draft", color: "#f59e0b" },
  { id: "review", label: "Review", color: "#8b5cf6" },
  { id: "published", label: "Published", color: "#10b981" },
];

// Horizontal strip of page tabs shown between the top bar and the workspace.
export const PagesBar = ({
  pages, activePageId, onSwitch, onAdd, onRemove, onRename, onSetStatus, onOpenSeo, onOpenTemplate,
}) => {
  const [editingId, setEditingId] = useState(null);
  return (
  <div className="h-9 flex-none border-b border-[#2B2B2B] bg-[#101010] flex items-center px-2 gap-1 overflow-x-auto" data-testid="pages-bar">
    {pages.map((p) => {
      const active = p.id === activePageId;
      const status = STATUS.find((s) => s.id === (p.status || "draft")) || STATUS[0];
      const isEditing = editingId === p.id;
      return (
        <div
          key={p.id}
          onClick={() => { if (!isEditing) onSwitch(p.id); }}
          className={`flex-none flex items-center gap-1.5 px-2 py-1 rounded-t border-b-2 cursor-pointer text-xs group ${active ? "bg-[#0D0D0D] border-blue-500 text-white" : "border-transparent text-gray-400 hover:text-gray-200 hover:bg-[#151515]"}`}
          data-testid={`page-tab-${p.id}`}
        >
          <span title={status.label} style={{ background: status.color, width: 7, height: 7, borderRadius: 999 }} />
          {isEditing ? (
            <input
              autoFocus
              value={p.name}
              onFocus={(e) => e.target.select()}
              onChange={(e) => onRename(p.id, e.target.value)}
              onBlur={() => setEditingId(null)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") setEditingId(null); }}
              onClick={(e) => e.stopPropagation()}
              className="bg-transparent outline-none w-24 text-xs border-b border-blue-500"
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
            className="bg-transparent text-[10px] text-gray-400 outline-none border-0 opacity-0 group-hover:opacity-100"
            data-testid={`page-status-${p.id}`}
            title="Workflow status"
          >
            {STATUS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          {pages.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(p.id); }}
              className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 p-0.5"
              title="Delete page"
              data-testid={`page-del-${p.id}`}
            ><X size={11} /></button>
          )}
        </div>
      );
    })}
    <button
      onClick={onAdd}
      className="flex-none flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-400 hover:text-white hover:bg-[#1F1F1F]"
      title="New page"
      data-testid="page-add-btn"
    ><Plus size={11} /> Page</button>
    <div className="flex-1" />
    <button
      onClick={onOpenSeo}
      className="flex-none flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-400 hover:text-white hover:bg-[#1F1F1F]"
      title="Page SEO / metadata"
      data-testid="page-seo-btn"
    ><Eye size={11} /> SEO</button>
    <button
      onClick={onOpenTemplate}
      className="flex-none flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-400 hover:text-white hover:bg-[#1F1F1F]"
      title="Site-wide template (header/footer)"
      data-testid="template-btn"
    ><Circle size={11} /> Template</button>
  </div>
  );
};
