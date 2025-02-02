const { GoogleGenerativeAI } = require("@google/generative-ai");
import { TabTimer } from "./TabTimer";
import { BackgroundResponse } from "./types";
import { generatePrompt, defaultTopics } from "./prompt";

async function analyzeGemini(prompt, apiKey, geminiModelName) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: geminiModelName });
  const result = await model.generateContent(prompt);
  console.log(result);
  console.log(result.response.text());
  return result.response.text();
}

// Toggle flag for automatic content analysis
const AUTO_ANALYZE = false; // Set to true to enable automatic analysis

export async function analyzePage(content) {
  try {
    const { modelName, apiKey, apiEndpoint, focusTopics } =
      await chrome.storage.sync.get([
        "modelName",
        "apiKey",
        "apiEndpoint",
        "focusTopics",
      ]);

    if (typeof content !== "string") {
      throw new Error("Invalid content format");
    }
    if (!apiKey) {
      throw new Error("Missing api Key");
    }

    content = content.substring(0, 500);
    modelName ??= "Gemini";
    focusTopics ??= defaultTopics;
    apiEndpoint ??= "https://api.openai.com/v1/chat/completions";

    const basePrompt = generatePrompt(focusTopics); // uses defaultTopics if none are fed

    if (modelName == "ChatGPT") {
      if (!apiEndpoint) {
        throw new Error("Missing required configuration");
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

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
      return data.choices[0].message.content;
    } else if (modelName == "Gemini") {
      const fullPrompt = `${basePrompt} ${content}`;
      const markdownEnclosed = await analyzeGemini(
        fullPrompt,
        apiKey,
        "gemini-1.5-flash",
      );
      return markdownEnclosed.substring(8, markdownEnclosed.length - 4);
    }
  } catch (error) {
    throw new Error(`${error.message} (${error.name})`);
  }
}

function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return null;
  }
}

const processedDomains = new Map();

// Add at the top with other initializations
const tabTimer = new TabTimer();

// Check all tabs periodically for time-based notifications
setInterval(() => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([activeTab]) => {
    if (activeTab) {
      console.log("\n=== Checking Active Tab ===");
      console.log("Active Tab:", activeTab.id, activeTab.url);

      const notifications = tabTimer.checkTimeAndNotify(activeTab.id);
      console.log("Notifications returned:", notifications);

      // Show notifications for active tab if any
      notifications.forEach((notification) => {
        console.log("Sending notification:", notification);
        chrome.tabs.sendMessage(activeTab.id, {
          action: "showNotification",
          analysis: {
            topics: ["Time Alert"],
            reason: notification.message,
            timeSpent: notification.timeSpent,
          },
        });
      });
    }
  });
}, 5000);

// Update the message listener to handle Jina content requests
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log(request);
  if (request.action === "analyzeContent") {
    analyzePage(request.content)
      .then((analysis) =>
        sendResponse(BackgroundResponse.createSuccess(analysis)),
      )
      .catch((error) =>
        sendResponse(BackgroundResponse.createError(error.message)),
      );
    return true;
  }

  if (request.action === "getJinaContent") {
    if (!isValidUrl(request.url)) {
      sendResponse(BackgroundResponse.createError("Invalid URL"));
      return true;
    }

    getJinaReaderContent(request.url)
      .then((content) =>
        sendResponse(BackgroundResponse.createSuccess(null, content)),
      )
      .catch((error) =>
        sendResponse(BackgroundResponse.createError(error.message)),
      );
    return true;
  }

  if (request.action === "notificationResponse") {
    console.log("User response to notification:", request.response);
    sendResponse(BackgroundResponse.createSuccess());
  }
});

// Update getJinaReaderContent function
async function getJinaReaderContent(url) {
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

// Update the tab listener to handle both initial and time notifications
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url && isValidUrl(tab.url)) {
    const domain = getDomain(tab.url);
    const lastDomain = processedDomains.get(tabId);

    if (domain && domain !== lastDomain) {
      processedDomains.set(tabId, domain);
      tabTimer.startTracking(tabId, domain);

      if (AUTO_ANALYZE) {
        // Show initial domain notification
        mockAnalysis().then((analysis) => {
          const parsedAnalysis = JSON.parse(analysis);
          chrome.tabs.sendMessage(tabId, {
            action: "showNotification",
            analysis: parsedAnalysis,
          });
        });
      }
    }
  }
});

// Helper function to validate URLs
function isValidUrl(url) {
  try {
    const urlObj = new URL(url);
    return (
      ["http:", "https:"].includes(urlObj.protocol) &&
      !url.startsWith("https://r.jina.ai/")
    );
  } catch {
    return false;
  }
}

// Add cleanup for tab timer
chrome.tabs.onRemoved.addListener((tabId) => {
  processedDomains.delete(tabId);
  tabTimer.stopTracking(tabId);
});

// Handle tab activation
chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs.get(tabId, (tab) => {
    if (tab.url && isValidUrl(tab.url)) {
      const domain = getDomain(tab.url);
      if (domain) {
        tabTimer.updateLastActiveTime(tabId);
        const pendingNotification = tabTimer.checkPendingNotifications(tabId);
        if (pendingNotification) {
          chrome.tabs.sendMessage(tabId, {
            action: "showNotification",
            analysis: {
              topics: ["Time Alert"],
              reason: pendingNotification.message,
              timeSpent: pendingNotification.timeSpent,
            },
          });
        }
      }
    }
  });
});

// Add window focus change handler
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId !== chrome.windows.WINDOW_ID_NONE) {
    chrome.tabs.query({ active: true, windowId }, ([tab]) => {
      if (tab && tab.url && isValidUrl(tab.url)) {
        tabTimer.updateLastActiveTime(tab.id);
      }
    });
  }
});
