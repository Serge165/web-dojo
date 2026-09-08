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


def _page(prefix: str, name: str, canvas_bg: str, fonts: List[str], html_blocks: List[str], seo: Dict[str, Any] = None, page_id: str = None, slug: str = "index") -> Dict[str, Any]:
    return {
        "id": page_id or f"{prefix}-home",
        "name": name,
        "slug": slug,
        "status": "draft",
        "seo": seo or {},
        "elements": [{"id": _uid(prefix, i), "html": h} for i, h in enumerate(html_blocks)],
        "head_html": "",
        "canvas_bg": canvas_bg,
        "fonts": fonts,
    }


def _tpl(id_: str, name: str, description: str, aesthetic: str, canvas_bg: str, fonts: List[str], html_blocks: List[str], pages: List[Dict[str, Any]] = None) -> Dict[str, Any]:
    # Template auto-fill (scoped): starters already carry a hand-written
    # name + description for the picker UI — reuse that copy as the
    # starting SEO title/description instead of leaving it blank, so a
    # user who starts from a template gets a real (if generic) starting
    # point rather than an empty stub. They're expected to edit it, same
    # as the placeholder "Home" page name. No keywords: Google has
    # ignored the meta-keywords tag since ~2009, so seeding it with the
    # aesthetic slug would just be noise.
    seo = {"title": name, "description": description}
    # pages override: lets a multi-page starter (e.g. _esports_pages) build
    # its own [_page(...), ...] list and reuse this dict-assembly instead of
    # duplicating it. Single-page starters never pass this.
    resolved_pages = pages if pages is not None else [_page(id_, "Home", canvas_bg, fonts, html_blocks, seo=seo)]
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
            "pages": resolved_pages,
            "active_page_id": resolved_pages[0]["id"],
        },
        "created_at": datetime.now(timezone.utc).isoformat(),
    }


def _simple_nav(font: str, brand: str, links: List[tuple], cta: tuple = None,
                 bg: str = "var(--fc-bg, #ffffff)", text: str = "var(--fc-text, #0f172a)",
                 muted: str = "var(--fc-muted, #64748b)", border: str = "var(--fc-border, #e2e8f0)",
                 primary: str = "var(--fc-primary, #2563eb)") -> str:
    # Shared shape for the 10 "modern content-type" starters below (SaaS,
    # Agency, Shop, Portfolio, Restaurant, Service) — each was a single
    # scrolling page with no way to reach the new sub-pages added this
    # session, so every one of them now gets this same brand+links(+CTA)
    # header. Font/copy/tokens are the only things that vary per template.
    link_html = "".join(f'<a href="{href}" style="color:{muted};text-decoration:none;font-size:13px;font-weight:500;">{label}</a>' for label, href in links)
    cta_html = f'<a href="{cta[1]}" style="padding:9px 18px;background:{primary};color:#fff;border-radius:6px;text-decoration:none;font-weight:600;font-size:13px;">{cta[0]}</a>' if cta else ""
    return (
        f'<header style="padding:20px 48px;background:{bg};border-bottom:1px solid {border};font-family:{font},sans-serif;display:flex;align-items:center;justify-content:space-between;">'
        f'<a href="index.html" style="font-size:17px;font-weight:700;color:{text};text-decoration:none;">{brand}</a>'
        f'<nav style="display:flex;align-items:center;gap:26px;">{link_html}{cta_html}</nav></header>'
    )


def _esports_sections(bg: str, surface: str, text: str, muted: str, accent: str, ink: str, border: str) -> Dict[str, str]:
    # One esports org's sections, recolored — nav w/ live badge + real
    # cross-page links, hero, 5-up roster, fixture ticker, standings table,
    # stat strip, sponsor row, shop (real data-wd-add buttons — same
    # markup commerce.js's cm-product-card uses, so Web Dojo's existing
    # cart runtime wires up to them once the site owner adds it from the
    # Shop tab, exactly like any other product-card block), footer. Only
    # the seven palette tokens change between calls; content is identical.
    nav = (
        f'<header style="background:{bg};font-family:Manrope,sans-serif;padding:16px 40px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid {border};">'
        f'<a href="index.html" style="font-size:20px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:{text};text-decoration:none;">Void <span style="color:{accent};">Syndicate</span></a>'
        '<nav style="display:flex;align-items:center;gap:28px;">'
        + "".join([f'<a href="{href}" style="color:{muted};text-decoration:none;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;">{label}</a>' for label, href in [("Roster", "roster.html"), ("Matches", "matches.html"), ("News", "news.html"), ("Shop", "shop.html"), ("About", "about.html")]])
        + '<span style="display:flex;align-items:center;gap:6px;background:rgba(255,59,87,.12);border:1px solid #ff3b57;color:#ff3b57;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;padding:5px 10px;border-radius:999px;"><span style="width:6px;height:6px;border-radius:999px;background:#ff3b57;"></span>Live</span>'
        '</nav></header>'
    )

    hero = (
        f'<section style="background:{bg};font-family:Manrope,sans-serif;padding:96px 40px 88px;"><div style="max-width:720px;">'
        f'<div style="color:{accent};font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;border-left:3px solid {accent};padding-left:10px;margin-bottom:18px;">Global Esports Division</div>'
        f'<h1 style="font-size:clamp(40px,6vw,78px);line-height:.98;letter-spacing:-.01em;text-transform:uppercase;font-weight:800;margin:0 0 22px;color:{text};">Prepare for <span style="-webkit-text-stroke:2px {text};color:transparent;">liftoff.</span><br>Prepare to lose.</h1>'
        f'<p style="color:{muted};font-size:16px;line-height:1.65;max-width:520px;margin:0 0 34px;">Operating from the outer rings of competitive bracket dominance — we harvest salt, secure objectives, and rewrite the meta.</p>'
        '<div style="display:flex;gap:14px;">'
        f'<a href="matches.html" style="background:{accent};color:{ink};font-weight:800;font-size:13px;text-transform:uppercase;letter-spacing:.04em;padding:14px 28px;border-radius:6px;text-decoration:none;">Schedule</a>'
        f'<a href="roster.html" style="border:1px solid {border};color:{text};font-weight:800;font-size:13px;text-transform:uppercase;letter-spacing:.04em;padding:14px 28px;border-radius:6px;text-decoration:none;">View roster</a>'
        '</div></div></section>'
    )

    roster = (
        f'<section style="background:{bg};font-family:Manrope,sans-serif;padding:0 40px 88px;">'
        f'<div style="display:flex;align-items:center;gap:16px;margin-bottom:28px;"><h2 style="font-size:26px;font-weight:800;text-transform:uppercase;letter-spacing:-.01em;color:{text};margin:0;">Active roster</h2><div style="flex:1;height:1px;background:{border};"></div></div>'
        '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:14px;">'
        + "".join([
            f'<div style="background:{surface};border:1px solid {border};border-radius:12px;padding:20px 14px;text-align:center;">'
            f'<div style="width:56px;height:56px;border-radius:999px;background:linear-gradient(135deg,{accent},{surface});margin:0 auto 14px;"></div>'
            f'<div style="font-size:10px;font-weight:800;color:{accent};text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">{role}</div>'
            f'<div style="font-weight:800;color:{text};font-size:15px;margin-bottom:10px;">{n}</div>'
            f'<div style="display:flex;justify-content:space-between;font-size:11px;color:{muted};border-top:1px solid {border};padding-top:8px;"><span>K/D</span><span style="color:{text};font-weight:700;">{kd}</span></div></div>'
            for role, n, kd in [("IGL / Captain", "Wraithe", "1.48"), ("Entry Fragger", "Pulsegrind", "1.62"), ("Support Anchor", "Nullstatic", "1.21"), ("Sniper / AWPer", "Zerogaze", "1.75"), ("Flex", "Driftcore", "1.33")]
        ]) + '</div></section>'
    )

    fixtures = (
        f'<section style="background:{bg};font-family:Manrope,sans-serif;padding:0 40px 88px;">'
        f'<div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;"><h2 style="font-size:26px;font-weight:800;text-transform:uppercase;letter-spacing:-.01em;color:{text};margin:0;">Fixtures</h2><div style="flex:1;height:1px;background:{border};"></div></div>'
        '<div style="display:flex;flex-direction:column;gap:10px;">'
        + "".join([
            f'<div style="background:{surface};border:1px solid {border};border-radius:10px;padding:16px 22px;display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;">'
            f'<div style="font-weight:800;font-size:15px;color:{text};">{teams}</div>'
            f'<div style="color:{muted};font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;">{meta}</div></div>'
            for teams, meta in [
                ("Void Syndicate vs Rocket Fuel", "VCT Playoffs · BO3 · Fri 19:00 CET"),
                ("Void Syndicate vs Quantum Phantoms", "Group Stage · Sun 16:00 CET"),
                (f'Void Syndicate <span style="color:{accent};">2–0</span> Nullpoint', "Group Stage · Final"),
            ]
        ]) + '</div></section>'
    )

    standings = (
        f'<section style="background:{bg};font-family:Manrope,sans-serif;padding:0 40px 88px;">'
        f'<div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;"><h2 style="font-size:26px;font-weight:800;text-transform:uppercase;letter-spacing:-.01em;color:{text};margin:0;">Standings</h2><div style="flex:1;height:1px;background:{border};"></div></div>'
        f'<div style="border:1px solid {border};border-radius:12px;overflow:hidden;">'
        f'<div style="display:grid;grid-template-columns:56px 1fr 100px 100px;padding:12px 16px;background:{surface};font-size:11px;color:{muted};text-transform:uppercase;letter-spacing:.06em;"><div>#</div><div>Team</div><div>Wins</div><div>Points</div></div>'
        + "".join([
            f'<div style="display:grid;grid-template-columns:56px 1fr 100px 100px;padding:12px 16px;align-items:center;background:{bg if i % 2 == 0 else surface};border-top:1px solid {border};">'
            f'<div style="font-weight:800;color:{accent if i == 0 else muted};">{rank}</div>'
            f'<div style="color:{text};font-weight:600;font-size:14px;">{team}</div>'
            f'<div style="color:{muted};font-size:13px;">{wins}</div>'
            f'<div style="color:{accent};font-weight:700;font-size:13px;">{pts}</div></div>'
            for i, (rank, team, wins, pts) in enumerate([
                ("1", "Void Syndicate", "14", "842"),
                ("2", "Rocket Fuel", "12", "790"),
                ("3", "Quantum Phantoms", "11", "755"),
                ("4", "Nullpoint", "9", "680"),
                ("5", "Drift Union", "8", "611"),
            ])
        ]) + '</div></section>'
    )

    stats = (
        f'<section style="background:{surface};font-family:Manrope,sans-serif;padding:44px 40px;border-top:1px solid {border};border-bottom:1px solid {border};">'
        '<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:24px;max-width:1000px;margin:0 auto;">'
        + "".join([f'<div style="text-align:center;flex:1;min-width:120px;"><div style="font-size:26px;font-weight:800;color:{accent};">{v}</div><div style="font-size:11px;color:{muted};text-transform:uppercase;letter-spacing:.06em;margin-top:4px;">{l}</div></div>' for v, l in [("#4", "Global rank"), ("68%", "Win rate"), ("$412K", "Prize winnings"), ("210K+", "Followers")]])
        + '</div></section>'
    )

    sponsors = (
        f'<section style="background:{bg};font-family:Manrope,sans-serif;padding:56px 40px;text-align:center;">'
        f'<div style="font-size:11px;color:{muted};text-transform:uppercase;letter-spacing:.1em;margin-bottom:20px;">Backed by</div>'
        '<div style="display:flex;justify-content:center;gap:36px;flex-wrap:wrap;opacity:.75;">'
        + "".join([f'<div style="font-weight:800;letter-spacing:.03em;color:{muted};font-size:14px;">{s}</div>' for s in ["APEXGEAR", "NOVACOLA", "RIFTBANK", "IONWEAR"]])
        + '</div></section>'
    )

    shop = (
        f'<section style="background:{bg};font-family:Manrope,sans-serif;padding:64px 40px 88px;">'
        f'<div style="margin-bottom:28px;"><h2 style="font-size:26px;font-weight:800;text-transform:uppercase;letter-spacing:-.01em;color:{text};margin:0 0 6px;">Shop</h2><p style="color:{muted};font-size:13px;margin:0;">Official merch. Add the cart from the Shop tab to make these buttons live.</p></div>'
        '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;">'
        + "".join([
            f'<div style="background:{surface};border:1px solid {border};border-radius:12px;overflow:hidden;">'
            f'<div style="aspect-ratio:1;background:linear-gradient(160deg,{border},{surface});"></div>'
            f'<div style="padding:14px;">'
            f'<div style="font-size:13px;font-weight:700;color:{text};margin-bottom:2px;">{title}</div>'
            f'<div style="font-size:13px;color:{muted};margin-bottom:10px;">${price}</div>'
            f'<button type="button" data-wd-add data-wd-id="{pid}" data-wd-name="{title}" data-wd-price="{price}" data-wd-cur="usd" style="width:100%;padding:9px;background:{accent};color:{ink};border:none;border-radius:6px;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;cursor:pointer;">Add to cart</button>'
            '</div></div>'
            for pid, title, price in [("vs-jersey", "Home Jersey", "89"), ("vs-cap", "Snapback Cap", "34"), ("vs-hoodie", "Roster Hoodie", "68"), ("vs-mug", "Travel Mug", "22")]
        ]) + '</div></section>'
    )

    footer = f'<footer style="background:{surface};border-top:1px solid {border};padding:26px 40px;color:{muted};font-family:Manrope,sans-serif;font-size:12px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;"><span>© 2026 Void Syndicate. All rights reserved.</span><span>Built for high-velocity competitive dominance.</span></footer>'

    # Real esports org sites (Cloud9, FaZe, G2, 100T) all carry a content/
    # news feed and an org story — matches.html covers schedule/results,
    # but nothing here previously covered "what happened" or "who we are".
    news = (
        f'<section style="background:{bg};font-family:Manrope,sans-serif;padding:0 40px 88px;">'
        f'<div style="display:flex;align-items:center;gap:16px;margin-bottom:28px;"><h2 style="font-size:26px;font-weight:800;text-transform:uppercase;letter-spacing:-.01em;color:{text};margin:0;">Latest news</h2><div style="flex:1;height:1px;background:{border};"></div></div>'
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;">'
        + "".join([
            f'<div style="background:{surface};border:1px solid {border};border-radius:12px;overflow:hidden;">'
            f'<div style="aspect-ratio:16/9;background:linear-gradient(135deg,{accent},{surface});"></div>'
            '<div style="padding:18px;">'
            f'<div style="font-size:10px;font-weight:800;color:{accent};text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">{tag} · {date}</div>'
            f'<h3 style="font-size:16px;font-weight:800;color:{text};margin:0 0 8px;line-height:1.3;">{title}</h3>'
            f'<p style="font-size:13px;color:{muted};line-height:1.55;margin:0;">{excerpt}</p>'
            '</div></div>'
            for tag, date, title, excerpt in [
                ("Match report", "Mar 12", "Void Syndicate sweeps Nullpoint 2–0", "A dominant Group Stage close-out keeps the top seed within reach heading into playoffs."),
                ("Roster", "Mar 04", "Driftcore signs a two-year extension", "The flex player re-ups after a breakout split, citing “unfinished business.”"),
                ("Org", "Feb 21", "New training facility opens in Berlin", "A dedicated bootcamp space for the full active roster, on-site starting this split."),
            ]
        ]) + '</div></section>'
    )

    about = (
        f'<section style="background:{bg};font-family:Manrope,sans-serif;padding:96px 40px 56px;"><div style="max-width:680px;">'
        f'<div style="color:{accent};font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;border-left:3px solid {accent};padding-left:10px;margin-bottom:18px;">About the org</div>'
        f'<h1 style="font-size:clamp(32px,4.5vw,52px);line-height:1.05;letter-spacing:-.01em;text-transform:uppercase;font-weight:800;margin:0 0 22px;color:{text};">Built by players.<br>Run like a team.</h1>'
        f'<p style="color:{muted};font-size:16px;line-height:1.7;max-width:600px;margin:0 0 20px;">Void Syndicate was founded by three former pros who got tired of orgs that treat rosters as line items. We compete across three titles, run our own bootcamp, and pay out prize winnings the same week an event ends.</p>'
        f'<p style="color:{muted};font-size:16px;line-height:1.7;max-width:600px;margin:0;">No hidden sponsorship splits. No ghost-written player socials. Just the results, posted here first.</p>'
        '</div></section>'
    )

    contact = (
        f'<section style="background:{surface};font-family:Manrope,sans-serif;padding:44px 40px;border-top:1px solid {border};text-align:center;">'
        f'<div style="font-size:11px;color:{muted};text-transform:uppercase;letter-spacing:.1em;margin-bottom:10px;">Business & partnership inquiries</div>'
        f'<a href="mailto:partnerships@voidsyndicate.gg" style="color:{text};font-weight:800;font-size:18px;text-decoration:none;">partnerships@voidsyndicate.gg</a>'
        '</section>'
    )

    return dict(nav=nav, hero=hero, roster=roster, fixtures=fixtures, standings=standings, stats=stats, sponsors=sponsors, shop=shop, footer=footer, news=news, about=about, contact=contact)


def _esports_pages(id_: str, name: str, description: str, aesthetic: str, bg: str, surface: str, text: str, muted: str, accent: str, ink: str, border: str) -> Dict[str, Any]:
    # Six real pages per palette — Home, Roster, Matches, News, Shop, About
    # — matching what an actual esports org site needs (roster page,
    # schedule/results/standings page, a news/content feed, merch, and an
    # org story + business-inquiries contact), not one long scrolling home
    # page. Only _esports_sections' output differs between the 13 palette
    # variants; page structure below is identical across all of them.
    s = _esports_sections(bg, surface, text, muted, accent, ink, border)
    fonts = ["Manrope"]
    pages = [
        _page(id_, "Home", bg, fonts, [s["nav"], s["hero"], s["fixtures"], s["stats"], s["sponsors"], s["footer"]],
              seo={"title": name, "description": description}, page_id=f"{id_}-home", slug="index"),
        _page(f"{id_}-roster", "Roster", bg, fonts, [s["nav"], s["roster"], s["footer"]],
              seo={"title": f"Roster — {name}", "description": "Meet the active roster."}, page_id=f"{id_}-roster", slug="roster"),
        _page(f"{id_}-matches", "Matches", bg, fonts, [s["nav"], s["fixtures"], s["standings"], s["footer"]],
              seo={"title": f"Matches — {name}", "description": "Upcoming fixtures, recent results, and league standings."}, page_id=f"{id_}-matches", slug="matches"),
        _page(f"{id_}-news", "News", bg, fonts, [s["nav"], s["news"], s["footer"]],
              seo={"title": f"News — {name}", "description": "Match reports, roster moves, and org announcements."}, page_id=f"{id_}-news", slug="news"),
        _page(f"{id_}-shop", "Shop", bg, fonts, [s["nav"], s["shop"], s["footer"]],
              seo={"title": f"Shop — {name}", "description": "Official merch."}, page_id=f"{id_}-shop", slug="shop"),
        _page(f"{id_}-about", "About", bg, fonts, [s["nav"], s["about"], s["sponsors"], s["contact"], s["footer"]],
              seo={"title": f"About — {name}", "description": "The org's story, sponsors, and business contact."}, page_id=f"{id_}-about", slug="about"),
    ]
    return _tpl(id_, name, description, aesthetic, bg, fonts, html_blocks=[], pages=pages)


# ---- The 10 "modern content-type" starters (SaaS/Agency/Shop/Portfolio/
# Restaurant/Service), each expanded from one scrolling page into a real
# small multi-page site (nav + sub-pages a real site of that type carries)
# — one function per template since, unlike the esports palette variants,
# each of these has genuinely distinct layout/copy, not just recolored
# sections. ----

def _starter_saas_minimal() -> Dict[str, Any]:
    nav = _simple_nav("Outfit", "Fieldnote", [("Pricing", "pricing.html"), ("About", "about.html")], cta=("Start free", "#"))
    footer = '<footer style="padding:32px 48px;background:var(--fc-bg, #ffffff);border-top:1px solid var(--fc-border, #e2e8f0);color:var(--fc-muted, #64748b);font-family:Outfit,sans-serif;font-size:13px;text-align:center;">© 2026 Fieldnote — built by a small team that ships</footer>'
    return _tpl(
        "starter-saas-minimal",
        "SaaS — Minimal",
        "Asymmetric split hero with a layered panel mockup, one clear call to action. Colors bind to whatever theme is applied.",
        "modern-saas-minimal",
        "var(--fc-bg, #ffffff)",
        ["Outfit"],
        html_blocks=[],
        pages=[
            _page("starter-saas-minimal", "Home", "var(--fc-bg, #ffffff)", ["Outfit"], [
                nav,
                '<section style="padding:88px 48px;background:var(--fc-bg, #ffffff);font-family:Outfit,sans-serif;"><div style="max-width:1120px;margin:0 auto;display:grid;grid-template-columns:1.1fr 0.9fr;gap:64px;align-items:center;"><div><div style="display:inline-block;padding:6px 14px;border:1px solid var(--fc-border, #e2e8f0);border-radius:999px;font-size:12px;color:var(--fc-muted, #64748b);margin-bottom:22px;">Now in open beta</div><h1 style="font-size:50px;line-height:1.08;margin:0 0 20px;font-weight:700;letter-spacing:-0.02em;color:var(--fc-text, #0f172a);">Software that gets out of your way.</h1><p style="font-size:17px;line-height:1.6;color:var(--fc-muted, #64748b);margin:0 0 32px;max-width:440px;">One tool for the whole team, none of the setup tax. Start free, upgrade when it actually pays for itself.</p><div style="display:flex;gap:12px;">'
                '<a href="#" style="padding:14px 28px;background:var(--fc-primary, #2563eb);color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Start free</a><a href="pricing.html" style="padding:14px 28px;color:var(--fc-text, #0f172a);border:1px solid var(--fc-border, #e2e8f0);border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">See pricing</a></div></div>'
                '<div style="position:relative;height:320px;"><div style="position:absolute;top:0;left:40px;right:0;height:220px;background:var(--fc-surface, #f8fafc);border:1px solid var(--fc-border, #e2e8f0);border-radius:16px;box-shadow:0 24px 48px -24px rgba(15,23,42,0.18);"></div><div style="position:absolute;bottom:0;left:0;width:220px;height:160px;background:var(--fc-primary, #2563eb);border-radius:16px;opacity:0.9;"></div></div></div></section>',
                '<section style="padding:8px 48px 96px;background:var(--fc-bg, #ffffff);font-family:Outfit,sans-serif;"><div style="max-width:1120px;margin:0 auto;display:grid;grid-template-columns:1.4fr 1fr;gap:20px;">'
                '<div style="background:var(--fc-surface, #f8fafc);border:1px solid var(--fc-border, #e2e8f0);border-radius:16px;padding:36px;"><div style="width:40px;height:40px;border-radius:10px;background:var(--fc-primary, #2563eb);margin-bottom:18px;"></div><h3 style="font-size:20px;margin:0 0 10px;color:var(--fc-text, #0f172a);">Built around the workflow your team already has</h3><p style="font-size:14px;line-height:1.65;color:var(--fc-muted, #64748b);margin:0;max-width:420px;">Not the one we wish they had. Connect your tools, keep the habits, skip the retraining.</p></div>'
                '<div style="display:flex;flex-direction:column;gap:20px;">'
                + "".join([f'<div style="background:var(--fc-surface, #f8fafc);border:1px solid var(--fc-border, #e2e8f0);border-radius:16px;padding:22px;flex:1;"><h3 style="font-size:15px;margin:0 0 6px;color:var(--fc-text, #0f172a);">{t}</h3><p style="font-size:13px;line-height:1.55;color:var(--fc-muted, #64748b);margin:0;">{d}</p></div>' for t, d in [("Set up in minutes", "No consultant, no onboarding call."), ("Usage-based pricing", "Same rate whether it is 3 people or 300.")]])
                + '</div></div></section>',
                footer,
            ], seo={"title": "Fieldnote — Software that gets out of your way", "description": "Asymmetric split hero with a layered panel mockup, one clear call to action."}, page_id="starter-saas-minimal-home", slug="index"),
            _page("starter-saas-minimal-pricing", "Pricing", "var(--fc-bg, #ffffff)", ["Outfit"], [
                nav,
                '<section style="padding:72px 48px 32px;background:var(--fc-bg, #ffffff);font-family:Outfit,sans-serif;text-align:center;"><h1 style="font-size:38px;margin:0 0 10px;font-weight:700;color:var(--fc-text, #0f172a);">Simple, usage-based pricing</h1><p style="font-size:15px;color:var(--fc-muted, #64748b);margin:0;">No seat minimums. No annual lock-in.</p></section>',
                '<section style="padding:16px 48px 96px;background:var(--fc-bg, #ffffff);font-family:Outfit,sans-serif;"><div style="max-width:1000px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:20px;">'
                + "".join([f'<div style="background:var(--fc-surface, #f8fafc);border:1px solid {("var(--fc-primary, #2563eb)" if feat else "var(--fc-border, #e2e8f0)")};border-radius:16px;padding:28px;">'
                           f'<div style="font-size:13px;font-weight:600;color:var(--fc-muted, #64748b);text-transform:uppercase;letter-spacing:.04em;margin-bottom:10px;">{name}</div>'
                           f'<div style="font-size:34px;font-weight:700;color:var(--fc-text, #0f172a);margin-bottom:4px;">{price}</div>'
                           f'<div style="font-size:13px;color:var(--fc-muted, #64748b);margin-bottom:20px;">{unit}</div>'
                           f'<a href="#" style="display:block;text-align:center;padding:12px;background:{("var(--fc-primary, #2563eb)" if feat else "var(--fc-surface, #f8fafc)")};color:{("#fff" if feat else "var(--fc-text, #0f172a)")};border:1px solid var(--fc-border, #e2e8f0);border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">{cta}</a>'
                           '</div>'
                           for name, price, unit, cta, feat in [("Starter", "$0", "up to 3 seats, forever", "Start free", False), ("Team", "$12", "per seat / month", "Start 14-day trial", True), ("Scale", "Custom", "volume pricing + SSO", "Talk to sales", False)]])
                + '</div></section>',
                footer,
            ], seo={"title": "Pricing — Fieldnote", "description": "Simple, usage-based pricing with no seat minimums."}, page_id="starter-saas-minimal-pricing", slug="pricing"),
            _page("starter-saas-minimal-about", "About", "var(--fc-bg, #ffffff)", ["Outfit"], [
                nav,
                '<section style="padding:80px 48px;background:var(--fc-bg, #ffffff);font-family:Outfit,sans-serif;"><div style="max-width:640px;"><h1 style="font-size:40px;margin:0 0 20px;font-weight:700;color:var(--fc-text, #0f172a);">A small team, shipping weekly.</h1><p style="font-size:16px;line-height:1.7;color:var(--fc-muted, #64748b);margin:0 0 16px;">Fieldnote started as an internal tool at a nine-person agency that got tired of paying for six different apps to coordinate one project. Four years later it is the same idea, just for anyone else who felt that way.</p><p style="font-size:16px;line-height:1.7;color:var(--fc-muted, #64748b);margin:0;">We are still small on purpose — nine people, no outside funding, profitable since year two.</p></div></section>',
                footer,
            ], seo={"title": "About — Fieldnote", "description": "A small, self-funded team building Fieldnote."}, page_id="starter-saas-minimal-about", slug="about"),
        ],
    )


def _starter_saas_bold() -> Dict[str, Any]:
    nav = _simple_nav("Space Grotesk", "Fieldnote", [("Pricing", "pricing.html"), ("About", "about.html")], cta=("Try it free", "#"))
    footer = '<footer style="padding:32px 48px;background:var(--fc-surface, #f8fafc);color:var(--fc-muted, #64748b);font-family:\'Space Grotesk\',sans-serif;font-size:13px;text-align:center;">© 2026 Fieldnote</footer>'
    return _tpl(
        "starter-saas-bold",
        "SaaS — Bold",
        "Asymmetric split hero, a stat rail, and a numbered case for switching. Colors bind to whatever theme is applied.",
        "modern-saas-bold",
        "var(--fc-bg, #ffffff)",
        ["Space Grotesk"],
        html_blocks=[],
        pages=[
            _page("starter-saas-bold", "Home", "var(--fc-bg, #ffffff)", ["Space Grotesk"], [
                nav,
                '<section style="padding:100px 48px;background:var(--fc-text, #0f172a);font-family:\'Space Grotesk\',sans-serif;color:var(--fc-bg, #ffffff);"><div style="max-width:1160px;margin:0 auto;display:grid;grid-template-columns:1.3fr 0.7fr;gap:56px;align-items:center;"><div><h1 style="font-size:60px;line-height:1.02;margin:0 0 20px;font-weight:700;letter-spacing:-0.03em;">Stop paying for six tools to do one job.</h1><p style="font-size:18px;line-height:1.6;opacity:0.75;margin:0 0 32px;max-width:480px;">Fieldnote replaces your spreadsheet, your tracker, and the Slack channel where you actually coordinate work.</p><a href="#" style="display:inline-block;padding:16px 34px;background:var(--fc-accent, #0f766e);color:#fff;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px;">Try it free for 14 days</a></div>'
                '<div style="display:flex;flex-direction:column;gap:0;border-left:1px solid rgba(255,255,255,0.15);padding-left:32px;">' + "".join([f'<div style="padding:18px 0;border-bottom:1px solid rgba(255,255,255,0.12);"><div style="font-size:32px;font-weight:700;">{n}</div><div style="font-size:12px;opacity:0.6;margin-top:2px;">{l}</div></div>' for n, l in [("12,400+", "teams onboard"), ("4.8/5", "average rating"), ("6 min", "average setup time")]]) + '</div></div></section>',
                '<section style="padding:88px 48px;background:var(--fc-bg, #ffffff);font-family:\'Space Grotesk\',sans-serif;"><div style="max-width:760px;margin:0 auto;">' + "".join([f'<div style="display:flex;gap:24px;padding:24px 0;border-bottom:1px solid var(--fc-border, #e2e8f0);"><div style="font-size:32px;font-weight:700;color:var(--fc-accent, #0f766e);flex:none;width:56px;">{n}</div><div><h3 style="font-size:19px;margin:0 0 6px;color:var(--fc-text, #0f172a);">{t}</h3><p style="font-size:15px;line-height:1.6;color:var(--fc-muted, #64748b);margin:0;">{d}</p></div></div>' for n, t, d in [("01", "One source of truth", "Everyone stops asking which spreadsheet is the real one."), ("02", "Built-in automation", "The busywork that used to eat Friday afternoons runs itself."), ("03", "Actually cancel anytime", "No call required. We would rather earn it every month.")]]) + '</div></section>',
                footer,
            ], seo={"title": "Fieldnote — Stop paying for six tools", "description": "Asymmetric split hero, a stat rail, and a numbered case for switching."}, page_id="starter-saas-bold-home", slug="index"),
            _page("starter-saas-bold-pricing", "Pricing", "var(--fc-bg, #ffffff)", ["Space Grotesk"], [
                nav,
                '<section style="padding:88px 48px 32px;background:var(--fc-text, #0f172a);font-family:\'Space Grotesk\',sans-serif;color:var(--fc-bg, #ffffff);"><h1 style="font-size:42px;margin:0 0 12px;font-weight:700;letter-spacing:-0.02em;">Two plans. No sales calls for either.</h1><p style="font-size:16px;opacity:0.7;margin:0;">Cancel anytime, straight from settings.</p></section>',
                '<section style="padding:56px 48px 96px;background:var(--fc-bg, #ffffff);font-family:\'Space Grotesk\',sans-serif;"><div style="max-width:800px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:24px;">'
                + "".join([f'<div style="border:1px solid var(--fc-border, #e2e8f0);border-radius:16px;padding:32px;{("background:var(--fc-text, #0f172a);color:var(--fc-bg, #ffffff);" if feat else "")}">'
                           f'<div style="font-size:13px;opacity:.7;text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px;">{name}</div>'
                           f'<div style="font-size:38px;font-weight:700;margin-bottom:6px;">{price}<span style="font-size:14px;font-weight:400;opacity:.6;">{unit}</span></div>'
                           f'<p style="font-size:14px;line-height:1.6;opacity:.75;margin:0 0 22px;">{desc}</p>'
                           f'<a href="#" style="display:block;text-align:center;padding:13px;background:{"var(--fc-bg, #ffffff)" if feat else "var(--fc-accent, #0f766e)"};color:{"var(--fc-text, #0f172a)" if feat else "#fff"};border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">{cta}</a>'
                           '</div>'
                           for name, price, unit, desc, cta, feat in [("Team", "$29", "/mo", "Everything you need for one team, one workspace.", "Try free for 14 days", False), ("Enterprise", "$99", "/mo", "Multiple workspaces, SSO, and a dedicated Slack channel with us.", "Try free for 14 days", True)]])
                + '</div></section>',
                footer,
            ], seo={"title": "Pricing — Fieldnote", "description": "Two plans, no sales calls, cancel anytime."}, page_id="starter-saas-bold-pricing", slug="pricing"),
            _page("starter-saas-bold-about", "About", "var(--fc-bg, #ffffff)", ["Space Grotesk"], [
                nav,
                '<section style="padding:88px 48px;background:var(--fc-bg, #ffffff);font-family:\'Space Grotesk\',sans-serif;"><div style="max-width:680px;"><h1 style="font-size:44px;line-height:1.1;margin:0 0 20px;font-weight:700;letter-spacing:-0.02em;color:var(--fc-text, #0f172a);">We got tired of the six-tool tax too.</h1><p style="font-size:16px;line-height:1.7;color:var(--fc-muted, #64748b);margin:0 0 16px;">Fieldnote is built by the same three people who kept re-building the same internal tracker at every job they had, until they just built the real one.</p><p style="font-size:16px;line-height:1.7;color:var(--fc-muted, #64748b);margin:0;">12,400+ teams later, it is still a thirty-person company, and we would like to keep it that way.</p></div></section>',
                footer,
            ], seo={"title": "About — Fieldnote", "description": "A thirty-person company building Fieldnote."}, page_id="starter-saas-bold-about", slug="about"),
        ],
    )


def _starter_agency_grid() -> Dict[str, Any]:
    nav = _simple_nav("Manrope", "Fieldwork Studio", [("Services", "services.html"), ("About", "about.html")], cta=("Start a project", "about.html#contact"))
    footer = '<footer style="padding:32px 48px;background:var(--fc-surface, #f8fafc);border-top:1px solid var(--fc-border, #e2e8f0);color:var(--fc-muted, #64748b);font-family:Manrope,sans-serif;font-size:13px;display:flex;justify-content:space-between;"><span>© 2026 Fieldwork Studio</span><span>hello@fieldwork.studio</span></footer>'
    return _tpl(
        "starter-agency-grid",
        "Agency — Grid",
        "Portfolio-forward studio site with a project grid. Colors bind to whatever theme is applied.",
        "modern-agency-grid",
        "var(--fc-bg, #ffffff)",
        ["Manrope"],
        html_blocks=[],
        pages=[
            _page("starter-agency-grid", "Home", "var(--fc-bg, #ffffff)", ["Manrope"], [
                nav,
                '<section style="padding:96px 48px 72px;background:var(--fc-bg, #ffffff);font-family:Manrope,sans-serif;"><div style="max-width:800px;"><div style="font-size:13px;letter-spacing:0.1em;text-transform:uppercase;color:var(--fc-muted, #64748b);margin-bottom:16px;">Brand & product studio</div><h1 style="font-size:48px;line-height:1.15;margin:0 0 20px;font-weight:700;color:var(--fc-text, #0f172a);">We build the identity, then the product that has to live up to it.</h1><p style="font-size:17px;line-height:1.65;color:var(--fc-muted, #64748b);max-width:560px;margin:0;">A small studio for founders who need both the brand and the thing itself done right, on the same timeline.</p></div></section>',
                '<section style="padding:0 48px 96px;background:var(--fc-bg, #ffffff);font-family:Manrope,sans-serif;"><div style="max-width:1000px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:20px;">' + "".join([f'<div><div style="aspect-ratio:4/3;background:var(--fc-surface, #f8fafc);border:1px solid var(--fc-border, #e2e8f0);border-radius:12px;margin-bottom:12px;"></div><h3 style="font-size:15px;margin:0 0 2px;color:var(--fc-text, #0f172a);">{t}</h3><p style="font-size:13px;color:var(--fc-muted, #64748b);margin:0;">{d}</p></div>' for t, d in [("Northfield Coffee", "Brand identity + packaging"), ("Loom & Co.", "E-commerce + photography"), ("Verano Health", "Product design + design system"), ("Passage Books", "Web design + development"), ("Hearth Studio", "Brand identity + web"), ("Meridian Finance", "Product design + brand")]]) + '</div></section>',
                footer,
            ], seo={"title": "Fieldwork Studio — Brand & product studio", "description": "Portfolio-forward studio site with a project grid."}, page_id="starter-agency-grid-home", slug="index"),
            _page("starter-agency-grid-services", "Services", "var(--fc-bg, #ffffff)", ["Manrope"], [
                nav,
                '<section style="padding:88px 48px 40px;background:var(--fc-bg, #ffffff);font-family:Manrope,sans-serif;"><h1 style="font-size:40px;margin:0 0 12px;font-weight:700;color:var(--fc-text, #0f172a);">What we do</h1><p style="font-size:15px;color:var(--fc-muted, #64748b);margin:0;max-width:520px;">Three services, always in this order — brand before product, product before growth.</p></section>',
                '<section style="padding:0 48px 96px;background:var(--fc-bg, #ffffff);font-family:Manrope,sans-serif;"><div style="max-width:1000px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:20px;">'
                + "".join([f'<div style="border:1px solid var(--fc-border, #e2e8f0);border-radius:16px;padding:28px;"><div style="width:36px;height:36px;border-radius:9px;background:var(--fc-primary, #2563eb);margin-bottom:16px;"></div><h3 style="font-size:17px;margin:0 0 8px;color:var(--fc-text, #0f172a);">{t}</h3><p style="font-size:13px;line-height:1.6;color:var(--fc-muted, #64748b);margin:0;">{d}</p></div>' for t, d in [("Brand identity", "Naming, mark, and a system that survives a hundred different use cases."), ("Product design", "The actual interface, prototyped and tested before a line of code."), ("Web & e-commerce", "The site that has to carry both of the above at launch.")]])
                + '</div></section>',
                footer,
            ], seo={"title": "Services — Fieldwork Studio", "description": "Brand identity, product design, and web — in that order."}, page_id="starter-agency-grid-services", slug="services"),
            _page("starter-agency-grid-about", "About", "var(--fc-bg, #ffffff)", ["Manrope"], [
                nav,
                '<section style="padding:88px 48px 56px;background:var(--fc-bg, #ffffff);font-family:Manrope,sans-serif;"><div style="max-width:640px;"><h1 style="font-size:38px;margin:0 0 18px;font-weight:700;color:var(--fc-text, #0f172a);">Six people, one studio, no account managers.</h1><p style="font-size:16px;line-height:1.7;color:var(--fc-muted, #64748b);margin:0;">Founded in 2019. Everyone who works on your project also talks to you directly — no layer of account management translating between you and the people actually doing the work.</p></div></section>',
                '<section id="contact" style="padding:0 48px 88px;background:var(--fc-bg, #ffffff);font-family:Manrope,sans-serif;"><div style="max-width:640px;padding:28px;background:var(--fc-surface, #f8fafc);border:1px solid var(--fc-border, #e2e8f0);border-radius:16px;"><div style="font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--fc-muted, #64748b);margin-bottom:8px;">Start a project</div><a href="mailto:hello@fieldwork.studio" style="font-size:20px;font-weight:700;color:var(--fc-text, #0f172a);text-decoration:none;">hello@fieldwork.studio</a></div></section>',
                footer,
            ], seo={"title": "About — Fieldwork Studio", "description": "A six-person studio, founded 2019."}, page_id="starter-agency-grid-about", slug="about"),
        ],
    )


