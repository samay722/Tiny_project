from textblob import TextBlob

class NLPStressModel:
    def __init__(self):
        print("Loading Cognitive Syntax (NLP Sentiment) Model...")
        
    def predict(self, text):
        """
        Receives user text, outputs a 0-100 stress score based on sentiment and subjectivity.
        """
        try:
            # Analyze sentiment (-1.0 to 1.0)
            blob = TextBlob(text)
            polarity = blob.sentiment.polarity       # -1 to 1
            subjectivity = blob.sentiment.subjectivity # 0 to 1
            
            # Polarity mapping logic 
            # -1.0 (Very Negative) -> Should map to Highest Stress (95-100)
            #  0.0 (Neutral)       -> Mapped to Base Stress (~30-40)
            #  1.0 (Very Positive) -> Lowest Stress (5-10)
            
            stress_score = 35 - (polarity * 60)
            
            # Add intensity based on subjectivity (If you're negative and very subjective, it's personal anxiety)
            if polarity < 0:
                stress_score += (subjectivity * 15)
            # Reduce intensity if happily subjective
            elif polarity > 0:
                stress_score -= (subjectivity * 10)
                
            final_score = int(max(5, min(100, stress_score)))
            
            return {
                "score": final_score,
                "status": "success",
                "details": f"p: {polarity:.2f}, s: {subjectivity:.2f}"
            }
            
        except Exception as e:
            print(f"NLP Error: {e}")
            return {
                "score": 50,
                "status": "failed",
                "error": str(e)
            }

# Phase 1: Primary Sentiment Engine initialization

# Phase 1: Primary Sentiment Engine initialization

# Phase 1: Primary Sentiment Engine initialization
