const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();
const { isAdmin } = require("./telegramAdminManager");

const bot = new TelegramBot(process.env.TG_BOT_TOKEN, { polling: true });
let commandHandler;


function parseMarkdown(text) {
  // 1️⃣ Replace **bold** with *bold* first
  text = text.replace(/\*\*(.*?)\*\*/g, '*$1*');

  // 2️⃣ Escape all special characters **except*** (for bold/italic)
  text = text.replace(/([_[\]()~`#+\-|{}])/g, '\\$1');

  return text;
}

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




    const reply = (text) =>
      bot.sendMessage(msg.chat.id, parseMarkdown(text), { parse_mode: "Markdown" });

    // bot.sendMessage(msg.chat.id, text, { parse_mode: "MarkdownV2" });
    commandHandler("telegram", cmd.toLowerCase(), args, msg, reply, userId);
  });


  console.log("✅ Telegram bot started");
}

async function sendToTelegram(text) {
  try {
    await bot.sendMessage(process.env.TG_ANNOUNCEMENT_CHANNEL_ID, parseMarkdown(text), { parse_mode: "Markdown" });
  } catch (err) {
    console.error("Telegram send error:", err);
  }
}

module.exports = { initTelegramManager, sendToTelegram };
