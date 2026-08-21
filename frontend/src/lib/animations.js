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
];

export const ANIMATION_CATEGORIES = [
  { id: "entrance", label: "Entrance" },
  { id: "emphasis", label: "Emphasis" },
  { id: "exit", label: "Exit" },
];

export const buildKeyframes = (name, frames) => {
  const body = Object.entries(frames)
    .map(([k, v]) => `  ${k} { ${Object.entries(v).map(([p, val]) => `${p}: ${val}`).join("; ")} }`)
    .join("\n");
  return `@keyframes ${name} {\n${body}\n}`;
};

export const buildAnimationShorthand = ({ name, duration, timing, delay, iteration }) =>
  `${name} ${duration}s ${timing} ${delay}s ${iteration === "infinite" ? "infinite" : iteration} both`;
