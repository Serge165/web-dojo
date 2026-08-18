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
