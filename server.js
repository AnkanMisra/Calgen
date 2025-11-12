import express from "express";
import { google } from "googleapis";
import fs from "fs";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import { randomBytes } from "crypto";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Multiple API Keys for rotation and rate limit handling
const API_KEYS = [
  process.env.OPENROUTER_API_KEY,
  process.env.OPENROUTER_API_KEY_2,
  process.env.OPENROUTER_API_KEY_3,
  process.env.OPENROUTER_API_KEY_4,
].filter((key) => key && key.trim() !== ""); // Filter out null/empty keys

let currentKeyIndex = 0;

// Function to get next API key
const getNextApiKey = () => {
  const key = API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  console.log(
    `Using API key index: ${currentKeyIndex} (Total keys: ${API_KEYS.length})`,
  );
  return key;
};

// Function to get API key with retry
const getApiKeyWithRetry = (failedKeyIndex = null) => {
  if (failedKeyIndex !== null) {
    // Skip the failed key
    currentKeyIndex = (failedKeyIndex + 1) % API_KEYS.length;
  }
  return API_KEYS[currentKeyIndex];
};

// Validate required environment variables
const validateEnvironment = () => {
  if (API_KEYS.length === 0) {
    console.error(
      "❌ No OpenRouter API keys configured! Please add OPENROUTER_API_KEY to your .env file",
    );
    process.exit(1);
  }

  if (!process.env.OPENROUTER_MODEL) {
    console.error(
      "❌ OPENROUTER_MODEL not configured! Please add it to your .env file",
    );
    process.exit(1);
  }

  console.log(
    `Environment validated: ${API_KEYS.length} API keys, model: ${process.env.OPENROUTER_MODEL}`,
  );
};

validateEnvironment();

// Import configuration modules
import {
  EVENT_GENERATION_PROMPT,
  FALLBACK_EVENTS,
  DURATION_GUIDELINES,
  SCHEDULING_CONSTRAINTS,
} from "./prompts.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Rate limiting middleware (commented out - requires ESM compatible package)
// const rateLimit = require("express-rate-limit");
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
//   message: "Too many requests from this IP, please try again later.",
//   standardHeaders: true,
//   legacyHeaders: false,
// });
//
// app.use(limiter);
app.use(bodyParser.json());

// Serve static files -优先使用React构建文件，开发时fallback到public
const isProduction = process.env.NODE_ENV === "production";
app.use(express.static(isProduction ? "frontend/dist" : "public"));

// Load credentials - configurable via environment variable
const credentialsPath =
  process.env.GOOGLE_CREDENTIALS_PATH || "credentials.json";
if (!fs.existsSync(credentialsPath)) {
  console.error(`❌ Google credentials file not found at: ${credentialsPath}`);
  console.error(
    "Please download your Google OAuth credentials and place them in credentials.json",
  );
  process.exit(1);
}
const credentials = JSON.parse(fs.readFileSync(credentialsPath));
const { client_secret, client_id, redirect_uris } = credentials.web;

const oAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0],
);

// Google People API for user info
const people = google.people({ version: "v1", auth: oAuth2Client });

