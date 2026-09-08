# Web Dojo HTML/CSS Import System

## Overview
The Web Dojo import system allows users to bring in external HTML/CSS from any website and convert it into editable blocks on the canvas. The system preserves original markup while intelligently extracting page structure and styling.

## Import Methods

### 1. HTML Paste
- **Trigger**: Import/Export Modal → "Paste HTML" tab
- **Input**: Raw HTML string (full document or fragment)
- **Processing**: `scanHtml()` in `importHtml.js`
- **Output**: Structured sections ready to drop onto canvas

### 2. File Upload (HTML)
- **Trigger**: Import/Export Modal → "Upload HTML file"
- **File Types**: `.html`, `.htm`
- **Processing**: Same as HTML Paste after FileReader
- **Output**: Sections from uploaded file

### 3. URL Import
- **Trigger**: Import/Export Modal → "Import from URL"
- **Input**: HTTP/HTTPS URL to a live website
- **Processing**: Backend fetches URL, processes with `scanHtml()`
- **Server**: `POST /api/import/url` (see `server.py`)
- **Output**: Sections extracted from remote page

### 4. Folder Import
- **Trigger**: FileTree right-click → "Insert HTML folder"
- **Input**: Directory containing `index.html` + sibling `.css` files
- **Processing**: CSS inlined via `inlineLocalStylesheets()` before scanning
- **Output**: HTML blocks with integrated local stylesheets

## Processing Pipeline

### Stage 1: HTML Parsing
```
Raw HTML → DOMParser → DOM Tree
```
- Uses `new DOMParser()` for standards-compliant parsing
- Safely handles malformed HTML (DOM parser is forgiving)
- Works in browser context (Client-side for paste/file, server-side for URL)

### Stage 2: Style Consolidation
```
<style> tags (head + body) → Deduplicated → Single <style data-forge-imported-css>
```
- Collects ALL `<style>` tags from document (some templates put them in body)
- Removes duplicates using `[...new Set()]` deduplication
- Wraps consolidated CSS in `<style data-forge-imported-css>` marker
- Marker is recognized by export pipeline → routed to `globals.css` Components section

### Stage 3: Section Extraction
Two-tier extraction strategy with automatic fallback:

#### Tier 1: Semantic HTML5
```javascript
Selectors: ["header", "nav", "section", "footer", "main > *", "article"]
```
- Looks for well-structured semantic elements
- Captures only TOP-LEVEL matches (avoids nested capture)
- Generates label from tag name + ID/class for readability
- Example output: `"section#hero"`, `"nav.navbar"`, `"footer.dark"`

**Why this first?** Well-marked-up templates (agency exports, modern frameworks) have proper semantic structure and deserve to have it preserved.

#### Tier 2: Div Soup Fallback
```javascript
Selector: body > * (excluding script, style)
```
- Runs only if Tier 1 found nothing
- Captures top-level `<div>` and other block-level elements
- Used for marketplace templates that use divs exclusively
- Example: "div.container", "div#section-1"

**Why the fallback?** Real-world templates often have zero semantic markup — just nested divs with classes/IDs.

### Stage 4: Local Stylesheet Inlining (Folder Import Only)
```
<link rel="stylesheet" href="local.css">
  ↓
[Match filename in sibling files]
  ↓
<style>/* contents of local.css */</style>
```
- Only applies to folder imports (FileTree)
- Skips remote/CDN links (e.g., Google Fonts, Bootstrap CDN remain as-is)
- Enables local `.css` files to work in the browser context
- Remote stylesheets are preserved as-is (work as loaded)

## Output Structure

### Sections Array
```javascript
[
  {
    id: "imported-0",
    label: "section.hero",
    html: "<section class=\"hero\" ...>...</section>"
  },
  {
    id: "imported-1",
    label: "nav.navbar",
    html: "<nav class=\"navbar\" ...>...</nav>"
  }
]
```

### Head HTML
```javascript
{
  headHtml: "<style data-forge-imported-css>...consolidated CSS...</style>\n...other head content..."
}
```

## CSS Handling

### What Gets Consolidated
- All `<style>` tag contents (inline CSS)
- CSS from local files in folder imports
- Marked with `data-forge-imported-css` for routing

