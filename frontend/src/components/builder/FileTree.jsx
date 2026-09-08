import React, { useEffect, useMemo, useRef, useState } from "react";
import { FolderPlus, FilePlus, Upload, FileText } from "lucide-react";
import { toast } from "sonner";
import { TreeNode } from "./TreeNode";
import { isJsFilePath, fileNameOf } from "@/lib/jsAutoLink";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const uid = () => "f_" + Math.random().toString(36).slice(2, 10);

const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|svg|bmp|ico|avif)$/i;
const isImageFile = (file) => (file.type && file.type.startsWith("image/")) || IMAGE_EXT_RE.test(file.name || "");

// Images need to survive as actual image bytes, not mangled text — read
// them as a data URI instead of file.text() (which would silently
// corrupt any binary content, since it's designed for source files).
const readFileContent = (file) =>
  new Promise((resolve) => {
    if (isImageFile(file)) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result || "");
      reader.onerror = () => resolve("");
      reader.readAsDataURL(file);
    } else {
      file.text().then(resolve).catch(() => resolve(""));
    }
  });

// Every imported image lands in one shared imgs/ folder regardless of
// where it was dropped from (a subfolder of a dragged-in project, etc.)
// — mirrors how real asset libraries centralize images rather than
// scattering them through arbitrary paths. Non-image files keep their
// normal relative path.
const importedPath = (file, prefix) => (isImageFile(file) ? `imgs/${file.name}` : `${prefix}${file.name}`);

// Merges freshly-imported entries into the existing files array.
// Non-image path collisions keep the pre-existing silent-skip behavior
// (first import wins). Image collisions ask before overwriting — an
// image landing in the shared imgs/ folder is far more likely to be a
// genuine "replace this asset" intent than a same-named source file
// dropped in twice by accident.
const mergeImported = (collected, files) => {
  let next = [...files];
  const pathIndex = new Map(next.map((f, i) => [f.path, i]));
  let imported = 0;
  let skipped = 0;
  for (const item of collected) {
    const existingIdx = pathIndex.get(item.path);
    if (existingIdx === undefined) {
      pathIndex.set(item.path, next.length);
      next.push(item);
      imported++;
      continue;
    }
    if (!item.isImage) { skipped++; continue; } // non-image collision: unchanged prior behavior
    const overwrite = window.confirm(`"${item.path}" already exists in this project. Overwrite it with the new import?`);
    if (!overwrite) { skipped++; continue; }
    next[existingIdx] = item;
    imported++;
  }
  return { next, imported, skipped };
};

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
        const content = await readFileContent(file);
        resolve([{ id: uid(), path: importedPath(file, prefix), type: "file", content, isImage: isImageFile(file) }]);
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

