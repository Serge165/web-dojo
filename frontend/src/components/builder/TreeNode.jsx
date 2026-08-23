import React from "react";
import { ChevronDown, ChevronRight, FileText, Folder, FolderPlus, FilePlus, Trash2 } from "lucide-react";

export function TreeNode(props) {
  const node = props.node;
  const depth = props.depth;
  const expanded = props.expanded;
  const onToggle = props.onToggle;
  const onAddUnder = props.onAddUnder;
  const onRemove = props.onRemove;
  const onRename = props.onRename;
  const onFileClick = props.onFileClick;
  const onInsertHtml = props.onInsertHtml;

  if (node.type === "folder") {
    const open = expanded[node.path] ?? depth === 0;
    return (
      <div>
        <div
          className="flex items-center gap-1 pr-1 py-0.5 rounded hover:bg-[#242019] text-[12px] text-[#F1EDE2] group"
          style={{ paddingLeft: 4 + depth * 10 }}
          data-testid={`tree-folder-${node.path || "root"}`}
        >
          <button onClick={() => onToggle(node.path)} className="p-0.5 text-[#A79C87]">
            {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          </button>
          <Folder size={12} className="text-[#D9BC55]" />
          <span className="flex-1 truncate">{node.name || "project"}</span>
          <button
            onClick={() => onAddUnder(node.path || "", "file")}
            className="opacity-0 group-hover:opacity-100 p-0.5 text-[#A79C87] hover:text-[#F1EDE2]"
            title="New file"
            data-testid={`tree-add-file-${node.path || "root"}`}
          >
            <FilePlus size={11} />
          </button>
          <button
            onClick={() => onAddUnder(node.path || "", "folder")}
            className="opacity-0 group-hover:opacity-100 p-0.5 text-[#A79C87] hover:text-[#F1EDE2]"
            title="New folder"
            data-testid={`tree-add-folder-${node.path || "root"}`}
          >
            <FolderPlus size={11} />
          </button>
          {node.path ? (
            <button
              onClick={() => onRemove(node.path)}
              className="opacity-0 group-hover:opacity-100 p-0.5 text-[#A79C87] hover:text-red-400"
              title="Delete folder"
              data-testid={`tree-del-${node.path}`}
            >
              <Trash2 size={11} />
            </button>
          ) : null}
        </div>
        {open ? (node.children || []).map((c) => (
          React.createElement(TreeNode, {
            key: c.id || c.path,
            node: c,
            depth: depth + 1,
            expanded: expanded,
            onToggle: onToggle,
            onAddUnder: onAddUnder,
            onRemove: onRemove,
            onRename: onRename,
            onFileClick: onFileClick,
            onInsertHtml: onInsertHtml,
          })
        )) : null}
      </div>
    );
  }

  const isHtml = /\.html?$/i.test(node.path);
  const isImage = !!node.isImage;
  const onDragStart = (e) => {
    if (isHtml) {
      e.dataTransfer.setData("text/html-block", node.content || "");
      e.dataTransfer.effectAllowed = "copy";
    }
  };
  const onDbl = () => {
    const nn = prompt("Rename file", node.path.split("/").pop());
    if (nn) onRename(node.path, node.path.replace(/[^/]+$/, nn));
  };

  return (
    <div
      draggable={isHtml}
      onDragStart={onDragStart}
      className="flex items-center gap-1 py-0.5 pr-1 rounded hover:bg-[#242019] text-[12px] text-[#F1EDE2] group"
      style={{ paddingLeft: 4 + depth * 10 }}
      data-testid={`tree-file-${node.path}`}
    >
      <span className="w-3" />
      {isImage ? (
        <img src={node.content} alt="" style={{ width: 12, height: 12, objectFit: "cover", borderRadius: 2 }} />
      ) : (
        <FileText size={12} className={isHtml ? "text-emerald-400" : "text-[#A79C87]"} />
      )}
      <button
        onDoubleClick={onDbl}
        // Images skip the code editor entirely — dumping a data: URI's
        // raw base64 into Monaco isn't useful; the thumbnail above is
        // the preview.
        onClick={() => !isImage && onFileClick && onFileClick(node)}
        className="flex-1 truncate text-left"
      >
        {node.name}
      </button>
      {isHtml ? (
        <button
          onClick={() => onInsertHtml && onInsertHtml(node.content || "")}
          className="opacity-0 group-hover:opacity-100 text-[10px] text-[#D9BC55] hover:text-blue-300 px-1"
          title="Insert into canvas"
          data-testid={`tree-insert-${node.path}`}
        >
          insert
        </button>
      ) : null}
      <button
        onClick={() => onRemove(node.path)}
        className="opacity-0 group-hover:opacity-100 p-0.5 text-[#A79C87] hover:text-red-400"
        title="Delete"
        data-testid={`tree-del-${node.path}`}
      >
        <Trash2 size={11} />
      </button>
    </div>
  );
}
