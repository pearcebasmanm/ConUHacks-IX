import { createNotification } from "./components/notification";

// Only keep notification-related functionality
function showFocusNotification(analysis) {
  const isTimeNotification = analysis.topics.includes("Time Alert");
  console.log("Showing notification:", { analysis, isTimeNotification }); // Debug log

  const notification = createNotification(
    `${analysis.reason}${
      analysis.timeSpent ? ` (${analysis.timeSpent} seconds)` : "" // Changed to seconds for testing
    }`,
    isTimeNotification,
  );

  // Make sure any existing notifications are removed
  const existingNotifications = document.querySelectorAll(
    ".focus-notification",
  );
  existingNotifications.forEach((n) => n.remove());

  document.body.appendChild(notification);
}

// Simplified message listener with debug logging
chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  try {
    if (request.action === "showNotification") {
      console.log("Received notification request:", request); // Debug log
      showFocusNotification(request.analysis);
      sendResponse({ success: true });
    }
  } catch (error) {
    console.error("Content script error:", error);
    sendResponse({ success: false, error: error.message });
  }
  return true;
});
