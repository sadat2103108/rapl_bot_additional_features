const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "bot_memory.json");
let bot_memory = JSON.parse(fs.readFileSync(filePath, "utf8"));

const { addEvent, deleteEvent } = require("./calendarManager");

// Save memory to JSON
function saveMemory() {
    fs.writeFileSync(filePath, JSON.stringify(bot_memory, null, 2));
}

// Parse string input into Date object in GMT+6
function parseDhakaDate(dateStr) {
    // Split into date and time
    const [datePart, timePart] = dateStr.split(" ");

    // Return in ISO 8601 format with +06:00
    return `${datePart}T${timePart}:00+06:00`;
}

function getCurrentTime() {
    const now = new Date();
    const nowDhaka = new Date(now.getTime() + 6 * 60 * 60 * 1000);

    // Format to match "2025-07-26T17:30:00+06:00"
    const formattedNow = nowDhaka.toISOString().replace("Z", "+06:00");
    return new Date(formattedNow);
}

// Update TFC: sort, mark done, sync Google Calendar
async function updateTFC() {
    const now = getCurrentTime();

    // 1️⃣ Sort tfcDates by dateTime
    bot_memory.tfcDates.sort((a, b) => {
        return new Date(a.dateTime) - new Date(b.dateTime);
    });

    // 2️⃣ Mark past events as done
    bot_memory.tfcDates.forEach(event => {
        if (event.dateTime < now) event.done = true;
    });

    // 3️⃣ Delete all existing Google Calendar events
    const oldEvents = bot_memory.tfcEvents || [];
    for (const eventId of oldEvents) {
        await deleteEvent(eventId);
    }

    // 4️⃣ Reset tfcEvents array
    bot_memory.tfcEvents = [];

    // 5️⃣ Create new Google Calendar events for future TFCs
    for (let i = 0; i < bot_memory.tfcDates.length; i++) {
        const date = bot_memory.tfcDates[i];
        // if (date.done) continue; // skip past events

        const startTime = new Date(date);

        const endTime = new Date(startTime.getTime() + 3 * 60 * 60 * 1000);




        const event = await addEvent({
            title: `TFC ${i + 1}`,
            startTime,
            endTime,
            description: "",
            location: "RAPL, 201, 202"
        });

        bot_memory.tfcEvents.push(event.id);
    }

    // 6️⃣ Save updated memory
    saveMemory();
}

// Add a new TFC from string input
async function addTFC(dateStr) {
    const date = parseDhakaDate(dateStr);
    bot_memory.tfcDates.push(date);
    await updateTFC();
}

// Delete TFC by serial number (1-based index)
async function deleteTFC(sl) {
    const index = sl - 1;
    if (index >= 0 && index < bot_memory.tfcDates.length) {
        bot_memory.tfcDates.splice(index, 1);
        await updateTFC();
    } else {
        console.error("Invalid TFC index");
    }
}




// Helper to format Date in "Month day, Year, hh:mm AM/PM"
function readableDateDhaka(dateStr) {
    const date = new Date(dateStr);
    const options = {
        timeZone: "Asia/Dhaka",
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true
    };

    // Format the date
    const formatted = new Intl.DateTimeFormat("en-US", options).format(date);

    return formatted;
}


// Reschedule TFC by serial number
async function rescheduleTFC(sl, dateStr) {
    const index = sl - 1;
    if (index >= 0 && index < bot_memory.tfcDates.length) {
        const prevDate = bot_memory.tfcDates[index];
        const newDate = parseDhakaDate(dateStr);


        bot_memory.tfcDates[index] = newDate;

        await updateTFC();
        const prev = readableDateDhaka(prevDate).split(",").slice(0, 2);
        const cur = readableDateDhaka(newDate);
        const message =
            `⚠️‼️ **TFC Rescheduled**\n\n` +
            `An upcoming TFC has been moved to a different date or time..\n\n`+
            `❌ **Previusly on: ** ${prev}\n\n` +
            `✅ **Rescheduled To: ** ${cur}`;

        return message;
    } else {
        throw new Error("Invalid TFC serial number");
    }
}



function getTFC(refresh = true) {
    if (refresh) updateTFC();
    const now = getCurrentTime();

    let past = [];
    let upcoming = [];

    bot_memory.tfcDates.forEach((tfcDate, index) => {
        const dateObj = new Date(tfcDate);
        if (isNaN(dateObj)) {
            upcoming.push(`**TFC${index + 1}** — Invalid date`);
            return;
        }

        const day = dateObj.toLocaleString("en-US", { weekday: "long", timeZone: "Asia/Dhaka" });
        const date = dateObj.toLocaleDateString("en-US", {
            timeZone: "Asia/Dhaka",
            month: "long",
            day: "numeric",
            year: "numeric"
        });
        const time = dateObj.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
            timeZone: "Asia/Dhaka"
        });

        const tfcInfo = `**TFC${index + 1}** — ${day}, **${date}** at ${time}`;

        if (dateObj.getTime() < now.getTime()) {
            past.push(tfcInfo);
        } else {
            upcoming.push(tfcInfo);
        }
    });

    const message =
        `📌 **Past TFCs**\n${past.join("\n") || "None"}\n\n` +
        `📌 **Upcoming TFCs**\n${upcoming.join("\n") || "None"}`;

    return message;
}



// Returns a reminder string for the next upcoming TFC
function reminderTFC() {
    const now = getCurrentTime();

    for (let i = 0; i < bot_memory.tfcDates.length; i++) {
        const date = bot_memory.tfcDates[i];
        const dateObj = new Date(date);

        if (dateObj.getTime() > now.getTime()) {
            const dateTxt = readableDateDhaka(date);

            // calculate hours + minutes remaining
            const diffMs = dateObj.getTime() - now.getTime();
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

            const message =
                `⏰ **TFC Reminder‼️**\n\n` +
                `Hey everyone, a TFC is coming up on:\n\n` +
                `📅 **${dateTxt}**\n` +
                `⏳ **${hours} hours ${minutes} minutes remaining!**`;

            return message;
        }
    }

    return '';
}




module.exports = {
    addTFC,
    deleteTFC,
    rescheduleTFC,
    getTFC,
    reminderTFC
};
