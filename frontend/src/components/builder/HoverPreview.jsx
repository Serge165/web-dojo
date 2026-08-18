import React, { useState } from "react";
import { ComponentThumbnail } from "./ComponentThumbnail";

// Shared animated hover-preview for any draggable HTML block card (Library,
// CDN tools, Forms, Shop, Snippets). Renders the block's real HTML through
// the same sandboxed-iframe thumbnail already used for the Saved tab, so the
// preview always matches actual output instead of a hand-built mockup.
export const useHoverPreview = () => {
  const [preview, setPreview] = useState(null);

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
