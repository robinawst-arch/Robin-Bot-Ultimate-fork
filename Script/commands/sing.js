const axios = require("axios");
const fs = require("fs");
const path = require("path");
const yts = require("yt-search");

// Robin YouTube API (InfinityFree)
const API_BASE = "https://robin-api.rf.gd";

module.exports.config = {
  name: "sing",
  version: "3.0.0",
  aliases: ["play", "music"],
  credits: "Robin-Bot",
  hasPermssion: 0,
  countDown: 5,
  commandCategory: "media",
  description: "Play any song from YouTube",
  usages: "{pn} despacito",
};

module.exports.run = async ({ api, args, event }) => {
  const checkUrl =
    /(?:youtu\.be\/|youtube\.com\/(?:shorts\/|watch\?v=|embed\/|v\/))([\w-]{11})/;

  // if user sends YouTube link
  if (checkUrl.test(args[0])) {
    const id = args[0].match(checkUrl)[1];

    try {
      api.sendMessage("⏳ Downloading...", event.threadID, event.messageID);

      const response = await axios.get(
        `${API_BASE}/ytDl3.php?link=${id}&format=mp3`
      );

      if (!response.data || !response.data.downloadLink) {
        return api.sendMessage(
          "❌ Download failed!",
          event.threadID,
          event.messageID
        );
      }

      const filePath = path.join(__dirname, "cache", `audio_${Date.now()}.mp3`);
      await saveAudio(response.data.downloadLink, filePath);

      return api.sendMessage(
        {
          body: `🎧 ${response.data.title}`,
          attachment: fs.createReadStream(filePath),
        },
        event.threadID,
        () => fs.unlinkSync(filePath),
        event.messageID
      );
    } catch (e) {
      console.error("Download error:", e.message);
      return api.sendMessage(
        "❌ Download failed!",
        event.threadID,
        event.messageID
      );
    }
  }

  // search mode
  const query = args.join(" ");

  let results;
  try {
    // Use local yt-search (reliable)
    const searchResult = await yts(query);
    results = searchResult.videos.slice(0, 6).map((v) => ({
      id: v.videoId,
      title: v.title,
      time: v.timestamp,
      thumbnail: v.thumbnail,
      channel: { name: v.author.name },
    }));
  } catch {
    return api.sendMessage("❌ Search Error!", event.threadID, event.messageID);
  }

  if (!results || results.length === 0)
    return api.sendMessage(
      "⭕ No results found.",
      event.threadID,
      event.messageID
    );

  let msg = "🎵 Select a song:\n\n";
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
    event.threadID,
    (err, info) => {
      if (!err && info && info.messageID) {
        global.client.handleReply.push({
          name: module.exports.config.name,
          messageID: info.messageID,
          author: event.senderID,
          results,
        });
      }
    },
    event.messageID
  );
};

// ===== HANDLE REPLY =====
module.exports.handleReply = async ({ api, event, handleReply }) => {
  const choice = Number(event.body);
  if (isNaN(choice) || choice < 1 || choice > handleReply.results.length)
    return api.sendMessage(
      "❌ Invalid choice.",
      event.threadID,
      event.messageID
    );

  const vid = handleReply.results[choice - 1].id;

  try {
    api.sendMessage("⏳ Downloading...", event.threadID, event.messageID);

    const response = await axios.get(
      `${API_BASE}/ytDl3.php?link=${vid}&format=mp3`
    );

    if (!response.data || !response.data.downloadLink) {
      return api.sendMessage(
        "❌ Download failed!",
        event.threadID,
        event.messageID
      );
    }

    const filePath = path.join(__dirname, "cache", `song_${Date.now()}.mp3`);
    await saveAudio(response.data.downloadLink, filePath);

    await api.unsendMessage(handleReply.messageID);

    api.sendMessage(
      {
        body: `🎧 ${response.data.title}`,
        attachment: fs.createReadStream(filePath),
      },
      event.threadID,
      () => fs.unlinkSync(filePath),
      event.messageID
    );
  } catch (e) {
    console.error("Sing download error:", e.message);
    return api.sendMessage(
      "❌ Download failed!",
      event.threadID,
      event.messageID
    );
  }
};

// ===== Download Audio =====
async function saveAudio(url, savePath) {
  const audio = (await axios.get(url, { responseType: "arraybuffer" })).data;
  fs.writeFileSync(savePath, Buffer.from(audio));
}

// ===== Download Thumbnail =====
async function saveImage(url, savePath) {
  const img = await axios.get(url, { responseType: "stream" });
  const writer = fs.createWriteStream(savePath);
  img.data.pipe(writer);
  await new Promise((r) => writer.on("finish", r));
  return fs.createReadStream(savePath);
}
