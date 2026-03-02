// edit.js – Local image editor using jimp (no API key needed)

const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const jimp = require("jimp");

// ---------- helper functions ----------

// args / reply থেকে image URL বের করা
function extractImageUrl(args, event) {
  let imageUrl = args.find((arg) => /^https?:\/\//.test(arg));
  if (
    !imageUrl &&
    event.messageReply &&
    event.messageReply.attachments &&
    event.messageReply.attachments.length > 0
  ) {
    const imageAttachment = event.messageReply.attachments.find(
      (att) => att.type === "photo" || att.type === "image"
    );
    if (imageAttachment && imageAttachment.url) {
      imageUrl = imageAttachment.url;
    }
  }
  return imageUrl;
}

// এফেক্ট বের করা
function extractEffect(rawArgs, imageUrl) {
  let effect = rawArgs.join(" ");
  if (imageUrl) effect = effect.replace(imageUrl, "").trim();
  if (effect.includes("|")) effect = effect.split("|")[0].trim();
  return effect || "enhance";
}

// jimp দিয়ে ইমেজ এডিট করা
async function editImage(imagePath, effect) {
  const img = await jimp.read(imagePath);
  effect = effect.toLowerCase().trim();
  
  switch (effect) {
    case "enhance":
    case "enhance quality":
      img.brightness(0.15).contrast(0.2);
      break;
    case "blur":
      img.blur(10);
      break;
    case "sharpen":
      img.sharpen();
      break;
    case "grayscale":
    case "bw":
    case "blackwhite":
      img.grayscale();
      break;
    case "invert":
    case "negative":
      img.invert();
      break;
    case "sepia":
    case "vintage":
      img.sepia();
      break;
    case "brightness":
      img.brightness(0.3);
      break;
    case "dark":
    case "darken":
      img.brightness(-0.2);
      break;
    default:
      img.brightness(0.15).contrast(0.2);
  }
  return img;
}

// ---------- command config ----------

module.exports.config = {
  name: "edit",
  version: "2.0.0",
  credits: "Robin-Bot | Offline Editor by Moyna",
  description: "Edit image locally: enhance, blur, sharpen, grayscale, invert, sepia, brightness, dark",
  commandCategory: "image",
  cooldowns: 10,
};

// ---------- main run function ----------

module.exports.run = async function ({ api, event, args }) {
  const imageUrl = extractImageUrl(args, event);
  const effect = extractEffect(args, imageUrl);

  if (!imageUrl) {
    return api.sendMessage(
      "❌ একটা ছবি দাও বা ছবিতে reply করে কমান্ড দাও।\n\n" +
      "উদাহরণ:\n" +
      "/edit enhance\n" +
      "/edit blur\n" +
      "/edit grayscale\n" +
      "/edit invert\n" +
      "/edit sepia\n" +
      "/edit sharpen\n" +
      "/edit brightness\n" +
      "/edit dark",
      event.threadID,
      event.messageID
    );
  }

  const validEffects = [
    "enhance", "blur", "sharpen", "grayscale", "bw", "blackwhite",
    "invert", "negative", "sepia", "vintage", "brightness", "dark", "darken"
  ];
  
  if (!validEffects.includes(effect.toLowerCase())) {
    return api.sendMessage(
      `❌ "${effect}" জানি না।\n\nপ্রয়োজনীয় effects:\nenhance, blur, sharpen, grayscale, invert, sepia, brightness, dark`,
      event.threadID,
      event.messageID
    );
  }

  if (api.setMessageReaction) {
    api.setMessageReaction("⏳", event.messageID, () => {}, true);
  }

  let tempFilePath;

  try {
    const imageDownloadResponse = await axios.get(imageUrl, {
      responseType: "stream",
      timeout: 60000,
    });

    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);

    tempFilePath = path.join(cacheDir, `edit_original_${Date.now()}.png`);
    const writer = fs.createWriteStream(tempFilePath);
    imageDownloadResponse.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", (err) => {
        writer.close();
        reject(err);
      });
    });

    const editedImage = await editImage(tempFilePath, effect);
    const outputPath = path.join(cacheDir, `edit_output_${Date.now()}.png`);
    await editedImage.write(outputPath);

    if (api.setMessageReaction) {
      api.setMessageReaction("✅", event.messageID, () => {}, true);
    }

    api.sendMessage(
      {
        body: `✅ Edit complete!\nEffect: ${effect}`,
        attachment: fs.createReadStream(outputPath),
      },
      event.threadID,
      () => {
        if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      },
      event.messageID
    );
  } catch (error) {
    if (api.setMessageReaction) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);
    }

    let errorMessage = "ছবি edit করার সময় সমস্যা হয়েছে।";
    if (error.code === "ECONNABORTED") {
      errorMessage = "⏰ ছবি ডাউনলোড করতে অনেক দেরি হচ্ছে (timeout)।";
    } else if (error.message) {
      errorMessage = error.message;
    }

    console.error("Edit Command Error:", error);
    api.sendMessage(`❌ ${errorMessage}`, event.threadID, event.messageID);

    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  }
};
