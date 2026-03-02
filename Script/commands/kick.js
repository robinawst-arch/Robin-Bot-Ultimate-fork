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

const mentionResolver = require("../../includes/mentionResolver");

module.exports.run = async function ({ api, event, getText, Threads }) {
  try {
    // ✅ robust mention ids (shared helper)
    const mentionIDs = await mentionResolver.getMentionIdsRobust(api, event);

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

