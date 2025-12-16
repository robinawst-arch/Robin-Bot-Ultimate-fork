// =============================================
// ROBIN x MOYNA BOT – FINAL PRODUCTION BUILD
// Auto Commands Loader + NoPrefix + Reply System
// Render / Railway / Fly.io SAFE
// Credit: ROBIN ❤️
// =============================================

// ===================== KEEP ALIVE SERVER (MUST BE FIRST) =====================
const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.status(200).send("💙 Robin x Moyna Bot Alive");
});

const PORT = process.env.PORT;
if (!PORT) {
  console.error("❌ PORT not found. Platform will stop the service.");
  process.exit(1);
}

const server = app.listen(PORT, () => {
  console.log(`🌍 KeepAlive server running on port ${PORT}`);
});

// Internal heartbeat (Render idle protection)
setInterval(() => {
  console.log("🫀 Heartbeat: bot process alive");
}, 1000 * 60 * 4);

// ===================== IMPORTS =====================
const fs = require("fs");
const path = require("path");
const login = require("priyanshu-fca");

// Modular helpers
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
    // Let platform restart cleanly
    return setTimeout(() => process.exit(0), 5000);
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
          else {
            if (callback) callback(err, info);
            resolve(info);
          }
        },
        messageID
      );
    });
  };

  // ================= APPSTATE AUTO REFRESH =================
  setInterval(() => {
    try {
      const newState = api.getAppState();
      fs.writeFileSync(appStatePath, JSON.stringify(newState, null, 2));
      log("SYSTEM", "✅ Appstate refreshed");
    } catch (e) {
      log("WARN", "Appstate refresh failed");
    }
  }, 1000 * 60 * 30);

  // ================= API OPTIONS =================
  api.setOptions({
    listenEvents: true,
    forceLogin: true,
    selfListen: false,
    logLevel: "silent",
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

    // Reply handler
    try {
      await checkReply(api, event, log);
    } catch {}

    // Event types (subscribe, unsend, etc.)
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

    // handleEvent (global)
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

    // No-prefix commands
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

    // Prefix commands
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

// ===================== GRACEFUL SHUTDOWN (IMPORTANT) =====================
global.isRestarting = false;

const gracefulExit = (signal) => {
  if (global.isRestarting) return;
  console.log(`🛑 Graceful shutdown (${signal})`);

  server.close(() => {
    setTimeout(() => {
      process.exit(0); // clean exit (no failure detect)
    }, 1000);
  });
};

process.on("SIGTERM", gracefulExit);
process.on("SIGINT", gracefulExit);

// ===================== SAFETY NET =====================
process.on("unhandledRejection", (reason) => {
  console.error("UnhandledPromiseRejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("UncaughtException:", err);
});
