// server/controllers/meetController.js
const { google } = require('googleapis');
const path = require('path');

const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, '../brightbyte-meet-key.json'),
  scopes: ['https://www.googleapis.com/auth/meet.meetingspace']
});

const meet = google.meet({ version: 'v2', auth });

async function createMeeting(req, res) {
  const { courseId, title, date, time, sessionId } = req.body; // e.g., "3UOM4646"

  try {
    const meeting = await meet.meetingSpaces.create({
      requestBody: {
        displayName: `${title} - ${courseId}`,
        meetingSpaceType: 'MEETING_SPACE'
      }
    });

    const meetingUri = meeting.data.meetingUri; // e.g., "https://meet.google.com/abc-defg-hij"
    console.log("Created meeting:", meeting.data);

    // Store in your DB (pseudo-code)
    const newSession = {
      title,
      date,
      time,
      sessionId,
      meetingUri,
      isLive: false
    };
    // Update course.liveSessions in MongoDB

    res.status(201).json(newSession);
  } catch (error) {
    console.error("Error creating meeting:", error.message);
    res.status(500).json({ message: "Failed to create meeting" });
  }
}

module.exports = { createMeeting };