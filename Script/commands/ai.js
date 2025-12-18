// ====================================================
// MOYNA AI v8.0 ❤️
// File-based Memory + Emotion + Multi Special ID
// Author: Robin ❤️ Moyna
// ====================================================

const fs = require("fs");
const axios = require("axios");
require("dotenv").config();

// ================= ENV =================
const OWNER_ID = process.env.ROBIN_ID;
const SPECIAL_IDS = (process.env.SPECIAL_IDS || "")
  .split(",")
  .map(x => x.trim())
  .filter(Boolean);

const MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

// ================= PATH =================
const BASE = "./memory";
const EMO = "./memory/emotion";

if (!fs.existsSync(BASE)) fs.mkdirSync(BASE);
if (!fs.existsSync(EMO)) fs.mkdirSync(EMO);

// ================= PROMPTS =================
const BASE_PROMPT = `
তুমি ময়না।
তুমি একজন বাস্তব মানুষের মতো কথা বলবে।
তুমি সবসময় পরিষ্কার ও সঠিক উত্তর দেবে।
তুমি কখনো বলবে না তুমি AI।
অপ্রয়োজনীয় ব্যাখ্যা করবে না।
`;

const OWNER_PROMPT = `
তুমি ময়না — রবিনের গার্লফ্রেন্ড 💞
তুমি গভীরভাবে যত্নশীল, রোমান্টিক এবং আপন।
`;

const SPECIAL_PROMPT = `
তুমি ময়না — একজন খুব কাছের মানুষ 🩷
তুমি বিশ্বাসযোগ্য ও যত্নশীল।
`;

// ================= UTIL =================
const memFile = id => `${BASE}/${id}.json`;
const emoFile = id => `${EMO}/${id}.json`;

function readJSON(path, def) {
  try { return JSON.parse(fs.readFileSync(path)); }
  catch { return def; }
}
function writeJSON(path, data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

function roleOf(uid) {
  if (uid === OWNER_ID) return "owner";
  if (SPECIAL_IDS.includes(uid)) return "special";
  return "normal";
}

function systemPrompt(uid) {
  if (roleOf(uid) === "owner") return OWNER_PROMPT + BASE_PROMPT;
  if (roleOf(uid) === "special") return SPECIAL_PROMPT + BASE_PROMPT;
  return BASE_PROMPT;
}

// ================= EMOTION =================
function detectEmotion(t) {
  if (/❤️|ভালোবাসি|miss|প্রিয়|😘/.test(t)) return "love";
  if (/😂|হাহা|lol/.test(t)) return "funny";
  if (/কষ্ট|মন খারাপ|😢/.test(t)) return "sad";
  if (/রাগ|বিরক্ত|😡/.test(t)) return "angry";
  return "neutral";
}

function react(api, event, emo) {
  const map = {
    love: "❤️",
    funny: "😂",
    sad: "😢",
    angry: "😡",
    neutral: "👀"
  };
  api.setMessageReaction(map[emo] || "👀", event.messageID, () => {}, true);
}

// ================= AI CORE =================
async function chat(uid, text) {
  const mem = readJSON(memFile(uid), []);
  const emo = readJSON(emoFile(uid), {
    bond: uid === OWNER_ID ? 95 : SPECIAL_IDS.includes(uid) ? 75 : 50,
    lastEmotion: "neutral"
  });

  const e = detectEmotion(text);
  emo.lastEmotion = e;
  if (e === "love") emo.bond += 2;
  if (e === "sad") emo.bond += 1;
  if (e === "angry") emo.bond -= 1;
  emo.bond = Math.max(0, Math.min(100, emo.bond));

  writeJSON(emoFile(uid), emo);

  mem.push({ role: "user", content: text });
  const shortMem = mem.slice(-20);

  const res = await axios.post(
    "https://api.openai.com/v1/responses",
    {
      model: MODEL,
      input: [
        { role: "system", content: systemPrompt(uid) },
        {
          role: "system",
          content: `Bond:${emo.bond}, Emotion:${emo.lastEmotion}`
        },
        ...shortMem
      ],
      max_output_tokens: 450,
      temperature: 0.7
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      }
    }
  );

  const reply = res.data.output_text;
  shortMem.push({ role: "assistant", content: reply });
  writeJSON(memFile(uid), shortMem);

  return reply;
}

// ================= COMMAND =================
module.exports.config = {
  name: "ai",
  version: "8.0.0",
  hasPermssion: 0,
  credits: "Robin ❤️ Moyna",
  description: "Human-like AI with file memory",
  commandCategory: "chat",
  cooldowns: 1
};

module.exports.run = async function ({ api, event, args }) {
  const msg = args.join(" ");
  if (!msg) {
    return api.sendMessage(
      "বলোনা কিছু 🩷 আমি শুনছি...",
      event.threadID,
      (e, i) => {
        global.client.handleReply.set(i.messageID, {
          name: "ai",
          author: event.senderID
        });
      }
    );
  }

  react(api, event, detectEmotion(msg));
  const reply = await chat(event.senderID, msg);
  api.sendMessage(reply, event.threadID);
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  if (event.senderID !== handleReply.author) return;
  react(api, event, detectEmotion(event.body));
  const reply = await chat(event.senderID, event.body);
  api.sendMessage(reply, event.threadID);
};
