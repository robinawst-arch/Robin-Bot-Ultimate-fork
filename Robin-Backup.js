// =============================================
// ROBIN x MOYNA BOT – ADVANCED CYBER SYSTEM
// Auto Commands Loader + NoPrefix + Reply System
// Stable for Render / Railway / Cyclic
// Credit: ROBIN ❤️
// =============================================

const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const moment = require("moment-timezone");
const login = require("priyanshu-fca");
const figlet = require("figlet");
const express = require("express");

// Ensure global.config is present (safe load of config.json)
if (!global.config) {
  try {
    const cfgPath = path.join(__dirname, "config.json");
    if (fs.existsSync(cfgPath)) {
      global.config = require(cfgPath);
    } else {
      console.warn("config.json not found at", cfgPath, "- using empty config");
      global.config = {};
    }
  } catch (e) {
    console.error(
      "Failed to load config.json:",
      e && e.message ? e.message : e
    );
    global.config = {};
  }
}

// Helper to get config keys with defaults
global.getConfig = (key, defaultValue) => {
  try {
    if (!global.config) return defaultValue;
    const val = global.config[key];
    return typeof val === "undefined" ? defaultValue : val;
  } catch (e) {
    return defaultValue;
  }
};

// Defensive example: replace unsafe destructure like:
//   const { ADMINBOT, NDH } = global.config;
// with safe defaults:
const ADMINBOT = getConfig("ADMINBOT", []);
const NDH = getConfig("NDH", []);

// ---------- LOG SYSTEM ----------
function log(type, text) {
  const t = moment().tz("Asia/Dhaka").format("HH:mm:ss");
  console.log(
    chalk.cyan(`[ ${t} ]`) + chalk.yellow(` [ ${type} ] `) + chalk.white(text)
  );
}

// ---------- BANNER ----------
function banner() {
  console.log(chalk.blueBright("\n====================================="));
  console.log(chalk.magenta(figlet.textSync("ROBIN", { font: "Standard" })));
  console.log(chalk.blueBright("========== ROBIN x MOYNA ============\n"));
}

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

// ---------- GLOBAL STORES ----------
global.client = {
  commands: new Map(),
  events: [],
  eventRegistered: [],
  handleReply: new Map(),
  config,
  configPath: configPath,
  mainPath: __dirname,
};

global.data = {
  users: new Map(),
  threads: new Map(),
  threadData: new Map(),
  allThreadID: [],
  allUserID: [],
};

// Module data for commands
global.moduleData = {};

// Node modules for commands
global.nodemodule = {
  "fs-extra": require("fs-extra"),
  "moment-timezone": require("moment-timezone"),
  child_process: require("child_process"),
  path: require("path"),
  chalk: require("chalk"),
};

// ===================================================
// 📌 LANGUAGE SYSTEM
// ===================================================
global.language = {};

function loadLanguage() {
  const langFile = path.join(__dirname, "languages", "en.lang");
  if (!fs.existsSync(langFile)) {
    log("WARN", "Language file not found!");
    return;
  }

  const content = fs.readFileSync(langFile, "utf-8");
  const lines = content.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const [key, ...valueParts] = trimmed.split("=");
    if (key && valueParts.length > 0) {
      global.language[key.trim()] = valueParts.join("=").trim();
    }
  }

  log(
    "SYSTEM",
    `Loaded ${Object.keys(global.language).length} language strings`
  );
}

// getText function to retrieve language strings
global.getText = function (...args) {
  // Handle different call patterns:
  // getText("key") or getText("module", "key") or getText("module", "key", values...)

  if (args.length === 0) return "";

  // If last arg is array or args are just strings, handle replacements
  let langKey;
  let replacements = [];

  if (args.length === 1) {
    langKey = args[0];
  } else if (args.length === 2) {
    // Could be (module, key) or (key, value)
    if (typeof args[1] === "string" || typeof args[1] === "number") {
      langKey = `${args[0]}.${args[1]}`;
    } else {
      langKey = args[0];
      replacements = Array.isArray(args[1]) ? args[1] : [args[1]];
    }
  } else {
    // Multiple args: (module, key, val1, val2...) or (key, val1, val2...)
    const lastArg = args[args.length - 1];
    if (Array.isArray(lastArg)) {
      langKey = args.slice(0, -1).join(".");
      replacements = lastArg;
    } else {
      // Could be module.key or just key with multiple replacements
      if (
        args.length > 2 &&
        typeof args[0] === "string" &&
        typeof args[1] === "string"
      ) {
        langKey = `${args[0]}.${args[1]}`;
        replacements = args.slice(2);
      } else {
        langKey = args[0];
        replacements = args.slice(1);
      }
    }
  }

  let text = global.language[langKey] || langKey;

  // Replace %1, %2, %3... with values
  if (replacements.length > 0) {
    replacements.forEach((val, i) => {
      text = text.replace(new RegExp(`%${i + 1}`, "g"), val);
    });
  }

  return text;
};

// Includes
const Users = require(path.join(__dirname, "includes", "Users.js"));
const Threads = require(path.join(__dirname, "includes", "Threads.js"));

