module.exports.config = {
  name: "owner",
  version: "3.0.0",
  hasPermssion: 0,
  credits: "Robin-Bot",
  description: "Premium admin menu + owner info",
  commandCategory: "system",
  usages: "[list/add/remove]",
  cooldowns: 3,
};

module.exports.run = async function ({ api, event, args, Users, permssion }) {
  const fs = require("fs-extra");
  const { ADMINBOT } = global.config;
  const { threadID, messageID, mentions } = event;
  const configPath = global.client.configPath;

  delete require.cache[require.resolve(configPath)];
  const config = require(configPath);

  const sub = args[0];
  const target = args[1];

  const banner = `╔════════════════════════════╗
      👑 𝙊𝙒𝙉𝙀𝙍 𝙄𝙉𝙁𝙊 𝙋𝘼𝙉𝙀𝙇 👑
╚════════════════════════════╝`;

  // ███ DEFAULT: ONLY /admin → OWNER INFO ███
  if (!sub) {
    const ownerInfo = `
${banner}

💠 𝐍𝐚𝐦𝐞        : 𝗥𝗼𝗯𝗶𝗻 𝗔𝗹𝗶  
💠 𝐆𝐞𝐧𝐝𝐞𝐫      : 𝗠𝗮𝗹𝗲  
💠 𝐀𝐠𝐞         : 𝟭𝟳    
💠 𝐖𝐨𝐫𝐤        : 𝗦𝘁𝘂𝗱𝗲𝗻𝘁  
💠 𝐂𝐨𝐮𝐧𝐭𝐫𝐲     : 🇧🇩 Bangladesh

📌 𝗦𝗼𝗰𝗶𝗮𝗹 𝗟𝗶𝗻𝗸𝘀  
━━━━━━━━━━━━━━━━━━
🌐 Facebook : facebook.com/robin.whoisme  
📨 Email    : mr5442135@gmail.com  
💬 Telegram : @Freelancer_Robin  

⚠️ 𝗡𝗼𝘁𝗶𝗰𝗲  
━━━━━━━━━━━━━━━━━━
❗ 𝗡𝗼 𝗙𝗮𝗸𝗲 𝗢𝘄𝗻𝗲𝗿  
❗ 𝗗𝗼 𝗡𝗼𝘁 𝗧𝗿𝘂𝘀𝘁 𝗜𝗺𝗽𝗼𝘀𝘁𝗲𝗿𝘀  

✨ 𝗣𝗿𝗼𝘂𝗱𝗹𝘆 𝗢𝘄𝗻𝗲𝗿 𝗼𝗳 𝘁𝗵𝗶𝘀 𝗕𝗼𝘁 ✨
`;

    return api.sendMessage(ownerInfo, threadID, messageID);
  }

  // ███ ADMIN LIST ███
  if (sub === "list") {
    let msg = "";
    for (const id of ADMINBOT) {
      const name = await Users.getNameUser(id);
      msg += `👤 ${name} → (${id})\n`;
    }

    return api.sendMessage(`🔱 ADMIN LIST 🔱\n\n${msg}`, threadID, messageID);
  }

  // ███ ADD ADMIN ███
  if (sub === "add") {
    if (permssion !== 2)
      return api.sendMessage(
        "❌ Only bot owner can add admin!",
        threadID,
        messageID
      );

    let ids = [];

    if (Object.keys(mentions).length) ids = Object.keys(mentions);
    else if (!isNaN(target)) ids.push(target);
    else return api.sendMessage("❌ Invalid input!", threadID, messageID);

    let added = [];

    ids.forEach((uid) => {
      if (!ADMINBOT.includes(uid)) {
        ADMINBOT.push(uid);
        config.ADMINBOT.push(uid);
        added.push(uid);
      }
    });

    fs.writeFileSync(configPath, JSON.stringify(config, null, 4));

    return api.sendMessage(
      `✅ Added Admin:\n${added.join("\n")}`,
      threadID,
      messageID
    );
  }

  // ███ REMOVE ADMIN ███
  if (sub === "remove" || sub === "rm") {
    if (permssion !== 2)
      return api.sendMessage(
        "❌ Only bot owner can remove admin!",
        threadID,
        messageID
      );

    let ids = [];

    if (Object.keys(mentions).length) ids = Object.keys(mentions);
    else if (!isNaN(target)) ids.push(target);
    else return api.sendMessage("❌ Invalid input!", threadID, messageID);

    let removed = [];

    ids.forEach((uid) => {
      const index = config.ADMINBOT.indexOf(uid);
      if (index !== -1) {
        config.ADMINBOT.splice(index, 1);
        ADMINBOT.splice(index, 1);
        removed.push(uid);
      }
    });

    fs.writeFileSync(configPath, JSON.stringify(config, null, 4));

    return api.sendMessage(
      `🗑 Removed Admin:\n${removed.join("\n")}`,
      threadID,
      messageID
    );
  }

  return;
};
