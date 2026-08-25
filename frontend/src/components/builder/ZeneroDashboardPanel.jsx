import React, { useState, useCallback, useEffect } from "react";
import { Plus, Trash2, Pencil, X, Save, Upload, Eye, GripVertical, Share2 } from "lucide-react";
import { SocialConnectModal } from "@/components/builder/SocialConnectModal";

const API = process.env.REACT_APP_BACKEND_URL || "";

const inputCls = "w-full bg-[#15130E] border border-[#332D22] rounded px-3 py-2 text-sm text-[#F1EDE2] outline-none focus:border-[#C9A227]";
const labelCls = "text-[10px] uppercase tracking-wider text-[#948C79] block mb-1";
const btnPrimary = "text-xs py-1.5 px-3 rounded bg-[#AD8B21] hover:bg-[#C9A227] text-[#F1EDE2]";
const btnGhost = "text-xs py-1.5 px-3 rounded bg-[#242019] hover:bg-[#332D22] text-[#F1EDE2] border border-[#332D22]";
const btnDanger = "text-xs py-1.5 px-3 rounded bg-[#3A1D1D] hover:bg-[#5A2D2D] text-[#F1EDE2] border border-[#5A2D2D]";

const TABS = [
  { id: "updates", label: "Updates" },
  { id: "gallery", label: "Gallery" },
  { id: "blog", label: "Blog" },
  { id: "portfolio", label: "Portfolio" },
  { id: "timeline", label: "Timeline" },
  { id: "bento", label: "Bento" },
  { id: "roster", label: "Roster" },
  { id: "fixtures", label: "Fixtures" },
  { id: "org-stats", label: "Org Stats" },
  { id: "social", label: "Social" },
];

