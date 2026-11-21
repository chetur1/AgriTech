"""
AGRI SMART — Community Forum Endpoints  (Phase 10)
File: backend/app/api/v1/endpoints/community.py

Simple file-backed community Q&A forum.
Posts are stored as JSON in community_posts.json (dev mode).
In production, migrate to PostgreSQL table.
"""

from __future__ import annotations
import uuid, json, os
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user
from app.database.session import get_db
from app.models.user import User

router = APIRouter()

POSTS_FILE = os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "community_posts.json")

def _load_posts():
    if not os.path.exists(POSTS_FILE):
        return []
    try:
        with open(POSTS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def _save_posts(posts):
    os.makedirs(os.path.dirname(os.path.abspath(POSTS_FILE)), exist_ok=True)
    with open(POSTS_FILE, "w", encoding="utf-8") as f:
        json.dump(posts, f, ensure_ascii=False, indent=2, default=str)


# ---------------------------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------------------------

VALID_CATEGORIES = [
    "Disease Help",
    "Pest Control",
    "Soil & Fertilizer",
    "Market Prices",
    "Weather",
    "Government Schemes",
    "General",
]


class PostCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=200)
    body: str = Field(..., min_length=10, max_length=5000)
    category: str = Field(default="General")
    tags: List[str] = Field(default_factory=list)

    class Config:
        json_schema_extra = {
            "example": {
                "title": "What is the best fertilizer for wheat?",
                "body": "I am growing wheat in sandy loam soil. Which NPK ratio should I use?",
                "category": "Soil & Fertilizer",
                "tags": ["wheat", "fertilizer", "NPK"],
            }
        }


class ReplyCreate(BaseModel):
    body: str = Field(..., min_length=5, max_length=2000)

    class Config:
        json_schema_extra = {
            "example": {"body": "I would recommend a 10-20-10 NPK ratio for wheat in sandy loam soil."}
        }


class ReplyResponse(BaseModel):
    id: str
    post_id: str
    body: str
    author_name: str
    author_role: str
    is_expert_verified: bool
    created_at: str


class PostResponse(BaseModel):
    id: str
    title: str
    body: str
    category: str
    tags: List[str]
    author_name: str
    author_district: Optional[str]
    author_role: str
    created_at: str
    reply_count: int
    is_reported: bool


