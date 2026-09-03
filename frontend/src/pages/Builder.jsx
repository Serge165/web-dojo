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
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";
import {
  Trash2, Eye, MousePointer2, Code2, Columns2, Presentation,
  FilePlus2, FolderOpen, Save, Download, Upload, Search, Palette, BarChart3, LayoutTemplate, Inbox, Store, HelpCircle, Megaphone,
  Undo2, Redo2, Scissors, Copy, ClipboardPaste, ZoomIn, ZoomOut, RotateCcw, Monitor, Tablet, Smartphone,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { OutlineView } from "@/components/builder/OutlineView";
import { getStoredUser, startPresenceLoop } from "@/lib/collab";
import { PublishModal } from "@/components/builder/PublishModal";
import { OnboardingTour } from "@/components/builder/OnboardingTour";
import { ThemeGallery } from "@/components/builder/ThemeGallery";
import { applyTheme as applyEditorTheme, getSavedThemeName } from "@/themes";
import { PagesBar } from "@/components/builder/PagesBar";
import { TemplateEditor } from "@/components/builder/TemplateEditor";
import { SeoPanel } from "@/components/builder/SeoPanel";
import { FindReplaceModal } from "@/components/builder/FindReplaceModal";
import { FileEditorModal } from "@/components/builder/FileEditorModal";
import { AssetsLibrary } from "@/components/builder/AssetsLibrary";
import { AnalyticsModal } from "@/components/builder/AnalyticsModal";
import { ProjectTemplatesModal } from "@/components/builder/ProjectTemplatesModal";
import { TemplateApplyModal } from "@/components/builder/TemplateApplyModal";
import { applyTemplate } from "@/lib/projectManager";
import { FormBuilderModal } from "@/components/builder/FormBuilderModal";
import { AddPageModal } from "@/components/builder/AddPageModal";
import { parseNavbarTree, setNavbarItems, pageHref, unifyNavAcrossPages, unifyFooterAcrossPages, propagateSharedBlockEdit } from "@/components/builder/BlockEditMenu";
import { NewProjectModal } from "@/components/builder/NewProjectModal";
import { NewProjectWizard } from "@/components/builder/NewProjectWizard";
import { PaymentButtonModal } from "@/components/builder/PaymentButtonModal";
import { StreamEmbedModal } from "@/components/builder/StreamEmbedModal";
import { SocialShareModal } from "@/components/builder/SocialShareModal";
import { ImportExportModal } from "@/components/builder/ImportExportModal";
import { SubmissionsModal } from "@/components/builder/SubmissionsModal";
import { EcommerceDashboardModal } from "@/components/builder/EcommerceDashboardModal";
import { ZeneroDashboardModal } from "@/components/builder/ZeneroDashboardModal";
import { featureEnabled } from "@/lib/featureFlags";
import { saveSnapshot, getSnapshot, enqueue, flushQueue } from "@/lib/localdb";

import { buildStandaloneHtml, downloadStandalone, downloadZip } from "@/lib/exportHtml";
import { scaffoldProjectFiles } from "@/lib/projectScaffold";
import { STANDARD_LAYOUT_SECTIONS } from "@/lib/standardLayout";
import { linkJsInHtml, unlinkJsInHtml, relinkJsInHtml } from "@/lib/jsAutoLink";
import { buildCartRuntimeHtml } from "@/lib/cart";
import { scanHtml, inlineLocalStylesheets } from "@/lib/importHtml";
import { hasZeneroWidget } from "@/lib/zeneroWidgets";
import { escText } from "@/lib/escapeHtml";
import { upsertRootVar, removeRootVarsForElement } from "@/lib/rootVars";
import { patchFirstStyle, removeStyleProp } from "@/lib/patchRootStyle";
import { upsertResponsiveOverridesCss } from "@/lib/responsiveOverrides";
import { upsertAnalyticsHead } from "@/lib/analyticsSnippets";
import { buildAppliedAnimation, buildOnScrollBootstrapScript, buildClickBootstrapScript, ONSCROLL_BOOTSTRAP_MARKER, CLICK_BOOTSTRAP_MARKER } from "@/lib/animations";
import { buildFontsStyleBlock, fontFamilyFromFilename } from "@/lib/fonts";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const uid = () => "el_" + Math.random().toString(36).slice(2, 10);

// Root-tag-targeted style patch/remove — see lib/patchRootStyle.js for the
// full rationale (Phase 7). Pulled into its own import-free module so it's
// unit-testable without loading this page's monaco-editor/axios/etc. graph.

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

// Stamps a plain attribute onto the first/root tag if it isn't already
// there (used to back-fill data-forge-el-id — see patchResponsiveStyle).
// No-op if the attribute is already present, so it's safe to call every
// time rather than tracking "have I stamped this element yet" separately.
const addAttrToFirstTag = (html, attr, value) => {
  const m = html.match(/^\s*<([a-zA-Z][\w-]*)([^>]*)>/);
  if (!m) return html;
  const [full, tag, attrs] = m;
  if (new RegExp(`\\b${attr}=`).test(attrs)) return html;
  return html.replace(full, `<${tag} ${attr}="${value}"${attrs}>`);
};

// Removes a single attribute from the first/root tag, if present — used
// when applying a regular (non-on-scroll) animation onto an element that
// previously had an on-scroll one, so a stale data-wd-onscroll doesn't
// leave the bootstrap script trying to hide-then-reveal an element that
// no longer has a scroll-triggered animation to reveal it with.
const removeAttrFromFirstTag = (html, attr) => {
  const m = html.match(/^\s*<([a-zA-Z][\w-]*)([^>]*)>/);
  if (!m) return html;
  const [full, tag, attrs] = m;
  return html.replace(full, `<${tag}${attrs.replace(new RegExp(`\\s*${attr}="[^"]*"`), "")}>`);
};

export default function Builder() {
  const [mode, setMode] = useState("design");
  const [viewport, setViewport] = useState("desktop");
  const [projectId, setProjectId] = useState(null);
  const [projectName, setProjectName] = useState("Untitled");
  const [peers, setPeers] = useState([]);
  const [elements, setElements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  // Ctrl+Shift+A in Design mode highlights every element that shares the
  // currently selected block's data-wd-block id (the design-window analogue
  // of Monaco's "select all occurrences"). Off by default; toggled by the
  // keybinding — a small array of element ids so the Canvas can outline them.
  const [sameBlockHighlight, setSameBlockHighlight] = useState([]);
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
  const [selectedTemplate, setSelectedTemplate] = useState(null); // template object awaiting apply mode choice
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [formBuilderOpen, setFormBuilderOpen] = useState(false);
  const [addPageOpen, setAddPageOpen] = useState(false);
  const [paymentBuilderOpen, setPaymentBuilderOpen] = useState(false);
  const [socialBuilderOpen, setSocialBuilderOpen] = useState(false);
  const [streamEmbedOpen, setStreamEmbedOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [templateEditorOpen, setTemplateEditorOpen] = useState(false);
  const [seoOpen, setSeoOpen] = useState(false);
  const [submissionsOpen, setSubmissionsOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [zeneroOpen, setZeneroOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [themeGalleryOpen, setThemeGalleryOpen] = useState(false);
  // Restore the saved editor skin (View → 🎨 Themes) on load.
  useEffect(() => { applyEditorTheme(getSavedThemeName()); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [zoom, setZoom] = useState(100);
  // Sidebar collapse — remembered per-browser (workspace preference, not
  // project data, so it isn't part of the saved project or undo history).
  const [leftCollapsed, setLeftCollapsed] = useState(() => { try { return localStorage.getItem("wd_left_collapsed") === "1"; } catch { return false; } });
  const [rightCollapsed, setRightCollapsed] = useState(() => { try { return localStorage.getItem("wd_right_collapsed") === "1"; } catch { return false; } });
  useEffect(() => { try { localStorage.setItem("wd_left_collapsed", leftCollapsed ? "1" : "0"); } catch {} }, [leftCollapsed]);
  useEffect(() => { try { localStorage.setItem("wd_right_collapsed", rightCollapsed ? "1" : "0"); } catch {} }, [rightCollapsed]);
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

  // Presence beacon (Phase 9A slice): only announces once a collab account
  // is logged in (no login UI exists yet — this is inert until one does).
  useEffect(() => {
    setPeers([]);
    if (!projectId) return;
    const user = getStoredUser();
    if (!user) return;
    const stop = startPresenceLoop(projectId, user, setPeers);
    return stop;
  }, [projectId]);

  // The Zenero content dashboard is only useful once the site actually has
  // a block that reads from it — gate its entry point on that, checking
  // every page (not just the active one) since content can be added to any
  // page's Zenero-content or Social Wall block.
  const hasZeneroContent = useMemo(
    () => hasZeneroWidget([...elements, ...pages.flatMap((p) => p.elements || [])]),
    [elements, pages]
  );

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
  // Separate from `doc` on purpose: `doc` drives undo/redo history, which
  // must stay narrow (page-structure changes like rename/SEO/template
  // shouldn't be Ctrl+Z-able, and definitely shouldn't get clobbered by
  // switching pages). But those same fields ARE part of what persist()
  // actually saves — watching only `doc` here meant renaming the project,
  // editing SEO, or changing the template never marked the project dirty,
  // so autosave silently skipped them while the status bar kept saying
  // "Saved" until the next manual Save.
  const saveWatch = useMemo(
    () => ({ elements, canvasBg, headHtml, fonts, files, customJs, projectName, pages, template, analytics }),
    [elements, canvasBg, headHtml, fonts, files, customJs, projectName, pages, template, analytics]
  );
  const prevAutosaveDocRef = useRef(saveWatch);
  useEffect(() => {
    if (prevAutosaveDocRef.current === saveWatch) return;
    prevAutosaveDocRef.current = saveWatch;
    setSaveStatus("unsaved");
    clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => { persist(true); }, 2500);
    // persist/project are intentionally omitted: `project` is a fresh
    // object literal every render, so listing it would reset this timer
    // on every re-render (not just real edits) and the debounce would
    // never actually fire during active use.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveWatch]);
  useEffect(() => () => clearTimeout(autosaveTimerRef.current), []);

  // Phase 9E: flush queued offline saves as soon as connectivity returns —
  // independent of the autosave loop, which only runs on user activity.
  useEffect(() => {
    if (!featureEnabled("localFirst")) return;
    const onOnline = async () => {
      const sent = await flushQueue(async (entry) => {
        if (entry.method === "post") await axios.post(entry.url, entry.payload);
        else await axios.put(entry.url, entry.payload);
      });
      if (sent > 0) toast.success(`Back online — synced ${sent} offline save${sent === 1 ? "" : "s"}`);
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

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

  // Preview mode: the active page by default, but clicking an internal nav
  // link (see PREVIEW_NAV_SCRIPT in exportHtml.js) swaps to whichever page
  // that link's href resolves to, so multi-page sites are actually
  // click-through-able in Preview instead of stuck on one page.
  const [previewPageId, setPreviewPageId] = useState(null);
  useEffect(() => { if (mode === "preview") setPreviewPageId(activePageId); }, [mode, activePageId]);
  useEffect(() => {
    if (mode !== "preview") return;
    const onMsg = (e) => {
      if (e.data?.type !== "wd-preview-nav") return;
      const target = pages.find((p) => pageHref(p) === e.data.href);
      if (target) setPreviewPageId(target.id);
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [mode, pages]);
  const previewProject = useMemo(() => {
    if (!previewPageId || previewPageId === activePageId) return project;
    const page = pages.find((p) => p.id === previewPageId);
    if (!page) return project;
    return { ...project, elements: page.elements, head_html: page.head_html, canvas_bg: page.canvas_bg, fonts: page.fonts, custom_js: page.custom_js, seo: page.seo || {} };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewPageId, activePageId, pages, projectId, projectName, files, template, analytics]);

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
  // Phase 5 (Issue #3): every page carries a type — "page" (unique content,
  // ships in the site) vs "layout" (reusable template, marked as such in
  // exports via data-wd-page-type). Defaults to "page"; PagesBar's type
  // select flips it.
  const setPageType = (pageId, type) => {
    setPages((ps) => ps.map((p) => (p.id === pageId ? { ...p, type } : p)));
  };
  const newPage = () => {
    const id = uid();
    const name = `Page ${pages.length + 1}`;
    setPages((ps) => {
      const persisted = ps.map((p) => p.id === activePageId ? { ...p, elements, head_html: headHtml, canvas_bg: canvasBg, fonts, custom_js: customJs } : p);
      return [...persisted, { id, name, slug: name.toLowerCase().replace(/\s+/g, "-"), type: "page", status: "draft", seo: {}, elements: [], head_html: "", canvas_bg: "#ffffff", fonts: [], custom_js: "" }];
    });
    setActivePageId(id);
    setElements([]);
    setHeadHtml("");
    setCanvasBg("#ffffff");
    setFonts([]);
    setCustomJs("");
    setSelectedId(null);
  };
  // Appends a nav link to `newPage` inside any nav block found in `html`,
  // unless that page is already linked. No-op when `html` has no <nav>.
  const patchNavHtml = (html, newPage) => {
    if (!html || !/<nav\b/i.test(html)) return html;
    const tree = parseNavbarTree(html);
    const href = pageHref(newPage);
    const already = tree.items.some((n) => n.href === href || (n.children || []).some((c) => c.href === href));
    if (already) return html;
    return setNavbarItems(html, [...tree.items, { label: newPage.name, href, children: [] }]);
  };
  const addPageFromLayout = (layout) => {
    const id = uid();
    const els = (layout.blocks || []).map((html) => ({ id: uid(), html: html.replaceAll('project_id: ""', `project_id: "${projectId || ""}"`) }));
    const bg = layout.canvasBg || "#ffffff";
    const fnts = layout.fonts || [];
    const slug = layout.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const newPage = { id, name: layout.label, slug, type: "page", status: "draft", seo: {}, elements: els, head_html: "", canvas_bg: bg, fonts: fnts, custom_js: "" };
    setPages((ps) => {
      const persisted = ps.map((p) => p.id === activePageId ? { ...p, elements, head_html: headHtml, canvas_bg: canvasBg, fonts, custom_js: customJs } : p);
      return unifyFooterAcrossPages(unifyNavAcrossPages([...persisted, newPage]));
    });
    if (template.use_template && template.header_html) {
      setTemplate((t) => ({ ...t, header_html: patchNavHtml(t.header_html, newPage) }));
    }
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
      return { id: uid(), name: title, slug, type: "page", status: "draft", seo: {}, elements: els, head_html: "", canvas_bg: "#ffffff", fonts: [], custom_js: "" };
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
  // Same fix as FileTree's "New file"/rename dialogs: window.confirm()
  // silently no-ops in contexts without native blocking dialogs (Tauri's
  // webview among them), which made "New project" look like it did
  // nothing when there were unsaved changes. A real modal doesn't depend
  // on that browser API.
  const [newProjectConfirmOpen, setNewProjectConfirmOpen] = useState(false);
  const newProject = () => {
    const hasUnsaved = saveStatus === "unsaved" || saveStatus === "error";
    if (hasUnsaved) { setNewProjectConfirmOpen(true); return; }
    setNewProjectOpen(true);
  };
  const focusLibrarySearch = () => {
    document.querySelector('[data-testid="left-tab-library"]')?.click();
    setTimeout(() => document.querySelector('[data-testid="library-search"]')?.focus(), 0);
  };
  const toggleVisible = (id) => setElements((els) => els.map((e) => e.id === id ? { ...e, hidden: !e.hidden } : e));
  const setZIndex = (id, z) => setElements((els) => els.map((e) => e.id === id ? { ...e, zIndex: z } : e));
  const editHtml = (id, html) => {
    setElements((els) => els.map((e) => e.id === id ? { ...e, html } : e));
    setPages((ps) => propagateSharedBlockEdit(ps, activePageId, html));
  };
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
    // buildResponsiveOverridesCss targets [data-forge-el-id="..."] — that
    // attribute is otherwise only a live React prop Canvas.jsx renders on
    // its wrapper div, never part of el.html itself, so it wouldn't exist
    // in any real export/publish output without stamping it in here too.
    const next = elements.map((e) => e.id === selected.id
      ? {
          ...e,
          html: addAttrToFirstTag(e.html, "data-forge-el-id", e.id),
          responsive: { ...(e.responsive || {}), [viewport]: { ...((e.responsive || {})[viewport] || {}), ...patch } },
        }
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

  // Replaces any prior animation block for this element instead of
  // stacking a new one on every re-apply (re-picking a preset, tweaking
  // duration/easing, etc. would otherwise accumulate dead @keyframes).
  const upsertAnimStyleBlock = (h, elementId, styleBlock) => {
    const stripped = (h || "").replace(new RegExp(`<style data-forge-anim="${elementId}">[\\s\\S]*?<\\/style>\\n?`), "");
    return `${stripped ? stripped + "\n" : ""}<style data-forge-anim="${elementId}">\n${styleBlock}\n</style>`;
  };
  const ensureOnScrollBootstrap = (h) => (h || "").includes(ONSCROLL_BOOTSTRAP_MARKER)
    ? h
    : `${h ? h + "\n" : ""}${buildOnScrollBootstrapScript()}`;
  // Phase 9D: click-triggered animations share the same one-script dedupe
  // pattern as on-scroll — the .wd-click-play class is removed, a reflow is
  // forced, then the class re-added so every click replays the animation.
  const ensureClickBootstrap = (h) => (h || "").includes(CLICK_BOOTSTRAP_MARKER)
    ? h
    : `${h ? h + "\n" : ""}${buildClickBootstrapScript()}`;

  // Applies one already-built animation result onto one element's html —
  // shared by both applyAnimation (single-select) and applyAnimationToIds
  // (multi-select), so the per-trigger branch is only written once.
  // Phase 9D trigger branches (each defensively strips the other triggers'
  // attributes so re-applying with a different trigger never leaves stale
  // hooks behind):
  //   scroll → data-wd-onscroll (played by the on-scroll bootstrap)
  //   click  → data-wd-onclick  (replayed by the click bootstrap)
  //   hover  → pure CSS :hover rule keyed on data-forge-el-id (no JS)
  //   load   → inline `animation:` style (the original default behaviour)
  const applyAnimationToHtml = (html, elementId, applied) => {
    if (applied.onScroll) {
      return addAttrToFirstTag(
        addAttrToFirstTag(removeStyleProp(removeAttrFromFirstTag(html, "data-wd-onclick"), "animation"), "data-forge-el-id", elementId),
        "data-wd-onscroll", "1"
      );
    }
    if (applied.click) {
      return addAttrToFirstTag(
        addAttrToFirstTag(removeStyleProp(removeAttrFromFirstTag(html, "data-wd-onscroll"), "animation"), "data-forge-el-id", elementId),
        "data-wd-onclick", "1"
      );
    }
    if (applied.trigger === "hover") {
      return addAttrToFirstTag(
        removeStyleProp(removeAttrFromFirstTag(removeAttrFromFirstTag(html, "data-wd-onscroll"), "data-wd-onclick"), "animation"),
        "data-forge-el-id", elementId
      );
    }
    return patchFirstStyle(
      removeAttrFromFirstTag(removeAttrFromFirstTag(html, "data-wd-onscroll"), "data-wd-onclick"),
      { animation: applied.shorthand }
    );
  };

  const applyAnimation = (config) => {
    if (!selected) return;
    const applied = buildAppliedAnimation({ elementId: selected.id, ...config });
    setElements((els) => els.map((e) => e.id === selected.id
      ? { ...e, html: applyAnimationToHtml(e.html, e.id, applied) }
      : e));
    setHeadHtml((h) => {
      const next = upsertAnimStyleBlock(h, selected.id, applied.styleBlock);
      if (applied.onScroll) return ensureOnScrollBootstrap(next);
      if (applied.click) return ensureClickBootstrap(next);
      return next;
    });
  };

  // Multi-select batch apply — mirrors applyStyleToIds's shape/wiring but
  // for animations (see LayersPanel's batch bar + lib/animClipboard.js).
  // Each element gets its own fresh unique keyframes name (buildAppliedAnimation
  // re-randomizes per call), so applying to many elements at once never
  // collides.
  const applyAnimationToIds = useCallback((ids, clip) => {
    if (!ids || !ids.length || !clip) return;
    let head = headHtml;
    let usedOnScroll = false;
    let usedClick = false;
    setElements((els) => els.map((e) => {
      if (!ids.includes(e.id)) return e;
      const applied = buildAppliedAnimation({ elementId: e.id, ...clip });
      head = upsertAnimStyleBlock(head, e.id, applied.styleBlock);
      usedOnScroll = usedOnScroll || applied.onScroll;
      usedClick = usedClick || !!applied.click;
      return { ...e, html: applyAnimationToHtml(e.html, e.id, applied) };
    }));
    setHeadHtml(usedOnScroll ? ensureOnScrollBootstrap(head) : usedClick ? ensureClickBootstrap(head) : head);
  }, [headHtml]);

  const applyTheme = useCallback(({ headHtml: themeHead, canvasBg: themeBg, googleFont, allPages }) => {
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
  }, [fonts, activePageId]);

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

  // Uploaded local font (Phase 4a, Task 3): reads the file as a data URI,
  // appends a <style data-forge-fonts> block (with @font-face + --font-<slug>
  // vars) to the active page's head_html — which the exporter lifts into
  // globals.css — and records the file under fonts/ in the project tree.
  const addFontFile = (file) => {
    const family = fontFamilyFromFilename(file && file.name);
    if (!family) { toast.error("Unsupported font file"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUri = reader.result;
      setHeadHtml((h) => `${h ? h.trim() + "\n" : ""}${buildFontsStyleBlock([{ family, file: dataUri }])}`);
      setFiles((fs) => [...fs, { id: uid(), path: `fonts/${file.name}`, type: "file", content: dataUri }]);
      toast.success(`Font added: ${family}`);
    };
    reader.onerror = () => toast.error("Could not read font file");
    reader.readAsDataURL(file);
  };

  const onImportSections = ({ headHtml: h, sections }) => {
    if (h) setHeadHtml((cur) => cur ? cur + "\n" + h : h);
    setImportedSections(sections); setImportOpen(true);
  };
  // FileTree's "insert" button (a whole HTML file from an imported
  // folder) used to go straight to addBlock() with the raw file text,
  // skipping scanHtml entirely — its CSS never reached headHtml/
  // globals.css. Route it through the same scan+review pipeline every
  // other import source (paste, URL, templates) already uses, inlining
  // any sibling .css file's content first since folder imports carry
  // their CSS as separate files rather than inline <style> tags.
  const onImportFile = (content) => {
    const siblingCssByName = {};
    files.forEach((f) => { if (/\.css$/i.test(f.path)) siblingCssByName[f.path.split("/").pop()] = f.content; });
    onImportSections(scanHtml(inlineLocalStylesheets(content, siblingCssByName)));
  };
  const insertImportedSection = (sec) => { addBlock(sec.html); toast.success(`Inserted ${sec.label}`); };
  const onInsertAllHtml = (folderPath) => {
    const htmlFiles = files.filter((f) => f.type === "file" && /\.html?$/i.test(f.path) && f.path.startsWith(folderPath + "/"));
    if (htmlFiles.length === 0) { toast.info("No .html files found in this folder"); return; }
    const siblingCssByName = {};
    files.forEach((f) => {
      if (/\.css$/i.test(f.path) && f.path.startsWith(folderPath + "/")) {
        const relPath = f.path.slice(folderPath.length + 1);
        siblingCssByName[relPath] = f.content;
        siblingCssByName[f.path.split("/").pop()] = f.content;
      }
    });

    if (htmlFiles.length === 1) {
      const { headHtml, sections } = scanHtml(inlineLocalStylesheets(htmlFiles[0].content, siblingCssByName));
      if (headHtml) setHeadHtml((cur) => cur ? cur + '\n' + headHtml : headHtml);
      let imported = 0;
      sections.forEach((sec) => { addBlock(sec.html); imported++; });
      toast.success(`Imported ${imported} block${imported === 1 ? "" : "s"}`);
    } else {
      const newPages = htmlFiles.map((f, idx) => {
        const { headHtml, sections } = scanHtml(inlineLocalStylesheets(f.content, siblingCssByName));
        const pageId = uid();
        const fileName = f.path.split('/').pop().replace(/\.html?$/i, '');
        const slug = fileName === 'index' ? 'index' : fileName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        return {
          id: pageId,
          name: fileName === 'index' ? 'Home' : fileName.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          slug: slug,
          status: 'draft',
          seo: {},
          elements: sections.map((sec) => ({ id: uid(), html: sec.html })),
          head_html: headHtml || '',
          canvas_bg: '#ffffff',
          fonts: [],
          custom_js: '',
        };
      });
      setPages((p) => [...p, ...newPages]);
      if (newPages.length > 0) setActivePageId(newPages[0].id);
      toast.success(`Imported ${newPages.length} page${newPages.length === 1 ? "" : "s"}`);
    }
  };

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
      return [...els, { id: uid(), html: buildCartRuntimeHtml({ ...opts, projectId }) }];
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
      const out = hasCart ? next : [...next, { id: uid(), html: buildCartRuntimeHtml({ accent: "#4f46e5", currency: "usd", projectId }) }];
      setTimeout(() => toast.success(converted ? `Wired ${converted} button${converted === 1 ? "" : "s"} to the cart${hasCart ? "" : " + added a live cart"}` : (hasCart ? "Cart already on this page" : "Live cart added — use add-to-cart buttons to fill it")), 0);
      return out;
    });
    setSelectedId(null);
  };

  const savePaypalSecret = async (clientId, secret) => {
    try {
      await axios.post(`${API}/commerce/paypal-secret`, { project_id: projectId, client_id: clientId, secret });
      toast.success("PayPal credentials saved");
    } catch {
      toast.error("Failed to save PayPal credentials");
    }
  };

  const saveSmtpConfig = async (host, port, username, password, fromAddress) => {
    try {
      await axios.post(`${API}/commerce/smtp-config`, { project_id: projectId, host, port, username, password, from_address: fromAddress });
      toast.success("SMTP settings saved");
    } catch {
      toast.error("Failed to save SMTP settings");
    }
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
    // Build a save payload that merges the active page's current edits
    // into `pages`. The top-level `project` object above is a fresh literal
    // every render, but `pages` in state is only updated during page-switch
    // operations. If we saved `project` directly, any unsynced edits on the
    // active page would be lost on next load. Merging here ensures manual
    // Save and autosave both capture the user's latest work.
    const mergedPages = pages.map((p) =>
      p.id === activePageId
        ? { ...p, elements, head_html: headHtml, canvas_bg: canvasBg, fonts, custom_js: customJs }
        : p
    );
    const savePayload = {
      id: projectId,
      name: projectName,
      elements, head_html: headHtml, canvas_bg: canvasBg, fonts, files, custom_js: customJs,
      seo: activePage?.seo || {},
      pages: mergedPages, active_page_id: activePageId, template, analytics,
    };
    try {
      // Phase 9E local-first: mirror the exact payload into IndexedDB BEFORE
      // the network call — a crash mid-save (or an offline save) still leaves
      // the work durably on disk, and the offline queue below replays it.
      if (featureEnabled("localFirst")) saveSnapshot(savePayload);
      let online = false;
      try {
        if (projectId) {
          await axios.put(`${API}/projects/${projectId}`, savePayload);
        } else {
          const res = await axios.post(`${API}/projects`, savePayload);
          setProjectId(res.data.id);
        }
        online = true;
      } catch (netErr) {
        // Phase 9E: offline queue — failed saves of existing projects are
        // recorded and replayed automatically on the next successful save
        // (which the autosave loop keeps trying every ~2.5s of activity, and
        // the reconnect listener flushes immediately). Creates can't be
        // queued (the id comes from the server), but their payload is still
        // in the IndexedDB snapshot above.
        if (featureEnabled("localFirst") && projectId) {
          enqueue({ method: "put", url: `${API}/projects/${projectId}`, payload: savePayload });
        }
        throw netErr;
      }
      setSaveStatus("saved");
      if (!silent) toast.success("Project saved");
    } catch (e) {
      setSaveStatus("error");
      if (!silent) toast.error(`Save failed${e.response ? ` (${e.response.status})` : " — kept locally, will sync when back online"}`);
      console.error("Save error:", e?.response?.data || e?.message || e);
    }
    // Phase 9E: on any successful save, drain the offline queue oldest-first.
    if (featureEnabled("localFirst")) {
      const sent = await flushQueue(async (entry) => {
        if (entry.method === "post") await axios.post(entry.url, entry.payload);
        else await axios.put(entry.url, entry.payload);
      });
      if (sent > 0 && !silent) toast.success(`Synced ${sent} offline save${sent === 1 ? "" : "s"}`);
    }
  };
  const save = () => { clearTimeout(autosaveTimerRef.current); persist(false); };

  const saveAs = async () => {
    const newName = prompt("Save a copy as…", projectName + " (copy)");
    if (!newName) return;
    clearTimeout(autosaveTimerRef.current);
    const mergedPages = pages.map((p) =>
      p.id === activePageId
        ? { ...p, elements, head_html: headHtml, canvas_bg: canvasBg, fonts, custom_js: customJs }
        : p
    );
    const savePayload = {
      id: null,
      name: newName,
      elements, head_html: headHtml, canvas_bg: canvasBg, fonts, files, custom_js: customJs,
      seo: activePage?.seo || {},
      pages: mergedPages, active_page_id: activePageId, template, analytics,
    };
    setSaveStatus("saving");
    try {
      const res = await axios.post(`${API}/projects`, savePayload);
      setProjectId(res.data.id);
      setProjectName(newName);
      setSaveStatus("saved");
      toast.success(`Saved as "${newName}"`);
    } catch (e) {
      setSaveStatus("error");
      toast.error(`Save As failed${e.response ? ` (${e.response.status})` : ""}`);
      console.error("Save As error:", e?.response?.data || e?.message || e);
    }
  };

  const openLoad = async () => {
    try {
      const res = await axios.get(`${API}/projects`);
      setProjects(res.data); setLoadOpen(true);
    } catch { toast.error("Failed to fetch projects"); }
  };

  const loadProject = async (id) => {
    // Phase 9E: try the network first; on failure fall back to the last
    // IndexedDB snapshot so the project stays editable fully offline.
    let p = null;
    try {
      const res = await axios.get(`${API}/projects/${id}`);
      p = res.data;
    } catch { /* offline fallback below */ }
    if (!p && featureEnabled("localFirst")) {
      try {
        const snap = await getSnapshot(id);
        if (snap) { p = snap; toast.info("Offline — loaded local copy"); }
      } catch { p = null; }
    }
    if (!p) { toast.error("Failed to load"); return; }
    try {
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
    try {
      if (!tpl) { toast.error('Template not found'); return; }
      const data = tpl.data || {};
      const templateName = tpl.name || 'Untitled';
      setProjectId(null);
      setProjectName(templateName + ' - copy');
      const templatePages = (data.pages && Array.isArray(data.pages) && data.pages.length) ? data.pages : [{
        id: uid(), name: 'Home', slug: 'index', status: 'draft', seo: {},
        elements: (Array.isArray(data.elements) ? data.elements : []) || [], head_html: data.head_html || '',
        canvas_bg: data.canvas_bg || '#ffffff', fonts: (Array.isArray(data.fonts) ? data.fonts : []) || [], custom_js: data.custom_js || '',
      }];
      const nextPages = templatePages.map((pg) => pg ? { ...pg, id: uid() } : null).filter(Boolean);
      if (!nextPages.length) { toast.error('Template has no pages'); return; }
      setPages(nextPages);
      setActivePageId(nextPages[0].id);
      setElements(nextPages[0].elements || []);
      setHeadHtml(nextPages[0].head_html || '');
      setCanvasBg(nextPages[0].canvas_bg || '#ffffff');
      setFonts(nextPages[0].fonts || []);
      setCustomJs(nextPages[0].custom_js || '');
      setTemplate(data.template || { header_html: '', footer_html: '', use_template: false });
      setAnalytics(data.analytics || {});
      setFiles(data.files || []);
      setSelectedId(null); setPast([]); setFuture([]);
      toast.success('Started new project from ' + templateName);
    } catch (e) {
      console.error('Failed to load template:', e);
      toast.error('Failed to load template: ' + e.message);
    }
  };

  // New File wizard: fork a starter template, override the project name and
  // the home page's SEO with the wizard's inputs, and replace the file tree
  // with a scaffolded static-site layout (index.html + css/ + js/ + imgs/).
  // Mirrors loadFromTemplate for the page/element/head reset, then layers the
  // name/SEO/scaffold on top. The project snapshot handed to the scaffolder
  // matches the shape exportHtml.buildMultiPageExport expects.
  const startFromWizard = ({ tpl, name, seo, layouts }) => {
    const data = (tpl && tpl.data) || {};
    const projName = (name || (tpl && tpl.name) || "Untitled").trim();
    setProjectId(null);
    setProjectName(projName);
    // Option B: hand-picked Layout pages compose the project instead of a whole Template.
    const layoutPages = (layouts || []).map((l, i) => {
      const slug = i === 0 ? "index" : l.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      return {
        id: uid(), name: i === 0 ? "Home" : l.label, slug, status: "draft", seo: {},
        elements: (l.blocks || []).map((html) => ({ id: uid(), html })),
        head_html: "", canvas_bg: l.canvasBg || "#ffffff", fonts: l.fonts || [], custom_js: "",
      };
    });
    const templatePages = layoutPages.length ? layoutPages
      : (data.pages && data.pages.length) ? data.pages : [{
      id: uid(), name: "Home", slug: "index", status: "draft", seo: {},
      elements: data.elements || [], head_html: data.head_html || "",
      canvas_bg: data.canvas_bg || "#ffffff", fonts: data.fonts || [], custom_js: data.custom_js || "",
    }];
    const stitchedPages = templatePages.map((pg, i) => ({
      ...pg,
      id: pg.id || uid(),
      seo: i === 0 ? { ...(pg.seo || {}), ...seo } : (pg.seo || {}),
    }));
    // Hand-picked layout pages each bring their own donor <nav> (with that
    // donor's own demo items), unmerged and inconsistent page to page — see
    // unifyNavAcrossPages. A single starter template's pages already share
    // one coherent nav by construction, so leave that path untouched.
    const nextPages = layoutPages.length ? unifyFooterAcrossPages(unifyNavAcrossPages(stitchedPages)) : stitchedPages;
    // Phase 4a (Task 4): a truly blank selection (template data with no
    // seeded elements) starts from the standard semantic layout skeleton
    // instead of an empty canvas, and opts the scaffold into injecting the
    // matching site-layout CSS into css/globals.css. Themed starter templates
    // keep their own structures untouched.
    const isBlankCanvas = !(nextPages[0].elements || []).length;
    if (isBlankCanvas) {
      nextPages[0] = {
        ...nextPages[0],
        elements: [{ id: uid(), html: STANDARD_LAYOUT_SECTIONS }],
      };
    }
    setPages(nextPages);
    setActivePageId(nextPages[0].id);
    setElements(nextPages[0].elements || []);
    setHeadHtml(nextPages[0].head_html || "");
    setCanvasBg(nextPages[0].canvas_bg || "#ffffff");
    setFonts(nextPages[0].fonts || []);
    setCustomJs(nextPages[0].custom_js || "");
    setTemplate(data.template || { header_html: "", footer_html: "", use_template: false });
    setAnalytics(data.analytics || {});
    setSelectedId(null); setPast([]); setFuture([]);
    const projectSnapshot = {
      id: null, name: projName,
      pages: nextPages, active_page_id: nextPages[0].id,
      elements: nextPages[0].elements || [], head_html: nextPages[0].head_html || "",
      canvas_bg: nextPages[0].canvas_bg || "#ffffff", fonts: nextPages[0].fonts || [],
      custom_js: nextPages[0].custom_js || "", files: [],
      seo: nextPages[0].seo,
      template: data.template || { header_html: "", footer_html: "", use_template: false },
      analytics: data.analytics || {},
    };
    setFiles(scaffoldProjectFiles(projectSnapshot, { standardLayout: isBlankCanvas }));
    setSaveStatus("unsaved");
    toast.success(layoutPages.length
      ? `Scaffolded “${projName}” from ${layoutPages.length} page${layoutPages.length === 1 ? "" : "s"}`
      : `Scaffolded “${projName}” from “${(tpl && tpl.name) || "template"}”`);
  };

  const deleteProject = async (id) => {
    try {
      await axios.delete(`${API}/projects/${id}`);
      setProjects((p) => p.filter((x) => x.id !== id));
      if (projectId === id) setProjectId(null);
      toast.success("Deleted");
    } catch { toast.error("Delete failed"); }
  };

  // Phase 4a (Task 5): JS auto-linking. FileTree js/ create/rename/delete
  // events keep the <script src="js/..."> tags in the active page's head_html
  // in sync so the author never hand-edits HTML for this.
  const handleJsChange = ({ type, name, oldName }) => {
    setHeadHtml((h) =>
      type === "create" ? linkJsInHtml(h, [name])
      : type === "rename" ? relinkJsInHtml(h, oldName, name)
      : unlinkJsInHtml(h, [name])
    );
    setSaveStatus("unsaved");
  };

  const share = async () => {
    try {
      let id = projectId;
      const mp = pages.map((p) => p.id === activePageId ? { ...p, elements, head_html: headHtml, canvas_bg: canvasBg, fonts, custom_js: customJs } : p);
      const payload = { id: projectId, name: projectName,
        elements, head_html: headHtml, canvas_bg: canvasBg, fonts, files, custom_js: customJs,
        seo: activePage?.seo || {}, pages: mp, active_page_id: activePageId, template, analytics };
      if (!id) {
        const res = await axios.post(`${API}/projects`, payload); id = res.data.id; setProjectId(id);
      } else {
        await axios.put(`${API}/projects/${id}`, payload);
      }
      const url = `${process.env.REACT_APP_BACKEND_URL}/api/preview/${id}`;
      await navigator.clipboard.writeText(url);
      toast.success("Preview URL copied to clipboard");
    } catch { toast.error("Share failed"); }
  };

  // Ensures the project is saved on the backend and returns its id so the
  // Publish modal can POST to /api/projects/{id}/publish.
  const ensureSaved = async () => {
    const mp = pages.map((p) => p.id === activePageId ? { ...p, elements, head_html: headHtml, canvas_bg: canvasBg, fonts, custom_js: customJs } : p);
    const p = { id: projectId, name: projectName,
      elements, head_html: headHtml, canvas_bg: canvasBg, fonts, files, custom_js: customJs,
      seo: activePage?.seo || {}, pages: mp, active_page_id: activePageId, template, analytics };
    try {
      if (projectId) { await axios.put(`${API}/projects/${projectId}`, p); return projectId; }
      const res = await axios.post(`${API}/projects`, p);
      setProjectId(res.data.id);
      return res.data.id;
    } catch (e) {
      console.error("ensureSaved error:", e?.response?.data || e?.message || e);
      return null;
    }
  };

  // Ctrl+Shift+A in Design mode: highlight all block occurrences that share
  // the currently selected block's data-wd-block id — the Design-window
  // analogue of Monaco's "select all occurrences" (whose CodeEditor binding
  // handles this when the Monaco editor is focused). Pure view state: it
  // never mutates elements, so it's safe to run inside this re-attaching
  // keydown effect against the latest `elements`/`selectedId` closures.
  // Returns the ids to highlight, or [] to clear.
  const toggleSameBlockHighlight = useCallback(() => {
    const selected = elements.find((e) => e.id === selectedId);
    if (!selected) { setSameBlockHighlight([]); return; }
    const blockId = (selected.html.match(/data-wd-block="([^"]*)"/) || [])[1];
    if (!blockId) { setSameBlockHighlight(elements.map((e) => e.id)); return; } // fallback: highlight everything
    const matches = elements.filter((e) => (e.html.match(/data-wd-block="([^"]*)"/) || [])[1] === blockId).map((e) => e.id);
    setSameBlockHighlight((cur) => (cur.length > 0 ? [] : matches));
  }, [elements, selectedId]);

  // Global keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.shiftKey && (e.key === "A" || e.key === "a") && document.activeElement === document.body) { e.preventDefault(); toggleSameBlockHighlight(); return; }
      if (meta && e.key.toLowerCase() === "z" && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if (meta && (e.key.toLowerCase() === "z" && e.shiftKey || e.key.toLowerCase() === "y")) { e.preventDefault(); redo(); return; }
      if (meta && e.key.toLowerCase() === "s" && e.shiftKey) { e.preventDefault(); saveAs(); return; }
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
        { id: "save-as", label: "Save As…", shortcut: "Ctrl+Shift+S", icon: Save, onRun: saveAs },
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
        { id: "toggle-left", label: leftCollapsed ? "Show library panel" : "Hide library panel", icon: leftCollapsed ? ChevronRight : ChevronLeft, onRun: () => setLeftCollapsed((v) => !v) },
        { id: "toggle-right", label: rightCollapsed ? "Show inspector panel" : "Hide inspector panel", icon: rightCollapsed ? ChevronLeft : ChevronRight, onRun: () => setRightCollapsed((v) => !v) },
      ],
    },
    {
      heading: "Panels", items: [
        { id: "assets", label: "Design tokens", icon: Palette, onRun: () => setAssetsOpen(true) },
        { id: "analytics", label: "Analytics", icon: BarChart3, onRun: () => setAnalyticsOpen(true) },
        { id: "templates", label: "Project templates", icon: LayoutTemplate, onRun: () => setTemplatesOpen(true) },
        { id: "submissions", label: "Form submissions inbox", icon: Inbox, onRun: () => setSubmissionsOpen(true) },
        { id: "dashboard", label: "E-commerce dashboard", icon: Store, onRun: () => setDashboardOpen(true) },
        ...(hasZeneroContent ? [{ id: "zenero", label: "Zenero content dashboard", icon: Megaphone, onRun: () => setZeneroOpen(true) }] : []),
      ],
    },
    {
      heading: "Help", items: [
        { id: "tour", label: "Getting Started Tour", icon: HelpCircle, onRun: () => setTourForce((v) => v + 1) },
      ],
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [project, past.length, future.length, selected, zoom, hasZeneroContent]);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#15130E] text-[#F1EDE2] overflow-hidden text-sm" style={{ fontFamily: "Manrope, sans-serif" }} data-testid="builder-shell">
      <TopBar
        mode={mode} setMode={setMode}
        projectName={projectName} setProjectName={setProjectName}
        onImportSections={onImportSections}
        project={project}
        onOpenTransfer={() => setTransferOpen(true)}
        onSave={save} onSaveAs={saveAs} saveStatus={saveStatus} onOpenLoad={openLoad} onShare={share}
        peers={peers}
        onPublish={() => setPublishOpen(true)}
        onStartTour={() => setTourForce((v) => v + 1)}
        onFind={() => setFindOpen(true)}
        onAssets={() => setAssetsOpen(true)}
        onAnalytics={() => setAnalyticsOpen(true)}
        onTemplates={() => setTemplatesOpen(true)}
        onSubmissions={() => setSubmissionsOpen(true)}
        onDashboard={() => setDashboardOpen(true)}
        onZeneroDashboard={hasZeneroContent ? () => setZeneroOpen(true) : null}
        onUndo={undo} onRedo={redo}
        canUndo={past.length > 0} canRedo={future.length > 0}
        viewport={viewport} setViewport={setViewport}
      />

      <MenuBar
        project={project}
        onNew={newProject} onOpen={openLoad} onSave={save} onSaveAs={saveAs}
        onUndo={undo} onRedo={redo} canUndo={past.length > 0} canRedo={future.length > 0}
        onCut={cutEl} onCopy={copyEl} onPaste={pasteEl} hasSelection={!!selected}
        onSearchBlocks={focusLibrarySearch} onFindReplace={() => setFindOpen(true)}
        zoom={zoom} onZoomIn={zoomIn} onZoomOut={zoomOut} onZoomReset={zoomReset}
        onHelpTour={() => setTourForce((v) => v + 1)}
        onOpenPalette={() => setPaletteOpen(true)}
        onOpenThemes={() => setThemeGalleryOpen(true)}
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
        onSetType={setPageType}
        onOpenSeo={() => setSeoOpen(true)}
        onOpenTemplate={() => setTemplateEditorOpen(true)}
      />

      {/* Full-width like PagesBar, deliberately outside the sidebar/canvas
          flex row below — LeftSidebar/RightSidebar mount and unmount based
          on `mode`, and this bar must not shift position when they do. */}
      <div className="h-9 flex-none border-b border-[#332D22] bg-[#1C1A15] flex items-center px-3" data-testid="mode-toggle">
        <div className="flex items-center bg-[#15130E] border border-[#332D22] rounded-md p-0.5">
          <button onClick={() => setMode("design")} className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded ${mode === "design" ? "bg-[#242019] text-[#F1EDE2]" : "text-[#A79C87] hover:text-[#F1EDE2]"}`} data-testid="mode-design"><MousePointer2 size={12} /> Design</button>
          <button onClick={() => setMode("code")} className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded ${mode === "code" ? "bg-[#242019] text-[#F1EDE2]" : "text-[#A79C87] hover:text-[#F1EDE2]"}`} data-testid="mode-code"><Code2 size={12} /> Code</button>
          <button onClick={() => setMode("split")} className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded ${mode === "split" ? "bg-[#242019] text-[#F1EDE2]" : "text-[#A79C87] hover:text-[#F1EDE2]"}`} data-testid="mode-split"><Columns2 size={12} /> Split View</button>
          <button onClick={() => setMode("outline")} className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded ${mode === "outline" ? "bg-[#242019] text-[#F1EDE2]" : "text-[#A79C87] hover:text-[#F1EDE2]"}`} data-testid="mode-outline"><Presentation size={12} /> Outline</button>
          <button onClick={() => setMode("preview")} className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded ${mode === "preview" ? "bg-[#242019] text-[#F1EDE2]" : "text-[#A79C87] hover:text-[#F1EDE2]"}`} data-testid="mode-preview"><Eye size={12} /> Preview</button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {mode !== "preview" && mode !== "outline" && (
          leftCollapsed ? (
            <button
              onClick={() => setLeftCollapsed(false)}
              className="w-6 flex-none border-r border-[#332D22] bg-[#1C1A15] flex items-start justify-center pt-3 text-[#948C79] hover:text-[#F1EDE2] hover:bg-[#242019]"
              title="Expand library"
              data-testid="left-sidebar-expand"
            ><ChevronRight size={14} /></button>
          ) : (
            <div className="relative flex-none flex">
              <LeftSidebar
                onAddBlock={(html, atIndex) => addBlock(html, atIndex)}
                onAddFont={addFont} onAddFontFile={addFontFile}
                fonts={fonts}
                files={files}
                onFilesChange={setFiles}
                onFileClick={(node) => node.type !== "folder" && setEditingFileId(node.id)}
                onImportFile={onImportFile}
                onInsertAllHtml={onInsertAllHtml}
                savedComponents={savedComponents}
                onDeleteSavedComponent={deleteSavedComponent}
                onWrapSelection={wrapSelectionWithContainer}
                hasSelection={!!selected}
                selectedHtml={selected?.html || ""}
                selectedId={selectedId}
                pages={pages}
                activePageId={activePageId}
                onSwitchPage={switchPage}
                onJsChange={handleJsChange}
                projectId={projectId}
                onEditSelected={(html) => selected && editHtml(selected.id, html)}
                onOpenFormBuilder={() => setFormBuilderOpen(true)}
                onOpenPaymentBuilder={() => setPaymentBuilderOpen(true)}
                onOpenSocialBuilder={() => setSocialBuilderOpen(true)}
                onOpenStreamEmbed={() => setStreamEmbedOpen(true)}
                onWireCatalog={wireCatalog}
                onAddCart={addCartRuntime}
                onSavePaypalSecret={savePaypalSecret}
                onSaveSmtpConfig={saveSmtpConfig}
                headHtml={headHtml}
              />
              <button
                onClick={() => setLeftCollapsed(true)}
                className="absolute top-2 -right-3 z-10 w-6 h-6 rounded-full bg-[#242019] border border-[#332D22] flex items-center justify-center text-[#A79C87] hover:text-[#F1EDE2] hover:bg-[#332D22]"
                title="Collapse library"
                data-testid="left-sidebar-collapse"
              ><ChevronLeft size={12} /></button>
            </div>
          )
        )}

        <div className="flex-1 flex flex-col overflow-hidden min-w-0" data-testid="center-pane">
          <div className="flex-1 flex overflow-hidden">
        {mode === "design" && (
          <Canvas
            elements={elements}
            selectedId={selectedId}
            sameBlockHighlight={sameBlockHighlight}
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
          <div className="flex-1 flex flex-col bg-[#15130E] overflow-hidden" data-testid="preview-mode">
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#332D22] bg-[#1C1A15] text-xs">
              <div className="flex items-center gap-2 text-[#A79C87]">
                <Eye size={12} className="text-emerald-400" /> Live preview · {viewport} · what your visitors will see
                {pages.length > 1 && <span className="text-[#948C79]">· {(pages.find((p) => p.id === previewPageId) || activePage)?.name || "Page"}</span>}
              </div>
              <div className="text-[10px] text-[#948C79] font-mono">{previewProject.elements.length} block{previewProject.elements.length === 1 ? "" : "s"} · exit via Design tab</div>
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
                key={previewPageId || "active"}
                title="live-preview"
                srcDoc={buildStandaloneHtml(previewProject, { previewNav: true })}
                className="bg-white shadow-2xl border border-[#332D22] transition-all"
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
            pageElements={elements}
            pageName={(pages.find((p) => p.id === activePageId) || {}).name || ""}
          />
        )}
          </div>
        </div>

        {mode !== "preview" && mode !== "outline" && (
          rightCollapsed ? (
            <button
              onClick={() => setRightCollapsed(false)}
              className="w-6 flex-none border-l border-[#332D22] bg-[#1C1A15] flex items-start justify-center pt-3 text-[#948C79] hover:text-[#F1EDE2] hover:bg-[#242019]"
              title="Expand inspector"
              data-testid="right-sidebar-expand"
            ><ChevronLeft size={14} /></button>
          ) : (
            <div className="relative flex-none flex">
              <button
                onClick={() => setRightCollapsed(true)}
                className="absolute top-2 -left-3 z-10 w-6 h-6 rounded-full bg-[#242019] border border-[#332D22] flex items-center justify-center text-[#A79C87] hover:text-[#F1EDE2] hover:bg-[#332D22]"
                title="Collapse inspector"
                data-testid="right-sidebar-collapse"
              ><ChevronRight size={12} /></button>
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
                onApplyAnimationToIds={applyAnimationToIds}
                viewport={viewport}
                onPatchResponsive={patchResponsiveStyle}
                onResetResponsive={resetResponsiveProperty}
              />
            </div>
          )
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
        <DialogContent className="bg-[#1C1A15] border border-[#332D22] text-[#F1EDE2]" data-testid="load-modal">
          <DialogHeader><DialogTitle>Open project</DialogTitle></DialogHeader>
          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {projects.length === 0 && <div className="text-sm text-[#A79C87]">No saved projects yet.</div>}
            {projects.map((p) => (
              <div key={p.id} className="flex items-center gap-2 p-2 rounded border border-[#332D22] bg-[#15130E] hover:border-[#C9A227]/60" data-testid={`project-row-${p.id}`}>
                <button className="flex-1 text-left" onClick={() => loadProject(p.id)}>
                  <div className="text-sm text-[#F1EDE2]">{p.name}</div>
                  <div className="text-[11px] text-[#948C79] font-mono">{new Date(p.updated_at).toLocaleString()}</div>
                </button>
                <button onClick={() => deleteProject(p.id)} className="p-1.5 text-[#A79C87] hover:text-red-400" data-testid={`project-delete-${p.id}`}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="bg-[#1C1A15] border border-[#332D22] text-[#F1EDE2] max-w-2xl" data-testid="import-sections-modal">
          <DialogHeader><DialogTitle>Imported sections — {importedSections.length}</DialogTitle></DialogHeader>
          <div className="text-xs text-[#A79C87] mb-2">Detected components from your HTML. Click to add to canvas.</div>
          <div className="space-y-1 max-h-[420px] overflow-y-auto">
            {importedSections.map((s) => (
              <button
                key={s.id}
                onClick={() => insertImportedSection(s)}
                className="w-full flex items-center gap-3 p-2 rounded border border-[#332D22] bg-[#15130E] hover:border-[#C9A227]/60 text-left"
                data-testid={`imported-${s.id}`}
              >
                <div className="w-1 h-4 bg-[#C9A227] rounded" />
                <span className="text-sm font-mono text-[#F1EDE2]">{s.label}</span>
                <span className="ml-auto text-[10px] text-[#948C79] truncate max-w-[240px]">{s.html.slice(0, 60)}…</span>
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
        hasDashboardLogin={pages.some((p) => (p.elements || []).some((e) => e.html?.includes('data-forge-widget="dashboard-login"')))}
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
        onLoadTemplate={(tpl) => setSelectedTemplate(tpl)}
      />

      <TemplateApplyModal
        template={selectedTemplate}
        onWrap={(tpl) => {
          const changes = applyTemplate(project, tpl, "wrap");
          if (changes) {
            setHeadHtml(changes.head_html);
            setCanvasBg(changes.canvas_bg);
            setFonts(changes.fonts);
            toast.success(`Wrapped “${tpl.name}” styles into current project`);
          }
          setSelectedTemplate(null);
        }}
        onNew={(tpl) => {
          setSelectedTemplate(null);
          loadFromTemplate(tpl);
        }}
        onCancel={() => {
          setSelectedTemplate(null);
        }}
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

      <AlertDialog open={newProjectConfirmOpen} onOpenChange={setNewProjectConfirmOpen}>
        <AlertDialogContent className="bg-[#1C1A15] border border-[#332D22] text-[#F1EDE2]" data-testid="new-project-confirm-modal">
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#948C79]">Starting a new project will discard your unsaved changes to this one.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#242019] hover:bg-[#332D22] text-[#F1EDE2] border border-[#332D22]" data-testid="new-project-confirm-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setNewProjectConfirmOpen(false); setNewProjectOpen(true); }} className="bg-[#AD8B21] hover:bg-[#C9A227] text-[#F1EDE2]" data-testid="new-project-confirm-discard">Discard & start new</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <NewProjectModal
        open={newProjectOpen}
        onClose={() => setNewProjectOpen(false)}
        onBlank={() => window.location.reload()}
        onFromTemplate={() => setTemplatesOpen(true)}
        onFromWizard={() => setWizardOpen(true)}
      />

      <NewProjectWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onCreate={startFromWizard}
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

      <EcommerceDashboardModal
        open={dashboardOpen}
        onClose={() => setDashboardOpen(false)}
        projectId={projectId}
      />

      <ZeneroDashboardModal
        open={zeneroOpen}
        onClose={() => setZeneroOpen(false)}
        projectId={projectId}
      />

      <OnboardingTour key={tourForce} force={tourForce > 0} />
      <ThemeGallery isOpen={themeGalleryOpen} onClose={() => setThemeGalleryOpen(false)} />
    </div>
  );
}
