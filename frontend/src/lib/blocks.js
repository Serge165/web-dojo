// Prebuilt block templates. Each block returns a raw HTML string with inline
// styles so the exported output is portable/standalone.

const heroImg = "https://images.unsplash.com/photo-1488972685288-c3fd157d7c7a?crop=entropy&cs=srgb&fm=jpg&w=1600&q=80";
const avatarImg = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=entropy&cs=srgb&fm=jpg&w=400&q=80";
const g1 = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=70";
const g2 = "https://images.unsplash.com/photo-1520975916090-3105956dac38?w=800&q=70";
const g3 = "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=70";
const g4 = "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=800&q=70";
const g5 = "https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?w=800&q=70";
const g6 = "https://images.unsplash.com/photo-1441829266145-6d4bfbf99bd8?w=800&q=70";

import { EXTRA_CATEGORIES } from "./blocksExtra";

const CORE_CATEGORIES = [
  {
    id: "components",
    label: "Components",
    blocks: [
      {
        id: "cmp-gallery-grid",
        label: "Gallery · 3-col Grid",
        html: `<section class="block block-components-gallery-grid-1 block-components-gallery-grid">
  <div class="block block-components-gallery-grid-2 block-components-gallery-grid">
    <h2 class="block block-components-gallery-grid-3 block-components-gallery-grid block-heading">Gallery</h2>
    <div class="block block-components-gallery-grid-4 block-components-gallery-grid container block cmp-gallery-grid">
      <img src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=70" class="block block-components-gallery-grid-5 block-components-gallery-grid" alt="" />
      <img src="https://images.unsplash.com/photo-1520975916090-3105956dac38?w=800&q=70" class="block block-components-gallery-grid-6 block-components-gallery-grid" alt="" />
      <img src="https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=70" class="block block-components-gallery-grid-7 block-components-gallery-grid" alt="" />
      <img src="https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=800&q=70" class="block block-components-gallery-grid-8 block-components-gallery-grid" alt="" />
      <img src="https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?w=800&q=70" class="block block-components-gallery-grid-9 block-components-gallery-grid" alt="" />
      <img src="https://images.unsplash.com/photo-1441829266145-6d4bfbf99bd8?w=800&q=70" class="block block-components-gallery-grid-10 block-components-gallery-grid" alt="" />
    </div>
  </div>
</section>`,
      },
      {
        id: "cmp-gallery-masonry",
        label: "Gallery · Masonry",
        html: `<section class="block block-components-gallery-masonry-1 block-components-gallery-masonry">
  <div class="block block-components-gallery-masonry-2 block-components-gallery-masonry">
    <h2 class="block block-components-gallery-masonry-3 block-components-gallery-masonry block-heading">Curated</h2>
    <div class="block block-components-gallery-masonry-4 block-components-gallery-masonry container block cmp-gallery-masonry">
      <img src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=70" class="block block-components-gallery-masonry-5 block-components-gallery-masonry" alt="" />
      <img src="https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=70" class="block block-components-gallery-masonry-6 block-components-gallery-masonry" alt="" />
      <img src="https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?w=800&q=70" class="block block-components-gallery-masonry-7 block-components-gallery-masonry" alt="" />
      <img src="https://images.unsplash.com/photo-1520975916090-3105956dac38?w=800&q=70" class="block block-components-gallery-masonry-8 block-components-gallery-masonry" alt="" />
      <img src="https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=800&q=70" class="block block-components-gallery-masonry-9 block-components-gallery-masonry" alt="" />
      <img src="https://images.unsplash.com/photo-1441829266145-6d4bfbf99bd8?w=800&q=70" class="block block-components-gallery-masonry-10 block-components-gallery-masonry" alt="" />
    </div>
  </div>
</section>`,
      },
      {
        id: "cmp-gallery-carousel",
        label: "Gallery · Scroll Carousel",
        html: `<section class="block block-components-gallery-carousel-1 block-components-gallery-carousel">
  <div class="block block-components-gallery-carousel-2 block-components-gallery-carousel">
    <h2 class="block block-components-gallery-carousel-3 block-components-gallery-carousel block-heading">Featured</h2>
  </div>
  <div class="block block-components-gallery-carousel-4 block-components-gallery-carousel container block cmp-gallery-carousel">
    <img src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=70" class="block block-components-gallery-carousel-5 block-components-gallery-carousel" alt="" /><img src="https://images.unsplash.com/photo-1520975916090-3105956dac38?w=800&q=70" class="block block-components-gallery-carousel-6 block-components-gallery-carousel" alt="" /><img src="https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=70" class="block block-components-gallery-carousel-7 block-components-gallery-carousel" alt="" /><img src="https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=800&q=70" class="block block-components-gallery-carousel-8 block-components-gallery-carousel" alt="" /><img src="https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?w=800&q=70" class="block block-components-gallery-carousel-9 block-components-gallery-carousel" alt="" /><img src="https://images.unsplash.com/photo-1441829266145-6d4bfbf99bd8?w=800&q=70" class="block block-components-gallery-carousel-10 block-components-gallery-carousel" alt="" />
  </div>
</section>`,
      },
      {
        id: "cmp-gallery-hover",
        label: "Gallery · Hover Zoom",
        html: `<section class="block block-components-gallery-hover-1 block-components-gallery-hover">
  <div class="block block-components-gallery-hover-2 block-components-gallery-hover">
    <div class="block block-components-gallery-hover-3 block-components-gallery-hover"><img src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=70" class="block block-components-gallery-hover-4 block-components-gallery-hover" onmouseover="this.style.transform='scale(1.08)'" onmouseout="this.style.transform='scale(1)'" alt="" /></div><div class="block block-components-gallery-hover-5 block-components-gallery-hover"><img src="https://images.unsplash.com/photo-1520975916090-3105956dac38?w=800&q=70" class="block block-components-gallery-hover-6 block-components-gallery-hover" onmouseover="this.style.transform='scale(1.08)'" onmouseout="this.style.transform='scale(1)'" alt="" /></div><div class="block block-components-gallery-hover-7 block-components-gallery-hover"><img src="https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=70" class="block block-components-gallery-hover-8 block-components-gallery-hover" onmouseover="this.style.transform='scale(1.08)'" onmouseout="this.style.transform='scale(1)'" alt="" /></div><div class="block block-components-gallery-hover-9 block-components-gallery-hover"><img src="https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=800&q=70" class="block block-components-gallery-hover-10 block-components-gallery-hover" onmouseover="this.style.transform='scale(1.08)'" onmouseout="this.style.transform='scale(1)'" alt="" /></div><div class="block block-components-gallery-hover-11 block-components-gallery-hover"><img src="https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?w=800&q=70" class="block block-components-gallery-hover-12 block-components-gallery-hover" onmouseover="this.style.transform='scale(1.08)'" onmouseout="this.style.transform='scale(1)'" alt="" /></div><div class="block block-components-gallery-hover-13 block-components-gallery-hover"><img src="https://images.unsplash.com/photo-1441829266145-6d4bfbf99bd8?w=800&q=70" class="block block-components-gallery-hover-14 block-components-gallery-hover" onmouseover="this.style.transform='scale(1.08)'" onmouseout="this.style.transform='scale(1)'" alt="" /></div><div class="block block-components-gallery-hover-15 block-components-gallery-hover"><img src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=70" class="block block-components-gallery-hover-16 block-components-gallery-hover" onmouseover="this.style.transform='scale(1.08)'" onmouseout="this.style.transform='scale(1)'" alt="" /></div><div class="block block-components-gallery-hover-17 block-components-gallery-hover"><img src="https://images.unsplash.com/photo-1520975916090-3105956dac38?w=800&q=70" class="block block-components-gallery-hover-18 block-components-gallery-hover" onmouseover="this.style.transform='scale(1.08)'" onmouseout="this.style.transform='scale(1)'" alt="" /></div>
  </div>
</section>`,
      },
      {
        id: "cmp-gallery-polaroid",
        label: "Gallery · Polaroid Stack",
        html: `<section class="block block-components-gallery-polaroid-1 block-components-gallery-polaroid">
  <div class="block block-components-gallery-polaroid-2 block-components-gallery-polaroid container block cmp-gallery-polaroid">
    <figure class="block block-components-gallery-polaroid-3 block-components-gallery-polaroid"><img src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=70" class="block block-components-gallery-polaroid-4 block-components-gallery-polaroid" alt="" /><figcaption class="block block-components-gallery-polaroid-5 block-components-gallery-polaroid">memory</figcaption></figure><figure class="block block-components-gallery-polaroid-6 block-components-gallery-polaroid"><img src="https://images.unsplash.com/photo-1520975916090-3105956dac38?w=800&q=70" class="block block-components-gallery-polaroid-7 block-components-gallery-polaroid" alt="" /><figcaption class="block block-components-gallery-polaroid-8 block-components-gallery-polaroid">memory</figcaption></figure><figure class="block block-components-gallery-polaroid-9 block-components-gallery-polaroid"><img src="https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=70" class="block block-components-gallery-polaroid-10 block-components-gallery-polaroid" alt="" /><figcaption class="block block-components-gallery-polaroid-11 block-components-gallery-polaroid">memory</figcaption></figure><figure class="block block-components-gallery-polaroid-12 block-components-gallery-polaroid"><img src="https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=800&q=70" class="block block-components-gallery-polaroid-13 block-components-gallery-polaroid" alt="" /><figcaption class="block block-components-gallery-polaroid-14 block-components-gallery-polaroid">memory</figcaption></figure><figure class="block block-components-gallery-polaroid-15 block-components-gallery-polaroid"><img src="https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?w=800&q=70" class="block block-components-gallery-polaroid-16 block-components-gallery-polaroid" alt="" /><figcaption class="block block-components-gallery-polaroid-17 block-components-gallery-polaroid">memory</figcaption></figure><figure class="block block-components-gallery-polaroid-18 block-components-gallery-polaroid"><img src="https://images.unsplash.com/photo-1441829266145-6d4bfbf99bd8?w=800&q=70" class="block block-components-gallery-polaroid-19 block-components-gallery-polaroid" alt="" /><figcaption class="block block-components-gallery-polaroid-20 block-components-gallery-polaroid">memory</figcaption></figure>
  </div>
</section>`,
      },
      {
        id: "cmp-gallery-lightbox",
        label: "Gallery · Featured + Thumbs",
        html: `<section class="block block-components-gallery-lightbox-1 block-components-gallery-lightbox">
  <div class="block block-components-gallery-lightbox-2 block-components-gallery-lightbox container block cmp-gallery-lightbox">
    <img src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=70" class="block block-components-gallery-lightbox-3 block-components-gallery-lightbox" alt="" />
    <img src="https://images.unsplash.com/photo-1520975916090-3105956dac38?w=800&q=70" class="block block-components-gallery-lightbox-4 block-components-gallery-lightbox" alt="" />
    <img src="https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=70" class="block block-components-gallery-lightbox-5 block-components-gallery-lightbox" alt="" />
  </div>
</section>`,
      },
      {
        id: "cmp-header-lrg",
        label: "Large Header",
        html: `<header class="block block-components-header-lrg-1 block-components-header-lrg">
  <div class="block block-components-header-lrg-2 block-components-header-lrg">
    <div class="block block-components-header-lrg-3 block-components-header-lrg">
      <div class="block block-components-header-lrg-4 block-components-header-lrg"></div>
      <span class="block block-components-header-lrg-5 block-components-header-lrg">Brand</span>
    </div>
    <nav class="block block-components-header-lrg-6 block-components-header-lrg">
      <a href="#" class="block block-components-header-lrg-7 block-components-header-lrg">Products</a>
      <a href="#" class="block block-components-header-lrg-8 block-components-header-lrg">Solutions</a>
      <a href="#" class="block block-components-header-lrg-9 block-components-header-lrg">Docs</a>
      <a href="#" class="block block-components-header-lrg-10 block-components-header-lrg">Pricing</a>
    </nav>
    <div class="block block-components-header-lrg-11 block-components-header-lrg">
      <button class="block block-components-header-lrg-12 block-components-header-lrg">Sign in</button>
      <button class="block block-components-header-lrg-13 block-components-header-lrg">Get started</button>
    </div>
  </div>
</header>`,
      },
      {
        id: "cmp-nav-glass",
        label: "Glass Navbar",
        html: `<nav class="block block-components-nav-glass-1 block-components-nav-glass">
  <div class="block block-components-nav-glass-2 block-components-nav-glass">◤ Aurora</div>
  <div class="block block-components-nav-glass-3 block-components-nav-glass">
    <a href="#" class="block block-components-nav-glass-4 block-components-nav-glass">Home</a>
    <a href="#" class="block block-components-nav-glass-5 block-components-nav-glass">Work</a>
    <a href="#" class="block block-components-nav-glass-6 block-components-nav-glass">Contact</a>
  </div>
  <button class="block block-components-nav-glass-7 block-components-nav-glass">Join</button>
</nav>`,
      },
      {
        id: "cmp-anim-hero",
        label: "Animated Hero",
        html: `<section class="block block-components-anim-hero-1 block-components-anim-hero">
  <h1 class="block block-components-anim-hero-2 block-components-anim-hero block-heading">Design in motion.</h1>
  <p class="block block-components-anim-hero-3 block-components-anim-hero">A studio-grade website builder with real-time animations, themes and export.</p>
  <button class="block block-components-anim-hero-4 block-components-anim-hero">Start creating</button>
  <style>@keyframes forge-slide-up{0%{opacity:0;transform:translateY(28px)}100%{opacity:1;transform:translateY(0)}}@keyframes forge-pop{0%{opacity:0;transform:scale(.6)}60%{transform:scale(1.06)}100%{opacity:1;transform:scale(1)}}</style>
</section>`,
      },
      {
        id: "cmp-anim-marquee",
        label: "Animated Marquee",
        html: `<section class="block block-components-anim-marquee-1 block-components-anim-marquee">
  <div class="block block-components-anim-marquee-2 block-components-anim-marquee">
    <span>◆ Design</span><span>◆ Build</span><span>◆ Ship</span><span>◆ Repeat</span>
    <span>◆ Design</span><span>◆ Build</span><span>◆ Ship</span><span>◆ Repeat</span>
  </div>
  <style>@keyframes forge-marquee{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}</style>
</section>`,
      },
      {
        id: "cmp-testimonial",
        label: "Testimonial",
        html: `<section class="block block-components-testimonial-1 block-components-testimonial">
  <div class="block block-components-testimonial-2 block-components-testimonial">
    <div class="block block-components-testimonial-3 block-components-testimonial">“</div>
    <p class="block block-components-testimonial-4 block-components-testimonial">Web Dojo changed the way our team ships marketing pages. We went from 2 weeks to 2 days.</p>
    <div class="block block-components-testimonial-5 block-components-testimonial">
      <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=entropy&cs=srgb&fm=jpg&w=200&q=80" class="block block-components-testimonial-6 block-components-testimonial" alt="" />
      <div class="block block-components-testimonial-7 block-components-testimonial"><div class="block block-components-testimonial-8 block-components-testimonial">Alex Rivera</div><div class="block block-components-testimonial-9 block-components-testimonial">Head of Design, Northwind</div></div>
    </div>
  </div>
</section>`,
      },
      {
        id: "cmp-pricing-3",
        label: "Pricing (3-col)",
        html: `<section class="block block-components-pricing-3-1 block-components-pricing-3">
  <div class="block block-components-pricing-3-2 block-components-pricing-3">
    <h2 class="block block-components-pricing-3-3 block-components-pricing-3 block-heading">Simple pricing</h2>
    <div class="block block-components-pricing-3-4 block-components-pricing-3">
      <div class="block block-components-pricing-3-5 block-components-pricing-3">
        <div class="block block-components-pricing-3-6 block-components-pricing-3">Free</div>
        <div class="block block-components-pricing-3-7 block-components-pricing-3">$0</div>
        <div class="block block-components-pricing-3-8 block-components-pricing-3">Forever</div>
        <button class="block block-components-pricing-3-9 block-components-pricing-3">Start free</button>
      </div>
      <div class="block block-components-pricing-3-10 block-components-pricing-3">
        <div class="block block-components-pricing-3-11 block-components-pricing-3">Pro</div>
        <div class="block block-components-pricing-3-12 block-components-pricing-3">$19</div>
        <div class="block block-components-pricing-3-13 block-components-pricing-3">per month</div>
        <button class="block block-components-pricing-3-14 block-components-pricing-3">Choose Pro</button>
      </div>
      <div class="block block-components-pricing-3-15 block-components-pricing-3">
        <div class="block block-components-pricing-3-16 block-components-pricing-3">Team</div>
        <div class="block block-components-pricing-3-17 block-components-pricing-3">$49</div>
        <div class="block block-components-pricing-3-18 block-components-pricing-3">per user / month</div>
        <button class="block block-components-pricing-3-19 block-components-pricing-3">Contact us</button>
      </div>
    </div>
  </div>
</section>`,
      },
      {
        id: "cmp-footer",
        label: "Footer",
        html: `<footer class="block block-components-footer-1 block-components-footer">
  <div class="block block-components-footer-2 block-components-footer">
    <div>
      <div class="block block-components-footer-3 block-components-footer">◤ Web Dojo</div>
      <p class="block block-components-footer-4 block-components-footer">Design and ship faster. Built for humans, powered by the web.</p>
    </div>
    <div><div class="block block-components-footer-5 block-components-footer">Product</div><ul class="block block-components-footer-6 block-components-footer"><li>Features</li><li>Pricing</li><li>Changelog</li></ul></div>
    <div><div class="block block-components-footer-7 block-components-footer">Company</div><ul class="block block-components-footer-8 block-components-footer"><li>About</li><li>Blog</li><li>Careers</li></ul></div>
    <div><div class="block block-components-footer-9 block-components-footer">Legal</div><ul class="block block-components-footer-10 block-components-footer"><li>Terms</li><li>Privacy</li></ul></div>
  </div>
  <div class="block block-components-footer-11 block-components-footer">© 2026 Web Dojo. All rights reserved.</div>
</footer>`,
      },
    ],
  },
  {
    id: "timelines",
    label: "Timelines",
    blocks: [
      {
        id: "cmp-timeline-vert",
        label: "Vertical Timeline",
        html: `<section class="block block-timelines-vert-1 block-timelines-vert">
  <div class="block block-timelines-vert-2 block-timelines-vert">
    <h2 class="block block-timelines-vert-3 block-timelines-vert block-heading">Our journey</h2>
    <ol class="block block-timelines-vert-4 block-timelines-vert container block cmp-timeline-vert">
      <li class="block block-timelines-vert-5 block-timelines-vert">
        <span class="block block-timelines-vert-6 block-timelines-vert"></span>
        <div class="block block-timelines-vert-7 block-timelines-vert">2021</div>
        <div class="block block-timelines-vert-8 block-timelines-vert">Founded</div>
        <p class="block block-timelines-vert-9 block-timelines-vert">Started in a small studio with three founders and a shared laptop.</p>
      </li><li class="block block-timelines-vert-10 block-timelines-vert">
        <span class="block block-timelines-vert-11 block-timelines-vert"></span>
        <div class="block block-timelines-vert-12 block-timelines-vert">2022</div>
        <div class="block block-timelines-vert-13 block-timelines-vert">Product launch</div>
        <p class="block block-timelines-vert-14 block-timelines-vert">Shipped v1 to 400 early users during a two-week beta.</p>
      </li><li class="block block-timelines-vert-15 block-timelines-vert">
        <span class="block block-timelines-vert-16 block-timelines-vert"></span>
        <div class="block block-timelines-vert-17 block-timelines-vert">2023</div>
        <div class="block block-timelines-vert-18 block-timelines-vert">Series A</div>
        <p class="block block-timelines-vert-19 block-timelines-vert">Raised $8M to expand the team and reach new markets.</p>
      </li><li class="block block-timelines-vert-20 block-timelines-vert">
        <span class="block block-timelines-vert-21 block-timelines-vert"></span>
        <div class="block block-timelines-vert-22 block-timelines-vert">2024</div>
        <div class="block block-timelines-vert-23 block-timelines-vert">Global reach</div>
        <p class="block block-timelines-vert-24 block-timelines-vert">Opened offices in Berlin and Singapore, hit 50k users.</p>
      </li><li class="block block-timelines-vert-25 block-timelines-vert">
        <span class="block block-timelines-vert-26 block-timelines-vert"></span>
        <div class="block block-timelines-vert-27 block-timelines-vert">Today</div>
        <div class="block block-timelines-vert-28 block-timelines-vert">Still shipping</div>
        <p class="block block-timelines-vert-29 block-timelines-vert">10 products, 120 teammates, one mission.</p>
      </li>
    </ol>
  </div>
</section>`,
      },
      {
        id: "cmp-timeline-alt",
        label: "Alternating Timeline",
        html: `<section class="block block-timelines-alt-1 block-timelines-alt">
  <div class="block block-timelines-alt-2 block-timelines-alt">
    <h2 class="block block-timelines-alt-3 block-timelines-alt block-heading">Milestones</h2>
    <div class="block block-timelines-alt-4 block-timelines-alt"></div>
    
      <div class="block block-timelines-alt-5 block-timelines-alt">
        <div class="block block-timelines-alt-6 block-timelines-alt">
          <div class="block block-timelines-alt-7 block-timelines-alt">Q1</div>
          <div class="block block-timelines-alt-8 block-timelines-alt">Concept sprint</div>
          <p class="block block-timelines-alt-9 block-timelines-alt">Whiteboarding sessions and 12 prototypes.</p>
        </div>
        <div class="block block-timelines-alt-10 block-timelines-alt">
          <span class="block block-timelines-alt-11 block-timelines-alt"></span>
        </div>
      </div>
      <div class="block block-timelines-alt-12 block-timelines-alt">
        <div class="block block-timelines-alt-13 block-timelines-alt">
          <div class="block block-timelines-alt-14 block-timelines-alt">Q2</div>
          <div class="block block-timelines-alt-15 block-timelines-alt">Closed beta</div>
          <p class="block block-timelines-alt-16 block-timelines-alt">Invited 200 makers to shape the product.</p>
        </div>
        <div class="block block-timelines-alt-17 block-timelines-alt">
          <span class="block block-timelines-alt-18 block-timelines-alt"></span>
        </div>
      </div>
      <div class="block block-timelines-alt-19 block-timelines-alt">
        <div class="block block-timelines-alt-20 block-timelines-alt">
          <div class="block block-timelines-alt-21 block-timelines-alt">Q3</div>
          <div class="block block-timelines-alt-22 block-timelines-alt">Public launch</div>
          <p class="block block-timelines-alt-23 block-timelines-alt">Grew to 15k signups in the first month.</p>
        </div>
        <div class="block block-timelines-alt-24 block-timelines-alt">
          <span class="block block-timelines-alt-25 block-timelines-alt"></span>
        </div>
      </div>
      <div class="block block-timelines-alt-26 block-timelines-alt">
        <div class="block block-timelines-alt-27 block-timelines-alt">
          <div class="block block-timelines-alt-28 block-timelines-alt">Q4</div>
          <div class="block block-timelines-alt-29 block-timelines-alt">Team scale</div>
          <p class="block block-timelines-alt-30 block-timelines-alt">Doubled the design and eng teams.</p>
        </div>
        <div class="block block-timelines-alt-31 block-timelines-alt">
          <span class="block block-timelines-alt-32 block-timelines-alt"></span>
        </div>
      </div>
  </div>
</section>`,
      },
      {
        id: "cmp-timeline-hori",
        label: "Horizontal Timeline",
        html: `<section class="block block-timelines-hori-1 block-timelines-hori">
  <div class="block block-timelines-hori-2 block-timelines-hori">
    <h2 class="block block-timelines-hori-3 block-timelines-hori block-heading">Roadmap 2026</h2>
    <div class="block block-timelines-hori-4 block-timelines-hori">
      <div class="block block-timelines-hori-5 block-timelines-hori"></div>
      <div class="block block-timelines-hori-6 block-timelines-hori">
        <div class="block block-timelines-hori-7 block-timelines-hori">
          <span class="block block-timelines-hori-8 block-timelines-hori"></span>
          <div class="block block-timelines-hori-9 block-timelines-hori">Q1</div>
          <div class="block block-timelines-hori-10 block-timelines-hori">Foundations</div>
          <p class="block block-timelines-hori-11 block-timelines-hori">Refactor + design system</p>
        </div><div class="block block-timelines-hori-12 block-timelines-hori">
          <span class="block block-timelines-hori-13 block-timelines-hori"></span>
          <div class="block block-timelines-hori-14 block-timelines-hori">Q2</div>
          <div class="block block-timelines-hori-15 block-timelines-hori">AI Studio</div>
          <p class="block block-timelines-hori-16 block-timelines-hori">Prompt-to-page module</p>
        </div><div class="block block-timelines-hori-17 block-timelines-hori">
          <span class="block block-timelines-hori-18 block-timelines-hori"></span>
          <div class="block block-timelines-hori-19 block-timelines-hori">Q3</div>
          <div class="block block-timelines-hori-20 block-timelines-hori">Team spaces</div>
          <p class="block block-timelines-hori-21 block-timelines-hori">Multi-user + comments</p>
        </div><div class="block block-timelines-hori-22 block-timelines-hori">
          <span class="block block-timelines-hori-23 block-timelines-hori"></span>
          <div class="block block-timelines-hori-24 block-timelines-hori">Q4</div>
          <div class="block block-timelines-hori-25 block-timelines-hori">Marketplace</div>
          <p class="block block-timelines-hori-26 block-timelines-hori">Sell templates on-platform</p>
        </div>
      </div>
    </div>
  </div>
</section>`,
      },
      {
        id: "cmp-timeline-cards",
        label: "Card Timeline",
        html: `<section class="block block-timelines-cards-1 block-timelines-cards">
  <div class="block block-timelines-cards-2 block-timelines-cards">
    <h2 class="block block-timelines-cards-3 block-timelines-cards block-heading">Release history</h2>
    <div class="block block-timelines-cards-4 block-timelines-cards">
      <article class="block block-timelines-cards-5 block-timelines-cards">
        <div>
          <div class="block block-timelines-cards-6 block-timelines-cards">v3.0</div>
          <div class="block block-timelines-cards-7 block-timelines-cards">Feb 2026</div>
        </div>
        <div class="block block-timelines-cards-8 block-timelines-cards">
          <span class="block block-timelines-cards-9 block-timelines-cards"></span>
        </div>
        <p class="block block-timelines-cards-10 block-timelines-cards">Contextual editors, timeline blocks, and CDN library.</p>
      </article><article class="block block-timelines-cards-11 block-timelines-cards">
        <div>
          <div class="block block-timelines-cards-12 block-timelines-cards">v2.4</div>
          <div class="block block-timelines-cards-13 block-timelines-cards">Jan 2026</div>
        </div>
        <div class="block block-timelines-cards-14 block-timelines-cards">
          <span class="block block-timelines-cards-15 block-timelines-cards"></span>
        </div>
        <p class="block block-timelines-cards-16 block-timelines-cards">Component marketplace + file tree with drag-drop imports.</p>
      </article><article class="block block-timelines-cards-17 block-timelines-cards">
        <div>
          <div class="block block-timelines-cards-18 block-timelines-cards">v2.0</div>
          <div class="block block-timelines-cards-19 block-timelines-cards">Nov 2025</div>
        </div>
        <div class="block block-timelines-cards-20 block-timelines-cards">
          <span class="block block-timelines-cards-21 block-timelines-cards"></span>
        </div>
        <p class="block block-timelines-cards-22 block-timelines-cards">Grid & Flexbox layout builders, aesthetic themes.</p>
      </article><article class="block block-timelines-cards-23 block-timelines-cards">
        <div>
          <div class="block block-timelines-cards-24 block-timelines-cards">v1.0</div>
          <div class="block block-timelines-cards-25 block-timelines-cards">Aug 2025</div>
        </div>
        <div class="block block-timelines-cards-26 block-timelines-cards">
          <span class="block block-timelines-cards-27 block-timelines-cards"></span>
        </div>
        <p class="block block-timelines-cards-28 block-timelines-cards">First public release with WYSIWYG editor and code mode.</p>
      </article>
    </div>
  </div>
</section>`,
      },
      {
        id: "cmp-timeline-steps",
        label: "Numbered Steps",
        html: `<section class="block block-timelines-steps-1 block-timelines-steps">
  <div class="block block-timelines-steps-2 block-timelines-steps">
    <h2 class="block block-timelines-steps-3 block-timelines-steps block-heading">How it works</h2>
    <ol class="block block-timelines-steps-4 block-timelines-steps container block cmp-timeline-steps">
      <li class="block block-timelines-steps-5 block-timelines-steps">
        <span class="block block-timelines-steps-6 block-timelines-steps">1</span>
        <div class="block block-timelines-steps-7 block-timelines-steps">Sign up</div>
        <p class="block block-timelines-steps-8 block-timelines-steps">Short description of step 1 — what happens and why it matters.</p>
      </li><li class="block block-timelines-steps-9 block-timelines-steps">
        <span class="block block-timelines-steps-10 block-timelines-steps">2</span>
        <div class="block block-timelines-steps-11 block-timelines-steps">Design</div>
        <p class="block block-timelines-steps-12 block-timelines-steps">Short description of step 2 — what happens and why it matters.</p>
      </li><li class="block block-timelines-steps-13 block-timelines-steps">
        <span class="block block-timelines-steps-14 block-timelines-steps">3</span>
        <div class="block block-timelines-steps-15 block-timelines-steps">Preview</div>
        <p class="block block-timelines-steps-16 block-timelines-steps">Short description of step 3 — what happens and why it matters.</p>
      </li><li class="block block-timelines-steps-17 block-timelines-steps">
        <span class="block block-timelines-steps-18 block-timelines-steps">4</span>
        <div class="block block-timelines-steps-19 block-timelines-steps">Ship</div>
        <p class="block block-timelines-steps-20 block-timelines-steps">Short description of step 4 — what happens and why it matters.</p>
      </li>
    </ol>
  </div>
</section>`,
      },
    ],
  },
  {
    id: "navbars",
    label: "Navbars",
    blocks: [
      {
        id: "nav-simple",
        label: "Simple Navbar",
        html: `<nav class="block block-navbars-simple-1 block-navbars-simple">
  <div class="block block-navbars-simple-2 block-navbars-simple">Brand</div>
  <div class="block block-navbars-simple-3 block-navbars-simple">
    <a href="#" class="block block-navbars-simple-4 block-navbars-simple">Home</a>
    <a href="#" class="block block-navbars-simple-5 block-navbars-simple">Features</a>
    <a href="#" class="block block-navbars-simple-6 block-navbars-simple">Pricing</a>
    <a href="#" class="block block-navbars-simple-7 block-navbars-simple">Contact</a>
  </div>
  <button class="block block-navbars-simple-8 block-navbars-simple">Sign up</button>
</nav>`,
      },
      {
        id: "nav-dark",
        label: "Dark Navbar",
        html: `<nav class="block block-navbars-dark-1 block-navbars-dark">
  <div class="block block-navbars-dark-2 block-navbars-dark">◤ Studio</div>
  <div class="block block-navbars-dark-3 block-navbars-dark">
    <a href="#" class="block block-navbars-dark-4 block-navbars-dark">Work</a>
    <a href="#" class="block block-navbars-dark-5 block-navbars-dark">About</a>
    <a href="#" class="block block-navbars-dark-6 block-navbars-dark">Journal</a>
  </div>
  <button class="block block-navbars-dark-7 block-navbars-dark">Contact</button>
</nav>`,
      },
    ],
  },
  {
    id: "heroes",
    label: "Heroes",
    blocks: [
      {
        id: "hero-centered",
        label: "Centered Hero",
        html: `<section class="block block-heroes-centered-1 block-heroes-centered">
  <div class="block block-heroes-centered-2 block-heroes-centered">
    <div class="block block-heroes-centered-3 block-heroes-centered">New · v1.0 released</div>
    <h1 class="block block-heroes-centered-4 block-heroes-centered block-heading">Build faster. Ship sharper.</h1>
    <p class="block block-heroes-centered-5 block-heroes-centered">A studio-grade website builder that gets out of your way. Drag, drop, and export production HTML.</p>
    <div class="block block-heroes-centered-6 block-heroes-centered">
      <button class="block block-heroes-centered-7 block-heroes-centered">Get started</button>
      <button class="block block-heroes-centered-8 block-heroes-centered">Live demo</button>
    </div>
  </div>
</section>`,
      },
      {
        id: "hero-split",
        label: "Split Hero",
        html: `<section class="block block-heroes-split-1 block-heroes-split">
  <div>
    <h1 class="block block-heroes-split-2 block-heroes-split block-heading">A canvas for the web.</h1>
    <p class="block block-heroes-split-3 block-heroes-split">Design in the browser. Import any HTML. Export standalone files. No lock-in.</p>
    <button class="block block-heroes-split-4 block-heroes-split">Start building</button>
  </div>
  <img src="https://images.unsplash.com/photo-1488972685288-c3fd157d7c7a?crop=entropy&cs=srgb&fm=jpg&w=1600&q=80" alt="hero" class="block block-heroes-split-5 block-heroes-split" />
</section>`,
      },
    ],
  },
  {
    id: "sections",
    label: "Sections",
    blocks: [
      {
        id: "section-feature",
        label: "Feature Grid",
        html: `<section class="block block-sections-feature-1 block-sections-feature">
  <div class="block block-sections-feature-2 block-sections-feature">
    <h2 class="block block-sections-feature-3 block-sections-feature block-heading">Everything you need.</h2>
    <div class="block block-sections-feature-4 block-sections-feature">
      <div class="block block-sections-feature-5 block-sections-feature">
        <div class="block block-sections-feature-6 block-sections-feature"></div>
        <h3 class="block block-sections-feature-7 block-sections-feature">Drag & Drop</h3>
        <p class="block block-sections-feature-8 block-sections-feature">Assemble pages visually with a snappy grid.</p>
      </div>
      <div class="block block-sections-feature-9 block-sections-feature">
        <div class="block block-sections-feature-10 block-sections-feature"></div>
        <h3 class="block block-sections-feature-11 block-sections-feature">Code Mode</h3>
        <p class="block block-sections-feature-12 block-sections-feature">Drop into raw HTML whenever you need power.</p>
      </div>
      <div class="block block-sections-feature-13 block-sections-feature">
        <div class="block block-sections-feature-14 block-sections-feature"></div>
        <h3 class="block block-sections-feature-15 block-sections-feature">Export</h3>
        <p class="block block-sections-feature-16 block-sections-feature">One click, ready-to-host HTML & CSS.</p>
      </div>
    </div>
  </div>
</section>`,
      },
      {
        id: "section-cta",
        label: "CTA Banner",
        html: `<section class="block block-sections-cta-1 block-sections-cta">
  <h2 class="block block-sections-cta-2 block-sections-cta block-heading">Ready to ship?</h2>
  <p class="block block-sections-cta-3 block-sections-cta">Export production HTML in a single click.</p>
  <button class="block block-sections-cta-4 block-sections-cta">Start now</button>
</section>`,
      },
    ],
  },
  {
    id: "containers",
    label: "Containers",
    blocks: [
      {
        id: "container-basic",
        label: "Container",
        html: `<div class="block block-containers-basic-1 block-containers-basic">
  <p class="block block-containers-basic-2 block-containers-basic">A responsive container. Drop content inside.</p>
</div>`,
      },
      {
        id: "container-2col",
        label: "2 Columns",
        html: `<div class="block block-containers-2col-1 block-containers-2col">
  <div class="block block-containers-2col-2 block-containers-2col">Column A</div>
  <div class="block block-containers-2col-3 block-containers-2col">Column B</div>
</div>`,
      },
      {
        id: "container-3col",
        label: "3 Columns",
        html: `<div class="block block-containers-3col-1 block-containers-3col">
  <div class="block block-containers-3col-2 block-containers-3col">A</div>
  <div class="block block-containers-3col-3 block-containers-3col">B</div>
  <div class="block block-containers-3col-4 block-containers-3col">C</div>
</div>`,
      },
    ],
  },
  {
    id: "text",
    label: "Text",
    blocks: [
      { id: "text-h1", label: "Heading 1", html: `<h1 class="block block-text-h1-1 block-text-h1 block-heading">Heading 1</h1>` },
      { id: "text-h2", label: "Heading 2", html: `<h2 class="block block-text-h2-1 block-text-h2 block-heading">Heading 2</h2>` },
      { id: "text-p", label: "Paragraph", html: `<p class="block block-text-p-1 block-text-p">A paragraph of body copy. Click to edit contents inline in Design mode.</p>` },
      { id: "text-input", label: "Text Input", html: `<div class="block block-text-input-1 block-text-input"><input type="text" placeholder="Type here…" class="block block-text-input-2 block-text-input" /></div>` },
      { id: "text-area", label: "Textarea", html: `<div class="block block-text-area-1 block-text-area"><textarea placeholder="Multi-line…" rows="4" class="block block-text-area-2 block-text-area"></textarea></div>` },
    ],
  },
  {
    id: "toolbox",
    label: "Toolbox",
    blocks: [
      { id: "tb-button", label: "Button", html: `<div class="block block-toolbox-button-1 block-toolbox-button"><button class="block block-toolbox-button-2 block-toolbox-button">Click me</button></div>` },
      { id: "tb-image", label: "Image", html: `<div class="block block-toolbox-image-1 block-toolbox-image"><img src="https://images.unsplash.com/photo-1488972685288-c3fd157d7c7a?crop=entropy&cs=srgb&fm=jpg&w=1600&q=80" alt="" class="block block-toolbox-image-2 block-toolbox-image" /></div>` },
      { id: "tb-divider", label: "Divider", html: `<hr class="block block-toolbox-divider-1 block-toolbox-divider" />` },
      { id: "tb-spacer", label: "Spacer", html: `<div class="block block-toolbox-spacer-1 block-toolbox-spacer"></div>` },
      { id: "tb-avatar", label: "Avatar", html: `<div class="block block-toolbox-avatar-1 block-toolbox-avatar"><img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=entropy&cs=srgb&fm=jpg&w=400&q=80" alt="" class="block block-toolbox-avatar-2 block-toolbox-avatar" /></div>` },
      { id: "tb-badge", label: "Badge", html: `<div class="block block-toolbox-badge-1 block-toolbox-badge"><span class="block block-toolbox-badge-2 block-toolbox-badge">New</span></div>` },
    ],
  },
];

