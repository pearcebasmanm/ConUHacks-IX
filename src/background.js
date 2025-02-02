import { BackgroundResponse } from "./types";
import { analyze } from "./analyze";

// Keep track of analyzed domains
const analyzedDomains = new Set();
// Keep track of current request
let currentController = null;

const MAX_STORED_SITES = 50;

function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
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

// Function to store focused content
async function storeFocusedContent(url, content, analysis) {
  const { focusedSites = [] } = await chrome.storage.local.get("focusedSites");
  const newSite = {
    url,
    domain: getDomain(url),
    content,
    analysis,
    timestamp: Date.now(),
  };

  const sites = [newSite, ...focusedSites].slice(0, MAX_STORED_SITES);
  await chrome.storage.local.set({ focusedSites: sites });
}

// Listen for tab updates
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.active && isValidUrl(tab.url)) {
    const domain = getDomain(tab.url);
    if (domain && !analyzedDomains.has(domain)) {
      // Cancel any pending request
      if (currentController) {
        currentController.abort();
      }

      // Create new controller for this request
      currentController = new AbortController();

      analyzedDomains.add(domain);
      try {
        const analysis = await analyze(tab.url, currentController.signal);
        // Store the results for the popup
        await chrome.storage.local.set({
          lastAnalysis: {
            url: tab.url,
            content: analysis.content,
            analysis: analysis.analysis,
            timestamp: Date.now(),
          },
        });

        // Store focused content
        await storeFocusedContent(tab.url, analysis.content, analysis.analysis);

        // Send message to content script to show notification
        chrome.tabs.sendMessage(tabId, {
          type: "showNotification",
          data: {
            domain,
            analysis: analysis.analysis,
          },
        });
      } catch (error) {
        if (error.name !== "AbortError") {
          analyzedDomains.delete(domain);
        }
      } finally {
        currentController = null;
      }
    }
  }
});