def _starter_agency_editorial() -> Dict[str, Any]:
    nav = _simple_nav("Sora", "Fieldwork Studio", [("Services", "services.html"), ("About", "about.html")], cta=("Start a project", "about.html#contact"))
    footer = '<footer style="padding:32px 48px;background:var(--fc-text, #0f172a);color:var(--fc-bg, #ffffff);opacity:0.85;font-family:Sora,sans-serif;font-size:13px;text-align:center;">Fieldwork Studio · est. 2019</footer>'
    return _tpl(
        "starter-agency-editorial",
        "Agency — Editorial",
        "Big type, numbered services, a text-forward alternative to a project grid. Colors bind to whatever theme is applied.",
        "modern-agency-editorial",
        "var(--fc-bg, #ffffff)",
        ["Fraunces", "Sora"],
        html_blocks=[],
        pages=[
            _page("starter-agency-editorial", "Home", "var(--fc-bg, #ffffff)", ["Fraunces", "Sora"], [
                nav,
                '<section style="padding:100px 48px 80px;background:var(--fc-bg, #ffffff);font-family:Fraunces,serif;"><div style="max-width:760px;"><h1 style="font-size:58px;line-height:1.15;margin:0 0 24px;font-weight:500;color:var(--fc-text, #0f172a);">Strategy first. Everything else follows from that.</h1><p style="font-family:Sora,sans-serif;font-size:17px;line-height:1.7;color:var(--fc-muted, #64748b);max-width:540px;margin:0;">We turn down work that starts with "we need a website" before anyone has answered "for whom, saying what." Ask us why.</p></div></section>',
                '<section style="padding:0 48px 96px;background:var(--fc-bg, #ffffff);font-family:Sora,sans-serif;"><div style="max-width:760px;">' + "".join([f'<div style="display:flex;gap:28px;padding:28px 0;border-top:1px solid var(--fc-border, #e2e8f0);"><div style="font-family:Fraunces,serif;font-size:15px;color:var(--fc-muted, #64748b);flex:none;width:32px;">{n}</div><div style="flex:1;"><h3 style="font-family:Fraunces,serif;font-size:22px;margin:0 0 8px;color:var(--fc-text, #0f172a);font-weight:500;">{t}</h3><p style="font-size:15px;line-height:1.65;color:var(--fc-muted, #64748b);margin:0;">{d}</p></div></div>' for n, t, d in [("01", "Positioning", "The one-sentence answer to why you, before any of it gets designed."), ("02", "Identity", "A visual system that survives contact with a hundred different use cases."), ("03", "Product", "The actual thing, built to the standard the brand now promises.")]]) + '</div></section>',
                footer,
            ], seo={"title": "Fieldwork Studio — Strategy first", "description": "Big type, numbered services, a text-forward studio site."}, page_id="starter-agency-editorial-home", slug="index"),
            _page("starter-agency-editorial-services", "Services", "var(--fc-bg, #ffffff)", ["Fraunces", "Sora"], [
                nav,
                '<section style="padding:96px 48px 40px;background:var(--fc-bg, #ffffff);font-family:Fraunces,serif;"><div style="max-width:680px;"><h1 style="font-size:46px;line-height:1.15;margin:0 0 16px;font-weight:500;color:var(--fc-text, #0f172a);">Three engagements, not a menu of add-ons.</h1><p style="font-family:Sora,sans-serif;font-size:16px;line-height:1.7;color:var(--fc-muted, #64748b);margin:0;">Each one assumes the last is done. We rarely start at 03.</p></div></section>',
                '<section style="padding:0 48px 96px;background:var(--fc-bg, #ffffff);font-family:Sora,sans-serif;"><div style="max-width:760px;">' + "".join([f'<div style="display:flex;gap:28px;padding:28px 0;border-top:1px solid var(--fc-border, #e2e8f0);"><div style="font-family:Fraunces,serif;font-size:15px;color:var(--fc-muted, #64748b);flex:none;width:32px;">{n}</div><div style="flex:1;"><h3 style="font-family:Fraunces,serif;font-size:22px;margin:0 0 8px;color:var(--fc-text, #0f172a);font-weight:500;">{t}</h3><p style="font-size:15px;line-height:1.65;color:var(--fc-muted, #64748b);margin:0;">{d}</p><div style="font-family:Fraunces,serif;font-style:italic;font-size:13px;color:var(--fc-muted, #64748b);margin-top:8px;">{len_}</div></div></div>' for n, t, d, len_ in [("A", "Discovery sprint", "Two weeks, one workshop, one document neither of us will disagree about later.", "2 weeks"), ("B", "Full identity + site", "Everything from the sprint, built and shipped.", "6–10 weeks"), ("C", "Ongoing retainer", "For studios who need us on call after launch, not just for it.", "Monthly")]]) + '</div></section>',
                footer,
            ], seo={"title": "Services — Fieldwork Studio", "description": "Discovery, full identity + site, and ongoing retainer engagements."}, page_id="starter-agency-editorial-services", slug="services"),
            _page("starter-agency-editorial-about", "About", "var(--fc-bg, #ffffff)", ["Fraunces", "Sora"], [
                nav,
                '<section style="padding:96px 48px 56px;background:var(--fc-bg, #ffffff);font-family:Fraunces,serif;"><div style="max-width:640px;"><h1 style="font-size:44px;line-height:1.15;margin:0 0 20px;font-weight:500;color:var(--fc-text, #0f172a);">A studio that reads the whole brief before answering it.</h1><p style="font-family:Sora,sans-serif;font-size:16px;line-height:1.7;color:var(--fc-muted, #64748b);margin:0;">Fieldwork Studio was founded in 2019 by two strategists who kept getting hired to fix identity work that skipped the "for whom, saying what" question. We still ask it first, every time.</p></div></section>',
                '<section id="contact" style="padding:0 48px 88px;background:var(--fc-bg, #ffffff);font-family:Sora,sans-serif;"><div style="max-width:640px;padding:28px;border:1px solid var(--fc-border, #e2e8f0);border-radius:16px;"><div style="font-family:Fraunces,serif;font-style:italic;font-size:13px;color:var(--fc-muted, #64748b);margin-bottom:8px;">Ask us why</div><a href="mailto:hello@fieldwork.studio" style="font-size:19px;font-weight:600;color:var(--fc-text, #0f172a);text-decoration:none;">hello@fieldwork.studio</a></div></section>',
                footer,
            ], seo={"title": "About — Fieldwork Studio", "description": "Founded 2019 by two strategists."}, page_id="starter-agency-editorial-about", slug="about"),
        ],
    )


def _starter_shop_product() -> Dict[str, Any]:
    nav = _simple_nav("Sora", "Norrland Trading Co.", [("Shop", "shop.html"), ("About", "about.html")], cta=("Add to cart", "#"))
    footer = '<footer style="padding:32px 48px;background:var(--fc-bg, #ffffff);border-top:1px solid var(--fc-border, #e2e8f0);color:var(--fc-muted, #64748b);font-family:Sora,sans-serif;font-size:13px;text-align:center;">© 2026 Norrland Trading Co.</footer>'
    return _tpl(
        "starter-shop-product",
        "E-commerce — Single Product",
        "Product-focused landing page: split hero, an asymmetric spec list, and a clear buy CTA. Colors bind to whatever theme is applied.",
        "modern-shop-product",
        "var(--fc-bg, #ffffff)",
        ["Sora"],
        html_blocks=[],
        pages=[
            _page("starter-shop-product", "Home", "var(--fc-bg, #ffffff)", ["Sora"], [
                nav,
                '<section style="padding:80px 48px;background:var(--fc-bg, #ffffff);font-family:Sora,sans-serif;"><div style="max-width:1040px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center;"><div style="aspect-ratio:1;background:var(--fc-surface, #f8fafc);border:1px solid var(--fc-border, #e2e8f0);border-radius:16px;"></div><div><div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:var(--fc-muted, #64748b);margin-bottom:12px;">Norrland Trading Co.</div><h1 style="font-size:36px;margin:0 0 12px;font-weight:700;color:var(--fc-text, #0f172a);">The Field Jacket</h1><p style="font-size:15px;line-height:1.65;color:var(--fc-muted, #64748b);margin:0 0 20px;">Waxed cotton, brass hardware, made to be worn through a decade of weather rather than replaced after one season.</p><div style="font-size:26px;font-weight:700;color:var(--fc-text, #0f172a);margin-bottom:24px;">$228</div><button style="padding:15px 36px;background:var(--fc-primary, #2563eb);color:#fff;border:0;border-radius:8px;font-weight:600;font-size:15px;cursor:pointer;">Add to cart</button></div></div></section>',
                '<section style="padding:64px 48px;background:var(--fc-surface, #f8fafc);font-family:Sora,sans-serif;"><div style="max-width:760px;margin:0 auto;display:flex;flex-direction:column;">' + "".join([f'<div style="display:flex;justify-content:space-between;padding:16px 0;border-bottom:1px solid var(--fc-border, #e2e8f0);"><div style="font-size:14px;font-weight:600;color:var(--fc-text, #0f172a);">{t}</div><div style="font-size:13px;color:var(--fc-muted, #64748b);">{d}</div></div>' for t, d in [("Waxed cotton", "12oz, water-resistant"), ("Brass hardware", "YKK zip, solid buttons"), ("Made to order", "Ships in 5-7 days"), ("Free returns", "60-day window")]]) + '</div></section>',
                footer,
            ], seo={"title": "Norrland Trading Co. — The Field Jacket", "description": "Product-focused landing page with a clear buy CTA."}, page_id="starter-shop-product-home", slug="index"),
            _page("starter-shop-product-shop", "Shop", "var(--fc-bg, #ffffff)", ["Sora"], [
                nav,
                '<section style="padding:64px 48px 32px;background:var(--fc-bg, #ffffff);font-family:Sora,sans-serif;"><h1 style="font-size:32px;margin:0 0 8px;font-weight:700;color:var(--fc-text, #0f172a);">The full range</h1><p style="font-size:14px;color:var(--fc-muted, #64748b);margin:0;">Everything we make, made to be worn until it\'s worn out.</p></section>',
                '<section style="padding:0 48px 88px;background:var(--fc-bg, #ffffff);font-family:Sora,sans-serif;"><div style="max-width:1040px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);gap:20px;">'
                + "".join([f'<div><div style="aspect-ratio:1;background:var(--fc-surface, #f8fafc);border:1px solid var(--fc-border, #e2e8f0);border-radius:12px;margin-bottom:10px;"></div><div style="font-size:13px;font-weight:600;color:var(--fc-text, #0f172a);">{t}</div><div style="font-size:13px;color:var(--fc-muted, #64748b);">${p}</div></div>' for t, p in [("The Field Jacket", "228"), ("Waxed Tote", "84"), ("Canvas Belt", "42"), ("Wool Watch Cap", "38")]])
                + '</div></section>',
                footer,
            ], seo={"title": "Shop — Norrland Trading Co.", "description": "The full range of waxed-cotton goods."}, page_id="starter-shop-product-shop", slug="shop"),
            _page("starter-shop-product-about", "About", "var(--fc-bg, #ffffff)", ["Sora"], [
                nav,
                '<section style="padding:80px 48px;background:var(--fc-bg, #ffffff);font-family:Sora,sans-serif;"><div style="max-width:620px;"><h1 style="font-size:34px;margin:0 0 18px;font-weight:700;color:var(--fc-text, #0f172a);">Made to outlast the trend cycle.</h1><p style="font-size:15px;line-height:1.7;color:var(--fc-muted, #64748b);margin:0 0 14px;">Norrland Trading Co. makes a small, unchanging line of waxed-cotton goods — the same jacket pattern since 2018, re-cut only when the fabric mill changes, never for fashion reasons.</p><p style="font-size:15px;line-height:1.7;color:var(--fc-muted, #64748b);margin:0;">Free returns within 60 days. Questions about an order? <a href="mailto:hello@norrlandtrading.co" style="color:var(--fc-text, #0f172a);">hello@norrlandtrading.co</a></p></div></section>',
                footer,
            ], seo={"title": "About — Norrland Trading Co.", "description": "A small, unchanging line of waxed-cotton goods since 2018."}, page_id="starter-shop-product-about", slug="about"),
        ],
    )


def _starter_shop_grid() -> Dict[str, Any]:
    nav = _simple_nav("Sora", "Birchwood & Ash", [("About", "about.html"), ("Contact", "contact.html")])
    footer = '<footer style="padding:32px 48px;background:var(--fc-surface, #f8fafc);border-top:1px solid var(--fc-border, #e2e8f0);color:var(--fc-muted, #64748b);font-family:Sora,sans-serif;font-size:13px;text-align:center;">© 2026 Birchwood & Ash</footer>'
    return _tpl(
        "starter-shop-grid",
        "E-commerce — Shop Grid",
        "Catalog-style storefront with a masonry product grid. Colors bind to whatever theme is applied.",
        "modern-shop-grid",
        "var(--fc-bg, #ffffff)",
        ["Sora"],
        html_blocks=[],
        pages=[
            _page("starter-shop-grid", "Home", "var(--fc-bg, #ffffff)", ["Sora"], [
                nav,
                '<section style="padding:64px 48px 40px;background:var(--fc-bg, #ffffff);font-family:Sora,sans-serif;"><h1 style="font-size:34px;margin:0 0 10px;font-weight:700;color:var(--fc-text, #0f172a);">New arrivals</h1><p style="font-size:15px;color:var(--fc-muted, #64748b);margin:0;">Small-batch goods, restocked every Friday.</p></section>',
                '<section style="padding:0 48px 80px;background:var(--fc-bg, #ffffff);font-family:Sora,sans-serif;"><div style="max-width:1040px;margin:0 auto;display:grid;grid-template-columns:repeat(4,1fr);grid-auto-rows:18px;gap:20px;">'
                + "".join([f'<div style="grid-row:span {span};display:flex;flex-direction:column;"><div style="flex:1;background:var(--fc-surface, #f8fafc);border:1px solid var(--fc-border, #e2e8f0);border-radius:10px;margin-bottom:10px;"></div><div style="font-size:13px;font-weight:600;color:var(--fc-text, #0f172a);">{t}</div><div style="font-size:13px;color:var(--fc-muted, #64748b);">{p}</div></div>' for t, p, span in [("Ceramic mug", "$24", 12), ("Linen napkin set", "$38", 15), ("Oak cutting board", "$56", 12), ("Wool throw", "$92", 16), ("Cast iron pan", "$68", 14), ("Glass carafe", "$32", 12), ("Enamel bowl", "$18", 13), ("Bread box", "$74", 12)]])
                + '</div></section>',
                footer,
            ], seo={"title": "Birchwood & Ash — New arrivals", "description": "Catalog-style storefront with a masonry product grid."}, page_id="starter-shop-grid-home", slug="index"),
            _page("starter-shop-grid-about", "About", "var(--fc-bg, #ffffff)", ["Sora"], [
                nav,
                '<section style="padding:80px 48px;background:var(--fc-bg, #ffffff);font-family:Sora,sans-serif;"><div style="max-width:620px;"><h1 style="font-size:34px;margin:0 0 18px;font-weight:700;color:var(--fc-text, #0f172a);">Small-batch, on purpose.</h1><p style="font-size:15px;line-height:1.7;color:var(--fc-muted, #64748b);margin:0 0 20px;">Birchwood & Ash restocks a short run of homewares every Friday rather than keeping a warehouse full of everything — when it\'s gone, it\'s gone until the next batch.</p><h2 style="font-size:16px;margin:0 0 10px;color:var(--fc-text, #0f172a);">Shipping & returns</h2><p style="font-size:14px;line-height:1.65;color:var(--fc-muted, #64748b);margin:0;">Ships within 3 business days. Unused items returnable within 30 days for a full refund.</p></div></section>',
                footer,
            ], seo={"title": "About — Birchwood & Ash", "description": "Small-batch homewares, restocked every Friday."}, page_id="starter-shop-grid-about", slug="about"),
            _page("starter-shop-grid-contact", "Contact", "var(--fc-bg, #ffffff)", ["Sora"], [
                nav,
                '<section style="padding:80px 48px;background:var(--fc-bg, #ffffff);font-family:Sora,sans-serif;text-align:center;"><div style="font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--fc-muted, #64748b);margin-bottom:10px;">Questions about an order?</div><a href="mailto:hello@birchwoodandash.com" style="font-size:22px;font-weight:700;color:var(--fc-text, #0f172a);text-decoration:none;">hello@birchwoodandash.com</a></section>',
                footer,
            ], seo={"title": "Contact — Birchwood & Ash", "description": "Get in touch about an order."}, page_id="starter-shop-grid-contact", slug="contact"),
        ],
    )


def _starter_portfolio_minimal() -> Dict[str, Any]:
    nav = _simple_nav("'Plus Jakarta Sans'", "Maren Iida", [("Work", "index.html"), ("About", "about.html"), ("Contact", "contact.html")])
    footer = '<footer style="padding:32px 48px;background:var(--fc-surface, #f8fafc);color:var(--fc-muted, #64748b);font-family:\'Plus Jakarta Sans\',sans-serif;font-size:13px;text-align:center;">maren@example.com</footer>'
    return _tpl(
        "starter-portfolio-minimal",
        "Portfolio — Minimal Personal",
        "A quiet, centered personal site — name, role, selected work. Colors bind to whatever theme is applied.",
        "modern-portfolio-minimal",
        "var(--fc-bg, #ffffff)",
        ["Plus Jakarta Sans"],
        html_blocks=[],
        pages=[
            _page("starter-portfolio-minimal", "Home", "var(--fc-bg, #ffffff)", ["Plus Jakarta Sans"], [
                nav,
                '<section style="min-height:60vh;display:flex;flex-direction:column;justify-content:center;padding:80px 48px;background:var(--fc-bg, #ffffff);font-family:\'Plus Jakarta Sans\',sans-serif;text-align:center;"><div style="width:64px;height:64px;border-radius:999px;background:var(--fc-surface, #f8fafc);border:1px solid var(--fc-border, #e2e8f0);margin:0 auto 24px;"></div><h1 style="font-size:30px;margin:0 0 6px;font-weight:700;color:var(--fc-text, #0f172a);">Maren Iida</h1><p style="font-size:16px;color:var(--fc-muted, #64748b);margin:0 0 20px;">Product designer, currently at Fieldnote</p><div style="width:28px;height:2px;background:var(--fc-primary, #2563eb);margin:0 auto;"></div></section>',
                '<section style="padding:0 48px 88px;background:var(--fc-bg, #ffffff);font-family:\'Plus Jakarta Sans\',sans-serif;"><div style="max-width:600px;margin:0 auto;">' + "".join([f'<div style="display:flex;justify-content:space-between;align-items:baseline;padding:18px 0;border-bottom:1px solid var(--fc-border, #e2e8f0);"><div><div style="font-size:15px;font-weight:600;color:var(--fc-text, #0f172a);">{t}</div><div style="font-size:13px;color:var(--fc-muted, #64748b);">{d}</div></div><div style="font-size:13px;color:var(--fc-muted, #64748b);">{y}</div></div>' for t, d, y in [("Fieldnote", "Design system + onboarding redesign", "2025"), ("Verano Health", "Patient portal, ground up", "2024"), ("Passage Books", "Freelance — full site redesign", "2023")]]) + '</div></section>',
                footer,
            ], seo={"title": "Maren Iida — Product designer", "description": "A quiet, centered personal site — name, role, selected work."}, page_id="starter-portfolio-minimal-home", slug="index"),
            _page("starter-portfolio-minimal-about", "About", "var(--fc-bg, #ffffff)", ["Plus Jakarta Sans"], [
                nav,
                '<section style="padding:80px 48px;background:var(--fc-bg, #ffffff);font-family:\'Plus Jakarta Sans\',sans-serif;text-align:center;"><div style="max-width:520px;margin:0 auto;"><h1 style="font-size:28px;margin:0 0 18px;font-weight:700;color:var(--fc-text, #0f172a);">About</h1><p style="font-size:15px;line-height:1.75;color:var(--fc-muted, #64748b);margin:0;">Six years in product design, most recently leading onboarding and design-systems work at Fieldnote. Before that, healthcare and publishing. I care most about the parts of a product nobody notices until they are gone.</p></div></section>',
                footer,
            ], seo={"title": "About — Maren Iida", "description": "Six years in product design."}, page_id="starter-portfolio-minimal-about", slug="about"),
            _page("starter-portfolio-minimal-contact", "Contact", "var(--fc-bg, #ffffff)", ["Plus Jakarta Sans"], [
                nav,
                '<section style="padding:80px 48px;background:var(--fc-bg, #ffffff);font-family:\'Plus Jakarta Sans\',sans-serif;text-align:center;"><div style="font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--fc-muted, #64748b);margin-bottom:10px;">Say hello</div><a href="mailto:maren@example.com" style="font-size:22px;font-weight:700;color:var(--fc-text, #0f172a);text-decoration:none;">maren@example.com</a></section>',
                footer,
            ], seo={"title": "Contact — Maren Iida", "description": "Get in touch."}, page_id="starter-portfolio-minimal-contact", slug="contact"),
        ],
    )


def _starter_portfolio_creative() -> Dict[str, Any]:
    nav = _simple_nav("Manrope", "Devon Cole", [("Work", "index.html"), ("About", "about.html"), ("Contact", "contact.html")],
                       bg="var(--fc-text, #0f172a)", text="var(--fc-bg, #ffffff)", muted="rgba(255,255,255,.65)", border="rgba(255,255,255,.15)")
    footer = '<footer style="padding:32px 48px;background:var(--fc-text, #0f172a);color:var(--fc-bg, #ffffff);opacity:0.85;font-family:Manrope,sans-serif;font-size:13px;text-align:center;">hello@devoncole.work</footer>'
    return _tpl(
        "starter-portfolio-creative",
        "Portfolio — Creative Grid",
        "Image-forward masonry portfolio for photographers, illustrators, and visual designers. Colors bind to whatever theme is applied.",
        "modern-portfolio-creative",
        "var(--fc-text, #0f172a)",
        ["Manrope"],
        html_blocks=[],
        pages=[
            _page("starter-portfolio-creative", "Home", "var(--fc-text, #0f172a)", ["Manrope"], [
                nav,
                '<section style="padding:72px 48px 40px;background:var(--fc-text, #0f172a);font-family:Manrope,sans-serif;color:var(--fc-bg, #ffffff);"><h1 style="font-size:38px;margin:0 0 8px;font-weight:700;">Devon Cole</h1><p style="font-size:15px;opacity:0.65;margin:0;">Illustration & motion, based in Portland</p></section>',
                '<section style="padding:0 48px 80px;background:var(--fc-text, #0f172a);font-family:Manrope,sans-serif;"><div style="max-width:1040px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);grid-auto-rows:20px;gap:14px;">' + "".join([f'<div style="grid-row:span {span};background:var(--fc-surface, #f8fafc);opacity:0.9;border-radius:8px;"></div>' for span in [17, 12, 12, 10, 17, 14]]) + '</div></section>',
                footer,
            ], seo={"title": "Devon Cole — Illustration & motion", "description": "Image-forward masonry portfolio."}, page_id="starter-portfolio-creative-home", slug="index"),
            _page("starter-portfolio-creative-about", "About", "var(--fc-text, #0f172a)", ["Manrope"], [
                nav,
                '<section style="padding:80px 48px;background:var(--fc-text, #0f172a);font-family:Manrope,sans-serif;color:var(--fc-bg, #ffffff);"><div style="max-width:560px;"><h1 style="font-size:32px;margin:0 0 18px;font-weight:700;">About</h1><p style="font-size:15px;line-height:1.75;opacity:0.7;margin:0;">Illustration and motion design for music, editorial, and the occasional storefront window. Based in Portland, working with clients everywhere. Previously in-house at a streaming platform, now solo since 2021.</p></div></section>',
                footer,
            ], seo={"title": "About — Devon Cole", "description": "Illustration and motion design since 2021."}, page_id="starter-portfolio-creative-about", slug="about"),
            _page("starter-portfolio-creative-contact", "Contact", "var(--fc-text, #0f172a)", ["Manrope"], [
                nav,
                '<section style="padding:80px 48px;background:var(--fc-text, #0f172a);font-family:Manrope,sans-serif;color:var(--fc-bg, #ffffff);text-align:center;"><div style="font-size:12px;text-transform:uppercase;letter-spacing:.06em;opacity:0.65;margin-bottom:10px;">Available for select projects</div><a href="mailto:hello@devoncole.work" style="font-size:22px;font-weight:700;color:var(--fc-bg, #ffffff);text-decoration:none;">hello@devoncole.work</a></section>',
                footer,
            ], seo={"title": "Contact — Devon Cole", "description": "Available for select projects."}, page_id="starter-portfolio-creative-contact", slug="contact"),
        ],
    )


def _starter_restaurant_bistro() -> Dict[str, Any]:
    nav = _simple_nav("Sora", "The Alder Room", [("Menu", "menu.html"), ("Reservations", "reservations.html")])
    footer = '<footer style="padding:32px 48px;background:var(--fc-bg, #ffffff);border-top:1px solid var(--fc-border, #e2e8f0);color:var(--fc-muted, #64748b);font-family:Sora,sans-serif;font-size:13px;text-align:center;">Tue-Sun 5pm-10pm · 214 Alder St · (503) 555-0148</footer>'
    return _tpl(
        "starter-restaurant-bistro",
        "Restaurant — Modern Bistro",
        "Split hero and menu with a textured accent panel, plus a reservation CTA. Colors bind to whatever theme is applied.",
        "modern-restaurant-bistro",
        "var(--fc-bg, #ffffff)",
        ["Fraunces", "Sora"],
        html_blocks=[],
        pages=[
            _page("starter-restaurant-bistro", "Home", "var(--fc-bg, #ffffff)", ["Fraunces", "Sora"], [
                nav,
                '<section style="padding:88px 48px;background:var(--fc-bg, #ffffff);font-family:Fraunces,serif;"><div style="max-width:1080px;margin:0 auto;display:grid;grid-template-columns:1.1fr 0.9fr;gap:56px;align-items:center;"><div><div style="font-family:Sora,sans-serif;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;color:var(--fc-muted, #64748b);margin-bottom:16px;">Est. 2019 · Neighborhood bistro</div><h1 style="font-size:48px;line-height:1.1;margin:0 0 20px;font-weight:500;color:var(--fc-text, #0f172a);">Seasonal, simple, cooked properly.</h1><a href="reservations.html" style="display:inline-block;padding:14px 30px;background:var(--fc-primary, #2563eb);color:#fff;border-radius:6px;text-decoration:none;font-family:Sora,sans-serif;font-weight:600;font-size:14px;">Reserve a table</a></div><div style="aspect-ratio:3/4;background:linear-gradient(160deg,var(--fc-surface, #f8fafc),var(--fc-border, #e2e8f0));border-radius:16px;"></div></div></section>',
                '<section style="padding:0 48px 88px;background:var(--fc-surface, #f8fafc);font-family:Fraunces,serif;"><div style="max-width:1080px;margin:0 auto;display:grid;grid-template-columns:1.2fr 0.8fr;gap:48px;align-items:start;"><div><h2 style="font-size:22px;margin:0 0 24px;font-weight:500;color:var(--fc-text, #0f172a);">From tonight\'s menu</h2>' + "".join([f'<div style="display:flex;justify-content:space-between;align-items:baseline;padding:14px 0;border-bottom:1px dashed var(--fc-border, #e2e8f0);"><div><div style="font-size:16px;color:var(--fc-text, #0f172a);">{t}</div><div style="font-family:Sora,sans-serif;font-size:12px;color:var(--fc-muted, #64748b);">{d}</div></div><div style="font-size:15px;color:var(--fc-text, #0f172a);">{p}</div></div>' for t, d, p in [("Roasted beet salad", "whipped feta, pistachio, mint", "$16"), ("Pan-seared trout", "brown butter, capers, charred lemon", "$29"), ("Brown butter tart", "toasted almond, sea salt", "$12")]]) + '</div><div style="aspect-ratio:4/5;background:linear-gradient(200deg,var(--fc-bg, #ffffff),var(--fc-border, #e2e8f0));border-radius:16px;"></div></div></section>',
                footer,
            ], seo={"title": "The Alder Room — Seasonal, simple, cooked properly", "description": "Split hero and tonight's menu with a reservation CTA."}, page_id="starter-restaurant-bistro-home", slug="index"),
            _page("starter-restaurant-bistro-menu", "Menu", "var(--fc-bg, #ffffff)", ["Fraunces", "Sora"], [
                nav,
                '<section style="padding:72px 48px 24px;background:var(--fc-bg, #ffffff);font-family:Fraunces,serif;text-align:center;"><h1 style="font-size:36px;margin:0 0 8px;font-weight:500;color:var(--fc-text, #0f172a);">Full menu</h1><p style="font-family:Sora,sans-serif;font-size:13px;color:var(--fc-muted, #64748b);margin:0;">Changes with the season and the market, most weeks.</p></section>',
                '<section style="padding:16px 48px 88px;background:var(--fc-bg, #ffffff);font-family:Fraunces,serif;"><div style="max-width:640px;margin:0 auto;">'
                + "".join([f'<div style="margin-bottom:28px;"><h2 style="font-size:18px;font-family:Sora,sans-serif;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--fc-muted, #64748b);margin:0 0 12px;">{course}</h2>'
                           + "".join([f'<div style="display:flex;justify-content:space-between;align-items:baseline;padding:12px 0;border-bottom:1px dashed var(--fc-border, #e2e8f0);"><div><div style="font-size:16px;color:var(--fc-text, #0f172a);">{t}</div><div style="font-family:Sora,sans-serif;font-size:12px;color:var(--fc-muted, #64748b);">{d}</div></div><div style="font-size:15px;color:var(--fc-text, #0f172a);">{p}</div></div>' for t, d, p in items])
                           + '</div>'
                           for course, items in [
                               ("Starters", [("Roasted beet salad", "whipped feta, pistachio, mint", "$16"), ("Charred octopus", "white bean puree, chili oil", "$19")]),
                               ("Mains", [("Pan-seared trout", "brown butter, capers, charred lemon", "$29"), ("Braised short rib", "celery root puree, red wine jus", "$34"), ("Wild mushroom risotto", "parmesan, thyme", "$24")]),
                               ("Desserts", [("Brown butter tart", "toasted almond, sea salt", "$12"), ("Olive oil cake", "citrus, mascarpone", "$11")]),
                           ]])
                + '</div></section>',
                footer,
            ], seo={"title": "Menu — The Alder Room", "description": "Starters, mains, and desserts — changes with the season."}, page_id="starter-restaurant-bistro-menu", slug="menu"),
            _page("starter-restaurant-bistro-reservations", "Reservations", "var(--fc-bg, #ffffff)", ["Fraunces", "Sora"], [
                nav,
                '<section style="padding:80px 48px;background:var(--fc-bg, #ffffff);font-family:Fraunces,serif;text-align:center;"><div style="max-width:520px;margin:0 auto;"><h1 style="font-size:32px;margin:0 0 14px;font-weight:500;color:var(--fc-text, #0f172a);">Reserve a table</h1><p style="font-family:Sora,sans-serif;font-size:14px;line-height:1.7;color:var(--fc-muted, #64748b);margin:0 0 24px;">Call or email us directly — we hold most tables the same day.</p><a href="tel:+15035550148" style="display:inline-block;padding:14px 30px;background:var(--fc-primary, #2563eb);color:#fff;border-radius:6px;text-decoration:none;font-family:Sora,sans-serif;font-weight:600;font-size:14px;">(503) 555-0148</a><div style="font-family:Sora,sans-serif;font-size:13px;color:var(--fc-muted, #64748b);margin-top:20px;">Tue-Sun 5pm-10pm · 214 Alder St</div></div></section>',
                footer,
            ], seo={"title": "Reservations — The Alder Room", "description": "Call or email to reserve a table."}, page_id="starter-restaurant-bistro-reservations", slug="reservations"),
        ],
    )


def _starter_service_business() -> Dict[str, Any]:
    nav = _simple_nav("'Plus Jakarta Sans'", "Marrow & Vale Studio", [("Services", "services.html"), ("About", "about.html")], cta=("Book now", "#"))
    footer = '<footer style="padding:32px 48px;background:var(--fc-surface, #f8fafc);color:var(--fc-muted, #64748b);font-family:\'Plus Jakarta Sans\',sans-serif;font-size:13px;text-align:center;">Mon-Fri 9am-6pm, Sat 10am-2pm · 88 Harbor Ave</footer>'
    return _tpl(
        "starter-service-business",
        "Service Business",
        "Split hero with a schedule preview, services list with price and duration. Colors bind to whatever theme is applied.",
        "modern-service-business",
        "var(--fc-bg, #ffffff)",
        ["Plus Jakarta Sans"],
        html_blocks=[],
        pages=[
            _page("starter-service-business", "Home", "var(--fc-bg, #ffffff)", ["Plus Jakarta Sans"], [
                nav,
                '<section style="padding:88px 48px;background:var(--fc-bg, #ffffff);font-family:\'Plus Jakarta Sans\',sans-serif;"><div style="max-width:1080px;margin:0 auto;display:grid;grid-template-columns:1.1fr 0.9fr;gap:56px;align-items:center;"><div><div style="font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:var(--fc-muted, #64748b);margin-bottom:16px;">Marrow & Vale Studio</div><h1 style="font-size:40px;line-height:1.12;margin:0 0 16px;font-weight:700;color:var(--fc-text, #0f172a);">Same-week availability, most Saturdays included.</h1><p style="font-size:15px;color:var(--fc-muted, #64748b);margin:0 0 28px;max-width:420px;">Pick a time that actually works and we will hold it — no back-and-forth over email.</p><a href="services.html" style="display:inline-block;padding:14px 30px;background:var(--fc-primary, #2563eb);color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Book now</a></div>'
                '<div style="background:var(--fc-surface, #f8fafc);border:1px solid var(--fc-border, #e2e8f0);border-radius:16px;padding:22px;">' + "".join([f'<div style="display:flex;justify-content:space-between;padding:11px 0;{"border-bottom:1px solid var(--fc-border, #e2e8f0);" if i < 2 else ""}"><span style="font-size:13px;color:var(--fc-text, #0f172a);">{d}</span><span style="font-size:13px;color:var(--fc-muted, #64748b);">{s}</span></div>' for i, (d, s) in enumerate([("Thu 14", "3 slots open"), ("Fri 15", "1 slot open"), ("Sat 16", "5 slots open")])]) + '</div></div></section>',
                footer,
            ], seo={"title": "Marrow & Vale Studio — Same-week availability", "description": "Split hero with a schedule preview and services list."}, page_id="starter-service-business-home", slug="index"),
            _page("starter-service-business-services", "Services", "var(--fc-bg, #ffffff)", ["Plus Jakarta Sans"], [
                nav,
                '<section style="padding:72px 48px 24px;background:var(--fc-bg, #ffffff);font-family:\'Plus Jakarta Sans\',sans-serif;"><h1 style="font-size:32px;margin:0 0 8px;font-weight:700;color:var(--fc-text, #0f172a);">Services & pricing</h1><p style="font-size:14px;color:var(--fc-muted, #64748b);margin:0;">Every session includes a follow-up summary within 24 hours.</p></section>',
                '<section style="padding:16px 48px 88px;background:var(--fc-bg, #ffffff);font-family:\'Plus Jakarta Sans\',sans-serif;"><div style="max-width:640px;margin:0 auto;">' + "".join([f'<div style="display:flex;justify-content:space-between;align-items:center;padding:20px 0;border-bottom:1px solid var(--fc-border, #e2e8f0);"><div><div style="font-size:16px;font-weight:600;color:var(--fc-text, #0f172a);">{t}</div><div style="font-size:13px;color:var(--fc-muted, #64748b);">{d}</div></div><div style="display:flex;align-items:center;gap:16px;"><div style="font-size:16px;color:var(--fc-text, #0f172a);">{p}</div><a href="#" style="padding:8px 16px;background:var(--fc-primary, #2563eb);color:#fff;border-radius:6px;text-decoration:none;font-weight:600;font-size:12px;">Book</a></div></div>' for t, d, p in [("Initial consultation", "45 min", "$65"), ("Standard session", "60 min", "$95"), ("Extended session", "90 min", "$135"), ("Follow-up", "30 min", "$45")]]) + '</div></section>',
                footer,
            ], seo={"title": "Services — Marrow & Vale Studio", "description": "Session lengths, pricing, and same-week booking."}, page_id="starter-service-business-services", slug="services"),
            _page("starter-service-business-about", "About", "var(--fc-bg, #ffffff)", ["Plus Jakarta Sans"], [
                nav,
                '<section style="padding:80px 48px;background:var(--fc-bg, #ffffff);font-family:\'Plus Jakarta Sans\',sans-serif;"><div style="max-width:600px;"><h1 style="font-size:32px;margin:0 0 18px;font-weight:700;color:var(--fc-text, #0f172a);">About Marrow & Vale</h1><p style="font-size:15px;line-height:1.75;color:var(--fc-muted, #64748b);margin:0;">A two-practitioner studio on Harbor Ave, open since 2020. We keep the schedule small on purpose so every session is with someone who already knows your history, not whoever is free that day.</p></div></section>',
                footer,
            ], seo={"title": "About — Marrow & Vale Studio", "description": "A two-practitioner studio, open since 2020."}, page_id="starter-service-business-about", slug="about"),
        ],
    )


