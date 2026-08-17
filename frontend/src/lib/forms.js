// Portable form-block generator: converts a form config into a
// standalone HTML block with inline styles that survives export/publish.

const uid = (p = "f") => `${p}-${Math.random().toString(36).slice(2, 8)}`;

// Default backend inbox for forms built in Web Dojo. Deployed/previewed sites
// POST here so submissions are captured. Users can override with Formspree/etc.
const SUBMIT_ENDPOINT = `${process.env.REACT_APP_BACKEND_URL}/api/submissions`;

const escape = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

export const FIELD_TYPES = [
  { v: "text", l: "Text" },
  { v: "email", l: "Email" },
  { v: "password", l: "Password" },
  { v: "tel", l: "Phone" },
  { v: "url", l: "URL" },
  { v: "number", l: "Number" },
  { v: "date", l: "Date" },
  { v: "time", l: "Time" },
  { v: "textarea", l: "Textarea" },
  { v: "select", l: "Dropdown" },
  { v: "checkbox", l: "Checkbox" },
  { v: "radio", l: "Radio" },
  { v: "file", l: "File upload" },
  { v: "hidden", l: "Hidden" },
];

export const DEFAULT_FORM = () => ({
  id: uid("form"),
  name: "Contact form",
  action: SUBMIT_ENDPOINT,
  method: "POST",
  submit_label: "Send message",
  success_message: "Thanks! We'll be in touch.",
  layout: "stacked", // stacked | inline
  theme: "light",     // light | dark | brand
  brand: "#2563eb",
  fields: [
    { id: uid(), type: "text", name: "name", label: "Your name", placeholder: "Ada Lovelace", required: true },
    { id: uid(), type: "email", name: "email", label: "Email", placeholder: "you@example.com", required: true },
    { id: uid(), type: "textarea", name: "message", label: "Message", placeholder: "Say hi…", required: true, rows: 4 },
  ],
});

export const newField = (type) => {
  const base = { id: uid(), type, name: type + "_" + uid("").slice(-4), label: "", placeholder: "", required: false };
  if (type === "textarea") return { ...base, label: "Message", rows: 4 };
  if (type === "select" || type === "radio") return { ...base, label: type === "select" ? "Choose one" : "Pick one", options: [{ v: "opt-a", l: "Option A" }, { v: "opt-b", l: "Option B" }] };
  if (type === "checkbox") return { ...base, label: "I agree to the terms", required: true };
  if (type === "file") return { ...base, label: "Attach a file", accept: "" };
  if (type === "hidden") return { ...base, label: "", value: "" };
  return { ...base, label: type.charAt(0).toUpperCase() + type.slice(1) };
};

// Colour helpers for the three built-in themes.
const themeCss = (theme, brand) => {
  if (theme === "dark") {
    return {
      formBg: "#141414",
      fieldBg: "#0D0D0D",
      fieldBorder: "#2B2B2B",
      fieldFg: "#f4f4f4",
      labelFg: "#c8c8c8",
      helpFg: "#7a7a7a",
      btnBg: brand,
      btnFg: "#ffffff",
      radius: "8px",
    };
  }
  if (theme === "brand") {
    return {
      formBg: "#ffffff",
      fieldBg: "#ffffff",
      fieldBorder: brand,
      fieldFg: "#0a0a0a",
      labelFg: brand,
      helpFg: "#7a7a7a",
      btnBg: brand,
      btnFg: "#ffffff",
      radius: "10px",
    };
  }
  return {
    formBg: "#ffffff",
    fieldBg: "#ffffff",
    fieldBorder: "#d4d4d8",
    fieldFg: "#0a0a0a",
    labelFg: "#3f3f46",
    helpFg: "#71717a",
    btnBg: brand,
    btnFg: "#ffffff",
    radius: "8px",
  };
};

