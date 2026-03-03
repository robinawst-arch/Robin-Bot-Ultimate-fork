const axios = require("axios");

// WMO Weather Code to Bengali description
const weatherCodes = {
  0: "맑음 পরিষ্কার আকাশ ☀️",
  1: "প্রায় পরিষ্কার ☀️",
  2: "আংশিক মেঘলা ⛅",
  3: "মেঘাচ্ছন্ন ☁️",
  45: "কুয়াশা 🌫️",
  48: "ঘন কুয়াশা 🌫️",
  51: "হালকা গুঁড়ি বৃষ্টি 🌦️",
  53: "মাঝারি গুঁড়ি বৃষ্টি 🌦️",
  55: "ঘন গুঁড়ি বৃষ্টি 🌧️",
  61: "হালকা বৃষ্টি 🌧️",
  63: "মাঝারি বৃষ্টি 🌧️",
  65: "ভারী বৃষ্টি 🌧️",
  71: "হালকা তুষারপাত ❄️",
  73: "মাঝারি তুষারপাত ❄️",
  75: "ভারী তুষারপাত ❄️",
  80: "হালকা বৃষ্টির ঝাপটা 🌦️",
  81: "মাঝারি বৃষ্টির ঝাপটা 🌧️",
  82: "ভারী বৃষ্টির ঝাপটা ⛈️",
  95: "বজ্রঝড় ⛈️",
  96: "শিলাবৃষ্টি সহ ঝড় ⛈️",
  99: "তীব্র শিলাবৃষ্টি ⛈️",
};

module.exports.config = {
  name: "weather",
  version: "2.0.0",
  aliases: ["আবহাওয়া", "brishti"],
  hasPermssion: 0,
  countDown: 5,
  commandCategory: "তথ্য",
  description: "যেকোনো শহরের আবহাওয়া দেখুন",
  usages: "{pn} ঢাকা",
};

module.exports.run = async ({ api, args, event }) => {
  const city = args.join(" ");
  if (!city)
    return api.sendMessage(
      "❌ একটি শহরের নাম লিখুন।\nউদাহরণ: weather Dhaka",
      event.threadID,
      event.messageID,
    );

  try {
    api.sendMessage(
      "🔍 আবহাওয়া তথ্য খোঁজা হচ্ছে...",
      event.threadID,
      event.messageID,
    );

    // Step 1: Geocode city name → lat/lon
    const geoRes = await axios.get(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en`,
      { timeout: 10000 },
    );

    if (!geoRes.data.results || geoRes.data.results.length === 0) {
      return api.sendMessage(
        "❌ শহরটি খুঁজে পাওয়া যায়নি।\nইংরেজিতে লিখে চেষ্টা করুন। যেমন: weather Dhaka",
        event.threadID,
        event.messageID,
      );
    }

    const place = geoRes.data.results[0];
    const { latitude, longitude, name, country } = place;

    // Step 2: Get weather from Open-Meteo (free, no API key needed)
    const wxRes = await axios.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=relativehumidity_2m,apparent_temperature,windspeed_10m,visibility&timezone=auto&forecast_days=1`,
      { timeout: 10000 },
    );

    const cw = wxRes.data.current_weather;
    const hourly = wxRes.data.hourly;
    const currentHour = new Date(cw.time).getHours();

    const humidity = hourly.relativehumidity_2m[currentHour] ?? "N/A";
    const feelsLike = hourly.apparent_temperature[currentHour] ?? "N/A";
    const windSpeed = hourly.windspeed_10m[currentHour] ?? cw.windspeed;
    const visibility = hourly.visibility
      ? Math.round((hourly.visibility[currentHour] ?? 0) / 1000)
      : "N/A";

    const desc = weatherCodes[cw.weathercode] || `কোড ${cw.weathercode}`;
    const dayNight = cw.is_day ? "☀️ দিন" : "🌙 রাত";

    const msg =
      `🌍 আবহাওয়া রিপোর্ট\n` +
      `📍 স্থান: ${name}, ${country}\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `🌤️ অবস্থা: ${desc}\n` +
      `🌡️ তাপমাত্রা: ${cw.temperature}°C\n` +
      `🤔 অনুভূতি: ${feelsLike}°C\n` +
      `💧 আর্দ্রতা: ${humidity}%\n` +
      `💨 বাতাসের গতি: ${windSpeed} কি.মি./ঘন্টা\n` +
      `👁️ দৃশ্যমানতা: ${visibility} কি.মি.\n` +
      `🕐 সময়কাল: ${dayNight}\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `🤖 Robin Bot`;

    api.sendMessage(msg, event.threadID, event.messageID);
  } catch (e) {
    console.error("Weather error:", e.message);
    api.sendMessage(
      "❌ আবহাওয়া তথ্য পাওয়া যায়নি। আবার চেষ্টা করুন।",
      event.threadID,
      event.messageID,
    );
  }
};
