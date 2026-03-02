module.exports.config = {
  name: "uid",
  version: "1.2.0",
  hasPermssion: 0,
  credits: "Robin-Bot | Mention Fix by Moyna",
  description: "Get Facebook User ID (reply/mention/text @name fallback)",
  commandCategory: "Tools",
  cooldowns: 3,
};

module.exports.run = async function ({ api, event }) {
  try {
    const { threadID, messageID, senderID, type, messageReply } = event;

    // 1) Reply -> replied user UID
    if (type === "message_reply" && messageReply?.senderID) {
      return api.sendMessage(`📌 UID: ${messageReply.senderID}`, threadID, messageID);
    }

    // 2) Robust mentions (event.mentions / logMessageData.mentions)
    const mentionPairs = getMentionPairs(event);

    if (mentionPairs.length > 0) {
      let msg = "👥 Mentioned Users UID:\n\n";
      for (const m of mentionPairs) {
        const cleanName = String(m.name || "User").replace(/^@/, "");
        msg += `• ${cleanName} → ${m.id}\n`;
      }
      return api.sendMessage(msg, threadID, messageID);
    }

    // 3) Fallback: parse "@Name" from text and resolve UID from thread participants
    const body = typeof event.body === "string" ? event.body : "";
    const atName = extractAtName(body);

    if (atName) {
      const uid = await resolveUserByNameFromThread(api, threadID, atName);
      if (uid) {
        return api.sendMessage(`👤 ${atName} → ${uid}`, threadID, messageID);
      }
    }

    // 4) No mention -> sender UID
    return api.sendMessage(`👤 Your UID: ${senderID}`, threadID, messageID);
  } catch (e) {
    return api.sendMessage("❌ | uid command error.", event.threadID, event.messageID);
  }
};

// -------- helpers --------
function getMentionPairs(event) {
  const out = [];

  // A) classic: event.mentions = { uid: "Name" } OR { uid: { tag: "@Name", ... } }
  if (event?.mentions && typeof event.mentions === "object") {
    for (const uid of Object.keys(event.mentions)) {
      const v = event.mentions[uid];
      const name = typeof v === "string" ? v : (v?.tag || v?.name || "@User");
      out.push({ id: uid, name });
    }
    if (out.length) return out;
  }

  // B) forks: event.logMessageData.mentions
  const lmd = event?.logMessageData;
  if (lmd?.mentions && typeof lmd.mentions === "object") {
    for (const uid of Object.keys(lmd.mentions)) {
      const v = lmd.mentions[uid];
      const name = typeof v === "string" ? v : (v?.tag || v?.name || "@User");
      out.push({ id: uid, name });
    }
  }

  return out;
}

function extractAtName(body) {
  if (!body) return null;
  const idx = body.indexOf("@");
  if (idx === -1) return null;

  const sub = body.slice(idx + 1).trim();
  if (!sub) return null;

  // stop at double-space/newline/end
  const m = sub.match(/(.+?)(\s{2,}|\n|$)/);
  const name = (m?.[1] || "").trim();
  return name.length ? name : null;
}

async function resolveUserByNameFromThread(api, threadID, nameQuery) {
  try {
    const tinfo = await api.getThreadInfo(threadID);
    const ids = tinfo?.participantIDs || [];
    if (!ids.length) return null;

    const info = await api.getUserInfo(ids);
    const q = String(nameQuery).toLowerCase();

    // exact
    for (const uid of ids) {
      const nm = info?.[uid]?.name;
      if (nm && nm.toLowerCase() === q) return uid;
    }
    // contains
    for (const uid of ids) {
      const nm = info?.[uid]?.name;
      if (nm && nm.toLowerCase().includes(q)) return uid;
    }
    return null;
  } catch {
    return null;
  }
}
