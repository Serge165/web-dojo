// Curated list of latest-known CDN links for popular web frameworks,
// utilities, and icon libraries. Each entry produces one or more <link>
// or <script> tags to inject into the project <head>.

export const CDN_LIBRARIES = [
  {
    id: "tailwind",
    label: "Tailwind CSS",
    category: "css",
    tags: [`<script src="https://cdn.tailwindcss.com"></script>`],
    note: "Play CDN — great for prototyping",
  },
  {
    id: "bootstrap5",
    label: "Bootstrap 5",
    category: "css",
    tags: [
      `<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">`,
      `<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>`,
    ],
  },
  {
    id: "bulma",
    label: "Bulma",
    category: "css",
    tags: [`<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bulma@1.0.2/css/bulma.min.css">`],
  },
  {
    id: "foundation",
    label: "Foundation",
    category: "css",
    tags: [`<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/foundation-sites@6.8.1/dist/css/foundation.min.css">`],
  },
  {
    id: "purecss",
    label: "Pure.css",
    category: "css",
    tags: [`<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/purecss@3.0.0/build/pure-min.css">`],
  },
  {
    id: "milligram",
    label: "Milligram",
    category: "css",
    tags: [`<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/milligram@1.4.1/dist/milligram.min.css">`],
  },
  {
    id: "alpine",
    label: "Alpine.js",
    category: "js",
    tags: [`<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.1/dist/cdn.min.js"></script>`],
  },
  {
    id: "htmx",
    label: "HTMX",
    category: "js",
    tags: [`<script src="https://unpkg.com/htmx.org@2.0.3"></script>`],
  },
  {
    id: "jquery",
    label: "jQuery",
    category: "js",
    tags: [`<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>`],
  },
  {
    id: "gsap",
    label: "GSAP",
    category: "js",
    tags: [`<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>`],
  },
  {
    id: "anime",
    label: "Anime.js",
    category: "js",
    tags: [`<script src="https://cdn.jsdelivr.net/npm/animejs@3.2.2/lib/anime.min.js"></script>`],
  },
  {
    id: "three",
    label: "Three.js",
    category: "js",
    tags: [`<script src="https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.min.js"></script>`],
  },
  {
    id: "chartjs",
    label: "Chart.js",
    category: "js",
    tags: [`<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js"></script>`],
  },
  {
    id: "d3",
    label: "D3",
    category: "js",
    tags: [`<script src="https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js"></script>`],
  },
  {
    id: "aos",
    label: "AOS Animate on Scroll",
    category: "js",
    tags: [
      `<link href="https://cdn.jsdelivr.net/npm/aos@2.3.4/dist/aos.css" rel="stylesheet">`,
      `<script src="https://cdn.jsdelivr.net/npm/aos@2.3.4/dist/aos.js"></script>`,
      `<script>window.addEventListener('load', () => window.AOS && window.AOS.init());</script>`,
    ],
  },
  {
    id: "swiper",
    label: "Swiper",
    category: "js",
    tags: [
      `<link href="https://cdn.jsdelivr.net/npm/swiper@11.1.14/swiper-bundle.min.css" rel="stylesheet">`,
      `<script src="https://cdn.jsdelivr.net/npm/swiper@11.1.14/swiper-bundle.min.js"></script>`,
    ],
  },
  {
    id: "lottie",
    label: "Lottie Web",
    category: "js",
    tags: [`<script src="https://cdn.jsdelivr.net/npm/lottie-web@5.12.2/build/player/lottie.min.js"></script>`],
  },
  {
    id: "react",
    label: "React 18 (UMD)",
    category: "js",
    tags: [
      `<script crossorigin src="https://unpkg.com/react@18.3.1/umd/react.production.min.js"></script>`,
      `<script crossorigin src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js"></script>`,
    ],
  },
  {
    id: "vue3",
    label: "Vue 3",
    category: "js",
    tags: [`<script src="https://unpkg.com/vue@3.5.11/dist/vue.global.prod.js"></script>`],
  },
  {
    id: "preact",
    label: "Preact",
    category: "js",
    tags: [`<script src="https://unpkg.com/preact@10.24.1/dist/preact.min.js"></script>`],
  },
  // Icon libraries
  {
    id: "fontawesome6",
    label: "Font Awesome 6",
    category: "icons",
    tags: [`<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css">`],
    example: `<i class="fa-solid fa-heart"></i>`,
  },
  {
    id: "material-icons",
    label: "Material Icons",
    category: "icons",
    tags: [`<link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons">`],
    example: `<span class="material-icons">favorite</span>`,
  },
  {
    id: "material-symbols",
    label: "Material Symbols",
    category: "icons",
    tags: [`<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />`],
    example: `<span class="material-symbols-outlined">favorite</span>`,
  },
  {
    id: "bootstrap-icons",
    label: "Bootstrap Icons",
    category: "icons",
    tags: [`<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">`],
    example: `<i class="bi bi-heart-fill"></i>`,
  },
  {
    id: "lucide-cdn",
    label: "Lucide",
    category: "icons",
    tags: [`<script src="https://unpkg.com/lucide@0.446.0/dist/umd/lucide.min.js"></script>`,
           `<script>window.addEventListener('load', () => window.lucide && window.lucide.createIcons());</script>`],
    example: `<i data-lucide="heart"></i>`,
  },
  {
    id: "heroicons-iconify",
    label: "Heroicons (via Iconify)",
    category: "icons",
    tags: [`<script src="https://cdn.jsdelivr.net/npm/iconify-icon@2.1.0/dist/iconify-icon.min.js"></script>`],
    example: `<iconify-icon icon="heroicons:heart-solid"></iconify-icon>`,
  },
  {
    id: "phosphor",
    label: "Phosphor Icons",
    category: "icons",
    tags: [`<script src="https://unpkg.com/@phosphor-icons/web"></script>`],
    example: `<i class="ph ph-heart"></i>`,
  },
  {
    id: "tabler",
    label: "Tabler Icons",
    category: "icons",
    tags: [`<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/dist/tabler-icons.min.css">`],
    example: `<i class="ti ti-heart"></i>`,
  },
];

export const CDN_CATEGORIES = [
  { id: "css", label: "CSS Frameworks" },
  { id: "js", label: "JavaScript" },
  { id: "icons", label: "Icons" },
];

// Given the existing head_html and a library id, return the new head_html
// with the library's tags either added or removed.
const marker = (id) => `<!-- forge:cdn:${id} -->`;

export const isLibInHead = (headHtml, id) => (headHtml || "").includes(marker(id));

export const toggleLib = (headHtml, lib) => {
  const m = marker(lib.id);
  if (isLibInHead(headHtml, lib.id)) {
    // remove the block bounded by the marker (marker + tags + closing marker)
    const start = headHtml.indexOf(m);
    const end = headHtml.indexOf(`<!-- /forge:cdn:${lib.id} -->`, start);
    if (start < 0 || end < 0) return headHtml;
    return (headHtml.slice(0, start) + headHtml.slice(end + `<!-- /forge:cdn:${lib.id} -->`.length)).replace(/\n{3,}/g, "\n\n").trim();
  }
  const block = [
    marker(lib.id),
    ...lib.tags,
    `<!-- /forge:cdn:${lib.id} -->`,
  ].join("\n");
  return (headHtml ? headHtml.trim() + "\n" : "") + block;
};
