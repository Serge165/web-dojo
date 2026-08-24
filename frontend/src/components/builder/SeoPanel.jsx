import React, { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  truncateForSerp, titleCountColor, truncateDescriptionForSerp, descriptionCountColor,
} from "@/lib/seoFieldChecks";
import { computeSeoChecks, scoreColor } from "@/lib/seoScore";
import { suggestSeoFromContent } from "@/lib/seoContentSuggest";
import { SEO_TEMPLATES } from "@/lib/seoTemplates";

const STATUS_ICON = { pass: "✓", warn: "⚠", fail: "✗" };
const STATUS_COLOR = { pass: "text-emerald-500", warn: "text-amber-500", fail: "text-red-500" };

const OG_TYPES = ["website", "article", "product", "profile"];
const SCHEMA_TYPES = [
  "WebSite", "Organization", "LocalBusiness", "Product", "Article", "BlogPosting",
  "Person", "SoftwareApplication", "Restaurant", "Course", "RealEstateListing",
];

const FIELDS = [
  { key: "title", label: "Title", placeholder: "Page title", type: "text", counter: { max: 60, colorFn: titleCountColor } },
  { key: "description", label: "Description", placeholder: "A short summary that appears in search results.", type: "textarea", counter: { max: 160, colorFn: descriptionCountColor } },
  { key: "keywords", label: "Keywords", placeholder: "comma, separated, keywords", type: "text" },
  { key: "canonical", label: "Canonical URL", placeholder: "https://example.com/page", type: "text" },
  { key: "favicon", label: "Favicon URL", placeholder: "/favicon.ico", type: "text" },
  { key: "og_type", label: "OG Type", type: "select", options: OG_TYPES },
  { key: "og_title", label: "OG Title", placeholder: "Same as title if empty", type: "text" },
  { key: "og_description", label: "OG Description", placeholder: "Same as description if empty", type: "textarea" },
  { key: "og_image", label: "OG Image URL", placeholder: "https://…/social-share.png", type: "text" },
  { key: "twitter_card", label: "Twitter Card", placeholder: "summary_large_image", type: "text" },
  { key: "schema_type", label: "Structured data (schema.org type)", type: "select", options: SCHEMA_TYPES },
];