// Generate dynamic event titles based on user input using AI with retry logic
async function generateDynamicEventTitles(
  userInput,
  eventCount,
  retryCount = 0,
) {
  console.log(`[AI] Request ${retryCount > 0 ? `(Retry ${retryCount})` : ""}:`);
  console.log(`   • Input: "${userInput}"`);
  console.log(`   • Events requested: ${eventCount}`);
  console.log(`   • Model: ${process.env.OPENROUTER_MODEL}`);
  console.log(`   • API Key Index: ${currentKeyIndex + 1}/${API_KEYS.length}`);

  try {
    const prompt = EVENT_GENERATION_PROMPT(eventCount, userInput);
    const apiKey = getApiKeyWithRetry(retryCount > 0 ? null : currentKeyIndex);

    console.log(`Generating prompt (${prompt.length} chars)...`);
    console.log(`   • Preview: "${prompt.substring(0, 100)}..."`);

    // Add timeout for faster AI model
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    console.log(`[API] Sending request to OpenRouter...`);
    const requestStartTime = Date.now();

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey.substring(0, 10)}...`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://fake-calendar-filler.com",
          "X-Title": "Fake Calendar Filler",
        },
        body: JSON.stringify({
          model: process.env.OPENROUTER_MODEL,
          messages: [{ role: "user", content: prompt }],
        }),
        signal: controller.signal,
      },
    );

    clearTimeout(timeoutId);

    const requestTime = Date.now() - requestStartTime;
    console.log(
      `[API] Response received in ${requestTime}ms (Status: ${response.status})`,
    );

    if (!response.ok) {
      console.error(
        "OpenRouter API error:",
        response.status,
        response.statusText,
      );
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[API] Response analysis:`);
    console.log(`   • Choices received: ${data.choices?.length || 0}`);
    console.log(`   • Usage: ${JSON.stringify(data.usage || "N/A")}`);
    console.log(`   • Model: ${data.model || "N/A"}`);

    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error(
        `❌ No content in response! Full data:`,
        JSON.stringify(data, null, 2),
      );
      throw new Error("No content received from OpenRouter API");
    }

    console.log(`AI Response content (${content.length} chars):`);
    console.log(`   • Preview: "${content.substring(0, 200)}..."`);

    // Try to parse the JSON response
    let parsedContent;
    try {
      // Remove any markdown formatting that might be present
      const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
      console.log(`Cleaned content: "${cleanContent.substring(0, 100)}..."`);
      parsedContent = JSON.parse(cleanContent);
      console.log(`JSON parsed successfully`);
    } catch (parseError) {
      console.error("❌ Failed to parse OpenRouter response:", parseError);
      console.error("Raw content:", content);
      throw new Error("Failed to parse AI response as JSON");
    }

    const events = parsedContent.events || [];
    console.log(
      `AI generated ${events.length} events out of requested ${eventCount}`,
    );

    if (events.length > 0) {
      console.log(`Generated events preview:`);
      events.forEach((event, index) => {
        console.log(
          `   ${index + 1}. "${event.title}" (${event.duration}min) - ${event.description ? "Has description" : "No description"}`,
        );
      });
    }

    if (events.length === 0) {
      throw new Error("No events generated in response");
    }

    if (events.length < eventCount) {
      console.warn(
        `Warning: AI returned only ${events.length} events instead of requested ${eventCount}`,
      );
    }

    return events;
  } catch (error) {
    console.error("Error generating dynamic event titles:", error.message);

    // Retry with different API key if we have more keys and this is a rate limit error
    if (
      retryCount < API_KEYS.length - 1 &&
      (error.message.includes("429") || error.message.includes("rate limit"))
    ) {
      console.log(
        `Retrying with different API key (attempt ${retryCount + 1}/${API_KEYS.length})`,
      );
      return await generateDynamicEventTitles(
        userInput,
        eventCount,
        retryCount + 1,
      );
    }

    // Fallback to predefined events based on user input if AI fails
    const fallbackEvents = generateFallbackEvents(userInput, eventCount);
    console.log("Using fallback events due to AI error");
    return fallbackEvents;
  }
}

// Generate fallback events when AI fails
function generateFallbackEvents(userInput, eventCount) {
  const input = userInput.toLowerCase();

  // Determine which category to use based on user input
  let selectedCategory = "personal"; // default

  if (
    input.includes("work") ||
    input.includes("job") ||
    input.includes("office") ||
    input.includes("meeting")
  ) {
    selectedCategory = "work";
  } else if (
    input.includes("study") ||
    input.includes("academic") ||
    input.includes("school") ||
    input.includes("college") ||
    input.includes("university")
  ) {
    selectedCategory = "academic";
  } else if (
    input.includes("gym") ||
    input.includes("exercise") ||
    input.includes("fitness") ||
    input.includes("workout")
  ) {
    selectedCategory = "personal";
  }

  const events =
    FALLBACK_EVENTS[selectedCategory] || FALLBACK_EVENTS["personal"];

  // Generate required number of events
  const result = [];
  for (let i = 0; i < eventCount; i++) {
    const event = events[i % events.length];
    result.push({
      ...event,
      title: `${event.title} ${i >= events.length ? `(${Math.floor(i / events.length) + 1})` : ""}`,
    });
  }

  return result;
}

