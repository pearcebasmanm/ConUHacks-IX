/**
 * Represents a request to the background script
 * @property {string} action - The type of request ("analyzeContent" | "getJinaContent" | "notificationResponse")
 * @property {string} [url] - The URL to analyze (for getJinaContent)
 * @property {string} [content] - The content to analyze (for analyzeContent)
 * @property {string} [response] - The notification response ("continue" | "back")
 */
export class BackgroundRequest {
  constructor(action, url = null, content = null, response = null) {
    const validActions = [
      "analyzeContent",
      "getJinaContent",
      "notificationResponse",
    ];
    if (!validActions.includes(action)) {
      throw new Error(`Invalid action: ${action}`);
    }
    this.action = action; // "analyzeContent" | "getJinaContent" | "notificationResponse"
    this.url = url;
    this.content = content;
    this.response = response; // "continue" | "back"
  }

  static createAnalyzeRequest(content) {
    return new BackgroundRequest("analyzeContent", null, content);
  }

  static createJinaRequest(url) {
    return new BackgroundRequest("getJinaContent", url);
  }

  static createNotificationResponse(response) {
    return new BackgroundRequest("notificationResponse", null, null, response);
  }
}

// Response class
export class BackgroundResponse {
  constructor(success, analysis = null, content = null, error = null) {
    this.success = success;
    this.analysis = analysis;
    this.content = content;
    this.error = error;
  }

  static createSuccess(analysis = null, content = null) {
    return new BackgroundResponse(true, analysis, content);
  }

  static createError(error) {
    return new BackgroundResponse(false, null, null, error);
  }
}
