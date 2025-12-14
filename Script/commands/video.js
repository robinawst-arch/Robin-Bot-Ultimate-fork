const axios = require("axios");
const fs = require("fs");
const path = require("path");
const yts = require("yt-search");

// Robin YouTube API (InfinityFree)
const API_BASE = "https://robin-api.rf.gd";

module.exports = {
  config: {
    name: "video",
    version: "2.0.0",
    credits: "Robin-Bot",
    countDown: 5,
    hasPermssion: 0,
    description: "Download video, audio from YouTube",
    category: "media",
    commandCategory: "media",
    usePrefix: true,
    prefix: true,
    usages:
      " {pn} [video|-v] [<video name>]\n" +
      " {pn} [audio|-a] [<audio name>]\n" +
      "Example:\n" +
      "{pn} -v chipi chipi\n" +
      "{pn} -a despacito",
  },

  run: async ({ api, args, event }) => {
    const { threadID, messageID, senderID } = event;

    let action = args[0] ? args[0].toLowerCase() : "-v";

    if (!["-v", "video", "mp4", "-a", "audio", "mp3"].includes(action)) {
      args.unshift("-v");
      action = "-v";
    }

    args.shift();
    const keyWord = args.join(" ");

    if (!keyWord) {
      return api.sendMessage(
        "❌ Please provide a search keyword",
        threadID,
        messageID
      );
    }

    try {
      // Use API for search
      const searchUrl = `${API_BASE}/ytFullSearch.php?songName=${encodeURIComponent(
        keyWord
      )}`;
      const { data: results } = await axios.get(searchUrl);

      if (!results || results.length === 0) {
        return api.sendMessage(
          `⭕ No results for: ${keyWord}`,
          threadID,
          messageID
        );
      }

      let msg = "🎬 Select a video:\n\n";
      const thumbs = [];

      let i = 1;
      for (const item of results) {
        const channelName = item.channel?.name || item.channelName || "Unknown";
        msg += `${i}. ${item.title}\n⏱ ${
          item.time || "N/A"
        }\n📺 ${channelName}\n\n`;

        if (item.thumbnail && item.thumbnail.startsWith("http")) {
          try {
            const thumbPath = path.join(
              __dirname,
              "cache",
              `thumb_${Date.now()}_${i}.jpg`
            );
            thumbs.push(await saveImage(item.thumbnail, thumbPath));
          } catch (e) {
            console.log("Thumbnail error:", e.message);
          }
        }
        i++;
      }

      api.sendMessage(
        { body: msg + "Reply a number (1-6)", attachment: thumbs },
        threadID,
        (err, info) => {
          if (!err && info && info.messageID) {
            global.client.handleReply.push({
              name: module.exports.config.name,
              messageID: info.messageID,
              author: senderID,
              results,
              action,
            });
          }
        },
        messageID
      );
    } catch (err) {
      console.error("Video search error:", err.message);
      return api.sendMessage("❌ Search failed!", threadID, messageID);
    }
  },

  handleReply: async ({ api, event, handleReply }) => {
    const choice = Number(event.body);
    if (isNaN(choice) || choice < 1 || choice > handleReply.results.length) {
      return api.sendMessage(
        "❌ Invalid choice.",
        event.threadID,
        event.messageID
      );
    }

    const vid = handleReply.results[choice - 1].id;
    const format = ["-v", "video", "mp4"].includes(handleReply.action)
      ? "mp4"
      : "mp3";

    try {
      api.sendMessage("⏳ Downloading...", event.threadID, event.messageID);

      const apiUrl = `${API_BASE}/ytDl3.php?link=${vid}&format=${format}`;
      const { data } = await axios.get(apiUrl);

      if (!data || !data.downloadLink) {
        return api.sendMessage(
          "❌ Download failed!",
          event.threadID,
          event.messageID
        );
      }

      const filePath = path.join(
        __dirname,
        "cache",
        `ytb_${Date.now()}.${format}`
      );
      await downloadFile(data.downloadLink, filePath);

      await api.unsendMessage(handleReply.messageID);

      api.sendMessage(
        {
          body: `✅ ${data.title}\n🎵 Format: ${format.toUpperCase()}`,
          attachment: fs.createReadStream(filePath),
        },
        event.threadID,
        () => fs.unlinkSync(filePath),
        event.messageID
      );
    } catch (e) {
      console.error("Video download error:", e.message);
      return api.sendMessage(
        "❌ Download failed!",
        event.threadID,
        event.messageID
      );
    }
  },
};

async function downloadFile(url, savePath) {
  const res = await axios.get(url, { responseType: "arraybuffer" });
  fs.writeFileSync(savePath, Buffer.from(res.data));
}

async function saveImage(url, savePath) {
  const img = await axios.get(url, { responseType: "stream" });
  const writer = fs.createWriteStream(savePath);
  img.data.pipe(writer);
  await new Promise((r) => writer.on("finish", r));
  return fs.createReadStream(savePath);
}
