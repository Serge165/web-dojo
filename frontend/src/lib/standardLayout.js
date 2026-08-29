// Standard semantic HTML layout for new Web Dojo projects (Phase 4a, Task 4).
//
// Gives every blank project a consistent, accessible, SEO-friendly document
// skeleton (site-header / site-nav / hero-section / site-main > content-section
// > container / site-footer) plus the layout CSS (a max-width .container with
// responsive padding, spaced .content-section, etc.). Blocks are dropped into
// the <main> content-sections/containers. This is opt-in (a "blank project"
// seeds it) so existing projects and starter templates keep their structures.

// The scaffolded skeleton rendered into a page's initial element(s). Empty
// section shells with helpful comments — the header/nav/hero/footer are left
// for the user to fill (or delete), while <main> is pre-populated with a
// content-section/container ready for gallery/portfolio/testimonial blocks.
export const STANDARD_LAYOUT_SECTIONS = `
<header class="site-header"><!-- Header blocks go here (or delete) --></header>

<nav class="site-nav"><!-- Nav blocks go here (or delete) --></nav>

<section class="hero-section"><!-- Hero blocks go here (or delete) --></section>

<main class="site-main">
  <section class="content-section">
    <div class="container">
      <!-- Blocks: gallery, portfolio, testimonials, etc. -->
    </div>
  </section>
  <section class="content-section">
    <div class="container">
      <!-- Blocks: gallery, portfolio, testimonials, etc. -->
    </div>
  </section>
</main>

<footer class="site-footer"><!-- Footer blocks go here --></footer>
`;

// Layout CSS matching the handoff: full-width regions, a centered/constrained
// .container with responsive gutters, and padded .content-section rows that
// collapse on mobile. Loaded after block component rules so it can override
// block-level widths; the .block base is independent of this.
export const STANDARD_LAYOUT_CSS = `
/* ===== Site Layout ===== */
.site-header { width: 100%; }
.site-nav { width: 100%; }
.hero-section { width: 100%; }
.site-main {
  width: 100%;
  min-height: calc(100vh - 200px);
}
.content-section {
  width: 100%;
  padding: var(--pad-section, 60px 0);
}
.container {
  width: 100%;
  max-width: var(--max-width, 1200px);
  margin: 0 auto;
  padding: 0 var(--pad-container, 40px);
}
.site-footer {
  width: 100%;
  padding: var(--pad-footer, 40px);
  background: var(--bg-footer, #f0f0f0);
}
@media (max-width: 768px) {
  .container { padding: 0 var(--pad-container-mobile, 16px); }
  .content-section { padding: var(--pad-section-mobile, 40px 0); }
}
`;