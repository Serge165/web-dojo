import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { PagesBar } from "./PagesBar";

// Phase 5 (Issue #3): pages are typed — "page" (unique content) vs
// "layout" (reusable template). The bar surfaces the type as a badge and
// a select so users can flip it without leaving the builder.

const pages = [
  { id: "p1", name: "Home", slug: "index", status: "draft", type: "page" },
  { id: "p2", name: "Mega Nav", slug: "mega-nav", status: "draft", type: "layout" },
];

const renderBar = (overrides = {}) => {
  const handlers = {
    onSwitch: jest.fn(),
    onAdd: jest.fn(),
    onRemove: jest.fn(),
    onRename: jest.fn(),
    onSetStatus: jest.fn(),
    onSetType: jest.fn(),
    onOpenSeo: jest.fn(),
    onOpenTemplate: jest.fn(),
  };
  render(<PagesBar pages={pages} activePageId="p1" {...handlers} {...overrides} />);
  return handlers;
};

test("flags layout-typed pages with a visible badge, pages stay badge-free", () => {
  renderBar();
  expect(screen.getByTestId("page-layout-badge-p2")).toHaveTextContent("L");
  expect(screen.queryByTestId("page-layout-badge-p1")).toBeNull();
});

test("type select flips a page between page and layout via onSetType", () => {
  const handlers = renderBar();
  fireEvent.change(screen.getByTestId("page-type-p1"), { target: { value: "layout" } });
  expect(handlers.onSetType).toHaveBeenCalledWith("p1", "layout");
});

test("status select still routes through onSetStatus", () => {
  const handlers = renderBar();
  fireEvent.change(screen.getByTestId("page-status-p1"), { target: { value: "published" } });
  expect(handlers.onSetStatus).toHaveBeenCalledWith("p1", "published");
});