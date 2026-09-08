// Avalon Gems: 14-gem per-element theming utility classes
// (h1/h2/h3.gem-ruby, p.gem-ruby, a.gem-ruby, button.gem-ruby, .border.gem-ruby,
// .gem-ruby-scroll, .gem-ruby-theme container tokens, etc. - one block per gem).
// Source: src/scss/avalon-gems.scss, compiled once with libsass (python3-libsass,
// system package - no npm sass dependency added) since this file uses real Sass
// features ($vars, @mixin/@include, & nesting), unlike oxygene-globals.scss.
// The compiled output below has the `@import "oxygene-globals.scss";` part
// stripped (see avalon-gems.scss lines 1-8) since OXYGENE_CSS (oxygeneStyles.js)
// is already injected earlier in the same cascade at every injection point this
// plugs into (Canvas.jsx, exportHtml.js) - re-embedding it here would just
// duplicate ~577 lines of identical rules.
// Regenerate with: python3 -c "import sass; css = sass.compile(filename='src/scss/avalon-gems.scss'); ..."
// (strip the @import line and pass through libsass) if avalon-gems.scss changes.
export const AVALON_GEMS_CSS = `
@charset "UTF-8";
/* ====================================
   PART 2: Gem Theme Definitions
   ====================================

   Dual-function framework: maps gemstone palettes to
   Web Dojo's --fc-* block-system variables so any
   gem can skin the entire Oxygene/everlight template.

   Each gem provides:
   - CSS custom properties (--gem-*-primary, --gem-*-accent, etc.)
   - Linear gradient (accent stripe for borders/right-accent)
   - Conic gradient (card/box background)
   - Text contrast (light or dark)
   - SCSS mixins for element-level theming

   ====================================
   1. CORE VARIABLES & MIXINS
   ==================================== */
/* ---- Animation keyframes ---- */
@keyframes gem-pulse {
  0%, 100% {
    filter: brightness(1);
  }
  50% {
    filter: brightness(1.1);
  }
}

@keyframes pulse-spin {
  0% {
    filter: hue-rotate(0deg);
  }
  100% {
    filter: hue-rotate(360deg);
  }
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

@keyframes sparkle-sweep {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(200%);
  }
}

@keyframes float-up {
  0% {
    bottom: -150px;
    opacity: 1;
  }
  100% {
    bottom: 100vh;
    opacity: 0;
  }
}

/* ---- Core mixins ---- */
/* ---- Parameterized element mixins ---- */
@keyframes gem-shimmer {
  0%, 100% {
    background-position: 0% center;
  }
  50% {
    background-position: 100% center;
  }
}

/* ====================================
   2. GEMS — 14 STONE PERMUTATIONS
   ==================================== */
:root {
  /* ---- 1. Ruby (Corundum — Red Aluminum Oxide) ---- */
  --gem-ruby-primary:    #9B111E;
  --gem-ruby-accent:     #E0115F;
  --gem-ruby-glow:       rgba(224, 17, 95, 0.5);
  --gem-ruby-text-dark:  #333333;
  --gem-ruby-text-light: #FFFFFF;
  --gem-ruby-gradient:   linear-gradient(135deg, #9B111E 0%, #E0115F 50%, #F280A1 100%);
  --gem-ruby-card:       conic-gradient(from 180deg at 50% 50%, #9B111E 0deg, #E0115F 90deg, #F280A1 180deg, #9B111E 270deg, #E0115F 360deg);
  /* ---- 2. Sapphire (Corundum — Blue Aluminum Oxide) ---- */
  --gem-sapphire-primary:    #0F52BA;
  --gem-sapphire-accent:     #3F8CFF;
  --gem-sapphire-glow:       rgba(63, 140, 255, 0.5);
  --gem-sapphire-text-dark:  #333333;
  --gem-sapphire-text-light: #FFFFFF;
  --gem-sapphire-gradient:   linear-gradient(135deg, #0F52BA 0%, #3F8CFF 50%, #94B8FF 100%);
  --gem-sapphire-card:       conic-gradient(from 180deg at 50% 50%, #0F52BA 0deg, #3F8CFF 90deg, #94B8FF 180deg, #0F52BA 270deg, #3F8CFF 360deg);
  /* ---- 3. Emerald (Beryl — Green) ---- */
  --gem-emerald-primary:    #046307;
  --gem-emerald-accent:     #1BB835;
  --gem-emerald-glow:       rgba(27, 184, 53, 0.5);
  --gem-emerald-text-dark:  #333333;
  --gem-emerald-text-light: #FFFFFF;
  --gem-emerald-gradient:   linear-gradient(135deg, #046307 0%, #1BB835 50%, #7CE39A 100%);
  --gem-emerald-card:       conic-gradient(from 180deg at 50% 50%, #046307 0deg, #1BB835 90deg, #7CE39A 180deg, #046307 270deg, #1BB835 360deg);
  /* ---- 4. Amethyst (Quartz — Purple) ---- */
  --gem-amethyst-primary:    #5B3E96;
  --gem-amethyst-accent:     #8A2BE2;
  --gem-amethyst-glow:       rgba(138, 43, 226, 0.5);
  --gem-amethyst-text-dark:  #333333;
  --gem-amethyst-text-light: #FFFFFF;
  --gem-amethyst-gradient:   linear-gradient(135deg, #5B3E96 0%, #8A2BE2 50%, #C7A0FF 100%);
  --gem-amethyst-card:       conic-gradient(from 180deg at 50% 50%, #5B3E96 0deg, #8A2BE2 90deg, #C7A0FF 180deg, #5B3E96 270deg, #8A2BE2 360deg);
  /* ---- 5. Topaz (Topaz — Golden Yellow) ---- */
  --gem-topaz-primary:    #FFC87C;
  --gem-topaz-accent:     #FFD700;
  --gem-topaz-glow:       rgba(255, 215, 0, 0.5);
  --gem-topaz-text-dark:  #111111;
  --gem-topaz-text-light: #FFFFFF;
  --gem-topaz-gradient:   linear-gradient(135deg, #FFC87C 0%, #FFD700 50%, #FFECB3 100%);
  --gem-topaz-card:       conic-gradient(from 180deg at 50% 50%, #FFC87C 0deg, #FFD700 90deg, #FFECB3 180deg, #FFC87C 270deg, #FFD700 360deg);
  /* ---- 6. Onyx (Chalcedony — Black) ---- */
  --gem-onyx-primary:    #1C1C1C;
  --gem-onyx-accent:     #434343;
  --gem-onyx-glow:       rgba(67, 67, 67, 0.5);
  --gem-onyx-text-dark:  #FFFFFF;
  --gem-onyx-text-light: #FFFFFF;
  --gem-onyx-gradient:   linear-gradient(135deg, #1C1C1C 0%, #434343 50%, #6B6B6B 100%);
  --gem-onyx-card:       conic-gradient(from 180deg at 50% 50%, #1C1C1C 0deg, #434343 90deg, #6B6B6B 180deg, #1C1C1C 270deg, #434343 360deg);
  /* ---- 7. Aquamarine (Beryl — Light Blue-green) ---- */
  --gem-aquamarine-primary:    #00D4FF;
  --gem-aquamarine-accent:     #40E0D0;
  --gem-aquamarine-glow:       rgba(64, 224, 208, 0.5);
  --gem-aquamarine-text-dark:  #333333;
  --gem-aquamarine-text-light: #FFFFFF;
  --gem-aquamarine-gradient:   linear-gradient(135deg, #00D4FF 0%, #40E0D0 50%, #AFEEEE 100%);
  --gem-aquamarine-card:       conic-gradient(from 180deg at 50% 50%, #00D4FF 0deg, #40E0D0 90deg, #AFEEEE 180deg, #00D4FF 270deg, #40E0D0 360deg);
  /* ---- 8. Morganite (Beryl — Pink-Peach) ---- */
  --gem-morganite-primary:    #FF69B4;
  --gem-morganite-accent:     #FFB6C1;
  --gem-morganite-glow:       rgba(255, 182, 193, 0.5);
  --gem-morganite-text-dark:  #111111;
  --gem-morganite-text-light: #FFFFFF;
  --gem-morganite-gradient:   linear-gradient(135deg, #FF69B4 0%, #FFB6C1 50%, #FFE4E1 100%);
  --gem-morganite-card:       conic-gradient(from 180deg at 50% 50%, #FF69B4 0deg, #FFB6C1 90deg, #FFE4E1 180deg, #FF69B4 270deg, #FFB6C1 360deg);
  /* ---- 9. Heliodor (Beryl — Golden Yellow) ---- */
  --gem-heliodor-primary:    #FFD700;
  --gem-heliodor-accent:     #FFA500;
  --gem-heliodor-glow:       rgba(255, 165, 0, 0.5);
  --gem-heliodor-text-dark:  #111111;
  --gem-heliodor-text-light: #FFFFFF;
  --gem-heliodor-gradient:   linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFDAB9 100%);
  --gem-heliodor-card:       conic-gradient(from 180deg at 50% 50%, #FFD700 0deg, #FFA500 90deg, #FFDAB9 180deg, #FFD700 270deg, #FFA500 360deg);
  /* ---- 10. Goshenite (Beryl — Colorless) ---- */
  --gem-goshenite-primary:    #F5F5F5;
  --gem-goshenite-accent:     #FFFFFF;
  --gem-goshenite-glow:       rgba(255, 255, 255, 0.5);
  --gem-goshenite-text-dark:  #111111;
  --gem-goshenite-text-light: #FFFFFF;
  --gem-goshenite-gradient:   linear-gradient(135deg, #F5F5F5 0%, #FFFFFF 50%, #E8E8E8 100%);
  --gem-goshenite-card:       conic-gradient(from 180deg at 50% 50%, #F5F5F5 0deg, #FFFFFF 90deg, #E8E8E8 180deg, #F5F5F5 270deg, #FFFFFF 360deg);
  /* ---- 11. Bixbite (Beryl — Deep Red) ---- */
  --gem-bixbite-primary:    #8B0000;
  --gem-bixbite-accent:     #DC143C;
  --gem-bixbite-glow:       rgba(220, 20, 60, 0.5);
  --gem-bixbite-text-dark:  #333333;
  --gem-bixbite-text-light: #FFFFFF;
  --gem-bixbite-gradient:   linear-gradient(135deg, #8B0000 0%, #DC143C 50%, #FF6B9D 100%);
  --gem-bixbite-card:       conic-gradient(from 180deg at 50% 50%, #8B0000 0deg, #DC143C 90deg, #FF6B9D 180deg, #8B0000 270deg, #DC143C 360deg);
  /* ---- 12. Padparadscha (Corundum — Pink-Orange) ---- */
  --gem-padparadscha-primary:    #FF6F61;
  --gem-padparadscha-accent:     #FF8A65;
  --gem-padparadscha-glow:       rgba(255, 138, 101, 0.5);
  --gem-padparadscha-text-dark:  #333333;
  --gem-padparadscha-text-light: #FFFFFF;
  --gem-padparadscha-gradient:   linear-gradient(135deg, #FF6F61 0%, #FF8A65 50%, #FFAB91 100%);
  --gem-padparadscha-card:       conic-gradient(from 180deg at 50% 50%, #FF6F61 0deg, #FF8A65 90deg, #FFAB91 180deg, #FF6F61 270deg, #FF8A65 360deg);
  /* ---- 13. Star Ruby (Corundum — Deep Red with Asterism) ---- */
  --gem-star-ruby-primary:    #7B0000;
  --gem-star-ruby-accent:     #C41E3A;
  --gem-star-ruby-glow:       rgba(196, 30, 58, 0.5);
  --gem-star-ruby-text-dark:  #333333;
  --gem-star-ruby-text-light: #FFFFFF;
  --gem-star-ruby-gradient:   linear-gradient(135deg, #7B0000 0%, #C41E3A 50%, #E63946 100%);
  --gem-star-ruby-card:       conic-gradient(from 180deg at 50% 50%, #7B0000 0deg, #C41E3A 90deg, #E63946 180deg, #7B0000 270deg, #C41E3A 360deg);
  /* ---- 14. Color-Change Corundum (Corundum — Green/Red Shift) ---- */
  --gem-color-change-primary:    #2D6A4F;
  --gem-color-change-accent:     #A7C957;
  --gem-color-change-glow:       rgba(167, 201, 87, 0.5);
  --gem-color-change-text-dark:  #333333;
  --gem-color-change-text-light: #FFFFFF;
  --gem-color-change-gradient:   linear-gradient(135deg, #2D6A4F 0%, #A7C957 50%, #D62828 100%);
  --gem-color-change-card:       conic-gradient(from 180deg at 50% 50%, #2D6A4F 0deg, #A7C957 90deg, #D62828 180deg, #2D6A4F 270deg, #A7C957 360deg);
  /* ---- Special: Indigo / Lapis Lazuli ---- */
  --gem-indigo-primary:    #4B0082;
  --gem-indigo-accent:     #8A2BE2;
  --gem-indigo-glow:       rgba(138, 43, 226, 0.5);
  --gem-indigo-text-dark:  #333333;
  --gem-indigo-text-light: #FFFFFF;
  --gem-indigo-gradient:   linear-gradient(135deg, #4B0082 0%, #8A2BE2 50%, #9370DB 100%);
  --gem-indigo-card:       conic-gradient(from 180deg at 50% 50%, #4B0082 0deg, #8A2BE2 90deg, #9370DB 180deg, #4B0082 270deg, #8A2BE2 360deg);
  /* Glassmorphic foundation */
  --glass-bg:         rgba(255,255,255,0.14);
  --glass-blur:       blur(18px);
  --glass-glow:       rgba(138,43,226,0.35);
  /* Text contrast tokens */
  --gem-card-text-light:  #F8F9FF;
  --gem-card-text-dark:   #111111;
}

/* ====================================
   3. BACKGROUND / GRADIENT CLASSES
   Maps each gem to Web Dojo --fc-* variables
   ==================================== */
/* ---- Ruby ---- */
.gem-gradient-ruby {
  background: var(--gem-ruby-gradient);
}

.gem-border-ruby {
  --gem-accent-gradient: var(--gem-ruby-gradient);
}

.gem-card-ruby {
  background: var(--gem-ruby-card);
  --gem-card-text: var(--gem-card-text-light);
}

.gem-ruby-theme {
  --fc-primary: var(--gem-ruby-primary);
  --fc-accent:  var(--gem-ruby-accent);
  --fc-text:    var(--gem-card-text-light);
  --fc-muted:   var(--gem-ruby-text-light);
  --fc-border:  rgba(155,17,30,0.3);
  --fc-bg:      #0a0a0d;
  --fc-surface: rgba(155,17,30,0.08);
  --glass-bg:   rgba(155,17,30,0.08);
  --glass-border: rgba(155,17,30,0.2);
}

/* ---- Sapphire ---- */
.gem-gradient-sapphire {
  background: var(--gem-sapphire-gradient);
}

.gem-border-sapphire {
  --gem-accent-gradient: var(--gem-sapphire-gradient);
}

.gem-card-sapphire {
  background: var(--gem-sapphire-card);
  --gem-card-text: var(--gem-card-text-light);
}

.gem-sapphire-theme {
  --fc-primary: var(--gem-sapphire-primary);
  --fc-accent:  var(--gem-sapphire-accent);
  --fc-text:    var(--gem-card-text-light);
  --fc-muted:   var(--gem-sapphire-text-light);
  --fc-border:  rgba(15,82,186,0.3);
  --fc-bg:      #0a0a1a;
  --fc-surface: rgba(15,82,186,0.08);
  --glass-bg:   rgba(15,82,186,0.08);
  --glass-border: rgba(15,82,186,0.2);
}

/* ---- Emerald ---- */
.gem-gradient-emerald {
  background: var(--gem-emerald-gradient);
}

.gem-border-emerald {
  --gem-accent-gradient: var(--gem-emerald-gradient);
}

.gem-card-emerald {
  background: var(--gem-emerald-card);
  --gem-card-text: var(--gem-card-text-light);
}

.gem-emerald-theme {
  --fc-primary: var(--gem-emerald-primary);
  --fc-accent:  var(--gem-emerald-accent);
  --fc-text:    var(--gem-card-text-light);
  --fc-muted:   var(--gem-emerald-text-light);
  --fc-border:  rgba(4,99,7,0.3);
  --fc-bg:      #0a0d0a;
  --fc-surface: rgba(4,99,7,0.08);
  --glass-bg:   rgba(4,99,7,0.08);
  --glass-border: rgba(4,99,7,0.2);
}

/* ---- Amethyst ---- */
.gem-gradient-amethyst {
  background: var(--gem-amethyst-gradient);
}

.gem-border-amethyst {
  --gem-accent-gradient: var(--gem-amethyst-gradient);
}

.gem-card-amethyst {
  background: var(--gem-amethyst-card);
  --gem-card-text: var(--gem-card-text-light);
}

.gem-amethyst-theme {
  --fc-primary: var(--gem-amethyst-primary);
  --fc-accent:  var(--gem-amethyst-accent);
  --fc-text:    var(--gem-card-text-light);
  --fc-muted:   var(--gem-amethyst-text-light);
  --fc-border:  rgba(91,62,150,0.3);
  --fc-bg:      #0f0a1a;
  --fc-surface: rgba(91,62,150,0.08);
  --glass-bg:   rgba(91,62,150,0.08);
  --glass-border: rgba(91,62,150,0.2);
}

/* ---- Topaz (dark text on light gem) ---- */
.gem-gradient-topaz {
  background: var(--gem-topaz-gradient);
}

.gem-border-topaz {
  --gem-accent-gradient: var(--gem-topaz-gradient);
}

.gem-card-topaz {
  background: var(--gem-topaz-card);
  --gem-card-text: var(--gem-card-text-dark);
}

.gem-topaz-theme {
  --fc-primary: var(--gem-topaz-primary);
  --fc-accent:  var(--gem-topaz-accent);
  --fc-text:    var(--gem-card-text-dark);
  --fc-muted:   var(--gem-topaz-text-dark);
  --fc-border:  rgba(255,200,124,0.4);
  --fc-bg:      #1a1208;
  --fc-surface: rgba(255,200,124,0.12);
  --glass-bg:   rgba(255,200,124,0.1);
  --glass-border: rgba(255,200,124,0.3);
}

/* ---- Onyx ---- */
.gem-gradient-onyx {
  background: var(--gem-onyx-gradient);
}

.gem-border-onyx {
  --gem-accent-gradient: var(--gem-onyx-gradient);
}

.gem-card-onyx {
  background: var(--gem-onyx-card);
  --gem-card-text: var(--gem-card-text-light);
}

.gem-onyx-theme {
  --fc-primary: var(--gem-onyx-primary);
  --fc-accent:  var(--gem-onyx-accent);
  --fc-text:    var(--gem-card-text-light);
  --fc-muted:   var(--gem-onyx-text-light);
  --fc-border:  rgba(28,28,28,0.3);
  --fc-bg:      #0a0a0a;
  --fc-surface: rgba(28,28,28,0.08);
  --glass-bg:   rgba(28,28,28,0.08);
  --glass-border: rgba(28,28,28,0.2);
}

/* ---- Aquamarine ---- */
.gem-gradient-aquamarine {
  background: var(--gem-aquamarine-gradient);
}

.gem-border-aquamarine {
  --gem-accent-gradient: var(--gem-aquamarine-gradient);
}

.gem-card-aquamarine {
  background: var(--gem-aquamarine-card);
  --gem-card-text: var(--gem-card-text-light);
}

.gem-aquamarine-theme {
  --fc-primary: var(--gem-aquamarine-primary);
  --fc-accent:  var(--gem-aquamarine-accent);
  --fc-text:    var(--gem-card-text-light);
  --fc-muted:   var(--gem-aquamarine-text-light);
  --fc-border:  rgba(0,212,255,0.3);
  --fc-bg:      #0a1a1f;
  --fc-surface: rgba(0,212,255,0.08);
  --glass-bg:   rgba(0,212,255,0.08);
  --glass-border: rgba(0,212,255,0.2);
}

/* ---- Morganite ---- */
.gem-gradient-morganite {
  background: var(--gem-morganite-gradient);
}

.gem-border-morganite {
  --gem-accent-gradient: var(--gem-morganite-gradient);
}

.gem-card-morganite {
  background: var(--gem-morganite-card);
  --gem-card-text: var(--gem-card-text-dark);
}

.gem-morganite-theme {
  --fc-primary: var(--gem-morganite-primary);
  --fc-accent:  var(--gem-morganite-accent);
  --fc-text:    var(--gem-card-text-dark);
  --fc-muted:   var(--gem-morganite-text-dark);
  --fc-border:  rgba(255,105,180,0.4);
  --fc-bg:      #1a0a12;
  --fc-surface: rgba(255,105,180,0.12);
  --glass-bg:   rgba(255,105,180,0.1);
  --glass-border: rgba(255,105,180,0.3);
}

/* ---- Heliodor ---- */
.gem-gradient-heliodor {
  background: var(--gem-heliodor-gradient);
}

.gem-border-heliodor {
  --gem-accent-gradient: var(--gem-heliodor-gradient);
}

.gem-card-heliodor {
  background: var(--gem-heliodor-card);
  --gem-card-text: var(--gem-card-text-dark);
}

.gem-heliodor-theme {
  --fc-primary: var(--gem-heliodor-primary);
  --fc-accent:  var(--gem-heliodor-accent);
  --fc-text:    var(--gem-card-text-dark);
  --fc-muted:   var(--gem-heliodor-text-dark);
  --fc-border:  rgba(255,215,0,0.4);
  --fc-bg:      #1a1508;
  --fc-surface: rgba(255,215,0,0.12);
  --glass-bg:   rgba(255,215,0,0.1);
  --glass-border: rgba(255,215,0,0.3);
}

/* ---- Goshenite ---- */
.gem-gradient-goshenite {
  background: var(--gem-goshenite-gradient);
}

.gem-border-goshenite {
  --gem-accent-gradient: var(--gem-goshenite-gradient);
}

.gem-card-goshenite {
  background: var(--gem-goshenite-card);
  --gem-card-text: var(--gem-card-text-dark);
}

.gem-goshenite-theme {
  --fc-primary: var(--gem-goshenite-primary);
  --fc-accent:  var(--gem-goshenite-accent);
  --fc-text:    var(--gem-card-text-dark);
  --fc-muted:   #333333;
  --fc-border:  rgba(245,245,245,0.4);
  --fc-bg:      #0a0a0a;
  --fc-surface: rgba(245,245,245,0.08);
  --glass-bg:   rgba(245,245,245,0.05);
  --glass-border: rgba(245,245,245,0.3);
}

/* ---- Bixbite ---- */
.gem-gradient-bixbite {
  background: var(--gem-bixbite-gradient);
}

.gem-border-bixbite {
  --gem-accent-gradient: var(--gem-bixbite-gradient);
}

.gem-card-bixbite {
  background: var(--gem-bixbite-card);
  --gem-card-text: var(--gem-card-text-light);
}

.gem-bixbite-theme {
  --fc-primary: var(--gem-bixbite-primary);
  --fc-accent:  var(--gem-bixbite-accent);
  --fc-text:    var(--gem-card-text-light);
  --fc-muted:   var(--gem-bixbite-text-light);
  --fc-border:  rgba(139,0,0,0.3);
  --fc-bg:      #0a0a0d;
  --fc-surface: rgba(139,0,0,0.08);
  --glass-bg:   rgba(139,0,0,0.08);
  --glass-border: rgba(139,0,0,0.2);
}

/* ---- Padparadscha ---- */
.gem-gradient-padparadscha {
  background: var(--gem-padparadscha-gradient);
}

.gem-border-padparadscha {
  --gem-accent-gradient: var(--gem-padparadscha-gradient);
}

.gem-card-padparadscha {
  background: var(--gem-padparadscha-card);
  --gem-card-text: var(--gem-card-text-light);
}

.gem-padparadscha-theme {
  --fc-primary: var(--gem-padparadscha-primary);
  --fc-accent:  var(--gem-padparadscha-accent);
  --fc-text:    var(--gem-card-text-light);
  --fc-muted:   var(--gem-padparadscha-text-light);
  --fc-border:  rgba(255,111,97,0.3);
  --fc-bg:      #1a0d08;
  --fc-surface: rgba(255,111,97,0.08);
  --glass-bg:   rgba(255,111,97,0.08);
  --glass-border: rgba(255,111,97,0.2);
}

/* ---- Star Ruby ---- */
.gem-gradient-star-ruby {
  background: var(--gem-star-ruby-gradient);
}

.gem-border-star-ruby {
  --gem-accent-gradient: var(--gem-star-ruby-gradient);
}

.gem-card-star-ruby {
  background: var(--gem-star-ruby-card);
  --gem-card-text: var(--gem-card-text-light);
}

.gem-star-ruby-theme {
  --fc-primary: var(--gem-star-ruby-primary);
  --fc-accent:  var(--gem-star-ruby-accent);
  --fc-text:    var(--gem-card-text-light);
  --fc-muted:   var(--gem-star-ruby-text-light);
  --fc-border:  rgba(123,0,0,0.3);
  --fc-bg:      #0a0a0d;
  --fc-surface: rgba(123,0,0,0.08);
  --glass-bg:   rgba(123,0,0,0.08);
  --glass-border: rgba(123,0,0,0.2);
}

/* ---- Color-Change Corundum ---- */
.gem-gradient-color-change {
  background: var(--gem-color-change-gradient);
}

.gem-border-color-change {
  --gem-accent-gradient: var(--gem-color-change-gradient);
}

.gem-card-color-change {
  background: var(--gem-color-change-card);
  --gem-card-text: var(--gem-card-text-light);
}

.gem-color-change-theme {
  --fc-primary: var(--gem-color-change-primary);
  --fc-accent:  var(--gem-color-change-accent);
  --fc-text:    var(--gem-card-text-light);
  --fc-muted:   var(--gem-color-change-text-light);
  --fc-border:  rgba(45,106,79,0.3);
  --fc-bg:      #0a120d;
  --fc-surface: rgba(45,106,79,0.08);
  --glass-bg:   rgba(45,106,79,0.08);
  --glass-border: rgba(45,106,79,0.2);
}

/* ---- Indigo / Lapis Lazuli ---- */
.gem-gradient-indigo {
  background: var(--gem-indigo-gradient);
}

.gem-border-indigo {
  --gem-accent-gradient: var(--gem-indigo-gradient);
}

.gem-card-indigo {
  background: var(--gem-indigo-card);
  --gem-card-text: var(--gem-card-text-light);
}

.gem-indigo-theme {
  --fc-primary: var(--gem-indigo-primary);
  --fc-accent:  var(--gem-indigo-accent);
  --fc-text:    var(--gem-card-text-light);
  --fc-muted:   var(--gem-indigo-text-light);
  --fc-border:  rgba(75,0,130,0.3);
  --fc-bg:      #0a0a1a;
  --fc-surface: rgba(75,0,130,0.08);
  --glass-bg:   rgba(75,0,130,0.08);
  --glass-border: rgba(75,0,130,0.2);
}

/* ====================================
   4. RIGHT-BORDER ACCENT SYSTEM
   ==================================== */
.gem-right-accent {
  position: relative;
  overflow: hidden;
}

.gem-right-accent::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 0.85rem;
  height: 100%;
  background: var(--gem-accent-gradient, transparent);
  border-radius: 0 1.25rem 1.25rem 0;
  pointer-events: none;
}

/* ====================================
   5. GLASSMORPHIC PANEL (Oxygen theme)
   ==================================== */
.glass-panel {
  background: var(--glass-bg, rgba(255, 255, 255, 0.14));
  backdrop-filter: var(--glass-blur, blur(18px));
  -webkit-backdrop-filter: var(--glass-blur, blur(18px));
  box-shadow: 0 0 35px var(--glass-glow, rgba(138, 43, 226, 0.35));
}

/* ====================================
   6. ELEMENT-LEVEL THEMES
   Each gem has .gem-{name} class for:
   h1-h6 (header), p (paragraph), a (link),
   button/.btn/.cta (button), .border (border),
   .gem-{name}-scroll (scrollbar)
   ==================================== */
/* ---- Ruby elements ---- */
h1.gem-ruby, h2.gem-ruby, h3.gem-ruby {
  color: var(--gem-ruby-primary);
  background: linear-gradient(135deg, var(--gem-ruby-primary) 0%, var(--gem-ruby-accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  font-weight: 700;
  letter-spacing: 0.05em;
  transition: all 0.28s ease;
}

h1.gem-ruby:hover, h2.gem-ruby:hover, h3.gem-ruby:hover {
  text-shadow: 0 0 20px var(--gem-ruby-glow), 0 2px 8px rgba(0, 0, 0, 0.3);
  filter: drop-shadow(0 0 15px var(--gem-ruby-glow));
}

p.gem-ruby {
  color: var(--gem-ruby-text-dark);
  line-height: 1.6;
  font-size: 1rem;
  letter-spacing: 0.015em;
  transition: color 0.28s ease;
}

p.gem-ruby:hover {
  color: var(--gem-ruby-primary);
}

a.gem-ruby {
  color: var(--gem-ruby-primary);
  text-decoration: none;
  position: relative;
  font-weight: 600;
  border-bottom: 2px solid transparent;
  transition: all 0.28s ease;
}

a.gem-ruby::before {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--gem-ruby-primary), var(--gem-ruby-accent));
  transition: width 0.28s ease;
}

a.gem-ruby:hover {
  color: var(--gem-ruby-accent);
  text-shadow: 0 0 12px var(--gem-ruby-glow);
}

a.gem-ruby:hover::before {
  width: 100%;
}

a.gem-ruby:active {
  color: var(--gem-ruby-primary);
}

button.gem-ruby, .btn.gem-ruby, .cta.gem-ruby {
  background: linear-gradient(135deg, var(--gem-ruby-primary) 0%, var(--gem-ruby-accent) 100%);
  color: #FFFFFF;
  border: 2px solid transparent;
  border-image: linear-gradient(135deg, var(--gem-ruby-primary), var(--gem-ruby-accent)) 1;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.28s ease;
}

button.gem-ruby:hover, .btn.gem-ruby:hover, .cta.gem-ruby:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px var(--gem-ruby-glow);
  filter: brightness(1.1);
}

button.gem-ruby:active, .btn.gem-ruby:active, .cta.gem-ruby:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

button.gem-ruby:disabled, .btn.gem-ruby:disabled, .cta.gem-ruby:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.border.gem-ruby {
  border: 2px solid transparent;
  border-image: linear-gradient(135deg, var(--gem-ruby-primary), var(--gem-ruby-accent)) 1;
  transition: all 0.28s ease;
}

.border.gem-ruby:hover {
  box-shadow: inset 0 0 20px var(--gem-ruby-glow), 0 0 15px var(--gem-ruby-glow);
  border-width: 2px;
}

.gem-ruby-scroll {
  scrollbar-color: linear-gradient(135deg, var(--gem-ruby-primary), var(--gem-ruby-accent)) rgba(19, 18, 25, 0.1);
  scrollbar-width: thin;
}

.gem-ruby-scroll::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

.gem-ruby-scroll::-webkit-scrollbar-track {
  background: rgba(19, 18, 25, 0.1);
  border-radius: 6px;
}

.gem-ruby-scroll::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, var(--gem-ruby-primary), var(--gem-ruby-accent));
  border-radius: 6px;
  border: 2px solid rgba(19, 18, 25, 0.1);
  transition: all 0.28s ease;
}

.gem-ruby-scroll::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, var(--gem-ruby-accent), var(--gem-ruby-primary));
  box-shadow: 0 0 15px rgba(var(--gem-ruby-accent), 0.4);
}

/* ---- Sapphire elements ---- */
h1.gem-sapphire, h2.gem-sapphire, h3.gem-sapphire {
  color: var(--gem-sapphire-primary);
  background: linear-gradient(135deg, var(--gem-sapphire-primary) 0%, var(--gem-sapphire-accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  font-weight: 700;
  letter-spacing: 0.05em;
  transition: all 0.28s ease;
}

h1.gem-sapphire:hover, h2.gem-sapphire:hover, h3.gem-sapphire:hover {
  text-shadow: 0 0 20px var(--gem-sapphire-glow), 0 2px 8px rgba(0, 0, 0, 0.3);
  filter: drop-shadow(0 0 15px var(--gem-sapphire-glow));
}

p.gem-sapphire {
  color: var(--gem-sapphire-text-dark);
  line-height: 1.6;
  font-size: 1rem;
  letter-spacing: 0.015em;
  transition: color 0.28s ease;
}

p.gem-sapphire:hover {
  color: var(--gem-sapphire-primary);
}

a.gem-sapphire {
  color: var(--gem-sapphire-primary);
  text-decoration: none;
  position: relative;
  font-weight: 600;
  border-bottom: 2px solid transparent;
  transition: all 0.28s ease;
}

a.gem-sapphire::before {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--gem-sapphire-primary), var(--gem-sapphire-accent));
  transition: width 0.28s ease;
}

a.gem-sapphire:hover {
  color: var(--gem-sapphire-accent);
  text-shadow: 0 0 12px var(--gem-sapphire-glow);
}

a.gem-sapphire:hover::before {
  width: 100%;
}

a.gem-sapphire:active {
  color: var(--gem-sapphire-primary);
}

button.gem-sapphire, .btn.gem-sapphire, .cta.gem-sapphire {
  background: linear-gradient(135deg, var(--gem-sapphire-primary) 0%, var(--gem-sapphire-accent) 100%);
  color: #FFFFFF;
  border: 2px solid transparent;
  border-image: linear-gradient(135deg, var(--gem-sapphire-primary), var(--gem-sapphire-accent)) 1;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.28s ease;
}

button.gem-sapphire:hover, .btn.gem-sapphire:hover, .cta.gem-sapphire:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px var(--gem-sapphire-glow);
  filter: brightness(1.1);
}

button.gem-sapphire:active, .btn.gem-sapphire:active, .cta.gem-sapphire:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

button.gem-sapphire:disabled, .btn.gem-sapphire:disabled, .cta.gem-sapphire:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.border.gem-sapphire {
  border: 2px solid transparent;
  border-image: linear-gradient(135deg, var(--gem-sapphire-primary), var(--gem-sapphire-accent)) 1;
  transition: all 0.28s ease;
}

.border.gem-sapphire:hover {
  box-shadow: inset 0 0 20px var(--gem-sapphire-glow), 0 0 15px var(--gem-sapphire-glow);
  border-width: 2px;
}

.gem-sapphire-scroll {
  scrollbar-color: linear-gradient(135deg, var(--gem-sapphire-primary), var(--gem-sapphire-accent)) rgba(19, 18, 25, 0.1);
  scrollbar-width: thin;
}

.gem-sapphire-scroll::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

.gem-sapphire-scroll::-webkit-scrollbar-track {
  background: rgba(19, 18, 25, 0.1);
  border-radius: 6px;
}

.gem-sapphire-scroll::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, var(--gem-sapphire-primary), var(--gem-sapphire-accent));
  border-radius: 6px;
  border: 2px solid rgba(19, 18, 25, 0.1);
  transition: all 0.28s ease;
}

.gem-sapphire-scroll::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, var(--gem-sapphire-accent), var(--gem-sapphire-primary));
  box-shadow: 0 0 15px rgba(var(--gem-sapphire-accent), 0.4);
}

/* ---- Emerald elements ---- */
h1.gem-emerald, h2.gem-emerald, h3.gem-emerald {
  color: var(--gem-emerald-primary);
  background: linear-gradient(135deg, var(--gem-emerald-primary) 0%, var(--gem-emerald-accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  font-weight: 700;
  letter-spacing: 0.05em;
  transition: all 0.28s ease;
}

h1.gem-emerald:hover, h2.gem-emerald:hover, h3.gem-emerald:hover {
  text-shadow: 0 0 20px var(--gem-emerald-glow), 0 2px 8px rgba(0, 0, 0, 0.3);
  filter: drop-shadow(0 0 15px var(--gem-emerald-glow));
}

p.gem-emerald {
  color: var(--gem-emerald-text-dark);
  line-height: 1.6;
  font-size: 1rem;
  letter-spacing: 0.015em;
  transition: color 0.28s ease;
}

p.gem-emerald:hover {
  color: var(--gem-emerald-primary);
}

a.gem-emerald {
  color: var(--gem-emerald-primary);
  text-decoration: none;
  position: relative;
  font-weight: 600;
  border-bottom: 2px solid transparent;
  transition: all 0.28s ease;
}

a.gem-emerald::before {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--gem-emerald-primary), var(--gem-emerald-accent));
  transition: width 0.28s ease;
}

a.gem-emerald:hover {
  color: var(--gem-emerald-accent);
  text-shadow: 0 0 12px var(--gem-emerald-glow);
}

a.gem-emerald:hover::before {
  width: 100%;
}

a.gem-emerald:active {
  color: var(--gem-emerald-primary);
}

button.gem-emerald, .btn.gem-emerald, .cta.gem-emerald {
  background: linear-gradient(135deg, var(--gem-emerald-primary) 0%, var(--gem-emerald-accent) 100%);
  color: #FFFFFF;
  border: 2px solid transparent;
  border-image: linear-gradient(135deg, var(--gem-emerald-primary), var(--gem-emerald-accent)) 1;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.28s ease;
}

button.gem-emerald:hover, .btn.gem-emerald:hover, .cta.gem-emerald:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px var(--gem-emerald-glow);
  filter: brightness(1.1);
}

button.gem-emerald:active, .btn.gem-emerald:active, .cta.gem-emerald:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

button.gem-emerald:disabled, .btn.gem-emerald:disabled, .cta.gem-emerald:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.border.gem-emerald {
  border: 2px solid transparent;
  border-image: linear-gradient(135deg, var(--gem-emerald-primary), var(--gem-emerald-accent)) 1;
  transition: all 0.28s ease;
}

.border.gem-emerald:hover {
  box-shadow: inset 0 0 20px var(--gem-emerald-glow), 0 0 15px var(--gem-emerald-glow);
  border-width: 2px;
}

.gem-emerald-scroll {
  scrollbar-color: linear-gradient(135deg, var(--gem-emerald-primary), var(--gem-emerald-accent)) rgba(19, 18, 25, 0.1);
  scrollbar-width: thin;
}

.gem-emerald-scroll::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

.gem-emerald-scroll::-webkit-scrollbar-track {
  background: rgba(19, 18, 25, 0.1);
  border-radius: 6px;
}

.gem-emerald-scroll::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, var(--gem-emerald-primary), var(--gem-emerald-accent));
  border-radius: 6px;
  border: 2px solid rgba(19, 18, 25, 0.1);
  transition: all 0.28s ease;
}

.gem-emerald-scroll::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, var(--gem-emerald-accent), var(--gem-emerald-primary));
  box-shadow: 0 0 15px rgba(var(--gem-emerald-accent), 0.4);
}

/* ---- Onyx elements ---- */
h1.gem-onyx, h2.gem-onyx, h3.gem-onyx {
  color: var(--gem-onyx-primary);
  background: linear-gradient(135deg, var(--gem-onyx-primary) 0%, var(--gem-onyx-accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  font-weight: 700;
  letter-spacing: 0.05em;
  transition: all 0.28s ease;
}

h1.gem-onyx:hover, h2.gem-onyx:hover, h3.gem-onyx:hover {
  text-shadow: 0 0 20px var(--gem-onyx-glow), 0 2px 8px rgba(0, 0, 0, 0.3);
  filter: drop-shadow(0 0 15px var(--gem-onyx-glow));
}

p.gem-onyx {
  color: #333333;
  line-height: 1.6;
  font-size: 1rem;
  letter-spacing: 0.015em;
  transition: color 0.28s ease;
}

p.gem-onyx:hover {
  color: var(--gem-onyx-primary);
}

a.gem-onyx {
  color: var(--gem-onyx-primary);
  text-decoration: none;
  position: relative;
  font-weight: 600;
  border-bottom: 2px solid transparent;
  transition: all 0.28s ease;
}

a.gem-onyx::before {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--gem-onyx-primary), var(--gem-onyx-accent));
  transition: width 0.28s ease;
}

a.gem-onyx:hover {
  color: var(--gem-onyx-accent);
  text-shadow: 0 0 12px var(--gem-onyx-glow);
}

a.gem-onyx:hover::before {
  width: 100%;
}

a.gem-onyx:active {
  color: var(--gem-onyx-primary);
}

button.gem-onyx, .btn.gem-onyx, .cta.gem-onyx {
  background: linear-gradient(135deg, var(--gem-onyx-primary) 0%, var(--gem-onyx-accent) 100%);
  color: #FFFFFF;
  border: 2px solid transparent;
  border-image: linear-gradient(135deg, var(--gem-onyx-primary), var(--gem-onyx-accent)) 1;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.28s ease;
}

button.gem-onyx:hover, .btn.gem-onyx:hover, .cta.gem-onyx:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px var(--gem-onyx-glow);
  filter: brightness(1.1);
}

button.gem-onyx:active, .btn.gem-onyx:active, .cta.gem-onyx:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

button.gem-onyx:disabled, .btn.gem-onyx:disabled, .cta.gem-onyx:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.border.gem-onyx {
  border: 2px solid transparent;
  border-image: linear-gradient(135deg, var(--gem-onyx-primary), var(--gem-onyx-accent)) 1;
  transition: all 0.28s ease;
}

.border.gem-onyx:hover {
  box-shadow: inset 0 0 20px var(--gem-onyx-glow), 0 0 15px var(--gem-onyx-glow);
  border-width: 2px;
}

.gem-onyx-scroll {
  scrollbar-color: linear-gradient(135deg, var(--gem-onyx-primary), var(--gem-onyx-accent)) rgba(19, 18, 25, 0.1);
  scrollbar-width: thin;
}

.gem-onyx-scroll::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

.gem-onyx-scroll::-webkit-scrollbar-track {
  background: rgba(19, 18, 25, 0.1);
  border-radius: 6px;
}

.gem-onyx-scroll::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, var(--gem-onyx-primary), var(--gem-onyx-accent));
  border-radius: 6px;
  border: 2px solid rgba(19, 18, 25, 0.1);
  transition: all 0.28s ease;
}

.gem-onyx-scroll::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, var(--gem-onyx-accent), var(--gem-onyx-primary));
  box-shadow: 0 0 15px rgba(var(--gem-onyx-accent), 0.4);
}

/* ---- Amethyst elements ---- */
h1.gem-amethyst, h2.gem-amethyst, h3.gem-amethyst {
  color: var(--gem-amethyst-primary);
  background: linear-gradient(135deg, var(--gem-amethyst-primary) 0%, var(--gem-amethyst-accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  font-weight: 700;
  letter-spacing: 0.05em;
  transition: all 0.28s ease;
}

h1.gem-amethyst:hover, h2.gem-amethyst:hover, h3.gem-amethyst:hover {
  text-shadow: 0 0 20px var(--gem-amethyst-glow), 0 2px 8px rgba(0, 0, 0, 0.3);
  filter: drop-shadow(0 0 15px var(--gem-amethyst-glow));
}

p.gem-amethyst {
  color: var(--gem-amethyst-text-dark);
  line-height: 1.6;
  font-size: 1rem;
  letter-spacing: 0.015em;
  transition: color 0.28s ease;
}

p.gem-amethyst:hover {
  color: var(--gem-amethyst-primary);
}

a.gem-amethyst {
  color: var(--gem-amethyst-primary);
  text-decoration: none;
  position: relative;
  font-weight: 600;
  border-bottom: 2px solid transparent;
  transition: all 0.28s ease;
}

a.gem-amethyst::before {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--gem-amethyst-primary), var(--gem-amethyst-accent));
  transition: width 0.28s ease;
}

a.gem-amethyst:hover {
  color: var(--gem-amethyst-accent);
  text-shadow: 0 0 12px var(--gem-amethyst-glow);
}

a.gem-amethyst:hover::before {
  width: 100%;
}

a.gem-amethyst:active {
  color: var(--gem-amethyst-primary);
}

button.gem-amethyst, .btn.gem-amethyst, .cta.gem-amethyst {
  background: linear-gradient(135deg, var(--gem-amethyst-primary) 0%, var(--gem-amethyst-accent) 100%);
  color: #FFFFFF;
  border: 2px solid transparent;
  border-image: linear-gradient(135deg, var(--gem-amethyst-primary), var(--gem-amethyst-accent)) 1;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.28s ease;
}

button.gem-amethyst:hover, .btn.gem-amethyst:hover, .cta.gem-amethyst:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px var(--gem-amethyst-glow);
  filter: brightness(1.1);
}

button.gem-amethyst:active, .btn.gem-amethyst:active, .cta.gem-amethyst:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

button.gem-amethyst:disabled, .btn.gem-amethyst:disabled, .cta.gem-amethyst:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.border.gem-amethyst {
  border: 2px solid transparent;
  border-image: linear-gradient(135deg, var(--gem-amethyst-primary), var(--gem-amethyst-accent)) 1;
  transition: all 0.28s ease;
}

.border.gem-amethyst:hover {
  box-shadow: inset 0 0 20px var(--gem-amethyst-glow), 0 0 15px var(--gem-amethyst-glow);
  border-width: 2px;
}

.gem-amethyst-scroll {
  scrollbar-color: linear-gradient(135deg, var(--gem-amethyst-primary), var(--gem-amethyst-accent)) rgba(19, 18, 25, 0.1);
  scrollbar-width: thin;
}

.gem-amethyst-scroll::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

.gem-amethyst-scroll::-webkit-scrollbar-track {
  background: rgba(19, 18, 25, 0.1);
  border-radius: 6px;
}

.gem-amethyst-scroll::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, var(--gem-amethyst-primary), var(--gem-amethyst-accent));
  border-radius: 6px;
  border: 2px solid rgba(19, 18, 25, 0.1);
  transition: all 0.28s ease;
}

.gem-amethyst-scroll::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, var(--gem-amethyst-accent), var(--gem-amethyst-primary));
  box-shadow: 0 0 15px rgba(var(--gem-amethyst-accent), 0.4);
}

/* ---- Topaz elements (dark text on light gem) ---- */
h1.gem-topaz, h2.gem-topaz, h3.gem-topaz {
  color: var(--gem-topaz-primary);
  background: linear-gradient(135deg, var(--gem-topaz-primary) 0%, var(--gem-topaz-accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  font-weight: 700;
  letter-spacing: 0.05em;
  transition: all 0.28s ease;
}

h1.gem-topaz:hover, h2.gem-topaz:hover, h3.gem-topaz:hover {
  text-shadow: 0 0 20px var(--gem-topaz-glow), 0 2px 8px rgba(0, 0, 0, 0.3);
  filter: drop-shadow(0 0 15px var(--gem-topaz-glow));
}

p.gem-topaz {
  color: var(--gem-topaz-text-dark);
  line-height: 1.6;
  font-size: 1rem;
  letter-spacing: 0.015em;
  transition: color 0.28s ease;
}

p.gem-topaz:hover {
  color: var(--gem-topaz-primary);
}

a.gem-topaz {
  color: var(--gem-topaz-primary);
  text-decoration: none;
  position: relative;
  font-weight: 600;
  border-bottom: 2px solid transparent;
  transition: all 0.28s ease;
}

a.gem-topaz::before {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--gem-topaz-primary), var(--gem-topaz-accent));
  transition: width 0.28s ease;
}

a.gem-topaz:hover {
  color: var(--gem-topaz-accent);
  text-shadow: 0 0 12px var(--gem-topaz-glow);
}

a.gem-topaz:hover::before {
  width: 100%;
}

a.gem-topaz:active {
  color: var(--gem-topaz-primary);
}

button.gem-topaz, .btn.gem-topaz, .cta.gem-topaz {
  background: linear-gradient(135deg, var(--gem-topaz-primary) 0%, var(--gem-topaz-accent) 100%);
  color: #111111;
  border: 2px solid transparent;
  border-image: linear-gradient(135deg, var(--gem-topaz-primary), var(--gem-topaz-accent)) 1;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.28s ease;
}

button.gem-topaz:hover, .btn.gem-topaz:hover, .cta.gem-topaz:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px var(--gem-topaz-glow);
  filter: brightness(1.1);
}

button.gem-topaz:active, .btn.gem-topaz:active, .cta.gem-topaz:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

button.gem-topaz:disabled, .btn.gem-topaz:disabled, .cta.gem-topaz:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.border.gem-topaz {
  border: 2px solid transparent;
  border-image: linear-gradient(135deg, var(--gem-topaz-primary), var(--gem-topaz-accent)) 1;
  transition: all 0.28s ease;
}

.border.gem-topaz:hover {
  box-shadow: inset 0 0 20px var(--gem-topaz-glow), 0 0 15px var(--gem-topaz-glow);
  border-width: 2px;
}

.gem-topaz-scroll {
  scrollbar-color: linear-gradient(135deg, var(--gem-topaz-primary), var(--gem-topaz-accent)) rgba(19, 18, 25, 0.1);
  scrollbar-width: thin;
}

.gem-topaz-scroll::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

.gem-topaz-scroll::-webkit-scrollbar-track {
  background: rgba(19, 18, 25, 0.1);
  border-radius: 6px;
}

.gem-topaz-scroll::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, var(--gem-topaz-primary), var(--gem-topaz-accent));
  border-radius: 6px;
  border: 2px solid rgba(19, 18, 25, 0.1);
  transition: all 0.28s ease;
}

.gem-topaz-scroll::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, var(--gem-topaz-accent), var(--gem-topaz-primary));
  box-shadow: 0 0 15px rgba(var(--gem-topaz-accent), 0.4);
}

/* ---- Aquamarine elements ---- */
h1.gem-aquamarine, h2.gem-aquamarine, h3.gem-aquamarine {
  color: var(--gem-aquamarine-primary);
  background: linear-gradient(135deg, var(--gem-aquamarine-primary) 0%, var(--gem-aquamarine-accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  font-weight: 700;
  letter-spacing: 0.05em;
  transition: all 0.28s ease;
}

h1.gem-aquamarine:hover, h2.gem-aquamarine:hover, h3.gem-aquamarine:hover {
  text-shadow: 0 0 20px var(--gem-aquamarine-glow), 0 2px 8px rgba(0, 0, 0, 0.3);
  filter: drop-shadow(0 0 15px var(--gem-aquamarine-glow));
}

p.gem-aquamarine {
  color: var(--gem-aquamarine-text-dark);
  line-height: 1.6;
  font-size: 1rem;
  letter-spacing: 0.015em;
  transition: color 0.28s ease;
}

p.gem-aquamarine:hover {
  color: var(--gem-aquamarine-primary);
}

a.gem-aquamarine {
  color: var(--gem-aquamarine-primary);
  text-decoration: none;
  position: relative;
  font-weight: 600;
  border-bottom: 2px solid transparent;
  transition: all 0.28s ease;
}

a.gem-aquamarine::before {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--gem-aquamarine-primary), var(--gem-aquamarine-accent));
  transition: width 0.28s ease;
}

a.gem-aquamarine:hover {
  color: var(--gem-aquamarine-accent);
  text-shadow: 0 0 12px var(--gem-aquamarine-glow);
}

a.gem-aquamarine:hover::before {
  width: 100%;
}

a.gem-aquamarine:active {
  color: var(--gem-aquamarine-primary);
}

button.gem-aquamarine, .btn.gem-aquamarine, .cta.gem-aquamarine {
  background: linear-gradient(135deg, var(--gem-aquamarine-primary) 0%, var(--gem-aquamarine-accent) 100%);
  color: #FFFFFF;
  border: 2px solid transparent;
  border-image: linear-gradient(135deg, var(--gem-aquamarine-primary), var(--gem-aquamarine-accent)) 1;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.28s ease;
}

button.gem-aquamarine:hover, .btn.gem-aquamarine:hover, .cta.gem-aquamarine:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px var(--gem-aquamarine-glow);
  filter: brightness(1.1);
}

button.gem-aquamarine:active, .btn.gem-aquamarine:active, .cta.gem-aquamarine:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

button.gem-aquamarine:disabled, .btn.gem-aquamarine:disabled, .cta.gem-aquamarine:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.border.gem-aquamarine {
  border: 2px solid transparent;
  border-image: linear-gradient(135deg, var(--gem-aquamarine-primary), var(--gem-aquamarine-accent)) 1;
  transition: all 0.28s ease;
}

.border.gem-aquamarine:hover {
  box-shadow: inset 0 0 20px var(--gem-aquamarine-glow), 0 0 15px var(--gem-aquamarine-glow);
  border-width: 2px;
}

.gem-aquamarine-scroll {
  scrollbar-color: linear-gradient(135deg, var(--gem-aquamarine-primary), var(--gem-aquamarine-accent)) rgba(19, 18, 25, 0.1);
  scrollbar-width: thin;
}

.gem-aquamarine-scroll::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

.gem-aquamarine-scroll::-webkit-scrollbar-track {
  background: rgba(19, 18, 25, 0.1);
  border-radius: 6px;
}

.gem-aquamarine-scroll::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, var(--gem-aquamarine-primary), var(--gem-aquamarine-accent));
  border-radius: 6px;
  border: 2px solid rgba(19, 18, 25, 0.1);
  transition: all 0.28s ease;
}

.gem-aquamarine-scroll::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, var(--gem-aquamarine-accent), var(--gem-aquamarine-primary));
  box-shadow: 0 0 15px rgba(var(--gem-aquamarine-accent), 0.4);
}

/* ---- Morganite elements ---- */
h1.gem-morganite, h2.gem-morganite, h3.gem-morganite {
  color: var(--gem-morganite-primary);
  background: linear-gradient(135deg, var(--gem-morganite-primary) 0%, var(--gem-morganite-accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  font-weight: 700;
  letter-spacing: 0.05em;
  transition: all 0.28s ease;
}

h1.gem-morganite:hover, h2.gem-morganite:hover, h3.gem-morganite:hover {
  text-shadow: 0 0 20px var(--gem-morganite-glow), 0 2px 8px rgba(0, 0, 0, 0.3);
  filter: drop-shadow(0 0 15px var(--gem-morganite-glow));
}

p.gem-morganite {
  color: var(--gem-morganite-text-dark);
  line-height: 1.6;
  font-size: 1rem;
  letter-spacing: 0.015em;
  transition: color 0.28s ease;
}

p.gem-morganite:hover {
  color: var(--gem-morganite-primary);
}

a.gem-morganite {
  color: var(--gem-morganite-primary);
  text-decoration: none;
  position: relative;
  font-weight: 600;
  border-bottom: 2px solid transparent;
  transition: all 0.28s ease;
}

a.gem-morganite::before {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--gem-morganite-primary), var(--gem-morganite-accent));
  transition: width 0.28s ease;
}

a.gem-morganite:hover {
  color: var(--gem-morganite-accent);
  text-shadow: 0 0 12px var(--gem-morganite-glow);
}

a.gem-morganite:hover::before {
  width: 100%;
}

a.gem-morganite:active {
  color: var(--gem-morganite-primary);
}

button.gem-morganite, .btn.gem-morganite, .cta.gem-morganite {
  background: linear-gradient(135deg, var(--gem-morganite-primary) 0%, var(--gem-morganite-accent) 100%);
  color: #111111;
  border: 2px solid transparent;
  border-image: linear-gradient(135deg, var(--gem-morganite-primary), var(--gem-morganite-accent)) 1;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.28s ease;
}

button.gem-morganite:hover, .btn.gem-morganite:hover, .cta.gem-morganite:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px var(--gem-morganite-glow);
  filter: brightness(1.1);
}

button.gem-morganite:active, .btn.gem-morganite:active, .cta.gem-morganite:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

button.gem-morganite:disabled, .btn.gem-morganite:disabled, .cta.gem-morganite:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.border.gem-morganite {
  border: 2px solid transparent;
  border-image: linear-gradient(135deg, var(--gem-morganite-primary), var(--gem-morganite-accent)) 1;
  transition: all 0.28s ease;
}

.border.gem-morganite:hover {
  box-shadow: inset 0 0 20px var(--gem-morganite-glow), 0 0 15px var(--gem-morganite-glow);
  border-width: 2px;
}

.gem-morganite-scroll {
  scrollbar-color: linear-gradient(135deg, var(--gem-morganite-primary), var(--gem-morganite-accent)) rgba(19, 18, 25, 0.1);
  scrollbar-width: thin;
}

.gem-morganite-scroll::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

.gem-morganite-scroll::-webkit-scrollbar-track {
  background: rgba(19, 18, 25, 0.1);
  border-radius: 6px;
}

.gem-morganite-scroll::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, var(--gem-morganite-primary), var(--gem-morganite-accent));
  border-radius: 6px;
  border: 2px solid rgba(19, 18, 25, 0.1);
  transition: all 0.28s ease;
}

.gem-morganite-scroll::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, var(--gem-morganite-accent), var(--gem-morganite-primary));
  box-shadow: 0 0 15px rgba(var(--gem-morganite-accent), 0.4);
}

/* ---- Heliodor elements ---- */
h1.gem-heliodor, h2.gem-heliodor, h3.gem-heliodor {
  color: var(--gem-heliodor-primary);
  background: linear-gradient(135deg, var(--gem-heliodor-primary) 0%, var(--gem-heliodor-accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  font-weight: 700;
  letter-spacing: 0.05em;
  transition: all 0.28s ease;
}

h1.gem-heliodor:hover, h2.gem-heliodor:hover, h3.gem-heliodor:hover {
  text-shadow: 0 0 20px var(--gem-heliodor-glow), 0 2px 8px rgba(0, 0, 0, 0.3);
  filter: drop-shadow(0 0 15px var(--gem-heliodor-glow));
}

p.gem-heliodor {
  color: var(--gem-heliodor-text-dark);
  line-height: 1.6;
  font-size: 1rem;
  letter-spacing: 0.015em;
  transition: color 0.28s ease;
}

p.gem-heliodor:hover {
  color: var(--gem-heliodor-primary);
}

a.gem-heliodor {
  color: var(--gem-heliodor-primary);
  text-decoration: none;
  position: relative;
  font-weight: 600;
  border-bottom: 2px solid transparent;
  transition: all 0.28s ease;
}

a.gem-heliodor::before {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--gem-heliodor-primary), var(--gem-heliodor-accent));
  transition: width 0.28s ease;
}

a.gem-heliodor:hover {
  color: var(--gem-heliodor-accent);
  text-shadow: 0 0 12px var(--gem-heliodor-glow);
}

a.gem-heliodor:hover::before {
  width: 100%;
}

a.gem-heliodor:active {
  color: var(--gem-heliodor-primary);
}

button.gem-heliodor, .btn.gem-heliodor, .cta.gem-heliodor {
  background: linear-gradient(135deg, var(--gem-heliodor-primary) 0%, var(--gem-heliodor-accent) 100%);
  color: #111111;
  border: 2px solid transparent;
  border-image: linear-gradient(135deg, var(--gem-heliodor-primary), var(--gem-heliodor-accent)) 1;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.28s ease;
}

button.gem-heliodor:hover, .btn.gem-heliodor:hover, .cta.gem-heliodor:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px var(--gem-heliodor-glow);
  filter: brightness(1.1);
}

button.gem-heliodor:active, .btn.gem-heliodor:active, .cta.gem-heliodor:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

button.gem-heliodor:disabled, .btn.gem-heliodor:disabled, .cta.gem-heliodor:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.border.gem-heliodor {
  border: 2px solid transparent;
  border-image: linear-gradient(135deg, var(--gem-heliodor-primary), var(--gem-heliodor-accent)) 1;
  transition: all 0.28s ease;
}

.border.gem-heliodor:hover {
  box-shadow: inset 0 0 20px var(--gem-heliodor-glow), 0 0 15px var(--gem-heliodor-glow);
  border-width: 2px;
}

.gem-heliodor-scroll {
  scrollbar-color: linear-gradient(135deg, var(--gem-heliodor-primary), var(--gem-heliodor-accent)) rgba(19, 18, 25, 0.1);
  scrollbar-width: thin;
}

.gem-heliodor-scroll::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

.gem-heliodor-scroll::-webkit-scrollbar-track {
  background: rgba(19, 18, 25, 0.1);
  border-radius: 6px;
}

.gem-heliodor-scroll::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, var(--gem-heliodor-primary), var(--gem-heliodor-accent));
  border-radius: 6px;
  border: 2px solid rgba(19, 18, 25, 0.1);
  transition: all 0.28s ease;
}

.gem-heliodor-scroll::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, var(--gem-heliodor-accent), var(--gem-heliodor-primary));
  box-shadow: 0 0 15px rgba(var(--gem-heliodor-accent), 0.4);
}

/* ---- Goshenite elements ---- */
h1.gem-goshenite, h2.gem-goshenite, h3.gem-goshenite {
  color: var(--gem-goshenite-primary);
  background: linear-gradient(135deg, var(--gem-goshenite-primary) 0%, var(--gem-goshenite-accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  font-weight: 700;
  letter-spacing: 0.05em;
  transition: all 0.28s ease;
}

h1.gem-goshenite:hover, h2.gem-goshenite:hover, h3.gem-goshenite:hover {
  text-shadow: 0 0 20px var(--gem-goshenite-glow), 0 2px 8px rgba(0, 0, 0, 0.3);
  filter: drop-shadow(0 0 15px var(--gem-goshenite-glow));
}

p.gem-goshenite {
  color: var(--gem-goshenite-text-dark);
  line-height: 1.6;
  font-size: 1rem;
  letter-spacing: 0.015em;
  transition: color 0.28s ease;
}

p.gem-goshenite:hover {
  color: var(--gem-goshenite-primary);
}

a.gem-goshenite {
  color: var(--gem-goshenite-primary);
  text-decoration: none;
  position: relative;
  font-weight: 600;
  border-bottom: 2px solid transparent;
  transition: all 0.28s ease;
}

a.gem-goshenite::before {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--gem-goshenite-primary), var(--gem-goshenite-accent));
  transition: width 0.28s ease;
}

a.gem-goshenite:hover {
  color: var(--gem-goshenite-accent);
  text-shadow: 0 0 12px var(--gem-goshenite-glow);
}

a.gem-goshenite:hover::before {
  width: 100%;
}

a.gem-goshenite:active {
  color: var(--gem-goshenite-primary);
}

button.gem-goshenite, .btn.gem-goshenite, .cta.gem-goshenite {
  background: linear-gradient(135deg, var(--gem-goshenite-primary) 0%, var(--gem-goshenite-accent) 100%);
  color: #111111;
  border: 2px solid transparent;
  border-image: linear-gradient(135deg, var(--gem-goshenite-primary), var(--gem-goshenite-accent)) 1;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.28s ease;
}

button.gem-goshenite:hover, .btn.gem-goshenite:hover, .cta.gem-goshenite:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px var(--gem-goshenite-glow);
  filter: brightness(1.1);
}

button.gem-goshenite:active, .btn.gem-goshenite:active, .cta.gem-goshenite:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

button.gem-goshenite:disabled, .btn.gem-goshenite:disabled, .cta.gem-goshenite:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.border.gem-goshenite {
  border: 2px solid transparent;
  border-image: linear-gradient(135deg, var(--gem-goshenite-primary), var(--gem-goshenite-accent)) 1;
  transition: all 0.28s ease;
}

.border.gem-goshenite:hover {
  box-shadow: inset 0 0 20px var(--gem-goshenite-glow), 0 0 15px var(--gem-goshenite-glow);
  border-width: 2px;
}

.gem-goshenite-scroll {
  scrollbar-color: linear-gradient(135deg, var(--gem-goshenite-primary), var(--gem-goshenite-accent)) rgba(19, 18, 25, 0.1);
  scrollbar-width: thin;
}

.gem-goshenite-scroll::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

.gem-goshenite-scroll::-webkit-scrollbar-track {
  background: rgba(19, 18, 25, 0.1);
  border-radius: 6px;
}

.gem-goshenite-scroll::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, var(--gem-goshenite-primary), var(--gem-goshenite-accent));
  border-radius: 6px;
  border: 2px solid rgba(19, 18, 25, 0.1);
  transition: all 0.28s ease;
}

.gem-goshenite-scroll::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, var(--gem-goshenite-accent), var(--gem-goshenite-primary));
  box-shadow: 0 0 15px rgba(var(--gem-goshenite-accent), 0.4);
}

/* ---- Bixbite elements ---- */
h1.gem-bixbite, h2.gem-bixbite, h3.gem-bixbite {
  color: var(--gem-bixbite-primary);
  background: linear-gradient(135deg, var(--gem-bixbite-primary) 0%, var(--gem-bixbite-accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  font-weight: 700;
  letter-spacing: 0.05em;
  transition: all 0.28s ease;
}

h1.gem-bixbite:hover, h2.gem-bixbite:hover, h3.gem-bixbite:hover {
  text-shadow: 0 0 20px var(--gem-bixbite-glow), 0 2px 8px rgba(0, 0, 0, 0.3);
  filter: drop-shadow(0 0 15px var(--gem-bixbite-glow));
}

p.gem-bixbite {
  color: var(--gem-bixbite-text-dark);
  line-height: 1.6;
  font-size: 1rem;
  letter-spacing: 0.015em;
  transition: color 0.28s ease;
}

p.gem-bixbite:hover {
  color: var(--gem-bixbite-primary);
}

a.gem-bixbite {
  color: var(--gem-bixbite-primary);
  text-decoration: none;
  position: relative;
  font-weight: 600;
  border-bottom: 2px solid transparent;
  transition: all 0.28s ease;
}

a.gem-bixbite::before {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--gem-bixbite-primary), var(--gem-bixbite-accent));
  transition: width 0.28s ease;
}

a.gem-bixbite:hover {
  color: var(--gem-bixbite-accent);
  text-shadow: 0 0 12px var(--gem-bixbite-glow);
}

a.gem-bixbite:hover::before {
  width: 100%;
}

a.gem-bixbite:active {
  color: var(--gem-bixbite-primary);
}

button.gem-bixbite, .btn.gem-bixbite, .cta.gem-bixbite {
  background: linear-gradient(135deg, var(--gem-bixbite-primary) 0%, var(--gem-bixbite-accent) 100%);
  color: #FFFFFF;
  border: 2px solid transparent;
  border-image: linear-gradient(135deg, var(--gem-bixbite-primary), var(--gem-bixbite-accent)) 1;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.28s ease;
}

button.gem-bixbite:hover, .btn.gem-bixbite:hover, .cta.gem-bixbite:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px var(--gem-bixbite-glow);
  filter: brightness(1.1);
}

button.gem-bixbite:active, .btn.gem-bixbite:active, .cta.gem-bixbite:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

button.gem-bixbite:disabled, .btn.gem-bixbite:disabled, .cta.gem-bixbite:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.border.gem-bixbite {
  border: 2px solid transparent;
  border-image: linear-gradient(135deg, var(--gem-bixbite-primary), var(--gem-bixbite-accent)) 1;
  transition: all 0.28s ease;
}

.border.gem-bixbite:hover {
  box-shadow: inset 0 0 20px var(--gem-bixbite-glow), 0 0 15px var(--gem-bixbite-glow);
  border-width: 2px;
}

.gem-bixbite-scroll {
  scrollbar-color: linear-gradient(135deg, var(--gem-bixbite-primary), var(--gem-bixbite-accent)) rgba(19, 18, 25, 0.1);
  scrollbar-width: thin;
}

.gem-bixbite-scroll::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

.gem-bixbite-scroll::-webkit-scrollbar-track {
  background: rgba(19, 18, 25, 0.1);
  border-radius: 6px;
}

.gem-bixbite-scroll::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, var(--gem-bixbite-primary), var(--gem-bixbite-accent));
  border-radius: 6px;
  border: 2px solid rgba(19, 18, 25, 0.1);
  transition: all 0.28s ease;
}

.gem-bixbite-scroll::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, var(--gem-bixbite-accent), var(--gem-bixbite-primary));
  box-shadow: 0 0 15px rgba(var(--gem-bixbite-accent), 0.4);
}

/* ---- Padparadscha elements ---- */
h1.gem-padparadscha, h2.gem-padparadscha, h3.gem-padparadscha {
  color: var(--gem-padparadscha-primary);
  background: linear-gradient(135deg, var(--gem-padparadscha-primary) 0%, var(--gem-padparadscha-accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  font-weight: 700;
  letter-spacing: 0.05em;
  transition: all 0.28s ease;
}

h1.gem-padparadscha:hover, h2.gem-padparadscha:hover, h3.gem-padparadscha:hover {
  text-shadow: 0 0 20px var(--gem-padparadscha-glow), 0 2px 8px rgba(0, 0, 0, 0.3);
  filter: drop-shadow(0 0 15px var(--gem-padparadscha-glow));
}

p.gem-padparadscha {
  color: var(--gem-padparadscha-text-dark);
  line-height: 1.6;
  font-size: 1rem;
  letter-spacing: 0.015em;
  transition: color 0.28s ease;
}

p.gem-padparadscha:hover {
  color: var(--gem-padparadscha-primary);
}

a.gem-padparadscha {
  color: var(--gem-padparadscha-primary);
  text-decoration: none;
  position: relative;
  font-weight: 600;
  border-bottom: 2px solid transparent;
  transition: all 0.28s ease;
}

a.gem-padparadscha::before {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--gem-padparadscha-primary), var(--gem-padparadscha-accent));
  transition: width 0.28s ease;
}

a.gem-padparadscha:hover {
  color: var(--gem-padparadscha-accent);
  text-shadow: 0 0 12px var(--gem-padparadscha-glow);
}

a.gem-padparadscha:hover::before {
  width: 100%;
}

a.gem-padparadscha:active {
  color: var(--gem-padparadscha-primary);
}

button.gem-padparadscha, .btn.gem-padparadscha, .cta.gem-padparadscha {
  background: linear-gradient(135deg, var(--gem-padparadscha-primary) 0%, var(--gem-padparadscha-accent) 100%);
  color: #FFFFFF;
  border: 2px solid transparent;
  border-image: linear-gradient(135deg, var(--gem-padparadscha-primary), var(--gem-padparadscha-accent)) 1;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.28s ease;
}

button.gem-padparadscha:hover, .btn.gem-padparadscha:hover, .cta.gem-padparadscha:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px var(--gem-padparadscha-glow);
  filter: brightness(1.1);
}

button.gem-padparadscha:active, .btn.gem-padparadscha:active, .cta.gem-padparadscha:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

button.gem-padparadscha:disabled, .btn.gem-padparadscha:disabled, .cta.gem-padparadscha:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.border.gem-padparadscha {
  border: 2px solid transparent;
  border-image: linear-gradient(135deg, var(--gem-padparadscha-primary), var(--gem-padparadscha-accent)) 1;
  transition: all 0.28s ease;
}

.border.gem-padparadscha:hover {
  box-shadow: inset 0 0 20px var(--gem-padparadscha-glow), 0 0 15px var(--gem-padparadscha-glow);
  border-width: 2px;
}

.gem-padparadscha-scroll {
  scrollbar-color: linear-gradient(135deg, var(--gem-padparadscha-primary), var(--gem-padparadscha-accent)) rgba(19, 18, 25, 0.1);
  scrollbar-width: thin;
}

.gem-padparadscha-scroll::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

.gem-padparadscha-scroll::-webkit-scrollbar-track {
  background: rgba(19, 18, 25, 0.1);
  border-radius: 6px;
}

.gem-padparadscha-scroll::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, var(--gem-padparadscha-primary), var(--gem-padparadscha-accent));
  border-radius: 6px;
  border: 2px solid rgba(19, 18, 25, 0.1);
  transition: all 0.28s ease;
}

.gem-padparadscha-scroll::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, var(--gem-padparadscha-accent), var(--gem-padparadscha-primary));
  box-shadow: 0 0 15px rgba(var(--gem-padparadscha-accent), 0.4);
}

/* ---- Star Ruby elements ---- */
h1.gem-star-ruby, h2.gem-star-ruby, h3.gem-star-ruby {
  color: var(--gem-star-ruby-primary);
  background: linear-gradient(135deg, var(--gem-star-ruby-primary) 0%, var(--gem-star-ruby-accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  font-weight: 700;
  letter-spacing: 0.05em;
  transition: all 0.28s ease;
}

h1.gem-star-ruby:hover, h2.gem-star-ruby:hover, h3.gem-star-ruby:hover {
  text-shadow: 0 0 20px var(--gem-star-ruby-glow), 0 2px 8px rgba(0, 0, 0, 0.3);
  filter: drop-shadow(0 0 15px var(--gem-star-ruby-glow));
}

p.gem-star-ruby {
  color: var(--gem-star-ruby-text-dark);
  line-height: 1.6;
  font-size: 1rem;
  letter-spacing: 0.015em;
  transition: color 0.28s ease;
}

p.gem-star-ruby:hover {
  color: var(--gem-star-ruby-primary);
}

a.gem-star-ruby {
  color: var(--gem-star-ruby-primary);
  text-decoration: none;
  position: relative;
  font-weight: 600;
  border-bottom: 2px solid transparent;
  transition: all 0.28s ease;
}

a.gem-star-ruby::before {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--gem-star-ruby-primary), var(--gem-star-ruby-accent));
  transition: width 0.28s ease;
}

a.gem-star-ruby:hover {
  color: var(--gem-star-ruby-accent);
  text-shadow: 0 0 12px var(--gem-star-ruby-glow);
}

a.gem-star-ruby:hover::before {
  width: 100%;
}

a.gem-star-ruby:active {
  color: var(--gem-star-ruby-primary);
}

button.gem-star-ruby, .btn.gem-star-ruby, .cta.gem-star-ruby {
  background: linear-gradient(135deg, var(--gem-star-ruby-primary) 0%, var(--gem-star-ruby-accent) 100%);
  color: #FFFFFF;
  border: 2px solid transparent;
  border-image: linear-gradient(135deg, var(--gem-star-ruby-primary), var(--gem-star-ruby-accent)) 1;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.28s ease;
}

button.gem-star-ruby:hover, .btn.gem-star-ruby:hover, .cta.gem-star-ruby:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px var(--gem-star-ruby-glow);
  filter: brightness(1.1);
}

button.gem-star-ruby:active, .btn.gem-star-ruby:active, .cta.gem-star-ruby:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

button.gem-star-ruby:disabled, .btn.gem-star-ruby:disabled, .cta.gem-star-ruby:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.border.gem-star-ruby {
  border: 2px solid transparent;
  border-image: linear-gradient(135deg, var(--gem-star-ruby-primary), var(--gem-star-ruby-accent)) 1;
  transition: all 0.28s ease;
}

.border.gem-star-ruby:hover {
  box-shadow: inset 0 0 20px var(--gem-star-ruby-glow), 0 0 15px var(--gem-star-ruby-glow);
  border-width: 2px;
}

.gem-star-ruby-scroll {
  scrollbar-color: linear-gradient(135deg, var(--gem-star-ruby-primary), var(--gem-star-ruby-accent)) rgba(19, 18, 25, 0.1);
  scrollbar-width: thin;
}

.gem-star-ruby-scroll::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

.gem-star-ruby-scroll::-webkit-scrollbar-track {
  background: rgba(19, 18, 25, 0.1);
  border-radius: 6px;
}

.gem-star-ruby-scroll::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, var(--gem-star-ruby-primary), var(--gem-star-ruby-accent));
  border-radius: 6px;
  border: 2px solid rgba(19, 18, 25, 0.1);
  transition: all 0.28s ease;
}

.gem-star-ruby-scroll::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, var(--gem-star-ruby-accent), var(--gem-star-ruby-primary));
  box-shadow: 0 0 15px rgba(var(--gem-star-ruby-accent), 0.4);
}

/* ---- Color-Change Corundum elements ---- */
h1.gem-color-change, h2.gem-color-change, h3.gem-color-change {
  color: var(--gem-color-change-primary);
  background: linear-gradient(135deg, var(--gem-color-change-primary) 0%, var(--gem-color-change-accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  font-weight: 700;
  letter-spacing: 0.05em;
  transition: all 0.28s ease;
}

h1.gem-color-change:hover, h2.gem-color-change:hover, h3.gem-color-change:hover {
  text-shadow: 0 0 20px var(--gem-color-change-glow), 0 2px 8px rgba(0, 0, 0, 0.3);
  filter: drop-shadow(0 0 15px var(--gem-color-change-glow));
}

p.gem-color-change {
  color: var(--gem-color-change-text-dark);
  line-height: 1.6;
  font-size: 1rem;
  letter-spacing: 0.015em;
  transition: color 0.28s ease;
}

p.gem-color-change:hover {
  color: var(--gem-color-change-primary);
}

a.gem-color-change {
  color: var(--gem-color-change-primary);
  text-decoration: none;
  position: relative;
  font-weight: 600;
  border-bottom: 2px solid transparent;
  transition: all 0.28s ease;
}

a.gem-color-change::before {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--gem-color-change-primary), var(--gem-color-change-accent));
  transition: width 0.28s ease;
}

a.gem-color-change:hover {
  color: var(--gem-color-change-accent);
  text-shadow: 0 0 12px var(--gem-color-change-glow);
}

a.gem-color-change:hover::before {
  width: 100%;
}

a.gem-color-change:active {
  color: var(--gem-color-change-primary);
}

button.gem-color-change, .btn.gem-color-change, .cta.gem-color-change {
  background: linear-gradient(135deg, var(--gem-color-change-primary) 0%, var(--gem-color-change-accent) 100%);
  color: #FFFFFF;
  border: 2px solid transparent;
  border-image: linear-gradient(135deg, var(--gem-color-change-primary), var(--gem-color-change-accent)) 1;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.28s ease;
}

button.gem-color-change:hover, .btn.gem-color-change:hover, .cta.gem-color-change:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px var(--gem-color-change-glow);
  filter: brightness(1.1);
}

button.gem-color-change:active, .btn.gem-color-change:active, .cta.gem-color-change:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

button.gem-color-change:disabled, .btn.gem-color-change:disabled, .cta.gem-color-change:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.border.gem-color-change {
  border: 2px solid transparent;
  border-image: linear-gradient(135deg, var(--gem-color-change-primary), var(--gem-color-change-accent)) 1;
  transition: all 0.28s ease;
}

.border.gem-color-change:hover {
  box-shadow: inset 0 0 20px var(--gem-color-change-glow), 0 0 15px var(--gem-color-change-glow);
  border-width: 2px;
}

.gem-color-change-scroll {
  scrollbar-color: linear-gradient(135deg, var(--gem-color-change-primary), var(--gem-color-change-accent)) rgba(19, 18, 25, 0.1);
  scrollbar-width: thin;
}

.gem-color-change-scroll::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

.gem-color-change-scroll::-webkit-scrollbar-track {
  background: rgba(19, 18, 25, 0.1);
  border-radius: 6px;
}

.gem-color-change-scroll::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, var(--gem-color-change-primary), var(--gem-color-change-accent));
  border-radius: 6px;
  border: 2px solid rgba(19, 18, 25, 0.1);
  transition: all 0.28s ease;
}

.gem-color-change-scroll::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, var(--gem-color-change-accent), var(--gem-color-change-primary));
  box-shadow: 0 0 15px rgba(var(--gem-color-change-accent), 0.4);
}

/* ---- Indigo elements ---- */
h1.gem-indigo, h2.gem-indigo, h3.gem-indigo {
  color: var(--gem-indigo-primary);
  background: linear-gradient(135deg, var(--gem-indigo-primary) 0%, var(--gem-indigo-accent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  font-weight: 700;
  letter-spacing: 0.05em;
  transition: all 0.28s ease;
}

h1.gem-indigo:hover, h2.gem-indigo:hover, h3.gem-indigo:hover {
  text-shadow: 0 0 20px var(--gem-indigo-glow), 0 2px 8px rgba(0, 0, 0, 0.3);
  filter: drop-shadow(0 0 15px var(--gem-indigo-glow));
}

p.gem-indigo {
  color: var(--gem-indigo-text-dark);
  line-height: 1.6;
  font-size: 1rem;
  letter-spacing: 0.015em;
  transition: color 0.28s ease;
}

p.gem-indigo:hover {
  color: var(--gem-indigo-primary);
}

a.gem-indigo {
  color: var(--gem-indigo-primary);
  text-decoration: none;
  position: relative;
  font-weight: 600;
  border-bottom: 2px solid transparent;
  transition: all 0.28s ease;
}

a.gem-indigo::before {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--gem-indigo-primary), var(--gem-indigo-accent));
  transition: width 0.28s ease;
}

a.gem-indigo:hover {
  color: var(--gem-indigo-accent);
  text-shadow: 0 0 12px var(--gem-indigo-glow);
}

a.gem-indigo:hover::before {
  width: 100%;
}

a.gem-indigo:active {
  color: var(--gem-indigo-primary);
}

button.gem-indigo, .btn.gem-indigo, .cta.gem-indigo {
  background: linear-gradient(135deg, var(--gem-indigo-primary) 0%, var(--gem-indigo-accent) 100%);
  color: #FFFFFF;
  border: 2px solid transparent;
  border-image: linear-gradient(135deg, var(--gem-indigo-primary), var(--gem-indigo-accent)) 1;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.28s ease;
}

button.gem-indigo:hover, .btn.gem-indigo:hover, .cta.gem-indigo:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px var(--gem-indigo-glow);
  filter: brightness(1.1);
}

button.gem-indigo:active, .btn.gem-indigo:active, .cta.gem-indigo:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

button.gem-indigo:disabled, .btn.gem-indigo:disabled, .cta.gem-indigo:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.border.gem-indigo {
  border: 2px solid transparent;
  border-image: linear-gradient(135deg, var(--gem-indigo-primary), var(--gem-indigo-accent)) 1;
  transition: all 0.28s ease;
}

.border.gem-indigo:hover {
  box-shadow: inset 0 0 20px var(--gem-indigo-glow), 0 0 15px var(--gem-indigo-glow);
  border-width: 2px;
}

.gem-indigo-scroll {
  scrollbar-color: linear-gradient(135deg, var(--gem-indigo-primary), var(--gem-indigo-accent)) rgba(19, 18, 25, 0.1);
  scrollbar-width: thin;
}

.gem-indigo-scroll::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

.gem-indigo-scroll::-webkit-scrollbar-track {
  background: rgba(19, 18, 25, 0.1);
  border-radius: 6px;
}

.gem-indigo-scroll::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, var(--gem-indigo-primary), var(--gem-indigo-accent));
  border-radius: 6px;
  border: 2px solid rgba(19, 18, 25, 0.1);
  transition: all 0.28s ease;
}

.gem-indigo-scroll::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, var(--gem-indigo-accent), var(--gem-indigo-primary));
  box-shadow: 0 0 15px rgba(var(--gem-indigo-accent), 0.4);
}

/* ====================================
   7. SHIMMER ON HEADERS (Part 7 — animation integration)
   ==================================== */
h1.gem-ruby.shimmer {
  background: linear-gradient(90deg, var(--gem-ruby-primary), var(--gem-ruby-accent), var(--gem-ruby-primary));
  background-size: 200% 100%;
  animation: gem-shimmer 3s ease-in-out infinite;
}

h1.gem-sapphire.shimmer {
  background: linear-gradient(90deg, var(--gem-sapphire-primary), var(--gem-sapphire-accent), var(--gem-sapphire-primary));
  background-size: 200% 100%;
  animation: gem-shimmer 3s ease-in-out infinite;
}

h1.gem-emerald.shimmer {
  background: linear-gradient(90deg, var(--gem-emerald-primary), var(--gem-emerald-accent), var(--gem-emerald-primary));
  background-size: 200% 100%;
  animation: gem-shimmer 3s ease-in-out infinite;
}

h1.gem-amethyst.shimmer {
  background: linear-gradient(90deg, var(--gem-amethyst-primary), var(--gem-amethyst-accent), var(--gem-amethyst-primary));
  background-size: 200% 100%;
  animation: gem-shimmer 3s ease-in-out infinite;
}

h1.gem-topaz.shimmer {
  background: linear-gradient(90deg, var(--gem-topaz-primary), var(--gem-topaz-accent), var(--gem-topaz-primary));
  background-size: 200% 100%;
  animation: gem-shimmer 3s ease-in-out infinite;
}

h1.gem-onyx.shimmer {
  background: linear-gradient(90deg, var(--gem-onyx-primary), var(--gem-onyx-accent), var(--gem-onyx-primary));
  background-size: 200% 100%;
  animation: gem-shimmer 3s ease-in-out infinite;
}

h1.gem-aquamarine.shimmer {
  background: linear-gradient(90deg, var(--gem-aquamarine-primary), var(--gem-aquamarine-accent), var(--gem-aquamarine-primary));
  background-size: 200% 100%;
  animation: gem-shimmer 3s ease-in-out infinite;
}

h1.gem-morganite.shimmer {
  background: linear-gradient(90deg, var(--gem-morganite-primary), var(--gem-morganite-accent), var(--gem-morganite-primary));
  background-size: 200% 100%;
  animation: gem-shimmer 3s ease-in-out infinite;
}

h1.gem-heliodor.shimmer {
  background: linear-gradient(90deg, var(--gem-heliodor-primary), var(--gem-heliodor-accent), var(--gem-heliodor-primary));
  background-size: 200% 100%;
  animation: gem-shimmer 3s ease-in-out infinite;
}

h1.gem-goshenite.shimmer {
  background: linear-gradient(90deg, var(--gem-goshenite-primary), var(--gem-goshenite-accent), var(--gem-goshenite-primary));
  background-size: 200% 100%;
  animation: gem-shimmer 3s ease-in-out infinite;
}

h1.gem-bixbite.shimmer {
  background: linear-gradient(90deg, var(--gem-bixbite-primary), var(--gem-bixbite-accent), var(--gem-bixbite-primary));
  background-size: 200% 100%;
  animation: gem-shimmer 3s ease-in-out infinite;
}

h1.gem-padparadscha.shimmer {
  background: linear-gradient(90deg, var(--gem-padparadscha-primary), var(--gem-padparadscha-accent), var(--gem-padparadscha-primary));
  background-size: 200% 100%;
  animation: gem-shimmer 3s ease-in-out infinite;
}

h1.gem-star-ruby.shimmer {
  background: linear-gradient(90deg, var(--gem-star-ruby-primary), var(--gem-star-ruby-accent), var(--gem-star-ruby-primary));
  background-size: 200% 100%;
  animation: gem-shimmer 3s ease-in-out infinite;
}

h1.gem-color-change.shimmer {
  background: linear-gradient(90deg, var(--gem-color-change-primary), var(--gem-color-change-accent), var(--gem-color-change-primary));
  background-size: 200% 100%;
  animation: gem-shimmer 3s ease-in-out infinite;
}

h1.gem-indigo.shimmer {
  background: linear-gradient(90deg, var(--gem-indigo-primary), var(--gem-indigo-accent), var(--gem-indigo-primary));
  background-size: 200% 100%;
  animation: gem-shimmer 3s ease-in-out infinite;
}

/* ====================================
   8. DASHBOARD VARIANTS (14 gems)
   ==================================== */
.dashboard-ruby .dashboard-menu {
  background: var(--gem-ruby-gradient);
  animation: gem-pulse 3s ease-in-out infinite;
}

.dashboard-ruby .dashboard-menu .menu-item {
  padding: 20px;
  transition: all 0.3s ease;
}

.dashboard-ruby .dashboard-menu .menu-item:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(4px);
}

.dashboard-ruby .dashboard-menu .bubble-effect::before {
  content: '';
  position: absolute;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  animation: bubble-pop 0.6s ease-out forwards;
}

.dashboard-sapphire .dashboard-menu {
  background: var(--gem-sapphire-gradient);
  animation: gem-pulse 3s ease-in-out infinite;
}

.dashboard-sapphire .dashboard-menu .menu-item {
  padding: 20px;
  transition: all 0.3s ease;
}

.dashboard-sapphire .dashboard-menu .menu-item:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(4px);
}

.dashboard-sapphire .dashboard-menu .bubble-effect::before {
  content: '';
  position: absolute;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  animation: bubble-pop 0.6s ease-out forwards;
}

.dashboard-emerald .dashboard-menu {
  background: var(--gem-emerald-gradient);
  animation: gem-pulse 3s ease-in-out infinite;
}

.dashboard-emerald .dashboard-menu .menu-item {
  padding: 20px;
  transition: all 0.3s ease;
}

.dashboard-emerald .dashboard-menu .menu-item:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(4px);
}

.dashboard-emerald .dashboard-menu .bubble-effect::before {
  content: '';
  position: absolute;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  animation: bubble-pop 0.6s ease-out forwards;
}

.dashboard-amethyst .dashboard-menu {
  background: var(--gem-amethyst-gradient);
  animation: gem-pulse 3s ease-in-out infinite;
}

.dashboard-amethyst .dashboard-menu .menu-item {
  padding: 20px;
  transition: all 0.3s ease;
}

.dashboard-amethyst .dashboard-menu .menu-item:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(4px);
}

.dashboard-amethyst .dashboard-menu .bubble-effect::before {
  content: '';
  position: absolute;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  animation: bubble-pop 0.6s ease-out forwards;
}

.dashboard-topaz .dashboard-menu {
  background: var(--gem-topaz-gradient);
  animation: gem-pulse 3s ease-in-out infinite;
}

.dashboard-topaz .dashboard-menu .menu-item {
  padding: 20px;
  transition: all 0.3s ease;
}

.dashboard-topaz .dashboard-menu .menu-item:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(4px);
}

.dashboard-topaz .dashboard-menu .bubble-effect::before {
  content: '';
  position: absolute;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  animation: bubble-pop 0.6s ease-out forwards;
}

.dashboard-onyx .dashboard-menu {
  background: var(--gem-onyx-gradient);
  animation: gem-pulse 3s ease-in-out infinite;
}

.dashboard-onyx .dashboard-menu .menu-item {
  padding: 20px;
  transition: all 0.3s ease;
}

.dashboard-onyx .dashboard-menu .menu-item:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(4px);
}

.dashboard-onyx .dashboard-menu .bubble-effect::before {
  content: '';
  position: absolute;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  animation: bubble-pop 0.6s ease-out forwards;
}

.dashboard-aquamarine .dashboard-menu {
  background: var(--gem-aquamarine-gradient);
  animation: gem-pulse 3s ease-in-out infinite;
}

.dashboard-aquamarine .dashboard-menu .menu-item {
  padding: 20px;
  transition: all 0.3s ease;
}

.dashboard-aquamarine .dashboard-menu .menu-item:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(4px);
}

.dashboard-aquamarine .dashboard-menu .bubble-effect::before {
  content: '';
  position: absolute;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  animation: bubble-pop 0.6s ease-out forwards;
}

.dashboard-morganite .dashboard-menu {
  background: var(--gem-morganite-gradient);
  animation: gem-pulse 3s ease-in-out infinite;
}

.dashboard-morganite .dashboard-menu .menu-item {
  padding: 20px;
  transition: all 0.3s ease;
}

.dashboard-morganite .dashboard-menu .menu-item:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(4px);
}

.dashboard-morganite .dashboard-menu .bubble-effect::before {
  content: '';
  position: absolute;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  animation: bubble-pop 0.6s ease-out forwards;
}

.dashboard-heliodor .dashboard-menu {
  background: var(--gem-heliodor-gradient);
  animation: gem-pulse 3s ease-in-out infinite;
}

.dashboard-heliodor .dashboard-menu .menu-item {
  padding: 20px;
  transition: all 0.3s ease;
}

.dashboard-heliodor .dashboard-menu .menu-item:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(4px);
}

.dashboard-heliodor .dashboard-menu .bubble-effect::before {
  content: '';
  position: absolute;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  animation: bubble-pop 0.6s ease-out forwards;
}

.dashboard-goshenite .dashboard-menu {
  background: var(--gem-goshenite-gradient);
  animation: gem-pulse 3s ease-in-out infinite;
}

.dashboard-goshenite .dashboard-menu .menu-item {
  padding: 20px;
  transition: all 0.3s ease;
}

.dashboard-goshenite .dashboard-menu .menu-item:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(4px);
}

.dashboard-goshenite .dashboard-menu .bubble-effect::before {
  content: '';
  position: absolute;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  animation: bubble-pop 0.6s ease-out forwards;
}

.dashboard-bixbite .dashboard-menu {
  background: var(--gem-bixbite-gradient);
  animation: gem-pulse 3s ease-in-out infinite;
}

.dashboard-bixbite .dashboard-menu .menu-item {
  padding: 20px;
  transition: all 0.3s ease;
}

.dashboard-bixbite .dashboard-menu .menu-item:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(4px);
}

.dashboard-bixbite .dashboard-menu .bubble-effect::before {
  content: '';
  position: absolute;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  animation: bubble-pop 0.6s ease-out forwards;
}

.dashboard-padparadscha .dashboard-menu {
  background: var(--gem-padparadscha-gradient);
  animation: gem-pulse 3s ease-in-out infinite;
}

.dashboard-padparadscha .dashboard-menu .menu-item {
  padding: 20px;
  transition: all 0.3s ease;
}

.dashboard-padparadscha .dashboard-menu .menu-item:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(4px);
}

.dashboard-padparadscha .dashboard-menu .bubble-effect::before {
  content: '';
  position: absolute;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  animation: bubble-pop 0.6s ease-out forwards;
}

.dashboard-star-ruby .dashboard-menu {
  background: var(--gem-star-ruby-gradient);
  animation: gem-pulse 3s ease-in-out infinite;
}

.dashboard-star-ruby .dashboard-menu .menu-item {
  padding: 20px;
  transition: all 0.3s ease;
}

.dashboard-star-ruby .dashboard-menu .menu-item:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(4px);
}

.dashboard-star-ruby .dashboard-menu .bubble-effect::before {
  content: '';
  position: absolute;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  animation: bubble-pop 0.6s ease-out forwards;
}

.dashboard-color-change .dashboard-menu {
  background: var(--gem-color-change-gradient);
  animation: gem-pulse 3s ease-in-out infinite;
}

.dashboard-color-change .dashboard-menu .menu-item {
  padding: 20px;
  transition: all 0.3s ease;
}

.dashboard-color-change .dashboard-menu .menu-item:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(4px);
}

.dashboard-color-change .dashboard-menu .bubble-effect::before {
  content: '';
  position: absolute;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  animation: bubble-pop 0.6s ease-out forwards;
}

.dashboard-indigo .dashboard-menu {
  background: var(--gem-indigo-gradient);
  animation: gem-pulse 3s ease-in-out infinite;
}

.dashboard-indigo .dashboard-menu .menu-item {
  padding: 20px;
  transition: all 0.3s ease;
}

.dashboard-indigo .dashboard-menu .menu-item:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(4px);
}

.dashboard-indigo .dashboard-menu .bubble-effect::before {
  content: '';
  position: absolute;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  animation: bubble-pop 0.6s ease-out forwards;
}

@keyframes bubble-pop {
  0% {
    width: 0;
    height: 0;
    opacity: 0.8;
    transform: translate(-50%, -50%);
  }
  100% {
    width: 200px;
    height: 200px;
    opacity: 0;
    transform: translate(-50%, -50%);
  }
}

/* ====================================
   9. GEMS AS WEB DOJO THEMES
   Each .gem-{name}-theme class overrides
   --fc-* variables when applied to <body>
   or any container.
   ==================================== */
/* Example usage:
   <body class="gem-ruby-theme gem-ruby-scroll">
   or
   <div class="gem-sapphire-theme">
*/
/* ====================================
   END OF AVALON GEMS
   ==================================== */
`;
