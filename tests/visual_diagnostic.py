import requests, os, time

API_URL = "http://127.0.0.1:5001"
TEST_IMG = "temp_face.jpg"

def run_visual_audit():
    print("=== NeuroSense AI | Deep Visual Parameter Audit ===")
    
    if not os.path.exists(TEST_IMG):
        print(f"ERROR: {TEST_IMG} not found. Please ensure the dashboard has run at least once.")
        return

    try:
        with open(TEST_IMG, 'rb') as f:
            r = requests.post(f"{API_URL}/analyze/face", files={'image': f}, timeout=10)
        
        data = r.json()
        details = data.get('details', {})
        
        checks = [
            ("Heart Rate (BPM)", data.get('heart_rate'), lambda x: x > 40 and x < 180),
            ("Gaze Stability", details.get('gaze_stability'), lambda x: x in ["Centered", "Looking Left", "Looking Right"]),
            ("Posture Analysis", details.get('posture'), lambda x: x in ["Upright", "Slouching", "Baseline Set", "Aligning..."]),
            ("Fatigue Detection", details.get('fatigue'), lambda x: x in ["Alert", "Drowsy"]),
            ("Neural Twin Index", data.get('global_score'), lambda x: x is not None),
            ("Emotion Fidelity", data.get('dominant_emotion'), lambda x: x != "unknown")
        ]
        
        print(f"{'PARAMETER':<25} | {'VALUE':<20} | {'STATUS':<10}")
        print("-" * 60)
        
        for name, val, logic in checks:
            status = "[PASS]" if logic(val) else "[FAIL]"
            print(f"{name:<25} | {str(val):<20} | {status:<10}")
            
    except Exception as e:
        print(f"CRITICAL AUDIT FAILURE: {e}")

if __name__ == "__main__":
    run_visual_audit()
