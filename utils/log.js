const chalk = require("chalk");

module.exports = function (text, type) {
  const time = new Date().toLocaleTimeString("en-US", { hour12: false });

  switch (type) {
    case "error":
      console.log(chalk.red(`[ ${time} ] » ${text}`));
      break;
    case "warn":
      console.log(chalk.yellow(`[ ${time} ] » ${text}`));
      break;
    case "success":
      console.log(chalk.green(`[ ${time} ] » ${text}`));
      break;
    default:
      console.log(chalk.blue(`[ ${time} ] » ${text}`));
  }
};

module.exports.loader = function (text, type) {
  const time = new Date().toLocaleTimeString("en-US", { hour12: false });

  switch (type) {
    case "error":
      console.log(chalk.red(`[ ${time} ] [LOADER] » ${text}`));
      break;
    case "warn":
      console.log(chalk.yellow(`[ ${time} ] [LOADER] » ${text}`));
      break;
    case "success":
      console.log(chalk.green(`[ ${time} ] [LOADER] » ${text}`));
      break;
    default:
      console.log(chalk.blue(`[ ${time} ] [LOADER] » ${text}`));
  }
};
