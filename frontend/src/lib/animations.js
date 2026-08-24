// CSS animation generator. Produces a keyframes block and animation
// shorthand string. All animations are @-scoped by a unique name so many can
// coexist on the same page.

// category is display grouping only (AnimationGenerator.jsx) — it has no
// effect on the generated CSS. "exit" presets end on their hidden/offscreen
// frame; combined with buildAnimationShorthand's fill-mode:both that's what
// makes the element actually disappear after the animation plays once.
export const ANIMATION_PRESETS = [
  {
    id: "fade-in",
    label: "Fade In",
    category: "entrance",
    frames: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
  },
  {
    id: "slide-up",
    label: "Slide Up",
    category: "entrance",
    frames: {
      "0%": { opacity: "0", transform: "translateY(24px)" },
      "100%": { opacity: "1", transform: "translateY(0)" },
    },
  },
  {
    id: "slide-down",
    label: "Slide Down",
    category: "entrance",
    frames: {
      "0%": { opacity: "0", transform: "translateY(-24px)" },
      "100%": { opacity: "1", transform: "translateY(0)" },
    },
  },
  {
    id: "slide-left",
    label: "Slide Left",
    category: "entrance",
    frames: {
      "0%": { opacity: "0", transform: "translateX(24px)" },
      "100%": { opacity: "1", transform: "translateX(0)" },
    },
  },
  {
    id: "zoom-in",
    label: "Zoom In",
    category: "entrance",
    frames: {
      "0%": { opacity: "0", transform: "scale(0.9)" },
      "100%": { opacity: "1", transform: "scale(1)" },
    },
  },
  {
    id: "pop",
    label: "Pop",
    category: "entrance",
    frames: {
      "0%": { transform: "scale(0.6)", opacity: "0" },
      "60%": { transform: "scale(1.05)" },
      "100%": { transform: "scale(1)", opacity: "1" },
    },
  },
  {
    id: "bounce-in",
    label: "Bounce In",
    category: "entrance",
    frames: {
      "0%": { opacity: "0", transform: "scale(0.3)" },
      "50%": { opacity: "1", transform: "scale(1.05)" },
      "70%": { transform: "scale(0.9)" },
      "100%": { transform: "scale(1)" },
    },
  },
  {
    id: "roll-in",
    label: "Roll In",
    category: "entrance",
    frames: {
      "0%": { opacity: "0", transform: "translateX(-100%) rotate(-120deg)" },
      "100%": { opacity: "1", transform: "translateX(0) rotate(0deg)" },
    },
  },
  {
    id: "flip-in",
    label: "Flip In",
    category: "entrance",
    frames: {
      "0%": { opacity: "0", transform: "perspective(400px) rotateY(90deg)" },
      "40%": { transform: "perspective(400px) rotateY(-10deg)" },
      "70%": { transform: "perspective(400px) rotateY(10deg)" },
      "100%": { opacity: "1", transform: "perspective(400px) rotateY(0deg)" },
    },
  },
  {
    id: "light-speed-in",
    label: "Light Speed In",
    category: "entrance",
    frames: {
      "0%": { opacity: "0", transform: "translateX(100%) skewX(-30deg)" },
      "60%": { opacity: "1", transform: "skewX(20deg)" },
      "80%": { transform: "skewX(-5deg)" },
      "100%": { transform: "translateX(0) skewX(0)" },
    },
  },
  {
    id: "spin",
    label: "Spin",
    category: "emphasis",
    frames: { "0%": { transform: "rotate(0deg)" }, "100%": { transform: "rotate(360deg)" } },
  },
  {
    id: "float",
    label: "Float",
    category: "emphasis",
    frames: {
      "0%": { transform: "translateY(0)" },
      "50%": { transform: "translateY(-8px)" },
      "100%": { transform: "translateY(0)" },
    },
  },
  {
    id: "pulse",
    label: "Pulse",
    category: "emphasis",
    frames: {
      "0%": { transform: "scale(1)" },
      "50%": { transform: "scale(1.04)" },
      "100%": { transform: "scale(1)" },
    },
  },
  {
    id: "shake",
    label: "Shake",
    category: "emphasis",
    frames: {
      "0%": { transform: "translateX(0)" }, "10%": { transform: "translateX(-8px)" },
      "20%": { transform: "translateX(8px)" }, "30%": { transform: "translateX(-8px)" },
      "40%": { transform: "translateX(8px)" }, "50%": { transform: "translateX(-8px)" },
      "60%": { transform: "translateX(8px)" }, "70%": { transform: "translateX(-8px)" },
      "80%": { transform: "translateX(8px)" }, "90%": { transform: "translateX(-8px)" },
      "100%": { transform: "translateX(0)" },
    },
  },
  {
    id: "wobble",
    label: "Wobble",
    category: "emphasis",
    frames: {
      "0%": { transform: "translateX(0) rotate(0)" },
      "15%": { transform: "translateX(-12px) rotate(-5deg)" },
      "30%": { transform: "translateX(9px) rotate(3deg)" },
      "45%": { transform: "translateX(-7px) rotate(-3deg)" },
      "60%": { transform: "translateX(5px) rotate(2deg)" },
      "75%": { transform: "translateX(-3px) rotate(-1deg)" },
      "100%": { transform: "translateX(0) rotate(0)" },
    },
  },
  {
    id: "rubber-band",
    label: "Rubber Band",
    category: "emphasis",
    frames: {
      "0%": { transform: "scale(1, 1)" },
      "30%": { transform: "scale(1.25, 0.75)" },
      "40%": { transform: "scale(0.75, 1.25)" },
      "50%": { transform: "scale(1.15, 0.85)" },
      "65%": { transform: "scale(0.95, 1.05)" },
      "75%": { transform: "scale(1.05, 0.95)" },
      "100%": { transform: "scale(1, 1)" },
    },
  },
  {
    id: "heartbeat",
    label: "Heartbeat",
    category: "emphasis",
    frames: {
      "0%": { transform: "scale(1)" }, "14%": { transform: "scale(1.3)" },
      "28%": { transform: "scale(1)" }, "42%": { transform: "scale(1.3)" },
      "70%": { transform: "scale(1)" },
    },
  },
  {
    id: "fade-out",
    label: "Fade Out",
    category: "exit",
    frames: { "0%": { opacity: "1" }, "100%": { opacity: "0" } },
  },
  {
    id: "zoom-out",
    label: "Zoom Out",
    category: "exit",
    frames: {
      "0%": { opacity: "1", transform: "scale(1)" },
      "100%": { opacity: "0", transform: "scale(0.3)" },
    },
  },
  {
    id: "slide-out-up",
    label: "Slide Out Up",
    category: "exit",
    frames: {
      "0%": { opacity: "1", transform: "translateY(0)" },
      "100%": { opacity: "0", transform: "translateY(-40px)" },
    },
  },
  {
    id: "fly-out-down",
    label: "Fly Out Down",
    category: "exit",
    frames: {
      "0%": { opacity: "1", transform: "translateY(0) scale(1)" },
      "100%": { opacity: "0", transform: "translateY(60px) scale(0.5)" },
    },
  },
  // "on-scroll" presets reuse familiar entrance-style motion, but the
  // trigger is different: an entrance preset plays once, immediately, via
  // a plain `animation:` shorthand baked into the element's own inline
  // style. An on-scroll preset instead starts the element hidden and only
  // plays once it scrolls into view — see buildOnScrollCss/
  // buildOnScrollBootstrapScript below for how that's wired.
  {
    id: "onscroll-fade-in",
    label: "Fade In",
    category: "on-scroll",
    frames: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
  },
  {
    id: "onscroll-slide-up",
    label: "Slide Up",
    category: "on-scroll",
    frames: {
      "0%": { opacity: "0", transform: "translateY(32px)" },
      "100%": { opacity: "1", transform: "translateY(0)" },
    },
  },
  {
    id: "onscroll-slide-left",
    label: "Slide In Left",
    category: "on-scroll",
    frames: {
      "0%": { opacity: "0", transform: "translateX(-40px)" },
      "100%": { opacity: "1", transform: "translateX(0)" },
    },
  },
  {
    id: "onscroll-zoom-in",
    label: "Zoom In",
    category: "on-scroll",
    frames: {
      "0%": { opacity: "0", transform: "scale(0.85)" },
      "100%": { opacity: "1", transform: "scale(1)" },
    },
  },
];