def _starter_blog() -> Dict[str, Any]:
    nav = '<header style="padding:28px 32px;background:#faf9f6;border-bottom:1px solid #e7e2d8;font-family:Inter,sans-serif;display:flex;align-items:center;justify-content:space-between;"><a href="index.html" style="font-family:Fraunces,serif;font-size:22px;font-weight:600;color:#1c1917;text-decoration:none;">The Long Way Round</a><nav style="display:flex;gap:24px;font-size:14px;color:#57534e;"><a href="index.html" style="color:#1c1917;text-decoration:none;font-weight:600;">Home</a><a href="archive.html" style="color:#57534e;text-decoration:none;">Archive</a><a href="about.html" style="color:#57534e;text-decoration:none;">About</a></nav></header>'
    footer = '<footer style="padding:28px 32px;background:#1c1917;color:#a8a29e;font-family:Inter,sans-serif;font-size:13px;display:flex;justify-content:space-between;"><span>© 2026 The Long Way Round</span><span>RSS · <a href="about.html" style="color:#a8a29e;">About</a></span></footer>'
    posts = [
        ("Feb 26, 2026", "writing", "The one-paragraph rule I use for every draft", "If the idea can\'t survive being compressed to one paragraph, it isn\'t ready to be an article yet — a filter that\'s saved me more time than any outline template."),
        ("Feb 18, 2026", "tools", "I deleted my task manager and nothing broke", "A month-long experiment in running a whole freelance practice off a single text file, and the two things I quietly rebuilt anyway."),
        ("Feb 9, 2026", "process", "Slow is a feature, not a bug", "Why the projects I\'m proudest of all had a period where nothing visible happened for weeks — and how to tell that apart from actually being stuck."),
        ("Jan 30, 2026", "writing", "Editing is just reading like a stranger", "The single habit that improved my drafts more than any style guide: reading them twelve hours later, out loud, pretending someone else wrote them."),
        ("Jan 19, 2026", "process", "The best meetings I have ever run had no agenda", "A case against agendas for small, trusted teams — and the one structural thing that replaced them."),
        ("Jan 8, 2026", "tools", "Why I still keep a paper notebook in 2026", "Not nostalgia. A specific, boring reason involving context-switching cost."),
    ]
    return _tpl(
        "starter-blog",
        "Blog",
        "A clean, readable editorial blog — featured post, recent posts, and working comments.",
        "blog",
        "#faf9f6",
        ["Fraunces", "Inter"],
        html_blocks=[],
        pages=[
            _page("starter-blog", "Home", "#faf9f6", ["Fraunces", "Inter"], [
                nav,
                '<section style="padding:64px 32px 48px;background:#faf9f6;font-family:Inter,sans-serif;"><div style="max-width:720px;margin:0 auto;"><div style="font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#b45309;font-weight:600;margin-bottom:12px;">Featured</div><h1 style="font-family:Fraunces,serif;font-size:44px;line-height:1.15;margin:0 0 16px;color:#1c1917;font-weight:500;">What nobody tells you about shipping the first version</h1><p style="font-size:12px;color:#78716c;margin:0 0 20px;">March 4, 2026 · 7 min read · #process</p><p style="font-size:18px;line-height:1.75;color:#3f3c37;margin:0 0 16px;">Every version-one product looks like a compromise from the inside and a decision from the outside. The gap between those two views is where most of the anxiety lives — and almost none of it is visible to the people using what you built.</p><p style="font-size:18px;line-height:1.75;color:#3f3c37;margin:0 0 24px;">Three things I wish someone had told me before I shipped mine, in order of how expensive they were to learn.</p><a href="post.html" style="font-size:15px;font-weight:600;color:#b45309;text-decoration:none;">Continue reading →</a></div></section>',
                '<section style="padding:16px 32px 64px;background:#faf9f6;font-family:Inter,sans-serif;"><div style="max-width:720px;margin:0 auto;"><h2 style="font-family:Fraunces,serif;font-size:22px;color:#1c1917;font-weight:600;margin:0 0 24px;padding-top:24px;border-top:1px solid #e7e2d8;">Recent posts</h2>'
                + "".join([f'<article style="padding:20px 0;border-bottom:1px solid #e7e2d8;"><p style="font-size:12px;color:#78716c;margin:0 0 6px;">{d} · #{tag}</p><h3 style="font-family:Fraunces,serif;font-size:20px;font-weight:600;margin:0 0 8px;color:#1c1917;"><a href="post.html" style="color:inherit;text-decoration:none;">{t}</a></h3><p style="font-size:15px;line-height:1.65;color:#57534e;margin:0;">{ex}</p></article>' for d, tag, t, ex in posts[:3]]) + f'<div style="padding-top:20px;"><a href="archive.html" style="font-size:14px;font-weight:600;color:#b45309;text-decoration:none;">See all posts →</a></div></div></section>',
                '<section style="padding:40px 32px 72px;background:#f3f0e9;font-family:Inter,sans-serif;text-align:center;"><h2 style="font-family:Fraunces,serif;font-size:24px;margin:0 0 8px;color:#1c1917;">Get new posts by email</h2><p style="font-size:14px;color:#57534e;margin:0 0 20px;">No spam, just writing — unsubscribe whenever.</p><form style="display:flex;gap:8px;max-width:380px;margin:0 auto;"><input type="email" placeholder="you@example.com" style="flex:1;padding:12px 14px;border-radius:8px;border:1px solid #d6d0c4;font-size:14px;outline:none;"><button type="submit" style="padding:12px 22px;background:#1c1917;color:#faf9f6;border:0;border-radius:8px;font-weight:600;cursor:pointer;font-size:14px;">Subscribe</button></form></section>',
                footer,
            ], seo={"title": "The Long Way Round", "description": "A clean, readable editorial blog."}, page_id="starter-blog-home", slug="index"),
            _page("starter-blog-archive", "Archive", "#faf9f6", ["Fraunces", "Inter"], [
                nav,
                '<section style="padding:64px 32px 24px;background:#faf9f6;font-family:Inter,sans-serif;"><div style="max-width:720px;margin:0 auto;"><h1 style="font-family:Fraunces,serif;font-size:36px;margin:0 0 8px;color:#1c1917;font-weight:500;">Archive</h1><p style="font-size:14px;color:#78716c;margin:0;">Every post, in order.</p></div></section>',
                '<section style="padding:0 32px 72px;background:#faf9f6;font-family:Inter,sans-serif;"><div style="max-width:720px;margin:0 auto;">'
                + "".join([f'<a href="post.html" style="display:flex;justify-content:space-between;gap:16px;padding:16px 0;border-bottom:1px solid #e7e2d8;text-decoration:none;"><span style="font-family:Fraunces,serif;font-size:16px;color:#1c1917;">{t}</span><span style="font-size:12px;color:#78716c;flex:none;">{d}</span></a>' for d, tag, t, ex in posts])
                + '</div></section>',
                footer,
            ], seo={"title": "Archive — The Long Way Round", "description": "Every post, in order."}, page_id="starter-blog-archive", slug="archive"),
            _page("starter-blog-post", "Post", "#faf9f6", ["Fraunces", "Inter"], [
                nav,
                '<section style="padding:56px 32px 24px;background:#faf9f6;font-family:Inter,sans-serif;"><div style="max-width:680px;margin:0 auto;"><p style="font-size:12px;color:#78716c;margin:0 0 12px;">March 4, 2026 · 7 min read · #process</p><h1 style="font-family:Fraunces,serif;font-size:38px;line-height:1.2;margin:0;color:#1c1917;font-weight:500;">What nobody tells you about shipping the first version</h1></div></section>',
                '<section style="padding:0 32px 56px;background:#faf9f6;font-family:Inter,sans-serif;"><div style="max-width:680px;margin:0 auto;font-size:18px;line-height:1.8;color:#3f3c37;">'
                '<p style="margin:0 0 20px;">Every version-one product looks like a compromise from the inside and a decision from the outside. The gap between those two views is where most of the anxiety lives — and almost none of it is visible to the people using what you built.</p>'
                '<p style="margin:0 0 20px;">Three things I wish someone had told me before I shipped mine, in order of how expensive they were to learn.</p>'
                '<p style="margin:0 0 20px;"><strong style="color:#1c1917;">First: nobody is grading the parts you agonized over.</strong> The onboarding flow you rewrote four times gets a glance. The one edge case you never got to is the thing someone actually hits on day one.</p>'
                '<p style="margin:0;"><strong style="color:#1c1917;">Second: the feedback that matters arrives late, not loud.</strong> The loud feedback in the first 48 hours is rarely the feedback that changes the roadmap six weeks in.</p>'
                '</div></section>',
                _comments_section(
                    [
                        {"id": 1, "author": "Devon R.", "date": "3 hours ago", "text": "The one-paragraph rule is stealing this immediately. I\'ve been outlining my way into paralysis for months."},
                        {"id": 2, "author": "Anaya P.", "date": "5 hours ago", "text": "\"a decision from the outside\" is such a precise way to put it. Bookmarking this to send to my cofounder."},
                    ],
                    wrap_style="font-family:Inter,sans-serif;padding:8px 32px 72px;background:#faf9f6;",
                    heading_style="font-family:Fraunces,serif;font-size:20px;margin:0 0 16px;color:#1c1917;",
                ),
                footer,
            ], seo={"title": "What nobody tells you about shipping the first version", "description": "Three things I wish someone had told me before I shipped mine."}, page_id="starter-blog-post", slug="post"),
            _page("starter-blog-about", "About", "#faf9f6", ["Fraunces", "Inter"], [
                nav,
                '<section style="padding:80px 32px;background:#faf9f6;font-family:Inter,sans-serif;"><div style="max-width:600px;margin:0 auto;"><h1 style="font-family:Fraunces,serif;font-size:34px;margin:0 0 20px;color:#1c1917;font-weight:500;">About</h1><p style="font-size:16px;line-height:1.75;color:#3f3c37;margin:0 0 16px;">I write about process, tools, and the unglamorous middle of shipping things — mostly software, occasionally furniture. One post every week or two, no fixed schedule.</p><p style="font-size:16px;line-height:1.75;color:#3f3c37;margin:0;">Say hello: <a href="mailto:hello@thelongwayround.blog" style="color:#b45309;">hello@thelongwayround.blog</a></p></div></section>',
                footer,
            ], seo={"title": "About — The Long Way Round", "description": "Writing about process, tools, and shipping things."}, page_id="starter-blog-about", slug="about"),
        ],
    )


def _starter_xanga() -> Dict[str, Any]:
    nav = '<header style="padding:0;font-family:\'Comic Neue\',cursive;"><div style="background:linear-gradient(135deg,#1fb6b6 0%,#5a4fcf 100%);padding:36px 32px;color:#fff;"><a href="index.html" style="display:block;font-size:34px;font-weight:700;text-shadow:2px 2px 0 rgba(0,0,0,0.15);color:#fff;text-decoration:none;">✿ stardust diaries ✿</a><div style="font-size:13px;opacity:0.9;font-family:\'Nunito Sans\',sans-serif;margin-top:4px;">est. 2004 · site #4,281,902 · currently obsessed with: iced coffee</div></div><nav style="background:#0d3b3b;padding:10px 32px;display:flex;gap:18px;font-family:\'Nunito Sans\',sans-serif;font-size:13px;"><a href="index.html" style="color:#9ff0f0;text-decoration:none;font-weight:700;">Home</a><a href="archive.html" style="color:#cdeeee;text-decoration:none;">Archive</a><a href="subscriptions.html" style="color:#cdeeee;text-decoration:none;">Subscriptions</a><a href="about.html" style="color:#cdeeee;text-decoration:none;">About Me</a></nav></header>'
    footer = '<footer style="padding:20px 32px;background:#0d3b3b;color:#9ff0f0;font-family:\'Nunito Sans\',sans-serif;font-size:12px;text-align:center;">✿ stardust diaries · powered by nothing but vibes ✿</footer>'
    return _tpl(
        "starter-xanga-throwback",
        "Xanga Throwback",
        "A faithful 2000s Xanga-style journal — mood icons, eProps, a music widget, and working comments.",
        "xanga-throwback",
        "#eef7f7",
        ["Comic Neue", "Nunito Sans"],
        html_blocks=[],
        pages=[
            _page("starter-xanga-throwback", "Home", "#eef7f7", ["Comic Neue", "Nunito Sans"], [
                nav,
                '<section style="padding:32px;background:#eef7f7;font-family:\'Nunito Sans\',sans-serif;"><div style="display:grid;grid-template-columns:1fr 260px;gap:24px;max-width:1000px;margin:0 auto;align-items:start;"><div style="background:#fff;border:2px solid #1fb6b6;border-radius:14px;padding:24px;box-shadow:4px 4px 0 rgba(31,182,182,0.25);"><div style="font-family:\'Comic Neue\',cursive;font-size:22px;font-weight:700;color:#0d3b3b;">omg it\'s finally spring break!!</div><div style="font-size:12px;color:#5a4fcf;margin:6px 0 14px;">posted march 14 · current mood: <strong>ecstatic ✧</strong> · listening to: paramore</div><p style="font-size:14px;line-height:1.7;color:#264d4d;margin:0 0 14px;">okay so i KNOW i said i was gonna study over break but that is not happening. me and jules are doing absolutely nothing for a week straight and i have never been more excited for anything in my life. gonna update with pics later i promise!!</p><div style="display:flex;align-items:center;gap:14px;padding-top:12px;border-top:1px dashed #b8e0e0;"><button style="background:#ffd23f;border:2px solid #0d3b3b;border-radius:999px;padding:6px 16px;font-family:\'Comic Neue\',cursive;font-weight:700;font-size:13px;color:#0d3b3b;cursor:pointer;">☆ eProps (12)</button><span style="font-size:12px;color:#5a4fcf;">2 comments</span></div></div><div style="display:flex;flex-direction:column;gap:16px;"><div style="background:#fff;border:2px solid #5a4fcf;border-radius:14px;padding:16px;box-shadow:3px 3px 0 rgba(90,79,207,0.2);"><div style="width:64px;height:64px;border-radius:12px;background:linear-gradient(135deg,#ffd23f,#ff8fab);margin:0 auto 10px;"></div><div style="text-align:center;font-family:\'Comic Neue\',cursive;font-weight:700;color:#0d3b3b;">stardustgirl04</div><div style="text-align:center;font-size:11px;color:#78716c;margin-top:2px;">17 · Ohio · loves: paramore, thrifting, iced coffee</div></div><div style="background:#0d3b3b;border-radius:14px;padding:14px 16px;color:#cdeeee;"><div style="font-family:\'Comic Neue\',cursive;font-weight:700;font-size:13px;color:#9ff0f0;margin-bottom:4px;">♫ now playing</div><div style="font-size:13px;">Misery Business — Paramore</div></div><div style="background:#fff;border:2px solid #1fb6b6;border-radius:14px;padding:14px 16px;"><div style="font-family:\'Comic Neue\',cursive;font-weight:700;font-size:13px;color:#0d3b3b;margin-bottom:8px;">subscriptions</div>' + "".join([f'<div style="font-size:12px;color:#264d4d;padding:3px 0;">→ {n}</div>' for n in ["glitterxheart", "moonchild_diary", "punkrockprincess"]]) + '<a href="subscriptions.html" style="display:block;margin-top:6px;font-size:11px;color:#5a4fcf;">see all →</a></div><div style="display:flex;gap:6px;flex-wrap:wrap;">' + "".join([f'<div style="width:88px;height:31px;background:{c};border:1px solid #0d3b3b;border-radius:3px;"></div>' for c in ["#ffd23f", "#ff8fab", "#9ff0f0"]]) + '</div></div></div></section>',
                _comments_section(
                    [
                        {"id": 1, "author": "glitterxheart", "mood": "jealous lol", "date": "2 hours ago", "text": "NO WAY have fun i\'m so jealous, take pics of everything!!"},
                        {"id": 2, "author": "moonchild_diary", "mood": "happy for u", "date": "1 hour ago", "text": "eProps sent!! spring break masterlist when"},
                    ],
                    wrap_style="font-family:\'Nunito Sans\',sans-serif;padding:8px 32px 48px;background:#eef7f7;",
                    heading_style="font-family:\'Comic Neue\',cursive;font-size:18px;margin:0 0 14px;color:#0d3b3b;",
                ),
                footer,
            ], seo={"title": "stardust diaries", "description": "A faithful 2000s Xanga-style journal."}, page_id="starter-xanga-throwback-home", slug="index"),
            _page("starter-xanga-throwback-archive", "Archive", "#eef7f7", ["Comic Neue", "Nunito Sans"], [
                nav,
                '<section style="padding:32px;background:#eef7f7;font-family:\'Nunito Sans\',sans-serif;"><div style="max-width:640px;margin:0 auto;"><div style="font-family:\'Comic Neue\',cursive;font-size:24px;font-weight:700;color:#0d3b3b;margin-bottom:16px;">old entries</div>'
                + "".join([f'<div style="background:#fff;border:2px solid #1fb6b6;border-radius:10px;padding:14px 18px;margin-bottom:10px;"><div style="font-size:11px;color:#5a4fcf;margin-bottom:2px;">{d} · mood: {m}</div><div style="font-family:\'Comic Neue\',cursive;font-weight:700;color:#0d3b3b;">{t}</div></div>' for d, m, t in [
                    ("march 7", "sleepy", "why does chemistry hate me specifically"),
                    ("february 26", "hyped", "TICKETS TO THE SHOW OMGGG"),
                    ("february 19", "meh", "nothing to report, just vibes"),
                    ("february 11", "crushed", "he liked her status not mine. cool. cool cool cool"),
                ]]) + '</div></section>',
                footer,
            ], seo={"title": "Archive — stardust diaries", "description": "Old entries from stardust diaries."}, page_id="starter-xanga-throwback-archive", slug="archive"),
            _page("starter-xanga-throwback-subscriptions", "Subscriptions", "#eef7f7", ["Comic Neue", "Nunito Sans"], [
                nav,
                '<section style="padding:32px;background:#eef7f7;font-family:\'Nunito Sans\',sans-serif;"><div style="max-width:520px;margin:0 auto;"><div style="font-family:\'Comic Neue\',cursive;font-size:24px;font-weight:700;color:#0d3b3b;margin-bottom:16px;">who i\'m subscribed to</div>'
                + "".join([f'<div style="display:flex;align-items:center;gap:12px;background:#fff;border:2px solid #5a4fcf;border-radius:10px;padding:10px 14px;margin-bottom:8px;"><div style="width:36px;height:36px;border-radius:8px;background:linear-gradient(135deg,{c1},{c2});flex:none;"></div><div><div style="font-family:\'Comic Neue\',cursive;font-weight:700;color:#0d3b3b;font-size:13px;">{n}</div><div style="font-size:11px;color:#78716c;">{d}</div></div></div>' for n, d, c1, c2 in [
                    ("glitterxheart", "last updated 2 hours ago", "#ffd23f", "#ff8fab"),
                    ("moonchild_diary", "last updated yesterday", "#9ff0f0", "#5a4fcf"),
                    ("punkrockprincess", "last updated 3 days ago", "#ff8fab", "#1fb6b6"),
                ]]) + '</div></section>',
                footer,
            ], seo={"title": "Subscriptions — stardust diaries", "description": "Blogs I follow."}, page_id="starter-xanga-throwback-subscriptions", slug="subscriptions"),
            _page("starter-xanga-throwback-about", "About Me", "#eef7f7", ["Comic Neue", "Nunito Sans"], [
                nav,
                '<section style="padding:32px;background:#eef7f7;font-family:\'Nunito Sans\',sans-serif;"><div style="max-width:420px;margin:0 auto;background:#fff;border:2px solid #5a4fcf;border-radius:14px;padding:20px;text-align:center;"><div style="width:80px;height:80px;border-radius:16px;background:linear-gradient(135deg,#ffd23f,#ff8fab);margin:0 auto 12px;"></div><div style="font-family:\'Comic Neue\',cursive;font-weight:700;font-size:18px;color:#0d3b3b;">stardustgirl04</div><div style="font-size:12px;color:#78716c;margin-top:4px;">17 · Ohio · loves: paramore, thrifting, iced coffee</div><p style="font-size:13px;color:#264d4d;margin-top:14px;line-height:1.6;">this is my corner of the internet since 2004. mostly here for the drama-free vibes and the good midi files. add me if we have mutuals!!</p></div></section>',
                footer,
            ], seo={"title": "About Me — stardust diaries", "description": "About stardustgirl04."}, page_id="starter-xanga-throwback-about", slug="about"),
        ],
    )


def _starter_livejournal() -> Dict[str, Any]:
    nav = '<header style="background:#3b3480;padding:0;font-family:Verdana,sans-serif;"><div style="padding:16px 32px;display:flex;align-items:center;justify-content:space-between;"><a href="index.html" style="color:#fff;font-size:20px;font-weight:bold;text-decoration:none;">wanderer_notes</a><nav style="display:flex;gap:16px;font-size:12px;"><a href="index.html" style="color:#c9c4f0;text-decoration:none;">Recent Entries</a><a href="friends.html" style="color:#c9c4f0;text-decoration:none;">Friends</a><a href="archive.html" style="color:#c9c4f0;text-decoration:none;">Archive</a><a href="profile.html" style="color:#c9c4f0;text-decoration:none;">Profile</a></nav></div></header>'
    footer = '<footer style="padding:18px 32px;background:#2b2560;color:#a89fe0;font-family:Verdana,sans-serif;font-size:11px;text-align:center;">wanderer_notes — powered by nothing in particular, hosted somewhere quiet</footer>'
    return _tpl(
        "starter-livejournal-throwback",
        "LiveJournal Throwback",
        "A faithful LiveJournal-style journal — userpics, current mood/music, tags, and working comments.",
        "livejournal-throwback",
        "#ffffff",
        ["Georgia", "Verdana"],
        html_blocks=[],
        pages=[
            _page("starter-livejournal-throwback", "Recent Entries", "#ffffff", ["Georgia", "Verdana"], [
                nav,
                '<section style="padding:28px 32px;background:#ffffff;font-family:Georgia,serif;"><div style="max-width:940px;margin:0 auto;display:grid;grid-template-columns:1fr 220px;gap:32px;align-items:start;">'
                '<div style="display:grid;grid-template-columns:56px 1fr;gap:16px;padding-bottom:24px;border-bottom:1px solid #e0ddf0;"><div style="width:56px;height:56px;border-radius:4px;background:linear-gradient(135deg,#5a4fcf,#8b7fe0);flex:none;"></div><div><div style="font-family:Verdana,sans-serif;font-size:12px;color:#5a4fcf;margin-bottom:2px;"><strong style="color:#2b2560;">wanderer_notes</strong> wrote,</div><div style="font-family:Verdana,sans-serif;font-size:11px;color:#78716c;margin-bottom:10px;">@ 09:41 pm · current mood: <em>reflective</em> · current music: <em>Bon Iver — Holocene</em></div><h2 style="font-size:22px;margin:0 0 10px;color:#1c1a33;">the apartment finally feels like mine</h2><p style="font-size:15px;line-height:1.75;color:#2e2b45;margin:0 0 10px;">Six months in and I hung the last picture frame tonight, which is apparently the threshold at which a place stops being "where I\'m staying" and starts being "where I live." Small thing. Took longer than it should have to notice it happened.</p><p style="font-size:15px;line-height:1.75;color:#2e2b45;margin:0 0 14px;">Making tea in a kitchen that has opinions about where the mugs go now. I don\'t know when that started either.</p><div style="font-family:Verdana,sans-serif;font-size:11px;color:#5a4fcf;">Tags: home, small-things, quiet</div></div></div>'
                '<div style="display:flex;flex-direction:column;gap:14px;font-family:Verdana,sans-serif;"><div style="border:1px solid #e0ddf0;border-radius:6px;padding:14px;"><div style="font-size:11px;font-weight:bold;color:#2b2560;margin-bottom:8px;">FRIENDS</div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;">' + "".join([f'<div style="aspect-ratio:1;border-radius:3px;background:{c};"></div>' for c in ["#5a4fcf", "#8b7fe0", "#c9c4f0", "#3b3480", "#8b7fe0", "#5a4fcf", "#c9c4f0", "#3b3480"]]) + '</div><a href="friends.html" style="display:block;margin-top:8px;font-size:11px;color:#5a4fcf;">view all friends →</a></div><div style="border:1px solid #e0ddf0;border-radius:6px;padding:14px;"><div style="font-size:11px;font-weight:bold;color:#2b2560;margin-bottom:8px;">MARCH 2026</div><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;font-size:10px;text-align:center;color:#78716c;">' + "".join([f'<div style="{"background:#5a4fcf;color:#fff;border-radius:2px;" if d==14 else ""}padding:2px 0;">{d if d else ""}</div>' for d in ([0,0]+list(range(1,32)))]) + '</div></div><div style="border:1px solid #e0ddf0;border-radius:6px;padding:14px;font-size:11px;color:#57534e;">Member since 2019 · 412 entries · <a href="profile.html" style="color:#5a4fcf;">view profile</a></div></div>'
                '</div></section>',
                _comments_section(
                    [
                        {"id": 1, "author": "quietmornings", "date": "1 hour ago", "text": "the mug thing got me right in the chest, apartments really do decide these things for you eventually"},
                        {"id": 2, "author": "faraway_kate", "date": "40 minutes ago", "text": "this is such a lovely small entry. hope the tea was good"},
                    ],
                    wrap_style="font-family:Georgia,serif;padding:8px 32px 48px;background:#ffffff;",
                    heading_style="font-family:Verdana,sans-serif;font-size:13px;font-weight:bold;color:#2b2560;margin:0 0 14px;text-transform:uppercase;letter-spacing:0.05em;",
                ),
                footer,
            ], seo={"title": "wanderer_notes", "description": "A faithful LiveJournal-style journal."}, page_id="starter-livejournal-throwback-home", slug="index"),
            _page("starter-livejournal-throwback-archive", "Archive", "#ffffff", ["Georgia", "Verdana"], [
                nav,
                '<section style="padding:28px 32px;background:#ffffff;font-family:Georgia,serif;"><div style="max-width:680px;margin:0 auto;"><h1 style="font-size:22px;color:#1c1a33;margin:0 0 20px;">Entry archive</h1>'
                + "".join([f'<div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #e0ddf0;font-family:Verdana,sans-serif;font-size:12px;"><span style="color:#1c1a33;">{t}</span><span style="color:#78716c;">{d}</span></div>' for d, t in [
                    ("Feb 28", "the downstairs neighbor and the piano"),
                    ("Feb 21", "grocery list poetry, again"),
                    ("Feb 12", "a whole Saturday with nothing scheduled"),
                    ("Feb 3", "on finally finishing that book"),
                ]]) + '</div></section>',
                footer,
            ], seo={"title": "Archive — wanderer_notes", "description": "Past entries."}, page_id="starter-livejournal-throwback-archive", slug="archive"),
            _page("starter-livejournal-throwback-friends", "Friends", "#ffffff", ["Georgia", "Verdana"], [
                nav,
                '<section style="padding:28px 32px;background:#ffffff;font-family:Verdana,sans-serif;"><div style="max-width:600px;margin:0 auto;"><h1 style="font-size:18px;color:#1c1a33;margin:0 0 20px;font-family:Georgia,serif;">Friends</h1><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">' + "".join([f'<div><div style="aspect-ratio:1;border-radius:4px;background:{c};margin-bottom:4px;"></div><div style="font-size:10px;color:#57534e;text-align:center;">{n}</div></div>' for c, n in [("#5a4fcf", "quietmornings"), ("#8b7fe0", "faraway_kate"), ("#c9c4f0", "salt_and_pine"), ("#3b3480", "amber.exe")]]) + '</div></div></section>',
                footer,
            ], seo={"title": "Friends — wanderer_notes", "description": "Friends list."}, page_id="starter-livejournal-throwback-friends", slug="friends"),
            _page("starter-livejournal-throwback-profile", "Profile", "#ffffff", ["Georgia", "Verdana"], [
                nav,
                '<section style="padding:28px 32px;background:#ffffff;font-family:Verdana,sans-serif;"><div style="max-width:480px;margin:0 auto;border:1px solid #e0ddf0;border-radius:6px;padding:20px;"><div style="width:56px;height:56px;border-radius:4px;background:linear-gradient(135deg,#5a4fcf,#8b7fe0);margin-bottom:12px;"></div><div style="font-family:Georgia,serif;font-size:18px;color:#1c1a33;">wanderer_notes</div><div style="font-size:11px;color:#57534e;margin-top:8px;line-height:1.8;">Member since 2019<br>412 entries<br>Currently: somewhere with decent light and worse wifi</div></div></section>',
                footer,
            ], seo={"title": "Profile — wanderer_notes", "description": "Member profile."}, page_id="starter-livejournal-throwback-profile", slug="profile"),
        ],
    )


def _starter_myspace() -> Dict[str, Any]:
    nav = '<header style="background:#000000;font-family:Arial,sans-serif;"><div style="background:linear-gradient(180deg,#003399,#001a66);padding:10px 24px;display:flex;align-items:center;justify-content:space-between;"><a href="index.html" style="color:#fff;font-size:22px;font-weight:bold;font-style:italic;text-decoration:none;">myspace.</a><nav style="display:flex;gap:14px;font-size:11px;">' + "".join([f'<a href="{href}" style="color:#cfe0ff;text-decoration:none;">{l}</a>' for l, href in [("Home", "index.html"), ("Browse", "#"), ("Search", "#"), ("Blog", "blog.html"), ("Comments", "comments.html")]]) + '</nav></div><div style="background:#001a66;color:#9db8e8;font-size:10px;padding:4px 24px;">You have 3 new friend requests and 12 new comments.</div></header>'
    footer = '<footer style="padding:16px 24px;background:#001a66;color:#88aadd;font-family:Arial,sans-serif;font-size:10px;text-align:center;">myspace throwback · a place for friends</footer>'
    return _tpl(
        "starter-myspace-throwback",
        "MySpace Throwback",
        "A faithful mid-2000s MySpace-style profile — Top 8, autoplay music banner, About Me box, and working comments.",
        "myspace-throwback",
        "#000000",
        ["Arial", "Verdana"],
        html_blocks=[],
        pages=[
            _page("starter-myspace-throwback", "Home", "#000000", ["Arial", "Verdana"], [
                nav,
                '<section style="padding:20px;background:#000000;font-family:Arial,sans-serif;"><div style="max-width:1000px;margin:0 auto;display:grid;grid-template-columns:200px 1fr;gap:16px;"><div style="display:flex;flex-direction:column;gap:12px;"><div style="background:#0a0a1a;border:2px solid #336699;border-radius:4px;padding:10px;text-align:center;"><div style="width:170px;height:170px;background:linear-gradient(135deg,#003399,#6a0dad);border-radius:2px;margin:0 auto 8px;"></div><div style="color:#fff;font-size:15px;font-weight:bold;">xxjess_marievintagexx</div><div style="color:#88aadd;font-size:10px;margin-top:2px;">19 years old, Ohio, United States</div><div style="color:#88aadd;font-size:10px;margin-top:6px;">Last Login: Today</div></div><div style="background:#0a0a1a;border:2px solid #336699;border-radius:4px;padding:10px;color:#cfe0ff;font-size:10px;"><div style="color:#fff;font-weight:bold;margin-bottom:4px;">Mood: <span style="font-weight:normal;">bored</span></div><div>Status: In a relationship</div></div></div><div><div style="background:#0a0a1a;border:2px solid #336699;border-radius:4px;padding:14px;margin-bottom:12px;"><div style="color:#fff;font-weight:bold;font-size:13px;margin-bottom:8px;border-bottom:1px solid #336699;padding-bottom:6px;">xxjess_marievintagexx\'s Interests</div><div style="color:#cfe0ff;font-size:11px;line-height:1.7;"><strong style="color:#fff;">General:</strong> shows, thrifting, my dog<br><strong style="color:#fff;">Music:</strong> Fall Out Boy, Paramore, The Killers<br><strong style="color:#fff;">Movies:</strong> Mean Girls, Donnie Darko</div></div><div style="background:linear-gradient(180deg,#1a1a2e,#0a0a1a);border:2px solid #6a0dad;border-radius:4px;padding:12px;display:flex;align-items:center;gap:10px;"><div style="width:36px;height:36px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#888,#000);flex:none;"></div><div style="flex:1;"><div style="color:#c9a3ff;font-size:10px;">♫ Now Playing</div><div style="color:#fff;font-size:12px;">Sugar, We\'re Goin Down — Fall Out Boy</div></div><div style="color:#c9a3ff;font-size:16px;">▶</div></div></div></div></section>',
                '<section style="padding:0 20px 20px;background:#000000;font-family:Arial,sans-serif;"><div style="max-width:1000px;margin:0 auto;background:#0a0a1a;border:2px solid #336699;border-radius:4px;padding:14px;"><div style="color:#fff;font-weight:bold;font-size:13px;margin-bottom:10px;border-bottom:1px solid #336699;padding-bottom:6px;">xxjess_marievintagexx\'s Top 8</div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">' + "".join([f'<div style="text-align:center;"><div style="width:100%;aspect-ratio:1;background:linear-gradient(135deg,{c1},{c2});border-radius:2px;border:1px solid #336699;"></div><div style="color:#9db8e8;font-size:10px;margin-top:4px;">{n}</div></div>' for c1, c2, n in [("#ff6b9d", "#c44569", "hannah<3"), ("#4ecdc4", "#1a8a82", "mike_b"), ("#ffd93d", "#c9a000", "sophie.xo"), ("#a29bfe", "#6c5ce7", "tyler"), ("#ff9a3c", "#d9720a", "kayla__"), ("#55efc4", "#00997a", "brandon"), ("#fd79a8", "#c0396f", "emmaaa"), ("#74b9ff", "#3a7fd9", "chris_r")]]) + '</div></div></section>',
                '<section style="padding:0 20px 20px;background:#000000;font-family:Arial,sans-serif;"><div style="max-width:1000px;margin:0 auto;background:#0a0a1a;border:2px solid #336699;border-radius:4px;padding:14px;text-align:center;"><a href="comments.html" style="color:#9db8e8;text-decoration:none;font-size:11px;">View all 12 comments →</a></div></section>',
                footer,
            ], seo={"title": "xxjess_marievintagexx", "description": "A faithful mid-2000s MySpace-style profile."}, page_id="starter-myspace-throwback-home", slug="index"),
            _page("starter-myspace-throwback-blog", "Blog", "#000000", ["Arial", "Verdana"], [
                nav,
                '<section style="padding:20px;background:#000000;font-family:Arial,sans-serif;"><div style="max-width:760px;margin:0 auto;background:#0a0a1a;border:2px solid #336699;border-radius:4px;padding:16px;"><div style="color:#fff;font-weight:bold;font-size:13px;margin-bottom:12px;border-bottom:1px solid #336699;padding-bottom:6px;">xxjess_marievintagexx\'s Blog</div>'
                + "".join([f'<div style="padding:12px 0;border-bottom:1px solid #1a3050;"><div style="color:#9db8e8;font-size:10px;">{d} · mood: {m}</div><div style="color:#fff;font-size:13px;font-weight:bold;margin-top:2px;">{t}</div><div style="color:#cfe0ff;font-size:11px;margin-top:4px;line-height:1.6;">{ex}</div></div>' for d, m, t, ex in [
                    ("March 12", "excited", "ok so prom dress shopping today", "went with hannah and mike came too lol he has no opinions on dresses but he came anyway. found THE one. more later."),
                    ("March 2", "annoyed", "ugh group project drama", "not naming names but SOME people did not do their part and i am not covering for it again"),
                    ("February 20", "bored", "nothing to report", "just here. bulletin if you\'re bored too"),
                ]]) + '</div></section>',
                footer,
            ], seo={"title": "Blog — xxjess_marievintagexx", "description": "Blog posts."}, page_id="starter-myspace-throwback-blog", slug="blog"),
            _page("starter-myspace-throwback-comments", "Comments", "#000000", ["Arial", "Verdana"], [
                nav,
                _comments_section(
                    [
                        {"id": 1, "author": "hannah<3", "date": "3 hours ago", "text": "omg your top 8 changed again lol love you though"},
                        {"id": 2, "author": "mike_b", "date": "yesterday", "text": "new layout is fire, hmu this weekend"},
                        {"id": 3, "author": "sophie.xo", "date": "2 days ago", "text": "wait since when are we not #1 top friend anymore??? jk jk love u"},
                        {"id": 4, "author": "tyler", "date": "3 days ago", "text": "your now playing song is stuck in my head now thanks"},
                    ],
                    wrap_style="font-family:Arial,sans-serif;padding:20px;background:#000000;",
                    heading_style="color:#fff;font-size:14px;font-weight:bold;border-bottom:1px solid #336699;padding-bottom:6px;",
                ),
                footer,
            ], seo={"title": "Comments — xxjess_marievintagexx", "description": "All comments."}, page_id="starter-myspace-throwback-comments", slug="comments"),
        ],
    )


