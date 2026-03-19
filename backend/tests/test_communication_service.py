import pytest
from services.communication_service import send_email_alert, trigger_phone_call
from unittest.mock import patch

@pytest.mark.asyncio
@patch('services.communication_service.SMTP_USER', "")
@patch('services.communication_service.SMTP_PASSWORD', "")
async def test_send_email_fallback_simulation():
    # When SMTP_USER/PASSWORD are empty, it should return 'simulated'
    result = await send_email_alert("test@example.com", "Subject", "Body")
    assert result['status'] == "simulated"
    assert "Email simulated" in result['message']
    assert len(result['steps']) > 0

@pytest.mark.asyncio
@patch('services.communication_service.TWILIO_ACCOUNT_SID', "")
@patch('services.communication_service.TWILIO_AUTH_TOKEN', "")
async def test_trigger_phone_call_fallback_simulation():
    # When Twilio keys are empty, it should return 'simulated'
    result = await trigger_phone_call("+1234567890", "Hello Test")
    assert result['status'] == "simulated"
    assert "Call simulated" in result['message']
    assert len(result['steps']) > 0
