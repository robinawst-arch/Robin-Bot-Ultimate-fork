// =============================================
// ROBIN x MOYNA BOT – MODULAR ARCHITECTURE (FULL FIXED)
// Auto Commands Loader + NoPrefix + Reply System
// Stable for Render / Railway / Cyclic
// Credit: ROBIN ❤️
// =============================================

// ================= KEEP ALIVE SERVER (FIRST - RENDER SAFE) =================
const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.status(200).send("💙 Robin x Moyna Bot Active");
});

const PORT = process.env.PORT;
if (!PORT) {
  console.error("❌ PORT not found. Render will stop the service.");
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`🌍 KeepAlive Running on port ${PORT}`);
});

// Render idle protection
setInterval(() => {
  console.log("🫀 Render heartbeat alive");
}, 1000 * 60 * 4);

// ================= IMPORTS =================
const fs = require("fs");
const path = require("path");
const login = require("priyanshu-fca");

// Import modular components
const { log, banner, loadLanguage, initGetText } = require("./utils/helpers");
const setupGlobals = require("./includes/globalSetup");
const loadCommands = require("./includes/commandLoader");
const { checkReply } = require("./includes/eventHandler");

// ================= LOAD CONFIG =================
const configPath = path.join(__dirname, "config.json");
if (!fs.existsSync(configPath)) {
  log("ERROR", "config.json missing!");
  process.exit(1);
}
const config = require(configPath);

const PREFIX = config.PREFIX || "/";
const BOTNAME = config.BOTNAME || "Moyna";

// ================= LOAD APPSTATE =================
const appStatePath = path.join(
  __dirname,
  config.APPSTATEPATH || "appstate.json"
);
if (!fs.existsSync(appStatePath)) {
  log("ERROR", "appstate.json missing!");
  process.exit(1);
}

// ================= GLOBAL SETUP =================
setupGlobals(config, configPath, __dirname);

// ================= INIT LANGUAGE =================
initGetText();

// Includes
const Users = require("./includes/Users.js");
const Threads = require("./includes/Threads.js");

// ===================================================
// 📌 LOGIN
// ===================================================
log("SYSTEM", "Logging in…");

login({ appState: require(appStatePath) }, async (err, api) => {
  if (err) {
    log("LOGIN-ERROR", err);
    return setTimeout(() => process.exit(1), 5000);
  }

  banner();

  global.client.api = api;
  Users.setAPI(api);
  Threads.setAPI(api);

  // ===== SEND MESSAGE WRAPPER =====
  global.sendMessageWithTyping = async function (
    message,
    threadID,
    callback,
    messageID
  ) {
    return new Promise((resolve, reject) => {
      api.sendMessage(
        message,
        threadID,
        (err, info) => {
          if (err) reject(err);
          else resolve(info);
        },
        messageID
      );
    });
  };

  // ===== AUTO-REFRESH APPSTATE =====
  setInterval(() => {
    try {
      const newAppState = api.getAppState();
      fs.writeFileSync(appStatePath, JSON.stringify(newAppState, null, 2));
      log("SYSTEM", "✅ Appstate auto-refreshed");
    } catch (e) {
      log("WARN", "Appstate refresh failed: " + e.message);
    }
  }, 1000 * 60 * 30);

  // ===== API OPTIONS =====
  api.setOptions({
    listenEvents: true,
    forceLogin: true,
    logLevel: "silent",
    selfListen: false,
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
  });

  // ===== LOAD LANGUAGE & COMMANDS =====
  loadLanguage(__dirname, log);
  loadCommands(log, __dirname);

  // ===== LOAD THREADS =====
  try {
    const threadList = await api.getThreadList(100, null, ["INBOX"]);
    global.data.allThreadID = threadList.map((t) => t.threadID);
    log("SYSTEM", `Loaded ${global.data.allThreadID.length} threads`);
  } catch (e) {
    log("WARN", "Could not load thread list");
  }

  log("ROBIN", `${BOTNAME} successfully logged in!`);
  log("MOYNA", "Bot online 💙");

  // ===================================================
  // 📌 LISTENER
  // ===================================================
  api.listenMqtt(async (err, event) => {
    if (err || !event) return;

    const body = event.body ? event.body.trim() : "";

    // ---------- HANDLE REPLY ----------
    try {
      await checkReply(api, event, log);
    } catch {}

    // ---------- HANDLE EVENT TYPES ----------
    if (global.client.events && event.logMessageType) {
      for (const evt of global.client.events.values()) {
        if (
          evt.config?.eventType &&
          evt.config.eventType.includes(event.logMessageType)
        ) {
          try {
            await evt.run({
              api,
              event,
              Users,
              Threads,
              getText: global.getText,
            });
          } catch {}
        }
      }
    }

    // ---------- HANDLE ALL EVENTS ----------
    if (global.client.events) {
      for (const evt of global.client.events.values()) {
        if (typeof evt.handleEvent === "function") {
          try {
            await evt.handleEvent({
              api,
              event,
              Users,
              Threads,
              getText: global.getText,
            });
          } catch {}
        }
      }
    }

    // ---------- NO PREFIX COMMANDS ----------
    for (const cmd of global.client.commands.values()) {
      if (typeof cmd.handleEvent === "function") {
        try {
          await cmd.handleEvent({
            api,
            event,
            args: [],
            Users,
            Threads,
            getText: global.getText,
          });
        } catch {}
      }
    }

    // ---------- PREFIX COMMAND ----------
    if (!body.startsWith(PREFIX)) return;

    const args = body.slice(PREFIX.length).trim().split(/\s+/);
    const commandName = args.shift().toLowerCase();
    const cmd = global.client.commands.get(commandName);

    if (!cmd) {
      if (commandName === "ping") {
        return api.sendMessage(
          "🏓 Pong! Bot is active 💙",
          event.threadID
        );
      }
      return;
    }

    try {
      await cmd.run({
        api,
        event,
        args,
        Users,
        Threads,
        getText: global.getText,
        permssion: cmd.config?.hasPermssion || 0,
      });
    } catch (e) {
      log("CMD-ERROR", e.message);
    }
  });
});

// ================= PROCESS SAFETY =================
process.on("unhandledRejection", (reason) => {
  console.error("UnhandledPromiseRejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("UncaughtException:", err);
});
