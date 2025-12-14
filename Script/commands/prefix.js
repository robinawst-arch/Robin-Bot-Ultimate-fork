// ===== PREFIX INFO COMMAND =====
// Trigger: when someone sends:  prefix
// Shows: Bot name, total commands, ping, system prefix, box prefix, time & date, with a random GIF

const fs = require("fs");
const path = require("path");
const request = require("request");
const moment = require("moment-timezone");

module.exports.config = {
  name: "prefix",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Robin-Bot",
  description: "Show prefix & system info in a styled card",
  commandCategory: "system",
  usages: "",
  cooldowns: 5,
};

// এই কমান্ডটা event থেকে auto trigger হবে (পুরানো obfuscated কোডের মত)
module.exports.handleEvent = async function ({ api, event }) {
  try {
    const { threadID, messageID, body } = event;
    if (!body) return;

    // শুধু যখন কেউ ঠিকভাবে "prefix" লিখবে তখন ট্রিগার হবে
    const text = body.trim().toLowerCase();
    if (text !== "prefix") return;

    console.log("Prefix triggered");

    const startTime = Date.now();

    // === Time & Date (Bangladesh Time) ===
    const now = moment.tz("Asia/Dhaka");
    let dayName = now.format("dddd"); // e.g. Sunday
    const timeStr = now.format("HH:mm:ss | DD/MM/YYYY");

    // Fancy Day Names চাইলে:
    const fancyDays = {
      Sunday: "𝚂𝚞𝚗𝚍𝚊𝚢",
      Monday: "𝙼𝚘𝚗𝚍𝚊𝚢",
      Tuesday: "𝚃𝚞𝚎𝚜𝚍𝚊𝚢",
      Wednesday: "𝚆𝚎𝚍𝚗𝚎𝚜𝚍𝚊𝚢",
      Thursday: "𝚃𝚑𝚞𝚛𝚜𝚍𝚊𝚢",
      Friday: "𝙵𝚛𝚒𝚍𝚊𝚢",
      Saturday: "𝚂𝚊𝚝𝚞𝚛𝚍𝚊𝚢",
    };
    dayName = fancyDays[dayName] || dayName;

    // === Global config & thread prefix ===
    const { PREFIX, BOTNAME } = global.config;
    const threadData = global.data.threadData.get(threadID) || {};
    const threadPrefix = threadData.PREFIX || PREFIX;

    // Total commands count (যদি থাকে)
    const totalCommands = global.client?.commands?.size || "N/A";

    // === Random GIF list (তুই চাইলে এগুলো বদলাতে পারিস) ===
    const imageUrls = [
      "https://i.imgur.com/UnTsdhO.gif",
      "https://i.imgur.com/1TqMV65.gif",
      "https://i.imgur.com/ksuAxtx.gif",
      "https://i.imgur.com/8tNmUVM.gif",
      "https://i.imgur.com/8SoXgGv.gif",
    ];

    const randomImg = imageUrls[Math.floor(Math.random() * imageUrls.length)];

    // Validate image URL
    if (!randomImg) {
      return api.sendMessage(
        "Error: No image URL available",
        threadID,
        messageID
      );
    }

    // Cache path
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const filePath = path.join(cacheDir, "prefix.gif");

    // === Download image then send message ===
    request(encodeURI(randomImg))
      .pipe(fs.createWriteStream(filePath))
      .on("close", () => {
        const ping = Date.now() - startTime;

        const msg =
          "╔══════𝗣𝗥𝗘𝗙𝗜𝗫 𝗙𝗜𝗫 𝗜𝗡𝗙𝗢══╗\n" +
          "┃ ✪ 𝗕𝗼𝘁 𝗡𝗮𝗺𝗲: " +
          BOTNAME +
          "\n" +
          "┃ ❁ 𝗖𝗼𝗺𝗺𝗮𝗻𝗱𝘀: " +
          totalCommands +
          "\n" +
          "┃ ✴ 𝗣𝗶𝗻𝗴: " +
          ping +
          "ms\n" +
          "┃ ✿ 𝗦𝘆𝘀𝘁𝗲𝗺 𝗣𝗿𝗲𝗳𝗶𝘅: " +
          PREFIX +
          "\n" +
          "┃ ✦ 𝗚𝗿𝗼𝘂𝗽 𝗣𝗿𝗲𝗳𝗶𝘅: " +
          threadPrefix +
          "\n" +
          "┃ 🗓️ " +
          dayName +
          " | ⏰ " +
          timeStr +
          "\n" +
          "╚══════════════════════╝";

        api.sendMessage(
          {
            body: msg,
            attachment: fs.createReadStream(filePath),
          },
          threadID,
          () => fs.unlinkSync(filePath),
          messageID
        );
      });
  } catch (e) {
    console.log("prefix handleEvent error:", e);
  }
};

// এইটা খালি রাখলাম, চাইলে /prefix কমান্ড দিয়েও চালাতে পারো পরে
module.exports.run = async function () {};
