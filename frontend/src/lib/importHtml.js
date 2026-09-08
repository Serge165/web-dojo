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

// Reorganize imported JavaScript with educational section headings for code structure teaching.
// Groups code into logical sections: setup, utilities, event handlers, and initialization.
const reorganizeImportedJs = (js) => {
  if (!js || typeof js !== 'string') return js || '';

  const sections = {
    setup: [],
    utilities: [],
    events: [],
    init: [],
    other: []
  };

  // Split by major patterns
  const lines = js.split('\n');
  let currentBlock = '';

  for (const line of lines) {
    currentBlock += line + '\n';

    // Detect section patterns
    if (line.match(/const|let|var/) && line.match(/=\s*({|\[|function|async|=>)/)) {
      // Variable/constant declarations with initialization
      if (line.match(/config|settings|options|const/i)) {
        sections.setup.push(currentBlock.trim());
        currentBlock = '';
      }
    }
    if (line.match(/function|const.*=.*\(|=>/) && !line.match(/addEventListener|on|handler/i)) {
      // Function definitions (utilities)
      if (currentBlock.match(/\n\s*\}/)) {
        sections.utilities.push(currentBlock.trim());
        currentBlock = '';
      }
    }
    if (line.match(/addEventListener|\.on\(|\.click\(|\.submit\(/i)) {
      // Event listeners
      if (currentBlock.match(/\n\s*[;}]/)) {
        sections.events.push(currentBlock.trim());
        currentBlock = '';
      }
    }
    if (line.match(/init|main\(\)|DOMContentLoaded|window\.onload/i)) {
      // Initialization code
      if (currentBlock.match(/\n\s*\}/)) {
        sections.init.push(currentBlock.trim());
        currentBlock = '';
      }
    }
  }

  if (currentBlock.trim()) {
    sections.other.push(currentBlock.trim());
  }

  // Build organized JavaScript with educational headings
  const output = [];

  if (sections.setup.length) {
    output.push(`// ===== CONFIGURATION / SETUP =====\n${sections.setup.join('\n\n')}`);
  }

  if (sections.utilities.length) {
    output.push(`// ===== UTILITY FUNCTIONS =====\n${sections.utilities.join('\n\n')}`);
  }

  if (sections.events.length) {
    output.push(`// ===== EVENT LISTENERS =====\n${sections.events.join('\n\n')}`);
  }

  if (sections.init.length) {
    output.push(`// ===== INITIALIZATION =====\n${sections.init.join('\n\n')}`);
  }

  if (sections.other.length) {
    output.push(`// ===== OTHER CODE =====\n${sections.other.join('\n\n')}`);
  }

  return output.length ? output.join('\n\n') : js;
};

// Reorganize imported HTML with educational section headings for document structure teaching.
// Adds commented section labels showing where different parts of the page structure go.
const reorganizeImportedHtml = (html) => {
  if (!html || typeof html !== 'string') return html || '';

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Extract major sections
    const head = doc.head ? doc.head.innerHTML : '';
    const header = doc.querySelector('header')?.outerHTML || '';
    const nav = doc.querySelector('nav')?.outerHTML || '';
    const main = doc.querySelector('main')?.outerHTML ||
                 doc.querySelector('section')?.outerHTML || '';
    const footer = doc.querySelector('footer')?.outerHTML || '';
    let bodyContent = doc.body ? doc.body.innerHTML : '';

    // Rebuild with educational structure
    let output = '<!DOCTYPE html>\n<html lang="en">\n<head>\n';
    output += '  <!-- ===== META / DOCTYPE ===== -->\n';
    output += '  <meta charset="UTF-8">\n';
    output += '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n\n';
    output += '  <!-- ===== STYLES ===== -->\n';

    // Extract style tags and link elements
    const styles = doc.querySelectorAll('style');
    const links = doc.querySelectorAll('link[rel="stylesheet"]');

    if (links.length) {
      links.forEach((link) => {
        output += `  ${link.outerHTML}\n`;
      });
      output += '\n';
    }

    if (styles.length) {
      styles.forEach((style) => {
        output += `  <style>\n    ${style.textContent?.trim()}\n  </style>\n`;
      });
      output += '\n';
    }

    output += '  <!-- ===== SCRIPTS (non-critical) ===== -->\n';
    output += '  <!-- Place non-blocking scripts here -->\n\n';

    output += '</head>\n<body>\n';
    output += '  <!-- ===== HEADER ===== -->\n';
    if (header) output += `  ${header}\n\n`;

    output += '  <!-- ===== NAVIGATION ===== -->\n';
    if (nav) output += `  ${nav}\n\n`;

    output += '  <!-- ===== MAIN CONTENT ===== -->\n';
    if (main) output += `  ${main}\n\n`;
    else output += '  <main>\n    <!-- Page content goes here -->\n  </main>\n\n';

    output += '  <!-- ===== FOOTER ===== -->\n';
    if (footer) output += `  ${footer}\n\n`;

    output += '  <!-- ===== SCRIPTS (critical/deferred) ===== -->\n';
    output += '  <!-- Place deferred scripts here for better performance -->\n';

    // Extract script tags
    const scripts = doc.querySelectorAll('script');
    if (scripts.length) {
      scripts.forEach((script) => {
        if (script.src) {
          output += `  <script src="${script.src}" defer></script>\n`;
        } else if (script.textContent?.trim()) {
          output += `  <script>\n    ${script.textContent?.trim()}\n  </script>\n`;
        }
      });
    }

    output += '</body>\n</html>';

    return output;
  } catch (err) {
    console.warn('Error reorganizing HTML:', err);
    return html;
  }
};

// Reorganize imported CSS into Web Dojo's globals.css structure with proper sections.
// Parses CSS to categorize rules and places them in the correct section with headings.
const reorganizeImportedCss = (css) => {
  if (!css || typeof css !== 'string') return css || '';

  const sections = {
    themeVars: [],
    base: [],
    animations: [],
    mediaQueries: [],
    components: []
  };

  // Split by @-rules and regular rules for categorization
  const lines = css.split('\n');
  let currentRule = '';
  let inBlock = false;
  let blockCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    currentRule += line + '\n';

    // Count braces to track block nesting
    blockCount += (line.match(/\{/g) || []).length;
    blockCount -= (line.match(/\}/g) || []).length;

    // When block closes (blockCount returns to 0), we have a complete rule
    if (blockCount === 0 && currentRule.trim()) {
      const trimmed = currentRule.trim();

      // Categorize the rule
      if (trimmed.match(/:\s*--[\w-]+\s*;/) || trimmed.match(/^:?root\s*\{/i)) {
        // CSS custom properties / variables
        sections.themeVars.push(trimmed);
      } else if (trimmed.match(/^@keyframes/i)) {
        // Animations
        sections.animations.push(trimmed);
      } else if (trimmed.match(/^@media/i)) {
        // Media queries
        sections.mediaQueries.push(trimmed);
      } else if (trimmed.match(/^(html|body|[*]|reset|:root|form|input|button|a|h[1-6]|p|table)/i)) {
        // Base/reset styles
        sections.base.push(trimmed);
      } else {
        // Component/block styles (default)
        sections.components.push(trimmed);
      }

      currentRule = '';
    }
  }

  // Build organized stylesheet with Web Dojo headings
  const output = [];

  if (sections.themeVars.length) {
    output.push(`/* ===== Theme Variables ===== */\n${sections.themeVars.join('\n\n')}`);
  }

  if (sections.base.length) {
    output.push(`/* ===== Base ===== */\n${sections.base.join('\n\n')}`);
  }

  if (sections.components.length) {
    output.push(`/* ===== Components ===== */\n${sections.components.join('\n\n')}`);
  }

  if (sections.animations.length) {
    output.push(`/* ===== Animations ===== */\n${sections.animations.join('\n\n')}`);
  }

  if (sections.mediaQueries.length) {
    output.push(`/* ===== Media Queries ===== */\n${sections.mediaQueries.join('\n\n')}`);
  }

  return output.length ? output.join('\n\n') : css;
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
    const organizedCss = consolidatedCss ? reorganizeImportedCss(consolidatedCss) : "";
    const responsiveCss = generateResponsiveScalingCss();
    const restHead = doc.head ? doc.head.innerHTML.trim() : "";
    const headHtml = [
      organizedCss ? `<style data-forge-imported-css>\n${organizedCss}\n${responsiveCss}\n</style>` : responsiveCss ? `<style data-forge-imported-css>\n${responsiveCss}\n</style>` : "",
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

// Export educational HTML/CSS/JS reorganization functions for learning purposes
export const reorganizeImportedHtmlEducational = reorganizeImportedHtml;
export const reorganizeImportedJsEducational = reorganizeImportedJs;
export const reorganizeImportedCssEducational = reorganizeImportedCss;
