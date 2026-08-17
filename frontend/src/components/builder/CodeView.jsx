import React, { useMemo, useState } from "react";
import { CodeEditor } from "./CodeEditor";
import { buildStandaloneHtml } from "@/lib/exportHtml";
import { MONACO_LANGUAGES } from "@/lib/monacoLanguages";

// Monaco-powered code view: read-only preview (HTML) + editable <head>
// injection with Emmet + user-selectable syntax highlighting for popular
// web frameworks and languages (all Monaco built-in grammars).
export const CodeView = ({ project, headHtml, onHeadHtmlChange }) => {
  const html = useMemo(() => buildStandaloneHtml(project), [project]);
  const [outLang, setOutLang] = useState("html");
  const [headLang, setHeadLang] = useState("html");

  return (
    <div className="flex-1 bg-[#050505] overflow-hidden flex" data-testid="code-view">
      <div className="w-1/2 border-r border-[#2B2B2B] flex flex-col">
        <div className="px-3 py-2 border-b border-[#2B2B2B] text-[11px] uppercase tracking-wider text-gray-400 flex items-center justify-between gap-2">
          <span>Output · index.html</span>
          <LangSelector value={outLang} onChange={setOutLang} testId="output-lang" />
        </div>
        <div className="flex-1 min-h-0">
          <CodeEditor value={html} language={outLang} readOnly testId="code-output-editor" />
        </div>
      </div>
      <div className="w-1/2 flex flex-col">
        <div className="px-3 py-2 border-b border-[#2B2B2B] text-[11px] uppercase tracking-wider text-gray-400 flex items-center justify-between gap-2">
          <span>&lt;head&gt; · Emmet + syntax</span>
          <LangSelector value={headLang} onChange={setHeadLang} testId="head-lang" />
        </div>
        <div className="flex-1 min-h-0">
          <CodeEditor value={headHtml} onChange={onHeadHtmlChange} language={headLang} testId="head-html-editor" />
        </div>
      </div>
    </div>
  );
};

const LangSelector = ({ value, onChange, testId }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="bg-[#0D0D0D] border border-[#2B2B2B] rounded px-1.5 py-0.5 text-[10px] text-gray-200 outline-none focus:border-blue-500 normal-case tracking-normal"
    data-testid={testId}
  >
    {MONACO_LANGUAGES.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
  </select>
);
