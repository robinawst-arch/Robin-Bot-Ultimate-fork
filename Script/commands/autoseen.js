const fs = require("fs-extra");
const path = require("path");

const cacheDir = path.join(__dirname, "cache");
const filePath = path.join(cacheDir, "autoseen.txt");

// =============== Ensure folder + file exist ===============
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

if (!fs.existsSync(filePath)) {
  fs.writeFileSync(filePath, "false");
}

module.exports.config = {
  name: "autoseen",
  version: "1.0.0",
  hasPermssion: 2,
  credits: "Robin-Bot",
  description: "Auto mark as seen ON/OFF",
  commandCategory: "tools",
  usages: "autoseen on/off",
  cooldowns: 5,
};

// =============== Auto Seen Handler ==================
module.exports.handleEvent = async function ({ api, event }) {
  try {
    const status = fs.readFileSync(filePath, "utf-8");

    if (status === "true") {
      api.markAsReadAll(() => {});
    }
  } catch (err) {
    console.log("AutoSeen Error:", err);
  }
};

// =============== Command ==================
module.exports.run = async function ({ api, event, args }) {
  try {
    const mode = args[0];

    if (mode === "on") {
      fs.writeFileSync(filePath, "true");
      return api.sendMessage(
        "✅ AutoSeen turned ON",
        event.threadID,
        event.messageID
      );
    } else if (mode === "off") {
      fs.writeFileSync(filePath, "false");
      return api.sendMessage(
        "❌ AutoSeen turned OFF",
        event.threadID,
        event.messageID
      );
    } else {
      return api.sendMessage(
        `❗ Wrong format\nUse: autoseen on/off`,
        event.threadID,
        event.messageID
      );
    }
  } catch (err) {
    console.log("AutoSeen Command Error:", err);
    return api.sendMessage("⚠ Error in AutoSeen command", event.threadID);
  }
};
