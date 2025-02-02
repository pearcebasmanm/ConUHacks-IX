import { defaultTopics, generatePrompt } from "../util/prompt";

let topics = defaultTopics;

document.addEventListener("DOMContentLoaded", () => {
  const focusTopics = document.getElementById("focusTopics");
  const list = document.getElementById("chip-list");

  // Load saved settings
  chrome.storage.sync.get(["modelName", "apiKey", "focusTopics"], (data) => {
    if (data.modelName) {
      document.getElementById("modelName").value = data.modelName;
    }
    if (data.apiKey) {
      document.getElementById("apiKey").value = data.apiKey;
    }
    if (data.focusTopics) {
      topics = data.focusTopics;
    }
    updateChips();
  });

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
          `<li id="chip-item-${item}" class="ft-chip"><span>${item}</span><a class="ft-chip-x"><strong>X</strong></a></li>`,
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
    document.getElementById("basePrompt").innerHTML = generatePrompt(topics);
  }

  // Save settings
  document.getElementById("save").addEventListener("click", () => {
    const modelName = document.getElementById("modelName").value;
    const apiKey = document.getElementById("apiKey").value.trim();
    const basePrompt = generatePrompt(topics);

    if (topics === 0) {
      showStatus("At least one focus topic is required!", true);
      return;
    }

    chrome.storage.sync.set(
      {
        modelName,
        apiKey,
        basePrompt,
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
