import React, { useEffect, useRef } from "react";
import Editor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { emmetHTML, emmetCSS, emmetJSX } from "emmet-monaco-es";
import { CATEGORIES } from "@/lib/blocks";

// Mirrors stripInlineStyles.js's BLOCK_PREFIX_BY_CAT so we can derive each
// block's semantic marker class (block-<catId>-<slug>) for the "wrap in a
// .block" Monaco actions below, consistently with what exports emit.
const BLOCK_PREFIX_BY_CAT = {
  components: "cmp-",
  timelines: "cmp-timeline-",
  navbars: "nav-",
  headers: "hdr-",
  footers: "ft-",
  video: "video-",
  heroes: "hero-",
  sections: "section-",
  containers: "container-",
  text: "text-",
  toolbox: "tb-",
  pricing: "pricing-",
  team: "team-",
  faq: "faq-",
  newsletter: "newsletter-",
  portfolio: "portfolio-",
  layout: "layout-",
  services: "services-",
  contact: "contact-",
  testimonials: "testimonial-",
  esports: "esports-",
  creator: "creator-",
  retro: "retro-",
  parallax: "parallax-",
  social: "social-",
  comments: "comments-",
  zenero: "",
};

// block-<catId>-<slug>; slug = blockId with the category prefix stripped.
const blockClass = (catId, blockId) => {
  const p = BLOCK_PREFIX_BY_CAT[catId];
  const slug = p && blockId.startsWith(p) ? blockId.slice(p.length) : blockId;
  return `block-${catId}-${slug}`;
};

// Wrap the current selection (or the word under the cursor) in a
// `<span class="block {marker}">…</span>`. Registered per library block so
// the .block marker classes are one right-click / one Ctrl+Shift+P away in
// the Monaco editor — this is the "select all occurrences"-style quick
// access to the same semantic classes exports emit (see stripInlineStyles).
const registerBlockClassActions = (editor, monaco) => {
  CATEGORIES.forEach((cat) => {
    cat.blocks.forEach((b) => {
      const marker = blockClass(cat.id, b.id);
      const className = `block ${marker}`;
      editor.addAction({
        id: `wd.insert.blockclass.${cat.id}.${b.id}`,
        label: `Wrap with .${marker}`,
        // Grouped so all block-class actions sit together in the context
        // menu (and are individually searchable in the command palette).
        group: "Block classes",
        contextMenuGroupId: "word-operations",
        contextMenuOrder: 2,
        run: (ed) => {
          const sel = ed.getSelection();
          const model = ed.getModel();
          if (!model) return;
          const pos = sel.getStartPosition();
          let range = sel;
          // No explicit selection → expand to the current word so the wrap
          // still operates on a meaningful token.
          if (sel.isEmpty()) {
            const word = model.getWordUntilPosition(pos);
            range = new monaco.Range(pos.lineNumber, word.startColumn, pos.lineNumber, word.endColumn);
          }
          const selectedText = model.getValueInRange(range);
          const wrapped = `<span class="${className}">${selectedText || ""}</span>`;
          ed.executeEdits("wd.blockclass", [{ range, text: wrapped, forceMoveMarkers: true }]);
          ed.focus();
        },
      });
    });
  });
};

// Use the npm-bundled monaco-editor instead of @monaco-editor/react's
// default of fetching the whole editor from a CDN (cdn.jsdelivr.net) at
// runtime — required for the app to work offline and for the Tauri
// desktop build, which can't depend on a network fetch for its core
// editor. Must run once, before any <Editor> mounts, so it lives at
// module scope rather than inside the component.
loader.config({ monaco });

let emmetRegistered = false;

export const CodeEditor = ({ value, onChange, language = "html", readOnly = false, height = "100%", testId, onSave }) => {
  const editorRef = useRef(null);
  // onMount fires exactly once per editor instance (@monaco-editor/react
  // semantics), so the Ctrl+S command it registers below must not close
  // over `onSave` directly — that would freeze whatever save-callback
  // happened to exist at mount time forever, even though CodeView
  // recreates handleSave (closing over fresh elements/htmlText/cssText)
  // on every render. Route through a ref that's kept current instead.
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  const handleMount = (editor, monaco) => {
    editorRef.current = editor;
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      onSaveRef.current && onSaveRef.current();
    });
    // Ctrl+Shift+A → select all occurrences of the current selection/word.
    // Registered as a labelled ACTION (not just a key command) so it appears
    // in Monaco's command palette (Ctrl/Cmd+Shift+P) AND binds the
    // Ctrl/Cmd+Shift+A keybinding — both are first-class entry points.
    editor.addAction({
      id: "wd.selectAllOccurrences",
      label: "Select All Occurrences of Current Selection",
      // Ctrl/Cmd+Shift+A. Monaco's default "select all occurrences" lives on
      // Ctrl+Shift+L (editor.action.selectHighlights); we re-bind Shift+A to
      // the same built-in so it matches the Design-window shortcut.
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyA],
      contextMenuGroupId: "navigation",
      contextMenuOrder: 1,
      run: (ed) => {
        ed.trigger("web-dojo-select-all-occurrences", "editor.action.selectHighlights", null);
      },
    });
    // Expose every library .block marker class in the context menu / palette.
    registerBlockClassActions(editor, monaco);
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
        "editor.background": "#15130E",
        "editor.foreground": "#F1EDE2",
        "editor.lineHighlightBackground": "#242019",
        "editorLineNumber.foreground": "#6B6353",
        "editorGutter.background": "#15130E",
        "editorCursor.foreground": "#C9A227",
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
