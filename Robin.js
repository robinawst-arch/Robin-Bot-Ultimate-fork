// =============================================
// ROBIN x MOYNA BOT – FINAL SAFE PRODUCTION BUILD
// (Fixed: GLOBAL mention/ID extract so idea/kick/relation/uid works)
// =============================================

// ===================== KEEP ALIVE SERVER =====================
const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.status(200).send("💙 Robin x Moyna Bot Alive");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌍 KeepAlive server running on port ${PORT}`);
});

// Render / VPS heartbeat
setInterval(
  () => {
    console.log("🫀 Heartbeat: process alive");
  },
  1000 * 60 * 5,
);

// ===================== IMPORTS =====================
const fs = require("fs");
const path = require("path");
const login = require("fca-priyansh");

const { log, banner, loadLanguage, initGetText } = require("./utils/helpers");
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
  config.APPSTATEPATH || "appstate.json",
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

// ===================== MENTION HELPERS (GLOBAL FIX) =====================
function normalizeEventBasics(event) {
  event.body = typeof event.body === "string" ? event.body : "";
  event.mentions =
    event.mentions && typeof event.mentions === "object" ? event.mentions : {};

  // Some FCA forks place mentions here
  const lmd = event.logMessageData;
  if (
    !Object.keys(event.mentions).length &&
    lmd?.mentions &&
    typeof lmd.mentions === "object"
  ) {
    event.mentions = lmd.mentions;
  }
  if (
    !Object.keys(event.mentions).length &&
    lmd?.messageMetadata?.mentions &&
    typeof lmd.messageMetadata.mentions === "object"
  ) {
    event.mentions = lmd.messageMetadata.mentions;
  }
}

// Extract rough "@Name" from a string (first one)
function extractAtName(text) {
  if (!text) return null;
  const idx = text.indexOf("@");
  if (idx === -1) return null;

  const sub = text.slice(idx + 1).trim();
  if (!sub) return null;

  // Stop at double-space/newline/end to keep multiword names somewhat
  const m = sub.match(/(.+?)(\s{2,}|\n|$)/);
  const name = (m?.[1] || "").trim();
  return name.length ? name : null;
}

// Try to fill event.mentions when FB payload doesn't include it
async function forceBuildMentions(api, event) {
  // Only if mentions empty + body has "@"
  if (Object.keys(event.mentions).length > 0) return;
  if (!event.body || !event.body.includes("@")) return;

  const typedName = extractAtName(event.body);
  if (!typedName) return;

  try {
    const threadInfo = await api.getThreadInfo(event.threadID);
    const members = threadInfo?.participantIDs || [];
    if (!members.length) return;

    const q = typedName.toLowerCase();

    // Try batch userInfo (some forks support array)
    let info = null;
    try {
      info = await api.getUserInfo(members);
    } catch {
      info = null;
    }

    // If batch worked, match without spamming API calls
    if (info && typeof info === "object") {
      for (const uid of members) {
        const nm = info?.[uid]?.name;
        if (nm && nm.toLowerCase().includes(q)) {
          event.mentions[uid] = nm;
          return;
        }
      }
      return;
    }

    // Fallback: limited per-user calls (avoid huge spam)
    const limit = Math.min(members.length, 40);
    for (let i = 0; i < limit; i++) {
      const uid = members[i];
      try {
        const one = await api.getUserInfo(uid);
        const nm = one?.[uid]?.name;
        if (nm && nm.toLowerCase().includes(q)) {
          event.mentions[uid] = nm;
          return;
        }
      } catch {}
    }
  } catch {}
}

// ===================== LOGIN =====================
log("SYSTEM", "Logging in…");

login({ appState: require(appStatePath) }, async (err, api) => {
  if (err) {
    log("LOGIN-ERROR", err);
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
    messageID,
  ) {
    return new Promise((resolve, reject) => {
      api.sendMessage(
        message,
        threadID,
        (err2, info) => {
          if (err2) reject(err2);
          else resolve(info);
        },
        messageID,
      );
    });
  };

  // ================= API OPTIONS =================
  api.setOptions({
    listenEvents: true,
    forceLogin: false,
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
    global.data.allThreadID = threads.map((t) => t.threadID);
    log("SYSTEM", `Loaded ${global.data.allThreadID.length} threads`);
  } catch {
    log("WARN", "Thread list load failed");
  }

  log("ROBIN", `${BOTNAME} logged in successfully`);
  log("MOYNA", "Bot online 💙");

  // ===================== LISTENER =====================
  api.listenMqtt(async (err2, event) => {
    if (err2 || !event) return;

    // ✅ GLOBAL FIX: make event.body + event.mentions always safe + try to rebuild mentions
    normalizeEventBasics(event);
    await forceBuildMentions(api, event);

    const body = event.body.trim();

    // ---------- HANDLE REPLY ----------
    try {
      await checkReply(api, event, log);
    } catch {}

    // ---------- RUN EVENTS (auto behaviors) ----------
    if (!config.DISABLE_AUTO_BEHAVIORS) {
      // Run event modules triggered by logMessageType
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

      // Run event modules that use handleEvent
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

      // Run no-prefix command event handlers (auto replies/reactions)
      const seenCmds = new Set();
      for (const cmd of global.client.commands.values()) {
        if (seenCmds.has(cmd)) continue;
        seenCmds.add(cmd);
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
    }

    // ---------- PREFIX COMMAND ----------
    if (!body.startsWith(PREFIX)) return;

    const args = body.slice(PREFIX.length).trim().split(/\s+/);
    const commandName = (args.shift() || "").toLowerCase();
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
      log("CMD-ERROR", e?.message || e);
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
