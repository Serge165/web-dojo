"""Curated starter templates seeded on backend boot.

Each template is a self-contained single-page site rendered as portable
HTML blocks (inline styles, so Web Dojo's export/publish path works
without external CSS). Fifteen internet-aesthetic starters cover a wide
stylistic range so users always have a distinctive jumping-off point.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import List, Dict, Any


def _uid(prefix: str, i: int) -> str:
    return f"{prefix}-el-{i}"


def _page(prefix: str, name: str, canvas_bg: str, fonts: List[str], html_blocks: List[str], seo: Dict[str, Any] = None) -> Dict[str, Any]:
    return {
        "id": f"{prefix}-home",
        "name": name,
        "slug": "index",
        "status": "draft",
        "seo": seo or {},
        "elements": [{"id": _uid(prefix, i), "html": h} for i, h in enumerate(html_blocks)],
        "head_html": "",
        "canvas_bg": canvas_bg,
        "fonts": fonts,
    }


def _tpl(id_: str, name: str, description: str, aesthetic: str, canvas_bg: str, fonts: List[str], html_blocks: List[str]) -> Dict[str, Any]:
    # Template auto-fill (scoped): starters already carry a hand-written
    # name + description for the picker UI — reuse that copy as the
    # starting SEO title/description instead of leaving it blank, so a
    # user who starts from a template gets a real (if generic) starting
    # point rather than an empty stub. They're expected to edit it, same
    # as the placeholder "Home" page name. No keywords: Google has
    # ignored the meta-keywords tag since ~2009, so seeding it with the
    # aesthetic slug would just be noise.
    seo = {"title": name, "description": description}
    return {
        "id": id_,
        "name": name,
        "description": description,
        "thumbnail": None,
        "is_starter": True,
        "aesthetic": aesthetic,
        "data": {
            "name": name,
            "canvas_bg": canvas_bg,
            "fonts": fonts,
            "head_html": "",
            "files": [],
            "template": {"header_html": "", "footer_html": "", "use_template": False},
            "pages": [_page(id_, "Home", canvas_bg, fonts, html_blocks, seo=seo)],
            "active_page_id": f"{id_}-home",
        },
        "created_at": datetime.now(timezone.utc).isoformat(),
    }


# Shared comment-thread widget for the Blog/Xanga/LiveJournal starters
# below. Seed data lives as an inline <script type="application/json">
# tag rather than a fetched sibling .json file (fetch() breaks under
# file:// via CORS — how people often first open an exported .html before
# deploying it). _COMMENTS_JS carries the data-forge-js="comments.js"
# marker so the export pipeline (_extract_forge_js) pulls it into a real
# js/comments.js file instead of repeating it on every page that uses it.
# Byte-identical to frontend/src/lib/blocksExtra.js's COMMENTS_JS —
# Python can't import that module, so keep them in sync by hand.
_COMMENTS_JS = """(function(){
function esc(s){var d=document.createElement("div");d.textContent=s==null?"":String(s);return d.innerHTML;}
function renderComment(c){
  return '<div style="display:flex;gap:12px;padding:14px 0;border-bottom:1px solid var(--fc-border, #e2e8f0);">'
    + (c.avatar ? '<img src="'+esc(c.avatar)+'" alt="" style="width:38px;height:38px;border-radius:999px;object-fit:cover;flex:none;">'
                : '<div style="width:38px;height:38px;border-radius:999px;background:var(--fc-primary, #6366f1);color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex:none;">'+esc((c.author||"?").slice(0,1).toUpperCase())+'</div>')
    + '<div style="flex:1;min-width:0;">'
    + '<div style="font-size:13px;"><strong style="color:var(--fc-text, #0f172a);">'+esc(c.author)+'</strong>'
    + (c.mood ? ' <span style="color:var(--fc-muted, #94a3b8);">('+esc(c.mood)+')</span>' : '')
    + ' <span style="color:var(--fc-muted, #94a3b8);">'+esc(c.date)+'</span></div>'
    + '<div style="font-size:14px;line-height:1.6;color:var(--fc-text, #334155);margin-top:4px;">'+esc(c.text)+'</div>'
    + '</div></div>';
}
function initWidget(root){
  root.setAttribute("data-forge-comments-init","1");
  var seedEl=root.querySelector("[data-forge-comments-seed]");
  var comments=[];
  try{comments=JSON.parse(seedEl?seedEl.textContent:"[]");}catch(e){comments=[];}
  var list=root.querySelector("[data-forge-comment-list]");
  var countEl=root.querySelector("[data-forge-comment-count]");
  function renderAll(){
    if(list) list.innerHTML=comments.map(renderComment).join("");
    if(countEl) countEl.textContent=String(comments.length);
  }
  renderAll();
  var form=root.querySelector("[data-forge-comment-form]");
  if(form){
    form.addEventListener("submit",function(e){
      e.preventDefault();
      var nameInput=form.querySelector('[name="name"]');
      var textInput=form.querySelector('[name="text"]');
      var name=(nameInput&&nameInput.value||"").trim();
      var text=(textInput&&textInput.value||"").trim();
      if(!name||!text) return;
      comments.push({id:Date.now(),author:name,date:"Just now",text:text});
      renderAll();
      form.reset();
    });
  }
}
function init(){
  var roots=document.querySelectorAll("[data-forge-comments]:not([data-forge-comments-init])");
  for(var i=0;i<roots.length;i++) initWidget(roots[i]);
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init); else init();
})();"""


def _comments_section(seed_comments: list, wrap_style: str, heading_style: str = None) -> str:
    """Builds a full comment-thread section (heading+count, list, working
    client-only post form, JSON seed, behavior script). Mirrors frontend/
    src/lib/blocksExtra.js's buildCommentsSectionHtml."""
    heading = heading_style or "font-size:20px;margin:0 0 16px;"
    return (
        '<section data-forge-comments style="' + wrap_style + '">'
        '<div style="max-width:640px;margin:0 auto;">'
        '<h3 style="' + heading + '">Comments (<span data-forge-comment-count>0</span>)</h3>'
        '<div data-forge-comment-list></div>'
        '<form data-forge-comment-form style="display:flex;flex-direction:column;gap:8px;margin-top:20px;">'
        '<input name="name" placeholder="Your name" required style="padding:10px 12px;border-radius:8px;border:1px solid var(--fc-border, #cbd5e1);font-size:14px;outline:none;">'
        '<textarea name="text" placeholder="Say something..." required rows="3" style="padding:10px 12px;border-radius:8px;border:1px solid var(--fc-border, #cbd5e1);font-size:14px;outline:none;resize:vertical;"></textarea>'
        '<button type="submit" style="align-self:flex-start;padding:10px 20px;background:var(--fc-primary, #0f172a);color:#fff;border:0;border-radius:8px;font-weight:600;cursor:pointer;font-size:14px;">Post Comment</button>'
        '</form>'
        '<script type="application/json" data-forge-comments-seed>' + json.dumps(seed_comments) + '</script>'
        '<script data-forge-js="comments.js">' + _COMMENTS_JS + '</script>'
        '</div></section>'
    )


