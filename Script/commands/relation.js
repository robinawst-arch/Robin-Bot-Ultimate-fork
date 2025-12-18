module.exports.config = {
  name: "relation",
  version: "1.0.0",
  hasPermssion: 2,
  credits: "Robin ❤️ Moyna",
  description: "Manage user relations",
  commandCategory: "system",
  usages: "/relation add/remove/list",
  cooldowns: 3
};

module.exports.run = async function ({ api, event, args }) {
  const fs = require("fs");
  const path = "./memory/relations.json";
  const OWNER_ID = process.env.ROBIN_ID;

  if (event.senderID !== OWNER_ID)
    return api.sendMessage("⛔ এই কমান্ড শুধু রবিন ব্যবহার করতে পারবে", event.threadID);

  let relations = fs.existsSync(path)
    ? JSON.parse(fs.readFileSync(path, "utf8"))
    : {};

  const action = args[0];
  const type = args[2];

  if (action === "add") {
    if (!Object.keys(event.mentions).length)
      return api.sendMessage("❌ কাউকে mention করো", event.threadID);

    const uid = Object.keys(event.mentions)[0];
    const name = event.mentions[uid];

    relations[uid] = {
      name,
      relation: type,
      prompt: RELATION_PROMPTS[type]?.replace("{name}", name)
    };

    fs.writeFileSync(path, JSON.stringify(relations, null, 2));
    return api.sendMessage(`✅ ${name} এখন ${type}`, event.threadID);
  }

  if (action === "remove") {
    const uid = Object.keys(event.mentions)[0];
    delete relations[uid];
    fs.writeFileSync(path, JSON.stringify(relations, null, 2));
    return api.sendMessage("🗑️ Relation removed", event.threadID);
  }

  if (action === "list") {
    let msg = "📜 Relations List:\n\n";
    for (const id in relations) {
      msg += `• ${relations[id].name} → ${relations[id].relation}\n`;
    }
    return api.sendMessage(msg, event.threadID);
  }

  api.sendMessage("❓ Usage: /relation add/remove/list", event.threadID);
};
