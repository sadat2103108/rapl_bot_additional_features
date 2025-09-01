const { google } = require("googleapis");
const { JWT } = require("google-auth-library");

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
 * Add a new event
 */
async function addEvent({ title, startTime, endTime, description = "", location = "" }) {
  try {
    const event = {
      summary: title,
      description,
      location,
      start: { dateTime: startTime, timeZone: "Asia/Dhaka" },
      end: { dateTime: endTime, timeZone: "Asia/Dhaka" },
    };

    console.log(event.start);

    const res = await calendar.events.insert({ calendarId, resource: event });
    return res.data;
  } catch (err) {
    console.error("Error adding event:", err);
    throw err;
  }
}

/**
 * Delete an event
 */
async function deleteEvent(eventId) {
  try {
    await calendar.events.delete({ calendarId, eventId });
    return { success: true };
  } catch (err) {
    if (err?.response?.status === 410) return { success: true };
    console.error("Error deleting event:", err);
    throw err;
  }
}


// Export all functions
module.exports = {
  addEvent,
  deleteEvent,
};
