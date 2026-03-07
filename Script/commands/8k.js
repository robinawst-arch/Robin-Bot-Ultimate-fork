const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const sharp = require("sharp");

const config = require("../../../config.json");
const REPLICATE_TOKEN = config.REPLICATE_API_KEY || "";

const REALESRGAN_VERSION =
  "f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa";

module.exports.config = {
  name: "8k",
  version: "5.0",
  author: "Robin",
  countDown: 5,
  role: 0,
  shortDescription: "8K Ultra HD Natural",
  longDescription:
    "Upscale photo to 4× with Full 8K Ultra HD Natural effect — HDR tone mapping, crystal sharpness, lifted blacks, natural warm tones.",
  category: "image",
  guide: "{pn} [reply to a photo]",
};

async function runRealESRGAN(imageUrl) {
  const create = await axios.post(
    "https://api.replicate.com/v1/predictions",
    {
      version: REALESRGAN_VERSION,
      input: { image: imageUrl, scale: 4, face_enhance: true },
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
    if (status === "failed" || status === "canceled")
      throw new Error(`Replicate: ${status} — ${error || "unknown"}`);
  }
  throw new Error("Replicate: timed out after 3 minutes");
}

// ═══════════════════════════════════════════════════════════════
// EFFECT 3 — Full 8K Ultra HD Natural
// HDR tone mapping, lifted blacks, micro-detail sharpness,
// crystal-clear highlights, natural warm skin tones, minimal grade
// ═══════════════════════════════════════════════════════════════
async function effectUltraHD(inputBuffer) {
  const meta = await sharp(inputBuffer).metadata();
  const w = meta.width || 1280;
  const h = meta.height || 720;

  // HDR-style tone map: lift blacks, compress highlights gently
  const step1 = await sharp(inputBuffer)
    .gamma(0.9) // slightly brighten midtones
    .linear(1.08, 8) // lift entire range — no crushed blacks
    .toBuffer();

  // Very subtle natural warmth — no heavy grade, just clean enhancement
  const step2 = await sharp(step1)
    .recomb([
      [1.05, 0.02, 0.0], // R: gentle warm lift
      [0.0, 1.02, 0.0], // G: clean
      [0.0, 0.0, 0.98], // B: very slight blue reduction → natural warmth
    ])
    .toBuffer();

  // Maximum CLAHE clarity + ultra-sharp micro-detail
  const step3 = await sharp(step2)
    .clahe({ width: 32, height: 32, maxSlope: 8 })
    .sharpen({ sigma: 1.8, m1: 5.0, m2: 0.15, x1: 2, y2: 35, y3: 35 })
    .toBuffer();

  // Clean vivid — increased saturation, natural hue
  const step4 = await sharp(step3)
    .modulate({ saturation: 1.3, brightness: 1.01, hue: 4 })
    .toBuffer();

  // Subtle crisp glow — feather highlights without washing out
  const glowLayer = await sharp(step4)
    .blur(14)
    .modulate({ brightness: 1.1 })
    .toBuffer();
  const withGlow = await sharp(step4)
    .composite([{ input: glowLayer, blend: "screen", premultiplied: false }])
    .toBuffer();

  // Light vignette — only corners, not heavy
  const vignette = Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="v" cx="50%" cy="50%" r="72%">
          <stop offset="0%"   stop-color="black" stop-opacity="0"/>
          <stop offset="65%"  stop-color="black" stop-opacity="0"/>
          <stop offset="100%" stop-color="black" stop-opacity="0.55"/>
        </radialGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="url(#v)"/>
    </svg>`,
  );

  return sharp(withGlow)
    .composite([{ input: vignette, blend: "over" }])
    .jpeg({ quality: 99, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toBuffer();
}

async function localUpscale(inputBuffer) {
  const meta = await sharp(inputBuffer).metadata();
  const w = (meta.width || 720) * 4;
  const h = (meta.height || 720) * 4;
  return sharp(inputBuffer).resize(w, h, { kernel: "lanczos3" }).toBuffer();
}

module.exports.onStart = async function ({ api, event, args }) {
  try {
    if (
      !event.messageReply?.attachments?.[0] ||
      event.messageReply.attachments[0].type !== "photo"
    ) {
      return api.sendMessage(
        "📸 Reply to a photo to enhance it to Full 8K Ultra HD Natural.",
        event.threadID,
        event.messageID,
      );
    }

    const effectFn = effectUltraHD;
    const effectName = "✨ Full 8K Ultra HD Natural";

    const imgUrl = event.messageReply.attachments[0].url;

    const waitMsg = await new Promise((resolve) =>
      api.sendMessage(
        `${effectName} Effect processing...\n⏳ Please wait 30–60 seconds.`,
        event.threadID,
        (err, info) => resolve(info),
        event.messageID,
      ),
    );

    const originalBuf = Buffer.from(
      (await axios.get(imgUrl, { responseType: "arraybuffer", timeout: 30000 }))
        .data,
    );

    const cachePath = path.join(__dirname, "cache", `8k_${Date.now()}.jpg`);
    fs.ensureDirSync(path.join(__dirname, "cache"));

    let label = "";

    if (REPLICATE_TOKEN) {
      try {
        const resultUrl = await runRealESRGAN(imgUrl);
        const imgRes = await axios.get(resultUrl, {
          responseType: "arraybuffer",
          timeout: 30000,
        });
        const enhanced = await effectFn(Buffer.from(imgRes.data));
        fs.writeFileSync(cachePath, enhanced);
        label = `✨ 8K done! Real-ESRGAN 4× + ${effectName} Effect`;
      } catch (aiErr) {
        console.error("[8k] Replicate failed:", aiErr.message);
        const upscaled = await localUpscale(originalBuf);
        fs.writeFileSync(cachePath, await effectFn(upscaled));
        label = `✨ 8K done! Local 4× + ${effectName} Effect`;
      }
    } else {
      const upscaled = await localUpscale(originalBuf);
      fs.writeFileSync(cachePath, await effectFn(upscaled));
      label = `✨ 8K done! Local 4× + ${effectName} Effect`;
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
  } catch (err) {
    console.error("[8k]", err.message);
    api.sendMessage(
      `❌ 8K enhance failed: ${err.message}`,
      event.threadID,
      event.messageID,
    );
  }
};
