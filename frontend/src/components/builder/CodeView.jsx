import React, { useMemo, useState } from "react";
import { CodeEditor } from "./CodeEditor";
import { buildStandaloneHtml, buildCleanExport } from "@/lib/exportHtml";
import { MONACO_LANGUAGES } from "@/lib/monacoLanguages";

// Monaco-powered code view: left panel switches between clean HTML, a clean
// CSS3 stylesheet (auto-extracted), or the inline standalone file; right panel
// edits <head> with Emmet + user-selectable syntax highlighting.
export const CodeView = ({ project, headHtml, onHeadHtmlChange }) => {
  const [view, setView] = useState("html"); // html | css | inline
  const [outLang, setOutLang] = useState("html");
  const [headLang, setHeadLang] = useState("html");

  const clean = useMemo(() => buildCleanExport(project), [project]);
  const inline = useMemo(() => buildStandaloneHtml(project), [project]);
  const outContent = view === "css" ? clean.css : view === "inline" ? inline : clean.html;
  const outLangEff = view === "css" ? "css" : outLang;
  const filename = view === "css" ? "styles.css" : "index.html";

  const ViewTab = ({ id, label }) => (
    <button
      onClick={() => setView(id)}
      className={`px-2 py-0.5 rounded text-[10px] border ${view === id ? "bg-blue-600 border-blue-500 text-white" : "border-[#2B2B2B] text-gray-400 hover:text-gray-200"}`}
      data-testid={`codeview-${id}`}
    >{label}</button>
  );

  return (
    <div className="flex-1 bg-[#050505] overflow-hidden flex" data-testid="code-view">
      <div className="w-1/2 border-r border-[#2B2B2B] flex flex-col">
        <div className="px-3 py-2 border-b border-[#2B2B2B] text-[11px] uppercase tracking-wider text-gray-400 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <ViewTab id="html" label="HTML" />
            <ViewTab id="css" label="CSS" />
            <ViewTab id="inline" label="Inline" />
            <span className="text-gray-600 normal-case tracking-normal">· {filename}</span>
          </div>
          {view !== "css" && <LangSelector value={outLang} onChange={setOutLang} testId="output-lang" />}
        </div>
        <div className="flex-1 min-h-0">
          <CodeEditor value={outContent} language={outLangEff} readOnly testId="code-output-editor" />
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