const mergeCategories = (core, extra) => {
  const map = new Map(core.map((c) => [c.id, { ...c, blocks: [...c.blocks] }]));
  for (const c of extra) {
    if (map.has(c.id)) map.get(c.id).blocks.push(...c.blocks);
    else map.set(c.id, { ...c, blocks: [...c.blocks] });
  }
  return Array.from(map.values());
};

export const CATEGORIES = mergeCategories(CORE_CATEGORIES, EXTRA_CATEGORIES);

export const cardTemplate = (count = 3) => {
  const card = `
    <div style="padding:20px;border:1px solid var(--fc-border, #e5e7eb);border-radius:12px;background:var(--fc-surface, #fff);">
      <div style="width:44px;height:44px;background:var(--fc-primary, #0f172a);border-radius:10px;margin-bottom:14px;"></div>
      <h3 style="margin:0 0 6px;font-size:18px;color:var(--fc-text, #0f172a);">Card title</h3>
      <p style="margin:0;font-size:14px;color:var(--fc-muted, #64748b);">A short description of the card contents.</p>
    </div>`;
  return `<section style="padding:48px 32px;background:var(--fc-bg, #ffffff);font-family:Manrope,sans-serif;">
  <div style="display:grid;grid-template-columns:repeat(${count},1fr);gap:20px;max-width:1120px;margin:0 auto;">${card.repeat(count)}
  </div>
</section>`;
};