const fieldControl = (f, css, layout) => {
  const commonInputStyle = `width:100%;padding:12px 14px;font-family:inherit;font-size:15px;color:${css.fieldFg};background:${css.fieldBg};border:1px solid ${css.fieldBorder};border-radius:${css.radius};outline:none;box-sizing:border-box;`;
  const name = escape(f.name || "field");
  const placeholder = escape(f.placeholder || "");
  const req = f.required ? " required" : "";

  if (f.type === "textarea") {
    return `<textarea name="${name}" placeholder="${placeholder}" rows="${f.rows || 4}"${req} style="${commonInputStyle}resize:vertical;min-height:96px;"></textarea>`;
  }
  if (f.type === "select") {
    const opts = (f.options || []).map((o) => `<option value="${escape(o.v)}">${escape(o.l)}</option>`).join("");
    return `<select name="${name}"${req} style="${commonInputStyle}appearance:none;background-image:linear-gradient(45deg,transparent 50%,${css.fieldFg} 50%),linear-gradient(135deg,${css.fieldFg} 50%,transparent 50%);background-position:calc(100% - 18px) 50%,calc(100% - 13px) 50%;background-size:5px 5px;background-repeat:no-repeat;padding-right:36px;">${opts}</select>`;
  }
  if (f.type === "radio") {
    return (f.options || [])
      .map(
        (o) =>
          `<label style="display:flex;align-items:center;gap:8px;font-size:14px;color:${css.labelFg};cursor:pointer;padding:4px 0;"><input type="radio" name="${name}" value="${escape(o.v)}"${req} style="accent-color:${css.btnBg};" /> ${escape(o.l)}</label>`
      )
      .join("");
  }
  if (f.type === "checkbox") {
    return `<label style="display:flex;align-items:center;gap:10px;font-size:14px;color:${css.labelFg};cursor:pointer;"><input type="checkbox" name="${name}"${req} style="accent-color:${css.btnBg};width:16px;height:16px;" /> ${escape(f.label || "")}</label>`;
  }
  if (f.type === "file") {
    const accept = f.accept ? ` accept="${escape(f.accept)}"` : "";
    return `<input type="file" name="${name}"${accept}${req} style="${commonInputStyle}padding:10px 14px;" />`;
  }
  if (f.type === "hidden") {
    return `<input type="hidden" name="${name}" value="${escape(f.value || "")}" />`;
  }
  return `<input type="${f.type}" name="${name}" placeholder="${placeholder}"${req} style="${commonInputStyle}" />`;
};

// Compose the whole form as one draggable HTML block.
export const buildFormHtml = (config) => {
  const css = themeCss(config.theme, config.brand || "#2563eb");
  const isInline = config.layout === "inline";
  const gap = isInline ? "12px" : "16px";
  const rows = config.fields.map((f) => {
    if (f.type === "hidden") return fieldControl(f, css, config.layout);
    if (f.type === "checkbox") return `<div style="margin:0;">${fieldControl(f, css, config.layout)}</div>`;
    const labelHtml = f.label
      ? `<label style="display:block;font-size:13px;font-weight:600;color:${css.labelFg};margin-bottom:6px;letter-spacing:0.01em;">${escape(f.label)}${f.required ? ' <span style="color:#ef4444;">*</span>' : ""}</label>`
      : "";
    return `<div style="flex:1 1 ${isInline ? "220px" : "100%"};min-width:0;">${labelHtml}${fieldControl(f, css, config.layout)}</div>`;
  });

  const successMsg = escape(config.success_message || "Thanks! Your submission was received.");
  const formName = escape(config.name || config.submit_label || "Untitled form");
  const meta = `<input type="hidden" name="_wd_form" value="${formName}" /><input type="hidden" name="_wd_form_id" value="${escape(config.id)}" />`;
  const script = `<script>(function(){var fs=document.querySelectorAll('form[data-form-id="${config.id}"]');Array.prototype.forEach.call(fs,function(f){if(f.__wdBound){return;}f.__wdBound=1;f.addEventListener('submit',function(ev){ev.preventDefault();var fd=new FormData(f);fd.append('_wd_page',location.href);fd.append('_wd_title',document.title);var b=f.querySelector('[type=submit],button');if(b){b.disabled=true;}fetch(f.getAttribute('action'),{method:'POST',body:fd,headers:{'Accept':'application/json'}}).then(function(r){if(!r.ok){throw 0;}f.innerHTML='<div style="padding:16px 0;color:#16a34a;font-weight:600;font-size:15px;font-family:Inter,system-ui,sans-serif;">'+(f.getAttribute('data-success')||'Thanks!')+'</div>';}).catch(function(){if(b){b.disabled=false;}alert('Sorry, something went wrong. Please try again.');});});});})();<\/script>`;
  return `<form action="${escape(config.action)}" method="${escape(config.method || "POST")}" data-form-id="${escape(config.id)}" data-success="${successMsg}" style="max-width:640px;margin:32px auto;padding:32px;background:${css.formBg};border:1px solid ${css.fieldBorder};border-radius:${css.radius};font-family:Inter,system-ui,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,0.06);">${meta}<div style="display:flex;flex-wrap:wrap;gap:${gap};">${rows.join("")}</div><button type="submit" style="margin-top:20px;padding:14px 24px;background:${css.btnBg};color:${css.btnFg};border:none;border-radius:${css.radius};font-size:15px;font-weight:600;cursor:pointer;letter-spacing:0.01em;">${escape(config.submit_label || "Submit")}</button><p style="margin:12px 0 0;font-size:12px;color:${css.helpFg};">${escape(config.success_message || "")}</p></form>${script}`;
};

