const axios = require("axios");

const getBaseApi = async () => {
  const base = await axios.get(
    "https://raw.githubusercontent.com/cyber-ullash/cyber-ullash/refs/heads/main/UllashApi.json"
  );
  return base.data;
};

const escapeRegex = (str) =>
  str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

module.exports.config = {
  name: "fakechat",
  version: "3.2",
  hasPermssion: 0,
  credits: "MAHBUB ULLASH | Converted by Moyna",
  description: "Generate Facebook fake chat",
  commandCategory: "Tools",
  usages: "fakechat @mention text U1/U2/U3",
  cooldowns: 5,
  aliases: ["fc", "fake"]
};

module.exports.run = async function ({ api, event, args }) {
  try {
    let id;
    if (event.type === "message_reply") {
      id = event.messageReply.senderID;
    } else {
      id = Object.keys(event.mentions || {})[0] || event.senderID;
    }

    // Mirai user name fallback
    const bodyText = event.body || "";

    if (!bodyText) {
      return api.sendMessage(
        "❌ | Provide text after the command.",
        event.threadID,
        event.messageID
      );
    }

    let content = bodyText;

    // Remove command & prefix
    const prefix = global.config.PREFIX || "";
    if (prefix && content.startsWith(prefix)) {
      content = content.slice(prefix.length).trim();
    }

    if (content.toLowerCase().startsWith("fakechat")) {
      content = content.slice("fakechat".length).trim();
    }

    // Remove mentions text
    if (event.mentions && Object.keys(event.mentions).length > 0) {
      for (const name of Object.values(event.mentions)) {
        const esc = escapeRegex(name);
        const reg = new RegExp("@?" + esc, "gi");
        content = content.replace(reg, " ");
      }
    }

    content = content.replace(/\s+/g, " ").trim();

    if (!content) {
      return api.sendMessage(
        "❌ | No text found after removing mention.",
        event.threadID,
        event.messageID
      );
    }

    let parts = content.split(/\s+/);
    let model = "U3";
    const lastWord = parts[parts.length - 1];

    if (/^U[0-9]+$/i.test(lastWord)) {
      model = lastWord.toUpperCase();
      parts.pop();
    }

    const text = parts.join(" ").trim();

    if (!text) {
      return api.sendMessage(
        "❌ | Text cannot be empty.",
        event.threadID,
        event.messageID
      );
    }

    api.sendMessage(
      "⏳ Generating fake chat…",
      event.threadID,
      async (err, info) => {
        setTimeout(() => {
          api.unsendMessage(info.messageID);
        }, 3000);
      }
    );

    const base = await getBaseApi();
    const api2 = base.api2;

    const imgUrl = `${api2}/api/fakechat?uid=${encodeURIComponent(
      id
    )}&text=${encodeURIComponent(text)}&model=${encodeURIComponent(model)}`;

    const response = await axios.get(imgUrl, { responseType: "stream" });

    api.sendMessage(
      {
        body: " ",
        attachment: response.data
      },
      event.threadID,
      event.messageID
    );

  } catch (error) {
    console.error(error);
    api.sendMessage(
      "❌ | Failed to generate fake chat.",
      event.threadID,
      event.messageID
    );
  }
};
