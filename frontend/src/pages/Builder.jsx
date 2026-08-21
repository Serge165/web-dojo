import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { TopBar } from "@/components/builder/TopBar";
import { MenuBar } from "@/components/builder/MenuBar";
import { CommandPalette } from "@/components/builder/CommandPalette";
import { StatusBar } from "@/components/builder/StatusBar";
import { LeftSidebar } from "@/components/builder/LeftSidebar";
import { RightSidebar } from "@/components/builder/RightSidebar";
import { Canvas } from "@/components/builder/Canvas";
import { CodeView } from "@/components/builder/CodeView";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Trash2, Eye, MousePointer2, Code2, Columns2, Presentation,
  FilePlus2, FolderOpen, Save, Download, Upload, Search, Palette, BarChart3, LayoutTemplate, Inbox, HelpCircle,
  Undo2, Redo2, Scissors, Copy, ClipboardPaste, ZoomIn, ZoomOut, RotateCcw, Monitor, Tablet, Smartphone,
} from "lucide-react";
import { OutlineView } from "@/components/builder/OutlineView";
import { PublishModal } from "@/components/builder/PublishModal";
import { OnboardingTour } from "@/components/builder/OnboardingTour";
import { PagesBar } from "@/components/builder/PagesBar";
import { TemplateEditor } from "@/components/builder/TemplateEditor";
import { SeoPanel } from "@/components/builder/SeoPanel";
import { FindReplaceModal } from "@/components/builder/FindReplaceModal";
import { FileEditorModal } from "@/components/builder/FileEditorModal";
import { AssetsLibrary } from "@/components/builder/AssetsLibrary";
import { AnalyticsModal } from "@/components/builder/AnalyticsModal";
import { ProjectTemplatesModal } from "@/components/builder/ProjectTemplatesModal";
import { FormBuilderModal } from "@/components/builder/FormBuilderModal";
import { AddPageModal } from "@/components/builder/AddPageModal";
import { PaymentButtonModal } from "@/components/builder/PaymentButtonModal";
import { StreamEmbedModal } from "@/components/builder/StreamEmbedModal";
import { SocialShareModal } from "@/components/builder/SocialShareModal";
import { ImportExportModal } from "@/components/builder/ImportExportModal";
import { SubmissionsModal } from "@/components/builder/SubmissionsModal";
import { buildStandaloneHtml, downloadStandalone, downloadZip } from "@/lib/exportHtml";
import { buildCartRuntimeHtml } from "@/lib/cart";
import { scanHtml } from "@/lib/importHtml";
import { escText } from "@/lib/escapeHtml";
import { upsertRootVar, removeRootVarsForElement } from "@/lib/rootVars";
import { upsertResponsiveOverridesCss } from "@/lib/responsiveOverrides";
import { upsertAnalyticsHead } from "@/lib/analyticsSnippets";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const uid = () => "el_" + Math.random().toString(36).slice(2, 10);

// Merge a patch of CSS declarations into the first inline style="…" attribute.
const patchFirstStyle = (html, patch) => {
  if (/style="([^"]*)"/.test(html)) {
    return html.replace(/style="([^"]*)"/, (_, styles) => {
      const parts = styles.split(";").map((s) => s.trim()).filter(Boolean);
      const map = {};
      parts.forEach((p) => { const i = p.indexOf(":"); if (i > 0) map[p.slice(0, i).trim()] = p.slice(i + 1).trim(); });
      Object.assign(map, patch);
      return `style="${Object.entries(map).map(([k, v]) => `${k}: ${v}`).join("; ")}"`;
    });
  }
  const styleStr = Object.entries(patch).map(([k, v]) => `${k}: ${v}`).join("; ");
  return html.replace(/<([a-zA-Z][^ >]*)(\s|>)/, (_, tag, s) => `<${tag} style="${styleStr}"${s}`);
};

// Add a class to the first/root tag (used when pasting hover effects).
const addClassToFirstTag = (html, cls) => {
  const m = html.match(/^\s*<([a-zA-Z][\w-]*)([^>]*)>/);
  if (!m) return html;
  const [full, tag, attrs] = m;
  const newAttrs = /class="/.test(attrs)
    ? attrs.replace(/class="([^"]*)"/, (mm, c) => `class="${c} ${cls}"`)
    : `${attrs} class="${cls}"`;
  return html.replace(full, `<${tag}${newAttrs}>`);
};

