module.exports.config = {
  name: "kick",
  version: "1.3.0",
  hasPermssion: 1,
  credits: "Robin-Bot",
  description:
    "Remove user(s) from group — supports @mention, reply, or raw UID",
  commandCategory: "System",
  usages: "[@mention | reply | UID]",
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
    missingTag:
      "Please @mention someone, reply to their message, or type their UID to kick.\nExample: kick 100012345678",
  },
};

const mentionResolver = require("../../includes/mentionResolver");

/**
 * Collect all target UIDs from every possible source:
 * 1. event.mentions  (standard fca mention object)
 * 2. logMessageData / messageMetadata mentions
 * 3. message reply sender
 * 4. raw numeric UIDs passed as args  ← fixes accounts where mentions don't propagate
 * 5. @Name text fallback via thread participant search
 */
async function resolveTargets(api, event, args) {
  const ids = new Set();

  // 1 & 2 — standard mention object (most cases)
  const fromMention = await mentionResolver.getMentionIdsRobust(api, event);
  for (const id of fromMention) ids.add(String(id));

  // 3 — reply to a message
  if (event?.messageReply?.senderID) {
    ids.add(String(event.messageReply.senderID));
  }

  // 4 — raw UIDs typed as args, e.g.: kick 100012345678 100098765432
  if (Array.isArray(args)) {
    for (const arg of args) {
      const trimmed = String(arg).trim();
      // Facebook UIDs: 10–17 digit numbers
      if (/^\d{10,17}$/.test(trimmed)) {
        ids.add(trimmed);
      }
    }
  }

  return [...ids];
}

module.exports.run = async function ({ api, event, getText, args, Threads }) {
  try {
    let dataThread = (await Threads.getData(event.threadID)).threadInfo;

    // bot must be admin
    if (
      !dataThread.adminIDs.some((item) => item.id == api.getCurrentUserID())
    ) {
      return api.sendMessage(
        getText("needPermssion"),
        event.threadID,
        event.messageID,
      );
    }

    // sender must be admin
    if (!dataThread.adminIDs.some((item) => item.id == event.senderID)) {
      return api.sendMessage(
        getText("needPermssion"),
        event.threadID,
        event.messageID,
      );
    }

    const targetIDs = await resolveTargets(api, event, args);

    if (!targetIDs.length) {
      return api.sendMessage(
        getText("missingTag"),
        event.threadID,
        event.messageID,
      );
    }

    // kick each target with a small delay between each
    targetIDs.forEach((uid, i) => {
      setTimeout(
        () => {
          api.removeUserFromGroup(uid, event.threadID, () => {});
        },
        1500 * (i + 1),
      );
    });
  } catch (e) {
    console.error("[kick]", e.message);
    return api.sendMessage(getText("error"), event.threadID, event.messageID);
  }
};