def _starter_geocities() -> Dict[str, Any]:
    starfield_style = "background:#000033 url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22%3E%3Ccircle cx=%225%22 cy=%228%22 r=%221%22 fill=%22white%22/%3E%3Ccircle cx=%2222%22 cy=%2220%22 r=%221%22 fill=%22white%22/%3E%3Ccircle cx=%2233%22 cy=%2233%22 r=%221%22 fill=%22white%22/%3E%3Ccircle cx=%2212%22 cy=%2230%22 r=%220.5%22 fill=%22white%22/%3E%3C/svg%3E') repeat;"
    marquee_css = '<style>@keyframes wd-marquee{0%{transform:translateX(100%);}100%{transform:translateX(-100%);}}</style>'
    nav = (
        f'<header style="{starfield_style}padding:20px 20px 8px;text-align:center;font-family:\'Comic Sans MS\',cursive;">'
        '<a href="index.html" style="color:#fff;text-decoration:none;font-size:13px;">home</a> · '
        '<a href="webring.html" style="color:#00ff00;text-decoration:none;font-size:13px;">webring</a> · '
        '<a href="links.html" style="color:#ffff00;text-decoration:none;font-size:13px;">my links</a>'
        '</header>'
    )
    footer = '<footer style="padding:16px 24px;background:#000000;color:#6699ff;font-family:\'Courier New\',monospace;font-size:10px;text-align:center;">this page last updated never · © 1999-2026</footer>'
    return _tpl(
        "starter-geocities-homepage",
        "GeoCities Personal Homepage",
        "Maximalist late-90s chaos — tiled starfield, scrolling marquee, hit counter, and a guestbook. The loud cousin of the journal throwbacks.",
        "geocities-homepage",
        "#000033",
        ["Comic Sans MS", "Courier New"],
        html_blocks=[],
        pages=[
            _page("starter-geocities-homepage", "Home", "#000033", ["Comic Sans MS", "Courier New"], [
                marquee_css,
                nav,
                f'<div style="{starfield_style}padding:12px 20px 32px;text-align:center;font-family:\'Comic Sans MS\',cursive;"><h1 style="font-size:34px;margin:0 0 6px;background:linear-gradient(90deg,#ff0000,#ff9900,#ffff00,#00ff00,#0099ff,#6633ff);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:2px 2px 0 rgba(0,0,0,.3);">*~*Welcome To My Homepage*~*</h1><p style="color:#ffff00;font-size:14px;margin:0 0 12px;">☆☆☆ under construction forever, thanks for stopping by!! ☆☆☆</p><div style="display:inline-block;background:#000;border:2px solid #ffff00;padding:4px 12px;color:#00ff00;font-family:\'Courier New\',monospace;font-size:12px;">You are visitor number: <strong>004217</strong></div></div>',
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
                footer,
            ], seo={"title": "Welcome To My Homepage", "description": "Maximalist late-90s personal homepage."}, page_id="starter-geocities-homepage-home", slug="index"),
            _page("starter-geocities-homepage-webring", "Webring", "#000033", ["Comic Sans MS", "Courier New"], [
                marquee_css,
                nav,
                f'<div style="{starfield_style}padding:32px 20px;text-align:center;font-family:\'Comic Sans MS\',cursive;color:#ccccff;"><div style="max-width:460px;margin:0 auto;background:rgba(0,0,50,.7);border:3px ridge #00ff00;border-radius:6px;padding:20px;"><h2 style="color:#00ff00;font-size:18px;margin:0 0 14px;">✦ Anime Fan Webring ✦</h2><p style="font-size:12px;line-height:1.6;margin:0 0 16px;">This site is proud member #47 of the Anime Fan Webring! Click through to visit other cool sites.</p><div style="display:flex;justify-content:center;gap:10px;font-size:12px;"><a href="#" style="color:#ffff00;text-decoration:none;">&laquo; Prev</a><a href="#" style="color:#00ff00;text-decoration:none;">Random</a><a href="#" style="color:#ffff00;text-decoration:none;">Next &raquo;</a></div></div></div>',
                footer,
            ], seo={"title": "Webring — my homepage", "description": "Proud member of the Anime Fan Webring."}, page_id="starter-geocities-homepage-webring", slug="webring"),
            _page("starter-geocities-homepage-links", "My Links", "#000033", ["Comic Sans MS", "Courier New"], [
                marquee_css,
                nav,
                f'<div style="{starfield_style}padding:32px 20px;font-family:\'Comic Sans MS\',cursive;color:#ccccff;"><div style="max-width:460px;margin:0 auto;background:rgba(0,0,50,.7);border:3px ridge #ffff00;border-radius:6px;padding:20px;"><h2 style="color:#ffff00;font-size:18px;margin:0 0 14px;text-align:center;">☆ My Links Page ☆</h2><ul style="list-style:none;padding:0;margin:0;font-size:13px;line-height:2.2;">'
                + "".join([f'<li>→ <a href="#" style="color:#00ffcc;text-decoration:none;">{n}</a> — <span style="color:#9999cc;font-size:11px;">{d}</span></li>' for n, d in [("Sailor Moon Shrine", "best transformation sequences ranked"), ("MIDI Vault 2000", "hundreds of free midis"), ("Neko\'s Cat Page", "my friend\'s site, go say hi")]]) + '</ul></div></div>',
                footer,
            ], seo={"title": "My Links — my homepage", "description": "Favorite sites, hand-picked."}, page_id="starter-geocities-homepage-links", slug="links"),
        ],
    )


def _starter_forum() -> Dict[str, Any]:
    brand = '<div style="background:linear-gradient(180deg,#3b6ea5,#1d3d63);padding:14px 24px;"><a href="index.html" style="color:#fff;font-size:20px;font-weight:bold;text-decoration:none;">FieldworkForums.net</a><div style="color:#aecbe8;font-size:11px;margin-top:2px;">the only forum you will ever need, established 2003</div></div>'
    footer = '<footer style="padding:14px 24px;background:#1d3d63;color:#aecbe8;font-family:Verdana,sans-serif;font-size:10px;text-align:center;">All times are GMT. Page generated in 0.041 seconds.</footer>'
    boards = [("General Discussion", "board.html", "Anything goes.", "1,204", "18,332"), ("Off-Topic", "#", "Not about the forum topic at all.", "882", "9,410"), ("Archived Projects", "#", "Read-only history.", "204", "2,881")]
    return _tpl(
        "starter-forum-throwback",
        "Web Forum Throwback",
        "A classic phpBB/vBulletin-style forum thread — per-post user rail, quote/edit icons, and a working reply box.",
        "forum-throwback",
        "#e8ecf1",
        ["Verdana", "Tahoma"],
        html_blocks=[],
        pages=[
            _page("starter-forum-throwback", "Forum Index", "#e8ecf1", ["Verdana", "Tahoma"], [
                f'<header style="font-family:Verdana,sans-serif;">{brand}</header>',
                '<section style="padding:16px 24px;background:#e8ecf1;font-family:Verdana,sans-serif;"><div style="max-width:900px;margin:0 auto;border:1px solid #b8c8dc;border-radius:3px;overflow:hidden;">'
                + "".join([f'<a href="{href}" style="display:flex;justify-content:space-between;align-items:center;padding:14px 18px;background:#fff;border-bottom:1px solid #b8c8dc;text-decoration:none;"><div><div style="font-size:14px;font-weight:bold;color:#1d3d63;">{name}</div><div style="font-size:11px;color:#7a8aa0;margin-top:2px;">{desc}</div></div><div style="font-size:10px;color:#9aabc0;text-align:right;">{threads} threads<br>{posts} posts</div></a>' for name, href, desc, threads, posts in boards])
                + '</div></section>',
                footer,
            ], seo={"title": "FieldworkForums.net — Forum Index", "description": "Board index."}, page_id="starter-forum-throwback-index", slug="index"),
            _page("starter-forum-throwback-board", "General Discussion", "#e8ecf1", ["Verdana", "Tahoma"], [
                f'<header style="font-family:Verdana,sans-serif;">{brand}<div style="background:#dde6f0;border-bottom:1px solid #b8c8dc;padding:6px 24px;font-size:11px;color:#3b6ea5;"><a href="index.html" style="color:#3b6ea5;">Forum Index</a> » <strong>General Discussion</strong></div></header>',
                '<section style="padding:16px 24px;background:#e8ecf1;font-family:Verdana,sans-serif;"><div style="max-width:900px;margin:0 auto;border:1px solid #b8c8dc;border-radius:3px;overflow:hidden;">'
                + "".join([f'<a href="{href}" style="display:flex;justify-content:space-between;align-items:center;padding:12px 18px;background:{bg};border-bottom:1px solid #b8c8dc;text-decoration:none;"><div><div style="font-size:13px;font-weight:bold;color:#1d3d63;">{t}</div><div style="font-size:10px;color:#7a8aa0;margin-top:2px;">started by {by}</div></div><div style="font-size:10px;color:#9aabc0;text-align:right;">{replies} replies<br>{last}</div></a>' for bg, href, t, by, replies, last in [
                    ("#fff", "thread.html", "Anyone else still using this in 2026?", "forumveteran99", "2", "Today, 10:02 AM"),
                    ("#f4f7fb", "#", "PSA: new forum rules as of this month", "mod_sarah", "14", "Yesterday, 6:20 PM"),
                    ("#fff", "#", "What was your first internet forum?", "lurker_since_02", "37", "Mar 2, 2026"),
                ]])
                + '</div></section>',
                footer,
            ], seo={"title": "General Discussion — FieldworkForums.net", "description": "Thread list."}, page_id="starter-forum-throwback-board", slug="board"),
            _page("starter-forum-throwback-thread", "Anyone else still using this in 2026?", "#e8ecf1", ["Verdana", "Tahoma"], [
                f'<header style="font-family:Verdana,sans-serif;">{brand}<div style="background:#dde6f0;border-bottom:1px solid #b8c8dc;padding:6px 24px;font-size:11px;color:#3b6ea5;"><a href="index.html" style="color:#3b6ea5;">Forum Index</a> » <a href="board.html" style="color:#3b6ea5;">General Discussion</a> » <strong>Anyone else still using this in 2026?</strong></div></header>',
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
                    f'<div style="display:flex;justify-content:space-between;font-size:10px;color:#7a8aa0;border-bottom:1px dotted #cdd8e6;padding-bottom:6px;margin-bottom:8px;"><span>Posted: {when}</span><span>Post #{n}</span></div>'
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
                footer,
            ], seo={"title": "Anyone else still using this in 2026? — FieldworkForums.net", "description": "Forum thread."}, page_id="starter-forum-throwback-thread", slug="thread"),
        ],
    )


def _starter_frutiger_aero() -> Dict[str, Any]:
    nav = '<header style="padding:20px 48px;background:rgba(255,255,255,0.5);backdrop-filter:blur(10px);font-family:Rubik,sans-serif;display:flex;align-items:center;justify-content:space-between;"><a href="index.html" style="font-size:18px;font-weight:700;color:#0b3d5f;text-decoration:none;">☁ Aero</a><nav style="display:flex;gap:24px;align-items:center;font-size:13px;"><a href="pricing.html" style="color:#0b3d5f;text-decoration:none;">Pricing</a><a href="about.html" style="color:#0b3d5f;text-decoration:none;">About</a><a href="#" style="padding:8px 16px;background:linear-gradient(180deg,#ffffff,#d6efff);border-radius:999px;box-shadow:0 4px 12px rgba(11,61,95,0.2);color:#0b3d5f;text-decoration:none;font-weight:600;">Get started</a></nav></header>'
    footer = '<footer style="padding:32px 48px;background:#0b3d5f;color:#c8f0ff;font-family:Rubik,sans-serif;font-size:13px;display:flex;justify-content:space-between;">© Aero Studio · <span>Breathe deep.</span></footer>'
    return _tpl(
        "starter-frutiger-aero",
        "Frutiger Aero",
        "Glossy, aqua, back-of-a-Windows-Vista-box optimism.",
        "frutiger-aero",
        "#7fd8ff",
        ["Rubik"],
        html_blocks=[],
        pages=[
            _page("starter-frutiger-aero", "Home", "#7fd8ff", ["Rubik"], [
                nav,
                '<section style="min-height:60vh;padding:64px 48px;background:radial-gradient(circle at 20% 20%,#c8f0ff 0%,#7fd8ff 45%,#3a9bd6 100%);font-family:Rubik,sans-serif;color:#0b3d5f;position:relative;overflow:hidden;"><div style="max-width:640px;position:relative;z-index:2;"><div style="display:inline-block;padding:6px 14px;background:rgba(255,255,255,0.55);border-radius:999px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;backdrop-filter:blur(8px);">Cloud native · 2007 forever</div><h1 style="font-size:64px;line-height:1.05;margin:20px 0 16px;font-weight:600;letter-spacing:-0.02em;">Breathe deep, ship fast.</h1><p style="font-size:18px;line-height:1.6;max-width:520px;">A tranquil workspace that feels like the sky just cleared. Bubbles, gradients, and just enough gloss to make Monday tolerable.</p><div style="display:flex;gap:12px;margin-top:28px;"><a href="#" style="padding:14px 22px;background:linear-gradient(180deg,#ffffff 0%,#d6efff 100%);border-radius:14px;box-shadow:0 6px 20px rgba(11,61,95,0.25),inset 0 1px 0 rgba(255,255,255,0.9);color:#0b3d5f;text-decoration:none;font-weight:600;">Get started</a><a href="pricing.html" style="padding:14px 22px;border-radius:14px;color:#0b3d5f;text-decoration:none;font-weight:500;background:rgba(255,255,255,0.35);backdrop-filter:blur(10px);">See pricing</a></div></div><div style="position:absolute;right:-40px;bottom:-40px;width:340px;height:340px;border-radius:50%;background:radial-gradient(circle at 30% 30%,rgba(255,255,255,0.9),rgba(160,220,255,0.25) 60%,transparent 70%);"></div></section>',
                '<section style="padding:72px 48px;background:linear-gradient(180deg,#e6f7ff 0%,#ffffff 100%);font-family:Rubik,sans-serif;color:#0b3d5f;"><h2 style="font-size:36px;margin:0 0 32px;">Everything is a little bit shinier.</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;">' + "".join([f'<div style="padding:24px;border-radius:18px;background:linear-gradient(180deg,#ffffff 0%,#e0f2ff 100%);box-shadow:0 10px 30px rgba(58,155,214,0.18),inset 0 1px 0 rgba(255,255,255,0.9);"><div style="width:44px;height:44px;border-radius:50%;background:radial-gradient(circle at 30% 30%,#ffffff,#7fd8ff);margin-bottom:14px;"></div><h3 style="margin:0 0 8px;font-size:18px;">{t}</h3><p style="margin:0;font-size:14px;color:#3a6a8c;line-height:1.5;">{d}</p></div>' for t, d in [("Feels alive", "Motion, gradients, water droplets."), ("Feels calm", "Sky-blue palette that never yells."), ("Feels 2007", "In the best possible way.")]]) + '</div></section>',
                footer,
            ], seo={"title": "Aero — Breathe deep, ship fast", "description": "Glossy, aqua, back-of-a-Windows-Vista-box optimism."}, page_id="starter-frutiger-aero-home", slug="index"),
            _page("starter-frutiger-aero-pricing", "Pricing", "#7fd8ff", ["Rubik"], [
                nav,
                '<section style="padding:64px 48px 24px;background:linear-gradient(180deg,#e6f7ff 0%,#ffffff 100%);font-family:Rubik,sans-serif;color:#0b3d5f;text-align:center;"><h1 style="font-size:38px;margin:0 0 8px;">Pricing that stays calm too.</h1><p style="font-size:15px;color:#3a6a8c;margin:0;">No surprise invoices. Cancel with one click.</p></section>',
                '<section style="padding:16px 48px 88px;background:#ffffff;font-family:Rubik,sans-serif;"><div style="max-width:900px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:20px;">'
                + "".join([f'<div style="padding:28px;border-radius:18px;background:linear-gradient(180deg,#ffffff 0%,#e0f2ff 100%);box-shadow:0 10px 30px rgba(58,155,214,0.18),inset 0 1px 0 rgba(255,255,255,0.9);text-align:center;"><div style="font-size:12px;color:#3a6a8c;text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;">{n}</div><div style="font-size:32px;font-weight:700;color:#0b3d5f;margin-bottom:16px;">{p}</div><a href="#" style="display:block;padding:11px;background:linear-gradient(180deg,#ffffff,#d6efff);border-radius:999px;box-shadow:0 4px 12px rgba(11,61,95,0.2);color:#0b3d5f;text-decoration:none;font-weight:600;font-size:13px;">Choose</a></div>' for n, p in [("Breeze", "Free"), ("Cloud", "$9/mo"), ("Sky", "$29/mo")]])
                + '</div></section>',
                footer,
            ], seo={"title": "Pricing — Aero", "description": "Calm, simple pricing."}, page_id="starter-frutiger-aero-pricing", slug="pricing"),
            _page("starter-frutiger-aero-about", "About", "#7fd8ff", ["Rubik"], [
                nav,
                '<section style="padding:80px 48px;background:linear-gradient(180deg,#e6f7ff 0%,#ffffff 100%);font-family:Rubik,sans-serif;color:#0b3d5f;"><div style="max-width:560px;margin:0 auto;"><h1 style="font-size:32px;margin:0 0 18px;">About Aero</h1><p style="font-size:15px;line-height:1.7;color:#3a6a8c;">We miss the internet that felt like a clean desktop and a fresh gel pen. Aero is a small, calm workspace app built by three people who got tired of tools that shout.</p></div></section>',
                footer,
            ], seo={"title": "About — Aero", "description": "A small, calm workspace app."}, page_id="starter-frutiger-aero-about", slug="about"),
        ],
    )


def _starter_dark_academia() -> Dict[str, Any]:
    nav = '<header style="padding:22px 56px;background:#0a0603;border-bottom:1px solid #3a2f20;font-family:\'Cormorant Garamond\',serif;display:flex;align-items:center;justify-content:space-between;"><a href="index.html" style="font-size:18px;font-style:italic;color:#e8d9b8;text-decoration:none;letter-spacing:0.05em;">Anno MMXXVI</a><nav style="display:flex;gap:28px;font-size:13px;letter-spacing:0.1em;text-transform:uppercase;"><a href="archive.html" style="color:#c9b48b;text-decoration:none;">Archive</a><a href="about.html" style="color:#c9b48b;text-decoration:none;">About</a></nav></header>'
    footer = '<footer style="padding:32px 56px;background:#0a0603;color:#6b5a3d;font-family:\'Cormorant Garamond\',serif;font-size:13px;font-style:italic;text-align:center;letter-spacing:0.15em;">Sic parvis magna</footer>'
    return _tpl(
        "starter-dark-academia",
        "Dark Academia",
        "Candlelit libraries, oxblood leather, and Latin quotations.",
        "dark-academia",
        "#1a1410",
        ["Cormorant Garamond", "EB Garamond"],
        html_blocks=[],
        pages=[
            _page("starter-dark-academia", "Home", "#1a1410", ["Cormorant Garamond", "EB Garamond"], [
                nav,
                '<section style="min-height:60vh;padding:64px 56px;background:radial-gradient(circle at 20% 30%,#2a1f18 0%,#120b07 70%);font-family:\'Cormorant Garamond\',serif;color:#e8d9b8;"><div style="max-width:680px;"><div style="font-size:12px;letter-spacing:0.4em;text-transform:uppercase;color:#8a6a3f;margin-bottom:18px;">Anno MMXXVI · Vol. I</div><h1 style="font-size:78px;line-height:1.02;margin:0 0 20px;font-weight:500;font-style:italic;">A quiet devotion to the written word.</h1><p style="font-size:20px;line-height:1.6;color:#c9b48b;max-width:520px;">Manuscripts, cathedrals of thought, and the smell of very old books. Enter, if you must, but leave your hurry at the gate.</p><div style="margin-top:36px;display:flex;gap:20px;align-items:center;"><a href="archive.html" style="padding:14px 26px;border:1px solid #8a6a3f;color:#e8d9b8;text-decoration:none;letter-spacing:0.18em;font-size:12px;text-transform:uppercase;">Enter the archive</a><span style="color:#6b5a3d;font-style:italic;">— Ad astra per aspera</span></div></div></section>',
                '<section style="padding:80px 56px;background:#120b07;font-family:\'Cormorant Garamond\',serif;color:#e8d9b8;"><div style="display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center;"><div><h2 style="font-size:44px;margin:0 0 20px;font-style:italic;">On the pleasure of forgotten pages.</h2><p style="font-size:17px;line-height:1.7;color:#b09872;">There is a certain joy — inexplicable, almost ecclesiastical — in returning to a book you last read a decade ago and finding your own marginalia in a hand you no longer recognise.</p></div><div style="border-left:1px solid #4a3d2a;padding-left:36px;"><ol style="list-style:none;padding:0;margin:0;font-size:16px;line-height:2.1;color:#c9b48b;"><li>I. <em>De Rerum Natura</em> — Lucretius</li><li>II. <em>Confessions</em> — Augustine</li><li>III. <em>The Secret History</em> — Tartt</li><li>IV. <em>Meditations</em> — Aurelius</li></ol></div></div></section>',
                footer,
            ], seo={"title": "Anno MMXXVI — A quiet devotion to the written word", "description": "A candlelit literary journal."}, page_id="starter-dark-academia-home", slug="index"),
            _page("starter-dark-academia-archive", "Archive", "#1a1410", ["Cormorant Garamond", "EB Garamond"], [
                nav,
                '<section style="padding:64px 56px;background:#120b07;font-family:\'Cormorant Garamond\',serif;color:#e8d9b8;"><div style="max-width:680px;margin:0 auto;"><h1 style="font-size:44px;margin:0 0 32px;font-style:italic;">Past volumes.</h1><ol style="list-style:none;padding:0;margin:0;font-size:18px;line-height:2.3;color:#c9b48b;">' + "".join([f'<li style="border-bottom:1px solid #2a2015;padding-bottom:14px;margin-bottom:14px;">Vol. {v} — <em>{t}</em> <span style="color:#6b5a3d;font-size:14px;">· {y}</span></li>' for v, t, y in [("IV", "On Marginalia and Other Small Rebellions", "Winter 2025"), ("III", "The Weight of Unread Shelves", "Autumn 2025"), ("II", "In Praise of Slow Reading", "Summer 2025"), ("I", "A Quiet Devotion", "Spring 2025")]]) + '</ol></div></section>',
                footer,
            ], seo={"title": "Archive — Anno MMXXVI", "description": "Past volumes of the journal."}, page_id="starter-dark-academia-archive", slug="archive"),
            _page("starter-dark-academia-about", "About", "#1a1410", ["Cormorant Garamond", "EB Garamond"], [
                nav,
                '<section style="padding:80px 56px;background:#120b07;font-family:\'Cormorant Garamond\',serif;color:#e8d9b8;"><div style="max-width:600px;margin:0 auto;"><h1 style="font-size:36px;margin:0 0 20px;font-style:italic;">About the journal.</h1><p style="font-size:18px;line-height:1.75;color:#c9b48b;">Anno MMXXVI publishes one slim volume a season — essays, marginalia, and the occasional translation, edited by a small group of people who still prefer paper.</p></div></section>',
                footer,
            ], seo={"title": "About — Anno MMXXVI", "description": "About the journal."}, page_id="starter-dark-academia-about", slug="about"),
        ],
    )


def _starter_solar_punk() -> Dict[str, Any]:
    nav = '<header style="padding:20px 56px;background:#f4efd6;font-family:\'Space Grotesk\',sans-serif;display:flex;align-items:center;justify-content:space-between;"><a href="index.html" style="font-size:17px;font-weight:700;color:#1f3a1a;text-decoration:none;">🌱 Solar Punk</a><nav style="display:flex;gap:24px;font-size:13px;"><a href="manifesto.html" style="color:#1f3a1a;text-decoration:none;">Manifesto</a><a href="about.html" style="color:#1f3a1a;text-decoration:none;">About</a></nav></header>'
    footer = '<footer style="padding:32px 56px;background:#f4efd6;color:#1f3a1a;font-family:\'Space Grotesk\',sans-serif;font-size:13px;display:flex;justify-content:space-between;align-items:center;"><span>Solar Punk Studio · 2026</span><span style="font-style:italic;font-family:Fraunces,serif;">See you at the harvest.</span></footer>'
    return _tpl(
        "starter-solar-punk",
        "Solar Punk",
        "Hopeful ecotopia — mossy greens, sunlit gold, living tech.",
        "solar-punk",
        "#f4efd6",
        ["Fraunces", "Space Grotesk"],
        html_blocks=[],
        pages=[
            _page("starter-solar-punk", "Home", "#f4efd6", ["Fraunces", "Space Grotesk"], [
                nav,
                '<section style="min-height:60vh;padding:64px 56px;background:linear-gradient(160deg,#f4efd6 0%,#c7e0a8 60%,#8fbf6a 100%);font-family:Fraunces,serif;color:#1f3a1a;position:relative;overflow:hidden;"><div style="max-width:660px;position:relative;z-index:2;"><div style="display:inline-block;padding:6px 14px;background:#1f3a1a;color:#f4efd6;border-radius:999px;font-family:\'Space Grotesk\',sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;">A future worth wanting</div><h1 style="font-size:72px;line-height:1.02;margin:22px 0 18px;font-weight:600;letter-spacing:-0.02em;">Grow the internet <em style="color:#e8a939;">back.</em></h1><p style="font-size:19px;line-height:1.65;font-family:\'Space Grotesk\',sans-serif;max-width:540px;color:#2f4d28;">Software that behaves like a garden. Buildings clothed in vines. A community-owned power grid that hums quietly through the summer.</p><div style="margin-top:34px;display:flex;gap:12px;"><a href="about.html" style="padding:14px 24px;background:#1f3a1a;color:#f4efd6;text-decoration:none;border-radius:999px;font-family:\'Space Grotesk\',sans-serif;font-weight:600;font-size:14px;">Join us</a><a href="manifesto.html" style="padding:14px 24px;color:#1f3a1a;text-decoration:none;border-radius:999px;border:1.5px solid #1f3a1a;font-family:\'Space Grotesk\',sans-serif;font-size:14px;">Read the manifesto</a></div></div><div style="position:absolute;right:-80px;top:-80px;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle at 50% 50%,#f0c14a 0%,#e8a939 40%,transparent 70%);opacity:0.7;"></div></section>',
                '<section style="padding:80px 56px;background:#1f3a1a;color:#f4efd6;font-family:Fraunces,serif;"><h2 style="font-size:44px;margin:0 0 40px;font-weight:500;">Principles we quietly follow.</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:28px;font-family:\'Space Grotesk\',sans-serif;">' + "".join([f'<div style="padding:28px;border:1px solid #4a6b3f;border-radius:20px;background:#2a4a24;"><div style="font-size:38px;color:#f0c14a;line-height:1;margin-bottom:16px;">{n}</div><h3 style="margin:0 0 8px;font-size:18px;font-family:Fraunces,serif;font-weight:500;">{t}</h3><p style="margin:0;font-size:14px;line-height:1.6;color:#c7e0a8;">{d}</p></div>' for n, t, d in [("01", "Repair over rebuild", "The oldest chair in the house is still the best."), ("02", "Sun as the only lender", "We charge nothing that photons can\'t."), ("03", "Small, local, weird", "Every neighbourhood makes its own bread.")]]) + '</div></section>',
                footer,
            ], seo={"title": "Solar Punk — Grow the internet back", "description": "A hopeful ecotopia collective."}, page_id="starter-solar-punk-home", slug="index"),
            _page("starter-solar-punk-manifesto", "Manifesto", "#f4efd6", ["Fraunces", "Space Grotesk"], [
                nav,
                '<section style="padding:72px 56px;background:#f4efd6;font-family:Fraunces,serif;color:#1f3a1a;"><div style="max-width:640px;margin:0 auto;"><h1 style="font-size:42px;margin:0 0 24px;font-weight:600;">The manifesto.</h1><p style="font-size:18px;line-height:1.75;font-family:\'Space Grotesk\',sans-serif;color:#2f4d28;margin:0 0 18px;">We believe technology should behave like a well-tended garden — slow to grow, generous once it does, and never asking more of the soil than the soil can give back.</p><p style="font-size:18px;line-height:1.75;font-family:\'Space Grotesk\',sans-serif;color:#2f4d28;margin:0 0 18px;">We believe in fixing what is broken before buying what is new, in power that comes from the sun above the building rather than a grid we cannot see, and in neighborhoods that make their own bread.</p><p style="font-size:18px;line-height:1.75;font-family:\'Space Grotesk\',sans-serif;color:#2f4d28;margin:0;">This is not nostalgia. It is a future worth wanting, built with tools we already have.</p></div></section>',
                footer,
            ], seo={"title": "Manifesto — Solar Punk", "description": "The full manifesto."}, page_id="starter-solar-punk-manifesto", slug="manifesto"),
            _page("starter-solar-punk-about", "About", "#f4efd6", ["Fraunces", "Space Grotesk"], [
                nav,
                '<section style="padding:72px 56px;background:#f4efd6;font-family:\'Space Grotesk\',sans-serif;color:#1f3a1a;"><div style="max-width:560px;margin:0 auto;"><h1 style="font-family:Fraunces,serif;font-size:34px;margin:0 0 18px;font-weight:600;">About the collective.</h1><p style="font-size:16px;line-height:1.7;color:#2f4d28;">A dozen households, one shared rooftop garden, and a very slow website. We meet Thursdays. New neighbors welcome.</p></div></section>',
                footer,
            ], seo={"title": "About — Solar Punk", "description": "About the collective."}, page_id="starter-solar-punk-about", slug="about"),
        ],
    )


def _starter_cottagecore() -> Dict[str, Any]:
    nav = '<header style="padding:22px 56px;background:#f7f0e2;font-family:\'Playfair Display\',serif;display:flex;align-items:center;justify-content:space-between;"><a href="index.html" style="font-size:19px;font-style:italic;color:#4a2f22;text-decoration:none;">The Little Bakery</a><nav style="display:flex;gap:24px;font-size:13px;font-family:\'Cormorant Garamond\',serif;text-transform:uppercase;letter-spacing:0.08em;"><a href="menu.html" style="color:#7a5240;text-decoration:none;">Menu</a><a href="visit.html" style="color:#7a5240;text-decoration:none;">Visit</a></nav></header>'
    footer = '<footer style="padding:32px 56px;background:#4a2f22;color:#efd9c0;font-family:\'Cormorant Garamond\',serif;font-style:italic;font-size:14px;text-align:center;">The kettle is on. Come sit a while.</footer>'
    return _tpl(
        "starter-cottagecore",
        "Cottagecore",
        "Sourdough, embroidery, kettle on the stove, sun through gingham.",
        "cottagecore",
        "#f7f0e2",
        ["Playfair Display", "Cormorant Garamond"],
        html_blocks=[],
        pages=[
            _page("starter-cottagecore", "Home", "#f7f0e2", ["Playfair Display", "Cormorant Garamond"], [
                nav,
                '<section style="min-height:56vh;padding:64px 56px;background:linear-gradient(180deg,#f7f0e2 0%,#efd9c0 100%);font-family:\'Playfair Display\',serif;color:#4a2f22;text-align:center;"><div style="max-width:680px;margin:0 auto;"><div style="font-size:12px;letter-spacing:0.3em;text-transform:uppercase;color:#a17454;margin-bottom:20px;">Warmly kept · Since forever</div><h1 style="font-size:70px;line-height:1.05;margin:0 0 20px;font-weight:400;font-style:italic;">A slower kind of Tuesday.</h1><p style="font-size:19px;line-height:1.7;color:#7a5240;font-family:\'Cormorant Garamond\',serif;font-style:italic;">Bread proving on the counter. A cat asleep on a book. The bees are in the lavender again and none of the emails have caught fire.</p><div style="margin-top:36px;"><a href="visit.html" style="padding:14px 34px;background:#a17454;color:#f7f0e2;text-decoration:none;border-radius:2px;letter-spacing:0.15em;font-size:12px;text-transform:uppercase;font-family:\'Cormorant Garamond\',serif;">Come inside</a></div></div></section>',
                '<section style="padding:64px 56px;background:#f7f0e2;font-family:\'Playfair Display\',serif;color:#4a2f22;"><div style="max-width:720px;margin:0 auto;text-align:center;"><h2 style="font-size:40px;margin:0 0 24px;font-weight:400;font-style:italic;">What\'s baking today.</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;text-align:left;margin-top:32px;">' + "".join([f'<div style="padding:24px;background:#efe0c8;border-radius:8px;border:1px solid #d6bf9c;"><h3 style="margin:0 0 8px;font-size:20px;font-weight:400;">{t}</h3><p style="margin:0;font-family:\'Cormorant Garamond\',serif;font-size:16px;line-height:1.6;color:#7a5240;font-style:italic;">{d}</p></div>' for t, d in [("Sourdough loaf", "Fed since 2019. Cranky in winter."), ("Rhubarb jam", "Small batch, mostly sugar."), ("Rosemary focaccia", "Salt flakes the size of moons.")]]) + '</div><a href="menu.html" style="display:inline-block;margin-top:28px;color:#a17454;font-family:\'Cormorant Garamond\',serif;font-style:italic;text-decoration:none;">See the full menu →</a></div></section>',
                footer,
            ], seo={"title": "The Little Bakery — A slower kind of Tuesday", "description": "Sourdough, embroidery, and a kettle on the stove."}, page_id="starter-cottagecore-home", slug="index"),
            _page("starter-cottagecore-menu", "Menu", "#f7f0e2", ["Playfair Display", "Cormorant Garamond"], [
                nav,
                '<section style="padding:64px 56px;background:#f7f0e2;font-family:\'Playfair Display\',serif;color:#4a2f22;"><div style="max-width:560px;margin:0 auto;"><h1 style="font-size:38px;margin:0 0 28px;font-weight:400;font-style:italic;text-align:center;">The full menu.</h1>' + "".join([f'<div style="display:flex;justify-content:space-between;align-items:baseline;padding:14px 0;border-bottom:1px dashed #d6bf9c;"><span style="font-size:17px;">{t}</span><span style="font-family:\'Cormorant Garamond\',serif;font-style:italic;color:#a17454;">{p}</span></div>' for t, p in [("Sourdough loaf", "£6"), ("Rhubarb jam", "£4"), ("Rosemary focaccia", "£5"), ("Honey oat scones (x4)", "£7"), ("Elderflower cordial", "£5")]]) + '</div></section>',
                footer,
            ], seo={"title": "Menu — The Little Bakery", "description": "The full baked-goods menu."}, page_id="starter-cottagecore-menu", slug="menu"),
            _page("starter-cottagecore-visit", "Visit", "#f7f0e2", ["Playfair Display", "Cormorant Garamond"], [
                nav,
                '<section style="padding:80px 56px;background:#f7f0e2;font-family:\'Playfair Display\',serif;color:#4a2f22;text-align:center;"><h1 style="font-size:34px;margin:0 0 18px;font-weight:400;font-style:italic;">Come find us.</h1><p style="font-family:\'Cormorant Garamond\',serif;font-style:italic;font-size:18px;color:#7a5240;line-height:1.8;">Open Wednesday to Sunday, 8am until the bread runs out.<br>4 Millbrook Lane, behind the old post office.</p></section>',
                footer,
            ], seo={"title": "Visit — The Little Bakery", "description": "Hours and location."}, page_id="starter-cottagecore-visit", slug="visit"),
        ],
    )


def _starter_y2k() -> Dict[str, Any]:
    nav = '<header style="padding:16px 40px;background:#3a1a4a;font-family:\'Space Mono\',monospace;display:flex;align-items:center;justify-content:space-between;"><a href="index.html" style="color:#ffd6f0;font-weight:700;text-decoration:none;font-size:14px;">2000s.exe</a><nav style="display:flex;gap:20px;font-size:12px;"><a href="about.html" style="color:#ffd6f0;text-decoration:none;">about.txt</a><a href="guestbook.html" style="color:#ffd6f0;text-decoration:none;">guestbook.exe</a></nav></header>'
    footer = '<footer style="padding:24px 40px;background:linear-gradient(90deg,#ff4dc4,#8b3aff);color:#ffffff;font-family:VT323,monospace;font-size:22px;text-align:center;letter-spacing:0.1em;">★ made w/ love, dial-up & sparkles ★</footer>'
    return _tpl(
        "starter-y2k",
        "Y2K Chrome",
        "Bubblegum pink, chrome, low-poly stars, sparkly clip-art energy.",
        "y2k",
        "#ffd6f0",
        ["VT323", "Space Mono"],
        html_blocks=[],
        pages=[
            _page("starter-y2k", "Home", "#ffd6f0", ["VT323", "Space Mono"], [
                nav,
                '<section style="min-height:56vh;padding:56px 40px;background:linear-gradient(135deg,#ffd6f0 0%,#c8b4ff 50%,#a0e8ff 100%);font-family:\'Space Mono\',monospace;color:#3a1a4a;position:relative;overflow:hidden;"><div style="max-width:680px;position:relative;z-index:2;"><div style="display:inline-block;padding:6px 12px;background:linear-gradient(180deg,#ffffff,#e0d0ff);border:2px solid #3a1a4a;box-shadow:4px 4px 0 #3a1a4a;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;">★ new millennium ★</div><h1 style="font-family:VT323,monospace;font-size:96px;line-height:1;margin:20px 0 12px;background:linear-gradient(180deg,#ff4dc4 0%,#8b3aff 100%);-webkit-background-clip:text;background-clip:text;color:transparent;letter-spacing:-0.02em;">2000s.exe</h1><p style="font-size:16px;line-height:1.6;max-width:520px;color:#4a2a5a;">welcome 2 the internet before the internet got tired :) chrome buttons, clippy energy, and every gradient turned all the way up.</p><div style="display:flex;gap:12px;margin-top:28px;flex-wrap:wrap;"><a href="guestbook.html" style="padding:14px 26px;background:linear-gradient(180deg,#ffffff 0%,#ffd6f0 100%);border:2px solid #3a1a4a;box-shadow:4px 4px 0 #3a1a4a;color:#3a1a4a;text-decoration:none;font-weight:700;font-size:14px;text-transform:uppercase;letter-spacing:0.1em;">→ sign guestbook</a><a href="about.html" style="padding:14px 26px;background:linear-gradient(180deg,#c8b4ff 0%,#8b3aff 100%);border:2px solid #3a1a4a;box-shadow:4px 4px 0 #3a1a4a;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;text-transform:uppercase;letter-spacing:0.1em;">☆ about.txt</a></div></div><div style="position:absolute;right:40px;top:40px;font-size:80px;color:#ffffff;text-shadow:4px 4px 0 #3a1a4a;">★</div></section>',
                '<section style="padding:56px 40px;background:#3a1a4a;color:#ffd6f0;font-family:\'Space Mono\',monospace;"><h2 style="font-family:VT323,monospace;font-size:60px;margin:0 0 32px;color:#ffffff;">features.txt</h2><div style="display:grid;grid-template-columns:repeat(2,1fr);gap:20px;">' + "".join([f'<div style="padding:24px;background:#ffd6f0;color:#3a1a4a;border:2px solid #ffffff;box-shadow:6px 6px 0 #ff4dc4;"><div style="font-family:VT323,monospace;font-size:32px;color:#ff4dc4;">{n}</div><h3 style="margin:8px 0 6px;font-size:16px;text-transform:uppercase;letter-spacing:0.1em;">{t}</h3><p style="margin:0;font-size:13px;line-height:1.5;">{d}</p></div>' for n, t, d in [("★", "chrome buttons", "the shinier the better."), ("♥", "sparkle everywhere", "cursors, backgrounds, hearts."), ("☆", "guestbook energy", "sign it. tell everyone."), ("♪", "midi soundtracks", "yes, still.")]]) + '</div></section>',
                footer,
            ], seo={"title": "2000s.exe", "description": "Bubblegum pink, chrome, low-poly stars."}, page_id="starter-y2k-home", slug="index"),
            _page("starter-y2k-about", "About", "#ffd6f0", ["VT323", "Space Mono"], [
                nav,
                '<section style="padding:56px 40px;background:linear-gradient(135deg,#ffd6f0 0%,#c8b4ff 50%,#a0e8ff 100%);font-family:\'Space Mono\',monospace;color:#3a1a4a;text-align:center;"><div style="max-width:480px;margin:0 auto;background:#fff;border:2px solid #3a1a4a;box-shadow:6px 6px 0 #3a1a4a;padding:24px;text-align:left;"><div style="font-family:VT323,monospace;font-size:28px;color:#ff4dc4;margin-bottom:10px;">about.txt</div><p style="font-size:13px;line-height:1.7;">hii!! this site is a love letter to the early 2000s web — chrome gradients, guestbooks, midis that autoplay whether you want them to or not. built with way too much css and zero regrets.</p></div></section>',
                footer,
            ], seo={"title": "about.txt — 2000s.exe", "description": "About this site."}, page_id="starter-y2k-about", slug="about"),
            _page("starter-y2k-guestbook", "Guestbook", "#ffd6f0", ["VT323", "Space Mono"], [
                nav,
                _comments_section(
                    [
                        {"id": 1, "author": "xoxo_kayla", "date": "1 day ago", "text": "SIGNED!! love the sparkles"},
                        {"id": 2, "author": "chrome_dreamer", "date": "3 days ago", "text": "this brought back so many memories, 10/10"},
                    ],
                    wrap_style="font-family:\'Space Mono\',monospace;padding:40px;background:#3a1a4a;",
                    heading_style="font-family:VT323,monospace;font-size:32px;color:#ffffff;margin:0 0 16px;",
                ),
                footer,
            ], seo={"title": "Guestbook — 2000s.exe", "description": "Sign the guestbook."}, page_id="starter-y2k-guestbook", slug="guestbook"),
        ],
    )


