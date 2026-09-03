# Web Dojo File Format Specification

## Overview
Web Dojo projects are saved as JSON files with the extension `.webdojo.json`. This is the native format for the Web Dojo editor and preserves all project metadata, pages, elements, and styling information.

## File Structure

### Root Object
```json
{
  "_webdojo": true,
  "version": 1,
  "name": "My Project",
  "fonts": [],
  "files": {},
  "pages": [],
  "active_page_id": "home"
}
```

### Properties

#### `_webdojo: boolean`
- **Required**: Yes
- **Value**: Always `true`
- **Purpose**: Marker to identify the file as a Web Dojo project
- **Usage**: Import validation checks for this flag to ensure file compatibility

#### `version: number`
- **Required**: Yes
- **Current Value**: `1`
- **Purpose**: Version number for future format migrations
- **Usage**: Allows the importer to handle different file format versions gracefully

#### `name: string`
- **Required**: Yes
- **Purpose**: Human-readable project name
- **Constraints**: Used for filename generation on export
- **Example**: `"Marketing Site"`

#### `fonts: array`
- **Required**: No (default: empty array)
- **Type**: Array of font objects
- **Purpose**: Custom fonts used in the project
- **Structure**:
```json
{
  "family": "Bricolage Grotesque",
  "url": "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;800&display=swap",
  "fallback": "sans-serif"
}
```

#### `files: object`
- **Required**: No (default: empty object)
- **Type**: Key-value map of file references
- **Purpose**: Asset files (images, videos, documents) uploaded to the project
- **Key Format**: File ID (UUID or custom identifier)
- **Value**: File metadata including URL, size, type
- **Example**:
```json
{
  "img-1": {
    "url": "https://storage.example.com/img-1.png",
    "type": "image",
    "size": 15360,
    "name": "hero.png"
  }
}
```

#### `pages: array`
- **Required**: Yes (minimum one page)
- **Purpose**: Array of page objects in the project
- **Min Items**: 1
- **Page Object Structure**:

### Page Object
```json
{
  "id": "home",
  "name": "Home",
  "slug": "index",
  "status": "draft",
  "seo": {
    "title": "Welcome to My Site",
    "description": "A great site description",
    "keywords": "web, design, tool"
  },
  "elements": [],
  "head_html": "",
  "canvas_bg": "#ffffff",
  "fonts": [],
  "custom_js": ""
}
```

#### Page Properties

##### `id: string`
- **Required**: Yes
- **Constraints**: Unique within project, lowercase alphanumeric with hyphens
- **Pattern**: `^[a-z0-9-]+$`
- **Example**: `"home"`, `"about-us"`, `"contact-page"`

##### `name: string`
- **Required**: Yes
- **Purpose**: Human-readable page name (shown in editor UI)
- **Example**: `"Home"`, `"About Us"`

##### `slug: string`
- **Required**: Yes
- **Purpose**: URL-friendly identifier for page export
- **Constraints**: Lowercase, no spaces, hyphens allowed
- **Export Usage**: Determines HTML filename (e.g., `slug.html`)
- **Example**: `"index"`, `"about-us"`, `"contact"`

##### `status: string`
- **Required**: Yes
- **Allowed Values**: `"draft"`, `"published"`, `"archived"`
- **Default**: `"draft"`
- **Purpose**: Publishing state of the page
- **Export Behavior**: Only `"published"` pages are included in full exports

##### `seo: object`
- **Required**: No (default: empty object)
- **Purpose**: SEO metadata for the page
- **Properties**:
  - `title: string` — Page title tag
  - `description: string` — Meta description
  - `keywords: string` — Meta keywords (comma-separated)
  - `og_image: string` — Open Graph image URL
  - `canonical: string` — Canonical URL

##### `elements: array`
- **Required**: Yes (can be empty)
- **Purpose**: Array of DOM elements/blocks on the page
- **Content**: Raw HTML strings representing blocks and components
- **Example**: Array of section/div HTML with block IDs and classes

