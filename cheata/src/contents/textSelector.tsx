import type { PlasmoContentScript } from "plasmo";
import "../style.css";

/**
 * Content script configuration for injecting into web pages
 */
export const config: PlasmoContentScript = {
  matches: ["<all_urls>"],
  all_frames: true
};

/**
 * Content script that creates a floating button to analyze selected text
 */
const TextSelectorContent = () => {
  // Function to handle analyze button click
  const handleAnalyze = () => {
    const selectedText = window.getSelection()?.toString();
    
    if (selectedText?.trim()) {
      // Send message to popup/background with the selected text
      chrome.runtime.sendMessage({
        type: "ANALYZE_TEXT",
        text: selectedText
      });
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