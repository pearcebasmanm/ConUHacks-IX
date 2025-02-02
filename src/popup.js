import { analyzePage, getJinaReaderContent } from "./analyze";

document.addEventListener("DOMContentLoaded", () => {
  const extractBtn = document.getElementById("extractBtn");
  const analyzeBtn = document.getElementById("analyzeBtn");
  const settingsBtn = document.getElementById("settings");
  const contentDiv = document.getElementById("content");
  const analysisDiv = document.getElementById("analysis");
  const wordCountDiv = document.getElementById("wordCount");

  let currentContent = "";

  // Check for automatic analysis results when popup opens
  chrome.storage.local.get(["lastAnalysis"], (data) => {
    if (data.lastAnalysis) {
      const { content, analysis, timestamp, url } = data.lastAnalysis;

      // Show the automatically analyzed content
      currentContent = content;
      contentDiv.textContent = content;
      const wordCount = content.trim().split(/\s+/).length;
      wordCountDiv.textContent = `Word count: ${wordCount}`;

      // Show the analysis results
      analysisDiv.innerHTML = `
        <strong>Focus Analysis (Auto):</strong><br>
        URL: ${url}<br>
        Time: ${new Date(timestamp).toLocaleTimeString()}<br>
        Is Focused: ${analysis.isFocused}<br>
        Reason: ${analysis.reason}<br>
        Topics: ${analysis.topics.join(", ")}
      `;

      analyzeBtn.disabled = false;
    }
  });

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
        <strong>Focus Analysis (Manual):</strong><br>
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
