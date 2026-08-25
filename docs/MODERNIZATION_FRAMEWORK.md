# Retro Template Modernization Framework

A reusable, byte-for-byte modernization methodology for the retro-nostalgia
starter templates. The goal: keep the period-correct look *exactly* while
replacing legacy markup with modern HTML5/CSS3.

Keep a side-by-side "before" screenshot and "after" DOM — the visual result
must be indistinguishable at 1:1, only the underlying code changes.

## 1. Conversion table

| Retro construct | Modern replacement | Why |
|-----------------|--------------------|-----|
| `<table>`-bashed layout | CSS Grid / Flexbox | Real flow & reflow, accessibility |
| Spacer GIFs (`<td><img width="1"…>`) | `margin` / `padding` / `gap` | No extra HTTP requests |
| `<font size color face>` | CSS `font-size` / `color` / `font-family` | Single source of truth |
| Inline `style=` everywhere | CSS classes / custom properties | Re-theming wins |
| `<marquee>` / `<blink>` | `@keyframes` + `prefers-reduced-motion` | Honors user settings |
| `<frame>` / `iframe` chrome | Semantic layout | Screen-reader friendly |
| Hit counters / GIF buttons | SVG / CSS-drawn badges, counters via JS | Crisp at any size |
| `<center>` | `text-align:center; margin-inline:auto` | Layout control |
| `<a name="">` | `id` + `:target` / scroll-margin | Better anchor behavior |

## 2. Byte-for-byte comparison workflow

1. **Render a screenshot** of the retro template in a fixed viewport
   (e.g. 1280×900, Playwright).
2. **Implement** using modern markup but identical colors, fonts, spacing,
   padding and borders.
3. **Diff** the new render against the screenshot:
   - geometric diff via `playwright` + pixelmatch, or
   - manual review in the designer.
4. **Description box:** check spacing (padding/margins), typography metrics
   (line-height, letter-spacing), radii and hover states.
5. Only merge when the diff is below the noise floor (≤ ~1–2% pixel delta) —
   that is the "byte-for-byte" bar.

## 3. Semantic + accessibility floor

- **Semantic landmarks:** use `<header>`, `<nav>`, `<main>` (with a unique
  `h1`), `<article>` for blog posts, `<footer>` for site footers.
- **Associations:** `<label for>`/`id>` on every form field; real `<button>`
  (never `<div onClick>`).
- **Images:** descriptive `alt`; decorative images use `alt=""`.
- **Interaction:** keyboard-focusable links/buttons; `:focus-visible`
  outlines; respect `prefers-reduced-motion`.
- **Language:** set `lang` on `<html>`.

## 4. Migration checklist per template

- [ ] Table→Grid/Flex pass (no layout tables remain in exported HTML)
- [ ] No spacer GIFs / `1px` `<img>` shivs
- [ ] No `<font>` / `<marquee>` / `<blink>` / `<center>`
- [ ] Inline styles consolidated into a `<style data-forge-theme>` block driven
      by `--fc-*` variables where the palette should be re-themable
- [ ] Modern CSS fallback-free by the `@supports` baseline; graceful on old
      browsers via the CSS variables' fallback values (`var(--fc-text, #000)`)
- [ ] Visitor interactivity (guestbook, hit-counter) via the existing
      `_comments_section()` and Web Dojo form/JSON seeded data rather than
      ad-hoc `<script src>` globals
- [ ] Multi-page nav uses `_simple_nav()` / period-flavored nav with
      `href="*.html"` that the QA pipeline (Task 4.1) verifies resolves

## 5. Extending to multi-page (retro + aesthetic)

Every template should expose a small multi-page site. The standard flow in
`backend/starter_templates.py`:

```python
nav = _simple_nav("VT323", "MySpace Rise", [...], cta=None)
return _tpl(
    "starter-myspace-throwback", "MySpace Throwback", "…", "myspace",
    "#000000", ["VT323", "Comic Sans MS"],
    html_blocks=[],
    pages=[
        _page(prefix, "Home", bg, fonts, [nav, hero, footer], slug="index"),
        _page(prefix, "Blog", bg, fonts, [nav, posts, footer], slug="blog"),
        _page(prefix, "Guestbook", bg, fonts, [nav, _comments_section(...), footer], slug="guestbook"),
    ],
)
```

Run the QA suite after any change:

```bash
cd backend && python3 -m pytest tests/test_template_validate.py -q
```

It re-checks syntax, page count/slugs, internal links, tag balance, and that
every page is reachable from index.