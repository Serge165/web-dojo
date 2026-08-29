"""Phase 6 Task 5: parser round-trip validation for the starter templates
(the server-side "load a template array in, parse it back out" check —
mirrors frontend/src/lib/pageLayoutsExport.test.js). For every starter
template the export pipeline must lose nothing: every tag survives the
inline-style strip, every inline CSS declaration lands in globals.css,
heads stay boilerplate, fonts link, and pages are typed.

Pure-function tests — no TestClient, no db (same convention as
test_responsive_export.py)."""
import os

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "webdojo_test")

import re

import pytest
from starter_templates import STARTER_TEMPLATES

import server

DECL_RE = re.compile(r'style="([^"]*)"')
TAG_RE = re.compile(r"<([a-zA-Z][a-zA-Z0-9-]*)")


def _pages_of(tpl):
    data = tpl.get("data") or {}
    pages = data.get("pages")
    if pages:
        return pages
    return [{
        "id": f"{tpl['id']}-home", "name": "Home", "slug": "index", "type": "page",
        "elements": data.get("elements") or [], "head_html": data.get("head_html") or "",
        "canvas_bg": data.get("canvas_bg") or "#ffffff", "fonts": data.get("fonts") or [],
    }]


def _tag_counts(html):
    counts = {}
    for m in TAG_RE.finditer(html):
        tag = m.group(1).lower()
        counts[tag] = counts.get(tag, 0) + 1
    return counts


def _decls_of(html):
    out = []
    for m in DECL_RE.finditer(html):
        for d in m.group(1).split(";"):
            d = d.strip()
            if d:
                out.append(d)
        return out


_SCRIPT_BLOCK_RE = re.compile(r"<script\b[^>]*>[\s\S]*?</script>", re.IGNORECASE)


def _without_scripts(html):
    """Removes complete <script>…</script> blocks so the inline-style round-trip
    assertions only inspect *real markup*. Form-widget / embedded-player JS
    legitimately carries `style="..."` inside string literals (code, not markup);
    _strip_inline_styles preserves those verbatim (mirrors frontend
    protectScriptPayloads), so the assertions must ignore script segments."""
    return _SCRIPT_BLOCK_RE.sub("", html or "")


@pytest.mark.parametrize("tpl", STARTER_TEMPLATES, ids=lambda t: t["id"])
class TestStarterTemplateRoundTrip:
    def test_inline_styles_fully_stripped_and_declarations_preserved(self, tpl):
        for page in _pages_of(tpl):
            original = "\n".join(e.get("html", "") for e in (page.get("elements") or []))
            if 'style="' not in original:
                continue
            transformed, component_css, _media = server._strip_inline_styles(
                [{"id": e.get("id"), "html": e.get("html", "")} for e in page["elements"]],
                prefix=f"{page.get('slug', 'index')}-",
            )
            # Only real-markup style= attributes are stripped & hoisted into the
            # CSS; script payloads (form-widget style="..." in JS strings) are
            # preserved verbatim per the Phase 6 spec.
            markup_original = _without_scripts(original)
            markup_transformed = _without_scripts(transformed)
            assert 'style="' not in markup_transformed, f"{tpl['id']}: inline styles leaked into markup"
            for decl in _decls_of(markup_original):
                assert decl in component_css, f"declaration lost: {decl!r}"

    def test_tag_structure_preserved_through_the_strip(self, tpl):
        for page in _pages_of(tpl):
            original = "\n".join(e.get("html", "") for e in (page.get("elements") or []))
            transformed, _component_css, _media = server._strip_inline_styles(
                [{"id": e.get("id"), "html": e.get("html", "")} for e in page["elements"]]
            )
            assert _tag_counts(transformed) == _tag_counts(original)

    def test_bundle_output_heads_are_boilerplate_and_css_is_organized(self, tpl):
        doc = {
            "id": tpl["id"], "name": tpl["name"],
            "fonts": (tpl.get("data") or {}).get("fonts") or [],
            "pages": _pages_of(tpl),
        }
        files = server._build_multi_page_bundle(doc, "globals.css")
        css = files["globals.css"]
        assert "/* ===== Theme Variables ===== */" in css
        assert "/* ===== Media Queries ===== */" in css
        assert "[data-wd-stack]" in css
        for name, content in files.items():
            if not name.endswith(".html"):
                continue
            head = content[: content.index("</head>")]
            body = content[content.index("<body"): content.index("</body>")]
            assert "<style" not in head, f"{name}: non-boilerplate head"
            assert 'style="' not in body, f"{name}: inline styles leaked"
            assert 'name="viewport"' in head
            project_id_pos = content.index("window.__WD_PROJECT_ID")
            assert project_id_pos > content.index("</head>")
            page_type = re.search(r'data-wd-page-type="(\w+)"', content)
            assert page_type and page_type.group(1) in {"page", "layout"}
        fonts = doc["fonts"]
        if fonts:
            first_html = next(n for n in files if n.endswith(".html"))
            assert "fonts.googleapis.com" in files[first_html]

    def test_font_link_generated_for_every_font_family(self, tpl):
        fonts = (tpl.get("data") or {}).get("fonts") or []
        if not fonts:
            return
        link = server._build_google_fonts_link(fonts)
        assert link and "fonts.googleapis.com/css2" in link
