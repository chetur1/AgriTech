"""
AGRI SMART — Agricultural Knowledge RAG Endpoints
File: backend/app/api/v1/endpoints/rag.py
"""

from typing import List, Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, Query

from app.rag.engine import rag_engine

router = APIRouter()


class QuestionRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=500, description="Farmer agricultural question")


@router.post("/ask")
def ask_agricultural_rag(payload: QuestionRequest):
    """
    Query the agricultural knowledge base grounded in ICAR and UAS package of practices.
    """
    return rag_engine.answer_query(payload.query)


@router.get("/search")
def search_knowledge_base(q: str = Query(..., min_length=2), top_k: int = Query(3, ge=1, le=10)):
    """
    Perform semantic keyword search across agricultural advisory documents.
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
