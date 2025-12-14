//==================================================
// Robin Bot Logger System (Beautiful Colored Log)
//==================================================

const chalk = require("chalk");

module.exports = {
    info: (msg) => {
        console.log(chalk.blueBright(`ℹ️ INFO: `) + chalk.white(msg));
    },

    warn: (msg) => {
        console.log(chalk.yellow(`⚠️ WARNING: `) + chalk.white(msg));
    },

    error: (msg) => {
        console.log(chalk.red(`❌ ERROR: `) + chalk.white(msg));
    },

    success: (msg) => {
        console.log(chalk.green(`✅ SUCCESS: `) + chalk.white(msg));
    },

    load: (msg) => {
        console.log(chalk.cyan(`📦 LOADING: `) + chalk.white(msg));
    },

    event: (msg) => {
        console.log(chalk.magenta(`🎉 EVENT: `) + chalk.white(msg));
    },

    command: (msg) => {
        console.log(chalk.greenBright(`📌 COMMAND: `) + chalk.white(msg));
    },

    start: (msg) => {
        console.log(chalk.bold.green(`🚀 START: `) + chalk.white(msg));
    }
};
