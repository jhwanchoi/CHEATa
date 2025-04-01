import { analyzeText } from "../api/textAnalysisService";

/**
 * Background script for handling messages and API requests
 */

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle analysis requests from content script
  if (message.type === "ANALYZE_TEXT") {
    // Store the text to analyze for when popup opens
    chrome.storage.local.set({ selectedText: message.text });
    
    // Open the popup to show analysis
    chrome.action.openPopup();
    
    // Optionally, perform analysis directly in the background
    // And show a notification with the result
    handleAnalysis(message.text);
  }

  // Always return true for async response
  return true;
});

/**
 * Handle text analysis in the background
 * @param text Text to analyze
 */
async function handleAnalysis(text: string) {
  try {
    const result = await analyzeText(text);
    
    // Example: Show a notification with the result
    chrome.notifications.create({
      type: "basic",
      iconUrl: "/assets/icon.png",
      title: result.isFake ? "⚠️ Potentially Misleading" : "✅ Likely Reliable",
      message: result.explanation.substring(0, 100) + "..."
    });
    
  } catch (error) {
    console.error("Background analysis error:", error);
  }
} 