"""
AGRI SMART — Gemini AI Agricultural Service
File: backend/app/services/gemini_service.py

Handles generative agricultural intelligence powered by Google Gemini AI:
- Agricultural Q&A / Knowledge Retrieval (Replaces static RAG)
- Crop disease diagnosis advice enrichment
- Multilingual agronomic support (Kannada, Hindi, English)
"""

import logging
from typing import Dict, Any, Optional
from google import genai
from app.core.config import settings

logger = logging.getLogger(__name__)

class GeminiAgriculturalService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL or "gemini-3.1-flash-lite"
        self._client = None
        if self.api_key:
            try:
                self._client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.error(f"Failed to initialize Gemini Client: {e}")

    def is_available(self) -> bool:
        return self._client is not None

    def ask_agricultural_question(self, question: str, crop_context: Optional[str] = None) -> Dict[str, Any]:
        """
        Answers agricultural questions using Google Gemini AI,
        grounded in ICAR/UAS agronomic practices with clear organic & chemical remedies.
        """
        if not self._client:
            return {
                "answer": "Gemini AI is currently not configured with a valid API key.",
                "crop": crop_context or "General Agriculture",
                "sources": ["System Notice"],
                "provider": "Offline",
            }

        prompt = f"""You are AGRI SMART's expert Senior Agricultural Scientist and Agronomist.
You advise Indian farmers following ICAR (Indian Council of Agricultural Research) and State Agricultural Universities (UAS) Package of Practices.

Farmer's Question: {question}
{f'Crop Context: {crop_context}' if crop_context else ''}

Please provide a well-structured, practical, and farmer-friendly answer with:
1. Diagnosis / Direct Answer (1-2 clear sentences)
2. Safe Organic & Biological Remedies (Neem extracts, bio-fungicides like Trichoderma/Pseudomonas, cultural practices)
3. Recommended Chemical Treatments (Include exact dosage per litre and Pre-Harvest Interval safety warnings)
4. Long-term Prevention Tips (Crop rotation, spacing, resistant varieties)

Format with clean bullet points and maintain clear, supportive tone suitable for farmers and agricultural experts.
"""

        # Model fallback chain
        fallback_models = [self.model_name, "gemini-3.5-flash-lite", "gemini-3.5-flash", "gemini-3.8-flash"]
        last_error = None

        for model in fallback_models:
            try:
                response = self._client.models.generate_content(
                    model=model,
                    contents=prompt,
                )
                if response and response.text:
                    return {
                        "answer": response.text.strip(),
                        "crop": crop_context or "Agricultural Advisory",
                        "sources": ["ICAR Package of Practices", "Google Gemini AI (Real-time)", f"Model: {model}"],
                        "provider": "Google Gemini AI",
                        "model": model,
                    }
            except Exception as e:
                logger.warning(f"Gemini generation with {model} failed: {e}")
                last_error = str(e)

        return {
            "answer": f"Unable to generate response from Gemini AI. Please try again. ({last_error})",
            "crop": crop_context or "General",
            "sources": ["Error Fallback"],
            "provider": "Google Gemini AI (Unavailable)",
        }

gemini_service = GeminiAgriculturalService()