// Small library of ready-to-drop form presets.
export const FORM_PRESETS = [
  {
    id: "form-contact",
    label: "Contact form",
    config: () => ({
      ...DEFAULT_FORM(),
      submit_label: "Send message",
      fields: [
        { id: uid(), type: "text", name: "name", label: "Your name", placeholder: "Ada Lovelace", required: true },
        { id: uid(), type: "email", name: "email", label: "Email", placeholder: "you@example.com", required: true },
        { id: uid(), type: "textarea", name: "message", label: "Message", placeholder: "How can we help?", required: true, rows: 4 },
      ],
    }),
  },
  {
    id: "form-newsletter",
    label: "Newsletter signup",
    config: () => ({
      ...DEFAULT_FORM(),
      layout: "inline",
      submit_label: "Subscribe",
      success_message: "One email per month. Unsubscribe any time.",
      fields: [
        { id: uid(), type: "email", name: "email", label: "", placeholder: "you@example.com", required: true },
      ],
    }),
  },
  {
    id: "form-login",
    label: "Login",
    config: () => ({
      ...DEFAULT_FORM(),
      submit_label: "Log in",
      success_message: "",
      fields: [
        { id: uid(), type: "email", name: "email", label: "Email", placeholder: "you@example.com", required: true },
        { id: uid(), type: "password", name: "password", label: "Password", placeholder: "•••••••", required: true },
      ],
    }),
  },
  {
    id: "form-signup",
    label: "Signup",
    config: () => ({
      ...DEFAULT_FORM(),
      submit_label: "Create account",
      success_message: "",
      fields: [
        { id: uid(), type: "text", name: "full_name", label: "Full name", placeholder: "Ada Lovelace", required: true },
        { id: uid(), type: "email", name: "email", label: "Email", placeholder: "you@example.com", required: true },
        { id: uid(), type: "password", name: "password", label: "Password", placeholder: "Min 8 characters", required: true },
        { id: uid(), type: "checkbox", name: "agree", label: "I agree to the terms of service", required: true },
      ],
    }),
  },
  {
    id: "form-feedback",
    label: "Feedback",
    config: () => ({
      ...DEFAULT_FORM(),
      submit_label: "Send feedback",
      fields: [
        { id: uid(), type: "select", name: "topic", label: "What is this about?", required: true, options: [
          { v: "bug", l: "A bug" }, { v: "feature", l: "A feature request" }, { v: "praise", l: "Kind words" },
        ]},
        { id: uid(), type: "radio", name: "sentiment", label: "How do you feel?", required: true, options: [
          { v: "great", l: "Great" }, { v: "meh", l: "Meh" }, { v: "bad", l: "Not great" },
        ]},
        { id: uid(), type: "textarea", name: "notes", label: "Notes", placeholder: "Tell us more…", rows: 4 },
      ],
    }),
  },
  {
    id: "form-rsvp",
    label: "Event RSVP",
    config: () => ({
      ...DEFAULT_FORM(),
      submit_label: "RSVP",
      fields: [
        { id: uid(), type: "text", name: "name", label: "Name", required: true },
        { id: uid(), type: "email", name: "email", label: "Email", required: true },
        { id: uid(), type: "number", name: "guests", label: "Number of guests", placeholder: "1", required: true },
        { id: uid(), type: "select", name: "diet", label: "Dietary requirements", options: [
          { v: "none", l: "No special requirements" }, { v: "veg", l: "Vegetarian" }, { v: "vegan", l: "Vegan" }, { v: "gf", l: "Gluten-free" },
        ]},
      ],
    }),
  },
];
