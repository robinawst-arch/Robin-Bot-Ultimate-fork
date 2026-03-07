const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const config = require("../../../config.json");
const REPLICATE_TOKEN = config.REPLICATE_API_KEY || "";
const HF_TOKEN = config.HUGGINGFACE_API_KEY || "";
const REMBG_VERSION = "fb8af171cfa1616ddcf1242c093f9c46bcada5ad23d1ae4c12d97d6bc5f7e7b";
module.exports.config = { name: "removebg", version: "2.0", author: "Robin", countDown: 5, role: 0, shortDescription: "Remove image background", longDescription: "Remove background from a photo using AI (Replicate rembg).", category: "image", guide: "{pn} [reply to a photo]" };
async function runReplicate(imageUrl) {
  const create = await axios.post("https://api.replicate.com/v1/predictions", { version: REMBG_VERSION, input: { image: imageUrl } }, { headers: { Authorization: "Token " + REPLICATE_TOKEN, "Content-Type": "application/json" }, timeout: 15000 });
  const id = create.data && create.data.id;
  if (!id) throw new Error("Replicate: no prediction ID");
  const pollUrl = "https://api.replicate.com/v1/predictions/" + id;
  const headers = { Authorization: "Token " + REPLICATE_TOKEN };
  const start = Date.now();
  while (Date.now() - start < 120000) {
    await new Promise(r => setTimeout(r, 3000));
    const poll = await axios.get(pollUrl, { headers, timeout: 15000 });
    const { status, output, error } = poll.data;
    if (status === "succeeded") { const r = Array.isArray(output) ? output[0] : output; if (!r) throw new Error("empty output"); return r; }
    if (status === "failed" || status === "canceled") throw new Error("Replicate failed: " + (error || status));
  }
  throw new Error("Replicate: timed out");
}
async function runHuggingFace(imageUrl) {
  const imgRes = await axios.get(imageUrl, { responseType: "arraybuffer", timeout: 30000 });
  const res = await axios.post("https://api-inference.huggingface.co/models/briaai/RMBG-1.4", imgRes.data, { headers: { Authorization: "Bearer " + (HF_TOKEN || "hf_anonymous"), "Content-Type": "image/jpeg" }, responseType: "arraybuffer", timeout: 60000 });
  if (!res.data || res.data.byteLength < 100) throw new Error("HuggingFace: empty response");
  return Buffer.from(res.data);
}
module.exports.onStart = async function ({ api, event }) {
  const { threadID, messageID } = event;
  try {
    if (!event.messageReply || !event.messageReply.attachments || !event.messageReply.attachments[0] || event.messageReply.attachments[0].type !== "photo")
      return api.sendMessage("📸 Reply করে একটি ছবি দিন।", threadID, messageID);
    const imgUrl = event.messageReply.attachments[0].url;
    const waitMsg = await new Promise(resolve => api.sendMessage("🪄 Background remove করা হচ্ছে...\n⏳ একটু অপেক্ষা করুন।", threadID, (e, info) => resolve(info), messageID));
    const cachePath = path.join(__dirname, "cache", "rmbg_" + Date.now() + ".png");
    fs.ensureDirSync(path.join(__dirname, "cache"));
    let resultBuf = null;
    if (REPLICATE_TOKEN) {
      try { const url = await runReplicate(imgUrl); const dl = await axios.get(url, { responseType: "arraybuffer", timeout: 30000 }); resultBuf = Buffer.from(dl.data); }
      catch (e) { console.error("[removebg] Replicate:", e.message); }
    }
    if (!resultBuf) {
      try { resultBuf = await runHuggingFace(imgUrl); }
      catch (e) { console.error("[removebg] HF:", e.message); }
    }
    if (!resultBuf) {
      if (waitMsg && waitMsg.messageID) api.unsendMessage(waitMsg.messageID);
      return api.sendMessage("❌ Background remove হয়নি। পরে চেষ্টা করুন।", threadID, messageID);
    }
    fs.writeFileSync(cachePath, resultBuf);
    if (waitMsg && waitMsg.messageID) api.unsendMessage(waitMsg.messageID);
    api.sendMessage({ body: "✨ Background Removed Successfully!", attachment: fs.createReadStream(cachePath) }, threadID, () => { try { fs.unlinkSync(cachePath); } catch(_) {} }, messageID);
  } catch (err) {
    console.error("[removebg]", err.message);
    api.sendMessage("⚠️ Error: " + err.message, threadID, messageID);
  }
};