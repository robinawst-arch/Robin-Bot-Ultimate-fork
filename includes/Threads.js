// ===================================================
// Threads Management System for Robin Bot
// ===================================================


class Threads {
  constructor() {
    this.api = null;
  }

  setAPI(api) {
    this.api = api;
  }

  // Get thread data
  async getData(threadID) {
    try {
      if (!global.data.threads.has(threadID)) {
        const threadInfo = await this.api.getThreadInfo(threadID);
        global.data.threads.set(threadID, {
          threadInfo: threadInfo,
          data: {},
        });
      }
      return global.data.threads.get(threadID);
    } catch (error) {
      console.error("Error getting thread data:", error.message);
      return {
        threadInfo: {
          adminIDs: [],
          participantIDs: [],
        },
        data: {},
      };
    }
  }

  // Set thread data
  setData(threadID, options = {}) {
    try {
      const currentData = global.data.threads.get(threadID) || { data: {} };
      global.data.threads.set(threadID, {
        ...currentData,
        data: { ...currentData.data, ...options },
      });
      return true;
    } catch (error) {
      console.error("Error setting thread data:", error.message);
      return false;
    }
  }

  // Get all thread IDs
  getAll() {
    return Array.from(global.data.threads.keys());
  }

  // Alias for getData (for compatibility with old/obfuscated code)
  async get(threadID) {
    return await this.getData(threadID);
  }
}

module.exports = new Threads();
