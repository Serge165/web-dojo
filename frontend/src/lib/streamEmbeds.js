import { escAttr, escJsScript } from "./escapeHtml";

// Real, functioning embeds — all fully client-side, no API keys or
// backend needed (that's why "automatic live/offline badge with viewer
// count" isn't included: that needs Twitch's authenticated Helix API,
// which does require a backend + app credentials this project doesn't
// have — the player itself doesn't need any of that).
//
// Twitch requires its `parent` query param to exactly match the
// embedding page's hostname or it refuses to load — and that hostname
// differs between the builder's live preview and the exported/published
// site, so it can't be baked in at insert time. Fixed at runtime instead
// via a tiny inline script that rewrites the iframe src using
// location.hostname once the page actually loads.
export const twitchEmbedHtml = ({ channel }) => {
  const id = "wd-twitch-" + Math.random().toString(36).slice(2, 8);
  const safeChannel = escAttr(channel);
  return `<div style="position:relative;width:100%;aspect-ratio:16/9;background:#0e0e10;border-radius:12px;overflow:hidden;">
  <iframe id="${id}" title="Twitch stream" src="https://player.twitch.tv/?channel=${safeChannel}&muted=true" style="width:100%;height:100%;border:0;" allowfullscreen></iframe>
  <script>(function(){var f=document.getElementById(${JSON.stringify(id)});var ch=${escJsScript(channel)};if(f)f.src="https://player.twitch.tv/?channel="+encodeURIComponent(ch)+"&muted=true&parent="+location.hostname;})();</script>
</div>`;
};

export const youtubeEmbedHtml = ({ value, isChannel }) => {
  const safe = escAttr(value);
  const src = isChannel
    ? `https://www.youtube.com/embed/live_stream?channel=${safe}`
    : `https://www.youtube.com/embed/${safe}`;
  return `<div style="position:relative;width:100%;aspect-ratio:16/9;background:#000;border-radius:12px;overflow:hidden;">
  <iframe title="YouTube stream" src="${src}" style="width:100%;height:100%;border:0;" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe>
</div>`;
};

// Discord's widget needs "Server Widget" enabled in that server's
// settings (Discord's own requirement, not this app's) — otherwise it
// renders an "invalid widget" message, which we can't detect or fix here.
export const discordWidgetHtml = ({ serverId, theme = "dark" }) => {
  const safeId = escAttr(serverId);
  return `<iframe title="Discord server widget" src="https://discord.com/widget?id=${safeId}&theme=${theme}" style="width:100%;height:400px;border:0;border-radius:12px;" sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"></iframe>`;
};
