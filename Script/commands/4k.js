const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const sharp = require("sharp");

const config = require("../../../config.json");
const REPLICATE_TOKEN = config.REPLICATE_API_KEY || "";

// Real-ESRGAN — 2× super-resolution + face enhance
// Model: https://replicate.com/nightmareai/real-esrgan
const REALESRGAN_VERSION =
  "f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa";

module.exports.config = {
  name: "4k",
  version: "4.0",
  author: "Robin",
  countDown: 5,
  role: 0,
  shortDescription: "4K Super Resolution",
  longDescription:
    "Upscale photo to 2× resolution with AI face enhancement (Real-ESRGAN)",
  category: "image",
  guide: "{pn} [reply to a photo]",
};

async function runRealESRGAN(imageUrl, scale = 2) {
  const create = await axios.post(
    "https://api.replicate.com/v1/predictions",
    {
      version: REALESRGAN_VERSION,
      input: {
        image: imageUrl,
        scale,
        face_enhance: true,
      },
    },
    {
      headers: {
        Authorization: `Token ${REPLICATE_TOKEN}`,
        "Content-Type": "application/json",
      },
      timeout: 15000,
    },
  );

  const predictionId = create.data?.id;
  if (!predictionId) throw new Error("Replicate: no prediction ID");

  const pollUrl = `https://api.replicate.com/v1/predictions/${predictionId}`;
  const headers = { Authorization: `Token ${REPLICATE_TOKEN}` };
  const start = Date.now();

  while (Date.now() - start < 180000) {
    await new Promise((r) => setTimeout(r, 3000));
    const poll = await axios.get(pollUrl, { headers, timeout: 15000 });
    const { status, output, error } = poll.data;

    if (status === "succeeded") {
      const result = Array.isArray(output) ? output[0] : output;
      if (!result) throw new Error("Replicate: empty output");
      return result;
    }
    if (status === "failed" || status === "canceled") {
      throw new Error(`Replicate: ${status} — ${error || "unknown"}`);
    }
  }
  throw new Error("Replicate: timed out after 3 minutes");
}

// Local fallback: 2× Lanczos + sharpen
async function localUpscale(inputBuffer) {
  const meta = await sharp(inputBuffer).metadata();
  const w = (meta.width || 720) * 2;
  const h = (meta.height || 720) * 2;
  return sharp(inputBuffer)
    .resize(w, h, { kernel: "lanczos3" })
    .sharpen({ sigma: 1.2, m1: 1.5, m2: 0.7, x1: 2, y2: 15, y3: 15 })
    .modulate({ brightness: 1.03, saturation: 1.08 })
    .jpeg({ quality: 93, mozjpeg: true })
    .toBuffer();
}

module.exports.onStart = async function ({ api, event }) {
  try {
    if (
      !event.messageReply?.attachments?.[0] ||
      event.messageReply.attachments[0].type !== "photo"
    ) {
      return api.sendMessage(
        "📸 Baby, 4K করতে হলে ছবি reply করতে হবে 😘",
        event.threadID,
        event.messageID,
      );
    }

    const imgUrl = event.messageReply.attachments[0].url;

    const waitMsg = await new Promise((resolve) =>
      api.sendMessage(
        REPLICATE_TOKEN
          ? "⏳ Baby wait… Real-ESRGAN AI দিয়ে 4K বানাচ্ছি 😘\n⏳ ২০-৬০ সেকেন্ড লাগবে।"
          : "⏳ Baby wait… তোমার ছবিটা 4K বানাচ্ছি 😘",
        event.threadID,
        (err, info) => resolve(info),
        event.messageID,
      ),
    );

    const originalBuf = Buffer.from(
      (await axios.get(imgUrl, { responseType: "arraybuffer", timeout: 30000 }))
        .data,
    );

    const cachePath = path.join(__dirname, "cache", `4k_${Date.now()}.jpg`);
    fs.ensureDirSync(path.join(__dirname, "cache"));

    let label = "";

    if (REPLICATE_TOKEN) {
      try {
        const resultUrl = await runRealESRGAN(imgUrl, 2);
        const imgRes = await axios.get(resultUrl, {
          responseType: "arraybuffer",
          timeout: 30000,
        });
        fs.writeFileSync(cachePath, Buffer.from(imgRes.data));
        label = "✨ Baby তোমার 4K image প্রস্তুত 💛 (Real-ESRGAN AI)";
      } catch (aiErr) {
        console.error("[4k] Replicate failed:", aiErr.message);
        fs.writeFileSync(cachePath, await localUpscale(originalBuf));
        label = "✨ Baby তোমার 4K image প্রস্তুত 💛 (local 2×)";
      }
    } else {
      fs.writeFileSync(cachePath, await localUpscale(originalBuf));
      label = "✨ Baby তোমার 4K image প্রস্তুত 💛 (local 2×)";
    }

    if (waitMsg?.messageID) api.unsendMessage(waitMsg.messageID);

    api.sendMessage(
      { body: label, attachment: fs.createReadStream(cachePath) },
      event.threadID,
      () => {
        try {
          fs.unlinkSync(cachePath);
        } catch (_) {}
      },
      event.messageID,
    );
  } catch (e) {
    console.error("[4k]", e.message);
    api.sendMessage(
      "❌ উফ baby… 4K করতে সমস্যা হলো 😢 পরে আবার try করো।",
      event.threadID,
      event.messageID,
    );
  }
};
