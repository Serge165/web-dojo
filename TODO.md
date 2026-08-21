# Web Dojo Modernization - Comprehensive Todo List

## SECTION 1: AUDIT & ANALYSIS
- [x] 1.1 Scan and enumerate all existing blocks in blocks.js and blocksExtra.js
- [x] 1.2 Analyze competitor patterns (Webflow, Squarespace, Figma) - conceptual
- [x] 1.3 Identify critical missing blocks for 2026 web design
- [x] 1.4 Prioritize blocks for target markets (service businesses, esports, content creators)

### Existing Blocks Inventory:
**Components** (10): Gallery Grid, Masonry, Carousel, Hover Zoom, Polaroid, Lightbox, Large Header, Glass Navbar, Animated Hero, Animated Marquee, Testimonial, Pricing 3-col, Footer
**Timelines** (5): Vertical, Alternating, Horizontal, Cards, Steps
**Navbars** (7): Simple, Dark, Centered Logo, Mega-menu, E-commerce, Transparent, App Tabs
**Headers** (5): Announcement, Dropdown, Minimal Serif, Dark CTA, Search+Icons
**Footers** (6): Minimal, Newsletter, Social Dark, 4-column Light, Contact, App Download
**Video BG** (3): Hero Video, Section Video+Text, Video Banner
**Heroes** (2): Centered, Split
**Sections** (2): Feature Grid, CTA Banner
**Containers** (3): Basic, 2-col, 3-col
**Text** (5): H1, H2, Paragraph, Input, Textarea
**Toolbox** (6): Button, Image, Divider, Spacer, Avatar, Badge

### Missing Critical Blocks:
- [x] Bento grid layouts
- [x] Interactive testimonial carousel
- [x] Advanced pricing tables with toggle
- [x] Team member cards with social links
- [x] FAQ accordions with animations
- [x] Newsletter signup with validation
- [x] Portfolio galleries with filtering
- [x] Service description with iconography
- [x] Contact forms with reCAPTCHA
- [x] Footer variations (multi-column)

Shipped in `frontend/src/lib/blocksExtra.js` (15 new blocks, 12 new sidebar
categories: Pricing, Team, FAQ, Newsletter, Portfolio, Layout, Services,
Contact, Testimonials, Esports, Creator, + a 7th Footers variant). Verified
in-browser: sidebar categorization, canvas insertion, and the three
CSS-only interactive blocks (FAQ accordion, portfolio `:has()` filter,
pricing monthly/yearly toggle).

### Target Market Blocks:
**Service Businesses**: Team cards, Service blocks, FAQ, Contact forms, Testimonials, Pricing — done
**Esports**: Team rosters, Tournament brackets, Streaming schedules, Player stats — done
**Content Creators**: Media galleries, Subscription blocks, Portfolio filtering, Newsletter — done (Subscription Tiers block; media galleries/portfolio filtering/newsletter already covered above)

## SECTION 2: GLOBALS.CSS ARCHITECTURE
- [ ] 2.1 Create globals.css generator with all required sections
- [ ] 2.2 Implement Monaco-based automatic CSS generation from design tokens
- [ ] 2.3 Ensure globals.css injection in all exported HTML

### Globals.css Sections:
- [ ] CSS Resets (normalize.css)
- [ ] Root Variables (color tokens, semantic colors, typography scale, spacing, border radius, shadows)
- [ ] Typography Rules (body, headings)
- [ ] Grid & Flexbox Utilities
- [ ] Animation Keyframes (fadeIn, slideIn, etc.)
- [ ] Page Transitions (view-transition)
- [ ] Media Queries (responsive breakpoints)

## SECTION 3: BLOCK REFACTORING
- [ ] 3.1 Refactor all existing blocks to use CSS classes (semantic HTML + class names)
- [ ] 3.2 Auto-generate class names for user-created blocks (suffix pattern)
- [ ] 3.3 Implement color application workflow (token -> CSS variable -> cascade)
- [ ] 3.4 Remove all inline styles from blocks

