/**
 * Service for analyzing text using the backend API
 */

// Backend API URL (will be replaced with environment variable in production)
const API_URL = 'http://localhost:8000';

/**
 * Type definition for analysis response
 */
interface AnalysisResponse {
  isFake: boolean;
  confidence: number;
  explanation: string;
}

/**
 * Analyze text for fake information
 * @param text Text to analyze
 * @returns Promise with analysis result
 */
export const analyzeText = async (text: string): Promise<AnalysisResponse> => {
  try {
    const response = await fetch(`${API_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to analyze text');
    }

    return await response.json();
  } catch (error) {
    console.error('Error analyzing text:', error);
    throw error;
  }
}; 