// Content pool for featureBoxesTemplate, ordered so slicing to the first N
// items (2-8) always reads as a coherent "why choose us" set rather than a
// random subset.
export const FEATURE_BOX_ITEMS = [
  { icon: `<path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/>`, title: "Fast Performance", desc: "Optimized for speed so your pages load instantly." },
  { icon: `<path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z"/>`, title: "Secure by Default", desc: "Built-in protections keep your data safe." },
  { icon: `<path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>`, title: "24/7 Support", desc: "Real people ready to help whenever you need it." },
  { icon: `<path d="M18 20V10M12 20V4M6 20v-6"/>`, title: "Actionable Insights", desc: "Track what matters with clear, simple analytics." },
  { icon: `<path d="M12 2l9 5-9 5-9-5 9-5zM3 12l9 5 9-5M3 17l9 5 9-5"/>`, title: "Easy Integrations", desc: "Connect the tools you already use in minutes." },
  { icon: `<path d="M4 6h10M4 12h6M4 18h13M17 4v4M14 10v4M20 16v4"/>`, title: "Full Customization", desc: "Tailor every detail to match your brand." },
  { icon: `<path d="M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>`, title: "Built for Teams", desc: "Collaborate smoothly with shared workspaces." },
  { icon: `<path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0112 5a5.5 5.5 0 019.5 7c-2.5 4.5-9.5 9-9.5 9z"/>`, title: "Trusted & Reliable", desc: "Consistent uptime you and your customers can count on." },
];

