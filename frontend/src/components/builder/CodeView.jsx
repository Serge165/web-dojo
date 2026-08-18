import React, { useEffect, useRef, useState } from "react";
import { CodeEditor } from "./CodeEditor";
import { buildStandaloneHtml, stripInlineStyles } from "@/lib/exportHtml";
import { reconcileElementsFromCss } from "@/lib/cssPaneSync";
import { reconcileElementsFromHtml } from "@/lib/htmlPaneSync";
import { MONACO_LANGUAGES } from "@/lib/monacoLanguages";

const SYNC_DEBOUNCE_MS = 400;

const uidForNewBlocks = () => "el_" + Math.random().toString(36).slice(2, 10);

// Browser-only HTML parsing (DOMParser) — deliberately not a pure/tested
// module, see htmlPaneSync.js's header comment for why. Produces the
// {id, outerHTML} shape reconcileElementsFromHtml expects.
const parseTopLevelNodes = (html) => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return Array.from(doc.body.children).map((el) => ({ id: el.id || null, outerHTML: el.outerHTML }));
};

// Stamps each element's id onto its own HTML's root tag before showing it
// in the HTML pane. parseTopLevelNodes reads ids back off the parsed DOM,
// and this is the only producer of that pane text, so the id must live
// inside el.html, not just in the array's .id field — otherwise every
// pane edit looks like brand-new markup on the way back in.
const withRootId = (html, id) => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const root = doc.body.firstElementChild;
  if (!root) return html;
  root.setAttribute("id", id); // el.id is the source of truth — overwrite, don't merge
  return doc.body.innerHTML;
};

const joinElementsHtml = (elements) => elements.map((e) => withRootId(e.html, e.id)).join("\n");

