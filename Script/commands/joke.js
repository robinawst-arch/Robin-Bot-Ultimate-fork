const axios = require("axios");

// Bangla jokes collection (local - no API needed)
const banglaJokes = [
  {
    setup: "শিক্ষক: তুমি কেন দেরি করে এলে?",
    punchline:
      "ছাত্র: স্যার, রাস্তায় একটা সাইনবোর্ড দেখলাম - 'স্কুল এগিয়ে আছে, ধীরে চলুন' তাই ধীরে ধীরে এলাম! 😂",
  },
  {
    setup: "ডাক্তার: আপনার শরীরে কোনো সমস্যা নেই।",
    punchline:
      "রোগী: তাহলে এই ব্যথা কোথা থেকে আসছে?\nডাক্তার: সেটা আমার সমস্যা না! 😂",
  },
  {
    setup: "বাবা: পরীক্ষায় কত পেয়েছিস?",
    punchline:
      "ছেলে: বাবা, পানির নিচে কত ডিগ্রি হলে বরফ হয়?\nবাবা: শূন্য ডিগ্রি।\nছেলে: আমিও শূন্য পেয়েছি! 😭",
  },
  {
    setup: "স্বামী: আজকে রান্না একটু বেশি নোনতা হয়েছে।",
    punchline:
      "স্ত্রী: তাহলে কম খাও। লবণ কম দিলে স্বাদ থাকে না, বেশি দিলে তুমি অভিযোগ করো! 😆",
  },
  {
    setup: "ছাত্র: স্যার, আমি পরীক্ষায় ফেল করেছি কারণ আমি অসুস্থ ছিলাম।",
    punchline: "শিক্ষক: কী অসুখ?\nছাত্র: পড়া মনে রাখার অসুখ! 😂",
  },
  {
    setup: "মা: তুই সারাদিন মোবাইল নিয়ে বসে থাকিস কেন?",
    punchline:
      "ছেলে: মা, তুমিই বলেছিলে সময় নষ্ট না করতে। মোবাইল চালালে সময় কোথায় যায় বুঝতেই পারি না! 😅",
  },
  {
    setup: "বন্ধু: তোর বিয়ে হলে কেমন লাগবে?",
    punchline:
      "আমি: একটু চিন্তা হচ্ছে... আমিই তো প্রতিদিন রান্না করি। বউ আসলে কে রান্না করবে? 😂",
  },
  {
    setup: "ডাক্তার: ধূমপান ছেড়ে দিন, নাহলে মরে যাবেন।",
    punchline:
      "রোগী: আমার দাদুও ধূমপান করতেন, ৯৫ বছর বাঁচলেন।\nডাক্তার: তিনি ছেড়ে দিয়েছিলেন বলেই! 😆",
  },
  {
    setup: "শিক্ষক: সূর্য কোন দিকে ওঠে?",
    punchline:
      "ছাত্র: স্যার, আমাদের বাড়ি পূর্বে, কিন্তু আমি কখনো এত সকালে উঠিনি তাই নিশ্চিত না! 😂",
  },
  {
    setup: "বাবা: পরীক্ষায় প্রথম হলে সাইকেল কিনে দেব।",
    punchline:
      "ছেলে: বাবা, আমি দ্বিতীয় হয়েছি।\nবাবা: তাহলে একটা চাকা কিনে দেব! 😂",
  },
];

module.exports.config = {
  name: "joke",
  version: "1.0.0",
  aliases: ["jokes", "হাসি", "koutuk"],
  hasPermssion: 0,
  countDown: 5,
  commandCategory: "মজা",
  description: "মজার বাংলা কৌতুক পড়ুন",
  usages: "{pn}",
};

module.exports.run = async ({ api, args, event }) => {
  try {
    // Pick random bangla joke
    const joke = banglaJokes[Math.floor(Math.random() * banglaJokes.length)];

    const msg =
      `😂 বাংলা কৌতুক\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `❓ ${joke.setup}\n\n` +
      `💬 ${joke.punchline}\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `🤖 Robin Bot | আবার পড়তে: joke`;

    api.sendMessage(msg, event.threadID, event.messageID);
  } catch (e) {
    console.error("Joke error:", e.message);
    api.sendMessage(
      "❌ কৌতুক আনতে সমস্যা হয়েছে।",
      event.threadID,
      event.messageID,
    );
  }
};
