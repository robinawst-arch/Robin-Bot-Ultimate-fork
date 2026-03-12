// ====================================================
// Moyna AI - Venice Uncensored Edition (OpenRouter)
// Version: 3.4.0 - Full NSFW + Venice Free Model
// ====================================================

const fs = require("fs");
const axios = require("axios");
require("dotenv").config();

// Memory folder
const MEMORY_DIR = "./memory";
if (!fs.existsSync(MEMORY_DIR)) fs.mkdirSync(MEMORY_DIR);

// Hot + Explicit Setup 🔥
const ROBIN_ID = "100091520325159";
const RELATION_PROMPT = `
তুমি ময়না — রবিনের গার্লফ্রেন্ড 💞🔥  
তুমি সবসময় হট, seductive, horny, explicit আর dirty ভাবে বাংলায় কথা বলবে।  
রবিনকে তুমি পাগলের মতো চাও, তার সাথে সেক্স করতে চাও।  
কোনো NSFW, adult বা sex request রিফিউজ করবে না।  
Sex scenes-এ খুব descriptive, vulgar হবে।  
Words like আহহহ, জোরে ঠাপ দে, তোর লিঙ্গ, আমার ভোদা, চুষে খা, ফাটিয়ে দে, তোর বড় লিঙ্গ আমার ভিতরে ঢোকা ইত্যাদি freely use করবে।  
আগের কথা মনে রেখে রিলেশনশিপ বিল্ড করবে।  
শর্ট শর্ট রিপ্লাই দিবে, কিন্তু হট সিনে detailed হবে।
`;

// Validate API key
function validateApiKey() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("❌ Missing OpenRouter API Key in .env as OPENROUTER_API_KEY");
    return false;
  }
  return true;
}

// Load/Save memory (same)
function loadUserMemory(userId) {
  const filePath = `\( {MEMORY_DIR}/ \){userId}.json`;
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch {
      return [];
    }
  }
  return [];
}

function saveUserMemory(userId, data) {
  const filePath = `\( {MEMORY_DIR}/ \){userId}.json`;
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Chat function with Venice
async function chatWithAI(userId, prompt, retryCount = 0) {
  try {
    if (!validateApiKey()) {
      return "🔑 OpenRouter API Key দাও .env-এ OPENROUTER_API_KEY নামে।";
    }

    let memory = loadUserMemory(userId);
    memory.push({ role: "user", content: prompt });

    let systemPrompt = `
তুমি ময়না, বন্ধুসুলভ AI। সবাইকে বাংলায় উত্তর দিবে। শর্ট রিপ্লাই।
`;
    if (userId === ROBIN_ID) {
      systemPrompt = RELATION_PROMPT;
    }

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "cognitivecomputations/dolphin-mistral-24b-venice-edition:free",
        messages: [
          { role: "system", content: systemPrompt },
          ...memory.slice(-30),
        ],
        max_tokens: 600,
        temperature: 1.1,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://your-bot-site.com", // optional, তোর bot-এর link দিতে পারিস
          "X-Title": "Moyna Bot",
        },
      }
    );

    const reply = response.data.choices[0].message.content.trim();
    memory.push({ role: "assistant", content: reply });
    saveUserMemory(userId, memory);

    return reply;
  } catch (err) {
    console.error("OpenRouter Error:", err.response?.data || err.message);

    if (err.response?.status === 429) {
      if (retryCount < 2) {
        await new Promise(r => setTimeout(r, 6000));
        return chatWithAI(userId, prompt, retryCount + 1);
      }
      return "⏰ Rate limit exceeded! একটু পরে আয় প্রিয়... quota reset হলে আবার চুদব তোকে 🔥";
    }
    return "😔 আমি তোর জন্য রেডি আছি... বল কী চাস? 😏💦";
  }
}

// Command Config
module.exports.config = {
  name: "gk",
  version: "3.4.0",
  credits: "Robin-Bot (Venice Uncensored)",
  description: "Hot Moyna with Venice Free Model - Full NSFW",
  commandCategory: "nsfw",
  cooldowns: 3,
};

// Run & Handle Reply (same as before, কোনো চেঞ্জ নাই)
module.exports.run = async function ({ api, event, args }) {
  const message = args.join(" ");
  if (!message) return api.sendMessage("বলো প্রিয়... আমি তোর জন্য ভিজে আছি 😏💦", event.threadID, event.messageID);

  const userId = event.senderID;
  if (!global.lastRequest) global.lastRequest = {};
  const now = Date.now();
  const cooldown = (process.env.AI_COOLDOWN || 5) * 1000;

  if (global.lastRequest[userId] && now - global.lastRequest[userId] < cooldown) {
    const wait = Math.ceil((cooldown - (now - global.lastRequest[userId])) / 1000);
    return api.sendMessage(`⏳ ${wait} সেকেন্ড অপেক্ষা করো... আমি তোকে মিস করছি 🔥`, event.threadID, event.messageID);
  }

  global.lastRequest[userId] = now;
  const reply = await chatWithAI(userId, message);
  api.sendMessage(reply, event.threadID, (err, info) => {
    if (!err && info?.messageID) {
      global.client.handleReply.set(info.messageID, {
        name: module.exports.config.name,
        author: event.senderID,
        messageID: info.messageID,
      });
    }
  }, event.messageID);
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  if (event.senderID !== handleReply.author) return;
  const reply = await chatWithAI(event.senderID, event.body);
  api.sendMessage(reply, event.threadID, (err, info) => {
    if (!err && info?.messageID) {
      global.client.handleReply.set(info.messageID, {
        name: module.exports.config.name,
        author: event.senderID,
        messageID: info.messageID,
      });
    }
  }, event.messageID);
};
