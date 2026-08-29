import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

// Radix Dialog renders via portal + focus management that's flaky under
// jsdom; the unit under test here is the 3-option routing, not the dialog
// primitive, so mock it to a pass-through that renders children when open.
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
    DialogDescription: Box,
  };
});

import { NewProjectModal } from "./NewProjectModal";

const renderModal = (overrides = {}) => {
  const handlers = { onBlank: jest.fn(), onFromTemplate: jest.fn(), onFromWizard: jest.fn(), onClose: jest.fn() };
  render(<NewProjectModal open onClose={handlers.onClose} onBlank={handlers.onBlank} onFromTemplate={handlers.onFromTemplate} onFromWizard={handlers.onFromWizard} {...overrides} />);
  return handlers;
};

test("renders all three new-project options", () => {
  renderModal();
  expect(screen.getByTestId("new-project-modal")).toBeInTheDocument();
  expect(screen.getByTestId("new-project-blank")).toBeInTheDocument();
  expect(screen.getByTestId("new-project-template")).toBeInTheDocument();
  expect(screen.getByTestId("new-project-wizard")).toBeInTheDocument();
});

test("Blank calls onBlank and closes the modal", () => {
  const h = renderModal();
  fireEvent.click(screen.getByTestId("new-project-blank"));
  expect(h.onBlank).toHaveBeenCalledTimes(1);
  expect(h.onClose).toHaveBeenCalledTimes(1);
});

test("From template calls onFromTemplate and closes the modal", () => {
  const h = renderModal();
  fireEvent.click(screen.getByTestId("new-project-template"));
  expect(h.onFromTemplate).toHaveBeenCalledTimes(1);
  expect(h.onClose).toHaveBeenCalledTimes(1);
});

test("Wizard calls onFromWizard and closes the modal", () => {
  const h = renderModal();
  fireEvent.click(screen.getByTestId("new-project-wizard"));
  expect(h.onFromWizard).toHaveBeenCalledTimes(1);
  expect(h.onClose).toHaveBeenCalledTimes(1);
});

test("renders nothing when open is false", () => {
  render(<NewProjectModal open={false} onClose={jest.fn()} onBlank={jest.fn()} onFromTemplate={jest.fn()} onFromWizard={jest.fn()} />);
  expect(screen.queryByTestId("new-project-modal")).toBeNull();
});
