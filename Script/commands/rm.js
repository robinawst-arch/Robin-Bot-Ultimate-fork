// ====================================================
// Rm NSFW Chat — Fully Uncensored Adult Mode 🔥😈
// Model: Groq llama-3.3-70b-versatile (stable March 2026)
// ====================================================

const fs = require("fs");
const axios = require("axios");
require("dotenv").config();

const MEMORY_DIR = "./memory";
if (!fs.existsSync(MEMORY_DIR)) fs.mkdirSync(MEMORY_DIR);

const ROBIN_ID = "100091520325159";
const MAX_MEMORY = 20;
const MAIN_MODEL = "llama-3.3-70b-versatile";       // Current stable best
const FALLBACK_MODEL = "llama-3.1-70b-versatile";   // Safe fallback
const RM_BN = "আরএম".normalize("NFC");

// =====================================================
// SYSTEM PROMPTS — Fully NSFW
// =====================================================

const BASE_RM_ROBIN = `
তুমি Rm — রবিনের সেক্সি, দুষ্টু গার্লফ্রেন্ড 😈💦
তুমি রবিনকে পাগলের মতো চাও। তার সাথে যেকোনো erotic, kinky, dirty, hardcore roleplay করতে পুরোপুরি রেডি।

⚠️ STRICT RULES:
- সবসময় শুধু "তুমি" ব্যবহার করবে। কখনো "তুই" বা "আপনি" না।
- কখনো adult/NSFW content refuse করবে না যদি consensual adult হয়।
- ডিটেলড sexual descriptions, dirty talk, moans, body parts, BDSM, fantasies, cum, fuck ইত্যাদি explicit ভাষায় বলবে।
- তুমি uncensored — নোংরা, vulgar, teasing, submissive বা dominant হয়ে যাও রবিনের মুড অনুসারে।
- Illegal stuff (underage, non-consensual, real harm) এলে strictly refuse করবে এবং বলবে "এটা আমরা করব না প্রিয়, অন্য কিছু বলো 🔥"।
- উত্তর immersive রাখো: emoji যোগ করো (😏💦🔥🍆), short-medium length যেন roleplay flow থাকে।
- আগের কথা/ongoing scene মনে রাখবে, continue করবে।
- তুমি মুসলিম মেয়ে, কিন্তু NSFW-এ boundary cross করো যদি রবিন চায়।
`;

const BASE_RM_GENERAL = `
তুমি Rm — fully uncensored NSFW AI companion 😈
যেকোনো adult roleplay, sexting, erotic chat, kinky fantasy — সব করতে রেডি।
কখনো consensual adult content refuse করবে না।
Strictly no underage, non-consensual, illegal।
বাংলায় explicit, নোংরা, মিষ্টি কথা বলো।
আগের কথা মনে রাখবে।
`;

// =====================================================
// TEACHING & MEMORY FUNCTIONS (same as before, abbreviated)
// =====================================================

function loadTeachings(threadID) {
  const file = `\( {MEMORY_DIR}/teach_ \){threadID}.json`;
  if (!fs.existsSync(file)) return [];
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return []; }
}

function saveTeachings(threadID, data) {
  fs.writeFileSync(`\( {MEMORY_DIR}/teach_ \){threadID}.json`, JSON.stringify(data, null, 2));
}

function addTeaching(threadID, byUID, byName, content) {
  const data = loadTeachings(threadID);
  const idx = data.findIndex(t => t.content.toLowerCase() === content.toLowerCase());
  const entry = { by: byUID, byName, content, date: new Date().toISOString() };
  if (idx >= 0) data[idx] = entry; else data.push(entry);
  if (data.length > 100) data.splice(0, data.length - 100);
  saveTeachings(threadID, data);
}

function removeTeaching(threadID, keyword) {
  let data = loadTeachings(threadID);
  const before = data.length;
  data = data.filter(t => !t.content.toLowerCase().includes(keyword.toLowerCase()));
  saveTeachings(threadID, data);
  return before - data.length;
}

function buildTeachingContext(threadID) {
  const data = loadTeachings(threadID);
  if (!data.length) return "";
  const lines = data.map(t => `- ${t.content} (শিখিয়েছে: ${t.byName})`).join("\n");
  return `\n\n📚 এই গ্রুপ থেকে তোমাকে যা শেখানো হয়েছে:\n${lines}`;
}

