const { GoogleGenerativeAI } = require("@google/generative-ai");
import { generatePrompt, defaultTopics } from "./prompt";

export async function analyze(url) {
  const content = await getJinaReaderContent(url);
  const response = await analyzePage(content);
  return response;
}

// Update getJinaReaderContent function
export async function getJinaReaderContent(url) {
  try {
    console.log("Starting Jina Reader extraction for URL:", url);
    const cleanUrl = url.replace(/^https?:\/\/r\.jina\.ai\//, "");
    const jinaUrl = `https://r.jina.ai/${cleanUrl}`;
    console.log("Constructed Jina URL:", jinaUrl);

    const response = await fetch(jinaUrl, {
      headers: {
        Accept: "text/plain",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    if (!response.ok) {
      throw new Error(`Jina Reader request failed: ${response.status}`);
    }

    const text = await response.text();

    // Use regex to extract the main content
    // Remove HTML tags and keep text content
    const cleanText = text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove scripts
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "") // Remove styles
      .replace(/<[^>]+>/g, " ") // Remove HTML tags
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();

    if (!cleanText || cleanText.length < 100) {
      throw new Error("Insufficient content from Jina Reader");
    }

    console.log("Successfully extracted content, length:", cleanText.length);
    return cleanText;
  } catch (error) {
    console.error("Jina Reader error:", error);
    throw error;
  }
}
// Toggle flag for automatic content analysis
const AUTO_ANALYZE = false; // Set to true to enable automatic analysis

export async function analyzePage(content) {
  try {
    const { modelName, apiKey, focusTopics } = await chrome.storage.sync.get([
      "modelName",
      "apiKey",
      "focusTopics",
    ]);

    if (!apiKey) {
      throw new Error("Missing api Key");
    }

    content = content.substring(0, 500);
    modelName ??= "Gemini";
    focusTopics ??= defaultTopics;

    const basePrompt = generatePrompt(focusTopics);

    if (modelName == "ChatGPT") {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      const apiEndpoint = "https://api.openai.com/v1/chat/completions";

      console.log("Making API request to:", apiEndpoint);
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: basePrompt,
            },
            {
              role: "user",
              content: content,
            },
          ],
          temperature: 0.7,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        alert(
          `API request failed: ${response.status} ${response.statusText}${
            errorData ? " - " + JSON.stringify(errorData) : ""
          }`,
        );
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}${
            errorData ? " - " + JSON.stringify(errorData) : ""
          }`,
        );
      }

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } else if (modelName == "Gemini") {
      const fullPrompt = `${basePrompt} ${content}`;
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(fullPrompt);

      const markdownEnclosed = result.response.text();
      const json = markdownEnclosed.substring(8, markdownEnclosed.length - 4);
      return JSON.parse(json);
    } else {
      alert("Error: No model chosen");
    }
  } catch (error) {
    throw new Error(`${error.message} (${error.name})`);
  }
}
