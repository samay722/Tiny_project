import cv2
import numpy as np
import os
import sys
from unittest.mock import MagicMock
import google.protobuf

# Fix for TensorFlow 2.x requiring 'runtime_version' from google.protobuf (missing in 3.x)
if not hasattr(google.protobuf, 'runtime_version'):
    google.protobuf.runtime_version = MagicMock()

# Mock matplotlib and mediapipe.tasks to bypass system blocks
sys.modules['matplotlib'] = MagicMock()
sys.modules['matplotlib.pyplot'] = MagicMock()
sys.modules['mediapipe.tasks'] = MagicMock()
sys.modules['mediapipe.tasks.python'] = MagicMock()
sys.modules['mediapipe.tasks.python.vision'] = MagicMock()
sys.modules['mediapipe.tasks.python.vision.core'] = MagicMock()
sys.modules['mediapipe.tasks.python.vision.core.image'] = MagicMock()

import mediapipe as mp
try:
    from mediapipe.python.solutions import face_mesh as mp_face_mesh
    from mediapipe.python.solutions import pose as mp_pose
    from mediapipe.python.solutions import drawing_utils as mp_drawing
except ImportError:
    # Fallback for different mediapipe structures
    import mediapipe.solutions.face_mesh as mp_face_mesh
    import mediapipe.solutions.pose as mp_pose
    import mediapipe.solutions.drawing_utils as mp_drawing

try:
    from deepface import DeepFace
except ImportError:
    print("Please check if deepface is installed: pip install deepface opencv-python")

