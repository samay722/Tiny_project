import requests, json, time

print('=== NeuroSense AI — Full System Check ===')
print()

results = {}
errors = []

# Health check
try:
    r = requests.get('http://127.0.0.1:5001/', timeout=3)
    results['API_HEALTH'] = 'ONLINE' if r.status_code == 200 else f'ERROR {r.status_code}'
except Exception as e:
    results['API_HEALTH'] = f'OFFLINE - {e}'
    errors.append('Backend not running')

# Text/NLP
try:
    r = requests.post('http://127.0.0.1:5001/analyze/text', json={'text': 'I feel calm and focused'}, timeout=10)
    d = r.json()
    results['NLP_MODEL'] = f"score={d['stress_score']}, status={d['status']}, detail={str(d['details'])[:60]}"
except Exception as e:
    results['NLP_MODEL'] = f'FAIL: {e}'
    errors.append('NLP failed')

time.sleep(0.5)

# Face
try:
    with open('backend/temp_face.jpg', 'rb') as f:
        r = requests.post('http://127.0.0.1:5001/analyze/face', files={'image': f}, timeout=30)
    d = r.json()
    det = d.get('details', {})
    results['FACE_EMOTION']  = f"score={d['stress_score']}, emotion={d['dominant_emotion']}, status={d['status']}"
    results['GAZE_TRACKING'] = f"gaze={det.get('gaze_stability','?')}, eye={det.get('eye_status','?')}, EAR={det.get('ear_value','?')}"
    results['POSTURE_BPM']   = f"posture={det.get('posture_status','?')}, BPM={d.get('heart_rate','?')}"
except Exception as e:
    results['FACE_EMOTION'] = f'FAIL: {e}'
    errors.append('Face failed')

time.sleep(0.5)

# Voice
try:
    with open('backend/temp_audio.webm', 'rb') as f:
        r = requests.post('http://127.0.0.1:5001/analyze/voice', files={'audio': f}, timeout=30)
    d = r.json()
    det = d.get('details', {})
    results['VOICE_MODEL'] = f"score={d['stress_score']}, pitch={det.get('avg_pitch_hz','?')}Hz, status={d['status']}"
except Exception as e:
    results['VOICE_MODEL'] = f'FAIL: {e}'
    errors.append('Voice failed')

time.sleep(0.5)

# History + fusion
try:
    r = requests.get('http://127.0.0.1:5001/history', timeout=5)
    d = r.json()
    results['FUSION_SCORE']  = f"global={d['current_fusion']}/100"
    results['FORECAST']      = f"next={d['forecast']}/100"
    results['DB_ENTRIES']    = f"{len(d['history'])} recent entries logged"
except Exception as e:
    results['DB_HISTORY'] = f'FAIL: {e}'
    errors.append('History failed')

print(f"{'COMPONENT':<22} {'STATUS'}")
print('-' * 75)
for k, v in results.items():
    icon = 'OK ' if 'FAIL' not in str(v) and 'OFFLINE' not in str(v) else 'ERR'
    print(f"[{icon}]  {k:<22} {v}")

print()
if errors:
    print(f'ISSUES FOUND: {errors}')
else:
    print('ALL SYSTEMS OPERATIONAL - 100% functional')
