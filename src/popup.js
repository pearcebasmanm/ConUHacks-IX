import { analyzePage } from "./background";

import { BackgroundRequest, BackgroundResponse } from "./types";

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

    const request = BackgroundRequest.createJinaRequest(tab.url);
    chrome.runtime.sendMessage(request, (response) => {
      if (response && response.success) {
        currentContent = response.content;
        contentDiv.textContent = currentContent;
        const wordCount = currentContent.trim().split(/\s+/).length;
        wordCountDiv.textContent = `Word count: ${wordCount}`;
        analyzeBtn.disabled = false;
      } else {
        contentDiv.textContent = response.error || "Failed to extract content";
        analyzeBtn.disabled = true;
      }
    });
  });

  analyzeBtn.addEventListener("click", async () => {
    if (!currentContent) {
      analysisDiv.textContent = "Please extract content first";
      return;
    }

    analysisDiv.textContent = "Analyzing...";

    analyzePage(currentContent).then((response) => {
      alert(response);
    });

    // const request = BackgroundRequest.createAnalyzeRequest(currentContent);
    // chrome.runtime.sendMessage(request, (response) => {
    //   if (response.success) {
    //     try {
    //       const analysis = JSON.parse(response.analysis);
    //       analysisDiv.innerHTML = `
    //         <strong>Focus Analysis:</strong><br>
    //         Is Focused: ${analysis.isFocused}<br>
    //         Reason: ${analysis.reason}<br>
    //         Topics: ${analysis.topics.join(", ")}
    //       `;
    //     } catch (e) {
    //       analysisDiv.textContent = response.analysis;
    //     }
    //   } else {
    //     analysisDiv.innerHTML = `<span class="error">Analysis failed: ${response.error}</span>`;
    //   }
    // });
  });

  settingsBtn.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  // Add keyboard navigation and ARIA labels
  extractBtn.setAttribute("aria-label", "Extract content from page");

  analyzeBtn.setAttribute("aria-label", "Analyze extracted content");

  // Add keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "e") {
      extractBtn.click();
    } else if (e.ctrlKey && e.key === "a") {
      analyzeBtn.click();
    }
  });

  // Add listener for automatic analysis results
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "contentAnalyzed") {
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        if (tab.id === request.tabId) {
          try {
            const analysis = JSON.parse(request.analysis);
            analysisDiv.innerHTML = `
                <strong>Focus Analysis:</strong><br>
                Is Focused: ${analysis.isFocused}<br>
                Reason: ${analysis.reason}<br>
                Topics: ${analysis.topics.join(", ")}
              `;
          } catch (e) {
            analysisDiv.textContent = request.analysis;
          }
        }
      });
    }
  });
});
