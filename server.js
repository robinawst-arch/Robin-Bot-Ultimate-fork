// =====================================
// ROBIN x MOYNA BOT – SERVER KEEP ALIVE
// Works on Render / Railway / Cyclic / VPS
// Credit: ROBIN ❤️
// =====================================

const express = require("express");
const path = require("path");

// Start Express App
const app = express();

// Main Route
app.get("/", (req, res) => {
    res.send("💙 Robin x Moyna Bot is Running Successfully!");
});

// Optional: Health Check Route
app.get("/health", (req, res) => {
    res.json({ status: "ok", bot: "active" });
});

// Static public folder (optional)
app.use(express.static(path.join(__dirname, "public")));

// Port Listener
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🌍 Server Running on PORT: ${PORT}`);
});
