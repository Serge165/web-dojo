// Scoped version of "Google ranking factors validator": checks the handful
// of on-page factors Web Dojo actually has data for (SEO fields + page
// markup). Skips anything needing an external crawl (backlinks, real page
// speed, mobile-rendering audits) — those aren't things this app can check
// from inside the editor.
const stripTags = (html) => (html || "").replace(/<[^>]+>/g, " ");
const wordCount = (html) => stripTags(html).trim().split(/\s+/).filter(Boolean).length;

const ALT_RE = /<img\b[^>]*>/gi;
const ALT_ATTR_RE = /\balt\s*=\s*(?:"([^"]*)"|'([^']*)')/i;
const altTextCoverage = (html) => {
  const imgs = (html || "").match(ALT_RE) || [];
  if (imgs.length === 0) return { total: 0, withAlt: 0 };
  const withAlt = imgs.filter((tag) => {
    const m = tag.match(ALT_ATTR_RE);
    return m && (m[1] || m[2] || "").trim().length > 0;
  }).length;
  return { total: imgs.length, withAlt };
};

// { id, label, status: "pass" | "warn" | "fail", detail, weight }
export const computeSeoChecks = ({ seo, elements } = {}) => {
  const s = seo || {};
  const html = (elements || []).map((e) => e.html || "").join("\n");
  const titleLen = (s.title || "").length;
  const descLen = (s.description || "").length;
  const keywordCount = (s.keywords || "").split(",").map((k) => k.trim()).filter(Boolean).length;
  const { total: imgTotal, withAlt: imgWithAlt } = altTextCoverage(html);
  const words = wordCount(html);
  const ogComplete = !!((s.og_title || s.title) && (s.og_description || s.description) && s.og_image);
  const hasUnfilledPlaceholder = [s.title, s.description, s.keywords].some((v) => /\[[^\]]+\]/.test(v || ""));

  const checks = [
    {
      id: "title", label: "Title tag", weight: 20,
      status: titleLen >= 50 && titleLen <= 60 ? "pass" : titleLen === 0 ? "fail" : "warn",
      detail: titleLen === 0 ? "No title set." : `${titleLen} chars (aim for 50-60).`,
    },
    {
      id: "description", label: "Meta description", weight: 20,
      status: descLen >= 150 && descLen <= 160 ? "pass" : descLen === 0 ? "fail" : "warn",
      detail: descLen === 0 ? "No description set." : `${descLen} chars (aim for 150-160).`,
    },
    {
      id: "keywords", label: "Keywords", weight: 15,
      status: keywordCount >= 3 && keywordCount <= 7 ? "pass" : keywordCount === 0 ? "fail" : "warn",
      detail: keywordCount === 0 ? "No keywords set." : `${keywordCount} keyword(s) (aim for 3-7).`,
    },
    {
      id: "canonical", label: "Canonical URL", weight: 10,
      status: s.canonical ? "pass" : "fail",
      detail: s.canonical ? "Set." : "Not set — recommended to avoid duplicate-content issues.",
    },
    {
      id: "og", label: "Open Graph tags", weight: 15,
      status: ogComplete ? "pass" : "warn",
      detail: ogComplete ? "Title, description, and image all resolve." : "Missing an OG image, title, or description.",
    },
    {
      id: "alt", label: "Image alt text", weight: 10,
      status: imgTotal === 0 ? "pass" : imgWithAlt === imgTotal ? "pass" : imgWithAlt === 0 ? "fail" : "warn",
      detail: imgTotal === 0 ? "No images on this page." : `${imgWithAlt}/${imgTotal} images have alt text.`,
    },
    {
      id: "content", label: "Content length", weight: 10,
      status: words >= 300 ? "pass" : words >= 150 ? "warn" : "fail",
      detail: `${words} words (aim for 300+).`,
    },
    {
      // weight 0: doesn't move the score, but a leftover [Bracket] from an
      // applied template is worth flagging in the checklist and blocking
      // in the pre-export warning — shipping "[Business Name]" live is a
      // real embarrassment, not a stylistic nitpick.
      id: "placeholders", label: "Template placeholders", weight: 0,
      status: hasUnfilledPlaceholder ? "fail" : "pass",
      detail: hasUnfilledPlaceholder ? "A [bracketed] placeholder is still unfilled in title/description/keywords." : "None left unfilled.",
    },
  ];

  const score = Math.round(
    checks.reduce((sum, c) => sum + (c.status === "pass" ? c.weight : c.status === "warn" ? c.weight * 0.5 : 0), 0)
  );

  return { checks, score };
};

// Pre-export validation (Task 7.2): only surfaces the objectively-missing
// stuff (status "fail") per page, not every "could be tighter" warning —
// this fires on every export, so it should only speak up about things
// actually worth fixing, not nag about a title that's 45 chars instead of 50.
export const collectExportSeoWarnings = (project) => {
  const pages = (project.pages && project.pages.length)
    ? project.pages
    : [{ name: project.name, seo: project.seo, elements: project.elements }];
  return pages
    .map((page) => {
      const { checks } = computeSeoChecks({ seo: page.seo, elements: page.elements });
      const missing = checks.filter((c) => c.status === "fail").map((c) => c.label);
      return missing.length ? `${page.name || "Untitled"}: missing ${missing.join(", ")}` : null;
    })
    .filter(Boolean);
};

export const scoreColor = (score) => {
  if (score >= 81) return "text-emerald-500";
  if (score >= 61) return "text-lime-500";
  if (score >= 31) return "text-amber-500";
  return "text-red-500";
};
