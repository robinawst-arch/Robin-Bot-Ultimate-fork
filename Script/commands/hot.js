module.exports.config = {
  name: "hot",
  version: "2.1.0",
  hasPermssion: 2,
  credits: "CYBER BOT TEAM | Stable Omni Fix by Moyna",
  description: "Send random hot video",
  commandCategory: "admin",
  usages: "hot",
  cooldowns: 10
};

module.exports.run = async function ({ api, event }) {
  const axios = require("axios");
  const fs = require("fs-extra");
  const path = require("path");

  // 🔥 ALL GOOGLE DRIVE LINKS (export=download for Render)
  const videoLinks = [
    "https://drive.google.com/uc?export=download&id=1ABtEvo3Cvls7pkA4e937k9aNAL_YJc8Q",
    "https://drive.google.com/uc?export=download&id=1AFXbiWAIh90KQOqVYxHWHmv-3NKmJ76a",
    "https://drive.google.com/uc?export=download&id=1AB6SN7vCf7CD1sKiklfPHZOCzf3x8iLG",
    "https://drive.google.com/uc?export=download&id=1AC3BNRdKYOMAAS1lhu91PMkY27C0woVH",
    "https://drive.google.com/uc?export=download&id=1ACc1GddqGYPo80E4vStBvqVXA7FcdMlS",
    "https://drive.google.com/uc?export=download&id=1A67KkN-FThrW1O79ZxqioBnvvpaDVgfT",
    "https://drive.google.com/uc?export=download&id=1A8YWpc7a1n-aDGSoQeGNO8gGphtj-HBl",
    "https://drive.google.com/uc?export=download&id=1BKjLsM7owAO97f8R3hlSjTUgKZ2lVn6c",
    "https://drive.google.com/uc?export=download&id=1AQRYq6PPWpiUY7lpLvMy3gXvGOWmSlSs",
    "https://drive.google.com/uc?export=download&id=1BSrpsS5-9UaumBTdY6ixqXJBTP2-PxvM",

    "https://drive.google.com/uc?export=download&id=19PIfqFwxPx93nFAMuo1w8RxvdpVOfq7j",
    "https://drive.google.com/uc?export=download&id=1a7XsNXizFTTlSD_gRQwK4bDA3HPam56W",
    "https://drive.google.com/uc?export=download&id=1aF6H24ILE6wIFGW3M3BGXg8l63ktP8B3",
    "https://drive.google.com/uc?export=download&id=1_ysGMbGZQexheta6tuSBhJQDeAMioXr_",
    "https://drive.google.com/uc?export=download&id=1bTwYfovA2YKCs_kskWyp2GHh7K9XHQN0",
    "https://drive.google.com/uc?export=download&id=1bPdkmq6lKm8BGwxkWaADHe0kutTtEujR",
    "https://drive.google.com/uc?export=download&id=1b_evUu8zmfiPs-CeaZp1DkkArB5zl5x-",
    "https://drive.google.com/uc?export=download&id=1brkBa03NdRCx6lfrjopbWJUCoJupCRYg",
    "https://drive.google.com/uc?export=download&id=1c6SCqToTZamfuiiz5LrckOxDYT9gnJGu",
    "https://drive.google.com/uc?export=download&id=1bv8GL0XDReocf1NfZBMCNoMAsBBwDE1i",

    "https://drive.google.com/uc?export=download&id=1c01XFZFNYRi_harhEbPvf-i25QIo9c0V",
    "https://drive.google.com/uc?export=download&id=1bs5sI8NDRVK_omefR59how1UjZ6TEu91",
    "https://drive.google.com/uc?export=download&id=1bcIoyM9T_wQlaXxar4nVjCXsKHavRmnb",
    "https://drive.google.com/uc?export=download&id=1boVaYpbxIH3RItPY6k0Ld2F98YasHVq9",
    "https://drive.google.com/uc?export=download&id=1c5YXcgK3kOx6bTfVjxNGGMdDYbGmVInC",
    "https://drive.google.com/uc?export=download&id=1c1OHfuq-YBOO-UwO5uybPqO7gOqTwInp",

    "https://drive.google.com/uc?export=download&id=1jsoQ4wuRdN6EP6jOE3C0L6trLZmoPI0L",
    "https://drive.google.com/uc?export=download&id=1jr4YzPNCTOj_lfdOSnauXfTPJkbuqS3f",
    "https://drive.google.com/uc?export=download&id=1tlon-avneE7lQF2rS13GOeiuLWIUEA7J",
    "https://drive.google.com/uc?export=download&id=1tqaCw0vfG2zJDijgsFF2UTlOB-EmI4SZ",
    "https://drive.google.com/uc?export=download&id=1ta1ujBjmcvxSuYVwQ3oEXIJsnPCW2VZO"
  ];

  const cacheDir = path.join(__dirname, "cache");
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

  const link = videoLinks[Math.floor(Math.random() * videoLinks.length)];
  const filePath = path.join(cacheDir, `hot_${Date.now()}.mp4`);

  try {
    api.sendMessage("🔥 Hot video load hocche…", event.threadID);

    // Enhanced headers to bypass Google Drive blocks
    const headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "*/*",
      "Accept-Encoding": "gzip, deflate",
      "Cache-Control": "no-cache",
      "Pragma": "no-cache",
      "Referer": "https://drive.google.com/"
    };

    let downloaded = false;
    let retries = 0;
    const maxRetries = 2;

    while (!downloaded && retries < maxRetries) {
      try {
        const res = await axios({
          url: link,
          method: "GET",
          responseType: "stream",
          headers,
          timeout: 45000,
          maxRedirects: 5
        });

        const writer = fs.createWriteStream(filePath);
        res.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on("finish", resolve);
          writer.on("error", reject);
          res.data.on("error", reject);
        });

        // Verify file was written
        if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
          api.sendMessage(
            {
              body: "পাপির দল 😤 হাত মারবি না কিন্তু 🥵🫵",
              attachment: fs.createReadStream(filePath)
            },
            event.threadID,
            () => {
              try { fs.unlinkSync(filePath); } catch {}
            }
          );
          downloaded = true;
        } else {
          throw new Error("File size is 0 or missing after download");
        }
      } catch (err) {
        retries++;
        console.warn(`HOT CMD RETRY ${retries}/${maxRetries}:`, err.message);
        if (retries >= maxRetries) throw err;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    if (!downloaded) {
      throw new Error("Download failed after all retries");
    }

  } catch (err) {
    console.error("HOT CMD ERROR:", err.message);
    try { fs.unlinkSync(filePath); } catch {}
    api.sendMessage(
      "❌ Hot video load hocche na.\nGoogle Drive শেয়ার লিংক সমস্যা হতে পারে।\nAdmin কে জানান।",
      event.threadID
    );
  }
};
