import React, { useEffect, useRef, useState } from "react";
import { CodeEditor } from "./CodeEditor";
import { buildStandaloneHtml, stripInlineStyles, extractForgeCss } from "@/lib/exportHtml";
import { reconcileElementsFromCss } from "@/lib/cssPaneSync";
import { reconcileElementsFromHtml } from "@/lib/htmlPaneSync";
import { MONACO_LANGUAGES } from "@/lib/monacoLanguages";
import { Copy } from "lucide-react";
import { toast } from "sonner";

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

// Both panes are generated from ONE stripInlineStyles pass over the
// id-stamped elements, so the HTML tab always shows the same
// block-<cat>-<slug>-<occ> classes the CSS tab (and the real export,
// buildStandaloneHtml/buildMultiPageExport) assign for the same elements
// — previously the HTML tab bypassed stripInlineStyles entirely and just
// joined raw el.html, so it kept showing inline style="..." while the CSS
// tab already showed classes for the same blocks. classMap (returned
// alongside html/css) is what commitHtmlEdit below uses to reverse an
// edited pane back to real inline styles before it's written to elements.
//
// The CSS tab used to show ONLY this block css — none of the other
// globals.css sections (see GLOBALS_CSS_SPEC.md) that the real export
// actually produces from head_html's data-forge-* blocks: theme tokens,
// uploaded-font @font-face rules, imported CSS, per-element animation
// keyframes, responsive overrides. Editing a theme color or adding an
// animation silently never showed up here even though it does end up in
// the real globals.css. buildCssPaneText appends those sections (labeled,
// same order buildCleanExport uses) so this pane matches what actually
// ships. Extra sections are inert on write-back — reconcileElementsFromCss
// only recognizes classes in elements' own classMap and ignores the rest.
const buildCssPaneText = (blockCss, headHtml) => {
  const forge = extractForgeCss(headHtml || "");
  const sections = [
    ["Theme Variables", forge.themeVars.join("\n")],
    ["Base", forge.base.join("\n")],
    ["Blocks", blockCss],
    ["Components (imported)", forge.importedCss.join("\n")],
    ["Animations", forge.animations.join("\n")],
    ["Media Queries", forge.mediaQueries.join("\n")],
  ];
  return sections
    .filter(([, body]) => body && body.trim())
    .map(([label, body]) => `/* ===== ${label} ===== */\n${body}`)
    .join("\n\n");
};

const paneSource = (elements, headHtml) => {
  const { html, css } = stripInlineStyles(elements.map((e) => ({ ...e, html: withRootId(e.html, e.id) })));
  return { html, css: buildCssPaneText(css, headHtml) };
};

// elements[].html is always the real storage format (inline style="...",
// see stripInlineStyles.js's header comment) — the classed text the HTML
// pane displays is a display/export-only view, never itself persisted.
// So typing in the HTML pane (a content/structure edit) must not silently
// convert an element's stored html to the classed form, or its style
// values — and anything the CSS pane showed for them — would vanish the
// instant nothing in the app re-extracts them (most visibly for elements
// with no data-wd-cat/data-wd-block pair, i.e. legacy/imported markup,
// where the classed text has NO base styling anywhere to fall back on).
// For each synthetic class still present in the edited node that this
// element's OWN classMap entry actually produced (not just a same-named
// coincidence belonging to some other element), swap it back for the
// original style="..." declaration at that occurrence, pulled from the
// pre-edit html. A class the user genuinely typed (not in classMap for
// this id) is left untouched.
const reinlineEditedHtml = (elementId, oldHtml, newHtml, classMap) => {
  const oldDecls = (oldHtml.match(/style="([^"]*)"/g) || []).map((s) => s.slice(7, -1));
  return newHtml.replace(/class="([^"]*)"/g, (full, classAttr) => {
    const cls = classAttr.split(/\s+/).find((c) => {
      const hit = classMap.get(c);
      return hit && hit.elementId === elementId;
    });
    if (!cls) return full;
    const decl = oldDecls[classMap.get(cls).occurrence];
    return decl === undefined ? full : `style="${decl}"`;
  });
};