// ===================================================
// 📌 REPLY SYSTEM
// ===================================================
async function checkReply(api, event) {
  if (!event.messageReply) return;

  const data = global.client.handleReply.get(event.messageReply.messageID);
  if (!data) return;

  const cmd = global.client.commands.get(data.name);
  if (!cmd) return;

  // Support both onReply and handleReply naming conventions
  const replyHandler = cmd.onReply || cmd.handleReply;
  if (typeof replyHandler !== "function") return;

  try {
    await replyHandler({
      api,
      event,
      reply: data,
      handleReply: data,
      Users,
      Threads,
      getText: global.getText,
    });
  } catch (e) {
    log("REPLY-ERROR", e.message);
  }
}

// ===================================================
// 📌 COMMAND LOADER
// ===================================================
function loadCommands() {
  const cmdDir = path.join(__dirname, "Script", "commands");

  if (!fs.existsSync(cmdDir)) {
    log("WARN", "Script/commands folder missing!");
    return;
  }

  const files = fs.readdirSync(cmdDir).filter((f) => f.endsWith(".js"));

  for (const file of files) {
    const full = path.join(cmdDir, file);

    try {
      const cmd = require(full);

      if (cmd.config?.name) {
        global.client.commands.set(cmd.config.name.toLowerCase(), cmd);

        // Load aliases if available
        if (cmd.config.aliases && Array.isArray(cmd.config.aliases)) {
          cmd.config.aliases.forEach((alias) => {
            global.client.commands.set(alias.toLowerCase(), cmd);
          });
        }

        log("COMMAND", `Loaded: ${cmd.config.name}`);
      }
    } catch (e) {
      log("ERROR", `Fail load ${file}: ${e.message}`);
    }
  }
  log("SYSTEM", `Total Commands Loaded: ${global.client.commands.size}`);
}

// ===================================================
// 📌 LOGIN WITH AUTO-REFRESH APPSTATE
// ===================================================
log("SYSTEM", "Logging in…");

login({ appState: require(appStatePath) }, async (err, api) => {
  if (err) return log("ERROR", err);

  banner();

  global.client.api = api;
  Users.setAPI(api);
  Threads.setAPI(api);

  // ===== AUTO-REFRESH APPSTATE (Prevents expiry) =====
  setInterval(() => {
    try {
      const newAppState = api.getAppState();
      fs.writeFileSync(appStatePath, JSON.stringify(newAppState, null, 2));
      log("SYSTEM", "✅ Appstate auto-refreshed");
    } catch (e) {
      log("WARN", "Appstate refresh failed: " + e.message);
    }
  }, 1800000); // Refresh every 30 minutes

  api.setOptions({
    listenEvents: true,
    forceLogin: true,
    logLevel: "silent",
    selfListen: false,
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    selfListen: false,
  });

  loadLanguage();
  loadCommands();

  // Load all thread IDs
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
    }, 600000); // Every 10 minutes
  }

  // ===================================================
  // 📌 LISTENER
  // ===================================================
  api.listenMqtt(async (err, event) => {
    if (err) return log("ERROR", `listen: ${err}`);

    // Enhanced event validation
    if (!event) return;
    if (!event.body || typeof event.body !== "string") {
      // Handle non-text events silently
      if (event.type === "message_reply" || event.attachments) {
        // Process reply or attachment events
      } else {
        return;
      }
    }

    const body = event.body ? event.body.trim() : "";

    // ---------- HANDLE REPLY ----------
    try {
      await checkReply(api, event);
    } catch (e) {
      log("REPLY-ERROR", e.message);
    }

    // ---------- NO PREFIX EVENTS ----------
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
        } catch (e) {
          log("CMD-ERROR", e.message);
        }
      }
    }

    // ---------- PREFIX COMMAND ----------
    if (!body.startsWith(PREFIX)) return;

    const args = body.slice(PREFIX.length).trim().split(/\s+/);
    const commandName = args.shift().toLowerCase();

    const cmd = global.client.commands.get(commandName);

    // Default
    if (!cmd) {
      if (commandName === "ping")
        return api.sendMessage("🏓 Pong! Bot is active 💙", event.threadID);

      if (commandName === "help")
        return api.sendMessage(
          `✨ ${BOTNAME} Command List

${PREFIX}help — Help  
${PREFIX}ping — Check

Prefix: ${PREFIX}`,
          event.threadID
        );

      return;
    }

    // Run command
    try {
      if (cmd.run) {
        // Wrap command execution with error boundaries
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
      // Don't send error message to avoid spam
      // Just log it for debugging
    }
  });
});

// ===================================================
// KEEP ALIVE SERVER
// ===================================================
const app = express();
app.get("/", (req, res) => res.send("💙 Robin x Moyna Bot Active"));

const PORT = process.env.PORT || 3000;
const server = app
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

// Global error handlers (optional but recommended)
process.on("unhandledRejection", (reason) => {
  console.error("UnhandledPromiseRejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("UncaughtException:", err);
});
