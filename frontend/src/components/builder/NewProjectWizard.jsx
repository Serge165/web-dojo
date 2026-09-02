import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Wand2, ChevronLeft, ChevronRight, Check, AlertTriangle,
  Monitor, Smartphone, Tablet, History,
} from "lucide-react";
import STARTER_TEMPLATES from "@/data/starterTemplates.json";
import { PAGE_LAYOUTS, CATEGORY_ORDER, CATEGORY_META } from "@/lib/pageLayouts";
import { EXTRA_CATEGORIES } from "@/lib/blocksExtra";
import { computeSeoChecks, scoreColor } from "@/lib/seoScore";
import {
  truncateForSerp, truncateDescriptionForSerp,
  titleCountColor, descriptionCountColor,
} from "@/lib/seoFieldChecks";

// ─── constants ────────────────────────────────────────��─────────────
const OG_TYPES = ["website", "article", "product", "profile"];
const SCHEMA_TYPES = [
  "WebSite", "Organization", "LocalBusiness", "Product", "Article", "BlogPosting",
];
const inputCls =
  "w-full bg-[#15130E] border border-[#332D22] rounded px-2.5 py-1.5 text-xs text-[#F1EDE2] outline-none focus:border-indigo-500";
const labelCls = "block text-[10px] uppercase tracking-wider text-[#948C79] mb-1";

// "New Dashboard" / "New Dashboard/Blog" modes reuse the exported-site
// dashboard-login widget (owner unlock + real visitor accounts) already
// defined in blocksExtra.js rather than duplicating its markup here.
const ZENERO_BLOCKS = (EXTRA_CATEGORIES.find((c) => c.id === "zenero") || {}).blocks || [];
const DASHBOARD_LOGIN_HTML = (ZENERO_BLOCKS.find((b) => b.id === "dashboard-login") || {}).html || "";
const LATEST_BLOG_HTML = (ZENERO_BLOCKS.find((b) => b.id === "latest-from-blog") || {}).html || "";
const DASHBOARD_MODE_LAYOUTS = {
  dashboard: [{
    id: "dashboard-login-page", label: "Dashboard",
    blocks: [DASHBOARD_LOGIN_HTML].filter(Boolean),
    canvasBg: "#ffffff", fonts: [],
  }],
  "dashboard-blog": [{
    id: "dashboard-blog-page", label: "Dashboard + Blog",
    blocks: [DASHBOARD_LOGIN_HTML, LATEST_BLOG_HTML].filter(Boolean),
    canvasBg: "#ffffff", fonts: [],
  }],
};

const SEO_FIELDS = [
  { key: "title", label: "SEO title", type: "text", span: 2, testId: "wizard-seo-title" },
  { key: "description", label: "SEO description", type: "textarea", span: 2, testId: "wizard-seo-description" },
  { key: "keywords", label: "Keywords", type: "text", testId: "wizard-seo-keywords", placeholder: "comma, separated" },
  { key: "canonical", label: "Canonical URL", type: "text", testId: "wizard-seo-canonical", placeholder: "https://…" },
  { key: "og_type", label: "OG type", type: "select", options: OG_TYPES, testId: "wizard-seo-og-type" },
  { key: "schema_type", label: "Schema type", type: "select", options: SCHEMA_TYPES, testId: "wizard-seo-schema-type" },
  { key: "og_image", label: "OG image URL", type: "text", span: 2, testId: "wizard-seo-og-image", placeholder: "https://…/social.png" },
];

const autoSeo = (tpl, name) => {
  const homeSeo =
    (tpl && tpl.data && tpl.data.pages && tpl.data.pages[0] && tpl.data.pages[0].seo) || {};
  const t = homeSeo.title || name || (tpl && tpl.name) || "Untitled";
  const d = homeSeo.description || (tpl && tpl.description) || "";
  return {
    title: t, description: d, keywords: "", canonical: "", favicon: "",
    og_type: "website", og_title: t, og_description: d, og_image: "",
    twitter_card: "summary_large_image", schema_type: "WebSite",
  };
};

// ─── helpers ────────────────────────────────────────────────────────
const formatDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

const daysAgo = (iso) => {
  if (!iso) return 0;
  const diff = Date.now() - new Date(iso).getTime();
  return Math.floor(diff / 86400000);
};

// ─── sub-components ─────────────────────────────────────────────────