##### `head_html: string`
- **Required**: No (default: empty string)
- **Purpose**: Custom HTML to inject into the page's `<head>`
- **Usage**: Custom meta tags, scripts, stylesheets
- **Content**: Raw HTML fragment (no `<head>` wrapper)

##### `canvas_bg: string`
- **Required**: No (default: `"#ffffff"`)
- **Purpose**: Background color of the canvas in the editor
- **Format**: Hex color code (e.g., `"#ffffff"`, `"#000000"`)
- **Usage**: UI preference, not exported to HTML

##### `fonts: array`
- **Required**: No (default: empty array)
- **Purpose**: Page-specific font configuration (overrides project fonts)
- **Type**: Same structure as root-level `fonts` array

##### `custom_js: string`
- **Required**: No (default: empty string)
- **Purpose**: Custom JavaScript code for the page
- **Content**: Raw JavaScript (no `<script>` wrapper)
- **Execution**: Injected into page `<head>` as `<script>` tag on export

#### `active_page_id: string`
- **Required**: No
- **Purpose**: ID of the currently active page in the editor
- **Value**: Must match one of the page IDs in the `pages` array
- **Default**: First page ID if not specified

## Example Project

```json
{
  "_webdojo": true,
  "version": 1,
  "name": "Tech Startup Site",
  "fonts": [
    {
      "family": "Inter",
      "url": "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap",
      "fallback": "sans-serif"
    }
  ],
  "files": {
    "hero-img": {
      "url": "https://storage.example.com/hero.jpg",
      "type": "image",
      "size": 150000,
      "name": "hero.jpg"
    }
  },
  "pages": [
    {
      "id": "home",
      "name": "Home",
      "slug": "index",
      "status": "published",
      "seo": {
        "title": "Tech Startup - Build Better",
        "description": "A revolutionary platform for building web applications"
      },
      "elements": [
        "<section class=\"block hero\"><h1>Welcome</h1></section>"
      ],
      "head_html": "<meta property=\"og:title\" content=\"Tech Startup\">",
      "canvas_bg": "#f5f5f5",
      "fonts": [],
      "custom_js": "console.log('Page loaded');"
    },
    {
      "id": "about",
      "name": "About",
      "slug": "about",
      "status": "published",
      "seo": {
        "title": "About Us - Tech Startup"
      },
      "elements": [],
      "head_html": "",
      "canvas_bg": "#ffffff",
      "fonts": [],
      "custom_js": ""
    }
  ],
  "active_page_id": "home"
}
```

## Version History

### Version 1 (Current)
- Initial release
- Supports pages, elements, SEO metadata, custom fonts, files, and custom JavaScript
- All properties documented above

### Version 2 (Planned)
- Possible additions: theme configuration, responsive breakpoints configuration, component library
- Version field allows graceful migration

## Import/Export Notes

### Export to .webdojo.json
- Use `downloadProjectJson(project)` in `exportHtml.js`
- Filename format: `{project-name}.webdojo.json`
- All project data is preserved for full round-trip editing

### Import from .webdojo.json
- Parse JSON and validate `_webdojo: true` and `version: 1`
- Use `onLoadProjectData(data)` in Builder component
- Imported project is immediately editable

### Import from External HTML/CSS
- Use `scanHtml()` function in `importHtml.js`
- Imports convert external HTML to Web Dojo blocks/elements
- CSS is consolidated into project styles
- Original markup structure is preserved where possible

## Format Stability
- Breaking changes to the JSON structure require a `version` increment
- Parsers must check the `version` field to handle different formats
- New optional fields can be added without a version bump
- The `_webdojo: true` flag ensures file identification

## Best Practices
1. Always include `_webdojo: true` and `version: 1` markers
2. Ensure all page IDs are unique and follow the naming pattern
3. Set at least one page to `status: "published"` for export
4. Use absolute URLs for external font CDNs
5. Test imported projects to ensure all assets load correctly
