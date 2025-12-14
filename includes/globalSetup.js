// =============================================
// GLOBAL SETUP - Global Objects & Node Modules
// =============================================

const fs = require("fs");
const path = require("path");

module.exports = function setupGlobals(config, configPath, mainPath) {
  // Ensure global.config is present
  if (!global.config) {
    global.config = config;
  }

  // Helper to get config keys with defaults
  global.getConfig = (key, defaultValue) => {
    try {
      if (!global.config) return defaultValue;
      const val = global.config[key];
      return typeof val === "undefined" ? defaultValue : val;
    } catch (e) {
      return defaultValue;
    }
  };

  // ---------- GLOBAL STORES ----------
  global.client = {
    commands: new Map(),
    events: new Map(),
    eventRegistered: [],
    handleReply: new Map(),
    config,
    configPath: configPath,
    mainPath: mainPath,
  };

  // GoatBot compatibility
  global.GoatBot = {
    onReply: global.client.handleReply, // Use same Map reference
  };

  global.data = {
    users: new Map(),
    threads: new Map(),
    threadData: new Map(),
    allThreadID: [],
    allUserID: [],
  };

  // Module data for commands
  global.moduleData = {};

  // Node modules for commands
  const axios = require("axios");
  const stream = require("stream");

  global.nodemodule = {
    "fs-extra": require("fs-extra"),
    "moment-timezone": require("moment-timezone"),
    child_process: require("child_process"),
    path: require("path"),
    chalk: require("chalk"),
    axios: axios,

    // Request wrapper using axios (for backward compatibility)
    request: function (url, options = {}) {
      const requestStream = new stream.PassThrough();

      axios
        .get(url, {
          responseType: "stream",
          ...options,
        })
        .then((response) => {
          response.data.pipe(requestStream);
        })
        .catch((error) => {
          requestStream.emit("error", error);
        });

      return requestStream;
    },
  };
};
