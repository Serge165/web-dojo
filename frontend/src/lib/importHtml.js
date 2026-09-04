// Client-side HTML importer. Parses a full HTML document, returns
// discovered top-level "sections" that can be dropped onto the canvas as
// blocks, and consolidates every <style> rule the document carries (its
// own inline blocks, plus whatever /import/url already fetched from its
// <link rel="stylesheet"> tags server-side) into one <style
// data-forge-imported-css> block — same data-forge-* marker convention
// exportHtml.js/server.py already use for theme/vars/anim CSS, so the
// export pipeline's extractForgeCss routes it into globals.css's
// Components section instead of leaving it stranded, unshared, in each
// page's own <head>.

// Collects every <style> tag's text (head or body — real-world templates
// don't always keep them in <head>) into one deduped stylesheet, and
// strips the original tags out of the document so they aren't carried
// twice (once loose, once consolidated).
const consolidateStyleTags = (doc) => {
  const nodes = Array.from(doc.querySelectorAll("style"));
  const rules = [];
  nodes.forEach((node) => {
    const text = (node.textContent || "").trim();
    if (text) rules.push(text);
    node.remove();
  });
  return [...new Set(rules)].join("\n\n");
};

const SEMANTIC_SELECTORS = ["header", "nav", "section", "footer", "main > *", "article"];
// Real-world templates (marketplace downloads, agency exports) very often
// skip semantic HTML5 tags entirely and structure the page as top-level
// <div>s instead ("div soup"). This tier only runs if the semantic pass
// found nothing, so a well-marked-up page never gets double-captured.
const captureDivSoup = (doc, seen, found) => {
  Array.from(doc.body.children).forEach((el) => {
    if (seen.has(el)) return;
    if (el.tagName === "SCRIPT" || el.tagName === "STYLE") return;
    seen.add(el);
    found.push({
      id: `imported-${found.length}`,
      label: el.tagName.toLowerCase() + (el.id ? "#" + el.id : el.className ? "." + String(el.className).split(" ")[0] : ""),
      html: el.outerHTML,
    });
  });
};

// Folder imports (FileTree's "insert" action) carry their CSS as sibling
// .css files rather than inline <style> tags, so scanHtml's own <style>
// consolidation never sees them. Inlines any <link rel="stylesheet"
// href="local.css"> whose href matches a sibling file's name (by content),
// leaving remote/CDN links untouched, so the existing <style> pipeline
// below picks the CSS up like it would for any other stylesheet.
const STYLESHEET_LINK_RE = /<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi;
const HREF_RE = /href=["']([^"']+)["']/i;
export const inlineLocalStylesheets = (html, siblingCssByName) => {
  if (!html || typeof html !== 'string') return html || '';
  if (!siblingCssByName || typeof siblingCssByName !== 'object') return html;

  try {
    return html.replace(STYLESHEET_LINK_RE, (tag) => {
      try {
        const hrefMatch = tag.match(HREF_RE);
        const href = hrefMatch && hrefMatch[1];
        if (!href || /^([a-z]+:)?\/\//i.test(href)) return tag;
        const fileName = href.split("/").pop();
        const css = siblingCssByName[href] || siblingCssByName[fileName];
        return css ? `<style>${css}</style>` : tag;
      } catch (err) {
        console.warn('Error processing stylesheet link:', tag, err);
        return tag;
      }
    });
  } catch (err) {
    console.error('inlineLocalStylesheets error:', err);
    return html;
  }
};

const generateResponsiveScalingCss = () => {
  // Make imported blocks scale responsively to fit canvas width
  // without breaking layout. This CSS overrides fixed-width containers
  // from imported templates, allowing them to adapt to different viewport sizes.
  return `
/* Responsive scaling for imported blocks */
[style*="width:"] {
  max-width: 100%;
}
div[style*="1200"], div[style*="1000"], div[style*="960"],
section[style*="1200"], section[style*="1000"], section[style*="960"] {
  width: 100% !important;
}
/* Prevent horizontal overflow on mobile */
@container (max-width: 500px) {
  body > div, body > section, body > main {
    width: 100% !important;
    max-width: 100% !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
  }
}
  `;
};

export const scanHtml = (raw) => {
  if (!raw || typeof raw !== 'string') {
    console.warn('scanHtml: invalid input', { raw: typeof raw });
    return { headHtml: '', sections: [] };
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(raw, "text/html");

    // Check for parsing errors
    if (doc.getElementsByTagName('parsererror').length > 0) {
      console.warn('DOMParser returned error', doc.documentElement.textContent);
    }

    const consolidatedCss = consolidateStyleTags(doc);
    const responsiveCss = generateResponsiveScalingCss();
    const restHead = doc.head ? doc.head.innerHTML.trim() : "";
    const headHtml = [
      consolidatedCss ? `<style data-forge-imported-css>\n${consolidatedCss}\n${responsiveCss}\n</style>` : responsiveCss ? `<style data-forge-imported-css>\n${responsiveCss}\n</style>` : "",
      restHead,
    ].filter(Boolean).join("\n");

    const seen = new Set();
    const found = [];

    SEMANTIC_SELECTORS.forEach((sel) => {
      try {
        doc.body.querySelectorAll(sel).forEach((el) => {
          if (seen.has(el)) return;
          // avoid nested capture (only take top-most)
          let p = el.parentElement;
          let nested = false;
          while (p && p !== doc.body) {
            if (seen.has(p)) { nested = true; break; }
            p = p.parentElement;
          }
          if (nested) return;
          seen.add(el);
          found.push({
            id: `imported-${found.length}`,
            label: el.tagName.toLowerCase() + (el.id ? "#" + el.id : el.className ? "." + String(el.className).split(" ")[0] : ""),
            html: el.outerHTML,
          });
        });
      } catch (err) {
        console.warn(`Error querying selector "${sel}":`, err);
      }
    });

    if (found.length === 0) captureDivSoup(doc, seen, found);

    // Fallback: if still nothing (e.g. a body with only text nodes), treat
    // the whole body as one block.
    if (found.length === 0 && doc.body && doc.body.innerHTML.trim()) {
      found.push({ id: "imported-body", label: "body", html: doc.body.innerHTML });
    }

    return { headHtml, sections: found };
  } catch (err) {
    console.error('scanHtml fatal error:', err);
    return { headHtml: '', sections: [] };
  }
};
