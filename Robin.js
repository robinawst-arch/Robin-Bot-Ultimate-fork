// =============================================
// ROBIN x MOYNA BOT – MODULAR ARCHITECTURE
// Auto Commands Loader + NoPrefix + Reply System
// Stable for Render / Railway / Cyclic
// Credit: ROBIN ❤️
// =============================================

const fs = require("fs");
const path = require("path");
const login = require("priyanshu-fca");
const express = require("express");

// Import modular components
const { log, banner, loadLanguage, initGetText } = require("./utils/helpers");
const setupGlobals = require("./includes/globalSetup");
const loadCommands = require("./includes/commandLoader");
const { checkReply } = require("./includes/eventHandler");

// ---------- LOAD CONFIG ----------
const configPath = path.join(__dirname, "config.json");
if (!fs.existsSync(configPath)) {
  log("ERROR", "config.json missing!");
  process.exit(1);
}
const config = require(configPath);

const PREFIX = config.PREFIX || "/";
const BOTNAME = config.BOTNAME || "Moyna";

// ---------- LOAD APPSTATE ----------
const appStatePath = path.join(
  __dirname,
  config.APPSTATEPATH || "appstate.json"
);
if (!fs.existsSync(appStatePath)) {
  log("ERROR", "appstate.json missing!");
  process.exit(1);
}

// ---------- SETUP GLOBALS ----------
setupGlobals(config, configPath, __dirname);

// ---------- INIT LANGUAGE SYSTEM ----------
initGetText();

// Includes
const Users = require(path.join(__dirname, "includes", "Users.js"));
const Threads = require(path.join(__dirname, "includes", "Threads.js"));

// ===================================================
// 📌 LOGIN
// ===================================================
log("SYSTEM", "Logging in…");

login({ appState: require(appStatePath) }, async (err, api) => {
  if (err) return log("ERROR", err);

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
          else {
            if (callback) callback(err, info);
            resolve(info);
          }
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
  }, 1800000);

  // ===== API OPTIONS =====
  api.setOptions({
    listenEvents: true,
    forceLogin: true,
    logLevel: "silent",
    selfListen: false,
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });

  // ===== LOAD LANGUAGE & COMMANDS =====
  loadLanguage(__dirname, log);
  loadCommands(log, __dirname);

  // ===== LOAD THREADS =====
  try {
    const threadList = await api.getThreadList(100, null, ["INBOX"]);
    global.data.allThreadID = threadList.map((thread) => thread.threadID);
    log("SYSTEM", `Loaded ${global.data.allThreadID.length} threads`);
  } catch (e) {
    log("WARN", "Could not load thread list");
  }

  log("ROBIN", `${BOTNAME} successfully logged in!`);
  log("MOYNA", "Bot online 💙");

  // ===== KEEP YOUTUBE API ALIVE =====
  const YT_API_URL =
    process.env.YT_API_URL || "https://YOUR_API_URL.onrender.com";
  if (YT_API_URL && !YT_API_URL.includes("YOUR_API")) {
    setInterval(async () => {
      try {
        await require("axios").get(YT_API_URL);
        log("SYSTEM", "✅ YouTube API pinged");
      } catch (e) {
        log("WARN", "YouTube API ping failed");
      }
    }, 600000);
  }

  // ===================================================
  // 📌 LISTENER
  // ===================================================
  api.listenMqtt(async (err, event) => {
    if (err) return log("ERROR", `listen: ${err}`);
    if (!event) return;

    const body = event.body ? event.body.trim() : "";

    // ---------- HANDLE REPLY ----------
    try {
      await checkReply(api, event, log);
    } catch (e) {
      log("REPLY-ERROR", e.message);
    }

    // ---------- HANDLE EVENTS (log:subscribe, etc.) ----------
    if (global.client.events && event.logMessageType) {
      for (const evt of global.client.events.values()) {
        if (
          evt.config.eventType &&
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
          } catch (e) {
            log("EVENT-ERROR", `${evt.config.name}: ${e.message}`);
          }
        }
      }
    }

    // ---------- EVENT HANDLE EVENT (for all messages) ----------
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
          } catch (e) {
            // Silently ignore errors
          }
        }
      }
    }

    // ---------- NO PREFIX EVENTS ----------
    for (const cmd of global.client.commands.values()) {
      if (typeof cmd.handleEvent === "function") {
        try {
          if (!event.body && cmd.config?.name !== "autodl") {
            continue;
          }

          await cmd.handleEvent({
            api,
            event,
            args: [],
            Users,
            Threads,
            getText: global.getText,
          });
        } catch (e) {
          // Silently ignore errors
        }
      }
    }

    // ---------- PREFIX COMMAND ----------
    if (!body.startsWith(PREFIX)) return;

    const args = body.slice(PREFIX.length).trim().split(/\s+/);
    const commandName = args.shift().toLowerCase();

    const cmd = global.client.commands.get(commandName);

    // Default commands
    if (!cmd) {
      if (commandName === "ping")
        return api.sendMessage("🏓 Pong! Bot is active 💙", event.threadID);

      if (commandName === "help")
        return api.sendMessage(
          `✨ ${BOTNAME} Command List\n\n${PREFIX}help — Help\n${PREFIX}ping — Check\n\nPrefix: ${PREFIX}`,
          event.threadID
        );

      return;
    }

    // Run command
    try {
      if (cmd.run) {
        await cmd.run({
          api,
          event,
          args,
          Users,
          Threads,
          getText: global.getText,
          permssion: cmd.config?.hasPermssion || 0,
        });
      }
    } catch (e) {
      log("CMD-ERROR", e.message);
      console.error("Full error:", e);
    }
  });
});

// ===================================================
// KEEP ALIVE SERVER
// ===================================================
const app = express();
app.get("/", (req, res) => res.send("💙 Robin x Moyna Bot Active"));

const PORT = process.env.PORT || 3000;
app
  .listen(PORT, () => {
    console.log(`🌍 KeepAlive Running on port ${PORT}`);
  })
  .on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.log(`⚠️ Port ${PORT} busy, trying ${PORT + 1}...`);
      app.listen(PORT + 1, () => {
        console.log(`🌍 KeepAlive Running on port ${PORT + 1}`);
      });
    } else {
      console.error("Server error:", err);
    }
  });

// Error handlers
process.on("unhandledRejection", (reason) => {
  console.error("UnhandledPromiseRejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("UncaughtException:", err);
});
