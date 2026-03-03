// edit.js – Smart Image Editor using Sharp (local, no API needed) + Bangla support

const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const sharp = require("sharp");

const CACHE_DIR = path.join(__dirname, "cache");

module.exports.config = {
  name: "edit",
  version: "6.0.0",
  credits: "Robin-Bot",
  aliases: ["aiedit", "photoedit", "filter"],
  hasPermssion: 0,
  countDown: 5,
  commandCategory: "image",
  description: "বাংলায় বলুন — AI ছবি edit করবে",
  usages:
    "ছবিতে reply করে লিখুন:\n{pn} কালো সাদা করো\n{pn} উজ্জ্বল করো\n{pn} ঝাপসা করো\n{pn} পুরনো লুক দাও\n{pn} নেগেটিভ করো",
};

// Effect keywords (Bangla + English)
const EFFECTS = [
  {
    name: "grayscale",
    label: "⬛ কালো-সাদা",
    keys: [
      "কালো সাদা",
      "কালো-সাদা",
      "বাংলা",
      "grayscale",
      "bw",
      "black white",
      "bnw",
      "সাদাকালো",
    ],
  },
  {
    name: "bright",
    label: "☀️ উজ্জ্বল",
    keys: [
      "উজ্জ্বল",
      "আলো বাড়াও",
      "밝",
      "bright",
      "lighten",
      "আলো",
      "হালকা করো",
    ],
  },
  {
    name: "dark",
    label: "🌑 অন্ধকার",
    keys: ["অন্ধকার", "dark", "darken", "কালো করো", "dim", "মন্দ আলো"],
  },
  {
    name: "blur",
    label: "🌫️ ঝাপসা",
    keys: ["ঝাপসা", "blur", "blurry", "흐린", "fuzzy", "ধোঁয়াশা"],
  },
  {
    name: "sharpen",
    label: "🔪 শার্প",
    keys: ["sharp", "sharpen", "পরিষ্কার", "স্পষ্ট", "sharpness", "선명"],
  },
  {
    name: "sepia",
    label: "🟤 সেপিয়া/পুরনো",
    keys: [
      "sepia",
      "পুরনো",
      "vintage",
      "পুরোনো লুক",
      "old",
      "retro",
      "ক্লাসিক",
    ],
  },
  {
    name: "invert",
    label: "🔄 নেগেটিভ",
    keys: ["invert", "নেগেটিভ", "negative", "উল্টো রং", "রং উল্টো"],
  },
  {
    name: "contrast",
    label: "🎨 কনট্রাস্ট",
    keys: ["contrast", "কনট্রাস্ট", "বৈপরীত্য", "vivid", "প্রাণবন্ত"],
  },
  {
    name: "cartoon",
    label: "🎨 কার্টুন",
    keys: ["cartoon", "কার্টুন", "anime", "আনিমে", "poster", "পোস্টার"],
  },
  {
    name: "warm",
    label: "🔆 উষ্ণ/গরম টোন",
    keys: ["warm", "উষ্ণ", "গরম", "yellow", "হলুদ", "সোনালি", "golden"],
  },
  {
    name: "cool",
    label: "❄️ শীতল/নীল টোন",
    keys: ["cool", "শীতল", "ঠান্ডা", "blue", "নীল", "winter"],
  },
  {
    name: "flip",
    label: "↕️ উল্টা/ফ্লিপ",
    keys: ["flip", "উল্টা", "উপর নিচ", "vertical flip", "উল্টে দাও"],
  },
  {
    name: "mirror",
    label: "↔️ মিরর",
    keys: ["mirror", "আয়না", "flop", "horizontal flip", "বাম ডান"],
  },
  {
    name: "rotate",
    label: "🔄 ঘুরাও",
    keys: ["rotate", "ঘুরাও", "90", "১৮০", "180"],
  },
];

function detectEffect(text) {
  const lower = text.toLowerCase();
  for (const effect of EFFECTS) {
    for (const key of effect.keys) {
      if (lower.includes(key.toLowerCase())) return effect;
    }
  }
  return null;
}

