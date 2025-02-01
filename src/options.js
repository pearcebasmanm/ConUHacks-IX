const defaultTopics = ["work", "study", "personal development"];

function getFocusTopics() {
  return document
    .getElementById("focusTopics")
    .value.split("\n")
    .map((topic) => topic.trim())
    .filter((topic) => topic.length > 0);
}

function generatePrompt() {
  return `Analyze this web content and determine if it's related to the following focus topics: ${getFocusTopics().join(
    ", ",
  )}. Return a JSON response with the following structure: {"isFocused": boolean, "reason": string, "topics": string[]}. Always include topics regardless of whether or not the content is related to the focus topic. Ignore advertisements, basic ui labels, and other irrelevant parts of the input.`;
}

function updatePrompt() {
  document.getElementById("basePrompt").innerHTML = generatePrompt();
}

const basePrompt = document.addEventListener("DOMContentLoaded", () => {
  // Load saved settings
  chrome.storage.sync.get(["apiKey", "apiEndpoint", "focusTopics"], (data) => {
    if (data.apiKey) document.getElementById("apiKey").value = data.apiKey;
    if (data.apiEndpoint) {
      document.getElementById("apiEndpoint").value = data.apiEndpoint;
    }
    document.getElementById("focusTopics").value = (
      data.focusTopics ?? defaultTopics
    ).join("\n");

    // for debugging purposes
    updatePrompt();
  });

  // for debugging purposes
  document
    .getElementById("focusTopics")
    .addEventListener("input", updatePrompt);

  // Save settings
  document.getElementById("save").addEventListener("click", () => {
    const modelName = document.getElementById("modelName").value;
    const apiKey = document.getElementById("apiKey").value.trim();
    const apiEndpoint = document.getElementById("apiEndpoint").value.trim();
    const focusTopics = getFocusTopics();
    const basePrompt = generatePrompt();

    /* Validate inputs */

    // // You shouldn't need a key
    // if (!apiKey) {
    //   showStatus("API Key is required!", true);
    //   return;
    // }
    // if (!apiKey.startsWith("sk-")) {
    //   showStatus('Invalid API Key format. Should start with "sk-"', true);
    //   return;
    // }
    //
    if (!apiEndpoint || !apiEndpoint.startsWith("http")) {
      showStatus("Invalid API endpoint URL", true);
      return;
    }

    if (!basePrompt) {
      showStatus("Base prompt is required!", true);
      return;
    }

    if (focusTopics.length === 0) {
      showStatus("At least one focus topic is required!", true);
      return;
    }

    chrome.storage.sync.set(
      {
        modelName,
        apiKey,
        basePrompt,
        apiEndpoint,
        focusTopics,
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
