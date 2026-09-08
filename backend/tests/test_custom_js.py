"""Regression tests for the custom_js page field: Pydantic default, and
injection into both HTML-assembly functions. Pure-function tests — no
TestClient, no db, same pattern as test_responsive_export.py."""
import os

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "webdojo_test")

import server


class TestCustomJsModel:
    def test_project_defaults_custom_js_to_empty_string(self):
        p = server.Project(name="Test")
        assert p.custom_js == ""

    def test_project_create_defaults_custom_js_to_empty_string(self):
        p = server.ProjectCreate(name="Test")
        assert p.custom_js == ""

    def test_project_update_custom_js_defaults_to_none(self):
        p = server.ProjectUpdate()
        assert p.custom_js is None


class TestCustomJsInjection:
    def test_project_to_html_injects_custom_js_before_body_close(self):
        doc = {"id": "p1", "name": "Test", "elements": [], "fonts": [], "pages": [], "custom_js": "console.log('hi');"}
        html = server._project_to_html(doc)
        assert "console.log('hi');" in html
        assert html.index("console.log") < html.index("</body>")

    def test_project_to_html_omits_script_tag_when_custom_js_empty(self):
        doc = {"id": "p2", "name": "Test", "elements": [], "fonts": [], "pages": []}
        html = server._project_to_html(doc)
        assert "<script></script>" not in html

    def test_project_to_html_prefers_page_custom_js_over_doc_level(self):
        page = {"id": "pg1", "elements": [], "fonts": [], "custom_js": "page level"}
        doc = {"id": "p3", "name": "Test", "pages": [page], "active_page_id": "pg1", "custom_js": "doc level"}
        html = server._project_to_html(doc)
        assert "page level" in html
        assert "doc level" not in html

    def test_project_to_html_escapes_embedded_script_close_tag(self):
        doc = {"id": "p4", "name": "Test", "elements": [], "fonts": [], "pages": [], "custom_js": "var x = '</script>';"}
        html = server._project_to_html(doc)
        assert "</script>';" not in html
        assert "<\\/script>';" in html

    def test_build_project_bundle_injects_custom_js_before_body_close(self):
        doc = {"id": "p5", "name": "Test", "elements": [], "fonts": [], "custom_js": "alert(1)"}
        html, _css = server._build_project_bundle(doc, "index.html", "styles.css")
        assert "alert(1)" in html
        assert html.index("alert(1)") < html.index("</body>")

    def test_build_project_bundle_omits_script_tag_when_custom_js_empty(self):
        doc = {"id": "p6", "name": "Test", "elements": [], "fonts": []}
        html, _css = server._build_project_bundle(doc, "index.html", "styles.css")
        assert "<script></script>" not in html
