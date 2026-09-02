// Oxygene block-library CSS (Everlight Glassmorphic Theme).
// Source: src/scss/oxygene-globals.scss — plain CSS (no Sass features used),
// kept here as a JS string so it can plug into the same
// "static CSS constant spliced into Canvas + both export paths" pattern
// blockStyles.generated.js already uses, with no new build tooling.
export const OXYGENE_CSS = `
// ============================================================
// OXYGENE GLOBALS — Everlight Glassmorphic Theme
// All CSS classes for the Oxygene block system.
// Zero inline styles — Naming: block-oxygene-[ElementType]
// ============================================================

/* ---- Root Variables ---- */
:root {
  --oxy-primary:         #4a6bdf;
  --oxy-primary-light:   #7b9cff;
  --oxy-primary-gradient: linear-gradient(135deg, #4a6bdf, #7b9cff);
  --oxy-accent:          #a75fff;
  --oxy-accent-cyan:     #00d9ff;
  --oxy-text:            #0f172a;
  --oxy-text-light:      #e0e6ff;
  --oxy-muted:           #a9b4d4;
  --oxy-muted-darker:    #64748b;
  --oxy-border:          #e2e8f0;
  --oxy-bg:              #14213d;
  --oxy-bg-gradient:     linear-gradient(135deg, #14213d, #1a1a3e, #16213e);
  --oxy-surface-glass:   rgba(255,255,255,0.08);
  --oxy-surface-glass-hover: rgba(255,255,255,0.12);
  --oxy-surface-glass-border: 1px solid rgba(255,255,255,0.2);
  --oxy-surface-glass-border-hover: 1px solid rgba(255,255,255,0.3);
  --oxy-glass-blur:      blur(16px);
  --oxy-glass-blur-sm:   blur(12px);
  --oxy-glass-blur-lg:   blur(10px);
  --oxy-radius-sm:       8px;
  --oxy-radius-md:       12px;
  --oxy-radius-lg:       16px;
  --oxy-space-xs:        clamp(0.5rem, 1vw, 1rem);
  --oxy-space-sm:        clamp(1rem, 2vw, 1.5rem);
  --oxy-space-md:        clamp(1.5rem, 3vw, 2.5rem);
  --oxy-space-lg:        clamp(2rem, 5vw, 4rem);
  --oxy-space-xl:        clamp(3rem, 8vw, 6rem);
  --oxy-font:            Manrope, system-ui, sans-serif;
  --oxy-font-display:    var(--space-grotesk, "Space Grotesk"), system-ui, sans-serif;
  --oxy-font-mono:       var(--jetbrains-mono, "JetBrains Mono"), monospace;

  /* Backdrop/glassmorphism shortcut vars */
  --fc-backdrop-light:   var(--oxy-surface-glass);
  --fc-backdrop-medium:  var(--oxy-surface-glass-hover);
  --fc-backdrop-border:  var(--oxy-surface-glass-border);
  --fc-backdrop-blur:    var(--oxy-glass-blur);
}

/* ---- Block Base ---- */
.block.oxygene {
  font-family: var(--oxy-font);
}

/* ============================================================
   BLOCK 1: HERO SECTION
   ============================================================ */

.block-oxygene-hero {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: var(--oxy-space-md);
  text-align: center;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(20,33,61,0.5), rgba(74,107,223,0.3));
}

.block-oxygene-hero-inner {
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
  margin-bottom: var(--oxy-space-lg);
}

.block-oxygene-hero-title {
  font-family: var(--oxy-font-display);
  font-size: clamp(3rem, 5vw, 5rem);
  font-weight: 700;
  margin-bottom: var(--oxy-space-sm);
  color: var(--oxy-text-light);
  text-shadow: 0 4px 20px rgba(74, 107, 223, 0.3);
  background: linear-gradient(135deg, var(--oxy-primary-light), var(--oxy-accent-cyan));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.block-oxygene-hero-subtitle {
  font-family: var(--oxy-font-display);
  font-size: clamp(1.5rem, 3vw, 2.5rem);
  font-weight: 300;
  margin-bottom: var(--oxy-space-md);
  color: var(--oxy-muted);
}

.block-oxygene-hero-description {
  font-size: clamp(1rem, 1.2vw, 1.125rem);
  color: var(--oxy-muted);
  margin-bottom: var(--oxy-space-lg);
  line-height: 1.6;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

/* ============================================================
   BLOCK 2: FEATURES GRID
   ============================================================ */

.block-oxygene-features {
  position: relative;
  padding: var(--oxy-space-xl) var(--oxy-space-md);
}

.block-oxygene-features-header {
  margin-bottom: var(--oxy-space-xl);
}

.block-oxygene-section-title {
  font-family: var(--oxy-font-display);
  font-size: clamp(1.5rem, 2vw, 2rem);
  color: var(--oxy-text-light);
  margin-bottom: var(--oxy-space-sm);
  position: relative;
  display: inline-block;
}

.block-oxygene-section-title::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 60px;
  height: 3px;
  background: linear-gradient(90deg, var(--oxy-primary), var(--oxy-accent-cyan));
  border-radius: 2px;
}

.block-oxygene-section-description {
  color: var(--oxy-muted);
  margin-bottom: var(--oxy-space-lg);
  font-size: clamp(1rem, 1.2vw, 1.125rem);
  display: block;
}

/* Grid layout (shared) */
.block-oxygene-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--oxy-space-md);
}

.block-oxygene-services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--oxy-space-md);
  margin: var(--oxy-space-lg) 0;
}

/* ---- Feature Card ---- */
.block-oxygene-feature-card {
  background: var(--oxy-surface-glass);
  backdrop-filter: var(--oxy-glass-blur);
  -webkit-backdrop-filter: var(--oxy-glass-blur);
  border: var(--oxy-surface-glass-border);
  border-radius: var(--oxy-radius-lg);
  padding: var(--oxy-space-md);
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.block-oxygene-feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--oxy-primary), var(--oxy-accent));
  border-radius: var(--oxy-radius-lg) var(--oxy-radius-lg) 0 0;
}

.block-oxygene-feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 50px rgba(74, 107, 223, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
}

.block-oxygene-feature-icon {
  width: 56px;
  height: 56px;
  border-radius: var(--oxy-radius-md);
  background: var(--oxy-primary-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--oxy-space-sm);
  color: #ffffff;
  font-size: 24px;
}

.block-oxygene-feature-title {
  font-family: var(--oxy-font-display);
  font-size: clamp(1.25rem, 1.5vw, 1.5rem);
  color: var(--oxy-text-light);
  margin-bottom: var(--oxy-space-xs);
  font-weight: 600;
}

.block-oxygene-feature-text {
  color: var(--oxy-muted);
  font-size: clamp(1rem, 1.2vw, 1.125rem);
  line-height: 1.6;
  margin: 0;
}

/* ============================================================
   BLOCK 3: SERVICES CARDS
   ============================================================ */

.block-oxygene-services {
  position: relative;
  padding: var(--oxy-space-xl) var(--oxy-space-md);
}

.block-oxygene-service-card {
  background: var(--oxy-surface-glass);
  backdrop-filter: var(--oxy-glass-blur);
  -webkit-backdrop-filter: var(--oxy-glass-blur);
  border: var(--oxy-surface-glass-border);
  border-radius: var(--oxy-radius-lg);
  padding: var(--oxy-space-md);
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.block-oxygene-service-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 50px rgba(74, 107, 223, 0.2);
}

.block-oxygene-service-accent {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--oxy-primary), var(--oxy-accent));
  border-radius: var(--oxy-radius-lg) var(--oxy-radius-lg) 0 0;
}

.block-oxygene-service-title {
  font-family: var(--oxy-font-display);
  font-size: clamp(1.25rem, 1.5vw, 1.5rem);
  color: var(--oxy-text-light);
  margin-bottom: var(--oxy-space-sm);
  font-weight: 600;
}

.block-oxygene-service-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--oxy-radius-md);
  background: var(--oxy-primary-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  color: #ffffff;
  font-size: 20px;
}

.block-oxygene-service-description {
  color: var(--oxy-muted);
  font-size: clamp(1rem, 1.2vw, 1.125rem);
  margin-bottom: var(--oxy-space-sm);
  line-height: 1.6;
}

/* ============================================================
   BUTTONS
   ============================================================ */

.block-oxygene-btn {
  padding: var(--oxy-space-xs) var(--oxy-space-md);
  border-radius: var(--oxy-radius-sm);
  border: none;
  font-weight: 600;
  cursor: pointer;
  font-family: var(--oxy-font);
  font-size: clamp(1rem, 1.2vw, 1.125rem);
  transition: all 0.3s ease;
}

.block-oxygene-btn-primary {
  background: var(--oxy-primary-gradient);
  color: #ffffff;
  box-shadow: 0 8px 25px rgba(74, 107, 223, 0.3);
}

.block-oxygene-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 35px rgba(74, 107, 223, 0.5);
  background: linear-gradient(135deg, #5a7bef, #8baeff);
}

.block-oxygene-btn-secondary {
  background: var(--oxy-surface-glass-hover);
  color: var(--oxy-text-light);
  border: var(--oxy-surface-glass-border);
  backdrop-filter: var(--oxy-glass-blur-lg);
}

.block-oxygene-btn-secondary:hover {
  background: rgba(255,255,255,0.18);
  border-color: rgba(255,255,255,0.3);
  transform: translateY(-2px);
}

/* ============================================================
   BLOCK 4: PORTFOLIO TIMELINE
   ============================================================ */

.block-oxygene-portfolio {
  position: relative;
  padding: var(--oxy-space-xl) var(--oxy-space-md);
}

.block-oxygene-portfolio-header {
  margin-bottom: var(--oxy-space-xl);
}

.block-oxygene-timeline {
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: var(--oxy-space-sm) var(--oxy-space-md);
  position: relative;
  max-width: 900px;
  margin: var(--oxy-space-xl) auto;
}

.block-oxygene-year-label {
  font-weight: 700;
  color: var(--oxy-primary-light);
  text-align: right;
  padding-top: var(--oxy-space-xs);
  font-family: var(--oxy-font-display);
  font-size: clamp(1.25rem, 1.5vw, 1.5rem);
}

.block-oxygene-timeline-items {
  display: flex;
  flex-direction: column;
  gap: var(--oxy-space-sm);
  position: relative;
}

.block-oxygene-timeline-item {
  position: relative;
  padding-left: clamp(2rem, 5vw, 4rem);
  cursor: pointer;
}

.block-oxygene-timeline-dot {
  position: absolute;
  left: -18px;
  top: 8px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--oxy-surface-glass);
  border: 3px solid var(--oxy-primary);
  box-shadow: 0 0 0 3px var(--oxy-bg), 0 0 12px rgba(74, 107, 223, 0.4);
  transition: all 0.3s ease;
}

.block-oxygene-timeline-item:hover .block-oxygene-timeline-dot {
  transform: scale(1.3);
  box-shadow: 0 0 0 3px var(--oxy-bg), 0 0 20px rgba(74, 107, 223, 0.6);
}

.block-oxygene-timeline-card {
  background: var(--oxy-surface-glass);
  backdrop-filter: var(--oxy-glass-blur-sm);
  border: var(--oxy-surface-glass-border);
  border-left: 4px solid var(--oxy-primary);
  padding: var(--oxy-space-sm) var(--oxy-space-md);
  border-radius: var(--oxy-radius-md);
  transition: all 0.3s ease;
  color: var(--oxy-muted-darker);
}

.block-oxygene-timeline-item:hover .block-oxygene-timeline-card {
  background: var(--oxy-surface-glass-hover);
  border-left-color: var(--oxy-primary-light);
  transform: translateX(8px);
}

/* ============================================================
   BLOCK 5: TESTIMONIALS CAROUSEL
   ============================================================ */

.block-oxygene-testimonials {
  position: relative;
  padding: var(--oxy-space-xl) var(--oxy-space-md);
}

.block-oxygene-carousel {
  position: relative;
  max-width: 800px;
  margin: var(--oxy-space-lg) auto;
}

.block-oxygene-carousel-wrapper {
  position: relative;
  overflow: hidden;
  border-radius: var(--oxy-radius-lg);
}

.block-oxygene-carousel-slides {
  display: flex;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.block-oxygene-testimonial-slide {
  flex: 0 0 100%;
  padding: var(--oxy-space-md);
  background: var(--oxy-surface-glass);
  backdrop-filter: var(--oxy-glass-blur);
  -webkit-backdrop-filter: var(--oxy-glass-blur);
  border: var(--oxy-surface-glass-border);
  min-height: 300px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.block-oxygene-testimonial-quote {
  font-size: clamp(1.25rem, 1.5vw, 1.5rem);
  font-style: italic;
  margin: 0 0 var(--oxy-space-sm) 0;
  color: var(--oxy-text-light);
  line-height: 1.6;
}

.block-oxygene-testimonial-author {
  display: flex;
  align-items: center;
  gap: var(--oxy-space-sm);
  margin-top: var(--oxy-space-sm);
}

.block-oxygene-testimonial-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);
  object-fit: cover;
  flex-shrink: 0;
}

.block-oxygene-author-info {
  flex: 1;
}

.block-oxygene-author-name {
  color: var(--oxy-text-light);
  margin: 0;
  font-weight: 600;
  font-family: var(--oxy-font-display);
}

.block-oxygene-author-role {
  color: var(--oxy-muted);
  font-size: 0.9rem;
  display: block;
}

.block-oxygene-carousel-controls {
  display: flex;
  justify-content: center;
  gap: var(--oxy-space-xs);
  margin-top: var(--oxy-space-md);
}

.block-oxygene-carousel-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--oxy-surface-glass);
  border: var(--oxy-surface-glass-border);
  color: var(--oxy-muted);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: var(--oxy-glass-blur-lg);
  font-size: 14px;
}

.block-oxygene-carousel-btn:hover {
  background: var(--oxy-surface-glass-hover);
  border-color: rgba(255, 255, 255, 0.3);
  color: var(--oxy-text-light);
}

/* ============================================================
   GLASS CARD (shared utility)
   ============================================================ */

.glass-card {
  background: var(--fc-backdrop-light);
  backdrop-filter: var(--fc-backdrop-blur);
  -webkit-backdrop-filter: var(--fc-backdrop-blur);
  border: var(--fc-backdrop-border);
  border-radius: var(--oxy-radius-lg);
  padding: var(--oxy-space-md);
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.glass-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--oxy-primary), var(--oxy-accent));
  border-radius: var(--oxy-radius-lg) var(--oxy-radius-lg) 0 0;
}

.glass-card:hover {
  background: var(--fc-backdrop-medium);
  border-color: rgba(255, 255, 255, 0.3);
  transform: translateY(-4px);
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.15);
}

/* ============================================================
   RESPONSIVE
   ============================================================ */

@media (max-width: 768px) {
  .block.oxygene {
    padding: var(--oxy-space-lg) var(--oxy-space-sm);
  }

  .block-oxygene-timeline {
    grid-template-columns: 80px 1fr;
  }

  .block-oxygene-hero-title {
    font-size: clamp(2rem, 4vw, 3rem);
  }
}

@media (max-width: 480px) {
  .block-oxygene-grid,
  .block-oxygene-services-grid {
    grid-template-columns: 1fr;
  }

  .block-oxygene-timeline {
    grid-template-columns: 1fr;
  }

  .block-oxygene-testimonial-slide {
    min-height: 250px;
    padding: var(--oxy-space-sm);
  }
}

`;
