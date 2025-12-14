// includes/Users.js
// Simple user helper for Robin x Moyna

const fs = require("fs-extra");
const path = require("path");

const dbPath = path.join(__dirname, "..", "data_users.json");

let api = null;

function loadDB() {
  if (!fs.existsSync(dbPath)) return {};
  try {
    return JSON.parse(fs.readFileSync(dbPath, "utf8"));
  } catch {
    return {};
  }
}

function saveDB(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

let cache = loadDB();

module.exports = {
  setAPI(_api) {
    api = _api;
  },

  async getNameUser(id) {
    if (cache[id] && cache[id].name) return cache[id].name;

    if (!api) return "User";

    try {
      const info = await api.getUserInfo(id);
      const name = info[id]?.name || "User";
      cache[id] = cache[id] || {};
      cache[id].name = name;
      saveDB(cache);
      return name;
    } catch {
      return "User";
    }
  },

  async setNameUser(id, name) {
    cache[id] = cache[id] || {};
    cache[id].name = name;
    saveDB(cache);
  }
};
