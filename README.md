# 🧠 NeuroSense AI | Multimodal Stress Detector

NeuroSense AI is a state-of-the-art mental health monitoring system that leverages **Computer Vision**, **Signal Processing**, and **Natural Language Processing** to detect and track cognitive stress in real-time.

## 🚀 Key Features
- **Triple Fusion Scoring**: Combines Face (40%), Voice (40%), and Text (20%) data into a single Master stress Index.
- **Visual Analytics**: Real-time emotion scanning using DeepFace.
- **Acoustic Profiling**: Advanced MFCC extraction via Librosa to detect vocal resonance stress.
- **Sentiment Analysis**: Text-based cognitive syntax analysis using TextBlob.
- **Persistent Intelligence**: Historical data storage using SQLite for long-term tracking.
- **Premium UI/UX**: Glassmorphism design with dynamic high-stress background alerts.

## 🏗️ Technical Stack
- **Frontend**: HTML5, Vanilla JavaScript, CSS3 (Glassmorphism), Chart.js
- **Backend**: Python, Flask, Flask-CORS, SQLite
- **AI Models**: 
  - **Face**: DeepFace (VGG-Face)
  - **Voice**: Librosa & NumPy (Feature Analysis)
  - **Text**: TextBlob (Sentiment & Subjectivity)

## 🛠️ Setup & Installation

### 1. Requirements
Ensure you have Python 3.10+ installed.

### 2. Install Dependencies
Run the following command in your terminal:
```bash
pip install flask flask-cors opencv-python deepface tensorflow tf-keras librosa soundfile textblob
```

### 3. Initialize Models
On the first run, the system will download the necessary ML weights (~150MB).

## 🏃 Running the Application

### 1. Start the API (Terminal 1)
```bash
cd backend
python app.py
```

### 2. Start the Frontend (Terminal 2)
Since camera access is restricted on `file://` protocols, use a local server:
```bash
cd frontend
python -m http.server 8080
```
Then navigate to: **http://localhost:8080**

## 📊 Roadmap Completion
- [x] **Day 1**: Individual Model Integration & API Routes
- [x] **Day 2**: SQLite Persistence, Weighted Fusion, and Advanced Results UI
- [x] **Day 3**: UI Polish, Global History Polling, and Report Export

## 📝 Usage Guide
1. **Calibrate**: Perform a face scan in normal lighting.
2. **Vocal Test**: Record a 5-second voice clip describing your day.
3. **Sentiment Log**: Type a quick summary of your current feelings.
4. **Monitor**: Watch the Master Fusion Index update. If it turns RED, the system will recommend a break!

---
*Created with ❤️ by the NeuroSense AI Team*
