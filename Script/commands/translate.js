const axios = require("axios");

module.exports.config = {
  name: "translate",
  version: "1.0.0",
  aliases: ["tr", "অনুবাদ", "anubad"],
  hasPermssion: 0,
  countDown: 5,
  commandCategory: "ইউটিলিটি",
  description: "যেকোনো ভাষায় লেখা অনুবাদ করুন",
  usages:
    "{pn} [ভাষা কোড] [লেখা]\nউদাহরণ:\n{pn} bn Hello World\n{pn} en আমি ভালো আছি",
};

// Common language codes for reference
const langNames = {
  bn: "বাংলা",
  en: "ইংরেজি",
  hi: "হিন্দি",
  ar: "আরবি",
  fr: "ফরাসি",
  de: "জার্মান",
  es: "স্পেনিশ",
  zh: "চীনা",
  ja: "জাপানি",
  ko: "কোরিয়ান",
  ru: "রাশিয়ান",
  tr: "তুর্কি",
  pt: "পর্তুগিজ",
  it: "ইতালিয়ান",
  ur: "উর্দু",
};

module.exports.run = async ({ api, args, event }) => {
  const lang = args[0];
  const text = args.slice(1).join(" ");

  if (!lang || !text) {
    return api.sendMessage(
      "❌ সঠিকভাবে লিখুন!\n\n" +
        "📝 ব্যবহার: translate [ভাষা] [লেখা]\n" +
        "উদাহরণ:\n" +
        "• translate bn Hello World\n" +
        "• translate en আমি ভালো আছি\n\n" +
        "🌐 কিছু ভাষা কোড:\n" +
        "bn = বাংলা | en = ইংরেজি\n" +
        "hi = হিন্দি | ar = আরবি\n" +
        "fr = ফরাসি | de = জার্মান\n" +
        "zh = চীনা | ja = জাপানি",
      event.threadID,
      event.messageID,
    );
  }

  try {
    api.sendMessage("🔄 অনুবাদ করা হচ্ছে...", event.threadID, event.messageID);

    const { data } = await axios.get(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${lang}`,
      { timeout: 10000 },
    );

    if (data.responseStatus !== 200) {
      return api.sendMessage(
        "❌ অনুবাদ করতে সমস্যা হয়েছে।",
        event.threadID,
        event.messageID,
      );
    }

    const targetLangName = langNames[lang] || lang.toUpperCase();

    const msg =
      `🌐 অনুবাদ সম্পন্ন!\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `📝 মূল লেখা:\n${text}\n\n` +
      `✅ ${targetLangName}-তে অনুবাদ:\n${data.responseData.translatedText}\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `🤖 Robin Bot`;

    api.sendMessage(msg, event.threadID, event.messageID);
  } catch (e) {
    console.error("Translate error:", e.message);
    api.sendMessage(
      "❌ অনুবাদ করা যায়নি। আবার চেষ্টা করুন।",
      event.threadID,
      event.messageID,
    );
  }
};
