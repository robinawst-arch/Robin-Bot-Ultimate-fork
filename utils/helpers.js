// =============================================
// HELPER FUNCTIONS - Logger, Banner, Language
// =============================================

const chalk = require("chalk");
const moment = require("moment-timezone");
const figlet = require("figlet");
const fs = require("fs");
const path = require("path");

// ---------- LOG SYSTEM ----------
function log(type, text) {
  const t = moment().tz("Asia/Dhaka").format("HH:mm:ss");
  console.log(
    chalk.cyan(`[ ${t} ]`) + chalk.yellow(` [ ${type} ] `) + chalk.white(text)
  );
}

// ---------- BANNER ----------
function banner() {
  console.log(chalk.blueBright("\n====================================="));
  console.log(chalk.magenta(figlet.textSync("ROBIN", { font: "Standard" })));
  console.log(chalk.blueBright("========== ROBIN x MOYNA ============\n"));
}

// ---------- LANGUAGE LOADER ----------
function loadLanguage(mainPath, log) {
  global.language = {};
  const langFile = path.join(mainPath, "languages", "en.lang");

  if (!fs.existsSync(langFile)) {
    log("WARN", "Language file not found!");
    return;
  }

  const content = fs.readFileSync(langFile, "utf-8");
  const lines = content.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const [key, ...valueParts] = trimmed.split("=");
    if (key && valueParts.length > 0) {
      global.language[key.trim()] = valueParts.join("=").trim();
    }
  }

  log(
    "SYSTEM",
    `Loaded ${Object.keys(global.language).length} language strings`
  );
}

// ---------- GET TEXT FUNCTION ----------
function initGetText() {
  global.getText = function (...args) {
    if (args.length === 0) return "";

    let langKey;
    let replacements = [];

    if (args.length === 1) {
      langKey = args[0];
    } else if (args.length === 2) {
      if (typeof args[1] === "string" || typeof args[1] === "number") {
        langKey = `${args[0]}.${args[1]}`;
      } else {
        langKey = args[0];
        replacements = Array.isArray(args[1]) ? args[1] : [args[1]];
      }
    } else {
      const lastArg = args[args.length - 1];
      if (Array.isArray(lastArg)) {
        langKey = args.slice(0, -1).join(".");
        replacements = lastArg;
      } else {
        if (
          args.length > 2 &&
          typeof args[0] === "string" &&
          typeof args[1] === "string"
        ) {
          langKey = `${args[0]}.${args[1]}`;
          replacements = args.slice(2);
        } else {
          langKey = args[0];
          replacements = args.slice(1);
        }
      }
    }

    let text = global.language[langKey] || langKey;

    if (replacements.length > 0) {
      replacements.forEach((val, i) => {
        text = text.replace(new RegExp(`%${i + 1}`, "g"), val);
      });
    }

    return text;
  };
}

module.exports = {
  log,
  banner,
  loadLanguage,
  initGetText,
};
