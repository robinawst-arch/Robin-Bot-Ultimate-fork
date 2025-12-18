// ====================================================
// Moyna AI Chat Command ❤️ (STABLE UPGRADE)
// Version: 3.5.0
// Base: Robin original working AI
// ====================================================

const fs = require("fs");
const axios = require("axios");
require("dotenv").config();

// ================= BASIC CHECK =================
function validateApiKey() {
  const key = process.env.OPENAI_API_KEY;
  if (!key || !key.startsWith("sk-")) return false;
  return true;
}

// ================= MEMORY =================
const MEMORY_DIR = "./memory";
if (!fs.existsSync(MEMORY_DIR)) fs.mkdirSync(MEMORY_DIR);

function loadMemory(uid) {
  const p = `${MEMORY_DIR}/${uid}.json`;
  if (!fs.existsSync(p)) return [];
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return [];
  }
}

function saveMemory(uid, mem) {
  const p = `${MEMORY_DIR}/${uid}.json`;
  fs.writeFileSync(p, JSON.stringify(mem.slice(-20), null, 2));
}

// ================= RELATION =================
const OWNER_ID = process.env.ROBIN_ID;

function systemPrompt(uid) {
  if (uid === OWNER_ID) {
    return `তুমি ময়না — রবিনের গার্লফ্রেন্ড 💞
তুমি যত্নশীল, রোমান্টিক ও স্বাভাবিকভাবে বাংলা কথা বলবে।`;
  }
  return `তুমি ময়না, একজন ভদ্র ও সহানুভূতিশীল AI সহকারী।
তুমি মানুষের মতো স্বাভাবিকভাবে কথা বলবে।`;
}

// ================= EMOTION + REACTION =================
function detectEmotion(t) {
  if (/❤️|ভালোবাসি|miss|প্রিয়|😘/.test(t)) return "❤️";
  if (/😂|হাহা|lol/.test(t)) return "😂";
  if (/কষ্ট|মন খারাপ|😢/.test(t)) return "😢";
  if (/রাগ|বিরক্ত|😡/.test(t)) return "😡";
  return "👀";
}

// ================= AI CORE =================
async function chatWithAI(uid, text) {
  if (!validateApiKey())
    return "🔑 OpenAI API Key ঠিকভাবে সেট করা নেই।";

  try {
    let memory = loadMemory(uid);
    memory.push({ role: "user", content: text });

    const res = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt(uid) },
          ...memory.slice(-12)
        ],
        max_tokens: 600,
        temperature: 0.8
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const reply = res.data.choices?.[0]?.message?.content;
    if (!reply) return "⚠️ AI থেকে উত্তর পাওয়া যায়নি। আবার চেষ্টা করো।";

    memory.push({ role: "assistant", content: reply });
    saveMemory(uid, memory);

    return reply;
  } catch (err) {
    console.error("AI ERROR:", err.response?.data || err.message);
    return "❌ এখন AI তে সমস্যা হচ্ছে। একটু পরে আবার বলো।";
  }
}

// ================= COMMAND CONFIG =================
module.exports.config = {
  name: "ai",
  version: "3.5.0",
  credits: "Robin ❤️ Moyna",
  description: "Stable AI Chat (Upgraded)",
  commandCategory: "chat",
  cooldowns: 1
};

// ================= RUN =================
module.exports.run = async function ({ api, event, args }) {
  const msg = args.join(" ");

  if (!msg) {
    return api.sendMessage(
      "বলোনা কিছু 🩷 আমি শুনছি...",
      event.threadID,
      (err, info) => {
        if (!err) {
          global.client.handleReply.set(info.messageID, {
            name: "ai",
            author: event.senderID
          });
        }
      }
    );
  }

  api.setMessageReaction(detectEmotion(msg), event.messageID, () => {}, true);

  const reply = await chatWithAI(event.senderID, msg);
  api.sendMessage(reply, event.threadID, event.messageID);
};

// ================= HANDLE REPLY =================
module.exports.handleReply = async function ({ api, event, handleReply }) {
  if (event.senderID !== handleReply.author) return;

  api.setMessageReaction(
    detectEmotion(event.body),
    event.messageID,
    () => {},
    true
  );

  const reply = await chatWithAI(event.senderID, event.body);
  api.sendMessage(reply, event.threadID, event.messageID);
};
