// platform_bot/managers/calendarManager.js
const { google } = require("googleapis");
const { JWT } = require("google-auth-library");
require("dotenv").config(); // load .env

// Load service account from env
const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

// Auth client
const auth = new JWT({
  email: creds.client_email,
  key: creds.private_key,
  scopes: ["https://www.googleapis.com/auth/calendar"],
});

// Calendar API instance
const calendar = google.calendar({ version: "v3", auth });
const calendarId = process.env.CALENDAR_ID;

/**
 * Convert string or Date to RFC3339 in Asia/Dhaka (GMT+6)
 */
function toDhakaDateTime(dateTime) {
  const date = dateTime instanceof Date ? dateTime : new Date(dateTime);
  return date.toLocaleString("sv-SE", { timeZone: "Asia/Dhaka" }).replace(" ", "T") + "+06:00";
}

module.exports = {

  /**
   * Add a new event
   */
  addEvent: async function ({ title, startTime, endTime, description = "", location = "" }) {
    try {
      const event = {
        summary: title,
        description,
        location,
        start: { dateTime: toDhakaDateTime(startTime), timeZone: "Asia/Dhaka" },
        end: { dateTime: toDhakaDateTime(endTime), timeZone: "Asia/Dhaka" },
      };

      const res = await calendar.events.insert({ calendarId, resource: event });
      return res.data;
    } catch (err) {
      console.error("Error adding event:", err);
      throw err;
    }
  },


  /**
   * Delete an event
   */
  deleteEvent: async function (eventId) {
    try {
      await calendar.events.delete({ calendarId, eventId });
      return { success: true };
    } catch (err) {
      if (err?.response?.status === 410) {
        // Event already deleted, ignore
        console.warn(`Event ${eventId} already deleted, skipping.`);
        return { success: true };
      }
      console.error("Error deleting event:", err);
      throw err;
    }
  },

  /**
   * List upcoming events
   */
  listEvents: async function (maxResults = 15) {
    try {
      const res = await calendar.events.list({
        calendarId,
        timeMin: new Date().toISOString(),
        maxResults,
        singleEvents: true,
        orderBy: "startTime",
      });
      return res.data.items;
    } catch (err) {
      console.error("Error listing events:", err);
      throw err;
    }
  },
};
