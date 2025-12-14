// =============================================
// TIKVID - Random Bangladeshi TikTok Videos
// Uses multiple backup APIs
// =============================================

const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "tikvid",
  aliases: ["tiktok", "tikbd"],
  version: "3.0.0",
  hasPermssion: 0,
  credits: "ROBIN",
  description: "Random Bangladeshi TikTok videos",
  commandCategory: "Media",
  usages: "[tikvid]",
  cooldowns: 10,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;

  try {
    api.sendMessage("🔍 Fetching random TikTok video...", threadID, messageID);

    let videoUrl = null;
    let videoData = {
      title: "Bangladeshi TikTok Video",
      author: "TikToker",
      likes: "N/A",
      comments: "N/A",
    };

    // API 1: TikTok via SnapTik
    if (!videoUrl) {
      try {
        const response = await axios.get(
          `https://www.tikwm.com/api/feed/list`,
          {
            timeout: 12000,
            headers: { "User-Agent": "Mozilla/5.0" },
          }
        );

        if (response.data?.data?.videos?.length > 0) {
          const video =
            response.data.data.videos[
              Math.floor(
                Math.random() * Math.min(20, response.data.data.videos.length)
              )
            ];
          videoUrl = video.play || video.wmplay;
          videoData = {
            title: video.title || "TikTok Video",
            author: video.author?.unique_id || "Unknown",
            likes: video.digg_count || 0,
            comments: video.comment_count || 0,
          };
          console.log(`[TIKVID] ✅ Got video from API 1`);
        }
      } catch (e) {
        console.log(`[TIKVID] API 1 failed: ${e.message}`);
      }
    }

    // API 2: Alternative source
    if (!videoUrl) {
      try {
        const response = await axios.post(
          `https://www.tikwm.com/api/`,
          {
            url: "https://www.tiktok.com/@tiktok/video/7106594312292453675",
            hd: 1,
          },
          {
            timeout: 12000,
            headers: { "Content-Type": "application/json" },
          }
        );

        if (response.data?.data?.play) {
          videoUrl = response.data.data.play;
          videoData.title = response.data.data.title || "TikTok Video";
          console.log(`[TIKVID] ✅ Got video from API 2`);
        }
      } catch (e) {
        console.log(`[TIKVID] API 2 failed: ${e.message}`);
      }
    }

    if (!videoUrl) {
      return api.sendMessage(
        "❌ TikTok services are temporarily unavailable. Please try again in a few minutes!",
        threadID,
        messageID
      );
    }

    // Create cache directory
    const cacheDir = path.join(__dirname, "cache");
    fs.ensureDirSync(cacheDir);

    // Download video
    const videoPath = path.join(cacheDir, `tikvid_${Date.now()}.mp4`);

    console.log(`[TIKVID] Downloading...`);
    const videoResponse = await axios({
      url: videoUrl,
      method: "GET",
      responseType: "stream",
      timeout: 40000,
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const writer = fs.createWriteStream(videoPath);
    videoResponse.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
      setTimeout(() => reject(new Error("Timeout")), 35000);
    });

    const fileSize = (fs.statSync(videoPath).size / 1024 / 1024).toFixed(2);
    console.log(`[TIKVID] Downloaded ${fileSize}MB`);

    // Send video
    const message = `🎬 Random TikTok Video\n\n👤 ${
      videoData.author
    }\n📝 ${videoData.title.substring(0, 80)}${
      videoData.title.length > 80 ? "..." : ""
    }\n❤️ ${videoData.likes} | 💬 ${videoData.comments}`;

    await api.sendMessage(
      { body: message, attachment: fs.createReadStream(videoPath) },
      threadID,
      (err) => {
        if (err) console.error(`[TIKVID] Send failed: ${err.message}`);
        try {
          fs.unlinkSync(videoPath);
          console.log(`[TIKVID] ✅ Sent & cleaned`);
        } catch (e) {}
      },
      messageID
    );
  } catch (error) {
    console.error(`[TIKVID] Error: ${error.message}`);
    return api.sendMessage(
      `❌ ${error.message}\n\nTry /tikvid again!`,
      threadID,
      messageID
    );
  }
};
