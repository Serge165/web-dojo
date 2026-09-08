"""Framework export transforms (Phase 9C) — Python side of the Astro /
Next.js exporters.

The JS exporters in frontend/src/lib/exporters/ produce these same file
trees in the browser for zip downloads. This module applies the identical
transforms to the backend's multi-page bundle (`_build_multi_page_bundle`)
so FTP/SFTP publishing can ship framework projects too, keeping the
repo's JS<->Python export mirror convention.

Input: the files map from _build_multi_page_bundle (index.html/<slug>.html,
globals.css, js/*.js, imgs/.keep, fonts/.keep).
"""

import json
import re

_ASTRO_VERSION = "^4.16.18"
_NEXT_VERSION = "^15.1.6"
_REACT_VERSION = "^19.0.0"


def _pkg_name(name):
    slug = re.sub(r"[^a-z0-9]+", "-", str(name or "").lower()).strip("-")
    return slug or "web-dojo-site"


def _json(v):
    return json.dumps(v, ensure_ascii=False, indent=2)


def _body_and_head(html):
    body_m = re.search(r"<body([^>]*)>([\s\S]*)</body>", html, re.IGNORECASE)
    head_m = re.search(r"<head>([\s\S]*)</head>", html, re.IGNORECASE)
    return (
        body_m.group(1) if body_m else "",
        body_m.group(2) if body_m else "",
        head_m.group(1) if head_m else "",
    )


def _rewrite_asset_paths(fragment):
    return (
        fragment.replace('href="globals.css"', 'href="/globals.css"')
        .replace('src="js/', 'src="/js/')
    )


def apply_astro_transform(files, project_name):
    """Astro: pages keep their full HTML (Astro pages are HTML supersets);
    shared assets move to public/; bare <script> tags are marked is:inline
    so Astro's bundler leaves the runtime snippets verbatim."""
    out = {}
    for name, content in files.items():
        if not name.endswith(".html"):
            out[f"public/{name}"] = content
            continue
        slug = name[:-5]
        attrs, body, head = _body_and_head(content)
        head = _rewrite_asset_paths(head).replace("<script>", '<script is:inline>')
        body = _rewrite_asset_paths(body).replace("<script>", '<script is:inline>')
        route = "" if slug == "index" else slug
        out[f"src/pages/{slug}.astro"] = (
            f"---\n"
            f"// Web Dojo export — route /{route}\n"
            f"---\n"
            f"<!doctype html>\n<html lang=\"en\">\n<head>{head}</head>\n"
            f"<body{attrs}>\n{body}\n</body>\n</html>\n"
        )
    out["package.json"] = _json({
        "name": _pkg_name(project_name),
        "type": "module",
        "version": "1.0.0",
        "private": True,
        "scripts": {"dev": "astro dev", "build": "astro build", "preview": "astro preview"},
        "dependencies": {"astro": _ASTRO_VERSION},
    }) + "\n"
    out["astro.config.mjs"] = (
        'import { defineConfig } from "astro/config";\n\n'
        '// Static output: "npm run build" produces ./dist ready for FTP upload.\n'
        "export default defineConfig({});\n"
    )
    out["tsconfig.json"] = _json({"extends": "astro/tsconfigs/base"}) + "\n"
    out[".gitignore"] = "node_modules/\ndist/\n.astro/\n"
    return out

def _parse_attrs(tag):
    return dict(re.findall(r'([a-zA-Z-]+)="([^"]*)"', tag))


def _jsx_attr(k):
    return {"charset": "charSet", "http-equiv": "httpEquiv"}.get(k, k)


_JSX_META_LINK_RE = re.compile(r"<(?:meta|link)\b[^>]*>", re.IGNORECASE)
_LD_JSON_RE = re.compile(r'<script type="application/ld\+json">([\s\S]*?)</script>', re.IGNORECASE)
_TITLE_RE = re.compile(r"<title>([\s\S]*?)</title>", re.IGNORECASE)
_WD_BOOTSTRAP_RE = re.compile(
    r"<script>window\.__WD_PROJECT_ID=[\s\S]*?</script>\s*", re.IGNORECASE
)


