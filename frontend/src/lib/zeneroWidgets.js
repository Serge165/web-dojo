// Marker set shared between the Zenero-content/Social-wall blocks
// (blocksExtra.js) and the gate that decides whether the Zenero dashboard
// entry point is worth showing (Builder.jsx) — a project with none of
// these blocks placed has nothing for the dashboard to manage.
export const ZENERO_WIDGET_MARKERS = ["updates", "gallery", "latest-blog", "portfolio", "timeline", "bento", "social-wall", "roster", "fixtures", "org-stats"];

const ZENERO_WIDGET_RE = new RegExp(`data-forge-widget="(${ZENERO_WIDGET_MARKERS.join("|")})"`);

export const hasZeneroWidget = (elements) => (elements || []).some((e) => ZENERO_WIDGET_RE.test(e.html || ""));
