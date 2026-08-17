import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Global snippet library — reusable code fragments (HTML/CSS/JS) that persist
// across projects. Drag onto the canvas to insert as a fresh element.
export const SnippetsTab = ({ onInsertHtml, selectedHtml }) => {
  const [snippets, setSnippets] = useState([]);
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("html");
  const [content, setContent] = useState("");

  const load = () => axios.get(`${API}/snippets`).then((r) => setSnippets(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!name.trim() || !content.trim()) { toast.error("Name and content required"); return; }
    try {
      const r = await axios.post(`${API}/snippets`, { name: name.trim(), language, content });
      setSnippets((s) => [r.data, ...s]);
      setName(""); setContent("");
      toast.success("Snippet saved");
    } catch { toast.error("Save failed"); }
  };

  const remove = async (id) => {
    try {
      await axios.delete(`${API}/snippets/${id}`);
      setSnippets((s) => s.filter((x) => x.id !== id));
      toast.success("Deleted");
    } catch { toast.error("Delete failed"); }
  };

  const captureFromSelection = () => {
    if (!selectedHtml) { toast.error("Select an element on the canvas first"); return; }
    setContent(selectedHtml);
    setLanguage("html");
    toast.success("Selection captured — name it and save");
  };

  return (
    <div className="flex-1 overflow-y-auto p-2 space-y-3" data-testid="snippets-tab">
      <div className="p-2 rounded border border-[#2B2B2B] bg-[#0D0D0D] space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-gray-500">New snippet</div>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="w-full bg-[#0D0D0D] border border-[#2B2B2B] rounded px-2 py-1.5 text-xs text-white outline-none focus:border-blue-500" data-testid="snip-name" />
        <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full bg-[#0D0D0D] border border-[#2B2B2B] rounded px-2 py-1.5 text-xs text-white outline-none focus:border-blue-500" data-testid="snip-lang">
          {["html","css","javascript","typescript","json","markdown"].map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} placeholder="Paste or capture code…" className="w-full bg-[#0D0D0D] border border-[#2B2B2B] rounded px-2 py-1 text-[11px] font-mono text-white outline-none focus:border-blue-500 resize-y" data-testid="snip-content" />
        <div className="grid grid-cols-2 gap-1.5">
          <button onClick={captureFromSelection} className="text-[11px] py-1.5 rounded bg-[#1F1F1F] hover:bg-[#2B2B2B] text-gray-200 border border-[#2B2B2B]" data-testid="snip-capture">Capture selection</button>
          <button onClick={save} className="text-[11px] py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-1" data-testid="snip-save"><Plus size={11} /> Save</button>
        </div>
      </div>

      <div className="space-y-1.5">
        {snippets.length === 0 && <div className="text-[11px] text-gray-500 p-3 text-center">No snippets yet — save one above and reuse anywhere.</div>}
        {snippets.map((s) => (
          <div
            key={s.id}
            draggable
            onDragStart={(e) => { e.dataTransfer.setData("text/html-block", s.content); e.dataTransfer.effectAllowed = "copy"; }}
            onDoubleClick={() => onInsertHtml(s.content)}
            className="rounded border border-[#2B2B2B] bg-[#1F1F1F] hover:border-blue-500/60 cursor-grab group"
            data-testid={`snippet-${s.id}`}
            title="Drag onto canvas or double-click"
          >
            <div className="flex items-center gap-2 px-2 py-1.5">
              <div className="w-1 h-3 bg-blue-500/60 rounded-full" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-100 truncate">{s.name}</div>
                <div className="text-[10px] text-gray-500 font-mono">{s.language}</div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); remove(s.id); }} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400" data-testid={`snippet-${s.id}-del`}><Trash2 size={11} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
