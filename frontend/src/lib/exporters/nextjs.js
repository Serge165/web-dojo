// Phase 9C: Next.js (App Router) exporter.
//
// Reuses buildMultiPageExport for the canonical HTML/CSS output, then
// reshapes it: each page becomes a route component under app/, the shared
// stylesheet is imported by the root layout, and extracted JS/asset files
// move to public/. Static export ("output: export") keeps the deployment
// shape identical to Web Dojo's plain HTML zip — `next build` produces an
// ./out directory to FTP up.
//
// Body content ships via dangerouslySetInnerHTML from a JSON string literal
// (always a valid JS expression regardless of braces in the markup). The
// head's <meta>/<link> tags are converted to real JSX so React 19 hoists
// them into <head>; JSON-LD is re-emitted as a parsed object; the
// project-id bootstrap moves to the root layout.
import { buildMultiPageExport } from "../exportHtml";

const pkgName = (name) =>
  (String(name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "web-dojo-site");

const parseAttrs = (tag) => {
  const attrs = {};
  const re = /([a-zA-Z-]+)="([^"]*)"/g;
  let m;
  while ((m = re.exec(tag))) attrs[m[1]] = m[2];
  return attrs;
};

// JSX spellings for the HTML attributes the generator emits.
const jsxAttr = (k) => (k === "charset" ? "charSet" : k === "http-equiv" ? "httpEquiv" : k);

// Turns one exported page's <head> into JSX lines + the JSON-LD literal.
const headParts = (head) => {
  const lines = [];
  for (const m of head.matchAll(/<(?:meta|link)\b[^>]*>/gi)) {
    const attrs = parseAttrs(m[0]);
    const props = Object.entries(attrs)
      .map(([k, v]) => `${jsxAttr(k)}=${JSON.stringify(v)}`)
      .join(" ");
    if (props) lines.push(`      <${/^<meta/i.test(m[0]) ? "meta" : "link"} ${props} />`);
  }
  let ldLiteral = null;
  const ld = head.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
  if (ld) {
    try {
      ldLiteral = JSON.stringify(JSON.parse(ld[1]));
      lines.push(`      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSONLD) }} />`);
    } catch { /* malformed ld — skip */ }
  }
  return { lines, ldLiteral };
};

export const buildNextjsExport = (project) => {
  const { files: htmlFiles } = buildMultiPageExport(project);
  const files = {};

  Object.entries(htmlFiles).forEach(([name, content]) => {
    if (!name.endsWith(".html")) {
      // globals.css is imported by the layout; everything else → public/
      if (name === "globals.css") files["app/globals.css"] = content;
      else files[`public/${name}`] = content;
      return;
    }
    const slug = name.slice(0, -5);
    const page = (project.pages || []).find((p) => (p.slug || "index") === slug);
    const bodyMatch = content.match(/<body([^>]*)>([\s\S]*)<\/body>/i);
    const headMatch = content.match(/<head>([\s\S]*)<\/head>/i);
    const head = headMatch ? headMatch[1] : "";
    // The bootstrap script is inert inside dangerouslySetInnerHTML — the
    // root layout renders it for real (project id is constant per export).
    let body = (bodyMatch ? bodyMatch[2] : "").replace(
      /<script>window\.__WD_PROJECT_ID=[\s\S]*?<\/script>\s*/i,
      ""
    ).replace(/src="js\//g, 'src="/js/');
    const titleMatch = head.match(/<title>([\s\S]*?)<\/title>/i);
    const { lines: jsxHead, ldLiteral } = headParts(head);
    const ldConst = ldLiteral ? `const JSONLD = ${ldLiteral};\n\n` : "";

    const routeFile = slug === "index" ? "app/page.js" : `app/${slug}/page.js`;
    files[routeFile] = `${ldConst}export const metadata = {
  title: ${JSON.stringify(titleMatch ? titleMatch[1] : (page && page.name) || project.name || "Untitled")},
};

const PAGE_BODY = ${JSON.stringify(body)};

export default function Page() {
  return (
    <>
      {/* Real <meta>/<link> elements — React 19 hoists these into <head>. */}
${jsxHead.join("\n")}
      <div data-wd-root="true" dangerouslySetInnerHTML={{ __html: PAGE_BODY }} />
    </>
  );
}
`;
  });

  files["app/layout.js"] = `import "./globals.css";

export const metadata = {
  title: ${JSON.stringify(project.name || "Web Dojo site")},
  description: ${JSON.stringify((project.seo && project.seo.description) || "")},
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body data-wd-project=${JSON.stringify(project.id || "")}>
        <script dangerouslySetInnerHTML={{ __html: 'window.__WD_PROJECT_ID=window.__WD_PROJECT_ID||document.body.getAttribute("data-wd-project")||"";' }} />
        {children}
      </body>
    </html>
  );
}
`;

  files["next.config.mjs"] = `/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export: "npm run build" writes a fully static site to ./out —
  // upload it with FTP/SFTP exactly like the plain HTML export.
  output: "export",
};

export default nextConfig;
`;

  files["package.json"] = `${JSON.stringify(
    {
      name: pkgName(project.name),
      version: "1.0.0",
      private: true,
      scripts: { dev: "next dev", build: "next build", start: "next start" },
      dependencies: { next: "^15.1.6", react: "^19.0.0", "react-dom": "^19.0.0" },
    },
    null,
    2
  )}\n`;

  files["jsconfig.json"] = `${JSON.stringify({ compilerOptions: { jsx: "preserve" } }, null, 2)}\n`;
  files[".gitignore"] = "node_modules/\nnext-env.d.ts\nout/\n.next/\n";
  files["README.md"] = `# ${project.name || "Web Dojo site"} (Next.js)

Generated by Web Dojo's Next.js exporter (App Router, static export).
Pages are route components under \`app/\`, the shared stylesheet is
\`app/globals.css\`, and runtime scripts live in \`public/js/\`.

    npm install
    npm run dev      # http://localhost:3000
    npm run build    # static site in ./out — upload with FTP/SFTP as usual

Note: page markup ships via \`dangerouslySetInnerHTML\` (verbatim DOM, same
cascade as the HTML export); the per-page <meta>/<link> tags are real JSX
elements that React 19 hoists into <head>.
`;

  return { files };
};
