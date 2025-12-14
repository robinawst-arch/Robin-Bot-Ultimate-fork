module.exports.config = {
  name: "cmd",
  version: "1.0.1",
  hasPermssion: 2,
  credits: "Robin-Bot",
  description: "Manage/Control all bot commands",
  commandCategory: "system",
  usages: "[load/unload/loadAll/unloadAll/info/count] [command name]",
  cooldowns: 2,
};

const loadCommand = function ({ moduleList, threadID, messageID, api }) {
  const { writeFileSync, unlinkSync, readFileSync } =
    global.nodemodule["fs-extra"];
  const { join } = global.nodemodule["path"];
  const { configPath, mainPath } = global.client;
  const logger = require(mainPath + "/utils/log");

  var errorList = [];
  delete require.cache[require.resolve(configPath)];
  var configValue = require(configPath);
  writeFileSync(
    configPath + ".temp",
    JSON.stringify(configValue, null, 2),
    "utf8"
  );

  for (const nameModule of moduleList) {
    try {
      const dirModule = __dirname + "/" + nameModule + ".js";
      delete require.cache[require.resolve(dirModule)];
      const command = require(dirModule);
      global.client.commands.delete(nameModule);

      if (!command.config || !command.run)
        throw new Error("Module is not properly formatted!");

      if (!global.client.eventRegistered) global.client.eventRegistered = [];
      global.client.eventRegistered = global.client.eventRegistered.filter(
        (info) => info != command.config.name
      );

      global.client.commands.set(command.config.name, command);

      // Load aliases if available
      if (command.config.aliases && Array.isArray(command.config.aliases)) {
        command.config.aliases.forEach((alias) => {
          global.client.commands.set(alias.toLowerCase(), command);
        });
      }

      logger.loader("Loaded command: " + command.config.name);
    } catch (error) {
      errorList.push("- " + nameModule + " reason: " + error.message);
    }
  }

  if (errorList.length > 0) {
    api.sendMessage(
      "❌ Some commands failed to load:\n" + errorList.join("\n"),
      threadID,
      messageID
    );
  } else {
    api.sendMessage(
      "✅ Successfully loaded: " + moduleList.join(", "),
      threadID,
      messageID
    );
  }

  writeFileSync(configPath, JSON.stringify(configValue, null, 2), "utf8");
  unlinkSync(configPath + ".temp");
};

const unloadModule = function ({ moduleList, threadID, messageID, api }) {
  const { writeFileSync, unlinkSync } = global.nodemodule["fs-extra"];
  const { configPath, mainPath } = global.client;
  const logger = require(mainPath + "/utils/log").loader;

  delete require.cache[require.resolve(configPath)];
  var configValue = require(configPath);
  writeFileSync(
    configPath + ".temp",
    JSON.stringify(configValue, null, 2),
    "utf8"
  );

  for (const nameModule of moduleList) {
    global.client.commands.delete(nameModule);

    if (!global.client.eventRegistered) global.client.eventRegistered = [];
    global.client.eventRegistered = global.client.eventRegistered.filter(
      (item) => item !== nameModule
    );

    if (!configValue["commandDisabled"]) configValue["commandDisabled"] = [];
    if (!configValue["commandDisabled"].includes(`${nameModule}.js`)) {
      configValue["commandDisabled"].push(`${nameModule}.js`);
    }

    if (!global.config["commandDisabled"])
      global.config["commandDisabled"] = [];
    if (!global.config["commandDisabled"].includes(`${nameModule}.js`)) {
      global.config["commandDisabled"].push(`${nameModule}.js`);
    }

    logger(`Unloaded command: ${nameModule}`);
  }

  writeFileSync(configPath, JSON.stringify(configValue, null, 2), "utf8");
  unlinkSync(configPath + ".temp");

  api.sendMessage(
    `✅ Successfully unloaded ${moduleList.length} command(s)`,
    threadID,
    messageID
  );
};

module.exports.run = function ({ event, args, api }) {
  if (!api || !api.sendMessage) {
    console.error("[CMD] ERROR: API object is undefined!");
    return;
  }

  // Check if user is admin
  const adminList = global.config.ADMINBOT || [];
  if (!adminList.includes(event.senderID)) {
    return api.sendMessage(
      "❌ You are not authorized to use this command!",
      event.threadID,
      event.messageID
    );
  }

  const { readdirSync } = global.nodemodule["fs-extra"];
  const { threadID, messageID } = event;

  var moduleList = args.slice(1);

  switch (args[0]) {
    case "count": {
      api.sendMessage(
        `📊 Currently loaded commands: ${global.client.commands.size}`,
        threadID,
        messageID
      );
      break;
    }
    case "load": {
      if (moduleList.length == 0)
        return api.sendMessage(
          "❌ Command name cannot be blank!",
          threadID,
          messageID
        );
      return loadCommand({ moduleList, threadID, messageID, api });
    }
    case "unload": {
      if (moduleList.length == 0)
        return api.sendMessage(
          "❌ Command name cannot be blank!",
          threadID,
          messageID
        );
      return unloadModule({ moduleList, threadID, messageID, api });
    }
    case "loadAll": {
      moduleList = readdirSync(__dirname).filter(
        (file) => file.endsWith(".js") && !file.includes("example")
      );
      moduleList = moduleList.map((item) => item.replace(/\.js/g, ""));
      return loadCommand({ moduleList, threadID, messageID, api });
    }
    case "unloadAll": {
      moduleList = readdirSync(__dirname).filter(
        (file) =>
          file.endsWith(".js") &&
          !file.includes("example") &&
          !file.includes("cmd")
      );
      moduleList = moduleList.map((item) => item.replace(/\.js/g, ""));
      return unloadModule({ moduleList, threadID, messageID, api });
    }
    case "info": {
      const command = global.client.commands.get(moduleList.join("") || "");

      if (!command)
        return api.sendMessage(
          "❌ The specified command does not exist!",
          threadID,
          messageID
        );

      const { name, version, hasPermssion, credits, cooldowns, dependencies } =
        command.config;

      return api.sendMessage(
        `━━━━ ${name.toUpperCase()} ━━━━\n\n` +
          `📝 Name: ${name}\n` +
          `👤 Created by: ${credits}\n` +
          `📌 Version: ${version}\n` +
          `🔒 Permission: ${
            hasPermssion == 0
              ? "User"
              : hasPermssion == 1
              ? "Admin"
              : "Bot Admin"
          }\n` +
          `⏱️ Cooldown: ${cooldowns} second(s)\n` +
          `📦 Dependencies: ${
            Object.keys(dependencies || {}).join(", ") || "None"
          }\n\n` +
          `© ROBIN`,
        threadID,
        messageID
      );
    }
    default: {
      return api.sendMessage(
        "━━━━ CMD MANAGER ━━━━\n\n" +
          "📋 Available commands:\n\n" +
          "• /cmd count - Show total commands\n" +
          "• /cmd load [name] - Load a command\n" +
          "• /cmd unload [name] - Unload a command\n" +
          "• /cmd loadAll - Load all commands\n" +
          "• /cmd unloadAll - Unload all commands\n" +
          "• /cmd info [name] - Show command info\n\n" +
          "© ROBIN",
        threadID,
        messageID
      );
    }
  }
};
