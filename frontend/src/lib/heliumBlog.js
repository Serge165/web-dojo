// Helium Blog — a Canvas-rendered blog widget for Web Dojo.
//
// WHY THIS BLOCK EXISTS
//   Helium is the explicit-rendering companion to the Zenero ("Hydrogen")
//   dashboard. It renders blog posts as *pixels* on a <canvas> (students can
//   watch data -> state -> pixels), but it is NOT a toy: it reads the exact
//   same /api/{project_id}/blog_posts collection that the Zenero dashboard's
//   Blog tab authors, so anything you publish in the dashboard appears in the
//   block — and vice versa. It carries data-forge-widget="latest-blog", the
//   same marker the existing "Latest from Blog" block uses, so dropping a
//   Helium block instantly unlocks the Zenero dashboard button in the builder
//   (see lib/zeneroWidgets.js — hasZeneroWidget gates that entry point).
//
// HOW THE BLOCK IS STRUCTURED (one block per variant, same shared runtime)
//   • Root <section> — data-helium="blog", data-helium-variant="<id>",
//     data-forge-widget="latest-blog", data-forge-project-id="".
//     In the Design canvas the variant is selectable via the existing
//     Variants panel because all 8 blocks share the "helium" category
//     (data-wd-cat/data-wd-block stamped at insert time by stampVariant).
//   • Static preview div (data-helium-preview) — pure HTML/CSS mirror of the
//     variant. The Design canvas and sidebar thumbnails run NO block scripts
//     (dangerouslySetInnerHTML / sandboxed iframes), so this preview is what
//     you see there — and it doubles as a graceful no-JS fallback on the
//     published page too.
//   • Hidden <canvas> — shown + painted only by the runtime on the live page.
//   • Controls + .sr-only live region — keyboard navigation and screen-reader
//     fallback (mirrors the Helium teaching conventions).
//   • <script data-forge-js="helium-blog.js"> — the shared runtime. The
//     export pipeline (exportHtml.js::extractForgeJs / server.py
//     ::_extract_forge_js) pulls it into a real js/helium-blog.js for
//     zip/publish exports; the single-file export keeps it inline (Phase 6
//     stripInlineStyles guard passes <script> segments through untouched).
//     The runtime is deduplicated by filename, so the same script may be
//     inlined in all 8 blocks without duplication.

// The 8 teaching variants: same posts, different canvas rendering approach.
export const HELIUM_CANVAS_VARIANTS = [
  { id: "blog-classic",   label: "Helium Blog · Classic",   renderer: "classic" },
  { id: "blog-dark",      label: "Helium Blog · Dark",      renderer: "dark" },
  { id: "blog-minimal",   label: "Helium Blog · Minimal",   renderer: "minimal" },
  { id: "blog-grid",      label: "Helium Blog · Grid",      renderer: "grid" },
  { id: "blog-timeline",  label: "Helium Blog · Timeline",  renderer: "timeline" },
  { id: "blog-cardstack", label: "Helium Blog · Card Stack", renderer: "cardstack" },
  { id: "blog-reader",    label: "Helium Blog · Reader",    renderer: "reader" },
  { id: "blog-annotated", label: "Helium Blog · Annotated", renderer: "annotated" },
];

// Functional HTML-blog variants — the "working blog" counterpart to the canvas
// teaching variants. Same Zenero /api/{pid}/blog_posts data source, but rendered
// as real accessible DOM (search + category filter + blade cards + full-post
// expansion) instead of pixels on a canvas. These are what you'd actually ship
// on a site; the canvas variants are the teaching demos. The builder's Variants
// panel offers them as one-click swaps because they share the "helium" category.
export const HELIUM_HTML_VARIANTS = [
  { id: "blog-html-list", label: "Helium Blog · List", renderer: "html-list", type: "html" },
  { id: "blog-html-full", label: "Helium Blog · Single Post", renderer: "html-full", type: "html" },
];

export const HELIUM_VARIANTS = [...HELIUM_CANVAS_VARIANTS, ...HELIUM_HTML_VARIANTS];

// Default posts shown when the project has no Zenero blog content yet — the
// same sample set the Helium teaching docs use. The runtime replaces these
// with live /api/{pid}/blog_posts data the moment a project is published and
// has posts in the Zenero dashboard Blog tab.
export const HELIUM_FALLBACK_POSTS = [
  {
    id: "helium-1",
    title: "Welcome to Helium",
    date: "September 5, 2026",
    author: "Dreamwalker",
    category: "Getting Started",
    image: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=500&h=300&fit=crop",
    excerpt:
      "Helium is the explicit-rendering companion to the Zenero dashboard. " +
      "It renders blog posts as pixels on a canvas — but it's not a toy: it " +
      "reads the exact same /api/{project_id}/blog_posts collection that the " +
      "dashboard's Blog tab authors.",
    content:
      "Helium teaches how the Canvas API transforms data into visual output. " +
      "Watch as we navigate through posts using explicit canvas rendering, " +
      "turning JSON from the Zenero dashboard into pixels you can read. The " +
      "data flows from the dashboard's Blog tab, through the API, onto the " +
      "canvas — a complete loop you can inspect and remix.",
  },
  {
    id: "helium-2",
    title: "From Dashboard to Page",
    date: "September 4, 2026",
    author: "Dreamwalker",
    category: "Getting Started",
    image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&h=300&fit=crop",
    excerpt:
      "Anything you publish in the Zenero dashboard appears in this block — " +
      "and vice versa. The Helium blog reads the same collection the dashboard " +
      "writes, so the two are always in sync.",
    content:
      "The Helium blog and the Zenero dashboard share one source of truth: " +
      "the /api/{project_id}/blog_posts collection. Create a post in the " +
      "dashboard's Blog tab and it shows up here instantly. Edit the title, " +
      "swap the excerpt, change the image — the blog reflects it the next " +
      "time the page loads. No copying, no syncing, no drift.",
  },
  {
    id: "helium-3",
    title: "Eight Ways to Render a Post",
    date: "September 3, 2026",
    author: "Dreamwalker",
    category: "Canvas",
    image: "https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=500&h=300&fit=crop",
    excerpt:
      "Classic, Dark, Minimal, Grid, Timeline, Card Stack, Reader, Annotated — " +
      "each variant shows the same post, rendered a different way.",
    content:
      "Helium ships eight rendering variants so you can compare approaches " +
      "side by side. Classic lays out title, byline, and wrapped body text. " +
      "Dark inverts the palette. Minimal strips it to a single weight. Grid " +
      "tiles three posts at once. Timeline stacks them down a center spine. " +
      "Card Stack layers the deck behind the front card. Reader goes large " +
      "and serif. Annotated adds inline callouts. Same data, eight canvases.",
  },
  {
    id: "helium-4",
    title: "HTML Blog: the Functional Counterpart",
    date: "September 2, 2026",
    author: "Dreamwalker",
    category: "Features",
    image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=500&h=300&fit=crop",
    excerpt:
      "Canvas variants teach rendering. The HTML variants are the working blog: " +
      "search, category filter, blade-shaped cards, and full-post expansion — " +
      "all reading the same Zenero API.",
    content:
      "The HTML blog variants are what you'd actually put on a site. They " +
      "render real, accessible DOM — not pixels — so search engines, screen " +
      "readers, and keyboards all work natively. A search box filters posts " +
      "by title and excerpt. A category dropdown narrows the field. Cards " +
      "are blade-shaped: image, title, excerpt, date, category tag. Tap a " +
      "card and it expands to the full post, with a back button to return. " +
      "Same API, same dashboard, real blog.",
  },
  {
    id: "helium-5",
    title: "Theme Cascade in Action",
    date: "September 1, 2026",
    author: "Dreamwalker",
    category: "Design",
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=500&h=300&fit=crop",
    excerpt:
      "Change the page's primary color once and the blog follows — CSS custom " +
      "properties cascade from the theme into every card, button, and link.",
    content:
      "Helium inherits its colors from the page theme via CSS custom " +
      "properties: --fc-primary, --fc-text, --fc-surface, --fc-border. Change " +
      "the theme in the builder and the blog updates automatically — no per-" +
      "block recoloring. The canvas variants read the palette at paint time; " +
      "the HTML variants reference the variables in their styles. One theme, " +
      "every variant in sync.",
  },
];


// JSON seed embedded in every block so the runtime has content even when the
// fetch to the Zenero API fails or the project has no posts yet (also keeps
// the block working under file://, mirroring the comments.js seed pattern).
export const HELIUM_FALLBACK_POSTS_JSON = JSON.stringify(HELIUM_FALLBACK_POSTS);