export const ANIMATION_CATEGORIES = [
  { id: "entrance", label: "Entrance" },
  { id: "emphasis", label: "Emphasis" },
  { id: "exit", label: "Exit" },
  { id: "on-scroll", label: "On Scroll" },
];

// ---------- Animation library presets ----------
// Each library (GSAP / Framer Motion / CSS) gets 3 entrance, 3 exit, and
// 3 on-scroll presets. These are used by AnimationGenerator.jsx's library
// selector to generate library-specific animation code.

export const ANIMATION_LIBRARIES = [
  { id: "gsap", label: "GSAP" },
  { id: "framer", label: "Framer Motion" },
  { id: "css", label: "CSS only" },
];

// GSAP presets — produce gsap.to() / gsap.from() code
export const GSAP_PRESETS = {
  entrance: [
    { id: "gsap-fade-up", label: "Fade Up", code: (el) => `gsap.from("${el}", { opacity: 0, y: 40, duration: 0.8, ease: "power3.out" });` },
    { id: "gsap-scale-in", label: "Scale In", code: (el) => `gsap.from("${el}", { opacity: 0, scale: 0.8, duration: 0.7, ease: "back.out(1.7)" });` },
    { id: "gsap-slide-left", label: "Slide Left", code: (el) => `gsap.from("${el}", { opacity: 0, x: -60, duration: 0.8, ease: "power2.out" });` },
  ],
  exit: [
    { id: "gsap-fade-out", label: "Fade Out", code: (el) => `gsap.to("${el}", { opacity: 0, duration: 0.5, ease: "power2.in" });` },
    { id: "gsap-scale-out", label: "Scale Out", code: (el) => `gsap.to("${el}", { opacity: 0, scale: 0.5, duration: 0.5, ease: "back.in(1.7)" });` },
    { id: "gsap-slide-out", label: "Slide Out", code: (el) => `gsap.to("${el}", { opacity: 0, x: 80, duration: 0.6, ease: "power2.in" });` },
  ],
  "on-scroll": [
    { id: "gsap-scroll-fade", label: "Scroll Fade", code: (el) => `gsap.from("${el}", { opacity: 0, scrollTrigger: { trigger: "${el}", start: "top 80%" } });` },
    { id: "gsap-scroll-up", label: "Scroll Up", code: (el) => `gsap.from("${el}", { opacity: 0, y: 60, scrollTrigger: { trigger: "${el}", start: "top 80%" } });` },
    { id: "gsap-scroll-stagger", label: "Scroll Stagger", code: (el) => `gsap.from("${el} > *", { opacity: 0, y: 30, stagger: 0.1, scrollTrigger: { trigger: "${el}", start: "top 80%" } });` },
  ],
};