export default function ZeneroDashboardPanel({ projectId }) {
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("updates");
  const [loading, setLoading] = useState(false);

  // Updates state
  const [updates, setUpdates] = useState([]);
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateContent, setUpdateContent] = useState("");

  // Gallery state
  const [galleryItems, setGalleryItems] = useState([]);
  const [galleryImage, setGalleryImage] = useState("");
  const [galleryAlt, setGalleryAlt] = useState("");
  const [galleryCategory, setGalleryCategory] = useState("general");

  // Blog state
  const [blogPosts, setBlogPosts] = useState([]);
  const [blogTitle, setBlogTitle] = useState("");
  const [blogContent, setBlogContent] = useState("");
  const [blogKeywords, setBlogKeywords] = useState("");
  const [blogHashtags, setBlogHashtags] = useState("");
  const [blogImage, setBlogImage] = useState("");

  // Portfolio state
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [pfTitle, setPfTitle] = useState("");
  const [pfDesc, setPfDesc] = useState("");
  const [pfDate, setPfDate] = useState("");
  const [pfCategory, setPfCategory] = useState("general");
  const [pfImage, setPfImage] = useState("");
  const [pfLink, setPfLink] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Timeline state
  const [timelineEntries, setTimelineEntries] = useState([]);
  const [tlDate, setTlDate] = useState("");
  const [tlTitle, setTlTitle] = useState("");
  const [tlDesc, setTlDesc] = useState("");

  // Bento state
  const [bentoTiles, setBentoTiles] = useState([]);
  const [bentoIcon, setBentoIcon] = useState("🚀");
  const [bentoTitle, setBentoTitle] = useState("");
  const [bentoDesc, setBentoDesc] = useState("");
  const [bentoHref, setBentoHref] = useState("");

  // Roster state
  const [rosterPlayers, setRosterPlayers] = useState([]);
  const [rName, setRName] = useState("");
  const [rRole, setRRole] = useState("");
  const [rStatLabel, setRStatLabel] = useState("K/D");
  const [rStatValue, setRStatValue] = useState("");

  // Fixtures state
  const [fixtures, setFixtures] = useState([]);
  const [fxOpponent, setFxOpponent] = useState("");
  const [fxCompetition, setFxCompetition] = useState("");
  const [fxNote, setFxNote] = useState("");
  const [fxScheduledAt, setFxScheduledAt] = useState("");
  const [fxStatus, setFxStatus] = useState("upcoming");
  const [fxTeamScore, setFxTeamScore] = useState("");
  const [fxOpponentScore, setFxOpponentScore] = useState("");

  // Org stats state
  const [orgStats, setOrgStats] = useState([]);
  const [osLabel, setOsLabel] = useState("");
  const [osValue, setOsValue] = useState("");

  // Social tab — reuses the dashboard token already unlocked above instead
  // of prompting for a second password just to reach the same connect form.
  const [socialOpen, setSocialOpen] = useState(false);

  const unlock = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/dashboard/${projectId}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.detail || "Incorrect password");
        return;
      }
      setToken(body.token);
      await loadAll(body.token);
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadAll = async (tok) => {
    const headers = { "X-Dashboard-Token": tok };
    try {
      const [u, g, b, p, t, bt, rp, fx, os] = await Promise.all([
        fetch(`${API}/api/${projectId}/updates`, { headers }).then((r) => r.json()),
        fetch(`${API}/api/${projectId}/gallery_items`, { headers }).then((r) => r.json()),
        fetch(`${API}/api/${projectId}/blog_posts`, { headers }).then((r) => r.json()),
        fetch(`${API}/api/${projectId}/portfolio_items`, { headers }).then((r) => r.json()),
        fetch(`${API}/api/${projectId}/timeline_entries`, { headers }).then((r) => r.json()),
        fetch(`${API}/api/${projectId}/bento_tiles`, { headers }).then((r) => r.json()),
        fetch(`${API}/api/${projectId}/roster_players`, { headers }).then((r) => r.json()),
        fetch(`${API}/api/${projectId}/fixtures`, { headers }).then((r) => r.json()),
        fetch(`${API}/api/${projectId}/org_stats`, { headers }).then((r) => r.json()),
      ]);
      setUpdates(u.updates || []);
      setGalleryItems(g.gallery_items || []);
      setBlogPosts(b.blog_posts || []);
      setPortfolioItems(p.portfolio_items || []);
      setTimelineEntries(t.timeline_entries || []);
      setBentoTiles(bt.bento_tiles || []);
      setRosterPlayers(rp.roster_players || []);
      setFixtures(fx.fixtures || []);
      setOrgStats(os.org_stats || []);
    } catch {
      setError("Couldn't load content. Please try again.");
    }
  };

  const api = (path, options = {}) => {
    const headers = { "X-Dashboard-Token": token, ...(options.headers || {}) };
    if (options.body && typeof options.body !== "string") {
      headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(options.body);
    }
    return fetch(`${API}/api/${projectId}${path}`, { ...options, headers });
  };

  // ---------- Updates ----------
  const createUpdate = async () => {
    if (!updateTitle.trim()) return;
    await api("/updates", { method: "POST", body: { title: updateTitle, content: updateContent } });
    setUpdateTitle("");
    setUpdateContent("");
    await loadAll(token);
  };

  const deleteUpdate = async (id) => {
    await api(`/updates/${id}`, { method: "DELETE" });
    await loadAll(token);
  };

  // ---------- Gallery ----------
  const createGalleryItem = async () => {
    if (!galleryImage.trim()) return;
    await api("/gallery_items", {
      method: "POST",
      body: { image_url: galleryImage, alt_text: galleryAlt, category: galleryCategory },
    });
    setGalleryImage("");
    setGalleryAlt("");
    await loadAll(token);
  };

  const deleteGalleryItem = async (id) => {
    await api(`/gallery_items/${id}`, { method: "DELETE" });
    await loadAll(token);
  };

  // ---------- Blog ----------
  const createBlogPost = async () => {
    if (!blogTitle.trim()) return;
    await api("/blog_posts", {
      method: "POST",
      body: {
        title: blogTitle,
        content_html: blogContent,
        keywords: blogKeywords,
        hashtags: blogHashtags,
        featured_image: blogImage,
      },
    });
    setBlogTitle("");
    setBlogContent("");
    setBlogKeywords("");
    setBlogHashtags("");
    setBlogImage("");
    await loadAll(token);
  };

  const deleteBlogPost = async (id) => {
    await api(`/blog_posts/${id}`, { method: "DELETE" });
    await loadAll(token);
  };

  // ---------- Portfolio ----------
  const createPortfolioItem = async () => {
    if (!pfTitle.trim()) return;
    await api("/portfolio_items", {
      method: "POST",
      body: {
        title: pfTitle,
        description: pfDesc,
        date: pfDate,
        category: pfCategory,
        image_url: pfImage,
        link: pfLink,
      },
    });
    setPfTitle("");
    setPfDesc("");
    setPfDate("");
    setPfCategory("general");
    setPfImage("");
    setPfLink("");
    await loadAll(token);
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditForm({ ...item });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await api(`/portfolio_items/${editingId}`, { method: "PUT", body: editForm });
    setEditingId(null);
    setEditForm({});
    await loadAll(token);
  };

  const deletePortfolioItem = async (id) => {
    await api(`/portfolio_items/${id}`, { method: "DELETE" });
    await loadAll(token);
  };

  const moveItem = async (index, dir) => {
    const newItems = [...portfolioItems];
    const target = index + dir;
    if (target < 0 || target >= newItems.length) return;
    [newItems[index], newItems[target]] = [newItems[target], newItems[index]];
    setPortfolioItems(newItems);
    await api("/portfolio_items/reorder", {
      method: "POST",
      body: { ordered_ids: newItems.map((i) => i.id) },
    });
  };

  // ---------- Timeline ----------
  const createTimelineEntry = async () => {
    if (!tlTitle.trim()) return;
    await api("/timeline_entries", { method: "POST", body: { date: tlDate, title: tlTitle, description: tlDesc } });
    setTlDate("");
    setTlTitle("");
    setTlDesc("");
    await loadAll(token);
  };

  const deleteTimelineEntry = async (id) => {
    await api(`/timeline_entries/${id}`, { method: "DELETE" });
    await loadAll(token);
  };

  const moveTimelineEntry = async (index, dir) => {
    const newItems = [...timelineEntries];
    const target = index + dir;
    if (target < 0 || target >= newItems.length) return;
    [newItems[index], newItems[target]] = [newItems[target], newItems[index]];
    setTimelineEntries(newItems);
    await api("/timeline_entries/reorder", { method: "POST", body: { ordered_ids: newItems.map((i) => i.id) } });
  };

  // ---------- Bento ----------
  const createBentoTile = async () => {
    if (!bentoTitle.trim()) return;
    await api("/bento_tiles", { method: "POST", body: { icon: bentoIcon, title: bentoTitle, description: bentoDesc, href: bentoHref } });
    setBentoIcon("🚀");
    setBentoTitle("");
    setBentoDesc("");
    setBentoHref("");
    await loadAll(token);
  };

  const deleteBentoTile = async (id) => {
    await api(`/bento_tiles/${id}`, { method: "DELETE" });
    await loadAll(token);
  };

  const moveBentoTile = async (index, dir) => {
    const newItems = [...bentoTiles];
    const target = index + dir;
    if (target < 0 || target >= newItems.length) return;
    [newItems[index], newItems[target]] = [newItems[target], newItems[index]];
    setBentoTiles(newItems);
    await api("/bento_tiles/reorder", { method: "POST", body: { ordered_ids: newItems.map((i) => i.id) } });
  };

  // ---------- Roster ----------
  const createRosterPlayer = async () => {
    if (!rName.trim()) return;
    await api("/roster_players", { method: "POST", body: { name: rName, role: rRole, stat_label: rStatLabel, stat_value: rStatValue } });
    setRName("");
    setRRole("");
    setRStatValue("");
    await loadAll(token);
  };

  const deleteRosterPlayer = async (id) => {
    await api(`/roster_players/${id}`, { method: "DELETE" });
    await loadAll(token);
  };

  const moveRosterPlayer = async (index, dir) => {
    const newItems = [...rosterPlayers];
    const target = index + dir;
    if (target < 0 || target >= newItems.length) return;
    [newItems[index], newItems[target]] = [newItems[target], newItems[index]];
    setRosterPlayers(newItems);
    await api("/roster_players/reorder", { method: "POST", body: { ordered_ids: newItems.map((i) => i.id) } });
  };

  // ---------- Fixtures ----------
  const createFixture = async () => {
    if (!fxOpponent.trim()) return;
    await api("/fixtures", {
      method: "POST",
      body: { opponent: fxOpponent, competition: fxCompetition, note: fxNote, scheduled_at: fxScheduledAt, status: fxStatus, team_score: fxTeamScore, opponent_score: fxOpponentScore },
    });
    setFxOpponent("");
    setFxCompetition("");
    setFxNote("");
    setFxScheduledAt("");
    setFxStatus("upcoming");
    setFxTeamScore("");
    setFxOpponentScore("");
    await loadAll(token);
  };

  const deleteFixture = async (id) => {
    await api(`/fixtures/${id}`, { method: "DELETE" });
    await loadAll(token);
  };

  const moveFixture = async (index, dir) => {
    const newItems = [...fixtures];
    const target = index + dir;
    if (target < 0 || target >= newItems.length) return;
    [newItems[index], newItems[target]] = [newItems[target], newItems[index]];
    setFixtures(newItems);
    await api("/fixtures/reorder", { method: "POST", body: { ordered_ids: newItems.map((i) => i.id) } });
  };

  // ---------- Org stats ----------
  const createOrgStat = async () => {
    if (!osLabel.trim() || !osValue.trim()) return;
    await api("/org_stats", { method: "POST", body: { label: osLabel, value: osValue } });
    setOsLabel("");
    setOsValue("");
    await loadAll(token);
  };

  const deleteOrgStat = async (id) => {
    await api(`/org_stats/${id}`, { method: "DELETE" });
    await loadAll(token);
  };

  const moveOrgStat = async (index, dir) => {
    const newItems = [...orgStats];
    const target = index + dir;
    if (target < 0 || target >= newItems.length) return;
    [newItems[index], newItems[target]] = [newItems[target], newItems[index]];
    setOrgStats(newItems);
    await api("/org_stats/reorder", { method: "POST", body: { ordered_ids: newItems.map((i) => i.id) } });
  };

  if (!token) {
    return (
      <div className="p-6 bg-[#1C1A15] rounded-lg border border-[#332D22]" data-testid="zenero-dashboard">
        <h2 className="text-lg font-semibold text-[#F1EDE2] mb-4">Zenero Content Dashboard</h2>
        <div className="space-y-3 max-w-sm">
          <div>
            <label className={labelCls}>Dashboard password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
              placeholder="Enter dashboard password"
              data-testid="zenero-password"
            />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button onClick={unlock} className={btnPrimary} data-testid="zenero-unlock">
            {loading ? "Unlocking..." : "Unlock"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#1C1A15] rounded-lg border border-[#332D22]" data-testid="zenero-dashboard">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#F1EDE2]">Zenero Content Dashboard</h2>
        <button onClick={() => setToken(null)} className={btnGhost}>Lock</button>
      </div>

      <div className="flex gap-1 mb-4 border-b border-[#332D22] pb-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`text-xs px-3 py-1.5 rounded ${tab === t.id ? "bg-[#2A2416] text-[#C9A227] border border-[#C9A227]" : "text-[#948C79] hover:text-[#F1EDE2]"}`}
            data-testid={`zenero-tab-${t.id}`}
          >{t.label}</button>
        ))}
      </div>

      {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

      {/* ---------- Updates Tab ---------- */}
      {tab === "updates" && (
        <div className="space-y-4" data-testid="zenero-updates-tab">
          <div className="space-y-2 border border-[#332D22] rounded p-3">
            <div>
              <label className={labelCls}>Title</label>
              <input value={updateTitle} onChange={(e) => setUpdateTitle(e.target.value)} className={inputCls} data-testid="update-title" />
            </div>
            <div>
              <label className={labelCls}>Content</label>
              <textarea value={updateContent} onChange={(e) => setUpdateContent(e.target.value)} rows={3} className={inputCls} data-testid="update-content" />
            </div>
            <button onClick={createUpdate} className={btnPrimary} data-testid="update-publish">
              <Plus size={12} className="inline mr-1" />Publish Update
            </button>
          </div>
          <div className="space-y-2">
            {updates.map((u) => (
              <div key={u.id} className="flex items-start justify-between border border-[#332D22] rounded p-3" data-testid={`update-item-${u.id}`}>
                <div>
                  <div className="text-sm font-medium text-[#F1EDE2]">{u.title}</div>
                  <div className="text-xs text-[#948C79] mt-1">{u.content}</div>
                  <div className="text-[10px] text-[#6B6455] mt-1">{u.timestamp}</div>
                </div>
                <button onClick={() => deleteUpdate(u.id)} className={btnDanger} data-testid={`update-delete-${u.id}`}>
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            {updates.length === 0 && <p className="text-xs text-[#948C79]">No updates yet.</p>}
          </div>
        </div>
      )}

      {/* ---------- Gallery Tab ---------- */}
      {tab === "gallery" && (
        <div className="space-y-4" data-testid="zenero-gallery-tab">
          <div className="space-y-2 border border-[#332D22] rounded p-3">
            <div>
              <label className={labelCls}>Image URL</label>
              <input value={galleryImage} onChange={(e) => setGalleryImage(e.target.value)} className={inputCls} data-testid="gallery-image" />
            </div>
            <div>
              <label className={labelCls}>Alt text</label>
              <input value={galleryAlt} onChange={(e) => setGalleryAlt(e.target.value)} className={inputCls} data-testid="gallery-alt" />
            </div>
            <div>
              <label className={labelCls}>Category</label>
              <input value={galleryCategory} onChange={(e) => setGalleryCategory(e.target.value)} className={inputCls} data-testid="gallery-category" />
            </div>
            <button onClick={createGalleryItem} className={btnPrimary} data-testid="gallery-add">
              <Upload size={12} className="inline mr-1" />Add to Gallery
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {galleryItems.map((g) => (
              <div key={g.id} className="border border-[#332D22] rounded overflow-hidden" data-testid={`gallery-item-${g.id}`}>
                <img src={g.image_url} alt={g.alt_text} className="w-full h-24 object-cover" />
                <div className="p-2 flex items-center justify-between">
                  <span className="text-[10px] text-[#948C79]">{g.category}</span>
                  <button onClick={() => deleteGalleryItem(g.id)} className={btnDanger} data-testid={`gallery-delete-${g.id}`}>
                    <Trash2 size={10} />
                  </button>
                </div>
              </div>
            ))}
            {galleryItems.length === 0 && <p className="text-xs text-[#948C79] col-span-3">No gallery items yet.</p>}
          </div>
        </div>
      )}

      {/* ---------- Blog Tab ---------- */}
      {tab === "blog" && (
        <div className="space-y-4" data-testid="zenero-blog-tab">
          <div className="space-y-2 border border-[#332D22] rounded p-3">
            <div>
              <label className={labelCls}>Title</label>
              <input value={blogTitle} onChange={(e) => setBlogTitle(e.target.value)} className={inputCls} data-testid="blog-title" />
            </div>
            <div>
              <label className={labelCls}>Content (HTML)</label>
              <textarea value={blogContent} onChange={(e) => setBlogContent(e.target.value)} rows={5} className={inputCls} data-testid="blog-content" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Keywords</label>
                <input value={blogKeywords} onChange={(e) => setBlogKeywords(e.target.value)} className={inputCls} data-testid="blog-keywords" />
              </div>
              <div>
                <label className={labelCls}>Hashtags</label>
                <input value={blogHashtags} onChange={(e) => setBlogHashtags(e.target.value)} className={inputCls} data-testid="blog-hashtags" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Featured image URL</label>
              <input value={blogImage} onChange={(e) => setBlogImage(e.target.value)} className={inputCls} data-testid="blog-image" />
            </div>
            <button onClick={createBlogPost} className={btnPrimary} data-testid="blog-publish">
              <Plus size={12} className="inline mr-1" />Publish Post
            </button>
          </div>
          <div className="space-y-2">
            {blogPosts.map((b) => (
              <div key={b.id} className="border border-[#332D22] rounded p-3" data-testid={`blog-item-${b.id}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-medium text-[#F1EDE2]">{b.title}</div>
                    <div className="text-xs text-[#948C79] mt-1">{b.excerpt}</div>
                    {b.keywords && <div className="text-[10px] text-[#6B6455] mt-1">Keywords: {b.keywords}</div>}
                    {b.hashtags && <div className="text-[10px] text-[#6B6455]">Hashtags: {b.hashtags}</div>}
                  </div>
                  <button onClick={() => deleteBlogPost(b.id)} className={btnDanger} data-testid={`blog-delete-${b.id}`}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
            {blogPosts.length === 0 && <p className="text-xs text-[#948C79]">No blog posts yet.</p>}
          </div>
        </div>
      )}

      {/* ---------- Portfolio Tab ---------- */}
      {tab === "portfolio" && (
        <div className="space-y-4" data-testid="zenero-portfolio-tab">
          <div className="space-y-2 border border-[#332D22] rounded p-3">
            <div>
              <label className={labelCls}>Title</label>
              <input value={pfTitle} onChange={(e) => setPfTitle(e.target.value)} className={inputCls} data-testid="portfolio-title" />
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <textarea value={pfDesc} onChange={(e) => setPfDesc(e.target.value)} rows={2} className={inputCls} data-testid="portfolio-desc" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Date</label>
                <input value={pfDate} onChange={(e) => setPfDate(e.target.value)} className={inputCls} data-testid="portfolio-date" />
              </div>
              <div>
                <label className={labelCls}>Category</label>
                <input value={pfCategory} onChange={(e) => setPfCategory(e.target.value)} className={inputCls} data-testid="portfolio-category" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Image URL</label>
                <input value={pfImage} onChange={(e) => setPfImage(e.target.value)} className={inputCls} data-testid="portfolio-image" />
              </div>
              <div>
                <label className={labelCls}>Link / CTA</label>
                <input value={pfLink} onChange={(e) => setPfLink(e.target.value)} className={inputCls} data-testid="portfolio-link" />
              </div>
            </div>
            <button onClick={createPortfolioItem} className={btnPrimary} data-testid="portfolio-add">
              <Plus size={12} className="inline mr-1" />Add Entry
            </button>
          </div>
          <div className="space-y-2">
            {portfolioItems.map((p, idx) => (
              <div key={p.id} className="border border-[#332D22] rounded p-3" data-testid={`portfolio-item-${p.id}`}>
                {editingId === p.id ? (
                  <div className="space-y-2">
                    <input value={editForm.title || ""} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className={inputCls} data-testid="portfolio-edit-title" />
                    <input value={editForm.date || ""} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} className={inputCls} data-testid="portfolio-edit-date" />
                    <textarea value={editForm.description || ""} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={2} className={inputCls} data-testid="portfolio-edit-desc" />
                    <div className="flex gap-2">
                      <button onClick={saveEdit} className={btnPrimary} data-testid="portfolio-edit-save"><Save size={12} className="inline mr-1" />Save</button>
                      <button onClick={() => { setEditingId(null); setEditForm({}); }} className={btnGhost}><X size={12} className="inline mr-1" />Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <GripVertical size={14} className="text-[#6B6455] mt-1 cursor-grab" />
                      <div>
                        <div className="text-sm font-medium text-[#F1EDE2]">{p.title}</div>
                        <div className="text-xs text-[#948C79] mt-1">{p.date} · {p.category}</div>
                        <div className="text-xs text-[#948C79] mt-1">{p.description}</div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => moveItem(idx, -1)} className={btnGhost} title="Move up">↑</button>
                      <button onClick={() => moveItem(idx, 1)} className={btnGhost} title="Move down">↓</button>
                      <button onClick={() => startEdit(p)} className={btnGhost} data-testid={`portfolio-edit-${p.id}`}><Pencil size={12} /></button>
                      <button onClick={() => deletePortfolioItem(p.id)} className={btnDanger} data-testid={`portfolio-delete-${p.id}`}><Trash2 size={12} /></button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {portfolioItems.length === 0 && <p className="text-xs text-[#948C79]">No portfolio entries yet.</p>}
          </div>
        </div>
      )}

      {/* ---------- Timeline Tab ---------- */}
      {tab === "timeline" && (
        <div className="space-y-4" data-testid="zenero-timeline-tab">
          <div className="space-y-2 border border-[#332D22] rounded p-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Date</label>
                <input value={tlDate} onChange={(e) => setTlDate(e.target.value)} className={inputCls} data-testid="timeline-date" />
              </div>
              <div>
                <label className={labelCls}>Title</label>
                <input value={tlTitle} onChange={(e) => setTlTitle(e.target.value)} className={inputCls} data-testid="timeline-title" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <textarea value={tlDesc} onChange={(e) => setTlDesc(e.target.value)} rows={2} className={inputCls} data-testid="timeline-desc" />
            </div>
            <button onClick={createTimelineEntry} className={btnPrimary} data-testid="timeline-add">
              <Plus size={12} className="inline mr-1" />Add Entry
            </button>
          </div>
          <div className="space-y-2">
            {timelineEntries.map((t, idx) => (
              <div key={t.id} className="flex items-start justify-between border border-[#332D22] rounded p-3" data-testid={`timeline-item-${t.id}`}>
                <div className="flex items-start gap-2">
                  <GripVertical size={14} className="text-[#6B6455] mt-1 cursor-grab" />
                  <div>
                    <div className="text-sm font-medium text-[#F1EDE2]">{t.title}</div>
                    <div className="text-xs text-[#948C79] mt-1">{t.date}</div>
                    <div className="text-xs text-[#948C79] mt-1">{t.description}</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => moveTimelineEntry(idx, -1)} className={btnGhost} title="Move up">↑</button>
                  <button onClick={() => moveTimelineEntry(idx, 1)} className={btnGhost} title="Move down">↓</button>
                  <button onClick={() => deleteTimelineEntry(t.id)} className={btnDanger} data-testid={`timeline-delete-${t.id}`}><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
            {timelineEntries.length === 0 && <p className="text-xs text-[#948C79]">No timeline entries yet.</p>}
          </div>
        </div>
      )}

      {/* ---------- Bento Tab ---------- */}
      {tab === "bento" && (
        <div className="space-y-4" data-testid="zenero-bento-tab">
          <div className="space-y-2 border border-[#332D22] rounded p-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Icon (emoji)</label>
                <input value={bentoIcon} onChange={(e) => setBentoIcon(e.target.value)} className={inputCls} data-testid="bento-icon" />
              </div>
              <div>
                <label className={labelCls}>Title</label>
                <input value={bentoTitle} onChange={(e) => setBentoTitle(e.target.value)} className={inputCls} data-testid="bento-title" />
              </div>
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <textarea value={bentoDesc} onChange={(e) => setBentoDesc(e.target.value)} rows={2} className={inputCls} data-testid="bento-desc" />
            </div>
            <div>
              <label className={labelCls}>Link (optional)</label>
              <input value={bentoHref} onChange={(e) => setBentoHref(e.target.value)} className={inputCls} data-testid="bento-href" />
            </div>
            <button onClick={createBentoTile} className={btnPrimary} data-testid="bento-add">
              <Plus size={12} className="inline mr-1" />Add Tile
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {bentoTiles.map((b, idx) => (
              <div key={b.id} className="border border-[#332D22] rounded p-3" data-testid={`bento-item-${b.id}`}>
                <div className="flex items-start justify-between">
                  <div className="text-lg">{b.icon}</div>
                  <div className="flex gap-1">
                    <button onClick={() => moveBentoTile(idx, -1)} className={btnGhost} title="Move up">↑</button>
                    <button onClick={() => moveBentoTile(idx, 1)} className={btnGhost} title="Move down">↓</button>
                    <button onClick={() => deleteBentoTile(b.id)} className={btnDanger} data-testid={`bento-delete-${b.id}`}><Trash2 size={10} /></button>
                  </div>
                </div>
                <div className="text-sm font-medium text-[#F1EDE2] mt-1">{b.title}</div>
                <div className="text-xs text-[#948C79] mt-1">{b.description}</div>
              </div>
            ))}
            {bentoTiles.length === 0 && <p className="text-xs text-[#948C79] col-span-2">No bento tiles yet.</p>}
          </div>
        </div>
      )}

      {/* ---------- Roster Tab ---------- */}
      {tab === "roster" && (
        <div className="space-y-4" data-testid="zenero-roster-tab">
          <div className="space-y-2 border border-[#332D22] rounded p-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Name</label>
                <input value={rName} onChange={(e) => setRName(e.target.value)} className={inputCls} data-testid="roster-name" />
              </div>
              <div>
                <label className={labelCls}>Role</label>
                <input value={rRole} onChange={(e) => setRRole(e.target.value)} className={inputCls} placeholder="IGL / Captain" data-testid="roster-role" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Stat label</label>
                <input value={rStatLabel} onChange={(e) => setRStatLabel(e.target.value)} className={inputCls} data-testid="roster-stat-label" />
              </div>
              <div>
                <label className={labelCls}>Stat value</label>
                <input value={rStatValue} onChange={(e) => setRStatValue(e.target.value)} className={inputCls} placeholder="1.48" data-testid="roster-stat-value" />
              </div>
            </div>
            <button onClick={createRosterPlayer} className={btnPrimary} data-testid="roster-add">
              <Plus size={12} className="inline mr-1" />Add Player
            </button>
          </div>
          <div className="space-y-2">
            {rosterPlayers.map((p, idx) => (
              <div key={p.id} className="flex items-start justify-between border border-[#332D22] rounded p-3" data-testid={`roster-item-${p.id}`}>
                <div className="flex items-start gap-2">
                  <GripVertical size={14} className="text-[#6B6455] mt-1 cursor-grab" />
                  <div>
                    <div className="text-sm font-medium text-[#F1EDE2]">{p.name}</div>
                    <div className="text-xs text-[#948C79] mt-1">{p.role}</div>
                    <div className="text-xs text-[#948C79] mt-1">{p.stat_label}: {p.stat_value}</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => moveRosterPlayer(idx, -1)} className={btnGhost} title="Move up">↑</button>
                  <button onClick={() => moveRosterPlayer(idx, 1)} className={btnGhost} title="Move down">↓</button>
                  <button onClick={() => deleteRosterPlayer(p.id)} className={btnDanger} data-testid={`roster-delete-${p.id}`}><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
            {rosterPlayers.length === 0 && <p className="text-xs text-[#948C79]">No roster players yet.</p>}
          </div>
        </div>
      )}

      {/* ---------- Fixtures Tab ---------- */}
      {tab === "fixtures" && (
        <div className="space-y-4" data-testid="zenero-fixtures-tab">
          <div className="space-y-2 border border-[#332D22] rounded p-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Opponent</label>
                <input value={fxOpponent} onChange={(e) => setFxOpponent(e.target.value)} className={inputCls} data-testid="fixture-opponent" />
              </div>
              <div>
                <label className={labelCls}>Competition</label>
                <input value={fxCompetition} onChange={(e) => setFxCompetition(e.target.value)} className={inputCls} placeholder="VCT Playoffs" data-testid="fixture-competition" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Note</label>
                <input value={fxNote} onChange={(e) => setFxNote(e.target.value)} className={inputCls} placeholder="BO3" data-testid="fixture-note" />
              </div>
              <div>
                <label className={labelCls}>Scheduled at</label>
                <input value={fxScheduledAt} onChange={(e) => setFxScheduledAt(e.target.value)} className={inputCls} placeholder="Fri 19:00 CET" data-testid="fixture-scheduled-at" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className={labelCls}>Status</label>
                <select value={fxStatus} onChange={(e) => setFxStatus(e.target.value)} className={inputCls} data-testid="fixture-status">
                  <option value="upcoming">Upcoming</option>
                  <option value="live">Live</option>
                  <option value="final">Final</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Team score</label>
                <input value={fxTeamScore} onChange={(e) => setFxTeamScore(e.target.value)} className={inputCls} data-testid="fixture-team-score" />
              </div>
              <div>
                <label className={labelCls}>Opponent score</label>
                <input value={fxOpponentScore} onChange={(e) => setFxOpponentScore(e.target.value)} className={inputCls} data-testid="fixture-opponent-score" />
              </div>
            </div>
            <button onClick={createFixture} className={btnPrimary} data-testid="fixture-add">
              <Plus size={12} className="inline mr-1" />Add Fixture
            </button>
          </div>
          <div className="space-y-2">
            {fixtures.map((f, idx) => (
              <div key={f.id} className="flex items-start justify-between border border-[#332D22] rounded p-3" data-testid={`fixture-item-${f.id}`}>
                <div className="flex items-start gap-2">
                  <GripVertical size={14} className="text-[#6B6455] mt-1 cursor-grab" />
                  <div>
                    <div className="text-sm font-medium text-[#F1EDE2]">
                      vs {f.opponent} {f.status === "final" && <span>· {f.team_score}–{f.opponent_score}</span>}
                    </div>
                    <div className="text-xs text-[#948C79] mt-1">{f.competition} {f.note && `· ${f.note}`}</div>
                    <div className="text-xs text-[#948C79] mt-1">{f.scheduled_at} · {f.status}</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => moveFixture(idx, -1)} className={btnGhost} title="Move up">↑</button>
                  <button onClick={() => moveFixture(idx, 1)} className={btnGhost} title="Move down">↓</button>
                  <button onClick={() => deleteFixture(f.id)} className={btnDanger} data-testid={`fixture-delete-${f.id}`}><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
            {fixtures.length === 0 && <p className="text-xs text-[#948C79]">No fixtures yet.</p>}
          </div>
        </div>
      )}

      {/* ---------- Org Stats Tab ---------- */}
      {tab === "org-stats" && (
        <div className="space-y-4" data-testid="zenero-org-stats-tab">
          <div className="space-y-2 border border-[#332D22] rounded p-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Label</label>
                <input value={osLabel} onChange={(e) => setOsLabel(e.target.value)} className={inputCls} placeholder="Global rank" data-testid="org-stat-label" />
              </div>
              <div>
                <label className={labelCls}>Value</label>
                <input value={osValue} onChange={(e) => setOsValue(e.target.value)} className={inputCls} placeholder="#4" data-testid="org-stat-value" />
              </div>
            </div>
            <button onClick={createOrgStat} className={btnPrimary} data-testid="org-stat-add">
              <Plus size={12} className="inline mr-1" />Add Stat
            </button>
          </div>
          <div className="space-y-2">
            {orgStats.map((s, idx) => (
              <div key={s.id} className="flex items-start justify-between border border-[#332D22] rounded p-3" data-testid={`org-stat-item-${s.id}`}>
                <div className="flex items-start gap-2">
                  <GripVertical size={14} className="text-[#6B6455] mt-1 cursor-grab" />
                  <div>
                    <div className="text-sm font-medium text-[#F1EDE2]">{s.value}</div>
                    <div className="text-xs text-[#948C79] mt-1">{s.label}</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => moveOrgStat(idx, -1)} className={btnGhost} title="Move up">↑</button>
                  <button onClick={() => moveOrgStat(idx, 1)} className={btnGhost} title="Move down">↓</button>
                  <button onClick={() => deleteOrgStat(s.id)} className={btnDanger} data-testid={`org-stat-delete-${s.id}`}><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
            {orgStats.length === 0 && <p className="text-xs text-[#948C79]">No org stats yet.</p>}
          </div>
        </div>
      )}

      {/* ---------- Social Tab ---------- */}
      {tab === "social" && (
        <div className="space-y-3" data-testid="zenero-social-tab">
          <p className="text-xs text-[#948C79] max-w-md">
            Connect Facebook, Instagram, X, TikTok, LinkedIn, or YouTube so the Social
            Media Wall block on your site shows real posts instead of sample content.
          </p>
          <button onClick={() => setSocialOpen(true)} className={btnPrimary} data-testid="zenero-open-social-connect">
            <Share2 size={12} className="inline mr-1" />Manage Social Connections
          </button>
        </div>
      )}

      <SocialConnectModal
        open={socialOpen}
        onClose={() => setSocialOpen(false)}
        projectId={projectId}
        token={token}
      />
    </div>
  );
}