// Page theme tokens the block syncs to. The runtime resolves colors at draw
// time from --helium-* (per-block override, e.g. after "Cycle Theme") falling
// back to the page's --fc-* tokens (the Theme editor / Zenero theme vars), so
// recoloring the site recolors every canvas render automatically.
export const HELIUM_TOKENS = {
  accent: "var(--fc-accent, var(--fc-primary, #6366f1))",
  text: "var(--fc-text, #16303a)",
  bg: "var(--fc-bg, var(--wd-canvas-bg, #ffffff))",
  card: "var(--fc-surface, #ffffff)",
  muted: "var(--fc-muted, #5f7480)",
  border: "var(--fc-border, #d4e0e6)",
};

// Four classic textbook palettes the "Cycle Theme" button steps through.
// They are applied as --helium-* overrides on the block root, and the
// runtime's resolvePalette prefers them over the page theme — so cycling is
// an explicit override, and we expose a "Sync to Page Theme" step that
// clears them back to the site's own tokens (see the runtime).
export const HELIUM_THEME_PRESETS = [
  { name: "Classic", accent: "#00b7ff", text: "#16303a", bg: "#ffffff", card: "#ffffff", muted: "#5f7480", border: "#d4e0e6" },
  { name: "Dark", accent: "#ffd60a", text: "#ffffff", bg: "#0f1518", card: "#172127", muted: "#93a8b4", border: "#2a3a42" },
  { name: "Minimal", accent: "#000000", text: "#111111", bg: "#ffffff", card: "#f6f6f6", muted: "#666666", border: "#cccccc" },
  { name: "Warm", accent: "#e74c3c", text: "#2c3e50", bg: "#fef5e7", card: "#ffffff", muted: "#7f8c8d", border: "#f0e2ce" },
];

// Inline sr-only recipe reused by every block (positioned off-screen for
// screen readers, never display:none — display:none hides content from them).
const SR_ONLY =
  "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;" +
  "clip:rect(0,0,0,0);white-space:nowrap;border:0;";

// The control strip: prev/next/counter/theme-cycle. Inert in the Design
// canvas (block scripts don't run there); wired by the runtime when live.
const CONTROL_STYLES =
  "display:flex;flex-wrap:wrap;gap:10px;justify-content:center;align-items:center;" +
  "margin-top:14px;font-family:'Segoe UI',system-ui,sans-serif;";

const BUTTON_STYLES = (tokens) =>
  "padding:9px 16px;border:1px solid " + tokens.border + ";border-radius:9px;" +
  "background:" + tokens.text + ";color:" + tokens.bg + ";font-size:13px;" +
  "font-weight:600;cursor:pointer;";

// Static (design-mode / no-JS) previews. Each mirrors what its canvas
// renderer draws, using the page theme tokens so the block preview reacts to
// theme changes even before the runtime takes over. Each fn(t) returns the
// ENTIRE opening <div ...> — the opening tag line, its attributes and the ">"
// — followed by inner markup (see buildHeliumBlockHtml).
const PREVIEWS = {
  "blog-classic": (t) =>
    '<div data-helium-preview style="font-family:\'Segoe UI\',system-ui,sans-serif;background:' + t.bg + ";border:1px solid " + t.border + ";border-radius:14px;padding:20px 22px;max-width:720px;margin:0 auto;\">" +
    '<h4 style="margin:0 0 4px;font-size:19px;line-height:1.3;color:' + t.text + ';">Welcome to Helium</h4>' +
    '<div style="font-size:12px;font-style:italic;color:' + t.accent + ';">September 5, 2026</div>' +
    '<div style="font-size:12px;color:' + t.muted + ';">By Dreamwalker</div>' +
    '<hr style="border:none;border-top:1px solid ' + t.border + ';margin:12px 0;" />' +
    '<p style="margin:0;font-size:14px;line-height:1.65;color:' + t.text + ';">Helium teaches how the Canvas API transforms data into visual output. Every fillRect and measureText call is visible in the runtime — explicit rendering, no framework magic.</p></div>',

  "blog-dark": (t) =>
    '<div data-helium-preview style="font-family:\'Segoe UI\',system-ui,sans-serif;background:#0f1518;border:2px solid #ffd60a;border-radius:14px;padding:20px 22px;max-width:720px;margin:0 auto;">' +
    '<h4 style="margin:0 0 4px;font-size:21px;line-height:1.3;color:#ffffff;font-weight:800;">Welcome to Helium</h4>' +
    '<div style="font-size:13px;font-style:italic;color:#ffd60a;">September 5, 2026</div>' +
    '<div style="font-size:13px;color:#b8c4ca;">By Dreamwalker</div>' +
    '<hr style="border:none;border-top:2px solid #ffd60a;margin:12px 0;" />' +
    '<p style="margin:0;font-size:15px;line-height:1.7;color:#e6f1f5;">High-contrast variant: the canvas renderer uses thicker strokes, larger type and a yellow accent so every pixel stays legible.</p></div>',

  "blog-minimal": (t) =>
    '<div data-helium-preview style="font-family:\'Segoe UI\',system-ui,sans-serif;background:#ffffff;border:1px solid #e2e2e2;border-radius:6px;padding:20px 22px;max-width:720px;margin:0 auto;">' +
    '<h4 style="margin:0 0 4px;font-size:18px;color:#111111;letter-spacing:.01em;">Welcome to Helium</h4>' +
    '<div style="font-size:11px;color:#666666;">SEPTEMBER 5, 2026 · BY DREAMWALKER</div>' +
    '<hr style="border:none;border-top:1px solid #111111;margin:13px 0;" />' +
    '<p style="margin:0;font-size:14px;line-height:1.7;color:#111111;">Black, white and nothing else. The minimal renderer drops accent colors entirely and lets typography do the talking.</p></div>',

  "blog-grid": (t) =>
    '<div data-helium-preview style="font-family:\'Segoe UI\',system-ui,sans-serif;display:grid;grid-template-columns:repeat(3,1fr);gap:10px;max-width:720px;margin:0 auto;">' +
    '<div style="background:' + t.bg + ';border:1px solid ' + t.border + ';border-radius:10px;padding:12px;"><div style="font-size:11px;color:' + t.accent + ';">SEP 5</div><div style="font-size:13px;font-weight:700;color:' + t.text + ';margin:4px 0;">Welcome to Helium</div><div style="font-size:11px;line-height:1.5;color:' + t.muted + ';">Helium teaches how the Canvas API transforms data…</div></div>' +
    '<div style="background:' + t.bg + ';border:1px solid ' + t.border + ';border-radius:10px;padding:12px;"><div style="font-size:11px;color:' + t.accent + ';">SEP 4</div><div style="font-size:13px;font-weight:700;color:' + t.text + ';margin:4px 0;">Understanding Canvas</div><div style="font-size:11px;line-height:1.5;color:' + t.muted + ';">Explicit pixel-level drawing, no framework magic…</div></div>' +
    '<div style="background:' + t.bg + ';border:1px solid ' + t.border + ';border-radius:10px;padding:12px;"><div style="font-size:11px;color:' + t.accent + ';">SEP 3</div><div style="font-size:13px;font-weight:700;color:' + t.text + ';margin:4px 0;">Data to Display</div><div style="font-size:11px;line-height:1.5;color:' + t.muted + ';">Every visual system follows Data → Rendering…</div></div></div>',

  "blog-timeline": (t) =>
    '<div data-helium-preview style="font-family:\'Segoe UI\',system-ui,sans-serif;position:relative;max-width:720px;margin:0 auto;padding:14px 0;">' +
    '<div style="position:absolute;left:50%;top:0;bottom:0;width:3px;background:' + t.accent + ';transform:translateX(-50%);"></div>' +
    '<div style="position:relative;width:44%;text-align:right;padding-right:18px;margin-bottom:18px;"><div style="display:inline-block;width:14px;height:14px;border-radius:9px;background:' + t.accent + ';position:absolute;right:-7px;top:2px;"></div><div style="font-size:13px;font-weight:700;color:' + t.text + ';">Welcome to Helium</div><div style="font-size:11px;color:' + t.muted + ';">Sep 5 · Dreamwalker</div></div>' +
    '<div style="position:relative;width:44%;margin-left:56%;padding-left:18px;margin-bottom:18px;"><div style="display:inline-block;width:14px;height:14px;border-radius:9px;background:' + t.accent + ';position:absolute;left:-7px;top:2px;"></div><div style="font-size:13px;font-weight:700;color:' + t.text + ';">Understanding Canvas</div><div style="font-size:11px;color:' + t.muted + ';">Sep 4 · Kit Secord</div></div>' +
    '<div style="position:relative;width:44%;text-align:right;padding-right:18px;"><div style="display:inline-block;width:14px;height:14px;border-radius:9px;background:' + t.accent + ';position:absolute;right:-7px;top:2px;"></div><div style="font-size:13px;font-weight:700;color:' + t.text + ';">Data to Display</div><div style="font-size:11px;color:' + t.muted + ';">Sep 3 · Bonnie A</div></div></div>',

  "blog-cardstack": (t) =>
    '<div data-helium-preview style="font-family:\'Segoe UI\',system-ui,sans-serif;position:relative;max-width:720px;height:190px;margin:0 auto;">' +
    '<div style="position:absolute;inset:0 34px 26px;background:' + t.card + ';border:1px solid ' + t.border + ';border-radius:12px;transform:translate(14px,14px);"></div>' +
    '<div style="position:absolute;inset:0 20px 14px;background:' + t.card + ';border:1px solid ' + t.border + ';border-radius:12px;transform:translate(7px,7px);"></div>' +
    '<div style="position:absolute;inset:0;background:' + t.card + ';border:1px solid ' + t.border + ';border-radius:12px;padding:18px 22px;box-shadow:0 8px 22px rgba(22,48,58,0.14);">' +
    '<div style="font-size:12px;font-weight:700;letter-spacing:.04em;color:' + t.accent + ';">LATEST POST</div>' +
    '<div style="font-size:18px;font-weight:700;color:' + t.text + ';margin:6px 0 2px;">Welcome to Helium</div>' +
    '<div style="font-size:12px;color:' + t.muted + ';">September 5, 2026 · By Dreamwalker</div>' +
    '<div style="font-size:13px;line-height:1.6;color:' + t.text + ';margin-top:10px;">Cards stack behind the current post — navigate with the controls and the deck slides forward.</div></div></div>',

  "blog-reader": (t) =>
    '<div data-helium-preview style="font-family:Georgia,\'Times New Roman\',serif;background:#faf8f3;color:#2c3e50;border:1px solid #ece4d8;border-radius:14px;padding:26px 28px;max-width:640px;margin:0 auto;text-align:center;">' +
    '<h4 style="margin:0 0 4px;font-size:26px;line-height:1.3;font-weight:700;">Welcome to Helium</h4>' +
    '<div style="font-size:13px;color:#8a8577;font-style:italic;margin-bottom:16px;">September 5, 2026 · By Dreamwalker</div>' +
    '<hr style="border:none;border-top:1px solid #d9cfbc;margin:0 0 18px;" />' +
    '<p style="margin:0;font-size:17px;line-height:1.9;text-align:left;">Helium teaches how the Canvas API transforms data into visual output. Large serif type, spacious leading and a warm paper background — distraction-free reading, rendered pixel by pixel.</p></div>',

  "blog-annotated": (t) =>
    '<div data-helium-preview style="font-family:\'Segoe UI\',system-ui,sans-serif;display:grid;grid-template-columns:1fr 1fr;max-width:760px;margin:0 auto;border:1px solid ' + t.border + ';border-radius:14px;overflow:hidden;">' +
    '<div style="background:' + t.bg + ';padding:18px;"><h4 style="margin:0 0 6px;font-size:17px;color:' + t.text + ';">Welcome to Helium</h4><p style="margin:0 0 8px;font-size:12px;line-height:1.6;color:' + t.muted + ';">Helium teaches how the Canvas API transforms data into visual output — one pixel at a time.</p><div style="font-size:11px;font-weight:700;color:' + t.accent + ';">DATA → PIXELS</div></div>' +
    '<div style="background:#12222b;color:#c9e3ee;padding:16px 18px;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:11px;line-height:1.7;overflow:hidden;">' +
    '{<br />' +
    '&nbsp;&nbsp;"title": "Welcome to Helium",<br />' +
    '&nbsp;&nbsp;"date": "September 5, 2026",<br />' +
    '&nbsp;&nbsp;"author": "Dreamwalker",<br />' +
    '&nbsp;&nbsp;"content": "Helium teaches how…"<br />' +
    '}</div></div>',
};

