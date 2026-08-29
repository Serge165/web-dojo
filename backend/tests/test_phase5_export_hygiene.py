"""Phase 5 smoke-test remediation regressions (Issues #2, #3, #7).

Pure-function tests over _project_to_html / _build_multi_page_bundle —
no TestClient, no db. They pin the export hygiene contract:

  • <head> is boilerplate only: no project-id bootstrap <script>, no
    per-page canvas <style>, and the Theme editor's <style data-forge-vars>
    blocks are routed out of the head (into the consolidated preview style
    block for _project_to_html, into globals.css for the bundle).
  • Block markup carries classes, never inline style="…" attributes (the
    strip step hoists them into per-block class rules).
  • Pages are typed: <body data-wd-page-type="page|layout">, and each
    page's canvas background is a [data-wd-page] CSS variable in
    globals.css instead of a per-page <style> tag.
"""
import os

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "webdojo_test")

import server


def _head(html: str) -> str:
    return html.split("</head>")[0]


class TestHeadIsBoilerplate:
    def test_preview_head_has_no_project_id_script(self):
        doc = {"id": "proj-1", "name": "Test", "elements": [], "fonts": [], "pages": []}
        html = server._project_to_html(doc)
        assert "__WD_PROJECT_ID" not in _head(html)
        assert '<body data-wd-project="proj-1">' in html
        assert html.index("window.__WD_PROJECT_ID") > html.index("</head>")

    def test_preview_head_has_no_data_forge_vars_style(self):
        # The exact blob from the Phase 5 smoke test: SVG data-URI theme
        # variables inside <style data-forge-vars> in the head.
        head_html = (
            '<style data-forge-vars>\n:root {\n'
            '  --fc-el_mx3owqxt-bg: url("data:image/svg+xml,...") bottom / 100% 120px no-repeat;\n'
            "}\n</style>"
        )
        doc = {"id": "proj-2", "name": "Test", "elements": [], "fonts": [], "pages": [], "head_html": head_html}
        html = server._project_to_html(doc)
        head = _head(html)
        assert "data-forge-vars" not in head
        # The variables are not lost — they land in the consolidated preview
        # style block (the single-file equivalent of globals.css sections),
        # exactly once.
        assert "--fc-el_mx3owqxt-bg" in head
        assert head.count("--fc-el_mx3owqxt-bg") == 1

    def test_bundle_page_head_has_no_canvas_style_or_project_id(self):
        doc = {"id": "proj-3", "name": "Test", "elements": [], "fonts": [], "pages": []}
        files = server._build_multi_page_bundle(doc, "globals.css")
        html = files["index.html"]
        head = _head(html)
        assert "body{margin:0;background:" not in head
        assert "__WD_PROJECT_ID" not in head
        assert html.index("window.__WD_PROJECT_ID") > html.index("</head>")

    def test_bundle_routes_canvas_backgrounds_into_globals_css_vars(self):
        doc = {
            "id": "proj-4", "name": "Test", "fonts": [],
            "pages": [
                {"id": "p1", "name": "Home", "slug": "index", "canvas_bg": "#101418", "elements": []},
                {"id": "p2", "name": "About", "slug": "about", "canvas_bg": "#ffffff", "elements": []},
            ],
        }
        files = server._build_multi_page_bundle(doc, "globals.css")
        css = files["globals.css"]
        assert '[data-wd-page="index"] { --wd-canvas-bg: #101418; }' in css
        assert "body { margin: 0; background: var(--wd-canvas-bg, #ffffff); }" in css
        assert "body{margin:0;background:" not in files["index.html"]


class TestTypedPages:
    def test_pages_carry_page_type_by_default(self):
        doc = {
            "id": "proj-5", "name": "Test", "fonts": [],
            "pages": [{"id": "p1", "name": "Home", "slug": "index", "elements": []}],
        }
        files = server._build_multi_page_bundle(doc, "globals.css")
        assert 'data-wd-page="index" data-wd-page-type="page"' in files["index.html"]

    def test_layout_typed_pages_are_marked_in_the_export(self):
        doc = {
            "id": "proj-6", "name": "Test", "fonts": [],
            "pages": [
                {"id": "p1", "name": "Home", "slug": "index", "elements": []},
                {"id": "p2", "name": "Mega Nav", "slug": "mega-nav", "type": "layout", "elements": []},
            ],
        }
        files = server._build_multi_page_bundle(doc, "globals.css")
        assert 'data-wd-page-type="page"' in files["index.html"]
        assert 'data-wd-page-type="layout"' in files["mega-nav.html"]


class TestNoInlineStyleAttributes:
    def test_preview_strips_inline_styles_from_block_markup(self):
        html = (
            '<nav data-wd-cat="navbars" data-wd-block="nav-mega" '
            'style="font-family:Manrope,system-ui,sans-serif;background:var(--fc-bg, #fff1f1);'
            'border-bottom:1px solid var(--fc-border, #e2e8e0);">content</nav>'
        )
        doc = {"id": "proj-7", "name": "Test", "fonts": [], "elements": [{"id": "e1", "html": html}], "pages": []}
        out = server._project_to_html(doc)
        assert 'style="font-family:Manrope' not in out
        assert 'class="block block-navbars-mega-1' in out

    def test_bundle_strips_inline_styles_and_keeps_the_css(self):
        html = '<section data-wd-cat="heroes" data-wd-block="hero-centered" style="padding:64px;">H</section>'
        doc = {
            "id": "proj-8", "name": "Test", "fonts": [],
            "pages": [{"id": "p1", "name": "Home", "slug": "index", "elements": [{"id": "e1", "html": html}]}],
        }
        files = server._build_multi_page_bundle(doc, "globals.css")
        assert 'style="padding:64px' not in files["index.html"]
        # Per-page rules carry the page-name prefix; the shared unprefixed
        # marker "block-heroes-centered" is the override hook.
        assert ".index-block-heroes-centered-1 { padding:64px; }" in files["globals.css"]