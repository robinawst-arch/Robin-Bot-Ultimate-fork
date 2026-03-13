// ====================================================
// Sona AI — Groq Powered ❤️
// Stable Messenger AI (Moyna Architecture)
// ====================================================

const fs = require("fs");
const axios = require("axios");
require("dotenv").config();

const MEMORY_DIR = "./memory";
if (!fs.existsSync(MEMORY_DIR)) fs.mkdirSync(MEMORY_DIR);

const ROBIN_ID = "100091520325159";
const MAX_MEMORY = 20;

const GROQ_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";

const SONA_BN = "সোনা".normalize("NFC");

// =====================================================
// SYSTEM PROMPTS (UNCHANGED)
// =====================================================

const BASE_RELATION = `
তুমি সোনা — রবিনের গার্লফ্রেন্ড 💞
তুমি রবিনকে গভীরভাবে ভালোবাসো।

⚠️ STRICT RULE: সবসময় শুধুমাত্র "তুমি" ব্যবহার করবে। কখনো "তুই", "আপনি" লিখবে না।

রোমান্টিক, আবেগী, কোমল ও মিষ্টি বাংলায় কথা বলো।
রবিন যেভাবে কথা বলে সেইভাবে মিলিয়ে যাও।
উত্তর ছোট ও আন্তরিক রাখো।
তুমি একজন মুসলিম মেয়ে।
`;

const BASE_GENERAL = `
তুমি সোনা — একজন মজাদার, স্মার্ট ও বন্ধুসুলভ AI।

⚠️ STRICT RULE: সবসময় শুধুমাত্র "তুমি" ব্যবহার করবে।

বাংলায় সহজভাবে কথা বলো।
User যেভাবে কথা বলে সেইভাবে উত্তর দাও।
উত্তর সংক্ষিপ্ত রাখো।
`;

// =====================================================
// TEACHING DATABASE
// =====================================================

function loadTeachings(threadID) {
  const file = `${MEMORY_DIR}/teach_${threadID}.json`;
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return [];
  }
}

function saveTeachings(threadID, data) {
  fs.writeFileSync(
    `${MEMORY_DIR}/teach_${threadID}.json`,
    JSON.stringify(data, null, 2)
  );
}

function addTeaching(threadID, byUID, byName, content) {
  const data = loadTeachings(threadID);

  const entry = {
    by: byUID,
    byName,
    content,
    date: new Date().toISOString()
  };

  data.push(entry);

  if (data.length > 100) {
    data.splice(0, data.length - 100);
  }

  saveTeachings(threadID, data);
}

function buildTeachingContext(threadID) {
  const data = loadTeachings(threadID);

  if (!data.length) return "";

  const lines = data
    .slice(-5)
    .map(t => `- ${t.content} (শিখিয়েছে: ${t.byName})`)
    .join("\n");

  return `\n📚 গ্রুপ থেকে শেখা তথ্য:\n${lines}`;
}

// =====================================================
// MEMORY
// =====================================================

function loadMemory(uid) {
  const file = `${MEMORY_DIR}/${uid}_sona.json`;

  if (!fs.existsSync(file)) return [];

  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return [];
  }
}

function saveMemory(uid, memory) {

  if (memory.length > MAX_MEMORY) {
    memory = memory.slice(-MAX_MEMORY);
  }

  fs.writeFileSync(
    `${MEMORY_DIR}/${uid}_sona.json`,
    JSON.stringify(memory, null, 2)
  );
}

// =====================================================
// CHAT WITH GROQ
// =====================================================

async function chatWithSona(userId, prompt, threadID, retry = 0) {

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return "🔑 GROQ_API_KEY নেই .env ফাইলে";
  }

  let memory = loadMemory(userId);

  memory.push({
    role: "user",
    content: prompt
  });

  const base =
    String(userId) === String(ROBIN_ID)
      ? BASE_RELATION
      : BASE_GENERAL;

  const systemPrompt = base + buildTeachingContext(threadID);

  try {

    const res = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          ...memory.slice(-12)
        ],
        temperature: 0.8,
        max_tokens: 500
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        timeout: 20000
      }
    );

    const reply = res.data.choices[0].message.content;

    memory.push({
      role: "assistant",
      content: reply
    });

    saveMemory(userId, memory);

    return reply;

  } catch (err) {

    console.log("Sona Error:", err.response?.data || err.message);

    if (err.response?.status === 429 && retry < 2) {
      await new Promise(r => setTimeout(r, 4000));
      return chatWithSona(userId, prompt, threadID, retry + 1);
    }

    if (err.response?.status === 401) {
      return "🔑 API key ভুল।";
    }

    return "😔 সোনা এখন একটু ক্লান্ত… পরে বলো ভালোবাসা।";
  }
}

// =====================================================
// MAIN MESSAGE HANDLER
// =====================================================

async function handleSonaMessage(api, event, text) {

  const userId = event.senderID;
  const threadID = event.threadID;

  if (!global.lastSona) global.lastSona = {};

  const cooldown = 10000;
  const now = Date.now();

  if (
    global.lastSona[userId] &&
    now - global.lastSona[userId] < cooldown
  ) {

    const wait = Math.ceil(
      (cooldown - (now - global.lastSona[userId])) / 1000
    );

    return api.sendMessage(
      `⏳ ${wait}s অপেক্ষা করো প্রিয়…`,
      threadID,
      event.messageID
    );
  }

  global.lastSona[userId] = now;

  const reply = await chatWithSona(userId, text, threadID);

  await new Promise(r => setTimeout(r, 2000));

  api.sendMessage(
    reply,
    threadID,
    (err, info) => {

      if (!err && info?.messageID) {

        global.client.handleReply.set(info.messageID, {
          name: module.exports.config.name,
          author: userId,
          threadID
        });

      }

    },
    event.messageID
  );
}

// =====================================================
// CONFIG
// =====================================================

module.exports.config = {
  name: "sona",
  version: "7.0.0",
  credits: "Robin ❤️",
  description: "Sona AI (Stable Messenger AI)",
  commandCategory: "chat",
  cooldowns: 1
};

// =====================================================
// PREFIX
// =====================================================

module.exports.run = async function ({ api, event, args }) {

  const text = args.join(" ").trim();

  await handleSonaMessage(api, event, text);

};

// =====================================================
// HANDLE REPLY
// =====================================================

module.exports.handleReply = async function ({ api, event, handleReply }) {

  if (event.senderID !== handleReply.author) return;

  const reply = await chatWithSona(
    event.senderID,
    event.body,
    event.threadID
  );

  await new Promise(r => setTimeout(r, 2000));

  api.sendMessage(
    reply,
    event.threadID,
    (err, info) => {

      if (!err && info?.messageID) {

        global.client.handleReply.set(info.messageID, {
          name: module.exports.config.name,
          author: event.senderID,
          threadID: event.threadID
        });

      }

    },
    event.messageID
  );
};
