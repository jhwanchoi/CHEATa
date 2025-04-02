from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import logging
import traceback
from dotenv import load_dotenv
import uvicorn

# Import the AI module
from app.ai_service import analyze_with_gpt

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Cheata API",
    description="AI-powered fake news detection API for the Cheata Chrome extension",
    version="0.1.0",
)

# Configure CORS to allow requests from the Chrome extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the extension's origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request model for text analysis
class AnalysisRequest(BaseModel):
    text: str


# Response model for analysis results
class AnalysisResponse(BaseModel):
    isFake: bool
    confidence: float
    explanation: str


@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "name": "Cheata API",
        "version": "0.1.0",
        "description": "AI-powered fake news detection API",
    }


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_text(request: AnalysisRequest):
    """
    Analyze text for fake news/misinformation

    This endpoint takes a text input and returns an analysis using AI
    """
    try:
        # Validate the input
        if not request.text or len(request.text.strip()) < 10:
            raise HTTPException(
                status_code=400, detail="Text must be at least 10 characters long"
            )

        # Log the request (excluding PII in production)
        logger.info(f"Analyzing text of length: {len(request.text)}")

        # Process with AI service
        result = await analyze_with_gpt(request.text)
        
        logger.debug(f"API result: {result}")
        
        # 타입 변환 확인
        if not isinstance(result, dict):
            raise ValueError(f"Expected dictionary result, got {type(result)}")
            
        # 필요한 키가 모두 있는지 확인
        required_keys = ["isFake", "confidence", "explanation"]
        for key in required_keys:
            if key not in result:
                raise ValueError(f"Missing required key in result: {key}")
                
        # 타입 검사
        if not isinstance(result["isFake"], bool):
            result["isFake"] = bool(result["isFake"])
            
        if not isinstance(result["confidence"], (int, float)):
            try:
                result["confidence"] = float(result["confidence"])
            except (ValueError, TypeError):
                result["confidence"] = 50.0
                
        if not isinstance(result["explanation"], str):
            result["explanation"] = str(result["explanation"])

        # AnalysisResponse 객체로 반환
        return AnalysisResponse(
            isFake=result["isFake"],
            confidence=result["confidence"],
            explanation=result["explanation"]
        )

    except Exception as e:
        logger.error(f"Error analyzing text: {str(e)}")
        logger.error(traceback.format_exc())
        
        # 일관된 오류 응답
        return AnalysisResponse(
            isFake=False,
            confidence=50.0,
            explanation=f"분석 과정에서 오류가 발생했습니다: {str(e)}"
        )


if __name__ == "__main__":
    # Start the API server when run directly
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
