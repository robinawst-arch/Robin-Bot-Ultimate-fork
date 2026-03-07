const axios = require("axios");
const fs = require("fs-extra");
const FormData = require("form-data");

module.exports.config = {
  name: "remini",
  version: "1.0",
  author: "Robin",
  countDown: 5,
  role: 0,
  shortDescription: "Remini enhance",
  longDescription: "Enhance photo using AI",
  category: "image",
  guide: "{pn} reply to photo"
};

module.exports.onStart = async function ({ api, event }) {
  try {

    if (!event.messageReply || !event.messageReply.attachments[0]) {
      return api.sendMessage("📸 Please reply to an image.", event.threadID, event.messageID);
    }

    const imgUrl = event.messageReply.attachments[0].url;
    const img = (await axios.get(imgUrl, { responseType: "arraybuffer" })).data;

    const form = new FormData();
    form.append("model_version", "1");
    form.append("image", Buffer.from(img), "image.jpg");

    const res = await axios({
      method: "POST",
      url: "https://inferenceengine.vyro.ai/enhance",
      headers: {
        ...form.getHeaders(),
        "User-Agent": "okhttp/4.9.3"
      },
      data: form,
      responseType: "arraybuffer"
    });

    const path = __dirname + "/cache/remini.jpg";
    fs.writeFileSync(path, Buffer.from(res.data));

    api.sendMessage({
      body: "✨ Photo enhanced successfully!",
      attachment: fs.createReadStream(path)
    }, event.threadID, () => fs.unlinkSync(path), event.messageID);

  } catch (e) {
    api.sendMessage("❌ Image enhance failed.", event.threadID, event.messageID);
  }
};
