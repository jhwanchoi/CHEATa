import { analyzeText } from "../api/textAnalysisService";

/**
 * Background script for handling messages and API requests
 */

// 확장 프로그램 설치 후 최초 실행 시 필요한 권한 요청
chrome.runtime.onInstalled.addListener(() => {
  console.log('Cheata extension installed');
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle analysis requests from content script
  if (message.type === "ANALYZE_TEXT") {
    // Store the text to analyze for when popup opens
    chrome.storage.local.set({ selectedText: message.text });

    // 사용자에게 알림으로 텍스트가 선택되었음을 알림
    chrome.notifications.create({
      type: "basic",
      iconUrl: chrome.runtime.getURL("icon128.plasmo.c11f39af.png"),
      title: "Cheata",
      message: "텍스트가 선택되었습니다. 분석하려면 확장 프로그램 아이콘을 클릭하세요."
    });

    // Optionally, perform analysis directly in the background
    // handleAnalysis(message.text);
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
      iconUrl: chrome.runtime.getURL("icon128.plasmo.c11f39af.png"),
      title: result.isFake ? "⚠️ Potentially Misleading" : "✅ Likely Reliable",
      message: result.explanation.substring(0, 100) + "..."
    });

  } catch (error) {
    console.error("Background analysis error:", error);
  }
} 