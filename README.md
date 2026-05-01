<div align="center">
  <img src="https://img.shields.io/badge/Status-Active-success.svg?style=for-the-badge" alt="Status">
  <img src="https://img.shields.io/badge/Python-3.10+-blue.svg?style=for-the-badge&logo=python" alt="Python">
  <img src="https://img.shields.io/badge/Docker-Supported-2496ED.svg?style=for-the-badge&logo=docker" alt="Docker">
  <img src="https://img.shields.io/badge/Deploy-Vercel+%2B+Render-blueviolet.svg?style=for-the-badge" alt="Deployment">

  <h1>🧠 NeuroSense AI</h1>
  <h3>Cybernetic Stress Intelligence & Biometric OS</h3>
  <p>A state-of-the-art mental health monitoring system that leverages Computer Vision, Signal Processing, and Natural Language Processing to actively mitigate cognitive stress in real-time.</p>
</div>

<br/>

## 🌟 The Cybernetic Experience

NeuroSense isn't just a dashboard—it's an active entity that reacts to your biological state:

| Feature | Description |
|:---:|---|
| 💧 **Bio-Sustenance** | An intelligent hydration bar that drains twice as fast if your cognitive stress spikes. |
| 🌊 **Flow State** | Monitors your "zen" state and rewards consecutive minutes of uninterrupted deep focus. |
| 🌙 **Circadian Sync** | Automatically transitions the UI to a soothing, low-blue-light amber theme if high stress is detected after 6 PM. |
| 🛑 **Slouch Lockout** | Uses MediaPipe spinal tracking. If you slouch too long, it blurs the screen until you sit up straight! |
| 📝 **AI Journal** | Type free-form thoughts; the NLP engine logs your emotional state and gives psychological feedback. |

<br/>

## 🏗️ System Architecture

```mermaid
graph TD
    subgraph Frontend [Vercel]
        UI[Glassmorphism Dashboard]
        Cam[Webcam/Audio Feed]
        Charts[Real-time Chart.js]
    end

    subgraph Backend [Render - Docker]
        Router[API Routes]
        Manager[Biometric Fusion Engine]
    end

    subgraph AI [Machine Learning]
        Vision[MediaPipe + DeepFace]
        Audio[Librosa Pitch/Jitter]
        NLP[HuggingFace DistilRoBERTa]
    end

    subgraph Database [Render Persistent Disk]
        DB[(SQLite WAL)]
    end

    UI <-->|HTTPS/REST| Router
    Cam --> Vision & Audio
    Router --> Manager
    Manager <--> AI
    Manager <--> DB
```

<br/>

## 🚀 How to Run Locally

### Option A: The One-Click Docker Method (Recommended)
Don't want to install Python packages? Just use Docker!
```bash
docker-compose up --build
```
🌐 Dashboard: `http://localhost:8000` | 🔌 API: `http://localhost:5001`

### Option B: The Manual Way
```bash
# 1. Install dependencies
pip install -r backend/requirements.txt

# 2. Start the API (Terminal 1)
python backend/app.py

# 3. Start the UI (Terminal 2)
python serve.py
```

<br/>

## ☁️ Deployment (Vercel + Render)

### 1. Backend (Render)
1. Create a new **Web Service** on Render.
2. Connect your repo and set the **Runtime** to `Docker`.
3. Add a **Persistent Disk** (2GB) at `/app/data` to keep your biometric history.
4. Set the **Instance Type** to at least `Starter` (2GB RAM) for ML models.

### 2. Frontend (Vercel)
1. Import your repo into Vercel.
2. Set the **Root Directory** to `frontend`.
3. Your `app.js` will automatically detect the production URL and connect to your Render backend.

---
<div align="center">
  <b>Built for developers who forget to sit up straight and drink water. 💙</b>
</div>


---
<div align="center">
  <b>Built for developers who forget to sit up straight and drink water. 💙</b>
</div>
