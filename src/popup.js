import { analyzePage, getJinaReaderContent } from "./analyze";

document.addEventListener("DOMContentLoaded", () => {
  const extractBtn = document.getElementById("extractBtn");
  const analyzeBtn = document.getElementById("analyzeBtn");
  const settingsBtn = document.getElementById("settings");
  const contentDiv = document.getElementById("content");
  const analysisDiv = document.getElementById("analysis");
  const wordCountDiv = document.getElementById("wordCount");

  let currentContent = "";

  extractBtn.addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    // Show loading state
    contentDiv.textContent = "Extracting content...";
    analyzeBtn.disabled = true;

    getJinaReaderContent(tab.url)
      .then((content) => {
        currentContent = content;
        contentDiv.textContent = currentContent;
        const wordCount = currentContent.trim().split(/\s+/).length;
        wordCountDiv.textContent = `Word count: ${wordCount}`;
        analyzeBtn.disabled = false;
      })
      .catch((reason) => {
        contentDiv.textContent = reason || "Failed to extract content";
      });
  });

  analyzeBtn.addEventListener("click", async () => {
    if (!currentContent) {
      analysisDiv.textContent = "Please extract content first";
      return;
    }

    analysisDiv.textContent = "Analyzing...";

    analyzePage(currentContent)
      .then((response) => {
        analysisDiv.innerHTML = `
        <strong>Focus Analysis:</strong><br>
        Is Focused: ${response.isFocused}<br>
        Reason: ${response.reason}<br>
        Topics: ${response.topics.join(", ")}
      `;
      })
      .catch((reason) => {
        analysisDiv.innerHTML = reason;
      });
  });

  settingsBtn.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });
});
