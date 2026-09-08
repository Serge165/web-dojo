// Scoped version of "content-driven auto-generation": no word-frequency
// analysis, entity extraction, or tone detection — just pull the page's
// own heading and first paragraph, since that's what a human would type
// into the title/description fields anyway. User applies each suggestion
// explicitly; nothing is written automatically.
export const suggestSeoFromContent = (elements) => {
  const html = (elements || []).map((e) => e.html || "").join("\n");
  const doc = new DOMParser().parseFromString(html, "text/html");
  const heading = doc.querySelector("h1, h2");
  const paragraph = doc.querySelector("p");
  const clean = (t) => (t || "").trim().replace(/\s+/g, " ");
  const title = clean(heading?.textContent).slice(0, 60);
  const description = clean(paragraph?.textContent).slice(0, 160);
  return { title, description };
};
