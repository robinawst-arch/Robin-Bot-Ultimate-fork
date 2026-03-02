const axios = require("axios");

const getBaseApi = async () => {
  const base = await axios.get(
    "https://raw.githubusercontent.com/cyber-ullash/cyber-ullash/refs/heads/main/UllashApi.json"
  );
  return base.data;
};

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ✅ Robust mention resolver (works even when event.mentions empty)
async function getTargetUserId(api, event) {
  // 1) reply -> replied user
  if (event?.type === "message_reply" && event?.messageReply?.senderID) {
    return event.messageReply.senderID;
  }

  // 2) classic mentions
  if (event?.mentions && typeof event.mentions === "object") {
    const ids = Object.keys(event.mentions);
    if (ids.length) return ids[0];
  }

  // 3) forks: logMessageData mentions
  const lmd = event?.logMessageData;
  if (lmd?.mentions && typeof lmd.mentions === "object") {
    const ids = Object.keys(lmd.mentions);
    if (ids.length) return ids[0];
  }

  // 4) fallback: parse "@Name" from body and resolve from thread participants
  const body = typeof event?.body === "string" ? event.body : "";
  const atName = extractAtName(body);
  if (atName) {
    const uid = await resolveUserByNameFromThread(api, event.threadID, atName);
    if (uid) return uid;
  }

  // 5) fallback: sender
  return event.senderID;
}

function extractAtName(body) {
  if (!body) return null;
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

module.exports.config = {
  name: "fakechat",
  version: "3.3",
  hasPermssion: 0,
  credits: "MAHBUB ULLASH | Converted by Moyna | Mention Fix by Moyna",
  description: "Generate Facebook fake chat",
  commandCategory: "Tools",
  usages: "fakechat @mention text U1/U2/U3 (or reply)",
  cooldowns: 5,
  aliases: ["fc", "fake"],
};

module.exports.run = async function ({ api, event, args }) {
  try {
    // ✅ fixed: robust target uid (mention/reply/fallback)
    const id = await getTargetUserId(api, event);

    const bodyText = typeof event.body === "string" ? event.body : "";
    if (!bodyText) {
      return api.sendMessage(
        "❌ | Provide text after the command.",
        event.threadID,
        event.messageID
      );
    }

    let content = bodyText;

    // Remove prefix + command name safely
    const prefix = global?.config?.PREFIX || "";
    if (prefix && content.startsWith(prefix)) {
      content = content.slice(prefix.length).trim();
    }

    const lower = content.toLowerCase();
    const cmdNames = ["fakechat", "fc", "fake"];
    for (const c of cmdNames) {
      if (lower.startsWith(c)) {
        content = content.slice(c.length).trim();
        break;
      }
    }

    // Remove mention display names if present (won't break if mentions empty)
    if (event.mentions && Object.keys(event.mentions).length > 0) {
      for (const name of Object.values(event.mentions)) {
        const esc = escapeRegex(name);
        const reg = new RegExp("@?" + esc, "gi");
        content = content.replace(reg, " ");
      }
    } else {
      // fallback: remove first "@Name ..." chunk to avoid mixing with text
      const atName = extractAtName(content);
      if (atName) {
        const esc = escapeRegex(atName);
        const reg = new RegExp("@?" + esc, "i");
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

    api.sendMessage("⏳ Generating fake chat…", event.threadID, (err, info) => {
      if (!err && info?.messageID) {
        setTimeout(() => api.unsendMessage(info.messageID), 3000);
      }
    });

    const base = await getBaseApi();
    const api2 = base.api2;

    const imgUrl = `${api2}/api/fakechat?uid=${encodeURIComponent(
      id
    )}&text=${encodeURIComponent(text)}&model=${encodeURIComponent(model)}`;

    const response = await axios.get(imgUrl, { responseType: "stream" });

    return api.sendMessage(
      { body: " ", attachment: response.data },
      event.threadID,
      event.messageID
    );
  } catch (error) {
    console.error(error);
    return api.sendMessage(
      "❌ | Failed to generate fake chat.",
      event.threadID,
      event.messageID
    );
  }
};
