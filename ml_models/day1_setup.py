"""
YOUR DAY 1 ML ENGINEER TASKS:

1. Setup environment locally (use backend/requirements.txt tomorrow)
2. Download RAVDESS Dataset. Run the `download_ravdess()` below 
   or manually get it from Kaggle.
3. Start building the actual ML architecture internally here.

TOMORROW (Day 2):
The backend engineer will import from `models.py` into `backend/app.py`
and replace the random scores with actual `.predict()` calls!
"""

import os
import urllib.request
import zipfile

def download_ravdess():
    """ Helper script to automate RAVDESS download for ML engineer """
    print("🚀 Preparing ML Environment...")
    dataset_dir = "data/RAVDESS"
    os.makedirs(dataset_dir, exist_ok=True)
    
    print("Note: RAVDESS is large. For Day 1 MVP, we recommend downloading the sub-sample or using Kaggle API directly:")
    print("Run: kaggle datasets download -d uwrfkaggler/ravdess-emotional-speech-audio")

class VoiceModel:
    def __init__(self):
        # Day 2: Load librosa / LSTM / SVM model weights here
        pass
        
    def predict(self, audio_file_path):
        # Extract MFCC using librosa -> Inference -> Return 0-100 score
        pass

class FaceModel:
    def __init__(self):
        # Day 2: Load DeepFace model or custom CNN
        pass
        
    def predict(self, image_array):
        # Detect emotion -> map to 0-100 stress
        pass

class NLPModel:
    def __init__(self):
        # Day 2: Load distilbert HuggingFace model
        pass
        
    def predict(self, text):
        # Sentiment analysis -> calculate stress probability
        pass
