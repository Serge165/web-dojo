"""Quality-assurance pipeline for Web Dojo starter templates (Task 4.1).

Implements the 5-step validation process described in the modernization spec
against backend/starter_templates.py:

  1. Syntax validation   -- ast.parse() of the whole file
  2. Page count / slugs  -- every template has >=1 page, unique slugs, an index
  3. Internal-link check -- every href="*.html" resolves to a real slug
  4. Tag-balance check   -- open/close counts match per element per page
  5. Structure / graph   -- picker metadata sane + cross-page link graph connected

Run with:
    cd backend && python3 -m pytest tests/test_template_validate.py -q

The 5th step's browser side (real navigation) is covered by
frontend/playwright.config.js; this file covers everything verifiable in CI.
"""
from __future__ import annotations

import ast
import os
import re
import sys
from html.parser import HTMLParser
from typing import Dict, List, Set

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(BACKEND_DIR, os.pardir, "starter_templates.py")


def _source() -> str:
    with open(SRC, "r", encoding="utf-8") as fh:
        return fh.read()


def _tpls() -> List[Dict]:
    sys.path.insert(0, BACKEND_DIR)
    from starter_templates import STARTER_TEMPLATES  # type: ignore
    return STARTER_TEMPLATES


# ---- Step 1: syntax validation --------------------------------------------
def test_step1_source_parses_as_valid_python():
    ast.parse(_source())


def test_step1_bundle_is_exported():
    tree = ast.parse(_source())
    exported = False
    for node in tree.body:
        targets = []
        if isinstance(node, (ast.Assign, ast.AnnAssign)):
            target = node.targets[0] if isinstance(node, ast.Assign) else node.target
            if isinstance(target, ast.Name):
                targets = [target.id]
        if "STARTER_TEMPLATES" in targets:
            exported = True
    assert exported, "STARTER_TEMPLATES is not exported"


# ---- Step 2: page count / slugs ---------------------------------------------
def test_every_template_has_pages_and_unique_slugs():
    for tpl in _tpls():
        pages = (tpl.get("data") or {}).get("pages") or []
        assert pages, f"{tpl['id']} has no pages"
        slugs = [p.get("slug") for p in pages]
        msg = f"{tpl['id']} has duplicate slugs: {slugs}"
        assert len(slugs) == len(set(slugs)), msg


def test_every_template_has_an_index_landing_page():
    for tpl in _tpls():
        pages = (tpl.get("data") or {}).get("pages") or []
        landing = {p.get("slug") for p in pages} & {"index", "index.html", "home"}
        assert landing, f"{tpl['id']} lacks an index/home landing page"


def test_sanity_of_picker_metadata():
    for tpl in _tpls():
        assert tpl.get("name"), f"missing name in {tpl.get('id')}"
        assert tpl.get("description"), f"missing description in {tpl.get('id')}"
        assert tpl.get("aesthetic"), f"missing aesthetic in {tpl.get('id')}"
        assert tpl.get("is_starter") is True


# ---- Step 3: internal-link check ----------------------------------------------
_HREF_RE = re.compile(r'href\s*=\s*"([^"]+)"')
_SKIP_PREFIXES = ("http://", "https://", "//", "mailto:", "tel:", "javascript:", "data:")


def _internal_html_links(html: str) -> List[str]:
    """Bare '*.html' targets from href attributes; ignores anchors/external."""
    out = set()
    for href in _HREF_RE.findall(html):
        href = href.strip()
        if not href or href.startswith("#"):
            continue
        if any(href.startswith(p) for p in _SKIP_PREFIXES):
            continue
        bare = href.split("#", 1)[0].strip()
        if bare.endswith(".html"):
            out.add(bare)
    return sorted(out)


def _valid_filenames(tpl: Dict) -> Set[str]:
    out = set()
    for p in (tpl.get("data") or {}).get("pages") or []:
        slug = p.get("slug") or ""
        out.add(slug if slug.endswith(".html") else f"{slug}.html")
    return out


