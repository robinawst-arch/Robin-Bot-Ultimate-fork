const fs = require("fs");
const axios = require("axios");
const moment = require("moment-timezone");

module.exports.config = {
  name: "sendnoti",
  version: "1.0.3",
  hasPermssion: 2,
  credits: "Robin-Bot",
  description: "Send announcement to all threads",
  commandCategory: "Admin",
  usages: "[message] (reply with image/video/file to include)",
  cooldowns: 5,
};

module.exports.languages = {
  en: {
    sendSuccess: "✅ Sent message to %1 threads",
    sendFail: "⚠️ Failed to send message to %1 threads",
  },
};

module.exports.run = async ({ api, event, args, getText, Users }) => {
  try {
    const senderName = await Users.getNameUser(event.senderID);
    const allThreads = global.data.allThreadID || [];

    let sentCount = 0;
    let failed = 0;

    // Message text
    const messageText = args.join(" ") || "📢 Announcement";

    // If replied with media
    let attachment = [];

    if (event.messageReply && event.messageReply.attachments.length > 0) {
      for (const item of event.messageReply.attachments) {
        const url = item.url;

        const fileExt =
          item.type === "photo"
            ? ".jpg"
            : item.type === "video"
            ? ".mp4"
            : item.type === "audio"
            ? ".mp3"
            : ".bin";

        const filePath = __dirname + `/cache/noti_${Date.now()}${fileExt}`;
        const imgData = await axios.get(url, { responseType: "arraybuffer" });
        fs.writeFileSync(filePath, Buffer.from(imgData.data, "binary"));
        attachment.push(fs.createReadStream(filePath));
      }
    }

    // Final message format
    const finalMessage = {
      body: `📢 GLOBAL NOTICE\n\n${messageText}\n\n— Sent by ${senderName}`,
      attachment,
    };

    // Send to all threads
    for (const tid of allThreads) {
      try {
        await api.sendMessage(finalMessage, tid);
        sentCount++;
      } catch (e) {
        failed++;
      }
    }

    // Cleanup
    if (attachment.length > 0) {
      attachment.forEach((a) => fs.unlinkSync(a.path));
    }

    return api.sendMessage(
      `✅ Successfully sent to ${sentCount} threads\n⚠️ Failed: ${failed}`,
      event.threadID
    );
  } catch (err) {
    console.log(err);
    return api.sendMessage("❌ Error sending notification!", event.threadID);
  }
};
