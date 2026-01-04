// ===================================================
// ElevenLabs Voice Command 🎤
// Usage:
// /voice girl হ্যালো সবাই
// /voice boy hello everyone
// ===================================================

const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports.config = {
  name: "voice",
  version: "4.0.0",
  credits: "Robin ❤️ Moyna",
  description: "ElevenLabs TTS (Girl/Boy, Bangla & English)",
  commandCategory: "media",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  if (args.length < 2) {
    return api.sendMessage(
      "🗣️ ব্যবহার:\n/voice girl হ্যালো সবাই\n/voice boy hello everyone",
      event.threadID,
      event.messageID
    );
  }

  const mode = args[0].toLowerCase();
  const text = args.slice(1).join(" ");

  const apiKey = process.env.ELEVEN_API_KEY;
  if (!apiKey) {
    return api.sendMessage(
      "❌ ElevenLabs API key পাওয়া যায়নি (.env)",
      event.threadID,
      event.messageID
    );
  }

  let voiceId;
  if (mode === "girl") voiceId = process.env.ELEVEN_VOICE_GIRL;
  else if (mode === "boy") voiceId = process.env.ELEVEN_VOICE_BOY;
  else {
    return api.sendMessage(
      "❌ Voice type ভুল!\nAvailable: girl | boy",
      event.threadID,
      event.messageID
    );
  }

  const cacheDir = path.join(__dirname, "cache");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

  const filePath = path.join(
    cacheDir,
    `eleven_${event.senderID}_${Date.now()}.mp3`
  );

  try {
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    const response = await axios.post(
      url,
      {
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.75
        }
      },
      {
        responseType: "arraybuffer",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey
        }
      }
    );

    fs.writeFileSync(filePath, response.data);

    api.sendMessage(
      {
        body: `🎧 Voice (${mode})`,
        attachment: fs.createReadStream(filePath)
      },
      event.threadID,
      () => fs.unlinkSync(filePath),
      event.messageID
    );
  } catch (err) {
    console.error("ELEVENLABS ERROR:", err.response?.data || err.message);
    api.sendMessage(
      "⚠️ Voice বানাতে সমস্যা হয়েছে! পরে আবার চেষ্টা করো।",
      event.threadID,
      event.messageID
    );
  }
};
