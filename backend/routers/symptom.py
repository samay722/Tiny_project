"""
routers/symptom.py — Symptom Checker API endpoint.
POST /api/symptom-checker
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from models.schemas import SymptomRequest, SymptomResponse
from services.llm_service import analyze_symptoms_llm
from database import get_db
from models.database_models import Diagnosis

router = APIRouter()


@router.post("/", response_model=SymptomResponse)
async def analyze_symptoms(request: SymptomRequest, db: Session = Depends(get_db)):
    """
    Accepts a list of symptoms, patient age, and duration.
    Returns AI-powered differential diagnosis and saves to DB.
    """
    if not request.symptoms:
        raise HTTPException(status_code=400, detail="At least one symptom is required.")

    try:
        result = analyze_symptoms_llm(
            symptoms=request.symptoms,
            age=request.age,
            duration=request.duration,
            context=request.context or "",
        )

        # Validate required keys exist
        if "conditions" not in result or "summary" not in result:
            raise ValueError("Invalid response structure from AI model.")

        # Save to Database
        new_diagnosis = Diagnosis(
            patient_age=request.age,
            symptoms=request.symptoms,
            diagnosis_summary=result.get("summary", ""),
            possible_conditions=result.get("conditions", []),
            recommendations=result.get("recommendations", [])
        )
        db.add(new_diagnosis)
        db.commit()
        db.refresh(new_diagnosis)

        return SymptomResponse(
            summary=result.get("summary", ""),
            conditions=result.get("conditions", []),
            recommendations=result.get("recommendations", []),
            disclaimer=result.get("disclaimer",
                "This analysis is for informational purposes only and does not constitute medical advice. "
                "Always consult a qualified healthcare professional."
            ),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Symptom analysis failed: {str(e)}")