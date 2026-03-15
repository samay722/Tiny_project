from fastapi import APIRouter

router = APIRouter()

@router.get("/metrics")
def get_dashboard_metrics():
    return {
        "status": "success",
        "total_patients_analyzed": 142,
        "active_cases": 12,
        "recent_alerts": 3
    }