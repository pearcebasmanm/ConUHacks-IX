import { BackgroundResponse } from "./types";
import { analyze } from "./analyze";

// Keep track of analyzed domains
let analyzedDomains = new Set();
// Keep track of current request
let currentController = null;

const MAX_STORED_SITES = 50;

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

// Function to store focused content
async function storeFocusedContent(url, content, analysis) {
  const storedSites = (await chrome.storage.local.get("focusedSites")) || {
    focusedSites: [],
  };
  let sites = storedSites.focusedSites || [];

  const newSite = {
    url,
    domain: getDomain(url),
    content,
    analysis,
    timestamp: Date.now(),
  };

  // Only store if it's focused content
  if (analysis.isFocused) {
    // Add new site to the beginning
    sites.unshift(newSite);

    // Keep only the latest MAX_STORED_SITES
    if (sites.length > MAX_STORED_SITES) {
      sites = sites.slice(0, MAX_STORED_SITES);
    }

    await chrome.storage.local.set({ focusedSites: sites });
  }
}

// Listen for tab updates
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    const domain = getDomain(tab.url);
    if (domain && !analyzedDomains.has(domain) && isValidUrl(tab.url)) {
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
        chrome.storage.local.set({
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
        if (error.name === "AbortError") {
          console.log("Request was cancelled");
        } else {
          console.error("Analysis error:", error);
        }
      } finally {
        if (currentController.signal.aborted) {
          analyzedDomains.delete(domain); // Allow retry if request was aborted
        }
        currentController = null;
      }
    }
  }
});