class FaceStressModel:
    def __init__(self):
        print("Loading Face Emotion (DeepFace) Model...")
        # Note: DeepFace downloads weights (~150MB) on the first run.
        
        print("Loading Posture Recognition (MediaPipe) Model...")
        self.mp_pose = mp_pose
        self.pose = self.mp_pose.Pose(static_image_mode=True, min_detection_confidence=0.5)
        self.baseline_neck = None
        self.posture_call_count = 0
        
        print("Loading FaceMesh (MediaPipe) for Fatigue & Gaze Tracking...")
        self.mp_face_mesh = mp_face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            static_image_mode=True, 
            max_num_faces=1, 
            min_detection_confidence=0.5,
            refine_landmarks=True # Necessary for Iris tracking
        )
        
    def predict(self, image_path):
        """
        Receives an image path, detects emotions & posture, and returns a stress score.
        """
        try:
            # --- 1. POSTURE DETECTION (MediaPipe) ---
            image = cv2.imread(image_path)
            posture_penalty = 0
            posture_status = "Good Posture"
            
            if image is not None:
                image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                pose_results = self.pose.process(image_rgb)
                
                if pose_results.pose_landmarks:
                    landmarks = pose_results.pose_landmarks.landmark
                    nose_y = landmarks[self.mp_pose.PoseLandmark.NOSE.value].y
                    left_shoulder_y = landmarks[self.mp_pose.PoseLandmark.LEFT_SHOULDER.value].y
                    right_shoulder_y = landmarks[self.mp_pose.PoseLandmark.RIGHT_SHOULDER.value].y
                    
                    avg_shoulder_y = (left_shoulder_y + right_shoulder_y) / 2
                    neck_extension = avg_shoulder_y - nose_y
                    
                    # Calibration on first 5 frames
                    if self.posture_call_count < 5:
                        if self.baseline_neck is None:
                            self.baseline_neck = neck_extension
                        else:
                            self.baseline_neck = (self.baseline_neck * self.posture_call_count + neck_extension) / (self.posture_call_count + 1)
                        self.posture_call_count += 1
                        posture_status = "Calibrating..."
                    else:
                        # Slump check
                        if self.baseline_neck > 0:
                            slump_ratio = (self.baseline_neck - neck_extension) / self.baseline_neck
                            if slump_ratio > 0.15: # 15% drop
                                posture_penalty = int(slump_ratio * 100) # Increases stress by up to 30 points
                                posture_status = "Slumping / Tension"

            # --- 2. EYE BLINK & GAZE TRACKING (MediaPipe FaceMesh) ---
            fatigue_penalty = 0
            eye_status = "Eyes Open"
            gaze_status = "Stable"
            ear = 0.3
            
            if image is not None:
                mesh_results = self.face_mesh.process(image_rgb)
                if mesh_results.multi_face_landmarks:
                    landmarks = mesh_results.multi_face_landmarks[0].landmark
                    
                    # Function to calculate Eye Aspect Ratio
                    def calc_ear(top, bottom, left, right):
                        v_dist = np.linalg.norm(np.array([top.x, top.y]) - np.array([bottom.x, bottom.y]))
                        h_dist = np.linalg.norm(np.array([left.x, left.y]) - np.array([right.x, right.y]))
                        return v_dist / h_dist if h_dist > 0 else 0
                    
                    # Left eye
                    left_ear = calc_ear(landmarks[159], landmarks[145], landmarks[33], landmarks[133])
                    # Right eye
                    right_ear = calc_ear(landmarks[386], landmarks[374], landmarks[362], landmarks[263])
                    
                    ear = (left_ear + right_ear) / 2.0
                    
                    if ear < 0.15:
                        eye_status = "Blinking / Squinting"
                        fatigue_penalty = 15
                    elif ear < 0.20:
                        eye_status = "Screen Fatigue (Drooping)"
                        fatigue_penalty = 8

                    # --- GAZE STABILITY ---
                    # Use Iris landmarks (468: Left center, 473: Right center)
                    # Use Eye corners (33, 133 for Left; 362, 263 for Right)
                    def get_gaze_ratio(eye_points, iris_point, landmarks):
                        left_corner = landmarks[eye_points[0]]
                        right_corner = landmarks[eye_points[1]]
                        iris = landmarks[iris_point]
                        
                        # Calculate relative horizontal position of iris (0.0 to 1.0)
                        # 0.5 is center, <0.4 is looking one way, >0.6 is looking the other
                        eye_width = abs(right_corner.x - left_corner.x)
                        if eye_width > 0:
                            ratio = (iris.x - left_corner.x) / eye_width
                            return ratio
                        return 0.5

                    l_gaze = get_gaze_ratio([33, 133], 468, landmarks)
                    r_gaze = get_gaze_ratio([362, 263], 473, landmarks)
                    avg_gaze = (l_gaze + r_gaze) / 2.0

                    if avg_gaze < 0.35: gaze_status = "Looking Right"
                    elif avg_gaze > 0.65: gaze_status = "Looking Left"
                    else: gaze_status = "Centered"


            # --- 3. FACIAL COMPONENT (DeepFace) ---
            result = DeepFace.analyze(img_path=image_path, actions=['emotion'], enforce_detection=False)
            if isinstance(result, list):
                result = result[0]
                
            emotions = result['emotion']
            dominant = result['dominant_emotion']
            
            # --- AI/ML UPGRADE: Valence-Arousal Mapping ---
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
            
            # Stress Formula
            raw_stress = (weighted_a - weighted_v)
            base_score = int(((raw_stress + 1) / 3) * 100)
            
            # Add the Posture penalty and Fatigue penalty to the Final Stress Score
            final_stress_score = max(0, min(100, base_score + posture_penalty + fatigue_penalty))

            # Simulate BPM
            bpm = int(70 + (weighted_a * 40)) 
            if posture_penalty > 10:
                bpm += 5 # Increase heart rate slightly if slumping
            
            return {
                "score": final_stress_score,
                "dominant_emotion": f"{dominant} ({posture_status})",
                "heart_rate": bpm,
                "details": {
                    "valence": round(float(weighted_v), 2), 
                    "arousal": round(float(weighted_a), 2),
                    "posture_status": posture_status,
                    "eye_status": eye_status,
                    "gaze_stability": gaze_status,
                    "ear_value": round(float(ear), 3)
                }
            }
            
        except Exception as e:
            import traceback
            print(f"Prediction Error: {e}")
            return {
                "score": 45, 
                "dominant_emotion": "neutral (undetected)", 
                "heart_rate": 72,
                "error": str(e)
            }

if __name__ == "__main__":
    model = FaceStressModel()
    print("Model initialized successfully.")


