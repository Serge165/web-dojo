import React, { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, ArrowUp, ArrowDown, GripVertical, X, Save } from "lucide-react";
import { DEFAULT_FORM, FIELD_TYPES, newField, buildFormHtml } from "@/lib/forms";

const inputCls = "w-full bg-[#15130E] border border-[#332D22] rounded px-2 py-1.5 text-xs text-[#F1EDE2] outline-none focus:border-[#C9A227]";
const labelCls = "text-[10px] uppercase tracking-wider text-[#948C79] block mb-1";
const btnCls = "text-[11px] px-2 py-1 rounded bg-[#242019] border border-[#332D22] text-[#F1EDE2] hover:bg-[#332D22]";

// Left column: per-form config + field editor. Right column: live iframe
// preview updated on every state change.
export const FormBuilderModal = ({ open, onClose, initial, onInsert, onSaveComponent }) => {
  const [form, setForm] = useState(() => initial || DEFAULT_FORM());
  const [selectedFieldId, setSelectedFieldId] = useState(form.fields[0]?.id || null);

  const html = useMemo(() => buildFormHtml(form), [form]);
  const selectedField = form.fields.find((f) => f.id === selectedFieldId) || null;

  const patchForm = (patch) => setForm((f) => ({ ...f, ...patch }));
  const patchField = (id, patch) => setForm((f) => ({ ...f, fields: f.fields.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  const addField = (type = "text") => {
    const nf = newField(type);
    setForm((f) => ({ ...f, fields: [...f.fields, nf] }));
    setSelectedFieldId(nf.id);
  };
  const removeField = (id) => setForm((f) => {
    const idx = f.fields.findIndex((x) => x.id === id);
    const next = f.fields.filter((x) => x.id !== id);
    if (selectedFieldId === id) setSelectedFieldId(next[idx]?.id || next[idx - 1]?.id || null);
    return { ...f, fields: next };
  });
  const moveField = (id, dir) => setForm((f) => {
    const i = f.fields.findIndex((x) => x.id === id);
    if (i < 0) return f;
    const j = i + dir;
    if (j < 0 || j >= f.fields.length) return f;
    const arr = [...f.fields];
    [arr[i], arr[j]] = [arr[j], arr[i]];
    return { ...f, fields: arr };
  });
  const patchOption = (fieldId, oIndex, patch) => setForm((f) => ({
    ...f,
    fields: f.fields.map((x) => x.id === fieldId ? { ...x, options: x.options.map((o, i) => i === oIndex ? { ...o, ...patch } : o) } : x),
  }));
  const addOption = (fieldId) => setForm((f) => ({
    ...f,
    fields: f.fields.map((x) => x.id === fieldId ? { ...x, options: [...(x.options || []), { v: `opt-${(x.options?.length || 0) + 1}`, l: `Option ${(x.options?.length || 0) + 1}` }] } : x),
  }));
  const removeOption = (fieldId, oIndex) => setForm((f) => ({
    ...f,
    fields: f.fields.map((x) => x.id === fieldId ? { ...x, options: x.options.filter((_, i) => i !== oIndex) } : x),
  }));

  const insert = () => {
    onInsert(html);
    toast.success("Form inserted onto canvas");
    onClose();
  };

  const save = async () => {
    const name = window.prompt("Name this form for the Saved library:", form.submit_label || "Form");
    if (!name) return;
    await onSaveComponent({ name, html, category: "forms" });
    toast.success(`Saved "${name}" to your library`);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#1C1A15] border border-[#332D22] text-[#F1EDE2] max-w-6xl w-[92vw] max-h-[90vh] overflow-hidden p-0" data-testid="form-builder-modal">
        <DialogHeader className="px-5 pt-4 pb-3 border-b border-[#332D22]">
          <DialogTitle className="flex items-center gap-2 text-base">Form builder</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-[380px_1fr] max-h-[calc(90vh-56px)]">
          {/* Left: configuration panel */}
          <div className="border-r border-[#332D22] overflow-y-auto p-4 space-y-4">
            {/* Global settings */}
            <section className="space-y-2">
              <div className="text-[10px] uppercase tracking-widest text-[#948C79]">Form settings</div>
              <div>
                <label className={labelCls}>Form name (inbox label)</label>
                <input value={form.name || ""} onChange={(e) => patchForm({ name: e.target.value })} className={inputCls} placeholder="Contact form" data-testid="form-name-inbox" />
              </div>
              <div>
                <label className={labelCls}>Action URL</label>
                <input value={form.action} onChange={(e) => patchForm({ action: e.target.value })} className={inputCls} placeholder="https://formspree.io/f/…" data-testid="form-action" />
                <p className="text-[10px] text-[#948C79] mt-1 leading-relaxed">Defaults to your Web Dojo inbox — submissions appear under the Inbox icon in the toolbar. Change it to Formspree/Basin to use another backend.</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Method</label>
                  <select value={form.method} onChange={(e) => patchForm({ method: e.target.value })} className={inputCls} data-testid="form-method">
                    <option value="POST">POST</option>
                    <option value="GET">GET</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Layout</label>
                  <select value={form.layout} onChange={(e) => patchForm({ layout: e.target.value })} className={inputCls} data-testid="form-layout">
                    <option value="stacked">Stacked</option>
                    <option value="inline">Inline</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-[1fr_80px] gap-2">
                <div>
                  <label className={labelCls}>Theme</label>
                  <select value={form.theme} onChange={(e) => patchForm({ theme: e.target.value })} className={inputCls} data-testid="form-theme">
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="brand">Brand</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Accent</label>
                  <input type="color" value={form.brand} onChange={(e) => patchForm({ brand: e.target.value })} className="w-full h-[30px] rounded bg-[#15130E] border border-[#332D22] cursor-pointer" data-testid="form-brand" />
                </div>
              </div>
              <div>
                <label className={labelCls}>Submit button</label>
                <input value={form.submit_label} onChange={(e) => patchForm({ submit_label: e.target.value })} className={inputCls} data-testid="form-submit-label" />
              </div>
              <div>
                <label className={labelCls}>Success helper text</label>
                <input value={form.success_message} onChange={(e) => patchForm({ success_message: e.target.value })} className={inputCls} data-testid="form-success" />
              </div>
            </section>

            {/* Fields list */}
            <section>
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] uppercase tracking-widest text-[#948C79]">Fields · {form.fields.length}</div>
              </div>
              <div className="space-y-1" data-testid="form-fields-list">
                {form.fields.map((f, i) => (
                  <div
                    key={f.id}
                    onClick={() => setSelectedFieldId(f.id)}
                    className={`flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer text-xs ${selectedFieldId === f.id ? "bg-[#AD8B21]/20 border border-[#C9A227]/60" : "bg-[#15130E] border border-[#332D22] hover:border-[#C9A227]/40"}`}
                    data-testid={`field-row-${f.id}`}
                  >
                    <GripVertical size={11} className="text-[#6B6353]" />
                    <span className="text-[10px] font-mono uppercase text-[#948C79] min-w-[60px]">{f.type}</span>
                    <span className="text-[#F1EDE2] truncate flex-1">{f.label || f.name || "—"}</span>
                    <button onClick={(e) => { e.stopPropagation(); moveField(f.id, -1); }} className="p-0.5 text-[#948C79] hover:text-[#F1EDE2]" data-testid={`field-up-${f.id}`}><ArrowUp size={10} /></button>
                    <button onClick={(e) => { e.stopPropagation(); moveField(f.id, 1); }} className="p-0.5 text-[#948C79] hover:text-[#F1EDE2]" data-testid={`field-down-${f.id}`}><ArrowDown size={10} /></button>
                    <button onClick={(e) => { e.stopPropagation(); removeField(f.id); }} className="p-0.5 text-[#948C79] hover:text-red-400" data-testid={`field-del-${f.id}`}><Trash2 size={10} /></button>
                  </div>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1">
                {FIELD_TYPES.slice(0, 9).map((t) => (
                  <button key={t.v} onClick={() => addField(t.v)} className={btnCls + " text-[10px]"} data-testid={`add-field-${t.v}`}>
                    <Plus size={9} className="inline -mt-0.5 mr-0.5" />{t.l}
                  </button>
                ))}
              </div>
              <div className="mt-1 grid grid-cols-3 gap-1">
                {FIELD_TYPES.slice(9).map((t) => (
                  <button key={t.v} onClick={() => addField(t.v)} className={btnCls + " text-[10px]"} data-testid={`add-field-${t.v}`}>
                    <Plus size={9} className="inline -mt-0.5 mr-0.5" />{t.l}
                  </button>
                ))}
              </div>
            </section>

            {/* Selected field editor */}
            {selectedField && (
              <section className="border-t border-[#332D22] pt-3 space-y-2" data-testid="field-editor">
                <div className="text-[10px] uppercase tracking-widest text-[#948C79]">Selected · <span className="text-[#D9BC55]">{selectedField.type}</span></div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={labelCls}>Name attr</label>
                    <input value={selectedField.name || ""} onChange={(e) => patchField(selectedField.id, { name: e.target.value })} className={inputCls} data-testid="field-name" />
                  </div>
                  <div>
                    <label className={labelCls}>Label</label>
                    <input value={selectedField.label || ""} onChange={(e) => patchField(selectedField.id, { label: e.target.value })} className={inputCls} data-testid="field-label" />
                  </div>
                </div>
                {!["checkbox", "radio", "hidden", "file"].includes(selectedField.type) && (
                  <div>
                    <label className={labelCls}>Placeholder</label>
                    <input value={selectedField.placeholder || ""} onChange={(e) => patchField(selectedField.id, { placeholder: e.target.value })} className={inputCls} data-testid="field-placeholder" />
                  </div>
                )}
                {selectedField.type === "textarea" && (
                  <div>
                    <label className={labelCls}>Rows</label>
                    <input type="number" min={2} max={12} value={selectedField.rows || 4} onChange={(e) => patchField(selectedField.id, { rows: Number(e.target.value) || 4 })} className={inputCls} data-testid="field-rows" />
                  </div>
                )}
                {selectedField.type === "hidden" && (
                  <div>
                    <label className={labelCls}>Value</label>
                    <input value={selectedField.value || ""} onChange={(e) => patchField(selectedField.id, { value: e.target.value })} className={inputCls} data-testid="field-value" />
                  </div>
                )}
                {selectedField.type === "file" && (
                  <div>
                    <label className={labelCls}>Accept</label>
                    <input value={selectedField.accept || ""} onChange={(e) => patchField(selectedField.id, { accept: e.target.value })} className={inputCls} placeholder="image/*,application/pdf" data-testid="field-accept" />
                  </div>
                )}
                {(selectedField.type === "select" || selectedField.type === "radio") && (
                  <div>
                    <label className={labelCls}>Options</label>
                    <div className="space-y-1">
                      {(selectedField.options || []).map((o, i) => (
                        <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-1" data-testid={`field-option-${i}`}>
                          <input value={o.v} onChange={(e) => patchOption(selectedField.id, i, { v: e.target.value })} placeholder="value" className={inputCls + " font-mono"} />
                          <input value={o.l} onChange={(e) => patchOption(selectedField.id, i, { l: e.target.value })} placeholder="label" className={inputCls} />
                          <button onClick={() => removeOption(selectedField.id, i)} className="text-[#948C79] hover:text-red-400 px-1" data-testid={`option-del-${i}`}><X size={12} /></button>
                        </div>
                      ))}
                      <button onClick={() => addOption(selectedField.id)} className={btnCls + " w-full mt-1"} data-testid="add-option"><Plus size={10} className="inline mr-1" />Add option</button>
                    </div>
                  </div>
                )}
                {selectedField.type !== "hidden" && (
                  <label className="flex items-center gap-2 text-xs text-[#E4DECE] pt-1">
                    <input type="checkbox" checked={!!selectedField.required} onChange={(e) => patchField(selectedField.id, { required: e.target.checked })} data-testid="field-required" />
                    Required
                  </label>
                )}
              </section>
            )}
          </div>

          {/* Right: preview + actions */}
          <div className="flex flex-col overflow-hidden bg-[#f5f5f5]">
            <div className="px-4 py-2 border-b border-[#332D22] bg-[#1C1A15] flex justify-between items-center">
              <div className="text-[11px] uppercase tracking-widest text-[#A79C87]">Live preview</div>
              <div className="flex gap-2">
                {onSaveComponent && (
                  <button onClick={save} className={btnCls} data-testid="form-save-component"><Save size={11} className="inline -mt-0.5 mr-1" />Save to library</button>
                )}
                <button onClick={insert} className="text-xs px-3 py-1.5 rounded bg-[#AD8B21] hover:bg-[#C9A227] text-[#F1EDE2] font-medium" data-testid="form-insert">Insert onto canvas</button>
              </div>
            </div>
            <iframe
              title="form-preview"
              srcDoc={`<!doctype html><html><head><meta charset="utf-8" /><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" /><style>body{margin:0;padding:24px;background:#f5f5f5;font-family:Inter,system-ui,sans-serif;}</style></head><body>${html}</body></html>`}
              className="flex-1 w-full bg-[#f5f5f5] border-0"
              sandbox="allow-forms"
              data-testid="form-preview-iframe"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
