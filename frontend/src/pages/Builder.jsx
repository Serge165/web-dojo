import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { TopBar } from "@/components/builder/TopBar";
import { LeftSidebar } from "@/components/builder/LeftSidebar";
import { RightSidebar } from "@/components/builder/RightSidebar";
import { Canvas } from "@/components/builder/Canvas";
import { CodeView } from "@/components/builder/CodeView";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, Eye, MousePointer2, Code2 } from "lucide-react";
import { PublishModal } from "@/components/builder/PublishModal";
import { OnboardingTour } from "@/components/builder/OnboardingTour";
import { PagesBar } from "@/components/builder/PagesBar";
import { TemplateEditor } from "@/components/builder/TemplateEditor";
import { SeoPanel } from "@/components/builder/SeoPanel";
import { FindReplaceModal } from "@/components/builder/FindReplaceModal";
import { AssetsLibrary } from "@/components/builder/AssetsLibrary";
import { AnalyticsModal } from "@/components/builder/AnalyticsModal";
import { ProjectTemplatesModal } from "@/components/builder/ProjectTemplatesModal";
import { FormBuilderModal } from "@/components/builder/FormBuilderModal";
import { AddPageModal } from "@/components/builder/AddPageModal";
import { PaymentButtonModal } from "@/components/builder/PaymentButtonModal";
import { SocialShareModal } from "@/components/builder/SocialShareModal";
import { ImportExportModal } from "@/components/builder/ImportExportModal";
import { SubmissionsModal } from "@/components/builder/SubmissionsModal";
import { buildStandaloneHtml } from "@/lib/exportHtml";
import { buildCartRuntimeHtml } from "@/lib/cart";
import { scanHtml } from "@/lib/importHtml";

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

