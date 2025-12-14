/**
 * 🏓 PING COMMAND - Tag All Group Members
 * =======================================
 *
 * Purpose: Tags all active members in a group chat (mentions everyone)
 *
 * How it works:
 * 1. Gets list of all members in the group (participantIDs)
 * 2. Filters out the bot itself and command sender
 * 3. Filters out AFK users (if AFK module is active)
 * 4. Creates invisible mention tags for each member
 * 5. Sends message with typing indicator (looks natural)
 *
 * Usage:
 * - /ping                    → Tags everyone with empty message
 * - /ping Hello everyone!    → Tags everyone with custom message
 *
 * Note: Only works in group chats. In DM, returns "Pong! Bot is active 💙"
 *
 * Features:
 * ✅ Smart AFK detection (skips users who are AFK)
 * ✅ Typing indicator before sending (human-like behavior)
 * ✅ Custom message support with @mentions
 * ✅ Error handling for non-group chats
 */

module.exports.config = {
  name: "ping",
  version: "1.0.5",
  hasPermssion: 0,
  credits: "Robin-Bot",
  description: "Tag all members",
  commandCategory: "system",
  usages: "[Text]",
  cooldowns: 80,
};

module.exports.run = async function ({ api, event, args }) {
  try {
    const botID = api.getCurrentUserID();
    var listAFK, listUserID;

    // Initialize moduleData if not exists and get AFK list safely
    if (!global.moduleData) global.moduleData = {};
    const afkData = global.moduleData["afk"];
    listAFK = afkData && afkData.afkList ? Object.keys(afkData.afkList) : [];

    // Check if participantIDs exists (works in groups only)
    if (!event.participantIDs || event.participantIDs.length === 0) {
      return global.sendMessageWithTyping(
        "🏓 Pong! Bot is active 💙",
        event.threadID,
        null,
        event.messageID
      );
    }

    listUserID = event.participantIDs.filter(
      (ID) => ID != botID && ID != event.senderID
    );
    listUserID = listUserID.filter((item) => !listAFK.includes(item));

    // Default message if no custom text provided
    var body =
        args.length != 0 ? args.join(" ") : "📢 Everyone, attention please!",
      mentions = [],
      index = 0;
    for (const idUser of listUserID) {
      body = "‎" + body;
      mentions.push({ id: idUser, tag: "‎", fromIndex: index - 1 });
      index -= 1;
    }

    return global.sendMessageWithTyping(
      { body, mentions },
      event.threadID,
      null,
      event.messageID
    );
  } catch (e) {
    console.error("Ping command error:", e);
    return global.sendMessageWithTyping(
      "🏓 Pong! Bot is active 💙",
      event.threadID,
      null,
      event.messageID
    );
  }
};
