import requests
import json
import os
import time

API_URL = "http://127.0.0.1:5001"

def test_nlp():
    print("[NLP] Testing Sentiment Analysis...")
    texts = [
        "I am so happy and excited for the future!", # Low stress
        "I am absolutely furious and I want to scream.", # High stress
    ]
    for t in texts:
        r = requests.post(f"{API_URL}/analyze/text", json={"text": t})
        res = r.json()
        print(f"  Input: '{t}'")
        print(f"  Score: {res.get('stress_score')} | Dominant: {res.get('details')}")
        if res.get('status') != 'success': return False
    return True

def test_face():
    print("[FACE] Testing Biometric Analysis...")
    face_img = "backend/temp_face.jpg"
    if not os.path.exists(face_img):
        print("  ! Error: temp_face.jpg not found")
        return False
    
    with open(face_img, "rb") as f:
        r = requests.post(f"{API_URL}/analyze/face", files={"image": f})
    res = r.json()
    print(f"  Score: {res.get('stress_score')} | Emotion: {res.get('dominant_emotion')}")
    print(f"  Gaze: {res.get('details', {}).get('gaze_stability')} | EAR: {res.get('details', {}).get('ear_index')}")
    if res.get('status') != 'success': return False
    return True

def test_voice():
    print("[VOICE] Testing Audio Analysis...")
    audio_file = "backend/temp_audio.webm"
    if not os.path.exists(audio_file):
        print("  ! Error: temp_audio.webm not found")
        return False
    
    with open(audio_file, "rb") as f:
        r = requests.post(f"{API_URL}/analyze/voice", files={"audio": f})
    res = r.json()
    print(f"  Score: {res.get('stress_score')} | Pitch: {res.get('details', {}).get('avg_pitch_hz')}Hz")
    if res.get('status') != 'success': return False
    return True

def test_history():
    print("[HISTORY] Testing Data Fusion & Persistence...")
    r = requests.get(f"{API_URL}/history")
    res = r.json()
    print(f"  Global Fusion: {res.get('current_fusion')}")
    print(f"  Forecast: {res.get('forecast')}")
    print(f"  History count: {len(res.get('history', []))}")
    if res.get('status') != 'success': return False
    return True

if __name__ == "__main__":
    print("=== NEUROSENSE AI: FINAL VERIFICATION ===\n")
    try:
        s1 = test_nlp()
        time.sleep(1)
        s2 = test_face()
        time.sleep(1)
        s3 = test_voice()
        time.sleep(1)
        s4 = test_history()
        
        if all([s1, s2, s3, s4]):
            print("\n[SUCCESS] VERIFICATION COMPLETE: ALL SYSTEMS NOMINAL")
        else:
            print("\n[FAILURE] VERIFICATION FAILED: SYSTEM DEGRADED")
    except Exception as e:
        print(f"\n[ERROR] CRITICAL ERROR: {e}")
