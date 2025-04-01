import { useState, useEffect } from 'react'

/**
 * Component for selecting text from the current webpage
 * @returns React component
 */
const TextSelector = ({ onTextSelect }: { onTextSelect: (text: string) => void }) => {
  const [selectedText, setSelectedText] = useState<string>('');

  useEffect(() => {
    // Function to get the currently selected text from the document
    const getSelectedText = () => {
      const selection = window.getSelection();
      if (selection && selection.toString()) {
        setSelectedText(selection.toString());
      }
    };

    // Add event listener for mouseup to get selected text
    document.addEventListener('mouseup', getSelectedText);

    // Cleanup function
    return () => {
      document.removeEventListener('mouseup', getSelectedText);
    };
  }, []);

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
        <div className="p-2 border rounded bg-gray-50 min-h-[60px] max-h-[200px] overflow-y-auto">
          {selectedText || <span className="text-gray-400 italic">No text selected. Select text on the page to analyze.</span>}
        </div>
      </div>
      <button
        onClick={handleAnalyzeClick}
        disabled={!selectedText.trim()}
        className={`w-full py-2 px-4 rounded ${
          selectedText.trim()
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