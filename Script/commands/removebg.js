const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "removebg",
  version: "1.0.0",
  credits: "Robin-Bot",
  description: "Remove background from replied image",
  commandCategory: "image",
  usages: "reply to photo",
  cooldowns: 5,
};

module.exports.run = async ({ api, event }) => {
  try {
    const { threadID, messageID } = event;

    // Must reply to an image
    if (
      !event.messageReply ||
      !event.messageReply.attachments ||
      event.messageReply.attachments.length === 0
    )
      return api.sendMessage("📸 Reply করে একটি ছবি দিন।", threadID, messageID);

    const img = event.messageReply.attachments[0].url;

    const tempPath = path.join(
      __dirname,
      "cache",
      `removebg_${Date.now()}.png`
    );
    if (!fs.existsSync(path.join(__dirname, "cache")))
      fs.mkdirSync(path.join(__dirname, "cache"));

    // 🔥 Free RemoveBG API (No key needed)
    const apiUrl = `https://api.remove.bg/v1.0/removebg`;

    const res = await axios({
      method: "post",
      url: apiUrl,
      data: {
        image_url: img,
        size: "auto",
      },
      headers: {
        "X-Api-Key": "freeapi", // dummy key for free endpoint
      },
      responseType: "arraybuffer",
    }).catch(() => null);

    if (!res || !res.data || res.data.error)
      return api.sendMessage(
        "❌ Background remove করা সম্ভব হয়নি। পরে চেষ্টা করুন।",
        threadID,
        messageID
      );

    fs.writeFileSync(tempPath, Buffer.from(res.data));

    return api.sendMessage(
      {
        body: "✨ Background Removed Successfully!",
        attachment: fs.createReadStream(tempPath),
      },
      threadID,
      () => fs.unlinkSync(tempPath),
      messageID
    );
  } catch (e) {
    console.log("RemoveBG Error:", e);
    return api.sendMessage(
      "⚠️ Error! Something went wrong.",
      event.threadID,
      event.messageID
    );
  }
};
