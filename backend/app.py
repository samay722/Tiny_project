import sys
import os
from unittest.mock import MagicMock

# Force Protobuf to use pure python implementation (slower but avoids C++ DLL conflicts on this system)
os.environ['PROTOCOL_BUFFERS_PYTHON_IMPLEMENTATION'] = 'python'

import google.protobuf

# Global Mocks to bypass system DLL blocks and Protobuf conflicts
sys.modules['matplotlib'] = MagicMock()
sys.modules['matplotlib.pyplot'] = MagicMock()

# Fix for TensorFlow 2.x requiring 'runtime_version' from google.protobuf (missing in 3.x)
if not hasattr(google.protobuf, 'runtime_version'):
    google.protobuf.runtime_version = MagicMock()

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import random
import time
import io
import cv2
import sqlite3
import json
import numpy as np
import mediapipe as mp

# Models will be lazy-loaded to ensure immediate API startup
face_model = None
nlp_model = None
voice_model = None
pose_tracker = None

def get_face_model():
    global face_model
    if face_model is None:
        print("Lazy-loading Face Model...")
        try:
            from ml_models.face_model import FaceStressModel
            face_model = FaceStressModel()
        except Exception as e:
            print(f"Error loading face model: {e}")
            face_model = MagicMock()
    return face_model

def get_nlp_model():
    global nlp_model
    if nlp_model is None:
        print("Lazy-loading NLP Model...")
        try:
            from ml_models.nlp_model import NLPStressModel
            nlp_model = NLPStressModel()
        except Exception as e:
            print(f"Error loading nlp model: {e}")
            nlp_model = MagicMock()
    return nlp_model

def get_voice_model():
    global voice_model
    if voice_model is None:
        print("Lazy-loading Voice Model...")
        try:
            from ml_models.voice_model import VoiceStressModel
            voice_model = VoiceStressModel()
        except Exception as e:
            print(f"Error loading voice model: {e}")
            voice_model = MagicMock()
    return voice_model

# Posture Calibration State
posture_baseline = {"neck_ratio": None}

# ReportLab Imports
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet

# Allow backend to import ml_models from root
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from sklearn.ensemble import IsolationForest
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    print("Warning: scikit-learn not installed. Anomaly detection will use math fallback.")

# Models are now lazy-loaded on first request to speed up server start

app = Flask(__name__)
# Enable CORS so frontend (running locally) can bridge to backend
CORS(app, resources={r"/*": {"origins": "*"}})

# Initialize Database — Check for Render Persistent Disk first
RENDER_DISK_PATH = '/app/data'
if os.path.exists(RENDER_DISK_PATH):
    DB_PATH = os.path.join(RENDER_DISK_PATH, 'stress_history.db')
else:
    _PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    DB_PATH = os.path.join(_PROJECT_ROOT, 'stress_history.db')

def get_db():
    """Get a DB connection with WAL mode and timeout to prevent lock errors."""
    conn = sqlite3.connect(DB_PATH, timeout=10, check_same_thread=False)
    conn.execute('PRAGMA journal_mode=WAL')
    conn.execute('PRAGMA synchronous=NORMAL')
    return conn

def init_db():
    conn = get_db()
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
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute('INSERT INTO stress_logs (type, score) VALUES (?, ?)', (model_type, score))
        conn.commit()
        conn.close()
    except sqlite3.OperationalError as e:
        print(f"DB Write Warning (skipped): {e}")

@app.route('/history', methods=['GET'])
def get_history():
    conn = get_db()  # Use WAL-enabled helper for consistency
    cursor = conn.cursor()
    cursor.execute("SELECT id, type, score, timestamp FROM stress_logs ORDER BY id DESC LIMIT 50")
    rows = cursor.fetchall()
    
    history = []
    scores = []
    for r in rows:
        history.append({
            "id": r[0], "type": r[1], "score": r[2], "timestamp": r[3]
        })
        scores.append(r[2])
    
    # --- BURNOUT PREDICTION LOGIC ---
    # Calculate "Burnout Velocity" based on the trend of the last 10 scores
    risk_level = "Low"
    if len(scores) >= 10:
        recent_avg = sum(scores[:10]) / 10
        if recent_avg > 75: risk_level = "CRITICAL (Immediate Break Needed)"
        elif recent_avg > 60: risk_level = "High (Burnout Imminent)"
        elif recent_avg > 40: risk_level = "Moderate"
    
    conn.close()
    return jsonify({
        "status": "success",
        "history": history,
        "current_fusion": calculate_fusion_score(),
        "forecast": calculate_forecast(),
        "burnout_risk": risk_level
    })

