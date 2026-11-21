"""
AGRI SMART — Agricultural RAG Retrieval Engine
File: backend/app/rag/engine.py

Provides semantic hybrid search and grounded agricultural answering
using curated ICAR and UAS Bangalore agronomic documents.
Runs locally with zero external API dependencies.
"""

import re
import math
from typing import List, Dict, Any, Optional
from app.rag.knowledge_data import AGRICULTURAL_KNOWLEDGE_BASE


class AgriculturalRAGEngine:
    """
    Retrieval-Augmented Generation Engine for farmer queries.
    Uses BM25-style inverted indexing, keyword weighting, and agronomic knowledge synthesis.
    """

    def __init__(self):
        self.documents = AGRICULTURAL_KNOWLEDGE_BASE
        self._build_index()

    def _tokenize(self, text: str) -> List[str]:
        cleaned = re.sub(r"[^\w\s]", " ", text.lower())
        tokens = cleaned.split()
        # Filter basic stopwords
        stopwords = {"the", "a", "an", "in", "on", "of", "and", "or", "is", "for", "to", "at", "by", "with"}
        return [t for t in tokens if len(t) > 2 and t not in stopwords]

    def _build_index(self):
        self.doc_tokens = {}
        self.df = {}  # Document frequency
        self.total_docs = len(self.documents)

        for doc in self.documents:
            doc_id = doc["id"]
            # Combine title, tags, and content with weights
            tag_text = " ".join(doc.get("tags", [])) * 3
            title_text = doc.get("title", "") * 2
            full_text = f"{title_text} {tag_text} {doc.get('content', '')}"
            tokens = self._tokenize(full_text)
            self.doc_tokens[doc_id] = tokens

            unique_tokens = set(tokens)
            for token in unique_tokens:
                self.df[token] = self.df.get(token, 0) + 1

    def search(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        query_tokens = self._tokenize(query)
        if not query_tokens:
            return self.documents[:top_k]

        scores = {}
        for doc in self.documents:
            doc_id = doc["id"]
            d_tokens = self.doc_tokens.get(doc_id, [])
            doc_len = len(d_tokens)
            score = 0.0

            for q in query_tokens:
                if q in d_tokens:
                    tf = d_tokens.count(q) / max(1, doc_len)
                    idf = math.log((self.total_docs + 1) / (self.df.get(q, 0) + 1)) + 1.0
                    score += tf * idf

            # Boost if query matches tags exactly
            for tag in doc.get("tags", []):
                for q in query_tokens:
                    if q == tag or q in tag:
                        score += 0.5

            scores[doc_id] = score

        # Sort by score descending
        ranked_doc_ids = sorted(scores.keys(), key=lambda did: scores[did], reverse=True)
        results = []
        for did in ranked_doc_ids[:top_k]:
            doc = next(d for d in self.documents if d["id"] == did)
            results.append({
                **doc,
                "relevance_score": round(scores[did], 4),
            })
        return results

    def answer_query(self, query: str) -> Dict[str, Any]:
        """
        Synthesize a farmer-friendly answer grounded in retrieved documents.
        """
        retrieved_docs = self.search(query, top_k=2)

        if not retrieved_docs or retrieved_docs[0].get("relevance_score", 0) <= 0.05:
            # Query not matching existing knowledge base
            return {
                "query": query,
                "status": "partial_match",
                "answer": (
                    "We could not find an exact match in the current verified agronomic package of practices. "
                    "For specific pest outbreaks or severe crop loss, we strongly recommend posting your photograph "
                    "in Community Support or requesting verification from an Agricultural University expert."
                ),
                "sources": [],
                "disclaimer": "Agricultural recommendations should be verified by a local agricultural extension officer.",
                "safe_next_steps": [
                    "Inspect the underside of leaves for microscopic pests.",
                    "Avoid spraying unverified chemical cocktails.",
                    "Visit your nearest Raitha Samparka Kendra (RSK) with a fresh sample."
                ],
            }

        top_doc = retrieved_docs[0]
        # Extract the core advice from content
        content_lines = top_doc["content"].strip().split("\n")
        summary_paragraphs = [line.strip() for line in content_lines if line.strip() and not line.strip().startswith("-") and not line.strip().startswith("1.")][:3]
        summary_text = " ".join(summary_paragraphs)

        return {
            "query": query,
            "status": "grounded_answer",
            "crop": top_doc.get("crop"),
            "category": top_doc.get("category"),
            "title": top_doc.get("title"),
            "answer": summary_text or content_lines[0],
            "full_content": top_doc.get("content"),
            "sources": [
                {
                    "title": d["title"],
                    "source": d["source"],
                    "crop": d["crop"],
                    "relevance_score": d["relevance_score"],
                }
                for d in retrieved_docs
            ],
            "disclaimer": "Information sourced from ICAR/UAS Package of Practices. AI predictions are distinct from expert certifications.",
            "safe_next_steps": [
                "Verify symptoms against the full guide before applying inputs.",
                "Prefer biological controls (Trichoderma, Pseudomonas, Neem) as first-line defense.",
                "Always adhere to safety intervals before harvesting produce."
            ],
        }


# Singleton instance
rag_engine = AgriculturalRAGEngine()
