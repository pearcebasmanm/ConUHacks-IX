import { analyzePage, getJinaReaderContent } from "./analyze";

document.addEventListener("DOMContentLoaded", () => {
  const extractBtn = document.getElementById("extractBtn");
  const analyzeBtn = document.getElementById("analyzeBtn");
  const settingsBtn = document.getElementById("settings");
  const clearHistoryBtn = document.getElementById("clearHistory");
  const contentDiv = document.getElementById("content");
  const analysisDiv = document.getElementById("analysis");
  const wordCountDiv = document.getElementById("wordCount");
  const historyDiv = document.getElementById("focusHistory");
  const quizBtn = document.getElementById("quizBtn");

  const MAX_STORED_SITES = 50; // Define the constant
  let currentContent = "";

  // Function to load and display focus history
  async function loadFocusHistory() {
    const data = await chrome.storage.local.get("focusedSites");
    const focusedSites = data.focusedSites || [];

    if (focusedSites.length === 0) {
      historyDiv.innerHTML = "<p>No focused content stored yet.</p>";
      return;
    }

    historyDiv.innerHTML = `
      <h3>Recent Focused Content (${
        focusedSites.length
      }/${MAX_STORED_SITES})</h3>
      <ul class="focus-history-list">
        ${focusedSites
          .map(
            (site) => `
          <li>
            <strong>${site.domain}</strong>
            <br>
            <small>${new Date(site.timestamp).toLocaleString()}</small>
            <br>
            Topics: ${site.analysis.topics.join(", ")}
          </li>
        `
          )
          .join("")}
      </ul>
    `;
  }

  // Load focus history when popup opens
  loadFocusHistory();

  // Clear history button handler
  clearHistoryBtn.addEventListener("click", async () => {
    await chrome.storage.local.set({ focusedSites: [] });
    loadFocusHistory();
  });

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

      // Refresh history when showing automatic analysis
      loadFocusHistory();
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
        // Refresh history after manual analysis
        loadFocusHistory();
      })
      .catch((reason) => {
        analysisDiv.innerHTML = reason;
      });
  });

  settingsBtn.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  quizBtn.addEventListener("click", () => {
    chrome.windows.create({
      url: "quiz.html",
      type: "popup",
      width: 800,
      height: 600,
    });
  });
});