class PostDetailResponse(PostResponse):
    replies: List[ReplyResponse]


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get("/", response_model=List[PostResponse], summary="List community posts")
def list_posts(
    category: Optional[str] = Query(None, description="Filter by category"),
    search: Optional[str] = Query(None, description="Keyword search in title and body"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """
    Return all community posts sorted newest first.
    Optionally filter by category and/or keyword search in title + body.
    """
    posts = _load_posts()

    # Filter by category
    if category:
        posts = [p for p in posts if p.get("category", "").lower() == category.lower()]

    # Keyword search in title and body
    if search:
        kw = search.lower()
        posts = [
            p for p in posts
            if kw in p.get("title", "").lower() or kw in p.get("body", "").lower()
        ]

    # Sort newest first
    posts.sort(key=lambda p: p.get("created_at", ""), reverse=True)

    # Paginate
    page = posts[offset: offset + limit]

    return [
        PostResponse(
            id=p["id"],
            title=p["title"],
            body=p["body"],
            category=p.get("category", "General"),
            tags=p.get("tags", []),
            author_name=p.get("author_name", "Unknown"),
            author_district=p.get("author_district"),
            author_role=p.get("author_role", "farmer"),
            created_at=p["created_at"],
            reply_count=len(p.get("replies", [])),
            is_reported=p.get("is_reported", False),
        )
        for p in page
    ]


@router.post("/", response_model=PostDetailResponse, status_code=201, summary="Create a new post")
def create_post(
    payload: PostCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Create a new community forum post.
    Author info is populated from the authenticated user's profile.
    """
    if payload.category not in VALID_CATEGORIES:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid category. Choose from: {', '.join(VALID_CATEGORIES)}",
        )

    posts = _load_posts()

    is_expert = getattr(current_user, "role", "farmer") in ("expert", "admin")

    post = {
        "id": str(uuid.uuid4()),
        "title": payload.title,
        "body": payload.body,
        "category": payload.category,
        "tags": [t.strip() for t in payload.tags if t.strip()],
        "author_id": str(current_user.id),
        "author_name": getattr(current_user, "full_name", None) or current_user.email,
        "author_district": getattr(current_user, "district", None),
        "author_role": getattr(current_user, "role", "farmer"),
        "is_expert_verified": is_expert,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "replies": [],
        "is_reported": False,
    }

    posts.append(post)
    _save_posts(posts)

    return PostDetailResponse(
        id=post["id"],
        title=post["title"],
        body=post["body"],
        category=post["category"],
        tags=post["tags"],
        author_name=post["author_name"],
        author_district=post["author_district"],
        author_role=post["author_role"],
        created_at=post["created_at"],
        reply_count=0,
        is_reported=False,
        replies=[],
    )


@router.get("/{post_id}", response_model=PostDetailResponse, summary="Get single post with replies")
def get_post(post_id: str):
    """
    Retrieve a single post by ID including all its replies.
    """
    posts = _load_posts()
    post = next((p for p in posts if p["id"] == post_id), None)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    replies = [
        ReplyResponse(
            id=r["id"],
            post_id=r["post_id"],
            body=r["body"],
            author_name=r.get("author_name", "Unknown"),
            author_role=r.get("author_role", "farmer"),
            is_expert_verified=r.get("is_expert_verified", False),
            created_at=r["created_at"],
        )
        for r in post.get("replies", [])
    ]

    return PostDetailResponse(
        id=post["id"],
        title=post["title"],
        body=post["body"],
        category=post.get("category", "General"),
        tags=post.get("tags", []),
        author_name=post.get("author_name", "Unknown"),
        author_district=post.get("author_district"),
        author_role=post.get("author_role", "farmer"),
        created_at=post["created_at"],
        reply_count=len(replies),
        is_reported=post.get("is_reported", False),
        replies=replies,
    )


@router.post("/{post_id}/replies", response_model=ReplyResponse, status_code=201, summary="Add reply to a post")
def add_reply(
    post_id: str,
    payload: ReplyCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Add a reply to an existing community post.
    Replies from experts/admins are automatically marked as expert-verified.
    """
    posts = _load_posts()
    idx = next((i for i, p in enumerate(posts) if p["id"] == post_id), None)
    if idx is None:
        raise HTTPException(status_code=404, detail="Post not found")

    is_expert = getattr(current_user, "role", "farmer") in ("expert", "admin")

    reply = {
        "id": str(uuid.uuid4()),
        "post_id": post_id,
        "body": payload.body,
        "author_id": str(current_user.id),
        "author_name": getattr(current_user, "full_name", None) or current_user.email,
        "author_role": getattr(current_user, "role", "farmer"),
        "is_expert_verified": is_expert,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    posts[idx].setdefault("replies", []).append(reply)
    _save_posts(posts)

    return ReplyResponse(
        id=reply["id"],
        post_id=reply["post_id"],
        body=reply["body"],
        author_name=reply["author_name"],
        author_role=reply["author_role"],
        is_expert_verified=reply["is_expert_verified"],
        created_at=reply["created_at"],
    )


@router.post("/{post_id}/report", summary="Report / flag a post")
def report_post(
    post_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Flag a post as reported. Any authenticated user can report a post.
    Sets is_reported=True so moderators can review it.
    """
    posts = _load_posts()
    idx = next((i for i, p in enumerate(posts) if p["id"] == post_id), None)
    if idx is None:
        raise HTTPException(status_code=404, detail="Post not found")

    if posts[idx].get("is_reported"):
        return {"message": "Post is already reported", "post_id": post_id}

    posts[idx]["is_reported"] = True
    _save_posts(posts)

    return {"message": "Post reported successfully", "post_id": post_id}


@router.delete("/{post_id}", status_code=204, summary="Delete own post (or admin)")
def delete_post(
    post_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Delete a post. Users can only delete their own posts.
    Admins may delete any post.
    """
    posts = _load_posts()
    idx = next((i for i, p in enumerate(posts) if p["id"] == post_id), None)
    if idx is None:
        raise HTTPException(status_code=404, detail="Post not found")

    post = posts[idx]
    is_admin = getattr(current_user, "role", "farmer") == "admin"
    is_owner = post.get("author_id") == str(current_user.id)

    if not is_owner and not is_admin:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to delete this post",
        )

    posts.pop(idx)
    _save_posts(posts)
    # 204 No Content — return nothing
