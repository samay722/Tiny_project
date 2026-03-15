import httpx
import os

# Example of how you would connect with n8n Webhooks.
# Change the default URL to match your actual n8n instance
N8N_WEBHOOK_URL = os.getenv("N8N_WEBHOOK_URL", "http://localhost:5678/webhook/test")

async def trigger_n8n_patient_triage(patient_data: dict):
    """
    Tool function to trigger the patient triage workflow in n8n.
    """
    try:
         async with httpx.AsyncClient() as client:
            response = await client.post(N8N_WEBHOOK_URL, json=patient_data)
            
            # For testing without a real n8n instance, we will simulate a success if no real URL is reachable
            if response.status_code == 200:
                 return {"status": "success", "message": "Triggered real n8n instance.", "data": response.json()}
            
            return {"status": "error", "message": f"n8n returned error {response.status_code}"}
    except Exception as e:
         # Fallback mock for testing the frontend/automation visualization
         return {
             "status": "simulated_success", 
             "message": "Simulated triggering of n8n webhook",
             "simulated_steps": [
                 "Webhook received data",
                 "Format Data for Database",
                 "Analyze Symptoms with AI node",
                 "Send Slack Alert to Doctor"
             ]
        }

async def trigger_n8n_appointment_scheduler(appointment_details: dict):
     """
     Tool function to trigger a scheduling automation in n8n.
     """
     try:
          async with httpx.AsyncClient() as client:
              # In a real app, this would hit a different webhook URL
             response = await client.post(f"{N8N_WEBHOOK_URL}-schedule", json=appointment_details)
             if response.status_code == 200:
                  return {"status": "success", "data": response.json()}
             return {"status": "error", "message": f"error {response.status_code}"}
     except Exception as e:
         # Fallback mock
         return {
             "status": "simulated_success", 
             "simulated_steps": [
                 "Webhook received appointment data",
                 "Check Google Calendar Conflict",
                 "Create Calendar Event",
                 "Send Confirmation Email to Patient"
             ]
         }
