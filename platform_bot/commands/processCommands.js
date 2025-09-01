const { sendToDiscord } = require("../managers/discordManager");
const { sendToTelegram } = require("../managers/telegramManager");
const { addTFC, deleteTFC, rescheduleTFC, getTFC, reminderTFC } = require("../managers/tfcManager");

const { addAdmin, removeAdmin, isAdmin } = require("../managers/telegramAdminManager");

const DC_ANNONCEMENT_ID = process.env.DISCORD_ANNOUNCEMENT_CHANNEL_ID;
const DC_TFC_ID = process.env.DISCORD_TFC_CHANNEL_ID;


async function processCommand(platform, command, args, context, reply, senderID) {

  // Announcement
  if (command === "broadcast") {
    const message = args.join(" ");
    if (!message) return reply("⚠️ Please provide a message.");

    sendToDiscord(DC_ANNONCEMENT_ID, message);
    sendToTelegram(message);
    reply(`✅ Announcement sent to Discord & Telegram`);
    return;
  }





  /////////////////////////////////////////////////////////////
  // 📝 TFC commands

  if (command === "seetfc") {
    const tfcList = getTFC(); // returns array of strings like ".../d" or ".../u"

    const past = tfcList
      .filter(line => line.endsWith("/d"))
      .map(line => line.replace(/\/d$/, "")) // remove "/d"
      .join("\n");

    const upcoming = tfcList
      .filter(line => line.endsWith("/u"))
      .map(line => line.replace(/\/u$/, "")) // remove "/u"
      .join("\n");

    const message = `📌 **Past TFCs**\n${past || "None"}\n\n📌 **Upcoming TFCs**\n${upcoming || "None"}`;
    if (args[0] == 'send') {
      sendToDiscord(DC_TFC_ID, message);
      sendToTelegram(message);
      reply(`✅ TFC dates sent to Discord & Telegram`);
    }
    else reply(message);

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
    if (args.length < 3) return reply("⚠️ Usage: restfc <serialNo> <YYYY-MM-DD> <HH:MM>");

    const sl = Number(args[0]);
    if (!sl) return reply("⚠️ Invalid serialNo number");

    const dateStr = `${args[1]} ${args[2]}`; // "2025-07-26 17:30"

    try {
      const message = await rescheduleTFC(sl, dateStr);


      if (message) {
        sendToDiscord(DC_TFC_ID, message);
        sendToTelegram(message);
        reply("Announcement Sent:\n" + message);
      }

    } catch (err) {
      reply(`❌ Failed to reschedule TFC: ${err.message}`);
    }
    return;
  }


  if (command === "deltfc") {
    // args example: ["2"]
    if (!args[0]) return reply("⚠️ Usage: deltfc <serialNo>");
    const sl = Number(args[0]);
    try {
      await deleteTFC(sl);
      reply(`✅ TFC ${sl} deleted.`);
    } catch (err) {
      reply(`❌ Failed to delete TFC: ${err.message}`);
    }
    return;
  }

  if (command === "remtfc") {
    try {
      const message = reminderTFC();
      sendToDiscord(DC_TFC_ID, message);
      sendToTelegram(message);
      reply(`✅ reminder sent to Discord & Telegram`);
    } catch (err) {
      reply("❌ Failed to fetch TFC reminder.");
    }
    return;
  }



  /////////////////////////////////////////////////////////////



  if (command === "help") {
    const message =
      `📚 **Available Commands**

**!broadcast <message>**
Send an announcement to both Discord & Telegram.

**!seetfc**
Shows the current TFC list.

**!seetfc send**
Publishes the TFC list to the public channels.

**!addtfc YYYY-MM-DD HH:MM**
Adds a new TFC to the list at the given date & time. Example: !addtfc 2025-09-01 15:00
The list is automatically sorted after adding.

**!restfc serialNo YYYY-MM-DD HH:MM**
Reschedules a TFC by serialNo number (1–10) to a new date & time, publishes the update to channels, and sorts the list. Example: !restfc 2 2025-09-02 17:30

**!deltfc serialNo**
Deletes a TFC by its serialNo number and sorts the list. Example: !deltfc 3

**!remtfc**
Publishes a reminder for upcoming TFCs to Discord & Telegram.
`;

    reply(message);
    return;
  }






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
