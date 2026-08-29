import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Radix Dialog is flaky under jsdom; mock the primitive to a pass-through so
// the unit under test is the wizard's stepper/autofill/onCreate logic.
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

import { NewProjectWizard } from "./NewProjectWizard";
import STARTER_TEMPLATES from "@/data/starterTemplates.json";

const FIRST = STARTER_TEMPLATES[0];

const renderWizard = (overrides = {}) => {
  const onCreate = jest.fn();
  const onClose = jest.fn();
  render(<NewProjectWizard open onClose={onClose} onCreate={onCreate} {...overrides} />);
  return { onCreate, onClose };
};

// ── original tests (still valid) ─────────────────────────────────────

test("opens on step 1 with the starter grid", () => {
  renderWizard();
  expect(screen.getByTestId("wizard-step-1-body")).toBeInTheDocument();
  expect(screen.queryByTestId("wizard-step-2-body")).toBeNull();
  expect(screen.getByTestId(`wizard-tpl-${FIRST.id}`)).toBeInTheDocument();
});

test("SEO auto-fills from the pre-selected template on open", () => {
  renderWizard();
  fireEvent.click(screen.getByTestId("wizard-next"));
  expect(screen.getByTestId("wizard-step-2-body")).toBeInTheDocument();
  const homeSeo = (FIRST.data.pages && FIRST.data.pages[0] && FIRST.data.pages[0].seo) || {};
  expect(screen.getByTestId("wizard-name")).toHaveValue(FIRST.name);
  expect(screen.getByTestId("wizard-seo-title")).toHaveValue(homeSeo.title || FIRST.name);
  expect(screen.getByTestId("wizard-seo-description")).toHaveValue(
    homeSeo.description || FIRST.description || ""
  );
  expect(screen.getByTestId("wizard-seo-og-type")).toHaveValue("website");
});

test("stepper advances 1 -> 2 -> 3 and Create calls onCreate with the right shape", () => {
  const { onCreate, onClose } = renderWizard();
  fireEvent.click(screen.getByTestId("wizard-next"));
  expect(screen.getByTestId("wizard-step-2-body")).toBeInTheDocument();
  fireEvent.change(screen.getByTestId("wizard-name"), { target: { value: "My Site" } });
  fireEvent.change(screen.getByTestId("wizard-seo-title"), { target: { value: "My Site — Home" } });
  fireEvent.click(screen.getByTestId("wizard-next"));
  expect(screen.getByTestId("wizard-step-3-body")).toBeInTheDocument();
  expect(screen.getByTestId("wizard-review-name")).toHaveTextContent("My Site");
  fireEvent.click(screen.getByTestId("wizard-create"));
  expect(onCreate).toHaveBeenCalledTimes(1);
  const arg = onCreate.mock.calls[0][0];
  expect(arg.tpl.id).toBe(FIRST.id);
  expect(arg.name).toBe("My Site");
  expect(arg.seo.title).toBe("My Site — Home");
  expect(arg.seo.og_type).toBe("website");
  expect(onClose).toHaveBeenCalledTimes(1);
});

test("Back returns to the previous step and Cancel (on step 1) closes", () => {
  const { onClose } = renderWizard();
  fireEvent.click(screen.getByTestId("wizard-next"));
  fireEvent.click(screen.getByTestId("wizard-back"));
  expect(screen.getByTestId("wizard-step-1-body")).toBeInTheDocument();
  fireEvent.click(screen.getByTestId("wizard-back"));
  expect(onClose).toHaveBeenCalledTimes(1);
});

test("selecting a different template re-seeds name + SEO", () => {
  renderWizard();
  const second = STARTER_TEMPLATES[1] || FIRST;
  fireEvent.click(screen.getByTestId(`wizard-tpl-${second.id}`));
  fireEvent.click(screen.getByTestId("wizard-next"));
  expect(screen.getByTestId("wizard-name")).toHaveValue(second.name);
  const homeSeo = (second.data.pages && second.data.pages[0] && second.data.pages[0].seo) || {};
  expect(screen.getByTestId("wizard-seo-title")).toHaveValue(homeSeo.title || second.name);
});

test("renders nothing when open is false", () => {
  render(<NewProjectWizard open={false} onClose={jest.fn()} onCreate={jest.fn()} />);
  expect(screen.queryByTestId("new-project-wizard")).toBeNull();
});

// ── Feature #1: Template Versioning ──────────────────────────────────

test("template cards show version badges", () => {
  renderWizard();
  // The first template should have a version badge visible
  const firstCard = screen.getByTestId(`wizard-tpl-${FIRST.id}`).closest(".group");
  expect(firstCard).toBeInTheDocument();
  // Version badge exists — use getAllByText since version may appear in multiple badges
  const badges = screen.getAllByText(new RegExp(`v${FIRST.version.replace(/\\./g, "\\\\.")}`));
  expect(badges.length).toBeGreaterThanOrEqual(1);
});

