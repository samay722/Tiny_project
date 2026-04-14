import cv2
import numpy as np
import os
try:
    from deepface import DeepFace
except ImportError:
    print("Please check if deepface is installed: pip install deepface opencv-python")

class FaceStressModel:
    def __init__(self):
        print("Loading Face Emotion (DeepFace) Model...")
        # Note: DeepFace downloads weights (~150MB) on the first run.
        
    def predict(self, image_path):
        """
        Receives an image path, detects emotions, and returns a stress score.
        """
        try:
            # Analyze emotion using DeepFace
            # enforce_detection=False allows passing images even if no face is detected perfectly
            result = DeepFace.analyze(img_path=image_path, actions=['emotion'], enforce_detection=False)
            
            # DeepFace returns a list if it finds multiple faces. We take the first one.
            if isinstance(result, list):
                result = result[0]
                
            emotions = result['emotion']
            dominant = result['dominant_emotion']
            
            # ---------------------------------------------
            # Enforce detection to find a face
            results = DeepFace.analyze(
                img_path=frame_path, 
                actions=['emotion'],
                enforce_detection=True,
                detector_backend='opencv'
            )
            
            # DeepFace returns a list of results
            emotions = results[0]['emotion']
            dominant = results[0]['dominant_emotion']
            
            # --- AI/ML UPGRADE: Valence-Arousal Mapping ---
            # Weights based on Russel's Circumplex Model (Stress = High Arousal, Low Valence)
            # Emotion | Valence (-1 to 1) | Arousal (0 to 1)
            mapping = {
                'angry':    {'v': -0.7, 'a': 0.9},
                'disgust':  {'v': -0.8, 'a': 0.6},
                'fear':     {'v': -0.8, 'a': 0.9},
                'happy':    {'v': 0.8,  'a': 0.4},
                'sad':      {'v': -0.9, 'a': 0.1},
                'surprise': {'v': 0.2,  'a': 0.8},
                'neutral':  {'v': 0.1,  'a': 0.1}
            }
            
            weighted_v = 0
            weighted_a = 0
            for emo, prob in emotions.items():
                p = prob / 100.0
                weighted_v += p * mapping[emo]['v']
                weighted_a += p * mapping[emo]['a']
            
            # Stress Formula: (Arousal - Valence) normalized to 0-100
            # Max possible (1.0 - (-1.0)) = 2.0
            # Min possible (0.0 - 1.0) = -1.0
            raw_stress = (weighted_a - weighted_v)
            stress_score = int(((raw_stress + 1) / 3) * 100)
            stress_score = max(0, min(100, stress_score))

            return {
                "score": stress_score,
                "dominant_emotion": dominant,
                "details": {"valence": round(weighted_v, 2), "arousal": round(weighted_a, 2)}
            }
            
        except Exception as e:
            print(f"DeepFace Prediction Error: {e}")
            return {"score": 50, "dominant_emotion": "error", "error": str(e)}

if __name__ == "__main__":
    # Test block
    model = FaceStressModel()
    print("Model initialized successfully.")
