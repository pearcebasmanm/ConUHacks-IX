function extractMainContent() {
  // Add caching for extracted content
  if (window._cachedContent) {
    return window._cachedContent;
  }

  // Helper function to get text content length
  function getTextLength(text) {
    return text.trim().split(/\s+/).length;
  }

  // Helper function to check if element should be ignored
  function shouldIgnoreElement(element) {
    const tagsToIgnore = [
      "script",
      "style",
      "nav",
      "header",
      "footer",
      "aside",
    ];
    const classesToIgnore = [
      "ad",
      "advertisement",
      "nav",
      "menu",
      "sidebar",
      "footer",
    ];

    if (tagsToIgnore.includes(element.tagName.toLowerCase())) {
      return true;
    }

    const elementClasses = Array.from(element.classList);
    if (
      elementClasses.some((className) =>
        classesToIgnore.some((ignoreClass) =>
          className.toLowerCase().includes(ignoreClass)
        )
      )
    ) {
      return true;
    }

    return false;
  }

  // Store references to included nodes for highlighting
  let includedNodes = new Set();

  // Main content extraction logic
  function extractContent(element, maxWords = 1000) {
    let content = "";
    let wordCount = 0;

    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        if (shouldIgnoreElement(node.parentElement)) {
          return NodeFilter.FILTER_REJECT;
        }

        if (!node.textContent.trim()) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      },
    });

    let node;
    while ((node = walker.nextNode()) && wordCount < maxWords) {
      const text = node.textContent.trim();
      const words = text.split(/\s+/);

      if (wordCount + words.length <= maxWords) {
        content += text + " ";
        wordCount += words.length;
        includedNodes.add(node);
      } else {
        const remainingWords = maxWords - wordCount;
        content += words.slice(0, remainingWords).join(" ") + " ";
        includedNodes.add(node);
        break;
      }
    }

    return content.trim();
  }

  // Extract content from the main content area if it exists
  const mainContent = document.querySelector(
    "main, article, .content, #content"
  );
  const content = mainContent
    ? extractContent(mainContent)
    : extractContent(document.body);

  // Cache the result
  window._cachedContent = {
    content,
    nodes: includedNodes,
  };

  return window._cachedContent;
}

// Handle highlighting
function highlightContent() {
  // Remove any existing highlights
  document.querySelectorAll(".focus-extension-highlight").forEach((el) => {
    el.classList.remove("focus-extension-highlight");
  });

  const { nodes } = extractMainContent();
  nodes.forEach((node) => {
    const span = document.createElement("span");
    span.className = "focus-extension-highlight";
    node.parentNode.insertBefore(span, node);
    span.appendChild(node);
  });
}

// Add highlighting styles
const style = document.createElement("style");
style.textContent = `
        .focus-extension-highlight {
          background-color: yellow;
          transition: background-color 0.3s;
        }
      `;
document.head.appendChild(style);

// Add error handling to the message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    if (request.action === "extractContent") {
      const { content } = extractMainContent();
      sendResponse({ success: true, content });
    } else if (request.action === "highlightContent") {
      highlightContent();
      sendResponse({ success: true });
    }
  } catch (error) {
    console.error("Content script error:", error);
    sendResponse({ success: false, error: error.message });
  }
  return true; // Keep message channel open for async operations
});

// Add cleanup function
function cleanup() {
  window._cachedContent = null;
  document.querySelectorAll(".focus-extension-highlight").forEach((el) => {
    el.classList.remove("focus-extension-highlight");
  });
}
