import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Radix Dialog is flaky under jsdom; mock the primitive to a pass-through,
// same approach NewProjectWizard.test.jsx uses.
jest.mock("@/components/ui/dialog", () => {
  const React = require("react");
  const Dialog = ({ open, children }) => (open ? children : null);
  const Box = React.forwardRef(({ children, ...props }, ref) =>
    React.createElement("div", { ref, ...props }, children));
  return {
    Dialog,
    DialogContent: Box,
    DialogHeader: Box,
    DialogTitle: Box,
  };
});

jest.mock("axios", () => ({
  get: jest.fn(() => Promise.reject(new Error("offline in tests"))),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({})),
}));

import { ProjectTemplatesModal } from "./ProjectTemplatesModal";

const openImportFilesMode = async () => {
  const onLoadTemplate = jest.fn();
  render(
    <ProjectTemplatesModal open onClose={jest.fn()} currentProject={{}} onLoadTemplate={onLoadTemplate} />
  );
  fireEvent.click(await screen.findByTestId("tpl-import-open"));
  fireEvent.click(screen.getByTestId("tpl-import-mode-files"));
  return { onLoadTemplate };
};

// ── Whole-template (multi-page) import ───────────────────────────────

test("importing a whole template folder turns each .html file into its own page", async () => {
  await openImportFilesMode();

  const indexFile = new File(
    [`<html><head><style>.hero{color:red}</style></head><body><section>Home hero</section></body></html>`],
    "index.html",
    { type: "text/html" }
  );
  const aboutFile = new File(
    [`<html><head><link rel="stylesheet" href="styles.css"></head><body><section>About us</section></body></html>`],
    "about.html",
    { type: "text/html" }
  );
  const cssFile = new File([`.about{color:blue}`], "styles.css", { type: "text/css" });

  const input = screen.getByTestId("tpl-import-files");
  fireEvent.change(input, { target: { files: [indexFile, aboutFile, cssFile] } });

  const summary = await screen.findByTestId("tpl-import-multi-summary");
  expect(summary).toHaveTextContent("2 pages");
  expect(summary).toHaveTextContent("Home");
  expect(summary).toHaveTextContent("About");
});

test("whole-template import: Use this template hands off a multi-page project with the donor CSS folded in", async () => {
  const { onLoadTemplate } = await openImportFilesMode();

  const indexFile = new File(
    [`<html><body><section>Home hero</section></body></html>`],
    "index.html",
    { type: "text/html" }
  );
  const contactFile = new File(
    [`<html><head><style>.contact{color:green}</style></head><body><section>Contact form</section></body></html>`],
    "contact-us.html",
    { type: "text/html" }
  );

  fireEvent.change(screen.getByTestId("tpl-import-files"), { target: { files: [indexFile, contactFile] } });
  await screen.findByTestId("tpl-import-multi-summary");

  fireEvent.click(screen.getByTestId("tpl-import-use"));

  expect(onLoadTemplate).toHaveBeenCalledTimes(1);
  const tpl = onLoadTemplate.mock.calls[0][0];
  expect(tpl.data.pages).toHaveLength(2);
  expect(tpl.data.pages.map((p) => p.slug).sort()).toEqual(["contact-us", "index"]);
  const contactPage = tpl.data.pages.find((p) => p.slug === "contact-us");
  expect(contactPage.name).toBe("Contact Us");
  expect(contactPage.head_html).toContain(".contact{color:green}");
});

test("whole-template import: no .html file selected is rejected with a clear error", async () => {
  await openImportFilesMode();
  const cssOnly = new File([`.x{color:red}`], "styles.css", { type: "text/css" });
  fireEvent.change(screen.getByTestId("tpl-import-files"), { target: { files: [cssOnly] } });
  await waitFor(() => expect(screen.queryByTestId("tpl-import-multi-summary")).toBeNull());
});
