import { TabTimer } from "./TabTimer";
import { BackgroundResponse } from "./types";

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