### What Stays Remote
- CDN stylesheets (Google Fonts, Bootstrap, Tailwind via CDN)
- Remote stylesheet links (`<link href="https://...">`)
- These remain in the page's `<head>` and load normally

### Why Consolidation?
1. **Portability**: Imported CSS travels with the project
2. **Reusability**: Shared styles available to all pages
3. **Export**: Export pipeline recognizes `data-forge-imported-css` → combines into `globals.css` Components section
4. **No Duplication**: Each CSS rule appears once globally, not per-page

## Markup Preservation

### What Gets Preserved
- Element tag names (`<section>`, `<div>`, `<article>`, etc.)
- All attributes (id, class, data-* custom attributes)
- Inline styles (preserved as-is)
- Element hierarchy and nesting

### What Gets Stripped
- `<script>` tags and content (security + execution context)
- `<head>` tags and structure (consolidated into project head_html)
- Document doctype/html/body wrappers

### Why This Strategy?
**Goal**: Preserve the designer's intent while making the content editable in Web Dojo.

- Hand-written class names from the original template are kept
- Custom attributes (data-*, aria-*) survive import
- Inline styles remain so spacing/colors don't break
- But structure can be edited/rearranged on the canvas

## Server-Side URL Import

### Endpoint
```
POST /api/import/url
Content-Type: application/json
Body: { "url": "https://example.com" }
```

### Implementation (server.py)
1. Fetch URL (follows redirects, respects robots.txt)
2. Parse HTML on server
3. Return JSON with `{ headHtml, sections }`
4. Client processes result same way as local import

### Security
- URL validation: `https?://` only
- No file:// protocol (prevents local file access)
- Handles HTTP errors gracefully
- CORS respected for cross-origin fetches

## Known Limitations

### Limitations & Workarounds

| Limitation | Why | Workaround |
|-----------|-----|-----------|
| No JavaScript execution | XSS security risk | Static HTML only; event handlers are HTML attributes |
| Local assets (images, fonts) may 404 | Relative paths don't work cross-origin | Upload/re-host images in Web Dojo |
| Complex CSS selectors may break | Scoped/nested selectors depend on structure | Edit styles on canvas; inline styles preserved |
| Responsive images (srcset) simplified | Data URIs/external sources; size-specific URLs | Re-host in Web Dojo project |
| Dynamic content not imported | Can't execute JS; templates load via JS | Import static HTML; add dynamic via Web Dojo |

## Quality Assurance

### Pre-Import Checks
- Validate URL format (for URL import)
- Check for valid HTML (DOMParser handles gracefully)
- Warn if no sections found after Tier 1 + Tier 2 extraction

### Post-Import Verification
- Count sections extracted
- Log any parsing errors
- Display toast notification with result count

### Testing
- `importHtml.test.js` covers `scanHtml()` and section extraction
- E2E tests in `Playwright` cover URL and file imports
- Unit tests verify CSS consolidation and deduplication

## Future Enhancements

1. **Smarter CSS Scoping**: Namespace imported CSS to avoid conflicts
2. **Image Proxy**: Automatically proxy/download remote images
3. **Form Handling**: Better support for form elements and validation
4. **Animation Preservation**: Extract and preserve CSS animations/transitions
5. **Component Detection**: Recognize and group related elements as components

## Debugging Import Issues

### Nothing Imported?
1. Check browser console for errors
2. Verify the HTML has semantic tags or divs (Tier 1 + 2 requirement)
3. Check that `<body>` has content (not empty)
4. Try smaller/simpler HTML first

### Styles Not Applied?
1. Check that CSS doesn't depend on external CDNs being loaded
2. Verify `<style>` tags were captured (check consolidated CSS)
3. Check for CSS selectors that depend on removed wrapper elements

### Images/Assets Missing?
1. Import generates relative paths; hosted assets may have 404s
2. Re-upload images to Web Dojo project
3. Update image src URLs on canvas

### Performance Issues?
1. Very large documents (100+ sections) may be slow to import
2. Split large imports into multiple files
3. Pre-process HTML to remove unused divs/styles
