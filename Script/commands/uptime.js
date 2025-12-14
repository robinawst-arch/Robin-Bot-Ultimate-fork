const os = require("os");

module.exports.config = {
  name: "uptime", // ⬅️ sysinfo → uptime
  version: "1.0.1",
  hasPermssion: 0,
  credits: "Robin-Bot",
  description: "Show full system uptime & system info",
  commandCategory: "system",
  cooldowns: 5,
};

module.exports.run = async ({ api, event }) => {
  const { threadID, messageID } = event;

  try {
    const start = Date.now();

    // Uptime
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);

    const uptimeText = `${days}d ${hours}h ${minutes}m ${seconds}s`;

    // CPU
    const cpu = os.cpus()[0].model;
    const cores = os.cpus().length;
    const load = os.loadavg()[0].toFixed(2);

    // RAM
    const total = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2);
    const free = (os.freemem() / 1024 / 1024 / 1024).toFixed(2);
    const used = (total - free).toFixed(2);

    // Time
    const time = new Date().toLocaleTimeString("en-US", {
      hour12: true,
      timeZone: "Asia/Dhaka",
    });

    const date = new Date().toLocaleDateString("en-US", {
      timeZone: "Asia/Dhaka",
    });

    // Ping
    const ping = Date.now() - start;

    const msg = `╭───「 ⏳ UPTIME & SYSTEM INFO 」───
│ 📅 Date: ${date}
│ ⏰ Time: ${time}
│ 🕒 Uptime: ${uptimeText}
│
│ 💾 Storage:
│    • Used: ${used} GB
│    • Free: ${free} GB
│    • Total: ${total} GB
│
│ ⚡ CPU:
│    • Model: ${cpu}
│    • Cores: ${cores}
│    • Load: ${load}
│
│ 🧠 RAM:
│    • Used: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
│
│ 📡 Ping: ${ping} ms
╰──────────────────────────────`;

    api.sendMessage(msg, threadID, messageID);
  } catch (e) {
    api.sendMessage("❌ Error fetching system info!", threadID, messageID);
  }
};
