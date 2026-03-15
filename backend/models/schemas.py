from pydantic import BaseModel
from typing import List, Optional

class SymptomRequest(BaseModel):
    symptoms: List[str]
    age: int
    duration: str
    context: Optional[str] = None

class SymptomResponse(BaseModel):
    summary: str
    conditions: List[str]
    recommendations: List[str]
    disclaimer: str

class RagRequest(BaseModel):
    query: str

class AgenticRequest(BaseModel):
    task: str
    patient_id: Optional[str] = None

class AgenticResponse(BaseModel):
    task_id: str
    steps: List[str]
    summary: str
    sections: List[str]

class VisionResponse(BaseModel):
    scan_type: str
    findings: List[str]
    impression: str
    confidence: float
    recommendation: str