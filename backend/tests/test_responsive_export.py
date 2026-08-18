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
        assert 'class="el-el_abc123"' in transformed
        assert ".el-el_abc123 { display:grid;grid-template-columns:repeat(3,1fr);gap:10px; }" in css
        assert "@media (max-width: 768px) { .el-el_abc123 { grid-template-columns: 1fr !important; } }" in css

    def test_strip_inline_styles_skips_override_for_non_grid_elements(self):
        elements = [{"id": "el_xyz789", "html": '<div style="color:red;padding:10px;">content</div>'}]
        transformed, css = server._strip_inline_styles(elements)
        assert ".el-el_xyz789 { color:red;padding:10px; }" in css
        assert "@media" not in css

    def test_strip_inline_styles_suffixes_nested_style_attrs(self):
        elements = [{"id": "el_1", "html": '<section style="padding:20px;"><h1 style="color:blue;">Hi</h1><p style="margin:0;">Body</p></section>'}]
        transformed, css = server._strip_inline_styles(elements)
        assert 'class="el-el_1"' in transformed
        assert 'class="el-el_1__1"' in transformed
        assert 'class="el-el_1__2"' in transformed
        assert ".el-el_1 { padding:20px; }" in css
        assert ".el-el_1__1 { color:blue; }" in css
        assert ".el-el_1__2 { margin:0; }" in css

    def test_strip_inline_styles_keeps_ids_stable_across_reordering(self):
        a = {"id": "el_a", "html": '<div style="color:red;">A</div>'}
        b = {"id": "el_b", "html": '<div style="color:blue;">B</div>'}
        html_ab, _css_ab = server._strip_inline_styles([a, b])
        html_ba, _css_ba = server._strip_inline_styles([b, a])
        assert 'class="el-el_a"' in html_ab and 'class="el-el_a"' in html_ba
        assert 'class="el-el_b"' in html_ab and 'class="el-el_b"' in html_ba

    def test_strip_inline_styles_handles_element_with_no_style_attr(self):
        elements = [{"id": "el_plain", "html": '<div>no style here</div>'}]
        transformed, css = server._strip_inline_styles(elements)
        assert transformed == '<div>no style here</div>'
        assert css == ""
