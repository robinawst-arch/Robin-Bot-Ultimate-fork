// =============================================
// ROBIN x MOYNA BOT – FINAL SAFE PRODUCTION BUILD
// Appstate SAFE | Facebook SAFE | Render/VPS SAFE
// Credit: ROBIN ❤️
// =============================================

// ===================== KEEP ALIVE SERVER =====================
const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.status(200).send("💙 Robin x Moyna Bot Alive");
});

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`🌍 KeepAlive server running on port ${PORT}`);
});

// Render / VPS heartbeat
setInterval(() => {
  console.log("🫀 Heartbeat: process alive");
}, 1000 * 60 * 5);

// ===================== IMPORTS =====================
const fs = require("fs");
const path = require("path");
const login = require("priyanshu-fca");

const {
  log,
  banner,
  loadLanguage,
  initGetText
} = require("./utils/helpers");

const setupGlobals = require("./includes/globalSetup");
const loadCommands = require("./includes/commandLoader");
const { checkReply } = require("./includes/eventHandler");

// ===================== LOAD CONFIG =====================
const configPath = path.join(__dirname, "config.json");
if (!fs.existsSync(configPath)) {
  console.error("❌ config.json missing");
  process.exit(1);
}
const config = require(configPath);

const PREFIX = config.PREFIX || "/";
const BOTNAME = config.BOTNAME || "Moyna";

// ===================== LOAD APPSTATE =====================
const appStatePath = path.join(
  __dirname,
  config.APPSTATEPATH || "appstate.json"
);

if (!fs.existsSync(appStatePath)) {
  console.error("❌ appstate.json missing");
  process.exit(1);
}

// ===================== GLOBAL INIT =====================
setupGlobals(config, configPath, __dirname);
initGetText();

const Users = require("./includes/Users.js");
const Threads = require("./includes/Threads.js");

// ===================== LOGIN =====================
log("SYSTEM", "Logging in…");

login({ appState: require(appStatePath) }, async (err, api) => {
  if (err) {
    log("LOGIN-ERROR", err);
    // ❌ exit করবো না, retry allow
    return;
  }

  banner();

  global.client.api = api;
  Users.setAPI(api);
  Threads.setAPI(api);

  // ================= SEND MESSAGE WRAPPER =================
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

  // ================= API OPTIONS (ANTI-DETECTION) =================
  api.setOptions({
    listenEvents: true,
    forceLogin: false,          // 🔐 VERY IMPORTANT
    selfListen: false,
    logLevel: "silent",
    autoMarkRead: false,
    autoMarkDelivery: false,
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
  });

  // ================= LOAD SYSTEMS =================
  loadLanguage(__dirname, log);
  loadCommands(log, __dirname);

  try {
    const threads = await api.getThreadList(100, null, ["INBOX"]);
    global.data.allThreadID = threads.map(t => t.threadID);
    log("SYSTEM", `Loaded ${global.data.allThreadID.length} threads`);
  } catch {
    log("WARN", "Thread list load failed");
  }

  log("ROBIN", `${BOTNAME} logged in successfully`);
  log("MOYNA", "Bot online 💙");

  // ===================== LISTENER =====================
  api.listenMqtt(async (err, event) => {
    if (err || !event) return;

    const body = event.body ? event.body.trim() : "";

    try {
      await checkReply(api, event, log);
    } catch {}

    if (global.client.events && event.logMessageType) {
      for (const evt of global.client.events.values()) {
        if (evt.config?.eventType?.includes(event.logMessageType)) {
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

    if (!body.startsWith(PREFIX)) return;

    const args = body.slice(PREFIX.length).trim().split(/\s+/);
    const commandName = args.shift().toLowerCase();
    const cmd = global.client.commands.get(commandName);

    if (!cmd) {
      if (commandName === "ping") {
        return api.sendMessage("🏓 Pong! Bot is active 💙", event.threadID);
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

// ===================== GRACEFUL SHUTDOWN =====================
process.on("SIGTERM", () => {
  console.log("SIGTERM received");
  setTimeout(() => process.exit(0), 2000);
});

process.on("SIGINT", () => {
  console.log("SIGINT received");
  setTimeout(() => process.exit(0), 2000);
});

// ===================== SAFETY =====================
process.on("unhandledRejection", () => {});
process.on("uncaughtException", () => {});
