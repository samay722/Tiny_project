# 🏗️ NeuroSense AI | Cybernetic System Architecture

This document outlines the technical design, data flow, and advanced intervention logic of the NeuroSense Cybernetic Stress Intelligence ecosystem.

## 1. Data Intelligence Layer (ML Models)
The system employs a "Sensor Fusion" approach, combining distinct deep-learning and signal processing pipelines:

### 📸 Visual & Kinematic Pipeline (Affective Computing)
- **Engine**: MediaPipe (Face Mesh/Pose) + DeepFace (VGG-Face).
- **Facial Action Coding**: Tracks micro-expressions and maps them to cognitive stress.
- **Biometric Telemetry**: 
  - **EAR (Eye Aspect Ratio)**: Calculates eye closure over time to detect drowsiness.
  - **Gaze Tracking**: Estimates focus drift.
  - **Spinal Alignment**: Uses holistic pose nodes to identify ergonomic slouching and postural decay.

### 🎙️ Acoustic Pipeline (Signal Processing)
- **Engine**: Librosa.
- **Features**: Extracts MFCCs (Mel-Frequency Cepstral Coefficients), Pitch Variance, and Zero-Crossing Rates to detect vocal strain and micro-tremors associated with anxiety.

### ✍️ Linguistic Pipeline (NLP)
- **Engine**: HuggingFace Transformers (`DistilRoBERTa-base`).
- **Logic**: Deep neural semantic analysis to detect cognitive load, frustration, and emotional bandwidth from raw text (AI Cognitive Journaling).

## 2. Decision Support Layer (Backend)
- **Fusion Logic**: A weighted aggregation engine ensuring that no single modality triggers a false positive.
- **Concurrency Control**: Implements SQLite Write-Ahead Logging (WAL) to handle highly concurrent asynchronous read/writes from the frontend polling systems and heavy ML background tasks.
- **Forecasting**: Analyzes historical DB points to generate predictive stress telemetry.

## 3. Autonomous Intervention Layer (Frontend)
NeuroSense moves beyond passive tracking into active biological intervention.
- **💧 Bio-Sustenance Engine**: Hydration tracking that dynamically alters its drain rate based on the real-time cognitive stress multiplier.
- **🌊 Flow State Metrics**: Algorithms that detect and reward uninterrupted spans of low-stress, high-focus work (Flow State).
- **🌙 Circadian Syncing**: Real-time CSS theme injection. Transitions the UI to a low-blue-light "Zen Theme" if high stress is detected post-6:00 PM.
- **🛑 Ergonomic Lockout**: If the kinematic pipeline detects "Slouching" for >15 seconds, the UI executes a hard visual blur and CSS pointer-event lockout until posture is restored.

## 4. Persistence & API Map
- **Storage**: SQLite3 (`logs` table: `id, type, score, timestamp`).
- **REST API (`port 5001`)**:
  - `POST /analyze/face`
  - `POST /analyze/voice`
  - `POST /analyze/text`
  - `POST /analyze/journal`
  - `GET /history` & `/download-report`

---
*Documented by the NeuroSense AI Systems Architecture Team*
