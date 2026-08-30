"""Backend parity regression: the 117 author-time-classed library blocks
(block-<catId>-<slug>-<occ> markup, no inline style="...") must ship with
matching CSS in both export paths. Before this fix, _strip_inline_styles
found no inline styles left to extract on a converted block, so
component_css came back empty and the block rendered unstyled — see
block_styles_generated.py (the Python mirror of
frontend/src/lib/blockStyles.generated.js) and its wiring in
_project_to_html / _build_multi_page_bundle / _build_organized_stylesheet.

Pure-function tests — no TestClient, no db."""
import os

os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("DB_NAME", "webdojo_test")

import server
from block_styles_generated import BLOCK_STYLES_BY_CATEGORY, BLOCK_STYLES_MEDIA_CSS

# A real converted block (hero-centered, frontend/src/lib/blocks.js) already
# carrying its author-time classes — no style="..." left for
# _strip_inline_styles to extract.
_HERO_HTML = (
    '<section class="block block-heroes-centered-1 block-heroes-centered">'
    '<div class="block block-heroes-centered-2 block-heroes-centered">Hi</div>'
    '</section>'
)


def _doc():
    return {
        "id": "proj-1", "name": "Test", "canvas_bg": "#ffffff",
        "elements": [{"id": "el1", "html": _HERO_HTML}],
    }


class TestPreviewPathShipsStaticBlockCss:
    def test_project_to_html_has_matching_css_for_converted_block(self):
        html = server._project_to_html(_doc())
        assert "block-heroes-centered-1" in html  # markup carries the class
        assert ".block-heroes-centered-1 {" in html  # and a matching rule


class TestBundlePathShipsStaticBlockCssPerCategory:
    def test_globals_css_has_blocks_heroes_section_with_matching_css(self):
        files = server._build_multi_page_bundle(_doc())
        css = files["globals.css"]
        assert "/* ===== Blocks: Heroes ===== */" in css
        assert ".block-heroes-centered-1 {" in css

    def test_globals_css_includes_block_styles_media_css(self):
        files = server._build_multi_page_bundle(_doc())
        css = files["globals.css"]
        # BLOCK_STYLES_MEDIA_CSS is non-empty (117 blocks include
        # grid-template-columns rules) and must land in Media Queries.
        assert BLOCK_STYLES_MEDIA_CSS.strip()
        first_rule = BLOCK_STYLES_MEDIA_CSS.strip().splitlines()[0]
        assert first_rule in css

    def test_untouched_category_still_gets_its_static_css_bucketed(self):
        # A page with no footer blocks at all should still ship the static
        # "Blocks: Footers" CSS if any footer category has generated rules —
        # i.e. bucketing isn't gated on that category appearing on the page.
        css = BLOCK_STYLES_BY_CATEGORY.get("footers", "")
        assert css.strip(), "expected footers category to have generated CSS"
        files = server._build_multi_page_bundle(_doc())
        assert "/* ===== Blocks: Footers ===== */" in files["globals.css"]
        first_rule = css.strip().splitlines()[0]
        assert first_rule in files["globals.css"]


class TestBackgroundImageVarWrapping:
    def test_parallax_hero_fullbleed_background_uses_block_bg_image_var(self):
        css = BLOCK_STYLES_BY_CATEGORY["parallax"]
        assert "var(--block-bg-image, url(" in css
        # the scrim gradient layer must still be present alongside the var
        assert "linear-gradient(rgba(10,15,20,.55),rgba(10,15,20,.55))" in css


def demo():
    """Runnable self-check (also exercised by pytest above)."""
    html = server._project_to_html(_doc())
    assert ".block-heroes-centered-1 {" in html
    files = server._build_multi_page_bundle(_doc())
    assert "/* ===== Blocks: Heroes ===== */" in files["globals.css"]
    print("ok")


if __name__ == "__main__":
    demo()