// Framer Motion presets — produce motion component props
export const FRAMER_PRESETS = {
  entrance: [
    { id: "framer-fade-up", label: "Fade Up", code: () => `initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}` },
    { id: "framer-scale", label: "Scale In", code: () => `initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, type: "spring" }}` },
    { id: "framer-slide", label: "Slide In", code: () => `initial={{ opacity: 0, x: -60 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}` },
  ],
  exit: [
    { id: "framer-fade-out", label: "Fade Out", code: () => `exit={{ opacity: 0 }} transition={{ duration: 0.5 }}` },
    { id: "framer-scale-out", label: "Scale Out", code: () => `exit={{ opacity: 0, scale: 0.5 }} transition={{ duration: 0.5 }}` },
    { id: "framer-slide-out", label: "Slide Out", code: () => `exit={{ opacity: 0, x: 80 }} transition={{ duration: 0.6 }}` },
  ],
  "on-scroll": [
    { id: "framer-whileinview", label: "While In View", code: () => `initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}` },
    { id: "framer-inview-up", label: "In View Up", code: () => `initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}` },
    { id: "framer-inview-stagger", label: "In View Stagger", code: () => `initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ staggerChildren: 0.1 }}` },
  ],
};

// Build library-specific animation code for a given library + category + preset
export const buildLibraryAnimation = ({ library, category, presetId, elementSelector }) => {
  if (library === "gsap") {
    const preset = (GSAP_PRESETS[category] || []).find((p) => p.id === presetId);
    if (!preset) return "";
    return preset.code(elementSelector || ".forge-anim");
  }
  if (library === "framer") {
    const preset = (FRAMER_PRESETS[category] || []).find((p) => p.id === presetId);
    if (!preset) return "";
    return preset.code();
  }
  // CSS fallback — use the existing keyframes system
  const preset = ANIMATION_PRESETS.find((p) => p.id === presetId);
  if (!preset) return "";
  const name = `forge_${preset.id.replace(/-/g, "_")}`;
  return `${buildKeyframes(name, preset.frames)}\n\n.forge-anim { animation: ${buildAnimationShorthand({ name, duration: 0.7, timing: "cubic-bezier(0.22, 1, 0.36, 1)", delay: 0, iteration: "1" })}; }`;
};

