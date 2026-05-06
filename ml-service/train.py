import os
import glob
import librosa
import numpy as np
from sklearn.model_selection import train_test_split
import tensorflow as tf
from audio_processor import VoiceEmotionModel

# --- Configuration ---
# Set this to the folder where you extracted the RAVDESS audio files
# Example: "C:/Users/apara/Downloads/Ravdess/audio_speech_actors_01-24/"
DATASET_PATH = "path_to_ravdess_dataset"
MODEL_SAVE_PATH = "voice_emotion_model.h5"

def extract_feature(file_name):
    """Extracts MFCC features for training (identical to inference)."""
    try:
        data, sample_rate = librosa.load(file_name, res_type='kaiser_fast', duration=2.5, sr=22050*2, offset=0.5)
        mfccs = librosa.feature.mfcc(y=data, sr=sample_rate, n_mfcc=40)
        mfccs = np.mean(mfccs.T, axis=0)
        return mfccs
    except Exception as e:
        print(f"Error encountered while parsing file: {file_name}")
        return None

def load_ravdess_data(dataset_path):
    """
    Loads and parses the RAVDESS dataset.
    RAVDESS filename format: Modality-VocalChannel-Emotion-EmotionalIntensity-Statement-Repetition-Actor.wav
    Emotion (3rd part): 01 = neutral, 02 = calm, 03 = happy, 04 = sad, 05 = angry, 06 = fearful, 07 = disgust, 08 = surprised
    """
    features = []
    labels = []
    
    # Check if directory exists
    if not os.path.exists(dataset_path) or dataset_path == "path_to_ravdess_dataset":
        print(f"ERROR: Please update DATASET_PATH in train.py to point to your actual RAVDESS folder.")
        return np.array([]), np.array([])

    print("Loading audio files...")
    
    # Iterate through all actor folders (Actor_01 to Actor_24)
    for actor_dir in os.listdir(dataset_path):
        actor_path = os.path.join(dataset_path, actor_dir)
        if not os.path.isdir(actor_path):
            continue
            
        # Iterate through audio files in actor folder
        for file in glob.glob(os.path.join(actor_path, "*.wav")):
            file_name = os.path.basename(file)
            
            # Extract emotion label from filename
            # e.g., 03-01-06-01-02-01-12.wav -> split('-')[2] -> '06'
            parts = file_name.split('-')
            if len(parts) >= 3:
                emotion_label = int(parts[2]) - 1 # Subtract 1 so labels are 0-7 instead of 1-8
                
                # Extract features
                feature = extract_feature(file)
                if feature is not None:
                    features.append(feature)
                    labels.append(emotion_label)

    print(f"Loaded {len(features)} valid audio files.")
    return np.array(features), np.array(labels)

def train_model():
    # 1. Load Data
    X, y = load_ravdess_data(DATASET_PATH)
    
    if len(X) == 0:
        print("Training aborted. No data found.")
        return

    # 2. Reshape features for CNN (samples, timesteps, channels)
    X = np.expand_dims(X, axis=2)

    # 3. Train/Test Split
    x_train, x_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # 4. Initialize and Compile Model
    print("Building model architecture...")
    voice_model_wrapper = VoiceEmotionModel(model_path=MODEL_SAVE_PATH)
    model = voice_model_wrapper._build_model() # We call _build_model directly for fresh training

    # 5. Train
    print("Starting training...")
    history = model.fit(
        x_train, y_train, 
        batch_size=32, 
        epochs=100, 
        validation_data=(x_test, y_test)
    )

    # 6. Evaluate
    loss, acc = model.evaluate(x_test, y_test)
    print(f"Test Accuracy: {acc*100:.2f}%")

    # 7. Save Weights
    model.save_weights(MODEL_SAVE_PATH)
    print(f"Model weights saved to {MODEL_SAVE_PATH}")
    print("You can now run the FastAPI server, and it will use these newly trained weights!")

if __name__ == "__main__":
    train_model()
