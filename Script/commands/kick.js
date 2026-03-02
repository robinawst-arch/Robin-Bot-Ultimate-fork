module.exports.config = {
  name: "kick",
  version: "1.1.0",
  hasPermssion: 1,
  credits: "Robin-Bot | Mention Fix by Moyna",
  description: "Remove user(s) from group by mention (robust mention support)",
  commandCategory: "System",
  usages: "[tag]",
  cooldowns: 0,
};

module.exports.languages = {
  vi: {
    error: "Đã có lỗi xảy ra, vui lòng thử lại sau",
    needPermssion: "Cần quyền quản trị viên nhóm\nVui lòng thêm và thử lại!",
    missingTag: "Bạn phải tag người cần kick",
  },
  en: {
    error: "Error! An error occurred. Please try again later!",
    needPermssion: "Need group admin\nPlease add and try again!",
    missingTag: "You need tag some person to kick",
  },
};

module.exports.run = async function ({ api, event, getText, Threads }) {
  try {
    // ✅ robust mention ids (event.mentions/logMessageData/@name fallback)
    const mentionIDs = await getMentionIdsRobust(api, event);

    let dataThread = (await Threads.getData(event.threadID)).threadInfo;

    // bot must be admin
    if (!dataThread.adminIDs.some((item) => item.id == api.getCurrentUserID())) {
      return api.sendMessage(
        getText("needPermssion"),
        event.threadID,
        event.messageID
      );
    }

    if (!mentionIDs.length) {
      return api.sendMessage(
        getText("missingTag") || "You have to tag the need to kick",
        event.threadID,
        event.messageID
      );
    }

    // sender must be admin (keep your original rule)
    if (!dataThread.adminIDs.some((item) => item.id == event.senderID)) {
      return api.sendMessage(
        getText("needPermssion"),
        event.threadID,
        event.messageID
      );
    }

    // remove each mentioned user
    for (const uid of mentionIDs) {
      setTimeout(() => {
        api.removeUserFromGroup(uid, event.threadID, (err) => {
          // silent fail
        });
      }, 1500);
    }
  } catch (e) {
    return api.sendMessage(getText("error"), event.threadID, event.messageID);
  }
};

// -------- helpers --------
async function getMentionIdsRobust(api, event) {
  // A) classic mentions object
  if (event?.mentions && typeof event.mentions === "object") {
    const ids = Object.keys(event.mentions);
    if (ids.length) return ids;
  }

  // B) forks: logMessageData.mentions
  const lmd = event?.logMessageData;
  if (lmd?.mentions && typeof lmd.mentions === "object") {
    const ids = Object.keys(lmd.mentions);
    if (ids.length) return ids;
  }

  // C) fallback: parse "@Name" and resolve one uid
  const body = typeof event?.body === "string" ? event.body : "";
  const atName = extractAtName(body);
  if (!atName) return [];

  const uid = await resolveUserByNameFromThread(api, event.threadID, atName);
  return uid ? [uid] : [];
}

function extractAtName(body) {
  const idx = body.indexOf("@");
  if (idx === -1) return null;
  const sub = body.slice(idx + 1).trim();
  if (!sub) return null;
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

    for (const uid of ids) {
      const nm = info?.[uid]?.name;
      if (nm && nm.toLowerCase() === q) return uid;
    }
    for (const uid of ids) {
      const nm = info?.[uid]?.name;
      if (nm && nm.toLowerCase().includes(q)) return uid;
    }
    return null;
  } catch {
    return null;
  }
}
