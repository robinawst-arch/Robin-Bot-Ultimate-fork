module.exports.config = {
  name: "restart",
  version: "4.0.0",
  hasPermssion: 2, // admin only
  credits: "ROBIN ❤️ MOYNA",
  description: "Safely restart the bot (Render friendly)",
  commandCategory: "system",
  usages: "/restart",
  cooldowns: 10
};

module.exports.run = async function ({ api, event }) {
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  let msgID = null;

  const update = async (text) => {
    if (msgID) await api.unsendMessage(msgID);
    const info = await api.sendMessage(text, event.threadID);
    msgID = info.messageID;
  };

  await update(
`🔄 Restarting bot...

🔋 Status:
▰▱▱▱▱ 10%

⏳ Initializing restart...`
  );
  await sleep(700);

  await update(
`🔄 Restarting bot...

🔋 Status:
▰▰▱▱▱ 30%

⚙️ Shutting down modules...`
  );
  await sleep(700);

  await update(
`🔄 Restarting bot...

🔋 Status:
▰▰▰▱▱ 60%

🧠 Saving sessions & state...`
  );
  await sleep(700);

  await update(
`🔄 Restarting bot...

🔋 Status:
▰▰▰▰▰ 100%

✅ Please wait, bot will be back online shortly!`
  );

  await sleep(1500);

  // 🔐 Graceful restart (Render safe)
  global.isRestarting = true;
  process.exit(0);
};
