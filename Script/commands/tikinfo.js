const axios = require("axios");

// ====== FAST BASE API (with cache) ======
let cachedBaseApi = null;
async function getBaseApiUrl() {
  if (cachedBaseApi) return cachedBaseApi;
  try {
    const res = await axios.get(
      "https://raw.githubusercontent.com/itzaryan008/ERROR/refs/heads/main/raw/api.json"
    );
    cachedBaseApi = res.data.apis;
    return cachedBaseApi;
  } catch (err) {
    console.log("tikinfo | getBaseApiUrl error:", err.message);
    return null;
  }
}

// সংখ্যা সুন্দর করে দেখানোর জন্য
function formatNum(n) {
  if (n === undefined || n === null) return "0";
  const num = Number(n);
  if (Number.isNaN(num)) return String(n);
  return num.toLocaleString("en-US");
}

module.exports = {
  config: {
    name: "tikinfo",
    version: "1.1.0",
    hasPermssion: 0,
    credits: "Robin-Bot",
    description: "Get TikTok user info by username",
    commandCategory: "📱 TikTok Tools",
    usages: "[username]\nExample: tinfo khaby.lame",
    cooldowns: 5,
    dependencies: {},
  },

  run: async function ({ api, event, args }) {
    const { threadID, messageID } = event;
    const username = args.join(" ").trim();

    // ====== Argument check ======
    if (!username) {
      return api.sendMessage(
        "⚠️ Please provide a TikTok username.\n\n📌 Usage:\n" +
          "tinfo username\n" +
          "Ex: tinfo khaby.lame",
        threadID,
        messageID
      );
    }

    // ====== Get base API URL ======
    const base = await getBaseApiUrl();
    if (!base) {
      return api.sendMessage(
        "❌ Failed to fetch API base URL.\nPlease try again later.",
        threadID,
        messageID
      );
    }

    try {
      // ====== Call API ======
      const res = await axios.get(`${base}/tikstalk`, {
        params: { username },
      });

      const data = res.data || {};

      // কিছু API তে data.data ভিতরে থাকে – সেফটি
      const info = data.data || data;

      if (!info.username && !info.uniqueId) {
        return api.sendMessage(
          "❌ Can't fetch this user.\nMaybe username is invalid or account is private.",
          threadID,
          messageID
        );
      }

      // ====== Fields with fallback ======
      const avatar =
        info.avatarLarger || info.avatarUrl || info.avatarThumb || null;

      const uname = info.username || info.uniqueId || "N/A";
      const nickname = info.nickname || info.nickName || "N/A";
      const bio = info.signature || info.bio || "N/A";
      const region = info.region || info.country || "N/A";
      const verified =
        info.verified === true ? "✅ Verified" : "❌ Not verified";
      const privateAcc = info.privateAccount ? "🔒 Private" : "🔓 Public";

      const heart = formatNum(info.heartCount || info.heart || info.likes);
      const followers = formatNum(info.followerCount || info.followers);
      const following = formatNum(info.followingCount || info.following);
      const videos = formatNum(info.videoCount || info.videos);

      const relation = info.relation || "N/A";
      const profileUrl = `https://www.tiktok.com/@${uname}`;

      let msg =
        "👤 𝗧𝗶𝗸𝗧𝗼𝗸 𝗣𝗿𝗼𝗳𝗶𝗹𝗲 𝗜𝗻𝗳𝗼\n\n" +
        `🆔 𝗨𝘀𝗲𝗿𝗻𝗮𝗺𝗲: @${uname}\n` +
        `📛 𝗡𝗶𝗰𝗸𝗻𝗮𝗺𝗲: ${nickname}\n` +
        `📄 𝗕𝗶𝗼: ${bio}\n` +
        `🌍 𝗥𝗲𝗴𝗶𝗼𝗻: ${region}\n` +
        `✔️ 𝗦𝘁𝗮𝘁𝘂𝘀: ${verified}\n` +
        `🔐 𝗣𝗿𝗶𝘃𝗮𝗰𝘆: ${privateAcc}\n\n` +
        `❤️ 𝗟𝗶𝗸𝗲𝘀: ${heart}\n` +
        `👥 𝗙𝗼𝗹𝗹𝗼𝘄𝗲𝗿𝘀: ${followers}\n` +
        `🔁 𝗙𝗼𝗹𝗹𝗼𝘄𝗶𝗻𝗴: ${following}\n` +
        `🎬 𝗩𝗶𝗱𝗲𝗼𝘀: ${videos}\n` +
        `🔗 𝗥𝗲𝗹𝗮𝘁𝗶𝗼𝗻: ${relation}\n\n` +
        `🌐 𝗣𝗿𝗼𝗳𝗶𝗹𝗲 𝗟𝗶𝗻𝗸:\n${profileUrl}`;

      if (!avatar) {
        // avatar না থাকলে শুধু টেক্সট
        return api.sendMessage(msg, threadID, messageID);
      }

      // ====== Avatar stream send ======
      const avatarStream = (await axios.get(avatar, { responseType: "stream" }))
        .data;

      api.sendMessage(
        { body: msg, attachment: avatarStream },
        threadID,
        messageID
      );
    } catch (err) {
      console.log("tikinfo error:", err.message);
      return api.sendMessage(
        `❌ Error while fetching TikTok info.\nDetails: ${err.message}`,
        threadID,
        messageID
      );
    }
  },
};