const generateUniqueId = () => {
  return `fcf_${randomBytes(8).toString("hex")}`; // fcf = funny calendar filler
};

// Helper function to ensure valid tokens and refresh if needed
const ensureValidTokens = async () => {
  try {
    if (!fs.existsSync("token.json")) {
      throw new Error("No token file exists");
    }

    const tokenData = JSON.parse(fs.readFileSync("token.json"));

    // Set the credentials
    oAuth2Client.setCredentials(tokenData);

    // If we have a refresh token, try to refresh the access token
    if (tokenData.refresh_token) {
      try {
        const { credentials } = await oAuth2Client.refreshAccessToken();

        // Update the stored token data
        const updatedTokenData = {
          ...tokenData,
          ...credentials,
          created_at: new Date().toISOString(),
          expires_at:
            credentials.expiry_date ||
            new Date(Date.now() + 3600000).toISOString(),
        };

        fs.writeFileSync(
          "token.json",
          JSON.stringify(updatedTokenData, null, 2),
        );
        console.log("Token refreshed successfully");
        return updatedTokenData;
      } catch (refreshError) {
        console.warn("Failed to refresh token:", refreshError.message);
        // Continue with existing tokens, might still work
      }
    }

    return tokenData;
  } catch (error) {
    console.error("Error ensuring valid tokens:", error.message);
    throw error;
  }
};

const checkAuthStatus = async () => {
  try {
    if (!fs.existsSync("token.json")) {
      return { authenticated: false, reason: "No token file" };
    }

    // Use the new token refresh logic
    const tokens = await ensureValidTokens();
    if (!tokens.access_token && !tokens.refresh_token) {
      return { authenticated: false, reason: "Invalid token format" };
    }

    // Get user info
    let userInfo = null;
    try {
      const response = await people.people.get({
        resourceName: "people/me",
        personFields: "names,emailAddresses,photos",
      });

      const person = response.data;
      const name = person.names?.[0]?.displayName || "Unknown";
      const email = person.emailAddresses?.[0]?.value || "Unknown";
      const photo = person.photos?.[0]?.url || null;

      userInfo = { name, email, photo };
    } catch (error) {
      console.warn(
        "Could not fetch user info (People API may need to be enabled):",
        error.message,
      );
      userInfo = { name: "Unknown", email: "Unknown", photo: null };
    }

    return {
      authenticated: true,
      reason: "Token valid",
      user: userInfo,
    };
  } catch (error) {
    return {
      authenticated: false,
      reason: `Error reading token: ${error.message}`,
    };
  }
};

// Simple version for non-async calls (fallback)
const checkAuthStatusSync = () => {
  try {
    if (!fs.existsSync("token.json")) {
      return { authenticated: false, reason: "No token file" };
    }

    const tokens = JSON.parse(fs.readFileSync("token.json"));
    if (!tokens.access_token && !tokens.refresh_token) {
      return { authenticated: false, reason: "Invalid token format" };
    }

    return { authenticated: true, reason: "Token valid" };
  } catch (error) {
    return {
      authenticated: false,
      reason: `Error reading token: ${error.message}`,
    };
  }
};

// 1️⃣ Step 1: Redirect user to Google OAuth (updated for refresh tokens)
app.get("/auth", (req, res) => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline", // Important: This gets us a refresh token
    prompt: "consent", // Important: This forces consent dialog to get refresh token
    scope: [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ],
  });
  res.redirect(authUrl);
});

