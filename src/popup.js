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

  const MAX_STORED_SITES = 50;
  let currentContent = "";

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

  loadFocusHistory();

  clearHistoryBtn.addEventListener("click", async () => {
    await chrome.storage.local.set({ focusedSites: [] });
    loadFocusHistory();
  });

  chrome.storage.local.get(["lastAnalysis"], (data) => {
    if (data.lastAnalysis) {
      const { content, analysis, timestamp, url } = data.lastAnalysis;
      currentContent = content;
      contentDiv.textContent = content;
      wordCountDiv.textContent = `Word count: ${
        content.trim().split(/\s+/).length
      }`;

      analysisDiv.innerHTML = `
        <strong>Focus Analysis (Auto):</strong><br>
        URL: ${url}<br>
        Time: ${new Date(timestamp).toLocaleTimeString()}<br>
        Is Focused: ${analysis.isFocused}<br>
        Reason: ${analysis.reason}<br>
        Topics: ${analysis.topics.join(", ")}
      `;

      analyzeBtn.disabled = false;
      loadFocusHistory();
    }
  });

  extractBtn.addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    contentDiv.textContent = "Extracting content...";
    analyzeBtn.disabled = true;

    try {
      const content = await getJinaReaderContent(tab.url);
      currentContent = content;
      contentDiv.textContent = content;
      wordCountDiv.textContent = `Word count: ${
        content.trim().split(/\s+/).length
      }`;
      analyzeBtn.disabled = false;
    } catch (error) {
      contentDiv.textContent = error.message || "Failed to extract content";
    }
  });

  analyzeBtn.addEventListener("click", async () => {
    if (!currentContent) {
      analysisDiv.textContent = "Please extract content first";
      return;
    }

    analysisDiv.textContent = "Analyzing...";

    try {
      const response = await analyzePage(currentContent);
      analysisDiv.innerHTML = `
        <strong>Focus Analysis (Manual):</strong><br>
        Is Focused: ${response.isFocused}<br>
        Reason: ${response.reason}<br>
        Topics: ${response.topics.join(", ")}
      `;
      loadFocusHistory();
    } catch (error) {
      analysisDiv.innerHTML = error.message;
    }
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
