// ============================================================
// OXYGENE SECTION BLOCKS — Class-Based (Zero Inline Styles)
// ============================================================
// Refactored from inline-styled version. All CSS lives in
// frontend/src/scss/oxygene-globals.scss with the naming
// convention: class="block oxygene block-oxygene-[ElementType]"
//
// Blocks merge into blocksExtra.js's EXTRA_CATEGORIES via the
// existing mergeCategories() pipeline in blocks.js.
//
// Each block carries data-inject attributes where applicable
// so oxygenInjection.ts can inject fetched JSON content.
// ============================================================

const oxygenSections = [
  // ==========================================================
  // BLOCK 1: HERO SECTION
  // ==========================================================
  {
    id: "oxy-hero",
    label: "Oxygene · Hero",
    html: `<section class="block oxygene block-oxygene-hero">
  <div class="block-oxygene-hero-inner">
    <h1 class="block-oxygene-hero-title">Oxygen.</h1>
    <h2 class="block-oxygene-hero-subtitle">Where design meets innovation</h2>
    <p class="block-oxygene-hero-description">Build luminous digital experiences with a design system crafted for clarity, scale, and soul.</p>
    <button class="block-oxygene-btn block-oxygene-btn-primary">Get Started</button>
  </div>
</section>`,
  },

  // ==========================================================
  // BLOCK 2: FEATURES GRID
  // ==========================================================
  {
    id: "oxy-features",
    label: "Oxygene · Features Grid",
    html: `<section class="block oxygene block-oxygene-features">
  <div class="block-oxygene-features-header">
    <h3 class="block-oxygene-section-title">Luminous Features</h3>
    <p class="block-oxygene-section-description">Everything you need to build with confidence.</p>
  </div>
  <div class="block-oxygene-grid">
    <div class="block-oxygene-feature-card">
      <div class="block-oxygene-feature-icon"><i class="fas fa-palette"></i></div>
      <h4 class="block-oxygene-feature-title">Design System</h4>
      <p class="block-oxygene-feature-text">Comprehensive tokens, components, and patterns for cohesive design.</p>
    </div>
    <div class="block-oxygene-feature-card">
      <div class="block-oxygene-feature-icon"><i class="fas fa-code"></i></div>
      <h4 class="block-oxygene-feature-title">Clean Code</h4>
      <p class="block-oxygene-feature-text">Semantic HTML and organized CSS that scales with your project.</p>
    </div>
    <div class="block-oxygene-feature-card">
      <div class="block-oxygene-feature-icon"><i class="fas fa-bolt"></i></div>
      <h4 class="block-oxygene-feature-title">Performance</h4>
      <p class="block-oxygene-feature-text">Optimized for speed and accessibility across all devices.</p>
    </div>
    <div class="block-oxygene-feature-card">
      <div class="block-oxygene-feature-icon"><i class="fas fa-shield-alt"></i></div>
      <h4 class="block-oxygene-feature-title">Reliability</h4>
      <p class="block-oxygene-feature-text">Battle-tested patterns built for real-world projects.</p>
    </div>
  </div>
</section>`,
  },

  // ==========================================================
  // BLOCK 3: SERVICES CARDS
  // ==========================================================
  {
    id: "oxy-services",
    label: "Oxygene · Services Cards",
    html: `<section class="block oxygene block-oxygene-services">
  <h3 class="block-oxygene-section-title">Services</h3>
  <p class="block-oxygene-section-description">Comprehensive solutions designed for your digital needs.</p>
  <div class="block-oxygene-services-grid">
    <div class="block-oxygene-service-card">
      <div class="block-oxygene-service-accent"></div>
      <h3 class="block-oxygene-service-title">Design</h3>
      <div class="block-oxygene-service-icon"><i class="fas fa-palette"></i></div>
      <p class="block-oxygene-service-description">We craft visual experiences that balance beauty with purpose.</p>
      <button class="block-oxygene-btn block-oxygene-btn-secondary">Learn More</button>
    </div>
    <div class="block-oxygene-service-card">
      <div class="block-oxygene-service-accent"></div>
      <h3 class="block-oxygene-service-title">Development</h3>
      <div class="block-oxygene-service-icon"><i class="fas fa-code"></i></div>
      <p class="block-oxygene-service-description">Modern, maintainable code with clean architecture.</p>
      <button class="block-oxygene-btn block-oxygene-btn-secondary">Learn More</button>
    </div>
    <div class="block-oxygene-service-card">
      <div class="block-oxygene-service-accent"></div>
      <h3 class="block-oxygene-service-title">Strategy</h3>
      <div class="block-oxygene-service-icon"><i class="fas fa-chart-line"></i></div>
      <p class="block-oxygene-service-description">Data-driven direction that keeps your brand luminous.</p>
      <button class="block-oxygene-btn block-oxygene-btn-secondary">Learn More</button>
    </div>
  </div>
</section>`,
  },

  // ==========================================================
  // BLOCK 4: PORTFOLIO TIMELINE
  // ==========================================================
  {
    id: "oxy-portfolio-timeline",
    label: "Oxygene · Stem & Leaf Timeline",
    html: `<section class="block oxygene block-oxygene-portfolio">
  <div class="block-oxygene-portfolio-header">
    <h3 class="block-oxygene-section-title">Portfolio</h3>
    <p class="block-oxygene-section-description">A timeline of projects, from foundation to finished work.</p>
  </div>
  <div class="block-oxygene-timeline" data-inject="portfolio-timeline">
    <div class="block-oxygene-year-label">2026</div>
    <div class="block-oxygene-timeline-items">
      <div class="block-oxygene-timeline-item">
        <div class="block-oxygene-timeline-dot"></div>
        <div class="block-oxygene-timeline-card">Web Dojo Platform — Full-stack redesign</div>
      </div>
      <div class="block-oxygene-timeline-item">
        <div class="block-oxygene-timeline-dot"></div>
        <div class="block-oxygene-timeline-card">Avalon GEMS — 14-gem design system</div>
      </div>
    </div>
  </div>
</section>`,
  },

  // ==========================================================
  // BLOCK 5: TESTIMONIALS CAROUSEL
  // ==========================================================
  {
    id: "oxy-testimonials",
    label: "Oxygene · Testimonials Carousel",
    html: `<section class="block oxygene block-oxygene-testimonials">
  <h3 class="block-oxygene-section-title">What They Say</h3>
  <p class="block-oxygene-section-description">Stories from partners who trusted the everlight.</p>
  <div class="block-oxygene-carousel">
    <div class="block-oxygene-carousel-wrapper">
      <div class="block-oxygene-carousel-slides" id="carouselSlides">
        <div class="block-oxygene-testimonial-slide">
          <p class="block-oxygene-testimonial-quote">"Oxygen transformed how we present our work. The glassmorphic depth gives every page a sense of calm focus."</p>
          <div class="block-oxygene-testimonial-author">
            <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=75" alt="Avatar" class="block-oxygene-testimonial-avatar" />
            <div class="block-oxygene-author-info">
              <h5 class="block-oxygene-author-name">Sarah Chen</h5>
              <span class="block-oxygene-author-role">Design Lead, LUMEN</span>
            </div>
          </div>
        </div>
        <div class="block-oxygene-testimonial-slide">
          <p class="block-oxygene-testimonial-quote">"The everlight palette instantly made our brand feel trustworthy."</p>
          <div class="block-oxygene-testimonial-author">
            <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=75" alt="Avatar" class="block-oxygene-testimonial-avatar" />
            <div class="block-oxygene-author-info">
              <h5 class="block-oxygene-author-name">Marcus Rivera</h5>
              <span class="block-oxygene-author-role">CTO, Vertex</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="block-oxygene-carousel-controls">
      <button class="block-oxygene-carousel-btn block-oxygene-carousel-btn-prev"><i class="fas fa-chevron-left"></i></button>
      <button class="block-oxygene-carousel-btn block-oxygene-carousel-btn-next"><i class="fas fa-chevron-right"></i></button>
    </div>
  </div>
</section>`,
  },
];

export default oxygenSections;
