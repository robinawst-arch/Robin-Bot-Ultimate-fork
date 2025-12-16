// ============================================= // ROBIN x MOYNA BOT – RENDER SAFE FIXED VERSION // Stable for Render / Railway / Fly.io // Credit: ROBIN ❤️ // =============================================

// ================== KEEP ALIVE SERVER (FIRST) ================== const express = require("express"); const app = express();

app.get("/", (req, res) => { res.status(200).send("💙 Robin x Moyna Bot Alive"); });

const PORT = process.env.PORT; if (!PORT) { console.error("❌ PORT not found. Render will kill the app."); process.exit(1); }

app.listen(PORT, () => { console.log(🌍 KeepAlive running on port ${PORT}); });

// Internal heartbeat (Render idle protection) setInterval(() => { console.log("🫀 Render heartbeat alive"); }, 1000 * 60 * 4);

// ================== IMPORTS ================== const fs = require("fs"); const path = require("path"); const login = require("priyanshu-fca");

const { log, banner, loadLanguage, initGetText } = require("./utils/helpers"); const setupGlobals = require("./includes/globalSetup"); const loadCommands = require("./includes/commandLoader"); const { checkReply } = require("./includes/eventHandler");

// ================== LOAD CONFIG ================== const configPath = path.join(__dirname, "config.json"); if (!fs.existsSync(configPath)) { console.error("❌ config.json missing"); process.exit(1); } const config = require(configPath);

const PREFIX = config.PREFIX || "/"; const BOTNAME = config.BOTNAME || "Moyna";

// ================== LOAD APPSTATE ================== const appStatePath = path.join( __dirname, config.APPSTATEPATH || "appstate.json" );

if (!fs.existsSync(appStatePath)) { console.error("❌ appstate.json missing"); process.exit(1); }

// ================== GLOBAL SETUP ================== setupGlobals(config, configPath, __dirname); initGetText();

const Users = require("./includes/Users.js"); const Threads = require("./includes/Threads.js");

// ================== LOGIN ================== log("SYSTEM", "Logging in...");

login({ appState: require(appStatePath) }, async (err, api) => { if (err) { log("LOGIN-ERROR", err); return setTimeout(() => process.exit(1), 5000); }

banner();

global.client.api = api; Users.setAPI(api); Threads.setAPI(api);

global.sendMessageWithTyping = async function ( message, threadID, callback, messageID ) { return new Promise((resolve, reject) => { api.sendMessage(message, threadID, (err, info) => { if (err) reject(err); else resolve(info); }, messageID); }); };

// Auto-refresh appstate setInterval(() => { try { const newAppState = api.getAppState(); fs.writeFileSync(appStatePath, JSON.stringify(newAppState, null, 2)); log("SYSTEM", "✅ Appstate refreshed"); } catch (e) { log("WARN", "Appstate refresh failed"); } }, 1000 * 60 * 30);

api.setOptions({ listenEvents: true, forceLogin: true, logLevel: "silent", selfListen: false, userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36", });

loadLanguage(__dirname, log); loadCommands(log, __dirname);

try { const threadList = await api.getThreadList(100, null, ["INBOX"]); global.data.allThreadID = threadList.map(t => t.threadID); log("SYSTEM", Loaded ${global.data.allThreadID.length} threads); } catch (e) { log("WARN", "Thread list load failed"); }

log("ROBIN", ${BOTNAME} logged in successfully); log("MOYNA", "Bot online 💙");

// ================== LISTENER ================== api.listenMqtt(async (err, event) => { if (err || !event) return;

const body = event.body ? event.body.trim() : "";

try {
  await checkReply(api, event, log);
} catch {}

if (global.client.events && event.logMessageType) {
  for (const evt of global.client.events.values()) {
    if (evt.config?.eventType?.includes(event.logMessageType)) {
      try {
        await evt.run({ api, event, Users, Threads, getText: global.getText });
      } catch {}
    }
  }
}

if (global.client.events) {
  for (const evt of global.client.events.values()) {
    if (typeof evt.handleEvent === "function") {
      try {
        await evt.handleEvent({ api, event, Users, Threads, getText: global.getText });
      } catch {}
    }
  }
}

for (const cmd of global.client.commands.values()) {
  if (typeof cmd.handleEvent === "function") {
    try {
      await cmd.handleEvent({ api, event, args: [], Users, Threads, getText: global.getText });
    } catch {}
  }
}

if (!body.startsWith(PREFIX)) return;

const args = body.slice(PREFIX.length).trim().split(/\s+/);
const commandName = args.shift().toLowerCase();
const cmd = global.client.commands.get(commandName);

if (!cmd) {
  if (commandName === "ping")
    return api.sendMessage("🏓 Pong! Bot is active 💙", event.threadID);
  return;
}

try {
  await cmd.run({ api, event, args, Users, Threads, getText: global.getText });
} catch (e) {
  log("CMD-ERROR", e.message);
}

}); });

// ================== PROCESS SAFETY ================== process.on("unhandledRejection", err => { console.error("UnhandledRejection:", err); });

process.on("uncaughtException", err => { console.error("UncaughtException:", err); });
