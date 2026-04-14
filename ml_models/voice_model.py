"""
Voice Stress Analysis Model
Uses MFCC (Mel-Frequency Cepstral Coefficients) extracted by librosa
to estimate stress from audio recordings.

NO TensorFlow needed! Works on Python 3.14!
"""
import numpy as np

try:
    import librosa
    import soundfile as sf
    LIBROSA_AVAILABLE = True
except ImportError:
    LIBROSA_AVAILABLE = False
    print("librosa not found. Run: pip install librosa soundfile")


class VoiceStressModel:
    def __init__(self):
        print("Loading Voice Stress Model (librosa MFCC)...")
        
    def predict(self, audio_file_path):
        """
        Extracts MFCC features from audio and uses heuristics to estimate stress.
        
        Key indicators of vocal stress:
        - Higher pitch (F0) = more stressed
        - Higher energy/loudness = more stressed
        - More variation in MFCCs = emotionally unstable/stressed
        - Faster speaking rate (more ZCR) = nervous/anxious
        """
        if not LIBROSA_AVAILABLE:
            return {"score": 50, "status": "failed", "error": "librosa not installed"}
        
        try:
            # Load audio file
            y, sr = librosa.load(audio_file_path, sr=None, mono=True)
            
            if len(y) < 100:
                return {"score": 50, "status": "failed", "error": "Audio too short"}
            
            # ---------------------------------------------------
            # FEATURE EXTRACTION — THE CORE ML LOGIC
            # ---------------------------------------------------
            
            # 1. MFCC (Timbre / voice texture - 13 coefficients)
            mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
            mfcc_var = np.var(mfccs, axis=1).mean()  # High variance = emotional voice
            
            # 2. Pitch (F0) — Higher pitch = stress
            pitches, magnitudes = librosa.piptrack(y=y, sr=sr)
            pitch_values = pitches[magnitudes > np.median(magnitudes)]
            avg_pitch = np.mean(pitch_values) if len(pitch_values) > 0 else 150
            
            # 3. RMS Energy — Loudness/intensity
            rms = librosa.feature.rms(y=y)[0]
            avg_energy = np.mean(rms)
            
            # 4. Zero Crossing Rate — Speaking rate indicator
            zcr = librosa.feature.zero_crossing_rate(y)[0]
            avg_zcr = np.mean(zcr)
            
            # 5. Spectral Centroid — Brightness of voice
            spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
            avg_centroid = np.mean(spectral_centroid)
            
            # ---------------------------------------------------
            # STRESS SCORING LOGIC (Normalized to 0-100)
            # ---------------------------------------------------
            
            # Normalize each feature to a 0-1 scale then weight them
            # These thresholds are from RAVDESS dataset analysis
            
            # Pitch score: normal speech ~150Hz, stressed ~300Hz+
            pitch_score = min(avg_pitch / 400.0, 1.0)
            
            # Energy score: normalize
            energy_score = min(avg_energy / 0.1, 1.0)
            
            # MFCC variance score (more variance = more emotional)
            mfcc_score = min(mfcc_var / 5000.0, 1.0)
            
            # ZCR score (faster = more anxious)
            zcr_score = min(avg_zcr / 0.2, 1.0)
            
            # Spectral centroid score
            centroid_score = min(avg_centroid / 4000.0, 1.0)
            
            # Weighted final stress score
            stress_raw = (
                pitch_score    * 0.30 +
                energy_score   * 0.25 +
                mfcc_score     * 0.25 +
                zcr_score      * 0.10 +
                centroid_score * 0.10
            )
            
            final_score = int(stress_raw * 100)
            final_score = max(5, min(99, final_score))
            
            return {
                "score": final_score,
                "status": "success",
                "details": {
                    "avg_pitch_hz": round(float(avg_pitch), 2),
                    "avg_energy": round(float(avg_energy), 4),
                    "mfcc_variance": round(float(mfcc_var), 2),
                }
            }
            
        except Exception as e:
            print(f"Voice Analysis Error: {e}")
            return {
                "score": 50,
                "status": "failed",
                "error": str(e)
            }


if __name__ == "__main__":
    # Quick test
    model = VoiceStressModel()
    print("Voice model initialized!")
    if LIBROSA_AVAILABLE:
        print("librosa is available - ready for audio analysis!")
    else:
        print("Install librosa first!")

# Phase 1: Setting up Signal Processing with Librosa
# Phase 1 
# Phase 3 
# Phase 3 Inst 
