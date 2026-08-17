import React, { useEffect, useMemo, useRef, useState } from "react";
import { FolderPlus, FilePlus, Upload } from "lucide-react";
import { toast } from "sonner";
import { TreeNode } from "./TreeNode";

const uid = () => "f_" + Math.random().toString(36).slice(2, 10);

const buildTree = (files) => {
  const root = { name: "", path: "", type: "folder", children: [], id: "__root" };
  const dirs = { "": root };
  const sorted = [...files].sort((a, b) => a.path.localeCompare(b.path));
  for (const f of sorted) {
    const parts = f.path.split("/").filter(Boolean);
    let parent = root;
    let acc = "";
    for (let i = 0; i < parts.length; i++) {
      acc = acc ? `${acc}/${parts[i]}` : parts[i];
      const isLast = i === parts.length - 1;
      if (isLast && f.type !== "folder") {
        parent.children.push({ ...f, name: parts[i], children: null });
      } else {
        let dir = dirs[acc];
        if (!dir) {
          dir = { id: `d_${acc}`, name: parts[i], path: acc, type: "folder", children: [] };
          dirs[acc] = dir;
          parent.children.push(dir);
        }
        parent = dir;
      }
    }
  }
  return root;
};

const readEntry = (entry, prefix = "") =>
  new Promise((resolve) => {
    if (entry.isFile) {
      entry.file(async (file) => {
        const content = await file.text().catch(() => "");
        resolve([{ id: uid(), path: `${prefix}${file.name}`, type: "file", content }]);
      });
    } else if (entry.isDirectory) {
      const reader = entry.createReader();
      const items = [];
      const collect = () => reader.readEntries(async (batch) => {
        if (batch.length === 0) {
          const nested = await Promise.all(items.map((it) => readEntry(it, `${prefix}${entry.name}/`)));
          resolve([
            { id: uid(), path: `${prefix}${entry.name}`, type: "folder", content: "" },
            ...nested.flat(),
          ]);
          return;
        }
        items.push(...batch); collect();
      });
      collect();
    } else {
      resolve([]);
    }
  });

export const FileTree = ({ files, onChange, onFileClick, onInsertHtml }) => {
  const tree = useMemo(() => buildTree(files), [files]);
  const [expanded, setExpanded] = useState({ "": true });
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const el = fileInputRef.current;
    if (!el) return;
    el.setAttribute("webkitdirectory", "");
    el.setAttribute("directory", "");
    el.setAttribute("mozdirectory", "");
  }, []);

  const toggle = (path) => setExpanded((e) => ({ ...e, [path]: !e[path] }));

  const addAtRoot = (type) => {
    const base = type === "folder" ? "new-folder" : "new-file.html";
    const paths = new Set(files.map((f) => f.path));
    let name = base;
    let i = 1;
    while (paths.has(name)) { name = base.replace(/(\.\w+)?$/, `-${i}$1`); i++; }
    onChange([...files, { id: uid(), path: name, type, content: "" }]);
  };

  const addUnder = (folderPath, type) => {
    const base = type === "folder" ? "folder" : "untitled.html";
    const paths = new Set(files.map((f) => f.path));
    let candidate = folderPath ? `${folderPath}/${base}` : base;
    let i = 1;
    while (paths.has(candidate)) {
      const b = base.replace(/(\.\w+)?$/, `-${i}$1`);
      candidate = folderPath ? `${folderPath}/${b}` : b;
      i++;
    }
    onChange([...files, { id: uid(), path: candidate, type, content: "" }]);
  };

  const remove = (path) => {
    onChange(files.filter((f) => f.path !== path && !f.path.startsWith(path + "/")));
  };

  const rename = (path, next) => {
    if (!next || next === path) return;
    onChange(files.map((f) => {
      if (f.path === path) return { ...f, path: next };
      if (f.path.startsWith(path + "/")) return { ...f, path: next + f.path.slice(path.length) };
      return f;
    }));
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragging(false);
    const items = Array.from(e.dataTransfer.items || []);
    if (items.length === 0) return;
    const collected = [];
    for (const it of items) {
      const entry = it.webkitGetAsEntry && it.webkitGetAsEntry();
      if (entry) {
        const arr = await readEntry(entry);
        collected.push(...arr);
      } else {
        const f = it.getAsFile && it.getAsFile();
        if (f) {
          const content = await f.text().catch(() => "");
          collected.push({ id: uid(), path: f.name, type: "file", content });
        }
      }
    }
    const existing = new Set(files.map((f) => f.path));
    const merged = [...files, ...collected.filter((c) => !existing.has(c.path))];
    onChange(merged);
    toast.success(`Imported ${collected.length} entries`);
  };

  const onFilePick = async (e) => {
    const list = Array.from(e.target.files || []);
    const collected = [];
    for (const f of list) {
      const rel = f.webkitRelativePath || f.name;
      const content = await f.text().catch(() => "");
      collected.push({ id: uid(), path: rel, type: "file", content });
    }
    const existing = new Set(files.map((f) => f.path));
    onChange([...files, ...collected.filter((c) => !existing.has(c.path))]);
    e.target.value = "";
    toast.success(`Imported ${collected.length} files`);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden" data-testid="file-tree">
      <div className="px-3 py-2 border-b border-[#2B2B2B] flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-wider text-gray-500">Project files</div>
        <div className="flex items-center gap-1">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={onFilePick}
            className="hidden"
            data-testid="tree-folder-picker"
          />
          <button onClick={() => fileInputRef.current && fileInputRef.current.click()} className="p-1 text-gray-400 hover:text-white" title="Upload folder" data-testid="tree-upload-folder">
            <Upload size={12} />
          </button>
          <button onClick={() => addAtRoot("file")} className="p-1 text-gray-400 hover:text-white" title="New file" data-testid="tree-new-file">
            <FilePlus size={12} />
          </button>
          <button onClick={() => addAtRoot("folder")} className="p-1 text-gray-400 hover:text-white" title="New folder" data-testid="tree-new-folder">
            <FolderPlus size={12} />
          </button>
        </div>
      </div>
      <div
        className={`flex-1 overflow-y-auto p-1 relative ${dragging ? "bg-blue-500/10 border-2 border-dashed border-blue-500" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        data-testid="tree-dropzone"
      >
        {files.length === 0 ? (
          <div className="text-[11px] text-gray-500 p-3 text-center">
            Drop a folder here, click the + icons to create, or use the upload button.
          </div>
        ) : (
          <TreeNode
            node={tree}
            depth={0}
            expanded={expanded}
            onToggle={toggle}
            onAddUnder={addUnder}
            onRemove={remove}
            onRename={rename}
            onFileClick={onFileClick}
            onInsertHtml={onInsertHtml}
          />
        )}
      </div>
    </div>
  );
};
