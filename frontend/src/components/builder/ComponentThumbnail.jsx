import React from "react";

// Renders a scaled-down live preview of raw HTML inside a sandboxed iframe.
// The iframe's srcdoc contains the HTML plus a viewport meta and a transform
// on <body> so the preview mirrors the visual style at ~15% scale.
export const ComponentThumbnail = ({ html, width = 220, height = 120, scale = 0.18 }) => {
  const srcDoc = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=1200"><style>
html,body{margin:0;padding:0;background:#ffffff;}
body{width:1200px;transform:scale(${scale});transform-origin:0 0;pointer-events:none;}
img{max-width:none;}
</style></head><body>${html}</body></html>`;
  return (
    <iframe
      title="component thumbnail"
      srcDoc={srcDoc}
      sandbox=""
      loading="lazy"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        border: 0,
        background: "#ffffff",
        borderRadius: 6,
        display: "block",
        pointerEvents: "none",
      }}
      data-testid="component-thumb"
    />
  );
};
