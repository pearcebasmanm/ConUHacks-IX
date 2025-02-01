let topics = ["work", "study", "personal development"];

function generatePrompt() {
  return `Analyze this web content and determine if it's related to the following focus topics: ${topics.join(
    ", ",
  )}. Return a JSON response with the following structure: {"isFocused": boolean, "reason": string, "topics": string[]}. Always include topics regardless of whether or not the content is related to the focus topic. Ignore advertisements, basic ui labels, and other irrelevant parts of the input.`;
}

function updatePrompt() {
  document.getElementById("basePrompt").innerHTML = generatePrompt();
}

const basePrompt = document.addEventListener("DOMContentLoaded", () => {
  const focusTopics = document.getElementById("focusTopics");
  const list = document.getElementById("list");

  // Load saved settings
  chrome.storage.sync.get(["apiKey", "apiEndpoint", "focusTopics"], (data) => {
    if (data.apiKey) {
      document.getElementById("apiKey").value = data.apiKey;
    }
    if (data.apiEndpoint) {
      document.getElementById("apiEndpoint").value = data.apiEndpoint;
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
          `<li id="chip-item-${item}"><span>${item}</span><a>X</a></li>`,
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
