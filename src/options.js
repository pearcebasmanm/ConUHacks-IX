import { defaultTopics, generatePrompt } from "./prompt";

let topics = defaultTopics;

function updatePrompt() {
  document.getElementById("basePrompt").innerHTML = generatePrompt(topics);
}

const basePrompt = document.addEventListener("DOMContentLoaded", () => {
  const modelSelect = document.getElementById("modelName");
  const apiKeyInput = document.getElementById("apiKey");
  const focusTopicsInput = document.getElementById("focusTopics");
  const saveButton = document.getElementById("save");
  const statusDiv = document.getElementById("status");
  const list = document.getElementById("list");

  // Load saved settings
  chrome.storage.sync.get(["modelName", "apiKey", "focusTopics"], (data) => {
    if (data.modelName) modelSelect.value = data.modelName;
    if (data.apiKey) apiKeyInput.value = data.apiKey;
    if (data.focusTopics) renderTopics(data.focusTopics);
  });

  function renderTopics(topics) {
    list.innerHTML = topics
      .map((topic) => `<li>${topic}<button>×</button></li>`)
      .join("");

    // Add click handlers to remove buttons
    list.querySelectorAll("button").forEach((button, index) => {
      button.addEventListener("click", () => {
        chrome.storage.sync.get(["focusTopics"], (data) => {
          const updatedTopics = data.focusTopics.filter((_, i) => i !== index);
          chrome.storage.sync.set({ focusTopics: updatedTopics }, () => {
            renderTopics(updatedTopics);
          });
        });
      });
    });
  }

  // Handle adding new topics
  focusTopicsInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter" && focusTopicsInput.value.trim()) {
      chrome.storage.sync.get(["focusTopics"], (data) => {
        const topics = data.focusTopics || [];
        const newTopic = focusTopicsInput.value.trim();

        if (!topics.includes(newTopic)) {
          const updatedTopics = [...topics, newTopic];
          chrome.storage.sync.set({ focusTopics: updatedTopics }, () => {
            renderTopics(updatedTopics);
            focusTopicsInput.value = ""; // Clear the input field
          });
        }
      });
    }
  });

  // Save settings
  saveButton.addEventListener("click", () => {
    chrome.storage.sync.set(
      {
        modelName: modelSelect.value,
        apiKey: apiKeyInput.value,
      },
      () => {
        statusDiv.textContent = "Settings saved!";
        statusDiv.className = "success";
        setTimeout(() => {
          statusDiv.textContent = "";
          statusDiv.className = "";
        }, 2000);
      }
    );
  });
});
