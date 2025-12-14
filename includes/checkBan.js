//==================================================
// Robin Bot – Check Ban System (For user & thread)
//==================================================

module.exports = async function ({ api, event }) {
    const { senderID, threadID } = event;

    try {
        // Load ban data
        const userBanned = global.data.userBanned.get(senderID) || {};
        const threadBanned = global.data.threadBanned.get(threadID) || {};

        // --- CHECK USER BAN ---
        if (userBanned.reason) {
            api.sendMessage(
                `⚠️ আপনার আইডি বট ব্যবহার থেকে নিষিদ্ধ!\n\n` +
                `📝 কারণ: ${userBanned.reason}\n` +
                `⏱ সময়: ${userBanned.date}\n` +
                `📌 আনব্যান করতে বট এডমিনের সাথে যোগাযোগ করুন।`,
                threadID
            );
            return true; // user banned
        }

        // --- CHECK THREAD BAN ---
        if (threadBanned.reason) {
            api.sendMessage(
                `⚠️ এই গ্রুপটি বট ব্যবহার থেকে নিষিদ্ধ!\n\n` +
                `📝 কারণ: ${threadBanned.reason}\n` +
                `⏱ সময়: ${threadBanned.date}\n` +
                `📌 আনব্যান করতে বট এডমিনের সাথে যোগাযোগ করুন।`,
                threadID
            );
            return true; // thread banned
        }

        return false;

    } catch (e) {
        console.log("❌ checkBan.js Error:", e);
        return false;
    }
};
