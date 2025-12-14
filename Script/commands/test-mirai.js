module.exports.config = {
  name: "testmirai",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Robin-Bot",
  description: "Test Mirai format command",
  commandCategory: "test",
  usages: "testmirai",
  cooldowns: 5,
};

module.exports.run = async function ({ api, event, args }) {
  const text =
    `✅ Mirai Format Working!\n\n` +
    `📝 Command: ${this.config.name}\n` +
    `👤 User: ${event.senderID}\n` +
    `💬 Thread: ${event.threadID}\n` +
    `🔢 Args: ${args.length ? args.join(", ") : "none"}`;

  api.setMessageReaction("🔥", event.messageID, () => {}, true);

  return api.sendMessage(text, event.threadID, event.messageID);
};

module.exports.handleEvent = async function ({ api, event }) {
  // Auto-reply example
  if (event.body && event.body.toLowerCase().includes("mirai test")) {
    api.setMessageReaction("🔥", event.messageID, () => {}, true);
    return api.sendMessage(
      "Mirai auto-reply working! 🎉",
      event.threadID,
      event.messageID
    );
  }
};
