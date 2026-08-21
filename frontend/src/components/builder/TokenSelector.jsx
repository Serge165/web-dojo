import React, { useMemo, useState } from "react";
import { Plus, Layers } from "lucide-react";

const ROOT_BLOCK_RE = /:root\s*\{([^}]*)\}/g;
const DECL_RE = /(--[\w-]+)\s*:\s*([^;]+);/g;

// All --fc-* (and any other) custom properties currently defined anywhere
// in headHtml's :root blocks, later declarations winning — mirrors how the
// cascade itself would resolve a duplicate.
const parseTokens = (headHtml) => {
  const tokens = new Map();
  const h = headHtml || "";
  let block;
  ROOT_BLOCK_RE.lastIndex = 0;
  while ((block = ROOT_BLOCK_RE.exec(h))) {
    let decl;
    DECL_RE.lastIndex = 0;
    while ((decl = DECL_RE.exec(block[1]))) tokens.set(decl[1], decl[2].trim());
  }
  return [...tokens.entries()].map(([name, value]) => ({ name, value }));
};

const usageCount = (elements, name) =>
  elements.reduce((n, e) => n + ((e.html || "").includes(`var(${name}`) ? 1 : 0), 0);

const tokensOnElement = (el, tokenNames) => {
  if (!el) return [];
  const m = el.html.match(/style="([^"]*)"/);
  if (!m) return [];
  return tokenNames.filter((name) => m[1].includes(`var(${name}`));
};

export const TokenSelector = ({ headHtml, elements, selected, onApplyToken, onCreateToken }) => {
  const tokens = useMemo(() => parseTokens(headHtml), [headHtml]);
  const appliedNames = useMemo(() => tokensOnElement(selected, tokens.map((t) => t.name)), [selected, tokens]);
  const [newName, setNewName] = useState("");
  const [newValue, setNewValue] = useState("#2563eb");

  const submitNewToken = () => {
    const slug = newName.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/(^-+|-+$)/g, "");
    if (!slug) return;
    const name = slug.startsWith("--") ? slug : `--fc-${slug}`;
    onCreateToken(name, newValue);
    setNewName("");
  };

  return (
    <div className="space-y-3" data-testid="token-selector">
      {selected && (
        <div>
          <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Applied to this block</div>
          {appliedNames.length === 0 ? (
            <div className="text-[11px] text-gray-500">No tokens on this block yet.</div>
          ) : (
            <div className="flex flex-wrap gap-1">
              {appliedNames.map((n) => (
                <span key={n} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1F1F1F] border border-[#2B2B2B] text-gray-300" data-testid={`token-applied-${n}`}>{n}</span>
              ))}
            </div>
          )}
        </div>
      )}

      <div>
        <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1"><Layers size={11} /> All tokens · {tokens.length}</div>
        {tokens.length === 0 && <div className="text-[11px] text-gray-500">No tokens defined yet — apply a theme or a color to create one.</div>}
        <div className="space-y-1.5">
          {tokens.map((t) => {
            const count = usageCount(elements, t.name);
            return (
              <div key={t.name} className="flex items-center gap-2 bg-[#0D0D0D] border border-[#2B2B2B] rounded-md px-2 py-1.5" data-testid={`token-row-${t.name}`}>
                <span className="w-5 h-5 rounded border border-[#2B2B2B] flex-none" style={{ background: t.value }} title={t.value} />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-mono text-gray-200 truncate">{t.name}</div>
                  <div className="text-[10px] text-gray-500 truncate">{t.value} · used on {count} block{count === 1 ? "" : "s"}</div>
                </div>
                <div className="flex-none flex gap-1">
                  <button
                    disabled={!selected}
                    onClick={() => onApplyToken(t.name, "background")}
                    className="text-[10px] px-1.5 py-1 rounded bg-[#1F1F1F] hover:bg-[#2B2B2B] text-gray-300 border border-[#2B2B2B] disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Apply as background"
                    data-testid={`token-apply-bg-${t.name}`}
                  >BG</button>
                  <button
                    disabled={!selected}
                    onClick={() => onApplyToken(t.name, "color")}
                    className="text-[10px] px-1.5 py-1 rounded bg-[#1F1F1F] hover:bg-[#2B2B2B] text-gray-300 border border-[#2B2B2B] disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Apply as text color"
                    data-testid={`token-apply-text-${t.name}`}
                  >Text</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-2 border-t border-[#2B2B2B]">
        <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">New token</div>
        <div className="flex gap-2">
          <input
            type="color"
            value={/^#[0-9a-f]{6}$/i.test(newValue) ? newValue : "#2563eb"}
            onChange={(e) => setNewValue(e.target.value)}
            className="w-9 h-8 bg-transparent border border-[#2B2B2B] rounded flex-none"
            data-testid="new-token-color"
          />
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="name (e.g. brand-highlight)"
            className="flex-1 min-w-0 bg-[#0D0D0D] border border-[#2B2B2B] rounded px-2 py-1.5 text-xs text-white outline-none focus:border-blue-500"
            data-testid="new-token-name"
          />
          <button
            onClick={submitNewToken}
            disabled={!newName.trim()}
            className="flex-none px-2 rounded bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-30 disabled:cursor-not-allowed"
            title="Create token"
            data-testid="new-token-submit"
          ><Plus size={13} /></button>
        </div>
        <p className="text-[10px] text-gray-500 mt-1">Creates --fc-{"{name}"} under :root. Doesn't apply it anywhere until you hit BG/Text on a selected block.</p>
      </div>
    </div>
  );
};
