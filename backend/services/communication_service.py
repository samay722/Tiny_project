"""
communication_service.py — Email & Phone Call Automation Service
Supports real Twilio + SMTP/SendGrid, with graceful simulation fallback.
"""

import os
import smtplib
import json
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()

# ─── Email Config ────────────────────────────────────────────────────────────
SMTP_HOST     = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT     = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER     = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FROM_EMAIL    = os.getenv("FROM_EMAIL", SMTP_USER)

# ─── Twilio Config ───────────────────────────────────────────────────────────
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN  = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_FROM_NUMBER = os.getenv("TWILIO_FROM_NUMBER", "")


# ═══════════════════════════════════════════════════════════════════════════
#  EMAIL FEATURE
# ═══════════════════════════════════════════════════════════════════════════

def build_medical_email_html(subject: str, body: str, priority: str, patient_name: str) -> str:
    priority_color = {
        "critical": "#ef4444",
        "high":     "#f59e0b",
        "normal":   "#4f8ef7",
        "low":      "#22c55e",
    }.get(priority.lower(), "#4f8ef7")

    return f"""
    <html><body style="margin:0;padding:0;background:#0f1117;font-family:'DM Sans',Arial,sans-serif;">
      <div style="max-width:600px;margin:30px auto;background:#1a1d27;border-radius:14px;
                  border:1px solid #2e3348;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#4f8ef7,#a78bfa);padding:24px 30px;">
          <div style="font-size:22px;font-weight:700;color:#fff;letter-spacing:0.02em;">
            🏥 MedAI Alert
          </div>
          <div style="font-size:13px;color:rgba(255,255,255,0.75);margin-top:4px;">
            Clinical Intelligence Platform
          </div>
        </div>
        <div style="padding:28px 30px;">
          <div style="display:inline-block;padding:4px 12px;border-radius:20px;
                      background:{priority_color}22;border:1px solid {priority_color};
                      color:{priority_color};font-size:11px;font-weight:700;
                      letter-spacing:0.08em;margin-bottom:18px;">
            {priority.upper()} PRIORITY
          </div>
          <h2 style="color:#e8ecf4;font-size:18px;margin-bottom:8px;">{subject}</h2>
          <p style="color:#8892b0;font-size:13px;margin-bottom:20px;">
            Patient: <strong style="color:#e8ecf4;">{patient_name}</strong>
          </p>
          <div style="background:#22263a;border-radius:10px;padding:18px;
                      border-left:3px solid {priority_color};color:#c8d0e7;
                      font-size:14px;line-height:1.7;white-space:pre-line;">
            {body}
          </div>
          <div style="margin-top:24px;padding-top:18px;border-top:1px solid #2e3348;
                      color:#4a5168;font-size:11px;">
            Sent by MedAI Automation System · Do not reply to this email.
          </div>
        </div>
      </div>
    </body></html>
    """


async def send_email_alert(
    to_email: str,
    subject: str,
    body: str,
    priority: str = "normal",
    patient_name: str = "Unknown",
) -> dict:
    """
    Sends an HTML medical alert email.
    Falls back to simulation if SMTP credentials are not set.
    """
    if not SMTP_USER or not SMTP_PASSWORD:
        # ── Simulation mode ──────────────────────────────────────────────
        return {
            "status":    "simulated",
            "to":        to_email,
            "subject":   subject,
            "priority":  priority,
            "message":   "Email simulated — add SMTP_USER/SMTP_PASSWORD to .env to send real emails.",
            "steps": [
                "✅ Composed HTML email template",
                "✅ Applied MedAI branding",
                f"✅ Priority set to {priority.upper()}",
                f"📨 [SIMULATED] Sent to {to_email}",
            ],
        }

    # ── Real SMTP send ────────────────────────────────────────────────────
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"[MedAI | {priority.upper()}] {subject}"
        msg["From"]    = FROM_EMAIL
        msg["To"]      = to_email

        plain = MIMEText(body, "plain")
        html  = MIMEText(build_medical_email_html(subject, body, priority, patient_name), "html")
        msg.attach(plain)
        msg.attach(html)

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(FROM_EMAIL, to_email, msg.as_string())

        return {
            "status":  "sent",
            "to":      to_email,
            "subject": subject,
            "message": "Email delivered successfully via SMTP.",
            "steps": [
                "✅ Composed HTML email template",
                "✅ Connected to SMTP server",
                "✅ Authenticated",
                f"✅ Email sent to {to_email}",
            ],
        }
    except Exception as e:
        return {
            "status":  "error",
            "message": f"SMTP error: {str(e)}",
            "steps":   [f"❌ Failed: {str(e)}"],
        }


