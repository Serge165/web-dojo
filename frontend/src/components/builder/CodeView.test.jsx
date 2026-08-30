import React from "react";
import { render, fireEvent, act, screen } from "@testing-library/react";
import { CodeView } from "./CodeView";

// CodeEditor wraps a real Monaco instance, which doesn't run in jsdom.
// Swap it for a plain textarea that exposes the same value/onChange/onSave
// contract, so this file tests CodeView's own pane-sync logic (the thing
// the HTML/CSS desync bug and its fix live in) without dragging Monaco in.
jest.mock("./CodeEditor", () => ({
  CodeEditor: ({ value, onChange, onSave, testId }) => (
    <div>
      <textarea data-testid={testId} value={value} onChange={(e) => onChange(e.target.value)} />
      <button data-testid={`${testId}-save`} onClick={() => onSave && onSave()}>save</button>
    </div>
  ),
}));

jest.useFakeTimers();

const heroElement = {
  id: "el_1",
  html: '<section data-wd-cat="heroes" data-wd-block="hero-centered" style="padding:64px;">Title</section>',
};

const setup = (elements = [heroElement]) => {
  const onElementsChange = jest.fn();
  const utils = render(
    <CodeView
      project={{}}
      elements={elements}
      onElementsChange={onElementsChange}
      headHtml=""
      onHeadHtmlChange={jest.fn()}
      customJs=""
      onCustomJsChange={jest.fn()}
      onSave={jest.fn()}
      showPreview={false}
    />
  );
  return { onElementsChange, ...utils };
};

const openTab = (id) => fireEvent.click(screen.getByTestId(`codeview-tab-${id}`));

test("HTML tab shows the same block classes the CSS tab (and export) assign, not raw inline style", () => {
  setup();
  openTab("html");
  const htmlValue = screen.getByTestId("code-html-editor").value;
  expect(htmlValue).toMatch(/class="block block-heroes-centered-1 block-heroes-centered"/);
  expect(htmlValue).not.toMatch(/style="padding:64px;"/);

  openTab("css");
  const cssValue = screen.getByTestId("code-css-editor").value;
  expect(cssValue).toMatch(/\.block-heroes-centered-1\s*{\s*padding:64px;\s*}/);
});

test("editing content in the HTML tab round-trips without losing the element's inline style", () => {
  const { onElementsChange } = setup();
  openTab("html");
  const editor = screen.getByTestId("code-html-editor");
  const edited = editor.value.replace("Title", "New Title");

  fireEvent.change(editor, { target: { value: edited } });
  act(() => jest.advanceTimersByTime(500));

  expect(onElementsChange).toHaveBeenCalledTimes(1);
  const next = onElementsChange.mock.calls[0][0];
  expect(next).toHaveLength(1);
  expect(next[0].id).toBe("el_1");
  expect(next[0].html).toMatch(/style="padding:64px;"/); // reinlined, not left as a class
  expect(next[0].html).toMatch(/New Title/);
  expect(next[0].html).not.toMatch(/block-heroes-centered-1/);
});

test("brand-new markup typed into the HTML tab still becomes a new element", () => {
  const { onElementsChange } = setup();
  openTab("html");
  const editor = screen.getByTestId("code-html-editor");
  const edited = editor.value + "\n<p>hand-typed</p>";

  fireEvent.change(editor, { target: { value: edited } });
  act(() => jest.advanceTimersByTime(500));

  const next = onElementsChange.mock.calls[0][0];
  expect(next).toHaveLength(2);
  expect(next[1].html).toBe("<p>hand-typed</p>");
});

test("editing the CSS tab still writes the declaration back onto the element's inline style", () => {
  const { onElementsChange } = setup();
  openTab("css");
  const editor = screen.getByTestId("code-css-editor");
  const edited = editor.value.replace("padding:64px;", "padding: 8px;");

  fireEvent.change(editor, { target: { value: edited } });
  act(() => jest.advanceTimersByTime(500));

  const next = onElementsChange.mock.calls[0][0];
  expect(next[0].html).toMatch(/style="padding: 8px;"/);
});