def _starter_vaporwave() -> Dict[str, Any]:
    nav = '<header style="padding:16px 48px;background:#0f0d3a;font-family:Manrope,sans-serif;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #5a2d8a;"><a href="index.html" style="color:#ffffff;font-size:15px;letter-spacing:0.15em;text-decoration:none;">ＡＥＳＴＨＥＴＩＣ</a><nav style="display:flex;gap:22px;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;"><a href="shop.html" style="color:#c0f0ff;text-decoration:none;">Shop</a><a href="about.html" style="color:#c0f0ff;text-decoration:none;">About</a></nav></header>'
    footer = '<footer style="padding:24px 48px;background:#5a2d8a;color:#c0f0ff;font-family:Manrope,sans-serif;font-size:12px;letter-spacing:0.3em;text-align:center;text-transform:uppercase;">© Vaporwave Records · Please shop responsibly</footer>'
    return _tpl(
        "starter-vaporwave",
        "Vaporwave",
        "Sunset gradient, roman busts, mall music, aesthetic™.",
        "vaporwave",
        "#0f0d3a",
        ["VT323", "Manrope"],
        html_blocks=[],
        pages=[
            _page("starter-vaporwave", "Home", "#0f0d3a", ["VT323", "Manrope"], [
                nav,
                '<section style="min-height:60vh;padding:64px 48px;background:linear-gradient(180deg,#0f0d3a 0%,#5a2d8a 40%,#ff5db1 75%,#ffb56b 100%);font-family:VT323,monospace;color:#ffffff;position:relative;overflow:hidden;"><div style="max-width:700px;position:relative;z-index:2;"><div style="font-family:Manrope,sans-serif;font-size:11px;letter-spacing:0.4em;color:#c0f0ff;text-transform:uppercase;margin-bottom:16px;">ｅｓｔａｂｌｉｓｈｅｄ · １９９４</div><h1 style="font-size:120px;line-height:0.95;margin:0 0 20px;letter-spacing:0.05em;text-shadow:4px 4px 0 #ff5db1,-2px -2px 0 #00e5ff;">ＡＥＳＴＨＥＴＩＣ</h1><p style="font-family:Manrope,sans-serif;font-size:17px;line-height:1.7;max-width:520px;color:#e8d8ff;">The mall is closed. The muzak plays anyway. Neon sunsets, roman busts, and the quiet math of a receipt from 1997.</p><div style="margin-top:32px;display:flex;gap:16px;"><a href="shop.html" style="padding:14px 26px;background:#0f0d3a;color:#ffffff;text-decoration:none;font-family:Manrope,sans-serif;font-size:13px;letter-spacing:0.2em;text-transform:uppercase;border:1px solid #ff5db1;">Enter Mall</a></div></div><div style="position:absolute;left:0;right:0;bottom:0;height:120px;background:repeating-linear-gradient(0deg,#ff5db1 0 2px,transparent 2px 12px),linear-gradient(180deg,transparent,#0f0d3a);"></div></section>',
                '<section style="padding:64px 48px;background:#0f0d3a;color:#e8d8ff;font-family:VT323,monospace;text-align:center;"><h2 style="font-size:64px;margin:0 0 24px;letter-spacing:0.05em;">ＴＲＡＣＫ ＬＩＳＴ</h2><ol style="list-style:none;padding:0;max-width:520px;margin:0 auto;text-align:left;font-family:Manrope,sans-serif;font-size:14px;">' + "".join([f'<li style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px dashed #5a2d8a;"><span>{i:02d} — {t}</span><span style="color:#ff5db1;">{d}</span></li>' for i, (t, d) in enumerate([("マクロス", "5:11"), ("Neon Reflections", "4:03"), ("Interior Mall", "6:47"), ("Sunset Escalator", "3:29")], 1)]) + '</ol></section>',
                footer,
            ], seo={"title": "ＡＥＳＴＨＥＴＩＣ — Vaporwave Records", "description": "Sunset gradient, roman busts, mall music."}, page_id="starter-vaporwave-home", slug="index"),
            _page("starter-vaporwave-shop", "Shop", "#0f0d3a", ["VT323", "Manrope"], [
                nav,
                '<section style="padding:56px 48px;background:#0f0d3a;color:#e8d8ff;font-family:VT323,monospace;text-align:center;"><h1 style="font-size:56px;margin:0 0 32px;letter-spacing:0.05em;">ＴＨＥ ＳＨＯＰ</h1><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;max-width:800px;margin:0 auto;text-align:left;">' + "".join([f'<div style="background:#1a1750;border:1px solid #5a2d8a;padding:18px;"><div style="aspect-ratio:1;background:linear-gradient(135deg,#ff5db1,#5a2d8a);margin-bottom:10px;"></div><div style="font-family:Manrope,sans-serif;font-size:13px;color:#fff;">{t}</div><div style="font-family:Manrope,sans-serif;font-size:12px;color:#ff5db1;">{p}</div></div>' for t, p in [("Vaporwave Records LP", "$28"), ("Marble Bust Figurine", "$42"), ("Neon Sunset Print", "$18")]]) + '</div></section>',
                footer,
            ], seo={"title": "Shop — Vaporwave Records", "description": "Records, prints, and marble busts."}, page_id="starter-vaporwave-shop", slug="shop"),
            _page("starter-vaporwave-about", "About", "#0f0d3a", ["VT323", "Manrope"], [
                nav,
                '<section style="padding:64px 48px;background:#0f0d3a;color:#e8d8ff;font-family:Manrope,sans-serif;text-align:center;"><div style="max-width:520px;margin:0 auto;"><h1 style="font-family:VT323,monospace;font-size:48px;color:#fff;margin:0 0 16px;letter-spacing:0.05em;">ＡＢＯＵＴ</h1><p style="font-size:14px;line-height:1.8;">A very small label pressing very small runs of music that sounds like an empty mall at 2am. Est. 1994, allegedly.</p></div></section>',
                footer,
            ], seo={"title": "About — Vaporwave Records", "description": "A very small label."}, page_id="starter-vaporwave-about", slug="about"),
        ],
    )


def _starter_cyberpunk() -> Dict[str, Any]:
    nav = '<header style="padding:18px 56px;background:#050510;font-family:\'JetBrains Mono\',monospace;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #2a0a3a;"><a href="index.html" style="color:#00e5ff;font-family:Orbitron,sans-serif;font-size:15px;text-decoration:none;letter-spacing:0.05em;">// NETRUNNER</a><nav style="display:flex;gap:22px;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;"><a href="pricing.html" style="color:#e8f5ff;text-decoration:none;">Access</a><a href="about.html" style="color:#e8f5ff;text-decoration:none;">About</a></nav></header>'
    footer = '<footer style="padding:24px 56px;background:#050510;color:#4a5a70;font-family:\'JetBrains Mono\',monospace;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;text-align:center;border-top:1px solid #2a0a3a;">// end of transmission · burn after reading</footer>'
    return _tpl(
        "starter-cyberpunk",
        "Cyberpunk",
        "Neon skylines, black terminals, hot pink alerts, moody rain.",
        "cyberpunk",
        "#050510",
        ["Orbitron", "JetBrains Mono"],
        html_blocks=[],
        pages=[
            _page("starter-cyberpunk", "Home", "#050510", ["Orbitron", "JetBrains Mono"], [
                nav,
                '<section style="min-height:60vh;padding:64px 56px;background:radial-gradient(ellipse at 70% 20%,#2a0a3a 0%,#050510 60%);font-family:Orbitron,sans-serif;color:#e8f5ff;position:relative;overflow:hidden;"><div style="max-width:680px;position:relative;z-index:2;"><div style="display:inline-block;padding:6px 14px;border:1px solid #ff2ea8;color:#ff2ea8;font-family:\'JetBrains Mono\',monospace;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">// signal received · 03:42:17</div><h1 style="font-size:82px;line-height:1;margin:20px 0 18px;font-weight:700;letter-spacing:-0.01em;color:#00e5ff;text-shadow:0 0 20px rgba(0,229,255,0.5);">JACK IN.<br><span style="color:#ff2ea8;text-shadow:0 0 20px rgba(255,46,168,0.5);">STAY UP.</span></h1><p style="font-family:\'JetBrains Mono\',monospace;font-size:15px;line-height:1.7;color:#a0c8e0;max-width:520px;">Chrome under the skin. A city that never dims. Somewhere a corporate server is asking who you are and the honest answer is: none of your business.</p><div style="margin-top:34px;display:flex;gap:14px;"><a href="pricing.html" style="padding:14px 28px;background:transparent;border:1px solid #00e5ff;color:#00e5ff;text-decoration:none;font-family:\'JetBrains Mono\',monospace;font-size:13px;letter-spacing:0.2em;text-transform:uppercase;">Get access</a></div></div></section>',
                '<section style="padding:72px 56px;background:#080818;color:#e8f5ff;font-family:\'JetBrains Mono\',monospace;border-top:1px solid #2a0a3a;"><h2 style="font-family:Orbitron,sans-serif;font-size:36px;margin:0 0 40px;color:#00e5ff;">// SYSTEMS ONLINE</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;">' + "".join([f'<div style="padding:24px;border:1px solid #2a2a4a;background:#0a0a20;position:relative;"><div style="position:absolute;top:8px;right:12px;width:8px;height:8px;background:{c};border-radius:50%;box-shadow:0 0 8px {c};"></div><div style="font-size:11px;color:{c};letter-spacing:0.2em;">{s}</div><h3 style="margin:8px 0 6px;font-family:Orbitron,sans-serif;font-size:18px;color:#e8f5ff;letter-spacing:0.05em;">{t}</h3><p style="margin:0;font-size:12px;line-height:1.6;color:#8098b0;">{d}</p></div>' for s, c, t, d in [("[ ACTIVE ]", "#00e5ff", "NETRUNNER v9", "Cloaked packets · zero-latency uplink."), ("[ HOT ]", "#ff2ea8", "ICEBREAKER", "Bypass corp firewalls in ≤ 3.4s."), ("[ IDLE ]", "#c8ff2e", "GHOST SHELL", "Voiceprint spoof · plausible alibi.")]]) + '</div></section>',
                footer,
            ], seo={"title": "NETRUNNER — Jack in. Stay up.", "description": "Neon skylines, black terminals, hot pink alerts."}, page_id="starter-cyberpunk-home", slug="index"),
            _page("starter-cyberpunk-pricing", "Access", "#050510", ["Orbitron", "JetBrains Mono"], [
                nav,
                '<section style="padding:64px 56px;background:#080818;font-family:\'JetBrains Mono\',monospace;color:#e8f5ff;"><h1 style="font-family:Orbitron,sans-serif;font-size:36px;margin:0 0 32px;color:#00e5ff;text-align:center;">// ACCESS TIERS</h1><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;max-width:900px;margin:0 auto;">' + "".join([f'<div style="padding:24px;border:1px solid #2a2a4a;background:#0a0a20;text-align:center;"><div style="font-size:11px;color:{c};letter-spacing:0.2em;margin-bottom:8px;">{n}</div><div style="font-family:Orbitron,sans-serif;font-size:28px;color:#e8f5ff;margin-bottom:14px;">{p}</div><a href="#" style="display:block;padding:10px;border:1px solid {c};color:{c};text-decoration:none;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;">Deploy</a></div>' for n, p, c in [("STREET", "Free", "#8098b0"), ("RUNNER", "$29/mo", "#00e5ff"), ("GHOST", "$99/mo", "#ff2ea8")]]) + '</div></section>',
                footer,
            ], seo={"title": "Access — NETRUNNER", "description": "Access tiers."}, page_id="starter-cyberpunk-pricing", slug="pricing"),
            _page("starter-cyberpunk-about", "About", "#050510", ["Orbitron", "JetBrains Mono"], [
                nav,
                '<section style="padding:64px 56px;background:#050510;font-family:\'JetBrains Mono\',monospace;color:#a0c8e0;text-align:center;"><div style="max-width:520px;margin:0 auto;"><h1 style="font-family:Orbitron,sans-serif;font-size:32px;color:#00e5ff;margin:0 0 16px;">// ABOUT</h1><p style="font-size:14px;line-height:1.8;">Three ex-security researchers who got tired of corp NDAs. NETRUNNER runs on your infrastructure, not ours — we never see your keys.</p></div></section>',
                footer,
            ], seo={"title": "About — NETRUNNER", "description": "About the team."}, page_id="starter-cyberpunk-about", slug="about"),
        ],
    )


def _starter_brutalism() -> Dict[str, Any]:
    nav = '<header style="padding:18px 48px;background:#ffffff;border-bottom:4px solid #000000;font-family:\'IBM Plex Mono\',monospace;display:flex;align-items:center;justify-content:space-between;"><a href="index.html" style="color:#000000;font-weight:700;text-decoration:none;font-size:14px;text-transform:uppercase;">STUDIO BRUT</a><nav style="display:flex;gap:0;font-size:12px;text-transform:uppercase;font-weight:700;"><a href="work.html" style="color:#000000;text-decoration:none;padding:6px 12px;border:2px solid #000000;">WORK</a><a href="contact.html" style="color:#000000;text-decoration:none;padding:6px 12px;border:2px solid #000000;border-left:none;">CONTACT</a></nav></header>'
    footer = '<footer style="padding:24px 48px;background:#000000;color:#ffffff;font-family:\'IBM Plex Mono\',monospace;font-size:12px;display:flex;justify-content:space-between;"><span>©2026 STUDIO BRUT · BERLIN — LAGOS — LEIPZIG</span><span>hello@brut.studio</span></footer>'
    return _tpl(
        "starter-brutalism",
        "Web Brutalism",
        "Loud, bare, deliberately ugly, and impossible to ignore.",
        "brutalism",
        "#ffffff",
        ["IBM Plex Mono", "Space Grotesk"],
        html_blocks=[],
        pages=[
            _page("starter-brutalism", "Home", "#ffffff", ["IBM Plex Mono", "Space Grotesk"], [
                nav,
                '<section style="min-height:60vh;padding:56px 48px;background:#ffffff;font-family:\'IBM Plex Mono\',monospace;color:#000000;border-bottom:8px solid #000000;"><div style="border:4px solid #000000;padding:40px;max-width:760px;"><div style="font-size:11px;letter-spacing:0.2em;margin-bottom:12px;">FILE_ID: 001 · LAST_EDIT: 2026-02-14 08:11</div><h1 style="font-family:\'Space Grotesk\',sans-serif;font-size:88px;line-height:0.95;margin:0 0 20px;font-weight:900;text-transform:uppercase;letter-spacing:-0.02em;">WE MAKE UGLY THINGS THAT WORK.</h1><p style="font-size:15px;line-height:1.7;max-width:520px;margin:0;">No shadows. No gradients. No round corners. Type where type belongs. Buttons that are clearly buttons. A website that could survive a nuclear winter.</p><div style="margin-top:32px;display:flex;gap:0;"><a href="contact.html" style="padding:16px 28px;background:#000000;color:#ffff00;text-decoration:none;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">[ HIRE US ]</a><a href="work.html" style="padding:16px 28px;background:#ffff00;color:#000000;text-decoration:none;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;border:4px solid #000000;border-left:none;">[ SEE WORK ]</a></div></div></section>',
                footer,
            ], seo={"title": "STUDIO BRUT — We make ugly things that work", "description": "Loud, bare, deliberately ugly."}, page_id="starter-brutalism-home", slug="index"),
            _page("starter-brutalism-work", "Work", "#ffffff", ["IBM Plex Mono", "Space Grotesk"], [
                nav,
                '<section style="padding:0;background:#ffff00;font-family:\'IBM Plex Mono\',monospace;color:#000000;border-bottom:8px solid #000000;"><div style="padding:48px;"><h2 style="font-family:\'Space Grotesk\',sans-serif;font-size:44px;margin:0 0 24px;font-weight:900;text-transform:uppercase;">WHAT WE MAKE, SPECIFICALLY.</h2><table style="width:100%;border-collapse:collapse;font-size:14px;"><thead><tr style="border-top:2px solid #000000;border-bottom:2px solid #000000;text-align:left;"><th style="padding:12px 0;">CLIENT</th><th style="padding:12px 0;">THING</th><th style="padding:12px 0;">YEAR</th></tr></thead><tbody>' + "".join([f'<tr style="border-bottom:1px solid #000000;"><td style="padding:14px 0;">{a}</td><td style="padding:14px 0;">{b}</td><td style="padding:14px 0;">{y}</td></tr>' for a, b, y in [("MERZBAU RECORDS", "Vinyl catalogue site", "2025"), ("HAAS TYPE FOUNDRY", "Specimen viewer", "2024"), ("KRUEGER GALLERY", "Show archive", "2024"), ("BERLIN NOISE FEST", "Ticketing", "2023")]]) + '</tbody></table></div></section>',
                footer,
            ], seo={"title": "Work — STUDIO BRUT", "description": "Client work."}, page_id="starter-brutalism-work", slug="work"),
            _page("starter-brutalism-contact", "Contact", "#ffffff", ["IBM Plex Mono", "Space Grotesk"], [
                nav,
                '<section style="padding:64px 48px;background:#ffffff;font-family:\'IBM Plex Mono\',monospace;color:#000000;border-bottom:8px solid #000000;text-align:center;"><h1 style="font-family:\'Space Grotesk\',sans-serif;font-size:44px;font-weight:900;text-transform:uppercase;margin:0 0 16px;">[ HIRE US ]</h1><a href="mailto:hello@brut.studio" style="font-size:18px;color:#000000;text-decoration:none;border-bottom:3px solid #000000;">hello@brut.studio</a></section>',
                footer,
            ], seo={"title": "Contact — STUDIO BRUT", "description": "Get in touch."}, page_id="starter-brutalism-contact", slug="contact"),
        ],
    )


def _starter_bauhaus() -> Dict[str, Any]:
    nav = '<header style="padding:20px 56px;background:#f2eede;font-family:\'Space Grotesk\',sans-serif;display:flex;align-items:center;justify-content:space-between;"><a href="index.html" style="color:#0a0a0a;font-weight:700;font-size:16px;text-decoration:none;">Studio Bauhaus</a><nav style="display:flex;gap:24px;font-size:13px;text-transform:uppercase;letter-spacing:0.05em;"><a href="work.html" style="color:#0a0a0a;text-decoration:none;">Work</a><a href="contact.html" style="color:#0a0a0a;text-decoration:none;">Contact</a></nav></header>'
    footer = '<footer style="padding:24px 56px;background:#e63946;color:#f2eede;font-family:\'Space Grotesk\',sans-serif;font-size:13px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;">Studio Bauhaus · Est. 2026 · A very old idea, again.</footer>'
    return _tpl(
        "starter-bauhaus",
        "Bauhaus",
        "Primary colours and pure geometry — 1919 shows up early.",
        "bauhaus",
        "#f2eede",
        ["Space Grotesk"],
        html_blocks=[],
        pages=[
            _page("starter-bauhaus", "Home", "#f2eede", ["Space Grotesk"], [
                nav,
                '<section style="min-height:60vh;padding:64px 56px;background:#f2eede;font-family:\'Space Grotesk\',sans-serif;color:#0a0a0a;position:relative;overflow:hidden;"><div style="max-width:600px;position:relative;z-index:2;"><div style="width:60px;height:60px;background:#e63946;border-radius:50%;margin-bottom:20px;"></div><h1 style="font-size:76px;line-height:0.98;margin:0 0 20px;font-weight:700;letter-spacing:-0.03em;">Form.<br>Function.<br><span style="color:#e63946;">Repeat.</span></h1><p style="font-size:17px;line-height:1.65;max-width:460px;color:#3a3a3a;">A design studio still following the 1919 syllabus. Squares. Circles. Triangles. The rest is decoration and decoration is a crime.</p><div style="margin-top:32px;"><a href="work.html" style="padding:14px 32px;background:#0a0a0a;color:#f2eede;text-decoration:none;font-weight:600;font-size:14px;letter-spacing:0.1em;text-transform:uppercase;">Studio →</a></div></div><div style="position:absolute;right:80px;top:80px;width:200px;height:200px;background:#f4c542;"></div><div style="position:absolute;right:0;bottom:0;width:0;height:0;border-left:180px solid transparent;border-right:180px solid transparent;border-bottom:280px solid #3b6bd6;opacity:0.85;"></div></section>',
                '<section style="padding:80px 56px;background:#0a0a0a;color:#f2eede;font-family:\'Space Grotesk\',sans-serif;"><h2 style="font-size:44px;margin:0 0 40px;font-weight:600;">Three ideas we live by.</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:32px;">' + "".join([f'<div><div style="width:64px;height:64px;background:{c};{s}margin-bottom:20px;"></div><h3 style="margin:0 0 8px;font-size:20px;font-weight:600;">{t}</h3><p style="margin:0;font-size:14px;line-height:1.6;color:#a8a8a8;">{d}</p></div>' for c, s, t, d in [("#e63946", "border-radius:50%;", "Circle · Idea", "The germ. The concept. The origin."), ("#f4c542", "", "Square · Craft", "The discipline that turns idea into thing."), ("#3b6bd6", "clip-path:polygon(50% 0,100% 100%,0 100%);", "Triangle · Direction", "Where the whole thing is pointed.")]]) + '</div></section>',
                footer,
            ], seo={"title": "Studio Bauhaus — Form. Function. Repeat.", "description": "Primary colours and pure geometry."}, page_id="starter-bauhaus-home", slug="index"),
            _page("starter-bauhaus-work", "Work", "#f2eede", ["Space Grotesk"], [
                nav,
                '<section style="padding:64px 56px;background:#f2eede;font-family:\'Space Grotesk\',sans-serif;color:#0a0a0a;"><h1 style="font-size:40px;margin:0 0 32px;font-weight:700;">Recent work.</h1><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;">' + "".join([f'<div><div style="aspect-ratio:4/3;background:{c};margin-bottom:12px;"></div><h3 style="margin:0 0 4px;font-size:16px;">{t}</h3><p style="margin:0;font-size:13px;color:#5a5a5a;">{d}</p></div>' for c, t, d in [("#e63946", "Meridian Bank", "Full identity + digital"), ("#f4c542", "Kessler Type", "Type foundry site"), ("#3b6bd6", "Nordhaus Gallery", "Exhibition catalogue")]]) + '</div></section>',
                footer,
            ], seo={"title": "Work — Studio Bauhaus", "description": "Recent studio work."}, page_id="starter-bauhaus-work", slug="work"),
            _page("starter-bauhaus-contact", "Contact", "#f2eede", ["Space Grotesk"], [
                nav,
                '<section style="padding:64px 56px;background:#0a0a0a;color:#f2eede;font-family:\'Space Grotesk\',sans-serif;text-align:center;"><h1 style="font-size:36px;margin:0 0 16px;font-weight:700;">Let\'s talk.</h1><a href="mailto:studio@bauhaus.works" style="font-size:18px;color:#f4c542;text-decoration:none;">studio@bauhaus.works</a></section>',
                footer,
            ], seo={"title": "Contact — Studio Bauhaus", "description": "Get in touch."}, page_id="starter-bauhaus-contact", slug="contact"),
        ],
    )


def _starter_scandi_minimal() -> Dict[str, Any]:
    nav = '<header style="padding:28px 96px;background:#faf8f4;font-family:Inter,sans-serif;display:flex;align-items:center;justify-content:space-between;"><a href="index.html" style="font-size:15px;letter-spacing:0.1em;text-transform:uppercase;color:#0a0a0a;text-decoration:none;">Studio</a><nav style="display:flex;gap:28px;font-size:13px;color:#4a4a4a;"><a href="shop.html" style="color:#0a0a0a;text-decoration:none;">Shop</a><a href="about.html" style="color:#0a0a0a;text-decoration:none;">About</a></nav></header>'
    footer = '<footer style="padding:32px 96px;background:#faf8f4;color:#7a7a7a;font-family:Inter,sans-serif;font-size:12px;letter-spacing:0.1em;display:flex;justify-content:space-between;"><span>© 2026 STUDIO</span><span>Ravnsborggade 22 · København N</span></footer>'
    return _tpl(
        "starter-scandi-minimal",
        "Scandi Minimal",
        "Whitespace as luxury. Two tones. One good serif.",
        "scandi-minimal",
        "#faf8f4",
        ["Inter", "Fraunces"],
        html_blocks=[],
        pages=[
            _page("starter-scandi-minimal", "Home", "#faf8f4", ["Inter", "Fraunces"], [
                nav,
                '<section style="min-height:56vh;padding:88px 96px;background:#faf8f4;font-family:Inter,sans-serif;color:#0a0a0a;"><div style="max-width:580px;"><div style="font-size:11px;letter-spacing:0.32em;text-transform:uppercase;color:#7a7a7a;margin-bottom:24px;">Est. 2019 · Copenhagen</div><h1 style="font-family:Fraunces,serif;font-size:64px;line-height:1.05;margin:0 0 24px;font-weight:400;letter-spacing:-0.02em;">Less, but of the very best.</h1><p style="font-size:16px;line-height:1.75;color:#4a4a4a;max-width:460px;">Objects, furniture, and small ideas made by four people in a former bakery. We ship two collections a year and re-use the wrapping.</p><div style="margin-top:44px;"><a href="shop.html" style="padding:14px 0;color:#0a0a0a;text-decoration:none;border-bottom:1px solid #0a0a0a;font-size:14px;letter-spacing:0.05em;">Browse the shop &nbsp;→</a></div></div></section>',
                '<section style="padding:96px 96px;background:#f0ece2;font-family:Inter,sans-serif;color:#0a0a0a;"><div style="display:grid;grid-template-columns:1fr 1fr;gap:96px;align-items:end;"><h2 style="font-family:Fraunces,serif;font-size:44px;margin:0;font-weight:400;line-height:1.15;">Two collections. Zero fuss.</h2><p style="font-size:15px;line-height:1.8;color:#4a4a4a;margin:0;">Autumn arrives 04 September. Preview available for members from 21 August. All pieces are hand-finished in our workshop; edition sizes are printed on the tag.</p></div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:48px;">' + "".join([f'<div><div style="aspect-ratio:1/1.2;background:{c};margin-bottom:12px;"></div><div style="font-size:13px;color:#0a0a0a;">{t}</div><div style="font-size:12px;color:#7a7a7a;">{p}</div></div>' for c, t, p in [("#d4ccbf", "Oak stool · No. 3", "€ 240"), ("#c8bfae", "Linen throw · Ivory", "€ 120"), ("#a89e88", "Ceramic vessel", "€ 88")]]) + '</div></section>',
                footer,
            ], seo={"title": "Studio — Less, but of the very best", "description": "Whitespace as luxury."}, page_id="starter-scandi-minimal-home", slug="index"),
            _page("starter-scandi-minimal-shop", "Shop", "#faf8f4", ["Inter", "Fraunces"], [
                nav,
                '<section style="padding:80px 96px;background:#faf8f4;font-family:Inter,sans-serif;color:#0a0a0a;"><h1 style="font-family:Fraunces,serif;font-size:40px;margin:0 0 40px;font-weight:400;">The full collection.</h1><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px;">' + "".join([f'<div><div style="aspect-ratio:1/1.2;background:{c};margin-bottom:10px;"></div><div style="font-size:13px;">{t}</div><div style="font-size:12px;color:#7a7a7a;">{p}</div></div>' for c, t, p in [("#d4ccbf", "Oak stool · No. 3", "€ 240"), ("#c8bfae", "Linen throw · Ivory", "€ 120"), ("#a89e88", "Ceramic vessel", "€ 88"), ("#e0d8c8", "Wool cushion", "€ 64"), ("#b8ac96", "Glass carafe", "€ 52"), ("#ccc2ae", "Oak tray", "€ 78"), ("#9a8f78", "Wall hook set", "€ 36"), ("#e8e0d0", "Cotton throw", "€ 96")]]) + '</div></section>',
                footer,
            ], seo={"title": "Shop — Studio", "description": "The full collection."}, page_id="starter-scandi-minimal-shop", slug="shop"),
            _page("starter-scandi-minimal-about", "About", "#faf8f4", ["Inter", "Fraunces"], [
                nav,
                '<section style="padding:88px 96px;background:#faf8f4;font-family:Inter,sans-serif;color:#0a0a0a;"><div style="max-width:520px;"><h1 style="font-family:Fraunces,serif;font-size:36px;margin:0 0 20px;font-weight:400;">About Studio.</h1><p style="font-size:15px;line-height:1.75;color:#4a4a4a;">Four people, one former bakery in Nørrebro, two collections a year. Every piece is hand-finished and numbered; nothing is made faster just because it could be.</p></div></section>',
                footer,
            ], seo={"title": "About — Studio", "description": "About the studio."}, page_id="starter-scandi-minimal-about", slug="about"),
        ],
    )


def _starter_memphis() -> Dict[str, Any]:
    nav = '<header style="padding:18px 48px;background:#fdf6e3;font-family:\'DM Sans\',sans-serif;display:flex;align-items:center;justify-content:space-between;"><a href="index.html" style="font-family:\'Rubik Mono One\',sans-serif;color:#ff3b8b;font-size:15px;text-decoration:none;text-transform:uppercase;">Memphis</a><nav style="display:flex;gap:20px;font-size:13px;font-weight:700;"><a href="portfolio.html" style="color:#1a1a1a;text-decoration:none;">Portfolio</a><a href="contact.html" style="color:#1a1a1a;text-decoration:none;">Contact</a></nav></header>'
    footer = '<footer style="padding:24px 48px;background:#1a1a1a;color:#ffcf3c;font-family:\'Rubik Mono One\',sans-serif;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;text-align:center;">© Memphis Studio · No boring briefs</footer>'
    return _tpl(
        "starter-memphis",
        "Memphis Group",
        "Squiggles, terrazzo, and 1985 having far too much fun.",
        "memphis",
        "#fdf6e3",
        ["Rubik Mono One", "DM Sans"],
        html_blocks=[],
        pages=[
            _page("starter-memphis", "Home", "#fdf6e3", ["Rubik Mono One", "DM Sans"], [
                nav,
                '<section style="min-height:60vh;padding:64px 48px;background:#fdf6e3;font-family:\'DM Sans\',sans-serif;color:#1a1a1a;position:relative;overflow:hidden;"><div style="max-width:640px;position:relative;z-index:2;"><h1 style="font-family:\'Rubik Mono One\',sans-serif;font-size:72px;line-height:1;margin:0 0 20px;color:#ff3b8b;text-transform:uppercase;">Loud on <span style="color:#00b8d4;">purpose</span>.</h1><p style="font-size:17px;line-height:1.65;max-width:480px;color:#3a3a3a;">A studio for brands that would rather be remembered than tasteful. Squiggles, terrazzo, mustard-yellow. If your grandmother hates it, we\'ve done our job.</p><div style="margin-top:32px;display:flex;gap:14px;flex-wrap:wrap;"><a href="contact.html" style="padding:14px 26px;background:#ffcf3c;color:#1a1a1a;text-decoration:none;font-weight:700;border-radius:999px;font-size:14px;">Say hello →</a><a href="portfolio.html" style="padding:14px 26px;background:#1a1a1a;color:#fdf6e3;text-decoration:none;font-weight:700;border-radius:999px;font-size:14px;">Portfolio</a></div></div><div style="position:absolute;right:60px;top:50px;width:100px;height:100px;background:#00b8d4;border-radius:50%;"></div><div style="position:absolute;right:180px;top:180px;width:80px;height:80px;background:#ffcf3c;transform:rotate(15deg);"></div><div style="position:absolute;right:40px;bottom:40px;width:180px;height:16px;background:repeating-linear-gradient(90deg,#ff3b8b 0 20px,#1a1a1a 20px 24px);"></div></section>',
                '<section style="padding:72px 48px;background:#00b8d4;font-family:\'DM Sans\',sans-serif;color:#1a1a1a;"><h2 style="font-family:\'Rubik Mono One\',sans-serif;font-size:40px;margin:0 0 32px;text-transform:uppercase;">Recent noise.</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;">' + "".join([f'<div style="padding:24px;background:{c};border-radius:24px;transform:rotate({r}deg);"><h3 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#1a1a1a;">{t}</h3><p style="margin:0;font-size:14px;line-height:1.5;color:#1a1a1a;">{d}</p></div>' for c, r, t, d in [("#ffcf3c", "-2", "Fanta rebrand", "Terrazzo cans. Yes really."), ("#ff3b8b", "1.5", "Squiggle Fest", "Two-day type festival in Milan."), ("#fdf6e3", "-1", "Radio 6 idents", "Six squiggles, three seconds each.")]]) + '</div></section>',
                footer,
            ], seo={"title": "Memphis Studio — Loud on purpose", "description": "Squiggles, terrazzo, and 1985 having far too much fun."}, page_id="starter-memphis-home", slug="index"),
            _page("starter-memphis-portfolio", "Portfolio", "#fdf6e3", ["Rubik Mono One", "DM Sans"], [
                nav,
                '<section style="padding:56px 48px;background:#ff3b8b;font-family:\'DM Sans\',sans-serif;color:#1a1a1a;"><h1 style="font-family:\'Rubik Mono One\',sans-serif;font-size:40px;margin:0 0 32px;text-transform:uppercase;color:#fff;">Full portfolio.</h1><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;">' + "".join([f'<div style="padding:22px;background:{c};border-radius:20px;transform:rotate({r}deg);"><h3 style="margin:0 0 6px;font-size:18px;font-weight:800;">{t}</h3><p style="margin:0;font-size:13px;">{d}</p></div>' for c, r, t, d in [("#ffcf3c", "1", "Bonkers Cereal", "Full box + brand system"), ("#00b8d4", "-1", "Squiggle Records", "Label identity"), ("#fdf6e3", "0.5", "Kaleido Fest", "Festival wayfinding"), ("#ffcf3c", "-1.5", "Muji Rival Co.", "Retail rebrand, on purpose ironic"), ("#00b8d4", "1.5", "Zigzag Kids", "Toy packaging"), ("#fdf6e3", "1", "Prism Radio", "On-air idents")]]) + '</div></section>',
                footer,
            ], seo={"title": "Portfolio — Memphis Studio", "description": "The full portfolio."}, page_id="starter-memphis-portfolio", slug="portfolio"),
            _page("starter-memphis-contact", "Contact", "#fdf6e3", ["Rubik Mono One", "DM Sans"], [
                nav,
                '<section style="padding:64px 48px;background:#fdf6e3;font-family:\'DM Sans\',sans-serif;color:#1a1a1a;text-align:center;"><h1 style="font-family:\'Rubik Mono One\',sans-serif;font-size:36px;color:#ff3b8b;margin:0 0 16px;text-transform:uppercase;">Say hello.</h1><a href="mailto:hello@memphis.studio" style="font-size:18px;color:#1a1a1a;text-decoration:none;font-weight:700;">hello@memphis.studio</a></section>',
                footer,
            ], seo={"title": "Contact — Memphis Studio", "description": "Get in touch."}, page_id="starter-memphis-contact", slug="contact"),
        ],
    )


