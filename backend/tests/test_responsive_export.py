"""Regression tests for the responsive-export fix. Pure-function tests —
no TestClient, no db — _project_to_html and _build_project_bundle take a
plain dict and return a string, no MongoDB involved."""
import os

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "webdojo_test")

import server


class TestResponsiveCss:
    def test_project_to_html_includes_responsive_css(self):
        doc = {"id": "proj-1", "name": "Test", "elements": [], "fonts": [], "pages": []}
        html = server._project_to_html(doc)
        assert "@media (max-width: 768px)" in html
        assert 'grid-template-columns: 1fr !important' in html
        assert "[data-wd-stack]" in html

    def test_build_project_bundle_includes_responsive_css(self):
        doc = {"id": "proj-2", "name": "Test", "elements": [], "fonts": []}
        html, _css = server._build_project_bundle(doc, "index.html", "styles.css")
        assert "@media (max-width: 768px)" in html
        assert 'grid-template-columns: 1fr !important' in html
        assert "[data-wd-stack]" in html

    def test_responsive_css_appears_before_head_close(self):
        # Sanity check on placement: the <style> block must land inside
        # <head>, not after it.
        doc = {"id": "proj-3", "name": "Test", "elements": [], "fonts": []}
        html = server._project_to_html(doc)
        head_close = html.index("</head>")
        css_pos = html.index("@media (max-width: 768px)")
        assert css_pos < head_close


class TestCleanExportGridResponsive:
    def test_strip_inline_styles_adds_responsive_override_for_grid(self):
        elements = [{"id": "el_abc123", "html": '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">content</div>'}]
        transformed, css = server._strip_inline_styles(elements)
        assert 'class="div-1"' in transformed
        assert ".div-1 { display:grid;grid-template-columns:repeat(3,1fr);gap:10px; }" in css
        assert "@media (max-width: 768px) { .div-1 { grid-template-columns: 1fr !important; } }" in css

    def test_strip_inline_styles_skips_override_for_non_grid_elements(self):
        elements = [{"id": "el_xyz789", "html": '<div style="color:red;padding:10px;">content</div>'}]
        transformed, css = server._strip_inline_styles(elements)
        assert ".div-1 { color:red;padding:10px; }" in css
        assert "@media" not in css

    def test_strip_inline_styles_suffixes_nested_style_attrs(self):
        elements = [{"id": "el_1", "html": '<section style="padding:20px;"><h1 style="color:blue;">Hi</h1><p style="margin:0;">Body</p></section>'}]
        transformed, css = server._strip_inline_styles(elements)
        assert 'class="section-1"' in transformed
        assert 'class="h1-1"' in transformed
        assert 'class="p-1"' in transformed
        assert ".section-1 { padding:20px; }" in css
        assert ".h1-1 { color:blue; }" in css
        assert ".p-1 { margin:0; }" in css

    def test_strip_inline_styles_keeps_a_running_per_tag_counter_across_elements(self):
        # Class assignment is a running counter keyed by tag name, scoped
        # to the whole export (not per-element/per-parent) — order matters,
        # unlike the old id-based naming this replaces.
        a = {"id": "el_a", "html": '<div style="color:red;">A</div>'}
        b = {"id": "el_b", "html": '<div style="color:blue;">B</div>'}
        html_ab, css_ab = server._strip_inline_styles([a, b])
        html_ba, css_ba = server._strip_inline_styles([b, a])
        assert 'class="div-1"' in html_ab and 'class="div-2"' in html_ab
        assert ".div-1 { color:red; }" in css_ab and ".div-2 { color:blue; }" in css_ab
        assert 'class="div-1"' in html_ba and 'class="div-2"' in html_ba
        assert ".div-1 { color:blue; }" in css_ba and ".div-2 { color:red; }" in css_ba

    def test_strip_inline_styles_handles_element_with_no_style_attr(self):
        elements = [{"id": "el_plain", "html": '<div>no style here</div>'}]
        transformed, css = server._strip_inline_styles(elements)
        assert transformed == '<div>no style here</div>'
        assert css == ""

    def test_strip_inline_styles_handles_attrs_before_and_after_style(self):
        elements = [{
            "id": "el_img",
            "html": '<img src="a.jpg" style="width:100%;" alt="" /><h2 data-aos="fade-up" style="font-size:36px;">Title</h2>',
        }]
        transformed, css = server._strip_inline_styles(elements)
        assert 'class="img-1"' in transformed
        assert 'class="h2-1"' in transformed
        assert ".img-1 { width:100%; }" in css
        assert ".h2-1 { font-size:36px; }" in css

    def test_strip_inline_styles_end_to_end_section_h2_p(self):
        elements = [{
            "id": "el_card",
            "html": '<section style="padding:64px;"><h2 style="font-size:32px;">Heading</h2><p style="margin:0;">Body</p></section>',
        }]
        transformed, css = server._strip_inline_styles(elements)
        assert '<section class="section-1">' in transformed
        assert '<h2 class="h2-1">' in transformed
        assert '<p class="p-1">' in transformed
        assert 'style="' not in transformed
        assert ".section-1 { padding:64px; }" in css
        assert ".h2-1 { font-size:32px; }" in css
        assert ".p-1 { margin:0; }" in css
