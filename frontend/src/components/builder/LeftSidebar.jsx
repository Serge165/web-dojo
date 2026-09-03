import React, { useEffect, useMemo, useState } from "react";
import { CATEGORIES, cardTemplate, featureBoxesTemplate, WEB_SAFE_FONTS } from "@/lib/blocks";
import { ChevronDown, ChevronRight, Type, Plus, Trash2, Search, X, Share2, Radio } from "lucide-react";
import { FileTree } from "./FileTree";
import { ComponentThumbnail } from "./ComponentThumbnail";
import { LayoutBuilder } from "./LayoutBuilder";
import { SnippetsTab } from "./SnippetsTab";
import { FormsTab } from "./FormsTab";
import { CommerceTab } from "./CommerceTab";
import { BlockEditMenu } from "./BlockEditMenu";
import { cdnComponentGroups } from "@/lib/cdnComponents";
import { stampVariant } from "@/lib/variants";
import { useHoverPreview } from "./HoverPreview";

// Groups the flat CATEGORIES list into named super-sections for display.
// Purely presentational — doesn't touch category/block ids or testids, so
// existing references to them (tests, hover-preview, etc.) are unaffected.
// E-commerce isn't listed: that need is already served by the separate
// "Shop" tab (CommerceTab), which is a dynamic catalog/cart builder rather
// than static block templates — no reason to duplicate it here.
const GROUPS = [
  { id: "navigation", label: "Navigation", categoryIds: ["navbars", "headers", "footers"] },
  { id: "hero", label: "Hero", categoryIds: ["heroes"] },
  { id: "parallax", label: "Parallax", categoryIds: ["parallax"] },
  { id: "content", label: "Content", categoryIds: ["components", "text", "toolbox", "containers", "testimonials", "faq", "comments"] },
  { id: "features", label: "Features", categoryIds: ["sections", "services", "pricing", "team"] },
  { id: "forms", label: "Forms", categoryIds: ["newsletter", "contact"] },
  { id: "media", label: "Media", categoryIds: ["video", "portfolio"] },
  { id: "layouts", label: "Layouts", categoryIds: ["layout", "timelines"] },
  { id: "dashboard", label: "Dashboard", categoryIds: ["zenero"] },
  { id: "oxygene", label: "Oxygene", categoryIds: ["oxygene"] },
  { id: "esports", label: "Esports", categoryIds: ["esports"] },
  { id: "creator", label: "Creator", categoryIds: ["creator", "social"] },
  { id: "retro", label: "Moldy Oldies", categoryIds: ["retro"] },
];

