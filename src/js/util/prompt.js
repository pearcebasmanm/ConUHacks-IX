export const defaultTopics = ["work", "study", "personal development"];

export function generatePrompt(focusTopics) {
  return `Analyze this web content and determine if it's related to the following focus topics: ${focusTopics.join(
    ", ",
  )}. Return a JSON response with the following structure: {"isFocused": boolean, "reason": string, "topics": string[]}. Always include topics regardless of whether or not the content is related to the focus topic. Ignore advertisements, basic ui labels, and other irrelevant parts of the input.`;
}
