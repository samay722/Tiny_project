# 🧠 NeuroSense AI | Cybernetic Stress Intelligence

NeuroSense AI is a state-of-the-art mental health monitoring system and biometric operating system. It leverages **Computer Vision**, **Signal Processing**, and **Natural Language Processing** to detect, track, and actively mitigate cognitive stress in real-time.

---

## 🚀 Cybernetic Features
- **Multi-Modal Biometric Fusion**: Real-time correlation of Face, Voice, and NLP telemetry.
- **Ergonomic Posture AI**: Uses MediaPipe to track spinal alignment. If slouching is detected for extended periods, the system triggers a visual lockout.
- **💧 Bio-Sustenance Tracker**: An intelligent hydration bar that drains twice as fast if your cognitive stress score spikes.
- **🌊 Flow State Streaks**: Monitors your zen state and rewards consecutive minutes of uninterrupted deep focus.
- **🌙 Circadian Rhythm Sync (Zen Theme)**: Automatically transitions the UI from high-contrast cybernetic neon to a soothing, low-blue-light amber theme if high stress is detected after 6:00 PM.
- **📝 AI Cognitive Journal**: Allows you to type free-form thoughts. The NLP engine processes your entry, logs your emotional state, and delivers immediate psychological insights.
- **Persistent Intelligence**: Historical data tracking stored via SQLite with Write-Ahead Logging (WAL) for concurrency.
- **Neuro-Tasks**: A built-in task manager that visually syncs with your cognitive load.

## 🏗️ Technical Stack
- **Frontend**: HTML5, Vanilla JavaScript, CSS3 (Glassmorphism), Chart.js
- **Backend**: Python, Flask, Flask-CORS, SQLite3
- **AI Models**: 
  - **Face**: MediaPipe (Face Mesh/Pose) & DeepFace (Emotion Tracking)
  - **Voice**: Librosa & NumPy (Feature Analysis)
  - **Text**: HuggingFace Transformers (DistilRoBERTa Sentiment)

## 🛠️ Setup & Installation

### 1. Requirements
Ensure you have Python 3.10+ installed on your system.

### 2. Install Dependencies
Run the following command in your terminal:
```bash
pip install -r backend/requirements.txt
```

### 3. Initialize Models
On the first run, the backend will download the necessary NLP and Vision weights to local memory. Please allow 30-60 seconds for initialization.

## 🏃 Running the Application

### Option A: Running with Docker (Recommended)
If you have Docker installed, you can launch the entire ecosystem with a single command:
```bash
docker-compose up --build
```
*   **Frontend**: http://localhost:8000
*   **Backend**: http://localhost:5001

### Option B: Running Manually
This application requires two terminals running simultaneously.

### 1. Start the API Backend (Terminal 1)
```bash
python backend/app.py
```
*(Runs on `http://127.0.0.1:5001`)*

### 2. Start the Frontend Server (Terminal 2)
```bash
python serve.py
```
*(Runs on `http://127.0.0.1:8000`)*

Open your browser and navigate to: **http://localhost:8000**

---
*Developed with advanced autonomous intervention logic.*
