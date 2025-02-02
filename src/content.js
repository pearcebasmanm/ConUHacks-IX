// Create and inject notification styles
const style = document.createElement("style");
style.textContent = `
  .focus-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    width: 300px;
    background-color: #ffffff !important; /* Force white background */
    border: 2px solid #b5838d !important; /* Use explicit color instead of var */
    border-radius: 5px;
    padding: 15px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 999999;
    font-family: Arial, sans-serif !important;
    animation: slideIn 0.3s ease-out;
    color: #4a4a4a !important; /* Force text color */
  }

  .focus-notification * {
    color: #4a4a4a !important; /* Force text color for all child elements */
  }

  .focus-notification-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  .focus-notification-title {
    font-weight: bold;
    color: #23022e !important; /* Use explicit accent color */
    margin: 0;
  }

  .focus-notification-close {
    background: none;
    border: none;
    color: #4a4a4a !important;
    cursor: pointer;
    padding: 5px;
    font-size: 16px;
  }

  .focus-notification-content {
    line-height: 1.4;
  }

  .focus-status {
    display: inline-block;
    padding: 3px 8px;
    border-radius: 3px;
    margin-bottom: 8px;
    color: white !important; /* Force white text for status */
  }

  .focus-status.focused {
    background-color: #4caf50 !important;
  }

  .focus-status.distracted {
    background-color: #f44336 !important;
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

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Add message collections
const FOCUSED_MESSAGES = {
  Hugin: [
    "Thy focus illuminates the path of wisdom. Onward, seeker of knowledge!",
    "A commendable journey, noble scholar. May your insights soar like the ravens at dawn.",
    "Steady focus, brave mind. The realm of wisdom awaits thy curious gaze!",
  ],
  Munin: [
    "Well done, clever mortal! Your focus is as sharp as Odin's spear!",
    "Bravo! Your brain is a fortress of concentration—let the knowledge raid begin!",
    "Look at you, slaying distractions like a true warrior of wit! Keep it up!",
  ],
};

const DISTRACTED_MESSAGES = {
  Hugin: [
    "Hold, traveler! This land lies beyond your quest. Shall we return to our true mission?",
    "A single step off the path leads to many. Is this truly where you wish to go?",
    "Your quest lies elsewhere, yet here you stand. Shall we return before it is too late?",
    "Stay the course, traveler! The wisdom you seek is not here.",
  ],
  Munin: [
    "Ooooh, shiny! A great distraction you've found! Too bad it won't help you finish your work.",
    "Oh wow, a totally urgent detour, I'm sure. What's next, scrolling ancient memes?",
    "Distraction detected! I repeat, distraction detected! Just kidding… but seriously, get back to work.",
    "Odin's wisdom? Nah. You're chasing cat videos instead.",
  ],
};

// Helper function to get random message
function getRandomMessage(isFocused) {
  const messageSet = isFocused ? FOCUSED_MESSAGES : DISTRACTED_MESSAGES;
  const raven = Math.random() < 0.5 ? "Hugin" : "Munin";
  return {
    raven,
    message:
      messageSet[raven][Math.floor(Math.random() * messageSet[raven].length)],
  };
}

// Function to create and show notification
function showCustomNotification(data) {
  const { analysis } = data;
  const notification = document.createElement("div");
  notification.className = "focus-notification focus-extension";

  const statusClass = analysis.isFocused ? "focused" : "distracted";
  const statusText = analysis.isFocused ? "✅ Focused" : "⚠️ Distracted";
  const { raven, message } = getRandomMessage(analysis.isFocused);

  notification.innerHTML = `
    <div class="focus-notification-header">
      <h3 class="focus-notification-title">Focus Analysis</h3>
      <button class="focus-notification-close">×</button>
    </div>
    <div class="focus-notification-content">
      <div class="focus-status ${statusClass}">${statusText}</div>
      <p><strong>Reason:</strong> ${analysis.reason}</p>
      <p><strong>${raven} says:</strong> "${message}"</p>
    </div>
  `;

  // Remove existing notifications
  document.querySelectorAll(".focus-notification").forEach((n) => n.remove());

  // Add notification to page
  document.body.appendChild(notification);

  // Handle close button with animation
  const closeBtn = notification.querySelector(".focus-notification-close");
  closeBtn.addEventListener("click", () => {
    notification.style.animation = "slideOut 0.3s ease-in forwards";
    setTimeout(() => notification.remove(), 300);
  });
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "showNotification") {
    showCustomNotification(request.data);
    sendResponse({ success: true });
  }
  return true;
});
