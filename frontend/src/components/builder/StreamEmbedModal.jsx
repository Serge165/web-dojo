import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Radio } from "lucide-react";
import { twitchEmbedHtml, youtubeEmbedHtml, discordWidgetHtml } from "@/lib/streamEmbeds";

const inputCls = "w-full bg-[#0D0D0D] border border-[#2B2B2B] rounded px-2.5 py-2 text-sm text-white outline-none focus:border-indigo-500";
const labelCls = "text-[10px] uppercase tracking-wider text-gray-500 block mb-1";

// Working Twitch/YouTube/Discord embeds for streaming & community
// integration — see lib/streamEmbeds.js for why "live/offline badge" and
// forum threads aren't here (need backend + API credentials this project
// doesn't have; faking them would be worse than not building them).
export const StreamEmbedModal = ({ open, onClose, onInsert }) => {
  const [platform, setPlatform] = useState("twitch");
  const [twitchChannel, setTwitchChannel] = useState("");
  const [ytValue, setYtValue] = useState("");
  const [ytIsChannel, setYtIsChannel] = useState(true);
  const [discordId, setDiscordId] = useState("");

  const html = useMemo(() => {
    if (platform === "twitch") return twitchChannel.trim() ? twitchEmbedHtml({ channel: twitchChannel.trim() }) : "";
    if (platform === "youtube") return ytValue.trim() ? youtubeEmbedHtml({ value: ytValue.trim(), isChannel: ytIsChannel }) : "";
    return discordId.trim() ? discordWidgetHtml({ serverId: discordId.trim() }) : "";
  }, [platform, twitchChannel, ytValue, ytIsChannel, discordId]);

  const insert = () => {
    if (!html) { toast.error("Fill in the field above first"); return; }
    onInsert(html);
    toast.success("Embed inserted onto canvas");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[#141414] border border-[#2B2B2B] text-white max-w-4xl w-[92vw] max-h-[90vh] overflow-hidden p-0" data-testid="stream-embed-modal">
        <DialogHeader className="px-5 pt-4 pb-3 border-b border-[#2B2B2B]">
          <DialogTitle className="flex items-center gap-2 text-base"><Radio size={16} className="text-purple-400" /> Add a live stream / community embed</DialogTitle>
          <DialogDescription className="sr-only">Embed a real Twitch player, YouTube live stream, or Discord server widget.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-[1fr_1fr] max-h-[calc(90vh-58px)]">
          <div className="border-r border-[#2B2B2B] overflow-y-auto p-5 space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => setPlatform("twitch")} className={`py-2.5 rounded-lg text-sm font-medium border ${platform === "twitch" ? "bg-[#6441a5] border-[#6441a5] text-white" : "border-[#2B2B2B] text-gray-300 hover:border-[#6441a5]/60"}`} data-testid="stream-platform-twitch">Twitch</button>
              <button onClick={() => setPlatform("youtube")} className={`py-2.5 rounded-lg text-sm font-medium border ${platform === "youtube" ? "bg-[#ff0000] border-[#ff0000] text-white" : "border-[#2B2B2B] text-gray-300 hover:border-[#ff0000]/60"}`} data-testid="stream-platform-youtube">YouTube</button>
              <button onClick={() => setPlatform("discord")} className={`py-2.5 rounded-lg text-sm font-medium border ${platform === "discord" ? "bg-[#5865F2] border-[#5865F2] text-white" : "border-[#2B2B2B] text-gray-300 hover:border-[#5865F2]/60"}`} data-testid="stream-platform-discord">Discord</button>
            </div>

            {platform === "twitch" && (
              <div className="space-y-2">
                <div>
                  <label className={labelCls}>Twitch channel name</label>
                  <input value={twitchChannel} onChange={(e) => setTwitchChannel(e.target.value)} placeholder="e.g. shroud" className={inputCls} data-testid="stream-twitch-channel" />
                </div>
                <p className="text-[11px] text-gray-500">No API key needed — works on your real published site. It won't render inside Web Dojo's own Design canvas or in-app Preview (both sandbox embedded content in ways that block Twitch's parent-domain check); that's expected, not broken.</p>
              </div>
            )}

            {platform === "youtube" && (
              <div className="space-y-2">
                <div className="flex bg-[#0D0D0D] border border-[#2B2B2B] rounded-md p-0.5 text-[11px]">
                  <button onClick={() => setYtIsChannel(true)} className={`flex-1 py-1 rounded ${ytIsChannel ? "bg-[#1F1F1F] text-white" : "text-gray-400"}`} data-testid="stream-yt-mode-channel">Channel (auto live)</button>
                  <button onClick={() => setYtIsChannel(false)} className={`flex-1 py-1 rounded ${!ytIsChannel ? "bg-[#1F1F1F] text-white" : "text-gray-400"}`} data-testid="stream-yt-mode-video">Specific video ID</button>
                </div>
                <div>
                  <label className={labelCls}>{ytIsChannel ? "Channel ID (starts with UC…)" : "Video ID (from youtube.com/watch?v=…)"}</label>
                  <input value={ytValue} onChange={(e) => setYtValue(e.target.value)} placeholder={ytIsChannel ? "UCxxxxxxxxxxxxxxxxxxxxxx" : "dQw4w9WgXcQ"} className={inputCls + " font-mono"} data-testid="stream-yt-value" />
                </div>
              </div>
            )}

            {platform === "discord" && (
              <div className="space-y-2">
                <div>
                  <label className={labelCls}>Discord server ID</label>
                  <input value={discordId} onChange={(e) => setDiscordId(e.target.value)} placeholder="e.g. 197038439483310086" className={inputCls + " font-mono"} data-testid="stream-discord-id" />
                </div>
                <p className="text-[11px] text-gray-500">The server owner must enable "Server Widget" in Discord's Server Settings → Widget first, or this shows an error instead of the member list.</p>
              </div>
            )}
          </div>

          <div className="flex flex-col overflow-hidden bg-[#0e0e10]">
            <div className="px-4 py-2 border-b border-[#2B2B2B] bg-[#141414] flex justify-between items-center">
              <div className="text-[11px] uppercase tracking-widest text-gray-400">Live preview</div>
              <button onClick={insert} className="text-xs px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium" data-testid="stream-insert">Insert onto canvas</button>
            </div>
            <iframe
              title="stream-embed-preview"
              key={platform + html.length}
              srcDoc={`<!doctype html><html><head><meta charset="utf-8" /><style>body{margin:0;padding:24px;background:#0e0e10;font-family:system-ui,sans-serif;} .empty{color:#6b7280;font-size:13px;text-align:center;padding-top:80px;}</style></head><body>${html || '<div class="empty">Fill in the field on the left to preview the embed.</div>'}</body></html>`}
              className="flex-1 w-full border-0"
              // allow-same-origin deliberately NOT set — combined with
              // allow-scripts it would give this srcDoc content the app's
              // real origin instead of an opaque one (same rationale as
              // Builder.jsx's live-preview iframe).
              sandbox="allow-scripts"
              data-testid="stream-preview-iframe"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
