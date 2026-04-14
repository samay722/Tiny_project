from flask import Flask, request, jsonify
from flask_cors import CORS
import random
import time
import os
import sys

# Allow backend to import ml_models from root
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from ml_models.face_model import FaceStressModel
    face_model = FaceStressModel()
except ImportError:
    print("Warning: face_model could not be imported. Using Mock.")
    face_model = None

try:
    from ml_models.nlp_model import NLPStressModel
    nlp_model = NLPStressModel()
except ImportError:
    print("Warning: nlp_model could not be imported.")
    nlp_model = None

try:
    from ml_models.voice_model import VoiceStressModel
    voice_model = VoiceStressModel()
except ImportError:
    print("Warning: voice_model could not be imported.")
    voice_model = None

app = Flask(__name__)
# Enable CORS so frontend (running locally) can bridge to backend
CORS(app)

import sqlite3

# Initialize Database
DB_PATH = 'stress_history.db'

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS stress_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT,
            score INTEGER,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

init_db()

def save_to_db(model_type, score):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('INSERT INTO stress_logs (type, score) VALUES (?, ?)', (model_type, score))
    conn.commit()
    conn.close()

def get_recent_history(limit=10):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('SELECT id, type, score, timestamp FROM stress_logs ORDER BY id DESC LIMIT ?', (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [{
        "id": r[0],
        "type": r[1],
        "score": r[2],
        "timestamp": r[3]
    } for r in rows]

def calculate_forecast():
    """
    Project the stress trend for the next 20 minutes using Linear Regression.
    """
    history = get_recent_history(5)
    if len(history) < 3: return None
    
    # Use index as x, score as y
    y = [r['score'] for r in reversed(history)]
    x = list(range(len(y)))
    n = len(y)
    
    sum_x = sum(x)
    sum_y = sum(y)
    sum_xx = sum(i*i for i in x)
    sum_xy = sum(i*j for i,j in zip(x,y))
    
    # Slope m = (n*sum_xy - sum_x*sum_y) / (n*sum_xx - sum_x^2)
    denom = (n * sum_xx - sum_x**2)
    if denom == 0: return y[-1]
    
    m = (n * sum_xy - sum_x * sum_y) / denom
    c = (sum_y - m * sum_x) / n
    
    # Predict next value (x = n)
    projected = int(m * n + c)
    return max(0, min(100, projected))

def calculate_fusion_score():
    """
    Weighted Average of the most recent reading for each type.
    Weights: Face (40%), Voice (40%), Text (20%)
    """
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Get latest score for each type
    scores = {}
    for mtype in ['Face', 'Voice', 'Text']:
        cursor.execute('SELECT score FROM stress_logs WHERE type = ? ORDER BY id DESC LIMIT 1', (mtype,))
        res = cursor.fetchone()
        scores[mtype] = res[0] if res else None
    
    conn.close()
    
    # Calculate weighted average for available scores
    weights = {'Face': 0.4, 'Voice': 0.4, 'Text': 0.2}
    total_weight = 0
    weighted_sum = 0
    
    for mtype, score in scores.items():
        if score is not None:
            weighted_sum += score * weights[mtype]
            total_weight += weights[mtype]
            
    if total_weight == 0: return 50 # Fallback
    return int(weighted_sum / total_weight)

def check_anomaly(score):
    """
    Check if the current score is an anomaly (spike) compared to history.
    """
    history = get_recent_history(5) # Look at last 5
    if len(history) < 3: return False
    
    avg_score = sum(r['score'] for r in history) / len(history)
    # If the score is 30% higher than average, it's a spike
    return score > (avg_score * 1.3)

def generate_smart_tip(score, mtype):
    """
    AI-driven advice based on stress source and severity.
    """
    if score < 40:
        return "Baseline stable. Continue with your current task flow."
    
    tips = {
        'Face': "Frequent tension detected in facial muscles. Try a 10-second 'jaw-release' exercise.",
        'Voice': "Vocal pitch instability detected. Slow down your breathing to stabilize resonance.",
        'Text': "High arousal language detected. Consider a 2-minute cognitive journaling break.",
        'Fusion': "Global stress is elevating. System recommends a physical movement break (e.g., standing stretch)."
    }
    return tips.get(mtype, "Deep breaths are recommended.")

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({"status": "Running", "message": "NeuroSense API Live with Anomaly Detection."})

# ---------------------------------------------------------
# DAY 1: DUMMY ROUTES (Returns Random Stress Scores 0-100)
# DAY 2: Integrate ML models here
# ---------------------------------------------------------

@app.route('/analyze/voice', methods=['POST'])
def analyze_voice():
    if 'audio' not in request.files:
        return jsonify({"error": "No audio uploaded"}), 400

    audio_file = request.files['audio']
    temp_path = "temp_audio.webm"
    audio_file.save(temp_path)

    if voice_model:
        prediction = voice_model.predict(temp_path)
        score = prediction.get("score", 50)
        details = prediction.get("details", {})
    else:
        print("Fallback: voice_model not initialized")
        score = random.randint(10, 95)
        details = {}

    save_to_db('Voice', score)
    return jsonify({
        "source": "voice",
        "stress_score": score,
        "global_score": calculate_fusion_score(),
        "forecast": calculate_forecast(),
        "is_anomaly": check_anomaly(score),
        "smart_tip": generate_smart_tip(score, 'Voice'),
        "status": "success",
        "details": details
    })

@app.route('/analyze/face', methods=['POST'])
def analyze_face():
    # Day 2: Image Analysis using DeepFace
    if 'image' not in request.files:
        return jsonify({"error": "No image uploaded"}), 400
        
    image_file = request.files['image']
    if image_file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    temp_path = "temp_face.jpg"
    image_file.save(temp_path)
    
    if face_model:
        prediction = face_model.predict(temp_path)
        score = prediction.get("score", 50)
        dominant = prediction.get("dominant_emotion", "unknown")
    else:
        print("Fallback: face_model not initialized")
        score = random.randint(5, 99)
        dominant = "unknown"
        
    save_to_db('Face', score)
    return jsonify({
        "source": "face", 
        "stress_score": score, 
        "global_score": calculate_fusion_score(),
        "forecast": calculate_forecast(),
        "is_anomaly": check_anomaly(score),
        "smart_tip": generate_smart_tip(score, 'Face'),
        "dominant_emotion": dominant,
        "status": "success"
    })

@app.route('/analyze/text', methods=['POST'])
def analyze_text():
    # Receive JSON containing user text
    data = request.json or {}
    text_content = data.get('text', '')
    
    if not text_content:
        return jsonify({"error": "No text provided"}), 400

    # Day 2: AI prediction using NLP model
    if nlp_model:
        prediction = nlp_model.predict(text_content)
        score = prediction.get("score", 50)
        details = prediction.get("details", "")
    else:
        print("Fallback: nlp_model not initialized")
        score = random.randint(0, 100)
        details = "mock data"
        
    save_to_db('Text', score)
    return jsonify({
        "source": "text", 
        "stress_score": score, 
        "global_score": calculate_fusion_score(),
        "forecast": calculate_forecast(),
        "is_anomaly": check_anomaly(score),
        "smart_tip": generate_smart_tip(score, 'Text'),
        "status": "success",
        "details": details
    })

@app.route('/history', methods=['GET'])
def get_history():
    return jsonify({
        "status": "success", 
        "history": get_recent_history(),
        "current_fusion": calculate_fusion_score(),
        "forecast": calculate_forecast()
    })

if __name__ == '__main__':
    # Run the server locally on port 5000
    print("Starting API Backend... ML routes enabled")
    # Disabling debug/reloader for Windows stability with heavy ML models
    app.run(host='0.0.0.0', port=5000, debug=False)
# Initialized 
# DB Init 
# CRUD Logic 
