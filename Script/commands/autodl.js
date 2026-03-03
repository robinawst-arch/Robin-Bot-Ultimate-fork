// ════════════════════════════════════════════════════
//  autodl.js — Auto Video Downloader v2.0
//  Supported: TikTok • Facebook • Instagram • YouTube
// ════════════════════════════════════════════════════

const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const vm = require("vm");

const CACHE_DIR = path.join(__dirname, "cache");
fs.ensureDirSync(CACHE_DIR);

// ─── URL Detection ────────────────────────────────
function extractURL(text) {
  const match = text && text.match(/https?:\/\/[^\s]+/);
  return match ? match[0] : null;
}

function detectPlatform(text) {
  const url = extractURL(text);
  if (!url) return null;
  if (/tiktok\.com|vt\.tiktok\.com|vm\.tiktok\.com/i.test(url))
    return { platform: "tiktok", url };
  if (/facebook\.com|fb\.watch/i.test(url))
    return { platform: "facebook", url };
  if (/instagram\.com/i.test(url)) return { platform: "instagram", url };
  if (/youtu\.be|youtube\.com/i.test(url)) return { platform: "youtube", url };
  if (/capcut\.com/i.test(url)) return { platform: "capcut", url };
  if (/pin\.it|pinterest\.com/i.test(url))
    return { platform: "pinterest", url };
  return null;
}

// ─── TikTok via TikWM ─────────────────────────────
async function downloadTikTok(url) {
  const res = await axios.post(
    "https://www.tikwm.com/api/",
    "url=" + encodeURIComponent(url) + "&hd=1",
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      timeout: 15000,
    },
  );
  if (res.data.code !== 0)
    throw new Error("TikWM: " + (res.data.msg || "failed"));
  const data = res.data.data;
  const videoUrl = data.hdplay || data.play || data.wmplay;
  if (!videoUrl) throw new Error("No video URL from TikWM");
  return { videoUrl, title: data.title || "TikTok Video" };
}

// ─── Facebook / Instagram via SnapSave JS decoder ─
async function downloadSnapSave(url) {
  const host = /instagram\.com/.test(url) ? "snapinsta.app" : "snapsave.app";

  const res = await axios.post(
    "https://" + host + "/action.php",
    "url=" + encodeURIComponent(url) + "&lang=en",
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://" + host + "/",
        Origin: "https://" + host,
      },
      timeout: 15000,
    },
  );

  const code = String(res.data);

  // Decode outer eval → get second-level JS
  let secondLevel = "";
  const ctx1 = {
    Math,
    Date,
    window: { location: { hostname: host } },
    document: {
      write: (v) => {
        secondLevel = v;
      },
      getElementById: () => ({ innerHTML: "" }),
    },
  };
  try {
    vm.runInNewContext(
      code.replace(/eval\s*\(/, "document.write("),
      vm.createContext(ctx1),
      { timeout: 4000 },
    );
  } catch (e) {
    /* ignore */
  }

  // Execute second-level JS → capture innerHTML
  const storage = { html: "" };
  const el = {};
  Object.defineProperty(el, "innerHTML", {
    set(v) {
      storage.html = v;
    },
    get() {
      return storage.html;
    },
  });
  el.remove = () => {};
  el.querySelector = () => null;
  const ctx2 = {
    Math,
    Date,
    window: { location: { hostname: host } },
    document: {
      getElementById: () => el,
      querySelector: () => null,
      write: (v) => {
        storage.html = v;
      },
    },
  };
  if (secondLevel) {
    try {
      vm.runInNewContext(secondLevel, vm.createContext(ctx2), {
        timeout: 4000,
      });
    } catch (e) {
      /* ignore */
    }
  }

  // Extract download URLs from decoded HTML
  const html = storage.html;
  const links = [];
  const hrefReg = /href="(https?:\/\/[^"]+)"/g;
  let m;
  while ((m = hrefReg.exec(html)) !== null) {
    const link = m[1];
    if (
      !link.includes(host) &&
      !link.includes("facebook.com/login") &&
      !link.includes("instagram.com/login")
    ) {
      links.push(link);
    }
  }

  if (links.length === 0) throw new Error("SnapSave: no download links found");
  // Prefer HD link
  const videoUrl =
    links.find((l) => l.toLowerCase().includes("hd")) ||
    links[links.length - 1];
  return { videoUrl, title: "Video" };
}

// ─── YouTube via ytdl-core ─────────────────────────
async function downloadYouTube(url) {
  const ytdl = require("@distube/ytdl-core");
  const info = await ytdl.getInfo(url);
  const title = info.videoDetails.title;
  const format = ytdl.chooseFormat(info.formats, {
    quality: "highestvideo",
    filter: (f) =>
      f.hasVideo &&
      f.hasAudio &&
      f.container === "mp4" &&
      (parseInt(f.qualityLabel) || 9999) <= 720,
  });
  if (!format) throw new Error("No suitable YouTube format found");
  return { videoUrl: format.url, title };
}

// ─── Stream download to local file ────────────────
async function downloadFile(videoUrl, outPath) {
  const response = await axios.get(videoUrl, {
    responseType: "stream",
    timeout: 60000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    maxRedirects: 5,
  });
  return new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(outPath);
    response.data.pipe(writer);
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

// ─── Config ───────────────────────────────────────
module.exports.config = {
  name: "autolink",
  version: "2.0.0",
  hasPermission: 0,
  usePrefix: false,
  description: "Auto-download TikTok, Facebook, Instagram, YouTube videos",
  usages: "Post a video link in the group",
  credits: "Robin-Bot",
  countDown: 5,
};

// ─── Main event handler ───────────────────────────
module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, messageID, body } = event;
  if (!body) return;

  const detected = detectPlatform(body);
  if (!detected) return;

  const { platform, url } = detected;
  const videoFile = path.join(CACHE_DIR, `video_${threadID}_${Date.now()}.mp4`);

  api.setMessageReaction("⏳", messageID, () => {}, true);

  try {
    let result;

    if (platform === "tiktok") {
      result = await downloadTikTok(url);
    } else if (platform === "facebook" || platform === "instagram") {
      result = await downloadSnapSave(url);
    } else if (platform === "youtube") {
      result = await downloadYouTube(url);
    } else {
      result = await downloadSnapSave(url);
    }

    await downloadFile(result.videoUrl, videoFile);

    const stat = await fs.stat(videoFile);
    if (stat.size < 1000) throw new Error("Downloaded file too small");

    await api.sendMessage(
      {
        body:
          result.title && result.title !== "Video" ? `🎬 ${result.title}` : "",
        attachment: fs.createReadStream(videoFile),
      },
      threadID,
      messageID,
    );

    api.setMessageReaction("✅", messageID, () => {}, true);
  } catch (err) {
    console.error("[autodl] Error:", err.message);
    api.setMessageReaction("❌", messageID, () => {}, true);
    api.sendMessage(
      `❌ ভিডিও ডাউনলোড করা সম্ভব হয়নি।\n📎 ${url}`,
      threadID,
      messageID,
    );
  } finally {
    fs.remove(videoFile).catch(() => {});
  }
};

module.exports.run = function () {};
