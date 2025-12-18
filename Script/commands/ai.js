// ====================================================
// Moyna AI Chat Command ❤️ (Group + Multi Memory Support)
// Version: 3.0.0
// ====================================================

const fs = require("fs");
const axios = require("axios");
require("dotenv").config();

// Folder for user memories
const MEMORY_DIR = "./memory";
if (!fs.existsSync(MEMORY_DIR)) fs.mkdirSync(MEMORY_DIR);

// Relationship setup ❤️
const ROBIN_ID = "100091520325159"; // 👉 তোমার UID বসাও
const RELATION_PROMPT =   তুমি ময়না — রবিনের গার্লফ্রেন্ড 💞     তুমি রোমান্টিক, ভালোবাসাপূর্ণ, কোমলভাবে বাংলা ভাষায় কথা বলবে।     রবিনকে তুমি খুব ভালোবাসো ❤️    ;

// Validate API key
function validateApiKey() {
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey || apiKey.startsWith("sk-your")) {
console.error("❌ Missing OpenAI API Key");
return false;
}
return true;
}

// Load memory for user
function loadUserMemory(userId) {
const filePath = ${MEMORY_DIR}/${userId}.json;
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
const filePath = ${MEMORY_DIR}/${userId}.json;
fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// ================= Chat Function =================
async function chatWithAI(userId, prompt, retryCount = 0) {
try {
if (!validateApiKey()) {
return "🔑 API Key সেটআপ করুন .env ফাইলে।";
}

let memory = loadUserMemory(userId);  
memory.push({ role: "user", content: prompt });  

// Determine system prompt  
let systemPrompt = `

তুমি ময়না, এক বন্ধুসুলভ AI সহকারী।
তুমি সবাইকে বাংলা ভাষায় সহানুভূতিশীলভাবে উত্তর দেবে।
`;
if (userId === ROBIN_ID) {
systemPrompt = RELATION_PROMPT;
}

const response = await axios.post(  
  "https://api.openai.com/v1/chat/completions",  
  {  
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",  
    messages: [  
      { role: "system", content: systemPrompt },  
      ...memory.slice(-12),  
    ],  
    max_tokens: 600,  
    temperature: 0.85,  
  },  
  {  
    headers: {  
      "Content-Type": "application/json",  
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,  
    },  
  }  
);  

const reply = response.data.choices[0].message.content;  
memory.push({ role: "assistant", content: reply });  
saveUserMemory(userId, memory);  

return reply;

} catch (err) {
console.error("AI Error:", err.response?.data || err.message);

if (err.response?.status === 429) {  
  if (retryCount < 2) {  
    await new Promise((r) => setTimeout(r, 4000));  
    return chatWithAI(userId, prompt, retryCount + 1);  
  }  
  return "⏰ Rate limit exceeded! পরে চেষ্টা করো।";  
}  
return "😔 আমি এখন একটু ব্যস্ত আছি, পরে বলো প্রিয়।";

}
}

// ================= Command Config =================
module.exports.config = {
name: "ai",
version: "3.0.0",
credits: "Robin-Bot",
description: "Chat with Moyna (Group-safe + Multi-memory)",
commandCategory: "chat",
cooldowns: 1,
};

// ================= Run Command =================
module.exports.run = async function ({ api, event, args }) {
const message = args.join(" ");
if (!message)
return api.sendMessage(
"বলোনা কিছু 🩷 আমি শুনছি...",
event.threadID,
event.messageID
);

const userId = event.senderID;
if (!global.lastRequest) global.lastRequest = {};
const now = Date.now();
const cooldown = (process.env.AI_COOLDOWN || 10) * 1000;

if (
global.lastRequest[userId] &&
now - global.lastRequest[userId] < cooldown
) {
const waitTime = Math.ceil(
(cooldown - (now - global.lastRequest[userId])) / 1000
);
return api.sendMessage(
⏳ ${waitTime} সেকেন্ড অপেক্ষা করো...,
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

Eita age dekho
