// Notification styles
const notificationStyles = `
.focus-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #fff;
  border: 2px solid #ff6b6b;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 2147483647;
  max-width: 300px;
  font-family: Arial, sans-serif;
  animation: slideIn 0.3s ease-out;
}

.focus-notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.focus-notification-title {
  font-weight: bold;
  color: #ff6b6b;
}

.focus-notification-close {
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  font-size: 18px;
  padding: 0;
}

.focus-notification-message {
  color: #4a4a4a;
  margin-bottom: 10px;
}

.focus-notification-buttons {
  display: flex;
  gap: 10px;
}

.focus-notification-button {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.focus-notification-continue {
  background: #ff6b6b;
  color: white;
}

.focus-notification-back {
  background: #e0e0e0;
  color: #4a4a4a;
}

.focus-notification-time {
  background: #4a90e2;
  border-color: #357abd;
}

.focus-notification-time .focus-notification-title,
.focus-notification-time .focus-notification-continue {
  color: #357abd;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
`;

export function createNotification(
  message,
  onContinue,
  onBack,
  isTimeNotification = false
) {
  // Add styles if not already added
  if (!document.getElementById("focus-notification-styles")) {
    const style = document.createElement("style");
    style.id = "focus-notification-styles";
    style.textContent = notificationStyles;
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
