import React from 'react';

/**
 * Interface for the analysis result data
 */
interface AnalysisResultProps {
  isLoading: boolean;
  result: {
    isFake: boolean;
    confidence: number;
    explanation: string;
  } | null;
  error: string | null;
}

/**
 * Component to display AI analysis results
 * @returns React component
 */
const AnalysisResult: React.FC<AnalysisResultProps> = ({ isLoading, result, error }) => {
  if (isLoading) {
    return (
      <div className="p-4 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-2"></div>
        <p className="text-gray-700">Analyzing text...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <h3 className="text-red-700 font-medium mb-2">Error</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  const { isFake, confidence, explanation } = result;
  
  return (
    <div className="p-4 border rounded-md">
      <div className={`p-3 mb-4 rounded-md ${isFake ? 'bg-red-50' : 'bg-green-50'}`}>
        <h3 className={`font-medium mb-1 ${isFake ? 'text-red-700' : 'text-green-700'}`}>
          {isFake ? '⚠️ Potentially Misleading Information' : '✅ Likely Reliable Information'}
        </h3>
        <div className="flex items-center mb-2">
          <span className="text-gray-700 mr-2">Confidence:</span>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${isFake ? 'bg-red-600' : 'bg-green-600'}`} 
              style={{ width: `${confidence}%` }}>
            </div>
          </div>
          <span className="ml-2 text-sm text-gray-600">{confidence}%</span>
        </div>
      </div>
      
      <div>
        <h4 className="font-medium text-gray-800 mb-1">Analysis:</h4>
        <p className="text-gray-700">{explanation}</p>
      </div>
    </div>
  );
};

export default AnalysisResult; 