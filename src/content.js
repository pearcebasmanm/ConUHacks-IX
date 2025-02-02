// Create and inject notification styles
const style = document.createElement("style");
style.textContent = `
  .focus-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    width: 300px;
    background-color: #ffffff;
    border: 2px solid var(--ft-primary-color);
    border-radius: 5px;
    padding: 15px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 999999;
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
    color: var(--ft-accent-color);
    margin: 0;
  }

  .focus-notification-close {
    background: none;
    border: none;
    color: var(--ft-text-color);
    cursor: pointer;
    padding: 5px;
    font-size: 16px;
  }

  .focus-notification-content {
    color: var(--ft-text-color);
    line-height: 1.4;
  }

  .focus-status {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 3px;
    margin-bottom: 8px;
  }

  .focus-status.focused {
    background-color: #4caf50;
    color: white;
  }

  .focus-status.distracted {
    background-color: #f44336;
    color: white;
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
document.head.appendChild(style);

// Function to create and show notification
function showCustomNotification(data) {
  const { domain, analysis } = data;
  const notification = document.createElement("div");
  notification.className = "focus-notification";

  const statusClass = analysis.isFocused ? "focused" : "distracted";
  const statusText = analysis.isFocused ? "✅ Focused" : "⚠️ Distracted";

  notification.innerHTML = `
    <div class="focus-notification-header">
      <h3 class="focus-notification-title">Focus Analysis</h3>
      <button class="focus-notification-close">×</button>
    </div>
    <div class="focus-notification-content">
      <div class="focus-status ${statusClass}">${statusText}</div>
      <p><strong>Site:</strong> ${domain}</p>
      <p><strong>Reason:</strong> ${analysis.reason}</p>
      <p><strong>Topics:</strong> ${analysis.topics.join(", ")}</p>
    </div>
  `;

  // Remove existing notifications
  const existingNotifications = document.querySelectorAll(
    ".focus-notification"
  );
  existingNotifications.forEach((n) => n.remove());

  // Add notification to page
  document.body.appendChild(notification);

  // Handle close button
  const closeBtn = notification.querySelector(".focus-notification-close");
  closeBtn.addEventListener("click", () => notification.remove());

  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.style.animation = "slideIn 0.3s ease-out reverse";
      setTimeout(() => notification.remove(), 300);
    }
  }, 10000);
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "showNotification") {
    showCustomNotification(request.data);
    sendResponse({ success: true });
  }
  return true;
});
