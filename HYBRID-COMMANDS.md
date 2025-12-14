# 🤖 Robin-Bot Hybrid Command System

## ✨ Features

এই bot এখন **দুটো format-ই** support করে:

- ✅ **Mirai Format** (Traditional)
- ✅ **GoatBot Format** (Modern)

---

## 📝 Command Formats

### 🔥 Mirai Format

```javascript
module.exports.config = {
  name: "commandname",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Author",
  description: "Command description",
  commandCategory: "category",
  usages: "how to use",
  cooldowns: 5,
};

module.exports.run = async function ({ api, event, args }) {
  // Your command code
  return api.sendMessage("Hello!", event.threadID);
};

module.exports.handleEvent = async function ({ api, event }) {
  // Auto-trigger without prefix
};

module.exports.handleReply = async function ({ api, event, reply }) {
  // Handle user reply
};
```

---

### 🐐 GoatBot Format

```javascript
module.exports = {
  config: {
    name: "commandname",
    version: "1.0.0",
    author: "Author",
    countDown: 5,
    role: 0,
    description: "Command description",
    category: "category",
    guide: "{pn} [args]",
  },

  langs: {
    en: {
      hello: "Hello World!",
    },
  },

  onStart: async function ({ api, event, args, message, getLang }) {
    // Your command code
    await message.react("✅");
    return message.reply("Hello!");
  },

  onChat: async function ({ api, event, message }) {
    // Auto-trigger without prefix
  },

  onReply: async function ({ api, event, reply, message }) {
    // Handle user reply
  },
};
```

---

## 🎯 Key Differences

| Feature       | Mirai Format               | GoatBot Format    |
| ------------- | -------------------------- | ----------------- |
| Entry Point   | `run`                      | `onStart`         |
| Auto Event    | `handleEvent`              | `onChat`          |
| Reply Handler | `handleReply`              | `onReply`         |
| Message API   | `api.sendMessage()`        | `message.reply()` |
| Reaction      | `api.setMessageReaction()` | `message.react()` |
| Language      | `getText()`                | `getLang()`       |

---

## 🚀 Message API (GoatBot)

```javascript
// Send message
message.send("text", threadID, callback);

// Reply to message
message.reply("text", callback);

// React to message
message.react("😊");
```

---

## 📦 Testing

দুটো test command আছে:

- `.testmirai` - Mirai format test
- `.testgoat` - GoatBot format test

Chat এ লিখো:

- "mirai test" - Mirai auto-reply
- "goat test" - GoatBot auto-reply

---

## ⚡ Bot Restart

```bash
npm start
```

---

## 📊 Command Loading

Bot start হলে দেখবে:

```
[ COMMAND ] [Mirai] Loaded: testmirai
[ COMMAND ] [GoatBot] Loaded: testgoat
```

---

## 🎨 Example Commands

### Mirai Example

[test-mirai.js](Script/commands/test-mirai.js)

### GoatBot Example

[test-goat.js](Script/commands/test-goat.js)

---

**Created by Robin-Bot 🤖**
