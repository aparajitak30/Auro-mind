import os
import numpy as np
from sklearn.model_selection import train_test_split
from audio_processor import VoiceEmotionModel

# Set this to the path where you extracted the RAVDESS dataset
# Example: "C:/Users/apara/Downloads/ravdess-data/"
DATASET_PATH = "./ravdess"

def load_data(dataset_path):
    print("Loading dataset from:", dataset_path)
    X, y = [], []
    
    if not os.path.exists(dataset_path):
        print(f"Error: Dataset path '{dataset_path}' does not exist.")
        return np.array(X), np.array(y)
        
    model_instance = VoiceEmotionModel()
    
    # RAVDESS files are organized into Actor folders (e.g., Actor_01, Actor_02)
    # Inside these folders are .wav files.
    for root, dirs, files in os.walk(dataset_path):
        for file in files:
            if file.endswith(".wav"):
                # RAVDESS filename format: 03-01-05-01-01-01-01.wav
                # The 3rd part is the emotion (01=neutral, 02=calm, etc.)
                try:
                    file_path = os.path.join(root, file)
                    emotion_id = int(file.split("-")[2]) - 1 # Map 01-08 to 0-7
                    
                    # Extract MFCC features using the function already in our model class
                    feature = model_instance.extract_features(file_path)
                    
                    if feature is not None and not np.all(feature == 0):
                        X.append(feature)
                        y.append(emotion_id)
                except Exception as e:
                    print(f"Failed to process {file}: {e}")
                    
    return np.array(X), np.array(y)

if __name__ == "__main__":
    print("--- RAVDESS Model Training ---")
    
    # 1. Load Data
    X, y = load_data(DATASET_PATH)
    
    if len(X) == 0:
        print("No valid audio files found. Please ensure you downloaded the dataset and set DATASET_PATH correctly.")
        exit()
        
    print(f"Loaded {len(X)} samples.")
    
    # 2. Reshape for CNN (samples, timesteps, features)
    X = np.expand_dims(X, axis=2)
    
    # 3. Train/Test Split
    x_train, x_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # 4. Initialize and Train Model
    processor = VoiceEmotionModel()
    model = processor.model
    
    print("Starting training...")
    history = model.fit(x_train, y_train, batch_size=32, epochs=50, validation_data=(x_test, y_test))
    
    # 5. Evaluate and Save
    loss, acc = model.evaluate(x_test, y_test)
    print(f"\nTraining Complete! Test Accuracy: {acc * 100:.2f}%")
    
    model.save_weights("voice_emotion_model.weights.h5")
    print("Model weights successfully saved to 'voice_emotion_model.weights.h5'!")
    print("You can now restart your ml-service to use the real AI model.")
