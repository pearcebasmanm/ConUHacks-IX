export class BackgroundResponse {
  constructor(success, message = "") {
    this.success = success;
    this.message = message;
  }
}

export function createAnalysis(isFocused, reason, topics) {
  return {
    isFocused,
    reason,
    topics,
  };
}

export function createFocusedSite(url, domain, content, analysis, timestamp) {
  return {
    url,
    domain,
    content,
    analysis,
    timestamp,
  };
}

export function createLastAnalysis(url, content, analysis, timestamp) {
  return {
    url,
    content,
    analysis,
    timestamp,
  };
}
