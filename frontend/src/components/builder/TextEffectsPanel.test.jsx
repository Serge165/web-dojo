import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import { TextEffectsPanel } from "./TextEffectsPanel";
import { getFxClip, setFxClip } from "@/lib/fxClipboard";

jest.mock("sonner", () => ({ toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() } }));
import { toast } from "sonner";

const noop = () => {};
const baseProps = (overrides = {}) => ({
  selected: null,
  onPatch: jest.fn(),
  onApplyAnimation: jest.fn(),
  onReplaceHtml: jest.fn(),
  headHtml: "",
  onHeadHtmlChange: jest.fn(),
  ...overrides,
});

beforeEach(() => {
  localStorage.clear();
  // Skip the starter-style seed by default so library tests start from a
  // known, empty state; the seeding behavior itself gets its own test.
  localStorage.setItem("webdojo_style_library_seeded", "1");
  localStorage.setItem("webdojo_style_library", "[]");
  setFxClip(null);
  jest.clearAllMocks();
});
afterEach(cleanup);

test("shows a hint to select an element when nothing is selected", () => {
  render(<TextEffectsPanel {...baseProps()} />);
  expect(screen.getByText(/Select a heading or text element/i)).toBeInTheDocument();
});

test("clicking a fill/stroke chip without a selection warns instead of patching", () => {
  const props = baseProps();
  render(<TextEffectsPanel {...props} />);
  fireEvent.click(screen.getByTestId("textfx-static-sunset"));
  expect(toast.info).toHaveBeenCalled();
  expect(props.onPatch).not.toHaveBeenCalled();
});

test("clicking a fill/stroke chip with a selection applies its patch", () => {
  const props = baseProps({ selected: { html: "<h1>Hi</h1>" } });
  render(<TextEffectsPanel {...props} />);
  fireEvent.click(screen.getByTestId("textfx-static-sunset"));
  expect(props.onPatch).toHaveBeenCalledWith(
    expect.objectContaining({ "background-image": "linear-gradient(90deg,#ff6b6b,#feca57,#ff9ff3)" })
  );
});

test("animated fx applies its patch and registers keyframes via onApplyAnimation", () => {
  const props = baseProps({ selected: { html: "<h1>Hi</h1>" } });
  render(<TextEffectsPanel {...props} />);
  fireEvent.click(screen.getByTestId("textfx-anim-shimmer"));
  expect(props.onPatch).toHaveBeenCalledWith(expect.objectContaining({ "background-size": "200% auto" }));
  expect(props.onApplyAnimation).toHaveBeenCalledTimes(1);
  const arg = props.onApplyAnimation.mock.calls[0][0];
  expect(arg.keyframes).toMatch(/@keyframes wdtfx_shimmer_\w+\{0%\{background-position:0% 50%\}100%\{background-position:200% 50%\}\}/);
  expect(arg.shorthand).toMatch(/^wdtfx_shimmer_\w+ 3s linear infinite$/);
});

test("hover fx adds a scoped class to the element and a matching hover rule to headHtml", () => {
  const props = baseProps({ selected: { html: "<h1>Hi</h1>" } });
  render(<TextEffectsPanel {...props} />);
  fireEvent.click(screen.getByTestId("textfx-hover-pop"));
  expect(props.onReplaceHtml).toHaveBeenCalledTimes(1);
  const newHtml = props.onReplaceHtml.mock.calls[0][0];
  expect(newHtml).toMatch(/class="wd-tfx-\w+"/);
  const cls = newHtml.match(/wd-tfx-\w+/)[0];
  expect(props.onHeadHtmlChange).toHaveBeenCalledWith(expect.stringContaining(`<style data-wd-tfx="${cls}">`));
  expect(props.onHeadHtmlChange).toHaveBeenCalledWith(expect.stringContaining("color:#6366f1"));
});

