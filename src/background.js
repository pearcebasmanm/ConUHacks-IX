import { BackgroundResponse } from "./types";
import { analyze } from "./analyze";

// Keep track of the last domain for each tab
const tabDomains = new Map();
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
  console.log(`Tab ${tabId} updated:`, {
    status: changeInfo.status,
    isActive: tab.active,
    url: tab.url,
    isValidUrl: isValidUrl(tab.url),
  });

  if (changeInfo.status === "complete" && tab.active && isValidUrl(tab.url)) {
    const currentDomain = getDomain(tab.url);
    const lastDomain = tabDomains.get(tabId);

    console.log("Domain check:", {
      tabId,
      currentDomain,
      lastDomain,
      isDifferentDomain: currentDomain !== lastDomain,
    });

    // Only analyze if we're on a new domain for this tab
    if (currentDomain && currentDomain !== lastDomain) {
      console.log(`Tab ${tabId} switched to new domain:`, currentDomain);

      // Cancel any ongoing analysis
      if (currentController) {
        console.log("Cancelling previous analysis");
        currentController.abort();
      }

      // Create new controller for this analysis
      currentController = new AbortController();

      try {
        const analysis = await analyze(tab.url, currentController.signal);
        console.log("Analysis completed:", analysis);

        // Update last analyzed domain for this tab
        tabDomains.set(tabId, currentDomain);

        // Store the results
        await chrome.storage.local.set({
          lastAnalysis: {
            url: tab.url,
            content: analysis.content,
            analysis: analysis.analysis,
            timestamp: Date.now(),
          },
        });

        await storeFocusedContent(tab.url, analysis.content, analysis.analysis);

        // Show notification
        chrome.tabs.sendMessage(tabId, {
          type: "showNotification",
          data: {
            domain: currentDomain,
            analysis: analysis.analysis,
          },
        });
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Analysis failed:", {
            error: error.message,
            url: tab.url,
            domain: currentDomain,
          });
        }
      } finally {
        if (currentController.signal.aborted) {
          currentController = null;
        }
      }
    }
  }
});

// Clean up when a tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  console.log(`Tab ${tabId} closed, cleaning up state`);
  tabDomains.delete(tabId);
});
