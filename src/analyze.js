const { GoogleGenerativeAI } = require("@google/generative-ai");
import { generatePrompt, defaultTopics } from "./prompt";
import { isValidUrl } from "./background";

export async function analyze(url, signal) {
  const content = await getJinaReaderContent(url, signal);
  const analysis = await analyzePage(content, signal);
  return { content, analysis };
}

export async function getJinaReaderContent(url, signal) {
  console.log("Attempting content extraction for:", url);

  if (!isValidUrl(url)) {
    console.warn("Invalid URL detected:", url);
    throw new Error("Invalid URL");
  }

  const jinaUrl = `https://r.jina.ai/${url}`;
  console.log("Fetching from Jina Reader:", jinaUrl);

  try {
    const response = await fetch(jinaUrl, {
      headers: {
        Accept: "text/plain",
        "Accept-Language": "en-US,en;q=0.5",
      },
      signal,
    });

    if (!response.ok) {
      console.error("Jina Reader request failed:", {
        status: response.status,
        statusText: response.statusText,
        url: jinaUrl,
      });
      throw new Error(`Jina Reader request failed: ${response.status}`);
    }

    const text = await response.text();
    console.log("Raw content length:", text.length);

    const cleanText = text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    console.log("Cleaned content length:", cleanText.length);

    if (!cleanText || cleanText.length < 100) {
      console.warn("Insufficient content:", {
        length: cleanText.length,
        preview: cleanText.substring(0, 100),
      });
      throw new Error("Insufficient content from Jina Reader");
    }

    return cleanText;
  } catch (error) {
    console.error("Content extraction failed:", {
      error: error.message,
      url: url,
    });
    throw error;
  }
}

export async function analyzePage(content, signal) {
  console.log("Starting content analysis");

  const { modelName, apiKey, focusTopics } = await chrome.storage.sync.get([
    "modelName",
    "apiKey",
    "focusTopics",
  ]);

  console.log("Analysis configuration:", {
    model: modelName ?? "Gemini",
    hasFocusTopics: !!focusTopics,
    hasApiKey: !!apiKey,
    contentLength: content.length,
  });

  if (!apiKey) {
    console.error("Missing API key in settings");
    throw new Error("Missing API Key");
  }

  const truncatedContent = content.substring(0, 500);
  const topics = focusTopics ?? defaultTopics;
  const model = modelName ?? "Gemini";
  const basePrompt = generatePrompt(topics);

  return model === "ChatGPT"
    ? await analyzeWithChatGPT(truncatedContent, basePrompt, apiKey, signal)
    : await analyzeWithGemini(truncatedContent, basePrompt, apiKey);
}

async function analyzeWithChatGPT(content, basePrompt, apiKey, signal) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: basePrompt },
        { role: "user", content: content },
      ],
      temperature: 0.7,
    }),
    signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}${
        errorData ? " - " + JSON.stringify(errorData) : ""
      }`
    );
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

async function analyzeWithGemini(content, basePrompt, apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(`${basePrompt} ${content}`);
  const markdownEnclosed = result.response.text();
  const json = markdownEnclosed.substring(8, markdownEnclosed.length - 4);
  return JSON.parse(json);
}