STARTER_TEMPLATES: List[Dict[str, Any]] = [
    # 1. Frutiger Aero — glossy, aqua/teal, 2000s-optimism
    _tpl(
        "starter-frutiger-aero",
        "Frutiger Aero",
        "Glossy, aqua, back-of-a-Windows-Vista-box optimism.",
        "frutiger-aero",
        "#7fd8ff",
        ["Rubik"],
        [
            '<section style="min-height:70vh;padding:80px 48px;background:radial-gradient(circle at 20% 20%,#c8f0ff 0%,#7fd8ff 45%,#3a9bd6 100%);font-family:Rubik,sans-serif;color:#0b3d5f;position:relative;overflow:hidden;"><div style="max-width:640px;position:relative;z-index:2;"><div style="display:inline-block;padding:6px 14px;background:rgba(255,255,255,0.55);border-radius:999px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;backdrop-filter:blur(8px);">Cloud native · 2007 forever</div><h1 style="font-size:64px;line-height:1.05;margin:20px 0 16px;font-weight:600;letter-spacing:-0.02em;">Breathe deep, ship fast.</h1><p style="font-size:18px;line-height:1.6;max-width:520px;">A tranquil workspace that feels like the sky just cleared. Bubbles, gradients, and just enough gloss to make Monday tolerable.</p><div style="display:flex;gap:12px;margin-top:28px;"><a href="#" style="padding:14px 22px;background:linear-gradient(180deg,#ffffff 0%,#d6efff 100%);border-radius:14px;box-shadow:0 6px 20px rgba(11,61,95,0.25),inset 0 1px 0 rgba(255,255,255,0.9);color:#0b3d5f;text-decoration:none;font-weight:600;">Get started</a><a href="#" style="padding:14px 22px;border-radius:14px;color:#0b3d5f;text-decoration:none;font-weight:500;background:rgba(255,255,255,0.35);backdrop-filter:blur(10px);">Watch demo</a></div></div><div style="position:absolute;right:-40px;bottom:-40px;width:340px;height:340px;border-radius:50%;background:radial-gradient(circle at 30% 30%,rgba(255,255,255,0.9),rgba(160,220,255,0.25) 60%,transparent 70%);"></div></section>',
            '<section style="padding:72px 48px;background:linear-gradient(180deg,#e6f7ff 0%,#ffffff 100%);font-family:Rubik,sans-serif;color:#0b3d5f;"><h2 style="font-size:36px;margin:0 0 32px;">Everything is a little bit shinier.</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;">' + "".join([f'<div style="padding:24px;border-radius:18px;background:linear-gradient(180deg,#ffffff 0%,#e0f2ff 100%);box-shadow:0 10px 30px rgba(58,155,214,0.18),inset 0 1px 0 rgba(255,255,255,0.9);"><div style="width:44px;height:44px;border-radius:50%;background:radial-gradient(circle at 30% 30%,#ffffff,#7fd8ff);margin-bottom:14px;"></div><h3 style="margin:0 0 8px;font-size:18px;">{t}</h3><p style="margin:0;font-size:14px;color:#3a6a8c;line-height:1.5;">{d}</p></div>' for t, d in [("Feels alive", "Motion, gradients, water droplets."), ("Feels calm", "Sky-blue palette that never yells."), ("Feels 2007", "In the best possible way.")]]) + '</div></section>',
            '<footer style="padding:32px 48px;background:#0b3d5f;color:#c8f0ff;font-family:Rubik,sans-serif;font-size:13px;display:flex;justify-content:space-between;">© Aero Studio · <span>Breathe deep.</span></footer>',
        ],
    ),
    # 2. Dark Academia
    _tpl(
        "starter-dark-academia",
        "Dark Academia",
        "Candlelit libraries, oxblood leather, and Latin quotations.",
        "dark-academia",
        "#1a1410",
        ["Cormorant Garamond", "EB Garamond"],
        [
            '<section style="min-height:70vh;padding:80px 56px;background:radial-gradient(circle at 20% 30%,#2a1f18 0%,#120b07 70%);font-family:\'Cormorant Garamond\',serif;color:#e8d9b8;"><div style="max-width:680px;"><div style="font-size:12px;letter-spacing:0.4em;text-transform:uppercase;color:#8a6a3f;margin-bottom:18px;">Anno MMXXVI · Vol. I</div><h1 style="font-size:78px;line-height:1.02;margin:0 0 20px;font-weight:500;font-style:italic;">A quiet devotion to the written word.</h1><p style="font-size:20px;line-height:1.6;color:#c9b48b;max-width:520px;">Manuscripts, cathedrals of thought, and the smell of very old books. Enter, if you must, but leave your hurry at the gate.</p><div style="margin-top:36px;display:flex;gap:20px;align-items:center;"><a href="#" style="padding:14px 26px;border:1px solid #8a6a3f;color:#e8d9b8;text-decoration:none;letter-spacing:0.18em;font-size:12px;text-transform:uppercase;">Enter the archive</a><span style="color:#6b5a3d;font-style:italic;">— Ad astra per aspera</span></div></div></section>',
            '<section style="padding:80px 56px;background:#120b07;font-family:\'Cormorant Garamond\',serif;color:#e8d9b8;"><div style="display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center;"><div><h2 style="font-size:44px;margin:0 0 20px;font-style:italic;">On the pleasure of forgotten pages.</h2><p style="font-size:17px;line-height:1.7;color:#b09872;">There is a certain joy — inexplicable, almost ecclesiastical — in returning to a book you last read a decade ago and finding your own marginalia in a hand you no longer recognise.</p></div><div style="border-left:1px solid #4a3d2a;padding-left:36px;"><ol style="list-style:none;padding:0;margin:0;font-size:16px;line-height:2.1;color:#c9b48b;"><li>I. <em>De Rerum Natura</em> — Lucretius</li><li>II. <em>Confessions</em> — Augustine</li><li>III. <em>The Secret History</em> — Tartt</li><li>IV. <em>Meditations</em> — Aurelius</li></ol></div></div></section>',
            '<footer style="padding:32px 56px;background:#0a0603;color:#6b5a3d;font-family:\'Cormorant Garamond\',serif;font-size:13px;font-style:italic;text-align:center;letter-spacing:0.15em;">Sic parvis magna</footer>',
        ],
    ),
    # 3. Solar Punk
    _tpl(
        "starter-solar-punk",
        "Solar Punk",
        "Hopeful ecotopia — mossy greens, sunlit gold, living tech.",
        "solar-punk",
        "#f4efd6",
        ["Fraunces", "Space Grotesk"],
        [
            '<section style="min-height:72vh;padding:88px 56px;background:linear-gradient(160deg,#f4efd6 0%,#c7e0a8 60%,#8fbf6a 100%);font-family:Fraunces,serif;color:#1f3a1a;position:relative;overflow:hidden;"><div style="max-width:660px;position:relative;z-index:2;"><div style="display:inline-block;padding:6px 14px;background:#1f3a1a;color:#f4efd6;border-radius:999px;font-family:\'Space Grotesk\',sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;">A future worth wanting</div><h1 style="font-size:72px;line-height:1.02;margin:22px 0 18px;font-weight:600;letter-spacing:-0.02em;">Grow the internet <em style="color:#e8a939;">back.</em></h1><p style="font-size:19px;line-height:1.65;font-family:\'Space Grotesk\',sans-serif;max-width:540px;color:#2f4d28;">Software that behaves like a garden. Buildings clothed in vines. A community-owned power grid that hums quietly through the summer.</p><div style="margin-top:34px;display:flex;gap:12px;"><a href="#" style="padding:14px 24px;background:#1f3a1a;color:#f4efd6;text-decoration:none;border-radius:999px;font-family:\'Space Grotesk\',sans-serif;font-weight:600;font-size:14px;">Plant something</a><a href="#" style="padding:14px 24px;color:#1f3a1a;text-decoration:none;border-radius:999px;border:1.5px solid #1f3a1a;font-family:\'Space Grotesk\',sans-serif;font-size:14px;">Read the manifesto</a></div></div><div style="position:absolute;right:-80px;top:-80px;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle at 50% 50%,#f0c14a 0%,#e8a939 40%,transparent 70%);opacity:0.7;"></div></section>',
            '<section style="padding:80px 56px;background:#1f3a1a;color:#f4efd6;font-family:Fraunces,serif;"><h2 style="font-size:44px;margin:0 0 40px;font-weight:500;">Principles we quietly follow.</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:28px;font-family:\'Space Grotesk\',sans-serif;">' + "".join([f'<div style="padding:28px;border:1px solid #4a6b3f;border-radius:20px;background:#2a4a24;"><div style="font-size:38px;color:#f0c14a;line-height:1;margin-bottom:16px;">{n}</div><h3 style="margin:0 0 8px;font-size:18px;font-family:Fraunces,serif;font-weight:500;">{t}</h3><p style="margin:0;font-size:14px;line-height:1.6;color:#c7e0a8;">{d}</p></div>' for n, t, d in [("01", "Repair over rebuild", "The oldest chair in the house is still the best."), ("02", "Sun as the only lender", "We charge nothing that photons can\'t."), ("03", "Small, local, weird", "Every neighbourhood makes its own bread.")]]) + '</div></section>',
            '<footer style="padding:32px 56px;background:#f4efd6;color:#1f3a1a;font-family:\'Space Grotesk\',sans-serif;font-size:13px;display:flex;justify-content:space-between;align-items:center;"><span>Solar Punk Studio · 2026</span><span style="font-style:italic;font-family:Fraunces,serif;">See you at the harvest.</span></footer>',
        ],
    ),
    # 4. Cottagecore
    _tpl(
        "starter-cottagecore",
        "Cottagecore",
        "Sourdough, embroidery, kettle on the stove, sun through gingham.",
        "cottagecore",
        "#f7f0e2",
        ["Playfair Display", "Cormorant Garamond"],
        [
            '<section style="min-height:70vh;padding:88px 56px;background:linear-gradient(180deg,#f7f0e2 0%,#efd9c0 100%);font-family:\'Playfair Display\',serif;color:#4a2f22;text-align:center;"><div style="max-width:680px;margin:0 auto;"><div style="font-size:12px;letter-spacing:0.3em;text-transform:uppercase;color:#a17454;margin-bottom:20px;">Warmly kept · Since forever</div><h1 style="font-size:70px;line-height:1.05;margin:0 0 20px;font-weight:400;font-style:italic;">A slower kind of Tuesday.</h1><p style="font-size:19px;line-height:1.7;color:#7a5240;font-family:\'Cormorant Garamond\',serif;font-style:italic;">Bread proving on the counter. A cat asleep on a book. The bees are in the lavender again and none of the emails have caught fire.</p><div style="margin-top:36px;"><a href="#" style="padding:14px 34px;background:#a17454;color:#f7f0e2;text-decoration:none;border-radius:2px;letter-spacing:0.15em;font-size:12px;text-transform:uppercase;font-family:\'Cormorant Garamond\',serif;">Come inside</a></div></div></section>',
            '<section style="padding:80px 56px;background:#f7f0e2;font-family:\'Playfair Display\',serif;color:#4a2f22;"><div style="max-width:720px;margin:0 auto;text-align:center;"><h2 style="font-size:40px;margin:0 0 24px;font-weight:400;font-style:italic;">What\'s baking today.</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;text-align:left;margin-top:32px;">' + "".join([f'<div style="padding:24px;background:#efe0c8;border-radius:8px;border:1px solid #d6bf9c;"><h3 style="margin:0 0 8px;font-size:20px;font-weight:400;">{t}</h3><p style="margin:0;font-family:\'Cormorant Garamond\',serif;font-size:16px;line-height:1.6;color:#7a5240;font-style:italic;">{d}</p></div>' for t, d in [("Sourdough loaf", "Fed since 2019. Cranky in winter."), ("Rhubarb jam", "Small batch, mostly sugar."), ("Rosemary focaccia", "Salt flakes the size of moons.")]]) + '</div></div></section>',
            '<footer style="padding:32px 56px;background:#4a2f22;color:#efd9c0;font-family:\'Cormorant Garamond\',serif;font-style:italic;font-size:14px;text-align:center;">The kettle is on. Come sit a while.</footer>',
        ],
    ),
    # 5. Y2K
    _tpl(
        "starter-y2k",
        "Y2K Chrome",
        "Bubblegum pink, chrome, low-poly stars, sparkly clip-art energy.",
        "y2k",
        "#ffd6f0",
        ["VT323", "Space Mono"],
        [
            '<section style="min-height:70vh;padding:64px 40px;background:linear-gradient(135deg,#ffd6f0 0%,#c8b4ff 50%,#a0e8ff 100%);font-family:\'Space Mono\',monospace;color:#3a1a4a;position:relative;overflow:hidden;"><div style="max-width:680px;position:relative;z-index:2;"><div style="display:inline-block;padding:6px 12px;background:linear-gradient(180deg,#ffffff,#e0d0ff);border:2px solid #3a1a4a;box-shadow:4px 4px 0 #3a1a4a;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;">★ new millennium ★</div><h1 style="font-family:VT323,monospace;font-size:96px;line-height:1;margin:20px 0 12px;background:linear-gradient(180deg,#ff4dc4 0%,#8b3aff 100%);-webkit-background-clip:text;background-clip:text;color:transparent;letter-spacing:-0.02em;">2000s.exe</h1><p style="font-size:16px;line-height:1.6;max-width:520px;color:#4a2a5a;">welcome 2 the internet before the internet got tired :) chrome buttons, clippy energy, and every gradient turned all the way up.</p><div style="display:flex;gap:12px;margin-top:28px;flex-wrap:wrap;"><a href="#" style="padding:14px 26px;background:linear-gradient(180deg,#ffffff 0%,#ffd6f0 100%);border:2px solid #3a1a4a;box-shadow:4px 4px 0 #3a1a4a;color:#3a1a4a;text-decoration:none;font-weight:700;font-size:14px;text-transform:uppercase;letter-spacing:0.1em;">→ start.exe</a><a href="#" style="padding:14px 26px;background:linear-gradient(180deg,#c8b4ff 0%,#8b3aff 100%);border:2px solid #3a1a4a;box-shadow:4px 4px 0 #3a1a4a;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;text-transform:uppercase;letter-spacing:0.1em;">☆ about.txt</a></div></div><div style="position:absolute;right:40px;top:40px;font-size:80px;color:#ffffff;text-shadow:4px 4px 0 #3a1a4a;">★</div></section>',
            '<section style="padding:72px 40px;background:#3a1a4a;color:#ffd6f0;font-family:\'Space Mono\',monospace;"><h2 style="font-family:VT323,monospace;font-size:60px;margin:0 0 32px;color:#ffffff;">features.txt</h2><div style="display:grid;grid-template-columns:repeat(2,1fr);gap:20px;">' + "".join([f'<div style="padding:24px;background:#ffd6f0;color:#3a1a4a;border:2px solid #ffffff;box-shadow:6px 6px 0 #ff4dc4;"><div style="font-family:VT323,monospace;font-size:32px;color:#ff4dc4;">{n}</div><h3 style="margin:8px 0 6px;font-size:16px;text-transform:uppercase;letter-spacing:0.1em;">{t}</h3><p style="margin:0;font-size:13px;line-height:1.5;">{d}</p></div>' for n, t, d in [("★", "chrome buttons", "the shinier the better."), ("♥", "sparkle everywhere", "cursors, backgrounds, hearts."), ("☆", "guestbook energy", "sign it. tell everyone."), ("♪", "midi soundtracks", "yes, still.")]]) + '</div></section>',
            '<footer style="padding:24px 40px;background:linear-gradient(90deg,#ff4dc4,#8b3aff);color:#ffffff;font-family:VT323,monospace;font-size:22px;text-align:center;letter-spacing:0.1em;">★ made w/ love, dial-up & sparkles ★</footer>',
        ],
    ),
    # 6. Vaporwave
    _tpl(
        "starter-vaporwave",
        "Vaporwave",
        "Sunset gradient, roman busts, mall music, aesthetic™.",
        "vaporwave",
        "#0f0d3a",
        ["VT323", "Manrope"],
        [
            '<section style="min-height:74vh;padding:80px 48px;background:linear-gradient(180deg,#0f0d3a 0%,#5a2d8a 40%,#ff5db1 75%,#ffb56b 100%);font-family:VT323,monospace;color:#ffffff;position:relative;overflow:hidden;"><div style="max-width:700px;position:relative;z-index:2;"><div style="font-family:Manrope,sans-serif;font-size:11px;letter-spacing:0.4em;color:#c0f0ff;text-transform:uppercase;margin-bottom:16px;">ｅｓｔａｂｌｉｓｈｅｄ · １９９４</div><h1 style="font-size:120px;line-height:0.95;margin:0 0 20px;letter-spacing:0.05em;text-shadow:4px 4px 0 #ff5db1,-2px -2px 0 #00e5ff;">ＡＥＳＴＨＥＴＩＣ</h1><p style="font-family:Manrope,sans-serif;font-size:17px;line-height:1.7;max-width:520px;color:#e8d8ff;">The mall is closed. The muzak plays anyway. Neon sunsets, roman busts, and the quiet math of a receipt from 1997.</p><div style="margin-top:32px;display:flex;gap:16px;"><a href="#" style="padding:14px 26px;background:#0f0d3a;color:#ffffff;text-decoration:none;font-family:Manrope,sans-serif;font-size:13px;letter-spacing:0.2em;text-transform:uppercase;border:1px solid #ff5db1;">Enter Mall</a><a href="#" style="padding:14px 26px;color:#c0f0ff;text-decoration:none;font-family:Manrope,sans-serif;font-size:13px;letter-spacing:0.2em;text-transform:uppercase;">Track List →</a></div></div><div style="position:absolute;left:0;right:0;bottom:0;height:120px;background:repeating-linear-gradient(0deg,#ff5db1 0 2px,transparent 2px 12px),linear-gradient(180deg,transparent,#0f0d3a);"></div></section>',
            '<section style="padding:64px 48px;background:#0f0d3a;color:#e8d8ff;font-family:VT323,monospace;text-align:center;"><h2 style="font-size:64px;margin:0 0 24px;letter-spacing:0.05em;">ＴＲＡＣＫ ＬＩＳＴ</h2><ol style="list-style:none;padding:0;max-width:520px;margin:0 auto;text-align:left;font-family:Manrope,sans-serif;font-size:14px;">' + "".join([f'<li style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px dashed #5a2d8a;"><span>{i:02d} — {t}</span><span style="color:#ff5db1;">{d}</span></li>' for i, (t, d) in enumerate([("マクロス", "5:11"), ("Neon Reflections", "4:03"), ("Interior Mall", "6:47"), ("Sunset Escalator", "3:29")], 1)]) + '</ol></section>',
            '<footer style="padding:24px 48px;background:#5a2d8a;color:#c0f0ff;font-family:Manrope,sans-serif;font-size:12px;letter-spacing:0.3em;text-align:center;text-transform:uppercase;">© Vaporwave Records · Please shop responsibly</footer>',
        ],
    ),
    # 7. Cyberpunk
    _tpl(
        "starter-cyberpunk",
        "Cyberpunk",
        "Neon skylines, black terminals, hot pink alerts, moody rain.",
        "cyberpunk",
        "#050510",
        ["Orbitron", "JetBrains Mono"],
        [
            '<section style="min-height:74vh;padding:80px 56px;background:radial-gradient(ellipse at 70% 20%,#2a0a3a 0%,#050510 60%);font-family:Orbitron,sans-serif;color:#e8f5ff;position:relative;overflow:hidden;"><div style="max-width:680px;position:relative;z-index:2;"><div style="display:inline-block;padding:6px 14px;border:1px solid #ff2ea8;color:#ff2ea8;font-family:\'JetBrains Mono\',monospace;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">// signal received · 03:42:17</div><h1 style="font-size:82px;line-height:1;margin:20px 0 18px;font-weight:700;letter-spacing:-0.01em;color:#00e5ff;text-shadow:0 0 20px rgba(0,229,255,0.5);">JACK IN.<br><span style="color:#ff2ea8;text-shadow:0 0 20px rgba(255,46,168,0.5);">STAY UP.</span></h1><p style="font-family:\'JetBrains Mono\',monospace;font-size:15px;line-height:1.7;color:#a0c8e0;max-width:520px;">Chrome under the skin. A city that never dims. Somewhere a corporate server is asking who you are and the honest answer is: none of your business.</p><div style="margin-top:34px;display:flex;gap:14px;"><a href="#" style="padding:14px 28px;background:transparent;border:1px solid #00e5ff;color:#00e5ff;text-decoration:none;font-family:\'JetBrains Mono\',monospace;font-size:13px;letter-spacing:0.2em;text-transform:uppercase;">Run diagnostics</a><a href="#" style="padding:14px 28px;background:#ff2ea8;color:#050510;text-decoration:none;font-family:\'JetBrains Mono\',monospace;font-size:13px;letter-spacing:0.2em;text-transform:uppercase;font-weight:700;">Deploy</a></div></div></section>',
            '<section style="padding:72px 56px;background:#080818;color:#e8f5ff;font-family:\'JetBrains Mono\',monospace;border-top:1px solid #2a0a3a;"><h2 style="font-family:Orbitron,sans-serif;font-size:36px;margin:0 0 40px;color:#00e5ff;">// SYSTEMS ONLINE</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;">' + "".join([f'<div style="padding:24px;border:1px solid #2a2a4a;background:#0a0a20;position:relative;"><div style="position:absolute;top:8px;right:12px;width:8px;height:8px;background:{c};border-radius:50%;box-shadow:0 0 8px {c};"></div><div style="font-size:11px;color:{c};letter-spacing:0.2em;">{s}</div><h3 style="margin:8px 0 6px;font-family:Orbitron,sans-serif;font-size:18px;color:#e8f5ff;letter-spacing:0.05em;">{t}</h3><p style="margin:0;font-size:12px;line-height:1.6;color:#8098b0;">{d}</p></div>' for s, c, t, d in [("[ ACTIVE ]", "#00e5ff", "NETRUNNER v9", "Cloaked packets · zero-latency uplink."), ("[ HOT ]", "#ff2ea8", "ICEBREAKER", "Bypass corp firewalls in ≤ 3.4s."), ("[ IDLE ]", "#c8ff2e", "GHOST SHELL", "Voiceprint spoof · plausible alibi.")]]) + '</div></section>',
            '<footer style="padding:24px 56px;background:#050510;color:#4a5a70;font-family:\'JetBrains Mono\',monospace;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;text-align:center;border-top:1px solid #2a0a3a;">// end of transmission · burn after reading</footer>',
        ],
    ),
    # 8. Brutalism
    _tpl(
        "starter-brutalism",
        "Web Brutalism",
        "Loud, bare, deliberately ugly, and impossible to ignore.",
        "brutalism",
        "#ffffff",
        ["IBM Plex Mono", "Space Grotesk"],
        [
            '<section style="min-height:70vh;padding:56px 48px;background:#ffffff;font-family:\'IBM Plex Mono\',monospace;color:#000000;border-bottom:8px solid #000000;"><div style="border:4px solid #000000;padding:40px;max-width:760px;"><div style="font-size:11px;letter-spacing:0.2em;margin-bottom:12px;">FILE_ID: 001 · LAST_EDIT: 2026-02-14 08:11</div><h1 style="font-family:\'Space Grotesk\',sans-serif;font-size:88px;line-height:0.95;margin:0 0 20px;font-weight:900;text-transform:uppercase;letter-spacing:-0.02em;">WE MAKE UGLY THINGS THAT WORK.</h1><p style="font-size:15px;line-height:1.7;max-width:520px;margin:0;">No shadows. No gradients. No round corners. Type where type belongs. Buttons that are clearly buttons. A website that could survive a nuclear winter.</p><div style="margin-top:32px;display:flex;gap:0;"><a href="#" style="padding:16px 28px;background:#000000;color:#ffff00;text-decoration:none;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">[ HIRE US ]</a><a href="#" style="padding:16px 28px;background:#ffff00;color:#000000;text-decoration:none;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;border:4px solid #000000;border-left:none;">[ SEE WORK ]</a></div></div></section>',
            '<section style="padding:0;background:#ffff00;font-family:\'IBM Plex Mono\',monospace;color:#000000;border-bottom:8px solid #000000;"><div style="padding:48px;"><h2 style="font-family:\'Space Grotesk\',sans-serif;font-size:44px;margin:0 0 24px;font-weight:900;text-transform:uppercase;">WHAT WE MAKE, SPECIFICALLY.</h2><table style="width:100%;border-collapse:collapse;font-size:14px;"><thead><tr style="border-top:2px solid #000000;border-bottom:2px solid #000000;text-align:left;"><th style="padding:12px 0;">CLIENT</th><th style="padding:12px 0;">THING</th><th style="padding:12px 0;">YEAR</th></tr></thead><tbody>' + "".join([f'<tr style="border-bottom:1px solid #000000;"><td style="padding:14px 0;">{a}</td><td style="padding:14px 0;">{b}</td><td style="padding:14px 0;">{y}</td></tr>' for a, b, y in [("MERZBAU RECORDS", "Vinyl catalogue site", "2025"), ("HAAS TYPE FOUNDRY", "Specimen viewer", "2024"), ("KRUEGER GALLERY", "Show archive", "2024"), ("BERLIN NOISE FEST", "Ticketing", "2023")]]) + '</tbody></table></div></section>',
            '<footer style="padding:24px 48px;background:#000000;color:#ffffff;font-family:\'IBM Plex Mono\',monospace;font-size:12px;display:flex;justify-content:space-between;"><span>©2026 STUDIO BRUT · BERLIN — LAGOS — LEIPZIG</span><span>hello@brut.studio</span></footer>',
        ],
    ),
    # 9. Bauhaus
    _tpl(
        "starter-bauhaus",
        "Bauhaus",
        "Primary colours and pure geometry — 1919 shows up early.",
        "bauhaus",
        "#f2eede",
        ["Space Grotesk"],
        [
            '<section style="min-height:72vh;padding:64px 56px;background:#f2eede;font-family:\'Space Grotesk\',sans-serif;color:#0a0a0a;position:relative;overflow:hidden;"><div style="max-width:600px;position:relative;z-index:2;"><div style="width:60px;height:60px;background:#e63946;border-radius:50%;margin-bottom:20px;"></div><h1 style="font-size:76px;line-height:0.98;margin:0 0 20px;font-weight:700;letter-spacing:-0.03em;">Form.<br>Function.<br><span style="color:#e63946;">Repeat.</span></h1><p style="font-size:17px;line-height:1.65;max-width:460px;color:#3a3a3a;">A design studio still following the 1919 syllabus. Squares. Circles. Triangles. The rest is decoration and decoration is a crime.</p><div style="margin-top:32px;"><a href="#" style="padding:14px 32px;background:#0a0a0a;color:#f2eede;text-decoration:none;font-weight:600;font-size:14px;letter-spacing:0.1em;text-transform:uppercase;">Studio →</a></div></div><div style="position:absolute;right:80px;top:80px;width:200px;height:200px;background:#f4c542;"></div><div style="position:absolute;right:0;bottom:0;width:0;height:0;border-left:180px solid transparent;border-right:180px solid transparent;border-bottom:280px solid #3b6bd6;opacity:0.85;"></div></section>',
            '<section style="padding:80px 56px;background:#0a0a0a;color:#f2eede;font-family:\'Space Grotesk\',sans-serif;"><h2 style="font-size:44px;margin:0 0 40px;font-weight:600;">Three ideas we live by.</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:32px;">' + "".join([f'<div><div style="width:64px;height:64px;background:{c};{s}margin-bottom:20px;"></div><h3 style="margin:0 0 8px;font-size:20px;font-weight:600;">{t}</h3><p style="margin:0;font-size:14px;line-height:1.6;color:#a8a8a8;">{d}</p></div>' for c, s, t, d in [("#e63946", "border-radius:50%;", "Circle · Idea", "The germ. The concept. The origin."), ("#f4c542", "", "Square · Craft", "The discipline that turns idea into thing."), ("#3b6bd6", "clip-path:polygon(50% 0,100% 100%,0 100%);", "Triangle · Direction", "Where the whole thing is pointed.")]]) + '</div></section>',
            '<footer style="padding:24px 56px;background:#e63946;color:#f2eede;font-family:\'Space Grotesk\',sans-serif;font-size:13px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;">Studio Bauhaus · Est. 2026 · A very old idea, again.</footer>',
        ],
    ),
    # 10. Scandi Minimal
    _tpl(
        "starter-scandi-minimal",
        "Scandi Minimal",
        "Whitespace as luxury. Two tones. One good serif.",
        "scandi-minimal",
        "#faf8f4",
        ["Inter", "Fraunces"],
        [
            '<section style="min-height:70vh;padding:120px 96px;background:#faf8f4;font-family:Inter,sans-serif;color:#0a0a0a;"><div style="max-width:580px;"><div style="font-size:11px;letter-spacing:0.32em;text-transform:uppercase;color:#7a7a7a;margin-bottom:24px;">Est. 2019 · Copenhagen</div><h1 style="font-family:Fraunces,serif;font-size:64px;line-height:1.05;margin:0 0 24px;font-weight:400;letter-spacing:-0.02em;">Less, but of the very best.</h1><p style="font-size:16px;line-height:1.75;color:#4a4a4a;max-width:460px;">Objects, furniture, and small ideas made by four people in a former bakery. We ship two collections a year and re-use the wrapping.</p><div style="margin-top:44px;"><a href="#" style="padding:14px 0;color:#0a0a0a;text-decoration:none;border-bottom:1px solid #0a0a0a;font-size:14px;letter-spacing:0.05em;">Browse the shop &nbsp;→</a></div></div></section>',
            '<section style="padding:96px 96px;background:#f0ece2;font-family:Inter,sans-serif;color:#0a0a0a;"><div style="display:grid;grid-template-columns:1fr 1fr;gap:96px;align-items:end;"><h2 style="font-family:Fraunces,serif;font-size:44px;margin:0;font-weight:400;line-height:1.15;">Two collections. Zero fuss.</h2><p style="font-size:15px;line-height:1.8;color:#4a4a4a;margin:0;">Autumn arrives 04 September. Preview available for members from 21 August. All pieces are hand-finished in our workshop; edition sizes are printed on the tag.</p></div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:48px;">' + "".join([f'<div><div style="aspect-ratio:1/1.2;background:{c};margin-bottom:12px;"></div><div style="font-size:13px;color:#0a0a0a;">{t}</div><div style="font-size:12px;color:#7a7a7a;">{p}</div></div>' for c, t, p in [("#d4ccbf", "Oak stool · No. 3", "€ 240"), ("#c8bfae", "Linen throw · Ivory", "€ 120"), ("#a89e88", "Ceramic vessel", "€ 88")]]) + '</div></section>',
            '<footer style="padding:32px 96px;background:#faf8f4;color:#7a7a7a;font-family:Inter,sans-serif;font-size:12px;letter-spacing:0.1em;display:flex;justify-content:space-between;"><span>© 2026 STUDIO</span><span>Ravnsborggade 22 · København N</span></footer>',
        ],
    ),
    # 11. Memphis
    _tpl(
        "starter-memphis",
        "Memphis Group",
        "Squiggles, terrazzo, and 1985 having far too much fun.",
        "memphis",
        "#fdf6e3",
        ["Rubik Mono One", "DM Sans"],
        [
            '<section style="min-height:70vh;padding:64px 48px;background:#fdf6e3;font-family:\'DM Sans\',sans-serif;color:#1a1a1a;position:relative;overflow:hidden;"><div style="max-width:640px;position:relative;z-index:2;"><h1 style="font-family:\'Rubik Mono One\',sans-serif;font-size:72px;line-height:1;margin:0 0 20px;color:#ff3b8b;text-transform:uppercase;">Loud on <span style="color:#00b8d4;">purpose</span>.</h1><p style="font-size:17px;line-height:1.65;max-width:480px;color:#3a3a3a;">A studio for brands that would rather be remembered than tasteful. Squiggles, terrazzo, mustard-yellow. If your grandmother hates it, we\'ve done our job.</p><div style="margin-top:32px;display:flex;gap:14px;flex-wrap:wrap;"><a href="#" style="padding:14px 26px;background:#ffcf3c;color:#1a1a1a;text-decoration:none;font-weight:700;border-radius:999px;font-size:14px;">Say hello →</a><a href="#" style="padding:14px 26px;background:#1a1a1a;color:#fdf6e3;text-decoration:none;font-weight:700;border-radius:999px;font-size:14px;">Portfolio</a></div></div><div style="position:absolute;right:60px;top:50px;width:100px;height:100px;background:#00b8d4;border-radius:50%;"></div><div style="position:absolute;right:180px;top:180px;width:80px;height:80px;background:#ffcf3c;transform:rotate(15deg);"></div><div style="position:absolute;right:40px;bottom:40px;width:180px;height:16px;background:repeating-linear-gradient(90deg,#ff3b8b 0 20px,#1a1a1a 20px 24px);"></div></section>',
            '<section style="padding:72px 48px;background:#00b8d4;font-family:\'DM Sans\',sans-serif;color:#1a1a1a;"><h2 style="font-family:\'Rubik Mono One\',sans-serif;font-size:40px;margin:0 0 32px;text-transform:uppercase;">Recent noise.</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;">' + "".join([f'<div style="padding:24px;background:{c};border-radius:24px;transform:rotate({r}deg);"><h3 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#1a1a1a;">{t}</h3><p style="margin:0;font-size:14px;line-height:1.5;color:#1a1a1a;">{d}</p></div>' for c, r, t, d in [("#ffcf3c", "-2", "Fanta rebrand", "Terrazzo cans. Yes really."), ("#ff3b8b", "1.5", "Squiggle Fest", "Two-day type festival in Milan."), ("#fdf6e3", "-1", "Radio 6 idents", "Six squiggles, three seconds each.")]]) + '</div></section>',
            '<footer style="padding:24px 48px;background:#1a1a1a;color:#ffcf3c;font-family:\'Rubik Mono One\',sans-serif;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;text-align:center;">© Memphis Studio · No boring briefs</footer>',
        ],
    ),
    # 12. Retro-Futurism
    _tpl(
        "starter-retro-futurism",
        "Retro-Futurism",
        "1970s space-station optimism — orange, brown, cream, tomorrow.",
        "retro-futurism",
        "#f2e6d0",
        ["DM Serif Display", "Space Mono"],
        [
            '<section style="min-height:72vh;padding:80px 56px;background:radial-gradient(circle at 80% 20%,#f0a038 0%,#c5551d 40%,#7a2b12 100%);font-family:\'DM Serif Display\',serif;color:#f2e6d0;position:relative;overflow:hidden;"><div style="max-width:640px;position:relative;z-index:2;"><div style="font-family:\'Space Mono\',monospace;font-size:11px;letter-spacing:0.3em;color:#f2e6d0;text-transform:uppercase;margin-bottom:20px;">MISSION LOG · 04 MARCH 1978</div><h1 style="font-size:82px;line-height:1;margin:0 0 20px;font-weight:400;letter-spacing:-0.01em;">The future,<br>as promised.</h1><p style="font-family:\'Space Mono\',monospace;font-size:14px;line-height:1.8;max-width:500px;color:#f8e6c4;">Rotating space-stations, orange plastic chairs, and a computer the size of a wardrobe that answers politely. This is the tomorrow we were sold. We saved you a seat.</p><div style="margin-top:32px;display:flex;gap:14px;"><a href="#" style="padding:14px 28px;background:#f2e6d0;color:#7a2b12;text-decoration:none;font-family:\'Space Mono\',monospace;font-size:13px;letter-spacing:0.2em;text-transform:uppercase;border-radius:999px;">Board the ship</a></div></div><div style="position:absolute;right:-40px;bottom:-60px;width:260px;height:260px;border-radius:50%;border:12px solid #f2e6d0;opacity:0.4;"></div></section>',
            '<section style="padding:80px 56px;background:#f2e6d0;color:#3a1f10;font-family:\'DM Serif Display\',serif;"><h2 style="font-size:44px;margin:0 0 32px;font-weight:400;">Aboard the Ariel-VII.</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;font-family:\'Space Mono\',monospace;">' + "".join([f'<div style="padding:24px;background:#e8d4a8;border-radius:20px;"><div style="font-size:11px;color:#c5551d;letter-spacing:0.2em;">MODULE {n}</div><h3 style="margin:8px 0 6px;font-family:\'DM Serif Display\',serif;font-weight:400;font-size:20px;">{t}</h3><p style="margin:0;font-size:12px;line-height:1.6;color:#5a3a24;">{d}</p></div>' for n, t, d in [("A", "Observation deck", "Panoramic view of a very slow Earth."), ("B", "Comms lounge", "Radio, snacks, orange velour."), ("C", "Hydroponics", "Tomatoes on a schedule.")]]) + '</div></section>',
            '<footer style="padding:24px 56px;background:#7a2b12;color:#f2e6d0;font-family:\'Space Mono\',monospace;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;text-align:center;">Transmission ends · Godspeed, traveller</footer>',
        ],
    ),
    # 13. Bloomcore
    _tpl(
        "starter-bloomcore",
        "Bloomcore",
        "Floral pastels, handwritten headlines, everything in bloom.",
        "bloomcore",
        "#fff5f7",
        ["Caveat", "Lora"],
        [
            '<section style="min-height:70vh;padding:88px 56px;background:linear-gradient(180deg,#fff5f7 0%,#ffe4ee 60%,#f8c9dc 100%);font-family:Lora,serif;color:#5a2a3c;text-align:center;"><div style="max-width:640px;margin:0 auto;"><div style="font-family:Caveat,cursive;font-size:32px;color:#c14571;margin-bottom:8px;">— in full bloom —</div><h1 style="font-family:Lora,serif;font-size:64px;line-height:1.1;margin:0 0 20px;font-weight:500;font-style:italic;color:#4a1a2c;">A quieter kind<br>of flowering.</h1><p style="font-size:17px;line-height:1.75;color:#7a4a5a;font-style:italic;">Peonies. Sweet peas. Ranunculus with too many petals. Every week, hand-tied by two sisters in a very small shed at the edge of a very small village.</p><div style="margin-top:36px;display:flex;gap:14px;justify-content:center;"><a href="#" style="padding:14px 32px;background:#c14571;color:#fff5f7;text-decoration:none;border-radius:999px;font-size:14px;letter-spacing:0.08em;font-family:Lora,serif;">Order a bouquet</a><a href="#" style="padding:14px 32px;background:transparent;color:#5a2a3c;text-decoration:none;border-radius:999px;border:1px solid #c14571;font-size:14px;font-family:Lora,serif;">This week\'s stems</a></div></div></section>',
            '<section style="padding:72px 56px;background:#fff5f7;color:#5a2a3c;font-family:Lora,serif;text-align:center;"><h2 style="font-family:Caveat,cursive;font-size:52px;margin:0 0 12px;color:#c14571;">what\'s in season</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-top:32px;">' + "".join([f'<div style="padding:28px 20px;background:{c};border-radius:20px;"><div style="font-family:Caveat,cursive;font-size:36px;color:#c14571;line-height:1;">{n}</div><h3 style="margin:8px 0 6px;font-style:italic;font-size:20px;font-weight:500;">{t}</h3><p style="margin:0;font-size:13px;line-height:1.6;color:#7a4a5a;">{d}</p></div>' for c, n, t, d in [("#ffe4ee", "01.", "Peonies", "Coral Charm, Sarah Bernhardt, all the ridiculous ones."), ("#fce0ea", "02.", "Sweet peas", "Grown along the south fence. Ludicrous scent."), ("#fce8d0", "03.", "Ranunculus", "One hundred petals per bloom, which we count.")]]) + '</div></section>',
            '<footer style="padding:24px 56px;background:#c14571;color:#fff5f7;font-family:Caveat,cursive;font-size:26px;text-align:center;">love, from the small shed x</footer>',
        ],
    ),
    # 14. Neubrutalism
    _tpl(
        "starter-neubrutalism",
        "Neubrutalism",
        "Flat blocks, thick borders, hard shadows — 2020s remix of brutalism.",
        "neubrutalism",
        "#fef9d9",
        ["DM Sans"],
        [
            '<section style="min-height:70vh;padding:64px 48px;background:#fef9d9;font-family:\'DM Sans\',sans-serif;color:#000000;"><div style="max-width:720px;padding:44px;background:#ffffff;border:3px solid #000000;box-shadow:12px 12px 0 #000000;border-radius:20px;"><div style="display:inline-block;padding:6px 14px;background:#c1e1ff;border:2px solid #000000;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:0.05em;">new · limited spots</div><h1 style="font-size:72px;line-height:1;margin:20px 0 20px;font-weight:900;letter-spacing:-0.03em;">Ship the thing.<br><span style="background:#ffec70;padding:2px 12px;border-radius:8px;">Today.</span></h1><p style="font-size:17px;line-height:1.65;color:#2a2a2a;max-width:520px;">A no-nonsense product studio for founders who\'d rather have a working MVP by Friday than a pitch deck by Q4. Fixed price. Two-week sprints.</p><div style="margin-top:28px;display:flex;gap:14px;"><a href="#" style="padding:14px 26px;background:#ff5b8b;color:#ffffff;text-decoration:none;font-weight:700;border:3px solid #000000;box-shadow:6px 6px 0 #000000;border-radius:14px;font-size:15px;">Book a call</a><a href="#" style="padding:14px 26px;background:#ffffff;color:#000000;text-decoration:none;font-weight:700;border:3px solid #000000;box-shadow:6px 6px 0 #000000;border-radius:14px;font-size:15px;">See work</a></div></div></section>',
            '<section style="padding:72px 48px;background:#c1e1ff;font-family:\'DM Sans\',sans-serif;color:#000000;"><h2 style="font-size:44px;margin:0 0 32px;font-weight:900;letter-spacing:-0.02em;">What we\'re good at.</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;">' + "".join([f'<div style="padding:28px;background:{c};border:3px solid #000000;border-radius:16px;box-shadow:6px 6px 0 #000000;"><div style="font-size:32px;font-weight:900;">{n}</div><h3 style="margin:6px 0 4px;font-size:20px;font-weight:800;">{t}</h3><p style="margin:0;font-size:14px;line-height:1.55;">{d}</p></div>' for c, n, t, d in [("#ffec70", "01", "MVPs in 2 weeks", "Real product, real users, real feedback."), ("#ff5b8b", "02", "Design systems", "Tokens, components, docs — done."), ("#a8f0c0", "03", "Growth ops", "Landing pages that actually convert.")]]) + '</div></section>',
            '<footer style="padding:24px 48px;background:#000000;color:#fef9d9;font-family:\'DM Sans\',sans-serif;font-size:13px;font-weight:700;display:flex;justify-content:space-between;"><span>© 2026 SHIP CO</span><span>hello@ship.co</span></footer>',
        ],
    ),
    # 15. Corp Memphis (aka Alegria)
    _tpl(
        "starter-corp-memphis",
        "Corp Memphis",
        "Flat illustration vibe — mint, purple, oversized limbs everywhere.",
        "corp-memphis",
        "#f4f0ff",
        ["Poppins"],
        [
            '<section style="min-height:70vh;padding:80px 56px;background:linear-gradient(135deg,#f4f0ff 0%,#dff5ec 100%);font-family:Poppins,sans-serif;color:#2a1f4a;position:relative;overflow:hidden;"><div style="max-width:600px;position:relative;z-index:2;"><div style="display:inline-block;padding:6px 14px;background:#c9f0dc;color:#1a5a3c;border-radius:999px;font-size:12px;font-weight:600;">✨ Now onboarding teams</div><h1 style="font-size:60px;line-height:1.05;margin:20px 0 18px;font-weight:700;letter-spacing:-0.02em;">Work that <span style="color:#7a4de8;">feels lighter.</span></h1><p style="font-size:17px;line-height:1.7;color:#4a3f6a;max-width:480px;">The productivity app your team will actually open. Tasks, docs, hugs from your teammates when you close ten tickets in a row. Free forever for small teams.</p><div style="margin-top:32px;display:flex;gap:14px;"><a href="#" style="padding:14px 28px;background:#7a4de8;color:#ffffff;text-decoration:none;font-weight:600;border-radius:12px;font-size:15px;">Start free →</a><a href="#" style="padding:14px 28px;background:transparent;color:#7a4de8;text-decoration:none;font-weight:600;border-radius:12px;font-size:15px;">Watch 90s demo</a></div><div style="margin-top:32px;font-size:13px;color:#6a5f8a;">Trusted by 4,200+ small-and-mediums · SOC 2 · Made in Berlin</div></div><div style="position:absolute;right:60px;top:60px;width:120px;height:120px;background:#ffdc5c;border-radius:50%;"></div><div style="position:absolute;right:220px;top:180px;width:80px;height:80px;background:#7a4de8;border-radius:50%;opacity:0.6;"></div><div style="position:absolute;right:100px;bottom:80px;width:60px;height:60px;background:#ff9ec4;border-radius:20px;transform:rotate(20deg);"></div></section>',
            '<section style="padding:80px 56px;background:#ffffff;font-family:Poppins,sans-serif;color:#2a1f4a;"><h2 style="font-size:40px;margin:0 0 32px;font-weight:700;text-align:center;">Everything your team needs.</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;">' + "".join([f'<div style="padding:32px 24px;background:{bg};border-radius:24px;text-align:center;"><div style="width:56px;height:56px;background:{c};border-radius:50%;margin:0 auto 16px;"></div><h3 style="margin:0 0 8px;font-size:19px;font-weight:600;">{t}</h3><p style="margin:0;font-size:14px;line-height:1.6;color:#5a4a7a;">{d}</p></div>' for bg, c, t, d in [("#f4f0ff", "#7a4de8", "Tasks, together", "Boards, docs, and messaging in one calm place."), ("#dff5ec", "#28c48a", "Real-time everything", "Cursors, comments, presence — instantly."), ("#fff0e8", "#ff9060", "Automations", "Nudge, notify, remind. Zero babysitting.")]]) + '</div></section>',
            '<footer style="padding:32px 56px;background:#f4f0ff;color:#6a5f8a;font-family:Poppins,sans-serif;font-size:13px;display:flex;justify-content:space-between;"><span>© 2026 Lightwork Inc.</span><span>hello@lightwork.app · Built with a lot of coffee</span></footer>',
        ],
    ),
    # 16. Kidcore / Scrapbook Collage — naive shapes, primary crayons, doodle vibe
    _tpl(
        "starter-kidcore",
        "Kidcore Scrapbook",
        "Crayons, doodles, primary colours — 2026's anti-AI-slop antidote.",
        "kidcore",
        "#fff8e1",
        ["Caveat", "Poppins"],
        [
            '<section style="min-height:70vh;padding:64px 40px;background:#fff8e1;background-image:radial-gradient(#ffddad 1px,transparent 1px);background-size:24px 24px;font-family:Poppins,sans-serif;color:#2a1a0a;position:relative;overflow:hidden;"><div style="max-width:640px;position:relative;z-index:2;"><div style="font-family:Caveat,cursive;font-size:26px;color:#ff5b3a;transform:rotate(-4deg);display:inline-block;">✎ hello, world!</div><h1 style="font-size:76px;line-height:0.98;margin:12px 0 18px;font-weight:800;letter-spacing:-0.03em;color:#0a3a5a;"><span style="background:#ffde3a;padding:0 8px;transform:rotate(-1deg);display:inline-block;">Make</span> things by <br><span style="text-decoration:underline wavy #ff5b3a 3px;">hand</span> again.</h1><p style="font-size:17px;line-height:1.65;max-width:480px;color:#4a3020;">A studio for brands that would rather look like a kid\'s locker than a corporate deck. Stickers, doodles, tape, glitter glue. Grown-ups may enter.</p><div style="margin-top:28px;display:flex;gap:14px;flex-wrap:wrap;"><a href="#" style="padding:14px 26px;background:#ff5b3a;color:#fff8e1;text-decoration:none;font-weight:700;border-radius:24px;border:3px solid #2a1a0a;transform:rotate(-1deg);display:inline-block;">Say hi →</a><a href="#" style="padding:14px 26px;background:#3ab6ff;color:#0a3a5a;text-decoration:none;font-weight:700;border-radius:24px;border:3px solid #2a1a0a;transform:rotate(1deg);display:inline-block;">See portfolio</a></div></div><div style="position:absolute;right:60px;top:40px;width:80px;height:80px;background:#3aff8a;border-radius:50%;border:4px solid #2a1a0a;transform:rotate(-8deg);"></div><div style="position:absolute;right:180px;top:220px;font-family:Caveat,cursive;font-size:44px;color:#ff5b3a;transform:rotate(12deg);">★</div></section>',
            '<section style="padding:64px 40px;background:#ffde3a;font-family:Poppins,sans-serif;color:#2a1a0a;"><h2 style="font-family:Caveat,cursive;font-size:56px;margin:0 0 24px;transform:rotate(-1deg);">what\'s in the pencil case</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;">' + "".join([f'<div style="padding:24px;background:{c};border:3px solid #2a1a0a;border-radius:20px;transform:rotate({r}deg);"><div style="font-family:Caveat,cursive;font-size:40px;line-height:1;color:#2a1a0a;">{n}</div><h3 style="margin:8px 0 4px;font-size:20px;font-weight:800;">{t}</h3><p style="margin:0;font-size:14px;line-height:1.5;">{d}</p></div>' for c, r, n, t, d in [("#fff8e1", "-2", "★", "Sticker packs", "Vinyl, hologram, glow-in-the-dark."), ("#3aff8a", "1.5", "✎", "Zines", "Photocopied, stapled, sold on Etsy."), ("#3ab6ff", "-1", "♥", "Doodle brand kits", "Type, marks, glitter animations.")]]) + '</div></section>',
            '<footer style="padding:24px 40px;background:#2a1a0a;color:#ffde3a;font-family:Caveat,cursive;font-size:22px;text-align:center;letter-spacing:0.05em;">made with love, glue & scissors ✂</footer>',
        ],
    ),
    # 17. Blueprint / Technical Drawing
    _tpl(
        "starter-blueprint",
        "Blueprint",
        "Cyan grid on navy — engineering drawings, over-explained.",
        "blueprint",
        "#0a2540",
        ["Space Mono", "Fraunces"],
        [
            '<section style="min-height:72vh;padding:80px 56px;background:#0a2540;background-image:linear-gradient(rgba(120,180,220,0.12) 1px,transparent 1px),linear-gradient(90deg,rgba(120,180,220,0.12) 1px,transparent 1px);background-size:32px 32px;font-family:\'Space Mono\',monospace;color:#c8e0f0;position:relative;overflow:hidden;"><div style="max-width:700px;position:relative;z-index:2;"><div style="font-size:11px;letter-spacing:0.3em;color:#6ab0d8;margin-bottom:16px;">FIG.01 · SHEET 1 OF 4 · SCALE 1:1</div><h1 style="font-family:Fraunces,serif;font-size:74px;line-height:1;margin:0 0 20px;font-weight:400;letter-spacing:-0.01em;color:#ffffff;">Every product,<br><span style="border-bottom:2px dashed #6ab0d8;padding-bottom:4px;">measured twice.</span></h1><p style="font-size:14px;line-height:1.75;max-width:540px;color:#a0c0d8;">A hardware studio that builds slow — mechanical keyboards, camera rigs, single-purpose tools. Every part is dimensioned, every tolerance is documented, every user manual is a book. <span style="color:#6ab0d8;">— Datasheet available on request.</span></p><div style="margin-top:32px;display:flex;gap:14px;"><a href="#" style="padding:14px 26px;background:#c8e0f0;color:#0a2540;text-decoration:none;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;font-weight:700;">Download spec.pdf</a><a href="#" style="padding:14px 26px;color:#c8e0f0;text-decoration:none;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;border:1px solid #6ab0d8;">See catalogue</a></div></div><div style="position:absolute;right:60px;bottom:60px;width:200px;height:200px;border:1px dashed #6ab0d8;border-radius:50%;"><div style="position:absolute;inset:24px;border:1px dashed #6ab0d8;border-radius:50%;"></div><div style="position:absolute;top:50%;left:0;right:0;height:1px;background:#6ab0d8;"></div><div style="position:absolute;left:50%;top:0;bottom:0;width:1px;background:#6ab0d8;"></div></div></section>',
            '<section style="padding:72px 56px;background:#08192b;font-family:\'Space Mono\',monospace;color:#c8e0f0;"><h2 style="font-family:Fraunces,serif;font-size:38px;margin:0 0 32px;font-weight:400;color:#ffffff;">Tolerances we hold.</h2><table style="width:100%;border-collapse:collapse;font-size:13px;"><thead><tr style="border-bottom:1px solid #6ab0d8;"><th style="text-align:left;padding:12px 0;font-weight:400;color:#6ab0d8;letter-spacing:0.15em;text-transform:uppercase;font-size:11px;">Part</th><th style="text-align:left;padding:12px 0;font-weight:400;color:#6ab0d8;letter-spacing:0.15em;text-transform:uppercase;font-size:11px;">Material</th><th style="text-align:left;padding:12px 0;font-weight:400;color:#6ab0d8;letter-spacing:0.15em;text-transform:uppercase;font-size:11px;">±</th><th style="text-align:left;padding:12px 0;font-weight:400;color:#6ab0d8;letter-spacing:0.15em;text-transform:uppercase;font-size:11px;">Notes</th></tr></thead><tbody>' + "".join([f'<tr style="border-bottom:1px dashed rgba(120,180,220,0.2);"><td style="padding:14px 0;">{a}</td><td style="padding:14px 0;color:#a0c0d8;">{b}</td><td style="padding:14px 0;color:#6ab0d8;">{t}</td><td style="padding:14px 0;color:#a0c0d8;">{n}</td></tr>' for a, b, t, n in [("Aluminium chassis", "6061-T6", "0.05mm", "CNC · bead blasted"), ("Keycap set", "PBT double-shot", "0.10mm", "MX stem · Cherry profile"), ("Optical PCB", "FR-4 · 1.6mm", "0.02mm", "ENIG finish"), ("Foot pad", "Sorbothane 70A", "0.20mm", "3M 300LSE adhesive")]]) + '</tbody></table></section>',
            '<footer style="padding:24px 56px;background:#0a2540;color:#6ab0d8;font-family:\'Space Mono\',monospace;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;text-align:center;">ISO 9001 · Made in Utrecht · Rev. 2026.02</footer>',
        ],
    ),
    # 18. Editorial Minimalism (warm cream, Anthropic-esque)
    _tpl(
        "starter-editorial-warm",
        "Editorial Warm",
        "Cream backgrounds, custom serifs, warm counter-aesthetic to techno-futurism.",
        "editorial-warm",
        "#f5efe4",
        ["Fraunces", "Inter"],
        [
            '<section style="min-height:74vh;padding:96px 80px;background:#f5efe4;font-family:Inter,sans-serif;color:#1a1410;"><div style="max-width:920px;"><div style="font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#8a7052;margin-bottom:32px;">Est. 2024 · A research studio</div><h1 style="font-family:Fraunces,serif;font-size:96px;line-height:1;margin:0 0 40px;font-weight:400;letter-spacing:-0.03em;font-variation-settings:\'SOFT\' 80;">Careful thinking,<br><em>in public.</em></h1><div style="max-width:520px;font-size:17px;line-height:1.7;color:#4a3d30;"><p style="margin:0 0 16px;">We publish long essays on how software behaves, where product ideas come from, and why craft still matters when everything is a prompt away.</p><p style="margin:0;">The site is deliberately quiet. Nothing pops up. Nothing tracks you. The reader is the only user.</p></div><div style="margin-top:48px;"><a href="#" style="padding:14px 0;color:#1a1410;text-decoration:none;border-bottom:1px solid #1a1410;font-size:14px;letter-spacing:0.02em;">Read the latest essay &nbsp;→</a></div></div></section>',
            '<section style="padding:80px 80px;background:#ecdfc5;font-family:Inter,sans-serif;color:#1a1410;"><div style="display:grid;grid-template-columns:1fr 1fr;gap:80px;"><h2 style="font-family:Fraunces,serif;font-size:44px;margin:0;font-weight:400;line-height:1.15;">Recent essays.</h2><div style="font-size:14px;line-height:1.9;color:#6a5540;">' + "".join([f'<div style="padding:16px 0;border-top:1px solid #d0b890;"><div style="font-family:Fraunces,serif;font-size:22px;color:#1a1410;font-weight:400;margin-bottom:4px;">{t}</div><div style="font-size:12px;letter-spacing:0.05em;color:#8a7052;">{d} · {r}</div></div>' for t, d, r in [("On the discipline of small releases", "12 Feb 2026", "18 min"), ("Why we still write our own copy", "24 Jan 2026", "9 min"), ("Three heuristics for reviewing product", "03 Jan 2026", "22 min"), ("The reader is the only user", "18 Dec 2025", "6 min")]]) + '</div></div></section>',
            '<footer style="padding:32px 80px;background:#f5efe4;color:#8a7052;font-family:Inter,sans-serif;font-size:12px;letter-spacing:0.08em;display:flex;justify-content:space-between;"><span>© 2026 Provenance Studio</span><span>Kraków · Berlin · Providence</span></footer>',
        ],
    ),
    # 19. Diffused Worlds — soft blurred atmospheric pastels
    _tpl(
        "starter-diffused-worlds",
        "Diffused Worlds",
        "Soft blur, dreamy pastels, atmospheric — 2026 counter to hard-edged UI.",
        "diffused-worlds",
        "#eaddf4",
        ["Fraunces", "Manrope"],
        [
            '<section style="min-height:74vh;padding:96px 64px;background:linear-gradient(160deg,#f8e6f2 0%,#eaddf4 40%,#c9d8f0 100%);font-family:Manrope,sans-serif;color:#2a2050;position:relative;overflow:hidden;"><div style="position:absolute;left:8%;top:8%;width:280px;height:280px;background:radial-gradient(circle,#ff9ec4 0%,transparent 65%);filter:blur(40px);opacity:0.8;"></div><div style="position:absolute;right:5%;bottom:15%;width:340px;height:340px;background:radial-gradient(circle,#a4c9ff 0%,transparent 65%);filter:blur(60px);opacity:0.7;"></div><div style="max-width:640px;position:relative;z-index:2;"><div style="font-size:11px;letter-spacing:0.32em;text-transform:uppercase;color:#5a4590;margin-bottom:24px;">SS26 · A slow release</div><h1 style="font-family:Fraunces,serif;font-size:82px;line-height:1;margin:0 0 20px;font-weight:400;font-style:italic;letter-spacing:-0.02em;color:#2a1a5a;">A softer<br>internet, please.</h1><p style="font-size:17px;line-height:1.7;max-width:480px;color:#4a3d70;">Nothing here is sharp. The colours fade. The music is faint. Sit for a while and don\'t click anything and it might just be enough.</p><div style="margin-top:36px;"><a href="#" style="padding:16px 30px;background:rgba(255,255,255,0.6);color:#2a1a5a;text-decoration:none;backdrop-filter:blur(12px);border-radius:999px;font-size:14px;letter-spacing:0.08em;border:1px solid rgba(255,255,255,0.4);">Enter softly →</a></div></div></section>',
            '<section style="padding:80px 64px;background:#f6effa;font-family:Manrope,sans-serif;color:#2a1a5a;text-align:center;"><h2 style="font-family:Fraunces,serif;font-size:44px;margin:0 0 40px;font-weight:400;font-style:italic;">A quiet catalogue.</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:28px;max-width:900px;margin:0 auto;">' + "".join([f'<div style="padding:32px 20px;background:linear-gradient(160deg,{c1},{c2});backdrop-filter:blur(8px);border-radius:24px;color:#2a1a5a;text-align:left;"><div style="font-family:Fraunces,serif;font-size:22px;font-style:italic;margin-bottom:6px;">{t}</div><p style="font-size:13px;line-height:1.6;color:#4a3d70;margin:0;">{d}</p></div>' for c1, c2, t, d in [("#f8e6f2", "#eaddf4", "Ambient perfume", "Notes: dried linen, faint smoke."), ("#e0e8f8", "#d0daf0", "Weighted linens", "Made once a season, in Nara."), ("#f4e8d8", "#e8d8c0", "A single candle", "40 hours. Beeswax. No perfume.")]]) + '</div></section>',
            '<footer style="padding:24px 64px;background:#eaddf4;color:#5a4590;font-family:Manrope,sans-serif;font-size:12px;letter-spacing:0.15em;text-align:center;">Diffused · unhurried since 2024</footer>',
        ],
    ),
    # 20. Cassette Futurism — beige/orange CRT bevel
    _tpl(
        "starter-cassette-futurism",
        "Cassette Futurism",
        "1970s tape-deck sci-fi — beige plastic, amber LEDs, chunky bevels.",
        "cassette-futurism",
        "#d9c9a0",
        ["VT323", "Space Mono"],
        [
            '<section style="min-height:70vh;padding:72px 56px;background:linear-gradient(180deg,#d9c9a0 0%,#b8a578 100%);font-family:\'Space Mono\',monospace;color:#3a2a10;"><div style="max-width:720px;padding:32px;background:#e8d8b0;border-radius:12px;border:2px solid #7a5a30;box-shadow:inset 0 -6px 0 #b8a578,inset 0 6px 0 #f0e5c8,6px 6px 0 #5a4020;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;padding-bottom:12px;border-bottom:1px solid #b8a578;"><div style="font-family:VT323,monospace;font-size:24px;color:#c05a10;letter-spacing:0.15em;">MODEL 7300 · REV.C</div><div style="width:12px;height:12px;background:#c05a10;border-radius:50%;box-shadow:0 0 8px #c05a10;"></div></div><h1 style="font-family:VT323,monospace;font-size:88px;line-height:0.95;margin:0 0 16px;color:#3a2a10;letter-spacing:0.02em;">STAY.<br>ANALOG.</h1><p style="font-size:14px;line-height:1.7;max-width:520px;">A workshop that fixes what other people replace. Cassette decks, dot-matrix printers, mechanical Braun radios. We source parts, we hand-solder, we ship you a printed schematic.</p><div style="margin-top:24px;display:flex;gap:12px;flex-wrap:wrap;"><a href="#" style="padding:12px 24px;background:#c05a10;color:#f0e5c8;text-decoration:none;font-family:VT323,monospace;font-size:20px;letter-spacing:0.1em;text-transform:uppercase;box-shadow:2px 2px 0 #3a2a10;">▶ Send a device</a><a href="#" style="padding:12px 24px;background:#e8d8b0;color:#3a2a10;text-decoration:none;font-family:VT323,monospace;font-size:20px;letter-spacing:0.1em;text-transform:uppercase;border:2px solid #3a2a10;">■ Catalogue</a></div></div></section>',
            '<section style="padding:72px 56px;background:#3a2a10;color:#e8d8b0;font-family:\'Space Mono\',monospace;"><h2 style="font-family:VT323,monospace;font-size:56px;margin:0 0 24px;letter-spacing:0.05em;color:#c05a10;">// SERVICE LOG</h2><div style="font-size:13px;line-height:1.9;">' + "".join([f'<div style="padding:10px 0;border-bottom:1px dashed #7a5a30;display:flex;justify-content:space-between;"><span>[{d}] {t}</span><span style="color:{c};">{s}</span></div>' for d, t, c, s in [("26-02-08", "TEAC A-6100 · azimuth alignment", "#7ac040", "✓ RETURNED"), ("26-01-24", "Braun T-1000 · dial re-lamped", "#7ac040", "✓ RETURNED"), ("26-01-11", "Nakamichi CR-7 · full recap", "#c05a10", "· IN PROGRESS"), ("25-12-19", "Sony TCM-5000 · pinch roller", "#7ac040", "✓ RETURNED")]]) + '</div></section>',
            '<footer style="padding:20px 56px;background:#5a4020;color:#e8d8b0;font-family:VT323,monospace;font-size:20px;letter-spacing:0.1em;text-align:center;">◇ ANALOG SERVICES · SINCE 1978 (LATELY, ANYWAY) ◇</footer>',
        ],
    ),
    # 21. Newspaper Editorial
    _tpl(
        "starter-newspaper",
        "Newspaper Editorial",
        "Broadsheet columns, drop caps, Playfair headlines — a very old-fashioned homepage.",
        "newspaper",
        "#f4ede0",
        ["Playfair Display", "Lora"],
        [
            '<section style="padding:56px 64px 40px;background:#f4ede0;font-family:Lora,serif;color:#1a1a1a;border-bottom:3px double #1a1a1a;"><div style="display:flex;justify-content:space-between;align-items:baseline;padding-bottom:16px;border-bottom:1px solid #1a1a1a;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;"><span>Vol. XLII · No. 219</span><span>The Provincial Chronicle</span><span>Saturday, 14 February 2026</span></div><h1 style="font-family:\'Playfair Display\',serif;font-size:96px;line-height:1;margin:24px 0 8px;font-weight:900;letter-spacing:-0.02em;text-align:center;">A quieter kind<br>of loud.</h1><div style="text-align:center;font-style:italic;font-size:16px;color:#4a4a4a;margin-bottom:32px;">— On the merits of a broadsheet, in the twenty-first year of the twenty-first century</div><div style="column-count:3;column-gap:32px;font-size:14px;line-height:1.7;text-align:justify;"><p style="margin:0 0 12px;"><span style="font-family:\'Playfair Display\',serif;font-size:60px;line-height:0.9;float:left;padding:6px 8px 0 0;font-weight:900;">I</span>t is often said that the printed newspaper is dead, though the newspaper itself has not yet been persuaded of the fact. Every Saturday for forty-two years the paper you are reading has been folded, wrapped, and delivered by bicycle to every letterbox in this village and the two adjacent ones.</p><p style="margin:0 0 12px;">Our editorial line has always been that the news arrives soon enough on its own. What we bring is a slower version — one that has been sat with, thought about, and, in a few cases, argued about in the pub across the road.</p><p style="margin:0;">The paper you are reading, in the sense of the pixels on your screen, is an experiment: can we bring the discipline of a broadsheet — the columns, the drop caps, the strange trust that comes from finishing a page — to a website?</p></div></section>',
            '<section style="padding:40px 64px 64px;background:#f4ede0;font-family:Lora,serif;color:#1a1a1a;"><div style="display:grid;grid-template-columns:2fr 1fr;gap:56px;"><div><div style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#7a7a7a;margin-bottom:8px;">Culture · Book review</div><h2 style="font-family:\'Playfair Display\',serif;font-size:44px;margin:0 0 12px;font-weight:900;line-height:1.05;">The virtue of the almost-good sentence.</h2><div style="font-style:italic;color:#4a4a4a;margin-bottom:16px;">by Miriam Halstead · 12 min</div><p style="font-size:15px;line-height:1.75;">Anwar\'s new collection is the sort of book that will not be reviewed well by algorithms, which is exactly why we insist on reviewing it here — at length, in three columns, over coffee.</p></div><div style="border-left:1px solid #1a1a1a;padding-left:32px;"><div style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#7a7a7a;margin-bottom:12px;">This week</div><ol style="list-style:decimal inside;padding:0;margin:0;font-size:13px;line-height:2;">' + "".join([f'<li>{t}</li>' for t in ["Cathedral roof to be re-leaded", "Verdict on the beehive by-law", "New chef, old pub", "A quiet warning about wolves"]]) + '</ol></div></div></section>',
            '<footer style="padding:24px 64px;background:#1a1a1a;color:#f4ede0;font-family:Lora,serif;font-size:12px;letter-spacing:0.1em;font-style:italic;text-align:center;">Delivered, still, by bicycle. Every Saturday morning.</footer>',
        ],
    ),
    # 22. Barbiecore
    _tpl(
        "starter-barbiecore",
        "Barbiecore",
        "Hot pink everything, gloss, unapologetic maximal cute.",
        "barbiecore",
        "#ff2ea8",
        ["Poppins", "Playfair Display"],
        [
            '<section style="min-height:70vh;padding:80px 56px;background:linear-gradient(180deg,#ff9ec4 0%,#ff2ea8 100%);font-family:Poppins,sans-serif;color:#450a2a;position:relative;overflow:hidden;"><div style="max-width:640px;position:relative;z-index:2;"><div style="display:inline-block;padding:8px 18px;background:#ffffff;color:#ff2ea8;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;box-shadow:0 4px 20px rgba(69,10,42,0.15);">✨ SS26 collection · out now</div><h1 style="font-family:\'Playfair Display\',serif;font-size:88px;line-height:0.98;margin:22px 0 18px;font-weight:900;letter-spacing:-0.02em;color:#ffffff;text-shadow:0 4px 20px rgba(69,10,42,0.2);">Life in <em>pink.</em></h1><p style="font-size:17px;line-height:1.7;max-width:480px;color:#450a2a;font-weight:500;">A very deliberately fun studio for beauty, fashion, and joy-forward brands. Everything glosses. Everything sparkles. Nothing apologises.</p><div style="margin-top:32px;display:flex;gap:14px;"><a href="#" style="padding:16px 30px;background:#ffffff;color:#ff2ea8;text-decoration:none;border-radius:999px;font-weight:700;font-size:15px;box-shadow:0 6px 20px rgba(69,10,42,0.25);">Shop the drop →</a><a href="#" style="padding:16px 30px;background:rgba(255,255,255,0.3);color:#ffffff;text-decoration:none;border-radius:999px;font-weight:700;font-size:15px;backdrop-filter:blur(10px);border:1.5px solid #ffffff;">Playlist</a></div></div><div style="position:absolute;right:60px;top:60px;font-size:120px;color:#ffffff;opacity:0.9;transform:rotate(15deg);">♥</div><div style="position:absolute;right:220px;bottom:80px;font-size:80px;color:#ffe0ec;transform:rotate(-10deg);">✨</div></section>',
            '<section style="padding:80px 56px;background:#fff0f8;font-family:Poppins,sans-serif;color:#450a2a;"><h2 style="font-family:\'Playfair Display\',serif;font-size:44px;margin:0 0 32px;font-weight:900;text-align:center;">This month\'s obsessions.</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;">' + "".join([f'<div style="padding:32px 24px;background:{c};border-radius:32px;text-align:center;box-shadow:0 8px 30px rgba(255,46,168,0.15);"><div style="font-size:44px;line-height:1;margin-bottom:12px;">{e}</div><h3 style="margin:0 0 6px;font-size:20px;font-weight:700;color:#450a2a;">{t}</h3><p style="margin:0;font-size:13px;line-height:1.55;color:#7a3055;">{d}</p></div>' for c, e, t, d in [("#ffe0ec", "♥", "Lip gloss", "Cherry glass · SPF 30 · vegan."), ("#ffd0e0", "✨", "Nail polish", "Chrome finish · limited edition."), ("#ffb8d4", "★", "Face jewels", "Reusable · self-adhesive.")]]) + '</div></section>',
            '<footer style="padding:24px 56px;background:#ff2ea8;color:#ffffff;font-family:Poppins,sans-serif;font-size:13px;text-align:center;font-weight:600;">© 2026 GLOSS · A brand about being into it.</footer>',
        ],
    ),
    # 23. Windows 95 / Retro OS
    _tpl(
        "starter-win95",
        "Windows 95",
        "System font, gray title bars, drop-shadow buttons — early-desktop nostalgia.",
        "win95",
        "#008080",
        ["VT323"],
        [
            '<section style="min-height:70vh;padding:56px 40px;background:#008080;font-family:Tahoma,Verdana,sans-serif;color:#000000;"><div style="max-width:760px;margin:0 auto;background:#c3c3c3;border:2px solid #ffffff;border-right-color:#000000;border-bottom-color:#000000;box-shadow:2px 2px 0 #000000;"><div style="background:linear-gradient(90deg,#000080 0%,#1084d0 100%);color:#ffffff;padding:4px 6px;font-size:12px;font-weight:700;display:flex;justify-content:space-between;align-items:center;">welcome.exe<div style="display:flex;gap:2px;"><button style="width:18px;height:16px;background:#c3c3c3;border:1px solid #ffffff;border-right-color:#000000;border-bottom-color:#000000;font-size:10px;font-weight:700;color:#000000;">_</button><button style="width:18px;height:16px;background:#c3c3c3;border:1px solid #ffffff;border-right-color:#000000;border-bottom-color:#000000;font-size:10px;font-weight:700;color:#000000;">□</button><button style="width:18px;height:16px;background:#c3c3c3;border:1px solid #ffffff;border-right-color:#000000;border-bottom-color:#000000;font-size:10px;font-weight:700;color:#000000;">×</button></div></div><div style="padding:32px;"><h1 style="font-family:\'MS Sans Serif\',Tahoma,sans-serif;font-size:32px;margin:0 0 16px;font-weight:700;">Welcome to the past.</h1><p style="font-size:13px;line-height:1.5;max-width:520px;">A creative studio still running on Windows 95. Every project is a folder. Every folder has an icon. Save often, defrag occasionally, and never trust an autoupdate.</p><div style="margin-top:24px;display:flex;gap:8px;"><button style="padding:6px 20px;background:#c3c3c3;border:2px solid #ffffff;border-right-color:#000000;border-bottom-color:#000000;font-family:Tahoma,sans-serif;font-size:12px;color:#000000;cursor:pointer;">&nbsp;OK&nbsp;</button><button style="padding:6px 20px;background:#c3c3c3;border:2px solid #ffffff;border-right-color:#000000;border-bottom-color:#000000;font-family:Tahoma,sans-serif;font-size:12px;color:#000000;cursor:pointer;">Cancel</button><button style="padding:6px 20px;background:#c3c3c3;border:2px solid #ffffff;border-right-color:#000000;border-bottom-color:#000000;font-family:Tahoma,sans-serif;font-size:12px;color:#000000;cursor:pointer;">Read guestbook</button></div></div></div></section>',
            '<section style="padding:48px 40px;background:#008080;font-family:Tahoma,Verdana,sans-serif;color:#ffffff;"><h2 style="color:#ffffff;font-size:18px;margin:0 0 20px;text-shadow:1px 1px 0 #000000;">📁 My Documents</h2><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px;max-width:900px;">' + "".join([f'<div style="text-align:center;color:#ffffff;font-size:12px;text-shadow:1px 1px 0 #000000;"><div style="width:48px;height:48px;background:{c};border:1px solid #000000;margin:0 auto 6px;display:flex;align-items:center;justify-content:center;font-size:24px;">{e}</div>{t}</div>' for c, e, t in [("#f0e050", "📁", "portfolio\\"), ("#ffffff", "📄", "about.txt"), ("#c3c3c3", "🖳", "contact.exe"), ("#f0f0f0", "🎨", "sketches\\")]]) + '</div></section>',
            '<footer style="padding:8px 12px;background:#c3c3c3;color:#000000;font-family:Tahoma,sans-serif;font-size:11px;border-top:2px solid #ffffff;display:flex;justify-content:space-between;"><span>Start · Programs · Studio 95</span><span>03:47 PM</span></footer>',
        ],
    ),
    # 24. Grunge Zine
    _tpl(
        "starter-grunge-zine",
        "Grunge Zine",
        "Photocopy black + red, cutouts, torn edges, mixed serif/sans chaos.",
        "grunge-zine",
        "#f0ede4",
        ["IBM Plex Mono", "Playfair Display"],
        [
            '<section style="min-height:70vh;padding:56px 40px;background:#f0ede4;background-image:radial-gradient(#c0bcb0 1px,transparent 1px);background-size:3px 3px;font-family:\'IBM Plex Mono\',monospace;color:#1a1a1a;position:relative;"><div style="max-width:720px;position:relative;"><div style="display:inline-block;background:#ee2a2a;color:#f0ede4;padding:4px 12px;font-weight:700;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;transform:rotate(-2deg);">ISSUE #007 · Feb 2026</div><h1 style="font-family:\'Playfair Display\',serif;font-size:88px;line-height:0.92;margin:16px 0;font-weight:900;letter-spacing:-0.02em;">A zine, but on the <span style="background:#1a1a1a;color:#f0ede4;padding:0 12px;">web</span>.</h1><p style="font-size:15px;line-height:1.7;max-width:520px;background:#ffffff;padding:16px;border:1px solid #1a1a1a;box-shadow:4px 4px 0 #ee2a2a;">Cut-and-paste layouts. Photocopy textures. Handwritten margin notes. Interviews with people you\'ve never heard of. This is deliberately not a magazine.</p><div style="margin-top:28px;display:flex;gap:12px;flex-wrap:wrap;"><a href="#" style="padding:12px 22px;background:#1a1a1a;color:#f0ede4;text-decoration:none;font-weight:700;font-size:14px;text-transform:uppercase;letter-spacing:0.1em;transform:rotate(-1deg);display:inline-block;">Read issue →</a><a href="#" style="padding:12px 22px;background:#ee2a2a;color:#f0ede4;text-decoration:none;font-weight:700;font-size:14px;text-transform:uppercase;letter-spacing:0.1em;transform:rotate(1deg);display:inline-block;">Mail us a stamp</a></div></div></section>',
            '<section style="padding:56px 40px;background:#1a1a1a;color:#f0ede4;font-family:\'IBM Plex Mono\',monospace;"><h2 style="font-family:\'Playfair Display\',serif;font-size:44px;margin:0 0 32px;font-weight:900;color:#ee2a2a;">Contents.</h2><div style="display:grid;grid-template-columns:repeat(2,1fr);gap:20px;font-size:14px;line-height:1.7;">' + "".join([f'<div style="padding:16px;background:#f0ede4;color:#1a1a1a;transform:rotate({r}deg);"><div style="font-family:\'Playfair Display\',serif;font-size:26px;font-weight:900;margin-bottom:4px;">{t}</div><div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#7a7a7a;">{d}</div></div>' for r, t, d in [("-1", "The Bus Driver Interview", "6 pages · fold-out map"), ("0.8", "A Manifesto About Sandwiches", "3 pages · illustrated"), ("-0.5", "Zine Culture Is Not Over", "editorial · 2 pages"), ("1.2", "Photocopy Every Show", "photo essay · pull-out")]]) + '</div></section>',
            '<footer style="padding:20px 40px;background:#ee2a2a;color:#f0ede4;font-family:\'IBM Plex Mono\',monospace;font-size:11px;letter-spacing:0.2em;text-align:center;text-transform:uppercase;">printed on a photocopier at 2am · not for resale</footer>',
        ],
    ),
    # 25. Art Nouveau
    _tpl(
        "starter-art-nouveau",
        "Art Nouveau",
        "Organic curves, gold & emerald, Mucha-inspired botanic lines.",
        "art-nouveau",
        "#f4ecd8",
        ["Cormorant Garamond", "Cormorant SC"],
        [
            '<section style="min-height:74vh;padding:80px 56px;background:linear-gradient(135deg,#f4ecd8 0%,#e0d0a0 100%);font-family:\'Cormorant Garamond\',serif;color:#2a3a20;position:relative;overflow:hidden;"><div style="max-width:640px;position:relative;z-index:2;"><div style="font-family:\'Cormorant SC\',serif;font-size:13px;letter-spacing:0.4em;color:#7a6020;margin-bottom:20px;">L\'ATELIER MUCHA · ÉTABLI MDCCCXCVI</div><h1 style="font-size:82px;line-height:1;margin:0 0 18px;font-weight:400;font-style:italic;letter-spacing:-0.01em;color:#3a4a25;">Nature,<br>drawn slowly.</h1><p style="font-size:18px;line-height:1.7;max-width:480px;color:#5a4a30;">An illustration studio still working with pen, ink, and gold leaf. Botanical posters, wine labels, opera programmes. Every commission takes a season. We do not do rush jobs; we suggest patience.</p><div style="margin-top:36px;display:flex;gap:16px;align-items:center;"><a href="#" style="padding:14px 30px;background:#3a4a25;color:#f4ecd8;text-decoration:none;font-family:\'Cormorant SC\',serif;font-size:12px;letter-spacing:0.28em;text-transform:uppercase;border-radius:2px;">Commission a work</a><span style="font-style:italic;color:#7a6020;font-size:14px;">— Prix sur demande</span></div></div><div style="position:absolute;right:0;top:0;bottom:0;width:200px;background:radial-gradient(ellipse at center,rgba(184,152,72,0.4),transparent 65%);"></div><div style="position:absolute;right:80px;top:50%;transform:translateY(-50%);width:120px;height:220px;border:2px solid #b89848;border-radius:60px 60px 20px 20px;opacity:0.6;"></div></section>',
            '<section style="padding:80px 56px;background:#2a3a20;color:#e8dcb0;font-family:\'Cormorant Garamond\',serif;"><div style="display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center;"><div><div style="font-family:\'Cormorant SC\',serif;font-size:12px;letter-spacing:0.32em;color:#c8a848;margin-bottom:16px;">SÉLECTION DE L\'ANNÉE</div><h2 style="font-size:52px;margin:0 0 20px;font-weight:400;font-style:italic;color:#f4ecd8;">Les affiches.</h2><p style="font-size:16px;line-height:1.75;color:#c8bc90;">Four botanical posters, hand-drawn in ink and finished with 23-carat gold leaf on 300gsm Fabriano paper. Editions of nine. Numbered and signed.</p></div><div style="font-family:\'Cormorant SC\',serif;font-size:14px;line-height:2.2;color:#c8bc90;letter-spacing:0.08em;">' + "".join([f'<div style="border-bottom:1px solid #5a6a45;padding:8px 0;display:flex;justify-content:space-between;"><span>{n} · {t}</span><span style="color:#c8a848;">{p}</span></div>' for n, t, p in [("I", "Lys blanc", "480 €"), ("II", "Coquelicot", "480 €"), ("III", "Chardon d\'Écosse", "560 €"), ("IV", "Volubilis", "520 €")]]) + '</div></div></section>',
            '<footer style="padding:24px 56px;background:#3a4a25;color:#c8a848;font-family:\'Cormorant SC\',serif;font-size:11px;letter-spacing:0.28em;text-align:center;text-transform:uppercase;">Atelier Mucha · 14 rue de Seine · Paris VI</footer>',
        ],
    ),
    # 26. Swiss Modernism
    _tpl(
        "starter-swiss",
        "Swiss Modernism",
        "Helvetica-ish, red accents, strict grid — 1957 shows up on time.",
        "swiss",
        "#f4f4f4",
        ["Inter"],
        [
            '<section style="min-height:70vh;padding:80px 80px;background:#f4f4f4;font-family:Inter,sans-serif;color:#111111;"><div style="max-width:1100px;margin:0 auto;display:grid;grid-template-columns:repeat(12,1fr);gap:24px;"><div style="grid-column:1/9;"><div style="font-size:11px;letter-spacing:0.02em;color:#111111;margin-bottom:20px;">01 · Studio · Est. 1957</div><h1 style="font-size:112px;line-height:0.94;margin:0 0 24px;font-weight:700;letter-spacing:-0.04em;">Grid.<br>Type.<br><span style="color:#e5001a;">Repeat.</span></h1></div><div style="grid-column:9/13;padding-top:60px;"><p style="font-size:14px;line-height:1.65;color:#333333;margin:0 0 16px;">A design studio still following the Zurich school. Every layout begins on a 12-column grid. Every headline is set flush left. Every colour is either black, white, or one very specific red.</p><a href="#" style="padding:12px 24px;background:#111111;color:#f4f4f4;text-decoration:none;font-size:13px;font-weight:600;letter-spacing:0.02em;display:inline-block;">Studio →</a></div></div></section>',
            '<section style="padding:64px 80px;background:#ffffff;font-family:Inter,sans-serif;color:#111111;"><div style="max-width:1100px;margin:0 auto;display:grid;grid-template-columns:repeat(12,1fr);gap:24px;"><h2 style="grid-column:1/13;font-size:44px;margin:0 0 32px;font-weight:700;letter-spacing:-0.02em;">Selected clients, 2024–2026.</h2>' + "".join([f'<div style="grid-column:{c};padding-top:20px;border-top:1px solid #111111;"><div style="font-size:13px;font-weight:600;">{n}</div><div style="font-size:11px;color:#7a7a7a;margin-top:4px;letter-spacing:0.02em;">{d}</div></div>' for c, n, d in [("1/4", "Migros Culture Percentage", "Identity · Bern"), ("4/7", "SBB Rail", "Signage · Zurich"), ("7/10", "Museum für Gestaltung", "Catalogue · Zurich"), ("10/13", "Vitra", "Editorial · Basel"), ("1/4", "Bank Julius Bär", "Wayfinding · Geneva"), ("4/7", "Neue Zürcher Zeitung", "Web · Zurich"), ("7/10", "Freitag", "Retail · Zurich"), ("10/13", "USM", "Poster series · Bern")]]) + '</div></section>',
            '<footer style="padding:24px 80px;background:#111111;color:#f4f4f4;font-family:Inter,sans-serif;font-size:11px;letter-spacing:0.02em;display:flex;justify-content:space-between;"><span>© 2026 SCHENKER STUDIO · ZÜRICH</span><span style="color:#e5001a;">●</span></footer>',
        ],
    ),
    # 27. Goblincore
    _tpl(
        "starter-goblincore",
        "Goblincore",
        "Mossy earth, mushrooms, shiny things — feral cottagecore.",
        "goblincore",
        "#2a3520",
        ["Fraunces", "Lora"],
        [
            '<section style="min-height:72vh;padding:80px 56px;background:radial-gradient(circle at 30% 30%,#3a4a28 0%,#1a2412 70%);font-family:Fraunces,serif;color:#d0c8a4;position:relative;overflow:hidden;"><div style="max-width:640px;position:relative;z-index:2;"><div style="font-size:12px;letter-spacing:0.28em;text-transform:uppercase;color:#a89a5c;margin-bottom:18px;font-family:Lora,serif;">— from beneath the log</div><h1 style="font-size:78px;line-height:1;margin:0 0 20px;font-weight:400;font-style:italic;letter-spacing:-0.01em;color:#e8dc9c;">Bring me all<br>the pretty rocks.</h1><p style="font-size:17px;line-height:1.75;max-width:500px;color:#b8b088;font-family:Lora,serif;">A very small shop for people who collect things. Mushrooms, bones, unusual leaves, spoons the wrong shape, sea glass. Everything is either dug up or foraged. Nothing is fresh; that is on purpose.</p><div style="margin-top:32px;display:flex;gap:16px;"><a href="#" style="padding:14px 26px;background:#8a6f2a;color:#1a2412;text-decoration:none;font-weight:600;border-radius:2px;font-size:14px;letter-spacing:0.05em;">Rummage the shop →</a></div></div><div style="position:absolute;right:-20px;bottom:-40px;width:280px;height:280px;background:radial-gradient(circle,#5a4a20 0%,transparent 60%);opacity:0.4;"></div></section>',
            '<section style="padding:80px 56px;background:#1a2412;color:#d0c8a4;font-family:Fraunces,serif;"><h2 style="font-size:44px;margin:0 0 32px;font-weight:400;font-style:italic;color:#e8dc9c;">This week\'s finds.</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;">' + "".join([f'<div style="padding:24px;background:#2a3520;border:1px solid #4a5a30;border-radius:8px;"><div style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#8a6f2a;font-family:Lora,serif;">{c}</div><h3 style="margin:8px 0 6px;font-size:22px;font-style:italic;font-weight:400;color:#e8dc9c;">{t}</h3><p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#a89a68;font-family:Lora,serif;">{d}</p><div style="font-size:14px;color:#c8a848;font-weight:600;">{p}</div></div>' for c, t, d, p in [("MUSHROOMS · DRIED", "Amanita (safe)", "Displayed only. Do not eat.", "£ 6"), ("BONES · SMALL", "Fox jaw", "Bleached, mostly complete.", "£ 22"), ("METAL · CORRODED", "Iron key (18C?)", "From a river bank. Origin unknown.", "£ 14")]]) + '</div></section>',
            '<footer style="padding:24px 56px;background:#2a3520;color:#8a6f2a;font-family:Lora,serif;font-size:12px;font-style:italic;text-align:center;">gremlin approved · nothing here is fresh · thank you for looking</footer>',
        ],
    ),
    # 29. Blog — clean single-column editorial layout (2026 best practice:
    # no heavy sidebar, readable line length, minimal chrome). Ends with a
    # real comment thread on the featured post.
    _tpl(
        "starter-blog",
        "Blog",
        "A clean, readable editorial blog — featured post, recent posts, and working comments.",
        "blog",
        "#faf9f6",
        ["Fraunces", "Inter"],
        [
            '<header style="padding:28px 32px;background:#faf9f6;border-bottom:1px solid #e7e2d8;font-family:Inter,sans-serif;display:flex;align-items:center;justify-content:space-between;"><div style="font-family:Fraunces,serif;font-size:22px;font-weight:600;color:#1c1917;">The Long Way Round</div><nav style="display:flex;gap:24px;font-size:14px;color:#57534e;"><a href="#" style="color:#1c1917;text-decoration:none;font-weight:600;">Home</a><a href="#" style="color:#57534e;text-decoration:none;">Archive</a><a href="#" style="color:#57534e;text-decoration:none;">Tags</a><a href="#" style="color:#57534e;text-decoration:none;">About</a></nav></header>',
            '<section style="padding:64px 32px 48px;background:#faf9f6;font-family:Inter,sans-serif;"><div style="max-width:720px;margin:0 auto;"><div style="font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#b45309;font-weight:600;margin-bottom:12px;">Featured</div><h1 style="font-family:Fraunces,serif;font-size:44px;line-height:1.15;margin:0 0 16px;color:#1c1917;font-weight:500;">What nobody tells you about shipping the first version</h1><p style="font-size:12px;color:#78716c;margin:0 0 20px;">March 4, 2026 · 7 min read · <a href="#" style="color:#b45309;text-decoration:none;">#process</a></p><p style="font-size:18px;line-height:1.75;color:#3f3c37;margin:0 0 16px;">Every version-one product looks like a compromise from the inside and a decision from the outside. The gap between those two views is where most of the anxiety lives — and almost none of it is visible to the people using what you built.</p><p style="font-size:18px;line-height:1.75;color:#3f3c37;margin:0 0 24px;">Three things I wish someone had told me before I shipped mine, in order of how expensive they were to learn.</p><a href="#" style="font-size:15px;font-weight:600;color:#b45309;text-decoration:none;">Continue reading →</a></div></section>',
            '<section style="padding:16px 32px 64px;background:#faf9f6;font-family:Inter,sans-serif;"><div style="max-width:720px;margin:0 auto;"><h2 style="font-family:Fraunces,serif;font-size:22px;color:#1c1917;font-weight:600;margin:0 0 24px;padding-top:24px;border-top:1px solid #e7e2d8;">Recent posts</h2>'
            + "".join([f'<article style="padding:20px 0;border-bottom:1px solid #e7e2d8;"><p style="font-size:12px;color:#78716c;margin:0 0 6px;">{d} · <a href="#" style="color:#b45309;text-decoration:none;">#{tag}</a></p><h3 style="font-family:Fraunces,serif;font-size:20px;font-weight:600;margin:0 0 8px;color:#1c1917;"><a href="#" style="color:inherit;text-decoration:none;">{t}</a></h3><p style="font-size:15px;line-height:1.65;color:#57534e;margin:0;">{ex}</p></article>' for d, tag, t, ex in [
                ("Feb 26, 2026", "writing", "The one-paragraph rule I use for every draft", "If the idea can\'t survive being compressed to one paragraph, it isn\'t ready to be an article yet — a filter that\'s saved me more time than any outline template."),
                ("Feb 18, 2026", "tools", "I deleted my task manager and nothing broke", "A month-long experiment in running a whole freelance practice off a single text file, and the two things I quietly rebuilt anyway."),
                ("Feb 9, 2026", "process", "Slow is a feature, not a bug", "Why the projects I\'m proudest of all had a period where nothing visible happened for weeks — and how to tell that apart from actually being stuck."),
            ]]) + '</div></section>',
            '<section style="padding:40px 32px 72px;background:#f3f0e9;font-family:Inter,sans-serif;text-align:center;"><h2 style="font-family:Fraunces,serif;font-size:24px;margin:0 0 8px;color:#1c1917;">Get new posts by email</h2><p style="font-size:14px;color:#57534e;margin:0 0 20px;">No spam, just writing — unsubscribe whenever.</p><form style="display:flex;gap:8px;max-width:380px;margin:0 auto;"><input type="email" placeholder="you@example.com" style="flex:1;padding:12px 14px;border-radius:8px;border:1px solid #d6d0c4;font-size:14px;outline:none;"><button type="submit" style="padding:12px 22px;background:#1c1917;color:#faf9f6;border:0;border-radius:8px;font-weight:600;cursor:pointer;font-size:14px;">Subscribe</button></form></section>',
            _comments_section(
                [
                    {"id": 1, "author": "Devon R.", "date": "3 hours ago", "text": "The one-paragraph rule is stealing this immediately. I\'ve been outlining my way into paralysis for months."},
                    {"id": 2, "author": "Anaya P.", "date": "5 hours ago", "text": "\"a decision from the outside\" is such a precise way to put it. Bookmarking this to send to my cofounder."},
                ],
                wrap_style="font-family:Inter,sans-serif;padding:8px 32px 72px;background:#faf9f6;",
                heading_style="font-family:Fraunces,serif;font-size:20px;margin:0 0 16px;color:#1c1917;",
            ),
            '<footer style="padding:28px 32px;background:#1c1917;color:#a8a29e;font-family:Inter,sans-serif;font-size:13px;display:flex;justify-content:space-between;"><span>© 2026 The Long Way Round</span><span>RSS · About · Contact</span></footer>',
        ],
    ),
    # 30. Xanga Throwback — glossy teal/purple 2000s journal: mood icons,
    # eProps, a "now playing" widget, subscriptions, blogrings.
    _tpl(
        "starter-xanga-throwback",
        "Xanga Throwback",
        "A faithful 2000s Xanga-style journal — mood icons, eProps, a music widget, and working comments.",
        "xanga-throwback",
        "#eef7f7",
        ["Comic Neue", "Nunito Sans"],
        [
            '<header style="padding:0;font-family:\'Comic Neue\',cursive;"><div style="background:linear-gradient(135deg,#1fb6b6 0%,#5a4fcf 100%);padding:36px 32px;color:#fff;"><div style="font-size:34px;font-weight:700;text-shadow:2px 2px 0 rgba(0,0,0,0.15);">✿ stardust diaries ✿</div><div style="font-size:13px;opacity:0.9;font-family:\'Nunito Sans\',sans-serif;margin-top:4px;">est. 2004 · site #4,281,902 · currently obsessed with: iced coffee</div></div><nav style="background:#0d3b3b;padding:10px 32px;display:flex;gap:18px;font-family:\'Nunito Sans\',sans-serif;font-size:13px;"><a href="#" style="color:#9ff0f0;text-decoration:none;font-weight:700;">Home</a><a href="#" style="color:#cdeeee;text-decoration:none;">Photos</a><a href="#" style="color:#cdeeee;text-decoration:none;">Guestbook</a><a href="#" style="color:#cdeeee;text-decoration:none;">Subscriptions</a><a href="#" style="color:#cdeeee;text-decoration:none;">About Me</a></nav></header>',
            '<section style="padding:32px;background:#eef7f7;font-family:\'Nunito Sans\',sans-serif;"><div style="display:grid;grid-template-columns:1fr 260px;gap:24px;max-width:1000px;margin:0 auto;align-items:start;"><div style="background:#fff;border:2px solid #1fb6b6;border-radius:14px;padding:24px;box-shadow:4px 4px 0 rgba(31,182,182,0.25);"><div style="font-family:\'Comic Neue\',cursive;font-size:22px;font-weight:700;color:#0d3b3b;">omg it\'s finally spring break!!</div><div style="font-size:12px;color:#5a4fcf;margin:6px 0 14px;">posted march 14 · current mood: <strong>ecstatic ✧</strong> · listening to: paramore</div><p style="font-size:14px;line-height:1.7;color:#264d4d;margin:0 0 14px;">okay so i KNOW i said i was gonna study over break but that is not happening. me and jules are doing absolutely nothing for a week straight and i have never been more excited for anything in my life. gonna update with pics later i promise!!</p><div style="display:flex;align-items:center;gap:14px;padding-top:12px;border-top:1px dashed #b8e0e0;"><button style="background:#ffd23f;border:2px solid #0d3b3b;border-radius:999px;padding:6px 16px;font-family:\'Comic Neue\',cursive;font-weight:700;font-size:13px;color:#0d3b3b;cursor:pointer;">☆ eProps (12)</button><span style="font-size:12px;color:#5a4fcf;">2 comments</span></div></div><div style="display:flex;flex-direction:column;gap:16px;"><div style="background:#fff;border:2px solid #5a4fcf;border-radius:14px;padding:16px;box-shadow:3px 3px 0 rgba(90,79,207,0.2);"><div style="width:64px;height:64px;border-radius:12px;background:linear-gradient(135deg,#ffd23f,#ff8fab);margin:0 auto 10px;"></div><div style="text-align:center;font-family:\'Comic Neue\',cursive;font-weight:700;color:#0d3b3b;">stardustgirl04</div><div style="text-align:center;font-size:11px;color:#78716c;margin-top:2px;">17 · Ohio · loves: paramore, thrifting, iced coffee</div></div><div style="background:#0d3b3b;border-radius:14px;padding:14px 16px;color:#cdeeee;"><div style="font-family:\'Comic Neue\',cursive;font-weight:700;font-size:13px;color:#9ff0f0;margin-bottom:4px;">♫ now playing</div><div style="font-size:13px;">Misery Business — Paramore</div></div><div style="background:#fff;border:2px solid #1fb6b6;border-radius:14px;padding:14px 16px;"><div style="font-family:\'Comic Neue\',cursive;font-weight:700;font-size:13px;color:#0d3b3b;margin-bottom:8px;">subscriptions</div>' + "".join([f'<div style="font-size:12px;color:#264d4d;padding:3px 0;">→ {n}</div>' for n in ["glitterxheart", "moonchild_diary", "punkrockprincess"]]) + '</div><div style="display:flex;gap:6px;flex-wrap:wrap;">' + "".join([f'<div style="width:88px;height:31px;background:{c};border:1px solid #0d3b3b;border-radius:3px;"></div>' for c in ["#ffd23f", "#ff8fab", "#9ff0f0"]]) + '</div></div></div></section>',
            _comments_section(
                [
                    {"id": 1, "author": "glitterxheart", "mood": "jealous lol", "date": "2 hours ago", "text": "NO WAY have fun i\'m so jealous, take pics of everything!!"},
                    {"id": 2, "author": "moonchild_diary", "mood": "happy for u", "date": "1 hour ago", "text": "eProps sent!! spring break masterlist when"},
                ],
                wrap_style="font-family:\'Nunito Sans\',sans-serif;padding:8px 32px 48px;background:#eef7f7;",
                heading_style="font-family:\'Comic Neue\',cursive;font-size:18px;margin:0 0 14px;color:#0d3b3b;",
            ),
            '<footer style="padding:20px 32px;background:#0d3b3b;color:#9ff0f0;font-family:\'Nunito Sans\',sans-serif;font-size:12px;text-align:center;">✿ stardust diaries · powered by nothing but vibes ✿</footer>',
        ],
    ),
    # 31. LiveJournal Throwback — understated purple/blue LJ-style friends
    # stream: userpics, current mood/music line, tags, comments, a mini
    # calendar widget.
    _tpl(
        "starter-livejournal-throwback",
        "LiveJournal Throwback",
        "A faithful LiveJournal-style journal — userpics, current mood/music, tags, and working comments.",
        "livejournal-throwback",
        "#ffffff",
        ["Georgia", "Verdana"],
        [
            '<header style="background:#3b3480;padding:0;font-family:Verdana,sans-serif;"><div style="padding:16px 32px;display:flex;align-items:center;justify-content:space-between;"><div style="color:#fff;font-size:20px;font-weight:bold;">wanderer_notes</div><nav style="display:flex;gap:16px;font-size:12px;"><a href="#" style="color:#c9c4f0;text-decoration:none;">Recent Entries</a><a href="#" style="color:#c9c4f0;text-decoration:none;">Friends</a><a href="#" style="color:#c9c4f0;text-decoration:none;">Archive</a><a href="#" style="color:#c9c4f0;text-decoration:none;">Profile</a></nav></div><div style="background:#2b2560;padding:6px 32px;font-size:11px;color:#a89fe0;">viewing recent entries · <a href="#" style="color:#e0d8ff;">add to friends</a></div></header>',
            '<section style="padding:28px 32px;background:#ffffff;font-family:Georgia,serif;"><div style="max-width:940px;margin:0 auto;display:grid;grid-template-columns:1fr 220px;gap:32px;align-items:start;">'
            '<div style="display:grid;grid-template-columns:56px 1fr;gap:16px;padding-bottom:24px;border-bottom:1px solid #e0ddf0;"><div style="width:56px;height:56px;border-radius:4px;background:linear-gradient(135deg,#5a4fcf,#8b7fe0);flex:none;"></div><div><div style="font-family:Verdana,sans-serif;font-size:12px;color:#5a4fcf;margin-bottom:2px;"><strong style="color:#2b2560;">wanderer_notes</strong> wrote,</div><div style="font-family:Verdana,sans-serif;font-size:11px;color:#78716c;margin-bottom:10px;">@ 09:41 pm · current mood: <em>reflective</em> · current music: <em>Bon Iver — Holocene</em></div><h2 style="font-size:22px;margin:0 0 10px;color:#1c1a33;">the apartment finally feels like mine</h2><p style="font-size:15px;line-height:1.75;color:#2e2b45;margin:0 0 10px;">Six months in and I hung the last picture frame tonight, which is apparently the threshold at which a place stops being "where I\'m staying" and starts being "where I live." Small thing. Took longer than it should have to notice it happened.</p><p style="font-size:15px;line-height:1.75;color:#2e2b45;margin:0 0 14px;">Making tea in a kitchen that has opinions about where the mugs go now. I don\'t know when that started either.</p><div style="font-family:Verdana,sans-serif;font-size:11px;color:#5a4fcf;">Tags: <a href="#" style="color:#5a4fcf;">home</a>, <a href="#" style="color:#5a4fcf;">small-things</a>, <a href="#" style="color:#5a4fcf;">quiet</a></div></div></div>'
            '<div style="display:flex;flex-direction:column;gap:14px;font-family:Verdana,sans-serif;"><div style="border:1px solid #e0ddf0;border-radius:6px;padding:14px;"><div style="font-size:11px;font-weight:bold;color:#2b2560;margin-bottom:8px;">FRIENDS</div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;">' + "".join([f'<div style="aspect-ratio:1;border-radius:3px;background:{c};"></div>' for c in ["#5a4fcf", "#8b7fe0", "#c9c4f0", "#3b3480", "#8b7fe0", "#5a4fcf", "#c9c4f0", "#3b3480"]]) + '</div></div><div style="border:1px solid #e0ddf0;border-radius:6px;padding:14px;"><div style="font-size:11px;font-weight:bold;color:#2b2560;margin-bottom:8px;">MARCH 2026</div><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;font-size:10px;text-align:center;color:#78716c;">' + "".join([f'<div style="{"background:#5a4fcf;color:#fff;border-radius:2px;" if d==14 else ""}padding:2px 0;">{d if d else ""}</div>' for d in ([0,0]+list(range(1,32)))]) + '</div></div><div style="border:1px solid #e0ddf0;border-radius:6px;padding:14px;font-size:11px;color:#57534e;">Member since 2019 · 412 entries · <a href="#" style="color:#5a4fcf;">view profile</a></div></div>'
            '</div></section>',
            _comments_section(
                [
                    {"id": 1, "author": "quietmornings", "date": "1 hour ago", "text": "the mug thing got me right in the chest, apartments really do decide these things for you eventually"},
                    {"id": 2, "author": "faraway_kate", "date": "40 minutes ago", "text": "this is such a lovely small entry. hope the tea was good"},
                ],
                wrap_style="font-family:Georgia,serif;padding:8px 32px 48px;background:#ffffff;",
                heading_style="font-family:Verdana,sans-serif;font-size:13px;font-weight:bold;color:#2b2560;margin:0 0 14px;text-transform:uppercase;letter-spacing:0.05em;",
            ),
            '<footer style="padding:18px 32px;background:#2b2560;color:#a89fe0;font-family:Verdana,sans-serif;font-size:11px;text-align:center;">wanderer_notes — powered by nothing in particular, hosted somewhere quiet</footer>',
        ],
    ),
    # 32. Dreamcore
    _tpl(
        "starter-dreamcore",
        "Dreamcore",
        "Hazy pastels, floating orbs, unresolved nostalgia — the internet as a half-remembered dream.",
        "dreamcore",
        "#f3e8ff",
        ["Caveat", "Fraunces"],
        [
            '<section style="min-height:76vh;padding:96px 56px;background:radial-gradient(ellipse at 30% 30%,#ffd6ec 0%,#f3e8ff 40%,#c9d8f8 100%);font-family:Fraunces,serif;color:#3a2a5a;position:relative;overflow:hidden;text-align:center;"><div style="position:absolute;left:15%;top:20%;width:180px;height:180px;background:radial-gradient(circle,#ffdc90,transparent 65%);filter:blur(30px);"></div><div style="position:absolute;right:20%;top:15%;width:120px;height:120px;background:radial-gradient(circle,#c8a4ff,transparent 65%);filter:blur(20px);"></div><div style="position:absolute;left:50%;bottom:10%;width:220px;height:220px;background:radial-gradient(circle,#a4d8ff,transparent 65%);filter:blur(40px);transform:translateX(-50%);"></div><div style="max-width:640px;margin:0 auto;position:relative;z-index:2;"><div style="font-family:Caveat,cursive;font-size:36px;color:#8a5aa8;margin-bottom:12px;">do you remember?</div><h1 style="font-size:78px;line-height:1;margin:0 0 24px;font-weight:400;font-style:italic;letter-spacing:-0.02em;color:#4a2a70;">A place, but not really<br>a place.</h1><p style="font-size:17px;line-height:1.75;max-width:500px;margin:0 auto;color:#6a5a80;">You were seven and you were on holiday and there was a hallway and a pink light and someone laughing very far away and you can\'t remember what happened next. This whole website is that hallway.</p><div style="margin-top:36px;"><a href="#" style="padding:14px 30px;background:rgba(255,255,255,0.6);color:#4a2a70;text-decoration:none;backdrop-filter:blur(10px);border-radius:999px;font-size:14px;letter-spacing:0.08em;border:1px solid rgba(255,255,255,0.5);">walk further in →</a></div></div></section>',
            '<section style="padding:72px 56px;background:#e8d8f8;font-family:Fraunces,serif;color:#3a2a5a;text-align:center;"><h2 style="font-family:Caveat,cursive;font-size:56px;margin:0 0 24px;color:#6a4a90;">rooms</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;max-width:900px;margin:0 auto;">' + "".join([f'<div style="padding:32px 20px;background:linear-gradient(160deg,{c1} 0%,{c2} 100%);border-radius:24px;filter:blur(0.5px);"><div style="font-family:Caveat,cursive;font-size:28px;color:#3a2a5a;">{t}</div><p style="font-size:13px;line-height:1.7;margin:6px 0 0;color:#5a4a70;">{d}</p></div>' for c1, c2, t, d in [("#f8d8ec", "#e8c8f0", "the hallway", "carpet colour: unclear. lightbulb: warm."), ("#d0e0f8", "#c0d0f0", "the swimming pool room", "empty. echoing. tiled in pale mint."), ("#f8e8c8", "#e8d0b0", "the kitchen at 3pm", "everyone is upstairs. the fridge hums.")]]) + '</div></section>',
            '<footer style="padding:24px 56px;background:#f3e8ff;color:#8a6ab0;font-family:Caveat,cursive;font-size:22px;text-align:center;">please do not wake up yet</footer>',
        ],
    ),

    # 33-42. Modern, color-agnostic templates — 5 categories x 2 layout
    # variations. Unlike the aesthetic starters above (which ARE a fixed
    # palette), every color here is var(--fc-*, fallback) — the same
    # convention the block library (blocksExtra.js) already uses — so
    # applying any theme via the Theme tab re-colors the whole page live.
    # Fallback palette (what a fresh, no-theme-applied page looks like):
    # bg #ffffff, surface #f8fafc, text #0f172a, muted #64748b,
    # primary #2563eb, accent #7c3aed, border #e2e8f0.

    # 33. SaaS — Minimal
    _tpl(
        "starter-saas-minimal",
        "SaaS — Minimal",
        "Clean, generous whitespace, one clear call to action. Colors bind to whatever theme is applied.",
        "modern-saas-minimal",
        "var(--fc-bg, #ffffff)",
        ["Inter"],
        [
            '<section style="padding:120px 48px 100px;background:var(--fc-bg, #ffffff);font-family:Inter,sans-serif;text-align:center;"><div style="max-width:640px;margin:0 auto;"><div style="display:inline-block;padding:6px 14px;border:1px solid var(--fc-border, #e2e8f0);border-radius:999px;font-size:12px;color:var(--fc-muted, #64748b);margin-bottom:24px;">Now in open beta</div><h1 style="font-size:52px;line-height:1.1;margin:0 0 20px;font-weight:700;letter-spacing:-0.02em;color:var(--fc-text, #0f172a);">Software that gets out of your way.</h1><p style="font-size:18px;line-height:1.6;color:var(--fc-muted, #64748b);margin:0 0 32px;">One tool for the whole team, none of the setup tax. Start free, upgrade when it actually pays for itself.</p><div style="display:flex;gap:12px;justify-content:center;"><a href="#" style="padding:14px 28px;background:var(--fc-primary, #2563eb);color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Start free</a><a href="#" style="padding:14px 28px;color:var(--fc-text, #0f172a);border:1px solid var(--fc-border, #e2e8f0);border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">See how it works</a></div></div></section>',
            '<section style="padding:80px 48px;background:var(--fc-surface, #f8fafc);font-family:Inter,sans-serif;"><div style="max-width:960px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:32px;">' + "".join([f'<div><div style="width:40px;height:40px;border-radius:10px;background:var(--fc-primary, #2563eb);margin-bottom:16px;"></div><h3 style="font-size:17px;margin:0 0 8px;color:var(--fc-text, #0f172a);">{t}</h3><p style="font-size:14px;line-height:1.6;color:var(--fc-muted, #64748b);margin:0;">{d}</p></div>' for t, d in [("Set up in minutes", "No consultant, no onboarding call. Connect your tools and go."), ("Scales with you", "Same price whether it is 3 people or 300 — usage-based, not seat-taxed."), ("Actually gets used", "Built around the workflow your team already has, not the one we wish they had.")]]) + '</div></section>',
            '<footer style="padding:32px 48px;background:var(--fc-bg, #ffffff);border-top:1px solid var(--fc-border, #e2e8f0);color:var(--fc-muted, #64748b);font-family:Inter,sans-serif;font-size:13px;text-align:center;">© 2026 Fieldnote — built by a small team that ships</footer>',
        ],
    ),
    # 34. SaaS — Bold
    _tpl(
        "starter-saas-bold",
        "SaaS — Bold",
        "Larger type, a confident stat row, and a numbered case for switching. Colors bind to whatever theme is applied.",
        "modern-saas-bold",
        "var(--fc-bg, #ffffff)",
        ["Space Grotesk"],
        [
            '<section style="padding:110px 48px 90px;background:var(--fc-text, #0f172a);font-family:\'Space Grotesk\',sans-serif;color:var(--fc-bg, #ffffff);"><div style="max-width:760px;margin:0 auto;text-align:center;"><h1 style="font-size:68px;line-height:1.02;margin:0 0 20px;font-weight:700;letter-spacing:-0.03em;">Stop paying for six tools to do one job.</h1><p style="font-size:19px;line-height:1.6;opacity:0.75;margin:0 0 36px;">Fieldnote replaces your spreadsheet, your tracker, and the Slack channel where you actually coordinate work.</p><a href="#" style="display:inline-block;padding:16px 34px;background:var(--fc-accent, #7c3aed);color:#fff;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px;">Try it free for 14 days</a><div style="display:flex;justify-content:center;gap:56px;margin-top:56px;">' + "".join([f'<div><div style="font-size:36px;font-weight:700;">{n}</div><div style="font-size:13px;opacity:0.6;margin-top:4px;">{l}</div></div>' for n, l in [("12,400+", "teams onboard"), ("4.8/5", "average rating"), ("6 min", "average setup time")]]) + '</div></div></section>',
            '<section style="padding:88px 48px;background:var(--fc-bg, #ffffff);font-family:\'Space Grotesk\',sans-serif;"><div style="max-width:760px;margin:0 auto;">' + "".join([f'<div style="display:flex;gap:24px;padding:24px 0;border-bottom:1px solid var(--fc-border, #e2e8f0);"><div style="font-size:32px;font-weight:700;color:var(--fc-primary, #2563eb);flex:none;width:56px;">{n}</div><div><h3 style="font-size:19px;margin:0 0 6px;color:var(--fc-text, #0f172a);">{t}</h3><p style="font-size:15px;line-height:1.6;color:var(--fc-muted, #64748b);margin:0;">{d}</p></div></div>' for n, t, d in [("01", "One source of truth", "Everyone stops asking which spreadsheet is the real one."), ("02", "Built-in automation", "The busywork that used to eat Friday afternoons runs itself."), ("03", "Actually cancel anytime", "No call required. We would rather earn it every month.")]]) + '</div></section>',
            '<footer style="padding:32px 48px;background:var(--fc-surface, #f8fafc);color:var(--fc-muted, #64748b);font-family:\'Space Grotesk\',sans-serif;font-size:13px;text-align:center;">© 2026 Fieldnote</footer>',
        ],
    ),

    # 35. Agency — Grid
    _tpl(
        "starter-agency-grid",
        "Agency — Grid",
        "Portfolio-forward studio site with a project grid. Colors bind to whatever theme is applied.",
        "modern-agency-grid",
        "var(--fc-bg, #ffffff)",
        ["Manrope"],
        [
            '<section style="padding:96px 48px 72px;background:var(--fc-bg, #ffffff);font-family:Manrope,sans-serif;"><div style="max-width:800px;"><div style="font-size:13px;letter-spacing:0.1em;text-transform:uppercase;color:var(--fc-muted, #64748b);margin-bottom:16px;">Brand & product studio</div><h1 style="font-size:48px;line-height:1.15;margin:0 0 20px;font-weight:700;color:var(--fc-text, #0f172a);">We build the identity, then the product that has to live up to it.</h1><p style="font-size:17px;line-height:1.65;color:var(--fc-muted, #64748b);max-width:560px;margin:0;">A small studio for founders who need both the brand and the thing itself done right, on the same timeline.</p></div></section>',
            '<section style="padding:0 48px 96px;background:var(--fc-bg, #ffffff);font-family:Manrope,sans-serif;"><div style="max-width:1000px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:20px;">' + "".join([f'<div><div style="aspect-ratio:4/3;background:var(--fc-surface, #f8fafc);border:1px solid var(--fc-border, #e2e8f0);border-radius:12px;margin-bottom:12px;"></div><h3 style="font-size:15px;margin:0 0 2px;color:var(--fc-text, #0f172a);">{t}</h3><p style="font-size:13px;color:var(--fc-muted, #64748b);margin:0;">{d}</p></div>' for t, d in [("Northfield Coffee", "Brand identity + packaging"), ("Loom & Co.", "E-commerce + photography"), ("Verano Health", "Product design + design system"), ("Passage Books", "Web design + development"), ("Hearth Studio", "Brand identity + web"), ("Meridian Finance", "Product design + brand")]]) + '</div></section>',
            '<footer style="padding:32px 48px;background:var(--fc-surface, #f8fafc);border-top:1px solid var(--fc-border, #e2e8f0);color:var(--fc-muted, #64748b);font-family:Manrope,sans-serif;font-size:13px;display:flex;justify-content:space-between;"><span>© 2026 Fieldwork Studio</span><span>hello@fieldwork.studio</span></footer>',
        ],
    ),
    # 36. Agency — Editorial
    _tpl(
        "starter-agency-editorial",
        "Agency — Editorial",
        "Big type, numbered services, a text-forward alternative to a project grid. Colors bind to whatever theme is applied.",
        "modern-agency-editorial",
        "var(--fc-bg, #ffffff)",
        ["Fraunces", "Inter"],
        [
            '<section style="padding:100px 48px 80px;background:var(--fc-bg, #ffffff);font-family:Fraunces,serif;"><div style="max-width:760px;"><h1 style="font-size:58px;line-height:1.15;margin:0 0 24px;font-weight:500;color:var(--fc-text, #0f172a);">Strategy first. Everything else follows from that.</h1><p style="font-family:Inter,sans-serif;font-size:17px;line-height:1.7;color:var(--fc-muted, #64748b);max-width:540px;margin:0;">We turn down work that starts with "we need a website" before anyone has answered "for whom, saying what." Ask us why.</p></div></section>',
            '<section style="padding:0 48px 96px;background:var(--fc-bg, #ffffff);font-family:Inter,sans-serif;"><div style="max-width:760px;">' + "".join([f'<div style="display:flex;gap:28px;padding:28px 0;border-top:1px solid var(--fc-border, #e2e8f0);"><div style="font-family:Fraunces,serif;font-size:15px;color:var(--fc-muted, #64748b);flex:none;width:32px;">{n}</div><div style="flex:1;"><h3 style="font-family:Fraunces,serif;font-size:22px;margin:0 0 8px;color:var(--fc-text, #0f172a);font-weight:500;">{t}</h3><p style="font-size:15px;line-height:1.65;color:var(--fc-muted, #64748b);margin:0;">{d}</p></div></div>' for n, t, d in [("01", "Positioning", "The one-sentence answer to why you, before any of it gets designed."), ("02", "Identity", "A visual system that survives contact with a hundred different use cases."), ("03", "Product", "The actual thing, built to the standard the brand now promises.")]]) + '</div></section>',
            '<footer style="padding:32px 48px;background:var(--fc-text, #0f172a);color:var(--fc-bg, #ffffff);opacity:0.85;font-family:Inter,sans-serif;font-size:13px;text-align:center;">Fieldwork Studio · est. 2019</footer>',
        ],
    ),

    # 37. E-commerce — Single Product
    _tpl(
        "starter-shop-product",
        "E-commerce — Single Product",
        "Product-focused landing page: hero, specs, and a clear buy CTA. Colors bind to whatever theme is applied.",
        "modern-shop-product",
        "var(--fc-bg, #ffffff)",
        ["Inter"],
        [
            '<section style="padding:80px 48px;background:var(--fc-bg, #ffffff);font-family:Inter,sans-serif;"><div style="max-width:1040px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center;"><div style="aspect-ratio:1;background:var(--fc-surface, #f8fafc);border:1px solid var(--fc-border, #e2e8f0);border-radius:16px;"></div><div><div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:var(--fc-muted, #64748b);margin-bottom:12px;">Field Series</div><h1 style="font-size:36px;margin:0 0 12px;font-weight:700;color:var(--fc-text, #0f172a);">The Field Jacket</h1><p style="font-size:15px;line-height:1.65;color:var(--fc-muted, #64748b);margin:0 0 20px;">Waxed cotton, brass hardware, made to be worn through a decade of weather rather than replaced after one season.</p><div style="font-size:26px;font-weight:700;color:var(--fc-text, #0f172a);margin-bottom:24px;">$228</div><button style="padding:15px 36px;background:var(--fc-primary, #2563eb);color:#fff;border:0;border-radius:8px;font-weight:600;font-size:15px;cursor:pointer;">Add to cart</button></div></div></section>',
            '<section style="padding:64px 48px;background:var(--fc-surface, #f8fafc);font-family:Inter,sans-serif;"><div style="max-width:1040px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);gap:24px;text-align:center;">' + "".join([f'<div><div style="font-size:13px;font-weight:600;color:var(--fc-text, #0f172a);margin-bottom:4px;">{t}</div><div style="font-size:12px;color:var(--fc-muted, #64748b);">{d}</div></div>' for t, d in [("Waxed cotton", "12oz, water-resistant"), ("Brass hardware", "YKK zip, solid buttons"), ("Made to order", "Ships in 5-7 days"), ("Free returns", "60-day window")]]) + '</div></section>',
            '<footer style="padding:32px 48px;background:var(--fc-bg, #ffffff);border-top:1px solid var(--fc-border, #e2e8f0);color:var(--fc-muted, #64748b);font-family:Inter,sans-serif;font-size:13px;text-align:center;">© 2026 Field Supply Co.</footer>',
        ],
    ),
    # 38. E-commerce — Shop Grid
    _tpl(
        "starter-shop-grid",
        "E-commerce — Shop Grid",
        "Catalog-style storefront with a product grid. Colors bind to whatever theme is applied.",
        "modern-shop-grid",
        "var(--fc-bg, #ffffff)",
        ["Inter"],
        [
            '<section style="padding:64px 48px 40px;background:var(--fc-bg, #ffffff);font-family:Inter,sans-serif;text-align:center;"><h1 style="font-size:34px;margin:0 0 10px;font-weight:700;color:var(--fc-text, #0f172a);">New arrivals</h1><p style="font-size:15px;color:var(--fc-muted, #64748b);margin:0;">Small-batch goods, restocked every Friday.</p></section>',
            '<section style="padding:0 48px 80px;background:var(--fc-bg, #ffffff);font-family:Inter,sans-serif;"><div style="max-width:1040px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);gap:20px;">' + "".join([f'<div><div style="aspect-ratio:1;background:var(--fc-surface, #f8fafc);border:1px solid var(--fc-border, #e2e8f0);border-radius:10px;margin-bottom:10px;"></div><div style="font-size:13px;font-weight:600;color:var(--fc-text, #0f172a);">{t}</div><div style="font-size:13px;color:var(--fc-muted, #64748b);">{p}</div></div>' for t, p in [("Ceramic mug", "$24"), ("Linen napkin set", "$38"), ("Oak cutting board", "$56"), ("Wool throw", "$92"), ("Cast iron pan", "$68"), ("Glass carafe", "$32"), ("Enamel bowl", "$18"), ("Bread box", "$74")]]) + '</div></section>',
            '<footer style="padding:32px 48px;background:var(--fc-surface, #f8fafc);border-top:1px solid var(--fc-border, #e2e8f0);color:var(--fc-muted, #64748b);font-family:Inter,sans-serif;font-size:13px;text-align:center;">© 2026 Fieldstone General</footer>',
        ],
    ),

    # 39. Portfolio — Minimal Personal
    _tpl(
        "starter-portfolio-minimal",
        "Portfolio — Minimal Personal",
        "A quiet, centered personal site — name, role, selected work. Colors bind to whatever theme is applied.",
        "modern-portfolio-minimal",
        "var(--fc-bg, #ffffff)",
        ["Inter"],
        [
            '<section style="min-height:60vh;display:flex;flex-direction:column;justify-content:center;padding:80px 48px;background:var(--fc-bg, #ffffff);font-family:Inter,sans-serif;text-align:center;"><div style="width:64px;height:64px;border-radius:999px;background:var(--fc-surface, #f8fafc);border:1px solid var(--fc-border, #e2e8f0);margin:0 auto 24px;"></div><h1 style="font-size:30px;margin:0 0 6px;font-weight:700;color:var(--fc-text, #0f172a);">Maren Iida</h1><p style="font-size:16px;color:var(--fc-muted, #64748b);margin:0 0 20px;">Product designer, currently at Fieldnote</p><div style="display:flex;gap:16px;justify-content:center;font-size:13px;"><a href="#" style="color:var(--fc-primary, #2563eb);text-decoration:none;">Work</a><a href="#" style="color:var(--fc-primary, #2563eb);text-decoration:none;">Writing</a><a href="#" style="color:var(--fc-primary, #2563eb);text-decoration:none;">Contact</a></div></section>',
            '<section style="padding:0 48px 88px;background:var(--fc-bg, #ffffff);font-family:Inter,sans-serif;"><div style="max-width:600px;margin:0 auto;">' + "".join([f'<div style="display:flex;justify-content:space-between;align-items:baseline;padding:18px 0;border-bottom:1px solid var(--fc-border, #e2e8f0);"><div><div style="font-size:15px;font-weight:600;color:var(--fc-text, #0f172a);">{t}</div><div style="font-size:13px;color:var(--fc-muted, #64748b);">{d}</div></div><div style="font-size:13px;color:var(--fc-muted, #64748b);">{y}</div></div>' for t, d, y in [("Fieldnote", "Design system + onboarding redesign", "2025"), ("Verano Health", "Patient portal, ground up", "2024"), ("Passage Books", "Freelance — full site redesign", "2023")]]) + '</div></section>',
            '<footer style="padding:32px 48px;background:var(--fc-surface, #f8fafc);color:var(--fc-muted, #64748b);font-family:Inter,sans-serif;font-size:13px;text-align:center;">maren@example.com</footer>',
        ],
    ),
    # 40. Portfolio — Creative Grid
    _tpl(
        "starter-portfolio-creative",
        "Portfolio — Creative Grid",
        "Image-forward portfolio grid for photographers, illustrators, and visual designers. Colors bind to whatever theme is applied.",
        "modern-portfolio-creative",
        "var(--fc-text, #0f172a)",
        ["Manrope"],
        [
            '<section style="padding:72px 48px 40px;background:var(--fc-text, #0f172a);font-family:Manrope,sans-serif;color:var(--fc-bg, #ffffff);"><h1 style="font-size:38px;margin:0 0 8px;font-weight:700;">Devon Cole</h1><p style="font-size:15px;opacity:0.65;margin:0;">Illustration & motion, based in Portland</p></section>',
            '<section style="padding:0 48px 80px;background:var(--fc-text, #0f172a);font-family:Manrope,sans-serif;"><div style="max-width:1040px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:14px;">' + "".join([f'<div style="aspect-ratio:{r};background:var(--fc-surface, #f8fafc);opacity:0.9;border-radius:8px;"></div>' for r in ["1/1", "3/4", "1/1", "4/3", "1/1", "3/4"]]) + '</div></section>',
            '<footer style="padding:32px 48px;background:var(--fc-text, #0f172a);color:var(--fc-bg, #ffffff);opacity:0.85;font-family:Manrope,sans-serif;font-size:13px;text-align:center;">hello@devoncole.work</footer>',
        ],
    ),

    # 41. Restaurant — Modern Bistro
    _tpl(
        "starter-restaurant-bistro",
        "Restaurant — Modern Bistro",
        "Menu-forward restaurant site with a reservation CTA. Colors bind to whatever theme is applied.",
        "modern-restaurant-bistro",
        "var(--fc-bg, #ffffff)",
        ["Fraunces", "Inter"],
        [
            '<section style="padding:100px 48px 72px;background:var(--fc-bg, #ffffff);font-family:Fraunces,serif;text-align:center;"><div style="font-family:Inter,sans-serif;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;color:var(--fc-muted, #64748b);margin-bottom:16px;">Est. 2019 · Neighborhood bistro</div><h1 style="font-size:52px;margin:0 0 20px;font-weight:500;color:var(--fc-text, #0f172a);">Seasonal, simple, cooked properly.</h1><a href="#" style="display:inline-block;padding:14px 30px;background:var(--fc-primary, #2563eb);color:#fff;border-radius:6px;text-decoration:none;font-family:Inter,sans-serif;font-weight:600;font-size:14px;">Reserve a table</a></section>',
            '<section style="padding:64px 48px 88px;background:var(--fc-surface, #f8fafc);font-family:Fraunces,serif;"><div style="max-width:600px;margin:0 auto;"><h2 style="font-size:22px;text-align:center;margin:0 0 28px;font-weight:500;color:var(--fc-text, #0f172a);">From tonight\'s menu</h2>' + "".join([f'<div style="display:flex;justify-content:space-between;align-items:baseline;padding:14px 0;border-bottom:1px dashed var(--fc-border, #e2e8f0);"><div><div style="font-size:16px;color:var(--fc-text, #0f172a);">{t}</div><div style="font-family:Inter,sans-serif;font-size:12px;color:var(--fc-muted, #64748b);">{d}</div></div><div style="font-size:15px;color:var(--fc-text, #0f172a);">{p}</div></div>' for t, d, p in [("Roasted beet salad", "whipped feta, pistachio, mint", "$16"), ("Pan-seared trout", "brown butter, capers, charred lemon", "$29"), ("Brown butter tart", "toasted almond, sea salt", "$12")]]) + '</div></section>',
            '<footer style="padding:32px 48px;background:var(--fc-bg, #ffffff);border-top:1px solid var(--fc-border, #e2e8f0);color:var(--fc-muted, #64748b);font-family:Inter,sans-serif;font-size:13px;text-align:center;">Tue-Sun 5pm-10pm · 214 Alder St · (503) 555-0148</footer>',
        ],
    ),
    # 42. Service Business — Studio/Salon/Clinic
    _tpl(
        "starter-service-business",
        "Service Business",
        "Booking-forward layout for a salon, studio, or clinic — services list with price and duration. Colors bind to whatever theme is applied.",
        "modern-service-business",
        "var(--fc-bg, #ffffff)",
        ["Inter"],
        [
            '<section style="padding:96px 48px 72px;background:var(--fc-bg, #ffffff);font-family:Inter,sans-serif;text-align:center;"><h1 style="font-size:42px;margin:0 0 14px;font-weight:700;color:var(--fc-text, #0f172a);">Book your next session in under a minute.</h1><p style="font-size:16px;color:var(--fc-muted, #64748b);margin:0 0 28px;">Same-week availability, most Saturdays included.</p><a href="#" style="display:inline-block;padding:14px 30px;background:var(--fc-primary, #2563eb);color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Book now</a></section>',
            '<section style="padding:0 48px 88px;background:var(--fc-bg, #ffffff);font-family:Inter,sans-serif;"><div style="max-width:640px;margin:0 auto;">' + "".join([f'<div style="display:flex;justify-content:space-between;align-items:center;padding:20px 0;border-bottom:1px solid var(--fc-border, #e2e8f0);"><div><div style="font-size:16px;font-weight:600;color:var(--fc-text, #0f172a);">{t}</div><div style="font-size:13px;color:var(--fc-muted, #64748b);">{d}</div></div><div style="font-size:16px;color:var(--fc-text, #0f172a);">{p}</div></div>' for t, d, p in [("Initial consultation", "45 min", "$65"), ("Standard session", "60 min", "$95"), ("Extended session", "90 min", "$135"), ("Follow-up", "30 min", "$45")]]) + '</div></section>',
            '<footer style="padding:32px 48px;background:var(--fc-surface, #f8fafc);color:var(--fc-muted, #64748b);font-family:Inter,sans-serif;font-size:13px;text-align:center;">Mon-Fri 9am-6pm, Sat 10am-2pm · 88 Harbor Ave</footer>',
        ],
    ),

    # 43. MySpace Throwback — the platform every other 2000s journal
    # template has been standing in the shadow of: dark profile chrome,
    # a Top 8, an autoplay-styled music banner, and comments.
    _tpl(
        "starter-myspace-throwback",
        "MySpace Throwback",
        "A faithful mid-2000s MySpace-style profile — Top 8, autoplay music banner, About Me box, and working comments.",
        "myspace-throwback",
        "#000000",
        ["Arial", "Verdana"],
        [
            '<header style="background:#000000;font-family:Arial,sans-serif;"><div style="background:linear-gradient(180deg,#003399,#001a66);padding:10px 24px;display:flex;align-items:center;justify-content:space-between;"><div style="color:#fff;font-size:22px;font-weight:bold;font-style:italic;">myspace.</div><nav style="display:flex;gap:14px;font-size:11px;">' + "".join([f'<a href="#" style="color:#cfe0ff;text-decoration:none;">{l}</a>' for l in ["Home", "Browse", "Search", "Invite", "Mail", "Blog", "Favorites"]]) + '</nav></div><div style="background:#001a66;color:#9db8e8;font-size:10px;padding:4px 24px;">You have 3 new friend requests and 12 new comments.</div></header>',
            '<section style="padding:20px;background:#000000;font-family:Arial,sans-serif;"><div style="max-width:1000px;margin:0 auto;display:grid;grid-template-columns:200px 1fr;gap:16px;"><div style="display:flex;flex-direction:column;gap:12px;"><div style="background:#0a0a1a;border:2px solid #336699;border-radius:4px;padding:10px;text-align:center;"><div style="width:170px;height:170px;background:linear-gradient(135deg,#003399,#6a0dad);border-radius:2px;margin:0 auto 8px;"></div><div style="color:#fff;font-size:15px;font-weight:bold;">xxjess_marievintagexx</div><div style="color:#88aadd;font-size:10px;margin-top:2px;">19 years old, Ohio, United States</div><div style="color:#88aadd;font-size:10px;margin-top:6px;">Last Login: Today</div></div><div style="background:#0a0a1a;border:2px solid #336699;border-radius:4px;padding:10px;color:#cfe0ff;font-size:10px;"><div style="color:#fff;font-weight:bold;margin-bottom:4px;">Mood: <span style="font-weight:normal;">bored</span></div><div>Status: In a relationship</div></div></div><div><div style="background:#0a0a1a;border:2px solid #336699;border-radius:4px;padding:14px;margin-bottom:12px;"><div style="color:#fff;font-weight:bold;font-size:13px;margin-bottom:8px;border-bottom:1px solid #336699;padding-bottom:6px;">xxjess_marievintagexx\'s Interests</div><div style="color:#cfe0ff;font-size:11px;line-height:1.7;"><strong style="color:#fff;">General:</strong> shows, thrifting, my dog<br><strong style="color:#fff;">Music:</strong> Fall Out Boy, Paramore, The Killers<br><strong style="color:#fff;">Movies:</strong> Mean Girls, Donnie Darko</div></div><div style="background:linear-gradient(180deg,#1a1a2e,#0a0a1a);border:2px solid #6a0dad;border-radius:4px;padding:12px;display:flex;align-items:center;gap:10px;"><div style="width:36px;height:36px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#888,#000);flex:none;"></div><div style="flex:1;"><div style="color:#c9a3ff;font-size:10px;">♫ Now Playing</div><div style="color:#fff;font-size:12px;">Sugar, We\'re Goin Down — Fall Out Boy</div></div><div style="color:#c9a3ff;font-size:16px;">▶</div></div></div></div></section>',
            '<section style="padding:0 20px 20px;background:#000000;font-family:Arial,sans-serif;"><div style="max-width:1000px;margin:0 auto;background:#0a0a1a;border:2px solid #336699;border-radius:4px;padding:14px;"><div style="color:#fff;font-weight:bold;font-size:13px;margin-bottom:10px;border-bottom:1px solid #336699;padding-bottom:6px;">xxjess_marievintagexx\'s Top 8</div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">' + "".join([f'<div style="text-align:center;"><div style="width:100%;aspect-ratio:1;background:linear-gradient(135deg,{c1},{c2});border-radius:2px;border:1px solid #336699;"></div><div style="color:#9db8e8;font-size:10px;margin-top:4px;">{n}</div></div>' for c1, c2, n in [("#ff6b9d", "#c44569", "hannah<3"), ("#4ecdc4", "#1a8a82", "mike_b"), ("#ffd93d", "#c9a000", "sophie.xo"), ("#a29bfe", "#6c5ce7", "tyler"), ("#ff9a3c", "#d9720a", "kayla__"), ("#55efc4", "#00997a", "brandon"), ("#fd79a8", "#c0396f", "emmaaa"), ("#74b9ff", "#3a7fd9", "chris_r")]]) + '</div></div></section>',
            _comments_section(
                [
                    {"id": 1, "author": "hannah<3", "date": "3 hours ago", "text": "omg your top 8 changed again lol love you though"},
                    {"id": 2, "author": "mike_b", "date": "yesterday", "text": "new layout is fire, hmu this weekend"},
                ],
                wrap_style="font-family:Arial,sans-serif;padding:0 20px 24px;background:#000000;",
                heading_style="color:#fff;font-size:13px;font-weight:bold;border-bottom:1px solid #336699;padding-bottom:6px;",
            ),
            '<footer style="padding:16px 24px;background:#001a66;color:#88aadd;font-family:Arial,sans-serif;font-size:10px;text-align:center;">myspace throwback · a place for friends</footer>',
        ],
    ),

    # 44. GeoCities / Angelfire Personal Homepage — maximalist late-90s
    # chaos: tiled starfield, marquee ticker, hit counter, and a "best
    # viewed in" badge. The loud, unpolished counterpart to the
    # relatively put-together Xanga/LiveJournal/MySpace journal templates.
    _tpl(
        "starter-geocities-homepage",
        "GeoCities Personal Homepage",
        "Maximalist late-90s chaos — tiled starfield, scrolling marquee, hit counter, and a guestbook. The loud cousin of the journal throwbacks.",
        "geocities-homepage",
        "#000033",
        ["Comic Sans MS", "Courier New"],
        [
            '<style>@keyframes wd-marquee{0%{transform:translateX(100%);}100%{transform:translateX(-100%);}}</style>'
            '<header style="background:#000033 url(\'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22%3E%3Ccircle cx=%225%22 cy=%228%22 r=%221%22 fill=%22white%22/%3E%3Ccircle cx=%2222%22 cy=%2220%22 r=%221%22 fill=%22white%22/%3E%3Ccircle cx=%2233%22 cy=%2233%22 r=%221%22 fill=%22white%22/%3E%3Ccircle cx=%2212%22 cy=%2230%22 r=%220.5%22 fill=%22white%22/%3E%3C/svg%3E\') repeat;padding:32px 20px;text-align:center;font-family:\'Comic Sans MS\',cursive;"><h1 style="font-size:34px;margin:0 0 6px;background:linear-gradient(90deg,#ff0000,#ff9900,#ffff00,#00ff00,#0099ff,#6633ff);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:2px 2px 0 rgba(0,0,0,.3);">*~*Welcome To My Homepage*~*</h1><p style="color:#ffff00;font-size:14px;margin:0 0 12px;">☆☆☆ under construction forever, thanks for stopping by!! ☆☆☆</p><div style="display:inline-block;background:#000;border:2px solid #ffff00;padding:4px 12px;color:#00ff00;font-family:\'Courier New\',monospace;font-size:12px;">You are visitor number: <strong>004217</strong></div></header>',
            '<div style="background:#ffff00;color:#000033;font-family:\'Courier New\',monospace;font-size:13px;font-weight:bold;padding:6px 0;overflow:hidden;white-space:nowrap;border-top:2px dashed #000033;border-bottom:2px dashed #000033;"><div style="display:inline-block;animation:wd-marquee 16s linear infinite;">★ SIGN MY GUESTBOOK ★ BEST VIEWED IN NETSCAPE NAVIGATOR AT 800x600 ★ DO NOT STEAL MY GRAPHICS ★ EMAIL ME ANYTIME ★</div></div>',
            '<section style="padding:36px 24px;background:#000033;font-family:\'Comic Sans MS\',cursive;color:#ccccff;"><div style="max-width:640px;margin:0 auto;background:rgba(0,0,50,.6);border:3px ridge #6699ff;border-radius:6px;padding:20px;"><h2 style="color:#ffff00;font-size:20px;margin:0 0 12px;">About Me!</h2><p style="font-size:14px;line-height:1.7;margin:0 0 12px;">Hiya!! Welcome to my corner of the web. This site is all about anime, my cats, and really good MIDI files. Feel free to sign my guestbook before you leave!!</p><div style="display:flex;gap:6px;flex-wrap:wrap;">' + "".join([f'<div style="width:88px;height:31px;background:{c};border:1px solid #6699ff;border-radius:2px;color:#000;font-size:9px;display:flex;align-items:center;justify-content:center;text-align:center;">{t}</div>' for c, t in [("#ffcc00", "Under Construction"), ("#00ffcc", "Powered by Notepad"), ("#ff99cc", "100% Anime Fan")]]) + '</div></div></section>',
            _comments_section(
                [
                    {"id": 1, "author": "starlight_wolf", "date": "2 days ago", "text": "signed!! love the new background lol"},
                    {"id": 2, "author": "webmaster_kai", "date": "1 week ago", "text": "your site loaded so fast, nice work on the graphics"},
                ],
                wrap_style="font-family:'Comic Sans MS',cursive;padding:0 24px 40px;background:#000033;",
                heading_style="color:#ffff00;font-size:16px;",
            ),
            '<footer style="padding:16px 24px;background:#000000;color:#6699ff;font-family:\'Courier New\',monospace;font-size:10px;text-align:center;">this page last updated never · © 1999-2026</footer>',
        ],
    ),

    # 45. Web Forum Throwback — classic phpBB/vBulletin-style thread view:
    # per-post left rail (avatar, rank, join date, post count) beside the
    # post body, exactly the layout every early-2000s forum shared. The
    # reply box reuses the same working comment widget as the other
    # throwbacks, just relabeled — a forum reply IS a comment.
    _tpl(
        "starter-forum-throwback",
        "Web Forum Throwback",
        "A classic phpBB/vBulletin-style forum thread — per-post user rail, quote/edit icons, and a working reply box.",
        "forum-throwback",
        "#e8ecf1",
        ["Verdana", "Tahoma"],
        [
            '<header style="font-family:Verdana,sans-serif;"><div style="background:linear-gradient(180deg,#3b6ea5,#1d3d63);padding:14px 24px;"><div style="color:#fff;font-size:20px;font-weight:bold;">FieldworkForums.net</div><div style="color:#aecbe8;font-size:11px;margin-top:2px;">the only forum you will ever need, established 2003</div></div><div style="background:#dde6f0;border-bottom:1px solid #b8c8dc;padding:6px 24px;font-size:11px;color:#3b6ea5;">Forum Index » General Discussion » <strong>Anyone else still using this in 2026?</strong></div></header>',
            '<section style="padding:16px 24px;background:#e8ecf1;font-family:Verdana,sans-serif;"><div style="max-width:900px;margin:0 auto;border:1px solid #b8c8dc;border-radius:3px;overflow:hidden;">'
            + "".join([
                f'<div style="display:grid;grid-template-columns:150px 1fr;background:{bg};border-bottom:1px solid #b8c8dc;">'
                f'<div style="padding:12px;border-right:1px solid #b8c8dc;text-align:center;background:#f4f7fb;">'
                f'<div style="width:64px;height:64px;background:linear-gradient(135deg,{c1},{c2});border:1px solid #b8c8dc;border-radius:3px;margin:0 auto 8px;"></div>'
                f'<div style="font-size:12px;font-weight:bold;color:{namecolor};">{name}</div>'
                f'<div style="font-size:10px;color:#7a8aa0;margin-top:2px;">{rank}</div>'
                f'<div style="font-size:9px;color:#9aabc0;margin-top:8px;">Joined: {joined}<br>Posts: {posts}</div>'
                f'</div>'
                f'<div style="padding:12px 16px;">'
                f'<div style="display:flex;justify-content:space-between;font-size:10px;color:#7a8aa0;border-bottom:1px dotted #cdd8e6;padding-bottom:6px;margin-bottom:8px;"><span>Posted: {when}</span><span>Post #{n} <a href="#" style="color:#3b6ea5;">Quote</a></span></div>'
                f'<div style="font-size:13px;line-height:1.65;color:#28303d;">{body}</div>'
                f'<div style="font-size:10px;color:#9aabc0;font-style:italic;margin-top:12px;border-top:1px dotted #cdd8e6;padding-top:6px;">{sig}</div>'
                f'</div></div>'
                for bg, c1, c2, namecolor, name, rank, joined, posts, when, n, body, sig in [
                    ("#ffffff", "#3b6ea5", "#1d3d63", "#1d3d63", "forumveteran99", "Senior Member", "Mar 2004", "3,204", "Today, 9:14 AM", 1,
                     "Honestly did not expect this thread to still be active but here we are. Anyone got the old install files still archived somewhere?",
                     "\"The mods are asleep, post exploit threads\""),
                    ("#f4f7fb", "#c44569", "#8a2b46", "#8a2b46", "lurker_since_02", "Member", "Jul 2002", "412", "Today, 9:41 AM", 2,
                     "I have a backup from like 2011 on an external drive somewhere. Give me a day to dig it out of the closet.",
                     ""),
                    ("#ffffff", "#2e8b57", "#1c5636", "#1c5636", "mod_sarah", "Moderator", "Jan 2003", "8,910", "Today, 10:02 AM", 3,
                     "Pinning this thread. Please keep the nostalgia coming, just no dead links per rule 4.",
                     "Forum rules: fieldworkforums.net/rules"),
                ]
            ])
            + '</div></section>',
            _comments_section(
                [],
                wrap_style="font-family:Verdana,sans-serif;padding:0 24px 40px;background:#e8ecf1;",
                heading_style="font-size:13px;font-weight:bold;color:#1d3d63;",
            ),
            '<footer style="padding:14px 24px;background:#1d3d63;color:#aecbe8;font-family:Verdana,sans-serif;font-size:10px;text-align:center;">All times are GMT. Page generated in 0.041 seconds.</footer>',
        ],
    ),
]
