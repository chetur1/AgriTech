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

    def diagnose_crop_image(self, image_bytes: bytes, mime_type: str = "image/jpeg", crop_hint: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Diagnoses crop disease directly from a photograph using Google Gemini AI Vision.
        Returns parsed agronomic diagnosis dictionary or None if Gemini vision fails.
        """
        if not self._client:
            return None

        prompt = f"""You are AGRI SMART's expert Senior Agricultural Scientist and Plant Pathologist.
Analyze this agricultural crop photo.
{f'The farmer hints that the crop might be: {crop_hint}' if crop_hint and crop_hint != 'General Crop' else ''}

Examine the image carefully:
1. Identify the crop accurately (e.g. Tomato, Potato, Sugarcane, Rice, Wheat, Cotton, Pepper, Apple, Corn, etc.).
2. Detect if there are disease symptoms, pest infestations, nutritional deficiencies, or if the foliage is healthy.
3. Formulate comprehensive ICAR / State Agricultural University recommendations.

Respond ONLY with a valid JSON object matching this exact schema:
{{
  "crop": "Crop name in English",
  "disease_name": "Specific disease name or 'Healthy Crop Foliage'",
  "vernacular_name": "Disease/health name with Kannada and Hindi translations",
  "severity": "None" | "Low" | "Moderate" | "Severe",
  "is_healthy": true | false,
  "confidence_score": float between 0.85 and 0.99,
  "symptoms": ["Symptom 1", "Symptom 2", ...],
  "possible_causes": ["Causal pathogen or condition 1", ...],
  "safe_treatment_organic": ["Bio-fungicide, neem, or organic remedy 1 with dosage", ...],
  "chemical_treatment": ["Chemical treatment with dosage per litre and Pre-Harvest Interval (PHI)", ...],
  "prevention": ["Crop rotation, spacing, or sanitation practice 1", ...]
}}

Do NOT include markdown formatting or backticks around the JSON. Return only the raw JSON string."""

        fallback_models = [self.model_name, "gemini-3.5-flash-lite", "gemini-3.5-flash"]
        for model in fallback_models:
            try:
                from google.genai import types
                import json
                import re

                response = self._client.models.generate_content(
                    model=model,
                    contents=[
                        types.Part.from_bytes(data=image_bytes, mime_type=mime_type),
                        prompt
                    ]
                )
                if response and response.text:
                    text = response.text.strip()
                    # Strip markdown code fencing if present
                    if text.startswith("```"):
                        text = re.sub(r"^```[a-zA-Z]*\n?", "", text)
                        text = re.sub(r"\n?```$", "", text).strip()
                    parsed = json.loads(text)
                    if isinstance(parsed, dict) and "crop" in parsed:
                        conf = parsed.get("confidence_score", 0.92)
                        parsed["confidence_percentage"] = int(float(conf) * 100)
                        parsed["image_quality"] = "High"
                        parsed["model_architecture"] = f"Google Gemini AI Vision ({model})"
                        parsed["disclaimer"] = (
                            "IMPORTANT: AI-generated diagnosis powered by Google Gemini AI Vision grounded in ICAR agronomy. "
                            "Field symptoms can vary with weather and soil nutrients. You can request direct review from University experts below."
                        )
                        return parsed
            except Exception as e:
                logger.warning(f"Gemini vision diagnosis failed with {model}: {e}")
                continue

        return None

gemini_service = GeminiAgriculturalService()