/* Static previews for the functional HTML-blog variants. The Design canvas and
   sidebar thumbnails run no block scripts, and visitors without JS keep these
   too — so they render real blog UI (search + filter + blade cards) using the
   seed posts, mirroring what the runtime will produce on a live page. */
function escHtml(s){return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}

const HTML_LIST_PREVIEW = (t) => buildHtmlBlogInner({ id: "blog-html-list", renderer: "html-list", type: "html" }, t);

const HTML_FULL_PREVIEW = (t) => buildHtmlBlogInner({ id: "blog-html-full", renderer: "html-full", type: "html" }, t);

const HTML_PREVIEWS = {
  "blog-html-list": HTML_LIST_PREVIEW,
  "blog-html-full": HTML_FULL_PREVIEW,
};

// ======================================================================
// HELIUM_JS — the shared browser runtime (extracted to js/helium-blog.js
// at export; kept inline in single-file previews). Written as plain string
// concatenation with NO template literals so it can live inside this
// template tag safely, and reads NO build-time state — everything comes
// from the DOM (data-helium-* attributes, the JSON seed, CSS variables),
// with the Zenero dashboard as its one dependency-free data source.
// The 8 renderers are the "define the teaching variants" payload from the
// Helium design: same posts, different explicit pixel-drawing approach.
// ======================================================================
const HELIUM_JS = `(function(){
"use strict";
/* Helium Blog runtime — Web Dojo <3 Zenero dashboard. */
function esc(s){var d=document.createElement("div");d.textContent=s==null?"":String(s);return d.innerHTML;}

/* ---- helpers ------------------------------------------------------- */
function readSeed(root){
  var el=root.querySelector("[data-helium-seed]");
  if(!el) return [];
  try{var a=JSON.parse(el.textContent||"[]");return Array.isArray(a)?a:[];}catch(e){return [];}
}

/* Page-theme sync: --helium-* overrides beat --fc-* (site) tokens, which
   beat font-lock defaults. Resolved at draw time so theme changes cascade. */
function palette(root){
  var cs=getComputedStyle(root);
  function v(name,fb){var s=cs.getPropertyValue(name);s=(s||"").trim();return s||fb;}
  return {
    accent:v("--helium-accent",v("--fc-accent",v("--fc-primary","#6366f1"))),
    text:  v("--helium-text",  v("--fc-text","#16303a")),
    bg:    v("--helium-bg",    v("--fc-bg",v("--wd-canvas-bg","#ffffff"))),
    card:  v("--helium-card",  v("--fc-surface","#ffffff")),
    muted: v("--helium-muted", v("--fc-muted","#5f7480")),
    border:v("--helium-border",v("--fc-border","#d4e0e6"))
  };
}

/* High-DPI sizing — canvas backing store scales by devicePixelRatio so
   text stays crisp on retina screens (2026 display standard). */
function setupCanvas(canvas){
  var dpr=window.devicePixelRatio||1;
  var rect=canvas.getBoundingClientRect();
  if(rect.width<2||rect.height<2) return null;
  canvas.width=Math.round(rect.width*dpr);
  canvas.height=Math.round(rect.height*dpr);
  var ctx=canvas.getContext("2d");
  if(!ctx) return null;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  return {ctx:ctx,w:rect.width,h:rect.height};
}

/* Word-wrap: measure each candidate line, store what fits, keep lines
   within the vertical budget. Explicit rendering, zero libraries. */
function wrapText(ctx,text,maxWidth,maxLines){
  var words=String(text||"").split(/\\s+/);
  var lines=[];var cur="";
  for(var i=0;i<words.length;i++){
    var w=words[i]; if(!w) continue;
    var test=cur?cur+" "+w:w;
    if(ctx.measureText(test).width>maxWidth&&cur){
      lines.push(cur);cur=w;
      if(lines.length>=maxLines) break;
    }else cur=test;
  }
  if(cur&&lines.length<maxLines) lines.push(cur);
  return lines;
}

/* ---- variant 1: classic ------------------------------------------------ */
function drawClassic(ctx,w,h,post,c){
  ctx.fillStyle=c.bg; ctx.fillRect(0,0,w,h);
  ctx.strokeStyle=c.accent; ctx.lineWidth=2; ctx.strokeRect(12,12,w-24,h-24);
  ctx.fillStyle=c.text; ctx.font="700 22px 'Segoe UI',system-ui,sans-serif";
  ctx.textAlign="left";
  var y=44; ctx.fillText(post.title,26,y);
  ctx.font="italic 13px 'Segoe UI',system-ui,sans-serif"; ctx.fillStyle=c.accent; y+=30;
  ctx.fillText(post.date,26,y);
  ctx.fillStyle=c.muted; ctx.font="13px 'Segoe UI',system-ui,sans-serif"; y+=19;
  ctx.fillText(byline(post),26,y);
  ctx.strokeStyle=c.border; ctx.lineWidth=1; y+=17; ctx.beginPath();
  ctx.moveTo(26,y); ctx.lineTo(w-26,y); ctx.stroke();
  ctx.font="15px 'Segoe UI',system-ui,sans-serif"; ctx.fillStyle=c.text; y+=30;
  var maxw=w-52, lh=23, budget=Math.max(1,Math.floor((h-y-14)/lh));
  var lines=wrapText(ctx,post.content,maxw,budget);
  for(var i=0;i<lines.length;i++){ctx.fillText(lines[i],26,y);y+=lh;}
}

/* ---- variant 2: dark (high contrast) ----------------------------------- */
function drawDark(ctx,w,h,post,c){
  ctx.fillStyle="#0f1518"; ctx.fillRect(0,0,w,h);
  ctx.strokeStyle="#ffd60a"; ctx.lineWidth=3; ctx.strokeRect(10,10,w-20,h-20);
  ctx.fillStyle="#ffffff"; ctx.font="800 26px 'Segoe UI',system-ui,sans-serif";
  ctx.textAlign="left";
  var y=48; ctx.fillText(post.title,24,y);
  ctx.font="italic 14px 'Segoe UI',system-ui,sans-serif"; ctx.fillStyle="#ffd60a"; y+=34;
  ctx.fillText(post.date,24,y);
  ctx.fillStyle="#b8c4ca"; ctx.font="14px 'Segoe UI',system-ui,sans-serif"; y+=22;
  ctx.fillText(byline(post),24,y);
  ctx.strokeStyle="#ffd60a"; ctx.lineWidth=2; y+=17; ctx.beginPath();
  ctx.moveTo(24,y); ctx.lineTo(w-24,y); ctx.stroke();
  ctx.font="16px 'Segoe UI',system-ui,sans-serif"; ctx.fillStyle="#e6f1f5"; y+=34;
  var maxw=w-48, lh=26, budget=Math.max(1,Math.floor((h-y-14)/lh));
  var lines=wrapText(ctx,post.content,maxw,budget);
  for(var i=0;i<lines.length;i++){ctx.fillText(lines[i],24,y);y+=lh;}
}

/* ---- variant 3: minimal (black & white) -------------------------------- */
function drawMinimal(ctx,w,h,post,c){
  ctx.fillStyle="#ffffff"; ctx.fillRect(0,0,w,h);
  ctx.fillStyle="#111111"; ctx.font="500 20px 'Segoe UI',system-ui,sans-serif";
  ctx.textAlign="left";
  var y=46; ctx.fillText(post.title,26,y);
  ctx.font="11px 'Segoe UI',system-ui,sans-serif"; ctx.fillStyle="#666666"; y+=24;
  ctx.fillText((post.date+(post.author?" · BY "+post.author:"")).toUpperCase(),26,y);
  ctx.fillStyle="#111111"; ctx.lineWidth=1; y+=16; ctx.beginPath();
  ctx.moveTo(26,y); ctx.lineTo(w-26,y); ctx.stroke();
  ctx.font="15px 'Segoe UI',system-ui,sans-serif"; y+=32;
  var maxw=w-52, lh=24, budget=Math.max(1,Math.floor((h-y-14)/lh));
  var lines=wrapText(ctx,post.content,maxw,budget);
  for(var i=0;i<lines.length;i++){ctx.fillText(lines[i],26,y);y+=lh;}
}

/* ---- variant 4: grid (multiple posts side by side) --------------------- */
function drawGrid(ctx,w,h,state){
  var posts=state.posts, idx=state.index, c=state.colors;
  ctx.fillStyle=c.bg; ctx.fillRect(0,0,w,h);
  var perPage=3;
  var start=Math.floor(idx/perPage)*perPage;
  var gap=12, pad=18;
  var colW=(w-pad*2-gap*(perPage-1))/perPage;
  for(var k=0;k<perPage;k++){
    var pi=start+k; if(pi<0||pi>=posts.length) continue;
    var p=posts[pi];
    var x=pad+k*(colW+gap), y=pad;
    var active=(pi===idx);
    ctx.fillStyle=active?c.card:"rgba(0,0,0,0)";
    ctx.strokeStyle=active?c.accent:c.border;
    ctx.lineWidth=active?2:1;
    ctx.beginPath();
    if(ctx.roundRect) ctx.roundRect(x,y,colW,h-40,12); else ctx.rect(x,y,colW,h-40);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle=c.accent; ctx.font="10px 'Segoe UI',system-ui,sans-serif";
    ctx.textAlign="left"; ctx.fillText((p.date||"").split(" ")[0].slice(0,9).toUpperCase(),x+10,y+16);
    ctx.fillStyle=c.text; ctx.font="700 13px 'Segoe UI',system-ui,sans-serif";
    // manual wrap for card titles too
    var tl=wrapText(ctx,p.title,colW-20,2);
    var ty=y+30; for(var i=0;i<tl.length;i++){ctx.fillText(tl[i],x+10,ty);ty+=16;}
    ctx.fillStyle=c.muted; ctx.font="11px 'Segoe UI',system-ui,sans-serif";
    var cl=wrapText(ctx,p.content,colW-20,5); ty+=6;
    for(var j=0;j<cl.length;j++){ctx.fillText(cl[j],x+10,ty);ty+=15;}
  }
}

/* ---- variant 5: timeline (center spine, alternating) ------------------- */
function drawTimeline(ctx,w,h,state){
  var posts=state.posts, idx=state.index, c=state.colors;
  ctx.fillStyle=c.bg; ctx.fillRect(0,0,w,h);
  var spineX=w/2;
  ctx.strokeStyle=c.accent; ctx.lineWidth=3; ctx.beginPath();
  ctx.moveTo(spineX,8); ctx.lineTo(spineX,h-12); ctx.stroke();
  var itemH=(h-24)/posts.length;
  for(var i=0;i<posts.length;i++){
    var p=posts[i];
    var cy=12+itemH*i+itemH/2;
    var isCur=(i===idx);
    var left=(i%2===0);
    var dotR=isCur?9:6;
    ctx.fillStyle=c.accent;
    ctx.beginPath(); ctx.arc(spineX,cy,dotR,0,Math.PI*2); ctx.fill();
    if(isCur){
      ctx.strokeStyle=c.accent; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.arc(spineX,cy,dotR+5,0,Math.PI*2); ctx.stroke();
    }
    var x=left?24:spineX+26;
    var maxw=spineX-50;
    ctx.fillStyle=c.text; ctx.font=isCur?"700 13px 'Segoe UI',system-ui,sans-serif":"12px 'Segoe UI',system-ui,sans-serif";
    ctx.textAlign=left?"left":"left";
    ctx.fillText(p.title,x,cy-6);
    ctx.fillStyle=c.muted; ctx.font="10px 'Segoe UI',system-ui,sans-serif";
    ctx.fillText((p.date+(p.author?" · "+p.author:"")),x,cy+10);
    if(isCur){
      ctx.fillStyle=c.muted; ctx.font="10px 'Segoe UI',system-ui,sans-serif";
      var cl=wrapText(ctx,p.content,maxw,2);
      var ty=cy+24;
      for(var j=0;j<cl.length;j++){ctx.fillText(cl[j],x,ty);ty+=13;}
    }
  }
}

/* ---- variant 6: card stack (deck behind the front card) ---------------- */
function drawCardstack(ctx,w,h,post,c){
  ctx.fillStyle=c.bg; ctx.fillRect(0,0,w,h);
  var cx=22, cy=18, cw=w-24, chh=h-30;
  for(var d=2;d>=0;d--){
    ctx.fillStyle=d===0?c.card:c.card;
    ctx.globalAlpha=d===0?1:0.55-d*0.1;
    ctx.strokeStyle=c.border; ctx.lineWidth=d===0?2:1;
    ctx.beginPath();
    if(ctx.roundRect) ctx.roundRect(cx-d*10,cy-d*10,cw,chh,12); else ctx.rect(cx-d*10,cy-d*10,cw,chh);
    ctx.fill(); ctx.stroke();
    ctx.globalAlpha=1;
  }
  // front card content
  ctx.fillStyle=c.accent; ctx.font="700 11px 'Segoe UI',system-ui,sans-serif";
  ctx.textAlign="left"; ctx.fillText("LATEST POST",cx+20,cy+28);
  ctx.fillStyle=c.text; ctx.font="700 22px 'Segoe UI',system-ui,sans-serif";
  // manual title wrap for the front card
  var tl=wrapText(ctx,post.title,cw-40,2);
  var ty=cy+52; for(var i=0;i<tl.length;i++){ctx.fillText(tl[i],cx+20,ty);ty+=26;}
  ctx.fillStyle=c.muted; ctx.font="12px 'Segoe UI',system-ui,sans-serif";
  ctx.fillText(post.date+(post.author?" · By "+post.author:""),cx+20,ty+6);
  ctx.fillStyle=c.text; ctx.font="15px 'Segoe UI',system-ui,sans-serif";
  var cl=wrapText(ctx,post.content,cw-40,Math.floor((h-(ty+30))/20));
  var cty=ty+34; for(var j=0;j<cl.length;j++){ctx.fillText(cl[j],cx+20,cty);cty+=20;}
}

/* ---- variant 7: reader (large serif, distraction-free) ----------------- */
function drawReader(ctx,w,h,post,c){
  ctx.fillStyle="#faf8f3"; ctx.fillRect(0,0,w,h);
  var lx=w*0.12, rw=w*0.76;
  ctx.fillStyle="#2c3e50"; ctx.font="700 30px Georgia,'Times New Roman',serif";
  ctx.textAlign="center";
  var tl=wrapText(ctx,post.title,rw,2);
  var ty=52; for(var i=0;i<tl.length;i++){ctx.fillText(tl[i],w/2,ty);ty+=38;}
  ctx.font="italic 13px Georgia,serif"; ctx.fillStyle="#8a8577";
  ctx.fillText(post.date+(post.author?" · By "+post.author:""),w/2,ty+6);
  // divider
  var dy=ty+26;
  ctx.strokeStyle="#d9cfbc"; ctx.lineWidth=1; ctx.beginPath();
  ctx.moveTo(w/2-60,dy); ctx.lineTo(w/2+60,dy); ctx.stroke();
  ctx.font="17px Georgia,'Times New Roman',serif"; ctx.fillStyle="#2c3e50";
  ctx.textAlign="left";
  var lh=30, budget=Math.max(1,Math.floor((h-(dy+30))/lh));
  var cl=wrapText(ctx,post.content,rw,budget);
  var cty=dy+44; for(var j=0;j<cl.length;j++){ctx.fillText(cl[j],lx,cty);cty+=lh;}
}

/* ---- variant 8: annotated (rendered post ↔ data side by side) ---------- */
function drawAnnotated(ctx,w,h,post,c){
  // LEFT: rendered post card
  ctx.fillStyle=c.bg; ctx.fillRect(0,0,w,h);
  var mid=w/2;
  ctx.fillStyle=c.card; ctx.fillRect(10,10,mid-20,h-20);
  ctx.strokeStyle=c.border; ctx.lineWidth=1; ctx.strokeRect(10,10,mid-20,h-20);
  ctx.fillStyle=c.text; ctx.font="700 17px 'Segoe UI',system-ui,sans-serif";
  ctx.textAlign="left";
  var tl=wrapText(ctx,post.title,mid-44,3);
  var ty=34; for(var i=0;i<tl.length;i++){ctx.fillText(tl[i],22,ty);ty+=22;}
  ctx.fillStyle=c.accent; ctx.font="700 10px 'Segoe UI',system-ui,sans-serif";
  ctx.fillText("DATA → PIXELS",22,ty+14);
  ctx.fillStyle=c.muted; ctx.font="11px 'Segoe UI',system-ui,sans-serif";
  var cl=wrapText(ctx,post.content,mid-44,Math.floor((h-(ty+26))/15));
  var cty=ty+32; for(var j=0;j<cl.length;j++){ctx.fillText(cl[j],22,cty);cty+=15;}
  // RIGHT: the data behind the pixels (a simplified JSON view)
  ctx.fillStyle="#12222b"; ctx.fillRect(mid+10,10,w-mid-20,h-20);
  ctx.fillStyle="#c9e3ee"; ctx.font="11px ui-monospace,SFMono-Regular,Consolas,monospace";
  var lines=[
    "{",
    "  title: "+JSON.stringify(post.title||"")+",",
    "  date: "+JSON.stringify(post.date||"")+",",
  ];
  if(post.author) lines.push("  author: "+JSON.stringify(post.author)+",");
  else lines.push("  // author: not set (Zenero posts)");
  lines.push("  content: "+JSON.stringify((post.content||"").slice(0,40)+"…"));
  lines.push("}");
  var ly=30;
  for(var k=0;k<lines.length;k++){ctx.fillText(lines[k],mid+24,ly);ly+=18;}
  ctx.fillStyle="#7da8bd"; ctx.font="10px ui-monospace,Consolas,monospace";
  ctx.fillText("/* this is the data being drawn */",mid+24,h-22);
}

/* Empty state — explicitly points at the Zenero dashboard so the tandem is
   discoverable: blog posts are authored there (Blog tab → /blog_posts). */
function drawEmpty(ctx,w,h,c){
  ctx.fillStyle=c.bg; ctx.fillRect(0,0,w,h);
  ctx.fillStyle=c.muted; ctx.font="15px 'Segoe UI',system-ui,sans-serif";
  ctx.textAlign="center";
  ctx.fillText("No blog posts yet.",w/2,h/2-12);
  ctx.font="12px 'Segoe UI',system-ui,sans-serif";
  ctx.fillText("Publish posts from the Zenero dashboard → Blog tab.",w/2,h/2+14);
  ctx.textAlign="left";
}

/* Dispatch current state to the variant's renderer. */
function drawFrame(canvas,state){
  var sc=setupCanvas(canvas);
  if(!sc) return;
  var ctx=sc.ctx, w=sc.w, h=sc.h;
  ctx.clearRect(0,0,w,h);
  if(!state.posts.length){drawEmpty(ctx,w,h,state.colors);return;}
  var post=state.posts[state.index];
  switch(state.variant){
    case "dark": drawDark(ctx,w,h,post,state.colors); break;
    case "minimal": drawMinimal(ctx,w,h,post,state.colors); break;
    case "grid": drawGrid(ctx,w,h,state); break;
    case "timeline": drawTimeline(ctx,w,h,state); break;
    case "cardstack": drawCardstack(ctx,w,h,post,state.colors); break;
    case "reader": drawReader(ctx,w,h,post,state.colors); break;
    case "annotated": drawAnnotated(ctx,w,h,post,state.colors); break;
    default: drawClassic(ctx,w,h,post,state.colors);
  }
}

/* ------------------------------------------------------------------------
   Widget lifecycle: one root <section> per widget. All reads (posts, theme,
   variant, project id) come from the DOM so the SAME runtime string runs in
   every copy of the block and across every page.
   ------------------------------------------------------------------------ */
var THEME_PRESETS=[
  {accent:"#00b7ff",text:"#16303a",bg:"#ffffff",card:"#ffffff",muted:"#5f7480",border:"#d4e0e6"},
  {accent:"#ffd60a",text:"#ffffff",bg:"#0f1518",card:"#172127",muted:"#93a8b4",border:"#2a3a42"},
  {accent:"#000000",text:"#111111",bg:"#ffffff",card:"#f6f6f6",muted:"#666666",border:"#cccccc"},
  {accent:"#e74c3c",text:"#2c3e50",bg:"#fef5e7",card:"#ffffff",muted:"#7f8c8d",border:"#f0e2ce"}
];
var THEME_VARS=["--helium-accent","--helium-text","--helium-bg","--helium-card","--helium-muted","--helium-border"];

/* ---- Zenero tandem: post normalization ---------------------------------
   The Zenero dashboard's Blog tab stores posts as {id, title, content_html,
   excerpt, keywords, hashtags, featured_image, published_at} (see
   backend/models/zenero.py::BlogPost). The Helium renderers draw
   {title, date, author, content}. normalizePost() bridges the two shapes so
   anything authored in the dashboard paints correctly: published_at becomes
   a readable date and content_html becomes plain text for fillText (canvas
   draws text literally, so no markup from the rich-text editor can ever
   inject). Seed posts flow through the same function, so every renderer
   only ever sees ONE post shape. */
function fmtDate(iso){
  if(!iso) return "";
  var d=new Date(iso);
  if(isNaN(d.getTime())) return String(iso); // seed posts already carry readable dates
  return d.toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});
}
function htmlToText(html){
  var d=document.createElement("div");
  d.innerHTML=html||"";
  var styled=d.querySelectorAll("[style]");
  for(var i=0;i<styled.length;i++) styled[i].removeAttribute("style");
  var bad=d.querySelectorAll("style,script");
  for(var j=0;j<bad.length;j++) bad[j].remove();
  return (d.textContent||"").replace(/\\s+/g," ").trim();
}
function byline(post){ return post.author?("By "+post.author):""; }
function normalizePost(p){
  if(!p||typeof p!=="object") return null;
  var content=p.content||htmlToText(p.content_html)||p.excerpt||"";
  return {
    id: p.id||"",
    title: p.title||"Untitled",
    date: fmtDate(p.published_at||p.date),
    author: p.author||"",
    excerpt: p.excerpt||(content.length>160?content.slice(0,160).replace(/\\s+\\S*$/,"")+"…":content),
    content: content,
    image: p.image||p.featured_image||"",
    // Zenero BlogPost has keywords/hashtags but no category field — derive a
    // category for the filter dropdown from whichever is present.
    category: p.category||(p.keywords||"").split(",")[0].trim()||(p.hashtags||"").split(/[,\s]+/)[0].replace(/^#/,"")||""
  };
}

/* =====================================================================
   HTML BLOG RENDERERS — the functional blog counterpart.
   Reads the same /api/{pid}/blog_posts collection as the canvas
   renderers, but renders real accessible DOM: search + category
   filter + blade cards + inline full-post expansion. No canvas.
   ===================================================================== */

function htmlEscape(s){
  return String(s==null?"":s)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#39;");
}

/* Build the outer chrome (search + filter + containers) once. */
function buildBlogChrome(root, state){
  var t=state.colors;
  var searchWrap=document.createElement("div");
  searchWrap.setAttribute("data-helium-blog-search","");
  searchWrap.style.cssText="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;";
  var searchInput=document.createElement("input");
  searchInput.type="search";
  searchInput.setAttribute("aria-label","Search posts by title or excerpt");
  searchInput.placeholder="Search posts…";
  searchInput.style.cssText="flex:1;min-width:180px;padding:9px 12px;border:1px solid "+t.border+";border-radius:9px;font-size:14px;background:"+t.bg+";color:"+t.text+";outline:none;";
  var catSelect=document.createElement("select");
  catSelect.setAttribute("aria-label","Filter posts by category");
  catSelect.style.cssText="padding:9px 12px;border:1px solid "+t.border+";border-radius:9px;font-size:14px;background:"+t.bg+";color:"+t.text+";outline:none;cursor:pointer;";
  searchWrap.appendChild(searchInput);
  searchWrap.appendChild(catSelect);
  var postsGrid=document.createElement("div");
  postsGrid.setAttribute("data-helium-blog-posts","");
  postsGrid.setAttribute("role","list");
  postsGrid.style.cssText="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;";
  var fullWrap=document.createElement("div");
  fullWrap.setAttribute("data-helium-blog-full","");
  fullWrap.style.display="none";
  var blogRoot=document.createElement("div");
  blogRoot.style.cssText="max-width:880px;margin:0 auto;font-family:inherit;";
  blogRoot.appendChild(searchWrap);
  blogRoot.appendChild(postsGrid);
  blogRoot.appendChild(fullWrap);
  root.appendChild(blogRoot);
  return {searchInput:searchInput,catSelect:catSelect,postsGrid:postsGrid,fullWrap:fullWrap,blogRoot:blogRoot};
}

/* Populate the category dropdown from the posts' derived categories. */
function populateCategories(catSelect, posts){
  var cats=[];
  posts.forEach(function(p){ if(p.category&&cats.indexOf(p.category)<0) cats.push(p.category); });
  catSelect.innerHTML="";
  var allOpt=document.createElement("option");
  allOpt.value=""; allOpt.textContent="All Categories";
  catSelect.appendChild(allOpt);
  cats.sort().forEach(function(c){
    var opt=document.createElement("option");
    opt.value=c; opt.textContent=c;
    catSelect.appendChild(opt);
  });
}

/* A single blade-shaped post card (image + title + excerpt + date + cat). */
function renderBlogCard(post, state){
  var t=state.colors;
  var card=document.createElement("div");
  card.setAttribute("role","listitem");
  card.setAttribute("data-helium-blog-id",post.id);
  card.style.cssText="display:flex;flex-direction:column;background:"+t.card+";border:1px solid "+t.border+";border-radius:12px;overflow:hidden;cursor:pointer;transition:transform .15s ease,box-shadow .15s ease;";
  card.onmouseover=function(){card.style.transform="translateY(-3px)";card.style.boxShadow="0 6px 18px rgba(0,0,0,0.10)";};
  card.onmouseout=function(){card.style.transform="";card.style.boxShadow="";};
  if(post.image){
    var img=document.createElement("img");
    img.src=post.image; img.alt=""; img.loading="lazy";
    img.style.cssText="width:100%;height:160px;object-fit:cover;display:block;";
    card.appendChild(img);
  } else {
    var ph=document.createElement("div");
    ph.style.cssText="width:100%;height:160px;background:linear-gradient(135deg,"+t.accent+","+t.text+");opacity:0.85;";
    card.appendChild(ph);
  }
  var body=document.createElement("div");
  body.style.cssText="padding:14px 16px;display:flex;flex-direction:column;flex:1;";
  if(post.category){
    var tag=document.createElement("span");
    tag.textContent=post.category;
    tag.style.cssText="align-self:flex-start;font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:"+t.accent+";margin-bottom:6px;";
    body.appendChild(tag);
  }
  var title=document.createElement("h3");
  title.textContent=post.title;
  title.style.cssText="margin:0 0 6px;font-size:17px;line-height:1.3;font-weight:700;color:"+t.text+";";
  body.appendChild(title);
  var excerpt=document.createElement("p");
  excerpt.textContent=post.excerpt||(post.content||"").slice(0,140);
  excerpt.style.cssText="margin:0 0 10px;font-size:13px;line-height:1.55;color:"+t.muted+";flex:1;";
  body.appendChild(excerpt);
  var footer=document.createElement("div");
  footer.style.cssText="display:flex;justify-content:space-between;align-items:center;font-size:12px;color:"+t.muted+";";
  var dateSpan=document.createElement("span");
  dateSpan.textContent=post.date||"";
  var readMore=document.createElement("span");
  readMore.textContent="Read more →";
  readMore.style.cssText="color:"+t.accent+";font-weight:600;";
  footer.appendChild(dateSpan);
  footer.appendChild(readMore);
  body.appendChild(footer);
  card.appendChild(body);
  return card;
}

/* Full-post view with a back button. */
function renderFullPost(post, state, onBack){
  var t=state.colors;
  var wrap=document.createElement("div");
  wrap.style.cssText="background:"+t.card+";border:1px solid "+t.border+";border-radius:12px;overflow:hidden;";
  if(post.image){
    var img=document.createElement("img");
    img.src=post.image; img.alt=""; img.loading="lazy";
    img.style.cssText="width:100%;max-height:320px;object-fit:cover;display:block;";
    wrap.appendChild(img);
  }
  var body=document.createElement("div");
  body.style.cssText="padding:22px 24px;";
  var back=document.createElement("button");
  back.textContent="← Back to posts";
  back.style.cssText="background:none;border:0;padding:0 0 14px 0;font-size:13px;font-weight:600;color:"+t.accent+";cursor:pointer;";
  back.onclick=onBack;
  body.appendChild(back);
  if(post.category){
    var tag=document.createElement("div");
    tag.textContent=post.category;
    tag.style.cssText="font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:"+t.accent+";margin-bottom:8px;";
    body.appendChild(tag);
  }
  var title=document.createElement("h2");
  title.textContent=post.title;
  title.style.cssText="margin:0 0 6px;font-size:24px;line-height:1.3;font-weight:700;color:"+t.text+";";
  body.appendChild(title);
  var meta=document.createElement("div");
  meta.style.cssText="font-size:13px;color:"+t.muted+";margin-bottom:18px;";
  var parts=[];
  if(post.date) parts.push(post.date);
  if(post.author) parts.push("By "+post.author);
  meta.textContent=parts.join("  ·  ");
  body.appendChild(meta);
  var content=document.createElement("div");
  content.style.cssText="font-size:15px;line-height:1.75;color:"+t.text+";";
  (post.content||"").split(/\\n\\s*\\n/).forEach(function(para){
    var p=document.createElement("p");
    p.style.margin="0 0 14px 0";
    p.textContent=para.replace(/\\s+/g," ").trim();
    if(p.textContent) content.appendChild(p);
  });
  body.appendChild(content);
  wrap.appendChild(body);
  return wrap;
}

/* Main render: filter posts by search + category, paint cards. */
function renderBlog(root, state){
  var chrome=state.blogChrome;
  var term=(state.searchTerm||"").toLowerCase();
  var cat=state.filterCategory||"";
  var filtered=state.posts.filter(function(p){
    if(cat && p.category!==cat) return false;
    if(term){
      var hay=(p.title+" "+(p.excerpt||"")+" "+(p.content||"")).toLowerCase();
      if(hay.indexOf(term)<0) return false;
    }
    return true;
  });
  chrome.fullWrap.style.display="none";
  chrome.postsGrid.style.display="";
  chrome.postsGrid.innerHTML="";
  if(filtered.length===0){
    var empty=document.createElement("div");
    empty.style.cssText="grid-column:1/-1;text-align:center;padding:40px 20px;color:"+state.colors.muted+";font-size:14px;";
    empty.textContent=term||cat ? "No posts match your search." : "No posts yet — add one in the Zenero dashboard's Blog tab.";
    chrome.postsGrid.appendChild(empty);
    return;
  }
  filtered.forEach(function(post){
    var card=renderBlogCard(post, state);
    card.onclick=function(){ showFullPost(root, state, post); };
    chrome.postsGrid.appendChild(card);
  });
}

function showFullPost(root, state, post){
  var chrome=state.blogChrome;
  chrome.postsGrid.style.display="none";
  chrome.fullWrap.innerHTML="";
  chrome.fullWrap.appendChild(renderFullPost(post, state, function(){
    chrome.fullWrap.style.display="none";
    chrome.postsGrid.style.display="";
  }));
  chrome.fullWrap.style.display="";
  chrome.fullWrap.setAttribute("tabindex","-1");
  chrome.fullWrap.focus();
}

/* Entry point for the html-list / html-full variants. */
function initHtmlBlog(root, state){
  if(root.getAttribute("data-helium-html-init")) return;
  root.setAttribute("data-helium-html-init","1");

  // html-full shows the latest post open by default; html-list shows the grid.
  var startFull = state.variant==="html-full" && state.posts.length>0;

  // Reuse the DOM surface the static preview already rendered (Design canvas
  // + no-JS fallback shows the same markup). We just clear the sample cards
  // and wire the live handlers — no duplication, preview IS the surface.
  var searchInput=root.querySelector("[data-helium-search-input]");
  var catSelect=root.querySelector("[data-helium-category-filter]");
  var postsGrid=root.querySelector("[data-helium-blog-posts]");
  var fullWrap=root.querySelector("[data-helium-blog-full]");
  if(postsGrid) postsGrid.innerHTML="";
  state.blogChrome = {searchInput:searchInput,catSelect:catSelect,postsGrid:postsGrid,fullWrap:fullWrap,blogRoot:postsGrid?postsGrid.parentNode:root};
  if(catSelect) populateCategories(catSelect, state.posts);

  var pid=root.getAttribute("data-forge-project-id")||window.__WD_PROJECT_ID||"";

  // Wire search + filter.
  state.blogChrome.searchInput.addEventListener("input",function(){
    state.searchTerm=this.value;
    renderBlog(root,state);
  });
  state.blogChrome.catSelect.addEventListener("change",function(){
    state.filterCategory=this.value;
    renderBlog(root,state);
  });

  // Pull live posts from the same Zenero collection the dashboard authors.
  if(pid){
    fetch("/api/"+pid+"/blog_posts").then(function(r){return r.json()}).then(function(data){
      var incoming=(data.blog_posts||[]).map(normalizePost).filter(Boolean);
      if(incoming.length){
        state.posts=incoming;
        state.index=0;
        populateCategories(state.blogChrome.catSelect, state.posts);
        if(startFull){ showFullPost(root,state,state.posts[0]); }
        else { renderBlog(root,state); }
      }
    }).catch(function(){ /* keep seed posts on API failure */ });
  }

  if(startFull){
    showFullPost(root,state,state.posts[0]);
  } else {
    renderBlog(root,state);
  }
}

function initWidget(root){
  if(root.getAttribute("data-helium-init")) return;
  root.setAttribute("data-helium-init","1");

  var state={
    posts: readSeed(root).map(normalizePost).filter(Boolean),
    index: 0,
    // data-helium-variant carries the renderer name (classic/dark/…).
    variant: (root.getAttribute("data-helium-variant")||"classic").toLowerCase(),
    colors: palette(root)
  };
  var variants=["classic","dark","minimal","grid","timeline","cardstack","reader","annotated"];
  var htmlVariants=["html-list","html-full"];
  if(htmlVariants.indexOf(state.variant)>=0){
    initHtmlBlog(root, state);
    return;
  }
  if(variants.indexOf(state.variant)<0) state.variant="classic";

  var canvas=root.querySelector("canvas[data-helium-canvas]");
  var preview=root.querySelector("[data-helium-preview]");
  var live=root.querySelector("[data-helium-live]");
  var idxEl=root.querySelector("[data-helium-index]");
  var totalEl=root.querySelector("[data-helium-total]");
  var prevBtn=root.querySelector("[data-helium-prev]");
  var nextBtn=root.querySelector("[data-helium-next]");
  var themeBtn=root.querySelector("[data-helium-theme]");
  var pid=root.getAttribute("data-forge-project-id")||window.__WD_PROJECT_ID||"";

  /* Swap the static preview for the real canvas (progressive enhancement —
     no-JS visitors keep the readable static preview). */
  function activateCanvas(){
    if(preview) preview.style.display="none";
    if(canvas){canvas.style.display="block";canvas.style.width="100%";}
  }

  function clamp(i){
    if(!state.posts.length) return 0;
    return ((i%state.posts.length)+state.posts.length)%state.posts.length;
  }

  function updateCounter(){
    if(idxEl) idxEl.textContent=String(state.index+1);
    if(totalEl) totalEl.textContent=String(state.posts.length);
  }

  /* Accessibility: mirror every painted post as text for screen readers.
     textContent only — never innerHTML — so API post bodies can never
     inject markup (the security rule the dashboards advocate too). */
  function updateLive(){
    if(!live) return;
    var p=state.posts[state.index]||{};
    var out=live.querySelector("[data-helium-fallback-title]");
    if(out) out.textContent=p.title||"";
    out=live.querySelector("[data-helium-fallback-date]");
    if(out) out.textContent=p.date||"";
    out=live.querySelector("[data-helium-fallback-author]");
    if(out) out.textContent=p.author?("By "+p.author):"";
    out=live.querySelector("[data-helium-fallback-content]");
    if(out) out.textContent=p.content||"";
  }

  function render(){
    activateCanvas();
    state.colors=palette(root);   // re-read theme every draw (theme sync)
    drawFrame(canvas,state);
    updateCounter();
    updateLive();
    if(canvas) canvas.setAttribute("aria-label",
      "Canvas-rendered blog post: "+(state.posts[state.index]||{}).title+". Use the buttons to navigate.");
  }

  function prev(){ if(!state.posts.length) return; state.index=clamp(state.index-1); render(); }
  function next(){ if(!state.posts.length) return; state.index=clamp(state.index+1); render(); }

  if(prevBtn) prevBtn.addEventListener("click",prev);
  if(nextBtn) nextBtn.addEventListener("click",next);

  /* Cycle Theme: steps the four presets as --helium-* overrides; the step
     after the last one syncs BACK to the page theme (clears overrides). */
  var themeStep=0;
  if(themeBtn) themeBtn.addEventListener("click",function(){
    themeStep++;
    if(themeStep<4){
      var p=THEME_PRESETS[themeStep-1];
      root.style.setProperty("--helium-accent",p.accent);
      root.style.setProperty("--helium-text",p.text);
      root.style.setProperty("--helium-bg",p.bg);
      root.style.setProperty("--helium-card",p.card);
      root.style.setProperty("--helium-muted",p.muted);
      root.style.setProperty("--helium-border",p.border);
      themeBtn.setAttribute("aria-label","Color theme: "+p.name+". Click again to keep cycling, or once more to return to the page theme.");
    }else{
      themeStep=0;
      for(var i=0;i<THEME_VARS.length;i++) root.style.removeProperty(THEME_VARS[i]);
    }
    render();
  });

  /* Keyboard accessibility: arrow keys navigate the most recently focused
     widget — hijacking arrows for every widget at once would be confusing. */
  var focused=false;
  if(root.addEventListener) root.addEventListener("focusin",function(){focused=true;});
  root.addEventListener("keydown",function(e){
    if(!focused&&e.key!=="Tab") return;
    if(e.key==="ArrowLeft"){e.preventDefault();prev();}
    else if(e.key==="ArrowRight"){e.preventDefault();next();}
  });

  /* Responsive: re-paint on resize, throttled to one paint per frame. */
  var rafPending=false;
  window.addEventListener("resize",function(){
    if(rafPending) return;
    rafPending=true;
    requestAnimationFrame(function(){rafPending=false;if(root.isConnected) drawFrame(canvas,state);});
  });

  /* Data layer: pull live posts from the Zenero dashboard's Blog tab. The
     seed keeps sample content visible meanwhile; on failure we stay with it
     so a dead network never blanks the widget. */
  render();
  if(pid){
    fetch("/api/"+encodeURIComponent(pid)+"/blog_posts",{headers:{"Accept":"application/json"}})
      .then(function(r){return r.ok?r.json():Promise.reject(new Error("HTTP "+r.status));})
      .then(function(data){
        var posts=((data&&data.blog_posts)||[]).map(normalizePost).filter(Boolean);
        if(posts.length){state.posts=posts;state.index=clamp(state.index);render();}
      })
      .catch(function(){ /* keep seed */ });
  }
}

function init(){
  var roots=document.querySelectorAll("[data-helium='blog']:not([data-helium-init])");
  for(var i=0;i<roots.length;i++) initWidget(roots[i]);
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init); else init();
})();`;

