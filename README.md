<div align="center">
  <img src="https://img.shields.io/badge/Status-Active-success.svg?style=for-the-badge" alt="Status">
  <img src="https://img.shields.io/badge/Python-3.10+-blue.svg?style=for-the-badge&logo=python" alt="Python">
  <img src="https://img.shields.io/badge/Docker-Supported-2496ED.svg?style=for-the-badge&logo=docker" alt="Docker">
  <img src="https://img.shields.io/badge/Azure-Ready-0078D4.svg?style=for-the-badge&logo=microsoft-azure" alt="Azure">

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
    subgraph Frontend [Cybernetic UI]
        UI[Glassmorphism Dashboard]
        Cam[Webcam/Audio Feed]
        Charts[Real-time Chart.js]
    end

    subgraph API [Flask Backend]
        Router[API Routes]
        Manager[Biometric Fusion Engine]
    end

    subgraph AI [Machine Learning]
        Vision[MediaPipe + DeepFace]
        Audio[Librosa Pitch/Jitter]
        NLP[HuggingFace DistilRoBERTa]
    end

    subgraph Database
        DB[(SQLite WAL)]
    end

    UI <-->|HTTP/REST| Router
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

## ☁️ Deploy to the Cloud (Microsoft Azure)

NeuroSense is configured for a **Serverless multi-container deployment on Azure Container Apps**. 

1. Install the [Azure CLI](https://aka.ms/installazurecliwindows)
2. Run our automated deployment script:
```bash
bash deploy_azure.sh
```
*This script will automatically log you in, build the Docker images in the cloud, and deploy them to public URLs!*

---
<div align="center">
  <b>Built for developers who forget to sit up straight and drink water. 💙</b>
</div>