test("deprecated templates show a warning", () => {
  // Find a deprecated template
  const deprecated = STARTER_TEMPLATES.find((t) => t.deprecationWarning);
  if (deprecated) {
    renderWizard();
    expect(
      screen.getByTestId(`wizard-tpl-${deprecated.id}-deprecated`)
    ).toBeInTheDocument();
  }
});

test("changelog button toggles version history", () => {
  renderWizard();
  // Find a template with a changelog (most have them now)
  const tpl = STARTER_TEMPLATES.find((t) => t.changelog && t.changelog.length > 0);
  if (tpl) {
    const btn = screen.getByTestId(`wizard-tpl-${tpl.id}-changelog-btn`);
    expect(btn).toBeInTheDocument();
    // Click to reveal
    fireEvent.click(btn);
    expect(screen.getByTestId(`wizard-tpl-${tpl.id}-changelog`)).toBeInTheDocument();
    // Click again to hide
    fireEvent.click(btn);
    expect(
      screen.queryByTestId(`wizard-tpl-${tpl.id}-changelog`)
    ).not.toBeInTheDocument();
  }
});

// ── Feature #5: SEO Validation ───────────────────────────────────────

test("step 2 shows SEO validator with score", () => {
  renderWizard();
  fireEvent.click(screen.getByTestId("wizard-next"));

  // Validator panel should be visible
  expect(screen.getByTestId("wizard-seo-validator")).toBeInTheDocument();
  // Score element should exist
  expect(screen.getByTestId("wizard-seo-score")).toBeInTheDocument();
  // Title check should exist
  expect(screen.getByTestId("wizard-seo-check-title")).toBeInTheDocument();
  // Description check should exist
  expect(screen.getByTestId("wizard-seo-check-description")).toBeInTheDocument();
});

test("SEO score updates when fields change", () => {
  renderWizard();
  fireEvent.click(screen.getByTestId("wizard-next"));

  const scoreEl = screen.getByTestId("wizard-seo-score");
  const initialScore = scoreEl.textContent;

  // Type a good-length title (50-60 chars)
  const goodTitle =
    "This Is a Perfectly Sized SEO Title at Fifty Five Chars";
  fireEvent.change(screen.getByTestId("wizard-seo-title"), {
    target: { value: goodTitle },
  });

  const newScore = scoreEl.textContent;
  // Score should have changed (title moved from fail/warn to pass)
  expect(newScore).not.toBe(initialScore);
});

test("SEO check for keywords reflects input", () => {
  renderWizard();
  fireEvent.click(screen.getByTestId("wizard-next"));

  expect(screen.getByTestId("wizard-seo-check-keywords")).toBeInTheDocument();

  // Add 3 keywords
  fireEvent.change(screen.getByTestId("wizard-seo-keywords"), {
    target: { value: "web, design, builder" },
  });

  // Keywords check should now show pass
  const kwCheck = screen.getByTestId("wizard-seo-check-keywords");
  expect(kwCheck.textContent).toMatch(/3 keyword/);
});

// ── Feature #6: Mobile Preview ───────────────────────────────────────

test("step 2 shows device preview toggle buttons", () => {
  renderWizard();
  fireEvent.click(screen.getByTestId("wizard-next"));

  expect(screen.getByTestId("wizard-preview-mobile")).toBeInTheDocument();
  expect(screen.getByTestId("wizard-preview-tablet")).toBeInTheDocument();
  expect(screen.getByTestId("wizard-preview-desktop")).toBeInTheDocument();
});

test("search result preview shows SEO title and description", () => {
  renderWizard();
  fireEvent.click(screen.getByTestId("wizard-next"));

  const homeSeo = (FIRST.data.pages && FIRST.data.pages[0] && FIRST.data.pages[0].seo) || {};
  const expectedTitle = homeSeo.title || FIRST.name;

  // The preview should contain the title text
  expect(screen.getByText(expectedTitle)).toBeInTheDocument();
});

test("device toggle switches preview sizing", () => {
  renderWizard();
  fireEvent.click(screen.getByTestId("wizard-next"));

  // Initially mobile is selected
  const mobileBtn = screen.getByTestId("wizard-preview-mobile");
  expect(mobileBtn.className).toMatch(/bg-indigo/);

  // Switch to desktop
  fireEvent.click(screen.getByTestId("wizard-preview-desktop"));
  const desktopBtn = screen.getByTestId("wizard-preview-desktop");
  expect(desktopBtn.className).toMatch(/bg-indigo/);

  // Mobile should no longer be active
  expect(mobileBtn.className).not.toMatch(/bg-indigo/);
});

// ── Step 3 shows template version badge ──────────────────────────────

test("step 3 review shows template version badge", () => {
  renderWizard();
  fireEvent.click(screen.getByTestId("wizard-next"));
  fireEvent.click(screen.getByTestId("wizard-next"));
  expect(screen.getByTestId("wizard-step-3-body")).toBeInTheDocument();

  if (FIRST.version) {
    expect(screen.getByText(new RegExp(`v${FIRST.version}`))).toBeInTheDocument();
  }
});
