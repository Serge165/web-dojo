import { twitchEmbedHtml, youtubeEmbedHtml, discordWidgetHtml } from "./streamEmbeds";

test("twitchEmbedHtml embeds the channel in the initial iframe src", () => {
  const out = twitchEmbedHtml({ channel: "shroud" });
  expect(out).toContain("player.twitch.tv/?channel=shroud");
});

test("twitchEmbedHtml includes a runtime script that sets parent from location.hostname", () => {
  const out = twitchEmbedHtml({ channel: "shroud" });
  expect(out).toContain("location.hostname");
  expect(out).toContain('"shroud"');
});

test("twitchEmbedHtml escapes an unsafe channel value in the static src attribute", () => {
  const out = twitchEmbedHtml({ channel: '"><script>alert(1)</script>' });
  expect(out).not.toContain("<script>alert(1)</script>");
});

test("youtubeEmbedHtml builds a live_stream URL for a channel", () => {
  const out = youtubeEmbedHtml({ value: "UCabc123", isChannel: true });
  expect(out).toContain("youtube.com/embed/live_stream?channel=UCabc123");
});

test("youtubeEmbedHtml builds a direct video URL for a video id", () => {
  const out = youtubeEmbedHtml({ value: "dQw4w9WgXcQ", isChannel: false });
  expect(out).toContain("youtube.com/embed/dQw4w9WgXcQ");
  expect(out).not.toContain("live_stream");
});

test("discordWidgetHtml embeds the server id and theme", () => {
  const out = discordWidgetHtml({ serverId: "197038439483310086", theme: "dark" });
  expect(out).toContain("discord.com/widget?id=197038439483310086&theme=dark");
});

test("discordWidgetHtml escapes an unsafe server id", () => {
  const out = discordWidgetHtml({ serverId: '"><script>alert(1)</script>' });
  expect(out).not.toContain("<script>alert(1)</script>");
});
