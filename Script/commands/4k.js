const axios = require("axios");
const fs = require("fs");
const path = require("path");


module.exports.config = {
  name: "4k",
  version: "3.0",
  hasPermssion: 0,
  credits: "Robin-Bot",
  description: "Enhance image to 4K using your Cloudflare Worker",
  commandCategory: "Image Editing Tools",
  usages: "Reply to an image or give URL",
  cooldowns: 5,
};

module.exports.run = async function ({ api, event, args }) {
  const { threadID, messageID } = event;

  // Catch image
  const imageUrl = event.messageReply?.attachments?.[0]?.url || args.join(" ");

  if (!imageUrl) {
    return api.sendMessage(
      "📸 Baby, 4K করতে হলে ছবি reply করতে হবে 😘",
      threadID,
      messageID
    );
  }

  const workerAPI = `https://sweet-dream-665c.mr0164008.workers.dev/?img=${encodeURIComponent(
    imageUrl
  )}`;

  const cacheDir = path.join(__dirname, "cache");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
  const filePath = path.join(cacheDir, `4k_${Date.now()}.jpg`);

  try {
    const waitMsg = await api.sendMessage(
      "⏳ Baby wait… তোমার ছবিটা 4K বানাচ্ছি 😘",
      threadID
    );

    // Call Worker JSON
    const res = await axios.get(workerAPI);

    if (!res.data || res.data.success !== true) {
      throw new Error("Worker returned error");
    }

    const finalUrl = res.data.resultImageUrl;

    // Download final 4K image
    const img = await axios.get(finalUrl, {
      responseType: "arraybuffer",
    });

    fs.writeFileSync(filePath, img.data);

    // Send result
    await api.sendMessage(
      {
        body: "✨ Baby তোমার 4K image প্রস্তুত 💛",
        attachment: fs.createReadStream(filePath),
      },
      threadID,
      messageID
    );

    api.unsendMessage(waitMsg.messageID);
    fs.unlinkSync(filePath);
  } catch (e) {
    console.log("4K ERROR:", e.message);

    api.sendMessage(
      "❌ উফ baby… 4K করতে সমস্যা হলো 😢 পরে আবার try করো।",
      threadID,
      messageID
    );
  }
};
