import { BackgroundResponse } from "./types";
import { analyze } from "./analyze";

// Keep track of analyzed domains
let analyzedDomains = new Set();

function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return null;
  }
}

// Helper function to validate URLs
export function isValidUrl(url) {
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

// Listen for tab updates
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    const domain = getDomain(tab.url);
    if (domain && !analyzedDomains.has(domain) && isValidUrl(tab.url)) {
      analyzedDomains.add(domain);
      try {
        const analysis = await analyze(tab.url);
        // Store the results for the popup
        chrome.storage.local.set({
          lastAnalysis: {
            url: tab.url,
            content: analysis.content,
            analysis: analysis.analysis,
            timestamp: Date.now(),
          },
        });
        // Send message to content script to show notification
        chrome.tabs.sendMessage(tabId, {
          type: "showNotification",
          data: {
            domain,
            analysis: analysis.analysis,
          },
        });
      } catch (error) {
        console.error("Analysis error:", error);
      }
    }
  }
});
