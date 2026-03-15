"""
routers/agentic.py — Agentic AI API endpoint.
POST /api/agentic
"""

from fastapi import APIRouter, HTTPException
from models.schemas import AgenticRequest, AgenticResponse
from services.agentic_service import execute_agentic_task

router = APIRouter()


@router.post("/", response_model=AgenticResponse)
async def run_agentic(request: AgenticRequest):
    """
    Accepts a complex medical task.
    Agent plans, executes, and returns a multi-section structured report.
    """
    if len(request.task.strip()) < 5:
        raise HTTPException(status_code=400, detail="Task description is too short.")

    try:
        result = execute_agentic_task(request.task)
        return AgenticResponse(
            task_id=result["task_id"],
            steps=result["steps"],
            summary=result["summary"],
            sections=result["sections"],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agentic task failed: {str(e)}")