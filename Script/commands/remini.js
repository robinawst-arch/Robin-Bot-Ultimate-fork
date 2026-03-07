const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const sharp = require("sharp");

// ─── CONFIG ──────────────────────────────────────────────────────────────────
// Replicate API key → https://replicate.com/signin (free $5 credit)
// Hugging Face token → https://huggingface.co/settings/tokens (100% free)
const config = require("../../../config.json");
const REPLICATE_TOKEN = config.REPLICATE_API_KEY || "";
const HF_TOKEN = config.HUGGINGFACE_API_KEY || "";

// CodeFormer — face restoration AI (same tech as Remini)
// Model: https://replicate.com/sczhou/codeformer
const CODEFORMER_VERSION =
  "7de2ea26c616d5bf2245ad0d5e24f0ff9a6204578a5c876db53142ebb9d3d4d9";
// ─────────────────────────────────────────────────────────────────────────────

module.exports.config = {
  name: "remini",
  version: "4.0",
  author: "Robin",
  role: 0,
  shortDescription: "Enhance image with AI",
  longDescription:
    "Restore & enhance faces using CodeFormer AI (same tech as Remini). Falls back to local 2× upscale if no API key.",
  category: "image",
  guide: "{pn} [reply to a photo]",
};

/**
 * Call Replicate CodeFormer and poll until the prediction finishes.
 * Returns the output image URL.
 */