export const buildKeyframes = (name, frames) => {
  const body = Object.entries(frames)
    .map(([k, v]) => `  ${k} { ${Object.entries(v).map(([p, val]) => `${p}: ${val}`).join("; ")} }`)
    .join("\n");
  return `@keyframes ${name} {\n${body}\n}`;
};

export const buildAnimationShorthand = ({ name, duration, timing, delay, iteration }) =>
  `${name} ${duration}s ${timing} ${delay}s ${iteration === "infinite" ? "infinite" : iteration} both`;

// On-scroll CSS for one element: the @keyframes (identical shape to a
// regular preset's), a starting-state rule scoped to a .wd-onscroll-hidden
// class (so the element renders normally — no flash-of-invisible — in any
// context where the bootstrap script below never runs, e.g. the Design
// canvas's dangerouslySetInnerHTML rendering, which doesn't execute
// <script> tags at all, same documented limitation as this codebase's
// other script-driven blocks), and a .wd-inview rule that actually plays
// the animation once the bootstrap script adds that class on intersection.
// Targets [data-forge-el-id="..."] — the caller must have already stamped
// that attribute onto the element (addAttrToFirstTag in Builder.jsx).
export const buildOnScrollCss = ({ name, elementId, frames, duration, timing, delay, iteration }) => {
  const keyframes = buildKeyframes(name, frames);
  const shorthand = buildAnimationShorthand({ name, duration, timing, delay, iteration });
  const initial = frames["0%"] || {};
  const initialDecls = Object.entries(initial).map(([p, v]) => `${p}: ${v};`).join(" ");
  return `${keyframes}
.wd-onscroll-hidden[data-forge-el-id="${elementId}"] { ${initialDecls} }
.wd-inview[data-forge-el-id="${elementId}"] { animation: ${shorthand}; }`;
};

// One shared, content-identical script — injected once per page (callers
// check ONSCROLL_BOOTSTRAP_MARKER before appending, not once per element)
// regardless of how many on-scroll animations that page uses. Falls back
// to revealing everything immediately if IntersectionObserver isn't
// available, so a very old browser degrades to "always visible" rather
// than "permanently hidden".
export const ONSCROLL_BOOTSTRAP_MARKER = "data-forge-onscroll-script";
export const buildOnScrollBootstrapScript = () => `<script ${ONSCROLL_BOOTSTRAP_MARKER}="1">
document.addEventListener('DOMContentLoaded', function () {
  var els = document.querySelectorAll('[data-wd-onscroll]');
  if (!els.length) return;
  if (!('IntersectionObserver' in window)) {
    els.forEach(function (el) { el.classList.add('wd-inview'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.remove('wd-onscroll-hidden');
        entry.target.classList.add('wd-inview');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });
  els.forEach(function (el) {
    el.classList.add('wd-onscroll-hidden');
    io.observe(el);
  });
});
</script>`;

// Builds everything needed to apply one animation config to one element —
// the single source of truth Builder.jsx's applyAnimation (single-select)
// and applyAnimationToIds (multi-select batch apply) both call, so the
// on-scroll/regular branch only has to be written once. Each call gets a
// fresh unique keyframes name so applying the same preset to many
// elements (or re-applying to one) never collides.
export const buildAppliedAnimation = ({ elementId, preset, duration, delay, timing, iteration }) => {
  const uniqueName = `forge_${preset.id.replace(/-/g, "_")}_${Math.random().toString(36).slice(2, 8)}`;
  if (preset.category === "on-scroll") {
    return {
      onScroll: true,
      styleBlock: buildOnScrollCss({ name: uniqueName, elementId, frames: preset.frames, duration, timing, delay, iteration }),
    };
  }
  return {
    onScroll: false,
    styleBlock: buildKeyframes(uniqueName, preset.frames),
    shorthand: buildAnimationShorthand({ name: uniqueName, duration, timing, delay, iteration }),
  };
};
