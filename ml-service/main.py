from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from transformers import pipeline
import uvicorn
import shutil
import os
from pydantic import BaseModel
from audio_processor import VoiceEmotionModel

app = FastAPI(title="AI Mental Health Support - ML Microservice")

# Allow CORS for the Node.js backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to Node.js backend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Model Initialization ---
print("Loading Text Emotion Model...")
try:
    # Using a DistilRoBERTa model fine-tuned for emotion recognition
    # Classes: anger, disgust, fear, joy, neutral, sadness, surprise
    text_emotion_pipeline = pipeline("text-classification", model="j-hartmann/emotion-english-distilroberta-base", return_all_scores=False)
    print("Text Emotion Model Loaded Successfully.")
except Exception as e:
    print(f"Error loading text model: {e}")
    text_emotion_pipeline = None

print("Loading Voice Emotion Model...")
voice_model = VoiceEmotionModel()

# --- Risk Detection Words ---
CRITICAL_WORDS = ["suicide", "kill", "die", "harm", "end it all", "hopeless", "worthless", "self-harm"]

class TextAnalyzeRequest(BaseModel):
    text: str

@app.get("/")
def read_root():
    return {"status": "ML Microservice is running"}

@app.post("/analyze/text")
def analyze_text(request: TextAnalyzeRequest):
    if not text_emotion_pipeline:
        raise HTTPException(status_code=500, detail="Text emotion model is not loaded.")
    
    text = request.text
    if not text:
        raise HTTPException(status_code=400, detail="Text is required.")

    # 1. Emotion Classification
    result = text_emotion_pipeline(text)[0]
    emotion = result['label']
    score = result['score']

    # Map to unified categories
    # j-hartmann model outputs: anger, disgust, fear, joy, neutral, sadness, surprise
    emotion_map = {'anger': 'angry', 'joy': 'happy', 'sadness': 'sad', 'fear': 'fearful', 'surprise': 'surprised', 'disgust': 'disgust', 'neutral': 'neutral'}
    emotion = emotion_map.get(emotion, emotion)
    # 2. Risk Detection
    is_high_risk = False
    text_lower = text.lower()
    for word in CRITICAL_WORDS:
        if word in text_lower:
            is_high_risk = True
            break
            
    # Additional risk logic: if emotion is extreme sadness or fear with high confidence
    if (emotion in ['sadness', 'fear', 'anger']) and score > 0.8:
        # Might flag as elevated risk
        pass # Let's stick to keyword for direct high_risk flag for now

    return {
        "emotion": emotion,
        "confidence": score,
        "is_high_risk": is_high_risk
    }

@app.post("/analyze/voice")
async def analyze_voice(file: UploadFile = File(...)):
    if not file.filename.endswith(('.wav', '.mp3', '.ogg', '.webm')):
         raise HTTPException(status_code=400, detail="Invalid file format. Please upload wav, mp3, ogg, or webm.")

    temp_file_path = f"temp_{file.filename}"
    try:
        # Save uploaded file temporarily
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Analyze emotion
        predicted_emotion, confidence = voice_model.predict_emotion(temp_file_path)
        
        if predicted_emotion == "error":
             raise HTTPException(status_code=500, detail="Error processing audio file.")

        return {
            "emotion": predicted_emotion,
            "confidence": confidence
        }
        
    finally:
        # Clean up temp file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
