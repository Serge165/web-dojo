import React, { useMemo } from "react";
import { CodeEditor } from "./CodeEditor";
import { buildStandaloneHtml } from "@/lib/exportHtml";

// Monaco-powered code view: read-only preview + editable <head> injection with
// Emmet + syntax highlighting.
export const CodeView = ({ project, headHtml, onHeadHtmlChange }) => {
  const html = useMemo(() => buildStandaloneHtml(project), [project]);
  return (
    <div className="flex-1 bg-[#050505] overflow-hidden flex" data-testid="code-view">
      <div className="w-1/2 border-r border-[#2B2B2B] flex flex-col">
        <div className="px-3 py-2 border-b border-[#2B2B2B] text-[11px] uppercase tracking-wider text-gray-400 flex items-center justify-between">
          <span>Output · index.html</span>
          <span className="font-mono text-[10px] text-gray-500">read-only · syntax highlighted</span>
        </div>
        <div className="flex-1 min-h-0">
          <CodeEditor value={html} language="html" readOnly testId="code-output-editor" />
        </div>
      </div>
      <div className="w-1/2 flex flex-col">
        <div className="px-3 py-2 border-b border-[#2B2B2B] text-[11px] uppercase tracking-wider text-gray-400">
          &lt;head&gt; injection · type Emmet abbreviations then press Tab
        </div>
        <div className="flex-1 min-h-0">
          <CodeEditor value={headHtml} onChange={onHeadHtmlChange} language="html" testId="head-html-editor" />
        </div>
      </div>
    </div>
  );
};