export const FileTree = ({ files, onChange, onFileClick, onInsertHtml, onInsertAllHtml, pages = [], activePageId = null, onSwitchPage = null, onJsChange = null }) => {
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

  // Files ask for a name up front so typing "styles.css" or "app.js" just
  // creates that type — no separate HTML/CSS/JS picker needed. This used
  // to be a bare window.prompt(), which silently no-ops (returns null,
  // same as Cancel) in contexts that don't support native blocking
  // dialogs — Tauri's webview among them — so "New file" looked like it
  // just did nothing. A real modal doesn't depend on that browser API.
  // Folders keep their old auto-naming since "New folder" has no
  // meaningful type choice to make.
  const [newFileFolder, setNewFileFolder] = useState(null); // null = closed; "" or "a/b" = open, for that folder
  const [newFileName, setNewFileName] = useState("untitled.html");
  const openNewFile = (folderPath) => { setNewFileFolder(folderPath); setNewFileName("untitled.html"); };
  const confirmNewFile = () => {
    const name = newFileName.trim();
    if (!name) return;
    const paths = new Set(files.map((f) => f.path));
    const finalPath = uniquePath(newFileFolder ? `${newFileFolder}/${name}` : name, paths);
    onChange([...files, { id: uid(), path: finalPath, type: "file", content: "" }]);
    // Phase 4a (Task 5): a new file under js/ auto-links <script src="js/..."></script>
    if (onJsChange && isJsFilePath(finalPath)) {
      onJsChange({ type: "create", name: fileNameOf(finalPath) });
      toast.success(`Script link added: js/${fileNameOf(finalPath)}`);
    }
    setNewFileFolder(null);
  };

  const uniquePath = (candidate, paths) => {
    if (!paths.has(candidate)) return candidate;
    let i = 1;
    let next = candidate;
    while (paths.has(next)) { next = candidate.replace(/(\.\w+)?$/, `-${i}$1`); i++; }
    return next;
  };

  const addAtRoot = (type) => {
    if (type === "folder") {
      const paths = new Set(files.map((f) => f.path));
      onChange([...files, { id: uid(), path: uniquePath("new-folder", paths), type, content: "" }]);
      return;
    }
    openNewFile("");
  };

  const addUnder = (folderPath, type) => {
    if (type === "folder") {
      const paths = new Set(files.map((f) => f.path));
      const candidate = folderPath ? `${folderPath}/folder` : "folder";
      onChange([...files, { id: uid(), path: uniquePath(candidate, paths), type, content: "" }]);
      return;
    }
    openNewFile(folderPath);
  };

  const remove = (path) => {
    onChange(files.filter((f) => f.path !== path && !f.path.startsWith(path + "/")));
    // Phase 4a (Task 5): deleting a js/ file removes its auto-linked script tag.
    if (onJsChange && isJsFilePath(path)) {
      onJsChange({ type: "delete", name: fileNameOf(path) });
      toast.success(`Script link removed: ${path}`);
    }
  };

  const rename = (path, next) => {
    if (!next || next === path) return;
    onChange(files.map((f) => {
      if (f.path === path) return { ...f, path: next };
      if (f.path.startsWith(path + "/")) return { ...f, path: next + f.path.slice(path.length) };
      return f;
    }));
    // Phase 4a (Task 5): renaming in/out of js/ re-points the script tag.
    if (onJsChange) {
      const before = isJsFilePath(path) ? fileNameOf(path) : null;
      const after = isJsFilePath(next) ? fileNameOf(next) : null;
      if (before && after && before !== after) {
        onJsChange({ type: "rename", oldName: before, name: after });
        toast.success(`Script link updated: js/${after}`);
      } else if (before && !after) {
        onJsChange({ type: "delete", name: before });
        toast.info(`Script link removed (file left js/): ${before}`);
      } else if (!before && after) {
        onJsChange({ type: "create", name: after });
        toast.success(`Script link added: js/${after}`);
      }
    }
  };

  // Same fix as "New file" above: double-clicking a file used to call
  // window.prompt() directly from TreeNode, which silently no-ops in
  // contexts without native blocking dialogs.
  const [renamePath, setRenamePath] = useState(null); // null = closed; else the file path being renamed
  const [renameValue, setRenameValue] = useState("");
  const openRename = (path) => { setRenamePath(path); setRenameValue(path.split("/").pop()); };
  const confirmRename = () => {
    const nn = renameValue.trim();
    if (!nn || !renamePath) { setRenamePath(null); return; }
    rename(renamePath, renamePath.replace(/[^/]+$/, nn));
    setRenamePath(null);
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
          const content = await readFileContent(f);
          collected.push({ id: uid(), path: importedPath(f, ""), type: "file", content, isImage: isImageFile(f) });
        }
      }
    }
    const { next, imported, skipped } = mergeImported(collected, files);
    onChange(next);
    toast.success(`Imported ${imported} entr${imported === 1 ? "y" : "ies"}${skipped ? `, skipped ${skipped}` : ""}`);
  };

  const onFilePick = async (e) => {
    const list = Array.from(e.target.files || []);
    const collected = [];
    for (const f of list) {
      const rel = isImageFile(f) ? `imgs/${f.name}` : (f.webkitRelativePath || f.name);
      const content = await readFileContent(f);
      collected.push({ id: uid(), path: rel, type: "file", content, isImage: isImageFile(f) });
    }
    const { next, imported, skipped } = mergeImported(collected, files);
    onChange(next);
    toast.success(`Imported ${imported} file${imported === 1 ? "" : "s"}${skipped ? `, skipped ${skipped}` : ""}`);
    e.target.value = "";
    toast.success(`Imported ${collected.length} files`);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden" data-testid="file-tree">
      {pages.length > 0 && onSwitchPage && (
        <div className="flex-none border-b border-[#332D22]" data-testid="filetree-pages">
          <div className="px-3 py-2 text-[10px] uppercase tracking-wider text-[#948C79]">Pages</div>
          <div className="pb-1">
            {pages.map((p) => (
              <button
                key={p.id}
                onClick={() => onSwitchPage(p.id)}
                className={`w-full flex items-center gap-1.5 px-3 py-1 text-xs text-left ${p.id === activePageId ? "text-[#F1EDE2] bg-[#242019]" : "text-[#A79C87] hover:text-[#F1EDE2] hover:bg-[#242019]"}`}
                data-testid={`filetree-page-${p.id}`}
              >
                <FileText size={12} className="flex-none" />
                <span className="truncate flex-1">{p.name || "Untitled"}</span>
                <span className="text-[10px] text-[#6B6353] flex-none">{p.slug === "index" ? "/" : `/${p.slug || ""}`}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="px-3 py-2 border-b border-[#332D22] flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-wider text-[#948C79]">Project files</div>
        <div className="flex items-center gap-1">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={onFilePick}
            className="hidden"
            data-testid="tree-folder-picker"
          />
          <button onClick={() => fileInputRef.current && fileInputRef.current.click()} className="p-1 text-[#A79C87] hover:text-[#F1EDE2]" title="Upload folder" data-testid="tree-upload-folder">
            <Upload size={12} />
          </button>
          <button onClick={() => addAtRoot("file")} className="p-1 text-[#A79C87] hover:text-[#F1EDE2]" title="New file" data-testid="tree-new-file">
            <FilePlus size={12} />
          </button>
          <button onClick={() => addAtRoot("folder")} className="p-1 text-[#A79C87] hover:text-[#F1EDE2]" title="New folder" data-testid="tree-new-folder">
            <FolderPlus size={12} />
          </button>
        </div>
      </div>
      <div
        className={`flex-1 overflow-y-auto p-1 relative ${dragging ? "bg-[#C9A227]/10 border-2 border-dashed border-[#C9A227]" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        data-testid="tree-dropzone"
      >
        {files.length === 0 ? (
          <div className="text-[11px] text-[#948C79] p-3 text-center">
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
            onRequestRename={openRename}
            onFileClick={onFileClick}
            onInsertHtml={onInsertHtml}
            onInsertAllHtml={onInsertAllHtml}
          />
        )}
      </div>

      <Dialog open={newFileFolder !== null} onOpenChange={(v) => !v && setNewFileFolder(null)}>
        <DialogContent className="bg-[#1C1A15] border border-[#332D22] text-[#F1EDE2] max-w-sm" data-testid="new-file-modal">
          <DialogHeader>
            <DialogTitle className="text-sm">New file{newFileFolder ? ` in ${newFileFolder}/` : ""}</DialogTitle>
            <DialogDescription className="text-xs text-[#948C79]">e.g. styles.css, script.js, page.html</DialogDescription>
          </DialogHeader>
          <input
            autoFocus
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            onFocus={(e) => e.target.select()}
            onKeyDown={(e) => { if (e.key === "Enter") confirmNewFile(); if (e.key === "Escape") setNewFileFolder(null); }}
            className="w-full bg-[#15130E] border border-[#332D22] rounded px-2.5 py-1.5 text-sm text-[#F1EDE2] outline-none focus:border-[#C9A227]"
            data-testid="new-file-name-input"
          />
          <div className="flex justify-end gap-2 mt-1">
            <button onClick={() => setNewFileFolder(null)} className="text-xs py-1.5 px-3 rounded bg-[#242019] hover:bg-[#332D22] text-[#F1EDE2] border border-[#332D22]" data-testid="new-file-cancel">Cancel</button>
            <button onClick={confirmNewFile} className="text-xs py-1.5 px-3 rounded bg-[#AD8B21] hover:bg-[#C9A227] text-[#F1EDE2]" data-testid="new-file-create">Create</button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={renamePath !== null} onOpenChange={(v) => !v && setRenamePath(null)}>
        <DialogContent className="bg-[#1C1A15] border border-[#332D22] text-[#F1EDE2] max-w-sm" data-testid="rename-file-modal">
          <DialogHeader>
            <DialogTitle className="text-sm">Rename file</DialogTitle>
            <DialogDescription className="text-xs text-[#948C79]">{renamePath}</DialogDescription>
          </DialogHeader>
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onFocus={(e) => e.target.select()}
            onKeyDown={(e) => { if (e.key === "Enter") confirmRename(); if (e.key === "Escape") setRenamePath(null); }}
            className="w-full bg-[#15130E] border border-[#332D22] rounded px-2.5 py-1.5 text-sm text-[#F1EDE2] outline-none focus:border-[#C9A227]"
            data-testid="rename-file-input"
          />
          <div className="flex justify-end gap-2 mt-1">
            <button onClick={() => setRenamePath(null)} className="text-xs py-1.5 px-3 rounded bg-[#242019] hover:bg-[#332D22] text-[#F1EDE2] border border-[#332D22]" data-testid="rename-file-cancel">Cancel</button>
            <button onClick={confirmRename} className="text-xs py-1.5 px-3 rounded bg-[#AD8B21] hover:bg-[#C9A227] text-[#F1EDE2]" data-testid="rename-file-confirm">Rename</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
