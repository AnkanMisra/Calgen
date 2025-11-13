import express from "express";
import { google } from "googleapis";
import fs from "fs";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(bodyParser.json());
app.use(express.static("public")); // Serve frontend files

// Load credentials
const credentials = JSON.parse(fs.readFileSync("credentials.json"));
const { client_secret, client_id, redirect_uris } = credentials.web;

const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0],
);

// 1️⃣ Step 1: Redirect user to Google OAuth
app.get("/auth", (req, res) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/calendar.events"],
  });
  res.redirect(authUrl);
});

// 2️⃣ Step 2: Handle OAuth redirect
app.get("/oauth2callback", async (req, res) => {
  const { code } = req.query;
  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);
  fs.writeFileSync("token.json", JSON.stringify(tokens));
  res.sendFile(path.join(__dirname, "public", "authorized.html"));
});

// 3️⃣ Step 3: Generate fake events
app.post("/create-events", async (req, res) => {
  if (!fs.existsSync("token.json")) {
    return res
      .status(401)
      .json({ error: "Not authorized. Visit /auth first." });
  }

  const tokens = JSON.parse(fs.readFileSync("token.json"));
  oAuth2Client.setCredentials(tokens);

  const calendar = google.calendar({ version: "v3", auth: oAuth2Client });
  const { startDate, endDate, count = 5 } = req.body;

  const events = [];
  for (let i = 0; i < count; i++) {
    const start = new Date(startDate);
    start.setDate(start.getDate() + Math.floor(Math.random() * 5));
    start.setHours(Math.floor(Math.random() * 10) + 8);
    const end = new Date(start);
    end.setHours(start.getHours() + 1);

    const event = {
      summary: `Fake Event #${i + 1}`,
      start: { dateTime: start.toISOString(), timeZone: "Asia/Kolkata" },
      end: { dateTime: end.toISOString(), timeZone: "Asia/Kolkata" },
    };

    await calendar.events.insert({ calendarId: "primary", resource: event });
    events.push(event.summary);
  }

  res.json({ message: "Events created", created: events });
});

app.listen(3000, () => console.log("✅ Running on http://localhost:3000"));
