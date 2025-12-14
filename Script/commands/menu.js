module.exports.config = {
  name: "menu",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Robin-Bot",
  description: "Show all available commands by category",
  commandCategory: "system",
  usages: "[category name] or [page number]",
  cooldowns: 5,
};

module.exports.run = async function ({ api, event, args }) {
  const { commands } = global.client;
  const { threadID, messageID } = event;
  const prefix = global.config.PREFIX || "/";

  // Organize commands by category
  const categories = {};

  for (const [name, cmd] of commands) {
    if (!cmd.config) continue;

    const category = cmd.config.commandCategory || "Uncategorized";
    if (!categories[category]) categories[category] = [];

    // Avoid duplicate entries (aliases)
    if (!categories[category].includes(name) && cmd.config.name === name) {
      categories[category].push(name);
    }
  }

  // If specific category requested
  if (args[0]) {
    const categoryName = args.join(" ");
    let found = null;

    // Case-insensitive search
    for (const cat in categories) {
      if (cat.toLowerCase() === categoryName.toLowerCase()) {
        found = cat;
        break;
      }
    }

    if (found) {
      const cmds = categories[found].sort();
      let message = `━━━━ ${found.toUpperCase()} ━━━━\n\n`;
      message += `📋 Total Commands: ${cmds.length}\n\n`;

      cmds.forEach((cmd, i) => {
        message += `${i + 1}. ${prefix}${cmd}\n`;
      });

      message += `\n━━━━━━━━━━━━━━━━━━━━━━\n© Robin-Bot`;

      return api.sendMessage(message, threadID, messageID);
    }
  }

  // Show all categories
  const categoryList = Object.keys(categories).sort();
  let message = `━━━━ 📋 COMMAND MENU ━━━━\n\n`;
  message += `🤖 Bot: ${global.config.BOTNAME || "Robin-Bot"}\n`;
  message += `⚡ Prefix: ${prefix}\n`;
  message += `📊 Total Commands: ${commands.size}\n`;
  message += `📂 Categories: ${categoryList.length}\n\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  categoryList.forEach((cat, i) => {
    const count = categories[cat].length;
    message += `${i + 1}. ${cat} (${count})\n`;
  });

  message += `\n━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  message += `💡 Usage:\n`;
  message += `• ${prefix}menu [category] - View category\n`;
  message += `• ${prefix}help [command] - Command info\n\n`;
  message += `© Robin-Bot`;

  return api.sendMessage(message, threadID, messageID);
};