// Monaco-powered CodePen-style editor: four live-synced tabs (HTML, CSS,
// JS, Head) on the left, a live preview iframe on the right. Editing the
// HTML or CSS tab writes straight back into the project's elements array
// (debounced); editing JS edits the page's custom_js field; editing Head
// edits head_html exactly as it always has.
export const CodeView = ({ project, elements, onElementsChange, headHtml, onHeadHtmlChange, customJs, onCustomJsChange, onSave }) => {
  const [tab, setTab] = useState("html"); // html | css | js | head
  const [headLang, setHeadLang] = useState("html");

  const [htmlText, setHtmlText] = useState(() => joinElementsHtml(elements));
  const [cssText, setCssText] = useState(() => stripInlineStyles(elements).css);

  // Tracks the last `elements` value THIS component itself produced, so
  // the sync effect below can tell "an external change happened elsewhere
  // (Design-mode canvas edit, undo/redo, page switch) — regenerate the
  // pane text" apart from "this is our own debounced write echoing back
  // through props — don't regenerate, or we'd clobber in-progress typing
  // in the other pane."
  const lastAppliedElementsRef = useRef(elements);
  const htmlDebounceRef = useRef(null);
  const cssDebounceRef = useRef(null);

  useEffect(() => {
    if (elements === lastAppliedElementsRef.current) return;
    lastAppliedElementsRef.current = elements;
    // A genuine external change (undo/redo, page switch, Design-mode
    // canvas edit) invalidates any pending debounced pane edit — it was
    // going to reconcile against the OLD base and, if left armed, would
    // later fire and stomp this new external state with stale data.
    clearTimeout(htmlDebounceRef.current); htmlDebounceRef.current = null;
    clearTimeout(cssDebounceRef.current); cssDebounceRef.current = null;
    setHtmlText(joinElementsHtml(elements));
    setCssText(stripInlineStyles(elements).css);
  }, [elements]);

  useEffect(() => () => {
    clearTimeout(htmlDebounceRef.current);
    clearTimeout(cssDebounceRef.current);
  }, []);

  const commitElements = (next) => {
    lastAppliedElementsRef.current = next;
    onElementsChange(next);
  };

  const onHtmlChange = (value) => {
    setHtmlText(value);
    clearTimeout(htmlDebounceRef.current);
    htmlDebounceRef.current = setTimeout(() => {
      htmlDebounceRef.current = null;
      // Reconcile against lastAppliedElementsRef.current (the latest
      // committed base), not the `elements` prop closed over when this
      // callback was created — if the CSS pane committed a change while
      // this timer was pending, `elements` here is stale and reconciling
      // against it would silently discard that CSS commit.
      commitElements(reconcileElementsFromHtml(lastAppliedElementsRef.current, parseTopLevelNodes(value), uidForNewBlocks));
    }, SYNC_DEBOUNCE_MS);
  };

  const onCssChange = (value) => {
    setCssText(value);
    clearTimeout(cssDebounceRef.current);
    cssDebounceRef.current = setTimeout(() => {
      cssDebounceRef.current = null;
      commitElements(reconcileElementsFromCss(lastAppliedElementsRef.current, value));
    }, SYNC_DEBOUNCE_MS);
  };

  // Flushes any pending debounced pane edit immediately, so Ctrl+S can't
  // race a still-pending sync and save stale elements.
  const flushPending = () => {
    if (htmlDebounceRef.current) {
      clearTimeout(htmlDebounceRef.current);
      htmlDebounceRef.current = null;
      commitElements(reconcileElementsFromHtml(lastAppliedElementsRef.current, parseTopLevelNodes(htmlText), uidForNewBlocks));
    }
    if (cssDebounceRef.current) {
      clearTimeout(cssDebounceRef.current);
      cssDebounceRef.current = null;
      commitElements(reconcileElementsFromCss(lastAppliedElementsRef.current, cssText));
    }
  };
  const handleSave = () => { flushPending(); onSave && onSave(); };

  // Live preview, debounced on the same cycle regardless of which tab
  // changed (including Head/JS, which aren't behind the HTML/CSS
  // debounces above) so typing doesn't thrash an iframe reload.
  const [previewSrcDoc, setPreviewSrcDoc] = useState(() =>
    buildStandaloneHtml({ ...project, elements, head_html: headHtml, custom_js: customJs })
  );
  const previewDebounceRef = useRef(null);
  useEffect(() => {
    clearTimeout(previewDebounceRef.current);
    previewDebounceRef.current = setTimeout(() => {
      setPreviewSrcDoc(buildStandaloneHtml({ ...project, elements, head_html: headHtml, custom_js: customJs }));
    }, SYNC_DEBOUNCE_MS);
    return () => clearTimeout(previewDebounceRef.current);
  }, [project, elements, headHtml, customJs]);

  const Tab = ({ id, label }) => (
    <button
      onClick={() => setTab(id)}
      className={`px-2.5 py-1 rounded text-[11px] border ${tab === id ? "bg-blue-600 border-blue-500 text-white" : "border-[#2B2B2B] text-gray-400 hover:text-gray-200"}`}
      data-testid={`codeview-tab-${id}`}
    >{label}</button>
  );

  return (
    <div className="flex-1 bg-[#050505] overflow-hidden flex" data-testid="code-view">
      <div className="w-1/2 border-r border-[#2B2B2B] flex flex-col">
        <div className="px-3 py-2 border-b border-[#2B2B2B] flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Tab id="html" label="HTML" />
            <Tab id="css" label="CSS" />
            <Tab id="js" label="JS" />
            <Tab id="head" label="Head" />
          </div>
          {tab === "head" && <LangSelector value={headLang} onChange={setHeadLang} testId="head-lang" />}
        </div>
        <div className="flex-1 min-h-0">
          {tab === "html" && (
            <CodeEditor value={htmlText} onChange={onHtmlChange} language="html" onSave={handleSave} testId="code-html-editor" />
          )}
          {tab === "css" && (
            <CodeEditor value={cssText} onChange={onCssChange} language="css" onSave={handleSave} testId="code-css-editor" />
          )}
          {tab === "js" && (
            <CodeEditor value={customJs} onChange={onCustomJsChange} language="javascript" onSave={handleSave} testId="code-js-editor" />
          )}
          {tab === "head" && (
            <CodeEditor value={headHtml} onChange={onHeadHtmlChange} language={headLang} onSave={handleSave} testId="head-html-editor" />
          )}
        </div>
      </div>
      <div className="w-1/2 flex flex-col">
        <div className="px-3 py-2 border-b border-[#2B2B2B] text-[11px] uppercase tracking-wider text-gray-400">Preview</div>
        <div className="flex-1 min-h-0 bg-white">
          {/* allow-same-origin is intentionally NOT set here — same
              rationale as Builder.jsx's live-preview iframe: combined
              with allow-scripts it would give this srcDoc content the
              app's real origin instead of an opaque one, letting
              custom_js reach back into the builder's DOM/localStorage
              via window.parent. allow-scripts alone keeps the origin
              opaque. */}
          <iframe
            title="code-preview"
            srcDoc={previewSrcDoc}
            sandbox="allow-forms allow-scripts"
            style={{ width: "100%", height: "100%", border: 0 }}
            data-testid="code-preview-iframe"
          />
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
