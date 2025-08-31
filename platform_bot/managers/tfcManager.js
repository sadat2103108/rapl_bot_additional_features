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
    // Example input: "September 1, 2025 15:00"
    return new Date(`${dateStr} GMT+0600`);
}

// Update TFC: sort, mark done, sync Google Calendar
async function updateTFC() {
    const now = new Date();

    // 1️⃣ Sort tfcData by dateTime
    bot_memory.tfcData.sort((a, b) => a.dateTime - b.dateTime);

    // 2️⃣ Mark past events as done
    bot_memory.tfcData.forEach(event => {
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
    for (let i = 0; i < bot_memory.tfcData.length; i++) {
        const tfc = bot_memory.tfcData[i];
        // if (tfc.done) continue; // skip past events

        const startTime = new Date(tfc.dateTime);
        if (isNaN(startTime)) {
            console.error("Invalid date for TFC:", tfc.dateTime);
            continue; // skip this TFC
        }
        const endTime = new Date(startTime.getTime() + 3 * 60 * 60 * 1000);


        const event = await addEvent({
            title: `TFC ${i + 1}`,
            startTime,
            endTime,
            description: "",
            location: ""
        });

        bot_memory.tfcEvents.push(event.id);
    }

    // 6️⃣ Save updated memory
    saveMemory();
}

// Add a new TFC from string input
async function addTFC(dateStr) {
    const date = parseDhakaDate(dateStr);
    bot_memory.tfcData.push({ dateTime: date, done: false });
    await updateTFC();
}

// Delete TFC by serial number (1-based index)
async function deleteTFC(sl) {
    const index = sl - 1;
    if (index >= 0 && index < bot_memory.tfcData.length) {
        bot_memory.tfcData.splice(index, 1);
        await updateTFC();
    } else {
        console.error("Invalid TFC index");
    }
}




// Helper to format Date in "Month day, Year, hh:mm AM/PM"
function formatDhakaDate(date) {
    const options = {
        timeZone: "Asia/Dhaka",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true
    };
    return new Intl.DateTimeFormat("en-US", options).format(date);
}

// Reschedule TFC by serial number
async function rescheduleTFC(sl, dateStr) {
    const index = sl - 1;
    if (index >= 0 && index < bot_memory.tfcData.length) {
        const prevDate = bot_memory.tfcData[index].dateTime;
        const newDate = parseDhakaDate(dateStr);

        bot_memory.tfcData[index].dateTime = newDate;
        bot_memory.tfcData[index].done = false;

        await updateTFC();
        const message = `TFC Rescheduled. ‼️\nThe TFC on ${formatDhakaDate(prevDate)} has been rescheduled to ${formatDhakaDate(newDate)}`;

        return message;     
    } else {
        throw new Error("Invalid TFC serial number");
    }
}

// Get formatted TFC list for display
function getTFC() {
    updateTFC();
    return bot_memory.tfcData.map((item, index) => {
        const dateObj = new Date(item.dateTime); // <-- correct key
        if (isNaN(dateObj)) return `TFC${index + 1}: Invalid date`;

        const day = dateObj.toLocaleString("en-US", { weekday: "long", timeZone: "Asia/Dhaka" });
        const date = dateObj.toLocaleDateString("en-US", { timeZone: "Asia/Dhaka", month: "long", day: "numeric", year: "numeric" });
        const time = dateObj.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
            timeZone: "Asia/Dhaka"
        });

        const status = item.done ? "done" : "upcoming";

        return `TFC${index + 1}, ${day}, ${date} at ${time}. [${status}]`;
    });
}


module.exports = {
    addTFC,
    deleteTFC,
    rescheduleTFC,
    getTFC
};
