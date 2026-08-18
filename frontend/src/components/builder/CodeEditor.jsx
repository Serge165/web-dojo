import React, { useEffect, useRef } from "react";
import Editor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { emmetHTML, emmetCSS, emmetJSX } from "emmet-monaco-es";

// Use the npm-bundled monaco-editor instead of @monaco-editor/react's
// default of fetching the whole editor from a CDN (cdn.jsdelivr.net) at
// runtime — required for the app to work offline and for the Tauri
// desktop build, which can't depend on a network fetch for its core
// editor. Must run once, before any <Editor> mounts, so it lives at
// module scope rather than inside the component.
loader.config({ monaco });

let emmetRegistered = false;

export const CodeEditor = ({ value, onChange, language = "html", readOnly = false, height = "100%", testId }) => {
  const editorRef = useRef(null);

  const handleMount = (editor, monaco) => {
    editorRef.current = editor;
    if (!emmetRegistered) {
      // Register emmet abbreviation expansion (Tab) for HTML, CSS, and
      // JS/TS. JS/TS use the dedicated emmetJSX engine (className=, JSX
      // expansion rules) rather than emmetHTML (class=, HTML rules) — a
      // JS/TS pane fed HTML-flavored Emmet would expand abbreviations
      // with the wrong attribute conventions.
      try {
        emmetHTML(monaco, ["html", "twig"]);
        emmetCSS(monaco, ["css", "scss", "less"]);
        emmetJSX(monaco, ["javascript", "typescript"]);
        emmetRegistered = true;
      } catch (e) {
        console.warn("emmet register failed", e);
      }
    }
    // Tailored dark theme so it matches our IDE shell
    monaco.editor.defineTheme("forge-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "tag", foreground: "8be9fd" },
        { token: "attribute.name.html", foreground: "f1fa8c" },
        { token: "attribute.value.html", foreground: "50fa7b" },
        { token: "string", foreground: "50fa7b" },
        { token: "comment", foreground: "6b7280", fontStyle: "italic" },
        { token: "keyword", foreground: "ff79c6" },
      ],
      colors: {
        "editor.background": "#050505",
        "editor.foreground": "#e5e7eb",
        "editor.lineHighlightBackground": "#0d0d0d",
        "editorLineNumber.foreground": "#3f3f46",
        "editorGutter.background": "#050505",
        "editorCursor.foreground": "#60a5fa",
      },
    });
    monaco.editor.setTheme("forge-dark");
  };

  return (
    <div style={{ height, width: "100%" }} data-testid={testId || "code-editor"}>
      <Editor
        value={value}
        onChange={(v) => onChange && onChange(v || "")}
        language={language}
        theme="forge-dark"
        onMount={handleMount}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 12,
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          lineNumbers: "on",
          renderLineHighlight: "line",
          scrollBeyondLastLine: false,
          wordWrap: "on",
          automaticLayout: true,
          padding: { top: 12, bottom: 12 },
          tabSize: 2,
          bracketPairColorization: { enabled: true },
        }}
      />
    </div>
  );
};