// 2️⃣ Step 2: Handle OAuth redirect - redirect to React app
app.get("/oauth2callback", async (req, res) => {
  try {
    const { code } = req.query;
    const { tokens } = await oAuth2Client.getToken(code);

    // Validate we got a refresh token
    if (!tokens.refresh_token) {
      console.warn(
        "No refresh token received. User may have already authorized the app.",
      );
    }

    oAuth2Client.setCredentials(tokens);

    // Store tokens with additional metadata
    const tokenData = {
      ...tokens,
      created_at: new Date().toISOString(),
      expires_at:
        tokens.expiry_date || new Date(Date.now() + 3600000).toISOString(), // 1 hour from now if not provided
    };

    fs.writeFileSync("token.json", JSON.stringify(tokenData, null, 2));

    // In development, redirect to Vite dev server
    // In production, redirect to same origin (React app)
    const frontendUrl =
      process.env.NODE_ENV === "production" ? "/" : "http://localhost:5173";

    res.redirect(frontendUrl);
  } catch (error) {
    console.error("OAuth callback error:", error);
    res.status(500).send(`
      <html>
        <body style="font-family: system-ui, -apple-system, sans-serif; max-width: 500px; margin: 50px auto; padding: 20px;">
          <div style="background: #fee; border: 1px solid #fcc; padding: 20px; border-radius: 8px;">
            <h2 style="color: #c33; margin-top: 0;">❌ Authorization Failed</h2>
            <p style="color: #666;">${error.message}</p>
            <a href="/" style="color: #0066cc; text-decoration: none; font-weight: 500;">← Try Again</a>
          </div>
        </body>
      </html>
    `);
  }
});

// 3️⃣ NEW: Check authentication status
app.get("/api/auth/status", async (req, res) => {
  try {
    const status = await checkAuthStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({
      authenticated: false,
      reason: "Server error checking auth status",
      error: error.message,
    });
  }
});

// 3️⃣🚫 NEW: Logout endpoint
app.post("/api/auth/logout", (req, res) => {
  try {
    // Remove token file
    if (fs.existsSync("token.json")) {
      fs.unlinkSync("token.json");
    }

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error during logout",
      error: error.message,
    });
  }
});

