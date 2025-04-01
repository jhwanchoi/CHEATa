import os
import logging
from typing import Dict, Any
from openai import AsyncOpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize logger
logger = logging.getLogger(__name__)

# Initialize OpenAI client
client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Analysis prompt
ANALYSIS_PROMPT = """
You are an expert fact-checker and information verifier. Your task is to analyze the given text and determine if it contains fake news, misinformation, or misleading content.

Please analyze the text for the following:
1. Factual accuracy and verifiability
2. Source credibility (if sources are mentioned)
3. Logical consistency and reasoning
4. Use of manipulative language or emotional appeals
5. Presence of common misinformation tactics

Text to analyze:
{text}

Based on your analysis, provide:
1. A boolean determination (TRUE/FALSE) of whether the text likely contains misleading or fake information
2. A confidence score (0-100)
3. A brief explanation (3-5 sentences) of your reasoning

Format your response as a JSON object with these exact keys:
{
  "isFake": boolean,
  "confidence": number,
  "explanation": string
}
"""


async def analyze_with_gpt(text: str) -> Dict[str, Any]:
    """
    Analyze text for misinformation using GPT-4

    Args:
        text (str): Text to analyze

    Returns:
        Dict with analysis results (isFake, confidence, explanation)
    """
    try:
        # Check if API key is set
        if not os.getenv("OPENAI_API_KEY"):
            logger.error("OpenAI API key not found in environment variables")
            # For development: return mock response if no API key
            return {
                "isFake": True,
                "confidence": 75,
                "explanation": "This appears to contain misleading information based on several inconsistent claims and factual errors. The text uses emotionally charged language typical of misinformation. API key was not provided, so this is a mock response.",
            }

        # Prepare the prompt with the text
        formatted_prompt = ANALYSIS_PROMPT.format(text=text)

        # Call GPT-4 via API
        response = await client.chat.completions.create(
            model="gpt-4-turbo",  # Use GPT-4 for better analysis
            messages=[
                {
                    "role": "system",
                    "content": "You are an AI specialized in detecting misinformation and fake news.",
                },
                {"role": "user", "content": formatted_prompt},
            ],
            temperature=0.1,  # Lower temperature for more consistent results
            response_format={"type": "json_object"},
        )

        # Extract and parse the JSON response
        result_text = response.choices[0].message.content

        # Parse the response - in a production app, add more robust parsing
        import json

        result = json.loads(result_text)

        # Validate the response structure
        required_keys = ["isFake", "confidence", "explanation"]
        for key in required_keys:
            if key not in result:
                raise ValueError(f"Missing required key in AI response: {key}")

        return result

    except Exception as e:
        logger.error(f"Error in GPT analysis: {str(e)}")
        raise
