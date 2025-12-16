module.exports.config = {
  name: "restart",
  version: "2.0.0",
  hasPermssion: 2, // 🔒 Admin only
  credits: "ROBIN ❤️ MOYNA",
  description: "Restart the bot with animated status",
  commandCategory: "system",
  usages: "/restart",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  const threadID = event.threadID;

  // Helper delay
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Step 1
  await api.sendMessage(
`🔄 Restarting bot...

🔋 Status:
▰▱▱▱▱ 10%

⏳ Initializing restart...`,
    threadID
  );
  await sleep(700);

  // Step 2
  await api.sendMessage(
`🔄 Restarting bot...

🔋 Status:
▰▰▱▱▱ 30%

⚙️ Shutting down modules...`,
    threadID
  );
  await sleep(700);

  // Step 3
  await api.sendMessage(
`🔄 Restarting bot...

🔋 Status:
▰▰▰▱▱ 60%

🧠 Saving state & sessions...`,
    threadID
  );
  await sleep(700);

  // Step 4
  await api.sendMessage(
`🔄 Restarting bot...

🔋 Status:
▰▰▰▰▰ 100%

✅ Please wait, bot will be back online shortly!`,
    threadID
  );

  // Give time to send message
  await sleep(1200);

  // REAL restart
  process.exit(1);
};
