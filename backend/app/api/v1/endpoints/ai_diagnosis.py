"""
AGRI SMART — AI Crop Diagnosis API Endpoints
File: backend/app/api/v1/endpoints/ai_diagnosis.py
"""

import os
import uuid
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.api.deps import get_current_active_user
from app.models.user import User, UserRole
from app.models.ai_diagnosis import AIDiagnosis
from app.schemas.ai_diagnosis import AIDiagnosisResponse
from app.crop_ai.classifier import crop_classifier
from app.services.gemini_service import gemini_service

router = APIRouter()

# Directory for storing uploaded crop leaf photos
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "uploads", "crop_images")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/diagnose", response_model=AIDiagnosisResponse, status_code=status.HTTP_201_CREATED)
async def diagnose_crop_image(
    file: UploadFile = File(...),
    crop_name: str = Form(default="General Crop"),
    crop_id: Optional[str] = Form(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Upload a leaf photograph to perform AI crop disease classification,
    symptom assessment, and retrieve verified organic & chemical treatments.
    """
    # 1. Read file bytes
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image file exceeds 10MB maximum limit.")

    # 2. Validate image quality and format
    is_valid, msg, img = crop_classifier.validate_image(contents)
    if not is_valid:
        raise HTTPException(status_code=400, detail=msg)

    # 3. Save image locally
    ext = os.path.splitext(file.filename)[1] or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    saved_path = os.path.join(UPLOAD_DIR, filename)
    with open(saved_path, "wb") as f:
        f.write(contents)

    image_url = f"/uploads/crop_images/{filename}"

    # 4. Run AI vision prediction (Google Gemini AI Multimodal Vision with fallback to local CNN)
    mime_type = "image/jpeg"
    if ext.lower() in [".png"]:
        mime_type = "image/png"
    elif ext.lower() in [".webp"]:
        mime_type = "image/webp"

    prediction = None
    if gemini_service.is_available():
        prediction = gemini_service.diagnose_crop_image(contents, mime_type=mime_type, crop_hint=crop_name)

    if not prediction:
        prediction = crop_classifier.predict(img, crop_hint=crop_name)

    # 5. Parse crop_id UUID if provided
    parsed_crop_id = None
    if crop_id:
        try:
            parsed_crop_id = uuid.UUID(crop_id)
        except ValueError:
            parsed_crop_id = None

    # 6. Save diagnosis record in database
    diagnosis = AIDiagnosis(
        farmer_id=current_user.id,
        crop_id=parsed_crop_id,
        crop_name=prediction["crop"] if prediction.get("crop") != "General Crop" else crop_name,
        image_path=saved_path,
        image_url=image_url,
        predicted_disease=prediction["disease_name"],
        vernacular_name=prediction["vernacular_name"],
        confidence_score=prediction["confidence_score"],
        severity=prediction["severity"],
        is_healthy=prediction["is_healthy"],
        symptoms=prediction["symptoms"],
        possible_causes=prediction["possible_causes"],
        safe_treatment_organic=prediction["safe_treatment_organic"],
        chemical_treatment=prediction["chemical_treatment"],
        prevention=prediction["prevention"],
        status="predicted",
        is_expert_verified=False,
    )
    db.add(diagnosis)
    db.commit()
    db.refresh(diagnosis)

    return diagnosis


@router.get("/diagnoses", response_model=List[AIDiagnosisResponse])
def list_diagnoses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    List historical AI diagnoses for the current farmer (or all if admin/expert).
    """
    query = db.query(AIDiagnosis)
    if current_user.role == UserRole.FARMER:
        query = query.filter(AIDiagnosis.farmer_id == current_user.id)

    return query.order_by(AIDiagnosis.created_at.desc()).all()


@router.get("/diagnoses/{diagnosis_id}", response_model=AIDiagnosisResponse)
def get_diagnosis_detail(
    diagnosis_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Get detailed diagnostic report for a specific image submission.
    """
    diag = db.query(AIDiagnosis).filter(AIDiagnosis.id == diagnosis_id).first()
    if not diag:
        raise HTTPException(status_code=404, detail="Diagnosis record not found")

    if current_user.role == UserRole.FARMER and diag.farmer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this diagnosis")

    return diag


@router.post("/diagnoses/{diagnosis_id}/request-expert", response_model=AIDiagnosisResponse)
def request_expert_verification(
    diagnosis_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Escalate an AI diagnosis to Agricultural University experts for formal review.
    """
    diag = db.query(AIDiagnosis).filter(AIDiagnosis.id == diagnosis_id).first()
    if not diag:
        raise HTTPException(status_code=404, detail="Diagnosis record not found")

    if diag.farmer_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")

    diag.status = "pending_expert_review"
    db.add(diag)
    db.commit()
    db.refresh(diag)
    return diag
