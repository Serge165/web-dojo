import React, { useState } from "react";
import { ComponentThumbnail } from "./ComponentThumbnail";

// Shared hover-preview for any draggable HTML block card (Library, CDN
// tools, Forms, Shop, Snippets). Renders as a docked panel pinned to the
// bottom of the sidebar tab it's used in — NOT a floating/fixed-position
// overlay. WebKitGTK (Tauri's Linux renderer, used by the packaged
// desktop build) does not reliably let a pointer-events:none floating
// element pass drag-and-drop hit-testing through to whatever's under it
// the way Chromium does — a floating popup version of this component
// blocked drag-and-drop in the desktop app even though it worked fine in
// the browser. A docked panel sidesteps the whole problem: it never
// overlaps the canvas or any other draggable item, on any renderer.
export const useHoverPreview = () => {
  const [preview, setPreview] = useState(null); // { html } | null

  const previewProps = (html) => ({
    onMouseEnter: () => { if (html) setPreview({ html }); },
    onMouseLeave: () => setPreview(null),
  });

  const previewNode = (
    <div className="border-t border-[#332D22] bg-[#15130E] flex-none" data-testid="block-hover-preview">
      {preview ? (
        <div className="p-2">
          <div className="text-[10px] uppercase tracking-wider text-[#948C79] mb-1.5">Preview</div>
          <div className="rounded-lg overflow-hidden border border-[#332D22] bg-white">
            <ComponentThumbnail html={preview.html} width={232} height={140} scale={0.19} />
          </div>
        </div>
      ) : (
        <div className="p-3 text-[10px] text-[#6B6353] text-center">Hover a block to preview it here</div>
      )}
    </div>
  );

  return { previewProps, previewNode };
};
