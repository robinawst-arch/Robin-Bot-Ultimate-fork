module.exports.config = {
  name: "emoji",
  version: "1.0.0",
  hasPermssion: 0,
  credits: "Robin-Bot",
  description: "Encrypt messages to Emoji and vice versa",
  commandCategory: "Tool",
  usages: "emojitroll en <text>\nor\nemojitroll de <text>",
  cooldowns: 5,
};

module.exports.run = async ({ event, api, args }) => {
  var text = args.slice(1).join(" ");
  var type = args[0];
  if (type == "encode" || type == "en") {
    text = text.toLowerCase();
    text = text.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ|a/g, "😀");
    text = text.replace(/b/g, "😃");
    text = text.replace(/c/g, "😁");
    text = text.replace(/đ|d/g, "😅");
    text = text.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ|e/g, "🥰");
    text = text.replace(/f/g, "🤣");
    text = text.replace(/g/g, "🥲");
    text = text.replace(/h/g, "☺️");
    text = text.replace(/ì|í|ị|ỉ|ĩ|i/g, "😊");
    // There's no letter "j", I don't understand why
    text = text.replace(/k/g, "😇");
    text = text.replace(/l/g, "😉");
    text = text.replace(/m/g, "😒");
    text = text.replace(/n/g, "😞");
    text = text.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ|o/g, "😙");
    text = text.replace(/p/g, "😟");
    text = text.replace(/q/g, "😕");
    text = text.replace(/r/g, "🙂");
    text = text.replace(/s/g, "🙃");
    text = text.replace(/t/g, "☹️");
    text = text.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ|u/g, "😡");
    text = text.replace(/v/g, "😍");
    text = text.replace(/x/g, "😩");
    text = text.replace(/ỳ|ý|ỵ|ỷ|ỹ|y/g, "😭");
    text = text.replace(/w/g, "😳");
    text = text.replace(/z/g, "😠");
    text = text.replace(/ /g, "."); // Replace space with dot

    // Some system encode Vietnamese combining accent as individual utf-8 characters
    text = text.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, ""); // Huyền sắc hỏi ngã nặng
    text = text.replace(/\u02C6|\u0306|\u031B/g, ""); // Â, Ê, Ă, Ơ, Ư
    return api.sendMessage(text, event.threadID, event.messageID);
  } else if (type == "decode" || type == "de") {
    text = text.toLowerCase();
    text = text.replace(/😀/g, "a");
    text = text.replace(/😃/g, "b");
    text = text.replace(/😁/g, "c");
    text = text.replace(/😅/g, "d");
    text = text.replace(/🥰/g, "e");
    text = text.replace(/🤣/g, "f");
    text = text.replace(/🥲/g, "g");
    text = text.replace(/☺️/g, "h");
    text = text.replace(/😊/g, "i");
    // There's no letter "j", I don't understand why
    text = text.replace(/😇/g, "k");
    text = text.replace(/😉/g, "l");
    text = text.replace(/😒/g, "m");
    text = text.replace(/😞/g, "n");
    text = text.replace(/😙/g, "o");
    text = text.replace(/😟/g, "p");
    text = text.replace(/😕/g, "q");
    text = text.replace(/🙂/g, "r");
    text = text.replace(/🙃/g, "s");
    text = text.replace(/☹️/g, "t");
    text = text.replace(/😡/g, "u");
    text = text.replace(/😍/g, "v");
    text = text.replace(/😩/g, "x");
    text = text.replace(/😭/g, "y");
    text = text.replace(/😳/g, "w");
    text = text.replace(/😠/g, "z");
    text = text.replace(/\./g, " "); // Replace dot with space
    return api.sendMessage(text, event.threadID, event.messageID);
  } else {
    return api.sendMessage(
      "Wrong syntax\nemoji en <text>\n,or\nemoji de <text>",
      event.threadID,
      event.messageID
    );
  }
};
