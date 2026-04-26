import cv2
import mediapipe as mp
import numpy as np
import time

def main():
    # Initialize MediaPipe Pose class
    mp_pose = mp.solutions.pose
    pose = mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5)
    mp_drawing = mp.solutions.drawing_utils
    
    # Open Webcam
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("Error: Could not open webcam.")
        return

    print("Press 'q' to quit.")
    
    # Variables for baseline
    baseline_y_dist = None
    calibration_frames = 30
    frame_count = 0
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
            
        # Optional: Flip image horizontally for a selfie-view display
        frame = cv2.flip(frame, 1)
        
        # Convert BGR to RGB for MediaPipe
        image_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Process the image and find pose landmarks
        results = pose.process(image_rgb)
        
        # Draw the pose annotations on the frame
        if results.pose_landmarks:
            # Draw the skeleton
            mp_drawing.draw_landmarks(
                frame, 
                results.pose_landmarks, 
                mp_pose.POSE_CONNECTIONS,
                mp_drawing.DrawingSpec(color=(245,117,66), thickness=2, circle_radius=2),
                mp_drawing.DrawingSpec(color=(245,66,230), thickness=2, circle_radius=2)
            )
            
            # Extract specific landmarks (e.g., Nose, Left Shoulder, Right Shoulder)
            landmarks = results.pose_landmarks.landmark
            nose_y = landmarks[mp_pose.PoseLandmark.NOSE.value].y
            
            left_shoulder_y = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER.value].y
            right_shoulder_y = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].y
            
            # Average shoulder Y position
            avg_shoulder_y = (left_shoulder_y + right_shoulder_y) / 2
            
            # Calculate distance between nose and shoulders (as a ratio of the frame)
            # When people slouch, their head drops closer to their shoulders.
            neck_extension_ratio = avg_shoulder_y - nose_y
            
            # Basic Calibration (first 30 frames)
            if frame_count < calibration_frames:
                if baseline_y_dist is None:
                    baseline_y_dist = neck_extension_ratio
                else:
                    # Smoothly average the baseline
                    baseline_y_dist = (baseline_y_dist * frame_count + neck_extension_ratio) / (frame_count + 1)
                
                cv2.putText(frame, "CALIBRATING... Sit up straight!", (50, 50), 
                            cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 255), 2)
            else:
                # Calculate Slump/Fatigue Level
                # If neck_extension_ratio is significantly lower than baseline, user is slouching
                if baseline_y_dist > 0:
                    slump_factor = (baseline_y_dist - neck_extension_ratio) / baseline_y_dist
                else:
                    slump_factor = 0
                
                # Determine state
                if slump_factor > 0.15: # 15% drop from baseline
                    status = "POSTURE: SLUMPING (High Fatigue/Stress)"
                    color = (0, 0, 255) # Red
                    stress_score = min(100, int(slump_factor * 200)) # Fake score mapping
                else:
                    status = "POSTURE: UPRIGHT (Focused)"
                    color = (0, 255, 0) # Green
                    stress_score = 0
                
                # Display HUD
                cv2.rectangle(frame, (0, 0), (600, 100), (0,0,0), -1)
                cv2.putText(frame, status, (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
                cv2.putText(frame, f"Physical Stress Score: +{stress_score}", (20, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

        frame_count += 1
        
        # Display the resulting frame
        cv2.imshow('NeuroSense AI - Posture & Fatigue Tracking', frame)
        
        # Break the loop on 'q' key press
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == '__main__':
    main()
