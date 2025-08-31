const { Client, GatewayIntentBits, PermissionsBitField } = require("discord.js");
require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

let commandHandler;

function initDiscordManager(handler) {
  commandHandler = handler;

  client.once("ready", () => {
    console.log(`✅ Discord bot logged in as ${client.user.tag}`);
  });

  client.on("messageCreate", (msg) => {
    if (msg.author.bot) return;
    if (msg.channel.id !== process.env.DISCORD_COMMAND_CHANNEL_ID) return;

    if (msg.content.startsWith("!")) {
      const [cmd, ...args] = msg.content.substring(1).trim().split(/\s+/);
      // pass platform, command, args, context (msg), and a reply function
      commandHandler("discord", cmd.toLowerCase(), args, msg, (res) => msg.reply(res));
    }
  });

  client.login(process.env.DISCORD_BOT_TOKEN);
}

// Updated: now you can specify channel ID
async function sendToDiscord(channelId, message) {
  try {
    const channel = await client.channels.fetch(channelId);
    // console.log(channel);
    
    if (!channel) throw new Error("Channel not found");
    await channel.send(message);
  } catch (err) {
    console.error(`Discord send error for channel ${channelId}:`, err.message);
  }
}

module.exports = { initDiscordManager, sendToDiscord };