/** Feature #1 — Template version badge + changelog + deprecation */
const TemplateVersionBadge = ({ template }) => {
  const [showChangelog, setShowChangelog] = useState(false);
  const ageDays = daysAgo(template.lastUpdated);
  const isRecent = ageDays <= 7;
  const isStale = ageDays > 90;

  return (
    <div className="mt-1.5 space-y-1">
      <div className="flex items-center gap-1.5 flex-wrap">
        <Badge
          variant="outline"
          className={`text-[10px] px-1.5 py-0 h-4 leading-none ${
            isRecent
              ? "border-emerald-600/50 text-emerald-400"
              : isStale
              ? "border-amber-600/50 text-amber-400"
              : "border-[#332D22] text-[#948C79]"
          }`}
        >
          v{template.version || "1.0.0"}
        </Badge>
        <span className="text-[10px] text-[#6B6453]">
          {isRecent
            ? `Updated ${ageDays === 0 ? "today" : `${ageDays}d ago`}`
            : formatDate(template.lastUpdated)}
        </span>
      </div>

      {template.deprecationWarning && (
        <Alert
          variant="destructive"
          className="!py-1 !px-2 text-[10px] border-red-800/40 bg-red-950/20"
          data-testid={`wizard-tpl-${template.id}-deprecated`}
        >
          <AlertTriangle size={12} className="!text-red-400 shrink-0" />
          <AlertDescription className="text-[10px] text-red-300 !mt-0">
            {template.deprecationWarning}
          </AlertDescription>
        </Alert>
      )}

      {template.changelog && template.changelog.length > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); setShowChangelog((v) => !v); }}
          className="flex items-center gap-1 text-[10px] text-[#948C79] hover:text-indigo-400 transition-colors"
          data-testid={`wizard-tpl-${template.id}-changelog-btn`}
        >
          <History size={10} /> Changelog
        </button>
      )}

      {showChangelog && (
        <div
          className="rounded border border-[#332D22] bg-[#15130E] p-2 space-y-1.5"
          data-testid={`wizard-tpl-${template.id}-changelog`}
        >
          {template.changelog.map((entry, i) => (
            <div key={i} className="text-[10px]">
              <div className="flex items-center gap-1.5">
                <span className="text-[#F1EDE2] font-medium">v{entry.version}</span>
                <span className="text-[#6B6453]">{formatDate(entry.date)}</span>
              </div>
              <div className="text-[#948C79] mt-0.5">{entry.changes}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/** Feature #5 — SEO live validation with character counts + score */
const SEOValidator = ({ seo }) => {
  const { checks, score } = useMemo(() => computeSeoChecks({ seo }), [seo]);
  const titleLen = (seo.title || "").length;
  const descLen = (seo.description || "").length;
  const keywordCount = (seo.keywords || "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean).length;

  const fieldLabels = {
    title: { label: "Title", len: titleLen, ideal: "50–60", color: titleCountColor(titleLen) },
    description: { label: "Description", len: descLen, ideal: "150–160", color: descriptionCountColor(descLen) },
    keywords: {
      label: "Keywords", len: keywordCount, ideal: "3–7",
      color: keywordCount >= 3 && keywordCount <= 7 ? "text-emerald-500" : keywordCount === 0 ? "text-red-500" : "text-amber-500",
    },
  };

  return (
    <div className="rounded border border-[#332D22] bg-[#15130E] p-3 space-y-2.5" data-testid="wizard-seo-validator">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] uppercase tracking-wider text-[#948C79]">SEO Score</h4>
        <span className={`text-lg font-bold font-mono ${scoreColor(score)}`} data-testid="wizard-seo-score">
          {score}/100
        </span>
      </div>

      <div className="space-y-1">
        {Object.entries(fieldLabels).map(([key, info]) => (
          <div key={key} className="flex items-center justify-between text-[10px]">
            <span className="text-[#948C79]">{info.label}</span>
            <span className={info.color}>
              {info.len} chars — ideal: {info.ideal}
            </span>
          </div>
        ))}
      </div>

      <div className="space-y-1 pt-1 border-t border-[#332D22]">
        {checks.filter((c) => c.weight > 0).map((c) => (
          <div key={c.id} className="flex items-start gap-1.5 text-[10px]" data-testid={`wizard-seo-check-${c.id}`}>
            <span className={c.status === "pass" ? "text-emerald-500" : c.status === "warn" ? "text-amber-500" : "text-red-500"}>
              {c.status === "pass" ? "✓" : c.status === "warn" ? "⚠" : "✗"}
            </span>
            <span className="text-[#E4DECE]">{c.detail}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/** Feature #6 — Google SERP preview with device toggle */
const SearchResultPreview = ({ seo, device }) => {
  const title = seo.title || "Untitled";
  const description = seo.description || "";
  const url = seo.canonical || "www.yoursite.com";

  const titleDisplay = device === "mobile"
    ? truncateForSerp(title.length > 55 ? title.slice(0, 55) : title)
    : truncateForSerp(title);
  const descDisplay = device === "mobile"
    ? truncateDescriptionForSerp(description.length > 110 ? description.slice(0, 110) : description)
    : truncateDescriptionForSerp(description);

  return (
    <div className="rounded border border-[#332D22] bg-[#15130E] p-3">
      <h4 className="text-[10px] uppercase tracking-wider text-[#948C79] mb-2">
        Search Result Preview
      </h4>
      <div
        className={`bg-white rounded p-3 font-sans text-left ${
          device === "mobile" ? "max-w-[375px]" : "max-w-[600px]"
        }`}
      >
        <div className="text-[11px] text-[#202124] truncate">{url} ›</div>
        <a
          className="text-sm leading-tight text-[#1a0dab] hover:underline cursor-default block mt-0.5"
          style={{ fontSize: device === "mobile" ? "14px" : "18px" }}
        >
          {titleDisplay}
        </a>
        <p
          className="text-[#4d5156] mt-0.5 leading-snug"
          style={{ fontSize: device === "mobile" ? "12px" : "13px", lineHeight: "1.4" }}
        >
          {descDisplay || "No meta description set. Google will generate one from your page content."}
        </p>
      </div>
    </div>
  );
};

// ─── main component ─────────────────────────────────────────────────

export const NewProjectWizard = ({ open, onClose, onCreate }) => {
  const first = STARTER_TEMPLATES[0] || null;
  const [step, setStep] = useState(1);
  // "template" = Option A (fork one whole starter template). "pages" = Option
  // B (compose the site from hand-picked Layout pages, no shared template).
  const [mode, setMode] = useState("template");
  const [tplId, setTplId] = useState(first ? first.id : null);
  const [layoutIds, setLayoutIds] = useState([]);
  const [layoutQuery, setLayoutQuery] = useState("");
  const [layoutCat, setLayoutCat] = useState("all");
  const [name, setName] = useState(first ? first.name : "Untitled");
  const [seo, setSeo] = useState(() => autoSeo(first, first ? first.name : "Untitled"));
  const [previewDevice, setPreviewDevice] = useState("mobile");

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setMode("template");
    setTplId(first ? first.id : null);
    setLayoutIds([]);
    setLayoutQuery("");
    setLayoutCat("all");
    setName(first ? first.name : "Untitled");
    setSeo(autoSeo(first, first ? first.name : "Untitled"));
    setPreviewDevice("mobile");
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const tpl = useMemo(
    () => STARTER_TEMPLATES.find((t) => t.id === tplId) || first,
    [tplId, first]
  );

  const selectedLayouts = useMemo(() => {
    if (mode === "dashboard" || mode === "dashboard-blog") return DASHBOARD_MODE_LAYOUTS[mode];
    return PAGE_LAYOUTS.filter((l) => layoutIds.includes(l.id));
  }, [layoutIds, mode]);

  const filteredLayouts = useMemo(() => {
    const query = layoutQuery.trim().toLowerCase();
    return PAGE_LAYOUTS.filter((l) => {
      if (layoutCat !== "all" && l.category !== layoutCat) return false;
      if (!query) return true;
      return (`${l.label} ${l.category} ${l.description}`).toLowerCase().includes(query);
    });
  }, [layoutQuery, layoutCat]);

  const groupedLayouts = useMemo(() => {
    const map = {};
    filteredLayouts.forEach((l) => { (map[l.category] = map[l.category] || []).push(l); });
    return CATEGORY_ORDER.filter((c) => map[c]).map((c) => ({ category: c, items: map[c] }));
  }, [filteredLayouts]);

  const selectTpl = (id) => {
    const t = STARTER_TEMPLATES.find((x) => x.id === id) || first;
    if (!t) return;
    setTplId(t.id);
    setName(t.name);
    setSeo(autoSeo(t, t.name));
  };

  const toggleLayout = (id) => setLayoutIds((ids) => (
    ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]
  ));

  const updateSeo = (patch) => setSeo((s) => ({ ...s, ...patch }));
  const canAdvance = step !== 1 || mode === "template" || selectedLayouts.length > 0;
  const create = () => {
    if (mode === "template") {
      onCreate({ tpl, name: (name || (tpl && tpl.name) || "Untitled").trim(), seo });
    } else {
      onCreate({ layouts: selectedLayouts, name: (name || "Untitled").trim(), seo });
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="sm:max-w-[680px] bg-[#1D1B17] border border-[#332D22] text-[#F1EDE2] [&>button]:hidden p-0 gap-0"
        data-testid="new-project-wizard"
      >
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="flex items-center gap-2 text-sm text-[#F1EDE2]">
            <Wand2 size={16} className="text-indigo-400" />
            New project — Step {step} of 3
          </DialogTitle>
          <DialogDescription className="text-xs text-[#948C79]">
            {step === 1
              ? (mode === "template" ? "Choose a starter template"
                : mode === "pages" ? "Pick the pages your site needs"
                : "A login-gated dashboard page, ready to wire up")
              : step === 2
              ? "Name your project & customize SEO metadata"
              : "Review and create your scaffold"}
          </DialogDescription>
        </DialogHeader>

        <div className="px-4 py-3 max-h-[60vh] overflow-y-auto">
          {/* ── Step 1: Template picker ─────────────────────────── */}
          {step === 1 && (
            <div data-testid="wizard-step-1-body">
              <div className="flex flex-wrap gap-1.5 mb-3" data-testid="wizard-mode-toggle">
                <button
                  onClick={() => setMode("template")}
                  data-testid="wizard-mode-template"
                  className={`flex-1 text-xs px-3 py-1.5 rounded border ${mode === "template" ? "border-indigo-500 bg-indigo-500/10 text-[#F1EDE2]" : "border-[#332D22] text-[#948C79] hover:text-[#F1EDE2]"}`}
                >
                  Whole template
                </button>
                <button
                  onClick={() => setMode("pages")}
                  data-testid="wizard-mode-pages"
                  className={`flex-1 text-xs px-3 py-1.5 rounded border ${mode === "pages" ? "border-indigo-500 bg-indigo-500/10 text-[#F1EDE2]" : "border-[#332D22] text-[#948C79] hover:text-[#F1EDE2]"}`}
                >
                  Pick your own pages
                </button>
                <button
                  onClick={() => setMode("dashboard")}
                  data-testid="wizard-mode-dashboard"
                  className={`flex-1 text-xs px-3 py-1.5 rounded border ${mode === "dashboard" ? "border-indigo-500 bg-indigo-500/10 text-[#F1EDE2]" : "border-[#332D22] text-[#948C79] hover:text-[#F1EDE2]"}`}
                >
                  New Dashboard
                </button>
                <button
                  onClick={() => setMode("dashboard-blog")}
                  data-testid="wizard-mode-dashboard-blog"
                  className={`flex-1 text-xs px-3 py-1.5 rounded border ${mode === "dashboard-blog" ? "border-indigo-500 bg-indigo-500/10 text-[#F1EDE2]" : "border-[#332D22] text-[#948C79] hover:text-[#F1EDE2]"}`}
                >
                  New Dashboard/Blog
                </button>
              </div>

              {(mode === "dashboard" || mode === "dashboard-blog") ? (
                <div className="rounded border border-[#332D22] bg-[#15130E] p-4 text-xs" data-testid="wizard-dashboard-info">
                  <div className="font-medium text-[#F1EDE2] mb-1.5">
                    {mode === "dashboard" ? "New Dashboard" : "New Dashboard/Blog"}
                  </div>
                  <p className="text-[#948C79] leading-relaxed">
                    Scaffolds a single page with a login-gated dashboard: an owner unlock
                    form plus real visitor sign-up/login, both wired to your project once
                    it's saved. Set the owner's dashboard password from the builder's
                    Zenero panel (or the widget's own first-time setup) after creating
                    the project.
                    {mode === "dashboard-blog" && " Also includes the Latest from Blog widget."}
                  </p>
                </div>
              ) : mode === "template" ? (
                <div className="grid grid-cols-2 gap-2.5">
                  {STARTER_TEMPLATES.map((t) => (
                    <div key={t.id} className="group relative">
                      <button
                        onClick={() => selectTpl(t.id)}
                        data-testid={`wizard-tpl-${t.id}`}
                        className={`text-left p-2.5 rounded border text-xs transition-colors w-full ${
                          tplId === t.id
                            ? "border-indigo-500 bg-indigo-500/10"
                            : "border-[#332D22] hover:border-[#948C79]"
                        }`}
                      >
                        <div className="font-medium truncate pr-1">{t.name}</div>
                        <div className="text-[10px] text-[#948C79] truncate">
                          {t.description}
                        </div>
                      </button>
                      <div className="px-2.5 pb-2">
                        <TemplateVersionBadge template={t} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div data-testid="wizard-pages-picker">
                  <div className="flex flex-wrap gap-1 mb-2">
                    <input
                      value={layoutQuery}
                      onChange={(e) => setLayoutQuery(e.target.value)}
                      placeholder="Search pages…"
                      className={inputCls + " mb-1.5"}
                      data-testid="wizard-pages-search"
                    />
                    <div className="flex flex-wrap gap-1">
                      {["all", ...CATEGORY_ORDER].map((c) => (
                        <button
                          key={c}
                          onClick={() => setLayoutCat(c)}
                          className={`px-2 py-0.5 rounded-full text-[10px] border ${layoutCat === c ? "bg-indigo-600 border-indigo-500 text-[#F1EDE2]" : "border-[#332D22] text-[#A79C87] hover:text-[#F1EDE2]"}`}
                          data-testid={`wizard-pages-cat-${c}`}
                        >
                          {c === "all" ? "All" : c}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="text-[10px] text-[#948C79] mb-1.5">
                    {selectedLayouts.length} page{selectedLayouts.length === 1 ? "" : "s"} selected
                  </div>
                  <div className="space-y-2 max-h-[38vh] overflow-y-auto pr-1">
                    {groupedLayouts.map((grp) => (
                      <div key={grp.category}>
                        <div className="text-[10px] uppercase tracking-wider text-[#948C79] mb-1 flex items-center gap-1.5">
                          <span style={{ background: CATEGORY_META[grp.category]?.color || "#6366f1", width: 6, height: 6, borderRadius: 999 }} />
                          {grp.category}
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {grp.items.map((l) => (
                            <button
                              key={l.id}
                              onClick={() => toggleLayout(l.id)}
                              data-testid={`wizard-page-${l.id}`}
                              className={`text-left px-2.5 py-2 rounded-md text-xs border ${layoutIds.includes(l.id) ? "bg-indigo-600/20 border-indigo-500/60 text-[#F1EDE2]" : "bg-[#15130E] border-[#332D22] text-[#E4DECE] hover:border-indigo-500/40"}`}
                            >
                              <div className="font-medium truncate">{l.label}</div>
                              <div className="text-[10px] text-[#948C79] truncate">{l.description}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    {groupedLayouts.length === 0 && <div className="text-[11px] text-[#948C79] text-center p-4">No pages match "{layoutQuery}"</div>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: SEO + preview ──────────────────────────── */}
          {step === 2 && (
            <div className="grid gap-3 lg:grid-cols-2" data-testid="wizard-step-2-body">
              {/* Left: form + validation */}
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>Project name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputCls}
                    data-testid="wizard-name"
                    placeholder={(tpl && tpl.name) || "Untitled"}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {SEO_FIELDS.map((f) => (
                    <div key={f.key} className={f.span === 2 ? "col-span-2" : ""}>
                      <label className={labelCls}>{f.label}</label>
                      {f.type === "textarea" ? (
                        <textarea
                          value={seo[f.key] || ""}
                          onChange={(e) => updateSeo({ [f.key]: e.target.value })}
                          rows={2}
                          className={inputCls}
                          data-testid={f.testId}
                        />
                      ) : f.type === "select" ? (
                        <select
                          value={seo[f.key] || ""}
                          onChange={(e) => updateSeo({ [f.key]: e.target.value })}
                          className={inputCls}
                          data-testid={f.testId}
                        >
                          {f.options.map((o) => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          value={seo[f.key] || ""}
                          onChange={(e) => updateSeo({ [f.key]: e.target.value })}
                          className={inputCls}
                          data-testid={f.testId}
                          placeholder={f.placeholder || ""}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <SEOValidator seo={seo} />
              </div>

              {/* Right: preview */}
              <div className="space-y-3">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] uppercase tracking-wider text-[#948C79] mr-auto">
                    Preview
                  </span>
                  <button
                    onClick={() => setPreviewDevice("mobile")}
                    className={`p-1 rounded text-[10px] transition-colors ${
                      previewDevice === "mobile"
                        ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/50"
                        : "text-[#948C79] hover:text-[#E4DECE] border border-transparent"
                    }`}
                    data-testid="wizard-preview-mobile"
                    title="Mobile (375px)"
                  >
                    <Smartphone size={14} />
                  </button>
                  <button
                    onClick={() => setPreviewDevice("tablet")}
                    className={`p-1 rounded text-[10px] transition-colors ${
                      previewDevice === "tablet"
                        ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/50"
                        : "text-[#948C79] hover:text-[#E4DECE] border border-transparent"
                    }`}
                    data-testid="wizard-preview-tablet"
                    title="Tablet (768px)"
                  >
                    <Tablet size={14} />
                  </button>
                  <button
                    onClick={() => setPreviewDevice("desktop")}
                    className={`p-1 rounded text-[10px] transition-colors ${
                      previewDevice === "desktop"
                        ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/50"
                        : "text-[#948C79] hover:text-[#E4DECE] border border-transparent"
                    }`}
                    data-testid="wizard-preview-desktop"
                    title="Desktop (full width)"
                  >
                    <Monitor size={14} />
                  </button>
                </div>

                <SearchResultPreview seo={seo} device={previewDevice} />

                {mode === "template" ? (
                  tpl && (
                    <div className="rounded border border-[#332D22] bg-[#15130E] p-3">
                      <h4 className="text-[10px] uppercase tracking-wider text-[#948C79] mb-1">
                        Template
                      </h4>
                      <p className="text-xs text-[#E4DECE]">{tpl.name}</p>
                      <p className="text-[10px] text-[#948C79] mt-0.5">
                        v{tpl.version || "1.0.0"} · {tpl.aesthetic}
                      </p>
                    </div>
                  )
                ) : (
                  <div className="rounded border border-[#332D22] bg-[#15130E] p-3">
                    <h4 className="text-[10px] uppercase tracking-wider text-[#948C79] mb-1">
                      Pages ({selectedLayouts.length})
                    </h4>
                    <p className="text-xs text-[#E4DECE]">
                      {selectedLayouts.map((l) => l.label).join(", ") || "None selected yet"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Step 3: Review ──────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-3 text-xs" data-testid="wizard-step-3-body">
              <div className="rounded border border-[#332D22] bg-[#15130E] p-3 space-y-1">
                {mode === "template" ? (
                  <>
                    <div className="text-[#948C79]">Template</div>
                    <div className="text-[#F1EDE2] font-medium">
                      {tpl && tpl.name}
                      {tpl && tpl.version && (
                        <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0 h-4 border-[#332D22] text-[#948C79]">
                          v{tpl.version}
                        </Badge>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-[#948C79]">Pages ({selectedLayouts.length})</div>
                    <div className="text-[#F1EDE2] font-medium" data-testid="wizard-review-pages">
                      {selectedLayouts.map((l) => l.label).join(", ")}
                    </div>
                  </>
                )}
                <div className="text-[#948C79] mt-2">Project name</div>
                <div className="text-[#F1EDE2] font-medium" data-testid="wizard-review-name">
                  {name || (tpl && tpl.name)}
                </div>
                <div className="text-[#948C79] mt-2">SEO</div>
                <div className="text-[#E4DECE]">
                  <b>{seo.title}</b> — {seo.description}
                </div>
              </div>
              <div className="rounded border border-[#332D22] bg-[#15130E] p-3">
                <div className="text-[#948C79] mb-1">Scaffolded file tree</div>
                <pre className="text-[#E4DECE] font-mono text-[11px] leading-relaxed">
                  {`index.html\ncss/globals.css\ncss/styles.css\njs/script.js\nimgs/`}
                </pre>
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-[#332D22] flex items-center justify-between">
          <button
            onClick={() => (step > 1 ? setStep(step - 1) : onClose())}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded border border-[#332D22] text-[#E4DECE] hover:border-indigo-500"
            data-testid="wizard-back"
          >
            <ChevronLeft size={13} /> {step > 1 ? "Back" : "Cancel"}
          </button>
          {step < 3 ? (
            <button
              onClick={() => canAdvance && setStep(step + 1)}
              disabled={!canAdvance}
              className={`flex items-center gap-1 text-xs px-4 py-1.5 rounded font-medium ${canAdvance ? "bg-indigo-600 hover:bg-indigo-500 text-[#F1EDE2]" : "bg-[#332D22] text-[#948C79] cursor-not-allowed"}`}
              data-testid="wizard-next"
            >
              Next <ChevronRight size={13} />
            </button>
          ) : (
            <button
              onClick={create}
              className="flex items-center gap-1 text-xs px-4 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-[#F1EDE2] font-medium"
              data-testid="wizard-create"
            >
              <Check size={13} /> Create project
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