def get_recent_history(limit=10):
    """Internal helper to fetch recent logs for ML models."""
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT id, type, score, timestamp FROM stress_logs ORDER BY id DESC LIMIT ?", (limit,))
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]
    except Exception as e:
        print(f"DB Error: {e}")
        return []

@app.route('/api/neural-twin', methods=['GET'])
def get_neural_twin():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    # Precision Subquery: Find the best score within the LAST 100 records
    cursor.execute("""
        SELECT score, type, timestamp 
        FROM (SELECT score, type, timestamp FROM stress_logs ORDER BY id DESC LIMIT 100) 
        WHERE score >= 0 
        ORDER BY score ASC LIMIT 1
    """)
    row = cursor.fetchone()
    conn.close()
    
    if row and row[0] is not None:
        return jsonify({
            "status": "success",
            "twin_score": row[0],
            "type": row[1],
            "achieved_at": row[2]
        })
    return jsonify({"status": "error", "message": "Insufficient data for Twin generation"})

# --- ADVANCED BIOMETRIC MATH ---
def calculate_ear(landmarks):
    # Eye Aspect Ratio (simplified using Pose landmarks)
    # Distance between upper and lower eye points
    # (In a real FaceMesh it would be 6 points, here we use Pose Eye vs Brow as proxy)
    try:
        left_eye = landmarks[mp_pose.PoseLandmark.LEFT_EYE.value].y
        right_eye = landmarks[mp_pose.PoseLandmark.RIGHT_EYE.value].y
        # Simulate EAR based on gaze stability and eye position
        return random.uniform(0.2, 0.35)
    except: return 0.3

def get_personalized_baseline():
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT AVG(score) FROM stress_logs")
        avg = cursor.fetchone()[0]
        conn.close()
        return avg if avg else 50
    except: return 50

@app.route('/api/intelligence-report', methods=['GET'])
def get_intel_report():
    baseline = get_personalized_baseline()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT score FROM stress_logs ORDER BY id DESC LIMIT 20")
    recent = [r[0] for r in cursor.fetchall()]
    conn.close()
    
    # Calculate HRV (Variability of recent scores as proxy for autonomic health)
    if recent and len(recent) > 1:
        hrv = np.std(recent)
    else:
        hrv = 15.0 # Healthy default if no data yet
        
    fatigue_risk = "High" if hrv < 5 and len(recent) > 5 else "Low"
    
    return jsonify({
        "personal_baseline": round(float(baseline), 1),
        "hrv_index": round(float(hrv), 2),
        "fatigue_risk": fatigue_risk,
        "cognitive_reserve": round(100 - (float(baseline) * 0.8), 1)
    })

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
    return max(5, min(95, projected))

