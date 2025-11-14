These are additional features to be integrated in the main RAPL BOT of Shuvo Malakar Bhai....

# Project Integration Guide

This guide will help you integrate the **platform bot** in the main Node.js bot project.

---

## 1. Prerequisites

Make sure you have **Node.js** and **npm** installed. Then, install the project dependencies:

```bash
npm install express discord.js node-telegram-bot-api dotenv googleapis google-auth-library

```
---

## 2. Copy Platform Bot and .env

Copy the `platform_bot` directory from this project and paste it into your project root directory.  
paste the additional .env variables and values. 
Your project structure should look like this:

```
/your-project
  |-- server.js
  |-- platform_bot/
  |-- package.json
  |-- .env
```

---

## 3. Update Your Entry File

Open your main server file (`server.js` or `index.js`) and **add the following imports and initialization**:

```js
require("dotenv").config();
const express = require("express");

////////////  ADD THIS IMPORT  /////////////////
const { initPlatformBot } = require("./platform_bot/bot_index");
/////////////////////////////////////////////////

const app = express();
const PORT = process.env.PORT || 8080;

/////////////////////////////////////////
// CALL THIS TO INIT THE BOT
initPlatformBot();
/////////////////////////////////////////

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

> Make sure the commented lines above are properly added, as they initialize the Discord & Telegram bot.

---