// Builds one Helium block's HTML. `variantId` selects which of the 8 canvas
// renderers the runtime draws with, and which matching static preview the
// Design canvas shows (same data, different explicit-pixel approach — the
// Helium teaching payoff).
// Builds the inner HTML for an HTML-blog variant (search + category filter +
// sample cards + full-post wrap). This same markup is what the Design canvas
// and no-JS visitors see; on a live page the runtime reads these elements
// back and wires them up with live data — so the preview IS the surface.
function buildHtmlBlogInner(variant, tokens){
  var t = tokens;
  var cards = "";
  HELIUM_FALLBACK_POSTS.slice(0,3).forEach(function(p){
    cards +=
      '<div role="listitem" data-helium-blog-id="' + escHtml(p.id) + '" style="display:flex;flex-direction:column;background:' + t.card + ';border:1px solid ' + t.border + ';border-radius:12px;overflow:hidden;">' +
        (p.image ? '<img src="' + escHtml(p.image) + '" alt="" loading="lazy" style="width:100%;height:160px;object-fit:cover;display:block;">' : '<div style="width:100%;height:160px;background:linear-gradient(135deg,' + t.accent + ',' + t.text + ');opacity:0.85;"></div>') +
        '<div style="padding:14px 16px;">' +
          (p.category ? '<span style="align-self:flex-start;font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:' + t.accent + ';margin-bottom:6px;">' + escHtml(p.category) + '</span>' : '') +
          '<h3 style="margin:0 0 6px;font-size:17px;line-height:1.3;font-weight:700;color:' + t.text + ';">' + escHtml(p.title) + '</h3>' +
          '<p style="margin:0 0 10px;font-size:13px;line-height:1.55;color:' + t.muted + ';">' + escHtml(p.excerpt || (p.content||"").slice(0,140)) + '</p>' +
          '<div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;color:' + t.muted + ';"><span>' + escHtml(p.date||"") + '</span><span style="color:' + t.accent + ';font-weight:600;">Read more →</span></div>' +
        '</div>' +
      '</div>';
  });
  var cats = [];
  HELIUM_FALLBACK_POSTS.forEach(function(p){ if(p.category && cats.indexOf(p.category)<0) cats.push(p.category); });
  var catOpts = '<option value="">All Categories</option>';
  cats.sort().forEach(function(c){ catOpts += '<option value="' + escHtml(c) + '">' + escHtml(c) + '</option>'; });
  return (
    '<div data-helium-blog-search style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;">' +
      '<input type="search" data-helium-search-input aria-label="Search posts by title or excerpt" placeholder="Search posts…" style="flex:1;min-width:180px;padding:9px 12px;border:1px solid ' + t.border + ';border-radius:9px;font-size:14px;background:' + t.bg + ';color:' + t.text + ';outline:none;font-family:inherit;" />' +
      '<select data-helium-category-filter aria-label="Filter posts by category" style="padding:9px 12px;border:1px solid ' + t.border + ';border-radius:9px;font-size:14px;background:' + t.bg + ';color:' + t.text + ';outline:none;cursor:pointer;min-width:140px;font-family:inherit;">' + catOpts + '</select>' +
    '</div>' +
    '<div data-helium-blog-posts role="list" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;">' + cards + '</div>' +
    '<div data-helium-blog-full style="display:none;"></div>' +
    '<div data-helium-live aria-live="polite" style="' + SR_ONLY + '">' +
      '<span data-helium-fallback-title>Welcome to Helium</span>' +
    '</div>'
  );
}