export default function Builder() {
  const [mode, setMode] = useState("design");
  const [viewport, setViewport] = useState("desktop");
  const [projectId, setProjectId] = useState(null);
  const [projectName, setProjectName] = useState("Untitled");
  const [elements, setElements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [canvasBg, setCanvasBg] = useState("#ffffff");
  const [headHtml, setHeadHtml] = useState("");
  const [customJs, setCustomJs] = useState("");
  const [fonts, setFonts] = useState([]);
  const [files, setFiles] = useState([]);
  const [savedComponents, setSavedComponents] = useState([]);
  const [loadOpen, setLoadOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [importOpen, setImportOpen] = useState(false);
  const [importedSections, setImportedSections] = useState([]);
  const [publishOpen, setPublishOpen] = useState(false);
  const [tourForce, setTourForce] = useState(0);

  // Multi-page + template + panels state.
  const [pages, setPages] = useState(() => [{ id: "home", name: "Home", slug: "index", status: "draft", seo: {}, elements: [], head_html: "", canvas_bg: "#ffffff", fonts: [], custom_js: "" }]);
  const [activePageId, setActivePageId] = useState("home");
  const [template, setTemplate] = useState({ header_html: "", footer_html: "", use_template: false });
  const [analytics, setAnalytics] = useState({});
  const [findOpen, setFindOpen] = useState(false);
  const [editingFileId, setEditingFileId] = useState(null);
  const [assetsOpen, setAssetsOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [formBuilderOpen, setFormBuilderOpen] = useState(false);
  const [addPageOpen, setAddPageOpen] = useState(false);
  const [paymentBuilderOpen, setPaymentBuilderOpen] = useState(false);
  const [socialBuilderOpen, setSocialBuilderOpen] = useState(false);
  const [streamEmbedOpen, setStreamEmbedOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [templateEditorOpen, setTemplateEditorOpen] = useState(false);
  const [seoOpen, setSeoOpen] = useState(false);
  const [submissionsOpen, setSubmissionsOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const clipboardRef = useRef(null);
  const [outlineSlides, setOutlineSlides] = useState([]);

  // Undo/Redo history stack for the doc state.
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const skipHistory = useRef(false);
  const pastRef = useRef(past);
  const futureRef = useRef(future);
  useEffect(() => { pastRef.current = past; }, [past]);
  useEffect(() => { futureRef.current = future; }, [future]);

  const doc = useMemo(() => ({ elements, canvasBg, headHtml, fonts, files, customJs }), [elements, canvasBg, headHtml, fonts, files, customJs]);
  const docRef = useRef(doc);
  useEffect(() => { docRef.current = doc; }, [doc]);

  // Push previous state on every change (unless we're in the middle of undo/redo).
  const prevDoc = useRef(doc);
  useEffect(() => {
    if (skipHistory.current) { skipHistory.current = false; prevDoc.current = doc; return; }
    if (prevDoc.current === doc) return;
    const snapshot = prevDoc.current; // capture BEFORE the ref is reassigned
    prevDoc.current = doc;
    setPast((p) => [...p.slice(-49), snapshot]);
    setFuture([]);
  }, [doc]);

  // Autosave: silently persist ~2.5s after the user stops editing.
  // Independent of the undo/redo history effect above — an undo/redo is a
  // perfectly good thing to autosave too, unlike history itself, which
  // must not record its own transitions.
  const [saveStatus, setSaveStatus] = useState("idle"); // idle | unsaved | saving | saved | error
  const autosaveTimerRef = useRef(null);
  const prevAutosaveDocRef = useRef(doc);
  useEffect(() => {
    if (prevAutosaveDocRef.current === doc) return;
    prevAutosaveDocRef.current = doc;
    setSaveStatus("unsaved");
    clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => { persist(true); }, 2500);
    // persist/project are intentionally omitted: `project` is a fresh
    // object literal every render, so listing it would reset this timer
    // on every re-render (not just real edits) and the debounce would
    // never actually fire during active use.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc]);
  useEffect(() => () => clearTimeout(autosaveTimerRef.current), []);

  const undo = () => {
    const p = pastRef.current;
    if (p.length === 0) return;
    const prev = p[p.length - 1];
    skipHistory.current = true;
    setFuture((f) => [docRef.current, ...f].slice(0, 50));
    setPast(p.slice(0, -1));
    setElements(prev.elements); setCanvasBg(prev.canvasBg); setHeadHtml(prev.headHtml); setFonts(prev.fonts); setFiles(prev.files || []); setCustomJs(prev.customJs || "");
  };
  const redo = () => {
    const f = futureRef.current;
    if (f.length === 0) return;
    const next = f[0];
    skipHistory.current = true;
    setPast((p) => [...p, docRef.current]);
    setFuture(f.slice(1));
    setElements(next.elements); setCanvasBg(next.canvasBg); setHeadHtml(next.headHtml); setFonts(next.fonts); setFiles(next.files || []); setCustomJs(next.customJs || "");
  };

  const selected = useMemo(() => elements.find((e) => e.id === selectedId) || null, [elements, selectedId]);

  // Keep the active page's snapshot in sync with the editing state.
  useEffect(() => {
    setPages((ps) => ps.map((p) => p.id === activePageId ? { ...p, elements, head_html: headHtml, canvas_bg: canvasBg, fonts, custom_js: customJs } : p));
  }, [elements, headHtml, canvasBg, fonts, customJs, activePageId]);

  const activePage = useMemo(() => pages.find((p) => p.id === activePageId) || pages[0], [pages, activePageId]);

  const project = {
    id: projectId,
    name: projectName,
    // legacy top-level fields mirror the active page for backward compat
    elements, head_html: headHtml, canvas_bg: canvasBg, fonts, files, custom_js: customJs,
    seo: activePage?.seo || {},
    pages, active_page_id: activePageId, template, analytics,
  };

  // ------------- Page ops -------------
  const switchPage = (id) => {
    const target = pages.find((p) => p.id === id);
    if (!target || id === activePageId) return;
    // Persist current edits into pages first (effect will run, but this keeps immediate state clean)
    setPages((ps) => ps.map((p) => p.id === activePageId ? { ...p, elements, head_html: headHtml, canvas_bg: canvasBg, fonts, custom_js: customJs } : p));
    setActivePageId(id);
    setElements(target.elements || []);
    setHeadHtml(target.head_html || "");
    setCanvasBg(target.canvas_bg || "#ffffff");
    setFonts(target.fonts || []);
    setCustomJs(target.custom_js || "");
    setSelectedId(null);
  };
  const newPage = () => {
    const id = uid();
    const name = `Page ${pages.length + 1}`;
    setPages((ps) => {
      const persisted = ps.map((p) => p.id === activePageId ? { ...p, elements, head_html: headHtml, canvas_bg: canvasBg, fonts, custom_js: customJs } : p);
      return [...persisted, { id, name, slug: name.toLowerCase().replace(/\s+/g, "-"), status: "draft", seo: {}, elements: [], head_html: "", canvas_bg: "#ffffff", fonts: [], custom_js: "" }];
    });
    setActivePageId(id);
    setElements([]);
    setHeadHtml("");
    setCanvasBg("#ffffff");
    setFonts([]);
    setCustomJs("");
    setSelectedId(null);
  };
  const addPageFromLayout = (layout) => {
    const id = uid();
    const els = (layout.blocks || []).map((html) => ({ id: uid(), html }));
    const bg = layout.canvasBg || "#ffffff";
    const fnts = layout.fonts || [];
    setPages((ps) => {
      const persisted = ps.map((p) => p.id === activePageId ? { ...p, elements, head_html: headHtml, canvas_bg: canvasBg, fonts, custom_js: customJs } : p);
      return [...persisted, { id, name: layout.label, slug: layout.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""), status: "draft", seo: {}, elements: els, head_html: "", canvas_bg: bg, fonts: fnts, custom_js: "" }];
    });
    setActivePageId(id);
    setElements(els);
    setHeadHtml("");
    setCanvasBg(bg);
    setFonts(fnts);
    setCustomJs("");
    setSelectedId(null);
    toast.success(`Added "${layout.label}" page`);
  };
  // Outline "slide" -> real page, one h1(+p) page per slide, mirroring
  // addPageFromLayout but batched into a single setPages call.
  const generatePagesFromOutline = (slides) => {
    if (!slides || slides.length === 0) return;
    const newPages = slides.map((s) => {
      const title = s.title || "Untitled";
      const els = [{ id: uid(), html: `<h1 style="font-family:Manrope,sans-serif;font-size:48px;letter-spacing:-0.02em;margin:24px 32px;color:var(--fc-text, #0f172a);">${escText(title)}</h1>` }];
      if (s.body && s.body.trim()) {
        els.push({ id: uid(), html: `<p style="font-family:Manrope,sans-serif;font-size:16px;color:var(--fc-muted, #475569);margin:12px 32px;max-width:700px;line-height:1.6;">${escText(s.body)}</p>` });
      }
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || uid();
      return { id: uid(), name: title, slug, status: "draft", seo: {}, elements: els, head_html: "", canvas_bg: "#ffffff", fonts: [], custom_js: "" };
    });
    setPages((ps) => {
      const persisted = ps.map((p) => p.id === activePageId ? { ...p, elements, head_html: headHtml, canvas_bg: canvasBg, fonts, custom_js: customJs } : p);
      return [...persisted, ...newPages];
    });
    const first = newPages[0];
    setActivePageId(first.id);
    setElements(first.elements);
    setHeadHtml("");
    setCanvasBg("#ffffff");
    setFonts([]);
    setCustomJs("");
    setSelectedId(null);
    setMode("design");
    toast.success(`Generated ${newPages.length} page${newPages.length === 1 ? "" : "s"}`);
  };
  const removePage = (id) => {
    if (pages.length <= 1) { toast.error("Keep at least one page"); return; }
    const next = pages.filter((p) => p.id !== id);
    setPages(next);
    if (activePageId === id) {
      const t = next[0];
      setActivePageId(t.id);
      setElements(t.elements || []);
      setHeadHtml(t.head_html || "");
      setCanvasBg(t.canvas_bg || "#ffffff");
      setFonts(t.fonts || []);
      setCustomJs(t.custom_js || "");
      setSelectedId(null);
    }
  };
  const renamePage = (id, name) => setPages((ps) => ps.map((p) => p.id === id ? { ...p, name } : p));
  const setPageStatus = (id, status) => setPages((ps) => ps.map((p) => p.id === id ? { ...p, status } : p));
  const setPageSeo = (seo) => setPages((ps) => ps.map((p) => p.id === activePageId ? { ...p, seo } : p));

  // Load saved components on mount.
  useEffect(() => {
    axios.get(`${API}/components`).then((r) => setSavedComponents(r.data)).catch(() => {});
  }, []);

  const saveAsComponent = async (el) => {
    const name = prompt("Name this component", "My component");
    if (!name) return;
    try {
      const res = await axios.post(`${API}/components`, { name, html: el.html });
      setSavedComponents((c) => [res.data, ...c]);
      toast.success(`Saved “${name}”`);
    } catch { toast.error("Failed to save component"); }
  };

  const deleteSavedComponent = async (id) => {
    try {
      await axios.delete(`${API}/components/${id}`);
      setSavedComponents((c) => c.filter((x) => x.id !== id));
      toast.success("Component removed");
    } catch { toast.error("Delete failed"); }
  };

  const addBlock = useCallback((html, atIndex) => {
    const el = { id: uid(), html };
    setElements((els) => {
      const idx = typeof atIndex === "number" ? atIndex : els.length;
      const next = [...els]; next.splice(idx, 0, el); return next;
    });
    setSelectedId(el.id);
  }, []);

  const removeEl = (id) => {
    const next = elements.filter((e) => e.id !== id);
    setElements(next);
    if (selectedId === id) setSelectedId(null);
    // Drop that element's animation keyframes, per-element color vars, and
    // responsive overrides too, or they linger in headHtml forever (dead
    // CSS bloating every save/export).
    setHeadHtml((h) => upsertResponsiveOverridesCss(
      removeRootVarsForElement((h || "").replace(new RegExp(`<style data-forge-anim="${id}">[\\s\\S]*?<\\/style>\\n?`), ""), id),
      next
    ));
  };
  const moveEl = (id, delta) => {
    setElements((els) => {
      const i = els.findIndex((e) => e.id === id); if (i < 0) return els;
      const j = Math.max(0, Math.min(els.length - 1, i + delta)); if (i === j) return els;
      const next = [...els]; const [item] = next.splice(i, 1); next.splice(j, 0, item); return next;
    });
  };
  const dupEl = (id) => {
    setElements((els) => {
      const i = els.findIndex((e) => e.id === id); if (i < 0) return els;
      const next = [...els]; next.splice(i + 1, 0, { ...els[i], id: uid() }); return next;
    });
  };
  const copyEl = () => { if (selected) clipboardRef.current = selected.html; };
  const cutEl = () => { if (!selected) return; clipboardRef.current = selected.html; removeEl(selected.id); };
  const pasteEl = () => {
    if (!clipboardRef.current) return;
    const idx = elements.findIndex((e) => e.id === selectedId);
    addBlock(clipboardRef.current, idx >= 0 ? idx + 1 : undefined);
  };
  const zoomIn = () => setZoom((z) => Math.min(150, z + 10));
  const zoomOut = () => setZoom((z) => Math.max(50, z - 10));
  const zoomReset = () => setZoom(100);
  const newProject = () => {
    const hasUnsaved = saveStatus === "unsaved" || saveStatus === "error";
    if (hasUnsaved && !window.confirm("Discard unsaved changes and start a new project?")) return;
    window.location.reload();
  };
  const focusLibrarySearch = () => {
    document.querySelector('[data-testid="left-tab-library"]')?.click();
    setTimeout(() => document.querySelector('[data-testid="library-search"]')?.focus(), 0);
  };
  const toggleVisible = (id) => setElements((els) => els.map((e) => e.id === id ? { ...e, hidden: !e.hidden } : e));
  const setZIndex = (id, z) => setElements((els) => els.map((e) => e.id === id ? { ...e, zIndex: z } : e));
  const editHtml = (id, html) => setElements((els) => els.map((e) => e.id === id ? { ...e, html } : e));
  const replaceSelectedHtml = (html) => { if (!selected) return; editHtml(selected.id, html); };

  const editingFile = useMemo(() => files.find((f) => f.id === editingFileId) || null, [files, editingFileId]);
  const updateFileContent = (id, content) => setFiles((fs) => fs.map((f) => f.id === id ? { ...f, content } : f));

  // Wrap the currently selected element's HTML with a container div carrying
  // the provided CSS declarations (from the Layout builder's Grid/Flex tools).
  const wrapSelectionWithContainer = (containerStyle) => {
    if (!selected) return;
    const wrapped = `<div style="${containerStyle}">${selected.html}</div>`;
    editHtml(selected.id, wrapped);
    toast.success("Wrapped selection");
  };

  const patchStyle = (patch) => {
    if (!selected) return;
    setElements((els) => els.map((e) => e.id === selected.id ? { ...e, html: patchFirstStyle(e.html, patch) } : e));
  };
  // Picking a per-block color creates/updates a :root variable and points
  // the element at var(...) instead of hardcoding the literal inline —
  // otherwise every use of this picker silently converts a token-driven
  // block back into a hardcoded one, undoing theming on that block.
  const applyBackground = (value) => {
    if (!selected) return;
    const name = `--fc-${selected.id}-bg`;
    setHeadHtml((h) => upsertRootVar(h, name, value));
    patchStyle({ background: `var(${name})` });
  };
  const applyColor = (value) => {
    if (!selected) return;
    const name = `--fc-${selected.id}-text`;
    setHeadHtml((h) => upsertRootVar(h, name, value));
    patchStyle({ color: `var(${name})` });
  };
  // Reuse an EXISTING token (from the Tokens panel) directly — no new
  // variable, just point the block at it.
  const applyExistingToken = (name, property) => patchStyle({ [property]: `var(${name})` });
  const createToken = (name, value) => setHeadHtml((h) => upsertRootVar(h, name, value));

  // Tablet/mobile overrides — keyed by the current top-bar viewport, so
  // there's exactly one "which breakpoint am I editing" switch, not a
  // second one that could disagree with it. No-ops on desktop (that's the
  // base style, edited via patchStyle/Style tab instead).
  const patchResponsiveStyle = (patch) => {
    if (!selected || viewport === "desktop") return;
    const next = elements.map((e) => e.id === selected.id
      ? { ...e, responsive: { ...(e.responsive || {}), [viewport]: { ...((e.responsive || {})[viewport] || {}), ...patch } } }
      : e);
    setElements(next);
    setHeadHtml((h) => upsertResponsiveOverridesCss(h, next));
  };
  const resetResponsiveProperty = (property) => {
    if (!selected || viewport === "desktop") return;
    const next = elements.map((e) => {
      if (e.id !== selected.id || !e.responsive?.[viewport]) return e;
      const tier = { ...e.responsive[viewport] };
      delete tier[property];
      return { ...e, responsive: { ...e.responsive, [viewport]: tier } };
    });
    setElements(next);
    setHeadHtml((h) => upsertResponsiveOverridesCss(h, next));
  };

  // Paste a copied style (from lib/fxClipboard) onto many elements at once.
  const applyStyleToIds = useCallback((ids, clip) => {
    if (!ids || !ids.length || !clip) return;
    let head = headHtml;
    const classesToAdd = [];
    (clip.hover || []).forEach(({ cls, tpl }) => {
      if (cls && head.includes(`data-wd-tfx="${cls}"`)) { classesToAdd.push(cls); return; }
      if (tpl) {
        const nc = `wd-tfx-${Math.random().toString(36).slice(2, 7)}`;
        head += `${head ? "\n" : ""}<style data-wd-tfx="${nc}">${tpl.split("__CLS__").join(nc)}</style>`;
        classesToAdd.push(nc);
      } else if (cls) { classesToAdd.push(cls); }
    });
    if (head !== headHtml) setHeadHtml(head);
    setElements((els) => els.map((e) => {
      if (!ids.includes(e.id)) return e;
      let html = e.html;
      if (clip.style && Object.keys(clip.style).length) html = patchFirstStyle(html, clip.style);
      classesToAdd.forEach((c) => { if (!new RegExp(`\\b${c}\\b`).test(html)) html = addClassToFirstTag(html, c); });
      return { ...e, html };
    }));
  }, [headHtml]);

  const applyAnimation = ({ keyframes, shorthand }) => {
    if (!selected) return;
    setHeadHtml((h) => {
      // Replace any prior animation block for this element instead of
      // stacking a new one on every re-apply (re-picking a preset, tweaking
      // duration/easing, etc. would otherwise accumulate dead @keyframes).
      const stripped = (h || "").replace(new RegExp(`<style data-forge-anim="${selected.id}">[\\s\\S]*?<\\/style>\\n?`), "");
      return `${stripped ? stripped + "\n" : ""}<style data-forge-anim="${selected.id}">\n${keyframes}\n</style>`;
    });
    patchStyle({ animation: shorthand });
  };

  const applyTheme = ({ headHtml: themeHead, canvasBg: themeBg, googleFont, allPages }) => {
    // Strip any prior forge-theme style block, then append new.
    const rethemeHead = (h) => (h || "").replace(/<link[^>]*fonts\.googleapis[^>]*>|<style data-forge-theme=[^>]*>[\s\S]*?<\/style>/g, "").trim() + (h ? "\n" : "") + themeHead;
    setHeadHtml(rethemeHead);
    if (themeBg) setCanvasBg(themeBg);
    if (googleFont && !fonts.includes(googleFont)) setFonts((f) => [...f, googleFont]);

    // Site-wide cascade: push the same head vars/canvas bg/font onto every
    // other page too, not just the active one (the active page is already
    // handled above via the live editor state + the elements-sync effect).
    if (allPages) {
      setPages((ps) => ps.map((p) => p.id === activePageId ? p : {
        ...p,
        head_html: rethemeHead(p.head_html),
        canvas_bg: themeBg || p.canvas_bg,
        fonts: googleFont && !(p.fonts || []).includes(googleFont) ? [...(p.fonts || []), googleFont] : p.fonts,
      }));
    }
  };

  // Tracking snippets are always site-wide (unlike theme, no allPages
  // toggle needed — a GA4/Pixel/etc. tag on only one page isn't a real
  // use case), so this always cascades to every page.
  const applyAnalytics = (config) => {
    setAnalytics(config);
    setHeadHtml((h) => upsertAnalyticsHead(h, config));
    setPages((ps) => ps.map((p) => p.id === activePageId ? p : { ...p, head_html: upsertAnalyticsHead(p.head_html, config) }));
    toast.success("Tracking snippets applied to all pages");
  };

  const addFont = ({ family, google }) => {
    const label = family.split(",")[0].replace(/['"]/g, "").trim();
    if (fonts.includes(label)) { toast.info("Font already added"); return; }
    setFonts((f) => [...f, label]);
    if (google) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = `https://fonts.googleapis.com/css2?family=${label.replace(/\s+/g, "+")}:wght@300;400;500;600;700&display=swap`;
      link.setAttribute("data-forge-font", label);
      document.head.appendChild(link);
    }
    toast.success(`Added ${label}`);
  };

  const onImportSections = ({ headHtml: h, sections }) => {
    if (h) setHeadHtml((cur) => cur ? cur + "\n" + h : h);
    setImportedSections(sections); setImportOpen(true);
  };
  const insertImportedSection = (sec) => { addBlock(sec.html); toast.success(`Inserted ${sec.label}`); };

  // The Shop tab's "Add cart + checkout" button used to call onAddBlock
  // directly, so clicking it twice (e.g. after tweaking the accent/currency
  // fields right above it) stacked a second full cart runtime — duplicate
  // fixed-position buttons, duplicate non-unique DOM ids, duplicate
  // <style>/<script> blocks. Guard it the same way wireCatalog already
  // guards its own cart-runtime insert.
  const addCartRuntime = (opts) => {
    setElements((els) => {
      if (els.some((e) => /data-webdojo-cart/.test(e.html))) {
        setTimeout(() => toast.info("Cart already on this page"), 0);
        return els;
      }
      setTimeout(() => toast.success("Cart + checkout added — a floating cart button now lives on this page"), 0);
      return [...els, { id: uid(), html: buildCartRuntimeHtml(opts) }];
    });
  };

  // Best-effort: wire product "Add to cart / Buy" buttons on the page to the
  // live cart, and drop in the cart runtime if it isn't there yet.
  const wireCatalog = () => {
    const parse = (h, re) => { const m = h.match(re); return m ? m[1] : null; };
    setElements((els) => {
      let converted = 0;
      const next = els.map((el) => {
        const price = parse(el.html, /\$\s*(\d+(?:\.\d{1,2})?)/);
        const name = (parse(el.html, /<h[1-4][^>]*>([^<]{2,60})<\/h[1-4]>/i) || "Product").trim().replace(/"/g, "");
        const img = parse(el.html, /<img[^>]+src="([^"]+)"/i) || "";
        const html = el.html.replace(/<(a|button)((?:(?!data-wd-add)[^>])*)>(\s*(?:add to cart|add to bag|buy now|buy|add)[^<]*)<\/\1>/gi, (m, tag, attrs, text) => {
          converted++;
          return `<${tag}${attrs} data-wd-add data-wd-id="wc-${Math.random().toString(36).slice(2, 7)}" data-wd-name="${name}" data-wd-price="${price || 0}" data-wd-cur="usd" data-wd-img="${img}">${text}</${tag}>`;
        });
        return { ...el, html };
      });
      const hasCart = next.some((e) => /data-webdojo-cart/.test(e.html));
      const out = hasCart ? next : [...next, { id: uid(), html: buildCartRuntimeHtml({ accent: "#4f46e5", currency: "usd" }) }];
      setTimeout(() => toast.success(converted ? `Wired ${converted} button${converted === 1 ? "" : "s"} to the cart${hasCart ? "" : " + added a live cart"}` : (hasCart ? "Cart already on this page" : "Live cart added — use add-to-cart buttons to fill it")), 0);
      return out;
    });
    setSelectedId(null);
  };

  const onLoadProjectData = (data) => {
    if (!data || !data._webdojo) { toast.error("That file isn't a Web Dojo project"); return; }
    setProjectId(null);
    setProjectName(data.name || "Imported project");
    const src = (data.pages && data.pages.length) ? data.pages : [{ id: uid(), name: "Home", slug: "index", status: "draft", seo: {}, elements: [], head_html: "", canvas_bg: "#ffffff", fonts: [], custom_js: "" }];
    const nextPages = src.map((pg) => ({ ...pg, id: uid() }));
    setPages(nextPages);
    setActivePageId(nextPages[0].id);
    setElements(nextPages[0].elements || []);
    setHeadHtml(nextPages[0].head_html || "");
    setCanvasBg(nextPages[0].canvas_bg || "#ffffff");
    setFonts(nextPages[0].fonts || []);
    setCustomJs(nextPages[0].custom_js || "");
    setFiles(data.files || []);
    setSelectedId(null); setPast([]); setFuture([]);
    toast.success("Project imported");
  };

  const onImportUrl = async (url) => {
    const res = await axios.post(`${API}/import/url`, { url });
    const { headHtml: h, sections } = scanHtml(res.data.html || "");
    onImportSections({ headHtml: h, sections });
    return sections.length;
  };

  // Save/Load ------------------------------------------------------
  // silent=true (autosave) skips the success/error toasts so it doesn't
  // interrupt typing; the manual Save button (silent=false) keeps them.
  const persist = async (silent) => {
    setSaveStatus("saving");
    try {
      if (projectId) {
        await axios.put(`${API}/projects/${projectId}`, project);
      } else {
        const res = await axios.post(`${API}/projects`, project);
        setProjectId(res.data.id);
      }
      setSaveStatus("saved");
      if (!silent) toast.success("Project saved");
    } catch (e) {
      setSaveStatus("error");
      if (!silent) toast.error("Save failed");
      console.error(e);
    }
  };
  const save = () => { clearTimeout(autosaveTimerRef.current); persist(false); };

  const openLoad = async () => {
    try {
      const res = await axios.get(`${API}/projects`);
      setProjects(res.data); setLoadOpen(true);
    } catch { toast.error("Failed to fetch projects"); }
  };

  const loadProject = async (id) => {
    try {
      const res = await axios.get(`${API}/projects/${id}`);
      const p = res.data;
      setProjectId(p.id); setProjectName(p.name);
      // Hydrate pages (with legacy fallback).
      let nextPages;
      let activeId;
      if (p.pages && p.pages.length) {
        nextPages = p.pages.map((pg) => ({
          id: pg.id || uid(),
          name: pg.name || "Home",
          slug: pg.slug || "index",
          status: pg.status || "draft",
          seo: pg.seo || {},
          elements: (pg.elements || []).map((e) => ({ id: e.id || uid(), html: e.html, hidden: !!e.hidden, zIndex: e.zIndex || 0 })),
          head_html: pg.head_html || "",
          canvas_bg: pg.canvas_bg || "#ffffff",
          fonts: pg.fonts || [],
          custom_js: pg.custom_js || "",
        }));
        const found = nextPages.find((x) => x.id === p.active_page_id);
        activeId = found ? found.id : nextPages[0].id;
      } else {
        const homeId = uid();
        nextPages = [{
          id: homeId, name: p.name || "Home", slug: "index", status: "draft", seo: {},
          elements: (p.elements || []).map((e) => ({ id: e.id || uid(), html: e.html, hidden: !!e.hidden, zIndex: e.zIndex || 0 })),
          head_html: p.head_html || "", canvas_bg: p.canvas_bg || "#ffffff", fonts: p.fonts || [],
          custom_js: p.custom_js || "",
        }];
        activeId = homeId;
      }
      setPages(nextPages);
      setActivePageId(activeId);
      const active = nextPages.find((x) => x.id === activeId);
      setElements(active.elements || []);
      setHeadHtml(active.head_html || "");
      setCanvasBg(active.canvas_bg || "#ffffff");
      setFonts(active.fonts || []);
      setCustomJs(active.custom_js || "");
      setTemplate(p.template || { header_html: "", footer_html: "", use_template: false });
      setAnalytics(p.analytics || {});
      setFiles(p.files || []);
      setSelectedId(null); setLoadOpen(false); setPast([]); setFuture([]);
      toast.success(`Loaded ${p.name}`);
    } catch { toast.error("Failed to load"); }
  };

  // Load a saved project template as a fresh project.
  const loadFromTemplate = (tpl) => {
    const data = tpl.data || {};
    setProjectId(null);
    setProjectName(`${tpl.name} — copy`);
    const templatePages = (data.pages && data.pages.length) ? data.pages : [{
      id: uid(), name: "Home", slug: "index", status: "draft", seo: {},
      elements: data.elements || [], head_html: data.head_html || "",
      canvas_bg: data.canvas_bg || "#ffffff", fonts: data.fonts || [], custom_js: data.custom_js || "",
    }];
    const nextPages = templatePages.map((pg) => ({ ...pg, id: uid() }));
    setPages(nextPages);
    setActivePageId(nextPages[0].id);
    setElements(nextPages[0].elements || []);
    setHeadHtml(nextPages[0].head_html || "");
    setCanvasBg(nextPages[0].canvas_bg || "#ffffff");
    setFonts(nextPages[0].fonts || []);
    setCustomJs(nextPages[0].custom_js || "");
    setTemplate(data.template || { header_html: "", footer_html: "", use_template: false });
    setAnalytics(data.analytics || {});
    setFiles(data.files || []);
    setSelectedId(null); setPast([]); setFuture([]);
    toast.success(`Started new project from “${tpl.name}”`);
  };

  const deleteProject = async (id) => {
    try {
      await axios.delete(`${API}/projects/${id}`);
      setProjects((p) => p.filter((x) => x.id !== id));
      if (projectId === id) setProjectId(null);
      toast.success("Deleted");
    } catch { toast.error("Delete failed"); }
  };

  const share = async () => {
    try {
      let id = projectId;
      if (!id) {
        const res = await axios.post(`${API}/projects`, project); id = res.data.id; setProjectId(id);
      } else {
        await axios.put(`${API}/projects/${id}`, project);
      }
      const url = `${process.env.REACT_APP_BACKEND_URL}/api/preview/${id}`;
      await navigator.clipboard.writeText(url);
      toast.success("Preview URL copied to clipboard");
    } catch { toast.error("Share failed"); }
  };

  // Ensures the project is saved on the backend and returns its id so the
  // Publish modal can POST to /api/projects/{id}/publish.
  const ensureSaved = async () => {
    try {
      if (projectId) {
        await axios.put(`${API}/projects/${projectId}`, project);
        return projectId;
      }
      const res = await axios.post(`${API}/projects`, project);
      setProjectId(res.data.id);
      return res.data.id;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "z" && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if (meta && (e.key.toLowerCase() === "z" && e.shiftKey || e.key.toLowerCase() === "y")) { e.preventDefault(); redo(); return; }
      if (meta && e.key.toLowerCase() === "s") { e.preventDefault(); save(); return; }
      if (meta && e.key.toLowerCase() === "f") { e.preventDefault(); setFindOpen(true); return; }
      if (meta && e.key.toLowerCase() === "k") { e.preventDefault(); setPaletteOpen((v) => !v); return; }
      // Block-level cut/copy/paste — only when a block is selected and no
      // text field/contenteditable is focused, so normal browser copy/paste
      // inside inputs (project name, inline text editing, etc.) still works.
      if (meta && document.activeElement === document.body) {
        if (e.key.toLowerCase() === "c" && selectedId) { e.preventDefault(); copyEl(); return; }
        if (e.key.toLowerCase() === "x" && selectedId) { e.preventDefault(); cutEl(); return; }
        if (e.key.toLowerCase() === "v") { e.preventDefault(); pasteEl(); return; }
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId && document.activeElement === document.body) {
        e.preventDefault(); removeEl(selectedId);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }); // re-attach each render so closures use latest state

  // Command palette actions — thin dispatch layer over handlers TopBar/
  // MenuBar already call, so there's exactly one place each action lives.
  const paletteGroups = useMemo(() => [
    {
      heading: "File", items: [
        { id: "new", label: "New project", icon: FilePlus2, onRun: newProject },
        { id: "open", label: "Open project…", icon: FolderOpen, onRun: openLoad },
        { id: "save", label: "Save", shortcut: "Ctrl+S", icon: Save, onRun: save },
        { id: "export-html", label: "Export standalone .html", icon: Download, onRun: () => downloadStandalone(project) },
        { id: "export-zip", label: "Export HTML + CSS (.zip)", icon: Download, onRun: () => downloadZip(project) },
        { id: "share", label: "Copy shareable preview URL", icon: Upload, onRun: share },
        { id: "publish", label: "Publish…", icon: Upload, onRun: () => setPublishOpen(true) },
      ],
    },
    {
      heading: "Edit", items: [
        { id: "undo", label: "Undo", shortcut: "Ctrl+Z", icon: Undo2, disabled: past.length === 0, onRun: undo },
        { id: "redo", label: "Redo", shortcut: "Ctrl+Y", icon: Redo2, disabled: future.length === 0, onRun: redo },
        { id: "cut", label: "Cut selection", shortcut: "Ctrl+X", icon: Scissors, disabled: !selected, onRun: cutEl },
        { id: "copy", label: "Copy selection", shortcut: "Ctrl+C", icon: Copy, disabled: !selected, onRun: copyEl },
        { id: "paste", label: "Paste", shortcut: "Ctrl+V", icon: ClipboardPaste, onRun: pasteEl },
      ],
    },
    {
      heading: "Find", items: [
        { id: "search-blocks", label: "Search block library", icon: Search, onRun: focusLibrarySearch },
        { id: "find-replace", label: "Find & Replace…", shortcut: "Ctrl+F", icon: Search, onRun: () => setFindOpen(true) },
      ],
    },
    {
      heading: "View", items: [
        { id: "mode-design", label: "Switch to Design", icon: MousePointer2, onRun: () => setMode("design") },
        { id: "mode-code", label: "Switch to Code", icon: Code2, onRun: () => setMode("code") },
        { id: "mode-split", label: "Switch to Split View", icon: Columns2, onRun: () => setMode("split") },
        { id: "mode-outline", label: "Switch to Outline", icon: Presentation, onRun: () => setMode("outline") },
        { id: "mode-preview", label: "Switch to Preview", icon: Eye, onRun: () => setMode("preview") },
        { id: "viewport-desktop", label: "Viewport: Desktop", icon: Monitor, onRun: () => setViewport("desktop") },
        { id: "viewport-tablet", label: "Viewport: Tablet", icon: Tablet, onRun: () => setViewport("tablet") },
        { id: "viewport-mobile", label: "Viewport: Mobile", icon: Smartphone, onRun: () => setViewport("mobile") },
        { id: "zoom-in", label: "Zoom in", icon: ZoomIn, onRun: zoomIn },
        { id: "zoom-out", label: "Zoom out", icon: ZoomOut, onRun: zoomOut },
        { id: "zoom-reset", label: `Reset zoom (${zoom}%)`, icon: RotateCcw, onRun: zoomReset },
      ],
    },
    {
      heading: "Panels", items: [
        { id: "assets", label: "Design tokens", icon: Palette, onRun: () => setAssetsOpen(true) },
        { id: "analytics", label: "Analytics", icon: BarChart3, onRun: () => setAnalyticsOpen(true) },
        { id: "templates", label: "Project templates", icon: LayoutTemplate, onRun: () => setTemplatesOpen(true) },
        { id: "submissions", label: "Form submissions inbox", icon: Inbox, onRun: () => setSubmissionsOpen(true) },
      ],
    },
    {
      heading: "Help", items: [
        { id: "tour", label: "Getting Started Tour", icon: HelpCircle, onRun: () => setTourForce((v) => v + 1) },
      ],
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [project, past.length, future.length, selected, zoom]);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0D0D0D] text-white overflow-hidden text-sm" style={{ fontFamily: "Manrope, sans-serif" }} data-testid="builder-shell">
      <TopBar
        mode={mode} setMode={setMode}
        projectName={projectName} setProjectName={setProjectName}
        onImportSections={onImportSections}
        project={project}
        onOpenTransfer={() => setTransferOpen(true)}
        onSave={save} saveStatus={saveStatus} onOpenLoad={openLoad} onShare={share}
        onPublish={() => setPublishOpen(true)}
        onStartTour={() => setTourForce((v) => v + 1)}
        onFind={() => setFindOpen(true)}
        onAssets={() => setAssetsOpen(true)}
        onAnalytics={() => setAnalyticsOpen(true)}
        onTemplates={() => setTemplatesOpen(true)}
        onSubmissions={() => setSubmissionsOpen(true)}
        onUndo={undo} onRedo={redo}
        canUndo={past.length > 0} canRedo={future.length > 0}
        viewport={viewport} setViewport={setViewport}
      />

      <MenuBar
        project={project}
        onNew={newProject} onOpen={openLoad} onSave={save}
        onUndo={undo} onRedo={redo} canUndo={past.length > 0} canRedo={future.length > 0}
        onCut={cutEl} onCopy={copyEl} onPaste={pasteEl} hasSelection={!!selected}
        onSearchBlocks={focusLibrarySearch} onFindReplace={() => setFindOpen(true)}
        zoom={zoom} onZoomIn={zoomIn} onZoomOut={zoomOut} onZoomReset={zoomReset}
        onHelpTour={() => setTourForce((v) => v + 1)}
        onOpenPalette={() => setPaletteOpen(true)}
      />

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} groups={paletteGroups} />

      <PagesBar
        pages={pages}
        activePageId={activePageId}
        onSwitch={switchPage}
        onAdd={() => setAddPageOpen(true)}
        onRemove={removePage}
        onRename={renamePage}
        onSetStatus={setPageStatus}
        onOpenSeo={() => setSeoOpen(true)}
        onOpenTemplate={() => setTemplateEditorOpen(true)}
      />

      {/* Full-width like PagesBar, deliberately outside the sidebar/canvas
          flex row below — LeftSidebar/RightSidebar mount and unmount based
          on `mode`, and this bar must not shift position when they do. */}
      <div className="h-9 flex-none border-b border-[#2B2B2B] bg-[#141414] flex items-center px-3" data-testid="mode-toggle">
        <div className="flex items-center bg-[#0D0D0D] border border-[#2B2B2B] rounded-md p-0.5">
          <button onClick={() => setMode("design")} className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded ${mode === "design" ? "bg-[#1F1F1F] text-white" : "text-gray-400 hover:text-gray-200"}`} data-testid="mode-design"><MousePointer2 size={12} /> Design</button>
          <button onClick={() => setMode("code")} className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded ${mode === "code" ? "bg-[#1F1F1F] text-white" : "text-gray-400 hover:text-gray-200"}`} data-testid="mode-code"><Code2 size={12} /> Code</button>
          <button onClick={() => setMode("split")} className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded ${mode === "split" ? "bg-[#1F1F1F] text-white" : "text-gray-400 hover:text-gray-200"}`} data-testid="mode-split"><Columns2 size={12} /> Split View</button>
          <button onClick={() => setMode("outline")} className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded ${mode === "outline" ? "bg-[#1F1F1F] text-white" : "text-gray-400 hover:text-gray-200"}`} data-testid="mode-outline"><Presentation size={12} /> Outline</button>
          <button onClick={() => setMode("preview")} className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded ${mode === "preview" ? "bg-[#1F1F1F] text-white" : "text-gray-400 hover:text-gray-200"}`} data-testid="mode-preview"><Eye size={12} /> Preview</button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {mode !== "preview" && mode !== "outline" && (
          <LeftSidebar
            onAddBlock={(html, atIndex) => addBlock(html, atIndex)}
            onAddFont={addFont}
            fonts={fonts}
            files={files}
            onFilesChange={setFiles}
            onFileClick={(node) => node.type !== "folder" && setEditingFileId(node.id)}
            savedComponents={savedComponents}
            onDeleteSavedComponent={deleteSavedComponent}
            onWrapSelection={wrapSelectionWithContainer}
            hasSelection={!!selected}
            selectedHtml={selected?.html || ""}
            onOpenFormBuilder={() => setFormBuilderOpen(true)}
            onOpenPaymentBuilder={() => setPaymentBuilderOpen(true)}
            onOpenSocialBuilder={() => setSocialBuilderOpen(true)}
            onOpenStreamEmbed={() => setStreamEmbedOpen(true)}
            onWireCatalog={wireCatalog}
            onAddCart={addCartRuntime}
            headHtml={headHtml}
          />
        )}

        <div className="flex-1 flex flex-col overflow-hidden min-w-0" data-testid="center-pane">
          <div className="flex-1 flex overflow-hidden">
        {mode === "design" && (
          <Canvas
            elements={elements}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onDrop={(html, idx) => addBlock(html, idx)}
            onDelete={removeEl}
            onMove={moveEl}
            onDuplicate={dupEl}
            onEditHtml={editHtml}
            onSaveComponent={saveAsComponent}
            canvasBg={canvasBg}
            headHtml={headHtml}
            viewport={viewport}
            zoom={zoom}
          />
        )}
        {(mode === "code" || mode === "split") && (
          <CodeView
            project={project}
            elements={elements}
            onElementsChange={setElements}
            headHtml={headHtml}
            onHeadHtmlChange={setHeadHtml}
            customJs={customJs}
            onCustomJsChange={setCustomJs}
            onSave={save}
            showPreview={mode === "split"}
          />
        )}
        {mode === "preview" && (
          <div className="flex-1 flex flex-col bg-[#0D0D0D] overflow-hidden" data-testid="preview-mode">
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#2B2B2B] bg-[#141414] text-xs">
              <div className="flex items-center gap-2 text-gray-400">
                <Eye size={12} className="text-emerald-400" /> Live preview · {viewport} · what your visitors will see
              </div>
              <div className="text-[10px] text-gray-500 font-mono">{elements.length} block{elements.length === 1 ? "" : "s"} · exit via Design tab</div>
            </div>
            <div className="flex-1 flex justify-center items-start overflow-auto p-6">
              {/* allow-same-origin is intentionally NOT set: combined with
                  allow-scripts it would give this iframe's content (user-
                  authored, rendered via srcDoc) the app's real origin
                  instead of an opaque one — letting injected content reach
                  back into the live builder's DOM/localStorage via
                  window.parent. allow-scripts alone keeps the origin
                  opaque, which is what actually isolates it. */}
              <iframe
                title="live-preview"
                srcDoc={buildStandaloneHtml(project)}
                className="bg-white shadow-2xl border border-[#2B2B2B] transition-all"
                style={{
                  width: viewport === "mobile" ? "390px" : viewport === "tablet" ? "820px" : "1280px",
                  height: "100%",
                  minHeight: "600px",
                }}
                sandbox="allow-forms allow-scripts"
                data-testid="preview-iframe"
              />
            </div>
          </div>
        )}
        {mode === "outline" && (
          <OutlineView
            slides={outlineSlides}
            onChange={setOutlineSlides}
            onGenerate={generatePagesFromOutline}
          />
        )}
          </div>
        </div>

        {mode !== "preview" && mode !== "outline" && (
          <RightSidebar
            selected={selected}
            onApplyBackground={applyBackground}
            onApplyColor={applyColor}
            onPatchStyle={patchStyle}
            onApplyToken={applyExistingToken}
            onCreateToken={createToken}
            onReplaceHtml={replaceSelectedHtml}
            onApplyAnimation={applyAnimation}
            onApplyTheme={applyTheme}
            canvasBg={canvasBg}
            onCanvasBg={setCanvasBg}
            headHtml={headHtml}
            onHeadHtmlChange={setHeadHtml}
            onAddBlock={(html, atIndex) => addBlock(html, atIndex)}
            elements={elements}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onMove={moveEl}
            onDelete={removeEl}
            onToggleVisible={toggleVisible}
            onSetZIndex={setZIndex}
            onApplyStyleToIds={applyStyleToIds}
            viewport={viewport}
            onPatchResponsive={patchResponsiveStyle}
            onResetResponsive={resetResponsiveProperty}
          />
        )}
      </div>

      <StatusBar
        pageName={activePage?.name || projectName}
        elementCount={elements.length}
        mode={mode}
        viewport={viewport}
        zoom={zoom}
        saveStatus={saveStatus}
      />

      <Dialog open={loadOpen} onOpenChange={setLoadOpen}>
        <DialogContent className="bg-[#141414] border border-[#2B2B2B] text-white" data-testid="load-modal">
          <DialogHeader><DialogTitle>Open project</DialogTitle></DialogHeader>
          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {projects.length === 0 && <div className="text-sm text-gray-400">No saved projects yet.</div>}
            {projects.map((p) => (
              <div key={p.id} className="flex items-center gap-2 p-2 rounded border border-[#2B2B2B] bg-[#0D0D0D] hover:border-blue-500/60" data-testid={`project-row-${p.id}`}>
                <button className="flex-1 text-left" onClick={() => loadProject(p.id)}>
                  <div className="text-sm text-gray-100">{p.name}</div>
                  <div className="text-[11px] text-gray-500 font-mono">{new Date(p.updated_at).toLocaleString()}</div>
                </button>
                <button onClick={() => deleteProject(p.id)} className="p-1.5 text-gray-400 hover:text-red-400" data-testid={`project-delete-${p.id}`}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="bg-[#141414] border border-[#2B2B2B] text-white max-w-2xl" data-testid="import-sections-modal">
          <DialogHeader><DialogTitle>Imported sections — {importedSections.length}</DialogTitle></DialogHeader>
          <div className="text-xs text-gray-400 mb-2">Detected components from your HTML. Click to add to canvas.</div>
          <div className="space-y-1 max-h-[420px] overflow-y-auto">
            {importedSections.map((s) => (
              <button
                key={s.id}
                onClick={() => insertImportedSection(s)}
                className="w-full flex items-center gap-3 p-2 rounded border border-[#2B2B2B] bg-[#0D0D0D] hover:border-blue-500/60 text-left"
                data-testid={`imported-${s.id}`}
              >
                <div className="w-1 h-4 bg-blue-500 rounded" />
                <span className="text-sm font-mono text-gray-200">{s.label}</span>
                <span className="ml-auto text-[10px] text-gray-500 truncate max-w-[240px]">{s.html.slice(0, 60)}…</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      <PublishModal
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        projectId={projectId}
        projectName={projectName}
        onEnsureSaved={ensureSaved}
      />

      <TemplateEditor
        open={templateEditorOpen}
        onClose={() => setTemplateEditorOpen(false)}
        template={template}
        onChange={setTemplate}
      />

      <SeoPanel
        open={seoOpen}
        onClose={() => setSeoOpen(false)}
        seo={activePage?.seo}
        pageName={activePage?.name}
        onChange={setPageSeo}
      />

      <FileEditorModal
        file={editingFile}
        onClose={() => setEditingFileId(null)}
        onChange={updateFileContent}
        onSave={save}
      />

      <FindReplaceModal
        open={findOpen}
        onClose={() => setFindOpen(false)}
        pages={pages}
        activePageId={activePageId}
        onSetPages={(next) => {
          setPages(next);
          const a = next.find((p) => p.id === activePageId);
          if (a) {
            setElements(a.elements || []);
            setHeadHtml(a.head_html || "");
          }
        }}
        headHtml={headHtml}
        onSetHeadHtml={setHeadHtml}
        template={template}
        onSetTemplate={setTemplate}
        files={files}
        onSetFiles={setFiles}
      />

      <AssetsLibrary
        open={assetsOpen}
        onClose={() => setAssetsOpen(false)}
        project={project}
        onReplace={(updated) => {
          if (updated.pages) {
            setPages(updated.pages);
            const a = updated.pages.find((p) => p.id === activePageId);
            if (a) { setElements(a.elements || []); setHeadHtml(a.head_html || ""); }
          }
          if (updated.template) setTemplate(updated.template);
          if (updated.head_html !== undefined) setHeadHtml(updated.head_html);
        }}
      />

      <AnalyticsModal
        open={analyticsOpen}
        onClose={() => setAnalyticsOpen(false)}
        projectId={projectId}
        projectName={projectName}
        analytics={analytics}
        onApplyAnalytics={applyAnalytics}
      />

      <ProjectTemplatesModal
        open={templatesOpen}
        onClose={() => setTemplatesOpen(false)}
        currentProject={project}
        onLoadTemplate={loadFromTemplate}
      />

      <FormBuilderModal
        open={formBuilderOpen}
        onClose={() => setFormBuilderOpen(false)}
        onInsert={(html) => addBlock(html)}
        onSaveComponent={async ({ name, html, category }) => {
          try {
            const res = await axios.post(`${API}/components`, { name, html, category });
            setSavedComponents((c) => [res.data, ...c]);
          } catch { toast.error("Failed to save form to library"); }
        }}
      />

      <AddPageModal
        open={addPageOpen}
        onClose={() => setAddPageOpen(false)}
        onAddBlank={newPage}
        onAddLayout={addPageFromLayout}
      />

      <PaymentButtonModal
        open={paymentBuilderOpen}
        onClose={() => setPaymentBuilderOpen(false)}
        onInsert={(html) => addBlock(html)}
      />

      <SocialShareModal
        open={socialBuilderOpen}
        onClose={() => setSocialBuilderOpen(false)}
        onInsert={(html) => addBlock(html)}
      />

      <StreamEmbedModal
        open={streamEmbedOpen}
        onClose={() => setStreamEmbedOpen(false)}
        onInsert={(html) => addBlock(html)}
      />

      <ImportExportModal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        project={project}
        onImportSections={onImportSections}
        onLoadProjectData={onLoadProjectData}
        onImportUrl={onImportUrl}
      />

      <SubmissionsModal
        open={submissionsOpen}
        onClose={() => setSubmissionsOpen(false)}
        projectId={projectId}
      />

      <OnboardingTour key={tourForce} force={tourForce > 0} />
    </div>
  );
}
