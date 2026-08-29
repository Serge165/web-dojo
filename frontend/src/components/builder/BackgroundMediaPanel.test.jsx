import React from "react";
import { render, fireEvent } from "@testing-library/react";
import { BackgroundMediaPanel } from "./BackgroundMediaPanel";

const selected = { id: "el_1", html: '<section style="padding:8px;">Hero</section>' };
const setup = () => {
  const onPatch = jest.fn();
  const utils = render(
    <BackgroundMediaPanel selected={selected} onPatch={onPatch} onReplaceHtml={jest.fn()} onAddBlock={jest.fn()} />
  );
  return { onPatch, ...utils };
};

// Phase 6 Task 6: the Background section must offer fill / gradient / image
// modes that compose real CSS declarations through onPatch (which feeds the
// canvas live AND gets hoisted into per-block class rules on export).

test("apply fill patches a solid background declaration", () => {
  const { onPatch, getByTestId } = setup();
  fireEvent.change(getByTestId("bg-fill-color"), { target: { value: "#112233" } });
  fireEvent.click(getByTestId("apply-bg-fill"));
  expect(onPatch).toHaveBeenCalledWith({ "background-image": "none", background: "#112233" });
});

test("apply linear gradient composes angle and stops", () => {
  const { onPatch, getByTestId } = setup();
  fireEvent.click(getByTestId("apply-bg-gradient"));
  expect(onPatch).toHaveBeenCalledWith({ background: "linear-gradient(180deg, #5b7fdb, #8b7fdb)" });
});

test("apply radial gradient after switching the type select", () => {
  const { onPatch, getByTestId } = setup();
  fireEvent.change(getByTestId("bg-gradient-type"), { target: { value: "radial" } });
  fireEvent.click(getByTestId("apply-bg-gradient"));
  expect(onPatch).toHaveBeenCalledWith({ background: "radial-gradient(circle, #5b7fdb, #8b7fdb)" });
});

test("apply image patches background-image with size/position/repeat", () => {
  const { onPatch, getByTestId } = setup();
  fireEvent.change(getByTestId("bg-image-url"), { target: { value: "https://example.com/bg.jpg" } });
  fireEvent.click(getByTestId("apply-bg-image"));
  expect(onPatch).toHaveBeenCalledWith({
    "background-image": "url('https://example.com/bg.jpg')",
    "background-size": "cover",
    "background-position": "center",
    "background-repeat": "no-repeat",
  });
});

test("clear resets both background-image and background", () => {
  const { onPatch, getByTestId } = setup();
  fireEvent.click(getByTestId("clear-bg"));
  expect(onPatch).toHaveBeenCalledWith({ "background-image": "none", background: "transparent" });
});