export default function Builder() {
  const [mode, setMode] = useState("design");
  const [viewport, setViewport] = useState("desktop");
  const [projectId, setProjectId] = useState(null);
  const [projectName, setProjectName] = useState("Untitled");
  const [elements, setElements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [canvasBg, setCanvasBg] = useState("#ffffff");
  const [headHtml, setHeadHtml] = useState("");
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
  const [pages, setPages] = useState(() => [{ id: "home", name: "Home", slug: "index", status: "draft", seo: {}, elements: [], head_html: "", canvas_bg: "#ffffff", fonts: [] }]);
  const [activePageId, setActivePageId] = useState("home");
  const [template, setTemplate] = useState({ header_html: "", footer_html: "", use_template: false });
  const [findOpen, setFindOpen] = useState(false);
  const [assetsOpen, setAssetsOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [formBuilderOpen, setFormBuilderOpen] = useState(false);
  const [addPageOpen, setAddPageOpen] = useState(false);
  const [paymentBuilderOpen, setPaymentBuilderOpen] = useState(false);
  const [socialBuilderOpen, setSocialBuilderOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [templateEditorOpen, setTemplateEditorOpen] = useState(false);
  const [seoOpen, setSeoOpen] = useState(false);
  const [submissionsOpen, setSubmissionsOpen] = useState(false);

  // Undo/Redo history stack for the doc state.
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const skipHistory = useRef(false);
  const pastRef = useRef(past);
  const futureRef = useRef(future);
  useEffect(() => { pastRef.current = past; }, [past]);
  useEffect(() => { futureRef.current = future; }, [future]);

  const doc = useMemo(() => ({ elements, canvasBg, headHtml, fonts, files }), [elements, canvasBg, headHtml, fonts, files]);
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

  const undo = () => {
    const p = pastRef.current;
    if (p.length === 0) return;
    const prev = p[p.length - 1];
    skipHistory.current = true;
    setFuture((f) => [docRef.current, ...f].slice(0, 50));
    setPast(p.slice(0, -1));
    setElements(prev.elements); setCanvasBg(prev.canvasBg); setHeadHtml(prev.headHtml); setFonts(prev.fonts); setFiles(prev.files || []);
  };
  const redo = () => {
    const f = futureRef.current;
    if (f.length === 0) return;
    const next = f[0];
    skipHistory.current = true;
    setPast((p) => [...p, docRef.current]);
    setFuture(f.slice(1));
    setElements(next.elements); setCanvasBg(next.canvasBg); setHeadHtml(next.headHtml); setFonts(next.fonts); setFiles(next.files || []);
  };

  const selected = useMemo(() => elements.find((e) => e.id === selectedId) || null, [elements, selectedId]);

  // Keep the active page's snapshot in sync with the editing state.
  useEffect(() => {
    setPages((ps) => ps.map((p) => p.id === activePageId ? { ...p, elements, head_html: headHtml, canvas_bg: canvasBg, fonts } : p));
  }, [elements, headHtml, canvasBg, fonts, activePageId]);

  const activePage = useMemo(() => pages.find((p) => p.id === activePageId) || pages[0], [pages, activePageId]);

  const project = {
    name: projectName,
    // legacy top-level fields mirror the active page for backward compat
    elements, head_html: headHtml, canvas_bg: canvasBg, fonts, files,
    seo: activePage?.seo || {},
    pages, active_page_id: activePageId, template,
  };

  // ------------- Page ops -------------
  const switchPage = (id) => {
    const target = pages.find((p) => p.id === id);
    if (!target || id === activePageId) return;
    // Persist current edits into pages first (effect will run, but this keeps immediate state clean)
    setPages((ps) => ps.map((p) => p.id === activePageId ? { ...p, elements, head_html: headHtml, canvas_bg: canvasBg, fonts } : p));
    setActivePageId(id);
    setElements(target.elements || []);
    setHeadHtml(target.head_html || "");
    setCanvasBg(target.canvas_bg || "#ffffff");
    setFonts(target.fonts || []);
    setSelectedId(null);
  };
  const newPage = () => {
    const id = uid();
    const name = `Page ${pages.length + 1}`;
    setPages((ps) => {
      const persisted = ps.map((p) => p.id === activePageId ? { ...p, elements, head_html: headHtml, canvas_bg: canvasBg, fonts } : p);
      return [...persisted, { id, name, slug: name.toLowerCase().replace(/\s+/g, "-"), status: "draft", seo: {}, elements: [], head_html: "", canvas_bg: "#ffffff", fonts: [] }];
    });
    setActivePageId(id);
    setElements([]);
    setHeadHtml("");
    setCanvasBg("#ffffff");
    setFonts([]);
    setSelectedId(null);
  };
  const addPageFromLayout = (layout) => {
    const id = uid();
    const els = (layout.blocks || []).map((html) => ({ id: uid(), html }));
    const bg = layout.canvasBg || "#ffffff";
    const fnts = layout.fonts || [];
    setPages((ps) => {
      const persisted = ps.map((p) => p.id === activePageId ? { ...p, elements, head_html: headHtml, canvas_bg: canvasBg, fonts } : p);
      return [...persisted, { id, name: layout.label, slug: layout.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""), status: "draft", seo: {}, elements: els, head_html: "", canvas_bg: bg, fonts: fnts }];
    });
    setActivePageId(id);
    setElements(els);
    setHeadHtml("");
    setCanvasBg(bg);
    setFonts(fnts);
    setSelectedId(null);
    toast.success(`Added "${layout.label}" page`);
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
    setElements((els) => els.filter((e) => e.id !== id));
    if (selectedId === id) setSelectedId(null);
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
  const toggleVisible = (id) => setElements((els) => els.map((e) => e.id === id ? { ...e, hidden: !e.hidden } : e));
  const setZIndex = (id, z) => setElements((els) => els.map((e) => e.id === id ? { ...e, zIndex: z } : e));
  const editHtml = (id, html) => setElements((els) => els.map((e) => e.id === id ? { ...e, html } : e));
  const replaceSelectedHtml = (html) => { if (!selected) return; editHtml(selected.id, html); };

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
  const applyBackground = (value) => patchStyle({ background: value });
  const applyColor = (value) => patchStyle({ color: value });

  const applyAnimation = ({ keyframes, shorthand }) => {
    if (!selected) return;
    setHeadHtml((h) => `${h ? h + "\n" : ""}<style data-forge-anim="${selected.id}">\n${keyframes}\n</style>`);
    patchStyle({ animation: shorthand });
  };

  const applyTheme = ({ headHtml: themeHead, canvasBg: themeBg, googleFont }) => {
    // Strip any prior forge-theme style block, then append new.
    setHeadHtml((h) => (h || "").replace(/<link[^>]*fonts\.googleapis[^>]*>|<style data-forge-theme=[^>]*>[\s\S]*?<\/style>/g, "").trim() + (h ? "\n" : "") + themeHead);
    if (themeBg) setCanvasBg(themeBg);
    if (googleFont && !fonts.includes(googleFont)) setFonts((f) => [...f, googleFont]);
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
    const src = (data.pages && data.pages.length) ? data.pages : [{ id: uid(), name: "Home", slug: "index", status: "draft", seo: {}, elements: [], head_html: "", canvas_bg: "#ffffff", fonts: [] }];
    const nextPages = src.map((pg) => ({ ...pg, id: uid() }));
    setPages(nextPages);
    setActivePageId(nextPages[0].id);
    setElements(nextPages[0].elements || []);
    setHeadHtml(nextPages[0].head_html || "");
    setCanvasBg(nextPages[0].canvas_bg || "#ffffff");
    setFonts(nextPages[0].fonts || []);
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
  const save = async () => {
    try {
      if (projectId) {
        await axios.put(`${API}/projects/${projectId}`, project);
      } else {
        const res = await axios.post(`${API}/projects`, project);
        setProjectId(res.data.id);
      }
      toast.success("Project saved");
    } catch (e) { toast.error("Save failed"); console.error(e); }
  };

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
        }));
        const found = nextPages.find((x) => x.id === p.active_page_id);
        activeId = found ? found.id : nextPages[0].id;
      } else {
        const homeId = uid();
        nextPages = [{
          id: homeId, name: p.name || "Home", slug: "index", status: "draft", seo: {},
          elements: (p.elements || []).map((e) => ({ id: e.id || uid(), html: e.html, hidden: !!e.hidden, zIndex: e.zIndex || 0 })),
          head_html: p.head_html || "", canvas_bg: p.canvas_bg || "#ffffff", fonts: p.fonts || [],
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
      setTemplate(p.template || { header_html: "", footer_html: "", use_template: false });
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
      canvas_bg: data.canvas_bg || "#ffffff", fonts: data.fonts || [],
    }];
    const nextPages = templatePages.map((pg) => ({ ...pg, id: uid() }));
    setPages(nextPages);
    setActivePageId(nextPages[0].id);
    setElements(nextPages[0].elements || []);
    setHeadHtml(nextPages[0].head_html || "");
    setCanvasBg(nextPages[0].canvas_bg || "#ffffff");
    setFonts(nextPages[0].fonts || []);
    setTemplate(data.template || { header_html: "", footer_html: "", use_template: false });
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
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId && document.activeElement === document.body) {
        e.preventDefault(); removeEl(selectedId);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }); // re-attach each render so closures use latest state

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0D0D0D] text-white overflow-hidden text-sm" style={{ fontFamily: "Manrope, sans-serif" }} data-testid="builder-shell">
      <TopBar
        mode={mode} setMode={setMode}
        projectName={projectName} setProjectName={setProjectName}
        onImportSections={onImportSections}
        project={project}
        onOpenTransfer={() => setTransferOpen(true)}
        onSave={save} onOpenLoad={openLoad} onShare={share}
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

      <div className="flex-1 flex overflow-hidden">
        {mode !== "preview" && (
          <LeftSidebar
            onAddBlock={(html, atIndex) => addBlock(html, atIndex)}
            onAddFont={addFont}
            fonts={fonts}
            files={files}
            onFilesChange={setFiles}
            onFileClick={() => {}}
            savedComponents={savedComponents}
            onDeleteSavedComponent={deleteSavedComponent}
            onWrapSelection={wrapSelectionWithContainer}
            hasSelection={!!selected}
            selectedHtml={selected?.html || ""}
            onOpenFormBuilder={() => setFormBuilderOpen(true)}
            onOpenPaymentBuilder={() => setPaymentBuilderOpen(true)}
            onOpenSocialBuilder={() => setSocialBuilderOpen(true)}
            onWireCatalog={wireCatalog}
            headHtml={headHtml}
          />
        )}

        <div className="flex-1 flex flex-col overflow-hidden min-w-0" data-testid="center-pane">
          <div className="h-9 flex-none border-b border-[#2B2B2B] bg-[#141414] flex items-center px-3" data-testid="mode-toggle">
            <div className="flex items-center bg-[#0D0D0D] border border-[#2B2B2B] rounded-md p-0.5">
              <button onClick={() => setMode("design")} className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded ${mode === "design" ? "bg-[#1F1F1F] text-white" : "text-gray-400 hover:text-gray-200"}`} data-testid="mode-design"><MousePointer2 size={12} /> Design</button>
              <button onClick={() => setMode("code")} className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded ${mode === "code" ? "bg-[#1F1F1F] text-white" : "text-gray-400 hover:text-gray-200"}`} data-testid="mode-code"><Code2 size={12} /> Code</button>
              <button onClick={() => setMode("preview")} className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded ${mode === "preview" ? "bg-[#1F1F1F] text-white" : "text-gray-400 hover:text-gray-200"}`} data-testid="mode-preview"><Eye size={12} /> Preview</button>
            </div>
          </div>
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
          />
        )}
        {mode === "code" && (
          <CodeView project={project} headHtml={headHtml} onHeadHtmlChange={setHeadHtml} />
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
              {/* Sandbox intentionally allows scripts + same-origin because the content
                  is authored by the user and rendered via srcDoc (no cross-origin risk). */}
              <iframe
                title="live-preview"
                srcDoc={buildStandaloneHtml(project)}
                className="bg-white shadow-2xl border border-[#2B2B2B] transition-all"
                style={{
                  width: viewport === "mobile" ? "390px" : viewport === "tablet" ? "820px" : "1280px",
                  height: "100%",
                  minHeight: "600px",
                }}
                sandbox="allow-forms allow-same-origin allow-scripts"
                data-testid="preview-iframe"
              />
            </div>
          </div>
        )}
          </div>
        </div>

        {mode !== "preview" && (
          <RightSidebar
            selected={selected}
            onApplyBackground={applyBackground}
            onApplyColor={applyColor}
            onPatchStyle={patchStyle}
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
          />
        )}
      </div>

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
      />

      <OnboardingTour key={tourForce} force={tourForce > 0} />
    </div>
  );
}
