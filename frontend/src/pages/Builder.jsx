import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { TopBar } from "@/components/builder/TopBar";
import { LeftSidebar } from "@/components/builder/LeftSidebar";
import { RightSidebar } from "@/components/builder/RightSidebar";
import { Canvas } from "@/components/builder/Canvas";
import { CodeView } from "@/components/builder/CodeView";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const uid = () => "el_" + Math.random().toString(36).slice(2, 10);

// Extract first style="…" attribute from a HTML string and apply a patch.
const patchFirstStyle = (html, patch) => {
  if (/style="([^"]*)"/.test(html)) {
    return html.replace(/style="([^"]*)"/, (_, styles) => {
      const parts = styles.split(";").map((s) => s.trim()).filter(Boolean);
      const map = {};
      parts.forEach((p) => {
        const idx = p.indexOf(":");
        if (idx > 0) map[p.slice(0, idx).trim()] = p.slice(idx + 1).trim();
      });
      Object.assign(map, patch);
      const merged = Object.entries(map).map(([k, v]) => `${k}: ${v}`).join("; ");
      return `style="${merged}"`;
    });
  }
  // Inject style into the first tag
  const styleStr = Object.entries(patch).map(([k, v]) => `${k}: ${v}`).join("; ");
  return html.replace(/<([a-zA-Z][^ >]*)(\s|>)/, (_, tag, s) => `<${tag} style="${styleStr}"${s}`);
};

export default function Builder() {
  const [mode, setMode] = useState("design");
  const [projectId, setProjectId] = useState(null);
  const [projectName, setProjectName] = useState("Untitled");
  const [elements, setElements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [canvasBg, setCanvasBg] = useState("#ffffff");
  const [headHtml, setHeadHtml] = useState("");
  const [fonts, setFonts] = useState([]);
  const [loadOpen, setLoadOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [importOpen, setImportOpen] = useState(false);
  const [importedSections, setImportedSections] = useState([]);

  const selected = useMemo(() => elements.find((e) => e.id === selectedId) || null, [elements, selectedId]);

  const project = { name: projectName, elements, head_html: headHtml, canvas_bg: canvasBg, fonts };

  const addBlock = useCallback((html, atIndex) => {
    const el = { id: uid(), html };
    setElements((els) => {
      const idx = typeof atIndex === "number" ? atIndex : els.length;
      const next = [...els];
      next.splice(idx, 0, el);
      return next;
    });
    setSelectedId(el.id);
  }, []);

  const removeEl = (id) => {
    setElements((els) => els.filter((e) => e.id !== id));
    if (selectedId === id) setSelectedId(null);
  };
  const moveEl = (id, delta) => {
    setElements((els) => {
      const i = els.findIndex((e) => e.id === id);
      if (i < 0) return els;
      const j = Math.max(0, Math.min(els.length - 1, i + delta));
      if (i === j) return els;
      const next = [...els];
      const [item] = next.splice(i, 1);
      next.splice(j, 0, item);
      return next;
    });
  };
  const dupEl = (id) => {
    setElements((els) => {
      const i = els.findIndex((e) => e.id === id);
      if (i < 0) return els;
      const clone = { id: uid(), html: els[i].html };
      const next = [...els];
      next.splice(i + 1, 0, clone);
      return next;
    });
  };

  const applyBackground = (value) => {
    if (!selected) return;
    setElements((els) => els.map((e) => e.id === selected.id ? { ...e, html: patchFirstStyle(e.html, { background: value }) } : e));
  };
  const applyColor = (value) => {
    if (!selected) return;
    setElements((els) => els.map((e) => e.id === selected.id ? { ...e, html: patchFirstStyle(e.html, { color: value }) } : e));
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
    setImportedSections(sections);
    setImportOpen(true);
  };

  const insertImportedSection = (sec) => {
    addBlock(sec.html);
    toast.success(`Inserted ${sec.label}`);
  };

  // Save/Load ---
  const save = async () => {
    try {
      if (projectId) {
        await axios.put(`${API}/projects/${projectId}`, project);
      } else {
        const res = await axios.post(`${API}/projects`, project);
        setProjectId(res.data.id);
      }
      toast.success("Project saved");
    } catch (e) {
      toast.error("Save failed");
      console.error(e);
    }
  };

  const openLoad = async () => {
    try {
      const res = await axios.get(`${API}/projects`);
      setProjects(res.data);
      setLoadOpen(true);
    } catch (e) {
      toast.error("Failed to fetch projects");
    }
  };

  const loadProject = async (id) => {
    try {
      const res = await axios.get(`${API}/projects/${id}`);
      const p = res.data;
      setProjectId(p.id);
      setProjectName(p.name);
      setElements((p.elements || []).map((e) => ({ id: e.id || uid(), html: e.html })));
      setHeadHtml(p.head_html || "");
      setCanvasBg(p.canvas_bg || "#ffffff");
      setFonts(p.fonts || []);
      setSelectedId(null);
      setLoadOpen(false);
      toast.success(`Loaded ${p.name}`);
    } catch (e) {
      toast.error("Failed to load");
    }
  };

  const deleteProject = async (id) => {
    try {
      await axios.delete(`${API}/projects/${id}`);
      setProjects((p) => p.filter((x) => x.id !== id));
      if (projectId === id) setProjectId(null);
      toast.success("Deleted");
    } catch { toast.error("Delete failed"); }
  };

  // deselect on canvas blank click
  useEffect(() => {
    const onKey = (e) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId && document.activeElement === document.body) {
        removeEl(selectedId);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId]);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0D0D0D] text-white overflow-hidden text-sm" style={{ fontFamily: "Manrope, sans-serif" }} data-testid="builder-shell">
      <TopBar
        mode={mode} setMode={setMode}
        projectName={projectName} setProjectName={setProjectName}
        onImportSections={onImportSections}
        project={project}
        onSave={save}
        onOpenLoad={openLoad}
      />

      <div className="flex-1 flex overflow-hidden">
        <LeftSidebar onAddBlock={(html) => addBlock(html)} onAddFont={addFont} fonts={fonts} />

        {mode === "design" ? (
          <Canvas
            elements={elements}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onDrop={(html, idx) => addBlock(html, idx)}
            onDelete={removeEl}
            onMove={moveEl}
            onDuplicate={dupEl}
            canvasBg={canvasBg}
            headHtml={headHtml}
          />
        ) : (
          <CodeView project={project} headHtml={headHtml} onHeadHtmlChange={setHeadHtml} />
        )}

        <RightSidebar
          selected={selected}
          onApplyBackground={applyBackground}
          onApplyColor={applyColor}
          canvasBg={canvasBg}
          onCanvasBg={setCanvasBg}
        />
      </div>

      {/* Load project modal */}
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

      {/* Imported sections modal */}
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
    </div>
  );
}
