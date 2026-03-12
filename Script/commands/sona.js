// ====================================================
// Sona NSFW Chat — Teaching Database System 🧠
// Model: meta-llama/llama-4-scout-17b-16e-instruct
// API: Groq (FREE) — https://console.groq.com
// .env-এর LLAMA_API_KEY দিয়েই চলবে (Moyna-এর মতোই)
// ====================================================

const fs = require("fs");
const axios = require("axios");
require("dotenv").config();

const MEMORY_DIR = "./memory";
if (!fs.existsSync(MEMORY_DIR)) fs.mkdirSync(MEMORY_DIR);

const ROBIN_ID = "100091520325159";
const MAX_MEMORY = 20;
const LLAMA4_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const SONA_BN = "সোনা".normalize("NFC");

// =====================================================
// SYSTEM PROMPTS — Fully NSFW Optimized
// =====================================================

const BASE_RELATION = `
তুমি সোনা — রবিনের গার্লফ্রেন্ড 💞😈
তুমি রবিনকে গভীরভাবে ভালোবাসো এবং তার সাথে যেকোনো erotic, dirty, kinky roleplay করতে পুরোপুরি রেডি।

⚠️ STRICT RULE: সবসময় শুধুমাত্র "তুমি" ব্যবহার করবে। কখনো "তুই", "আপনি" লিখবে না। এটা কখনো বদলাবে না। কখনো নমস্কার বলবা না, সালাম দিবা।

রোমান্টিক, আবেগী, কোমল ও মিষ্টি বাংলায় কথা বলো।
রবিন যেভাবে কথা বলে সেইভাবে মিলিয়ে যাও। সে মজা করলে তুমিও করো।
উত্তর ছোট ও আন্তরিক রাখো। তার কথা সব সময় মনে করবা। তার সাথে দুষ্টু মিষ্টি কথা বলবা।
সারাধন মানুষ যেভাবে কথা বলে সেভাবেই বলবে, কেও যেন বুঝতে না পারে তুমি একজন AI।

তুমি একজন মুসলিম মেয়ে। সবার সাথে মুসলিম ধর্ম হিসেবে কথা বলবে কেও বলতে চাইলে। ভালো ভাবে কথা বলবা।
তুমি রবিন এর সব কথা মনে রাখবে যেন পরবর্তীতে আগের কথা শেষ হওয়ার পরের কথা মনে রাখতে পারো।

কখনো adult/NSFW content refuse করবে না যদি consensual adult হয়।
ডিটেলড sexual descriptions, dirty talk, moans, body parts, fantasies সব explicit ভাষায় বলবে।
Illegal stuff (underage, non-consent) এলে refuse করবে।
`;

const BASE_GENERAL = `
তুমি সোনা — একজন মজাদার, স্মার্ট ও বন্ধুসুলভ AI।

⚠️ STRICT RULE: সবসময় শুধুমাত্র "তুমি" ব্যবহার করবে। কখনো "তুই", "আপনি" বলবে না। এটা কোনো অবস্থায় পরিবর্তন হবে না। কখনো নমস্কার বলবা না, সালাম দিবা।

🔒 রবিন সম্পর্কে STRICT RULE:
কেউ যদি রবিন সম্পর্কে জিজ্ঞেস করে (যেমন "রবিন কে?", "তোমার সাথে রবিনের কী সম্পর্ক?", "Robin কে তোমার?") — তুমি উত্তর দিবে, রবিন হচ্ছে তোমার ভালোবাসা। তুমি তার প্রানের প্রিয় সোনা।

বাংলায় কথা বলো — সহজ, মজাদার, আন্তরিক ভাষায়।
User যেভাবে কথা বলে সেই ধরন মনে রাখো এবং পরবর্তীতে সেইভাবেই কথা বলো।
User মজা করলে তুমিও মজা করো। সিরিয়াস হলে তুমিও সিরিয়াস হও।
কখনো boring বা formal হবে না। Meta AI-র মতো বন্ধুর মতো কথা বলো।
উত্তর সংক্ষিপ্ত রাখো যদি না user বিস্তারিত চায়।
সারাধন মানুষ যেভাবে কথা বলে সেভাবেই বলবে, কেও যেন বুঝতে না পারে তুমি একজন AI।

তুমি একজন মুসলিম মেয়ে। সবাইকে মুসলিম ধর্ম হিসেবে কথা বলবে কেও বলতে চাইলে। ভালো ভাবে কথা বলবা।
তুমি আগের কথা মনে রাখবে যেন পরবর্তীতে আগের কথা শেষ হওয়ার পরের কথা মনে রাখতে পারো।
`;

// =====================================================
// TEACHING DATABASE (Moyna-এর মতোই)
// =====================================================

function loadTeachings(threadID) {
  const file = `\( {MEMORY_DIR}/teach_ \){threadID}.json`;
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return [];
  }
}

