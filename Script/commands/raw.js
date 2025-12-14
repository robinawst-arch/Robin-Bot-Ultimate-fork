module.exports.config = {
  name: "raw",
  version: "1.0.1",
  hasPermssion: 2,
  credits: "Robin-Bot",
  description: "View or delete command files, upload to Pastebin",
  commandCategory: "Admin",
  usages: "Reply with: file_number + type (raw/del)",
  cooldowns: 0,
};

module.exports.run = async function ({ event, api }) {
  const fs = require("fs");
  const path = require("path");
  const folderPath = __dirname;

  fs.readdir(folderPath, (err, files) => {
    if (err) {
      console.error("Error reading files:", err);
      return;
    }

    const jsFiles = files.filter(
      (file) => path.extname(file).toLowerCase() === ".js"
    );

    let message = "╔═══════════════════════╗\n";
    message += "║  📋 𝐂𝐎𝐌𝐌𝐀𝐍𝐃 𝐅𝐈𝐋𝐄𝐒  ║\n";
    message += "╚═══════════════════════╝\n\n";

    jsFiles.forEach((file, index) => {
      message += `${index + 1}. ${file}\n`;
    });

    message += "\n━━━━━━━━━━━━━━━━━━━━\n";
    message += "💡 Reply:\n";
    message += "▸ number + raw (upload)\n";
    message += "▸ number + del (delete)\n\n";
    message += "Example: 1 raw\n\n";
    message += "© Robin-Bot";

    api.sendMessage(
      message,
      event.threadID,
      (err, info) => {
        if (err) return console.error(err);

        global.client.handleReply.set(info.messageID, {
          name: module.exports.config.name,
          messageID: info.messageID,
          author: event.senderID,
          files: jsFiles,
        });
      },
      event.messageID
    );
  });
};

module.exports.handleReply = async function ({ event, api, handleReply }) {
  const fs = require("fs");
  const path = require("path");
  const axios = require("axios");

  const input = event.body.trim().split(" ");
  const fileNumber = parseInt(input[0], 10);
  const action = input[1]?.toLowerCase();

  // Validate input
  if (isNaN(fileNumber) || !action) {
    return api.sendMessage(
      "❌ Invalid format!\nUse: number + raw/del\nExample: 1 raw",
      event.threadID,
      event.messageID
    );
  }

  // Check authorization
  if (event.senderID !== handleReply.author) {
    return api.sendMessage(
      "❌ Only the command user can reply!",
      event.threadID,
      event.messageID
    );
  }

  const jsFiles = handleReply.files;

  // Validate file number
  if (fileNumber < 1 || fileNumber > jsFiles.length) {
    return api.sendMessage(
      `❌ Invalid file number! (1-${jsFiles.length})`,
      event.threadID,
      event.messageID
    );
  }

  const fileName = jsFiles[fileNumber - 1];
  const filePath = path.join(__dirname, fileName);

  try {
    if (action === "del") {
      // Delete file
      fs.unlinkSync(filePath);
      return api.sendMessage(
        `✅ Deleted: ${fileName}`,
        event.threadID,
        event.messageID
      );
    }

    if (action === "raw") {
      // Upload to Pastebin
      const fileContent = fs.readFileSync(filePath, "utf8");
      const apiKey = global.config.PASTEBIN_API_KEY;

      if (!apiKey) {
        return api.sendMessage(
          '❌ API key missing!\n\nSetup:\n1. Get key: pastebin.com/doc_api\n2. Add to config.json:\n   "PASTEBIN_API_KEY": "key"\n3. Restart bot',
          event.threadID,
          event.messageID
        );
      }

      api.sendMessage(`⏳ Uploading ${fileName}...`, event.threadID);

      try {
        const formData = `api_dev_key=${encodeURIComponent(
          apiKey
        )}&api_option=paste&api_paste_code=${encodeURIComponent(
          fileContent
        )}&api_paste_name=${encodeURIComponent(
          fileName
        )}&api_paste_format=javascript&api_paste_private=1&api_paste_expire_date=1M`;

        const response = await axios.post(
          "https://pastebin.com/api/api_post.php",
          formData,
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }
        );

        if (response.data && response.data.startsWith("http")) {
          const pasteUrl = response.data.trim();
          const rawUrl = pasteUrl.replace("pastebin.com/", "pastebin.com/raw/");

          return api.sendMessage(
            `✅ Uploaded!\n\n📁 ${fileName}\n📊 ${fileContent.length} chars\n\n🔗 View: ${pasteUrl}\n🔗 Raw: ${rawUrl}\n\n⏰ Expires: 1 month\n\n© Robin-Bot`,
            event.threadID,
            event.messageID
          );
        } else {
          throw new Error(response.data);
        }
      } catch (err) {
        console.error("Pastebin error:", err.response?.data || err.message);
        return api.sendMessage(
          `❌ Upload failed!\n\nError: ${
            err.response?.data || err.message
          }\n\nCheck API key validity.`,
          event.threadID,
          event.messageID
        );
      }
    }

    return api.sendMessage(
      "❌ Invalid action!\nUse: raw or del",
      event.threadID,
      event.messageID
    );
  } catch (error) {
    console.error("Error:", error);
    return api.sendMessage(
      "❌ An error occurred!",
      event.threadID,
      event.messageID
    );
  }
};