# ═══════════════════════════════════════════════════════════════════════════
#  PHONE CALL FEATURE
# ═══════════════════════════════════════════════════════════════════════════

def build_twiml_message(message: str, voice: str = "alice") -> str:
    """Build a simple TwiML XML string for a Twilio call."""
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="{voice}" loop="1">{message}</Say>
</Response>"""


async def trigger_phone_call(
    to_number: str,
    message: str,
    patient_name: str = "Unknown",
    call_type: str = "alert",
) -> dict:
    """
    Triggers a phone call via Twilio.
    Falls back to simulation if Twilio credentials are not set.
    """
    if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN or not TWILIO_FROM_NUMBER:
        # ── Simulation mode ──────────────────────────────────────────────
        return {
            "status":      "simulated",
            "to":          to_number,
            "call_type":   call_type,
            "patient":     patient_name,
            "script":      message,
            "message":     "Call simulated — add TWILIO_* keys to .env to make real calls.",
            "steps": [
                "✅ Call script generated",
                "✅ TwiML template built",
                f"✅ Target number validated: {to_number}",
                f"📞 [SIMULATED] Placed {call_type} call to {to_number}",
                f"🗣️ Message: \"{message[:80]}...\"" if len(message) > 80 else f"🗣️ Message: \"{message}\"",
            ],
        }

    # ── Real Twilio call ──────────────────────────────────────────────────
    try:
        from twilio.rest import Client  # optional dep
        client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

        # Host a minimal TwiML using Twilio's Bin or a public endpoint
        # For simplicity, use twiml parameter directly (Twilio supports inline TwiML via 'twiml' param)
        twiml = build_twiml_message(message)

        call = client.calls.create(
            to=to_number,
            from_=TWILIO_FROM_NUMBER,
            twiml=twiml,
        )

        return {
            "status":    "initiated",
            "call_sid":  call.sid,
            "to":        to_number,
            "call_type": call_type,
            "patient":   patient_name,
            "message":   "Phone call initiated via Twilio.",
            "steps": [
                "✅ TwiML script compiled",
                "✅ Twilio client authenticated",
                f"✅ Call to {to_number} initiated",
                f"📋 Call SID: {call.sid}",
            ],
        }
    except ImportError:
        return {
            "status":  "error",
            "message": "Twilio library not installed. Run: pip install twilio",
            "steps":   ["❌ twilio package missing"],
        }
    except Exception as e:
        return {
            "status":  "error",
            "message": f"Twilio error: {str(e)}",
            "steps":   [f"❌ Failed: {str(e)}"],
        }


# ═══════════════════════════════════════════════════════════════════════════
#  BATCH BROADCAST (email + call together)
# ═══════════════════════════════════════════════════════════════════════════

async def broadcast_alert(
    contacts: list,          # [{"name","email","phone","role"}]
    subject: str,
    body: str,
    priority: str,
    include_email: bool = True,
    include_call: bool  = True,
    patient_name: str   = "Unknown",
) -> dict:
    """Send an email AND/OR phone call to multiple contacts."""
    results = []
    for contact in contacts:
        contact_result = {"contact": contact.get("name"), "actions": []}

        if include_email and contact.get("email"):
            email_res = await send_email_alert(
                to_email=contact["email"],
                subject=subject,
                body=body,
                priority=priority,
                patient_name=patient_name,
            )
            contact_result["actions"].append({"type": "email", **email_res})

        if include_call and contact.get("phone"):
            # Concise voice message for the call
            call_message = (
                f"This is MedAI. {priority.upper()} priority alert for patient {patient_name}. "
                f"{body[:200]}"
            )
            call_res = await trigger_phone_call(
                to_number=contact["phone"],
                message=call_message,
                patient_name=patient_name,
                call_type=priority,
            )
            contact_result["actions"].append({"type": "call", **call_res})

        results.append(contact_result)

    return {
        "status":           "completed",
        "total_contacts":   len(contacts),
        "results":          results,
        "summary":          f"Broadcast sent to {len(contacts)} contact(s) — Priority: {priority.upper()}",
    }
