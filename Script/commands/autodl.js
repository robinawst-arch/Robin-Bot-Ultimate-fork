const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const baseApiUrl = async () => {
  const res = await axios.get(
    "https://raw.githubusercontent.com/cyber-ullash/cyber-ullash/refs/heads/main/UllashApi.json"
  );
  return res.data.api2;
};

function detectPlatformByUrl(url) {
  const u = (url || "").toLowerCase();

  if (u.includes("tiktok.com")) return "TikTok";
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "YouTube";
  if (u.includes("instagram.com") || u.includes("instagr.am")) return "Instagram";
  if (u.includes("facebook.com") || u.includes("fb.watch")) return "Facebook";
  if (u.includes("pinterest.com") || u.includes("pin.it")) return "Pinterest";
  if (u.includes("soundcloud.com")) return "SoundCloud";
  if (u.includes("likee.")) return "Likee";
  if (u.includes("threads.net")) return "Threads";
  if (u.includes("terabox")) return "Terabox";
  if (u.includes("spotify.com")) return "Spotify";
  if (u.includes("drive.google.com")) return "Google Drive";
  if (u.includes("twitter.com") || u.includes("x.com")) return "Twitter";
  if (u.includes("capcut")) return "CapCut";

  return "Unknown";
}

module.exports.config = {
  name: "autodl",
  version: "5.2.0",
  hasPermssion: 0,
  credits: "Ullash | Converted by Moyna",
  description: "Auto video downloader from URL",
  commandCategory: "Media",
  usages: "Just send a supported video URL",
  cooldowns: 3
};

// 🔥 Mirai auto detect (NO PREFIX)
module.exports.handleEvent = async function ({ api, event }) {
  try {
    const text = event.body || "";
    if (!text.startsWith("http")) return;

    // reaction simulate
    api.setMessageReaction("💊", event.messageID, () => {}, true);

    const apiBase = await baseApiUrl();
    const apiRes = await axios.get(
      `${apiBase}/api/alldl?url=${encodeURIComponent(text)}`
    );

    const data = apiRes.data?.data || {};
    let videoUrl = data.high || data.low;

    if (!videoUrl) {
      return api.sendMessage(
        "❌ Unable to download video!",
        event.threadID,
        event.messageID
      );
    }

    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const filePath = path.join(cacheDir, "auto.mp4");

    const vidRes = await axios.get(videoUrl, { responseType: "arraybuffer" });
    fs.writeFileSync(filePath, Buffer.from(vidRes.data));

    api.setMessageReaction("☢️", event.messageID, () => {}, true);

    const platform = data.platform || detectPlatformByUrl(text);
    const title = data.title || "No Title";

    const msg =
`╭◉━━━━◈━━━━◉╮
│ ✨ 𝐃𝐨𝐰𝐧𝐥𝐨𝐚𝐝 𝐂𝐨𝐦𝐩𝐥𝐞𝐭𝐞
│
│ ☢️ Platform • ${platform}
│ 🕳️ Title    • ${title}
╰◉━━━━◈━━━━◉╯`;

    await api.sendMessage(
      {
        body: msg,
        attachment: fs.createReadStream(filePath)
      },
      event.threadID,
      event.messageID
    );

    try { fs.unlinkSync(filePath); } catch {}

    api.setMessageReaction("✅", event.messageID, () => {}, true);

  } catch (err) {
    console.error("Autodl Error:", err);
    api.setMessageReaction("❎", event.messageID, () => {}, true);
    api.sendMessage(
      "❌ Error downloading video. Check URL or API.",
      event.threadID,
      event.messageID
    );
  }
};

// Mirai requires run()
module.exports.run = async function () {};