def _starter_retro_futurism() -> Dict[str, Any]:
    nav = '<header style="padding:18px 56px;background:#7a2b12;font-family:\'Space Mono\',monospace;display:flex;align-items:center;justify-content:space-between;"><a href="index.html" style="color:#f2e6d0;font-size:13px;letter-spacing:0.2em;text-transform:uppercase;text-decoration:none;">Ariel-VII</a><nav style="display:flex;gap:22px;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;"><a href="modules.html" style="color:#f2e6d0;text-decoration:none;">Modules</a><a href="crew.html" style="color:#f2e6d0;text-decoration:none;">Join the crew</a></nav></header>'
    footer = '<footer style="padding:24px 56px;background:#7a2b12;color:#f2e6d0;font-family:\'Space Mono\',monospace;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;text-align:center;">Transmission ends · Godspeed, traveller</footer>'
    return _tpl(
        "starter-retro-futurism",
        "Retro-Futurism",
        "1970s space-station optimism — orange, brown, cream, tomorrow.",
        "retro-futurism",
        "#f2e6d0",
        ["DM Serif Display", "Space Mono"],
        html_blocks=[],
        pages=[
            _page("starter-retro-futurism", "Home", "#f2e6d0", ["DM Serif Display", "Space Mono"], [
                nav,
                '<section style="min-height:60vh;padding:64px 56px;background:radial-gradient(circle at 80% 20%,#f0a038 0%,#c5551d 40%,#7a2b12 100%);font-family:\'DM Serif Display\',serif;color:#f2e6d0;position:relative;overflow:hidden;"><div style="max-width:640px;position:relative;z-index:2;"><div style="font-family:\'Space Mono\',monospace;font-size:11px;letter-spacing:0.3em;color:#f2e6d0;text-transform:uppercase;margin-bottom:20px;">MISSION LOG · 04 MARCH 1978</div><h1 style="font-size:82px;line-height:1;margin:0 0 20px;font-weight:400;letter-spacing:-0.01em;">The future,<br>as promised.</h1><p style="font-family:\'Space Mono\',monospace;font-size:14px;line-height:1.8;max-width:500px;color:#f8e6c4;">Rotating space-stations, orange plastic chairs, and a computer the size of a wardrobe that answers politely. This is the tomorrow we were sold. We saved you a seat.</p><div style="margin-top:32px;display:flex;gap:14px;"><a href="crew.html" style="padding:14px 28px;background:#f2e6d0;color:#7a2b12;text-decoration:none;font-family:\'Space Mono\',monospace;font-size:13px;letter-spacing:0.2em;text-transform:uppercase;border-radius:999px;">Board the ship</a></div></div><div style="position:absolute;right:-40px;bottom:-60px;width:260px;height:260px;border-radius:50%;border:12px solid #f2e6d0;opacity:0.4;"></div></section>',
                '<section style="padding:80px 56px;background:#f2e6d0;color:#3a1f10;font-family:\'DM Serif Display\',serif;"><h2 style="font-size:44px;margin:0 0 32px;font-weight:400;">Aboard the Ariel-VII.</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;font-family:\'Space Mono\',monospace;">' + "".join([f'<div style="padding:24px;background:#e8d4a8;border-radius:20px;"><div style="font-size:11px;color:#c5551d;letter-spacing:0.2em;">MODULE {n}</div><h3 style="margin:8px 0 6px;font-family:\'DM Serif Display\',serif;font-weight:400;font-size:20px;">{t}</h3><p style="margin:0;font-size:12px;line-height:1.6;color:#5a3a24;">{d}</p></div>' for n, t, d in [("A", "Observation deck", "Panoramic view of a very slow Earth."), ("B", "Comms lounge", "Radio, snacks, orange velour."), ("C", "Hydroponics", "Tomatoes on a schedule.")]]) + '</div></section>',
                footer,
            ], seo={"title": "Ariel-VII — The future, as promised", "description": "1970s space-station optimism."}, page_id="starter-retro-futurism-home", slug="index"),
            _page("starter-retro-futurism-modules", "Modules", "#f2e6d0", ["DM Serif Display", "Space Mono"], [
                nav,
                '<section style="padding:64px 56px;background:#f2e6d0;color:#3a1f10;font-family:\'DM Serif Display\',serif;"><h1 style="font-size:44px;margin:0 0 32px;font-weight:400;">Full deck plan.</h1><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;font-family:\'Space Mono\',monospace;">' + "".join([f'<div style="padding:24px;background:#e8d4a8;border-radius:20px;"><div style="font-size:11px;color:#c5551d;letter-spacing:0.2em;">MODULE {n}</div><h3 style="margin:8px 0 6px;font-family:\'DM Serif Display\',serif;font-weight:400;font-size:20px;">{t}</h3><p style="margin:0;font-size:12px;line-height:1.6;color:#5a3a24;">{d}</p></div>' for n, t, d in [("D", "Sleeping quarters", "One bunk, one window, artificial gravity."), ("E", "Zero-g gymnasium", "Mandatory Tuesdays and Fridays."), ("F", "The library", "Every book that survived the transfer.")]]) + '</div></section>',
                footer,
            ], seo={"title": "Modules — Ariel-VII", "description": "The full deck plan."}, page_id="starter-retro-futurism-modules", slug="modules"),
            _page("starter-retro-futurism-crew", "Join the Crew", "#f2e6d0", ["DM Serif Display", "Space Mono"], [
                nav,
                '<section style="padding:64px 56px;background:#7a2b12;color:#f2e6d0;font-family:\'DM Serif Display\',serif;text-align:center;"><h1 style="font-size:40px;margin:0 0 16px;font-weight:400;">Applications open.</h1><p style="font-family:\'Space Mono\',monospace;font-size:13px;line-height:1.8;max-width:440px;margin:0 auto 24px;color:#f8e6c4;">The Ariel-VII is always looking for the next generation of navigators, botanists, and people who can fix a wardrobe-sized computer with a butter knife.</p><a href="mailto:crew@ariel-vii.space" style="color:#f2e6d0;font-family:\'Space Mono\',monospace;font-size:13px;letter-spacing:0.1em;text-decoration:underline;">crew@ariel-vii.space</a></section>',
                footer,
            ], seo={"title": "Join the Crew — Ariel-VII", "description": "Applications open."}, page_id="starter-retro-futurism-crew", slug="crew"),
        ],
    )


def _starter_bloomcore() -> Dict[str, Any]:
    nav = '<header style="padding:20px 56px;background:#fff5f7;font-family:Lora,serif;display:flex;align-items:center;justify-content:space-between;"><a href="index.html" style="font-family:Caveat,cursive;font-size:24px;color:#c14571;text-decoration:none;">the small shed</a><nav style="display:flex;gap:22px;font-size:13px;"><a href="shop.html" style="color:#5a2a3c;text-decoration:none;">Shop</a><a href="visit.html" style="color:#5a2a3c;text-decoration:none;">Visit</a></nav></header>'
    footer = '<footer style="padding:24px 56px;background:#c14571;color:#fff5f7;font-family:Caveat,cursive;font-size:26px;text-align:center;">love, from the small shed x</footer>'
    return _tpl(
        "starter-bloomcore",
        "Bloomcore",
        "Floral pastels, handwritten headlines, everything in bloom.",
        "bloomcore",
        "#fff5f7",
        ["Caveat", "Lora"],
        html_blocks=[],
        pages=[
            _page("starter-bloomcore", "Home", "#fff5f7", ["Caveat", "Lora"], [
                nav,
                '<section style="min-height:56vh;padding:64px 56px;background:linear-gradient(180deg,#fff5f7 0%,#ffe4ee 60%,#f8c9dc 100%);font-family:Lora,serif;color:#5a2a3c;text-align:center;"><div style="max-width:640px;margin:0 auto;"><div style="font-family:Caveat,cursive;font-size:32px;color:#c14571;margin-bottom:8px;">— in full bloom —</div><h1 style="font-family:Lora,serif;font-size:64px;line-height:1.1;margin:0 0 20px;font-weight:500;font-style:italic;color:#4a1a2c;">A quieter kind<br>of flowering.</h1><p style="font-size:17px;line-height:1.75;color:#7a4a5a;font-style:italic;">Peonies. Sweet peas. Ranunculus with too many petals. Every week, hand-tied by two sisters in a very small shed at the edge of a very small village.</p><div style="margin-top:36px;display:flex;gap:14px;justify-content:center;"><a href="shop.html" style="padding:14px 32px;background:#c14571;color:#fff5f7;text-decoration:none;border-radius:999px;font-size:14px;letter-spacing:0.08em;font-family:Lora,serif;">Order a bouquet</a></div></div></section>',
                '<section style="padding:72px 56px;background:#fff5f7;color:#5a2a3c;font-family:Lora,serif;text-align:center;"><h2 style="font-family:Caveat,cursive;font-size:52px;margin:0 0 12px;color:#c14571;">what\'s in season</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-top:32px;">' + "".join([f'<div style="padding:28px 20px;background:{c};border-radius:20px;"><div style="font-family:Caveat,cursive;font-size:36px;color:#c14571;line-height:1;">{n}</div><h3 style="margin:8px 0 6px;font-style:italic;font-size:20px;font-weight:500;">{t}</h3><p style="margin:0;font-size:13px;line-height:1.6;color:#7a4a5a;">{d}</p></div>' for c, n, t, d in [("#ffe4ee", "01.", "Peonies", "Coral Charm, Sarah Bernhardt, all the ridiculous ones."), ("#fce0ea", "02.", "Sweet peas", "Grown along the south fence. Ludicrous scent."), ("#fce8d0", "03.", "Ranunculus", "One hundred petals per bloom, which we count.")]]) + '</div></section>',
                footer,
            ], seo={"title": "The Small Shed — A quieter kind of flowering", "description": "Floral pastels, handwritten headlines."}, page_id="starter-bloomcore-home", slug="index"),
            _page("starter-bloomcore-shop", "Shop", "#fff5f7", ["Caveat", "Lora"], [
                nav,
                '<section style="padding:64px 56px;background:#fff5f7;color:#5a2a3c;font-family:Lora,serif;text-align:center;"><h1 style="font-family:Caveat,cursive;font-size:48px;color:#c14571;margin:0 0 32px;">this week\'s bouquets</h1><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;max-width:800px;margin:0 auto;text-align:left;">' + "".join([f'<div style="background:{c};border-radius:20px;padding:20px;"><div style="aspect-ratio:1;background:#f8c9dc;border-radius:14px;margin-bottom:10px;"></div><div style="font-style:italic;font-size:16px;">{t}</div><div style="font-size:13px;color:#c14571;">{p}</div></div>' for c, t, p in [("#ffe4ee", "The Sunday", "£32"), ("#fce0ea", "Wildflower posy", "£24"), ("#fce8d0", "The Full Bloom", "£48")]]) + '</div></section>',
                footer,
            ], seo={"title": "Shop — The Small Shed", "description": "This week's bouquets."}, page_id="starter-bloomcore-shop", slug="shop"),
            _page("starter-bloomcore-visit", "Visit", "#fff5f7", ["Caveat", "Lora"], [
                nav,
                '<section style="padding:80px 56px;background:#fff5f7;color:#5a2a3c;font-family:Lora,serif;text-align:center;"><h1 style="font-family:Caveat,cursive;font-size:40px;color:#c14571;margin:0 0 16px;">come find us</h1><p style="font-size:16px;line-height:1.8;font-style:italic;">Open Thursday to Saturday, 9am to 1pm — or whenever the flowers run out.<br>The Small Shed, behind 12 Meadow Lane.</p></section>',
                footer,
            ], seo={"title": "Visit — The Small Shed", "description": "Hours and location."}, page_id="starter-bloomcore-visit", slug="visit"),
        ],
    )


def _starter_neubrutalism() -> Dict[str, Any]:
    nav = '<header style="padding:18px 48px;background:#fef9d9;font-family:\'DM Sans\',sans-serif;display:flex;align-items:center;justify-content:space-between;"><a href="index.html" style="font-weight:900;color:#000000;font-size:16px;text-decoration:none;">SHIP CO</a><nav style="display:flex;gap:14px;font-size:13px;font-weight:700;"><a href="work.html" style="color:#000000;text-decoration:none;padding:6px 14px;background:#ffffff;border:2px solid #000000;border-radius:8px;">Work</a><a href="contact.html" style="color:#000000;text-decoration:none;padding:6px 14px;background:#ff5b8b;border:2px solid #000000;border-radius:8px;">Contact</a></nav></header>'
    footer = '<footer style="padding:24px 48px;background:#000000;color:#fef9d9;font-family:\'DM Sans\',sans-serif;font-size:13px;font-weight:700;display:flex;justify-content:space-between;"><span>© 2026 SHIP CO</span><span>hello@ship.co</span></footer>'
    return _tpl(
        "starter-neubrutalism",
        "Neubrutalism",
        "Flat blocks, thick borders, hard shadows — 2020s remix of brutalism.",
        "neubrutalism",
        "#fef9d9",
        ["DM Sans"],
        html_blocks=[],
        pages=[
            _page("starter-neubrutalism", "Home", "#fef9d9", ["DM Sans"], [
                nav,
                '<section style="min-height:60vh;padding:64px 48px;background:#fef9d9;font-family:\'DM Sans\',sans-serif;color:#000000;"><div style="max-width:720px;padding:44px;background:#ffffff;border:3px solid #000000;box-shadow:12px 12px 0 #000000;border-radius:20px;"><div style="display:inline-block;padding:6px 14px;background:#c1e1ff;border:2px solid #000000;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:0.05em;">new · limited spots</div><h1 style="font-size:72px;line-height:1;margin:20px 0 20px;font-weight:900;letter-spacing:-0.03em;">Ship the thing.<br><span style="background:#ffec70;padding:2px 12px;border-radius:8px;">Today.</span></h1><p style="font-size:17px;line-height:1.65;color:#2a2a2a;max-width:520px;">A no-nonsense product studio for founders who\'d rather have a working MVP by Friday than a pitch deck by Q4. Fixed price. Two-week sprints.</p><div style="margin-top:28px;display:flex;gap:14px;"><a href="contact.html" style="padding:14px 26px;background:#ff5b8b;color:#ffffff;text-decoration:none;font-weight:700;border:3px solid #000000;box-shadow:6px 6px 0 #000000;border-radius:14px;font-size:15px;">Book a call</a><a href="work.html" style="padding:14px 26px;background:#ffffff;color:#000000;text-decoration:none;font-weight:700;border:3px solid #000000;box-shadow:6px 6px 0 #000000;border-radius:14px;font-size:15px;">See work</a></div></div></section>',
                '<section style="padding:72px 48px;background:#c1e1ff;font-family:\'DM Sans\',sans-serif;color:#000000;"><h2 style="font-size:44px;margin:0 0 32px;font-weight:900;letter-spacing:-0.02em;">What we\'re good at.</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;">' + "".join([f'<div style="padding:28px;background:{c};border:3px solid #000000;border-radius:16px;box-shadow:6px 6px 0 #000000;"><div style="font-size:32px;font-weight:900;">{n}</div><h3 style="margin:6px 0 4px;font-size:20px;font-weight:800;">{t}</h3><p style="margin:0;font-size:14px;line-height:1.55;">{d}</p></div>' for c, n, t, d in [("#ffec70", "01", "MVPs in 2 weeks", "Real product, real users, real feedback."), ("#ff5b8b", "02", "Design systems", "Tokens, components, docs — done."), ("#a8f0c0", "03", "Growth ops", "Landing pages that actually convert.")]]) + '</div></section>',
                footer,
            ], seo={"title": "SHIP CO — Ship the thing. Today.", "description": "A no-nonsense product studio."}, page_id="starter-neubrutalism-home", slug="index"),
            _page("starter-neubrutalism-work", "Work", "#fef9d9", ["DM Sans"], [
                nav,
                '<section style="padding:56px 48px;background:#fef9d9;font-family:\'DM Sans\',sans-serif;color:#000000;"><h1 style="font-size:40px;margin:0 0 32px;font-weight:900;">Recent MVPs.</h1><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;">' + "".join([f'<div style="padding:24px;background:{c};border:3px solid #000000;border-radius:16px;box-shadow:6px 6px 0 #000000;"><h3 style="margin:0 0 6px;font-size:18px;font-weight:800;">{t}</h3><p style="margin:0;font-size:13px;">{d}</p></div>' for c, t, d in [("#ffec70", "Fieldnote", "Shipped MVP → seed round in 5 months"), ("#a8f0c0", "Loop Health", "Booking MVP, live in 12 days"), ("#c1e1ff", "Meridian", "Fintech dashboard, 2-week sprint")]]) + '</div></section>',
                footer,
            ], seo={"title": "Work — SHIP CO", "description": "Recent MVPs."}, page_id="starter-neubrutalism-work", slug="work"),
            _page("starter-neubrutalism-contact", "Contact", "#fef9d9", ["DM Sans"], [
                nav,
                '<section style="padding:64px 48px;background:#ff5b8b;font-family:\'DM Sans\',sans-serif;color:#000000;text-align:center;"><div style="display:inline-block;padding:40px;background:#ffffff;border:3px solid #000000;box-shadow:12px 12px 0 #000000;border-radius:20px;"><h1 style="font-size:32px;margin:0 0 14px;font-weight:900;">Book a call.</h1><a href="mailto:hello@ship.co" style="font-size:16px;color:#000000;font-weight:700;text-decoration:underline;">hello@ship.co</a></div></section>',
                footer,
            ], seo={"title": "Contact — SHIP CO", "description": "Book a call."}, page_id="starter-neubrutalism-contact", slug="contact"),
        ],
    )


def _starter_corp_memphis() -> Dict[str, Any]:
    nav = '<header style="padding:20px 56px;background:#f4f0ff;font-family:Poppins,sans-serif;display:flex;align-items:center;justify-content:space-between;"><a href="index.html" style="font-weight:700;color:#2a1f4a;font-size:17px;text-decoration:none;">Lightwork</a><nav style="display:flex;gap:24px;align-items:center;font-size:13px;"><a href="pricing.html" style="color:#2a1f4a;text-decoration:none;">Pricing</a><a href="about.html" style="color:#2a1f4a;text-decoration:none;">About</a><a href="#" style="padding:8px 18px;background:#7a4de8;color:#fff;border-radius:10px;text-decoration:none;font-weight:600;">Start free</a></nav></header>'
    footer = '<footer style="padding:32px 56px;background:#f4f0ff;color:#6a5f8a;font-family:Poppins,sans-serif;font-size:13px;display:flex;justify-content:space-between;"><span>© 2026 Lightwork Inc.</span><span>hello@lightwork.app · Built with a lot of coffee</span></footer>'
    return _tpl(
        "starter-corp-memphis",
        "Corp Memphis",
        "Flat illustration vibe — mint, purple, oversized limbs everywhere.",
        "corp-memphis",
        "#f4f0ff",
        ["Poppins"],
        html_blocks=[],
        pages=[
            _page("starter-corp-memphis", "Home", "#f4f0ff", ["Poppins"], [
                nav,
                '<section style="min-height:60vh;padding:64px 56px;background:linear-gradient(135deg,#f4f0ff 0%,#dff5ec 100%);font-family:Poppins,sans-serif;color:#2a1f4a;position:relative;overflow:hidden;"><div style="max-width:600px;position:relative;z-index:2;"><div style="display:inline-block;padding:6px 14px;background:#c9f0dc;color:#1a5a3c;border-radius:999px;font-size:12px;font-weight:600;">✨ Now onboarding teams</div><h1 style="font-size:60px;line-height:1.05;margin:20px 0 18px;font-weight:700;letter-spacing:-0.02em;">Work that <span style="color:#7a4de8;">feels lighter.</span></h1><p style="font-size:17px;line-height:1.7;color:#4a3f6a;max-width:480px;">The productivity app your team will actually open. Tasks, docs, hugs from your teammates when you close ten tickets in a row. Free forever for small teams.</p><div style="margin-top:32px;display:flex;gap:14px;"><a href="#" style="padding:14px 28px;background:#7a4de8;color:#ffffff;text-decoration:none;font-weight:600;border-radius:12px;font-size:15px;">Start free →</a><a href="pricing.html" style="padding:14px 28px;background:transparent;color:#7a4de8;text-decoration:none;font-weight:600;border-radius:12px;font-size:15px;">See pricing</a></div></div></section>',
                '<section style="padding:80px 56px;background:#ffffff;font-family:Poppins,sans-serif;color:#2a1f4a;"><h2 style="font-size:40px;margin:0 0 32px;font-weight:700;text-align:center;">Everything your team needs.</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;">' + "".join([f'<div style="padding:32px 24px;background:{bg};border-radius:24px;text-align:center;"><div style="width:56px;height:56px;background:{c};border-radius:50%;margin:0 auto 16px;"></div><h3 style="margin:0 0 8px;font-size:19px;font-weight:600;">{t}</h3><p style="margin:0;font-size:14px;line-height:1.6;color:#5a4a7a;">{d}</p></div>' for bg, c, t, d in [("#f4f0ff", "#7a4de8", "Tasks, together", "Boards, docs, and messaging in one calm place."), ("#dff5ec", "#28c48a", "Real-time everything", "Cursors, comments, presence — instantly."), ("#fff0e8", "#ff9060", "Automations", "Nudge, notify, remind. Zero babysitting.")]]) + '</div></section>',
                footer,
            ], seo={"title": "Lightwork — Work that feels lighter", "description": "The productivity app your team will actually open."}, page_id="starter-corp-memphis-home", slug="index"),
            _page("starter-corp-memphis-pricing", "Pricing", "#f4f0ff", ["Poppins"], [
                nav,
                '<section style="padding:64px 56px;background:#ffffff;font-family:Poppins,sans-serif;color:#2a1f4a;text-align:center;"><h1 style="font-size:38px;margin:0 0 32px;font-weight:700;">Free forever for small teams.</h1><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;max-width:900px;margin:0 auto;">' + "".join([f'<div style="padding:28px 20px;background:{bg};border-radius:24px;"><div style="font-size:13px;color:#6a5f8a;text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;">{n}</div><div style="font-size:30px;font-weight:700;margin-bottom:16px;">{p}</div><a href="#" style="display:block;padding:11px;background:#7a4de8;color:#fff;border-radius:10px;text-decoration:none;font-weight:600;font-size:13px;">Choose</a></div>' for bg, n, p in [("#f4f0ff", "Free", "$0"), ("#dff5ec", "Team", "$8/seat"), ("#fff0e8", "Business", "$16/seat")]]) + '</div></section>',
                footer,
            ], seo={"title": "Pricing — Lightwork", "description": "Free forever for small teams."}, page_id="starter-corp-memphis-pricing", slug="pricing"),
            _page("starter-corp-memphis-about", "About", "#f4f0ff", ["Poppins"], [
                nav,
                '<section style="padding:80px 56px;background:linear-gradient(135deg,#f4f0ff 0%,#dff5ec 100%);font-family:Poppins,sans-serif;color:#2a1f4a;"><div style="max-width:560px;margin:0 auto;"><h1 style="font-size:32px;margin:0 0 18px;font-weight:700;">About Lightwork.</h1><p style="font-size:15px;line-height:1.75;color:#4a3f6a;">Made in Berlin by a team of twelve who all worked at heavier tools before this. Trusted by 4,200+ small teams, SOC 2 certified, no venture debt to grow into.</p></div></section>',
                footer,
            ], seo={"title": "About — Lightwork", "description": "About the team."}, page_id="starter-corp-memphis-about", slug="about"),
        ],
    )


def _starter_kidcore() -> Dict[str, Any]:
    nav = '<header style="padding:16px 40px;background:#fff8e1;font-family:Poppins,sans-serif;display:flex;align-items:center;justify-content:space-between;"><a href="index.html" style="font-family:Caveat,cursive;font-size:24px;color:#ff5b3a;text-decoration:none;transform:rotate(-2deg);display:inline-block;">✎ scrapbook</a><nav style="display:flex;gap:16px;font-size:13px;font-weight:700;"><a href="shop.html" style="color:#2a1a0a;text-decoration:none;">Shop</a><a href="contact.html" style="color:#2a1a0a;text-decoration:none;">Say hi</a></nav></header>'
    footer = '<footer style="padding:24px 40px;background:#2a1a0a;color:#ffde3a;font-family:Caveat,cursive;font-size:22px;text-align:center;letter-spacing:0.05em;">made with love, glue & scissors ✂</footer>'
    return _tpl(
        "starter-kidcore",
        "Kidcore Scrapbook",
        "Crayons, doodles, primary colours — 2026's anti-AI-slop antidote.",
        "kidcore",
        "#fff8e1",
        ["Caveat", "Poppins"],
        html_blocks=[],
        pages=[
            _page("starter-kidcore", "Home", "#fff8e1", ["Caveat", "Poppins"], [
                nav,
                '<section style="min-height:56vh;padding:56px 40px;background:#fff8e1;background-image:radial-gradient(#ffddad 1px,transparent 1px);background-size:24px 24px;font-family:Poppins,sans-serif;color:#2a1a0a;position:relative;overflow:hidden;"><div style="max-width:640px;position:relative;z-index:2;"><div style="font-family:Caveat,cursive;font-size:26px;color:#ff5b3a;transform:rotate(-4deg);display:inline-block;">✎ hello, world!</div><h1 style="font-size:76px;line-height:0.98;margin:12px 0 18px;font-weight:800;letter-spacing:-0.03em;color:#0a3a5a;"><span style="background:#ffde3a;padding:0 8px;transform:rotate(-1deg);display:inline-block;">Make</span> things by <br><span style="text-decoration:underline wavy #ff5b3a 3px;">hand</span> again.</h1><p style="font-size:17px;line-height:1.65;max-width:480px;color:#4a3020;">A studio for brands that would rather look like a kid\'s locker than a corporate deck. Stickers, doodles, tape, glitter glue. Grown-ups may enter.</p><div style="margin-top:28px;display:flex;gap:14px;flex-wrap:wrap;"><a href="contact.html" style="padding:14px 26px;background:#ff5b3a;color:#fff8e1;text-decoration:none;font-weight:700;border-radius:24px;border:3px solid #2a1a0a;transform:rotate(-1deg);display:inline-block;">Say hi →</a><a href="shop.html" style="padding:14px 26px;background:#3ab6ff;color:#0a3a5a;text-decoration:none;font-weight:700;border-radius:24px;border:3px solid #2a1a0a;transform:rotate(1deg);display:inline-block;">Shop</a></div></div><div style="position:absolute;right:60px;top:40px;width:80px;height:80px;background:#3aff8a;border-radius:50%;border:4px solid #2a1a0a;transform:rotate(-8deg);"></div></section>',
                '<section style="padding:56px 40px;background:#ffde3a;font-family:Poppins,sans-serif;color:#2a1a0a;"><h2 style="font-family:Caveat,cursive;font-size:56px;margin:0 0 24px;transform:rotate(-1deg);">what\'s in the pencil case</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;">' + "".join([f'<div style="padding:24px;background:{c};border:3px solid #2a1a0a;border-radius:20px;transform:rotate({r}deg);"><div style="font-family:Caveat,cursive;font-size:40px;line-height:1;color:#2a1a0a;">{n}</div><h3 style="margin:8px 0 4px;font-size:20px;font-weight:800;">{t}</h3><p style="margin:0;font-size:14px;line-height:1.5;">{d}</p></div>' for c, r, n, t, d in [("#fff8e1", "-2", "★", "Sticker packs", "Vinyl, hologram, glow-in-the-dark."), ("#3aff8a", "1.5", "✎", "Zines", "Photocopied, stapled, sold on Etsy."), ("#3ab6ff", "-1", "♥", "Doodle brand kits", "Type, marks, glitter animations.")]]) + '</div></section>',
                footer,
            ], seo={"title": "Scrapbook — Make things by hand again", "description": "Crayons, doodles, primary colours."}, page_id="starter-kidcore-home", slug="index"),
            _page("starter-kidcore-shop", "Shop", "#fff8e1", ["Caveat", "Poppins"], [
                nav,
                '<section style="padding:56px 40px;background:#fff8e1;font-family:Poppins,sans-serif;color:#2a1a0a;"><h1 style="font-family:Caveat,cursive;font-size:52px;color:#ff5b3a;margin:0 0 28px;transform:rotate(-1deg);">the whole shop</h1><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;">' + "".join([f'<div style="padding:20px;background:{c};border:3px solid #2a1a0a;border-radius:18px;transform:rotate({r}deg);"><div style="aspect-ratio:1;background:#fff8e1;border:2px dashed #2a1a0a;border-radius:12px;margin-bottom:10px;"></div><div style="font-weight:800;font-size:15px;">{t}</div><div style="font-family:Caveat,cursive;font-size:18px;color:#c05a10;">{p}</div></div>' for c, r, t, p in [("#3aff8a", "1", "Hologram sticker pack", "$6"), ("#3ab6ff", "-1", "Photocopy zine #4", "$4"), ("#ffde3a", "1.5", "Glitter glue brand kit", "$28")]]) + '</div></section>',
                footer,
            ], seo={"title": "Shop — Scrapbook", "description": "Stickers, zines, and brand kits."}, page_id="starter-kidcore-shop", slug="shop"),
            _page("starter-kidcore-contact", "Contact", "#fff8e1", ["Caveat", "Poppins"], [
                nav,
                '<section style="padding:64px 40px;background:#3ab6ff;font-family:Poppins,sans-serif;color:#0a3a5a;text-align:center;"><h1 style="font-family:Caveat,cursive;font-size:48px;margin:0 0 14px;transform:rotate(-1deg);display:inline-block;">say hi!!</h1><br><a href="mailto:hi@scrapbook.studio" style="font-size:16px;color:#0a3a5a;font-weight:700;text-decoration:none;background:#fff8e1;padding:10px 20px;border-radius:20px;border:3px solid #2a1a0a;display:inline-block;margin-top:10px;">hi@scrapbook.studio</a></section>',
                footer,
            ], seo={"title": "Say hi — Scrapbook", "description": "Get in touch."}, page_id="starter-kidcore-contact", slug="contact"),
        ],
    )


def _starter_blueprint() -> Dict[str, Any]:
    grid_bg = "background:#0a2540;background-image:linear-gradient(rgba(120,180,220,0.12) 1px,transparent 1px),linear-gradient(90deg,rgba(120,180,220,0.12) 1px,transparent 1px);background-size:32px 32px;"
    nav = f'<header style="{grid_bg}padding:18px 56px;font-family:\'Space Mono\',monospace;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #1a3550;"><a href="index.html" style="color:#c8e0f0;font-size:13px;letter-spacing:0.15em;text-decoration:none;">FIG.01</a><nav style="display:flex;gap:22px;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;"><a href="catalogue.html" style="color:#c8e0f0;text-decoration:none;">Catalogue</a><a href="contact.html" style="color:#c8e0f0;text-decoration:none;">Contact</a></nav></header>'
    footer = '<footer style="padding:24px 56px;background:#0a2540;color:#6ab0d8;font-family:\'Space Mono\',monospace;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;text-align:center;">ISO 9001 · Made in Utrecht · Rev. 2026.02</footer>'
    return _tpl(
        "starter-blueprint",
        "Blueprint",
        "Cyan grid on navy — engineering drawings, over-explained.",
        "blueprint",
        "#0a2540",
        ["Space Mono", "Fraunces"],
        html_blocks=[],
        pages=[
            _page("starter-blueprint", "Home", "#0a2540", ["Space Mono", "Fraunces"], [
                nav,
                f'<section style="{grid_bg}min-height:60vh;padding:64px 56px;font-family:\'Space Mono\',monospace;color:#c8e0f0;position:relative;overflow:hidden;"><div style="max-width:700px;position:relative;z-index:2;"><div style="font-size:11px;letter-spacing:0.3em;color:#6ab0d8;margin-bottom:16px;">FIG.01 · SHEET 1 OF 4 · SCALE 1:1</div><h1 style="font-family:Fraunces,serif;font-size:74px;line-height:1;margin:0 0 20px;font-weight:400;letter-spacing:-0.01em;color:#ffffff;">Every product,<br><span style="border-bottom:2px dashed #6ab0d8;padding-bottom:4px;">measured twice.</span></h1><p style="font-size:14px;line-height:1.75;max-width:540px;color:#a0c0d8;">A hardware studio that builds slow — mechanical keyboards, camera rigs, single-purpose tools. Every part is dimensioned, every tolerance is documented, every user manual is a book.</p><div style="margin-top:32px;display:flex;gap:14px;"><a href="catalogue.html" style="padding:14px 26px;background:#c8e0f0;color:#0a2540;text-decoration:none;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;font-weight:700;">See catalogue</a></div></div></section>',
                '<section style="padding:72px 56px;background:#08192b;font-family:\'Space Mono\',monospace;color:#c8e0f0;"><h2 style="font-family:Fraunces,serif;font-size:38px;margin:0 0 32px;font-weight:400;color:#ffffff;">Tolerances we hold.</h2><table style="width:100%;border-collapse:collapse;font-size:13px;"><thead><tr style="border-bottom:1px solid #6ab0d8;"><th style="text-align:left;padding:12px 0;font-weight:400;color:#6ab0d8;letter-spacing:0.15em;text-transform:uppercase;font-size:11px;">Part</th><th style="text-align:left;padding:12px 0;font-weight:400;color:#6ab0d8;letter-spacing:0.15em;text-transform:uppercase;font-size:11px;">Material</th><th style="text-align:left;padding:12px 0;font-weight:400;color:#6ab0d8;letter-spacing:0.15em;text-transform:uppercase;font-size:11px;">±</th><th style="text-align:left;padding:12px 0;font-weight:400;color:#6ab0d8;letter-spacing:0.15em;text-transform:uppercase;font-size:11px;">Notes</th></tr></thead><tbody>' + "".join([f'<tr style="border-bottom:1px dashed rgba(120,180,220,0.2);"><td style="padding:14px 0;">{a}</td><td style="padding:14px 0;color:#a0c0d8;">{b}</td><td style="padding:14px 0;color:#6ab0d8;">{t}</td><td style="padding:14px 0;color:#a0c0d8;">{n}</td></tr>' for a, b, t, n in [("Aluminium chassis", "6061-T6", "0.05mm", "CNC · bead blasted"), ("Keycap set", "PBT double-shot", "0.10mm", "MX stem · Cherry profile"), ("Optical PCB", "FR-4 · 1.6mm", "0.02mm", "ENIG finish"), ("Foot pad", "Sorbothane 70A", "0.20mm", "3M 300LSE adhesive")]]) + '</tbody></table></section>',
                footer,
            ], seo={"title": "FIG.01 — Every product, measured twice", "description": "Cyan grid on navy, engineering drawings."}, page_id="starter-blueprint-home", slug="index"),
            _page("starter-blueprint-catalogue", "Catalogue", "#0a2540", ["Space Mono", "Fraunces"], [
                nav,
                '<section style="padding:64px 56px;background:#08192b;font-family:\'Space Mono\',monospace;color:#c8e0f0;"><h1 style="font-family:Fraunces,serif;font-size:40px;margin:0 0 32px;font-weight:400;color:#fff;">Product catalogue.</h1><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;">' + "".join([f'<div style="padding:22px;background:#0a2540;border:1px solid #1a3550;border-radius:8px;"><div style="font-size:10px;color:#6ab0d8;letter-spacing:0.15em;margin-bottom:8px;">FIG.0{n}</div><h3 style="margin:0 0 6px;font-family:Fraunces,serif;font-size:18px;color:#fff;font-weight:400;">{t}</h3><p style="margin:0;font-size:12px;color:#a0c0d8;line-height:1.5;">{d}</p></div>' for n, t, d in [(2, "Mechanical keyboard MK-7", "Hot-swap, PBT keycaps, aluminium body."), (3, "Camera rig CR-3", "Modular, tool-less, anodized."), (4, "Single-purpose timer T-1", "One button. One job.")]]) + '</div></section>',
                footer,
            ], seo={"title": "Catalogue — FIG.01", "description": "The full product catalogue."}, page_id="starter-blueprint-catalogue", slug="catalogue"),
            _page("starter-blueprint-contact", "Contact", "#0a2540", ["Space Mono", "Fraunces"], [
                nav,
                '<section style="padding:64px 56px;background:#0a2540;font-family:\'Space Mono\',monospace;color:#c8e0f0;text-align:center;"><h1 style="font-family:Fraunces,serif;font-size:32px;color:#fff;margin:0 0 16px;font-weight:400;">Request a datasheet.</h1><a href="mailto:specs@blueprint.works" style="color:#6ab0d8;font-size:14px;letter-spacing:0.1em;text-decoration:underline;">specs@blueprint.works</a></section>',
                footer,
            ], seo={"title": "Contact — FIG.01", "description": "Request a datasheet."}, page_id="starter-blueprint-contact", slug="contact"),
        ],
    )