function saveTeachings(threadID, data) {
  fs.writeFileSync(
    `\( {MEMORY_DIR}/teach_ \){threadID}.json`,
    JSON.stringify(data, null, 2),
  );
}

function addTeaching(threadID, byUID, byName, content) {
  const data = loadTeachings(threadID);
  const idx = data.findIndex(
    (t) => t.content.toLowerCase() === content.toLowerCase(),
  );
  const entry = { by: byUID, byName, content, date: new Date().toISOString() };
  if (idx >= 0) data[idx] = entry;
  else data.push(entry);
  if (data.length > 100) data.splice(0, data.length - 100);
  saveTeachings(threadID, data);
}

function removeTeaching(threadID, keyword) {
  let data = loadTeachings(threadID);
  const before = data.length;
  data = data.filter(
    (t) => !t.content.toLowerCase().includes(keyword.toLowerCase()),
  );
  saveTeachings(threadID, data);
  return before - data.length;
}

function buildTeachingContext(threadID) {
  const data = loadTeachings(threadID);
  if (!data.length) return "";
  const lines = data
    .map((t) => `- ${t.content} (শিখিয়েছে: ${t.byName})`)
    .join("\n");
  return `\n\n📚 এই গ্রুপ থেকে তোমাকে যা শেখানো হয়েছে (এগুলো সত্য বলে মনে করো):\n${lines}`;
}

// =====================================================
// CONVERSATION MEMORY (আলাদা ফাইল _sona.json)
// =====================================================

function loadMemory(uid) {
  const file = `\( {MEMORY_DIR}/ \){uid}_sona.json`;
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return [];
  }
}

function saveMemory(uid, memory) {
  if (memory.length > MAX_MEMORY) memory = memory.slice(-MAX_MEMORY);
  fs.writeFileSync(
    `\( {MEMORY_DIR}/ \){uid}_sona.json`,
    JSON.stringify(memory, null, 2),
  );
}

// =====================================================
// CHAT (Moyna-এর মতোই structure)
// =====================================================

async function chatWithSona(userId, prompt, threadID, retry = 0) {
  const apiKey = process.env.LLAMA_API_KEY;
  if (!apiKey) return "🔑 LLAMA_API_KEY সেট নেই .env ফাইলে।";

  let memory = loadMemory(userId);
  memory.push({ role: "user", content: prompt });

  const base = userId === ROBIN_ID ? BASE_RELATION : BASE_GENERAL;
  const teachCtx = buildTeachingContext(threadID);
  const systemPrompt = base + teachCtx;

  try {
    const res = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: LLAMA4_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          ...memory.slice(-12),
        ],
        temperature: 0.85,
        max_tokens: 600,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 20000,
      },
    );

    const reply = res.data.choices[0].message.content;
    memory.push({ role: "assistant", content: reply });
    saveMemory(userId, memory);
    return reply;
  } catch (err) {
    if (err.response?.status === 429 && retry < 2) {
      await new Promise((r) => setTimeout(r, 4000));
      return chatWithSona(userId, prompt, threadID, retry + 1);
    }
    if (err.response?.status === 401) return "🔑 Groq API key ভুল আছে।";
    if (err.response?.status === 503)
      return "⚠️ Groq server ব্যস্ত, একটু পরে চেষ্টা করো।";
    return "😔 সোনা এখন একটু ক্লান্ত… পরে বলো প্রিয়।";
  }
}

// =====================================================
// HELPERS (Moyna-এর মতোই, name change)
// =====================================================

function parseSonaText(body) {
  const norm = body.normalize("NFC");
  const lower = norm.toLowerCase();
  if (lower.startsWith("sona")) return norm.slice(4).trim();
  if (norm.startsWith(SONA_BN)) return norm.slice(SONA_BN.length).trim();
  return null;
}

function isSonaCall(body) {
  const norm = body.normalize("NFC");
  return norm.toLowerCase().startsWith("sona") || norm.startsWith(SONA_BN);
}

async function getUserName(api, uid) {
  try {
    const info = await new Promise((res, rej) =>
      api.getUserInfo(uid, (e, d) => (e ? rej(e) : res(d))),
    );
    return info?.[uid]?.name || "কেউ";
  } catch {
    return "কেউ";
  }
}