// 4️⃣ ENHANCED: Generate fake events with categories
app.post("/api/events", async (req, res) => {
  try {
    if (!fs.existsSync("token.json")) {
      return res.status(401).json({
        error: "Not authorized. Visit /auth first.",
      });
    }

    // Validate request body
    const {
      startDate,
      endDate,
      count = 5,
      userInput = "general activities",
      timezone = "America/New_York",
      earliestStartTime = 8, // Default 8 AM start time
    } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: "startDate and endDate are required",
      });
    }

    if (count < 1 || count > 10) {
      return res.status(400).json({
        error: "Count must be between 1 and 10",
      });
    }

    // Use the new token refresh logic
    const tokens = await ensureValidTokens();

    const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

    // Generate event titles with optimized parallel chunking for speed
    console.log(`Generating ${count} event titles with fast AI...`);
    const aiStartTime = Date.now();

    let eventTitles;
    if (count <= 6) {
      // Single request for small counts
      eventTitles = await generateDynamicEventTitles(userInput, count);
    } else {
      // Parallel requests for large counts (split into chunks of 4 for max speed)
      const chunkSize = 2;
      const chunks = [];
      for (let i = 0; i < count; i += chunkSize) {
        const chunkCount = Math.min(chunkSize, count - i);
        chunks.push(generateDynamicEventTitles(userInput, chunkCount));
      }

      console.log(
        `Making ${chunks.length} parallel AI requests (${chunkSize} events each)...`,
      );
      const chunkResults = await Promise.allSettled(chunks);

      eventTitles = [];
      chunkResults.forEach((result, index) => {
        if (result.status === "fulfilled") {
          eventTitles = eventTitles.concat(result.value);
        } else {
          console.warn(`AI chunk ${index + 1} failed:`, result.reason);
          // Add fallback events for failed chunk
          const fallbackCount = Math.min(chunkSize, count - eventTitles.length);
          const fallbackEvents = generateFallbackEvents(
            userInput,
            fallbackCount,
          );
          eventTitles = eventTitles.concat(fallbackEvents);
        }
      });
    }

    const aiTime = Date.now() - aiStartTime;
    console.log(
      `AI generation completed in ${aiTime}ms (${(aiTime / 1000).toFixed(1)}s)`,
    );

    // Check if AI returned enough events, if not, fill with fallback events
    if (eventTitles.length < count) {
      console.log(
        `AI returned only ${eventTitles.length} events, generating ${count - eventTitles.length} fallback events`,
      );
      const fallbackEvents = generateFallbackEvents(
        userInput,
        count - eventTitles.length,
      );
      eventTitles = [...eventTitles, ...fallbackEvents];
    }

    // Ensure we have exactly the requested number of events
    eventTitles = eventTitles.slice(0, count);
    console.log(`Total events to create: ${eventTitles.length}`);

    // Create events with durations and no overlaps
    const scheduledEvents = [];
    const createdEvents = [];
    let skippedEvents = 0; // Track skipped events for debugging

    console.log(`Creating ${count} events with improved scheduling...`);
    console.log(`Date range: ${startDate} to ${endDate}`);
    const startTime = Date.now();

    // Calculate total days in range (inclusive)
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    // Add 1 to make it inclusive and ensure minimum 1 day
    const totalDays = Math.max(
      1,
      Math.ceil((endDateObj - startDateObj) / (1000 * 60 * 60 * 24)) + 1,
    );
    console.log(
      `Total days in range: ${totalDays} (${startDateObj.toDateString()} to ${endDateObj.toDateString()})`,
    );

    for (let i = 0; i < count; i++) {
      let eventData = eventTitles[i];

      // Validate event data
      if (!eventData || !eventData.duration) {
        console.error(`Invalid event data at index ${i}:`, eventData);
        // Create a default event to maintain requested count
        eventData = {
          title: `Generated Event ${i + 1}`,
          duration: 60,
          description: `Default event generated due to invalid data at index ${i}`,
        };
      }

      // Distribute events evenly across the date range
      const start = new Date(startDate);

      // Validate that the initial date is valid
      if (isNaN(start.getTime())) {
        skippedEvents++;
        console.error(
          `[ERROR] Invalid base date for event ${i + 1}:`,
          startDate,
        );
        console.log(`[DEBUG] Skipped events so far: ${skippedEvents}/${i + 1}`);
        continue;
      }

      // Better distribution: spread events across all available days
      const daysOffset = Math.floor(
        (i / Math.max(1, count - 1)) * Math.max(1, totalDays - 1),
      );
      // Add small randomness to avoid mechanical placement
      const randomVariation = Math.random() < 0.3 ? 1 : 0; // 30% chance to shift by 1 day
      const totalDayOffset = daysOffset + randomVariation;

      // Create a new date with the offset using milliseconds for robustness
      const offsetDate = new Date(start.getTime() + (totalDayOffset * 24 * 60 * 60 * 1000));

      // Validate the offset date
      if (isNaN(offsetDate.getTime())) {
        skippedEvents++;
        console.error(`[ERROR] Invalid offset date for event ${i + 1}:`, {
          originalDate: start.toString(),
          totalDayOffset,
          offsetDate: offsetDate.toString(),
        });
        console.log(`[DEBUG] Skipped events so far: ${skippedEvents}/${i + 1}`);
        continue;
      }

      // Additional validation: check if date is reasonable (within 1 year)
      const now = new Date();
      const oneYearFromNow = new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000));
      if (offsetDate < now || offsetDate > oneYearFromNow) {
        skippedEvents++;
        console.error(`[ERROR] Date out of reasonable range for event ${i + 1}:`, {
          originalDate: start.toString(),
          totalDayOffset,
          offsetDate: offsetDate.toString(),
        });
        console.log(`[DEBUG] Skipped events so far: ${skippedEvents}/${i + 1}`);
        continue;
      }

      // Set start time with variety within user's preferred timezone (start time to 1 AM)
      const hourVariation = Math.floor(Math.random() * 4) - 1; // -1 to +2 hours variety
      // Calculate max start time to ensure event ends before 1 AM next day
      const maxStartHour = Math.max(
        earliestStartTime,
        24 - Math.ceil(eventData.duration / 60) - 1,
      );
      const finalHour = Math.max(
        earliestStartTime,
        Math.min(maxStartHour, earliestStartTime + hourVariation),
      );
      const minuteVariation = Math.floor(Math.random() * 60); // 0-59 minutes

      // Create the start time in user's local timezone
      offsetDate.setHours(finalHour, minuteVariation, 0, 0);

      // Validate the start date before proceeding
      if (isNaN(offsetDate.getTime())) {
        skippedEvents++;
        console.error(
          `[ERROR] Invalid start date for event ${i + 1}:`,
          offsetDate.toString(),
        );
        console.log(`[DEBUG] Skipped events so far: ${skippedEvents}/${i + 1}`);
        continue;
      }

      console.log(
        `Event ${i + 1}: ${eventData.title} - Local time: ${offsetDate.toLocaleString("en-US", { timeZone: timezone, hour: "2-digit", minute: "2-digit" })}`,
      );

      // Simplified time slot finding - just check for major overlaps
      let finalStart = new Date(offsetDate);
      let finalEnd = new Date(finalStart); // Use finalStart, not start
      finalEnd.setMinutes(finalEnd.getMinutes() + eventData.duration);

      // Validate initial dates
      if (isNaN(finalStart.getTime()) || isNaN(finalEnd.getTime())) {
        skippedEvents++;
        console.error(`[ERROR] Invalid initial dates for event ${i + 1}:`, {
          finalStart: finalStart.toString(),
          finalEnd: finalEnd.toString(),
        });
        console.log(`[DEBUG] Skipped events so far: ${skippedEvents}/${i + 1}`);
        continue;
      }

      // Simple overlap check with limited attempts and 1 AM constraint
      let attempts = 0;
      const maxAttempts = 20; // Much reduced for performance

      while (attempts < maxAttempts) {
        let hasOverlap = false;

        // Check if event would end after 1 AM in user's timezone
        const eventEndHour = finalEnd.getHours();
        if (eventEndHour >= 1 && eventEndHour < earliestStartTime) {
          // Move to next day at user's preferred start time
          const nextDay = new Date(finalStart);
          nextDay.setDate(nextDay.getDate() + 1);
          nextDay.setHours(earliestStartTime, 0, 0, 0);

          // Validate the new date
          if (!isNaN(nextDay.getTime())) {
            finalStart = nextDay;
            finalEnd = new Date(finalStart);
            finalEnd.setMinutes(finalEnd.getMinutes() + eventData.duration);
          } else {
            console.error(
              `[ERROR] Invalid next day calculation for event ${i + 1}`,
            );
            break;
          }
          attempts++;
          continue;
        }

        // Check overlap with existing events
        for (const event of scheduledEvents) {
          if (finalStart < event.end && finalEnd > event.start) {
            hasOverlap = true;
            // Move to next available slot
            const nextSlot = new Date(event.end);
            nextSlot.setMinutes(nextSlot.getMinutes() + 15); // 15 min buffer

            // Validate the new slot
            if (!isNaN(nextSlot.getTime())) {
              finalStart = nextSlot;
              finalEnd = new Date(finalStart);
              finalEnd.setMinutes(finalEnd.getMinutes() + eventData.duration);
            } else {
              console.error(
                `[ERROR] Invalid next slot calculation for event ${i + 1}`,
              );
              break;
            }
            break;
          }
        }

        if (!hasOverlap) break;
        attempts++;
      }

      const timeSlot = { start: finalStart, end: finalEnd };

      // Validate that we have valid dates
      if (isNaN(finalStart.getTime()) || isNaN(finalEnd.getTime())) {
        skippedEvents++;
        console.error(`[ERROR] Invalid date generated for event ${i + 1}:`, {
          finalStart: finalStart.toString(),
          finalEnd: finalEnd.toString(),
          eventData: eventData,
        });
        console.log(`[DEBUG] Skipped events so far: ${skippedEvents}/${i + 1}`);
        // Skip this event and continue
        continue;
      }

      const event = {
        summary: eventData.title || `Generated Event ${i + 1}`,
        description:
          eventData.description ||
          `Generated by Funny Calendar Filler | User request: "${userInput.replace(/[^a-zA-Z0-9\s]/g, "").substring(0, 100)}" | Duration: ${eventData.duration} minutes`,
        start: { dateTime: timeSlot.start.toISOString(), timeZone: timezone },
        end: { dateTime: timeSlot.end.toISOString(), timeZone: timezone },
        extendedProperties: {
          private: {
            generated_by: "funny_calendar_filler",
            user_input: userInput,
            duration: eventData.duration,
            ai_description: !!eventData.description,
          },
        },
      };

      // Add to scheduled events to prevent overlaps
      scheduledEvents.push({
        start: timeSlot.start,
        end: timeSlot.end,
        title: event.summary,
      });

      // Create the calendar event
      createdEvents.push({
        event: event,
        originalStart: start,
        duration: eventData.duration,
      });
    }

    const schedulingTime = Date.now() - startTime;
    console.log(`Scheduling completed in ${schedulingTime}ms`);
    console.log(
      `[DEBUG] Events processed: ${createdEvents.length}, Events skipped: ${skippedEvents}, Total requested: ${count}`,
    );

    // Execute all event creations in parallel
    const eventPromises = createdEvents.map(
      ({ event, originalStart, duration }) => {
        // Return a promise that resolves to the calendar insertion
        return calendar.events.insert({
          calendarId: "primary",
          resource: event,
        });
      },
    );

    // Execute all event creations in parallel
    console.log(`Creating ${count} events in parallel...`);
    const apiStartTime = Date.now();
    const eventCreationResults = await Promise.allSettled(eventPromises);
    const apiTime = Date.now() - apiStartTime;
    console.log(`Google Calendar API calls completed in ${apiTime}ms`);

    // Process results and format response
    const events = [];
    let successfulCount = 0;
    let failedCount = 0;

    eventCreationResults.forEach((result, index) => {
      if (result.status === "fulfilled") {
        const createdEvent = result.value;
        events.push({
          id: createdEvent.data.id,
          title: createdEvent.data.summary,
          start: createdEvent.data.start.dateTime,
          end: createdEvent.data.end.dateTime,
          userInput: userInput,
          duration: createdEvents[index].duration,
        });
        successfulCount++;
        console.log(
          `✅ Created: ${createdEvent.data.summary} on ${new Date(createdEvent.data.start.dateTime).toDateString()}`,
        );
      } else {
        failedCount++;
        console.error(`❌ Failed to create event ${index + 1}:`, result.reason);
        // Add a failed event to track the count
        events.push({
          id: `failed-${index}`,
          title:
            createdEvents[index]?.event?.summary || `Failed Event ${index + 1}`,
          start: new Date().toISOString(),
          end: new Date().toISOString(),
          userInput: userInput,
          duration: createdEvents[index]?.duration || 60,
          error: true,
        });
      }
    });

    const totalTime = Date.now() - startTime;
    console.log(`📊 SUMMARY:`);
    console.log(`   • Total time: ${totalTime}ms (${totalTime / 1000}s)`);
    console.log(`   • API time: ${apiTime}ms (${apiTime / 1000}s)`);
    console.log(`   • Scheduling time: ${totalTime - apiTime}ms`);
    console.log(`   • Successful: ${successfulCount}/${count} events`);
    console.log(`   • Failed: ${failedCount}/${count} events`);
    console.log(`   • Average per event: ${Math.round(apiTime / count)}ms`);

    res.json({
      message: "Events created successfully",
      created: events,
      total: successfulCount,
      successful: successfulCount,
      failed: failedCount,
      userInput: userInput,
      timezone: timezone,
    });
  } catch (error) {
    console.error("Error creating events:", error);
    res.status(500).json({
      error: "Failed to create events",
      details: "An unexpected error occurred. Please try again.",
    });
  }
});

