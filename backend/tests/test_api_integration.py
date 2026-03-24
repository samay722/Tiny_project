from fastapi.testclient import TestClient
from api_server import app

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "MedAI API is running", "version": "1.0.0"}

def test_read_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_dashboard_metrics():
    response = client.get("/api/dashboard/metrics")
    assert response.status_code == 200
    assert response.json()["status"] == "success"
    assert "total_patients_analyzed" in response.json()

def test_communication_status():
    response = client.get("/api/communication/status")
    assert response.status_code == 200
    assert "email_channel" in response.json()
    assert "call_channel" in response.json()