def _starter_editorial_warm() -> Dict[str, Any]:
    nav = '<header style="padding:24px 80px;background:#f5efe4;font-family:Inter,sans-serif;display:flex;align-items:center;justify-content:space-between;"><a href="index.html" style="font-family:Fraunces,serif;font-size:19px;color:#1a1410;text-decoration:none;">Provenance</a><nav style="display:flex;gap:28px;font-size:13px;"><a href="essays.html" style="color:#4a3d30;text-decoration:none;">Essays</a><a href="about.html" style="color:#4a3d30;text-decoration:none;">About</a></nav></header>'
    footer = '<footer style="padding:32px 80px;background:#f5efe4;color:#8a7052;font-family:Inter,sans-serif;font-size:12px;letter-spacing:0.08em;display:flex;justify-content:space-between;"><span>© 2026 Provenance Studio</span><span>Kraków · Berlin · Providence</span></footer>'
    return _tpl(
        "starter-editorial-warm",
        "Editorial Warm",
        "Cream backgrounds, custom serifs, warm counter-aesthetic to techno-futurism.",
        "editorial-warm",
        "#f5efe4",
        ["Fraunces", "Inter"],
        html_blocks=[],
        pages=[
            _page("starter-editorial-warm", "Home", "#f5efe4", ["Fraunces", "Inter"], [
                nav,
                '<section style="min-height:64vh;padding:80px 80px;background:#f5efe4;font-family:Inter,sans-serif;color:#1a1410;"><div style="max-width:920px;"><div style="font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#8a7052;margin-bottom:32px;">Est. 2024 · A research studio</div><h1 style="font-family:Fraunces,serif;font-size:96px;line-height:1;margin:0 0 40px;font-weight:400;letter-spacing:-0.03em;">Careful thinking,<br><em>in public.</em></h1><div style="max-width:520px;font-size:17px;line-height:1.7;color:#4a3d30;"><p style="margin:0 0 16px;">We publish long essays on how software behaves, where product ideas come from, and why craft still matters when everything is a prompt away.</p><p style="margin:0;">The site is deliberately quiet. Nothing pops up. Nothing tracks you. The reader is the only user.</p></div><div style="margin-top:48px;"><a href="essays.html" style="padding:14px 0;color:#1a1410;text-decoration:none;border-bottom:1px solid #1a1410;font-size:14px;letter-spacing:0.02em;">Read the latest essay &nbsp;→</a></div></div></section>',
                '<section style="padding:80px 80px;background:#ecdfc5;font-family:Inter,sans-serif;color:#1a1410;"><div style="display:grid;grid-template-columns:1fr 1fr;gap:80px;"><h2 style="font-family:Fraunces,serif;font-size:44px;margin:0;font-weight:400;line-height:1.15;">Recent essays.</h2><div style="font-size:14px;line-height:1.9;color:#6a5540;">' + "".join([f'<div style="padding:16px 0;border-top:1px solid #d0b890;"><div style="font-family:Fraunces,serif;font-size:22px;color:#1a1410;font-weight:400;margin-bottom:4px;">{t}</div><div style="font-size:12px;letter-spacing:0.05em;color:#8a7052;">{d} · {r}</div></div>' for t, d, r in [("On the discipline of small releases", "12 Feb 2026", "18 min"), ("Why we still write our own copy", "24 Jan 2026", "9 min"), ("Three heuristics for reviewing product", "03 Jan 2026", "22 min")]]) + f'<a href="essays.html" style="display:block;padding-top:16px;border-top:1px solid #d0b890;color:#1a1410;text-decoration:none;font-size:13px;">See all essays →</a></div></div></section>',
                footer,
            ], seo={"title": "Provenance — Careful thinking, in public", "description": "A research studio publishing long essays."}, page_id="starter-editorial-warm-home", slug="index"),
            _page("starter-editorial-warm-essays", "Essays", "#f5efe4", ["Fraunces", "Inter"], [
                nav,
                '<section style="padding:80px 80px;background:#f5efe4;font-family:Inter,sans-serif;color:#1a1410;"><h1 style="font-family:Fraunces,serif;font-size:44px;margin:0 0 40px;font-weight:400;">All essays.</h1><div style="max-width:640px;font-size:14px;line-height:1.9;color:#6a5540;">' + "".join([f'<div style="padding:16px 0;border-top:1px solid #d0b890;"><div style="font-family:Fraunces,serif;font-size:22px;color:#1a1410;font-weight:400;margin-bottom:4px;">{t}</div><div style="font-size:12px;letter-spacing:0.05em;color:#8a7052;">{d} · {r}</div></div>' for t, d, r in [("On the discipline of small releases", "12 Feb 2026", "18 min"), ("Why we still write our own copy", "24 Jan 2026", "9 min"), ("Three heuristics for reviewing product", "03 Jan 2026", "22 min"), ("The reader is the only user", "18 Dec 2025", "6 min"), ("On not shipping the demo", "02 Dec 2025", "11 min")]]) + '</div></section>',
                footer,
            ], seo={"title": "Essays — Provenance", "description": "All published essays."}, page_id="starter-editorial-warm-essays", slug="essays"),
            _page("starter-editorial-warm-about", "About", "#f5efe4", ["Fraunces", "Inter"], [
                nav,
                '<section style="padding:80px 80px;background:#f5efe4;font-family:Inter,sans-serif;color:#1a1410;"><div style="max-width:560px;"><h1 style="font-family:Fraunces,serif;font-size:36px;margin:0 0 20px;font-weight:400;">About Provenance.</h1><p style="font-size:15px;line-height:1.75;color:#4a3d30;">A small research studio spread across Kraków, Berlin, and Providence. We publish one essay every few weeks — no newsletter growth targets, no SEO strategy, just the writing.</p></div></section>',
                footer,
            ], seo={"title": "About — Provenance", "description": "About the studio."}, page_id="starter-editorial-warm-about", slug="about"),
        ],
    )


def _starter_diffused_worlds() -> Dict[str, Any]:
    nav = '<header style="padding:22px 64px;background:#eaddf4;font-family:Manrope,sans-serif;display:flex;align-items:center;justify-content:space-between;"><a href="index.html" style="font-family:Fraunces,serif;font-style:italic;font-size:18px;color:#2a1a5a;text-decoration:none;">diffused</a><nav style="display:flex;gap:24px;font-size:13px;"><a href="shop.html" style="color:#5a4590;text-decoration:none;">Shop</a><a href="about.html" style="color:#5a4590;text-decoration:none;">About</a></nav></header>'
    footer = '<footer style="padding:24px 64px;background:#eaddf4;color:#5a4590;font-family:Manrope,sans-serif;font-size:12px;letter-spacing:0.15em;text-align:center;">Diffused · unhurried since 2024</footer>'
    return _tpl(
        "starter-diffused-worlds",
        "Diffused Worlds",
        "Soft blur, dreamy pastels, atmospheric — 2026 counter to hard-edged UI.",
        "diffused-worlds",
        "#eaddf4",
        ["Fraunces", "Manrope"],
        html_blocks=[],
        pages=[
            _page("starter-diffused-worlds", "Home", "#eaddf4", ["Fraunces", "Manrope"], [
                nav,
                '<section style="min-height:64vh;padding:80px 64px;background:linear-gradient(160deg,#f8e6f2 0%,#eaddf4 40%,#c9d8f0 100%);font-family:Manrope,sans-serif;color:#2a2050;position:relative;overflow:hidden;"><div style="position:absolute;left:8%;top:8%;width:280px;height:280px;background:radial-gradient(circle,#ff9ec4 0%,transparent 65%);filter:blur(40px);opacity:0.8;"></div><div style="max-width:640px;position:relative;z-index:2;"><div style="font-size:11px;letter-spacing:0.32em;text-transform:uppercase;color:#5a4590;margin-bottom:24px;">SS26 · A slow release</div><h1 style="font-family:Fraunces,serif;font-size:82px;line-height:1;margin:0 0 20px;font-weight:400;font-style:italic;letter-spacing:-0.02em;color:#2a1a5a;">A softer<br>internet, please.</h1><p style="font-size:17px;line-height:1.7;max-width:480px;color:#4a3d70;">Nothing here is sharp. The colours fade. The music is faint. Sit for a while and don\'t click anything and it might just be enough.</p><div style="margin-top:36px;"><a href="shop.html" style="padding:16px 30px;background:rgba(255,255,255,0.6);color:#2a1a5a;text-decoration:none;backdrop-filter:blur(12px);border-radius:999px;font-size:14px;letter-spacing:0.08em;border:1px solid rgba(255,255,255,0.4);">Enter softly →</a></div></div></section>',
                '<section style="padding:80px 64px;background:#f6effa;font-family:Manrope,sans-serif;color:#2a1a5a;text-align:center;"><h2 style="font-family:Fraunces,serif;font-size:44px;margin:0 0 40px;font-weight:400;font-style:italic;">A quiet catalogue.</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:28px;max-width:900px;margin:0 auto;">' + "".join([f'<div style="padding:32px 20px;background:linear-gradient(160deg,{c1},{c2});backdrop-filter:blur(8px);border-radius:24px;color:#2a1a5a;text-align:left;"><div style="font-family:Fraunces,serif;font-size:22px;font-style:italic;margin-bottom:6px;">{t}</div><p style="font-size:13px;line-height:1.6;color:#4a3d70;margin:0;">{d}</p></div>' for c1, c2, t, d in [("#f8e6f2", "#eaddf4", "Ambient perfume", "Notes: dried linen, faint smoke."), ("#e0e8f8", "#d0daf0", "Weighted linens", "Made once a season, in Nara."), ("#f4e8d8", "#e8d8c0", "A single candle", "40 hours. Beeswax. No perfume.")]]) + '</div></section>',
                footer,
            ], seo={"title": "Diffused — A softer internet, please", "description": "Soft blur, dreamy pastels, atmospheric."}, page_id="starter-diffused-worlds-home", slug="index"),
            _page("starter-diffused-worlds-shop", "Shop", "#eaddf4", ["Fraunces", "Manrope"], [
                nav,
                '<section style="padding:80px 64px;background:#f6effa;font-family:Manrope,sans-serif;color:#2a1a5a;"><h1 style="font-family:Fraunces,serif;font-size:40px;font-style:italic;margin:0 0 40px;font-weight:400;text-align:center;">The full catalogue.</h1><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;max-width:900px;margin:0 auto;">' + "".join([f'<div style="padding:28px 20px;background:linear-gradient(160deg,{c1},{c2});border-radius:24px;"><div style="font-family:Fraunces,serif;font-style:italic;font-size:19px;margin-bottom:6px;">{t}</div><div style="font-size:13px;color:#4a3d70;">{p}</div></div>' for c1, c2, t, p in [("#f8e6f2", "#eaddf4", "Ambient perfume", "€68"), ("#e0e8f8", "#d0daf0", "Weighted linens", "€120"), ("#f4e8d8", "#e8d8c0", "A single candle", "€34"), ("#eaddf4", "#c9d8f0", "Diffuser stones", "€28"), ("#f8e6f2", "#e0e8f8", "Faded print, No. 3", "€56"), ("#e8d8c0", "#f4e8d8", "Linen sachet set", "€22")]]) + '</div></section>',
                footer,
            ], seo={"title": "Shop — Diffused", "description": "The full quiet catalogue."}, page_id="starter-diffused-worlds-shop", slug="shop"),
            _page("starter-diffused-worlds-about", "About", "#eaddf4", ["Fraunces", "Manrope"], [
                nav,
                '<section style="padding:80px 64px;background:linear-gradient(160deg,#f8e6f2 0%,#eaddf4 40%,#c9d8f0 100%);font-family:Manrope,sans-serif;color:#2a2050;"><div style="max-width:520px;margin:0 auto;text-align:center;"><h1 style="font-family:Fraunces,serif;font-size:34px;font-style:italic;margin:0 0 18px;font-weight:400;color:#2a1a5a;">About Diffused.</h1><p style="font-size:15px;line-height:1.75;color:#4a3d70;">Two people, one very slow release schedule. We make a handful of things a season and stop when they sell out — no restocks, no reminders, no rush.</p></div></section>',
                footer,
            ], seo={"title": "About — Diffused", "description": "A slow, unhurried studio."}, page_id="starter-diffused-worlds-about", slug="about"),
        ],
    )


def _starter_cassette_futurism() -> Dict[str, Any]:
    nav = '<header style="padding:18px 56px;background:#5a4020;font-family:\'Space Mono\',monospace;display:flex;align-items:center;justify-content:space-between;"><a href="index.html" style="color:#e8d8b0;font-family:VT323,monospace;font-size:18px;letter-spacing:0.1em;text-decoration:none;">◇ ANALOG</a><nav style="display:flex;gap:20px;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;"><a href="catalogue.html" style="color:#e8d8b0;text-decoration:none;">Catalogue</a><a href="contact.html" style="color:#e8d8b0;text-decoration:none;">Contact</a></nav></header>'
    footer = '<footer style="padding:20px 56px;background:#5a4020;color:#e8d8b0;font-family:VT323,monospace;font-size:20px;letter-spacing:0.1em;text-align:center;">◇ ANALOG SERVICES · SINCE 1978 (LATELY, ANYWAY) ◇</footer>'
    return _tpl(
        "starter-cassette-futurism",
        "Cassette Futurism",
        "1970s tape-deck sci-fi — beige plastic, amber LEDs, chunky bevels.",
        "cassette-futurism",
        "#d9c9a0",
        ["VT323", "Space Mono"],
        html_blocks=[],
        pages=[
            _page("starter-cassette-futurism", "Home", "#d9c9a0", ["VT323", "Space Mono"], [
                nav,
                '<section style="min-height:56vh;padding:64px 56px;background:linear-gradient(180deg,#d9c9a0 0%,#b8a578 100%);font-family:\'Space Mono\',monospace;color:#3a2a10;"><div style="max-width:720px;padding:32px;background:#e8d8b0;border-radius:12px;border:2px solid #7a5a30;box-shadow:inset 0 -6px 0 #b8a578,inset 0 6px 0 #f0e5c8,6px 6px 0 #5a4020;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px;padding-bottom:12px;border-bottom:1px solid #b8a578;"><div style="font-family:VT323,monospace;font-size:24px;color:#c05a10;letter-spacing:0.15em;">MODEL 7300 · REV.C</div><div style="width:12px;height:12px;background:#c05a10;border-radius:50%;box-shadow:0 0 8px #c05a10;"></div></div><h1 style="font-family:VT323,monospace;font-size:88px;line-height:0.95;margin:0 0 16px;color:#3a2a10;letter-spacing:0.02em;">STAY.<br>ANALOG.</h1><p style="font-size:14px;line-height:1.7;max-width:520px;">A workshop that fixes what other people replace. Cassette decks, dot-matrix printers, mechanical Braun radios. We source parts, we hand-solder, we ship you a printed schematic.</p><div style="margin-top:24px;display:flex;gap:12px;flex-wrap:wrap;"><a href="contact.html" style="padding:12px 24px;background:#c05a10;color:#f0e5c8;text-decoration:none;font-family:VT323,monospace;font-size:20px;letter-spacing:0.1em;text-transform:uppercase;box-shadow:2px 2px 0 #3a2a10;">▶ Send a device</a><a href="catalogue.html" style="padding:12px 24px;background:#e8d8b0;color:#3a2a10;text-decoration:none;font-family:VT323,monospace;font-size:20px;letter-spacing:0.1em;text-transform:uppercase;border:2px solid #3a2a10;">■ Catalogue</a></div></div></section>',
                '<section style="padding:72px 56px;background:#3a2a10;color:#e8d8b0;font-family:\'Space Mono\',monospace;"><h2 style="font-family:VT323,monospace;font-size:56px;margin:0 0 24px;letter-spacing:0.05em;color:#c05a10;">// SERVICE LOG</h2><div style="font-size:13px;line-height:1.9;">' + "".join([f'<div style="padding:10px 0;border-bottom:1px dashed #7a5a30;display:flex;justify-content:space-between;"><span>[{d}] {t}</span><span style="color:{c};">{s}</span></div>' for d, t, c, s in [("26-02-08", "TEAC A-6100 · azimuth alignment", "#7ac040", "✓ RETURNED"), ("26-01-24", "Braun T-1000 · dial re-lamped", "#7ac040", "✓ RETURNED"), ("26-01-11", "Nakamichi CR-7 · full recap", "#c05a10", "· IN PROGRESS"), ("25-12-19", "Sony TCM-5000 · pinch roller", "#7ac040", "✓ RETURNED")]]) + '</div></section>',
                footer,
            ], seo={"title": "ANALOG SERVICES — Stay analog", "description": "1970s tape-deck sci-fi repair workshop."}, page_id="starter-cassette-futurism-home", slug="index"),
            _page("starter-cassette-futurism-catalogue", "Catalogue", "#d9c9a0", ["VT323", "Space Mono"], [
                nav,
                '<section style="padding:64px 56px;background:linear-gradient(180deg,#d9c9a0 0%,#b8a578 100%);font-family:\'Space Mono\',monospace;color:#3a2a10;"><h1 style="font-family:VT323,monospace;font-size:56px;margin:0 0 32px;">// SERVICES + RATES</h1><div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px;max-width:700px;">' + "".join([f'<div style="background:#e8d8b0;border:2px solid #7a5a30;border-radius:8px;padding:18px;"><div style="font-family:VT323,monospace;font-size:20px;color:#c05a10;">{t}</div><div style="font-size:13px;margin-top:4px;">{p}</div></div>' for t, p in [("Full recap + alignment", "from $180"), ("Dial / display re-lamp", "from $60"), ("Pinch roller replacement", "from $45"), ("Full restoration", "from $320")]]) + '</div></section>',
                footer,
            ], seo={"title": "Catalogue — ANALOG SERVICES", "description": "Services and rates."}, page_id="starter-cassette-futurism-catalogue", slug="catalogue"),
            _page("starter-cassette-futurism-contact", "Contact", "#d9c9a0", ["VT323", "Space Mono"], [
                nav,
                '<section style="padding:64px 56px;background:#3a2a10;font-family:\'Space Mono\',monospace;color:#e8d8b0;text-align:center;"><h1 style="font-family:VT323,monospace;font-size:44px;color:#c05a10;margin:0 0 16px;">SEND A DEVICE</h1><p style="font-size:13px;line-height:1.8;max-width:400px;margin:0 auto 20px;">Ship it padded, tell us what it does wrong, we quote before we touch anything.</p><a href="mailto:fix@analogservices.works" style="color:#e8d8b0;font-size:14px;letter-spacing:0.1em;text-decoration:underline;">fix@analogservices.works</a></section>',
                footer,
            ], seo={"title": "Contact — ANALOG SERVICES", "description": "Send a device for repair."}, page_id="starter-cassette-futurism-contact", slug="contact"),
        ],
    )


def _starter_newspaper() -> Dict[str, Any]:
    nav = '<header style="padding:14px 64px;background:#1a1a1a;color:#f4ede0;font-family:Lora,serif;display:flex;align-items:center;justify-content:space-between;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;"><a href="index.html" style="color:#f4ede0;text-decoration:none;">The Provincial Chronicle</a><nav style="display:flex;gap:22px;"><a href="archive.html" style="color:#d8cfc0;text-decoration:none;">Archive</a><a href="subscribe.html" style="color:#d8cfc0;text-decoration:none;">Subscribe</a></nav></header>'
    footer = '<footer style="padding:24px 64px;background:#1a1a1a;color:#f4ede0;font-family:Lora,serif;font-size:12px;letter-spacing:0.1em;font-style:italic;text-align:center;">Delivered, still, by bicycle. Every Saturday morning.</footer>'
    return _tpl(
        "starter-newspaper",
        "Newspaper Editorial",
        "Broadsheet columns, drop caps, Playfair headlines — a very old-fashioned homepage.",
        "newspaper",
        "#f4ede0",
        ["Playfair Display", "Lora"],
        html_blocks=[],
        pages=[
            _page("starter-newspaper", "Home", "#f4ede0", ["Playfair Display", "Lora"], [
                nav,
                '<section style="padding:40px 64px 40px;background:#f4ede0;font-family:Lora,serif;color:#1a1a1a;border-bottom:3px double #1a1a1a;"><div style="display:flex;justify-content:space-between;align-items:baseline;padding-bottom:16px;border-bottom:1px solid #1a1a1a;font-size:11px;letter-spacing:0.15em;text-transform:uppercase;"><span>Vol. XLII · No. 219</span><span>Saturday, 14 February 2026</span></div><h1 style="font-family:\'Playfair Display\',serif;font-size:96px;line-height:1;margin:24px 0 8px;font-weight:900;letter-spacing:-0.02em;text-align:center;">A quieter kind<br>of loud.</h1><div style="text-align:center;font-style:italic;font-size:16px;color:#4a4a4a;margin-bottom:32px;">— On the merits of a broadsheet, in the twenty-first year of the twenty-first century</div><div style="column-count:3;column-gap:32px;font-size:14px;line-height:1.7;text-align:justify;"><p style="margin:0 0 12px;"><span style="font-family:\'Playfair Display\',serif;font-size:60px;line-height:0.9;float:left;padding:6px 8px 0 0;font-weight:900;">I</span>t is often said that the printed newspaper is dead, though the newspaper itself has not yet been persuaded of the fact. Every Saturday for forty-two years the paper you are reading has been folded, wrapped, and delivered by bicycle to every letterbox in this village and the two adjacent ones.</p><p style="margin:0 0 12px;">Our editorial line has always been that the news arrives soon enough on its own. What we bring is a slower version — one that has been sat with, thought about, and, in a few cases, argued about in the pub across the road.</p><p style="margin:0;">The paper you are reading, in the sense of the pixels on your screen, is an experiment: can we bring the discipline of a broadsheet — the columns, the drop caps, the strange trust that comes from finishing a page — to a website?</p></div></section>',
                '<section style="padding:40px 64px 64px;background:#f4ede0;font-family:Lora,serif;color:#1a1a1a;"><div style="display:grid;grid-template-columns:2fr 1fr;gap:56px;"><div><div style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#7a7a7a;margin-bottom:8px;">Culture · Book review</div><h2 style="font-family:\'Playfair Display\',serif;font-size:44px;margin:0 0 12px;font-weight:900;line-height:1.05;">The virtue of the almost-good sentence.</h2><div style="font-style:italic;color:#4a4a4a;margin-bottom:16px;">by Miriam Halstead · 12 min</div><p style="font-size:15px;line-height:1.75;">Anwar\'s new collection is the sort of book that will not be reviewed well by algorithms, which is exactly why we insist on reviewing it here — at length, in three columns, over coffee.</p></div><div style="border-left:1px solid #1a1a1a;padding-left:32px;"><div style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#7a7a7a;margin-bottom:12px;">This week</div><ol style="list-style:decimal inside;padding:0;margin:0;font-size:13px;line-height:2;">' + "".join([f'<li>{t}</li>' for t in ["Cathedral roof to be re-leaded", "Verdict on the beehive by-law", "New chef, old pub", "A quiet warning about wolves"]]) + '</ol></div></div></section>',
                footer,
            ], seo={"title": "The Provincial Chronicle — A quieter kind of loud", "description": "Broadsheet columns, drop caps, Playfair headlines."}, page_id="starter-newspaper-home", slug="index"),
            _page("starter-newspaper-archive", "Archive", "#f4ede0", ["Playfair Display", "Lora"], [
                nav,
                '<section style="padding:48px 64px;background:#f4ede0;font-family:Lora,serif;color:#1a1a1a;"><h1 style="font-family:\'Playfair Display\',serif;font-size:44px;margin:0 0 32px;font-weight:900;">Back issues.</h1><div style="max-width:640px;">' + "".join([f'<div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #d8cfc0;"><span>Vol. XLII · No. {n}</span><span style="font-style:italic;color:#4a4a4a;">{d}</span></div>' for n, d in [("218", "7 February 2026"), ("217", "31 January 2026"), ("216", "24 January 2026"), ("215", "17 January 2026")]]) + '</div></section>',
                footer,
            ], seo={"title": "Archive — The Provincial Chronicle", "description": "Back issues."}, page_id="starter-newspaper-archive", slug="archive"),
            _page("starter-newspaper-subscribe", "Subscribe", "#f4ede0", ["Playfair Display", "Lora"], [
                nav,
                '<section style="padding:64px;background:#1a1a1a;color:#f4ede0;font-family:Lora,serif;text-align:center;"><h1 style="font-family:\'Playfair Display\',serif;font-size:40px;margin:0 0 16px;font-weight:900;">Delivered every Saturday.</h1><p style="font-style:italic;font-size:15px;margin:0 0 24px;">By bicycle, if you are within three villages of us. By post otherwise.</p><a href="mailto:subscribe@provincialchronicle.co" style="color:#f4ede0;text-decoration:underline;font-size:14px;letter-spacing:0.1em;">subscribe@provincialchronicle.co</a></section>',
                footer,
            ], seo={"title": "Subscribe — The Provincial Chronicle", "description": "Weekly delivery by bicycle."}, page_id="starter-newspaper-subscribe", slug="subscribe"),
        ],
    )


def _starter_barbiecore() -> Dict[str, Any]:
    nav = '<header style="padding:18px 56px;background:#ff2ea8;font-family:Poppins,sans-serif;display:flex;align-items:center;justify-content:space-between;"><a href="index.html" style="color:#ffffff;font-weight:800;font-size:18px;text-decoration:none;">GLOSS</a><nav style="display:flex;gap:22px;align-items:center;font-size:13px;font-weight:600;"><a href="shop.html" style="color:#ffffff;text-decoration:none;">Shop</a><a href="about.html" style="color:#ffffff;text-decoration:none;">About</a></nav></header>'
    footer = '<footer style="padding:24px 56px;background:#ff2ea8;color:#ffffff;font-family:Poppins,sans-serif;font-size:13px;text-align:center;font-weight:600;">© 2026 GLOSS · A brand about being into it.</footer>'
    return _tpl(
        "starter-barbiecore",
        "Barbiecore",
        "Hot pink everything, gloss, unapologetic maximal cute.",
        "barbiecore",
        "#ff2ea8",
        ["Poppins", "Playfair Display"],
        html_blocks=[],
        pages=[
            _page("starter-barbiecore", "Home", "#ff2ea8", ["Poppins", "Playfair Display"], [
                nav,
                '<section style="min-height:60vh;padding:64px 56px;background:linear-gradient(180deg,#ff9ec4 0%,#ff2ea8 100%);font-family:Poppins,sans-serif;color:#450a2a;position:relative;overflow:hidden;"><div style="max-width:640px;position:relative;z-index:2;"><div style="display:inline-block;padding:8px 18px;background:#ffffff;color:#ff2ea8;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;box-shadow:0 4px 20px rgba(69,10,42,0.15);">✨ SS26 collection · out now</div><h1 style="font-family:\'Playfair Display\',serif;font-size:88px;line-height:0.98;margin:22px 0 18px;font-weight:900;letter-spacing:-0.02em;color:#ffffff;text-shadow:0 4px 20px rgba(69,10,42,0.2);">Life in <em>pink.</em></h1><p style="font-size:17px;line-height:1.7;max-width:480px;color:#450a2a;font-weight:500;">A very deliberately fun studio for beauty, fashion, and joy-forward brands. Everything glosses. Everything sparkles. Nothing apologises.</p><div style="margin-top:32px;display:flex;gap:14px;"><a href="shop.html" style="padding:16px 30px;background:#ffffff;color:#ff2ea8;text-decoration:none;border-radius:999px;font-weight:700;font-size:15px;box-shadow:0 6px 20px rgba(69,10,42,0.25);">Shop the drop →</a></div></div><div style="position:absolute;right:60px;top:60px;font-size:120px;color:#ffffff;opacity:0.9;transform:rotate(15deg);">♥</div></section>',
                '<section style="padding:64px 56px;background:#fff0f8;font-family:Poppins,sans-serif;color:#450a2a;"><h2 style="font-family:\'Playfair Display\',serif;font-size:44px;margin:0 0 32px;font-weight:900;text-align:center;">This month\'s obsessions.</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;">' + "".join([f'<div style="padding:32px 24px;background:{c};border-radius:32px;text-align:center;box-shadow:0 8px 30px rgba(255,46,168,0.15);"><div style="font-size:44px;line-height:1;margin-bottom:12px;">{e}</div><h3 style="margin:0 0 6px;font-size:20px;font-weight:700;color:#450a2a;">{t}</h3><p style="margin:0;font-size:13px;line-height:1.55;color:#7a3055;">{d}</p></div>' for c, e, t, d in [("#ffe0ec", "♥", "Lip gloss", "Cherry glass · SPF 30 · vegan."), ("#ffd0e0", "✨", "Nail polish", "Chrome finish · limited edition."), ("#ffb8d4", "★", "Face jewels", "Reusable · self-adhesive.")]]) + '</div></section>',
                footer,
            ], seo={"title": "GLOSS — Life in pink", "description": "Hot pink everything, gloss, unapologetic maximal cute."}, page_id="starter-barbiecore-home", slug="index"),
            _page("starter-barbiecore-shop", "Shop", "#ff2ea8", ["Poppins", "Playfair Display"], [
                nav,
                '<section style="padding:64px 56px;background:#fff0f8;font-family:Poppins,sans-serif;color:#450a2a;"><h1 style="font-family:\'Playfair Display\',serif;font-size:44px;margin:0 0 32px;font-weight:900;text-align:center;">The full drop.</h1><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:18px;max-width:900px;margin:0 auto;">' + "".join([f'<div style="background:{c};border-radius:24px;padding:18px;text-align:center;"><div style="aspect-ratio:1;background:#fff;border-radius:16px;margin-bottom:10px;"></div><div style="font-weight:700;font-size:13px;">{t}</div><div style="font-size:12px;color:#7a3055;">{p}</div></div>' for c, t, p in [("#ffe0ec", "Cherry lip gloss", "$18"), ("#ffd0e0", "Chrome nail set", "$24"), ("#ffb8d4", "Face jewels", "$14"), ("#ffe0ec", "Pink blush palette", "$32")]]) + '</div></section>',
                footer,
            ], seo={"title": "Shop — GLOSS", "description": "The full drop."}, page_id="starter-barbiecore-shop", slug="shop"),
            _page("starter-barbiecore-about", "About", "#ff2ea8", ["Poppins", "Playfair Display"], [
                nav,
                '<section style="padding:64px 56px;background:linear-gradient(180deg,#ff9ec4 0%,#ff2ea8 100%);font-family:Poppins,sans-serif;color:#ffffff;text-align:center;"><h1 style="font-family:\'Playfair Display\',serif;font-size:38px;margin:0 0 18px;font-weight:900;">About GLOSS.</h1><p style="font-size:15px;line-height:1.75;max-width:480px;margin:0 auto;font-weight:500;">Started by two friends who thought beauty brands took themselves way too seriously. Vegan, cruelty-free, and completely unafraid of glitter.</p></section>',
                footer,
            ], seo={"title": "About — GLOSS", "description": "About the brand."}, page_id="starter-barbiecore-about", slug="about"),
        ],
    )


def _starter_win95() -> Dict[str, Any]:
    win_shell_open = '<div style="max-width:760px;margin:0 auto;background:#c3c3c3;border:2px solid #ffffff;border-right-color:#000000;border-bottom-color:#000000;box-shadow:2px 2px 0 #000000;">'
    titlebar = lambda title: f'<div style="background:linear-gradient(90deg,#000080 0%,#1084d0 100%);color:#ffffff;padding:4px 6px;font-size:12px;font-weight:700;display:flex;justify-content:space-between;align-items:center;">{title}<div style="display:flex;gap:2px;"><button style="width:18px;height:16px;background:#c3c3c3;border:1px solid #ffffff;border-right-color:#000000;border-bottom-color:#000000;font-size:10px;font-weight:700;color:#000000;">_</button><button style="width:18px;height:16px;background:#c3c3c3;border:1px solid #ffffff;border-right-color:#000000;border-bottom-color:#000000;font-size:10px;font-weight:700;color:#000000;">□</button><button style="width:18px;height:16px;background:#c3c3c3;border:1px solid #ffffff;border-right-color:#000000;border-bottom-color:#000000;font-size:10px;font-weight:700;color:#000000;">×</button></div></div>'
    taskbar = lambda active: f'<footer style="padding:8px 12px;background:#c3c3c3;color:#000000;font-family:Tahoma,sans-serif;font-size:11px;border-top:2px solid #ffffff;display:flex;justify-content:space-between;"><span>Start · Programs · Studio 95 · <a href="index.html" style="color:#000000;">welcome.exe</a> · <a href="guestbook.html" style="color:#000000;">guestbook.exe</a></span><span>03:47 PM</span></footer>'
    return _tpl(
        "starter-win95",
        "Windows 95",
        "System font, gray title bars, drop-shadow buttons — early-desktop nostalgia.",
        "win95",
        "#008080",
        ["VT323"],
        html_blocks=[],
        pages=[
            _page("starter-win95", "Home", "#008080", ["VT323"], [
                f'<section style="min-height:56vh;padding:56px 40px;background:#008080;font-family:Tahoma,Verdana,sans-serif;color:#000000;">{win_shell_open}{titlebar("welcome.exe")}<div style="padding:32px;"><h1 style="font-family:\'MS Sans Serif\',Tahoma,sans-serif;font-size:32px;margin:0 0 16px;font-weight:700;">Welcome to the past.</h1><p style="font-size:13px;line-height:1.5;max-width:520px;">A creative studio still running on Windows 95. Every project is a folder. Every folder has an icon. Save often, defrag occasionally, and never trust an autoupdate.</p><div style="margin-top:24px;display:flex;gap:8px;"><a href="guestbook.html" style="padding:6px 20px;background:#c3c3c3;border:2px solid #ffffff;border-right-color:#000000;border-bottom-color:#000000;font-family:Tahoma,sans-serif;font-size:12px;color:#000000;text-decoration:none;display:inline-block;">Read guestbook</a></div></div></div></section>',
                '<section style="padding:48px 40px;background:#008080;font-family:Tahoma,Verdana,sans-serif;color:#ffffff;"><h2 style="color:#ffffff;font-size:18px;margin:0 0 20px;text-shadow:1px 1px 0 #000000;">📁 My Documents</h2><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:20px;max-width:900px;">' + "".join([f'<div style="text-align:center;color:#ffffff;font-size:12px;text-shadow:1px 1px 0 #000000;"><div style="width:48px;height:48px;background:{c};border:1px solid #000000;margin:0 auto 6px;display:flex;align-items:center;justify-content:center;font-size:24px;">{e}</div>{t}</div>' for c, e, t in [("#f0e050", "📁", "portfolio\\"), ("#ffffff", "📄", "about.txt"), ("#c3c3c3", "🖳", "contact.exe"), ("#f0f0f0", "🎨", "sketches\\")]]) + '</div></section>',
                taskbar("welcome.exe"),
            ], seo={"title": "welcome.exe — Studio 95", "description": "Early-desktop nostalgia."}, page_id="starter-win95-home", slug="index"),
            _page("starter-win95-guestbook", "Guestbook", "#008080", ["VT323"], [
                f'<section style="padding:56px 40px;background:#008080;font-family:Tahoma,Verdana,sans-serif;color:#000000;">{win_shell_open}{titlebar("guestbook.exe")}<div style="padding:0;">'
                + _comments_section(
                    [
                        {"id": 1, "author": "webmaster_joe", "date": "2 days ago", "text": "Nice site! Loading fast even on my 28.8k modem."},
                        {"id": 2, "author": "pixel_pam", "date": "1 week ago", "text": "The folder icons are a great touch, very authentic"},
                    ],
                    wrap_style="font-family:Tahoma,sans-serif;padding:20px;background:#c3c3c3;",
                    heading_style="font-size:14px;font-weight:700;color:#000000;",
                )
                + '</div></div></section>',
                taskbar("guestbook.exe"),
            ], seo={"title": "guestbook.exe — Studio 95", "description": "Sign the guestbook."}, page_id="starter-win95-guestbook", slug="guestbook"),
        ],
    )


def _starter_grunge_zine() -> Dict[str, Any]:
    nav = '<header style="padding:14px 40px;background:#1a1a1a;font-family:\'IBM Plex Mono\',monospace;display:flex;align-items:center;justify-content:space-between;"><a href="index.html" style="color:#f0ede4;font-size:13px;letter-spacing:0.1em;text-decoration:none;text-transform:uppercase;">the zine</a><nav style="display:flex;gap:18px;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;"><a href="issue.html" style="color:#ee2a2a;text-decoration:none;">Read issue</a><a href="contact.html" style="color:#f0ede4;text-decoration:none;">Contact</a></nav></header>'
    footer = '<footer style="padding:20px 40px;background:#ee2a2a;color:#f0ede4;font-family:\'IBM Plex Mono\',monospace;font-size:11px;letter-spacing:0.2em;text-align:center;text-transform:uppercase;">printed on a photocopier at 2am · not for resale</footer>'
    return _tpl(
        "starter-grunge-zine",
        "Grunge Zine",
        "Photocopy black + red, cutouts, torn edges, mixed serif/sans chaos.",
        "grunge-zine",
        "#f0ede4",
        ["IBM Plex Mono", "Playfair Display"],
        html_blocks=[],
        pages=[
            _page("starter-grunge-zine", "Home", "#f0ede4", ["IBM Plex Mono", "Playfair Display"], [
                nav,
                '<section style="min-height:56vh;padding:56px 40px;background:#f0ede4;background-image:radial-gradient(#c0bcb0 1px,transparent 1px);background-size:3px 3px;font-family:\'IBM Plex Mono\',monospace;color:#1a1a1a;position:relative;"><div style="max-width:720px;position:relative;"><div style="display:inline-block;background:#ee2a2a;color:#f0ede4;padding:4px 12px;font-weight:700;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;transform:rotate(-2deg);">ISSUE #007 · Feb 2026</div><h1 style="font-family:\'Playfair Display\',serif;font-size:88px;line-height:0.92;margin:16px 0;font-weight:900;letter-spacing:-0.02em;">A zine, but on the <span style="background:#1a1a1a;color:#f0ede4;padding:0 12px;">web</span>.</h1><p style="font-size:15px;line-height:1.7;max-width:520px;background:#ffffff;padding:16px;border:1px solid #1a1a1a;box-shadow:4px 4px 0 #ee2a2a;">Cut-and-paste layouts. Photocopy textures. Handwritten margin notes. Interviews with people you\'ve never heard of. This is deliberately not a magazine.</p><div style="margin-top:28px;display:flex;gap:12px;flex-wrap:wrap;"><a href="issue.html" style="padding:12px 22px;background:#1a1a1a;color:#f0ede4;text-decoration:none;font-weight:700;font-size:14px;text-transform:uppercase;letter-spacing:0.1em;transform:rotate(-1deg);display:inline-block;">Read issue →</a><a href="contact.html" style="padding:12px 22px;background:#ee2a2a;color:#f0ede4;text-decoration:none;font-weight:700;font-size:14px;text-transform:uppercase;letter-spacing:0.1em;transform:rotate(1deg);display:inline-block;">Mail us a stamp</a></div></div></section>',
                '<section style="padding:56px 40px;background:#1a1a1a;color:#f0ede4;font-family:\'IBM Plex Mono\',monospace;"><h2 style="font-family:\'Playfair Display\',serif;font-size:44px;margin:0 0 32px;font-weight:900;color:#ee2a2a;">Contents.</h2><div style="display:grid;grid-template-columns:repeat(2,1fr);gap:20px;font-size:14px;line-height:1.7;">' + "".join([f'<div style="padding:16px;background:#f0ede4;color:#1a1a1a;transform:rotate({r}deg);"><div style="font-family:\'Playfair Display\',serif;font-size:26px;font-weight:900;margin-bottom:4px;">{t}</div><div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#7a7a7a;">{d}</div></div>' for r, t, d in [("-1", "The Bus Driver Interview", "6 pages · fold-out map"), ("0.8", "A Manifesto About Sandwiches", "3 pages · illustrated"), ("-0.5", "Zine Culture Is Not Over", "editorial · 2 pages"), ("1.2", "Photocopy Every Show", "photo essay · pull-out")]]) + '</div></section>',
                footer,
            ], seo={"title": "The Zine — Issue #007", "description": "Photocopy black + red, cutouts, torn edges."}, page_id="starter-grunge-zine-home", slug="index"),
            _page("starter-grunge-zine-issue", "Issue #007", "#f0ede4", ["IBM Plex Mono", "Playfair Display"], [
                nav,
                '<section style="padding:48px 40px;background:#f0ede4;font-family:\'IBM Plex Mono\',monospace;color:#1a1a1a;"><h1 style="font-family:\'Playfair Display\',serif;font-size:52px;margin:0 0 8px;font-weight:900;">The Bus Driver Interview</h1><div style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#7a7a7a;margin-bottom:28px;">6 pages · fold-out map · issue #007</div><div style="max-width:600px;font-size:15px;line-height:1.8;background:#ffffff;padding:20px;border:1px solid #1a1a1a;box-shadow:4px 4px 0 #ee2a2a;"><p style="margin:0 0 14px;">He has driven the 47 route for nineteen years and has never once been asked for an interview until now. We caught him on his lunch break, which is fourteen minutes, all of which he spent talking to us instead of eating.</p><p style="margin:0;">"People think the job is boring," he said. "It is the opposite of boring. Every single day something happens that nobody would believe."</p></div></section>',
                footer,
            ], seo={"title": "Issue #007 — The Zine", "description": "The Bus Driver Interview and more."}, page_id="starter-grunge-zine-issue", slug="issue"),
            _page("starter-grunge-zine-contact", "Contact", "#f0ede4", ["IBM Plex Mono", "Playfair Display"], [
                nav,
                '<section style="padding:56px 40px;background:#ee2a2a;font-family:\'IBM Plex Mono\',monospace;color:#f0ede4;text-align:center;"><h1 style="font-family:\'Playfair Display\',serif;font-size:36px;margin:0 0 14px;font-weight:900;">Mail us a stamp.</h1><p style="font-size:13px;margin:0 0 16px;">Or, if you must, email.</p><a href="mailto:hello@thezine.press" style="color:#f0ede4;text-decoration:underline;font-size:14px;">hello@thezine.press</a></section>',
                footer,
            ], seo={"title": "Contact — The Zine", "description": "Get in touch."}, page_id="starter-grunge-zine-contact", slug="contact"),
        ],
    )


