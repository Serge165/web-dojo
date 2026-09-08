// Official tracking snippets for common providers, injected as one
// <!-- forge-analytics --> block that cascades to every page (tracking
// only makes sense site-wide, unlike per-page theme vars). IDs are
// stripped to a safe charset before splicing into HTML — they're
// short provider-issued tokens, never free text, so this is stricter
// than escAttr and doesn't need it.
const safe = (v) => String(v ?? "").trim().replace(/[^a-zA-Z0-9_\-.]/g, "");

const START = "<!-- forge-analytics:start -->";
const END = "<!-- forge-analytics:end -->";

export const ANALYTICS_FIELDS = [
  { key: "ga4", label: "Google Analytics (GA4)", placeholder: "G-XXXXXXXXXX" },
  { key: "fathom", label: "Fathom Analytics", placeholder: "ABCDEFGH" },
  { key: "plausibleDomain", label: "Plausible", placeholder: "yourdomain.com" },
  { key: "hotjar", label: "Hotjar", placeholder: "1234567" },
  { key: "fbPixel", label: "Facebook Pixel", placeholder: "1234567890123456" },
];

const buildOne = (key, value) => {
  const id = safe(value);
  if (!id) return "";
  if (key === "ga4") return `<script async src="https://www.googletagmanager.com/gtag/js?id=${id}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}');</script>`;
  if (key === "fathom") return `<script src="https://cdn.usefathom.com/script.js" data-site="${id}" defer></script>`;
  if (key === "plausibleDomain") return `<script defer data-domain="${id}" src="https://plausible.io/js/script.js"></script>`;
  if (key === "hotjar") return `<script>(function(h,o,t,j){h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};h._hjSettings={hjid:${JSON.stringify(id)},hjsv:6};var a=o.getElementsByTagName('head')[0];var r=o.createElement('script');r.async=1;r.src=t+h._hjSettings.hjid+j;a.appendChild(r);})(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');</script>`;
  if (key === "fbPixel") return `<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${id}');fbq('track','PageView');</script>
<noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1" alt="" /></noscript>`;
  return "";
};

export const buildAnalyticsHead = (config) => {
  const body = ANALYTICS_FIELDS.map((f) => buildOne(f.key, config?.[f.key])).filter(Boolean).join("\n");
  return body ? `${START}\n${body}\n${END}` : "";
};

// Strip pattern also eats one optional LEADING newline — insertion below
// joins onto prior content with a separating "\n" before the block, so a
// plain trailing-\n? strip alone would leave that separator dangling once
// the block itself is removed for good (see rootVars.js for the same fix).
export const upsertAnalyticsHead = (headHtml, config) => {
  const stripped = (headHtml || "").replace(new RegExp(`\\n?${START}[\\s\\S]*?${END}\\n?`), "");
  const block = buildAnalyticsHead(config);
  return block ? `${stripped}${stripped ? "\n" : ""}${block}` : stripped;
};
