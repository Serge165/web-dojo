import React, { useMemo, useRef, useState } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, Upload } from "lucide-react";

// ============================================================
// Block-type-specific edit menus shown in the LEFT sidebar when
// a block is selected on canvas. Each editor parses the block's
// raw HTML fragment into structured items, lets the user edit
// them, and serializes back — changes apply live to the preview
// through Builder's editHtml(). Pure helpers are exported so
// they can be unit-tested without rendering React.
// ============================================================

// --- shared tiny helpers -------------------------------------

/** Split a HTML fragment into top-level sibling chunks of `tagName`
 * (depth-zero relative to the fragment). Never throws. */
export const splitSiblings = (html, tagName) => {
  if (!html) return [];
  const events = [];
  const openRe = new RegExp(`<${tagName}(\\s|>)`, "gi");
  let mOpen;
  while ((mOpen = openRe.exec(html))) {
    events.push({ pos: mOpen.index, type: "open", len: mOpen[0].length });
    openRe.lastIndex = mOpen.index + mOpen[0].length;
  }
  const closeRe = new RegExp(`</${tagName}>`, "gi");
  let mClose;
  while ((mClose = closeRe.exec(html))) {
    events.push({ pos: mClose.index, type: "close", len: mClose[0].length });
  }
  events.sort((a, b) => a.pos - b.pos);
  const out = [];
  let depth = 0;
  let start = -1;
  events.forEach((ev) => {
    if (ev.type === "open") {
      if (depth === 0) start = ev.pos;
      depth += 1;
    } else {
      depth -= 1;
      if (depth === 0 && start >= 0) {
        out.push(html.slice(start, ev.pos + ev.len));
        start = -1;
      }
    }
  });
  return out;
};

const escAttrLocal = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
const escTextLocal = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// When serializing an item list back into a block, entries whose editable
// fields are unchanged keep their ORIGINAL markup (`_raw`) instead of being
// regenerated from canonical templates — so hand-styled variants survive
// while edited items are rebuilt. `reparse` derives an item's editable
// fields back out of its raw markup for that comparison.
const stripRaw = (item) => {
  const { _raw, ...rest } = item;
  return rest;
};
const sameFields = (a, b) =>
  Object.keys(a).every((k) => String(a[k] ?? "") === String(b[k] ?? ""));
const pickRawOrRebuild = (items, rebuild, reparse) =>
  items.map((it) => {
    if (!it._raw) return rebuild(it);
    try {
      return sameFields(stripRaw(it), reparse(it._raw)) ? it._raw : rebuild(it);
    } catch {
      return rebuild(it);
    }
  });

const readFirstAttr = (tag, attr) => {
  const m = tag.match(new RegExp(`${attr}="([^"]*)"`, "i"));
  return m ? m[1].replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&lt;/g, "<") : "";
};

const moveItem = (arr, idx, delta) => {
  const next = [...arr];
  const j = idx + delta;
  if (j < 0 || j >= next.length) return next;
  [next[idx], next[j]] = [next[j], next[idx]];
  return next;
};

const readAsDataURL = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result));
  reader.onerror = () => reject(reader.error);
  reader.readAsDataURL(file);
});
const baseName = (name) => String(name || "image").replace(/\.[^.]+$/, "");

const Btn = ({ onClick, title, children, testId, disabled }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    aria-label={title}
    data-testid={testId}
    className="p-1 rounded bg-[#242019] border border-[#332D22] text-[#A79C87] hover:text-[#F1EDE2] hover:bg-[#332D22] disabled:opacity-40"
  >{children}</button>
);

const labelCls = "text-[10px] uppercase tracking-wider text-[#948C79]";
const inputCls = "w-full px-1.5 py-1 rounded bg-[#242019] border border-[#332D22] text-xs text-[#F1EDE2]";

// --- kind detection ------------------------------------------

