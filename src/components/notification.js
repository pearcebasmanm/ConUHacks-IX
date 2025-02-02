export function createNotification(message, isTimeNotification = false) {
  // Add styles if not already added
  if (!document.getElementById("focus-notification-styles")) {
    const style = document.createElement("style");
    style.id = "focus-notification-styles";
    style.textContent = `
      :root {
          --ft-accent-color: #23022e;
          --ft-primary-color: #b5838d; /* Light Pink */
          --ft-secondary-color: #6d6875; /* Lavender */
          --ft-text-color: #4a4a4a;
          --ft-background-color: #ffffff;
      }

      button {
          background-color: var(--ft-primary-color);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
          transition: background-color 0.3s ease;
      }

      button:hover {
          background-color: var(--ft-accent-color);
      }

      .focus-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border: 1px solid #ccc;
        border-radius: 8px;
        padding: 15px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        max-width: 400px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      }

      .focus-notification-time {
        border-left: 4px solid var(--ft--primary-color);
      }

      .focus-notification-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }

      .focus-notification-title {
        font-weight: bold;
        font-size: 16px;
        color: #333;
      }

      .focus-notification-close {
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: #666;
        padding: 0 5px;
      }

      .focus-notification-message {
        margin-bottom: 15px;
        color: #444;
        line-height: 1.4;
      }

      .focus-notification-buttons {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
      }

      .focus-notification-back {
        background-color: #f44336;
        color: white;
      }

      .focus-notification-back:hover {
        background-color: #da190b;
      }
    `;
    document.head.appendChild(style);
  }

  // Create notification element
  const notification = document.createElement("div");
  notification.className = `focus-notification ${
    isTimeNotification ? "focus-notification-time" : ""
  }`;

  notification.innerHTML = `
    <div class="focus-notification-header">
      <div class="focus-notification-title">${
        isTimeNotification ? "Time Alert" : "Focus Alert"
      }</div>
      <button class="focus-notification-close">&times;</button>
    </div>
    <div class="focus-notification-message">${message}</div>
    <div class="focus-notification-buttons">
      <button class="focus-notification-continue">
        ${isTimeNotification ? "Acknowledge" : "Continue Anyway"}
      </button>
      ${
        !isTimeNotification
          ? `<button class="focus-notification-back">Go Back</button>`
          : ""
      }
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
  if (!isTimeNotification) {
    const backButton = notification.querySelector(".focus-notification-back");
    if (backButton) {
      backButton.addEventListener("click", () => {
        chrome.runtime.sendMessage(request, () => {
          window.history.back();
        });
        notification.remove();
      });
    }
  }

  return notification;
}
