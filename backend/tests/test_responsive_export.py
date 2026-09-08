"""Regression tests for the responsive-export fix. Pure-function tests —
no TestClient, no db — _project_to_html and _build_project_bundle take a
plain dict and return a string, no MongoDB involved."""
import os

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "webdojo_test")

import server


class TestResponsiveCss:
    def test_project_to_html_includes_responsive_css(self):
        # Two tiers now (tablet <=1024px, mobile <=767px), each emitted as
        # both @media and @container — see RESPONSIVE_CSS's own comment.
        doc = {"id": "proj-1", "name": "Test", "elements": [], "fonts": [], "pages": []}
        html = server._project_to_html(doc)
        assert "@media (max-width: 1024px)" in html
        assert "@media (max-width: 767px)" in html
        assert "@container (max-width: 1024px)" in html
        assert "@container (max-width: 767px)" in html
        assert 'grid-template-columns: 1fr !important' in html
        assert "[data-wd-stack]" in html

    def test_build_multi_page_bundle_routes_responsive_css_into_globals_css(self):
        # The multi-page/publish path no longer duplicates RESPONSIVE_CSS as
        # a per-page <head> <style> tag — it's folded into globals.css's
        # Media Queries section instead (see _build_organized_stylesheet).
        doc = {"id": "proj-2", "name": "Test", "elements": [], "fonts": [], "pages": []}
        files = server._build_multi_page_bundle(doc, "globals.css")
        css = files["globals.css"]
        assert "/* ===== Media Queries ===== */" in css
        assert "@media (max-width: 1024px)" in css
        assert "@media (max-width: 767px)" in css
        assert 'grid-template-columns: 1fr !important' in css
        assert "[data-wd-stack]" in css
        assert "@media" not in files["index.html"]

    def test_responsive_css_appears_before_head_close(self):
        # Sanity check on placement: the <style> block must land inside
        # <head>, not after it.
        doc = {"id": "proj-3", "name": "Test", "elements": [], "fonts": []}
        html = server._project_to_html(doc)
        head_close = html.index("</head>")
        css_pos = html.index("@media (max-width: 1024px)")
        assert css_pos < head_close