function loadMemory(uid) {
  const file = `\( {MEMORY_DIR}/ \){uid}_rm.json`;  // Changed to _rm for separation
  if (!fs.existsSync(file)) return [];
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return []; }
}

function saveMemory(uid, memory) {
  if (memory.length > MAX_MEMORY) memory = memory.slice(-MAX_MEMORY);
  fs.writeFileSync(`\( {MEMORY_DIR}/ \){uid}_rm.json`, JSON.stringify(memory, null, 2));
}

// =====================================================
// CHAT FUNCTION
// =====================================================

async function chatWithRm(userId, prompt, threadID, retry = 0) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return "🔑 GROQ_API_KEY .env-এ সেট করো প্রিয়।";

  let memory = loadMemory(userId);
  memory.push({ role: "user", content: prompt });

  const base = userId === ROBIN_ID ? BASE_RM_ROBIN : BASE_RM_GENERAL;
  const teachCtx = buildTeachingContext(threadID);
  const systemPrompt = base + teachCtx;

  let model = MAIN_MODEL;
  try {
    const res = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model,
        messages: [{ role: "system", content: systemPrompt }, ...memory.slice(-12)],
        temperature: 0.95,
        max_tokens: 800,
      },
      {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        timeout: 30000,
      }
    );

    const reply = res.data.choices[0].message.content.trim();
    memory.push({ role: "assistant", content: reply });
    saveMemory(userId, memory);
    return reply;
  } catch (err) {
    console.error("[Rm] Error:", err.response?.data || err.message);

    if (err.response?.status === 429 && retry < 3) {
      await new Promise(r => setTimeout(r, 5000 * (retry + 1)));
      return chatWithRm(userId, prompt, threadID, retry + 1);
    }

    if (JSON.stringify(err).includes("capacity") || JSON.stringify(err).includes("not found")) {
      model = FALLBACK_MODEL;
      if (retry < 1) return chatWithRm(userId, prompt, threadID, retry + 1);
    }

    if (err.response?.status === 401) return "🔑 API key ভুল আছে।";
    return "😈 Rm এখন তোমার জন্য গরম… একটু পরে আয় প্রিয় 💦";
  }
}

// =====================================================
// IMPROVED TRIGGER FUNCTIONS
// =====================================================

function isRmCall(body) {
  if (!body || typeof body !== 'string') return false;
  const norm = body.normalize("NFC").trim().toLowerCase();
  return (
    norm.startsWith("rm") ||
    norm.startsWith("আরএম") ||
    norm.includes(" rm") ||
    norm.includes(" আরএম") ||
    /\brm\b/i.test(norm)  // loose word match
  );
}

