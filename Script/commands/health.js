const os = require("os");

module.exports.config = {
  name: "health",
  version: "1.0.0",
  hasPermssion: 0, // সবাই ব্যবহার করতে পারবে
  credits: "ROBIN ❤️ MOYNA",
  description: "Show bot & server health status",
  commandCategory: "system",
  usages: "/health",
  cooldowns: 5
};

module.exports.run = async function ({ api, event }) {
  try {
    const uptime = process.uptime(); // seconds
    const uptimeH = Math.floor(uptime / 3600);
    const uptimeM = Math.floor((uptime % 3600) / 60);
    const uptimeS = Math.floor(uptime % 60);

    const memory = process.memoryUsage();
    const usedMB = (memory.rss / 1024 / 1024).toFixed(2);
    const heapMB = (memory.heapUsed / 1024 / 1024).toFixed(2);

    const cpuLoad = os.loadavg()[0].toFixed(2);
    const totalMem = (os.totalmem() / 1024 / 1024).toFixed(0);
    const freeMem = (os.freemem() / 1024 / 1024).toFixed(0);

    const statusMsg =
`🩺 BOT HEALTH STATUS

🤖 Bot Name: ${global.config?.BOTNAME || "Moyna"}
⚡ Status: ONLINE
🕒 Uptime: ${uptimeH}h ${uptimeM}m ${uptimeS}s

🧠 Memory:
• Used (RSS): ${usedMB} MB
• Heap Used: ${heapMB} MB

🖥 Server:
• CPU Load: ${cpuLoad}
• RAM: ${freeMem} MB free / ${totalMem} MB total
• Platform: ${process.platform}

🌍 Environment:
• Node: ${process.version}
• PID: ${process.pid}

✅ All systems operational`;

    api.sendMessage(statusMsg, event.threadID);

  } catch (err) {
    api.sendMessage(
      "❌ Health check failed. Something went wrong.",
      event.threadID
    );
  }
};
