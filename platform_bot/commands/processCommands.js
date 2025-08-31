const { sendToDiscord } = require("../managers/discordManager");
const { sendToTelegram } = require("../managers/telegramManager");
const { addTFC, deleteTFC, rescheduleTFC, getTFC } = require("../managers/tfcManager");
// const { addEvent } = require("../managers/calendarManager");
const { addAdmin, removeAdmin, isAdmin } = require("../managers/telegramAdminManager");

const DC_ANNONCEMENT_ID = process.env.DISCORD_ANNOUNCEMENT_CHANNEL_ID;

async function processCommand(platform, command, args, context, reply, senderID) {

  // 📢 Announcement
  if (command === "ann") {
    const message = args.join(" ");
    if (!message) return reply("⚠️ Please provide a message.");

    sendToDiscord(DC_ANNONCEMENT_ID, `📢 ${message}`);
    sendToTelegram(`📢 ${message}`);
    reply(`✅ Announcement sent to Discord & Telegram`);
    return;
  }





  /////////////////////////////////////////////////////////////
  // 📝 TFC commands

  if (command === "seetfc") {
    const tfcList = getTFC(); // returns array of formatted strings
    const message = tfcList.length
      ? tfcList.map(tfc => `• ${tfc}\n`).join("\n")
      : "No TFCs scheduled.";
    reply(message);
    return;
  }

  if (command === "addtfc") {
    // args example: ["2025-07-26", "17:30"]
    if (args.length < 2) return reply("⚠️ Usage: addtfc <YYYY-MM-DD> <HH:MM>");

    const dateStr = args.slice(0, 2).join(" "); // "2025-07-26 17:30"

    // Optional: validate the format
    const dt = new Date(dateStr);
    if (isNaN(dt)) return reply("⚠️ Invalid date format. Use YYYY-MM-DD HH:MM");

    try {
      await addTFC(dateStr);
      reply(`✅ TFC added on ${dateStr}`);
    } catch (err) {
      reply(`❌ Failed to add TFC: ${err.message}`);
    }
    return;
  }

  if (command === "restfc") {
    // args example: ["2", "2025-07-26", "17:30"]
    if (args.length < 3) return reply("⚠️ Usage: restfc <serial> <YYYY-MM-DD> <HH:MM>");

    const sl = Number(args[0]);
    if (!sl) return reply("⚠️ Invalid serial number");

    const dateStr = `${args[1]} ${args[2]}`; // "2025-07-26 17:30"

    try {
      const message = await rescheduleTFC(sl, dateStr);

      
      if(message){
        sendToDiscord(DC_ANNONCEMENT_ID, `📢 ${message}`);
        sendToTelegram(`📢 ${message}`);
        reply("Announcement Sent:\n"+ message );
      }

    } catch (err) {
      reply(`❌ Failed to reschedule TFC: ${err.message}`);
    }
    return;
  }


  if (command === "deltfc") {
    // args example: ["2"]
    if (!args[0]) return reply("⚠️ Usage: delTFC <serial>");
    const sl = Number(args[0]);
    try {
      await deleteTFC(sl);
      reply(`✅ TFC ${sl} deleted.`);
    } catch (err) {
      reply(`❌ Failed to delete TFC: ${err.message}`);
    }
    return;
  }

  /////////////////////////////////////////////////////////////






  /////////////////////////////////////////////////////////////
  // Telegram admin commands
  else if (command === "addadmin" && platform === "telegram") {
    const id = Number(args[0]);
    if (!id) return reply("❌ Usage: /addadmin <user_id>");

    if (isAdmin(id)) reply("⚠️ User is already an admin");
    else if (addAdmin(id, senderID)) reply(`✅ Added new admin: ${id}`);
    else reply("You are unautorized to add or remove admins ");
    return;
  }

  else if (command === "removeadmin" && platform === "telegram") {
    const id = Number(args[0]);
    if (!id) return reply("❌ Usage: /removeadmin <user_id>");

    if (!isAdmin(id)) reply("⚠️ User is not an admin");
    else if (removeAdmin(id, senderID)) reply(`✅ Removed admin: ${id}`);
    else reply("You are unautorized to add or remove admins ");
    return;
  }

  /////////////////////////////////////////////////////////////
  // Unknown command
  else {
    reply("❌ Unknown command");
  }
}

module.exports = { processCommand };
