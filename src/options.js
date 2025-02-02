import { defaultTopics, generatePrompt } from "./prompt";

let topics = defaultTopics;

function updatePrompt() {
  document.getElementById("basePrompt").innerHTML = generatePrompt(topics);
}

const basePrompt = document.addEventListener("DOMContentLoaded", () => {
  const focusTopics = document.getElementById("focusTopics");
  const list = document.getElementById("list");

  // Load saved settings
  chrome.storage.sync.get(
    ["modelName", "apiKey", "apiEndpoint", "focusTopics"],
    (data) => {
      if (data.modelName) {
        document.getElementById("modelName").value = data.modelName;
      }
      if (data.apiKey) {
        document.getElementById("apiKey").value = data.apiKey;
      }
      if (data.apiEndpoint) {
        document.getElementById("apiEndpoint").value =
          data.apiEndpoint ?? "https://api.openai.com/v1/chat/completions";
      }
      if (data.focusTopics) {
        topics = data.focusTopics;
      }
      updateChips();
    },
  );

  focusTopics.addEventListener("keypress", function (e) {
    if (e.key !== "Enter") {
      return;
    }
    let val = focusTopics.value.trim();
    if (val === "") {
      alert("Please type a tag Name");
      return;
    }
    if (topics.indexOf(val) >= 0) {
      alert("Tag name is a duplicate");
      return;
    }

    topics.push(val);
    updateChips();
    focusTopics.value = "";
    focusTopics.focus();
  });

  function updateChips() {
    list.innerHTML = topics
      .map(
        (item, index) =>
          `<li id="chip-item-${item}"><span>${item}</span><a><strong>X</strong></a></li>`,
      )
      .join("");

    for (const [i, item] of topics.entries()) {
      document
        .getElementById(`chip-item-${item}`)
        .addEventListener("click", () => {
          topics = topics.filter((item) => topics.indexOf(item) != i);
          updateChips();
        });
    }

    // for debugging purposes
    updatePrompt();
  }

  // Save settings
  document.getElementById("save").addEventListener("click", () => {
    const modelName = document.getElementById("modelName").value;
    const apiKey = document.getElementById("apiKey").value.trim();
    const apiEndpoint = document.getElementById("apiEndpoint").value.trim();
    const basePrompt = generatePrompt(topics);
    if (!apiEndpoint || !apiEndpoint.startsWith("http")) {
      showStatus("Invalid API endpoint URL", true);
      return;
    }

    if (topics === 0) {
      showStatus("At least one focus topic is required!", true);
      return;
    }

    chrome.storage.sync.set(
      {
        modelName,
        apiKey,
        basePrompt,
        apiEndpoint,
        focusTopics: topics,
      },
      () => {
        showStatus("Settings saved successfully!");
        // Verify the save
        chrome.storage.sync.get(["apiKey"], (data) => {
          if (data.apiKey !== apiKey) {
            showStatus("Warning: Settings may not have saved correctly", true);
          }
        });
      },
    );
  });

  function showStatus(message, isError = false) {
    const status = document.getElementById("status");
    status.textContent = message;
    status.style.color = isError ? "red" : "green";
    setTimeout(() => {
      status.textContent = "";
    }, 3000);
  }
});
