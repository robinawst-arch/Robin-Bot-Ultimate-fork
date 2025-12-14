module.exports.config = {
  name: "pending",
  version: "1.0.5",
  credits: "Robin-Bot",
  hasPermssion: 2,
  description: "Manage bot's waiting messages",
  commandCategory: "system",
  cooldowns: 5,
};

module.exports.languages = {
  en: {
    invaildNumber: "%1 is not a valid number!",
    cancelSuccess: "Refused %1 thread(s)!",
    notiBox: "𝓜𝓸𝔂𝓷𝓪 Connected Successfully!\nUse /help for more information.",
    approveSuccess: "Approved %1 thread(s)!",
    cantGetPendingList: "Can't get the pending list!",
    returnListPending: "»「PENDING」« ❮ Total: %1 thread(s) ❯\n\n%2",
    returnListClean: "There is no thread in the pending list.",
  },
};

module.exports.handleReply = async function ({
  api,
  event,
  handleReply,
  getText,
}) {
  if (String(event.senderID) !== String(handleReply.author)) return;

  const { body, threadID, messageID } = event;
  let count = 0;

  // --------- Check if Cancel Mode --------- //
  const isCancel =
    !/^\d/.test(body) && // does NOT start with number
    (body.toLowerCase().startsWith("c") ||
      body.toLowerCase().startsWith("cancel"));

  // -------- CANCEL -------- //
  if (isCancel) {
    const indexList = body.slice(1).trim().split(/\s+/);

    for (const idx of indexList) {
      if (isNaN(idx) || idx <= 0 || idx > handleReply.pending.length)
        return api.sendMessage(
          getText("pending", "invaildNumber", idx),
          threadID,
          messageID
        );

      api.removeUserFromGroup(
        api.getCurrentUserID(),
        handleReply.pending[idx - 1].threadID
      );

      count++;
    }

    return api.sendMessage(
      getText("pending", "cancelSuccess", count),
      threadID,
      messageID
    );
  }

  // -------- APPROVE -------- //
  const indexList = body.split(/\s+/);

  for (const idx of indexList) {
    if (isNaN(idx) || idx <= 0 || idx > handleReply.pending.length)
      return api.sendMessage(
        getText("pending", "invaildNumber", idx),
        threadID,
        messageID
      );

    api.sendMessage(
      getText("pending", "notiBox"),
      handleReply.pending[idx - 1].threadID
    );
    count++;
  }

  return api.sendMessage(
    getText("pending", "approveSuccess", count),
    threadID,
    messageID
  );
};

module.exports.run = async function ({ api, event, getText }) {
  const { threadID, messageID } = event;

  try {
    const spam = (await api.getThreadList(100, null, ["OTHER"])) || [];
    const pending = (await api.getThreadList(100, null, ["PENDING"])) || [];

    // Filter only groups
    const list = [...spam, ...pending].filter(
      (g) => g.isSubscribed && g.isGroup
    );

    let msg = "";
    let index = 1;

    for (const group of list) {
      const groupName = group.name || "Unnamed Group";
      msg += `${index}. ${groupName}\n`;
      index++;
    }

    if (list.length > 0) {
      return api.sendMessage(
        getText("pending", "returnListPending", list.length, msg),
        threadID,
        (err, info) => {
          if (err) {
            console.error("Error sending pending list:", err);
            return;
          }
          if (info && info.messageID) {
            global.client.handleReply.set(info.messageID, {
              name: module.exports.config.name,
              messageID: info.messageID,
              author: event.senderID,
              pending: list,
            });
          }
        },
        messageID
      );
    }

    return api.sendMessage(
      getText("pending", "returnListClean"),
      threadID,
      messageID
    );
  } catch (e) {
    return api.sendMessage(
      getText("pending", "cantGetPendingList"),
      threadID,
      messageID
    );
  }
};
