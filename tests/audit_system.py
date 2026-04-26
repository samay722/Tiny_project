import requests
import os

API_URL = "http://localhost:5001"

def check(name, status, detail=""):
    print(f"[{'PASS' if status else 'FAIL'}] {name.upper():<15} | {detail}")

def run_tests():
    print("=== NEUROSENSE AI: FULL COMPONENT AUDIT ===\n")
    
    # 1. API Root
    try:
        r = requests.get(API_URL)
        check("API Root", r.status_code == 200, "Backend is reachable")
    except Exception as e:
        check("API Root", False, str(e))

    # 2. NLP (Text)
    try:
        r = requests.post(f"{API_URL}/analyze/text", json={"text": "I am stressed but focused."})
        res = r.json()
        check("NLP Module", res.get("status") == "success", f"Score: {res.get('stress_score')}")
    except Exception as e:
        check("NLP Module", False, str(e))

    # 3. Face (Vision)
    try:
        with open("backend/temp_face.jpg", "rb") as f:
            r = requests.post(f"{API_URL}/analyze/face", files={"image": f})
        res = r.json()
        check("Face Module", res.get("status") == "success", f"Score: {res.get('stress_score')}, Gaze: {res.get('details', {}).get('gaze_stability')}")
    except Exception as e:
        check("Face Module", False, str(e))

    # 4. Voice (Audio)
    try:
        with open("backend/temp_audio.webm", "rb") as f:
            r = requests.post(f"{API_URL}/analyze/voice", files={"audio": f})
        res = r.json()
        check("Voice Module", res.get("status") == "success", f"Score: {res.get('stress_score')}")
    except Exception as e:
        check("Voice Module", False, str(e))

    # 5. Behavior
    try:
        r = requests.post(f"{API_URL}/analyze/behavior", json={"score": 30})
        res = r.json()
        check("Behavior Module", res.get("status") == "success", f"Global Score: {res.get('global_score')}")
    except Exception as e:
        check("Behavior Module", False, str(e))

    # 6. Database / History
    try:
        r = requests.get(f"{API_URL}/history")
        res = r.json()
        check("Database/History", res.get("status") == "success", f"Entries: {len(res.get('history', []))}")
    except Exception as e:
        check("Database/History", False, str(e))

    # 7. PDF Report
    try:
        r = requests.get(f"{API_URL}/download-report")
        check("PDF Report", r.status_code == 200 and r.headers.get("Content-Type") == "application/pdf", "PDF generated successfully")
    except Exception as e:
        check("PDF Report", False, str(e))

if __name__ == "__main__":
    run_tests()
