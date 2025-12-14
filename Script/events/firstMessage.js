// =============================================
// FIRST MESSAGE GREETING - Send greeting on first message in new group
// =============================================

const newGroups = new Set(); // Track newly joined groups

module.exports.config = {
  name: "firstMessageGreeting",
  eventType: ["log:subscribe"],
  version: "1.0.0",
  credits: "ROBIN",
  description: "Send greeting on first user message after bot joins",
};

// Track when bot is added to new group
module.exports.run = async function ({ api, event }) {
  const { threadID, logMessageType, logMessageData } = event;

  if (logMessageType !== "log:subscribe") return;

  const botID = api.getCurrentUserID();
  const addedParticipants = logMessageData.addedParticipants || [];

  const botWasAdded = addedParticipants.some(
    (participant) => participant.userFbId === botID
  );

  if (botWasAdded) {
    newGroups.add(threadID);
    console.log(`[FIRST-MSG] Tracking new group ${threadID} for greeting`);
  }
};

// Handle first message in new group
module.exports.handleEvent = async function ({ api, event }) {
  const { threadID, senderID, body } = event;

  // Debug: Log all message events
  if (body) {
    console.log(
      `[FIRST-MSG-DEBUG] Message in ${threadID}, tracked: ${newGroups.has(
        threadID
      )}`
    );
  }

  // Skip if not a new group
  if (!newGroups.has(threadID)) return;

  // Skip if no message body (reactions, etc)
  if (!body) return;

  // Skip if bot sent the message
  const botID = api.getCurrentUserID();
  if (senderID === botID) return;

  // This is first user message! Send greeting
  try {
    console.log(`[FIRST-MSG] Attempting to send greeting in ${threadID}`);

    const message = `✨ হ্যালো! আমি ময়না🕊️\n\n💙 আমাকে এই গ্রুপে যোগ করার জন্য ধন্যবাদ!\n\n📌 কমান্ড দেখতে /help টাইপ করুন`;

    await api.sendMessage(message, threadID);
    console.log(`[FIRST-MSG] ✅ Greeting sent in group ${threadID}`);

    // Remove from tracking
    newGroups.delete(threadID);
  } catch (error) {
    console.error(
      `[FIRST-MSG] Failed to send greeting:`,
      error.message || error
    );
    // Don't remove from tracking so it can try again
  }
};