export const buildHeliumBlockHtml = (variantId) => {
  const variant = HELIUM_VARIANTS.find((v) => v.id === variantId) || HELIUM_VARIANTS[0];
  const tokens = HELIUM_TOKENS;
  const isHtml = variant.type === "html";
  const preview = (isHtml
    ? (HTML_PREVIEWS[variant.id] || (() => ""))
    : (PREVIEWS[variant.id] || PREVIEWS["blog-classic"]))(tokens);

  // HTML variants render real accessible DOM (search/filter/cards/full-post);
  // canvas variants render a pixel canvas with prev/next/theme controls.
  var body;
  if (isHtml) {
    // Static preview — what the Design canvas, sidebar thumbnails, and
    // no-JS visitors see. On a live page the runtime reads these same
    // elements back and wires them up with live data from the Zenero API.
    body = preview +
      '<script type="application/json" data-helium-seed>' + HELIUM_FALLBACK_POSTS_JSON + '</script>';
  } else {
    // Taller canvas for the layouts that render multiple posts at once.
    const canvasHeight =
      variant.renderer === "grid" || variant.renderer === "timeline" ? 470
      : variant.renderer === "annotated" ? 300
      : 440;
    body =
      preview +
      '<canvas data-helium-canvas tabindex="0" role="img" ' +
        'aria-label="Canvas-rendered blog post; use the buttons below to navigate." ' +
        'style="display:none;width:100%;height:' + canvasHeight + 'px;border-radius:14px;"></canvas>' +
      '<div data-helium-controls style="' + CONTROL_STYLES + '">' +
        '<button data-helium-prev type="button" aria-label="Show previous blog post" style="' + BUTTON_STYLES(tokens) + '">\u2190 Previous Post</button>' +
        '<span data-helium-counter style="font-size:13px;font-weight:600;">Post ' +
          '<span data-helium-index>1</span> of <span data-helium-total>' + HELIUM_FALLBACK_POSTS.length + '</span></span>' +
        '<button data-helium-next type="button" aria-label="Show next blog post" style="' + BUTTON_STYLES(tokens) + '">Next Post \u2192</button>' +
        '<button data-helium-theme type="button" aria-label="Cycle through color themes, then sync back to the page theme" style="' + BUTTON_STYLES(tokens) + '">Cycle Theme</button>' +
      '</div>' +
      '<div data-helium-live aria-live="polite" style="' + SR_ONLY + '">' +
        '<span data-helium-fallback-title>Welcome to Helium</span> \u00b7 ' +
        '<span data-helium-fallback-date>September 5, 2026</span> \u00b7 ' +
        '<span data-helium-fallback-author>By Dreamwalker</span> \u00b7 ' +
        '<span data-helium-fallback-content>Helium teaches how the Canvas API transforms data into visual output.</span>' +
      '</div>' +
      '<script type="application/json" data-helium-seed>' + HELIUM_FALLBACK_POSTS_JSON + '</script>';
  }

  // The shared runtime. The exporter pulls it into js/helium-blog.js
  // (one file, deduplicated across all sibling blocks). For HTML variants
  // the runtime reads the DOM surface above and wires it to the Zenero API;
  // for canvas variants it paints the hidden <canvas>.
  return (
    '<section class="block block-helium block-helium-' + variant.id + '" ' +
      'data-helium="blog" ' +
      'data-helium-variant="' + variant.renderer + '" ' +
      'data-forge-widget="latest-blog" ' +
      'data-forge-project-id="" ' +
      'aria-label="Helium blog widget (' + variant.label + ')">' +
      body +
      '<script data-forge-js="helium-blog.js">' + HELIUM_JS + '</script>' +
    '</section>'
  );
};

// Registers the block family in the "Helium Blog" category. Besides putting
// the blocks in the left sidebar, this category membership is what makes the
// 8 variants interchangeable through the existing Variants panel: siblings in
// the same category are offered as swappable one-click variants (VariantPanel
// reads the data-wd-cat/data-wd-block pair that stampVariant adds at insert).
export const HELIUM_CATEGORY = {
  id: "helium",
  label: "Helium Blog",
  blocks: HELIUM_VARIANTS.map((v) => ({
    id: v.id,
    label: v.label,
    html: buildHeliumBlockHtml(v.id),
  })),
};