async function applyEffect(inputPath, outputPath, effectName) {
  let img = sharp(inputPath);

  switch (effectName) {
    case "grayscale":
      img = img.grayscale();
      break;
    case "bright":
      img = img.modulate({ brightness: 1.5 });
      break;
    case "dark":
      img = img.modulate({ brightness: 0.5 });
      break;
    case "blur":
      img = img.blur(6);
      break;
    case "sharpen":
      img = img.sharpen(10);
      break;
    case "sepia":
      img = img.grayscale().tint({ r: 112, g: 66, b: 20 });
      break;
    case "invert":
      img = img.negate();
      break;
    case "contrast":
      img = img.linear(1.8, -(128 * 0.8));
      break;
    case "cartoon":
      img = img.modulate({ saturation: 3 }).sharpen(8);
      break;
    case "warm":
      img = img.tint({ r: 255, g: 200, b: 150 });
      break;
    case "cool":
      img = img.tint({ r: 150, g: 200, b: 255 });
      break;
    case "flip":
      img = img.flip();
      break;
    case "mirror":
      img = img.flop();
      break;
    case "rotate":
      img = img.rotate(90);
      break;
    default:
      img = img.modulate({ brightness: 1.2, saturation: 1.3 });
  }

  await img.jpeg({ quality: 90 }).toFile(outputPath);
}

module.exports.run = async ({ api, event, args }) => {
  const { threadID, messageID, messageReply } = event;

  // ১. ছবি আছে কিনা
  if (
    !messageReply ||
    !messageReply.attachments ||
    messageReply.attachments.length === 0
  ) {
    const effectList = EFFECTS.map((e) => `• ${e.label}`).join("\n");
    return api.sendMessage(
      "❌ একটি ছবিতে reply করে কমান্ড দিন!\n\n" +
        "📌 নিয়ম: ছবিতে reply করে /edit লিখুন\n\n" +
        "✨ available effects:\n" +
        effectList,
      threadID,
      messageID,
    );
  }

  const attachment = messageReply.attachments.find(
    (a) => a.type === "photo" || a.type === "image",
  );
  if (!attachment?.url) {
    return api.sendMessage(
      "❌ ছবি পাওয়া যায়নি। ছবিতে reply করুন।",
      threadID,
      messageID,
    );
  }

  // ২. Prompt
  const prompt = args.join(" ").trim();
  if (!prompt) {
    const effectList = EFFECTS.map(
      (e) => `• ${e.label}: ${e.keys.slice(0, 2).join(", ")}`,
    ).join("\n");
    return api.sendMessage(
      "❌ কী effect চান লিখুন!\n\nউদাহরণ: /edit কালো সাদা করো\n\n" +
        "📋 সব effects:\n" +
        effectList,
      threadID,
      messageID,
    );
  }

  // ৩. Effect detect করো
  let effect = detectEffect(prompt);

  // যদি না পাওয়া যায়, translate করে আবার try করো
  if (!effect) {
    try {
      const transRes = await axios.get(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(prompt)}&langpair=bn|en`,
        { timeout: 8000 },
      );
      const translated = transRes.data?.responseData?.translatedText || "";
      effect = detectEffect(translated);
    } catch {}
  }

  if (!effect) {
    const effectList = EFFECTS.map((e) => `${e.label}`).join(", ");
    return api.sendMessage(
      `❌ "${prompt}" বুঝতে পারিনি!\n\nAvailable effects:\n${effectList}\n\nউদাহরণ: /edit উজ্জ্বল করো`,
      threadID,
      messageID,
    );
  }

  api.sendMessage(
    `⏳ ${effect.label} effect লাগানো হচ্ছে...`,
    threadID,
    messageID,
  );

  await fs.ensureDir(CACHE_DIR);
  const rawPath = path.join(CACHE_DIR, `edit_raw_${Date.now()}.jpg`);
  const outPath = path.join(CACHE_DIR, `edit_out_${Date.now()}.jpg`);

  try {
    // ৪. ছবি ডাউনলোড
    const imgRes = await axios.get(attachment.url, {
      responseType: "arraybuffer",
      timeout: 20000,
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    await fs.writeFile(rawPath, imgRes.data);

    // ৫. Effect apply
    await applyEffect(rawPath, outPath, effect.name);

    // ৬. পাঠাও
    await api.sendMessage(
      {
        body:
          `✅ Edit সম্পন্ন!\n` +
          `🎨 Effect: ${effect.label}\n` +
          `📝 Prompt: ${prompt}\n` +
          `🤖 Robin Bot`,
        attachment: fs.createReadStream(outPath),
      },
      threadID,
      () => {
        [rawPath, outPath].forEach((f) => {
          if (fs.existsSync(f))
            try {
              fs.unlinkSync(f);
            } catch {}
        });
      },
      messageID,
    );
  } catch (error) {
    [rawPath, outPath].forEach((f) => {
      if (fs.existsSync(f))
        try {
          fs.unlinkSync(f);
        } catch {}
    });
    console.error("[EDIT] Error:", error.message);
    api.sendMessage(
      `❌ ছবি edit করতে সমস্যা হয়েছে।\n${error.message}`,
      threadID,
      messageID,
    );
  }
};

