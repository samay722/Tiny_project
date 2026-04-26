try:
    from transformers import pipeline
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False
    print("Warning: transformers library not found. Run: pip install transformers torch")

class NLPStressModel:
    def __init__(self):
        print("Loading Advanced Cognitive Syntax (HuggingFace NLP) Model...")
        if TRANSFORMERS_AVAILABLE:
            # Using a lightweight local emotion classifier
            # Downloads ~300MB on first run to local cache
            self.classifier = pipeline("text-classification", model="j-hartmann/emotion-english-distilroberta-base", top_k=None)
        else:
            self.classifier = None
        
    def predict(self, text):
        """
        Receives user text, outputs a 0-100 stress score based on multi-dimensional emotional state.
        """
        if not TRANSFORMERS_AVAILABLE:
            return {"score": 50, "status": "failed", "error": "Please run: pip install transformers torch"}
            
        try:
            raw_results = self.classifier(text)
            # Depending on transformers version, it returns a list of dicts, or list of lists of dicts
            results = raw_results[0] if isinstance(raw_results[0], list) else raw_results
            
            # results is a list of dicts: [{'label': 'anger', 'score': 0.1}, ...]
            emotions = {res['label']: res['score'] for res in results}
            
            # Stress mapping logic
            # High stress emotions: anger, disgust, fear, sadness
            # Low stress: joy, neutral, surprise
            
            stress_weight = (
                emotions.get('anger', 0) * 0.9 + 
                emotions.get('fear', 0) * 0.9 + 
                emotions.get('sadness', 0) * 0.7 + 
                emotions.get('disgust', 0) * 0.6
            )
            calm_weight = (
                emotions.get('joy', 0) * 0.8 + 
                emotions.get('neutral', 0) * 0.5 +
                emotions.get('surprise', 0) * 0.2
            )
            
            # Calculate raw score
            raw_score = stress_weight - calm_weight
            
            # Map raw_score (approx -0.8 to +0.9) to 0-100 scale
            # Baseline is around 40
            final_score = int(40 + (raw_score * 60))
            final_score = max(5, min(100, final_score))
            
            dominant_emotion = max(emotions, key=emotions.get)
            
            return {
                "score": final_score,
                "status": "success",
                "details": f"Dominant: {dominant_emotion.upper()} (Fear: {emotions.get('fear',0):.2f}, Anger: {emotions.get('anger',0):.2f})"
            }
            
        except Exception as e:
            print(f"NLP Error: {e}")
            return {
                "score": 50,
                "status": "failed",
                "error": str(e)
            }

