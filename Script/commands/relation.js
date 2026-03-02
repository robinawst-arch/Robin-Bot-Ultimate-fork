module.exports.config = {
  name: "relation",
  version: "1.1.0",
  hasPermssion: 2,
  credits: "Robin ❤️ Moyna | Mention Fix by Moyna",
  description: "Manage user relations",
  commandCategory: "system",
  usages: "/relation add/remove/list @mention <type>",
  cooldowns: 3,
};

const fs = require("fs");
const path = require("path");

// ✅ Make sure folder exists
const DATA_DIR = path.join(__dirname, "..", "..", "memory");
const DATA_PATH = path.join(DATA_DIR, "relations.json");

// Optional prompts (safe default)
const RELATION_PROMPTS = {
  friend: "You are {name}, a friend.",
  brother: "{name} is like a brother.",
  sister: "{name} is like a sister.",
  admin: "{name} is an admin.",
};

module.exports.run = async function ({ api, event, args }) {
  try {
    const OWNER_ID = String(process.env.ROBIN_ID || "").trim();

    if (!OWNER_ID) {
      return api.sendMessage(
        "❌ ROBIN_ID env missing. Set process.env.ROBIN_ID",
        event.threadID,
        event.messageID
      );
    }

    if (String(event.senderID) !== OWNER_ID) {
      return api.sendMessage(
        "⛔ এই কমান্ড শুধু রবিন ব্যবহার করতে পারবে",
        event.threadID,
        event.messageID
      );
    }

    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

    let relations = {};
    if (fs.existsSync(DATA_PATH)) {
      try {
        relations = JSON.parse(fs.readFileSync(DATA_PATH, "utf8")) || {};
      } catch {
        relations = {};
      }
    }

    const action = (args[0] || "").toLowerCase();

    if (action === "list") {
      const keys = Object.keys(relations);
      if (!keys.length) {
        return api.sendMessage("📜 Relations List is empty.", event.threadID, event.messageID);
      }

      let msg = "📜 Relations List:\n\n";
      for (const id of keys) {
        msg += `• ${relations[id].name} → ${relations[id].relation}\n`;
      }
      return api.sendMessage(msg, event.threadID, event.messageID);
    }

    if (action !== "add" && action !== "remove") {
      return api.sendMessage(
        "❓ Usage:\n/relation add @mention <type>\n/relation remove @mention\n/relation list",
        event.threadID,
        event.messageID
      );
    }

    // ✅ Robust mention (works even when event.mentions empty)
    const target = await getTargetMention(api, event);

    if (!target?.id) {
      return api.sendMessage("❌ কাউকে mention করো", event.threadID, event.messageID);
    }

    const uid = target.id;
    const name = target.name || "User";

    if (action === "add") {
      const type = (args[args.length - 1] || "").toLowerCase(); // last arg as type
      if (!type) {
        return api.sendMessage(
          "❌ type দাও\nউদাহরণ: /relation add @mention friend",
          event.threadID,
          event.messageID
        );
      }

      relations[uid] = {
        name,
        relation: type,
        prompt: (RELATION_PROMPTS[type] || "{name}").replace("{name}", name.replace(/^@/, "")),
      };

      fs.writeFileSync(DATA_PATH, JSON.stringify(relations, null, 2));
      return api.sendMessage(`✅ ${name} এখন ${type}`, event.threadID, event.messageID);
    }

    // remove
    if (!relations[uid]) {
      return api.sendMessage("ℹ️ এই user এর relation নাই", event.threadID, event.messageID);
    }

    delete relations[uid];
    fs.writeFileSync(DATA_PATH, JSON.stringify(relations, null, 2));
    return api.sendMessage("🗑️ Relation removed", event.threadID, event.messageID);
  } catch (e) {
    return api.sendMessage("❌ relation command error.", event.threadID, event.messageID);
  }
};

