// =============================================
// EVENT HANDLER - Reply System
// =============================================

const path = require("path");
const Users = require(path.join(__dirname, "Users.js"));
const Threads = require(path.join(__dirname, "Threads.js"));

async function checkReply(api, event, log) {
  if (!event.messageReply) return;

  const data = global.client.handleReply.get(event.messageReply.messageID);
  if (!data) return;

  const cmdName = data.name || data.commandName;
  if (!cmdName) return;

  const cmd = global.client.commands.get(cmdName);
  if (!cmd) return;

  const replyHandler = cmd.onReply || cmd.handleReply;
  if (typeof replyHandler !== "function") return;

  try {
    await replyHandler({
      api,
      event,
      reply: data,
      handleReply: data,
      Users,
      Threads,
      getText: global.getText,
    });
  } catch (e) {
    log("REPLY-ERROR", e.message);
  }
}

module.exports = {
  checkReply,
};
