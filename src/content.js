import { createNotification } from "./components/notification";

// Only keep notification-related functionality
function showFocusNotification(analysis) {
  const notification = createNotification(
    `This page appears to be about: ${analysis.topics.join(", ")}. 
     ${analysis.reason}`,
    () => {
      // Continue anyway
      chrome.runtime.sendMessage({
        action: "notificationResponse",
        response: "continue",
      });
    },
    () => {
      // Go back
      chrome.runtime.sendMessage(
        {
          action: "notificationResponse",
          response: "back",
        },
        () => {
          window.history.back();
        }
      );
    }
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