def _starter_art_nouveau() -> Dict[str, Any]:
    nav = '<header style="padding:20px 56px;background:#f4ecd8;font-family:\'Cormorant Garamond\',serif;display:flex;align-items:center;justify-content:space-between;"><a href="index.html" style="font-family:\'Cormorant SC\',serif;font-size:15px;letter-spacing:0.2em;color:#3a4a20;text-decoration:none;">L\'ATELIER MUCHA</a><nav style="display:flex;gap:24px;font-size:13px;"><a href="gallery.html" style="color:#5a4a30;text-decoration:none;">Gallery</a><a href="contact.html" style="color:#5a4a30;text-decoration:none;">Contact</a></nav></header>'
    footer = '<footer style="padding:24px 56px;background:#3a4a25;color:#c8a848;font-family:\'Cormorant SC\',serif;font-size:11px;letter-spacing:0.28em;text-align:center;text-transform:uppercase;">Atelier Mucha · 14 rue de Seine · Paris VI</footer>'
    return _tpl(
        "starter-art-nouveau",
        "Art Nouveau",
        "Organic curves, gold & emerald, Mucha-inspired botanic lines.",
        "art-nouveau",
        "#f4ecd8",
        ["Cormorant Garamond", "Cormorant SC"],
        html_blocks=[],
        pages=[
            _page("starter-art-nouveau", "Home", "#f4ecd8", ["Cormorant Garamond", "Cormorant SC"], [
                nav,
                '<section style="min-height:60vh;padding:64px 56px;background:linear-gradient(135deg,#f4ecd8 0%,#e0d0a0 100%);font-family:\'Cormorant Garamond\',serif;color:#2a3a20;position:relative;overflow:hidden;"><div style="max-width:640px;position:relative;z-index:2;"><div style="font-family:\'Cormorant SC\',serif;font-size:13px;letter-spacing:0.4em;color:#7a6020;margin-bottom:20px;">L\'ATELIER MUCHA · ÉTABLI MDCCCXCVI</div><h1 style="font-size:82px;line-height:1;margin:0 0 18px;font-weight:400;font-style:italic;letter-spacing:-0.01em;color:#3a4a25;">Nature,<br>drawn slowly.</h1><p style="font-size:18px;line-height:1.7;max-width:480px;color:#5a4a30;">An illustration studio still working with pen, ink, and gold leaf. Botanical posters, wine labels, opera programmes. Every commission takes a season. We do not do rush jobs; we suggest patience.</p><div style="margin-top:36px;display:flex;gap:16px;align-items:center;"><a href="contact.html" style="padding:14px 30px;background:#3a4a25;color:#f4ecd8;text-decoration:none;font-family:\'Cormorant SC\',serif;font-size:12px;letter-spacing:0.28em;text-transform:uppercase;border-radius:2px;">Commission a work</a></div></div></section>',
                '<section style="padding:64px 56px;background:#2a3a20;color:#e8dcb0;font-family:\'Cormorant Garamond\',serif;"><div style="display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center;"><div><div style="font-family:\'Cormorant SC\',serif;font-size:12px;letter-spacing:0.32em;color:#c8a848;margin-bottom:16px;">SÉLECTION DE L\'ANNÉE</div><h2 style="font-size:52px;margin:0 0 20px;font-weight:400;font-style:italic;color:#f4ecd8;">Les affiches.</h2><p style="font-size:16px;line-height:1.75;color:#c8bc90;">Four botanical posters, hand-drawn in ink and finished with 23-carat gold leaf. <a href="gallery.html" style="color:#c8a848;">See the full gallery →</a></p></div><div style="font-family:\'Cormorant SC\',serif;font-size:14px;line-height:2.2;color:#c8bc90;letter-spacing:0.08em;">' + "".join([f'<div style="border-bottom:1px solid #5a6a45;padding:8px 0;display:flex;justify-content:space-between;"><span>{n} · {t}</span><span style="color:#c8a848;">{p}</span></div>' for n, t, p in [("I", "Lys blanc", "480 €"), ("II", "Coquelicot", "480 €"), ("III", "Chardon d\'Écosse", "560 €"), ("IV", "Volubilis", "520 €")]]) + '</div></div></section>',
                footer,
            ], seo={"title": "L'Atelier Mucha — Nature, drawn slowly", "description": "Organic curves, gold & emerald, botanic lines."}, page_id="starter-art-nouveau-home", slug="index"),
            _page("starter-art-nouveau-gallery", "Gallery", "#f4ecd8", ["Cormorant Garamond", "Cormorant SC"], [
                nav,
                '<section style="padding:64px 56px;background:#f4ecd8;font-family:\'Cormorant Garamond\',serif;color:#2a3a20;"><h1 style="font-size:52px;margin:0 0 32px;font-weight:400;font-style:italic;text-align:center;">The full gallery.</h1><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;max-width:900px;margin:0 auto;">' + "".join([f'<div style="background:{c};border-radius:8px;padding:20px;text-align:center;"><div style="aspect-ratio:3/4;background:linear-gradient(160deg,#e0d0a0,#f4ecd8);border-radius:4px;margin-bottom:12px;"></div><div style="font-style:italic;font-size:18px;">{t}</div><div style="font-family:\'Cormorant SC\',serif;font-size:12px;color:#7a6020;letter-spacing:0.1em;">{p}</div></div>' for c, t, p in [("#e8dcb0", "Lys blanc", "480 €"), ("#f0e8c8", "Coquelicot", "480 €"), ("#e0d0a0", "Chardon d\'Écosse", "560 €"), ("#e8dcb0", "Volubilis", "520 €"), ("#f0e8c8", "Iris pâle", "540 €"), ("#e0d0a0", "Glycine", "500 €")]]) + '</div></section>',
                footer,
            ], seo={"title": "Gallery — L'Atelier Mucha", "description": "The full poster gallery."}, page_id="starter-art-nouveau-gallery", slug="gallery"),
            _page("starter-art-nouveau-contact", "Contact", "#f4ecd8", ["Cormorant Garamond", "Cormorant SC"], [
                nav,
                '<section style="padding:64px 56px;background:#2a3a20;color:#e8dcb0;font-family:\'Cormorant Garamond\',serif;text-align:center;"><h1 style="font-size:36px;margin:0 0 16px;font-weight:400;font-style:italic;">Commission a work.</h1><p style="font-family:\'Cormorant SC\',serif;font-size:12px;letter-spacing:0.2em;color:#c8a848;margin:0 0 20px;">PRIX SUR DEMANDE</p><a href="mailto:atelier@mucha.paris" style="color:#f4ecd8;font-family:\'Cormorant SC\',serif;font-size:13px;letter-spacing:0.15em;text-decoration:underline;">atelier@mucha.paris</a></section>',
                footer,
            ], seo={"title": "Contact — L'Atelier Mucha", "description": "Commission a work."}, page_id="starter-art-nouveau-contact", slug="contact"),
        ],
    )


def _starter_swiss() -> Dict[str, Any]:
    nav = '<header style="padding:24px 80px;background:#f4f4f4;font-family:Inter,sans-serif;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #111111;"><a href="index.html" style="font-weight:700;color:#111111;font-size:15px;text-decoration:none;letter-spacing:-0.01em;">SCHENKER STUDIO</a><nav style="display:flex;gap:28px;font-size:13px;"><a href="work.html" style="color:#111111;text-decoration:none;">Work</a><a href="contact.html" style="color:#111111;text-decoration:none;">Contact</a></nav></header>'
    footer = '<footer style="padding:24px 80px;background:#111111;color:#f4f4f4;font-family:Inter,sans-serif;font-size:11px;letter-spacing:0.02em;display:flex;justify-content:space-between;"><span>© 2026 SCHENKER STUDIO · ZÜRICH</span><span style="color:#e5001a;">●</span></footer>'
    return _tpl(
        "starter-swiss",
        "Swiss Modernism",
        "Helvetica-ish, red accents, strict grid — 1957 shows up on time.",
        "swiss",
        "#f4f4f4",
        ["Inter"],
        html_blocks=[],
        pages=[
            _page("starter-swiss", "Home", "#f4f4f4", ["Inter"], [
                nav,
                '<section style="min-height:60vh;padding:64px 80px;background:#f4f4f4;font-family:Inter,sans-serif;color:#111111;"><div style="max-width:1100px;margin:0 auto;display:grid;grid-template-columns:repeat(12,1fr);gap:24px;"><div style="grid-column:1/9;"><div style="font-size:11px;letter-spacing:0.02em;color:#111111;margin-bottom:20px;">01 · Studio · Est. 1957</div><h1 style="font-size:112px;line-height:0.94;margin:0 0 24px;font-weight:700;letter-spacing:-0.04em;">Grid.<br>Type.<br><span style="color:#e5001a;">Repeat.</span></h1></div><div style="grid-column:9/13;padding-top:60px;"><p style="font-size:14px;line-height:1.65;color:#333333;margin:0 0 16px;">A design studio still following the Zurich school. Every layout begins on a 12-column grid. Every headline is set flush left. Every colour is either black, white, or one very specific red.</p><a href="work.html" style="padding:12px 24px;background:#111111;color:#f4f4f4;text-decoration:none;font-size:13px;font-weight:600;letter-spacing:0.02em;display:inline-block;">See work →</a></div></div></section>',
                '<section style="padding:56px 80px;background:#ffffff;font-family:Inter,sans-serif;color:#111111;"><div style="max-width:1100px;margin:0 auto;display:grid;grid-template-columns:repeat(12,1fr);gap:24px;"><h2 style="grid-column:1/13;font-size:44px;margin:0 0 32px;font-weight:700;letter-spacing:-0.02em;">Selected clients, 2024–2026.</h2>' + "".join([f'<div style="grid-column:{c};padding-top:20px;border-top:1px solid #111111;"><div style="font-size:13px;font-weight:600;">{n}</div><div style="font-size:11px;color:#7a7a7a;margin-top:4px;letter-spacing:0.02em;">{d}</div></div>' for c, n, d in [("1/4", "Migros Culture Percentage", "Identity · Bern"), ("4/7", "SBB Rail", "Signage · Zurich"), ("7/10", "Museum für Gestaltung", "Catalogue · Zurich"), ("10/13", "Vitra", "Editorial · Basel")]]) + '</div></section>',
                footer,
            ], seo={"title": "Schenker Studio — Grid. Type. Repeat.", "description": "Helvetica-ish, red accents, strict grid."}, page_id="starter-swiss-home", slug="index"),
            _page("starter-swiss-work", "Work", "#f4f4f4", ["Inter"], [
                nav,
                '<section style="padding:56px 80px;background:#ffffff;font-family:Inter,sans-serif;color:#111111;"><div style="max-width:1100px;margin:0 auto;display:grid;grid-template-columns:repeat(12,1fr);gap:24px;"><h1 style="grid-column:1/13;font-size:44px;margin:0 0 32px;font-weight:700;letter-spacing:-0.02em;">Full client list.</h1>' + "".join([f'<div style="grid-column:{c};padding-top:20px;border-top:1px solid #111111;"><div style="font-size:13px;font-weight:600;">{n}</div><div style="font-size:11px;color:#7a7a7a;margin-top:4px;letter-spacing:0.02em;">{d}</div></div>' for c, n, d in [("1/4", "Migros Culture Percentage", "Identity · Bern"), ("4/7", "SBB Rail", "Signage · Zurich"), ("7/10", "Museum für Gestaltung", "Catalogue · Zurich"), ("10/13", "Vitra", "Editorial · Basel"), ("1/4", "Bank Julius Bär", "Wayfinding · Geneva"), ("4/7", "Neue Zürcher Zeitung", "Web · Zurich"), ("7/10", "Freitag", "Retail · Zurich"), ("10/13", "USM", "Poster series · Bern")]]) + '</div></section>',
                footer,
            ], seo={"title": "Work — Schenker Studio", "description": "Full client list."}, page_id="starter-swiss-work", slug="work"),
            _page("starter-swiss-contact", "Contact", "#f4f4f4", ["Inter"], [
                nav,
                '<section style="padding:64px 80px;background:#111111;color:#f4f4f4;font-family:Inter,sans-serif;"><div style="max-width:1100px;margin:0 auto;display:grid;grid-template-columns:repeat(12,1fr);gap:24px;"><h1 style="grid-column:1/8;font-size:44px;margin:0 0 16px;font-weight:700;letter-spacing:-0.02em;">Get in touch.</h1><a href="mailto:studio@schenker.ch" style="grid-column:1/8;color:#e5001a;font-size:16px;text-decoration:none;font-weight:600;">studio@schenker.ch</a></div></section>',
                footer,
            ], seo={"title": "Contact — Schenker Studio", "description": "Get in touch."}, page_id="starter-swiss-contact", slug="contact"),
        ],
    )


def _starter_goblincore() -> Dict[str, Any]:
    nav = '<header style="padding:20px 56px;background:#2a3520;font-family:Fraunces,serif;display:flex;align-items:center;justify-content:space-between;"><a href="index.html" style="font-style:italic;font-size:17px;color:#e8dc9c;text-decoration:none;">from beneath the log</a><nav style="display:flex;gap:22px;font-size:13px;font-family:Lora,serif;"><a href="shop.html" style="color:#c8bc90;text-decoration:none;">Shop</a><a href="contact.html" style="color:#c8bc90;text-decoration:none;">Contact</a></nav></header>'
    footer = '<footer style="padding:24px 56px;background:#2a3520;color:#8a6f2a;font-family:Lora,serif;font-size:12px;font-style:italic;text-align:center;">gremlin approved · nothing here is fresh · thank you for looking</footer>'
    return _tpl(
        "starter-goblincore",
        "Goblincore",
        "Mossy earth, mushrooms, shiny things — feral cottagecore.",
        "goblincore",
        "#2a3520",
        ["Fraunces", "Lora"],
        html_blocks=[],
        pages=[
            _page("starter-goblincore", "Home", "#2a3520", ["Fraunces", "Lora"], [
                nav,
                '<section style="min-height:60vh;padding:64px 56px;background:radial-gradient(circle at 30% 30%,#3a4a28 0%,#1a2412 70%);font-family:Fraunces,serif;color:#d0c8a4;position:relative;overflow:hidden;"><div style="max-width:640px;position:relative;z-index:2;"><div style="font-size:12px;letter-spacing:0.28em;text-transform:uppercase;color:#a89a5c;margin-bottom:18px;font-family:Lora,serif;">— from beneath the log</div><h1 style="font-size:78px;line-height:1;margin:0 0 20px;font-weight:400;font-style:italic;letter-spacing:-0.01em;color:#e8dc9c;">Bring me all<br>the pretty rocks.</h1><p style="font-size:17px;line-height:1.75;max-width:500px;color:#b8b088;font-family:Lora,serif;">A very small shop for people who collect things. Mushrooms, bones, unusual leaves, spoons the wrong shape, sea glass. Everything is either dug up or foraged. Nothing is fresh; that is on purpose.</p><div style="margin-top:32px;display:flex;gap:16px;"><a href="shop.html" style="padding:14px 26px;background:#8a6f2a;color:#1a2412;text-decoration:none;font-weight:600;border-radius:2px;font-size:14px;letter-spacing:0.05em;">Rummage the shop →</a></div></div></section>',
                '<section style="padding:64px 56px;background:#1a2412;color:#d0c8a4;font-family:Fraunces,serif;"><h2 style="font-size:44px;margin:0 0 32px;font-weight:400;font-style:italic;color:#e8dc9c;">This week\'s finds.</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;">' + "".join([f'<div style="padding:24px;background:#2a3520;border:1px solid #4a5a30;border-radius:8px;"><div style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#8a6f2a;font-family:Lora,serif;">{c}</div><h3 style="margin:8px 0 6px;font-size:22px;font-style:italic;font-weight:400;color:#e8dc9c;">{t}</h3><p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#a89a68;font-family:Lora,serif;">{d}</p><div style="font-size:14px;color:#c8a848;font-weight:600;">{p}</div></div>' for c, t, d, p in [("MUSHROOMS · DRIED", "Amanita (safe)", "Displayed only. Do not eat.", "£ 6"), ("BONES · SMALL", "Fox jaw", "Bleached, mostly complete.", "£ 22"), ("METAL · CORRODED", "Iron key (18C?)", "From a river bank. Origin unknown.", "£ 14")]]) + '</div></section>',
                footer,
            ], seo={"title": "From Beneath the Log — Bring me all the pretty rocks", "description": "Mossy earth, mushrooms, shiny things."}, page_id="starter-goblincore-home", slug="index"),
            _page("starter-goblincore-shop", "Shop", "#2a3520", ["Fraunces", "Lora"], [
                nav,
                '<section style="padding:64px 56px;background:#1a2412;color:#d0c8a4;font-family:Fraunces,serif;"><h1 style="font-size:40px;margin:0 0 32px;font-weight:400;font-style:italic;color:#e8dc9c;text-align:center;">All the finds.</h1><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;">' + "".join([f'<div style="padding:24px;background:#2a3520;border:1px solid #4a5a30;border-radius:8px;"><div style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:#8a6f2a;font-family:Lora,serif;">{c}</div><h3 style="margin:8px 0 6px;font-size:20px;font-style:italic;font-weight:400;color:#e8dc9c;">{t}</h3><p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#a89a68;font-family:Lora,serif;">{d}</p><div style="font-size:14px;color:#c8a848;font-weight:600;">{p}</div></div>' for c, t, d, p in [("SHELLS · SEA GLASS", "Frosted green glass", "Found at low tide.", "£ 8"), ("LEAVES · PRESSED", "Oak, October", "Between two panes.", "£ 5"), ("TEETH · SMALL", "Fossil shark tooth", "Miocene, allegedly.", "£ 18"), ("SPOONS · BENT", "The wrong shape one", "Found, not bought.", "£ 3"), ("FEATHERS · CORVID", "Jackdaw primary", "Iridescent in sun.", "£ 4"), ("STONES · HOLED", "Hag stone", "For seeing through, they say.", "£ 12")]]) + '</div></section>',
                footer,
            ], seo={"title": "Shop — From Beneath the Log", "description": "All the finds."}, page_id="starter-goblincore-shop", slug="shop"),
            _page("starter-goblincore-contact", "Contact", "#2a3520", ["Fraunces", "Lora"], [
                nav,
                '<section style="padding:64px 56px;background:radial-gradient(circle at 30% 30%,#3a4a28 0%,#1a2412 70%);font-family:Fraunces,serif;color:#d0c8a4;text-align:center;"><h1 style="font-size:34px;margin:0 0 16px;font-weight:400;font-style:italic;color:#e8dc9c;">Say hello.</h1><a href="mailto:hello@beneaththelog.shop" style="color:#c8a848;font-family:Lora,serif;font-size:14px;text-decoration:underline;">hello@beneaththelog.shop</a></section>',
                footer,
            ], seo={"title": "Contact — From Beneath the Log", "description": "Get in touch."}, page_id="starter-goblincore-contact", slug="contact"),
        ],
    )


def _starter_dreamcore() -> Dict[str, Any]:
    nav = '<header style="padding:18px 56px;background:#f3e8ff;font-family:Fraunces,serif;display:flex;align-items:center;justify-content:space-between;"><a href="index.html" style="font-family:Caveat,cursive;font-size:22px;color:#8a5aa8;text-decoration:none;">the hallway</a><nav style="display:flex;gap:22px;font-size:13px;"><a href="rooms.html" style="color:#4a2a70;text-decoration:none;">More rooms</a><a href="guestbook.html" style="color:#4a2a70;text-decoration:none;">Leave a memory</a></nav></header>'
    footer = '<footer style="padding:24px 56px;background:#f3e8ff;color:#8a6ab0;font-family:Caveat,cursive;font-size:22px;text-align:center;">please do not wake up yet</footer>'
    return _tpl(
        "starter-dreamcore",
        "Dreamcore",
        "Hazy pastels, floating orbs, unresolved nostalgia — the internet as a half-remembered dream.",
        "dreamcore",
        "#f3e8ff",
        ["Caveat", "Fraunces"],
        html_blocks=[],
        pages=[
            _page("starter-dreamcore", "Home", "#f3e8ff", ["Caveat", "Fraunces"], [
                nav,
                '<section style="min-height:64vh;padding:80px 56px;background:radial-gradient(ellipse at 30% 30%,#ffd6ec 0%,#f3e8ff 40%,#c9d8f8 100%);font-family:Fraunces,serif;color:#3a2a5a;position:relative;overflow:hidden;text-align:center;"><div style="position:absolute;left:15%;top:20%;width:180px;height:180px;background:radial-gradient(circle,#ffdc90,transparent 65%);filter:blur(30px);"></div><div style="position:absolute;right:20%;top:15%;width:120px;height:120px;background:radial-gradient(circle,#c8a4ff,transparent 65%);filter:blur(20px);"></div><div style="max-width:640px;margin:0 auto;position:relative;z-index:2;"><div style="font-family:Caveat,cursive;font-size:36px;color:#8a5aa8;margin-bottom:12px;">do you remember?</div><h1 style="font-size:78px;line-height:1;margin:0 0 24px;font-weight:400;font-style:italic;letter-spacing:-0.02em;color:#4a2a70;">A place, but not really<br>a place.</h1><p style="font-size:17px;line-height:1.75;max-width:500px;margin:0 auto;color:#6a5a80;">You were seven and you were on holiday and there was a hallway and a pink light and someone laughing very far away and you can\'t remember what happened next. This whole website is that hallway.</p><div style="margin-top:36px;"><a href="rooms.html" style="padding:14px 30px;background:rgba(255,255,255,0.6);color:#4a2a70;text-decoration:none;backdrop-filter:blur(10px);border-radius:999px;font-size:14px;letter-spacing:0.08em;border:1px solid rgba(255,255,255,0.5);">walk further in →</a></div></div></section>',
                '<section style="padding:64px 56px;background:#e8d8f8;font-family:Fraunces,serif;color:#3a2a5a;text-align:center;"><h2 style="font-family:Caveat,cursive;font-size:56px;margin:0 0 24px;color:#6a4a90;">rooms</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;max-width:900px;margin:0 auto;">' + "".join([f'<div style="padding:32px 20px;background:linear-gradient(160deg,{c1} 0%,{c2} 100%);border-radius:24px;filter:blur(0.5px);"><div style="font-family:Caveat,cursive;font-size:28px;color:#3a2a5a;">{t}</div><p style="font-size:13px;line-height:1.7;margin:6px 0 0;color:#5a4a70;">{d}</p></div>' for c1, c2, t, d in [("#f8d8ec", "#e8c8f0", "the hallway", "carpet colour: unclear. lightbulb: warm."), ("#d0e0f8", "#c0d0f0", "the swimming pool room", "empty. echoing. tiled in pale mint."), ("#f8e8c8", "#e8d0b0", "the kitchen at 3pm", "everyone is upstairs. the fridge hums.")]]) + f'<a href="rooms.html" style="grid-column:1/-1;color:#6a4a90;font-family:Caveat,cursive;font-size:20px;text-decoration:none;">more rooms →</a></div></section>',
                footer,
            ], seo={"title": "The Hallway — A place, but not really a place", "description": "Hazy pastels, floating orbs, unresolved nostalgia."}, page_id="starter-dreamcore-home", slug="index"),
            _page("starter-dreamcore-rooms", "More Rooms", "#f3e8ff", ["Caveat", "Fraunces"], [
                nav,
                '<section style="padding:64px 56px;background:#e8d8f8;font-family:Fraunces,serif;color:#3a2a5a;text-align:center;"><h1 style="font-family:Caveat,cursive;font-size:56px;margin:0 0 32px;color:#6a4a90;">every room</h1><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;max-width:900px;margin:0 auto;">' + "".join([f'<div style="padding:32px 20px;background:linear-gradient(160deg,{c1} 0%,{c2} 100%);border-radius:24px;"><div style="font-family:Caveat,cursive;font-size:26px;color:#3a2a5a;">{t}</div><p style="font-size:12px;line-height:1.6;margin:6px 0 0;color:#5a4a70;">{d}</p></div>' for c1, c2, t, d in [("#f8d8ec", "#e8c8f0", "the hallway", "carpet colour: unclear."), ("#d0e0f8", "#c0d0f0", "the swimming pool room", "empty. echoing."), ("#f8e8c8", "#e8d0b0", "the kitchen at 3pm", "the fridge hums."), ("#e8d8f8", "#d8c8f0", "the waiting room", "no one is called."), ("#f0e0f8", "#e0d0f0", "the elevator that only goes up", "you press 4. it stops at 7."), ("#d8e8f0", "#c8d8e8", "the garden that is also a hallway", "the grass is the wrong texture.")]]) + '</div></section>',
                footer,
            ], seo={"title": "More Rooms — The Hallway", "description": "Every room in the dream."}, page_id="starter-dreamcore-rooms", slug="rooms"),
            _page("starter-dreamcore-guestbook", "Leave a Memory", "#f3e8ff", ["Caveat", "Fraunces"], [
                nav,
                _comments_section(
                    [
                        {"id": 1, "author": "half.remembered", "date": "3 days ago", "text": "there was a hallway like this in my grandmother's house. i haven't thought about it in years."},
                        {"id": 2, "author": "static.hum", "date": "1 week ago", "text": "the kitchen at 3pm one made me cry a little. good site."},
                    ],
                    wrap_style="font-family:Fraunces,serif;padding:56px;background:#f3e8ff;",
                    heading_style="font-family:Caveat,cursive;font-size:32px;color:#6a4a90;margin:0 0 16px;",
                ),
                footer,
            ], seo={"title": "Leave a Memory — The Hallway", "description": "Share a half-remembered dream."}, page_id="starter-dreamcore-guestbook", slug="guestbook"),
        ],
    )


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
    _starter_frutiger_aero(),
    # 2. Dark Academia
    _starter_dark_academia(),
    # 3. Solar Punk
    _starter_solar_punk(),
    # 4. Cottagecore
    _starter_cottagecore(),
    # 5. Y2K
    _starter_y2k(),
    # 6. Vaporwave
    _starter_vaporwave(),
    # 7. Cyberpunk
    _starter_cyberpunk(),
    # 8. Brutalism
    _starter_brutalism(),
    # 9. Bauhaus
    _starter_bauhaus(),
    # 10. Scandi Minimal
    _starter_scandi_minimal(),
    # 11. Memphis
    _starter_memphis(),
    # 12. Retro-Futurism
    _starter_retro_futurism(),
    # 13. Bloomcore
    _starter_bloomcore(),
    # 14. Neubrutalism
    _starter_neubrutalism(),
    # 15. Corp Memphis (aka Alegria)
    _starter_corp_memphis(),
    # 16. Kidcore / Scrapbook Collage — naive shapes, primary crayons, doodle vibe
    _starter_kidcore(),
    # 17. Blueprint / Technical Drawing
    _starter_blueprint(),
    # 18. Editorial Minimalism (warm cream, Anthropic-esque)
    _starter_editorial_warm(),
    # 19. Diffused Worlds — soft blurred atmospheric pastels
    _starter_diffused_worlds(),
    # 20. Cassette Futurism — beige/orange CRT bevel
    _starter_cassette_futurism(),
    # 21. Newspaper Editorial
    _starter_newspaper(),
    # 22. Barbiecore
    _starter_barbiecore(),
    # 23. Windows 95 / Retro OS
    _starter_win95(),
    # 24. Grunge Zine
    _starter_grunge_zine(),
    # 25. Art Nouveau
    _starter_art_nouveau(),
    # 26. Swiss Modernism
    _starter_swiss(),
    # 27. Goblincore
    _starter_goblincore(),
    # 29. Blog — clean single-column editorial layout (2026 best practice:
    # no heavy sidebar, readable line length, minimal chrome). Ends with a
    # real comment thread on the featured post.
    _starter_blog(),
    # 30. Xanga Throwback — glossy teal/purple 2000s journal: mood icons,
    # eProps, a "now playing" widget, subscriptions, blogrings.
    _starter_xanga(),
    # 31. LiveJournal Throwback — understated purple/blue LJ-style friends
    # stream: userpics, current mood/music line, tags, comments, a mini
    # calendar widget.
    _starter_livejournal(),
    # 32. Dreamcore
    _starter_dreamcore(),

    # 33-42. Modern, color-agnostic templates — 5 categories x 2 layout
    # variations. Unlike the aesthetic starters above (which ARE a fixed
    # palette), every color here is var(--fc-*, fallback) — the same
    # convention the block library (blocksExtra.js) already uses — so
    # applying any theme via the Theme tab re-colors the whole page live.
    # Fallback palette (what a fresh, no-theme-applied page looks like):
    # bg #ffffff, surface #f8fafc, text #0f172a, muted #64748b,
    # primary #2563eb, accent #7c3aed, border #e2e8f0.

    # 33. SaaS — Minimal — was a centered hero over a 3-equal-card feature
    # row (the single most reported AI-slop template shape). Rebuilt as a
    # left text / right offset-panel-stack split, features into a 2-col
    # asymmetric pair instead of three identical boxes.
    _starter_saas_minimal(),
    # 34. SaaS — Bold — killed the centered hero and the banned purple
    # accent; hero is now an asymmetric split with the stat row moved off
    # to its own right-hand rail instead of sitting centered under the CTA.
    _starter_saas_bold(),

    # 35. Agency — Grid — the project grid was a plain repeat(3,1fr) of
    # identically-sized tiles; rebuilt as an actual asymmetric grid (one
    # wide feature tile, staggered smaller ones) instead of a uniform wall.
    _starter_agency_grid(),
    # 36. Agency — Editorial — already asymmetric/left-aligned; only the
    # banned Inter body font is swapped out (serif display font stays —
    # editorial is the one context the skill allows it in).
    _starter_agency_editorial(),

    # 37. E-commerce — Single Product — renamed off the repetitive "Field-"
    # placeholder brand, and the centered 4-equal-column spec strip became
    # an asymmetric divided list so it stops reading as a stock template.
    _starter_shop_product(),
    # 38. E-commerce — Shop Grid — renamed off "Fieldstone General" and
    # rebuilt the uniform repeat(4,1fr) wall into a masonry-style grid
    # (mixed row spans) plus a left-aligned heading instead of centered.
    _starter_shop_grid(),

    # 39. Portfolio — Minimal Personal — the centered layout is the actual
    # point of this one (its whole reason to exist next to Creative Grid
    # below is being the quiet, symmetric option) so it stays centered;
    # only the banned Inter font and a purely-decorative flourish change.
    _starter_portfolio_minimal(),
    # 40. Portfolio — Creative Grid — was already dark/left-aligned with
    # varied aspect ratios; pushed further into a real masonry (mixed row
    # spans, not just aspect-ratio) so it reads as intentional, not tiled.
    _starter_portfolio_creative(),

    # 41. Restaurant — Modern Bistro — the centered hero and centered menu
    # column became a split (text/menu on one side, a textured accent panel
    # on the other) so the elegance comes from the layout, not just symmetry.
    _starter_restaurant_bistro(),
    # 42. Service Business — Studio/Salon/Clinic — renamed off generic
    # "book a session" copy, centered hero replaced with a split showing a
    # simplified schedule-preview panel instead of just a button on white.
    _starter_service_business(),

    # 43. MySpace Throwback — the platform every other 2000s journal
    # template has been standing in the shadow of: dark profile chrome,
    # a Top 8, an autoplay-styled music banner, and comments.
    _starter_myspace(),

    # 44. GeoCities / Angelfire Personal Homepage — maximalist late-90s
    # chaos: tiled starfield, marquee ticker, hit counter, and a "best
    # viewed in" badge. The loud, unpolished counterpart to the
    # relatively put-together Xanga/LiveJournal/MySpace journal templates.
    _starter_geocities(),

    # 45. Web Forum Throwback — classic phpBB/vBulletin-style thread view:
    # per-post left rail (avatar, rank, join date, post count) beside the
    # post body, exactly the layout every early-2000s forum shared. The
    # reply box reuses the same working comment widget as the other
    # throwbacks, just relabeled — a forum reply IS a comment.
    _starter_forum(),

    # 46-58. Esports Org — the VOID SYNDICATE org site (nav+live badge,
    # hero, roster, fixture ticker, stat strip, sponsors, shop teaser,
    # footer) in 12 fixed color identities plus a 13th that binds to
    # var(--fc-*, fallback) so the Theme tab recolors it live, the same
    # convention starters 33-42 use.
    _esports_pages("starter-esports-mint", "Esports Org — Mint Circuit", "HUD-style esports org site — live badge, roster, fixtures, shop.", "esports-mint",
                      "#07080d", "#10121b", "#f0f2f5", "#8c92a4", "#15ffb5", "#05050a", "#1c2030"),
    _esports_pages("starter-esports-crimson", "Esports Org — Crimson Protocol", "HUD-style esports org site — live badge, roster, fixtures, shop.", "esports-crimson",
                      "#0a0607", "#170e10", "#f5eeef", "#a4898d", "#ff2d55", "#0a0607", "#2c1418"),
    _esports_pages("starter-esports-cobalt", "Esports Org — Cobalt Surge", "HUD-style esports org site — live badge, roster, fixtures, shop.", "esports-cobalt",
                      "#070a12", "#0f1424", "#eef1fb", "#8b93b8", "#3d7cff", "#05050a", "#1a2140"),
    _esports_pages("starter-esports-violet", "Esports Org — Violet Wave", "HUD-style esports org site — live badge, roster, fixtures, shop.", "esports-violet",
                      "#0a0710", "#16101f", "#f1eefb", "#978cb0", "#9d5cff", "#0a0710", "#251a38"),
    _esports_pages("starter-esports-gold", "Esports Org — Gold Standard", "HUD-style esports org site — live badge, roster, fixtures, shop.", "esports-gold",
                      "#0a0805", "#17130c", "#f5f1e8", "#a99c85", "#f2b705", "#0a0805", "#2c2414"),
    _esports_pages("starter-esports-ember", "Esports Org — Ember Orange", "HUD-style esports org site — live badge, roster, fixtures, shop.", "esports-ember",
                      "#0a0704", "#170f0a", "#f5efe8", "#a99485", "#ff6b1a", "#0a0704", "#2c2014"),
    _esports_pages("starter-esports-teal", "Esports Org — Teal Frequency", "HUD-style esports org site — live badge, roster, fixtures, shop.", "esports-teal",
                      "#06090a", "#0e1516", "#eef5f4", "#85a19d", "#14c9a6", "#05050a", "#152624"),
    _esports_pages("starter-esports-arctic", "Esports Org — Arctic White", "HUD-style esports org site, light mode — live badge, roster, fixtures, shop.", "esports-arctic",
                      "#f7f9fb", "#ffffff", "#0f172a", "#64748b", "#0ea5e9", "#ffffff", "#e2e8f0"),
    _esports_pages("starter-esports-emerald", "Esports Org — Emerald Line", "HUD-style esports org site — live badge, roster, fixtures, shop.", "esports-emerald",
                      "#060a07", "#0e1610", "#eef5ef", "#85a58f", "#22c55e", "#05050a", "#16261b"),
    _esports_pages("starter-esports-sky", "Esports Org — Sky Static", "HUD-style esports org site — live badge, roster, fixtures, shop.", "esports-sky",
                      "#06080d", "#0e1420", "#eef2fa", "#8891a8", "#38bdf8", "#05050a", "#182236"),
    _esports_pages("starter-esports-rose", "Esports Org — Rose Frag", "HUD-style esports org site — live badge, roster, fixtures, shop.", "esports-rose",
                      "#0a0709", "#170f13", "#f5eef1", "#a9899a", "#fb6f92", "#0a0709", "#2c1a22"),
    _esports_pages("starter-esports-mono", "Esports Org — Mono Ops", "HUD-style esports org site, monochrome — live badge, roster, fixtures, shop.", "esports-mono",
                      "#0a0a0c", "#141416", "#eceef0", "#8a8c90", "#e7e9ec", "#0a0a0c", "#242428"),
    _esports_pages("starter-esports-agnostic", "Esports Org — Color Agnostic", "HUD-style esports org site. Colors bind to whatever theme is applied.", "esports-agnostic",
                      "var(--fc-bg, #05050a)", "var(--fc-surface, #101018)", "var(--fc-text, #fff)", "var(--fc-muted, #6b7280)",
                      "var(--fc-accent, #22d3ee)", "#05050a", "var(--fc-border, #22222e)"),
]
