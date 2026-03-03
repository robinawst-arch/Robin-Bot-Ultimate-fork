const axios = require("axios");

module.exports.config = {
  name: "define",
  version: "1.0.0",
  aliases: ["dict", "meaning", "শব্দ", "shobdo"],
  hasPermssion: 0,
  countDown: 5,
  commandCategory: "ইউটিলিটি",
  description: "ইংরেজি শব্দের অর্থ ও সংজ্ঞা দেখুন",
  usages: "{pn} serendipity",
};

// Parts of speech in Bangla
const posNames = {
  noun: "বিশেষ্য",
  verb: "ক্রিয়া",
  adjective: "বিশেষণ",
  adverb: "ক্রিয়া-বিশেষণ",
  pronoun: "সর্বনাম",
  preposition: "অব্যয়",
  conjunction: "সংযোজক",
  interjection: "আবেগসূচক",
  article: "আর্টিকেল",
};

module.exports.run = async ({ api, args, event }) => {
  const word = args[0];
  if (!word)
    return api.sendMessage(
      "❌ একটি ইংরেজি শব্দ লিখুন।\nউদাহরণ: define serendipity",
      event.threadID,
      event.messageID,
    );

  try {
    api.sendMessage(
      "🔍 শব্দের অর্থ খোঁজা হচ্ছে...",
      event.threadID,
      event.messageID,
    );

    const { data } = await axios.get(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`,
      { timeout: 10000 },
    );

    const entry = data[0];
    const phonetic = entry.phonetics?.find((p) => p.text)?.text || "";

    let msg =
      `📖 শব্দের অর্থ\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `🔤 শব্দ: ${entry.word.toUpperCase()}\n`;

    if (phonetic) msg += `🔊 উচ্চারণ: ${phonetic}\n`;
    msg += `━━━━━━━━━━━━━━━━\n`;

    // Show up to 3 meanings
    const meanings = entry.meanings.slice(0, 3);
    for (const meaning of meanings) {
      const posbn = posNames[meaning.partOfSpeech] || meaning.partOfSpeech;
      msg += `\n📌 পদ: ${posbn} (${meaning.partOfSpeech})\n`;

      // Show up to 2 definitions per meaning
      const defs = meaning.definitions.slice(0, 2);
      defs.forEach((d, i) => {
        msg += `${i + 1}. ${d.definition}\n`;
        if (d.example) msg += `   💡 উদাহরণ: "${d.example}"\n`;
      });

      if (meaning.synonyms && meaning.synonyms.length > 0) {
        msg += `🔗 সমার্থক: ${meaning.synonyms.slice(0, 4).join(", ")}\n`;
      }
    }

    msg += `━━━━━━━━━━━━━━━━\n🤖 Robin Bot`;

    api.sendMessage(msg, event.threadID, event.messageID);
  } catch (e) {
    console.error("Define error:", e.message);
    api.sendMessage(
      `❌ "${word}" শব্দের অর্থ পাওয়া যায়নি।\nশুধুমাত্র ইংরেজি শব্দ সমর্থিত।`,
      event.threadID,
      event.messageID,
    );
  }
};
