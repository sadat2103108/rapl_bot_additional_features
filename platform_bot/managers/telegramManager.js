const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();
const { isAdmin } = require("./telegramAdminManager");

const bot = new TelegramBot(process.env.TG_BOT_TOKEN, { polling: true });
let commandHandler;

function initTelegramManager(handler) {
  commandHandler = handler;

  bot.on("message", (msg) => {
    if (!msg.text) return;
    if (!msg.text.startsWith("/")) return;

    const userId = msg.from.id;
    if (!isAdmin(userId)) {
      bot.sendMessage(userId, "❌ Unauthorized: You are not an admin.");
      return;
    }

    const [cmd, ...args] = msg.text.substring(1).trim().split(/\s+/);
    // reply function for Telegram
    const reply = (text) => bot.sendMessage(msg.chat.id, text);
    commandHandler("telegram", cmd.toLowerCase(), args, msg, reply, userId);
  });


  console.log("✅ Telegram bot started");
}

async function sendToTelegram(message) {
  try {
    await bot.sendMessage(process.env.TG_ANNOUNCEMENT_CHANNEL_ID, message);
  } catch (err) {
    console.error("Telegram send error:", err);
  }
}

module.exports = { initTelegramManager, sendToTelegram };
