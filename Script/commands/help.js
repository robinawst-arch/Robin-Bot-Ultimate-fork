module.exports.config = {
  name: "help",
  version: "4.0.0",
  hasPermssion: 0,
  credits: "Robin-Bot",
  description: "Premium help menu (no gif)",
  commandCategory: "system",
  usages: "[command/page]",
  cooldowns: 3,
};

module.exports.run = async function ({ api, event, args }) {
  const { commands } = global.client;

  const threadSetting = global.data.threadData.get(event.threadID) || {};
  const prefix = threadSetting.PREFIX || global.config.PREFIX;

  const banner = `
╔══════════════════════════╗
     ✨ 𝗣𝗥𝗘𝗠𝗜𝗨𝗠 𝗛𝗘𝗟𝗣 𝗠𝗘𝗡𝗨 ✨
╚══════════════════════════╝
`;

  // ========= help <command> =========
  if (args[0] && commands.has(args[0].toLowerCase())) {
    const cmd = commands.get(args[0].toLowerCase());

    const info = `${banner}
🔰 Command: ${cmd.config.name}
📘 Description: ${cmd.config.description}
🛠 Usage: ${prefix}${cmd.config.name} ${cmd.config.usages || ""}
📂 Category: ${cmd.config.commandCategory}
⏳ Cooldown: ${cmd.config.cooldowns}s
🔐 Permission: ${cmd.config.hasPermssion}
👨‍💻 Credits: ${cmd.config.credits}

👉 ${prefix}help <page>
`;

    return api.sendMessage(info, event.threadID, event.messageID);
  }

  // ========= help page =========
  const allCmds = Array.from(commands.keys()).sort();
  const perPage = 12;
  const page = parseInt(args[0]) || 1;

  const totalPage = Math.ceil(allCmds.length / perPage) || 1;
  const start = (page - 1) * perPage;
  const end = start + perPage;

  const list = allCmds
    .slice(start, end)
    .map((cmd) => `🔸 ${cmd}`)
    .join("\n");

  const menu = `${banner}
${list}

📄 Page: ${page}/${totalPage}
🧮 Total Commands: ${allCmds.length}

👉 ${prefix}help <command>
👉 ${prefix}help <page>

© Premium UI by Moyna ❤️ Robin
`;

  return api.sendMessage(menu, event.threadID, event.messageID);
};
