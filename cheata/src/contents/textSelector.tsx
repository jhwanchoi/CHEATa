import type { PlasmoContentScript } from "plasmo";
import "../style.css";

/**
 * Content script configuration for injecting into web pages
 */
export const config: PlasmoContentScript = {
  matches: ["<all_urls>"],
  all_frames: true
};

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
  console.log("Cheata: Content script initialized on page");
});

// 현재 선택된 텍스트를 스토리지에 저장하는 함수
const saveSelectedTextToStorage = () => {
  const text = window.getSelection()?.toString() || "";

  // 공백만 있는 경우 저장하지 않음
  if (text.trim().length > 0) {
    try {
      // 디버깅 로그
      console.log("Cheata: Saving text to storage:", text);

      // 크롬 스토리지 API 사용
      try {
        chrome.storage.local.set({ selectedText: text }, () => {
          if (chrome.runtime.lastError) {
            console.error("Cheata: Storage error:", chrome.runtime.lastError);
          } else {
            console.log("Cheata: Text saved to chrome.storage");
          }
        });
      } catch (error) {
        console.error("Cheata: Chrome storage error:", error);
      }

      // localStorage 사용 (대체 방법)
      try {
        localStorage.setItem("cheata_selected_text", text);
        console.log("Cheata: Text saved to localStorage");
      } catch (storageError) {
        console.error("Cheata: localStorage error:", storageError);
      }

      // 백그라운드에 메시지 전송
      try {
        chrome.runtime.sendMessage({
          type: "TEXT_SELECTED",
          text
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error("Cheata: Message error:", chrome.runtime.lastError);
          } else {
            console.log("Cheata: Message sent to background");
          }
        });
      } catch (msgError) {
        console.error("Cheata: Messaging error:", msgError);
      }
    } catch (error) {
      console.error("Cheata: Error saving text to storage:", error);
    }
  }
};

// 텍스트가 선택되었을 때 전역 변수로 저장 (이전 선택된 텍스트 유지)
let lastSelectedText = "";

// 다양한 이벤트에서 텍스트 선택 감지
document.addEventListener('mouseup', () => {
  setTimeout(() => {
    const text = window.getSelection()?.toString().trim() || "";
    if (text && text !== lastSelectedText) {
      lastSelectedText = text;
      saveSelectedTextToStorage();
    }
  }, 100); // 약간의 지연을 두어 선택이 완료된 후 처리
});

document.addEventListener('keyup', (e) => {
  // Shift + 화살표 등으로 텍스트 선택 시
  if (e.shiftKey) {
    setTimeout(() => {
      const text = window.getSelection()?.toString().trim() || "";
      if (text && text !== lastSelectedText) {
        lastSelectedText = text;
        saveSelectedTextToStorage();
      }
    }, 100);
  }
});

// selectionchange 이벤트 처리
document.addEventListener('selectionchange', () => {
  setTimeout(() => {
    const text = window.getSelection()?.toString().trim() || "";
    if (text && text !== lastSelectedText) {
      lastSelectedText = text;
      saveSelectedTextToStorage();
    }
  }, 100);
});

/**
 * Content script that creates a floating button to analyze selected text
 */
const TextSelectorContent = () => {
  // Function to handle analyze button click
  const handleAnalyze = () => {
    const selectedText = window.getSelection()?.toString();

    if (selectedText?.trim()) {
      // 선택된 텍스트를 멀티 스토리지에 저장
      // 크롬 스토리지
      try {
        chrome.storage.local.set({ selectedText }, () => {
          if (chrome.runtime.lastError) {
            console.error("Cheata: Failed to save to chrome.storage:", chrome.runtime.lastError);
          }
        });
      } catch (e) {
        console.error("Cheata: Chrome storage set error:", e);
      }

      // 로컬 스토리지 (fallback)
      try {
        localStorage.setItem("cheata_selected_text", selectedText);
        console.log("Cheata: Saved to localStorage on button click");

        // 또한 특별한 플래그를 설정하여 새로운 텍스트가 저장되었음을 표시
        localStorage.setItem("cheata_text_timestamp", Date.now().toString());
      } catch (localError) {
        console.error("Cheata: localStorage error on button:", localError);
      }

      // 팝업 열기 시도
      try {
        chrome.runtime.sendMessage({
          type: "ANALYZE_TEXT",
          text: selectedText
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error("Cheata: Message error:", chrome.runtime.lastError);
          } else {
            console.log("Cheata: Message sent successfully", response);
          }
        });
      } catch (error) {
        console.error("Cheata: Error sending message:", error);
      }
    }
  };

  return (
    <div
      className="fixed bottom-4 right-4 z-50"
      style={{
        display: "none", // Initially hidden, will be shown via CSS when text is selected
      }}
      id="cheata-button-container">
      <button
        onClick={handleAnalyze}
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-full shadow-lg flex items-center"
      >
        <span className="mr-1">🔍</span> Analyze with Cheata
      </button>
    </div>
  );
};

// Inject CSS to show the button when text is selected
const style = document.createElement("style");
style.textContent = `
  ::selection {
    background: rgba(59, 130, 246, 0.2);
  }
  
  #cheata-button-container {
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
  }
  
  :has(::selection) #cheata-button-container {
    display: block !important;
    opacity: 1;
  }
`;
document.head.appendChild(style);

export default TextSelectorContent; 