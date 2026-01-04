// ===================================================
// Voice Switch Command 🎤 (FIXED bn ERROR)
// ===================================================

const fs = require("fs");
const path = require("path");
const gTTS = require("gtts");

module.exports.config = {
  name: "voice",
  version: "3.1.0",
  credits: "Robin ❤️ Moyna",
  description: "Text to Voice with Voice Switch (Messenger)",
  commandCategory: "media",
  cooldowns: 5
};

module.exports.run = async function ({ api, event, args }) {
  if (args.length < 2) {
    return api.sendMessage(
      "🗣️ ব্যবহার:\n" +
      "/voice girl হ্যালো\n" +
      "/voice boy hello\n" +
      "/voice cute তুমি কেমন\n" +
      "/voice deep system online",
      event.threadID,
      event.messageID
    );
  }

  const voiceType = args[0].toLowerCase();
  const text = args.slice(1).join(" ");

  // ⚠️ IMPORTANT FIX:
  // Node gtts does NOT support 'bn'
  // So we force 'en' for all
  let lang = "en";
  let slow = false;

  switch (voiceType) {
    case "girl":
      slow = false;
      break;

    case "boy":
      slow = false;
      break;

    case "cute":
      slow = true;
      break;

    case "deep":
      slow = true;
      break;

    default:
      return api.sendMessage(
        "❌ Voice type ভুল!\nAvailable: girl | boy | cute | deep",
        event.threadID,
        event.messageID
      );
  }

  const cacheDir = path.join(__dirname, "cache");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

  const filePath = path.join(
    cacheDir,
    `voice_${event.senderID}_${Date.now()}.mp3`
  );

  try {
    const tts = new gTTS(text, lang, slow);

    tts.save(filePath, () => {
      api.sendMessage(
        {
          body: `🎧 Voice: ${voiceType}`,
          attachment: fs.createReadStream(filePath)
        },
        event.threadID,
        () => fs.unlinkSync(filePath),
        event.messageID
      );
    });
  } catch (err) {
    console.error("VOICE ERROR:", err);
    api.sendMessage(
      "😔 Voice বানাতে পারলাম না",
      event.threadID,
      event.messageID
    );
  }
};