def _head_jsx(head):
    """Convert <meta>/<link> tags into real JSX props (React 19 hoists them
    into <head>) and extract the JSON-LD blob into a renderable constant."""
    lines = []
    for m in _JSX_META_LINK_RE.finditer(head):
        attrs = _parse_attrs(m.group(0))
        props = " ".join(f'{_jsx_attr(k)}={json.dumps(v, ensure_ascii=False)}' for k, v in attrs.items())
        if props:
            tag = "meta" if m.group(0).lower().startswith("<meta") else "link"
            lines.append(f"      <{tag} {props} />")
    ld_literal = None
    ld = _LD_JSON_RE.search(head)
    if ld:
        try:
            ld_literal = json.dumps(json.loads(ld.group(1)), ensure_ascii=False)
            lines.append(
                '      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSONLD) }} />'
            )
        except Exception:
            pass
    return lines, ld_literal


def apply_nextjs_transform(files, project_name):
    """Next.js App Router: each page becomes a route component shipping its
    body via dangerouslySetInnerHTML (verbatim DOM), head <meta>/<link> tags
    become real JSX (React 19 hoists them), globals.css is imported by the
    root layout, and the build is a static export to ./out."""
    out = {}
    for name, content in files.items():
        if not name.endswith(".html"):
            if name == "globals.css":
                out["app/globals.css"] = content
            else:
                out[f"public/{name}"] = content
            continue
        slug = name[:-5]
        _, body, head = _body_and_head(content)
        body = _WD_BOOTSTRAP_RE.sub("", body).replace('src="js/', 'src="/js/')
        title_m = _TITLE_RE.search(head)
        jsx_head, ld_literal = _head_jsx(head)
        ld_const = f"const JSONLD = {ld_literal};\n\n" if ld_literal else ""
        title = json.dumps(title_m.group(1) if title_m else (project_name or "Untitled"), ensure_ascii=False)
        route = "app/page.js" if slug == "index" else f"app/{slug}/page.js"
        out[route] = (
            f"{ld_const}export const metadata = {{\n"
            f"  title: {title},\n"
            f"}};\n\n"
            f"const PAGE_BODY = {json.dumps(body, ensure_ascii=False)};\n\n"
            f"export default function Page() {{\n"
            f"  return (\n"
            f"    <>\n"
            f"      {{/* Real <meta>/<link> elements — React 19 hoists these into <head>. */}}\n"
            f"{chr(10).join(jsx_head) + chr(10) if jsx_head else ''}"
            f"      <div data-wd-root=\"true\" dangerouslySetInnerHTML={{{{\" __html\": PAGE_BODY }}}} />\n"
            f"    </>\n"
            f"  );\n"
            f"}}\n"
        )
    out["app/layout.js"] = (
        'import "./globals.css";\n\n'
        "export const metadata = {\n"
        f"  title: {json.dumps(project_name or 'Web Dojo site', ensure_ascii=False)},\n"
        "  description: \"\",\n"
        "};\n\n"
        "export default function RootLayout({ children }) {\n"
        "  return (\n"
        "    <html lang=\"en\">\n"
        '      <body data-wd-project="">\n'
        "        <script dangerouslySetInnerHTML={{ __html: 'window.__WD_PROJECT_ID=window.__WD_PROJECT_ID||document.body.getAttribute(\"data-wd-project\")||\"\";' }} />\n"
        "        {children}\n"
        "      </body>\n"
        "    </html>\n"
        "  );\n"
        "}\n"
    )
    out["next.config.mjs"] = (
        "/** @type {import('next').NextConfig} */\n"
        "const nextConfig = {\n"
        '  // Static export: "npm run build" writes a fully static site to ./out.\n'
        '  output: "export",\n'
        "};\n\n"
        "export default nextConfig;\n"
    )
    out["package.json"] = _json({
        "name": _pkg_name(project_name),
        "version": "1.0.0",
        "private": True,
        "scripts": {"dev": "next dev", "build": "next build", "start": "next start"},
        "dependencies": {"next": _NEXT_VERSION, "react": _REACT_VERSION, "react-dom": _REACT_VERSION},
    }) + "\n"
    out["jsconfig.json"] = _json({"compilerOptions": {"jsx": "preserve"}}) + "\n"
    out[".gitignore"] = "node_modules/\nnext-env.d.ts\nout/\n.next/\n"
    return out