## SECTION 4: LEFT SIDEBAR EXPANSION
- [ ] 4.1 Reorganize blocks by new categories: Navigation, Hero, Content, Features, Forms, E-commerce, Media, Layouts
- [~] 4.2 Add all new blocks — done with inline-style HTML (current block convention); CSS class templates/tokens depend on Section 2/3's globals.css engine, not yet started. Thumbnails/search already work automatically via existing sidebar infra.
- [ ] 4.3 Ensure all blocks reference globals.css classes
- [ ] 4.4 Implement search and filtering

## SECTION 5: RIGHT SIDEBAR REORGANIZATION
- [ ] 5.1 Replace Color tab with Token Selector (show tokens, create new, show usage count)
- [ ] 5.2 Replace inline style editing with CSS Class Editor + Variant Creator + Token Application
- [ ] 5.3 Implement real-time token changes -> globals.css updates -> cascade to all blocks
- [ ] 5.4 Add "Reset to Default" for block variants

## SECTION 6: TOP MENU BAR
- [ ] 6.1 Create top menu bar with File, Edit, Find, View, Help dropdowns
- [ ] 6.2 Implement keyboard shortcuts (Ctrl+S, Ctrl+Z, Ctrl+Y, Ctrl+F, Ctrl+C, Ctrl+V)
- [ ] 6.3 Style consistently with app theme

## SECTION 7: OUTLINE VIEW (5TH TAB)
- [ ] 7.1 Add Outline tab to top center panel
- [ ] 7.2 Implement Outline editor: import markdown, drag-to-reorder slides, export JSON, generate pages
- [ ] 7.3 Page generation: HTML boilerplate, link globals.css, add to file tree
- [ ] 7.4 Add view-transition between slides
- [ ] 7.5 Add animations per slide using keyframes

## SECTION 8: CODE GENERATION CHANGES
- [ ] 8.1 Monaco generates globals.css only (not inline styles)
- [ ] 8.2 Export includes link tag for globals.css in head
- [ ] 8.3 Blocks use semantic HTML with class names
- [ ] 8.4 No style attributes on any block element
- [ ] 8.5 All styling from globals.css

## SECTION 9: INTEGRATION POINTS
- [ ] 9.1 Outline view -> File tree (slides become pages)
- [ ] 9.2 Right sidebar token changes -> globals.css -> all blocks cascade
- [ ] 9.3 Top menu Save -> globals.css generation + project save
- [ ] 9.4 Monaco -> globals.css read-only view with copy-to-clipboard

## SECTION 10: TESTING & VALIDATION
- [ ] 10.1 Test new blocks render with globals.css
- [ ] 10.2 Test outline generates valid HTML pages
- [ ] 10.3 Test color changes cascade to all blocks
- [ ] 10.4 Test top menu keyboard shortcuts
- [ ] 10.5 Test export produces clean HTML + CSS
- [ ] 10.6 Test offline mode (globals.css cached)
- [ ] 10.7 Create automated test suite

## SECTION 11: DELIVERABLES
- [ ] 11.1 Updated LeftSidebar component
- [ ] 11.2 Updated RightSidebar component
- [ ] 11.3 New globals.css generator
- [ ] 11.4 New TopMenuBar component
- [ ] 11.5 New OutlineView component (5th tab)
- [ ] 11.6 Updated Canvas component (CSS classes)
- [ ] 11.7 Updated Monaco/CodeEditor component
- [ ] 11.8 Updated export function
- [ ] 11.9 All blocks refactored
- [ ] 11.10 Test suite

## SECTION 12: CONSTRAINTS
- [ ] 12.1 Don't modify Task 1A.1 (Design Tokens)
- [ ] 12.2 Maintain backward compatibility
- [ ] 12.3 Preserve Canvas-Monaco sync architecture
- [ ] 12.4 No hardcoded colors (all token variables)
- [ ] 12.5 No external dependencies without approval
- [ ] 12.6 Feature-flag all major changes

## SECTION 13: 2026 DESIGN TRENDS
- [ ] 13.1 Bright/saturated Y2K color palettes
- [ ] 13.2 Bento grid layouts
- [ ] 13.3 Sustainable design (optimized code, accessibility)
- [ ] 13.4 Functional minimalism
- [ ] 13.5 Native browser interactions
- [ ] 13.6 Abstract/organic shapes
- [ ] 13.7 Blended photos + graphical elements
- [ ] 13.8 AI-accelerated production patterns
