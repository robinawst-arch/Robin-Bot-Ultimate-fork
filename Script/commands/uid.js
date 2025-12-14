module.exports.config = {
  name: "uid",
  version: "1.1.0",
  hasPermssion: 0,
  credits: "Robin-Bot",
  description: "Get Facebook User ID",
  commandCategory: "Tools",
  cooldowns: 3,
};

module.exports.run = async function ({ api, event }) {
  const { threadID, messageID, senderID, mentions, type, messageReply } = event;

  // 1) User replied to a message → get that UID
  if (type === "message_reply") {
    return api.sendMessage(
      `📌 UID: ${messageReply.senderID}`,
      threadID,
      messageID
    );
  }

  // 2) User tagged someone → get mentioned UIDs
  if (Object.keys(mentions).length > 0) {
    let msg = "👥 Mentioned Users UID:\n\n";
    for (const uid in mentions) {
      msg += `• ${mentions[uid].replace("@", "")} → ${uid}\n`;
    }
    return api.sendMessage(msg, threadID, messageID);
  }

  // 3) No mention → return sender's own UID
  return api.sendMessage(`👤 Your UID: ${senderID}`, threadID, messageID);
};
