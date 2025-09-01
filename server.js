require("dotenv").config();
const express = require("express");


////////////  ADDD THISSSSSS IMPORT /////////////////
const {initPlatformBot} = require("./platform_bot/bot_index");
///////////////////////////////////////////////////

const app = express();
const PORT = process.env.PORT || 8080;



// CALL THIS ////////////////////////
initPlatformBot();
////////////////////////////////////




app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