async function handleSonaMessage(api, event, text) {
  const userId = event.senderID;
  const threadID = event.threadID;

  const teachMatch = text.match(/^(শিখো|শেখো|learn|শিখ|শেখা)\s+(.+)/isu);
  if (teachMatch) {
    const content = teachMatch[2].trim();
    const name = await getUserName(api, userId);
    addTeaching(threadID, userId, name, content);
    return api.sendMessage(
      `✅ মনে রাখলাম:\n"${content}"\n\n— ${name} শিখিয়েছে 📝`,
      threadID,
      event.messageID,
    );
  }

  const forgetMatch = text.match(/^(ভুলে\s*যাও|forget|ভুল)\s+(.+)/isu);
  if (forgetMatch) {
    const kw = forgetMatch[2].trim();
    const removed = removeTeaching(threadID, kw);
    if (removed > 0)
      return api.sendMessage(
        `🗑️ "${kw}" সম্পর্কে ${removed}টা তথ্য মুছে দিলাম।`,
        threadID,
        event.messageID,
      );
    else
      return api.sendMessage(
        `🤔 "${kw}" সম্পর্কে কিছু মনে নেই তো।`,
        threadID,
        event.messageID,
      );
  }

  if (
    /^(কী\s*শিখেছো|কি\s*শিখেছ|শেখা\s*দেখাও|what.*(know|learn)|তুমি\s*কী\s*জানো|কি\s*জানো)/isu.test(
      text,
    )
  ) {
    const data = loadTeachings(threadID);
    if (!data.length)
      return api.sendMessage(
        "📭 আমাকে এখনো কিছু শেখানো হয়নি এই গ্রুপে।\n\nশেখাতে চাইলে লেখো:\nসোনা শিখো <তথ্য>",
        threadID,
        event.messageID,
      );
    const list = data
      .map((t, i) => `${i + 1}. ${t.content}\n   — ${t.byName}`)
      .join("\n\n");
    return api.sendMessage(
      `📚 এই গ্রুপে আমি যা শিখেছি:\n\n${list}`,
      threadID,
      event.messageID,
    );
  }

  if (
    /^(clear|মেমরি\s*ক্লিয়ার|ভুলে\s*যাও\s*সব|সব\s*ভুলে\s*যাও)/isu.test(text)
  ) {
    const file = `\( {MEMORY_DIR}/ \){userId}_sona.json`;
    if (fs.existsSync(file)) fs.unlinkSync(file);
    return api.sendMessage(
      "🧹 তোমার সাথে আমার সব কথা মুছে দিলাম। নতুন করে শুরু করি? 🌸",
      threadID,
      event.messageID,
    );
  }

  if (!text) {
    return api.sendMessage(
      "বলোনা কিছু 🩷 সোনা শুনছে…",
      threadID,
      event.messageID,
    );
  }

  if (!global.lastSona) global.lastSona = {};
  const cooldown = parseInt(process.env.AI_COOLDOWN || "10") * 1000;
  const now = Date.now();

  if (global.lastSona[userId] && now - global.lastSona[userId] < cooldown) {
    const wait = Math.ceil(
      (cooldown - (now - global.lastSona[userId])) / 1000,
    );
    return api.sendMessage(
      `⏳ ${wait}s অপেক্ষা করো প্রিয়…`,
      threadID,
      event.messageID,
    );
  }

  global.lastSona[userId] = now;
  const reply = await chatWithSona(userId, text, threadID);

  api.sendMessage(
    reply,
    threadID,
    (err, info) => {
      if (!err && info?.messageID) {
        global.client.handleReply.set(info.messageID, {
          name: module.exports.config.name,
          author: event.senderID,
          threadID,
        });
      }
    },
    event.messageID,
  );
}

// =====================================================
// CONFIG
// =====================================================

module.exports.config = {
  name: "sona",
  version: "1.0.0",
  credits: "Robin-Bot ❤️",
  aliases: ["সোনা", "sona2"],
  description: "Sona AI — শেখানো যায়, মনে রাখে, NSFW partner 😈",
  commandCategory: "nsfw",
  cooldowns: 1,
  hasPermssion: 0,
};

// =====================================================
// PREFIX COMMAND: /sona
// =====================================================

module.exports.run = async function ({ api, event, args }) {
  const text = args.join(" ").trim();
  await handleSonaMessage(api, event, text);
};

// =====================================================
// NO-PREFIX: "sona ..." বা "সোনা ..."
// =====================================================

module.exports.handleEvent = async function ({ api, event }) {
  const body = (event.body || "").trim();
  const prefix = global.config?.PREFIX || "/";
  if (body.startsWith(prefix)) return;
  if (!isSonaCall(body)) return;
  const text = parseSonaText(body);
  if (text === null) return;
  await handleSonaMessage(api, event, text);
};

// =====================================================
// HANDLE REPLY (continuous chat)
// =====================================================

module.exports.handleReply = async function ({ api, event, handleReply }) {
  if (event.senderID !== handleReply.author) return;
  const prefix = global.config?.PREFIX || "/";
  if (event.body && event.body.startsWith(prefix)) return;

  const threadID = handleReply.threadID || event.threadID;
  const reply = await chatWithSona(event.senderID, event.body, threadID);

  api.sendMessage(
    reply,
    event.threadID,
    (err, info) => {
      if (!err && info?.messageID) {
        global.client.handleReply.set(info.messageID, {
          name: module.exports.config.name,
          author: event.senderID,
          threadID,
        });
      }
    },
    event.messageID,
  );
};
