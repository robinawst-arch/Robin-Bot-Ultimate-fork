module.exports = {
  config: {
    name: "autodl",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "Robin-Bot",
    description: "Auto download from Facebook, Instagram, and TikTok links",
    commandCategory: "media",
    usages: "Paste a Facebook, Instagram, or TikTok link",
    cooldowns: 5,
  },

  run: async function ({ api, event }) {
    const axios = require("axios");
    const fs = require("fs-extra");
    const path = require("path");

    const content = event.body ? event.body.trim() : "";

    if (!content.startsWith("http")) {
      return api.sendMessage(
        "❌ Please paste a valid video link\n\nSupported: YouTube, Facebook, TikTok, Instagram",
        event.threadID,
        event.messageID
      );
    }

    try {
      api.setMessageReaction("⏳", event.messageID, (err) => {}, true);

      let downloadUrl = null;
      let title = "Video";

      // Check if YouTube link
      const ytRegex =
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([\w-]{11})/;
      const ytMatch = content.match(ytRegex);

      if (ytMatch) {
        // Use robin-api for YouTube (mp3 format - more reliable)
        const videoId = ytMatch[1];
        const API_BASE = "https://robin-api.rf.gd";

        try {
          const altUrl = `https://api.ryzendesu.vip/api/downloader/ytdl?url=https://youtube.com/watch?v=${videoId}`;
          const response = await axios.get(altUrl, { timeout: 15000 });

          if (response.data && response.data.videoUrl) {
            downloadUrl = response.data.videoUrl;
            title = response.data.title || title;
          }
        } catch (apiError) {
          console.log("Video API error:", apiError.message);
        }
      } else {
        // Use universal downloader API for other platforms
        const apiUrl = `https://api.ryzendesu.vip/api/downloader/allinone?url=${encodeURIComponent(
          content
        )}`;
        const response = await axios.get(apiUrl);

        if (response.data && response.data.videoUrl) {
          downloadUrl = response.data.videoUrl;
          title = response.data.title || title;
        }
      }

      if (!downloadUrl) {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return api.sendMessage(
          "❌ Download failed! Link not supported or API error.",
          event.threadID,
          event.messageID
        );
      }

      // Download video
      const filePath = path.join(
        __dirname,
        "cache",
        `autodl_${Date.now()}.mp4`
      );
      const video = (
        await axios.get(downloadUrl, {
          responseType: "arraybuffer",
          timeout: 30000,
        })
      ).data;
      fs.writeFileSync(filePath, Buffer.from(video));

      api.setMessageReaction("✅", event.messageID, (err) => {}, true);

      return api.sendMessage(
        {
          body: `✅ ${title}\n🎬 Robin-Bot AutoDL`,
          attachment: fs.createReadStream(filePath),
        },
        event.threadID,
        () => fs.unlinkSync(filePath),
        event.messageID
      );
    } catch (error) {
      console.error("Error in autodl:", error.message);
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
      return api.sendMessage(
        `❌ Download failed: ${error.message}`,
        event.threadID,
        event.messageID
      );
    }
  },

  handleEvent: async function ({ api, event }) {
    const axios = require("axios");
    const fs = require("fs-extra");
    const path = require("path");

    const content = event.body ? event.body.trim() : "";

    if (!content.startsWith("http")) return;

    // Only process Facebook, Instagram, and TikTok links
    const fbRegex = /facebook\.com|fb\.watch|fb\.com/i;
    const igRegex = /instagram\.com|instagr\.am/i;
    const ttRegex = /tiktok\.com|vt\.tiktok\.com/i;

    if (
      !fbRegex.test(content) &&
      !igRegex.test(content) &&
      !ttRegex.test(content)
    )
      return;

    console.log("AutoDL triggered for:", content);

    try {
      api.setMessageReaction("⏳", event.messageID, (err) => {}, true);

      let downloadUrl = null;
      let title = "Video";

      const apiUrl = `https://api.ryzendesu.vip/api/downloader/allinone?url=${encodeURIComponent(
        content
      )}`;

      console.log("Calling API:", apiUrl);

      const response = await axios.get(apiUrl, { timeout: 15000 });

      console.log("API Response:", response.data);

      if (response.data && response.data.videoUrl) {
        downloadUrl = response.data.videoUrl;
        title = response.data.title || title;
        console.log("Download URL found:", downloadUrl);
      }

      if (!downloadUrl) {
        api.setMessageReaction("❌", event.messageID, (err) => {}, true);
        return;
      }

      const filePath = path.join(
        __dirname,
        "cache",
        `autodl_${Date.now()}.mp3`
      );
      const video = (
        await axios.get(downloadUrl, {
          responseType: "arraybuffer",
          timeout: 30000,
        })
      ).data;
      fs.writeFileSync(filePath, Buffer.from(video));

      api.setMessageReaction("✅", event.messageID, (err) => {}, true);

      return api.sendMessage(
        {
          body: `✅ ${title}\n🎬 Robin-Bot AutoDL`,
          attachment: fs.createReadStream(filePath),
        },
        event.threadID,
        () => fs.unlinkSync(filePath),
        event.messageID
      );
    } catch (error) {
      console.error("Error in autodl handleEvent:", error.message);
      api.setMessageReaction("❌", event.messageID, (err) => {}, true);
    }
  },
};
