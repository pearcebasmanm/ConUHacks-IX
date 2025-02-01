export function createNotification(
  message,
  onContinue,
  onBack,
  isTimeNotification = false,
) {
  // Create notification element
  const notification = document.createElement("div");
  notification.className = `focus-notification ${
    isTimeNotification ? "focus-notification-time" : ""
  }`;

  notification.innerHTML = `
    <link rel="stylesheet" href="notification.css" />
    <div class="focus-notification-header">
      <div class="focus-notification-title">${
        isTimeNotification ? "Time Alert" : "Focus Alert"
      }</div>
      <button class="focus-notification-close">&times;</button>
    </div>
    <div class="focus-notification-message">${message}</div>
    <div class="focus-notification-buttons">
      <button class="focus-notification-button focus-notification-continue">
        ${isTimeNotification ? "Acknowledge" : "Continue Anyway"}
      </button>
      ${
        !isTimeNotification
          ? `<button class="focus-notification-button focus-notification-back">Go Back</button>`
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
      onContinue?.();
      notification.remove();
    });

  // Only add back button listener if it's not a time notification
  if (!isTimeNotification) {
    const backButton = notification.querySelector(".focus-notification-back");
    if (backButton) {
      backButton.addEventListener("click", () => {
        onBack?.();
        notification.remove();
      });
    }
  }

  return notification;
}
