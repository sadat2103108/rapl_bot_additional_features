
const { initDiscordManager } = require("./managers/discordManager");
const { initTelegramManager } = require("./managers/telegramManager");
const { processCommand } = require("./commands/processCommands");

/**
 * Initializes the Discord + Telegram bots and integrates command processing.
 */
function initPlatformBot() {
  // Initialize Discord manager with shared command handler
  initDiscordManager(processCommand);

  // Initialize Telegram manager with shared command handler
  initTelegramManager(processCommand);

  console.log("Platform Bot initialized: Discord + Telegram");
}

// Export the init function for seamless integration
module.exports = { initPlatformBot };
