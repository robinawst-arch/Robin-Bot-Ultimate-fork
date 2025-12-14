module.exports = {
  config: {
    name: "testgoat",
    version: "1.0.0",
    author: "Robin-Bot",
    countDown: 5,
    role: 0,
    description: "Test GoatBot format command",
    category: "test",
    guide: "{pn}",
  },

  langs: {
    en: {
      hello: "Hello from GoatBot format! 🐐",
      processing: "Processing...",
    },
  },

  onStart: async function ({ api, event, args, message, getLang }) {
    // React to message
    message.react("🐐");

    const text =
      `✅ GoatBot Format Working!\n\n` +
      `📝 Command: testgoat\n` +
      `👤 User: ${event.senderID}\n` +
      `💬 Thread: ${event.threadID}\n` +
      `🔢 Args: ${args.length ? args.join(", ") : "none"}\n\n` +
      `${getLang("hello")}`;

    return api.sendMessage(text, event.threadID, event.messageID);
  },

  onChat: async function ({ api, event, message }) {
    // Auto-reply when someone types "goat test"
    if (event.body && event.body.toLowerCase().includes("goat test")) {
      api.setMessageReaction("🐐", event.messageID, () => {}, true);
      return api.sendMessage(
        "GoatBot auto-reply working! 🎉",
        event.threadID,
        event.messageID
      );
    }
  },
};