// 5️⃣ NEW: Get events created by this app
app.get("/api/events/created", async (req, res) => {
  try {
    if (!fs.existsSync("token.json")) {
      return res.status(401).json({
        error: "Not authorized. Visit /auth first.",
      });
    }

    // Use the new token refresh logic
    const tokens = await ensureValidTokens();

    const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

    // Get events from the last 30 days
    const timeMin = new Date();
    timeMin.setDate(timeMin.getDate() - 30);
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + 30);

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    // Filter events created by this app
    const fcfEvents = response.data.items
      .filter(
        (event) =>
          event.extendedProperties?.private?.generated_by ===
          "funny_calendar_filler",
      )
      .map((event) => ({
        id: event.id,
        title: event.summary,
        start: event.start.dateTime || event.start.date,
        end: event.end.dateTime || event.end.date,
        userInput:
          event.extendedProperties?.private?.user_input || "general activities",
        htmlLink: event.htmlLink,
      }));

    res.json({
      events: fcfEvents,
      total: fcfEvents.length,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({
      error: "Failed to fetch events",
      details: "An unexpected error occurred. Please try again.",
    });
  }
});

// 6️⃣ NEW: Delete all events created by this app
app.delete("/api/events", async (req, res) => {
  try {
    if (!fs.existsSync("token.json")) {
      return res.status(401).json({
        error: "Not authorized. Visit /auth first.",
      });
    }

    // Use the new token refresh logic
    const tokens = await ensureValidTokens();

    const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

    // Get events from the last 60 days (wider range for deletion)
    const timeMin = new Date();
    timeMin.setDate(timeMin.getDate() - 60);
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + 60);

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    // Filter and delete events created by this app
    const fcfEvents = response.data.items.filter(
      (event) =>
        event.extendedProperties?.private?.generated_by ===
        "funny_calendar_filler",
    );

    // Delete all events in parallel
    console.log(`Deleting ${fcfEvents.length} events in parallel...`);
    const deletePromises = fcfEvents.map(async (event) => {
      try {
        await calendar.events.delete({
          calendarId: "primary",
          eventId: event.id,
        });
        return {
          id: event.id,
          title: event.summary,
          deleted: true,
        };
      } catch (error) {
        return {
          id: event.id,
          title: event.summary,
          deleted: false,
          error: error.message,
        };
      }
    });

    // Execute all deletions in parallel
    const deletionResults = await Promise.all(deletePromises);

    const successfulDeletions = deletionResults.filter((r) => r.deleted);
    const failedDeletions = deletionResults.filter((r) => !r.deleted);

    res.json({
      message: "Event deletion completed",
      total_found: fcfEvents.length,
      successfully_deleted: successfulDeletions.length,
      failed_deletions: failedDeletions.length,
      results: deletionResults,
    });
  } catch (error) {
    console.error("Error deleting events:", error);
    res.status(500).json({
      error: "Failed to delete events",
      details: "An unexpected error occurred. Please try again.",
    });
  }
});

