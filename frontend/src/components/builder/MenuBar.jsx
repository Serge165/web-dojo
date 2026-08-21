import React, { useEffect, useRef, useState } from "react";
import { downloadStandalone, downloadZip } from "@/lib/exportHtml";

// Classic desktop-app dropdown menu bar (File/Edit/Find/View/Help). Sits
// below TopBar as a secondary, thinner affordance — it calls the same
// handlers TopBar already uses rather than duplicating logic.
export const MenuBar = ({
  project,
  onNew, onOpen, onSave,
  onUndo, onRedo, canUndo, canRedo,
  onCut, onCopy, onPaste, hasSelection,
  onSearchBlocks, onFindReplace,
  zoom, onZoomIn, onZoomOut, onZoomReset,
  onHelpTour, onOpenPalette,
}) => {
  const [openMenu, setOpenMenu] = useState(null);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!openMenu) return;
    const onDocDown = (e) => { if (!rootRef.current?.contains(e.target)) setOpenMenu(null); };
    const onKey = (e) => { if (e.key === "Escape") setOpenMenu(null); };
    document.addEventListener("mousedown", onDocDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDocDown); document.removeEventListener("keydown", onKey); };
  }, [openMenu]);

  const run = (fn) => { setOpenMenu(null); fn && fn(); };

  const menus = [
    {
      id: "file", label: "File", items: [
        { label: "New", onClick: onNew },
        { label: "Open…", onClick: onOpen },
        { label: "Save", shortcut: "Ctrl+S", onClick: onSave },
        { sep: true },
        { label: "Export standalone .html", onClick: () => downloadStandalone(project) },
        { label: "Export HTML + CSS (.zip)", onClick: () => downloadZip(project) },
      ],
    },
    {
      id: "edit", label: "Edit", items: [
        { label: "Undo", shortcut: "Ctrl+Z", disabled: !canUndo, onClick: onUndo },
        { label: "Redo", shortcut: "Ctrl+Y", disabled: !canRedo, onClick: onRedo },
        { sep: true },
        { label: "Cut", shortcut: "Ctrl+X", disabled: !hasSelection, onClick: onCut },
        { label: "Copy", shortcut: "Ctrl+C", disabled: !hasSelection, onClick: onCopy },
        { label: "Paste", shortcut: "Ctrl+V", onClick: onPaste },
      ],
    },
    {
      id: "find", label: "Find", items: [
        { label: "Search Blocks", onClick: onSearchBlocks },
        { label: "Find & Replace…", shortcut: "Ctrl+F", onClick: onFindReplace },
      ],
    },
    {
      id: "view", label: "View", items: [
        { label: "Command Palette…", shortcut: "Ctrl+K", onClick: onOpenPalette },
        { sep: true },
        { label: "Zoom In", onClick: onZoomIn },
        { label: "Zoom Out", onClick: onZoomOut },
        { label: `Reset Zoom (${zoom}%)`, onClick: onZoomReset },
      ],
    },
    {
      id: "help", label: "Help", items: [
        { label: "Getting Started Tour", onClick: onHelpTour },
      ],
    },
  ];

  return (
    <div ref={rootRef} className="h-7 flex-none border-b border-[#2B2B2B] bg-[#141414] flex items-center px-2 gap-0.5 relative" data-testid="menu-bar">
      {menus.map((m) => (
        <div key={m.id} className="relative">
          <button
            onClick={() => setOpenMenu((v) => (v === m.id ? null : m.id))}
            className={`text-[11px] px-2.5 py-1 rounded ${openMenu === m.id ? "bg-[#2B2B2B] text-white" : "text-gray-400 hover:text-gray-200 hover:bg-[#1F1F1F]"}`}
            data-testid={`menu-${m.id}`}
          >{m.label}</button>
          {openMenu === m.id && (
            <div className="absolute left-0 top-7 w-56 bg-[#141414] border border-[#2B2B2B] rounded-md py-1 z-50 shadow-2xl" data-testid={`menu-${m.id}-panel`}>
              {m.items.map((item, i) => item.sep ? (
                <div key={i} className="h-px bg-[#2B2B2B] my-1" />
              ) : (
                <button
                  key={item.label}
                  disabled={item.disabled}
                  onClick={() => run(item.onClick)}
                  className="w-full flex items-center justify-between text-left text-xs px-3 py-1.5 text-gray-200 hover:bg-[#1F1F1F] disabled:opacity-30 disabled:cursor-not-allowed"
                  data-testid={`menu-${m.id}-${item.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                >
                  <span>{item.label}</span>
                  {item.shortcut && <span className="text-gray-500 font-mono text-[10px]">{item.shortcut}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