test("remove-hover strips the scoped class and its style block", () => {
  const cls = "wd-tfx-abc12";
  const props = baseProps({
    selected: { html: `<h1 class="${cls}">Hi</h1>` },
    headHtml: `<style data-wd-tfx="${cls}">.${cls}{transition:all .25s ease;}.${cls}:hover{color:#6366f1;}</style>`,
  });
  render(<TextEffectsPanel {...props} />);
  fireEvent.click(screen.getByTestId("textfx-hover-clear"));
  expect(props.onReplaceHtml).toHaveBeenCalledWith(expect.not.stringContaining(cls));
  expect(props.onHeadHtmlChange).toHaveBeenCalledWith("");
});

test("remove-hover is disabled when the element has no hover effect", () => {
  render(<TextEffectsPanel {...baseProps({ selected: { html: "<h1>Hi</h1>" } })} />);
  expect(screen.getByTestId("textfx-hover-clear")).toBeDisabled();
});

test("clear text FX resets fill/stroke/shadow/animation to neutral", () => {
  const props = baseProps({ selected: { html: "<h1>Hi</h1>" } });
  render(<TextEffectsPanel {...props} />);
  fireEvent.click(screen.getByTestId("textfx-clear"));
  expect(props.onPatch).toHaveBeenCalledWith(expect.objectContaining({ "text-shadow": "none", animation: "none", color: "inherit" }));
});

test("outline apply uses the chosen color and thickness", () => {
  const props = baseProps({ selected: { html: "<h1>Hi</h1>" } });
  render(<TextEffectsPanel {...props} />);
  fireEvent.change(screen.getByTestId("textfx-outline-color"), { target: { value: "#112233" } });
  fireEvent.change(screen.getByTestId("textfx-outline-thickness"), { target: { value: "5" } });
  fireEvent.click(screen.getByTestId("textfx-outline-apply"));
  expect(props.onPatch).toHaveBeenCalledWith({
    "-webkit-text-stroke": "5px #112233",
    color: "transparent",
    "-webkit-text-fill-color": "transparent",
    "paint-order": "stroke fill",
  });
});

test("directional shadow apply converts angle/distance into an x/y offset", () => {
  const props = baseProps({ selected: { html: "<h1>Hi</h1>" } });
  render(<TextEffectsPanel {...props} />);
  fireEvent.change(screen.getByTestId("textfx-shadow-angle"), { target: { value: "90" } });
  fireEvent.change(screen.getByTestId("textfx-shadow-distance"), { target: { value: "10" } });
  fireEvent.change(screen.getByTestId("textfx-shadow-blur"), { target: { value: "3" } });
  fireEvent.change(screen.getByTestId("textfx-shadow-color"), { target: { value: "#ff0000" } });
  fireEvent.click(screen.getByTestId("textfx-shadow-apply"));
  expect(props.onPatch).toHaveBeenCalledWith({ "text-shadow": "0px 10px 3px #ff0000" });
});

test("3D tilt apply sets a perspective rotateX transform", () => {
  const props = baseProps({ selected: { html: "<h1>Hi</h1>" } });
  render(<TextEffectsPanel {...props} />);
  fireEvent.change(screen.getByTestId("textfx-tilt-depth"), { target: { value: "45" } });
  fireEvent.click(screen.getByTestId("textfx-tilt-apply"));
  expect(props.onPatch).toHaveBeenCalledWith({ transform: "perspective(500px) rotateX(45deg)", "transform-origin": "center bottom" });
});

test("reflection apply sets a box-reflect gradient scaled by distance/opacity", () => {
  const props = baseProps({ selected: { html: "<h1>Hi</h1>" } });
  render(<TextEffectsPanel {...props} />);
  fireEvent.change(screen.getByTestId("textfx-reflect-distance"), { target: { value: "8" } });
  fireEvent.change(screen.getByTestId("textfx-reflect-opacity"), { target: { value: "0.5" } });
  fireEvent.click(screen.getByTestId("textfx-reflect-apply"));
  expect(props.onPatch).toHaveBeenCalledWith({ "-webkit-box-reflect": "below 8px linear-gradient(transparent, rgba(255,255,255,0.5))" });
});

