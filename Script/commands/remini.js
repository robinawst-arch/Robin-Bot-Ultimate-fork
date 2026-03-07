const axios = require("axios");
const fs = require("fs-extra");

module.exports.config = {
  name: "remini",
  version: "1.0",
  author: "Robin",
  role: 0,
  shortDescription: "Enhance image",
  longDescription: "Remini style photo enhance",
  category: "image",
  guide: "{pn} reply photo"
};

module.exports.onStart = async function ({ api, event }) {
  try {

    if (!event.messageReply || !event.messageReply.attachments[0]) {
      return api.sendMessage("📸 Reply to an image.", event.threadID, event.messageID);
    }

    const img = event.messageReply.attachments[0].url;

    api.sendMessage("🔄 Enhancing photo...", event.threadID, event.messageID);

    const apiUrl = `https://remini.mr5442135.workers.dev/?url=${encodeURIComponent(img)}`;

    const res = await axios({
      url: apiUrl,
      method: "GET",
      responseType: "arraybuffer"
    });

    const path = __dirname + "/cache/remini.jpg";
    fs.writeFileSync(path, Buffer.from(res.data));

    api.sendMessage({
      body: "✨ Photo enhanced successfully!",
      attachment: fs.createReadStream(path)
    }, event.threadID, () => fs.unlinkSync(path), event.messageID);

  } catch (e) {
    api.sendMessage("❌ Enhance failed.", event.threadID, event.messageID);
  }
};
