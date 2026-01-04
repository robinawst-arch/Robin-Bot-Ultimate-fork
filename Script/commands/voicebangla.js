// ===========================================
// /voicebangla Command (Bangla only) 🎤
// Uses Bhashini TTS API
// ===========================================

const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports.config = {
  name: "voicebangla",
  version: "1.0",
  credits: "Robin ❤️ Moyna",
  description: "Bangla text to voice using Bhashini API",
  commandCategory: "media",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  const text = args.join(" ");
  if (!text) {
    return api.sendMessage(
      "📢 ব্যবহার: /voicebangla তোমার বাংলা লিখে ফেলো",
      event.threadID,
      event.messageID
    );
  }

  const voiceApiUrl = "https://tts.bhashini.ai/api/tts?lang=bn"; // Example
  const cacheDir = path.join(__dirname, "cache");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

  const filePath = path.join(cacheDir, `bhashini_${Date.now()}.mp3`);

  try {
    const response = await axios.post(
      voiceApiUrl,
      { text: text },
      { responseType: "arraybuffer" }
    );

    fs.writeFileSync(filePath, response.data);

    api.sendMessage(
      {
        body: "🔊 এখানে তোমার Bangla Voice",
        attachment: fs.createReadStream(filePath)
      },
      event.threadID,
      () => fs.unlinkSync(filePath),
      event.messageID
    );
  } catch (err) {
    console.error("Bangla Voice Error:", err.message);
    api.sendMessage(
      "⚠️ Voice বানাতে সমস্যা হয়েছে! পরে আবার চেষ্টা করো।",
      event.threadID,
      event.messageID
    );
  }
};
