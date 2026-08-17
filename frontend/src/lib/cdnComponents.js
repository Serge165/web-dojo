// Maps active CDN libraries -> ready-to-drop component blocks that use that
// library's classes/markup. Surfaced in the Library tab only when the CDN is
// present in <head>, so the tools "auto-appear" once a CDN is added.
import { isLibInHead } from "./cdns";

export const CDN_COMPONENTS = {
  bootstrap5: {
    label: "Bootstrap 5",
    blocks: [
      { id: "bs-navbar", label: "BS · Navbar", html: `<nav class="navbar navbar-expand-lg bg-body-tertiary border-bottom"><div class="container"><a class="navbar-brand fw-bold" href="#">Brand</a><div class="navbar-nav ms-auto"><a class="nav-link active" href="#">Home</a><a class="nav-link" href="#">Features</a><a class="nav-link" href="#">Pricing</a></div><button class="btn btn-primary ms-3">Sign up</button></div></nav>` },
      { id: "bs-card", label: "BS · Card", html: `<div class="container my-4"><div class="row g-3">${[1,2,3].map(i=>`<div class="col-md-4"><div class="card h-100 shadow-sm"><div class="card-body"><h5 class="card-title">Card ${i}</h5><p class="card-text text-secondary">Some quick example text to build on the card.</p><a href="#" class="btn btn-outline-primary btn-sm">Go</a></div></div></div>`).join("")}</div></div>` },
      { id: "bs-alert", label: "BS · Alert", html: `<div class="container my-3"><div class="alert alert-success" role="alert">✓ Well done! Bootstrap is active on this page.</div></div>` },
      { id: "bs-buttons", label: "BS · Buttons", html: `<div class="container my-3 d-flex gap-2 flex-wrap"><button class="btn btn-primary">Primary</button><button class="btn btn-secondary">Secondary</button><button class="btn btn-success">Success</button><button class="btn btn-outline-dark">Outline</button></div>` },
    ],
  },
  tailwind: {
    label: "Tailwind CSS",
    blocks: [
      { id: "tw-hero", label: "TW · Hero", html: `<section class="bg-slate-900 text-white px-8 py-24 text-center"><h1 class="text-5xl font-extrabold tracking-tight mb-4">Tailwind hero</h1><p class="text-slate-300 max-w-xl mx-auto mb-8">Utility-first section rendered with the Tailwind Play CDN.</p><a href="#" class="inline-block bg-indigo-500 hover:bg-indigo-400 transition px-6 py-3 rounded-lg font-semibold">Get started</a></section>` },
      { id: "tw-cards", label: "TW · Card Grid", html: `<section class="px-8 py-16 bg-white"><div class="max-w-5xl mx-auto grid md:grid-cols-3 gap-5">${[1,2,3].map(i=>`<div class="rounded-2xl border border-slate-200 p-6 hover:shadow-lg transition"><div class="w-10 h-10 rounded-lg bg-indigo-600 mb-4"></div><h3 class="font-semibold text-slate-900 mb-1">Feature ${i}</h3><p class="text-sm text-slate-500">Clean, responsive card built with Tailwind utilities.</p></div>`).join("")}</div></section>` },
      { id: "tw-cta", label: "TW · CTA", html: `<section class="px-8 py-16 bg-gradient-to-r from-indigo-600 to-sky-500 text-white text-center"><h2 class="text-3xl font-bold mb-3">Ready to build?</h2><a href="#" class="inline-block bg-white text-indigo-600 px-6 py-3 rounded-lg font-semibold">Start now</a></section>` },
    ],
  },
  bulma: {
    label: "Bulma",
    blocks: [
      { id: "bulma-hero", label: "Bulma · Hero", html: `<section class="hero is-primary is-medium"><div class="hero-body"><p class="title">Bulma hero</p><p class="subtitle">A clean hero using Bulma classes.</p></div></section>` },
      { id: "bulma-cards", label: "Bulma · Cards", html: `<section class="section"><div class="columns">${[1,2,3].map(i=>`<div class="column"><div class="card"><div class="card-content"><p class="title is-5">Card ${i}</p><p class="subtitle is-6 has-text-grey">Bulma card content.</p></div></div></div>`).join("")}</div></section>` },
    ],
  },
  fontawesome6: {
    label: "Font Awesome",
    blocks: [
      { id: "fa-social", label: "FA · Social Row", html: `<div style="display:flex;gap:16px;justify-content:center;padding:24px;font-size:22px;color:#334155;"><a href="#" style="color:inherit;"><i class="fa-brands fa-x-twitter"></i></a><a href="#" style="color:inherit;"><i class="fa-brands fa-instagram"></i></a><a href="#" style="color:inherit;"><i class="fa-brands fa-github"></i></a><a href="#" style="color:inherit;"><i class="fa-brands fa-youtube"></i></a></div>` },
      { id: "fa-features", label: "FA · Icon Features", html: `<section style="padding:56px 32px;font-family:Manrope,sans-serif;"><div style="max-width:900px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:24px;text-align:center;">${[["fa-bolt","Fast"],["fa-shield-halved","Secure"],["fa-heart","Loved"]].map(([ic,t])=>`<div><i class="fa-solid ${ic}" style="font-size:30px;color:#4f46e5;"></i><h3 style="margin:12px 0 4px;font-size:17px;color:#0f172a;">${t}</h3><p style="margin:0;font-size:14px;color:#64748b;">Icon-led feature powered by Font Awesome.</p></div>`).join("")}</div></section>` },
    ],
  },
  "bootstrap-icons": {
    label: "Bootstrap Icons",
    blocks: [
      { id: "bi-list", label: "BI · Checklist", html: `<ul style="list-style:none;padding:24px 32px;margin:0;font-family:Manrope,sans-serif;font-size:16px;color:#0f172a;max-width:420px;">${["Unlimited projects","Priority support","Custom domains"].map(t=>`<li style="padding:6px 0;"><i class="bi bi-check-circle-fill" style="color:#16a34a;"></i> ${t}</li>`).join("")}</ul>` },
    ],
  },
  aos: {
    label: "AOS Scroll Animations",
    blocks: [
      { id: "aos-reveal", label: "AOS · Reveal Section", html: `<section style="padding:80px 32px;font-family:Manrope,sans-serif;background:#fff;"><div style="max-width:800px;margin:0 auto;text-align:center;"><h2 data-aos="fade-up" style="font-size:36px;color:#0f172a;margin:0 0 12px;">Scroll to reveal</h2><p data-aos="fade-up" data-aos-delay="150" style="color:#64748b;font-size:16px;">These elements animate in on scroll using AOS.</p><div data-aos="zoom-in" data-aos-delay="300" style="margin-top:24px;height:180px;border-radius:16px;background:linear-gradient(135deg,#4f46e5,#0ea5e9);"></div></div></section>` },
    ],
  },
  swiper: {
    label: "Swiper Carousel",
    blocks: [
      { id: "swiper-slider", label: "Swiper · Slider", html: `<div class="swiper" style="max-width:900px;margin:32px auto;height:320px;"><div class="swiper-wrapper">${["#4f46e5","#0ea5e9","#f43f5e"].map((c,i)=>`<div class="swiper-slide" style="display:flex;align-items:center;justify-content:center;background:${c};color:#fff;font-family:Manrope,sans-serif;font-size:28px;border-radius:16px;">Slide ${i+1}</div>`).join("")}</div><div class="swiper-pagination"></div></div><script>new Swiper('.swiper',{loop:true,pagination:{el:'.swiper-pagination'}});</script>` },
    ],
  },
};

export const cdnComponentGroups = (headHtml) =>
  Object.entries(CDN_COMPONENTS)
    .filter(([id]) => isLibInHead(headHtml, id))
    .map(([id, group]) => ({ id, ...group }));