export const LeftSidebar = ({
  onAddBlock, onAddFont, onAddFontFile, fonts,
  files, onFilesChange, onFileClick, onImportFile, onInsertAllHtml,
  savedComponents, onDeleteSavedComponent,
  onWrapSelection, hasSelection,
  selectedHtml, selectedId, onEditSelected,
  pages = [], projectId = null, activePageId = null, onSwitchPage = null,
  onJsChange = null,
  onOpenFormBuilder,
  onOpenPaymentBuilder,
  onOpenSocialBuilder,
  onOpenStreamEmbed,
  onWireCatalog,
  onAddCart,
  onSavePaypalSecret,
  onSaveSmtpConfig,
  headHtml,
}) => {
  const [tab, setTab] = useState("library");
  const [open, setOpen] = useState({ components: true, navbars: true, heroes: true, sections: true });
  const [groupOpen, setGroupOpen] = useState({ navigation: true, hero: true, content: true });
  const [cardCount, setCardCount] = useState(3);
  const [featureBoxCount, setFeatureBoxCount] = useState(8);
  const [gFont, setGFont] = useState("Inter");
  const [q, setQ] = useState("");

  const filteredCategories = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return CATEGORIES;
    // Phase 6 (Issue #1): match the block label OR its category label, so
    // searching "zenero" / "dashboard" surfaces those whole categories
    // even when individual block labels don't contain the term.
    return CATEGORIES
      .map((c) => ({ ...c, blocks: c.blocks.filter((b) => b.label.toLowerCase().includes(query) || (c.label || "").toLowerCase().includes(query)) }))
      .filter((c) => c.blocks.length > 0);
  }, [q]);

  // Bucket the (already search-filtered) flat category list into GROUPS,
  // in GROUPS' order, dropping any group left empty by the current search.
  const groupedCategories = useMemo(() => {
    const byId = new Map(filteredCategories.map((c) => [c.id, c]));
    return GROUPS
      .map((g) => ({ ...g, categories: g.categoryIds.map((id) => byId.get(id)).filter(Boolean) }))
      .filter((g) => g.categories.length > 0);
  }, [filteredCategories]);
  const toggleGroup = (id) => setGroupOpen((s) => ({ ...s, [id]: !s[id] }));

  const filteredSaved = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return savedComponents;
    return savedComponents.filter((c) => c.name.toLowerCase().includes(query));
  }, [q, savedComponents]);

  const toggle = (k) => setOpen((s) => ({ ...s, [k]: !s[k] }));
  const onDragStart = (e, html) => { e.dataTransfer.setData("text/html-block", html); e.dataTransfer.effectAllowed = "copy"; };
  const { previewProps, previewNode } = useHoverPreview();

  // When the user selects any block on canvas, automatically surface an
  // edit menu in this sidebar. Bespoke editors cover gallery/bento/
  // timeline/navbar/image/video; the generic content editor covers
  // hero/cta/card and bare text — so dropping any block always opens
  // something useful instead of a "select an editable block" hint.
  const selectedIsEditable = useMemo(() => !!selectedHtml, [selectedHtml]);
  useEffect(() => {
    if (selectedIsEditable && selectedId) setTab("edit");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const BlockItem = ({ label, html, testId, catId, blockId, onDelete }) => {
    const stamped = catId && blockId ? stampVariant(html, catId, blockId) : html;
    return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, stamped)}
      onDoubleClick={() => onAddBlock(stamped)}
      {...previewProps(stamped)}
      className="rounded bg-[#242019] border border-[#332D22] p-3 flex items-center gap-2.5 cursor-grab hover:border-[#C9A227]/60 hover:bg-[#332D22] transition-colors group"
      data-testid={testId}
      title="Drag to canvas or double-click to insert"
    >
      <div className="w-1 h-4 bg-[#C9A227]/60 rounded-full" />
      <span className="text-sm text-[#F1EDE2] flex-1 truncate">{label}</span>
      {onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="opacity-0 group-hover:opacity-100 text-[#A79C87] hover:text-red-400"
          title="Delete saved component"
          data-testid={`${testId}-del`}
        ><Trash2 size={11} /></button>
      )}
    </div>
    );
  };

  return (
    <aside className="w-64 flex-none border-r border-[#332D22] bg-[#1C1A15] flex flex-col overflow-hidden" data-testid="left-sidebar">
      {/* 8 tabs in a 256px sidebar don't fit on one row at any readable font
          size (32px/tab) — wrap to 2 rows of 4 so each tab gets 64px. */}
      <div className="grid grid-cols-4 border-b border-[#332D22] divide-x divide-y divide-[#332D22] text-[11px] tracking-tight">
        {[
          { id: "edit", label: "Edit" },
          { id: "library", label: "Library" },
          { id: "layout", label: "Layout" },
          { id: "forms", label: "Forms" },
          { id: "shop", label: "Shop" },
          { id: "files", label: "Files" },
          { id: "snippets", label: "Snips" },
          { id: "saved", label: `Saved${savedComponents.length ? ` · ${savedComponents.length}` : ""}` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`py-2.5 whitespace-nowrap overflow-hidden ${tab === t.id ? "text-[#F1EDE2] bg-[#242019] border-b-2 border-[#C9A227] -mb-px" : "text-[#A79C87] hover:text-[#F1EDE2] border-b-2 border-transparent"}`}
            data-testid={`left-tab-${t.id}`}
          >{t.label}</button>
        ))}
      </div>

      {tab === "edit" && (
        <div className="flex-1 overflow-y-auto p-2 space-y-2 [scrollbar-width:thin] [scrollbar-color:#6B6353_transparent]" data-testid="left-tab-edit">
          {selectedHtml ? (
            <BlockEditMenu selectedHtml={selectedHtml} onChange={(html) => onEditSelected && onEditSelected(html)} pages={pages} projectId={projectId} blockId={selectedId} />
          ) : (
            <div className="text-[11px] text-[#948C79] p-3 text-center">
              Select any block on the canvas to edit its text, links, and images here.
            </div>
          )}
        </div>
      )}

      {tab === "library" && (
        <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#6B6353_transparent]">
          <div className="px-2 pt-2 pb-1.5 sticky top-0 bg-[#1C1A15] z-10 border-b border-[#332D22]">
            <div className="relative">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#948C79]" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search components…"
                className="w-full bg-[#15130E] border border-[#332D22] rounded pl-6 pr-6 py-1.5 text-xs text-[#F1EDE2] outline-none focus:border-[#C9A227]"
                data-testid="library-search"
              />
              {q && (
                <button
                  onClick={() => setQ("")}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#948C79] hover:text-[#F1EDE2]"
                  data-testid="library-search-clear"
                ><X size={12} /></button>
              )}
            </div>
          </div>
          {groupedCategories.map((g) => (
            <div key={g.id} data-testid={`group-${g.id}`}>
              <button
                onClick={() => toggleGroup(g.id)}
                className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-[#948C79] bg-[#15130E] hover:text-[#E4DECE] sticky top-[42px] z-[5]"
                data-testid={`group-toggle-${g.id}`}
              >
                <span>{g.label}</span>
                {(groupOpen[g.id] ?? true) || q ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </button>
              {((groupOpen[g.id] ?? true) || q) && g.categories.map((cat) => (
                <div key={cat.id} className="border-b border-[#332D22]">
                  <button
                    onClick={() => toggle(cat.id)}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-[13px] uppercase tracking-wider text-[#E4DECE] hover:bg-[#242019]"
                    data-testid={`cat-toggle-${cat.id}`}
                  >
                    <span>{cat.label} <span className="text-[#948C79] normal-case">· {cat.blocks.length}</span></span>
                    {(open[cat.id] ?? true) || q ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                  {((open[cat.id] ?? true) || q) && (
                    <div className="px-2 pb-2 space-y-1.5">
                      {cat.blocks.map((b) => (
                        <BlockItem key={b.id} label={b.label} html={b.html} catId={cat.id} blockId={b.id} testId={`block-${b.id}`} />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
          {groupedCategories.length === 0 && (
            <div className="text-[11px] text-[#948C79] p-4 text-center">No components match "{q}"</div>
          )}

          {/* Cards with count */}
          <div className="border-b border-[#332D22]">
            <div className="px-3 py-2 text-[11px] uppercase tracking-wider text-[#E4DECE]">Cards</div>
            <div className="px-3 pb-3 space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-[#948C79]">Count</label>
                <input
                  type="number" min={1} max={6} value={cardCount}
                  onChange={(e) => setCardCount(Math.min(6, Math.max(1, Number(e.target.value) || 1)))}
                  className="w-16 bg-[#15130E] border border-[#332D22] rounded px-2 py-1 text-xs font-mono text-[#F1EDE2] outline-none focus:border-[#C9A227]"
                  data-testid="cards-count-input"
                />
              </div>
              <button
                onClick={() => onAddBlock(cardTemplate(cardCount))}
                className="w-full text-xs py-1.5 rounded bg-[#AD8B21] hover:bg-[#C9A227] text-[#F1EDE2] flex items-center justify-center gap-1"
                data-testid="cards-insert-btn"
              ><Plus size={12} /> Insert card row</button>
            </div>
          </div>

          {/* Feature boxes with count */}
          <div className="border-b border-[#332D22]">
            <div className="px-3 py-2 text-[11px] uppercase tracking-wider text-[#E4DECE]">Feature Boxes</div>
            <div className="px-3 pb-3 space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-[#948C79]">Count</label>
                <input
                  type="number" min={2} max={8} value={featureBoxCount}
                  onChange={(e) => setFeatureBoxCount(Math.min(8, Math.max(2, Number(e.target.value) || 2)))}
                  className="w-16 bg-[#15130E] border border-[#332D22] rounded px-2 py-1 text-xs font-mono text-[#F1EDE2] outline-none focus:border-[#C9A227]"
                  data-testid="feature-boxes-count-input"
                />
              </div>
              <button
                onClick={() => onAddBlock(featureBoxesTemplate(featureBoxCount))}
                className="w-full text-xs py-1.5 rounded bg-[#AD8B21] hover:bg-[#C9A227] text-[#F1EDE2] flex items-center justify-center gap-1"
                data-testid="feature-boxes-insert-btn"
              ><Plus size={12} /> Insert feature boxes</button>
            </div>
          </div>

          {/* CDN-aware tools */}
          {cdnComponentGroups(headHtml).length > 0 && (
            <div className="border-b border-[#332D22]">
              <div className="px-3 py-2 text-[11px] uppercase tracking-wider text-emerald-300/80">From your CDNs</div>
              <div className="px-3 pb-3 space-y-3" data-testid="cdn-tools">
                {cdnComponentGroups(headHtml).map((g) => (
                  <div key={g.id}>
                    <div className="text-[10px] text-[#948C79] mb-1.5">{g.label}</div>
                    <div className="space-y-1.5">
                      {g.blocks.map((b) => (
                        <BlockItem key={b.id} label={b.label} html={b.html} catId={g.id} blockId={b.id} testId={`cdn-block-${b.id}`} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Social buttons */}
          <div className="border-b border-[#332D22]">
            <div className="px-3 py-2 text-[11px] uppercase tracking-wider text-[#E4DECE] flex items-center gap-1.5"><Share2 size={12} /> Social buttons</div>
            <div className="px-3 pb-3">
              <button
                onClick={onOpenSocialBuilder}
                className="w-full text-xs py-2 rounded bg-[#242019] border border-[#332D22] hover:border-[#C9A227]/60 hover:bg-[#332D22] text-[#F1EDE2] flex items-center justify-center gap-1.5 font-medium"
                data-testid="open-social-builder"
              ><Share2 size={12} className="text-[#C9A227]" /> Open social builder</button>
              <p className="text-[10px] text-[#948C79] mt-1.5 leading-relaxed">Share bar or profile links — pick platforms, shape, style & hover animation.</p>
            </div>
          </div>

          {/* Stream / community embeds */}
          <div className="border-b border-[#332D22]">
            <div className="px-3 py-2 text-[11px] uppercase tracking-wider text-[#E4DECE] flex items-center gap-1.5"><Radio size={12} /> Live stream / community</div>
            <div className="px-3 pb-3">
              <button
                onClick={onOpenStreamEmbed}
                className="w-full text-xs py-2 rounded bg-[#242019] border border-[#332D22] hover:border-[#C9A227]/60 hover:bg-[#332D22] text-[#F1EDE2] flex items-center justify-center gap-1.5 font-medium"
                data-testid="open-stream-embed-builder"
              ><Radio size={12} className="text-[#C9A227]" /> Add Twitch / YouTube / Discord embed</button>
              <p className="text-[10px] text-[#948C79] mt-1.5 leading-relaxed">Real, working embeds — no API keys needed.</p>
            </div>
          </div>

          {/* Fonts */}
          <div className="border-b border-[#332D22]">
            <div className="px-3 py-2 text-[11px] uppercase tracking-wider text-[#E4DECE] flex items-center gap-1.5"><Type size={12} /> Fonts</div>
            <div className="px-3 pb-3 space-y-2">
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#948C79] block mb-1">Web-safe</label>
                <select
                  onChange={(e) => onAddFont({ family: e.target.value, google: false })}
                  className="w-full bg-[#15130E] border border-[#332D22] rounded px-2 py-1.5 text-xs text-[#F1EDE2] outline-none focus:border-[#C9A227]"
                  defaultValue=""
                  data-testid="font-websafe-select"
                >
                  <option value="" disabled>Choose…</option>
                  {WEB_SAFE_FONTS.map((f) => <option key={f} value={f}>{f.split(",")[0]}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#948C79] block mb-1">Google Font</label>
                <div className="flex gap-1.5">
                  <input value={gFont} onChange={(e) => setGFont(e.target.value)} placeholder="e.g. Inter" className="flex-1 bg-[#15130E] border border-[#332D22] rounded px-2 py-1.5 text-xs text-[#F1EDE2] outline-none focus:border-[#C9A227]" data-testid="font-google-input" />
                  <button
                    onClick={() => gFont.trim() && onAddFont({ family: gFont.trim(), google: true })}
                    className="px-2 py-1 rounded bg-[#242019] border border-[#332D22] text-xs text-[#F1EDE2] hover:bg-[#332D22]"
                    data-testid="font-google-add-btn"
                  >Add</button>
                </div>
              </div>
              {fonts.length > 0 && (
                <div className="pt-1">
                  <div className="text-[10px] uppercase tracking-wider text-[#948C79] block mb-1">Loaded</div>
                  <div className="flex flex-wrap gap-1">
                    {fonts.map((f) => (
                      <span key={f} className="text-[10px] px-1.5 py-0.5 rounded bg-[#242019] border border-[#332D22] text-[#E4DECE]">{f}</span>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <label className="text-[10px] uppercase tracking-wider text-[#948C79] block mb-1">Local font file (.ttf/.otf/.woff(2))</label>
                <label className="flex items-center justify-center gap-1.5 w-full rounded bg-[#242019] border border-[#332D22] px-2 py-1.5 text-xs text-[#E4DECE] cursor-pointer hover:bg-[#332D22]" data-testid="font-upload-label">
                  <input
                    type="file"
                    accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f && onAddFontFile) onAddFontFile(f); e.target.value = ""; }}
                    data-testid="font-upload-input"
                  />
                  Upload font
                </label>
              </div>
            </div>
          </div>
        </div>
        {previewNode}
        </div>
      )}

      {tab === "layout" && (
        <LayoutBuilder onAddBlock={onAddBlock} onWrapSelection={onWrapSelection} hasSelection={hasSelection} />
      )}

      {tab === "forms" && (
        <FormsTab onAddBlock={onAddBlock} onOpenBuilder={onOpenFormBuilder} />
      )}

      {tab === "shop" && (
        <CommerceTab onAddBlock={onAddBlock} onOpenPaymentBuilder={onOpenPaymentBuilder} onWireCatalog={onWireCatalog} onAddCart={onAddCart} onSavePaypalSecret={onSavePaypalSecret} onSaveSmtpConfig={onSaveSmtpConfig} />
      )}

      {tab === "snippets" && (
        <SnippetsTab onInsertHtml={onAddBlock} selectedHtml={selectedHtml} />
      )}

      {tab === "files" && (
        <FileTree files={files} onChange={onFilesChange} onFileClick={onFileClick} onInsertHtml={onImportFile} onInsertAllHtml={onInsertAllHtml} pages={pages} activePageId={activePageId} onSwitchPage={onSwitchPage} onJsChange={onJsChange} />
      )}

      {tab === "saved" && (
        <div className="flex-1 overflow-y-auto p-2 space-y-2" data-testid="saved-components">
          {savedComponents.length === 0 && (
            <div className="text-[11px] text-[#948C79] p-3 text-center">
              Click the save icon on any canvas element to keep it here for future projects.
            </div>
          )}
          {filteredSaved.map((c) => (
            <div
              key={c.id}
              draggable
              onDragStart={(e) => { e.dataTransfer.setData("text/html-block", c.html); e.dataTransfer.effectAllowed = "copy"; }}
              onDoubleClick={() => onAddBlock(c.html)}
              className="rounded overflow-hidden border border-[#332D22] bg-[#242019] hover:border-[#C9A227]/60 cursor-grab group"
              data-testid={`saved-${c.id}`}
              title="Drag to canvas or double-click to insert"
            >
              <div className="bg-white">
                <ComponentThumbnail html={c.html} width={232} height={120} scale={0.18} />
              </div>
              <div className="flex items-center gap-2 px-2 py-1.5">
                <div className="w-1 h-3 bg-[#C9A227]/60 rounded-full" />
                <span className="text-xs text-[#F1EDE2] flex-1 truncate">{c.name}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteSavedComponent(c.id); }}
                  className="opacity-0 group-hover:opacity-100 text-[#A79C87] hover:text-red-400"
                  title="Delete saved component"
                  data-testid={`saved-${c.id}-del`}
                ><Trash2 size={11} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
};
