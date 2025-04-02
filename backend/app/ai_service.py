import os
import logging
import sys
from typing import Dict, Any
import openai
import asyncio
import json
from dotenv import load_dotenv

# 로깅 설정을 더 자세하게 설정
logging.basicConfig(level=logging.DEBUG, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                    stream=sys.stdout)

# Load environment variables
load_dotenv()

# Initialize logger
logger = logging.getLogger(__name__)

# Initialize OpenAI client
openai.api_key = os.getenv("OPENAI_API_KEY")

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
{{
  "isFake": boolean,
  "confidence": number,
  "explanation": string
}}
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
        logger.debug("analyze_with_gpt called with text: %s", text[:50] + "..." if len(text) > 50 else text)
        
        # FOR TESTING: Always return mock response
        logger.info(f"Analyzing text: {text[:100]}...")
        
        # Generate a response based on the text length to simulate analysis
        is_fake = len(text) % 2 == 0  # Even length = fake, odd = real
        confidence = min(60 + len(text) % 40, 95)  # Dynamic confidence
        
        # Choose explanation based on is_fake
        if is_fake:
            explanation = "This text appears to contain potentially misleading information. The content lacks credible sources and contains several logical inconsistencies. The language used is emotionally charged in a way that suggests manipulation rather than objective reporting. This is a testing mock response."
        else:
            explanation = "This text appears to be factually accurate based on the information provided. The content maintains logical consistency and uses relatively neutral language. No obvious signs of misinformation tactics were detected. This is a testing mock response."
        
        result = {
            "isFake": is_fake,
            "confidence": confidence,
            "explanation": explanation,
        }
        
        logger.debug("Returning result: %s", result)
        return result

        # ORIGINAL CODE BELOW (DISABLED)
        """
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
        response = await asyncio.to_thread(
            openai.ChatCompletion.create,
            model="gpt-3.5-turbo",  # Use available model
            messages=[
                {
                    "role": "system",
                    "content": "You are an AI specialized in detecting misinformation and fake news. You always respond with valid JSON.",
                },
                {"role": "user", "content": formatted_prompt},
            ],
            temperature=0.1,  # Lower temperature for more consistent results
        )

        # Extract and parse the JSON response
        logger.info(f"GPT response: {response}")
        result_text = response.choices[0]["message"]["content"].strip()
        
        try:
            # Parse the response - in a production app, add more robust parsing
            result = json.loads(result_text)
        except json.JSONDecodeError as json_err:
            logger.error(f"Failed to parse JSON: {result_text}")
            logger.error(f"JSON error: {str(json_err)}")
            # Fallback mock response
            return {
                "isFake": False,
                "confidence": 60,
                "explanation": "Unable to analyze the text due to technical issues. This is a fallback response.",
            }

        # Validate the response structure
        required_keys = ["isFake", "confidence", "explanation"]
        for key in required_keys:
            if key not in result:
                raise ValueError(f"Missing required key in AI response: {key}")

        return result
        """

    except Exception as e:
        logger.exception("Error in GPT analysis: %s", str(e))
        # Return a fallback response instead of raising
        return {
            "isFake": False,
            "confidence": 50,
            "explanation": f"Unable to complete analysis due to a technical error: {str(e)}. This is a fallback response.",
        }