// 7️⃣ LEGACY: Keep the old endpoint for backward compatibility
app.post("/create-events", async (req, res) => {
  // Convert old format to new format
  const { startDate, endDate, count = 5 } = req.body;

  // Forward to new endpoint
  const response = await fetch(`http://localhost:3000/api/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ startDate, endDate, count, category: "funny" }),
  });

  const data = await response.json();

  if (response.ok) {
    // Format response for old frontend
    res.json({
      message: data.message,
      created: data.created.map((e) => e.title),
    });
  } else {
    res.status(response.status).json(data);
  }
});

// Redirect root to React app
app.get("/", (req, res) => {
  // In development, redirect to Vite dev server
  // In production, serve React build files
  if (process.env.NODE_ENV !== "production") {
    res.redirect("http://localhost:5173");
  } else {
    res.sendFile(path.join(__dirname, "frontend", "dist", "index.html"));
  }
});

app.listen(3000, () => {
  console.log(
    "🚀 Enhanced Funny Calendar Filler running on http://localhost:3000",
  );
  console.log("Features:");
  console.log("  • AI-powered event title generation");
  console.log("  • User-defined event types (no fixed categories)");
  console.log("  • Auth status checking with user info");
  console.log("  • Event listing and deletion");
  console.log("  • Timezone support");
  console.log("  • Enhanced error handling");
});
