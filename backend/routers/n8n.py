from fastapi import APIRouter
from services.n8n_service import trigger_n8n_patient_triage, trigger_n8n_appointment_scheduler

router = APIRouter()

@router.post("/trigger-workflow")
async def trigger_n8n_workflow(data: dict):
    """
    Dummy endpoint representing an n8n webhook trigger.
    In a real scenario, this would forward data to a running n8n instance via HTTP requests.
    """
    
    # Simulate a call to a mock n8n automation webhook via the new tool
    result = await trigger_n8n_patient_triage(data)
    
    return {
        "status": "success",
        "message": "n8n automation workflow triggered successfully!",
        "workflow_details": {
            "name": "Patient Triage Automation",
            "triggered_by": "MedAI System",
            "n8n_response": result
        }
    }

@router.post("/trigger-scheduler")
async def trigger_scheduler_workflow(data: dict):
    """
    Trigger the appointment scheduler workflow in n8n.
    """
    result = await trigger_n8n_appointment_scheduler(data)
    
    return {
        "status": "success",
        "message": "Appointment scheduler triggered!",
        "workflow_details": {
             "name": "Scheduler Automation",
             "n8n_response": result
        }
    }

@router.get("/status")
def get_n8n_status():
    """
    Endpoint to check the status of n8n automation tasks.
    """
    return {
        "status": "success",
        "active_workflows": 2,
        "completed_workflows": 15,
        "n8n_connection": "healthy (Dummy Data)"
    }
