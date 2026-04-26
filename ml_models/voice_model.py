"""
Voice Stress Analysis Model
Uses MFCC (Mel-Frequency Cepstral Coefficients) extracted by librosa
to estimate stress from audio recordings.

Uses imageio-ffmpeg for bundled ffmpeg binary — converts .webm → .wav
before loading, since librosa/soundfile cannot decode .webm directly.
"""
import numpy as np
import os
import subprocess
import tempfile

# --- Bundled ffmpeg from imageio-ffmpeg ---
try:
    import imageio_ffmpeg
    FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()
    FFMPEG_AVAILABLE = True
except ImportError:
    FFMPEG_EXE = None
    FFMPEG_AVAILABLE = False
    print("  [Voice] imageio-ffmpeg not found. Run: pip install imageio-ffmpeg")

try:
    import librosa
    LIBROSA_AVAILABLE = True
except ImportError:
    LIBROSA_AVAILABLE = False
    print("librosa not found. Run: pip install librosa soundfile")


def convert_to_wav(input_path):
    """
    Convert any audio format (webm, ogg, mp4, etc.) to a temporary .wav file
    using the bundled ffmpeg binary. Returns the path to the temp wav file.
    """
    tmp = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
    tmp.close()
    wav_path = tmp.name

    result = subprocess.run(
        [FFMPEG_EXE, '-y', '-i', input_path, '-ar', '16000', '-ac', '1', wav_path],
        capture_output=True, text=True
    )

    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg conversion failed: {result.stderr[-300:]}")

    return wav_path


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

        if not FFMPEG_AVAILABLE:
            return {"score": 50, "status": "failed", "error": "imageio-ffmpeg not installed"}

        wav_path = None
        try:
            # Step 1: Convert input (webm/ogg/etc) → wav using bundled ffmpeg
            wav_path = convert_to_wav(audio_file_path)

            # Step 2: Load the converted wav with librosa
            y, sr = librosa.load(wav_path, sr=16000, mono=True)

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

            # Pitch score: normal speech ~150Hz, stressed ~300Hz+
            pitch_score    = min(avg_pitch / 400.0, 1.0)
            energy_score   = min(avg_energy / 0.1, 1.0)
            mfcc_score     = min(mfcc_var / 5000.0, 1.0)
            zcr_score      = min(avg_zcr / 0.2, 1.0)
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
                    "avg_pitch_hz":   round(float(avg_pitch), 2),
                    "avg_energy":     round(float(avg_energy), 4),
                    "mfcc_variance":  round(float(mfcc_var), 2),
                    "zcr":            round(float(avg_zcr), 4),
                }
            }

        except Exception as e:
            print(f"Voice Analysis Error: {e}")
            return {
                "score": 50,
                "status": "failed",
                "error": str(e)
            }
        finally:
            # Always clean up temp wav file
            if wav_path and os.path.exists(wav_path):
                try:
                    os.remove(wav_path)
                except Exception:
                    pass


if __name__ == "__main__":
    model = VoiceStressModel()
    print("Voice model initialized!")
    result = model.predict(r"c:\Users\Lenovo\Desktop\Tiny_project\temp_audio.webm")
    print("Test result:", result)
