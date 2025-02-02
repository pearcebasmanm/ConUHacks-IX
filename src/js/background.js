import { isValidUrl, analyze } from "./util/analyze";

function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return null;
  }
}

let tabInfo = new Map();

const MILLISECOND = 1;
const SECOND = 1000 * MILLISECOND;
const MINUTE = 60 * SECOND;

function showNotification(id) {
  console.log("about to send");
  chrome.tabs.sendMessage(id, {
    action: "showNotification",
    magnitude: tabInfo.get(id).magnitude,
    tabId: id,
  });
  console.log("should have sent");
  tabInfo.get(id).lastNotification = Date.now();
}

// Check all tabs periodically for time-based notifications
setInterval(() => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([activeTab]) => {
    if (activeTab) {
      const { id, url } = activeTab;
      processTabUpdate(id, url);
    }
  });
}, 5 * SECOND);

// Add cleanup for tab timer
chrome.tabs.onRemoved.addListener((tabId) => {
  tabInfo.delete(tabId);
});

// Update the tab listener to handle both initial and time notifications
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url && isValidUrl(tab.url)) {
    console.log(tabId + " was updated");
    processTabUpdate(tabId, tab.url);
  }
});

chrome.tabs.onActivated.addListener(() => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([activeTab]) => {
    if (activeTab) {
      const { id, url } = activeTab;
      processTabUpdate(id, url);
    }
  });
});

function processTabUpdate(id, url) {
  console.log("Checking:", url);
  if (tabInfo.has(id)) {
    const tabDetails = tabInfo.get(id);
    if (getDomain(url) === tabDetails.lastDomain) {
      if (tabDetails.focused) {
        console.log("Still Focused");
        return; // still on a focused topic
      } else {
        if (Date.now() - tabDetails.lastNotification >= 0.5 * MINUTE) {
          if (tabDetails.magnitude < 3) {
            tabDetails.magnitude++;
          }
          showNotification(id);
          console.log("Cooldown Elapsed: Reminder Sent");
        } else {
          console.log("On Cooldown");
        }
      }
    } else {
      analyze(url).then((response) => {
        tabDetails.focused = response.isFocused;
        tabDetails.lastDomain = getDomain(url);

        if (!tabDetails.focused) {
          tabDetails.magnitude = 0;
          showNotification(id);
          console.log("Went to Unfocused Domain: Push Sent");
        } else {
          console.log("Went to Focused Domain");
        }
      });
    }
  } else if (url && isValidUrl(url)) {
    analyze(url).then((response) => {
      let tabDetails = {
        focused: response.isFocused,
        lastDomain: getDomain(url),
      };
      tabInfo.set(id, tabDetails);
      if (!tabDetails.focused) {
        tabDetails.magnitude = 0;
        showNotification(id);
        console.log("Opened Unfocused Domain: Push Sent");
      } else {
        console.log("Opened Focused Domain");
      }
    });
  } else {
    console.log("Invalid URL");
  }
}

// // Helper function to validate URLs

// Add window focus change handler
// chrome.windows.onFocusChanged.addListener((windowId) => {
//   if (windowId !== chrome.windows.WINDOW_ID_NONE) {
//     chrome.tabs.query({ active: true, windowId }, ([tab]) => {
//       if (tab && tab.url && isValidUrl(tab.url)) {
//         tabInfo.get(tab.url).lastActiveTime = Date.now();
//       }
//     });
//   }
// });
