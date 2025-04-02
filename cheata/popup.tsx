import { useState, useEffect } from "react";
import "./src/style.css";
import TextSelector from "./src/components/TextSelector";
import AnalysisResult from "./src/components/AnalysisResult";
import { analyzeText } from "./src/api/textAnalysisService";

/**
 * Main popup component for the Chrome extension
 * @returns React component
 */
function IndexPopup() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);

  // 팝업이 처음 열릴 때 초기화
  useEffect(() => {
    console.log("Cheata popup: Main popup component initializing");

    // 스토리지에서 선택된 텍스트 로드 및 즉시 분석 시작
    const loadSelectedTextAndAnalyze = async () => {
      try {
        console.log("Cheata popup: Trying to load text from multiple sources");

        // 1. 로컬 스토리지에서 확인 (가장 간단한 방법)
        try {
          const localText = localStorage.getItem("cheata_selected_text");
          if (localText && localText.trim()) {
            console.log("Cheata popup: Found text in localStorage, length:", localText.length);

            // 텍스트가 찾아지면 바로 분석 시작
            handleTextSelect(localText);
            setInitialized(true);
            return;
          }
        } catch (e) {
          console.error("Cheata popup: localStorage access error:", e);
        }

        // 2. 전역 변수 확인
        try {
          // @ts-ignore (Window 객체에 추가된 커스텀 프로퍼티)
          if (window.cheataSelectedText && window.cheataSelectedText.trim()) {
            // @ts-ignore
            const text = window.cheataSelectedText;
            console.log("Cheata popup: Found text in window object, length:", text.length);

            // 텍스트가 찾아지면 바로 분석 시작
            handleTextSelect(text);
            setInitialized(true);
            return;
          }
        } catch (e) {
          console.error("Cheata popup: Window object access error:", e);
        }

        // 3. 크롬 스토리지 API 호출 (비동기)
        try {
          chrome.storage.local.get(['selectedText'], (result) => {
            if (chrome.runtime.lastError) {
              console.error("Cheata popup: Storage error:", chrome.runtime.lastError);
              setInitialized(true);
              return;
            }

            if (result.selectedText && (
              typeof result.selectedText === 'string' ?
                result.selectedText.trim() :
                String(result.selectedText).trim()
            )) {

              console.log("Cheata popup: Found text in chrome.storage");

              // 문자열이 아닌 경우 방어 코드
              const text = typeof result.selectedText === 'string'
                ? result.selectedText
                : JSON.stringify(result.selectedText);

              // 자동 분석 시작
              handleTextSelect(text);
            } else {
              console.log("Cheata popup: No text in chrome.storage or empty text");
            }

            setInitialized(true);
          });
        } catch (error) {
          console.error("Cheata popup: Error accessing chrome.storage:", error);
          setInitialized(true);
        }
      } catch (error) {
        console.error("Cheata popup: Error in initialization:", error);
        setInitialized(true);
      }
    };

    // 초기화 즉시 실행
    loadSelectedTextAndAnalyze();

    // 페이지에서 선택한 텍스트를 감지하는 메시지 리스너 설정
    try {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message && message.type === "TEXT_SELECTED" && message.text) {
          console.log("Cheata popup: Received text selection message:", message.text.substring(0, 20) + "...");

          // TextSelector 컴포넌트가 알아서 처리하도록 전역 변수 업데이트
          try {
            // @ts-ignore
            window.cheataSelectedText = message.text;
          } catch (e) {
            // 전역 변수 접근 실패 시 무시
          }

          // 필요시 응답
          sendResponse({ received: true });
        }
        return true; // 비동기 응답 유지
      });
    } catch (e) {
      console.error("Cheata popup: Error setting up message listener:", e);
    }
  }, []);

  /**
   * Handle text selection and analysis request
   * @param text Selected text to analyze
   */
  const handleTextSelect = async (text: string) => {
    if (!text || !text.trim()) {
      console.log("Cheata popup: Empty text, not analyzing");
      return;
    }

    // 로그는 텍스트 내용 잘라서 표시 (너무 길면 불필요하게 많은 로그 발생)
    const displayText = text.length > 50 ? text.substring(0, 50) + "..." : text;
    console.log("Cheata popup: Analyzing text:", displayText);

    setIsLoading(true);
    setError(null);

    try {
      const analysisResult = await analyzeText(text);
      console.log("Cheata popup: Analysis result:", analysisResult);
      setResult(analysisResult);
    } catch (err: any) {
      console.error("Cheata popup: Analysis error:", err);
      setError(err.message || 'Failed to analyze text. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-96 bg-white shadow-lg rounded-lg overflow-hidden">
      <header className="bg-blue-600 text-white p-4">
        <h1 className="text-xl font-bold">Cheata - Fake News Detector</h1>
        <p className="text-sm text-blue-100">Select text on the page to analyze</p>
      </header>

      <div className="divide-y">
        <TextSelector onTextSelect={handleTextSelect} />
        <AnalysisResult
          isLoading={isLoading}
          result={result}
          error={error}
        />
      </div>

      <footer className="p-3 bg-gray-50 text-center text-xs text-gray-500">
        Powered by AI - Cheata v0.0.1
      </footer>
    </div>
  );
}

export default IndexPopup;
