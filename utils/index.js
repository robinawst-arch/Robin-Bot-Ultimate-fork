const axios = require("axios");
const crypto = require("crypto");
const os = require("os");
const assets = require("@miraipr0ject/assets");

// ================================
// YOUTUBE SYSTEM (UPDATED)
// ================================

module.exports.getYoutube = async function (query, type, format) {
    const yts = require("youtube-search-api");

    // 🔎 Search video
    if (type === "search") {
        const res = await yts.GetListByKeyword(query, false, 6);
        return res.items;
    }

    // 🎥 Get Video/Audio Download
    if (type === "getLink") {
        try {
            const { data } = await axios.get(
                `https://ythub.vercel.app/yt?url=https://www.youtube.com/watch?v=${query}`
            );

            if (!data || !data.title) return null;

            if (format === "video") {
                return {
                    title: data.title,
                    duration: data.duration,
                    download: {
                        SD: data.video.sd,
                        HD: data.video.hd
                    }
                };
            }

            if (format === "audio") {
                return {
                    title: data.title,
                    duration: data.duration,
                    download: data.audio
                };
            }

        } catch (err) {
            console.log("YouTube Error:", err);
            return null;
        }
    }
};

// ================================
// ERROR SYSTEM
// ================================

module.exports.throwError = function (command, threadID, messageID) {
    const threadSetting = global.data.threadData.get(parseInt(threadID)) || {};
    return global.client.api.sendMessage(
        global.getText(
            "utils",
            "throwError",
            threadSetting.PREFIX || global.config.PREFIX,
            command
        ),
        threadID,
        messageID
    );
};

// ================================
// HTML CLEANER
// ================================

module.exports.cleanAnilistHTML = function (text) {
    return text
        .replace(/<br>/g, "\n")
        .replace(/<\/?(i|em)>/g, "*")
        .replace(/<\/?b>/g, "**")
        .replace(/~!|!~/g, "||")
        .replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", '"')
        .replace("&#039;", "'");
};

// ================================
// DOWNLOAD FILE
// ================================

module.exports.downloadFile = async function (url, path) {
    const { createWriteStream } = require("fs");

    const response = await axios({
        method: "GET",
        url,
        responseType: "stream"
    });

    const writer = createWriteStream(path);

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
    });
};

// ================================
// GET WEB CONTENT
// ================================

module.exports.getContent = async function (url) {
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (err) {
        console.log("GetContent Error:", err);
        return null;
    }
};

// ================================
// RANDOM STRING
// ================================

module.exports.randomString = function (length) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";

    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    return result;
};

// ================================
// ASSETS SYSTEM
// ================================

module.exports.assets = {
    async font(name) {
        if (!assets.font.loaded) await assets.font.load();
        return assets.font.get(name);
    },
    async image(name) {
        if (!assets.image.loaded) await assets.image.load();
        return assets.image.get(name);
    },
    async data(name) {
        if (!assets.data.loaded) await assets.data.load();
        return assets.data.get(name);
    }
};

// ================================
// AES ENCRYPTION
// ================================

module.exports.AES = {
    encrypt(key, iv, data) {
        const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(key), Buffer.from(iv));
        let encrypted = cipher.update(data);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return encrypted.toString("hex");
    },
    decrypt(key, iv, encrypted) {
        const data = Buffer.from(encrypted, "hex");
        const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(key), Buffer.from(iv));
        let decrypted = decipher.update(data);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    },
    makeIv() {
        return crypto.randomBytes(16).toString("hex").slice(0, 16);
    }
};

// ================================
// HOME DIRECTORY DETECTOR
// ================================

module.exports.homeDir = function () {
    return [os.homedir(), os.platform()];
};
