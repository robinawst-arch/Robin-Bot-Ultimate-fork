module.exports.config = {
  name: "unsend",
  version: "1.2.0",
  hasPermssion: 0,
  credits: "Robin-Bot",
  description: "Unsend bot's message",
  commandCategory: "system",
  usages: "Reply to a bot message → unsend or uns",
  cooldowns: 0,
  aliases: ["uns"],
};

module.exports.languages = {
  en: {
    cantUnsend: "❌ I can only unsend my own messages!",
    needReply: "⚠️ Reply to my message to unsend it!",
  },
};

module.exports.run = function ({ api, event, getText }) {
  const { type, messageReply } = event;

  // Not reply?
  if (type !== "message_reply")
    return api.sendMessage(
      getText("needReply"),
      event.threadID,
      event.messageID
    );

  // Trying to unsend someone else's message?
  if (messageReply.senderID !== api.getCurrentUserID())
    return api.sendMessage(
      getText("cantUnsend"),
      event.threadID,
      event.messageID
    );

  // Unsend bot message
  return api.unsendMessage(messageReply.messageID);
};
