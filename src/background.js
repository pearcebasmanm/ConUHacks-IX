const { GoogleGenerativeAI } = require("@google/generative-ai");
import { BackgroundRequest, BackgroundResponse } from "./types";
import { TabTimer } from "./TabTimer";

const key = "";
async function analyzeGemini(prompt, apiKey, geminiModelName) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: geminiModelName });

  const result = await model.generateContent(prompt);
  console.log(result);
  console.log(result.response.text());
  return result.response.text();
}

// Temporary function for testing - always returns unfocused
async function mockAnalysis() {
  return JSON.stringify({
    isFocused: false,
    reason: "This is a test notification (LLM integration pending)",
    topics: ["Test Topic 1", "Test Topic 2"],
  });
}

// Original analysis function (commented out for now)
/*
async function analyzePage(content) {
  try {
    const { apiKey, basePrompt, apiEndpoint } = await chrome.storage.sync.get([
      "apiKey",
      "basePrompt",
      "apiEndpoint",
    ]);

    return analyzeGemini(content, key, "gemini-1.5-flash");
    // ... rest of the original function
  } catch (error) {
    console.error("Analysis error:", error);
    throw new Error(`${error.message} (${error.name})`);
  }
}
*/

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

// Toggle flag for automatic content analysis
const AUTO_ANALYZE = false; // Set to true to enable automatic analysis

// Check all tabs periodically
setInterval(() => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([activeTab]) => {
    if (activeTab) {
      const notifications = tabTimer.checkTimeAndNotify(activeTab.id);
      // Show notifications for active tab if any
      notifications.forEach((notification) => {
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
        sendResponse(BackgroundResponse.createSuccess(analysis))
      )
      .catch((error) =>
        sendResponse(BackgroundResponse.createError(error.message))
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
        sendResponse(BackgroundResponse.createSuccess(null, content))
      )
      .catch((error) =>
        sendResponse(BackgroundResponse.createError(error.message))
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

// Update the tab listener to use the toggle
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url && isValidUrl(tab.url)) {
    const domain = getDomain(tab.url);
    const lastDomain = processedDomains.get(tabId);

    if (domain && domain !== lastDomain) {
      processedDomains.set(tabId, domain);
      tabTimer.startTracking(tabId, domain);

      if (AUTO_ANALYZE) {
        // Automatic analysis code
        mockAnalysis().then((analysis) => {
          const parsedAnalysis = JSON.parse(analysis);
          chrome.tabs.sendMessage(tabId, {
            action: "showNotification",
            analysis: parsedAnalysis,
          });

          chrome.runtime.sendMessage({
            action: "contentAnalyzed",
            tabId,
            analysis,
          });
        });

        /* Original LLM-based logic (will run when AUTO_ANALYZE is true)
        getJinaReaderContent(tab.url)
          .then((content) => {
            if (content) {
              return analyzePage(content);
            }
          })
          .then((analysis) => {
            if (analysis) {
              const parsedAnalysis = JSON.parse(analysis);
              if (!parsedAnalysis.isFocused) {
                chrome.tabs.sendMessage(tabId, {
                  action: "showNotification",
                  analysis: parsedAnalysis,
                });
              }
              chrome.runtime.sendMessage({
                action: "contentAnalyzed",
                tabId,
                analysis,
              });
            }
          })
          .catch((error) => {
            console.error("Jina Reader error:", error);
            chrome.runtime.sendMessage({
              action: "contentAnalyzed",
              tabId,
              error: "Failed to extract content using Jina Reader. Please try again later.",
            });
          });
        */
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
