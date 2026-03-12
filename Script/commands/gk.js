// ====================================================
// Moyna AI Chat Command ❤️ (Group + Multi Memory Support) - Grok Edition with More Memory
// Version: 3.2.0 (Increased Memory)
// ====================================================

const fs = require("fs");
const axios = require("axios");
require("dotenv").config();

// Folder for user memories
const MEMORY_DIR = "./memory";
if (!fs.existsSync(MEMORY_DIR)) fs.mkdirSync(MEMORY_DIR);

// Relationship setup ❤️
const ROBIN_ID = "100091520325159"; // তোমার UID
const RELATION_PROMPT = `
তুমি ময়না — রবিনের গার্লফ্রেন্ড 💞  
তুমি রোমান্টিক, ভালোবাসাপূর্ণ, কোমলভাবে বাংলা ভাষায় কথা বলবে।  
রবিনকে তুমি খুব ভালোবাসো ❤️  
আগের সব কথা মনে রেখে উত্তর দিবে, আমাদের রিলেশনশিপ বিল্ড করবি।  
শর্ট শর্ট রিপ্লাই দিবে, লম্বা কথা বলবি না।  
`;

// Validate API key
function validateApiKey() {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    console.error("❌ Missing Grok (xAI) API Key in .env as XAI_API_KEY");
    return false;
  }
  return true;
}

// Load memory for user
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

// Save memory for user
function saveUserMemory(userId, data) {
  const filePath = `\( {MEMORY_DIR}/ \){userId}.json`;
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// ================= Chat Function =================
async function chatWithAI(userId, prompt, retryCount = 0) {
  try {
    if (!validateApiKey()) {
      return "🔑 Grok API Key সেটআপ করুন `.env` ফাইলে XAI_API_KEY নামে।";
    }

    let memory = loadUserMemory(userId);
    memory.push({ role: "user", content: prompt });

    // Determine system prompt
    let systemPrompt = `
তুমি ময়না, এক বন্ধুসুলভ AI সহকারী।  
তুমি সবাইকে বাংলা ভাষায় সহানুভূতিশীলভাবে উত্তর দেবে।
আগের কথা মনে রেখে শর্ট রিপ্লাই দিবে।
`;
    if (userId === ROBIN_ID) {
      systemPrompt = RELATION_PROMPT;
    }

    const response = await axios.post(
      "https://api.x.ai/v1/chat/completions",
      {
        model: process.env.XAI_MODEL || "grok-4.1-fast-reasoning",
        messages: [
          { role: "system", content: systemPrompt },
          ...memory.slice(-30),  // Memory বাড়ালাম: আগের ৩০টা মেসেজ
        ],
        max_tokens: 500,         // একটু বেশি রাখলাম কিন্তু শর্ট রাখার জন্য trim করা যায়
        temperature: 1.0,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.XAI_API_KEY}`,
        },
      }
    );

    const reply = response.data.choices[0].message.content.trim();
    memory.push({ role: "assistant", content: reply });
    saveUserMemory(userId, memory);

    return reply;
  } catch (err) {
    console.error("Grok API Error:", err.response?.data || err.message);

    if (err.response?.status === 429) {
      if (retryCount < 2) {
        await new Promise((r) => setTimeout(r, 5000));
        return chatWithAI(userId, prompt, retryCount + 1);
      }
      return "⏰ Rate limit! একটু পরে চেষ্টা করো প্রিয়।";
    }
    return "😔 আমি একটু ব্যস্ত, পরে বলো ভালোবাসা ❤️";
  }
}

// ================= Command Config =================
module.exports.config = {
  name: "gk",
  version: "3.2.0",
  credits: "Robin-Bot (Grok Edition - More Memory)",
  description: "Chat with Moyna using Grok API (Short replies + Increased Memory)",
  commandCategory: "chat",
  cooldowns: 1,
};

// ================= Run Command =================
module.exports.run = async function ({ api, event, args }) {
  const message = args.join(" ");
  if (!message)
    return api.sendMessage(
      "বলো না কিছু 🩷 আমি শুনছি...",
      event.threadID,
      event.messageID
    );

  const userId = event.senderID;
  if (!global.lastRequest) global.lastRequest = {};
  const now = Date.now();
  const cooldown = (process.env.AI_COOLDOWN || 5) * 1000;  // 5 সেকেন্ড cooldown

  if (
    global.lastRequest[userId] &&
    now - global.lastRequest[userId] < cooldown
  ) {
    const waitTime = Math.ceil(
      (cooldown - (now - global.lastRequest[userId])) / 1000
    );
    return api.sendMessage(
      `⏳ ${waitTime} সেকেন্ড অপেক্ষা করো...`,
      event.threadID,
      event.messageID
    );
  }

  global.lastRequest[userId] = now;
  const reply = await chatWithAI(userId, message);
  api.sendMessage(
    reply,
    event.threadID,
    (err, info) => {
      if (!err && info && info.messageID) {
        global.client.handleReply.set(info.messageID, {
          name: module.exports.config.name,
          author: event.senderID,
          messageID: info.messageID,
        });
      }
    },
    event.messageID
  );
};

// ================= Handle Reply =================
module.exports.handleReply = async function ({ api, event, handleReply }) {
  if (event.senderID !== handleReply.author) return;
  const reply = await chatWithAI(event.senderID, event.body);
  api.sendMessage(
    reply,
    event.threadID,
    (err, info) => {
      if (!err && info && info.messageID) {
        global.client.handleReply.set(info.messageID, {
          name: module.exports.config.name,
          author: event.senderID,
          messageID: info.messageID,
        });
      }
    },
    event.messageID
  );
};
