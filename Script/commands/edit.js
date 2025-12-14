// edit.js – Moyna Bot style (Mirai/FCA type)

const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const API_ENDPOINT = "https://tawsif.is-a.dev/gemini/nano-banana";

// ---------- helper functions ----------

// args / reply থেকে image URL বের করা
function extractImageUrl(args, event) {
  // ১) args থেকে http দিয়ে শুরু হওয়া স্ট্রিং খুঁজো
  let imageUrl = args.find((arg) => /^https?:\/\//i.test(arg));

  // ২) reply করা মেসেজের attachment থেকে
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

// প্রম্পট বের করা (image url বাদ দিয়ে)
function extractEditPrompt(rawArgs, imageUrl) {
  let prompt = rawArgs.join(" ");

  if (imageUrl) {
    prompt = prompt.replace(imageUrl, "").trim();
  }

  if (prompt.includes("|")) {
    prompt = prompt.split("|")[0].trim();
  }

  return prompt || "enhance quality";
}

// ---------- command config ----------

module.exports.config = {
  name: "edit",
  version: "1.0.0",
  credits: "Robin-Bot",
  description: "Edit or modify an existing image using a text prompt.",
  commandCategory: "ai-image",
  cooldowns: 15,
};

// ---------- main run function ----------

module.exports.run = async function ({ api, event, args }) {
  const imageUrl = extractImageUrl(args, event);
  const editPrompt = extractEditPrompt(args, imageUrl);

  if (!imageUrl) {
    return api.sendMessage(
      "❌ একটা ছবি দাও বা ছবিতে reply করে কমান্ড দাও।",
      event.threadID,
      event.messageID
    );
  }

  if (!editPrompt.trim()) {
    return api.sendMessage(
      "❌ কীভাবে edit করতে চাও সেটা লিখে দাও।",
      event.threadID,
      event.messageID
    );
  }

  // reaction দিতে চাইলে (mirai/fca তে কাজ করে)
  if (api.setMessageReaction) {
    api.setMessageReaction("⏳", event.messageID, () => {}, true);
  }

  let tempFilePath;

  try {
    const fullApiUrl = `${API_ENDPOINT}?prompt=${encodeURIComponent(
      editPrompt
    )}&url=${encodeURIComponent(imageUrl)}`;

    const apiResponse = await axios.get(fullApiUrl, {
      timeout: 60000,
    });

    const data = apiResponse.data;
    if (!data || !data.success || !data.imageUrl) {
      throw new Error(data?.error || "API থেকে সঠিক image URL পাওয়া যায়নি।");
    }

    const finalImageUrl = data.imageUrl;

    const imageDownloadResponse = await axios.get(finalImageUrl, {
      responseType: "stream",
      timeout: 60000,
    });

    const cacheDir = path.join(__dirname, "cache");
    await fs.ensureDir(cacheDir);

    tempFilePath = path.join(cacheDir, `edited_nano_${Date.now()}.png`);

    const writer = fs.createWriteStream(tempFilePath);
    imageDownloadResponse.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", (err) => {
        writer.close();
        reject(err);
      });
    });

    if (api.setMessageReaction) {
      api.setMessageReaction("✅", event.messageID, () => {}, true);
    }

    return api.sendMessage(
      {
        body: `✅ Edit complete!\nPrompt: ${editPrompt}`,
        attachment: fs.createReadStream(tempFilePath),
      },
      event.threadID,
      () => {
        if (tempFilePath && fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      },
      event.messageID
    );
  } catch (error) {
    if (api.setMessageReaction) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);
    }

    let errorMessage = "ছবি edit করার সময় সমস্যা হয়েছে।";
    if (error.response && error.response.data && error.response.data.error) {
      errorMessage += `\nAPI Error: ${error.response.data.error}`;
    } else if (error.code === "ECONNABORTED") {
      errorMessage = "⏰ API থেকে response পেতে অনেক দেরি হচ্ছে (timeout)।";
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
