import { useState, useEffect } from 'react'

/**
 * Component for selecting text from the current webpage
 * @returns React component
 */
const TextSelector = ({ onTextSelect }: { onTextSelect: (text: string) => void }) => {
  const [selectedText, setSelectedText] = useState<string>('');
  const [initAttempted, setInitAttempted] = useState(false);

  // 여러 소스에서 텍스트 로드 시도
  const loadTextFromMultipleSources = () => {
    console.log("Cheata popup: Attempting to load text from multiple sources");
    let textFound = false;

    // 1. 전역 윈도우 객체에서 확인 (콘텐츠 스크립트에서 설정한 경우)
    try {
      // @ts-ignore (Window 객체에 추가된 커스텀 프로퍼티)
      if (window.cheataSelectedText) {
        // @ts-ignore
        const text = window.cheataSelectedText;
        console.log("Cheata popup: Found text in window object:", text.substring(0, 20) + "...");
        setSelectedText(text);
        textFound = true;
      }
    } catch (e) {
      console.error("Cheata popup: Error accessing window object:", e);
    }

    // 2. 로컬 스토리지에서 확인
    if (!textFound) {
      try {
        const localText = localStorage.getItem("cheata_selected_text");
        if (localText) {
          console.log("Cheata popup: Found text in localStorage:", localText.substring(0, 20) + "...");
          setSelectedText(localText);
          textFound = true;
        }
      } catch (e) {
        console.error("Cheata popup: Error accessing localStorage:", e);
      }
    }

    // 3. 크롬 스토리지 API 시도
    if (!textFound) {
      try {
        chrome.storage.local.get(['selectedText'], (result) => {
          if (chrome.runtime.lastError) {
            console.error("Cheata popup: Chrome storage error:", chrome.runtime.lastError);
          } else if (result.selectedText) {
            console.log("Cheata popup: Found text in chrome.storage:",
              typeof result.selectedText === 'string'
                ? result.selectedText.substring(0, 20) + "..."
                : "non-string value");

            const text = typeof result.selectedText === 'string'
              ? result.selectedText
              : JSON.stringify(result.selectedText);

            setSelectedText(text);
            textFound = true;
          } else {
            console.log("Cheata popup: No text found in chrome.storage");
          }

          // 초기화 시도 완료
          setInitAttempted(true);
        });
      } catch (error) {
        console.error("Cheata popup: Error loading from chrome.storage:", error);
        setInitAttempted(true);
      }
    } else {
      setInitAttempted(true);
    }

    return textFound;
  };

  useEffect(() => {
    console.log("Cheata popup: TextSelector component mounted");

    // 컴포넌트 마운트 시 텍스트 로드 시도
    loadTextFromMultipleSources();

    // 팝업 내에서 텍스트 선택 이벤트 리스너
    const getSelectedTextInPopup = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        const text = selection.toString();
        console.log("Cheata popup: Text selected in popup:", text);
        setSelectedText(text);

        // 선택한 텍스트 저장 시도
        saveTextToMultipleStores(text);
      }
    };

    // 전역 객체에 저장 (다른 컴포넌트에서 접근 가능)
    try {
      // @ts-ignore
      window.cheataSelectedText = selectedText;
    } catch (e) {
      // 브라우저 보안 제한으로 실패 시 무시
    }

    // 스토리지 이벤트 리스너: 로컬 스토리지 변경 감지
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === "cheata_selected_text" && e.newValue) {
        console.log("Cheata popup: localStorage changed externally:", e.newValue.substring(0, 20) + "...");
        setSelectedText(e.newValue);
      }
    };

    // 팝업이 열린 상태에서 다른 스토리지 소스의 변경 확인을 위한 폴링
    const pollForStorageChanges = setInterval(() => {
      try {
        const localText = localStorage.getItem("cheata_selected_text");
        if (localText && localText !== selectedText) {
          console.log("Cheata popup: Detected text change in polling:", localText.substring(0, 20) + "...");
          setSelectedText(localText);
        }
      } catch (e) {
        // 로컬 스토리지 접근 불가 시 무시
      }
    }, 500);  // 500ms 마다 확인

    // 이벤트 리스너 등록
    document.addEventListener('mouseup', getSelectedTextInPopup);
    window.addEventListener('storage', handleStorageEvent);

    // 크롬 스토리지 변경 감지
    try {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes.selectedText && changes.selectedText.newValue) {
          console.log("Cheata popup: Chrome storage changed:",
            typeof changes.selectedText.newValue === 'string'
              ? changes.selectedText.newValue.substring(0, 20) + "..."
              : "non-string value");

          const newText = typeof changes.selectedText.newValue === 'string'
            ? changes.selectedText.newValue
            : JSON.stringify(changes.selectedText.newValue);

          setSelectedText(newText);
        }
      });
    } catch (error) {
      console.error("Cheata popup: Error setting chrome.storage listener:", error);
    }

    // Cleanup function
    return () => {
      document.removeEventListener('mouseup', getSelectedTextInPopup);
      window.removeEventListener('storage', handleStorageEvent);
      clearInterval(pollForStorageChanges);

      try {
        chrome.storage.onChanged.removeListener(() => { });
      } catch (error) {
        // 리스너 제거 실패 시 무시
      }
    };
  }, []);  // 빈 배열로 초기 마운트 시에만 실행

  // 여러 스토리지에 텍스트 저장
  const saveTextToMultipleStores = (text: string) => {
    if (!text.trim()) return;

    console.log("Cheata popup: Saving text to multiple stores:", text.substring(0, 20) + "...");

    // 로컬 스토리지에 저장
    try {
      localStorage.setItem("cheata_selected_text", text);
      localStorage.setItem("cheata_text_timestamp", Date.now().toString());
    } catch (e) {
      console.error("Cheata popup: localStorage save error:", e);
    }

    // 크롬 스토리지에 저장
    try {
      chrome.storage.local.set({ selectedText: text }, () => {
        if (chrome.runtime.lastError) {
          console.error("Cheata popup: Chrome storage save error:", chrome.runtime.lastError);
        }
      });
    } catch (e) {
      console.error("Cheata popup: Error in chrome.storage.local.set:", e);
    }

    // 전역 객체에도 저장
    try {
      // @ts-ignore
      window.cheataSelectedText = text;
    } catch (e) {
      // 보안 제한으로 실패 시 무시
    }
  };

  // 텍스트 직접 업데이트
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setSelectedText(text);

    // 멀티 스토리지에 저장
    saveTextToMultipleStores(text);
  };

  // Function to handle button click and send text for analysis
  const handleAnalyzeClick = () => {
    if (selectedText.trim()) {
      onTextSelect(selectedText);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <h3 className="font-medium text-gray-800 mb-2">Selected Text:</h3>
        <textarea
          className="p-2 border rounded bg-gray-50 min-h-[100px] w-full resize-none"
          value={selectedText}
          onChange={handleTextChange}
          placeholder="No text selected. Select text on the page or type here to analyze."
        />
      </div>
      <button
        onClick={handleAnalyzeClick}
        disabled={!selectedText.trim()}
        className={`w-full py-2 px-4 rounded ${selectedText.trim()
            ? 'bg-blue-500 hover:bg-blue-600 text-white'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          } transition duration-200`}
      >
        Analyze Text
      </button>
    </div>
  );
};

export default TextSelector; 