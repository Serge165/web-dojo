import React, { useEffect, useLayoutEffect, useState } from "react";

const STORAGE_KEY = "webdojo.tour.done";

// Steps reference DOM elements by data-testid. `position` decides where the
// popover appears relative to the target rect.
const STEPS = [
  { id: "welcome", target: null, title: "Welcome to Web Dojo", body: "A 30-second tour of the parts you’ll use most. Skip anytime with Esc.", position: "center" },
  { id: "library", target: '[data-testid="left-tab-library"]', title: "1 · Library", body: "Drag any block onto the canvas or double-click to insert. Search the whole library from the top.", position: "right" },
  { id: "layout", target: '[data-testid="left-tab-layout"]', title: "2 · Layout", body: "Build Grid or Flex containers with real controls — Insert new or Wrap the selected element.", position: "right" },
  { id: "code", target: '[data-testid="mode-code"]', title: "3 · Code Mode", body: "Full Monaco editor with Emmet + 40+ language grammars. Head-html goes into every export.", position: "bottom" },
  { id: "share", target: '[data-testid="share-btn"]', title: "4 · Share", body: "One click copies a live preview URL you can send to anyone.", position: "bottom" },
  { id: "save", target: '[data-testid="save-btn"]', title: "5 · Save", body: "Cloud-saves your project so you can Open it back up any time.", position: "bottom" },
  { id: "done", target: null, title: "You’re ready", body: "Build fast, ship faster. You can restart this tour from the Help menu later.", position: "center" },
];

export const OnboardingTour = ({ force, onFinish }) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (force) { setStep(0); setOpen(true); return; }
    const done = typeof window !== "undefined" && window.localStorage?.getItem(STORAGE_KEY);
    if (!done) setOpen(true);
  }, [force]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") finish(); };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const finish = () => {
    setOpen(false);
    try { window.localStorage.setItem(STORAGE_KEY, "1"); } catch {}
    onFinish && onFinish();
  };

  if (!open) return null;
  const s = STEPS[step];

  return (
    <div className="fixed inset-0 z-[100]" data-testid="onboarding-tour">
      <div className="absolute inset-0 bg-black/60" onClick={finish} />
      {s.target ? <Spotlight selector={s.target} /> : null}
      <Popover
        step={s}
        index={step}
        total={STEPS.length}
        onNext={() => step < STEPS.length - 1 ? setStep(step + 1) : finish()}
        onBack={() => setStep(Math.max(0, step - 1))}
        onSkip={finish}
      />
    </div>
  );
};

// Highlights a specific data-testid element by punching a hole in the overlay
// via a positioned box with a large box-shadow.
const Spotlight = ({ selector }) => {
  const [rect, setRect] = useState(null);
  useLayoutEffect(() => {
    const measure = () => {
      const el = document.querySelector(selector);
      if (!el) { setRect(null); return; }
      const r = el.getBoundingClientRect();
      setRect({ top: r.top - 6, left: r.left - 6, width: r.width + 12, height: r.height + 12 });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [selector]);
  if (!rect) return null;
  return (
    <div
      className="absolute rounded-lg pointer-events-none"
      style={{
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        boxShadow: "0 0 0 9999px rgba(0,0,0,0.65), 0 0 0 2px #3b82f6, 0 0 40px rgba(59,130,246,0.6)",
      }}
    />
  );
};

const Popover = ({ step, index, total, onNext, onBack, onSkip }) => {
  const [pos, setPos] = useState({ top: "50%", left: "50%", transform: "translate(-50%, -50%)" });

  useLayoutEffect(() => {
    if (!step.target) {
      setPos({ top: "50%", left: "50%", transform: "translate(-50%, -50%)" });
      return;
    }
    const el = document.querySelector(step.target);
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (step.position === "right") setPos({ top: r.top + r.height / 2 - 60, left: r.right + 20, transform: "none" });
    else if (step.position === "bottom") setPos({ top: r.bottom + 16, left: Math.max(16, r.left + r.width / 2 - 160), transform: "none" });
    else if (step.position === "left") setPos({ top: r.top + r.height / 2 - 60, left: r.left - 340, transform: "none" });
    else setPos({ top: r.bottom + 16, left: r.left, transform: "none" });
  }, [step]);

  return (
    <div
      className="absolute w-[320px] rounded-lg border border-[#2B2B2B] bg-[#141414] shadow-2xl p-4 text-sm text-gray-100"
      style={pos}
      data-testid="tour-popover"
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="text-[10px] uppercase tracking-wider text-blue-400">Tour · {index + 1} / {total}</div>
        <button onClick={onSkip} className="text-[11px] text-gray-400 hover:text-white" data-testid="tour-skip">Skip</button>
      </div>
      <div className="text-base font-semibold mb-1">{step.title}</div>
      <p className="text-xs text-gray-400 leading-relaxed">{step.body}</p>
      <div className="flex items-center justify-between mt-3">
        <button
          onClick={onBack}
          disabled={index === 0}
          className="text-xs px-2.5 py-1 rounded bg-[#1F1F1F] hover:bg-[#2B2B2B] text-gray-200 disabled:opacity-30"
          data-testid="tour-back"
        >Back</button>
        <button
          onClick={onNext}
          className="text-xs px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white"
          data-testid="tour-next"
        >{index === total - 1 ? "Finish" : "Next"}</button>
      </div>
    </div>
  );
};