export const detectBlockKind = (html) => {
  if (!html) return null;
  if (/data-forge-widget=["']gallery["']/i.test(html)) return "gallery";
  if (/<nav\b/i.test(html)) return "navbar";
  if (/data-forge-portfolio-timeline/i.test(html)) return "timeline";
  if (/<video\b/i.test(html)) return "video";
  const imgCount = (html.match(/<img\b/gi) || []).length;
  if (imgCount >= 3 && /(display:\s*grid|column-count)/i.test(html)) return "gallery";
  if (/<li[\s>]/i.test(html) && /(border-left:\s*2px|position:absolute;left:-\d+px)/i.test(html)) return "timeline";
  if (/display:\s*grid/i.test(html) && /<h3[\s>]/i.test(html)) return "bento";
  // Hero/header blocks and anything else carrying exactly one photo (an
  // <img>, or a CSS background-image — most header/hero variants in
  // blocksExtra.js use the latter) — falls through to here since none of
  // the more specific kinds above matched. Blocks with 2+ non-gallery
  // images (e.g. a testimonial avatar next to a logo) are intentionally
  // left undetected rather than guessing which one to expose.
  if (imgCount === 1) return "image";
  if (imgCount === 0 && /background(?:-image)?:\s*[^;"]*url\(/i.test(html)) return "image";
  // Appended AFTER every image/nav/video/grid check above so the existing
  // null assertions for "" and "<p>hello</p>" still hold. These cover the
  // common text-forward blocks (a card/feature grid with several <h3>s, a
  // hero headline section, a CTA band) that previously fell through to
  // null and showed no editor. A bare paragraph / empty string has no
  // <section>/<h1>/<h3> and still returns null here — the generic editor
  // then handles it via the kind===null branch in BlockEditMenu below.
  const h3Count = (html.match(/<h3\b/gi) || []).length;
  if (h3Count >= 2) return "card";
  if (/<section\b/i.test(html) && /<h1\b/i.test(html)) return "hero";
  if (/<section\b/i.test(html) && /<(button|a)\b/i.test(html)) return "cta";
  return null;
};

// --- structural shape detection (independent of kind) ----------------

// Purely structural — reads canonical markers added by
// migrate-block-regions.mjs. Absence of markers is not an error: it just
// means the block predates the migration or has no structured content, and
// "section" is a safe default (region detection in detectRegions() below
// works independently of shape).
export const detectBlockShape = (html) => {
  if (!html) return "section";
  if (/^\s*<nav\b/i.test(html)) return "nav";
  if (/class="[^"]*\bcontainer block\b[^"]*"/i.test(html)) return "container";
  return "section";
};

// --- composable region detection ---------------------------------------
//
// Replaces detectBlockKind's exclusive one-kind-wins dispatch. A block can
// have any combination of these regions; BlockEditMenu (Task 8) renders one
// editor slice per region present, instead of picking exactly one. This is
// what fixes the two confirmed regressions: parallax-hero-fullbleed (no img
// at all, but IS a hero — media region must still offer to set a
// background) and video-hero (has both video AND heading/CTA text, both
// must be editable at once).

const HERO_SHAPE_RE = /<section\b[^>]*>[\s\S]*<h1\b/i; // same heuristic detectBlockKind used for "hero"

export const detectHeadingRegion = (html) => {
  if (!html) return false;
  if (/^\s*<nav\b/i.test(html) || /\bfooter\b/i.test((html.match(/^\s*<[a-z]+[^>]*class="([^"]*)"/i) || [])[1] || "")) return false;
  return /\bblock-heading\b/.test(html) || /<h1\b/i.test(html) || /<h2\b/i.test(html);
};

export const detectMediaRegion = (html) => {
  if (!html) return null;
  if (/<video\b/i.test(html)) return "video";
  const imgCount = (html.match(/<img\b/gi) || []).length;
  // A gallery's images belong to the content region, not a single media
  // region — only treat a lone image (imgCount <= 2, below the gallery
  // threshold) as a media region.
  if (imgCount >= 1 && imgCount <= 2) return "image";
  if (/background(?:-image)?:\s*[^;"]*(?:url\(|var\(--block-bg-image)/i.test(html)) return "bg";
  if (imgCount === 0 && HERO_SHAPE_RE.test(html)) return "bg-empty"; // parallax-hero-fullbleed case
  return null;
};

export const detectContentRegion = (html) => {
  if (!html) return null;
  if (/^\s*<nav\b/i.test(html)) return "navbar";
  if (/data-forge-portfolio-timeline/i.test(html)) return "timeline";
  if (/<ol\b[\s\S]*<li[\s>]/i.test(html) && (/\bcontainer block\b/.test(html) || /(border-left:\s*2px|position:absolute;left:-\d+px)/i.test(html))) return "timeline";
  if (/data-forge-widget=["']gallery["']/i.test(html)) return "gallery";
  const imgCount = (html.match(/<img\b/gi) || []).length;
  if (imgCount >= 3) return "gallery";
  if (/\bcontainer block\b/.test(html) && /<h3[\s>]/i.test(html) && (html.match(/<h3\b/gi) || []).length >= 3) return "bento";
  if (/display:\s*grid/i.test(html) && /<h3[\s>]/i.test(html)) return "bento";
  return null;
};

export const detectRegions = (html) => ({
  heading: detectHeadingRegion(html),
  media: detectMediaRegion(html),
  content: detectContentRegion(html),
  generic: true, // the generic text-node editor is always offered as a catch-all for whatever the above didn't claim; Task 8 filters out nodes already owned by another region's editor
});

// ============================================================
// IMAGE (single photo — hero/header backgrounds, <img> heroes)
// ============================================================

export const parseImageBlock = (html) => {
  const imgTag = (html.match(/<img\b[^>]*>/i) || [])[0];
  if (imgTag) return { type: "img", src: readFirstAttr(imgTag, "src"), alt: readFirstAttr(imgTag, "alt") };
  const bgMatch = html.match(/url\((['"]?)([^'")]+)\1\)/i);
  if (bgMatch) return { type: "bg", src: bgMatch[2], alt: "" };
  return null;
};

export const setImageBlockSrc = (html, src) => {
  if (/<img\b/i.test(html)) {
    return html.replace(/(<img\b[^>]*\bsrc=")[^"]*(")/i, (_m, a, b) => `${a}${escAttrLocal(src)}${b}`);
  }
  return html.replace(/url\((['"]?)[^'")]*\1\)/i, () => `url(${escAttrLocal(src)})`);
};

// Writes a per-instance background-image override as a --block-bg-image
// inline custom property on the block's OUTER element — inline always wins
// over the class rule's var(--block-bg-image, <default>) fallback (see
// wrap-block-bg-vars.mjs / Task 1-2), so this never needs to touch
// generated CSS, and never clobbers other layers (gradients etc.) the
// class rule already composes around the variable.
export const setBlockBgImage = (html, src) => {
  const outerOpen = (html.match(/^\s*<[a-z][a-z0-9]*\b[^>]*>/i) || [])[0];
  if (!outerOpen) return html;
  const varDecl = `--block-bg-image:url(${escAttrLocal(src)})`;
  let newOpen;
  if (/\bstyle="/i.test(outerOpen)) {
    newOpen = outerOpen.replace(/style="([^"]*)"/i, (_m, existing) => {
      const withoutOldVar = existing.replace(/--block-bg-image:[^;"]*;?\s*/i, "").trim();
      const joined = (withoutOldVar ? `${withoutOldVar};${varDecl}` : varDecl).replace(/;{2,}/g, ";");
      return `style="${joined}"`;
    });
  } else {
    newOpen = outerOpen.replace(/>$/, ` style="${varDecl}">`);
  }
  return html.slice(0, html.indexOf(outerOpen)) + newOpen + html.slice(html.indexOf(outerOpen) + outerOpen.length);
};

// ============================================================
// VIDEO (video-hero / video-bg blocks — a <video><source>… tag)
// ============================================================

export const parseVideoBlock = (html) => {
  const videoTag = (html.match(/<video\b[^>]*>/i) || [])[0];
  if (!videoTag) return null;
  const sourceTag = (html.match(/<source\b[^>]*>/i) || [])[0];
  const src = sourceTag ? readFirstAttr(sourceTag, "src") : readFirstAttr(videoTag, "src");
  return { src, poster: readFirstAttr(videoTag, "poster") };
};

const guessVideoMime = (src) => {
  const ext = (src.split(/[?#]/)[0].split(".").pop() || "").toLowerCase();
  return { webm: "video/webm", ogg: "video/ogg", ogv: "video/ogg" }[ext] || "video/mp4";
};

export const setVideoBlockSrc = (html, src, mimeType = guessVideoMime(src)) => {
  if (/<source\b[^>]*\bsrc="/i.test(html)) {
    return html
      .replace(/(<source\b[^>]*\bsrc=")[^"]*(")/i, (_m, a, b) => `${a}${escAttrLocal(src)}${b}`)
      .replace(/(<source\b[^>]*\btype=")[^"]*(")/i, (_m, a, b) => `${a}${escAttrLocal(mimeType)}${b}`);
  }
  return html.replace(/(<video\b[^>]*\bsrc=")[^"]*(")/i, (_m, a, b) => `${a}${escAttrLocal(src)}${b}`);
};

export const setVideoBlockPoster = (html, posterUrl) => {
  if (/<video\b[^>]*\bposter="/i.test(html)) {
    return html.replace(/(<video\b[^>]*\bposter=")[^"]*(")/i, (_m, a, b) => `${a}${escAttrLocal(posterUrl)}${b}`);
  }
  return html.replace(/<video\b/i, (m) => `${m} poster="${escAttrLocal(posterUrl)}"`);
};

// Grabs the video's first decoded frame onto an offscreen canvas and
// returns it as a data URL — used so a freshly-set video shows a real
// thumbnail immediately instead of a blank box while the file streams in.
// Resolves null (never rejects) on decode failure or a cross-origin source
// without CORS headers (canvas read-back is blocked either way) — callers
// just leave the poster as-is when that happens.
export const capturePosterFrame = (videoSrc) => new Promise((resolve) => {
  try {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    const cleanup = () => { video.removeAttribute("src"); video.load(); };
    video.addEventListener("loadeddata", () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      } catch {
        resolve(null);
      } finally {
        cleanup();
      }
    }, { once: true });
    video.addEventListener("error", () => { cleanup(); resolve(null); }, { once: true });
    video.src = videoSrc;
  } catch {
    resolve(null);
  }
});

// ============================================================
// GALLERY
// ============================================================

export const parseGalleryImages = (html) =>
  (html.match(/<img\b[^>]*>/gi) || []).map((tag) => ({
    src: readFirstAttr(tag, "src"),
    alt: readFirstAttr(tag, "alt"),
  }));

export const setGalleryImages = (html, images) => {
  const tags = html.match(/<img\b[^>]*>/gi) || [];
  let out = html;
  // Walk backwards so earlier replacements can't shift later offsets.
  for (let i = Math.max(tags.length, images.length) - 1; i >= 0; i -= 1) {
    if (i < images.length && i < tags.length) {
      let tag = tags[i]
        .replace(/src="[^"]*"/i, `src="${escAttrLocal(images[i].src)}"`)
        .replace(/alt="[^"]*"/i, `alt="${escAttrLocal(images[i].alt)}"`);
      if (!/alt=/i.test(tag)) tag = tag.replace(/<img/i, `<img alt="${escAttrLocal(images[i].alt)}"`);
      out = out.replace(tags[i], () => tag);
    } else if (i >= images.length && i < tags.length) {
      out = out.replace(tags[i], "");
    }
  }
  return out;
};

export const setGalleryStyle = (html, styleKey) => {
  const styles = {
    "grid-auto": "display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px;",
    "grid-2": "display:grid;grid-template-columns:repeat(2,1fr);gap:12px;",
    "grid-3": "display:grid;grid-template-columns:repeat(3,1fr);gap:12px;",
    "grid-4": "display:grid;grid-template-columns:repeat(4,1fr);gap:12px;",
    masonry: "column-count:3;column-gap:12px;",
    carousel: "display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;",
  };
  const style = styles[styleKey] || styles["grid-auto"];
  // Patch the container that carries the current grid/masonry/flex layout.
  const re = /(style=")([^"]*(?:display:\s*grid|column-count|overflow-x)[^"]*)(")/i;
  if (re.test(html)) return html.replace(re, (_m, a, _old, c) => `${a}${style}${c}`);
  return html;
};

const GalleryEditor = ({ html, onChange, projectId = null, blockId = null }) => {
  const fileRef = useRef(null);
  const images = useMemo(() => parseGalleryImages(html), [html]);
  const styleKey = useMemo(() => {
    if (/column-count/i.test(html)) return "masonry";
    if (/overflow-x/i.test(html)) return "carousel";
    const cols = html.match(/repeat\((\d),/i);
    return cols ? `grid-${cols[1]}` : "grid-auto";
  }, [html]);

  const commit = (next) => onChange(setGalleryImages(html, next));

  // Phase 2D: prefer the backend asset pipeline (file lands in
  // imgs/gallery-{id}/ and the HTML references a clean relative URL);
  // fall back to an embedded data URL when no project is saved yet or
  // the backend is unreachable — the image still shows either way.
  const uploadOne = async (file) => {
    if (!projectId) return { src: await readAsDataURL(file), alt: baseName(file.name) };
    try {
      const fd = new FormData();
      fd.append("file", file);
      const API = process.env.REACT_APP_BACKEND_URL || "";
      const res = await fetch(`${API}/api/projects/${projectId}/assets/upload?asset_type=gallery&asset_id=${encodeURIComponent(blockId || "1")}`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error(`upload failed (${res.status})`);
      const data = await res.json();
      if (!data.success) throw new Error(data.detail || "upload failed");
      return { src: data.url, alt: data.filename };
    } catch {
      return { src: await readAsDataURL(file), alt: baseName(file.name) };
    }
  };

  const onUpload = async (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = "";
    if (!picked.length) return;
    const added = (await Promise.all(picked.map(uploadOne))).filter(Boolean);
    commit([...images, ...added]);
  };

  return (
    <div className="space-y-2" data-testid="block-edit-gallery">
      <div className="flex items-center justify-between">
        <span className={labelCls}>Images ({images.length})</span>
        <div className="flex gap-1">
          <Btn onClick={() => fileRef.current?.click()} title="Upload images" testId="gallery-upload-btn"><Upload size={11} /></Btn>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onUpload} data-testid="gallery-upload-input" />
          <Btn onClick={() => commit([...images, { src: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=800&q=70", alt: "" }])} title="Add placeholder image" testId="gallery-add-image"><Plus size={11} /></Btn>
        </div>
      </div>
      {images.map((img, i) => (
        <div key={`${i}-${img.src.slice(0, 24)}`} className="p-1.5 rounded border border-[#332D22]">
          <div className="flex items-center gap-1">
            <img src={img.src} alt="" className="w-8 h-8 object-cover rounded flex-none" />
            <input
              value={img.alt}
              placeholder="Caption"
              aria-label={`Image ${i + 1} caption`}
              className={inputCls}
              data-testid={`gallery-caption-${i}`}
              onChange={(e) => commit(images.map((x, j) => j === i ? { ...x, alt: e.target.value } : x))}
            />
            <Btn onClick={() => commit(moveItem(images, i, -1))} disabled={i === 0} title="Move up"><ArrowUp size={11} /></Btn>
            <Btn onClick={() => commit(moveItem(images, i, 1))} disabled={i === images.length - 1} title="Move down"><ArrowDown size={11} /></Btn>
            <Btn onClick={() => commit(images.filter((_, j) => j !== i))} title="Remove image" testId={`gallery-remove-${i}`}><Trash2 size={11} /></Btn>
          </div>
        </div>
      ))}
      <div>
        <div className={`${labelCls} mb-1`}>Style</div>
        <select
          value={styleKey}
          onChange={(e) => onChange(setGalleryStyle(html, e.target.value))}
          className={inputCls}
          data-testid="gallery-style-select"
        >
          <option value="grid-auto">Grid · auto-fit</option>
          <option value="grid-2">Grid · 2 columns</option>
          <option value="grid-3">Grid · 3 columns</option>
          <option value="grid-4">Grid · 4 columns</option>
          <option value="masonry">Masonry</option>
          <option value="carousel">Carousel (scroll)</option>
        </select>
      </div>
    </div>
  );
};



// ============================================================
// NAVBAR — tree model (brand + nested items w/ dropdowns),
// style variants, page linking.
// ============================================================

export const NAVBAR_VARIANTS = [
  { id: "horizontal-top", label: "Horizontal Top" },
  { id: "horizontal-centered", label: "Horizontal Centered" },
  { id: "horizontal-sticky", label: "Horizontal Sticky" },
  { id: "horizontal-split", label: "Horizontal Split" },
  { id: "vertical-left", label: "Vertical Left Sidebar" },
  { id: "vertical-right", label: "Vertical Right Sidebar" },
  { id: "mega-menu", label: "Mega Menu" },
  { id: "minimalist", label: "Minimalist (Hamburger)" },
  { id: "pill", label: "Pill/Rounded" },
  { id: "underline", label: "Underline Accent" },
];

const NAV_A_STYLE = "color:inherit;text-decoration:none;";
const DD_STYLE = "position:relative;display:inline-block;";
const DD_MENU_STYLE = "display:none;position:absolute;top:100%;left:0;background:#fff;border:1px solid #ddd;border-radius:6px;min-width:180px;z-index:100;padding:4px 0;box-shadow:0 4px 10px rgba(0,0,0,.12);";
export const NAV_CSS_TAG = '<style data-wd-nav-css>.wd-dd:hover .wd-dd-menu{display:flex!important;flex-direction:column}.wd-dd-menu a:hover{background:#f3f4f6}</style>';

/** Balanced-chunk extractor: returns the first `<tag …> … </tag>` chunk at
 * the given position, or "" if unbalanced. */
const chunkAt = (html, pos, tag) => {
  const slice = html.slice(pos);
  const chunks = splitSiblings(slice, tag);
  return chunks.length && slice.indexOf(chunks[0]) === 0 ? chunks[0] : "";
};

const firstAnchorOf = (chunk) => (chunk.match(/<a\b[^>]*>[^<]*<\/a>/i) || [""])[0];

/** Recursively parse nav nodes out of an HTML fragment. A node is either a
 * plain anchor or a `.wd-dd` wrapper whose children form the submenu. */
export const parseNavNodes = (inner) => {
  const nodes = [];
  let rest = inner || "";
  for (;;) {
    const ddIdx = rest.search(/<span\s+class="wd-dd"/i);
    const aIdx = rest.search(/<a\b/i);
    if (ddIdx < 0 && aIdx < 0) break;
    if (ddIdx >= 0 && (aIdx < 0 || ddIdx < aIdx)) {
      const chunk = chunkAt(rest, ddIdx, "span");
      if (!chunk) { rest = rest.slice(ddIdx + 4); continue; }
      const a = firstAnchorOf(chunk);
      const menuStart = chunk.search(/class="wd-dd-menu"/i);
      const menuOpen = menuStart >= 0 ? chunk.indexOf(">", menuStart) + 1 : -1;
      const menuEnd = menuOpen >= 0 ? chunk.lastIndexOf("</div>") : -1;
      const menuInner = menuOpen >= 0 && menuEnd > menuOpen ? chunk.slice(menuOpen, menuEnd) : "";
      nodes.push({
        label: (a.replace(/<[^>]*>/g, "") || "").trim(),
        href: readFirstAttr(a, "href"),
        children: parseNavNodes(menuInner),
      });
      rest = rest.slice(rest.indexOf(chunk) + chunk.length);
    } else {
      const m = rest.match(/<a\b[^>]*>[^<]*<\/a>/i);
      if (!m) break;
      nodes.push({
        label: (m[0].replace(/<[^>]*>/g, "") || "").trim(),
        href: readFirstAttr(m[0], "href"),
        children: [],
      });
      rest = rest.slice(rest.indexOf(m[0]) + m[0].length);
    }
  }
  return nodes;
};

/** Locate the first div inside the nav that contains anchors — that's the
 * items container this editor rebuilds. Everything else (brand, CTA
 * buttons) is preserved verbatim. */
const itemsZoneMatch = (html) => {
  const navOpen = html.match(/<nav\b[^>]*>/i);
  if (!navOpen) return null;
  const navStart = navOpen.index + navOpen[0].length;
  const divs = splitSiblings(html.slice(navStart), "div");
  const zone = divs.find((d) => /<a\b/i.test(d));
  if (!zone) return null;
  const absStart = navStart + html.slice(navStart).indexOf(zone);
  const inner = zone.slice(zone.indexOf(">") + 1, zone.lastIndexOf("</div>"));
  return { absStart, zone, inner };
};


export const readNavBrand = (html) => {
  const m = (html || "").match(/<nav\b[^>]*>[\s\S]*?<div\b[^>]*>([^<]{1,60})<\/div>/i);
  return m ? m[1].trim() : "";
};

export const setNavBrand = (html, brand) => {
  const m = html.match(/(<nav\b[^>]*>[\s\S]*?<div\b[^>]*>)([^<]{1,60})(<\/div>)/i);
  if (!m) return html;
  return html.replace(m[0], () => `${m[1]}${escTextLocal(brand)}${m[3]}`);
};

const buildNavNode = (node, depth = 0) => {
  const aStyle = depth === 0 ? NAV_A_STYLE : `padding:10px 14px;color:#333;text-decoration:none;display:block;font-size:14px;`;
  if (!node.children || !node.children.length) {
    return `<a href="${escAttrLocal(node.href || "#")}" style="${aStyle}">${escTextLocal(node.label)}</a>`;
  }
  return (
    `<span class="wd-dd" style="${DD_STYLE}">`
    + `<a href="${escAttrLocal(node.href || "#")}" style="${aStyle}">${escTextLocal(node.label)}</a>`
    + `<div class="wd-dd-menu" style="${DD_MENU_STYLE}">`
    + node.children.map((c) => buildNavNode(c, depth + 1)).join("\n")
    + `</div></span>`
  );
};

export const parseNavbarTree = (html) => ({
  brand: readNavBrand(html),
  variant: readFirstAttr((html.match(/<nav\b[^>]*>/i) || [""])[0], "data-navbar-variant") || "horizontal-top",
  items: itemsZoneMatch(html) ? parseNavNodes(itemsZoneMatch(html).inner) : [],
});

export const setNavbarItems = (html, items) => {
  const zone = itemsZoneMatch(html);
  if (!zone) return html;
  const hasDd = items.some((n) => n.children && n.children.length);
  const body = items.map((n) => buildNavNode(n)).join("\n");
  const rebuilt = `${hasDd ? `${NAV_CSS_TAG}\n` : ""}${body}`;
  const newZone = `${zone.zone.slice(0, zone.zone.indexOf(">") + 1)}\n${rebuilt}\n${zone.zone.slice(zone.zone.lastIndexOf("</div>"))}`;
  return html.slice(0, zone.absStart) + newZone + html.slice(zone.absStart + zone.zone.length);
};

// "display:flex;gap:24px;" → { display: "flex", gap: "24px" } for patchNavStyle
const styleDecls = (styleStr) => Object.fromEntries(
  styleStr.split(";").filter(Boolean).map((d) => {
    const i = d.indexOf(":");
    return [d.slice(0, i).trim(), d.slice(i + 1).trim()];
  }),
);

/** Merge CSS declarations into the first inline style of the first
 * `<tag>` in the fragment (local copy of ContextualEditors.patchTagStyle,
 * which isn't imported to keep this module self-contained). */
const patchNavStyle = (html, tag, patch) => {
  const reWith = new RegExp(`(<${tag}\\b[^>]*?)style="([^"]*)"`, "i");
  if (reWith.test(html)) {
    return html.replace(reWith, (_m, prefix, styles) => {
      const map = {};
      styles.split(";").filter(Boolean).forEach((p) => {
        const i = p.indexOf(":");
        if (i > 0) map[p.slice(0, i).trim()] = p.slice(i + 1).trim();
      });
      Object.assign(map, patch);
      return `${prefix}style="${Object.entries(map).map(([k, v]) => `${k}: ${v}`).join("; ")}"`;
    });
  }
  const styleStr = Object.entries(patch).map(([k, v]) => `${k}: ${v}`).join("; ");
  return html.replace(new RegExp(`<(${tag})(\\s|>)`, "i"), `<$1 style="${styleStr}"$2`);
};


const VARIANT_NAV_STYLE = {
  "horizontal-top": "display:flex;align-items:center;justify-content:space-between;padding:18px 32px;",
  "horizontal-centered": "display:flex;flex-direction:column;align-items:center;gap:15px;padding:18px 32px;",
  "horizontal-sticky": "position:sticky;top:0;z-index:50;display:flex;align-items:center;justify-content:space-between;padding:18px 32px;",
  "horizontal-split": "display:flex;align-items:center;justify-content:space-between;padding:18px 32px;",
  "mega-menu": "display:flex;align-items:center;justify-content:space-between;padding:18px 32px;",
  minimalist: "display:flex;align-items:center;justify-content:space-between;padding:18px 32px;",
  pill: "display:flex;align-items:center;justify-content:space-between;padding:18px 32px;",
  underline: "display:flex;align-items:center;justify-content:space-between;padding:18px 32px;",
  "vertical-left": "position:fixed;top:0;left:0;width:250px;height:100vh;overflow-y:auto;padding:20px;display:flex;flex-direction:column;align-items:flex-start;gap:16px;z-index:40;background:#fff;",
  "vertical-right": "position:fixed;top:0;right:0;width:250px;height:100vh;overflow-y:auto;padding:20px;display:flex;flex-direction:column;align-items:flex-start;gap:16px;z-index:40;background:#fff;",
};
const VARIANT_ITEMS_MODE = {
  minimalist: "minimalist",
};
const VARIANT_LINK_PATCH = {
  pill: "background:#f0f0f0;border-radius:20px;padding:8px 20px;",
  underline: "border-bottom:2px solid transparent;padding:8px 2px;",
};

/** Switch a navbar block's variant: stamps data-navbar-variant (which the
 * export pipeline keys off) AND rewrites structural inline styles so the
 * canvas preview reflects the choice immediately. */
export const setNavbarVariant = (html, variant) => {
  let out = html;
  // 1. stamp attribute + variant class on the <nav> tag (merging any
  // pre-existing class attr rather than duplicating it)
  const navTag = out.match(/<nav\b[^>]*>/i)?.[0];
  if (!navTag) return html;
  let newTag;
  if (/class="/.test(navTag)) {
    newTag = navTag
      .replace(/class="([^"]*)"/i, (_m, c) => `class="${c.replace(new RegExp(`\\bnavbar-1 [a-z-]+`, "g"), "").trim()} navbar-1 ${variant}"`)
      .replace(/data-navbar-variant="[^"]*"/i, `data-navbar-variant="${escAttrLocal(variant)}"`);
  } else {
    newTag = navTag
      .replace(/<nav/i, `<nav class="navbar-1 ${variant}"`)
      .replace(/>/, ` data-navbar-variant="${escAttrLocal(variant)}">`);
  }
  if (!/data-navbar-variant="/.test(newTag)) {
    newTag = newTag.replace(/>/, ` data-navbar-variant="${escAttrLocal(variant)}">`);
  }
  out = out.replace(navTag, () => newTag);
  // 2. structural inline styles on the nav itself
  out = patchNavStyle(out, "nav", styleDecls(VARIANT_NAV_STYLE[variant] || VARIANT_NAV_STYLE["horizontal-top"]));
  // 3. items container layout (vertical stacks links; minimalist hides them)
  const zone = itemsZoneMatch(out);
  if (zone) {
    const mode = variant.startsWith("vertical") ? "vertical" : VARIANT_ITEMS_MODE[variant] || "horizontal";
    const itemsStyle = mode === "vertical"
      ? "flex-direction:column;gap:5px;"
      : mode === "minimalist" ? "display:none;" : "";
    if (itemsStyle) {
      const patched = patchNavStyle(zone.inner, "div", styleDecls(itemsStyle));
      out = out.slice(0, zone.absStart)
        + zone.zone.slice(0, zone.zone.indexOf(">") + 1) + patched + zone.zone.slice(zone.zone.lastIndexOf("</div>"))
        + out.slice(zone.absStart + zone.zone.length);
    }
  }
  // 4. per-link visual variants
  if (VARIANT_LINK_PATCH[variant]) {
    out = out.replace(/(<a\b[^>]*?style=")([^"]*)("[^>]*>)/gi,
      (_m2, a, style, c) => `${a}${style};${VARIANT_LINK_PATCH[variant]}${c}`);
  }
  return out;
};

// Back-compat shims ------------------------------------------------

export const parseNavItems = (html) =>
  parseNavbarTree(html).items.map((n) => ({ label: n.label, href: n.href }));

export const setNavItems = (html, items) =>
  setNavbarItems(html, items.map((i) => ({ ...i, children: [] })));



// ============================================================
// PAGE PICKER — site structure modal (Phase 2C)
// ============================================================

export const pageHref = (page) => `${(page.slug || "index").replace(/\.html$/, "")}.html`;

const PagePickerModal = ({ pages, onPick, onClose }) => {
  const [external, setExternal] = useState("");
  return (
    <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4" data-testid="page-picker-modal" role="dialog" aria-label="Pick link target">
      <div className="w-full max-w-sm max-h-[70vh] overflow-y-auto rounded-lg border border-[#332D22] bg-[#1C1A15] p-3 space-y-2">
        <div className="text-xs font-semibold text-[#D9BC55]">Link to page</div>
        {pages.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onPick(pageHref(p))}
            className="w-full flex items-center gap-2 text-left text-xs px-2 py-1.5 rounded bg-[#242019] border border-[#332D22] text-[#F1EDE2] hover:bg-[#332D22]"
            data-testid={`page-picker-page-${p.slug || p.id}`}
          >
            📄 <span className="flex-1 truncate">{p.name}</span>
            <span className="text-[10px] text-[#948C79]">{pageHref(p)}</span>
          </button>
        ))}
        <div className="pt-2 border-t border-[#332D22] space-y-1">
          <div className={labelCls}>Or external URL</div>
          <div className="flex gap-1">
            <input
              value={external}
              onChange={(e) => setExternal(e.target.value)}
              placeholder="https://example.com"
              aria-label="External URL"
              className={inputCls}
              data-testid="page-picker-external"
            />
            <Btn
              onClick={() => external.trim() && onPick(external.trim())}
              disabled={!external.trim()}
              title="Use external URL"
              testId="page-picker-use-external"
            ><Plus size={11} /></Btn>
          </div>
        </div>
        <div className="flex justify-end pt-1">
          <button type="button" onClick={onClose} className="text-[11px] px-2 py-1 rounded bg-[#242019] border border-[#332D22] text-[#A79C87] hover:text-[#F1EDE2]" data-testid="page-picker-cancel">Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// TIMELINE
// ============================================================

export const parseTimelineEntries = (html) => {
  const olInner = (html.match(/<ol\b[^>]*>([\s\S]*?)<\/ol>/i) || [])[1] || "";
  return splitSiblings(olInner, "li").map((li) => {
    const divs = (li.match(/<div\b[^>]*>([^<]*)<\/div>/gi) || []).map((d) => d.replace(/<[^>]*>/g, "").trim());
    const p = (li.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i) || [])[1] || "";
    return { date: divs[0] || "", title: divs[1] || "", description: p.trim(), _raw: li };
  });
};

const buildTimelineLi = (entry) => (
  `<li style="position:relative;padding:0 0 32px 24px;">
        <span style="position:absolute;left:-9px;top:4px;width:16px;height:16px;border-radius:999px;background:var(--fc-primary, #2563eb);border:3px solid var(--fc-bg, #ffffff);box-shadow:0 0 0 2px var(--fc-primary, #2563eb);"></span>
        <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--fc-muted, #64748b);margin-bottom:4px;">${escTextLocal(entry.date)}</div>
        <div style="font-size:18px;font-weight:600;color:var(--fc-text, #0f172a);margin-bottom:4px;">${escTextLocal(entry.title)}</div>
        <p style="margin:0;font-size:14px;color:var(--fc-muted, #475569);line-height:1.55;">${escTextLocal(entry.description)}</p>
      </li>`
);

export const setTimelineEntries = (html, entries) => {
  const olMatch = html.match(/<ol\b[^>]*>([\s\S]*?)<\/ol>/i);
  if (!olMatch) return html;
  const body = pickRawOrRebuild(entries, buildTimelineLi, (raw) => parseTimelineEntries(`<ol>${raw}</ol>`)[0] || {}).join("\n");
  const newOl = olMatch[0].replace(olMatch[1], () => `\n${body}\n    `);
  return html.replace(olMatch[0], () => newOl);
};

const TimelineEditor = ({ html, onChange }) => {
  const entries = useMemo(() => parseTimelineEntries(html), [html]);
  const commit = (next) => onChange(setTimelineEntries(html, next));

  if (!entries.length) {
    return <div className="text-[11px] text-[#948C79]" data-testid="block-edit-timeline-empty">No timeline entries detected in this block.</div>;
  }

  return (
    <div className="space-y-2" data-testid="block-edit-timeline">
      <div className="flex items-center justify-between">
        <span className={labelCls}>Entries ({entries.length})</span>
        <Btn
          onClick={() => commit([...entries, { date: "2026", title: "New milestone", description: "" }])}
          title="Add entry"
          testId="timeline-add-entry"
        ><Plus size={11} /></Btn>
      </div>
      {entries.map((entry, i) => (
        <div key={i} className="p-1.5 rounded border border-[#332D22] space-y-1">
          <div className="flex gap-1">
            <input
              value={entry.date}
              placeholder="Date"
              aria-label={`Entry ${i + 1} date`}
              className={inputCls}
              data-testid={`timeline-date-${i}`}
              onChange={(e) => commit(entries.map((x, j) => j === i ? { ...x, date: e.target.value } : x))}
            />
            <input
              value={entry.title}
              placeholder="Title"
              aria-label={`Entry ${i + 1} title`}
              className={inputCls}
              data-testid={`timeline-title-${i}`}
              onChange={(e) => commit(entries.map((x, j) => j === i ? { ...x, title: e.target.value } : x))}
            />
          </div>
          <textarea
            value={entry.description}
            placeholder="Description"
            aria-label={`Entry ${i + 1} description`}
            rows={2}
            className={inputCls}
            data-testid={`timeline-desc-${i}`}
            onChange={(e) => commit(entries.map((x, j) => j === i ? { ...x, description: e.target.value } : x))}
          />
          <div className="flex gap-1 justify-end">
            <Btn onClick={() => commit(moveItem(entries, i, -1))} disabled={i === 0} title="Move up"><ArrowUp size={11} /></Btn>
            <Btn onClick={() => commit(moveItem(entries, i, 1))} disabled={i === entries.length - 1} title="Move down"><ArrowDown size={11} /></Btn>
            <Btn onClick={() => commit(entries.filter((_, j) => j !== i))} title="Remove entry" testId={`timeline-remove-${i}`}><Trash2 size={11} /></Btn>
          </div>
        </div>
      ))}
    </div>
  );
};


// ============================================================
// BENTO
// ============================================================

const buildBentoItem = (item) => (
  `<div style="padding:20px;border-radius:12px;background:${escAttrLocal(item.bg)};color:#fff;">
        <h3 style="font-size:18px;margin:0 0 8px;color:inherit;">${escTextLocal(item.title)}</h3>
        <p style="font-size:14px;margin:0;opacity:.75;">${escTextLocal(item.description)}</p>
      </div>`
);

export const parseBentoItems = (html) => {
  if (!html) return [];
  // The bento container is the div whose style declares display:grid;
  // its depth-zero children are the tiles.
  const openGrid = html.search(/<div\b[^>]*style="[^"]*display:\s*grid/i);
  if (openGrid < 0) return [];
  const container = splitSiblings(html.slice(openGrid), "div")[0];
  if (!container) return [];
  const inner = container.slice(container.indexOf(">") + 1, container.lastIndexOf("</div>"));
  return splitSiblings(inner, "div").map((chunk) => ({
    title: ((chunk.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/i) || [])[1]
      // fallback: first non-empty div text (real bento blocks often use
      // styled divs rather than h3/p)
      || (splitSiblings(chunk, "div").map((d) => d.replace(/<[^>]*>/g, "").trim()).find(Boolean))
      || "").trim(),
    description: ((chunk.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i) || [])[1] || "").trim(),
    bg: (readFirstAttr(chunk, "style").match(/background(?:-color)?:\s*([^;]+);?/i)?.[1] || "#1f2937").trim(),
    _raw: chunk,
  }));
};

export const setBentoItems = (html, items) => {
  const openGrid = html.search(/<div\b[^>]*style="[^"]*display:\s*grid/i);
  if (openGrid < 0) return html;
  const container = splitSiblings(html.slice(openGrid), "div")[0];
  if (!container) return html;
  const containerStart = openGrid + html.slice(openGrid).indexOf(container);
  const body = pickRawOrRebuild(items, buildBentoItem, (raw) => {
    const reparsed = parseBentoItems(`<div style="display:grid">${raw}</div>`);
    return reparsed[0] || {};
  }).join("\n");
  const newContainer = `${container.slice(0, container.indexOf(">") + 1)}\n${body}\n    </div>`;
  return html.slice(0, containerStart) + newContainer + html.slice(containerStart + container.length);
};

const BentoEditor = ({ html, onChange }) => {
  const items = useMemo(() => parseBentoItems(html), [html]);
  const commit = (next) => onChange(setBentoItems(html, next));

  if (!items.length) {
    return <div className="text-[11px] text-[#948C79]" data-testid="block-edit-bento-empty">No bento items detected in this block.</div>;
  }

  return (
    <div className="space-y-2" data-testid="block-edit-bento">
      <div className="flex items-center justify-between">
        <span className={labelCls}>Items ({items.length})</span>
        <Btn
          onClick={() => commit([...items, { title: "New tile", description: "", bg: "#1f2937" }])}
          title="Add item"
          testId="bento-add-item"
        ><Plus size={11} /></Btn>
      </div>
      {items.map((item, i) => (
        <div key={i} className="p-1.5 rounded border border-[#332D22] space-y-1">
          <div className="flex gap-1 items-center">
            <input
              value={/^#[0-9a-f]{3,8}$/i.test(item.bg) ? item.bg : "#1f2937"}
              type="color"
              aria-label={`Item ${i + 1} background color`}
              className="w-8 h-7 rounded cursor-pointer bg-transparent flex-none"
              data-testid={`bento-bg-${i}`}
              onChange={(e) => commit(items.map((x, j) => j === i ? { ...x, bg: e.target.value } : x))}
            />
            <input
              value={item.title}
              placeholder="Title"
              aria-label={`Item ${i + 1} title`}
              className={inputCls}
              data-testid={`bento-title-${i}`}
              onChange={(e) => commit(items.map((x, j) => j === i ? { ...x, title: e.target.value } : x))}
            />
            <Btn onClick={() => commit(moveItem(items, i, -1))} disabled={i === 0} title="Move up"><ArrowUp size={11} /></Btn>
            <Btn onClick={() => commit(moveItem(items, i, 1))} disabled={i === items.length - 1} title="Move down"><ArrowDown size={11} /></Btn>
            <Btn onClick={() => commit(items.filter((_, j) => j !== i))} title="Remove item" testId={`bento-remove-${i}`}><Trash2 size={11} /></Btn>
          </div>
          <textarea
            value={item.description}
            placeholder="Description"
            aria-label={`Item ${i + 1} description`}
            rows={2}
            className={inputCls}
            data-testid={`bento-desc-${i}`}
            onChange={(e) => commit(items.map((x, j) => j === i ? { ...x, description: e.target.value } : x))}
          />
        </div>
      ))}
    </div>
  );
};

const ImageBlockEditor = ({ html, onChange, projectId = null, blockId = null }) => {
  const fileRef = useRef(null);
  const [urlDraft, setUrlDraft] = useState("");
  const image = useMemo(() => parseImageBlock(html), [html]);

  const commit = (src) => onChange(setImageBlockSrc(html, src));

  // Same asset pipeline as GalleryEditor: real upload lands in the
  // project's asset store; a data URL is the offline/unsaved-project
  // fallback so the image still shows either way.
  const onUpload = async (e) => {
    const file = (e.target.files || [])[0];
    e.target.value = "";
    if (!file) return;
    if (!projectId) {
      commit(await readAsDataURL(file));
      return;
    }
    try {
      const fd = new FormData();
      fd.append("file", file);
      const API = process.env.REACT_APP_BACKEND_URL || "";
      const res = await fetch(`${API}/api/projects/${projectId}/assets/upload?asset_type=image&asset_id=${encodeURIComponent(blockId || "1")}`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error(`upload failed (${res.status})`);
      const data = await res.json();
      if (!data.success) throw new Error(data.detail || "upload failed");
      commit(data.url);
    } catch {
      commit(await readAsDataURL(file));
    }
  };

  if (!image) {
    return <div className="text-[11px] text-[#948C79]" data-testid="block-edit-image-empty">No image detected in this block.</div>;
  }

  return (
    <div className="space-y-2" data-testid="block-edit-image">
      <div className="flex items-center gap-2">
        <img src={image.src} alt="" className="w-12 h-12 object-cover rounded flex-none border border-[#332D22]" />
        <div className="flex-1 flex gap-1">
          <Btn onClick={() => fileRef.current?.click()} title="Upload image" testId="image-upload-btn"><Upload size={11} /> Upload</Btn>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onUpload} data-testid="image-upload-input" />
        </div>
      </div>
      <div className="flex gap-1">
        <input
          value={urlDraft}
          onChange={(e) => setUrlDraft(e.target.value)}
          placeholder="Paste an image URL"
          aria-label="Image URL"
          className={inputCls}
          data-testid="image-url-input"
        />
        <Btn onClick={() => { if (urlDraft.trim()) { commit(urlDraft.trim()); setUrlDraft(""); } }} title="Use URL" testId="image-url-apply">Set</Btn>
      </div>
    </div>
  );
};

const BackgroundBlockEditor = ({ html, onChange, projectId = null, blockId = null }) => {
  const fileRef = useRef(null);
  const [urlDraft, setUrlDraft] = useState("");
  const current = (html.match(/--block-bg-image:url\(([^)]*)\)/i) || [])[1] || "";

  const commit = (src) => onChange(setBlockBgImage(html, src));

  const onUpload = async (e) => {
    const file = (e.target.files || [])[0];
    e.target.value = "";
    if (!file) return;
    if (!projectId) {
      commit(await readAsDataURL(file));
      return;
    }
    try {
      const fd = new FormData();
      fd.append("file", file);
      const API = process.env.REACT_APP_BACKEND_URL || "";
      const res = await fetch(`${API}/api/projects/${projectId}/assets/upload?asset_type=image&asset_id=${encodeURIComponent(blockId || "1")}`, { method: "POST", body: fd });
      if (!res.ok) throw new Error(`upload failed (${res.status})`);
      const data = await res.json();
      if (!data.success) throw new Error(data.detail || "upload failed");
      commit(data.url);
    } catch {
      commit(await readAsDataURL(file));
    }
  };

  return (
    <div className="space-y-2" data-testid="block-edit-background">
      <div className="flex items-center gap-2">
        {current ? <img src={current} alt="" className="w-12 h-12 object-cover rounded flex-none border border-[#332D22]" /> : <div className="w-12 h-12 rounded flex-none border border-[#332D22] bg-[#242019]" />}
        <div className="flex-1 flex gap-1">
          <Btn onClick={() => fileRef.current?.click()} title="Upload background image" testId="bg-upload-btn"><Upload size={11} /> Upload</Btn>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onUpload} data-testid="bg-upload-input" />
        </div>
      </div>
      <div className="flex gap-1">
        <input
          value={urlDraft}
          onChange={(e) => setUrlDraft(e.target.value)}
          placeholder="Paste a background image URL"
          aria-label="Background image URL"
          className={inputCls}
          data-testid="bg-url-input"
        />
        <Btn onClick={() => { if (urlDraft.trim()) { commit(urlDraft.trim()); setUrlDraft(""); } }} title="Use URL" testId="bg-url-apply">Set</Btn>
      </div>
    </div>
  );
};

const VideoBlockEditor = ({ html, onChange, projectId = null, blockId = null }) => {
  const fileRef = useRef(null);
  const [urlDraft, setUrlDraft] = useState("");
  const [capturing, setCapturing] = useState(false);
  const video = useMemo(() => parseVideoBlock(html), [html]);

  // The poster (thumbnail shown while the video streams in) is derived
  // automatically from the new video's own first frame — never asked of
  // the user. Same upload-with-data-URL-fallback pipeline as the poster
  // itself: a real project gets a hosted asset URL, an unsaved one gets a
  // data URL so the frame still shows.
  const applyPoster = async (htmlWithSrc, src) => {
    setCapturing(true);
    const frame = await capturePosterFrame(src);
    setCapturing(false);
    if (!frame) return htmlWithSrc;
    if (!projectId) return setVideoBlockPoster(htmlWithSrc, frame);
    try {
      const blob = await (await fetch(frame)).blob();
      const fd = new FormData();
      fd.append("file", blob, "poster.jpg");
      const API = process.env.REACT_APP_BACKEND_URL || "";
      const res = await fetch(`${API}/api/projects/${projectId}/assets/upload?asset_type=image&asset_id=${encodeURIComponent(`${blockId || "1"}-poster`)}`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error(`poster upload failed (${res.status})`);
      const data = await res.json();
      if (!data.success) throw new Error(data.detail || "poster upload failed");
      return setVideoBlockPoster(htmlWithSrc, data.url);
    } catch {
      return setVideoBlockPoster(htmlWithSrc, frame);
    }
  };

  const commit = async (src, mimeType) => {
    onChange(await applyPoster(setVideoBlockSrc(html, src, mimeType), src));
  };

  const onUpload = async (e) => {
    const file = (e.target.files || [])[0];
    e.target.value = "";
    if (!file) return;
    if (!projectId) {
      commit(await readAsDataURL(file), file.type || "video/mp4");
      return;
    }
    try {
      const fd = new FormData();
      fd.append("file", file);
      const API = process.env.REACT_APP_BACKEND_URL || "";
      const res = await fetch(`${API}/api/projects/${projectId}/assets/upload?asset_type=video&asset_id=${encodeURIComponent(blockId || "1")}`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error(`upload failed (${res.status})`);
      const data = await res.json();
      if (!data.success) throw new Error(data.detail || "upload failed");
      commit(data.url, file.type || "video/mp4");
    } catch {
      commit(await readAsDataURL(file), file.type || "video/mp4");
    }
  };

  if (!video) {
    return <div className="text-[11px] text-[#948C79]" data-testid="block-edit-video-empty">No video detected in this block.</div>;
  }

  return (
    <div className="space-y-2" data-testid="block-edit-video">
      <div className="flex items-center gap-2">
        {video.poster
          ? <img src={video.poster} alt="" className="w-12 h-12 object-cover rounded flex-none border border-[#332D22]" />
          : <div className="w-12 h-12 rounded flex-none border border-[#332D22] bg-[#242019]" />}
        <div className="flex-1 flex gap-1">
          <Btn onClick={() => fileRef.current?.click()} title="Upload video" testId="video-upload-btn" disabled={capturing}>
            <Upload size={11} /> {capturing ? "Capturing…" : "Upload"}
          </Btn>
          <input ref={fileRef} type="file" accept="video/*" hidden onChange={onUpload} data-testid="video-upload-input" />
        </div>
      </div>
      <div className="flex gap-1">
        <input
          value={urlDraft}
          onChange={(e) => setUrlDraft(e.target.value)}
          placeholder="Paste a video URL"
          aria-label="Video URL"
          className={inputCls}
          data-testid="video-url-input"
        />
        <Btn onClick={() => { if (urlDraft.trim()) { commit(urlDraft.trim()); setUrlDraft(""); } }} title="Use URL" testId="video-url-apply" disabled={capturing}>Set</Btn>
      </div>
      <div className="text-[10px] text-[#6B6353]">Poster image is captured automatically from the video's first frame.</div>
    </div>
  );
};

// ============================================================
// GENERIC CONTENT EDITOR — the safety-net editor for any block that
// isn't one of the bespoke kinds above (hero / CTA / card / feature
// sections, or anything detectBlockKind returns null for, including
// bare text). It walks the fragment for editable text nodes (h1-h6,
// p, li), links (<a>), buttons, and images (<img>), exposing each as
// a labeled field. Edits rewrite that one node in place by character
// offset, so duplicate markup never collides. Pure helpers are
// exported for unit testing without rendering React.
// ============================================================

const EDITABLE_RE = /<(h[1-6]|p|li|button|a|img)\b([^>]*)(?:>([\s\S]*?)<\/\1>|[\s/]*>)/gi;

const stripTags = (s) => String(s ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
const decodeEntities = (s) => String(s ?? "")
  .replace(/&nbsp;/g, " ")
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/&amp;/g, "&");

const headingLabel = (t) =>
  t === "h1" ? "Heading 1" : t === "h2" ? "Heading 2" : t === "h3" ? "Heading 3" :
  t === "h4" ? "Heading 4" : t === "h5" ? "Heading 5" : t === "h6" ? "Heading 6" :
  t === "li" ? "List item" : "Paragraph";

export const parseEditableNodes = (html, limit = 24) => {
  if (!html) return [];
  const out = [];
  EDITABLE_RE.lastIndex = 0;
  let m;
  while ((m = EDITABLE_RE.exec(html)) && out.length < limit) {
    const tag = m[1];
    const outer = m[0];
    const inner = m[3] ?? "";
    const node = { id: out.length, tag, outer, start: m.index };
    if (tag.toLowerCase() === "img") {
      node.kind = "image";
      node.src = readFirstAttr(outer, "src");
      node.alt = readFirstAttr(outer, "alt");
      node.label = "Image";
    } else if (tag.toLowerCase() === "a") {
      node.kind = "link";
      node.href = readFirstAttr(outer, "href");
      node.text = decodeEntities(stripTags(inner));
      node.label = node.text || "Link";
    } else if (tag.toLowerCase() === "button") {
      node.kind = "button";
      node.text = decodeEntities(stripTags(inner));
      node.label = node.text || "Button";
    } else {
      node.kind = "text";
      node.text = decodeEntities(stripTags(inner));
      node.label = headingLabel(tag.toLowerCase());
    }
    out.push(node);
  }
  return out;
};

const rebuildContainer = (outer, tag, text) => {
  const openTag = (outer.match(/^<[^>]*>/) || [""])[0];
  return `${openTag}${escTextLocal(text)}</${tag}>`;
};

const rebuildLink = (outer, href, text) => {
  const openTag = (outer.match(/^<[^>]*>/) || [""])[0];
  const withHref = readFirstAttr(openTag, "href") !== ""
    ? openTag.replace(/(href=")[^"]*(")/i, `$1${escAttrLocal(href)}$2`)
    : openTag.replace(/^<a\b/i, `<a href="${escAttrLocal(href)}"`);
  return `${withHref}${escTextLocal(text)}</a>`;
};

const rebuildImg = (outer, src, alt) => {
  let next = outer;
  if (/\bsrc="/i.test(next)) next = next.replace(/(src=")[^"]*(")/i, `$1${escAttrLocal(src)}$2`);
  else next = next.replace(/<img\b/i, `<img src="${escAttrLocal(src)}"`);
  if (/\balt="/i.test(next)) next = next.replace(/(alt=")[^"]*(")/i, `$1${escAttrLocal(alt)}$2`);
  else next = next.replace(/<img\b/i, `<img alt="${escAttrLocal(alt)}"`);
  return next;
};

export const setEditableNode = (html, id, patch) => {
  const nodes = parseEditableNodes(html);
  const node = nodes[id];
  if (!node) return html;
  let newOuter;
  if (node.tag.toLowerCase() === "img") newOuter = rebuildImg(node.outer, patch.src ?? node.src, patch.alt ?? node.alt);
  else if (node.tag.toLowerCase() === "a") newOuter = rebuildLink(node.outer, patch.href ?? node.href, patch.text ?? node.text);
  else if (node.tag.toLowerCase() === "button") newOuter = rebuildContainer(node.outer, "button", patch.text ?? node.text);
  else newOuter = rebuildContainer(node.outer, node.tag, patch.text ?? node.text);
  return html.slice(0, node.start) + newOuter + html.slice(node.start + node.outer.length);
};

const GenericBlockEditor = ({ html, onChange, projectId = null, blockId = null }) => {
  const nodes = useMemo(() => parseEditableNodes(html), [html]);
  const fileInputs = useRef({});
  if (nodes.length === 0) {
    return (
      <div className="text-[11px] text-[#948C79]" data-testid="block-edit-generic-empty">
        No editable text, links, or images detected in this block.
      </div>
    );
  }
  const onUpload = async (id, e) => {
    const file = (e.target.files || [])[0];
    e.target.value = "";
    if (!file) return;
    let url;
    if (!projectId) {
      url = await readAsDataURL(file);
    } else {
      try {
        const fd = new FormData();
        fd.append("file", file);
        const API = process.env.REACT_APP_BACKEND_URL || "";
        const res = await fetch(`${API}/api/projects/${projectId}/assets/upload?asset_type=image&asset_id=${encodeURIComponent(blockId || "1")}`, { method: "POST", body: fd });
        if (!res.ok) throw new Error(`upload failed (${res.status})`);
        const data = await res.json();
        if (!data.success) throw new Error(data.detail || "upload failed");
        url = data.url;
      } catch {
        url = await readAsDataURL(file);
      }
    }
    onChange(setEditableNode(html, id, { src: url, alt: baseName(file.name) }));
  };
  return (
    <div className="space-y-2" data-testid="block-edit-generic">
      {nodes.map((n) => (
        <div key={n.id} className="space-y-1 p-1.5 rounded border border-[#332D22]" data-testid={`generic-node-${n.id}`}>
          <div className={labelCls}>{n.label}</div>
          {n.kind === "image" ? (
            <>
              <div className="flex items-center gap-2">
                {n.src ? <img src={n.src} alt="" className="w-10 h-10 object-cover rounded flex-none border border-[#332D22]" /> : null}
                <div className="flex-1 flex gap-1">
                  <Btn onClick={() => fileInputs.current[n.id]?.click()} title="Upload image" testId={`generic-upload-${n.id}`}><Upload size={11} /> Upload</Btn>
                  <input ref={(el) => { fileInputs.current[n.id] = el; }} type="file" accept="image/*" hidden onChange={(e) => onUpload(n.id, e)} data-testid={`generic-upload-input-${n.id}`} />
                </div>
              </div>
              <input value={n.src} aria-label={`${n.label} URL`} className={inputCls} data-testid={`generic-src-${n.id}`} onChange={(e) => onChange(setEditableNode(html, n.id, { src: e.target.value }))} />
              <input value={n.alt} placeholder="alt text" aria-label={`${n.label} alt`} className={inputCls} data-testid={`generic-alt-${n.id}`} onChange={(e) => onChange(setEditableNode(html, n.id, { alt: e.target.value }))} />
            </>
          ) : n.kind === "link" ? (
            <>
              <input value={n.text} aria-label={`${n.label} text`} className={inputCls} data-testid={`generic-text-${n.id}`} onChange={(e) => onChange(setEditableNode(html, n.id, { text: e.target.value }))} />
              <input value={n.href} aria-label={`${n.label} URL`} className={inputCls} data-testid={`generic-href-${n.id}`} onChange={(e) => onChange(setEditableNode(html, n.id, { href: e.target.value }))} />
            </>
          ) : (
            <input value={n.text} aria-label={`${n.label} text`} className={inputCls} data-testid={`generic-text-${n.id}`} onChange={(e) => onChange(setEditableNode(html, n.id, { text: e.target.value }))} />
          )}
        </div>
      ))}
    </div>
  );
};

// ============================================================
// Root — renders the right editor for the selected block kind.
// ============================================================

const KIND_LABELS = { gallery: "Gallery", navbar: "Navbar", timeline: "Timeline", bento: "Bento Box", image: "Image", video: "Video", hero: "Hero", cta: "Call to Action", card: "Cards" };
const GENERIC_KINDS = new Set(["hero", "cta", "card", null]);

export const BlockEditMenu = ({ selectedHtml, onChange, pages = [], projectId = null, blockId = null }) => {
  const kind = useMemo(() => detectBlockKind(selectedHtml), [selectedHtml]);
  if (!selectedHtml) return null;
  const menuKey = kind || "generic";
  return (
    <div className="space-y-2" data-testid={`block-edit-menu-${menuKey}`}>
      <div className="text-[11px] font-semibold text-[#D9BC55]">{(kind && KIND_LABELS[kind]) || "Block"} — edit menu</div>
      {kind === "gallery" && <GalleryEditor html={selectedHtml} onChange={onChange} projectId={projectId} blockId={blockId} />}
      {kind === "navbar" && <NavbarEditor html={selectedHtml} onChange={onChange} pages={pages} />}
      {kind === "timeline" && <TimelineEditor html={selectedHtml} onChange={onChange} />}
      {kind === "bento" && <BentoEditor html={selectedHtml} onChange={onChange} />}
      {kind === "image" && <ImageBlockEditor html={selectedHtml} onChange={onChange} projectId={projectId} blockId={blockId} />}
      {kind === "video" && <VideoBlockEditor html={selectedHtml} onChange={onChange} projectId={projectId} blockId={blockId} />}
      {GENERIC_KINDS.has(kind) && <GenericBlockEditor html={selectedHtml} onChange={onChange} projectId={projectId} blockId={blockId} />}
    </div>
  );
};


// ============================================================
// NAVBAR EDITOR (variants + dropdowns + page linking)
// ============================================================

/** Recursive editor rows for one nav node (+ its submenu). Implemented as
 * a hoisted, hook-free function whose recursion goes through a plain call —
 * a self-referential <NavNodeRows/> JSX element trips an infinite traversal
 * in babel-jest's transform pipeline. Page-picker state lives in the parent
 * NavbarEditor (keyed by item path) to keep this function hook-free. */
function navNodeRow({ node, path, commit, pages, pickerPath, onOpenPicker }) {
  const patch = (fields) => commit(path, fields);
  return (
    <div className="p-1.5 rounded border border-[#332D22] space-y-1" style={{ marginLeft: (path.length - 1) * 8 }}>
      <div className="flex gap-1">
        <input
          value={node.label}
          placeholder="Label"
          aria-label={`Nav item label${path.length > 1 ? " (submenu)" : ""}`}
          className={inputCls}
          data-testid={`navbar-item-label-${path.join("-")}`}
          onChange={(e) => patch({ label: e.target.value })}
        />
        <Btn
          onClick={() => commit(path, { children: [...(node.children || []), { label: "Sub item", href: "#", children: [] }] })}
          title="Add submenu item"
          testId={`navbar-add-sub-${path.join("-")}`}
        ><Plus size={11} /></Btn>
        <Btn onClick={() => commit(path, null)} title="Remove nav item" testId={`navbar-remove-${path.join("-")}`}><Trash2 size={11} /></Btn>
      </div>
      <div className="flex gap-1">
        <input
          value={node.href}
          placeholder="Link (#, URL, or pick a page)"
          aria-label={`Nav item link${path.length > 1 ? " (submenu)" : ""}`}
          className={inputCls}
          data-testid={`navbar-item-href-${path.join("-")}`}
          onChange={(e) => patch({ href: e.target.value })}
        />
        <Btn onClick={() => onOpenPicker(path)} title="Pick page or URL" testId={`navbar-pick-page-${path.join("-")}`}>📄</Btn>
      </div>
      {(node.children || []).length > 0 && (
        <div className="space-y-1 pl-2 border-l border-[#332D22]" data-testid={`navbar-submenu-${path.join("-")}`}>
          {node.children.map((child, ci) => navNodeRow({ node: child, path: [...path, ci], commit, pages, pickerPath, onOpenPicker }))}
        </div>
      )}
    </div>
  );
}

export const NavbarEditor = ({ html, onChange, pages = [] }) => {
  const tree = useMemo(() => parseNavbarTree(html), [html]);
  const items = tree.items;
  const brand = tree.brand;
  const [pickerPath, setPickerPath] = useState(null);

  // Immutably apply a change at [topIdx, subIdx, ...]; fields===null removes.
  const commitPath = (path, fields) => {
    const apply = (nodes, depth) => nodes.map((n, i) => {
      if (i !== path[depth]) return n;
      if (fields === null) return null;
      const next = { ...n, ...fields };
      if (depth < path.length - 1) next.children = apply(n.children || [], depth + 1).filter(Boolean);
      return next;
    });
    let nextItems = apply(items, 0).filter(Boolean);
    if (fields === null && path.length > 1) {
      // removal deeper in the tree — prune empty parents' children lists
      nextItems = nextItems.map((n) => ({ ...n, children: (n.children || []).map((c) => ({ ...c, children: (c.children || []).filter(Boolean) })) }));
    }
    onChange(setNavbarItems(html, nextItems));
  };

  return (
    <div className="space-y-2" data-testid="block-edit-navbar">
      <div>
        <div className={`${labelCls} mb-1`}>Navbar style</div>
        <select
          value={tree.variant}
          aria-label="Navbar style"
          className={inputCls}
          data-testid="navbar-variant-select"
          onChange={(e) => onChange(setNavbarVariant(html, e.target.value))}
        >
          {NAVBAR_VARIANTS.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
        </select>
      </div>
      {brand !== "" && (
        <div>
          <div className={`${labelCls} mb-1`}>Brand</div>
          <input
            value={brand}
            aria-label="Brand text"
            className={inputCls}
            data-testid="navbar-brand-input"
            onChange={(e) => onChange(setNavBrand(html, e.target.value))}
          />
        </div>
      )}
      <div className="flex items-center justify-between">
        <span className={labelCls}>Nav items ({items.length})</span>
        <Btn
          onClick={() => onChange(setNavbarItems(html, [...items, { label: "New link", href: "#", children: [] }]))}
          title="Add nav item"
          testId="navbar-add-item"
        ><Plus size={11} /></Btn>
      </div>
      {items.map((item, i) => (
        navNodeRow({ node: item, path: [i], commit: commitPath, pages, pickerPath, onOpenPicker: setPickerPath })
      ))}
      {pickerPath && (
        <PagePickerModal
          pages={pages}
          onClose={() => setPickerPath(null)}
          onPick={(url) => { commitPath(pickerPath, { href: url }); setPickerPath(null); }}
        />
      )}
    </div>
  );
};

