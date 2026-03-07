// Railway startup script
// Writes appstate.json and config.json from environment variables before launching bot

const fs = require("fs");
const path = require("path");
const { execSync, spawn } = require("child_process");

const root = __dirname;

// Write appstate.json from env
if (process.env.APPSTATE_JSON) {
  fs.writeFileSync(
    path.join(root, "appstate.json"),
    process.env.APPSTATE_JSON,
    "utf8",
  );
  console.log("✅ appstate.json written from env");
} else if (!fs.existsSync(path.join(root, "appstate.json"))) {
  console.error(
    "❌ APPSTATE_JSON env variable not set and appstate.json missing!",
  );
  process.exit(1);
}

// Write config.json from env
if (process.env.CONFIG_JSON) {
  fs.writeFileSync(
    path.join(root, "config.json"),
    process.env.CONFIG_JSON,
    "utf8",
  );
  console.log("✅ config.json written from env");
} else if (!fs.existsSync(path.join(root, "config.json"))) {
  console.error("❌ CONFIG_JSON env variable not set and config.json missing!");
  process.exit(1);
}

// Start the bot
console.log("🚀 Starting Robin Bot...");
const bot = spawn("node", ["Robin.js"], { stdio: "inherit", cwd: root });
bot.on("exit", (code) => process.exit(code));
