const fs = require("fs");
const path = require("path");
require("dotenv").config();

const BOT_MEMORY = path.join(__dirname, "./bot_memory.json"); // adjust path if needed
const SUPER_ADMIN = Number(process.env.TG_SUPER_ADMIN_ID);

// Ensure the admin file exists
if (!fs.existsSync(BOT_MEMORY)) {
  fs.writeFileSync(BOT_MEMORY, JSON.stringify({ tgAdmins: [] }, null, 2));
}

// Load admins from file and ensure superadmin is always included
function loadAdmins() {
  const data = fs.readFileSync(BOT_MEMORY);
  let admins = [];
  try {
    admins = JSON.parse(data).tgAdmins || [];
  } catch (err) {
    console.error("Error parsing admin file:", err.message);
  }
  if (!admins.includes(SUPER_ADMIN)) admins.push(SUPER_ADMIN);
  return admins;
}

// Save admins to file
function saveAdmins(admins) {
  // Load existing memory
  let botMemory = { tgAdmins: [], tfcData: [], tfcEvents: [] };
  if (fs.existsSync(BOT_MEMORY)) {
    botMemory = JSON.parse(fs.readFileSync(BOT_MEMORY, "utf8"));
  }

  // Update only tgAdmins
  botMemory.tgAdmins = admins;

  // Save back full JSON
  fs.writeFileSync(BOT_MEMORY, JSON.stringify(botMemory, null, 2));
}

// Check if user is admin (superadmin or regular admin)
function isAdmin(userId) {
  const admins = loadAdmins();

  return admins.includes(userId);
}

// Only superadmin can add new admins
function addAdmin(userId, requesterId) {
  if (requesterId !== SUPER_ADMIN) return false; // only superadmin can add
  const admins = loadAdmins();
  if (!admins.includes(userId)) {
    admins.push(userId);
    saveAdmins(admins);
  }
  return true;
}

// Only superadmin can remove admins
function removeAdmin(userId, requesterId) {
  if (requesterId !== SUPER_ADMIN) return false; // only superadmin can remove
  let admins = loadAdmins();
  if (admins.includes(userId)) {
    admins = admins.filter((id) => id !== userId);
    saveAdmins(admins);
  }
  return true;
}

module.exports = { isAdmin, addAdmin, removeAdmin, loadAdmins };
