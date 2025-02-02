import { messages } from "./util/messages";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log(request);
  if (request.action === "showNotification") {
    const { magnitude, tabId } = request;
    const isInitial = magnitude == 0;
    const possibleMessages = messages[magnitude];
    const [comment, speaker] =
      possibleMessages[Math.floor(Math.random() * possibleMessages.length)];
    createNotification(comment, speaker, isInitial, tabId);
  }
});

function createNotification(comment, speaker, isInitial, tabId) {
  // There shall be only one !!!
  document.querySelectorAll(".focus-notification").forEach((n) => n.remove());

  // Create notification element
  const notification = document.createElement("div");
  notification.className = `focus-notification`;

  notification.innerHTML = `
    <div class="focus-notification-header">
      <div class="focus-notification-title">Focus Alert</div>
      <button class="focus-notification-close">&times;</button>
    </div>
    <div class="focus-notification-message">${comment} -${speaker}</div>
    <div class="focus-notification-buttons">
      <button class="ft-button focus-notification-continue">Continue Anyway</button>
      ${isInitial ? `<button class="ft-button focus-notification-back">Go Back</button>` : ""}
    </div>
  `;

  // Add event listeners
  notification
    .querySelector(".focus-notification-close")
    .addEventListener("click", () => {
      notification.remove();
    });

  notification
    .querySelector(".focus-notification-continue")
    .addEventListener("click", () => {
      notification.remove();
    });

  // Only add back button listener if it's not a time notification
  if (isInitial) {
    notification
      .querySelector(".focus-notification-back")
      .addEventListener("click", () => {
        chrome.tabs.goBack(tabId);
        notification.remove();
      });
  }

  document.body.appendChild(notification);
}