def test_all_internal_html_links_resolve_to_template_slugs():
    failures = []
    for tpl in _tpls():
        valid = _valid_filenames(tpl)
        for p in (tpl.get("data") or {}).get("pages") or []:
            html = "".join((el.get("html") or "") for el in p.get("elements") or [])
            for target in _internal_html_links(html):
                if target not in valid:
                    failures.append(f"{tpl['id']} ({p.get('slug')}) -> {target}")
    assert failures == [], "Broken internal links:\n" + "\n".join(sorted(set(failures))[:60])
# ---- Step 4: tag-balance check ---------------------------------------------------
_VOID_TAGS = {"area", "base", "br", "col", "embed", "hr", "img", "input",
              "link", "meta", "param", "source", "track", "wbr"}
_RAW_BLOCKS = re.compile(r"<script\b[^>]*>.*?</script>|<style\b[^>]*>.*?</style>",
                         re.IGNORECASE | re.DOTALL)


def _strip_raw_blocks(html: str) -> str:
    """Remove <script>/<style> bodies so their JS/CSS (which contains `<>`)
    can't be misread as markup."""
    return _RAW_BLOCKS.sub(" ", html)


def _check_tag_balance(html: str) -> List[str]:
    """Count open vs close for each element (void + self-closing tags need no
    close) and return a list of messages for any mismatch."""
    body = _strip_raw_blocks(html)
    starts: Dict[str, int] = {}
    self_closed: Dict[str, int] = {}
    closes: Dict[str, int] = {}

    def bump(d: Dict[str, int], k: str):
        d[k] = d.get(k, 0) + 1

    for m in re.finditer(r"<\s*([a-zA-Z][a-zA-Z0-9-]*)\b([^>]*)>", body):
        name = m.group(1).lower()
        tail = m.group(2) or ""
        if name in _VOID_TAGS:
            continue
        if tail.rstrip().endswith("/"):
            bump(self_closed, name)
        else:
            bump(starts, name)
    for m in re.finditer(r"</\s*([a-zA-Z][a-zA-Z0-9-]*)\s*>", body):
        bump(closes, m.group(1).lower())

    problems = []
    allnames = set(starts) | set(self_closed) | set(closes)
    for name in sorted(allnames):
        opens_needing_close = starts.get(name, 0)  # non-self-closing opens
        close_count = closes.get(name, 0)
        if opens_needing_close == close_count:
            continue
        problems.append(
            f"<{name}>: {opens_needing_close} open vs {close_count} close"
            f" (self-closed: {self_closed.get(name, 0)})"
        )
    return problems


def test_tag_balance_per_page():
    problems = []
    for tpl in _tpls():
        for p in (tpl.get("data") or {}).get("pages") or []:
            html = "".join((el.get("html") or "") for el in p.get("elements") or [])
            for err in _check_tag_balance(html):
                problems.append(f"{tpl['id']} :: {p.get('slug')} :: {err}")
    assert problems == [], "Tag imbalance found:\n" + "\n".join(problems[:80])


# ---- Step 5: link-graph connectedness -----------------------------------------
def test_all_pages_reachable_from_index():
    from collections import deque

    orphans = []
    for tpl in _tpls():
        pages = (tpl.get("data") or {}).get("pages") or []
        valid = _valid_filenames(tpl)
        adj = {}
        for p in pages:
            html = "".join((el.get("html") or "") for el in p.get("elements") or [])
            slug = p.get("slug") or ""
            fname = slug if slug.endswith(".html") else f"{slug}.html"
            adj[fname] = set(_internal_html_links(html))

        start = "index.html"
        if start not in adj and "home.html" in adj:
            start = "home.html"

        reach, dq = set(), deque([start])
        while dq:
            cur = dq.popleft()
            if cur in reach:
                continue
            reach.add(cur)
            for nxt in adj.get(cur, ()):
                if nxt in adj and nxt not in reach:
                    dq.append(nxt)

        missing = valid - reach
        if missing:
            orphans.append(f"{tpl['id']}: unreachable from index: {sorted(missing)}")
    assert orphans == [], "Unreachable pages:\n" + "\n".join(orphans[:40])

