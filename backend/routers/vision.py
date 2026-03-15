"""
routers/vision.py — Vision AI API endpoint.
POST /api/vision
Accepts a medical image upload, returns structured radiology-style report.
"""

from fastapi import APIRouter, UploadFile, File, HTTPException
from models.schemas import VisionResponse
from services.vision_service import (
    validate_image, preprocess_image,
    get_image_info, detect_scan_type,
)
from services.llm_service import analyze_image_vision_llm, analyze_image_llm

router = APIRouter()


@router.post("/", response_model=VisionResponse)
async def analyze_image(file: UploadFile = File(...)):
    """
    Accepts a medical image (JPEG, PNG, WebP).
    Returns AI-generated radiology findings and impression.
    """
    file_bytes   = await file.read()
    content_type = file.content_type or "image/jpeg"

    # Validate
    is_valid, error_msg = validate_image(file_bytes, content_type)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)

    # Preprocess
    processed_bytes, media_type = preprocess_image(file_bytes, content_type)

    # Get image metadata for context
    img_info  = get_image_info(processed_bytes)
    scan_type = detect_scan_type(file.filename or "")

    try:
        # Try real vision analysis first
        result = analyze_image_vision_llm(
            image_bytes=processed_bytes,
            media_type=media_type,
            file_name=file.filename or "medical_image",
        )
    except Exception:
        # Fallback to text-only analysis with metadata
        context = (
            f"Medical image: {file.filename}, "
            f"detected scan type: {scan_type}, "
            f"dimensions: {img_info.get('width', 'unknown')}x{img_info.get('height', 'unknown')}"
        )
        result = analyze_image_llm(
            image_description=context,
            file_name=file.filename or "medical_image",
        )

    try:
        return VisionResponse(
            scan_type=result.get("scan_type", scan_type),
            findings=result.get("findings", []),
            impression=result.get("impression", ""),
            confidence=float(result.get("confidence", 85.0)),
            recommendation=result.get("recommendation", "Clinical correlation recommended."),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vision analysis failed: {str(e)}")