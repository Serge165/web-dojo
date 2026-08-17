// CSS animation generator. Produces a keyframes block and animation
// shorthand string. All animations are @-scoped by a unique name so many can
// coexist on the same page.

export const ANIMATION_PRESETS = [
  {
    id: "fade-in",
    label: "Fade In",
    frames: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
  },
  {
    id: "slide-up",
    label: "Slide Up",
    frames: {
      "0%": { opacity: "0", transform: "translateY(24px)" },
      "100%": { opacity: "1", transform: "translateY(0)" },
    },
  },
  {
    id: "slide-down",
    label: "Slide Down",
    frames: {
      "0%": { opacity: "0", transform: "translateY(-24px)" },
      "100%": { opacity: "1", transform: "translateY(0)" },
    },
  },
  {
    id: "slide-left",
    label: "Slide Left",
    frames: {
      "0%": { opacity: "0", transform: "translateX(24px)" },
      "100%": { opacity: "1", transform: "translateX(0)" },
    },
  },
  {
    id: "zoom-in",
    label: "Zoom In",
    frames: {
      "0%": { opacity: "0", transform: "scale(0.9)" },
      "100%": { opacity: "1", transform: "scale(1)" },
    },
  },
  {
    id: "pop",
    label: "Pop",
    frames: {
      "0%": { transform: "scale(0.6)", opacity: "0" },
      "60%": { transform: "scale(1.05)" },
      "100%": { transform: "scale(1)", opacity: "1" },
    },
  },
  {
    id: "spin",
    label: "Spin",
    frames: { "0%": { transform: "rotate(0deg)" }, "100%": { transform: "rotate(360deg)" } },
  },
  {
    id: "float",
    label: "Float",
    frames: {
      "0%": { transform: "translateY(0)" },
      "50%": { transform: "translateY(-8px)" },
      "100%": { transform: "translateY(0)" },
    },
  },
  {
    id: "pulse",
    label: "Pulse",
    frames: {
      "0%": { transform: "scale(1)" },
      "50%": { transform: "scale(1.04)" },
      "100%": { transform: "scale(1)" },
    },
  },
];

export const buildKeyframes = (name, frames) => {
  const body = Object.entries(frames)
    .map(([k, v]) => `  ${k} { ${Object.entries(v).map(([p, val]) => `${p}: ${val}`).join("; ")} }`)
    .join("\n");
  return `@keyframes ${name} {\n${body}\n}`;
};

export const buildAnimationShorthand = ({ name, duration, timing, delay, iteration }) =>
  `${name} ${duration}s ${timing} ${delay}s ${iteration === "infinite" ? "infinite" : iteration} both`;
