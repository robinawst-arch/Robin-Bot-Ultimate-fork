"use strict";

module.exports.config = {
  name: "idea",
  version: "2.0.0",
  hasPermssion: 2,
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

module.exports.run = async function ({ api, args, Users, event }) {
  try {
    const threadID = event.threadID;
    const body = typeof event.body === "string" ? event.body : "";

    // 1) Robustly get mention UID + name
    const mentionInfo = await getTargetMention(api, event, body);
    if (!mentionInfo || !mentionInfo.id) {
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
};

// ------------------------ HELPERS ------------------------

async function getTargetMention(api, event, body) {
  // A) Classic: event.mentions = { uid: "Name" }
  if (event?.mentions && typeof event.mentions === "object") {
    const ids = Object.keys(event.mentions);
    if (ids.length) {
      const id = ids[0];
      const name = event.mentions[id];
      return { id, name };
    }
  }

  // B) Some forks: event.logMessageData.mentions
  const lmd = event?.logMessageData;
  if (lmd?.mentions && typeof lmd.mentions === "object") {
    const ids = Object.keys(lmd.mentions);
    if (ids.length) {
      const id = ids[0];
      const name = lmd.mentions[id];
      return { id, name };
    }
  }

  // C) Fallback: parse "@Name" from text and resolve in current thread
  const atName = extractAtName(body);
  if (!atName) return null;

  const resolved = await resolveUserByNameFromThread(api, event.threadID, atName);
  if (resolved?.id) return resolved;

  return null;
}

function extractAtName(body) {
  if (!body || typeof body !== "string") return null;
  const idx = body.indexOf("@");
  if (idx === -1) return null;

  // Get substring after @
  const sub = body.slice(idx + 1).trim();
  if (!sub) return null;

  // Stop at double-space / newline / end
  const m = sub.match(/(.+?)(\s{2,}|\n|$)/);
  const name = (m?.[1] || "").trim();
  return name.length ? name : null;
}

async function resolveUserByNameFromThread(api, threadID, nameQuery) {
  try {
    const tinfo = await api.getThreadInfo(threadID);
    const ids = tinfo?.participantIDs || [];
    if (!ids.length) return null;

    const info = await api.getUserInfo(ids);
    const q = String(nameQuery).toLowerCase();

    // exact match first
    for (const uid of ids) {
      const nm = info?.[uid]?.name;
      if (nm && nm.toLowerCase() === q) return { id: uid, name: nm };
    }

    // contains match
    for (const uid of ids) {
      const nm = info?.[uid]?.name;
      if (nm && nm.toLowerCase().includes(q)) return { id: uid, name: nm };
    }

    return null;
  } catch {
    return null;
  }
}