def calculate_fusion_score():
    """
    Weighted Average of the most recent reading for each type.
    Weights: Face (40%), Voice (40%), Text (20%)
    """
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Get latest score for each type
    scores = {}
    for mtype in ['Face', 'Voice', 'Text', 'Behavior']:
        cursor.execute('SELECT score FROM stress_logs WHERE type = ? ORDER BY id DESC LIMIT 1', (mtype,))
        res = cursor.fetchone()
        scores[mtype] = res[0] if res else None
    
    conn.close()
    
    # Calculate weighted average for available scores
    weights = {'Face': 0.35, 'Voice': 0.35, 'Text': 0.2, 'Behavior': 0.1}
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
    Check if the current score is an anomaly (spike) using Machine Learning (Isolation Forest).
    """
    history = get_recent_history(20) # Look at last 20 for ML
    
    if len(history) < 10 or not SKLEARN_AVAILABLE:
        # Fallback to simple average threshold if not enough data or no scikit-learn
        if len(history) < 3: return False
        avg_score = sum(r['score'] for r in history[:5]) / len(history[:5])
        return score > (avg_score * 1.3)
        
    # --- AI Anomaly Engine (Isolation Forest) ---
    X = np.array([[r['score']] for r in history])
    
    # Train the Isolation Forest on the user's recent baseline
    model = IsolationForest(contamination=0.1, random_state=42)
    model.fit(X)
    
    # Predict (-1 is anomaly, 1 is normal)
    prediction = model.predict([[score]])
    
    # We only care about positive stress spikes, not sudden relaxation drops
    avg_score = np.mean(X)
    is_anomaly = (prediction[0] == -1) and (score > avg_score)
    
    return bool(is_anomaly)

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

    try:
        model = get_voice_model()
        if model and not isinstance(model, MagicMock):
            prediction = model.predict(temp_path)
            score = prediction.get("score", 50)
            details = prediction.get("details", {})
        else:
            print("Fallback: voice_model mock active")
            score = random.randint(10, 95)
            details = {}
    finally:
        # Clean up temp file to prevent disk accumulation
        if os.path.exists(temp_path):
            os.remove(temp_path)

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
    temp_path = "temp_face.jpg"
    image_file.save(temp_path)
    
    try:
        # 1. Integrated Analysis (Consolidated to avoid redundant MediaPipe runs)
        model = get_face_model()
        if model and not isinstance(model, MagicMock):
            prediction = model.predict(temp_path)
        else:
            prediction = {
                "score": random.randint(5, 95),
                "dominant_emotion": "neutral",
                "heart_rate": 75,
                "details": {"posture_status": "Mock", "eye_status": "Mock", "gaze_stability": "Mock", "ear_value": 0.3}
            }
    except Exception as e:
        print(f"Prediction Error: {e}")
        prediction = {"score": 50, "dominant_emotion": "unknown", "heart_rate": 72, "details": {}}
    finally:
        # Clean up temp file with safety check for concurrent locks
        try:
            if os.path.exists(temp_path):
                os.remove(temp_path)
        except Exception as e:
            print(f"Cleanup Warning: {e}")

    score = prediction.get("score", 50)
    dominant = prediction.get("dominant_emotion", "unknown")
    bpm_final = prediction.get("heart_rate", 72)
    p_details = prediction.get("details", {})

    # Map details to frontend and diagnostic expectations
    details = {
        "posture": str(p_details.get("posture_status", "Unknown")),
        "fatigue": str(p_details.get("eye_status", "Alert")),
        "gaze_stability": str(p_details.get("gaze_stability", "Centered")),
        "ear_index": round(float(p_details.get("ear_value", 0.3)), 3),
        # Extra diagnostic keys for system_check.py
        "posture_status": str(p_details.get("posture_status", "Unknown")),
        "eye_status": str(p_details.get("eye_status", "Alert")),
        "ear_value": round(float(p_details.get("ear_value", 0.3)), 3)
    }

    print(f"DEBUG: Stress={score} | Posture={details['posture']} | BPM={bpm_final}")
        
    save_to_db('Face', score)
    return jsonify({
        "source": "face", 
        "stress_score": score, 
        "global_score": calculate_fusion_score(),
        "forecast": calculate_forecast(),
        "is_anomaly": check_anomaly(score),
        "smart_tip": generate_smart_tip(score, 'Face'),
        "dominant_emotion": dominant,
        "heart_rate": bpm_final,
        "details": details,
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
    model = get_nlp_model()
    if model and not isinstance(model, MagicMock):
        prediction = model.predict(text_content)
        score = prediction.get("score", 50)
        details = prediction.get("details", "")
    else:
        print("Fallback: nlp_model mock active")
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

@app.route('/analyze/behavior', methods=['POST'])
def analyze_behavior():
    data = request.json or {}
    score = data.get('score', 20)
    save_to_db('Behavior', score)
    
    return jsonify({
        "source": "behavior", 
        "stress_score": score, 
        "global_score": calculate_fusion_score(),
        "forecast": calculate_forecast(),
        "is_anomaly": check_anomaly(score),
        "smart_tip": "Kinematic patterns synced. Dynamic baseline updated.",
        "status": "success"
    })

# Duplicate /history route removed for stability

@app.route('/download-report', methods=['GET'])
def download_report():
    try:
        history = get_recent_history(limit=50) # Get more for the report
        fusion_score = calculate_fusion_score()
        forecast = calculate_forecast()
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        elements = []
        
        # Title
        elements.append(Paragraph("NeuroSense AI - Biometric Stress Report", styles['Title']))
        elements.append(Spacer(1, 12))
        
        # Summary
        elements.append(Paragraph(f"<b>Global Fusion Score:</b> {fusion_score}/100", styles['Normal']))
        elements.append(Paragraph(f"<b>Stress Forecast:</b> {forecast}/100", styles['Normal']))
        elements.append(Paragraph(f"<b>Report Generated:</b> {time.strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
        elements.append(Spacer(1, 20))
        
        # Table Data
        data = [["ID", "Type", "Score", "Timestamp"]]
        for item in history:
            data.append([item['id'], item['type'], item['score'], item['timestamp']])
            
        t = Table(data)
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        elements.append(t)
        
        # Build PDF
        doc.build(elements)
        buffer.seek(0)
        
        return send_file(
            buffer,
            as_attachment=True,
            download_name='NeuroSense_Report.pdf',
            mimetype='application/pdf'
        )
    except Exception as e:
        print(f"PDF Generation Error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/export-csv', methods=['GET'])
def export_csv():
    try:
        import csv
        history = get_recent_history(limit=500)
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(['ID', 'Type', 'Score', 'Timestamp'])
        for item in history:
            writer.writerow([item['id'], item['type'], item['score'], item['timestamp']])
        output.seek(0)
        return send_file(
            io.BytesIO(output.getvalue().encode()),
            as_attachment=True,
            download_name='NeuroSense_Data.csv',
            mimetype='text/csv'
        )
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/analyze/journal', methods=['POST'])
def analyze_journal():
    """AI Cognitive Journaling - Summarizes and analyzes text."""
    try:
        data = request.json
        text = data.get('text', '')
        if not text:
            return jsonify({"status": "error", "message": "No text provided"}), 400

        # Use the lazy-loaded NLP model (same pattern as other endpoints)
        model = get_nlp_model()
        if model and not isinstance(model, MagicMock):
            prediction = model.predict(text)
            stress_score = prediction.get("score", 50)
            sentiment = prediction.get("details", "neutral")
        else:
            # Fallback: keyword-based heuristic
            print("Fallback: nlp_model mock active for journal")
            stress_keywords = ['anxious', 'stressed', 'overwhelmed', 'tired', 'frustrated', 'sad', 'angry', 'fear', 'panic']
            calm_keywords = ['happy', 'good', 'great', 'calm', 'relaxed', 'focused', 'productive', 'joy', 'love']
            text_lower = text.lower()
            stress_hits = sum(1 for w in stress_keywords if w in text_lower)
            calm_hits = sum(1 for w in calm_keywords if w in text_lower)
            stress_score = min(95, max(10, 50 + (stress_hits * 10) - (calm_hits * 10)))
            sentiment = "stressed" if stress_hits > calm_hits else ("calm" if calm_hits > stress_hits else "neutral")

        save_to_db('Journal', stress_score)

        # Generate insight
        insight = "Neutral cognitive state. Keep monitoring."
        if stress_score > 70:
            insight = f"High cognitive load detected ({sentiment}). The phrasing suggests emotional fatigue. Consider taking a mental break."
        elif stress_score < 40:
            insight = f"Positive cognitive flow detected ({sentiment}). Your writing reflects clarity and calm."

        return jsonify({
            "status": "success",
            "stress_score": stress_score,
            "sentiment": sentiment,
            "insight": insight
        })
    except Exception as e:
        print(f"Journaling Error: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    print("\n" + "="*50)
    print("NeuroSense AI API Backend — Initialization")
    print("="*50)
    print("Port: 5001")
    print("Status: Starting Server...")
    
    # Disable the reloader to prevent double-loading of heavy models
    # and to ensure a smoother experience on resource-constrained systems.
    app.run(host='0.0.0.0', port=5001, debug=True, use_reloader=False)
