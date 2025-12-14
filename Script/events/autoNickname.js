// =============================================
// AUTO NICKNAME - Set bot nickname on group join
// =============================================

module.exports.config = {
  name: "autoNickname",
  eventType: ["log:subscribe"],
  version: "1.0.0",
  credits: "ROBIN",
  description: "Automatically sets bot nickname when added to new group",
};

module.exports.run = async function ({ api, event }) {
  const { threadID, logMessageType, logMessageData } = event;

  // Check if this is a subscribe event (someone added to group)
  if (logMessageType !== "log:subscribe") return;

  // Check if bot was added
  const botID = api.getCurrentUserID();
  const addedParticipants = logMessageData.addedParticipants || [];

  const botWasAdded = addedParticipants.some(
    (participant) => participant.userFbId === botID
  );

  if (!botWasAdded) return;

  // Bot was added to the group! Set nickname only
  try {
    const nickname = "ময়না🕊️"; // You can customize this

    console.log(`[AUTO-NICKNAME] Bot added to group ${threadID}`);

    // Wait before changing nickname
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Change nickname
    try {
      await api.changeNickname(nickname, threadID, botID);
      console.log(`[AUTO-NICKNAME] ✅ Nickname changed to ${nickname}`);
    } catch (nickErr) {
      console.error(
        `[AUTO-NICKNAME] ❌ Nickname change failed:`,
        nickErr.message
      );
    }

    // Note: Facebook blocks messages in new groups (error 1545012)
    // Greeting will be sent when someone sends first message
    console.log(
      `[AUTO-NICKNAME] ℹ️ Greeting message will be sent on first user message`
    );
  } catch (error) {
    console.error("[AUTO-NICKNAME] Error:", error.message || error);
  }
};
