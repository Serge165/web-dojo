import React, { useMemo } from "react";
import { buildStandaloneHtml } from "@/lib/exportHtml";

// Simple code view. Left: read-only HTML output. Right: editable head_html.
export const CodeView = ({ project, headHtml, onHeadHtmlChange }) => {
  const html = useMemo(() => buildStandaloneHtml(project), [project]);
  return (
    <div className="flex-1 bg-[#050505] overflow-hidden flex" data-testid="code-view">
      <div className="w-1/2 border-r border-[#2B2B2B] flex flex-col">
        <div className="px-3 py-2 border-b border-[#2B2B2B] text-[11px] uppercase tracking-wider text-gray-400 flex items-center justify-between">
          <span>Output · index.html</span>
          <span className="font-mono text-[10px] text-gray-500">read-only</span>
        </div>
        <pre
          className="flex-1 overflow-auto m-0 p-4 text-[12px] leading-relaxed font-mono text-gray-200 whitespace-pre-wrap"
          data-testid="code-output"
        >{html}</pre>
      </div>
      <div className="w-1/2 flex flex-col">
        <div className="px-3 py-2 border-b border-[#2B2B2B] text-[11px] uppercase tracking-wider text-gray-400">
          &lt;head&gt; injection — add framework CDNs, meta tags, custom @font-face
        </div>
        <textarea
          value={headHtml}
          onChange={(e) => onHeadHtmlChange(e.target.value)}
          spellCheck={false}
          placeholder={`<!-- e.g. Tailwind CDN -->\n<script src="https://cdn.tailwindcss.com"></script>\n\n<!-- Custom font -->\n<style>\n  @font-face {\n    font-family: 'MyFont';\n    src: url('https://…/font.woff2') format('woff2');\n  }\n</style>`}
          className="flex-1 bg-[#050505] p-4 text-[12px] font-mono text-gray-100 outline-none resize-none"
          data-testid="head-html-textarea"
        />
      </div>
    </div>
  );
};
