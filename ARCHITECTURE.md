# 🏗️ NeuroSense AI | System Architecture

This document outlines the technical design of the NeuroSense Multimodal Stress Detection ecosystem.

## 1. Data Intelligence Layer (ML Models)
The system employs a "Sensor Fusion" approach, combining three distinct deep-learning pipelines:

### 📸 Visual Pipeline (Affective Computing)
- **Engine**: DeepFace (VGG-Face) + OpenCV.
- **Innovation**: Employs **Russel's Circumplex Model**. Maps 7 raw emotions onto a 2D Valence-Arousal plane. 
- **Biosignals**: Implements **rPPG** (Remote Photoplethysmography) to estimate heart rate (BPM) via Green-channel intensity variance.

### 🎙️ Acoustic Pipeline (Signal Processing)
- **Engine**: Librosa.
- **Features**: Extracts MFCCs (Mel-Frequency Cepstral Coefficients) and analyzes Pitch Variance and Zero-Crossing Rates to detect vocal strain.

### ✍️ Linguistic Pipeline (NLP)
- **Engine**: TextBlob + Custom Stress Lexicon.
- **Logic**: Combines Sentiment Polarity with a weighted "Arousal Lexicon" to detect cognitive load in syntax.

## 2. Decision Support Layer (Backend)
- **Fusion Logic**: A weighted aggregation engine (Face 40%, Voice 40%, Text 20%).
- **Forecasting**: Simple Linear Regression on historical data points to predict stress trends ($y = mx + c$).
- **Anomaly Engine**: Z-Score analysis to identify acute stress spikes.

## 3. Interaction Layer (Frontend)
- **UI**: Glassmorphism with CSS Grid/Flexbox.
- **Intervention**: 
  - **AI Ambient Engine**: Dynamic audio feedback based on stress state.
  - **AI Wellness Coach**: Source-specific physical challenges (e.g., Jaw relaxation for visual stress).

## 4. Persistence Map
- **Storage**: SQLite 3.
- **Schema**: `logs (id, type, score, timestamp)`.

---
*Documented by the NeuroSense AI Team*
# Phase 6 Final 
