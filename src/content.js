import { createNotification } from "./components/notification";
import { BackgroundRequest } from "./types";

// Only keep notification-related functionality
function showFocusNotification(analysis) {
  const isTimeNotification = analysis.topics.includes("Time Alert");
  const notification = createNotification(
    `${analysis.reason}${
      analysis.timeSpent ? ` (${analysis.timeSpent} minutes)` : ""
    }`,
    () => {
      // Continue anyway
      const request = BackgroundRequest.createNotificationResponse("continue");
      chrome.runtime.sendMessage(request);
    },
    () => {
      // Go back
      const request = BackgroundRequest.createNotificationResponse("back");
      chrome.runtime.sendMessage(request, () => {
        window.history.back();
      });
    },
    isTimeNotification
  );

  document.body.appendChild(notification);
}

// Simplified message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    if (request.action === "showNotification") {
      showFocusNotification(request.analysis);
      sendResponse({ success: true });
    }
  } catch (error) {
    console.error("Content script error:", error);
    sendResponse({ success: false, error: error.message });
  }
  return true;
});
