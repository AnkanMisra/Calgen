import { EVENT_GENERATION_PROMPT } from "./prompts.js";

// Test AI generation with same input that failed
async function testAIGeneration() {
  const userInput = "Home Routine and Self care";
  const eventCount = 5;

  console.log("Testing AI generation with:");
  console.log("User input:", userInput);
  console.log("Event count:", eventCount);
  console.log("---");

  const prompt = EVENT_GENERATION_PROMPT(eventCount, userInput);
  console.log("Generated prompt:");
  console.log(prompt);
  console.log("---");

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://calgen.com",
          "X-Title": "CalGen",
        },
        body: JSON.stringify({
          model: process.env.OPENROUTER_MODEL,
          messages: [{ role: "user", content: prompt }],
        }),
      },
    );

    console.log("AI Response status:", response.status);

    if (!response.ok) {
      console.error("AI API error:", response.status, response.statusText);
      return;
    }

    const data = await response.json();
    console.log("Raw AI response:");
    console.log(JSON.stringify(data, null, 2));
    console.log("---");

    const content = data.choices?.[0]?.message?.content;
    console.log("Extracted content:");
    console.log(content);
    console.log("---");

    if (!content) {
      console.error("No content in AI response");
      return;
    }

    let parsedContent;
    try {
      const cleanContent = content.replace(/```json\n?|\n?```/g, "").trim();
      console.log("Cleaned content:");
      console.log(cleanContent);
      console.log("---");

      parsedContent = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse JSON:", parseError.message);
      return;
    }

    const events = parsedContent.events || [];
    console.log("Number of events generated:", events.length);
    console.log("Events:");
    events.forEach((event, index) => {
      console.log(
        `${index + 1}. ${event.title} (${event.duration}min) - ${event.description ? "Has description" : "No description"}`,
      );
    });
  } catch (error) {
    console.error("Test failed:", error.message);
  }
}

// Check if environment variables are available
if (!process.env.OPENROUTER_API_KEY) {
  console.error("Missing OPENROUTER_API_KEY environment variable");
  process.exit(1);
}

if (!process.env.OPENROUTER_MODEL) {
  console.error("Missing OPENROUTER_MODEL environment variable");
  process.exit(1);
}

console.log("Environment validated successfully");

testAIGeneration();
