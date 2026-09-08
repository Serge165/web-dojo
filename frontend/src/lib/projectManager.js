/**
 * projectManager.js — pure helper functions for project-level operations.
 *
 * Deliberately avoids any React state or hook dependencies so it can be
 * imported by Builder.jsx, tests, and any future non-React consumers
 * (e.g. a Node export script) without dragging in the React runtime.
 */

/**
 * Apply a template to a project with the given mode.
 *
 * @param {object} currentProject  — the current project state (see Builder.jsx's `project` shape)
 * @param {object} template        — the template object (shape: { id, name, data: { ... } })
 * @param {string} mode            — "wrap" (merge styles, keep blocks) or "new" (replace with template)
 * @returns {object}               — the resulting project partial (caller merges into state)
 */
export const applyTemplate = (currentProject, template, mode) => {
  if (mode === "new") {
    return null; // Signal to caller: create fresh project from template
  }

  if (mode === "wrap") {
    // Merge template's globalStyles / theme vars into current project.
    // The template's data may carry pages[], global CSS vars (stored as
    // head_html containing <style data-forge-*> blocks), and a global
    // canvas_bg. We apply only the CSS-level concerns: theme variables,
    // font links, and canvas background. The user's own elements/blocks
    // are preserved untouched.
    const templateData = template.data || {};
    const currentHead = currentProject.head_html || "";
    const templateHead = templateData.head_html || "";

    // Merge template styles into head_html (preferring template declarations
    // as overrides — last write wins in CSS cascade, which matches the
    // intuitive "apply this theme on top" UX). We prepend the current
    // project's head so template vars override where they conflict.
    const mergedHead = templateHead
      ? `${currentHead}\n${templateHead}`
      : currentHead;

    // Template canvas_bg only applies if the template explicitly carries one
    // and the current project hasn't set its own distinct value.
    const mergedCanvasBg =
      templateData.canvas_bg && templateData.canvas_bg !== "#ffffff"
        ? templateData.canvas_bg
        : currentProject.canvas_bg || "#ffffff";

    // Merge template fonts (deduped), preferring template fonts as additions.
    const currentFonts = currentProject.fonts || [];
    const templateFonts = templateData.fonts || [];
    const mergedFonts = [...new Set([...currentFonts, ...templateFonts])];

    return {
      head_html: mergedHead,
      canvas_bg: mergedCanvasBg,
      fonts: mergedFonts,
      metadata: {
        ...(currentProject.metadata || {}),
        appliedTemplate: template.id || template.name,
        appliedAt: new Date().toISOString(),
      },
    };
  }

  // Unknown mode — return unchanged.
  return null;
};

/**
 * Check if a template application would lose data (i.e. the current project
 * has unsaved elements beyond a blank canvas).
 *
 * @param {object} currentProject
 * @returns {boolean} — true if the project has meaningful content
 */
export const hasProjectContent = (currentProject) => {
  const pages = currentProject.pages || [];
  if (pages.length > 1) return true;
  const elements = pages[0]?.elements || currentProject.elements || [];
  if (elements.length > 0) return true;
  const headHtml = pages[0]?.head_html || currentProject.head_html || "";
  if (headHtml.trim()) return true;
  return false;
};