// Monaco-powered CodePen-style editor: four live-synced tabs (HTML, CSS,
// JS, Head) on the left. Editing the HTML or CSS tab writes straight back
// into the project's elements array (debounced); editing JS edits the
// page's custom_js field; editing Head edits head_html exactly as it
// always has.
//
// showPreview controls whether the live preview iframe renders alongside
// the editor: plain Code mode (showPreview=false) is editor-only and full
// width; Split View mode (showPreview=true) is this same component with
// the right-hand preview pane shown — one mechanism, not two competing
// preview implementations (the standalone top-level Preview mode is a
// separate, device-framed iframe using the same buildStandaloneHtml).
export const CodeView = ({ project, elements, onElementsChange, headHtml, onHeadHtmlChange, customJs, onCustomJsChange, onSave, showPreview = true }) => {
  const [tab, setTab] = useState("css"); // html | css | js | head — CSS first: it's the generated globals.css-equivalent, the thing most worth seeing by default
  const [headLang, setHeadLang] = useState("html");

  const [htmlText, setHtmlText] = useState(() => paneSource(elements, headHtml).html);
  const [cssText, setCssText] = useState(() => paneSource(elements, headHtml).css);

  // Tracks the last `elements`/`headHtml` value THIS component itself
  // produced, so the sync effect below can tell "an external change
  // happened elsewhere (Design-mode canvas edit, undo/redo, page switch,
  // a theme/animation/font applied via head_html) — regenerate the pane
  // text" apart from "this is our own debounced write echoing back
  // through props — don't regenerate, or we'd clobber in-progress typing
  // in the other pane."
  const lastAppliedElementsRef = useRef(elements);
  const lastAppliedHeadHtmlRef = useRef(headHtml);
  const htmlDebounceRef = useRef(null);
  const cssDebounceRef = useRef(null);

  useEffect(() => {
    const elementsChanged = elements !== lastAppliedElementsRef.current;
    const headChanged = headHtml !== lastAppliedHeadHtmlRef.current;
    if (!elementsChanged && !headChanged) return;
    lastAppliedHeadHtmlRef.current = headHtml;
    // A genuine external change (undo/redo, page switch, Design-mode
    // canvas edit, a theme/animation/font applied) invalidates any
    // pending debounced CSS-pane edit — it was going to reconcile against
    // the OLD base and, if left armed, would later fire and stomp this
    // new external state with stale data.
    clearTimeout(cssDebounceRef.current); cssDebounceRef.current = null;
    if (elementsChanged) {
      lastAppliedElementsRef.current = elements;
      clearTimeout(htmlDebounceRef.current); htmlDebounceRef.current = null;
    }
    const { html, css } = paneSource(elements, headHtml);
    if (elementsChanged) setHtmlText(html);
    setCssText(css);
  }, [elements, headHtml]);

  useEffect(() => () => {
    clearTimeout(htmlDebounceRef.current);
    clearTimeout(cssDebounceRef.current);
  }, []);

  const commitElements = (next) => {
    lastAppliedElementsRef.current = next;
    onElementsChange(next);
  };

  // Reconciles an HTML-pane edit into elements, reversing any synthetic
  // classes still present back to real inline styles first (reinlineEditedHtml)
  // so a pure content/structure edit can't erase styling the HTML pane never
  // actually lets you edit directly (that's the CSS pane's / Style tab's job).
  // Reconciles against lastAppliedElementsRef.current (the latest committed
  // base), not the `elements` prop closed over when the caller's callback was
  // created — if the CSS pane committed a change while a debounce was
  // pending, `elements` here would be stale and reconciling against it would
  // silently discard that CSS commit.
  const commitHtmlEdit = (value) => {
    const base = lastAppliedElementsRef.current;
    const { classMap } = stripInlineStyles(base);
    const byId = new Map(base.map((e) => [e.id, e.html]));
    const nodes = parseTopLevelNodes(value).map((node) => {
      const oldHtml = node.id && byId.get(node.id);
      return oldHtml ? { ...node, outerHTML: reinlineEditedHtml(node.id, oldHtml, node.outerHTML, classMap) } : node;
    });
    return reconcileElementsFromHtml(base, nodes, uidForNewBlocks);
  };

  const onHtmlChange = (value) => {
    setHtmlText(value);
    clearTimeout(htmlDebounceRef.current);
    htmlDebounceRef.current = setTimeout(() => {
      htmlDebounceRef.current = null;
      commitElements(commitHtmlEdit(value));
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
      commitElements(commitHtmlEdit(htmlText));
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
  // debounces above) so typing doesn't thrash an iframe reload. Skipped
  // entirely in plain Code mode (showPreview=false) — no point rebuilding
  // a srcdoc string on every keystroke for a pane that isn't rendered.
  const [previewSrcDoc, setPreviewSrcDoc] = useState(() =>
    showPreview ? buildStandaloneHtml({ ...project, elements, head_html: headHtml, custom_js: customJs }) : ""
  );
  const previewDebounceRef = useRef(null);
  useEffect(() => {
    if (!showPreview) return;
    clearTimeout(previewDebounceRef.current);
    previewDebounceRef.current = setTimeout(() => {
      setPreviewSrcDoc(buildStandaloneHtml({ ...project, elements, head_html: headHtml, custom_js: customJs }));
    }, SYNC_DEBOUNCE_MS);
    return () => clearTimeout(previewDebounceRef.current);
  }, [showPreview, project, elements, headHtml, customJs]);

  const Tab = ({ id, label }) => (
    <button
      onClick={() => setTab(id)}
      className={`px-2.5 py-1 rounded text-[11px] border ${tab === id ? "bg-[#AD8B21] border-[#C9A227] text-[#F1EDE2]" : "border-[#332D22] text-[#A79C87] hover:text-[#F1EDE2]"}`}
      data-testid={`codeview-tab-${id}`}
    >{label}</button>
  );

  return (
    <div className="flex-1 bg-[#050505] overflow-hidden flex" data-testid="code-view">
      <div className={showPreview ? "w-1/2 border-r border-[#332D22] flex flex-col" : "w-full flex flex-col"}>
        <div className="px-3 py-2 border-b border-[#332D22] flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Tab id="html" label="HTML" />
            <Tab id="css" label="CSS" />
            <Tab id="js" label="JS" />
            <Tab id="head" label="Head" />
          </div>
          <div className="flex items-center gap-2">
            {tab === "head" && <LangSelector value={headLang} onChange={setHeadLang} testId="head-lang" />}
            <button
              onClick={() => {
                const text = { html: htmlText, css: cssText, js: customJs, head: headHtml }[tab] || "";
                navigator.clipboard.writeText(text);
                toast.success(`${tab.toUpperCase()} copied`);
              }}
              className="flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-[#332D22] text-[#A79C87] hover:text-[#F1EDE2] hover:bg-[#242019]"
              title="Copy this tab's content"
              data-testid="codeview-copy-btn"
            ><Copy size={12} /> Copy</button>
          </div>
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
      {showPreview && (
        <div className="w-1/2 flex flex-col">
          <div className="px-3 py-2 border-b border-[#332D22] text-[11px] uppercase tracking-wider text-[#A79C87]">Preview</div>
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
      )}
    </div>
  );
};

const LangSelector = ({ value, onChange, testId }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="bg-[#15130E] border border-[#332D22] rounded px-1.5 py-0.5 text-[10px] text-[#F1EDE2] outline-none focus:border-[#C9A227] normal-case tracking-normal"
    data-testid={testId}
  >
    {MONACO_LANGUAGES.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
  </select>
);
