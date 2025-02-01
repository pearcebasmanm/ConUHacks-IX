async function analyzePage(content) {
  try {
    const { apiKey, basePrompt, apiEndpoint } = await chrome.storage.sync.get([
      "apiKey",
      "basePrompt",
      "apiEndpoint",
    ]);

    if (!apiKey || !basePrompt || !apiEndpoint) {
      throw new Error("Missing required configuration");
    }

    if (typeof content !== "string" || content.length > 10000) {
      throw new Error("Invalid content format or size");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    console.log("Making API request to:", apiEndpoint);
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: basePrompt,
          },
          {
            role: "user",
            content: content,
          },
        ],
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}${
          errorData ? " - " + JSON.stringify(errorData) : ""
        }`
      );
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Analysis error:", error);
    // Include more detailed error information
    throw new Error(`${error.message} (${error.name})`);
  }
}

function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return null;
  }
}

const processedDomains = new Map();

// Update the message listener to handle Jina content requests
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "analyzeContent") {
    analyzePage(request.content)
      .then((analysis) => sendResponse({ success: true, analysis }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }

  if (request.action === "getJinaContent") {
    if (!isValidUrl(request.url)) {
      sendResponse({ success: false, error: "Invalid URL" });
      return true;
    }

    getJinaReaderContent(request.url)
      .then((content) => {
        sendResponse({ success: true, content });
      })
      .catch((error) => {
        console.error("Jina Reader error:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message channel open for async response
  }

  if (request.action === "notificationResponse") {
    // You can add logic here to handle user's response
    // For example, store their preference or track statistics
    console.log("User response to notification:", request.response);
    sendResponse({ success: true });
  }
});

// Update getJinaReaderContent function
async function getJinaReaderContent(url) {
  try {
    console.log("Starting Jina Reader extraction for URL:", url);
    const cleanUrl = url.replace(/^https?:\/\/r\.jina\.ai\//, "");
    const jinaUrl = `https://r.jina.ai/${cleanUrl}`;
    console.log("Constructed Jina URL:", jinaUrl);

    const response = await fetch(jinaUrl, {
      headers: {
        Accept: "text/plain",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    if (!response.ok) {
      throw new Error(`Jina Reader request failed: ${response.status}`);
    }

    const text = await response.text();

    // Use regex to extract the main content
    // Remove HTML tags and keep text content
    const cleanText = text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove scripts
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "") // Remove styles
      .replace(/<[^>]+>/g, " ") // Remove HTML tags
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim();

    if (!cleanText || cleanText.length < 100) {
      throw new Error("Insufficient content from Jina Reader");
    }

    console.log("Successfully extracted content, length:", cleanText.length);
    return cleanText;
  } catch (error) {
    console.error("Jina Reader error:", error);
    throw error;
  }
}

// Simplify the tab listener to always show notifications
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url && isValidUrl(tab.url)) {
    const domain = getDomain(tab.url);
    const lastDomain = processedDomains.get(tabId);

    if (domain && domain !== lastDomain) {
      processedDomains.set(tabId, domain);

      getJinaReaderContent(tab.url)
        .then((content) => {
          if (content) {
            return analyzePage(content);
          }
        })
        .then((analysis) => {
          if (analysis) {
            const parsedAnalysis = JSON.parse(analysis);

            // Send message to show notification if content is not focused
            if (!parsedAnalysis.isFocused) {
              chrome.tabs.sendMessage(tabId, {
                action: "showNotification",
                analysis: parsedAnalysis,
              });
            }

            chrome.runtime.sendMessage({
              action: "contentAnalyzed",
              tabId,
              analysis,
            });
          }
        })
        .catch((error) => {
          console.error("Jina Reader error:", error);
          // Instead of falling back to content extraction, just notify about the error
          chrome.runtime.sendMessage({
            action: "contentAnalyzed",
            tabId,
            error:
              "Failed to extract content using Jina Reader. Please try again later.",
          });
        });
    }
  }
});

// Helper function to validate URLs
function isValidUrl(url) {
  try {
    const urlObj = new URL(url);
    return (
      ["http:", "https:"].includes(urlObj.protocol) &&
      !url.startsWith("https://r.jina.ai/")
    );
  } catch {
    return false;
  }
}

chrome.tabs.onRemoved.addListener((tabId) => {
  processedDomains.delete(tabId);
});
