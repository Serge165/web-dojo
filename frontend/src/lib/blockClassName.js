// Pure, dependency-free — deliberately no imports, so it can be pulled into
// stripInlineStyles.js (which stays import-free itself, see that file's
// header comment), into Node-run tests, and later into Phase 4b's
// author-time block-template generation without dragging in anything else.
//
// This is THE single source of truth for the block-<catId>-<slug> naming
// scheme (docs/PHASE_4_BLOCK_AUDIT.md §3). stripInlineStyles.js uses it for
// export-time class generation (Phase 4a); Phase 4b's author-time templates
// must reuse this exact function rather than reimplementing the scheme, or
// the two will drift. Mirrored (as a literal duplicate, since the backend
// can't import frontend JS) in backend/server.py::_strip_inline_styles —
// keep both in sync, including BLOCK_PREFIX_BY_CAT.

// Per-category prefix to strip from a block id to get its slug. The
// semantic class name is block-<categoryId>-<slug>.
export const BLOCK_PREFIX_BY_CAT = {
  components: "cmp-",
  timelines: "cmp-timeline-",
  navbars: "nav-",
  headers: "hdr-",
  footers: "ft-",
  video: "video-",
  heroes: "hero-",
  sections: "section-",
  containers: "container-",
  text: "text-",
  toolbox: "tb-",
  pricing: "pricing-",
  team: "team-",
  faq: "faq-",
  newsletter: "newsletter-",
  portfolio: "portfolio-",
  layout: "layout-",
  services: "services-",
  contact: "contact-",
  testimonials: "testimonial-",
  esports: "esports-",
  creator: "creator-",
  retro: "retro-",
  parallax: "parallax-",
  social: "social-",
  comments: "comments-",
  zenero: "",
};

// block-<catId>-<slug>; slug = blockId with the category's prefix stripped
// (if the block id starts with it), else the full blockId. Unknown catIds
// still work — slug is just the full blockId.
export const blockClassName = (catId, blockId) => {
  const p = BLOCK_PREFIX_BY_CAT[catId];
  const slug = p && blockId.startsWith(p) ? blockId.slice(p.length) : blockId;
  return `block-${catId}-${slug}`;
};
