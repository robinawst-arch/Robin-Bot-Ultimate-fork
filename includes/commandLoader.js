// =============================================
// COMMAND LOADER - Hybrid Mirai + GoatBot Format
// =============================================

const fs = require("fs");
const path = require("path");

module.exports = function loadCommands(log, mainPath) {
  // Load commands
  const cmdDir = path.join(mainPath, "Script", "commands");

  if (!fs.existsSync(cmdDir)) {
    log("WARN", "Script/commands folder missing!");
    return;
  }

  const files = fs.readdirSync(cmdDir).filter((f) => f.endsWith(".js"));

  for (const file of files) {
    const full = path.join(cmdDir, file);

    try {
      delete require.cache[require.resolve(full)];
      const cmd = require(full);

      let commandData;

      // MIRAI FORMAT
      if (cmd.config && cmd.run) {
        commandData = cmd;
        commandData.type = "mirai";
        log("COMMAND", `Loaded: ${cmd.config.name}`);
      }
      // GOATBOT FORMAT
      else if (cmd.config && cmd.onStart) {
        commandData = createGoatBotWrapper(cmd);
        log("COMMAND", `Loaded: ${cmd.config.name}`);
      } else {
        log("WARN", `Invalid format: ${file}`);
        continue;
      }

      if (commandData && commandData.config?.name) {
        global.client.commands.set(
          commandData.config.name.toLowerCase(),
          commandData
        );

        if (
          commandData.config.aliases &&
          Array.isArray(commandData.config.aliases)
        ) {
          commandData.config.aliases.forEach((alias) => {
            global.client.commands.set(alias.toLowerCase(), commandData);
          });
        }
      }
    } catch (e) {
      log("ERROR", `Fail load ${file}: ${e.message}`);
    }
  }

  log("SYSTEM", `Total Commands Loaded: ${global.client.commands.size}`);

  // Load events
  const eventDir = path.join(mainPath, "Script", "events");

  if (!fs.existsSync(eventDir)) {
    log("WARN", "Script/events folder missing!");
    return;
  }

  const eventFiles = fs.readdirSync(eventDir).filter((f) => f.endsWith(".js"));
  let eventCount = 0;

  for (const file of eventFiles) {
    const full = path.join(eventDir, file);

    try {
      delete require.cache[require.resolve(full)];
      const evt = require(full);

      if (evt.config && evt.run) {
        global.client.events.set(evt.config.name.toLowerCase(), evt);
        log("EVENT", `Loaded: ${evt.config.name}`);
        eventCount++;
      }
    } catch (e) {
      log("ERROR", `Fail load event ${file}: ${e.message}`);
    }
  }

  if (eventCount > 0) {
    log("SYSTEM", `Total Events Loaded: ${eventCount}`);
  }
};

// Helper function to create GoatBot wrapper
function createGoatBotWrapper(cmd) {
  const Users = require(path.join(__dirname, "Users.js"));
  const Threads = require(path.join(__dirname, "Threads.js"));

  return {
    config: cmd.config,
    type: "goat",

    run: async function ({ api, event, args, Users, Threads, getText }) {
      return await cmd.onStart({
        api,
        event,
        args,
        message: {
          send: (msg, tid, callback) =>
            api.sendMessage(msg, tid || event.threadID, callback),
          reply: (msg, callback) =>
            api.sendMessage(msg, event.threadID, callback, event.messageID),
          react: (emoji) =>
            api.setMessageReaction(emoji, event.messageID, () => {}, true),
        },
        Users,
        Threads,
        usersData: {
          getName: async (uid) => {
            try {
              const info = await api.getUserInfo(uid);
              return info[uid]?.name || "User";
            } catch {
              return "User";
            }
          },
          get: async (uid) => {
            return Users.getData(uid);
          },
        },
        threadsData: {
          getName: async (tid) => {
            try {
              const info = await api.getThreadInfo(tid);
              return info?.threadName || "Thread";
            } catch {
              return "Thread";
            }
          },
          get: async (tid) => {
            return Threads.getData(tid);
          },
        },
        getLang: (key) => {
          const langKey = cmd.langs?.en?.[key] || key;
          return langKey;
        },
        commandName: cmd.config.name,
      });
    },

    handleEvent: cmd.onChat
      ? async function ({ api, event, Users, Threads }) {
          return await cmd.onChat({
            api,
            event,
            message: {
              send: (msg, tid, callback) =>
                api.sendMessage(msg, tid || event.threadID, callback),
              reply: (msg, callback) =>
                api.sendMessage(msg, event.threadID, callback, event.messageID),
              react: (emoji) =>
                api.setMessageReaction(emoji, event.messageID, () => {}, true),
            },
            Users,
            Threads,
            usersData: {
              getName: async (uid) => {
                try {
                  const info = await api.getUserInfo(uid);
                  return info[uid]?.name || "User";
                } catch {
                  return "User";
                }
              },
              get: async (uid) => {
                return Users.getData(uid);
              },
            },
            threadsData: {
              getName: async (tid) => {
                try {
                  const info = await api.getThreadInfo(tid);
                  return info?.threadName || "Thread";
                } catch {
                  return "Thread";
                }
              },
              get: async (tid) => {
                return Threads.getData(tid);
              },
            },
            getLang: (key) => {
              const langKey = cmd.langs?.en?.[key] || key;
              return langKey;
            },
          });
        }
      : undefined,

    onReply: cmd.onReply
      ? async function ({ api, event, reply, Users, Threads }) {
          return await cmd.onReply({
            api,
            event,
            reply,
            message: {
              send: (msg, tid, callback) =>
                api.sendMessage(msg, tid || event.threadID, callback),
              reply: (msg, callback) =>
                api.sendMessage(msg, event.threadID, callback, event.messageID),
            },
            Users,
            Threads,
            usersData: {
              getName: async (uid) => {
                try {
                  const info = await api.getUserInfo(uid);
                  return info[uid]?.name || "User";
                } catch {
                  return "User";
                }
              },
              get: async (uid) => {
                return Users.getData(uid);
              },
            },
            threadsData: {
              getName: async (tid) => {
                try {
                  const info = await api.getThreadInfo(tid);
                  return info?.threadName || "Thread";
                } catch {
                  return "Thread";
                }
              },
              get: async (tid) => {
                return Threads.getData(tid);
              },
            },
            getLang: (key) => {
              const langKey = cmd.langs?.en?.[key] || key;
              return langKey;
            },
          });
        }
      : undefined,
  };
}
