"""
routers/communication.py — Email & Phone Call Automation API
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from services.communication_service import (
    send_email_alert,
    trigger_phone_call,
    broadcast_alert,
)

router = APIRouter()


# ─── Request / Response Models ───────────────────────────────────────────────

class EmailRequest(BaseModel):
    to_email: str
    subject: str
    body: str
    priority: Optional[str] = "normal"      # critical | high | normal | low
    patient_name: Optional[str] = "Unknown"


class PhoneCallRequest(BaseModel):
    to_number: str                           # E.164 format: +919876543210
    message: str
    patient_name: Optional[str] = "Unknown"
    call_type: Optional[str] = "alert"      # alert | reminder | emergency


class ContactModel(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = "staff"


class BroadcastRequest(BaseModel):
    contacts: List[ContactModel]
    subject: str
    body: str
    priority: Optional[str] = "high"
    include_email: Optional[bool] = True
    include_call: Optional[bool] = True
    patient_name: Optional[str] = "Unknown"


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/send-email")
async def api_send_email(req: EmailRequest):
    """
    Send a medical alert email to a specified address.
    Simulates if SMTP credentials are not configured.
    """
    if not req.to_email or "@" not in req.to_email:
        raise HTTPException(status_code=400, detail="Invalid email address.")
    if not req.subject.strip() or not req.body.strip():
        raise HTTPException(status_code=400, detail="Subject and body are required.")

    result = await send_email_alert(
        to_email=req.to_email,
        subject=req.subject,
        body=req.body,
        priority=req.priority,
        patient_name=req.patient_name,
    )
    return {"endpoint": "send-email", **result}


@router.post("/trigger-call")
async def api_trigger_call(req: PhoneCallRequest):
    """
    Initiate a phone call with a spoken medical alert.
    Simulates if Twilio credentials are not configured.
    """
    if not req.to_number.strip():
        raise HTTPException(status_code=400, detail="Phone number is required.")
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Call message is required.")

    result = await trigger_phone_call(
        to_number=req.to_number,
        message=req.message,
        patient_name=req.patient_name,
        call_type=req.call_type,
    )
    return {"endpoint": "trigger-call", **result}


@router.post("/broadcast")
async def api_broadcast(req: BroadcastRequest):
    """
    Broadcast an email AND/OR phone call to multiple contacts at once.
    """
    if not req.contacts:
        raise HTTPException(status_code=400, detail="At least one contact is required.")

    result = await broadcast_alert(
        contacts=[c.dict() for c in req.contacts],
        subject=req.subject,
        body=req.body,
        priority=req.priority,
        include_email=req.include_email,
        include_call=req.include_call,
        patient_name=req.patient_name,
    )
    return result


@router.get("/status")
def communication_status():
    """Returns availability status of communication channels."""
    import os
    smtp_ready   = bool(os.getenv("SMTP_USER") and os.getenv("SMTP_PASSWORD"))
    twilio_ready = bool(
        os.getenv("TWILIO_ACCOUNT_SID")
        and os.getenv("TWILIO_AUTH_TOKEN")
        and os.getenv("TWILIO_FROM_NUMBER")
    )
    return {
        "email_channel": {
            "status":   "live" if smtp_ready   else "simulation",
            "provider": "SMTP / Gmail"  if smtp_ready   else "Simulated (no SMTP creds)",
        },
        "call_channel": {
            "status":   "live" if twilio_ready else "simulation",
            "provider": "Twilio" if twilio_ready else "Simulated (no Twilio creds)",
        },
    }
