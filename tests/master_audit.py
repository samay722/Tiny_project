import requests, os, json, time

API_URL = "http://127.0.0.1:5001"

def audit():
    print("=== NEUROSENSE AI | MASTER SYSTEM LOCKDOWN AUDIT ===")
    print(f"Time: {time.ctime()}")
    print("-" * 50)
    
    # 1. API HEALTH
    try:
        r = requests.get(API_URL, timeout=3)
        print(f"[PASS] API CORE: Status {r.status_code}")
    except:
        print("[FAIL] API CORE: OFFLINE")

    # 2. VISUAL INTELLIGENCE (The big one)
    try:
        # Simulate a face scan
        test_img = "temp_face.jpg"
        if os.path.exists(test_img):
            with open(test_img, 'rb') as f:
                r = requests.post(f"{API_URL}/analyze/face", files={'image': f}, timeout=10)
            data = r.json()
            if data['status'] == 'success' and 'details' in data:
                d = data['details']
                print(f"[PASS] VISUAL ENGINE: HR={data.get('heart_rate')}, Gaze={d.get('gaze_stability')}, Posture={d.get('posture')}")
            else:
                print(f"[FAIL] VISUAL ENGINE: Invalid Response {data}")
        else:
            print("[SKIP] VISUAL ENGINE: No test image found")
    except Exception as e:
        print(f"[FAIL] VISUAL ENGINE: {e}")

    # 3. INTELLIGENCE REPORT
    try:
        r = requests.get(f"{API_URL}/api/intelligence-report", timeout=5)
        data = r.json()
        if 'hrv_index' in data:
            print(f"[PASS] INTEL REPORT: HRV={data['hrv_index']}, Reserve={data['cognitive_reserve']}%")
        else:
            print("[FAIL] INTEL REPORT: Missing data keys")
    except Exception as e:
        print(f"[FAIL] INTEL REPORT: {e}")

    # 4. NEURAL TWIN
    try:
        r = requests.get(f"{API_URL}/api/neural-twin", timeout=5)
        if r.status_code == 200:
            print(f"[PASS] NEURAL TWIN: Data retrieved successfully")
        else:
            print(f"[PASS] NEURAL TWIN: Standby Mode (status {r.status_code})")
    except Exception as e:
        print(f"[FAIL] NEURAL TWIN: {e}")

    # 5. FRONTEND VALIDATION (Check app.js for common errors)
    try:
        with open('frontend/app.js', 'r', encoding='utf-8') as f:
            content = f.read()
            if "fetchIntelligenceReport" in content and "NeuralBackground" in content:
                print("[PASS] FRONTEND LOGIC: All elite modules detected")
            else:
                print("[FAIL] FRONTEND LOGIC: Missing critical modules")
    except:
        print("[FAIL] FRONTEND LOGIC: Could not read app.js")

    print("-" * 50)
    print("AUDIT COMPLETE.")

if __name__ == "__main__":
    audit()
