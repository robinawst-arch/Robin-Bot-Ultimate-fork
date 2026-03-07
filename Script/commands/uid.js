const mentionResolver = require("../../includes/mentionResolver");

module.exports.config = {
  name: "uid",
  version: "2.0",
  hasPermssion: 0,
  credits: "Robin-Bot",
  description:
    "Get Facebook User ID — supports @mention, reply, name search, raw UID",
  commandCategory: "Tools",
  cooldowns: 3,
};

module.exports.run = async function ({ api, event, args }) {
  try {
    const { threadID, messageID, senderID } = event;

    // 1) Reply → replied user UID
    if (event.type === "message_reply" && event.messageReply?.senderID) {
      const name = event.messageReply?.senderName || "User";
      return api.sendMessage(
        `📌 ${name}\n🆔 UID: ${event.messageReply.senderID}`,
        threadID,
        messageID,
      );
    }

    // 2) Mention(s) — all fca fork formats handled by mentionResolver
    const pairs = mentionResolver.getMentionPairs(event);
    if (pairs.length) {
      let msg = "👥 UID List:\n\n";
      for (const p of pairs) {
        const name = String(p.name || "User").replace(/^@/, "");
        msg += `• ${name}\n  🆔 ${p.id}\n\n`;
      }
      return api.sendMessage(msg.trim(), threadID, messageID);
    }

    // 3) @Name text fallback — multi-word name support (e.g. @Robin Ali)
    const body = typeof event.body === "string" ? event.body : "";
    const atName = mentionResolver.extractAtName(body);
    if (atName) {
      const uid = await mentionResolver.resolveUserByNameFromThread(
        api,
        threadID,
        atName,
      );
      if (uid) {
        return api.sendMessage(
          `👤 ${atName}\n🆔 UID: ${uid}`,
          threadID,
          messageID,
        );
      }
      // Name was typed but couldn't be matched in thread
      return api.sendMessage(
        `❌ "${atName}" নামের কেউ এই গ্রুপে পাওয়া যায়নি।`,
        threadID,
        messageID,
      );
    }

    // 4) No mention → sender's own UID
    return api.sendMessage(`👤 Your UID: ${senderID}`, threadID, messageID);
  } catch (e) {
    console.error("[uid]", e.message);
    return api.sendMessage(
      "❌ UID command error: " + e.message,
      event.threadID,
      event.messageID,
    );
  }
};