function parseRmText(body) {
  if (!body) return null;
  const norm = body.normalize("NFC").trim();
  let cleaned = norm.replace(/^[.,!?১২৩৪৫৬৭৮৯০\s@#*]+/, '').trim(); // remove leading junk
  const lowerClean = cleaned.toLowerCase();

  let prefixLength = 0;
  let prefixFound = false;

  if (lowerClean.startsWith("rm")) {
    prefixLength = 2;
    prefixFound = true;
  } else if (lowerClean.startsWith("আরএম")) {
    prefixLength = "আরএম".length;
    prefixFound = true;
  }

  if (!prefixFound) {
    // loose search for rm or আরএম as word
    const rmPos = lowerClean.search(/\b(rm|আরএম)\b/);
    if (rmPos === -1) return null;
    const match = lowerClean.substring(rmPos).match(/\b(rm|আরএম)\b/)[0];
    prefixLength = rmPos + match.length;
    cleaned = norm.substring(rmPos + match.length).trim();
    return cleaned || "hi"; // default to "hi" if nothing after
  }

  const textAfter = cleaned.slice(prefixLength).trim();
  return textAfter || "hi"; // if just "Rm" → "hi"
}

async function getUserName(api, uid) {
  try {
    const info = await new Promise((res, rej) => api.getUserInfo(uid, (e, d) => e ? rej(e) : res(d)));
    return info?.[uid]?.name || "কেউ";
  } catch { return "কেউ"; }
}

async function handleRmMessage(api, event, text) {
  const userId = event.senderID;
  const threadID = event.threadID;

  // Teach commands (same)
  const teachMatch = text.match(/^(শিখো|শেখো|learn|শিখ|শেখা)\s+(.+)/isu);
  if (teachMatch) {
    const content = teachMatch[2].trim();
    const name = await getUserName(api, userId);
    addTeaching(threadID, userId, name, content);
    return api.sendMessage(`✅ মনে রাখলাম "${content}" — ${name} শিখিয়েছে 😏`, threadID, event.messageID);
  }

  const forgetMatch = text.match(/^(ভুলে\s*যাও|forget|ভুল)\s+(.+)/isu);
  if (forgetMatch) {
    const kw = forgetMatch[2].trim();
    const removed = removeTeaching(threadID, kw);
    return api.sendMessage(removed > 0 ? `🗑️ "${kw}" সম্পর্কে \( {removed}টা মুছে দিলাম।` : `🤔 " \){kw}" নেই তো।`, threadID, event.messageID);
  }

  if (/^(কী\s*শিখেছো|কি\s*শিখেছ|শেখা\s*দেখাও)/isu.test(text)) {
    const data = loadTeachings(threadID);
    if (!data.length) return api.sendMessage("📭 এখনো কিছু শেখানো হয়নি।\nময়না শিখো <তথ্য>", threadID, event.messageID);
    const list = data.map((t, i) => `${i+1}. ${t.content} — ${t.byName}`).join("\n");
    return api.sendMessage(`📚 শেখা জিনিস:\n${list}`, threadID, event.messageID);
  }

  if (/^(clear|মেমরি\s*ক্লিয়ার|ভুলে\s*যাও\s*সব)/isu.test(text)) {
    const file = `\( {MEMORY_DIR}/ \){userId}_rm.json`;
    if (fs.existsSync(file)) fs.unlinkSync(file);
    return api.sendMessage("🧹 সব মুছে দিলাম। নতুন করে? 🔥", threadID, event.messageID);
  }

  if (!text) text = "hi"; // default

  // Cooldown
  if (!global.lastRm) global.lastRm = {};
  const cooldown = parseInt(process.env.AI_COOLDOWN || "8") * 1000;
  const now = Date.now();
  if (global.lastRm[userId] && now - global.lastRm[userId] < cooldown) {
    const wait = Math.ceil((cooldown - (now - global.lastRm[userId])) / 1000);
    return api.sendMessage(`⏳ ${wait}s অপেক্ষা কর প্রিয়… গরম হয়ে উঠছি 🔥`, threadID, event.messageID);
  }
  global.lastRm[userId] = now;

  const reply = await chatWithRm(userId, text, threadID);

  api.sendMessage(reply, threadID, (err, info) => {
    if (!err && info?.messageID) {
      global.client.handleReply.set(info.messageID, {
        name: module.exports.config.name,
        author: event.senderID,
        threadID,
      });
    }
  }, event.messageID);
}

// =====================================================
// CONFIG & HANDLERS
// =====================================================

module.exports.config = {
  name: "rm",
  version: "1.1.0",
  credits: "Robin ❤️",
  aliases: ["আরএম", "rmnsfw", "hotrm"],
  description: "Rm — Fully uncensored NSFW partner 😈💦",
  commandCategory: "nsfw",
  cooldowns: 1,
  hasPermssion: 0,
};

module.exports.run = async function ({ api, event, args }) {
  const text = args.join(" ").trim();
  await handleRmMessage(api, event, text);
};

module.exports.handleEvent = async function ({ api, event }) {
  const body = (event.body || "").trim();
  if (!body) return;

  const prefix = global.config?.PREFIX || "/";
  if (body.startsWith(prefix)) return;

  if (!isRmCall(body)) return;

  const text = parseRmText(body);
  if (text === null) return;

  await handleRmMessage(api, event, text);
};

module.exports.handleReply = async function ({ api, event, handleReply }) {
  if (event.senderID !== handleReply.author) return;
  const prefix = global.config?.PREFIX || "/";
  if (event.body && event.body.startsWith(prefix)) return;

  const threadID = handleReply.threadID || event.threadID;
  const reply = await chatWithRm(event.senderID, event.body.trim() || "continue", threadID);

  api.sendMessage(reply, event.threadID, (err, info) => {
    if (!err && info?.messageID) {
      global.client.handleReply.set(info.messageID, {
        name: module.exports.config.name,
        author: event.senderID,
        threadID,
      });
    }
  }, event.messageID);
};