class TestCleanExportGridResponsive:
    def test_strip_inline_styles_adds_responsive_override_for_grid(self):
        elements = [{"id": "el_abc123", "html": '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">content</div>'}]
        transformed, component_css, media_css = server._strip_inline_styles(elements)
        assert 'class="div-1"' in transformed
        assert ".div-1 { display:grid;grid-template-columns:repeat(3,1fr);gap:10px; }" in component_css
        assert "@media (max-width: 1024px) { .div-1 { grid-template-columns: 1fr !important; } }" in media_css
        assert "@media (max-width: 767px) { .div-1 { grid-template-columns: 1fr !important; } }" in media_css

    def test_strip_inline_styles_skips_override_for_non_grid_elements(self):
        elements = [{"id": "el_xyz789", "html": '<div style="color:red;padding:10px;">content</div>'}]
        transformed, component_css, media_css = server._strip_inline_styles(elements)
        assert ".div-1 { color:red;padding:10px; }" in component_css
        assert media_css == ""

    def test_strip_inline_styles_suffixes_nested_style_attrs(self):
        elements = [{"id": "el_1", "html": '<section style="padding:20px;"><h1 style="color:blue;">Hi</h1><p style="margin:0;">Body</p></section>'}]
        transformed, component_css, _media_css = server._strip_inline_styles(elements)
        assert 'class="section-1"' in transformed
        assert 'class="h1-1"' in transformed
        assert 'class="p-1"' in transformed
        assert ".section-1 { padding:20px; }" in component_css
        assert ".h1-1 { color:blue; }" in component_css
        assert ".p-1 { margin:0; }" in component_css

    def test_strip_inline_styles_keeps_a_running_per_tag_counter_across_elements(self):
        # Class assignment is a running counter keyed by tag name, scoped
        # to the whole export (not per-element/per-parent) — order matters,
        # unlike the old id-based naming this replaces.
        a = {"id": "el_a", "html": '<div style="color:red;">A</div>'}
        b = {"id": "el_b", "html": '<div style="color:blue;">B</div>'}
        html_ab, css_ab, _media_ab = server._strip_inline_styles([a, b])
        html_ba, css_ba, _media_ba = server._strip_inline_styles([b, a])
        assert 'class="div-1"' in html_ab and 'class="div-2"' in html_ab
        assert ".div-1 { color:red; }" in css_ab and ".div-2 { color:blue; }" in css_ab
        assert 'class="div-1"' in html_ba and 'class="div-2"' in html_ba
        assert ".div-1 { color:blue; }" in css_ba and ".div-2 { color:red; }" in css_ba

    def test_strip_inline_styles_handles_element_with_no_style_attr(self):
        elements = [{"id": "el_plain", "html": '<div>no style here</div>'}]
        transformed, component_css, media_css = server._strip_inline_styles(elements)
        assert transformed == '<div>no style here</div>'
        assert component_css == ""
        assert media_css == ""

    def test_strip_inline_styles_handles_attrs_before_and_after_style(self):
        elements = [{
            "id": "el_img",
            "html": '<img src="a.jpg" style="width:100%;" alt="" /><h2 data-aos="fade-up" style="font-size:36px;">Title</h2>',
        }]
        transformed, component_css, _media_css = server._strip_inline_styles(elements)
        assert 'class="img-1"' in transformed
        assert 'class="h2-1"' in transformed
        assert ".img-1 { width:100%; }" in component_css
        assert ".h2-1 { font-size:36px; }" in component_css

    def test_strip_inline_styles_end_to_end_section_h2_p(self):
        elements = [{
            "id": "el_card",
            "html": '<section style="padding:64px;"><h2 style="font-size:32px;">Heading</h2><p style="margin:0;">Body</p></section>',
        }]
        transformed, component_css, _media_css = server._strip_inline_styles(elements)
        assert '<section class="section-1">' in transformed
        assert '<h2 class="h2-1">' in transformed
        assert '<p class="p-1">' in transformed
        assert 'style="' not in transformed
        assert ".section-1 { padding:64px; }" in component_css
        assert ".h2-1 { font-size:32px; }" in component_css
        assert ".p-1 { margin:0; }" in component_css

    # ===== Phase 4a: semantic block-<cat>-<slug> classes for data-wd-* blocks =====

    def test_strip_inline_styles_emits_semantic_classes_for_data_wd_block(self):
        # An element stamped with data-wd-cat/data-wd-block (as the frontend's
        # variants.js::stampVariant does) gets semantic block-<cat>-<slug>-<occ>
        # classes plus a shared unprefixed marker, mirroring the frontend.
        elements = [{
            "id": "el_hero",
            "html": '<section data-wd-cat="heroes" data-wd-block="hero-centered" style="padding:64px;"><h2 style="color:#111;">T</h2></section>',
        }]
        transformed, component_css, _media_css = server._strip_inline_styles(elements)
        assert 'class="block block-heroes-centered-1 block-heroes-centered"' in transformed
        assert 'class="block block-heroes-centered-2 block-heroes-centered"' in transformed
        assert ".block-heroes-centered-1 { padding:64px; }" in component_css
        assert ".block-heroes-centered-2 { color:#111; }" in component_css
        # No rule for the bare marker — it's an override hook only.
        assert ".block-heroes-centered {" not in component_css

    def test_strip_inline_styles_semantic_strips_category_prefix_for_slug(self):
        elements = [{"id": "el_nav", "html": '<nav data-wd-cat="navbars" data-wd-block="nav-mega" style="padding:8px;">N</nav>'}]
        transformed, component_css, _media_css = server._strip_inline_styles(elements)
        assert 'class="block block-navbars-mega-1 block-navbars-mega"' in transformed
        assert ".block-navbars-mega-1 { padding:8px; }" in component_css

    def test_strip_inline_styles_semantic_prefixes_suffixed_class_keeps_marker_unprefixed(self):
        elements = [{"id": "el_h", "html": '<section data-wd-cat="heroes" data-wd-block="hero-centered" style="padding:64px;">H</section>'}]
        transformed, component_css, _media_css = server._strip_inline_styles(elements, "about-")
        assert 'class="block about-block-heroes-centered-1 block-heroes-centered"' in transformed
        assert ".about-block-heroes-centered-1 { padding:64px; }" in component_css
        # Marker stays unprefixed.
        assert ' block-heroes-centered"' in transformed
        assert 'about-block-heroes-centered"' not in transformed

    def test_strip_inline_styles_semantic_grid_responsive_targets_suffixed_class(self):
        elements = [{"id": "el_b", "html": '<div data-wd-cat="layout" data-wd-block="layout-bento" style="display:grid;grid-template-columns:repeat(3,1fr);">B</div>'}]
        _t, _c, media_css = server._strip_inline_styles(elements)
        assert "@media (max-width: 1024px) { .block-layout-bento-1 { grid-template-columns: 1fr !important; } }" in media_css
        assert "@media (max-width: 767px) { .block-layout-bento-1 { grid-template-columns: 1fr !important; } }" in media_css

