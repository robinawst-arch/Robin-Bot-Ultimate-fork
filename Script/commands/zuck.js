// clean & fixed by Robin 💙

module.exports.config = {
  name: "zuck",
  version: "1.1.0",
  hasPermssion: 0,
  credits: "Robin-Bot",
  description: "Write custom text on Zuck's board",
  commandCategory: "edit-img",
  usages: "zuck [text]",
  cooldowns: 10,
  dependencies: {
    canvas: "",
    axios: "",
    "fs-extra": "",
  },
};

// Wrap text function (cleaned)
module.exports.wrapText = (ctx, text, maxWidth) => {
  return new Promise((resolve) => {
    const words = text.split(" ");
    const lines = [];
    let line = "";

    for (let word of words) {
      const testLine = line + word + " ";
      const width = ctx.measureText(testLine).width;

      if (width > maxWidth) {
        lines.push(line.trim());
        line = word + " ";
      } else {
        line = testLine;
      }
    }

    lines.push(line.trim());
    resolve(lines);
  });
};

module.exports.run = async ({ api, event, args }) => {
  const { loadImage, createCanvas } = require("canvas");
  const fs = require("fs-extra");
  const axios = require("axios");

  const text = args.join(" ");
  const { threadID, messageID } = event;

  if (!text) {
    return api.sendMessage(
      "⚠️ Write something to put on the board!\nExample: zuck I love you ❤️",
      threadID,
      messageID
    );
  }

  try {
    // Image path
    const imgPath = __dirname + "/cache/zuckboard.png";

    // New, clean Zuckerberg board image
    const templateURL = "https://i.postimg.cc/gJCXgKv4/zucc.jpg";

    const imgData = (
      await axios.get(templateURL, { responseType: "arraybuffer" })
    ).data;
    fs.writeFileSync(imgPath, Buffer.from(imgData));

    const baseImage = await loadImage(imgPath);

    const canvas = createCanvas(baseImage.width, baseImage.height);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(baseImage, 0, 0);

    // Text settings
    ctx.fillStyle = "#000000";
    ctx.textAlign = "start";
    ctx.font = "28px Arial";

    // Auto wrap text
    const lines = await this.wrapText(ctx, text, 450);

    let y = 90; // starting Y-position
    lines.forEach((line) => {
      ctx.fillText(line, 35, y);
      y += 35;
    });

    // Save final image
    const finalBuffer = canvas.toBuffer();
    fs.writeFileSync(imgPath, finalBuffer);

    return api.sendMessage(
      { attachment: fs.createReadStream(imgPath) },
      threadID,
      () => fs.unlinkSync(imgPath),
      messageID
    );
  } catch (err) {
    console.log("Zuck Error:", err);
    api.sendMessage("❌ Error editing image!", threadID, messageID);
  }
};
