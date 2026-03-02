// Shared mention resolver used across commands
// Exports: getMentionIdsRobust(api, event), getMentionPairs(event), getTargetMention(api, event, body)

async function getMentionIdsRobust(api, event) {
  // A) classic mentions object
  if (event?.mentions && typeof event.mentions === "object") {
    const ids = Object.keys(event.mentions);
    if (ids.length) return ids;
  }

  // B) forks: logMessageData.mentions or messageMetadata.mentions
  const lmd = event?.logMessageData;
  if (lmd?.mentions && typeof lmd.mentions === "object") {
    const ids = Object.keys(lmd.mentions);
    if (ids.length) return ids;
  }
  if (lmd?.messageMetadata?.mentions && typeof lmd.messageMetadata.mentions === "object") {
    const ids = Object.keys(lmd.messageMetadata.mentions);
    if (ids.length) return ids;
  }

  // C) reply to message -> extract replied sender
  if (event?.type === "message_reply" && event.messageReply?.senderID) {
    return [event.messageReply.senderID];
  }

  // D) fallback: parse "@Name" and resolve uid from thread
  const body = typeof event?.body === "string" ? event.body : "";
  const atName = extractAtName(body);
  if (!atName) return [];

  const uid = await resolveUserByNameFromThread(api, event.threadID, atName);
  return uid ? [uid] : [];
}

function getMentionPairs(event) {
  const out = [];
  if (event?.mentions && typeof event.mentions === "object") {
    for (const uid of Object.keys(event.mentions)) {
      const v = event.mentions[uid];
      const name = typeof v === "string" ? v : (v?.tag || v?.name || "@User");
      out.push({ id: uid, name });
    }
    if (out.length) return out;
  }
  const lmd = event?.logMessageData;
  if (lmd?.mentions && typeof lmd.mentions === "object") {
    for (const uid of Object.keys(lmd.mentions)) {
      const v = lmd.mentions[uid];
      const name = typeof v === "string" ? v : (v?.tag || v?.name || "@User");
      out.push({ id: uid, name });
    }
  }
  return out;
}

async function getTargetMention(api, event, body) {
  // prefer pairs
  const pairs = getMentionPairs(event);
  if (pairs.length) return pairs[0];

  // reply
  if (event?.type === "message_reply" && event.messageReply?.senderID) {
    const name = event.messageReply?.senderName || "User";
    return { id: event.messageReply.senderID, name };
  }

  // fallback by text
  const atName = extractAtName(body || (typeof event?.body === "string" ? event.body : ""));
  if (!atName) return null;

  const resolved = await resolveUserByNameFromThread(api, event.threadID, atName);
  if (resolved) return { id: resolved, name: "@" + atName };

  // if not resolved, log details to help debugging
  console.warn("[mentionResolver] failed to resolve mention", {
    atName,
    body: body || event?.body,
    mentions: event?.mentions,
    logMessageData: event?.logMessageData,
    metadata: event?.messageMetadata,
    threadID: event.threadID,
  });

  return null;
}

function extractAtName(body) {
  if (!body) return null;
  const idx = body.indexOf("@");
  if (idx === -1) return null;
  const sub = body.slice(idx + 1).trim();
  if (!sub) return null;
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
    const qRaw = String(nameQuery || "").toLowerCase();
    const normalize = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
    const q = normalize(qRaw);

    // exact normalized match
    for (const uid of ids) {
      const nm = info?.[uid]?.name;
      if (nm && normalize(nm) === q) return uid;
    }

    // contains q in normalized name
    for (const uid of ids) {
      const nm = info?.[uid]?.name;
      if (nm && normalize(nm).includes(q)) return uid;
    }

    // token-based fuzzy: try each word separately
    const tokens = qRaw.split(/\s+/).map(normalize).filter(Boolean);
    if (tokens.length) {
      for (const uid of ids) {
        const nmNorm = normalize(info?.[uid]?.name);
        for (const tk of tokens) {
          if (tk && nmNorm.includes(tk)) return uid;
        }
      }
    }

    // if we reach here, no match; log all participant names for debugging
    console.warn("[mentionResolver] participant list when resolution failed for", qRaw, "normalized", q);
    ids.forEach((uid) => {
      const nm = info?.[uid]?.name || "";
      console.warn("   ", uid, "->", nm, "norm=", normalize(nm));
    });

    return null;
  } catch {
    return null;
  }
}

module.exports = {
  getMentionIdsRobust,
  getMentionPairs,
  getTargetMention,
  extractAtName,
  resolveUserByNameFromThread,
};
