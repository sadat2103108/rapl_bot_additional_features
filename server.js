require("dotenv").config();
const express = require("express");
const {initPlatformBot} = require("./platform_bot/bot_index");


const app = express();
const PORT = process.env.PORT || 8080;

// Start your platform bot
initPlatformBot();

// Example existing route in your server
app.get("/", (req, res) => {
  res.send("Hello! Server + Platform Bot running.");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
