const axios = require("axios");

// Bangla quotes collection (local fallback)
const banglaQuotes = [
  { content: "শিক্ষাই জাতির মেরুদণ্ড।", author: "বাংলা প্রবাদ" },
  { content: "পরিশ্রম সৌভাগ্যের প্রসূতি।", author: "বাংলা প্রবাদ" },
  { content: "সময়ের এক ফোঁড়, অসময়ের দশ ফোঁড়।", author: "বাংলা প্রবাদ" },
  { content: "ব্যর্থতাই সাফল্যের মূল।", author: "বাংলা প্রবাদ" },
  {
    content:
      "আলো বলে, অন্ধকার তুই বড় কালো। অন্ধকার বলে, ভাই, তাই তো তোমায় আমার বড় ভালো।",
    author: "রবীন্দ্রনাথ ঠাকুর",
  },
  {
    content: "যখন আলো জ্বালো তখন থাকি কাছে, আঁধার নামলে সরে যাই।",
    author: "রবীন্দ্রনাথ ঠাকুর",
  },
  {
    content:
      "জীবন এবং সময় জগতের সেরা শিক্ষক। জীবন শেখায় সময়কে সঠিকভাবে ব্যবহার করতে।",
    author: "রবীন্দ্রনাথ ঠাকুর",
  },
  { content: "মানুষের উপর বিশ্বাস হারানো পাপ।", author: "রবীন্দ্রনাথ ঠাকুর" },
  {
    content: "স্বাধীনতা অর্জনের চেয়ে স্বাধীনতা রক্ষা করা কঠিন।",
    author: "বঙ্গবন্ধু শেখ মুজিবুর রহমান",
  },
  {
    content: "একটি মোমবাতি আরেকটি মোমবাতি জ্বালালে তার নিজের আলো কমে না।",
    author: "বাংলা প্রবাদ",
  },
  { content: "কষ্ট না করলে কেষ্ট মেলে না।", author: "বাংলা প্রবাদ" },
  {
    content: "নিজেকে ভালোবাসো, তাহলে পৃথিবী তোমাকে ভালোবাসবে।",
    author: "কাজী নজরুল ইসলাম",
  },
  {
    content: "জীবনে যদি কিছু পেতে চাও, তাহলে কিছু হারাতেও প্রস্তুত থাকো।",
    author: "বাংলা প্রবাদ",
  },
  {
    content: "স্বপ্ন দেখতে হবে কারণ স্বপ্নগুলোই একদিন বাস্তব হয়।",
    author: "ড. এপিজে আব্দুল কালাম",
  },
  {
    content: "হাজার হোক তুমি বাঙালি — ভুলে থেকো না কখনো।",
    author: "রবীন্দ্রনাথ ঠাকুর",
  },
];

module.exports.config = {
  name: "quote",
  version: "1.0.0",
  aliases: ["উক্তি", "ukti", "bani"],
  hasPermssion: 0,
  countDown: 5,
  commandCategory: "অনুপ্রেরণা",
  description: "অনুপ্রেরণামূলক বাংলা উক্তি পড়ুন",
  usages: "{pn} — বাংলা উক্তি\n{pn} en — ইংরেজি উক্তি",
};

module.exports.run = async ({ api, args, event }) => {
  const quote = banglaQuotes[Math.floor(Math.random() * banglaQuotes.length)];

  const msg =
    `💬 বাংলা উক্তি\n` +
    `━━━━━━━━━━━━━━━━\n` +
    `"${quote.content}"\n\n` +
    `✍️ — ${quote.author}\n` +
    `━━━━━━━━━━━━━━━━\n` +
    `🤖 Robin Bot`;

  api.sendMessage(msg, event.threadID, event.messageID);
};
