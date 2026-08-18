import React, { useEffect, useState } from "react";
import { ComponentThumbnail } from "./ComponentThumbnail";

// Shared animated hover-preview for any draggable HTML block card (Library,
// CDN tools, Forms, Shop, Snippets). Renders the block's real HTML through
// the same sandboxed-iframe thumbnail already used for the Saved tab, so the
// preview always matches actual output instead of a hand-built mockup.
export const useHoverPreview = () => {
  const [preview, setPreview] = useState(null);

  // The preview popover's own pointer-events:none doesn't reliably keep it
  // out of the way of an HTML5 drag-and-drop operation — iframes (used
  // here for the live thumbnail) can still intercept dragover/drop hit
  // testing in some browsers regardless of that CSS, since they have
  // their own separate rendering/input context. Drop the preview the
  // instant ANY drag starts anywhere on the page, so it's gone from the
  // DOM before the user drags over the canvas to drop.
  useEffect(() => {
    const onDragStart = () => setPreview(null);
    document.addEventListener("dragstart", onDragStart);
    return () => document.removeEventListener("dragstart", onDragStart);
  }, []);

  const previewProps = (html) => ({
    onMouseEnter: (e) => {
      if (!html) return;
      const r = e.currentTarget.getBoundingClientRect();
      const left = Math.max(8, r.left - 264 - 14);
      const top = Math.min(Math.max(8, r.top - 24), window.innerHeight - 236);
      setPreview({ html, top, left });
    },
    onMouseLeave: () => setPreview(null),
  });

  const previewNode = preview && (
    <div
      className="fixed z-[9999] pointer-events-none animate-in fade-in-0 zoom-in-95 duration-150"
      style={{ top: preview.top, left: preview.left }}
      data-testid="block-hover-preview"
    >
      <div className="rounded-lg overflow-hidden shadow-2xl ring-1 ring-black/50 bg-white">
        <ComponentThumbnail html={preview.html} width={264} height={200} scale={0.22} />
      </div>
    </div>
  );

  return { previewProps, previewNode };
};
