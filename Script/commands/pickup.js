module.exports.config = {
  name: "pickup",
  version: "7.1.0",
  credits: "Robin-Bot",
  description: "Mega pickup lines (8 categories × 30 each = 240+)",
  commandCategory: "fun",
  cooldowns: 3,
};

module.exports.run = async function ({ api, event, args }) {
  const type = (args[0] || "").toLowerCase();

  // ——————————————————————
  // ❤️ LOVE (30)
  // ——————————————————————
  const love = [
    "তুমি কি সূর্য? তুমি ছাড়া আমার সকালই হয় না ☀💛",
    "তুমি কি চাঁদ? তোমাকে ছাড়া রাত অসম্পূর্ণ 🌙✨",
    "তোমার চোখে তাকালেই সময় থেমে যায় 😳💘",
    "তুমি কি heartbeat? তোমাকে ছাড়া বাঁচা কঠিন 💓",
    "তুমি কি আলো? তুমি ছাড়া সব অন্ধকার 💡💛",
    "তুমি কি dream? প্রতিরাতে তোমাকেই দেখি 😴💖",
    "তুমি কি perfume? স্মৃতি হয়ে লেগে থাকো 💐",
    "তুমি কি rainbow? তোমার মাঝে সব রঙ 💛🌈",
    "তুমি কি book? তোমাকে পড়েই ক্লান্ত হই না 📚💘",
    "তুমি কি melody? ভাবলেই সুর বাজে 🎶💗",
    "তোমার হাসিটাই আমার শান্তি 💛🙂",
    "তুমি কি butterfly? মন দোলে তোমাকে দেখে 🦋💛",
    "তুমি কি magic? তোমায় দেখলেই সব বদলে যায় ✨",
    "তোমার নামটাই আমার প্রিয় শব্দ 💕",
    "তুমি কি sunrise? তোমাকে ছাড়া morning হয় না ☀💛",
    "তুমি কি home? তোমার কাছে safe লাগে 🏡💗",
    "তুমি কি candlelight? romantic vibe ✨💛",
    "তুমি কি poetry? তোমাকে পড়লেই ভালো লাগে ✍💖",
    "তুমি কি chocolate? resist করা যায় না 🍫💘",
    "তুমি কি anchor? তোমাকে ছাড়া আমি ভেসে যাই ⚓💛",
    "তুমি কি galaxy? তোমার মাঝে হারিয়ে যাই 🌌💘",
    "তুমি কি sunshine? আমার mood brighten করো ☀💛",
    "তুমি কি paradise? তোমাকে ভাবলেই শান্তি 😌💛",
    "তুমি কি soft breeze? তোমার vibe calm করে 🌬💛",
    "তুমি কি comfort zone? তোমার কাছে best লাগে 💛🙂",
    "তুমি কি warm blanket? তোমার presence cozy 🧡",
    "তুমি কি secret wish? তোমাকেই চাই সবসময় 💫💛",
    "তুমি কি lucky charm? তোমাকে দেখলেই ভালো লাগে 🍀💛",
    "তুমি কি favourite song? বারবার repeat করি 🎧💛",
    "তুমি কি heartbeat pause? তাকালেই থেমে যায় 💓😳",
  ];

  // ——————————————————————
  // 💔 SAD (30)
  // ——————————————————————
  const sad = [
    "তুমি কি বৃষ্টি? মনে পড়লেই ভিজে যাই 🌧💔",
    "তুমি কি স্মৃতি? ভুলতে চাই, পারি না 😞",
    "তুমি কি ছায়া? কাছে থেকেও ধরতে পারি না 💔",
    "তোমার 'আছি' শব্দটা মিস করি 🥺",
    "তুমি কি নদী? ধীরে ধীরে দূরে যাচ্ছো 🌊💔",
    "তুমি কি lost chapter? শেষটা অসম্পূর্ণ 📖💔",
    "তুমি কি বাতাস? অনুভব করি, দেখতে পাই না 🌬😔",
    "তুমি কি cold night? empty লাগে 😞❄️",
    "তুমি কি old photo? হাসি আছে, তুমি নেই 📸💔",
    "তুমি কি rain drop? আসো–যাও… দাগ রেখে যাও 💧😞",
    "তুমি কি fading star? হারিয়ে যাচ্ছো ⭐💔",
    "তুমি কি broken promise? শুধু ব্যথা রাখো 😔💔",
    "তুমি কি goodbye? শুনলেই কষ্ট লাগে 💔",
    "তুমি কি time? যত যায়, তত hurt 😞",
    "তুমি কি train? আমি wait করছি… তুমি আসো না 🚉💔",
    "তুমি কি unsent message? বলতে চেয়েছি, বলিনি 😢",
    "তুমি কি cold coffee? আগের warmth নেই 😞",
    "তুমি কি missed call? ধরলেই না ☎️😔",
    "তুমি কি unfinished story? শেষ করতে পারিনি 💔",
    "তুমি কি shadow? থাকো, কিন্তু পাশে না 🌑😔",
    "তুমি কি broken glass? ছুঁলেই ব্যথা লাগে 💔",
    "তুমি কি silent tear? কাউকে না বলে ঝরে পড়ো 💧😞",
    "তুমি কি empty street? নির্জন আর lonely 💔",
    "তুমি কি fading song? শেষ পর্যন্ত শুনতে কষ্ট হয় 🎶💔",
    "তুমি কি last hope? হারালে সব শেষ 😞💛",
    "তুমি কি blur memory? ধরতে চাই, পারি না 💔",
    "তুমি কি cold wind? কাঁপিয়ে দাও 🌬💔",
    "তুমি কি late reply? অপেক্ষা বাড়াও 😔💬",
    "তুমি কি broken heart? সারাতে কঠিন 💔",
    "তুমি কি lost smile? তোমাকে খুঁজে পাই না 🥺",
  ];

  // ——————————————————————
  // 😂 FUNNY (30)
  // ——————————————————————
  const funny = [
    "তুমি কি WiFi? মাঝে মাঝে connect হও 😭📶",
    "তুমি কি mosquito? drama করে bite দাও 😆🦟",
    "তুমি কি calculator? মাথা খারাপ করাও 😂",
    "তুমি কি ghost? হুট করে উধাও হও 👻🤣",
    "তুমি কি broken charger? কখনো কাজ করো, কখনো না 😭",
    "তুমি কি slipper? কাছে এলেই strike দাও 😆",
    "তুমি কি TikTok filter? বাস্তবে কাজ নেই 😂",
    "তুমি কি fan? শুধু ঘুরো 😂🌀",
    "তুমি কি 404 error? বুঝতেই পারি না 😭",
    "তুমি কি potato? সবখানে fit 🤣",
    "তুমি কি exam? ভাবলেই tension 😂",
    "তুমি কি traffic jam? মাথা গরম করাও 🤣",
    "তুমি কি alarm? ignore করতে ইচ্ছে করে 😂",
    "তুমি কি battery low? সবসময় ৫% 😭🔋",
    "তুমি কি youtube ad? skip করতে চাই 😂",
    "তুমি কি banana peel? তোমাতে পা পিছলে যায় 🤣",
    "তুমি কি USB cable? একবারে connect হও না 😭",
    "তুমি কি washing machine? ঘুরো nonstop 😆",
    "তুমি কি angry bird? cause ছাড়া চিৎকার 😆🐦",
    "তুমি কি fridge? সবসময় cool 😂❄️",
    "তুমি কি broken earphone? এক পাশ কাজ করে 😭",
    "তুমি কি pen? সবসময় হারিয়ে যাও 😂",
    "তুমি কি noodle? twisty personality 🤣",
    "তুমি কি cat? ২ সেকেন্ড পর mood change 😹",
    "তুমি কি traffic signal? সবসময় লাল 😂",
    "তুমি কি google maps? wrong পথ দেখাও 🤣",
    "তুমি কি radio? unnecessary noise 😂📻",
    "তুমি কি slippers? সবাই তোমায় পিটায় 😭🤣",
    "তুমি কি mango pickle? টক আর ঝাল 🤣",
    "তুমি কি math? বুঝতে পারি না 😭📘",
  ];

  // ——————————————————————
  // 🔥 FLIRTY (30)
  // ——————————————————————
  const flirty = [
    "তুমি কি magnet? চোখ সরানো যায় না 😏🧲",
    "তুমি কি lip balm? তোমাকে ছাড়া ঠোঁট শুকায় 😘🔥",
    "তুমি কি chocolate? taste নিতে ইচ্ছে করে 😳🍫",
    "তুমি কি whisper? softly কানে লাগো 😉💗",
    "তুমি কি rose? touch করলে dangerous 😳🌹",
    "তুমি কি fantasy? ভাবতেই blush করি 😳💘",
    "তুমি কি slow dance? তোমার সাথে vibe perfect 😏🎶",
    "তুমি কি soft hair? ছুঁতে ইচ্ছে করে 😳💗",
    "তুমি কি temptation? resist করা impossible 😏🔥",
    "তুমি কি warm hug? ছাড়তে ইচ্ছে করে না 😳💛",
    "তুমি কি deep eye contact? তাকালেই হারিয়ে যাই 😳🔥",
    "তুমি কি soft cheeks? ছুঁতে ইচ্ছে করে 😉😘",
    "তুমি কি silky touch? মনে পড়লেই shiver 😉💘",
    "তুমি কি blush maker? তোমাকে দেখলেই লাল হই 😳💗",
    "তুমি কি heartbeat rush? presence এ vibe বাড়ে 😏💓",
    "তুমি কি candlelight? dim mood romantic করো 😉✨",
    "তুমি কি soft laugh? addictive 😏💛",
    "তুমি কি kiss signal? তোমাকে দেখলেই মনে হয়… 😳💋",
    "তুমি কি warm whisper? neck–এ লাগলে dangerous 😏🔥",
    "তুমি কি naughty smile? control করা কঠিন 😉🔥",
    "তুমি কি electric spark? তোমাকে দেখলেই current লাগে ⚡😳",
    "তুমি কি cozy blanket? ভিতরে ঢুকতে ইচ্ছে করে 😉🧡",
    "তুমি কি romantic night? vibe perfect 😏🌙",
    "তুমি কি soft waist? কাছে টানতে ইচ্ছে করে 😳🔥",
    "তুমি কি forbidden desire? ভাবলেই গরম লাগে 😳🔥",
    "তুমি কি warm lips? মনে পড়লেই heart melt 😳💋",
    "তুমি কি body heat? vibe fire 😉🔥",
    "তুমি কি perfect angle? তোমাকে দেখলেই zoom করি 😏📸",
    "তুমি কি mood lifter? তোমার presence spicy 😉🔥",
    "তুমি কি last bite chocolate? সবচেয়ে tempting 😳🍫",
  ];

  // ——————————————————————
  // 🩷 CUTE (30)
  // ——————————————————————
  const cute = [
    "তুমি কি teddy bear? জড়িয়ে ধরতে মন চায় 🧸💗",
    "তুমি কি ice cream? দেখলেই melt হয়ে যাই 🍦🥺",
    "তুমি কি kitten? তোমাকে দেখলেই soft লাগে 😺💗",
    "তুমি কি baby smile? instantly heart melt 😊💛",
    "তুমি কি rainbow candy? sweet + colorful 🍬🌈",
    "তুমি কি tiny cloud? নরম নরম vibe ☁️💕",
    "তুমি কি bunny? jumpy but cute 🐰💗",
    "তুমি কি warm socks? cozy লাগে 🧦💛",
    "তুমি কি soft pillow? মাথা রাখতে ইচ্ছে করে 🛏️💗",
    "তুমি কি cupcake? small but sweet 🧁💛",
    "তুমি কি tiny star? ছোট হলেও brightest ✨🌟",
    "তুমি কি baby panda? adorable 🐼💗",
    "তুমি কি pink blush? তোমাকে ভাবলেই গাল লাল হয় 😊💗",
    "তুমি কি soft wind? ঠাণ্ডা লাগে, ভালো লাগে 🌬💛",
    "তুমি কি cute trouble? রাগ হয় না 😹💗",
    "তুমি কি puppy eyes? না বলতে পারি না 🐶💖",
    "তুমি কি soft blanket? জড়িয়ে থাকতে মন চায় 🧡",
    "তুমি কি strawberry milk? sweet pink vibe 🍓💗",
    "তুমি কি tiny sparkle? সব brighten করে ✨💛",
    "তুমি কি marshmallow? নরম নরম 🧁💛",
    "তুমি কি cute chaos? adorable trouble 😹💗",
    "তুমি কি soft balloon? তোমার smile float করে 🎈💛",
    "তুমি কি cotton candy? sweet + fluffy 🍭💗",
    "তুমি কি cozy hoodie? আরাম লাগে 😌🧡",
    "তুমি কি baby peach? ছোট, নরম, cute 🍑💗",
    "তুমি কি soft raindrop? নরম vibe 🌧️💗",
    "তুমি কি tiny heart? ছোট ছোট feelings দাও 💗",
    "তুমি কি duckling? হাঁটলেই cute 😭💛",
    "তুমি কি little glow? তোমার মাঝে shine ✨💛",
    "তুমি কি small gift? খুললেই happiness 🎁💗",
  ];

  // ——————————————————————
  // 😈 TOXIC (30)
  // ——————————————————————
  const toxic = [
    "তুমি কি red flag? তবুও ভালো লাগে 😭❤️‍🔥",
    "তুমি কি toxic wifi? connect হলে life নষ্ট 📶😩",
    "তুমি কি heartbreak loop? বারবার repeat 😭",
    "তুমি কি poison? ধীরে affect করো 😩💔",
    "তুমি কি bad decision? জানি ভুল, তবুও চাই 😩🔥",
    "তুমি কি ghoster? দেখেও reply না 💀💬",
    "তুমি কি chaos? তোমায় ছাড়া শান্তি নেই 😭🔥",
    "তুমি কি drama pill? ছোট জিনিসে blast 😭💊",
    "তুমি কি emotional damage? তুমি দিলেই গভীর 😩💔",
    "তুমি কি last warning? ignore করি সবসময় 😑",
    "তুমি কি fake promise? মনে দাগ রেখে যাও 😩💔",
    "তুমি কি silent attack? hurt বেশি 😭",
    "তুমি কি wrong person? তবুও তোমাকেই চাই 😞💘",
    "তুমি কি lie detector fail? truth কম 😭",
    "তুমি কি mixed signal? confuse করো সবসময় 😩",
    "তুমি কি late reply expert? অপেক্ষা kill করে 😭",
    "তুমি কি emotional hacker? feelings hack করো 😤💘",
    "তুমি কি bad habit? ছাড়তে পারি না 😞🔥",
    "তুমি কি sharp word? কেটে যায় 😩💔",
    "তুমি কি selfish moment? শুধু নিজের কথা ভাবো 😑",
    "তুমি কি heartbreak playlist? শুনলেই কাঁদি 🎶💔",
    "তুমি কি toxic loop? escape impossible 😩",
    "তুমি কি pain trigger? তোমায় ভাবলেই লাগে 💔",
    "তুমি কি wrong timing? সবসময় late 😞",
    "তুমি কি false hope? শেষ পর্যন্ত ভাঙো 😭",
    "তুমি কি sweet poison? taste ভালো, end খারাপ 😩🔥",
    "তুমি কি heavy baggage? carry করতে কষ্ট 😩",
    "তুমি কি bitterness? মনে কষ্ট রাখো 😑💔",
    "তুমি কি heartbreak emoji? শুধু কষ্ট 🙃💔",
    "তুমি কি perfect disaster? everything ruined 😅💘",
  ];

  // ——————————————————————
  // 🌸 ANIME (30)
  // ——————————————————————
  const anime = [
    "তুমি কি anime waifu? দেখলেই heart explode 😳💘",
    "তুমি কি tsundere? ভালোবাসো, দেখাও না 😤💕",
    "তুমি কি sakura petal? aesthetic vibe 🌸✨",
    "তুমি কি kawaii girl? melt করে দাও 🥺💗",
    "তুমি কি senpai? তোমাকেই notice করতে চাই 😳💘",
    "তুমি কি anime eyes? spark full 😭💗",
    "তুমি কি chibi? ছোট কিন্তু cute 😭💕",
    "তুমি কি ramen bowl? comfort দাও 🍜💛",
    "তুমি কি anime OST? হারিয়ে যাই 🎶💗",
    "তুমি কি sword skill? sharp personality ⚔️😳",
    "তুমি কি anime smile? glow করে ✨💗",
    "তুমি কি neko girl? cute + mischief 😼💕",
    "তুমি কি anime hug? soft + warm 🤗💖",
    "তুমি কি Ghibli wind? dreamy vibe 🌬💛",
    "তুমি কি anime villain? attractive but dangerous 😳🔥",
    "তুমি কি senpai notice? wish করি সবসময় 😭💗",
    "তুমি কি anime picnic? wholesome vibe 🍱💛",
    "তুমি কি slice of life moment? ছোট কিন্তু special 🎬💛",
    "তুমি কি magical girl? sparkle everywhere ✨💕",
    "তুমি কি shoujo blush? তোমাকে দেখলেই 😳💗",
    "তুমি কি anime morning light? soft vibe ☀️💛",
    "তুমি কি neon tokyo light? aesthetic ✨🌃",
    "তুমি কি power-up scene? suddenly glow করো 💥😳",
    "তুমি কি anime opening? বারবার replay করি 🎶💛",
    "তুমি কি fox girl? cute + mysterious 🦊💕",
    "তুমি কি anime rainfall? emotional vibe 🌧💙",
    "তুমি কি soft pastel sky? calming ☁️💗",
    "তুমি কি otaku dream? impossible but cute 😭💘",
    "তুমি কি kawaii sticker? সব brighten করে 💛✨",
    "তুমি কি anime heartbeat shot? দেখে freeze হয়ে যাই 😳💘",
  ];

  // ——————————————————————
  // 🌑 DARK (30)
  // ——————————————————————
  const dark = [
    "তুমি কি shadow? কাছেই আছো, ধরা দাও না 🌑",
    "তুমি কি black hole? dangerous attraction 😳🌌",
    "তুমি কি poison kiss? deadly but sweet 😈💋",
    "তুমি কি midnight? dark but tempting 🌙🔥",
    "তুমি কি forbidden sin? ignore করা যায় না 😈💘",
    "তুমি কি curse? ছুঁলেই হৃদয় জ্বলে 😳🔥",
    "তুমি কি storm? chaos + beauty 🌪💛",
    "তুমি কি dark desire? ভাবলেই গরম লাগে 😳🔥",
    "তুমি কি fallen angel? dangerous charm 😈✨",
    "তুমি কি shadow flame? burn করো ভিতর থেকে 🔥🌑",
    "তুমি কি black velvet? soft but mysterious 😳🖤",
    "তুমি কি devil smile? heart stop 😈💛",
    "তুমি কি forbidden touch? ভাবলেই chills 😳🔥",
    "তুমি কি cursed memory? ভাবতে ইচ্ছে করে, কষ্ট দেয় 💔",
    "তুমি কি hypnotic eyes? পালাতে পারি না 😈💘",
    "তুমি কি dark moon? rare but divine 🌚✨",
    "তুমি কি deep abyss? ডুব দিলে বের হওয়া যায় না 🌑",
    "তুমি কি soul thief? চোখ দেখলেই হারাই 😳🔥",
    "তুমি কি dark perfume? linger করে dangerous vibe 🖤🔥",
    "তুমি কি wolf night? wild + silent 🌑🐺",
    "তুমি কি venom rose? beauty with danger 🌹🖤",
    "তুমি কি blackout? তোমাকে দেখলেই সব dark 😈✨",
    "তুমি কি sinful whisper? শুনলেই গরম লাগে 😳🔥",
    "তুমি কি cursed attraction? resist করা impossible 🖤🔥",
    "তুমি কি shadow kiss? feel করা যায়, দেখা না 😈💋",
    "তুমি কি deep silence? heavy vibe 🌑😈",
    "তুমি কি ghost flame? স্পর্শে জ্বলে 😳🔥",
    "তুমি কি midnight secret? hidden but tempting 🌙🔥",
    "তুমি কি darkness bloom? rare + beautiful 🖤🌸",
    "তুমি কি fallen star? dangerous beauty 🌠😳",
  ];

  const all = [
    ...love,
    ...sad,
    ...funny,
    ...flirty,
    ...cute,
    ...toxic,
    ...anime,
    ...dark,
  ];

  let pick;

  if (type === "love") pick = love[Math.floor(Math.random() * love.length)];
  else if (type === "sad") pick = sad[Math.floor(Math.random() * sad.length)];
  else if (type === "funny")
    pick = funny[Math.floor(Math.random() * funny.length)];
  else if (type === "flirty")
    pick = flirty[Math.floor(Math.random() * flirty.length)];
  else if (type === "cute")
    pick = cute[Math.floor(Math.random() * cute.length)];
  else if (type === "toxic")
    pick = toxic[Math.floor(Math.random() * toxic.length)];
  else if (type === "anime")
    pick = anime[Math.floor(Math.random() * anime.length)];
  else if (type === "dark")
    pick = dark[Math.floor(Math.random() * dark.length)];
  else pick = all[Math.floor(Math.random() * all.length)];

  return api.sendMessage(pick, event.threadID, event.messageID);
};
