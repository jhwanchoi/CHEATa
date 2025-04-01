import { useState } from "react";
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

  /**
   * Handle text selection and analysis request
   * @param text Selected text to analyze
   */
  const handleTextSelect = async (text: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const analysisResult = await analyzeText(text);
      setResult(analysisResult);
    } catch (err) {
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