test("copy style reads the root tag's own style props into the shared clipboard", () => {
  const html = '<h1 style="background-image:linear-gradient(90deg,#fff,#000);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent">Hi</h1>';
  const props = baseProps({ selected: { html } });
  render(<TextEffectsPanel {...props} />);
  fireEvent.click(screen.getByTestId("textfx-copy"));
  expect(toast.success).toHaveBeenCalledWith("Style copied");
  expect(getFxClip().style["background-image"]).toBe("linear-gradient(90deg,#fff,#000)");
});

test("copy style refuses an element with no meaningful effect or shape", () => {
  const props = baseProps({ selected: { html: "<h1>Plain</h1>" } });
  render(<TextEffectsPanel {...props} />);
  fireEvent.click(screen.getByTestId("textfx-copy"));
  expect(toast.info).toHaveBeenCalled();
  expect(getFxClip()).toBeNull();
});

test("paste style merges the clipboard's style props onto the selected element", () => {
  setFxClip({ style: { "background-image": "linear-gradient(90deg,#fff,#000)" }, hover: [] });
  const props = baseProps({ selected: { html: "<h1>Plain</h1>" } });
  render(<TextEffectsPanel {...props} />);
  fireEvent.click(screen.getByTestId("textfx-paste"));
  expect(props.onReplaceHtml).toHaveBeenCalledWith(expect.stringContaining("background-image:linear-gradient(90deg,#fff,#000)"));
});

test("paste is disabled until something has been copied", () => {
  render(<TextEffectsPanel {...baseProps({ selected: { html: "<h1>Hi</h1>" } })} />);
  expect(screen.getByTestId("textfx-paste")).toBeDisabled();
});

test("style library: save persists the current clip, then delete removes it", () => {
  setFxClip({ style: { color: "red" }, hover: [] });
  render(<TextEffectsPanel {...baseProps()} />);
  fireEvent.change(screen.getByTestId("style-lib-name"), { target: { value: "My Style" } });
  fireEvent.click(screen.getByTestId("style-lib-save"));
  expect(screen.getByText("My Style")).toBeInTheDocument();
  const saved = JSON.parse(localStorage.getItem("webdojo_style_library"));
  expect(saved).toHaveLength(1);
  expect(saved[0]).toMatchObject({ name: "My Style", style: { color: "red" } });

  fireEvent.click(screen.getByTestId(`style-lib-delete-${saved[0].id}`));
  expect(screen.queryByText("My Style")).not.toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem("webdojo_style_library"))).toHaveLength(0);
});

test("applying a library entry to a selected element merges its style and reports success", () => {
  localStorage.setItem("webdojo_style_library", JSON.stringify([
    { id: "lib-1", name: "Saved Gold", category: "Uncategorized", style: { color: "gold" }, hover: [] },
  ]));
  const props = baseProps({ selected: { html: "<h1>Hi</h1>" } });
  render(<TextEffectsPanel {...props} />);
  fireEvent.click(screen.getByTestId("style-lib-lib-1"));
  expect(props.onReplaceHtml).toHaveBeenCalledWith(expect.stringContaining("color:gold"));
  expect(toast.success).toHaveBeenCalledWith('Applied "Saved Gold"');
});

test("first mount with no stored library seeds the starter style pack", () => {
  localStorage.clear();
  render(<TextEffectsPanel {...baseProps()} />);
  expect(localStorage.getItem("webdojo_style_library_seeded")).toBe("1");
  const stored = JSON.parse(localStorage.getItem("webdojo_style_library"));
  expect(stored.length).toBeGreaterThan(0);
  expect(stored.some((s) => s.id.startsWith("starter-"))).toBe(true);
});
