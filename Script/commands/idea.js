"use strict";

module.exports.config = {
  name: "idea",
  version: "2.0.0",
  hasPermssion: 0,
  credits: "Robin-Bot (patched by Moyna)",
  description:
    "বন্ধুকে ধারাবাহিকভাবে উপদেশ/আইডিয়া পাঠায়। (Robust mention support)",
  commandCategory: "utility",
  usages: " /idea @mention",
  cooldowns: 10,
  dependencies: {
    "fs-extra": "",
    axios: "",
  },
};

const mentionResolver = require("../../includes/mentionResolver");

module.exports.run = async function ({ api, args, Users, event }) {
  try {
    const threadID = event.threadID;
    const body = typeof event.body === "string" ? event.body : "";

    // 1) Robustly get mention UID + name (shared resolver)
    const mentionInfo = await mentionResolver.getTargetMention(api, event, body);

    if (!mentionInfo || !mentionInfo.id) {
      // If the user already typed some @name, help them resolve
      const atName = mentionResolver.extractAtName(body);
      if (atName) {
        // fetch thread participants for guidance
        try {
          const tinfo = await api.getThreadInfo(threadID);
          const ids = tinfo.participantIDs || [];
          const info = await api.getUserInfo(ids);
          let list = "";
          ids.forEach((uid) => {
            const nm = info?.[uid]?.name || "<hidden>";
            list += `• ${nm} → ${uid}\n`;
          });
          return api.sendMessage(
            `❌ Can't resolve '@${atName}'.\n` +
              "Name might be hidden by privacy.\n" +
              "You can either reply to the person's message, mention them in chat so the bot sees it, or use their UID directly.\n" +
              "Here are thread participants you can try:\n" +
              list,
            threadID,
          );
        } catch {} // fall through
      }

      return api.sendMessage(
        "আপনি কাকে জ্ঞান দিতে চান এমন 1 জনকে অবশ্যই @ম্যানশন করতে হবে 🙂\n\nউদাহরণ:\n/idea @Robin Ali",
        threadID
      );
    }

    const mention = mentionInfo.id;
    const name = mentionInfo.name || "User";

    const arraytag = [{ id: mention, tag: name }];
    const send = (payload) => api.sendMessage(payload, threadID);

    // Intro (instant)
    send(
      "তোমাকে কিছু উপদেশ দেওয়া হবে। মেনে চললে জীবনে অনেক উন্নতি করতে পারবে।🙂"
    );

    // 2) Messages list (clean)
    const messages = [
      "বিপদ-আপদের সময় দুনিয়ার সকল দরজা বন্ধ হয়ে গেলেও আল্লাহ তায়ালার দরজার সবসময় খুলা থাকে। 🥰🥰",
      "তার জন্য কাঁদ যে তোমার চোখের জল দেখে সেও কেঁদে ফেলে, কিন্তু এমন কারো জন্য কেদোনা যে তোমার চোখের জল দেখে উপহাস করে। 🐰",
      "সবচেয়ে কঠিন কাজ হচ্ছে নিজেকে চেনা এবং সবচেয়ে সহজ কাজ হচ্ছে অন্যদেরকে উপদেশ দেয়া। 💔!",
      "টেনশন দূর করতে নেশা নয়—ভালো অভ্যাস/ইবাদত/রুটিন ধরে রাখা কাজে দেয়। 🙂",
      "যা তুমি জান, তার তুলনায় কম কথা বলা উচিত।🤟",
      "বন্ধুত্ব হোক কিংবা ভালোবাসা—টিকিয়ে রাখার দায়িত্ব দু'জনেরই। 🤝",
      "যদি স্বপ্ন দেখতে পারো, তবে তা বাস্তবায়নও করতে পারবে।✨",
      "যে তোমাকে আজ অবহেলা করছে—ধৈর্য ধরো, একদিন তোমার মূল্য বুঝবে।",
      "~ অন্যকে গালি দেওয়া থেকে বিরত থাকুন♥️",
      "আল্লাহর দেখানো পথে চলুন 🥰",
      "~ বড়দেরকে সম্মান করতে শিখুন😍",
    ];

    // 3) Schedule sending (stable)
    // Each message goes every 3 seconds (customize if you want)
    let delay = 3000;

    for (const text of messages) {
      setTimeout(() => {
        send({
          body: `${text} ${name}`,
          mentions: arraytag,
        });
      }, delay);

      delay += 3000;
    }
  } catch (e) {
    try {
      api.sendMessage(
        `⚠️ idea কমান্ডে সমস্যা: ${e?.message || e}`,
        event.threadID
      );
    } catch {}
  }
}