async function runCodeFormer(imageUrl) {
  // 1. Start prediction
  const create = await axios.post(
    "https://api.replicate.com/v1/predictions",
    {
      version: CODEFORMER_VERSION,
      input: {
        image: imageUrl,
        codeformer_fidelity: 0.7, // 0 = quality, 1 = identity — 0.7 is sweet spot
        background_enhance: true,
        face_upsample: true,
        upscale: 2,
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
  if (!predictionId) throw new Error("Replicate: no prediction ID returned");

  // 2. Poll until done (max 3 minutes)
  const pollUrl = `https://api.replicate.com/v1/predictions/${predictionId}`;
  const headers = { Authorization: `Token ${REPLICATE_TOKEN}` };
  const start = Date.now();

  while (Date.now() - start < 180000) {
    await new Promise((r) => setTimeout(r, 3000)); // wait 3 s between polls
    const poll = await axios.get(pollUrl, { headers, timeout: 15000 });
    const { status, output, error } = poll.data;

    if (status === "succeeded") {
      // output is a URL string or array of URLs
      const result = Array.isArray(output) ? output[0] : output;
      if (!result) throw new Error("Replicate: empty output");
      return result;
    }
    if (status === "failed" || status === "canceled") {
      throw new Error(
        `Replicate: prediction ${status} — ${error || "no reason"}`,
      );
    }
    // status is "starting" or "processing" — keep polling
  }
  throw new Error("Replicate: timed out after 3 minutes");
}

/**
 * Hugging Face GFPGAN — free face restoration AI, 100% free, no credit card.
 * Signup: https://huggingface.co/settings/tokens → New token (read)
 * Add HUGGINGFACE_API_KEY to config.json
 */
async function runGFPGAN(imageUrl) {
  const imgBuf = Buffer.from(
    (await axios.get(imageUrl, { responseType: "arraybuffer", timeout: 20000 }))
      .data,
  );
  const res = await axios.post(
    "https://api-inference.huggingface.co/models/tintwotin/gfpgan",
    imgBuf,
    {
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/octet-stream",
      },
      responseType: "arraybuffer",
      timeout: 90000,
    },
  );
  const ct = res.headers["content-type"] || "";
  if (!ct.includes("image")) {
    const msg = Buffer.from(res.data).toString("utf8").slice(0, 200);
    throw new Error(`HuggingFace: ${msg}`);
  }
  return { buffer: Buffer.from(res.data) };
}

/**
 * Local fallback: 2× Lanczos upscale + sharpen + colour boost using sharp.
 * No internet needed, works offline.
 */
async function localEnhance(inputBuffer) {
  const meta = await sharp(inputBuffer).metadata();
  const w = (meta.width || 800) * 2;
  const h = (meta.height || 800) * 2;
  return sharp(inputBuffer)
    .resize(w, h, { kernel: "lanczos3" })
    .sharpen({ sigma: 1.2, m1: 1.5, m2: 0.7, x1: 2, y2: 15, y3: 15 })
    .modulate({ brightness: 1.04, saturation: 1.1 })
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();
}

module.exports.onStart = async function ({ api, event }) {
  try {
    if (
      !event.messageReply?.attachments?.[0] ||
      event.messageReply.attachments[0].type !== "photo"
    ) {
      return api.sendMessage(
        "📸 Please reply to a photo to enhance it.",
        event.threadID,
        event.messageID,
      );
    }

    const imgUrl = event.messageReply.attachments[0].url;

    // Send waiting message
    const waitMsg = await new Promise((resolve) =>
      api.sendMessage(
        REPLICATE_TOKEN || HF_TOKEN
          ? "🔄 AI is enhancing your photo...\n⏳ This may take 20–60 seconds."
          : "🔄 Enhancing your photo (local AI)...",
        event.threadID,
        (err, info) => resolve(info),
        event.messageID,
      ),
    );

    // Download original image buffer
    const originalBuf = Buffer.from(
      (
        await axios.get(imgUrl, {
          responseType: "arraybuffer",
          timeout: 30000,
        })
      ).data,
    );

    const cachePath = path.join(__dirname, "cache", `remini_${Date.now()}.jpg`);
    fs.ensureDirSync(path.join(__dirname, "cache"));

    let usedAI = false;
    let label = "";

    if (REPLICATE_TOKEN) {
      try {
        const resultUrl = await runCodeFormer(imgUrl);
        const imgRes = await axios.get(resultUrl, {
          responseType: "arraybuffer",
          timeout: 30000,
        });
        fs.writeFileSync(cachePath, Buffer.from(imgRes.data));
        label = "✨ Enhanced with CodeFormer AI (Remini-style)!";
      } catch (aiErr) {
        console.error("[remini] Replicate failed:", aiErr.message);
        if (HF_TOKEN) {
          try {
            const hf = await runGFPGAN(imgUrl);
            fs.writeFileSync(cachePath, hf.buffer);
            label = "✨ Enhanced with GFPGAN AI!";
          } catch (hfErr) {
            console.error("[remini] HuggingFace failed:", hfErr.message);
            fs.writeFileSync(cachePath, await localEnhance(originalBuf));
            label = "✨ Enhanced (local ×2) — AI APIs unavailable.";
          }
        } else {
          fs.writeFileSync(cachePath, await localEnhance(originalBuf));
          label = "✨ Enhanced (local ×2) — Replicate: " + aiErr.message;
        }
      }
    } else if (HF_TOKEN) {
      try {
        const hf = await runGFPGAN(imgUrl);
        fs.writeFileSync(cachePath, hf.buffer);
        label = "✨ Enhanced with GFPGAN AI!";
      } catch (hfErr) {
        console.error("[remini] HuggingFace failed:", hfErr.message);
        fs.writeFileSync(cachePath, await localEnhance(originalBuf));
        label = "✨ Enhanced (local ×2) — HuggingFace: " + hfErr.message;
      }
    } else {
      fs.writeFileSync(cachePath, await localEnhance(originalBuf));
      label =
        "✨ Photo enhanced (local ×2)!\n\n💡 Add a FREE API key to config.json for real Remini-quality AI:\n• Replicate: https://replicate.com/signin\n• HuggingFace: https://huggingface.co/settings/tokens";
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
    console.error("[remini]", e.message);
    api.sendMessage(
      `❌ Enhancement failed: ${e.message}`,
      event.threadID,
      event.messageID,
    );
  }
};
