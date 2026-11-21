"""
AGRI SMART — Agricultural Knowledge & Gemini AI Endpoints
File: backend/app/api/v1/endpoints/rag.py
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, Query

from app.services.gemini_service import gemini_service
from app.rag.engine import rag_engine

router = APIRouter()


class QuestionRequest(BaseModel):
    # Accept either query or question to be completely backward-compatible
    query: Optional[str] = Field(None, min_length=2, max_length=1000)
    question: Optional[str] = Field(None, min_length=2, max_length=1000)
    crop: Optional[str] = None


@router.post("/ask")
def ask_agricultural_ai(payload: QuestionRequest):
    """
    Query the agricultural knowledge base powered directly by Google Gemini AI,
    with automatic fallback to curated ICAR/UAS agronomic corpus.
    """
    user_query = (payload.question or payload.query or "").strip()
    if not user_query:
        return {
            "answer": "Please ask a question about crops, pests, diseases, or farming practices.",
            "crop": "General Agriculture",
            "sources": [],
            "provider": "AGRI SMART",
        }

    # 1. Use Google Gemini AI for rich dynamic reasoning
    if gemini_service.is_available():
        res = gemini_service.ask_agricultural_question(user_query, crop_context=payload.crop)
        if "Unable to generate" not in res.get("answer", ""):
            return res

    # 2. Seamless fallback to local static RAG if offline
    return rag_engine.answer_query(user_query)


@router.get("/search")
def search_knowledge_base(q: str = Query(..., min_length=2), top_k: int = Query(5, ge=1, le=10)):
    """
    Perform search across agricultural advisory documents.
    """
    return rag_engine.search(q, top_k=top_k)


@router.get("/topics")
def list_knowledge_topics():
    """
    List all available knowledge articles and categories.
    """
    return [
        {
            "id": doc["id"],
            "crop": doc["crop"],
            "category": doc["category"],
            "title": doc["title"],
            "source": doc["source"],
            "tags": doc["tags"],
        }
        for doc in rag_engine.documents
    ]