export const SeoPanel = ({ open, onClose, seo, onChange, pageName, elements }) => {
  const s = seo || {};
  const update = (patch) => onChange({ ...s, ...patch });
  const { checks, score } = useMemo(() => computeSeoChecks({ seo: s, elements }), [s, elements]);
  const suggestion = useMemo(() => suggestSeoFromContent(elements), [elements]);
  const [showChecklist, setShowChecklist] = useState(false);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#1C1A15] border border-[#332D22] text-[#F1EDE2] max-w-2xl max-h-[85vh] overflow-y-auto" data-testid="seo-panel">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-6">
            <span>SEO · {pageName || "Page"}</span>
            <button
              onClick={() => setShowChecklist((v) => !v)}
              className={`text-xs font-mono px-2 py-0.5 rounded border border-[#332D22] hover:border-[#948C79] ${scoreColor(score)}`}
              data-testid="seo-score"
              title="Click to see the checklist"
            >
              {score}/100
            </button>
          </DialogTitle>
        </DialogHeader>
        {showChecklist && (
          <div className="rounded border border-[#332D22] bg-[#15130E] p-3 space-y-1.5" data-testid="seo-checklist">
            {checks.map((c) => (
              <div key={c.id} className="flex items-start gap-2 text-xs">
                <span className={`font-mono ${STATUS_COLOR[c.status]}`}>{STATUS_ICON[c.status]}</span>
                <span className="text-[#E4DECE] shrink-0">{c.label}:</span>
                <span className="text-[#948C79]">{c.detail}</span>
              </div>
            ))}
          </div>
        )}
        <div className="rounded border border-[#332D22] bg-[#15130E] p-3 space-y-1.5" data-testid="seo-template-picker">
          <div className="text-[10px] uppercase tracking-wider text-[#948C79]">Start from a template</div>
          <select
            value=""
            onChange={(e) => {
              const tpl = SEO_TEMPLATES.find((t) => t.id === e.target.value);
              if (!tpl) return;
              update({
                title: tpl.title, description: tpl.description, keywords: tpl.keywords,
                og_type: tpl.ogType, schema_type: tpl.schemaType,
              });
            }}
            className="w-full bg-[#242019] border border-[#332D22] rounded px-2 py-1.5 text-xs text-[#F1EDE2] outline-none focus:border-[#C9A227]"
            data-testid="seo-template-select"
          >
            <option value="">Choose a page type…</option>
            {SEO_TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <p className="text-[10px] text-[#948C79] leading-relaxed">Fills title/description/keywords with [bracketed] placeholders below — edit them directly. Overwrites the fields above.</p>
        </div>
        {(suggestion.title || suggestion.description) && (
          <div className="rounded border border-[#332D22] bg-[#15130E] p-3 space-y-2" data-testid="seo-content-suggestion">
            <div className="text-[10px] uppercase tracking-wider text-[#948C79]">Suggested from page content</div>
            {suggestion.title && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#A79C87] flex-1 truncate">Title: “{suggestion.title}”</span>
                <button
                  onClick={() => update({ title: suggestion.title })}
                  className="text-[10px] px-2 py-1 rounded bg-[#242019] hover:bg-[#332D22] text-[#F1EDE2] shrink-0"
                  data-testid="seo-suggest-apply-title"
                >
                  Use as title
                </button>
              </div>
            )}
            {suggestion.description && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#A79C87] flex-1 truncate">Description: “{suggestion.description}”</span>
                <button
                  onClick={() => update({ description: suggestion.description })}
                  className="text-[10px] px-2 py-1 rounded bg-[#242019] hover:bg-[#332D22] text-[#F1EDE2] shrink-0"
                  data-testid="seo-suggest-apply-description"
                >
                  Use as description
                </button>
              </div>
            )}
          </div>
        )}
        <div className="space-y-3">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <label className="text-[10px] uppercase tracking-wider text-[#948C79] mb-1 flex items-center justify-between">
                <span>{f.label}</span>
                {f.counter && (
                  <span className={`font-mono normal-case tracking-normal ${f.counter.colorFn((s[f.key] || "").length)}`} data-testid={`seo-${f.key}-count`}>
                    {(s[f.key] || "").length}/{f.counter.max}
                  </span>
                )}
              </label>
              {f.type === "textarea" ? (
                <textarea
                  value={s[f.key] || ""}
                  onChange={(e) => update({ [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  rows={3}
                  className="w-full bg-[#15130E] border border-[#332D22] rounded px-2 py-1.5 text-xs text-[#F1EDE2] outline-none focus:border-[#C9A227] resize-y"
                  data-testid={`seo-${f.key}`}
                />
              ) : f.type === "select" ? (
                <select
                  value={s[f.key] || f.options[0]}
                  onChange={(e) => update({ [f.key]: e.target.value })}
                  className="w-full bg-[#15130E] border border-[#332D22] rounded px-2 py-1.5 text-xs text-[#F1EDE2] outline-none focus:border-[#C9A227]"
                  data-testid={`seo-${f.key}`}
                >
                  {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input
                  value={s[f.key] || ""}
                  onChange={(e) => update({ [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  className="w-full bg-[#15130E] border border-[#332D22] rounded px-2 py-1.5 text-xs text-[#F1EDE2] outline-none focus:border-[#C9A227]"
                  data-testid={`seo-${f.key}`}
                />
              )}
            </div>
          ))}
          <div className="pt-2 border-t border-[#332D22]">
            <div className="text-[10px] uppercase tracking-wider text-[#948C79] mb-1">Live preview (search snippet)</div>
            <div className="rounded border border-[#332D22] bg-[#15130E] p-3">
              <div className="text-[13px] text-[#D9BC55] truncate">{truncateForSerp(s.title || pageName || "Page title")}</div>
              <div className="text-[11px] text-emerald-500 font-mono truncate">{s.canonical || "https://example.com/"}</div>
              <div className="text-[12px] text-[#A79C87] line-clamp-2">{truncateDescriptionForSerp(s.description || "A short summary that appears in search results.")}</div>
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <button onClick={onClose} className="text-xs px-3 py-1.5 rounded bg-[#AD8B21] hover:bg-[#C9A227] text-[#F1EDE2]" data-testid="seo-close">Done</button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