// Icon + header + paragraph + button cards, count-configurable (2-8, the
// common range for this pattern). Columns cap at 4 so 2-3 card grids don't
// stretch across an under-filled row; 5-8 cards wrap onto a second row.
export const featureBoxesTemplate = (count = 8) => {
  const n = Math.max(2, Math.min(8, Number.isFinite(count) ? Math.round(count) : 8));
  const cols = Math.min(n, 4);
  const cards = FEATURE_BOX_ITEMS.slice(0, n).map((item) => `
    <div style="padding:24px;border:1px solid var(--fc-border, #e2e8f0);border-radius:14px;background:var(--fc-surface, #f8fafc);">
      <div style="width:44px;height:44px;border-radius:10px;background:var(--fc-primary, #0f172a);display:flex;align-items:center;justify-content:center;margin-bottom:14px;"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${item.icon}</svg></div>
      <div style="font-weight:700;font-size:16px;color:var(--fc-text, #0f172a);margin:0 0 8px;">${item.title}</div>
      <p style="margin:0 0 16px;font-size:13px;line-height:1.7;color:var(--fc-muted, #64748b);">${item.desc}</p>
      <button style="background:var(--fc-primary, #0f172a);color:#fff;border:0;padding:9px 16px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;">Learn more</button>
    </div>`).join("");
  // The site-wide responsive rule collapses any inline-style grid to a
  // single column below 1024/767px ([style*="grid-template-columns"] in
  // responsiveCss.js). Feature boxes should stay a 2-column grid there
  // instead, so this overrides it with a higher-specificity !important
  // rule scoped to this block's own class.
  return `<section style="padding:72px 32px;background:var(--fc-bg, #ffffff);font-family:Manrope,system-ui,sans-serif;">
  <style>
  @media (max-width: 1024px) { .fb-grid[style*="grid-template-columns"] { grid-template-columns: repeat(2,1fr) !important; } }
  @media (max-width: 767px) { .fb-grid[style*="grid-template-columns"] { grid-template-columns: repeat(2,1fr) !important; } }
  @container (max-width: 1024px) { .fb-grid[style*="grid-template-columns"] { grid-template-columns: repeat(2,1fr) !important; } }
  @container (max-width: 767px) { .fb-grid[style*="grid-template-columns"] { grid-template-columns: repeat(2,1fr) !important; } }
  </style>
  <div style="max-width:1200px;margin:0 auto;">
  <h2 style="font-size:34px;letter-spacing:-.02em;margin:0 0 40px;color:var(--fc-text, #0f172a);text-align:center;">Why choose us</h2>
  <div class="fb-grid" style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:24px;">${cards}
  </div>
  </div>
</section>`;
};

export const WEB_SAFE_FONTS = [
  "Manrope, sans-serif",
  "system-ui, sans-serif",
  "Arial, Helvetica, sans-serif",
  "Georgia, 'Times New Roman', serif",
  "'Courier New', monospace",
  "'Trebuchet MS', sans-serif",
  "Verdana, Geneva, sans-serif",
  "Tahoma, Geneva, sans-serif",
];
